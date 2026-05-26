import { useState, useEffect } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import { getScoreColor, getScoreLabel } from '../lib/scoring'
import { format } from 'date-fns'
import { Nav } from './index'

export default function History() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const { data } = await supabase.from('checkins').select('*').order('date', { ascending: false })
    if (data) setHistory(data)
    setLoading(false)
  }

  return (
    <>
      <Head><title>Life OS — History</title></Head>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Nav active="history" />
        <main style={{ maxWidth: 700, margin: '0 auto', padding: '2rem 1.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, marginBottom: 8 }}>Check-in history</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: '2rem' }}>
            {history.length} entries recorded
          </p>

          {loading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '4rem' }}>Loading...</p>
          ) : history.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '4rem' }}>No check-ins yet.</p>
          ) : (
            <div className="card" style={{ overflow: 'hidden' }}>
              {history.map((e, i) => (
                <div key={e.id}>
                  <div
                    onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '16px 20px',
                      borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={el => el.currentTarget.style.background = 'var(--bg-card-hover)'}
                    onMouseLeave={el => el.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <p style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 500 }}>
                        {format(new Date(e.date + 'T00:00:00'), 'EEEE, d MMMM yyyy')}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                        Sleep {e.sleep}h · Study {e.study_hours}h · Screen {e.screen_time}h · {e.gym_done ? 'Gym ✓' : 'No gym'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className="score-pill" style={{
                        background: e.score >= 7 ? 'var(--green-dim)' : e.score >= 5 ? 'var(--yellow-dim)' : 'var(--red-dim)',
                        color: getScoreColor(e.score)
                      }}>
                        {e.score.toFixed(1)}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>{expanded === e.id ? '↑' : '↓'}</span>
                    </div>
                  </div>

                  {expanded === e.id && (
                    <div style={{ padding: '16px 20px 20px', borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none', background: 'rgba(255,255,255,0.02)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                        {[
                          { label: 'Mood', val: e.mood },
                          { label: 'Energy', val: e.energy },
                          { label: 'Productivity', val: e.productivity },
                          { label: 'Anxiety', val: e.anxiety },
                        ].map(item => (
                          <div key={item.label} style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{item.label}</p>
                            <p style={{ fontSize: 20, fontWeight: 500, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{item.val}</p>
                          </div>
                        ))}
                      </div>
                      {e.win && (
                        <div style={{ marginBottom: 10 }}>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>Win</p>
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{e.win}</p>
                        </div>
                      )}
                      {e.struggle && (
                        <div>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>Struggle</p>
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{e.struggle}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  )
}
