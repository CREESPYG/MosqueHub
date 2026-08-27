import React, { createContext, useContext, useRef, useState, useCallback } from "react";
import Icon from "../components/ui/Icon";

const ConfirmContext = createContext(null);

/**
 * ConfirmProvider — wraps the app and provides a `confirm(options)` function
 * that returns a Promise<boolean>.
 *
 * Usage:
 *   const { confirm } = useConfirm();
 *   const ok = await confirm({ title: "Delete?", body: "...", danger: true });
 *   const ok = await confirm({ title: "Save?", preview: <PreviewRows .../>, confirmText: "Save" });
 *   if (ok) { ... }
 */
export function ConfirmProvider({ children }) {
  const [dialog, setDialog]   = useState(null);
  const resolveRef            = useRef(null);

  const confirm = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setDialog({
        title:       opts.title       || "Are you sure?",
        body:        opts.body        || "",
        preview:     opts.preview     || null,
        confirmText: opts.confirmText || "Confirm",
        cancelText:  opts.cancelText  || "Cancel",
        danger:      opts.danger      || false,
        icon:        opts.icon        || (opts.danger ? "warning" : "help"),
      });
    });
  }, []);

  const handle = (result) => {
    resolveRef.current?.(result);
    setDialog(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {/* ── Confirmation Modal ── */}
      {dialog && (
        <div
          className="modal-root fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4"
          onClick={() => handle(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />

          {/* Card */}
          <div
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
            style={{ animation: "slideUp 0.25s ease-out" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top accent */}
            <div
              className="h-1.5 w-full"
              style={{ background: dialog.danger ? "#ef4444" : "#047857" }}
            />

            {/* Body */}
            <div className="px-6 pt-6 pb-5">
              {/* Icon circle */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{
                  background: dialog.danger ? "#fef2f2" : "#ecfdf5",
                }}
              >
                <Icon
                  name={dialog.icon}
                  size={28}
                  filled
                  style={{ color: dialog.danger ? "#ef4444" : "#047857" }}
                />
              </div>

              <h2 className="text-lg font-extrabold text-slate-800 text-center mb-2">
                {dialog.title}
              </h2>

              {dialog.body && (
                <p className="text-sm text-slate-500 text-center leading-relaxed">
                  {dialog.body}
                </p>
              )}

              {dialog.preview && (
                <div
                  className="mt-4 rounded-2xl bg-slate-50 border border-slate-100 p-3 text-left
                             max-h-52 overflow-y-auto no-scrollbar"
                >
                  {dialog.preview}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => handle(false)}
                className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-700 font-semibold text-sm
                           hover:bg-slate-200 active:scale-95 transition-all"
              >
                {dialog.cancelText}
              </button>
              <button
                onClick={() => handle(true)}
                className="flex-1 py-3 rounded-2xl font-semibold text-sm
                           active:scale-95 transition-all text-white"
                style={{ background: dialog.danger ? "#ef4444" : "#047857" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = dialog.danger ? "#dc2626" : "#059669")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = dialog.danger ? "#ef4444" : "#047857")
                }
              >
                {dialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return ctx;
};
