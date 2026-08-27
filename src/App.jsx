import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider }    from "./contexts/AuthContext";
import { ConfirmProvider } from "./contexts/ConfirmContext";
import { NotifProvider }   from "./contexts/NotifContext";
import { UpdateProvider }  from "./contexts/UpdateContext";

import AppShell from "./components/layout/AppShell";

/* ── User Pages ── */
import Home          from "./pages/Home";
import Schedule      from "./pages/Schedule";
import Tracker       from "./pages/Tracker";
import Community     from "./pages/Community";
import Notifications from "./pages/Notifications";
import Profile       from "./pages/Profile";

/* ── Admin Pages ── */
import AdminLayout          from "./pages/admin/AdminLayout";
import AdminOverview        from "./pages/admin/AdminOverview";
import TimingManager        from "./pages/admin/TimingManager";
import EventManager         from "./pages/admin/EventManager";
import FinanceHub           from "./pages/admin/FinanceHub";
import GalleryManager       from "./pages/admin/GalleryManager";
import UserManager          from "./pages/admin/UserManager";
import NotificationManager  from "./pages/admin/NotificationManager";
import MosqueSettings       from "./pages/admin/MosqueSettings";
import AppUpdateManager     from "./pages/admin/AppUpdateManager";

function UserPage({ page: Page }) {
  return (
    <AppShell>
      <Page />
    </AppShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ConfirmProvider>
        <NotifProvider>
          <UpdateProvider>
            <HashRouter>
              <Routes>
                {/* ── User App ── */}
                <Route path="/"              element={<UserPage page={Home}          />} />
                <Route path="/schedule"      element={<UserPage page={Schedule}      />} />
                <Route path="/tracker"       element={<UserPage page={Tracker}       />} />
                <Route path="/community"     element={<UserPage page={Community}     />} />
                <Route path="/notifications" element={<UserPage page={Notifications} />} />
                <Route path="/profile"       element={<UserPage page={Profile}       />} />

                {/* ── Admin Panel ── */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index                  element={<AdminOverview       />} />
                  <Route path="timings"         element={<TimingManager       />} />
                  <Route path="events"          element={<EventManager        />} />
                  <Route path="finances"        element={<FinanceHub          />} />
                  <Route path="gallery"         element={<GalleryManager      />} />
                  <Route path="users"           element={<UserManager         />} />
                  <Route path="notifications"   element={<NotificationManager />} />
                  <Route path="updates"         element={<AppUpdateManager    />} />
                  <Route path="settings"        element={<MosqueSettings       />} />
                </Route>
              </Routes>
            </HashRouter>
          </UpdateProvider>
        </NotifProvider>
      </ConfirmProvider>
    </AuthProvider>
  );
}

