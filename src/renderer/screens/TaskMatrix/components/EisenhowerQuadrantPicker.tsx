import {
  EISENHOWER_QUADRANTS,
  resolveQuadrant,
  type EisenhowerFlags,
  type EisenhowerQuadrant,
} from '@shared/tasks/eisenhower'

interface EisenhowerQuadrantPickerProps {
  value: EisenhowerFlags
  skipPriority: boolean
  onChange: (value: EisenhowerFlags, skipPriority: boolean) => void
}

const PICKER_ORDER: Array<Exclude<EisenhowerQuadrant, 'unset'>> = [
  'do_first',
  'schedule',
  'delegate',
  'eliminate',
]

export function EisenhowerQuadrantPicker({
  value,
  skipPriority,
  onChange,
}: EisenhowerQuadrantPickerProps): React.JSX.Element {
  const activeQuadrant = skipPriority ? 'unset' : resolveQuadrant(value)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
          Eisenhower priority
        </span>
        <span className="text-[11px] text-text-muted">Optional — or leave in Inbox</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PICKER_ORDER.map((quadrant) => {
          const meta = EISENHOWER_QUADRANTS[quadrant]
          const active = !skipPriority && activeQuadrant === quadrant
          return (
            <button
              key={quadrant}
              type="button"
              onClick={() =>
                onChange(
                  {
                    isUrgent: quadrant === 'do_first' || quadrant === 'delegate',
                    isImportant: quadrant === 'do_first' || quadrant === 'schedule',
                  },
                  false
                )
              }
              className={`eisenhower-picker-tile rounded-panel px-3 py-3 text-left transition ${
                active ? 'eisenhower-picker-tile-active' : ''
              }`}
              style={
                active
                  ? {
                      borderColor: `${meta.color}88`,
                      boxShadow: `0 0 16px ${meta.color}22`,
                    }
                  : undefined
              }
            >
              <span className="hud-kicker" style={{ color: meta.color }}>
                {meta.shortLabel}
              </span>
              <span className="mt-1 block text-sm font-semibold text-text-primary">{meta.label}</span>
              <span className="mt-0.5 block text-[11px] leading-tight text-text-muted">
                {meta.subtitle}
              </span>
            </button>
          )
        })}
      </div>
      <button
        type="button"
        onClick={() => onChange({ isUrgent: null, isImportant: null }, true)}
        className={`w-full rounded-panel border px-3 py-2 text-left text-sm transition ${
          skipPriority
            ? 'border-accent-cyan/50 bg-accent-cyan/10 text-text-primary'
            : 'border-surface-border text-text-muted hover:text-text-primary'
        }`}
      >
        Inbox — triage later (no priority)
      </button>
    </div>
  )
}
