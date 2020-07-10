import { Reader } from 'mutent'
import { Collection, FilterQuery } from 'mongodb'

import { Options, toReadOptions } from './options'

export interface ReaderSettings<T, Q = FilterQuery<T>> {
  collection: Collection<T>
  defaultOptions?: Options
  errorFactory?: (query: Q, options: Options) => Error
  queryMapper?: (query: Q) => FilterQuery<T>
}

export function createReader<T, Q> (
  settings: ReaderSettings<T, Q>
): Reader<T, Q, Options> {
  const { collection, defaultOptions, errorFactory, queryMapper } = settings

  return {
    Error: errorFactory,
    find (query, options) {
      return collection.findOne(
        queryMapper ? queryMapper(query) : query,
        toReadOptions({ ...defaultOptions, ...options }),
      )
    },
    filter (query, options) {
      return collection.find(
        queryMapper ? queryMapper(query) : query,
        toReadOptions({ ...defaultOptions, ...options }),
      )
    },
  }
}
