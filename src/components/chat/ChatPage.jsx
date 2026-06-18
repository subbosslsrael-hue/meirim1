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

const AVATAR_COLORS = [
  'bg-amber-400',
  'bg-orange-400',
  'bg-rose-400',
  'bg-emerald-400',
  'bg-sky-400',
  'bg-violet-400',
]
const avatarColor = (name) => {
  let h = 0
  for (const c of name || '') h += c.charCodeAt(0)
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}
const initial = (name) => (name || '?').trim().charAt(0) || '?'

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

function ChatRoom({ channel, canPost, profile, isAdmin, onRead }) {
  const [messages, setMessages] = useState([])
  const [reactions, setReactions] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [text, setText] = useState('')
  const [editing, setEditing] = useState(null)
  const [replyTo, setReplyTo] = useState(null)
  const [pickerFor, setPickerFor] = useState(null)
  const [busy, setBusy] = useState(false)
  const bottomRef = useRef(null)

  const load = useCallback(async () => {
    const { data: msgs, error } = await supabase
      .from('chat_messages')
      .select(
        'id, profile_id, sender_name, content, reply_to, edited, created_at',
      )
      .eq('channel', channel)
      .order('created_at', { ascending: true })
    if (error) {
      setLoadError(error.message)
      setLoading(false)
      return
    }
    setLoadError(null)
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
    await supabase.rpc('mark_chat_read', { p_channel: channel })
    onRead?.()
  }, [channel, onRead])

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
      const { error } = editing
        ? await supabase
            .from('chat_messages')
            .update({ content: body, edited: true })
            .eq('id', editing.id)
        : await supabase.from('chat_messages').insert({
            channel,
            profile_id: profile.id,
            sender_name: profile.name,
            content: body,
            reply_to: replyTo?.id || null,
          })
      if (error) throw error
      setText('')
      setEditing(null)
      setReplyTo(null)
      await load()
    } catch (e) {
      alert(e.message || 'שגיאה בשליחת ההודעה')
    } finally {
      setBusy(false)
    }
  }

  const toggleReaction = async (messageId, emoji) => {
    setPickerFor(null)
    const mine = (reactions[messageId] || []).find(
      (r) => r.profile_id === profile.id && r.emoji === emoji,
    )
    const { error } = mine
      ? await supabase
          .from('chat_reactions')
          .delete()
          .match({ message_id: messageId, profile_id: profile.id, emoji })
      : await supabase
          .from('chat_reactions')
          .insert({ message_id: messageId, profile_id: profile.id, emoji })
    if (error) {
      alert(error.message || 'שגיאה')
      return
    }
    await load()
  }

  const del = async (m) => {
    if (!window.confirm('למחוק את ההודעה?')) return
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', m.id)
    if (error) {
      alert(error.message || 'שגיאה במחיקה')
      return
    }
    await load()
  }

  let lastDay = null

  return (
    <div className="flex flex-col h-[calc(100dvh-150px)] md:h-[calc(100vh-220px)] md:min-h-[420px]">
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gradient-to-b from-amber-50/60 to-orange-50/30 rounded-2xl border border-amber-100/70">
        {loading ? (
          <p className="text-center text-stone-400 text-sm py-6">טוען…</p>
        ) : loadError ? (
          <p className="text-center text-rose-600 text-sm py-6">{loadError}</p>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 text-stone-400 py-10">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-500 flex items-center justify-center">
              <MessagesSquare size={26} />
            </div>
            <p className="text-sm">עדיין שקט כאן — תהיו הראשונים לכתוב 💬</p>
          </div>
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
                  <div className="text-center my-3">
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full font-medium">
                      {day}
                    </span>
                  </div>
                )}
                <div
                  className={`flex items-end gap-2 ${
                    mine ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {!mine && (
                    <div
                      className={`w-7 h-7 rounded-full ${avatarColor(
                        m.sender_name,
                      )} text-white text-xs font-bold flex items-center justify-center shrink-0`}
                    >
                      {initial(m.sender_name)}
                    </div>
                  )}
                  <div className="max-w-[78%]">
                    <div
                      className={`px-3 py-2 shadow-sm ${
                        mine
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-2xl rounded-bl-md'
                          : 'bg-white border border-amber-100 text-stone-700 rounded-2xl rounded-br-md'
                      }`}
                    >
                      {!mine && (
                        <div className="text-[10px] font-bold text-orange-600 mb-0.5">
                          {m.sender_name || '—'}
                        </div>
                      )}
                      {orig && (
                        <div
                          className={`text-[11px] border-r-2 pr-2 mb-1 rounded ${
                            mine
                              ? 'border-white/60 text-amber-50'
                              : 'border-amber-300 text-stone-400'
                          }`}
                        >
                          <span className="font-semibold">
                            {orig.sender_name}:{' '}
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
                          mine ? 'text-amber-50/90' : 'text-stone-400'
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
                                ? 'bg-amber-100 border-amber-300'
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
            <div className="flex items-center gap-2 text-xs bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5 mb-1">
              <span className="flex-1 text-stone-600 truncate">
                {editing
                  ? 'עריכת הודעה'
                  : `מענה ל${replyTo.sender_name || ''}: ${(replyTo.content || '').slice(0, 40)}`}
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
              className="flex-1 px-4 py-2.5 rounded-full border border-amber-200 bg-white outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
            <button
              onClick={send}
              disabled={busy || !text.trim()}
              className="p-2.5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 disabled:opacity-40 text-white shrink-0 shadow"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2 text-center text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl py-3 flex items-center justify-center gap-1.5">
          <Megaphone size={15} />
          רק מנכ״ל ובנות שירות יכולים לפרסם בערוץ זה.
        </div>
      )}
    </div>
  )
}

export default function ChatPage({ chatCounts = {}, onRead }) {
  const { profile } = useAuth()
  const [channel, setChannel] = useState('general')
  const isAdmin = profile?.role === 'admin'
  const isAdminOrService = isAdmin || profile?.role === 'service'
  const canPost = channel === 'general' || isAdminOrService
  const counts = chatCounts

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
          const unread = active ? 0 : counts[t.id] || 0
          return (
            <button
              key={t.id}
              onClick={() => setChannel(t.id)}
              className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold ${
                active
                  ? 'bg-amber-500 text-white shadow'
                  : 'bg-white border border-stone-200 text-stone-600'
              }`}
            >
              <Icon size={16} />
              {t.label}
              {unread > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unread}
                </span>
              )}
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
        onRead={onRead}
      />
    </div>
  )
}
