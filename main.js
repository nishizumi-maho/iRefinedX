const { app, BrowserWindow, ipcMain, shell, session, nativeTheme, screen, dialog } = require("electron");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const net = require("node:net");
const vm = require("node:vm");
const { spawn } = require("node:child_process");
const { NativeIRacingBridge } = require("./native-iracing");
const localIRacing = require("./local-iracing");

const APP_ID = "com.nishizumi-maho.irefinedx";
const APP_TITLE = "iRefinedX";
const APP_REPOSITORY = {
  owner: "nishizumi-maho",
  repo: "iRefinedX",
};
const HELPER_ORIGIN = "http://127.0.0.1:32034";
const RPC_PORT = 50939;
const DEFAULT_WINDOW_WIDTH = 1280;
const DEFAULT_WINDOW_HEIGHT = 720;
const WINDOW_STATE_VERSION = 5;
const TITLEBAR_HEIGHT = 31;
const TITLEBAR_DARK = { color: "#12121B", symbolColor: "#D9D9DB" };
const TITLEBAR_LIGHT = { color: "#D9D9DB", symbolColor: "#12121B" };
const CUSTOM_EXTENSION_NAME = "iRefinedX Resources";
const GENERATED_CAR_IMAGE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const UPDATE_CACHE_TTL_MS = 15 * 60 * 1000;
const GITHUB_RELEASES_URL = `https://github.com/${APP_REPOSITORY.owner}/${APP_REPOSITORY.repo}/releases`;
const GITHUB_LATEST_RELEASE_API_URL =
  `https://api.github.com/repos/${APP_REPOSITORY.owner}/${APP_REPOSITORY.repo}/releases/latest`;
const VERBOSE_DIAGNOSTICS =
  !app.isPackaged ||
  process.env.IRX_VERBOSE_DIAGNOSTICS === "1" ||
  process.env.PROJETO_SECRETO_VERBOSE_DIAGNOSTICS === "1";
const DIAGNOSTIC_IMPORTANT_KINDS = new Set([
  "generated-car-cleanup-error",
  "generated-car-image-error",
  "generated-car-image-failed",
  "custom-extension-error",
  "custom-extension-init-error",
  "native-init-error",
  "protocol-registration-error",
  "titlebar-overlay-error",
  "join-error",
  "external-navigation-error",
  "did-fail-load",
  "json-rpc-parse-error",
  "json-rpc-socket-error",
  "sim-spawn-error",
  "update-check-error",
  "update-open-error",
]);
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/147.0.0.0 Safari/537.36 " +
  `iRefinedX/${app.getVersion()}`;

const remoteDebugPort =
  process.env.IRX_REMOTE_DEBUG_PORT ||
  process.env.PROJETO_SECRETO_REMOTE_DEBUG_PORT;

if (remoteDebugPort) {
  app.commandLine.appendSwitch(
    "remote-debugging-port",
    String(remoteDebugPort)
  );
}

let mainWindow = null;
let preventClose = false;
let settings = {
  zoom: 100,
  theme: nativeTheme.shouldUseDarkColors ? "dark" : "light",
  subdomainSuffix: "ng",
  displayMode: "monitor",
  windowState: null,
  windowStateVersion: WINDOW_STATE_VERSION,
};
let currentTask = null;
let rpcServer = null;
let rpcSockets = new Set();
let currentRpcPort = RPC_PORT;
let nativeRegisterTimer = null;
let cachedUpdateInfo = null;
let updateCheckStartedAt = 0;
let pendingUpdateCheck = null;
const nativeBridge = new NativeIRacingBridge({
  appendDiagnostic,
  emitSimStatus,
  sendBridgeEvent,
  getMainWindow: () => mainWindow,
});
let customExtensionUrl = "";

function getSettingsPath() {
  return path.join(app.getPath("userData"), "settings.json");
}

function getDiagnosticsPath() {
  return path.join(app.getPath("userData"), "irefinedx-diagnostics.log");
}

function shouldPersistDiagnostic(kind) {
  if (VERBOSE_DIAGNOSTICS) {
    return true;
  }

  const normalizedKind = String(kind || "").toLowerCase();
  return (
    DIAGNOSTIC_IMPORTANT_KINDS.has(kind) ||
    normalizedKind.includes("error") ||
    normalizedKind.includes("fail")
  );
}

function appendDiagnostic(kind, details) {
  if (!shouldPersistDiagnostic(kind)) {
    return;
  }

  try {
    fs.mkdirSync(app.getPath("userData"), { recursive: true });
    fs.appendFileSync(
      getDiagnosticsPath(),
      `${new Date().toISOString()} [${kind}] ${String(details)}${os.EOL}`,
      "utf8"
    );
  } catch {
  }
}

function loadSettings() {
  let persistedWindowStateVersion = null;
  try {
    const raw = fs.readFileSync(getSettingsPath(), "utf8");
    const persistedSettings = JSON.parse(raw);
    persistedWindowStateVersion = persistedSettings.windowStateVersion;
    settings = {
      ...settings,
      ...persistedSettings,
    };
  } catch {
  }

  if (persistedWindowStateVersion !== WINDOW_STATE_VERSION) {
    settings.windowState = null;
    settings.windowStateVersion = WINDOW_STATE_VERSION;
    saveSettings();
  }
}

function saveSettings() {
  try {
    fs.mkdirSync(path.dirname(getSettingsPath()), { recursive: true });
    fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2), "utf8");
  } catch {
  }
}

function normalizeVersionParts(value) {
  const match = String(value || "").trim().match(/\d+(?:\.\d+)*/);
  if (!match) {
    return [];
  }

  return match[0]
    .split(".")
    .map((entry) => Number.parseInt(entry, 10))
    .filter((entry) => Number.isFinite(entry));
}

function compareVersions(left, right) {
  const a = normalizeVersionParts(left);
  const b = normalizeVersionParts(right);
  const length = Math.max(a.length, b.length);

  for (let index = 0; index < length; index += 1) {
    const av = a[index] || 0;
    const bv = b[index] || 0;
    if (av > bv) {
      return 1;
    }
    if (av < bv) {
      return -1;
    }
  }

  return 0;
}

function resolveLatestReleaseUrl(release) {
  const assets = Array.isArray(release && release.assets) ? release.assets : [];
  const preferredAsset = assets.find((asset) => (
    asset &&
    typeof asset.browser_download_url === "string" &&
    /IRX.*\.exe$/i.test(asset.name || "")
  )) || assets.find((asset) => (
    asset &&
    typeof asset.browser_download_url === "string" &&
    /\.exe$/i.test(asset.name || "")
  ));

  return preferredAsset && preferredAsset.browser_download_url
    ? preferredAsset.browser_download_url
    : (release && release.html_url) || `${GITHUB_RELEASES_URL}/latest`;
}

