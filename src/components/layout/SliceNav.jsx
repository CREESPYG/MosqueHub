import React, { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import Icon from "../ui/Icon";

/* ── MD3-style pill tab ──────────────────────────── */
function NavItem({ to, iconOutline, iconFilled, icon, label, exact, onClick }) {
  const ico = icon || iconOutline;
  const icoFilled = iconFilled || icon;

  return (
    <NavLink
      to={to}
      end={exact}
      onClick={onClick}
      className="flex-1 flex flex-col items-center gap-0.5 py-1 min-w-0"
      style={{ textDecoration: "none" }}
    >
      {({ isActive }) => (
        <>
          <div
            className="flex items-center justify-center transition-all duration-200"
            style={{
              width: 64,
              height: 32,
              borderRadius: 16,
              background: isActive ? "rgba(4,120,87,0.12)" : "transparent",
            }}
          >
            <Icon
              name={isActive ? icoFilled : ico}
              size={22}
              filled={isActive}
              weight={isActive ? 600 : 400}
              style={{ color: isActive ? "#047857" : "#6b7280" }}
            />
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? "#047857" : "#6b7280",
              letterSpacing: "0.01em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "100%",
            }}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}

/* ── "Open tab line" slide-up sheet ──────────────── */
function MoreSheet({ open, onClose, chips, onSignOut }) {
  const [dragY, setDragY] = useState(0);
  const startRef  = useRef(null);
  const lineRef   = useRef(null);
  const sheetRef  = useRef(null);
  const location  = useLocation();
  const navigate  = useNavigate();

  useEffect(() => { if (open) setDragY(0); }, [open]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const onTouchStart = (e) => {
    const rect = sheetRef.current?.getBoundingClientRect();
    if (!rect) return;
    /* only drag-to-close from the handle / header area, not the chip line */
    if (e.touches[0].clientY - rect.top > 130) return;
    startRef.current = { y: e.touches[0].clientY };
  };
  const onTouchMove = (e) => {
    if (!startRef.current) return;
    setDragY(Math.max(0, e.touches[0].clientY - startRef.current.y));
  };
  const onTouchEnd = () => {
    if (!startRef.current) return;
    const dy = dragY;
    startRef.current = null;
    if (dy > 90) onClose();
    setDragY(0);
  };

  const slideLine = (dir) => {
    if (!lineRef.current) return;
    lineRef.current.scrollBy({ left: dir * 140, behavior: "smooth" });
  };

  const go = (to) => { onClose(); navigate(to); };

  return (
    <div className="fixed inset-0 z-[60] lg:hidden md:hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={sheetRef}
        className="absolute bottom-0 inset-x-0 bg-white rounded-t-3xl shadow-2xl flex flex-col"
        style={{
          transform: `translateY(${dragY}px)`,
          animation: "slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          touchAction: "pan-y",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Drag handle */}
        <div className="pt-2.5 pb-1 flex justify-center cursor-grab">
          <div className="w-10 h-1.5 rounded-full bg-slate-200" />
        </div>

        {/* Title */}
        <div className="px-5 pb-3 flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-800 text-sm">Open tab line</p>
            <p className="text-[11px] text-slate-400">Swipe sideways to explore</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Slideable chip tab line (right ⇄ left) */}
        <div className="flex items-center gap-1 px-3 pb-5">
          <button
            onClick={() => slideLine(-1)}
            aria-label="Slide left"
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
          >
            <Icon name="chevron_left" size={18} />
          </button>

          <div
            ref={lineRef}
            className="flex-1 overflow-x-auto no-scrollbar snap-x flex gap-2 py-1"
            style={{ scrollbarWidth: "none" }}
          >
            {chips.map((c) => {
              const active = c.to && location.pathname === c.to;
              return (
                <button
                  key={c.label}
                  onClick={() => (c.action === "signout" ? onSignOut() : go(c.to))}
                  className="snap-start shrink-0 flex items-center gap-2 pl-3 pr-4 h-11 rounded-2xl font-semibold text-sm transition-all active:scale-95"
                  style={{
                    background: active ? "rgba(4,120,87,0.12)" : c.danger ? "#fef2f2" : "#f1f5f9",
                    color: active ? "#047857" : c.danger ? "#dc2626" : "#334155",
                    border: active ? "1px solid rgba(4,120,87,0.35)" : c.danger ? "1px solid #fecaca" : "1px solid transparent",
                  }}
                >
                  <Icon name={c.icon} size={18} filled={active} />
                  {c.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => slideLine(1)}
            aria-label="Slide right"
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
          >
            <Icon name="chevron_right" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Slice-style bottom nav: 4 slots + raised center "open tab line" button ── */
export default function SliceBottomNav({ slots, chips, onSignOut }) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav
        className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-glass border-t border-slate-100"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          boxShadow: "0 -1px 0 rgba(0,0,0,0.06), 0 -4px 12px rgba(0,0,0,0.06)",
        }}
      >
        <div
          className="flex items-stretch justify-around"
          style={{ height: "3.75rem", paddingTop: "0.25rem", paddingBottom: "0.5rem", paddingLeft: "0.25rem", paddingRight: "0.25rem" }}
        >
          {slots.slice(0, 2).map((item) => (
            <NavItem key={item.to} {...item} />
          ))}

          {/* Center: raised "open tab line" button (Slice-style) */}
          <div className="relative flex-1 flex flex-col items-center justify-end pb-0.5">
            <button
              onClick={() => setMoreOpen(true)}
              aria-label="Open tab line"
              className="w-14 h-14 -mt-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center active:scale-95 transition-all"
              style={{ boxShadow: "0 6px 16px rgba(4,120,87,0.45)" }}
            >
              <Icon name="add" size={28} filled style={{ color: "white" }} />
            </button>
            <span className="text-[10px] font-medium text-slate-500 mt-0.5">More</span>
          </div>

          {slots.slice(2, 4).map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </div>
      </nav>

      <MoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        chips={chips}
        onSignOut={onSignOut}
      />
    </>
  );
}