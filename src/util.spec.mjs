import test from 'ava'

import { stripUndefinedValues, uniq } from './util.mjs'

test('stripUndefinedValues', t => {
  const obj = {
    a: undefined,
    b: null,
    c: {
      d: undefined,
      e: null
    },
    f: [
      {
        g: undefined,
        h: null,
        i: [
          {
            j: undefined,
            k: null
          }
        ]
      }
    ]
  }

  t.like(
    Object.keys(obj),
    ['a', 'b', 'c', 'f']
  )

  stripUndefinedValues(obj)

  t.like(
    Object.keys(obj),
    ['b', 'c', 'f']
  )

  t.deepEqual(obj, {
    b: null,
    c: {
      e: null
    },
    f: [
      {
        h: null,
        i: [
          {
            k: null
          }
        ]
      }
    ]
  })
})

test('uniq', t => {
  t.like(
    uniq(['a', 'b', 'c', 'a', 'b', 'd']),
    ['a', 'b', 'c', 'd']
  )
})