async function fetchLatestReleaseInfo() {
  const response = await fetch(GITHUB_LATEST_RELEASE_API_URL, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": `iRefinedX/${app.getVersion()}`,
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub update check failed with status ${response.status}`);
  }

  const release = await response.json();
  const releaseVersion = String(release.tag_name || release.name || "").trim();

  return {
    currentVersion: app.getVersion(),
    latestVersion: releaseVersion,
    updateAvailable: compareVersions(releaseVersion, app.getVersion()) > 0,
    releaseName: String(release.name || release.tag_name || "Latest release"),
    releaseUrl: (release && release.html_url) || `${GITHUB_RELEASES_URL}/latest`,
    downloadUrl: resolveLatestReleaseUrl(release),
    publishedAt: release && release.published_at ? String(release.published_at) : "",
    body: release && release.body ? String(release.body) : "",
  };
}

async function checkForAppUpdate(force = false) {
  if (!force && cachedUpdateInfo && Date.now() - updateCheckStartedAt < UPDATE_CACHE_TTL_MS) {
    return cachedUpdateInfo;
  }

  if (!force && pendingUpdateCheck) {
    return pendingUpdateCheck;
  }

  pendingUpdateCheck = fetchLatestReleaseInfo()
    .then((info) => {
      cachedUpdateInfo = info;
      updateCheckStartedAt = Date.now();
      return info;
    })
    .catch((error) => {
      appendDiagnostic("update-check-error", String(error && error.message ? error.message : error));
      const info = {
        currentVersion: app.getVersion(),
        latestVersion: app.getVersion(),
        updateAvailable: false,
        releaseName: "Latest release",
        releaseUrl: `${GITHUB_RELEASES_URL}/latest`,
        downloadUrl: `${GITHUB_RELEASES_URL}/latest`,
        publishedAt: "",
        body: "",
        error: String(error && error.message ? error.message : error),
      };
      cachedUpdateInfo = info;
      updateCheckStartedAt = Date.now();
      return info;
    })
    .finally(() => {
      pendingUpdateCheck = null;
    });

  return pendingUpdateCheck;
}

async function openLatestReleaseUrl(preferredUrl = "") {
  const target = preferredUrl || (cachedUpdateInfo && (cachedUpdateInfo.downloadUrl || cachedUpdateInfo.releaseUrl)) || `${GITHUB_RELEASES_URL}/latest`;
  await shell.openExternal(target);
  return { ok: true, url: target };
}

function getLaunchAtStartupState() {
  try {
    return app.getLoginItemSettings().openAtLogin === true;
  } catch {
    return false;
  }
}

function setLaunchAtStartupState(enabled) {
  try {
    app.setLoginItemSettings({
      openAtLogin: !!enabled,
      openAsHidden: false,
      path: process.execPath,
      args: [],
    });
  } catch (error) {
    appendDiagnostic("startup-setting-error", String(error && error.message ? error.message : error));
  }

  return getLaunchAtStartupState();
}

function normalizeThemeSource(theme) {
  return ["dark", "light", "system"].includes(theme) ? theme : "system";
}

function getTitleBarOverlayOptions() {
  return {
    height: TITLEBAR_HEIGHT,
    ...(nativeTheme.shouldUseDarkColors ? TITLEBAR_DARK : TITLEBAR_LIGHT),
  };
}

function updateTitleBarOverlay() {
  if (!mainWindow || mainWindow.isDestroyed() || typeof mainWindow.setTitleBarOverlay !== "function") {
    return;
  }

  try {
    mainWindow.setTitleBarOverlay(getTitleBarOverlayOptions());
  } catch (error) {
    appendDiagnostic("titlebar-overlay-error", String(error && error.message ? error.message : error));
  }
}

function setUiTheme(theme) {
  settings.theme = normalizeThemeSource(theme);
  nativeTheme.themeSource = settings.theme;
  saveSettings();
  updateTitleBarOverlay();
  return settings.theme;
}

function getTargetEnvironment() {
  return localIRacing.targetEnvironment();
}

function getDashboardUrl() {
  return localIRacing.dashboardUrl(settings.subdomainSuffix || "ng");
}

function getWebOrigin() {
  return localIRacing.webOrigin(getTargetEnvironment(), settings.subdomainSuffix || "ng");
}

function getUrlForWebPath(webPath) {
  const target = new URL(`${getWebOrigin()}/web/`);
  target.pathname = `/web/${String(webPath || "").replace(/^\/+/, "")}`;
  return target;
}

function getDefaultWindowState() {
  const { bounds } = screen.getPrimaryDisplay();
  const width = Math.min(DEFAULT_WINDOW_WIDTH, bounds.width);
  const height = Math.min(DEFAULT_WINDOW_HEIGHT, bounds.height);

  return {
    width,
    height,
    x: Math.max(bounds.x, Math.round(bounds.x + (bounds.width - width) / 2)),
    y: Math.max(bounds.y, Math.round(bounds.y + (bounds.height - height) / 2)),
    isMaximized: false,
  };
}

function isValidWindowState(state) {
  if (!state || typeof state !== "object") {
    return false;
  }

  if (state.isMaximized) {
    return true;
  }

  const { x, y, width, height } = state;
  if (![x, y, width, height].every(Number.isFinite)) {
    return false;
  }

  return screen.getAllDisplays().some(({ bounds }) => (
    width >= DEFAULT_WINDOW_WIDTH &&
    height >= DEFAULT_WINDOW_HEIGHT &&
    x >= bounds.x &&
    y >= bounds.y &&
    x + width <= bounds.x + bounds.width &&
    y + height <= bounds.y + bounds.height
  ));
}

function getWindowState() {
  if (isValidWindowState(settings.windowState)) {
    return settings.windowState;
  }

  const state = getDefaultWindowState();
  settings.windowState = state;
  saveSettings();
  return state;
}

function persistWindowState() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  const previous = isValidWindowState(settings.windowState)
    ? settings.windowState
    : getDefaultWindowState();
  let state;

  if (mainWindow.isMaximized()) {
    state = {
      ...previous,
      isMaximized: true,
    };
  } else {
    const [x, y] = mainWindow.getPosition();
    const [width, height] = mainWindow.getSize();
    state = { x, y, width, height, isMaximized: false };
  }

  if (!isValidWindowState(state)) {
    return;
  }

  settings.windowState = state;
  saveSettings();
}

let windowStateSaveTimer = null;

function scheduleWindowStateSave() {
  if (windowStateSaveTimer) {
    clearTimeout(windowStateSaveTimer);
  }

  windowStateSaveTimer = setTimeout(() => {
    windowStateSaveTimer = null;
    persistWindowState();
  }, 500);
}

function sendBridgeEvent(event, payload) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  mainWindow.webContents.send("ps-bridge-event", { event, payload });
}

function emitSimStatus(status, message = null, percentComplete = null) {
  appendDiagnostic("sim-status", JSON.stringify({ status, message, percentComplete }));
  sendBridgeEvent("simStatus", { status, message, percentComplete });
}

function sendSimEnding(payload) {
  sendBridgeEvent("simEnding", payload || null);
}

function isIracingUrl(url) {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.endsWith("iracing.com") ||
      (parsed.hostname === "127.0.0.1" && parsed.port === "32034")
    );
  } catch {
    return false;
  }
}

function getDeepLinkedPath(argv = process.argv) {
  const allowedPrefixes = ["help", "racing", "receipt", "settings", "shop"];
  const stripPrefixes = ["web/", "commercial/", "payments/", "demo-drive/"];

  for (const arg of argv || []) {
    const match = String(arg || "").match(/^iracing(?:-(secure|alpha|beta|gamma|staging))?:\/\/(.*)$/i);
    if (!match || !match[2]) {
      continue;
    }

    const environment = match[1] || null;
    const rawPath = match[2].replace(/^\/+/, "");
    const route = stripPrefixes.reduce((current, prefix) => (
      current.startsWith(prefix) ? current.slice(prefix.length) : current
    ), rawPath);

    if (allowedPrefixes.some((prefix) => route.startsWith(prefix))) {
      return { environment, path: rawPath };
    }
  }

  return null;
}

function getUrlForDeepLinkedPath(deepLink) {
  if (!deepLink) {
    return getDashboardUrl();
  }

  const environment = deepLink.environment ? localIRacing.environmentFamily(deepLink.environment) : getTargetEnvironment();
  const origin = localIRacing.webOrigin(environment, settings.subdomainSuffix || "ng");
  const target = new URL(`${origin}/web/`);
  const [pathname, search] = String(deepLink.path || "").split("?");
  const normalizedPath = pathname.startsWith("web/")
    ? pathname.slice("web/".length)
    : pathname;

  target.pathname = `/web/${normalizedPath.replace(/^\/+/, "")}`;
  if (search) {
    target.search = search;
  }

  return target.href;
}

function focusMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  try {
    mainWindow.restore();
  } catch {
  }

  if (!mainWindow.isVisible()) {
    mainWindow.show();
  }

  mainWindow.focus();
}

function handleSecondInstance(argv) {
  appendDiagnostic("second-instance", JSON.stringify(argv || []));
  const deepLinkedPath = getDeepLinkedPath(argv);
  if (deepLinkedPath && mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.loadURL(getUrlForDeepLinkedPath(deepLinkedPath));
  }

  focusMainWindow();
}

function isLocalJoinUrl(url) {
  try {
    const parsed = new URL(url, getDashboardUrl());
    if (parsed.protocol !== "http:" || parsed.hostname !== "127.0.0.1" || parsed.port !== "32034") {
      return false;
    }

    return ["/goracing", "/gotesting", "/gonaked"].includes(parsed.pathname.toLowerCase());
  } catch {
    return false;
  }
}

function normalizeLocalJoinParameter(value) {
  try {
    const parsed = new URL(String(value), getDashboardUrl());
    if (!isLocalJoinUrl(parsed.toString())) {
      return String(value || "");
    }

    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return String(value || "");
  }
}

function parseCommandLineOptions(raw) {
  const text = String(raw || "");
  const queryIndex = text.indexOf("?");
  const query = queryIndex >= 0 ? text.slice(queryIndex + 1) : text.replace(/^\?/, "");
  const params = new URLSearchParams(query);
  const result = {};

  for (const [key, value] of params.entries()) {
    if (key) {
      result[key] = value;
    }
  }

  return result;
}

function extractCommandLineOptions(task) {
  if (!task || typeof task !== "object") {
    return "";
  }

  const parameters = task.parameters;
  if (parameters && typeof parameters === "object" && typeof parameters.commandLineOptions === "string") {
    return parameters.commandLineOptions;
  }

  if (typeof parameters === "string") {
    return parameters;
  }

  return "";
}

function normalizeTask(task) {
  if (!task || typeof task !== "object") {
    return task;
  }

  if (String(task.task || "").toLowerCase() === "legacyjoinserver" && typeof task.parameters === "string") {
    return {
      ...task,
      parameters: normalizeLocalJoinParameter(task.parameters),
    };
  }

  return task;
}

function extractJsonMessages(buffer) {
  const messages = [];
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < buffer.length; index += 1) {
    const char = buffer[index];

    if (start === -1) {
      if (char === "{") {
        start = index;
        depth = 1;
      }
      continue;
    }

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        messages.push(buffer.slice(start, index + 1));
        start = -1;
      }
    }
  }

  return {
    messages,
    remaining: start === -1 ? "" : buffer.slice(start),
  };
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  return response.text();
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseHelperAssignedObject(scriptText, variableName) {
  const pattern = new RegExp(
    `(?:var|let|const)\\s+${escapeRegExp(variableName)}\\s*=\\s*(\\{[\\s\\S]*\\})\\s*;?\\s*$`,
    "i"
  );
  const match = String(scriptText || "").match(pattern);
  if (match && match[1]) {
    return JSON.parse(match[1]);
  }

  const sandbox = Object.create(null);
  vm.runInNewContext(String(scriptText || ""), sandbox, { timeout: 1000 });
  const value = sandbox[variableName];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Unable to parse helper payload for ${variableName}`);
  }

  return JSON.parse(JSON.stringify(value));
}

