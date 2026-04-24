const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const asar = require("@electron/asar");
const rawFs = process.versions.electron ? require("original-fs") : fs;

const EMBEDDED_EXTENSION_DIST_DIR = path.join(__dirname, "extension", "dist");
const PACKAGED_APP_DIR =
  process.versions.electron &&
  !process.defaultApp &&
  process.resourcesPath &&
  pathExists(path.join(process.resourcesPath, "app", "extension", "dist"))
    ? path.join(process.resourcesPath, "app")
    : "";
const ROOT_DIR =
  process.env.IREFINED_ROOT ||
  PACKAGED_APP_DIR ||
  (pathExists(EMBEDDED_EXTENSION_DIST_DIR)
    ? __dirname
    : path.resolve(__dirname, ".."));
const APPDATA_DIR = path.join(
  process.env.APPDATA || process.env.LOCALAPPDATA || os.tmpdir(),
  "iRefinedX"
);
const CONFIG_DIR = path.join(APPDATA_DIR, "config");
const UI_DIR_CACHE_FILE = path.join(CONFIG_DIR, "iracing-ui-dir.json");
const PATCHED_UI_DIRS_FILE = path.join(CONFIG_DIR, "patched-ui-dirs.json");
const REG_EXE = path.join(
  process.env.SystemRoot || "C:\\Windows",
  "System32",
  "reg.exe"
);
const BOOTSTRAP_SOURCE = path.join(
  __dirname,
  "official-runtime-bootstrap-source.cjs"
);
const MAIN_PATCH_SNIPPET = 'require("./irefined-bootstrap.cjs");';
const TITLEBAR_OVERLAY_SNIPPET =
  'titleBarOverlay:{height:31,...It()},titleBarStyle:"hidden"';
const TITLEBAR_OVERLAY_PATCHED =
  'titleBarOverlay:!1,titleBarStyle:"hidden"';
const TITLEBAR_OVERLAY_PREVIOUS_PATCHED =
  'titleBarOverlay:!1,useContentSize:!0,thickFrame:!1,roundedCorners:!1';
const TITLEBAR_THEME_UPDATE_SNIPPET = "Ha.setTitleBarOverlay(It())";
const TITLEBAR_THEME_UPDATE_PATCHED = "Ha.setTitleBarOverlay(!1)";
const LEGACY_PRELOAD_PATCH_SNIPPET = 'require("./irefined-preload.cjs");\n';
const PRELOAD_PATCH_MARKER = "__irefinedPreloadProbe";
const MANAGED_RUNTIME_DIR_PREFIX = "ui-irex-runtime";
const MANAGED_RUNTIME_LAYOUT_VERSION = 1;
const PRELOAD_WINDOW_INTEROP_ORIGINAL =
  'log:function(n){return e.ipcRenderer.invoke("log",{line:n})},openInBrowser:function(n){return e.ipcRenderer.invoke("openInBrowser",{link:n})},quit:function(){';
const PRELOAD_WINDOW_INTEROP_PATCHED =
  'log:function(n){return e.ipcRenderer.invoke("log",{line:n})},minimize:function(){return e.ipcRenderer.invoke("iref.window.minimize")},maximize:function(){return e.ipcRenderer.invoke("iref.window.toggleMaximize")},unmaximize:function(){return e.ipcRenderer.invoke("iref.window.unmaximize")},isMaximized:function(){return e.ipcRenderer.invoke("iref.window.isMaximized")},close:function(){return e.ipcRenderer.invoke("iref.window.close")},overrideUnloadPrevented:function(n){return e.ipcRenderer.invoke("preventClose",{prevent:!1}).then(()=>e.ipcRenderer.invoke("iref.window.close"))},openInBrowser:function(n){return e.ipcRenderer.invoke("openInBrowser",{link:n})},quit:function(){';

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function isAsarFilePath(filePath = "") {
  return /\.asar(?:$|[\\/])/i.test(filePath);
}

function pathExists(filePath) {
  return (isAsarFilePath(filePath) ? rawFs : fs).existsSync(filePath);
}

