function set (object, path, value) {
  let subject = object
  for (let i = 0; i < path.length; i++) {
    const key = path[i]
    if (i >= path.length - 1) {
      if (subject[key] !== value) {
        subject[key] = value
      }
    } else {
      if (subject[key] === undefined) {
        subject[key] = {}
      }
      subject = subject[key]
    }
  }
  return object
}

function flatten (array) {
  return array.reduce((acc, item) => acc.concat(item), [])
}

function isPlainObject (value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function pick (object, keys) {
  return keys.reduce((acc, key) => set(acc, [key], object[key]), {})
}

function uniq (values) {
  return values.reduce(
    (acc, value) => acc.includes(value) ? acc : [...acc, value],
    []
  )
}

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
  if (oldValue === newValue || path[0] === '_id') {
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

function omitUndefinedProperties (value) {
  if (isPlainObject(value)) {
    return Object.keys(value).reduce(
      (acc, key) => {
        const val = value[key]
        if (val !== undefined) {
          acc[key] = omitUndefinedProperties(val)
        }
        return acc
      },
      {}
    )
  } else if (Array.isArray(value)) {
    return value.map(omitUndefinedProperties)
  } else {
    return value
  }
}

function buildUpdateQuery (items) {
  return items.reduce(
    (query, { path, newValue }) => {
      return newValue === undefined
        ? set(query, ['$unset', path.join('.')], '')
        : set(query, ['$set', path.join('.')], newValue)
    },
    {}
  )
}

export function createWriter (settings) {
  const {
    collection,
    defaultOptions,
    prepare,
    beforeCreate,
    beforeUpdate,
    beforeDelete,
    afterCreate,
    afterUpdate,
    afterDelete
  } = settings

  return {
    async create (data, options) {
      if (prepare) {
        data = await prepare(data)
      }
      if (beforeCreate) {
        await beforeCreate(data, options)
      }
      await collection.insertOne(
        omitUndefinedProperties(data),
        toCreateOptions({ ...defaultOptions, ...options })
      )
      if (afterCreate) {
        await afterCreate(data, options)
      }
      return data
    },
    async update (oldData, newData, options) {
      if (prepare) {
        newData = await prepare(newData)
      }
      const items = compareValues(oldData, newData)
      if (items.length <= 0) {
        return newData
      }
      if (beforeUpdate) {
        await beforeUpdate(oldData, newData, options)
      }
      const { matchedCount } = await collection.updateOne(
        { _id: oldData._id },
        buildUpdateQuery(items),
        toUpdateOptions({ ...defaultOptions, ...options })
      )
      if (matchedCount <= 0) {
        throw new Error(`Expected to update ${oldData._id} document`)
      }
      if (afterUpdate) {
        await afterUpdate(oldData, newData, options)
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
      if (afterDelete) {
        await afterDelete(data, options)
      }
    }
  }
}