async function tryGetSystemVersionsFromHelper() {
  try {
    const text = await fetchText(`${HELPER_ORIGIN}/get_versions2?nocache=${Date.now()}`);
    const versions = parseHelperAssignedObject(text, "systemversions");
    appendDiagnostic(
      "helper-systemversions",
      JSON.stringify({
        ok: true,
        keyCount: Object.keys(versions).length,
        system: versions.system || null,
        cars: versions.cars || null,
        tracks: versions.tracks || null,
      })
    );
    return versions;
  } catch (error) {
    appendDiagnostic(
      "helper-systemversions",
      String(error && error.message ? error.message : error)
    );
    return null;
  }
}

async function tryGetInstallRootFromHelper() {
  try {
    const text = await fetchText(`${HELPER_ORIGIN}/get_localservice_dir`);
    const match = text.match(/dir\s*:\s*"([^"]*)"/i);
    return match ? match[1] : "";
  } catch (error) {
    appendDiagnostic("helper-install-root", String(error && error.message ? error.message : error));
    return "";
  }
}

async function getInstallRoot() {
  const helperRoot = await tryGetInstallRootFromHelper();
  const candidates = [
    helperRoot,
    "C:\\Program Files (x86)\\iRacing",
    "C:\\Program Files\\iRacing",
    "D:\\Program Files (x86)\\iRacing",
    "D:\\Program Files\\iRacing",
  ].filter(Boolean);

  for (const candidate of candidates) {
    const sim = path.join(candidate, "iRacingSim64DX11.exe");
    const protectedGame = path.join(candidate, "start_protected_game.exe");
    if (fs.existsSync(sim) || fs.existsSync(protectedGame)) {
      return candidate;
    }
  }

  return helperRoot;
}

function tryReadText(filePath) {
  try {
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8").trim() : "";
  } catch {
    return "";
  }
}

function addVersionAlias(target, key, value) {
  if (key) {
    target[key] = value;
  }
}

function normalizeVersionKey(relativeDirectory) {
  return relativeDirectory
    .split(/[\\/]+/)
    .filter(Boolean)
    .join("_")
    .toLowerCase();
}

function normalizeVersionPath(relativeDirectory, separator) {
  return relativeDirectory
    .split(/[\\/]+/)
    .filter(Boolean)
    .join(separator)
    .toLowerCase();
}

function addPathVersionAliases(target, relativeDirectory, versionSuffix, value) {
  const slashKey = normalizeVersionPath(relativeDirectory, "/");
  const backslashKey = normalizeVersionPath(relativeDirectory, "\\");
  const pathSuffix = versionSuffix ? `_${versionSuffix}` : "";

  addVersionAlias(target, `${slashKey}${pathSuffix}`, value);
  addVersionAlias(target, `${backslashKey}${pathSuffix}`, value);
  addVersionAlias(target, `httproot/${slashKey}${pathSuffix}`, value);
  addVersionAlias(target, `httproot\\${backslashKey}${pathSuffix}`, value);

  if (versionSuffix) {
    addVersionAlias(target, `${slashKey}/${versionSuffix}`, value);
    addVersionAlias(target, `${backslashKey}\\${versionSuffix}`, value);
    addVersionAlias(target, `httproot/${slashKey}/${versionSuffix}`, value);
    addVersionAlias(target, `httproot\\${backslashKey}\\${versionSuffix}`, value);
  }
}

