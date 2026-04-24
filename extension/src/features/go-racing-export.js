import features from "../feature-manager.js";
import { downloadJson, downloadJsonFolder } from "../helpers/download.js";
import { cloneJsonSafe } from "../helpers/json-safe.js";
import { findMemoizedProps } from "../helpers/react-resolver.js";
import { getSettings } from "../helpers/settings.js";
import { log } from "./logger.js";
import "./go-racing-export.css";

let persistInterval = 0;
let menuTrackingBound = false;
let activeStructuredSessionMenuContext = null;
const SESSION_MENU_CONTEXT_TTL_MS = 900000;

function normalizeText(text = "") {
  return text.replace(/\s+/g, " ").trim();
}

function getElementTop(el) {
  if (!el || typeof el.getBoundingClientRect !== "function") {
    return Number.POSITIVE_INFINITY;
  }

  return el.getBoundingClientRect().top;
}

function getLines(el) {
  return (el?.innerText || "")
    .split("\n")
    .map((line) => normalizeText(line))
    .filter(Boolean);
}

function slugify(text = "") {
  return normalizeText(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getStructuredSessionDomToken(props = {}) {
  const session = props.session || {};
  const rawToken =
    getStructuredSessionKey(props) ||
    session.session_name ||
    session.track_name ||
    session.track?.track_name ||
    "session";

  return slugify(String(rawToken)) || "session";
}

function isStructuredSessionProps(candidate = {}) {
  const session = candidate?.session;

  return (
    !!session &&
    (
      candidate.contentId !== null && candidate.contentId !== undefined ||
      session.season_id !== null && session.season_id !== undefined ||
      session.session_id ||
      session.private_session_id ||
      session.subsession_id ||
      session.guid
    ) &&
    (
      session.start_time ||
      session.launch_at ||
      session.session_name ||
      session.track_name ||
      session.track?.track_name
    )
  );
}

function isVisible(el) {
  return !!el && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
}

function findHeading(matcher) {
  return [...document.querySelectorAll("h1, h2, h3, h4, h5, h6")].find((el) =>
    matcher(normalizeText(el.textContent))
  );
}

function isTabContainer(node) {
  if (!node?.matches) {
    return false;
  }

  if (node.matches('[role="tab"], [role="tablist"], nav, button, a')) {
    return true;
  }

  const className =
    typeof node.className === "string"
      ? node.className
      : node.className?.baseVal || "";

  return /\btab(s|list)?\b/i.test(className);
}

function findClosest(el, matcher) {
  let node = el;

  while (node && node !== document.body) {
    if (matcher(node)) {
      return node;
    }
    node = node.parentElement;
  }

  return null;
}

function ensureActionRow(target, className = "iref-export-actions", rowId = null) {
  if (!target) {
    return null;
  }

  let row = rowId ? document.getElementById(rowId) : null;

  if (!row) {
    row = target.querySelector(`:scope > .${className}`);
  }

  if (row) {
    if (row.parentElement !== target) {
      target.appendChild(row);
    }
    return row;
  }

  row = document.createElement("div");
  if (rowId) {
    row.id = rowId;
  }
  row.className = className;
  target.appendChild(row);
  return row;
}

function ensurePrependedActionRow(
  target,
  className = "iref-export-actions",
  rowId = null
) {
  if (!target) {
    return null;
  }

  let row = rowId ? document.getElementById(rowId) : null;

  if (!row) {
    row = target.querySelector(`:scope > .${className}`);
  }

  if (row) {
    if (row.parentElement !== target) {
      target.insertBefore(row, target.firstChild);
    } else if (row !== target.firstElementChild) {
      target.insertBefore(row, target.firstChild);
    }

    return row;
  }

  row = document.createElement("div");
  if (rowId) {
    row.id = rowId;
  }
  row.className = className;
  target.insertBefore(row, target.firstChild);
  return row;
}

function ensureButton(target, id, label, onClick, className = "iref-export-btn") {
  if (!target) {
    return null;
  }

  let button = document.getElementById(id);

  if (button) {
    button.className = className;
    if (button.textContent !== label) {
      button.textContent = label;
    }
    if (button.parentElement !== target) {
      target.appendChild(button);
    }
    return button;
  }

  button = document.createElement("button");
  button.type = "button";
  button.id = id;
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", onClick);
  target.appendChild(button);
  return button;
}

function getStructuredSessionKey(props = {}) {
  const session = props.session || {};

  return (
    session.session_id ||
    session.private_session_id ||
    session.subsession_id ||
    session.guid ||
    [
      props.contentId ?? session.season_id ?? "",
      session.session_name || "",
      session.start_time || session.launch_at || "",
      session.track_name || session.track?.track_name || "",
    ].join("|")
  );
}

function findPageHeading(
  labels = [],
  { allowFallback = true, avoidTabContainers = false } = {}
) {
  const normalizedLabels = labels.map((label) => normalizeText(label)).filter(Boolean);
  const headings = [...document.querySelectorAll("h1, h2, h3, h4")].filter((el) => {
    if (!avoidTabContainers) {
      return true;
    }

    return !findClosest(el, isTabContainer);
  });
  const matchedHeadings = headings
    .filter((el) => {
      const text = normalizeText(el.textContent);
      return normalizedLabels.includes(text);
    })
    .sort((left, right) => getElementTop(left) - getElementTop(right));

  return (
    matchedHeadings[0] ||
    (allowFallback
      ? [...headings].sort((left, right) => getElementTop(left) - getElementTop(right))[0] ||
        null
      : null)
  );
}

function getSeriesTitle() {
  return normalizeText(document.querySelector("h2")?.textContent || "series");
}

function getNextRaceSummary() {
  const heading = findHeading((text) => text.startsWith("Next Race @"));
  if (!heading) {
    return null;
  }

  const section = findClosest(heading, (node) => {
    const text = normalizeText(node.innerText || "");
    return text.includes("View in iRacing") && text.includes("Open");
  });

  if (!section) {
    return {
      heading: normalizeText(heading.textContent),
      track: normalizeText(heading.textContent.replace(/^Next Race @\s*/, "")),
    };
  }

  const lines = getLines(section);

  return {
    heading: normalizeText(heading.textContent),
    track: normalizeText(heading.textContent.replace(/^Next Race @\s*/, "")),
    countdown: lines[2] || null,
    status: lines[3] || null,
    duration: lines.find((line) => line.startsWith("Race Duration")) || null,
    drivers: lines.find((line) => line.startsWith("Drivers")) || null,
    lastRace: lines.find((line) => line.startsWith("Last Race")) || null,
    upNext: lines.find((line) => line.startsWith("Up Next")) || null,
    rawLines: lines,
  };
}

function findWeatherCard() {
  const chanceEl = [...document.querySelectorAll("p, span, div")].find((el) =>
    /Chance$/.test(normalizeText(el.textContent))
  );

  if (!chanceEl) {
    return null;
  }

  return findClosest(chanceEl, (node) => {
    const text = normalizeText(node.innerText || "");
    return /Chance/.test(text) && /mph/.test(text) && /°/.test(text);
  });
}

function extractWeatherData() {
  const weatherCard = findWeatherCard();
  if (!weatherCard) {
    return null;
  }

  const lines = getLines(weatherCard);
  const headingLine = lines.find((line) => /\(.+\)$/.test(line)) || null;
  const humidityLine = lines.find((line) => /^\d+%\s*-\s*\d+%$/.test(line)) || null;
  const windLine = lines.find((line) => /mph$/i.test(line)) || null;
  const temperatureLine =
    lines.find((line) => /-?\d+°\s*\/\s*-?\d+°/.test(line)) || null;
  const chanceLine = lines.find((line) => /Chance$/.test(line)) || null;
  const conditionLine =
    lines.find(
      (line) =>
        line !== headingLine &&
        line !== humidityLine &&
        line !== windLine &&
        line !== temperatureLine &&
        line !== chanceLine
    ) || null;

  const headingMatch = headingLine?.match(/^(.+?)\s*-\s*(.+?)\s*\((.+)\)$/);
  const humidityMatch = humidityLine?.match(/^(\d+)%\s*-\s*(\d+)%$/);
  const windMatch = windLine?.match(/^(\d+)\s*-\s*(\d+)\s*mph$/i);
  const temperatureMatch = temperatureLine?.match(/^(-?\d+)°\s*\/\s*(-?\d+)°$/);
  const chanceMatch = chanceLine?.match(/^(\d+)%\s+Chance$/);

  return {
    exportType: "irefined-official-weather",
    exportedAt: new Date().toISOString(),
    url: location.href,
    seriesTitle: getSeriesTitle(),
    nextRace: getNextRaceSummary(),
    weather: {
      heading: headingLine,
      timeOfDay: headingMatch?.[1] || null,
      sessionTime: headingMatch?.[2] || null,
      skyMultiplier: headingMatch?.[3] || null,
      conditions: conditionLine,
      humidityMin: humidityMatch ? parseInt(humidityMatch[1], 10) : null,
      humidityMax: humidityMatch ? parseInt(humidityMatch[2], 10) : null,
      humidityText: humidityLine,
      windMinMph: windMatch ? parseInt(windMatch[1], 10) : null,
      windMaxMph: windMatch ? parseInt(windMatch[2], 10) : null,
      windText: windLine,
      temperatureHighF: temperatureMatch ? parseInt(temperatureMatch[1], 10) : null,
      temperatureLowF: temperatureMatch ? parseInt(temperatureMatch[2], 10) : null,
      temperatureText: temperatureLine,
      precipitationChancePercent: chanceMatch ? parseInt(chanceMatch[1], 10) : null,
      precipitationText: chanceLine,
      rawLines: lines,
    },
  };
}

function removeWeatherControls() {
  document.getElementById("iref-weather-export-actions")?.remove();
  document.querySelectorAll('[id^="iref-inline-weather-"]').forEach((button) => {
    button.remove();
  });
}

function removeSessionExportControls() {
  [
    "iref-official-sessions-export-actions",
    "iref-hosted-sessions-export-actions",
    "iref-league-sessions-export-actions",
  ].forEach((id) => {
    document.getElementById(id)?.remove();
  });

  document
    .querySelectorAll(
      ".iref-inline-export-actions, [id^='iref-inline-export-'], .iref-menu-export-slot, [id^='iref-menu-export-'], .iref-detail-export-slot, [id^='iref-detail-export-']"
    )
    .forEach((element) => {
      element.remove();
    });
}

function getSessionsSection() {
  const heading = findHeading((text) => text === "Available Sessions");
  if (!heading) {
    return null;
  }

  return findClosest(heading, (node) => !!node.querySelector("table"));
}

function getOfficialSessionButtons() {
  const section = getSessionsSection();

  if (!section) {
    return [];
  }

  return [...section.querySelectorAll("button")].filter((button) =>
    /View in iRacing/i.test(normalizeText(button.innerText)) && isVisible(button)
  );
}

function getOfficialCurrentSessionRoot() {
  const weatherCard = findWeatherCard();
  const nextRaceHeading = findHeading((text) => text.startsWith("Next Race @"));
  const seeds = [weatherCard, nextRaceHeading].filter(Boolean);

  for (const seed of seeds) {
    const section = findClosest(seed, (node) => {
      if (!node?.querySelectorAll || node === seed) {
        return false;
      }

      const text = normalizeText(node.innerText || "");
      const hasRaceMeta =
        /Race Duration/i.test(text) ||
        /Drivers/i.test(text) ||
        /Last Race/i.test(text) ||
        /Up Next/i.test(text);
      const hasEntryPoint = /(Register|More ways to race|Queue|Open Now)/i.test(text);

      return hasRaceMeta && hasEntryPoint;
    });

    if (section) {
      return section;
    }
  }

  return weatherCard?.parentElement || nextRaceHeading?.parentElement || null;
}

function extractOfficialCurrentSessionData() {
  const weatherCard = findWeatherCard();
  const detailRoot = getOfficialCurrentSessionRoot();
  const props =
    findStructuredSessionPropsInScope(detailRoot) ||
    getStructuredSessionPropsNearElement(weatherCard) ||
    getStructuredSessionPropsNearElement(detailRoot) ||
    getStructuredSessionEntries(detailRoot || document)[0]?.props ||
    null;

  if (!props?.session) {
    return null;
  }

  return buildSessionExportPayload(props, "irefined-official-session");
}

function extractOfficialSessionData() {
  const currentSessionData = extractOfficialCurrentSessionData();

  if (currentSessionData) {
    return currentSessionData;
  }

  const buttons = getOfficialSessionButtons();
  const entries = getStructuredButtonEntries(buttons);
  const props = entries[0]?.props;

  if (!props?.session) {
    return null;
  }

  return buildSessionExportPayload(props, "irefined-official-session");
}

function extractOfficialSessionsData() {
  const section = getSessionsSection();
  const table = section?.querySelector("table");

  if (!table) {
    return null;
  }

  const categoryHeading = [...section.querySelectorAll("h2, h3, h4")].find(
    (el) => normalizeText(el.textContent) === "Races"
  );
  const metaLines = getLines(categoryHeading?.parentElement);
  const rows = [...table.querySelectorAll("tbody tr")].map((row) => {
    const cells = [...row.querySelectorAll("td")];
    const cellLines = cells.map((cell) => getLines(cell));

    return {
      startTime: cellLines[0]?.[0] || null,
      relativeStart: cellLines[0]?.[1] || null,
      track: cellLines[1]?.[0] || null,
      layout: cellLines[1]?.[1] || null,
      duration: cellLines[2]?.[0] || null,
      entries: cellLines[3]?.[0] && cellLines[3][0] !== "-" ? cellLines[3][0] : null,
      friends: cellLines[4]?.[0] && cellLines[4][0] !== "-" ? cellLines[4][0] : null,
      watched: cellLines[5]?.[0] && cellLines[5][0] !== "-" ? cellLines[5][0] : null,
      action: cells[cells.length - 1]?.querySelector("button")?.innerText.trim() || null,
      rawCells: cellLines,
    };
  });

  return {
    exportType: "irefined-official-sessions",
    exportedAt: new Date().toISOString(),
    url: location.href,
    seriesTitle: getSeriesTitle(),
    nextRace: getNextRaceSummary(),
    category: normalizeText(categoryHeading?.textContent || "Sessions"),
    meta: {
      sessionCount: metaLines.find((line) => /Sessions$/.test(line)) || null,
      cadence: metaLines.find((line) => /^Every /.test(line)) || null,
    },
    rows,
  };
}

function toIsoTimestamp(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return new Date(value).toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

function stripSessionForExport(session = {}) {
  const exportedSession = cloneJsonSafe(session, {}) || {};

  [
    "admins",
    "count_by_car_class_id",
    "count_by_car_id",
    "elig",
    "eligibility",
    "end_time",
    "entry_count",
    "farm",
    "friends",
    "guid",
    "host",
    "host_name",
    "image",
    "league_name",
    "order_id",
    "owner",
    "pending",
    "populated",
    "preregistration_count",
    "private_session_id",
    "reg_open",
    "search_filters",
    "sess_admin",
    "session_full",
    "session_id",
    "small_logo",
    "subsession_id",
    "track_content",
    "track_name",
    "watched",
  ].forEach((key) => {
    delete exportedSession[key];
  });

  return exportedSession;
}

function collectStructuredProps(buttons) {
  const sessions = new Map();

  buttons.forEach((button) => {
    const props = findMemoizedProps(button, isStructuredSessionProps);

    if (!props?.session) {
      return;
    }

    const key = getStructuredSessionKey(props);

    if (!key || sessions.has(key)) {
      return;
    }

    sessions.set(key, props);
  });

  return [...sessions.values()];
}

function summarizeStructuredSession(props = {}) {
  const session = props.session || {};

  return {
    contentId: props.contentId ?? null,
    sessionId: session.session_id ?? null,
    privateSessionId: session.private_session_id ?? null,
    subsessionId: session.subsession_id ?? null,
    sessionName: session.session_name ?? null,
    leagueId: session.league_id ?? null,
    leagueName: session.league_name ?? null,
    leagueSeasonId: session.league_season_id ?? null,
    sessionType: session.session_type ?? null,
    category: session.category ?? null,
    status: session.status ?? null,
    fixedSetup: session.fixed_setup ?? null,
    entryCount: session.entry_count ?? null,
    maxDrivers: session.max_drivers ?? null,
    maxUsers: session.max_users ?? null,
    teamEntryCount: session.team_entry_count ?? null,
    hostName: session.host_name || session.host?.display_name || null,
    farm: session.farm_display_name || session.farm?.display_name || null,
    trackName: session.track_name || session.track?.track_name || null,
    trackConfig: session.track?.config_name || null,
    trackId: session.track?.track_id || null,
    launchAt: toIsoTimestamp(session.launch_at),
    openRegExpires: toIsoTimestamp(session.open_reg_expires),
    predictedOpenRegExpires: toIsoTimestamp(session.predicted_open_reg_expires),
    endTime: toIsoTimestamp(session.end_time),
    carNameString: session.car_name_string || null,
    carNameStringAbbreviated: session.car_name_string_abbreviated || null,
    cars: (session.cars || []).map((car) => ({
      carId: car.car_id,
      carName: car.car_name,
      carClassId: car.car_class_id,
      carClassName: car.car_class_name,
    })),
    durations: {
      practiceLength: session.practice_length ?? null,
      qualifyLength: session.qualify_length ?? null,
      qualifyLaps: session.qualify_laps ?? null,
      warmupLength: session.warmup_length ?? null,
      raceLength: session.race_length ?? null,
      raceLaps: session.race_laps ?? null,
      timeLimit: session.time_limit ?? null,
    },
    weather: session.weather ? cloneJsonSafe(session.weather) : null,
    trackState: session.track_state ? cloneJsonSafe(session.track_state) : null,
  };
}

function buildSessionExportPayload(props = {}, exportType = "irefined-session") {
  const session = props.session || {};

  return {
    exportType,
    exportedAt: new Date().toISOString(),
    url: location.href,
    summary: summarizeStructuredSession(props),
    session: stripSessionForExport(session),
    weather: session.weather ? cloneJsonSafe(session.weather) : null,
  };
}

function formatExportStamp(value) {
  const isoValue = toIsoTimestamp(value);

  if (!isoValue) {
    return "";
  }

  return isoValue.replace(/[:.]/g, "-");
}

function ensureUniqueFilename(filename, usedNames) {
  let nextFilename = filename;
  let suffix = 2;

  while (usedNames.has(nextFilename)) {
    nextFilename = filename.replace(/\.json$/i, `-${suffix}.json`);
    suffix += 1;
  }

  usedNames.add(nextFilename);
  return nextFilename;
}

function buildSessionExportFilename(props = {}, index = 0) {
  const session = props.session || {};
  const stamp = formatExportStamp(
    session.launch_at ||
      session.start_time ||
      session.open_reg_expires ||
      session.predicted_open_reg_expires
  );
  const nameSlug = slugify(
    session.session_name || session.track_name || session.track?.track_name || "session"
  );
  const identity =
    session.private_session_id ||
    session.session_id ||
    session.subsession_id ||
    session.guid ||
    index + 1;

  return `${stamp ? `${stamp}-` : ""}${nameSlug || "session"}-${identity}.json`;
}

function buildSessionExportFiles(entries, exportType) {
  const usedNames = new Set();

  return entries.map(({ props }, index) => {
    const filename = ensureUniqueFilename(
      buildSessionExportFilename(props, index),
      usedNames
    );

    return {
      filename,
      data: buildSessionExportPayload(props, exportType),
    };
  });
}

function getHostedSessionButtons() {
  return [...document.querySelectorAll("button")].filter((button) =>
    /View in iRacing/i.test(normalizeText(button.innerText)) && isVisible(button)
  );
}

function getLeagueSessionButtons() {
  return [...document.querySelectorAll("button")].filter((button) =>
    /View in iRacing|Add to Cart/i.test(normalizeText(button.innerText)) &&
    isVisible(button)
  );
}

function getStructuredButtonEntries(buttons) {
  const seen = new Set();
  const entries = [];

  buttons.forEach((button) => {
    const props = findMemoizedProps(button, isStructuredSessionProps);

    if (!props?.session) {
      return;
    }

    const key = getStructuredSessionKey(props);

    if (!key || seen.has(key)) {
      return;
    }

    seen.add(key);
    entries.push({
      button,
      element:
        button.closest(
          "tr, [role='row'], article, li, [class*='card'], [class*='Card']"
        ) || button,
      props,
    });
  });

  return entries;
}

function getStructuredActionContainer(element) {
  if (!element) {
    return null;
  }

  if (element.matches?.("tr, [role='row']")) {
    return (
      element.querySelector("td:last-child, [role='cell']:last-child") ||
      element.lastElementChild ||
      element
    );
  }

  if (element.matches?.("button, a")) {
    return element.parentElement || element;
  }

  const structuralTarget = element.querySelector(
    '.btn-group, [class*="footer"], [class*="Footer"], [class*="action"], [class*="Action"]'
  );

  if (structuralTarget) {
    return structuralTarget;
  }

  const visibleAction = [...element.querySelectorAll("button, a")].find((candidate) =>
    isVisible(candidate)
  );

  if (visibleAction) {
    return visibleAction.parentElement || visibleAction;
  }

  return element;
}

function getStructuredSessionPropsNearElement(element) {
  if (!element) {
    return null;
  }

  const seen = new Set();
  let node = element;

  while (node && node !== document.body) {
    if (!seen.has(node)) {
      seen.add(node);
      const props = findMemoizedProps(node, isStructuredSessionProps);

      if (props?.session) {
        return props;
      }
    }

    node = node.parentElement;
  }

  const scope =
    element.closest?.(
      "tr, [role='row'], article, li, [class*='card'], [class*='Card']"
    ) ||
    element.parentElement;

  if (!scope?.querySelectorAll) {
    return null;
  }

  for (const candidate of scope.querySelectorAll(
    "button, a, [role='button'], [role='row'], article, li, [class*='card'], [class*='Card']"
  )) {
    if (seen.has(candidate)) {
      continue;
    }

    const props = findMemoizedProps(candidate, isStructuredSessionProps);

    if (props?.session) {
      return props;
    }
  }

  return null;
}

function findStructuredSessionPropsInScope(scope, maxCandidates = 450) {
  if (!scope) {
    return null;
  }

  const candidates = [];
  const seen = new Set();

  const pushCandidate = (candidate) => {
    if (
      !candidate ||
      seen.has(candidate) ||
      candidate.nodeType !== Node.ELEMENT_NODE
    ) {
      return;
    }

    seen.add(candidate);
    candidates.push(candidate);
  };

  pushCandidate(scope);

  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_ELEMENT);

  while (walker.nextNode() && candidates.length < maxCandidates) {
    pushCandidate(walker.currentNode);
  }

  for (const candidate of candidates) {
    const props = findMemoizedProps(candidate, isStructuredSessionProps, 40);

    if (props?.session) {
      return props;
    }
  }

  return null;
}

function getEventTargetElement(event) {
  const target = event?.target;

  if (!target) {
    return null;
  }

  if (target.nodeType === Node.ELEMENT_NODE) {
    return target;
  }

  return target.parentElement || null;
}

function rememberStructuredSessionMenuContext(event) {
  if (
    !location.pathname.includes("/hosted") &&
    !location.pathname.includes("/leagues")
  ) {
    return;
  }

  const targetElement = getEventTargetElement(event);
  const trigger =
    targetElement?.closest?.(
      "button, a, [role='button'], tr, [role='row'], article, li, [class*='card'], [class*='Card']"
    ) || targetElement;

  if (!trigger || trigger.closest(".iref-menu-export-slot, .iref-detail-export-slot")) {
    return;
  }

  const props = getStructuredSessionPropsNearElement(trigger);

  if (!props?.session) {
    return;
  }

  const triggerRect = trigger.getBoundingClientRect();

  activeStructuredSessionMenuContext = {
    props,
    sessionKey: getStructuredSessionDomToken(props),
    triggerRect: {
      top: triggerRect.top,
      right: triggerRect.right,
      bottom: triggerRect.bottom,
      left: triggerRect.left,
      width: triggerRect.width,
      height: triggerRect.height,
    },
    seenAt: Date.now(),
  };
}

function ensureStructuredSessionMenuTracking() {
  if (menuTrackingBound) {
    return;
  }

  document.addEventListener("click", rememberStructuredSessionMenuContext, true);
  menuTrackingBound = true;
}

function teardownStructuredSessionMenuTracking() {
  if (!menuTrackingBound) {
    return;
  }

  document.removeEventListener("click", rememberStructuredSessionMenuContext, true);
  menuTrackingBound = false;
  activeStructuredSessionMenuContext = null;
}

function getVisibleSessionMenuCandidates() {
  const selectors = [
    '[role="menu"]',
    '[role="listbox"]',
    '[data-popper-placement]',
    '[data-placement]',
    '[class*="menu"]',
    '[class*="Menu"]',
    '[class*="popover"]',
    '[class*="Popover"]',
    '[class*="dropdown"]',
    '[class*="Dropdown"]',
  ];
  const seen = new Set();
  const candidates = [];

  for (const candidate of document.querySelectorAll(selectors.join(", "))) {
    if (seen.has(candidate) || !isVisible(candidate)) {
      continue;
    }

    seen.add(candidate);

    if (
      candidate.closest("#iref-settings-overlay") ||
      candidate.closest(".iref-export-actions") ||
      candidate.closest(".iref-inline-export-actions")
    ) {
      continue;
    }

    const rect = candidate.getBoundingClientRect();

    if (
      rect.width < 120 ||
      rect.height < 40 ||
      rect.width > Math.min(window.innerWidth * 0.92, 560) ||
      rect.height > window.innerHeight * 0.9
    ) {
      continue;
    }

    const style = window.getComputedStyle(candidate);
    const isLayered =
      ["absolute", "fixed", "sticky"].includes(style.position) ||
      Number.parseInt(style.zIndex || "0", 10) > 9 ||
      candidate.hasAttribute("data-popper-placement") ||
      candidate.hasAttribute("data-placement");

    if (!isLayered) {
      continue;
    }

    candidates.push(candidate);
  }

  return candidates;
}

function scoreSessionMenuCandidate(candidate, context) {
  if (!candidate || !context?.triggerRect) {
    return Number.NEGATIVE_INFINITY;
  }

  const rect = candidate.getBoundingClientRect();
  const className =
    typeof candidate.className === "string"
      ? candidate.className
      : candidate.className?.baseVal || "";
  const text = normalizeText(candidate.innerText || "");
  const buttonCount = candidate.querySelectorAll(
    "button, a, [role='menuitem']"
  ).length;
  const hasMenuSemantics =
    candidate.getAttribute("role") === "menu" ||
    !!candidate.querySelector("[role='menuitem']");
  const triggerRect = context.triggerRect;
  const dx = Math.max(triggerRect.left - rect.right, rect.left - triggerRect.right, 0);
  const dy = Math.max(triggerRect.top - rect.bottom, rect.top - triggerRect.bottom, 0);
  const distance = Math.hypot(dx, dy);
  const overlapsTriggerBand =
    rect.right >= triggerRect.left - 24 && rect.left <= triggerRect.right + 24;

  let score = 0;

  if (hasMenuSemantics) {
    score += 18;
  }

  if (/menu|popover|dropdown/i.test(className)) {
    score += 12;
  }

  if (/register|add to cart|locked|withdraw|join|watch|view/i.test(text)) {
    score += 8;
  }

  score += Math.min(buttonCount, 6);
  score += Math.max(0, 28 - distance / 12);

  if (overlapsTriggerBand) {
    score += 8;
  }

  if (candidate.querySelector(".iref-menu-export-slot")) {
    score += 24;
  }

  return score;
}

function getStructuredSessionMenuContainer() {
  if (
    !activeStructuredSessionMenuContext ||
    Date.now() - activeStructuredSessionMenuContext.seenAt > SESSION_MENU_CONTEXT_TTL_MS
  ) {
    activeStructuredSessionMenuContext = null;
    return null;
  }

  const candidates = getVisibleSessionMenuCandidates();
  let bestCandidate = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const score = scoreSessionMenuCandidate(
      candidate,
      activeStructuredSessionMenuContext
    );

    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }
  }

  return bestScore >= 18 ? bestCandidate : null;
}

