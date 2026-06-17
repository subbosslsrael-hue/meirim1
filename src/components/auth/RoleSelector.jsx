import React, { useState } from 'react'
import {
  Sun,
  ShieldCheck,
  UserCheck,
  HandHeart,
  Briefcase,
  AlertTriangle,
} from 'lucide-react'
import Card from '../shared/Card'
import Field, { inputCls } from '../shared/Field'
import LoadingScreen from '../shared/LoadingScreen'
import { useAuth } from '../../contexts/AuthContext'
import { useBranches } from '../../hooks/useBranches'
import { normalizePhone, isValidIsraeliPhone } from '../../lib/phone'

const ROLE_OPTIONS = [
  {
    id: 'service',
    label: 'בת שירות לאומי',
    desc: 'ניהול הסניף, המשפחות והפעילויות',
    icon: UserCheck,
    color: 'amber',
    needsBranch: true,
  },
  {
    id: 'volunteer',
    label: 'מתנדב/ת בשטח',
    desc: 'הירשם לפעילויות ולחלוקות סלי מזון',
    icon: HandHeart,
    color: 'orange',
    needsBranch: true,
  },
  {
    id: 'instructor',
    label: 'מדריך/ה מקצועי/ת',
    desc: 'הובלת פעילויות לפי תחום מיומנות',
    icon: Briefcase,
    color: 'sky',
    needsBranch: false,
  },
]

const ADMIN_NOTE = {
  id: 'admin',
  label: 'מנכ״ל / הנהלה',
  desc: 'גישה זו ניתנת רק ע״י מנהל המערכת בצד השרת',
  icon: ShieldCheck,
  color: 'emerald',
  disabled: true,
}

export default function RoleSelector() {
  const { updateProfile, signOut, profile, user } = useAuth()
  const { data: branches, loading: branchesLoading } = useBranches()
  const [role, setRole] = useState(null)
  const [branchId, setBranchId] = useState('')
  const [skills, setSkills] = useState('')
  const [phone, setPhone] = useState(user?.user_metadata?.phone || '')
  const [age, setAge] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  if (branchesLoading) return <LoadingScreen message="טוען סניפים…" />

  const needsAge = role === 'volunteer' || role === 'instructor'

  const save = async () => {
    if (!role) return
    if (!phone.trim()) {
      setError('יש להזין טלפון ליצירת קשר')
      return
    }
    if (!isValidIsraeliPhone(phone)) {
      setError('מספר הטלפון אינו תקין (לדוגמה: 050-1234567)')
      return
    }
    if (needsAge && (!age || Number(age) < 1)) {
      setError('יש להזין גיל')
      return
    }
    const opt = ROLE_OPTIONS.find((r) => r.id === role)
    if (opt.needsBranch && !branchId) {
      setError('יש לבחור סניף')
      return
    }
    setError(null)
    setBusy(true)
    try {
      const updates = { role, phone: normalizePhone(phone) }
      if (opt.needsBranch) updates.branch_id = branchId
      else updates.branch_id = null
      if (needsAge) updates.age = Number(age)
      if (role === 'instructor') updates.skills = skills.trim() || null
      await updateProfile(updates)
    } catch (err) {
      setError(err.message || 'שגיאה בעת שמירה')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center p-5 bg-gradient-to-br from-amber-50 via-orange-50 to-emerald-50"
    >
      <Card className="w-full max-w-md p-7">
        <div className="text-center mb-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-emerald-500 flex items-center justify-center text-white shadow-lg mb-2">
            <Sun size={28} />
          </div>
          <h1 className="font-display text-xl font-black text-emerald-800">
            ברוך/ה הבא/ה{profile?.name ? `, ${profile.name}` : ''}
          </h1>
          <p className="text-sm text-stone-500 mt-1">בחר/י את תפקידך במערכת</p>
        </div>

        <div className="space-y-2.5 mb-3">
          {ROLE_OPTIONS.map((opt) => {
            const Icon = opt.icon
            const active = role === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setRole(opt.id)}
                className={`w-full p-3.5 rounded-2xl border-2 text-right transition flex items-center gap-3 ${
                  active
                    ? `border-${opt.color}-400 bg-${opt.color}-50/60`
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-${opt.color}-100 text-${opt.color}-700 flex items-center justify-center`}
                >
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-stone-800 text-sm">
                    {opt.label}
                  </div>
                  <div className="text-xs text-stone-500">{opt.desc}</div>
                </div>
              </button>
            )
          })}
          <div className="w-full p-3.5 rounded-2xl border-2 border-dashed border-stone-200 text-right flex items-center gap-3 opacity-60">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <div className="flex-1">
              <div className="font-bold text-stone-800 text-sm">
                {ADMIN_NOTE.label}
              </div>
              <div className="text-xs text-stone-500">{ADMIN_NOTE.desc}</div>
            </div>
          </div>
        </div>

        {role && (
          <Field label="טלפון ליצירת קשר">
            <input
              className={inputCls}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="050-1234567"
            />
          </Field>
        )}

        {needsAge && (
          <Field label="גיל">
            <input
              className={inputCls}
              type="number"
              min="1"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="לדוגמה: 24"
            />
          </Field>
        )}

        {role && ROLE_OPTIONS.find((r) => r.id === role)?.needsBranch && (
          <Field label="שיוך לסניף (לא ניתן לשינוי לאחר ההצטרפות)">
            <select
              className={inputCls}
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
            >
              <option value="">— בחר/י —</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
        )}

        {role === 'instructor' && (
          <Field label="מיומנויות (מופרדות בפסיק)">
            <input
              className={inputCls}
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="לדוגמה: ילדים, מוגבלויות"
            />
          </Field>
        )}

        {error && (
          <div className="flex items-center gap-2 text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl text-sm mb-3">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={signOut}
            className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-semibold"
          >
            יציאה
          </button>
          <button
            type="button"
            onClick={save}
            disabled={busy || !role}
            className="flex-[2] py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold"
          >
            {busy ? 'שומר…' : 'כניסה למערכת'}
          </button>
        </div>
      </Card>
    </div>
  )
}
