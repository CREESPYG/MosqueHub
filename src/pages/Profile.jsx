import React, { useEffect, useRef, useState } from "react";
import { ref, onValue } from "firebase/database";
import { rtdb } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { useConfirm } from "../contexts/ConfirmContext";
import { useMosqueSettings } from "../hooks/useMosqueSettings";
import { format, subDays } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { useAppUpdate } from "../contexts/UpdateContext";
import Icon from "../components/ui/Icon";

const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

// Curated Islamic & Geometric Preset Avatars
const PRESET_AVATARS = [
  { id: "mosque", icon: "mosque", label: "Mosque", color: "#047857", bg: "#ecfdf5" },
  { id: "crescent", icon: "bedtime", label: "Crescent", color: "#b45309", bg: "#fffbeb" },
  { id: "book", icon: "menu_book", label: "Quran", color: "#2563eb", bg: "#eff6ff" },
  { id: "star", icon: "star", label: "Star", color: "#7c3aed", bg: "#f5f3ff" },
  { id: "shield", icon: "shield", label: "Faith", color: "#059669", bg: "#d1fae5" },
  { id: "person", icon: "person", label: "Member", color: "#0f766e", bg: "#f0fdfa" },
  { id: "heart", icon: "favorite", label: "Charity", color: "#e11d48", bg: "#fff1f2" },
  { id: "crown", icon: "workspace_premium", label: "Leader", color: "#d97706", bg: "#fef3c7" },
];

function calculateStreak(trackerData) {
  if (!trackerData) return 0;
  let streak = 0;
  let date = new Date();
  while (true) {
    const key = format(date, "yyyy-MM-dd");
    const dayData = trackerData[key];
    if (!dayData) break;
    const completed = PRAYERS.filter((p) => dayData[p]).length;
    if (completed < 5) break;
    streak++;
    date = subDays(date, 1);
  }
  return streak;
}

