import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import { useChurch } from './church-context'
import { useRealtime } from '@/hooks/use-realtime'

export interface Seed {
  id: string
  name: string
  photo?: string
  entryMethod: string
  sex: string
  birthDate: string
  guardian1: string
  guardian2?: string
  phone1: string
  phone2?: string
  hasAllergy?: boolean
  allergyDetails?: string
  hasMedication?: boolean
  medicationDetails?: string
  notes?: string
  status: string
  registrationDate?: string
}

type AppContextType = {
  seeds: Seed[]
  teamMembers: any[]
  events: any[]
  attendances: any[]
  addSeed: (data: any) => Promise<void>
  updateSeed: (id: string, data: any) => Promise<void>
  addTeamMember: (data: any) => Promise<void>
  updateTeamMember: (id: string, data: any) => Promise<void>
  addEvent: (data: any) => Promise<void>
  toggleAttendance: (eventId: string, personId: string, type: 'seed' | 'team') => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const { currentChurch } = useChurch()
  const [seeds, setSeeds] = useState<Seed[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [attendances, setAttendances] = useState<any[]>([])

  const loadData = async () => {
    if (!currentChurch) {
      setSeeds([])
      setTeamMembers([])
      setEvents([])
      setAttendances([])
      return
    }
    try {
      const [s, tm, e, a] = await Promise.all([
        pb.collection('seeds').getFullList<Seed>({ filter: `church = "${currentChurch.id}"` }),
        pb.collection('team_members').getFullList({ filter: `church = "${currentChurch.id}"` }),
        pb.collection('events').getFullList({ filter: `church = "${currentChurch.id}"` }),
        pb
          .collection('attendances')
          .getFullList({ filter: `event.church = "${currentChurch.id}"` }),
      ])
      setSeeds(s)
      setTeamMembers(tm)
      setEvents(e)
      setAttendances(a)
    } catch (error) {
      console.error('Error loading app data', error)
    }
  }

  useEffect(() => {
    loadData()
  }, [currentChurch?.id])

  useRealtime('seeds', () => loadData())
  useRealtime('team_members', () => loadData())
  useRealtime('events', () => loadData())
  useRealtime('attendances', () => loadData())

  const addSeed = async (data: any) => {
    if (!currentChurch) throw new Error('No church selected')
    await pb.collection('seeds').create({ ...data, church: currentChurch.id, status: 'Ativo' })
  }

  const updateSeed = async (id: string, data: any) => {
    await pb.collection('seeds').update(id, data)
  }

  const addTeamMember = async (data: any) => {
    if (!currentChurch) throw new Error('No church selected')
    await pb.collection('team_members').create({ ...data, church: currentChurch.id })
  }

  const updateTeamMember = async (id: string, data: any) => {
    await pb.collection('team_members').update(id, data)
  }

  const addEvent = async (data: any) => {
    if (!currentChurch) throw new Error('No church selected')
    await pb.collection('events').create({ ...data, church: currentChurch.id })
  }

  const toggleAttendance = async (eventId: string, personId: string, type: 'seed' | 'team') => {
    const existing = attendances.find(
      (a) =>
        a.event === eventId &&
        a.type === type &&
        (type === 'seed' ? a.seed === personId : a.team_member === personId),
    )
    if (existing) {
      await pb.collection('attendances').update(existing.id, { present: !existing.present })
    } else {
      await pb.collection('attendances').create({
        event: eventId,
        type,
        seed: type === 'seed' ? personId : undefined,
        team_member: type === 'team' ? personId : undefined,
        present: true,
      })
    }
  }

  return (
    <AppContext.Provider
      value={{
        seeds,
        teamMembers,
        events,
        attendances,
        addSeed,
        updateSeed,
        addTeamMember,
        updateTeamMember,
        addEvent,
        toggleAttendance,
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
