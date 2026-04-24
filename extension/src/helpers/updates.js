const CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000;

export const CURRENT_VERSION = __IREF_VERSION__;
export const CURRENT_DISPLAY_VERSION = __IREF_DISPLAY_VERSION__;
export const CURRENT_RELEASE_CHANNEL = __IREF_RELEASE_CHANNEL__;
export const REPO_URL = __IREF_REPO_URL__;
export const REPO_SLUG = __IREF_REPO_SLUG__;
export const RELEASES_URL = __IREF_RELEASES_URL__;
export const RELEASES_API_URL = __IREF_RELEASES_API_URL__;

function getCacheKey() {
  return `iref_release_info::${REPO_SLUG || "nishizumi-maho/iRefinedX"}`;
}

function normalizeVersion(value = "") {
  const numeric = String(value).match(/\d+(?:\.\d+)*/)?.[0];
  if (!numeric) {
    return [];
  }

  return numeric.split(".").map((part) => parseInt(part, 10) || 0);
}

function compareVersions(a, b) {
  const left = normalizeVersion(a);
  const right = normalizeVersion(b);
  const maxLength = Math.max(left.length, right.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftValue = left[index] || 0;
    const rightValue = right[index] || 0;

    if (leftValue > rightValue) {
      return 1;
    }

    if (leftValue < rightValue) {
      return -1;
    }
  }

  return 0;
}

function compareReleaseRecords(left = {}, right = {}) {
  const versionResult = compareVersions(
    right?.tag_name || right?.name || CURRENT_DISPLAY_VERSION,
    left?.tag_name || left?.name || CURRENT_DISPLAY_VERSION
  );

  if (versionResult !== 0) {
    return versionResult;
  }

  const leftTime = new Date(left?.published_at || left?.created_at || 0).getTime();
  const rightTime = new Date(right?.published_at || right?.created_at || 0).getTime();
  return rightTime - leftTime;
}

function getComparableLatestVersion(info = {}) {
  const candidate =
    info.latestTag ||
    info.latestVersion ||
    info.releaseName ||
    CURRENT_DISPLAY_VERSION;

  return normalizeVersion(candidate).length ? candidate : CURRENT_VERSION;
}

function getFallbackInfo(overrides = {}) {
  return {
    available: false,
    checkedAt: 0,
    currentVersion: CURRENT_VERSION,
    currentDisplayVersion: CURRENT_DISPLAY_VERSION,
    latestTag: CURRENT_DISPLAY_VERSION,
    latestVersion: CURRENT_VERSION,
    releaseUrl: RELEASES_URL,
    releaseName: CURRENT_DISPLAY_VERSION,
    ...overrides,
  };
}

function normalizeUpdateInfo(info = {}) {
  const latestTag =
    info.latestTag || info.latestVersion || info.releaseName || CURRENT_DISPLAY_VERSION;
  const latestVersion = getComparableLatestVersion({
    ...info,
    latestTag,
  });

  return {
    ...getFallbackInfo(),
    ...info,
    available: compareVersions(latestVersion, CURRENT_VERSION) > 0,
    currentVersion: CURRENT_VERSION,
    currentDisplayVersion: CURRENT_DISPLAY_VERSION,
    latestTag,
    latestVersion,
  };
}

function readCachedInfo() {
  try {
    const parsed = JSON.parse(localStorage.getItem(getCacheKey()));

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return normalizeUpdateInfo(parsed);
  } catch {
    return null;
  }
}

function writeCachedInfo(info) {
  localStorage.setItem(getCacheKey(), JSON.stringify(info));
  return info;
}

function publishUpdateInfo(info) {
  window.dispatchEvent(
    new CustomEvent("iref-update-info", {
      detail: info,
    })
  );

  return info;
}

function parseReleaseInfo(payload) {
  const releases = (Array.isArray(payload) ? payload : [payload]).filter(
    (entry) => entry && !entry.draft
  );
  const preferred =
    CURRENT_RELEASE_CHANNEL === "experimental"
      ? releases
      : releases.filter((entry) => !entry.prerelease);
  const release = (preferred.length ? preferred : releases).sort(compareReleaseRecords)[0];
  const latestTag = release?.tag_name || release?.name || CURRENT_DISPLAY_VERSION;
  const latestVersion = getComparableLatestVersion({
    latestTag,
    releaseName: release?.name || latestTag,
  });

  return normalizeUpdateInfo({
    checkedAt: Date.now(),
    latestTag,
    latestVersion,
    releaseName: release?.name || latestTag,
    releaseUrl: release?.html_url || RELEASES_URL,
    publishedAt: release?.published_at || null,
    prerelease: !!release?.prerelease,
  });
}

export function getCachedUpdateInfo() {
  return readCachedInfo() || getFallbackInfo();
}

export async function checkForUpdates({ force = false } = {}) {
  const cached = readCachedInfo();

  if (!force && cached && Date.now() - (cached.checkedAt || 0) < CACHE_MAX_AGE_MS) {
    return publishUpdateInfo(cached);
  }

  try {
    const response = await fetch(RELEASES_API_URL, {
      headers: {
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub release check failed (${response.status})`);
    }

    const payload = await response.json();
    const info = writeCachedInfo(parseReleaseInfo(payload));

    if (info.available) {
      console.info("[iRefinedX] Update available:", info.latestTag);
    }

    return publishUpdateInfo(info);
  } catch (error) {
    console.warn("[iRefinedX] Failed to check for updates", error);
    return publishUpdateInfo(
      cached ||
        getFallbackInfo({
          checkedAt: Date.now(),
          error: true,
        })
    );
  }
}

export function openLatestRelease() {
  window.open(RELEASES_URL, "_blank", "noopener,noreferrer");
}
