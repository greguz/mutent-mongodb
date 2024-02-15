import test from 'ava'
import { Entity } from 'mutent'

import { MongoAdapter, isOrphaned } from '../src/adapter.mjs'
import { getCollection } from './_mongod.mjs'

test('getCollection', t => {
  t.plan(7)

  t.truthy(
    new MongoAdapter({
      collection: getCollection()
    })
  )

  t.truthy(
    new MongoAdapter({
      db: {
        collection (collectionName) {
          t.is(collectionName, 'testCollection')
          return getCollection(collectionName)
        }
      },
      collectionName: 'testCollection'
    })
  )

  t.truthy(
    new MongoAdapter({
      client: {
        db (dbName) {
          t.is(dbName, 'testDb')
          return {
            collection (collectionName) {
              t.is(collectionName, 'testDb')
              return getCollection(collectionName)
            }
          }
        }
      },
      dbName: 'testDb',
      collectionName: 'testDb'
    })
  )

  t.throws(() => new MongoAdapter({ client: {}, dbName: 'nope' }))
})

test('find', async t => {
  t.plan(1)

  const collection = getCollection()

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

  const collection = getCollection()

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

test('delete orphan', async t => {
  t.plan(4)

  const adapter = new MongoAdapter({
    collection: getCollection()
  })

  const entity = Entity.create({ test: t.title })

  await adapter.createEntity(entity, {})
  entity.commit()

  t.truthy(entity.target._id)
  t.like(entity, {
    shouldCommit: false,
    target: {
      test: t.title
    }
  })

  const { deletedCount } = await adapter.collection.deleteOne(
    { _id: entity.target._id }
  )
  t.is(deletedCount, 1)

  await adapter.deleteEntity(entity, {})

  const doc = entity.valueOf()
  t.true(isOrphaned(doc))
})
