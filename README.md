# mutent-mongodb

[![npm](https://img.shields.io/npm/v/mutent-mongodb)](https://www.npmjs.com/package/mutent-mongodb)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

[Mutent](https://github.com/greguz/mutent)'s adapter for MongoDB.

```javascript
import { MongoClient } from 'mongodb'
import { Store } from 'mutent'
import { MongoAdapter } from 'mutent-mongodb'

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
