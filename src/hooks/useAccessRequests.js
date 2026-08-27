import { useSupabaseTable } from './useSupabaseTable'

// טוען את כל הפרופילים (עבור מנכ"ל) כדי לזהות בקשות כניסה שממתינות לאישור.
// בקשה ממתינה = פרופיל שאינו מאושר (approved === false) ואינו מנכ"ל.
export function useAccessRequests({ enabled = true } = {}) {
  return useSupabaseTable({
    table: 'profiles',
    select:
      'id, name, role, phone, age, approved, created_at, branch_id, branch:branches(id, name, city)',
    orderBy: { column: 'created_at', ascending: false },
    realtime: true,
    enabled,
  })
}

// מסנן את רשימת הפרופילים לבקשות הממתינות בלבד.
// שים לב: === false בכוונה — אם העמודה approved עדיין לא קיימת ב-DB
// (undefined), לא נחשיב אף אחד כ"ממתין" וכך לא נועלים אף משתמש.
export function pendingRequests(profiles = []) {
  return profiles.filter((p) => p.approved === false && p.role !== 'admin')
}