function addInstalledPackageVersions(installRoot, target) {
  if (!installRoot || !fs.existsSync(installRoot)) {
    return;
  }

  const stack = [installRoot];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolute);
        continue;
      }

      if (!entry.isFile() || !/^version.*\.txt$/i.test(entry.name)) {
        continue;
      }

      const relativeDirectory = path.relative(installRoot, path.dirname(absolute));
      if (!relativeDirectory || relativeDirectory === "." || /^ui([\\/]|$)/i.test(relativeDirectory)) {
        continue;
      }

      const value = tryReadText(absolute);
      if (!value) {
        continue;
      }

      let key = normalizeVersionKey(relativeDirectory);
      const name = path.basename(entry.name, ".txt");
      const suffix = name.toLowerCase().startsWith("version_") ? name.slice("version_".length).toLowerCase() : "";

      if (suffix) {
        key = `${key}_${suffix}`;
      }

      addVersionAlias(target, key, value);
      addVersionAlias(target, `httproot_${key}`, value);
      addPathVersionAliases(target, relativeDirectory, suffix, value);
    }
  }
}

async function getFallbackSystemVersions(installRoot) {
  const helperVersions = await tryGetSystemVersionsFromHelper();
  if (helperVersions && typeof helperVersions === "object") {
    const versions = { ...helperVersions };
    versions.install_dir = versions.install_dir || installRoot;
    versions.ui = versions.ui || tryReadText(path.join(installRoot, "ui", "version.txt"));
    versions.ui_version = versions.ui_version || versions.ui;
    versions.electron_version =
      versions.electron_version || tryReadText(path.join(installRoot, "ui", "version"));
    versions.iracingservice = versions.iracingservice || "";
    versions.anticheat_engine =
      versions.anticheat_engine ||
      (fs.existsSync(path.join(installRoot, "EOSSDK-Win64-Shipping.dll")) ? "EOS" : "EAC");
    return versions;
  }

  const versions = {
    is_admin: 0,
    is_winxp: 0,
    is_64bit_os: os.arch() === "x64" ? 1 : 0,
    use_64bit_sim: 1,
    use_dx11: 1,
    use_steam: 0,
    has_ipv6: os.networkInterfaces ? 1 : 0,
    use_ipv6: 0,
    status_cxq11: 0,
    anticheat_engine: fs.existsSync(path.join(installRoot, "EOSSDK-Win64-Shipping.dll")) ? "EOS" : "EAC",
    install_dir: installRoot,
    ui: tryReadText(path.join(installRoot, "ui", "version.txt")),
    ui_version: tryReadText(path.join(installRoot, "ui", "version.txt")),
    electron_version: tryReadText(path.join(installRoot, "ui", "version")),
    iracingservice: "",
  };

  const systemVersion = tryReadText(path.join(installRoot, "version_system.txt"));
  if (systemVersion) {
    versions.system = systemVersion;
    versions.updater = systemVersion;
  }

  addInstalledPackageVersions(installRoot, versions);
  return versions;
}

function mergeVersionPayloads(fallbackVersions, nativeVersions, installRoot) {
  const merged = { ...(fallbackVersions || {}) };
  if (nativeVersions && typeof nativeVersions === "object") {
    for (const [key, value] of Object.entries(nativeVersions)) {
      if (value !== undefined && value !== null && value !== "") {
        merged[key] = value;
      }
    }
  }

  merged.install_dir = merged.install_dir || installRoot;
  return merged;
}

async function getSystemVersions() {
  const installRoot = await getInstallRoot();
  localIRacing.configure({ installRoot });
  if (!nativeBridge.isAvailable()) {
    nativeBridge.load(path.join(installRoot, "ui", "iRacingViewer.dll"));
  }

  const fallbackVersions = await getFallbackSystemVersions(installRoot);
  const nativeVersions = nativeBridge.getVersions();
  return mergeVersionPayloads(fallbackVersions, nativeVersions, installRoot);
}

async function getInstallInformation() {
  const installDirectory = await getInstallRoot();
  localIRacing.configure({ installRoot: installDirectory });
  return {
    installDirectory,
    documentsDirectory: localIRacing.documentsDir(),
    appDataDirectory: localIRacing.localAppDataDir(),
    elevated: false,
    safeMode: !nativeBridge.isAvailable() || !nativeBridge.isTransparencyEnabled(),
  };
}

async function isLocalServiceRunning() {
  try {
    const response = await fetch(`${HELPER_ORIGIN}/get_sim_status`);
    return response.ok;
  } catch {
    return false;
  }
}

function getHardwareSnapshot() {
  const macs = [];
  const networkInterfaces = os.networkInterfaces();
  for (const entries of Object.values(networkInterfaces)) {
    for (const entry of entries || []) {
      if (entry && entry.mac && entry.mac !== "00:00:00:00:00:00") {
        macs.push(entry.mac.replace(/:/g, "").toUpperCase());
      }
    }
  }

  return {
    nodeHwId: os.hostname(),
    disk: [],
    mac: Array.from(new Set(macs)),
  };
}

function uiResourcesDir() {
  return path.join(localIRacing.localAppDataDir(), "uiResources");
}

function generatedCarImagesDir() {
  return path.join(uiResourcesDir(), "cars");
}

async function initializeCustomExtension() {
  const resourcesDir = uiResourcesDir();
  const carsDir = generatedCarImagesDir();
  await fs.promises.mkdir(carsDir, { recursive: true });
  await fs.promises.writeFile(
    path.join(resourcesDir, "manifest.json"),
    JSON.stringify({
      name: CUSTOM_EXTENSION_NAME,
      manifest_version: 2,
      version: "1.0",
      web_accessible_resources: ["*.mp4", "*.png", "cars/*.png"],
    }, null, 2),
    "utf8"
  );

  const extensionsApi = session.defaultSession && session.defaultSession.extensions;
  if (!extensionsApi) {
    customExtensionUrl = "";
    return customExtensionUrl;
  }

  const existing = extensionsApi.getAllExtensions().find((extension) => extension.name === CUSTOM_EXTENSION_NAME);
  const extension = existing || await extensionsApi.loadExtension(resourcesDir, { allowFileAccess: true });
  customExtensionUrl = extension && extension.url
    ? extension.url.endsWith("/") ? extension.url : `${extension.url}/`
    : "";
  return customExtensionUrl;
}

async function getCustomExtensionUrl() {
  if (customExtensionUrl) {
    return customExtensionUrl;
  }

  try {
    return await initializeCustomExtension();
  } catch (error) {
    appendDiagnostic("custom-extension-error", String(error && error.message ? error.message : error));
    return null;
  }
}

