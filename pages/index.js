import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { calcScore, getScoreColor, getScoreLabel, detectPatterns } from '../lib/scoring'
import { format, subDays } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [todayEntry, setTodayEntry] = useState(null)

  useEffect(() => {
    fetchHistory()
  }, [])

  async function fetchHistory() {
    const { data, error } = await supabase
      .from('checkins')
      .select('*')
      .order('date', { ascending: false })
      .limit(30)

    if (!error && data) {
      setHistory(data)
      const today = format(new Date(), 'yyyy-MM-dd')
      setTodayEntry(data.find(e => e.date === today) || null)
    }
    setLoading(false)
  }

  const last7 = history.slice(0, 7)
  const avg7 = last7.length ? (last7.reduce((a, e) => a + e.score, 0) / last7.length).toFixed(1) : null
  const gymStreak = (() => {
    let s = 0
    for (const e of history) { if (e.gym_done) s++; else break }
    return s
  })()

  const chartData = [...last7].reverse().map(e => ({
    day: format(new Date(e.date + 'T00:00:00'), 'EEE'),
    score: e.score
  }))

  const patterns = history.length >= 3 ? detectPatterns(history) : []

  const areas = todayEntry ? [
    { label: 'Sleep', val: Math.min(10, Math.round((todayEntry.sleep / 8) * 10)) },
    { label: 'Mood', val: todayEntry.mood },
    { label: 'Energy', val: todayEntry.energy },
    { label: 'Study', val: Math.min(10, Math.round(todayEntry.study_hours * 2)) },
    { label: 'Focus', val: todayEntry.productivity },
    { label: 'Calm', val: 11 - todayEntry.anxiety },
    { label: 'Screen ctrl', val: Math.max(1, Math.round(10 - todayEntry.screen_time)) },
    { label: 'Fitness', val: todayEntry.gym_done ? 10 : 1 },
  ] : []

  return (
    <>
      <Head>
        <title>Life OS — Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Nav active="dashboard" />

        <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>

          {/* Header */}
          <div style={{ marginBottom: '2.5rem' }} className="fade-up">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                  Life OS
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 14 }}>
                  {format(new Date(), 'EEEE, d MMMM yyyy')}
                </p>
              </div>
              {!todayEntry && (
                <Link href="/checkin">
                  <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>+</span> Today's check-in
                  </button>
                </Link>
              )}
            </div>
          </div>

          {loading ? (
            <LoadingState />
          ) : history.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Top metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: '1.5rem' }} className="fade-up">
                <MetricCard
                  label="Today's score"
                  value={todayEntry ? todayEntry.score.toFixed(1) : '—'}
                  sub={todayEntry ? getScoreLabel(todayEntry.score) : 'No check-in yet'}
                  color={todayEntry ? getScoreColor(todayEntry.score) : 'var(--text-muted)'}
                />
                <MetricCard
                  label="7-day average"
                  value={avg7 || '—'}
                  sub="rolling average"
                  color={avg7 ? getScoreColor(parseFloat(avg7)) : 'var(--text-muted)'}
                />
                <MetricCard
                  label="Gym streak"
                  value={gymStreak}
                  sub="days in a row"
                  color={gymStreak >= 5 ? 'var(--green)' : gymStreak >= 3 ? 'var(--yellow)' : 'var(--red)'}
                />
                <MetricCard
                  label="Check-ins"
                  value={history.length}
                  sub="total entries"
                  color="var(--blue)"
                />
              </div>

              {/* Chart + Areas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: '1.5rem' }}>
                <div className="card" style={{ padding: '1.5rem' }}>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>7-day trend</p>
                  {chartData.length > 1 ? (
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={chartData}>
                        <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 10]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                          labelStyle={{ color: 'var(--text-secondary)' }}
                          itemStyle={{ color: 'var(--green)' }}
                        />
                        <Line type="monotone" dataKey="score" stroke="var(--green)" strokeWidth={2} dot={{ fill: 'var(--green)', r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, paddingTop: 40, textAlign: 'center' }}>Need 2+ entries for chart</p>
                  )}
                </div>

                <div className="card" style={{ padding: '1.5rem' }}>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>Today's areas</p>
                  {areas.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {areas.map(a => (
                        <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 80, flexShrink: 0 }}>{a.label}</span>
                          <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${a.val * 10}%`, background: getScoreColor(a.val), borderRadius: 2, transition: 'width 0.5s ease' }} />
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', width: 16, textAlign: 'right' }}>{a.val}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, paddingTop: 40, textAlign: 'center' }}>Complete today's check-in</p>
                  )}
                </div>
              </div>

              {/* Patterns */}
              {patterns && patterns.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>Pattern analysis</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {patterns.map((p, i) => (
                      <div key={i} className="card" style={{
                        padding: '1rem 1.25rem',
                        borderColor: p.type === 'danger' ? 'rgba(248,113,113,0.2)' : p.type === 'success' ? 'rgba(74,222,128,0.2)' : 'rgba(250,204,21,0.2)',
                        background: p.type === 'danger' ? 'var(--red-dim)' : p.type === 'success' ? 'var(--green-dim)' : 'var(--yellow-dim)'
                      }}>
                        <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>{p.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent history */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>Recent check-ins</p>
                  <Link href="/history" style={{ fontSize: 12, color: 'var(--text-secondary)', textDecoration: 'none' }}>View all →</Link>
                </div>
                <div className="card" style={{ overflow: 'hidden' }}>
                  {history.slice(0, 7).map((e, i) => (
                    <div key={e.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 20px',
                      borderBottom: i < 6 ? '1px solid var(--border)' : 'none'
                    }}>
                      <div>
                        <p style={{ fontSize: 14, color: 'var(--text-primary)' }}>{format(new Date(e.date + 'T00:00:00'), 'EEEE, d MMM')}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          Study {e.study_hours}h · Screen {e.screen_time}h · {e.gym_done ? '💪 Gym' : 'No gym'}
                        </p>
                      </div>
                      <span className="score-pill" style={{
                        background: e.score >= 7 ? 'var(--green-dim)' : e.score >= 5 ? 'var(--yellow-dim)' : 'var(--red-dim)',
                        color: getScoreColor(e.score)
                      }}>
                        {e.score.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  )
}

function MetricCard({ label, value, sub, color }) {
  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      <p style={{ fontSize: 32, fontWeight: 500, color, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{sub}</p>
    </div>
  )
}

function Nav({ active }) {
  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/checkin', label: 'Check-in' },
    { href: '/history', label: 'History' },
    { href: '/goals', label: 'Goals' },
  ]
  return (
    <nav style={{
      borderBottom: '1px solid var(--border)',
      padding: '0 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 56,
      position: 'sticky',
      top: 0,
      background: 'rgba(10,10,15,0.9)',
      backdropFilter: 'blur(12px)',
      zIndex: 100
    }}>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--text-primary)' }}>Life OS</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {links.map(l => (
          <Link key={l.href} href={l.href} style={{ textDecoration: 'none' }}>
            <button className={`btn-ghost ${active === l.label.toLowerCase() ? 'active' : ''}`} style={{ padding: '6px 14px', fontSize: 13 }}>
              {l.label}
            </button>
          </Link>
        ))}
      </div>
    </nav>
  )
}

function LoadingState() {
  return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading your data...</div>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--text-primary)', marginBottom: 12 }}>
        Your journey starts today
      </p>
      <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 28, maxWidth: 400, margin: '0 auto 28px' }}>
        No check-ins yet. Complete your first daily check-in to start tracking your life.
      </p>
      <Link href="/checkin">
        <button className="btn-primary">Start first check-in →</button>
      </Link>
    </div>
  )
}

export { Nav }
