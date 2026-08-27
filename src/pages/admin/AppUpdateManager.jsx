import React, { useEffect, useState } from "react";
import { ref, onValue, set } from "firebase/database";
import { rtdb } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";
import { useConfirm } from "../../contexts/ConfirmContext";
import { CURRENT_APP_VERSION, CURRENT_VERSION_CODE } from "../../contexts/UpdateContext";
import { notificationService } from "../../services/notificationService";
import Icon from "../../components/ui/Icon";

export default function AppUpdateManager() {
  const { isSuperAdmin } = useAuth();
  const { confirm } = useConfirm();

  const [currentPublished, setCurrentPublished] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    version: "1.1.0",
    versionCode: 3,
    downloadUrl: "https://mosque-hub-putki-default-rtdb.firebaseio.com/download/MosqueHub.apk",
    releaseNotes: "- Added smooth scrollable wheel Time Picker for prayer timings\n- Added custom profile pictures & preset Islamic avatars\n- Improved in-device background prayer notifications\n- New 3D Mosque App Icon & Splash Screen",
    forceUpdate: false,
    sendNotification: true,
  });

  useEffect(() => {
    const unsub = onValue(ref(rtdb, "app_update"), (snap) => {
      if (snap.exists()) {
        const val = snap.val();
        setCurrentPublished(val);
        setForm((prev) => ({
          ...prev,
          version: val.version || prev.version,
          versionCode: (val.versionCode || 2) + 1,
          downloadUrl: val.downloadUrl || prev.downloadUrl,
          releaseNotes: val.releaseNotes || prev.releaseNotes,
          forceUpdate: !!val.forceUpdate,
        }));
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!form.version.trim() || !form.downloadUrl.trim()) {
      alert("Please fill in the version and download URL.");
      return;
    }

    const ok = await confirm({
      title: `Publish App Update v${form.version}?`,
      body: `This update will be sent directly to all users. Users opening the app will receive an in-app update prompt to download the new APK.`,
      confirmText: "Publish Update",
      icon: "system_update",
    });
    if (!ok) return;

    setPublishing(true);
    try {
      const updateData = {
        version: form.version.trim(),
        versionCode: Number(form.versionCode),
        downloadUrl: form.downloadUrl.trim(),
        releaseNotes: form.releaseNotes.trim(),
        forceUpdate: form.forceUpdate,
        publishedAt: new Date().toISOString(),
      };

      await set(ref(rtdb, "app_update"), updateData);

      // Also broadcast as a high priority announcement
      if (form.sendNotification) {
        const notifId = `update_${Date.now()}`;
        await set(ref(rtdb, `notifications/${notifId}`), {
          title: `🚀 New App Update Available: v${form.version}`,
          body: `A new version of Mosque Hub is available with new features and improvements. Update now from inside the app!`,
          type: "general",
          sentAt: Date.now(),
          sentByName: "System Admin",
        });

        // Trigger local notification preview
        notificationService.showInstantNotification({
          title: `🚀 Mosque Hub Update v${form.version} Available`,
          body: `Tap to update to the latest version of Mosque Hub!`,
        });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to publish app update:", err);
      alert("Failed to publish update: " + err.message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">APK Update Manager</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Push instant in-app updates directly to user devices without republishing to stores.
          </p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
          <Icon name="system_update" size={24} filled style={{ color: "#047857" }} />
        </div>
      </div>

      {/* Version Status Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card border border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Current Installed APK
            </p>
          </div>
          <p className="text-xl font-extrabold text-slate-800">v{CURRENT_APP_VERSION}</p>
          <p className="text-xs text-slate-400 mt-0.5">Build Code: {CURRENT_VERSION_CODE}</p>
        </div>

        <div className="card border border-slate-100 bg-emerald-50/40">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Live Cloud Version
            </p>
          </div>
          <p className="text-xl font-extrabold text-emerald-800">
            {loading ? "Loading…" : currentPublished ? `v${currentPublished.version}` : "Not set"}
          </p>
          <p className="text-xs text-emerald-700/80 mt-0.5">
            Build Code: {currentPublished?.versionCode || "—"}
          </p>
        </div>
      </div>

      {/* Form to Publish New Version */}
      <form onSubmit={handlePublish} className="card space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Icon name="cloud_upload" size={20} filled style={{ color: "#047857" }} />
          <h2 className="font-bold text-slate-800 text-sm">Publish New APK Update</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">New Version Name</label>
            <input
              type="text"
              className="input-field font-mono font-bold"
              placeholder="1.1.0"
              value={form.version}
              onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Version Code (Integer)</label>
            <input
              type="number"
              className="input-field font-mono font-bold"
              placeholder="3"
              value={form.versionCode}
              onChange={(e) => setForm((f) => ({ ...f, versionCode: parseInt(e.target.value) || 0 }))}
              required
            />
          </div>
        </div>

        <div>
          <label className="label">Direct APK Download Link (URL)</label>
          <input
            type="url"
            className="input-field text-xs font-mono"
            placeholder="https://.../MosqueHub.apk"
            value={form.downloadUrl}
            onChange={(e) => setForm((f) => ({ ...f, downloadUrl: e.target.value }))}
            required
          />
          <p className="text-[11px] text-slate-400 mt-1">
            When users tap "Update Now", their device will download and launch this APK directly.
          </p>
        </div>

        <div>
          <label className="label">Release Notes / What's New</label>
          <textarea
            rows={4}
            className="input-field text-xs font-sans"
            placeholder="- Added new features&#10;- Bug fixes"
            value={form.releaseNotes}
            onChange={(e) => setForm((f) => ({ ...f, releaseNotes: e.target.value }))}
            required
          />
        </div>

        {/* Toggles */}
        <div className="space-y-3 pt-2">
          <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
            <input
              type="checkbox"
              checked={form.forceUpdate}
              onChange={(e) => setForm((f) => ({ ...f, forceUpdate: e.target.checked }))}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <p className="text-xs font-bold text-slate-800">Mandatory / Force Update</p>
              <p className="text-[11px] text-slate-400">Users must update to continue using the app.</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
            <input
              type="checkbox"
              checked={form.sendNotification}
              onChange={(e) => setForm((f) => ({ ...f, sendNotification: e.target.checked }))}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <p className="text-xs font-bold text-slate-800">Send Push Notification to Phones</p>
              <p className="text-[11px] text-slate-400">Broadcasts a notification to phone notification panels.</p>
            </div>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={publishing}
          className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md
            ${saved
              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
              : "btn-primary"
            }`}
        >
          {saved ? (
            <>
              <Icon name="check_circle" size={18} filled />
              Update Broadcasted to All Users!
            </>
          ) : (
            <>
              <Icon name="send" size={18} />
              {publishing ? "Broadcasting Update…" : "Publish Update to All Devices"}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
