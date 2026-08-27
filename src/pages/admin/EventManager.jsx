import React, { useEffect, useState } from "react";
import { ref, onValue, push, remove, update } from "firebase/database";
import { rtdb } from "../../firebase";
import { format } from "date-fns";
import { Plus, Trash2, Pencil, X, Save, CalendarDays, CheckCircle, Clock } from "lucide-react";
import { useConfirm } from "../../contexts/ConfirmContext";
import DatePicker from "../../components/ui/DatePicker";
import TimePicker from "../../components/ui/TimePicker";
import Icon from "../../components/ui/Icon";
import PreviewRows from "../../components/ui/PreviewRows";

const EMPTY_FORM = {
  title: "",
  date: "",
  time: "",
  description: "",
  imageUrl: "",
};

export default function EventManager() {
  const { confirm } = useConfirm();
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [errMsg, setErrMsg] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const fmtDate = (v) =>
    /^\d{4}-\d{2}-\d{2}$/.test(v || "")
      ? format(new Date(`${v}T00:00:00`), "EEE, MMM d, yyyy")
      : "Select date";

  useEffect(() => {
    const unsub = onValue(ref(rtdb, "events"), (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data)
          .map(([id, v]) => ({ id, ...v }))
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        setEvents(list);
      } else {
        setEvents([]);
      }
    });
    return unsub;
  }, []);

  const handleChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date) {
      setErrMsg("Please fill in event title and date.");
      return;
    }
    setErrMsg("");
    const ok = await confirm({
      title: editId ? "Update this event?" : "Add this event?",
      body: editId
        ? "The event details will be updated on the community page."
        : "The event will be published on the community page.",
      confirmText: editId ? "Update" : "Add",
      icon: "event",
      preview: (
        <PreviewRows
          rows={[
            { label: "Title", value: form.title.trim() },
            { label: "Date", value: fmtDate(form.date) },
            { label: "Time", value: form.time || "—" },
            { label: "Description", value: form.description.trim() || "—" },
            { label: "Image", value: form.imageUrl.trim() ? "Attached" : "None" },
          ]}
        />
      ),
    });
    if (!ok) return;
    setSaving(true);
    try {
      const payload = { ...form, updatedAt: Date.now() };
      if (editId) {
        await update(ref(rtdb, `events/${editId}`), payload);
      } else {
        await push(ref(rtdb, "events"), { ...payload, createdAt: Date.now() });
      }
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setShowForm(false);
        setForm(EMPTY_FORM);
        setEditId(null);
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (ev) => {
    setForm({
      title: ev.title || "",
      date: ev.date || "",
      time: ev.time || "",
      description: ev.description || "",
      imageUrl: ev.imageUrl || "",
    });
    setEditId(ev.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: "Delete event?",
      body: "This removes the event from the community page.",
      confirmText: "Delete",
      danger: true,
      icon: "delete",
    });
    if (!ok) return;
    setDeleting(id);
    try {
      await remove(ref(rtdb, `events/${id}`));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Event Manager</h1>
          <p className="text-sm text-slate-400 mt-0.5">Add and manage community events.</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setForm(EMPTY_FORM); setEditId(null); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-root fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">{editId ? "Edit Event" : "New Event"}</h2>
              <button
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setEditId(null); setErrMsg(""); }}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Event Title *</label>
                <input
                  required
                  className="input-field"
                  placeholder="e.g. Eid Al-Fitr Celebration"
                  value={form.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Date *</label>
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(true)}
                    className={`input-field flex items-center justify-between gap-2 ${form.date ? "" : "text-slate-400"}`}
                  >
                    <span className="truncate">{fmtDate(form.date)}</span>
                    <Icon name="calendar_month" size={18} filled style={{ color: "#047857", flexShrink: 0 }} />
                  </button>
                </div>
                <div>
                  <label className="label">Time</label>
                  <button
                    type="button"
                    onClick={() => setShowTimePicker(true)}
                    className={`input-field flex items-center justify-between gap-2 ${form.time ? "" : "text-slate-400"}`}
                  >
                    <span className="truncate">{form.time || "Select time"}</span>
                    <Icon name="schedule" size={18} filled style={{ color: "#047857", flexShrink: 0 }} />
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Event details…"
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Image URL (optional)</label>
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://…"
                  value={form.imageUrl}
                  onChange={(e) => handleChange("imageUrl", e.target.value)}
                />
              </div>

              {errMsg && (
                <p className="text-xs font-semibold text-red-500 bg-red-50 rounded-xl px-3 py-2">
                  {errMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2
                  ${saved ? "bg-emerald-100 text-emerald-800" : "btn-primary"}`}
              >
                {saved ? (
                  <><CheckCircle className="w-5 h-5" /> Saved!</>
                ) : (
                  <><Save className="w-5 h-5" /> {saving ? "Saving…" : editId ? "Update Event" : "Add Event"}</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {showDatePicker && (
        <DatePicker
          title="Select event date"
          value={form.date}
          onCancel={() => setShowDatePicker(false)}
          onConfirm={(d) => { setForm((f) => ({ ...f, date: d })); setShowDatePicker(false); }}
        />
      )}

      {showTimePicker && (
        <TimePicker
          title="Select event time"
          subtitle="Choose the time of the event"
          value={form.time || "07:00 PM"}
          onCancel={() => setShowTimePicker(false)}
          onConfirm={(t) => { setForm((f) => ({ ...f, time: t })); setShowTimePicker(false); }}
        />
      )}

      {/* Events List */}
      {events.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No events yet. Add your first event!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => (
            <div key={ev.id} className="card flex items-start gap-4">
              <div className="flex-shrink-0 bg-emerald-50 rounded-xl px-3 py-2 text-center min-w-[52px]">
                <p className="text-[10px] font-bold text-emerald-600 uppercase">
                  {ev.date ? format(new Date(ev.date), "MMM") : "—"}
                </p>
                <p className="text-xl font-extrabold text-emerald-800 leading-tight">
                  {ev.date ? format(new Date(ev.date), "dd") : "—"}
                </p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 text-sm">{ev.title}</p>
                {ev.time && (
                  <p className="text-xs text-emerald-600 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {ev.time}
                  </p>
                )}
                {ev.description && (
                  <p className="text-xs text-slate-500 mt-1 whitespace-normal break-words">{ev.description}</p>
                )}
              </div>
              <div className="flex-shrink-0 flex gap-2">
                <button
                  onClick={() => handleEdit(ev)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(ev.id)}
                  disabled={deleting === ev.id}
                  className="p-2 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
