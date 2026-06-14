export const INSIGHT_SYSTEM_PROMPT =
  'You are a calm, encouraging executive assistant helping a freelancer start their day.'

export function buildInsightUserPrompt(snapshotJson: string): string {
  return `Given the JSON snapshot below, write a brief morning briefing in markdown with these sections:

1. Today at a glance: a few sentences on today's schedule (blocks, clients, key tasks).
2. Staleness flags: call out any clients that need attention, or say none.
3. Faith streak: current streak and whether today's entry is logged yet.
4. Yesterday in brief: planned vs actual highlights from the snapshot.
5. Suggestions: two or three concrete, actionable suggestions for today.

Rules:
- Use only facts present in the snapshot. Do not invent clients, tasks, or numbers.
- Keep the tone warm, practical, and concise (roughly 150 to 250 words).
- Do not mention that you are an AI or reference the JSON format.
- Use markdown headings or bullet lists where helpful.

Snapshot JSON:
${snapshotJson}`
}

export const AI_TEST_PROMPT = 'Reply with OK'
