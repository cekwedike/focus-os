import { matchBlockByTitle } from '../parsers/matchBlockTitle'
import { ambiguousBlock } from '../responseTemplates'
import type { BlockActionExtracted, IntentMatch, RouterContext } from '../routerContext'

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
  const match = input.trim().match(/\b(done|finished|complete(?:d)?)\b(?:\s+with\s+(.+))?$/i)
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
