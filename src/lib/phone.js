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