function ensureMenuExportSlot(target, slotId) {
  if (!target) {
    return null;
  }

  let slot = document.getElementById(slotId);

  if (slot) {
    if (slot.parentElement !== target) {
      target.appendChild(slot);
    }
    return slot;
  }

  slot = document.createElement(target.matches("ul, ol, menu") ? "li" : "div");
  slot.id = slotId;
  slot.className = "iref-menu-export-slot";

  if (target.getAttribute("role") === "menu") {
    slot.setAttribute("role", "none");
  }

  target.appendChild(slot);
  return slot;
}

function getActiveStructuredSessionContext() {
  if (
    !activeStructuredSessionMenuContext ||
    Date.now() - activeStructuredSessionMenuContext.seenAt > SESSION_MENU_CONTEXT_TTL_MS
  ) {
    activeStructuredSessionMenuContext = null;
    return null;
  }

  return activeStructuredSessionMenuContext;
}

function getHostedLeagueDetailWeatherLabel(root = document) {
  return [...root.querySelectorAll("h1, h2, h3, h4, h5, h6, p, span, div, strong")].find(
    (element) => {
      if (!isVisible(element)) {
        return false;
      }

      const text = normalizeText(element.textContent);
      return text === "Static Weather" || text === "Realistic Weather";
    }
  );
}

