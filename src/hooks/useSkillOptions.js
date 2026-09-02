import { useSupabaseTable } from './useSupabaseTable'

// רשימת המיומנויות הנדרשות — משותפת לכל המערכת, ניתנת לעריכה ע"י מנכ"ל בלבד
// (נאכף ב-RLS). קריאה פתוחה לכל המשתמשים כדי לאכלס את בורר המיומנויות.
export function useSkillOptions({ enabled = true } = {}) {
  return useSupabaseTable({
    table: 'skill_options',
    select: 'id, name',
    orderBy: { column: 'name', ascending: true },
    realtime: true,
    enabled,
  })
}
