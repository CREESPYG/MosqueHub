import React, { useEffect, useState } from "react";
import { ref, onValue, push, remove } from "firebase/database";
import { rtdb } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";
import { useConfirm } from "../../contexts/ConfirmContext";
import { format } from "date-fns";
import DatePicker from "../../components/ui/DatePicker";
import PreviewRows from "../../components/ui/PreviewRows";
import {
  Plus, Trash2, X, Save, ArrowUpCircle, ArrowDownCircle, CheckCircle,
} from "lucide-react";
import Icon from "../../components/ui/Icon";

const TABS = [
  { id: "funds",    label: "Funds",    icon: "wallet"         },
  { id: "expenses", label: "Expenses", icon: "receipt_long"   },
];
const EXPENSE_CATEGORIES = [
  "Electricity", "Maintenance", "Salaries", "Events", "Cleaning", "Education", "Other"
];

const EMPTY_FUND = { donorName: "", amount: "", date: "", paymentRef: "" };
const EMPTY_EXP = { category: "", amount: "", date: "", note: "", addedBy: "" };

const todayISO = () => format(new Date(), "yyyy-MM-dd");
const NEW_FUND = () => ({ ...EMPTY_FUND, date: todayISO() });
const NEW_EXP  = () => ({ ...EMPTY_EXP,  date: todayISO() });

