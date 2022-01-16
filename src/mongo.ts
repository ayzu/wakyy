import { ISession } from '@satont/grammy-mongodb-storage'
import { MongoClient } from 'mongodb'
import env from './env.js'

export async function mongoInit() {
  const client = new MongoClient(env.MONGO)
  await client.connect()
  const dbname = env.TEST ? 'wakyy-test' : 'wakyy'
  const db = client.db(dbname)
  return db.collection<ISession>('users')
}
