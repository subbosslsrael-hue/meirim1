import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LayoutDashboard, Users, CalendarHeart, Truck, ClipboardList,
  Plus, MapPin, Phone, CheckCircle2, Circle, Camera, Search,
  Clock, Package, HandHeart, X, ChevronLeft, Sun, TrendingUp,
  AlertTriangle, Building2, UserCheck, Activity,
  BookOpen, Database, Workflow, FileSpreadsheet, Download, Cpu, Star,
  Navigation, Image as ImageIcon, Route, LogOut, ShieldCheck, Briefcase,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";

/* ============================== נתוני בסיס (Seed) ============================== */
const PROJECTS = ["נקודת אור", "אור כוכבים", "יוצאות לאור", "אור השחר"];
const CATEGORIES = [
  "משפחה במצב סוציו-אקונומי נמוך",
  "קשיש/ה בודד/ה",
  "אישה נפגעת אלימות",
  "ילד/ה עם מוגבלות",
  "חולה סרטן ובני משפחה",
];

const SEED = {
  branches: [
    { id: "b1", name: "סניף שדרות", city: "שדרות" },
    { id: "b2", name: "סניף נתיבות", city: "נתיבות" },
    { id: "b3", name: "סניף אופקים", city: "אופקים" },
    { id: "b4", name: "סניף אשקלון", city: "אשקלון" },
  ],
  volunteers: [
    { id: "v1", name: "נועה לוי", branchId: "b1", phone: "052-1112233" },
    { id: "v2", name: "תהל כהן", branchId: "b2", phone: "053-2223344" },
    { id: "v3", name: "שירה ביטון", branchId: "b3", phone: "054-3334455" },
    { id: "v4", name: "אדל פרץ", branchId: "b4", phone: "058-4445566" },
  ],
  instructors: [
    { id: "i1", name: "יוסי דהן", skills: "עבודה עם ילדים, מוגבלויות" },
    { id: "i2", name: "מירב אזולאי", skills: "ליווי רגשי, נשים" },
    { id: "i3", name: "אבי מזרחי", skills: "לוגיסטיקה, נהיגה" },
    { id: "i4", name: "רותם שלום", skills: "אונקולוגיה, ליווי" },
  ],
  fieldVolunteers: [
    { id: "fv1", name: "דניאל כהן", phone: "050-1010101" },
    { id: "fv2", name: "רחל אברהם", phone: "052-2020202" },
    { id: "fv3", name: "יוסף מלכה", phone: "054-3030303" },
    { id: "fv4", name: "תמר בן שושן", phone: "058-4040404" },
  ],
  families: [
    { id: "f1", name: "משפחת אוחיון", branchId: "b1", city: "שדרות", address: "הרצל 14", phone: "050-1234567", category: CATEGORIES[0], volunteerId: "v1", x: 22, y: 30, doorPhoto: true },
    { id: "f2", name: "משפחת בן דוד", branchId: "b1", city: "שדרות", address: "ויצמן 8", phone: "050-7654321", category: CATEGORIES[1], volunteerId: "v1", x: 38, y: 55, doorPhoto: true },
    { id: "f3", name: "משפחת גבאי", branchId: "b2", city: "נתיבות", address: "ירושלים 22", phone: "052-9876543", category: CATEGORIES[3], volunteerId: "v2", x: 60, y: 28 },
    { id: "f4", name: "משפחת דיין", branchId: "b3", city: "אופקים", address: "הנשיא 5", phone: "053-1472583", category: CATEGORIES[4], volunteerId: "v3", x: 75, y: 62 },
    { id: "f5", name: "משפחת הרוש", branchId: "b4", city: "אשקלון", address: "בן גוריון 31", phone: "058-3692581", category: CATEGORIES[2], volunteerId: "v4", x: 48, y: 78 },
    { id: "f6", name: "משפחת ועקנין", branchId: "b2", city: "נתיבות", address: "השלום 12", phone: "054-7418529", category: CATEGORIES[0], volunteerId: "v2", x: 30, y: 70 },
  ],
  activities: [
    { id: "a1", name: "חלוקת סלי מזון שבועית", project: "נקודת אור", date: "2026-06-04", branchId: "b1", status: "active", instructorIds: ["i3"], participantIds: ["fv1"], participants: 40, cost: 3200, requiredSkills: "לוגיסטיקה, נהיגה" },
    { id: "a2", name: "מועדונית לילדים עם מוגבלות", project: "אור כוכבים", date: "2026-06-10", branchId: "b3", status: "planning", instructorIds: ["i1"], participantIds: [], participants: 18, cost: 1500, requiredSkills: "ילדים, מוגבלויות" },
    { id: "a3", name: "ליווי יציאה ממקלט", project: "יוצאות לאור", date: "2026-05-20", branchId: "b4", status: "done", instructorIds: ["i2"], participantIds: ["fv2"], participants: 5, cost: 900, requiredSkills: "נשים, ליווי רגשי", rating: 4, debriefNote: "הליווי עבר בהצלחה. לשפר: תיאום מוקדם מול לשכת הרווחה והסדרת הסעות לפעם הבאה." },
    { id: "a4", name: "ביקור במחלקה אונקולוגית סורוקה", project: "אור השחר", date: "2026-06-15", branchId: "b2", status: "planning", instructorIds: ["i4"], participantIds: [], participants: 12, cost: 600, requiredSkills: "אונקולוגיה, ליווי" },
  ],
  distributions: [
    {
      id: "d1", name: "חלוקת סלי מזון – פסח", date: "2026-03-29", items: "סל מזון לפסח + קמחא דפסחא",
      stops: [
        { familyId: "f1", delivered: true, photo: true },
        { familyId: "f2", delivered: true, photo: true },
        { familyId: "f3", delivered: false, photo: false },
        { familyId: "f4", delivered: false, photo: false },
        { familyId: "f5", delivered: false, photo: false },
        { familyId: "f6", delivered: false, photo: false },
      ],
    },
    {
      id: "d2", name: "חלוקת סלי מזון – ראש השנה", date: "2026-09-09", items: "סל מזון לראש השנה",
      stops: [
        { familyId: "f1", delivered: false, photo: false },
        { familyId: "f3", delivered: false, photo: false },
        { familyId: "f4", delivered: false, photo: false },
      ],
    },
    {
      id: "d3", name: "חלוקת סלי מזון – סוכות", date: "2026-09-23", items: "סל מזון לסוכות",
      stops: [
        { familyId: "f2", delivered: false, photo: false },
        { familyId: "f5", delivered: false, photo: false },
        { familyId: "f6", delivered: false, photo: false },
      ],
    },
  ],
  reports: [
    { id: "r1", volunteerId: "v1", week: "2026-W21", project: "נקודת אור", hours: 14, note: "חלוקה ומיון סלי מזון" },
    { id: "r2", volunteerId: "v2", week: "2026-W21", project: "אור כוכבים", hours: 9, note: "הפעלת מועדונית" },
    { id: "r3", volunteerId: "v3", week: "2026-W21", project: "אור השחר", hours: 6, note: "ליווי משפחה לבי״ח" },
    { id: "r4", volunteerId: "v4", week: "2026-W21", project: "יוצאות לאור", hours: 11, note: "ליווי ושיחות תמיכה" },
    { id: "r5", volunteerId: "v1", week: "2026-W20", project: "נקודת אור", hours: 12, note: "" },
    { id: "r6", volunteerId: "v2", week: "2026-W20", project: "נקודת אור", hours: 8, note: "" },
  ],
};

const STORAGE_KEY = "meirim:data:v1";
const USER_KEY = "meirim:user:v1";
const uid = () => Math.random().toString(36).slice(2, 9);

/* ============================== עזרי עיצוב ============================== */
const STATUS = {
  planning: { label: "בתכנון", cls: "bg-amber-100 text-amber-800 border-amber-200" },
  active: { label: "פעילה", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  done: { label: "הסתיימה", cls: "bg-stone-100 text-stone-600 border-stone-200" },
};
const PIE_COLORS = ["#E8920C", "#2E8B6F", "#D9651A", "#5BA888", "#B45309"];

function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl border border-stone-200/80 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone = "amber" }) {
  const tones = {
    amber: "from-amber-400 to-orange-500",
    green: "from-emerald-400 to-teal-600",
    blue: "from-sky-400 to-indigo-500",
    rose: "from-rose-400 to-pink-500",
  };
  return (
    <Card className="p-4 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tones[tone]} flex items-center justify-center text-white shadow`}>
        <Icon size={22} />
      </div>
      <div>
        <div className="text-2xl font-extrabold text-stone-800 leading-none">{value}</div>
        <div className="text-sm text-stone-500 mt-1">{label}</div>
      </div>
    </Card>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-bold text-stone-800">{title}</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700"><X size={20} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="text-sm font-medium text-stone-600 mb-1 block">{label}</span>
      {children}
    </label>
  );
}
const inputCls = "w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-stone-800";

