import { useState } from "react";

const LOGO_URL = "./Listica_Logo.png";

const LIST_TYPES = [
  { id: "grocery", label: "Grocery", icon: "🛒", color: "#4ade80", desc: "Shopping & ingredients" },
  { id: "trip", label: "Trip", icon: "✈️", color: "#60a5fa", desc: "Travel packing & plans" },
  { id: "work", label: "Work", icon: "💼", color: "#f59e0b", desc: "Tasks & meetings" },
  { id: "event", label: "Event", icon: "🎉", color: "#e879f9", desc: "Party & gathering prep" },
  { id: "health", label: "Health", icon: "💊", color: "#f87171", desc: "Meds, appointments" },
  { id: "custom", label: "Custom", icon: "✏️", color: "#94a3b8", desc: "Anything else" },
];

const SAMPLE_ITEMS = {
  grocery: ["Milk", "Eggs", "Bread", "Butter", "Apples"],
  trip: ["Passport", "Charger", "Toothbrush", "Clothes (3 days)", "Camera"],
  work: ["Review slides", "Send report", "Team standup", "Reply to emails"],
  event: ["Decorations", "Cake", "Invitations", "Music playlist", "Ice"],
  health: ["Vitamin D", "Book checkup", "Refill prescription"],
  custom: [],
};

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function generateGoogleCalendarURL(list) {
  const title = encodeURIComponent("📋 " + list.name);
  const details = encodeURIComponent(list.items.map((i, n) => `${n + 1}. ${i.text}`).join("\n"));
  const date = (list.date || new Date().toISOString().slice(0, 10)).replace(/-/g, "");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${date}/${date}`;
}

function generateICSData(list) {
  const date = (list.date || new Date().toISOString().slice(0, 10)).replace(/-/g, "");
  const title = encodeURIComponent("📋 " + list.name);
  const desc = encodeURIComponent(list.items.map((i, n) => `${n + 1}. ${i.text}`).join("\\n"));
  return `data:text/calendar;charset=utf8,BEGIN:VCALENDAR%0AVERSION:2.0%0ABEGIN:VEVENT%0ASUMMARY:${title}%0ADTSTART:${date}%0ADTEND:${date}%0ADESCRIPTION:${desc}%0AEND:VEVENT%0AEND:VCALENDAR`;
}

export default function App() {
  const [view, setView] = useState("home");
  const [lists, setLists] = useState([
    {
      id: "demo1",
      type: "grocery",
      name: "Weekly Groceries",
      date: new Date().toISOString().slice(0, 10),
      items: [
        { id: 1, text: "Milk", done: true },
        { id: 2, text: "Eggs", done: false },
        { id: 3, text: "Bread", done: false },
      ],
    },
  ]);
  const [activeList, setActiveList] = useState(null);
  const [creating, setCreating] = useState({ type: null, name: "", date: "", items: [], newItem: "" });
  const [showCalModal, setShowCalModal] = useState(false);
  const [calTarget, setCalTarget] = useState(null);

  const selectedType = LIST_TYPES.find((t) => t.id === creating.type);

  function startCreate(typeId) {
    const type = LIST_TYPES.find((t) => t.id === typeId);
    setCreating({
      type: typeId,
      name: typeId === "custom" ? "" : `My ${type.label} List`,
      date: new Date().toISOString().slice(0, 10),
      items: (SAMPLE_ITEMS[typeId] || []).map((s, i) => ({ id: i + 1, text: s, done: false })),
      newItem: "",
    });
    setView("create");
  }

  function addItem() {
    if (!creating.newItem.trim()) return;
    setCreating((c) => ({
      ...c,
      items: [...c.items, { id: Date.now(), text: c.newItem.trim(), done: false }],
      newItem: "",
    }));
  }

  function removeItem(id) {
    setCreating((c) => ({ ...c, items: c.items.filter((i) => i.id !== id) }));
  }

  function saveList() {
    const newList = {
      id: Date.now().toString(),
      type: creating.type,
      name: creating.name || `${selectedType?.label} List`,
      date: creating.date,
      items: creating.items,
    };
    setLists((prev) => [newList, ...prev]);
    setActiveList(newList);
    setView("detail");
  }

  function toggleItem(listId, itemId) {
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId
          ? { ...l, items: l.items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)) }
          : l
      )
    );
    setActiveList((al) =>
      al && al.id === listId
        ? { ...al, items: al.items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)) }
        : al
    );
  }

  function deleteList(id) {
    setLists((prev) => prev.filter((l) => l.id !== id));
    setView("home");
  }

  function openCalModal(list) {
    setCalTarget(list);
    setShowCalModal(true);
  }

  const getType = (id) => LIST_TYPES.find((t) => t.id === id) || LIST_TYPES[LIST_TYPES.length - 1];

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0f; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0a0f; }
        ::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius: 2px; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.5; cursor: pointer; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        .list-card:hover { transform: translateY(-2px); border-color: rgba(255,255,255,0.12) !important; }
        .type-btn:hover { transform: scale(1.03); }
        .btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
        .btn-ghost:hover { background: rgba(255,255,255,0.06); }
        .item-row:hover .remove-btn { opacity: 1 !important; }
        .cal-opt:hover { background: rgba(255,255,255,0.08); transform: scale(1.01); }
        .check-item:hover { background: rgba(255,255,255,0.04); }
        input:focus { outline: none; }
      `}</style>

      {/* HEADER */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {view !== "home" && (
              <button onClick={() => setView("home")} style={s.backBtn} className="btn-ghost">←</button>
            )}
            <img src={LOGO_URL} alt="Listica" style={s.logoImg} />
          </div>
          {view === "home" && lists.length > 0 && (
            <div style={s.listCount}>{lists.length} list{lists.length !== 1 ? "s" : ""}</div>
          )}
        </div>
      </header>

      <main style={s.main}>

        {/* HOME */}
        {view === "home" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <div style={s.heroSection}>
              <h1 style={s.heroTitle}>Your lists,<br />your day.</h1>
              <p style={s.heroSub}>Create smart lists and pin them to your calendar.</p>
            </div>

            <p style={s.sectionLabel}>Start a new list</p>
            <div style={s.typeGrid}>
              {LIST_TYPES.map((t) => (
                <button key={t.id} className="type-btn" onClick={() => startCreate(t.id)}
                  style={{ ...s.typeCard, borderColor: t.color + "44" }}>
                  <span style={s.typeIcon}>{t.icon}</span>
                  <span style={s.typeName}>{t.label}</span>
                  <span style={s.typeDesc}>{t.desc}</span>
                  <span style={{ ...s.typeDot, background: t.color }} />
                </button>
              ))}
            </div>

            {lists.length > 0 && (
              <>
                <p style={{ ...s.sectionLabel, marginTop: 40 }}>Your lists</p>
                <div style={s.listStack}>
                  {lists.map((list) => {
                    const t = getType(list.type);
                    const done = list.items.filter((i) => i.done).length;
                    const pct = list.items.length > 0 ? (done / list.items.length) * 100 : 0;
                    return (
                      <div key={list.id} className="list-card" onClick={() => { setActiveList(list); setView("detail"); }}
                        style={{ ...s.listCard, transition: "all 0.2s ease", cursor: "pointer" }}>
                        <div style={s.listCardLeft}>
                          <span style={s.listCardIcon}>{t.icon}</span>
                          <div>
                            <div style={s.listCardName}>{list.name}</div>
                            <div style={s.listCardMeta}>
                              {list.items.length} items
                              {list.date && <> · <span style={{ color: t.color }}>{formatDate(list.date)}</span></>}
                            </div>
                          </div>
                        </div>
                        <div style={s.progressRingWrap}>
                          <svg width="38" height="38" viewBox="0 0 38 38">
                            <circle cx="19" cy="19" r="15" fill="none" stroke="#1e1e2e" strokeWidth="3" />
                            <circle cx="19" cy="19" r="15" fill="none" stroke={t.color} strokeWidth="3"
                              strokeDasharray={`${(pct / 100) * 94} 94`} strokeLinecap="round"
                              transform="rotate(-90 19 19)" style={{ transition: "stroke-dasharray 0.5s ease" }} />
                          </svg>
                          <span style={{ ...s.progressPct, color: t.color }}>{Math.round(pct)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* TAGLINE FOOTER */}
            <div style={s.taglineFooter}>
              <span style={s.taglineDash}>—</span>
              <span style={s.taglineText}>List it & Get it Done</span>
              <span style={s.taglineDash}>—</span>
            </div>
          </div>
        )}

        {/* CREATE */}
        {view === "create" && selectedType && (
          <div style={{ animation: "fadeUp 0.35s ease" }}>
            <div style={{ ...s.createHeader, borderColor: selectedType.color + "55" }}>
              <span style={{ fontSize: 36 }}>{selectedType.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={s.createTypeTag}>{selectedType.label} list</div>
                <input value={creating.name}
                  onChange={(e) => setCreating((c) => ({ ...c, name: e.target.value }))}
                  placeholder="List name..." style={s.nameInput} maxLength={40} />
              </div>
            </div>

            <div style={s.dateRow}>
              <span style={s.dateLabel}>📅 Assign to a day</span>
              <input type="date" value={creating.date}
                onChange={(e) => setCreating((c) => ({ ...c, date: e.target.value }))}
                style={s.dateInput} />
            </div>

            <div style={s.itemsSection}>
              <p style={s.sectionLabel}>Items <span style={s.itemCount}>{creating.items.length}</span></p>
              <div style={s.addRow}>
                <input value={creating.newItem}
                  onChange={(e) => setCreating((c) => ({ ...c, newItem: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addItem()}
                  placeholder="Add an item..." style={s.addInput} />
                <button onClick={addItem} className="btn-primary"
                  style={{ ...s.addBtn, background: selectedType.color }}>+</button>
              </div>
              <div style={s.itemList}>
                {creating.items.map((item) => (
                  <div key={item.id} className="item-row" style={s.itemRow}>
                    <span style={{ ...s.itemDot, background: selectedType.color }} />
                    <span style={s.itemText}>{item.text}</span>
                    <button className="remove-btn" onClick={() => removeItem(item.id)}
                      style={{ ...s.removeBtn, opacity: 0 }}>×</button>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={saveList} className="btn-primary"
              style={{ ...s.saveBtn, background: selectedType.color }}>
              Save List →
            </button>
          </div>
        )}

        {/* DETAIL */}
        {view === "detail" && activeList && (() => {
          const t = getType(activeList.type);
          const live = lists.find((l) => l.id === activeList.id) || activeList;
          const done = live.items.filter((i) => i.done).length;
          return (
            <div style={{ animation: "fadeUp 0.35s ease" }}>
              <div style={{ ...s.detailHeader, borderColor: t.color + "44" }}>
                <span style={{ fontSize: 40 }}>{t.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={s.detailName}>{live.name}</div>
                  {live.date && <div style={{ ...s.detailDate, color: t.color }}>{formatDate(live.date)}</div>}
                </div>
                <div style={s.doneCount}>
                  <span style={{ color: t.color, fontWeight: 800 }}>{done}</span>
                  <span style={{ color: "#444" }}>/{live.items.length}</span>
                </div>
              </div>

              <div style={s.calBanner}>
                <div>
                  <div style={s.calBannerTitle}>📅 Add to Calendar</div>
                  <div style={s.calBannerSub}>Pin this list to {live.date ? formatDate(live.date) : "a day"}</div>
                </div>
                <button onClick={() => openCalModal(live)} className="btn-primary"
                  style={{ ...s.calBtn, background: t.color }}>+ Add</button>
              </div>

              <div style={s.checkList}>
                {live.items.map((item) => (
                  <div key={item.id} className="check-item" onClick={() => toggleItem(live.id, item.id)}
                    style={{ ...s.checkRow, opacity: item.done ? 0.4 : 1, transition: "all 0.2s", cursor: "pointer" }}>
                    <div style={{ ...s.checkBox, borderColor: t.color, background: item.done ? t.color : "transparent" }}>
                      {item.done && <span style={{ color: "#0a0a0f", fontSize: 11, fontWeight: 900 }}>✓</span>}
                    </div>
                    <span style={{ ...s.checkText, textDecoration: item.done ? "line-through" : "none" }}>{item.text}</span>
                  </div>
                ))}
              </div>

              <button onClick={() => deleteList(live.id)} className="btn-ghost" style={s.deleteBtn}>
                Delete list
              </button>
            </div>
          );
        })()}
      </main>

      {/* CALENDAR MODAL */}
      {showCalModal && calTarget && (
        <div style={s.modalOverlay} onClick={() => setShowCalModal(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalLogo}>
              <img src={LOGO_URL} alt="Listica" style={{ height: 36 }} />
            </div>
            <div style={s.modalTitle}>Add to your calendar</div>
            <div style={s.modalSub}>"{calTarget.name}" will be pinned as an event with all your items.</div>

            <a href={generateGoogleCalendarURL(calTarget)} target="_blank" rel="noopener noreferrer"
              className="cal-opt" style={s.calOpt} onClick={() => setShowCalModal(false)}>
              <span style={s.calOptIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <rect width="24" height="24" rx="4" fill="#4285F4"/>
                  <rect x="3" y="3" width="7" height="7" rx="1" fill="white"/>
                  <rect x="14" y="3" width="7" height="7" rx="1" fill="#EA4335"/>
                  <rect x="3" y="14" width="7" height="7" rx="1" fill="#34A853"/>
                  <rect x="14" y="14" width="7" height="7" rx="1" fill="#FBBC05"/>
                </svg>
              </span>
              <div>
                <div style={s.calOptName}>Google Calendar</div>
                <div style={s.calOptSub}>Opens in browser</div>
              </div>
              <span style={s.calOptArrow}>→</span>
            </a>

            <a href={generateICSData(calTarget)} download={`${calTarget.name.replace(/\s+/g, "_")}.ics`}
              className="cal-opt" style={s.calOpt} onClick={() => setShowCalModal(false)}>
              <span style={s.calOptIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <rect width="24" height="24" rx="4" fill="#1C7CF9"/>
                  <rect x="3" y="5" width="18" height="16" rx="2" fill="white"/>
                  <rect x="3" y="5" width="18" height="5" rx="2" fill="#1C7CF9"/>
                  <rect x="7" y="3" width="2" height="4" rx="1" fill="#1C7CF9"/>
                  <rect x="15" y="3" width="2" height="4" rx="1" fill="#1C7CF9"/>
                  <circle cx="8" cy="15" r="1.5" fill="#1C7CF9"/>
                  <circle cx="12" cy="15" r="1.5" fill="#1C7CF9"/>
                  <circle cx="16" cy="15" r="1.5" fill="#1C7CF9"/>
                </svg>
              </span>
              <div>
                <div style={s.calOptName}>Apple Calendar</div>
                <div style={s.calOptSub}>Downloads .ics file</div>
              </div>
              <span style={s.calOptArrow}>→</span>
            </a>

            <button className="btn-ghost" onClick={() => setShowCalModal(false)} style={s.modalCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  root: { minHeight: "100vh", background: "#0a0a0f", fontFamily: "'DM Sans', sans-serif", color: "#e8e8f0" },
  header: { position: "sticky", top: 0, zIndex: 50, background: "rgba(10,10,15,0.88)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "0 20px" },
  headerInner: { maxWidth: 480, margin: "0 auto", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" },
  backBtn: { background: "none", border: "none", color: "#888", fontSize: 20, cursor: "pointer", padding: "4px 8px", borderRadius: 8, transition: "background 0.2s" },
  logoImg: { height: 38, objectFit: "contain" },
  listCount: { fontSize: 12, color: "#555", background: "#1a1a28", padding: "3px 10px", borderRadius: 20, fontWeight: 500 },
  main: { maxWidth: 480, margin: "0 auto", padding: "24px 20px 80px" },
  heroSection: { marginBottom: 32 },
  heroTitle: { fontFamily: "'Nunito', sans-serif", fontSize: 40, fontWeight: 900, lineHeight: 1.1, letterSpacing: "-1px", color: "#f0f0fa", marginBottom: 10 },
  heroSub: { fontSize: 15, color: "#666", lineHeight: 1.5 },
  sectionLabel: { fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#444", marginBottom: 14 },
  typeGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 },
  typeCard: { background: "#111118", border: "1px solid", borderRadius: 16, padding: "16px 12px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, cursor: "pointer", position: "relative", overflow: "hidden", transition: "all 0.2s ease" },
  typeIcon: { fontSize: 22, marginBottom: 2 },
  typeName: { fontSize: 13, fontWeight: 700, color: "#e0e0f0" },
  typeDesc: { fontSize: 10, color: "#555", lineHeight: 1.3 },
  typeDot: { position: "absolute", top: 10, right: 10, width: 6, height: 6, borderRadius: "50%" },
  listStack: { display: "flex", flexDirection: "column", gap: 10 },
  listCard: { background: "#111118", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  listCardLeft: { display: "flex", alignItems: "center", gap: 14 },
  listCardIcon: { fontSize: 24 },
  listCardName: { fontSize: 15, fontWeight: 700, color: "#e8e8f0" },
  listCardMeta: { fontSize: 12, color: "#555", marginTop: 2 },
  progressRingWrap: { position: "relative", width: 38, height: 38 },
  progressPct: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: 8, fontWeight: 800 },
  taglineFooter: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 48, opacity: 0.3 },
  taglineDash: { color: "#4ade80", fontSize: 12 },
  taglineText: { fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", fontWeight: 600 },
  createHeader: { display: "flex", alignItems: "flex-start", gap: 16, background: "#111118", border: "1px solid", borderRadius: 20, padding: "20px", marginBottom: 16 },
  createTypeTag: { fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#555", marginBottom: 6 },
  nameInput: { background: "none", border: "none", outline: "none", color: "#f0f0fa", fontFamily: "'Nunito', sans-serif", fontSize: 20, fontWeight: 800, width: "100%" },
  dateRow: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#111118", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px 18px", marginBottom: 20 },
  dateLabel: { fontSize: 14, color: "#bbb", fontWeight: 500 },
  dateInput: { background: "#1a1a28", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#e8e8f0", padding: "7px 12px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none" },
  itemsSection: { marginBottom: 24 },
  itemCount: { background: "#1a1a28", padding: "1px 7px", borderRadius: 20, fontSize: 10, color: "#666" },
  addRow: { display: "flex", gap: 8, marginBottom: 12 },
  addInput: { flex: 1, background: "#111118", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#e8e8f0", padding: "12px 16px", fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none" },
  addBtn: { border: "none", borderRadius: 12, width: 46, height: 46, fontSize: 22, fontWeight: 300, color: "#0a0a0f", cursor: "pointer", transition: "all 0.2s" },
  itemList: { display: "flex", flexDirection: "column", gap: 4 },
  itemRow: { display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#111118", borderRadius: 10, border: "1px solid rgba(255,255,255,0.04)" },
  itemDot: { width: 6, height: 6, borderRadius: "50%", flexShrink: 0 },
  itemText: { flex: 1, fontSize: 14, color: "#ccc" },
  removeBtn: { background: "none", border: "none", color: "#555", fontSize: 18, cursor: "pointer", transition: "opacity 0.2s", lineHeight: 1, padding: 0 },
  saveBtn: { width: "100%", border: "none", borderRadius: 14, padding: "16px", fontSize: 15, fontWeight: 800, color: "#0a0a0f", cursor: "pointer", fontFamily: "'Nunito', sans-serif", letterSpacing: "0.02em", transition: "all 0.2s" },
  detailHeader: { display: "flex", alignItems: "center", gap: 16, background: "#111118", border: "1px solid", borderRadius: 20, padding: "20px", marginBottom: 16 },
  detailName: { fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 900, color: "#f0f0fa" },
  detailDate: { fontSize: 13, marginTop: 3, fontWeight: 600 },
  doneCount: { fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 900 },
  calBanner: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#111118", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "14px 18px", marginBottom: 20 },
  calBannerTitle: { fontSize: 14, fontWeight: 700, color: "#e0e0f0" },
  calBannerSub: { fontSize: 12, color: "#555", marginTop: 2 },
  calBtn: { border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 800, color: "#0a0a0f", cursor: "pointer", fontFamily: "'Nunito', sans-serif", transition: "all 0.2s", whiteSpace: "nowrap" },
  checkList: { display: "flex", flexDirection: "column", gap: 4, marginBottom: 32 },
  checkRow: { display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", background: "#111118", borderRadius: 12, border: "1px solid rgba(255,255,255,0.04)" },
  checkBox: { width: 20, height: 20, borderRadius: 6, border: "2px solid", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" },
  checkText: { fontSize: 14, color: "#ccc", transition: "all 0.2s" },
  deleteBtn: { display: "block", width: "100%", background: "none", border: "1px solid rgba(255,100,100,0.15)", borderRadius: 14, padding: "13px", color: "#ff6b6b55", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s", textAlign: "center" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 0 20px", animation: "fadeIn 0.2s ease" },
  modal: { background: "#14141e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "24px 24px 20px", width: "100%", maxWidth: 480, margin: "0 20px", animation: "fadeUp 0.25s ease" },
  modalLogo: { display: "flex", justifyContent: "center", marginBottom: 16 },
  modalTitle: { fontFamily: "'Nunito', sans-serif", fontSize: 20, fontWeight: 900, color: "#f0f0fa", marginBottom: 6, textAlign: "center" },
  modalSub: { fontSize: 13, color: "#555", marginBottom: 20, lineHeight: 1.4, textAlign: "center" },
  calOpt: { display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "#1a1a28", borderRadius: 14, marginBottom: 10, textDecoration: "none", border: "1px solid rgba(255,255,255,0.06)", transition: "all 0.2s", cursor: "pointer" },
  calOptIcon: { width: 22, height: 22, flexShrink: 0 },
  calOptName: { fontSize: 14, fontWeight: 700, color: "#e0e0f0" },
  calOptSub: { fontSize: 11, color: "#555", marginTop: 2 },
  calOptArrow: { marginLeft: "auto", color: "#444", fontSize: 16 },
  modalCancel: { display: "block", width: "100%", marginTop: 8, background: "none", border: "none", color: "#444", fontSize: 14, cursor: "pointer", padding: "12px", borderRadius: 12, fontFamily: "'DM Sans', sans-serif", transition: "background 0.2s", textAlign: "center" },
};
