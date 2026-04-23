const { contextBridge, ipcRenderer, webFrame } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const assetRoot = path.join(__dirname, "assets", "irefined");
const bridgeSource = fs.readFileSync(path.join(assetRoot, "bridge.js"), "utf8");
const mainSource = fs.readFileSync(path.join(assetRoot, "main.js"), "utf8");
const accountSource = fs.readFileSync(path.join(assetRoot, "account-main.js"), "utf8");
const bridgeSourceJson = JSON.stringify(bridgeSource);
const mainSourceJson = JSON.stringify(mainSource);
const accountSourceJson = JSON.stringify(accountSource);
const cssSource = JSON.stringify(fs.readFileSync(path.join(assetRoot, "extension.css"), "utf8"));
const launcherCssSource = JSON.stringify(
  fs.readFileSync(path.join(assetRoot, "launcher-overrides.css"), "utf8")
);

const simStatusCallbacks = new Map();
const trpcListeners = new Set();
let simEndingCallback = null;
let closeAttemptCallback = null;
let paintChangedCallback = null;
let specMapChangeCallback = null;
let callbackSeed = 1;

function nextId() {
  callbackSeed += 1;
  return `callback-${Date.now()}-${callbackSeed}`;
}

function sendDiagnostic(kind, details) {
  try {
    const text = typeof details === "string" ? details : JSON.stringify(details);
    ipcRenderer.send("ps:diagnostic", kind, text);
  } catch {
  }
}

function summarizeTrpcData(pathName, data) {
  if (pathName === "electron.getVersions" && data && typeof data === "object") {
    const keys = Object.keys(data);
    return {
      keyCount: keys.length,
      anticheat_engine: data.anticheat_engine || null,
      system: data.system || null,
      cars: data.cars || null,
      tracks: data.tracks || null,
      hasInstallDir: !!data.install_dir,
    };
  }

  if (Array.isArray(data)) {
    return {
      length: data.length,
    };
  }

  if (data && typeof data === "object") {
    return {
      keyCount: Object.keys(data).length,
      keys: Object.keys(data).slice(0, 12),
    };
  }

  return { value: data ?? null };
}

function buildTrpcError(id, error) {
  return {
    id,
    error: {
      message: String((error && error.message) || error || "Electron tRPC bridge failed."),
      code: -32603,
      data: {
        code: "INTERNAL_SERVER_ERROR",
        httpStatus: 500,
        stack: String((error && error.stack) || ""),
      },
    },
  };
}

function unwrapTrpcInput(input) {
  if (input && typeof input === "object" && Object.prototype.hasOwnProperty.call(input, "json")) {
    return input.json;
  }

  return input;
}

function resolveElectronTrpc(pathName, input) {
  const payload = unwrapTrpcInput(input);

  switch (pathName) {
    case "electron.getVersions":
      return ipcRenderer.invoke("ps:getSystemVersions");

    case "electron.isLocalServiceRunning":
      return ipcRenderer.invoke("ps:isLocalServiceRunning");

    case "electron.getInstallInformation":
      return ipcRenderer.invoke("ps:getInstallInformation");

    case "electron.getUseMetric":
      return ipcRenderer.invoke("ps:getUseMetric");

    case "electron.getPingTimes":
      return ipcRenderer.invoke("ps:getPingTimes");

    case "electron.getCustomExtensionUrl":
      return ipcRenderer.invoke("ps:getCustomExtensionUrl");

    case "electron.isDllAvailable":
      return ipcRenderer.invoke("ps:isDllAvailable");

    case "electron.isCloudXRSupported":
      return Promise.resolve(false);

    case "electron.isAVConnected":
      return ipcRenderer.invoke("ps:isAVConnected");

    case "electron.getReplayList":
      return ipcRenderer.invoke("ps:getReplayList", payload);

    case "electron.getGeneratedCarImages":
      return ipcRenderer.invoke("ps:getGeneratedCarImages", payload);

    case "electron.getSavedGames":
      return ipcRenderer.invoke("ps:getSavedGames", payload);

    case "electron.getLocalSetups":
      return ipcRenderer.invoke("ps:getLocalSetups", payload);

    case "electron.getMsrTelemetryFiles":
      return ipcRenderer.invoke("ps:getMsrTelemetryFiles", payload);

    case "electron.getPaint":
      return ipcRenderer.invoke("ps:getPaint", payload);

    case "electron.setUiTheme": {
      const theme =
        typeof payload === "string"
          ? payload
          : payload && typeof payload === "object"
            ? payload.theme || payload.source || payload.value
            : null;
      return ipcRenderer.invoke("ps:setUiTheme", theme);
    }

    case "electron.setUseMetric":
      return ipcRenderer.invoke("ps:setUseMetric", payload);

    case "electron.setUseIPv6":
      return ipcRenderer.invoke("ps:setUseIPv6", payload);

    case "electron.setUseSteamOverlay":
      return ipcRenderer.invoke("ps:setUseSteamOverlay", payload);

    case "electron.setDisplayMode":
      return ipcRenderer.invoke("ps:setDisplayMode", payload);

    case "electron.runGraphicsConfig":
      return ipcRenderer.invoke("ps:runGraphicsConfig", payload);

    case "electron.startService":
      return ipcRenderer.invoke("ps:startService");

    case "electron.stopService":
      return ipcRenderer.invoke("ps:stopService");

    case "electron.setPingServers":
      return ipcRenderer.invoke("ps:setPingServers", payload);

    case "electron.stopPinging":
      return ipcRenderer.invoke("ps:stopPinging");

    case "electron.deleteAllGeneratedCarImages":
      return ipcRenderer.invoke("ps:deleteAllGeneratedCarImages");

    case "electron.openInstallDirectory":
      return ipcRenderer.invoke("ps:openInstallDirectory");

    case "electron.openAppDataDirectory":
      return ipcRenderer.invoke("ps:openAppDataDirectory");

    case "electron.openDocumentsDirectory":
      return ipcRenderer.invoke("ps:openDocumentsDirectory");

    case "electron.quit":
      return ipcRenderer.invoke("ps:quit", payload);

    case "electron.reconnect":
      return ipcRenderer.invoke("ps:reconnect", payload);

    case "electron.saveEventResult":
      return ipcRenderer.invoke("ps:saveEventResult", payload);

    case "electron.saveLapChart":
      return ipcRenderer.invoke("ps:saveLapChart", payload);

    case "electron.uploadMsrTelemetryFile":
      return ipcRenderer.invoke("ps:uploadMsrTelemetryFile", payload);

    case "electron.stopMsrTelemetryUpload":
      return ipcRenderer.invoke("ps:stopMsrTelemetryUpload", payload);

    case "electron.deleteTelemetryFiles":
      return ipcRenderer.invoke("ps:deleteTelemetryFiles", payload);

    case "electron.syncLanguagePreference":
      return ipcRenderer.invoke("ps:syncLanguagePreference", payload);

    case "electron.setAVLaunchMode":
      return ipcRenderer.invoke("ps:setAVLaunchMode", payload);

    case "electron.deleteSaveGame":
      return ipcRenderer.invoke("ps:deleteSaveGame", payload);

    case "electron.viewerLoginRefresh":
      return ipcRenderer.invoke("ps:viewerLoginRefresh", payload);

    default:
      sendDiagnostic("electronTrpcUnhandled", { path: pathName });
      return Promise.resolve(null);
  }
}

