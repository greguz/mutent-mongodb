export function flatten (array) {
  return array.reduce((acc, item) => acc.concat(item), [])
}

export function isPlainObject (value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

export function uniq (values) {
  return values.reduce(
    (acc, value) => acc.includes(value) ? acc : [...acc, value],
    []
  )
}
