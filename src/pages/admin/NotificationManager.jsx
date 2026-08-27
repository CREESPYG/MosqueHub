import React, { useEffect, useRef, useState } from "react";
import { ref, push, onValue, remove } from "firebase/database";
import { rtdb } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";
import { useConfirm } from "../../contexts/ConfirmContext";
import PreviewRows from "../../components/ui/PreviewRows";
import { format } from "date-fns";
import Icon from "../../components/ui/Icon";

/* ── Presets ────────────────────────────────────────── */
const PRESETS = [
  {
    id: "timing",
    icon: "schedule",
    label: "Prayer Timing Update",
    color: "#047857",
    bg: "#ecfdf5",
    type: "timing",
    title: "Prayer Timing Update",
    body: "Prayer timings have been updated. Please check the Schedule page for the latest Azan & Iqamah times.",
    imageUrl: "",
  },
  {
    id: "jummah",
    icon: "mosque",
    label: "Jummah Reminder",
    color: "#0d9488",
    bg: "#f0fdfa",
    type: "jummah",
    title: "Jummah Khutbah Reminder",
    body: "Brothers are reminded to arrive at Masjid Al-Putki by 12:45 PM for Jummah prayers. Khutbah begins at 1:00 PM sharp.",
    imageUrl: "",
  },
  {
    id: "event",
    icon: "event",
    label: "Event Reminder",
    color: "#2563eb",
    bg: "#eff6ff",
    type: "event",
    title: "Upcoming Community Event",
    body: "Don't miss our upcoming event at Masjid Al-Putki. All community members and their families are warmly invited.",
    imageUrl: "",
  },
  {
    id: "general",
    icon: "campaign",
    label: "General Announcement",
    color: "#d97706",
    bg: "#fffbeb",
    type: "general",
    title: "Notice from Mosque Committee",
    body: "An important announcement from the Masjid Al-Putki administration. Please read carefully.",
    imageUrl: "",
  },
  {
    id: "finance",
    icon: "volunteer_activism",
    label: "Donation Drive",
    color: "#7c3aed",
    bg: "#f5f3ff",
    type: "finance",
    title: "Support Masjid Al-Putki",
    body: "Your generous donations help us maintain and improve Masjid Al-Putki. Zakat, Sadaqah, and Fitra are accepted. May Allah reward you.",
    imageUrl: "",
  },
  {
    id: "custom",
    icon: "edit_note",
    label: "Custom Message",
    color: "#64748b",
    bg: "#f8fafc",
    type: "custom",
    title: "",
    body: "",
    imageUrl: "",
  },
];

const TYPE_META = {
  timing:  { color: "#047857", bg: "#ecfdf5" },
  event:   { color: "#2563eb", bg: "#eff6ff" },
  jummah:  { color: "#0d9488", bg: "#f0fdfa" },
  general: { color: "#d97706", bg: "#fffbeb" },
  finance: { color: "#7c3aed", bg: "#f5f3ff" },
  custom:  { color: "#64748b", bg: "#f8fafc" },
};

