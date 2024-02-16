import test from 'ava'

import { MongoAdapter, isOrphaned } from '../mutent-mongodb.mjs'

test('exports', t => {
  t.truthy(MongoAdapter)
  t.truthy(isOrphaned)
})
