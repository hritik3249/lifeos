import Head from 'next/head'
import { Nav } from './index'

const GOALS = [
  {
    title: 'Commercial Pilot License',
    category: 'Life goal',
    description: 'Earn ₹1 crore through career and fund your CPL. This is the reason everything else matters.',
    color: 'var(--purple)',
    dim: 'var(--purple-dim)',
    timeline: 'By age 29',
    status: 'In progress'
  },
  {
    title: 'CAT 2026 — 99+ percentile',
    category: 'This year',
    description: 'Top IIM is the engine of the entire plan. 6 months, 5h daily, no shortcuts.',
    color: 'var(--blue)',
    dim: 'var(--blue-dim)',
    timeline: 'November 2026',
    status: 'Active'
  },
  {
    title: 'Disciplined study system',
    category: 'This month',
    description: 'Wake at 7am. No phone for 60 min. 5h CAT study. 2 DILR sets. Sleep by 11:30pm.',
    color: 'var(--green)',
    dim: 'var(--green-dim)',
    timeline: 'Daily habit',
    status: 'Building'
  },
]

const NONNEG = [
  { label: 'Wake up', target: '7:00am daily' },
  { label: 'Phone-free morning', target: 'First 60 minutes' },
  { label: 'CAT study', target: '5 hours minimum' },
  { label: 'DILR sets', target: '2 sets every day' },
  { label: 'Gym', target: 'Every single day' },
  { label: 'Sleep', target: 'By 11:30pm' },
]

const CATPLAN = [
  { phase: '1', months: 'Jun – Jul', focus: 'Foundation + DILR intensive', target: '93–94 percentile' },
  { phase: '2', months: 'Aug – Sep', focus: 'Speed, accuracy, sectional mocks', target: '96–97 percentile' },
  { phase: '3', months: 'Oct – Nov', focus: 'Full mock warfare, peak performance', target: '99+ percentile' },
]

export default function Goals() {
  return (
    <>
      <Head><title>Life OS — Goals</title></Head>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Nav active="goals" />
        <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1.5rem' }}>

          <div style={{ marginBottom: '2.5rem' }} className="fade-up">
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, marginBottom: 8 }}>Your goals</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Keep your north star visible. Every decision runs through these.</p>
          </div>

          {/* Goals */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: '2.5rem' }} className="fade-up">
            {GOALS.map(g => (
              <div key={g.title} className="card" style={{ padding: '1.5rem', borderColor: g.color + '30' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <span style={{ fontSize: 11, color: g.color, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{g.category}</span>
                    <h2 style={{ fontSize: 20, fontWeight: 500, color: 'var(--text-primary)', marginTop: 4, fontFamily: 'var(--font-display)' }}>{g.title}</h2>
                  </div>
                  <span style={{ fontSize: 11, padding: '4px 12px', borderRadius: 100, background: g.dim, color: g.color, fontFamily: 'var(--font-mono)', flexShrink: 0, marginLeft: 16 }}>
                    {g.status}
                  </span>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>{g.description}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Timeline: {g.timeline}</p>
              </div>
            ))}
          </div>

          {/* Non-negotiables */}
          <div style={{ marginBottom: '2.5rem' }} className="fade-up">
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>Daily non-negotiables</p>
            <div className="card" style={{ overflow: 'hidden' }}>
              {NONNEG.map((n, i) => (
                <div key={n.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 20px',
                  borderBottom: i < NONNEG.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <p style={{ fontSize: 14, color: 'var(--text-primary)' }}>{n.label}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{n.target}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CAT plan */}
          <div style={{ marginBottom: '2.5rem' }} className="fade-up">
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>CAT 2026 battle plan</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {CATPLAN.map(p => (
                <div key={p.phase} className="card" style={{ padding: '1.25rem' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>Phase {p.phase} · {p.months}</p>
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8 }}>{p.focus}</p>
                  <p style={{ fontSize: 12, color: 'var(--blue)', fontFamily: 'var(--font-mono)' }}>Target: {p.target}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Vision */}
          <div className="card fade-up" style={{ padding: '1.75rem', borderColor: 'rgba(167,139,250,0.2)', background: 'var(--purple-dim)' }}>
            <p style={{ fontSize: 11, color: 'var(--purple)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>5-year vision</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text-primary)', lineHeight: 1.4 }}>
              Top IIM graduate → high-salary job → disciplined saver → Commercial Pilot at 29.
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.7 }}>
              You chose the hard path. Most people default to the comfortable one and spend the rest of their lives wondering what could have been. You won't. Every check-in, every study hour, every early morning — it's all building toward the cockpit.
            </p>
          </div>

        </main>
      </div>
    </>
  )
}
