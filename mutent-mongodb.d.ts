/// <reference types="mutent" />
/// <reference types="mongodb" />

import { Adapter } from 'mutent'
import { Collection, CollectionInsertOneOptions, CommonOptions, FilterQuery, FindOneOptions, UpdateOneOptions } from 'mongodb'

export declare type Options = CollectionInsertOneOptions & CommonOptions & FindOneOptions<any> & UpdateOneOptions

export interface Settings {
  replace?: boolean
}

export declare function createMongoAdapter<T> (
  collection: Collection<T>,
  settings?: Settings
): Adapter<T, FilterQuery<T>, Options>
