import { io } from "socket.io-client";
import { log } from "../features/logger.js";

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

function initWS() {
  const release = getSentryRelease();

  if (!release?.id) {
    updateDebugState({
      releaseId: "",
      lastError: "release-unavailable",
      ready: false,
    });
    log("🚫 Could not detect the iRacing client version for websocket auth");
    return;
  }

  const irVersion = release.id.substring(
    0,
    release.id.indexOf("-")
  );

  authSocket = io("https://members-ng.iracing.com", {
    reconnectionAttempts: 100,
    auth: {
      clientVersion: irVersion,
    },
    transports: ["websocket"],
  });

  clientSocket = io("https://members-ng.iracing.com/client.io", {
    reconnectionAttempts: 100,
    auth: {
      clientVersion: irVersion,
    },
    transports: ["websocket"],
  });

  authSocket.on("connect", () => {
    initialized = false;
    updateDebugState({
      releaseId: release.id,
      authConnected: true,
      initialized: false,
      ready: false,
      lastError: "",
      lastEvent: "auth-connect",
    });
    log("⚡ Connected to iRacing");
  });

  authSocket.on("disconnect", () => {
    updateDebugState({
      authConnected: false,
      ready: false,
      lastEvent: "auth-disconnect",
    });
    log("⛓️‍💥 Disconnected from iRacing");
  });

  authSocket.on("connect_error", (error) => {
    updateDebugState({
      authConnected: false,
      ready: false,
      lastError: error.message,
      lastEvent: "auth-connect-error",
    });
    log(`🚫 iRacing auth socket error: ${error.message}`);
  });

  clientSocket.on("connect", () => {
    updateDebugState({
      clientConnected: true,
      ready: initialized,
      lastError: "",
      lastEvent: "client-connect",
    });
    log("🔌 Connected to client.io");
  });

  clientSocket.on("disconnect", () => {
    initialized = false;
    updateDebugState({
      clientConnected: false,
      initialized: false,
      ready: false,
      lastEvent: "client-disconnect",
    });
    log("🔌 Disconnected from client.io");
  });

  clientSocket.on("connect_error", (error) => {
    initialized = false;
    updateDebugState({
      clientConnected: false,
      initialized: false,
      ready: false,
      lastError: error.message,
      lastEvent: "client-connect-error",
    });
    log(`🚫 client.io socket error: ${error.message}`);
  });

  clientSocket.on("initialized", (data) => {
    initialized = true;
    updateDebugState({
      initialized: true,
      ready: true,
      lastError: "",
      lastEvent: "initialized",
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
    return data();
  });

  clientSocket.on("data_services_push", (data) => {
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
    return false;
  }

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
  refreshNow,
  register,
  withdraw,
  isReady,
  callbacks,
};

export default ws;
