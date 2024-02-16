import { isPlainObject, stripUndefinedValues, uniq } from './util.mjs'

export function buildUpdateQuery (oldValue, newValue) {
  const query = {}

  for (const obj of iterateDifferences(oldValue, newValue)) {
    if (obj.op === '$unset') {
      if (!query.$unset) {
        query.$unset = {}
      }
      query.$unset[obj.key] = obj.value
    } else {
      if (!query.$set) {
        query.$set = {}
      }
      query.$set[obj.key] = obj.value
    }
  }

  if (query.$set || query.$unset) {
    return query
  } else {
    return null
  }
}

function * iterateDifferences (oldValue, newValue, path = []) {
  if (oldValue === newValue) {
    // nothing to yield
  } else if (isPlainObject(oldValue) && isPlainObject(newValue)) {
    const keys = uniq(Object.keys(oldValue).concat(Object.keys(newValue)))

    for (const key of keys) {
      if (key[0] === '.' || key[0] === '$') {
        // https://www.mongodb.com/docs/manual/core/dot-dollar-considerations/#updates-using-aggregation-pipelines
        throw new Error('Field names with Periods (.) and Dollars ($) are unsupported')
      }

      yield * iterateDifferences(oldValue[key], newValue[key], [...path, key])
    }
  } else if (Array.isArray(oldValue) && Array.isArray(newValue)) {
    if (newValue.length === 0 || newValue.length < oldValue.length) {
      // There is no way to "pull by index" with a single operator
      yield {
        op: '$set',
        key: path.join('.'),
        value: stripUndefinedValues(newValue)
      }
    } else {
      const min = Math.min(oldValue.length, newValue.length)
      for (let i = 0; i < min; i++) {
        yield * iterateDifferences(oldValue[i], newValue[i], [...path, i])
      }

      const max = Math.max(oldValue.length, newValue.length)
      for (let i = min; i < max; i++) {
        yield {
          op: '$set',
          key: path.join('.') + '.' + i,
          value: stripUndefinedValues(newValue[i])
        }
      }
    }
  } else if (newValue === undefined) {
    // when path is empty the root "document" is not an object
    if (path.length > 0) {
      yield {
        op: '$unset',
        key: path.join('.'),
        value: ''
      }
    }
  } else {
    // when path is empty the root "document" is not an object
    if (path.length > 0) {
      yield {
        op: '$set',
        key: path.join('.'),
        value: stripUndefinedValues(newValue)
      }
    }
  }
}
