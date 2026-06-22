export type ExternalProvider = 'google'

export interface ExternalAccountRow {
  id: number
  provider: ExternalProvider
  account_email: string
  scopes: string
  token_key_ref: string
  calendar_ids_json: string | null
  gmail_enabled: number
  calendar_enabled: number
  last_sync_at: string | null
  created_at: string
  updated_at: string
}

export interface CalendarEventRow {
  id: number
  external_id: string
  account_id: number
  calendar_id: string
  title: string
  start_at: string
  end_at: string
  is_all_day: number
  attendees_json: string | null
  location: string | null
  synced_at: string
}

export interface EmailMessageRow {
  id: number
  external_id: string
  account_id: number
  thread_id: string | null
  subject: string
  from_address: string
  received_at: string
  snippet: string | null
  is_read: number
  is_actionable: number | null
  triage_summary: string | null
  suggested_client_id: number | null
  suggested_priority: number | null
  suggested_deadline: string | null
  linked_task_id: number | null
  synced_at: string
}

export type BriefingType = 'morning' | 'hourly' | 'pre_meeting' | 'block_start'

export interface AssistantBriefingRow {
  id: number
  briefing_type: BriefingType
  schedule_date: string | null
  generated_at: string
  content_md: string
  snapshot_json: string | null
  provider: string
}

export interface GoogleConnectionStatus {
  connected: boolean
  accountEmail: string | null
  gmailEnabled: boolean
  calendarEnabled: boolean
  lastSyncAt: string | null
  configured: boolean
}

export interface ExternalDaySummary {
  nextCalendarEvent: {
    id: number
    title: string
    startAt: string
    endAt: string
    location: string | null
  } | null
  actionableEmailCount: number
  upcomingEventsToday: number
  scheduleConflicts: Array<{
    blockTitle: string
    eventTitle: string
    overlapStart: string
    overlapEnd: string
  }>
}

export interface SuggestedEmailTask {
  emailId: number
  subject: string
  fromAddress: string
  snippet: string | null
  suggestedTitle: string
  suggestedClientId: number | null
  suggestedClientName: string | null
  suggestedPriority: number
  suggestedDeadline: string | null
  triageSummary: string
}

export interface MeetingSlotSuggestion {
  startAt: string
  endAt: string
  score: number
  reason: string
}

export interface FindMeetingSlotsPayload {
  durationMinutes: number
  scheduleDate: string
  preferredStartHour?: number
  preferredEndHour?: number
}

export interface FindMeetingSlotsResponse {
  slots: MeetingSlotSuggestion[]
}

export interface ProposedAction {
  id: string
  label: string
  intent: string
  payload: Record<string, unknown>
  description?: string
}
