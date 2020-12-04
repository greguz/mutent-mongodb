/// <reference types="mutent" />
/// <reference types="mongodb" />

import { Adapter } from 'mutent'
import { Collection, CollectionInsertOneOptions, CommonOptions, FilterQuery, FindOneOptions, UpdateOneOptions } from 'mongodb'

export declare type Options<T = any> = CollectionInsertOneOptions & CommonOptions & FindOneOptions<T> & UpdateOneOptions

export interface Settings {
  relax?: boolean
  replace?: boolean
}

export declare function createMongoAdapter<T> (
  collection: Collection<T>,
  settings?: Settings
): Adapter<T, FilterQuery<T>, Options<T>>
