const path = require("node:path");

let koffi = null;

try {
  koffi = require("koffi");
} catch {
  koffi = null;
}

class NativeIRacingBridge {
  constructor({ appendDiagnostic, emitSimStatus, sendBridgeEvent, getMainWindow }) {
    this.appendDiagnostic = appendDiagnostic;
    this.emitSimStatus = emitSimStatus;
    this.sendBridgeEvent = sendBridgeEvent;
    this.getMainWindow = getMainWindow;
    this.dll = null;
    this.dllPath = "";
    this.registered = false;
    this.viewerStarted = false;
    this.callbackHandles = [];
    this.windowMessageHooked = false;
    this.backgroundColor = "000000";
    this.paintWatcher = null;
    this.paintState = {
      car: false,
      carNumber: false,
      decal: false,
      specTga: false,
      specMip: false,
    };
  }

  log(kind, details) {
    try {
      this.appendDiagnostic(`native-${kind}`, details);
    } catch {
    }
  }

  load(dllPath) {
    this.dllPath = dllPath || "";
    if (!koffi || !this.dllPath) {
      this.log("load-skipped", koffi ? "missing dll path" : "missing koffi");
      return false;
    }

    if (this.dll) {
      return true;
    }

    try {
      const dllDirectory = path.dirname(this.dllPath);
      if (dllDirectory) {
        process.chdir(dllDirectory);
      }
      this.dll = koffi.load(this.dllPath);
      this.log("load", this.dllPath);
      this.installCallbacks();
      return true;
    } catch (error) {
      this.dll = null;
      this.log("load-error", String((error && error.message) || error));
      return false;
    }
  }

  isAvailable() {
    return !!this.dll;
  }

  call(name, resultType, argTypes, args = [], fallback = undefined) {
    if (!this.dll) {
      return fallback;
    }

    try {
      const fn = this.dll.func("__stdcall", name, resultType, argTypes);
      return fn(...args);
    } catch (error) {
      this.log("call-error", `${name}: ${String((error && error.message) || error)}`);
      return fallback;
    }
  }

  registerCallback(fn, proto) {
    if (!koffi || !this.dll) {
      return null;
    }

    try {
      const handle = koffi.register(fn, koffi.pointer(proto));
      this.callbackHandles.push(handle);
      return handle;
    } catch (error) {
      this.log("callback-error", String((error && error.message) || error));
      return null;
    }
  }

  installCallbacks() {
    if (!koffi || !this.dll) {
      return;
    }

    const notifySimAttach = koffi.proto("NotifySimAttachCallBackFctType", "void", ["int"]);
    const notify = koffi.proto("NotifyCallBackFctType", "void", []);
    const notifyProgress = koffi.proto("NotifyLoadingProgressCallBackFctType", "void", ["string", "int"]);
    const notifyError = koffi.proto("NotifyLoadingErrorFctType", "void", ["string"]);

    const onAttached = this.registerCallback((finished) => {
      const isFinished = Number(finished) === 1;
      this.emitSimStatus("Sim Loading", isFinished ? "Sim attached." : "Sim attaching.");
    }, notifySimAttach);
    if (onAttached) {
      this.call("uiNotifyOnSimAttached", "void", [koffi.pointer(notifySimAttach)], [onAttached]);
    }

    const onDetached = this.registerCallback(() => {
      this.emitSimStatus("Sim Inactive", "Sessao finalizada.");
      const win = this.getMainWindow();
      if (win && !win.isDestroyed()) {
        try {
          win.setProgressBar(-1);
          if (!win.isVisible()) {
            win.show();
          }
        } catch {
        }
      }
    }, notify);
    if (onDetached) {
      this.call("uiNotifyOnSimDetached", "void", [koffi.pointer(notify)], [onDetached]);
    }

    const onComplete = this.registerCallback(() => {
      this.emitSimStatus("Sim Running", "Sim carregado.");
      const win = this.getMainWindow();
      if (win && !win.isDestroyed()) {
        try {
          win.setProgressBar(-1);
          win.minimize();
        } catch {
        }
      }
    }, notify);
    if (onComplete) {
      this.call("uiNotifyOnLoadingComplete", "void", [koffi.pointer(notify)], [onComplete]);
    }

    const onProgress = this.registerCallback((message, percent) => {
      const numericPercent = Math.max(0, Math.min(100, Number(percent) || 0));
      this.emitSimStatus("Sim Loading", String(message || ""), numericPercent);
      const win = this.getMainWindow();
      if (win && !win.isDestroyed()) {
        try {
          win.setProgressBar(numericPercent / 100);
        } catch {
        }
      }
    }, notifyProgress);
    if (onProgress) {
      this.call("uiNotifyOnLoadingProgress", "void", [koffi.pointer(notifyProgress)], [onProgress]);
    }

    const onError = this.registerCallback((message) => {
      this.emitSimStatus("Sim Inactive", String(message || "Erro ao carregar o sim."));
      const win = this.getMainWindow();
      if (win && !win.isDestroyed()) {
        try {
          win.setProgressBar(1, { mode: "error" });
          if (!win.isVisible()) {
            win.show();
          }
        } catch {
        }
      }
    }, notifyError);
    if (onError) {
      this.call("uiNotifyOnLoadingError", "void", [koffi.pointer(notifyError)], [onError]);
    }
  }

