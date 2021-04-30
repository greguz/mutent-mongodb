# mutent-mongodb

Mutent adapter for MongoDB collections.

```javascript
import { Store } from 'mutent'
import { MongoAdapter } from 'mutent-mongodb'

// TODO: Get a MongoDB collection somehow..

const adapter = new MongoAdapter(collection, {
  /**
   * Do not throw an error when a write action (insertOne, updateOne, deleteOne) does not match any document.
   * @default false
   */
  relax: false,
  /**
   * Always replace the whole document (replaceOne) instead of just update changed fields (updateOne).
   * @default false
   */
  replace: false
})

const store = new Store({
  name: 'MyCollectionStore',
  adapter
})
```