function getHostedLeagueDetailWeatherCard() {
  const label = getHostedLeagueDetailWeatherLabel();

  if (!label) {
    return null;
  }

  const card = findClosest(label, (node) => {
    if (!node?.querySelectorAll || node === label) {
      return false;
    }

    const text = normalizeText(node.innerText || "");

    if (!/(Static Weather|Realistic Weather)/i.test(text)) {
      return false;
    }

    const hasWeatherMeta =
      /Humidity/i.test(text) ||
      /Wind/i.test(text) ||
      /Track Moisture/i.test(text) ||
      /Cloud Cover/i.test(text);
    const hasTemperature = /°\s*[FC]/i.test(text);

    return hasWeatherMeta && hasTemperature;
  });

  if (!card) {
    return null;
  }

  return {
    card,
    label,
  };
}

function getHostedLeagueDetailRoot(seed) {
  if (!seed) {
    return null;
  }

  return findClosest(seed, (node) => {
    if (!node?.querySelectorAll || node === seed) {
      return false;
    }

    const text = normalizeText(node.innerText || "");

    return (
      /(Static Weather|Realistic Weather)/i.test(text) &&
      /Session Details/i.test(text) &&
      /Entries/i.test(text)
    );
  });
}

function getStructuredSessionDetailContext(detailRoot) {
  const activeContext = getActiveStructuredSessionContext();

  if (activeContext?.props?.session) {
    return activeContext;
  }

  const detailScope = getHostedLeagueDetailRoot(detailRoot) || detailRoot;
  const derivedProps =
    findStructuredSessionPropsInScope(detailScope) ||
    getStructuredSessionPropsNearElement(detailScope) ||
    getStructuredSessionEntries(detailScope)[0]?.props ||
    null;

  if (!derivedProps?.session) {
    return null;
  }

  return {
    props: derivedProps,
    sessionKey: getStructuredSessionDomToken(derivedProps),
    seenAt: Date.now(),
  };
}

