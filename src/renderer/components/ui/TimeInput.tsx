import { useDisplayPreferences } from '@renderer/context/DisplayPreferencesContext'
import {
  from12HourParts,
  parseHHMM,
  to12HourParts,
} from '@shared/utils/displayTime'

interface TimeInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

function TwelveHourTimeInput({
  value,
  onChange,
  disabled = false,
}: TimeInputProps): React.JSX.Element {
  const { hours24, minutes } = parseHHMM(value || '00:00')
  const { hour12, period } = to12HourParts(hours24)

  const update = (nextHour12: number, nextMinutes: number, nextPeriod: 'AM' | 'PM'): void => {
    onChange(from12HourParts(nextHour12, nextMinutes, nextPeriod))
  }

  const selectClassName = 'focus-input !w-auto'

  return (
    <div className="flex flex-wrap gap-2">
      <select
        aria-label="Hour"
        disabled={disabled}
        value={hour12}
        onChange={(event) => update(Number(event.target.value), minutes, period)}
        className={selectClassName}
      >
        {Array.from({ length: 12 }, (_, index) => index + 1).map((hour) => (
          <option key={hour} value={hour}>
            {hour}
          </option>
        ))}
      </select>
      <select
        aria-label="Minute"
        disabled={disabled}
        value={minutes}
        onChange={(event) => update(hour12, Number(event.target.value), period)}
        className={selectClassName}
      >
        {Array.from({ length: 60 }, (_, index) => index).map((minute) => (
          <option key={minute} value={minute}>
            {String(minute).padStart(2, '0')}
          </option>
        ))}
      </select>
      <select
        aria-label="AM or PM"
        disabled={disabled}
        value={period}
        onChange={(event) => update(hour12, minutes, event.target.value as 'AM' | 'PM')}
        className={selectClassName}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  )
}

export function TimeInput({ value, onChange, disabled = false }: TimeInputProps): React.JSX.Element {
  const { timeFormat } = useDisplayPreferences()
  const safeValue = value && /^\d{2}:\d{2}$/.test(value) ? value : '09:00'

  if (timeFormat === '12h') {
    return <TwelveHourTimeInput value={safeValue} onChange={onChange} disabled={disabled} />
  }

  return (
    <input
      type="time"
      value={safeValue}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className="focus-input"
    />
  )
}
