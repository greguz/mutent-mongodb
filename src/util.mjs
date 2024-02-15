const SYM_ORPHAN = Symbol.for('mutent-mongodb-orphan')

export function flagOrphan (doc) {
  doc[SYM_ORPHAN] = true
  return doc
}

export function isOrphaned (doc) {
  return SYM_ORPHAN in Object(doc)
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
