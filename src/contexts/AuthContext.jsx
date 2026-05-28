import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      return null
    }
    setProfileLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, branch:branches(id, name, city)')
        .eq('id', userId)
        .maybeSingle()
      if (error) {
        console.error('שגיאת טעינת פרופיל:', error)
        setProfile(null)
        return null
      }
      if (data) {
        setProfile(data)
        return data
      }

      // הפרופיל לא קיים – כנראה שה-trigger handle_new_user לא רץ.
      // ניצור פרופיל מינימלי בצד הלקוח כדי שתוכל לעבור ל-RoleSelector.
      console.warn('פרופיל לא נמצא, יוצר פרופיל ברירת מחדל')
      const { data: userData } = await supabase.auth.getUser()
      const meta = userData?.user?.user_metadata || {}
      const fallbackName =
        meta.name ||
        meta.full_name ||
        userData?.user?.email?.split('@')[0] ||
        'משתמש חדש'
      const { data: created, error: insertError } = await supabase
        .from('profiles')
        .insert({ id: userId, name: fallbackName, role: 'volunteer' })
        .select('*, branch:branches(id, name, city)')
        .single()
      if (insertError) {
        console.error('שגיאה ביצירת פרופיל:', insertError)
        setProfile(null)
        return null
      }
      setProfile(created)
      return created
    } finally {
      setProfileLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      if (data.session?.user) {
        fetchProfile(data.session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession?.user) {
        fetchProfile(newSession.user.id)
      } else {
        setProfile(null)
      }
    })
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signUp = useCallback(async ({ email, password, name, phone }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone },
      },
    })
    if (error) throw error
    return data
  }, [])

  const signIn = useCallback(async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })
    if (error) throw error
    return data
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  const updateProfile = useCallback(
    async (updates) => {
      if (!session?.user?.id) throw new Error('אין משתמש מחובר')
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', session.user.id)
        .select('*, branch:branches(id, name, city)')
        .single()
      if (error) throw error
      setProfile(data)
      return data
    },
    [session],
  )

  const value = {
    session,
    user: session?.user || null,
    profile,
    loading,
    profileLoading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    refreshProfile: () => fetchProfile(session?.user?.id),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth חייב להיות בתוך AuthProvider')
  return ctx
}
