import { CollectionInsertOneOptions, CommonOptions, FindOneOptions, UpdateOneOptions } from 'mongodb'

import pick from 'lodash/pick'

export type MongoOptions =
  & CollectionInsertOneOptions
  & CommonOptions
  & FindOneOptions
  & UpdateOneOptions

export function toCreateOptions (options: MongoOptions): CollectionInsertOneOptions {
  return pick(options, [
    'bypassDocumentValidation',
    'forceServerObjectId',
    'j',
    'serializeFunctions',
    'session',
    'w',
    'wtimeout'
  ])
}

export function toReadOptions (options: MongoOptions): FindOneOptions {
  return pick(options, [
    'limit',
    'sort',
    'projection',
    'fields',
    'skip',
    'hint',
    'explain',
    'snapshot',
    'timeout',
    'tailable',
    'batchSize',
    'returnKey',
    'maxScan',
    'min',
    'max',
    'showDiskLoc',
    'comment',
    'raw',
    'promoteLongs',
    'promoteValues',
    'promoteBuffers',
    'readPreference',
    'partial',
    'maxTimeMS',
    'collation',
    'session'
  ])
}

export function toUpdateOptions (options: MongoOptions): UpdateOneOptions {
  return pick(options, [
    'arrayFilters',
    'bypassDocumentValidation',
    'j',
    'session',
    'upsert',
    'w',
    'wtimeout'
  ])
}

export function toDeleteOptions (options: MongoOptions): CommonOptions {
  return pick(options, [
    'j',
    'session',
    'w',
    'wtimeout'
  ])
}
