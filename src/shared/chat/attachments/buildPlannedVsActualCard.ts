import type { PlannedVsActualCardAttachment, PlannedActualRow } from '@shared/types/chat'
import type { PlannedActualGroup } from '@shared/types/review'

export function buildPlannedVsActualCard(
  groups: PlannedActualGroup[],
  dateLabel: string
): PlannedVsActualCardAttachment {
  const rows: PlannedActualRow[] = groups.map((group) => ({
    id: group.id,
    label: group.label,
    plannedMinutes: group.plannedMinutes,
    actualMinutes: group.actualMinutes,
  }))

  return {
    type: 'planned_vs_actual_card',
    rows,
    dateLabel,
  }
}
