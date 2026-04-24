import { io } from "socket.io-client";
import { log } from "../features/logger.js";

const socketEnsureCooldownMs = 5000;
const socketInitStallMs = 15000;
const socketKeepAliveIntervalMs = 5000;

function getSentryRelease() {
  return typeof SENTRY_RELEASE !== "undefined" ? SENTRY_RELEASE : null;
}

let wsInitCheck = setInterval(() => {
  if (getSentryRelease()) {
    clearInterval(wsInitCheck);
    initWS();
  }
}, 1000);

let clientSocket;
let authSocket;
let initialized = false;
let callbacks = [];
let lastSocketActivityAt = 0;
let lastSocketInitAt = 0;
let lastSocketEnsureAt = 0;
let keepAliveIntervalId = 0;
let lifecycleHandlersBound = false;

function updateDebugState(patch = {}) {
  if (typeof window === "undefined") {
    return;
  }

  const previousState =
    window.__irefinedWsState && typeof window.__irefinedWsState === "object"
      ? window.__irefinedWsState
      : {
          ready: false,
          initialized: false,
          authConnected: false,
          clientConnected: false,
          releaseId: "",
          lastError: "",
          lastCommand: null,
          lastEvent: "",
        };

  window.__irefinedWsState = {
    ...previousState,
    ...patch,
  };
}

function markSocketActivity(lastEvent = "", patch = {}) {
  lastSocketActivityAt = Date.now();
  updateDebugState({
    ...(lastEvent ? { lastEvent } : {}),
    lastActivityAt: new Date(lastSocketActivityAt).toISOString(),
    ...patch,
  });
}

function id() {
  var t = function () {
    return Math.floor((1 + Math.random()) * 65536)
      .toString(16)
      .substring(1);
  };
  return t() + t() + "-" + t() + "-" + t() + "-" + t() + "-" + t() + t() + t();
}

function formatSeasonName(seasonName) {
  seasonName = seasonName
    .replace(/(?:\s*-\s*)?\d{4}\sSeason(?:\s\d+)?/, "")
    .replace(/Fixed\s(?:-\s)?Fixed/, "Fixed")
    .replace("Series Series", "Series");
  return seasonName;
}

function disconnectSocket(socket) {
  if (!socket) {
    return;
  }

  try {
    socket.removeAllListeners();
  } catch {}

  try {
    socket.disconnect();
  } catch {}
}

function clearSockets() {
  disconnectSocket(authSocket);
  disconnectSocket(clientSocket);
  authSocket = undefined;
  clientSocket = undefined;
  initialized = false;
}

function createSocket(url, irVersion) {
  return io(url, {
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    forceNew: true,
    autoConnect: true,
    auth: {
      clientVersion: irVersion,
    },
    transports: ["websocket"],
  });
}

function initWS(options = {}) {
  const { force = false } = options;
  const release = getSentryRelease();

  if (!release?.id) {
    updateDebugState({
      releaseId: "",
      lastError: "release-unavailable",
      ready: false,
    });
    log("🚫 Could not detect the iRacing client version for websocket auth");
    return false;
  }

  if (!force && (authSocket || clientSocket)) {
    return ensureReady({ reason: "init-existing", refresh: false });
  }

  clearSockets();
  lastSocketInitAt = Date.now();

  const irVersion = release.id.substring(
    0,
    release.id.indexOf("-")
  );

  authSocket = createSocket("https://members-ng.iracing.com", irVersion);
  clientSocket = createSocket("https://members-ng.iracing.com/client.io", irVersion);

  authSocket.on("connect", () => {
    initialized = false;
    markSocketActivity("auth-connect", {
      releaseId: release.id,
      authConnected: true,
      initialized: false,
      ready: false,
      lastError: "",
    });
    log("⚡ Connected to iRacing");
  });

  authSocket.on("disconnect", (reason) => {
    markSocketActivity("auth-disconnect", {
      authConnected: false,
      ready: false,
      lastError: reason || "",
    });
    log("⛓️‍💥 Disconnected from iRacing");
  });

  authSocket.on("connect_error", (error) => {
    markSocketActivity("auth-connect-error", {
      authConnected: false,
      ready: false,
      lastError: error.message,
    });
    log(`🚫 iRacing auth socket error: ${error.message}`);
  });

  clientSocket.on("connect", () => {
    markSocketActivity("client-connect", {
      clientConnected: true,
      ready: initialized,
      lastError: "",
    });
    log("🔌 Connected to client.io");
  });

  clientSocket.on("disconnect", (reason) => {
    initialized = false;
    markSocketActivity("client-disconnect", {
      clientConnected: false,
      initialized: false,
      ready: false,
      lastError: reason || "",
    });
    log("🔌 Disconnected from client.io");
  });

  clientSocket.on("connect_error", (error) => {
    initialized = false;
    markSocketActivity("client-connect-error", {
      clientConnected: false,
      initialized: false,
      ready: false,
      lastError: error.message,
    });
    log(`🚫 client.io socket error: ${error.message}`);
  });

  clientSocket.on("initialized", (data) => {
    initialized = true;
    markSocketActivity("initialized", {
      initialized: true,
      ready: true,
      lastError: "",
      initializedAt: new Date().toISOString(),
    });
    authSocket.emit("now");
    log("✅ iRacing websocket ready");

    clientSocket.emit("data_services", {
      refid: id(),
      service: "season",
      method: "popular_sessions",
      args: {
        include_empty_practice: false,
        subscribe: true,
      },
    });
  });

  authSocket.on("heartbeat", (data) => {
    markSocketActivity("heartbeat", {
      authConnected: true,
      ready: initialized && !!clientSocket?.connected,
      lastError: "",
    });
    return data();
  });

  clientSocket.on("data_services_push", (data) => {
    markSocketActivity("data-services-push", {
      clientConnected: true,
      initialized: initialized,
      ready: initialized,
      lastError: "",
    });
    callbacks.forEach((callback) => {
      callback(data);
    });

    if (!window.irefIndex) {
      window.irefIndex = {};
      try {
        data.data.sessions.forEach((session) => {
          window.irefIndex[session.season_id] = formatSeasonName(
            session.season_name
          );
        });
      } catch {}
    }
  });

  ensureLifecycleHandlers();
  ensureKeepAliveInterval();
  return true;
}

