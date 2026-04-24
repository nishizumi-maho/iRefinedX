const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");
const {
  prepareRuntime,
  LOCAL_RUNTIME_DIR,
  normalizeUiDirCandidate,
  isValidOfficialUiDir,
  savePreferredUiDir,
  restoreKnownOfficialUiDirs,
  cleanupLocalState,
} = require("./prepare-runtime.cjs");

const CLEANUP_FLAG = "--cleanup-installed-state";
const IS_CLEANUP_MODE = process.argv.includes(CLEANUP_FLAG);
const PERSISTENT_APP_DATA_DIR = process.versions.electron
  ? path.join(
      process.env.APPDATA || process.env.LOCALAPPDATA || os.tmpdir(),
      "iRefinedX"
    )
  : __dirname;
const RUNLOG_DIR = IS_CLEANUP_MODE
  ? path.join(os.tmpdir(), "iRefinedX-cleanup")
  : path.join(PERSISTENT_APP_DATA_DIR, "runlogs");
const SYSTEM32_DIR = path.join(
  process.env.SystemRoot || "C:\\Windows",
  "System32"
);
const TASKKILL_EXE = path.join(SYSTEM32_DIR, "taskkill.exe");
const REG_EXE = path.join(SYSTEM32_DIR, "reg.exe");
const STDOUT_LOG = path.join(RUNLOG_DIR, "stdout-local-runtime.log");
const STDERR_LOG = path.join(RUNLOG_DIR, "stderr-local-runtime.log");
const IREF_MODE = process.env.IREF_MODE || "fallback";

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeLauncherLog(message, detail) {
  const stamp = new Date().toISOString();
  const suffix = detail ? ` ${JSON.stringify(detail)}` : "";
  const line = `[${stamp}] ${message}${suffix}\n`;

  process.stdout.write(line);
  fs.appendFileSync(STDOUT_LOG, line, "utf8");
}

function stopExistingIRacingUiInstances() {
  const result = spawnSync(
    TASKKILL_EXE,
    ["/IM", "iRacingUI.exe", "/T", "/F"],
    {
      stdio: "ignore",
      windowsHide: true,
    }
  );

  return result.status === 0;
}

function restoreOfficialRuntimeState(reason) {
  const restoreResult = restoreKnownOfficialUiDirs();
  writeLauncherLog("official-runtime-restore-complete", {
    reason,
    ...restoreResult,
  });
  return restoreResult;
}

function restoreProtocolAssociation(exePath) {
  const schemes = [
    "iracing",
    "iracing-alpha",
    "iracing-beta",
    "iracing-gamma",
    "iracing-secure",
    "iracing-staging",
  ];

  schemes.forEach((scheme) => {
    spawnSync(
      REG_EXE,
      [
        "add",
        `HKCU\\SOFTWARE\\Classes\\${scheme}\\shell\\open\\command`,
        "/ve",
        "/t",
        "REG_SZ",
        "/d",
        `"${exePath}" "%1"`,
        "/f",
      ],
      {
        stdio: "ignore",
        windowsHide: true,
      }
    );
  });
}

function formatUiCandidateList(candidates = []) {
  return candidates.map((candidate) => `- ${candidate}`).join("\n");
}

function getPickerDefaultPath(candidates = []) {
  const candidate = candidates.find(Boolean);

  if (!candidate) {
    return process.env["ProgramFiles(x86)"] || process.env.ProgramFiles || "C:\\";
  }

  return path.dirname(candidate);
}

async function promptToRememberOfficialUiDir(dialog, normalizedUiDir) {
  const result = await dialog.showMessageBox({
    type: "question",
    buttons: ["Remember this folder", "Use once", "Cancel"],
    defaultId: 0,
    cancelId: 2,
    noLink: true,
    title: "Remember this iRacing UI folder?",
    message: "Do you want iReX to remember this iRacing UI folder?",
    detail:
      `${normalizedUiDir}\n\n` +
      'Choose "Remember this folder" to reuse it on future launches, or "Use once" to launch only for this run.',
  });

  if (result.response === 0) {
    savePreferredUiDir(normalizedUiDir);
    return true;
  }

  if (result.response === 1) {
    return true;
  }

  return false;
}

