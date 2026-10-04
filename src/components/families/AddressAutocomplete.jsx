import React, { useEffect, useRef, useState } from 'react'
import { MapPin, Loader2, Check } from 'lucide-react'
import { inputCls } from '../shared/Field'
import { searchAddresses } from '../../lib/geocode'

/**
 * שדה כתובת עם השלמה אוטומטית ממאגר כתובות אמיתי (OSM/Nominatim).
 * בוחרים כתובת מתוך הרשימה — וכך מובטח שהיא קיימת וניתנת למיפוי.
 *   value     — טקסט הכתובת (רחוב + מספר)
 *   onPick    — נקרא עם { street, city, lat, lng } כשנבחרת כתובת מהרשימה
 *   onType    — נקרא עם הטקסט בכל הקלדה (כדי לעדכן את ה-form ולסמן "לא נבחר")
 *   picked    — boolean: האם הערך הנוכחי נבחר מהרשימה (לצביעת וי ירוק)
 */
export default function AddressAutocomplete({
  value,
  onPick,
  onType,
  picked,
  placeholder,
}) {
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(-1)
  const boxRef = useRef(null)
  const abortRef = useRef(null)
  const skipNextRef = useRef(false)

  // חיפוש עם השהיה (debounce) כדי לכבד את מדיניות Nominatim ולחסוך בקשות.
  useEffect(() => {
    // אם ההקלדה נובעת מבחירה מהרשימה — לא לפתוח חיפוש מחדש.
    if (skipNextRef.current) {
      skipNextRef.current = false
      return
    }
    const q = (value || '').trim()
    if (q.length < 3) {
      setResults([])
      setOpen(false)
      setLoading(false)
      return
    }
    setLoading(true)
    const t = setTimeout(async () => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      const rows = await searchAddresses(q, { signal: ctrl.signal })
      setResults(rows)
      setOpen(true)
      setActive(-1)
      setLoading(false)
    }, 450)
    return () => clearTimeout(t)
  }, [value])

  // סגירה בלחיצה מחוץ לרכיב
  useEffect(() => {
    const onDoc = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const choose = (r) => {
    skipNextRef.current = true
    onPick(r)
    setOpen(false)
    setResults([])
    setActive(-1)
  }

  const onKeyDown = (e) => {
    if (!open || !results.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault()
      choose(results[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="relative" ref={boxRef}>
      <div className="relative">
        <input
          className={`${inputCls} ${picked ? 'pl-9' : ''}`}
          value={value}
          onChange={(e) => onType(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder || 'התחל/י להקליד כתובת ובחר/י מהרשימה'}
          autoComplete="off"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 size={15} className="animate-spin text-stone-400" />
          ) : picked ? (
            <Check size={15} className="text-emerald-600" />
          ) : null}
        </span>
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-[50] mt-1 w-full bg-white border border-stone-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {results.map((r, i) => (
            <li key={`${r.lat},${r.lng},${i}`}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(r)}
                className={`w-full text-right flex items-start gap-2 px-3 py-2 text-sm hover:bg-amber-50 ${
                  i === active ? 'bg-amber-50' : ''
                }`}
              >
                <MapPin
                  size={14}
                  className="text-amber-500 mt-0.5 shrink-0"
                />
                <span className="text-stone-700">{r.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && !loading && results.length === 0 && (value || '').trim().length >= 3 && (
        <div className="absolute z-[50] mt-1 w-full bg-white border border-stone-200 rounded-xl shadow-lg px-3 py-2 text-sm text-stone-400">
          לא נמצאו כתובות תואמות. נסה/י לדייק (עיר + רחוב + מספר).
        </div>
      )}
    </div>
  )
}
