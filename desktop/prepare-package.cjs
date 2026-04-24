const fs = require("node:fs");
const path = require("node:path");

const DESKTOP_DIR = __dirname;
const REPO_ROOT = path.resolve(DESKTOP_DIR, "..");
const SOURCE_EXTENSION_DIST_DIR = path.join(REPO_ROOT, "extension", "dist");
const TARGET_EXTENSION_DIR = path.join(DESKTOP_DIR, "extension");
const TARGET_EXTENSION_DIST_DIR = path.join(TARGET_EXTENSION_DIR, "dist");
const TARGET_LEGAL_DIR = path.join(DESKTOP_DIR, "legal");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyDirectory(sourceDir, targetDir) {
  ensureDir(targetDir);

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
      continue;
    }

    fs.copyFileSync(sourcePath, targetPath);
  }
}

function copyIfExists(sourcePath, targetPath) {
  if (!fs.existsSync(sourcePath)) {
    return;
  }

  ensureDir(path.dirname(targetPath));
  fs.copyFileSync(sourcePath, targetPath);
}

function main() {
  if (!fs.existsSync(SOURCE_EXTENSION_DIST_DIR)) {
    throw new Error(
      `Missing extension build output: ${SOURCE_EXTENSION_DIST_DIR}. Run the extension build first.`
    );
  }

  fs.rmSync(TARGET_EXTENSION_DIR, { recursive: true, force: true });
  fs.rmSync(TARGET_LEGAL_DIR, { recursive: true, force: true });

  copyDirectory(SOURCE_EXTENSION_DIST_DIR, TARGET_EXTENSION_DIST_DIR);

  copyIfExists(
    path.join(REPO_ROOT, "LICENSE"),
    path.join(TARGET_LEGAL_DIR, "LICENSE.txt")
  );
  copyIfExists(
    path.join(REPO_ROOT, "THIRD_PARTY_NOTICES.md"),
    path.join(TARGET_LEGAL_DIR, "THIRD_PARTY_NOTICES.md")
  );
  copyIfExists(
    path.join(REPO_ROOT, "README.md"),
    path.join(TARGET_LEGAL_DIR, "README.md")
  );

  process.stdout.write(
    JSON.stringify(
      {
        extensionDist: TARGET_EXTENSION_DIST_DIR,
        legalDir: TARGET_LEGAL_DIR,
      },
      null,
      2
    ) + "\n"
  );
}

main();