function statPath(filePath) {
  return (isAsarFilePath(filePath) ? rawFs : fs).statSync(filePath);
}

function lstatPath(filePath) {
  return (isAsarFilePath(filePath) ? rawFs : fs).lstatSync(filePath);
}

function copyFileSyncSafe(sourcePath, targetPath) {
  return (isAsarFilePath(sourcePath) || isAsarFilePath(targetPath) ? rawFs : fs).copyFileSync(
    sourcePath,
    targetPath
  );
}

function copyDirectoryVerbatim(sourceDir, targetDir) {
  ensureDir(targetDir);

  for (const entry of rawFs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectoryVerbatim(sourcePath, targetPath);
      continue;
    }

    copyFileSyncSafe(sourcePath, targetPath);
  }
}

function makePathWritable(targetPath) {
  if (!pathExists(targetPath)) {
    return;
  }

  try {
    const targetFs = isAsarFilePath(targetPath) ? rawFs : fs;
    const stats = lstatPath(targetPath);

    if (stats.isDirectory()) {
      for (const entry of targetFs.readdirSync(targetPath, { withFileTypes: true })) {
        makePathWritable(path.join(targetPath, entry.name));
      }
      targetFs.chmodSync(targetPath, 0o777);
      return;
    }

    targetFs.chmodSync(targetPath, 0o666);
  } catch {}
}

function removePathForcefully(targetPath) {
  if (!pathExists(targetPath)) {
    return;
  }

  const targetFs = isAsarFilePath(targetPath) ? rawFs : fs;

  makePathWritable(targetPath);

  try {
    const stats = lstatPath(targetPath);

    if (stats.isDirectory()) {
      targetFs.rmSync(targetPath, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 200,
      });
      return;
    }

    targetFs.rmSync(targetPath, {
      force: true,
      maxRetries: 5,
      retryDelay: 200,
    });
    return;
  } catch {}

  try {
    targetFs.unlinkSync(targetPath);
  } catch {
    targetFs.rmSync(targetPath, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 200,
    });
  }
}

function readJsonFile(filePath, fallbackValue) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallbackValue;
  }
}

function getUniqueUiDirCandidates(candidates) {
  return [...new Set(candidates.map((candidate) => normalizeUiDirCandidate(candidate)).filter(Boolean))];
}

function getOfficialUiPaths(uiDir) {
  const normalizedUiDir = normalizeUiDirCandidate(uiDir);
  return {
    uiDir: normalizedUiDir,
    installRoot: path.dirname(normalizedUiDir),
    resourcesDir: path.join(normalizedUiDir, "resources"),
    exePath: path.join(normalizedUiDir, "iRacingUI.exe"),
    asarPath: path.join(normalizedUiDir, "resources", "app.asar"),
    backupAsarPath: path.join(normalizedUiDir, "resources", "app.irx-original.asar"),
    appDir: path.join(normalizedUiDir, "resources", "app"),
    mainJsPath: path.join(normalizedUiDir, "resources", "app", "compiled", "main.js"),
    preloadJsPath: path.join(normalizedUiDir, "resources", "app", "compiled", "preload.js"),
    metadataPath: path.join(normalizedUiDir, ".irex-runtime.json"),
  };
}

function isManagedRuntimeUiDir(uiDir) {
  const normalizedUiDir = normalizeUiDirCandidate(uiDir);

  if (!normalizedUiDir) {
    return false;
  }

  return path.basename(normalizedUiDir).toLowerCase().startsWith(
    MANAGED_RUNTIME_DIR_PREFIX.toLowerCase()
  );
}

function isValidOfficialUiDir(uiDir) {
  if (!uiDir) {
    return false;
  }

  if (isManagedRuntimeUiDir(uiDir)) {
    return false;
  }

  const paths = getOfficialUiPaths(uiDir);
  const hasPackagedRuntime = pathExists(paths.asarPath);
  const hasExtractedRuntime =
    pathExists(paths.appDir) &&
    pathExists(paths.mainJsPath) &&
    pathExists(paths.preloadJsPath);
  const hasBackupRuntime = pathExists(paths.backupAsarPath);

  return pathExists(paths.exePath) && (hasPackagedRuntime || hasExtractedRuntime || hasBackupRuntime);
}

