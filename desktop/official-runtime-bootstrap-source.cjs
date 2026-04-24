const fs = require("node:fs");
const https = require("node:https");
const os = require("node:os");
const path = require("node:path");
const {
  app,
  session,
  ipcMain,
  BrowserWindow,
  dialog,
  shell,
  powerSaveBlocker,
} = require("electron");

const ROOT_DIR = process.env.IREFINED_ROOT || "__IREFINED_ROOT__";
const ROOT_POINTS_TO_ASAR = /(?:^|[\\/])[^\\/]+\.asar(?:$|[\\/])/i.test(ROOT_DIR);
const EXTENSION_DIST_DIR = path.join(ROOT_DIR, "extension", "dist");
const DESKTOP_PACKAGE_PATH = fs.existsSync(path.join(ROOT_DIR, "desktop", "package.json"))
  ? path.join(ROOT_DIR, "desktop", "package.json")
  : path.join(ROOT_DIR, "package.json");
const LOG_BASE_DIR = app.isPackaged || ROOT_POINTS_TO_ASAR ? app.getPath("userData") : ROOT_DIR;
const LOG_DIR = path.join(LOG_BASE_DIR, "logs");
const LOG_FILE = path.join(
  LOG_DIR,
  `iracing-ui-${new Date().toISOString().replace(/[:.]/g, "-")}.jsonl`
);
const PROBE_PREFIX = "[irefined-probe]";
const IREF_MODE = process.env.IREF_MODE || "fallback";
const IREF_NAV_TARGET = process.env.IREF_NAV_TARGET || "";
const DESKTOP_PACKAGE = readJsonFile(DESKTOP_PACKAGE_PATH, {});
const APP_NAME = DESKTOP_PACKAGE.productName || "iRefinedX";
const APP_VERSION = DESKTOP_PACKAGE.version || "1.3.0";
const APP_DISPLAY_VERSION =
  DESKTOP_PACKAGE.displayVersion || `v${String(APP_VERSION).split(".")[0]}`;
const APP_RELEASE_CHANNEL =
  String(DESKTOP_PACKAGE.releaseChannel || "").trim().toLowerCase() === "experimental"
    ? "experimental"
    : "stable";
const REPO_URL = String(
  DESKTOP_PACKAGE.repository || "https://github.com/nishizumi-maho/iRefinedX"
)
  .replace(/\.git$/i, "")
  .replace(/\/+$/, "");
const REPO_SLUG = getRepositorySlug(REPO_URL);
const RELEASES_URL = REPO_SLUG
  ? `${REPO_URL}/releases/latest`
  : "https://github.com/nishizumi-maho/iRefinedX/releases/latest";
const RELEASES_API_URL = REPO_SLUG
  ? `https://api.github.com/repos/${REPO_SLUG}/releases?per_page=10`
  : "https://api.github.com/repos/nishizumi-maho/iRefinedX/releases?per_page=10";
const UPDATE_CHECK_DELAY_MS = 7000;
const ENABLE_VERBOSE_NETWORK_LOGS = process.env.IREFINED_VERBOSE_NETWORK_LOGS === "1";
const BACKGROUND_RUNTIME_SWITCHES = [
  "disable-renderer-backgrounding",
  "disable-background-timer-throttling",
  "disable-backgrounding-occluded-windows",
];

const injectedFallbackTargets = new Set();
const autoNavigatedTargets = new Set();
const instrumentedWindows = new WeakSet();
let desktopUpdateCheckStarted = false;
let runtimePowerSaveBlockerId = -1;
let rendererWakeIntervalId = 0;

for (const runtimeSwitch of BACKGROUND_RUNTIME_SWITCHES) {
  app.commandLine.appendSwitch(runtimeSwitch);
}
app.commandLine.appendSwitch("disable-features", "CalculateNativeWinOcclusion");

function ensureLogDir() {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function readJsonFile(filePath, fallbackValue = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallbackValue;
  }
}

function serializeError(error) {
  if (!error) {
    return null;
  }

  return {
    message: error.message,
    stack: error.stack,
    name: error.name,
  };
}

function writeLog(type, payload) {
  ensureLogDir();
  const record = {
    ts: new Date().toISOString(),
    host: os.hostname(),
    pid: process.pid,
    type,
    payload,
  };

  fs.appendFileSync(LOG_FILE, `${JSON.stringify(record)}\n`, "utf8");
}

function onElectronReady(handler) {
  if (app.isReady()) {
    setImmediate(handler);
    return;
  }

  app.on("ready", handler);
}

function ensureRuntimePowerSaveBlocker() {
  if (!powerSaveBlocker || typeof powerSaveBlocker.start !== "function") {
    return;
  }

  if (
    runtimePowerSaveBlockerId !== -1 &&
    typeof powerSaveBlocker.isStarted === "function" &&
    powerSaveBlocker.isStarted(runtimePowerSaveBlockerId)
  ) {
    return;
  }

  try {
    runtimePowerSaveBlockerId = powerSaveBlocker.start("prevent-app-suspension");
    writeLog("power-save-blocker-started", {
      id: runtimePowerSaveBlockerId,
      type: "prevent-app-suspension",
    });
  } catch (error) {
    writeLog("power-save-blocker-start-failed", {
      error: serializeError(error),
    });
  }
}

