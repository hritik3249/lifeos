import { useState, useEffect } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import { getUnlockedAchievements, ACHIEVEMENTS, calcStreaks, getScoreColor } from '../lib/scoring'
import { Nav } from './index'

export default function Achievements() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const { data } = await supabase.from('checkins').select('*').order('date', { ascending: false })
    if (data) setHistory(data)
    setLoading(false)
  }

  const unlocked = getUnlockedAchievements(history)
  const unlockedIds = new Set(unlocked.map(a => a.id))
  const streaks = history.length ? calcStreaks(history) : {}

  return (
    <>
      <Head><title>Life OS — Achievements</title></Head>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Nav active="achievements" />
        <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1.5rem' }}>

          <div style={{ marginBottom: '2.5rem' }} className="fade-up">
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, marginBottom: 8 }}>Achievements</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {unlocked.length} of {ACHIEVEMENTS.length} unlocked
            </p>
          </div>

          {/* Progress bar */}
          <div className="card fade-up" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Overall progress</span>
              <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                {Math.round((unlocked.length / ACHIEVEMENTS.length) * 100)}%
              </span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
              <div style={{
                height: '100%',
                width: `${(unlocked.length / ACHIEVEMENTS.length) * 100}%`,
                background: 'linear-gradient(90deg, var(--green), var(--blue))',
                borderRadius: 3,
                transition: 'width 0.8s ease'
              }} />
            </div>
          </div>

          {/* Active Streaks */}
          {history.length > 0 && (
            <div style={{ marginBottom: '2rem' }} className="fade-up">
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
                Active streaks
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                {[
                  { label: 'Gym', value: streaks.gymStreak, icon: '🏋️', color: 'var(--green)' },
                  { label: 'Study 4h+', value: streaks.studyStreak, icon: '📚', color: 'var(--blue)' },
                  { label: 'Sleep 7h+', value: streaks.sleepStreak, icon: '😴', color: 'var(--purple)' },
                  { label: 'Good days', value: streaks.goodDayStreak, icon: '⭐', color: 'var(--yellow)' },
                ].map(s => (
                  <div key={s.label} className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
                    <div style={{ fontSize: 28, fontWeight: 500, fontFamily: 'var(--font-mono)', color: s.value > 0 ? s.color : 'var(--text-muted)', lineHeight: 1 }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>days</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievement grid */}
          <div className="fade-up">
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
              All achievements
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {ACHIEVEMENTS.map(a => {
                const isUnlocked = unlockedIds.has(a.id)
                return (
                  <div key={a.id} className="card" style={{
                    padding: '1.25rem',
                    opacity: isUnlocked ? 1 : 0.4,
                    borderColor: isUnlocked ? 'rgba(74,222,128,0.25)' : 'var(--border)',
                    background: isUnlocked ? 'var(--green-dim)' : 'var(--bg-card)',
                    transition: 'all 0.2s',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {isUnlocked && (
                      <div style={{
                        position: 'absolute', top: 8, right: 10,
                        fontSize: 10, color: 'var(--green)', fontFamily: 'var(--font-mono)',
                        textTransform: 'uppercase', letterSpacing: '0.06em'
                      }}>unlocked</div>
                    )}
                    <div style={{ fontSize: 32, marginBottom: 8 }}>{a.icon}</div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>{a.label}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{a.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>

        </main>
      </div>
    </>
  )
}