function normalizeUiDirCandidate(candidate) {
  if (!candidate) {
    return "";
  }

  let normalized = path.normalize(String(candidate).trim().replace(/^"+|"+$/g, ""));

  if (!normalized) {
    return "";
  }

  if (normalized.toLowerCase().endsWith("iracingui.exe")) {
    return path.dirname(normalized);
  }

  if (normalized.toLowerCase().endsWith(`${path.sep}ui`)) {
    return normalized;
  }

  const nestedUiDir = path.join(normalized, "ui");
  if (pathExists(path.join(nestedUiDir, "iRacingUI.exe"))) {
    return nestedUiDir;
  }

  return normalized;
}

function readCachedUiDir() {
  const parsed = readJsonFile(UI_DIR_CACHE_FILE, null);
  return normalizeUiDirCandidate(parsed?.uiDir || "");
}

function savePreferredUiDir(uiDir) {
  const normalizedUiDir = normalizeUiDirCandidate(uiDir);

  if (!isValidOfficialUiDir(normalizedUiDir)) {
    return false;
  }

  ensureDir(CONFIG_DIR);
  fs.writeFileSync(
    UI_DIR_CACHE_FILE,
    JSON.stringify(
      {
        uiDir: normalizedUiDir,
        savedAt: new Date().toISOString(),
      },
      null,
      2
    ),
    "utf8"
  );
  return true;
}

function clearPreferredUiDir() {
  fs.rmSync(UI_DIR_CACHE_FILE, { force: true });
}

function readPatchedUiDirs() {
  const parsed = readJsonFile(PATCHED_UI_DIRS_FILE, null);
  const uiDirs = Array.isArray(parsed?.uiDirs) ? parsed.uiDirs : [];
  return getUniqueUiDirCandidates(uiDirs);
}

function savePatchedUiDir(uiDir) {
  const normalizedUiDir = normalizeUiDirCandidate(uiDir);

  if (!isValidOfficialUiDir(normalizedUiDir)) {
    return false;
  }

  ensureDir(CONFIG_DIR);
  const uiDirs = getUniqueUiDirCandidates([
    ...readPatchedUiDirs(),
    normalizedUiDir,
  ]);

  fs.writeFileSync(
    PATCHED_UI_DIRS_FILE,
    JSON.stringify(
      {
        uiDirs,
        savedAt: new Date().toISOString(),
      },
      null,
      2
    ),
    "utf8"
  );
  return true;
}

function clearPatchedUiDirs() {
  fs.rmSync(PATCHED_UI_DIRS_FILE, { force: true });
}

function extractExePathFromCommand(command) {
  if (!command) {
    return "";
  }

  const quoted = String(command).match(/"([^"]+?\.exe)"/i);
  if (quoted?.[1]) {
    return quoted[1];
  }

  const plain = String(command).match(/[A-Z]:\\.+?\.exe/i);
  return plain?.[0] || "";
}

function queryRegistryDefaultValue(keyPath) {
  const result = spawnSync(REG_EXE, ["query", keyPath, "/ve"], {
    encoding: "utf8",
    windowsHide: true,
  });

  if (result.status !== 0 || !result.stdout) {
    return "";
  }

  const match = result.stdout.match(/REG_\w+\s+(.+)$/m);
  return match?.[1]?.trim() || "";
}

function detectUiDirFromRegistry() {
  const registryKeys = [
    "HKCU\\Software\\Classes\\iracing\\shell\\open\\command",
    "HKCU\\Software\\Classes\\iracing-beta\\shell\\open\\command",
    "HKCR\\iracing\\shell\\open\\command",
    "HKCR\\iracing-beta\\shell\\open\\command",
  ];

  for (const keyPath of registryKeys) {
    const command = queryRegistryDefaultValue(keyPath);
    const exePath = extractExePathFromCommand(command);
    const uiDir = normalizeUiDirCandidate(exePath);

    if (isValidOfficialUiDir(uiDir)) {
      return uiDir;
    }
  }

  return "";
}

