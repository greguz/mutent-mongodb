import { buildUpdateQuery, compareValues } from './diff'
import {
  asCreateOptions,
  asDeleteOptions,
  asReadOptions,
  asUpdateOptions
} from './options'
import { isPlainObject } from './util'

function stripUndefinedValues (obj) {
  if (isPlainObject(obj)) {
    for (const key of Object.keys(obj)) {
      const val = obj[key]
      if (val === undefined) {
        delete obj[key]
      } else {
        stripUndefinedValues(val)
      }
    }
  } else if (Array.isArray(obj)) {
    obj.forEach(stripUndefinedValues)
  }

  return obj
}

export function createMongoAdapter (collection, settings = {}) {
  const { relax, replace } = settings

  return {
    find (query, options) {
      return collection.findOne(query, asReadOptions(options))
    },
    filter (query, options) {
      return collection.find(query, asReadOptions(options))
    },
    async create (data, options) {
      const { ops } = await collection.insertOne(
        stripUndefinedValues(data),
        asCreateOptions(options)
      )
      return ops[0]
    },
    async update (oldData, newData, options) {
      if (replace) {
        const { matchedCount } = await collection.replaceOne(
          { _id: oldData._id },
          stripUndefinedValues(newData),
          asUpdateOptions(options)
        )
        if (matchedCount !== 1 && !relax) {
          throw new Error(`Expected update ack for document ${oldData._id}`)
        }
      } else {
        const items = compareValues(oldData, newData)
        if (items.length <= 0) {
          return newData
        }

        const { matchedCount } = await collection.updateOne(
          { _id: oldData._id },
          buildUpdateQuery(items),
          asUpdateOptions(options)
        )
        if (matchedCount !== 1 && !relax) {
          throw new Error(`Expected replace ack for document ${oldData._id}`)
        }
      }
    },
    async delete (data, options) {
      const { deletedCount } = await collection.deleteOne(
        { _id: data._id },
        asDeleteOptions(options)
      )
      if (deletedCount !== 1 && !relax) {
        throw new Error(`Expected delete ack for document ${data._id}`)
      }
    }
  }
}
