import { useCallback, useEffect, useId, useState } from 'react'
import { supabase } from '../lib/supabase'

// ספירת הודעות צ'אט שלא נקראו, לפי ערוץ, עם עדכון חי.
export function useChatUnread({ enabled = true } = {}) {
  const id = useId()
  const [counts, setCounts] = useState({})

  const refresh = useCallback(async () => {
    if (!enabled) return
    const { data } = await supabase.rpc('chat_unread_counts')
    const m = {}
    ;(data || []).forEach((r) => {
      m[r.channel] = r.unread
    })
    setCounts(m)
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    refresh()
    const ch = supabase
      .channel(`chat-unread-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages' },
        () => refresh(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_reads' },
        () => refresh(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [enabled, id, refresh])

  const total = Object.values(counts).reduce((s, n) => s + n, 0)
  return { counts, total, refresh }
}
