import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { rtdb } from "../../firebase";
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Calendar,
  Activity,
} from "lucide-react";

export default function AdminOverview() {
  const [timings, setTimings] = useState(null);
  const [funds, setFunds] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubTimings = onValue(ref(rtdb, "timings/azans"), (s) => {
      if (s.exists()) setTimings(s.val());
    });
    const unsubFunds = onValue(ref(rtdb, "finances/funds"), (s) => {
      if (s.exists()) setFunds(Object.values(s.val()));
    });
    const unsubExp = onValue(ref(rtdb, "finances/expenses"), (s) => {
      if (s.exists()) setExpenses(Object.values(s.val()));
    });
    const unsubEvents = onValue(ref(rtdb, "events"), (s) => {
      if (s.exists()) setEvents(Object.values(s.val()));
      setLoading(false);
    });

    return () => {
      unsubTimings();
      unsubFunds();
      unsubExp();
      unsubEvents();
    };
  }, []);

  const totalFunds = funds.reduce((s, f) => s + Number(f.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const balance = totalFunds - totalExpenses;
  const upcomingEvents = events.filter((e) => e.date && new Date(e.date) >= new Date()).length;

  const stats = [
    {
      label: "Fund Balance",
      value: `₹${balance.toLocaleString()}`,
      sub: `₹${totalFunds.toLocaleString()} collected`,
      icon: IndianRupee,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-700",
      trend: balance >= 0 ? "up" : "down",
    },
    {
      label: "Monthly Expenses",
      value: `₹${totalExpenses.toLocaleString()}`,
      sub: `${expenses.length} entries`,
      icon: TrendingDown,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
    },
    {
      label: "Upcoming Events",
      value: upcomingEvents,
      sub: `${events.length} total`,
      icon: Calendar,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      label: "Prayers Today",
      value: timings ? "6" : "—",
      sub: "Fajr → Isha + Jummah",
      icon: Clock,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">Dashboard Overview</h1>
        <p className="text-sm text-slate-400 mt-0.5">Masjid Al-Putki · Admin Panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, iconBg, iconColor }) => (
          <div key={label} className="stat-card">
            <div className={`stat-icon ${iconBg}`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div>
              <p className="text-xl font-extrabold text-slate-800">{value}</p>
              <p className="text-xs font-semibold text-slate-500">{label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Today's Timings Preview */}
      {timings && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-emerald-600" />
            <h2 className="section-title">Today's Azan Schedule</h2>
          </div>
          <div className="space-y-2">
            {["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha", "Jummah"].map((name) => (
              <div key={name} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                <span className="text-sm font-semibold text-slate-700 w-20">{name}</span>
                <span className="text-sm text-slate-500 font-mono flex-1">
                  Azan: {timings[name]?.azan || "—"}
                </span>
                <span className="text-sm text-emerald-700 font-mono font-bold">
                  Iqamah: {timings[name]?.iqamah || "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="card">
        <h2 className="section-title mb-3 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-600" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Update Timings", to: "/admin/timings", color: "bg-emerald-50 text-emerald-800" },
            { label: "Add Event", to: "/admin/events", color: "bg-blue-50 text-blue-800" },
            { label: "Log Funds", to: "/admin/finances", color: "bg-amber-50 text-amber-800" },
            { label: "Add Photo", to: "/admin/gallery", color: "bg-purple-50 text-purple-800" },
          ].map(({ label, to, color }) => (
            <a key={to} href={to} className={`rounded-xl px-4 py-3 text-sm font-semibold ${color} hover:opacity-80 transition-opacity`}>
              {label} →
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