function stopRuntimePowerSaveBlocker() {
  if (
    runtimePowerSaveBlockerId === -1 ||
    !powerSaveBlocker ||
    typeof powerSaveBlocker.stop !== "function"
  ) {
    return;
  }

  try {
    if (
      typeof powerSaveBlocker.isStarted !== "function" ||
      powerSaveBlocker.isStarted(runtimePowerSaveBlockerId)
    ) {
      powerSaveBlocker.stop(runtimePowerSaveBlockerId);
      writeLog("power-save-blocker-stopped", {
        id: runtimePowerSaveBlockerId,
      });
    }
  } catch (error) {
    writeLog("power-save-blocker-stop-failed", {
      id: runtimePowerSaveBlockerId,
      error: serializeError(error),
    });
  } finally {
    runtimePowerSaveBlockerId = -1;
  }
}

function dispatchRendererBackgroundTick(window) {
  if (!window || window.isDestroyed()) {
    return;
  }

  const { webContents } = window;

  if (!webContents || webContents.isDestroyed()) {
    return;
  }

  const currentUrl =
    typeof webContents.getURL === "function" ? String(webContents.getURL() || "") : "";

  if (!/members-ng\.iracing\.com/i.test(currentUrl)) {
    return;
  }

  webContents
    .executeJavaScript(
      `(() => {
        try {
          if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
            window.dispatchEvent(
              new CustomEvent("iref-background-tick", {
                detail: {
                  ts: Date.now(),
                  href: location.href,
                  hidden: document.hidden === true,
                  hasFocus:
                    typeof document.hasFocus === "function" ? document.hasFocus() : null,
                },
              })
            );
          }
        } catch {}
      })();`,
      true
    )
    .catch(() => {});
}

function ensureRendererWakeInterval() {
  if (rendererWakeIntervalId) {
    return;
  }

  rendererWakeIntervalId = setInterval(() => {
    BrowserWindow.getAllWindows().forEach((window) => {
      dispatchRendererBackgroundTick(window);
    });
  }, 1000);
}

function stopRendererWakeInterval() {
  if (!rendererWakeIntervalId) {
    return;
  }

  clearInterval(rendererWakeIntervalId);
  rendererWakeIntervalId = 0;
}

function getRepositorySlug(value) {
  try {
    const parsed = new URL(String(value || ""));

    if (parsed.hostname.toLowerCase() !== "github.com") {
      return "";
    }

    return parsed.pathname.replace(/^\/+|\/+$/g, "");
  } catch {
    return "";
  }
}

function normalizeVersion(value = "") {
  const numeric = String(value).match(/\d+(?:\.\d+)*/)?.[0];

  if (!numeric) {
    return [];
  }

  return numeric.split(".").map((part) => parseInt(part, 10) || 0);
}

function compareVersions(leftValue, rightValue) {
  const left = normalizeVersion(leftValue);
  const right = normalizeVersion(rightValue);
  const maxLength = Math.max(left.length, right.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftPart = left[index] || 0;
    const rightPart = right[index] || 0;

    if (leftPart > rightPart) {
      return 1;
    }

    if (leftPart < rightPart) {
      return -1;
    }
  }

  return 0;
}

function getLatestComparableVersion(payload = {}) {
  return payload.tag_name || payload.name || APP_DISPLAY_VERSION;
}

function compareReleaseRecords(left = {}, right = {}) {
  const versionResult = compareVersions(
    getLatestComparableVersion(right),
    getLatestComparableVersion(left)
  );

  if (versionResult !== 0) {
    return versionResult;
  }

  const leftTime = new Date(left.published_at || left.created_at || 0).getTime();
  const rightTime = new Date(right.published_at || right.created_at || 0).getTime();
  return rightTime - leftTime;
}

function selectNewestPublishedRelease(payload) {
  const releases = (Array.isArray(payload) ? payload : [payload]).filter(
    (entry) => entry && !entry.draft
  );
  const preferred =
    APP_RELEASE_CHANNEL === "experimental"
      ? releases
      : releases.filter((entry) => !entry.prerelease);
  const candidates = preferred.length ? preferred : releases;

  return candidates.sort(compareReleaseRecords)[0] || null;
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": `${APP_NAME}/${APP_VERSION}`,
        },
      },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          if ((response.statusCode || 500) < 200 || (response.statusCode || 500) >= 300) {
            reject(
              new Error(
                `GitHub release check failed (${response.statusCode || "unknown"})`
              )
            );
            return;
          }

          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(error);
          }
        });
      }
    );

    request.setTimeout(8000, () => {
      request.destroy(new Error("GitHub release check timed out"));
    });
    request.on("error", reject);
  });
}

