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
  static create (collection, options) {
    return new MongoAdapter(collection, options)
  }

  constructor (collection, { relax, replace } = {}) {
    this.collection = collection
    this.relax = !!relax
    this.replace = !!replace
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
      if (matchedCount !== 1 && !this.relax) {
        throw new Error(`Expected update ack for document ${oldData._id}`)
      }
    } else {
      const items = compareValues(oldData, newData)
      if (items.length > 0) {
        const { matchedCount } = await this.collection.updateOne(
          { _id: oldData._id },
          buildUpdateQuery(items),
          options
        )
        if (matchedCount !== 1 && !this.relax) {
          throw new Error(`Expected replace ack for document ${oldData._id}`)
        }
      }
    }
  }

  async delete (data, options = {}) {
    const { deletedCount } = await this.collection.deleteOne(
      { _id: data._id },
      options
    )
    if (deletedCount !== 1 && !this.relax) {
      throw new Error(`Expected delete ack for document ${data._id}`)
    }
  }

  async bulk (actions, options = {}) {
    const ops = actions
      .map(action => createBulkOperation(action, options, this.replace))
      .filter(op => op !== null)

    const result = ops.length > 0
      ? await this.collection.bulkWrite(ops, options)
      : {}

    const insertedIds = result.insertedIds || {}
    const upsertedIds = result.upsertedIds || {}

    return actions.map((action, index) => {
      const data = action.type === 'UPDATE' ? action.newData : action.data
      if (insertedIds[index]) {
        return { ...data, _id: insertedIds[index] }
      } else if (upsertedIds[index]) {
        return { ...data, _id: upsertedIds[index] }
      } else {
        return data
      }
    })
  }
}
