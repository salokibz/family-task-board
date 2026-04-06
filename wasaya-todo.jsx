import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY = "family-collab-todo-v5";
const GROUPS_KEY = "family-collab-groups-v5";

const USERS = ["Salim", "Sofia"];

const DEFAULT_GROUPS = ["Wasaya — Guest service manual", "Training PowerPoint", "Files needed", "General"];

const DEFAULT_TASKS = [
  { id: "t1", group: "Wasaya — Guest service manual", text: "Correct beginning of pages 1–12 on guest service manual (reference original annual)", done: false, priority: "high", completedAt: null, completedBy: null },
  { id: "t2", group: "Wasaya — Guest service manual", text: "Change font of the manual to match Calm Air manual style", done: false, priority: "high", completedAt: null, completedBy: null },
  { id: "t3", group: "Wasaya — Guest service manual", text: "Insert bulletins into boxes throughout the manual", done: false, priority: "medium", completedAt: null, completedBy: null },
  { id: "t4", group: "Training PowerPoint", text: "Create detailed 5-day training session PowerPoint in Wasaya brand colors", done: false, priority: "high", completedAt: null, completedBy: null },
  { id: "t5", group: "Training PowerPoint", text: "Add explanation slides with quiz/questions at the end of each day", done: false, priority: "medium", completedAt: null, completedBy: null },
  { id: "t6", group: "Files needed", text: "Upload guest service manual (current version)", done: false, priority: "high", completedAt: null, completedBy: null },
  { id: "t7", group: "Files needed", text: "Upload original annual for page 1–12 reference", done: false, priority: "high", completedAt: null, completedBy: null },
  { id: "t8", group: "Files needed", text: "Upload Calm Air manual for font/style reference", done: false, priority: "medium", completedAt: null, completedBy: null },
];

const PRIORITY_STYLES = {
  high: { bg: "#FDECEA", text: "#991B1B", label: "High" },
  medium: { bg: "#FEF3C7", text: "#92400E", label: "Med" },
  low: { bg: "#D1FAE5", text: "#065F46", label: "Low" },
};

