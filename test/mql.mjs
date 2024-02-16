import test from 'ava'

import { buildUpdateQuery } from '../lib/mql.mjs'
import { getCollection } from './_mongod.mjs'

test('pull from array', async t => {
  t.plan(3)

  const collection = getCollection()

  const { insertedId } = await collection.insertOne({
    hello: 'pdor',
    items: ['a', 'b', 'c', 'd', 'e', 'f'],
    value: 42
  })

  t.truthy(insertedId)
  const oldDoc = await collection.findOne({ _id: insertedId })
  t.like(oldDoc, {
    hello: 'pdor',
    items: ['a', 'b', 'c', 'd', 'e', 'f'],
    value: 42
  })

  const newDoc = {
    ...oldDoc,
    hello: 'world',
    items: ['c', 'b', 'x', 'f', 'z']
  }

  const { value } = await collection.findOneAndUpdate(
    { _id: insertedId },
    buildUpdateQuery(oldDoc, newDoc),
    { returnDocument: 'after' }
  )
  t.like(value, {
    hello: 'world',
    items: ['c', 'b', 'x', 'f', 'z'],
    value: 42
  })
})

test('update array', async t => {
  t.plan(3)

  const collection = getCollection()

  const { insertedId } = await collection.insertOne({
    hello: 'pdor',
    items: ['a', 'b', 'c', 'd', 'e', 'f'],
    value: 42
  })

  t.truthy(insertedId)
  const oldDoc = await collection.findOne({ _id: insertedId })
  t.like(oldDoc, {
    hello: 'pdor',
    items: ['a', 'b', 'c', 'd', 'e', 'f'],
    value: 42
  })

  const newDoc = {
    ...oldDoc,
    hello: 'world',
    items: ['a', 'c', 'b', 'd', 'x', 'f']
  }

  const { value } = await collection.findOneAndUpdate(
    { _id: insertedId },
    buildUpdateQuery(oldDoc, newDoc),
    { returnDocument: 'after' }
  )
  t.like(value, {
    hello: 'world',
    items: ['a', 'c', 'b', 'd', 'x', 'f'],
    value: 42
  })
})
