import React, { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

const pad = (n) => String(n).padStart(2, "0");

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const PERIODS = ["AM", "PM"];

const ITEM_HEIGHT = 44; // px per row in scroll wheel

/* ── Scrollable Wheel Column ────────────────────────── */
function WheelColumn({ items, selectedValue, onSelect, formatItem = (v) => v, label }) {
  const containerRef = useRef(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  // Scroll to selected item on mount or value change
  useEffect(() => {
    if (isScrollingRef.current) return;
    const index = items.indexOf(selectedValue);
    if (index !== -1 && containerRef.current) {
      containerRef.current.scrollTop = index * ITEM_HEIGHT;
    }
  }, [selectedValue, items]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    isScrollingRef.current = true;
    clearTimeout(scrollTimeoutRef.current);

    scrollTimeoutRef.current = setTimeout(() => {
      if (!containerRef.current) return;
      const top = containerRef.current.scrollTop;
      const index = Math.round(top / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(items.length - 1, index));
      const targetValue = items[clampedIndex];

      if (targetValue !== selectedValue) {
        onSelect(targetValue);
      }
      // Smooth snap
      containerRef.current.scrollTo({
        top: clampedIndex * ITEM_HEIGHT,
        behavior: "smooth",
      });
      isScrollingRef.current = false;
    }, 120);
  };

  return (
    <div className="flex flex-col items-center flex-1 min-w-0">
      {label && (
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
          {label}
        </span>
      )}
      <div className="relative w-full h-[176px] overflow-hidden select-none">
        {/* Top & Bottom fade gradient overlays */}
        <div className="absolute inset-x-0 top-0 h-[66px] bg-gradient-to-b from-white via-white/80 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-x-0 bottom-0 h-[66px] bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-10" />

        {/* Center Selection Lens */}
        <div
          className="absolute inset-x-1 top-[66px] h-[44px] rounded-2xl bg-emerald-500/10 border border-emerald-500/30 pointer-events-none z-0 shadow-sm"
        />

        {/* Scrollable list */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto snap-y snap-mandatory no-scrollbar py-[66px]"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {items.map((item) => {
            const isSelected = item === selectedValue;
            return (
              <div
                key={item}
                onClick={() => {
                  onSelect(item);
                  const idx = items.indexOf(item);
                  if (containerRef.current) {
                    containerRef.current.scrollTo({
                      top: idx * ITEM_HEIGHT,
                      behavior: "smooth",
                    });
                  }
                }}
                className={`h-[44px] flex items-center justify-center snap-center cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? "text-emerald-700 font-extrabold text-2xl scale-110"
                    : "text-slate-400 font-semibold text-lg hover:text-slate-600"
                }`}
              >
                <span className="font-mono tabular-nums">{formatItem(item)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Modern Scrollable Wheel Time Picker for Phone APK & Web
 */
export default function TimePicker({
  title,
  subtitle,
  value = "05:00 AM",
  onCancel,
  onConfirm,
}) {
  const parse = (v) => {
    const m = String(v || "").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!m) return { hour: 12, minute: 0, period: "AM" };
    let h = parseInt(m[1], 10);
    if (h < 1 || h > 12) h = 12;
    const min = parseInt(m[2], 10) % 60;
    return { hour: h, minute: min, period: m[3].toUpperCase() === "PM" ? "PM" : "AM" };
  };

  const initial = parse(value);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);
  const [period, setPeriod] = useState(initial.period);

  const formattedTime = `${pad(hour)}:${pad(minute)} ${period}`;

  const handleConfirm = () => {
    onConfirm(formattedTime);
  };

  // Quick preset adjust
  const addMinutes = (delta) => {
    let totalMinutes = (hour % 12) * 60 + minute + (period === "PM" ? 720 : 0) + delta;
    if (totalMinutes < 0) totalMinutes += 1440;
    totalMinutes = totalMinutes % 1440;

    let newH = Math.floor(totalMinutes / 60);
    const newM = totalMinutes % 60;
    let newP = newH >= 12 ? "PM" : "AM";
    newH = newH % 12;
    if (newH === 0) newH = 12;

    setHour(newH);
    setMinute(newM);
    setPeriod(newP);
  };

  return (
    <div
      className="modal-root fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Live Time Banner */}
        <div className="bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-900 text-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-sm text-emerald-100">{title || "Select Time"}</p>
              {subtitle && <p className="text-xs text-emerald-200/70">{subtitle}</p>}
            </div>
            <button
              onClick={onCancel}
              className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition-colors"
            >
              <Icon name="close" size={18} />
            </button>
          </div>

          {/* Large Live Digital Display */}
          <div className="mt-3 flex items-baseline justify-center gap-1.5 py-1">
            <span className="font-mono text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
              {pad(hour)}:{pad(minute)}
            </span>
            <span className="text-xl font-bold text-emerald-300 ml-1">
              {period}
            </span>
          </div>
          <p className="text-center text-[11px] text-emerald-200/60 mt-0.5">
            Swipe or scroll columns to change digits
          </p>
        </div>

        {/* Scrollable Wheel Pickers */}
        <div className="p-4 pt-3">
          <div className="flex items-center justify-center gap-2 bg-slate-50/80 rounded-2xl p-2 border border-slate-100">
            {/* Hours Wheel */}
            <WheelColumn
              items={HOURS}
              selectedValue={hour}
              onSelect={setHour}
              formatItem={(v) => pad(v)}
              label="Hour"
            />

            <span className="text-2xl font-extrabold text-slate-300 pb-2">:</span>

            {/* Minutes Wheel */}
            <WheelColumn
              items={MINUTES}
              selectedValue={minute}
              onSelect={setMinute}
              formatItem={(v) => pad(v)}
              label="Minute"
            />

            <div className="w-px h-28 bg-slate-200 self-center mx-1" />

            {/* AM/PM Column */}
            <WheelColumn
              items={PERIODS}
              selectedValue={period}
              onSelect={setPeriod}
              label="Period"
            />
          </div>

          {/* Quick Adjustment Presets */}
          <div className="flex items-center justify-between gap-1.5 mt-3 px-1">
            <button
              type="button"
              onClick={() => addMinutes(-15)}
              className="flex-1 py-1.5 px-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold active:scale-95 transition-all"
            >
              -15m
            </button>
            <button
              type="button"
              onClick={() => addMinutes(-5)}
              className="flex-1 py-1.5 px-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold active:scale-95 transition-all"
            >
              -5m
            </button>
            <button
              type="button"
              onClick={() => addMinutes(5)}
              className="flex-1 py-1.5 px-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold active:scale-95 transition-all"
            >
              +5m
            </button>
            <button
              type="button"
              onClick={() => addMinutes(15)}
              className="flex-1 py-1.5 px-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold active:scale-95 transition-all"
            >
              +15m
            </button>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 pt-1 flex gap-3 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm active:scale-95 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-3 rounded-2xl btn-primary font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
          >
            <Icon name="check" size={18} />
            Set Time
          </button>
        </div>
      </div>
    </div>
  );
}