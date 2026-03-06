'use client'

import { useEffect, useState } from 'react'

interface MatchTimestamps {
  status: string
  firstHalfStartedAt: string | null
  halfTimeAt: string | null
  secondHalfStartedAt: string | null
  fullTimeAt: string | null
  etFirstHalfStartedAt: string | null
  etHalfTimeAt: string | null
  etSecondHalfStartedAt: string | null
  etFullTimeAt: string | null
  penaltyStartedAt: string | null
  completedAt: string | null
  matchTime: number
}

function pad(n: number) { return n.toString().padStart(2, '0') }

function formatMinutes(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60)
  return `${mins}'`
}

export function useMatchTimer(match: MatchTimestamps) {
  const [display, setDisplay] = useState('')
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    function compute() {
      const now = Date.now()
      const halfDuration = (match.matchTime / 2) * 60 // seconds
      const etHalfDuration = 15 * 60 // 15 min extra time halves

      switch (match.status) {
        case 'SCHEDULED':
          setDisplay(''); setIsLive(false); return
        case 'FIRST_HALF': {
          if (!match.firstHalfStartedAt) { setDisplay('0\''); setIsLive(true); return }
          const elapsed = (now - new Date(match.firstHalfStartedAt).getTime()) / 1000
          setDisplay(formatMinutes(Math.min(elapsed, halfDuration + 600)))
          setIsLive(true); return
        }
        case 'HALF_TIME':
          setDisplay(`${match.matchTime / 2}'`); setIsLive(false); return
        case 'SECOND_HALF': {
          if (!match.secondHalfStartedAt) { setDisplay(`${match.matchTime / 2}'`); setIsLive(true); return }
          const elapsed = (now - new Date(match.secondHalfStartedAt).getTime()) / 1000
          const base = halfDuration
          setDisplay(formatMinutes(base + Math.min(elapsed, halfDuration + 600)))
          setIsLive(true); return
        }
        case 'FULL_TIME':
          setDisplay('FT'); setIsLive(false); return
        case 'EXTRA_TIME_FIRST_HALF': {
          if (!match.etFirstHalfStartedAt) { setDisplay(`${match.matchTime}'`); setIsLive(true); return }
          const elapsed = (now - new Date(match.etFirstHalfStartedAt).getTime()) / 1000
          setDisplay(formatMinutes(match.matchTime * 60 + Math.min(elapsed, etHalfDuration + 300)))
          setIsLive(true); return
        }
        case 'EXTRA_TIME_HALF_TIME':
          setDisplay(`${match.matchTime + 15}'`); setIsLive(false); return
        case 'EXTRA_TIME_SECOND_HALF': {
          if (!match.etSecondHalfStartedAt) { setDisplay(`${match.matchTime + 15}'`); setIsLive(true); return }
          const elapsed = (now - new Date(match.etSecondHalfStartedAt).getTime()) / 1000
          const base = (match.matchTime + 15) * 60
          setDisplay(formatMinutes(base + Math.min(elapsed, etHalfDuration + 300)))
          setIsLive(true); return
        }
        case 'EXTRA_TIME_FULL_TIME':
          setDisplay('AET'); setIsLive(false); return
        case 'PENALTY_SHOOTOUT':
          setDisplay('PSO'); setIsLive(true); return
        case 'COMPLETED':
          setDisplay('FT'); setIsLive(false); return
        default:
          setDisplay(match.status); setIsLive(false)
      }
    }

    compute()
    const interval = setInterval(compute, 15000) // update every 15s
    return () => clearInterval(interval)
  }, [match])

  return { display, isLive }
}