function getAutoDetectedUiDirCandidates() {
  return getUniqueUiDirCandidates([
    detectUiDirFromRegistry(),
    path.join(process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)", "iRacing", "ui"),
    path.join(process.env.ProgramFiles || "C:\\Program Files", "iRacing", "ui"),
    "D:\\Program Files (x86)\\iRacing\\ui",
    "C:\\Program Files (x86)\\iRacing\\ui",
  ]).filter((candidate) => !isManagedRuntimeUiDir(candidate));
}

function getKnownOfficialUiDirs() {
  return getUniqueUiDirCandidates([
    readCachedUiDir(),
    ...readPatchedUiDirs(),
    ...getAutoDetectedUiDirCandidates(),
  ]).filter((candidate) => !isManagedRuntimeUiDir(candidate) && isValidOfficialUiDir(candidate));
}

function resolveOfficialUiDir(explicitUiDir = "") {
  const explicitCandidate = normalizeUiDirCandidate(explicitUiDir);

  if (isValidOfficialUiDir(explicitCandidate)) {
    return explicitCandidate;
  }

  const cachedUiDir = readCachedUiDir();
  if (isValidOfficialUiDir(cachedUiDir)) {
    return cachedUiDir;
  }

  const autoDetectedCandidates = getAutoDetectedUiDirCandidates().filter((candidate) =>
    isValidOfficialUiDir(candidate)
  );

  if (autoDetectedCandidates.length === 1) {
    savePreferredUiDir(autoDetectedCandidates[0]);
    return autoDetectedCandidates[0];
  }

  if (autoDetectedCandidates.length > 1) {
    const error = new Error(
      "More than one official iRacing UI installation was detected automatically."
    );
    error.code = "IRACING_UI_AMBIGUOUS";
    error.cacheFile = UI_DIR_CACHE_FILE;
    error.candidates = autoDetectedCandidates;
    throw error;
  }

  const error = new Error(
    "Unable to locate the official iRacing UI installation automatically."
  );
  error.code = "IRACING_UI_NOT_FOUND";
  error.cacheFile = UI_DIR_CACHE_FILE;
  throw error;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function ensurePath(filePath, description) {
  if (!pathExists(filePath)) {
    throw new Error(`${description} not found: ${filePath}`);
  }
}

async function copyFileWithRetries(sourcePath, targetPath, attempts = 8) {
  let lastError = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      if (!pathExists(sourcePath)) {
        throw new Error(`ENOENT, source not found: ${sourcePath}`);
      }

      copyFileSyncSafe(sourcePath, targetPath);
      return;
    } catch (error) {
      lastError = error;
      await sleep(200);
    }
  }

  throw lastError;
}

function patchMainProcessEntry(mainJsTarget) {
  const source = fs.readFileSync(mainJsTarget, "utf8");
  let nextSource = source;

  if (!nextSource.startsWith(`${MAIN_PATCH_SNIPPET}\n`)) {
    nextSource = `${MAIN_PATCH_SNIPPET}\n${nextSource}`;
  }

  if (nextSource.includes(TITLEBAR_OVERLAY_SNIPPET)) {
    nextSource = nextSource.replace(
      TITLEBAR_OVERLAY_SNIPPET,
      TITLEBAR_OVERLAY_PATCHED
    );
  } else if (nextSource.includes(TITLEBAR_OVERLAY_PREVIOUS_PATCHED)) {
    nextSource = nextSource.replace(
      TITLEBAR_OVERLAY_PREVIOUS_PATCHED,
      TITLEBAR_OVERLAY_PATCHED
    );
  } else if (!nextSource.includes(TITLEBAR_OVERLAY_PATCHED)) {
    throw new Error(`Unable to disable title bar overlay: ${mainJsTarget}`);
  }

  if (nextSource.includes(TITLEBAR_THEME_UPDATE_SNIPPET)) {
    nextSource = nextSource.replace(
      TITLEBAR_THEME_UPDATE_SNIPPET,
      TITLEBAR_THEME_UPDATE_PATCHED
    );
  } else if (!nextSource.includes(TITLEBAR_THEME_UPDATE_PATCHED)) {
    throw new Error(`Unable to disable title bar overlay updates: ${mainJsTarget}`);
  }

  if (nextSource !== source) {
    fs.writeFileSync(mainJsTarget, nextSource, "utf8");
  }
}

