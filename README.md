# mutent-mongodb

```javascript
const { createStore } = require('mutent')
const { createDriver } = require('mutent-mongodb')

function createMongoStore (collection) {
  return createStore({
    autoCommit: true,
    classy: false,
    historySize: 8,
    safe: true,
    driver: createDriver(collection, {
      // defaultOptions
      // errorFactory
      // prepare
      // beforeCreate
      // afterCreate
      // beforeUpdate
      // afterUpdate
      // beforeDelete
      // afterDelete
    })
  })
}
```