const electronTRPC = {
  sendMessage(message) {
    const operation = message && message.operation;
    const id = operation && operation.id;
    const pathName = operation && operation.path;

    if (!message || message.method !== "request" || !operation) {
      return;
    }

    sendDiagnostic("electronTrpcRequest", {
      id,
      type: operation.type,
      path: pathName,
      listeners: trpcListeners.size,
    });

    Promise.resolve(resolveElectronTrpc(pathName, operation.input))
      .then((data) => {
        const response = {
          id,
          result: {
            type: "data",
            data,
          },
        };

        sendDiagnostic("electronTrpcResponse", {
          id,
          path: pathName,
          ok: true,
          summary: summarizeTrpcData(pathName, data),
        });

        trpcListeners.forEach((listener) => {
          try {
            listener(response);
          } catch (error) {
            console.error("iRefinedX electronTRPC listener failed.", error);
          }
        });
      })
      .catch((error) => {
        const response = buildTrpcError(id, error);
        sendDiagnostic("electronTrpcResponse", {
          id,
          path: pathName,
          ok: false,
          error: String((error && error.message) || error || "unknown"),
        });

        trpcListeners.forEach((listener) => {
          try {
            listener(response);
          } catch {
          }
        });
      });
  },
  onMessage(callback) {
    if (typeof callback !== "function") {
      return undefined;
    }

    trpcListeners.add(callback);
    sendDiagnostic("electronTrpcListenerRegistered", {
      listeners: trpcListeners.size,
    });

    return () => {
      trpcListeners.delete(callback);
      sendDiagnostic("electronTrpcListenerRemoved", {
        listeners: trpcListeners.size,
      });
    };
  },
};

const interop = {
  copyAiRoster: (name, copyName) => ipcRenderer.invoke("ps:copyAiRoster", { name, copyName }),
  copyTga: (filePath, rosterName, fileName) => ipcRenderer.invoke("ps:copyTga", { filePath, rosterName, fileName }),
  deleteAiRoster: (name) => ipcRenderer.invoke("ps:deleteAiRoster", name),
  deleteAiSeason: (name) => ipcRenderer.invoke("ps:deleteAiSeason", name),
  deleteReplay: (filename) => ipcRenderer.invoke("ps:deleteReplay", filename),
  deleteSpecMap: (rosterName, specMap) => ipcRenderer.invoke("ps:deleteSpecMap", { rosterName, specMap }),
  getAiRosters: () => ipcRenderer.invoke("ps:getAiRosters"),
  getAiSeasons: () => ipcRenderer.invoke("ps:getAiSeasons"),
  getHardware: () => ipcRenderer.invoke("ps:getHardware"),
  getPaint: (copy, rosterName, type, tga) => ipcRenderer.invoke("ps:getPaint", { copy, rosterName, type, tga }),
  getPaintLocation: (paintName, car_dirpath, roster) => ipcRenderer.sendSync("ps:getPaintLocation", { paintName, car_dirpath, roster }),
  getSpecMaps: (rosterName) => ipcRenderer.invoke("ps:getSpecMaps", rosterName),
  getStoredZoom: () => ipcRenderer.invoke("ps:getStoredZoom"),
  getZoom: () => ipcRenderer.invoke("ps:getZoom"),
  isLocalServiceRunning: () => ipcRenderer.invoke("ps:isLocalServiceRunning"),
  log: (line) => ipcRenderer.invoke("ps:log", line),
  maximize: () => ipcRenderer.invoke("ps:maximize"),
  minimize: () => ipcRenderer.invoke("ps:minimize"),
  openInBrowser: (link) => ipcRenderer.invoke("ps:openInBrowser", link),
  quit: () => ipcRenderer.invoke("ps:quit"),
  relayMessage: (message) => ipcRenderer.invoke("ps:relayMessage", message),
  removeSimStatusCb: (identifier) => {
    simStatusCallbacks.delete(identifier);
  },
  renameAiRoster: (oldName, newName) => ipcRenderer.invoke("ps:renameAiRoster", { oldName, newName }),
  renameAiSeason: (oldName, newName) => ipcRenderer.invoke("ps:renameAiSeason", { oldName, newName }),
  renamePaintFile: (name, newName, rosterName) => ipcRenderer.invoke("ps:renamePaintFile", { name, newName, rosterName }),
  saveAiRoster: (name, roster) => ipcRenderer.invoke("ps:saveAiRoster", { name, roster }),
  saveAiSeason: (name, season) => ipcRenderer.invoke("ps:saveAiSeason", { name, season }),
  saveEventResult: (result) => ipcRenderer.invoke("ps:saveEventResult", result),
  setCloseAttemptCb: (callback) => {
    closeAttemptCallback = typeof callback === "function" ? callback : null;
  },
  setGraphicsConfigCb: () => {},
  setPreventClose: (prevent) => ipcRenderer.invoke("ps:setPreventClose", !!prevent),
  setSimSetting: () => {},
  setSimStatusCb: (callback, identifier) => {
    if (typeof callback !== "function") {
      return identifier || null;
    }

    const key = identifier || nextId();
    simStatusCallbacks.set(key, callback);
    return key;
  },
  setSubdomainSuffix: (suffix) => ipcRenderer.invoke("ps:setSubdomainSuffix", suffix),
  setStoredZoom: (zoom) => ipcRenderer.invoke("ps:setZoom", zoom),
  setZoom: (zoom) => ipcRenderer.invoke("ps:setZoom", zoom),
  startSim: (task, callback, hideLoadingScreen = false, displayMode = null) => {
    simEndingCallback = typeof callback === "function" ? callback : null;
    return ipcRenderer.invoke("ps:startSim", {
      task,
      hideLoadingScreen: !!hideLoadingScreen,
      displayMode,
    });
  },
  viewerCreateView: (x, y, width, height) => ipcRenderer.send("ps:viewerCreateView", {
    zoomFactor: webFrame.getZoomFactor(),
    dimensions: [x, y, width, height],
  }),
  viewerDeleteView: () => ipcRenderer.send("ps:viewerDeleteView"),
  viewerLoadObject: (type, objPath, carCfg, carCfgSubDir, carCfgCustomPaintExt) => ipcRenderer.send("ps:viewerLoadObject", {
    type,
    objPath,
    carCfg,
    carCfgSubDir,
    carCfgCustomPaintExt,
  }),
  viewerPaintItem: ({ fileChangeCb, ...payload } = {}) => {
    if (typeof fileChangeCb === "function") {
      paintChangedCallback = fileChangeCb;
    }
    return ipcRenderer.invoke("ps:viewerPaintItem", payload || {});
  },
  viewerReset: () => ipcRenderer.invoke("ps:viewerReset"),
  viewerResize: (x, y, width, height) => ipcRenderer.send("ps:viewerResize", {
    zoomFactor: webFrame.getZoomFactor(),
    dimensions: [x, y, width, height],
  }),
  changeHead: (id) => ipcRenderer.send("ps:viewerSetDriverHeadType", id),
  viewerSetBgColor: (color) => ipcRenderer.send("ps:viewerSetFrameWindowBGColor", color),
  viewerSetDriverHeadType: (id) => ipcRenderer.send("ps:viewerSetDriverHeadType", id),
  viewerSetFrameWindowBGColor: (color) => ipcRenderer.send("ps:viewerSetFrameWindowBGColor", color),
  viewerSetPathDetails: (keys) => ipcRenderer.send("ps:viewerSetPathDetails", keys),
  setWindowListener: () => {},
  unmaximize: () => ipcRenderer.invoke("ps:unmaximize"),
  watchSpecMaps: (rosterName, callback) => {
    specMapChangeCallback = typeof callback === "function" ? callback : null;
    ipcRenderer.invoke("ps:watchSpecMaps", rosterName);
    return {
      close: () => {
        specMapChangeCallback = null;
        return ipcRenderer.invoke("ps:closeWatcher");
      },
    };
  },
  closeWatcher: () => {
    specMapChangeCallback = null;
    return ipcRenderer.invoke("ps:closeWatcher");
  },
};

