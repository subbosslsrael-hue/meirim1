import { supabase } from './supabase'

const BUCKET = 'door-photos'

/**
 * מעלה קובץ ל-Storage תחת door-photos/{familyId}-{timestamp}.{ext}
 * מחזיר URL ציבורי. דורש שהבאקט יוגדר ציבורי או שיש לקוח עם הרשאות מתאימות.
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

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
