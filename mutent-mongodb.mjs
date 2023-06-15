function flatten (array) {
  return array.reduce((acc, item) => acc.concat(item), [])
}

function isPlainObject (value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function uniq (values) {
  return values.reduce(
    (acc, value) => acc.includes(value) ? acc : [...acc, value],
    []
  )
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

function setDeep (obj, k1, k2, value) {
  if (obj[k1] === undefined) {
    obj[k1] = {}
  }
  obj[k1][k2] = value
  return obj
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
  return items.reduce(
    (query, { path, newValue }) => {
      return newValue === undefined
        ? setDeep(query, '$unset', path.join('.'), '')
        : setDeep(query, '$set', path.join('.'), stripUndefinedValues(newValue))
    },
    {}
  )
}

function opInsertOne ({ data }) {
  return {
    insertOne: {
      document: stripUndefinedValues(data)
    }
  }
}

function opUpdateOne ({ oldData, newData }, { upsert }) {
  const items = compareValues(oldData, newData)
  if (items.length <= 0) {
    return null
  }
  return {
    updateOne: {
      filter: {
        _id: oldData._id
      },
      update: buildUpdateQuery(items),
      upsert
    }
  }
}

function opReplaceOne ({ oldData, newData }, { upsert }) {
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

function opDeleteOne ({ data }) {
  return {
    deleteOne: {
      filter: {
        _id: data._id
      }
    }
  }
}

function createBulkOperation (action, options, replace) {
  switch (action.type) {
    case 'CREATE':
      return opInsertOne(action, options)
    case 'UPDATE':
      return replace
        ? opReplaceOne(action, options)
        : opUpdateOne(action, options)
    case 'DELETE':
      return opDeleteOne(action, options)
  }
}

export class MongoAdapter {
  get [Symbol.for('adapter-name')] () {
    return `MongoDB@${this.collection.dbName}:${this.collection.collectionName}`
  }

  constructor (options) {
    options = Object(options)
    this.collection = getCollection(options)
    this.replace = !!options.replace
    this.strictDelete = !!options.strictDelete
    this.strictUpdate = !!options.strictUpdate
  }

  find (query, options = {}) {
    return this.collection.findOne(query, options)
  }

  filter (query, options = {}) {
    return this.collection.find(query, options)
  }

  async create (data, options = {}) {
    const { insertedId } = await this.collection.insertOne(
      stripUndefinedValues(data),
      options
    )
    return {
      ...data,
      _id: insertedId
    }
  }

  async update (oldData, newData, options = {}) {
    if (this.replace) {
      const { matchedCount } = await this.collection.replaceOne(
        { _id: oldData._id },
        stripUndefinedValues(newData),
        options
      )
      if (matchedCount < 1 && this.strictUpdate) {
        throw new Error(`Expected replace ack for document ${oldData._id}`)
      }
    } else {
      const items = compareValues(oldData, newData)
      if (items.length > 0) {
        const { matchedCount } = await this.collection.updateOne(
          { _id: oldData._id },
          buildUpdateQuery(items),
          options
        )
        if (matchedCount < 1 && this.strictUpdate) {
          throw new Error(`Expected update ack for document ${oldData._id}`)
        }
      }
    }
  }

  async delete (data, options = {}) {
    const { deletedCount } = await this.collection.deleteOne(
      { _id: data._id },
      options
    )
    if (deletedCount < 1 && this.strictDelete) {
      throw new Error(`Expected delete ack for document ${data._id}`)
    }
  }

  async bulk (actions, options = {}) {
    const map = new Map()
    const ops = []

    // Map Mutent actions to MongoDB bulk ops
    for (let index = 0; index < actions.length; index++) {
      const op = createBulkOperation(actions[index], options, this.replace)
      if (op) {
        map.set(index.toString(), ops.length.toString())
        ops.push(op)
      }
    }

    // Skip everything if no ops
    if (ops.length <= 0) {
      return
    }

    const result = await this.collection.bulkWrite(ops, options)

    const insertedIds = Object(result.insertedIds)
    const upsertedIds = Object(result.upsertedIds)

    return actions.map((action, sourceIndex) => {
      // Resolve the action's index to the bulk op's index
      const targetIndex = map.get(sourceIndex.toString())

      // Retrieve action's final data
      const data = action.type === 'UPDATE' ? action.newData : action.data

      // Returns the entity's data
      if (targetIndex) {
        if (insertedIds[targetIndex]) {
          return { ...data, _id: insertedIds[targetIndex] }
        } else if (upsertedIds[targetIndex]) {
          return { ...data, _id: upsertedIds[targetIndex] }
        }
      }
      return data
    })
  }
}

function getCollection ({ client, collection, collectionName, db, dbName }) {
  if (collection) {
    return collection
  } else if (db && collectionName) {
    return db.collection(collectionName)
  } else if (client && collectionName) {
    return client.db(dbName).collection(collectionName)
  } else {
    throw new Error('Unable to get a valid MongoDB collection')
  }
}
