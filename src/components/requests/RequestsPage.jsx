import React from 'react'
import { UserPlus, CheckCircle2 } from 'lucide-react'
import Card from '../shared/Card'
import LoadingScreen from '../shared/LoadingScreen'
import RequestCard from './RequestCard'
import { pendingRequests } from '../../hooks/useAccessRequests'

// טאב "בקשות כניסה" למנכ"ל — רשימת הנרשמים הממתינים לאישור.
export default function RequestsPage({ requests }) {
  if (requests.loading) return <LoadingScreen message="טוען בקשות…" />

  const pending = pendingRequests(requests.data)
  const approve = (id) => requests.update(id, { approved: true })
  const reject = (id) => requests.remove(id)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-stone-800 flex items-center gap-2">
          <UserPlus size={20} className="text-amber-500" />
          בקשות כניסה
        </h2>
        <p className="text-sm text-stone-500">
          נרשמים חדשים שממתינים לאישורך כדי להיכנס למערכת.
        </p>
      </div>

      {pending.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 size={26} />
          </div>
          <p className="text-stone-500 text-sm">
            אין בקשות כניסה ממתינות — הכול מאושר ✔️
          </p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {pending.map((p) => (
            <RequestCard
              key={p.id}
              person={p}
              onApprove={approve}
              onReject={reject}
            />
          ))}
        </div>
      )}
    </div>
  )
}