function patchPreloadProcessEntry(preloadJsTarget) {
  const source = fs.readFileSync(preloadJsTarget, "utf8");
  let nextSource = source;
  const probePrefix =
    'const __irefinedPreloadSanitize=t=>{if(!t||"object"!=typeof t)return t;if("request"===t.method&&t.operation&&"object"==typeof t.operation)return{method:t.method,operation:{id:t.operation.id??null,type:t.operation.type??null,path:t.operation.path??null}};if("id"in t){const e=t.result&&"object"==typeof t.result?{type:t.result.type??null,hasData:Object.prototype.hasOwnProperty.call(t.result,"data")}:null,n=t.error&&"object"==typeof t.error?{code:t.error.code??null,path:t.error.data&&t.error.data.path||null,message:t.error.message??null}:null;return{id:t.id,result:e,error:n}}return t;};const __irefinedPreloadProbe=(t,n)=>{try{console.debug("[irefined-probe]"+JSON.stringify({type:t,detail:__irefinedPreloadSanitize(n),href:globalThis.location&&globalThis.location.href||"",ts:new Date().toISOString(),source:"preload"}))}catch(e){}};';
  const oldProbePrefix =
    'const __irefinedPreloadProbe=(t,n)=>{try{console.debug("[irefined-probe]"+JSON.stringify({type:t,detail:n,href:globalThis.location&&globalThis.location.href||"",ts:new Date().toISOString(),source:"preload"}))}catch(e){}};';

  const original =
    'return process.once("loaded",async()=>{e.contextBridge.exposeInMainWorld("electronTRPC",{sendMessage:n=>e.ipcRenderer.send(u,n),onMessage:n=>e.ipcRenderer.on(u,(e,r)=>n(r))})}),window.onbeforeunload=p,e.contextBridge.exposeInMainWorld("interop",';
  const instrumented =
    `${probePrefix}return process.once("loaded",async()=>{e.contextBridge.exposeInMainWorld("electronTRPC",{sendMessage:n=>(__irefinedPreloadProbe("electron-trpc-send",n),e.ipcRenderer.send(u,n)),onMessage:n=>e.ipcRenderer.on(u,(e,r)=>(__irefinedPreloadProbe("electron-trpc-message",r),n(r)))})}),window.onbeforeunload=p,e.contextBridge.exposeInMainWorld("interop",`;
  const broken =
    'return const __irefinedPreloadProbe=(t,n)=>{try{console.debug("[irefined-probe]"+JSON.stringify({type:t,detail:n,href:globalThis.location&&globalThis.location.href||"",ts:new Date().toISOString(),source:"preload"}))}catch(e){}};process.once("loaded",async()=>{e.contextBridge.exposeInMainWorld("electronTRPC",{sendMessage:n=>(__irefinedPreloadProbe("electron-trpc-send",{payload:n}),e.ipcRenderer.send(u,n)),onMessage:n=>e.ipcRenderer.on(u,(e,r)=>(__irefinedPreloadProbe("electron-trpc-message",{payload:r}),n(r)))})}),window.onbeforeunload=p,e.contextBridge.exposeInMainWorld("interop",';
  const unsanitizedTransport =
    '__irefinedPreloadProbe("electron-trpc-send",{payload:n}),e.ipcRenderer.send(u,n)),onMessage:n=>e.ipcRenderer.on(u,(e,r)=>(__irefinedPreloadProbe("electron-trpc-message",{payload:r}),n(r)))';
  const sanitizedTransport =
    '__irefinedPreloadProbe("electron-trpc-send",n),e.ipcRenderer.send(u,n)),onMessage:n=>e.ipcRenderer.on(u,(e,r)=>(__irefinedPreloadProbe("electron-trpc-message",r),n(r)))';

  if (nextSource.startsWith(LEGACY_PRELOAD_PATCH_SNIPPET)) {
    nextSource = nextSource.slice(LEGACY_PRELOAD_PATCH_SNIPPET.length);
  }

  if (nextSource.includes(broken)) {
    nextSource = nextSource.replace(broken, instrumented);
  } else if (nextSource.includes(oldProbePrefix)) {
    nextSource = nextSource.replace(oldProbePrefix, probePrefix);
  } else if (nextSource.includes(unsanitizedTransport)) {
    nextSource = nextSource.replace(unsanitizedTransport, sanitizedTransport);
  } else if (!nextSource.includes(probePrefix) && !nextSource.includes(PRELOAD_PATCH_MARKER)) {
    if (!nextSource.includes(original)) {
      throw new Error(`Unable to patch preload entry: ${preloadJsTarget}`);
    }

    nextSource = nextSource.replace(original, instrumented);
  }

  if (nextSource.includes(PRELOAD_WINDOW_INTEROP_ORIGINAL)) {
    nextSource = nextSource.replace(
      PRELOAD_WINDOW_INTEROP_ORIGINAL,
      PRELOAD_WINDOW_INTEROP_PATCHED
    );
  } else if (!nextSource.includes('minimize:function(){return e.ipcRenderer.invoke("iref.window.minimize")}')) {
    throw new Error(`Unable to patch preload window interop: ${preloadJsTarget}`);
  }

  if (nextSource !== source) {
    fs.writeFileSync(preloadJsTarget, nextSource, "utf8");
  }
}

