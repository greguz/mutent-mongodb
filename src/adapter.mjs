import {
  buildUpdateQuery,
  opDeleteOne,
  opInsertOne,
  opReplaceOne,
  opUpdateOne
} from './mql.mjs'
import { stripUndefinedValues } from './util.mjs'

export class MongoAdapter {
  get [Symbol.for('adapter-name')] () {
    return `MongoDB@${this.collection.dbName}:${this.collection.collectionName}`
  }

  constructor (options) {
    options = Object(options)
    this.collection = getCollection(options)
    this.replace = !!options.replace
    this.strictDelete = !!options.strictDelete
    this.strictUpdate = !!options.strictUpdate
  }

  find (query, options = {}) {
    return this.collection.findOne(query, options)
  }

  filter (query, options = {}) {
    return this.collection.find(query, options)
  }

  async create (data, options = {}) {
    const { insertedId } = await this.collection.insertOne(
      stripUndefinedValues(data),
      options
    )
    return {
      ...data,
      _id: insertedId
    }
  }

  async update (oldData, newData, options = {}) {
    const replace = typeof options.replace === 'boolean'
      ? options.replace
      : this.replace

    if (replace) {
      const { matchedCount, upsertedId } = await this.collection.replaceOne(
        { _id: oldData._id },
        stripUndefinedValues(newData),
        options
      )

      if (upsertedId) {
        return { ...newData, _id: upsertedId }
      } else if (this.strictUpdate && matchedCount < 1) {
        throw new Error(`Expected replace ack for document ${oldData._id}`)
      }
    } else {
      const update = buildUpdateQuery(oldData, newData)
      if (update) {
        const { matchedCount, upsertedId } = await this.collection.updateOne(
          { _id: oldData._id },
          update,
          options
        )

        if (upsertedId) {
          return { ...newData, _id: upsertedId }
        } else if (this.strictUpdate && matchedCount < 1) {
          throw new Error(`Expected update ack for document ${oldData._id}`)
        }
      }
    }
  }

  async delete (data, options = {}) {
    const { deletedCount } = await this.collection.deleteOne(
      { _id: data._id },
      options
    )
    if (deletedCount < 1 && this.strictDelete) {
      throw new Error(`Expected delete ack for document ${data._id}`)
    }
  }

  async bulk (actions, options = {}) {
    const map = new Map()
    const ops = []
    const replace = typeof options.replace === 'boolean'
      ? options.replace
      : this.replace

    let deletedExpect = 0
    let matchedExpect = 0

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i]

      let op
      if (action.type === 'CREATE') {
        op = opInsertOne(action, options)
      } else if (action.type === 'DELETE') {
        deletedExpect++
        op = opDeleteOne(action, options)
      } else if (replace) {
        matchedExpect++
        op = opReplaceOne(action, options)
      } else {
        matchedExpect++
        op = opUpdateOne(action, options)
      }

      if (op) {
        // Save mapping from Mutent action index to MongoDB bulk op index
        map.set(i, ops.length)
        ops.push(op)
      }
    }

    if (ops.length <= 0) {
      // no ops, no party
      return
    }

    const result = await this.collection.bulkWrite(ops, options)

    const deletedCount = result.deletedCount || 0
    if (this.strictDelete && deletedCount !== deletedExpect) {
      throw new Error('Some documents were not present during their deletion')
    }

    const matchedCount = (result.matchedCount || 0) + (result.upsertedCount || 0)
    if (this.strictUpdate && matchedCount !== matchedExpect) {
      throw new Error('Some documents were not present during their update')
    }

    const insertedIds = Object(result.insertedIds)
    const upsertedIds = Object(result.upsertedIds)

    return actions.map((action, sourceIndex) => {
      // Resolve the action's index to the bulk op's index
      const targetIndex = map.get(sourceIndex)

      // Retrieve action's final data
      const data = action.type === 'UPDATE' ? action.newData : action.data

      // Returns the entity's data
      if (targetIndex !== undefined) {
        if (insertedIds[targetIndex]) {
          return { ...data, _id: insertedIds[targetIndex] }
        } else if (upsertedIds[targetIndex]) {
          return { ...data, _id: upsertedIds[targetIndex] }
        }
      }

      return data
    })
  }
}

function getCollection ({ client, collection, collectionName, db, dbName }) {
  if (collection) {
    return collection
  } else if (db && collectionName) {
    return db.collection(collectionName)
  } else if (client && collectionName) {
    return client.db(dbName).collection(collectionName)
  } else {
    throw new Error('Unable to get a valid MongoDB collection')
  }
}
