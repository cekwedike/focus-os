import { motion, useReducedMotion } from 'framer-motion'
import { getTimezoneLabel } from '@shared/constants/timezones'
import { resolveTimezoneDisplay } from '@shared/utils/displayTime'
import { useDisplayPreferences } from '@renderer/context/DisplayPreferencesContext'
import { useLiveChrono } from '@renderer/hooks/useLiveChrono'
import './hud-chrono.css'

interface HudChronoDisplayProps {
  showSeconds?: boolean
}

function HudTimeDigits({
  time,
  showSeconds,
}: {
  time: string
  showSeconds: boolean
}): React.JSX.Element {
  const reduceMotion = useReducedMotion()

  if (!showSeconds) {
    return <span className="hud-chrono-time">{time}</span>
  }

  const match = /^(.+:\d{2})(:\d{2})(.*)$/.exec(time)
  if (!match) {
    return <span className="hud-chrono-time">{time}</span>
  }

  return (
    <span className="hud-chrono-time">
      <span>{match[1]}</span>
      <motion.span
        className="hud-chrono-seconds"
        aria-hidden="true"
        animate={reduceMotion ? undefined : { opacity: [1, 0.35, 1] }}
        transition={reduceMotion ? undefined : { duration: 1, repeat: Infinity, ease: 'easeInOut' }}
      >
        {match[2]}
      </motion.span>
      <span>{match[3]}</span>
    </span>
  )
}

function HudMetaDot(): React.JSX.Element {
  return <span className="hud-chrono-dot" aria-hidden="true" />
}

export function HudChronoDisplay({ showSeconds = true }: HudChronoDisplayProps): React.JSX.Element {
  const { timezone } = useDisplayPreferences()
  const chrono = useLiveChrono(showSeconds)
  const timezoneTitle = getTimezoneLabel(timezone)
  const timezoneDisplay = resolveTimezoneDisplay(chrono.timezoneAbbr, chrono.timezoneOffset)

  return (
    <div className="hud-chrono hud-chrono-rail min-w-0" title={timezoneTitle}>
      <span className="hud-chrono-bracket hud-chrono-bracket-tl" aria-hidden="true" />
      <span className="hud-chrono-bracket hud-chrono-bracket-tr" aria-hidden="true" />
      <span className="hud-chrono-bracket hud-chrono-bracket-bl" aria-hidden="true" />
      <span className="hud-chrono-bracket hud-chrono-bracket-br" aria-hidden="true" />

      <time className="block min-w-0" dateTime={chrono.isoDateTime}>
        <HudTimeDigits time={chrono.time} showSeconds={showSeconds} />
      </time>

      <p className="hud-chrono-meta min-w-0 truncate">
        <span className="hud-chrono-weekday">{chrono.weekday}</span>
        <HudMetaDot />
        <span className="sm:hidden">{chrono.monthDay}</span>
        <span className="hidden sm:inline">{chrono.dateLabel}</span>
      </p>

      {timezoneDisplay ? (
        <p className="hud-chrono-tz">
          <span className="hud-chrono-tz-badge">{timezoneDisplay}</span>
        </p>
      ) : null}
    </div>
  )
}