async function cleanupExpiredGeneratedCarImages() {
  const carsDir = generatedCarImagesDir();
  try {
    await fs.promises.mkdir(carsDir, { recursive: true });
    const entries = await fs.promises.readdir(carsDir, { withFileTypes: true });
    const cutoff = Date.now() - GENERATED_CAR_IMAGE_TTL_MS;
    await Promise.all(entries.filter((entry) => entry.isFile()).map(async (entry) => {
      const filePath = path.join(carsDir, entry.name);
      const stat = await fs.promises.stat(filePath);
      if (stat.mtimeMs < cutoff) {
        await fs.promises.rm(filePath, { force: true });
      }
    }));
  } catch (error) {
    appendDiagnostic("generated-car-cleanup-error", String(error && error.message ? error.message : error));
  }
}

function safeCarImageHash(hash) {
  const value = String(hash || "");
  if (!/^[0-9a-zA-Z_-]+$/.test(value)) {
    throw new Error("Invalid generated car image hash.");
  }
  return value;
}

async function generateCarImage(request) {
  const hash = safeCarImageHash(request && request.hash);
  const extensionUrl = await getCustomExtensionUrl();
  if (!extensionUrl) {
    return null;
  }

  const filePath = path.join(generatedCarImagesDir(), `${hash}.png`);
  if (!fs.existsSync(filePath)) {
    const installRoot = await getInstallRoot();
    localIRacing.configure({ installRoot });
    if (!nativeBridge.isAvailable()) {
      nativeBridge.load(path.join(installRoot, "ui", "iRacingViewer.dll"));
    }
    const ok = nativeBridge.getCarWebImage(filePath, request || {});
    if (!ok || !fs.existsSync(filePath)) {
      appendDiagnostic("generated-car-image-failed", hash);
      return null;
    }
  }

  return {
    hash,
    url: `${extensionUrl}cars/${hash}.png`,
  };
}

function normalizeTaskForRpc(task) {
  const normalized = normalizeTask(task);
  if (!normalized || typeof normalized !== "object") {
    return normalized;
  }

  if (String(normalized.task || "").toLowerCase() !== "legacyjoinserver") {
    return normalized;
  }

  return {
    ...normalized,
    parameters: normalizeLocalJoinParameter(normalized.parameters),
  };
}

function taskNeedsEac(task) {
  const options = parseCommandLineOptions(extractCommandLineOptions(task));
  const taskName = String((task && task.task) || "");
  const isLocal = String(options.local || "").toLowerCase() === "yes";
  const isTimeAttack = !!options.time_attack;
  const isReplay = taskName === "legacyPlayReplay";
  return (!isLocal || isTimeAttack) && !isReplay;
}

function buildLaunchArguments(task, displayMode) {
  const normalizedTask = normalizeTaskForRpc(task);
  const options = parseCommandLineOptions(extractCommandLineOptions(normalizedTask));
  const installRoot = currentTask && currentTask.installRoot ? currentTask.installRoot : "";
  const protectedGamePath = path.join(installRoot, "start_protected_game.exe");
  const simPath = path.join(installRoot, "iRacingSim64DX11.exe");
  const anticheatEngine = String(
    (currentTask && currentTask.systemVersions && currentTask.systemVersions.anticheat_engine) ||
    (fs.existsSync(path.join(installRoot, "EOSSDK-Win64-Shipping.dll")) ? "EOS" : "EAC")
  ).toUpperCase();
  const isProtected = anticheatEngine === "EOS" && fs.existsSync(protectedGamePath);
  const executable = isProtected ? protectedGamePath : simPath;

  if (!fs.existsSync(executable)) {
    throw new Error("Nao foi possivel localizar o executavel do simulador.");
  }

  const args = [`-ui_port=${currentRpcPort || RPC_PORT}`];
  if (displayMode) {
    args.push(`-display_mode=${displayMode}`);
  }

  if (isProtected && options.access_token) {
    args.push(`-access_token=${options.access_token}`);
  }

  if (isProtected && localIRacing.environmentFamily(getTargetEnvironment()) === "staging") {
    args.push("-anticheat_settings=..\\Settings_STAGING.json");
  }

  if (!isProtected && taskNeedsEac(normalizedTask)) {
    args.push("-need_eac");
  }

  return { executable, args, workingDirectory: installRoot };
}

function closeRpcServer() {
  for (const socket of rpcSockets) {
    try {
      socket.destroy();
    } catch {
    }
  }
  rpcSockets.clear();

  if (rpcServer) {
    try {
      rpcServer.close();
    } catch {
    }
    rpcServer = null;
  }
}

async function ensureRpcServer(task) {
  const installRoot = await getInstallRoot();
  localIRacing.configure({ installRoot });
  currentTask = {
    task: normalizeTaskForRpc(task),
    installRoot,
    systemVersions: await getSystemVersions(),
  };

  if (rpcServer) {
    return;
  }

  rpcServer = net.createServer((socket) => {
    rpcSockets.add(socket);
    let pending = "";

    emitSimStatus("Sim Loading", "Handshake com o simulador estabelecido.");

    socket.on("data", (chunk) => {
      pending += chunk.toString("utf8");
      const parsed = extractJsonMessages(pending);
      pending = parsed.remaining;

      for (const json of parsed.messages) {
        try {
          const message = JSON.parse(json);
          appendDiagnostic("json-rpc-rx", JSON.stringify(message));
          handleRpcMessage(socket, message);
        } catch (error) {
          appendDiagnostic("json-rpc-parse-error", String(error && error.message ? error.message : error));
        }
      }
    });

    socket.on("close", () => {
      rpcSockets.delete(socket);
    });

    socket.on("error", (error) => {
      appendDiagnostic("json-rpc-socket-error", String(error && error.message ? error.message : error));
      rpcSockets.delete(socket);
    });
  });

  await new Promise((resolve, reject) => {
    rpcServer.once("error", reject);
    rpcServer.listen(0, "127.0.0.1", () => {
      rpcServer.off("error", reject);
      currentRpcPort = Number(rpcServer.address().port) || RPC_PORT;
      appendDiagnostic("json-rpc-server", `Listening on ${currentRpcPort}`);
      resolve();
    });
  });
}

function writeRpc(socket, payload) {
  const text = JSON.stringify(payload);
  appendDiagnostic("json-rpc-tx", text);
  socket.write(text);
}

function handleRpcMessage(socket, message) {
  const id = Object.prototype.hasOwnProperty.call(message, "id") ? message.id : null;
  switch (message.method) {
    case "getTask":
      writeRpc(socket, {
        jsonrpc: "2.0",
        id,
        result: currentTask.task,
      });
      emitSimStatus("Sim Running", "Task entregue ao simulador.");
      break;

    case "simEnding":
      sendSimEnding(message.params || null);
      writeRpc(socket, {
        jsonrpc: "2.0",
        id,
        result: {},
      });
      break;

    case "simEnded":
      writeRpc(socket, {
        jsonrpc: "2.0",
        id,
        result: {},
      });
      emitSimStatus("Sim Inactive", "Sessao finalizada.");
      break;

    default:
      writeRpc(socket, {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32601,
          message: "Method not found",
        },
      });
      break;
  }
}