function ensureLifecycleHandlers() {
  if (lifecycleHandlersBound || typeof window === "undefined") {
    return;
  }

  lifecycleHandlersBound = true;

  window.addEventListener("focus", () => {
    ensureReady({ reason: "window-focus" });
  });

  window.addEventListener("online", () => {
    ensureReady({ reason: "browser-online" });
  });

  document.addEventListener("visibilitychange", () => {
    ensureReady({
      reason: document.hidden ? "document-hidden" : "document-visible",
      refresh: true,
    });
  });
}

function ensureKeepAliveInterval() {
  if (keepAliveIntervalId || typeof window === "undefined") {
    return;
  }

  keepAliveIntervalId = window.setInterval(() => {
    if (isReady()) {
      refreshNow();
      return;
    }

    ensureReady({ reason: "keepalive", refresh: false });
  }, socketKeepAliveIntervalMs);
}

function ensureReady(options = {}) {
  const { reason = "", refresh = true } = options;
  const release = getSentryRelease();

  if (!release?.id) {
    updateDebugState({
      releaseId: "",
      lastError: "release-unavailable",
      ready: false,
      lastEvent: "ensure-release-unavailable",
    });
    return false;
  }

  if (!authSocket || !clientSocket) {
    initWS({ force: true });
    return false;
  }

  if (isReady()) {
    if (refresh) {
      refreshNow();
    }
    return true;
  }

  const now = Date.now();
  const initStalled =
    !!lastSocketInitAt &&
    now - lastSocketInitAt >= socketInitStallMs &&
    !!authSocket.connected &&
    !!clientSocket.connected &&
    !initialized;
  const disconnectedAndStale =
    !!lastSocketActivityAt &&
    now - lastSocketActivityAt >= socketInitStallMs &&
    !authSocket.connected &&
    !clientSocket.connected;

  if (!authSocket.connected && typeof authSocket.connect === "function") {
    try {
      authSocket.connect();
    } catch {}
  }

  if (!clientSocket.connected && typeof clientSocket.connect === "function") {
    try {
      clientSocket.connect();
    } catch {}
  }

  if (refresh && authSocket.connected) {
    refreshNow();
  }

  if (
    (initStalled || disconnectedAndStale) &&
    now - lastSocketEnsureAt >= socketEnsureCooldownMs
  ) {
    lastSocketEnsureAt = now;
    log(
      `🔁 Restarting iRacing websocket connection${reason ? ` (${reason})` : ""}`
    );
    initWS({ force: true });
  }

  return isReady();
}

function send(event, data) {
  if (!clientSocket || !clientSocket.connected || !initialized) {
    updateDebugState({
      ready: false,
      lastError: "not-ready",
      lastEvent: "send-blocked",
      lastCommand: {
        event,
        service: data?.service || "",
        method: data?.method || "",
        at: new Date().toISOString(),
      },
    });
    log("🚫 iRacing websocket is not ready yet");
    return false;
  }

  data.refid = id();
  clientSocket.emit(event, data);
  updateDebugState({
    ready: true,
    lastError: "",
    lastEvent: "send",
    lastCommand: {
      event,
      service: data?.service || "",
      method: data?.method || "",
      at: new Date().toISOString(),
    },
  });
  return true;
}

function refreshNow() {
  if (!authSocket || !authSocket.connected) {
    ensureReady({ reason: "refresh-now", refresh: false });
    return false;
  }

  markSocketActivity("refresh-now", {
    authConnected: true,
    ready: initialized && !!clientSocket?.connected,
  });
  authSocket.emit("now");
  return true;
}

function scheduleStatusRefresh() {
  refreshNow();
  setTimeout(refreshNow, 1200);
  setTimeout(refreshNow, 3500);
}

function withdraw() {
  log("🚫 Withdrawing from current session");
  const sent = send("data_services", {
    service: "registration",
    method: "withdraw",
    args: {},
  });

  if (sent) {
    scheduleStatusRefresh();
  }

  return sent;
}

function register(
  session_name,
  car_id,
  car_class_id,
  session_id,
  subsession_id = null
) {
  log(`📝 Registering for ${session_name}`);

  const data = {
    service: "registration",
    method: "register",
    args: {
      register_as: "driver",
      car_id: car_id,
      car_class_id: car_class_id,
      session_id: session_id,
    },
  };

  if (subsession_id) {
    data.args.subsession_id = subsession_id;
  }

  const sent = send("data_services", data);

  if (sent) {
    scheduleStatusRefresh();
  }

  return sent;
}

function isReady() {
  return !!clientSocket && clientSocket.connected && initialized;
}

const ws = {
  send,
  ensureReady,
  refreshNow,
  register,
  withdraw,
  isReady,
  callbacks,
};

export default ws;
