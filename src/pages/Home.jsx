import React, { useEffect, useState, useRef, useMemo } from "react";
import { ref, onValue } from "firebase/database";
import { rtdb } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { useMosqueSettings } from "../hooks/useMosqueSettings";
import Icon from "../components/ui/Icon";
import {
  Moon,
  Bell,
  ChevronRight,
  Sunrise,
  Sun,
  Sunset,
  Star,
  CloudMoon,
  LogIn,
  Sparkles,
} from "lucide-react";
import { format, differenceInSeconds, parse, addDays } from "date-fns";
import { Link } from "react-router-dom";
import { offlineCache } from "../services/offlineCache";
import { notificationService } from "../services/notificationService";
import { islamicCalendarService } from "../services/islamicCalendarService";

const PRAYER_ICONS = {
  Fajr: Sunrise,
  Dhuhr: Sun,
  Asr: Sun,
  Maghrib: Sunset,
  Isha: CloudMoon,
  Jummah: Star,
};

const PRAYER_GRADIENTS = {
  Fajr: "from-indigo-500 to-purple-600",
  Dhuhr: "from-amber-400 to-orange-500",
  Asr: "from-orange-400 to-amber-500",
  Maghrib: "from-rose-500 to-pink-600",
  Isha: "from-slate-600 to-slate-800",
  Jummah: "from-emerald-500 to-emerald-700",
};

function parseTime(timeStr) {
  if (!timeStr) return null;
  try {
    const today = format(new Date(), "yyyy-MM-dd");
    return parse(`${today} ${timeStr}`, "yyyy-MM-dd hh:mm aa", new Date());
  } catch {
    return null;
  }
}