/* ============================== מסך כניסה / בחירת תפקיד ============================== */
function RolePicker({ data, setData, onComplete }) {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState(null);
  const [pickedId, setPickedId] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", branchId: data.branches[0]?.id || "" });

  const chooseRole = (r) => {
    setRole(r);
    if (r === "admin") onComplete({ role: "admin", name: "יזהר נבון" });
    else setStep(2);
  };

  const finishService = () => {
    if (isNew) {
      if (!form.name.trim()) return;
      const id = uid();
      setData((d) => ({ ...d, volunteers: [...d.volunteers, { id, name: form.name.trim(), phone: form.phone.trim(), branchId: form.branchId }] }));
      onComplete({ role: "service", volunteerId: id, branchId: form.branchId });
    } else {
      const v = data.volunteers.find((x) => x.id === pickedId);
      if (!v) return;
      onComplete({ role: "service", volunteerId: v.id, branchId: v.branchId });
    }
  };

  const finishVolunteer = () => {
    if (isNew) {
      if (!form.name.trim()) return;
      const id = uid();
      setData((d) => ({ ...d, fieldVolunteers: [...(d.fieldVolunteers || []), { id, name: form.name.trim(), phone: form.phone.trim() }] }));
      onComplete({ role: "volunteer", fvId: id });
    } else {
      if (!pickedId) return;
      onComplete({ role: "volunteer", fvId: pickedId });
    }
  };

  return (
    <div dir="rtl" style={{ fontFamily: "'Assistant', sans-serif" }} className="min-h-screen flex items-center justify-center p-5 bg-gradient-to-br from-amber-50 via-orange-50 to-emerald-50">
      <Card className="w-full max-w-md p-7">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-emerald-500 flex items-center justify-center text-white shadow-lg mb-3">
            <Sun size={32} />
          </div>
          <h1 style={{ fontFamily: "'Frank Ruhl Libre', serif" }} className="text-2xl font-black text-emerald-800">ברוכים הבאים למאירים</h1>
          <p className="text-sm text-stone-500 mt-1">{step === 1 ? "בחר/י את תפקידך במערכת" : role === "service" ? "בת שירות — שיוך ראשוני לסניף" : "מתנדב/ת — פרטים אישיים"}</p>
        </div>

        {step === 1 && (
          <div className="space-y-2.5">
            <button onClick={() => chooseRole("admin")} className="w-full p-4 rounded-2xl bg-white border-2 border-stone-200 hover:border-emerald-400 hover:bg-emerald-50/40 text-right transition flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center"><ShieldCheck size={22} /></div>
              <div className="flex-1">
                <div className="font-bold text-stone-800">מנכ"ל / הנהלה</div>
                <div className="text-xs text-stone-500">גישה מלאה לכל הנתונים והדוחות</div>
              </div>
            </button>
            <button onClick={() => chooseRole("service")} className="w-full p-4 rounded-2xl bg-white border-2 border-stone-200 hover:border-amber-400 hover:bg-amber-50/40 text-right transition flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center"><UserCheck size={22} /></div>
              <div className="flex-1">
                <div className="font-bold text-stone-800">בת שירות לאומי</div>
                <div className="text-xs text-stone-500">ניהול הסניף, המשפחות והפעילויות</div>
              </div>
            </button>
            <button onClick={() => chooseRole("volunteer")} className="w-full p-4 rounded-2xl bg-white border-2 border-stone-200 hover:border-orange-400 hover:bg-orange-50/40 text-right transition flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center"><HandHeart size={22} /></div>
              <div className="flex-1">
                <div className="font-bold text-stone-800">מתנדב/ת בשטח</div>
                <div className="text-xs text-stone-500">הירשם לפעילויות ולחלוקות סלי מזון</div>
              </div>
            </button>
          </div>
        )}

        {step === 2 && role === "service" && (
          <div>
            <div className="flex gap-2 mb-3">
              <button onClick={() => setIsNew(false)} className={`flex-1 py-2 rounded-xl text-sm font-semibold border ${!isNew ? "bg-emerald-600 text-white border-emerald-600" : "bg-stone-50 text-stone-600 border-stone-200"}`}>בת שירות קיימת</button>
              <button onClick={() => setIsNew(true)} className={`flex-1 py-2 rounded-xl text-sm font-semibold border ${isNew ? "bg-emerald-600 text-white border-emerald-600" : "bg-stone-50 text-stone-600 border-stone-200"}`}>הצטרפות חדשה</button>
            </div>
            {!isNew ? (
              <Field label="בחרי את שמך">
                <select className={inputCls} value={pickedId} onChange={(e) => setPickedId(e.target.value)}>
                  <option value="">— בחרי —</option>
                  {data.volunteers.map((v) => <option key={v.id} value={v.id}>{v.name} · {(data.branches.find((b) => b.id === v.branchId) || {}).name}</option>)}
                </select>
              </Field>
            ) : (
              <>
                <Field label="שם מלא"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                <Field label="טלפון"><input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
                <Field label="שיוך לסניף (לא ניתן לשינוי לאחר ההצטרפות)">
                  <select className={inputCls} value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
                    {data.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </Field>
              </>
            )}
            <div className="flex gap-2 mt-3">
              <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-semibold">חזרה</button>
              <button onClick={finishService} className="flex-[2] py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold">כניסה למערכת</button>
            </div>
          </div>
        )}

        {step === 2 && role === "volunteer" && (
          <div>
            <div className="flex gap-2 mb-3">
              <button onClick={() => setIsNew(false)} className={`flex-1 py-2 rounded-xl text-sm font-semibold border ${!isNew ? "bg-orange-500 text-white border-orange-500" : "bg-stone-50 text-stone-600 border-stone-200"}`}>מתנדב/ת קיים</button>
              <button onClick={() => setIsNew(true)} className={`flex-1 py-2 rounded-xl text-sm font-semibold border ${isNew ? "bg-orange-500 text-white border-orange-500" : "bg-stone-50 text-stone-600 border-stone-200"}`}>הצטרפות חדשה</button>
            </div>
            {!isNew ? (
              <Field label="בחר/י את שמך">
                <select className={inputCls} value={pickedId} onChange={(e) => setPickedId(e.target.value)}>
                  <option value="">— בחר/י —</option>
                  {(data.fieldVolunteers || []).map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </Field>
            ) : (
              <>
                <Field label="שם מלא"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                <Field label="טלפון"><input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
              </>
            )}
            <div className="flex gap-2 mt-3">
              <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-semibold">חזרה</button>
              <button onClick={finishVolunteer} className="flex-[2] py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold">כניסה למערכת</button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ============================== האפליקציה ============================== */
export default function MeirimSystem() {
  const [data, setData] = useState(SEED);
  const [tab, setTab] = useState("dashboard");
  const [loaded, setLoaded] = useState(false);
  const [user, setUser] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);

  // טעינה משמירה מתמשכת — נתונים
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        if (live && res && res.value) setData(JSON.parse(res.value));
      } catch (e) { /* אין נתונים שמורים – משתמשים בדמו */ }
      finally { if (live) setLoaded(true); }
    })();
    return () => { live = false; };
  }, []);

  // טעינה משמירה מתמשכת — משתמש
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await window.storage.get(USER_KEY);
        if (live && res && res.value) setUser(JSON.parse(res.value));
      } catch (e) {}
      finally { if (live) setUserLoaded(true); }
    })();
    return () => { live = false; };
  }, []);

  // שמירה בכל שינוי משתמש
  useEffect(() => {
    if (!userLoaded) return;
    (async () => {
      try {
        if (user) await window.storage.set(USER_KEY, JSON.stringify(user));
        else await window.storage.delete(USER_KEY);
      } catch (e) {}
    })();
  }, [user, userLoaded]);

  // שמירה בכל שינוי
  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try { await window.storage.set(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
    })();
  }, [data, loaded]);

  // הזרקת פונט עברי
  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Assistant:wght@400;500;600;700;800&family=Frank+Ruhl+Libre:wght@700;900&display=swap";
    document.head.appendChild(l);
    return () => { try { document.head.removeChild(l); } catch (e) {} };
  }, []);

  const TABS = [
    { id: "dashboard", label: "לוח בקרה", icon: LayoutDashboard },
    { id: "families", label: "ניהול משפחות", icon: Users },
    { id: "activities", label: "פעילויות ומדריכים", icon: CalendarHeart },
    { id: "distribution", label: "חלוקת מוצרים", icon: Truck },
    { id: "reports", label: "דיווחים ומעקב", icon: ClipboardList },
    { id: "docs", label: "אפיון ותיעוד", icon: BookOpen },
  ];

  // תפריטים מותרים לפי תפקיד
  const visibleTabs = useMemo(() => {
    if (!user) return TABS;
    if (user.role === "volunteer") return TABS.filter((t) => ["dashboard", "activities", "distribution"].includes(t.id));
    return TABS;
  }, [user]);

  // החלפת טאב אם הנוכחי לא מותר לתפקיד
  useEffect(() => {
    if (user && !visibleTabs.find((t) => t.id === tab)) setTab(visibleTabs[0].id);
  }, [user, visibleTabs, tab]);

  const nameById = (arr, id, key = "name") => (arr.find((x) => x.id === id) || {})[key] || "—";

  // תווית משתמש להצגה בכותרת
  const userLabel = !user ? ""
    : user.role === "admin" ? `${user.name} · מנכ״ל`
    : user.role === "service" ? `${nameById(data.volunteers, user.volunteerId)} · בת שירות · ${nameById(data.branches, user.branchId)}`
    : `${nameById(data.fieldVolunteers || [], user.fvId)} · מתנדב/ת`;

  const roleColor = !user ? "stone"
    : user.role === "admin" ? "emerald"
    : user.role === "service" ? "amber"
    : "orange";

  if (!userLoaded) {
    return <div dir="rtl" className="min-h-screen flex items-center justify-center bg-amber-50/40 text-stone-400">טוען…</div>;
  }
  if (!user) {
    return <RolePicker data={data} setData={setData} onComplete={setUser} />;
  }

  return (
    <div dir="rtl" style={{ fontFamily: "'Assistant', sans-serif" }} className="min-h-screen flex" >
      <style>{`body{margin:0}`}</style>
      <div className="flex w-full min-h-screen bg-amber-50/40 text-right">
        {/* סרגל צד */}
        <aside className="w-60 shrink-0 bg-white border-l border-stone-200 hidden md:flex flex-col">
          <div className="px-5 py-5 border-b border-stone-100 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-emerald-500 flex items-center justify-center text-white shadow">
              <Sun size={24} />
            </div>
            <div>
              <div style={{ fontFamily: "'Frank Ruhl Libre', serif" }} className="text-xl font-black text-emerald-700 leading-none">מאירים</div>
              <div className="text-[11px] text-amber-600 font-semibold">מערכת ניהול פעילות</div>
            </div>
          </div>
          <nav className="p-3 flex-1">
            {visibleTabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-semibold transition ${
                  tab === t.id ? "bg-amber-500 text-white shadow" : "text-stone-600 hover:bg-amber-50"
                }`}>
                <t.icon size={18} />{t.label}
              </button>
            ))}
          </nav>
          <div className="p-4 text-[11px] text-stone-400 border-t border-stone-100">
            עמותת מאירים · ע״ר 580644342<br />אב-טיפוס פרויקט גמר · גרסה 7
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          {/* כותרת עליונה */}
          <header className="bg-white border-b border-stone-200 px-5 py-3 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-2 md:hidden">
              <Sun size={20} className="text-amber-500" />
              <span style={{ fontFamily: "'Frank Ruhl Libre', serif" }} className="font-black text-emerald-700">מאירים</span>
            </div>
            <h1 className="font-bold text-stone-800 hidden md:block">
              {visibleTabs.find((t) => t.id === tab)?.label}
            </h1>
            <div className="flex items-center gap-3 text-sm">
              <span className={`flex items-center gap-1.5 text-${roleColor}-700 font-semibold`}>
                {user.role === "admin" ? <ShieldCheck size={16} /> : user.role === "service" ? <UserCheck size={16} /> : <HandHeart size={16} />}
                <span className="hidden sm:inline">{userLabel}</span>
                <span className="sm:hidden">{user.role === "admin" ? "מנכ״ל" : user.role === "service" ? "בת שירות" : "מתנדב/ת"}</span>
              </span>
              <button onClick={() => setUser(null)} title="החלף משתמש" className="text-stone-400 hover:text-rose-500"><LogOut size={16} /></button>
            </div>
          </header>

          {/* ניווט מובייל */}
          <nav className="md:hidden flex overflow-x-auto gap-1 px-3 py-2 bg-white border-b border-stone-100">
            {visibleTabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                  tab === t.id ? "bg-amber-500 text-white" : "bg-stone-100 text-stone-600"
                }`}>
                <t.icon size={14} />{t.label}
              </button>
            ))}
          </nav>

          <div className="p-4 md:p-6 max-w-6xl mx-auto">
            {tab === "dashboard" && <Dashboard data={data} nameById={nameById} user={user} />}
            {tab === "families" && <Families data={data} setData={setData} nameById={nameById} user={user} />}
            {tab === "activities" && <Activities data={data} setData={setData} nameById={nameById} user={user} />}
            {tab === "distribution" && <Distribution data={data} setData={setData} nameById={nameById} user={user} />}
            {tab === "reports" && <Reports data={data} setData={setData} nameById={nameById} user={user} />}
            {tab === "docs" && <Docs data={data} />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ============================== לוח בקרה ============================== */
function Dashboard({ data, nameById, user }) {
  const hoursByProject = useMemo(() => {
    const m = {};
    PROJECTS.forEach((p) => (m[p] = 0));
    data.reports.forEach((r) => (m[r.project] = (m[r.project] || 0) + r.hours));
    return PROJECTS.map((p) => ({ name: p, שעות: m[p] }));
  }, [data.reports]);

  const familiesByCat = useMemo(() => {
    const m = {};
    data.families.forEach((f) => (m[f.category] = (m[f.category] || 0) + 1));
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [data.families]);

  const totalHours = data.reports.reduce((s, r) => s + r.hours, 0);
  const dist = data.distributions[0];
  const delivered = dist ? dist.stops.filter((s) => s.delivered).length : 0;
  const totalStops = dist ? dist.stops.length : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={Users} label="משפחות נתמכות" value={data.families.length} tone="amber" />
        <Stat icon={Activity} label="פעילויות במערכת" value={data.activities.length} tone="green" />
        <Stat icon={HandHeart} label="בנות שירות" value={data.volunteers.length} tone="rose" />
        <Stat icon={Clock} label="סה״כ שעות מדווחות" value={totalHours} tone="blue" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-amber-500" />
            <h3 className="font-bold text-stone-800">שעות פעילות לפי פרויקט</h3>
          </div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hoursByProject} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ece4" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#78716c" }} />
                <YAxis tick={{ fontSize: 11, fill: "#78716c" }} />
                <Tooltip />
                <Bar dataKey="שעות" radius={[6, 6, 0, 0]} fill="#E8920C" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-emerald-600" />
            <h3 className="font-bold text-stone-800">פילוח משפחות לפי סוג צורך</h3>
          </div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={familiesByCat} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => e.value}>
                  {familiesByCat.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {familiesByCat.map((c, i) => (
              <span key={i} className="text-[11px] text-stone-500 flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />{c.name}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Truck size={18} className="text-orange-500" />
          <h3 className="font-bold text-stone-800">התקדמות חלוקה פעילה {dist ? `· ${dist.name}` : ""}</h3>
        </div>
        {dist ? (
          <>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 rounded-full bg-stone-100 overflow-hidden">
                <div className="h-full bg-gradient-to-l from-emerald-400 to-emerald-600 rounded-full transition-all"
                  style={{ width: `${totalStops ? (delivered / totalStops) * 100 : 0}%` }} />
              </div>
              <span className="text-sm font-bold text-stone-700">{delivered}/{totalStops} נמסרו</span>
            </div>
            <p className="text-xs text-stone-400 mt-2">עברו ל"חלוקת מוצרים" לתצוגת מפה וסימון מסירות.</p>
          </>
        ) : <p className="text-sm text-stone-400">אין חלוקה פעילה.</p>}
      </Card>
    </div>
  );
}

/* ============================== ניהול משפחות ============================== */
function Families({ data, setData, nameById, user }) {
  const myBranch = user && user.role === "service" ? user.branchId : "b1";
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", branchId: myBranch, city: "", address: "", phone: "", category: CATEGORIES[0], volunteerId: user && user.role === "service" ? user.volunteerId : "v1" });
  const [imp, setImp] = useState(null);
  const fileRef = useRef(null);
  const [swapOpen, setSwapOpen] = useState(false);
  const [swap, setSwap] = useState({ fromId: "", mode: "existing", toId: "", newName: "", newPhone: "" });

  // סינון לפי תפקיד: בת שירות רואה רק את משפחות הסניף שלה
  const visible = user && user.role === "service"
    ? data.families.filter((f) => f.branchId === user.branchId)
    : data.families;
  const filtered = visible.filter((f) =>
    [f.name, f.city, f.address, f.category].join(" ").includes(q));

  const assignToMe = (familyId) => setData((d) => ({
    ...d, families: d.families.map((f) => f.id === familyId ? { ...f, volunteerId: user.volunteerId } : f),
  }));

  // מציאת ערך בעמודה לפי מילות מפתח בכותרת (ייבוא גמיש מאקסל של הרשות)
  const pickCol = (row, keys) => {
    for (const k of Object.keys(row)) {
      const kk = String(k).replace(/\s/g, "");
      if (keys.some((key) => kk.includes(key))) return row[k];
    }
    return "";
  };

  const importExcel = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
      const newFams = rows.map((r) => {
        const name = String(pickCol(r, ["שםמשפחה", "משפחה", "שם"])).trim();
        const city = String(pickCol(r, ["עיר", "ישוב", "יישוב"])).trim();
        const address = String(pickCol(r, ["כתובת", "רחוב"])).trim();
        const phone = String(pickCol(r, ["טלפון", "נייד", "פלאפון"])).trim();
        const cat = String(pickCol(r, ["צורך", "קטגוריה", "סוג"])).trim();
        // שיוך אוטומטי: סניף לפי עיר, ובת שירות אחראית לפי הסניף
        const branch = data.branches.find((b) => city && (b.city.includes(city) || city.includes(b.city))) || data.branches[0];
        const vol = data.volunteers.find((v) => v.branchId === branch.id) || data.volunteers[0];
        return {
          id: uid(),
          name: name || "ללא שם",
          branchId: branch.id,
          city: city || branch.city,
          address, phone,
          category: CATEGORIES.find((c) => cat && c.includes(cat)) || cat || CATEGORIES[0],
          volunteerId: vol.id,
          x: 20 + Math.random() * 60, y: 20 + Math.random() * 60,
        };
      }).filter((f) => f.name);
      setData((d) => ({ ...d, families: [...d.families, ...newFams] }));
      setImp({ count: newFams.length });
    } catch (err) {
      setImp({ error: true });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const add = () => {
    if (!form.name.trim()) return;
    const branch = data.branches.find((b) => b.id === form.branchId);
    setData((d) => ({ ...d, families: [...d.families, { ...form, id: uid(), city: form.city || branch?.city || "", x: 20 + Math.random() * 60, y: 20 + Math.random() * 60 }] }));
    setForm({ name: "", branchId: "b1", city: "", address: "", phone: "", category: CATEGORIES[0], volunteerId: "v1" });
    setOpen(false);
  };

  // חילוף בת שירות — תיקוף אוטומטי של הגורם האחראי לכל המשפחות
  const famCount = (vid) => data.families.filter((f) => f.volunteerId === vid).length;
  const doSwap = () => {
    if (!swap.fromId) return;
    const fromVol = data.volunteers.find((v) => v.id === swap.fromId);
    const moved = famCount(swap.fromId);
    const toName = swap.mode === "new" ? swap.newName.trim() : (data.volunteers.find((v) => v.id === swap.toId) || {}).name;
    if (swap.mode === "new" ? !swap.newName.trim() : !swap.toId) return;
    setData((d) => {
      let volunteers = d.volunteers;
      let toId = swap.toId;
      if (swap.mode === "new") {
        toId = uid();
        volunteers = [...d.volunteers, { id: toId, name: swap.newName.trim(), phone: swap.newPhone.trim(), branchId: fromVol && fromVol.branchId }];
      }
      const families = d.families.map((f) => f.volunteerId === swap.fromId ? { ...f, volunteerId: toId } : f);
      return { ...d, volunteers, families };
    });
    setImp({ swap: true, count: moved, fromName: fromVol && fromVol.name, toName });
    setSwap({ fromId: "", mode: "existing", toId: "", newName: "", newPhone: "" });
    setSwapOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="חיפוש משפחה / עיר / סוג צורך…"
            className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-stone-200 bg-white outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
        </div>
        <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-semibold shadow">
          <Plus size={18} /> משפחה
        </button>
        <button onClick={() => fileRef.current && fileRef.current.click()} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow">
          <FileSpreadsheet size={18} /> ייבוא מ-Excel
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={importExcel} style={{ display: "none" }} />
        {user && user.role === "admin" && (
          <button onClick={() => setSwapOpen(true)} className="flex items-center gap-1.5 bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 px-4 py-2.5 rounded-xl font-semibold shadow-sm">
            <UserCheck size={18} /> חילוף אחראית
          </button>
        )}
      </div>

      {imp && (
        <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium ${imp.error ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
          <span className="flex items-center gap-2">
            {imp.error
              ? <><AlertTriangle size={16} /> הייבוא נכשל — ודא שזהו קובץ Excel תקין עם שורת כותרות.</>
              : imp.swap
                ? <><UserCheck size={16} /> בוצע חילוף: {imp.count} משפחות הועברו מ{imp.fromName || "—"} ל{imp.toName} ועודכנו אוטומטית.</>
                : <><CheckCircle2 size={16} /> יובאו {imp.count} משפחות ושויכו אוטומטית לסניף ולבת שירות אחראית.</>}
          </span>
          <button onClick={() => setImp(null)} className="opacity-60 hover:opacity-100"><X size={16} /></button>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((f) => (
          <Card key={f.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-bold text-stone-800">{f.name}</div>
                <div className="text-xs text-emerald-700 font-semibold mt-0.5">{nameById(data.branches, f.branchId)}</div>
              </div>
              <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-1 rounded-lg leading-tight max-w-[120px] text-center">{f.category}</span>
            </div>
            <div className="mt-3 space-y-1.5 text-sm text-stone-600">
              <div className="flex items-center gap-1.5"><MapPin size={14} className="text-stone-400" />{f.city}, {f.address}</div>
              <div className="flex items-center gap-1.5"><Phone size={14} className="text-stone-400" />{f.phone || "—"}</div>
              <div className="flex items-center gap-1.5"><UserCheck size={14} className="text-stone-400" />אחראית: {nameById(data.volunteers, f.volunteerId)}</div>
            </div>
            {user && user.role === "service" && f.volunteerId !== user.volunteerId && (
              <button onClick={() => assignToMe(f.id)} className="mt-3 w-full text-xs font-semibold py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100">
                + השתבצי אליי כאחראית
              </button>
            )}
            {user && user.role === "service" && f.volunteerId === user.volunteerId && (
              <div className="mt-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg py-1.5 text-center font-semibold">משפחה באחריותך</div>
            )}
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-stone-400 text-sm col-span-full text-center py-8">לא נמצאו משפחות.</p>}
      </div>

      {open && (
        <Modal title="הוספת משפחה נתמכת" onClose={() => setOpen(false)}>
          <Field label="שם המשפחה"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="סניף">
              <select className={inputCls} value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
                {data.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
            <Field label="עיר"><input className={inputCls} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="ברירת מחדל לפי הסניף" /></Field>
          </div>
          <Field label="כתובת"><input className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
          <Field label="טלפון"><input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="סוג הצורך">
            <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="בת שירות אחראית">
            <select className={inputCls} value={form.volunteerId} onChange={(e) => setForm({ ...form, volunteerId: e.target.value })}>
              {data.volunteers.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </Field>
          <button onClick={add} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-semibold mt-2">שמירה</button>
        </Modal>
      )}

      {swapOpen && (
        <Modal title="חילוף בת שירות אחראית" onClose={() => setSwapOpen(false)}>
          <p className="text-xs text-stone-500 mb-3">בסיום תקופת השירות, בחר/י את האחראית היוצאת ואת מי שתיכנס במקומה. כל המשפחות המשויכות יעודכנו אוטומטית.</p>
          <Field label="בת שירות יוצאת">
            <select className={inputCls} value={swap.fromId} onChange={(e) => setSwap({ ...swap, fromId: e.target.value })}>
              <option value="">— בחר/י —</option>
              {data.volunteers.map((v) => <option key={v.id} value={v.id}>{v.name} · {nameById(data.branches, v.branchId)} ({famCount(v.id)} משפחות)</option>)}
            </select>
          </Field>

          <div className="flex gap-2 mb-3">
            <button onClick={() => setSwap({ ...swap, mode: "existing" })} className={`flex-1 py-2 rounded-xl text-sm font-semibold border ${swap.mode === "existing" ? "bg-emerald-600 text-white border-emerald-600" : "bg-stone-50 text-stone-600 border-stone-200"}`}>אחראית קיימת</button>
            <button onClick={() => setSwap({ ...swap, mode: "new" })} className={`flex-1 py-2 rounded-xl text-sm font-semibold border ${swap.mode === "new" ? "bg-emerald-600 text-white border-emerald-600" : "bg-stone-50 text-stone-600 border-stone-200"}`}>אחראית חדשה</button>
          </div>

          {swap.mode === "existing" ? (
            <Field label="בת שירות נכנסת">
              <select className={inputCls} value={swap.toId} onChange={(e) => setSwap({ ...swap, toId: e.target.value })}>
                <option value="">— בחר/י —</option>
                {data.volunteers.filter((v) => v.id !== swap.fromId).map((v) => <option key={v.id} value={v.id}>{v.name} · {nameById(data.branches, v.branchId)}</option>)}
              </select>
            </Field>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Field label="שם האחראית החדשה"><input className={inputCls} value={swap.newName} onChange={(e) => setSwap({ ...swap, newName: e.target.value })} /></Field>
              <Field label="טלפון"><input className={inputCls} value={swap.newPhone} onChange={(e) => setSwap({ ...swap, newPhone: e.target.value })} /></Field>
            </div>
          )}

          {swap.fromId && (
            <div className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-3 flex items-center gap-2">
              <AlertTriangle size={15} /> {famCount(swap.fromId)} משפחות ישויכו מחדש אוטומטית.
            </div>
          )}
          <button onClick={doSwap} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-semibold">ביצוע חילוף ותיקוף</button>
        </Modal>
      )}
    </div>
  );
}

/* ============================== פעילויות ומדריכים ============================== */
const skillTokens = (s) => String(s || "").split(/[,\u060C]/).map((t) => t.trim()).filter(Boolean);
const matchScore = (instr, required) => {
  const req = skillTokens(required);
  if (!req.length) return 0;
  const inst = skillTokens(instr.skills);
  return req.filter((r) => inst.some((x) => x.includes(r) || r.includes(x))).length;
};
function Stars({ value = 0 }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={13} className={n <= value ? "text-amber-400 fill-amber-400" : "text-stone-300"} />
      ))}
    </span>
  );
}

function Activities({ data, setData, nameById, user }) {
  const myBranch = user && user.role === "service" ? user.branchId : "b1";
  const blank = { name: "", project: PROJECTS[0], date: "", branchId: myBranch, status: "planning", instructorIds: [], participants: 0, cost: 0, requiredSkills: "" };
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("הכל");
  const [q, setQ] = useState("");
  const [form, setForm] = useState(blank);
  const [debriefId, setDebriefId] = useState(null);
  const [dform, setDform] = useState({ rating: 0, note: "" });

  // סינון לפי תפקיד: בת שירות רואה רק פעילויות בסניף שלה
  const visible = user && user.role === "service"
    ? data.activities.filter((a) => a.branchId === user.branchId)
    : data.activities;
  const list = visible.filter((a) =>
    (filter === "הכל" || a.project === filter) &&
    [a.name, a.project, a.requiredSkills, a.debriefNote].join(" ").includes(q));

  // הרשמת מתנדב לפעילות
  const toggleSignup = (activityId) => setData((d) => ({
    ...d, activities: d.activities.map((a) => {
      if (a.id !== activityId) return a;
      const ids = a.participantIds || [];
      const on = ids.includes(user.fvId);
      return { ...a, participantIds: on ? ids.filter((x) => x !== user.fvId) : [...ids, user.fvId] };
    }),
  }));

  const add = () => {
    if (!form.name.trim()) return;
    setData((d) => ({ ...d, activities: [...d.activities, { ...form, id: uid(), participants: +form.participants, cost: +form.cost }] }));
    setForm(blank);
    setOpen(false);
  };

  const cycle = (id) => setData((d) => ({
    ...d, activities: d.activities.map((a) => a.id === id
      ? { ...a, status: a.status === "planning" ? "active" : a.status === "active" ? "done" : "planning" } : a),
  }));

  const openDebrief = (a) => { setDebriefId(a.id); setDform({ rating: a.rating || 0, note: a.debriefNote || "" }); };
  const saveDebrief = () => {
    setData((d) => ({ ...d, activities: d.activities.map((a) => a.id === debriefId ? { ...a, rating: dform.rating, debriefNote: dform.note, status: "done" } : a) }));
    setDebriefId(null);
  };

  const rankedInstructors = useMemo(() =>
    [...data.instructors].map((i) => ({ ...i, score: matchScore(i, form.requiredSkills) })).sort((a, b) => b.score - a.score),
    [data.instructors, form.requiredSkills]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="חיפוש בפעילויות עבר (שם / מיומנות / תחקור)…"
            className="w-full pr-9 pl-3 py-2 rounded-xl border border-stone-200 bg-white outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
        </div>
        {user && user.role !== "volunteer" && (
          <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-semibold shadow">
            <Plus size={18} /> פעילות
          </button>
        )}
      </div>

      <div className="flex gap-1 flex-wrap">
        {["הכל", ...PROJECTS].map((p) => (
          <button key={p} onClick={() => setFilter(p)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${filter === p ? "bg-emerald-600 text-white" : "bg-white border border-stone-200 text-stone-600"}`}>{p}</button>
        ))}
      </div>

      <div className="space-y-3">
        {list.map((a) => (
          <Card key={a.id} className="p-4">
            <div className="flex flex-col md:flex-row md:items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-stone-800">{a.name}</span>
                  <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full">{a.project}</span>
                  <span className="text-[10px] text-stone-300 font-mono">#{a.id}</span>
                </div>
                <div className="text-sm text-stone-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  <span className="flex items-center gap-1"><Building2 size={13} />{nameById(data.branches, a.branchId)}</span>
                  <span className="flex items-center gap-1"><CalendarHeart size={13} />{a.date || "—"}</span>
                  <span className="flex items-center gap-1"><Users size={13} />{a.participants} משתתפים</span>
                  <span className="flex items-center gap-1"><Package size={13} />₪{a.cost}</span>
                </div>
                <div className="text-sm text-stone-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  <span className="flex items-center gap-1"><HandHeart size={13} />{a.instructorIds.map((id) => nameById(data.instructors, id)).join(", ") || "ללא מדריך"}</span>
                  {a.requiredSkills && <span className="flex items-center gap-1 text-amber-600"><Star size={13} />נדרש: {a.requiredSkills}</span>}
                  {(a.participantIds || []).length > 0 && <span className="flex items-center gap-1 text-emerald-700"><Users size={13} />נרשמו: {(a.participantIds || []).length} מתנדבים</span>}
                </div>
                {a.status === "done" && (a.rating || a.debriefNote) && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
                    <div className="flex items-center gap-2 mb-0.5"><span className="text-xs font-semibold text-stone-600">תחקור:</span><Stars value={a.rating} /></div>
                    {a.debriefNote && <p className="text-stone-600 text-xs">{a.debriefNote}</p>}
                  </div>
                )}
                {user && user.role === "volunteer" && a.status !== "done" && (
                  <button onClick={() => toggleSignup(a.id)}
                    className={`mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg ${ (a.participantIds || []).includes(user.fvId) ? "bg-emerald-600 text-white" : "bg-orange-500 text-white hover:bg-orange-600"}`}>
                    {(a.participantIds || []).includes(user.fvId) ? "✓ נרשמת — לחץ לביטול" : "+ אני נרשם/ת"}
                  </button>
                )}
              </div>
              {user && user.role !== "volunteer" && (
                <div className="flex md:flex-col gap-2 shrink-0">
                  <button onClick={() => cycle(a.id)} className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${STATUS[a.status].cls}`}>
                    {STATUS[a.status].label} ↻
                  </button>
                  <button onClick={() => openDebrief(a)} className="text-xs font-semibold px-3 py-1.5 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 flex items-center gap-1 justify-center">
                    <ClipboardList size={13} /> תחקור
                  </button>
                </div>
              )}
            </div>
          </Card>
        ))}
        {list.length === 0 && <p className="text-stone-400 text-sm text-center py-8">לא נמצאו פעילויות.</p>}
      </div>

      {open && (
        <Modal title="הוספת פעילות חדשה" onClose={() => setOpen(false)}>
          <Field label="שם הפעילות"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="פרויקט (קטגוריה)">
              <select className={inputCls} value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })}>
                {PROJECTS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="תאריך"><input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          </div>
          <Field label="סניף">
            <select className={inputCls} value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
              {data.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="מיומנויות נדרשות (מופרדות בפסיק)">
            <input className={inputCls} value={form.requiredSkills} onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })} placeholder="לדוגמה: מוגבלויות, ילדים" />
          </Field>
          <Field label="שיבוץ מדריכים — ממוינים לפי התאמת מיומנויות">
            <div className="space-y-1.5">
              {rankedInstructors.map((i) => {
                const on = form.instructorIds.includes(i.id);
                const rec = i.score > 0;
                return (
                  <button key={i.id} onClick={() => setForm((f) => ({ ...f, instructorIds: on ? f.instructorIds.filter((x) => x !== i.id) : [...f.instructorIds, i.id] }))}
                    className={`w-full flex items-center justify-between text-right px-3 py-2 rounded-xl border ${on ? "bg-emerald-600 border-emerald-600" : "bg-stone-50 border-stone-200"}`}>
                    <span>
                      <span className={`font-semibold text-sm ${on ? "text-white" : "text-stone-700"}`}>{i.name}</span>
                      <span className={`block text-[11px] ${on ? "text-emerald-100" : "text-stone-400"}`}>{i.skills}</span>
                    </span>
                    {rec && <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${on ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"}`}><Star size={10} className="fill-current" />מומלץ</span>}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-stone-400 mt-1">ההמלצה מבוססת על התאמת מיומנויות המדריך לדרישות הפעילות.</p>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="מס׳ משתתפים"><input type="number" className={inputCls} value={form.participants} onChange={(e) => setForm({ ...form, participants: e.target.value })} /></Field>
            <Field label="עלות (₪)"><input type="number" className={inputCls} value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></Field>
          </div>
          <button onClick={add} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-semibold mt-2">שמירה</button>
        </Modal>
      )}

      {debriefId && (
        <Modal title="תחקור פעילות" onClose={() => setDebriefId(null)}>
          <Field label="דירוג שביעות רצון משתתפים">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setDform({ ...dform, rating: n })}>
                  <Star size={26} className={n <= dform.rating ? "text-amber-400 fill-amber-400" : "text-stone-300"} />
                </button>
              ))}
            </div>
          </Field>
          <Field label="חוות דעת וסיכום תחקור">
            <textarea className={inputCls} rows={4} value={dform.note} onChange={(e) => setDform({ ...dform, note: e.target.value })} placeholder="מה עבד, מה נדרש לשפר, הערות לפעם הבאה…" />
          </Field>
          <button onClick={saveDebrief} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-semibold mt-2">שמירת תחקור</button>
        </Modal>
      )}
    </div>
  );
}

/* ============================== חלוקת מוצרים (GIS) ============================== */
// אופטימיזציית מסלול בשיטת "השכן הקרוב" (Nearest Neighbor) על קואורדינטות המשפחות
function optimizeOrder(stops, famById) {
  const pts = stops.map((s) => ({ s, f: famById(s.familyId) })).filter((p) => p.f && p.f.x != null);
  if (pts.length <= 2) return pts.map((p) => p.s);
  const remaining = [...pts];
  const route = [remaining.shift()];
  while (remaining.length) {
    const last = route[route.length - 1].f;
    let bi = 0, bd = Infinity;
    remaining.forEach((p, i) => {
      const d = Math.hypot(p.f.x - last.x, p.f.y - last.y);
      if (d < bd) { bd = d; bi = i; }
    });
    route.push(remaining.splice(bi, 1)[0]);
  }
  return route.map((p) => p.s);
}
function routeLen(ordered, famById) {
  let d = 0;
  for (let i = 1; i < ordered.length; i++) {
    const a = famById(ordered[i - 1].familyId), b = famById(ordered[i].familyId);
    if (a && b && a.x != null && b.x != null) d += Math.hypot(a.x - b.x, a.y - b.y);
  }
  return d;
}

function Distribution({ data, setData, nameById, user }) {
  const [selId, setSelId] = useState(null);
  const [newOpen, setNewOpen] = useState(false);
  const [editFam, setEditFam] = useState(false);
  const [nform, setNform] = useState({ name: "", date: "", items: "", familyIds: [] });

  const fam = (id) => data.families.find((f) => f.id === id) || {};
  const dist = data.distributions.find((x) => x.id === selId) || data.distributions[0];

  const ordered = useMemo(() => dist ? optimizeOrder(dist.stops, fam) : [], [dist, data.families]);
  const origLen = dist ? routeLen(dist.stops, fam) : 0;
  const optLen = routeLen(ordered, fam);
  const saving = origLen > 0 ? Math.max(0, Math.round((1 - optLen / origLen) * 100)) : 0;

  // מתנדב לוקח על עצמו מסירה
  const claimStop = (familyId) => setData((d) => ({
    ...d, distributions: d.distributions.map((x) => x.id !== dist.id ? x
      : { ...x, stops: x.stops.map((s) => s.familyId !== familyId ? s : { ...s, claimedBy: s.claimedBy === user.fvId ? null : user.fvId }) }),
  }));

  const markDelivered = (familyId) => setData((d) => ({
    ...d, distributions: d.distributions.map((x) => x.id !== dist.id ? x
      : { ...x, stops: x.stops.map((s) => s.familyId !== familyId ? s : { ...s, delivered: !s.delivered }) }),
  }));

  // צילום פתח הבית — מסומן לחלוקה הנוכחית ונשמר על המשפחה לתמיד (שימור ידע)
  const capturePhoto = (familyId) => setData((d) => {
    const cur = d.distributions.find((x) => x.id === dist.id).stops.find((s) => s.familyId === familyId);
    const next = !cur.photo;
    return {
      ...d,
      distributions: d.distributions.map((x) => x.id !== dist.id ? x
        : { ...x, stops: x.stops.map((s) => s.familyId !== familyId ? s : { ...s, photo: next }) }),
      families: next ? d.families.map((f) => f.id === familyId ? { ...f, doorPhoto: true } : f) : d.families,
    };
  });

  const toggleFamInDist = (familyId) => setData((d) => ({
    ...d, distributions: d.distributions.map((x) => {
      if (x.id !== dist.id) return x;
      const has = x.stops.some((s) => s.familyId === familyId);
      return { ...x, stops: has ? x.stops.filter((s) => s.familyId !== familyId) : [...x.stops, { familyId, delivered: false, photo: false }] };
    }),
  }));

  const createDist = () => {
    if (!nform.name.trim()) return;
    const id = uid();
    setData((d) => ({ ...d, distributions: [...d.distributions, { id, name: nform.name.trim(), date: nform.date, items: nform.items, stops: nform.familyIds.map((fid) => ({ familyId: fid, delivered: false, photo: false })) }] }));
    setSelId(id);
    setNform({ name: "", date: "", items: "", familyIds: [] });
    setNewOpen(false);
  };

  if (!dist) return (
    <div className="text-center py-10">
      <p className="text-stone-400 mb-3">אין חלוקות מוגדרות.</p>
      <button onClick={() => setNewOpen(true)} className="bg-amber-500 text-white px-4 py-2 rounded-xl font-semibold">+ חלוקה חדשה</button>
    </div>
  );

  const delivered = dist.stops.filter((s) => s.delivered).length;

  return (
    <div className="space-y-4">
      {/* בורר חלוקות חג */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1 flex-wrap flex-1">
          {data.distributions.map((x) => (
            <button key={x.id} onClick={() => setSelId(x.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${dist.id === x.id ? "bg-orange-500 text-white" : "bg-white border border-stone-200 text-stone-600"}`}>{x.name.replace("חלוקת סלי מזון – ", "")}</button>
          ))}
        </div>
        {user && user.role !== "volunteer" && (
          <button onClick={() => setNewOpen(true)} className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-semibold shadow">
            <Plus size={18} /> חלוקת חג
          </button>
        )}
      </div>

      <Card className="p-4 flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="font-bold text-stone-800">{dist.name}</div>
          <div className="text-sm text-stone-500">{dist.date} · {dist.items}</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1"><Navigation size={13} />מסלול מותאם{saving > 0 ? ` · ${saving}%- נסיעה` : ""}</span>
          <span className="text-sm font-bold text-emerald-700">{delivered}/{dist.stops.length} נמסרו</span>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* מפה + מסלול מותאם */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-orange-500" />
              <h3 className="font-bold text-stone-800 text-sm">מפת חלוקה ומסלול מותאם (GIS)</h3>
            </div>
            {user && user.role !== "volunteer" && (
              <button onClick={() => setEditFam(true)} className="text-xs text-emerald-700 font-semibold hover:underline">ערוך משפחות</button>
            )}
          </div>
          <div className="relative w-full rounded-xl overflow-hidden border border-stone-200" style={{ aspectRatio: "1.4", background: "linear-gradient(135deg,#f3f7f3,#fef6ea)" }}>
            <svg viewBox="0 0 100 72" className="w-full h-full">
              {[18, 36, 54].map((y) => <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#e7e2d8" strokeWidth="0.5" />)}
              {[25, 50, 75].map((x) => <line key={x} x1={x} y1="0" x2={x} y2="72" stroke="#e7e2d8" strokeWidth="0.5" />)}
              <polyline points={ordered.map((s) => `${fam(s.familyId).x},${fam(s.familyId).y}`).join(" ")}
                fill="none" stroke="#E8920C" strokeWidth="0.8" strokeDasharray="2 1.5" />
              {ordered.map((s, idx) => {
                const f = fam(s.familyId);
                return (
                  <g key={s.familyId}>
                    <circle cx={f.x} cy={f.y} r="2.8" fill={s.delivered ? "#2E8B6F" : "#D9651A"} stroke="#fff" strokeWidth="0.7" />
                    <text x={f.x} y={f.y + 1} fontSize="2.6" fill="#fff" textAnchor="middle" fontWeight="bold">{idx + 1}</text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="flex gap-4 mt-2 text-[11px] text-stone-500 flex-wrap">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" /> נמסר</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" /> ממתין</span>
            <span className="flex items-center gap-1"><Route size={12} /> הסדר מחושב אוטומטית למסלול הקצר ביותר</span>
          </div>
        </Card>

        {/* רשימת מסירות לפי סדר המסלול */}
        <Card className="p-4">
          <h3 className="font-bold text-stone-800 text-sm mb-3">רשימת יעדים (לפי סדר נסיעה)</h3>
          <div className="space-y-2">
            {ordered.map((s, idx) => {
              const f = fam(s.familyId);
              return (
                <div key={s.familyId} className="flex items-center gap-3 p-2.5 rounded-xl border border-stone-100 bg-stone-50/60">
                  <span className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-stone-800 text-sm truncate">{f.name}</div>
                    <div className="text-xs text-stone-500 truncate">{f.city}, {f.address}</div>
                    {f.doorPhoto && !s.photo && (
                      <div className="text-[10px] text-emerald-700 flex items-center gap-1 mt-0.5"><ImageIcon size={11} /> תמונת דלת קיימת — חוסך זמן באיתור</div>
                    )}
                    {s.claimedBy && (
                      <div className="text-[10px] text-orange-700 flex items-center gap-1 mt-0.5"><HandHeart size={11} /> נלקח ע״י: {nameById(data.fieldVolunteers || [], s.claimedBy)}</div>
                    )}
                  </div>
                  {user && user.role === "volunteer" ? (
                    <button onClick={() => claimStop(s.familyId)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 ${s.claimedBy === user.fvId ? "bg-emerald-600 text-white" : s.claimedBy ? "bg-stone-100 text-stone-400" : "bg-orange-500 text-white hover:bg-orange-600"}`}
                      disabled={s.claimedBy && s.claimedBy !== user.fvId}>
                      {s.claimedBy === user.fvId ? "✓ אני לוקח" : s.claimedBy ? "תפוס" : "אני אקח"}
                    </button>
                  ) : (
                    <>
                      <button onClick={() => capturePhoto(s.familyId)} title="צילום מסירה בפתח הבית"
                        className={`p-1.5 rounded-lg shrink-0 ${s.photo ? "bg-amber-100 text-amber-700" : "bg-white text-stone-300 border border-stone-200"}`}>
                        <Camera size={16} />
                      </button>
                      <button onClick={() => markDelivered(s.familyId)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 ${s.delivered ? "bg-emerald-600 text-white" : "bg-white border border-stone-200 text-stone-500"}`}>
                        {s.delivered ? <CheckCircle2 size={14} /> : <Circle size={14} />}{s.delivered ? "נמסר" : "סמן"}
                      </button>
                    </>
                  )}
                </div>
              );
            })}
            {ordered.length === 0 && <p className="text-stone-400 text-sm text-center py-4">אין משפחות בחלוקה. לחץ "ערוך משפחות".</p>}
          </div>
          <p className="text-[11px] text-stone-400 mt-3 flex items-start gap-1">
            <Camera size={12} className="mt-0.5 shrink-0" /> צילום פתח הבית נשמר על כרטיס המשפחה — בחלוקה הבאה הוא יוצג לשליח אוטומטית כדי לחסוך זמן באיתור.
          </p>
        </Card>
      </div>

      {/* חלון יצירת חלוקת חג */}
      {newOpen && (
        <Modal title="חלוקת חג חדשה" onClose={() => setNewOpen(false)}>
          <Field label="שם החלוקה"><input className={inputCls} value={nform.name} onChange={(e) => setNform({ ...nform, name: e.target.value })} placeholder="לדוגמה: חלוקת סלי מזון – חנוכה" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="תאריך"><input type="date" className={inputCls} value={nform.date} onChange={(e) => setNform({ ...nform, date: e.target.value })} /></Field>
            <Field label="תכולת הסל"><input className={inputCls} value={nform.items} onChange={(e) => setNform({ ...nform, items: e.target.value })} placeholder="סל מזון לחג" /></Field>
          </div>
          <Field label="בחירת משפחות לחלוקה">
            <div className="max-h-44 overflow-y-auto space-y-1.5 border border-stone-100 rounded-xl p-2">
              {data.families.map((f) => {
                const on = nform.familyIds.includes(f.id);
                return (
                  <button key={f.id} onClick={() => setNform((n) => ({ ...n, familyIds: on ? n.familyIds.filter((x) => x !== f.id) : [...n.familyIds, f.id] }))}
                    className={`w-full flex items-center justify-between text-right px-3 py-1.5 rounded-lg text-sm ${on ? "bg-emerald-600 text-white" : "bg-stone-50 text-stone-600"}`}>
                    <span>{f.name} · {f.city}</span>
                    {on ? <CheckCircle2 size={15} /> : <Circle size={15} className="text-stone-300" />}
                  </button>
                );
              })}
            </div>
          </Field>
          <button onClick={createDist} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-semibold mt-2">יצירת חלוקה</button>
        </Modal>
      )}

      {/* חלון עריכת משפחות בחלוקה הנוכחית */}
      {editFam && (
        <Modal title={`משפחות ב${dist.name}`} onClose={() => setEditFam(false)}>
          <p className="text-xs text-stone-500 mb-3">הוסף או הסר משפחות. המסלול יחושב מחדש אוטומטית.</p>
          <div className="space-y-1.5">
            {data.families.map((f) => {
              const on = dist.stops.some((s) => s.familyId === f.id);
              return (
                <button key={f.id} onClick={() => toggleFamInDist(f.id)}
                  className={`w-full flex items-center justify-between text-right px-3 py-2 rounded-lg text-sm ${on ? "bg-emerald-600 text-white" : "bg-stone-50 text-stone-600"}`}>
                  <span>{f.name} · {f.city}{f.doorPhoto ? " · 📷" : ""}</span>
                  {on ? <CheckCircle2 size={16} /> : <Plus size={16} className="text-stone-400" />}
                </button>
              );
            })}
          </div>
          <button onClick={() => setEditFam(false)} className="w-full bg-stone-800 text-white py-2.5 rounded-xl font-semibold mt-3">סיום</button>
        </Modal>
      )}
    </div>
  );
}

/* ============================== דיווחים ומעקב ============================== */
function Reports({ data, setData, nameById, user }) {
  const defaultReporter = user && user.role === "service" ? user.volunteerId : "v1";
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ volunteerId: defaultReporter, week: "2026-W22", project: PROJECTS[0], hours: 0, note: "" });

  const add = () => {
    if (!form.hours) return;
    setData((d) => ({ ...d, reports: [{ ...form, id: uid(), hours: +form.hours }, ...d.reports] }));
    setForm({ volunteerId: defaultReporter, week: "2026-W22", project: PROJECTS[0], hours: 0, note: "" });
    setOpen(false);
  };

  const exportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      const fam = data.families.map((f) => ({
        "שם משפחה": f.name, "סניף": nameById(data.branches, f.branchId),
        "עיר": f.city, "כתובת": f.address, "טלפון": f.phone,
        "סוג צורך": f.category, "בת שירות אחראית": nameById(data.volunteers, f.volunteerId),
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fam), "משפחות");

      const act = data.activities.map((a) => ({
        "פעילות": a.name, "פרויקט": a.project, "תאריך": a.date,
        "סניף": nameById(data.branches, a.branchId), "סטטוס": (STATUS[a.status] || {}).label,
        "משתתפים": a.participants, "עלות": a.cost,
        "מדריכים": a.instructorIds.map((id) => nameById(data.instructors, id)).join(", "),
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(act), "פעילויות");

      const rep = data.reports.map((r) => ({
        "בת שירות": nameById(data.volunteers, r.volunteerId), "שבוע": r.week,
        "פרויקט": r.project, "שעות": r.hours, "הערות": r.note,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rep), "דיווחים");

      const sum = {};
      data.reports.forEach((r) => (sum[r.project] = (sum[r.project] || 0) + r.hours));
      const summary = PROJECTS.map((p) => ({ "פרויקט": p, "סה״כ שעות": sum[p] || 0 }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), "סיכום שעות");

      XLSX.writeFile(wb, "meirim-doch.xlsx");
    } catch (e) {
      alert("הייצוא נכשל בסביבה זו. נסה להריץ את הקוד מחוץ לתצוגה המוטמעת.");
    }
  };

  const byVolunteer = useMemo(() => {
    const m = {};
    data.reports.forEach((r) => (m[r.volunteerId] = (m[r.volunteerId] || 0) + r.hours));
    return data.volunteers.map((v) => ({ name: v.name, שעות: m[v.id] || 0 }));
  }, [data.reports, data.volunteers]);

  // פותר שם מדווח מבנות השירות או מהמדריכים
  const personName = (id) => {
    const n = nameById(data.volunteers, id);
    return n !== "—" ? n : nameById(data.instructors, id);
  };

  // מעקב חובת דיווח שבועי (ציות) — בנות שירות + מדריכים
  const allWeeks = useMemo(() => {
    const s = new Set(data.reports.map((r) => r.week));
    if (form.week) s.add(form.week);
    return [...s].sort().reverse();
  }, [data.reports, form.week]);
  const [cWeek, setCWeek] = useState(null);
  const week = cWeek || allWeeks[0] || "2026-W22";
  const compliance = useMemo(() => {
    const reported = new Set(data.reports.filter((r) => r.week === week).map((r) => r.volunteerId));
    const people = [
      ...data.volunteers.map((v) => ({ id: v.id, name: v.name, role: "בת שירות" })),
      ...data.instructors.map((i) => ({ id: i.id, name: i.name, role: "מדריך" })),
    ];
    return people.map((p) => ({ ...p, done: reported.has(p.id) }));
  }, [data.reports, data.volunteers, data.instructors, week]);
  const doneCount = compliance.filter((p) => p.done).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-stone-800">דיווחי פעילות שבועיים</h3>
        <div className="flex items-center gap-2">
          <button onClick={exportExcel} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-semibold shadow">
            <FileSpreadsheet size={18} /> ייצוא ל-Excel
          </button>
          <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-semibold shadow">
            <Plus size={18} /> דיווח
          </button>
        </div>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-amber-500" />
            <h4 className="font-bold text-stone-800 text-sm">מעקב חובת דיווח שבועי</h4>
          </div>
          <select value={week} onChange={(e) => setCWeek(e.target.value)} className="text-sm px-3 py-1.5 rounded-lg border border-stone-200 bg-white outline-none">
            {allWeeks.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-3 rounded-full bg-stone-100 overflow-hidden">
            <div className="h-full bg-gradient-to-l from-emerald-400 to-emerald-600 rounded-full transition-all" style={{ width: `${compliance.length ? (doneCount / compliance.length) * 100 : 0}%` }} />
          </div>
          <span className="text-sm font-bold text-stone-700">{doneCount}/{compliance.length} דיווחו</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {compliance.map((p) => (
            <div key={p.id} className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-sm ${p.done ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"}`}>
              <span className="min-w-0">
                <span className="font-semibold text-stone-700 block truncate">{p.name}</span>
                <span className="text-[10px] text-stone-400">{p.role}</span>
              </span>
              {p.done
                ? <span className="text-emerald-600 flex items-center gap-1 text-xs font-semibold shrink-0"><CheckCircle2 size={14} />דיווח</span>
                : <span className="text-rose-600 flex items-center gap-1 text-xs font-semibold shrink-0"><AlertTriangle size={14} />חסר</span>}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h4 className="font-bold text-stone-800 text-sm mb-3">תפוקת מתנדבים — סה״כ שעות לבת שירות</h4>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byVolunteer} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ece4" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#78716c" }} />
              <YAxis tick={{ fontSize: 11, fill: "#78716c" }} />
              <Tooltip />
              <Bar dataKey="שעות" radius={[6, 6, 0, 0]} fill="#2E8B6F" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-stone-500 text-xs">
            <tr>
              <th className="text-right font-semibold px-4 py-2.5">מדווח/ת</th>
              <th className="text-right font-semibold px-4 py-2.5">שבוע</th>
              <th className="text-right font-semibold px-4 py-2.5">פרויקט</th>
              <th className="text-right font-semibold px-4 py-2.5">שעות</th>
              <th className="text-right font-semibold px-4 py-2.5 hidden md:table-cell">הערות</th>
            </tr>
          </thead>
          <tbody>
            {data.reports.map((r) => (
              <tr key={r.id} className="border-t border-stone-100">
                <td className="px-4 py-2.5 font-medium text-stone-700">{personName(r.volunteerId)}</td>
                <td className="px-4 py-2.5 text-stone-500">{r.week}</td>
                <td className="px-4 py-2.5"><span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{r.project}</span></td>
                <td className="px-4 py-2.5 font-bold text-stone-800">{r.hours}</td>
                <td className="px-4 py-2.5 text-stone-500 hidden md:table-cell">{r.note || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {open && (
        <Modal title="דיווח פעילות שבועי" onClose={() => setOpen(false)}>
          <Field label="מדווח/ת (בת שירות / מדריך)">
            <select className={inputCls} value={form.volunteerId} onChange={(e) => setForm({ ...form, volunteerId: e.target.value })}>
              <optgroup label="בנות שירות">
                {data.volunteers.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </optgroup>
              <optgroup label="מדריכים">
                {data.instructors.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </optgroup>
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="שבוע"><input className={inputCls} value={form.week} onChange={(e) => setForm({ ...form, week: e.target.value })} placeholder="2026-W22" /></Field>
            <Field label="שעות"><input type="number" className={inputCls} value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} /></Field>
          </div>
          <Field label="פרויקט">
            <select className={inputCls} value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })}>
              {PROJECTS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="תיאור הפעילות"><textarea className={inputCls} rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
          <button onClick={add} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-semibold mt-2">שמירת דיווח</button>
        </Modal>
      )}
    </div>
  );
}

/* ============================== אפיון ותיעוד מערכת ============================== */
function Docs({ data }) {
  const entities = [
    { e: "BRANCH", he: "סניף", fields: "branch_id, name, city" },
    { e: "SERVICE_VOLUNTEER", he: "בת שירות לאומי", fields: "volunteer_id, name, phone, branch_id↗" },
    { e: "FAMILY", he: "משפחה נתמכת", fields: "family_id, name, address, need_category, branch_id↗, volunteer_id↗, lat, lng" },
    { e: "INSTRUCTOR", he: "מדריך", fields: "instructor_id, name, skills" },
    { e: "ACTIVITY", he: "פעילות", fields: "activity_id, name, project, date, status, cost, branch_id↗" },
    { e: "ACTIVITY_INSTRUCTOR", he: "שיבוץ מדריך (N:N)", fields: "activity_id↗, instructor_id↗" },
    { e: "DISTRIBUTION", he: "חלוקה", fields: "distribution_id, name, dist_date, items" },
    { e: "DISTRIBUTION_STOP", he: "יעד חלוקה", fields: "stop_id, distribution_id↗, family_id↗, delivered, photo_url, route_order" },
    { e: "ACTIVITY_REPORT", he: "דיווח פעילות", fields: "report_id, volunteer_id↗, week, project, hours" },
  ];
  const mapping = [
    { p: "ניהול משפחות", solves: "עבודה כפולה ואובדן מידע מקובצי אקסל", how: "קליטה ישירה לשדות קבועים מראש" },
    { p: "שיבוץ מדריכים לפי קטגוריה", solves: "אובדן זיכרון ארגוני וכאוס דיווח", how: "ניהול פעילות מתכנון ועד מחקר, מקושר לכישורים" },
    { p: "שיוך אוטומטי משפחה–בת שירות", solves: "החלפות אחריות שנתיות לא מתועדות", how: "אימות ועדכון האחראית במערכת" },
    { p: "חלוקה על מפת GIS + צילום", solves: "חוסר יעילות לוגיסטי ואיחורים", how: "תכנון מסלול, אישור מסירה, תמונת פתח לבית" },
    { p: "דיווח שבועי + עיבוד אוטומטי", solves: "היעדר נתונים כמותיים לניהול", how: "מדדי תפוקה ושעות לפי פרויקט בזמן אמת" },
  ];
  const lit = [
    "מערכות CRM וניהול קשרי מתנדבים במגזר השלישי (Third-Sector / Nonprofit IS)",
    "מתודולוגיית DMAIC ו-Six Sigma לשיפור תהליכים",
    "תקן מידול תהליכים BPMN 2.0 (OMG) להשוואת As-Is מול To-Be",
    "בעיית ניתוב כלי רכב (Vehicle Routing Problem) ו-GIS בלוגיסטיקה הומניטרית",
    "ניהול ידע ארגוני (Knowledge Management) ומניעת אובדן ידע שבטי",
    "חקר עבודה ומדידת זמנים (Work Study / Time Study)",
    "עקרונות חווית משתמש (UX) ונגישות בממשקי RTL בעברית",
  ];

  const Section = ({ icon: Icon, title, children }) => (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={18} className="text-amber-500" />
        <h3 className="font-bold text-stone-800">{title}</h3>
      </div>
      {children}
    </Card>
  );

  return (
    <div className="space-y-5">
      <Card className="p-5 bg-gradient-to-l from-amber-50 to-emerald-50 border-amber-100">
        <h2 style={{ fontFamily: "'Frank Ruhl Libre', serif" }} className="text-xl font-black text-emerald-800 mb-1">אפיון המערכת ותיעוד הנדסי</h2>
        <p className="text-sm text-stone-600">מסמך חי המסכם את מודל הנתונים, התהליכים, מדדי הביצוע, המתודולוגיה ההנדסית וכיווני סקירת הספרות של פרויקט הגמר בעמותת מאירים.</p>
      </Card>

      <Section icon={Database} title="ישויות מסד הנתונים (ERD)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-stone-500 bg-stone-50">
              <tr><th className="text-right px-3 py-2 font-semibold">ישות</th><th className="text-right px-3 py-2 font-semibold">תיאור</th><th className="text-right px-3 py-2 font-semibold">שדות עיקריים (↗ = מפתח זר)</th></tr>
            </thead>
            <tbody>
              {entities.map((x) => (
                <tr key={x.e} className="border-t border-stone-100">
                  <td className="px-3 py-2 font-mono text-xs text-emerald-700 font-bold">{x.e}</td>
                  <td className="px-3 py-2 text-stone-700">{x.he}</td>
                  <td className="px-3 py-2 text-stone-500 text-xs">{x.fields}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-stone-400 mt-2">9 ישויות, 2 קשרי רבים-לרבים (שיבוץ מדריכים, יעדי חלוקה). דיאגרמת ה-ERD המלאה מצורפת כקובץ נפרד.</p>
      </Section>

      <Section icon={Workflow} title="מיפוי תהליכים לבעיות ההנדסיות">
        <div className="space-y-2">
          {mapping.map((m, i) => (
            <div key={i} className="grid md:grid-cols-3 gap-2 p-3 rounded-xl bg-stone-50/70 border border-stone-100 text-sm">
              <div className="font-bold text-emerald-700">{m.p}</div>
              <div className="text-stone-500"><span className="text-rose-500 font-semibold">פותר: </span>{m.solves}</div>
              <div className="text-stone-600"><span className="text-amber-600 font-semibold">כיצד: </span>{m.how}</div>
            </div>
          ))}
        </div>
      </Section>

      <div className="grid lg:grid-cols-2 gap-5">
        <Section icon={Cpu} title="מתודולוגיה וטכנולוגיה">
          <ul className="space-y-2 text-sm text-stone-700">
            <li className="flex gap-2"><span className="text-amber-500 font-bold">DMAIC</span> — חקר המצב הקיים ומדידת זמני עבודה</li>
            <li className="flex gap-2"><span className="text-amber-500 font-bold">BPMN</span> — מידול והשוואת מצב קיים מול מוצע</li>
            <li className="flex gap-2"><span className="text-amber-500 font-bold">DFD + ERD</span> — ניתוח זרימת נתונים ועיצוב מסד הנתונים</li>
            <li className="flex gap-2"><span className="text-emerald-600 font-bold">React</span> — צד לקוח (חווית משתמש)</li>
            <li className="flex gap-2"><span className="text-emerald-600 font-bold">Python + SQL</span> — צד שרת, AI ומסד נתונים</li>
            <li className="flex gap-2"><span className="text-emerald-600 font-bold">GIS</span> — תכנון מסלולי חלוקה</li>
          </ul>
        </Section>

        <Section icon={BookOpen} title="כיווני סקירת ספרות">
          <ul className="space-y-1.5 text-sm text-stone-700 list-disc pr-5">
            {lit.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
          <p className="text-[11px] text-stone-400 mt-3">אלו תחומי הליבה והתקנים המקצועיים לכיסוי בסקירה — יש להוסיף מקורות אקדמיים ספציפיים (מאמרים, שנים) בעת הכתיבה.</p>
        </Section>
      </div>

      <Section icon={TrendingUp} title="מדדי ביצוע (KPIs) שהמערכת מפיקה">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          {[
            { v: data.families.length, l: "משפחות מנוהלות" },
            { v: data.reports.reduce((s, r) => s + r.hours, 0), l: "שעות מדווחות" },
            { v: data.activities.length, l: "פעילויות" },
            { v: "GIS", l: "אופטימיזציית מסלול" },
          ].map((k, i) => (
            <div key={i} className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-emerald-50 border border-amber-100">
              <div className="text-2xl font-extrabold text-emerald-700">{k.v}</div>
              <div className="text-xs text-stone-500 mt-1">{k.l}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
