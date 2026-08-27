import React, { useEffect, useState } from "react";
import { ref, onValue, set, remove } from "firebase/database";
import { rtdb } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";
import { format } from "date-fns";
import {
  Users,
  ShieldCheck,
  ShieldOff,
  Crown,
  Search,
  ChevronDown,
  Lock,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useConfirm } from "../../contexts/ConfirmContext";

const SUPER_ADMIN_EMAIL = "aarif.box8@gmail.com";

export default function UserManager() {
  const { currentUser, isSuperAdmin } = useAuth();
  const { confirm } = useConfirm();
  const [users, setUsers]         = useState([]);
  const [admins, setAdmins]       = useState({});
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [toggling, setToggling]   = useState(null);
  const [filter, setFilter]       = useState("all"); // all | admins | users
  const [toast, setToast]         = useState(null);
  const [loadError, setLoadError] = useState(null);

  // Load all users from RTDB
  useEffect(() => {
    const unsubUsers = onValue(
      ref(rtdb, "users"),
      (snap) => {
        setLoadError(null);
        if (snap.exists()) {
          const data = snap.val();
          const list = Object.entries(data)
            .map(([uid, v]) => ({ uid, ...v }))
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          setUsers(list);
        } else {
          setUsers([]);
        }
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        setLoadError(err.code || err.message || "Failed to load users.");
      }
    );

    const unsubAdmins = onValue(
      ref(rtdb, "admins"),
      (snap) => setAdmins(snap.exists() ? snap.val() : {}),
      () => {}
    );

    return () => { unsubUsers(); unsubAdmins(); };
  }, []);

  /* Only the main (super) admin may view the user list at all */
  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
          <Lock className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Super Admin Only</h2>
        <p className="text-sm text-slate-500 max-w-sm">
          Only the main admin can view all users and manage admin permissions.
          Normal admins cannot access this page.
        </p>
        <Link to="/admin" className="btn-primary">Back to Dashboard</Link>
      </div>
    );
  }

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const grantAdmin = async (user) => {
    if (!isSuperAdmin) return;
    setToggling(user.uid);
    try {
      await set(ref(rtdb, `admins/${user.uid}`), true);
      showToast(`Admin access granted to ${user.displayName || user.email}`);
    } catch (err) {
      showToast(`Failed: ${err.message}`, "error");
    } finally {
      setToggling(null);
    }
  };

  const revokeAdmin = async (user) => {
    if (!isSuperAdmin) return;
    // Cannot revoke super admin
    if (user.email === SUPER_ADMIN_EMAIL) {
      showToast("Cannot revoke super admin access.", "warn");
      return;
    }
    const ok = await confirm({
      title: `Revoke admin access?`,
      body: `${user.displayName || user.email} will lose all admin panel permissions immediately.`,
      confirmText: "Revoke",
      danger: true,
      icon: "gavel",
    });
    if (!ok) return;
    setToggling(user.uid);
    try {
      await remove(ref(rtdb, `admins/${user.uid}`));
      showToast(`Admin access revoked for ${user.displayName || user.email}`);
    } catch (err) {
      showToast(`Failed: ${err.message}`, "error");
    } finally {
      setToggling(null);
    }
  };

  // Filter & search
  const filtered = users.filter((u) => {
    const isAdminUser = !!admins[u.uid];
    if (filter === "admins" && !isAdminUser) return false;
    if (filter === "users" && isAdminUser) return false;
    const q = search.toLowerCase();
    return (
      !q ||
      u.displayName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  const adminCount = users.filter((u) => admins[u.uid]).length;
  const totalCount = users.length;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">User Manager</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            View all registered users and manage admin permissions.
          </p>
        </div>
        <Users className="w-8 h-8 text-emerald-600 opacity-40 flex-shrink-0" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-2xl font-extrabold text-slate-800">{totalCount}</p>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Total Users</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-extrabold text-emerald-700">{adminCount}</p>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Admins</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-extrabold text-slate-500">{totalCount - adminCount}</p>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Regular Users</p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col max-[380px]:gap-2 sm:flex-row sm:gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <div className="relative max-[380px]:w-full">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field pr-8 appearance-none cursor-pointer"
          >
            <option value="all">All Users</option>
            <option value="admins">Admins Only</option>
            <option value="users">Regular Users</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* User List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : loadError ? (
        <div className="card bg-red-50 border border-red-200 text-center py-10">
          <Lock className="w-10 h-10 mx-auto mb-3 text-red-400" />
          <p className="text-sm font-bold text-red-700">Could not load users</p>
          <p className="text-xs text-red-500 mt-1 break-words px-4">{loadError}</p>
          <p className="text-xs text-slate-500 mt-3">
            Check the database rules — only the main admin can read the user list
            (<code className="bg-red-100 px-1 rounded">users</code> node).
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No users found.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((user) => {
            const isUserAdmin    = !!admins[user.uid];
            const isSuperUser    = user.email === SUPER_ADMIN_EMAIL;
            const isCurrentUser  = user.uid === currentUser?.uid;
            const isTogglingThis = toggling === user.uid;

            return (
              <div
                key={user.uid}
                className={`card flex items-center gap-4 transition-all duration-200
                  ${isUserAdmin ? "border border-emerald-200 bg-emerald-50/30" : ""}
                  ${isSuperUser ? "border-2 border-amber-300 bg-amber-50/30" : ""}`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-slate-200 flex items-center justify-center">
                      <span className="text-slate-500 font-bold text-lg">
                        {(user.displayName || user.email || "?")[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  {isSuperUser && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow">
                      <Crown className="w-3 h-3 text-white" />
                    </span>
                  )}
                  {isUserAdmin && !isSuperUser && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center shadow">
                      <ShieldCheck className="w-3 h-3 text-white" />
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm text-slate-800 truncate">
                      {user.displayName || "Unknown"}
                      {isCurrentUser && (
                        <span className="ml-1.5 text-[10px] font-semibold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </p>
                    {isSuperUser && (
                      <span className="badge bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5">
                        <Crown className="w-3 h-3" /> Super Admin
                      </span>
                    )}
                    {isUserAdmin && !isSuperUser && (
                      <span className="badge bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5">
                        <ShieldCheck className="w-3 h-3" /> Admin
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{user.email || "No email"}</p>
                  <p className="text-[10px] text-slate-300 mt-0.5">
                    UID: <span className="font-mono">{user.uid}</span>
                    {user.createdAt && (
                      <> · Joined {format(new Date(user.createdAt), "dd MMM yyyy")}</>
                    )}
                  </p>
                </div>

                {/* Action Button (Super Admin only) */}
                {isSuperAdmin && !isSuperUser && (
                  <div className="flex-shrink-0">
                    {isUserAdmin ? (
                      <button
                        onClick={() => revokeAdmin(user)}
                        disabled={isTogglingThis}
                        className="flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200
                                   rounded-xl px-3 py-2 text-xs font-semibold hover:bg-red-100
                                   transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isTogglingThis ? (
                          <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <ShieldOff className="w-4 h-4" />
                        )}
                        Revoke
                      </button>
                    ) : (
                      <button
                        onClick={() => grantAdmin(user)}
                        disabled={isTogglingThis}
                        className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200
                                   rounded-xl px-3 py-2 text-xs font-semibold hover:bg-emerald-100
                                   transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isTogglingThis ? (
                          <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <ShieldCheck className="w-4 h-4" />
                        )}
                        Grant Admin
                      </button>
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* How-to Note */}
      {isSuperAdmin && (
        <div className="rounded-2xl bg-slate-800 text-white p-4 text-xs leading-relaxed">
          <p className="font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> How Admin Access Works
          </p>
          <ul className="space-y-1 text-slate-300">
            <li>• Users must <strong>register or sign in</strong> to appear in this list.</li>
            <li>• Click <strong>"Grant Admin"</strong> to give a user full admin panel access.</li>
            <li>• Click <strong>"Revoke"</strong> to remove their admin access instantly.</li>
            <li>• Admin status is stored in Firebase RTDB at <code className="text-emerald-400">/admins/&#123;uid&#125;</code>.</li>
            <li>• User profile pictures & details update here in real-time.</li>
            <li>• Only <strong>you</strong> (Super Admin) can manage admin permissions.</li>
          </ul>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl
            shadow-xl text-sm font-semibold text-white animate-slide-up whitespace-nowrap
            ${toast.type === "error" ? "bg-red-600" : toast.type === "warn" ? "bg-amber-600" : "bg-emerald-700"}`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
