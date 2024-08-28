import { ObjectId } from 'mongodb'
import { MutentError } from 'mutent'

import { buildUpdateQuery } from './lib/mql.mjs'
import { stripUndefinedValues } from './lib/util.mjs'

export default class MongoAdapter {
  get [Symbol.for('adapter-name')] () {
    return `MongoDB@${this.raw.dbName}:${this.raw.collectionName}`
  }

  constructor (options = {}) {
    this.raw = getCollection(options)

    this.filterQuery = beFunction(options.filterQuery || filterById)
    this.diffDocuments = beFunction(wrapBoolean(options.diffDocuments || false))

    this.allowLostUpdates = !!options.allowLostUpdates
    this.allowLostDeletes = !!options.allowLostDeletes
  }

  findEntity (query, ctx) {
    return this.raw.findOne(query, ctx.options)
  }

  filterEntities (query, ctx) {
    return this.raw.find(query, ctx.options)
  }

  async createEntity (entity, ctx) {
    const { insertedId } = await this.raw.insertOne(
      stripUndefinedValues(entity.target),
      ctx.options
    )

    entity.target._id = insertedId
  }

  async updateEntity (entity, ctx) {
    const filterQuery = this.filterQuery(entity, ctx)

    let result = null
    if (this.diffDocuments(entity, ctx)) {
      const updateQuery = buildUpdateQuery(entity.source, entity.target)
      if (updateQuery) {
        result = await this.raw.updateOne(
          filterQuery,
          updateQuery,
          ctx.options
        )
      }
    } else {
      result = await this.raw.replaceOne(
        filterQuery,
        stripUndefinedValues(entity.target),
        ctx.options
      )
    }

    if (result) {
      const { matchedCount, upsertedId } = result

      if (upsertedId) {
        entity.target._id = upsertedId
      } else if (!matchedCount) {
        if (this.allowLostUpdates) {
          flagOrphan(entity)
        } else {
          throw new MutentError(
            'MONGODB_LOST_UPDATE',
            'An update request has not matched any Document',
            {
              dbName: this.raw.dbName,
              collectionName: this.raw.collectionName,
              filterQuery,
              document: entity.source
            }
          )
        }
      }
    }
  }

  async deleteEntity (entity, ctx) {
    const filterQuery = this.filterQuery(entity, ctx)

    const { deletedCount } = await this.raw.deleteOne(
      filterQuery,
      ctx.options
    )

    if (!deletedCount) {
      if (this.allowLostDeletes) {
        flagOrphan(entity)
      } else {
        throw new MutentError(
          'MONGODB_LOST_DELETE',
          'A delete request has not matched any Document',
          {
            dbName: this.raw.dbName,
            collectionName: this.raw.collectionName,
            filterQuery,
            document: entity.source
          }
        )
      }
    }
  }

  async bulkEntities (entities, ctx) {
    // Valid write ops queue
    const queue = []

    // Counts
    let expectedDeletions = 0
    let expectedUpdations = 0

    for (const entity of entities) {
      if (entity.shouldCreate) {
        queue.push({
          entity,
          op: {
            insertOne: {
              document: stripUndefinedValues(entity.target)
            }
          }
        })
      } else if (entity.shouldUpdate) {
        if (this.diffDocuments(entity, ctx)) {
          const updateQuery = buildUpdateQuery(entity.source, entity.target)
          if (updateQuery) {
            expectedUpdations++

            queue.push({
              entity,
              op: {
                updateOne: {
                  filter: this.filterQuery(entity, ctx),
                  update: updateQuery,
                  collation: ctx.options.collation,
                  hint: ctx.options.hint,
                  upsert: ctx.options.upsert
                }
              }
            })
          }
        } else {
          expectedUpdations++

          queue.push({
            entity,
            op: {
              replaceOne: {
                filter: this.filterQuery(entity, ctx),
                replacement: stripUndefinedValues(entity.target),
                collation: ctx.options.collation,
                hint: ctx.options.hint,
                upsert: ctx.options.upsert
              }
            }
          })
        }
      } else if (entity.shouldDelete) {
        expectedDeletions++

        queue.push({
          entity,
          op: {
            deleteOne: {
              filter: this.filterQuery(entity, ctx),
              collation: ctx.options.collation,
              hint: ctx.options.hint
            }
          }
        })
      }
    }

    // Queue can be empty because of "diff" mode (different document, same properties)
    if (!queue.length) {
      return
    }

    // All result fields are nullable (null or undefined)
    const result = await this.raw.bulkWrite(
      queue.map(obj => obj.op),
      ctx.options
    )

    const deletedCount = result.deletedCount || 0
    const matchedCount = result.matchedCount || 0
    const upsertedCount = result.upsertedCount || 0

    const insertedIds = result.insertedIds || {}
    const upsertedIds = result.upsertedIds || {}

    if (!this.allowLostUpdates && expectedUpdations !== (matchedCount + upsertedCount)) {
      throw new MutentError(
        'MONGODB_LOST_UPDATES',
        'A bulk delete request has not match some Documents',
        {
          dbName: this.raw.dbName,
          collectionName: this.raw.collectionName,
          matchedCount,
          upsertedCount,
          expectedUpdations
        }
      )
    }

    if (!this.allowLostDeletes && expectedDeletions !== deletedCount) {
      throw new MutentError(
        'MONGODB_LOST_DELETES',
        'A bulk update request has not match some Documents',
        {
          dbName: this.raw.dbName,
          collectionName: this.raw.collectionName,
          deletedCount,
          expectedDeletions
        }
      )
    }

    for (let i = 0; i < queue.length; i++) {
      if (insertedIds[i]) {
        queue[i].entity.target._id = insertedIds[i]
      } else if (upsertedIds[i]) {
        queue[i].entity.target._id = upsertedIds[i]
      }
    }
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

/**
 * Default filter query compiler.
 */
function filterById (entity) {
  const doc = entity.source
  if (typeof doc !== 'object' || doc === null) {
    throw new TypeError('Expected a MongoDB document object')
  }

  // Fallback to a random ID to avoid "pick first random document"
  return doc._id === null || doc._id === undefined
    ? { _id: new ObjectId() }
    : { _id: doc._id }
}

/**
 * Uses well-known meta "orphan" field.
 */
function flagOrphan (entity) {
  entity.meta.orphan = true
}

function beFunction (value) {
  if (typeof value !== 'function') {
    throw new TypeError('Expected function value')
  }
  return value.bind(null)
}

function wrapBoolean (value) {
  return typeof value === 'boolean'
    ? () => value
    : value
}
