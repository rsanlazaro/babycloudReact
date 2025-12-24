import React, { useEffect, useState } from 'react'
import { CCard, CCardBody } from '@coreui/react'

const SidebarAnalogClock = () => {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const seconds = time.getSeconds()
  const minutes = time.getMinutes()
  const hours = time.getHours() % 12

  const secondDeg = seconds * 6
  const minuteDeg = minutes * 6 + seconds * 0.1
  const hourDeg = hours * 30 + minutes * 0.5

  return (
    <CCard className="sidebar-analog-clock mx-2 mb-3">
      <CCardBody className="p-2 d-flex justify-content-center">
        <div className="analog-clock">
          <div
            className="hand hour"
            style={{ transform: `rotate(${hourDeg}deg)` }}
          />
          <div
            className="hand minute"
            style={{ transform: `rotate(${minuteDeg}deg)` }}
          />
          <div
            className="hand second"
            style={{ transform: `rotate(${secondDeg}deg)` }}
          />
          <div className="center-dot" />
        </div>
      </CCardBody>
    </CCard>
  )
}

export default SidebarAnalogClock