import { Writer } from 'mutent'

import flatten from 'lodash/flatten'
import isPlainObject from 'lodash/isPlainObject'
import set from 'lodash/set'
import uniq from 'lodash/uniq'

import { MongoOptions, toCreateOptions, toDeleteOptions, toUpdateOptions } from './options'
import { MongoSettings } from './settings'

type Path = Array<string | number>

interface Item {
  path: Path
  oldValue: any
  newValue: any
}

function compareValues(oldValue: any, newValue: any, path: Path = []): Item[] {
  if (oldValue === newValue) {
    return []
  } else if (isPlainObject(oldValue) && isPlainObject(newValue)) {
    return flatten(
      uniq(Object.keys(oldValue).concat(Object.keys(newValue))).map(key =>
        compareValues(oldValue[key], newValue[key], [...path, key]),
      ),
    )
  } else if (Array.isArray(oldValue) && Array.isArray(newValue)) {
    if (newValue.length === 0 || newValue.length < oldValue.length) {
      return [
        {
          path,
          oldValue,
          newValue,
        },
      ]
    }

    const items: Item[] = []

    const min = oldValue.length < newValue.length ? oldValue.length : newValue.length
    for (let i = 0; i < min; i++) {
      items.push(...compareValues(oldValue[i], newValue[i], [...path, i]))
    }

    const max = oldValue.length > newValue.length ? oldValue.length : newValue.length
    for (let i = min; i < max; i++) {
      items.push({
        path: [...path, i],
        oldValue: undefined,
        newValue: newValue[i],
      })
    }

    return items
  } else {
    return [
      {
        path,
        oldValue,
        newValue,
      },
    ]
  }
}

function buildUpdateQuery(items: Item[]): any {
  return items.reduce<any>((query, { path, newValue }) => {
    if (path[0] === '_id') {
      return query
    } else if (newValue === undefined) {
      return set(query, ['$unset', path.join('.')], '')
    } else {
      return set(query, ['$set', path.join('.')], newValue)
    }
  }, {})
}

export function createWriter<T> (
  settings: MongoSettings<T>
): Writer<T, MongoOptions> {
  const { beforeCreate, beforeUpdate, collection, defaultOptions } = settings

  return {
    async create (data: any, options) {
      if (beforeCreate) {
        data = await beforeCreate(data)
      }
      await collection.insertOne(
        data,
        toCreateOptions({ ...defaultOptions, ...options })
      )
      return data
    },
    async update (oldData: any, newData, options) {
      if (beforeUpdate) {
        newData = await beforeUpdate(newData)
      }
      const items = compareValues(oldData, newData)
      if (items.length > 0) {
        const { matchedCount } = await collection.updateOne(
          { _id: oldData._id },
          buildUpdateQuery(items),
          toUpdateOptions({ ...defaultOptions, ...options })
        )
        if (matchedCount <= 0) {
          throw new Error(`Expected to update ${oldData._id} document`)
        }
      }
      return newData
    },
    async delete (data: any, options) {
      const result = await collection.deleteOne(
        { _id: data._id },
        toDeleteOptions({ ...defaultOptions, ...options })
      )
      const deletedCount = result.deletedCount || 0
      if (deletedCount <= 0) {
        throw new Error(`Expected to delete ${data._id} document`)
      }
    },
  }
}
