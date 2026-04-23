const fs = require("node:fs");
const fsp = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

let installRootHint = "";

function configure({ installRoot } = {}) {
  if (installRoot) {
    installRootHint = installRoot;
  }
}

function tryReadText(filePath) {
  try {
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8").trim() : "";
  } catch {
    return "";
  }
}

function getDataDirectoryName() {
  const candidates = [
    installRootHint ? path.join(installRootHint, "datadir.txt") : "",
    "C:\\Program Files (x86)\\iRacing\\datadir.txt",
    "D:\\Program Files (x86)\\iRacing\\datadir.txt",
  ].filter(Boolean);

  for (const candidate of candidates) {
    const value = tryReadText(candidate).replace(/\r?\n/g, "").trim();
    if (value) {
      return value;
    }
  }

  return "iRacing";
}

function documentsDir() {
  return path.join(os.homedir(), "Documents", getDataDirectoryName());
}

function localAppDataDir() {
  const base = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
  return path.join(base, getDataDirectoryName());
}

function appIniPath() {
  return path.join(documentsDir(), "app.ini");
}

function parseIni(text) {
  const result = {};
  let current = result;

  String(text || "").split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(";") || trimmed.startsWith("#")) {
      return;
    }

    const section = trimmed.match(/^\[([^\]]+)\]$/);
    if (section) {
      current = result[section[1]] = result[section[1]] || {};
      return;
    }

    const index = trimmed.indexOf("=");
    if (index <= 0) {
      return;
    }

    current[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim();
  });

  return result;
}

function stringifyIni(value) {
  const lines = [];
  const rootEntries = Object.entries(value || {}).filter(([, entry]) => !entry || typeof entry !== "object" || Array.isArray(entry));
  const sections = Object.entries(value || {}).filter(([, entry]) => entry && typeof entry === "object" && !Array.isArray(entry));

  for (const [key, entry] of rootEntries) {
    lines.push(`${key}=${entry}`);
  }

  for (const [section, entries] of sections) {
    if (lines.length) {
      lines.push("");
    }
    lines.push(`[${section}]`);
    for (const [key, entry] of Object.entries(entries)) {
      lines.push(`${key}=${entry}`);
    }
  }

  return `${lines.join(os.EOL)}${os.EOL}`;
}

function readAppIni() {
  return parseIni(tryReadText(appIniPath()));
}

function writeAppIni(ini) {
  fs.mkdirSync(path.dirname(appIniPath()), { recursive: true });
  fs.writeFileSync(appIniPath(), stringifyIni(ini), "utf8");
}

function findIniValue(object, key, fallback = undefined) {
  if (!object || typeof object !== "object") {
    return fallback;
  }

  if (Object.prototype.hasOwnProperty.call(object, key)) {
    return object[key];
  }

  for (const value of Object.values(object)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const found = findIniValue(value, key, undefined);
      if (found !== undefined) {
        return found;
      }
    }
  }

  return fallback;
}

function setIniValue(section, key, value) {
  const ini = readAppIni();
  ini[section] = ini[section] && typeof ini[section] === "object" ? ini[section] : {};
  ini[section][key] = value;
  writeAppIni(ini);
}

function targetEnvironment() {
  return String(findIniValue(readAppIni(), "TargetEnvironment", "members") || "members").toLowerCase();
}

function environmentFamily(environment = targetEnvironment()) {
  const match = String(environment || "members").match(/^(\D+)(\d)?$/);
  return (match && match[1]) || "members";
}

function webOrigin(environment = targetEnvironment(), subdomainSuffix = "ng") {
  const env = String(environment || "members").toLowerCase();
  const suffix = subdomainSuffix || "ng";
  return `https://${env}-${suffix}.iracing.com`;
}

function dashboardUrl(subdomainSuffix = "ng") {
  return `${webOrigin(targetEnvironment(), subdomainSuffix)}/web/racing/home/dashboard`;
}

function protocolForEnvironment(environment = targetEnvironment()) {
  const family = environmentFamily(environment);
  return family === "members" ? "iracing" : `iracing-${family}`;
}

function validateName(name, extension = "") {
  const value = String(name || "");
  if (!/^[0-9a-zA-Z() \-_.]+$/.test(value) || value.startsWith(".") || value.includes("..")) {
    throw new Error("Invalid filename.");
  }

  if (extension && !value.toLowerCase().endsWith(extension.toLowerCase())) {
    throw new Error("Invalid file extension.");
  }

  return value;
}

function aiRostersDir() {
  return path.join(documentsDir(), "airosters");
}

function aiSeasonsDir() {
  return path.join(documentsDir(), "aiseasons");
}

function paintDir(carDirPath = "") {
  return carDirPath ? path.join(documentsDir(), "paint", String(carDirPath).replace(/\\/g, " ")) : path.join(documentsDir(), "paint");
}