function formatCountdown(totalSeconds) {
  if (totalSeconds <= 0) return "00:00:00";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

function getNextPrayer(timings) {
  if (!timings) return null;
  const now = new Date();
  const todayDay = format(now, "EEEE");
  const dailyPrayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
  const prayers = todayDay === "Friday"
    ? ["Fajr", "Jummah", "Asr", "Maghrib", "Isha"]
    : dailyPrayers;

  for (const name of prayers) {
    const azanTime = parseTime(timings[name]?.azan);
    const iqamahTime = parseTime(timings[name]?.iqamah);
    if (iqamahTime && iqamahTime > now) {
      return { name, azanTime, iqamahTime };
    }
  }
  // Tomorrow's Fajr
  if (timings.Fajr?.iqamah) {
    const tomorrow = addDays(new Date(), 1);
    const tomorrowStr = format(tomorrow, "yyyy-MM-dd");
    try {
      const t = parse(
        `${tomorrowStr} ${timings.Fajr.iqamah}`,
        "yyyy-MM-dd hh:mm aa",
        new Date()
      );
      return { name: "Fajr", azanTime: null, iqamahTime: t };
    } catch {}
  }
  return null;
}

export default function Home() {
  const { currentUser, openAuthModal } = useAuth();
  const { name: mosqueName, location: mosqueLocation } = useMosqueSettings();
  const [timings, setTimings] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [mosqueEvents, setMosqueEvents] = useState([]);
  const [countdown, setCountdown] = useState(0);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [notifPermission, setNotifPermission] = useState("default");
  const [notifFired, setNotifFired] = useState({});
  const intervalRef = useRef(null);

  const todayHijri = useMemo(() => islamicCalendarService.getHijriDate(new Date()), []);

  useEffect(() => {
    notificationService.checkPermissionStatus().then((status) => {
      setNotifPermission(status);
    });
  }, []);

  // Load cached data on initial render for instant offline experience
  useEffect(() => {
    offlineCache.get("prayer_timings").then((cached) => {
      if (cached && !timings) {
        setTimings(cached);
        notificationService.schedulePrayerAlarms(cached);
      }
    });
    offlineCache.get("announcements").then((cached) => {
      if (cached && announcements.length === 0) setAnnouncements(cached);
    });
  }, []);

  // Load real-time timings from RTDB + cache + schedule alarms
  useEffect(() => {
    const unsub = onValue(ref(rtdb, "timings/azans"), (snap) => {
      if (snap.exists()) {
        const val = snap.val();
        setTimings(val);
        offlineCache.set("prayer_timings", val);
        notificationService.schedulePrayerAlarms(val);
      }
    });
    return unsub;
  }, []);

  // Load real-time announcements from RTDB + cache
  useEffect(() => {
    const unsub = onValue(ref(rtdb, "announcements"), (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.values(data).slice(-5).reverse();
        setAnnouncements(list);
        offlineCache.set("announcements", list);
      }
    });
    return unsub;
  }, []);

  // Load mosque events for upcoming previews
  useEffect(() => {
    const unsub = onValue(ref(rtdb, "events"), (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, v]) => ({ id, ...v }));
        setMosqueEvents(list);
      }
    });
    return unsub;
  }, []);

  // Combine upcoming events
  const upcomingEventsPreview = useMemo(() => {
    return islamicCalendarService.getMergedUpcomingEvents(mosqueEvents, 2);
  }, [mosqueEvents]);

  // Countdown + accurate pre-notifications & exact notifications
  useEffect(() => {
    if (!timings) return;
    const prefs = notificationService.getPreferences();

    const tick = () => {
      const next = getNextPrayer(timings);
      setNextPrayer(next);
      if (next) {
        const secs = differenceInSeconds(next.iqamahTime, new Date());
        setCountdown(Math.max(0, secs));

        if (notifPermission !== "granted") return;

        // Exact Azan Trigger
        if (prefs.azanExact && next.azanTime) {
          const azanDiff = differenceInSeconds(next.azanTime, new Date());
          const keyAzan = `${next.name}-exact-azan`;
          if (azanDiff >= 0 && azanDiff <= 5 && !notifFired[keyAzan]) {
            notificationService.showInstantNotification({
              title: `🕌 ${next.name} Azan Time`,
              body: `It is now time for ${next.name} Azan (${format(next.azanTime, "hh:mm aa")}) — ${mosqueName}`,
            });
            setNotifFired((prev) => ({ ...prev, [keyAzan]: true }));
          }
        }

        // Exact Iqamah Trigger
        if (prefs.iqamahExact && next.iqamahTime) {
          const iqamahDiff = differenceInSeconds(next.iqamahTime, new Date());
          const keyIqamah = `${next.name}-exact-iqamah`;
          if (iqamahDiff >= 0 && iqamahDiff <= 5 && !notifFired[keyIqamah]) {
            notificationService.showInstantNotification({
              title: `🕌 ${next.name} Iqamah Starting`,
              body: `Congregational prayer for ${next.name} is starting now — ${mosqueName}`,
            });
            setNotifFired((prev) => ({ ...prev, [keyIqamah]: true }));
          }
        }

        // 5-min pre-notification for Azan and Iqamah
        if (prefs.prePrayer5Min) {
          const firePreIfDue = (time, type) => {
            if (!time) return;
            const until = differenceInSeconds(time, new Date());
            const key = `${next.name}-pre-${type}`;
            if (until > 0 && until <= 300 && !notifFired[key]) {
              notificationService.showInstantNotification({
                title: `🕌 ${next.name} ${type === "azan" ? "Azan" : "Iqamah"} in 5 Minutes`,
                body: `${type === "azan" ? "Azan" : "Iqamah"} at ${format(time, "hh:mm aa")} — ${mosqueName}`,
              });
              setNotifFired((prev) => ({ ...prev, [key]: true }));
            }
          };

          firePreIfDue(next.azanTime, "azan");
          firePreIfDue(next.iqamahTime, "iqamah");
        }
      }
    };
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => clearInterval(intervalRef.current);
  }, [timings, notifPermission, notifFired, mosqueName]);

  const requestNotifications = async () => {
    const granted = await notificationService.requestPermissions();
    if (granted) {
      setNotifPermission("granted");
      if (timings) notificationService.schedulePrayerAlarms(timings);
    }
  };

  const today = format(new Date(), "EEEE, dd MMMM yyyy");
  const isFriday = format(new Date(), "EEEE") === "Friday";

  const displayPrayers = isFriday
    ? ["Fajr", "Jummah", "Asr", "Maghrib", "Isha"]
    : ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha", "Jummah"];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* ── Date Header ── */}
      <div className="animate-slide-up">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-widest">
            {today}
          </p>
          <span className="badge bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-2xs">
            <Moon className="w-3 h-3 text-emerald-600" />
            {todayHijri.formatted}
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 flex-wrap">
          Assalamu <span className="text-gradient">Alaikum</span>
          <Icon name="mosque" size={26} filled style={{ color: "#047857" }} />
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">{mosqueName}, {mosqueLocation}</p>
      </div>

      {/* ── Notification Banner ── */}
      {notifPermission !== "granted" && (
        <div
          className="card flex items-center gap-4 bg-gradient-to-r from-emerald-700 to-emerald-600
                     text-white cursor-pointer hover:shadow-card-hover transition-all"
          onClick={requestNotifications}
        >
          <Bell className="w-8 h-8 flex-shrink-0 opacity-90" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Enable Prayer & Azan Notifications</p>
            <p className="text-xs text-emerald-100 mt-0.5">
              Get exact on-time Azan alarms & Friday Jummah reminders
            </p>
          </div>
          <ChevronRight className="w-5 h-5 opacity-70" />
        </div>
      )}

      {/* ── Countdown Card ── */}
      <div className="card bg-gradient-to-br from-emerald-800 via-emerald-900 to-slate-900 text-white overflow-hidden relative shadow-lg">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Moon className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <p className="text-emerald-300 text-xs font-medium uppercase tracking-wider">Next Iqamah</p>
              <p className="text-white font-bold text-lg leading-tight">
                {nextPrayer?.name || "—"}
                {nextPrayer?.name === "Jummah" && (
                  <span className="ml-2 text-xs font-normal text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full">
                    Friday
                  </span>
                )}
              </p>
            </div>
            {nextPrayer && (
              <span className="ml-auto badge bg-white/20 text-white text-xs px-3 py-1 rounded-full font-mono font-bold">
                {format(nextPrayer.iqamahTime, "hh:mm aa")}
              </span>
            )}
          </div>
          <div className="countdown-display text-white text-center py-2 font-mono">
            {formatCountdown(countdown)}
          </div>
          <p className="text-center text-emerald-300 text-xs mt-2 font-medium">
            {countdown <= 0 ? "Iqamah time!" : "until Iqamah"}
          </p>
        </div>
      </div>

      {/* ── Prayer Time Cards ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">Today's Timings</h2>
          <Link to="/schedule" className="text-emerald-600 text-xs font-semibold flex items-center gap-1 hover:text-emerald-800">
            Full Schedule & Calendar <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {!timings ? (
          <div className="grid grid-cols-3 max-[380px]:grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 max-[380px]:grid-cols-2 gap-3">
            {displayPrayers.map((name) => {
              const IconComp = PRAYER_ICONS[name] || Moon;
              const grad = PRAYER_GRADIENTS[name];
              const isNext = nextPrayer?.name === name;
              const data = timings[name];

              return (
                <div
                  key={name}
                  className={`prayer-card ${isNext ? "current" : ""} relative overflow-hidden`}
                >
                  {isNext && (
                    <div className="absolute top-2 right-2">
                      <span className="badge-green text-[9px] px-1.5 py-0.5">Next</span>
                    </div>
                  )}
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm`}>
                    <IconComp className="w-4.5 h-4.5 text-white" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                    {name}
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    {data?.azan || "—"}
                  </p>
                  <div className="w-full border-t border-slate-100 mt-1.5 pt-1.5">
                    <p className="text-[10px] text-slate-400 text-center">Iqamah</p>
                    <p className="text-xs font-semibold text-emerald-700 text-center">
                      {data?.iqamah || "—"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Upcoming Islamic & Mosque Events Preview ── */}
      {upcomingEventsPreview.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="section-title flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Upcoming in Calendar
            </h2>
            <Link to="/schedule" className="text-emerald-600 text-xs font-semibold flex items-center gap-1 hover:text-emerald-800">
              View Calendar <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {upcomingEventsPreview.map((ev) => (
              <div key={ev.id} className="card border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30 p-3.5 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex flex-col items-center justify-center flex-shrink-0 font-bold">
                  <span className="text-[9px] uppercase leading-none text-emerald-600">{format(ev.gregorianDate, "MMM")}</span>
                  <span className="text-base leading-tight">{format(ev.gregorianDate, "dd")}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs text-slate-800 truncate">{ev.title}</p>
                  <p className="text-[11px] text-emerald-700 font-medium">{ev.hijriDateStr}</p>
                  <span className="text-[10px] text-slate-400">
                    {ev.diffDays === 0 ? "Today" : ev.diffDays === 1 ? "Tomorrow" : `In ${ev.diffDays} days`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Announcements ── */}
      {announcements.length > 0 && (
        <div>
          <h2 className="section-title mb-3">
            <Icon name="campaign" size={20} style={{ color: "#047857" }} />
            Announcements
          </h2>
          <div className="space-y-2">
            {announcements.map((a, i) => (
              <div key={i} className="card flex gap-3 items-start">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{a.title}</p>
                  {a.body && <p className="text-xs text-slate-500 mt-0.5">{a.body}</p>}
                  {a.date && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      {format(new Date(a.date), "dd MMM yyyy")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Sign-in CTA ── */}
      {!currentUser && (
        <div className="card border border-emerald-100 bg-emerald-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <LogIn className="w-6 h-6 text-emerald-700" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-800 text-sm">Track Your Prayers</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Sign in to use the personal prayer tracker, streak counter & community updates.
              </p>
            </div>
          </div>
          <button
            onClick={() => openAuthModal("signin")}
            className="w-full btn-primary mt-4 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Icon name="login" size={18} />
            Sign In / Create Account
          </button>
        </div>
      )}
    </div>
  );
}