function parseDesktopReleaseInfo(payload = {}) {
  const release = selectNewestPublishedRelease(payload) || {};
  const latestTag = release.tag_name || release.name || APP_DISPLAY_VERSION;
  const latestVersion = getLatestComparableVersion(release);

  return {
    latestTag,
    latestVersion,
    releaseName: release.name || latestTag,
    releaseUrl: release.html_url || RELEASES_URL,
    publishedAt: release.published_at || null,
    prerelease: !!release.prerelease,
    available: compareVersions(latestVersion, APP_VERSION) > 0,
  };
}

async function showDesktopUpdatePrompt(info) {
  const window = getPrimaryIracingWindow();
  const result = await dialog.showMessageBox(window || undefined, {
    type: "info",
    title: `${APP_NAME} update available`,
    message: `${APP_NAME} ${info.latestTag} is available`,
    detail:
      `Current version: ${APP_DISPLAY_VERSION}\n` +
      `Latest version: ${info.latestTag}\n\n` +
      `${info.prerelease ? "Release channel: Experimental\n\n" : ""}` +
      "Download the newer iRefinedX package or installer from GitHub Releases, then reopen the app.",
    buttons: ["Open GitHub Release", "Later"],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
  });

  writeLog("desktop-update-prompt", {
    latestTag: info.latestTag,
    response: result.response,
  });

  if (result.response === 0) {
    await shell.openExternal(info.releaseUrl || RELEASES_URL);
  }
}

async function checkForDesktopUpdates() {
  if (desktopUpdateCheckStarted || !REPO_SLUG) {
    return;
  }

  desktopUpdateCheckStarted = true;

  try {
    const payload = await fetchJson(RELEASES_API_URL);
    const info = parseDesktopReleaseInfo(payload);

    writeLog("desktop-update-check", {
      currentVersion: APP_VERSION,
      currentDisplayVersion: APP_DISPLAY_VERSION,
      ...info,
    });

    if (info.available) {
      await showDesktopUpdatePrompt(info);
    }
  } catch (error) {
    writeLog("desktop-update-check-failed", {
      releasesApiUrl: RELEASES_API_URL,
      error: serializeError(error),
    });
  }
}

function isMembersNgRacingUrl(url) {
  return /^https:\/\/members-ng\.iracing\.com\/web\/racing\//.test(url);
}

function isLegacyAccountUrl(url) {
  return /^https:\/\/members\.iracing\.com\/membersite\/account\//i.test(url);
}

function isLegacyOrderHistoryUrl(url) {
  return /^https:\/\/members\.iracing\.com\/membersite\/account\/OrderHistory\.do/i.test(
    url
  );
}

function isIrefinedTargetUrl(url) {
  return isMembersNgRacingUrl(url) || isLegacyAccountUrl(url);
}

async function resolveAutoNavigationTarget(webContents) {
  if (!IREF_NAV_TARGET) {
    return "";
  }

  if (IREF_NAV_TARGET === "go-racing") {
    try {
      return await webContents.executeJavaScript(
        `
(() => {
  const link = document.querySelector('a[href*="go-racing"]');
  return link ? link.href : "";
})()
        `,
        true
      );
    } catch (error) {
      return "";
    }
  }

  if (/^https?:\/\//i.test(IREF_NAV_TARGET)) {
    return IREF_NAV_TARGET;
  }

  const normalizedPath = IREF_NAV_TARGET.startsWith("/")
    ? IREF_NAV_TARGET
    : `/${IREF_NAV_TARGET}`;
  return `https://members-ng.iracing.com${normalizedPath}`;
}

function loadFallbackArtifacts() {
  const mainPath = path.join(EXTENSION_DIST_DIR, "main.js");
  const cssPath = path.join(EXTENSION_DIST_DIR, "extension.css");
  const bridgePath = path.join(EXTENSION_DIST_DIR, "bridge.js");
  const accountMainPath = path.join(EXTENSION_DIST_DIR, "account-main.js");
  const hasAccountMain = fs.existsSync(accountMainPath);

  if (
    !fs.existsSync(mainPath) ||
    !fs.existsSync(cssPath) ||
    !fs.existsSync(bridgePath)
  ) {
    return null;
  }

  return {
    main: fs.readFileSync(mainPath, "utf8"),
    css: fs.readFileSync(cssPath, "utf8"),
    bridge: fs.readFileSync(bridgePath, "utf8"),
    accountMain: hasAccountMain ? fs.readFileSync(accountMainPath, "utf8") : "",
  };
}

