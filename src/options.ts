import { CollectionInsertOneOptions, CommonOptions, FindOneOptions, UpdateOneOptions } from 'mongodb'

import pick from 'lodash/pick'

export type Options =
  & CollectionInsertOneOptions
  & CommonOptions
  & FindOneOptions
  & UpdateOneOptions

export function toCreateOptions (options: Options): CollectionInsertOneOptions {
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

export function toReadOptions (options: Options): FindOneOptions {
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

export function toUpdateOptions (options: Options): UpdateOneOptions {
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

export function toDeleteOptions (options: Options): CommonOptions {
  return pick(options, [
    'j',
    'session',
    'w',
    'wtimeout'
  ])
}