function replayDir() {
  return path.join(documentsDir(), "replay");
}

function setupsDir(carDirPath = "") {
  return path.join(documentsDir(), "setups", String(carDirPath || "").replace(/\\/g, " "));
}

function driverBinDir() {
  return path.join(localAppDataDir(), "internal", "driver_bin");
}

async function readJson(filePath) {
  return JSON.parse(await fsp.readFile(filePath, "utf8"));
}

async function writeJson(filePath, value) {
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  await fsp.writeFile(filePath, JSON.stringify(value, null, "\t"), "utf8");
}

async function getAiRosters() {
  const result = new Map();
  const root = aiRostersDir();
  try {
    const entries = await fsp.readdir(root, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const rosterPath = path.join(root, entry.name, "roster.json");
        if (fs.existsSync(rosterPath)) {
          result.set(entry.name, await readJson(rosterPath));
        }
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) {
        result.set(path.basename(entry.name, ".json"), await readJson(path.join(root, entry.name)));
      }
    }
  } catch {
  }
  return result;
}

async function saveAiRoster(name, roster) {
  const safeName = validateName(name);
  await writeJson(path.join(aiRostersDir(), safeName, "roster.json"), roster || {});
}

async function copyAiRoster(name, copyName) {
  const source = path.join(aiRostersDir(), validateName(name));
  const target = path.join(aiRostersDir(), validateName(copyName));
  await fsp.cp(source, target, { recursive: true, force: false, errorOnExist: true });
}

async function deleteAiRoster(name) {
  await fsp.rm(path.join(aiRostersDir(), validateName(name)), { recursive: true, force: true });
}

async function renameAiRoster(oldName, newName) {
  await fsp.rename(path.join(aiRostersDir(), validateName(oldName)), path.join(aiRostersDir(), validateName(newName)));
}

async function getAiSeasons() {
  const result = new Map();
  const root = aiSeasonsDir();
  try {
    const entries = await fsp.readdir(root, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) {
        result.set(path.basename(entry.name, ".json"), await readJson(path.join(root, entry.name)));
      }
    }
  } catch {
  }
  return result;
}

async function saveAiSeason(name, season) {
  await writeJson(path.join(aiSeasonsDir(), `${validateName(name)}.json`), season || {});
}

async function deleteAiSeason(name) {
  await fsp.rm(path.join(aiSeasonsDir(), `${validateName(name)}.json`), { force: true });
}

async function renameAiSeason(oldName, newName) {
  await fsp.rename(path.join(aiSeasonsDir(), `${validateName(oldName)}.json`), path.join(aiSeasonsDir(), `${validateName(newName)}.json`));
}

function getPaintLocation({ paintName, car_dirpath: carDirPath, roster } = {}) {
  const safePaint = validateName(paintName || "");
  const candidate = carDirPath
    ? path.join(paintDir(carDirPath), safePaint)
    : roster
      ? path.join(aiRostersDir(), validateName(roster), safePaint)
      : path.join(paintDir(), safePaint);
  return fs.existsSync(candidate) ? candidate : null;
}

async function getSpecMaps(rosterName) {
  const dir = path.join(aiRostersDir(), validateName(rosterName));
  try {
    const entries = await fsp.readdir(dir);
    return entries.filter((entry) => entry.endsWith("_spec.mip"));
  } catch {
    return [];
  }
}

async function deleteSpecMap(rosterName, specMap) {
  await fsp.rm(path.join(aiRostersDir(), validateName(rosterName), validateName(specMap, ".mip")), { force: true });
}

async function copyTga(filePath, rosterName, fileName) {
  await fsp.mkdir(path.join(aiRostersDir(), validateName(rosterName)), { recursive: true });
  await fsp.copyFile(filePath, path.join(aiRostersDir(), validateName(rosterName), validateName(fileName)));
}

async function renamePaintFile(name, newName, rosterName) {
  const dir = path.join(aiRostersDir(), validateName(rosterName));
  await fsp.rename(path.join(dir, validateName(name)), path.join(dir, validateName(newName)));
}

async function deleteReplay(filename) {
  await fsp.rm(path.join(replayDir(), validateName(filename, ".rpy")), { force: true });
}

async function getReplayListFallback() {
  const replays = [];
  try {
    const entries = await fsp.readdir(replayDir(), { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".rpy")) {
        continue;
      }
      const fullPath = path.join(replayDir(), entry.name);
      const stat = await fsp.stat(fullPath);
      replays.push({
        filename: entry.name,
        name: path.basename(entry.name, ".rpy"),
        size: stat.size,
        added_at: stat.mtime,
      });
    }
  } catch {
  }

  return { replays, aggregate: null };
}

