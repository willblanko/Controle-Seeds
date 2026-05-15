import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react'
import { TeamMember } from '@/types/team'

export type Seed = {
  id: string
  name: string
  photo?: string
  entryMethod: 'Kids 4' | 'Novo Membro' | 'Convidado por Membro'
  sex: 'Masculino' | 'Feminino' | 'Outro'
  birthDate: string // YYYY-MM-DD
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
  title: string
  description: string
  date: string // YYYY-MM-DD
  time: string // HH:MM
  location: string
  category: string
}

export type Attendance = {
  eventId: string
  participantId: string
  type: 'seed' | 'team'
  present: boolean
}

type AppContextType = {
  seeds: Seed[]
  events: Event[]
  attendances: Attendance[]
  teamMembers: TeamMember[]
  addSeed: (
    seed: Omit<Seed, 'id' | 'registrationDate' | 'status'> & { status?: 'Ativo' | 'Inativo' },
  ) => void
  updateSeed: (id: string, seed: Partial<Seed>) => void
  addEvent: (event: Omit<Event, 'id'>) => void
  toggleAttendance: (eventId: string, participantId: string, type: 'seed' | 'team') => void
  addTeamMember: (member: Omit<TeamMember, 'id'>) => void
  updateTeamMember: (id: string, member: Partial<TeamMember>) => void
}

const now = new Date()
const turning14In30Days = new Date(now.getFullYear() - 14, now.getMonth(), now.getDate() + 30)
const turned14Recently = new Date(now.getFullYear() - 14, now.getMonth(), now.getDate() - 10)
const birthdayThisMonth = new Date(now.getFullYear() - 10, now.getMonth(), 15)

const MOCK_SEEDS: Seed[] = [
  {
    id: '1',
    name: 'Ana Silva',
    photo: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=1',
    entryMethod: 'Kids 4',
    sex: 'Feminino',
    birthDate: '2015-04-12',
    guardian1: 'Maria Silva',
    phone1: '(11) 98765-4321',
    hasAllergy: true,
    allergyDetails: 'Amendoim',
    hasMedication: false,
    status: 'Ativo',
    registrationDate: '2023-08-01',
  },
  {
    id: '2',
    name: 'Bruno Costa',
    photo: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=2',
    entryMethod: 'Novo Membro',
    sex: 'Masculino',
    birthDate: turned14Recently.toISOString().split('T')[0],
    guardian1: 'João Costa',
    phone1: '(11) 91234-5678',
    hasAllergy: false,
    hasMedication: true,
    medicationDetails: 'Ritalina',
    status: 'Ativo',
    registrationDate: '2023-08-15',
  },
  {
    id: '3',
    name: 'Carla Dias',
    photo: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=3',
    entryMethod: 'Convidado por Membro',
    sex: 'Feminino',
    birthDate: turning14In30Days.toISOString().split('T')[0],
    guardian1: 'Roberto Dias',
    phone1: '(11) 99988-7766',
    hasAllergy: false,
    hasMedication: false,
    status: 'Ativo',
    registrationDate: '2023-09-10',
  },
  {
    id: '4',
    name: 'Diego Martins',
    photo: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=4',
    entryMethod: 'Novo Membro',
    sex: 'Masculino',
    birthDate: '2013-08-30',
    guardian1: 'Patrícia Martins',
    phone1: '(11) 97766-5544',
    hasAllergy: true,
    allergyDetails: 'Poeira',
    hasMedication: false,
    status: 'Inativo',
    registrationDate: '2023-07-22',
  },
  {
    id: '5',
    name: 'Elena Rocha',
    photo: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=5',
    entryMethod: 'Kids 4',
    sex: 'Feminino',
    birthDate: '2016-01-18',
    guardian1: 'Carlos Rocha',
    phone1: '(11) 95544-3322',
    hasAllergy: false,
    hasMedication: true,
    medicationDetails: 'Bombinha de Asma',
    status: 'Ativo',
    registrationDate: '2023-10-05',
  },
  {
    id: '6',
    name: 'Felipe Santos',
    photo: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=6',
    entryMethod: 'Novo Membro',
    sex: 'Masculino',
    birthDate: birthdayThisMonth.toISOString().split('T')[0],
    guardian1: 'Carlos Santos',
    phone1: '(11) 95544-1122',
    hasAllergy: false,
    hasMedication: false,
    status: 'Ativo',
    registrationDate: '2023-11-20',
  },
]

