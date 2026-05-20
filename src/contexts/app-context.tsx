import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react'
import pb from '@/lib/pocketbase/client'
import { useChurch } from './church-context'
import { useRealtime } from '@/hooks/use-realtime'
import { CourseStatus } from '@/types/team'

export type Seed = {
  id: string
  church: string
  name: string
  photo?: string
  entryMethod: 'Kids 4' | 'Novo Membro' | 'Convidado por Membro'
  sex: 'Masculino' | 'Feminino' | 'Outro'
  birthDate: string
  guardian1: string
  guardian2?: string
  phone1: string
  phone2?: string
  hasAllergy: boolean
  allergyDetails?: string
  hasMedication: boolean
  medicationDetails?: string
  notes?: string
  status: 'Ativo' | 'Inativo'
  registrationDate: string
}

export type Event = {
  id: string
  church: string
  title: string
  description: string
  date: string
  time: string
  location: string
  category: string
}

export type Attendance = {
  id: string
  event: string
  seed?: string
  team_member?: string
  type: 'seed' | 'team'
  present: boolean
}

export interface CourseData {
  status: CourseStatus
  completionYear?: string
}

export type TeamMember = {
  id: string
  church: string
  name: string
  photoUrl: string
  email: string
  dateOfBirth: string
  role: 'Líder' | 'Membro'
  sex?: 'Masculino' | 'Feminino'
  courses: {
    cme: CourseData
    ebm: CourseData
    te: CourseData
  }
}

type AppContextType = {
  seeds: Seed[]
  events: Event[]
  attendances: Attendance[]
  teamMembers: TeamMember[]
  addSeed: (seed: Omit<Seed, 'id' | 'church' | 'registrationDate'>) => Promise<void>
  updateSeed: (id: string, seed: Partial<Seed>) => Promise<void>
  addEvent: (event: Omit<Event, 'id' | 'church'>) => Promise<void>
  toggleAttendance: (eventId: string, participantId: string, type: 'seed' | 'team') => Promise<void>
  addTeamMember: (member: Omit<TeamMember, 'id' | 'church'>) => Promise<void>
  updateTeamMember: (id: string, member: Partial<TeamMember>) => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const { currentChurch } = useChurch()

  const [baseSeeds, setBaseSeeds] = useState<Seed[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])

  const loadData = async () => {
    if (!currentChurch) return
    const filter = `church = "${currentChurch.id}"`
    try {
      const [s, e, tm] = await Promise.all([
        pb.collection('seeds').getFullList<Seed>({ filter }),
        pb.collection('events').getFullList<Event>({ filter }),
        pb.collection('team_members').getFullList<TeamMember>({ filter }),
      ])
      setBaseSeeds(s)
      setEvents(e)
      setTeamMembers(tm)
    } catch (err) {
      console.error(err)
    }
  }

  const loadAttendances = async () => {
    if (!currentChurch) return
    try {
      const atts = await pb.collection('attendances').getFullList<Attendance>({
        filter: `event.church = "${currentChurch.id}"`,
      })
      setAttendances(atts)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadData()
    loadAttendances()
  }, [currentChurch?.id])

  useRealtime('seeds', () => loadData(), !!currentChurch)
  useRealtime(
    'events',
    () => {
      loadData()
      loadAttendances()
    },
    !!currentChurch,
  )
  useRealtime('team_members', () => loadData(), !!currentChurch)
  useRealtime('attendances', () => loadAttendances(), !!currentChurch)

  const computedSeeds = useMemo(() => {
    return baseSeeds.map((seed) => {
      const bdParts = seed.birthDate.split('-')
      const bYear = parseInt(bdParts[0])
      const bMonth = parseInt(bdParts[1]) - 1
      const bDay = parseInt(bdParts[2])

      const today = new Date()
      let age = today.getFullYear() - bYear
      if (today.getMonth() < bMonth || (today.getMonth() === bMonth && today.getDate() < bDay)) {
        age--
      }

      return {
        ...seed,
        status: age >= 14 ? 'Inativo' : seed.status,
      }
    })
  }, [baseSeeds])

  const addSeed = async (seedData: Omit<Seed, 'id' | 'church' | 'registrationDate'>) => {
    if (!currentChurch) return
    const now = new Date().toISOString().split('T')[0]
    await pb.collection('seeds').create({
      ...seedData,
      church: currentChurch.id,
      registrationDate: now,
      status: seedData.status || 'Ativo',
    })
  }

  const updateSeed = async (id: string, seedData: Partial<Seed>) => {
    await pb.collection('seeds').update(id, seedData)
  }

  const addEvent = async (eventData: Omit<Event, 'id' | 'church'>) => {
    if (!currentChurch) return
    await pb.collection('events').create({
      ...eventData,
      church: currentChurch.id,
    })
  }

  const toggleAttendance = async (
    eventId: string,
    participantId: string,
    type: 'seed' | 'team',
  ) => {
    const existing = attendances.find(
      (a) =>
        a.event === eventId &&
        (type === 'seed' ? a.seed === participantId : a.team_member === participantId) &&
        a.type === type,
    )
    if (existing) {
      await pb.collection('attendances').update(existing.id, { present: !existing.present })
    } else {
      await pb.collection('attendances').create({
        event: eventId,
        seed: type === 'seed' ? participantId : null,
        team_member: type === 'team' ? participantId : null,
        type,
        present: true,
      })
    }
  }

  const addTeamMember = async (memberData: Omit<TeamMember, 'id' | 'church'>) => {
    if (!currentChurch) return
    await pb.collection('team_members').create({
      ...memberData,
      church: currentChurch.id,
    })
  }

  const updateTeamMember = async (id: string, memberData: Partial<TeamMember>) => {
    await pb.collection('team_members').update(id, memberData)
  }

  return (
    <AppContext.Provider
      value={{
        seeds: computedSeeds,
        events,
        attendances,
        teamMembers,
        addSeed,
        updateSeed,
        addEvent,
        toggleAttendance,
        addTeamMember,
        updateTeamMember,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
