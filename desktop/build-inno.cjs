const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const DESKTOP_DIR = __dirname;
const BUILD_DIR = path.join(DESKTOP_DIR, "build");
const DIST_DIR = path.join(DESKTOP_DIR, "dist");
const WIN_UNPACKED_DIR = path.join(DIST_DIR, "win-unpacked");
const INSTALLER_SCRIPT = path.join(BUILD_DIR, "installer.iss");
const PACKAGE_JSON = JSON.parse(
  fs.readFileSync(path.join(DESKTOP_DIR, "package.json"), "utf8")
);

function ensurePath(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing ${label}: ${filePath}`);
  }
}

function removeStaleNsisArtifacts() {
  if (!fs.existsSync(DIST_DIR)) {
    return;
  }

  for (const entry of fs.readdirSync(DIST_DIR, { withFileTypes: true })) {
    if (!entry.isFile()) {
      continue;
    }

    if (
      entry.name === "builder-debug.yml" ||
      entry.name === "latest.yml" ||
      entry.name.endsWith(".blockmap") ||
      entry.name.includes(".nsis.")
    ) {
      fs.rmSync(path.join(DIST_DIR, entry.name), { force: true });
    }
  }
}

function getRepositoryUrl(packageJson) {
  if (typeof packageJson.repository === "string") {
    return packageJson.repository;
  }

  if (packageJson.repository && typeof packageJson.repository.url === "string") {
    return packageJson.repository.url;
  }

  return "";
}

function findIsccExe() {
  const candidates = [
    process.env.ISCC_EXE || "",
    path.join(
      process.env.LOCALAPPDATA || "",
      "Programs",
      "Inno Setup 6",
      "ISCC.exe"
    ),
    "C:\\Program Files (x86)\\Inno Setup 6\\ISCC.exe",
    "C:\\Program Files\\Inno Setup 6\\ISCC.exe",
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  const whereResult = spawnSync("where.exe", ["iscc"], {
    encoding: "utf8",
    windowsHide: true,
  });

  if (whereResult.status === 0) {
    const located = (whereResult.stdout || "")
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .find((entry) => entry && fs.existsSync(entry));

    if (located) {
      return located;
    }
  }

  throw new Error(
    "Unable to locate Inno Setup Compiler (ISCC.exe). Install Inno Setup 6 or set ISCC_EXE."
  );
}

function main() {
  ensurePath(WIN_UNPACKED_DIR, "packaged win-unpacked app");
  ensurePath(INSTALLER_SCRIPT, "Inno Setup script");
  removeStaleNsisArtifacts();

  const isccExe = findIsccExe();
  const args = [
    `/DAppVersion=${PACKAGE_JSON.version}`,
    `/DAppDisplayVersion=${PACKAGE_JSON.displayVersion || PACKAGE_JSON.version}`,
    `/DAppPublisher=${PACKAGE_JSON.author || ""}`,
    `/DAppRepositoryUrl=${getRepositoryUrl(PACKAGE_JSON)}`,
    `/DPackagedDir=${WIN_UNPACKED_DIR}`,
    `/DOutputDir=${DIST_DIR}`,
    INSTALLER_SCRIPT,
  ];

  const result = spawnSync(isccExe, args, {
    cwd: BUILD_DIR,
    stdio: "inherit",
    windowsHide: true,
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }

  const artifactPath = path.join(
    DIST_DIR,
    `iRefinedX-Setup-${PACKAGE_JSON.version}-x64.exe`
  );

  ensurePath(artifactPath, "generated Inno Setup installer");
  process.stdout.write(`${artifactPath}\n`);
}

main();
