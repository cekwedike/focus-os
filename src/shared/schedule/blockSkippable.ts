import type { DailyScheduleRow, ProtectedBlockRow, ProtectedBlockType } from '@shared/types/db'

export function defaultSkippableForBlockType(blockType: ProtectedBlockType): boolean {
  return blockType === 'meal' || blockType === 'micro_break'
}

export function isBlockSkippable(
  block: Pick<DailyScheduleRow, 'block_type' | 'protected_subtype'>,
  protectedTemplates: ProtectedBlockRow[]
): boolean {
  if (block.block_type === 'fixed_client' || block.block_type === 'weighted_client') {
    return true
  }

  if (block.block_type === 'buffer' || block.block_type === 'break') {
    return false
  }

  if (block.block_type === 'protected') {
    const subtype = block.protected_subtype as ProtectedBlockType | null
    if (!subtype) {
      return false
    }

    const template = protectedTemplates.find((row) => row.block_type === subtype)
    if (template) {
      return template.skippable === 1
    }

    return defaultSkippableForBlockType(subtype)
  }

  return false
}
