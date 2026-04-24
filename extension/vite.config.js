import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import packageJson from "./package.json" with { type: "json" };

const repoUrl = packageJson.repository;
const displayVersion = packageJson.displayVersion || `v${String(packageJson.version).split(".")[0]}`;
const releaseChannel =
  String(packageJson.releaseChannel || "").trim().toLowerCase() === "experimental"
    ? "experimental"
    : "stable";

function getRepositorySlug(url) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.toLowerCase() !== "github.com") {
      return "";
    }

    return parsed.pathname.replace(/^\/+|\/+$/g, "");
  } catch {
    return "";
  }
}

const repoSlug = getRepositorySlug(repoUrl);
const releasesUrl = repoSlug ? `${repoUrl}/releases/latest` : "https://github.com/nishizumi-maho/iRefinedX/releases/latest";
const releasesApiUrl = repoSlug
  ? `https://api.github.com/repos/${repoSlug}/releases?per_page=10`
  : "https://api.github.com/repos/nishizumi-maho/iRefinedX/releases?per_page=10";

export default defineConfig({
  publicDir: false,
  define: {
    __IREF_VERSION__: JSON.stringify(packageJson.version),
    __IREF_DISPLAY_VERSION__: JSON.stringify(displayVersion),
    __IREF_RELEASE_CHANNEL__: JSON.stringify(releaseChannel),
    __IREF_REPO_URL__: JSON.stringify(repoUrl),
    __IREF_REPO_SLUG__: JSON.stringify(repoSlug),
    __IREF_RELEASES_URL__: JSON.stringify(releasesUrl),
    __IREF_RELEASES_API_URL__: JSON.stringify(releasesApiUrl),
  },
  plugins: [
    viteStaticCopy({
      targets: [
        { src: "public/manifest.json", dest: "." },
        { src: "public/icons/*", dest: "icons" },
        { src: "public/bridge.js", dest: "." },
      ],
    }),
  ],
  build: {
    emptyOutDir: true,
    sourcemap: true,
    assetsInlineLimit: 10 * 1024,
    lib: {
      entry: "src/main.js",
      formats: ["es"],
      fileName: () => "main.js",
      cssFileName: "extension",
    },
    rollupOptions: {
      output: {
        assetFileNames: "[name][extname]",
      },
    },
  },
});
