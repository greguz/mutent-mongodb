/// <reference types="mutent" />
/// <reference types="mongodb" />

import { Reader, Writer } from 'mutent'
import { Collection, CollectionInsertOneOptions, CommonOptions, FilterQuery, FindOneOptions, UpdateOneOptions } from 'mongodb'

export declare type Options = CollectionInsertOneOptions & CommonOptions & FindOneOptions & UpdateOneOptions

export declare function toCreateOptions (options: Options): CollectionInsertOneOptions
export declare function toReadOptions (options: Options): FindOneOptions
export declare function toUpdateOptions (options: Options): UpdateOneOptions
export declare function toDeleteOptions (options: Options): CommonOptions

export interface ReaderSettings<T, Q = FilterQuery<T>> {
  collection: Collection<T>
  defaultOptions?: Options
  errorFactory?: (query: Q, options: Options) => Error
  queryMapper?: (query: Q) => FilterQuery<T>
}
export declare function createReader<T, Q> (settings: ReaderSettings<T, Q>): Reader<T, Q, Options>

export declare type MaybePromise<T> = Promise<T> | T
export interface WriterSettings<T> {
  collection: Collection<T>
  defaultOptions?: Options
  prepare?: (data: T) => MaybePromise<T>
  beforeCreate?: (data: T, options: Options) => MaybePromise<void>
  afterCreate?: (data: T, options: Options) => MaybePromise<void>
  beforeUpdate?: (oldData: T, newData: T, options: Options) => MaybePromise<void>
  afterUpdate?: (oldData: T, newData: T, options: Options) => MaybePromise<void>
  beforeDelete?: (data: T, options: Options) => MaybePromise<void>
  afterDelete?: (data: T, options: Options) => MaybePromise<void>
}
export declare function createWriter<T> (settings: WriterSettings<T>): Writer<T, Options>
