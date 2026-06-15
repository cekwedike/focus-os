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
  allowEmpty?: boolean
}

function TwelveHourTimeInput({
  value,
  onChange,
  disabled = false,
  allowEmpty = false,
}: TimeInputProps): React.JSX.Element {
  const hasValue = Boolean(value && /^\d{2}:\d{2}$/.test(value))
  const { hours24, minutes } = hasValue ? parseHHMM(value) : { hours24: 0, minutes: 0 }
  const { hour12, period } = to12HourParts(hours24)

  const update = (nextHour12: number, nextMinutes: number, nextPeriod: 'AM' | 'PM'): void => {
    onChange(from12HourParts(nextHour12, nextMinutes, nextPeriod))
  }

  const selectClassName = 'focus-input !w-auto'

  if (allowEmpty && !hasValue) {
    return (
      <div className="flex flex-wrap gap-2">
        <select
          aria-label="Hour"
          disabled={disabled}
          value=""
          onChange={(event) => {
            if (event.target.value) {
              update(Number(event.target.value), 0, 'AM')
            }
          }}
          className={selectClassName}
        >
          <option value="">Hour</option>
          {Array.from({ length: 12 }, (_, index) => index + 1).map((hour) => (
            <option key={hour} value={hour}>
              {hour}
            </option>
          ))}
        </select>
        <select
          aria-label="Minute"
          disabled={disabled}
          value=""
          onChange={(event) => {
            if (event.target.value) {
              update(9, Number(event.target.value), 'AM')
            }
          }}
          className={selectClassName}
        >
          <option value="">Min</option>
          {Array.from({ length: 60 }, (_, index) => index).map((minute) => (
            <option key={minute} value={minute}>
              {String(minute).padStart(2, '0')}
            </option>
          ))}
        </select>
        <select
          aria-label="AM or PM"
          disabled={disabled}
          value=""
          onChange={(event) => {
            if (event.target.value) {
              update(9, 0, event.target.value as 'AM' | 'PM')
            }
          }}
          className={selectClassName}
        >
          <option value="">AM/PM</option>
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    )
  }

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

export function TimeInput({
  value,
  onChange,
  disabled = false,
  allowEmpty = false,
}: TimeInputProps): React.JSX.Element {
  const { timeFormat } = useDisplayPreferences()
  const hasValue = Boolean(value && /^\d{2}:\d{2}$/.test(value))

  if (timeFormat === '12h') {
    return (
      <TwelveHourTimeInput
        value={value}
        onChange={onChange}
        disabled={disabled}
        allowEmpty={allowEmpty}
      />
    )
  }

  if (allowEmpty && !hasValue) {
    return (
      <input
        type="time"
        value=""
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="focus-input"
      />
    )
  }

  const safeValue = hasValue ? value : '09:00'

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
