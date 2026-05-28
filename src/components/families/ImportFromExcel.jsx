import React, { useRef } from 'react'
import { FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { CATEGORIES } from '../../lib/constants'
import { fallbackForCity } from '../../lib/geocode'

const pickCol = (row, keys) => {
  for (const k of Object.keys(row)) {
    const kk = String(k).replace(/\s/g, '')
    if (keys.some((key) => kk.includes(key))) return row[k]
  }
  return ''
}

export default function ImportFromExcel({ branches, profiles, onImport, onResult }) {
  const fileRef = useRef(null)

  const handle = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
        defval: '',
      })
      const newFams = rows
        .map((r) => {
          const name = String(pickCol(r, ['שםמשפחה', 'משפחה', 'שם'])).trim()
          const city = String(pickCol(r, ['עיר', 'ישוב', 'יישוב'])).trim()
          const address = String(pickCol(r, ['כתובת', 'רחוב'])).trim()
          const phone = String(pickCol(r, ['טלפון', 'נייד', 'פלאפון'])).trim()
          const cat = String(pickCol(r, ['צורך', 'קטגוריה', 'סוג'])).trim()
          const branch =
            branches.find(
              (b) => city && (b.city.includes(city) || city.includes(b.city)),
            ) || branches[0]
          const responsible = profiles.find(
            (p) => p.role === 'service' && p.branch_id === branch?.id,
          )
          const fallback = fallbackForCity(city) || null
          return {
            name: name || 'ללא שם',
            branch_id: branch?.id || null,
            city: city || branch?.city || '',
            address,
            phone,
            need_category:
              CATEGORIES.find((c) => cat && c.includes(cat)) ||
              cat ||
              CATEGORIES[0],
            responsible_profile_id: responsible?.id || null,
            lat: fallback?.lat || null,
            lng: fallback?.lng || null,
          }
        })
        .filter((f) => f.name && f.name !== 'ללא שם')

      if (!newFams.length) {
        onResult({ error: true, message: 'לא נמצאו שורות תקינות בקובץ' })
        return
      }
      await onImport(newFams)
      onResult({ count: newFams.length })
    } catch (err) {
      console.error(err)
      onResult({ error: true, message: 'הקובץ אינו תקין או שאינו אקסל' })
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <>
      <button
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow"
      >
        <FileSpreadsheet size={18} /> ייבוא מ-Excel
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handle}
        className="hidden"
      />
    </>
  )
}
