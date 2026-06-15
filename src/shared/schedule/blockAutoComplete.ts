export interface AutoCompletableBlock {
  status: string
  block_type: string
  protected_subtype: string | null
  planned_end: string
}

export function isFaithBlock(block: Pick<AutoCompletableBlock, 'block_type' | 'protected_subtype'>): boolean {
  return block.block_type === 'protected' && block.protected_subtype === 'faith'
}

export function shouldAutoCompleteBlock(block: AutoCompletableBlock, nowMs: number): boolean {
  if (block.status !== 'active') {
    return false
  }

  if (isFaithBlock(block)) {
    return false
  }

  const plannedEndMs = new Date(block.planned_end).getTime()
  if (Number.isNaN(plannedEndMs)) {
    return false
  }

  return nowMs >= plannedEndMs
}
