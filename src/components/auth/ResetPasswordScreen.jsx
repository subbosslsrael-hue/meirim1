import React, { useState } from 'react'
import { Sun, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import Card from '../shared/Card'
import Field, { inputCls } from '../shared/Field'
import { useAuth } from '../../contexts/AuthContext'
import { passwordValid } from '../../lib/password'
import PasswordStrength from './PasswordStrength'

export default function ResetPasswordScreen() {
  const { updatePassword, signOut } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!passwordValid(password)) {
      setError('הסיסמה אינה עומדת בדרישות החוזק')
      return
    }
    if (password !== confirm) {
      setError('הסיסמאות אינן תואמות')
      return
    }
    setBusy(true)
    try {
      await updatePassword(password)
    } catch (err) {
      setError(err.message || 'שגיאה בעדכון הסיסמה')
      setBusy(false)
    }
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center p-5 bg-gradient-to-br from-amber-50 via-orange-50 to-emerald-50"
    >
      <Card className="w-full max-w-md p-7">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-emerald-500 flex items-center justify-center text-white shadow-lg mb-3">
            <Sun size={32} />
          </div>
          <h1 className="font-display text-2xl font-black text-emerald-800">
            הגדרת סיסמה חדשה
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            בחר/י סיסמה חדשה לחשבונך.
          </p>
        </div>

        <form onSubmit={submit}>
          <Field label="סיסמה חדשה">
            <div className="relative">
              <input
                className={inputCls}
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>
          <PasswordStrength password={password} />
          <Field label="אימות סיסמה">
            <input
              className={inputCls}
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </Field>

          {error && (
            <div className="flex items-center gap-2 text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl text-sm mb-3">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold transition"
          >
            {busy ? 'שומר…' : 'עדכון סיסמה'}
          </button>
        </form>

        <button
          type="button"
          onClick={signOut}
          className="w-full mt-3 text-xs text-stone-400 hover:text-stone-600"
        >
          ביטול וחזרה למסך הכניסה
        </button>
      </Card>
    </div>
  )
}
