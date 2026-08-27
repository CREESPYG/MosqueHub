import React, { useEffect, useState } from "react";
import { ref, set, onValue } from "firebase/database";
import { rtdb } from "../../firebase";
import { Clock, Save, Bell, CheckCircle } from "lucide-react";
import TimePicker from "../../components/ui/TimePicker";
import { useConfirm } from "../../contexts/ConfirmContext";
import PreviewRows from "../../components/ui/PreviewRows";

const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha", "Jummah"];

const DEFAULT_TIMINGS = {
  Fajr: { azan: "05:00 AM", iqamah: "05:30 AM" },
  Dhuhr: { azan: "01:15 PM", iqamah: "01:45 PM" },
  Asr: { azan: "04:30 PM", iqamah: "05:00 PM" },
  Maghrib: { azan: "06:15 PM", iqamah: "06:20 PM" },
  Isha: { azan: "07:45 PM", iqamah: "08:00 PM" },
  Jummah: { azan: "01:00 PM", iqamah: "01:30 PM" },
};

export default function TimingManager() {
  const { confirm } = useConfirm();
  const [timings, setTimings] = useState(DEFAULT_TIMINGS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notifyOnSave, setNotifyOnSave] = useState(true);
  const [picker, setPicker] = useState(null); // { prayer, field }

  useEffect(() => {
    const unsub = onValue(ref(rtdb, "timings/azans"), (snap) => {
      if (snap.exists()) {
        setTimings((prev) => ({ ...prev, ...snap.val() }));
      }
    });
    return unsub;
  }, []);

  const handleChange = (prayer, field, value) => {
    setTimings((prev) => ({
      ...prev,
      [prayer]: { ...prev[prayer], [field]: value },
    }));
  };

  const handlePick = (prayer, field, value) => {
    handleChange(prayer, field, value);
    setPicker(null);
  };

  const handleSave = async () => {
    const ok = await confirm({
      title: "Update prayer timings?",
      body: "These timings go live instantly for all users.",
      confirmText: "Update",
      icon: "schedule",
      preview: (
        <PreviewRows
          rows={[
            ...PRAYERS.map((p) => ({
              label: p,
              value: `${timings[p]?.azan || "—"}  →  ${timings[p]?.iqamah || "—"}`,
            })),
            {
              label: "Announce to users",
              value: notifyOnSave ? "Yes — announcement posted" : "No",
            },
          ]}
        />
      ),
    });
    if (!ok) return;
    setSaving(true);
    try {
      await set(ref(rtdb, "timings/azans"), timings);
      await set(ref(rtdb, "timings/lastUpdated"), Date.now());

      if (notifyOnSave) {
        await set(ref(rtdb, "announcements/timing_update"), {
          title: "Prayer Timings Updated",
          body: "The mosque committee has updated the prayer schedule. Please check the latest timings.",
          date: new Date().toISOString(),
          type: "timing",
        });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save timings:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Timing Manager</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Update Azan & Iqamah times. Changes go live instantly for all users.
          </p>
        </div>
        <Clock className="w-8 h-8 text-emerald-600 opacity-50" />
      </div>

      {/* Prayer Forms */}
      <div className="space-y-4">
        {PRAYERS.map((prayer) => (
          <div key={prayer} className="card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                <span className="text-sm font-bold text-emerald-700">
                  {prayer.slice(0, 1)}
                </span>
              </div>
              <h3 className="font-bold text-slate-800">
                {prayer}
                {prayer === "Jummah" && (
                  <span className="ml-2 text-xs font-normal text-emerald-600">(Fridays)</span>
                )}
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Azan Time</label>
                <button
                  type="button"
                  onClick={() => setPicker({ prayer, field: "azan" })}
                  className="input-field flex items-center justify-between cursor-pointer hover:border-emerald-300 transition-colors"
                >
                  <span className={`font-mono font-bold text-sm ${timings[prayer]?.azan ? "text-emerald-700" : "text-slate-300"}`}>
                    {timings[prayer]?.azan || "Set time"}
                  </span>
                  <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                </button>
              </div>
              <div>
                <label className="label">Iqamah Time</label>
                <button
                  type="button"
                  onClick={() => setPicker({ prayer, field: "iqamah" })}
                  className="input-field flex items-center justify-between cursor-pointer hover:border-emerald-300 transition-colors"
                >
                  <span className={`font-mono font-bold text-sm ${timings[prayer]?.iqamah ? "text-emerald-700" : "text-slate-300"}`}>
                    {timings[prayer]?.iqamah || "Set time"}
                  </span>
                  <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Time Picker Modal */}
      {picker && (
        <TimePicker
          title={`${picker.field === "azan" ? "Azan" : "Iqamah"} Time`}
          subtitle={picker.prayer}
          value={timings[picker.prayer]?.[picker.field] || "05:00 AM"}
          onCancel={() => setPicker(null)}
          onConfirm={(t) => handlePick(picker.prayer, picker.field, t)}
        />
      )}

      {/* Notify toggle */}
      <div className="card flex items-center gap-4">
        <Bell className={`w-5 h-5 flex-shrink-0 ${notifyOnSave ? "text-emerald-600" : "text-slate-300"}`} />
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-800">
            Announce Update to Users
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Post an announcement when timings are saved so users are notified.
          </p>
        </div>
        <button
          onClick={() => setNotifyOnSave((v) => !v)}
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0
            ${notifyOnSave ? "bg-emerald-600" : "bg-slate-200"}`}
        >
          <div
            className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
              ${notifyOnSave ? "translate-x-6" : "translate-x-1"}`}
          />
        </button>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all
          ${saved
            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
            : "btn-primary"
          }`}
      >
        {saved ? (
          <>
            <CheckCircle className="w-5 h-5" />
            Timings Saved Successfully!
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            {saving ? "Saving…" : "Save & Publish Timings"}
          </>
        )}
      </button>
    </div>
  );
}
