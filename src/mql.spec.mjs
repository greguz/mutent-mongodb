import test from 'ava'

import { buildUpdateQuery } from './mql.mjs'

test('without documents', t => {
  t.deepEqual(buildUpdateQuery('', 0), null)
  t.deepEqual(buildUpdateQuery({}, ''), null)
  t.deepEqual(buildUpdateQuery(0, {}), null)
  t.deepEqual(buildUpdateQuery({}, null), null)
  t.deepEqual(buildUpdateQuery(null, null), null)
})

test('simple case', t => {
  const from = {
    hello: 'world',
    bye: 'bye'
  }

  const to = {
    hello: 'games',
    redeemed: true
  }

  t.deepEqual(
    buildUpdateQuery(from, to),
    {
      $set: {
        hello: 'games',
        redeemed: true
      },
      $unset: {
        bye: ''
      }
    }
  )
})

test('update array', t => {
  const from = {
    hello: 'pdor',
    items: ['a', 'b', 'c', 'd', 'e', 'f'],
    value: 42
  }

  const to = {
    hello: 'world',
    items: ['a', 'c', 'b', 'd', 'x', 'f'],
    value: 42
  }

  t.deepEqual(
    buildUpdateQuery(from, to),
    {
      $set: {
        hello: 'world',
        'items.1': 'c',
        'items.2': 'b',
        'items.4': 'x'
      }
    }
  )
})

test('pull from array', t => {
  const from = {
    hello: 'pdor',
    items: ['a', 'b', 'c', 'd', 'e', 'f'],
    value: 42
  }

  const to = {
    hello: 'world',
    items: ['c', 'b', 'x', 'f', 'z'],
    value: 42
  }

  t.deepEqual(
    buildUpdateQuery(from, to),
    {
      $set: {
        hello: 'world',
        items: ['c', 'b', 'x', 'f', 'z']
      }
    }
  )
})
