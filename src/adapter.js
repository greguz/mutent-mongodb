import { buildUpdateQuery, compareValues } from './diff'
import { stripUndefinedValues } from './undefined'

function opInsertOne ({ data }) {
  return {
    insertOne: {
      document: stripUndefinedValues(data)
    }
  }
}

function opUpdateOne ({ oldData, newData }, { upsert }) {
  const items = compareValues(oldData, newData)
  if (items.length <= 0) {
    return null
  }
  return {
    updateOne: {
      filter: {
        _id: oldData._id
      },
      update: buildUpdateQuery(items),
      upsert
    }
  }
}

function opReplaceOne ({ oldData, newData }, { upsert }) {
  return {
    replaceOne: {
      filter: {
        _id: oldData._id
      },
      replacement: stripUndefinedValues(newData),
      upsert
    }
  }
}

function opDeleteOne ({ data }) {
  return {
    deleteOne: {
      filter: {
        _id: data._id
      }
    }
  }
}

function createBulkOperation (action, options, replace) {
  switch (action.type) {
    case 'CREATE':
      return opInsertOne(action, options)
    case 'UPDATE':
      return replace
        ? opReplaceOne(action, options)
        : opUpdateOne(action, options)
    case 'DELETE':
      return opDeleteOne(action, options)
  }
}

export class MongoAdapter {
  constructor (options) {
    const { collection, replace, strictDelete, strictUpdate } = Object(options)
    if (!collection) {
      throw new Error('Collection is mandatory')
    }
    this.collection = collection
    this.replace = !!replace
    this.strictDelete = !!strictDelete
    this.strictUpdate = !!strictUpdate
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
    if (this.replace) {
      const { matchedCount } = await this.collection.replaceOne(
        { _id: oldData._id },
        stripUndefinedValues(newData),
        options
      )
      if (matchedCount < 1 && this.strictUpdate) {
        throw new Error(`Expected replace ack for document ${oldData._id}`)
      }
    } else {
      const items = compareValues(oldData, newData)
      if (items.length > 0) {
        const { matchedCount } = await this.collection.updateOne(
          { _id: oldData._id },
          buildUpdateQuery(items),
          options
        )
        if (matchedCount < 1 && this.strictUpdate) {
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

    // Map Mutent actions to MongoDB bulk ops
    for (let index = 0; index < actions.length; index++) {
      const op = createBulkOperation(actions[index], options, this.replace)
      if (op) {
        map.set(index.toString(), ops.length.toString())
        ops.push(op)
      }
    }

    // Skip everything if no ops
    if (ops.length <= 0) {
      return
    }

    const result = await this.collection.bulkWrite(ops, options)

    const insertedIds = Object(result.insertedIds)
    const upsertedIds = Object(result.upsertedIds)

    return actions.map((action, sourceIndex) => {
      // Resolve the action's index to the bulk op's index
      const targetIndex = map.get(sourceIndex.toString())

      // Retrieve action's final data
      const data = action.type === 'UPDATE' ? action.newData : action.data

      // Returns the entity's data
      if (targetIndex) {
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
