import test from 'ava'
import { MongoClient } from 'mongodb'
import { MongoMemoryServer } from 'mongodb-memory-server'

/**
 * Running MongoDB memory server instance.
 */
let mongod = null

/**
 * Connected MongoClient instance.
 */
let client = null

test.before(async () => {
  mongod = await MongoMemoryServer.create({
    instance: {
      dbName: 'mutent-mongodb'
    }
  })
  client = await MongoClient.connect(mongod.getUri())
})

test.after(async () => {
  if (client) {
    await client.close(true)
  }
  if (mongod) {
    await mongod.stop()
  }
})

export function getCollection (collectionName = 'test') {
  return client.db('mutent-mongodb').collection(collectionName)
}
