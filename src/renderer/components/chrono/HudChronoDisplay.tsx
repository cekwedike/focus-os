import { motion, useReducedMotion } from 'framer-motion'
import { getTimezoneLabel } from '@shared/constants/timezones'
import { useDisplayPreferences } from '@renderer/context/DisplayPreferencesContext'
import { useLiveChrono } from '@renderer/hooks/useLiveChrono'
import './hud-chrono.css'

interface HudChronoDisplayProps {
  variant: 'rail' | 'panel'
  showSeconds?: boolean
  footer?: React.ReactNode
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

export function HudChronoDisplay({
  variant,
  showSeconds = true,
  footer,
}: HudChronoDisplayProps): React.JSX.Element {
  const { timezone } = useDisplayPreferences()
  const chrono = useLiveChrono(showSeconds)
  const timezoneTitle = getTimezoneLabel(timezone)

  if (variant === 'panel') {
    return (
      <div className="hud-chrono hud-chrono-panel text-right">
        <p className="hud-chrono-kicker">Chrono Sync</p>
        <time className="block" dateTime={chrono.isoDateTime}>
          <HudTimeDigits time={chrono.time} showSeconds={showSeconds} />
        </time>
        <p className="hud-chrono-meta mt-0.5">
          <span>{chrono.weekday}</span>
          <HudMetaDot />
          <span>{chrono.monthDay}</span>
        </p>
        <p className="hud-chrono-tz mt-1" title={timezoneTitle}>
          <span className="hud-chrono-tz-badge">{chrono.timezoneAbbr}</span>
          {chrono.timezoneOffset ? (
            <span className="hud-chrono-offset">{chrono.timezoneOffset}</span>
          ) : null}
        </p>
        {footer ? <div className="mt-1 text-[10px] text-text-muted">{footer}</div> : null}
      </div>
    )
  }

  return (
    <div className="hud-chrono hud-chrono-rail min-w-0" title={timezoneTitle}>
      <span className="hud-chrono-bracket hud-chrono-bracket-tl" aria-hidden="true" />
      <span className="hud-chrono-bracket hud-chrono-bracket-tr" aria-hidden="true" />
      <span className="hud-chrono-bracket hud-chrono-bracket-bl" aria-hidden="true" />
      <span className="hud-chrono-bracket hud-chrono-bracket-br" aria-hidden="true" />

      <time className="block min-w-0" dateTime={chrono.isoDateTime}>
        <HudTimeDigits time={chrono.time} showSeconds={showSeconds} />
      </time>

      <p className="hud-chrono-meta min-w-0 truncate sm:hidden">
        <span className="hud-chrono-weekday">{chrono.weekday}</span>
        <HudMetaDot />
        <span>{chrono.monthDay}</span>
      </p>

      <p className="hud-chrono-meta hidden min-w-0 truncate sm:block">
        <span className="hud-chrono-weekday">{chrono.weekday}</span>
        <HudMetaDot />
        <span>{chrono.dateLabel}</span>
      </p>

      <p className="hud-chrono-tz hidden sm:flex">
        <span className="hud-chrono-tz-badge">{chrono.timezoneAbbr}</span>
        {chrono.timezoneOffset ? (
          <span className="hud-chrono-offset">{chrono.timezoneOffset}</span>
        ) : null}
      </p>
    </div>
  )
}
