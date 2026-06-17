import React, { useState } from 'react'
import {
  Search,
  Phone,
  MapPin,
  UserCheck,
  Briefcase,
  HandHeart,
  Star,
} from 'lucide-react'
import Card from '../shared/Card'
import LoadingScreen from '../shared/LoadingScreen'
import { useAuth } from '../../contexts/AuthContext'
import { useProfiles } from '../../hooks/useProfiles'

const GROUPS = [
  { role: 'service', label: 'בנות שירות', icon: UserCheck, cls: 'text-amber-600' },
  { role: 'instructor', label: 'מדריכים', icon: Briefcase, cls: 'text-sky-600' },
  { role: 'volunteer', label: 'מתנדבים', icon: HandHeart, cls: 'text-orange-600' },
]

export default function TeamPage() {
  const { profile } = useAuth()
  const profiles = useProfiles()
  const [q, setQ] = useState('')

  if (profiles.loading) return <LoadingScreen message="טוען צוות…" />

  const isAdmin = profile?.role === 'admin'
  const term = q.trim()
  const people = profiles.data.filter((p) =>
    [p.name, p.phone, p.branch?.name, p.skills]
      .filter(Boolean)
      .join(' ')
      .includes(term),
  )

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-stone-800">
          {isAdmin
            ? 'כל הצוות'
            : `צוות הסניף${profile?.branch?.name ? ' — ' + profile.branch.name : ''}`}
        </h2>
        <p className="text-sm text-stone-500">
          {isAdmin
            ? 'כל בנות השירות, המדריכים והמתנדבים במערכת.'
            : 'כל מי שמשויך לסניף שלך.'}
        </p>
      </div>

      <div className="relative">
        <Search
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="חיפוש לפי שם / טלפון / סניף / מיומנות…"
          className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-stone-200 bg-white outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
        />
      </div>

      {GROUPS.map(({ role, label, icon: Icon, cls }) => {
        const members = people.filter((p) => p.role === role)
        if (!members.length) return null
        return (
          <div key={role}>
            <div className="flex items-center gap-2 mb-2">
              <Icon size={16} className={cls} />
              <h3 className="font-bold text-stone-700 text-sm">{label}</h3>
              <span className="text-xs text-stone-400">({members.length})</span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {members.map((p) => (
                <Card key={p.id} className="p-3.5">
                  <div className="font-bold text-stone-800">{p.name}</div>
                  <div className="mt-2 space-y-1 text-sm text-stone-600">
                    <div className="flex items-center gap-1.5">
                      <Phone size={13} className="text-stone-400" />
                      {p.phone ? (
                        <a href={`tel:${p.phone}`} className="hover:underline">
                          {p.phone}
                        </a>
                      ) : (
                        '—'
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-stone-400">גיל:</span>
                      {p.age || '—'}
                    </div>
                    {role !== 'instructor' && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-stone-400" />
                        {p.branch?.name || '—'}
                      </div>
                    )}
                    {role === 'instructor' && p.skills && (
                      <div className="flex items-center gap-1.5 text-amber-600">
                        <Star size={13} />
                        {p.skills}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )
      })}

      {people.length === 0 && (
        <p className="text-stone-400 text-sm text-center py-8">
          לא נמצאו אנשים.
        </p>
      )}
    </div>
  )
}
