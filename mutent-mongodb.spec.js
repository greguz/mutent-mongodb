const test = require('ava')

const { createMongoAdapter } =  require('./mutent-mongodb')

test('find', async t => {
  t.plan(3)

  const collection = {
    async findOne (query, options) {
      t.deepEqual(query, { _id: 'my_doc' })
      t.deepEqual(options, { session: 'test' })
      return { a: 'document' }
    }
  }

  const adapter = createMongoAdapter(collection)

  const doc = await adapter.find(
    { _id: 'my_doc' },
    { session: 'test', shit: true }
  )

  t.deepEqual(doc, { a: 'document' })
})

test('filter', async t => {
  t.plan(3)

  const collection = {
    find (query, options) {
      t.deepEqual(query, { _id: { $in: ['my_documents'] } })
      t.deepEqual(options, { session: 'test' })
      return [{ my: 'documents' }]
    }
  }

  const adapter = createMongoAdapter(collection)

  const iterable = adapter.filter(
    { _id: { $in: ['my_documents'] } },
    { session: 'test', shit: true }
  )

  t.deepEqual(iterable, [{ my: 'documents' }])
})

test('create', async t => {
  t.plan(2)

  const collection = {
    async insertOne (data, options) {
      t.deepEqual(data, { a: 'document' })
      t.deepEqual(options, { session: 'test' })
    }
  }

  const adapter = createMongoAdapter(collection)

  await adapter.create(
    { a: 'document' },
    { session: 'test', shit: true }
  )
})

test('update', async t => {
  t.plan(3)

  const collection = {
    async updateOne (filter, update, options) {
      t.deepEqual(filter, { _id: 'test' })
      t.deepEqual(update, { $set: { my: 'value' } })
      t.deepEqual(options, { session: 'test' })
      return { matchedCount: 1 }
    }
  }

  const adapter = createMongoAdapter(collection)

  await adapter.update(
    { _id: 'test' },
    { _id: 'nope', my: 'value' },
    { session: 'test', shit: true }
  )

  await adapter.update(
    { a: 'document' },
    { a: 'document' },
    { session: 'test', shit: true }
  )
})

test('replace', async t => {
  t.plan(3)

  const collection = {
    async replaceOne (filter, document, options) {
      t.deepEqual(filter, { _id: 'test' })
      t.deepEqual(document, { _id: 'test', my: 'value' })
      t.deepEqual(options, { session: 'test' })
      return { matchedCount: 1 }
    }
  }

  const adapter = createMongoAdapter(collection, { replace: true })

  await adapter.update(
    {  _id: 'test' },
    {  _id: 'test', my: 'value' },
    { session: 'test', shit: true }
  )
})

test('delete', async t => {
  t.plan(2)

  const collection = {
    async deleteOne (filter, options) {
      t.deepEqual(filter, { _id: 'test' })
      t.deepEqual(options, { session: 'test' })
      return { deletedCount: 1 }
    }
  }

  const adapter = createMongoAdapter(collection)

  await adapter.delete(
    { _id: 'test' },
    { session: 'test', shit: true }
  )
})
