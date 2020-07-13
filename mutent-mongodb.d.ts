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

export interface WriterSettings<T> {
  collection: Collection<T>
  defaultOptions?: Options
  beforeCreate?: (data: T, options: Options) => Promise<T> | T
  beforeUpdate?: (data: T, options: Options) => Promise<T> | T
  beforeDelete?: (data: T, options: Options) => Promise<void> | void
}
export declare function createWriter<T> (settings: WriterSettings<T>): Writer<T, Options>
