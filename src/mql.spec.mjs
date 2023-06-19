import test from 'ava'

import { buildUpdateQuery } from './mql.mjs'

test('buildUpdateQuery', t => {
  t.throws(() => buildUpdateQuery('', 0))
  t.throws(() => buildUpdateQuery({}, ''))
  t.throws(() => buildUpdateQuery(0, {}))

  t.like(
    buildUpdateQuery(
      {
        hello: 'world',
        bye: 'bye'
      },
      {
        hello: 'games',
        redeemed: true
      }
    ),
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

  t.like(
    buildUpdateQuery(
      {
        items: [
          {
            a: 'value'
          }
        ]
      },
      {
        items: []
      }
    ),
    {
      $set: {
        items: []
      }
    }
  )
  t.like(
    buildUpdateQuery(
      {
        items: [
          {
            a: null,
            nope: true
          }
        ]
      },
      {
        items: [
          {
            a: 'value'
          }
        ]
      }
    ),
    {
      $set: {
        'items.0.a': 'value'
      },
      $unset: {
        'items.0.nope': ''
      }
    }
  )
  t.like(
    buildUpdateQuery(
      {
        items: [
          {
            id: 1,
            value: 'scooby doo',
            soul: true
          }
        ]
      },
      {
        items: [
          {
            id: 1,
            value: 'scooby doo'
          },
          {
            id: 2,
            value: 'shaggy'
          }
        ]
      }
    ),
    {
      $set: {
        'items.1': {
          id: 2,
          value: 'shaggy'
        }
      },
      $unset: {
        'items.0.soul': ''
      }
    }
  )
})
