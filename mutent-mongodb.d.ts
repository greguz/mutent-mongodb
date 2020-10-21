/// <reference types="mutent" />
/// <reference types="mongodb" />

import { Driver } from 'mutent'
import { Collection, CollectionInsertOneOptions, CommonOptions, FilterQuery, FindOneOptions, UpdateOneOptions } from 'mongodb'

export declare type Options = CollectionInsertOneOptions & CommonOptions & FindOneOptions<any> & UpdateOneOptions

export declare function toCreateOptions (options: Options): CollectionInsertOneOptions
export declare function toReadOptions (options: Options): FindOneOptions<any>
export declare function toUpdateOptions (options: Options): UpdateOneOptions
export declare function toDeleteOptions (options: Options): CommonOptions

export declare type MaybePromise<T> = Promise<T> | T
export interface Settings<T> {
  defaultOptions?: Options
  errorFactory?: (query: FilterQuery<T>, options: Options) => Error
  prepareDocument?: (data: T, options: Options) => T
  prepareFilter?: (query: FilterQuery<T>, options: Options) => FilterQuery<T>
  beforeCreate?: (data: T, options: Options) => MaybePromise<void>
  afterCreate?: (data: T, options: Options) => MaybePromise<void>
  beforeUpdate?: (oldData: T, newData: T, options: Options) => MaybePromise<void>
  afterUpdate?: (oldData: T, newData: T, options: Options) => MaybePromise<void>
  beforeDelete?: (data: T, options: Options) => MaybePromise<void>
  afterDelete?: (data: T, options: Options) => MaybePromise<void>
}
export declare function createDriver<T> (
  collection: Collection<T>,
  settings?: Settings<T>
): Driver<T, FilterQuery<T>, Options>
