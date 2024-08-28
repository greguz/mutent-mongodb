import test from 'ava'

import MongoAdapter from '../mutent-mongodb.mjs'

test('exports', t => {
  t.true(typeof MongoAdapter === 'function')
  t.true(MongoAdapter.name === 'MongoAdapter')
})
