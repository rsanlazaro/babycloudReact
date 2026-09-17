import React, { useEffect, useState } from 'react'
import { CCard, CCardBody } from '@coreui/react'

// Reconstructs "now" as if it were wall-clock time in `timeZone` — the
// classic toLocaleString round-trip trick. Both this and the plain `new
// Date()` for LOCAL get parsed under the browser's own local zone, so the
// zone-to-zone shift cancels out and the epoch DIFFERENCE between any two
// of these still correctly reflects their wall-clock offset from each
// other — that's what getOffsetHours below relies on.
const getZonedDate = (timeZone) =>
  timeZone ? new Date(new Date().toLocaleString('en-US', { timeZone })) : new Date()

// "17:09" / "1:09" — no leading zero on the hour, matching the reference
// design; minutes always 2 digits.
const formatDigital = (date) => {
  const h = date.getHours()
  const m = date.getMinutes().toString().padStart(2, '0')
  return { h, m }
}

// Whole-hour difference from LOCAL time, signed ("-3", "+5"). Half-hour
// zones would round here — none of the four below need it, but flagging
// in case a future zone does.
const getOffsetHours = (zoneDate, localDate) => {
  const diffHours = (zoneDate.getTime() - localDate.getTime()) / (60 * 60 * 1000)
  return Math.round(diffHours)
}

// Day (sun) vs night (moon) at that location — the one piece of info a
// world clock actually needs to answer at a glance: "is it a reasonable
// hour to call them?" 6:00-19:59 counts as day.
const isDaytime = (date) => {
  const h = date.getHours()
  return h >= 6 && h < 20
}

// Short local zone abbreviation (e.g. "CST", "GMT-6") instead of a
// hardcoded "LOCAL" label, so the home face is actually informative too.
const getLocalZoneLabel = (date) => {
  try {
    const parts = new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' }).formatToParts(date)
    const zonePart = parts.find((p) => p.type === 'timeZoneName')
    return zonePart ? zonePart.value.toUpperCase() : 'LOCAL'
  } catch {
    return 'LOCAL'
  }
}

// Left to right: Local, Mexico City, Rio de Janeiro, Paris.
const CLOCKS = [
  { id: 'local',  label: null,   timeZone: null,                  theme: 'light' },
  { id: 'mexico', label: 'DF',   timeZone: 'America/Mexico_City', theme: 'light' },
  { id: 'brasil', label: 'RDJ',  timeZone: 'America/Sao_Paulo',   theme: 'dark'  },
  { id: 'france', label: 'PAR',  timeZone: 'Europe/Paris',        theme: 'dark'  },
]

const FACE_THEME = {
  light: { bg: '#fbfbfd', bezel: '#c9c9d1', text: '#1c1c1e', label: '#8e8e93', shadow: 'rgba(0,0,0,0.10)' },
  dark:  { bg: '#161616', bezel: '#5a5a5c', text: '#f5f5f7', label: '#a1a1a6', shadow: 'rgba(0,0,0,0.45)' },
}

// One consistent accent color for every offset, regardless of sign — the
// +/- already carries the direction, so color doesn't need to imply
// "ahead = good, behind = bad" (which isn't a meaningful judgment here).
const OFFSET_ACCENT = '#ff9f0a'


const ClockFace = ({ label, date, offset, theme }) => {
  const [hovered, setHovered] = useState(false)
  const colors = FACE_THEME[theme]
  const { h, m } = formatDigital(date)
  const blinkOn = date.getSeconds() % 2 === 0
  const daytime = isDaytime(date)

  return (
    // Outer layer = the metallic case/bezel, flat solid color. The visible
    // "ring" is just the padding around the inner screen div showing that
    // bezel color through.
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={date.toLocaleString(undefined, {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })}
      style={{
        position: 'relative',
        backgroundColor: colors.bezel,
        borderRadius: '12px',
        aspectRatio: '1 / 1',
        padding: '3px',
        cursor: 'default',
        boxShadow: hovered
          ? `0 6px 14px ${colors.shadow}`
          : `0 2px 6px ${colors.shadow}`,
        transform: hovered ? 'translateY(-2px) scale(1.03)' : 'none',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      {/* Inner layer = the actual screen, recessed inside the bezel via
          an inset shadow so it reads as sunken glass, not flush with the case. */}
      <div
        style={{
          position: 'relative',
          height: '100%',
          backgroundColor: colors.bg,
          borderRadius: '10px',
          boxShadow: `inset 0 0 4px ${colors.shadow}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3px',
        }}
      >
        {/* Day/night indicator */}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '2px',
            right: '4px',
            fontSize: '0.45rem',
            lineHeight: 1,
            opacity: 0.85,
          }}
        >
          {daytime ? '☀️' : '🌙'}
        </span>

        <div
          style={{
            fontSize: '0.4rem',
            fontWeight: 600,
            letterSpacing: '0.04em',
            color: colors.label,
            minHeight: '0.5rem',
          }}
        >
          {label}
        </div>

        <time
          dateTime={date.toISOString()}
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: colors.text,
            lineHeight: 1.1,
            fontFamily: "'SF Mono', 'Courier New', Consolas, monospace",
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.01em',
          }}
        >
          {h}
          <span style={{ opacity: blinkOn ? 1 : 0.25, transition: 'opacity 0.2s linear' }}>:</span>
          {m}
        </time>

        <div
          style={{
            fontSize: '0.42rem',
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            color: offset === null ? colors.label : OFFSET_ACCENT,
            minHeight: '0.5rem',
          }}
        >
          {offset === null ? '' : offset > 0 ? `+${offset}` : offset}
        </div>
      </div>
    </div>
  )
}

const SidebarAnalogClock = () => {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const localDate = new Date()

  return (
    <CCard className="sidebar-analog-clock mx-2 mb-3">
      <CCardBody className="p-2 d-flex justify-content-center">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '6px',
            width: '100%',
            maxWidth: '250px',
          }}
        >
          {CLOCKS.map(({ id, label, timeZone, theme }) => {
            const zoneDate = getZonedDate(timeZone)
            return (
              <ClockFace
                key={id}
                label={label || getLocalZoneLabel(zoneDate)}
                date={zoneDate}
                offset={timeZone ? getOffsetHours(zoneDate, localDate) : null}
                theme={theme}
              />
            )
          })}
        </div>
      </CCardBody>
    </CCard>
  )
}

export default SidebarAnalogClock