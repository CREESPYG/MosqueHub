import React, { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useConfirm } from "../../contexts/ConfirmContext";
import { useMosqueSettings } from "../../hooks/useMosqueSettings";
import Icon from "../ui/Icon";
import SliceBottomNav from "./SliceNav";
import AuthModal from "../auth/AuthModal";

/* ── Nav definitions ─────────────────────────────── */
const userNavItems = [
  { to: "/",             iconOutline: "home",            iconFilled: "home",              label: "Home",      exact: true  },
  { to: "/schedule",     iconOutline: "calendar_month",  iconFilled: "calendar_month",    label: "Schedule"               },
  { to: "/tracker",      iconOutline: "fact_check",      iconFilled: "fact_check",        label: "Tracker"                },
  { to: "/community",    iconOutline: "groups",          iconFilled: "groups",            label: "Community"              },
  { to: "/notifications",iconOutline: "notifications",   iconFilled: "notifications",     label: "Alerts"                 },
];

const profileItem = { to: "/profile", icon: "person", label: "Profile" };

const adminNavItems = [
  { to: "/admin",                icon: "dashboard",              label: "Overview",      exact: true },
  { to: "/admin/timings",        icon: "schedule",               label: "Timings"                    },
  { to: "/admin/events",         icon: "event",                  label: "Events"                     },
  { to: "/admin/finances",       icon: "account_balance_wallet", label: "Finances"                   },
  { to: "/admin/gallery",        icon: "photo_library",          label: "Gallery"                    },
  { to: "/admin/users",          icon: "manage_accounts",        label: "Users"                      },
  { to: "/admin/notifications",  icon: "send",                   label: "Notify"                     },
  { to: "/admin/updates",        icon: "system_update",          label: "App Updates"                },
  { to: "/admin/settings",       icon: "settings",               label: "Settings"                   },
];

/* ── MD3 Navigation Bar Item ─────────────────────── */
function SidebarItem({ to, icon, label, exact, onClick }) {
  return (
    <NavLink
      to={to}
      end={exact}
      onClick={onClick}
      style={{ textDecoration: "none" }}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-150
         ${isActive
           ? "bg-emerald-700 text-white shadow-sm"
           : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"}`
      }
    >
      {({ isActive }) => (
        <>
          <Icon name={icon} size={20} filled={isActive} weight={isActive ? 600 : 400} />
          <span className="flex-1">{label}</span>
        </>
      )}
    </NavLink>
  );
}

