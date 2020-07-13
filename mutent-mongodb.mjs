import flatten from 'lodash/flatten'
import isPlainObject from 'lodash/isPlainObject'
import pick from 'lodash/pick'
import set from 'lodash/set'
import uniq from 'lodash/uniq'

export function toCreateOptions (options) {
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

export function toReadOptions (options) {
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

export function toUpdateOptions (options) {
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

export function toDeleteOptions (options) {
  return pick(options, [
    'j',
    'session',
    'w',
    'wtimeout'
  ])
}

export function createReader (settings) {
  const { collection, defaultOptions, errorFactory, queryMapper } = settings

  return {
    Error: errorFactory,
    find (query, options) {
      return collection.findOne(
        queryMapper ? queryMapper(query) : query,
        toReadOptions({ ...defaultOptions, ...options })
      )
    },
    filter (query, options) {
      return collection.find(
        queryMapper ? queryMapper(query) : query,
        toReadOptions({ ...defaultOptions, ...options })
      )
    }
  }
}

function compareValues (oldValue, newValue, path = []) {
  if (oldValue === newValue) {
    return []
  } else if (isPlainObject(oldValue) && isPlainObject(newValue)) {
    return flatten(
      uniq(Object.keys(oldValue).concat(Object.keys(newValue))).map(key =>
        compareValues(oldValue[key], newValue[key], [...path, key])
      )
    )
  } else if (Array.isArray(oldValue) && Array.isArray(newValue)) {
    if (newValue.length === 0 || newValue.length < oldValue.length) {
      return [
        {
          path,
          oldValue,
          newValue
        }
      ]
    }

    const items = []

    const min = oldValue.length < newValue.length
      ? oldValue.length
      : newValue.length
    for (let i = 0; i < min; i++) {
      items.push(...compareValues(oldValue[i], newValue[i], [...path, i]))
    }

    const max = oldValue.length > newValue.length
      ? oldValue.length
      : newValue.length
    for (let i = min; i < max; i++) {
      items.push({
        path: [...path, i],
        oldValue: undefined,
        newValue: newValue[i]
      })
    }

    return items
  } else {
    return [
      {
        path,
        oldValue,
        newValue
      }
    ]
  }
}

function buildUpdateQuery (items) {
  return items.reduce((query, { path, newValue }) => {
    if (path[0] === '_id') {
      return query
    } else if (newValue === undefined) {
      return set(query, ['$unset', path.join('.')], '')
    } else {
      return set(query, ['$set', path.join('.')], newValue)
    }
  }, {})
}

export function createWriter (settings) {
  const {
    collection,
    defaultOptions,
    beforeCreate,
    beforeUpdate,
    beforeDelete
  } = settings

  return {
    async create (data, options) {
      if (beforeCreate) {
        data = await beforeCreate(data, options)
      }
      await collection.insertOne(
        data,
        toCreateOptions({ ...defaultOptions, ...options })
      )
      return data
    },
    async update (oldData, newData, options) {
      if (beforeUpdate) {
        newData = await beforeUpdate(newData, options)
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
    async delete (data, options) {
      if (beforeDelete) {
        await beforeDelete(data, options)
      }
      const result = await collection.deleteOne(
        { _id: data._id },
        toDeleteOptions({ ...defaultOptions, ...options })
      )
      const deletedCount = result.deletedCount || 0
      if (deletedCount <= 0) {
        throw new Error(`Expected to delete ${data._id} document`)
      }
    }
  }
}
