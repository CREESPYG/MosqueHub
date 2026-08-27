import React from "react";
import Icon from "../ui/Icon";

export default function UpdateModal({
  updateInfo,
  currentVersion,
  onClose,
  onUpdate,
}) {
  if (!updateInfo) return null;

  const { version, releaseNotes, downloadUrl, forceUpdate } = updateInfo;

  const notesList = releaseNotes
    ? releaseNotes.split("\n").filter((l) => l.trim().length > 0)
    : ["Performance improvements and bug fixes.", "Latest prayer timings and announcements."];

  return (
    <div
      className="modal-root fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={() => !forceUpdate && onClose()}
    >
      <div
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Graphic */}
        <div className="bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-900 text-white p-6 text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-white/10" />
          <div className="w-16 h-16 rounded-2xl bg-white/15 border-2 border-white/20 mx-auto flex items-center justify-center mb-3 shadow-lg">
            <Icon name="system_update" size={32} filled style={{ color: "white" }} />
          </div>
          <h2 className="text-xl font-extrabold text-white">App Update Available!</h2>
          <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-xs font-semibold text-emerald-200">
            <span>v{currentVersion}</span>
            <Icon name="arrow_forward" size={12} />
            <span className="text-white font-bold">v{version}</span>
          </div>
        </div>

        {/* Changelog Content */}
        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              What's New in this Version:
            </p>
            <div className="space-y-2 bg-slate-50 rounded-2xl p-3.5 border border-slate-100 max-h-48 overflow-y-auto">
              {notesList.map((note, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span className="flex-1">{note.replace(/^[-•*]\s*/, "")}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() => onUpdate(downloadUrl)}
              className="w-full py-3.5 rounded-2xl btn-primary font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20 active:scale-[0.98] transition-all"
            >
              <Icon name="download" size={18} filled />
              Update Now (Download APK)
            </button>

            {!forceUpdate && (
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-slate-400 hover:text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Remind Me Later
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
