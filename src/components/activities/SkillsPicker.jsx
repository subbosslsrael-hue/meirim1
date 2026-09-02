import React, { useState } from 'react'
import { X, Plus, Trash2, Settings2, Check } from 'lucide-react'
import { inputCls } from '../shared/Field'

const tokens = (s) =>
  String(s || '')
    .split(/[,،]/)
    .map((t) => t.trim())
    .filter(Boolean)

/**
 * בורר מיומנויות נדרשות לפעילות.
 *  - צ'יפים לבחירה מתוך רשימה קבועה (skill_options מה-DB)
 *  - "אחר": הקלדה חופשית שמתווספת לפעילות הנוכחית בלבד
 *  - ניהול הרשימה (הוספה/מחיקה) — למנכ"ל בלבד, משפיע על כל המערכת
 * הערך נשמר החוצה כמחרוזת מופרדת בפסיקים (תאימות לאלגוריתם התאמת המדריכים).
 */
export default function SkillsPicker({
  value,
  onChange,
  options = [],
  onAddOption,
  onDeleteOption,
  canManage = false,
}) {
  const selected = tokens(value)
  const optionNames = options.map((o) => o.name)
  const [other, setOther] = useState('')
  const [manage, setManage] = useState(false)
  const [newSkill, setNewSkill] = useState('')
  const [err, setErr] = useState(null)

  const setSelected = (arr) => onChange(arr.join(', '))

  const toggle = (name) =>
    selected.includes(name)
      ? setSelected(selected.filter((s) => s !== name))
      : setSelected([...selected, name])

  const addOther = () => {
    const t = other.trim()
    if (!t) return
    if (!selected.includes(t)) setSelected([...selected, t])
    setOther('')
  }

  // מיומנויות שנבחרו אך אינן ברשימה הקבועה = ערכי "אחר" / חופשי
  const customSelected = selected.filter((s) => !optionNames.includes(s))

  const addOption = async () => {
    const t = newSkill.trim()
    if (!t) return
    setErr(null)
    try {
      await onAddOption({ name: t })
      setNewSkill('')
    } catch (e) {
      setErr(
        /duplicate|unique/i.test(e.message || '')
          ? 'המיומנות כבר קיימת ברשימה'
          : e.message || 'שגיאה בהוספה',
      )
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = selected.includes(o.name)
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => toggle(o.name)}
              className={`text-sm px-3 py-1.5 rounded-full border flex items-center gap-1 ${
                on
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
            >
              {on && <Check size={12} />}
              {o.name}
            </button>
          )
        })}
        {options.length === 0 && (
          <span className="text-xs text-stone-400 py-1.5">
            אין מיומנויות ברשימה עדיין.
          </span>
        )}
      </div>

      {customSelected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {customSelected.map((s) => (
            <span
              key={s}
              className="text-sm px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1"
            >
              {s}
              <button
                type="button"
                onClick={() => toggle(s)}
                className="hover:text-amber-900"
                title="הסרה"
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-2">
        <input
          className={inputCls}
          value={other}
          onChange={(e) => setOther(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addOther()
            }
          }}
          placeholder="אחר — הקלד/י מיומנות חופשית"
        />
        <button
          type="button"
          onClick={addOther}
          className="shrink-0 flex items-center gap-1 bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 rounded-xl font-semibold text-sm"
        >
          <Plus size={16} /> הוספה
        </button>
      </div>

      {canManage && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setManage((m) => !m)}
            className="flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800"
          >
            <Settings2 size={13} />
            {manage ? 'סגירת ניהול הרשימה' : 'ניהול רשימת המיומנויות (מנכ״ל)'}
          </button>
          {manage && (
            <div className="mt-2 bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-2">
              <p className="text-xs text-stone-500">
                הוספה או מחיקה משפיעות על הרשימה שרואים כל המשתמשים.
              </p>
              {options.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {options.map((o) => (
                    <span
                      key={o.id}
                      className="text-sm px-2.5 py-1 rounded-lg bg-white border border-stone-200 flex items-center gap-1.5"
                    >
                      {o.name}
                      <button
                        type="button"
                        onClick={() => onDeleteOption(o.id)}
                        className="text-rose-500 hover:text-rose-700"
                        title="מחיקה מהרשימה"
                      >
                        <Trash2 size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  className={inputCls}
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addOption()
                    }
                  }}
                  placeholder="מיומנות חדשה לרשימה"
                />
                <button
                  type="button"
                  onClick={addOption}
                  className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white px-3 rounded-xl font-semibold text-sm"
                >
                  הוספה לרשימה
                </button>
              </div>
              {err && <p className="text-xs text-rose-600">{err}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
