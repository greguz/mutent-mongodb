import { MutentError } from 'mutent'

import { buildUpdateQuery } from './mql.mjs'
import { flagOrphan, stripUndefinedValues } from './util.mjs'

export { isOrphaned } from './util.mjs'

export class MongoAdapter {
  get [Symbol.for('adapter-name')] () {
    return `MongoDB@${this.collection.dbName}:${this.collection.collectionName}`
  }

  constructor (options = {}) {
    this.collection = getCollection(options)

    this.filterQuery = options.filterQuery || defaultById
    this.matchDeletes = !!options.matchDeletes
    this.matchUpdates = !!options.matchUpdates
    this.updateMode = options.updateMode || 'AUTO'
  }

  find (query, options) {
    return this.collection.findOne(query, options)
  }

  filter (query, options) {
    return this.collection.find(query, options)
  }

  async createEntity (entity, ctx) {
    const { insertedId } = await this.collection.insertOne(
      stripUndefinedValues(entity.target),
      ctx.options
    )

    entity.target._id = insertedId
  }

  /**
   * Returns `true` when the "diff update" method is safe to use.
   */
  canDiffDocuments (entity, ctx) {
    let updateMode = this.updateMode || 'AUTO'
    if (updateMode === 'AUTO') {
      if (
        entity.source !== entity.target &&
        (ctx.options.session || this.filterQuery !== defaultById)
      ) {
        // Entity's source and target must be different.
        // Also we should avoid non-atomic writes if possible.
        // Transactions are ok (check for `options.session` property),
        // but we can _suppose_ that if the default `filterQuery` generator
        // was customized, the User _should_ have handled the "atomic" write
        // problem somehow... (not a silver bullet)
        updateMode = 'DIFF'
      } else {
        updateMode = 'REPLACE'
      }
    }
    if (updateMode !== 'DIFF') {
      return false
    }
    return entity.source !== entity.target
  }

  /**
   *
   */
  async updateEntity (entity, ctx) {
    const filterQuery = this.filterQuery(entity, ctx)

    if (this.canDiffDocuments(entity, ctx)) {
      const updateQuery = buildUpdateQuery(entity.source, entity.target)
      if (updateQuery) {
        const { matchedCount, upsertedId } = await this.collection.updateOne(
          filterQuery,
          updateQuery,
          ctx.options
        )

        if (upsertedId) {
          entity.target._id = upsertedId
        } else if (matchedCount < 1) {
          if (this.matchUpdates) {
            throw new MutentError(
              'MONGODB_UNMATCHED_UPDATE',
              'An update request has not matched any Document',
              {
                adapter: this[Symbol.for('adapter-name')],
                documentId: entity.source._id,
                filterQuery
              }
            )
          } else {
            flagOrphan(entity.target)
          }
        }
      }
    } else {
      const { matchedCount, upsertedId } = await this.collection.replaceOne(
        filterQuery,
        stripUndefinedValues(entity.target),
        ctx.options
      )

      if (upsertedId) {
        entity.target._id = upsertedId
      } else if (matchedCount < 1) {
        if (this.matchUpdates) {
          throw new MutentError(
            'MONGODB_UNMATCHED_UPDATE',
            'An update request has not matched any Document',
            {
              adapter: this[Symbol.for('adapter-name')],
              documentId: entity.source._id,
              filterQuery
            }
          )
        } else {
          flagOrphan(entity.target)
        }
      }
    }
  }

  /**
   *
   */
  async deleteEntity (entity, ctx) {
    const filterQuery = this.filterQuery(entity, ctx)

    const { deletedCount } = await this.collection.deleteOne(
      filterQuery,
      ctx.options
    )

    if (deletedCount < 1) {
      if (this.matchDeletes) {
        throw new MutentError(
          'MONGODB_UNMATCHED_DELETE',
          'A delete request has not matched any Document',
          {
            adapter: this[Symbol.for('adapter-name')],
            documentId: entity.source._id,
            filterQuery
          }
        )
      } else {
        flagOrphan(entity.target)
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
        if (this.canDiffDocuments(entity, ctx)) {
          const updateQuery = buildUpdateQuery(entity.source, entity.target)
          if (updateQuery) {
            expectedUpdations++

            queue.push({
              entity,
              op: {
                updateOne: {
                  filter: this.filterQuery(entity, ctx),
                  update: updateQuery,
                  upsert: ctx.options.upsert === true
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
              filter: this.filterQuery(entity, ctx)
            }
          }
        })
      }
    }

    // Queue can be empty because of "diff" mode (different document, same properties)
    if (queue.length <= 0) {
      return
    }

    // All result fields are nullable (null or undefined)
    const result = await this.collection.bulkWrite(
      queue.map(obj => obj.op),
      ctx.options
    )

    const deletedCount = result.deletedCount || 0
    const matchedCount = result.matchedCount || 0
    const upsertedCount = result.upsertedCount || 0

    const insertedIds = result.insertedIds || {}
    const upsertedIds = result.upsertedIds || {}

    if (
      this.matchUpdates &&
      expectedUpdations !== (matchedCount + upsertedCount)
    ) {
      throw new MutentError(
        'MONGODB_UNMATCHED_UPDATE',
        'A bulk delete request has not match some Documents',
        {
          adapter: this[Symbol.for('adapter-name')],
          matchedCount,
          upsertedCount,
          expectedUpdations
        }
      )
    }

    if (this.matchDeletes && expectedDeletions !== deletedCount) {
      throw new MutentError(
        'MONGODB_UNMATCHED_DELETE',
        'A bulk update request has not match some Documents',
        {
          adapter: this[Symbol.for('adapter-name')],
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
function defaultById (entity) {
  const doc = entity.source
  if (typeof doc !== 'object' || doc === null) {
    throw new TypeError('Expected a MongoDB document object')
  }
  if (doc._id === null || doc._id === undefined) {
    throw new Error('Expected a document identifier')
  }
  return { _id: doc._id }
}
