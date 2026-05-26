import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { calcScore, generateFeedback } from '../lib/scoring'
import { format } from 'date-fns'
import { Nav } from './index'

const FIELDS = [
  { id: 'sleep', label: 'Sleep', sub: 'hours last night', min: 3, max: 10, step: 0.5, default: 7, unit: 'h' },
  { id: 'mood', label: 'Mood', sub: '1 = terrible, 10 = great', min: 1, max: 10, step: 1, default: 5 },
  { id: 'energy', label: 'Energy', sub: '1 = drained, 10 = fired up', min: 1, max: 10, step: 1, default: 5 },
  { id: 'study_hours', label: 'CAT study', sub: 'focused hours today', min: 0, max: 12, step: 0.5, default: 2, unit: 'h' },
  { id: 'productivity', label: 'Productivity', sub: '1 = wasted day, 10 = locked in', min: 1, max: 10, step: 1, default: 5 },
  { id: 'screen_time', label: 'Screen time', sub: 'total phone/social media hours', min: 0, max: 14, step: 0.5, default: 5, unit: 'h' },
  { id: 'anxiety', label: 'Stress / anxiety', sub: '1 = calm, 10 = overwhelmed', min: 1, max: 10, step: 1, default: 5 },
]

export default function Checkin() {
  const router = useRouter()
  const [values, setValues] = useState(() => {
    const init = {}
    FIELDS.forEach(f => { init[f.id] = f.default })
    return init
  })
  const [gym, setGym] = useState(true)
  const [win, setWin] = useState('')
  const [struggle, setStruggle] = useState('')
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [alreadyDone, setAlreadyDone] = useState(false)
  const [checking, setChecking] = useState(true)

  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    checkToday()
  }, [])

  async function checkToday() {
    const { data } = await supabase.from('checkins').select('id').eq('date', today).single()
    if (data) setAlreadyDone(true)
    setChecking(false)
  }

  function updateVal(id, val) {
    setValues(v => ({ ...v, [id]: parseFloat(val) }))
  }

  async function handleSubmit() {
    setSaving(true)
    const entry = { ...values, gym_done: gym, win, struggle, date: today }
    entry.score = calcScore(entry)

    const { error } = await supabase.from('checkins').upsert(entry, { onConflict: 'date' })

    if (!error) {
      setFeedback(generateFeedback(entry))
    } else {
      alert('Error saving: ' + error.message)
    }
    setSaving(false)
  }

  const liveScore = calcScore({ ...values, gym_done: gym })

  return (
    <>
      <Head><title>Life OS — Check-in</title></Head>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Nav active="check-in" />
        <main style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1.5rem' }}>

          {checking ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '4rem' }}>Loading...</p>
          ) : feedback ? (
            <FeedbackView feedback={feedback} score={liveScore} onDone={() => router.push('/')} />
          ) : (
            <>
              <div style={{ marginBottom: '2rem' }} className="fade-up">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, lineHeight: 1.2 }}>
                      {alreadyDone ? 'Update today' : "Today's check-in"}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>
                      {format(new Date(), 'EEEE, d MMMM')} · Be honest. This is only for you.
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Live score</p>
                    <p style={{ fontSize: 32, fontWeight: 500, fontFamily: 'var(--font-mono)', color: liveScore >= 7 ? 'var(--green)' : liveScore >= 5 ? 'var(--yellow)' : 'var(--red)', lineHeight: 1 }}>
                      {liveScore.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="fade-up">
                {FIELDS.map(f => (
                  <SliderField
                    key={f.id}
                    field={f}
                    value={values[f.id]}
                    onChange={val => updateVal(f.id, val)}
                  />
                ))}

                {/* Gym */}
                <div>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 10 }}>
                    Workout done today?
                  </p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => setGym(true)}
                      style={{
                        flex: 1, padding: 12, borderRadius: 10, border: '1px solid',
                        borderColor: gym ? 'var(--green)' : 'var(--border)',
                        background: gym ? 'var(--green-dim)' : 'transparent',
                        color: gym ? 'var(--green)' : 'var(--text-secondary)',
                        cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
                        transition: 'all 0.2s'
                      }}
                    >
                      Yes, gym done
                    </button>
                    <button
                      onClick={() => setGym(false)}
                      style={{
                        flex: 1, padding: 12, borderRadius: 10, border: '1px solid',
                        borderColor: !gym ? 'var(--red)' : 'var(--border)',
                        background: !gym ? 'var(--red-dim)' : 'transparent',
                        color: !gym ? 'var(--red)' : 'var(--text-secondary)',
                        cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
                        transition: 'all 0.2s'
                      }}
                    >
                      Skipped today
                    </button>
                  </div>
                </div>

                {/* Win */}
                <div>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    Biggest win today <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>(optional)</span>
                  </p>
                  <textarea
                    rows={2}
                    placeholder="What actually went well today?"
                    value={win}
                    onChange={e => setWin(e.target.value)}
                  />
                </div>

                {/* Struggle */}
                <div>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    Main struggle or avoidance <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>(optional)</span>
                  </p>
                  <textarea
                    rows={2}
                    placeholder="What did you avoid? What was hard?"
                    value={struggle}
                    onChange={e => setStruggle(e.target.value)}
                  />
                </div>

                <button
                  className="btn-primary"
                  onClick={handleSubmit}
                  disabled={saving}
                  style={{ width: '100%', padding: 14, fontSize: 15, marginTop: 8 }}
                >
                  {saving ? 'Saving...' : 'Save check-in →'}
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  )
}

function SliderField({ field, value, onChange }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{field.label}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>{field.sub}</span>
        </div>
        <span style={{ fontSize: 18, fontWeight: 500, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', minWidth: 40, textAlign: 'right' }}>
          {value}{field.unit || ''}
        </span>
      </div>
      <input
        type="range"
        min={field.min}
        max={field.max}
        step={field.step}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{field.min}{field.unit || ''}</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{field.max}{field.unit || ''}</span>
      </div>
    </div>
  )
}

function FeedbackView({ feedback, score, onDone }) {
  return (
    <div className="fade-up">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Today's score</p>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 72,
          fontWeight: 500,
          color: score >= 7 ? 'var(--green)' : score >= 5 ? 'var(--yellow)' : 'var(--red)',
          lineHeight: 1
        }}>{score.toFixed(1)}</p>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>out of 10</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: '2rem' }}>
        {feedback.map((f, i) => (
          <div key={i} className="card" style={{
            padding: '1rem 1.25rem',
            borderColor: f.type === 'danger' ? 'rgba(248,113,113,0.25)' : f.type === 'success' ? 'rgba(74,222,128,0.25)' : 'rgba(250,204,21,0.25)',
            background: f.type === 'danger' ? 'var(--red-dim)' : f.type === 'success' ? 'var(--green-dim)' : 'var(--yellow-dim)'
          }}>
            <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6 }}>{f.text}</p>
          </div>
        ))}
      </div>

      <button className="btn-primary" onClick={onDone} style={{ width: '100%', padding: 14 }}>
        Back to dashboard →
      </button>
    </div>
  )
}
