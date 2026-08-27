import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { ref, query, orderByChild, startAt, onChildAdded } from "firebase/database";
import { rtdb } from "../firebase";
import { notificationService } from "../services/notificationService";
import Icon from "../components/ui/Icon";

const NotifContext = createContext(null);

/* Type → color / icon */
const TYPE_META = {
  timing:  { color: "#047857", bg: "#ecfdf5", icon: "schedule"            },
  event:   { color: "#2563eb", bg: "#eff6ff", icon: "event"               },
  jummah:  { color: "#0d9488", bg: "#f0fdfa", icon: "mosque"              },
  general: { color: "#d97706", bg: "#fffbeb", icon: "campaign"            },
  finance: { color: "#7c3aed", bg: "#f5f3ff", icon: "volunteer_activism"  },
  custom:  { color: "#64748b", bg: "#f8fafc", icon: "notifications"       },
};

function NotifPopup({ notif, onClose }) {
  const meta       = TYPE_META[notif.type] || TYPE_META.custom;
  const [pct, setPct] = useState(100);
  const AUTO_MS    = 8000;

  /* progress bar countdown */
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / AUTO_MS) * 100);
      setPct(remaining);
      if (remaining === 0) { clearInterval(id); onClose(); }
    }, 80);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden pointer-events-auto border border-slate-100"
      style={{ animation: "slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}
    >
      {/* progress bar */}
      <div className="h-1 bg-slate-100">
        <div
          className="h-full transition-none"
          style={{ width: `${pct}%`, background: meta.color }}
        />
      </div>

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div
            className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: meta.bg }}
          >
            <Icon name={meta.icon} size={22} filled style={{ color: meta.color }} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 text-sm leading-snug">{notif.title}</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-3">
              {notif.body}
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Image */}
        {notif.imageUrl && (
          <img
            src={notif.imageUrl}
            alt="notification"
            className="mt-3 w-full h-36 object-cover rounded-2xl"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-[10px] text-slate-300 font-medium">
            {notif.sentByName || "Masjid Al-Putki"}
          </span>
          <span className="text-[10px] text-slate-300">
            {new Date(notif.sentAt).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}

export function NotifProvider({ children }) {
  const [queue, setQueue] = useState([]);
  const openTimeRef       = useRef(Date.now());

  /* Listen for new notifications added AFTER app was opened */
  useEffect(() => {
    const notifRef = query(
      ref(rtdb, "notifications"),
      orderByChild("sentAt"),
      startAt(openTimeRef.current)
    );

    const unsub = onChildAdded(notifRef, (snap) => {
      const notif = { id: snap.key, ...snap.val() };
      setQueue((prev) => [...prev, notif]);

      /* Trigger native system notification in device notification bar */
      notificationService.showInstantNotification({
        id: snap.key,
        title: notif.title,
        body: notif.body,
        imageUrl: notif.imageUrl,
      });
    });

    return () => unsub();
  }, []);

  const dismiss = (id) => setQueue((prev) => prev.filter((n) => n.id !== id));

  return (
    <NotifContext.Provider value={{ queue }}>
      {children}

      {/* ── Notification Stack ── */}
      {queue.length > 0 && (
        <div
          className="fixed z-[300] flex flex-col gap-2 pointer-events-none"
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 5rem)",
            left: 0,
            right: 0,
            padding: "0 12px",
            alignItems: "center",
          }}
        >
          {queue.slice(-3).map((notif) => (
            <NotifPopup
              key={notif.id}
              notif={notif}
              onClose={() => dismiss(notif.id)}
            />
          ))}
        </div>
      )}
    </NotifContext.Provider>
  );
}

export const useNotif = () => useContext(NotifContext);