async function startSim(task, displayMode, hideLoadingScreen = false) {
  if (!task || typeof task !== "object") {
    throw new Error("A WebUI enviou um task invalido para iniciar o sim.");
  }

  closeRpcServer();
  await ensureRpcServer(task);

  const launch = buildLaunchArguments(task, displayMode || "monitor");
  emitSimStatus("Sim Starting", "Preparando handoff para o simulador...");
  if (hideLoadingScreen) {
    nativeBridge.setHideSimDuringLoadingMode(true);
  }

  const child = spawn(launch.executable, launch.args, {
    cwd: launch.workingDirectory,
    detached: false,
    stdio: "ignore",
    windowsHide: true,
  });

  child.once("error", (error) => {
    appendDiagnostic("sim-spawn-error", String(error && error.message ? error.message : error));
    emitSimStatus("Sim Inactive", `Falha ao iniciar o sim: ${error.message}`);
  });

  child.once("exit", (code) => {
    appendDiagnostic("sim-exit", `code=${code}`);
    if (code && code !== 0) {
      emitSimStatus("Sim Inactive", `O sim encerrou com codigo ${code}.`);
    }
  });

  appendDiagnostic("sim-launch", JSON.stringify({ executable: launch.executable, args: launch.args }));
  emitSimStatus("Sim Loading", "Simulador iniciado. Aguardando JSON-RPC...");
  return { ok: true };
}

async function startJoinUrl(url) {
  return startSim(
    {
      task: "legacyJoinServer",
      parameters: normalizeLocalJoinParameter(url),
    },
    "monitor",
    false
  );
}

function shouldHandleNavigation(url) {
  if (isLocalJoinUrl(url)) {
    startJoinUrl(url).catch((error) => {
      appendDiagnostic("join-error", String(error && error.message ? error.message : error));
      emitSimStatus("Sim Inactive", `Falha ao abrir sessao: ${error.message}`);
    });
    return true;
  }

  if (isIracingUrl(url)) {
    return false;
  }

  appendDiagnostic("external-navigation", url);
  shell.openExternal(url).catch((error) => {
    appendDiagnostic("external-navigation-error", String(error && error.message ? error.message : error));
  });
  return true;
}

function scheduleNativeWindowRegistration(attempt = 0) {
  if (!nativeBridge.isAvailable() || !mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  if (nativeRegisterTimer) {
    clearTimeout(nativeRegisterTimer);
    nativeRegisterTimer = null;
  }

  const registered = nativeBridge.registerWindow(mainWindow);
  if (registered || attempt >= 20) {
    return;
  }

  nativeRegisterTimer = setTimeout(() => {
    scheduleNativeWindowRegistration(attempt + 1);
  }, 750);
}

async function initializeNativeBridge() {
  const installRoot = await getInstallRoot();
  localIRacing.configure({ installRoot });
  const loaded = nativeBridge.load(path.join(installRoot, "ui", "iRacingViewer.dll"));
  if (loaded && mainWindow && !mainWindow.isDestroyed()) {
    scheduleNativeWindowRegistration();
  }
}

function createWindow() {
  const windowState = getWindowState();
  mainWindow = new BrowserWindow({
    title: APP_TITLE,
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: DEFAULT_WINDOW_WIDTH,
    minHeight: DEFAULT_WINDOW_HEIGHT,
    show: false,
    frame: false,
    fullscreenable: false,
    autoHideMenuBar: true,
    backgroundColor: "#000000",
    icon: path.join(__dirname, "assets", "AppIcon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      safeDialogs: true,
      spellcheck: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
    transparent: false,
    titleBarOverlay: getTitleBarOverlayOptions(),
    titleBarStyle: "hidden",
  });

  mainWindow.removeMenu();
  mainWindow.setMenuBarVisibility(false);
  if (nativeBridge.isAvailable()) {
    scheduleNativeWindowRegistration();
  }
  if (windowState.isMaximized) {
    mainWindow.maximize();
  }
  updateTitleBarOverlay();
  mainWindow.setTitle(APP_TITLE);
  for (const eventName of ["resize", "move", "resized", "moved", "maximize", "unmaximize"]) {
    mainWindow.on(eventName, scheduleWindowStateSave);
  }
  mainWindow.webContents.setUserAgent(USER_AGENT);
  mainWindow.once("ready-to-show", () => {
    appendDiagnostic("ready-to-show", mainWindow.webContents.getURL());
    mainWindow.show();
  });
  mainWindow.webContents.on("dom-ready", () => {
    appendDiagnostic("dom-ready", mainWindow.webContents.getURL());
    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }
  });
  mainWindow.webContents.on("did-finish-load", () => {
    appendDiagnostic("did-finish-load", mainWindow.webContents.getURL());
    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }
  });
  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    appendDiagnostic(
      "did-fail-load",
      JSON.stringify({ errorCode, errorDescription, validatedURL })
    );
  });
  mainWindow.webContents.on("did-navigate", (_event, url) => {
    appendDiagnostic("did-navigate", url);
  });
  mainWindow.webContents.on("did-navigate-in-page", (_event, url) => {
    appendDiagnostic("did-navigate-in-page", url);
  });
  mainWindow.webContents.on("page-title-updated", (event, title) => {
    event.preventDefault();
    mainWindow.setTitle(APP_TITLE);
    appendDiagnostic("page-title-updated", title);
  });
  mainWindow.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    appendDiagnostic(
      "console",
      JSON.stringify({ level, message, line, sourceId })
    );
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (shouldHandleNavigation(url)) {
      return { action: "deny" };
    }

    mainWindow.loadURL(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (shouldHandleNavigation(url)) {
      event.preventDefault();
    }
  });

  mainWindow.webContents.session.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(permission === "notifications" || permission === "clipboard-sanitized-write");
  });

  mainWindow.on("close", (event) => {
    persistWindowState();
    nativeBridge.setHideSimDuringLoadingMode(false);
    if (!preventClose) {
      return;
    }

    event.preventDefault();
    sendBridgeEvent("closeAttempt", { prevented: true });
  });

  mainWindow.loadURL(getDashboardUrl());
}

async function getCookieHeader(names = null) {
  const cookies = await session.defaultSession.cookies.get({});
  const allow = Array.isArray(names) && names.length ? new Set(names) : null;
  return cookies
    .filter((cookie) => !allow || allow.has(cookie.name))
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
}

async function openDirectory(directoryPath) {
  if (!directoryPath) {
    return { ok: false };
  }

  await fs.promises.mkdir(directoryPath, { recursive: true }).catch(() => {});
  const result = await shell.openPath(directoryPath);
  if (result) {
    throw new Error(result);
  }
  return { ok: true };
}

async function getPaintFile({ copy, rosterName, type, tga } = {}) {
  const fileType = type === "mip" ? "mip" : "tga";
  if (tga) {
    localIRacing.validateName(tga);
  }

  const result = await dialog.showOpenDialog(mainWindow, {
    defaultPath: localIRacing.paintDir(),
    filters: [{ name: "Images", extensions: [fileType] }],
    properties: ["openFile"],
  });

  if (result.canceled || !result.filePaths || !result.filePaths[0]) {
    return [];
  }

  const selected = result.filePaths[0];
  if (copy) {
    if (fileType === "tga") {
      await localIRacing.copyTga(selected, rosterName, path.basename(selected));
    } else {
      await localIRacing.copyTga(selected, rosterName, `${localIRacing.validateName(tga)}_spec.mip`);
    }
  }

  return [selected, !!copy];
}

