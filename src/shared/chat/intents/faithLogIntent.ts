import type { FaithLogExtracted, IntentMatch, RouterContext } from '../routerContext'

function resolveFaithBlockId(context: RouterContext): number | null {
  if (context.conversation.activeFaithBlockId) {
    return context.conversation.activeFaithBlockId
  }

  const faithBlock = context.todayBlocks.find(
    (block) =>
      block.block_type === 'protected' &&
      block.protected_subtype === 'faith' &&
      block.status !== 'completed'
  )

  return faithBlock?.id ?? null
}

export function matchFaithLogIntent(input: string, context: RouterContext): IntentMatch | null {
  const faithBlockId = resolveFaithBlockId(context)
  const hasFaithContext =
    faithBlockId !== null ||
    context.todayBlocks.some(
      (block) =>
        block.block_type === 'protected' &&
        block.protected_subtype === 'faith' &&
        block.status === 'active'
    )

  if (!hasFaithContext) {
    return null
  }

  const readingMatch = input.trim().match(/\breading\s+(.+)$/i)
  if (readingMatch) {
    const extracted: FaithLogExtracted = {
      bibleReference: readingMatch[1].trim(),
      blockId: faithBlockId ?? undefined,
    }
    return { intent: 'faith_log', extracted, requiresIpc: true }
  }

  const prayerMatch = input.trim().match(/\bpraying about\s+(.+)$/i)
  if (prayerMatch) {
    const extracted: FaithLogExtracted = {
      prayerNotes: prayerMatch[1].trim(),
      blockId: faithBlockId ?? undefined,
    }
    return { intent: 'faith_log', extracted, requiresIpc: true }
  }

  return null
}
