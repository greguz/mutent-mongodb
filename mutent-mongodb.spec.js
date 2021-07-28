const test = require('ava')
const { MongoClient } = require('mongodb')

const { MongoAdapter } = require('./mutent-mongodb')

let client
let db
let collection

test.before(async () => {
  client = await MongoClient.connect(process.env.MONGO_URL)
  db = client.db(process.env.MONGO_DATABASE || 'mutent-mongodb')
  collection = db.collection(process.env.MONGO_COLLECTION || 'mutent-mongodb')
})

test.after.always(async () => {
  await collection.drop()
  await client.close(true)
})

test('find', async t => {
  t.plan(1)

  const { insertedId } = await collection.insertOne({ test: 'find' })

  const adapter = MongoAdapter.create(collection)

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

  const adapter = MongoAdapter.create(collection)

  const iterable = adapter.filter(
    {
      _id: {
        $in: Object.values(insertedIds)
      }
    },
    {
      sort: {
        index: 1
      }
    }
  )

  t.true(iterable[Symbol.asyncIterator] !== undefined)

  const documents = []
  for await (const document of iterable) {
    documents.push(document)
  }

  t.deepEqual(documents, [
    { _id: insertedIds[1], test: 'filter', index: 0 },
    { _id: insertedIds[2], test: 'filter', index: 1 },
    { _id: insertedIds[0], test: 'filter', index: 2 }
  ])
})

test('create', async t => {
  t.plan(1)

  const adapter = MongoAdapter.create(collection)

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

  const adapter = MongoAdapter.create(collection)

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

  const adapter = MongoAdapter.create(collection, { replace: true })

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

  const adapter = MongoAdapter.create(collection)

  await adapter.delete({ _id: insertedId })

  const document = await collection.findOne({ _id: insertedId })

  t.true(!document)
})

test('bulk', async t => {
  t.plan(1)

  const { insertedIds } = await collection.insertMany([
    { test: 'bulk', index: 0 },
    { test: 'bulk', index: 1 }
  ])

  const adapter = MongoAdapter.create(collection)

  const document = await collection.findOne({ _id: insertedIds[0] })

  const documents = await adapter.bulk(
    [
      {
        type: 'CREATE',
        data: {
          test: 'bulk',
          index: 2
        }
      },
      {
        type: 'UPDATE',
        oldData: document,
        newData: {
          ...document,
          index: 3
        }
      },
      {
        type: 'DELETE',
        data: await collection.findOne({ _id: insertedIds[1] })
      }
    ],
    { upsert: true }
  )

  t.true(Array.isArray(documents))
})
