import React, { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import CIcon from '@coreui/icons-react'
import { cilChevronTop } from '@coreui/icons'

const STORAGE_KEY = 'sidebarCalendarOpen'

// "Lunes, 28 de septiembre"
const formatHeader = (date) =>
  date
    .toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    .replace(/^./, (c) => c.toUpperCase())

/**
 * Windows 11–style calendar: the header (today's date + chevron) is always
 * visible at the bottom of the sidebar. Clicking it expands the full month
 * view; clicking again collapses it. The open/closed state is remembered.
 */
const SidebarCalendar = () => {
  const [date, setDate] = useState(new Date())
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })
  // Bumped on every open, so the calendar always reopens on the current month
  const [openCount, setOpenCount] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev
      if (next) setOpenCount((c) => c + 1)
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        /* storage unavailable — state still works for this session */
      }
      return next
    })
  }

  return (
    <div className={`sidebar-calendar mx-2 mb-3 ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className="sidebar-calendar__header"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="sidebar-calendar-panel"
        title={open ? 'Ocultar calendario' : 'Mostrar calendario'}
      >
        <span className="sidebar-calendar__date">{formatHeader(date)}</span>
        <CIcon icon={cilChevronTop} className="sidebar-calendar__chevron" />
      </button>

      <div id="sidebar-calendar-panel" className="sidebar-calendar__panel" aria-hidden={!open}>
        <div className="sidebar-calendar__panel-inner">
          <Calendar
            key={openCount}
            value={date}
            locale="es-ES"
            calendarType="iso8601"
            showNeighboringMonth={false}
            navigationLabel={({ date }) =>
              date
                .toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
                .replace(/^./, (c) => c.toUpperCase())
            }
          />
        </div>
      </div>
    </div>
  )
}

export default SidebarCalendar