  registerWindow(win) {
    if (!this.dll || !win || win.isDestroyed() || this.registered) {
      return false;
    }

    try {
      const hwnd = win.getNativeWindowHandle().readUInt32LE(0);
      const hostOk = !!this.call("iRacingHostRegister", "bool", ["uint64"], [hwnd], false);
      const viewerOk = !!this.call("viewerSupportBegin", "bool", ["uint64"], [hwnd], false);
      this.registered = hostOk;
      this.viewerStarted = viewerOk;
      this.log("register-window", JSON.stringify({ hwnd, hostOk, viewerOk }));

      if (!this.windowMessageHooked && typeof win.hookWindowMessage === "function") {
        win.hookWindowMessage(75040, (wParam) => {
          try {
            this.call("onNotifyMsgRecv", "void", ["int"], [wParam.readUInt32LE(0)]);
          } catch {
          }
        });
        this.windowMessageHooked = true;
      }

      this.viewerSetFrameWindowBGColor(this.backgroundColor);
      return hostOk || viewerOk;
    } catch (error) {
      this.log("register-window-error", String((error && error.message) || error));
      return false;
    }
  }

  deregister() {
    this.closePaintWatcher();
    try {
      if (this.viewerStarted) {
        this.call("viewerSupportEnd", "void", [], []);
      }
      if (this.registered) {
        this.call("iRacingHostDeregister", "void", [], []);
      }
      for (const handle of this.callbackHandles) {
        try {
          koffi.unregister(handle);
        } catch {
        }
      }
    } finally {
      this.callbackHandles = [];
      this.registered = false;
      this.viewerStarted = false;
    }
  }

  setHideSimDuringLoadingMode(enabled) {
    return this.call("setIsHideSimDuringLoadingMode", "void", ["bool"], [!!enabled], null);
  }

  isIRacingUIRegistered() {
    return !!this.call("isIRacingUIRegistered", "char", [], [], 0);
  }

  isTransparencyEnabled() {
    return !!this.call("isTransparencyEnabled", "bool", [], [], false);
  }

  getVersions() {
    if (!koffi || !this.dll) {
      return null;
    }

    try {
      const output = [""];
      const ok = this.dll.func("__stdcall", "getVersions", "bool", [
        koffi.out(koffi.pointer("char", 2)),
      ])(output);
      if (!ok || !output[0]) {
        return null;
      }
      return JSON.parse(output[0]);
    } catch (error) {
      this.log("get-versions-error", String((error && error.message) || error));
      return null;
    }
  }