export default function FinanceHub() {
  const { currentUser } = useAuth();
  const { confirm }     = useConfirm();
  const [activeTab, setActiveTab] = useState("funds");
  const [funds, setFunds] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [fundForm, setFundForm] = useState(NEW_FUND);
  const [expForm, setExpForm] = useState(NEW_EXP);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [datePickerFor, setDatePickerFor] = useState(null); // 'fund' | 'expense'

  const fmtDate = (v) =>
    /^\d{4}-\d{2}-\d{2}$/.test(v || "")
      ? format(new Date(`${v}T00:00:00`), "EEE, MMM d, yyyy")
      : "Select date";

  useEffect(() => {
    const u1 = onValue(ref(rtdb, "finances/funds"), (s) => {
      if (s.exists()) {
        setFunds(Object.entries(s.val()).map(([id, v]) => ({ id, ...v })).reverse());
      } else setFunds([]);
    });
    const u2 = onValue(ref(rtdb, "finances/expenses"), (s) => {
      if (s.exists()) {
        setExpenses(Object.entries(s.val()).map(([id, v]) => ({ id, ...v })).reverse());
      } else setExpenses([]);
    });
    return () => { u1(); u2(); };
  }, []);

  const totalFunds = funds.reduce((s, f) => s + Number(f.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const balance = totalFunds - totalExpenses;

  const handleFundSubmit = async (e) => {
    e.preventDefault();
    if (!fundForm.amount || !fundForm.date) return;
    const ok = await confirm({
      title: "Save fund entry?",
      body: "This donation will be added to the ledger.",
      confirmText: "Save",
      icon: "wallet",
      preview: (
        <PreviewRows
          rows={[
            { label: "Donor", value: fundForm.donorName.trim() || "Anonymous" },
            { label: "Amount", value: `₹${Number(fundForm.amount).toLocaleString()}` },
            { label: "Date", value: fmtDate(fundForm.date) },
            { label: "Payment ref", value: fundForm.paymentRef.trim() || "—" },
          ]}
        />
      ),
    });
    if (!ok) return;
    setSaving(true);
    try {
      await push(ref(rtdb, "finances/funds"), {
        ...fundForm,
        userId: currentUser?.uid || "unknown",
        userName: currentUser?.displayName || fundForm.donorName || "Anonymous",
        createdAt: Date.now(),
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); setShowForm(false); setFundForm(NEW_FUND()); }, 1500);
    } finally { setSaving(false); }
  };

  const handleExpSubmit = async (e) => {
    e.preventDefault();
    if (!expForm.category || !expForm.amount || !expForm.date) return;
    const ok = await confirm({
      title: "Save expense?",
      body: "This expense will be added to the ledger.",
      confirmText: "Save",
      icon: "receipt_long",
      preview: (
        <PreviewRows
          rows={[
            { label: "Category", value: expForm.category },
            { label: "Amount", value: `₹${Number(expForm.amount).toLocaleString()}` },
            { label: "Date", value: fmtDate(expForm.date) },
            { label: "Note", value: expForm.note.trim() || "—" },
            { label: "Recorded by", value: expForm.addedBy.trim() || "Admin" },
          ]}
        />
      ),
    });
    if (!ok) return;
    setSaving(true);
    try {
      await push(ref(rtdb, "finances/expenses"), {
        ...expForm,
        userId: currentUser?.uid || "unknown",
        userName: currentUser?.displayName || expForm.addedBy || "Admin",
        createdAt: Date.now(),
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); setShowForm(false); setExpForm(NEW_EXP()); }, 1500);
    } finally { setSaving(false); }
  };

  const handleDelete = async (type, id) => {
    const label = type === "funds" ? "fund entry" : "expense";
    const ok = await confirm({
      title: `Delete ${label}?`,
      body: "This removes the entry permanently from the ledger.",
      confirmText: "Delete",
      danger: true,
      icon: "delete",
    });
    if (!ok) return;
    await remove(ref(rtdb, `finances/${type}/${id}`));
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Finance Hub</h1>
          <p className="text-sm text-slate-400 mt-0.5">Track funds collected and mosque expenses.</p>
        </div>
        <Icon name="currency_rupee" size={32} style={{ color: "#047857", opacity: 0.4 }} />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center min-w-0">
          <ArrowUpCircle className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
          <p className="text-base sm:text-lg font-extrabold text-emerald-700 truncate">₹{totalFunds.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Collected</p>
        </div>
        <div className="card text-center min-w-0">
          <ArrowDownCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
          <p className="text-base sm:text-lg font-extrabold text-red-600 truncate">₹{totalExpenses.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Spent</p>
        </div>
        <div className={`card text-center min-w-0 border ${balance >= 0 ? "border-emerald-100" : "border-red-100"}`}>
          <Icon name="currency_rupee" size={20} className="mx-auto mb-1" style={{ color: balance >= 0 ? "#047857" : "#ef4444" }} />
          <p className={`text-base sm:text-lg font-extrabold truncate ${balance >= 0 ? "text-emerald-700" : "text-red-600"}`}>
            ₹{Math.abs(balance).toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Balance</p>
        </div>
      </div>

      {/* Tabs + Add */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl flex-1 min-w-0">
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 min-w-0 py-1.5 rounded-lg text-sm font-semibold capitalize flex items-center justify-center gap-1.5 transition-all
                ${activeTab === id ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500"}`}
            >
              <Icon name={icon} size={16} style={{ color: activeTab === id ? "#047857" : "#94a3b8" }} className="flex-shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-1.5 flex-shrink-0 px-3 sm:px-4"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden min-[360px]:inline">Add</span>
          <span className="min-[360px]:hidden">+</span>
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-root fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">
                {activeTab === "funds" ? "Add Fund Entry" : "Add Expense"}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeTab === "funds" ? (
              <form onSubmit={handleFundSubmit} className="p-4 sm:p-6 space-y-4">
                <div>
                  <label className="label">Donor Name</label>
                  <input
                    className="input-field"
                    placeholder="Anonymous"
                    value={fundForm.donorName}
                    onChange={(e) => setFundForm((f) => ({ ...f, donorName: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Amount (₹) *</label>
                    <input
                      required
                      type="number"
                      min="1"
                      className="input-field"
                      placeholder="500"
                      value={fundForm.amount}
                      onChange={(e) => setFundForm((f) => ({ ...f, amount: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="label">Date *</label>
                    <button
                      type="button"
                      onClick={() => setDatePickerFor("fund")}
                      className={`input-field flex items-center justify-between gap-2 ${fundForm.date ? "" : "text-slate-400"}`}
                    >
                      <span className="truncate">{fmtDate(fundForm.date)}</span>
                      <Icon name="calendar_month" size={18} filled style={{ color: "#047857", flexShrink: 0 }} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Payment Reference</label>
                  <input
                    className="input-field"
                    placeholder="UPI ID, cash, etc."
                    value={fundForm.paymentRef}
                    onChange={(e) => setFundForm((f) => ({ ...f, paymentRef: e.target.value }))}
                  />
                </div>
                <button type="submit" disabled={saving} className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${saved ? "bg-emerald-100 text-emerald-800" : "btn-primary"}`}>
                  {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Fund Entry"}</>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleExpSubmit} className="p-4 sm:p-6 space-y-4">
                <div>
                  <label className="label">Category *</label>
                  <select
                    required
                    className="input-field"
                    value={expForm.category}
                    onChange={(e) => setExpForm((f) => ({ ...f, category: e.target.value }))}
                  >
                    <option value="">Select category…</option>
                    {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Amount (₹) *</label>
                    <input
                      required
                      type="number"
                      min="1"
                      className="input-field"
                      placeholder="1200"
                      value={expForm.amount}
                      onChange={(e) => setExpForm((f) => ({ ...f, amount: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="label">Date *</label>
                    <button
                      type="button"
                      onClick={() => setDatePickerFor("expense")}
                      className={`input-field flex items-center justify-between gap-2 ${expForm.date ? "" : "text-slate-400"}`}
                    >
                      <span className="truncate">{fmtDate(expForm.date)}</span>
                      <Icon name="calendar_month" size={18} filled style={{ color: "#047857", flexShrink: 0 }} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Note / Description</label>
                  <textarea
                    rows={2}
                    className="input-field resize-none"
                    placeholder="Additional details…"
                    value={expForm.note}
                    onChange={(e) => setExpForm((f) => ({ ...f, note: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Added By</label>
                  <input
                    className="input-field"
                    placeholder="Your name"
                    value={expForm.addedBy}
                    onChange={(e) => setExpForm((f) => ({ ...f, addedBy: e.target.value }))}
                  />
                </div>
                <button type="submit" disabled={saving} className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${saved ? "bg-emerald-100 text-emerald-800" : "btn-primary"}`}>
                  {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Expense"}</>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {datePickerFor && (
        <DatePicker
          title={datePickerFor === "fund" ? "Select fund date" : "Select expense date"}
          value={datePickerFor === "fund" ? fundForm.date : expForm.date}
          onCancel={() => setDatePickerFor(null)}
          onConfirm={(d) => {
            if (datePickerFor === "fund") setFundForm((f) => ({ ...f, date: d }));
            else setExpForm((f) => ({ ...f, date: d }));
            setDatePickerFor(null);
          }}
        />
      )}

      {/* Entries List */}
      {activeTab === "funds" ? (
        <div className="space-y-2">
          {funds.length === 0 ? (
            <div className="card text-center py-10 text-slate-400">
              <p className="text-sm">No fund entries yet.</p>
            </div>
          ) : funds.map((f) => (
            <div key={f.id} className="card flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <ArrowUpCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{f.donorName || "Anonymous"}</p>
                <p className="text-xs text-slate-400 truncate">
                  {f.date ? format(new Date(f.date), "dd MMM yyyy") : "—"}
                  {f.paymentRef && ` · ${f.paymentRef}`}
                </p>
              </div>
              <span className="font-bold text-emerald-700 text-sm whitespace-nowrap flex-shrink-0">+₹{Number(f.amount || 0).toLocaleString()}</span>
              <button onClick={() => handleDelete("funds", f.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors flex-shrink-0" aria-label="Delete entry">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.length === 0 ? (
            <div className="card text-center py-10 text-slate-400">
              <p className="text-sm">No expense entries yet.</p>
            </div>
          ) : expenses.map((e) => (
            <div key={e.id} className="card flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <ArrowDownCircle className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{e.category}</p>
                <p className="text-xs text-slate-400 truncate">
                  {e.date ? format(new Date(e.date), "dd MMM yyyy") : "—"}
                  {e.note && ` · ${e.note}`}
                </p>
              </div>
              <span className="font-bold text-red-600 text-sm whitespace-nowrap flex-shrink-0">-₹{Number(e.amount || 0).toLocaleString()}</span>
              <button onClick={() => handleDelete("expenses", e.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors flex-shrink-0" aria-label="Delete entry">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