async function runGraphicsConfig(displayMode) {
  const installRoot = await getInstallRoot();
  const simPath = path.join(installRoot, "iRacingSim64DX11.exe");
  if (!fs.existsSync(simPath)) {
    throw new Error("Nao foi possivel localizar o configurador grafico do simulador.");
  }

  const args = ["-autocfg"];
  const mode = displayMode || settings.displayMode || "monitor";
  if (mode) {
    args.push(`-display_mode=${mode}`);
  }

  const child = spawn(simPath, args, {
    cwd: installRoot,
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  child.unref();
  return { ok: true };
}

async function getReplayList(input) {
  const range = Array.isArray(input) ? input : [0, -1];
  return nativeBridge.getReplayList(range[0], range[1]) || localIRacing.getReplayListFallback();
}

async function getGeneratedCarImages(requests = []) {
  if (!Array.isArray(requests)) {
    return [];
  }

  const responses = [];
  for (const request of requests) {
    try {
      const response = await generateCarImage(request);
      if (response) {
        responses.push(response);
      }
    } catch (error) {
      appendDiagnostic("generated-car-image-error", String(error && error.message ? error.message : error));
    }
  }
  return responses;
}

async function deleteAllGeneratedCarImages() {
  await fs.promises.rm(generatedCarImagesDir(), { recursive: true, force: true });
  await fs.promises.mkdir(generatedCarImagesDir(), { recursive: true });
  return { ok: true };
}

function registerIpcHandlers() {
  ipcMain.handle("ps:getAppInfo", async () => ({
    appId: APP_ID,
    name: APP_TITLE,
    version: app.getVersion(),
    repositoryUrl: `https://github.com/${APP_REPOSITORY.owner}/${APP_REPOSITORY.repo}`,
    releasesUrl: GITHUB_RELEASES_URL,
  }));
  ipcMain.handle("ps:checkForUpdates", async (_event, options) => {
    return checkForAppUpdate(!!(options && options.force));
  });
  ipcMain.handle("ps:openLatestRelease", async (_event, targetUrl) => {
    return openLatestReleaseUrl(targetUrl);
  });
  ipcMain.handle("ps:getLaunchAtStartup", async () => ({
    enabled: getLaunchAtStartupState(),
  }));
  ipcMain.handle("ps:setLaunchAtStartup", async (_event, enabled) => ({
    enabled: setLaunchAtStartupState(enabled),
  }));
  ipcMain.handle("ps:getHardware", async () => getHardwareSnapshot());
  ipcMain.handle("ps:isLocalServiceRunning", async () => isLocalServiceRunning());
  ipcMain.handle("ps:getInstallInformation", async () => getInstallInformation());
  ipcMain.handle("ps:getCustomExtensionUrl", async () => getCustomExtensionUrl());
  ipcMain.handle("ps:getSystemVersions", async () => getSystemVersions());
  ipcMain.handle("ps:getStoredZoom", async () => settings.zoom);
  ipcMain.handle("ps:getZoom", async () => settings.zoom);
  ipcMain.handle("ps:setZoom", async (_event, zoom) => {
    settings.zoom = Math.max(25, Math.min(400, Number(zoom) || 100));
    saveSettings();
    return settings.zoom;
  });
  ipcMain.handle("ps:minimize", async () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.minimize();
    }
    return { ok: true };
  });
  ipcMain.handle("ps:maximize", async () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
    return { ok: true };
  });
  ipcMain.handle("ps:unmaximize", async () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.unmaximize();
    }
    return { ok: true };
  });
  ipcMain.handle("ps:setUiTheme", async (_event, theme) => ({
    ok: true,
    theme: setUiTheme(theme),
  }));
  ipcMain.handle("ps:setPreventClose", async (_event, value) => {
    preventClose = !!value;
    return { ok: true };
  });
  ipcMain.handle("ps:setSubdomainSuffix", async (_event, suffix) => {
    settings.subdomainSuffix = suffix && typeof suffix === "object" ? suffix.suffix || "ng" : suffix || "ng";
    saveSettings();
    return { ok: true, suffix: settings.subdomainSuffix };
  });
  ipcMain.handle("ps:startSim", async (_event, payload) => {
    return startSim(payload.task, payload.displayMode, !!payload.hideLoadingScreen);
  });
  ipcMain.handle("ps:startJoinUrl", async (_event, url) => startJoinUrl(url));
  ipcMain.handle("ps:isDllAvailable", async () => nativeBridge.isAvailable());
  ipcMain.handle("ps:isAVConnected", async () => nativeBridge.isAVConnected());
  ipcMain.handle("ps:getUseMetric", async () => localIRacing.getUseMetric());
  ipcMain.handle("ps:setUseMetric", async (_event, value) => {
    localIRacing.setUseMetric(!!value);
    return { ok: true };
  });
  ipcMain.handle("ps:setUseIPv6", async (_event, value) => {
    await localIRacing.setUseIPv6(!!value);
    return { ok: true };
  });
  ipcMain.handle("ps:setUseSteamOverlay", async (_event, value) => {
    await localIRacing.setUseSteamOverlay(!!value);
    return { ok: true };
  });
  ipcMain.handle("ps:setDisplayMode", async (_event, value) => {
    settings.displayMode = value || "monitor";
    saveSettings();
    return { ok: true };
  });
  ipcMain.handle("ps:runGraphicsConfig", async (_event, value) => runGraphicsConfig(value));
  ipcMain.handle("ps:startService", async () => ({ ok: nativeBridge.startService() }));
  ipcMain.handle("ps:stopService", async () => ({ ok: nativeBridge.stopService() }));
  ipcMain.handle("ps:getPingTimes", async () => nativeBridge.getPingTimes());
  ipcMain.handle("ps:setPingServers", async (_event, payload) => ({ ok: nativeBridge.setPingServers(payload || {}) }));
  ipcMain.handle("ps:stopPinging", async () => ({ ok: nativeBridge.stopPinging() }));
  ipcMain.handle("ps:getReplayList", async (_event, input) => getReplayList(input));
  ipcMain.handle("ps:deleteReplay", async (_event, filename) => {
    await localIRacing.deleteReplay(filename);
    return { ok: true };
  });
  ipcMain.handle("ps:getAiRosters", async () => localIRacing.getAiRosters());
  ipcMain.handle("ps:saveAiRoster", async (_event, payload) => {
    await localIRacing.saveAiRoster(payload.name, payload.roster);
    return { ok: true };
  });
  ipcMain.handle("ps:copyAiRoster", async (_event, payload) => {
    await localIRacing.copyAiRoster(payload.name, payload.copyName);
    return { ok: true };
  });
  ipcMain.handle("ps:deleteAiRoster", async (_event, name) => {
    await localIRacing.deleteAiRoster(name);
    return { ok: true };
  });
  ipcMain.handle("ps:renameAiRoster", async (_event, payload) => {
    await localIRacing.renameAiRoster(payload.oldName, payload.newName);
    return { ok: true };
  });
  ipcMain.handle("ps:getAiSeasons", async () => localIRacing.getAiSeasons());
  ipcMain.handle("ps:saveAiSeason", async (_event, payload) => {
    await localIRacing.saveAiSeason(payload.name, payload.season);
    return { ok: true };
  });
  ipcMain.handle("ps:deleteAiSeason", async (_event, name) => {
    await localIRacing.deleteAiSeason(name);
    return { ok: true };
  });
  ipcMain.handle("ps:renameAiSeason", async (_event, payload) => {
    await localIRacing.renameAiSeason(payload.oldName, payload.newName);
    return { ok: true };
  });
  ipcMain.handle("ps:getPaint", async (_event, payload) => getPaintFile(payload));
  ipcMain.on("ps:getPaintLocation", (event, payload) => {
    event.returnValue = localIRacing.getPaintLocation(payload);
  });
  ipcMain.handle("ps:getSpecMaps", async (_event, rosterName) => localIRacing.getSpecMaps(rosterName));
  ipcMain.handle("ps:deleteSpecMap", async (_event, payload) => {
    await localIRacing.deleteSpecMap(payload.rosterName, payload.specMap);
    return { ok: true };
  });
  ipcMain.handle("ps:copyTga", async (_event, payload) => {
    await localIRacing.copyTga(payload.filePath, payload.rosterName, payload.fileName);
    return { ok: true };
  });
  ipcMain.handle("ps:renamePaintFile", async (_event, payload) => {
    await localIRacing.renamePaintFile(payload.name, payload.newName, payload.rosterName);
    return { ok: true };
  });
  ipcMain.handle("ps:watchSpecMaps", async (_event, rosterName) => {
    nativeBridge.closePaintWatcher();
    const watchDir = path.join(localIRacing.aiRostersDir(), localIRacing.validateName(rosterName || ""));
    nativeBridge.paintWatcher = fs.watch(watchDir, (changeType, fileName) => {
      sendBridgeEvent("specMapChange", { changeType, fileName });
    });
    return { ok: true };
  });
  ipcMain.handle("ps:closeWatcher", async () => {
    nativeBridge.closePaintWatcher();
    return { ok: true };
  });
  ipcMain.handle("ps:getLocalSetups", async (_event, payload) => localIRacing.getLocalSetups(payload));
  ipcMain.handle("ps:getSavedGames", async () => localIRacing.getSavedGames());
  ipcMain.handle("ps:deleteSaveGame", async (_event, filename) => {
    await localIRacing.deleteSaveGame(filename);
    return { ok: true };
  });
  ipcMain.handle("ps:getMsrTelemetryFiles", async () => localIRacing.getMsrTelemetryFiles());
  ipcMain.handle("ps:deleteTelemetryFiles", async (_event, filenames) => {
    await localIRacing.deleteTelemetryFiles(filenames);
    return { ok: true };
  });
  ipcMain.handle("ps:uploadMsrTelemetryFile", async () => ({ ok: false, skipped: true }));
  ipcMain.handle("ps:stopMsrTelemetryUpload", async () => ({ ok: true }));
  ipcMain.handle("ps:getGeneratedCarImages", async (_event, payload) => getGeneratedCarImages(payload));
  ipcMain.handle("ps:deleteAllGeneratedCarImages", async () => deleteAllGeneratedCarImages());
  ipcMain.handle("ps:saveEventResult", async (_event, result) => localIRacing.saveEventResult(result));
  ipcMain.handle("ps:saveLapChart", async (_event, payload) => localIRacing.saveLapChart(payload));
  ipcMain.handle("ps:openInstallDirectory", async () => openDirectory(await getInstallRoot()));
  ipcMain.handle("ps:openAppDataDirectory", async () => openDirectory(localIRacing.localAppDataDir()));
  ipcMain.handle("ps:openDocumentsDirectory", async () => openDirectory(localIRacing.documentsDir()));
  ipcMain.handle("ps:syncLanguagePreference", async () => ({ ok: true }));
  ipcMain.handle("ps:setAVLaunchMode", async () => ({ ok: true }));
  ipcMain.handle("ps:viewerLoginRefresh", async (_event, payload) => {
    const cookies = await getCookieHeader();
    return nativeBridge.viewerLoginRefresh(payload && payload.token, cookies);
  });
  ipcMain.on("ps:viewerCreateView", (_event, payload) => {
    nativeBridge.viewerCreateView(payload.dimensions, payload.zoomFactor);
  });
  ipcMain.on("ps:viewerResize", (_event, payload) => {
    nativeBridge.viewerResize(payload.dimensions, payload.zoomFactor);
  });
  ipcMain.on("ps:viewerDeleteView", () => {
    nativeBridge.viewerDeleteView();
  });
  ipcMain.on("ps:viewerLoadObject", (_event, payload) => {
    nativeBridge.viewerLoadObject(payload);
  });
  ipcMain.on("ps:viewerSetDriverHeadType", (_event, id) => {
    nativeBridge.viewerSetDriverHeadType(id);
  });
  ipcMain.on("ps:viewerSetFrameWindowBGColor", (_event, color) => {
    nativeBridge.viewerSetFrameWindowBGColor(color);
  });
  ipcMain.on("ps:viewerSetPathDetails", (_event, keys) => {
    nativeBridge.viewerSetPathDetails(keys);
  });
  ipcMain.handle("ps:viewerReset", async () => {
    nativeBridge.closePaintWatcher();
    return { ok: true };
  });
  ipcMain.handle("ps:viewerPaintItem", async (_event, payload) => nativeBridge.viewerPaintItem(payload));
  ipcMain.handle("ps:openInBrowser", async (_event, link) => {
    if (link) {
      appendDiagnostic("openInBrowser", link);
      await shell.openExternal(link);
    }
    return { ok: true };
  });
  ipcMain.handle("ps:relayMessage", async (_event, message) => {
    const text = String(message || "");
    appendDiagnostic("relay", text);
    if (text) {
      emitSimStatus(text);
      if (text === "Welcome to iRacing!") {
        focusMainWindow();
      }
    }
    return { ok: true };
  });
  ipcMain.handle("ps:log", async (_event, line) => {
    appendDiagnostic("renderer-log", String(line || ""));
    return { ok: true };
  });
  ipcMain.handle("ps:quit", async () => {
    app.quit();
    return { ok: true };
  });
  ipcMain.handle("ps:reconnect", async () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      await mainWindow.loadURL(getDashboardUrl());
    }
    return { ok: true };
  });
  ipcMain.on("ps:diagnostic", (_event, kind, details) => {
    appendDiagnostic(kind, details);
  });
}

