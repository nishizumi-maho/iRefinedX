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
const INSTALL_ROOT_SNIPPET = 'Ue=()=>o().join(__dirname,"..","..","..","..")';
const INSTALL_ROOT_PATCHED =
  'Ue=()=>process.env.IRACING_INSTALL_ROOT||o().join(__dirname,"..","..","..","..")';
const DID_FAIL_LOAD_SNIPPET =
  '-3!==t?(Na.error("fail load error",n),Xa.isDestroyed()?(Xa=Ya(),Xa.on("ready-to-show",()=>{We(r,Xa.webContents)})):We(r,Xa.webContents),Na.debug("Destroying window due to load failing"),Ha.destroy()):Na.debug("errorCode -3 caught, ignoring since this happens when content updating starts")';
const DID_FAIL_LOAD_PATCHED =
  '-3!==t&&-2!==t?(Na.error("fail load error",n),Xa.isDestroyed()?(Xa=Ya(),Xa.on("ready-to-show",()=>{We(r,Xa.webContents)})):We(r,Xa.webContents),Na.debug("Destroying window due to load failing"),Ha.destroy()):Na.debug(`errorCode ${t} caught, ignoring since this happens when content updating starts`)';
const LEGACY_PRELOAD_PATCH_SNIPPET = 'require("./irefined-preload.cjs");\n';
const PRELOAD_PATCH_MARKER = "__irefinedPreloadProbe";
const LEGACY_MANAGED_RUNTIME_DIR_PREFIX = "ui-irex-runtime";
const RUNTIME_LAYOUT_VERSION = 7;
const ROUTER_PACKAGE_MAIN = "router.cjs";
const ROUTER_PACKAGE_MARKER = "irefinedxRouter";
const ROUTER_MAIN_SOURCE = [
  'const fs = require("node:fs");',
  'const path = require("node:path");',
  'const { app } = require("electron");',
  'const originalTarget = path.join(__dirname, "..", "app.irx-original.asar");',
  'const irefinedTarget = path.join(__dirname, "..", "app.irefined");',
  'const useIrefined = process.env.IREF_MODE === "fallback";',
  "const preferredTarget = useIrefined ? irefinedTarget : originalTarget;",
  "const fallbackTarget = useIrefined ? originalTarget : irefinedTarget;",
  "const target = fs.existsSync(preferredTarget) ? preferredTarget : fallbackTarget;",
  'if (!fs.existsSync(target)) {',
  '  throw new Error(`Unable to locate routed runtime target: ${target}`);',
  "}",
  'const packageJsonPath = path.join(target, "package.json");',
  "let appName = \"\";",
  "if (fs.existsSync(packageJsonPath)) {",
  "  try {",
  '    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));',
  '    if (typeof packageJson?.name === "string" && packageJson.name) {',
  "      appName = packageJson.name;",
  "    }",
  "  } catch {}",
  "}",
  "if (appName) {",
  "  try {",
  '    if (typeof app?.setName === "function") {',
  "      app.setName(appName);",
  "    }",
  '    if (typeof app?.getPath === "function" && typeof app?.setPath === "function") {',
  '      const appDataRoot = app.getPath("appData");',
  "      if (appDataRoot) {",
  "        const userDataPath = path.join(appDataRoot, appName);",
  '        app.setPath("userData", userDataPath);',
  '        app.setPath("sessionData", userDataPath);',
  "      }",
  "    }",
  "  } catch {}",
  "}",
  "try {",
  '  if (app && typeof app.getAppPath === "function") {',
  "    app.getAppPath = () => target;",
  "  }",
  "} catch {}",
  "require(target);",
  "",
].join("\n");
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

