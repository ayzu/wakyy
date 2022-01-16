import { Context as BaseContext, SessionFlavor } from 'grammy'
import { I18n, I18nContextFlavor } from '@grammyjs/i18n'

export enum step {
  'idle',
  'await_target',
  'await_timezone',
}

export interface SessionData {
  step: step
  days: number

  offset?: number

  targetHours?: number
  targetMinutes?: number

  targetHoursUTC?: number
}

export function initialSession(): SessionData {
  return { step: step.idle, days: 0 }
}

export type Context = BaseContext &
  I18nContextFlavor &
  SessionFlavor<SessionData>
export const i18n = new I18n({
  defaultLanguage: 'en',
  directory: 'locales',
  useSession: true,
})
