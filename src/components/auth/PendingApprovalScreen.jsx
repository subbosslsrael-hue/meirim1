import React, { useEffect } from 'react'
import { Clock, LogOut, RefreshCw } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { ROLES } from '../../lib/constants'

// מסך שמוצג למשתמש שנרשם ובחר תפקיד אך טרם אושר ע"י מנכ"ל.
export default function PendingApprovalScreen() {
  const { profile, signOut, refreshProfile } = useAuth()

  // מאזין לשינוי בפרופיל של המשתמש — ברגע שמנכ"ל מאשר, המסך יתחלף מיד.
  useEffect(() => {
    if (!profile?.id) return
    const ch = supabase
      .channel(`profile-approval-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${profile.id}`,
        },
        () => refreshProfile(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [profile?.id, refreshProfile])

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center p-5 bg-gradient-to-br from-amber-50 via-orange-50 to-emerald-50"
    >
      <div className="bg-white rounded-2xl shadow-lg p-7 max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <Clock size={30} />
        </div>
        <h2 className="text-lg font-black text-stone-800 mb-2">
          הבקשה שלך ממתינה לאישור
        </h2>
        <p className="text-sm text-stone-600 mb-1">
          שלום {profile?.name}, נרשמת בתור{' '}
          <span className="font-semibold">
            {ROLES[profile?.role]?.label || profile?.role}
          </span>
          .
        </p>
        <p className="text-sm text-stone-600 mb-5">
          הכניסה למערכת תיפתח לאחר שמנכ״ל העמותה יאשר את הבקשה. אפשר להשאיר את
          הדף פתוח — הוא יתעדכן אוטומטית ברגע שתאושר.
        </p>
        <div className="flex gap-2">
          <button
            onClick={refreshProfile}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold"
          >
            <RefreshCw size={16} /> בדוק שוב
          </button>
          <button
            onClick={signOut}
            className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-stone-200 text-stone-600 font-semibold"
          >
            <LogOut size={16} /> התנתק
          </button>
        </div>
      </div>
    </div>
  )
}
