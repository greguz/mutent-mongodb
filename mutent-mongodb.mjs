function setDeep (obj, k1, k2, value) {
  if (obj[k1] === undefined) {
    obj[k1] = {}
  }
  obj[k1][k2] = value
  return obj
}

function flatten (array) {
  return array.reduce((acc, item) => acc.concat(item), [])
}

function isPlainObject (value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function pick (object, keys) {
  const result = {}
  for (const key of keys) {
    const val = object[key]
    if (val !== undefined) {
      result[key] = val
    }
  }
  return result
}

function uniq (values) {
  return values.reduce(
    (acc, value) => acc.includes(value) ? acc : [...acc, value],
    []
  )
}

function asCreateOptions (options) {
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

function asReadOptions (options) {
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

function asUpdateOptions (options) {
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

function asDeleteOptions (options) {
  return pick(options, [
    'j',
    'session',
    'w',
    'wtimeout'
  ])
}

function stripUndefinedValues (obj) {
  if (isPlainObject(obj)) {
    for (const key of Object.keys(obj)) {
      const val = obj[key]
      if (val === undefined) {
        delete obj[key]
      } else {
        stripUndefinedValues(val)
      }
    }
  } else if (Array.isArray(obj)) {
    obj.forEach(stripUndefinedValues)
  }

  return obj
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

function buildUpdateQuery (items) {
  return items.reduce(
    (query, { path, newValue }) => {
      return newValue === undefined
        ? setDeep(query, '$unset', path.join('.'), '')
        : setDeep(query, '$set', path.join('.'), newValue)
    },
    {}
  )
}

export function createMongoAdapter (collection, settings = {}) {
  const { replace } = settings

  return {
    find (query, options) {
      return collection.findOne(query, asReadOptions(options))
    },
    filter (query, options) {
      return collection.find(query, asReadOptions(options))
    },
    async create (data, options) {
      await collection.insertOne(
        stripUndefinedValues(data),
        asCreateOptions(options)
      )
    },
    async update (oldData, newData, options) {
      if (replace) {
        const { matchedCount } = await collection.replaceOne(
          { _id: oldData._id },
          stripUndefinedValues(newData),
          asUpdateOptions(options)
        )
        if (matchedCount !== 1) {
          throw new Error(`Expected update ack for document ${oldData._id}`)
        }
      } else {
        const items = compareValues(oldData, newData)
        if (items.length <= 0) {
          return newData
        }

        const { matchedCount } = await collection.updateOne(
          { _id: oldData._id },
          buildUpdateQuery(items),
          asUpdateOptions(options)
        )
        if (matchedCount !== 1) {
          throw new Error(`Expected replace ack for document ${oldData._id}`)
        }
      }
    },
    async delete (data, options) {
      const { deletedCount } = await collection.deleteOne(
        { _id: data._id },
        asDeleteOptions(options)
      )
      if (deletedCount !== 1) {
        throw new Error(`Expected delete ack for document ${data._id}`)
      }
    }
  }
}
