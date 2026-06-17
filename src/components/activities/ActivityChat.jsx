import React, { useEffect, useRef, useState } from 'react'
import { Send, X, MessageCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function ActivityChat({ activity, currentProfile, onClose }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)

  const load = async () => {
    const { data, error: err } = await supabase
      .from('activity_messages')
      .select('id, content, created_at, profile_id, profile:profiles(id, name)')
      .eq('activity_id', activity.id)
      .order('created_at', { ascending: true })
    if (err) setError(err.message)
    else setMessages(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    const channel = supabase
      .channel(`activity_messages:${activity.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_messages',
          filter: `activity_id=eq.${activity.id}`,
        },
        () => load(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const body = text.trim()
    if (!body) return
    setSending(true)
    setError(null)
    const { error: err } = await supabase.from('activity_messages').insert({
      activity_id: activity.id,
      profile_id: currentProfile.id,
      content: body,
    })
    if (err) setError(err.message)
    else setText('')
    setSending(false)
  }

  return (
    <div
      className="fixed inset-0 z-[2000] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl flex flex-col h-[82vh] sm:h-[70vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-3 border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <MessageCircle size={18} className="text-amber-500 shrink-0" />
            <div className="min-w-0">
              <div className="font-bold text-stone-800 text-sm truncate">
                צ׳אט הפעילות
              </div>
              <div className="text-[11px] text-stone-400 truncate">
                {activity.name}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-stone-50">
          {loading ? (
            <p className="text-center text-stone-400 text-sm py-6">טוען…</p>
          ) : messages.length === 0 ? (
            <p className="text-center text-stone-400 text-sm py-6">
              אין הודעות עדיין — כתבו את הראשונה ✍️
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.profile_id === currentProfile.id
              return (
                <div
                  key={m.id}
                  className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                      mine
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border border-stone-200 text-stone-700'
                    }`}
                  >
                    {!mine && (
                      <div className="text-[10px] font-semibold text-emerald-700 mb-0.5">
                        {m.profile?.name || '—'}
                      </div>
                    )}
                    <div className="text-sm whitespace-pre-wrap break-words">
                      {m.content}
                    </div>
                    <div
                      className={`text-[9px] mt-0.5 ${
                        mine ? 'text-emerald-100' : 'text-stone-400'
                      }`}
                    >
                      {new Date(m.created_at).toLocaleString('he-IL', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="text-xs text-rose-600 px-3 py-1 shrink-0">{error}</div>
        )}
        <div className="p-3 border-t border-stone-100 flex items-center gap-2 shrink-0">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            placeholder="כתוב הודעה…"
            className="flex-1 px-3 py-2 rounded-xl border border-stone-200 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          />
          <button
            onClick={send}
            disabled={sending || !text.trim()}
            className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white shrink-0"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