function getFallbackStoragePolyfill() {
  return `
(() => {
  if (window.chrome && window.chrome.storage && window.chrome.storage.local) {
    return;
  }

  const prefix = "irefined-electron-storage::";

  function normalizeKeys(keys) {
    if (keys == null) {
      return null;
    }

    if (Array.isArray(keys)) {
      return keys.map((key) => String(key));
    }

    if (typeof keys === "string") {
      return [keys];
    }

    if (typeof keys === "object") {
      return Object.keys(keys);
    }

    return [];
  }

  function readValue(key) {
    const raw = localStorage.getItem(prefix + key);

    if (raw == null) {
      return undefined;
    }

    try {
      return JSON.parse(raw);
    } catch (error) {
      return raw;
    }
  }

  function writeValue(key, value) {
    localStorage.setItem(prefix + key, JSON.stringify(value));
  }

  function getValues(keys) {
    if (keys == null) {
      const result = {};

      for (let index = 0; index < localStorage.length; index += 1) {
        const fullKey = localStorage.key(index);

        if (!fullKey || !fullKey.startsWith(prefix)) {
          continue;
        }

        const storageKey = fullKey.slice(prefix.length);
        result[storageKey] = readValue(storageKey);
      }

      return result;
    }

    const result = {};
    const keyList = normalizeKeys(keys);

    keyList.forEach((key) => {
      const value = readValue(key);

      if (value !== undefined) {
        result[key] = value;
      }
    });

    if (keys && typeof keys === "object" && !Array.isArray(keys)) {
      Object.keys(keys).forEach((key) => {
        if (!(key in result)) {
          result[key] = keys[key];
        }
      });
    }

    return result;
  }

  function runCallback(callback, value) {
    if (typeof callback === "function") {
      queueMicrotask(() => callback(value));
    }
  }

  const local = {
    get(keys, callback) {
      const result = getValues(keys);
      runCallback(callback, result);
    },
    set(values, callback) {
      Object.entries(values || {}).forEach(([key, value]) => {
        writeValue(key, value);
      });

      runCallback(callback);
    },
    remove(keys, callback) {
      normalizeKeys(keys).forEach((key) => {
        localStorage.removeItem(prefix + key);
      });

      runCallback(callback);
    },
  };

  window.chrome = {
    ...(window.chrome || {}),
    runtime: {
      ...((window.chrome && window.chrome.runtime) || {}),
      lastError: null,
    },
    storage: {
      ...((window.chrome && window.chrome.storage) || {}),
      local,
    },
  };
})();
`;
}

