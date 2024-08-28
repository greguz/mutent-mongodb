# mutent-mongodb

[![npm](https://img.shields.io/npm/v/mutent-mongodb)](https://www.npmjs.com/package/mutent-mongodb)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![ci](https://github.com/greguz/mutent-mongodb/actions/workflows/ci.yaml/badge.svg?branch=master)](https://github.com/greguz/mutent-mongodb/actions/workflows/ci.yaml)

[Mutent](https://github.com/greguz/mutent)'s Adapter for MongoDB.

## Features

- **Lost update/delete protection**:
- **Bulk update optimization**: when possible, bulk updates are used
- **ESM and Common.js**: both module systems are supported
- **TypeScript**: native support (types declaration included)

## API

### `new MongoAdapter(options)`

Class constructor.

- `options`: `<Object>`
  - `[collection]`: `<Collection>`
  - `[collectionName]`: `<String>`
  - `[db]`: `<Db>`
  - `[dbName]`: `<String>`
  - `[client]`: `<MongoClient>`
  - `[filterQuery]`: `<Function>`
  - `[diffDocuments]`: `<Function>` | `<Boolean>`
  - `[allowLostUpdates]`: `<Boolean>`
  - `[allowLostDeletes]`: `<Boolean>`
- Returns: `<MongoAdapter>`

### `MongoAdapter::raw`

Readonly property containing the requested MongoDB's `Collection` instance.

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

const doc = await store
  .create({ my: 'document' })
  .unwrap()

console.log(`Created document ${doc._id}`)
```
