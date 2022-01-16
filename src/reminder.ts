import { CronJob } from 'cron'
import { mongoInit } from './mongo.js'
import { sendDidKeyboard } from './bot.js'
import env from './env.js'

const scheduleEveryMinute = '0 * * * * *'
const scheduleEveryFiveSecs = '*/5 * * * * *'

const schedule = env.TEST ? scheduleEveryFiveSecs : scheduleEveryMinute

export const remindJob = new CronJob(schedule, remind, null)

const db = await mongoInit()

// background job
// runs with a given interval:
// selects users that should be notified at the next minute
// send a message to the selected users

// Query users with the notification time of one minute:
// 10:55 - now, take as a start, truncating the seconds
// 10:56 - plus one minute
async function remind() {
  const start = new Date()
  let startHours = start.getUTCHours()
  const startMinutes = start.getMinutes()
  let endMinutes = startMinutes + 1

  if (endMinutes == 60) {
    startHours++
    endMinutes = 0
  }

  const query = {
    'value.targetHoursUTC': startHours,
    'value.targetMinutes': endMinutes,
  }

  const found = db.find(query)
  const count = await found.count()

  console.info(
    `reminder job: found ${count} users with query ${JSON.stringify(query)}`
  )

  await found.forEach((doc) => {
    console.log(`reminder job: sending message to ${JSON.stringify(doc)}`)
    const values = doc.value as Record<string, string>
    void sendDidKeyboard(doc.key, values['__language_code'] as string)
  })
}
