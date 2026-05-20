import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'

export type Church = {
  id: string
  name: string
}

type ChurchContextType = {
  currentChurch: Church | null
  setCurrentChurch: (church: Church | null) => void
  availableChurches: Church[]
  loadingChurches: boolean
}

const ChurchContext = createContext<ChurchContextType | undefined>(undefined)

export function ChurchProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [currentChurch, setCurrentChurchState] = useState<Church | null>(() => {
    const saved = localStorage.getItem('currentChurch')
    return saved ? JSON.parse(saved) : null
  })
  const [availableChurches, setAvailableChurches] = useState<Church[]>([])
  const [loadingChurches, setLoadingChurches] = useState(true)

  const setCurrentChurch = (church: Church | null) => {
    setCurrentChurchState(church)
    if (church) {
      localStorage.setItem('currentChurch', JSON.stringify(church))
    } else {
      localStorage.removeItem('currentChurch')
    }
  }

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setCurrentChurch(null)
      setAvailableChurches([])
      setLoadingChurches(false)
      return
    }

    setLoadingChurches(true)
    pb.collection('churches')
      .getFullList<Church>()
      .then((churches) => {
        setAvailableChurches(churches)
        if (user.role === 'admin') {
          if (currentChurch && !churches.find((c) => c.id === currentChurch.id)) {
            setCurrentChurch(null)
          }
        } else {
          if (churches.length === 1) {
            setCurrentChurch(churches[0])
          } else if (currentChurch && !churches.find((c) => c.id === currentChurch.id)) {
            setCurrentChurch(null)
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load churches:', err)
      })
      .finally(() => {
        setLoadingChurches(false)
      })
  }, [isAuthenticated, user?.id])

  return (
    <ChurchContext.Provider
      value={{ currentChurch, setCurrentChurch, availableChurches, loadingChurches }}
    >
      {children}
    </ChurchContext.Provider>
  )
}

export function useChurch() {
  const context = useContext(ChurchContext)
  if (context === undefined) {
    throw new Error('useChurch must be used within a ChurchProvider')
  }
  return context
}