const USER_COLORS = {
  Salim: { bg: "#EEF2FF", text: "#4338CA", dot: "#6366F1" },
  Sofia: { bg: "#FDF2F8", text: "#9D174D", dot: "#EC4899" },
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-CA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function UserBadge({ name, size }) {
  const c = USER_COLORS[name] || { bg: "#F3F4F6", text: "#374151", dot: "#9CA3AF" };
  const isXs = size === "xs";
  return (
    <span
      className="inline-flex items-center gap-1 font-medium rounded-full"
      style={{
        background: c.bg,
        color: c.text,
        padding: isXs ? "1px 6px" : "2px 8px",
        fontSize: isXs ? "10px" : "12px",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, display: "inline-block" }} />
      {name}
    </span>
  );
}

export default function FamilyTodo() {
  const [tasks, setTasks] = useState([]);
  const [groups, setGroups] = useState(DEFAULT_GROUPS);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState("");
  const [newGroup, setNewGroup] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [showAdd, setShowAdd] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [customGroupName, setCustomGroupName] = useState("");
  const [filterGroup, setFilterGroup] = useState("All");
  const [confirmingId, setConfirmingId] = useState(null);

  useEffect(() => {
    (async () => {
      let loadedTasks = DEFAULT_TASKS;
      let loadedGroups = DEFAULT_GROUPS;
      try {
        const r = await window.storage.get(STORAGE_KEY, true);
        if (r && r.value) loadedTasks = JSON.parse(r.value);
        else await window.storage.set(STORAGE_KEY, JSON.stringify(DEFAULT_TASKS), true);
      } catch {
        try { await window.storage.set(STORAGE_KEY, JSON.stringify(DEFAULT_TASKS), true); } catch {}
      }
      try {
        const g = await window.storage.get(GROUPS_KEY, true);
        if (g && g.value) loadedGroups = JSON.parse(g.value);
        else await window.storage.set(GROUPS_KEY, JSON.stringify(DEFAULT_GROUPS), true);
      } catch {
        try { await window.storage.set(GROUPS_KEY, JSON.stringify(DEFAULT_GROUPS), true); } catch {}
      }
      setTasks(loadedTasks);
      setGroups(loadedGroups);
      setNewGroup(loadedGroups[0] || "");
      setLoading(false);
    })();
  }, []);

  const save = useCallback(async (updated, updatedGroups) => {
    setTasks(updated);
    if (updatedGroups) setGroups(updatedGroups);
    try {
      await window.storage.set(STORAGE_KEY, JSON.stringify(updated), true);
      if (updatedGroups) await window.storage.set(GROUPS_KEY, JSON.stringify(updatedGroups), true);
      setLastSaved(new Date());
    } catch (e) { console.error("Save failed", e); }
  }, []);

  const startComplete = (id) => {
    setConfirmingId(id);
  };

  const confirmComplete = (id, user) => {
    save(tasks.map((t) =>
      t.id === id ? { ...t, done: true, completedAt: new Date().toISOString(), completedBy: user } : t
    ));
    setConfirmingId(null);
  };

  const undoComplete = (id) => {
    save(tasks.map((t) =>
      t.id === id ? { ...t, done: false, completedAt: null, completedBy: null } : t
    ));
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    const group = showNewGroup && customGroupName.trim() ? customGroupName.trim() : newGroup;
    let updatedGroups = null;
    if (showNewGroup && customGroupName.trim() && !groups.includes(customGroupName.trim())) {
      updatedGroups = [...groups, customGroupName.trim()];
    }
    const task = {
      id: "t" + Date.now(),
      group,
      text: newTask.trim(),
      done: false,
      priority: newPriority,
      completedAt: null,
      completedBy: null,
    };
    save([...tasks, task], updatedGroups || undefined);
    if (updatedGroups) {
      setNewGroup(customGroupName.trim());
      setCustomGroupName("");
      setShowNewGroup(false);
    }
    setNewTask("");
    setShowAdd(false);
  };

  const removeTask = (id) => { setConfirmingId(null); save(tasks.filter((t) => t.id !== id)); };

  const clearCompleted = () => {
    if (confirm("Remove all completed tasks permanently?")) save(tasks.filter((t) => !t.done));
  };

  const resetAll = () => {
    if (confirm("Reset everything to defaults?")) {
      setGroups(DEFAULT_GROUPS);
      setFilterGroup("All");
      setConfirmingId(null);
      save(DEFAULT_TASKS, DEFAULT_GROUPS);
    }
  };

  const pending = tasks.filter((t) => !t.done && (filterGroup === "All" || t.group === filterGroup));
  const completed = tasks.filter((t) => t.done && (filterGroup === "All" || t.group === filterGroup)).sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0));
  const total = tasks.length;
  const doneCount = tasks.filter((t) => t.done).length;
  const progress = total ? Math.round((doneCount / total) * 100) : 0;

  const pendingByGroup = {};
  pending.forEach((t) => {
    if (!pendingByGroup[t.group]) pendingByGroup[t.group] = [];
    pendingByGroup[t.group].push(t);
  });

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#F9FAFB" }}>
        <p style={{ color: "#9CA3AF", fontSize: 16 }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F9FAFB", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: "linear-gradient(135deg, #6366F1, #EC4899)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 }}>Family task board</h1>
              <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>Salim & Sofia — shared collaboration</p>
            </div>
          </div>
          {/* Progress */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
              <span style={{ color: "#4B5563", fontWeight: 500 }}>{doneCount} of {total} complete</span>
              <span style={{ fontWeight: 700, color: "#6366F1" }}>{progress}%</span>
            </div>
            <div style={{ height: 10, borderRadius: 5, background: "#E5E7EB", overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 5, width: `${progress}%`, background: "linear-gradient(90deg, #6366F1, #EC4899)", transition: "width 0.5s" }} />
            </div>
          </div>
          {/* Filters */}
          <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["All", ...groups].map((g) => {
              const active = filterGroup === g;
              return (
                <button key={g} onClick={() => setFilterGroup(g)} style={{ fontSize: 12, fontWeight: 500, padding: "6px 12px", borderRadius: 99, border: `1px solid ${active ? "#6366F1" : "#E5E7EB"}`, background: active ? "#6366F1" : "transparent", color: active ? "#fff" : "#6B7280", cursor: "pointer" }}>
                  {g}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px" }}>

        {/* ── PENDING ── */}
        {Object.entries(pendingByGroup).map(([group, groupTasks]) => (
          <div key={group} style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px" }}>{group}</span>
              <span style={{ fontSize: 11, color: "#9CA3AF" }}>{groupTasks.length} pending</span>
            </div>
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", overflow: "hidden" }}>
              {groupTasks.map((task, i) => {
                const p = PRIORITY_STYLES[task.priority];
                const isConfirming = confirmingId === task.id;
                return (
                  <div key={task.id} style={{ borderTop: i > 0 ? "1px solid #F3F4F6" : "none" }}>
                    <div
                      style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", cursor: "pointer", transition: "background 0.15s" }}
                      onClick={() => !isConfirming && startComplete(task.id)}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#F9FAFB"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <div style={{ marginTop: 2, width: 20, height: 20, borderRadius: "50%", border: "2px solid #D1D5DB", flexShrink: 0 }} />
                      <p style={{ flex: 1, fontSize: 14, lineHeight: 1.4, color: "#1F2937", margin: 0 }}>{task.text}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 99, background: p.bg, color: p.text }}>{p.label}</span>
                        <button onClick={(e) => { e.stopPropagation(); removeTask(task.id); }} style={{ color: "#D1D5DB", background: "none", border: "none", cursor: "pointer", padding: 2 }} title="Remove">
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </div>
                    {/* Completed by picker */}
                    {isConfirming && (
                      <div style={{ padding: "0 16px 12px 48px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, color: "#9CA3AF" }}>Completed by:</span>
                        {USERS.map((user) => {
                          const c = USER_COLORS[user];
                          return (
                            <button
                              key={user}
                              onClick={(e) => { e.stopPropagation(); confirmComplete(task.id, user); }}
                              style={{
                                display: "flex", alignItems: "center", gap: 6,
                                padding: "6px 14px", borderRadius: 99,
                                border: `1.5px solid ${c.dot}`,
                                background: c.bg, color: c.text,
                                fontSize: 13, fontWeight: 600,
                                cursor: "pointer", transition: "transform 0.1s",
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                            >
                              <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.dot }} />
                              {user}
                            </button>
                          );
                        })}
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmingId(null); }}
                          style={{ fontSize: 12, color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {pending.length === 0 && !showAdd && (
          <div style={{ textAlign: "center", padding: "40px 0", marginBottom: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>&#127881;</div>
            <p style={{ color: "#4B5563", fontWeight: 500, margin: 0 }}>{filterGroup === "All" ? "All tasks complete!" : "No pending tasks here"}</p>
          </div>
        )}

        {/* Add task */}
        {showAdd ? (
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: 16, marginBottom: 24 }}>
            <input
              type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="What needs to be done?"
              style={{ width: "100%", fontSize: 14, border: "1px solid #E5E7EB", borderRadius: 8, padding: "10px 12px", marginBottom: 12, outline: "none", boxSizing: "border-box" }}
              autoFocus
            />
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {!showNewGroup ? (
                <select value={newGroup} onChange={(e) => { if (e.target.value === "__new__") setShowNewGroup(true); else setNewGroup(e.target.value); }} style={{ flex: 1, fontSize: 14, border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 12px", background: "#fff" }}>
                  {groups.map((g) => <option key={g} value={g}>{g}</option>)}
                  <option value="__new__">+ New category...</option>
                </select>
              ) : (
                <input type="text" value={customGroupName} onChange={(e) => setCustomGroupName(e.target.value)} placeholder="New category name" style={{ flex: 1, fontSize: 14, border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 12px", outline: "none" }} autoFocus />
              )}
              <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)} style={{ fontSize: 14, border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 12px", background: "#fff" }}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={addTask} style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "#fff", borderRadius: 8, padding: "10px 0", border: "none", cursor: "pointer", background: "#6366F1" }}>Add task</button>
              <button onClick={() => { setShowAdd(false); setNewTask(""); setShowNewGroup(false); setCustomGroupName(""); }} style={{ padding: "10px 16px", fontSize: 14, color: "#6B7280", borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => { setShowAdd(true); setNewGroup(groups[0] || "General"); }} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14, fontWeight: 500, padding: "12px 0", borderRadius: 12, border: "2px dashed #D1D5DB", color: "#6B7280", background: "transparent", cursor: "pointer", marginBottom: 24 }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
            Add a task
          </button>
        )}

        {/* ── COMPLETED ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px" }}>Completed</span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 99, background: "#D1FAE5", color: "#065F46" }}>{completed.length}</span>
              {completed.length > 0 && (
                <button onClick={clearCompleted} style={{ fontSize: 11, color: "#9CA3AF", background: "none", border: "none", cursor: "pointer" }}>Clear all</button>
              )}
            </div>
          </div>

          {completed.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: "24px 16px", textAlign: "center" }}>
              <p style={{ fontSize: 14, color: "#9CA3AF", margin: 0 }}>No completed tasks yet. Tap a task above to mark it done.</p>
            </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", overflow: "hidden" }}>
              {completed.map((task, i) => (
                <div key={task.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", borderTop: i > 0 ? "1px solid #F3F4F6" : "none" }}>
                  <div style={{ marginTop: 2, width: 20, height: 20, borderRadius: "50%", background: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, lineHeight: 1.4, color: "#9CA3AF", textDecoration: "line-through", margin: 0 }}>{task.text}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, color: "#D1D5DB" }}>{task.group}</span>
                      <span style={{ fontSize: 11, color: "#D1D5DB" }}>&middot;</span>
                      <span style={{ fontSize: 11, color: "#D1D5DB" }}>{formatDate(task.completedAt)}</span>
                      <span style={{ fontSize: 11, color: "#D1D5DB" }}>&middot;</span>
                      <span style={{ fontSize: 11, color: "#9CA3AF" }}>by</span>
                      <UserBadge name={task.completedBy} size="xs" />
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => undoComplete(task.id)} style={{ fontSize: 12, color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 6 }}>Undo</button>
                    <button onClick={() => removeTask(task.id)} style={{ color: "#D1D5DB", background: "none", border: "none", cursor: "pointer", padding: 2 }} title="Remove">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9CA3AF", paddingTop: 12, borderTop: "1px solid #F3F4F6" }}>
          <span>{lastSaved ? "Saved " + lastSaved.toLocaleTimeString() : "Shared — changes sync for all viewers"}</span>
          <button onClick={resetAll} style={{ color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", fontSize: 11 }}>Reset to defaults</button>
        </div>
      </div>
    </div>
  );
}
