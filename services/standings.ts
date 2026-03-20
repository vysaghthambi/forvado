import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'

export interface StandingRow {
  teamId: string
  teamName: string
  badgeUrl: string | null
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  form: ('W' | 'D' | 'L')[]
}

function buildRow(teamId: string, teamName: string, badgeUrl: string | null): StandingRow {
  return { teamId, teamName, badgeUrl, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, form: [] }
}

function sortRows(rows: StandingRow[]): StandingRow[] {
  return rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
    return a.teamName.localeCompare(b.teamName)
  })
}

async function _calculateStandings(tournamentId: string): Promise<StandingRow[]> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId, deletedAt: null },
    include: {
      teams: { include: { team: { select: { id: true, name: true, badgeUrl: true } } } },
      matches: {
        where: { status: 'COMPLETED' },
        select: { homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true },
        orderBy: { matchOrder: 'asc' },
      },
    },
  })
  if (!tournament) return []

  const map = new Map<string, StandingRow>()
  for (const tt of tournament.teams) {
    map.set(tt.teamId, buildRow(tt.teamId, tt.team.name, tt.team.badgeUrl))
  }

  for (const m of tournament.matches) {
    const home = map.get(m.homeTeamId)
    const away = map.get(m.awayTeamId)
    if (!home || !away) continue

    home.played++
    away.played++
    home.goalsFor += m.homeScore
    home.goalsAgainst += m.awayScore
    away.goalsFor += m.awayScore
    away.goalsAgainst += m.homeScore

    if (m.homeScore > m.awayScore) {
      home.won++; home.points += 3; away.lost++
      home.form.push('W'); away.form.push('L')
    } else if (m.homeScore < m.awayScore) {
      away.won++; away.points += 3; home.lost++
      away.form.push('W'); home.form.push('L')
    } else {
      home.drawn++; home.points += 1; away.drawn++; away.points += 1
      home.form.push('D'); away.form.push('D')
    }
  }

  for (const row of map.values()) {
    row.goalDifference = row.goalsFor - row.goalsAgainst
    row.form = row.form.slice(-5)
  }

  return sortRows(Array.from(map.values()))
}

export function calculateStandings(tournamentId: string): Promise<StandingRow[]> {
  return unstable_cache(
    () => _calculateStandings(tournamentId),
    ['standings', tournamentId],
    { revalidate: 60, tags: [`standings-${tournamentId}`] },
  )()
}

async function _calculateGroupStandings(
  tournamentId: string
): Promise<{ groupId: string; groupName: string; rows: StandingRow[] }[]> {
  const groups = await prisma.tournamentGroup.findMany({
    where: { tournamentId },
    include: {
      teams: { include: { team: { select: { id: true, name: true, badgeUrl: true } } } },
    },
    orderBy: { name: 'asc' },
  })

  const completedMatches = await prisma.match.findMany({
    where: { tournamentId, status: 'COMPLETED' },
    select: { groupId: true, homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true },
    orderBy: { matchOrder: 'asc' },
  })

  const matchesByGroup = new Map<string, typeof completedMatches>()
  for (const m of completedMatches) {
    if (!m.groupId) continue
    const arr = matchesByGroup.get(m.groupId) ?? []
    arr.push(m)
    matchesByGroup.set(m.groupId, arr)
  }

  return groups.map((g) => {
    const map = new Map<string, StandingRow>()
    for (const tt of g.teams) {
      map.set(tt.teamId, buildRow(tt.teamId, tt.team.name, tt.team.badgeUrl))
    }

    for (const m of matchesByGroup.get(g.id) ?? []) {
      const home = map.get(m.homeTeamId)
      const away = map.get(m.awayTeamId)
      if (!home || !away) continue

      home.played++; away.played++
      home.goalsFor += m.homeScore; home.goalsAgainst += m.awayScore
      away.goalsFor += m.awayScore; away.goalsAgainst += m.homeScore

      if (m.homeScore > m.awayScore) {
        home.won++; home.points += 3; away.lost++
        home.form.push('W'); away.form.push('L')
      } else if (m.homeScore < m.awayScore) {
        away.won++; away.points += 3; home.lost++
        away.form.push('W'); home.form.push('L')
      } else {
        home.drawn++; home.points += 1; away.drawn++; away.points += 1
        home.form.push('D'); away.form.push('D')
      }
    }

    for (const row of map.values()) {
      row.goalDifference = row.goalsFor - row.goalsAgainst
      row.form = row.form.slice(-5)
    }

    return { groupId: g.id, groupName: g.name, rows: sortRows(Array.from(map.values())) }
  })
}

export function calculateGroupStandings(
  tournamentId: string,
): Promise<{ groupId: string; groupName: string; rows: StandingRow[] }[]> {
  return unstable_cache(
    () => _calculateGroupStandings(tournamentId),
    ['group-standings', tournamentId],
    { revalidate: 60, tags: [`standings-${tournamentId}`] },
  )()
}
