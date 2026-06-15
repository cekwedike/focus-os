import { matchBlockByTitle } from '../parsers/matchBlockTitle'
import { ambiguousBlock } from '../responseTemplates'
import type { BlockActionExtracted, IntentMatch, RouterContext } from '../routerContext'

export function matchExtendBlockIntent(input: string, context: RouterContext): IntentMatch | null {
  const trimmed = input.trim()

  const genericExtend =
    /^(?:extend\s*\+?\s*5|extend\s+by\s+5|give\s+me\s+5\s+more\s+minutes)$/i.test(trimmed) ||
    /^extend(?:\s+this)?\s+by\s+5$/i.test(trimmed)

  if (genericExtend) {
    const activeBlock = context.todayBlocks.find((block) => block.status === 'active')
    if (!activeBlock) {
      return {
        intent: 'unrecognized',
        ambiguousMessage: 'No active block to extend right now.',
        requiresIpc: false,
      }
    }

    const extracted: BlockActionExtracted = {
      blockId: activeBlock.id,
      title: activeBlock.title,
    }
    return { intent: 'extend_block', extracted, requiresIpc: true }
  }

  const namedMatch = trimmed.match(/^extend\s+(.+?)\s+by\s+5$/i)
  if (!namedMatch) {
    return null
  }

  const query = namedMatch[1].trim()
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
  return { intent: 'extend_block', extracted, requiresIpc: true }
}

export function matchSkipBlockIntent(input: string, context: RouterContext): IntentMatch | null {
  const trimmed = input.trim()

  const genericSkip = /^(?:skip\s+this|skip)$/i.test(trimmed)
  if (genericSkip) {
    const activeBlock = context.todayBlocks.find((block) => block.status === 'active')
    if (!activeBlock) {
      return {
        intent: 'unrecognized',
        ambiguousMessage: 'No active block to skip right now.',
        requiresIpc: false,
      }
    }

    const extracted: BlockActionExtracted = {
      blockId: activeBlock.id,
      title: activeBlock.title,
    }
    return { intent: 'skip_block', extracted, requiresIpc: true }
  }

  const namedMatch = trimmed.match(/^skip\s+(.+)$/i)
  if (!namedMatch) {
    return null
  }

  const query = namedMatch[1].trim()
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
  return { intent: 'skip_block', extracted, requiresIpc: true }
}