async function getLocalSetups({ carDirPath } = {}) {
  const setups = [];
  const root = setupsDir(carDirPath);
  try {
    const entries = await fsp.readdir(root, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".sto")) {
        continue;
      }
      validateName(entry.name, ".sto");
      const fullPath = path.join(root, entry.name);
      const [buffer, stat] = await Promise.all([fsp.readFile(fullPath), fsp.stat(fullPath)]);
      setups.push({
        filename: entry.name,
        added_at: stat.mtime,
        encoded: buffer.toString("hex"),
      });
    }
  } catch {
  }

  return { setups: setups.sort((a, b) => a.filename.localeCompare(b.filename)) };
}

async function getSavedGames() {
  const games = [];
  try {
    const entries = await fsp.readdir(driverBinDir(), { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".json")) {
        continue;
      }
      const fullPath = path.join(driverBinDir(), entry.name);
      try {
        games.push({
          filename: entry.name,
          data: await readJson(fullPath),
        });
      } catch {
        games.push({ filename: entry.name });
      }
    }
  } catch {
  }
  return games;
}

async function deleteSaveGame(filename) {
  await fsp.rm(path.join(driverBinDir(), validateName(filename, ".json")), { force: true });
}

async function getMsrTelemetryFiles() {
  const files = [];
  const roots = [path.join(localAppDataDir(), "internal"), path.join(documentsDir(), "telemetry")];
  for (const root of roots) {
    try {
      const entries = await fsp.readdir(root, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile() || !/\.(ibt|zip)$/i.test(entry.name)) {
          continue;
        }
        const fullPath = path.join(root, entry.name);
        const stat = await fsp.stat(fullPath);
        files.push({
          filename: entry.name,
          filePath: fullPath,
          size: stat.size,
          addedAt: stat.mtime.toISOString(),
          status: "pending",
          attempts: 0,
          message: "",
        });
      }
    } catch {
    }
  }
  return { files };
}

async function deleteTelemetryFiles(filenames = []) {
  const names = Array.isArray(filenames) ? filenames : [filenames];
  for (const name of names) {
    const safe = validateName(name);
    for (const root of [path.join(localAppDataDir(), "internal"), path.join(documentsDir(), "telemetry")]) {
      await fsp.rm(path.join(root, safe), { force: true }).catch(() => {});
    }
  }
}

async function saveEventResult(result = {}) {
  const suffix = result.subsession_id || Date.now();
  const filePath = path.join(documentsDir(), "results", `event-result-${suffix}.json`);
  await writeJson(filePath, result);
  return { filename: path.basename(filePath), filePath };
}

async function saveLapChart(payload = {}) {
  const suffix = payload.subsession_id || Date.now();
  const filePath = path.join(documentsDir(), "results", `lap-chart-${suffix}.json`);
  await writeJson(filePath, payload);
  return { filename: path.basename(filePath), filePath };
}

function getUseMetric() {
  return Number(findIniValue(readAppIni(), "systemOfMeasurement", "0")) === 1;
}

function setUseMetric(value) {
  setIniValue("Locale", "systemOfMeasurement", value ? "1" : "0");
}

async function setUseIPv6(value) {
  await fsp.mkdir(localAppDataDir(), { recursive: true });
  await fsp.writeFile(path.join(localAppDataDir(), "_useipv6.txt"), value ? "1" : "0", "utf8");
}

async function setUseSteamOverlay(value) {
  await fsp.mkdir(localAppDataDir(), { recursive: true });
  await fsp.writeFile(path.join(localAppDataDir(), "_useSteam.txt"), value ? "1" : "0", "utf8");
}

module.exports = {
  configure,
  documentsDir,
  localAppDataDir,
  appIniPath,
  readAppIni,
  writeAppIni,
  findIniValue,
  targetEnvironment,
  environmentFamily,
  webOrigin,
  dashboardUrl,
  protocolForEnvironment,
  getUseMetric,
  setUseMetric,
  setUseIPv6,
  setUseSteamOverlay,
  aiRostersDir,
  aiSeasonsDir,
  paintDir,
  replayDir,
  setupsDir,
  driverBinDir,
  getAiRosters,
  saveAiRoster,
  copyAiRoster,
  deleteAiRoster,
  renameAiRoster,
  getAiSeasons,
  saveAiSeason,
  deleteAiSeason,
  renameAiSeason,
  getPaintLocation,
  getSpecMaps,
  deleteSpecMap,
  copyTga,
  renamePaintFile,
  deleteReplay,
  getReplayListFallback,
  getLocalSetups,
  getSavedGames,
  deleteSaveGame,
  getMsrTelemetryFiles,
  deleteTelemetryFiles,
  saveEventResult,
  saveLapChart,
  validateName,
};
