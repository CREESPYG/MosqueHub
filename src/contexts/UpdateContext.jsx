import React, { createContext, useContext, useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { rtdb } from "../firebase";
import UpdateModal from "../components/update/UpdateModal";

const UpdateContext = createContext(null);

export const CURRENT_APP_VERSION = "1.0.4";
export const CURRENT_VERSION_CODE = 4;

export function UpdateProvider({ children }) {
  const [remoteUpdate, setRemoteUpdate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [dismissedVersion, setDismissedVersion] = useState(null);

  useEffect(() => {
    const unsub = onValue(ref(rtdb, "app_update"), (snap) => {
      if (snap.exists()) {
        const val = snap.val();
        setRemoteUpdate(val);

        // If remote version code is newer than installed app
        if (val.versionCode && val.versionCode > CURRENT_VERSION_CODE) {
          if (dismissedVersion !== val.version || val.forceUpdate) {
            setShowModal(true);
          }
        }
      }
    });
    return unsub;
  }, [dismissedVersion]);

  const checkForUpdate = (manual = false) => {
    if (!remoteUpdate) {
      return { hasUpdate: false, message: "Up to date" };
    }
    const hasUpdate = remoteUpdate.versionCode > CURRENT_VERSION_CODE;
    if (hasUpdate) {
      setShowModal(true);
    }
    return {
      hasUpdate,
      currentVersion: CURRENT_APP_VERSION,
      latestVersion: remoteUpdate.version,
      updateInfo: remoteUpdate,
    };
  };

  const handleDismiss = () => {
    if (remoteUpdate?.version) {
      setDismissedVersion(remoteUpdate.version);
    }
    setShowModal(false);
  };

  const handlePerformUpdate = (url) => {
    if (url) {
      window.open(url, "_system") || (window.location.href = url);
    } else {
      alert("Download link not configured. Please contact the mosque admin.");
    }
  };

  return (
    <UpdateContext.Provider
      value={{
        currentVersion: CURRENT_APP_VERSION,
        currentVersionCode: CURRENT_VERSION_CODE,
        remoteUpdate,
        checkForUpdate,
        hasUpdate: remoteUpdate ? remoteUpdate.versionCode > CURRENT_VERSION_CODE : false,
      }}
    >
      {children}

      {showModal && remoteUpdate && (
        <UpdateModal
          updateInfo={remoteUpdate}
          currentVersion={CURRENT_APP_VERSION}
          onClose={handleDismiss}
          onUpdate={handlePerformUpdate}
        />
      )}
    </UpdateContext.Provider>
  );
}

export const useAppUpdate = () => useContext(UpdateContext);
