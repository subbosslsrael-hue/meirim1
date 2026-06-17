import { supabase } from './supabase'

const BUCKET = 'door-photos'
// תוקף הקישור החתום בשניות (שעה). מספיק לצפייה, פג מעצמו.
const SIGNED_TTL = 60 * 60

/**
 * מעלה קובץ ל-Storage תחת door-photos/{familyId}-{timestamp}.{ext}
 * מחזיר את ה*נתיב* של הקובץ (לא URL). הבאקט פרטי — צפייה נעשית
 * דרך קישור חתום (getDoorPhotoUrl).
 */
export async function uploadDoorPhoto({ familyId, file }) {
  if (!file) throw new Error('לא נבחר קובץ')
  const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase()
  const path = `${familyId}-${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/jpeg',
    })
  if (error) throw error

  return path
}

/**
 * מקבל נתיב קובץ (או, לתאימות לאחור, URL ציבורי ישן שנשמר בעבר)
 * ומחזיר קישור חתום זמני לצפייה. מחזיר null אם אין הרשאה/הקובץ חסר.
 */
export async function getDoorPhotoUrl(pathOrUrl) {
  if (!pathOrUrl) return null

  // תאימות לאחור: אם נשמר בעבר URL ציבורי מלא, נחלץ ממנו את הנתיב.
  let path = pathOrUrl
  const marker = `/${BUCKET}/`
  const idx = pathOrUrl.indexOf(marker)
  if (idx !== -1) {
    path = pathOrUrl.slice(idx + marker.length).split('?')[0]
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_TTL)
  if (error) {
    console.warn('לא ניתן לייצר קישור לתמונת דלת:', error.message)
    return null
  }
  return data.signedUrl
}
