import { flatten, isPlainObject, uniq } from './util'

function setDeep (obj, k1, k2, value) {
  if (obj[k1] === undefined) {
    obj[k1] = {}
  }
  obj[k1][k2] = value
  return obj
}

export function compareValues (oldValue, newValue, path = []) {
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

export function buildUpdateQuery (items) {
  return items.reduce(
    (query, { path, newValue }) => {
      return newValue === undefined
        ? setDeep(query, '$unset', path.join('.'), '')
        : setDeep(query, '$set', path.join('.'), newValue)
    },
    {}
  )
}
