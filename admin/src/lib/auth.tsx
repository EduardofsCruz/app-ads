import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

export interface Profile {
  id: string
  full_name: string
  role: 'user' | 'admin_local' | 'admin_global'
  church_id: string | null
  is_active: boolean
}

export interface Church {
  id: string
  name: string
  city: string
  state: string
}

interface AuthState {
  loading: boolean
  session: Session | null
  profile: Profile | null
  churches: Church[]
  /** Igreja selecionada para filtrar conteúdo; null = todas (só admin_global). */
  selectedChurch: string | null
  setSelectedChurch: (id: string | null) => void
  signOut: () => void
}

const AuthContext = createContext<AuthState>(null as unknown as AuthState)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [churches, setChurches] = useState<Church[]>([])
  const [selectedChurch, setSelectedChurch] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) {
      setProfile(null)
      setLoading(false)
      return
    }
    setLoading(true)
    Promise.all([
      supabase.from('profiles').select('*').eq('id', session.user.id).single(),
      supabase.from('churches').select('id, name, city, state').order('name'),
    ]).then(([p, c]) => {
      const prof = (p.data as Profile | null) ?? null
      setProfile(prof)
      setChurches((c.data as Church[]) ?? [])
      if (prof?.role === 'admin_local') setSelectedChurch(prof.church_id)
      setLoading(false)
    })
  }, [session])

  const signOut = () => {
    supabase.auth.signOut()
    setSelectedChurch(null)
  }

  return (
    <AuthContext.Provider
      value={{ loading, session, profile, churches, selectedChurch, setSelectedChurch, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