  getReplayList(start = 0, end = -1) {
    const raw = this.call("getReplayList", "string", ["int", "int"], [
      Number(start) || 0,
      Number.isFinite(Number(end)) ? Number(end) : -1,
    ], "");
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  startService() {
    return !!this.call("start_iRacingService", "bool", [], [], false);
  }

  stopService() {
    return !!this.call("stop_iRacingService", "bool", [], [], false);
  }

  setPingServers({ custId, servers }) {
    const serverList = Array.isArray(servers) ? servers.join(",") : String(servers || "");
    this.call("setPingServers", "void", ["string"], [`u=${Number(custId) || 0}&s=${serverList}`]);
    return true;
  }

  getPingTimes() {
    const raw = this.call("getPingTimes", "string", [], [], "");
    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  stopPinging() {
    this.call("stopPinging", "void", [], []);
    return true;
  }

  isAVConnected() {
    return !!this.call("isAVConnected", "bool", [], [], false);
  }

  viewerLoginRefresh(token, cookies) {
    return Number(this.call("viewerLoginRefresh", "int", ["string", "string"], [
      String(token || ""),
      String(cookies || ""),
    ], 0)) || 0;
  }

  getCarWebImage(outputPath, request = {}) {
    const paint = request.paint || {};
    return !!this.call(
      "getCarWebImage",
      "bool",
      ["string", "int", "int", "string", "int", "int", "int", "string", "int", "int", "string", "string", "string", "string", "string", "int", "string", "string", "int", "string", "string", "string"],
      [
        String(outputPath || ""),
        Number(request.size) || 0,
        0,
        String(request.licenseColor || "FFFFFF"),
        Number(request.flair) || 0,
        Number(paint.sponsor1) || 0,
        Number(paint.sponsor2) || 0,
        String(request.teamName || ""),
        Number(paint.number_font) || 0,
        Number(paint.number_slant) || 0,
        String(paint.number_color1 || "000000"),
        String(paint.number_color2 || "000000"),
        String(paint.number_color3 || "000000"),
        String(paint.car_number || "00"),
        String(request.carPath || ""),
        Number.isFinite(Number(request.carConfig)) ? Number(request.carConfig) : -1,
        String(request.carConfigSubDir || ""),
        String(request.carConfigCustomPaintExt || ""),
        Number(paint.pattern) || 0,
        String(paint.color1 || "000000"),
        String(paint.color2 || "000000"),
        String(paint.color3 || "000000"),
      ],
      false
    );
  }

  viewerSetPathDetails(keys) {
    return !!this.call("viewerSetPathDetails", "bool", ["string"], [String(keys || "")], false);
  }

  viewerSetFrameWindowBGColor(color) {
    this.backgroundColor = String(color || "000000");
    this.call("viewerSetFrameWindowBGColor", "void", ["string"], [this.backgroundColor]);
  }

  viewerCreateView(dimensions, zoomFactor = 1) {
    const rect = this.scaleRect(dimensions, zoomFactor);
    if (!rect) {
      return false;
    }

    const created = !!this.call("viewerCreateView", "bool", ["int", "int", "int", "int", "int"], [
      0,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
    ], false);
    if (created) {
      this.call("viewerLoadBackgroundObject", "bool", ["int", "string", "string"], [
        0,
        "cars",
        "ui_bg.3do",
      ], false);
    }
    return created;
  }

  viewerResize(dimensions, zoomFactor = 1) {
    const rect = this.scaleRect(dimensions, zoomFactor);
    if (!rect) {
      return false;
    }
    return !!this.call("viewerRepositionView", "bool", ["int", "int", "int", "int", "int"], [
      0,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
    ], false);
  }

  viewerDeleteView() {
    return !!this.call("viewerDeleteView", "bool", ["int"], [0], false);
  }

  viewerLoadObject({ type, objPath, carCfg = -1, carCfgSubDir = "", carCfgCustomPaintExt = "" } = {}) {
    const itemType = Number(type) || 0;
    let directory = "";
    let objectName = "";

    if (itemType === 0) {
      directory = String(objPath || "");
      objectName = `${directory.substring(directory.lastIndexOf("\\") + 1)}_ui.3do`;
    } else if (itemType === 1) {
      directory = "cars";
      objectName = `driver_body_0${objPath || 1}_ui_anim.3do`;
    } else if (itemType === 2) {
      directory = "cars";
      objectName = "driver_helmet.3do";
    } else {
      return false;
    }

    return !!this.call("viewerLoadObject", "bool", ["int", "int", "string", "string", "int", "string", "string"], [
      0,
      itemType,
      directory,
      objectName,
      Number(carCfg) || -1,
      String(carCfgSubDir || ""),
      String(carCfgCustomPaintExt || ""),
    ], false);
  }

  viewerSetDriverHeadType(id) {
    this.call("viewerSetDriverHeadType", "void", ["int", "int"], [0, Number(id) || 0]);
  }

  viewerPaintItem(payload = {}) {
    const itemType = Number(payload.itemType) || 0;
    const carNumber = payload.car_number === undefined ? "64" : String(payload.car_number);
    const ok = !!this.call(
      "viewerPaintItem",
      "bool",
      ["int", "int", "int", "string", "string", "string", "string", "int", "bool", "bool", "int", "int", "string", "string", "string", "string", "int", "int", "int", "bool", "string", "bool"],
      [
        0,
        itemType,
        Number(payload.pattern) || 0,
        String(payload.color1 || "000000"),
        String(payload.color2 || "000000"),
        String(payload.color3 || "000000"),
        String(payload.licenseColor || "FFFFFF"),
        Number(payload.cust_id) || 0,
        payload.allowCustomPaint !== false,
        !!payload.skipDecals,
        Number(payload.number_font) || 0,
        Number(payload.number_slant) || 0,
        String(payload.number_color1 || "000000"),
        String(payload.number_color2 || "000000"),
        String(payload.number_color3 || "000000"),
        carNumber,
        Number(payload.sponsor1) || 0,
        Number(payload.sponsor2) || 0,
        Number(payload.club_id) || 0,
        !!payload.skipStamps,
        String(payload.onCarName || ""),
        !!payload.skipName,
      ],
      false
    );

    if (itemType === 0) {
      if (payload.wheelColor || Number.isFinite(Number(payload.wheelMaterial))) {
        this.call("viewerPaintWheelsCustom", "bool", ["int", "string", "int"], [
          0,
          String(payload.wheelColor || "000000"),
          Number(payload.wheelMaterial) || 0,
        ], false);
      } else {
        this.call("viewerPaintWheelsDefault", "bool", ["int"], [0], false);
      }
    }

    return ok;
  }

  scaleRect(dimensions, zoomFactor) {
    if (!Array.isArray(dimensions) || dimensions.length < 4) {
      return null;
    }

    const win = this.getMainWindow();
    const scale = Number(zoomFactor) || 1;
    const rect = {
      x: Math.ceil((Number(dimensions[0]) || 0) * scale),
      y: Math.ceil((Number(dimensions[1]) || 0) * scale),
      width: Math.ceil((Number(dimensions[2]) || 0) * scale),
      height: Math.ceil((Number(dimensions[3]) || 0) * scale),
    };

    if (win && !win.isDestroyed() && typeof win.constructor.getFocusedWindow !== "function") {
      return rect;
    }

    return rect;
  }

  closePaintWatcher() {
    if (this.paintWatcher) {
      try {
        this.paintWatcher.close();
      } catch {
      }
      this.paintWatcher = null;
    }
  }
}

module.exports = {
  NativeIRacingBridge,
};
