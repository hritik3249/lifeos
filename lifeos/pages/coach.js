import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import { generateWeeklyReport, calcStreaks } from '../lib/scoring'
import { format } from 'date-fns'
import { Nav } from './index'

export default function Coach() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { fetchAll() }, [])
  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  async function fetchAll() {
    const { data } = await supabase.from('checkins').select('*').order('date', { ascending: false }).limit(30)
    if (data) {
      setHistory(data)
      // Auto-generate an initial insight after load
      if (data.length >= 3) {
        setTimeout(() => generateInsight(data, []), 600)
      }
    }
    setLoading(false)
  }

  function buildContext(hist) {
    const report = generateWeeklyReport(hist)
    const streaks = calcStreaks(hist)
    const recent = hist.slice(0, 7)
    const today = hist[0]

    return `You are a brutally honest, high-performance life coach for a student preparing for CAT 2026 (Common Admission Test for top Indian IIMs). Their goal is 99+ percentile to get into a top IIM, earn well, and fund their Commercial Pilot License by age 29.

User's recent data (last ${recent.length} check-ins):
${recent.map(e => `- ${e.date}: score ${e.score.toFixed(1)}, sleep ${e.sleep}h, study ${e.study_hours}h, screen ${e.screen_time}h, mood ${e.mood}/10, energy ${e.energy}/10, gym: ${e.gym_done ? 'yes' : 'no'}`).join('\n')}

7-day averages:
- Score: ${report?.avgScore?.toFixed(1) || 'N/A'}
- Study: ${report?.avgStudy?.toFixed(1) || 'N/A'}h/day  
- Sleep: ${report?.avgSleep?.toFixed(1) || 'N/A'}h/night
- Screen time: ${report?.avgScreen?.toFixed(1) || 'N/A'}h/day
- Gym days: ${report?.gymDays || 0}/${report?.totalGymDays || 0}

Active streaks:
- Gym streak: ${streaks.gymStreak} days
- Study 4h+ streak: ${streaks.studyStreak} days
- Sleep 7h+ streak: ${streaks.sleepStreak} days

Be direct, specific, and reference their actual data. No fluff. Speak like a coach who deeply cares but doesn't sugarcoat. Keep responses concise (3-5 sentences max unless asked for more). Reference specific numbers from their data.`
  }

  async function generateInsight(hist, currentMessages) {
    if (hist.length < 3) return
    setThinking(true)

    const context = buildContext(hist)
    const isFirst = currentMessages.length === 0

    const prompt = isFirst
      ? 'Based on my data, give me one sharp insight about the most important pattern you see — what should I focus on right now?'
      : 'Follow up with one more specific observation.'

    try {
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: context,
          messages: [
            ...currentMessages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: prompt }
          ],
        })
      })
      const data = await response.json()
      const text = data.text || data.error || 'No response.'
      setMessages(prev => [...prev, { role: 'assistant', content: text, auto: true }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Could not reach AI coach right now. Check your connection.', auto: true }])
    }
    setThinking(false)
  }

  async function sendMessage() {
    if (!input.trim() || thinking) return
    const userMsg = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setThinking(true)

    const context = buildContext(history)

    try {
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: context,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        })
      })
      const data = await response.json()
      const text = data.text || data.error || 'No response.'
      setMessages(prev => [...prev, { role: 'assistant', content: text }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error reaching the coach. Please try again.' }])
    }
    setThinking(false)
  }

  const QUICK_PROMPTS = [
    "What's my biggest weakness this week?",
    "How do I fix my screen time?",
    "Am I on track for 99 percentile?",
    "What should I do differently tomorrow?",
    "Rate my consistency honestly",
  ]

  return (
    <>
      <Head><title>Life OS — AI Coach</title></Head>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Nav active="coach" />
        <main style={{ maxWidth: 700, margin: '0 auto', padding: '2rem 1.5rem' }}>

          <div style={{ marginBottom: '1.5rem' }} className="fade-up">
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, marginBottom: 6 }}>AI Coach</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Brutally honest coaching powered by your actual data
            </p>
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>Loading your data...</p>
          ) : history.length < 3 ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>🤖</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                Complete at least 3 check-ins to unlock AI coaching.
              </p>
            </div>
          ) : (
            <>
              {/* Message feed */}
              <div className="card fade-up" style={{ padding: 0, marginBottom: '1rem', overflow: 'hidden', minHeight: 200 }}>
                {messages.length === 0 && !thinking && (
                  <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Analyzing your data...</p>
                  </div>
                )}

                {messages.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '1rem 1.25rem',
                      borderBottom: i < messages.length - 1 || thinking ? '1px solid var(--border)' : 'none',
                      background: m.role === 'user' ? 'rgba(255,255,255,0.02)' : 'transparent',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        background: m.role === 'user' ? 'rgba(255,255,255,0.1)' : 'rgba(74,222,128,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13,
                      }}>
                        {m.role === 'user' ? '👤' : '🤖'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {m.role === 'user' ? 'You' : 'Coach'}
                        </p>
                        <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                          {m.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {thinking && (
                  <div style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(74,222,128,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>🤖</div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[0, 1, 2].map(i => (
                          <div key={i} style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: 'var(--green)',
                            animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                          }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick prompts */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1rem' }} className="fade-up">
                {QUICK_PROMPTS.map(p => (
                  <button
                    key={p}
                    onClick={() => { setInput(p) }}
                    className="btn-ghost"
                    style={{ fontSize: 12, padding: '5px 12px' }}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="card fade-up" style={{ padding: '1rem', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <textarea
                  rows={2}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask your coach anything about your data, habits, or strategy..."
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  style={{ flex: 1, resize: 'none', border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
                />
                <button
                  className="btn-primary"
                  onClick={sendMessage}
                  disabled={thinking || !input.trim()}
                  style={{ padding: '8px 16px', opacity: thinking || !input.trim() ? 0.5 : 1 }}
                >
                  Send →
                </button>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
                Press Enter to send · Shift+Enter for new line
              </p>
            </>
          )}
        </main>
      </div>
    </>
  )
}
