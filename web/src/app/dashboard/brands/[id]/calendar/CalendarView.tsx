'use client'

import React, { useState } from 'react'

type Event = {
  id: string;
  campaignName: string;
  channel: string;
  status: string;
  date: string;
  isPublished: boolean;
}

export default function CalendarView({ initialEvents }: { initialEvents: Event[] }) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const blanks = Array.from({ length: firstDay }, (_, i) => i)

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const getEventsForDay = (day: number) => {
    return initialEvents.filter(e => {
      const eDate = new Date(e.date)
      return eDate.getFullYear() === year && eDate.getMonth() === month && eDate.getDate() === day
    })
  }

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{monthName}</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={prevMonth} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', borderRadius: '6px' }}>&larr; Prev</button>
          <button onClick={() => setCurrentDate(new Date())} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', borderRadius: '6px' }}>Today</button>
          <button onClick={nextMonth} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', borderRadius: '6px' }}>Next &rarr;</button>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        gap: '1px', 
        backgroundColor: 'var(--border)', 
        border: '1px solid var(--border)', 
        borderRadius: '8px', 
        overflow: 'hidden' 
      }}>
        {weekdays.map(day => (
          <div key={day} style={{ 
            backgroundColor: '#111', 
            padding: '0.75rem', 
            textAlign: 'center', 
            fontWeight: 600, 
            fontSize: '0.85rem', 
            color: 'var(--muted)' 
          }}>
            {day}
          </div>
        ))}

        {blanks.map(blank => (
          <div key={`blank-${blank}`} style={{ 
            backgroundColor: 'rgba(15, 15, 15, 0.4)', 
            minHeight: '120px' 
          }}></div>
        ))}

        {days.map(day => {
          const dayEvents = getEventsForDay(day)
          const isToday = new Date().toDateString() === new Date(year, month, day).toDateString()
          
          return (
            <div key={day} style={{ 
              backgroundColor: isToday ? 'rgba(255, 255, 255, 0.05)' : '#18181A', 
              minHeight: '120px', 
              padding: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem'
            }}>
              <div style={{ 
                fontWeight: isToday ? 700 : 500, 
                color: isToday ? 'var(--primary)' : 'var(--muted)', 
                fontSize: '0.9rem', 
                marginBottom: '0.25rem' 
              }}>
                {day}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', maxHeight: '110px' }} className="hide-scrollbar">
                {dayEvents.map(e => (
                  <div key={e.id} style={{ 
                    fontSize: '0.7rem', 
                    padding: '6px 8px', 
                    borderRadius: '4px',
                    backgroundColor: e.isPublished ? 'rgba(34, 197, 94, 0.15)' : 'rgba(156, 163, 175, 0.1)',
                    color: e.isPublished ? '#4ade80' : '#9ca3af',
                    border: `1px solid ${e.isPublished ? 'rgba(34, 197, 94, 0.3)' : 'rgba(156, 163, 175, 0.2)'}`,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }} title={`${e.campaignName} - ${e.channel}`}>
                    <strong style={{ display: 'block', marginBottom: '2px' }}>{e.campaignName}</strong>
                    <span style={{ fontSize: '0.65rem', opacity: 0.8, textTransform: 'uppercase' }}>{e.channel.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
