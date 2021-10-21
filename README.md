# mutent-mongodb

Mutent adapter for MongoDB collections.

```javascript
import { Store } from 'mutent'
import MongoAdapter from 'mutent-mongodb'

const store = new Store({
  adapter: new MongoAdapter({
    // MongoDB's collection instance.
    collection: myCollection,
    // Replace the whole document instead of just update the changed properties.
    replace: false,
    // Throw an error when an update request does not match any document.
    strictUpdate: false,
    // Throw an error when a delete request does not match any document.
    strictDelete: false
  })
})

store
  .create({ my: 'document' })
  .unwrap()
  .then(data => {
    console.log(`Created document ${data._id}`)
  })
```
