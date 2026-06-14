import type { ProtectedBlockRow } from '@shared/types/db'
import { SettingsSectionCard } from '@renderer/components/ui/SettingsSectionCard'
import { ProtectedBlockEditor } from './ProtectedBlockEditor'
import { ROUTINE_GROUPS } from './settingsCopy'

interface ProtectedBlocksSectionProps {
  protectedBlocks: ProtectedBlockRow[]
  onProtectedBlocksChange: (blocks: ProtectedBlockRow[]) => void
}

export function ProtectedBlocksSection({
  protectedBlocks,
  onProtectedBlocksChange,
}: ProtectedBlocksSectionProps): React.JSX.Element {
  return (
    <SettingsSectionCard
      title="Daily Routine"
      description="Set morning, afternoon, and evening habits that happen before or around your client work."
    >
      <div className="space-y-6">
        {ROUTINE_GROUPS.map((group) => {
          const blocks = protectedBlocks
            .filter((block) => group.blockTypes.includes(block.block_type))
            .sort((left, right) => left.sort_order - right.sort_order)

          return (
            <section key={group.id} className="space-y-3">
              <div>
                <h4 className="text-base font-semibold text-text-primary">{group.title}</h4>
                <p className="mt-1 text-sm text-text-muted">{group.description}</p>
              </div>
              {blocks.length === 0 ? (
                <p className="text-sm text-text-muted">No routines in this section yet.</p>
              ) : (
                blocks.map((block) => (
                  <ProtectedBlockEditor
                    key={block.id}
                    block={block}
                    onSave={async (updated) => {
                      onProtectedBlocksChange(
                        protectedBlocks.map((item) => (item.id === updated.id ? updated : item))
                      )
                    }}
                  />
                ))
              )}
            </section>
          )
        })}
      </div>
    </SettingsSectionCard>
  )
}
