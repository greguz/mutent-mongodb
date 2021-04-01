import { buildUpdateQuery, compareValues } from './diff'
import {
  asCreateOptions,
  asDeleteOptions,
  asReadOptions,
  asUpdateOptions
} from './options'
import { stripUndefinedValues } from './undefined'

export class MongoAdapter {
  static create (collection, options) {
    return new MongoAdapter(collection, options)
  }

  constructor (collection, { relax, replace } = {}) {
    this.collection = collection
    this.relax = !!relax
    this.replace = !!replace
  }

  find (query, options) {
    return this.collection.findOne(query, asReadOptions(options))
  }

  filter (query, options) {
    return this.collection.find(query, asReadOptions(options))
  }

  async create (data, options) {
    const { ops } = await this.collection.insertOne(
      stripUndefinedValues(data),
      asCreateOptions(options)
    )
    return ops[0]
  }

  async update (oldData, newData, options) {
    if (this.replace) {
      const { matchedCount } = await this.collection.replaceOne(
        { _id: oldData._id },
        stripUndefinedValues(newData),
        asUpdateOptions(options)
      )
      if (matchedCount !== 1 && !this.relax) {
        throw new Error(`Expected update ack for document ${oldData._id}`)
      }
    } else {
      const items = compareValues(oldData, newData)
      if (items.length <= 0) {
        return newData
      }

      const { matchedCount } = await this.collection.updateOne(
        { _id: oldData._id },
        buildUpdateQuery(items),
        asUpdateOptions(options)
      )
      if (matchedCount !== 1 && !this.relax) {
        throw new Error(`Expected replace ack for document ${oldData._id}`)
      }
    }
  }

  async delete (data, options) {
    const { deletedCount } = await this.collection.deleteOne(
      { _id: data._id },
      asDeleteOptions(options)
    )
    if (deletedCount !== 1 && !this.relax) {
      throw new Error(`Expected delete ack for document ${data._id}`)
    }
  }
}
