export function flatten (array) {
  return array.reduce((acc, item) => acc.concat(item), [])
}

export function isPlainObject (value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

export function pick (object, keys) {
  const result = {}
  for (const key of keys) {
    const val = object[key]
    if (val !== undefined) {
      result[key] = val
    }
  }
  return result
}

export function uniq (values) {
  return values.reduce(
    (acc, value) => acc.includes(value) ? acc : [...acc, value],
    []
  )
}
