import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { calcScore, getScoreColor, getScoreLabel, detectPatterns, getUnlockedAchievements, calcStreaks, generateWeeklyReport } from '../lib/scoring'
import { format, subDays } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

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
  const streaks = history.length ? calcStreaks(history) : {}

  const chartData = [...last7].reverse().map(e => ({
    day: format(new Date(e.date + 'T00:00:00'), 'EEE'),
    score: e.score
  }))

  const patterns = history.length >= 3 ? detectPatterns(history) : []
  const achievements = history.length ? getUnlockedAchievements(history) : []
  const report = history.length >= 3 ? generateWeeklyReport(history) : null

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

        <main style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' }}>

          {/* Header */}
          <div style={{ marginBottom: '2rem' }} className="fade-up">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, color: 'var(--text-primary)', lineHeight: 1.05, letterSpacing: '-0.5px' }}>
                  Life OS
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 14 }}>
                  {format(new Date(), 'EEEE, d MMMM yyyy')}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {!todayEntry && (
                  <Link href="/checkin">
                    <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px' }}>
                      <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Today's check-in
                    </button>
                  </Link>
                )}
                {todayEntry && (
                  <span style={{ fontSize: 12, color: 'var(--green)', fontFamily: 'var(--font-mono)', background: 'var(--green-dim)', padding: '6px 14px', borderRadius: 100, border: '1px solid rgba(74,222,128,0.2)' }}>
                    ✓ Checked in today
                  </span>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <LoadingState />
          ) : history.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Top metrics row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: '1.25rem' }} className="fade-up">
                <MetricCard
                  label="Today's score"
                  value={todayEntry ? todayEntry.score.toFixed(1) : '—'}
                  sub={todayEntry ? getScoreLabel(todayEntry.score) : 'No check-in yet'}
                  color={todayEntry ? getScoreColor(todayEntry.score) : 'var(--text-muted)'}
                />
                <MetricCard
                  label="7-day average"
                  value={avg7 || '—'}
                  sub={report?.scoreDelta != null ? `${report.scoreDelta >= 0 ? '+' : ''}${report.scoreDelta.toFixed(1)} vs prev week` : 'rolling average'}
                  color={avg7 ? getScoreColor(parseFloat(avg7)) : 'var(--text-muted)'}
                  deltaColor={report?.scoreDelta != null ? (report.scoreDelta >= 0 ? 'var(--green)' : 'var(--red)') : null}
                />
                <MetricCard
                  label="Gym streak"
                  value={streaks.gymStreak || 0}
                  sub="days in a row"
                  color={streaks.gymStreak >= 7 ? 'var(--green)' : streaks.gymStreak >= 3 ? 'var(--yellow)' : 'var(--red)'}
                />
                <MetricCard
                  label="Study streak"
                  value={streaks.studyStreak || 0}
                  sub="4h+ days in a row"
                  color={streaks.studyStreak >= 5 ? 'var(--green)' : streaks.studyStreak >= 2 ? 'var(--yellow)' : 'var(--text-muted)'}
                />
                <MetricCard
                  label="Achievements"
                  value={achievements.length}
                  sub={`of 12 unlocked`}
                  color="var(--purple)"
                  isLink="/achievements"
                />
              </div>

              {/* Chart + Areas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, marginBottom: '1.25rem' }}>
                <div className="card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>7-day trend</p>
                    <Link href="/reports" style={{ fontSize: 11, color: 'var(--text-secondary)', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}>
                      Full report →
                    </Link>
                  </div>
                  {chartData.length > 1 ? (
                    <ResponsiveContainer width="100%" height={170}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4ade80" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 10]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                          labelStyle={{ color: 'var(--text-secondary)' }}
                          itemStyle={{ color: 'var(--green)' }}
                        />
                        <Area type="monotone" dataKey="score" stroke="var(--green)" strokeWidth={2.5} fill="url(#scoreGrad)" dot={{ fill: 'var(--green)', r: 4, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, paddingTop: 40, textAlign: 'center' }}>Need 2+ entries for chart</p>
                  )}
                </div>

                <div className="card" style={{ padding: '1.5rem' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>Today's areas</p>
                  {areas.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                      {areas.map(a => (
                        <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)', width: 72, flexShrink: 0 }}>{a.label}</span>
                          <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${a.val * 10}%`, background: getScoreColor(a.val), borderRadius: 2, transition: 'width 0.6s ease' }} />
                          </div>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', width: 14, textAlign: 'right' }}>{a.val}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', paddingTop: 32 }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>Complete today's check-in</p>
                      <Link href="/checkin">
                        <button className="btn-ghost" style={{ fontSize: 12 }}>Start →</button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick action row: Calendar + Coach + Reports */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: '1.25rem' }} className="fade-up">
                <QuickLink href="/calendar" icon="📅" title="Calendar" sub="Heatmap of your journey" color="var(--blue-dim)" border="rgba(96,165,250,0.2)" />
                <QuickLink href="/coach" icon="🤖" title="AI Coach" sub="Personalized insights" color="var(--green-dim)" border="rgba(74,222,128,0.2)" />
                <QuickLink href="/achievements" icon="🏆" title="Achievements" sub={`${achievements.length} unlocked`} color="var(--purple-dim)" border="rgba(167,139,250,0.2)" />
              </div>

              {/* Mini heatmap strip */}
              <div className="card fade-up" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>Last 8 weeks</p>
                  <Link href="/calendar" style={{ fontSize: 11, color: 'var(--text-secondary)', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}>
                    Full calendar →
                  </Link>
                </div>
                <MiniCalendarStrip history={history} />
              </div>

              {/* Patterns */}
              {patterns && patterns.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }} className="fade-up">
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>Pattern analysis</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {patterns.map((p, i) => (
                      <div key={i} className="card" style={{
                        padding: '0.9rem 1.25rem',
                        borderColor: p.type === 'danger' ? 'rgba(248,113,113,0.2)' : p.type === 'success' ? 'rgba(74,222,128,0.2)' : 'rgba(250,204,21,0.2)',
                        background: p.type === 'danger' ? 'var(--red-dim)' : p.type === 'success' ? 'var(--green-dim)' : 'var(--yellow-dim)'
                      }}>
                        <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>{p.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent check-ins */}
              <div className="fade-up">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>Recent check-ins</p>
                  <Link href="/history" style={{ fontSize: 11, color: 'var(--text-secondary)', textDecoration: 'none' }}>View all →</Link>
                </div>
                <div className="card" style={{ overflow: 'hidden' }}>
                  {history.slice(0, 7).map((e, i) => (
                    <div key={e.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '13px 18px',
                      borderBottom: i < 6 ? '1px solid var(--border)' : 'none'
                    }}>
                      <div>
                        <p style={{ fontSize: 14, color: 'var(--text-primary)' }}>{format(new Date(e.date + 'T00:00:00'), 'EEEE, d MMM')}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          Sleep {e.sleep}h · Study {e.study_hours}h · Screen {e.screen_time}h · {e.gym_done ? '💪 Gym' : 'No gym'}
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

function MiniCalendarStrip({ history }) {
  const entryMap = {}
  history.forEach(e => { entryMap[e.date] = e.score })

  const days = []
  for (let i = 55; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(format(d, 'yyyy-MM-dd'))
  }

  function getColor(score) {
    if (score == null) return 'rgba(255,255,255,0.04)'
    if (score >= 8) return 'rgba(74,222,128,0.7)'
    if (score >= 6.5) return 'rgba(74,222,128,0.4)'
    if (score >= 5) return 'rgba(250,204,21,0.5)'
    return 'rgba(248,113,113,0.55)'
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(56, 1fr)', gap: 3 }}>
      {days.map(dateStr => {
        const score = entryMap[dateStr]
        return (
          <div
            key={dateStr}
            title={score != null ? `${dateStr}: ${score.toFixed(1)}` : dateStr}
            style={{
              height: 14,
              borderRadius: 2,
              background: getColor(score),
              transition: 'transform 0.1s',
              cursor: score != null ? 'pointer' : 'default',
            }}
            onMouseEnter={e => { if (score != null) e.target.style.transform = 'scaleY(1.3)' }}
            onMouseLeave={e => { e.target.style.transform = 'scaleY(1)' }}
          />
        )
      })}
    </div>
  )
}

function QuickLink({ href, icon, title, sub, color, border }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div className="card" style={{
        padding: '1rem 1.25rem',
        background: color,
        borderColor: border,
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <span style={{ fontSize: 24 }}>{icon}</span>
        <div>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{title}</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{sub}</p>
        </div>
      </div>
    </Link>
  )
}

function MetricCard({ label, value, sub, color, deltaColor, isLink }) {
  const inner = (
    <div className="card" style={{ padding: '1.25rem', cursor: isLink ? 'pointer' : 'default' }}>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      <p style={{ fontSize: 32, fontWeight: 500, color, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 12, color: deltaColor || 'var(--text-muted)', marginTop: 6 }}>{sub}</p>
    </div>
  )
  if (isLink) return <Link href={isLink} style={{ textDecoration: 'none' }}>{inner}</Link>
  return inner
}

export function Nav({ active }) {
  const links = [
    { href: '/', label: 'Dashboard', key: 'dashboard' },
    { href: '/checkin', label: 'Check-in', key: 'check-in' },
    { href: '/calendar', label: 'Calendar', key: 'calendar' },
    { href: '/reports', label: 'Reports', key: 'reports' },
    { href: '/coach', label: 'AI Coach', key: 'coach' },
    { href: '/achievements', label: 'Achievements', key: 'achievements' },
    { href: '/history', label: 'History', key: 'history' },
    { href: '/goals', label: 'Goals', key: 'goals' },
  ]
  return (
    <nav style={{
      borderBottom: '1px solid var(--border)',
      padding: '0 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 52,
      position: 'sticky',
      top: 0,
      background: 'rgba(10,10,15,0.92)',
      backdropFilter: 'blur(16px)',
      zIndex: 100
    }}>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Life OS</span>
      <div style={{ display: 'flex', gap: 2, overflowX: 'auto' }}>
        {links.map(l => (
          <Link key={l.href} href={l.href} style={{ textDecoration: 'none' }}>
            <button className={`btn-ghost ${active === l.key ? 'active' : ''}`} style={{ padding: '5px 11px', fontSize: 12, whiteSpace: 'nowrap' }}>
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
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--text-primary)', marginBottom: 12 }}>
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
