import React, { useEffect, useState } from 'react'
import { CCard, CCardBody } from '@coreui/react'

const getMexicoCityTime = () =>
  new Date(
    new Date().toLocaleString('en-US', {
      timeZone: 'America/Mexico_City',
    })
  )

const SidebarAnalogClock = () => {
  const [time, setTime] = useState(getMexicoCityTime())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(getMexicoCityTime())
    }, 1000)

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
          {/* Hour marks */}
          {[...Array(12)].map((_, i) => (
            <span
              key={`h-${i}`}
              className="hour-mark"
              style={{ transform: `rotate(${i * 30}deg)` }}
            />
          ))}

          {/* Minute marks */}
          {[...Array(60)].map((_, i) => (
            <span
              key={`m-${i}`}
              className="minute-mark"
              style={{ transform: `rotate(${i * 6}deg)` }}
            />
          ))}

          {/* Hands */}
          <div
            className="hand hour"
            style={{ transform: `translateX(-50%) rotate(${hourDeg}deg)` }}
          />

          <div
            className="hand minute"
            style={{ transform: `translateX(-50%) rotate(${minuteDeg}deg)` }}
          />

          <div
            className="hand second"
            style={{ transform: `translateX(-50%) rotate(${secondDeg}deg)` }}
          />
          <div className="center-dot" />
        </div>
      </CCardBody>
    </CCard>
  )
}

export default SidebarAnalogClock
