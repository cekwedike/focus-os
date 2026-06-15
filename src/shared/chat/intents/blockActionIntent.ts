import { matchBlockByTitle } from '../parsers/matchBlockTitle'
import { ambiguousBlock } from '../responseTemplates'
import type { BlockActionExtracted, IntentMatch, RouterContext } from '../routerContext'

const CHECK_IN_DEFERRAL_PATTERN = /^done\s+with\s+.+\s+check(?:\s*[- ]?in)?\s*$/i

export function isCheckInDeferralPhrase(input: string): boolean {
  return CHECK_IN_DEFERRAL_PATTERN.test(input.trim())
}

export function matchStartBlockIntent(input: string, context: RouterContext): IntentMatch | null {
  const match = input.trim().match(/\b(starting|start|begin(?:ning)?)\s+(.+)$/i)
  if (!match) {
    return null
  }

  const query = match[2].trim()
  const outcome = matchBlockByTitle(query, context.todayBlocks, ['planned'])

  if (outcome.status === 'none') {
    return null
  }

  if (outcome.status === 'ambiguous') {
    return {
      intent: 'unrecognized',
      ambiguousMessage: ambiguousBlock(outcome.candidates.map((block) => block.title)),
      requiresIpc: false,
    }
  }

  const extracted: BlockActionExtracted = {
    blockId: outcome.block.id,
    title: outcome.block.title,
  }
  return { intent: 'start_block', extracted, requiresIpc: true }
}

export function matchCompleteBlockIntent(input: string, context: RouterContext): IntentMatch | null {
  const trimmed = input.trim()

  if (isCheckInDeferralPhrase(trimmed)) {
    return null
  }

  const earlyMatch = trimmed.match(/^(?:i'?m\s+)?done\s+early$|^mark\s+done$/i)
  if (earlyMatch) {
    const activeBlock = context.todayBlocks.find((block) => block.status === 'active')
    if (!activeBlock) {
      return null
    }

    return {
      intent: 'complete_block',
      extracted: { blockId: activeBlock.id, title: activeBlock.title, early: true },
      requiresIpc: true,
    }
  }

  const match = trimmed.match(/\b(done|finished|complete(?:d)?)\b(?:\s+with\s+(.+))?$/i)
  if (!match) {
    return null
  }

  const query = match[2]?.trim()

  if (!query) {
    const activeBlock = context.todayBlocks.find((block) => block.status === 'active')
    if (!activeBlock) {
      return null
    }

    const extracted: BlockActionExtracted = {
      blockId: activeBlock.id,
      title: activeBlock.title,
    }
    return { intent: 'complete_block', extracted, requiresIpc: true }
  }

  if (/\bcheck(?:\s*[- ]?in)?\s*$/i.test(query)) {
    return null
  }

  const outcome = matchBlockByTitle(query, context.todayBlocks, ['active', 'planned'])
  if (outcome.status === 'none') {
    return null
  }

  if (outcome.status === 'ambiguous') {
    return {
      intent: 'unrecognized',
      ambiguousMessage: ambiguousBlock(outcome.candidates.map((block) => block.title)),
      requiresIpc: false,
    }
  }

  const extracted: BlockActionExtracted = {
    blockId: outcome.block.id,
    title: outcome.block.title,
  }
  return { intent: 'complete_block', extracted, requiresIpc: true }
}
