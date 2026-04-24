export const DEFAULT_SETTINGS = {
  "share-test-session": true,
  "share-hosted-session": true,
  "hide-go-racing-json-export-buttons": false,
  "auto-register": true,
  "queue-requeue-displaced-registration": false,
  "queue-register-sound": true,
  "queue-register-sound-volume": 65,
  "better-join-button": true,
  "dashboard-intelligence-center": true,
  "no-toasts": false,
  "auto-close-toasts": false,
  "toast-timeout-s": 5,
  "no-sidebars": false,
  "collapse-menu": false,
  logger: false,
};

function stripRemovedSettings(settings) {
  if (!settings || typeof settings !== "object") {
    return {};
  }

  const nextSettings = { ...settings };
  delete nextSettings["queue-car-prompt"];
  delete nextSettings["dashboard-purchase-summary"];
  return nextSettings;
}

export function getSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem("iref_settings"));
    const nextSettings = stripRemovedSettings(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...nextSettings,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings = {}) {
  const sanitizedSettings = stripRemovedSettings(settings);
  const nextSettings = {
    ...DEFAULT_SETTINGS,
    ...sanitizedSettings,
  };

  localStorage.setItem("iref_settings", JSON.stringify(nextSettings));
  return nextSettings;
}