function ensureDetailExportSlot(
  anchor,
  slotId,
  className = "iref-detail-export-slot"
) {
  if (!anchor?.parentElement) {
    return null;
  }

  let slot = document.getElementById(slotId);

  if (!slot) {
    slot = document.createElement("div");
    slot.id = slotId;
  }

  slot.className = className;

  document.querySelectorAll(".iref-detail-export-slot").forEach((candidate) => {
    if (candidate !== slot) {
      candidate.remove();
    }
  });

  const target = anchor.parentElement;

  if (slot.parentElement !== target || anchor.nextElementSibling !== slot) {
    target.insertBefore(slot, anchor.nextSibling);
  }

  return slot;
}

function getStructuredSessionEntries(root = document) {
  const seen = new Set();
  const selectors = [
    "button",
    "a",
    "tr",
    '[role="row"]',
    "article",
    "li",
    '[class*="card"]',
    '[class*="Card"]',
  ];

  return [...root.querySelectorAll(selectors.join(", "))]
    .filter((element) => isVisible(element))
    .map((element) => ({
      element,
      props: findMemoizedProps(element, isStructuredSessionProps),
    }))
    .filter(({ props }) => !!props?.session)
    .filter(({ props }) => {
      const key = getStructuredSessionKey(props);

      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

function removeHostedLeagueAggregateExportControls() {
  document.getElementById("iref-hosted-sessions-export-actions")?.remove();
  document.getElementById("iref-league-sessions-export-actions")?.remove();
}

function getHostedSessionEntries() {
  return getStructuredSessionEntries(document);
}

function mergeStructuredEntries(...entryGroups) {
  const seen = new Set();
  const mergedEntries = [];

  entryGroups.flat().forEach((entry) => {
    if (!entry?.props?.session) {
      return;
    }

    const key = getStructuredSessionKey(entry.props);

    if (!key || seen.has(key)) {
      return;
    }

    seen.add(key);
    mergedEntries.push(entry);
  });

  return mergedEntries;
}

function getLeagueSessionEntries() {
  return mergeStructuredEntries(
    getStructuredButtonEntries(getLeagueSessionButtons()),
    getStructuredSessionEntries(document)
  );
}

function getEntriesCollectionTarget(entries = []) {
  const firstEntry = entries[0]?.element;

  if (!firstEntry) {
    return null;
  }

  return findClosest(firstEntry, (node) => {
    if (!node?.querySelectorAll) {
      return false;
    }

    const ownedEntries = entries.filter(
      ({ element }) => element && (node === element || node.contains(element))
    ).length;

    if (ownedEntries < Math.min(entries.length, 2)) {
      return false;
    }

    return (
      node.querySelectorAll(
        "article, li, tr, [role='row'], [class*='grid'], [class*='Grid'], [class*='list'], [class*='List'], [class*='card'], [class*='Card']"
      ).length >= Math.min(ownedEntries, 2)
    );
  });
}

function injectStructuredDetailExportButton() {
  const weatherCard = getHostedLeagueDetailWeatherCard();

  if (!weatherCard) {
    return;
  }

  const context = getStructuredSessionDetailContext(weatherCard.card);

  if (!context?.props?.session) {
    return;
  }

  const session = context.props.session || {};
  const trackName = session.track_name || session.track?.track_name || "session";
  const slot = ensureDetailExportSlot(
    weatherCard.card,
    `iref-detail-export-${context.sessionKey}`
  );

  ensureButton(
    slot,
    `iref-detail-session-${context.sessionKey}`,
    "Export Session JSON",
    async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const data = buildSessionExportPayload(context.props, "irefined-session");
      const filename = `${slugify(session.session_name || trackName)}-session.json`;
      const result = await downloadJson(filename, data);

      if (result?.saved) {
        log(`Downloaded ${filename}`);
      }
    },
    "iref-export-btn iref-detail-export-btn"
  );
}

function extractStructuredSessionsData(entries, exportType, title) {
  const sessions = entries.map(({ props }) =>
    buildSessionExportPayload(props, exportType)
  );

  if (sessions.length < 1) {
    return null;
  }

  return {
    exportType,
    exportedAt: new Date().toISOString(),
    url: location.href,
    title,
    sessionCount: sessions.length,
    sessions,
  };
}

function injectWeatherButton() {
  const weatherCard = findWeatherCard();
  if (!weatherCard) {
    return;
  }

  const actionRow = ensureActionRow(
    weatherCard,
    "iref-export-actions",
    "iref-weather-export-actions"
  );

  ensureButton(actionRow, "iref-export-weather", "Export Weather JSON", async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const data = extractWeatherData();

    if (!data) {
      log("Weather export unavailable on this page");
      return;
    }

    const filename = `${slugify(data.seriesTitle)}-weather.json`;
    const result = await downloadJson(filename, data);

    if (result?.saved) {
      log(`Downloaded ${filename}`);
    }
  });
}

function injectOfficialSessionsButton() {
  const section = getSessionsSection();
  const header = section?.querySelector("h2, h3, h4")?.parentElement;
  const weatherCard = findWeatherCard();

  if (!header && !weatherCard) {
    return;
  }

  const actionRow = weatherCard
    ? ensureDetailExportSlot(
        weatherCard,
        "iref-official-sessions-export-actions",
        "iref-detail-export-slot iref-official-detail-export-slot"
      )
    : ensureActionRow(
        header,
        "iref-export-actions",
        "iref-official-sessions-export-actions"
      );

  ensureButton(
    actionRow,
    "iref-export-sessions",
    "Export Session JSON",
    async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const data = extractOfficialSessionData();

      if (!data) {
        log("Session export unavailable on this page");
        return;
      }

      const filename = `${slugify(
        data.summary?.sessionName || data.summary?.trackName || getSeriesTitle()
      )}-session.json`;
      const result = await downloadJson(filename, data);

      if (result?.saved) {
        log(`Downloaded ${filename}`);
      }
    },
    weatherCard
      ? "iref-export-btn iref-detail-export-btn iref-official-detail-export-btn"
      : "iref-export-btn"
  );
}

