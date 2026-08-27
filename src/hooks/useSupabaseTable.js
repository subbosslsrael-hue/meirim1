import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Hook גנרי לטבלת Supabase: טעינה + realtime + mutate
 *   table       — שם הטבלה
 *   select      — מחרוזת ה-select (כולל joins)
 *   orderBy     — { column, ascending }  (אופציונלי)
 *   realtime    — true/false (האם להאזין לשינויים בזמן אמת)
 *   enabled     — האם להפעיל את ההוק (לדוגמה: false עד שיש user)
 */
export function useSupabaseTable({
  table,
  select = '*',
  orderBy,
  realtime = false,
  enabled = true,
}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState(null)
  const mounted = useRef(true)

  const load = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    let q = supabase.from(table).select(select)
    if (orderBy?.column) q = q.order(orderBy.column, { ascending: orderBy.ascending ?? true })
    const { data: rows, error: err } = await q
    if (!mounted.current) return
    if (err) {
      setError(err)
      setData([])
    } else {
      setData(rows || [])
    }
    setLoading(false)
  }, [table, select, orderBy?.column, orderBy?.ascending, enabled])

  useEffect(() => {
    mounted.current = true
    load()
    return () => {
      mounted.current = false
    }
  }, [load])

  useEffect(() => {
    if (!realtime || !enabled) return
    const channel = supabase
      .channel(`realtime:${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => load(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, realtime, enabled, load])

  const insert = useCallback(
    async (row) => {
      const { data: inserted, error: err } = await supabase
        .from(table)
        .insert(row)
        .select()
        .single()
      if (err) throw err
      await load()
      return inserted
    },
    [table, load],
  )

  const update = useCallback(
    async (id, updates) => {
      const { data: rows, error: err } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
      if (err) throw err
      // 0 שורות = ה-UPDATE נחסם ע"י RLS (אין הרשאה) או שהפריט לא נמצא.
      // מחזירים הודעה ברורה במקום שגיאת ה-JSON המעורפלת של PostgREST.
      if (!rows || rows.length === 0) {
        await load()
        throw new Error('לא ניתן לשמור — ייתכן שאין לך הרשאה לערוך פריט זה.')
      }
      await load()
      return rows[0]
    },
    [table, load],
  )

  const remove = useCallback(
    async (id) => {
      const { data: deleted, error: err } = await supabase
        .from(table)
        .delete()
        .eq('id', id)
        .select()
      if (err) throw err
      // 0 שורות = המחיקה נחסמה ע"י RLS (אין הרשאה) או שהפריט לא נמצא.
      if (!deleted || deleted.length === 0) {
        await load()
        throw new Error('לא ניתן למחוק — ייתכן שאין לך הרשאה למחוק פריט זה.')
      }
      await load()
    },
    [table, load],
  )

  return { data, loading, error, mutate: load, insert, update, remove }
}
