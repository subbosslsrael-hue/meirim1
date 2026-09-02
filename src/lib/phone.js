// כלי טלפון ישראלי משותף: נרמול ובדיקת תקינות.

// מסיר רווחים/מקפים וממיר קידומת בינ"ל (+972 / 972) ל-0.
export const normalizePhone = (raw) => {
  let p = (raw || '').replace(/[\s\-()]/g, '')
  if (p.startsWith('+972')) p = '0' + p.slice(4)
  else if (p.startsWith('972')) p = '0' + p.slice(3)
  return p
}

// תקין: נייד (05X), VoIP (07X) או קווי (02/03/04/08/09).
export const isValidIsraeliPhone = (raw) =>
  /^0(5\d|7\d|[2-489])\d{7}$/.test(normalizePhone(raw))

// מסנן קלט של שדה טלפון תוך כדי הקלדה: משאיר ספרות בלבד (בלי אותיות/סימנים)
// ומגביל ל-10 ספרות (אורך טלפון ישראלי מקומי). לשימוש ב-onChange של שדות טלפון.
export const sanitizePhoneInput = (raw) => (raw || '').replace(/\D/g, '').slice(0, 10)