export default function Profile() {
  const { currentUser, profile, isAdmin, isSuperAdmin, openAuthModal, updateUserProfile, signOut } = useAuth();
  const { confirm } = useConfirm();
  const { name: mosqueName } = useMosqueSettings();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({});
  const [tracker, setTracker] = useState(null);

  // Avatar Modal State
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  // App Update State
  const { currentVersion, checkForUpdate, hasUpdate } = useAppUpdate() || {};
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateMsg, setUpdateMsg] = useState(null);

  /* Load prayer tracker for today/streak stats */
  useEffect(() => {
    if (!currentUser) return;
    const unsub = onValue(
      ref(rtdb, `users/${currentUser.uid}/prayerTracker`),
      (snap) => setTracker(snap.exists() ? snap.val() : {})
    );
    return unsub;
  }, [currentUser]);

  const displayName = profile?.displayName || currentUser?.displayName || "Guest";
  const email       = profile?.email       || currentUser?.email       || "";
  const photoURL    = profile?.photoURL    || currentUser?.photoURL    || "";
  const joinedAt    = profile?.createdAt   || currentUser?.metadata?.creationTime || null;

  const today = format(new Date(), "yyyy-MM-dd");
  const todayData = tracker?.[today] || {};
  const completedToday = PRAYERS.filter((p) => todayData[p]).length;
  const streak = calculateStreak(tracker);

  const startEdit = () => {
    setForm({
      displayName: displayName || "",
      phone:       profile?.phone || "",
      city:        profile?.city || "",
    });
    setEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUserProfile({
        displayName: form.displayName.trim() || displayName,
        phone:       form.phone.trim(),
        city:        form.city.trim(),
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); setEditing(false); }, 1200);
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setSaving(false);
    }
  };

  // Avatar Upload & Selection
  const handleSelectPresetAvatar = async (preset) => {
    // Generate a clean SVG data URI for the preset avatar
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <rect width="160" height="160" rx="80" fill="${preset.bg}"/>
      <circle cx="80" cy="80" r="65" fill="${preset.color}" opacity="0.15"/>
      <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="64" fill="${preset.color}">
        ${preset.id === "mosque" ? "🕌" : preset.id === "crescent" ? "🌙" : preset.id === "book" ? "📖" : preset.id === "star" ? "⭐" : preset.id === "shield" ? "🛡️" : preset.id === "heart" ? "💚" : preset.id === "crown" ? "👑" : "👤"}
      </text>
    </svg>`;
    const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

    setUploadingAvatar(true);
    try {
      await updateUserProfile({ photoURL: dataUri });
      setAvatarModalOpen(false);
    } catch (err) {
      console.error("Failed to update avatar:", err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCustomUrlSave = async (e) => {
    e.preventDefault();
    if (!customAvatarUrl.trim()) return;
    setUploadingAvatar(true);
    try {
      await updateUserProfile({ photoURL: customAvatarUrl.trim() });
      setCustomAvatarUrl("");
      setAvatarModalOpen(false);
    } catch (err) {
      console.error("Failed to update avatar URL:", err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (< 4MB)
    if (file.size > 4 * 1024 * 1024) {
      alert("Image is too large. Please select an image under 4MB.");
      return;
    }

    setUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        // Resize to 200x200 max to keep RTDB payload tiny (< 30KB)
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const size = 200;
        canvas.width = size;
        canvas.height = size;

        // Draw cropped square
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;
        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        try {
          await updateUserProfile({ photoURL: dataUrl });
          setAvatarModalOpen(false);
        } catch (err) {
          console.error("Failed to upload avatar:", err);
        } finally {
          setUploadingAvatar(false);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSignOut = async () => {
    const ok = await confirm({
      title: "Sign out?",
      body: "You'll need to sign in again to access your account.",
      confirmText: "Sign out",
      danger: true,
      icon: "logout",
    });
    if (!ok) return;
    await signOut();
    navigate("/");
  };

  /* ── Not signed in ── */
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 flex flex-col items-center text-center gap-6">
        <div className="w-20 h-20 rounded-3xl bg-emerald-100 flex items-center justify-center">
          <Icon name="account_circle" size={44} style={{ color: "#047857" }} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 mb-2">Your Profile</h1>
          <p className="text-sm text-slate-500">
            Sign in to manage your profile, track prayers, and personalize
            your mosque experience.
          </p>
        </div>
        <button onClick={() => openAuthModal("signin")} className="btn-primary flex items-center gap-2 px-8">
          <Icon name="login" size={18} />
          Sign In / Create Account
        </button>
      </div>
    );
  }

  const handleManualCheckUpdate = () => {
    setCheckingUpdate(true);
    setUpdateMsg(null);
    setTimeout(() => {
      setCheckingUpdate(false);
      const res = checkForUpdate ? checkForUpdate(true) : { hasUpdate: false };
      if (!res.hasUpdate) {
        setUpdateMsg("You're using the latest version!");
        setTimeout(() => setUpdateMsg(null), 3000);
      }
    }, 600);
  };

  const menuItems = [
    { to: "/notifications", icon: "notifications", label: "My Notifications", sub: "Alerts & preferences", color: "#2563eb", bg: "#eff6ff" },
  ];
  if (isAdmin) {
    menuItems.push({ to: "/admin", icon: "admin_panel_settings", label: "Admin Panel", sub: "Manage the mosque", color: "#047857", bg: "#ecfdf5" });
    menuItems.push({ to: "/admin/updates", icon: "system_update", label: "APK Updates", sub: "Broadcast in-app updates", color: "#d97706", bg: "#fffbeb" });
  }

  return (
    <div className="max-w-2xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-5 sm:space-y-6 animate-slide-up">
      {/* ── Hero profile card ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-slate-900 text-white shadow-card-hover">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -left-10 w-56 h-56 rounded-full bg-white/5" />
        <div className="relative p-6">
          <div className="flex items-center gap-5">
            {/* Avatar with Camera edit button */}
            <div className="relative flex-shrink-0">
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={displayName}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white/25 shadow-lg bg-emerald-900"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-white/15 border-4 border-white/25 flex items-center justify-center font-bold text-2xl text-white">
                  {displayName[0]?.toUpperCase() || "U"}
                </div>
              )}
              <button
                type="button"
                onClick={() => setAvatarModalOpen(true)}
                title="Change profile picture"
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white text-emerald-800 flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all"
              >
                <Icon name="photo_camera" size={16} filled />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-extrabold leading-tight truncate">{displayName}</h1>
                {isSuperAdmin && (
                  <span className="badge bg-amber-400/90 text-amber-950 text-[10px] flex items-center gap-0.5 font-bold">
                    <Icon name="workspace_premium" size={12} filled style={{ color: "#78350f" }} /> Super Admin
                  </span>
                )}
                {isAdmin && !isSuperAdmin && (
                  <span className="badge bg-white/20 text-white text-[10px] flex items-center gap-0.5">
                    <Icon name="admin_panel_settings" size={12} filled style={{ color: "white" }} /> Admin
                  </span>
                )}
              </div>
              <p className="text-sm text-emerald-100/90 truncate mt-0.5">{email}</p>
              <p className="text-[11px] text-emerald-200/70 mt-1">
                {mosqueName} · {joinedAt ? `Member since ${format(new Date(joinedAt), "MMM yyyy")}` : "Member"}
              </p>
            </div>
            <button
              onClick={startEdit}
              title="Edit profile"
              className="flex-shrink-0 w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 transition-colors flex items-center justify-center active:scale-95"
            >
              <Icon name="edit" size={18} filled style={{ color: "white" }} />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="rounded-2xl bg-white/10 backdrop-blur-sm px-3 py-2.5 text-center">
              <p className="text-lg font-extrabold">{completedToday}</p>
              <p className="text-[10px] text-emerald-100/80 uppercase tracking-wider">of 5 today</p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-sm px-3 py-2.5 text-center">
              <p className="text-lg font-extrabold">{streak}</p>
              <p className="text-[10px] text-emerald-100/80 uppercase tracking-wider">day streak</p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-sm px-3 py-2.5 text-center">
              <p className="text-lg font-extrabold">
                {tracker ? Math.round((completedToday / 5) * 100) : 0}%
              </p>
              <p className="text-[10px] text-emerald-100/80 uppercase tracking-wider">today</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit account form ── */}
      {editing && (
        <form onSubmit={handleSave} className="card animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-slate-800 flex items-center gap-2">
              <Icon name="badge" size={18} style={{ color: "#047857" }} />
              Edit Profile
            </p>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
            >
              <Icon name="close" size={18} />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input
                className="input-field"
                value={form.displayName || ""}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                placeholder="Your name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Phone</label>
                <input
                  type="tel"
                  className="input-field"
                  value={form.phone || ""}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 …"
                />
              </div>
              <div>
                <label className="label">City</label>
                <input
                  className="input-field"
                  value={form.city || ""}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder="Jharkhand"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2
                ${saved ? "bg-emerald-100 text-emerald-800" : "btn-primary"}`}
            >
              {saved ? (
                <><Icon name="check_circle" size={18} filled /> Saved!</>
              ) : (
                <><Icon name="save" size={18} /> {saving ? "Saving…" : "Save Profile"}</>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ── Avatar Selection / Upload Modal ── */}
      {avatarModalOpen && (
        <div
          className="modal-root fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => !uploadingAvatar && setAvatarModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 overflow-hidden border border-slate-100 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: "calc(100vh - 2rem)", overflowY: "auto" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Change Profile Picture</h3>
                <p className="text-xs text-slate-400">Choose a preset avatar or upload your photo</p>
              </div>
              <button
                onClick={() => setAvatarModalOpen(false)}
                disabled={uploadingAvatar}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            {/* Direct Upload from Device / Camera */}
            <div className="mb-5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-50 border-2 border-dashed border-emerald-300 text-emerald-800 font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-100/70 active:scale-[0.98] transition-all"
              >
                <Icon name="upload" size={20} filled style={{ color: "#047857" }} />
                {uploadingAvatar ? "Processing photo…" : "Upload Photo from Device"}
              </button>
            </div>

            {/* Preset Islamic & Geometric Avatars */}
            <div className="mb-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                Choose Preset Avatar
              </p>
              <div className="grid grid-cols-4 gap-2.5">
                {PRESET_AVATARS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPresetAvatar(preset)}
                    disabled={uploadingAvatar}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-2xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/40 active:scale-95 transition-all"
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm"
                      style={{ background: preset.bg }}
                    >
                      <Icon name={preset.icon} size={24} filled style={{ color: preset.color }} />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600 truncate w-full text-center">
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom URL Input */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Or Paste Image Link
              </p>
              <form onSubmit={handleCustomUrlSave} className="flex gap-2">
                <input
                  type="url"
                  className="input-field flex-1 text-xs"
                  placeholder="https://example.com/avatar.jpg"
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  disabled={uploadingAvatar}
                />
                <button
                  type="submit"
                  disabled={uploadingAvatar || !customAvatarUrl.trim()}
                  className="btn-primary px-4 text-xs font-bold whitespace-nowrap"
                >
                  Save
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Menu list ── */}
      <div className="card p-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 pt-1 pb-2">
          Account & App
        </p>
        {menuItems.map(({ to, icon, label, sub, color, bg }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-slate-50 transition-colors"
            style={{ textDecoration: "none" }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
              <Icon name={icon} size={20} filled style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800">{label}</p>
              <p className="text-xs text-slate-400">{sub}</p>
            </div>
            <Icon name="chevron_right" size={20} style={{ color: "#cbd5e1" }} />
          </Link>
        ))}

        {/* Check for App Updates */}
        <button
          onClick={handleManualCheckUpdate}
          disabled={checkingUpdate}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-slate-50 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Icon name="system_update" size={20} filled style={{ color: "#d97706" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-800">Check for App Updates</p>
              {hasUpdate && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              )}
            </div>
            <p className="text-xs text-slate-400">
              {updateMsg || (checkingUpdate ? "Checking servers…" : `Current: v${currentVersion || "1.0.2"}`)}
            </p>
          </div>
          <Icon name="sync" size={18} style={{ color: "#94a3b8" }} className={checkingUpdate ? "animate-spin" : ""} />
        </button>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-red-50 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <Icon name="logout" size={20} filled style={{ color: "#dc2626" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-600">Sign Out</p>
            <p className="text-xs text-slate-400">Log out of this device</p>
          </div>
          <Icon name="chevron_right" size={20} style={{ color: "#cbd5e1" }} />
        </button>
      </div>

      {/* ── App info ── */}
      <div className="text-center pb-2">
        <p className="text-[11px] text-slate-400">
          Mosque Hub App v{currentVersion || "1.0.2"} · {mosqueName}
        </p>
      </div>
    </div>
  );
}