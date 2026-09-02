import React, { useState } from 'react'
import { Star, CheckCircle2 } from 'lucide-react'
import Card from '../shared/Card'
import SkillsPicker from '../activities/SkillsPicker'
import { useAuth } from '../../contexts/AuthContext'
import { useSkillOptions } from '../../hooks/useSkillOptions'

const tokens = (s) =>
  String(s || '')
    .split(/[,،]/)
    .map((t) => t.trim())
    .filter(Boolean)

// טאב אישי למדריך: צפייה במיומנויות שלו ועריכתן (בחירה מהרשימה או "אחר" חופשי).
export default function MySkillsPage() {
  const { profile, updateProfile } = useAuth()
  const skillOptions = useSkillOptions()
  const [skills, setSkills] = useState(profile?.skills || '')
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  const dirty = (skills || '') !== (profile?.skills || '')
  const current = tokens(profile?.skills)

  const save = async () => {
    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      await updateProfile({ skills: skills.trim() || null })
      setSaved(true)
    } catch (e) {
      setError(e.message || 'שגיאה בשמירה')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h2 className="text-lg font-black text-stone-800">המיומנויות שלי</h2>
        <p className="text-sm text-stone-500">
          המיומנויות שלך משמשות לשיבוץ אוטומטי לפעילויות המתאימות לך.
        </p>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-stone-700 mb-2">
          <Star size={15} className="text-amber-500 fill-current" /> המיומנויות
          הנוכחיות שלי
        </div>
        {current.length ? (
          <div className="flex flex-wrap gap-1.5">
            {current.map((s) => (
              <span
                key={s}
                className="text-sm px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"
              >
                {s}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-stone-400">עדיין לא הוגדרו מיומנויות.</p>
        )}
      </Card>

      <Card className="p-4">
        <div className="text-sm font-semibold text-stone-700 mb-2">
          עריכת המיומנויות
        </div>
        <SkillsPicker
          value={skills}
          onChange={(v) => {
            setSkills(v)
            setSaved(false)
          }}
          options={skillOptions.data}
          canManage={false}
        />
        {error && <p className="text-sm text-rose-600 mt-2">{error}</p>}
        {saved && !dirty && (
          <p className="flex items-center gap-1 text-sm text-emerald-700 mt-2">
            <CheckCircle2 size={15} /> נשמר בהצלחה
          </p>
        )}
        <button
          onClick={save}
          disabled={busy || !dirty}
          className="mt-3 w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold"
        >
          {busy ? 'שומר…' : 'שמירת המיומנויות'}
        </button>
      </Card>
    </div>
  )
}