function restoreOfficialUiDir(uiDir) {
  const paths = getOfficialUiPaths(uiDir);

  if (!pathExists(paths.backupAsarPath)) {
    return false;
  }

  ensureDir(paths.resourcesDir);
  removePathForcefully(paths.asarPath);
  removePathForcefully(paths.appDir);
  copyFileSyncSafe(paths.backupAsarPath, paths.asarPath);
  removePathForcefully(paths.backupAsarPath);
  return true;
}

function restoreKnownOfficialUiDirs() {
  const candidates = getKnownOfficialUiDirs();
  const restored = [];
  const skipped = [];

  for (const candidate of candidates) {
    if (restoreOfficialUiDir(candidate)) {
      restored.push(candidate);
    } else {
      skipped.push(candidate);
    }
  }

  return {
    candidates,
    restored,
    skipped,
  };
}

function getManagedRuntimeUiDir(uiDir) {
  const officialPaths = getOfficialUiPaths(uiDir);
  return path.join(officialPaths.installRoot, MANAGED_RUNTIME_DIR_PREFIX);
}

function getManagedRuntimeFingerprint(officialPaths) {
  const asarStats = statPath(officialPaths.asarPath);
  const exeStats = statPath(officialPaths.exePath);

  return [
    `asar:${asarStats.size}:${Math.round(asarStats.mtimeMs)}`,
    `exe:${exeStats.size}:${Math.round(exeStats.mtimeMs)}`,
  ].join("|");
}

function readManagedRuntimeMetadata(runtimePaths) {
  const metadata = readJsonFile(runtimePaths.metadataPath, null);

  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  return metadata;
}

function writeManagedRuntimeMetadata(runtimePaths, metadata) {
  fs.writeFileSync(runtimePaths.metadataPath, JSON.stringify(metadata, null, 2), "utf8");
}

function isManagedRuntimeReusable(runtimePaths, expectedFingerprint) {
  const metadata = readManagedRuntimeMetadata(runtimePaths);

  if (!metadata) {
    return false;
  }

  if (metadata.layoutVersion !== MANAGED_RUNTIME_LAYOUT_VERSION) {
    return false;
  }

  if (metadata.sourceFingerprint !== expectedFingerprint) {
    return false;
  }

  return (
    pathExists(runtimePaths.exePath) &&
    pathExists(runtimePaths.backupAsarPath) &&
    pathExists(runtimePaths.appDir) &&
    pathExists(runtimePaths.mainJsPath) &&
    pathExists(runtimePaths.preloadJsPath)
  );
}

