import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Send,
  X,
  Smile,
  Reply,
  Pencil,
  Trash2,
  Megaphone,
  MessagesSquare,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

const PRESET_EMOJIS = ['👍', '❤️', '😂', '🎉', '🙏']

const dayLabel = (iso) => {
  const d = new Date(iso)
  return d.toLocaleDateString('he-IL', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  })
}
const timeLabel = (iso) =>
  new Date(iso).toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
  })

function ChatRoom({ channel, canPost, profile, isAdmin }) {
  const [messages, setMessages] = useState([])
  const [reactions, setReactions] = useState({})
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [editing, setEditing] = useState(null)
  const [replyTo, setReplyTo] = useState(null)
  const [pickerFor, setPickerFor] = useState(null)
  const [busy, setBusy] = useState(false)
  const bottomRef = useRef(null)

  const load = useCallback(async () => {
    const { data: msgs } = await supabase
      .from('chat_messages')
      .select(
        'id, profile_id, content, reply_to, edited, created_at, profile:profiles(id, name)',
      )
      .eq('channel', channel)
      .order('created_at', { ascending: true })
    setMessages(msgs || [])
    const ids = (msgs || []).map((m) => m.id)
    if (ids.length) {
      const { data: reacts } = await supabase
        .from('chat_reactions')
        .select('message_id, profile_id, emoji')
        .in('message_id', ids)
      const map = {}
      ;(reacts || []).forEach((r) => {
        ;(map[r.message_id] = map[r.message_id] || []).push(r)
      })
      setReactions(map)
    } else {
      setReactions({})
    }
    setLoading(false)
  }, [channel])

  useEffect(() => {
    load()
    const ch = supabase
      .channel(`chat:${channel}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel=eq.${channel}`,
        },
        () => load(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_reactions' },
        () => load(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [channel, load])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const body = text.trim()
    if (!body) return
    setBusy(true)
    try {
      if (editing) {
        await supabase
          .from('chat_messages')
          .update({ content: body, edited: true })
          .eq('id', editing.id)
      } else {
        await supabase.from('chat_messages').insert({
          channel,
          profile_id: profile.id,
          content: body,
          reply_to: replyTo?.id || null,
        })
      }
      setText('')
      setEditing(null)
      setReplyTo(null)
    } finally {
      setBusy(false)
    }
  }

  const toggleReaction = async (messageId, emoji) => {
    setPickerFor(null)
    const mine = (reactions[messageId] || []).find(
      (r) => r.profile_id === profile.id && r.emoji === emoji,
    )
    if (mine) {
      await supabase
        .from('chat_reactions')
        .delete()
        .match({ message_id: messageId, profile_id: profile.id, emoji })
    } else {
      await supabase
        .from('chat_reactions')
        .insert({ message_id: messageId, profile_id: profile.id, emoji })
    }
  }

  const del = async (m) => {
    if (!window.confirm('למחוק את ההודעה?')) return
    await supabase.from('chat_messages').delete().eq('id', m.id)
  }

  let lastDay = null

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[420px]">
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-stone-50 rounded-xl border border-stone-100">
        {loading ? (
          <p className="text-center text-stone-400 text-sm py-6">טוען…</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-stone-400 text-sm py-6">
            אין הודעות עדיין.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.profile_id === profile.id
            const orig = m.reply_to
              ? messages.find((x) => x.id === m.reply_to)
              : null
            const day = dayLabel(m.created_at)
            const showDay = day !== lastDay
            lastDay = day

            const grouped = {}
            ;(reactions[m.id] || []).forEach((r) => {
              grouped[r.emoji] = grouped[r.emoji] || { count: 0, mine: false }
              grouped[r.emoji].count++
              if (r.profile_id === profile.id) grouped[r.emoji].mine = true
            })

            return (
              <React.Fragment key={m.id}>
                {showDay && (
                  <div className="text-center my-2">
                    <span className="text-[10px] bg-stone-200 text-stone-500 px-2 py-0.5 rounded-full">
                      {day}
                    </span>
                  </div>
                )}
                <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[80%]">
                    <div
                      className={`rounded-2xl px-3 py-2 ${
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
                      {orig && (
                        <div
                          className={`text-[11px] border-r-2 pr-2 mb-1 rounded ${
                            mine
                              ? 'border-white/50 text-emerald-50'
                              : 'border-stone-300 text-stone-400'
                          }`}
                        >
                          <span className="font-semibold">
                            {orig.profile?.name}:{' '}
                          </span>
                          {(orig.content || '').slice(0, 60)}
                        </div>
                      )}
                      {m.reply_to && !orig && (
                        <div className="text-[11px] text-stone-400 mb-1 italic">
                          הודעה שנמחקה
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
                        {timeLabel(m.created_at)}
                        {m.edited ? ' · נערך' : ''}
                      </div>
                    </div>

                    {/* תגובות */}
                    {Object.keys(grouped).length > 0 && (
                      <div
                        className={`flex flex-wrap gap-1 mt-1 ${
                          mine ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {Object.entries(grouped).map(([emoji, g]) => (
                          <button
                            key={emoji}
                            onClick={() => toggleReaction(m.id, emoji)}
                            className={`text-[11px] px-1.5 py-0.5 rounded-full border ${
                              g.mine
                                ? 'bg-emerald-50 border-emerald-300'
                                : 'bg-white border-stone-200'
                            }`}
                          >
                            {emoji} {g.count}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* פעולות */}
                    <div
                      className={`flex items-center gap-2 mt-0.5 text-stone-400 ${
                        mine ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {pickerFor === m.id ? (
                        <div className="flex gap-1 bg-white border border-stone-200 rounded-full px-1.5 py-0.5">
                          {PRESET_EMOJIS.map((e) => (
                            <button
                              key={e}
                              onClick={() => toggleReaction(m.id, e)}
                              className="text-sm hover:scale-125 transition"
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <button
                          onClick={() => setPickerFor(m.id)}
                          title="תגובה מהירה"
                          className="hover:text-amber-500"
                        >
                          <Smile size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setReplyTo(m)
                          setEditing(null)
                        }}
                        title="מענה"
                        className="hover:text-sky-600"
                      >
                        <Reply size={14} />
                      </button>
                      {mine && (
                        <button
                          onClick={() => {
                            setEditing(m)
                            setReplyTo(null)
                            setText(m.content || '')
                          }}
                          title="עריכה"
                          className="hover:text-stone-700"
                        >
                          <Pencil size={13} />
                        </button>
                      )}
                      {(mine || isAdmin) && (
                        <button
                          onClick={() => del(m)}
                          title="מחיקה"
                          className="hover:text-rose-600"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* תיבת קלט */}
      {canPost ? (
        <div className="mt-2">
          {(replyTo || editing) && (
            <div className="flex items-center gap-2 text-xs bg-stone-100 rounded-lg px-3 py-1.5 mb-1">
              <span className="flex-1 text-stone-600 truncate">
                {editing
                  ? 'עריכת הודעה'
                  : `מענה ל${replyTo.profile?.name || ''}: ${(replyTo.content || '').slice(0, 40)}`}
              </span>
              <button
                onClick={() => {
                  setReplyTo(null)
                  setEditing(null)
                  setText('')
                }}
                className="text-stone-400 hover:text-rose-600"
              >
                <X size={14} />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
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
              className="flex-1 px-3 py-2.5 rounded-xl border border-stone-200 bg-white outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
            <button
              onClick={send}
              disabled={busy || !text.trim()}
              className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white shrink-0"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2 text-center text-sm text-stone-400 bg-stone-50 border border-stone-100 rounded-xl py-3">
          רק מנכ״ל ובנות שירות יכולים לפרסם בערוץ זה.
        </div>
      )}
    </div>
  )
}

export default function ChatPage() {
  const { profile } = useAuth()
  const [channel, setChannel] = useState('general')
  const isAdmin = profile?.role === 'admin'
  const isAdminOrService = isAdmin || profile?.role === 'service'
  const canPost = channel === 'general' || isAdminOrService

  const TABS = [
    { id: 'general', label: 'כללי', icon: MessagesSquare },
    { id: 'announcements', label: 'הודעות חשובות', icon: Megaphone },
  ]

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = channel === t.id
          return (
            <button
              key={t.id}
              onClick={() => setChannel(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold ${
                active
                  ? 'bg-amber-500 text-white shadow'
                  : 'bg-white border border-stone-200 text-stone-600'
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          )
        })}
      </div>

      <ChatRoom
        key={channel}
        channel={channel}
        canPost={canPost}
        profile={profile}
        isAdmin={isAdmin}
      />
    </div>
  )
}