const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Culto de Jovens',
    description: 'Encontro focado no ensino da palavra e louvor.',
    date: '2024-05-10',
    time: '14:00',
    location: 'Auditório Principal',
    category: 'Culto',
  },
  {
    id: '2',
    title: 'Hangout no Parque',
    description: 'Atividades interativas para fortalecimento do grupo.',
    date: '2024-05-18',
    time: '15:30',
    location: 'Parque da Cidade',
    category: 'Hangout',
  },
]

const MOCK_ATTENDANCES: Attendance[] = [
  { eventId: '1', participantId: '1', type: 'seed', present: true },
  { eventId: '1', participantId: '2', type: 'seed', present: true },
  { eventId: '1', participantId: '3', type: 'seed', present: false },
  { eventId: '1', participantId: '4', type: 'seed', present: false },
  { eventId: '1', participantId: '5', type: 'seed', present: true },
  { eventId: '2', participantId: '1', type: 'seed', present: true },
  { eventId: '2', participantId: '3', type: 'seed', present: true },
  { eventId: '1', participantId: '1', type: 'team', present: true },
  { eventId: '1', participantId: '2', type: 'team', present: false },
]

const MOCK_TEAM_MEMBERS: TeamMember[] = [
  {
    id: '1',
    name: 'Alvanice',
    photoUrl: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=1',
    email: 'alvanice@example.com',
    dateOfBirth: '1985-05-12',
    role: 'Líder',
    sex: 'Feminino',
    courses: {
      cme: { status: 'Completo', completionYear: '2020' },
      ebm: { status: 'Em progresso' },
      te: { status: 'Não feito' },
    },
  },
  {
    id: '2',
    name: 'Amaury Silva',
    photoUrl: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=2',
    email: 'amaury@example.com',
    dateOfBirth: '1990-10-21',
    role: 'Membro',
    sex: 'Masculino',
    courses: {
      cme: { status: 'Completo', completionYear: '2018' },
      ebm: { status: 'Completo', completionYear: '2021' },
      te: { status: 'Em progresso' },
    },
  },
  {
    id: '3',
    name: 'Ana Carolina Dias',
    photoUrl: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=3',
    email: 'anacarol@example.com',
    dateOfBirth: '1995-03-15',
    role: 'Líder',
    sex: 'Feminino',
    courses: {
      cme: { status: 'Não feito' },
      ebm: { status: 'Não feito' },
      te: { status: 'Não feito' },
    },
  },
]

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [baseSeeds, setBaseSeeds] = useState<Seed[]>(MOCK_SEEDS)
  const [events, setEvents] = useState<Event[]>(MOCK_EVENTS)
  const [attendances, setAttendances] = useState<Attendance[]>(MOCK_ATTENDANCES)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(MOCK_TEAM_MEMBERS)

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

  const addSeed = (
    seedData: Omit<Seed, 'id' | 'registrationDate' | 'status'> & { status?: 'Ativo' | 'Inativo' },
  ) => {
    const newSeed: Seed = {
      ...seedData,
      id: Math.random().toString(36).substring(2, 9),
      status: seedData.status || 'Ativo',
      registrationDate: new Date().toISOString().split('T')[0],
    }
    setBaseSeeds([...baseSeeds, newSeed])
  }

  const updateSeed = (id: string, seedData: Partial<Seed>) => {
    setBaseSeeds(baseSeeds.map((s) => (s.id === id ? { ...s, ...seedData } : s)))
  }

  const addEvent = (eventData: Omit<Event, 'id'>) => {
    const newEvent: Event = {
      ...eventData,
      id: Math.random().toString(36).substring(2, 9),
    }
    setEvents([...events, newEvent])
  }

  const toggleAttendance = (eventId: string, participantId: string, type: 'seed' | 'team') => {
    setAttendances((prev) => {
      const existing = prev.find(
        (a) => a.eventId === eventId && a.participantId === participantId && a.type === type,
      )
      if (existing) {
        return prev.map((a) => (a === existing ? { ...a, present: !a.present } : a))
      } else {
        return [...prev, { eventId, participantId, type, present: true }]
      }
    })
  }

  const addTeamMember = (memberData: Omit<TeamMember, 'id'>) => {
    const newMember: TeamMember = {
      ...memberData,
      id: Math.random().toString(36).substring(2, 9),
    }
    setTeamMembers([...teamMembers, newMember])
  }

  const updateTeamMember = (id: string, memberData: Partial<TeamMember>) => {
    setTeamMembers(teamMembers.map((m) => (m.id === id ? { ...m, ...memberData } : m)))
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