function cleanupSiblingManagedRuntimeDirs(installRoot, keepDir = "") {
  const keepPath = keepDir ? path.normalize(keepDir) : "";

  try {
    for (const entry of fs.readdirSync(installRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }

      if (
        entry.name !== MANAGED_RUNTIME_DIR_PREFIX &&
        !entry.name.startsWith(`${MANAGED_RUNTIME_DIR_PREFIX}-`)
      ) {
        continue;
      }

      const entryPath = path.join(installRoot, entry.name);

      if (keepPath && path.normalize(entryPath) === keepPath) {
        continue;
      }

      removePathForcefully(entryPath);
    }
  } catch {}
}

function removeManagedRuntimeDirs() {
  const runtimeCandidates = [];

  for (const candidate of getKnownOfficialUiDirs()) {
    const installRoot = getOfficialUiPaths(candidate).installRoot;

    try {
      for (const entry of fs.readdirSync(installRoot, { withFileTypes: true })) {
        if (
          entry.isDirectory() &&
          (entry.name === MANAGED_RUNTIME_DIR_PREFIX ||
            entry.name.startsWith(`${MANAGED_RUNTIME_DIR_PREFIX}-`))
        ) {
          runtimeCandidates.push(path.join(installRoot, entry.name));
        }
      }
    } catch {}
  }

  const removed = [];
  const missing = [];
  const failed = [];

  for (const runtimeUiDir of getUniqueUiDirCandidates(runtimeCandidates)) {
    try {
      if (!pathExists(runtimeUiDir)) {
        missing.push(runtimeUiDir);
        continue;
      }

      removePathForcefully(runtimeUiDir);
      removed.push(runtimeUiDir);
    } catch (error) {
      failed.push({
        path: runtimeUiDir,
        message: error.message,
      });
    }
  }

  return {
    removed,
    missing,
    failed,
  };
}

function getCleanupTargets() {
  const localAppDataDir = process.env.LOCALAPPDATA || process.env.APPDATA || os.tmpdir();
  const roamingAppDataDir = process.env.APPDATA || localAppDataDir;

  return [...new Set([
    path.join(roamingAppDataDir, "iRefinedX"),
    path.join(localAppDataDir, "iRefinedX"),
    path.join(localAppDataDir, "irefinedx-updater"),
    path.join(localAppDataDir, "irefinedx-launcher-updater"),
  ])];
}

function cleanupLocalState() {
  const runtimeCleanup = removeManagedRuntimeDirs();
  const removed = [];
  const missing = [];
  const failed = [];

  for (const targetPath of getCleanupTargets()) {
    try {
      if (!pathExists(targetPath)) {
        missing.push(targetPath);
        continue;
      }

      removePathForcefully(targetPath);
      removed.push(targetPath);
    } catch (error) {
      failed.push({
        path: targetPath,
        message: error.message,
      });
    }
  }

  clearPreferredUiDir();
  clearPatchedUiDirs();

  return {
    runtimeCleanup,
    removed,
    missing,
    failed,
  };
}

