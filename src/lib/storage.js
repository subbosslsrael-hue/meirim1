import { supabase } from './supabase'

const BUCKET = 'door-photos'
// תוקף הקישור החתום בשניות (שעה). מספיק לצפייה, פג מעצמו.
const SIGNED_TTL = 60 * 60

/**
 * מכווץ תמונה בצד הלקוח לפני העלאה: מקטין לרוחב/גובה מקסימלי ושומר כ-JPEG.
 * מחזיר Blob מכווץ, או את הקובץ המקורי אם הכיווץ נכשל / לא הקטין.
 */
async function compressImage(file, { maxDim = 1280, quality = 0.72 } = {}) {
  if (!file.type?.startsWith('image/')) return file

  let bitmap
  try {
    // imageOrientation מתקן סיבוב לפי EXIF (תמונות טלפון)
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    // הדפדפן לא יודע לפענח (למשל HEIC) — נעלה את המקור כמו שהוא
    return file
  }

  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality),
  )
  // אם משום מה הכיווץ לא הקטין — נשתמש במקור
  if (!blob || blob.size >= file.size) return file
  return blob
}

/**
 * מעלה קובץ ל-Storage תחת door-photos/{familyId}-{timestamp}.{ext}
 * (מכווץ אותו קודם). מחזיר את ה*נתיב* של הקובץ (לא URL). הבאקט פרטי —
 * צפייה נעשית דרך קישור חתום (getDoorPhotoUrl).
 */
export async function uploadDoorPhoto({ familyId, file }) {
  if (!file) throw new Error('לא נבחר קובץ')

  const upload = await compressImage(file)
  const isJpeg = upload.type === 'image/jpeg'
  const ext = isJpeg
    ? 'jpg'
    : (file.name?.split('.').pop() || 'jpg').toLowerCase()
  const path = `${familyId}-${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, upload, {
      cacheControl: '3600',
      upsert: false,
      contentType: upload.type || 'image/jpeg',
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