async function promptForOfficialUiDir(error = null) {
  if (!process.versions.electron) {
    return "";
  }

  const electron = require("electron");
  const dialog = electron?.dialog;

  if (!dialog || typeof dialog.showOpenDialog !== "function") {
    return "";
  }

  if (error?.code === "IRACING_UI_AMBIGUOUS") {
    const choice = await dialog.showMessageBox({
      type: "warning",
      buttons: ["Choose folder", "Cancel"],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
      title: "Choose your iRacing UI folder",
      message: "More than one official iRacing installation was detected.",
      detail:
        `${formatUiCandidateList(error.candidates || [])}\n\n` +
        "Select the iRacing root folder or the ui folder you want iReX to use.",
    });

    if (choice.response !== 0) {
      return "";
    }
  }

  const result = await dialog.showOpenDialog({
    title: "Locate your official iRacing UI folder",
    buttonLabel: "Use this folder",
    properties: ["openDirectory"],
    message:
      "Select the installed iRacing UI folder. You can choose the iRacing root folder or the ui folder itself.",
    defaultPath: getPickerDefaultPath(error?.candidates || []),
  });

  if (result.canceled || !result.filePaths?.[0]) {
    return "";
  }

  const normalizedUiDir = normalizeUiDirCandidate(result.filePaths[0]);

  if (!isValidOfficialUiDir(normalizedUiDir)) {
    throw new Error(
      "The selected folder does not contain a valid official iRacing UI installation."
    );
  }

  const accepted = await promptToRememberOfficialUiDir(dialog, normalizedUiDir);

  if (!accepted) {
    return "";
  }

  process.env.IRACING_UI_DIR = normalizedUiDir;
  return normalizedUiDir;
}

async function runCleanupMode() {
  writeLauncherLog("cleanup-mode-start");
  const stoppedExisting = stopExistingIRacingUiInstances();
  writeLauncherLog("cleanup-existing-runtime-stop-attempted", {
    stoppedExisting,
  });

  restoreOfficialRuntimeState("cleanup");
  const cleanupResult = cleanupLocalState();
  writeLauncherLog("cleanup-local-state-complete", cleanupResult);
}

async function main() {
  ensureDir(RUNLOG_DIR);
  fs.writeFileSync(STDOUT_LOG, "", "utf8");
  fs.writeFileSync(STDERR_LOG, "", "utf8");

  if (IS_CLEANUP_MODE) {
    await runCleanupMode();
    return;
  }

  writeLauncherLog("prepare-runtime-start", {
    irefMode: IREF_MODE,
  });

  const stoppedExisting = stopExistingIRacingUiInstances();
  writeLauncherLog("existing-runtime-stop-attempted", {
    stoppedExisting,
  });
  restoreOfficialRuntimeState("launcher-start");

  let runtime;

  try {
    runtime = await prepareRuntime();
  } catch (error) {
    if (!["IRACING_UI_NOT_FOUND", "IRACING_UI_AMBIGUOUS"].includes(error?.code)) {
      throw error;
    }

    writeLauncherLog("iracing-ui-auto-discovery-failed", {
      code: error.code || "",
      message: error.message,
      cacheFile: error.cacheFile || "",
      candidates: error.candidates || [],
    });

    const selectedUiDir = await promptForOfficialUiDir(error);

    if (!selectedUiDir) {
      throw error;
    }

    runtime = await prepareRuntime();
  }

  writeLauncherLog("prepare-runtime-complete", runtime);
  restoreProtocolAssociation(runtime.exePath);
  writeLauncherLog("protocol-association-restored", {
    exePath: runtime.exePath,
  });

  const child = spawn(runtime.exePath, process.argv.slice(2), {
    cwd: runtime.runtimeDir || LOCAL_RUNTIME_DIR,
    env: {
      ...process.env,
      IREF_MODE,
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: false,
  });

  const stdoutStream = fs.createWriteStream(STDOUT_LOG, { flags: "a" });
  const stderrStream = fs.createWriteStream(STDERR_LOG, { flags: "a" });

  child.stdout.pipe(stdoutStream);
  child.stderr.pipe(stderrStream);

  child.on("spawn", () => {
    writeLauncherLog("runtime-spawned", {
      pid: child.pid,
      exePath: runtime.exePath,
    });
  });

  child.on("exit", (code, signal) => {
    writeLauncherLog("runtime-exit", {
      code,
      signal,
    });
    restoreOfficialRuntimeState("runtime-exit");
    restoreProtocolAssociation(runtime.officialExePath || runtime.exePath);

    process.exitCode = typeof code === "number" ? code : 0;
    setTimeout(() => {
      process.exit(process.exitCode || 0);
    }, 50);
  });

  child.on("error", (error) => {
    restoreOfficialRuntimeState("runtime-spawn-error");
    restoreProtocolAssociation(runtime.officialExePath || runtime.exePath);
    const line = `[${new Date().toISOString()}] runtime-error ${error.stack || error.message}\n`;
    fs.appendFileSync(STDERR_LOG, line, "utf8");
    process.stderr.write(line);
  });
}

main().catch((error) => {
  ensureDir(RUNLOG_DIR);
  restoreOfficialRuntimeState("launcher-error");
  const line = `[${new Date().toISOString()}] launcher-failed ${error.stack || error.message}\n`;
  fs.appendFileSync(STDERR_LOG, line, "utf8");
  process.stderr.write(line);
  process.exitCode = 1;
});