async function prepareRuntime() {
  const OFFICIAL_UI_DIR = resolveOfficialUiDir(process.env.IRACING_UI_DIR || "");
  const OFFICIAL_PATHS = getOfficialUiPaths(OFFICIAL_UI_DIR);
  const OFFICIAL_EXE_PATH = OFFICIAL_PATHS.exePath;
  const RUNTIME_UI_DIR = getManagedRuntimeUiDir(OFFICIAL_UI_DIR);
  const RUNTIME_PATHS = getOfficialUiPaths(RUNTIME_UI_DIR);
  const RUNTIME_RESOURCES_DIR = RUNTIME_PATHS.resourcesDir;
  const RUNTIME_APP_ASAR = RUNTIME_PATHS.asarPath;
  const RUNTIME_APP_BACKUP_ASAR = path.join(
    RUNTIME_RESOURCES_DIR,
    "app.irx-original.asar"
  );
  const RUNTIME_APP_DIR = path.join(RUNTIME_RESOURCES_DIR, "app");
  const BOOTSTRAP_TARGET = path.join(RUNTIME_APP_DIR, "compiled", "irefined-bootstrap.cjs");
  const MAIN_JS_TARGET = path.join(RUNTIME_APP_DIR, "compiled", "main.js");
  const PRELOAD_JS_TARGET = path.join(RUNTIME_APP_DIR, "compiled", "preload.js");
  const SOURCE_FINGERPRINT = getManagedRuntimeFingerprint(OFFICIAL_PATHS);
  const SHOULD_REBUILD_RUNTIME = !isManagedRuntimeReusable(
    RUNTIME_PATHS,
    SOURCE_FINGERPRINT
  );
  ensurePath(OFFICIAL_UI_DIR, "Official iRacing UI directory");
  ensurePath(OFFICIAL_EXE_PATH, "Official iRacing UI executable");
  ensurePath(BOOTSTRAP_SOURCE, "Official runtime bootstrap source");

  if (SHOULD_REBUILD_RUNTIME) {
    removePathForcefully(RUNTIME_UI_DIR);
    ensureDir(RUNTIME_UI_DIR);
    copyDirectoryVerbatim(OFFICIAL_UI_DIR, RUNTIME_UI_DIR);

    ensureDir(RUNTIME_RESOURCES_DIR);

    if (pathExists(RUNTIME_APP_ASAR) || pathExists(OFFICIAL_PATHS.asarPath)) {
      if (pathExists(RUNTIME_APP_BACKUP_ASAR)) {
        removePathForcefully(RUNTIME_APP_BACKUP_ASAR);
      }

      const sourceAsarPath = pathExists(RUNTIME_APP_ASAR)
        ? RUNTIME_APP_ASAR
        : OFFICIAL_PATHS.asarPath;
      await copyFileWithRetries(sourceAsarPath, RUNTIME_APP_BACKUP_ASAR);
      removePathForcefully(RUNTIME_APP_DIR);
      asar.extractAll(RUNTIME_APP_BACKUP_ASAR, RUNTIME_APP_DIR);
      removePathForcefully(RUNTIME_APP_ASAR);
    }

    writeManagedRuntimeMetadata(RUNTIME_PATHS, {
      layoutVersion: MANAGED_RUNTIME_LAYOUT_VERSION,
      sourceFingerprint: SOURCE_FINGERPRINT,
      sourceUiDir: OFFICIAL_UI_DIR,
      rebuiltAt: new Date().toISOString(),
    });
  }

  ensurePath(
    RUNTIME_APP_BACKUP_ASAR,
    "Managed iRefinedX runtime backup app.asar"
  );
  ensurePath(RUNTIME_PATHS.exePath, "Managed iRefinedX runtime executable");
  ensurePath(RUNTIME_APP_DIR, "Extracted iRefinedX runtime app directory");
  ensurePath(PRELOAD_JS_TARGET, "Extracted iRefinedX runtime preload");

  const bootstrapSource = fs
    .readFileSync(BOOTSTRAP_SOURCE, "utf8")
    .replace('"__IREFINED_ROOT__"', JSON.stringify(ROOT_DIR));
  fs.writeFileSync(BOOTSTRAP_TARGET, bootstrapSource, "utf8");
  patchMainProcessEntry(MAIN_JS_TARGET);
  patchPreloadProcessEntry(PRELOAD_JS_TARGET);
  savePatchedUiDir(OFFICIAL_UI_DIR);

  return {
    officialUiDir: OFFICIAL_UI_DIR,
    officialExePath: OFFICIAL_EXE_PATH,
    officialInstallRoot: OFFICIAL_PATHS.installRoot,
    runtimeDir: RUNTIME_UI_DIR,
    exePath: RUNTIME_PATHS.exePath,
    backupAsar: RUNTIME_APP_BACKUP_ASAR,
    patchedInPlace: false,
    rebuilt: SHOULD_REBUILD_RUNTIME,
    sourceFingerprint: SOURCE_FINGERPRINT,
  };
}

module.exports = {
  LOCAL_RUNTIME_DIR: "",
  prepareRuntime,
  resolveOfficialUiDir,
  savePreferredUiDir,
  clearPreferredUiDir,
  normalizeUiDirCandidate,
  isValidOfficialUiDir,
  restoreKnownOfficialUiDirs,
  cleanupLocalState,
};