function getRuntimeProbeScript() {
  return `
(() => {
  if (window.__irefinedProbeInstalled) {
    return;
  }

  window.__irefinedProbeInstalled = true;

  const prefix = ${JSON.stringify(PROBE_PREFIX)};
  const enableVerboseNetworkLogs = ${JSON.stringify(ENABLE_VERBOSE_NETWORK_LOGS)};
  const windowControlsStyleId = "iref-window-controls-no-drag";

  function trimPayload(value) {
    if (value == null) {
      return value;
    }

    if (typeof value === "string") {
      return value.length > 1200 ? value.slice(0, 1200) + "...<trimmed>" : value;
    }

    if (value instanceof ArrayBuffer) {
      return "[arraybuffer:" + value.byteLength + "]";
    }

    if (typeof Blob !== "undefined" && value instanceof Blob) {
      return "[blob:" + value.size + "]";
    }

    if (ArrayBuffer.isView(value)) {
      return "[typed-array:" + value.byteLength + "]";
    }

    try {
      const serialized = JSON.stringify(value);
      return serialized.length > 1200
        ? serialized.slice(0, 1200) + "...<trimmed>"
        : serialized;
    } catch (error) {
      return String(value);
    }
  }

  function emit(type, detail) {
    try {
      console.debug(
        prefix +
          JSON.stringify({
            type,
            detail,
            href: window.location.href,
            ts: new Date().toISOString(),
          })
      );
    } catch (error) {}
  }

  function ensureWindowControlsNoDrag() {
    if (document.getElementById(windowControlsStyleId)) {
      return;
    }

    const style = document.createElement("style");
    style.id = windowControlsStyleId;
    style.textContent = [
      "button",
      "a",
      "input",
      "select",
      "textarea",
      "summary",
      "[role='button']",
      "[class*='button']",
      "[class*='Button']",
    ].join(",") + "{-webkit-app-region:no-drag !important;}";
    (document.head || document.documentElement || document.body).appendChild(style);
  }

  ensureWindowControlsNoDrag();

  function summarizeSystemVersions() {
    const versions = window.systemversions;

    if (!versions || typeof versions !== "object") {
      return null;
    }

    const keys = Object.keys(versions);

    return {
      count: keys.length,
      ui: versions.ui || null,
      uiirefinedlocal: versions.uiirefinedlocal || null,
      httproot: versions.httproot || null,
      cars: versions.cars || null,
      tracks: versions.tracks || null,
    };
  }

  function summarizeDownloadStatus() {
    const status = window.downloadstatus;

    if (!status || typeof status !== "object") {
      return null;
    }

    return {
      diskfreek: status.diskfreek ?? null,
      nFiles: status.nFiles ?? null,
      nError: status.nError ?? null,
      bActive: status.bActive ?? null,
      is_downloading: status.is_downloading ?? null,
      is_installing: status.is_installing ?? null,
    };
  }

  function summarizeIrefinedState() {
    const widgetRow = document.querySelector("#iref-dashboard-widget-row");
    const intelligenceCenter = document.querySelector("#iref-dashboard-intelligence-center");
    const purchaseSummary = document.querySelector("#iref-dashboard-purchase-summary");
    const widgetRowRect = widgetRow && typeof widgetRow.getBoundingClientRect === "function"
      ? widgetRow.getBoundingClientRect()
      : null;
    const intelligenceRect =
      intelligenceCenter && typeof intelligenceCenter.getBoundingClientRect === "function"
        ? intelligenceCenter.getBoundingClientRect()
        : null;

    return {
      loaded: !!window.__irefinedLoaded,
      hasStatusBar: !!document.querySelector("#iref-ui-root"),
      hasCustomRegistrationBanner: !!document.querySelector("#iref-registration-banner"),
      hasIntelligenceCenter: !!intelligenceCenter,
      hasPurchaseSummary: !!purchaseSummary,
      widgetRowSingle: widgetRow ? widgetRow.classList.contains("iref-dashboard-widget-row-single") : null,
      widgetRowColumns:
        widgetRow && typeof window.getComputedStyle === "function"
          ? window.getComputedStyle(widgetRow).gridTemplateColumns
          : "",
      widgetRowWidth: widgetRowRect ? Math.round(widgetRowRect.width) : null,
      intelligenceWidth: intelligenceRect ? Math.round(intelligenceRect.width) : null,
      hiddenNativeActionCount: document.querySelectorAll(".iref-native-action-hidden").length,
      hiddenNativeSessionButtonCount: document.querySelectorAll(".iref-session-view-hidden").length,
      queueButtons: document.querySelectorAll(".iref-queue-btn, .iref-session-register-btn").length,
      exportInlineButtons: document.querySelectorAll(".iref-inline-export-actions .iref-export-btn-inline").length,
      exportGroupButtons: document.querySelectorAll(".iref-export-actions .iref-export-btn").length,
      queueCount: Array.isArray(window.watchQueue) ? window.watchQueue.length : null,
      registrationState:
        window.irefRegistrationState && typeof window.irefRegistrationState === "object"
          ? {
              status: window.irefRegistrationState.status || null,
              season_id: window.irefRegistrationState.season_id ?? null,
              session_id: window.irefRegistrationState.session_id ?? null,
            }
          : null,
      wsState:
        window.__irefinedWsState && typeof window.__irefinedWsState === "object"
          ? {
              ready: !!window.__irefinedWsState.ready,
              initialized: !!window.__irefinedWsState.initialized,
              authConnected: !!window.__irefinedWsState.authConnected,
              clientConnected: !!window.__irefinedWsState.clientConnected,
              releaseId: window.__irefinedWsState.releaseId || "",
              lastError: window.__irefinedWsState.lastError || "",
              lastEvent: window.__irefinedWsState.lastEvent || "",
              lastCommand:
                window.__irefinedWsState.lastCommand &&
                typeof window.__irefinedWsState.lastCommand === "object"
                  ? {
                      event: window.__irefinedWsState.lastCommand.event || "",
                      service: window.__irefinedWsState.lastCommand.service || "",
                      method: window.__irefinedWsState.lastCommand.method || "",
                    }
                  : null,
            }
          : null,
    };
  }

  function captureGlobalState(reason) {
    emit("global-state", {
      reason,
      systemversions: summarizeSystemVersions(),
      downloadstatus: summarizeDownloadStatus(),
      irefined: summarizeIrefinedState(),
      hasElectronTRPC: !!window.electronTRPC,
      electronTRPCKeys:
        window.electronTRPC && typeof window.electronTRPC === "object"
          ? Object.keys(window.electronTRPC)
          : [],
    });
  }

  function captureUpdateModal(reason) {
    const modal =
      document.querySelector("#update-content-modal") ||
      Array.from(document.querySelectorAll('[role="dialog"], .modal'))
        .find((element) => /update content/i.test(element.textContent || ""));

    const bodyText = (modal ? modal.textContent : document.body.textContent || "")
      .replace(/\s+/g, " ")
      .trim();

    if (!modal && !/update content|required update|optional updates/i.test(bodyText)) {
      return;
    }

    const checkedCount = modal
      ? modal.querySelectorAll('input[type="checkbox"]:checked').length
      : null;
    const checkboxCount = modal
      ? modal.querySelectorAll('input[type="checkbox"]').length
      : null;
    const buttonLabels = modal
      ? Array.from(modal.querySelectorAll("button, .btn, [role='button']"))
          .map((element) => (element.textContent || "").replace(/\s+/g, " ").trim())
          .filter(Boolean)
      : [];
    const firstItems = modal
      ? Array.from(modal.querySelectorAll("tr, li"))
          .map((element) => (element.textContent || "").replace(/\s+/g, " ").trim())
          .filter(Boolean)
          .slice(0, 8)
      : [];

    emit("update-modal-state", {
      reason,
      visible: !!modal,
      checkedCount,
      checkboxCount,
      buttonLabels,
      firstItems,
      bodySnippet: bodyText.slice(0, 1200),
    });
  }

  let periodicSnapshotCount = 0;
  const periodicSnapshot = () => {
    captureGlobalState("interval");
    captureUpdateModal("interval");
    periodicSnapshotCount += 1;

    if (periodicSnapshotCount >= 12) {
      clearInterval(intervalId);
    }
  };

  window.addEventListener("load", () => {
    captureGlobalState("load");
    captureUpdateModal("load");
  });

  setTimeout(() => {
    captureGlobalState("timeout-1000");
    captureUpdateModal("timeout-1000");
  }, 1000);

  const intervalId = setInterval(periodicSnapshot, 5000);

  const mutationObserver = new MutationObserver(() => {
    clearTimeout(window.__irefinedModalMutationTick);
    window.__irefinedModalMutationTick = setTimeout(() => {
      captureGlobalState("mutation");
      captureUpdateModal("mutation");
    }, 250);
  });

  mutationObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
  });

  captureGlobalState("initial");
  captureUpdateModal("initial");

  const NativeWebSocket = window.WebSocket;

  if (NativeWebSocket) {
    const WrappedWebSocket = function(url, protocols) {
      const socket =
        arguments.length > 1
          ? new NativeWebSocket(url, protocols)
          : new NativeWebSocket(url);

      const targetUrl = String(url);
      emit("ws-open", { url: targetUrl });

      if (enableVerboseNetworkLogs) {
        socket.addEventListener("message", (event) => {
          emit("ws-message", {
            url: targetUrl,
            direction: "in",
            data: trimPayload(event.data),
          });
        });
      }

      socket.addEventListener("close", (event) => {
        emit("ws-close", {
          url: targetUrl,
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
      });

      socket.addEventListener("error", () => {
        emit("ws-error", { url: targetUrl });
      });

      if (enableVerboseNetworkLogs) {
        const nativeSend = socket.send;
        socket.send = function(data) {
          emit("ws-message", {
            url: targetUrl,
            direction: "out",
            data: trimPayload(data),
          });

          return nativeSend.call(this, data);
        };
      }

      return socket;
    };

    Object.setPrototypeOf(WrappedWebSocket, NativeWebSocket);
    WrappedWebSocket.prototype = NativeWebSocket.prototype;
    window.WebSocket = WrappedWebSocket;
  }

  if (typeof window.fetch === "function") {
    const nativeFetch = window.fetch;

    window.fetch = async function(input, init) {
      const requestUrl = typeof input === "string" ? input : input && input.url;
      const requestMethod =
        (init && init.method) ||
        (input && input.method) ||
        "GET";

      if (enableVerboseNetworkLogs) {
        emit("fetch", {
          phase: "request",
          method: requestMethod,
          url: requestUrl,
        });
      }

      const response = await nativeFetch.apply(this, arguments);

      if (enableVerboseNetworkLogs) {
        emit("fetch", {
          phase: "response",
          method: requestMethod,
          url: response.url || requestUrl,
          status: response.status,
        });
      }

      return response;
    };
  }

  if (window.XMLHttpRequest && window.XMLHttpRequest.prototype) {
    const nativeOpen = window.XMLHttpRequest.prototype.open;
    const nativeSend = window.XMLHttpRequest.prototype.send;

    window.XMLHttpRequest.prototype.open = function(method, url) {
      this.__irefinedMeta = {
        method,
        url,
      };

      return nativeOpen.apply(this, arguments);
    };

    window.XMLHttpRequest.prototype.send = function(body) {
      const meta = this.__irefinedMeta || {};

      if (enableVerboseNetworkLogs) {
        emit("xhr", {
          phase: "request",
          method: meta.method || "GET",
          url: meta.url,
          body: trimPayload(body),
        });
      }

      this.addEventListener("load", () => {
        if (enableVerboseNetworkLogs) {
          emit("xhr", {
            phase: "response",
            method: meta.method || "GET",
            url: meta.url,
            status: this.status,
          });
        }
      });

      this.addEventListener("error", () => {
        if (enableVerboseNetworkLogs) {
          emit("xhr", {
            phase: "error",
            method: meta.method || "GET",
            url: meta.url,
          });
        }
      });

      return nativeSend.apply(this, arguments);
    };
  }
})();
`;
}

