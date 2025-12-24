import React, { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { CCard, CCardBody } from '@coreui/react'

const SidebarCalendar = () => {
    const [date, setDate] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setDate(new Date()), 60000)
        return () => clearInterval(timer)
    }, [])

    return (
        <CCard className="sidebar-calendar mx-2 mb-3">
            <CCardBody className="p-2">
                <Calendar
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
            </CCardBody>
        </CCard>
    )
}

export default SidebarCalendar