import React, { useEffect, useState } from "react";
import { ref, onValue, set, get } from "firebase/database";
import { rtdb } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { format, startOfWeek, addDays, isSameDay, subDays } from "date-fns";
import {
  CheckCircle2,
  Circle,
  Flame,
  BarChart3,
  CalendarCheck2,
} from "lucide-react";
import Icon from "../components/ui/Icon";

const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

const PRAYER_COLORS = {
  Fajr: "text-indigo-600 bg-indigo-50",
  Dhuhr: "text-amber-600 bg-amber-50",
  Asr: "text-orange-600 bg-orange-50",
  Maghrib: "text-rose-600 bg-rose-50",
  Isha: "text-slate-600 bg-slate-100",
};

function calculateStreak(trackerData) {
  if (!trackerData) return 0;
  let streak = 0;
  let date = new Date();

  while (true) {
    const key = format(date, "yyyy-MM-dd");
    const dayData = trackerData[key];
    if (!dayData) break;
    const completed = PRAYERS.filter((p) => dayData[p]).length;
    if (completed < 5) break;
    streak++;
    date = subDays(date, 1);
  }
  return streak;
}

export default function Tracker() {
  const { currentUser, openAuthModal } = useAuth();
  const [tracker, setTracker] = useState({});
  const [loading, setLoading] = useState(true);
  const today = format(new Date(), "yyyy-MM-dd");

  // Load tracker from RTDB
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    const unsub = onValue(
      ref(rtdb, `users/${currentUser.uid}/prayerTracker`),
      (snap) => {
        setTracker(snap.exists() ? snap.val() : {});
        setLoading(false);
      }
    );
    return unsub;
  }, [currentUser]);

  const togglePrayer = async (prayer) => {
    if (!currentUser) return;
    const prayerRef = ref(
      rtdb,
      `users/${currentUser.uid}/prayerTracker/${today}/${prayer}`
    );
    const snap = await get(prayerRef);
    const current = snap.exists() ? snap.val() : false;
    await set(prayerRef, !current);
  };

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 flex flex-col items-center text-center gap-6">
        <div className="w-20 h-20 rounded-3xl bg-emerald-100 flex items-center justify-center">
          <Icon name="fact_check" size={44} style={{ color: "#047857" }} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 mb-2">Prayer Tracker</h1>
          <p className="text-sm text-slate-500">
            Sign in to track your daily prayers, build streaks, and view your
            weekly consistency.
          </p>
        </div>
        <button
          onClick={() => openAuthModal("signin")}
          className="btn-primary flex items-center gap-2 px-8"
        >
          <Icon name="login" size={18} />
          Sign In / Create Account
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  const todayData = tracker[today] || {};
  const completedToday = PRAYERS.filter((p) => todayData[p]).length;
  const streak = calculateStreak(tracker);

  // Weekly grid (Mon–Sun)
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="max-w-2xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="animate-slide-up">
        <div className="flex items-center gap-2 mb-1">
          <CalendarCheck2 className="w-5 h-5 text-emerald-600" />
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">
            Prayer Tracker
          </p>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-800">
          Your <span className="text-gradient">Daily Prayers</span>
        </h1>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-2xl font-extrabold text-emerald-700">{completedToday}</p>
          <p className="text-xs text-slate-400 font-medium mt-0.5">of 5 today</p>
        </div>
        <div className="card text-center col-span-1">
          <div className="streak-badge justify-center w-full">
            <Flame className="w-4 h-4" />
            <span className="text-xl font-extrabold">{streak}</span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">day streak</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-extrabold text-slate-700">
            {Math.round((completedToday / 5) * 100)}%
          </p>
          <p className="text-xs text-slate-400 font-medium mt-0.5">today</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-slate-700">Today's Progress</p>
          <p className="text-xs text-emerald-600 font-medium">{completedToday}/5 prayers</p>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
            style={{ width: `${(completedToday / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Prayer Checklist */}
      <div>
        <h2 className="section-title mb-3">
          {format(new Date(), "EEEE, dd MMM")}
        </h2>
        <div className="space-y-2.5">
          {PRAYERS.map((prayer) => {
            const done = !!todayData[prayer];
            const colorClass = PRAYER_COLORS[prayer];
            return (
              <button
                key={prayer}
                onClick={() => togglePrayer(prayer)}
                className={`w-full card flex items-center gap-4 cursor-pointer
                  transition-all duration-200 active:scale-98 text-left
                  ${done ? "border border-emerald-200 bg-emerald-50/60" : "hover:shadow-card-hover"}`}
              >
                {done ? (
                  <CheckCircle2 className="w-7 h-7 text-emerald-600 flex-shrink-0" />
                ) : (
                  <Circle className="w-7 h-7 text-slate-300 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className={`font-bold text-sm ${done ? "text-emerald-800" : "text-slate-800"}`}>
                    {prayer}
                  </p>
                  <p className="text-xs text-slate-400">
                    {done ? "Completed ✓" : "Tap to mark as prayed"}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colorClass}`}>
                  {prayer.slice(0, 3)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Weekly View */}
      <div>
        <h2 className="section-title mb-3 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-600" />
          This Week
        </h2>
        <div className="card">
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayData = tracker[key] || {};
              const count = PRAYERS.filter((p) => dayData[p]).length;
              const isToday = isSameDay(day, new Date());
              const pct = count / 5;

              return (
                <div key={key} className="flex flex-col items-center gap-1.5">
                  <p className={`text-[10px] font-bold uppercase ${isToday ? "text-emerald-700" : "text-slate-400"}`}>
                    {format(day, "EEE").slice(0, 1)}
                  </p>
                  <div className="relative w-8 h-8 rounded-full flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 32 32">
                      <circle cx="16" cy="16" r="12" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                      <circle
                        cx="16"
                        cy="16"
                        r="12"
                        fill="none"
                        stroke={pct === 1 ? "#047857" : pct > 0 ? "#34d399" : "#e2e8f0"}
                        strokeWidth="4"
                        strokeDasharray={`${75.4 * pct} 75.4`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className={`text-[9px] font-bold relative z-10 ${isToday ? "text-emerald-700" : "text-slate-500"}`}>
                      {count}
                    </span>
                  </div>
                  <p className={`text-[10px] font-semibold ${isToday ? "text-emerald-700" : "text-slate-300"}`}>
                    {format(day, "d")}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