async function injectFallbackIrefined(webContents) {
  if (IREF_MODE !== "fallback") {
    return;
  }

  const url = webContents.getURL();

  if (!isIrefinedTargetUrl(url)) {
    return;
  }

  const artifacts = loadFallbackArtifacts();

  if (!artifacts) {
    writeLog("irefined-fallback-skipped", {
      reason: "extension-dist-missing",
      url,
    });
    return;
  }

  const dedupeKey = `${webContents.id}:${url}`;
  if (injectedFallbackTargets.has(dedupeKey)) {
    return;
  }

  injectedFallbackTargets.add(dedupeKey);

  await webContents.executeJavaScript(
    `${getFallbackStoragePolyfill()}\n${artifacts.bridge}`,
    true
  );

  if (isMembersNgRacingUrl(url)) {
    await webContents.insertCSS(artifacts.css);
    await webContents.executeJavaScript(artifacts.main, true);
  }

  if (isLegacyOrderHistoryUrl(url) && artifacts.accountMain) {
    await webContents.executeJavaScript(artifacts.accountMain, true);
  }

  writeLog("irefined-fallback-injected", {
    url,
    webContentsId: webContents.id,
  });
}

async function maybeAutoNavigate(webContents) {
  const targetUrl = await resolveAutoNavigationTarget(webContents);

  if (!targetUrl) {
    return;
  }

  const currentUrl = webContents.getURL();

  if (!isMembersNgRacingUrl(currentUrl) || currentUrl === targetUrl) {
    return;
  }

  if (autoNavigatedTargets.has(webContents.id)) {
    return;
  }

  autoNavigatedTargets.add(webContents.id);

  writeLog("auto-nav-requested", {
    webContentsId: webContents.id,
    from: currentUrl,
    to: targetUrl,
  });

  await webContents.executeJavaScript(
    `if (window.location.href !== ${JSON.stringify(targetUrl)}) { window.location.assign(${JSON.stringify(
      targetUrl
    )}); }`,
    true
  );
}

