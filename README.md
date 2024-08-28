# mutent-mongodb

[![npm](https://img.shields.io/npm/v/mutent-mongodb)](https://www.npmjs.com/package/mutent-mongodb)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![ci](https://github.com/greguz/mutent-mongodb/actions/workflows/ci.yaml/badge.svg?branch=master)](https://github.com/greguz/mutent-mongodb/actions/workflows/ci.yaml)
[![Coverage Status](https://coveralls.io/repos/github/greguz/mutent-mongodb/badge.svg?branch=master)](https://coveralls.io/github/greguz/mutent-mongodb?branch=master)

[Mutent](https://github.com/greguz/mutent)'s Adapter for MongoDB.

## Features

- **Lost update/delete protection**
- **Bulk update optimization**: when possible, bulk updates are used
- **ESM and Common.js**: both module systems are supported
- **TypeScript**: native support (types declaration included)

## API

### `new MongoAdapter(options)`

Class constructor.

- `options`: `<Object>`
  - `[collection]`: `<Collection>` The collection instance to use. This option has the top priority.
  - `[collectionName]`: `<String>` Collection's name. This option works along aside with `db`, `dbName`, and `client` options.
  - `[db]`: `<Db>` Database instance. You must specify also the `collectionName` option.
  - `[dbName]`: `<String>` Database's name. You must specify also `collectionName`, and `client` options.
  - `[client]`: `<MongoClient>` MongoDB client instance. You must specify also `collectionName`, and `dbName` options.
  - `[filterQuery]`: `<Function>` Filter query generation hook. Accepts the `Entity` instance and its `Context`, and returns the filter query that matches the requested document. By default match by `_id` field.
  - `[diffDocuments]`: `<Function>` | `<Boolean>`
  - `[allowLostUpdates]`: `<Boolean>` Set to `true` to allow (do not throw) lost updates and also flat the entity as orphaned (`entity.meta.orphan = true`).
  - `[allowLostDeletes]`: `<Boolean>` Set to `true` to allow (do not throw) lost deletes and also flat the entity as orphaned (`entity.meta.orphan = true`).
- Returns: `<MongoAdapter>`

### `MongoAdapter::raw`

Readonly property containing the requested MongoDB's `Collection` instance.

### Unwrap options

All available options from the following MongoDB methods:

- [`findOne`](https://mongodb.github.io/node-mongodb-native/6.8/classes/Collection.html#findOne)
- [`find`](https://mongodb.github.io/node-mongodb-native/6.8/classes/Collection.html#find)
- [`insertOne`](https://mongodb.github.io/node-mongodb-native/6.8/classes/Collection.html#insertOne)
- [`replaceOne`](https://mongodb.github.io/node-mongodb-native/6.8/classes/Collection.html#replaceOne)
- [`updateOne`](https://mongodb.github.io/node-mongodb-native/6.8/classes/Collection.html#updateOne)
- [`deleteOne`](https://mongodb.github.io/node-mongodb-native/6.8/classes/Collection.html#deleteOne)
- [`bulkWrite`](https://mongodb.github.io/node-mongodb-native/6.8/classes/Collection.html#bulkWrite)

### Errors

MongoDB related (`MutentError` instances) error codes.

#### `MONGODB_LOST_UPDATE`

Lost update detected (single document).

This error carries those extra info (`error.info` object):

- `dbName`: Database's name.
- `collectionName`: Collection's name.
- `filterQuery`: Filter's query that has performed the lost update.
- `document`: The original document retrieved from MongoDB previously.

#### `MONGODB_LOST_DELETE`

Lost delete detected (single document).

This error carries those extra info (`error.info` object):

- `dbName`: Database's name.
- `collectionName`: Collection's name.
- `filterQuery`: Filter's query that has performed the lost update.
- `document`: The original document retrieved from MongoDB previously.

#### `MONGODB_LOST_UPDATES`

Lost update detected during a bulk write.

This error carries those extra info (`error.info` object):

- `dbName`: Database's name.
- `collectionName`: Collection's name.
- `matchedCount`: Number of documents matched by the bulk write.
- `upsertedCount`: Number of documents upserted by the bulk write.
- `expectedUpdations`: Expected number of insert/update ops.

#### `MONGODB_LOST_DELETES`

Lost delete detected during a bulk write.

This error carries those extra info (`error.info` object):

- `dbName`: Database's name.
- `collectionName`: Collection's name.
- `deletedCount`: Number of deleted documents.
- `expectedDeletions`: Expected number of delete ops.

## Example

```javascript
import { MongoClient } from 'mongodb'
import { Store } from 'mutent'
import MongoAdapter from 'mutent-mongodb'

const client = new MongoClient(process.env.MONGO_URL)

await client.connect()

const store = new Store({
  adapter: new MongoAdapter({
    client,
    dbName: 'my-database',
    collectionName: 'my-collection'
  })
})

// Access the raw Collection instance
const count = await store.raw.countDocuments()

const doc = await store
  .create({ my: 'document' })
  .unwrap()

console.log(`Created document ${doc._id}`)
```
