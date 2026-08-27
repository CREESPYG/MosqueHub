import React, { useEffect, useState, useMemo } from "react";
import { ref, onValue } from "firebase/database";
import { rtdb } from "../firebase";
import { format, addMonths, subMonths } from "date-fns";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Search,
  Moon,
} from "lucide-react";
import Icon from "../components/ui/Icon";
import { islamicCalendarService } from "../services/islamicCalendarService";

const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha", "Jummah"];

export default function Schedule() {
  const [activeTab, setActiveTab] = useState("timings"); // "timings" | "calendar" | "events"
  const [eventFilter, setEventFilter] = useState("upcoming"); // "upcoming" | "past" | "all" | "islamic" | "mosque"
  const [eventSearch, setEventSearch] = useState("");
  const [timings, setTimings] = useState(null);
  const [mosqueEvents, setMosqueEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const today = format(new Date(), "EEEE");
  const isFriday = today === "Friday";
  const todayHijri = useMemo(() => islamicCalendarService.getHijriDate(new Date()), []);

  // Fetch timings & events from Firebase RTDB
  useEffect(() => {
    const unsubTimings = onValue(ref(rtdb, "timings/azans"), (snap) => {
      if (snap.exists()) setTimings(snap.val());
      setLoading(false);
    });

    const unsubEvents = onValue(ref(rtdb, "events"), (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, v]) => ({ id, ...v }));
        setMosqueEvents(list);
      }
    });

    return () => {
      unsubTimings();
      unsubEvents();
    };
  }, []);

  // Calendar Grid Data for the selected month
  const monthGrid = useMemo(() => {
    return islamicCalendarService.getMonthCalendarGrid(
      calendarDate.getFullYear(),
      calendarDate.getMonth(),
      mosqueEvents
    );
  }, [calendarDate, mosqueEvents]);

  // Selected date's events & Hijri details
  const selectedDateDetails = useMemo(() => {
    if (!selectedDate) return null;
    const hijri = islamicCalendarService.getHijriDate(selectedDate);
    const events = islamicCalendarService.getEventsForDate(selectedDate, mosqueEvents);
    return {
      date: selectedDate,
      hijri,
      events,
    };
  }, [selectedDate, mosqueEvents]);

  // Combined full events list with filter
  const filteredEvents = useMemo(() => {
    const list = islamicCalendarService.getAllMergedEvents(mosqueEvents, eventFilter);
    if (!eventSearch.trim()) return list;
    const q = eventSearch.toLowerCase();
    return list.filter(
      (ev) =>
        ev.title.toLowerCase().includes(q) ||
        ev.description.toLowerCase().includes(q) ||
        ev.islamicMonthName.toLowerCase().includes(q) ||
        ev.category.toLowerCase().includes(q)
    );
  }, [mosqueEvents, eventFilter, eventSearch]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-slide-up">
      {/* ── Page Header ── */}
      <div className="space-y-1">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-emerald-600" />
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
              {todayHijri.formatted}
            </p>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            Islamic Civil (Google Aligned)
          </span>
        </div>

        <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
          Prayer & <span className="text-gradient">Islamic Calendar</span>
        </h1>
        <p className="text-sm text-slate-400">
          {format(new Date(), "EEEE, dd MMMM yyyy")} · Masjid Al-Putki
        </p>
      </div>

      {/* ── Segmented Tab Switcher ── */}
      <div className="flex rounded-2xl bg-slate-100 p-1.5 gap-1 border border-slate-200 shadow-2xs">
        <button
          onClick={() => setActiveTab("timings")}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "timings"
              ? "bg-white text-emerald-800 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Clock className="w-4 h-4 text-emerald-600" />
          Prayer Timings
        </button>

        <button
          onClick={() => setActiveTab("calendar")}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "calendar"
              ? "bg-white text-emerald-800 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <CalendarIcon className="w-4 h-4 text-emerald-600" />
          Dual Calendar
        </button>

        <button
          onClick={() => setActiveTab("events")}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "events"
              ? "bg-white text-emerald-800 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          Events & Holidays
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: PRAYER TIMINGS
         ───────────────────────────────────────────────────────────── */}
      {activeTab === "timings" && (
        <div className="space-y-4">
          {/* Today highlight */}
          <div className="card bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                  <Clock className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <p className="font-bold text-sm">Today is {today}</p>
                  <p className="text-xs text-emerald-100">{todayHijri.formatted}</p>
                </div>
              </div>
              {isFriday && (
                <span className="badge bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs px-3 py-1 rounded-full flex items-center gap-1 font-bold">
                  <Icon name="star" size={13} filled style={{ color: "#fde68a" }} />
                  Jummah Day
                </span>
              )}
            </div>
          </div>

          {/* Timings Table */}
          <div className="card overflow-hidden p-0 border border-slate-200 shadow-sm">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-sm">Loading timings…</div>
            ) : !timings ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No timings configured yet. Please check back later.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 sm:px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Prayer
                    </th>
                    <th className="text-center px-2 sm:px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Azan
                    </th>
                    <th className="text-center px-2 sm:px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Iqamah
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PRAYERS.map((name, i) => {
                    const data = timings[name];
                    const isJummah = name === "Jummah";
                    const rowBg = isJummah
                      ? "bg-emerald-50/70"
                      : i % 2 === 0
                      ? "bg-white"
                      : "bg-slate-50/40";

                    return (
                      <tr
                        key={name}
                        className={`${rowBg} border-b border-slate-100 last:border-0 transition-colors`}
                      >
                        <td className="px-4 sm:px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                isJummah ? "bg-emerald-600 shadow-sm" : "bg-slate-300"
                              }`}
                            />
                            <span
                              className={`font-semibold text-sm ${
                                isJummah ? "text-emerald-900 font-bold" : "text-slate-800"
                              }`}
                            >
                              {name}
                              {isJummah && (
                                <span className="ml-2 text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-medium">
                                  Fridays Only
                                </span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-3.5 text-center">
                          <span className="text-sm font-mono text-slate-700 font-medium">
                            {data?.azan || <span className="text-slate-300">—</span>}
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 py-3.5 text-center">
                          <span
                            className={`text-sm font-mono font-extrabold ${
                              isJummah ? "text-emerald-800" : "text-emerald-600"
                            }`}
                          >
                            {data?.iqamah || <span className="text-slate-300">—</span>}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="rounded-2xl bg-amber-50 border border-amber-200/60 p-4 text-xs text-amber-800 flex items-start gap-2.5">
            <Icon name="info" size={18} style={{ color: "#b45309", flexShrink: 0 }} />
            <div>
              <p className="font-bold text-amber-900">Accurate Live Alarms Active</p>
              <p className="text-amber-700 mt-0.5">
                Exact Azan & Iqamah notifications are scheduled for your device. Friday Jummah reminder
                alerts ring exclusively on Fridays.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: DUAL ISLAMIC CIVIL & GREGORIAN CALENDAR
         ───────────────────────────────────────────────────────────── */}
      {activeTab === "calendar" && (
        <div className="space-y-4">
          {/* Calendar Month Header */}
          <div className="card flex items-center justify-between py-3 px-4 shadow-sm border border-slate-200">
            <button
              onClick={() => setCalendarDate(subMonths(calendarDate, 1))}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 active:scale-90 transition-all cursor-pointer"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <p className="text-base font-extrabold text-slate-800">
                {format(calendarDate, "MMMM yyyy")}
              </p>
              <p className="text-xs text-emerald-700 font-bold">
                {monthGrid.hijriSpanTitle}
              </p>
            </div>
            <button
              onClick={() => setCalendarDate(addMonths(calendarDate, 1))}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 active:scale-90 transition-all cursor-pointer"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="card p-3 shadow-sm border border-slate-200">
            <p className="text-[11px] text-slate-400 font-medium mb-2 text-center">
              Tap any date to inspect full Islamic date and scheduled events
            </p>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2 pb-2 border-b border-slate-100">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName, idx) => (
                <span
                  key={dayName}
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    idx === 5 ? "text-emerald-700 font-extrabold" : "text-slate-400"
                  }`}
                >
                  {dayName}
                </span>
              ))}
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {monthGrid.days.map((dayObj, i) => {
                if (!dayObj) {
                  return <div key={`empty-${i}`} className="h-14 sm:h-16 rounded-xl bg-slate-50/40" />;
                }

                const isSelected =
                  selectedDate &&
                  dayObj.date.toDateString() === selectedDate.toDateString();

                return (
                  <button
                    key={`day-${dayObj.gregorianDay}`}
                    type="button"
                    onClick={() => setSelectedDate(dayObj.date)}
                    className={`h-14 sm:h-16 rounded-xl p-1.5 flex flex-col justify-between border transition-all text-left relative cursor-pointer active:scale-95 ${
                      isSelected
                        ? "bg-emerald-700 text-white border-emerald-800 shadow-md ring-2 ring-emerald-400"
                        : dayObj.isToday
                        ? "bg-emerald-500 text-white border-emerald-600 shadow-sm"
                        : dayObj.isFriday
                        ? "bg-emerald-50/80 border-emerald-200 text-slate-800"
                        : dayObj.event
                        ? "bg-amber-50/80 border-amber-200 text-slate-800"
                        : "bg-white border-slate-100 text-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-bold ${
                          isSelected || dayObj.isToday ? "text-white" : "text-slate-800"
                        }`}
                      >
                        {dayObj.gregorianDay}
                      </span>
                      <span
                        className={`text-[10px] font-semibold ${
                          isSelected || dayObj.isToday
                            ? "text-emerald-100"
                            : dayObj.isFriday
                            ? "text-emerald-700"
                            : "text-slate-400"
                        }`}
                      >
                        {dayObj.hijriDay}
                      </span>
                    </div>

                    {dayObj.event && (
                      <div
                        className={`text-[8px] sm:text-[9px] font-bold px-1 py-0.5 rounded truncate w-full ${
                          isSelected || dayObj.isToday
                            ? "bg-white/20 text-white"
                            : dayObj.isMosqueEvent
                            ? "bg-teal-100 text-teal-900"
                            : "bg-amber-200/90 text-amber-950"
                        }`}
                        title={dayObj.event}
                      >
                        {dayObj.event}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2 px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Today
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-700 ring-1 ring-emerald-400 inline-block" /> Selected
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200 inline-block" /> Friday
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-100 border border-amber-200 inline-block" /> Islamic Holiday
              </span>
            </div>
          </div>

          {/* Selected Date Inspector Card */}
          {selectedDateDetails && (
            <div className="card border border-emerald-200 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 p-4 space-y-3 animate-slide-up shadow-sm">
              <div className="flex items-start justify-between flex-wrap gap-2 pb-2 border-b border-emerald-100">
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-extrabold text-emerald-700">
                    Selected Date Information
                  </span>
                  <h3 className="text-base font-extrabold text-slate-800">
                    {format(selectedDateDetails.date, "EEEE, dd MMMM yyyy")}
                  </h3>
                </div>

                <div className="text-right">
                  <span className="badge bg-emerald-700 text-white font-extrabold text-xs px-3 py-1 rounded-full shadow-2xs">
                    {selectedDateDetails.hijri.formatted}
                  </span>
                  <p className="text-[10px] text-emerald-800 font-semibold mt-0.5">
                    Islamic Month: <strong>{selectedDateDetails.hijri.fullIslamicMonth}</strong>
                  </p>
                </div>
              </div>

              {/* Events occurring on this selected date */}
              {selectedDateDetails.events.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-1">
                  No major holy day or custom mosque event scheduled for this date.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Events on this day:
                  </p>
                  {selectedDateDetails.events.map((ev) => (
                    <div
                      key={ev.id}
                      className="rounded-xl p-3 bg-white border border-emerald-200 shadow-2xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-800">{ev.title}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {ev.category}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-700 font-semibold">
                        Islamic Date: {ev.hijriDateStr}
                      </p>
                      {ev.description && (
                        <p className="text-xs text-slate-500">{ev.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: EVENTS & HOLIDAYS (PAST, UPCOMING, AND ALL)
         ───────────────────────────────────────────────────────────── */}
      {activeTab === "events" && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search event or Islamic month (e.g. Ramadan, Shawwal)..."
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex overflow-x-auto gap-1.5 py-1 no-scrollbar text-xs">
              {[
                { id: "upcoming", label: "Upcoming Events" },
                { id: "past", label: "Past Events" },
                { id: "all", label: "All Events" },
                { id: "islamic", label: "Islamic Holidays" },
                { id: "mosque", label: "Mosque Events" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setEventFilter(pill.id)}
                  className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer ${
                    eventFilter === pill.id
                      ? "bg-emerald-700 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Events Feed */}
          {filteredEvents.length === 0 ? (
            <div className="card text-center py-10 text-slate-400 text-xs">
              No events found matching your filter or search query.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map((ev) => {
                const isTodayEv = ev.diffDays === 0;

                return (
                  <div
                    key={ev.id}
                    className={`card card-hover transition-all border ${
                      ev.isIslamicHoliday
                        ? "border-emerald-200 bg-gradient-to-br from-white via-white to-emerald-50/30"
                        : "border-teal-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Date Block */}
                      <div
                        className={`flex-shrink-0 rounded-2xl px-3 py-2.5 text-center min-w-[62px] shadow-sm ${
                          isTodayEv
                            ? "bg-emerald-600 text-white"
                            : ev.isPast
                            ? "bg-slate-100 text-slate-600 border border-slate-200"
                            : "bg-emerald-50 text-emerald-900 border border-emerald-200"
                        }`}
                      >
                        <p
                          className={`text-[10px] font-extrabold uppercase ${
                            isTodayEv ? "text-emerald-100" : "text-emerald-700"
                          }`}
                        >
                          {format(ev.gregorianDate, "MMM")}
                        </p>
                        <p className="text-2xl font-extrabold leading-tight">
                          {format(ev.gregorianDate, "dd")}
                        </p>
                        <p
                          className={`text-[9px] font-semibold mt-0.5 ${
                            isTodayEv ? "text-emerald-100" : "text-slate-400"
                          }`}
                        >
                          {format(ev.gregorianDate, "EEE, yyyy")}
                        </p>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-slate-800 leading-snug">
                            {ev.title}
                          </h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                              ev.isIslamicHoliday
                                ? "bg-amber-100 text-amber-800"
                                : "bg-teal-100 text-teal-800"
                            }`}
                          >
                            {ev.category}
                          </span>
                        </div>

                        {/* Islamic Month & Date Highlight */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mt-1">
                          <span className="font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            🌙 {ev.hijriDateStr}
                          </span>

                          <span className="text-[11px] font-semibold text-slate-500">
                            {ev.diffDays === 0
                              ? "Happening Today!"
                              : ev.diffDays === 1
                              ? "Tomorrow"
                              : ev.diffDays > 0
                              ? `In ${ev.diffDays} days`
                              : `${Math.abs(ev.diffDays)} days ago`}
                          </span>
                        </div>

                        {ev.description && (
                          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                            {ev.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
