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
} = require("./prepare-runtime.cjs");

const APP_DATA_DIR = process.versions.electron
  ? path.join(
      process.env.APPDATA || process.env.LOCALAPPDATA || os.tmpdir(),
      "iRefinedX"
    )
  : __dirname;
const SYSTEM32_DIR = path.join(
  process.env.SystemRoot || "C:\\Windows",
  "System32"
);
const TASKKILL_EXE = path.join(SYSTEM32_DIR, "taskkill.exe");
const REG_EXE = path.join(SYSTEM32_DIR, "reg.exe");
const RUNLOG_DIR = path.join(APP_DATA_DIR, "runlogs");
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

async function promptForOfficialUiDir() {
  if (!process.versions.electron) {
    return "";
  }

  const electron = require("electron");
  const dialog = electron?.dialog;

  if (!dialog || typeof dialog.showOpenDialog !== "function") {
    return "";
  }

  const result = await dialog.showOpenDialog({
    title: "Locate your official iRacing UI folder",
    buttonLabel: "Use this folder",
    properties: ["openDirectory"],
    message:
      "Select the installed iRacing UI folder. You can choose the iRacing root folder or the ui folder itself.",
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

  savePreferredUiDir(normalizedUiDir);
  process.env.IRACING_UI_DIR = normalizedUiDir;
  return normalizedUiDir;
}

async function main() {
  ensureDir(RUNLOG_DIR);
  fs.writeFileSync(STDOUT_LOG, "", "utf8");
  fs.writeFileSync(STDERR_LOG, "", "utf8");

  writeLauncherLog("prepare-runtime-start", {
    irefMode: IREF_MODE,
  });

  const stoppedExisting = stopExistingIRacingUiInstances();
  writeLauncherLog("existing-runtime-stop-attempted", {
    stoppedExisting,
  });

  let runtime;

  try {
    runtime = await prepareRuntime();
  } catch (error) {
    if (error?.code !== "IRACING_UI_NOT_FOUND") {
      throw error;
    }

    writeLauncherLog("iracing-ui-auto-discovery-failed", {
      message: error.message,
      cacheFile: error.cacheFile || "",
    });

    const selectedUiDir = await promptForOfficialUiDir();

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

    process.exitCode = typeof code === "number" ? code : 0;
    setTimeout(() => {
      process.exit(process.exitCode || 0);
    }, 50);
  });

  child.on("error", (error) => {
    const line = `[${new Date().toISOString()}] runtime-error ${error.stack || error.message}\n`;
    fs.appendFileSync(STDERR_LOG, line, "utf8");
    process.stderr.write(line);
  });
}

main().catch((error) => {
  ensureDir(RUNLOG_DIR);
  const line = `[${new Date().toISOString()}] launcher-failed ${error.stack || error.message}\n`;
  fs.appendFileSync(STDERR_LOG, line, "utf8");
  process.stderr.write(line);
  process.exitCode = 1;
});
