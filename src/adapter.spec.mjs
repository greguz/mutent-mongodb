import test from 'ava'
import { ObjectId } from 'mongodb'
import { compileFilterQuery, compileUpdateQuery } from 'mql-match'

import { MongoAdapter } from './adapter.mjs'

const collection = {
  dbName: 'mockedDb',
  collectionName: 'mockedCollection',
  items: [],
  async findOne (filter, options) {
    return this.items.find(compileFilterQuery(filter)) || null
  },
  async * find (filter, options) {
    const match = compileFilterQuery(filter)

    for (const item of this.items) {
      if (match(item)) {
        yield item
      }
    }
  },
  async insertOne (doc, options) {
    const insertedId = doc._id === undefined
      ? new ObjectId()
      : doc._id

    this.items.push({
      ...doc,
      _id: insertedId
    })

    return { insertedId }
  },
  async replaceOne (filter, doc, options) {
    const index = this.items.findIndex(compileFilterQuery(filter))

    let upsertedId
    if (index >= 0) {
      this.items[index] = doc
    } else if (options.upsert) {
      const { insertedId } = await this.insertOne(doc, options)
      upsertedId = insertedId
    }

    return {
      matchedCount: index >= 0 ? 1 : 0,
      upsertedId
    }
  },
  async updateOne (filter, update, options) {
    const mutate = compileUpdateQuery(update)
    const index = this.items.findIndex(compileFilterQuery(filter))

    let upsertedId
    if (index >= 0) {
      this.items.splice(index, 1, mutate(this.items[index]))
    } else if (options.upsert) {
      const { insertedId } = await this.insertOne(mutate({}, true), options)
      upsertedId = insertedId
    }

    return {
      matchedCount: index >= 0 ? 1 : 0,
      upsertedId
    }
  },
  async deleteOne (filter, options) {
    const index = this.items.findIndex(compileFilterQuery(filter))

    if (index >= 0) {
      this.items.splice(index, 1)
    }

    return { deletedCount: index >= 0 ? 1 : 0 }
  },
  async bulkWrite (ops, options) {
    const insertedIds = {}
    const upsertedIds = {}

    let deletedCount = 0
    let matchedCount = 0

    for (let i = 0; i < ops.length; i++) {
      const op = ops[i]

      if (op.insertOne) {
        const result = await this.insertOne(
          op.insertOne.document,
          options
        )
        insertedIds[i] = result.insertedId
      } else if (op.updateOne) {
        const result = await this.updateOne(
          op.updateOne.filter,
          op.updateOne.update,
          {
            ...options,
            upsert: op.updateOne.upsert
          }
        )
        matchedCount += result.matchedCount
        if (result.upsertedId) {
          upsertedIds[i] = result.upsertedId
        }
      } else if (op.replaceOne) {
        const result = await this.replaceOne(
          op.replaceOne.filter,
          op.replaceOne.replacement,
          {
            ...options,
            upsert: op.replaceOne.upsert
          }
        )
        matchedCount += result.matchedCount
        if (result.upsertedId) {
          upsertedIds[i] = result.upsertedId
        }
      } else if (op.deleteOne) {
        const result = await this.deleteOne(
          op.deleteOne.filter,
          options
        )
        deletedCount += result.deletedCount
      } else {
        throw new Error('Unsupported bulk operation')
      }
    }

    return {
      deletedCount,
      insertedIds,
      matchedCount,
      upsertedCount: Object.keys(upsertedIds).length,
      upsertedIds
    }
  },
  async insertMany (docs, options) {
    const insertedIds = []

    for (const doc of docs) {
      const { insertedId } = await this.insertOne(doc, options)
      insertedIds.push(insertedId)
    }

    return { insertedIds }
  }
}

test('getCollection', t => {
  t.truthy(new MongoAdapter({ collection }))

  const db = {
    collection (collectionName) {
      t.is(collectionName, 'testCollection')
      return collection
    }
  }
  t.truthy(new MongoAdapter({ db, collectionName: 'testCollection' }))

  const client = {
    db (dbName) {
      t.is(dbName, 'testDb')
      return db
    }
  }
  t.truthy(
    new MongoAdapter({
      client,
      dbName: 'testDb',
      collectionName: 'testCollection'
    })
  )

  t.throws(() => new MongoAdapter({ client, dbName: 'nope' }))
})

test('find', async t => {
  t.plan(1)

  const { insertedId } = await collection.insertOne({ test: 'find' })

  const adapter = new MongoAdapter({ collection })

  const document = await adapter.find({ _id: insertedId })

  t.deepEqual(document, {
    _id: insertedId,
    test: 'find'
  })
})

test('filter', async t => {
  t.plan(2)

  const { insertedIds } = await collection.insertMany([
    { test: 'filter', index: 2 },
    { test: 'filter', index: 0 },
    { test: 'filter', index: 1 }
  ])

  const adapter = new MongoAdapter({ collection })

  const iterable = adapter.filter({
    _id: {
      $in: Object.values(insertedIds)
    }
  })

  t.is(typeof iterable[Symbol.asyncIterator], 'function')

  const documents = []
  for await (const document of iterable) {
    documents.push(document)
  }

  t.deepEqual(documents, [
    { _id: insertedIds[0], test: 'filter', index: 2 },
    { _id: insertedIds[1], test: 'filter', index: 0 },
    { _id: insertedIds[2], test: 'filter', index: 1 }
  ])
})

