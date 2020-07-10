import { Reader } from 'mutent'
import { FilterQuery } from 'mongodb'

import { MongoOptions, toReadOptions } from './options'
import { MongoSettings } from './settings'

export function createReader<T, Q = FilterQuery<T>> (
  settings: MongoSettings<T, Q>
): Reader<T, Q, MongoOptions> {
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
