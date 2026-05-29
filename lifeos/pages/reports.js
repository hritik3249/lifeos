import { useState, useEffect } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import { generateWeeklyReport, getScoreColor, getScoreLabel } from '../lib/scoring'
import { format, subDays, startOfWeek } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, LineChart, Line, ReferenceLine } from 'recharts'
import { Nav } from './index'

export default function Reports() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('week') // 'week' | 'month'

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const { data } = await supabase.from('checkins').select('*').order('date', { ascending: false }).limit(90)
    if (data) setHistory(data)
    setLoading(false)
  }

  const report = history.length >= 3 ? generateWeeklyReport(history) : null

  const last30 = history.slice(0, 30)
  const last7 = history.slice(0, 7)
  const displayData = view === 'week' ? last7 : last30

  const chartData = [...displayData].reverse().map(e => ({
    day: format(new Date(e.date + 'T00:00:00'), view === 'week' ? 'EEE' : 'd MMM'),
    score: e.score,
    study: e.study_hours,
    sleep: e.sleep,
    screen: e.screen_time,
  }))

  const radarData = report ? [
    { metric: 'Sleep', value: Math.min(10, Math.round((report.avgSleep / 8) * 10)) },
    { metric: 'Study', value: Math.min(10, Math.round(report.avgStudy * 2)) },
    { metric: 'Score', value: Math.round(report.avgScore) },
    { metric: 'Gym', value: Math.round((report.gymDays / report.totalGymDays) * 10) },
    { metric: 'Screen ctrl', value: Math.max(0, Math.round(10 - report.avgScreen)) },
  ] : []

  return (
    <>
      <Head><title>Life OS — Reports</title></Head>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Nav active="reports" />
        <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }} className="fade-up">
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, marginBottom: 6 }}>Reports</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Patterns in your performance data</p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['week', 'month'].map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`btn-ghost ${view === v ? 'active' : ''}`}
                  style={{ padding: '6px 14px', fontSize: 12, textTransform: 'capitalize' }}
                >
                  {v === 'week' ? '7 days' : '30 days'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '4rem' }}>Loading...</p>
          ) : history.length < 3 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '4rem' }}>Need at least 3 check-ins for reports.</p>
          ) : (
            <>
              {/* Summary cards */}
              {report && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: '1.5rem' }} className="fade-up">
                  <SummaryCard
                    label="Avg score"
                    value={report.avgScore.toFixed(1)}
                    delta={report.scoreDelta}
                    color={getScoreColor(report.avgScore)}
                  />
                  <SummaryCard
                    label="Total study"
                    value={`${report.totalStudyHours.toFixed(0)}h`}
                    sub={`${report.avgStudy.toFixed(1)}h/day`}
                    color="var(--blue)"
                  />
                  <SummaryCard
                    label="Avg sleep"
                    value={`${report.avgSleep.toFixed(1)}h`}
                    sub={report.avgSleep >= 7 ? 'Optimal' : 'Below target'}
                    color={report.avgSleep >= 7 ? 'var(--green)' : 'var(--red)'}
                  />
                  <SummaryCard
                    label="Gym days"
                    value={`${report.gymDays}/${report.totalGymDays}`}
                    sub={`${Math.round((report.gymDays / report.totalGymDays) * 100)}% consistency`}
                    color={report.gymDays >= report.totalGymDays * 0.8 ? 'var(--green)' : 'var(--yellow)'}
                  />
                </div>
              )}

              {/* Score trend chart */}
              <div className="card fade-up" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
                  Score trend
                </p>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 10]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <ReferenceLine y={6.5} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: 'var(--text-secondary)' }}
                      itemStyle={{ color: 'var(--green)' }}
                    />
                    <Line type="monotone" dataKey="score" stroke="var(--green)" strokeWidth={2.5} dot={{ fill: 'var(--green)', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Study + Screen chart side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: '1.5rem' }}>
                <div className="card fade-up" style={{ padding: '1.5rem' }}>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
                    Study hours
                  </p>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={chartData} barSize={16}>
                      <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <ReferenceLine y={5} stroke="rgba(96,165,250,0.3)" strokeDasharray="3 3" />
                      <Tooltip
                        contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                        itemStyle={{ color: 'var(--blue)' }}
                      />
                      <Bar dataKey="study" fill="var(--blue)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="card fade-up" style={{ padding: '1.5rem' }}>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
                    Screen time
                  </p>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={chartData} barSize={16}>
                      <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <ReferenceLine y={3} stroke="rgba(250,204,21,0.3)" strokeDasharray="3 3" />
                      <Tooltip
                        contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                        itemStyle={{ color: 'var(--red)' }}
                      />
                      <Bar dataKey="screen" fill="var(--red)" opacity={0.8} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Radar + Best/Worst day */}
              {report && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: '1.5rem' }}>
                  <div className="card fade-up" style={{ padding: '1.5rem' }}>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
                      7-day balance
                    </p>
                    <ResponsiveContainer width="100%" height={200}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.06)" />
                        <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                        <Radar dataKey="value" stroke="var(--blue)" fill="var(--blue)" fillOpacity={0.15} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="card fade-up" style={{ padding: '1.5rem' }}>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
                      Best & worst
                    </p>
                    {report.bestDay && (
                      <div style={{ marginBottom: 16 }}>
                        <p style={{ fontSize: 11, color: 'var(--green)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                          Best day
                        </p>
                        <p style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 500 }}>
                          {format(new Date(report.bestDay.date + 'T00:00:00'), 'EEEE, d MMM')}
                        </p>
                        <p style={{ fontSize: 22, fontFamily: 'var(--font-mono)', color: 'var(--green)', marginTop: 2 }}>
                          {report.bestDay.score.toFixed(1)}
                        </p>
                      </div>
                    )}
                    {report.worstDay && (
                      <div>
                        <p style={{ fontSize: 11, color: 'var(--red)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                          Toughest day
                        </p>
                        <p style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 500 }}>
                          {format(new Date(report.worstDay.date + 'T00:00:00'), 'EEEE, d MMM')}
                        </p>
                        <p style={{ fontSize: 22, fontFamily: 'var(--font-mono)', color: 'var(--red)', marginTop: 2 }}>
                          {report.worstDay.score.toFixed(1)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sleep distribution */}
              <div className="card fade-up" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
                  Sleep pattern
                </p>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={chartData} barSize={16}>
                    <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 10]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <ReferenceLine y={7} stroke="rgba(74,222,128,0.3)" strokeDasharray="3 3" />
                    <ReferenceLine y={9} stroke="rgba(74,222,128,0.2)" strokeDasharray="3 3" />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                      itemStyle={{ color: 'var(--purple)' }}
                    />
                    <Bar dataKey="sleep" fill="var(--purple)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                  Green bands = optimal range (7–9h)
                </p>
              </div>

            </>
          )}
        </main>
      </div>
    </>
  )
}

function SummaryCard({ label, value, sub, delta, color }) {
  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 500, color, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{value}</p>
      {delta != null && (
        <p style={{ fontSize: 12, color: delta >= 0 ? 'var(--green)' : 'var(--red)', marginTop: 4 }}>
          {delta >= 0 ? '+' : ''}{delta.toFixed(1)} vs last week
        </p>
      )}
      {sub && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</p>}
    </div>
  )
}