test('create', async t => {
  t.plan(1)

  const adapter = new MongoAdapter({ collection })

  const a = await adapter.create({
    test: 'create',
    a: 'document',
    b: null,
    c: undefined,
    d: {
      e: 'object',
      f: null,
      g: undefined
    },
    h: [
      {
        i: 'item',
        j: null,
        k: undefined
      }
    ]
  })

  const b = await collection.findOne({ _id: a._id })

  t.deepEqual(a, b)
})

test('update', async t => {
  t.plan(1)

  const adapter = new MongoAdapter({ collection })

  const { insertedId } = await collection.insertOne({ test: 'update' })

  await adapter.update(
    {
      _id: insertedId,
      test: 'update'
    },
    {
      _id: insertedId,
      test: 'update',
      a: 'document',
      b: null,
      c: undefined,
      d: {
        e: 'object',
        f: null,
        g: undefined
      },
      h: [
        {
          i: 'item',
          j: null,
          k: undefined
        }
      ]
    }
  )

  const document = await collection.findOne({ _id: insertedId })
  t.deepEqual(document, {
    _id: insertedId,
    test: 'update',
    a: 'document',
    b: null,
    d: {
      e: 'object',
      f: null
    },
    h: [
      {
        i: 'item',
        j: null
      }
    ]
  })
})

test('replace', async t => {
  t.plan(1)

  const { insertedId } = await collection.insertOne({ test: 'replace' })

  const adapter = new MongoAdapter({ collection, replace: true })

  await adapter.update(
    {
      _id: insertedId,
      test: 'replace'
    },
    {
      _id: insertedId,
      test: 'replace',
      replaced: true
    }
  )

  const document = await collection.findOne({ _id: insertedId })

  t.deepEqual(document, {
    _id: insertedId,
    test: 'replace',
    replaced: true
  })
})

test('delete', async t => {
  t.plan(1)

  const { insertedId } = await collection.insertOne({ test: 'delete' })

  const adapter = new MongoAdapter({ collection })

  await adapter.delete({ _id: insertedId })

  const document = await collection.findOne({ _id: insertedId })

  t.true(!document)
})

test('bulk', async t => {
  t.plan(5)

  const { insertedIds } = await collection.insertMany([
    { test: 'bulk', index: 0 },
    { test: 'bulk', index: 1 },
    { test: 'bulk', index: 2 }
  ])

  const adapter = new MongoAdapter({ collection })

  const a = await collection.findOne({ _id: insertedIds[0] })
  const b = await collection.findOne({ _id: insertedIds[1] })

  const documents = await adapter.bulk(
    [
      {
        type: 'UPDATE',
        oldData: a,
        newData: a
      },
      {
        type: 'CREATE',
        data: {
          test: 'bulk',
          index: 3
        }
      },
      {
        type: 'UPDATE',
        oldData: b,
        newData: {
          ...b,
          updated: true
        }
      },
      {
        type: 'DELETE',
        data: await collection.findOne({ _id: insertedIds[2] })
      },
      {
        type: 'UPDATE',
        oldData: {
          test: 'bulk'
        },
        newData: {
          test: 'bulk',
          index: 4
        }
      }
    ],
    { upsert: true }
  )

  const created = await collection.findOne({ test: 'bulk', index: 3 })
  t.truthy(created)
  t.true(ObjectId.isValid(created._id))

  t.like(documents, [
    { index: 0, _id: insertedIds[0] },
    { index: 3 },
    { index: 1, _id: insertedIds[1] },
    { index: 2, _id: insertedIds[2] },
    { index: 4 }
  ])
  t.truthy(documents[1]._id.toHexString)
  t.truthy(documents[4]._id.toHexString)
})

test('strictUpdate', async t => {
  const adapter = new MongoAdapter({
    collection,
    strictUpdate: true
  })

  const oldData = { _id: new ObjectId(), test: 'strictUpdate' }
  const newData = { ...oldData, value: 42 }

  await t.throwsAsync(
    () => adapter.update(oldData, newData),
    { message: `Expected update ack for document ${oldData._id}` }
  )
  await t.throwsAsync(
    () => adapter.update(oldData, newData, { replace: true }),
    { message: `Expected replace ack for document ${oldData._id}` }
  )

  await t.throwsAsync(
    () => adapter.bulk([{ type: 'UPDATE', oldData, newData }]),
    { message: 'Some documents were not present during their update' }
  )
  await t.throwsAsync(
    () => adapter.bulk([{ type: 'UPDATE', oldData, newData }], { replace: true }),
    { message: 'Some documents were not present during their update' }
  )
})

test('strictDelete', async t => {
  const { insertedId } = await collection.insertOne({ test: 'strictDelete' })

  const adapter = new MongoAdapter({
    collection,
    strictDelete: true
  })

  const doc = await collection.findOne({ _id: insertedId })
  t.truthy(doc)

  await adapter.delete(doc)
  await t.throwsAsync(
    () => adapter.delete(doc),
    { message: `Expected delete ack for document ${doc._id}` }
  )

  await collection.insertOne(doc)

  const action = {
    type: 'DELETE',
    data: doc
  }

  await adapter.bulk([action])
  await t.throwsAsync(
    () => adapter.bulk([action]),
    { message: 'Some documents were not present during their deletion' }
  )
})
