import { Collection, FilterQuery } from 'mongodb'

import { MongoOptions } from './options'

export interface MongoSettings<T, Q = FilterQuery<T>> {
  beforeCreate?: (data: T) => Promise<T> | T
  beforeUpdate?: (data: T) => Promise<T> | T
  collection: Collection<T>
  defaultOptions?: MongoOptions
  errorFactory?: (query: Q, options: MongoOptions) => Error
  queryMapper?: (query: Q) => FilterQuery<T>
}
