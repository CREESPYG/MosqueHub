import React, { useMemo, useState } from "react";
import Icon from "./Icon";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const toYMD = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * MD3-style calendar date picker modal.
 * Value format: "YYYY-MM-DD"
 */
export default function DatePicker({ title, subtitle, value = "", onCancel, onConfirm }) {
  const parseValue = () => {
    const m = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const d = new Date(+m[1], +m[2] - 1, +m[3]);
      if (!isNaN(d)) return d;
    }
    return null;
  };

  const initial = parseValue() || new Date();
  const [view, setView] = useState({ y: initial.getFullYear(), m: initial.getMonth() });
  const [selected, setSelected] = useState(parseValue() || initial);

  const today = new Date();
  const todayYMD = toYMD(today);

  const grid = useMemo(() => {
    const first = new Date(view.y, view.m, 1);
    const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < first.getDay(); i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [view]);

  const moveMonth = (dir) => {
    setView((v) => {
      let m = v.m + dir;
      let y = v.y;
      if (m < 0) { m = 11; y -= 1; }
      if (m > 11) { m = 0; y += 1; }
      return { y, m };
    });
  };

  const isSelected = (d) => selected && selected.getFullYear() === view.y && selected.getMonth() === view.m && selected.getDate() === d;

  return (
    <div
      className="modal-root fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-5 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-bold text-slate-800 text-sm">{title || "Select date"}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Month / year header */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => moveMonth(-1)}
            className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 active:scale-90 transition-all flex items-center justify-center"
            aria-label="Previous month"
          >
            <Icon name="chevron_left" size={20} filled />
          </button>
          <div className="text-center">
            <p className="font-extrabold text-slate-800">{MONTHS[view.m]}</p>
            <p className="text-xs text-slate-400 font-medium">{view.y}</p>
          </div>
          <button
            onClick={() => moveMonth(1)}
            className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 active:scale-90 transition-all flex items-center justify-center"
            aria-label="Next month"
          >
            <Icon name="chevron_right" size={20} filled />
          </button>
        </div>

        {/* Weekday row */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((w) => (
            <div key={w} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wide py-1">
              {w}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-y-0.5 mb-4">
          {grid.map((d, i) => {
            if (d === null) return <div key={`b${i}`} />;
            const ymd = `${view.y}-${String(view.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const sel = isSelected(d);
            const isToday = ymd === todayYMD;
            return (
              <button
                key={d}
                onClick={() => setSelected(new Date(view.y, view.m, d))}
                className={`h-10 rounded-xl text-sm font-semibold transition-all active:scale-90
                  ${sel
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                    : isToday
                      ? "text-emerald-700 ring-2 ring-emerald-500/60 bg-emerald-50 hover:bg-emerald-100"
                      : "text-slate-700 hover:bg-slate-100"}`}
              >
                {d}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => { setSelected(new Date()); setView({ y: today.getFullYear(), m: today.getMonth() }); }}
            className="px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-semibold text-xs hover:bg-emerald-100 active:scale-95 transition-all"
          >
            Today
          </button>
          <div className="flex gap-2 flex-1 justify-end">
            <button
              onClick={onCancel}
              className="px-5 py-2.5 rounded-2xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 active:scale-95 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(toYMD(selected))}
              className="px-5 py-2.5 rounded-2xl btn-primary font-semibold text-sm flex items-center justify-center gap-1.5"
            >
              <Icon name="check" size={16} />
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}