ipcRenderer.on("ps-bridge-event", (_event, message) => {
  if (!message || !message.event) {
    return;
  }

  if (message.event === "simStatus") {
    simStatusCallbacks.forEach((callback) => {
      try {
        callback(message.payload || {});
      } catch (error) {
        console.error("iRefinedX sim status callback failed.", error);
      }
    });
    return;
  }

  if (message.event === "simEnding") {
    if (typeof simEndingCallback === "function") {
      simEndingCallback(message.payload || null);
    }
    return;
  }

  if (message.event === "closeAttempt") {
    if (typeof closeAttemptCallback === "function") {
      closeAttemptCallback(message.payload || null);
    }
    return;
  }

  if (message.event === "paintChanged" && typeof paintChangedCallback === "function") {
    const payload = Array.isArray(message.payload) ? message.payload : [];
    paintChangedCallback(...payload);
    return;
  }

  if (message.event === "specMapChange" && typeof specMapChangeCallback === "function") {
    const payload = message.payload || {};
    specMapChangeCallback(payload.changeType, payload.fileName);
  }
});

contextBridge.exposeInMainWorld("interop", interop);
contextBridge.exposeInMainWorld("interopProxy", interop);
contextBridge.exposeInMainWorld("electronTRPC", electronTRPC);
contextBridge.exposeInMainWorld("iRefinedXApp", {
  getInfo: () => ipcRenderer.invoke("ps:getAppInfo"),
  checkForUpdates: (options = {}) => ipcRenderer.invoke("ps:checkForUpdates", options),
  openLatestRelease: (targetUrl = "") => ipcRenderer.invoke("ps:openLatestRelease", targetUrl),
  getLaunchAtStartup: () => ipcRenderer.invoke("ps:getLaunchAtStartup"),
  setLaunchAtStartup: (enabled) => ipcRenderer.invoke("ps:setLaunchAtStartup", enabled),
});

function buildIRefinedBootstrapScript() {
  return `
    (() => {
      const __irefHost = (window.location.hostname || "").toLowerCase();
      const __irefPath = window.location.pathname || "/";
      const __irefTopFrame = window.top === window;
      const __irefMembersNg = __irefTopFrame && __irefHost === "members-ng.iracing.com" && __irefPath.startsWith("/web/");
      const __irefAccount = __irefTopFrame && __irefHost === "members.iracing.com" && __irefPath.startsWith("/membersite/account/");
      const __irefMigrationKey = "irefinedx_profile_v1";
      const __irefLegacyMigrationKeys = ["projeto_secreto_iref_profile_v4"];
      const __irefQueueKey = "iref_watch_queue";
      const __irefRegistrationStateKey = "iref_registration_state";

      const __irefHasMigrated = () => {
        const keys = [__irefMigrationKey, ...__irefLegacyMigrationKeys];
        return keys.some((key) => window.localStorage.getItem(key) === "1");
      };

      const __irefEnsureChromeShim = () => {
        const chromeRoot = window.chrome = window.chrome || {};
        const runtimeRoot = chromeRoot.runtime = chromeRoot.runtime || {};
        const storageRoot = chromeRoot.storage = chromeRoot.storage || {};

        if (storageRoot.local) {
          runtimeRoot.lastError = null;
          return;
        }

        const makeError = (message) => ({ message: String(message || "Unknown error") });
        const readValue = (key) => {
          const raw = window.localStorage.getItem(key);
          if (raw === null || raw === undefined) {
            return undefined;
          }

          try {
            return JSON.parse(raw);
          } catch {
            return raw;
          }
        };
        const writeValue = (key, value) => {
          window.localStorage.setItem(key, JSON.stringify(value));
        };
        const normalizeKeyList = (keys) => {
          if (Array.isArray(keys)) {
            return keys.map((entry) => String(entry || ""));
          }

          if (typeof keys === "string") {
            return [keys];
          }

          if (keys && typeof keys === "object") {
            return Object.keys(keys);
          }

          return [];
        };

        storageRoot.local = {
          get(keys, callback) {
            runtimeRoot.lastError = null;

            try {
              const response = {};

              if (keys && typeof keys === "object" && !Array.isArray(keys) && typeof keys !== "string") {
                Object.keys(keys).forEach((key) => {
                  const value = readValue(key);
                  response[key] = value === undefined ? keys[key] : value;
                });
              } else {
                normalizeKeyList(keys).forEach((key) => {
                  const value = readValue(key);
                  if (value !== undefined) {
                    response[key] = value;
                  }
                });
              }

              callback && callback(response);
            } catch (error) {
              runtimeRoot.lastError = makeError(error && error.message);
              callback && callback({});
            } finally {
              runtimeRoot.lastError = null;
            }
          },
          set(values, callback) {
            runtimeRoot.lastError = null;

            try {
              Object.keys(values || {}).forEach((key) => {
                writeValue(key, values[key]);
              });
              callback && callback();
            } catch (error) {
              runtimeRoot.lastError = makeError(error && error.message);
              callback && callback();
            } finally {
              runtimeRoot.lastError = null;
            }
          },
          remove(keys, callback) {
            runtimeRoot.lastError = null;

            try {
              normalizeKeyList(keys).forEach((key) => {
                window.localStorage.removeItem(key);
              });
              callback && callback();
            } catch (error) {
              runtimeRoot.lastError = makeError(error && error.message);
              callback && callback();
            } finally {
              runtimeRoot.lastError = null;
            }
          }
        };
      };

      const __irefEnsureStyle = () => {
        if (!__irefMembersNg || document.getElementById("__irefined-style")) {
          return;
        }

        const styleHost = document.head || document.documentElement;
        if (!styleHost) {
          document.addEventListener("DOMContentLoaded", __irefEnsureStyle, { once: true });
          window.requestAnimationFrame(__irefEnsureStyle);
          return;
        }

        const style = document.createElement("style");
        style.id = "__irefined-style";
        style.textContent = ${cssSource};
        styleHost.appendChild(style);
      };

      const __irefEnsureLauncherStyle = () => {
        if (!__irefMembersNg || document.getElementById("__irefined-launcher-style")) {
          return;
        }

        const styleHost = document.head || document.documentElement;
        if (!styleHost) {
          document.addEventListener("DOMContentLoaded", __irefEnsureLauncherStyle, { once: true });
          window.requestAnimationFrame(__irefEnsureLauncherStyle);
          return;
        }

        const style = document.createElement("style");
        style.id = "__irefined-launcher-style";
        style.textContent = ${launcherCssSource};
        styleHost.appendChild(style);
      };

      const __irefEnsureLauncherSettings = () => {
        if (!__irefMembersNg) {
          return;
        }

        let settings = {};
        try {
          const parsed = JSON.parse(window.localStorage.getItem("iref_settings") || "{}");
          settings = parsed && typeof parsed === "object" ? parsed : {};
        } catch {
        }

        settings["status-bar"] = true;
        settings["dashboard-intelligence-center"] = true;
        settings["dashboard-purchase-summary"] = false;
        settings["better-join-button"] = true;
        settings["auto-register"] = true;
        settings["no-sidebars"] = false;
        settings["collapse-menu"] = false;
        window.localStorage.setItem("iref_settings", JSON.stringify(settings));

        if (!__irefHasMigrated()) {
          window.localStorage.removeItem(__irefQueueKey);
          window.localStorage.removeItem(__irefRegistrationStateKey);
        }

        window.localStorage.setItem(__irefMigrationKey, "1");
      };

      const __irefNormalizeShellInsets = () => {
        if (!__irefMembersNg) {
          return;
        }

        const apply = () => {
          const html = document.documentElement;
          const body = document.body;
          const app = document.getElementById("app");

          if (html) {
            html.style.setProperty("margin", "0px", "important");
            html.style.setProperty("padding", "0px", "important");
            html.style.setProperty("border", "0px", "important");
          }

          if (body) {
            body.style.setProperty("margin", "0px", "important");
            body.style.setProperty("padding", "0px", "important");
            body.style.setProperty("border", "0px", "important");
            body.style.setProperty("outline", "0px", "important");
          }

          if (app) {
            app.style.setProperty("margin", "0px", "important");
            app.style.setProperty("padding", "0px", "important");
            app.style.setProperty("border", "0px", "important");
          }
        };

        apply();
        document.addEventListener("DOMContentLoaded", apply, { once: true });
        window.addEventListener("load", apply, { once: true });
        window.requestAnimationFrame(apply);
        window.setTimeout(apply, 0);
        window.setTimeout(apply, 250);
        window.setTimeout(apply, 1000);

        if (document.body && !document.body.dataset.irefShellInsetsObserved) {
          const observer = new MutationObserver(apply);
          observer.observe(document.body, {
            attributes: true,
            attributeFilter: ["style", "class"],
          });
          document.body.dataset.irefShellInsetsObserved = "1";
        }
      };

      if (__irefMembersNg || __irefAccount) {
        __irefEnsureChromeShim();
      }

      if (__irefMembersNg) {
        __irefEnsureLauncherSettings();
        __irefEnsureStyle();
        __irefEnsureLauncherStyle();
        __irefNormalizeShellInsets();
      }
    })();

    const __irefBridgeSource = ${bridgeSourceJson};
    const __irefMainSource = ${mainSourceJson};
    const __irefAccountSource = ${accountSourceJson};

    const __irefRunBridge = () => {
      Function(__irefBridgeSource)();
    };

    const __irefRunMain = () => {
      Function(__irefMainSource)();
    };

    const __irefRunWhenDocumentRootReady = (callback) => {
      let ran = false;
      const run = () => {
        if (ran || !document.documentElement) {
          return;
        }

        ran = true;
        callback();
      };

      run();
      if (!ran) {
        document.addEventListener("readystatechange", run, { once: true });
        document.addEventListener("DOMContentLoaded", run, { once: true });
        window.setTimeout(run, 0);
      }
    };

    const __irefRunOrderHistory = () => {
      Function(__irefAccountSource)();
    };

    if ((window.top === window) &&
        ((((window.location.hostname || "").toLowerCase() === "members-ng.iracing.com") &&
        ((window.location.pathname || "/").startsWith("/web/"))) ||
       (((window.location.hostname || "").toLowerCase() === "members.iracing.com") &&
        ((window.location.pathname || "/").startsWith("/membersite/account/"))))) {
      __irefRunBridge();
    }

    if ((window.top === window) &&
        ((window.location.hostname || "").toLowerCase() === "members-ng.iracing.com") &&
        ((window.location.pathname || "/").startsWith("/web/"))) {
      __irefRunWhenDocumentRootReady(__irefRunMain);
    }

    if ((window.top === window) &&
        ((window.location.hostname || "").toLowerCase() === "members.iracing.com") &&
        /^\\/membersite\\/account\\/OrderHistory\\.do/i.test(window.location.pathname || "")) {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", __irefRunOrderHistory, { once: true });
      } else {
        __irefRunOrderHistory();
      }
    }
  `;
}

