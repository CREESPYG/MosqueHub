import React from "react";
import { Navigate, Outlet, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useConfirm } from "../../contexts/ConfirmContext";
import { LayoutDashboard, Clock, CalendarDays, Image, ArrowLeft, Users, Settings, IndianRupee, Lock, Crown, Send } from "lucide-react";
import { Link } from "react-router-dom";
import SliceBottomNav from "../../components/layout/SliceNav";

const ADMIN_NAV = [
  { to: "/admin", icon: LayoutDashboard, label: "Overview", exact: true },
  { to: "/admin/timings", icon: Clock, label: "Timings" },
  { to: "/admin/events", icon: CalendarDays, label: "Events" },
  { to: "/admin/finances", icon: IndianRupee, label: "Finances" },
  { to: "/admin/gallery", icon: Image, label: "Gallery" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/notifications", icon: Send, label: "Notify" },
  { to: "/admin/settings", icon: Settings, label: "Settings", hideMobile: true },
];

/* Slice-style bottom nav slots: 4 tabs + center "open tab line" button */
const ADMIN_SLOTS = [
  { to: "/admin",          iconOutline: "dashboard",              iconFilled: "dashboard",              label: "Overview", exact: true },
  { to: "/admin/timings",  iconOutline: "schedule",               iconFilled: "schedule",               label: "Timings"               },
  { to: "/admin/events",   iconOutline: "event",                  iconFilled: "event",                  label: "Events"                },
  { to: "/admin/finances", iconOutline: "account_balance_wallet", iconFilled: "account_balance_wallet", label: "Finances"              },
];

import IslamicLoadingScreen from "../../components/ui/IslamicLoadingScreen";

export default function AdminLayout() {
  const { currentUser, isAdmin, isSuperAdmin, loading, signOut } = useAuth();
  const { confirm } = useConfirm();

  if (loading) {
    return <IslamicLoadingScreen message="Authenticating admin session..." />;
  }

  if (!currentUser || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
          <Lock className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Access Denied</h2>
        <p className="text-sm text-slate-500">
          You don't have permission to access the admin panel. Please sign in with an admin account.
        </p>
        <Link to="/" className="btn-primary">Back to App</Link>
      </div>
    );
  }

  const handleSignOut = async () => {
    const ok = await confirm({
      title: "Sign out?",
      body: "You'll need to sign in again to use the app.",
      confirmText: "Sign out",
      danger: true,
      icon: "logout",
    });
    if (!ok) return;
    await signOut();
    window.location.href = "/";
  };

  /* Dynamic chips for the open tab line (admin panel extras) */
  const moreChips = [
    ...(isSuperAdmin ? [{ to: "/admin/users", icon: "manage_accounts", label: "Users" }] : []),
    { to: "/admin/gallery",       icon: "photo_library",      label: "Gallery"  },
    { to: "/admin/notifications", icon: "send",               label: "Notify"   },
    { to: "/admin/settings",      icon: "settings",           label: "Settings" },
    { to: "/",                    icon: "arrow_back",         label: "Back to App" },
    { to: "/profile",             icon: "person",             label: "Profile"  },
    ...(currentUser ? [{ action: "signout", icon: "logout", label: "Sign Out", danger: true }] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Admin Header */}
      <header
        className="bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-4 sticky top-0 z-20 shadow-sm"
        style={{ paddingTop: "calc(1rem + env(safe-area-inset-top, 0px))" }}
      >
        <Link to="/" className="btn-ghost flex items-center gap-1.5 text-slate-500">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to App</span>
        </Link>
        <div className="w-px h-6 bg-slate-200" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <span className="font-bold text-slate-800">Admin Dashboard</span>
        </div>
        <div className="ml-auto flex items-center gap-2 min-w-0">
          {isSuperAdmin ? (
            <span className="badge bg-amber-100 text-amber-800 border border-amber-200 hidden sm:inline-flex">
              <Crown className="w-3.5 h-3.5" /> Super Admin · Masjid Al-Putki
            </span>
          ) : (
            <span className="badge-green hidden sm:inline-flex">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Masjid Al-Putki
            </span>
          )}
          <Link
            to="/admin/settings"
            title="Mosque Settings"
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className="hidden md:flex flex-col w-56 bg-white border-r border-slate-100 sticky self-start"
          style={{
            top: "calc(65px + env(safe-area-inset-top, 0px))",
            minHeight: "calc(100vh - 65px - env(safe-area-inset-top, 0px))",
          }}
        >
          <nav className="p-3 space-y-1">
            {ADMIN_NAV.filter((i) => !i.hideMobile && (i.label !== "Users" || isSuperAdmin)).map(({ to, icon: Icon, label, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className={({ isActive }) =>
                  `admin-nav-item ${isActive ? "active" : ""}`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Mobile Tab Bar (Slice-style: scrollable + center open tab line) */}
        <SliceBottomNav slots={ADMIN_SLOTS} chips={moreChips} onSignOut={handleSignOut} />

        {/* Content */}
        <main className="flex-1 min-w-0 p-4 md:p-6 pb-24 md:pb-6 max-w-4xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
