// בדיקות חוזק סיסמה.
export const passwordChecks = (pw) => ({
  length: (pw || '').length >= 8,
  upper: /[A-Z]/.test(pw || ''),
  lower: /[a-z]/.test(pw || ''),
  number: /[0-9]/.test(pw || ''),
})

export const passwordScore = (pw) =>
  Object.values(passwordChecks(pw)).filter(Boolean).length // 0–4

export const passwordValid = (pw) => passwordScore(pw) === 4

export const PASSWORD_RULES = [
  { key: 'length', label: 'לפחות 8 תווים' },
  { key: 'upper', label: 'אות גדולה (A-Z)' },
  { key: 'lower', label: 'אות קטנה (a-z)' },
  { key: 'number', label: 'ספרה (0-9)' },
]