function installSessionInstrumentation(defaultSession) {
  const urls = [
    "*://*.iracing.com/*",
    "http://127.0.0.1:32034/*",
    "ws://*/*",
    "wss://*/*",
  ];

  if (ENABLE_VERBOSE_NETWORK_LOGS) {
    defaultSession.webRequest.onBeforeRequest({ urls }, (details, callback) => {
      writeLog("network-before-request", {
        id: details.id,
        method: details.method,
        resourceType: details.resourceType,
        url: details.url,
        webContentsId: details.webContentsId,
      });

      callback({ cancel: false });
    });

    defaultSession.webRequest.onHeadersReceived(
      { urls },
      (details, callback) => {
        writeLog("network-headers", {
          id: details.id,
          method: details.method,
          resourceType: details.resourceType,
          statusCode: details.statusCode,
          url: details.url,
        });

        callback({
          cancel: false,
          responseHeaders: details.responseHeaders,
        });
      }
    );

    defaultSession.webRequest.onCompleted({ urls }, (details) => {
      writeLog("network-completed", {
        id: details.id,
        method: details.method,
        resourceType: details.resourceType,
        statusCode: details.statusCode,
        fromCache: details.fromCache,
        url: details.url,
      });
    });

    defaultSession.webRequest.onErrorOccurred({ urls }, (details) => {
      writeLog("network-error", {
        id: details.id,
        method: details.method,
        resourceType: details.resourceType,
        error: details.error,
        url: details.url,
      });
    });
  }

  defaultSession.on("will-download", (_event, item, webContents) => {
    const filename = item.getFilename() || "";
    const urlChain = item.getURLChain();
    const isJsonDownload =
      filename.toLowerCase().endsWith(".json") ||
      urlChain.some((url) => /^blob:|^data:/i.test(url));

    if (!isJsonDownload) {
      return;
    }

    item.setSaveDialogOptions({
      title: "Save JSON Export",
      defaultPath: path.join(app.getPath("downloads"), filename || "irefined-export.json"),
      buttonLabel: "Save JSON",
      filters: [
        {
          name: "JSON Files",
          extensions: ["json"],
        },
      ],
    });

    writeLog("json-download-intercepted", {
      filename,
      urlChain,
      webContentsId: webContents.id,
    });
  });
}

function getPrimaryIracingWindow() {
  const windows = BrowserWindow.getAllWindows().filter(
    (window) => !window.isDestroyed()
  );
  const focusedWindow = BrowserWindow.getFocusedWindow();

  const scoredWindows = windows
    .map((window) => ({
      window,
      score:
        (window === focusedWindow ? 100 : 0) +
        (window.isVisible() ? 40 : 0) +
        (!window.isMinimized() ? 20 : 0) +
        (window.getTitle() === "iRacing" ? 10 : 0),
    }))
    .sort((left, right) => right.score - left.score);

  return scoredWindows[0]?.window || focusedWindow || null;
}

function summarizeWindow(window) {
  if (!window || window.isDestroyed()) {
    return null;
  }

  return {
    id: window.id,
    title: window.getTitle(),
    visible: window.isVisible(),
    minimized: window.isMinimized(),
    maximized: window.isMaximized(),
    focused: window.isFocused(),
    bounds: window.getBounds(),
    url: window.webContents?.getURL?.() || "",
  };
}

function ensureMainWindowFullscreen(window) {
  if (window.isDestroyed()) {
    return;
  }

  if (window.getTitle() !== "iRacing") {
    return;
  }

  window.setMenuBarVisibility(false);
  window.setAutoHideMenuBar?.(true);

  if (window.isFullScreen()) {
    window.setFullScreen(false);
  }

  if (!window.isMaximized()) {
    window.maximize();
  }
}

