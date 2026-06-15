import type { AllocationOutput } from '@shared/allocation/types'
import { useDisplayPreferences } from '@renderer/context/DisplayPreferencesContext'

interface AllocationPreviewListProps {
  preview: AllocationOutput
}

export function AllocationPreviewList({ preview }: AllocationPreviewListProps): React.JSX.Element {
  const { formatHHMM } = useDisplayPreferences()

  return (
    <div className="focus-panel p-4">
      <h3 className="text-sm font-semibold text-text-primary">Allocation Preview</h3>
      {preview.warnings.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-amber-300">
          {preview.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
      <ol className="mt-3 space-y-2">
        {preview.blocks.map((block) => (
          <li
            key={block.tempId}
            className="focus-subpanel px-3 py-2 text-sm"
          >
            <span className="font-mono text-xs text-text-muted">
              {formatHHMM(block.plannedStart.slice(11, 16))} - {formatHHMM(block.plannedEnd.slice(11, 16))}
            </span>
            <span className="ml-2 text-text-primary">{block.title}</span>
            <span className="ml-2 text-xs text-text-muted">({block.blockType})</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
