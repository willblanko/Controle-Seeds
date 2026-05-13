import React, { createContext, useContext, useState, ReactNode } from 'react'

export type Seed = {
  id: string
  name: string
  email: string
  phone: string
  birthDate: string
  status: 'Ativo' | 'Inativo'
  registrationDate: string
  notes?: string
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
  seedId: string
  present: boolean
}

type AppContextType = {
  seeds: Seed[]
  events: Event[]
  attendances: Attendance[]
  addSeed: (seed: Omit<Seed, 'id' | 'registrationDate'>) => void
  updateSeed: (id: string, seed: Partial<Seed>) => void
  addEvent: (event: Omit<Event, 'id'>) => void
  toggleAttendance: (eventId: string, seedId: string) => void
}

const MOCK_SEEDS: Seed[] = [
  {
    id: '1',
    name: 'Ana Silva',
    email: 'ana.silva@example.com',
    phone: '(11) 98765-4321',
    birthDate: '2005-04-12',
    status: 'Ativo',
    registrationDate: '2023-08-01',
  },
  {
    id: '2',
    name: 'Bruno Costa',
    email: 'bruno.costa@example.com',
    phone: '(11) 91234-5678',
    birthDate: '2004-11-23',
    status: 'Ativo',
    registrationDate: '2023-08-15',
  },
  {
    id: '3',
    name: 'Carla Dias',
    email: 'carla.dias@example.com',
    phone: '(11) 99988-7766',
    birthDate: '2006-02-05',
    status: 'Ativo',
    registrationDate: '2023-09-10',
  },
  {
    id: '4',
    name: 'Diego Martins',
    email: 'diego.martins@example.com',
    phone: '(11) 97766-5544',
    birthDate: '2003-08-30',
    status: 'Inativo',
    registrationDate: '2023-07-22',
  },
  {
    id: '5',
    name: 'Elena Rocha',
    email: 'elena.rocha@example.com',
    phone: '(11) 95544-3322',
    birthDate: '2007-01-18',
    status: 'Ativo',
    registrationDate: '2023-10-05',
  },
]

const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Workshop de Liderança',
    description: 'Desenvolvimento de habilidades de liderança e trabalho em equipe.',
    date: '2024-05-10',
    time: '14:00',
    location: 'Auditório Principal',
    category: 'Pedagógico',
  },
  {
    id: '2',
    title: 'Dinâmica de Grupo',
    description: 'Atividades interativas para fortalecimento do grupo.',
    date: '2024-05-18',
    time: '15:30',
    location: 'Sala 3',
    category: 'Social',
  },
  {
    id: '3',
    title: 'Palestra de Inovação',
    description: 'Palestra sobre as novas tendências de mercado.',
    date: '2024-06-05',
    time: '10:00',
    location: 'Anfiteatro',
    category: 'Pedagógico',
  },
]

const MOCK_ATTENDANCES: Attendance[] = [
  { eventId: '1', seedId: '1', present: true },
  { eventId: '1', seedId: '2', present: true },
  { eventId: '1', seedId: '3', present: false },
  { eventId: '1', seedId: '4', present: false },
  { eventId: '1', seedId: '5', present: true },

  { eventId: '2', seedId: '1', present: true },
  { eventId: '2', seedId: '2', present: true },
  { eventId: '2', seedId: '3', present: true },
  { eventId: '2', seedId: '5', present: false },
]

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [seeds, setSeeds] = useState<Seed[]>(MOCK_SEEDS)
  const [events, setEvents] = useState<Event[]>(MOCK_EVENTS)
  const [attendances, setAttendances] = useState<Attendance[]>(MOCK_ATTENDANCES)

  const addSeed = (seedData: Omit<Seed, 'id' | 'registrationDate'>) => {
    const newSeed: Seed = {
      ...seedData,
      id: Math.random().toString(36).substring(2, 9),
      registrationDate: new Date().toISOString().split('T')[0],
    }
    setSeeds([...seeds, newSeed])
  }

  const updateSeed = (id: string, seedData: Partial<Seed>) => {
    setSeeds(seeds.map((s) => (s.id === id ? { ...s, ...seedData } : s)))
  }

  const addEvent = (eventData: Omit<Event, 'id'>) => {
    const newEvent: Event = {
      ...eventData,
      id: Math.random().toString(36).substring(2, 9),
    }
    setEvents([...events, newEvent])
  }

  const toggleAttendance = (eventId: string, seedId: string) => {
    setAttendances((prev) => {
      const existing = prev.find((a) => a.eventId === eventId && a.seedId === seedId)
      if (existing) {
        return prev.map((a) => (a === existing ? { ...a, present: !a.present } : a))
      } else {
        return [...prev, { eventId, seedId, present: true }]
      }
    })
  }

  return (
    <AppContext.Provider
      value={{ seeds, events, attendances, addSeed, updateSeed, addEvent, toggleAttendance }}
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