function installWindowInteropHandlers() {
  function toggleMaximizeForWindow(window, action) {
    if (!window) {
      writeLog("window-control-missed", {
        action,
      });
      return false;
    }

    const wasMaximized = window.isMaximized();

    writeLog("window-control", {
      action,
      window: summarizeWindow(window),
    });

    if (wasMaximized) {
      window.unmaximize();
      return false;
    }

    if (window.isFullScreen()) {
      window.setFullScreen(false);
    }

    window.maximize();
    return true;
  }

  ipcMain.handle("iref.window.minimize", () => {
    const window = getPrimaryIracingWindow();

    if (!window) {
      writeLog("window-control-missed", {
        action: "minimize",
      });
      return false;
    }

    writeLog("window-control", {
      action: "minimize",
      window: summarizeWindow(window),
    });
    window.minimize();
    return true;
  });

  ipcMain.handle("iref.window.toggleMaximize", () => {
    return toggleMaximizeForWindow(getPrimaryIracingWindow(), "toggleMaximize");
  });

  ipcMain.handle("iref.window.unmaximize", () => {
    return toggleMaximizeForWindow(getPrimaryIracingWindow(), "unmaximize");
  });

  ipcMain.handle("iref.window.isMaximized", () => {
    const window = getPrimaryIracingWindow();
    writeLog("window-control", {
      action: "isMaximized",
      window: summarizeWindow(window),
    });
    return !!window?.isMaximized();
  });

  ipcMain.handle("iref.window.close", () => {
    const window = getPrimaryIracingWindow();

    if (!window) {
      writeLog("window-control-missed", {
        action: "close",
      });
      return false;
    }

    writeLog("window-control", {
      action: "close",
      window: summarizeWindow(window),
    });
    window.close();
    return true;
  });
}

function instrumentWindow(window) {
  if (!window || window.isDestroyed() || instrumentedWindows.has(window)) {
    return;
  }

  instrumentedWindows.add(window);
  const { webContents } = window;

  if (typeof webContents.setBackgroundThrottling === "function") {
    try {
      webContents.setBackgroundThrottling(false);
      writeLog("window-background-throttling-disabled", {
        window: summarizeWindow(window),
      });
    } catch (error) {
      writeLog("window-background-throttling-disable-failed", {
        window: summarizeWindow(window),
        error: serializeError(error),
      });
    }
  }

  window.on("ready-to-show", () => {
    ensureMainWindowFullscreen(window);
  });

  window.on("show", () => {
    ensureMainWindowFullscreen(window);
  });

  window.on("restore", () => {
    ensureMainWindowFullscreen(window);
  });

  window.on("page-title-updated", () => {
    ensureMainWindowFullscreen(window);
  });

  webContents.on("console-message", (_event, _level, message, line, sourceId) => {
    if (!message.startsWith(PROBE_PREFIX)) {
      return;
    }

    try {
      writeLog("renderer-probe", JSON.parse(message.slice(PROBE_PREFIX.length)));
    } catch (error) {
      writeLog("renderer-probe-parse-failed", {
        message,
        line,
        sourceId,
        error: serializeError(error),
      });
    }
  });

  async function injectIntoCurrentPage(trigger) {
    const url = webContents.getURL();

    if (!isIrefinedTargetUrl(url)) {
      return;
    }

    try {
      await webContents.executeJavaScript(getRuntimeProbeScript(), true);
      await injectFallbackIrefined(webContents);
      await maybeAutoNavigate(webContents);

      writeLog("window-injected", {
        trigger,
        url,
        webContentsId: webContents.id,
        title: window.getTitle(),
      });
    } catch (error) {
      writeLog("window-injection-failed", {
        trigger,
        url,
        webContentsId: webContents.id,
        error: serializeError(error),
      });
    }
  }

  webContents.on("dom-ready", () => {
    injectIntoCurrentPage("dom-ready");
  });

  webContents.on("did-navigate", () => {
    injectIntoCurrentPage("did-navigate");
  });

  webContents.on("did-navigate-in-page", () => {
    injectIntoCurrentPage("did-navigate-in-page");
  });
}

function installReadyHooks() {
  installWindowInteropHandlers();

  onElectronReady(() => {
    ensureLogDir();
    ensureRuntimePowerSaveBlocker();
    ensureRendererWakeInterval();
    installSessionInstrumentation(session.defaultSession);
    BrowserWindow.getAllWindows().forEach((window) => {
      instrumentWindow(window);
    });
    setTimeout(() => {
      void checkForDesktopUpdates();
    }, UPDATE_CHECK_DELAY_MS);

    writeLog("bootstrap", {
      rootDir: ROOT_DIR,
      extensionDist: EXTENSION_DIST_DIR,
      irefMode: IREF_MODE,
      appName: APP_NAME,
      appVersion: APP_VERSION,
      appReleaseChannel: APP_RELEASE_CHANNEL,
      verboseNetworkLogs: ENABLE_VERBOSE_NETWORK_LOGS,
      logDir: LOG_DIR,
    });
  });

  app.on("browser-window-created", (_event, window) => {
    instrumentWindow(window);
  });

  app.on("will-quit", () => {
    stopRendererWakeInterval();
    stopRuntimePowerSaveBlocker();
  });
}

installReadyHooks();