function injectHostedSessionsButton() {
  const heading = findPageHeading(
    ["Hosted Racing", "Browse Sessions", "My Sessions"],
    {
      avoidTabContainers: true,
    }
  );

  if (!heading) {
    return;
  }

  const actionRow = ensureActionRow(
    heading.parentElement?.parentElement || heading.parentElement,
    "iref-export-actions",
    "iref-hosted-sessions-export-actions"
  );

  ensureButton(
    actionRow,
    "iref-export-hosted-sessions",
    "Export Hosted Sessions JSON",
    async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const entries = getHostedSessionEntries();
      const files = buildSessionExportFiles(entries, "irefined-hosted-session");

      if (files.length < 1) {
        log("Hosted session export unavailable on this page");
        return;
      }

      const result = await downloadJsonFolder(
        "hosted-sessions",
        files
      );

      if (result?.saved) {
        log(`Exported ${files.length} hosted session JSON files`);
      }
    }
  );
}

function injectLeagueSessionsButton() {
  const entries = getLeagueSessionEntries();
  const collectionTarget = getEntriesCollectionTarget(entries);
  const heading = findPageHeading(["League Sessions", "Leagues"], {
    allowFallback: false,
    avoidTabContainers: true,
  });
  const mountTarget =
    collectionTarget || heading?.parentElement?.parentElement || heading?.parentElement;

  if (!mountTarget) {
    return;
  }

  const actionRow = ensurePrependedActionRow(
    mountTarget,
    "iref-export-actions",
    "iref-league-sessions-export-actions"
  );

  ensureButton(
    actionRow,
    "iref-export-league-sessions",
    "Export League Sessions JSON",
    async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const files = buildSessionExportFiles(entries, "irefined-league-session");

      if (files.length < 1) {
        log("League session export unavailable on this page");
        return;
      }

      const result = await downloadJsonFolder(
        "league-sessions",
        files
      );

      if (result?.saved) {
        log(`Exported ${files.length} league session JSON files`);
      }
    }
  );
}

async function init(activate = true) {
  clearInterval(persistInterval);

  if (!activate) {
    teardownStructuredSessionMenuTracking();
    removeSessionExportControls();
    return;
  }

  ensureStructuredSessionMenuTracking();

  persistInterval = setInterval(() => {
    removeWeatherControls();
    removeHostedLeagueAggregateExportControls();

    const settings = getSettings();

    if (settings["hide-go-racing-json-export-buttons"]) {
      removeSessionExportControls();
      return;
    }

    if (location.pathname.includes("/go-racing")) {
      injectOfficialSessionsButton();
    }

    if (
      location.pathname.includes("/hosted") ||
      location.pathname.includes("/leagues")
    ) {
      injectStructuredDetailExportButton();
    }
  }, 500);
}

const id = "go-racing-export";
const bodyClass = "iref-" + id;
const selector = "body";

features.add(id, true, selector, bodyClass, init);
