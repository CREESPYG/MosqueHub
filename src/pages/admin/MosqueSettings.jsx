import React, { useEffect, useState } from "react";
import { ref, set } from "firebase/database";
import { rtdb } from "../../firebase";
import { useMosqueSettings } from "../../hooks/useMosqueSettings";
import { useConfirm } from "../../contexts/ConfirmContext";
import PreviewRows from "../../components/ui/PreviewRows";
import { Save, CheckCircle, Store, Eye } from "lucide-react";
import Icon from "../../components/ui/Icon";

export default function MosqueSettings() {
  const settings = useMosqueSettings();
  const { confirm } = useConfirm();
  const [form, setForm] = useState({ name: settings.name, location: settings.location });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm({ name: settings.name, location: settings.location });
  }, [settings.name, settings.location]);

  const handleSave = async (e) => {
    e.preventDefault();
    const ok = await confirm({
      title: "Save mosque settings?",
      body: "The new name and location go live instantly for all users.",
      confirmText: "Save",
      icon: "store",
      preview: (
        <PreviewRows
          rows={[
            { label: "Mosque name", value: form.name.trim() || settings.name },
            { label: "Location", value: form.location.trim() || settings.location || "—" },
          ]}
        />
      ),
    });
    if (!ok) return;
    setSaving(true);
    try {
      await set(ref(rtdb, "settings/mosque"), {
        name: form.name.trim() || settings.name,
        location: form.location.trim() || settings.location,
        updatedAt: Date.now(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save mosque settings:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Mosque Settings</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Change the mosque name shown in the app header and on the Home page. Goes live instantly.
          </p>
        </div>
        <Store className="w-8 h-8 text-emerald-600 opacity-40" />
      </div>

      <form onSubmit={handleSave} className="card space-y-4">
        <div>
          <label className="label">Mosque Name</label>
          <input
            required
            className="input-field"
            placeholder="e.g. Masjid Al-Putki"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Shown in the mobile top bar, side menu, and Home greeting.
          </p>
        </div>
        <div>
          <label className="label">Location</label>
          <input
            className="input-field"
            placeholder="e.g. Jharkhand"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Shown next to the mosque name on the Home page.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2
            ${saved ? "bg-emerald-100 text-emerald-800" : "btn-primary"}`}
        >
          {saved ? (
            <><CheckCircle className="w-5 h-5" /> Settings Saved!</>
          ) : (
            <><Save className="w-5 h-5" /> {saving ? "Saving…" : "Save Mosque Settings"}</>
          )}
        </button>
      </form>

      {/* Live preview */}
      <div className="card">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Eye className="w-4 h-4" /> Live Preview
        </p>
        <div className="rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-slate-900 text-white p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <Icon name="mosque" size={16} filled style={{ color: "white" }} />
            </div>
            <span className="font-bold text-sm truncate">{form.name || "Mosque Name"}</span>
          </div>
          <p className="text-[11px] text-emerald-100/80 mt-2">
            Assalamu Alaikum · {form.name || "Mosque Name"}, {form.location || "Location"}
          </p>
        </div>
      </div>
    </div>
  );
}