function writeTextFileIfChanged(targetPath, contents) {
  if (pathExists(targetPath)) {
    try {
      if (fs.readFileSync(targetPath, "utf8") === contents) {
        return false;
      }
    } catch {}
  }

  fs.writeFileSync(targetPath, contents, "utf8");
  return true;
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
    routerPackagePath: path.join(normalizedUiDir, "resources", "app", "package.json"),
    routerMainPath: path.join(normalizedUiDir, "resources", "app", "router.cjs"),
    irefinedAppDir: path.join(normalizedUiDir, "resources", "app.irefined"),
    irefinedMainJsPath: path.join(
      normalizedUiDir,
      "resources",
      "app.irefined",
      "compiled",
      "main.js"
    ),
    irefinedPreloadJsPath: path.join(
      normalizedUiDir,
      "resources",
      "app.irefined",
      "compiled",
      "preload.js"
    ),
    metadataPath: path.join(normalizedUiDir, ".irex-runtime.json"),
  };
}

function isLegacyManagedRuntimeUiDir(uiDir) {
  const normalizedUiDir = normalizeUiDirCandidate(uiDir);

  if (!normalizedUiDir) {
    return false;
  }

  return path.basename(normalizedUiDir).toLowerCase().startsWith(
    LEGACY_MANAGED_RUNTIME_DIR_PREFIX.toLowerCase()
  );
}

function isRouterAppDir(paths) {
  if (!pathExists(paths.routerPackagePath) || !pathExists(paths.routerMainPath)) {
    return false;
  }

  const pkg = readJsonFile(paths.routerPackagePath, null);
  return pkg?.main === ROUTER_PACKAGE_MAIN && pkg?.[ROUTER_PACKAGE_MARKER] === true;
}

function isLegacyPatchedAppDir(paths) {
  return (
    pathExists(paths.appDir) &&
    pathExists(paths.mainJsPath) &&
    pathExists(paths.preloadJsPath) &&
    !isRouterAppDir(paths)
  );
}

function isValidOfficialUiDir(uiDir) {
  if (!uiDir) {
    return false;
  }

  if (isLegacyManagedRuntimeUiDir(uiDir)) {
    return false;
  }

  const paths = getOfficialUiPaths(uiDir);
  const hasPackagedRuntime = pathExists(paths.asarPath);
  const hasBackupRuntime = pathExists(paths.backupAsarPath);
  const hasRouterRuntime = hasBackupRuntime && isRouterAppDir(paths);
  const hasLegacyExtractedRuntime = isLegacyPatchedAppDir(paths);

  return (
    pathExists(paths.exePath) &&
    (hasPackagedRuntime || hasBackupRuntime || hasRouterRuntime || hasLegacyExtractedRuntime)
  );
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
  ]).filter((candidate) => !isLegacyManagedRuntimeUiDir(candidate));
}

