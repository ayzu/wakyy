import 'source-map-support/register.js'
import { bot, initBot } from './bot.js'
import { mongoInit } from './mongo.js'
import { remindJob } from './reminder.js'
import { run } from '@grammyjs/runner'
import env from './env.js'

async function runApp() {
  console.info('Starting app with config: ', env)

  const collectionUsers = await mongoInit()
  console.info('Mongo connected')

  await initBot(collectionUsers)
  console.info('Initialized bot')

  const runner = run(bot)
  console.info(`Bot ${bot.botInfo.username} is up and running`)

  console.info('starting reminder job')
  remindJob.start()
  console.info('started reminder job')

  const stopRunner = () => {
    remindJob.stop()
    runner.isRunning() && runner.stop()
  }
  process.once('SIGINT', stopRunner)
  process.once('SIGTERM', stopRunner)
}

void runApp()
