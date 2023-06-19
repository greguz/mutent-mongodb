import { isPlainObject, stripUndefinedValues, uniq } from './util.mjs'

function * iterateDifferences (oldValue, newValue, path = []) {
  if (oldValue === newValue) {
    // nothing to yield
  } else if (isPlainObject(oldValue) && isPlainObject(newValue)) {
    const keys = uniq(Object.keys(oldValue).concat(Object.keys(newValue)))
    for (const key of keys) {
      yield * iterateDifferences(oldValue[key], newValue[key], [...path, key])
    }
  } else if (Array.isArray(oldValue) && Array.isArray(newValue)) {
    if (newValue.length === 0 || newValue.length < oldValue.length) {
      // There is no (easy) way to "pull by index" with a single operator
      yield {
        path,
        value: newValue
      }
    } else {
      const min = Math.min(oldValue.length, newValue.length)
      for (let i = 0; i < min; i++) {
        yield * iterateDifferences(oldValue[i], newValue[i], [...path, i])
      }

      const max = Math.max(oldValue.length, newValue.length)
      for (let i = min; i < max; i++) {
        yield {
          path: [...path, i],
          value: newValue[i]
        }
      }
    }
  } else {
    yield {
      path,
      value: newValue
    }
  }
}

export function buildUpdateQuery (oldValue, newValue) {
  const update = {}

  for (const { path, value } of iterateDifferences(oldValue, newValue)) {
    if (!path.length) {
      throw new Error('Unexpected non-object document found')
    }

    // TODO: path escape?
    if (value === undefined) {
      if (!update.$unset) {
        update.$unset = {}
      }
      update.$unset[path.join('.')] = ''
    } else {
      if (!update.$set) {
        update.$set = {}
      }
      update.$set[path.join('.')] = stripUndefinedValues(value)
    }
  }

  if (update.$set || update.$unset) {
    return update
  }
}

export function opInsertOne ({ data }) {
  return {
    insertOne: {
      document: stripUndefinedValues(data)
    }
  }
}

export function opUpdateOne ({ oldData, newData }, { upsert }) {
  const update = buildUpdateQuery(oldData, newData)
  if (update) {
    return {
      updateOne: {
        filter: {
          _id: oldData._id
        },
        update,
        upsert
      }
    }
  }
}

export function opReplaceOne ({ oldData, newData }, { upsert }) {
  return {
    replaceOne: {
      filter: {
        _id: oldData._id
      },
      replacement: stripUndefinedValues(newData),
      upsert
    }
  }
}

export function opDeleteOne ({ data }) {
  return {
    deleteOne: {
      filter: {
        _id: data._id
      }
    }
  }
}
