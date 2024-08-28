import test from 'ava'
import { Store, getAdapterName } from 'mutent'

import MongoAdapter from '../mutent-mongodb.mjs'
import { getCollection } from './_mongod.mjs'

test('constructor', t => {
  t.plan(8)

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

  const adapter = new MongoAdapter({ collection: getCollection('constructor') })
  t.is(
    getAdapterName(adapter),
    'MongoDB@mutent-mongodb:constructor'
  )
})

test('findOne', async t => {
  t.plan(1)

  const store = new Store({
    adapter: new MongoAdapter({
      collection: getCollection('findOne')
    })
  })

  const { insertedId } = await store.raw.insertOne({
    look: 'at',
    me: 'now'
  })

  const doc = await store.find({ _id: insertedId }).unwrap()
  t.deepEqual(doc, {
    _id: insertedId,
    look: 'at',
    me: 'now'
  })
})

test('find', async t => {
  t.plan(1)

  const store = new Store({
    adapter: new MongoAdapter({
      collection: getCollection('find')
    })
  })

  const { insertedIds } = await store.raw.insertMany([
    { name: 'Donald Duck' },
    { name: 'José Carioca' },
    { name: 'Panchito Pistoles' }
  ])

  const docs = await store.filter({
    _id: {
      $in: Object.values(insertedIds)
    }
  }).unwrap()

  t.deepEqual(docs, [
    { _id: insertedIds[0], name: 'Donald Duck' },
    { _id: insertedIds[1], name: 'José Carioca' },
    { _id: insertedIds[2], name: 'Panchito Pistoles' }
  ])
})

test('insertOne', async t => {
  t.plan(1)

  const store = new Store({
    adapter: new MongoAdapter({
      collection: getCollection('insertOne')
    })
  })

  const { _id: insertedId } = await store.create({ hello: 'world' }).unwrap()

  const doc = await store.raw.findOne({ _id: insertedId })
  t.deepEqual(doc, {
    _id: insertedId,
    hello: 'world'
  })
})

test('replaceOne', async t => {
  t.plan(2)

  const store = new Store({
    adapter: new MongoAdapter({
      collection: getCollection('replaceOne')
    })
  })

  store.raw.updateOne = () => t.fail('unexpected updateOne usage')

  const { insertedId } = await store.raw.insertOne({ prefix: '4' })

  await store.find({ _id: insertedId })
    .assign({ suffix: '2' })
    .consume()

  const replaced = await store.raw.findOne({ _id: insertedId })
  t.deepEqual(replaced, {
    _id: insertedId,
    prefix: '4',
    suffix: '2'
  })

  await store.raw.deleteOne({ _id: insertedId })

  await t.throwsAsync(
    store.from(replaced).assign({ oh: 'no' }).consume(),
    { code: 'MONGODB_LOST_UPDATE' }
  )
})

test('updateOne', async t => {
  t.plan(2)

  const store = new Store({
    adapter: new MongoAdapter({
      collection: getCollection('updateOne'),
      diffDocuments: true
    })
  })

  store.raw.replaceOne = () => t.fail('unexpected replaceOne usage')

  const { insertedId } = await store.raw.insertOne({ suffix: '2' })

  await store.find({ _id: insertedId })
    .assign({ prefix: '4' })
    .consume()

  const updated = await store.raw.findOne({ _id: insertedId })
  t.deepEqual(updated, {
    _id: insertedId,
    prefix: '4',
    suffix: '2'
  })

  await store.raw.deleteOne({ _id: insertedId })

  await t.throwsAsync(
    store.from(updated).assign({ oh: 'no' }).consume(),
    { code: 'MONGODB_LOST_UPDATE' }
  )
})

test('deleteOne', async t => {
  t.plan(2)

  const store = new Store({
    adapter: new MongoAdapter({
      collection: getCollection('deleteOne')
    })
  })

  const { insertedId } = await store.raw.insertOne({ message: 'bye bye' })

  const doc = await store.read({ _id: insertedId })
    .delete()
    .unwrap()

  t.deepEqual(doc, {
    _id: insertedId,
    message: 'bye bye'
  })

  await t.throwsAsync(
    store.from(doc).delete().unwrap(),
    { code: 'MONGODB_LOST_DELETE' }
  )
})

test('lost update orphan', async t => {
  t.plan(2)

  const store = new Store({
    adapter: new MongoAdapter({
      collection: getCollection('lost_update_orphan'),
      allowLostUpdates: true
    }),
    hooks: {
      beforeUpdate (entity) {
        t.is(entity.meta.orphan, undefined)
      },
      afterUpdate (entity) {
        t.true(entity.meta.orphan)
      }
    }
  })

  await store.from({})
    .assign({ value: 'oh no' })
    .consume()
})

test('lost delete orphan', async t => {
  t.plan(2)

  const store = new Store({
    adapter: new MongoAdapter({
      collection: getCollection('lost_update_orphan'),
      allowLostDeletes: true
    }),
    hooks: {
      beforeDelete (entity) {
        t.is(entity.meta.orphan, undefined)
      },
      afterDelete (entity) {
        t.true(entity.meta.orphan)
      }
    }
  })

  await store.from({})
    .delete()
    .consume()
})

test('updateOne upsert', async t => {
  t.plan(2)

  const store = new Store({
    adapter: new MongoAdapter({
      collection: getCollection('updateOne_upsert')
    })
  })

  const { _id: upsertedId } = await store.from({})
    .assign({ song: 'RATATATA' })
    .unwrap({ upsert: true })

  t.truthy(upsertedId)

  const doc = await store.raw.findOne({ _id: upsertedId })
  t.deepEqual(doc, {
    _id: upsertedId,
    song: 'RATATATA'
  })
})
