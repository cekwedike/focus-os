export type TimeFormat = '12h' | '24h'
export type WeekStartDay = 'sunday' | 'monday'
export type DateFormatStyle = 'mdy' | 'dmy' | 'ymd'

export interface NotificationPreferences {
  microBreak: boolean
  staleness: boolean
  insightReady: boolean
  clientReminder: boolean
  blockReminder: boolean
  assistantBriefing: boolean
  preMeeting: boolean
}

export interface AssistantPreferences {
  morningEnabled: boolean
  hourlyEnabled: boolean
  preMeetingEnabled: boolean
  morningHour: number
}

export interface GoogleIntegrationSettings {
  syncIntervalMinutes: number
  calendarIds: string[]
  gmailEnabled: boolean
  calendarEnabled: boolean
}

export interface AppSettings {
  openrouterModel: string
  openrouterFreeModels: string[]
  ollamaEndpoint: string
  ollamaModel: string
  voiceInputEnabled: boolean
  voiceOutputEnabled: boolean
  defaultStalenessHours: number
  microBreakIntervalMinutes: number
  minViableBlockMinutes: number
  defaultBufferPercent: number
  maxBufferMinutes: number
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
  googleSyncIntervalMinutes: number
  assistant: AssistantPreferences
  google: GoogleIntegrationSettings
  freelancerWizardComplete: boolean
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
