export function isPlainObject (value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

export function uniq (values) {
  return values.reduce(
    (acc, value) => acc.includes(value) ? acc : [...acc, value],
    []
  )
}

export function stripUndefinedValues (obj) {
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
