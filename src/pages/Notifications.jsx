import React, { useEffect, useState } from "react";
import { ref, onValue, set, get } from "firebase/database";
import { rtdb } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { notificationService } from "../services/notificationService";
import { format } from "date-fns";
import Icon from "../components/ui/Icon";
import { Bell, ShieldCheck, BatteryCharging, Clock, Volume2, Sparkles } from "lucide-react";

const TYPE_META = {
  timing:  { color: "#047857", bg: "#ecfdf5", icon: "schedule",             label: "Prayer Timing"   },
  event:   { color: "#2563eb", bg: "#eff6ff", icon: "event",                label: "Event"           },
  jummah:  { color: "#0d9488", bg: "#f0fdfa", icon: "mosque",               label: "Jummah"          },
  general: { color: "#d97706", bg: "#fffbeb", icon: "campaign",             label: "Announcement"    },
  finance: { color: "#7c3aed", bg: "#f5f3ff", icon: "volunteer_activism",   label: "Finance"         },
  custom:  { color: "#64748b", bg: "#f8fafc", icon: "notifications",        label: "Notification"    },
};

export default function Notifications() {
  const { currentUser } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [permState, setPermState] = useState("default");
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testSent, setTestSent] = useState(false);
  const [timingsData, setTimingsData] = useState(null);

  // Local/Hardware prayer notification preferences
  const [prayerPrefs, setPrayerPrefs] = useState(() => notificationService.getPreferences());

  // Cloud notification subscriptions
  const [cloudPrefs, setCloudPrefs] = useState({
    timing: true,
    event: true,
    jummah: true,
    general: true,
    finance: true,
  });

  // Check initial permission
  useEffect(() => {
    notificationService.checkPermissionStatus().then((status) => {
      setPermState(status);
    });
  }, []);

  // Load timings for re-scheduling if preferences change
  useEffect(() => {
    const unsub = onValue(ref(rtdb, "timings/azans"), (snap) => {
      if (snap.exists()) setTimingsData(snap.val());
    });
    return unsub;
  }, []);

  // Load all notifications from RTDB
  useEffect(() => {
    const unsub = onValue(
      ref(rtdb, "notifications"),
      (snap) => {
        if (snap.exists()) {
          const list = Object.entries(snap.val())
            .map(([id, v]) => ({ id, ...v }))
            .sort((a, b) => (b.sentAt || 0) - (a.sentAt || 0));
          setNotifs(list);
        } else {
          setNotifs([]);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load notifications:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  // Load user cloud notification prefs
  useEffect(() => {
    if (!currentUser) return;
    get(ref(rtdb, `users/${currentUser.uid}/notifPrefs`)).then((snap) => {
      if (snap.exists()) setCloudPrefs((prev) => ({ ...prev, ...snap.val() }));
    });
  }, [currentUser]);

  const togglePrayerPref = (key) => {
    const updated = { ...prayerPrefs, [key]: !prayerPrefs[key] };
    setPrayerPrefs(updated);
    notificationService.savePreferences(updated);
    if (timingsData) {
      notificationService.schedulePrayerAlarms(timingsData, updated);
    }
  };

  const saveCloudPref = async (key, value) => {
    const updated = { ...cloudPrefs, [key]: value };
    setCloudPrefs(updated);
    if (currentUser) {
      await set(ref(rtdb, `users/${currentUser.uid}/notifPrefs`), updated);
    }
  };

  const requestPermission = async () => {
    const granted = await notificationService.requestPermissions();
    setPermState(granted ? "granted" : "denied");
    if (granted && timingsData) {
      notificationService.schedulePrayerAlarms(timingsData, prayerPrefs);
    }
  };

  const handleSendTestNotification = async () => {
    setTestSent(true);
    await notificationService.showInstantNotification({
      title: "🕌 Test Notification from Mosque Hub",
      body: "Exact-time prayer alarms & mosque updates are active on your device.",
    });
    setTimeout(() => setTestSent(false), 3500);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-slide-up">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm">
            <Icon name="notifications" size={24} filled style={{ color: "#047857" }} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800">Notifications & Alerts</h1>
            <p className="text-xs text-slate-400">Accurate Azan, Iqamah & background alarm settings</p>
          </div>
        </div>

        {/* Test Notification Button */}
        <button
          onClick={handleSendTestNotification}
          disabled={testSent}
          className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 font-bold cursor-pointer"
          title="Trigger a test notification"
        >
          <Icon name={testSent ? "check_circle" : "send"} size={16} filled={testSent} style={{ color: testSent ? "#047857" : undefined }} />
          {testSent ? "Alert Sent!" : "Test Sound"}
        </button>
      </div>

      {/* ── Device Notification Permission Card ── */}
      <div
        className="card overflow-hidden transition-all"
        style={{ border: permState === "granted" ? "1px solid #6ee7b7" : "1px solid #e2e8f0" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: permState === "granted" ? "#ecfdf5" : "#f8fafc" }}
          >
            <Icon
              name={permState === "granted" ? "notifications_active" : "notifications_off"}
              size={22}
              filled
              style={{ color: permState === "granted" ? "#047857" : "#94a3b8" }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-slate-800 flex items-center gap-2">
              {permState === "granted"
                ? "Background Alarms Active"
                : permState === "denied"
                ? "Notifications Blocked"
                : "Enable Accurate Notifications"}
              {permState === "granted" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Exact Timing
                </span>
              )}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {permState === "granted"
                ? "Your device is scheduled to trigger high-priority exact alarms for Azan and Iqamah."
                : permState === "denied"
                ? "Notifications are blocked. Please allow permissions in Android / Browser Settings."
                : "Allow notifications to receive exact-time Azan alarms and mosque announcements."}
            </p>
          </div>
          {permState !== "granted" && (
            <button onClick={requestPermission} className="btn-primary text-xs py-2 px-3 flex-shrink-0">
              Allow
            </button>
          )}
          {permState === "granted" && (
            <Icon name="check_circle" size={22} filled style={{ color: "#10b981", flexShrink: 0 }} />
          )}
        </div>
      </div>

      {/* ── Accurate Timing & Prayer Alarms Controls ── */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
          <Clock className="w-4 h-4 text-emerald-600" />
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Prayer Alarms & Exact Timing Controls
          </h2>
        </div>

        {/* Exact Azan */}
        <div className="flex items-center justify-between py-2 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
              🕌
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Exact Azan Time Notification</p>
              <p className="text-xs text-slate-400">Triggers an alarm right as the Azan begins</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => togglePrayerPref("azanExact")}
            className="relative flex-shrink-0 cursor-pointer"
            style={{ width: 44, height: 24 }}
          >
            <div
              className="absolute inset-0 rounded-full transition-colors duration-200"
              style={{ background: prayerPrefs.azanExact ? "#047857" : "#e2e8f0" }}
            />
            <div
              className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
              style={{ left: prayerPrefs.azanExact ? 24 : 4 }}
            />
          </button>
        </div>

        {/* Exact Iqamah */}
        <div className="flex items-center justify-between py-2 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
              👥
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Exact Iqamah Start Notification</p>
              <p className="text-xs text-slate-400">Triggers when congregational prayer starts</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => togglePrayerPref("iqamahExact")}
            className="relative flex-shrink-0 cursor-pointer"
            style={{ width: 44, height: 24 }}
          >
            <div
              className="absolute inset-0 rounded-full transition-colors duration-200"
              style={{ background: prayerPrefs.iqamahExact ? "#047857" : "#e2e8f0" }}
            />
            <div
              className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
              style={{ left: prayerPrefs.iqamahExact ? 24 : 4 }}
            />
          </button>
        </div>

        {/* 5-Min Pre-Alert */}
        <div className="flex items-center justify-between py-2 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
              ⏳
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">5-Minute Pre-Prayer Alert</p>
              <p className="text-xs text-slate-400">Reminds you to prepare wudu before prayer</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => togglePrayerPref("prePrayer5Min")}
            className="relative flex-shrink-0 cursor-pointer"
            style={{ width: 44, height: 24 }}
          >
            <div
              className="absolute inset-0 rounded-full transition-colors duration-200"
              style={{ background: prayerPrefs.prePrayer5Min ? "#047857" : "#e2e8f0" }}
            />
            <div
              className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
              style={{ left: prayerPrefs.prePrayer5Min ? 24 : 4 }}
            />
          </button>
        </div>

        {/* Friday-Only Jummah Notification */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
              ✨
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Friday Jummah Reminder (Fridays Only)</p>
              <p className="text-xs text-slate-400">Special Friday reminder replacing Dhuhr</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => togglePrayerPref("fridayJummahOnly")}
            className="relative flex-shrink-0 cursor-pointer"
            style={{ width: 44, height: 24 }}
          >
            <div
              className="absolute inset-0 rounded-full transition-colors duration-200"
              style={{ background: prayerPrefs.fridayJummahOnly ? "#047857" : "#e2e8f0" }}
            />
            <div
              className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
              style={{ left: prayerPrefs.fridayJummahOnly ? 24 : 4 }}
            />
          </button>
        </div>
      </div>

      {/* ── Background & Battery Optimization Guide ── */}
      <div className="card bg-gradient-to-br from-slate-900 to-emerald-950 text-white p-5 space-y-3">
        <div className="flex items-center gap-2">
          <BatteryCharging className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-emerald-200">
            For Android: Ensure 100% On-Time Alarms
          </h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Some phone manufacturers (Samsung, Xiaomi, Vivo, Oppo) put background apps to sleep.
          To ensure Azan & Iqamah notifications always ring on time:
        </p>
        <ul className="text-xs text-slate-300 space-y-1.5 pl-4 list-disc marker:text-emerald-400">
          <li>Go to your phone’s <strong>Settings → Apps → Mosque Hub</strong></li>
          <li>Set <strong>Battery</strong> to <strong>Unrestricted / No Restrictions</strong></li>
          <li>Ensure <strong>Allow Exact Alarms</strong> is turned <strong>ON</strong></li>
        </ul>
      </div>

      {/* ── Mosque Announcements Subscriptions (signed-in only) ── */}
      {currentUser && (
        <div className="card space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            Mosque Announcements & News
          </p>
          {[
            { key: "timing", label: "Prayer Schedule Updates", icon: "schedule" },
            { key: "event", label: "Community & Islamic Events", icon: "event" },
            { key: "general", label: "General Mosque Announcements", icon: "campaign" },
            { key: "finance", label: "Finance & Donation Updates", icon: "volunteer_activism" },
          ].map(({ key, label, icon }) => (
            <label
              key={key}
              className="flex items-center gap-3 py-2.5 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center">
                <Icon name={icon} size={18} filled style={{ color: "#047857" }} />
              </div>
              <span className="flex-1 text-sm font-medium text-slate-700">{label}</span>
              <button
                type="button"
                onClick={() => saveCloudPref(key, !cloudPrefs[key])}
                className="relative flex-shrink-0 cursor-pointer"
                style={{ width: 44, height: 24 }}
              >
                <div
                  className="absolute inset-0 rounded-full transition-colors duration-200"
                  style={{ background: cloudPrefs[key] ? "#047857" : "#e2e8f0" }}
                />
                <div
                  className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
                  style={{ left: cloudPrefs[key] ? 24 : 4 }}
                />
              </button>
            </label>
          ))}
        </div>
      )}

      {/* ── Notification History ── */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          Notification History
        </p>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : notifs.length === 0 ? (
          <div className="card text-center py-12">
            <Icon name="notifications_none" size={44} style={{ color: "#cbd5e1" }} className="mx-auto mb-3" />
            <p className="text-sm text-slate-400">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {notifs.map((n) => {
              const meta = TYPE_META[n.type] || TYPE_META.custom;
              const isOpen = expanded === n.id;

              return (
                <div
                  key={n.id}
                  className="card cursor-pointer transition-shadow hover:shadow-md"
                  style={{ borderLeft: `4px solid ${meta.color}` }}
                  onClick={() => setExpanded(isOpen ? null : n.id)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: meta.bg }}
                    >
                      <Icon name={meta.icon} size={20} filled style={{ color: meta.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-sm text-slate-800 leading-snug">{n.title}</p>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: meta.bg, color: meta.color }}
                          >
                            {meta.label}
                          </span>
                          <Icon
                            name={isOpen ? "expand_less" : "expand_more"}
                            size={18}
                            style={{ color: "#94a3b8" }}
                          />
                        </div>
                      </div>

                      <p
                        className="text-xs text-slate-500 mt-0.5"
                        style={{ display: isOpen ? "block" : undefined }}
                      >
                        {isOpen ? n.body : (
                          <span className="line-clamp-2">{n.body}</span>
                        )}
                      </p>

                      {isOpen && n.imageUrl && (
                        <img
                          src={n.imageUrl}
                          alt="notification"
                          className="mt-3 w-full h-40 object-cover rounded-xl"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      )}

                      <p className="text-[10px] text-slate-300 mt-2">
                        {n.sentAt
                          ? format(new Date(n.sentAt), "dd MMM yyyy · hh:mm aa")
                          : ""}
                        {n.sentByName ? ` · ${n.sentByName}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
