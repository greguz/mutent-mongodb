# mutent-mongodb

```javascript
const { createStore } = require('mutent')
const { createReader, createWriter } = require('mutent-mongodb')

function createStoreByCollection (collection) {
  return createStore({
    autoCommit: true,
    classy: false,
    historySize: 8,
    safe: true,
    reader: createReader({ collection }),
    writer: createWriter({ collection })
  })
}
```