function registerProtocolClient() {
  if (!app.isPackaged) {
    return;
  }

  for (const protocol of ["iracing", "iracing-secure", "iracing-alpha", "iracing-beta", "iracing-gamma", "iracing-staging"]) {
    try {
      app.setAsDefaultProtocolClient(protocol);
    } catch (error) {
      appendDiagnostic("protocol-registration-error", `${protocol}: ${String(error && error.message ? error.message : error)}`);
    }
  }
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, argv) => {
    handleSecondInstance(argv);
  });

  app.whenReady().then(async () => {
    app.setAppUserModelId(APP_ID);
    app.setName(APP_TITLE);
    loadSettings();
    nativeTheme.themeSource = normalizeThemeSource(settings.theme);
    nativeTheme.on("updated", updateTitleBarOverlay);
    registerProtocolClient();
    registerIpcHandlers();
    await initializeCustomExtension().catch((error) => {
      appendDiagnostic("custom-extension-init-error", String(error && error.message ? error.message : error));
    });
    cleanupExpiredGeneratedCarImages();
    createWindow();
    initializeNativeBridge().catch((error) => {
      appendDiagnostic("native-init-error", String(error && error.message ? error.message : error));
    });

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      } else {
        focusMainWindow();
      }
    });
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (nativeRegisterTimer) {
    clearTimeout(nativeRegisterTimer);
    nativeRegisterTimer = null;
  }
  closeRpcServer();
  nativeBridge.deregister();
});