/* ── Notification Preview Card ──────────────────── */
function NotifPreviewCard({ title, body, imageUrl, type, sentByName }) {
  const meta = TYPE_META[type] || TYPE_META.custom;
  const preset = PRESETS.find((p) => p.id === type) || PRESETS[5];
  return (
    <div
      className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden mx-auto border border-slate-100"
      style={{ animation: "scaleIn 0.25s ease-out" }}
    >
      {/* Progress bar mockup */}
      <div className="h-1.5 w-full" style={{ background: meta.color }} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: meta.bg }}
          >
            <Icon name={preset.icon} size={22} filled style={{ color: meta.color }} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 text-sm leading-snug">
              {title || <span className="text-slate-300 italic">Title appears here…</span>}
            </p>
            <p className="text-xs text-slate-500 mt-1 line-clamp-3">
              {body || <span className="text-slate-300 italic">Message body appears here…</span>}
            </p>
          </div>

          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
            <Icon name="close" size={16} style={{ color: "#94a3b8" }} />
          </div>
        </div>

        {imageUrl && (
          <img
            src={imageUrl}
            alt="preview"
            className="mt-3 w-full h-36 object-cover rounded-2xl"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        )}

        <div className="flex items-center justify-between mt-3">
          <span className="text-[10px] text-slate-300 font-medium">
            {sentByName || "Masjid Al-Putki"} · Now
          </span>
          <div className="flex items-center gap-1">
            {[...Array(3)].map((_, i) => (
              <span
                key={i}
                className="block rounded-full"
                style={{
                  width: i === 2 ? 16 : 6,
                  height: 6,
                  background: i === 2 ? meta.color : "#e2e8f0",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────── */
export default function NotificationManager() {
  const { currentUser } = useAuth();
  const { confirm }     = useConfirm();

  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);
  const [title,    setTitle]    = useState(PRESETS[0].title);
  const [body,     setBody]     = useState(PRESETS[0].body);
  const [imageUrl, setImageUrl] = useState("");
  const [imgValid, setImgValid] = useState(false);
  const [sending,  setSending]  = useState(false);
  const [history,  setHistory]  = useState([]);
  const [toast,    setToast]    = useState(null);

  /* Load sent notification history */
  useEffect(() => {
    const unsub = onValue(ref(rtdb, "notifications"), (snap) => {
      if (snap.exists()) {
        const list = Object.entries(snap.val())
          .map(([id, v]) => ({ id, ...v }))
          .sort((a, b) => (b.sentAt || 0) - (a.sentAt || 0));
        setHistory(list.slice(0, 20));
      } else {
        setHistory([]);
      }
    });
    return unsub;
  }, []);

  /* Validate image URL with an Image object */
  useEffect(() => {
    setImgValid(false);
    if (!imageUrl.trim()) return;
    const img = new Image();
    img.onload  = () => setImgValid(true);
    img.onerror = () => setImgValid(false);
    img.src     = imageUrl;
  }, [imageUrl]);

  const pickPreset = (preset) => {
    setSelectedPreset(preset);
    setTitle(preset.title);
    setBody(preset.body);
    setImageUrl(preset.imageUrl || "");
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const sendNotification = async () => {
    if (!title.trim() || !body.trim()) {
      showToast("Please fill in title and message.", "error");
      return;
    }
    const meta = metaForType(selectedPreset.id);
    const ok = await confirm({
      title: "Send this notice?",
      body: "The alert will be delivered to all users immediately.",
      confirmText: "Send",
      icon: "send",
      preview: (
        <div className="space-y-2">
          <div
            className="rounded-xl p-2.5"
            style={{ background: `${meta.color}14`, border: `1px solid ${meta.color}33` }}
          >
            <p className="text-xs font-bold" style={{ color: meta.color }}>{title.trim()}</p>
            <p className="text-[11px] text-slate-600 mt-0.5">{body.trim()}</p>
          </div>
          <PreviewRows
            rows={[
              { label: "Category", value: meta.label },
              { label: "Image", value: imgValid ? "Attached" : "None" },
              { label: "Sent by", value: currentUser?.displayName || "Masjid Admin" },
            ]}
          />
        </div>
      ),
    });
    if (!ok) return;
    setSending(true);
    try {
      await push(ref(rtdb, "notifications"), {
        title:       title.trim(),
        body:        body.trim(),
        imageUrl:    imgValid ? imageUrl.trim() : "",
        type:        selectedPreset.id,
        sentAt:      Date.now(),
        sentBy:      currentUser?.uid || "admin",
        sentByName:  currentUser?.displayName || "Masjid Admin",
      });
      showToast("Notification sent to all users!");
      // Reset to blank custom after sending
      setTitle("");
      setBody("");
      setImageUrl("");
    } catch (err) {
      showToast(`Failed: ${err.message}`, "error");
    } finally {
      setSending(false);
    }
  };

  const deleteNotif = async (id) => {
    const ok = await confirm({
      title: "Delete notification?",
      body: "This removes the notification from every user's history.",
      confirmText: "Delete",
      danger: true,
      icon: "delete",
    });
    if (!ok) return;
    try {
      await remove(ref(rtdb, `notifications/${id}`));
      showToast("Notification deleted.");
    } catch (_) {}
  };

  const metaForType = (type) => TYPE_META[type] || TYPE_META.custom;
  const presetForType = (type) => PRESETS.find((p) => p.id === type) || PRESETS[5];

  return (
    <div className="space-y-6 animate-slide-up">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Notification Sender</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Push real-time alerts to all app users instantly.
          </p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center">
          <Icon name="send" size={22} filled style={{ color: "#047857" }} />
        </div>
      </div>

      {/* ── Preset Cards ── */}
      <div>
        <p className="label mb-3">Quick Presets</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {PRESETS.map((preset) => {
            const active = selectedPreset.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => pickPreset(preset)}
                className="flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all active:scale-95"
                style={{
                  background:    active ? preset.bg     : "white",
                  borderColor:   active ? preset.color  : "#e2e8f0",
                  borderWidth:   active ? 2             : 1,
                  boxShadow:     active ? `0 0 0 1px ${preset.color}22` : "none",
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: active ? preset.color : "#f1f5f9" }}
                >
                  <Icon
                    name={preset.icon}
                    size={18}
                    filled={active}
                    style={{ color: active ? "white" : "#64748b" }}
                  />
                </div>
                <span
                  className="text-xs font-semibold leading-tight"
                  style={{ color: active ? preset.color : "#475569" }}
                >
                  {preset.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Form + Preview side by side ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Form */}
        <div className="card space-y-4">
          <p className="section-title text-base">
            <Icon name="edit_note" size={20} filled style={{ color: "#047857" }} />
            Compose Notification
          </p>

          <div>
            <label className="label">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g. Prayer Timing Update"
              maxLength={80}
              className="input-field"
            />
            <p className="text-[10px] text-slate-300 mt-1 text-right">{title.length}/80</p>
          </div>

          <div>
            <label className="label">Message *</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message here… it will be fully visible to users."
              rows={5}
              maxLength={500}
              className="input-field resize-none"
            />
            <p className="text-[10px] text-slate-300 mt-1 text-right">{body.length}/500</p>
          </div>

          <div>
            <label className="label">Image URL (optional)</label>
            <div className="relative">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="input-field pr-10"
              />
              {imageUrl && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Icon
                    name={imgValid ? "check_circle" : "error"}
                    size={18}
                    filled
                    style={{ color: imgValid ? "#10b981" : "#f59e0b" }}
                  />
                </div>
              )}
            </div>

            {/* Image Preview */}
            {imgValid && imageUrl && (
              <div className="mt-2 relative">
                <img
                  src={imageUrl}
                  alt="preview"
                  className="w-full h-36 object-cover rounded-2xl border border-slate-200"
                />
                <span className="absolute top-2 left-2 bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  ✓ Preview
                </span>
                <button
                  onClick={() => setImageUrl("")}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow"
                >
                  <Icon name="close" size={14} />
                </button>
              </div>
            )}
            {imageUrl && !imgValid && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <Icon name="warning" size={14} filled style={{ color: "#f59e0b" }} />
                Image not loading — check the URL
              </p>
            )}
          </div>

          {/* Send Button */}
          <button
            onClick={sendNotification}
            disabled={sending || !title.trim() || !body.trim()}
            className="w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2.5 transition-all active:scale-97"
            style={{
              background: sending || !title.trim() || !body.trim() ? "#9ca3af" : "#047857",
              cursor: sending || !title.trim() || !body.trim() ? "not-allowed" : "pointer",
            }}
          >
            {sending ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Icon name="send" size={20} filled style={{ color: "white" }} />
                Send Notification Now
              </>
            )}
          </button>

          <p className="text-xs text-slate-400 text-center">
            This will instantly appear on all users' screens who have the app open.
          </p>
        </div>

        {/* Preview Card */}
        <div className="space-y-4">
          <p className="label">Live Preview</p>
          <div className="sticky top-4">
            <NotifPreviewCard
              title={title}
              body={body}
              imageUrl={imgValid ? imageUrl : ""}
              type={selectedPreset.id}
              sentByName={currentUser?.displayName}
            />
            <p className="text-center text-[11px] text-slate-300 mt-3">
              This is exactly how it will appear on users' devices
            </p>
          </div>
        </div>
      </div>

      {/* ── Notification History ── */}
      {history.length > 0 && (
        <div>
          <p className="label mb-3">Sent History (last 20)</p>
          <div className="space-y-2.5">
            {history.map((n) => {
              const meta   = metaForType(n.type);
              const preset = presetForType(n.type);
              return (
                <div
                  key={n.id}
                  className="card flex items-start gap-3"
                  style={{ borderLeft: `4px solid ${meta.color}` }}
                >
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: meta.bg }}
                  >
                    <Icon name={preset.icon} size={20} filled style={{ color: meta.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-800 leading-snug">{n.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                    {n.imageUrl && (
                      <div className="flex items-center gap-1 mt-1">
                        <Icon name="image" size={12} style={{ color: "#94a3b8" }} />
                        <span className="text-[10px] text-slate-300 truncate">{n.imageUrl}</span>
                      </div>
                    )}
                    <p className="text-[10px] text-slate-300 mt-1">
                      {n.sentAt ? format(new Date(n.sentAt), "dd MMM yyyy · hh:mm aa") : ""}
                      {n.sentByName ? ` · by ${n.sentByName}` : ""}
                    </p>
                  </div>

                  <button
                    onClick={() => deleteNotif(n.id)}
                    className="flex-shrink-0 p-2 rounded-xl hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Icon name="delete" size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[400] px-5 py-3 rounded-2xl
            shadow-xl text-sm font-semibold text-white animate-slide-up whitespace-nowrap"
          style={{ background: toast.type === "error" ? "#ef4444" : "#047857" }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
