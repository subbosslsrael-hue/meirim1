import React, { useState } from 'react'
import { Sun, AlertTriangle, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import Card from '../shared/Card'
import Field, { inputCls } from '../shared/Field'
import { useAuth } from '../../contexts/AuthContext'
import { passwordValid } from '../../lib/password'
import PasswordStrength from './PasswordStrength'

export default function LoginScreen() {
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth()
  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirm: '',
    name: '',
    phone: '',
  })
  const [show, setShow] = useState(false)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [busy, setBusy] = useState(false)

  const forgot = async () => {
    setError(null)
    setInfo(null)
    if (!form.email.trim()) {
      setError('יש להזין דוא״ל לשחזור הסיסמה')
      return
    }
    setBusy(true)
    try {
      await resetPassword(form.email.trim())
      setInfo(`שלחנו קישור לאיפוס סיסמה אל ${form.email}. בדוק/י את הדוא״ל.`)
    } catch (err) {
      setError(err.message || 'שגיאה בשליחת קישור איפוס')
    } finally {
      setBusy(false)
    }
  }

  const handleGoogle = async () => {
    setError(null)
    setBusy(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err.message || 'שגיאה בכניסה עם Google')
      setBusy(false)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setBusy(true)
    try {
      if (mode === 'signin') {
        await signIn({ email: form.email, password: form.password })
      } else {
        if (!form.name.trim()) throw new Error('יש להזין שם מלא')
        if (!passwordValid(form.password))
          throw new Error(
            'הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה, אות קטנה וספרה',
          )
        if (form.password !== form.confirm)
          throw new Error('הסיסמאות אינן תואמות')
        const result = await signUp({
          email: form.email,
          password: form.password,
          name: form.name.trim(),
          phone: form.phone.trim(),
        })
        if (!result?.session) {
          setInfo(
            `שלחנו אימייל אימות אל ${form.email}. יש ללחוץ על הקישור באימייל ואז לחזור ולהתחבר.`,
          )
          setMode('signin')
          setForm({ ...form, password: '', confirm: '', name: '', phone: '' })
        }
      }
    } catch (err) {
      console.error('שגיאת אימות:', err)
      setError(err.message || 'שגיאה לא ידועה')
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
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-emerald-500 flex items-center justify-center text-white shadow-lg mb-3">
            <Sun size={32} />
          </div>
          <h1 className="font-display text-2xl font-black text-emerald-800">
            ברוכים הבאים למאירים
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            {mode === 'signin' ? 'התחברות למערכת' : 'הצטרפות חדשה למערכת'}
          </p>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => {
              setMode('signin')
              setError(null)
            }}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold border ${
              mode === 'signin'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-stone-50 text-stone-600 border-stone-200'
            }`}
          >
            כניסה
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup')
              setError(null)
            }}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold border ${
              mode === 'signup'
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-stone-50 text-stone-600 border-stone-200'
            }`}
          >
            הרשמה
          </button>
        </div>

        <form onSubmit={submit}>
          {mode === 'signup' && (
            <>
              <Field label="שם מלא">
                <input
                  className={inputCls}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </Field>
              <Field label="טלפון">
                <input
                  className={inputCls}
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </Field>
            </>
          )}
          <Field label="דוא״ל">
            <input
              className={inputCls}
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </Field>
          <Field label="סיסמה">
            <div className="relative">
              <input
                className={inputCls}
                type={show ? 'text' : 'password'}
                autoComplete={
                  mode === 'signin' ? 'current-password' : 'new-password'
                }
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
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

          {mode === 'signup' && <PasswordStrength password={form.password} />}

          {mode === 'signup' && (
            <Field label="אימות סיסמה">
              <input
                className={inputCls}
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                required
              />
            </Field>
          )}

          {mode === 'signin' && (
            <div className="text-left -mt-1 mb-3">
              <button
                type="button"
                onClick={forgot}
                disabled={busy}
                className="text-xs text-amber-600 hover:underline font-semibold"
              >
                שכחתי סיסמה
              </button>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl text-sm mb-3">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {info && (
            <div className="flex items-start gap-2 text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl text-sm mb-3">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              <span>{info}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold transition"
          >
            {busy ? 'רגע…' : mode === 'signin' ? 'כניסה' : 'יצירת חשבון'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-stone-200" />
          <span className="text-xs text-stone-400">או</span>
          <div className="flex-1 h-px bg-stone-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={busy}
          className="w-full py-2.5 rounded-xl bg-white hover:bg-stone-50 disabled:opacity-50 text-stone-700 font-semibold transition border border-stone-300 flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          המשך עם Google
        </button>

        {mode === 'signup' && (
          <p className="text-[11px] text-stone-400 mt-3 text-center">
            לאחר ההרשמה תתבקש/י לבחור סניף ותפקיד.
          </p>
        )}
      </Card>
    </div>
  )
}
