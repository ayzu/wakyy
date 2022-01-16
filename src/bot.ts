import { Bot, InlineKeyboard, session } from 'grammy'
import { Collection } from 'mongodb'
import { Context, i18n, initialSession, step } from './context.js'
import { ISession, MongoDBAdapter } from '@satont/grammy-mongodb-storage'
import { Menu } from '@grammyjs/menu'
import { Router } from '@grammyjs/router'
import { ignoreOld, sequentialize } from 'grammy-middlewares'
import { parseHours, parseTimestamp, timestampToStr } from './timestamp.js'
import env from './env.js'

export const bot = new Bot<Context>(env.TOKEN)

export async function initBot(collectionUsers: Collection<ISession>) {
  bot
    .use(sequentialize())
    .use(
      session({
        initial: initialSession,
        storage: new MongoDBAdapter({ collection: collectionUsers }),
      })
    )
    .use(i18n.middleware())
    .use(ignoreOld())
    .use(mainMenu)

  bot.command('start', handleStart)
  bot.command('help', handleHelp)
  bot.command('menu', handleMenu)

  bot.callbackQuery('did', async (ctx) => {
    console.info(`-> "did" button`)
    await updateDays(ctx, true)
  })
  bot.callbackQuery('didnt', async (ctx) => {
    console.info(`-> "didnt" button`)
    await updateDays(ctx, false)
  })

  bot.use(router)

  bot.catch(console.error)

  await bot.init()
  await bot.api.setMyCommands([
    { command: 'start', description: 'Start (or restart) the bot' },
    { command: 'menu', description: 'Main menu' },
    { command: 'help', description: 'Show help' },
  ])
}

export const router = new Router<Context>((ctx: Context) =>
  ctx.session.step.toString()
)

router.route(step.await_target.toString(), async (ctx: Context) => {
  console.info(`-> ${step[step.await_target]}`)
  try {
    const [hours, minutes] = parseTimestamp(ctx.msg?.text ?? '')
    ctx.session.targetHours = hours
    ctx.session.targetMinutes = minutes
    ctx.session.step = step.await_timezone

    const msg = ctx.i18n.t('target_save_success', {
      timestamp: timestampToStr(hours, minutes),
    })
    await reply(ctx, msg)
    console.info(
      `\t ${step[step.await_target]} saved ${ctx.session.targetHours}:${
        ctx.session.targetMinutes
      }`
    )
  } catch (e) {
    console.error(`\t ${step[step.await_target]} saving error: ${e}`)
    const msg = ctx.i18n.t('target_save_failure')
    await reply(ctx, msg)
  }
})

router.route(step.await_timezone.toString(), async (ctx: Context) => {
  console.info(`-> ${step[step.await_timezone]}`)
  const input = ctx.msg?.text ?? ''

  try {
    const hours = parseHours(input.slice(0, 2))

    const utcHours = new Date().getUTCHours()
    const diff = utcHours - hours
    ctx.session.targetHoursUTC = (ctx.session.targetHours ?? -100) + diff

    const msg = ctx.i18n.t('timezone_save_success', {
      timestamp: timestampToStr(
        ctx.session.targetHours ?? -1,
        ctx.session.targetMinutes ?? -1
      ),
    })
    ctx.session.step = step.idle

    await reply(ctx, msg)
    console.info(
      `\t ${step[step.await_timezone]} saved ${ctx.session.targetHoursUTC}:${
        ctx.session.targetMinutes
      }`
    )
  } catch (e) {
    console.error(`\t ${step[step.await_timezone]} saving error: ${e}`)
    const msg = ctx.i18n.t('timezone_save_failure')
    await reply(ctx, msg)
  }
})

async function handleStart(ctx: Context) {
  console.info('-> handleStart')
  ctx.session = initialSession()
  ctx.session.step = step.await_target
  const msg = ctx.i18n.t('welcome_message')
  await reply(ctx, msg)
}

async function handleHelp(ctx: Context) {
  console.info('-> handleHelp')
  const msg = ctx.i18n.t('help')
  await reply(ctx, msg)
}

async function handleMenu(ctx: Context) {
  console.info('-> handleMenu')
  let msg
  if (
    ctx.session.targetHours === undefined ||
    ctx.session.targetMinutes === undefined
  ) {
    msg = ctx.i18n.t('main_menu_title_unset')
  } else {
    msg = ctx.i18n.t('main_menu_title_set', {
      timestamp: timestampToStr(
        ctx.session.targetHours,
        ctx.session.targetMinutes
      ),
    })
  }
  await ctx.reply(msg, { reply_markup: mainMenu })
}

const mainMenu = new Menu<Context>('main-menu')
  .text(
    (ctx) => ctx.i18n.t('main_menu_button_set_target'),
    async (ctx) => {
      console.info(`-> main_menu_button_set_target`)
      ctx.session.step = step.await_target
      const msg = ctx.i18n.t('target_provide')
      await reply(ctx, msg)
    }
  )
  .row()
  .text(
    (ctx) => ctx.i18n.t('main_menu_button_progress'),
    async (ctx) => {
      console.info(`-> main_menu_button_progress`)
      const msg = ctx.i18n.t('progress', { days: ctx.session.days })
      await reply(ctx, msg)
    }
  )
  .row()
  .text(
    (ctx) => ctx.i18n.t('main_menu_button_restart'),
    async (ctx) => {
      console.info(`-> main_menu_button_restart`)
      ctx.session.step = step.await_target
      const msg = ctx.i18n.t('welcome_message')
      await reply(ctx, msg)
    }
  )
  .row()

const didKeyboardRU = new InlineKeyboard()
  .text(i18n.t('ru', 'did_keyboard_button_did'), 'did')
  .text(i18n.t('ru', 'did_keyboard_button_didnt'), 'didnt')

const didKeyboardEN = new InlineKeyboard()
  .text(i18n.t('ru', 'did_keyboard_button_did'), 'did')
  .text(i18n.t('ru', 'did_keyboard_button_didnt'), 'didnt')

export async function sendDidKeyboard(userID: string, locale: string) {
  let keyboard, title
  if (locale == 'en') {
    title = i18n.t('en', 'did_keyboard_title')
    keyboard = didKeyboardEN
  } else if (locale == 'ru') {
    title = i18n.t('ru', 'did_keyboard_title')
    keyboard = didKeyboardRU
  } else {
    throw 'unsupported locale'
  }
  await bot.api.sendMessage(userID, title, {
    reply_markup: keyboard,
  })
}

async function updateDays(ctx: Context, succeeded: boolean) {
  const days = ctx.session.days
  let msg

  if (succeeded) {
    const res = days + 1
    ctx.session.days = res
    msg = ctx.i18n.t('today_did', { days: res })
  } else if (days) {
    ctx.session.days = 0
    msg = ctx.i18n.t('today_didnt', { days: days })
  } else {
    msg = ctx.i18n.t('today_never_did')
  }

  await reply(ctx, msg)
}

async function reply(ctx: Context, msg: string) {
  await ctx.reply(msg, { parse_mode: 'HTML' })
}