function buildLocalServiceBridgeScript() {
  return `
    (() => {
      if (window.__irefinedXLocalServiceBridgeInstalled) {
        return;
      }

      if (window.top !== window) {
        return;
      }

      const host = (window.location.hostname || "").toLowerCase();
      const pathName = window.location.pathname || "/";
      const isMembersNg = host === "members-ng.iracing.com" && pathName.startsWith("/web/");
      const isMemberSite = host === "members.iracing.com" && pathName.startsWith("/membersite/");
      if (!isMembersNg && !isMemberSite) {
        return;
      }

      window.__irefinedXLocalServiceBridgeInstalled = true;

      const helperOrigin = "http://127.0.0.1:32034";
      const updateTitlePattern = /update content required|required updates/i;
      const updateActionPattern = /\\b(update|download|install|atualizar|baixar|instalar)\\b/i;
      const ignoreActionPattern = /\\b(cancel|close|log in|login|select|optional|back)\\b/i;
      const suppressStorageKey = "__irefinedXContentUpdateSuppressUntil";
      let contentUpdateAutoStartAt = 0;
      let lastDownloadSnapshot = "";
      let lastVersionsRefreshAt = 0;
      let lastHelperErrorAt = 0;
      let suppressAutoStartUntil = 0;
      let lastDownloadState = null;
      let completionReloadTimer = null;

      const helperLog = (kind, details) => {
        try {
          console.info("[iRefinedX]", kind, details || "");
        } catch {
        }
      };

      const readSuppressUntil = () => {
        try {
          return Number(window.sessionStorage.getItem(suppressStorageKey)) || 0;
        } catch {
          return 0;
        }
      };

      const writeSuppressUntil = (value) => {
        suppressAutoStartUntil = Number(value) || 0;
        try {
          if (suppressAutoStartUntil > Date.now()) {
            window.sessionStorage.setItem(suppressStorageKey, String(suppressAutoStartUntil));
          } else {
            window.sessionStorage.removeItem(suppressStorageKey);
          }
        } catch {
        }
      };

      suppressAutoStartUntil = readSuppressUntil();

      const logHelperError = (kind, details) => {
        const now = Date.now();
        if (now - lastHelperErrorAt < 5000) {
          return;
        }

        lastHelperErrorAt = now;
        helperLog(kind, details);
      };

      const injectHelperScript = (endpoint, globalName) => new Promise((resolve) => {
        try {
          const script = document.createElement("script");
          script.async = true;
          script.src = helperOrigin + "/" + endpoint + "?nocache=" + Date.now();

          const cleanup = () => {
            try {
              script.remove();
            } catch {
            }
          };

          script.onload = () => {
            const value = window[globalName] || null;
            cleanup();
            resolve({ ok: true, value });
          };

          script.onerror = () => {
            cleanup();
            resolve({ ok: false, value: null });
          };

          (document.head || document.documentElement).appendChild(script);
        } catch (error) {
          resolve({
            ok: false,
            value: null,
            error: String((error && error.message) || error || "unknown helper error")
          });
        }
      });

      const getVisibleActionCandidates = () => {
        try {
          return Array.from(document.querySelectorAll("button,[role='button'],a,input[type='button'],input[type='submit']"))
            .map((element) => {
              const rect = element.getBoundingClientRect ? element.getBoundingClientRect() : null;
              const style = window.getComputedStyle ? window.getComputedStyle(element) : null;
              const text = String(
                element.innerText ||
                element.textContent ||
                element.value ||
                element.title ||
                element.ariaLabel ||
                element.getAttribute("aria-label") ||
                ""
              ).replace(/\\s+/g, " ").trim();

              return {
                element,
                text,
                disabled: !!element.disabled || element.getAttribute("aria-disabled") === "true",
                visible: !!rect &&
                  rect.width > 0 &&
                  rect.height > 0 &&
                  (!style || (style.visibility !== "hidden" && style.display !== "none"))
              };
            })
            .filter((entry) => entry.text && entry.visible);
        } catch {
          return [];
        }
      };

      const getBodyText = () => String((document.body && document.body.innerText) || "")
        .replace(/\\s+/g, " ")
        .trim();

      const buildRefreshUrl = () => {
        try {
          const nextUrl = new URL(window.location.href);
          nextUrl.searchParams.delete("downloadSuccess");
          nextUrl.searchParams.delete("downloadError");
          return nextUrl.toString();
        } catch {
          return window.location.href;
        }
      };

      const isCompletedDownloadStatus = (status) => {
        const nFiles = Number(status && status.nFiles) || 0;
        const nComplete = Number(status && status.nComplete) || 0;
        const kTotal = Number(status && status.kTotal) || 0;
        const kDownloaded = Number(status && status.kDownloaded) || 0;
        return !status?.bActive &&
          nFiles > 0 &&
          nComplete >= nFiles &&
          kTotal > 0 &&
          kDownloaded >= kTotal;
      };

      const scheduleContentRefresh = () => {
        if (completionReloadTimer) {
          return;
        }

        completionReloadTimer = window.setTimeout(() => {
          completionReloadTimer = null;
          if (!updateTitlePattern.test(getBodyText())) {
            return;
          }

          const nextUrl = buildRefreshUrl();
          helperLog("contentUpdateReload", nextUrl);
          window.location.replace(nextUrl);
        }, 2500);
      };

      const maybeAutoStartContentUpdate = () => {
        try {
          const bodyText = getBodyText();

          if (!updateTitlePattern.test(bodyText)) {
            return;
          }

          suppressAutoStartUntil = Math.max(suppressAutoStartUntil, readSuppressUntil());
          if (Date.now() < suppressAutoStartUntil) {
            return;
          }

          const downloadStatus = window.downloadstatus || {};
          if (downloadStatus.bActive ||
            downloadStatus.is_downloading ||
            downloadStatus.is_installing ||
            isCompletedDownloadStatus(downloadStatus)) {
            return;
          }

          if (contentUpdateAutoStartAt && Date.now() - contentUpdateAutoStartAt < 12000) {
            return;
          }

          const candidates = getVisibleActionCandidates();
          const target = candidates.find((entry) =>
            !entry.disabled &&
            updateActionPattern.test(entry.text) &&
            !ignoreActionPattern.test(entry.text)
          );

          if (!target) {
            return;
          }

          contentUpdateAutoStartAt = Date.now();
          target.element.click();
          helperLog("contentUpdateAutoStart", target.text);
        } catch (error) {
          logHelperError("contentUpdateAutoStartError", String((error && error.message) || error || "unknown"));
        }
      };

      const refreshSystemVersions = async (force = false) => {
        if (!force &&
          lastVersionsRefreshAt &&
          Date.now() - lastVersionsRefreshAt < 300000 &&
          window.systemversions) {
          return;
        }

        const result = await injectHelperScript("get_versions2", "systemversions");
        if (!result.ok || !result.value || typeof result.value !== "object") {
          logHelperError("get_versions2_failed", result.error || "helper script failed");
          return;
        }

        window.systemversions = result.value;
        lastVersionsRefreshAt = Date.now();
        window.dispatchEvent(new Event("irefinedx:systemversions-updated"));
      };

      const refreshLocalServiceDir = async () => {
        const result = await injectHelperScript("get_localservice_dir", "localservicedir");
        if (!result.ok || !result.value) {
          return;
        }

        window.localservicedir = result.value;
      };

      const refreshDownloadStatus = async () => {
        const result = await injectHelperScript("get_dload_status2", "downloadstatus");
        if (!result.ok || !result.value || typeof result.value !== "object") {
          logHelperError("get_dload_status2_failed", result.error || "helper script failed");
          return;
        }

        window.downloadstatus = result.value;
        const snapshot = JSON.stringify({
          diskfreek: result.value.diskfreek || 0,
          bActive: result.value.bActive || 0,
          nFiles: result.value.nFiles || 0,
          nComplete: result.value.nComplete || 0,
          nError: result.value.nError || 0,
          kTotal: result.value.kTotal || 0,
          kDownloaded: result.value.kDownloaded || 0,
          is_downloading: !!result.value.is_downloading,
          is_installing: !!result.value.is_installing
        });

        if (snapshot !== lastDownloadSnapshot) {
          lastDownloadSnapshot = snapshot;
          helperLog("downloadstatus", snapshot);
        }

        const currentState = {
          bActive: !!result.value.bActive,
          nFiles: Number(result.value.nFiles) || 0,
          nComplete: Number(result.value.nComplete) || 0,
          nError: Number(result.value.nError) || 0,
          kTotal: Number(result.value.kTotal) || 0,
          kDownloaded: Number(result.value.kDownloaded) || 0
        };

        const completedNow =
          !!lastDownloadState?.bActive &&
          !currentState.bActive &&
          isCompletedDownloadStatus(result.value);

        if (completedNow) {
          writeSuppressUntil(Date.now() + 120000);
          contentUpdateAutoStartAt = suppressAutoStartUntil;
          helperLog("contentUpdateCompleted", snapshot);
          await refreshSystemVersions(true);
          window.setTimeout(() => {
            refreshSystemVersions(true).catch(() => {});
          }, 2000);
          scheduleContentRefresh();
        }

        if (currentState.bActive) {
          writeSuppressUntil(0);
        }

        lastDownloadState = currentState;
      };

      const runRefreshCycle = () => {
        refreshDownloadStatus().finally(() => {
          maybeAutoStartContentUpdate();
        });
      };

      const startBridge = () => {
        refreshLocalServiceDir().catch(() => {});
        refreshSystemVersions().catch(() => {});
        runRefreshCycle();

        const pollHandle = window.setInterval(runRefreshCycle, 1500);
        const versionsHandle = window.setInterval(() => {
          refreshSystemVersions().catch(() => {});
        }, 300000);

        const observer = new MutationObserver(() => {
          maybeAutoStartContentUpdate();
        });

        if (document.documentElement) {
          observer.observe(document.documentElement, {
            childList: true,
            subtree: true
          });
        }

        window.addEventListener("beforeunload", () => {
          window.clearInterval(pollHandle);
          window.clearInterval(versionsHandle);
          if (completionReloadTimer) {
            window.clearTimeout(completionReloadTimer);
          }
          observer.disconnect();
        }, { once: true });
      };

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startBridge, { once: true });
      } else {
        startBridge();
      }
    })();
  `;
}

