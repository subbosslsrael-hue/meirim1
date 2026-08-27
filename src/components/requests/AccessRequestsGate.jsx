import React, { useState } from 'react'
import { UserPlus, X } from 'lucide-react'
import RequestCard from './RequestCard'
import { pendingRequests } from '../../hooks/useAccessRequests'

// חלון שקופץ למנכ"ל בכניסה למערכת כשיש בקשות כניסה ממתינות.
// ניתן לאשר/לדחות ישירות מכאן, או לסגור ולטפל מאוחר יותר בטאב "בקשות כניסה".
export default function AccessRequestsGate({ requests }) {
  const [dismissed, setDismissed] = useState(false)

  const pending = pendingRequests(requests.data)
  if (dismissed || pending.length === 0) return null

  const approve = (id) => requests.update(id, { approved: true })
  const reject = (id) => requests.remove(id)

  return (
    <div className="fixed inset-0 z-[3000] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-amber-500" />
            <h2 className="font-black text-stone-800">
              בקשות כניסה חדשות ({pending.length})
            </h2>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-stone-400 hover:text-stone-700"
            title="סגור"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm text-stone-600 mb-3">
            הנרשמים הבאים ממתינים לאישורך כדי להיכנס למערכת:
          </p>
          <div className="space-y-3">
            {pending.map((p) => (
              <RequestCard
                key={p.id}
                person={p}
                onApprove={approve}
                onReject={reject}
              />
            ))}
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="w-full mt-4 text-sm text-stone-500 hover:text-stone-700"
          >
            אטפל בזה מאוחר יותר
          </button>
        </div>
      </div>
    </div>
  )
}
