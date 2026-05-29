export function calcScore(entry) {
  const sleepScore = entry.sleep >= 7 && entry.sleep <= 9 ? 9 : entry.sleep < 6 ? 4 : 6
  const studyScore = Math.min(10, entry.study_hours * 1.8)
  const screenPenalty = Math.max(0, (entry.screen_time - 3) * 0.8)
  const anxietyScore = 11 - entry.anxiety
  const gymBonus = entry.gym_done ? 1 : 0
  const raw = (sleepScore + entry.mood + entry.energy + studyScore + entry.productivity + anxietyScore) / 6 + gymBonus - screenPenalty
  return Math.min(10, Math.max(1, Math.round(raw * 10) / 10))
}

export function getScoreColor(score) {
  if (score >= 7.5) return '#4ade80'
  if (score >= 5) return '#facc15'
  return '#f87171'
}

export function getScoreLabel(score) {
  if (score >= 8) return 'Excellent'
  if (score >= 6.5) return 'Good'
  if (score >= 5) return 'Average'
  if (score >= 3.5) return 'Poor'
  return 'Critical'
}

export function generateFeedback(entry) {
  const feedback = []

  if (entry.sleep < 6.5) {
    feedback.push({ type: 'danger', text: `Only ${entry.sleep}h sleep. Cognitive performance is severely compromised. Sleep by 11:30pm tonight — non-negotiable.` })
  } else if (entry.sleep >= 7 && entry.sleep <= 9) {
    feedback.push({ type: 'success', text: `${entry.sleep}h sleep — optimal. Your brain is working at full capacity today.` })
  }

  if (entry.study_hours < 2) {
    feedback.push({ type: 'danger', text: `${entry.study_hours}h of study is not preparation — it's the appearance of it. Your CAT target requires 5h daily minimum.` })
  } else if (entry.study_hours < 4) {
    feedback.push({ type: 'warning', text: `${entry.study_hours}h study — below target. Push to 5h tomorrow. The gap between 89 and 99 percentile is built day by day.` })
  } else {
    feedback.push({ type: 'success', text: `${entry.study_hours}h of focused study. This is how 99 percentile is built. Keep going.` })
  }

  if (entry.screen_time > 6) {
    feedback.push({ type: 'danger', text: `${entry.screen_time}h of screen time is stealing your life. Every hour on your phone is an hour not becoming the person you want to be.` })
  } else if (entry.screen_time > 4) {
    feedback.push({ type: 'warning', text: `${entry.screen_time}h screen time. Cap it at 3h. Your phone is your biggest competitor for CAT.` })
  }

  if (!entry.gym_done) {
    feedback.push({ type: 'warning', text: `No gym today. This is your one consistent habit — protect it. Do not let this become two days.` })
  } else {
    feedback.push({ type: 'success', text: `Gym done. Your physical discipline is intact. This habit is protecting your mental health.` })
  }

  if (entry.anxiety >= 7) {
    feedback.push({ type: 'danger', text: `High stress level (${entry.anxiety}/10). Ask yourself: is this from avoidance or a real problem? Most anxiety at your stage is avoidance in disguise.` })
  }

  if (entry.mood <= 3) {
    feedback.push({ type: 'warning', text: `Low mood today. Track this pattern — if it persists 3+ days, something structural needs to change.` })
  }

  return feedback
}

export function detectPatterns(history) {
  if (history.length < 3) return null

  const recent = history.slice(0, 7)
  const avgStudy = recent.reduce((a, e) => a + e.study_hours, 0) / recent.length
  const avgScreen = recent.reduce((a, e) => a + e.screen_time, 0) / recent.length
  const avgSleep = recent.reduce((a, e) => a + e.sleep, 0) / recent.length
  const gymDays = recent.filter(e => e.gym_done).length

  const patterns = []

  if (avgStudy < 3) {
    patterns.push({ type: 'danger', text: `7-day study average: ${avgStudy.toFixed(1)}h/day. You are on track for an average CAT score, not a top IIM. This needs to change this week.` })
  } else if (avgStudy >= 5) {
    patterns.push({ type: 'success', text: `Excellent study average: ${avgStudy.toFixed(1)}h/day. You are building real momentum. Stay consistent.` })
  }

  if (avgScreen > 5) {
    patterns.push({ type: 'danger', text: `Average screen time: ${avgScreen.toFixed(1)}h/day. You are spending more time on your phone than studying. This is a critical pattern.` })
  }

  if (avgSleep < 6.5) {
    patterns.push({ type: 'danger', text: `Average sleep: ${avgSleep.toFixed(1)}h. Chronic sleep deprivation is compounding. Your memory consolidation and focus are both impaired.` })
  }

  if (gymDays === recent.length || gymDays >= recent.length - 1) {
    patterns.push({ type: 'success', text: `Gym consistency: ${gymDays}/${recent.length} days. Your strongest habit. This discipline template needs to spread to studying.` })
  }

  return patterns
}

