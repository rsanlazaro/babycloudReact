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
// Night = from 21:00 to 05:59 in that clock's own time zone.
// Drives both the dark-gray background and the ☀️/🌙 icon.
const NIGHT_START = 21
const NIGHT_END = 6
const isNight = (date) => {
  const h = date.getHours()
  return h >= NIGHT_START || h < NIGHT_END
}

// 2x2 grid, row by row: LOCAL, MEX / BRA, FRA.
// `theme` is the daytime color; at night every clock switches to `night`.
const CLOCKS = [
  { id: 'local',  label: 'LOCAL', flag: null, timeZone: null,                  theme: 'pink'  },
  { id: 'mexico', label: 'MEX',   flag: 'mx', timeZone: 'America/Mexico_City', theme: 'light' },
  { id: 'brasil', label: 'BRA',   flag: 'br', timeZone: 'America/Sao_Paulo',   theme: 'light' },
  { id: 'france', label: 'FRA',   flag: 'fr', timeZone: 'Europe/Paris',        theme: 'light' },
]

// Small inline SVG flags (12x8). Emoji flags are NOT used on purpose:
// Windows doesn't render them (shows "MX", "BR", "FR" letters instead).
const FLAG_PATHS = {
  mx: (
    <>
      <rect width="4" height="8" fill="#006847" />
      <rect x="4" width="4" height="8" fill="#ffffff" />
      <rect x="8" width="4" height="8" fill="#ce1126" />
      <circle cx="6" cy="4" r="1.2" fill="#8c5a2b" />
    </>
  ),
  br: (
    <>
      <rect width="12" height="8" fill="#009b3a" />
      <polygon points="6,1 11,4 6,7 1,4" fill="#fedf00" />
      <circle cx="6" cy="4" r="1.7" fill="#002776" />
    </>
  ),
  fr: (
    <>
      <rect width="4" height="8" fill="#0055a4" />
      <rect x="4" width="4" height="8" fill="#ffffff" />
      <rect x="8" width="4" height="8" fill="#ef4135" />
    </>
  ),
}

const Flag = ({ code, title }) => (
  <svg
    width="12"
    height="8"
    viewBox="0 0 12 8"
    role="img"
    aria-label={title}
    style={{ flexShrink: 0, borderRadius: '1.5px', display: 'block' }}
  >
    <title>{title}</title>
    {FLAG_PATHS[code]}
    {/* thin outline so the white stripes stay visible on light tiles */}
    <rect x="0.25" y="0.25" width="11.5" height="7.5" rx="1.25" fill="none"
      stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" />
  </svg>
)

const FLAG_TITLES = { mx: 'México', br: 'Brasil', fr: 'Francia' }

const FACE_THEME = {
  // System pink (same variables as the header), white text like the header
  pink:  { bg: 'var(--app-primary)', bezel: 'var(--app-primary-dark)', text: '#ffffff', label: 'rgba(255,255,255,0.85)', shadow: 'rgba(223,69,123,0.30)' },
  light: { bg: '#ffffff', bezel: '#c9c9d1', text: '#1c1c1e', label: '#8e8e93', shadow: 'rgba(0,0,0,0.10)' },
  night: { bg: '#3a3a3c', bezel: '#5a5a5c', text: '#f5f5f7', label: '#c7c7cc', shadow: 'rgba(0,0,0,0.35)' },
}

// One consistent accent color for every offset, regardless of sign — the
// +/- already carries the direction, so color doesn't need to imply
// "ahead = good, behind = bad" (which isn't a meaningful judgment here).
const OFFSET_ACCENT = '#ff9f0a'


// Wide tile for the 2x2 grid: label + day/night + offset on the left,
// big time on the right. A wide tile (not a square) keeps the whole grid
// short, so the menu keeps its space.
const ClockFace = ({ label, flag, date, offset, theme }) => {
  const [hovered, setHovered] = useState(false)
  const night = isNight(date)
  const colors = FACE_THEME[night ? 'night' : theme]
  const { h, m } = formatDigital(date)
  const blinkOn = date.getSeconds() % 2 === 0

  return (
    // Outer layer = the bezel; inner layer = the recessed screen.
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={date.toLocaleString(undefined, {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })}
      style={{
        backgroundColor: colors.bezel,
        borderRadius: '10px',
        padding: '3px',
        minWidth: 0,
        cursor: 'default',
        boxShadow: hovered
          ? `0 6px 14px ${colors.shadow}`
          : `0 2px 6px ${colors.shadow}`,
        transform: hovered ? 'translateY(-2px) scale(1.03)' : 'none',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, background-color 0.6s ease',
      }}
    >
      <div
        style={{
          height: '46px',
          backgroundColor: colors.bg,
          transition: 'background-color 0.6s ease',
          borderRadius: '8px',
          boxShadow: `inset 0 0 4px ${colors.shadow}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 5px',
          gap: '3px',
          minWidth: 0,
        }}
      >
        {/* Left: label alone on top (never truncated), day/night + offset below */}
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, flexShrink: 0 }}>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '0.55rem',
              fontWeight: 600,
              letterSpacing: '0.02em',
              color: colors.label,
              whiteSpace: 'nowrap',
            }}
          >
            {label}
            {flag && <Flag code={flag} title={FLAG_TITLES[flag]} />}
          </span>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              fontSize: '0.55rem',
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
              color: OFFSET_ACCENT,
              minHeight: '0.65rem',
              whiteSpace: 'nowrap',
            }}
          >
            <span aria-hidden="true" style={{ fontSize: '0.5rem' }}>{night ? '🌙' : '☀️'}</span>
            {offset === null ? '' : offset > 0 ? `+${offset}h` : `${offset}h`}
          </span>
        </div>

        {/* Right: time */}
        <time
          dateTime={date.toISOString()}
          style={{
            fontSize: '1.05rem',
            fontWeight: 700,
            color: colors.text,
            lineHeight: 1,
            fontFamily: "'SF Mono', 'Courier New', Consolas, monospace",
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {h}
          <span style={{ opacity: blinkOn ? 1 : 0.25, transition: 'opacity 0.2s linear' }}>:</span>
          {m}
        </time>
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
    <CCard className="sidebar-analog-clock mx-2 mb-2">
      <CCardBody className="p-2 d-flex justify-content-center">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '6px',
            width: '100%',
          }}
        >
          {CLOCKS.map(({ id, label, flag, timeZone, theme }) => {
            const zoneDate = getZonedDate(timeZone)
            return (
              <ClockFace
                key={id}
                label={label}
                flag={flag}
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