function buildJoinInterceptorScript() {
  return `
    (() => {
      if (window.__irefinedXJoinHookInstalled) {
        return;
      }

      window.__irefinedXJoinHookInstalled = true;
      const localJoinUrlPattern = /^http:\\/\\/127\\.0\\.0\\.1:32034\\/(?:goracing|gotesting|gonaked)\\b/i;
      const localJoinPathPattern = /^\\/(?:goracing|gotesting|gonaked)\\b/i;

      const normalizeLocalJoinUrl = (rawUrl) => {
        if (!rawUrl) {
          return null;
        }

        const text = String(rawUrl);
        try {
          if (localJoinPathPattern.test(text)) {
            return "http://127.0.0.1:32034" + text;
          }

          const parsed = new URL(text, window.location.href);
          return localJoinUrlPattern.test(parsed.href) ? parsed.href : null;
        } catch {
          return null;
        }
      };

      const startJoinFromUrl = (rawUrl, source) => {
        const url = normalizeLocalJoinUrl(rawUrl);
        if (!url || !window.interop || typeof window.interop.startSim !== "function") {
          return false;
        }

        try {
          window.interop.startSim(
            {
              task: "legacyJoinServer",
              parameters: url
            },
            null,
            false,
            "monitor"
          ).catch((error) => console.error("iRefinedX join hook failed", source, error));
          return true;
        } catch (error) {
          console.error("iRefinedX join hook failed", source, error);
          return false;
        }
      };

      const tryExtractLocalJoinUrl = (value, depth = 0) => {
        if (depth > 4 || value === null || value === undefined) {
          return null;
        }

        if (typeof value === "string") {
          const decoded = value
            .replace(/\\\\u0026/g, "&")
            .replace(/\\\\\\//g, "/")
            .replace(/&amp;/g, "&");
          const match = decoded.match(/(?:http:\\/\\/127\\.0\\.0\\.1:32034)?\\/(?:goracing|gotesting|gonaked)\\?[^"'\\\\\\]\\s<>]+/i);
          return match ? normalizeLocalJoinUrl(match[0]) : null;
        }

        if (Array.isArray(value)) {
          for (const entry of value) {
            const found = tryExtractLocalJoinUrl(entry, depth + 1);
            if (found) {
              return found;
            }
          }
          return null;
        }

        if (typeof value === "object") {
          for (const key of Object.keys(value)) {
            const found = tryExtractLocalJoinUrl(value[key], depth + 1);
            if (found) {
              return found;
            }
          }
        }

        return null;
      };

      const originalFetch = window.fetch;
      if (typeof originalFetch === "function") {
        window.fetch = function(input, init) {
          const url = typeof input === "string" ? input : input && input.url;
          if (startJoinFromUrl(url, "fetch")) {
            return Promise.resolve(new Response(null, { status: 204 }));
          }

          return originalFetch.apply(this, arguments).then((response) => {
            try {
              response.clone().text().then((text) => {
                const found = tryExtractLocalJoinUrl(text);
                if (found) {
                  startJoinFromUrl(found, "fetch-response");
                }
              }).catch(() => {});
            } catch {
            }
            return response;
          });
        };
      }

      const originalXhrOpen = window.XMLHttpRequest && window.XMLHttpRequest.prototype.open;
      const originalXhrSend = window.XMLHttpRequest && window.XMLHttpRequest.prototype.send;
      if (originalXhrOpen && originalXhrSend) {
        window.XMLHttpRequest.prototype.open = function(method, url) {
          this.__irefinedXRequest = { method, url };
          return originalXhrOpen.apply(this, arguments);
        };

        window.XMLHttpRequest.prototype.send = function() {
          const request = this.__irefinedXRequest || {};
          try {
            this.addEventListener("load", () => {
              try {
                const found = tryExtractLocalJoinUrl(this.responseText || "");
                if (found) {
                  startJoinFromUrl(found, "xhr-response");
                }
              } catch {
              }
            });
          } catch {
          }

          return originalXhrSend.apply(this, arguments);
        };
      }

      const originalWindowOpen = window.open;
      if (typeof originalWindowOpen === "function") {
        window.open = function(url) {
          if (startJoinFromUrl(url, "window-open")) {
            return null;
          }

          return originalWindowOpen.apply(this, arguments);
        };
      }

      document.addEventListener("click", (event) => {
        const target = event.target && event.target.closest ? event.target.closest("a[href]") : null;
        if (!target) {
          return;
        }

        const href = target.getAttribute("href");
        if (startJoinFromUrl(href, "anchor-click")) {
          event.preventDefault();
          event.stopPropagation();
        }
      }, true);
    })();
  `;
}

