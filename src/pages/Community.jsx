import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { rtdb } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { format } from "date-fns";
import {
  Calendar,
  Image as ImageIcon,
  TrendingUp,
  Users,
  ExternalLink,
  CreditCard,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import Icon from "../components/ui/Icon";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const TABS = [
  { id: "events", label: "Events", icon: Calendar },
  { id: "gallery", label: "Gallery", icon: ImageIcon },
  { id: "finance", label: "Finance", icon: TrendingUp },
];

// ── Events ──────────────────────────────────────────────────────
function EventsTab() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onValue(ref(rtdb, "events"), (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data)
          .map(([id, v]) => ({ id, ...v }))
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        setEvents(list);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return <LoadingCards />;
  if (events.length === 0)
    return <EmptyState text="No upcoming events scheduled." />;

  return (
    <div className="space-y-4">
      {events.map((ev) => (
        <div key={ev.id} className="card card-hover overflow-hidden">
          {ev.imageUrl && (
            <div className="relative -mx-4 -mt-4 mb-4 h-40 overflow-hidden rounded-t-2xl">
              <img
                src={ev.imageUrl}
                alt={ev.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          )}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 bg-emerald-50 rounded-xl px-3 py-2 text-center min-w-[52px]">
              <p className="text-xs font-bold text-emerald-600 uppercase">
                {ev.date ? format(new Date(ev.date), "MMM") : "—"}
              </p>
              <p className="text-2xl font-extrabold text-emerald-800 leading-tight">
                {ev.date ? format(new Date(ev.date), "dd") : "—"}
              </p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 text-sm">{ev.title}</p>
              {ev.time && (
                <p className="text-xs text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                  <Icon name="schedule" size={14} style={{ color: "#059669" }} />
                  {ev.time}
                </p>
              )}
              {ev.description && (
                <p className="text-xs text-slate-500 mt-1.5 whitespace-normal break-words">
                  {ev.description}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Gallery ──────────────────────────────────────────────────────
function GalleryTab() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const unsub = onValue(ref(rtdb, "gallery"), (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data)
          .map(([id, v]) => ({ id, ...v }))
          .reverse();
        setPhotos(list);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return <LoadingCards />;
  if (photos.length === 0)
    return <EmptyState text="No gallery photos yet." />;

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {photos.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl overflow-hidden cursor-pointer shadow-card hover:shadow-card-hover transition-all"
            onClick={() => setSelected(p)}
          >
            <img
              src={p.imageUrl}
              alt={p.caption || "Gallery"}
              className="w-full h-36 object-cover"
              loading="lazy"
            />
            {p.caption && (
              <div className="bg-white px-3 py-2">
                <p className="text-xs font-medium text-slate-600 truncate">{p.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          className="modal-root fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div className="max-w-lg w-full animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <img
              src={selected.imageUrl}
              alt={selected.caption}
              className="w-full rounded-2xl object-contain max-h-[80vh]"
            />
            {selected.caption && (
              <p className="text-white text-center mt-3 text-sm">{selected.caption}</p>
            )}
            <button
              className="w-full mt-4 py-2.5 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Finance ──────────────────────────────────────────────────────
const CHART_COLORS = ["#047857", "#dc2626"];

function FinanceTab() {
  const { currentUser, isAdmin } = useAuth();
  const [funds, setFunds] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubFunds = onValue(ref(rtdb, "finances/funds"), (snap) => {
      if (snap.exists()) {
        setFunds(Object.values(snap.val()));
      }
    });
    const unsubExp = onValue(ref(rtdb, "finances/expenses"), (snap) => {
      if (snap.exists()) {
        setExpenses(Object.values(snap.val()));
        setLoading(false);
      } else {
        setLoading(false);
      }
    });
    return () => { unsubFunds(); unsubExp(); };
  }, []);

  /* User-to-user protection: regular users only see their own entries;
     admins see the full mosque ledger */
  const visibleFunds = isAdmin
    ? funds
    : funds.filter((f) => f.userId === currentUser?.uid);
  const visibleExpenses = isAdmin
    ? expenses
    : expenses.filter((e) => e.userId === currentUser?.uid);

  const totalFunds = visibleFunds.reduce((s, f) => s + Number(f.amount || 0), 0);
  const totalExpenses = visibleExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const balance = totalFunds - totalExpenses;

  const pieData = [
    { name: "Funds Collected", value: totalFunds },
    { name: "Expenses", value: totalExpenses },
  ];

  // Group expenses by category
  const byCat = visibleExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount || 0);
    return acc;
  }, {});
  const barData = Object.entries(byCat).map(([cat, amt]) => ({
    name: cat,
    amount: amt,
  }));

  if (loading) return <LoadingCards />;

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center min-w-0">
          <ArrowUpCircle className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
          <p className="text-base sm:text-lg font-extrabold text-emerald-700 truncate">
            ₹{totalFunds.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Collected</p>
        </div>
        <div className="card text-center min-w-0">
          <ArrowDownCircle className="w-6 h-6 text-red-500 mx-auto mb-1" />
          <p className="text-base sm:text-lg font-extrabold text-red-600 truncate">
            ₹{totalExpenses.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Spent</p>
        </div>
        <div className={`card text-center min-w-0 ${balance >= 0 ? "" : "border border-red-100"}`}>
          <Icon name="currency_rupee" size={24} className="mx-auto mb-1" style={{ color: balance >= 0 ? "#047857" : "#ef4444" }} />
          <p className={`text-base sm:text-lg font-extrabold truncate ${balance >= 0 ? "text-emerald-700" : "text-red-600"}`}>
            ₹{Math.abs(balance).toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Balance</p>
        </div>
      </div>

      {/* Pie Chart */}
      {(totalFunds > 0 || totalExpenses > 0) && (
        <div className="card">
          <p className="font-bold text-slate-800 mb-4">Funds vs Expenses</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bar Chart */}
      {barData.length > 0 && (
        <div className="card">
          <p className="font-bold text-slate-800 mb-4">Expenses by Category</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} />
              <Bar dataKey="amount" fill="#047857" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="card">
        <p className="font-bold text-slate-800 mb-3">
          {isAdmin ? "Recent Funds" : "My Funds"}
        </p>
        {visibleFunds.length === 0 ? (
          <p className="text-sm text-slate-400">No fund entries yet.</p>
        ) : (
          <div className="space-y-2">
            {visibleFunds.slice(-5).reverse().map((f, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5 border-b border-slate-50 last:border-0">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {f.donorName || "Anonymous"}
                  </p>
                  {f.date && (
                    <p className="text-xs text-slate-400">
                      {format(new Date(f.date), "dd MMM yyyy")}
                    </p>
                  )}
                </div>
                <span className="text-sm font-bold text-emerald-700">
                  +₹{Number(f.amount || 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <p className="font-bold text-slate-800 mb-3">
          {isAdmin ? "Recent Expenses" : "My Expenses"}
        </p>
        {visibleExpenses.length === 0 ? (
          <p className="text-sm text-slate-400">No expense entries yet.</p>
        ) : (
          <div className="space-y-2">
            {visibleExpenses.slice(-5).reverse().map((e, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5 border-b border-slate-50 last:border-0">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <ArrowDownCircle className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{e.category}</p>
                  {e.note && <p className="text-xs text-slate-400 truncate">{e.note}</p>}
                </div>
                <span className="text-sm font-bold text-red-600">
                  -₹{Number(e.amount || 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────
function LoadingCards() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="text-center py-12 text-slate-400">
      <Icon name="mosque" size={44} style={{ color: "#cbd5e1" }} className="mx-auto mb-3" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

// ── Main Community Page ──────────────────────────────────────────
export default function Community() {
  const [activeTab, setActiveTab] = useState("events");

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="animate-slide-up">
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-5 h-5 text-emerald-600" />
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">
            Community
          </p>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-800">
          Events & <span className="text-gradient">Community</span>
        </h1>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200
              ${activeTab === id
                ? "bg-white text-emerald-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
              }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === "events" && <EventsTab />}
        {activeTab === "gallery" && <GalleryTab />}
        {activeTab === "finance" && <FinanceTab />}
      </div>
    </div>
  );
}
