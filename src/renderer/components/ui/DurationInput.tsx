import { NumberInput } from './NumberInput'

interface DurationInputProps {
  valueMinutes: number
  onChange: (totalMinutes: number) => void
  disabled?: boolean
  minTotalMinutes?: number
  maxHours?: number
}

function splitMinutes(totalMinutes: number): { hours: number; minutes: number } {
  const safe = Math.max(0, Math.floor(totalMinutes))
  return {
    hours: Math.floor(safe / 60),
    minutes: safe % 60,
  }
}

export function DurationInput({
  valueMinutes,
  onChange,
  disabled = false,
  minTotalMinutes = 0,
  maxHours = 24,
}: DurationInputProps): React.JSX.Element {
  const { hours, minutes } = splitMinutes(valueMinutes)

  const updateHours = (nextHours: number): void => {
    const clampedHours = Math.max(0, Math.min(maxHours, nextHours))
    const total = clampedHours * 60 + minutes
    onChange(Math.max(minTotalMinutes, total))
  }

  const updateMinutes = (nextMinutes: number): void => {
    const clampedMinutes = Math.max(0, Math.min(59, nextMinutes))
    const total = hours * 60 + clampedMinutes
    onChange(Math.max(minTotalMinutes, total))
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5">
        <NumberInput
          value={hours}
          min={0}
          max={maxHours}
          disabled={disabled}
          onChange={updateHours}
        />
        <span className="text-xs text-text-muted">hr</span>
      </div>
      <div className="flex items-center gap-1.5">
        <NumberInput
          value={minutes}
          min={0}
          max={59}
          disabled={disabled}
          onChange={updateMinutes}
        />
        <span className="text-xs text-text-muted">min</span>
      </div>
    </div>
  )
}

export function formatDurationLabel(totalMinutes: number): string {
  const { hours, minutes } = splitMinutes(totalMinutes)
  if (hours === 0) {
    return `${minutes} min`
  }
  if (minutes === 0) {
    return `${hours} hr`
  }
  return `${hours} hr ${minutes} min`
}