/* ── Main Component ──────────────────────────────── */
export default function AppShell({ children }) {
  const { currentUser, profile, isAdmin, isSuperAdmin, openAuthModal, signOut } = useAuth();
  const { confirm } = useConfirm();
  const { name: mosqueName, location: mosqueLocation } = useMosqueSettings();
  const location   = useLocation();
  const navigate   = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const avatarUrl = profile?.photoURL || currentUser?.photoURL;
  const userInitials = (profile?.displayName || currentUser?.displayName || currentUser?.email || "U")[0].toUpperCase();

  const isAdminRoute = location.pathname.startsWith("/admin");

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

  /* Dynamic tab line chips (depends on role / session) */
  const moreChips = [
    { to: "/notifications", icon: "notifications",  label: "Alerts" },
    { to: "/profile",        icon: "person",         label: "Profile" },
    ...(isAdmin
      ? [
          { to: "/admin",           icon: "admin_panel_settings", label: "Admin Panel" },
          { to: "/admin/settings",  icon: "settings",             label: "Settings" },
        ]
      : []),
    ...(currentUser
      ? [{ action: "signout", icon: "logout", label: "Sign Out", danger: true }]
      : [{ action: "signin", icon: "login", label: "Sign In", onClick: () => openAuthModal("signin") }]),
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* ════════════════════════════════════
          DESKTOP SIDEBAR (lg+)
      ════════════════════════════════════ */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-100 fixed h-full z-30 shadow-sm">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-sm">
              <Icon name="mosque" size={20} filled style={{ color: "white" }} />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm leading-tight">{mosqueName}</p>
              <p className="text-xs text-slate-400">{mosqueLocation}</p>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {(isAdminRoute ? adminNavItems : userNavItems).map((item) => (
            <SidebarItem key={item.to} {...item} />
          ))}

          {/* My Profile */}
          <SidebarItem to={profileItem.to} icon={profileItem.icon} label={profileItem.label} exact />

          {/* Switch between app ↔ admin */}
          {isAdmin && !isAdminRoute && (
            <div className="pt-4 border-t border-slate-100 mt-4">
              <SidebarItem to="/admin" icon="admin_panel_settings" label="Admin Panel" />
            </div>
          )}
          {isAdminRoute && (
            <div className="pt-4 border-t border-slate-100 mt-4">
              <SidebarItem to="/" icon="arrow_back" label="Back to App" />
            </div>
          )}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-slate-100">
          {currentUser ? (
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  onClick={() => navigate("/profile")}
                  title="My Profile"
                  className="w-9 h-9 rounded-full object-cover border-2 border-emerald-200 flex-shrink-0 cursor-pointer bg-emerald-900 shadow-sm"
                />
              ) : (
                <div
                  onClick={() => navigate("/profile")}
                  title="My Profile"
                  className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 border-2 border-emerald-200 flex-shrink-0 cursor-pointer flex items-center justify-center font-bold text-xs shadow-sm"
                >
                  {userInitials}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {profile?.displayName || currentUser.displayName || currentUser.email}
                  </p>
                  {isSuperAdmin && (
                    <span className="text-amber-500" title="Super Admin">
                      <Icon name="workspace_premium" size={16} filled style={{ color: "#b45309" }} />
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                title="Sign out"
                className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg"
              >
                <Icon name="logout" size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => openAuthModal("signin")}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <Icon name="login" size={18} />
              Sign In / Register
            </button>
          )}
        </div>
      </aside>

      {/* ════════════════════════════════════
          MOBILE TOP HEADER
      ════════════════════════════════════ */}
      <header
        className="lg:hidden fixed top-0 inset-x-0 z-40 bg-glass border-b border-slate-100 shadow-sm"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex items-center justify-between h-14">
          {/* Left: hamburger + brand */}
          <div className="flex items-center gap-1 min-w-0">
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 active:scale-95 transition-all flex-shrink-0"
            >
              <Icon name="menu" size={24} />
            </button>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center flex-shrink-0">
              <Icon name="mosque" size={16} filled style={{ color: "white" }} />
            </div>
            <span className="font-bold text-slate-800 text-sm truncate">
              {isAdminRoute ? "Admin Panel" : mosqueName}
            </span>
            {isAdminRoute && isSuperAdmin && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                <Icon name="workspace_premium" size={12} filled style={{ color: "#b45309", verticalAlign: "-2px" }} /> Super
              </span>
            )}
          </div>

          {/* Right: notifications + avatar / sign-in */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {currentUser && (
              <button
                onClick={() => navigate("/notifications")}
                className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 relative"
              >
                <Icon name="notifications" size={20} />
              </button>
            )}

            {currentUser ? (
              avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover border-2 border-emerald-200 cursor-pointer bg-emerald-900 shadow-sm"
                  onClick={() => navigate("/profile")}
                  title="My Profile"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 border-2 border-emerald-200 cursor-pointer flex items-center justify-center font-bold text-xs shadow-sm"
                  onClick={() => navigate("/profile")}
                  title="My Profile"
                >
                  {userInitials}
                </div>
              )
            ) : (
              <button
                onClick={() => openAuthModal("signin")}
                className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 font-bold"
              >
                <Icon name="login" size={16} />
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════
          MOBILE ADMIN SLIDE DRAWER
      ════════════════════════════════════ */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            className="relative w-72 bg-white h-full shadow-2xl flex flex-col"
            style={{
              animation: "slideRight 0.25s ease-out",
              paddingTop: "env(safe-area-inset-top, 0px)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Icon name="mosque" size={20} filled style={{ color: "#047857" }} />
                <span className="font-bold text-slate-800">Menu</span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {/* User links always */}
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
                App
              </p>
              {userNavItems.map((item) => (
                <SidebarItem
                  key={item.to}
                  to={item.to}
                  icon={item.iconOutline || item.icon}
                  label={item.label}
                  exact={item.exact}
                  onClick={() => setDrawerOpen(false)}
                />
              ))}
              <SidebarItem
                to={profileItem.to}
                icon={profileItem.icon}
                label="My Profile"
                onClick={() => setDrawerOpen(false)}
              />

              {/* Admin links if admin (Users list is super-admin only) */}
              {isAdmin && (
                <>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2 mt-4">
                    Admin
                  </p>
                  {adminNavItems
                    .filter((item) => item.label !== "Users" || isSuperAdmin)
                    .map((item) => (
                    <SidebarItem
                      key={item.to}
                      {...item}
                      onClick={() => setDrawerOpen(false)}
                    />
                  ))}
                </>
              )}
            </nav>

            {/* Auth footer in drawer */}
            <div className="p-4 border-t border-slate-100">
              {currentUser ? (
                <div className="flex items-center gap-3">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="w-9 h-9 rounded-full object-cover border-2 border-emerald-200 cursor-pointer bg-emerald-900 shadow-sm"
                      onClick={() => { setDrawerOpen(false); navigate("/profile"); }}
                      title="My Profile"
                    />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 border-2 border-emerald-200 cursor-pointer flex items-center justify-center font-bold text-xs shadow-sm"
                      onClick={() => { setDrawerOpen(false); navigate("/profile"); }}
                      title="My Profile"
                    >
                      {userInitials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {profile?.displayName || currentUser.displayName || currentUser.email}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-2 rounded-xl text-red-400 hover:bg-red-50 transition-colors"
                  >
                    <Icon name="logout" size={18} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setDrawerOpen(false); openAuthModal("signin"); }}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <Icon name="login" size={18} />
                  Sign In / Register
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════════ */}
      <main
        className="flex-1 lg:ml-64 min-h-screen overflow-x-clip"
        style={{
          paddingTop: "calc(3.5rem + env(safe-area-inset-top, 0px))",    /* mobile header + notch */
          paddingBottom: "calc(4.5rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {/* Desktop: no top padding needed */}
        <style>{`@media (min-width: 1024px) { main { padding-top: 0 !important; padding-bottom: 0 !important; } }`}</style>
        <div className="animate-fade-in">{children}</div>
      </main>

      {/* ════════════════════════════════════
          MOBILE BOTTOM NAV (Slice-style, shared)
      ════════════════════════════════════ */}
      <SliceBottomNav slots={userNavItems} chips={moreChips} onSignOut={handleSignOut} />

      {/* ════════════════════════════════════
          GLOBAL EMAIL & PASSWORD AUTH MODAL
      ════════════════════════════════════ */}
      <AuthModal />
    </div>
  );
}
