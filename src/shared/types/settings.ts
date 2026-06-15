export type TimeFormat = '12h' | '24h'
export type WeekStartDay = 'sunday' | 'monday'
export type DateFormatStyle = 'mdy' | 'dmy' | 'ymd'

export interface NotificationPreferences {
  microBreak: boolean
  staleness: boolean
  insightReady: boolean
  clientReminder: boolean
}

export interface AppSettings {
  openrouterModel: string
  ollamaEndpoint: string
  ollamaModel: string
  defaultStalenessHours: number
  microBreakIntervalMinutes: number
  minViableBlockMinutes: number
  defaultBufferPercent: number
  doomscrollAllowanceMinutes: number
  timeFormat: TimeFormat
  weekStartsOn: WeekStartDay
  dateFormat: DateFormatStyle
  defaultSleepTime: string
  timezone: string
  notifications: NotificationPreferences
  themeAccent: string
  onboardingComplete: boolean
  userDisplayName: string
  sidebarExpanded: boolean
  launchAtLogin: boolean
  trayCloseTipShown: boolean
}

export type AppSettingsUpdate = Partial<AppSettings>

export interface SettingsGetResponse {
  settings: AppSettings
  openrouterKeyConfigured: boolean
}

export interface OpenRouterKeyStatusResponse {
  configured: boolean
}

export interface SetOpenRouterKeyPayload {
  apiKey: string
}

export type DisplayPreferences = Pick<
  AppSettings,
  'timeFormat' | 'weekStartsOn' | 'dateFormat' | 'defaultSleepTime' | 'timezone'
>