// --- NEW: Streak calculations ---
export function calcStreaks(history) {
  const sorted = [...history].sort((a, b) => new Date(b.date) - new Date(a.date))

  let gymStreak = 0
  let studyStreak = 0 // 4h+
  let sleepStreak = 0 // 7h+
  let goodDayStreak = 0 // score >= 6.5

  for (const e of sorted) {
    if (e.gym_done) gymStreak++; else break
  }
  for (const e of sorted) {
    if (e.study_hours >= 4) studyStreak++; else break
  }
  for (const e of sorted) {
    if (e.sleep >= 7) sleepStreak++; else break
  }
  for (const e of sorted) {
    if (e.score >= 6.5) goodDayStreak++; else break
  }

  return { gymStreak, studyStreak, sleepStreak, goodDayStreak }
}

// --- NEW: Achievements ---
export const ACHIEVEMENTS = [
  { id: 'first_checkin', icon: '🚀', label: 'First step', desc: 'Completed your first check-in', condition: (h) => h.length >= 1 },
  { id: 'week_warrior', icon: '📅', label: 'Week warrior', desc: '7 check-ins completed', condition: (h) => h.length >= 7 },
  { id: 'monthly_master', icon: '🗓️', label: 'Monthly master', desc: '30 check-ins completed', condition: (h) => h.length >= 30 },
  { id: 'gym_3', icon: '💪', label: 'Gym streak 3', desc: '3 gym days in a row', condition: (h) => calcStreaks(h).gymStreak >= 3 },
  { id: 'gym_7', icon: '🏋️', label: 'Gym week', desc: '7 gym days in a row', condition: (h) => calcStreaks(h).gymStreak >= 7 },
  { id: 'gym_30', icon: '🏆', label: 'Iron will', desc: '30 gym days in a row', condition: (h) => calcStreaks(h).gymStreak >= 30 },
  { id: 'study_5h', icon: '📚', label: '5-hour session', desc: 'Studied 5+ hours in a day', condition: (h) => h.some(e => e.study_hours >= 5) },
  { id: 'study_streak_7', icon: '🎓', label: 'Scholar week', desc: '7 days of 4h+ study', condition: (h) => calcStreaks(h).studyStreak >= 7 },
  { id: 'perfect_sleep', icon: '😴', label: 'Sleep master', desc: '7 nights of 7h+ sleep', condition: (h) => calcStreaks(h).sleepStreak >= 7 },
  { id: 'low_screen', icon: '📵', label: 'Digital detox', desc: 'Screen time under 2h', condition: (h) => h.some(e => e.screen_time <= 2) },
  { id: 'high_score', icon: '⭐', label: 'Peak day', desc: 'Score 9.0 or higher', condition: (h) => h.some(e => e.score >= 9.0) },
  { id: 'comeback', icon: '🔄', label: 'Comeback', desc: 'Score improved 3+ points vs previous', condition: (h) => h.length >= 2 && (h[0].score - h[1].score >= 3) },
]

export function getUnlockedAchievements(history) {
  return ACHIEVEMENTS.filter(a => a.condition(history))
}

// --- NEW: Weekly report ---
export function generateWeeklyReport(history) {
  if (history.length < 3) return null

  const week = history.slice(0, 7)
  const prevWeek = history.slice(7, 14)

  const avg = (arr, key) => arr.length ? arr.reduce((s, e) => s + e[key], 0) / arr.length : 0

  const thisWeekAvgScore = avg(week, 'score')
  const lastWeekAvgScore = avg(prevWeek, 'score')
  const thisWeekStudy = avg(week, 'study_hours')
  const thisWeekSleep = avg(week, 'sleep')
  const thisWeekScreen = avg(week, 'screen_time')
  const thisWeekGym = week.filter(e => e.gym_done).length

  const bestDay = week.reduce((best, e) => e.score > (best?.score || 0) ? e : best, null)
  const worstDay = week.reduce((worst, e) => e.score < (worst?.score || 10) ? e : worst, null)

  const scoreDelta = lastWeekAvgScore ? thisWeekAvgScore - lastWeekAvgScore : null

  return {
    period: `${week.length} days`,
    avgScore: thisWeekAvgScore,
    scoreDelta,
    avgStudy: thisWeekStudy,
    avgSleep: thisWeekSleep,
    avgScreen: thisWeekScreen,
    gymDays: thisWeekGym,
    totalGymDays: week.length,
    bestDay,
    worstDay,
    totalStudyHours: week.reduce((s, e) => s + e.study_hours, 0),
  }
}
