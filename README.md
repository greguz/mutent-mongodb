# mutent-mongodb

Mutent adapter for MongoDB collections.

```javascript
import { createStore } from 'mutent'
import { createMongoAdapter } from 'mutent-mongodb'

const store = createStore({
  name: 'MyCollectionStore',
  adapter: createMongoAdapter(collection, {
    // If true an error will be thrown if the document doesn't exist
    relax: false,
    // If true will replace the whole document instead of update changed fields only (default false)
    replace: false
  })
})
```