function getKnownOfficialUiDirs() {
  return getUniqueUiDirCandidates([
    readCachedUiDir(),
    ...readPatchedUiDirs(),
    ...getAutoDetectedUiDirCandidates(),
  ]).filter((candidate) => !isLegacyManagedRuntimeUiDir(candidate) && isValidOfficialUiDir(candidate));
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

function getSourceAsarPath(paths) {
  if (pathExists(paths.asarPath)) {
    return paths.asarPath;
  }

  if (pathExists(paths.backupAsarPath)) {
    return paths.backupAsarPath;
  }

  return "";
}

function getRuntimeFingerprint(paths, sourceAsarPath = "") {
  const asarPath = sourceAsarPath || getSourceAsarPath(paths);
  const asarStats = statPath(asarPath);
  const exeStats = statPath(paths.exePath);

  return [
    `asar:${asarStats.size}:${Math.round(asarStats.mtimeMs)}`,
    `exe:${exeStats.size}:${Math.round(exeStats.mtimeMs)}`,
  ].join("|");
}

function isRuntimeReusable(paths, expectedFingerprint) {
  const metadata = readJsonFile(paths.metadataPath, null);

  if (!metadata || typeof metadata !== "object") {
    return false;
  }

  if (metadata.layoutVersion !== RUNTIME_LAYOUT_VERSION) {
    return false;
  }

  if (metadata.sourceFingerprint !== expectedFingerprint) {
    return false;
  }

  if (pathExists(paths.asarPath)) {
    return false;
  }

  return (
    pathExists(paths.backupAsarPath) &&
    isRouterAppDir(paths) &&
    pathExists(paths.irefinedAppDir) &&
    pathExists(paths.irefinedMainJsPath) &&
    pathExists(paths.irefinedPreloadJsPath)
  );
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

  if (nextSource.includes(INSTALL_ROOT_SNIPPET)) {
    nextSource = nextSource.replace(INSTALL_ROOT_SNIPPET, INSTALL_ROOT_PATCHED);
  } else if (!nextSource.includes(INSTALL_ROOT_PATCHED)) {
    throw new Error(`Unable to patch install root resolver: ${mainJsTarget}`);
  }

  if (nextSource.includes(DID_FAIL_LOAD_SNIPPET)) {
    nextSource = nextSource.replace(DID_FAIL_LOAD_SNIPPET, DID_FAIL_LOAD_PATCHED);
  } else if (!nextSource.includes(DID_FAIL_LOAD_PATCHED)) {
    throw new Error(`Unable to patch did-fail-load handling: ${mainJsTarget}`);
  }

  if (nextSource === source) {
    return false;
  }

  fs.writeFileSync(mainJsTarget, nextSource, "utf8");
  return true;
}

function patchPreloadProcessEntry(preloadJsTarget) {
  const source = fs.readFileSync(preloadJsTarget, "utf8");
  let nextSource = source;
  const probePrefix =
    'const __irefinedTrpcPaths=new Map;const __irefinedPreloadSanitize=t=>{if(!t||"object"!=typeof t)return t;if("request"===t.method&&t.operation&&"object"==typeof t.operation){const e={method:t.method,operation:{id:t.operation.id??null,type:t.operation.type??null,path:t.operation.path??null}};null!=t.operation.id&&__irefinedTrpcPaths.set(t.operation.id,t.operation.path??null);return e}if("id"in t){const r=__irefinedTrpcPaths.get(t.id)||null;null!=t.id&&__irefinedTrpcPaths.delete(t.id);const e="electron.getVersions"===r&&t.result&&"object"==typeof t.result&&Object.prototype.hasOwnProperty.call(t.result,"data")?{type:t.result.type??null,data:t.result.data??null}:t.result&&"object"==typeof t.result?{type:t.result.type??null,hasData:Object.prototype.hasOwnProperty.call(t.result,"data")}:null,n=t.error&&"object"==typeof t.error?{code:t.error.code??null,path:t.error.data&&t.error.data.path||null,message:t.error.message??null}:null;return{id:t.id,path:r,result:e,error:n}}return t;};const __irefinedPreloadProbe=(t,n)=>{try{console.debug("[irefined-probe]"+JSON.stringify({type:t,detail:__irefinedPreloadSanitize(n),href:globalThis.location&&globalThis.location.href||"",ts:new Date().toISOString(),source:"preload"}))}catch(e){}};';
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

  if (nextSource === source) {
    return false;
  }

  fs.writeFileSync(preloadJsTarget, nextSource, "utf8");
  return true;
}

function writeRouterApp(paths) {
  const sourcePackageJsonPath = path.join(paths.irefinedAppDir, "package.json");
  const sourcePackageJson = readJsonFile(sourcePackageJsonPath, {});
  const routerPackageJson = {
    ...(sourcePackageJson && typeof sourcePackageJson === "object" ? sourcePackageJson : {}),
    main: ROUTER_PACKAGE_MAIN,
    [ROUTER_PACKAGE_MARKER]: true,
  };

  ensureDir(paths.appDir);
  writeTextFileIfChanged(paths.routerPackagePath, `${JSON.stringify(routerPackageJson, null, 2)}\n`);
  writeTextFileIfChanged(paths.routerMainPath, ROUTER_MAIN_SOURCE);
}

function writeRuntimeMetadata(paths, metadata) {
  fs.writeFileSync(paths.metadataPath, JSON.stringify(metadata, null, 2), "utf8");
}

function promoteOfficialSourceAsar(paths) {
  if (!pathExists(paths.asarPath)) {
    return paths.backupAsarPath;
  }

  if (pathExists(paths.backupAsarPath)) {
    removePathForcefully(paths.backupAsarPath);
  }

  copyFileSyncSafe(paths.asarPath, paths.backupAsarPath);
  removePathForcefully(paths.asarPath);
  return paths.backupAsarPath;
}

async function rebuildRuntime(paths, sourceFingerprint) {
  const sourceAsarPath = promoteOfficialSourceAsar(paths);

  ensurePath(sourceAsarPath, "Official iRacing UI source app.asar");

  removePathForcefully(paths.appDir);
  removePathForcefully(paths.irefinedAppDir);
  removePathForcefully(paths.metadataPath);

  asar.extractAll(sourceAsarPath, paths.irefinedAppDir);

  const bootstrapTarget = path.join(
    paths.irefinedAppDir,
    "compiled",
    "irefined-bootstrap.cjs"
  );
  const bootstrapSource = fs
    .readFileSync(BOOTSTRAP_SOURCE, "utf8")
    .replace('"__IREFINED_ROOT__"', JSON.stringify(ROOT_DIR));
  writeTextFileIfChanged(bootstrapTarget, bootstrapSource);
  patchMainProcessEntry(paths.irefinedMainJsPath);
  patchPreloadProcessEntry(paths.irefinedPreloadJsPath);
  writeRouterApp(paths);

  writeRuntimeMetadata(paths, {
    layoutVersion: RUNTIME_LAYOUT_VERSION,
    sourceFingerprint,
    sourceUiDir: paths.uiDir,
    rebuiltAt: new Date().toISOString(),
  });
}

function restoreOfficialUiDir(uiDir) {
  const paths = getOfficialUiPaths(uiDir);
  const result = {
    uiDir,
    hadOriginalAsar: pathExists(paths.asarPath),
    hadBackupAsar: pathExists(paths.backupAsarPath),
    hadRouterApp: pathExists(paths.appDir),
    hadIrefinedApp: pathExists(paths.irefinedAppDir),
    hadMetadata: pathExists(paths.metadataPath),
    restoredOriginal: false,
    skipped: false,
    success: false,
    message: "",
  };
  const hadManagedRuntimeArtifacts =
    result.hadBackupAsar ||
    result.hadRouterApp ||
    result.hadIrefinedApp ||
    result.hadMetadata;

  if (!hadManagedRuntimeArtifacts && result.hadOriginalAsar) {
    result.skipped = true;
    result.success = true;
    return result;
  }

  if (!result.hadOriginalAsar && !result.hadBackupAsar) {
    result.message =
      "Neither app.asar nor app.irx-original.asar is available to restore the official UI.";
    return result;
  }

  try {
    ensureDir(paths.resourcesDir);

    if (result.hadBackupAsar) {
      removePathForcefully(paths.asarPath);
      copyFileSyncSafe(paths.backupAsarPath, paths.asarPath);
      result.restoredOriginal = pathExists(paths.asarPath);
    }

    removePathForcefully(paths.backupAsarPath);
    removePathForcefully(paths.appDir);
    removePathForcefully(paths.irefinedAppDir);
    removePathForcefully(paths.metadataPath);

    if (!pathExists(paths.asarPath)) {
      throw new Error(`Official app.asar could not be restored: ${paths.asarPath}`);
    }

    if (
      pathExists(paths.backupAsarPath) ||
      pathExists(paths.appDir) ||
      pathExists(paths.irefinedAppDir) ||
      pathExists(paths.metadataPath)
    ) {
      throw new Error(`iRefinedX runtime artifacts could not be fully removed: ${uiDir}`);
    }

    result.success = true;
  } catch (error) {
    result.message = error.message;
  }

  return result;
}

function restoreKnownOfficialUiDirs() {
  const candidates = getKnownOfficialUiDirs();
  const details = candidates.map((candidate) => restoreOfficialUiDir(candidate));

  return {
    candidates,
    restored: details.filter((entry) => entry.success && !entry.skipped).map((entry) => entry.uiDir),
    skipped: details.filter((entry) => entry.skipped).map((entry) => entry.uiDir),
    failed: details.filter((entry) => !entry.success),
    details,
  };
}

function removeLegacyManagedRuntimeDirs() {
  const runtimeCandidates = [];

  for (const candidate of getKnownOfficialUiDirs()) {
    const installRoot = getOfficialUiPaths(candidate).installRoot;

    try {
      for (const entry of fs.readdirSync(installRoot, { withFileTypes: true })) {
        if (
          entry.isDirectory() &&
          (entry.name === LEGACY_MANAGED_RUNTIME_DIR_PREFIX ||
            entry.name.startsWith(`${LEGACY_MANAGED_RUNTIME_DIR_PREFIX}-`))
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
  const restoreResult = restoreKnownOfficialUiDirs();
  const legacyRuntimeCleanup = removeLegacyManagedRuntimeDirs();
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
    restoreResult,
    legacyRuntimeCleanup,
    removed,
    missing,
    failed,
  };
}

async function prepareRuntime() {
  const OFFICIAL_UI_DIR = resolveOfficialUiDir(process.env.IRACING_UI_DIR || "");
  const OFFICIAL_PATHS = getOfficialUiPaths(OFFICIAL_UI_DIR);
  const OFFICIAL_EXE_PATH = OFFICIAL_PATHS.exePath;
  const SOURCE_ASAR_PATH = getSourceAsarPath(OFFICIAL_PATHS);

  ensurePath(OFFICIAL_UI_DIR, "Official iRacing UI directory");
  ensurePath(OFFICIAL_EXE_PATH, "Official iRacing UI executable");
  ensurePath(BOOTSTRAP_SOURCE, "Official runtime bootstrap source");
  ensurePath(SOURCE_ASAR_PATH, "Official iRacing UI source app.asar");

  const SOURCE_FINGERPRINT = getRuntimeFingerprint(OFFICIAL_PATHS, SOURCE_ASAR_PATH);
  const SHOULD_REBUILD_RUNTIME = !isRuntimeReusable(
    OFFICIAL_PATHS,
    SOURCE_FINGERPRINT
  );

  if (SHOULD_REBUILD_RUNTIME) {
    await rebuildRuntime(OFFICIAL_PATHS, SOURCE_FINGERPRINT);
  }

  ensurePath(
    OFFICIAL_PATHS.backupAsarPath,
    "Official iRacing UI backup app.asar"
  );
  ensurePath(OFFICIAL_PATHS.routerMainPath, "iRefinedX runtime router");
  ensurePath(
    OFFICIAL_PATHS.irefinedMainJsPath,
    "Extracted iRefinedX runtime main entry"
  );
  ensurePath(
    OFFICIAL_PATHS.irefinedPreloadJsPath,
    "Extracted iRefinedX runtime preload"
  );

  savePatchedUiDir(OFFICIAL_UI_DIR);

  return {
    officialUiDir: OFFICIAL_UI_DIR,
    officialExePath: OFFICIAL_EXE_PATH,
    officialInstallRoot: OFFICIAL_PATHS.installRoot,
    runtimeDir: OFFICIAL_UI_DIR,
    exePath: OFFICIAL_EXE_PATH,
    backupAsar: OFFICIAL_PATHS.backupAsarPath,
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
  normalizeUiDirCandidate,
  isValidOfficialUiDir,
  cleanupLocalState,
};
