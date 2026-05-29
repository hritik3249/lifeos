import { useState, useEffect } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import { getScoreColor } from '../lib/scoring'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths, addMonths, isSameMonth, isToday } from 'date-fns'
import { Nav } from './index'

function getHeatColor(score) {
  if (!score) return 'rgba(255,255,255,0.04)'
  if (score >= 8) return 'rgba(74,222,128,0.65)'
  if (score >= 6.5) return 'rgba(74,222,128,0.35)'
  if (score >= 5) return 'rgba(250,204,21,0.45)'
  if (score >= 3.5) return 'rgba(248,113,113,0.35)'
  return 'rgba(248,113,113,0.6)'
}

export default function CalendarPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const { data } = await supabase.from('checkins').select('*').order('date', { ascending: false })
    if (data) setHistory(data)
    setLoading(false)
  }

  const entryMap = {}
  history.forEach(e => { entryMap[e.date] = e })

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  // leading blank days
  const firstDayOfWeek = getDay(days[0]) // 0=Sun
  const blanks = Array(firstDayOfWeek).fill(null)

  const weekLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const selectedEntry = selectedDay ? entryMap[selectedDay] : null

  // month-level stats
  const monthEntries = days.map(d => entryMap[format(d, 'yyyy-MM-dd')]).filter(Boolean)
  const monthAvg = monthEntries.length ? (monthEntries.reduce((s, e) => s + e.score, 0) / monthEntries.length).toFixed(1) : null
  const monthGym = monthEntries.filter(e => e.gym_done).length
  const monthStudy = monthEntries.reduce((s, e) => s + e.study_hours, 0).toFixed(0)

  return (
    <>
      <Head><title>Life OS — Calendar</title></Head>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Nav active="calendar" />
        <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }} className="fade-up">
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, marginBottom: 6 }}>
                Calendar
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                {history.length} total check-ins across your journey
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="btn-ghost" onClick={() => setCurrentMonth(m => subMonths(m, 1))} style={{ padding: '6px 12px' }}>←</button>
              <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', minWidth: 140, textAlign: 'center' }}>
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <button className="btn-ghost" onClick={() => setCurrentMonth(m => addMonths(m, 1))} style={{ padding: '6px 12px' }}>→</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>

            {/* Calendar grid */}
            <div className="card fade-up" style={{ padding: '1.5rem' }}>
              {/* Month stats row */}
              {monthEntries.length > 0 && (
                <div style={{ display: 'flex', gap: 20, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Avg score</p>
                    <p style={{ fontSize: 20, fontFamily: 'var(--font-mono)', color: monthAvg >= 7 ? 'var(--green)' : monthAvg >= 5 ? 'var(--yellow)' : 'var(--red)', fontWeight: 500 }}>{monthAvg}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Check-ins</p>
                    <p style={{ fontSize: 20, fontFamily: 'var(--font-mono)', color: 'var(--blue)', fontWeight: 500 }}>{monthEntries.length}/{days.length}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Gym days</p>
                    <p style={{ fontSize: 20, fontFamily: 'var(--font-mono)', color: 'var(--green)', fontWeight: 500 }}>{monthGym}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Study hrs</p>
                    <p style={{ fontSize: 20, fontFamily: 'var(--font-mono)', color: 'var(--blue)', fontWeight: 500 }}>{monthStudy}h</p>
                  </div>
                </div>
              )}

              {/* Day of week labels */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
                {weekLabels.map(l => (
                  <div key={l} style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', padding: '4px 0' }}>
                    {l}
                  </div>
                ))}
              </div>

              {/* Calendar cells */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {blanks.map((_, i) => (
                  <div key={`blank-${i}`} />
                ))}
                {days.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd')
                  const entry = entryMap[dateStr]
                  const isSelected = selectedDay === dateStr
                  const today = isToday(day)

                  return (
                    <div
                      key={dateStr}
                      onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                      style={{
                        aspectRatio: '1',
                        borderRadius: 8,
                        background: isSelected
                          ? 'rgba(255,255,255,0.15)'
                          : entry
                          ? getHeatColor(entry.score)
                          : 'rgba(255,255,255,0.03)',
                        border: today
                          ? '1.5px solid rgba(255,255,255,0.4)'
                          : isSelected
                          ? '1.5px solid rgba(255,255,255,0.3)'
                          : '1px solid transparent',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: entry ? 'pointer' : 'default',
                        transition: 'all 0.15s',
                        padding: '2px',
                      }}
                    >
                      <span style={{
                        fontSize: 12,
                        color: entry ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                        lineHeight: 1,
                      }}>
                        {format(day, 'd')}
                      </span>
                      {entry && (
                        <span style={{
                          fontSize: 9,
                          color: 'rgba(255,255,255,0.7)',
                          fontFamily: 'var(--font-mono)',
                          marginTop: 2,
                          lineHeight: 1,
                        }}>
                          {entry.score.toFixed(1)}
                        </span>
                      )}
                      {entry?.gym_done && (
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--green)', marginTop: 2 }} />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Score:</span>
                {[
                  { label: '8+', color: 'rgba(74,222,128,0.65)' },
                  { label: '6.5+', color: 'rgba(74,222,128,0.35)' },
                  { label: '5+', color: 'rgba(250,204,21,0.45)' },
                  { label: '<5', color: 'rgba(248,113,113,0.6)' },
                  { label: 'None', color: 'rgba(255,255,255,0.04)' },
                ].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color, border: '1px solid rgba(255,255,255,0.1)' }} />
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{l.label}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 4 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)' }} />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Gym</span>
                </div>
              </div>
            </div>

            {/* Selected day detail */}
            <div className="fade-up">
              {selectedEntry ? (
                <DayDetail entry={selectedEntry} />
              ) : (
                <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <p style={{ fontSize: 32, marginBottom: 12 }}>📅</p>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    Click a day on the calendar to see details
                  </p>
                </div>
              )}

              {/* Year heatmap strip */}
              {history.length > 0 && (
                <div className="card" style={{ padding: '1.25rem', marginTop: 12 }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                    Last 12 weeks
                  </p>
                  <MiniHeatmap history={history} />
                </div>
              )}
            </div>
          </div>

        </main>
      </div>
    </>
  )
}

function DayDetail({ entry }) {
  const areas = [
    { label: 'Sleep', val: entry.sleep, unit: 'h', max: 10 },
    { label: 'Mood', val: entry.mood, unit: '/10', max: 10 },
    { label: 'Energy', val: entry.energy, unit: '/10', max: 10 },
    { label: 'Study', val: entry.study_hours, unit: 'h', max: 10 },
    { label: 'Productivity', val: entry.productivity, unit: '/10', max: 10 },
    { label: 'Anxiety', val: entry.anxiety, unit: '/10', max: 10 },
    { label: 'Screen time', val: entry.screen_time, unit: 'h', max: 14 },
  ]

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
          {format(new Date(entry.date + 'T00:00:00'), 'EEEE, d MMMM yyyy')}
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <p style={{
            fontSize: 44, fontFamily: 'var(--font-mono)', fontWeight: 500, lineHeight: 1,
            color: getScoreColor(entry.score)
          }}>
            {entry.score.toFixed(1)}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>/ 10</p>
          {entry.gym_done && (
            <span style={{ fontSize: 12, color: 'var(--green)', fontFamily: 'var(--font-mono)', background: 'var(--green-dim)', padding: '2px 8px', borderRadius: 100 }}>
              Gym ✓
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {areas.map(a => {
          const pct = Math.min(100, (a.val / a.max) * 100)
          const isNegative = a.label === 'Anxiety' || a.label === 'Screen time'
          const barColor = isNegative
            ? a.val > 6 ? 'var(--red)' : a.val > 3 ? 'var(--yellow)' : 'var(--green)'
            : getScoreColor(a.val)
          return (
            <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', width: 85, flexShrink: 0 }}>{a.label}</span>
              <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 2, transition: 'width 0.5s ease' }} />
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', width: 30, textAlign: 'right' }}>
                {a.val}{a.unit}
              </span>
            </div>
          )
        })}
      </div>

      {(entry.win || entry.struggle) && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entry.win && (
            <div>
              <p style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Win</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{entry.win}</p>
            </div>
          )}
          {entry.struggle && (
            <div>
              <p style={{ fontSize: 10, color: 'var(--red)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Struggle</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{entry.struggle}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MiniHeatmap({ history }) {
  // Build last 84 days (12 weeks)
  const days = []
  for (let i = 83; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(format(d, 'yyyy-MM-dd'))
  }

  const entryMap = {}
  history.forEach(e => { entryMap[e.date] = e.score })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3 }}>
      {Array.from({ length: 12 }, (_, weekIdx) => (
        <div key={weekIdx} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {Array.from({ length: 7 }, (_, dayIdx) => {
            const dateStr = days[weekIdx * 7 + dayIdx]
            const score = entryMap[dateStr]
            return (
              <div
                key={dayIdx}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: 2,
                  background: score != null ? getHeatColor(score) : 'rgba(255,255,255,0.04)',
                }}
                title={dateStr && score != null ? `${dateStr}: ${score.toFixed(1)}` : dateStr}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