function buildIRefinedXUpdateNoticeScript() {
  return `
    (() => {
      if (window.__irxUpdateNoticeInstalled) {
        return;
      }

      window.__irxUpdateNoticeInstalled = true;

      const isMembersNg =
        (window.location.hostname || "").toLowerCase() === "members-ng.iracing.com" &&
        (window.location.pathname || "/").startsWith("/web/");

      if (!isMembersNg || !window.iRefinedXApp) {
        return;
      }

      const dismissKeyPrefix = "irx_update_dismissed_";

      const ensureStyle = () => {
        if (document.getElementById("irx-update-notice-style")) {
          return;
        }

        const style = document.createElement("style");
        style.id = "irx-update-notice-style";
        style.textContent = [
          "#irx-update-notice {",
          "  position: fixed;",
          "  top: 72px;",
          "  right: 18px;",
          "  width: min(360px, calc(100vw - 36px));",
          "  padding: 16px 18px;",
          "  border: 1px solid rgba(99, 130, 255, 0.32);",
          "  border-radius: 16px;",
          "  background: linear-gradient(180deg, rgba(12, 17, 29, 0.97), rgba(18, 26, 44, 0.97));",
          "  color: #eef4ff;",
          "  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.28);",
          "  backdrop-filter: blur(18px);",
          "  z-index: 10030;",
          "}",
          "html[data-theme='light'] #irx-update-notice {",
          "  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(244, 247, 252, 0.98));",
          "  color: #0f172a;",
          "  border-color: rgba(37, 99, 235, 0.22);",
          "  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.14);",
          "}",
          "#irx-update-notice .irx-update-eyebrow {",
          "  display: inline-flex;",
          "  align-items: center;",
          "  min-height: 24px;",
          "  padding: 0 10px;",
          "  border-radius: 999px;",
          "  background: rgba(67, 97, 238, 0.16);",
          "  color: #9dc3ff;",
          "  font-size: 11px;",
          "  font-weight: 900;",
          "  letter-spacing: 0.06em;",
          "  text-transform: uppercase;",
          "}",
          "html[data-theme='light'] #irx-update-notice .irx-update-eyebrow {",
          "  background: rgba(37, 99, 235, 0.1);",
          "  color: #1d4ed8;",
          "}",
          "#irx-update-notice .irx-update-title {",
          "  margin: 10px 0 6px;",
          "  font-size: 21px;",
          "  font-weight: 900;",
          "  line-height: 1.1;",
          "}",
          "#irx-update-notice .irx-update-copy {",
          "  margin: 0;",
          "  color: rgba(238, 244, 255, 0.84);",
          "  font-size: 14px;",
          "  line-height: 1.45;",
          "}",
          "html[data-theme='light'] #irx-update-notice .irx-update-copy {",
          "  color: rgba(15, 23, 42, 0.72);",
          "}",
          "#irx-update-notice .irx-update-actions {",
          "  display: flex;",
          "  gap: 10px;",
          "  margin-top: 14px;",
          "  flex-wrap: wrap;",
          "}",
          "#irx-update-notice button {",
          "  min-height: 38px;",
          "  padding: 0 14px;",
          "  border-radius: 10px;",
          "  border: 1px solid transparent;",
          "  font-size: 13px;",
          "  font-weight: 800;",
          "}",
          "#irx-update-notice .irx-update-primary {",
          "  background: linear-gradient(180deg, #2d6cff, #1d4ed8);",
          "  color: #ffffff;",
          "}",
          "#irx-update-notice .irx-update-secondary {",
          "  background: rgba(148, 163, 184, 0.14);",
          "  border-color: rgba(148, 163, 184, 0.22);",
          "  color: inherit;",
          "}",
          "@media (max-width: 720px) {",
          "  #irx-update-notice { top: 62px; right: 12px; left: 12px; width: auto; }",
          "}",
        ].join("\\n");
        (document.head || document.documentElement).appendChild(style);
      };

      const removeExisting = () => {
        document.querySelectorAll("#irx-update-notice").forEach((node) => node.remove());
      };

      const showNotice = (info) => {
        const versionKey = String(info.latestVersion || "").trim() || "latest";
        if (window.localStorage.getItem(dismissKeyPrefix + versionKey) === "1") {
          return;
        }

        ensureStyle();
        removeExisting();

        const root = document.createElement("div");
        root.id = "irx-update-notice";

        const eyebrow = document.createElement("div");
        eyebrow.className = "irx-update-eyebrow";
        eyebrow.textContent = "Update available";

        const title = document.createElement("div");
        title.className = "irx-update-title";
        title.textContent = "iRefinedX " + versionKey;

        const copy = document.createElement("p");
        copy.className = "irx-update-copy";
        copy.textContent = "A newer release is ready. Download the latest installer to update iRefinedX safely.";

        const actions = document.createElement("div");
        actions.className = "irx-update-actions";

        const downloadButton = document.createElement("button");
        downloadButton.type = "button";
        downloadButton.className = "irx-update-primary";
        downloadButton.textContent = "Download update";
        downloadButton.addEventListener("click", () => {
          window.iRefinedXApp.openLatestRelease(info.downloadUrl || info.releaseUrl);
        });

        const laterButton = document.createElement("button");
        laterButton.type = "button";
        laterButton.className = "irx-update-secondary";
        laterButton.textContent = "Later";
        laterButton.addEventListener("click", () => {
          window.localStorage.setItem(dismissKeyPrefix + versionKey, "1");
          root.remove();
        });

        actions.append(downloadButton, laterButton);
        root.append(eyebrow, title, copy, actions);
        (document.body || document.documentElement).appendChild(root);
      };

      const check = async () => {
        try {
          const info = await window.iRefinedXApp.checkForUpdates({ force: false });
          if (info && info.updateAvailable) {
            showNotice(info);
          }
        } catch (error) {
          console.error("iRefinedX update check failed.", error);
        }
      };

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
          window.setTimeout(check, 3500);
        }, { once: true });
      } else {
        window.setTimeout(check, 3500);
      }
    })();
  `;
}

function buildNativeRegistrationTimerScript() {
  return `
    (() => {
      if (window.__irefinedXNativeRegistrationTimerInstalled) {
        return;
      }

      window.__irefinedXNativeRegistrationTimerInstalled = true;

      const registrationStateKey = "iref_registration_state";
      const fallbackStateKey = "ps_native_registration_timer_state";
      const timerClass = "ps-native-registration-timer";
      const timedClass = "ps-native-registration-banner-timed";

      const ensureStyle = () => {
        if (document.getElementById("ps-native-registration-timer-style")) {
          return;
        }

        const style = document.createElement("style");
        style.id = "ps-native-registration-timer-style";
        style.textContent = [
          "." + timedClass + " {",
          "  gap: 14px !important;",
          "}",
          "." + timerClass + " {",
          "  display: inline-flex !important;",
          "  align-items: center !important;",
          "  justify-content: center !important;",
          "  min-height: 32px !important;",
          "  padding: 0 11px !important;",
          "  margin-left: auto !important;",
          "  margin-right: 10px !important;",
          "  border: 1px solid rgba(235, 250, 229, 0.22) !important;",
          "  border-radius: 999px !important;",
          "  background: rgba(14, 45, 12, 0.28) !important;",
          "  color: rgb(235, 250, 229) !important;",
          "  font-size: 13px !important;",
          "  font-weight: 800 !important;",
          "  letter-spacing: 0.01em !important;",
          "  line-height: 1 !important;",
          "  white-space: nowrap !important;",
          "  flex: 0 0 auto !important;",
          "}",
          "@media (max-width: 900px) {",
          "  ." + timerClass + " {",
          "    margin-left: 8px !important;",
          "    margin-right: 8px !important;",
          "    font-size: 12px !important;",
          "    padding: 0 9px !important;",
          "  }",
          "}",
        ].join("\\n");
        (document.head || document.documentElement).appendChild(style);
      };

      const normalizedText = (element) => String(element && (element.innerText || element.textContent) || "")
        .replace(/\\s+/g, " ")
        .trim();

      const readRegistrationState = () => {
        try {
          const parsed = JSON.parse(window.localStorage.getItem(registrationStateKey) || "null");
          if (!parsed || parsed.status !== "registered" || !parsed.start_time) {
            return null;
          }

          const startMs = Date.parse(parsed.start_time);
          if (!Number.isFinite(startMs)) {
            return null;
          }

          return {
            startMs,
            seasonName: String(parsed.season_name || "").trim(),
            carName: String(parsed.car_name || "").trim(),
          };
        } catch {
          return null;
        }
      };

      const getBannerSeasonName = (banner) => {
        const parts = Array.from(banner.querySelectorAll("p,span,div"))
          .map((element) => normalizedText(element))
          .filter(Boolean);
        const registeredIndex = parts.findIndex((part) => /^Registered$/i.test(part));
        if (registeredIndex >= 0) {
          const next = parts.slice(registeredIndex + 1).find((part) => !/^(Withdraw|Join|Race|Practice|Spectate)/i.test(part));
          if (next) {
            return next;
          }
        }

        return normalizedText(banner)
          .replace(/^Registered\\s+/i, "")
          .replace(/\\s+(Withdraw|Join|Race|Practice|Spectate).*$/i, "")
          .trim();
      };

      const buildLocalStartMsFromClockTime = (clockTime) => {
        const match = String(clockTime || "").match(/\\b([01]?\\d|2[0-3]):([0-5]\\d)\\b/);
        if (!match) {
          return null;
        }

        const now = new Date();
        const start = new Date(now);
        start.setHours(Number(match[1]), Number(match[2]), 0, 0);

        if (start.getTime() - now.getTime() > 12 * 60 * 60 * 1000) {
          start.setDate(start.getDate() - 1);
        } else if (now.getTime() - start.getTime() > 12 * 60 * 60 * 1000) {
          start.setDate(start.getDate() + 1);
        }

        return start.getTime();
      };

      const readCachedFallbackState = (banner) => {
        try {
          const parsed = JSON.parse(window.localStorage.getItem(fallbackStateKey) || "null");
          if (!parsed || !Number.isFinite(parsed.startMs)) {
            return null;
          }

          const bannerSeason = getBannerSeasonName(banner).toLowerCase();
          const cachedSeason = String(parsed.seasonName || "").toLowerCase();
          if (bannerSeason && cachedSeason && bannerSeason !== cachedSeason) {
            return null;
          }

          if (Date.now() - Number(parsed.updatedAt || 0) > 24 * 60 * 60 * 1000) {
            return null;
          }

          return {
            startMs: Number(parsed.startMs),
            seasonName: String(parsed.seasonName || getBannerSeasonName(banner) || "").trim(),
            carName: "",
          };
        } catch {
          return null;
        }
      };

      const inferStateFromPage = (banner) => {
        const scroll = document.getElementById("scroll");
        const pageText = normalizedText(scroll || document.body);
        const nextRaceIndex = pageText.search(/\\bNext Race\\b/i);
        const scope = nextRaceIndex >= 0
          ? pageText.slice(nextRaceIndex, nextRaceIndex + 700)
          : pageText.slice(0, 2400);
        const timeMatch = scope.match(/\\b([01]?\\d|2[0-3]):([0-5]\\d)\\b/);
        const startMs = timeMatch ? buildLocalStartMsFromClockTime(timeMatch[0]) : null;

        if (!Number.isFinite(startMs)) {
          return readCachedFallbackState(banner);
        }

        const state = {
          startMs,
          seasonName: getBannerSeasonName(banner),
          carName: "",
        };

        try {
          window.localStorage.setItem(fallbackStateKey, JSON.stringify({
            startMs: state.startMs,
            seasonName: state.seasonName,
            updatedAt: Date.now(),
          }));
        } catch {
        }

        return state;
      };

      const visibleRect = (element) => {
        if (!element || typeof element.getBoundingClientRect !== "function") {
          return null;
        }

        const rect = element.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) {
          return null;
        }

        const style = window.getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
          return null;
        }

        return rect;
      };

      const looksGreen = (element) => {
        const color = window.getComputedStyle(element).backgroundColor || "";
        const match = color.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/i);
        if (!match) {
          return false;
        }

        const red = Number(match[1]);
        const green = Number(match[2]);
        const blue = Number(match[3]);
        return green > red + 35 && green > blue + 20;
      };

      const isNativeRegistrationBanner = (element, state) => {
        const rect = visibleRect(element);
        if (!rect || rect.y > 220 || rect.width < 420 || rect.height < 44 || rect.height > 120) {
          return false;
        }

        const text = normalizedText(element);
        if (!/\\bRegistered\\b/i.test(text) || !/\\bWithdraw\\b/i.test(text)) {
          return false;
        }

        if (state && state.seasonName && !text.toLowerCase().includes(state.seasonName.toLowerCase())) {
          return false;
        }

        return looksGreen(element);
      };

      const findNativeRegistrationBanner = (state) => {
        const scroll = document.getElementById("scroll");
        const roots = [];
        if (scroll) {
          roots.push(...Array.from(scroll.children));
        }
        roots.push(...Array.from(document.querySelectorAll("body div")));

        let best = null;
        let bestScore = -Infinity;

        for (const element of roots) {
          if (!isNativeRegistrationBanner(element, state)) {
            continue;
          }

          const rect = element.getBoundingClientRect();
          const childCount = element.children ? element.children.length : 0;
          const score = (220 - rect.y) + Math.min(rect.width / 20, 80) - childCount;
          if (score > bestScore) {
            best = element;
            bestScore = score;
          }
        }

        return best;
      };

      const formatDuration = (milliseconds) => {
        let totalSeconds = Math.max(0, Math.floor(Math.abs(milliseconds) / 1000));
        const hours = Math.floor(totalSeconds / 3600);
        totalSeconds -= hours * 3600;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds - minutes * 60;

        if (hours > 0) {
          return String(hours) + "h " + String(minutes).padStart(2, "0") + "m";
        }

        if (minutes > 0) {
          return String(minutes) + "m " + String(seconds).padStart(2, "0") + "s";
        }

        return String(seconds) + "s";
      };

      const getTimerText = (startMs) => {
        const diff = startMs - Date.now();
        if (diff > 0) {
          return "Starts in " + formatDuration(diff);
        }

        const elapsed = Math.abs(diff);
        if (elapsed < 1000) {
          return "Started just now";
        }

        return "Started " + formatDuration(elapsed) + " ago";
      };

      const getActionContainer = (banner) => Array.from(banner.children || []).find((child) => {
        const text = normalizedText(child);
        return /\\b(Withdraw|Join|Race|Practice|Spectate)\\b/i.test(text) && child.querySelector("a,button");
      });

      const removeTimers = () => {
        document.querySelectorAll("." + timerClass).forEach((element) => element.remove());
        document.querySelectorAll("." + timedClass).forEach((element) => element.classList.remove(timedClass));
      };

      const updateTimer = () => {
        if (!document.body) {
          return;
        }

        ensureStyle();

        let state = readRegistrationState();
        let banner = findNativeRegistrationBanner(state);
        if (!banner && !state) {
          banner = findNativeRegistrationBanner(null);
        }

        if (!banner) {
          removeTimers();
          return;
        }

        if (!state) {
          state = inferStateFromPage(banner);
        }

        if (!state) {
          removeTimers();
          return;
        }

        document.querySelectorAll("." + timerClass).forEach((element) => {
          if (!banner.contains(element)) {
            element.remove();
          }
        });

        let timer = banner.querySelector("." + timerClass);
        if (!timer) {
          timer = document.createElement("div");
          timer.className = timerClass;
        }

        timer.textContent = getTimerText(state.startMs);
        timer.title = state.seasonName
          ? state.seasonName + " session time"
          : "Registered session time";

        const actionContainer = getActionContainer(banner);
        if (actionContainer && actionContainer.parentElement === banner && actionContainer !== timer) {
          banner.insertBefore(timer, actionContainer);
        } else if (timer.parentElement !== banner) {
          banner.appendChild(timer);
        }

        banner.classList.add(timedClass);
      };

      const scheduleUpdate = () => {
        window.requestAnimationFrame(updateTimer);
      };

      window.setInterval(updateTimer, 1000);
      window.addEventListener("storage", (event) => {
        if (!event.key || event.key === registrationStateKey) {
          scheduleUpdate();
        }
      });
      window.addEventListener("popstate", scheduleUpdate);

      if (document.body) {
        new MutationObserver(scheduleUpdate).observe(document.body, {
          childList: true,
          subtree: true,
        });
      } else {
        document.addEventListener("DOMContentLoaded", () => {
          if (document.body) {
            new MutationObserver(scheduleUpdate).observe(document.body, {
              childList: true,
              subtree: true,
            });
          }
          updateTimer();
        }, { once: true });
      }

      updateTimer();
      window.setTimeout(updateTimer, 250);
      window.setTimeout(updateTimer, 1000);
      window.setTimeout(updateTimer, 2500);
    })();
  `;
}

function injectMainWorldScript(source) {
  const run = () => {
    if (!document.documentElement) {
      return false;
    }

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.textContent = source;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
    return true;
  };

  if (!run()) {
    window.addEventListener("DOMContentLoaded", () => {
      run();
    }, { once: true });
    window.setTimeout(run, 0);
  }
}

injectMainWorldScript(buildIRefinedBootstrapScript());
injectMainWorldScript(buildLocalServiceBridgeScript());
injectMainWorldScript(buildJoinInterceptorScript());
injectMainWorldScript(buildIRefinedXUpdateNoticeScript());
