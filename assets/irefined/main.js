const se = /* @__PURE__ */ Object.create(null);
se.open = "0";
se.close = "1";
se.ping = "2";
se.pong = "3";
se.message = "4";
se.upgrade = "5";
se.noop = "6";
const qt = /* @__PURE__ */ Object.create(null);
Object.keys(se).forEach((e) => {
  qt[se[e]] = e;
});
const mn = { type: "error", data: "parser error" }, es = typeof Blob == "function" || typeof Blob < "u" && Object.prototype.toString.call(Blob) === "[object BlobConstructor]", ts = typeof ArrayBuffer == "function", ns = (e) => typeof ArrayBuffer.isView == "function" ? ArrayBuffer.isView(e) : e && e.buffer instanceof ArrayBuffer, Ln = ({ type: e, data: t }, n, i) => es && t instanceof Blob ? n ? i(t) : fi(t, i) : ts && (t instanceof ArrayBuffer || ns(t)) ? n ? i(t) : fi(new Blob([t]), i) : i(se[e] + (t || "")), fi = (e, t) => {
  const n = new FileReader();
  return n.onload = function() {
    const i = n.result.split(",")[1];
    t("b" + (i || ""));
  }, n.readAsDataURL(e);
};
function mi(e) {
  return e instanceof Uint8Array ? e : e instanceof ArrayBuffer ? new Uint8Array(e) : new Uint8Array(e.buffer, e.byteOffset, e.byteLength);
}
let nn;
function ha(e, t) {
  if (es && e.data instanceof Blob)
    return e.data.arrayBuffer().then(mi).then(t);
  if (ts && (e.data instanceof ArrayBuffer || ns(e.data)))
    return t(mi(e.data));
  Ln(e, !1, (n) => {
    nn || (nn = new TextEncoder()), t(nn.encode(n));
  });
}
const _i = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", Ke = typeof Uint8Array > "u" ? [] : new Uint8Array(256);
for (let e = 0; e < _i.length; e++)
  Ke[_i.charCodeAt(e)] = e;
const fa = (e) => {
  let t = e.length * 0.75, n = e.length, i, s = 0, r, a, o, c;
  e[e.length - 1] === "=" && (t--, e[e.length - 2] === "=" && t--);
  const u = new ArrayBuffer(t), l = new Uint8Array(u);
  for (i = 0; i < n; i += 4)
    r = Ke[e.charCodeAt(i)], a = Ke[e.charCodeAt(i + 1)], o = Ke[e.charCodeAt(i + 2)], c = Ke[e.charCodeAt(i + 3)], l[s++] = r << 2 | a >> 4, l[s++] = (a & 15) << 4 | o >> 2, l[s++] = (o & 3) << 6 | c & 63;
  return u;
}, ma = typeof ArrayBuffer == "function", In = (e, t) => {
  if (typeof e != "string")
    return {
      type: "message",
      data: is(e, t)
    };
  const n = e.charAt(0);
  return n === "b" ? {
    type: "message",
    data: _a(e.substring(1), t)
  } : qt[n] ? e.length > 1 ? {
    type: qt[n],
    data: e.substring(1)
  } : {
    type: qt[n]
  } : mn;
}, _a = (e, t) => {
  if (ma) {
    const n = fa(e);
    return is(n, t);
  } else
    return { base64: !0, data: e };
}, is = (e, t) => {
  switch (t) {
    case "blob":
      return e instanceof Blob ? e : new Blob([e]);
    case "arraybuffer":
    default:
      return e instanceof ArrayBuffer ? e : e.buffer;
  }
}, ss = "", ba = (e, t) => {
  const n = e.length, i = new Array(n);
  let s = 0;
  e.forEach((r, a) => {
    Ln(r, !1, (o) => {
      i[a] = o, ++s === n && t(i.join(ss));
    });
  });
}, ya = (e, t) => {
  const n = e.split(ss), i = [];
  for (let s = 0; s < n.length; s++) {
    const r = In(n[s], t);
    if (i.push(r), r.type === "error")
      break;
  }
  return i;
};
function va() {
  return new TransformStream({
    transform(e, t) {
      ha(e, (n) => {
        const i = n.length;
        let s;
        if (i < 126)
          s = new Uint8Array(1), new DataView(s.buffer).setUint8(0, i);
        else if (i < 65536) {
          s = new Uint8Array(3);
          const r = new DataView(s.buffer);
          r.setUint8(0, 126), r.setUint16(1, i);
        } else {
          s = new Uint8Array(9);
          const r = new DataView(s.buffer);
          r.setUint8(0, 127), r.setBigUint64(1, BigInt(i));
        }
        e.data && typeof e.data != "string" && (s[0] |= 128), t.enqueue(s), t.enqueue(n);
      });
    }
  });
}
let sn;
function pt(e) {
  return e.reduce((t, n) => t + n.length, 0);
}
function gt(e, t) {
  if (e[0].length === t)
    return e.shift();
  const n = new Uint8Array(t);
  let i = 0;
  for (let s = 0; s < t; s++)
    n[s] = e[0][i++], i === e[0].length && (e.shift(), i = 0);
  return e.length && i < e[0].length && (e[0] = e[0].slice(i)), n;
}
function Aa(e, t) {
  sn || (sn = new TextDecoder());
  const n = [];
  let i = 0, s = -1, r = !1;
  return new TransformStream({
    transform(a, o) {
      for (n.push(a); ; ) {
        if (i === 0) {
          if (pt(n) < 1)
            break;
          const c = gt(n, 1);
          r = (c[0] & 128) === 128, s = c[0] & 127, s < 126 ? i = 3 : s === 126 ? i = 1 : i = 2;
        } else if (i === 1) {
          if (pt(n) < 2)
            break;
          const c = gt(n, 2);
          s = new DataView(c.buffer, c.byteOffset, c.length).getUint16(0), i = 3;
        } else if (i === 2) {
          if (pt(n) < 8)
            break;
          const c = gt(n, 8), u = new DataView(c.buffer, c.byteOffset, c.length), l = u.getUint32(0);
          if (l > Math.pow(2, 21) - 1) {
            o.enqueue(mn);
            break;
          }
          s = l * Math.pow(2, 32) + u.getUint32(4), i = 3;
        } else {
          if (pt(n) < s)
            break;
          const c = gt(n, s);
          o.enqueue(In(r ? c : sn.decode(c), t)), i = 0;
        }
        if (s === 0 || s > e) {
          o.enqueue(mn);
          break;
        }
      }
    }
  });
}
const rs = 4;
function C(e) {
  if (e) return wa(e);
}
function wa(e) {
  for (var t in C.prototype)
    e[t] = C.prototype[t];
  return e;
}
C.prototype.on = C.prototype.addEventListener = function(e, t) {
  return this._callbacks = this._callbacks || {}, (this._callbacks["$" + e] = this._callbacks["$" + e] || []).push(t), this;
};
C.prototype.once = function(e, t) {
  function n() {
    this.off(e, n), t.apply(this, arguments);
  }
  return n.fn = t, this.on(e, n), this;
};
C.prototype.off = C.prototype.removeListener = C.prototype.removeAllListeners = C.prototype.removeEventListener = function(e, t) {
  if (this._callbacks = this._callbacks || {}, arguments.length == 0)
    return this._callbacks = {}, this;
  var n = this._callbacks["$" + e];
  if (!n) return this;
  if (arguments.length == 1)
    return delete this._callbacks["$" + e], this;
  for (var i, s = 0; s < n.length; s++)
    if (i = n[s], i === t || i.fn === t) {
      n.splice(s, 1);
      break;
    }
  return n.length === 0 && delete this._callbacks["$" + e], this;
};
C.prototype.emit = function(e) {
  this._callbacks = this._callbacks || {};
  for (var t = new Array(arguments.length - 1), n = this._callbacks["$" + e], i = 1; i < arguments.length; i++)
    t[i - 1] = arguments[i];
  if (n) {
    n = n.slice(0);
    for (var i = 0, s = n.length; i < s; ++i)
      n[i].apply(this, t);
  }
  return this;
};
C.prototype.emitReserved = C.prototype.emit;
C.prototype.listeners = function(e) {
  return this._callbacks = this._callbacks || {}, this._callbacks["$" + e] || [];
};
C.prototype.hasListeners = function(e) {
  return !!this.listeners(e).length;
};
const $t = typeof Promise == "function" && typeof Promise.resolve == "function" ? (t) => Promise.resolve().then(t) : (t, n) => n(t, 0), V = typeof self < "u" ? self : typeof window < "u" ? window : Function("return this")(), Sa = "arraybuffer";
function as(e, ...t) {
  return t.reduce((n, i) => (e.hasOwnProperty(i) && (n[i] = e[i]), n), {});
}
const ka = V.setTimeout, qa = V.clearTimeout;
function Ft(e, t) {
  t.useNativeTimers ? (e.setTimeoutFn = ka.bind(V), e.clearTimeoutFn = qa.bind(V)) : (e.setTimeoutFn = V.setTimeout.bind(V), e.clearTimeoutFn = V.clearTimeout.bind(V));
}
const xa = 1.33;
function Ca(e) {
  return typeof e == "string" ? Ea(e) : Math.ceil((e.byteLength || e.size) * xa);
}
function Ea(e) {
  let t = 0, n = 0;
  for (let i = 0, s = e.length; i < s; i++)
    t = e.charCodeAt(i), t < 128 ? n += 1 : t < 2048 ? n += 2 : t < 55296 || t >= 57344 ? n += 3 : (i++, n += 4);
  return n;
}
function os() {
  return Date.now().toString(36).substring(3) + Math.random().toString(36).substring(2, 5);
}
function Ra(e) {
  let t = "";
  for (let n in e)
    e.hasOwnProperty(n) && (t.length && (t += "&"), t += encodeURIComponent(n) + "=" + encodeURIComponent(e[n]));
  return t;
}
function Na(e) {
  let t = {}, n = e.split("&");
  for (let i = 0, s = n.length; i < s; i++) {
    let r = n[i].split("=");
    t[decodeURIComponent(r[0])] = decodeURIComponent(r[1]);
  }
  return t;
}
class Ta extends Error {
  constructor(t, n, i) {
    super(t), this.description = n, this.context = i, this.type = "TransportError";
  }
}
class On extends C {
  /**
   * Transport abstract constructor.
   *
   * @param {Object} opts - options
   * @protected
   */
  constructor(t) {
    super(), this.writable = !1, Ft(this, t), this.opts = t, this.query = t.query, this.socket = t.socket, this.supportsBinary = !t.forceBase64;
  }
  /**
   * Emits an error.
   *
   * @param {String} reason
   * @param description
   * @param context - the error context
   * @return {Transport} for chaining
   * @protected
   */
  onError(t, n, i) {
    return super.emitReserved("error", new Ta(t, n, i)), this;
  }
  /**
   * Opens the transport.
   */
  open() {
    return this.readyState = "opening", this.doOpen(), this;
  }
  /**
   * Closes the transport.
   */
  close() {
    return (this.readyState === "opening" || this.readyState === "open") && (this.doClose(), this.onClose()), this;
  }
  /**
   * Sends multiple packets.
   *
   * @param {Array} packets
   */
  send(t) {
    this.readyState === "open" && this.write(t);
  }
  /**
   * Called upon open
   *
   * @protected
   */
  onOpen() {
    this.readyState = "open", this.writable = !0, super.emitReserved("open");
  }
  /**
   * Called with data.
   *
   * @param {String} data
   * @protected
   */
  onData(t) {
    const n = In(t, this.socket.binaryType);
    this.onPacket(n);
  }
  /**
   * Called with a decoded packet.
   *
   * @protected
   */
  onPacket(t) {
    super.emitReserved("packet", t);
  }
  /**
   * Called upon close.
   *
   * @protected
   */
  onClose(t) {
    this.readyState = "closed", super.emitReserved("close", t);
  }
  /**
   * Pauses the transport, in order not to lose packets during an upgrade.
   *
   * @param onPause
   */
  pause(t) {
  }
  createUri(t, n = {}) {
    return t + "://" + this._hostname() + this._port() + this.opts.path + this._query(n);
  }
  _hostname() {
    const t = this.opts.hostname;
    return t.indexOf(":") === -1 ? t : "[" + t + "]";
  }
  _port() {
    return this.opts.port && (this.opts.secure && +(this.opts.port !== 443) || !this.opts.secure && Number(this.opts.port) !== 80) ? ":" + this.opts.port : "";
  }
  _query(t) {
    const n = Ra(t);
    return n.length ? "?" + n : "";
  }
}
class za extends On {
  constructor() {
    super(...arguments), this._polling = !1;
  }
  get name() {
    return "polling";
  }
  /**
   * Opens the socket (triggers polling). We write a PING message to determine
   * when the transport is open.
   *
   * @protected
   */
  doOpen() {
    this._poll();
  }
  /**
   * Pauses polling.
   *
   * @param {Function} onPause - callback upon buffers are flushed and transport is paused
   * @package
   */
  pause(t) {
    this.readyState = "pausing";
    const n = () => {
      this.readyState = "paused", t();
    };
    if (this._polling || !this.writable) {
      let i = 0;
      this._polling && (i++, this.once("pollComplete", function() {
        --i || n();
      })), this.writable || (i++, this.once("drain", function() {
        --i || n();
      }));
    } else
      n();
  }
  /**
   * Starts polling cycle.
   *
   * @private
   */
  _poll() {
    this._polling = !0, this.doPoll(), this.emitReserved("poll");
  }
  /**
   * Overloads onData to detect payloads.
   *
   * @protected
   */
  onData(t) {
    const n = (i) => {
      if (this.readyState === "opening" && i.type === "open" && this.onOpen(), i.type === "close")
        return this.onClose({ description: "transport closed by the server" }), !1;
      this.onPacket(i);
    };
    ya(t, this.socket.binaryType).forEach(n), this.readyState !== "closed" && (this._polling = !1, this.emitReserved("pollComplete"), this.readyState === "open" && this._poll());
  }
  /**
   * For polling, send a close packet.
   *
   * @protected
   */
  doClose() {
    const t = () => {
      this.write([{ type: "close" }]);
    };
    this.readyState === "open" ? t() : this.once("open", t);
  }
  /**
   * Writes a packets payload.
   *
   * @param {Array} packets - data packets
   * @protected
   */
  write(t) {
    this.writable = !1, ba(t, (n) => {
      this.doWrite(n, () => {
        this.writable = !0, this.emitReserved("drain");
      });
    });
  }
  /**
   * Generates uri for connection.
   *
   * @private
   */
  uri() {
    const t = this.opts.secure ? "https" : "http", n = this.query || {};
    return this.opts.timestampRequests !== !1 && (n[this.opts.timestampParam] = os()), !this.supportsBinary && !n.sid && (n.b64 = 1), this.createUri(t, n);
  }
}
let cs = !1;
try {
  cs = typeof XMLHttpRequest < "u" && "withCredentials" in new XMLHttpRequest();
} catch {
}
const Da = cs;
function La() {
}
class Ia extends za {
  /**
   * XHR Polling constructor.
   *
   * @param {Object} opts
   * @package
   */
  constructor(t) {
    if (super(t), typeof location < "u") {
      const n = location.protocol === "https:";
      let i = location.port;
      i || (i = n ? "443" : "80"), this.xd = typeof location < "u" && t.hostname !== location.hostname || i !== t.port;
    }
  }
  /**
   * Sends data.
   *
   * @param {String} data to send.
   * @param {Function} called upon flush.
   * @private
   */
  doWrite(t, n) {
    const i = this.request({
      method: "POST",
      data: t
    });
    i.on("success", n), i.on("error", (s, r) => {
      this.onError("xhr post error", s, r);
    });
  }
  /**
   * Starts a poll cycle.
   *
   * @private
   */
  doPoll() {
    const t = this.request();
    t.on("data", this.onData.bind(this)), t.on("error", (n, i) => {
      this.onError("xhr poll error", n, i);
    }), this.pollXhr = t;
  }
}
class te extends C {
  /**
   * Request constructor
   *
   * @param {Object} options
   * @package
   */
  constructor(t, n, i) {
    super(), this.createRequest = t, Ft(this, i), this._opts = i, this._method = i.method || "GET", this._uri = n, this._data = i.data !== void 0 ? i.data : null, this._create();
  }
  /**
   * Creates the XHR object and sends the request.
   *
   * @private
   */
  _create() {
    var t;
    const n = as(this._opts, "agent", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
    n.xdomain = !!this._opts.xd;
    const i = this._xhr = this.createRequest(n);
    try {
      i.open(this._method, this._uri, !0);
      try {
        if (this._opts.extraHeaders) {
          i.setDisableHeaderCheck && i.setDisableHeaderCheck(!0);
          for (let s in this._opts.extraHeaders)
            this._opts.extraHeaders.hasOwnProperty(s) && i.setRequestHeader(s, this._opts.extraHeaders[s]);
        }
      } catch {
      }
      if (this._method === "POST")
        try {
          i.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
        } catch {
        }
      try {
        i.setRequestHeader("Accept", "*/*");
      } catch {
      }
      (t = this._opts.cookieJar) === null || t === void 0 || t.addCookies(i), "withCredentials" in i && (i.withCredentials = this._opts.withCredentials), this._opts.requestTimeout && (i.timeout = this._opts.requestTimeout), i.onreadystatechange = () => {
        var s;
        i.readyState === 3 && ((s = this._opts.cookieJar) === null || s === void 0 || s.parseCookies(
          // @ts-ignore
          i.getResponseHeader("set-cookie")
        )), i.readyState === 4 && (i.status === 200 || i.status === 1223 ? this._onLoad() : this.setTimeoutFn(() => {
          this._onError(typeof i.status == "number" ? i.status : 0);
        }, 0));
      }, i.send(this._data);
    } catch (s) {
      this.setTimeoutFn(() => {
        this._onError(s);
      }, 0);
      return;
    }
    typeof document < "u" && (this._index = te.requestsCount++, te.requests[this._index] = this);
  }
  /**
   * Called upon error.
   *
   * @private
   */
  _onError(t) {
    this.emitReserved("error", t, this._xhr), this._cleanup(!0);
  }
  /**
   * Cleans up house.
   *
   * @private
   */
  _cleanup(t) {
    if (!(typeof this._xhr > "u" || this._xhr === null)) {
      if (this._xhr.onreadystatechange = La, t)
        try {
          this._xhr.abort();
        } catch {
        }
      typeof document < "u" && delete te.requests[this._index], this._xhr = null;
    }
  }
  /**
   * Called upon load.
   *
   * @private
   */
  _onLoad() {
    const t = this._xhr.responseText;
    t !== null && (this.emitReserved("data", t), this.emitReserved("success"), this._cleanup());
  }
  /**
   * Aborts the request.
   *
   * @package
   */
  abort() {
    this._cleanup();
  }
}
te.requestsCount = 0;
te.requests = {};
if (typeof document < "u") {
  if (typeof attachEvent == "function")
    attachEvent("onunload", bi);
  else if (typeof addEventListener == "function") {
    const e = "onpagehide" in V ? "pagehide" : "unload";
    addEventListener(e, bi, !1);
  }
}
function bi() {
  for (let e in te.requests)
    te.requests.hasOwnProperty(e) && te.requests[e].abort();
}
const Oa = (function() {
  const e = ls({
    xdomain: !1
  });
  return e && e.responseType !== null;
})();
class Ba extends Ia {
  constructor(t) {
    super(t);
    const n = t && t.forceBase64;
    this.supportsBinary = Oa && !n;
  }
  request(t = {}) {
    return Object.assign(t, { xd: this.xd }, this.opts), new te(ls, this.uri(), t);
  }
}
function ls(e) {
  const t = e.xdomain;
  try {
    if (typeof XMLHttpRequest < "u" && (!t || Da))
      return new XMLHttpRequest();
  } catch {
  }
  if (!t)
    try {
      return new V[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
    } catch {
    }
}
const us = typeof navigator < "u" && typeof navigator.product == "string" && navigator.product.toLowerCase() === "reactnative";
class ja extends On {
  get name() {
    return "websocket";
  }
  doOpen() {
    const t = this.uri(), n = this.opts.protocols, i = us ? {} : as(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");
    this.opts.extraHeaders && (i.headers = this.opts.extraHeaders);
    try {
      this.ws = this.createSocket(t, n, i);
    } catch (s) {
      return this.emitReserved("error", s);
    }
    this.ws.binaryType = this.socket.binaryType, this.addEventListeners();
  }
  /**
   * Adds event listeners to the socket
   *
   * @private
   */
  addEventListeners() {
    this.ws.onopen = () => {
      this.opts.autoUnref && this.ws._socket.unref(), this.onOpen();
    }, this.ws.onclose = (t) => this.onClose({
      description: "websocket connection closed",
      context: t
    }), this.ws.onmessage = (t) => this.onData(t.data), this.ws.onerror = (t) => this.onError("websocket error", t);
  }
  write(t) {
    this.writable = !1;
    for (let n = 0; n < t.length; n++) {
      const i = t[n], s = n === t.length - 1;
      Ln(i, this.supportsBinary, (r) => {
        try {
          this.doWrite(i, r);
        } catch {
        }
        s && $t(() => {
          this.writable = !0, this.emitReserved("drain");
        }, this.setTimeoutFn);
      });
    }
  }
  doClose() {
    typeof this.ws < "u" && (this.ws.onerror = () => {
    }, this.ws.close(), this.ws = null);
  }
  /**
   * Generates uri for connection.
   *
   * @private
   */
  uri() {
    const t = this.opts.secure ? "wss" : "ws", n = this.query || {};
    return this.opts.timestampRequests && (n[this.opts.timestampParam] = os()), this.supportsBinary || (n.b64 = 1), this.createUri(t, n);
  }
}
const rn = V.WebSocket || V.MozWebSocket;
class Ma extends ja {
  createSocket(t, n, i) {
    return us ? new rn(t, n, i) : n ? new rn(t, n) : new rn(t);
  }
  doWrite(t, n) {
    this.ws.send(n);
  }
}
class $a extends On {
  get name() {
    return "webtransport";
  }
  doOpen() {
    try {
      this._transport = new WebTransport(this.createUri("https"), this.opts.transportOptions[this.name]);
    } catch (t) {
      return this.emitReserved("error", t);
    }
    this._transport.closed.then(() => {
      this.onClose();
    }).catch((t) => {
      this.onError("webtransport error", t);
    }), this._transport.ready.then(() => {
      this._transport.createBidirectionalStream().then((t) => {
        const n = Aa(Number.MAX_SAFE_INTEGER, this.socket.binaryType), i = t.readable.pipeThrough(n).getReader(), s = va();
        s.readable.pipeTo(t.writable), this._writer = s.writable.getWriter();
        const r = () => {
          i.read().then(({ done: o, value: c }) => {
            o || (this.onPacket(c), r());
          }).catch((o) => {
          });
        };
        r();
        const a = { type: "open" };
        this.query.sid && (a.data = `{"sid":"${this.query.sid}"}`), this._writer.write(a).then(() => this.onOpen());
      });
    });
  }
  write(t) {
    this.writable = !1;
    for (let n = 0; n < t.length; n++) {
      const i = t[n], s = n === t.length - 1;
      this._writer.write(i).then(() => {
        s && $t(() => {
          this.writable = !0, this.emitReserved("drain");
        }, this.setTimeoutFn);
      });
    }
  }
  doClose() {
    var t;
    (t = this._transport) === null || t === void 0 || t.close();
  }
}
const Fa = {
  websocket: Ma,
  webtransport: $a,
  polling: Ba
}, Wa = /^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/, Ha = [
  "source",
  "protocol",
  "authority",
  "userInfo",
  "user",
  "password",
  "host",
  "port",
  "relative",
  "path",
  "directory",
  "file",
  "query",
  "anchor"
];
function _n(e) {
  if (e.length > 8e3)
    throw "URI too long";
  const t = e, n = e.indexOf("["), i = e.indexOf("]");
  n != -1 && i != -1 && (e = e.substring(0, n) + e.substring(n, i).replace(/:/g, ";") + e.substring(i, e.length));
  let s = Wa.exec(e || ""), r = {}, a = 14;
  for (; a--; )
    r[Ha[a]] = s[a] || "";
  return n != -1 && i != -1 && (r.source = t, r.host = r.host.substring(1, r.host.length - 1).replace(/;/g, ":"), r.authority = r.authority.replace("[", "").replace("]", "").replace(/;/g, ":"), r.ipv6uri = !0), r.pathNames = Ua(r, r.path), r.queryKey = Pa(r, r.query), r;
}
function Ua(e, t) {
  const n = /\/{2,9}/g, i = t.replace(n, "/").split("/");
  return (t.slice(0, 1) == "/" || t.length === 0) && i.splice(0, 1), t.slice(-1) == "/" && i.splice(i.length - 1, 1), i;
}
function Pa(e, t) {
  const n = {};
  return t.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function(i, s, r) {
    s && (n[s] = r);
  }), n;
}
const bn = typeof addEventListener == "function" && typeof removeEventListener == "function", xt = [];
bn && addEventListener("offline", () => {
  xt.forEach((e) => e());
}, !1);
class he extends C {
  /**
   * Socket constructor.
   *
   * @param {String|Object} uri - uri or options
   * @param {Object} opts - options
   */
  constructor(t, n) {
    if (super(), this.binaryType = Sa, this.writeBuffer = [], this._prevBufferLen = 0, this._pingInterval = -1, this._pingTimeout = -1, this._maxPayload = -1, this._pingTimeoutTime = 1 / 0, t && typeof t == "object" && (n = t, t = null), t) {
      const i = _n(t);
      n.hostname = i.host, n.secure = i.protocol === "https" || i.protocol === "wss", n.port = i.port, i.query && (n.query = i.query);
    } else n.host && (n.hostname = _n(n.host).host);
    Ft(this, n), this.secure = n.secure != null ? n.secure : typeof location < "u" && location.protocol === "https:", n.hostname && !n.port && (n.port = this.secure ? "443" : "80"), this.hostname = n.hostname || (typeof location < "u" ? location.hostname : "localhost"), this.port = n.port || (typeof location < "u" && location.port ? location.port : this.secure ? "443" : "80"), this.transports = [], this._transportsByName = {}, n.transports.forEach((i) => {
      const s = i.prototype.name;
      this.transports.push(s), this._transportsByName[s] = i;
    }), this.opts = Object.assign({
      path: "/engine.io",
      agent: !1,
      withCredentials: !1,
      upgrade: !0,
      timestampParam: "t",
      rememberUpgrade: !1,
      addTrailingSlash: !0,
      rejectUnauthorized: !0,
      perMessageDeflate: {
        threshold: 1024
      },
      transportOptions: {},
      closeOnBeforeunload: !1
    }, n), this.opts.path = this.opts.path.replace(/\/$/, "") + (this.opts.addTrailingSlash ? "/" : ""), typeof this.opts.query == "string" && (this.opts.query = Na(this.opts.query)), bn && (this.opts.closeOnBeforeunload && (this._beforeunloadEventListener = () => {
      this.transport && (this.transport.removeAllListeners(), this.transport.close());
    }, addEventListener("beforeunload", this._beforeunloadEventListener, !1)), this.hostname !== "localhost" && (this._offlineEventListener = () => {
      this._onClose("transport close", {
        description: "network connection lost"
      });
    }, xt.push(this._offlineEventListener))), this.opts.withCredentials && (this._cookieJar = void 0), this._open();
  }
  /**
   * Creates transport of the given type.
   *
   * @param {String} name - transport name
   * @return {Transport}
   * @private
   */
  createTransport(t) {
    const n = Object.assign({}, this.opts.query);
    n.EIO = rs, n.transport = t, this.id && (n.sid = this.id);
    const i = Object.assign({}, this.opts, {
      query: n,
      socket: this,
      hostname: this.hostname,
      secure: this.secure,
      port: this.port
    }, this.opts.transportOptions[t]);
    return new this._transportsByName[t](i);
  }
  /**
   * Initializes transport to use and starts probe.
   *
   * @private
   */
  _open() {
    if (this.transports.length === 0) {
      this.setTimeoutFn(() => {
        this.emitReserved("error", "No transports available");
      }, 0);
      return;
    }
    const t = this.opts.rememberUpgrade && he.priorWebsocketSuccess && this.transports.indexOf("websocket") !== -1 ? "websocket" : this.transports[0];
    this.readyState = "opening";
    const n = this.createTransport(t);
    n.open(), this.setTransport(n);
  }
  /**
   * Sets the current transport. Disables the existing one (if any).
   *
   * @private
   */
  setTransport(t) {
    this.transport && this.transport.removeAllListeners(), this.transport = t, t.on("drain", this._onDrain.bind(this)).on("packet", this._onPacket.bind(this)).on("error", this._onError.bind(this)).on("close", (n) => this._onClose("transport close", n));
  }
  /**
   * Called when connection is deemed open.
   *
   * @private
   */
  onOpen() {
    this.readyState = "open", he.priorWebsocketSuccess = this.transport.name === "websocket", this.emitReserved("open"), this.flush();
  }
  /**
   * Handles a packet.
   *
   * @private
   */
  _onPacket(t) {
    if (this.readyState === "opening" || this.readyState === "open" || this.readyState === "closing")
      switch (this.emitReserved("packet", t), this.emitReserved("heartbeat"), t.type) {
        case "open":
          this.onHandshake(JSON.parse(t.data));
          break;
        case "ping":
          this._sendPacket("pong"), this.emitReserved("ping"), this.emitReserved("pong"), this._resetPingTimeout();
          break;
        case "error":
          const n = new Error("server error");
          n.code = t.data, this._onError(n);
          break;
        case "message":
          this.emitReserved("data", t.data), this.emitReserved("message", t.data);
          break;
      }
  }
  /**
   * Called upon handshake completion.
   *
   * @param {Object} data - handshake obj
   * @private
   */
  onHandshake(t) {
    this.emitReserved("handshake", t), this.id = t.sid, this.transport.query.sid = t.sid, this._pingInterval = t.pingInterval, this._pingTimeout = t.pingTimeout, this._maxPayload = t.maxPayload, this.onOpen(), this.readyState !== "closed" && this._resetPingTimeout();
  }
  /**
   * Sets and resets ping timeout timer based on server pings.
   *
   * @private
   */
  _resetPingTimeout() {
    this.clearTimeoutFn(this._pingTimeoutTimer);
    const t = this._pingInterval + this._pingTimeout;
    this._pingTimeoutTime = Date.now() + t, this._pingTimeoutTimer = this.setTimeoutFn(() => {
      this._onClose("ping timeout");
    }, t), this.opts.autoUnref && this._pingTimeoutTimer.unref();
  }
  /**
   * Called on `drain` event
   *
   * @private
   */
  _onDrain() {
    this.writeBuffer.splice(0, this._prevBufferLen), this._prevBufferLen = 0, this.writeBuffer.length === 0 ? this.emitReserved("drain") : this.flush();
  }
  /**
   * Flush write buffers.
   *
   * @private
   */
  flush() {
    if (this.readyState !== "closed" && this.transport.writable && !this.upgrading && this.writeBuffer.length) {
      const t = this._getWritablePackets();
      this.transport.send(t), this._prevBufferLen = t.length, this.emitReserved("flush");
    }
  }
  /**
   * Ensure the encoded size of the writeBuffer is below the maxPayload value sent by the server (only for HTTP
   * long-polling)
   *
   * @private
   */
  _getWritablePackets() {
    if (!(this._maxPayload && this.transport.name === "polling" && this.writeBuffer.length > 1))
      return this.writeBuffer;
    let n = 1;
    for (let i = 0; i < this.writeBuffer.length; i++) {
      const s = this.writeBuffer[i].data;
      if (s && (n += Ca(s)), i > 0 && n > this._maxPayload)
        return this.writeBuffer.slice(0, i);
      n += 2;
    }
    return this.writeBuffer;
  }
  /**
   * Checks whether the heartbeat timer has expired but the socket has not yet been notified.
   *
   * Note: this method is private for now because it does not really fit the WebSocket API, but if we put it in the
   * `write()` method then the message would not be buffered by the Socket.IO client.
   *
   * @return {boolean}
   * @private
   */
  /* private */
  _hasPingExpired() {
    if (!this._pingTimeoutTime)
      return !0;
    const t = Date.now() > this._pingTimeoutTime;
    return t && (this._pingTimeoutTime = 0, $t(() => {
      this._onClose("ping timeout");
    }, this.setTimeoutFn)), t;
  }
  /**
   * Sends a message.
   *
   * @param {String} msg - message.
   * @param {Object} options.
   * @param {Function} fn - callback function.
   * @return {Socket} for chaining.
   */
  write(t, n, i) {
    return this._sendPacket("message", t, n, i), this;
  }
  /**
   * Sends a message. Alias of {@link Socket#write}.
   *
   * @param {String} msg - message.
   * @param {Object} options.
   * @param {Function} fn - callback function.
   * @return {Socket} for chaining.
   */
  send(t, n, i) {
    return this._sendPacket("message", t, n, i), this;
  }
  /**
   * Sends a packet.
   *
   * @param {String} type: packet type.
   * @param {String} data.
   * @param {Object} options.
   * @param {Function} fn - callback function.
   * @private
   */
  _sendPacket(t, n, i, s) {
    if (typeof n == "function" && (s = n, n = void 0), typeof i == "function" && (s = i, i = null), this.readyState === "closing" || this.readyState === "closed")
      return;
    i = i || {}, i.compress = i.compress !== !1;
    const r = {
      type: t,
      data: n,
      options: i
    };
    this.emitReserved("packetCreate", r), this.writeBuffer.push(r), s && this.once("flush", s), this.flush();
  }
  /**
   * Closes the connection.
   */
  close() {
    const t = () => {
      this._onClose("forced close"), this.transport.close();
    }, n = () => {
      this.off("upgrade", n), this.off("upgradeError", n), t();
    }, i = () => {
      this.once("upgrade", n), this.once("upgradeError", n);
    };
    return (this.readyState === "opening" || this.readyState === "open") && (this.readyState = "closing", this.writeBuffer.length ? this.once("drain", () => {
      this.upgrading ? i() : t();
    }) : this.upgrading ? i() : t()), this;
  }
  /**
   * Called upon transport error
   *
   * @private
   */
  _onError(t) {
    if (he.priorWebsocketSuccess = !1, this.opts.tryAllTransports && this.transports.length > 1 && this.readyState === "opening")
      return this.transports.shift(), this._open();
    this.emitReserved("error", t), this._onClose("transport error", t);
  }
  /**
   * Called upon transport close.
   *
   * @private
   */
  _onClose(t, n) {
    if (this.readyState === "opening" || this.readyState === "open" || this.readyState === "closing") {
      if (this.clearTimeoutFn(this._pingTimeoutTimer), this.transport.removeAllListeners("close"), this.transport.close(), this.transport.removeAllListeners(), bn && (this._beforeunloadEventListener && removeEventListener("beforeunload", this._beforeunloadEventListener, !1), this._offlineEventListener)) {
        const i = xt.indexOf(this._offlineEventListener);
        i !== -1 && xt.splice(i, 1);
      }
      this.readyState = "closed", this.id = null, this.emitReserved("close", t, n), this.writeBuffer = [], this._prevBufferLen = 0;
    }
  }
}
he.protocol = rs;
class Va extends he {
  constructor() {
    super(...arguments), this._upgrades = [];
  }
  onOpen() {
    if (super.onOpen(), this.readyState === "open" && this.opts.upgrade)
      for (let t = 0; t < this._upgrades.length; t++)
        this._probe(this._upgrades[t]);
  }
  /**
   * Probes a transport.
   *
   * @param {String} name - transport name
   * @private
   */
  _probe(t) {
    let n = this.createTransport(t), i = !1;
    he.priorWebsocketSuccess = !1;
    const s = () => {
      i || (n.send([{ type: "ping", data: "probe" }]), n.once("packet", (g) => {
        if (!i)
          if (g.type === "pong" && g.data === "probe") {
            if (this.upgrading = !0, this.emitReserved("upgrading", n), !n)
              return;
            he.priorWebsocketSuccess = n.name === "websocket", this.transport.pause(() => {
              i || this.readyState !== "closed" && (l(), this.setTransport(n), n.send([{ type: "upgrade" }]), this.emitReserved("upgrade", n), n = null, this.upgrading = !1, this.flush());
            });
          } else {
            const f = new Error("probe error");
            f.transport = n.name, this.emitReserved("upgradeError", f);
          }
      }));
    };
    function r() {
      i || (i = !0, l(), n.close(), n = null);
    }
    const a = (g) => {
      const f = new Error("probe error: " + g);
      f.transport = n.name, r(), this.emitReserved("upgradeError", f);
    };
    function o() {
      a("transport closed");
    }
    function c() {
      a("socket closed");
    }
    function u(g) {
      n && g.name !== n.name && r();
    }
    const l = () => {
      n.removeListener("open", s), n.removeListener("error", a), n.removeListener("close", o), this.off("close", c), this.off("upgrading", u);
    };
    n.once("open", s), n.once("error", a), n.once("close", o), this.once("close", c), this.once("upgrading", u), this._upgrades.indexOf("webtransport") !== -1 && t !== "webtransport" ? this.setTimeoutFn(() => {
      i || n.open();
    }, 200) : n.open();
  }
  onHandshake(t) {
    this._upgrades = this._filterUpgrades(t.upgrades), super.onHandshake(t);
  }
  /**
   * Filters upgrades, returning only those matching client transports.
   *
   * @param {Array} upgrades - server upgrades
   * @private
   */
  _filterUpgrades(t) {
    const n = [];
    for (let i = 0; i < t.length; i++)
      ~this.transports.indexOf(t[i]) && n.push(t[i]);
    return n;
  }
}
let Ka = class extends Va {
  constructor(t, n = {}) {
    const i = typeof t == "object" ? t : n;
    (!i.transports || i.transports && typeof i.transports[0] == "string") && (i.transports = (i.transports || ["polling", "websocket", "webtransport"]).map((s) => Fa[s]).filter((s) => !!s)), super(t, i);
  }
};
function Qa(e, t = "", n) {
  let i = e;
  n = n || typeof location < "u" && location, e == null && (e = n.protocol + "//" + n.host), typeof e == "string" && (e.charAt(0) === "/" && (e.charAt(1) === "/" ? e = n.protocol + e : e = n.host + e), /^(https?|wss?):\/\//.test(e) || (typeof n < "u" ? e = n.protocol + "//" + e : e = "https://" + e), i = _n(e)), i.port || (/^(http|ws)$/.test(i.protocol) ? i.port = "80" : /^(http|ws)s$/.test(i.protocol) && (i.port = "443")), i.path = i.path || "/";
  const r = i.host.indexOf(":") !== -1 ? "[" + i.host + "]" : i.host;
  return i.id = i.protocol + "://" + r + ":" + i.port + t, i.href = i.protocol + "://" + r + (n && n.port === i.port ? "" : ":" + i.port), i;
}
const Ga = typeof ArrayBuffer == "function", Ja = (e) => typeof ArrayBuffer.isView == "function" ? ArrayBuffer.isView(e) : e.buffer instanceof ArrayBuffer, ds = Object.prototype.toString, Ya = typeof Blob == "function" || typeof Blob < "u" && ds.call(Blob) === "[object BlobConstructor]", Xa = typeof File == "function" || typeof File < "u" && ds.call(File) === "[object FileConstructor]";
function Bn(e) {
  return Ga && (e instanceof ArrayBuffer || Ja(e)) || Ya && e instanceof Blob || Xa && e instanceof File;
}
function Ct(e, t) {
  if (!e || typeof e != "object")
    return !1;
  if (Array.isArray(e)) {
    for (let n = 0, i = e.length; n < i; n++)
      if (Ct(e[n]))
        return !0;
    return !1;
  }
  if (Bn(e))
    return !0;
  if (e.toJSON && typeof e.toJSON == "function" && arguments.length === 1)
    return Ct(e.toJSON(), !0);
  for (const n in e)
    if (Object.prototype.hasOwnProperty.call(e, n) && Ct(e[n]))
      return !0;
  return !1;
}
function Za(e) {
  const t = [], n = e.data, i = e;
  return i.data = yn(n, t), i.attachments = t.length, { packet: i, buffers: t };
}
function yn(e, t) {
  if (!e)
    return e;
  if (Bn(e)) {
    const n = { _placeholder: !0, num: t.length };
    return t.push(e), n;
  } else if (Array.isArray(e)) {
    const n = new Array(e.length);
    for (let i = 0; i < e.length; i++)
      n[i] = yn(e[i], t);
    return n;
  } else if (typeof e == "object" && !(e instanceof Date)) {
    const n = {};
    for (const i in e)
      Object.prototype.hasOwnProperty.call(e, i) && (n[i] = yn(e[i], t));
    return n;
  }
  return e;
}
function eo(e, t) {
  return e.data = vn(e.data, t), delete e.attachments, e;
}
function vn(e, t) {
  if (!e)
    return e;
  if (e && e._placeholder === !0) {
    if (typeof e.num == "number" && e.num >= 0 && e.num < t.length)
      return t[e.num];
    throw new Error("illegal attachments");
  } else if (Array.isArray(e))
    for (let n = 0; n < e.length; n++)
      e[n] = vn(e[n], t);
  else if (typeof e == "object")
    for (const n in e)
      Object.prototype.hasOwnProperty.call(e, n) && (e[n] = vn(e[n], t));
  return e;
}
const to = [
  "connect",
  // used on the client side
  "connect_error",
  // used on the client side
  "disconnect",
  // used on both sides
  "disconnecting",
  // used on the server side
  "newListener",
  // used by the Node.js EventEmitter
  "removeListener"
  // used by the Node.js EventEmitter
];
var A;
(function(e) {
  e[e.CONNECT = 0] = "CONNECT", e[e.DISCONNECT = 1] = "DISCONNECT", e[e.EVENT = 2] = "EVENT", e[e.ACK = 3] = "ACK", e[e.CONNECT_ERROR = 4] = "CONNECT_ERROR", e[e.BINARY_EVENT = 5] = "BINARY_EVENT", e[e.BINARY_ACK = 6] = "BINARY_ACK";
})(A || (A = {}));
class no {
  /**
   * Encoder constructor
   *
   * @param {function} replacer - custom replacer to pass down to JSON.parse
   */
  constructor(t) {
    this.replacer = t;
  }
  /**
   * Encode a packet as a single string if non-binary, or as a
   * buffer sequence, depending on packet type.
   *
   * @param {Object} obj - packet object
   */
  encode(t) {
    return (t.type === A.EVENT || t.type === A.ACK) && Ct(t) ? this.encodeAsBinary({
      type: t.type === A.EVENT ? A.BINARY_EVENT : A.BINARY_ACK,
      nsp: t.nsp,
      data: t.data,
      id: t.id
    }) : [this.encodeAsString(t)];
  }
  /**
   * Encode packet as string.
   */
  encodeAsString(t) {
    let n = "" + t.type;
    return (t.type === A.BINARY_EVENT || t.type === A.BINARY_ACK) && (n += t.attachments + "-"), t.nsp && t.nsp !== "/" && (n += t.nsp + ","), t.id != null && (n += t.id), t.data != null && (n += JSON.stringify(t.data, this.replacer)), n;
  }
  /**
   * Encode packet as 'buffer sequence' by removing blobs, and
   * deconstructing packet into object with placeholders and
   * a list of buffers.
   */
  encodeAsBinary(t) {
    const n = Za(t), i = this.encodeAsString(n.packet), s = n.buffers;
    return s.unshift(i), s;
  }
}
class jn extends C {
  /**
   * Decoder constructor
   */
  constructor(t) {
    super(), this.opts = Object.assign({
      reviver: void 0,
      maxAttachments: 10
    }, typeof t == "function" ? { reviver: t } : t);
  }
  /**
   * Decodes an encoded packet string into packet JSON.
   *
   * @param {String} obj - encoded packet
   */
  add(t) {
    let n;
    if (typeof t == "string") {
      if (this.reconstructor)
        throw new Error("got plaintext data when reconstructing a packet");
      n = this.decodeString(t);
      const i = n.type === A.BINARY_EVENT;
      i || n.type === A.BINARY_ACK ? (n.type = i ? A.EVENT : A.ACK, this.reconstructor = new io(n), n.attachments === 0 && super.emitReserved("decoded", n)) : super.emitReserved("decoded", n);
    } else if (Bn(t) || t.base64)
      if (this.reconstructor)
        n = this.reconstructor.takeBinaryData(t), n && (this.reconstructor = null, super.emitReserved("decoded", n));
      else
        throw new Error("got binary data when not reconstructing a packet");
    else
      throw new Error("Unknown type: " + t);
  }
  /**
   * Decode a packet String (JSON data)
   *
   * @param {String} str
   * @return {Object} packet
   */
  decodeString(t) {
    let n = 0;
    const i = {
      type: Number(t.charAt(0))
    };
    if (A[i.type] === void 0)
      throw new Error("unknown packet type " + i.type);
    if (i.type === A.BINARY_EVENT || i.type === A.BINARY_ACK) {
      const r = n + 1;
      for (; t.charAt(++n) !== "-" && n != t.length; )
        ;
      const a = t.substring(r, n);
      if (a != Number(a) || t.charAt(n) !== "-")
        throw new Error("Illegal attachments");
      const o = Number(a);
      if (!so(o) || o < 0)
        throw new Error("Illegal attachments");
      if (o > this.opts.maxAttachments)
        throw new Error("too many attachments");
      i.attachments = o;
    }
    if (t.charAt(n + 1) === "/") {
      const r = n + 1;
      for (; ++n && !(t.charAt(n) === "," || n === t.length); )
        ;
      i.nsp = t.substring(r, n);
    } else
      i.nsp = "/";
    const s = t.charAt(n + 1);
    if (s !== "" && Number(s) == s) {
      const r = n + 1;
      for (; ++n; ) {
        const a = t.charAt(n);
        if (a == null || Number(a) != a) {
          --n;
          break;
        }
        if (n === t.length)
          break;
      }
      i.id = Number(t.substring(r, n + 1));
    }
    if (t.charAt(++n)) {
      const r = this.tryParse(t.substr(n));
      if (jn.isPayloadValid(i.type, r))
        i.data = r;
      else
        throw new Error("invalid payload");
    }
    return i;
  }
  tryParse(t) {
    try {
      return JSON.parse(t, this.opts.reviver);
    } catch {
      return !1;
    }
  }
  static isPayloadValid(t, n) {
    switch (t) {
      case A.CONNECT:
        return yi(n);
      case A.DISCONNECT:
        return n === void 0;
      case A.CONNECT_ERROR:
        return typeof n == "string" || yi(n);
      case A.EVENT:
      case A.BINARY_EVENT:
        return Array.isArray(n) && (typeof n[0] == "number" || typeof n[0] == "string" && to.indexOf(n[0]) === -1);
      case A.ACK:
      case A.BINARY_ACK:
        return Array.isArray(n);
    }
  }
  /**
   * Deallocates a parser's resources
   */
  destroy() {
    this.reconstructor && (this.reconstructor.finishedReconstruction(), this.reconstructor = null);
  }
}
class io {
  constructor(t) {
    this.packet = t, this.buffers = [], this.reconPack = t;
  }
  /**
   * Method to be called when binary data received from connection
   * after a BINARY_EVENT packet.
   *
   * @param {Buffer | ArrayBuffer} binData - the raw binary data received
   * @return {null | Object} returns null if more binary data is expected or
   *   a reconstructed packet object if all buffers have been received.
   */
  takeBinaryData(t) {
    if (this.buffers.push(t), this.buffers.length === this.reconPack.attachments) {
      const n = eo(this.reconPack, this.buffers);
      return this.finishedReconstruction(), n;
    }
    return null;
  }
  /**
   * Cleans up binary packet reconstruction variables.
   */
  finishedReconstruction() {
    this.reconPack = null, this.buffers = [];
  }
}
const so = Number.isInteger || function(e) {
  return typeof e == "number" && isFinite(e) && Math.floor(e) === e;
};
function yi(e) {
  return Object.prototype.toString.call(e) === "[object Object]";
}
const ro = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Decoder: jn,
  Encoder: no,
  get PacketType() {
    return A;
  }
}, Symbol.toStringTag, { value: "Module" }));
function J(e, t, n) {
  return e.on(t, n), function() {
    e.off(t, n);
  };
}
const ao = Object.freeze({
  connect: 1,
  connect_error: 1,
  disconnect: 1,
  disconnecting: 1,
  // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
  newListener: 1,
  removeListener: 1
});
class ps extends C {
  /**
   * `Socket` constructor.
   */
  constructor(t, n, i) {
    super(), this.connected = !1, this.recovered = !1, this.receiveBuffer = [], this.sendBuffer = [], this._queue = [], this._queueSeq = 0, this.ids = 0, this.acks = {}, this.flags = {}, this.io = t, this.nsp = n, i && i.auth && (this.auth = i.auth), this._opts = Object.assign({}, i), this.io._autoConnect && this.open();
  }
  /**
   * Whether the socket is currently disconnected
   *
   * @example
   * const socket = io();
   *
   * socket.on("connect", () => {
   *   console.log(socket.disconnected); // false
   * });
   *
   * socket.on("disconnect", () => {
   *   console.log(socket.disconnected); // true
   * });
   */
  get disconnected() {
    return !this.connected;
  }
  /**
   * Subscribe to open, close and packet events
   *
   * @private
   */
  subEvents() {
    if (this.subs)
      return;
    const t = this.io;
    this.subs = [
      J(t, "open", this.onopen.bind(this)),
      J(t, "packet", this.onpacket.bind(this)),
      J(t, "error", this.onerror.bind(this)),
      J(t, "close", this.onclose.bind(this))
    ];
  }
  /**
   * Whether the Socket will try to reconnect when its Manager connects or reconnects.
   *
   * @example
   * const socket = io();
   *
   * console.log(socket.active); // true
   *
   * socket.on("disconnect", (reason) => {
   *   if (reason === "io server disconnect") {
   *     // the disconnection was initiated by the server, you need to manually reconnect
   *     console.log(socket.active); // false
   *   }
   *   // else the socket will automatically try to reconnect
   *   console.log(socket.active); // true
   * });
   */
  get active() {
    return !!this.subs;
  }
  /**
   * "Opens" the socket.
   *
   * @example
   * const socket = io({
   *   autoConnect: false
   * });
   *
   * socket.connect();
   */
  connect() {
    return this.connected ? this : (this.subEvents(), this.io._reconnecting || this.io.open(), this.io._readyState === "open" && this.onopen(), this);
  }
  /**
   * Alias for {@link connect()}.
   */
  open() {
    return this.connect();
  }
  /**
   * Sends a `message` event.
   *
   * This method mimics the WebSocket.send() method.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send
   *
   * @example
   * socket.send("hello");
   *
   * // this is equivalent to
   * socket.emit("message", "hello");
   *
   * @return self
   */
  send(...t) {
    return t.unshift("message"), this.emit.apply(this, t), this;
  }
  /**
   * Override `emit`.
   * If the event is in `events`, it's emitted normally.
   *
   * @example
   * socket.emit("hello", "world");
   *
   * // all serializable datastructures are supported (no need to call JSON.stringify)
   * socket.emit("hello", 1, "2", { 3: ["4"], 5: Uint8Array.from([6]) });
   *
   * // with an acknowledgement from the server
   * socket.emit("hello", "world", (val) => {
   *   // ...
   * });
   *
   * @return self
   */
  emit(t, ...n) {
    var i, s, r;
    if (ao.hasOwnProperty(t))
      throw new Error('"' + t.toString() + '" is a reserved event name');
    if (n.unshift(t), this._opts.retries && !this.flags.fromQueue && !this.flags.volatile)
      return this._addToQueue(n), this;
    const a = {
      type: A.EVENT,
      data: n
    };
    if (a.options = {}, a.options.compress = this.flags.compress !== !1, typeof n[n.length - 1] == "function") {
      const l = this.ids++, g = n.pop();
      this._registerAckCallback(l, g), a.id = l;
    }
    const o = (s = (i = this.io.engine) === null || i === void 0 ? void 0 : i.transport) === null || s === void 0 ? void 0 : s.writable, c = this.connected && !(!((r = this.io.engine) === null || r === void 0) && r._hasPingExpired());
    return this.flags.volatile && !o || (c ? (this.notifyOutgoingListeners(a), this.packet(a)) : this.sendBuffer.push(a)), this.flags = {}, this;
  }
  /**
   * @private
   */
  _registerAckCallback(t, n) {
    var i;
    const s = (i = this.flags.timeout) !== null && i !== void 0 ? i : this._opts.ackTimeout;
    if (s === void 0) {
      this.acks[t] = n;
      return;
    }
    const r = this.io.setTimeoutFn(() => {
      delete this.acks[t];
      for (let o = 0; o < this.sendBuffer.length; o++)
        this.sendBuffer[o].id === t && this.sendBuffer.splice(o, 1);
      n.call(this, new Error("operation has timed out"));
    }, s), a = (...o) => {
      this.io.clearTimeoutFn(r), n.apply(this, o);
    };
    a.withError = !0, this.acks[t] = a;
  }
  /**
   * Emits an event and waits for an acknowledgement
   *
   * @example
   * // without timeout
   * const response = await socket.emitWithAck("hello", "world");
   *
   * // with a specific timeout
   * try {
   *   const response = await socket.timeout(1000).emitWithAck("hello", "world");
   * } catch (err) {
   *   // the server did not acknowledge the event in the given delay
   * }
   *
   * @return a Promise that will be fulfilled when the server acknowledges the event
   */
  emitWithAck(t, ...n) {
    return new Promise((i, s) => {
      const r = (a, o) => a ? s(a) : i(o);
      r.withError = !0, n.push(r), this.emit(t, ...n);
    });
  }
  /**
   * Add the packet to the queue.
   * @param args
   * @private
   */
  _addToQueue(t) {
    let n;
    typeof t[t.length - 1] == "function" && (n = t.pop());
    const i = {
      id: this._queueSeq++,
      tryCount: 0,
      pending: !1,
      args: t,
      flags: Object.assign({ fromQueue: !0 }, this.flags)
    };
    t.push((s, ...r) => i !== this._queue[0] ? void 0 : (s !== null ? i.tryCount > this._opts.retries && (this._queue.shift(), n && n(s)) : (this._queue.shift(), n && n(null, ...r)), i.pending = !1, this._drainQueue())), this._queue.push(i), this._drainQueue();
  }
  /**
   * Send the first packet of the queue, and wait for an acknowledgement from the server.
   * @param force - whether to resend a packet that has not been acknowledged yet
   *
   * @private
   */
  _drainQueue(t = !1) {
    if (!this.connected || this._queue.length === 0)
      return;
    const n = this._queue[0];
    n.pending && !t || (n.pending = !0, n.tryCount++, this.flags = n.flags, this.emit.apply(this, n.args));
  }
  /**
   * Sends a packet.
   *
   * @param packet
   * @private
   */
  packet(t) {
    t.nsp = this.nsp, this.io._packet(t);
  }
  /**
   * Called upon engine `open`.
   *
   * @private
   */
  onopen() {
    typeof this.auth == "function" ? this.auth((t) => {
      this._sendConnectPacket(t);
    }) : this._sendConnectPacket(this.auth);
  }
  /**
   * Sends a CONNECT packet to initiate the Socket.IO session.
   *
   * @param data
   * @private
   */
  _sendConnectPacket(t) {
    this.packet({
      type: A.CONNECT,
      data: this._pid ? Object.assign({ pid: this._pid, offset: this._lastOffset }, t) : t
    });
  }
  /**
   * Called upon engine or manager `error`.
   *
   * @param err
   * @private
   */
  onerror(t) {
    this.connected || this.emitReserved("connect_error", t);
  }
  /**
   * Called upon engine `close`.
   *
   * @param reason
   * @param description
   * @private
   */
  onclose(t, n) {
    this.connected = !1, delete this.id, this.emitReserved("disconnect", t, n), this._clearAcks();
  }
  /**
   * Clears the acknowledgement handlers upon disconnection, since the client will never receive an acknowledgement from
   * the server.
   *
   * @private
   */
  _clearAcks() {
    Object.keys(this.acks).forEach((t) => {
      if (!this.sendBuffer.some((i) => String(i.id) === t)) {
        const i = this.acks[t];
        delete this.acks[t], i.withError && i.call(this, new Error("socket has been disconnected"));
      }
    });
  }
  /**
   * Called with socket packet.
   *
   * @param packet
   * @private
   */
  onpacket(t) {
    if (t.nsp === this.nsp)
      switch (t.type) {
        case A.CONNECT:
          t.data && t.data.sid ? this.onconnect(t.data.sid, t.data.pid) : this.emitReserved("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
          break;
        case A.EVENT:
        case A.BINARY_EVENT:
          this.onevent(t);
          break;
        case A.ACK:
        case A.BINARY_ACK:
          this.onack(t);
          break;
        case A.DISCONNECT:
          this.ondisconnect();
          break;
        case A.CONNECT_ERROR:
          this.destroy();
          const i = new Error(t.data.message);
          i.data = t.data.data, this.emitReserved("connect_error", i);
          break;
      }
  }
  /**
   * Called upon a server event.
   *
   * @param packet
   * @private
   */
  onevent(t) {
    const n = t.data || [];
    t.id != null && n.push(this.ack(t.id)), this.connected ? this.emitEvent(n) : this.receiveBuffer.push(Object.freeze(n));
  }
  emitEvent(t) {
    if (this._anyListeners && this._anyListeners.length) {
      const n = this._anyListeners.slice();
      for (const i of n)
        i.apply(this, t);
    }
    super.emit.apply(this, t), this._pid && t.length && typeof t[t.length - 1] == "string" && (this._lastOffset = t[t.length - 1]);
  }
  /**
   * Produces an ack callback to emit with an event.
   *
   * @private
   */
  ack(t) {
    const n = this;
    let i = !1;
    return function(...s) {
      i || (i = !0, n.packet({
        type: A.ACK,
        id: t,
        data: s
      }));
    };
  }
  /**
   * Called upon a server acknowledgement.
   *
   * @param packet
   * @private
   */
  onack(t) {
    const n = this.acks[t.id];
    typeof n == "function" && (delete this.acks[t.id], n.withError && t.data.unshift(null), n.apply(this, t.data));
  }
  /**
   * Called upon server connect.
   *
   * @private
   */
  onconnect(t, n) {
    this.id = t, this.recovered = n && this._pid === n, this._pid = n, this.connected = !0, this.emitBuffered(), this.emitReserved("connect"), this._drainQueue(!0);
  }
  /**
   * Emit buffered events (received and emitted).
   *
   * @private
   */
  emitBuffered() {
    this.receiveBuffer.forEach((t) => this.emitEvent(t)), this.receiveBuffer = [], this.sendBuffer.forEach((t) => {
      this.notifyOutgoingListeners(t), this.packet(t);
    }), this.sendBuffer = [];
  }
  /**
   * Called upon server disconnect.
   *
   * @private
   */
  ondisconnect() {
    this.destroy(), this.onclose("io server disconnect");
  }
  /**
   * Called upon forced client/server side disconnections,
   * this method ensures the manager stops tracking us and
   * that reconnections don't get triggered for this.
   *
   * @private
   */
  destroy() {
    this.subs && (this.subs.forEach((t) => t()), this.subs = void 0), this.io._destroy(this);
  }
  /**
   * Disconnects the socket manually. In that case, the socket will not try to reconnect.
   *
   * If this is the last active Socket instance of the {@link Manager}, the low-level connection will be closed.
   *
   * @example
   * const socket = io();
   *
   * socket.on("disconnect", (reason) => {
   *   // console.log(reason); prints "io client disconnect"
   * });
   *
   * socket.disconnect();
   *
   * @return self
   */
  disconnect() {
    return this.connected && this.packet({ type: A.DISCONNECT }), this.destroy(), this.connected && this.onclose("io client disconnect"), this;
  }
  /**
   * Alias for {@link disconnect()}.
   *
   * @return self
   */
  close() {
    return this.disconnect();
  }
  /**
   * Sets the compress flag.
   *
   * @example
   * socket.compress(false).emit("hello");
   *
   * @param compress - if `true`, compresses the sending data
   * @return self
   */
  compress(t) {
    return this.flags.compress = t, this;
  }
  /**
   * Sets a modifier for a subsequent event emission that the event message will be dropped when this socket is not
   * ready to send messages.
   *
   * @example
   * socket.volatile.emit("hello"); // the server may or may not receive it
   *
   * @returns self
   */
  get volatile() {
    return this.flags.volatile = !0, this;
  }
  /**
   * Sets a modifier for a subsequent event emission that the callback will be called with an error when the
   * given number of milliseconds have elapsed without an acknowledgement from the server:
   *
   * @example
   * socket.timeout(5000).emit("my-event", (err) => {
   *   if (err) {
   *     // the server did not acknowledge the event in the given delay
   *   }
   * });
   *
   * @returns self
   */
  timeout(t) {
    return this.flags.timeout = t, this;
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback.
   *
   * @example
   * socket.onAny((event, ...args) => {
   *   console.log(`got ${event}`);
   * });
   *
   * @param listener
   */
  onAny(t) {
    return this._anyListeners = this._anyListeners || [], this._anyListeners.push(t), this;
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback. The listener is added to the beginning of the listeners array.
   *
   * @example
   * socket.prependAny((event, ...args) => {
   *   console.log(`got event ${event}`);
   * });
   *
   * @param listener
   */
  prependAny(t) {
    return this._anyListeners = this._anyListeners || [], this._anyListeners.unshift(t), this;
  }
  /**
   * Removes the listener that will be fired when any event is emitted.
   *
   * @example
   * const catchAllListener = (event, ...args) => {
   *   console.log(`got event ${event}`);
   * }
   *
   * socket.onAny(catchAllListener);
   *
   * // remove a specific listener
   * socket.offAny(catchAllListener);
   *
   * // or remove all listeners
   * socket.offAny();
   *
   * @param listener
   */
  offAny(t) {
    if (!this._anyListeners)
      return this;
    if (t) {
      const n = this._anyListeners;
      for (let i = 0; i < n.length; i++)
        if (t === n[i])
          return n.splice(i, 1), this;
    } else
      this._anyListeners = [];
    return this;
  }
  /**
   * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
   * e.g. to remove listeners.
   */
  listenersAny() {
    return this._anyListeners || [];
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback.
   *
   * Note: acknowledgements sent to the server are not included.
   *
   * @example
   * socket.onAnyOutgoing((event, ...args) => {
   *   console.log(`sent event ${event}`);
   * });
   *
   * @param listener
   */
  onAnyOutgoing(t) {
    return this._anyOutgoingListeners = this._anyOutgoingListeners || [], this._anyOutgoingListeners.push(t), this;
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback. The listener is added to the beginning of the listeners array.
   *
   * Note: acknowledgements sent to the server are not included.
   *
   * @example
   * socket.prependAnyOutgoing((event, ...args) => {
   *   console.log(`sent event ${event}`);
   * });
   *
   * @param listener
   */
  prependAnyOutgoing(t) {
    return this._anyOutgoingListeners = this._anyOutgoingListeners || [], this._anyOutgoingListeners.unshift(t), this;
  }
  /**
   * Removes the listener that will be fired when any event is emitted.
   *
   * @example
   * const catchAllListener = (event, ...args) => {
   *   console.log(`sent event ${event}`);
   * }
   *
   * socket.onAnyOutgoing(catchAllListener);
   *
   * // remove a specific listener
   * socket.offAnyOutgoing(catchAllListener);
   *
   * // or remove all listeners
   * socket.offAnyOutgoing();
   *
   * @param [listener] - the catch-all listener (optional)
   */
  offAnyOutgoing(t) {
    if (!this._anyOutgoingListeners)
      return this;
    if (t) {
      const n = this._anyOutgoingListeners;
      for (let i = 0; i < n.length; i++)
        if (t === n[i])
          return n.splice(i, 1), this;
    } else
      this._anyOutgoingListeners = [];
    return this;
  }
  /**
   * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
   * e.g. to remove listeners.
   */
  listenersAnyOutgoing() {
    return this._anyOutgoingListeners || [];
  }
  /**
   * Notify the listeners for each packet sent
   *
   * @param packet
   *
   * @private
   */
  notifyOutgoingListeners(t) {
    if (this._anyOutgoingListeners && this._anyOutgoingListeners.length) {
      const n = this._anyOutgoingListeners.slice();
      for (const i of n)
        i.apply(this, t.data);
    }
  }
}
function Me(e) {
  e = e || {}, this.ms = e.min || 100, this.max = e.max || 1e4, this.factor = e.factor || 2, this.jitter = e.jitter > 0 && e.jitter <= 1 ? e.jitter : 0, this.attempts = 0;
}
Me.prototype.duration = function() {
  var e = this.ms * Math.pow(this.factor, this.attempts++);
  if (this.jitter) {
    var t = Math.random(), n = Math.floor(t * this.jitter * e);
    e = (Math.floor(t * 10) & 1) == 0 ? e - n : e + n;
  }
  return Math.min(e, this.max) | 0;
};
Me.prototype.reset = function() {
  this.attempts = 0;
};
Me.prototype.setMin = function(e) {
  this.ms = e;
};
Me.prototype.setMax = function(e) {
  this.max = e;
};
Me.prototype.setJitter = function(e) {
  this.jitter = e;
};
class An extends C {
  constructor(t, n) {
    var i;
    super(), this.nsps = {}, this.subs = [], t && typeof t == "object" && (n = t, t = void 0), n = n || {}, n.path = n.path || "/socket.io", this.opts = n, Ft(this, n), this.reconnection(n.reconnection !== !1), this.reconnectionAttempts(n.reconnectionAttempts || 1 / 0), this.reconnectionDelay(n.reconnectionDelay || 1e3), this.reconnectionDelayMax(n.reconnectionDelayMax || 5e3), this.randomizationFactor((i = n.randomizationFactor) !== null && i !== void 0 ? i : 0.5), this.backoff = new Me({
      min: this.reconnectionDelay(),
      max: this.reconnectionDelayMax(),
      jitter: this.randomizationFactor()
    }), this.timeout(n.timeout == null ? 2e4 : n.timeout), this._readyState = "closed", this.uri = t;
    const s = n.parser || ro;
    this.encoder = new s.Encoder(), this.decoder = new s.Decoder(), this._autoConnect = n.autoConnect !== !1, this._autoConnect && this.open();
  }
  reconnection(t) {
    return arguments.length ? (this._reconnection = !!t, t || (this.skipReconnect = !0), this) : this._reconnection;
  }
  reconnectionAttempts(t) {
    return t === void 0 ? this._reconnectionAttempts : (this._reconnectionAttempts = t, this);
  }
  reconnectionDelay(t) {
    var n;
    return t === void 0 ? this._reconnectionDelay : (this._reconnectionDelay = t, (n = this.backoff) === null || n === void 0 || n.setMin(t), this);
  }
  randomizationFactor(t) {
    var n;
    return t === void 0 ? this._randomizationFactor : (this._randomizationFactor = t, (n = this.backoff) === null || n === void 0 || n.setJitter(t), this);
  }
  reconnectionDelayMax(t) {
    var n;
    return t === void 0 ? this._reconnectionDelayMax : (this._reconnectionDelayMax = t, (n = this.backoff) === null || n === void 0 || n.setMax(t), this);
  }
  timeout(t) {
    return arguments.length ? (this._timeout = t, this) : this._timeout;
  }
  /**
   * Starts trying to reconnect if reconnection is enabled and we have not
   * started reconnecting yet
   *
   * @private
   */
  maybeReconnectOnOpen() {
    !this._reconnecting && this._reconnection && this.backoff.attempts === 0 && this.reconnect();
  }
  /**
   * Sets the current transport `socket`.
   *
   * @param {Function} fn - optional, callback
   * @return self
   * @public
   */
  open(t) {
    if (~this._readyState.indexOf("open"))
      return this;
    this.engine = new Ka(this.uri, this.opts);
    const n = this.engine, i = this;
    this._readyState = "opening", this.skipReconnect = !1;
    const s = J(n, "open", function() {
      i.onopen(), t && t();
    }), r = (o) => {
      this.cleanup(), this._readyState = "closed", this.emitReserved("error", o), t ? t(o) : this.maybeReconnectOnOpen();
    }, a = J(n, "error", r);
    if (this._timeout !== !1) {
      const o = this._timeout, c = this.setTimeoutFn(() => {
        s(), r(new Error("timeout")), n.close();
      }, o);
      this.opts.autoUnref && c.unref(), this.subs.push(() => {
        this.clearTimeoutFn(c);
      });
    }
    return this.subs.push(s), this.subs.push(a), this;
  }
  /**
   * Alias for open()
   *
   * @return self
   * @public
   */
  connect(t) {
    return this.open(t);
  }
  /**
   * Called upon transport open.
   *
   * @private
   */
  onopen() {
    this.cleanup(), this._readyState = "open", this.emitReserved("open");
    const t = this.engine;
    this.subs.push(
      J(t, "ping", this.onping.bind(this)),
      J(t, "data", this.ondata.bind(this)),
      J(t, "error", this.onerror.bind(this)),
      J(t, "close", this.onclose.bind(this)),
      // @ts-ignore
      J(this.decoder, "decoded", this.ondecoded.bind(this))
    );
  }
  /**
   * Called upon a ping.
   *
   * @private
   */
  onping() {
    this.emitReserved("ping");
  }
  /**
   * Called with data.
   *
   * @private
   */
  ondata(t) {
    try {
      this.decoder.add(t);
    } catch (n) {
      this.onclose("parse error", n);
    }
  }
  /**
   * Called when parser fully decodes a packet.
   *
   * @private
   */
  ondecoded(t) {
    $t(() => {
      this.emitReserved("packet", t);
    }, this.setTimeoutFn);
  }
  /**
   * Called upon socket error.
   *
   * @private
   */
  onerror(t) {
    this.emitReserved("error", t);
  }
  /**
   * Creates a new socket for the given `nsp`.
   *
   * @return {Socket}
   * @public
   */
  socket(t, n) {
    let i = this.nsps[t];
    return i ? this._autoConnect && !i.active && i.connect() : (i = new ps(this, t, n), this.nsps[t] = i), i;
  }
  /**
   * Called upon a socket close.
   *
   * @param socket
   * @private
   */
  _destroy(t) {
    const n = Object.keys(this.nsps);
    for (const i of n)
      if (this.nsps[i].active)
        return;
    this._close();
  }
  /**
   * Writes a packet.
   *
   * @param packet
   * @private
   */
  _packet(t) {
    const n = this.encoder.encode(t);
    for (let i = 0; i < n.length; i++)
      this.engine.write(n[i], t.options);
  }
  /**
   * Clean up transport subscriptions and packet buffer.
   *
   * @private
   */
  cleanup() {
    this.subs.forEach((t) => t()), this.subs.length = 0, this.decoder.destroy();
  }
  /**
   * Close the current socket.
   *
   * @private
   */
  _close() {
    this.skipReconnect = !0, this._reconnecting = !1, this.onclose("forced close");
  }
  /**
   * Alias for close()
   *
   * @private
   */
  disconnect() {
    return this._close();
  }
  /**
   * Called when:
   *
   * - the low-level engine is closed
   * - the parser encountered a badly formatted packet
   * - all sockets are disconnected
   *
   * @private
   */
  onclose(t, n) {
    var i;
    this.cleanup(), (i = this.engine) === null || i === void 0 || i.close(), this.backoff.reset(), this._readyState = "closed", this.emitReserved("close", t, n), this._reconnection && !this.skipReconnect && this.reconnect();
  }
  /**
   * Attempt a reconnection.
   *
   * @private
   */
  reconnect() {
    if (this._reconnecting || this.skipReconnect)
      return this;
    const t = this;
    if (this.backoff.attempts >= this._reconnectionAttempts)
      this.backoff.reset(), this.emitReserved("reconnect_failed"), this._reconnecting = !1;
    else {
      const n = this.backoff.duration();
      this._reconnecting = !0;
      const i = this.setTimeoutFn(() => {
        t.skipReconnect || (this.emitReserved("reconnect_attempt", t.backoff.attempts), !t.skipReconnect && t.open((s) => {
          s ? (t._reconnecting = !1, t.reconnect(), this.emitReserved("reconnect_error", s)) : t.onreconnect();
        }));
      }, n);
      this.opts.autoUnref && i.unref(), this.subs.push(() => {
        this.clearTimeoutFn(i);
      });
    }
  }
  /**
   * Called upon successful reconnect.
   *
   * @private
   */
  onreconnect() {
    const t = this.backoff.attempts;
    this._reconnecting = !1, this.backoff.reset(), this.emitReserved("reconnect", t);
  }
}
const Ue = {};
function Qe(e, t) {
  typeof e == "object" && (t = e, e = void 0), t = t || {};
  const n = Qa(e, t.path || "/socket.io"), i = n.source, s = n.id, r = n.path, a = Ue[s] && r in Ue[s].nsps, o = t.forceNew || t["force new connection"] || t.multiplex === !1 || a;
  let c;
  return o ? c = new An(i, t) : (Ue[s] || (Ue[s] = new An(i, t)), c = Ue[s]), n.query && !t.query && (t.query = n.queryKey), c.socket(n.path, t);
}
Object.assign(Qe, {
  Manager: An,
  Socket: ps,
  io: Qe,
  connect: Qe
});
function E(e, t) {
  if (!(arguments.length === 2 && !t))
    return document.querySelector(String(e)) ?? void 0;
}
function oo(e, t) {
  return arguments.length === 2 && !t ? !1 : !!document.querySelector(String(e));
}
let j = [];
setInterval(() => {
  if (document.body)
    for (var e = 0; e < j.length; e++)
      if (oo(j[e].selector) && j[e].enabled) {
        if (document.body.classList.contains(j[e].bodyClass))
          continue;
        document.body.classList.add(j[e].bodyClass), j[e].callback && j[e].callback();
      } else {
        if (!document.body.classList.contains(j[e].bodyClass))
          continue;
        document.body.classList.remove(j[e].bodyClass), j[e].callback && j[e].callback(!1);
      }
}, 300);
function co(e, t, n, i, s) {
  j = j.filter((r) => r.id !== e), j.push({ id: e, selector: t, bodyClass: n, callback: i, enabled: s });
}
const wn = {
  "extension-language": "auto",
  "share-test-session": !0,
  "share-hosted-session": !0,
  "auto-register": !0,
  "queue-car-prompt": !1,
  "queue-requeue-displaced-registration": !1,
  "queue-register-sound": !0,
  "queue-register-sound-volume": 65,
  "better-join-button": !0,
  "dashboard-intelligence-center": !0,
  "dashboard-purchase-summary": !1,
  "no-toasts": !1,
  "auto-close-toasts": !1,
  "toast-timeout-s": 5,
  "no-sidebars": !1,
  "collapse-menu": !1,
  logger: !1
};
function W() {
  try {
    const e = JSON.parse(localStorage.getItem("iref_settings"));
    return {
      ...wn,
      ...e && typeof e == "object" ? e : {}
    };
  } catch {
    return { ...wn };
  }
}
function vi(e = {}) {
  const t = {
    ...wn,
    ...e && typeof e == "object" ? e : {}
  };
  return localStorage.setItem("iref_settings", JSON.stringify(t)), t;
}
let Et = [];
async function gs(e, t, n, i, s = null) {
  Et.push({ id: e, observer: t, selector: n, bodyClass: i, callback: s });
  const r = W();
  let a = !1;
  (r && r[e] === !0 || e === "settings-panel" || e === "update-notice" || e === "go-racing-export") && (a = !0), t ? co(e, n, i, s, a) : s && s(a);
}
async function lo() {
  Et.forEach((e) => {
    Et = Et.filter(
      (t) => t.id !== e.id
    ), gs(
      e.id,
      e.observer,
      e.selector,
      e.bodyClass,
      e.callback
    );
  });
}
const L = {
  add: gs,
  rerunAll: lo
}, uo = "body", Le = document.createElement("div");
Le.id = "iref-log";
Le.style.display = "none";
function b(e) {
  let t = document.createElement("div"), n = document.createElement("span"), s = (/* @__PURE__ */ new Date()).toTimeString().split(" ")[0];
  t.style.cssText = "margin-bottom: 5px;", n.textContent = s, t.append(n, document.createTextNode(" - " + String(e))), Le.appendChild(t), Le.scrollTop = Le.scrollHeight, console.info("[iRefined]", String(e));
}
let Ai = !1;
async function po(e = !0) {
  if (!e) {
    const n = E("#iref-log");
    n && (n.style.display = "none");
    return;
  }
  if (!Ai) {
    if (!document.body)
      return;
    document.body.appendChild(Le), Ai = !0;
  }
  const t = E("#iref-log");
  t && (t.style.display = "block");
}
const hs = "logger", go = "iref-" + hs;
L.add(hs, !0, uo, go, po);
function fs() {
  return typeof SENTRY_RELEASE < "u" ? SENTRY_RELEASE : null;
}
let ho = setInterval(() => {
  fs() && (clearInterval(ho), mo());
}, 1e3), U, le, De = !1, ms = [];
function _s() {
  var e = function() {
    return Math.floor((1 + Math.random()) * 65536).toString(16).substring(1);
  };
  return e() + e() + "-" + e() + "-" + e() + "-" + e() + "-" + e() + e() + e();
}
function fo(e) {
  return e = e.replace(/(?:\s*-\s*)?\d{4}\sSeason(?:\s\d+)?/, "").replace(/Fixed\s(?:-\s)?Fixed/, "Fixed").replace("Series Series", "Series"), e;
}
function mo() {
  const e = fs();
  if (!(e != null && e.id)) {
    b("🚫 Could not detect the iRacing client version for websocket auth");
    return;
  }
  const t = e.id.substring(
    0,
    e.id.indexOf("-")
  );
  le = Qe("https://members-ng.iracing.com", {
    reconnectionAttempts: 100,
    auth: {
      clientVersion: t
    },
    transports: ["websocket"]
  }), U = Qe("https://members-ng.iracing.com/client.io", {
    reconnectionAttempts: 100,
    auth: {
      clientVersion: t
    },
    transports: ["websocket"]
  }), le.on("connect", () => {
    De = !1, b("⚡ Connected to iRacing");
  }), le.on("disconnect", () => {
    b("⛓️‍💥 Disconnected from iRacing");
  }), le.on("connect_error", (n) => {
    b(`🚫 iRacing auth socket error: ${n.message}`);
  }), U.on("connect", () => {
    b("🔌 Connected to client.io");
  }), U.on("disconnect", () => {
    De = !1, b("🔌 Disconnected from client.io");
  }), U.on("connect_error", (n) => {
    De = !1, b(`🚫 client.io socket error: ${n.message}`);
  }), U.on("initialized", (n) => {
    De = !0, le.emit("now"), b("✅ iRacing websocket ready"), U.emit("data_services", {
      refid: _s(),
      service: "season",
      method: "popular_sessions",
      args: {
        include_empty_practice: !1,
        subscribe: !0
      }
    });
  }), le.on("heartbeat", (n) => n()), U.on("data_services_push", (n) => {
    if (ms.forEach((i) => {
      i(n);
    }), !window.irefIndex) {
      window.irefIndex = {};
      try {
        n.data.sessions.forEach((i) => {
          window.irefIndex[i.season_id] = fo(
            i.season_name
          );
        });
      } catch {
      }
    }
  });
}
function Mn(e, t) {
  return !U || !U.connected || !De ? (b("🚫 iRacing websocket is not ready yet"), !1) : (t.refid = _s(), U.emit(e, t), !0);
}
function Rt() {
  return !le || !le.connected ? !1 : (le.emit("now"), !0);
}
function bs() {
  Rt(), setTimeout(Rt, 1200), setTimeout(Rt, 3500);
}
function _o() {
  b("🚫 Withdrawing from current session");
  const e = Mn("data_services", {
    service: "registration",
    method: "withdraw",
    args: {}
  });
  return e && bs(), e;
}
function bo(e, t, n, i, s = null) {
  b(`📝 Registering for ${e}`);
  const r = {
    service: "registration",
    method: "register",
    args: {
      register_as: "driver",
      car_id: t,
      car_class_id: n,
      session_id: i
    }
  };
  s && (r.args.subsession_id = s);
  const a = Mn("data_services", r);
  return a && bs(), a;
}
function yo() {
  return !!U && U.connected && De;
}
const de = {
  send: Mn,
  refreshNow: Rt,
  register: bo,
  withdraw: _o,
  isReady: yo,
  callbacks: ms
};
function Wt(e, t = 0, n = "props") {
  if (!e)
    return null;
  const i = Object.keys(e).find(
    (r) => r.startsWith("__reactFiber")
  );
  e = e[i];
  let s = [];
  for (; s.length <= t && ("stateNode" in e && e.stateNode && n in e.stateNode && s.push(e.stateNode), "return" in e && e.return); )
    e = e.return;
  return s[t] || null;
}
function ys(e, t = null, n = 25) {
  if (!e)
    return null;
  const i = Object.keys(e).find(
    (a) => a.startsWith("__reactFiber")
  );
  if (!i)
    return null;
  let s = e[i], r = 0;
  for (; s && r <= n; ) {
    const a = s.memoizedProps;
    if (a && (!t || t(a, s, r)))
      return a;
    s = s.return, r += 1;
  }
  return null;
}
function vo(e, t = null, n = 25) {
  if (!e)
    return null;
  const i = Object.keys(e).find(
    (a) => a.startsWith("__reactFiber")
  );
  if (!i)
    return null;
  let s = e[i], r = 0;
  for (; s && r <= n; ) {
    const a = s.stateNode;
    if (a && a.state && (!t || t(a.state, a, s, r)))
      return a;
    s = s.return, r += 1;
  }
  return null;
}
function Ao(e, t = 0) {
  return Wt(e, t).props;
}
window.findReact = Wt;
const zt = {
  "en-US": {
    nextRacePrefix: "Next Race @",
    raceDuration: "Race Duration",
    drivers: "Drivers",
    lastRace: "Last Race",
    upNext: "Up Next",
    availableSessionsDescription: "Register for ongoing or upcoming sessions."
  },
  "es-ES": {
    nextRacePrefix: "Carrera siguiente @",
    raceDuration: "Duración de la carrera",
    drivers: "Pilotos",
    lastRace: "Última carrera",
    upNext: "Siguiente",
    availableSessionsDescription: "Regístrate para una sesión próxima o en curso."
  },
  "de-DE": {
    nextRacePrefix: "Nächstes Rennen @",
    raceDuration: "Renndauer",
    drivers: "Fahrer",
    lastRace: "Letztes Rennen",
    upNext: "Up Next",
    availableSessionsDescription: "Registrieren für laufende oder bevorstehende Sitzungen."
  },
  "fr-FR": {
    nextRacePrefix: "Prochaine course @",
    raceDuration: "Durée de la course",
    drivers: "Pilotes",
    lastRace: "Dernière course",
    upNext: "À venir",
    availableSessionsDescription: "Inscrivez-vous à des sessions en cours ou à venir."
  },
  "it-IT": {
    nextRacePrefix: "Prossima gara @",
    raceDuration: "Durata gara",
    drivers: "Piloti",
    lastRace: "Ultima gara",
    upNext: "Prossimamente",
    availableSessionsDescription: "Iscriviti alle sessioni in corso o a quelle in arrivo."
  },
  "pt-PT": {
    nextRacePrefix: "Próxima corrida @",
    raceDuration: "Duração da corrida",
    drivers: "Pilotos",
    lastRace: "Última corrida",
    upNext: "A seguir",
    availableSessionsDescription: "Regista-te em sessões em curso ou vindouras."
  },
  "pt-BR": {
    nextRacePrefix: "Próxima corrida @",
    raceDuration: "Duração da corrida",
    drivers: "Pilotos",
    lastRace: "Última corrida",
    upNext: "A seguir",
    availableSessionsDescription: "Inscreva-se para sessões em andamento ou nas próximas sessões."
  }
};
function $n(e = "") {
  return e.replace(/\s+/g, " ").trim();
}
function wo(e) {
  const t = new Date(e);
  return Number.isNaN(t.getTime()) ? String(e || "") : t.toISOString();
}
function So(e = Oe()) {
  const t = Fn(e), [n] = t.split("-"), i = [t];
  return n === "pt" ? ["pt-BR", "pt-PT"].forEach((s) => {
    i.includes(s) || i.push(s);
  }) : Object.keys(zt).filter(
    (s) => s !== t && s.startsWith(`${n}-`)
  ).forEach((s) => {
    i.includes(s) || i.push(s);
  }), i.includes("en-US") || i.push("en-US"), i;
}
function ko(e = {}) {
  const t = e.session || {};
  return [
    e.contentId ?? t.season_id ?? "",
    t.event_type ?? t.event_type_name ?? "",
    t.session_id ?? "",
    t.private_session_id ?? "",
    t.subsession_id ?? "",
    wo(t.start_time)
  ].join("|");
}
function Fn(e = "") {
  const t = String(e || "").replace(/_/g, "-").trim();
  if (!t)
    return "en-US";
  const [n = "", i = ""] = t.split("-"), s = n.toLowerCase(), r = i.toUpperCase(), a = Object.keys(zt).find(
    (o) => o.toLowerCase() === `${s}${r ? `-${r}` : ""}`.toLowerCase()
  );
  return a || (s === "pt" ? r === "PT" ? "pt-PT" : "pt-BR" : Object.keys(zt).find(
    (o) => o.startsWith(`${s}-`)
  ) || "en-US");
}
function Oe() {
  var t;
  let e = "";
  try {
    e = localStorage.getItem("lang") || ((t = window.localStorage) == null ? void 0 : t.lang) || "";
  } catch {
  }
  return Fn(
    e || document.documentElement.lang || navigator.language || "en-US"
  );
}
function vs(e, t = Oe()) {
  return [
    ...new Set(
      So(t).flatMap((n) => {
        var s;
        const i = (s = zt[n]) == null ? void 0 : s[e];
        return Array.isArray(i) ? i : i ? [i] : [];
      }).map($n).filter(Boolean)
    )
  ];
}
function M(e = "", t, n = Oe()) {
  const i = $n(e);
  return vs(t, n).some(
    (s) => i.startsWith(s)
  );
}
function Dt(e = "", t, n = Oe()) {
  const i = $n(e);
  return vs(t, n).some(
    (s) => i.includes(s)
  );
}
function Ht(e) {
  return !!e && !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
}
function qo(e = {}) {
  var t, n;
  return !!(e != null && e.session) && (e.contentId !== null && e.contentId !== void 0 || ((t = e.session) == null ? void 0 : t.season_id) !== null && ((n = e.session) == null ? void 0 : n.season_id) !== void 0);
}
function Z(e = document, t = {}) {
  const {
    visibleOnly: n = !0,
    skipButtons: i = [],
    skipSelectors: s = []
  } = t, r = new Set(i.filter(Boolean)), a = /* @__PURE__ */ new Set();
  return [...e.querySelectorAll("button, a")].filter((o) => !r.has(o)).filter(
    (o) => s.every((c) => !o.closest(c))
  ).filter((o) => !n || Ht(o)).map((o) => ({
    button: o,
    props: ys(o, qo)
  })).filter(({ props: o }) => {
    if (!(o != null && o.session))
      return !1;
    const c = ko(o);
    return !c || a.has(c) ? !1 : (a.add(c), !0);
  });
}
function nt(e = document, t = {}) {
  return Z(e, t)[0] || null;
}
const it = "iref-extension-locale-change", As = [
  "en-US",
  "es-ES",
  "de-DE",
  "fr-FR",
  "it-IT",
  "pt-PT",
  "pt-BR"
], xo = {
  "en-US": "English",
  "es-ES": "Español",
  "de-DE": "Deutsch",
  "fr-FR": "Français",
  "it-IT": "Italiano",
  "pt-PT": "Português (Portugal)",
  "pt-BR": "Português (Brasil)"
}, wi = {
  "en-US": {
    "common.close": "Close",
    "common.save": "Save",
    "common.reload_page": "Reload page",
    "common.seconds": "seconds",
    "common.downloaded_filename": "Downloaded {filename}",
    "action.upload": "Upload",
    "action.download": "Download",
    "action.import_session": "Import Session",
    "action.export_session": "Export Session",
    "action.test_sound": "Test sound",
    "settings.open_menu": "Open iRefined settings",
    "settings.title": "Settings",
    "settings.description": "This browser build focuses on members-ng UI helpers. Launching and joining sessions still hand off to the local iRacing app.",
    "settings.language_label": "Extension language",
    "settings.language_help": "Choose the language used by iRefined buttons and menus. Auto follows the WEBUI language.",
    "settings.page_translation_label": "Translate any language",
    "settings.page_translation_help": "Enter or pick a target language code. When applied, iRefined machine-translates visible WEBUI text and its own UI on this page. Leave it empty to turn it off.",
    "settings.page_translation_placeholder": "Off, or e.g. ja / nl / ru / tr / pl / zh-CN",
    "settings.page_translation_apply": "Apply translation",
    "settings.page_translation_status_off": "Full-page translation is off.",
    "settings.page_translation_status_on": "Full-page translation active: {language}",
    "settings.page_translation_online_note": "Uses online machine translation for page text.",
    "settings.languages.auto": "Auto (WEBUI)",
    "settings.section.webtools": "Experimental Web Tools",
    "settings.section.tweaks": "Browser UI Tweaks",
    "settings.share_test_session.label": "Test Drive session sharing buttons",
    "settings.share_test_session.help": "Adds download and upload buttons to the session settings window so that conditions can be shared using .json.",
    "settings.share_hosted_session.label": "Hosted/League session tools",
    "settings.share_hosted_session.help": "Adds import and export buttons to the Hosted and League create-race wizard so session setup can be shared using .json. Weather tools are temporarily hidden.",
    "settings.auto_register.label": "Queue system for future sessions",
    "settings.auto_register.help": "Adds queue buttons to the next race card and session list to automatically register when the matching race session appears. You must select a car to queue with. Clicking an active queue button again removes it.",
    "settings.queue_car_prompt.label": "Prompt for car when queueing",
    "settings.queue_car_prompt.help": "When enabled, queueing a multiclass series without a saved car will ask which car to use. When disabled, queueing without a car selection shows 'Choose a car!' instead.",
    "settings.queue_requeue.label": "Re-queue displaced registration",
    "settings.queue_requeue.help": "Advanced: when a queued session replaces an existing registration, add the displaced later session back to the queue. Leave this off unless you want iRefined to re-register sessions it withdrew from.",
    "settings.queue_sound.label": "Queue register sound",
    "settings.queue_sound.help": "Play a short sound when a queued race finally sends its register request.",
    "settings.queue_sound_volume.label": "Queue sound volume",
    "settings.queue_sound_volume.help": "Adjust the queue register sound volume from 0 to 100.",
    "settings.queue_sound_test.label": "Test queue sound",
    "settings.queue_sound_test.help": "Play the current queue register sound using the configured volume.",
    "settings.better_join_button.label": "Join button displays session type",
    "settings.better_join_button.help": "Green join button will display session type. Doesn't work well with official sessions that don't go official (low attendance).",
    "settings.dashboard_intelligence.label": "Dashboard Intelligence Center",
    "settings.dashboard_intelligence.help": "Show or hide the Intelligence Center on the dashboard page. It focuses on member progress, awards, credits and recent activity.",
    "settings.dashboard_purchase.label": "Dashboard financial widget (disabled on desktop)",
    "settings.dashboard_purchase.help": "This widget is intentionally disabled in the desktop build to preserve the native layout.",
    "settings.no_toasts.label": "No notifications",
    "settings.no_toasts.help": "Don't show any notifications at the top of the screen.",
    "settings.auto_close_toasts.label": "Auto close notifications after",
    "settings.auto_close_toasts.help": "Close notifications at the top of the screen after a delay. Does not work with the previous option.",
    "settings.no_sidebars.label": "Hide sidebars",
    "settings.no_sidebars.help": "Hide the left and right sidebars for a cleaner UI with more space.",
    "settings.collapse_menu.label": "Collapse menu",
    "settings.collapse_menu.help": "Folds in the left hand menu so that it only uses icons, to free up even more space for more important stuff.",
    "settings.logger.label": "Show log messages",
    "settings.logger.help": "Helpful to figure out why something happened.",
    "update.note_title": "Update available: {tag}",
    "update.note_description": "You are on {version}. A newer GitHub Release is available for download.",
    "update.help": "Download the latest release zip, extract it, then reload the unpacked extension.",
    "update.open_latest_release": "Open latest release",
    "update.close_notice": "Close update notice",
    "update.available": "Update available",
    "update.current": "Current",
    "update.latest": "Latest",
    "update.close": "Close",
    "update.ready_title": "{tag} is ready",
    "update.using_version": "You are using {version}. A newer GitHub release is available for download.",
    "update.toolbar_label": "Update {tag}",
    "update.toolbar_title": "A newer iRefined release is available on GitHub: {tag}",
    "queue.registering": "Registering",
    "queue.register_now": "Register now",
    "queue.queued": "Queued",
    "queue.select_car": "Select Car",
    "queue.queue": "Queue",
    "queue.queue_next_race": "Queue for the next race",
    "queue.queue_race_when_open": "Queue this race and register when the site opens registration.",
    "queue.race_group_title": "Race Queue",
    "queue.race_group_subtitle": "Upcoming race sessions",
    "queue.qualify_group_title": "Qualify Queue",
    "queue.qualify_group_subtitle": "Upcoming qualify sessions",
    "queue.queue_at": "Queue {time}",
    "queue.prompt_choose_car": "Choose a car for queued registration in series {contentId}:",
    "queue.choose_car_alert": "Choose a car!",
    "register.description": "Register for this session from the browser.",
    "register.in_flight": "A browser registration request is already in flight.",
    "register.already_registered_series": "You are already registered for {seasonName}.",
    "register.already_registered_elsewhere": "You are already registered in another series.",
    "register.view_in_iracing": "View in iRacing",
    "register.withdraw": "Withdraw",
    "register.registering_elsewhere": "Registering elsewhere",
    "register.registered_elsewhere": "Registered elsewhere",
    "register.unavailable": "Register unavailable",
    "register.register": "Register",
    "register.race_title": "Register for this race from the browser.",
    "register.session_title": "Register for this {eventType} session from the browser.",
    "register.join_race": "Join Race",
    "register.websocket_not_ready": "The iRacing websocket is not ready yet.",
    "share.session_default": "Session {index}",
    "share.prompt_import_which": "Import which {label} config?",
    "share.prompt_more_sessions": "... and {count} more sessions",
    "share.weather_label": "weather",
    "share.session_label": "session",
    "share.invalid_selection": "Import cancelled: invalid {label} selection",
    "share.weather_import_failed": "Weather import failed: no weather payload found",
    "share.weather_imported": "Applied imported weather to the current session",
    "share.session_import_failed": "Session import failed: no session payload found",
    "share.session_imported": "Applied imported session settings",
    "tools.session_json": "Session JSON",
    "tools.export_weather_json": "Export Weather JSON",
    "tools.export_session_json": "Export Session JSON",
    "tools.export_hosted_sessions_json": "Export Hosted Sessions JSON",
    "tools.export_league_sessions_json": "Export League Sessions JSON",
    "tools.weather_export_unavailable": "Weather export unavailable on this page",
    "tools.session_export_unavailable": "Session export unavailable on this page",
    "tools.hosted_export_unavailable": "Hosted session export unavailable on this page",
    "tools.league_export_unavailable": "League session export unavailable on this page",
    "status.registered": "Registered",
    "status.registering": "Registering",
    "status.subtitle_queue": "Withdrawing from the current session and sending the queued race registration.",
    "status.subtitle_direct": "Register request sent from the browser. Waiting for the site to reflect the new session.",
    "status.subtitle_finishing": "Finishing your registration in the background.",
    "status.subtitle_registered": "You are registered for your race session.",
    "status.starts_now": "Starts now",
    "status.starts_in": "Starts in {value}",
    "status.withdraw": "Withdraw",
    "status.join_race": "Join Race",
    "status.tooltip_found": "{sessionLabel} session found. Automatic register starts 5 minutes before the start time. Click the blue dot to register now.",
    "status.tooltip_registering": "Registering, this can take up to 30 seconds.",
    "status.tooltip_searching": "Searching for {sessionLabel} session.",
    "join.race": "Race",
    "join.spectate": "Spectate",
    "join.spot": "Spot",
    "join.practice": "Practice",
    "join.unscored": " (Unscored)",
    "translate.invalid_language": "Enter a valid language code like ja, nl, ru, tr, pl or zh-CN."
  },
  "pt-BR": {
    "common.close": "Fechar",
    "common.save": "Salvar",
    "common.reload_page": "Recarregar página",
    "common.seconds": "segundos",
    "common.downloaded_filename": "Baixado {filename}",
    "action.upload": "Enviar",
    "action.download": "Baixar",
    "action.import_session": "Importar sessão",
    "action.export_session": "Exportar sessão",
    "action.test_sound": "Testar som",
    "settings.open_menu": "Abrir configurações do iRefined",
    "settings.title": "Configurações",
    "settings.description": "Esta versão do navegador foca em recursos da UI members-ng. Iniciar e entrar em sessões ainda depende do app local do iRacing.",
    "settings.language_label": "Idioma da extensão",
    "settings.language_help": "Escolha o idioma usado pelos botões e menus do iRefined. Automático segue o idioma da WEBUI.",
    "settings.page_translation_label": "Traduzir para qualquer idioma",
    "settings.page_translation_help": "Digite ou escolha um código de idioma de destino. Ao aplicar, o iRefined traduz por máquina os textos visíveis da WEBUI e da própria extensão nesta página. Deixe em branco para desligar.",
    "settings.page_translation_placeholder": "Desligado, ou ex. ja / nl / ru / tr / pl / zh-CN",
    "settings.page_translation_apply": "Aplicar tradução",
    "settings.page_translation_status_off": "A tradução da página inteira está desligada.",
    "settings.page_translation_status_on": "Tradução da página inteira ativa: {language}",
    "settings.page_translation_online_note": "Usa tradução automática online para o texto da página.",
    "settings.languages.auto": "Automático (WEBUI)",
    "settings.section.webtools": "Ferramentas web experimentais",
    "settings.section.tweaks": "Ajustes da interface do navegador",
    "settings.share_test_session.label": "Botões de compartilhamento da sessão de Test Drive",
    "settings.share_test_session.help": "Adiciona botões de baixar e enviar na janela de configurações da sessão para compartilhar condições em .json.",
    "settings.share_hosted_session.label": "Ferramentas de sessão Hosted/League",
    "settings.share_hosted_session.help": "Adiciona botões de importar e exportar no assistente de criação de corridas Hosted e League para compartilhar a configuração da sessão em .json. As ferramentas de clima continuam ocultas por enquanto.",
    "settings.auto_register.label": "Sistema de fila para sessões futuras",
    "settings.auto_register.help": "Adiciona botões de fila no card da próxima corrida e na lista de sessões para registrar automaticamente quando a sessão correspondente aparecer. Você precisa escolher um carro para entrar na fila. Clicar de novo em uma fila ativa remove ela.",
    "settings.queue_car_prompt.label": "Perguntar o carro ao entrar na fila",
    "settings.queue_car_prompt.help": "Quando ativado, entrar na fila de uma série multiclasses sem um carro salvo pergunta qual carro usar. Quando desativado, entrar na fila sem carro mostra 'Escolha um carro!'.",
    "settings.queue_requeue.label": "Reenfileirar registro deslocado",
    "settings.queue_requeue.help": "Avançado: quando uma sessão em fila substitui um registro existente, adiciona a sessão posterior removida de volta à fila. Deixe desligado a menos que você queira que o iRefined registre de novo sessões das quais ele saiu.",
    "settings.queue_sound.label": "Som ao registrar pela fila",
    "settings.queue_sound.help": "Toca um som curto quando uma corrida em fila finalmente envia o pedido de registro.",
    "settings.queue_sound_volume.label": "Volume do som da fila",
    "settings.queue_sound_volume.help": "Ajusta o volume do som de registro da fila de 0 a 100.",
    "settings.queue_sound_test.label": "Testar som da fila",
    "settings.queue_sound_test.help": "Toca o som atual de registro da fila usando o volume configurado.",
    "settings.better_join_button.label": "Botão Join mostra o tipo de sessão",
    "settings.better_join_button.help": "O botão verde de entrada passa a mostrar o tipo de sessão. Não funciona tão bem em sessões oficiais que não se tornam oficiais por baixa participação.",
    "settings.dashboard_intelligence.label": "Central de inteligência do dashboard",
    "settings.dashboard_intelligence.help": "Mostra ou oculta a Central de Inteligência V4 na página do dashboard. Ela destaca progresso do membro, prêmios, créditos e atividade recente.",
    "settings.dashboard_purchase.label": "Widget financeiro do dashboard",
    "settings.dashboard_purchase.help": "Mostra ou oculta o widget de resumo financeiro no dashboard principal. Quando ativado, os valores continuam ocultos até você revelar.",
    "settings.no_toasts.label": "Sem notificações",
    "settings.no_toasts.help": "Não mostra notificações no topo da tela.",
    "settings.auto_close_toasts.label": "Fechar notificações automaticamente após",
    "settings.auto_close_toasts.help": "Fecha as notificações no topo da tela após um tempo. Não funciona junto com a opção anterior.",
    "settings.no_sidebars.label": "Ocultar barras laterais",
    "settings.no_sidebars.help": "Oculta as barras laterais esquerda e direita para uma interface mais limpa e com mais espaço.",
    "settings.collapse_menu.label": "Recolher menu",
    "settings.collapse_menu.help": "Recolhe o menu lateral esquerdo para mostrar só os ícones e liberar ainda mais espaço para o que importa.",
    "settings.logger.label": "Mostrar mensagens de log",
    "settings.logger.help": "Útil para entender por que algo aconteceu.",
    "update.note_title": "Atualização disponível: {tag}",
    "update.note_description": "Você está na versão {version}. Há uma nova GitHub Release disponível para baixar.",
    "update.help": "Baixe o zip da release mais recente, extraia e depois recarregue a extensão descompactada.",
    "update.open_latest_release": "Abrir release mais recente",
    "update.close_notice": "Fechar aviso de atualização",
    "update.available": "Atualização disponível",
    "update.current": "Atual",
    "update.latest": "Mais recente",
    "update.close": "Fechar",
    "update.ready_title": "{tag} está pronta",
    "update.using_version": "Você está usando a versão {version}. Há uma nova release do GitHub disponível para baixar.",
    "update.toolbar_label": "Atualizar {tag}",
    "update.toolbar_title": "Há uma versão mais nova do iRefined no GitHub: {tag}",
    "queue.registering": "Registrando",
    "queue.register_now": "Registrar agora",
    "queue.queued": "Na fila",
    "queue.select_car": "Escolher carro",
    "queue.queue": "Fila",
    "queue.queue_next_race": "Entrar na fila da próxima corrida",
    "queue.queue_race_when_open": "Coloca esta corrida na fila e registra quando o site abrir o registro.",
    "queue.race_group_title": "Fila de corrida",
    "queue.race_group_subtitle": "Próximas sessões de corrida",
    "queue.qualify_group_title": "Fila de classificação",
    "queue.qualify_group_subtitle": "Próximas sessões de classificação",
    "queue.queue_at": "Fila {time}",
    "queue.prompt_choose_car": "Escolha um carro para o registro em fila na série {contentId}:",
    "queue.choose_car_alert": "Escolha um carro!",
    "register.description": "Registre esta sessão pelo navegador.",
    "register.in_flight": "Já existe um pedido de registro pelo navegador em andamento.",
    "register.already_registered_series": "Você já está registrado em {seasonName}.",
    "register.already_registered_elsewhere": "Você já está registrado em outra série.",
    "register.view_in_iracing": "Ver no iRacing",
    "register.withdraw": "Cancelar registro",
    "register.registering_elsewhere": "Registrando em outra sessão",
    "register.registered_elsewhere": "Registrado em outra sessão",
    "register.unavailable": "Registro indisponível",
    "register.register": "Registrar",
    "register.race_title": "Registrar esta corrida pelo navegador.",
    "register.session_title": "Registrar esta sessão de {eventType} pelo navegador.",
    "register.join_race": "Entrar na corrida",
    "register.websocket_not_ready": "O websocket do iRacing ainda não está pronto.",
    "share.session_default": "Sessão {index}",
    "share.prompt_import_which": "Importar qual configuração de {label}?",
    "share.prompt_more_sessions": "... e mais {count} sessões",
    "share.weather_label": "clima",
    "share.session_label": "sessão",
    "share.invalid_selection": "Importação cancelada: seleção de {label} inválida",
    "share.weather_import_failed": "Falha ao importar clima: nenhum payload de clima encontrado",
    "share.weather_imported": "Clima importado aplicado à sessão atual",
    "share.session_import_failed": "Falha ao importar sessão: nenhum payload de sessão encontrado",
    "share.session_imported": "Configurações da sessão importada aplicadas",
    "tools.session_json": "JSON da sessão",
    "tools.export_weather_json": "Exportar JSON do clima",
    "tools.export_session_json": "Exportar JSON da sessão",
    "tools.export_hosted_sessions_json": "Exportar JSON das sessões hosted",
    "tools.export_league_sessions_json": "Exportar JSON das sessões de league",
    "tools.weather_export_unavailable": "Exportação de clima indisponível nesta página",
    "tools.session_export_unavailable": "Exportação de sessão indisponível nesta página",
    "tools.hosted_export_unavailable": "Exportação de sessão hosted indisponível nesta página",
    "tools.league_export_unavailable": "Exportação de sessão de league indisponível nesta página",
    "status.registered": "Registrado",
    "status.registering": "Registrando",
    "status.subtitle_queue": "Cancelando a sessão atual e enviando o registro da corrida em fila.",
    "status.subtitle_direct": "Pedido de registro enviado pelo navegador. Aguardando o site refletir a nova sessão.",
    "status.subtitle_finishing": "Concluindo seu registro em segundo plano.",
    "status.subtitle_registered": "Você está registrado para sua sessão de corrida.",
    "status.starts_now": "Começa agora",
    "status.starts_in": "Começa em {value}",
    "status.withdraw": "Cancelar registro",
    "status.join_race": "Entrar na corrida",
    "status.tooltip_found": "Sessão de {sessionLabel} encontrada. O registro automático começa 5 minutos antes do horário de início. Clique na bolinha azul para registrar agora.",
    "status.tooltip_registering": "Registrando, isso pode levar até 30 segundos.",
    "status.tooltip_searching": "Procurando sessão de {sessionLabel}.",
    "join.race": "Corrida",
    "join.spectate": "Assistir",
    "join.spot": "Spotter",
    "join.practice": "Treino",
    "join.unscored": " (Sem pontuação)",
    "translate.invalid_language": "Informe um código de idioma válido como ja, nl, ru, tr, pl ou zh-CN."
  },
  "pt-PT": {
    "common.close": "Fechar",
    "common.save": "Guardar",
    "common.reload_page": "Recarregar página",
    "common.seconds": "segundos",
    "common.downloaded_filename": "Transferido {filename}",
    "action.upload": "Enviar",
    "action.download": "Transferir",
    "action.import_session": "Importar sessão",
    "action.export_session": "Exportar sessão",
    "action.test_sound": "Testar som",
    "settings.open_menu": "Abrir definições do iRefined",
    "settings.title": "Definições",
    "settings.description": "Esta versão do navegador foca-se em ajudas da UI members-ng. Iniciar e entrar em sessões continua a passar pela app local do iRacing.",
    "settings.language_label": "Idioma da extensão",
    "settings.language_help": "Escolhe o idioma usado pelos botões e menus do iRefined. Automático segue o idioma da WEBUI.",
    "settings.page_translation_label": "Traduzir para qualquer idioma",
    "settings.page_translation_help": "Introduz ou escolhe um código de idioma de destino. Ao aplicar, o iRefined traduz automaticamente os textos visíveis da WEBUI e da própria extensão nesta página. Deixa em branco para desligar.",
    "settings.page_translation_placeholder": "Desligado, ou ex. ja / nl / ru / tr / pl / zh-CN",
    "settings.page_translation_apply": "Aplicar tradução",
    "settings.page_translation_status_off": "A tradução da página inteira está desligada.",
    "settings.page_translation_status_on": "Tradução da página inteira ativa: {language}",
    "settings.page_translation_online_note": "Usa tradução automática online para o texto da página.",
    "settings.languages.auto": "Automático (WEBUI)",
    "settings.section.webtools": "Ferramentas web experimentais",
    "settings.section.tweaks": "Ajustes da interface do navegador",
    "settings.share_test_session.label": "Botões de partilha da sessão de Test Drive",
    "settings.share_test_session.help": "Adiciona botões de transferir e enviar na janela de definições da sessão para partilhar condições em .json.",
    "settings.share_hosted_session.label": "Ferramentas de sessão Hosted/League",
    "settings.share_hosted_session.help": "Adiciona botões de importar e exportar no assistente de criação de corridas Hosted e League para partilhar a configuração da sessão em .json. As ferramentas de meteorologia continuam ocultas por agora.",
    "settings.auto_register.label": "Sistema de fila para sessões futuras",
    "settings.auto_register.help": "Adiciona botões de fila no cartão da próxima corrida e na lista de sessões para registar automaticamente quando a sessão correspondente aparecer. Tens de escolher um carro para entrar na fila. Clicar novamente numa fila ativa remove-a.",
    "settings.queue_car_prompt.label": "Perguntar o carro ao entrar na fila",
    "settings.queue_car_prompt.help": "Quando ativado, entrar na fila de uma série multiclasses sem um carro guardado pergunta que carro usar. Quando desativado, entrar na fila sem carro mostra 'Escolhe um carro!'.",
    "settings.queue_requeue.label": "Voltar a enfileirar registo deslocado",
    "settings.queue_requeue.help": "Avançado: quando uma sessão em fila substitui um registo existente, volta a adicionar à fila a sessão posterior que foi removida. Deixa desligado a menos que queiras que o iRefined volte a registar sessões das quais saiu.",
    "settings.queue_sound.label": "Som ao registar pela fila",
    "settings.queue_sound.help": "Toca um som curto quando uma corrida em fila finalmente envia o pedido de registo.",
    "settings.queue_sound_volume.label": "Volume do som da fila",
    "settings.queue_sound_volume.help": "Ajusta o volume do som de registo da fila de 0 a 100.",
    "settings.queue_sound_test.label": "Testar som da fila",
    "settings.queue_sound_test.help": "Toca o som atual de registo da fila com o volume configurado.",
    "settings.better_join_button.label": "Botão Join mostra o tipo de sessão",
    "settings.better_join_button.help": "O botão verde de entrada passa a mostrar o tipo de sessão. Não funciona tão bem em sessões oficiais que não se tornam oficiais por baixa participação.",
    "settings.dashboard_intelligence.label": "Centro de inteligência do dashboard",
    "settings.dashboard_intelligence.help": "Mostra ou oculta o Centro de Inteligência V4 na página do dashboard. Destaca o progresso do membro, prémios, créditos e atividade recente.",
    "settings.dashboard_purchase.label": "Widget financeiro do dashboard",
    "settings.dashboard_purchase.help": "Mostra ou oculta o widget de resumo financeiro no dashboard principal. Quando fica ativo, os valores continuam ocultos até os revelares.",
    "settings.no_toasts.label": "Sem notificações",
    "settings.no_toasts.help": "Não mostra notificações no topo do ecrã.",
    "settings.auto_close_toasts.label": "Fechar notificações automaticamente após",
    "settings.auto_close_toasts.help": "Fecha as notificações no topo do ecrã após um atraso. Não funciona com a opção anterior.",
    "settings.no_sidebars.label": "Ocultar barras laterais",
    "settings.no_sidebars.help": "Oculta as barras laterais esquerda e direita para uma interface mais limpa e com mais espaço.",
    "settings.collapse_menu.label": "Recolher menu",
    "settings.collapse_menu.help": "Recolhe o menu lateral esquerdo para mostrar só os ícones e libertar ainda mais espaço para o que interessa.",
    "settings.logger.label": "Mostrar mensagens de registo",
    "settings.logger.help": "Útil para perceber porque é que algo aconteceu.",
    "update.note_title": "Atualização disponível: {tag}",
    "update.note_description": "Estás na versão {version}. Há uma nova GitHub Release disponível para transferência.",
    "update.help": "Transfere o zip da release mais recente, extrai-o e depois recarrega a extensão descompactada.",
    "update.open_latest_release": "Abrir release mais recente",
    "update.close_notice": "Fechar aviso de atualização",
    "update.available": "Atualização disponível",
    "update.current": "Atual",
    "update.latest": "Mais recente",
    "update.close": "Fechar",
    "update.ready_title": "{tag} está pronta",
    "update.using_version": "Estás a usar a versão {version}. Há uma nova release do GitHub disponível para transferência.",
    "update.toolbar_label": "Atualizar {tag}",
    "update.toolbar_title": "Existe uma versão mais recente do iRefined no GitHub: {tag}",
    "queue.registering": "A registar",
    "queue.register_now": "Registar agora",
    "queue.queued": "Na fila",
    "queue.select_car": "Escolher carro",
    "queue.queue": "Fila",
    "queue.queue_next_race": "Entrar na fila da próxima corrida",
    "queue.queue_race_when_open": "Coloca esta corrida na fila e regista quando o site abrir o registo.",
    "queue.race_group_title": "Fila de corrida",
    "queue.race_group_subtitle": "Próximas sessões de corrida",
    "queue.qualify_group_title": "Fila de qualificação",
    "queue.qualify_group_subtitle": "Próximas sessões de qualificação",
    "queue.queue_at": "Fila {time}",
    "queue.prompt_choose_car": "Escolhe um carro para o registo em fila na série {contentId}:",
    "queue.choose_car_alert": "Escolhe um carro!",
    "register.description": "Regista esta sessão pelo navegador.",
    "register.in_flight": "Já existe um pedido de registo pelo navegador em curso.",
    "register.already_registered_series": "Já estás registado em {seasonName}.",
    "register.already_registered_elsewhere": "Já estás registado noutra série.",
    "register.view_in_iracing": "Ver no iRacing",
    "register.withdraw": "Cancelar registo",
    "register.registering_elsewhere": "A registar noutra sessão",
    "register.registered_elsewhere": "Registado noutra sessão",
    "register.unavailable": "Registo indisponível",
    "register.register": "Registar",
    "register.race_title": "Registar esta corrida pelo navegador.",
    "register.session_title": "Registar esta sessão de {eventType} pelo navegador.",
    "register.join_race": "Entrar na corrida",
    "register.websocket_not_ready": "O websocket do iRacing ainda não está pronto.",
    "share.session_default": "Sessão {index}",
    "share.prompt_import_which": "Importar que configuração de {label}?",
    "share.prompt_more_sessions": "... e mais {count} sessões",
    "share.weather_label": "meteorologia",
    "share.session_label": "sessão",
    "share.invalid_selection": "Importação cancelada: seleção inválida de {label}",
    "share.weather_import_failed": "Falha ao importar meteorologia: não foi encontrado payload de meteorologia",
    "share.weather_imported": "A meteorologia importada foi aplicada à sessão atual",
    "share.session_import_failed": "Falha ao importar sessão: não foi encontrado payload de sessão",
    "share.session_imported": "As definições da sessão importada foram aplicadas",
    "tools.session_json": "JSON da sessão",
    "tools.export_weather_json": "Exportar JSON da meteorologia",
    "tools.export_session_json": "Exportar JSON da sessão",
    "tools.export_hosted_sessions_json": "Exportar JSON das sessões hosted",
    "tools.export_league_sessions_json": "Exportar JSON das sessões de league",
    "tools.weather_export_unavailable": "Exportação de meteorologia indisponível nesta página",
    "tools.session_export_unavailable": "Exportação de sessão indisponível nesta página",
    "tools.hosted_export_unavailable": "Exportação de sessão hosted indisponível nesta página",
    "tools.league_export_unavailable": "Exportação de sessão de league indisponível nesta página",
    "status.registered": "Registado",
    "status.registering": "A registar",
    "status.subtitle_queue": "A cancelar a sessão atual e a enviar o registo da corrida em fila.",
    "status.subtitle_direct": "Pedido de registo enviado pelo navegador. A aguardar que o site reflita a nova sessão.",
    "status.subtitle_finishing": "A concluir o teu registo em segundo plano.",
    "status.subtitle_registered": "Estás registado para a tua sessão de corrida.",
    "status.starts_now": "Começa agora",
    "status.starts_in": "Começa em {value}",
    "status.withdraw": "Cancelar registo",
    "status.join_race": "Entrar na corrida",
    "status.tooltip_found": "Sessão de {sessionLabel} encontrada. O registo automático começa 5 minutos antes da hora de início. Clica na bolinha azul para registar agora.",
    "status.tooltip_registering": "A registar, isto pode demorar até 30 segundos.",
    "status.tooltip_searching": "À procura de sessão de {sessionLabel}.",
    "join.race": "Corrida",
    "join.spectate": "Assistir",
    "join.spot": "Spotter",
    "join.practice": "Treino",
    "join.unscored": " (Sem pontuação)",
    "translate.invalid_language": "Introduz um código de idioma válido como ja, nl, ru, tr, pl ou zh-CN."
  },
  "es-ES": {
    "common.close": "Cerrar",
    "common.save": "Guardar",
    "common.reload_page": "Recargar página",
    "common.seconds": "segundos",
    "common.downloaded_filename": "Descargado {filename}",
    "action.upload": "Subir",
    "action.download": "Descargar",
    "action.import_session": "Importar sesión",
    "action.export_session": "Exportar sesión",
    "action.test_sound": "Probar sonido",
    "settings.open_menu": "Abrir ajustes de iRefined",
    "settings.title": "Ajustes",
    "settings.description": "Esta versión del navegador se centra en ayudas para la UI members-ng. Iniciar y unirse a sesiones sigue dependiendo de la app local de iRacing.",
    "settings.language_label": "Idioma de la extensión",
    "settings.language_help": "Elige el idioma que usa iRefined en botones y menús. Automático sigue el idioma de la WEBUI.",
    "settings.page_translation_label": "Traducir a cualquier idioma",
    "settings.page_translation_help": "Escribe o elige un código de idioma de destino. Al aplicarlo, iRefined traduce por máquina el texto visible de la WEBUI y de su propia interfaz en esta página. Déjalo vacío para desactivarlo.",
    "settings.page_translation_placeholder": "Desactivado, o p. ej. ja / nl / ru / tr / pl / zh-CN",
    "settings.page_translation_apply": "Aplicar traducción",
    "settings.page_translation_status_off": "La traducción completa de la página está desactivada.",
    "settings.page_translation_status_on": "Traducción completa de la página activa: {language}",
    "settings.page_translation_online_note": "Usa traducción automática en línea para el texto de la página.",
    "settings.languages.auto": "Automático (WEBUI)",
    "settings.section.webtools": "Herramientas web experimentales",
    "settings.section.tweaks": "Ajustes de la interfaz del navegador",
    "settings.share_test_session.label": "Botones para compartir sesión de Test Drive",
    "settings.share_test_session.help": "Añade botones de descargar y subir en la ventana de ajustes de la sesión para compartir condiciones usando .json.",
    "settings.share_hosted_session.label": "Herramientas de sesión Hosted/League",
    "settings.share_hosted_session.help": "Añade botones de importar y exportar al asistente de creación de carreras Hosted y League para compartir la configuración de la sesión con .json. Las herramientas de clima siguen ocultas por ahora.",
    "settings.auto_register.label": "Sistema de cola para sesiones futuras",
    "settings.auto_register.help": "Añade botones de cola en la tarjeta de la próxima carrera y en la lista de sesiones para registrarte automáticamente cuando aparezca la sesión correspondiente. Debes elegir un coche para entrar en cola. Si vuelves a pulsar una cola activa, se elimina.",
    "settings.queue_car_prompt.label": "Preguntar por el coche al entrar en cola",
    "settings.queue_car_prompt.help": "Cuando está activado, entrar en cola en una serie multiclase sin un coche guardado preguntará qué coche usar. Cuando está desactivado, entrar en cola sin coche muestra '¡Elige un coche!'.",
    "settings.queue_requeue.label": "Volver a poner en cola el registro desplazado",
    "settings.queue_requeue.help": "Avanzado: cuando una sesión en cola reemplaza un registro existente, vuelve a añadir a la cola la sesión posterior desplazada. Déjalo desactivado salvo que quieras que iRefined vuelva a registrar sesiones de las que se retiró.",
    "settings.queue_sound.label": "Sonido al registrar desde la cola",
    "settings.queue_sound.help": "Reproduce un sonido corto cuando una carrera en cola por fin envía su solicitud de registro.",
    "settings.queue_sound_volume.label": "Volumen del sonido de la cola",
    "settings.queue_sound_volume.help": "Ajusta el volumen del sonido de registro de la cola entre 0 y 100.",
    "settings.queue_sound_test.label": "Probar sonido de la cola",
    "settings.queue_sound_test.help": "Reproduce el sonido actual de registro de la cola con el volumen configurado.",
    "settings.better_join_button.label": "El botón Join muestra el tipo de sesión",
    "settings.better_join_button.help": "El botón verde de entrada mostrará el tipo de sesión. No funciona tan bien en sesiones oficiales que no llegan a ser oficiales por baja participación.",
    "settings.dashboard_intelligence.label": "Centro de inteligencia del dashboard",
    "settings.dashboard_intelligence.help": "Muestra u oculta el Centro de Inteligencia V4 en la página del dashboard. Se centra en el progreso del miembro, premios, créditos y actividad reciente.",
    "settings.dashboard_purchase.label": "Widget financiero del dashboard",
    "settings.dashboard_purchase.help": "Muestra u oculta el widget de resumen financiero en el dashboard principal. Si se deja activado, los valores seguirán ocultos hasta que los reveles.",
    "settings.no_toasts.label": "Sin notificaciones",
    "settings.no_toasts.help": "No muestra notificaciones en la parte superior de la pantalla.",
    "settings.auto_close_toasts.label": "Cerrar notificaciones automáticamente tras",
    "settings.auto_close_toasts.help": "Cierra las notificaciones de la parte superior tras un retraso. No funciona junto con la opción anterior.",
    "settings.no_sidebars.label": "Ocultar barras laterales",
    "settings.no_sidebars.help": "Oculta las barras laterales izquierda y derecha para una interfaz más limpia y con más espacio.",
    "settings.collapse_menu.label": "Contraer menú",
    "settings.collapse_menu.help": "Contrae el menú lateral izquierdo para que solo use iconos y libere aún más espacio para lo importante.",
    "settings.logger.label": "Mostrar mensajes de registro",
    "settings.logger.help": "Útil para entender por qué ha ocurrido algo.",
    "update.note_title": "Actualización disponible: {tag}",
    "update.note_description": "Estás usando la versión {version}. Hay una nueva GitHub Release disponible para descargar.",
    "update.help": "Descarga el zip de la release más reciente, extráelo y después recarga la extensión desempaquetada.",
    "update.open_latest_release": "Abrir la última release",
    "update.close_notice": "Cerrar aviso de actualización",
    "update.available": "Actualización disponible",
    "update.current": "Actual",
    "update.latest": "Última",
    "update.close": "Cerrar",
    "update.ready_title": "{tag} está lista",
    "update.using_version": "Estás usando la versión {version}. Hay una nueva release de GitHub disponible para descargar.",
    "update.toolbar_label": "Actualizar {tag}",
    "update.toolbar_title": "Hay una versión más reciente de iRefined en GitHub: {tag}",
    "queue.registering": "Registrando",
    "queue.register_now": "Registrar ahora",
    "queue.queued": "En cola",
    "queue.select_car": "Elegir coche",
    "queue.queue": "Cola",
    "queue.queue_next_race": "Poner en cola la próxima carrera",
    "queue.queue_race_when_open": "Pone esta carrera en cola y registra cuando el sitio abra el registro.",
    "queue.race_group_title": "Cola de carrera",
    "queue.race_group_subtitle": "Próximas sesiones de carrera",
    "queue.qualify_group_title": "Cola de clasificación",
    "queue.qualify_group_subtitle": "Próximas sesiones de clasificación",
    "queue.queue_at": "Cola {time}",
    "queue.prompt_choose_car": "Elige un coche para el registro en cola en la serie {contentId}:",
    "queue.choose_car_alert": "¡Elige un coche!",
    "register.description": "Registra esta sesión desde el navegador.",
    "register.in_flight": "Ya hay una solicitud de registro desde el navegador en curso.",
    "register.already_registered_series": "Ya estás registrado en {seasonName}.",
    "register.already_registered_elsewhere": "Ya estás registrado en otra serie.",
    "register.view_in_iracing": "Ver en iRacing",
    "register.withdraw": "Retirarse",
    "register.registering_elsewhere": "Registrando en otra sesión",
    "register.registered_elsewhere": "Registrado en otra sesión",
    "register.unavailable": "Registro no disponible",
    "register.register": "Registrar",
    "register.race_title": "Registrar esta carrera desde el navegador.",
    "register.session_title": "Registrar esta sesión de {eventType} desde el navegador.",
    "register.join_race": "Entrar en carrera",
    "register.websocket_not_ready": "El websocket de iRacing todavía no está listo.",
    "share.session_default": "Sesión {index}",
    "share.prompt_import_which": "¿Qué configuración de {label} quieres importar?",
    "share.prompt_more_sessions": "... y {count} sesiones más",
    "share.weather_label": "clima",
    "share.session_label": "sesión",
    "share.invalid_selection": "Importación cancelada: selección de {label} no válida",
    "share.weather_import_failed": "Error al importar el clima: no se encontró ningún payload de clima",
    "share.weather_imported": "Se aplicó el clima importado a la sesión actual",
    "share.session_import_failed": "Error al importar la sesión: no se encontró ningún payload de sesión",
    "share.session_imported": "Se aplicaron los ajustes de la sesión importada",
    "tools.session_json": "JSON de sesión",
    "tools.export_weather_json": "Exportar JSON del clima",
    "tools.export_session_json": "Exportar JSON de la sesión",
    "tools.export_hosted_sessions_json": "Exportar JSON de sesiones hosted",
    "tools.export_league_sessions_json": "Exportar JSON de sesiones de league",
    "tools.weather_export_unavailable": "La exportación del clima no está disponible en esta página",
    "tools.session_export_unavailable": "La exportación de la sesión no está disponible en esta página",
    "tools.hosted_export_unavailable": "La exportación de sesiones hosted no está disponible en esta página",
    "tools.league_export_unavailable": "La exportación de sesiones de league no está disponible en esta página",
    "status.registered": "Registrado",
    "status.registering": "Registrando",
    "status.subtitle_queue": "Retirándose de la sesión actual y enviando el registro de la carrera en cola.",
    "status.subtitle_direct": "Solicitud de registro enviada desde el navegador. Esperando a que el sitio refleje la nueva sesión.",
    "status.subtitle_finishing": "Terminando tu registro en segundo plano.",
    "status.subtitle_registered": "Estás registrado para tu sesión de carrera.",
    "status.starts_now": "Empieza ahora",
    "status.starts_in": "Empieza en {value}",
    "status.withdraw": "Retirarse",
    "status.join_race": "Entrar en carrera",
    "status.tooltip_found": "Sesión de {sessionLabel} encontrada. El registro automático empieza 5 minutos antes de la hora de inicio. Haz clic en el punto azul para registrar ahora.",
    "status.tooltip_registering": "Registrando, esto puede tardar hasta 30 segundos.",
    "status.tooltip_searching": "Buscando sesión de {sessionLabel}.",
    "join.race": "Carrera",
    "join.spectate": "Espectar",
    "join.spot": "Spotter",
    "join.practice": "Práctica",
    "join.unscored": " (Sin puntuar)",
    "translate.invalid_language": "Introduce un código de idioma válido como ja, nl, ru, tr, pl o zh-CN."
  },
  "de-DE": {
    "common.close": "Schließen",
    "common.save": "Speichern",
    "common.reload_page": "Seite neu laden",
    "common.seconds": "Sekunden",
    "common.downloaded_filename": "{filename} heruntergeladen",
    "action.upload": "Hochladen",
    "action.download": "Herunterladen",
    "action.import_session": "Sitzung importieren",
    "action.export_session": "Sitzung exportieren",
    "action.test_sound": "Sound testen",
    "settings.open_menu": "iRefined-Einstellungen öffnen",
    "settings.title": "Einstellungen",
    "settings.description": "Diese Browser-Version konzentriert sich auf Hilfen für die members-ng-Oberfläche. Das Starten und Beitreten zu Sitzungen läuft weiterhin über die lokale iRacing-App.",
    "settings.language_label": "Sprache der Erweiterung",
    "settings.language_help": "Wähle die Sprache für iRefined-Schaltflächen und Menüs. Automatisch folgt der Sprache der WEBUI.",
    "settings.page_translation_label": "In jede Sprache übersetzen",
    "settings.page_translation_help": "Gib einen Ziel-Sprachcode ein oder wähle ihn aus. Nach dem Anwenden übersetzt iRefined den sichtbaren WEBUI-Text und die eigene Oberfläche auf dieser Seite maschinell. Leer lassen, um es auszuschalten.",
    "settings.page_translation_placeholder": "Aus, oder z. B. ja / nl / ru / tr / pl / zh-CN",
    "settings.page_translation_apply": "Übersetzung anwenden",
    "settings.page_translation_status_off": "Die Übersetzung der gesamten Seite ist aus.",
    "settings.page_translation_status_on": "Übersetzung der gesamten Seite aktiv: {language}",
    "settings.page_translation_online_note": "Verwendet Online-Maschinenübersetzung für Seitentexte.",
    "settings.languages.auto": "Automatisch (WEBUI)",
    "settings.section.webtools": "Experimentelle Web-Tools",
    "settings.section.tweaks": "Browser-UI-Anpassungen",
    "settings.share_test_session.label": "Test-Drive-Freigabeschaltflächen",
    "settings.share_test_session.help": "Fügt im Fenster für Sitzungseinstellungen Download- und Upload-Schaltflächen hinzu, damit Bedingungen als .json geteilt werden können.",
    "settings.share_hosted_session.label": "Hosted-/League-Sitzungstools",
    "settings.share_hosted_session.help": "Fügt im Assistenten zum Erstellen von Hosted- und League-Rennen Import- und Export-Schaltflächen hinzu, damit Sitzungseinstellungen als .json geteilt werden können. Wetter-Tools sind vorübergehend ausgeblendet.",
    "settings.auto_register.label": "Warteschlange für zukünftige Sitzungen",
    "settings.auto_register.help": "Fügt Warteschlangen-Schaltflächen zur Karte des nächsten Rennens und zur Sitzungsliste hinzu, um automatisch zu registrieren, wenn die passende Rennsitzung erscheint. Du musst ein Auto auswählen, um es zur Warteschlange hinzuzufügen. Ein weiterer Klick auf eine aktive Warteschlange entfernt sie wieder.",
    "settings.queue_car_prompt.label": "Beim Einreihen nach dem Auto fragen",
    "settings.queue_car_prompt.help": "Wenn aktiviert, fragt das Einreihen in eine Multiclass-Serie ohne gespeichertes Auto, welches Auto verwendet werden soll. Wenn deaktiviert, zeigt das Einreihen ohne Auto stattdessen 'Auto wählen!'.",
    "settings.queue_requeue.label": "Verdrängte Registrierung erneut einreihen",
    "settings.queue_requeue.help": "Erweitert: Wenn eine Warteschlangen-Sitzung eine bestehende Registrierung ersetzt, wird die verdrängte spätere Sitzung wieder zur Warteschlange hinzugefügt. Lass diese Option aus, außer du möchtest, dass iRefined Sitzungen erneut registriert, aus denen es sich zurückgezogen hat.",
    "settings.queue_sound.label": "Sound bei Warteschlangen-Registrierung",
    "settings.queue_sound.help": "Spielt einen kurzen Sound ab, wenn ein Rennen in der Warteschlange endlich die Registrierungsanfrage sendet.",
    "settings.queue_sound_volume.label": "Lautstärke des Warteschlangen-Sounds",
    "settings.queue_sound_volume.help": "Passt die Lautstärke des Registrierungs-Sounds von 0 bis 100 an.",
    "settings.queue_sound_test.label": "Warteschlangen-Sound testen",
    "settings.queue_sound_test.help": "Spielt den aktuellen Registrierungs-Sound mit der eingestellten Lautstärke ab.",
    "settings.better_join_button.label": "Join-Schaltfläche zeigt Sitzungstyp",
    "settings.better_join_button.help": "Die grüne Join-Schaltfläche zeigt den Sitzungstyp an. Funktioniert bei offiziellen Sitzungen mit geringer Teilnahme nicht immer gut, wenn sie nicht offiziell werden.",
    "settings.dashboard_intelligence.label": "Dashboard Intelligence Center",
    "settings.dashboard_intelligence.help": "Zeigt das V4 Intelligence Center auf der Dashboard-Seite an oder blendet es aus. Es konzentriert sich auf Mitgliederfortschritt, Auszeichnungen, Guthaben und aktuelle Aktivität.",
    "settings.dashboard_purchase.label": "Finanz-Widget im Dashboard",
    "settings.dashboard_purchase.help": "Zeigt das Finanz-Widget auf dem Haupt-Dashboard an oder blendet es aus. Wenn es aktiviert bleibt, bleiben die Werte verborgen, bis du sie einblendest.",
    "settings.no_toasts.label": "Keine Benachrichtigungen",
    "settings.no_toasts.help": "Zeigt keine Benachrichtigungen am oberen Bildschirmrand an.",
    "settings.auto_close_toasts.label": "Benachrichtigungen automatisch schließen nach",
    "settings.auto_close_toasts.help": "Schließt Benachrichtigungen am oberen Bildschirmrand nach einer Verzögerung. Funktioniert nicht zusammen mit der vorherigen Option.",
    "settings.no_sidebars.label": "Seitenleisten ausblenden",
    "settings.no_sidebars.help": "Blendet linke und rechte Seitenleiste aus, für eine aufgeräumtere Oberfläche mit mehr Platz.",
    "settings.collapse_menu.label": "Menü einklappen",
    "settings.collapse_menu.help": "Klappt das linke Menü ein, sodass nur Symbole angezeigt werden und noch mehr Platz für Wichtigeres frei wird.",
    "settings.logger.label": "Logmeldungen anzeigen",
    "settings.logger.help": "Hilfreich, um herauszufinden, warum etwas passiert ist.",
    "update.note_title": "Update verfügbar: {tag}",
    "update.note_description": "Du verwendest Version {version}. Eine neuere GitHub Release steht zum Download bereit.",
    "update.help": "Lade die ZIP-Datei der neuesten Release herunter, entpacke sie und lade dann die entpackte Erweiterung neu.",
    "update.open_latest_release": "Neueste Release öffnen",
    "update.close_notice": "Update-Hinweis schließen",
    "update.available": "Update verfügbar",
    "update.current": "Aktuell",
    "update.latest": "Neueste",
    "update.close": "Schließen",
    "update.ready_title": "{tag} ist bereit",
    "update.using_version": "Du verwendest Version {version}. Eine neuere GitHub-Release steht zum Download bereit.",
    "update.toolbar_label": "Update {tag}",
    "update.toolbar_title": "Eine neuere iRefined-Version ist auf GitHub verfügbar: {tag}",
    "queue.registering": "Registriere",
    "queue.register_now": "Jetzt registrieren",
    "queue.queued": "In Warteschlange",
    "queue.select_car": "Auto wählen",
    "queue.queue": "Warteschlange",
    "queue.queue_next_race": "Nächstes Rennen einreihen",
    "queue.queue_race_when_open": "Stellt dieses Rennen in die Warteschlange und registriert, sobald die Seite die Registrierung öffnet.",
    "queue.race_group_title": "Renn-Warteschlange",
    "queue.race_group_subtitle": "Bevorstehende Rennsitzungen",
    "queue.qualify_group_title": "Qualifying-Warteschlange",
    "queue.qualify_group_subtitle": "Bevorstehende Qualifying-Sitzungen",
    "queue.queue_at": "Warteschlange {time}",
    "queue.prompt_choose_car": "Wähle ein Auto für die Warteschlangen-Registrierung in Serie {contentId}:",
    "queue.choose_car_alert": "Auto wählen!",
    "register.description": "Registriere diese Sitzung im Browser.",
    "register.in_flight": "Es läuft bereits eine Registrierungsanfrage aus dem Browser.",
    "register.already_registered_series": "Du bist bereits für {seasonName} registriert.",
    "register.already_registered_elsewhere": "Du bist bereits in einer anderen Serie registriert.",
    "register.view_in_iracing": "In iRacing ansehen",
    "register.withdraw": "Zurückziehen",
    "register.registering_elsewhere": "Registrierung anderswo läuft",
    "register.registered_elsewhere": "Anderswo registriert",
    "register.unavailable": "Registrierung nicht verfügbar",
    "register.register": "Registrieren",
    "register.race_title": "Dieses Rennen im Browser registrieren.",
    "register.session_title": "Diese {eventType}-Sitzung im Browser registrieren.",
    "register.join_race": "Rennen beitreten",
    "register.websocket_not_ready": "Der iRacing-Websocket ist noch nicht bereit.",
    "share.session_default": "Sitzung {index}",
    "share.prompt_import_which": "Welche {label}-Konfiguration importieren?",
    "share.prompt_more_sessions": "... und {count} weitere Sitzungen",
    "share.weather_label": "Wetter",
    "share.session_label": "Sitzung",
    "share.invalid_selection": "Import abgebrochen: ungültige {label}-Auswahl",
    "share.weather_import_failed": "Wetterimport fehlgeschlagen: keine Wetterdaten gefunden",
    "share.weather_imported": "Importiertes Wetter wurde auf die aktuelle Sitzung angewendet",
    "share.session_import_failed": "Sitzungsimport fehlgeschlagen: keine Sitzungsdaten gefunden",
    "share.session_imported": "Importierte Sitzungseinstellungen wurden angewendet",
    "tools.session_json": "Sitzungs-JSON",
    "tools.export_weather_json": "Wetter-JSON exportieren",
    "tools.export_session_json": "Sitzungs-JSON exportieren",
    "tools.export_hosted_sessions_json": "Hosted-Sitzungen als JSON exportieren",
    "tools.export_league_sessions_json": "League-Sitzungen als JSON exportieren",
    "tools.weather_export_unavailable": "Wetterexport auf dieser Seite nicht verfügbar",
    "tools.session_export_unavailable": "Sitzungsexport auf dieser Seite nicht verfügbar",
    "tools.hosted_export_unavailable": "Hosted-Sitzungsexport auf dieser Seite nicht verfügbar",
    "tools.league_export_unavailable": "League-Sitzungsexport auf dieser Seite nicht verfügbar",
    "status.registered": "Registriert",
    "status.registering": "Registriere",
    "status.subtitle_queue": "Aktuelle Sitzung wird zurückgezogen und die Warteschlangen-Registrierung für das Rennen wird gesendet.",
    "status.subtitle_direct": "Registrierungsanfrage aus dem Browser gesendet. Warte darauf, dass die Seite die neue Sitzung anzeigt.",
    "status.subtitle_finishing": "Deine Registrierung wird im Hintergrund abgeschlossen.",
    "status.subtitle_registered": "Du bist für deine Rennsitzung registriert.",
    "status.starts_now": "Startet jetzt",
    "status.starts_in": "Startet in {value}",
    "status.withdraw": "Zurückziehen",
    "status.join_race": "Rennen beitreten",
    "status.tooltip_found": "{sessionLabel}-Sitzung gefunden. Die automatische Registrierung startet 5 Minuten vor der Startzeit. Klicke auf den blauen Punkt, um dich jetzt zu registrieren.",
    "status.tooltip_registering": "Registriere, das kann bis zu 30 Sekunden dauern.",
    "status.tooltip_searching": "Suche nach {sessionLabel}-Sitzung.",
    "join.race": "Rennen",
    "join.spectate": "Zuschauen",
    "join.spot": "Spotter",
    "join.practice": "Training",
    "join.unscored": " (Ohne Wertung)",
    "translate.invalid_language": "Gib einen gültigen Sprachcode wie ja, nl, ru, tr, pl oder zh-CN ein."
  },
  "fr-FR": {
    "common.close": "Fermer",
    "common.save": "Enregistrer",
    "common.reload_page": "Recharger la page",
    "common.seconds": "secondes",
    "common.downloaded_filename": "{filename} téléchargé",
    "action.upload": "Importer",
    "action.download": "Télécharger",
    "action.import_session": "Importer la session",
    "action.export_session": "Exporter la session",
    "action.test_sound": "Tester le son",
    "settings.open_menu": "Ouvrir les paramètres iRefined",
    "settings.title": "Paramètres",
    "settings.description": "Cette version navigateur se concentre sur les aides de l'interface members-ng. Le lancement et la connexion aux sessions passent toujours par l'application locale iRacing.",
    "settings.language_label": "Langue de l'extension",
    "settings.language_help": "Choisissez la langue utilisée par les boutons et menus iRefined. Automatique suit la langue de la WEBUI.",
    "settings.page_translation_label": "Traduire vers n'importe quelle langue",
    "settings.page_translation_help": "Saisissez ou choisissez un code de langue cible. Une fois appliqué, iRefined traduit automatiquement le texte visible de la WEBUI et de sa propre interface sur cette page. Laissez vide pour le désactiver.",
    "settings.page_translation_placeholder": "Désactivé, ou p. ex. ja / nl / ru / tr / pl / zh-CN",
    "settings.page_translation_apply": "Appliquer la traduction",
    "settings.page_translation_status_off": "La traduction de la page entière est désactivée.",
    "settings.page_translation_status_on": "Traduction de la page entière active : {language}",
    "settings.page_translation_online_note": "Utilise une traduction automatique en ligne pour le texte de la page.",
    "settings.languages.auto": "Automatique (WEBUI)",
    "settings.section.webtools": "Outils web expérimentaux",
    "settings.section.tweaks": "Ajustements de l'interface du navigateur",
    "settings.share_test_session.label": "Boutons de partage de session Test Drive",
    "settings.share_test_session.help": "Ajoute des boutons de téléchargement et d'import dans la fenêtre des paramètres de session afin de partager les conditions via .json.",
    "settings.share_hosted_session.label": "Outils de session Hosted/League",
    "settings.share_hosted_session.help": "Ajoute des boutons d'import et d'export à l'assistant de création de course Hosted et League afin de partager les paramètres de session en .json. Les outils météo restent temporairement masqués.",
    "settings.auto_register.label": "Système de file d'attente pour les sessions futures",
    "settings.auto_register.help": "Ajoute des boutons de file d'attente sur la carte de la prochaine course et dans la liste des sessions pour s'inscrire automatiquement quand la session correspondante apparaît. Vous devez choisir une voiture pour entrer dans la file. Cliquer à nouveau sur une file active la supprime.",
    "settings.queue_car_prompt.label": "Demander la voiture lors de la mise en file",
    "settings.queue_car_prompt.help": "Quand c'est activé, mettre en file une série multiclasses sans voiture enregistrée demandera quelle voiture utiliser. Quand c'est désactivé, mettre en file sans voiture affiche 'Choisissez une voiture !'.",
    "settings.queue_requeue.label": "Remettre en file l'inscription déplacée",
    "settings.queue_requeue.help": "Avancé : quand une session en file remplace une inscription existante, ajoute à nouveau la session plus tardive déplacée à la file. Laissez désactivé sauf si vous voulez qu'iRefined réinscrive des sessions dont il s'est retiré.",
    "settings.queue_sound.label": "Son lors de l'inscription depuis la file",
    "settings.queue_sound.help": "Joue un court son quand une course en file envoie enfin sa demande d'inscription.",
    "settings.queue_sound_volume.label": "Volume du son de la file",
    "settings.queue_sound_volume.help": "Ajuste le volume du son d'inscription de la file de 0 à 100.",
    "settings.queue_sound_test.label": "Tester le son de la file",
    "settings.queue_sound_test.help": "Joue le son actuel d'inscription de la file avec le volume configuré.",
    "settings.better_join_button.label": "Le bouton Join affiche le type de session",
    "settings.better_join_button.help": "Le bouton vert d'entrée affichera le type de session. Fonctionne moins bien avec les sessions officielles qui ne deviennent pas officielles faute de participation.",
    "settings.dashboard_intelligence.label": "Centre d'intelligence du tableau de bord",
    "settings.dashboard_intelligence.help": "Affiche ou masque le centre d'intelligence V4 sur la page du tableau de bord. Il met l'accent sur la progression du membre, les récompenses, les crédits et l'activité récente.",
    "settings.dashboard_purchase.label": "Widget financier du tableau de bord",
    "settings.dashboard_purchase.help": "Affiche ou masque le widget de résumé financier sur la page principale du tableau de bord. S'il reste activé, les valeurs restent masquées jusqu'à ce que vous les révéliez.",
    "settings.no_toasts.label": "Aucune notification",
    "settings.no_toasts.help": "N'affiche aucune notification en haut de l'écran.",
    "settings.auto_close_toasts.label": "Fermer automatiquement les notifications après",
    "settings.auto_close_toasts.help": "Ferme les notifications en haut de l'écran après un délai. Ne fonctionne pas avec l'option précédente.",
    "settings.no_sidebars.label": "Masquer les barres latérales",
    "settings.no_sidebars.help": "Masque les barres latérales gauche et droite pour une interface plus propre avec davantage d'espace.",
    "settings.collapse_menu.label": "Réduire le menu",
    "settings.collapse_menu.help": "Réduit le menu de gauche pour n'afficher que les icônes et libérer encore plus d'espace pour l'essentiel.",
    "settings.logger.label": "Afficher les messages du journal",
    "settings.logger.help": "Utile pour comprendre pourquoi quelque chose s'est produit.",
    "update.note_title": "Mise à jour disponible : {tag}",
    "update.note_description": "Vous utilisez la version {version}. Une nouvelle GitHub Release est disponible au téléchargement.",
    "update.help": "Téléchargez l'archive zip de la dernière release, extrayez-la puis rechargez l'extension décompressée.",
    "update.open_latest_release": "Ouvrir la dernière release",
    "update.close_notice": "Fermer l'avis de mise à jour",
    "update.available": "Mise à jour disponible",
    "update.current": "Actuelle",
    "update.latest": "Dernière",
    "update.close": "Fermer",
    "update.ready_title": "{tag} est prête",
    "update.using_version": "Vous utilisez la version {version}. Une nouvelle release GitHub est disponible au téléchargement.",
    "update.toolbar_label": "Mettre à jour {tag}",
    "update.toolbar_title": "Une version plus récente d'iRefined est disponible sur GitHub : {tag}",
    "queue.registering": "Inscription",
    "queue.register_now": "S'inscrire maintenant",
    "queue.queued": "En file",
    "queue.select_car": "Choisir la voiture",
    "queue.queue": "File",
    "queue.queue_next_race": "Mettre la prochaine course en file",
    "queue.queue_race_when_open": "Met cette course en file et s'inscrit quand le site ouvre l'inscription.",
    "queue.race_group_title": "File de course",
    "queue.race_group_subtitle": "Prochaines sessions de course",
    "queue.qualify_group_title": "File de qualification",
    "queue.qualify_group_subtitle": "Prochaines sessions de qualification",
    "queue.queue_at": "File {time}",
    "queue.prompt_choose_car": "Choisissez une voiture pour l'inscription en file dans la série {contentId} :",
    "queue.choose_car_alert": "Choisissez une voiture !",
    "register.description": "Inscrire cette session depuis le navigateur.",
    "register.in_flight": "Une demande d'inscription depuis le navigateur est déjà en cours.",
    "register.already_registered_series": "Vous êtes déjà inscrit à {seasonName}.",
    "register.already_registered_elsewhere": "Vous êtes déjà inscrit dans une autre série.",
    "register.view_in_iracing": "Voir dans iRacing",
    "register.withdraw": "Se retirer",
    "register.registering_elsewhere": "Inscription en cours ailleurs",
    "register.registered_elsewhere": "Inscrit ailleurs",
    "register.unavailable": "Inscription indisponible",
    "register.register": "S'inscrire",
    "register.race_title": "Inscrire cette course depuis le navigateur.",
    "register.session_title": "Inscrire cette session de {eventType} depuis le navigateur.",
    "register.join_race": "Rejoindre la course",
    "register.websocket_not_ready": "Le websocket iRacing n'est pas encore prêt.",
    "share.session_default": "Session {index}",
    "share.prompt_import_which": "Importer quelle configuration de {label} ?",
    "share.prompt_more_sessions": "... et encore {count} sessions",
    "share.weather_label": "météo",
    "share.session_label": "session",
    "share.invalid_selection": "Import annulé : sélection de {label} invalide",
    "share.weather_import_failed": "Échec de l'import météo : aucune donnée météo trouvée",
    "share.weather_imported": "La météo importée a été appliquée à la session actuelle",
    "share.session_import_failed": "Échec de l'import de session : aucune donnée de session trouvée",
    "share.session_imported": "Les paramètres de la session importée ont été appliqués",
    "tools.session_json": "JSON de session",
    "tools.export_weather_json": "Exporter le JSON météo",
    "tools.export_session_json": "Exporter le JSON de session",
    "tools.export_hosted_sessions_json": "Exporter le JSON des sessions hosted",
    "tools.export_league_sessions_json": "Exporter le JSON des sessions de league",
    "tools.weather_export_unavailable": "L'export météo n'est pas disponible sur cette page",
    "tools.session_export_unavailable": "L'export de session n'est pas disponible sur cette page",
    "tools.hosted_export_unavailable": "L'export de session hosted n'est pas disponible sur cette page",
    "tools.league_export_unavailable": "L'export de session league n'est pas disponible sur cette page",
    "status.registered": "Inscrit",
    "status.registering": "Inscription",
    "status.subtitle_queue": "Retrait de la session actuelle et envoi de l'inscription pour la course en file.",
    "status.subtitle_direct": "Demande d'inscription envoyée depuis le navigateur. En attente que le site reflète la nouvelle session.",
    "status.subtitle_finishing": "Finalisation de votre inscription en arrière-plan.",
    "status.subtitle_registered": "Vous êtes inscrit pour votre session de course.",
    "status.starts_now": "Commence maintenant",
    "status.starts_in": "Commence dans {value}",
    "status.withdraw": "Se retirer",
    "status.join_race": "Rejoindre la course",
    "status.tooltip_found": "Session de {sessionLabel} trouvée. L'inscription automatique démarre 5 minutes avant l'heure de départ. Cliquez sur le point bleu pour vous inscrire maintenant.",
    "status.tooltip_registering": "Inscription en cours, cela peut prendre jusqu'à 30 secondes.",
    "status.tooltip_searching": "Recherche d'une session de {sessionLabel}.",
    "join.race": "Course",
    "join.spectate": "Spectateur",
    "join.spot": "Spotter",
    "join.practice": "Entraînement",
    "join.unscored": " (Non classé)",
    "translate.invalid_language": "Saisissez un code de langue valide comme ja, nl, ru, tr, pl ou zh-CN."
  },
  "it-IT": {
    "common.close": "Chiudi",
    "common.save": "Salva",
    "common.reload_page": "Ricarica pagina",
    "common.seconds": "secondi",
    "common.downloaded_filename": "{filename} scaricato",
    "action.upload": "Carica",
    "action.download": "Scarica",
    "action.import_session": "Importa sessione",
    "action.export_session": "Esporta sessione",
    "action.test_sound": "Prova suono",
    "settings.open_menu": "Apri impostazioni di iRefined",
    "settings.title": "Impostazioni",
    "settings.description": "Questa build del browser si concentra sugli aiuti dell'interfaccia members-ng. L'avvio e l'accesso alle sessioni passano ancora all'app locale di iRacing.",
    "settings.language_label": "Lingua dell'estensione",
    "settings.language_help": "Scegli la lingua usata da pulsanti e menu di iRefined. Automatico segue la lingua della WEBUI.",
    "settings.page_translation_label": "Traduci in qualsiasi lingua",
    "settings.page_translation_help": "Inserisci o scegli un codice lingua di destinazione. Quando lo applichi, iRefined traduce automaticamente il testo visibile della WEBUI e della propria interfaccia in questa pagina. Lascia vuoto per disattivarlo.",
    "settings.page_translation_placeholder": "Disattivato, oppure es. ja / nl / ru / tr / pl / zh-CN",
    "settings.page_translation_apply": "Applica traduzione",
    "settings.page_translation_status_off": "La traduzione dell'intera pagina è disattivata.",
    "settings.page_translation_status_on": "Traduzione dell'intera pagina attiva: {language}",
    "settings.page_translation_online_note": "Usa la traduzione automatica online per il testo della pagina.",
    "settings.languages.auto": "Automatico (WEBUI)",
    "settings.section.webtools": "Strumenti web sperimentali",
    "settings.section.tweaks": "Ritocchi all'interfaccia del browser",
    "settings.share_test_session.label": "Pulsanti di condivisione sessione Test Drive",
    "settings.share_test_session.help": "Aggiunge pulsanti di download e upload nella finestra delle impostazioni della sessione per condividere le condizioni tramite .json.",
    "settings.share_hosted_session.label": "Strumenti sessione Hosted/League",
    "settings.share_hosted_session.help": "Aggiunge pulsanti di importazione ed esportazione alla procedura guidata di creazione gara Hosted e League per condividere la configurazione della sessione in .json. Gli strumenti meteo restano temporaneamente nascosti.",
    "settings.auto_register.label": "Sistema di coda per le sessioni future",
    "settings.auto_register.help": "Aggiunge pulsanti di coda alla scheda della prossima gara e all'elenco sessioni per registrarti automaticamente quando appare la sessione corrispondente. Devi selezionare un'auto per entrare in coda. Fare di nuovo clic su una coda attiva la rimuove.",
    "settings.queue_car_prompt.label": "Chiedi l'auto quando entri in coda",
    "settings.queue_car_prompt.help": "Se attivato, entrare in coda in una serie multiclass senza un'auto salvata chiederà quale auto usare. Se disattivato, entrare in coda senza auto mostrerà 'Scegli un'auto!'.",
    "settings.queue_requeue.label": "Rimetti in coda la registrazione spostata",
    "settings.queue_requeue.help": "Avanzato: quando una sessione in coda sostituisce una registrazione esistente, aggiunge di nuovo in coda la sessione successiva spostata. Lascia disattivato a meno che tu non voglia che iRefined registri di nuovo sessioni da cui si è ritirato.",
    "settings.queue_sound.label": "Suono registrazione dalla coda",
    "settings.queue_sound.help": "Riproduce un breve suono quando una gara in coda invia finalmente la richiesta di registrazione.",
    "settings.queue_sound_volume.label": "Volume suono della coda",
    "settings.queue_sound_volume.help": "Regola il volume del suono di registrazione della coda da 0 a 100.",
    "settings.queue_sound_test.label": "Prova suono della coda",
    "settings.queue_sound_test.help": "Riproduce il suono attuale di registrazione della coda con il volume configurato.",
    "settings.better_join_button.label": "Il pulsante Join mostra il tipo di sessione",
    "settings.better_join_button.help": "Il pulsante verde di accesso mostrerà il tipo di sessione. Non funziona benissimo con le sessioni ufficiali che non diventano ufficiali per bassa partecipazione.",
    "settings.dashboard_intelligence.label": "Centro intelligenza dashboard",
    "settings.dashboard_intelligence.help": "Mostra o nasconde il V4 Intelligence Center nella pagina dashboard. Si concentra sui progressi del membro, premi, crediti e attività recente.",
    "settings.dashboard_purchase.label": "Widget finanziario della dashboard",
    "settings.dashboard_purchase.help": "Mostra o nasconde il widget di riepilogo finanziario nella dashboard principale. Se lasciato attivo, i valori restano nascosti finché non li mostri.",
    "settings.no_toasts.label": "Nessuna notifica",
    "settings.no_toasts.help": "Non mostra notifiche nella parte alta dello schermo.",
    "settings.auto_close_toasts.label": "Chiudi automaticamente le notifiche dopo",
    "settings.auto_close_toasts.help": "Chiude le notifiche in alto dopo un ritardo. Non funziona con l'opzione precedente.",
    "settings.no_sidebars.label": "Nascondi barre laterali",
    "settings.no_sidebars.help": "Nasconde le barre laterali sinistra e destra per un'interfaccia più pulita e con più spazio.",
    "settings.collapse_menu.label": "Comprimi menu",
    "settings.collapse_menu.help": "Riduce il menu a sinistra mostrando solo le icone, così libera ancora più spazio per ciò che conta.",
    "settings.logger.label": "Mostra messaggi di log",
    "settings.logger.help": "Utile per capire perché è successo qualcosa.",
    "update.note_title": "Aggiornamento disponibile: {tag}",
    "update.note_description": "Stai usando la versione {version}. È disponibile una nuova GitHub Release da scaricare.",
    "update.help": "Scarica lo zip della release più recente, estrailo e poi ricarica l'estensione non pacchettizzata.",
    "update.open_latest_release": "Apri l'ultima release",
    "update.close_notice": "Chiudi avviso di aggiornamento",
    "update.available": "Aggiornamento disponibile",
    "update.current": "Attuale",
    "update.latest": "Ultima",
    "update.close": "Chiudi",
    "update.ready_title": "{tag} è pronta",
    "update.using_version": "Stai usando la versione {version}. È disponibile una nuova release GitHub da scaricare.",
    "update.toolbar_label": "Aggiorna {tag}",
    "update.toolbar_title": "Su GitHub è disponibile una versione più recente di iRefined: {tag}",
    "queue.registering": "Registrazione",
    "queue.register_now": "Registrati ora",
    "queue.queued": "In coda",
    "queue.select_car": "Scegli auto",
    "queue.queue": "Coda",
    "queue.queue_next_race": "Metti in coda la prossima gara",
    "queue.queue_race_when_open": "Mette questa gara in coda e registra quando il sito apre le iscrizioni.",
    "queue.race_group_title": "Coda gara",
    "queue.race_group_subtitle": "Prossime sessioni di gara",
    "queue.qualify_group_title": "Coda qualifica",
    "queue.qualify_group_subtitle": "Prossime sessioni di qualifica",
    "queue.queue_at": "Coda {time}",
    "queue.prompt_choose_car": "Scegli un'auto per la registrazione in coda nella serie {contentId}:",
    "queue.choose_car_alert": "Scegli un'auto!",
    "register.description": "Registra questa sessione dal browser.",
    "register.in_flight": "È già in corso una richiesta di registrazione dal browser.",
    "register.already_registered_series": "Sei già registrato per {seasonName}.",
    "register.already_registered_elsewhere": "Sei già registrato in un'altra serie.",
    "register.view_in_iracing": "Vedi in iRacing",
    "register.withdraw": "Ritirati",
    "register.registering_elsewhere": "Registrazione in corso altrove",
    "register.registered_elsewhere": "Registrato altrove",
    "register.unavailable": "Registrazione non disponibile",
    "register.register": "Registrati",
    "register.race_title": "Registra questa gara dal browser.",
    "register.session_title": "Registra questa sessione di {eventType} dal browser.",
    "register.join_race": "Entra in gara",
    "register.websocket_not_ready": "Il websocket di iRacing non è ancora pronto.",
    "share.session_default": "Sessione {index}",
    "share.prompt_import_which": "Importare quale configurazione di {label}?",
    "share.prompt_more_sessions": "... e altre {count} sessioni",
    "share.weather_label": "meteo",
    "share.session_label": "sessione",
    "share.invalid_selection": "Importazione annullata: selezione di {label} non valida",
    "share.weather_import_failed": "Importazione meteo non riuscita: nessun payload meteo trovato",
    "share.weather_imported": "Il meteo importato è stato applicato alla sessione corrente",
    "share.session_import_failed": "Importazione sessione non riuscita: nessun payload sessione trovato",
    "share.session_imported": "Le impostazioni della sessione importata sono state applicate",
    "tools.session_json": "JSON sessione",
    "tools.export_weather_json": "Esporta JSON meteo",
    "tools.export_session_json": "Esporta JSON sessione",
    "tools.export_hosted_sessions_json": "Esporta JSON sessioni hosted",
    "tools.export_league_sessions_json": "Esporta JSON sessioni league",
    "tools.weather_export_unavailable": "Esportazione meteo non disponibile in questa pagina",
    "tools.session_export_unavailable": "Esportazione sessione non disponibile in questa pagina",
    "tools.hosted_export_unavailable": "Esportazione sessioni hosted non disponibile in questa pagina",
    "tools.league_export_unavailable": "Esportazione sessioni league non disponibile in questa pagina",
    "status.registered": "Registrato",
    "status.registering": "Registrazione",
    "status.subtitle_queue": "Ritiro dalla sessione corrente e invio della registrazione per la gara in coda.",
    "status.subtitle_direct": "Richiesta di registrazione inviata dal browser. In attesa che il sito mostri la nuova sessione.",
    "status.subtitle_finishing": "Completamento della registrazione in background.",
    "status.subtitle_registered": "Sei registrato per la tua sessione di gara.",
    "status.starts_now": "Parte ora",
    "status.starts_in": "Parte tra {value}",
    "status.withdraw": "Ritirati",
    "status.join_race": "Entra in gara",
    "status.tooltip_found": "Trovata sessione di {sessionLabel}. La registrazione automatica inizia 5 minuti prima dell'orario di partenza. Fai clic sul punto blu per registrarti ora.",
    "status.tooltip_registering": "Registrazione in corso, può richiedere fino a 30 secondi.",
    "status.tooltip_searching": "Ricerca della sessione di {sessionLabel}.",
    "join.race": "Gara",
    "join.spectate": "Spettatore",
    "join.spot": "Spotter",
    "join.practice": "Pratica",
    "join.unscored": " (Non valida)",
    "translate.invalid_language": "Inserisci un codice lingua valido come ja, nl, ru, tr, pl o zh-CN."
  }
};
function Co(e, t = {}) {
  return String(e).replace(
    /\{(\w+)\}/g,
    (n, i) => t[i] !== void 0 && t[i] !== null ? String(t[i]) : ""
  );
}
function Eo(e, t) {
  var n, i;
  return ((n = wi[t]) == null ? void 0 : n[e]) ?? ((i = wi["en-US"]) == null ? void 0 : i[e]) ?? e;
}
function Ro(e, t) {
  try {
    return typeof (Intl == null ? void 0 : Intl.DisplayNames) != "function" ? null : new Intl.DisplayNames([t], {
      type: "language"
    }).of(e) || null;
  } catch {
    return null;
  }
}
function ws(e = "") {
  const t = Fn(e);
  return As.includes(t) ? t : "en-US";
}
function No(e = W()) {
  const t = e == null ? void 0 : e["extension-language"];
  return !t || t === "auto" ? "auto" : ws(t);
}
function B(e = W()) {
  if (typeof e == "string")
    return e === "auto" ? Oe() : ws(e);
  const t = No(e);
  return t === "auto" ? Oe() : t;
}
function $(e, t = {}, n = W()) {
  return Co(Eo(e, B(n)), t);
}
function To(e = W()) {
  const t = B(e);
  return [
    {
      value: "auto",
      label: $("settings.languages.auto", {}, t)
    },
    ...As.map((n) => ({
      value: n,
      label: Ro(n, t) || xo[n] || n
    }))
  ];
}
function Si(e = W()) {
  const t = B(e);
  return window.dispatchEvent(
    new CustomEvent(it, {
      detail: { locale: t }
    })
  ), t;
}
let ht = null, Lt = !1;
function zo(e, t, n) {
  return Math.min(n, Math.max(t, e));
}
function Wn() {
  if (ht)
    return ht;
  const e = window.AudioContext || window.webkitAudioContext;
  return e ? (ht = new e(), ht) : null;
}
function an() {
  Lt && (Lt = !1, ["pointerdown", "keydown", "touchstart"].forEach((e) => {
    window.removeEventListener(e, Ss, !0);
  }));
}
function Ss() {
  const e = Wn();
  if (!e) {
    an();
    return;
  }
  if (e.state === "running") {
    an();
    return;
  }
  e.resume().then(() => {
    e.state === "running" && an();
  }).catch(() => {
  });
}
function ks() {
  const e = Wn();
  !e || Lt || e.state === "running" || (Lt = !0, ["pointerdown", "keydown", "touchstart"].forEach((t) => {
    window.addEventListener(t, Ss, !0);
  }));
}
function qs(e = {}) {
  const { ignoreEnabled: t = !1 } = e, n = W();
  if (!t && n["queue-register-sound"] === !1)
    return !1;
  const i = Wn();
  if (!i)
    return !1;
  const s = Number(n["queue-register-sound-volume"]), r = zo(
    Number.isNaN(s) ? 65 : s,
    0,
    100
  ) / 100, a = () => {
    const o = i.currentTime + 0.02;
    [
      { time: o, frequency: 659.25, duration: 0.11, gain: 0.14, type: "triangle" },
      { time: o + 0.12, frequency: 987.77, duration: 0.11, gain: 0.13, type: "triangle" },
      { time: o + 0.24, frequency: 1318.51, duration: 0.17, gain: 0.15, type: "sawtooth" }
    ].forEach(({ time: u, frequency: l, duration: g, gain: f, type: d }) => {
      const h = i.createOscillator(), w = i.createGain();
      h.type = d, h.frequency.setValueAtTime(l, u), w.gain.setValueAtTime(1e-4, u), w.gain.exponentialRampToValueAtTime(
        Math.max(1e-4, f * r),
        u + 0.02
      ), w.gain.exponentialRampToValueAtTime(1e-4, u + g), h.connect(w), w.connect(i.destination), h.start(u), h.stop(u + g + 0.02);
    });
  };
  return i.state === "running" ? (a(), !0) : (i.resume().then(() => {
    i.state === "running" && a();
  }).catch(() => {
  }), !1);
}
const Do = 'a.active[href*="go-racing"]', xs = "auto-register", Lo = "iref-" + xs, Cs = "iref_watch_queue", Ge = "iref_registration_state", Io = 300 * 1e3, Es = 900 * 1e3, Rs = 720 * 60 * 1e3, Ns = 2500, Oo = 7e3, Bo = 7200 * 1e3, jo = 15 * 1e3, H = 5, Ut = 3, Hn = 2, Mo = {
  [H]: [
    "race",
    "races",
    "corrida",
    "corridas",
    "carrera",
    "carreras",
    "rennen",
    "gara",
    "gare",
    "course",
    "courses",
    "gonka",
    "gonki",
    "гонк"
  ],
  [Ut]: [
    "qual",
    "quali",
    "qualify",
    "qualifying",
    "qualification",
    "qualificacao",
    "clasificacion",
    "qualifikation",
    "qualifica",
    "qualificaçao",
    "qualific",
    "квалификац",
    "квал"
  ],
  [Hn]: [
    "practice",
    "pratica",
    "practica",
    "treino",
    "training",
    "entrain",
    "allenamento",
    "трениров",
    "практик"
  ]
}, $o = [
  "open now",
  "opens soon",
  "abre agora",
  "abre em breve",
  "abre ahora",
  "abre pronto",
  "ouvre maintenant",
  "ouvre bientot",
  "ouvert maintenant",
  "aperto ora",
  "apre presto",
  "apre tra poco",
  "jetzt offen",
  "offnet bald",
  "открыто сейчас",
  "скоро откроется"
], Fo = {
  days: [
    "days",
    "day",
    "dias",
    "dia",
    "jours",
    "jour",
    "giorni",
    "giorno",
    "tage",
    "tag",
    "дней",
    "дня",
    "день",
    "ден",
    "дн"
  ],
  hours: [
    "hours",
    "hour",
    "hrs",
    "hr",
    "horas",
    "hora",
    "heures",
    "heure",
    "stunden",
    "stunde",
    "часов",
    "часа",
    "час",
    "ore",
    "ora",
    "ч"
  ],
  minutes: [
    "minutes",
    "minute",
    "mins",
    "min",
    "minutos",
    "minuto",
    "minuten",
    "minuti",
    "minut",
    "минуты",
    "минута",
    "минут",
    "мин"
  ],
  seconds: [
    "seconds",
    "second",
    "secs",
    "sec",
    "segundos",
    "segundo",
    "segs",
    "seg",
    "secondes",
    "seconde",
    "sekunden",
    "sekunde",
    "секунды",
    "секунда",
    "секунд",
    "сек"
  ]
}, Wo = Object.fromEntries(
  Object.entries(Fo).map(([e, t]) => {
    const n = [...new Set(
      t.map((i) => Xe(i)).filter(Boolean).sort((i, s) => s.length - i.length)
    )];
    return [
      e,
      new RegExp(
        `(\\d+)\\s*(?:${n.map(Po).join("|")})`,
        "u"
      )
    ];
  })
), ki = /(\d+)\s*([dhmsчд])(?=$|\s|\d|[,:;.)])/giu;
let qi = 0;
function S(e, t = {}) {
  return $(e, t);
}
function Ho() {
  return W()["queue-car-prompt"] === !0;
}
function Uo() {
  return W()["queue-requeue-displaced-registration"] === !0;
}
function me(e = "") {
  return e.replace(/\s+/g, " ").trim();
}
function It(e = "") {
  return me(e).toLowerCase();
}
function Xe(e = "") {
  const t = It(e);
  return typeof t.normalize != "function" ? t : t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function Po(e = "") {
  return String(e).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function Ts(e) {
  const t = Number(e);
  return Number.isNaN(t) ? null : t;
}
function Un(e = "") {
  return e.split(`
`).map((t) => me(t)).filter(Boolean);
}
function Je(e = "") {
  return me(e).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function _e(e = "") {
  return e.replace(/(?:\s*-\s*)?\d{4}\sSeason(?:\s\d+)?/, "").replace(/Fixed\s(?:-\s)?Fixed/, "Fixed").replace("Series Series", "Series");
}
function re() {
  return Array.isArray(window.watchQueue) || (window.watchQueue = []), window.watchQueue;
}
function psAttemptAgeMs(e) {
  if (!e || typeof e != "object")
    return Number.POSITIVE_INFINITY;
  const t = e.last_attempt_at || e.requested_at || e.updated_at || e.registered_at || e.created_at;
  const n = new Date(t).getTime();
  return Number.isFinite(n) ? Date.now() - n : Number.POSITIVE_INFINITY;
}
function psIsStaleRegistering(e) {
  return !!e && e.status === "registering" && psAttemptAgeMs(e) > PS_REGISTERING_TIMEOUT_MS;
}
function zs(e) {
  if (!e || typeof e != "object")
    return !0;
  if (psIsStaleRegistering(e))
    return !0;
  const t = e.start_time || e.updated_at || e.registered_at;
  if (!t)
    return !1;
  const n = new Date(t).getTime();
  return Number.isNaN(n) ? !1 : n < qe() - Rs;
}
function Ds() {
  try {
    const e = JSON.parse(localStorage.getItem(Ge));
    if (!e || zs(e)) {
      window.irefRegistrationState = null, localStorage.removeItem(Ge);
      return;
    }
    window.irefRegistrationState = e;
  } catch {
    window.irefRegistrationState = null, localStorage.removeItem(Ge);
  }
}
function be() {
  return window.irefRegistrationState === void 0 && Ds(), zs(window.irefRegistrationState) && Se(), window.irefRegistrationState || null;
}
function Ot(e) {
  return !e || typeof e != "object" ? (Se(), null) : (window.irefRegistrationState = {
    ...e,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }, localStorage.setItem(
    Ge,
    JSON.stringify(window.irefRegistrationState)
  ), window.irefRegistrationState);
}
function Se() {
  window.irefRegistrationState = null, localStorage.removeItem(Ge);
}
function Vo() {
  const e = window.irefPendingWithdrawState;
  return !e || !e.expires_at || e.expires_at <= Date.now() ? (window.irefPendingWithdrawState = null, null) : e;
}
function Ko() {
  window.irefPendingWithdrawState = {
    path: location.pathname,
    expires_at: Date.now() + jo
  };
}
function Ls() {
  window.irefPendingWithdrawState = null;
}
function Pn() {
  const e = Vo();
  return e ? e.path === location.pathname : !1;
}
function Qo() {
  return be();
}
function Go(e = {}) {
  Ls();
  const t = be();
  return Ot(t ? {
    ...t,
    ...e,
    status: "registered",
    confirmed_by_site: !0,
    source: t.source || "site",
    registered_at: t.registered_at || (/* @__PURE__ */ new Date()).toISOString()
  } : {
    status: "registered",
    confirmed_by_site: !0,
    source: "site",
    ...e,
    registered_at: (/* @__PURE__ */ new Date()).toISOString()
  });
}
function Sn(e) {
  return `${e.season_id}:${st(e)}:${new Date(e.start_time).toISOString()}`;
}
function Is() {
  return 0;
}
function Jo(e) {
  window.irefCurrentTimeOffsetMs = 0;
  return 0;
}
function Yo(e = "") {
  const t = Xe(e);
  return $o.some(
    (n) => t.includes(Xe(n))
  );
}
function Xo(e = "") {
  const t = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  };
  let n = !1;
  ki.lastIndex = 0;
  for (const [, i, s] of e.matchAll(ki)) {
    const r = parseInt(i, 10);
    if (!Number.isNaN(r))
      switch (n = !0, s.toLowerCase()) {
        case "d":
        case "д":
          t.days = r;
          break;
        case "h":
        case "ч":
          t.hours = r;
          break;
        case "m":
          t.minutes = r;
          break;
        case "s":
          t.seconds = r;
          break;
      }
  }
  return n ? t : null;
}
function Zo(e = "") {
  const t = {};
  return Object.entries(Wo).forEach(([n, i]) => {
    const s = e.match(i);
    if (!s)
      return;
    const r = parseInt(s[1], 10);
    Number.isNaN(r) || (t[n] = r);
  }), t;
}
function ec(e = "") {
  const t = It(e), n = Xe(e);
  if (!t)
    return null;
  if (Yo(n))
    return 0;
  const i = t.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
  if (i) {
    const l = i[1].split(":").map((d) => parseInt(d, 10));
    if (l.some((d) => Number.isNaN(d)))
      return null;
    if (l.length === 3) {
      const [d, h, w] = l;
      return (d * 60 * 60 + h * 60 + w) * 1e3;
    }
    const [g, f] = l;
    return (g * 60 + f) * 1e3;
  }
  const s = Xo(n) || {}, r = Zo(n), a = r.days ?? s.days ?? null, o = r.hours ?? s.hours ?? null, c = r.minutes ?? s.minutes ?? null, u = r.seconds ?? s.seconds ?? null;
  return a === null && o === null && c === null && u === null ? null : (((a || 0) * 24 + (o || 0)) * 60 * 60 + (c || 0) * 60 + (u || 0)) * 1e3;
}
function tc(e = "") {
  return M(e, "nextRacePrefix") || M(e, "raceDuration") || M(e, "drivers") || M(e, "lastRace") || M(e, "upNext");
}
function nc(e = "") {
  return !/\d/.test(e) && (M(e, "raceDuration") || M(e, "drivers") || M(e, "lastRace") || M(e, "upNext"));
}
function ic(e) {
  if (!e)
    return null;
  const t = Un(e.innerText || "");
  for (let n = 0; n < t.length; n += 1) {
    const i = t[n], s = t[n - 1] || "";
    if (/^\d{1,2}:\d{2}$/.test(i) || tc(i) || nc(s))
      continue;
    const r = ec(i);
    if (r !== null)
      return r;
  }
  return null;
}
function Os(e, t) {
  var s;
  const n = new Date((s = t == null ? void 0 : t.session) == null ? void 0 : s.start_time).getTime(), i = ic(e);
  return Number.isNaN(n) || i === null ? !1 : (Jo(n - i - Date.now()), !0);
}
function qe() {
  return Date.now() + Is();
}
function xe(e = {}) {
  const t = (e == null ? void 0 : e.session) || e;
  return !!(t != null && t.session_id) && t.preregister === !0;
}
function Bs(e) {
  const t = new Date(e).getTime();
  if (Number.isNaN(t))
    return !1;
  const n = t - qe();
  return n <= Io && n >= -Es;
}
function sc(e) {
  const t = new Date(e.start_time).getTime();
  return Number.isNaN(t) ? !0 : t < qe() - Rs;
}
function Pt(e = re()) {
  const t = /* @__PURE__ */ new Map();
  return e.forEach((n) => {
    !n || sc(n) || t.set(Sn(n), n);
  }), [...t.values()].sort(
    (n, i) => new Date(n.start_time) - new Date(i.start_time)
  );
}
function Ae() {
  localStorage.setItem(Cs, JSON.stringify(Pt()));
}
function Vt(e) {
  window.watchQueue = Pt(e), Ae(), sr();
}
function psResetStaleRegisteringQueueItems() {
  let e = !1;
  re().forEach((t) => {
    if (!psIsStaleRegistering(t))
      return;
    t.status = t.session_id ? "found" : "queued";
    t.last_attempt_at = null;
    e = !0;
    b(`🚫 Register attempt for ${_e(t.season_name || "")} timed out; queue is ready to retry`);
  }), e && (Ae(), sr());
}
function $e(e) {
  const t = new Date(e);
  return Number.isNaN(t.getTime()) ? String(e) : t.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: !1
  });
}
function rc() {
  try {
    const e = JSON.parse(localStorage.getItem(Cs));
    if (!Array.isArray(e)) {
      window.watchQueue = [];
      return;
    }
    window.watchQueue = Pt(
      e.map((t) => {
        const n = new Date(t.start_time);
        return Number.isNaN(n.getTime()) ? null : {
          ...t,
          event_type: t.event_type ?? H,
          event_type_name: t.event_type_name || "Race",
          registration_open: t.registration_open === !0,
          start_time: n.toISOString(),
          status: t.status === "found" && t.session_id ? "found" : "queued",
          session_id: t.session_id ?? null,
          subsession_id: t.subsession_id ?? null,
          created_at: t.created_at || (/* @__PURE__ */ new Date()).toISOString(),
          last_attempt_at: t.last_attempt_at || null,
          last_found_at: t.last_found_at || null
        };
      }).filter(Boolean)
    ), Ae();
  } catch {
    window.watchQueue = [];
  }
}
function Ie(e) {
  Vt(
    re().filter((t) => Sn(t) !== Sn(e))
  );
}
function st(e) {
  return (e == null ? void 0 : e.event_type) !== null && (e == null ? void 0 : e.event_type) !== void 0 ? e.event_type : js((e == null ? void 0 : e.event_type_name) || "") ?? H;
}
function js(e = "") {
  const t = Xe(e);
  if (!t)
    return null;
  const n = Object.entries(Mo).find(
    ([, i]) => i.some((s) => t.includes(s))
  );
  return n ? Number(n[0]) : null;
}
function Q(e = {}) {
  const t = Ts(e.event_type);
  return t !== null ? t : js(e.event_type_name || "");
}
function ke(e = {}, t = H) {
  return Q(e) ?? t;
}
function rt(e = {}) {
  return e.event_type_name ? e.event_type_name : Q(e) === Hn ? "Practice" : Q(e) === Ut ? "Qualify" : Q(e) === H ? "Race" : "Session";
}
function ac(e, t) {
  const n = Q(e), i = st(t);
  return n !== null && i !== null && i !== void 0 ? String(n) === String(i) : It(rt(e)) === It((t == null ? void 0 : t.event_type_name) || "");
}
function Ms(e = {}) {
  return Q(e) === H;
}
function Vn(e = {}) {
  return Q(e) === Ut;
}
function Kn(e = {}) {
  return Q(e) === Hn;
}
function Qn(e = {}) {
  return Ms(e) || Vn(e);
}
function isIrefSpectateAction(e) {
  if (!e)
    return !1;
  try {
    const t = Ao(e), n = Number(((t == null ? void 0 : t.registrationStatus) == null ? void 0 : t.registrationStatus.user_role) ?? NaN);
    if (n === 2 || n === 4)
      return !0;
  } catch {
  }
  const t = Xe(e.innerText || e.textContent || "");
  return /\bspectat|\bassistir\b|\bespect|\bspotter\b|\bspot\b/.test(t);
}
function oc(e = {}) {
  return Ms(e) || Vn(e) || Kn(e);
}
function Ze(e, t, n) {
  return `${e}|${t ?? H}|${new Date(n).toISOString()}`;
}
function cc(e = "") {
  const t = e.split("|");
  return t.length === 2 ? {
    seasonId: t[0],
    eventType: H,
    startTime: t[1]
  } : {
    seasonId: t[0],
    eventType: t[1],
    startTime: t.slice(2).join("|")
  };
}
function Fe(e, t, n = H) {
  const i = new Date(t).toISOString();
  return re().find(
    (s) => Number(s.season_id) === Number(e) && String(st(s)) === String(n) && new Date(s.start_time).toISOString() === i
  );
}
function $s(e, t, n = H) {
  const i = new Date(t).toISOString();
  return re().findIndex(
    (s) => Number(s.season_id) === Number(e) && String(st(s)) === String(n) && new Date(s.start_time).toISOString() === i
  );
}
function at(e, t) {
  let n = e;
  for (; n && n !== document.body; ) {
    if (t(n))
      return n;
    n = n.parentElement;
  }
  return null;
}
function lc(e) {
  return [...document.querySelectorAll("h1, h2, h3, h4, h5, h6")].find(
    (t) => e(me(t.textContent))
  );
}
function Fs() {
  return {
    visibleOnly: !1,
    skipSelectors: ["#iref-top-action-row", "#iref-top-queue-row", "#iref-ui-root"]
  };
}
function topSessionEntry(e = D()) {
  return e ? Z(e, Fs()).find(
    ({ button: t, props: n }) => (n == null ? void 0 : n.session) && !t.closest("table")
  ) || null : null;
}
function Ws(e = document, t = {}) {
  const { visibleOnly: n = !1, excludeTables: i = !1 } = t;
  return Z(e, {
    ...Fs(),
    visibleOnly: n
  }).filter(
    ({ button: s }) => !i || !s.closest("table")
  );
}
function xi(e, t) {
  const n = e.getBoundingClientRect(), i = t.getBoundingClientRect();
  return n.top !== i.top ? n.top - i.top : n.left !== i.left ? n.left - i.left : 0;
}
function Hs() {
  var e;
  return ((e = Ws(document, {
    visibleOnly: !1,
    excludeTables: !0
  }).filter(({ props: t }) => Qn(t == null ? void 0 : t.session)).map((t) => ({
    entry: t,
    section: Us(t)
  })).filter(({ section: t }) => !!t).sort(
    (t, n) => xi(t.section, n.section) || xi(t.entry.button, n.entry.button)
  )[0]) == null ? void 0 : e.entry) || null;
}
function Us(e) {
  var i;
  if (!(e != null && e.button))
    return null;
  let t = e.button.parentElement, n = null;
  for (; t && t !== document.body; ) {
    if (typeof t.querySelector != "function") {
      t = t.parentElement;
      continue;
    }
    if (t.querySelector("table"))
      break;
    const s = Ws(t, {
      visibleOnly: !1,
      excludeTables: !0
    });
    if (!s.some(({ button: r }) => r === e.button)) {
      t = t.parentElement;
      continue;
    }
    s.length === 1 && Un(t.innerText || "").length >= 4 && (n = t), t = t.parentElement;
  }
  return n || ((i = Yn(e.button)) == null ? void 0 : i.parentElement) || e.button.parentElement;
}
function Ps(e, t = null) {
  const n = Z(document, { visibleOnly: !1 }).find(
    ({ button: i, props: s }) => !(t != null && t.contains(i)) && (!e || e(s, i))
  );
  return n ? at(
    n.button,
    (i) => i !== n.button && typeof i.querySelector == "function" && !!i.querySelector("table")
  ) : null;
}
function uc() {
  const e = lc(
    (t) => M(t, "nextRacePrefix")
  );
  return e ? at(e, (t) => {
    const n = me(t.innerText || "");
    return M(n, "nextRacePrefix") && (!!nt(t, {
      visibleOnly: !1,
      skipSelectors: ["#iref-top-action-row", "#iref-top-queue-row", "#iref-ui-root"]
    }) || Dt(n, "upNext") || Dt(n, "raceDuration"));
  }) : null;
}
function D() {
  return uc() || Us(Hs());
}
function Vs() {
  const e = [...document.querySelectorAll("p, span, div")].find(
    (n) => Dt(n.textContent || "", "availableSessionsDescription")
  ), t = e ? at(
    e,
    (n) => n !== e && typeof n.querySelector == "function" && !!n.querySelector("table")
  ) : null;
  return t || Ps(
    (n) => Qn(n == null ? void 0 : n.session),
    D()
  );
}
function Ks() {
  return Ps(
    (e) => Kn(e == null ? void 0 : e.session),
    D()
  );
}
function Qs() {
  var s;
  const e = D(), t = e ? Ce(e) : null, n = (t == null ? void 0 : t.button) && ((s = Yn(t.button)) == null ? void 0 : s.parentElement) || e;
  if (!n)
    return null;
  const i = new Set(
    Z(n, { visibleOnly: !1 }).map(
      ({ button: r }) => r
    )
  );
  return [...n.querySelectorAll("button, a")].filter((r) => !r.closest("#iref-top-action-row")).filter((r) => !r.closest("#iref-top-queue-row")).filter((r) => !r.closest("#iref-ui-root")).filter((r) => Ht(r)).filter((r) => !i.has(r)).find((r) => BsWithdrawActionText(r.innerText || r.textContent || r.getAttribute("aria-label") || ""));
}
function BsWithdrawActionText(e = "") {
  const t = Xe(e);
  return [
    "withdraw",
    "cancel registration",
    "cancelar registro",
    "cancelar registo",
    "retirarse",
    "zuruckziehen",
    "se retirer",
    "ritirati"
  ].some((n) => t === n || t.includes(n));
}
function BsRegisteredActionText(e = "") {
  const t = Xe(e);
  return [
    "registered",
    "registrado",
    "registado",
    "inscrito",
    "inscrit",
    "registriert",
    "registrato"
  ].some((n) => t === n || t.includes(n));
}
const IREF_AUTO_CONFIRM_TTL_MS = 3e4;
function psReadAutoConfirmState() {
  const e = window.irefAutoConfirmState;
  return !e || !e.expires_at || e.expires_at <= Date.now() ? (window.irefAutoConfirmState = null, null) : e;
}
function psBeginAutoConfirm(e, t = IREF_AUTO_CONFIRM_TTL_MS) {
  return window.irefAutoConfirmState = {
    mode: String(e || ""),
    expires_at: Date.now() + Math.max(5e3, Number(t) || IREF_AUTO_CONFIRM_TTL_MS)
  }, window.irefAutoConfirmState;
}
function psClearAutoConfirm(e = "") {
  const t = psReadAutoConfirmState();
  (!t || e && t.mode !== e) || (window.irefAutoConfirmState = null);
}
function psScheduleAutoConfirmClear(e = "", t = 5e3) {
  e && window.setTimeout(() => {
    psClearAutoConfirm(e);
  }, Math.max(1e3, Number(t) || 5e3));
}
function psHasAutoConfirmMode(e) {
  const t = psReadAutoConfirmState();
  return !!t && (t.mode === e || t.mode === "register-flow" && (e === "register" || e === "withdraw"));
}
function kn(e = {}) {
  const { preferDirect: t = !1 } = e;
  if (t)
    return de.withdraw();
  const n = Qs();
  return n ? (n.click(), !0) : de.withdraw();
}
function Ce(e) {
  var n;
  const t = e ? topSessionEntry(e) || nt(e, Fs()) : topSessionEntry(D()) || Hs();
  return !(t != null && t.button) || !((n = t == null ? void 0 : t.props) != null && n.session) ? null : t;
}
function registerActionEntry(e) {
  if (!e)
    return null;
  const t = e.session_id ? Number(e.session_id) : null, n = e.season_id ? Number(e.season_id) : null, i = e.start_time ? new Date(e.start_time).toISOString() : null;
  return Qt(document).find(({ button: s, props: r }) => {
    var a;
    const o = r == null ? void 0 : r.session;
    if (!o || isIrefSpectateAction(s))
      return !1;
    if (t !== null && Number(o.session_id) === t)
      return !0;
    const c = Number((r == null ? void 0 : r.contentId) ?? ((a = r == null ? void 0 : r.session) == null ? void 0 : a.season_id) ?? NaN), u = i && o.start_time ? new Date(o.start_time).toISOString() : null;
    return Number.isFinite(c) && n !== null && c === n && !!u && u === i && ac(o, e);
  }) || null;
}
function sendNativeRegister(e) {
  const t = registerActionEntry(e);
  return !t || t.button.disabled ? !1 : Xc(t.button);
}
function sendRegister(e, t = {}) {
  const { preferDirect: n = !1 } = t;
  return !n && sendNativeRegister(e) ? !0 : !de.isReady() ? (b("🚫 Cannot register yet because the iRacing websocket is offline"), window.alert(S("register.websocket_not_ready")), !1) : de.register(
    e.season_name,
    e.car_id,
    e.car_class_id,
    e.session_id,
    e.subsession_id
  );
}
function Gs(e, t, n = "") {
  return e ? t != null && e.season_id !== null && e.season_id !== void 0 ? Number(e.season_id) === Number(t) : n && e.season_name ? _e(e.season_name) === _e(n) : !1 : !1;
}
function dc(e, t) {
  var n, i;
  if (!e)
    return !1;
  if (e.source_path && e.source_path === location.pathname)
    return !0;
  if (e.source_url)
    try {
      if (new URL(e.source_url).pathname === location.pathname)
        return !0;
    } catch {
    }
  return Gs(
    e,
    (t == null ? void 0 : t.contentId) ?? ((n = t == null ? void 0 : t.session) == null ? void 0 : n.season_id) ?? null,
    ((i = t == null ? void 0 : t.session) == null ? void 0 : i.season_name) || ""
  );
}
function ot(e = be()) {
  return !!e && (e.status === "registering" || e.status === "registered");
}
function Kt(e, t) {
  return !e || !t ? !1 : e.subsession_id && t.subsession_id && Number(e.subsession_id) === Number(t.subsession_id) || e.session_id && t.session_id && Number(e.session_id) === Number(t.session_id) ? !0 : e.season_id !== null && e.season_id !== void 0 && t.season_id !== null && t.season_id !== void 0 && Number(e.season_id) === Number(t.season_id) && e.start_time && t.start_time ? new Date(e.start_time).toISOString() === new Date(t.start_time).toISOString() : !1;
}
function pc(e, t) {
  const n = [...e.querySelectorAll("p, span, div")].find(
    (i) => /^\d{1,2}:\d{2}$/.test(me(i.textContent))
  );
  return n ? me(n.textContent) : $e(t);
}
function gc(e, t, n) {
  const i = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!i)
    return null;
  const s = new Date(e);
  for (s.setHours(parseInt(i[1], 10), parseInt(i[2], 10), 0, 0); s <= n; )
    s.setDate(s.getDate() + 1);
  return {
    label: t,
    start_time: s.toISOString()
  };
}
function hc(e = []) {
  const n = e.find((i) => M(i, "upNext")) || e.find((i) => (i.match(/\b\d{1,2}:\d{2}\b/g) || []).length > 1);
  return n ? [...new Set(n.match(/\b\d{1,2}:\d{2}\b/g) || [])] : [];
}
function fc(e, t) {
  var a;
  if (!((a = t == null ? void 0 : t.session) != null && a.start_time))
    return [];
  const n = new Date(t.session.start_time);
  if (Number.isNaN(n.getTime()))
    return [];
  const i = [
    {
      label: pc(e, n),
      start_time: n.toISOString()
    }
  ], s = hc(Un(e.innerText || ""));
  let r = n;
  return s.forEach((o) => {
    const c = gc(n, o, r);
    c && (r = new Date(c.start_time), i.push(c));
  }), i;
}
function Ci(e, t) {
  const n = [...e.querySelectorAll("div, p, h2, h3, button, span")];
  for (const i of n) {
    const s = ys(
      i,
      (r) => Array.isArray(r.cars) && Array.isArray(r.carClassIds) && (r.seasonId === void 0 || Number(r.seasonId) === Number(t))
    );
    if (s)
      return s;
  }
  return null;
}
function mc(e) {
  try {
    const t = JSON.parse(localStorage.getItem(`selected_car_season_${e}`));
    if (!t || typeof t != "object")
      return null;
    const n = t.car_id ?? t.carId ?? null, i = t.car_class_id ?? t.carClassId ?? null;
    return !n || !i ? null : {
      car_id: n,
      car_class_id: i,
      car_name: t.car_name ?? t.carName ?? null
    };
  } catch {
    return null;
  }
}
function Gn(e, t) {
  !(t != null && t.car_id) || !(t != null && t.car_class_id) || localStorage.setItem(
    `selected_car_season_${e}`,
    JSON.stringify(t)
  );
}
function Bt(e, t = []) {
  return e ? e.car_class_id ? e.car_class_id : Array.isArray(e.car_classes) && e.car_classes.length > 0 ? e.car_classes[0].car_class_id ?? t[0] ?? null : t[0] ?? null : t[0] ?? null;
}
function _c(e, t, n = [], i = []) {
  if (!(t != null && t.car_id) || !(t != null && t.car_class_id))
    return t;
  const s = n.find((a) => Number(a.car_id) === Number(t.car_id));
  if (!s)
    return t;
  const r = {
    car_id: t.car_id,
    car_class_id: t.car_class_id || Bt(s, i),
    car_name: t.car_name || s.car_name || null
  };
  return Gn(e, r), r;
}
function bc(e, t = [], n = []) {
  if (!Array.isArray(t) || t.length < 1)
    return null;
  const i = t.map((c, u) => `${u + 1}. ${c.car_name}`).join(`
`), s = window.prompt(
    `${S("queue.prompt_choose_car", { contentId: e })}

${i}`,
    "1"
  );
  if (!s)
    return b("Queue cancelled: no car chosen"), null;
  const r = parseInt(s, 10) - 1;
  if (Number.isNaN(r) || r < 0 || r >= t.length)
    return b("Queue cancelled: invalid car selection"), null;
  const a = t[r], o = {
    car_id: a.car_id,
    car_class_id: Bt(a, n),
    car_name: a.car_name || null
  };
  return o.car_class_id ? (Gn(e, o), b(`🚗 Queue will use ${a.car_name}`), o) : (b("Queue cancelled: could not resolve the selected car class"), null);
}
function Ei() {
  window.alert(S("queue.choose_car_alert"));
}
function Js(e, t, n) {
  const i = mc(e), s = Ci(n, e) || (n !== document ? Ci(document, e) : null), r = Array.isArray(s == null ? void 0 : s.cars) ? s.cars : [], a = Array.isArray(s == null ? void 0 : s.carClassIds) ? s.carClassIds : [];
  if (i)
    return _c(e, i, r, a);
  if (!s)
    return b(`🚫 No car selection context found for series ${e}`), Ei(), null;
  const o = (t == null ? void 0 : t.preselectedCarId) ?? (s == null ? void 0 : s.preselectedCarId) ?? null;
  if (o) {
    const c = r.find(
      (u) => Number(u.car_id) === Number(o)
    );
    if (c)
      return {
        car_id: c.car_id,
        car_class_id: Bt(c, a),
        car_name: c.car_name || null
      };
  }
  if (r.length === 1) {
    const c = {
      car_id: r[0].car_id,
      car_class_id: Bt(r[0], a),
      car_name: r[0].car_name || null
    };
    return Gn(e, c), c;
  }
  return Ho() ? bc(e, r, a) : (b(`🚫 Queue needs a selected car for series ${e}`), Ei(), null);
}
function yc(e, t, n) {
  var r;
  const i = e.session || {}, s = ke(i);
  return {
    car_id: n.car_id,
    car_class_id: n.car_class_id,
    car_name: n.car_name || null,
    event_type: s ?? H,
    event_type_name: rt(i),
    season_id: e.contentId ?? i.season_id,
    season_name: _e(i.season_name || ""),
    start_time: new Date(t.start_time).toISOString(),
    start_label: t.label || $e(t.start_time),
    track_name: i.track_name || ((r = i.track) == null ? void 0 : r.track_name) || null,
    source_path: location.pathname,
    source_url: location.href,
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    last_attempt_at: null,
    last_found_at: null,
    registration_open: xe(e),
    status: "queued",
    session_id: null,
    subsession_id: null
  };
}
function Ys(e) {
  return e ? {
    status: "registered",
    source: "queue",
    confirmed_by_site: !1,
    season_id: e.season_id,
    season_name: e.season_name,
    car_id: e.car_id,
    car_class_id: e.car_class_id,
    car_name: e.car_name || null,
    event_type: st(e),
    event_type_name: e.event_type_name || "Race",
    session_id: e.session_id ?? null,
    subsession_id: e.subsession_id ?? null,
    start_time: e.start_time,
    start_label: e.start_label,
    track_name: e.track_name || null,
    source_path: e.source_path,
    source_url: e.source_url
  } : null;
}
function vc(e) {
  if (!(e != null && e.season_id) || !e.start_time || !e.car_id || !e.car_class_id)
    return null;
  const t = new Date(e.start_time);
  if (Number.isNaN(t.getTime()))
    return null;
  const n = e.event_type ?? H;
  return {
    car_id: e.car_id,
    car_class_id: e.car_class_id,
    car_name: e.car_name || null,
    event_type: n,
    event_type_name: e.event_type_name || (Number(n) === Ut ? "Qualify" : "Race"),
    season_id: e.season_id,
    season_name: _e(e.season_name || ""),
    start_time: t.toISOString(),
    start_label: e.start_label || $e(t),
    track_name: e.track_name || null,
    source_path: e.source_path || location.pathname,
    source_url: e.source_url || location.href,
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    last_attempt_at: null,
    last_found_at: null,
    registration_open: !!e.session_id,
    status: "queued",
    session_id: e.session_id ?? null,
    subsession_id: e.subsession_id ?? null
  };
}
function Xs(e, t) {
  if (!Uo() || !ot(e) || !(e != null && e.season_id) || !e.start_time || !e.car_id || !e.car_class_id || Kt(e, t))
    return !1;
  const n = new Date(e.start_time).getTime(), i = new Date(t == null ? void 0 : t.start_time).getTime();
  return !(Number.isNaN(n) || Number.isNaN(i) || n <= i);
}
function Ac(e, t) {
  if (!Xs(e, t))
    return !1;
  const n = vc(e);
  return !n || Fe(n.season_id, n.start_time, n.event_type) ? !1 : (Vt([...re(), n]), b(
    `📝 Re-queued displaced ${n.event_type_name.toLowerCase()} session for ${n.season_name} ${n.start_label}`
  ), !0);
}
function Zs(e, t, n, i = !1) {
  if (e) {
    if (e.classList.remove(
      "iref-queue-btn-queued",
      "iref-queue-btn-found",
      "iref-queue-btn-registering",
      "iref-queue-btn-registered",
      "danger"
    ), e.disabled = !1, !t) {
      if (i) {
        e.textContent = S("status.registered"), e.disabled = !0, e.classList.add("iref-queue-btn-registered");
        return;
      }
      e.textContent = n;
      return;
    }
    if (t.status === "registering") {
      e.textContent = S("queue.registering"), e.disabled = !0, e.classList.add("iref-queue-btn-registering");
      return;
    }
    if (t.status === "found") {
      e.textContent = S("queue.register_now"), e.classList.add("iref-queue-btn-found");
      return;
    }
    e.textContent = S("queue.queued"), e.classList.add("iref-queue-btn-queued");
  }
}
function er(e, t) {
  const n = document.createElement("button");
  return n.type = "button", n.id = `iref-queue-${e}`, n.className = "iref-queue-btn", n.textContent = t, n;
}
function tr(e, t) {
  b(`🚫 No car selected for queue in series ${t}`), e.textContent = S("queue.select_car"), e.classList.add("danger"), window.setTimeout(() => {
    e.classList.remove("danger"), e.textContent = e.dataset.irefIdleLabel || S("queue.queue");
  }, 2500);
}
function wc(e, t) {
  return !e || !(t != null && t.session_id) ? !1 : (e.session_id = t.session_id, e.subsession_id = t.subsession_id ?? null, e.registration_open = xe(t), e.status = "found", e.last_found_at = (/* @__PURE__ */ new Date()).toISOString(), Ae(), !0);
}
function YsKey(e, t, n = H) {
  return {
    season_id: e,
    event_type: n,
    start_time: new Date(t).toISOString()
  };
}
function PsRegistered(e, t, n = H) {
  const i = typeof il == "function" ? il() : be();
  return ot(i) && Kt(i, YsKey(e, t, n));
}
function nr(e) {
  if (!(e != null && e.session_id))
    return !1;
  const t = be();
  return ot(t) ? t.status === "registering" ? !1 : !Kt(
    t,
    Ys(e)
  ) : !0;
}
function Sc(e, t, n) {
  var a, o;
  if (!((a = e == null ? void 0 : e.session) != null && a.start_time) || !(t != null && t.start_time))
    return null;
  const i = new Date(t.start_time).toISOString(), s = new Date(e.session.start_time).toISOString();
  if (i !== s)
    return null;
  const r = or(n, e);
  return (o = r == null ? void 0 : r.session) != null && o.session_id ? r.session : null;
}
function Jn(e, t = null) {
  return !e || e.status !== "queued" ? !1 : wc(
    e,
    t || {
      session_id: e.session_id,
      subsession_id: e.subsession_id ?? null
    }
  );
}
function ir(e, t, n, i) {
  const s = Js(e.contentId, e, i);
  if (!s) {
    tr(n, e.contentId);
    return;
  }
  const r = yc(e, t, s);
  if (Fe(r.season_id, r.start_time, r.event_type)) {
    b(`🚫 ${r.season_name} ${r.start_label} is already queued`);
    return;
  }
  const a = Sc(e, t, i);
  a && (r.session_id = a.session_id, r.subsession_id = a.subsession_id ?? null);
  const o = [...re(), r];
  if (Vt(o), a && Jn(r, a)) {
    b(`🟦 ${r.season_name} ${r.start_label} race session found for auto-register`);
    return;
  }
  b(`📝 Queued ${r.season_name} for ${r.start_label}`);
}
function sr() {
  document.querySelectorAll("[data-iref-queue-key]").forEach((e) => {
    const { seasonId: t, eventType: n, startTime: i } = cc(
      e.dataset.irefQueueKey
    ), s = Fe(t, i, n), r = PsRegistered(t, i, n);
    Zs(e, s, e.dataset.irefIdleLabel || S("queue.queue"), r);
  });
}
function kc(e, t, n) {
  const i = document.createElement("div");
  i.className = `iref-top-queue-group iref-top-queue-group-${e}`, i.dataset.irefQueueGroup = e;
  const s = document.createElement("div");
  s.className = "iref-top-queue-header";
  const r = document.createElement("div");
  r.className = "iref-top-queue-title", r.textContent = t;
  const a = document.createElement("div");
  a.className = "iref-top-queue-subtitle", a.textContent = n;
  const o = document.createElement("div");
  return o.className = "iref-top-queue-buttons", s.append(r, a), i.append(s, o), i;
}
function Ri(e, t, n, i) {
  let s = e.querySelector(`[data-iref-queue-group="${t}"]`);
  return s || (s = kc(t, n, i), e.appendChild(s)), s.querySelector(".iref-top-queue-title").textContent = n, s.querySelector(".iref-top-queue-subtitle").textContent = i, s;
}
function qc(e, t = []) {
  const n = new Set(t.filter(Boolean));
  return Qt(document, { skipButtons: t }).filter(
    ({ button: i, props: s }) => !n.has(i) && (s == null ? void 0 : s.session) && Number(s.session.max_team_drivers || 1) <= 1 && e(s.session)
  ).map(({ props: i }) => ({
    sessionProps: i,
    slot: {
      label: $e(i.session.start_time),
      start_time: new Date(i.session.start_time).toISOString()
    },
    section: D() || document.body
  }));
}
function Ni(e, t, n) {
  const i = new Set(
    t.map(
      ({ sessionProps: s, slot: r }) => Ze(
        s.contentId,
        ke(s.session),
        r.start_time
      )
    )
  );
  [...e.querySelectorAll("[data-iref-queue-key]")].forEach((s) => {
    i.has(s.dataset.irefQueueKey) || s.remove();
  }), t.forEach((s, r) => {
    const { sessionProps: a, slot: o, section: c } = s, u = ke(a.session), l = n(s, r), g = Ze(
      a.contentId,
      u,
      o.start_time
    );
    let f = e.querySelector(
      `[data-iref-queue-key="${CSS.escape(g)}"]`
    );
    f || (f = er(
      `${Je(String(a.contentId))}-${Je(String(u))}-${Je(o.start_time)}-top`,
      l
    ), f.classList.add("iref-queue-btn-top"), f.addEventListener("click", (d) => {
      d.preventDefault(), d.stopPropagation(), rr(f, a, o, c);
    })), f.dataset.irefIdleLabel = l, f.dataset.irefQueueKey = g, e.appendChild(f);
  });
}
function rr(e, t, n, i) {
  const s = ke(t.session), r = Fe(
    t.contentId,
    n.start_time,
    s
  );
  if (r) {
    if (r.status === "registering")
      return;
    if (r.status === "found") {
      const a = re().indexOf(r);
      a >= 0 && Yt(a, { manual: !0 });
      return;
    }
    Ie(r);
    return;
  }
  ir(t, n, e, i);
}
function ar(e, t) {
  const n = e.querySelector("#iref-top-queue-row");
  n && n.remove();
}
function Qt(e, t = {}) {
  return Z(e, {
    visibleOnly: !1,
    skipButtons: t.skipButtons || [],
    skipSelectors: [
      ".iref-native-action-hidden",
      "#iref-top-action-row",
      "#iref-top-queue-row",
      "#iref-ui-root"
    ]
  });
}
function or(e, t) {
  var u;
  if (!(t != null && t.session))
    return null;
  if (xe(t))
    return t;
  const n = Vs(), i = D() ? (u = Ce(D())) == null ? void 0 : u.button : null, s = Ts(t.contentId ?? t.session.season_id), r = Q(t.session), a = new Date(t.session.start_time).toISOString(), o = Qt(n || document, {
    skipButtons: [i]
  }).map(({ props: l }) => l).filter((l) => l == null ? void 0 : l.session), c = o.find((l) => {
    var d;
    const g = s === null || Number(l.contentId ?? ((d = l.session) == null ? void 0 : d.season_id)) === s, f = r === null || String(Q(l.session)) === String(r);
    return g && f && l.session.session_id && new Date(l.session.start_time).toISOString() === a;
  });
  return c || null;
}
function Gt(e, t) {
  var o, c, u;
  const n = be(), i = (t == null ? void 0 : t.contentId) ?? ((o = t == null ? void 0 : t.session) == null ? void 0 : o.season_id) ?? null, s = ((c = t == null ? void 0 : t.session) == null ? void 0 : c.season_name) || "", r = Qs(), a = ((u = e == null ? void 0 : e.dataset) == null ? void 0 : u.irefRegistrationMode) || "";
  return Pn() ? {
    mode: "register",
    registrationState: null
  } : a === "withdraw" ? {
    mode: "withdraw",
    registrationState: n
  } : r ? {
    mode: "withdraw",
    registrationState: n
  } : ot(n) ? dc(n, t) || Gs(n, i, s) ? {
    mode: "withdraw",
    registrationState: n
  } : {
    mode: "elsewhere",
    registrationState: n
  } : {
    mode: "register",
    registrationState: null
  };
}
function Yn(e) {
  return at(
    e,
    (t) => t !== e && typeof t.querySelector == "function" && !!t.querySelector("button")
  );
}
function xc() {
  const e = document.createElement("div");
  e.id = "iref-top-action-row", e.className = "iref-top-action-row";
  const t = document.createElement("button");
  t.type = "button", t.className = "iref-series-action-btn iref-series-action-primary", t.dataset.irefRole = "primary";
  const n = document.createElement("button");
  return n.type = "button", n.className = "iref-series-action-btn iref-series-action-secondary", n.dataset.irefRole = "secondary", e.append(t, n), e;
}
function Cc(e) {
  return e ? e.status === "registering" ? S("register.in_flight") : e.season_name ? S("register.already_registered_series", {
    seasonName: e.season_name
  }) : S("register.already_registered_elsewhere") : S("register.description");
}
function Jt(e, t, n, i) {
  if (e.classList.remove(
    "is-register",
    "is-withdraw",
    "is-elsewhere",
    "is-unavailable",
    "is-registering"
  ), e.disabled = !1, e.title = "", t === "withdraw") {
    e.textContent = S("register.withdraw"), e.classList.add("is-withdraw"), (n == null ? void 0 : n.status) === "registering" && e.classList.add("is-registering");
    return;
  }
  if (t === "elsewhere") {
    e.textContent = (n == null ? void 0 : n.status) === "registering" ? S("register.registering_elsewhere") : S("register.registered_elsewhere"), e.title = Cc(n), e.classList.add("is-elsewhere"), e.disabled = !0;
    return;
  }
  if (!i) {
    e.textContent = S("register.unavailable"), e.classList.add("is-unavailable"), e.disabled = !0;
    return;
  }
  e.textContent = S("register.register"), e.title = S("register.race_title"), e.classList.add("is-register");
}
function Ec(e, t, n = {}) {
  var r;
  const i = (e == null ? void 0 : e.session) || {}, s = _e(i.season_name || "");
  return {
    status: "registering",
    source: "direct",
    confirmed_by_site: !1,
    season_id: e.contentId ?? i.season_id ?? null,
    season_name: s,
    car_id: t.car_id,
    car_class_id: t.car_class_id,
    car_name: t.car_name || null,
    event_type: Q(i) ?? H,
    event_type_name: rt(i),
    session_id: i.session_id ?? null,
    subsession_id: i.subsession_id ?? null,
    start_time: i.start_time ? new Date(i.start_time).toISOString() : null,
    start_label: i.start_time ? $e(i.start_time) : null,
    track_name: i.track_name || ((r = i.track) == null ? void 0 : r.track_name) || null,
    source_path: location.pathname,
    source_url: location.href,
    registered_at: null,
    requested_at: (/* @__PURE__ */ new Date()).toISOString(),
    ...n
  };
}
function psNativeRegisteredElsewhere(e) {
  try {
    const t = typeof mr == "function" ? mr() : null;
    return !!t && ot(t) && !Kt(t, e);
  } catch {
    return !1;
  }
}
function cr(e, t = {}, n = {}, i = {}) {
  var g;
  const {
    registerDelayMs: s = 5e3,
    retryWithdrawBeforeRegister: r = !1,
    withdrawRetryDelayMs: a = Ns,
    preferDirect: o = !1,
    autoConfirmMode: c = ""
  } = i;
  c && psBeginAutoConfirm(c);
  const u = be(), l = r || ot(u) && !Kt(u, e), f = l ? Math.max(s, a + 2e3) : s;
  Ot({
    ...e,
    status: "registering",
    confirmed_by_site: !1,
    registered_at: null,
    requested_at: (/* @__PURE__ */ new Date()).toISOString()
  });
  const d = () => {
    const m = Date.now(), T = () => {
      var h, w;
      if (l && psNativeRegisteredElsewhere(e)) {
        if (Date.now() - m > PS_REGISTERING_TIMEOUT_MS) {
          c && psScheduleAutoConfirmClear(c, 2e3), Se(), (h = n.onWithdrawFailed) == null || h.call(n), b(t.withdrawError || "🚫 Could not send the withdraw request");
          return;
        }
        kn({ preferDirect: o }) && b(t.withdrawRetry || "🔁 Retrying withdraw before register"), window.setTimeout(T, Math.max(1e3, a));
        return;
      }
      if (!sendRegister(e, { preferDirect: o })) {
        c && psScheduleAutoConfirmClear(c, 2e3), Se(), (h = n.onRegisterFailed) == null || h.call(n), b(t.registerError || "🚫 Could not send the register request");
        return;
      }
      Ot({
        ...e,
        status: "registered",
        confirmed_by_site: !1,
        registered_at: (/* @__PURE__ */ new Date()).toISOString(),
        requested_at: (/* @__PURE__ */ new Date()).toISOString()
      }), c && psScheduleAutoConfirmClear(c, 5e3), (w = n.onRegistered) == null || w.call(n), b(t.registered || `✅ Sent register request for ${e.season_name}`);
    };
    l && window.setTimeout(() => {
      const h = be();
      !h || h.status !== "registering" || kn({ preferDirect: o }) && b(t.withdrawRetry || "🔁 Retrying withdraw before register");
    }, a), window.setTimeout(T, f);
    return !0;
  };
  if (!l)
    return d();
  return kn({ preferDirect: o }) ? d() : (c && psClearAutoConfirm(c), Se(), (g = n.onWithdrawFailed) == null || g.call(n), b(t.withdrawError || "🚫 Could not send the withdraw request"), !1);
}
function Rc(e, t, n = {}) {
  var a;
  const i = n.preferDirect !== !1, s = n.autoConfirmMode || (i ? "register-flow" : "");
  return Ls(), xe(e) ? cr(
    Ec(e, t),
    {
      withdrawError: "🚫 Could not start the direct register flow",
      registerError: "🚫 Could not finish the direct register flow",
      registered: `✅ Sent direct register request for ${_e(
        ((a = e.session) == null ? void 0 : a.season_name) || ""
      )}`
    },
    {},
    {
      preferDirect: i,
      autoConfirmMode: s
    }
  ) : (b("🚫 This page did not expose a registerable session id yet"), !1);
}
function Nc(e = "") {
  const t = D();
  return t ? (e ? t.dataset.irefRegistrationMode = e : delete t.dataset.irefRegistrationMode, !0) : !1;
}
function Nt() {
  const e = D(), t = e ? Ce(e) : null;
  return !e || !t ? !1 : (Os(e, t.props), dr(e, t.props), ar(e, t.props), !0);
}
function Tc() {
  window.setTimeout(() => {
    de.refreshNow(), Nt();
  }, 250), window.setTimeout(() => {
    de.refreshNow(), Nt();
  }, 1200), window.setTimeout(() => {
    de.refreshNow(), Nt();
  }, 3500);
}
function lr(e = {}) {
  const {
    preferDirect: t = !0,
    autoConfirmMode: n = t ? "withdraw" : ""
  } = e;
  return n && psBeginAutoConfirm(n, 8e3), kn({ preferDirect: t }) ? (n && psScheduleAutoConfirmClear(n, 5e3), Se(), Ko(), Nc("register"), Nt(), Tc(), b("✅ Sent withdraw request"), !0) : (n && psClearAutoConfirm(n), b("🚫 Could not send the withdraw request"), !1);
}
let withdrawClickSyncInstalled = !1;
function onNativeWithdrawClick(e) {
  var n;
  const t = (n = e.target) == null ? void 0 : n.closest("button, a, [role='button']");
  if (!t || t.closest("#iref-ui-root") || !BsWithdrawActionText(t.innerText || t.textContent || t.getAttribute("aria-label") || ""))
    return;
  Se(), Ko(), Nc("register"), window.setTimeout(() => {
    Nt(), sr();
  }, 0), Tc();
}
function ensureWithdrawClickSync() {
  withdrawClickSyncInstalled || (document.addEventListener("click", onNativeWithdrawClick, !0), withdrawClickSyncInstalled = !0);
}
function zc() {
  return lr({
    preferDirect: !0,
    autoConfirmMode: "withdraw"
  });
}
function Xn(e, t) {
  zc() && (t.dataset.irefRegistrationMode = "register", Jt(e, "register", null, !0));
}
function ur(e, t, n, i) {
  const s = Gt(t, n);
  if (s.mode === "withdraw") {
    Xn(e, t);
    return;
  }
  if (s.mode === "elsewhere")
    return;
  const r = Js(
    (i == null ? void 0 : i.contentId) ?? (n == null ? void 0 : n.contentId),
    i || n,
    t
  );
  if (!r) {
    tr(e, n == null ? void 0 : n.contentId);
    return;
  }
  Rc(i || n, r, {
    preferDirect: !0,
    autoConfirmMode: "register-flow"
  }) && (t.dataset.irefRegistrationMode = "withdraw", Jt(e, "withdraw", { status: "registering" }, !0));
}
function Dc(e, t, n) {
  const i = t.querySelector(
    '[data-iref-queue-group="race"] .iref-top-queue-buttons [data-iref-queue-key]'
  );
  if (i && i !== e) {
    i.click();
    return;
  }
  rr(
    e,
    n,
    {
      label: "next race",
      start_time: new Date(n.session.start_time).toISOString()
    },
    t
  );
}
function topNativeQueueProxy(e, t) {
  const n = Ce(e), i = n == null ? void 0 : n.button;
  e == null || e.querySelectorAll('[data-iref-top-native-queue="1"]').forEach((s) => s.remove()), i && i.classList.remove("iref-native-action-hidden");
}
function findMoreWaysAnchor(e) {
  return e ? [...e.querySelectorAll("button, a")].filter((t) => !t.closest("#iref-ui-root")).filter((t) => !t.closest("#iref-next-race-queue-row")).filter((t) => !t.closest("table")).filter((t) => Ht(t)).find((t) => {
    const n = Xe(t.innerText || t.textContent || t.getAttribute("aria-label") || "");
    return n.includes("more ways") || n.includes("mais formas") || n.includes("mais maneiras") || n.includes("mas formas") || n.includes("otras formas") || n.includes("weitere") || n.includes("autres facons") || n.includes("altri modi");
  }) || null : null;
}
function nextRaceQueueAnchor(e) {
  var i;
  const t = findMoreWaysAnchor(e);
  if (t)
    return Yn(t) || t.parentElement || t;
  const n = (i = Ce(e)) == null ? void 0 : i.button;
  return n ? Yn(n) || n.parentElement || n : null;
}
function ensureNextRaceQueueButton(e, t) {
  var h;
  let n = e == null ? void 0 : e.querySelector("#iref-next-race-queue-row");
  if (!e || !((t == null ? void 0 : t.session) != null) || !Ms(t.session) || Number(t.session.max_team_drivers || 1) > 1) {
    n == null || n.remove();
    return;
  }
  const i = nextRaceQueueAnchor(e);
  if (!i || !i.parentElement) {
    n == null || n.remove();
    return;
  }
  n || (n = document.createElement("div"), n.id = "iref-next-race-queue-row", n.className = "iref-next-race-queue-row");
  (n.parentElement !== i.parentElement || n.previousElementSibling !== i) && i.parentElement.insertBefore(n, i.nextSibling);
  const s = new Date(t.session.start_time).toISOString(), r = ke(t.session), a = Ze(t.contentId, r, s);
  let o = n.querySelector('[data-iref-next-race-queue="1"]');
  o || (o = document.createElement("button"), o.type = "button", o.className = "iref-queue-btn iref-next-race-queue-btn", o.dataset.irefNextRaceQueue = "1", n.appendChild(o));
  const c = {
    label: $e(s),
    start_time: s
  };
  o.dataset.irefQueueKey = a, o.dataset.irefIdleLabel = S("queue.queue_next_race"), o.title = S("queue.queue_race_when_open"), o.onclick = (w) => {
    w.preventDefault(), w.stopPropagation(), rr(o, t, c, e);
  };
  const u = Fe(t.contentId, s, r), l = PsRegistered(t.contentId, s, r);
  Zs(o, u, (h = o.dataset.irefIdleLabel) != null ? h : S("queue.queue_next_race"), l);
}
function dr(e, t) {
  const n = Ce(e), i = n == null ? void 0 : n.button, s = Yn(i);
  e == null || e.querySelectorAll('[data-iref-top-native-queue="1"]').forEach((a) => a.remove()), s && s.classList.remove("iref-native-action-hidden"), i && i.classList.remove("iref-native-action-hidden");
  const r = e.querySelector("#iref-top-action-row");
  r && r.remove(), topNativeQueueProxy(e, t);
}
function Lc(e, t, n) {
  var f, d;
  const i = e.parentElement;
  if (!i || !((f = t == null ? void 0 : t.session) != null && f.session_id))
    return;
  const s = D() || n || document.body, r = new Date(t.session.start_time).toISOString(), a = ke(t.session), o = Ze(t.contentId, a, r);
  e.classList.add("iref-session-view-hidden"), (d = i.querySelector(`[data-iref-queue-key="${CSS.escape(o)}"]`)) == null || d.remove();
  let c = i.querySelector(
    `[data-iref-register-key="${CSS.escape(o)}"]`
  );
  c || (c = document.createElement("button"), c.type = "button", c.className = "iref-session-register-btn iref-series-action-btn iref-series-action-primary", c.dataset.irefRegisterKey = o, i.appendChild(c));
  const { mode: u, registrationState: l } = Gt(
    s,
    t
  ), g = xe(t) && Number(t.session.max_team_drivers || 1) <= 1 && oc(t.session);
  Jt(c, u, l, g), c.title = u === "register" ? S("register.session_title", {
    eventType: rt(t.session).toLowerCase()
  }) : c.title, u === "withdraw" ? c.onclick = (h) => {
    h.preventDefault(), h.stopPropagation(), Xn(c, s);
  } : c.onclick = (h) => {
    h.preventDefault(), h.stopPropagation(), ur(
      c,
      s,
      t,
      t
    );
  };
}
function Ti(e, t = {}) {
  var a;
  const { skipNextRaceButton: n = !1 } = t, i = n ? D() : null, s = n && i ? (a = Ce(i)) == null ? void 0 : a.button : null, r = Ks();
  Qt(e).forEach(({ button: o, props: c }) => {
    if (n && o === s || r != null && r.contains(o) || !(c != null && c.session) || !Qn(c.session))
      return;
    const u = o.parentElement;
    if (!u)
      return;
    const l = new Date(c.session.start_time).toISOString(), g = ke(c.session), f = Ze(c.contentId, g, l);
    let d = u.querySelector(
      `[data-iref-queue-key="${CSS.escape(f)}"]`
    );
    if (isIrefSpectateAction(o)) {
      u.classList.remove("iref-queue-action-slot"), [...u.children].forEach((h) => {
        h.classList.remove("iref-session-view-hidden"), h.removeAttribute("aria-hidden");
      }), u.querySelectorAll(".iref-session-register-btn").forEach((h) => {
        h.remove();
      }), d == null || d.remove();
      return;
    }
    u.classList.add("iref-queue-action-slot"), u.querySelectorAll(".iref-session-register-btn").forEach((h) => {
      h.remove();
    });
    d || (d = er(
      `${Je(String(c.contentId))}-${Je(l)}-inline`,
      S("queue.queue")
    ), d.classList.add("iref-queue-btn-inline"), d.dataset.irefQueueKey = f, d.addEventListener("click", (h) => {
      h.preventDefault(), h.stopPropagation();
      const w = Fe(c.contentId, l, g);
      if (w) {
        if (w.status === "registering")
          return;
        if (w.status === "found") {
          const y = re().indexOf(w);
          y >= 0 && Yt(y, { manual: !0 });
          return;
        }
        Ie(w);
        return;
      }
      ir(
        c,
        {
          label: $e(l),
          start_time: l
        },
        d,
        e
      );
    }), u.appendChild(d)), [...u.children].forEach((h) => {
      if (h === d || h.classList.contains("iref-inline-export-actions"))
        return;
      h.classList.add("iref-session-view-hidden"), h.setAttribute("aria-hidden", "true");
    }), d.dataset.irefIdleLabel = S("queue.queue");
  });
}
function Ic(e) {
  Qt(e).forEach(({ button: t, props: n }) => {
    const i = t.parentElement;
    if (!(!i || !(n != null && n.session) || n.session.max_team_drivers > 1)) {
      if (!xe(n) || !Kn(n.session)) {
        t.classList.remove("iref-session-view-hidden"), i.querySelectorAll(".iref-session-register-btn").forEach((s) => {
          s.remove();
        });
        return;
      }
      Lc(t, n, e);
    }
  });
}
function zi(e, t) {
  if (t.status !== "queued")
    return;
  const n = new Date(t.start_time).toISOString().split(".")[0] + "Z";
  Number(e.season_id) === Number(t.season_id) && ac(e, t) && e.start_time === n && e.session_id > 0 && (b(
    `📝 ${t.event_type_name || rt(e)} session for ${_e(
      t.season_name
    )} at ${t.start_label} found`
  ), t.session_id = e.session_id, t.subsession_id = e.subsession_id ?? null, Jn(t, e) || Ae());
}
function Oc(e) {
  if (!e || !e.session_id || !e.car_id || !e.car_class_id)
    return !1;
  const t = new Date(e.start_time).getTime();
  return Number.isNaN(t) ? !1 : t >= qe() - Es;
}
function Yt(e, t = {}) {
  const { manual: n = !1, allowQueued: i = !1 } = t, s = re()[e], r = i && (s == null ? void 0 : s.status) === "queued" && !!s.session_id && nr(s);
  if (!s || s.status !== "found" && !r || !n && !Bs(s.start_time))
    return;
  if (!Oc(s)) {
    b(`🚫 Queue item for ${s.season_name} is no longer valid`), Ie(s);
    return;
  }
  if (!de.isReady()) {
    b("🚫 Queue paused because the iRacing websocket is not ready");
    return;
  }
  const a = Ys(s), o = be();
  if ((o == null ? void 0 : o.status) === "registering") {
    b("🚫 Queue paused because another registration request is in progress");
    return;
  }
  if (ot(o) && Kt(o, a)) {
    Ie(s);
    return;
  }
  const c = Xs(
    o,
    a
  ) ? { ...o } : null;
  s.status = "registering", s.last_attempt_at = (/* @__PURE__ */ new Date()).toISOString(), Ae(), b(
    `📝 Registering for ${_e(
      s.season_name
    )} at ${s.start_label}`
  ), cr(
    a,
    {
      withdrawError: "🚫 Could not send withdraw request",
      withdrawRetry: "🔁 Retrying withdraw before the queued register",
      registerError: "🚫 Could not send register request",
      registered: `✅ Sent register request for ${s.season_name} ${s.start_label}`
    },
    {
      onWithdrawFailed: () => {
        s.status = "found", Ae();
      },
      onRegisterFailed: () => {
        s.status = "found", Ae();
      },
      onRegistered: () => {
        qs(), Ie(s), Ac(c, a);
      }
    },
    {
      retryWithdrawBeforeRegister: ot(o) && !Kt(o, a),
      withdrawRetryDelayMs: Ns,
      registerDelayMs: Oo,
      preferDirect: !0,
      autoConfirmMode: "register-flow"
    }
  );
}
function Bc(e) {
  Ie(e);
}
const Di = (e) => {
  re().forEach((t) => {
    try {
      e.data.delta.INSERT.forEach((n) => {
        zi(n, t);
      });
    } catch {
    }
    try {
      e.data.delta.REGISTRATION.forEach((n) => {
        zi(n, t);
      });
    } catch {
    }
  });
};
const PS_REGISTERING_TIMEOUT_MS = 45 * 1e3;
de.callbacks.includes(Di) || de.callbacks.push(Di);
window.setInterval(() => {
  be(), psResetStaleRegisteringQueueItems();
  const e = Pt();
  e.length !== re().length && Vt(e), re().forEach((t, n) => {
    t.status === "queued" && t.session_id && Jn(t), t.status === "found" && nr(t) && Bs(t.start_time) && Yt(n, { manual: !1 });
  });
}, 1e3);
async function jc(e = !0) {
  clearInterval(qi), e && (rc(), Ds(), ks(), ensureWithdrawClickSync(), qi = window.setInterval(() => {
    const t = D();
    if (t) {
      const s = Ce(t);
      s && (Os(t, s.props), dr(t, s.props), ensureNextRaceQueueButton(t, s.props), ar(t, s.props));
    }
    const n = Vs();
    n && Ti(n);
    const i = Ks();
    i && Ic(i), Ti(document, { skipNextRaceButton: !0 }), sr(), autoConfirmRegisterDialog();
  }, 400));
}
L.add(xs, !0, Do, Lo, jc);
const Mc = [
  "a",
  "altGlyph",
  "altGlyphDef",
  "altGlyphItem",
  "animate",
  "animateColor",
  "animateMotion",
  "animateTransform",
  "animation",
  "audio",
  "canvas",
  "circle",
  "clipPath",
  "color-profile",
  "cursor",
  "defs",
  "desc",
  "discard",
  "ellipse",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feDistantLight",
  "feDropShadow",
  "feFlood",
  "feFuncA",
  "feFuncB",
  "feFuncG",
  "feFuncR",
  "feGaussianBlur",
  "feImage",
  "feMerge",
  "feMergeNode",
  "feMorphology",
  "feOffset",
  "fePointLight",
  "feSpecularLighting",
  "feSpotLight",
  "feTile",
  "feTurbulence",
  "filter",
  "font",
  "font-face",
  "font-face-format",
  "font-face-name",
  "font-face-src",
  "font-face-uri",
  "foreignObject",
  "g",
  "glyph",
  "glyphRef",
  "handler",
  "hkern",
  "iframe",
  "image",
  "line",
  "linearGradient",
  "listener",
  "marker",
  "mask",
  "metadata",
  "missing-glyph",
  "mpath",
  "path",
  "pattern",
  "polygon",
  "polyline",
  "prefetch",
  "radialGradient",
  "rect",
  "script",
  "set",
  "solidColor",
  "stop",
  "style",
  "svg",
  "switch",
  "symbol",
  "tbreak",
  "text",
  "textArea",
  "textPath",
  "title",
  "tref",
  "tspan",
  "unknown",
  "use",
  "video",
  "view",
  "vkern"
], Ee = new Set(Mc);
Ee.delete("a");
Ee.delete("audio");
Ee.delete("canvas");
Ee.delete("iframe");
Ee.delete("script");
Ee.delete("video");
const $c = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i, Fc = (e) => e === DocumentFragment, Wc = (e, t) => {
  for (const [n, i] of Object.entries(t))
    n.startsWith("-") ? e.style.setProperty(n, i) : typeof i == "number" && !$c.test(n) ? e.style[n] = `${i}px` : e.style[n] = i;
}, Hc = (e) => typeof e == "string" ? Ee.has(e) ? document.createElementNS("http://www.w3.org/2000/svg", e) : document.createElement(e) : Fc(e) ? document.createDocumentFragment() : e(e.defaultProps), Li = (e, t, n) => {
  n != null && (/^xlink[AHRST]/.test(t) ? e.setAttributeNS("http://www.w3.org/1999/xlink", t.replace("xlink", "xlink:").toLowerCase(), n) : e.setAttribute(t, n));
}, pr = (e, t) => {
  for (const n of t)
    n instanceof Node ? e.appendChild(n) : Array.isArray(n) ? pr(e, n) : typeof n != "boolean" && typeof n < "u" && n !== null && e.appendChild(document.createTextNode(n));
}, Uc = /* @__PURE__ */ new Set([
  // These attributes allow "false" as a valid value
  "contentEditable",
  "draggable",
  "spellCheck",
  "value",
  // SVG-specific
  "autoReverse",
  "externalResourcesRequired",
  "focusable",
  "preserveAlpha"
]), Pc = (e, t, ...n) => {
  var i;
  const s = Hc(e);
  if (pr(s, n), s instanceof DocumentFragment || !t)
    return s;
  for (let [r, a] of Object.entries(t))
    if (r === "htmlFor" && (r = "for"), r === "class" || r === "className") {
      const o = (i = s.getAttribute("class")) !== null && i !== void 0 ? i : "";
      Li(s, "class", (o + " " + String(a)).trim());
    } else if (r === "style")
      Wc(s, a);
    else if (r.startsWith("on")) {
      const o = r.slice(2).toLowerCase().replace(/^-/, "");
      s.addEventListener(o, a);
    } else r === "dangerouslySetInnerHTML" && "__html" in a ? s.innerHTML = a.__html : r !== "key" && (Uc.has(r) || a !== !1) && Li(s, r, a === !0 ? "" : a);
  return s;
}, Vc = typeof DocumentFragment == "function" ? DocumentFragment : () => {
}, p = {
  createElement: Pc,
  Fragment: Vc
}, Kc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAdoAAABnCAMAAACQGXOCAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAk9QTFRFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgnwBYwAAAMV0Uk5TADpAGjzARXAzXUMV/f9IqF+ABLAY3KkoT2p44Pj8+50SG/nk1ffodDW29dkgOLl2cwqmWAnmumdciNCvmC7e9AL2aIv6rdIwyIplm2Dvx3xN7r5Q1+meosrWI1c+j5DyzP7xz+uxy5fC4Y6uVYPYN99LBeWCxS21uGRt6rMkH9N641uRQZx5St2B8MFUfdvNlaRS82vGJofip4SgF8mM7MS3RrSUuwx3Ie1a2hAlcWKrFIXUmbwdYeeqocOyWT+Sf6O/bs5Fv+E+AAAOH0lEQVR4nM1daaAUxRGe5ZTTh8glCiaCIXIYySMPxcALIhBAEHhcAnKKCAIioNy3XHIIiBxyyCGHQSEKImIQ8EzikYhGE2NCDmNMNCYiEVDc5O1ud8/Ods3ufNXTw/erXk9Pd7+t2Z3uqq+qYo4WsZi+PQti54RUChuAgdhZ38tlLS0jHbHTQir3jeWpS+o1UAFV7edCutD2f+LEv/mvz9W8cz4Xw0Opz1LCRV/ZnrqMXoWV49hwZT8RUrXTfv1CQfz01/TF6l/aW4gL5T9OCTVP2Z66ol61l5yERqv8oRQv/Q80Agt5H9G6jeBR+z+q/FlIdf9le+6qetVW9X9vUSgh9fmtT/z6hQUf3X77nzYXIlD9AyHV+9ivXwio+b5etVd+BA139oyQvvM3bEFM5FV4T38hmkfNufRdIV31F8tT13lHq9pGf8KGu/y4kJr8ERuBiyrl9bq9+g+WF5LEFb9KCdf83vbU9d/Qqvb7v4NGizd4TYjNiG9P6CB0+4N3da2ho+qJlFDwG9tTN3xVq9pr34ZGa/yyFIntmQXodRvNo1ZN/la0eMv23PXe1Kqg9AXQaFe/KKQGH/r1CxdV6r6Q2RjNo3bNMSHV/tyvXwhoetTR/cuFsdc0rdnR7LCQbvgFuiQDKDiToduIHrXmh4TU5ueWp772Wa1qa/iZdXxw3UEhtX8JXJERZOr2xy9qO4aNHz6dEuxv0Fvu16q201FotPz4ESHedITuZgEFxz2nyM7PR7KOem+mhC6HffuFgBv2alV7/a+h0U5LM6l9g6kH1U6l67brc1GsIl8+UN0O+fULAycdrWqvO65pzI5Grwip+7PoikzBo9tKkSyi3W4h9XjG8tSFT2lVm/8etp288nUh9TwAr8kU0nRr3zafQIddQrK+Qe+4U6vaxiew4erK03CffeCKDKJa8+1Stm+bT6Dzoymh309tT33zVq1qy5aBRqulTFjWDaY61PzqhBCt2+aTKC2eqFv32J66yzatakEveplPhXT5p379rEHuTyN61LptFtLAxy1PXbTJ0aoWtJxUks6eWl+gSzKJHhuFZN82n0DPDUIa/BPLU/da7+hUe/GZzK65QJFnbtuJLskk+qwTUgeN5dECblmbEuyfBfuucXSqBckz8bjcht6xDV6TQfR/SEgjt0SyAPms37nZt18IGLjS0am2ig/DyAeDVkixzmc+/axh8HIh3bXBr19okCSkXk/7dQsDCUpWCAeuCiXMjxkccfXCt26bT84qt8WjN1meOi+xbQxBtWPXAzcVNFmqv4C6oYYtERJsmz8Hukm8qP939E7pykcQgmrHr83eJwPD7ycu3LMaW8WIhUJCbfNFhr5s+Fmw5vuceUNQ7cRVwE1q0+PBpAexVYyaJyTUNj/6Puw+LyavRO/stIMzbwiqhU5x0ijnRcdjxIUsUL9lqG3+xiew+7yYujx7Hz0uAumHSZhX7bQHkLvGziYuzCDewVmgHGqwbX7cTOw+L2YtRu8cuowzr3nVzqbemn7oRW29UDdUDWmBKlUOGsBxLjZEuIXPgsyXvXnVzlkE3NT7YeLC3IXEhSyYOEVI/fdiI1QzRF1G6Ug+z3tuMK9aiKwyaTJxYd58bBWTJwlpGLgXmTIRu8+LhXPRO0/zDJRe1bLJM5gtXtLsvQAJxK7fskVzoBGccv/A7vNiOLVBzIrWPDevV7Vs8ky5Usj95Nkc3AOp3zLYNt/wVfBGD4buyt5HD+bL3vPJobuWttIjCXl7ybN5rCK0HGf6BCEtnoWN4HL38jBod/Y+WnBf9h5NlqiADcOMma7zDnEB3QPNHCck1DbfzZC7pgycaWHW3byZPaoFY6Zd5BkokLUD9aOF8hPUbxlqm589FrvPiwemoXfOHcOb2aNaNnkGs8XfN5q4MACzCBUo3jFqm+9qyMk75DH0zgGgiVXAo1o2eQYLZC1NUA5R6os6uMC2+S8xt3UGVlLHuqygPpRcka5alDxzSn7ZoUDWNhTjD9tuuzMvPDjJrx+NuCF+F87LIj+UXJGuWpD2z42ZXjCSuIDmjVEHFzArh9M04NFn2Qh9e3Nqg5gV5IeSK9JVC8ZMu8gz0Dl00R3EhQWgX039lq2Z4NfPHCjP1drx6IhLhqF3ppCuCcjV6jhLbxPSmI1+/SgsJB55lPqieKrWeFrUi3HpDHTExr8M0nv10IymNNUWtliR0SEXMGOmVXYlD1Dqi+Kp4rb5YOhBPdKW8mfpnERpqkU/CJV5ZsNdwO3jqScbpb4sHywkkJ4ZGOphSoetQIoVgzLb0lQLZp7JPyl3UVDMNOnRA3NqOLXlXg63zQcDxf/53gf6dtNYOTCzLU21YNhRC8lQwWzxzagvJ2hZdx1ccNt8MHxB8PI332lnft2eK021YAoKZbhZMcWvHwXSEA9a1hVPFbfNBwN5Ch5H/FCbRnlNLKJbtfmVMMqvipl+GLFoX0aly9oCnuwe6i+k8iWxEYKiFvUmu+zfVubP04UiulWLxkyrR+Z8iJl28ookW2wbdWA2jDV99e22NujVda90t2pbBzpJSYx+6YgQf4R97U2iqHXJW+QfuG0+GNb10bevvsfO/CN0DDK3aqGfU8cZuUBI50HMdPf2vV1/gY6jwKD4EKsM8auy4azO9u9WLejaVOSZyGOmh8TT6Ny2AltJPsSuTBtRKNDyj1yq5ZNnIo6ZLqzsOcU+NsTOxBdQ9ANLG/QL/6prdWmTT56xZYvXoubwcd6mpqxwqNxBkR/nz9O3m8bGHrpWl2r5BQcijJnOK3Ey00CP2+aD4WvC94jGKwVF/Td0rS7VsgsO2NrqZ6Lo9elFmmZbtS0omwsYrxQYG3rqWl2qBQsOKPIMzpNnovG47rpmWxv2eaOIC6203ybz0HsUlWr55BlbtngPxs8h3DtPDLCzgJ5ErgxbSY0IXq1SLZ88Y8sWn4YeO0iSzXe1G0fzWN1P377nVjvzE4+WUi2/4IClrX4a/Ggmtmzz907Vt+/tr283DeLRUqplFxzAefIMNJjahbxmyTZPhsG2NBRakg1EOhWpWn7BAZwnz0HB2xSH3NaGncx5YakiGPVoSdXyCw6AQX5slCCOOE8S7hjToMJgbRUcoCKspWr5BQdwnjwTDW7XmmonrMGG234TZzEKO7hs0xzRl/g/pWrBmGlFnokof2kxqnTWhcegtvkdnViLkdjfO3sfE5h6r75dqpZNnomo+G8SzTW5odAN+ypDZxbQBOQwk7xJCNXyyTMRFf9Nof2gDp4W1DZvKskbXnBA78gJDDE9v+BANMV/JfJqe6J09hHMh2wwleQN/UQpR05gCNXyCw5EU/zXBQ+due0rRL8sMJXkbSMc+ax35ASGUC0YM63IMxEV/3VjRQ33jzJqmyfzHAUEFEiRvFPryAkMoVqQPFNKemgjKv6bBvePMrxhN5XkDS8+x42ZTiGl2gox7J2vCg5AMdOFlEtiPRW7lwWX/FZIB8BH39AehsHLMpUgJaVRsOCAizzzDPLu39mRuIA6bSrKA8dBnW8+B5DJcAICLz5H+QiDIqVaMKLNRZ6Btvpk8tIrwFRr6kSIRl2TyXACAi8+R/kIgyKlEDBmWplvsa0++V4DnTauVLnohp1MhhMQeCCFqbz4KdWClhNFbYa2+gVU7VHUV6FqT8IbdkN7GDyQwpjJJKnaRmC6bGbM9BAqK/a6DN5pbni8rZBQ2zw770sKOC+LmSpXIalaMGbaRZ6BtvpNKLv1oW7QepwZMinIo8OxEcjyFgEBxk85tCMnMJKqZZNnsK3+VVQWkk3gC0/9moLJdp0b92P3JVFWngXRpEa0Iycwkqplk2fOj5jpaSowznox4ASUkRIvPqeLgoaQ+ARQ8kwruQuEgvzyqXznaMRzRxlzhCU5YkMldIUrgpHpeAIjodp2L2frpod6wIoO+vUjQJaxQSOeVbIQKMkRH7uEERu3qJPpeAIjoVrwne8iz0BbfZVJzAM04lklCwGJBUyob9ySmegYY4yFYCRUyy44gG31TafKdSULwW3zHKhvHJoWyV1VjIuEatkFB7D8pZR1ALWsK+ex/WLACaj8KFOwtHmOKfJMMYpVi8ZMK/LMc12B26dRiR5+djO0HJezAbfNs6CMc3AgBa9CYhqKlconz0Ax01TyO2c5EWiRDcqJjtvmWZDfuMN0SEMWDIK/7hkoVi2fPAPFTJMp4BuC+3/lbKhn6mwYCMrV+3xndAxTjicnqVp2wQHMmt+FOtWD5QJczoZokhyplBbLpqNjcAsOuFCsWnbBAShmmvRwoJZ15WyIiO2+u52QoDqvCZhyPDkJ1aIx04o8A1nzSVIoWsp3q9x9FVCpAcPFFrGZxDfoZF5lADGYPBOPnxIiZM0niwFC223H9ck6Ld7CRmBCmsT7PokO0f0RM0spRgwmz7j2ctBW/6lC4gKaokg5G8A3DBMqjehROGrIVHWhYsQMFBzAMqCS5BkwRVFTFWoI2+ZZUNWQ0S2+z9YSQMxAwYHbtwO3Gy84cLesixgR210962hFMHPkmWLEDBQcgOyU91M0iCNgeGtL6UTHbfMsSIoHTp4xFW+UQMxAwQEoBGNPG+ICallXdaaPUezmcCHPLS94gwZzxv6WhtZSjBi/4AB2ipxPZeUHLeuu3zLcNs+BOrdsBUMf3K58A4ihrk1FnsFipkkPB2hZX9+LOwITB64X0qzF6Bim4o0SiPHJM1AIBunh6AcWSFcl6NARmFCkfzgLKcnLhhDjk2egEAwytAZ8P7jq8qEjMHFGcBjxpEb9VhtaSwIxfsEBKARjXyviAlpnWj1q6Ag8qHf9qEfQMcoYzRf6P3Fsrevaek2CAAAAAElFTkSuQmCC", Qc = "body";
function x(e, t = {}) {
  return $(e, t);
}
const Zn = /* @__PURE__ */ p.createElement("div", { id: "iref-ui-root" }, /* @__PURE__ */ p.createElement("div", { id: "iref-registration-banner", className: "iref-registration-banner hidden" }, /* @__PURE__ */ p.createElement("div", { className: "iref-registration-banner-left" }, /* @__PURE__ */ p.createElement("div", { className: "iref-registration-pill" }, x("status.registered")), /* @__PURE__ */ p.createElement("div", { className: "iref-registration-copy" }, /* @__PURE__ */ p.createElement("div", { className: "iref-registration-title" }), /* @__PURE__ */ p.createElement("div", { className: "iref-registration-subtitle" }))), /* @__PURE__ */ p.createElement("div", { className: "iref-registration-timer hidden" }), /* @__PURE__ */ p.createElement("div", { className: "iref-registration-banner-right" })), /* @__PURE__ */ p.createElement("div", { className: "iref-bar-wrapper" }, /* @__PURE__ */ p.createElement("div", { id: "iref-bar" }, /* @__PURE__ */ p.createElement("div", { className: "iref-bar-left" }, /* @__PURE__ */ p.createElement("div", { className: "iref-logo" }, /* @__PURE__ */ p.createElement("img", { src: Kc })), /* @__PURE__ */ p.createElement("div", { className: "iref-queue-items" })), /* @__PURE__ */ p.createElement("div", { className: "iref-bar-right" }))));
function ye(e = "") {
  return e.replace(/\s+/g, " ").trim();
}
function Gc(e, t) {
  let n = e;
  for (; n && n !== document.body; ) {
    if (t(n))
      return n;
    n = n.parentElement;
  }
  return null;
}
function gr(e = "") {
  return e.split(`
`).map((t) => ye(t)).filter(Boolean);
}
function Jc(e) {
  return Gc(
    e,
    (t) => t !== e && typeof t.querySelector == "function" && !!t.querySelector("button")
  );
}
function ct(e = D()) {
  const t = topSessionEntry(e);
  return t || (e ? nt(e, {
    visibleOnly: !1,
    skipSelectors: ["#iref-ui-root", "#iref-top-action-row", "#iref-top-queue-row"]
  }) : null);
}
function Yc(e = D()) {
  var s;
  const t = ct(e), n = (t == null ? void 0 : t.button) && ((s = Jc(t.button)) == null ? void 0 : s.parentElement) || e;
  if (!n)
    return null;
  const i = new Set(
    Z(n, { visibleOnly: !1 }).map(
      ({ button: r }) => r
    )
  );
  return [...n.querySelectorAll("button, a")].filter((r) => !r.closest("#iref-ui-root")).filter((r) => !r.closest("#iref-top-action-row")).filter((r) => !r.closest("#iref-top-queue-row")).filter((r) => !r.closest(".iref-session-register-btn")).filter((r) => !r.closest(".iref-queue-btn")).filter((r) => Ht(r)).filter((r) => !i.has(r)).find((r) => BsWithdrawActionText(r.innerText || r.textContent || r.getAttribute("aria-label") || ""));
}
function nativeIndicatorText(e) {
  if (!e)
    return "";
  const t = [...e.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent || "").join(" ");
  return me(t || (e.matches("button, a, span, [role='button']") ? e.innerText || e.textContent || e.getAttribute("aria-label") || "" : ""));
}
function hasNativeRegisteredIndicator(e = D()) {
  if (!e)
    return !1;
  return [...e.querySelectorAll("button, a, span, div")].filter((t) => !t.closest("#iref-ui-root")).filter((t) => !t.closest("#iref-top-action-row")).filter((t) => !t.closest("#iref-top-queue-row")).filter((t) => !t.closest(".iref-native-queue-proxy")).filter((t) => !t.closest(".iref-session-register-btn")).filter((t) => !t.closest(".iref-queue-btn")).filter((t) => Ht(t)).some((t) => BsRegisteredActionText(nativeIndicatorText(t)));
}
function Xc(e) {
  return e ? (e.click(), !0) : !1;
}
function hr() {
  var e;
  return ye(((e = document.querySelector("h2")) == null ? void 0 : e.textContent) || "");
}
function fr(e) {
  const t = hr();
  return !(e != null && e.season_name) || !t ? !1 : ye(e.season_name) === t;
}
function Zc(e) {
  var o, c, u, l;
  if (!e)
    return null;
  const t = (o = ct(e)) == null ? void 0 : o.props, n = Number(
    (t == null ? void 0 : t.preselectedCarId) ?? ((c = t == null ? void 0 : t.session) == null ? void 0 : c.preselectedCarId) ?? ((u = t == null ? void 0 : t.session) == null ? void 0 : u.car_id)
  ), i = Number.isFinite(n) ? (((l = t == null ? void 0 : t.session) == null ? void 0 : l.cars) || []).find(
    (g) => Number(g.car_id) === n
  ) : null;
  if (i != null && i.car_name)
    return i.car_name;
  const s = gr(e.innerText || ""), r = s.findIndex((g) => /Cars Competing$/i.test(g));
  if (r < 1)
    return null;
  const a = s[r - 1];
  return !a || /No Car Selected/i.test(a) ? null : a;
}
function el(e) {
  const t = ye(e).match(/^(\d{1,2}):(\d{2})$/);
  if (!t)
    return null;
  const n = new Date(qe()), i = new Date(n);
  return i.setHours(parseInt(t[1], 10), parseInt(t[2], 10), 0, 0), i.getTime() < n.getTime() - 7200 * 1e3 && i.setDate(i.getDate() + 1), i.toISOString();
}
function tl(e) {
  var i, s, r;
  if (!e)
    return null;
  const t = (r = (s = (i = ct(e)) == null ? void 0 : i.props) == null ? void 0 : s.session) == null ? void 0 : r.start_time;
  if (t) {
    const a = new Date(t);
    if (!Number.isNaN(a.getTime()))
      return a.toISOString();
  }
  const n = gr(e.innerText || "").find(
    (a) => /^\d{1,2}:\d{2}$/.test(a)
  );
  return n ? el(n) : null;
}
function mr() {
  var s, r;
  if (Pn())
    return null;
  const e = D(), t = Yc(e), n = hasNativeRegisteredIndicator(e);
  if (!t && !n)
    return null;
  const i = e, a = ((s = ct(e)) == null ? void 0 : s.button) || ((r = nt(i || document, {
    visibleOnly: !1,
    skipSelectors: ["#iref-ui-root", "#iref-top-action-row", "#iref-top-queue-row"]
  })) == null ? void 0 : r.button);
  return {
    status: "registered",
    source: "site",
    season_name: hr() || null,
    car_name: Zc(e || i),
    start_time: tl(e || i),
    withdrawAction: t,
    joinAction: a
  };
}
function nl() {
  var t;
  const e = D();
  return e && ((t = ct(e)) == null ? void 0 : t.button) || null;
}
function il() {
  const e = Qo(), t = mr(), n = D();
  return Pn() ? (Se(), null) : t ? Go({
    season_name: t.season_name || (e == null ? void 0 : e.season_name) || null,
    car_name: t.car_name || (e == null ? void 0 : e.car_name) || null,
    start_time: t.start_time || (e == null ? void 0 : e.start_time) || null
  }) : e ? shouldClearRegisteredStateFromPage(e, n) ? (Se(), null) : e.status !== "registered" && e.status !== "registering" ? null : e : null;
}
function shouldClearRegisteredStateFromPage(e, t) {
  var n;
  if (!e || e.status === "registering" || Pn())
    return !1;
  const i = (n = ct(t)) == null ? void 0 : n.props;
  const s = i && dc(e, i) || t && fr(e) && location.pathname.includes("/go-racing");
  return !s ? !1 : e.confirmed_by_site === !0 || registeredStateAgeMs(e) >= jo;
}
function registeredStateAgeMs(e) {
  const t = e && (e.registered_at || e.updated_at || e.requested_at), n = new Date(t).getTime();
  return Number.isFinite(n) ? Date.now() - n : Number.POSITIVE_INFINITY;
}
function sl(e) {
  const t = (e == null ? void 0 : e.status) === "registering" ? x("status.registering") : x("status.registered"), n = [e == null ? void 0 : e.season_name, e == null ? void 0 : e.car_name].filter(Boolean).join(" · ");
  return n ? `${t} ${n}` : t;
}
function rl(e) {
  return (e == null ? void 0 : e.status) === "registering" ? (e == null ? void 0 : e.source) === "queue" ? x("status.subtitle_queue") : (e == null ? void 0 : e.source) === "direct" ? x("status.subtitle_direct") : x("status.subtitle_finishing") : x("status.subtitle_registered");
}
function al(e) {
  const n = new Date(e).getTime();
  if (!Number.isFinite(n))
    return "";
  const i = n - qe();
  if (i <= 0)
    return x("status.starts_now");
  const s = Math.floor(i / (1e3 * 60 * 60 * 24)), r = Math.floor(i % (1e3 * 60 * 60 * 24) / (1e3 * 60 * 60)), a = Math.floor(i % (1e3 * 60 * 60) / (1e3 * 60)), o = Math.floor(i % (1e3 * 60) / 1e3);
  return s > 0 ? x("status.starts_in", { value: `${s}d ${r}h ${a}m` }) : r > 0 ? x("status.starts_in", {
    value: `${r}h ${a}m ${o}s`
  }) : a > 0 ? x("status.starts_in", { value: `${a}m ${o}s` }) : x("status.starts_in", { value: `${o}s` });
}
function Ii(e, t, n) {
  const i = document.createElement("button");
  return i.type = "button", i.className = t, i.textContent = e, i.addEventListener("click", (s) => {
    s.preventDefault(), s.stopPropagation(), n();
  }), i;
}
function ol() {
  const e = Zn.querySelector("#iref-registration-banner"), t = e.querySelector(".iref-registration-title"), n = e.querySelector(".iref-registration-subtitle"), i = e.querySelector(".iref-registration-pill"), s = e.querySelector(".iref-registration-timer"), r = e.querySelector(".iref-registration-banner-right"), a = il(), o = mr(), c = (o == null ? void 0 : o.joinAction) || (a && fr(a) ? nl() : null);
  if (r.innerHTML = "", !a) {
    e.classList.add("hidden");
    return;
  }
  i.textContent = a.status === "registering" ? x("status.registering") : x("status.registered"), t.textContent = sl(a), n.textContent = rl(a);
  const u = al(a.start_time);
  s.textContent = u, s.classList.toggle("hidden", !u), e.classList.toggle("is-registering", a.status === "registering"), e.classList.remove("hidden");
  const l = () => {
    lr();
  };
  r.appendChild(
    Ii(
      x("status.withdraw"),
      "iref-registration-action iref-registration-action-secondary",
      l
    )
  ), c && r.appendChild(
    Ii(
      ye(
        c.innerText || c.textContent || x("status.join_race")
      ),
      "iref-registration-action iref-registration-action-primary",
      () => {
        Xc(c);
      }
    )
  );
}
function cl(e, t = null) {
  const n = new Date(e).getTime() - qe();
  if ((t == null ? void 0 : t.status) === "registering")
    return x("status.registering");
  if (n <= 300 * 1e3)
    return (t == null ? void 0 : t.status) === "found" ? x("queue.register_now") : x("queue.queued");
  const i = Math.floor(n / (1e3 * 60 * 60 * 24)), s = Math.floor(n % (1e3 * 60 * 60 * 24) / (1e3 * 60 * 60)), r = Math.floor(n % (1e3 * 60 * 60) / (1e3 * 60)), a = Math.floor(n % (1e3 * 60) / 1e3);
  return i > 0 ? `${i}d ${s}h ${r}m` : s > 0 ? `${s}h ${r}m ${a}s` : r > 0 ? `${r}m ${a}s` : `${a}s`;
}
function ll(e) {
  const t = ye(
    (e == null ? void 0 : e.event_type_name) || x("join.race")
  ).toLowerCase();
  return t.includes("qual") ? "(Q)" : t.includes("race") ? "(R)" : "";
}
function ul() {
  const e = Zn.querySelector(".iref-queue-items");
  if (e.innerHTML = "", !window.watchQueue || window.watchQueue.length < 1)
    return;
  window.watchQueue.forEach((n, i) => {
    n.originalIndex = i;
  }), [...window.watchQueue].sort(
    (n, i) => new Date(n.start_time) - new Date(i.start_time)
  ).forEach((n) => {
    let i;
    const s = ye(
      n.event_type_name || x("join.race")
    ).toLowerCase(), r = ll(n);
    switch (n.status) {
      case "found":
        i = x("status.tooltip_found", {
          sessionLabel: n.event_type_name || x("join.race")
        });
        break;
      case "registering":
        i = x("status.tooltip_registering");
        break;
      case "queued":
        i = x("status.tooltip_searching", {
          sessionLabel: s
        });
        break;
      default:
        i = "";
    }
    const a = /* @__PURE__ */ p.createElement("div", { className: "iref-queue-item" }, /* @__PURE__ */ p.createElement(
      "span",
      {
        className: `iref-queue-status ${n.status}`,
        title: i,
        onClick: () => {
          n.status === "found" && Yt(n.originalIndex, { manual: !0 });
        }
      }
    ), /* @__PURE__ */ p.createElement("span", { className: "iref-queue-text-fixed" }, cl(n.start_time, n)), /* @__PURE__ */ p.createElement("span", null, " ", r ? `${r} ` : "", n.season_name), /* @__PURE__ */ p.createElement(
      "button",
      {
        className: "iref-remove-btn",
        onClick: () => {
          Bc(n);
        },
        style: {
          marginRight: "5px",
          color: "var(--iref-bar-highlight)"
        }
      },
      "×"
    ));
    e.appendChild(a);
  });
}
window.setInterval(() => {
  document.hidden || (ol(), ul());
}, 1e3);
let Oi = !1;
let irefStatusQueueHydrated = !1;
async function dl(e = !0) {
  if (!e)
    return;
  if (!irefStatusQueueHydrated || !Array.isArray(window.watchQueue)) {
    rc();
    irefStatusQueueHydrated = !0;
  }
  !Oi && document.body && (document.body.appendChild(Zn), Oi = !0);
  ol();
  ul();
}
const _r = "status-bar", pl = "iref-" + _r;
L.add(_r, !0, Qc, pl, dl);
const br = "irefinedx_release_info", gl = 15 * 60 * 1e3, et = "1.0.0", ne = "v1.0.0", ei = "https://github.com/nishizumi-maho/iRefinedX/releases/latest", hl = "https://api.github.com/repos/nishizumi-maho/iRefinedX/releases/latest";
function qn(e = "") {
  var n;
  const t = (n = String(e).match(/\d+(?:\.\d+)*/)) == null ? void 0 : n[0];
  return t ? t.split(".").map((i) => parseInt(i, 10) || 0) : [];
}
function fl(e, t) {
  const n = qn(e), i = qn(t), s = Math.max(n.length, i.length);
  for (let r = 0; r < s; r += 1) {
    const a = n[r] || 0, o = i[r] || 0;
    if (a > o)
      return 1;
    if (a < o)
      return -1;
  }
  return 0;
}
function yr(e = {}) {
  const t = e.latestTag || e.latestVersion || e.releaseName || ne;
  return qn(t).length ? t : et;
}
function ti(e = {}) {
  return {
    available: !1,
    checkedAt: 0,
    currentVersion: et,
    currentDisplayVersion: ne,
    latestTag: ne,
    latestVersion: et,
    releaseUrl: ei,
    releaseName: ne,
    ...e
  };
}
function vr(e = {}) {
  const t = e.latestTag || e.latestVersion || e.releaseName || ne, n = yr({
    ...e,
    latestTag: t
  });
  return {
    ...ti(),
    ...e,
    available: fl(n, et) > 0,
    currentVersion: et,
    currentDisplayVersion: ne,
    latestTag: t,
    latestVersion: n
  };
}
function Ar() {
  try {
    const e = JSON.parse(localStorage.getItem(br));
    return !e || typeof e != "object" ? null : vr(e);
  } catch {
    return null;
  }
}
function ml(e) {
  return localStorage.setItem(br, JSON.stringify(e)), e;
}
function on(e) {
  return window.dispatchEvent(
    new CustomEvent("iref-update-info", {
      detail: e
    })
  ), e;
}
function _l(e) {
  const t = (e == null ? void 0 : e.tag_name) || (e == null ? void 0 : e.name) || ne, n = yr({
    latestTag: t,
    releaseName: (e == null ? void 0 : e.name) || t
  });
  return vr({
    checkedAt: Date.now(),
    latestTag: t,
    latestVersion: n,
    releaseName: (e == null ? void 0 : e.name) || t,
    releaseUrl: (e == null ? void 0 : e.html_url) || ei,
    publishedAt: (e == null ? void 0 : e.published_at) || null
  });
}
function Y() {
  return Ar() || ti();
}
async function wr({ force: e = !1 } = {}) {
  const t = Ar();
  if (!e && t && Date.now() - (t.checkedAt || 0) < gl)
    return on(t);
  try {
    const n = await fetch(hl, {
      headers: {
        Accept: "application/vnd.github+json"
      }
    });
    if (!n.ok)
      throw new Error(`GitHub release check failed (${n.status})`);
    const i = await n.json(), s = ml(_l(i));
    return s.available && console.info("[iRefined] Update available:", s.latestTag), on(s);
  } catch (n) {
    return console.warn("[iRefined] Failed to check for updates", n), on(
      t || ti({
        checkedAt: Date.now(),
        error: !0
      })
    );
  }
}
function Sr() {
  window.open(ei, "_blank", "noopener,noreferrer");
}
const bl = "body", kr = "iref_update_popup_seen_tag";
function P(e, t = {}) {
  return $(e, t);
}
function yl() {
  try {
    return sessionStorage.getItem(kr) || "";
  } catch {
    return "";
  }
}
function vl(e = "") {
  if (e)
    try {
      sessionStorage.setItem(kr, e);
    } catch {
    }
}
function qr() {
  let e = document.querySelector("#iref-update-popup");
  if (e)
    return e;
  e = document.createElement("div"), e.id = "iref-update-popup", e.className = "iref-update-popup", e.innerHTML = `
    <div class="iref-update-popup-backdrop"></div>
    <div
      class="iref-update-popup-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="iref-update-popup-title"
      aria-describedby="iref-update-popup-description"
    >
      <button
        type="button"
        class="iref-update-popup-close"
        aria-label="${P("update.close_notice")}"
      >
        ×
      </button>
      <div class="iref-update-popup-label"></div>
      <h3 id="iref-update-popup-title" class="iref-update-popup-title"></h3>
      <p id="iref-update-popup-description" class="iref-update-popup-description"></p>
      <div class="iref-update-popup-versions">
        <div class="iref-update-popup-version">
          <span class="iref-update-popup-version-label" data-iref-version="current"></span>
          <strong id="iref-update-popup-current-version"></strong>
        </div>
        <div class="iref-update-popup-version">
          <span class="iref-update-popup-version-label" data-iref-version="latest"></span>
          <strong id="iref-update-popup-latest-version"></strong>
        </div>
      </div>
      <p class="iref-update-popup-help"></p>
      <div class="iref-update-popup-actions">
        <button type="button" class="iref-update-popup-secondary"></button>
        <button type="button" class="iref-update-popup-primary"></button>
      </div>
    </div>
  `;
  const t = () => {
    e.classList.remove("open");
  };
  return e.querySelector(".iref-update-popup-backdrop").addEventListener("click", t), e.querySelector(".iref-update-popup-close").addEventListener("click", t), e.querySelector(".iref-update-popup-secondary").addEventListener("click", t), e.querySelector(".iref-update-popup-primary").addEventListener("click", (n) => {
    n.preventDefault(), n.stopPropagation(), t(), Sr();
  }), document.addEventListener("keydown", (n) => {
    n.key === "Escape" && e.classList.contains("open") && t();
  }), document.body.appendChild(e), xr(e), e;
}
function xr(e = qr()) {
  var t;
  (t = e.querySelector(".iref-update-popup-close")) == null || t.setAttribute(
    "aria-label",
    P("update.close_notice")
  ), e.querySelector(".iref-update-popup-label").textContent = P(
    "update.available"
  ), e.querySelector('[data-iref-version="current"]').textContent = P(
    "update.current"
  ), e.querySelector('[data-iref-version="latest"]').textContent = P(
    "update.latest"
  ), e.querySelector(".iref-update-popup-help").textContent = P("update.help"), e.querySelector(".iref-update-popup-secondary").textContent = P(
    "update.close"
  ), e.querySelector(".iref-update-popup-primary").textContent = P(
    "update.open_latest_release"
  );
}
function Cr(e = Y()) {
  const t = qr();
  return xr(t), e.available ? (t.querySelector("#iref-update-popup-title").textContent = P("update.ready_title", { tag: e.latestTag }), t.querySelector("#iref-update-popup-description").textContent = P("update.using_version", {
    version: ne
  }), t.querySelector("#iref-update-popup-current-version").textContent = ne, t.querySelector("#iref-update-popup-latest-version").textContent = e.latestTag, t) : (t.classList.remove("open"), t);
}
function Er(e = Y(), t = {}) {
  var s;
  const { automatic: n = !1 } = t;
  if (!e.available)
    return;
  const i = Cr(e);
  n && vl(e.latestTag), i.classList.add("open"), (s = i.querySelector(".iref-update-popup-primary")) == null || s.focus();
}
function xn(e = Y()) {
  !e.available || yl() === e.latestTag || Er(e, { automatic: !0 });
}
function Al() {
  const e = document.querySelector(".iref-bar-right");
  if (!e)
    return null;
  let t = document.querySelector("#iref-update-button");
  return t || (t = document.createElement("button"), t.type = "button", t.id = "iref-update-button", t.className = "iref-update-btn hidden", t.addEventListener("click", (n) => {
    n.preventDefault(), n.stopPropagation(), Er(Y());
  }), e.prepend(t)), t;
}
function jt(e = Y()) {
  const t = Al();
  if (t) {
    if (!e.available) {
      t.classList.add("hidden"), t.textContent = "";
      return;
    }
    t.classList.remove("hidden"), t.textContent = P("update.toolbar_label", {
      tag: e.latestTag
    }), t.title = P("update.toolbar_title", {
      tag: e.latestTag
    });
  }
}
async function wl() {
  const e = document.querySelector("#iref-update-button");
  e == null || e.remove();
  const t = document.querySelector("#iref-update-popup");
  t == null || t.remove();
}
window.addEventListener("iref-update-info", (e) => {
  jt(e.detail), xn(e.detail);
});
window.addEventListener(it, () => {
  jt(Y()), Cr(Y());
});
const Rr = "update-notice", Sl = `iref-${Rr}`;
L.add(Rr, !0, bl, Sl, wl);
const kl = [
  {
    name: "share-test-session",
    labelKey: "settings.share_test_session.label",
    helpKey: "settings.share_test_session.help"
  },
  {
    name: "share-hosted-session",
    labelKey: "settings.share_hosted_session.label",
    helpKey: "settings.share_hosted_session.help"
  },
  {
    name: "auto-register",
    labelKey: "settings.auto_register.label",
    helpKey: "settings.auto_register.help"
  },
  {
    name: "queue-car-prompt",
    labelKey: "settings.queue_car_prompt.label",
    helpKey: "settings.queue_car_prompt.help"
  },
  {
    name: "queue-requeue-displaced-registration",
    labelKey: "settings.queue_requeue.label",
    helpKey: "settings.queue_requeue.help"
  },
  {
    name: "queue-register-sound",
    labelKey: "settings.queue_sound.label",
    helpKey: "settings.queue_sound.help"
  },
  {
    name: "better-join-button",
    labelKey: "settings.better_join_button.label",
    helpKey: "settings.better_join_button.help"
  },
  {
    name: "dashboard-intelligence-center",
    labelKey: "settings.dashboard_intelligence.label",
    helpKey: "settings.dashboard_intelligence.help"
  },
], ql = [
  {
    name: "no-toasts",
    labelKey: "settings.no_toasts.label",
    helpKey: "settings.no_toasts.help"
  },
  {
    name: "no-sidebars",
    labelKey: "settings.no_sidebars.label",
    helpKey: "settings.no_sidebars.help"
  },
  {
    name: "collapse-menu",
    labelKey: "settings.collapse_menu.label",
    helpKey: "settings.collapse_menu.help"
  },
  {
    name: "logger",
    labelKey: "settings.logger.label",
    helpKey: "settings.logger.help"
  }
];
async function xl(e = !0) {
  if (!e)
    return;
  let t = W(), n = Y(), i = null;
  const s = (y, k = {}) => $(y, k, t), r = () => {
    let y = E("#iref-settings-overlay");
    return y || (y = /* @__PURE__ */ p.createElement("div", { id: "iref-settings-overlay", class: "iref-settings-overlay" }, /* @__PURE__ */ p.createElement("div", { class: "iref-settings-backdrop" }), /* @__PURE__ */ p.createElement("div", { id: "iref-settings-dialog", class: "iref-settings-dialog" })), y.querySelector(".iref-settings-backdrop").addEventListener("click", () => {
      a();
    }), document.body.appendChild(y), y);
  }, a = () => {
    const y = E("#iref-settings-overlay"), k = E("body"), G = E("#iref-log");
    y && y.classList.remove("open"), k && k.classList.remove("iref-settings-panel-open"), G && (G.scrollTop = G.scrollHeight);
  }, o = () => {
    location.reload();
  }, c = (y) => {
    y.preventDefault(), y.stopPropagation(), Sr();
  }, u = (y) => {
    y.preventDefault(), y.stopPropagation(), ks(), qs({ ignoreEnabled: !0 });
  }, l = () => {
    i && (i.title = s("settings.open_menu"), i.setAttribute("aria-label", s("settings.open_menu")));
  }, g = (y = Y()) => {
    const k = E("#iref-update-note");
    if (!k)
      return;
    if (k.innerHTML = "", !y.available) {
      k.classList.add("hidden");
      return;
    }
    k.classList.remove("hidden");
    const G = document.createElement("strong");
    G.textContent = s("update.note_title", {
      tag: y.latestTag
    });
    const gi = document.createElement("p");
    gi.textContent = s("update.note_description", {
      version: ne
    });
    const tn = document.createElement("div");
    tn.className = "iref-update-note-actions";
    const hi = document.createElement("span");
    hi.textContent = s("update.help");
    const He = document.createElement("button");
    He.type = "button", He.className = "iref-secondary-btn", He.textContent = s("update.open_latest_release"), He.addEventListener("click", c), tn.append(hi, He), k.append(G, gi, tn);
  }, f = (y) => {
    t["extension-language"] = y, vi({
      ...W(),
      "extension-language": y
    }), Si(t), l();
  }, d = (y) => {
    const { target: k } = y;
    k.type === "checkbox" && (t[k.name] = k.checked), k.type === "number" && (t[k.name] = parseInt(k.value, 10)), k.type === "select-one" && (t[k.name] = k.value), k.name === "extension-language" && (f(k.value), We());
  }, h = () => {
    t = vi(t), Si(t), l(), L.rerunAll(), a();
  }, w = (y) => /* @__PURE__ */ p.createElement("i", { class: "icon-information text-info", title: s(y) }), z = ({ name: y, labelKey: k, helpKey: G }) => /* @__PURE__ */ p.createElement("label", { htmlFor: "", class: "iref-setting" }, w(G), s(k), /* @__PURE__ */ p.createElement(
    "input",
    {
      type: "checkbox",
      name: y,
      checked: t[y],
      onChange: d
    }
  )), ge = () => /* @__PURE__ */ p.createElement("label", { htmlFor: "", class: "iref-setting" }, w("settings.language_help"), s("settings.language_label"), /* @__PURE__ */ p.createElement(
    "select",
    {
      name: "extension-language",
      onChange: d,
      value: t["extension-language"] || "auto"
    },
    To(t).map(({ value: y, label: k }) => /* @__PURE__ */ p.createElement(
      "option",
      {
        value: y,
        selected: (t["extension-language"] || "auto") === y
      },
      k
    ))
  )), ae = () => /* @__PURE__ */ p.createElement("label", { htmlFor: "", class: "iref-setting" }, w("settings.queue_sound_volume.help"), s("settings.queue_sound_volume.label"), /* @__PURE__ */ p.createElement(
    "input",
    {
      type: "number",
      name: "queue-register-sound-volume",
      min: "0",
      max: "100",
      value: t["queue-register-sound-volume"] ?? 65,
      onChange: d
    }
  ), "%"), oe = () => /* @__PURE__ */ p.createElement("div", { class: "iref-setting iref-setting-actions" }, w("settings.queue_sound_test.help"), s("settings.queue_sound_test.label"), /* @__PURE__ */ p.createElement(
    "button",
    {
      type: "button",
      class: "iref-secondary-btn",
      onClick: u
    },
    s("action.test_sound")
  )), ut = () => /* @__PURE__ */ p.createElement("label", { htmlFor: "", class: "iref-setting" }, w("settings.auto_close_toasts.help"), s("settings.auto_close_toasts.label"), /* @__PURE__ */ p.createElement(
    "input",
    {
      type: "number",
      name: "toast-timeout-s",
      value: t["toast-timeout-s"] || 5,
      onChange: d
    }
  ), s("common.seconds"), /* @__PURE__ */ p.createElement(
    "input",
    {
      type: "checkbox",
      name: "auto-close-toasts",
      checked: t["auto-close-toasts"],
      onChange: d
    }
  )), dt = () => /* @__PURE__ */ p.createElement("div", { id: "iref-settings-panel-content", class: "modal-content" }, /* @__PURE__ */ p.createElement("div", { class: "modal-header" }, /* @__PURE__ */ p.createElement("a", { class: "close", onClick: a }, /* @__PURE__ */ p.createElement("i", { class: "icon-cancel" })), /* @__PURE__ */ p.createElement(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "24px",
      height: "24px",
      style: { float: "left", marginRight: 7 },
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      class: "lucide lucide-rocket"
    },
    /* @__PURE__ */ p.createElement("path", { d: "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" }),
    /* @__PURE__ */ p.createElement("path", { d: "m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" }),
    /* @__PURE__ */ p.createElement("path", { d: "M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" }),
    /* @__PURE__ */ p.createElement("path", { d: "M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" })
  ), /* @__PURE__ */ p.createElement("h6", { class: "modal-title", "data-testid": "modal-title" }, "iRefined")), /* @__PURE__ */ p.createElement("div", { class: "modal-body has-dynamic-height" }, /* @__PURE__ */ p.createElement(
    "div",
    {
      id: "modal-children",
      class: "height-limiter",
      style: { maxHeight: 1244 }
    },
    /* @__PURE__ */ p.createElement("div", { id: "modal-children-container", style: { position: "relative" } }, /* @__PURE__ */ p.createElement("div", null, /* @__PURE__ */ p.createElement("div", { class: "row" }, /* @__PURE__ */ p.createElement("div", { class: "col-xs-12" }, /* @__PURE__ */ p.createElement("h1", { class: "m-b-1" }, /* @__PURE__ */ p.createElement("strong", null, s("settings.title"))), /* @__PURE__ */ p.createElement("p", { class: "m-b-1" }, s("settings.description")), ge(), /* @__PURE__ */ p.createElement("div", { id: "iref-update-note", class: "iref-update-note hidden" }), /* @__PURE__ */ p.createElement("h4", { class: "m-b-1" }, /* @__PURE__ */ p.createElement("strong", null, s("settings.section.webtools"))), kl.map(z), ae(), oe(), /* @__PURE__ */ p.createElement("h4", { class: "m-b-1" }, /* @__PURE__ */ p.createElement("strong", null, s("settings.section.tweaks"))), z({
      name: "no-toasts",
      labelKey: "settings.no_toasts.label",
      helpKey: "settings.no_toasts.help"
    }), ut(), ql.filter(
      ({ name: y }) => y !== "no-toasts"
    ).map(z)))))
  )), /* @__PURE__ */ p.createElement("div", { class: "modal-footer" }, /* @__PURE__ */ p.createElement("div", null, /* @__PURE__ */ p.createElement("div", { class: "pull-xs-left" }, /* @__PURE__ */ p.createElement(
    "a",
    {
      id: "default-close-modal-btn-71327f90-c5eb-2239-da82-fd2d60e5ea02",
      class: "btn btn-md btn-secondary",
      "data-testid": "button-close-modal",
      onClick: a
    },
    /* @__PURE__ */ p.createElement("i", { class: "icon-cancel" }),
    " ",
    s("common.close")
  ), /* @__PURE__ */ p.createElement(
    "a",
    {
      id: "reload-ui",
      class: "btn btn-md btn-secondary",
      onClick: o
    },
    s("common.reload_page")
  )), /* @__PURE__ */ p.createElement("div", { class: "pull-xs-right" }, /* @__PURE__ */ p.createElement("span", { class: "m-l-h" }, /* @__PURE__ */ p.createElement(
    "button",
    {
      type: "button",
      class: "btn btn-success",
      "aria-label": "button",
      tabindex: "0",
      onClick: h
    },
    s("common.save")
  )))))), We = () => {
    const y = E("#iref-settings-dialog");
    y && (y.innerHTML = "", y.appendChild(dt()), g(n));
  }, q = () => {
    const y = r(), k = E("body");
    t = W(), n = Y(), y && (We(), y.classList.add("open"), wr({ force: !0 }).then((G) => {
      n = G, g(G);
    }), k && k.classList.add("iref-settings-panel-open"));
  };
  if (i = /* @__PURE__ */ p.createElement(
    "button",
    {
      type: "button",
      className: "iref-toolbar-btn iref-settings-trigger",
      "aria-label": s("settings.open_menu"),
      title: s("settings.open_menu"),
      tabindex: "0",
      onClick: q
    },
    /* @__PURE__ */ p.createElement(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        width: "20px",
        height: "20px",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        class: "lucide lucide-rocket"
      },
      /* @__PURE__ */ p.createElement("path", { d: "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" }),
      /* @__PURE__ */ p.createElement("path", { d: "m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" }),
      /* @__PURE__ */ p.createElement("path", { d: "M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" }),
      /* @__PURE__ */ p.createElement("path", { d: "M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" })
    ),
    /* @__PURE__ */ p.createElement("span", null, "iRefined")
  ), E(".iref-settings-trigger"))
    i = E(".iref-settings-trigger");
  else {
    const y = E(".iref-bar-right");
    y && y.appendChild(i);
  }
  l();
}
const Nr = "settings-panel", Cl = "iref-" + Nr, El = "body";
L.add(Nr, !0, El, Cl, xl);
const Tr = "no-sidebars", Rl = "#rightbar", Nl = "iref-" + Tr;
L.add(Tr, !0, Rl, Nl);
const zr = "no-toasts", Tl = "#chakra-toast-manager-top", zl = "iref-" + zr;
L.add(zr, !0, Tl, zl);
const Dr = "collapse-menu", Dl = "#racing-sidebar", Ll = "iref-" + Dr;
L.add(Dr, !0, Dl, Ll);
const Lr = '.chakra-toast button[aria-label="Close"]:not(.iref-seen)';
async function Il(e = !0) {
  if (!e)
    return;
  const t = W()["toast-timeout-s"] || 5;
  let n = E(Lr);
  n.classList.add("iref-seen"), b("✖️ Closing toast after " + t + " seconds"), setTimeout(() => {
    let i = Object.keys(n).find(
      (s) => s.startsWith("__reactProps")
    );
    n[i].onClick();
  }, t * 1e3);
}
const Ir = "auto-close-toasts", Ol = "iref-" + Ir;
L.add(Ir, !0, Lr, Ol, Il);
function autoConfirmRegisterDialog() {
  const e = psHasAutoConfirmMode("register"), t = psHasAutoConfirmMode("withdraw");
  if (!e && !t)
    return !1;
  const n = [...document.querySelectorAll('[role="dialog"], .chakra-modal__content, .modal-content')].find((o) => {
    if (!Ht(o))
      return !1;
    const c = Xe(o.innerText || "");
    return e && (c.includes("continue to register") || c.includes("show me this again") || c.includes("join button will appear in a green bar above")) || t && (c.includes("withdraw") || c.includes("cancel registration") || c.includes("cancelar registro") || c.includes("cancelar registo"));
  });
  if (!n)
    return !1;
  if (e) {
    const o = [...n.querySelectorAll("label, button, span, div")].find(
      (c) => Xe(c.textContent || "").includes("show me this again")
    );
    if (o) {
      const c = o.closest("label, button, [role='switch']") || o.parentElement, u = (c == null ? void 0 : c.querySelector('input[type="checkbox"]')) || (c == null ? void 0 : c.querySelector("[role='switch']")) || c;
      const l = !!((u == null ? void 0 : u.checked) === !0 || (u == null ? void 0 : u.getAttribute) && u.getAttribute("aria-checked") === "true");
      !l && c && typeof c.click == "function" && c.click();
    }
  }
  const i = [...n.querySelectorAll("button, a")].find(
    (o) => {
      const c = Xe(o.innerText || o.textContent || "");
      return Ht(o) && (e && c === "continue" || t && BsWithdrawActionText(c));
    }
  );
  return !i || i.dataset.irefAutoConfirm === "1" ? !1 : (i.dataset.irefAutoConfirm = "1", Xc(i), !0);
}
const Xt = "#test-drive-modal";
function Bl() {
  return new Promise((e) => {
    const t = document.createElement("input");
    t.setAttribute("type", "file"), t.setAttribute("accept", ".json"), t.addEventListener(
      "change",
      async (n) => {
        const { files: i } = n.target;
        if (!i) {
          e([]);
          return;
        }
        e(await Promise.all([...i].map((s) => s.text())));
      },
      !1
    ), t.click();
  });
}
function jl(e, t) {
  const n = document.createElement("a"), i = t.split(".").pop();
  n.href = URL.createObjectURL(
    new Blob([e], { type: `text/${i === "txt" ? "plain" : i}` })
  ), n.download = t, n.click();
}
function Or(e) {
  const t = E(Xt), n = t == null ? void 0 : t.querySelector(".modal-footer > .centered-horizontal");
  if (!e || !n)
    return;
  const i = async () => {
    const a = await Bl();
    a.length < 1 || e.setState(JSON.parse(a[0]));
  }, s = async () => {
    const a = {
      carId: e.state.carId,
      carClassId: e.state.carClassId,
      climateChange: e.state.climateChange,
      damageModel: e.state.damageModel,
      timeOfDay: e.state.timeOfDay,
      trackId: e.state.trackId,
      trackState: e.state.trackState,
      weather: e.state.weather
    }, c = (/* @__PURE__ */ new Date()).toISOString().substring(0, 10);
    jl(
      JSON.stringify(a),
      `testing-conditions-${c}.json`
    );
  };
  let r = n.querySelector("#iref-test-session-tools");
  r || (r = /* @__PURE__ */ p.createElement("div", { id: "iref-test-session-tools", style: { display: "inline" } }, /* @__PURE__ */ p.createElement(
    "button",
    {
      id: "upload-button",
      onClick: i,
      class: "btn btn-sm btn-primary pull-xs-left"
    }
  ), /* @__PURE__ */ p.createElement(
    "button",
    {
      id: "download-button",
      onClick: s,
      class: "btn btn-sm btn-primary pull-xs-left"
    }
  )), n.prepend(r)), r.querySelector("#upload-button").textContent = $(
    "action.upload"
  ), r.querySelector("#download-button").textContent = $(
    "action.download"
  );
}
async function Ml(e = !0) {
  if (!e)
    return;
  const t = Wt(E(Xt), 1, "state");
  Or(t);
}
const Br = "share-test-session", $l = "iref-" + Br;
window.addEventListener(it, () => {
  const e = Wt(E(Xt), 1, "state");
  Or(e);
});
L.add(Br, !0, Xt, $l, Ml);
function lt(e, t) {
  const n = URL.createObjectURL(
    new Blob([JSON.stringify(t, null, 2)], {
      type: "application/json"
    })
  ), i = document.createElement("a");
  i.href = n, i.download = e, i.rel = "noopener", i.style.display = "none", document.body.appendChild(i), i.click(), window.setTimeout(() => {
    i.remove(), URL.revokeObjectURL(n);
  }, 1e3);
}
function Fl(e) {
  return !e || typeof e != "object" ? !1 : typeof Node < "u" && e instanceof Node || typeof Window < "u" && e instanceof Window || typeof Event < "u" && e instanceof Event;
}
function Cn(e, t = /* @__PURE__ */ new WeakSet()) {
  if (e === null)
    return null;
  if (e instanceof Date)
    return e.toISOString();
  const n = typeof e;
  if (n === "string" || n === "number" || n === "boolean")
    return e;
  if (n === "bigint")
    return String(e);
  if (n === "undefined" || n === "function" || n === "symbol" || n !== "object" || Fl(e) || t.has(e))
    return;
  if (t.add(e), Array.isArray(e)) {
    const s = e.map((r) => Cn(r, t)).filter((r) => r !== void 0);
    return t.delete(e), s;
  }
  const i = {};
  return Object.keys(e).forEach((s) => {
    const r = Cn(e[s], t);
    r !== void 0 && (i[s] = r);
  }), t.delete(e), i;
}
function ie(e, t = null) {
  const n = Cn(e);
  return n === void 0 ? t : n;
}
let Bi = 0;
function we(e, t = {}) {
  return $(e, t);
}
function ni(e = "") {
  return e.replace(/\s+/g, " ").trim();
}
function jr(e) {
  return !!e && !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
}
function Wl(e = "") {
  return ni(e).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function Hl() {
  return new Promise((e) => {
    const t = document.createElement("input");
    t.type = "file", t.accept = ".json", t.addEventListener(
      "change",
      async (n) => {
        const i = [...n.target.files || []];
        if (i.length < 1) {
          e([]);
          return;
        }
        e(await Promise.all(i.map((s) => s.text())));
      },
      !1
    ), t.click();
  });
}
function Ul() {
  return [...document.querySelectorAll("h1")].find(
    (e) => jr(e) && !!ni(e.textContent)
  );
}
function Pl() {
  return [...document.querySelectorAll("h1")].filter((e) => jr(e) && !!ni(e.textContent)).map(
    (e) => vo(
      e,
      (t) => !!t.session && !!t.settings && Array.isArray(t.wizard)
    )
  ).find(Boolean) || null;
}
function Vl(e = {}) {
  const t = ie(e, {}) || {};
  return [
    "admins",
    "allowed_leagues",
    "allowed_teams",
    "entry_count",
    "ended_waiting",
    "farm",
    "friends",
    "guid",
    "host",
    "image",
    "league_id",
    "league_name",
    "league_season_id",
    "order_id",
    "owner",
    "pending",
    "populated",
    "private_session_id",
    "search_filters",
    "session_full",
    "session_id",
    "small_logo",
    "source",
    "subsession_id",
    "watched"
  ].forEach((n) => {
    delete t[n];
  }), t;
}
function Kl(e) {
  var s, r;
  const t = (s = e == null ? void 0 : e.state) == null ? void 0 : s.session, n = (t == null ? void 0 : t.session_name) || "hosted-session", i = `${Wl(n)}-session.json`;
  lt(i, {
    exportType: "irefined-session",
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    url: location.href,
    summary: {
      sessionName: n,
      trackName: (t == null ? void 0 : t.track_name) || ((r = t == null ? void 0 : t.track) == null ? void 0 : r.track_name) || null,
      sessionType: (t == null ? void 0 : t.session_type) || null
    },
    session: Vl(t),
    weather: ie((t == null ? void 0 : t.weather) || {}, {}),
    trackState: ie((t == null ? void 0 : t.track_state) || {}, {})
  }), b(we("common.downloaded_filename", { filename: i }));
}
function Ql(e) {
  if (!e || typeof e != "object")
    return null;
  if (Array.isArray(e.sessions) && e.sessions.length > 0) {
    const t = Jl(e.sessions, "session");
    return t ? t.session && typeof t.session == "object" ? t.session : t : null;
  }
  return e.session && typeof e.session == "object" ? e.session : e.session_name || e.weather || e.track_state ? e : null;
}
function Gl(e, t) {
  const n = (e == null ? void 0 : e.summary) || e, i = (e == null ? void 0 : e.session) || e, s = (n == null ? void 0 : n.sessionName) || (i == null ? void 0 : i.session_name) || (n == null ? void 0 : n.trackName) || we("share.session_default", { index: t + 1 }), r = (n == null ? void 0 : n.launchAt) || (i == null ? void 0 : i.launch_at) || (n == null ? void 0 : n.openRegExpires) || null, a = (n == null ? void 0 : n.hostName) || (i == null ? void 0 : i.host_name) || null, o = [s];
  if (a && o.push(a), r) {
    const c = new Date(r);
    o.push(Number.isNaN(c.getTime()) ? String(r) : c.toLocaleString());
  }
  return o.join(" | ");
}
function Jl(e, t) {
  if (!Array.isArray(e) || e.length < 1)
    return null;
  if (e.length === 1)
    return e[0];
  const n = e.slice(0, 12).map((a, o) => `${o + 1}. ${Gl(a, o)}`).join(`
`), i = e.length > 12 ? `
${we("share.prompt_more_sessions", {
    count: e.length - 12
  })}` : "", s = window.prompt(
    `${we("share.prompt_import_which", { label: t })}

${n}${i}`,
    "1"
  );
  if (!s)
    return null;
  const r = parseInt(s, 10) - 1;
  return Number.isNaN(r) || r < 0 || r >= e.length ? (b(we("share.invalid_selection", { label: t })), null) : e[r];
}
async function Yl(e) {
  const t = await Hl();
  if (t.length < 1)
    return;
  const n = JSON.parse(t[0]), i = Ql(n);
  if (!i) {
    b(we("share.session_import_failed"));
    return;
  }
  e.setState((s) => ({
    session: {
      ...s.session,
      ...ie(i, {}),
      weather: {
        ...s.session.weather,
        ...ie(i.weather || {}, {})
      },
      track_state: {
        ...s.session.track_state,
        ...ie(i.track_state || {}, {})
      }
    }
  })), b(we("share.session_imported"));
}
function Xl(e) {
  var r, a, o;
  const t = Ul(), n = (r = t == null ? void 0 : t.parentElement) == null ? void 0 : r.parentElement;
  if (!e || !t || !n)
    return null;
  let i = n.querySelector("#iref-hosted-tools");
  return i ? ((a = i.querySelector("#iref-import-weather")) == null || a.remove(), (o = i.querySelector("#iref-export-weather")) == null || o.remove(), i.querySelector("#iref-import-session").textContent = $(
    "action.import_session"
  ), i.querySelector("#iref-export-session").textContent = $(
    "action.export_session"
  ), i) : (i = document.createElement("div"), i.id = "iref-hosted-tools", i.className = "iref-hosted-buttons", [
    {
      id: "iref-import-session",
      label: $("action.import_session"),
      onClick: async () => Yl(e)
    },
    {
      id: "iref-export-session",
      label: $("action.export_session"),
      onClick: () => Kl(e)
    }
  ].forEach(({ id: c, label: u, onClick: l }) => {
    const g = document.createElement("button");
    g.type = "button", g.id = c, g.className = "iref-hosted-btn", g.textContent = u, g.addEventListener("click", (f) => {
      f.preventDefault(), f.stopPropagation(), l();
    }), i.appendChild(g);
  }), n.insertBefore(i, n.children[1] || null), i);
}
async function Zl(e = !0) {
  clearInterval(Bi), e && (Bi = setInterval(() => {
    const t = Pl();
    t && Xl(t);
  }, 400));
}
const Mr = "share-hosted-session", eu = "iref-" + Mr, tu = "body";
L.add(Mr, !0, tu, eu, Zl);
let ji = 0;
function X(e, t = {}) {
  return $(e, t);
}
function Re(e = "") {
  return e.replace(/\s+/g, " ").trim();
}
function En(e = "") {
  return Re(e).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function nu(e) {
  return [...document.querySelectorAll("h1, h2, h3, h4, h5, h6")].find(
    (t) => e(Re(t.textContent))
  );
}
function ii(e, t) {
  let n = e;
  for (; n && n !== document.body; ) {
    if (t(n))
      return n;
    n = n.parentElement;
  }
  return null;
}
function Zt(e, t = "iref-export-actions", n = null) {
  if (!e)
    return null;
  let i = n ? document.getElementById(n) : null;
  return i || (i = e.querySelector(`:scope > .${t}`)), i ? (i.parentElement !== e && e.appendChild(i), i) : (i = document.createElement("div"), n && (i.id = n), i.className = t, e.appendChild(i), i);
}
function en(e, t, n, i, s = "iref-export-btn") {
  if (!e)
    return null;
  let r = document.getElementById(t);
  return r ? (r.parentElement !== e && e.appendChild(r), r.textContent = n, r) : (r = document.createElement("button"), r.type = "button", r.id = t, r.className = s, r.textContent = n, r.addEventListener("click", i), e.appendChild(r), r);
}
function iu() {
  var e;
  return Re(((e = document.querySelector("h2")) == null ? void 0 : e.textContent) || "series");
}
function $r() {
  return [...document.querySelectorAll("h1, h2")].find(
    (e) => Ht(e) && Re(e.textContent)
  );
}
function su(e = Fr()) {
  return e ? nt(e, {
    visibleOnly: !1,
    skipSelectors: ["#iref-ui-root", "#iref-top-action-row", "#iref-top-queue-row"]
  }) : null;
}
function Fr() {
  const e = nu(
    (t) => M(t, "nextRacePrefix")
  );
  return e ? ii(e, (t) => {
    const n = Re(t.innerText || "");
    return M(n, "nextRacePrefix") && !!su(t);
  }) : null;
}
function ru(e, t = null) {
  const n = Z(document, { visibleOnly: !1 }).find(
    ({ button: i, props: s }) => !(t != null && t.contains(i)) && (!e || e(s, i))
  );
  return n ? ii(
    n.button,
    (i) => i !== n.button && typeof i.querySelector == "function" && !!i.querySelector("table")
  ) : null;
}
function au() {
  var e;
  (e = document.getElementById("iref-weather-export-actions")) == null || e.remove(), document.querySelectorAll('[id^="iref-inline-weather-"]').forEach((t) => {
    t.remove();
  });
}
function Wr() {
  return Vs() || D();
}
function ou() {
  const e = Wr();
  return e ? Z(e, { visibleOnly: !1 }).map(
    ({ button: t }) => t
  ) : [];
}
function officialSessionButtons() {
  var t;
  const e = ou();
  if (e.length)
    return e;
  const n = (t = Ce(D())) == null ? void 0 : t.button;
  return Qt(document, {
    skipButtons: n ? [n] : []
  }).filter(
    ({ props: i }) => Qn(i == null ? void 0 : i.session)
  ).map(({ button: i }) => i);
}
function cu() {
  var i;
  const e = officialSessionButtons(), n = (i = ri(e)[0]) == null ? void 0 : i.props;
  return n != null && n.session ? si(n, "irefined-official-session") : null;
}
function ft(e) {
  if (e == null || e === "")
    return null;
  if (typeof e == "number")
    return new Date(e).toISOString();
  const t = new Date(e);
  return Number.isNaN(t.getTime()) ? e : t.toISOString();
}
function lu(e = {}) {
  const t = ie(e, {}) || {};
  return [
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
    "watched"
  ].forEach((n) => {
    delete t[n];
  }), t;
}
function uu(e) {
  return ri(e).map(({ props: t }) => t);
}
function du(e = {}) {
  var n, i, s, r, a;
  const t = e.session || {};
  return {
    contentId: e.contentId ?? null,
    sessionId: t.session_id ?? null,
    privateSessionId: t.private_session_id ?? null,
    subsessionId: t.subsession_id ?? null,
    sessionName: t.session_name ?? null,
    leagueId: t.league_id ?? null,
    leagueName: t.league_name ?? null,
    leagueSeasonId: t.league_season_id ?? null,
    sessionType: t.session_type ?? null,
    category: t.category ?? null,
    status: t.status ?? null,
    fixedSetup: t.fixed_setup ?? null,
    entryCount: t.entry_count ?? null,
    maxDrivers: t.max_drivers ?? null,
    maxUsers: t.max_users ?? null,
    teamEntryCount: t.team_entry_count ?? null,
    hostName: t.host_name || ((n = t.host) == null ? void 0 : n.display_name) || null,
    farm: t.farm_display_name || ((i = t.farm) == null ? void 0 : i.display_name) || null,
    trackName: t.track_name || ((s = t.track) == null ? void 0 : s.track_name) || null,
    trackConfig: ((r = t.track) == null ? void 0 : r.config_name) || null,
    trackId: ((a = t.track) == null ? void 0 : a.track_id) || null,
    launchAt: ft(t.launch_at),
    openRegExpires: ft(t.open_reg_expires),
    predictedOpenRegExpires: ft(t.predicted_open_reg_expires),
    endTime: ft(t.end_time),
    carNameString: t.car_name_string || null,
    carNameStringAbbreviated: t.car_name_string_abbreviated || null,
    cars: (t.cars || []).map((o) => ({
      carId: o.car_id,
      carName: o.car_name,
      carClassId: o.car_class_id,
      carClassName: o.car_class_name
    })),
    durations: {
      practiceLength: t.practice_length ?? null,
      qualifyLength: t.qualify_length ?? null,
      qualifyLaps: t.qualify_laps ?? null,
      warmupLength: t.warmup_length ?? null,
      raceLength: t.race_length ?? null,
      raceLaps: t.race_laps ?? null,
      timeLimit: t.time_limit ?? null
    },
    weather: t.weather ? ie(t.weather) : null,
    trackState: t.track_state ? ie(t.track_state) : null
  };
}
function si(e = {}, t = "irefined-session") {
  const n = e.session || {};
  return {
    exportType: t,
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    url: location.href,
    summary: du(e),
    session: lu(n),
    weather: n.weather ? ie(n.weather) : null
  };
}
function Hr() {
  return Z(document, { visibleOnly: !1 }).map(
    ({ button: e }) => e
  );
}
function Ur() {
  return Z(document, { visibleOnly: !1 }).map(
    ({ button: e }) => e
  );
}
function ri(e) {
  const t = new Set(e);
  return Z(document, { visibleOnly: !1 }).filter(
    ({ button: n }) => t.has(n)
  );
}
function Mi(e) {
  ri(e).forEach(({ button: t, props: n }) => {
    var o;
    const i = n.session || {}, s = i.session_id || i.private_session_id || En(i.session_name), r = Zt(
      t.parentElement,
      "iref-inline-export-actions",
      `iref-inline-export-${s}`
    ), a = i.track_name || ((o = i.track) == null ? void 0 : o.track_name) || "session";
    en(
      r,
      `iref-inline-session-${s}`,
      X("tools.session_json"),
      (c) => {
        c.preventDefault(), c.stopPropagation();
        const u = si(n, "irefined-session"), l = `${En(i.session_name || a)}-session.json`;
        lt(l, u), b(X("common.downloaded_filename", { filename: l }));
      },
      "iref-export-btn iref-export-btn-inline"
    );
  });
}
function Pr(e, t, n) {
  const i = uu(e).map(
    (s) => si(s, t)
  );
  return i.length < 1 ? null : {
    exportType: t,
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    url: location.href,
    title: n,
    sessionCount: i.length,
    sessions: i
  };
}
function officialExportHost() {
  const e = Wr();
  if (!e)
    return null;
  const t = Zt(
    e,
    "iref-export-actions",
    "iref-official-sessions-export-actions"
  ), n = [...e.children].find(
    (i) => i !== t && typeof (i == null ? void 0 : i.querySelector) == "function" && !!i.querySelector("h1, h2, h3, h4")
  );
  return n ? e.insertBefore(t, n.nextSibling) : e.firstElementChild && e.firstElementChild !== t ? e.insertBefore(t, e.firstElementChild) : e.appendChild(t), t;
}
function pu() {
  const e = officialExportHost();
  if (!e)
    return;
  en(e, "iref-export-sessions", X("tools.export_session_json"), (t) => {
    var o, c;
    t.preventDefault(), t.stopPropagation();
    const r = cu();
    if (!r) {
      b(X("tools.session_export_unavailable"));
      return;
    }
    const a = `${En(
      ((o = r.summary) == null ? void 0 : o.sessionName) || ((c = r.summary) == null ? void 0 : c.trackName) || iu()
    )}-session.json`;
    lt(a, r), b(X("common.downloaded_filename", { filename: a }));
  });
}
function gu() {
  var s;
  const e = Hr(), t = $r(), n = (t == null ? void 0 : t.parentElement) || ((s = e[0]) == null ? void 0 : s.parentElement);
  if (!n)
    return;
  const i = Zt(
    n,
    "iref-export-actions",
    "iref-hosted-sessions-export-actions"
  );
  en(
    i,
    "iref-export-hosted-sessions",
    X("tools.export_hosted_sessions_json"),
    (r) => {
      r.preventDefault(), r.stopPropagation();
      const a = Pr(
        e,
        "irefined-hosted-sessions",
        Re((t == null ? void 0 : t.textContent) || "Hosted Racing")
      );
      if (!a) {
        b(X("tools.hosted_export_unavailable"));
        return;
      }
      const o = "hosted-sessions.json";
      lt(o, a), b(X("common.downloaded_filename", { filename: o }));
    }
  );
}
function hu() {
  var s;
  const e = Ur(), t = $r(), n = (t == null ? void 0 : t.parentElement) || ((s = e[0]) == null ? void 0 : s.parentElement);
  if (!n)
    return;
  const i = Zt(
    n,
    "iref-export-actions",
    "iref-league-sessions-export-actions"
  );
  en(
    i,
    "iref-export-league-sessions",
    X("tools.export_league_sessions_json"),
    (r) => {
      r.preventDefault(), r.stopPropagation();
      const a = Pr(
        e,
        "irefined-league-sessions",
        Re((t == null ? void 0 : t.textContent) || "League Sessions")
      );
      if (!a) {
        b(X("tools.league_export_unavailable"));
        return;
      }
      const o = "league-sessions.json";
      lt(o, a), b(X("common.downloaded_filename", { filename: o }));
    }
  );
}
function duOfficialInlineExport() {
  document.querySelectorAll('[id^="iref-inline-export-"], [id^="iref-inline-session-"]').forEach((e) => {
    e.remove();
  });
}
async function fu(e = !0) {
  const t = () => {
    au(), location.pathname.includes("/go-racing") && (pu(), duOfficialInlineExport()), location.pathname.includes("/hosted") && (gu(), Mi(Hr())), location.pathname.includes("/leagues") && (hu(), Mi(Ur()));
  };
  clearInterval(ji), e && (t(), ji = setInterval(t, 500));
}
const Vr = "go-racing-export", mu = "iref-" + Vr, _u = "body";
L.add(Vr, !0, _u, mu, fu);
const Kr = ".css-qlxuh7 .btn-success";
let mt = 0;
const $i = {
  0: "join.race",
  2: "join.spectate",
  4: "join.spot"
};
function _t(e, t = {}) {
  return $(e, t);
}
async function bu(e = !0) {
  if (!e) {
    clearInterval(mt), mt = 0;
    return;
  }
  mt || (mt = setInterval(() => {
    if (document.hidden)
      return;
    let t = E(Kr);
    if (!t)
      return;
    const n = Ao(t);
    if (!(n != null && n.registrationStatus))
      return;
    let i = "", s = "";
    n.registrationStatus.user_role !== 0 ? $i[n.registrationStatus.user_role] !== void 0 && (i = _t($i[n.registrationStatus.user_role])) : (n.registrationStatus.event_type === 5 ? i = _t("join.race") : i = _t("join.practice"), n.registrationStatus.will_be_scored ? s = "" : s = _t("join.unscored")), t.textContent = `${i}${s}`;
    const r = window.irefIndex && n.registrationStatus.season_id in window.irefIndex ? window.irefIndex[n.registrationStatus.season_id] : !1, a = E(".chakra-text.css-1ap4k1m");
    r && a && (a.innerText = r);
  }, 300));
}
const Qr = "better-join-button", yu = "iref-" + Qr;
L.add(Qr, !0, Kr, yu, bu);
const vu = "irefined-bridge-request", Au = "irefined-bridge-response", wu = 5e3, Su = window.location.origin, ku = "iref_purchase_history_summary", qu = "iref_missing_content_summary", Rn = "iref_membership_summary", xu = "iref_purchase_history_summary::";
function Gr(e = "") {
  const t = String(e || "").trim();
  return t ? `${xu}${t}` : ku;
}
function Cu() {
  return `iref-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
function Eu(e) {
  return new Promise((t, n) => {
    let i = 0;
    const s = () => {
      window.removeEventListener("message", r), i && window.clearTimeout(i);
    }, r = (a) => {
      if (a.source !== window)
        return;
      const o = a.data;
      if (!(!o || o.source !== Au || o.requestId !== e)) {
        if (s(), o.success === !1) {
          n(new Error(o.error || "Bridge request failed."));
          return;
        }
        t(o.payload ?? null);
      }
    };
    i = window.setTimeout(() => {
      s(), n(new Error("Bridge request timed out."));
    }, wu), window.addEventListener("message", r);
  });
}
function ai(e, t = {}) {
  const n = Cu(), i = Eu(n);
  return window.postMessage(
    {
      source: vu,
      requestId: n,
      action: e,
      payload: t
    },
    Su
  ), i;
}
async function Jr(e) {
  return await ai("storage-get", {
    keys: Array.isArray(e) ? e : [e]
  }) || {};
}
async function Yr(e) {
  return await ai("storage-set", {
    values: e && typeof e == "object" ? e : {}
  }) || {};
}
async function Ru(e) {
  return await ai("storage-remove", {
    keys: Array.isArray(e) ? e : [e]
  }) || {};
}
const Nu = "https://members-ng.iracing.com/web/settings/account/info", Tu = {
  memberSince: [
    "Member since",
    "Membro desde",
    "Miembro desde",
    "Mitglied seit"
  ],
  nextBilling: [
    "Next Billing Date",
    "Next billing date",
    "Proxima cobranca",
    "Proxima data de cobranca",
    "Proxima facturacion",
    "Nachstes Abrechnungsdatum"
  ],
  currentPlan: [
    "Current plan",
    "Plano atual",
    "Plan actual",
    "Aktuelles Abo"
  ],
  autoRenewal: [
    "Auto Renewal",
    "Auto renewal",
    "Renovacao automatica",
    "Renovacion automatica",
    "Automatische Verlangerung"
  ],
  membershipStatus: [
    "Membership Status",
    "Subscription Status",
    "Status da assinatura",
    "Estado de la suscripcion",
    "Mitgliederschaftsstatus",
    "Abo-Status"
  ],
  currentPrice: [
    "Current Price",
    "Preco atual",
    "Precio actual",
    "Aktueller Preis"
  ]
};
function F(e) {
  return String(e || "").replace(/\s+/g, " ").trim();
}
function zu(e) {
  const t = document.createElement("iframe");
  return t.style.position = "fixed", t.style.left = "-10000px", t.style.top = "0", t.style.width = "1280px", t.style.height = "900px", t.style.opacity = "0", t.style.pointerEvents = "none", t.style.border = "0", t.setAttribute("aria-hidden", "true"), t.src = e, document.body.appendChild(t), t;
}
function Du(e) {
  if (typeof e == "boolean")
    return e;
  const t = F(e).toLowerCase();
  return t ? [
    "true",
    "on",
    "enabled",
    "yes",
    "active",
    "auto renew on",
    "automatic renewal on"
  ].includes(t) ? !0 : [
    "false",
    "off",
    "disabled",
    "no",
    "inactive",
    "auto renew off",
    "automatic renewal off"
  ].includes(t) ? !1 : null : null;
}
function Lu(e) {
  const t = Du(e);
  return t === !0 ? "On" : t === !1 ? "Off" : F(e);
}
function Mt(e) {
  if (e instanceof Date && Number.isFinite(e.getTime()))
    return new Date(e.getTime());
  if (typeof e == "number") {
    const r = e > 1e12 || e > 1e10 ? e : e * 1e3, a = new Date(r);
    return Number.isFinite(a.getTime()) ? a : null;
  }
  const t = F(e);
  if (!t || /^-+$/.test(t))
    return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    const r = /* @__PURE__ */ new Date(`${t}T00:00:00`);
    return Number.isFinite(r.getTime()) ? r : null;
  }
  let n = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (n) {
    const r = n[3].length === 2 ? +`20${n[3]}` : Number(n[3]), a = Number(n[1]) - 1, o = Number(n[2]), c = new Date(r, a, o);
    return Number.isFinite(c.getTime()) ? c : null;
  }
  const i = t.replace(/\bat\b.*$/i, "").replace(/\s+\([^)]*\)\s*$/, "").trim(), s = new Date(i);
  return Number.isFinite(s.getTime()) ? s : null;
}
function bt(e) {
  if (!(e instanceof Date) || !Number.isFinite(e.getTime()))
    return "";
  const t = e.getFullYear(), n = String(e.getMonth() + 1).padStart(2, "0"), i = String(e.getDate()).padStart(2, "0");
  return `${t}-${n}-${i}`;
}
function Iu(e) {
  const t = String(e || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!t)
    return null;
  const n = new Date(Number(t[1]), Number(t[2]) - 1, Number(t[3]));
  return Number.isFinite(n.getTime()) ? n : null;
}
function Fi(e) {
  const t = Iu(e);
  return t ? new Intl.DateTimeFormat(B(), {
    dateStyle: "medium"
  }).format(t) : "";
}
function Ou(e) {
  if (typeof e == "number" && Number.isFinite(e))
    return new Intl.NumberFormat(B(), {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(e);
  const t = F(e);
  if (!t)
    return "";
  if (/[$€£]/.test(t))
    return t;
  const n = Number(t.replace(/[^0-9.-]+/g, ""));
  return Number.isFinite(n) ? new Intl.NumberFormat(B(), {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(n) : t;
}
function Xr() {
  return {
    memberSince: [],
    nextBilling: [],
    currentPlan: [],
    autoRenewal: [],
    membershipStatus: [],
    currentPrice: []
  };
}
function K(e, t, n) {
  !F(t) && typeof t != "number" && typeof t != "boolean" || e.push({
    score: n,
    value: t
  });
}
function Bu(e) {
  const t = String(e || "").toLowerCase();
  let n = 0;
  return t.includes("account") && (n += 2), t.includes("subscription") && (n += 5), t.includes("membership") && (n += 5), t.includes("billing") && (n += 6), t.includes("renew") && (n += 4), t.includes("plan") && (n += 3), t.includes("price") && (n += 2), n;
}
function ve(e, t, n = "", i = 0, s = /* @__PURE__ */ new WeakSet()) {
  !e || typeof e != "object" || i > 6 || s.has(e) || (s.add(e), Object.entries(e).forEach(([r, a]) => {
    const o = n ? `${n}.${r}` : r, c = r.toLowerCase(), u = Bu(o);
    if ((c === "member_since" || c.includes("member_since")) && Mt(a) && K(t.memberSince, a, u + 12), (c.includes("billing") || c.includes("renewal")) && !c.includes("auto") && Mt(a) && K(t.nextBilling, a, u + 11), c.includes("plan") && typeof a == "string" && F(a).length <= 80 && K(t.currentPlan, a, u + 8), (c.includes("auto_renew") || c.includes("autorenew") || c.includes("auto") && c.includes("renew")) && F(a) && K(t.autoRenewal, a, u + 10), c.includes("status") && typeof a == "string" && /active|inactive|expired|cancel|renew|trial/i.test(a) && K(t.membershipStatus, a, u + 8), c.includes("price") && (typeof a == "number" || typeof a == "string") && K(t.currentPrice, a, u + 5), Array.isArray(a)) {
      a.slice(0, 12).forEach((l, g) => {
        ve(l, t, `${o}[${g}]`, i + 1, s);
      });
      return;
    }
    a && typeof a == "object" && ve(a, t, o, i + 1, s);
  }));
}
function Ne(e, t = F) {
  if (!Array.isArray(e) || !e.length)
    return "";
  const n = [...e].sort((i, s) => s.score - i.score).find((i) => F(t(i.value)));
  return n ? t(n.value) : "";
}
function ju(e) {
  var t, n;
  try {
    const i = Object.getOwnPropertyNames(e);
    for (const s of i) {
      let r = null;
      try {
        r = e[s];
      } catch {
        continue;
      }
      if (!r || typeof r != "object" || typeof r.getState != "function")
        continue;
      const a = r.getState(), o = (n = (t = a == null ? void 0 : a.account) == null ? void 0 : t.accountInfo) == null ? void 0 : n.data;
      if (o && typeof o == "object")
        return o;
    }
  } catch {
    return null;
  }
  return null;
}
function Mu(e) {
  const t = Xr(), n = Array.from(e.querySelectorAll("*")), i = /* @__PURE__ */ new WeakSet();
  for (const s of n) {
    for (const r of Object.keys(s))
      if (r.startsWith("__reactProps$") && ve(s[r], t, r, 0, i), r.startsWith("__reactFiber$")) {
        let a = s[r], o = 0;
        for (; a && o <= 6; )
          ve(a.memoizedProps, t, `${r}.memoizedProps`, 0, i), ve(a.pendingProps, t, `${r}.pendingProps`, 0, i), ve(a.memoizedState, t, `${r}.memoizedState`, 0, i), a = a.return, o += 1;
      }
    if (t.memberSince.length && t.nextBilling.length)
      break;
  }
  return t;
}
function Zr(e, t) {
  const n = F(e).toLowerCase();
  return t.some((i) => {
    const s = F(i).toLowerCase();
    return n === s || n.startsWith(`${s}:`);
  });
}
function Wi(e) {
  return F(e).replace(/\bManage\b/gi, "").replace(/\bRenew Early\b/gi, "").replace(/\bUpdate Address\b/gi, "").replace(/\bOpen\b/gi, "").replace(/\bHere\b/gi, "").replace(/\s+/g, " ").trim();
}
function $u(e, t) {
  const n = [], i = e.closest("tr");
  if (i) {
    const a = Array.from(i.children).filter((o) => o !== e);
    n.push(...a);
  }
  e.nextElementSibling && n.push(e.nextElementSibling);
  let s = e.parentElement, r = 0;
  for (; s && r <= 3; ) {
    const a = Array.from(s.children).filter((o) => o !== e);
    n.push(...a), s.nextElementSibling && n.push(s.nextElementSibling), s = s.parentElement, r += 1;
  }
  for (const a of n) {
    const o = Wi((a == null ? void 0 : a.textContent) || "");
    if (!(!o || Zr(o, t)) && !t.some((c) => o.includes(c)))
      return o;
  }
  if (i) {
    let a = Wi(i.textContent || "");
    return t.forEach((o) => {
      a = F(a.replace(o, ""));
    }), a;
  }
  return "";
}
function Fu(e) {
  const t = {}, n = Array.from(
    e.querySelectorAll("td, th, div, span, p, strong, label, h1, h2, h3, h4")
  );
  return Object.entries(Tu).forEach(([i, s]) => {
    const r = n.find(
      (a) => Zr(a.textContent || "", s)
    );
    r && (t[i] = $u(r, s));
  }), t;
}
function Wu({ reduxData: e, reactBuckets: t, labelValues: n }) {
  const i = t || Xr();
  e && ve(e, i, "redux.accountInfo"), n != null && n.memberSince && K(i.memberSince, n.memberSince, 100), n != null && n.nextBilling && K(i.nextBilling, n.nextBilling, 100), n != null && n.currentPlan && K(i.currentPlan, n.currentPlan, 100), n != null && n.autoRenewal && K(i.autoRenewal, n.autoRenewal, 100), n != null && n.membershipStatus && K(i.membershipStatus, n.membershipStatus, 100), n != null && n.currentPrice && K(i.currentPrice, n.currentPrice, 100);
  const s = Mt(Ne(i.memberSince, (l) => l)), r = Mt(
    Ne(i.nextBilling, (l) => l)
  ), a = Ne(i.membershipStatus), o = Ne(i.currentPlan), c = Lu(Ne(i.autoRenewal, (l) => l)), u = Ou(Ne(i.currentPrice, (l) => l));
  return !s && !r && !a && !o && !c && !u ? null : {
    version: 1,
    source: "members-ng-account-info",
    syncedAt: (/* @__PURE__ */ new Date()).toISOString(),
    memberSinceDateKey: bt(s),
    memberSinceLabel: s ? Fi(bt(s)) : "",
    nextBillingDateKey: bt(r),
    nextBillingLabel: r ? Fi(bt(r)) : "",
    membershipStatus: a,
    currentPlan: o,
    autoRenewal: c,
    currentPrice: u
  };
}
function Hu(e) {
  var n;
  const t = F(((n = e == null ? void 0 : e.body) == null ? void 0 : n.innerText) || "");
  return t ? /member since|membro desde|miembro desde|mitglied seit/i.test(t) || /next billing date|current plan|auto renewal|membership status/i.test(t) : !1;
}
async function Uu() {
  const e = zu(Nu), t = Date.now();
  try {
    return await new Promise((n, i) => {
      const s = () => {
        e.remove();
      }, r = () => {
        try {
          const a = e.contentDocument, o = e.contentWindow;
          if (!a || !a.body) {
            if (Date.now() - t > 2e4) {
              s(), i(new Error("Timed out loading members-ng account info."));
              return;
            }
            window.setTimeout(r, 350);
            return;
          }
          if (!Hu(a) && Date.now() - t <= 2e4) {
            window.setTimeout(r, 350);
            return;
          }
          const c = ju(o), u = Mu(a), l = Fu(a), g = Wu({
            reduxData: c,
            reactBuckets: u,
            labelValues: l
          });
          if (!g) {
            s(), i(new Error("Members-ng account info did not expose renewal data."));
            return;
          }
          s(), n(g);
        } catch (a) {
          if (Date.now() - t > 2e4) {
            s(), i(a);
            return;
          }
          window.setTimeout(r, 350);
        }
      };
      e.addEventListener(
        "load",
        () => {
          window.setTimeout(r, 700);
        },
        { once: !0 }
      ), window.setTimeout(r, 1e3);
    });
  } finally {
    e.remove();
  }
}
async function Pu() {
  return {
    membershipSummary: (await Jr([Rn]))[Rn] || null
  };
}
async function Vu(e = {}) {
  const t = (e == null ? void 0 : e.persist) !== !1, n = await Uu();
  return t && await Yr({
    [Rn]: n
  }), n;
}
function Ku(e, t = 1e3 * 60 * 60) {
  if (!(e != null && e.syncedAt))
    return !1;
  const n = Date.parse(e.syncedAt);
  return Number.isFinite(n) ? Date.now() - n <= t : !1;
}
function Qu(e) {
  if (!e)
    return "";
  const t = new Date(e);
  return Number.isFinite(t.getTime()) ? new Intl.DateTimeFormat(B(), {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(t) : "";
}
const Gu = "/web/racing/home/dashboard", Ju = 1e3 * 60 * 5;
function Yu() {
  return new Intl.NumberFormat(B(), {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
let Nn = null, Tn = 0, Pe = null;
function zn(e) {
  return Math.round((Number(e) || 0) * 100) / 100;
}
function Hi(e) {
  return Yu().format(zn(e));
}
function oi(e) {
  const t = new Date(e);
  return Number.isFinite(t.getTime()) ? new Intl.DateTimeFormat(B(), {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(t) : "";
}
function cn(e) {
  const t = new Date(e);
  return Number.isFinite(t.getTime()) ? new Intl.DateTimeFormat(B(), {
    dateStyle: "medium"
  }).format(t) : "";
}
function ea(e) {
  const t = new Date(e);
  if (!Number.isFinite(t.getTime()))
    return "";
  const n = t.getTime() - Date.now(), i = Math.round(n / (1e3 * 60)), s = Math.abs(i), r = new Intl.RelativeTimeFormat(B(), {
    numeric: "auto"
  });
  if (s < 60)
    return r.format(i, "minute");
  const a = Math.round(i / 60);
  if (Math.abs(a) < 48)
    return r.format(a, "hour");
  const o = Math.round(a / 24);
  return r.format(o, "day");
}
function ln(e, t) {
  const n = new Date(
    e.getFullYear(),
    e.getMonth(),
    e.getDate()
  ).getTime(), i = new Date(
    t.getFullYear(),
    t.getMonth(),
    t.getDate()
  ).getTime();
  return Math.round((i - n) / (1e3 * 60 * 60 * 24));
}
function Ye(e) {
  if (!e && e !== 0)
    return null;
  const t = new Date(e);
  return Number.isFinite(t.getTime()) ? t : null;
}
async function un(e) {
  const t = typeof e == "string" && /^https?:\/\//i.test(e) ? e : `${location.origin}${e}`, n = !t.startsWith(location.origin), i = await fetch(t, {
    credentials: n ? "omit" : "include",
    headers: {
      accept: "application/json, text/plain, */*"
    }
  });
  if (!i.ok)
    throw new Error(`Request failed (${i.status}) for ${t}`);
  return i.json();
}
async function dn(e) {
  const t = await un(e);
  return t != null && t.link ? un(t.link) : t != null && t.data_url ? un(t.data_url) : t;
}
function Ui(e, t) {
  const n = e.getMonth(), i = new Date(t, n + 1, 0).getDate(), s = Math.min(e.getDate(), i);
  return new Date(t, n, s);
}
function Xu(e) {
  return (Array.isArray(e) ? e : []).map((n) => {
    const i = Number(n == null ? void 0 : n.weeks) || 0, s = Number(n == null ? void 0 : n.min_weeks) || 0, r = Math.max(0, s - i);
    return {
      seriesId: n == null ? void 0 : n.series_id,
      seasonId: n == null ? void 0 : n.season_id,
      seriesName: (n == null ? void 0 : n.series_name) || "Unnamed series",
      weeksDone: i,
      minWeeks: s,
      remainingWeeks: r,
      earnedCredits: zn(n == null ? void 0 : n.earned_credits),
      totalCredits: zn(n == null ? void 0 : n.total_credits)
    };
  }).sort((n, i) => n.remainingWeeks !== i.remainingWeeks ? n.remainingWeeks - i.remainingWeeks : i.earnedCredits - n.earnedCredits);
}
function Zu(e, t) {
  const n = Array.isArray(e) ? e : [], i = n.filter((a) => (a == null ? void 0 : a.viewed) === !1), s = [...n].sort((a, o) => {
    var l, g;
    const c = ((l = Ye(a == null ? void 0 : a.award_date)) == null ? void 0 : l.getTime()) || 0;
    return (((g = Ye(o == null ? void 0 : o.award_date)) == null ? void 0 : g.getTime()) || 0) - c;
  }).slice(0, 6).map((a) => ({
    awardId: a == null ? void 0 : a.award_id,
    title: (a == null ? void 0 : a.name) || (a == null ? void 0 : a.achievement) || "Award",
    date: a == null ? void 0 : a.award_date,
    groupName: (a == null ? void 0 : a.group_name) || "",
    hasPdf: (a == null ? void 0 : a.has_pdf) === !0,
    viewed: (a == null ? void 0 : a.viewed) === !0
  })), r = Array.isArray(t == null ? void 0 : t.recent_awards) ? t.recent_awards.slice(0, 4).map((a) => ({
    awardId: a == null ? void 0 : a.award_id,
    title: (a == null ? void 0 : a.name) || (a == null ? void 0 : a.achievement) || "Award",
    date: a == null ? void 0 : a.award_date,
    groupName: (a == null ? void 0 : a.group_name) || "",
    hasPdf: (a == null ? void 0 : a.has_pdf) === !0,
    viewed: (a == null ? void 0 : a.viewed) === !0
  })) : [];
  return {
    total: n.length,
    unseen: i.length,
    recent: s.length ? s : r
  };
}
function ed(e, t, n) {
  var c, u;
  const i = /* @__PURE__ */ new Date(), s = Ye(
    (e == null ? void 0 : e.memberSinceDateKey) || (t == null ? void 0 : t.member_since) || ((c = n == null ? void 0 : n.member_info) == null ? void 0 : c.member_since)
  ), r = Ye(e == null ? void 0 : e.nextBillingDateKey), a = Ye(
    (t == null ? void 0 : t.last_login) || ((u = n == null ? void 0 : n.member_info) == null ? void 0 : u.last_login)
  );
  let o = {
    message: "Member anniversary unavailable",
    detail: "Member since date was not exposed.",
    daysRemaining: null,
    isToday: !1
  };
  if (s) {
    const l = Ui(s, i.getFullYear()), g = ln(i, l) >= 0 ? l : Ui(s, i.getFullYear() + 1), f = ln(i, g), d = Math.max(
      0,
      g.getFullYear() - s.getFullYear() - (f === 0 ? 0 : 1)
    );
    o = f === 0 ? {
      message: "Happy member anniversary",
      detail: `${d + 1} years with iRacing today.`,
      daysRemaining: 0,
      isToday: !0
    } : {
      message: `${f} days to your member anniversary`,
      detail: `${d + 1} years lands on ${cn(
        g
      )}.`,
      daysRemaining: f,
      isToday: !1
    };
  }
  return {
    currentPlan: (e == null ? void 0 : e.currentPlan) || "",
    currentPrice: (e == null ? void 0 : e.currentPrice) || "",
    autoRenewal: (e == null ? void 0 : e.autoRenewal) || "",
    membershipStatus: (e == null ? void 0 : e.membershipStatus) || "",
    nextBillingDate: r ? cn(r) : "",
    nextBillingDays: r instanceof Date ? ln(i, r) : null,
    lastLogin: a ? oi(a) : "",
    lastLoginRelative: a ? ea(a) : "",
    memberSince: s ? cn(s) : "",
    syncedAt: Qu(e == null ? void 0 : e.syncedAt),
    anniversary: o
  };
}
function td(e) {
  var n;
  return (Array.isArray((n = e == null ? void 0 : e.member_info) == null ? void 0 : n.licenses) ? e.member_info.licenses : []).map((i) => ({
    category: (i == null ? void 0 : i.category_name) || (i == null ? void 0 : i.category) || "Category",
    licenseLevel: (i == null ? void 0 : i.license_level) || "",
    safetyRating: Number(i == null ? void 0 : i.safety_rating) || 0,
    irating: Number(i == null ? void 0 : i.irating) || 0,
    cpi: Number(i == null ? void 0 : i.cpi) || 0,
    color: (i == null ? void 0 : i.color) || ""
  })).sort((i, s) => s.irating - i.irating);
}
function nd(e) {
  return (Array.isArray(e == null ? void 0 : e.recent_events) ? e.recent_events : []).slice(0, 6).map((n) => {
    var i, s;
    return {
      title: (n == null ? void 0 : n.event_name) || "Recent event",
      sessionType: (n == null ? void 0 : n.simsession_type) || (n == null ? void 0 : n.event_type) || "",
      startTime: n == null ? void 0 : n.start_time,
      result: Number(n == null ? void 0 : n.finish_position) > 0 ? `P${n.finish_position}` : Number(n == null ? void 0 : n.starting_position) > 0 ? `Started P${n.starting_position}` : "",
      carName: (n == null ? void 0 : n.car_name) || "",
      trackName: [(i = n == null ? void 0 : n.track) == null ? void 0 : i.track_name, (s = n == null ? void 0 : n.track) == null ? void 0 : s.config_name].filter(Boolean).join(" - ")
    };
  });
}
function id(e) {
  const t = /* @__PURE__ */ new Date(), n = e.filter((i) => i && i.error).map((i) => `${i.label}: ${i.error.message || i.error}`);
  return {
    generatedAt: t.toISOString(),
    generatedLabel: oi(t),
    partial: n.length > 0,
    errors: n
  };
}
function sd() {
  return !!Nn && Tn > 0 && Date.now() - Tn <= Ju;
}
async function rd(e = !1) {
  if (!e && sd())
    return Nn;
  if (!e && Pe)
    return Pe;
  Pe = (async () => {
    var d, h, w, z, ge, ae, oe;
    const [t, n, i, s] = await Promise.allSettled([
      dn("/bff/pub/proxy/data/member/profile"),
      dn("/bff/pub/proxy/data/member/participation_credits"),
      dn("/bff/pub/proxy/data/member/awards"),
      Pu()
    ]);
    let r = s.status === "fulfilled" && ((d = s.value) == null ? void 0 : d.membershipSummary) || null;
    if (!r || !Ku(r, 1e3 * 60 * 60 * 6))
      try {
        r = await Vu({ persist: !1 });
      } catch {
      }
    const a = t.status === "fulfilled" ? t.value : {}, o = n.status === "fulfilled" ? n.value : [], c = i.status === "fulfilled" ? i.value : [], u = Xu(o), l = Zu(c, a), g = ed(
      r,
      (a == null ? void 0 : a.member_info) || {},
      a
    ), f = {
      meta: id([
        {
          label: "Profile",
          error: t.status === "rejected" ? t.reason : null
        },
        {
          label: "Awards",
          error: i.status === "rejected" ? i.reason : null
        },
        {
          label: "Participation credits",
          error: n.status === "rejected" ? n.reason : null
        }
      ]),
      progress: {
        membership: g,
        activity: {
          recent30DaysCount: Number((h = a == null ? void 0 : a.activity) == null ? void 0 : h.recent_30days_count) || 0,
          previous30DaysCount: Number((w = a == null ? void 0 : a.activity) == null ? void 0 : w.prev_30days_count) || 0,
          consecutiveWeeks: Number((z = a == null ? void 0 : a.activity) == null ? void 0 : z.consecutive_weeks) || 0,
          bestConsecutiveWeeks: Number((ge = a == null ? void 0 : a.activity) == null ? void 0 : ge.most_consecutive_weeks) || 0,
          followers: Number((ae = a == null ? void 0 : a.follow_counts) == null ? void 0 : ae.followers) || 0,
          follows: Number((oe = a == null ? void 0 : a.follow_counts) == null ? void 0 : oe.follows) || 0
        },
        licenses: td(a),
        participationCredits: u,
        awards: l,
        recentEvents: nd(a)
      }
    };
    return Nn = f, Tn = Date.now(), f;
  })();
  try {
    return await Pe;
  } finally {
    Pe = null;
  }
}
const pn = {
  "en-US": {
    "common.expand": "Expand",
    "common.compact": "Compact",
    "common.refresh": "Refresh",
    "common.refreshing": "Refreshing...",
    "common.reveal": "Reveal",
    "common.hide": "Hide",
    "common.hidden": "Hidden",
    "common.sync_required": "Sync Required",
    "common.open_order_history": "Open Order History",
    "intelligence.title": "Intelligence Center",
    "intelligence.subtitle": "Member progress, awards, credits and recent activity from members-ng.",
    "intelligence.loading_snapshot": "Loading intelligence snapshot...",
    "intelligence.no_data_loaded": "No data loaded yet.",
    "intelligence.no_data_returned": "No data returned on this refresh.",
    "intelligence.last_refresh": "Last refresh {time}",
    "intelligence.member_anniversary": "Member anniversary",
    "intelligence.today": "Today",
    "intelligence.unavailable": "Unavailable",
    "intelligence.days_remaining": "{count} days",
    "intelligence.activity_30d": "30 day activity",
    "intelligence.active_days": "{count} active days",
    "intelligence.delta_more": "+{count} vs previous 30 days",
    "intelligence.delta_less": "{count} vs previous 30 days",
    "intelligence.delta_none": "No change vs previous 30 days",
    "intelligence.streak": "Streak",
    "intelligence.best_weeks": "Best {count} weeks",
    "intelligence.member_since": "Member since",
    "intelligence.last_login": "Last login {time}",
    "intelligence.last_login_unavailable": "Last login unavailable",
    "intelligence.license_snapshot": "License snapshot",
    "intelligence.participation_credits": "Participation credits",
    "intelligence.recent_awards": "Recent awards",
    "intelligence.recent_events": "Recent events",
    "intelligence.weeks_progress": "{done}/{minimum} weeks • {earned} of {total}",
    "intelligence.weeks_left.one": "{count} week left",
    "intelligence.weeks_left.other": "{count} weeks left",
    "intelligence.award_fallback": "Award",
    "intelligence.new": "New",
    "intelligence.event_fallback": "Event",
    "intelligence.load_error": "Could not load the members-ng intelligence snapshot.",
    "purchase.title": "Budget Snapshot",
    "purchase.sync_continue_title": "Sync Order History to continue.",
    "purchase.sync_note_waiting": "Waiting for the Order History tab to finish the sync. This widget refreshes automatically.",
    "purchase.sync_note_after": "After the sync finishes, this widget refreshes automatically.",
    "purchase.last_30_days": "Last 30 Days",
    "purchase.recent_spend_default": "Net spend from synced Order History.",
    "purchase.content_spend": "Content Spend",
    "purchase.content_spend_default": "Estimating from current catalog.",
    "purchase.content_pending": "Content Pending",
    "purchase.pending_default": "Current catalog value of unowned cars and tracks.",
    "purchase.rotating_curiosities": "Rotating Curiosities",
    "purchase.click_reveal_recent": "Private by default. Click this card or Reveal to show the 30-day amount.",
    "purchase.wait_sync_recent": "Waiting for Order History sync to finish for this dashboard tab.",
    "purchase.open_sync_recent": "Open Order History to sync the real 30-day amount for this dashboard tab.",
    "purchase.orders_last_30.one": "{count} order in the last 30 days. Order History synced {time}.",
    "purchase.orders_last_30.other": "{count} orders in the last 30 days. Order History synced {time}.",
    "purchase.loading_history": "Loading synced Order History data...",
    "purchase.open_sync_real_recent": "Open Order History by clicking here to sync real recent spend.",
    "purchase.click_reveal_amount": "Click this card or Reveal to show the amount.",
    "purchase.sync_required_content_spend": "Order History sync is required before Content Spend can be shown here.",
    "purchase.order_history_synced": "Order History synced {time}.",
    "purchase.estimated_owned_catalog_synced": "Estimated from owned catalog value. Catalog synced {time}.",
    "purchase.estimating_catalog": "Estimating from current catalog...",
    "purchase.waiting_catalog_sync": "Waiting for catalog sync.",
    "purchase.sync_unlocks_pending": "Order History sync unlocks the pending content estimate for this tab.",
    "purchase.catalog_synced": "Catalog synced {time}.",
    "purchase.refreshing_catalog_values": "Refreshing current catalog values...",
    "purchase.current_unowned_value": "Current catalog value of unowned cars and tracks.",
    "purchase.curiosities_hidden": "Curiosities are hidden until you reveal the financial widget.",
    "purchase.curiosities_unlock_after_sync": "Curiosities unlock after the Order History sync finishes for this dashboard tab.",
    "purchase.waiting_budget_compare": "Waiting for enough data to compare your content budget with real-world racing costs.",
    "purchase.refreshing_catalog": "Refreshing current catalog...",
    "purchase.compact_mode": "Compact mode shows your last 30 days. Expand for total content value and pending content.",
    "purchase.content_spend_explainer_actual": "<strong>Content Spend</strong> is using Order History net content spend after gifts and auto credits.",
    "purchase.content_spend_explainer_estimated": "<strong>Content Spend</strong> is estimated from the current catalog value of your owned cars and tracks.",
    "purchase.open_history_paid_amount": 'For the paid amount instead of the estimate, open Order History by clicking <button type="button" id="iref-dashboard-purchase-status-history" class="iref-dashboard-purchase-summary-link-inline">here</button>.',
    "purchase.load_saved_spend_error": "Could not load saved spend data.",
    "purchase.refresh_pending_error": "Could not refresh the pending content total on this page.",
    "curiosity.spread_intro_owned": "The lead your owned catalog value has over the missing catalog",
    "curiosity.spread_intro_missing": "The missing catalog still outweighs your owned catalog value by",
    "curiosity.reference_fact": "{intro} covers about {ratio} {label}, {detail}.",
    "curiosity.completion_progress": "At current catalog prices, your owned content represents about {percent} of the full car-and-track catalog value you are tracking here.",
    "curiosity.remaining_progress": "At current catalog prices, the missing side still makes up about {percent} of the catalog value you are comparing against.",
    "curiosity.balance_ratio": "Your owned content value is {ratio}x the value still missing from the current catalog.",
    "curiosity.closing_gap": "At the current catalog prices, finishing the missing content would add about {ratio}x on top of what the owned content is worth today.",
    "curiosity.total_track_nights": "Owned plus missing content together would be about {ratio} SCCA Track Night entries at a weekday lapping-night budget.",
    "curiosity.total_hotel_nights": "Owned plus missing content together is roughly {ratio} trackside hotel nights at a race-weekend rate.",
    "curiosity.spend_coaching": "Your current spend estimate would cover about {ratio} months of telemetry coaching.",
    "curiosity.spend_slicks": "Your current spend estimate is about {ratio} full sets of GT3 slicks.",
    "curiosity.pending_fuel": "The current gap to buy everything is about {ratio} drums of race fuel.",
    "curiosity.pending_weekends": "The current gap to the full catalog is roughly {ratio} regional club-race entries.",
    "curiosity.upgrade_gap": "The current gap to a full catalog is about {ratio} aluminum sim cockpits.",
    "reference.track-night.singular": "SCCA Track Night entry",
    "reference.track-night.plural": "SCCA Track Night entries",
    "reference.track-night.detail": "using a weekday club-level lapping-night estimate",
    "reference.hotel-night.singular": "trackside hotel night",
    "reference.hotel-night.plural": "trackside hotel nights",
    "reference.hotel-night.detail": "using a race-weekend hotel estimate",
    "reference.telemetry-month.singular": "month of telemetry coaching",
    "reference.telemetry-month.plural": "months of telemetry coaching",
    "reference.telemetry-month.detail": "using a typical sim-racing data and coaching package",
    "reference.slick-set.singular": "full set of GT3 slicks",
    "reference.slick-set.plural": "full sets of GT3 slicks",
    "reference.slick-set.detail": "using four current pro-level slicks",
    "reference.fuel-drum.singular": "drum of race fuel",
    "reference.fuel-drum.plural": "drums of race fuel",
    "reference.fuel-drum.detail": "using a rounded motorsport fuel estimate",
    "reference.club-race.singular": "regional club-race entry",
    "reference.club-race.plural": "regional club-race entries",
    "reference.club-race.detail": "using a modest single-weekend amateur racing budget",
    "reference.sim-cockpit.singular": "aluminum sim cockpit",
    "reference.sim-cockpit.plural": "aluminum sim cockpits",
    "reference.sim-cockpit.detail": "using a solid 8020-style cockpit estimate"
  },
  "pt-BR": {
    "common.expand": "Expandir",
    "common.compact": "Compacto",
    "common.refresh": "Atualizar",
    "common.refreshing": "Atualizando...",
    "common.reveal": "Revelar",
    "common.hide": "Ocultar",
    "common.hidden": "Oculto",
    "common.sync_required": "Sincronização necessária",
    "common.open_order_history": "Abrir histórico de pedidos",
    "intelligence.title": "Central de Inteligência",
    "intelligence.subtitle": "Progresso do membro, premiações, créditos e atividade recente do members-ng.",
    "intelligence.loading_snapshot": "Carregando snapshot de inteligência...",
    "intelligence.no_data_loaded": "Nenhum dado carregado ainda.",
    "intelligence.no_data_returned": "Nenhum dado foi retornado nesta atualização.",
    "intelligence.last_refresh": "Última atualização {time}",
    "intelligence.member_anniversary": "Aniversário de membro",
    "intelligence.today": "Hoje",
    "intelligence.unavailable": "Indisponível",
    "intelligence.days_remaining": "{count} dias",
    "intelligence.activity_30d": "Atividade em 30 dias",
    "intelligence.active_days": "{count} dias ativos",
    "intelligence.delta_more": "+{count} vs 30 dias anteriores",
    "intelligence.delta_less": "{count} vs 30 dias anteriores",
    "intelligence.delta_none": "Sem mudança vs 30 dias anteriores",
    "intelligence.streak": "Sequência",
    "intelligence.best_weeks": "Melhor {count} semanas",
    "intelligence.member_since": "Membro desde",
    "intelligence.last_login": "Último login {time}",
    "intelligence.last_login_unavailable": "Último login indisponível",
    "intelligence.license_snapshot": "Resumo de licenças",
    "intelligence.participation_credits": "Créditos de participação",
    "intelligence.recent_awards": "Premiações recentes",
    "intelligence.recent_events": "Eventos recentes",
    "intelligence.weeks_progress": "{done}/{minimum} semanas • {earned} de {total}",
    "intelligence.weeks_left.one": "{count} semana restante",
    "intelligence.weeks_left.other": "{count} semanas restantes",
    "intelligence.award_fallback": "Premiação",
    "intelligence.new": "Novo",
    "intelligence.event_fallback": "Evento",
    "intelligence.load_error": "Não foi possível carregar o snapshot de inteligência do members-ng.",
    "purchase.title": "Resumo de orçamento",
    "purchase.sync_continue_title": "Sincronize o histórico de pedidos para continuar.",
    "purchase.sync_note_waiting": "Aguardando a aba de histórico de pedidos concluir a sincronização. Este widget atualiza automaticamente.",
    "purchase.sync_note_after": "Depois que a sincronização terminar, este widget atualiza automaticamente.",
    "purchase.last_30_days": "Últimos 30 dias",
    "purchase.recent_spend_default": "Gasto líquido do histórico de pedidos sincronizado.",
    "purchase.content_spend": "Gasto com conteúdo",
    "purchase.content_spend_default": "Estimando pelo catálogo atual.",
    "purchase.content_pending": "Conteúdo pendente",
    "purchase.pending_default": "Valor atual do catálogo de carros e pistas que você não possui.",
    "purchase.rotating_curiosities": "Curiosidades rotativas",
    "purchase.click_reveal_recent": "Privado por padrão. Clique neste card ou em Revelar para mostrar o valor de 30 dias.",
    "purchase.wait_sync_recent": "Aguardando a sincronização do histórico de pedidos terminar para esta aba do dashboard.",
    "purchase.open_sync_recent": "Abra o histórico de pedidos para sincronizar o valor real dos últimos 30 dias nesta aba do dashboard.",
    "purchase.orders_last_30.one": "{count} pedido nos últimos 30 dias. Histórico de pedidos sincronizado {time}.",
    "purchase.orders_last_30.other": "{count} pedidos nos últimos 30 dias. Histórico de pedidos sincronizado {time}.",
    "purchase.loading_history": "Carregando dados sincronizados do histórico de pedidos...",
    "purchase.open_sync_real_recent": "Abra o histórico de pedidos clicando aqui para sincronizar o gasto recente real.",
    "purchase.click_reveal_amount": "Clique neste card ou em Revelar para mostrar o valor.",
    "purchase.sync_required_content_spend": "A sincronização do histórico de pedidos é necessária antes de mostrar o gasto com conteúdo aqui.",
    "purchase.order_history_synced": "Histórico de pedidos sincronizado {time}.",
    "purchase.estimated_owned_catalog_synced": "Estimado pelo valor do catálogo possuído. Catálogo sincronizado {time}.",
    "purchase.estimating_catalog": "Estimando pelo catálogo atual...",
    "purchase.waiting_catalog_sync": "Aguardando sincronização do catálogo.",
    "purchase.sync_unlocks_pending": "A sincronização do histórico de pedidos libera a estimativa de conteúdo pendente nesta aba.",
    "purchase.catalog_synced": "Catálogo sincronizado {time}.",
    "purchase.refreshing_catalog_values": "Atualizando valores atuais do catálogo...",
    "purchase.current_unowned_value": "Valor atual do catálogo de carros e pistas não possuídos.",
    "purchase.curiosities_hidden": "As curiosidades ficam ocultas até você revelar o widget financeiro.",
    "purchase.curiosities_unlock_after_sync": "As curiosidades são liberadas depois que a sincronização do histórico de pedidos terminar nesta aba do dashboard.",
    "purchase.waiting_budget_compare": "Aguardando dados suficientes para comparar seu orçamento de conteúdo com custos do automobilismo real.",
    "purchase.refreshing_catalog": "Atualizando catálogo atual...",
    "purchase.compact_mode": "O modo compacto mostra seus últimos 30 dias. Expanda para ver o valor total do conteúdo e o conteúdo pendente.",
    "purchase.content_spend_explainer_actual": "<strong>Gasto com conteúdo</strong> usa o gasto líquido do histórico de pedidos com conteúdo, após presentes e créditos automáticos.",
    "purchase.content_spend_explainer_estimated": "<strong>Gasto com conteúdo</strong> é estimado pelo valor atual do catálogo dos seus carros e pistas possuídos.",
    "purchase.open_history_paid_amount": 'Para ver o valor pago em vez da estimativa, abra o histórico de pedidos clicando <button type="button" id="iref-dashboard-purchase-status-history" class="iref-dashboard-purchase-summary-link-inline">aqui</button>.',
    "purchase.load_saved_spend_error": "Não foi possível carregar os dados salvos de gastos.",
    "purchase.refresh_pending_error": "Não foi possível atualizar o total de conteúdo pendente nesta página.",
    "curiosity.spread_intro_owned": "A vantagem do valor do seu catálogo possuído sobre o catálogo faltante",
    "curiosity.spread_intro_missing": "O catálogo faltante ainda supera o valor do seu catálogo possuído em",
    "curiosity.reference_fact": "{intro} cobre cerca de {ratio} {label}, {detail}.",
    "curiosity.completion_progress": "Nos preços atuais do catálogo, seu conteúdo possuído representa cerca de {percent} do valor total de carros e pistas que você acompanha aqui.",
    "curiosity.remaining_progress": "Nos preços atuais do catálogo, o lado faltante ainda representa cerca de {percent} do valor do catálogo que você está comparando.",
    "curiosity.balance_ratio": "O valor do seu conteúdo possuído é {ratio}x o valor que ainda falta no catálogo atual.",
    "curiosity.closing_gap": "Nos preços atuais do catálogo, completar o conteúdo faltante adicionaria cerca de {ratio}x em cima do que o conteúdo possuído vale hoje.",
    "curiosity.total_track_nights": "Conteúdo possuído e faltante juntos equivalem a cerca de {ratio} inscrições no SCCA Track Night em um orçamento de weekday lapping-night.",
    "curiosity.total_hotel_nights": "Conteúdo possuído e faltante juntos equivalem a cerca de {ratio} noites de hotel perto da pista em ritmo de fim de semana de corrida.",
    "curiosity.spend_coaching": "Sua estimativa atual de gasto cobriria cerca de {ratio} meses de coaching de telemetria.",
    "curiosity.spend_slicks": "Sua estimativa atual de gasto equivale a cerca de {ratio} jogos completos de pneus slicks GT3.",
    "curiosity.pending_fuel": "A diferença atual para comprar tudo equivale a cerca de {ratio} tambores de combustível de corrida.",
    "curiosity.pending_weekends": "A diferença atual para o catálogo completo equivale a cerca de {ratio} inscrições regionais de corrida de clube.",
    "curiosity.upgrade_gap": "A diferença atual até um catálogo completo equivale a cerca de {ratio} cockpits de simulador em alumínio.",
    "reference.track-night.singular": "inscrição do SCCA Track Night",
    "reference.track-night.plural": "inscrições do SCCA Track Night",
    "reference.track-night.detail": "usando uma estimativa de weekday lapping-night em nível de clube",
    "reference.hotel-night.singular": "noite de hotel perto da pista",
    "reference.hotel-night.plural": "noites de hotel perto da pista",
    "reference.hotel-night.detail": "usando uma estimativa de hotel para fim de semana de corrida",
    "reference.telemetry-month.singular": "mês de coaching de telemetria",
    "reference.telemetry-month.plural": "meses de coaching de telemetria",
    "reference.telemetry-month.detail": "usando um pacote típico de dados e coaching de sim racing",
    "reference.slick-set.singular": "jogo completo de pneus slicks GT3",
    "reference.slick-set.plural": "jogos completos de pneus slicks GT3",
    "reference.slick-set.detail": "usando quatro slicks atuais de nível profissional",
    "reference.fuel-drum.singular": "tambor de combustível de corrida",
    "reference.fuel-drum.plural": "tambores de combustível de corrida",
    "reference.fuel-drum.detail": "usando uma estimativa arredondada de combustível de motorsport",
    "reference.club-race.singular": "inscrição regional de corrida de clube",
    "reference.club-race.plural": "inscrições regionais de corrida de clube",
    "reference.club-race.detail": "usando um orçamento modesto de corrida amadora para um fim de semana",
    "reference.sim-cockpit.singular": "cockpit de simulador em alumínio",
    "reference.sim-cockpit.plural": "cockpits de simulador em alumínio",
    "reference.sim-cockpit.detail": "usando uma estimativa sólida de cockpit estilo 8020"
  },
  "pt-PT": {
    "common.expand": "Expandir",
    "common.compact": "Compacto",
    "common.refresh": "Atualizar",
    "common.refreshing": "A atualizar...",
    "common.reveal": "Revelar",
    "common.hide": "Ocultar",
    "common.hidden": "Oculto",
    "common.sync_required": "Sincronização necessária",
    "common.open_order_history": "Abrir histórico de encomendas",
    "intelligence.title": "Centro de Inteligência",
    "intelligence.subtitle": "Progresso do membro, prémios, créditos e atividade recente do members-ng.",
    "intelligence.loading_snapshot": "A carregar snapshot de inteligência...",
    "intelligence.no_data_loaded": "Ainda não há dados carregados.",
    "intelligence.no_data_returned": "Nenhum dado foi devolvido nesta atualização.",
    "intelligence.last_refresh": "Última atualização {time}",
    "intelligence.member_anniversary": "Aniversário de membro",
    "intelligence.today": "Hoje",
    "intelligence.unavailable": "Indisponível",
    "intelligence.days_remaining": "{count} dias",
    "intelligence.activity_30d": "Atividade em 30 dias",
    "intelligence.active_days": "{count} dias ativos",
    "intelligence.delta_more": "+{count} vs 30 dias anteriores",
    "intelligence.delta_less": "{count} vs 30 dias anteriores",
    "intelligence.delta_none": "Sem alteração vs 30 dias anteriores",
    "intelligence.streak": "Sequência",
    "intelligence.best_weeks": "Melhor {count} semanas",
    "intelligence.member_since": "Membro desde",
    "intelligence.last_login": "Último login {time}",
    "intelligence.last_login_unavailable": "Último login indisponível",
    "intelligence.license_snapshot": "Resumo de licenças",
    "intelligence.participation_credits": "Créditos de participação",
    "intelligence.recent_awards": "Prémios recentes",
    "intelligence.recent_events": "Eventos recentes",
    "intelligence.weeks_progress": "{done}/{minimum} semanas • {earned} de {total}",
    "intelligence.weeks_left.one": "{count} semana restante",
    "intelligence.weeks_left.other": "{count} semanas restantes",
    "intelligence.award_fallback": "Prémio",
    "intelligence.new": "Novo",
    "intelligence.event_fallback": "Evento",
    "intelligence.load_error": "Não foi possível carregar o snapshot de inteligência do members-ng.",
    "purchase.title": "Resumo de orçamento",
    "purchase.sync_continue_title": "Sincroniza o histórico de encomendas para continuar.",
    "purchase.sync_note_waiting": "À espera que o separador do histórico de encomendas termine a sincronização. Este widget atualiza automaticamente.",
    "purchase.sync_note_after": "Depois de a sincronização terminar, este widget atualiza automaticamente.",
    "purchase.last_30_days": "Últimos 30 dias",
    "purchase.recent_spend_default": "Despesa líquida do histórico de encomendas sincronizado.",
    "purchase.content_spend": "Despesa com conteúdo",
    "purchase.content_spend_default": "A estimar a partir do catálogo atual.",
    "purchase.content_pending": "Conteúdo pendente",
    "purchase.pending_default": "Valor atual do catálogo de carros e pistas que ainda não tens.",
    "purchase.rotating_curiosities": "Curiosidades rotativas",
    "purchase.click_reveal_recent": "Privado por predefinição. Clica neste cartão ou em Revelar para mostrar o valor de 30 dias.",
    "purchase.wait_sync_recent": "À espera que a sincronização do histórico de encomendas termine para este separador do dashboard.",
    "purchase.open_sync_recent": "Abre o histórico de encomendas para sincronizar o valor real dos últimos 30 dias neste separador do dashboard.",
    "purchase.orders_last_30.one": "{count} encomenda nos últimos 30 dias. Histórico de encomendas sincronizado {time}.",
    "purchase.orders_last_30.other": "{count} encomendas nos últimos 30 dias. Histórico de encomendas sincronizado {time}.",
    "purchase.loading_history": "A carregar dados sincronizados do histórico de encomendas...",
    "purchase.open_sync_real_recent": "Abre o histórico de encomendas clicando aqui para sincronizar a despesa recente real.",
    "purchase.click_reveal_amount": "Clica neste cartão ou em Revelar para mostrar o valor.",
    "purchase.sync_required_content_spend": "A sincronização do histórico de encomendas é necessária antes de mostrar aqui a despesa com conteúdo.",
    "purchase.order_history_synced": "Histórico de encomendas sincronizado {time}.",
    "purchase.estimated_owned_catalog_synced": "Estimado a partir do valor do catálogo possuído. Catálogo sincronizado {time}.",
    "purchase.estimating_catalog": "A estimar a partir do catálogo atual...",
    "purchase.waiting_catalog_sync": "À espera da sincronização do catálogo.",
    "purchase.sync_unlocks_pending": "A sincronização do histórico de encomendas desbloqueia a estimativa de conteúdo pendente neste separador.",
    "purchase.catalog_synced": "Catálogo sincronizado {time}.",
    "purchase.refreshing_catalog_values": "A atualizar valores atuais do catálogo...",
    "purchase.current_unowned_value": "Valor atual do catálogo de carros e pistas não possuídos.",
    "purchase.curiosities_hidden": "As curiosidades ficam ocultas até revelares o widget financeiro.",
    "purchase.curiosities_unlock_after_sync": "As curiosidades ficam disponíveis depois de a sincronização do histórico de encomendas terminar neste separador do dashboard.",
    "purchase.waiting_budget_compare": "À espera de dados suficientes para comparar o teu orçamento de conteúdo com custos do automobilismo real.",
    "purchase.refreshing_catalog": "A atualizar catálogo atual...",
    "purchase.compact_mode": "O modo compacto mostra os teus últimos 30 dias. Expande para ver o valor total do conteúdo e o conteúdo pendente.",
    "purchase.content_spend_explainer_actual": "<strong>Despesa com conteúdo</strong> usa a despesa líquida de conteúdo do histórico de encomendas depois de presentes e créditos automáticos.",
    "purchase.content_spend_explainer_estimated": "<strong>Despesa com conteúdo</strong> é estimada a partir do valor atual do catálogo dos teus carros e pistas possuídos.",
    "purchase.open_history_paid_amount": 'Para ver o valor pago em vez da estimativa, abre o histórico de encomendas clicando <button type="button" id="iref-dashboard-purchase-status-history" class="iref-dashboard-purchase-summary-link-inline">aqui</button>.',
    "purchase.load_saved_spend_error": "Não foi possível carregar os dados guardados de despesas.",
    "purchase.refresh_pending_error": "Não foi possível atualizar o total de conteúdo pendente nesta página.",
    "curiosity.spread_intro_owned": "A vantagem do valor do teu catálogo possuído sobre o catálogo em falta",
    "curiosity.spread_intro_missing": "O catálogo em falta ainda supera o valor do teu catálogo possuído em",
    "curiosity.reference_fact": "{intro} cobre cerca de {ratio} {label}, {detail}.",
    "curiosity.completion_progress": "A preços atuais de catálogo, o teu conteúdo possuído representa cerca de {percent} do valor total de carros e pistas que estás a acompanhar aqui.",
    "curiosity.remaining_progress": "A preços atuais de catálogo, o lado em falta ainda representa cerca de {percent} do valor de catálogo que estás a comparar.",
    "curiosity.balance_ratio": "O valor do teu conteúdo possuído é {ratio}x o valor que ainda falta no catálogo atual.",
    "curiosity.closing_gap": "A preços atuais de catálogo, concluir o conteúdo em falta acrescentaria cerca de {ratio}x ao que o conteúdo possuído vale hoje.",
    "curiosity.total_track_nights": "Conteúdo possuído e em falta juntos equivalem a cerca de {ratio} inscrições no SCCA Track Night num orçamento de weekday lapping-night.",
    "curiosity.total_hotel_nights": "Conteúdo possuído e em falta juntos equivalem a cerca de {ratio} noites de hotel junto à pista a ritmo de fim de semana de corrida.",
    "curiosity.spend_coaching": "A tua estimativa atual de despesa cobriria cerca de {ratio} meses de coaching de telemetria.",
    "curiosity.spend_slicks": "A tua estimativa atual de despesa equivale a cerca de {ratio} jogos completos de pneus slicks GT3.",
    "curiosity.pending_fuel": "A diferença atual para comprar tudo equivale a cerca de {ratio} tambores de combustível de corrida.",
    "curiosity.pending_weekends": "A diferença atual para o catálogo completo equivale a cerca de {ratio} inscrições regionais de corrida de clube.",
    "curiosity.upgrade_gap": "A diferença atual até um catálogo completo equivale a cerca de {ratio} cockpits de simulador em alumínio.",
    "reference.track-night.singular": "inscrição no SCCA Track Night",
    "reference.track-night.plural": "inscrições no SCCA Track Night",
    "reference.track-night.detail": "usando uma estimativa weekday lapping-night de nível de clube",
    "reference.hotel-night.singular": "noite de hotel junto à pista",
    "reference.hotel-night.plural": "noites de hotel junto à pista",
    "reference.hotel-night.detail": "usando uma estimativa de hotel para fim de semana de corrida",
    "reference.telemetry-month.singular": "mês de coaching de telemetria",
    "reference.telemetry-month.plural": "meses de coaching de telemetria",
    "reference.telemetry-month.detail": "usando um pacote típico de dados e coaching de sim racing",
    "reference.slick-set.singular": "jogo completo de pneus slicks GT3",
    "reference.slick-set.plural": "jogos completos de pneus slicks GT3",
    "reference.slick-set.detail": "usando quatro slicks atuais de nível profissional",
    "reference.fuel-drum.singular": "tambor de combustível de corrida",
    "reference.fuel-drum.plural": "tambores de combustível de corrida",
    "reference.fuel-drum.detail": "usando uma estimativa arredondada de combustível de motorsport",
    "reference.club-race.singular": "inscrição regional de corrida de clube",
    "reference.club-race.plural": "inscrições regionais de corrida de clube",
    "reference.club-race.detail": "usando um orçamento modesto de corrida amadora para um fim de semana",
    "reference.sim-cockpit.singular": "cockpit de simulador em alumínio",
    "reference.sim-cockpit.plural": "cockpits de simulador em alumínio",
    "reference.sim-cockpit.detail": "usando uma estimativa sólida de cockpit estilo 8020"
  },
  "es-ES": {
    "common.expand": "Expandir",
    "common.compact": "Compacto",
    "common.refresh": "Actualizar",
    "common.refreshing": "Actualizando...",
    "common.reveal": "Mostrar",
    "common.hide": "Ocultar",
    "common.hidden": "Oculto",
    "common.sync_required": "Sincronización necesaria",
    "common.open_order_history": "Abrir historial de pedidos",
    "intelligence.title": "Centro de inteligencia",
    "intelligence.subtitle": "Progreso del miembro, premios, créditos y actividad reciente desde members-ng.",
    "intelligence.loading_snapshot": "Cargando resumen de inteligencia...",
    "intelligence.no_data_loaded": "Todavía no hay datos cargados.",
    "intelligence.no_data_returned": "No se devolvieron datos en esta actualización.",
    "intelligence.last_refresh": "Última actualización {time}",
    "intelligence.member_anniversary": "Aniversario de miembro",
    "intelligence.today": "Hoy",
    "intelligence.unavailable": "No disponible",
    "intelligence.days_remaining": "{count} días",
    "intelligence.activity_30d": "Actividad de 30 días",
    "intelligence.active_days": "{count} días activos",
    "intelligence.delta_more": "+{count} vs 30 días anteriores",
    "intelligence.delta_less": "{count} vs 30 días anteriores",
    "intelligence.delta_none": "Sin cambios vs 30 días anteriores",
    "intelligence.streak": "Racha",
    "intelligence.best_weeks": "Mejor {count} semanas",
    "intelligence.member_since": "Miembro desde",
    "intelligence.last_login": "Último acceso {time}",
    "intelligence.last_login_unavailable": "Último acceso no disponible",
    "intelligence.license_snapshot": "Resumen de licencias",
    "intelligence.participation_credits": "Créditos de participación",
    "intelligence.recent_awards": "Premios recientes",
    "intelligence.recent_events": "Eventos recientes",
    "intelligence.weeks_progress": "{done}/{minimum} semanas • {earned} de {total}",
    "intelligence.weeks_left.one": "queda {count} semana",
    "intelligence.weeks_left.other": "quedan {count} semanas",
    "intelligence.award_fallback": "Premio",
    "intelligence.new": "Nuevo",
    "intelligence.event_fallback": "Evento",
    "intelligence.load_error": "No se pudo cargar el resumen de inteligencia de members-ng.",
    "purchase.title": "Resumen de presupuesto",
    "purchase.sync_continue_title": "Sincroniza el historial de pedidos para continuar.",
    "purchase.sync_note_waiting": "Esperando a que la pestaña Historial de pedidos termine la sincronización. Este widget se actualiza automáticamente.",
    "purchase.sync_note_after": "Cuando termine la sincronización, este widget se actualizará automáticamente.",
    "purchase.last_30_days": "Últimos 30 días",
    "purchase.recent_spend_default": "Gasto neto del historial de pedidos sincronizado.",
    "purchase.content_spend": "Gasto en contenido",
    "purchase.content_spend_default": "Estimando desde el catálogo actual.",
    "purchase.content_pending": "Contenido pendiente",
    "purchase.pending_default": "Valor actual del catálogo de coches y circuitos no comprados.",
    "purchase.rotating_curiosities": "Curiosidades rotatorias",
    "purchase.click_reveal_recent": "Privado por defecto. Haz clic en esta tarjeta o en Mostrar para ver el importe de 30 días.",
    "purchase.wait_sync_recent": "Esperando a que termine la sincronización del historial de pedidos para esta pestaña del dashboard.",
    "purchase.open_sync_recent": "Abre el historial de pedidos para sincronizar el importe real de 30 días para esta pestaña del dashboard.",
    "purchase.orders_last_30.one": "{count} pedido en los últimos 30 días. Historial de pedidos sincronizado {time}.",
    "purchase.orders_last_30.other": "{count} pedidos en los últimos 30 días. Historial de pedidos sincronizado {time}.",
    "purchase.loading_history": "Cargando datos sincronizados del historial de pedidos...",
    "purchase.open_sync_real_recent": "Abre el historial de pedidos haciendo clic aquí para sincronizar el gasto reciente real.",
    "purchase.click_reveal_amount": "Haz clic en esta tarjeta o en Mostrar para ver el importe.",
    "purchase.sync_required_content_spend": "La sincronización del historial de pedidos es necesaria antes de mostrar aquí el gasto en contenido.",
    "purchase.order_history_synced": "Historial de pedidos sincronizado {time}.",
    "purchase.estimated_owned_catalog_synced": "Estimado desde el valor del catálogo comprado. Catálogo sincronizado {time}.",
    "purchase.estimating_catalog": "Estimando desde el catálogo actual...",
    "purchase.waiting_catalog_sync": "Esperando a la sincronización del catálogo.",
    "purchase.sync_unlocks_pending": "La sincronización del historial de pedidos desbloquea la estimación de contenido pendiente para esta pestaña.",
    "purchase.catalog_synced": "Catálogo sincronizado {time}.",
    "purchase.refreshing_catalog_values": "Actualizando valores actuales del catálogo...",
    "purchase.current_unowned_value": "Valor actual del catálogo de coches y circuitos no comprados.",
    "purchase.curiosities_hidden": "Las curiosidades permanecen ocultas hasta que reveles el widget financiero.",
    "purchase.curiosities_unlock_after_sync": "Las curiosidades se desbloquean cuando termina la sincronización del historial de pedidos para esta pestaña del dashboard.",
    "purchase.waiting_budget_compare": "Esperando a tener suficientes datos para comparar tu presupuesto de contenido con costes reales del automovilismo.",
    "purchase.refreshing_catalog": "Actualizando catálogo actual...",
    "purchase.compact_mode": "El modo compacto muestra tus últimos 30 días. Expande para ver el valor total del contenido y el contenido pendiente.",
    "purchase.content_spend_explainer_actual": "<strong>Gasto en contenido</strong> usa el gasto neto de contenido del historial de pedidos tras regalos y créditos automáticos.",
    "purchase.content_spend_explainer_estimated": "<strong>Gasto en contenido</strong> se estima a partir del valor actual del catálogo de tus coches y circuitos comprados.",
    "purchase.open_history_paid_amount": 'Para ver el importe pagado en lugar de la estimación, abre el historial de pedidos haciendo clic <button type="button" id="iref-dashboard-purchase-status-history" class="iref-dashboard-purchase-summary-link-inline">aquí</button>.',
    "purchase.load_saved_spend_error": "No se pudieron cargar los datos guardados de gasto.",
    "purchase.refresh_pending_error": "No se pudo actualizar el total de contenido pendiente en esta página.",
    "curiosity.spread_intro_owned": "La ventaja del valor de tu catálogo comprado sobre el catálogo pendiente",
    "curiosity.spread_intro_missing": "El catálogo pendiente todavía supera el valor de tu catálogo comprado en",
    "curiosity.reference_fact": "{intro} cubre aproximadamente {ratio} {label}, {detail}.",
    "curiosity.completion_progress": "A precios actuales de catálogo, tu contenido comprado representa aproximadamente {percent} del valor completo de coches y circuitos que estás siguiendo aquí.",
    "curiosity.remaining_progress": "A precios actuales de catálogo, lo que falta todavía representa aproximadamente {percent} del valor del catálogo que estás comparando.",
    "curiosity.balance_ratio": "El valor de tu contenido comprado es {ratio}x el valor que todavía falta del catálogo actual.",
    "curiosity.closing_gap": "A precios actuales de catálogo, completar el contenido pendiente añadiría aproximadamente {ratio}x sobre lo que vale hoy el contenido comprado.",
    "curiosity.total_track_nights": "Contenido comprado y pendiente juntos equivalen a aproximadamente {ratio} inscripciones de SCCA Track Night con presupuesto de weekday lapping-night.",
    "curiosity.total_hotel_nights": "Contenido comprado y pendiente juntos equivalen aproximadamente a {ratio} noches de hotel junto al circuito en tarifa de fin de semana de carrera.",
    "curiosity.spend_coaching": "Tu estimación actual de gasto cubriría aproximadamente {ratio} meses de coaching de telemetría.",
    "curiosity.spend_slicks": "Tu estimación actual de gasto equivale aproximadamente a {ratio} juegos completos de slicks GT3.",
    "curiosity.pending_fuel": "La diferencia actual para comprarlo todo equivale aproximadamente a {ratio} bidones de combustible de carreras.",
    "curiosity.pending_weekends": "La diferencia actual hasta el catálogo completo equivale aproximadamente a {ratio} inscripciones regionales de club racing.",
    "curiosity.upgrade_gap": "La diferencia actual hasta un catálogo completo equivale aproximadamente a {ratio} cockpits de simulador de aluminio.",
    "reference.track-night.singular": "inscripción de SCCA Track Night",
    "reference.track-night.plural": "inscripciones de SCCA Track Night",
    "reference.track-night.detail": "usando una estimación weekday lapping-night de nivel club",
    "reference.hotel-night.singular": "noche de hotel junto al circuito",
    "reference.hotel-night.plural": "noches de hotel junto al circuito",
    "reference.hotel-night.detail": "usando una estimación de hotel de fin de semana de carrera",
    "reference.telemetry-month.singular": "mes de coaching de telemetría",
    "reference.telemetry-month.plural": "meses de coaching de telemetría",
    "reference.telemetry-month.detail": "usando un paquete típico de datos y coaching de sim racing",
    "reference.slick-set.singular": "juego completo de slicks GT3",
    "reference.slick-set.plural": "juegos completos de slicks GT3",
    "reference.slick-set.detail": "usando cuatro slicks profesionales actuales",
    "reference.fuel-drum.singular": "bidón de combustible de carreras",
    "reference.fuel-drum.plural": "bidones de combustible de carreras",
    "reference.fuel-drum.detail": "usando una estimación redondeada de combustible de motorsport",
    "reference.club-race.singular": "inscripción regional de club racing",
    "reference.club-race.plural": "inscripciones regionales de club racing",
    "reference.club-race.detail": "usando un presupuesto modesto de carreras amateur para un fin de semana",
    "reference.sim-cockpit.singular": "cockpit de simulador de aluminio",
    "reference.sim-cockpit.plural": "cockpits de simulador de aluminio",
    "reference.sim-cockpit.detail": "usando una estimación sólida de cockpit estilo 8020"
  },
  "de-DE": {
    "common.expand": "Erweitern",
    "common.compact": "Kompakt",
    "common.refresh": "Aktualisieren",
    "common.refreshing": "Aktualisiere...",
    "common.reveal": "Anzeigen",
    "common.hide": "Ausblenden",
    "common.hidden": "Verdeckt",
    "common.sync_required": "Synchronisierung erforderlich",
    "common.open_order_history": "Bestellverlauf öffnen",
    "intelligence.title": "Intelligence Center",
    "intelligence.subtitle": "Mitgliederfortschritt, Auszeichnungen, Guthaben und letzte Aktivität aus members-ng.",
    "intelligence.loading_snapshot": "Intelligence-Snapshot wird geladen...",
    "intelligence.no_data_loaded": "Es wurden noch keine Daten geladen.",
    "intelligence.no_data_returned": "Bei dieser Aktualisierung wurden keine Daten zurückgegeben.",
    "intelligence.last_refresh": "Letzte Aktualisierung {time}",
    "intelligence.member_anniversary": "Mitgliedsjubiläum",
    "intelligence.today": "Heute",
    "intelligence.unavailable": "Nicht verfügbar",
    "intelligence.days_remaining": "{count} Tage",
    "intelligence.activity_30d": "30-Tage-Aktivität",
    "intelligence.active_days": "{count} aktive Tage",
    "intelligence.delta_more": "+{count} gegenüber den vorherigen 30 Tagen",
    "intelligence.delta_less": "{count} gegenüber den vorherigen 30 Tagen",
    "intelligence.delta_none": "Keine Änderung gegenüber den vorherigen 30 Tagen",
    "intelligence.streak": "Serie",
    "intelligence.best_weeks": "Bestwert {count} Wochen",
    "intelligence.member_since": "Mitglied seit",
    "intelligence.last_login": "Letzter Login {time}",
    "intelligence.last_login_unavailable": "Letzter Login nicht verfügbar",
    "intelligence.license_snapshot": "Lizenzüberblick",
    "intelligence.participation_credits": "Teilnahmegutschriften",
    "intelligence.recent_awards": "Neueste Auszeichnungen",
    "intelligence.recent_events": "Neueste Ereignisse",
    "intelligence.weeks_progress": "{done}/{minimum} Wochen • {earned} von {total}",
    "intelligence.weeks_left.one": "{count} Woche übrig",
    "intelligence.weeks_left.other": "{count} Wochen übrig",
    "intelligence.award_fallback": "Auszeichnung",
    "intelligence.new": "Neu",
    "intelligence.event_fallback": "Ereignis",
    "intelligence.load_error": "Der members-ng-Intelligence-Snapshot konnte nicht geladen werden.",
    "purchase.title": "Budgetüberblick",
    "purchase.sync_continue_title": "Bestellverlauf synchronisieren, um fortzufahren.",
    "purchase.sync_note_waiting": "Warte darauf, dass der Tab Bestellverlauf die Synchronisierung abschließt. Dieses Widget aktualisiert sich automatisch.",
    "purchase.sync_note_after": "Nach Abschluss der Synchronisierung aktualisiert sich dieses Widget automatisch.",
    "purchase.last_30_days": "Letzte 30 Tage",
    "purchase.recent_spend_default": "Nettoausgaben aus dem synchronisierten Bestellverlauf.",
    "purchase.content_spend": "Inhalte-Ausgaben",
    "purchase.content_spend_default": "Schätzung aus dem aktuellen Katalog.",
    "purchase.content_pending": "Ausstehende Inhalte",
    "purchase.pending_default": "Aktueller Katalogwert nicht besessener Autos und Strecken.",
    "purchase.rotating_curiosities": "Rotierende Fakten",
    "purchase.click_reveal_recent": "Standardmäßig privat. Klicke auf diese Karte oder auf Anzeigen, um den 30-Tage-Betrag zu sehen.",
    "purchase.wait_sync_recent": "Warte darauf, dass die Bestellverlauf-Synchronisierung für diesen Dashboard-Tab abgeschlossen wird.",
    "purchase.open_sync_recent": "Öffne den Bestellverlauf, um den echten 30-Tage-Betrag für diesen Dashboard-Tab zu synchronisieren.",
    "purchase.orders_last_30.one": "{count} Bestellung in den letzten 30 Tagen. Bestellverlauf synchronisiert {time}.",
    "purchase.orders_last_30.other": "{count} Bestellungen in den letzten 30 Tagen. Bestellverlauf synchronisiert {time}.",
    "purchase.loading_history": "Synchronisierte Bestellverlaufsdaten werden geladen...",
    "purchase.open_sync_real_recent": "Öffne den Bestellverlauf, indem du hier klickst, um die echten jüngsten Ausgaben zu synchronisieren.",
    "purchase.click_reveal_amount": "Klicke auf diese Karte oder auf Anzeigen, um den Betrag zu sehen.",
    "purchase.sync_required_content_spend": "Eine Bestellverlauf-Synchronisierung ist erforderlich, bevor Inhalte-Ausgaben hier angezeigt werden können.",
    "purchase.order_history_synced": "Bestellverlauf synchronisiert {time}.",
    "purchase.estimated_owned_catalog_synced": "Aus dem Wert des besessenen Katalogs geschätzt. Katalog synchronisiert {time}.",
    "purchase.estimating_catalog": "Schätze aus dem aktuellen Katalog...",
    "purchase.waiting_catalog_sync": "Warte auf Katalog-Synchronisierung.",
    "purchase.sync_unlocks_pending": "Die Bestellverlauf-Synchronisierung schaltet die Schätzung der ausstehenden Inhalte für diesen Tab frei.",
    "purchase.catalog_synced": "Katalog synchronisiert {time}.",
    "purchase.refreshing_catalog_values": "Aktuelle Katalogwerte werden aktualisiert...",
    "purchase.current_unowned_value": "Aktueller Katalogwert nicht besessener Autos und Strecken.",
    "purchase.curiosities_hidden": "Fakten bleiben verborgen, bis du das Finanz-Widget einblendest.",
    "purchase.curiosities_unlock_after_sync": "Fakten werden freigeschaltet, sobald die Bestellverlauf-Synchronisierung für diesen Dashboard-Tab abgeschlossen ist.",
    "purchase.waiting_budget_compare": "Warte auf genügend Daten, um dein Inhaltsbudget mit realen Motorsportkosten zu vergleichen.",
    "purchase.refreshing_catalog": "Aktuellen Katalog aktualisieren...",
    "purchase.compact_mode": "Der kompakte Modus zeigt deine letzten 30 Tage. Erweitere für den Gesamtwert der Inhalte und ausstehende Inhalte.",
    "purchase.content_spend_explainer_actual": "<strong>Inhalte-Ausgaben</strong> verwenden die Netto-Inhalte-Ausgaben aus dem Bestellverlauf nach Geschenken und automatischen Gutschriften.",
    "purchase.content_spend_explainer_estimated": "<strong>Inhalte-Ausgaben</strong> werden aus dem aktuellen Katalogwert deiner besessenen Autos und Strecken geschätzt.",
    "purchase.open_history_paid_amount": 'Für den tatsächlich gezahlten Betrag statt der Schätzung öffne den Bestellverlauf durch einen Klick <button type="button" id="iref-dashboard-purchase-status-history" class="iref-dashboard-purchase-summary-link-inline">hier</button>.',
    "purchase.load_saved_spend_error": "Gespeicherte Ausgabendaten konnten nicht geladen werden.",
    "purchase.refresh_pending_error": "Die Summe der ausstehenden Inhalte konnte auf dieser Seite nicht aktualisiert werden.",
    "curiosity.spread_intro_owned": "Der Vorsprung des Werts deines besessenen Katalogs gegenüber dem fehlenden Katalog",
    "curiosity.spread_intro_missing": "Der fehlende Katalog übersteigt den Wert deines besessenen Katalogs weiterhin um",
    "curiosity.reference_fact": "{intro} deckt ungefähr {ratio} {label} ab, {detail}.",
    "curiosity.completion_progress": "Zu aktuellen Katalogpreisen repräsentieren deine besessenen Inhalte ungefähr {percent} des gesamten Auto-und-Strecken-Katalogwerts, den du hier verfolgst.",
    "curiosity.remaining_progress": "Zu aktuellen Katalogpreisen macht die fehlende Seite weiterhin ungefähr {percent} des Katalogwerts aus, mit dem du vergleichst.",
    "curiosity.balance_ratio": "Der Wert deiner besessenen Inhalte ist {ratio}x so hoch wie der Wert, der im aktuellen Katalog noch fehlt.",
    "curiosity.closing_gap": "Zu aktuellen Katalogpreisen würde das Abschließen der fehlenden Inhalte ungefähr {ratio}x zu dem hinzufügen, was die besessenen Inhalte heute wert sind.",
    "curiosity.total_track_nights": "Besessene und fehlende Inhalte zusammen entsprechen ungefähr {ratio} SCCA Track Night-Eintritten bei einem Wochentag-Lapping-Budget.",
    "curiosity.total_hotel_nights": "Besessene und fehlende Inhalte zusammen entsprechen ungefähr {ratio} Hotelnächten an der Strecke zum Rennwochenend-Tarif.",
    "curiosity.spend_coaching": "Deine aktuelle Ausgabenschätzung würde ungefähr {ratio} Monate Telemetrie-Coaching abdecken.",
    "curiosity.spend_slicks": "Deine aktuelle Ausgabenschätzung entspricht ungefähr {ratio} kompletten GT3-Slick-Sätzen.",
    "curiosity.pending_fuel": "Die aktuelle Lücke, um alles zu kaufen, entspricht ungefähr {ratio} Fässern Rennkraftstoff.",
    "curiosity.pending_weekends": "Die aktuelle Lücke zum vollständigen Katalog entspricht ungefähr {ratio} regionalen Club-Rennnennungen.",
    "curiosity.upgrade_gap": "Die aktuelle Lücke bis zu einem vollständigen Katalog entspricht ungefähr {ratio} Aluminium-Sim-Cockpits.",
    "reference.track-night.singular": "SCCA-Track-Night-Eintritt",
    "reference.track-night.plural": "SCCA-Track-Night-Eintritte",
    "reference.track-night.detail": "mit einer Club-Level-Schätzung für Lapping Nights unter der Woche",
    "reference.hotel-night.singular": "Hotelnacht an der Strecke",
    "reference.hotel-night.plural": "Hotelnächte an der Strecke",
    "reference.hotel-night.detail": "mit einer Hotel-Schätzung für Rennwochenenden",
    "reference.telemetry-month.singular": "Monat Telemetrie-Coaching",
    "reference.telemetry-month.plural": "Monate Telemetrie-Coaching",
    "reference.telemetry-month.detail": "mit einem typischen Paket für Simracing-Daten und Coaching",
    "reference.slick-set.singular": "kompletter GT3-Slick-Satz",
    "reference.slick-set.plural": "komplette GT3-Slick-Sätze",
    "reference.slick-set.detail": "mit vier aktuellen Slicks auf Profi-Niveau",
    "reference.fuel-drum.singular": "Fass Rennkraftstoff",
    "reference.fuel-drum.plural": "Fässer Rennkraftstoff",
    "reference.fuel-drum.detail": "mit einer gerundeten Motorsport-Kraftstoffschätzung",
    "reference.club-race.singular": "regionale Club-Rennnennung",
    "reference.club-race.plural": "regionale Club-Rennnennungen",
    "reference.club-race.detail": "mit einem bescheidenen Amateur-Rennbudget für ein Wochenende",
    "reference.sim-cockpit.singular": "Aluminium-Sim-Cockpit",
    "reference.sim-cockpit.plural": "Aluminium-Sim-Cockpits",
    "reference.sim-cockpit.detail": "mit einer soliden Schätzung für ein Cockpit im 8020-Stil"
  },
  "fr-FR": {
    "common.expand": "Développer",
    "common.compact": "Compact",
    "common.refresh": "Actualiser",
    "common.refreshing": "Actualisation...",
    "common.reveal": "Révéler",
    "common.hide": "Masquer",
    "common.hidden": "Masqué",
    "common.sync_required": "Synchronisation requise",
    "common.open_order_history": "Ouvrir l'historique des commandes",
    "intelligence.title": "Centre d'intelligence",
    "intelligence.subtitle": "Progression du membre, récompenses, crédits et activité récente issus de members-ng.",
    "intelligence.loading_snapshot": "Chargement du résumé d'intelligence...",
    "intelligence.no_data_loaded": "Aucune donnée n'a encore été chargée.",
    "intelligence.no_data_returned": "Aucune donnée n'a été renvoyée lors de cette actualisation.",
    "intelligence.last_refresh": "Dernière actualisation {time}",
    "intelligence.member_anniversary": "Anniversaire de membre",
    "intelligence.today": "Aujourd'hui",
    "intelligence.unavailable": "Indisponible",
    "intelligence.days_remaining": "{count} jours",
    "intelligence.activity_30d": "Activité sur 30 jours",
    "intelligence.active_days": "{count} jours actifs",
    "intelligence.delta_more": "+{count} vs 30 jours précédents",
    "intelligence.delta_less": "{count} vs 30 jours précédents",
    "intelligence.delta_none": "Aucun changement vs 30 jours précédents",
    "intelligence.streak": "Série",
    "intelligence.best_weeks": "Meilleur {count} semaines",
    "intelligence.member_since": "Membre depuis",
    "intelligence.last_login": "Dernière connexion {time}",
    "intelligence.last_login_unavailable": "Dernière connexion indisponible",
    "intelligence.license_snapshot": "Aperçu des licences",
    "intelligence.participation_credits": "Crédits de participation",
    "intelligence.recent_awards": "Récompenses récentes",
    "intelligence.recent_events": "Événements récents",
    "intelligence.weeks_progress": "{done}/{minimum} semaines • {earned} sur {total}",
    "intelligence.weeks_left.one": "{count} semaine restante",
    "intelligence.weeks_left.other": "{count} semaines restantes",
    "intelligence.award_fallback": "Récompense",
    "intelligence.new": "Nouveau",
    "intelligence.event_fallback": "Événement",
    "intelligence.load_error": "Impossible de charger le résumé d'intelligence members-ng.",
    "purchase.title": "Résumé budget",
    "purchase.sync_continue_title": "Synchronisez l'historique des commandes pour continuer.",
    "purchase.sync_note_waiting": "En attente que l'onglet d'historique des commandes termine la synchronisation. Ce widget s'actualise automatiquement.",
    "purchase.sync_note_after": "Une fois la synchronisation terminée, ce widget s'actualise automatiquement.",
    "purchase.last_30_days": "30 derniers jours",
    "purchase.recent_spend_default": "Dépense nette issue de l'historique des commandes synchronisé.",
    "purchase.content_spend": "Dépense contenu",
    "purchase.content_spend_default": "Estimation à partir du catalogue actuel.",
    "purchase.content_pending": "Contenu manquant",
    "purchase.pending_default": "Valeur actuelle du catalogue des voitures et circuits non possédés.",
    "purchase.rotating_curiosities": "Curiosités tournantes",
    "purchase.click_reveal_recent": "Privé par défaut. Cliquez sur cette carte ou sur Révéler pour afficher le montant sur 30 jours.",
    "purchase.wait_sync_recent": "En attente de la fin de la synchronisation de l'historique des commandes pour cet onglet du tableau de bord.",
    "purchase.open_sync_recent": "Ouvrez l'historique des commandes pour synchroniser le vrai montant sur 30 jours pour cet onglet du tableau de bord.",
    "purchase.orders_last_30.one": "{count} commande au cours des 30 derniers jours. Historique des commandes synchronisé {time}.",
    "purchase.orders_last_30.other": "{count} commandes au cours des 30 derniers jours. Historique des commandes synchronisé {time}.",
    "purchase.loading_history": "Chargement des données synchronisées de l'historique des commandes...",
    "purchase.open_sync_real_recent": "Ouvrez l'historique des commandes en cliquant ici pour synchroniser la dépense récente réelle.",
    "purchase.click_reveal_amount": "Cliquez sur cette carte ou sur Révéler pour afficher le montant.",
    "purchase.sync_required_content_spend": "La synchronisation de l'historique des commandes est nécessaire avant d'afficher ici la dépense de contenu.",
    "purchase.order_history_synced": "Historique des commandes synchronisé {time}.",
    "purchase.estimated_owned_catalog_synced": "Estimé à partir de la valeur du catalogue possédé. Catalogue synchronisé {time}.",
    "purchase.estimating_catalog": "Estimation depuis le catalogue actuel...",
    "purchase.waiting_catalog_sync": "En attente de la synchronisation du catalogue.",
    "purchase.sync_unlocks_pending": "La synchronisation de l'historique des commandes déverrouille l'estimation du contenu manquant pour cet onglet.",
    "purchase.catalog_synced": "Catalogue synchronisé {time}.",
    "purchase.refreshing_catalog_values": "Actualisation des valeurs actuelles du catalogue...",
    "purchase.current_unowned_value": "Valeur actuelle du catalogue des voitures et circuits non possédés.",
    "purchase.curiosities_hidden": "Les curiosités restent cachées jusqu'à ce que vous révéliez le widget financier.",
    "purchase.curiosities_unlock_after_sync": "Les curiosités se débloquent une fois la synchronisation de l'historique des commandes terminée pour cet onglet du tableau de bord.",
    "purchase.waiting_budget_compare": "En attente de suffisamment de données pour comparer votre budget contenu avec les coûts réels du sport auto.",
    "purchase.refreshing_catalog": "Actualisation du catalogue actuel...",
    "purchase.compact_mode": "Le mode compact affiche vos 30 derniers jours. Développez pour voir la valeur totale du contenu et le contenu manquant.",
    "purchase.content_spend_explainer_actual": "<strong>Dépense contenu</strong> utilise la dépense nette de contenu de l'historique des commandes après cadeaux et crédits automatiques.",
    "purchase.content_spend_explainer_estimated": "<strong>Dépense contenu</strong> est estimée à partir de la valeur actuelle du catalogue de vos voitures et circuits possédés.",
    "purchase.open_history_paid_amount": `Pour le montant réellement payé au lieu de l'estimation, ouvrez l'historique des commandes en cliquant <button type="button" id="iref-dashboard-purchase-status-history" class="iref-dashboard-purchase-summary-link-inline">ici</button>.`,
    "purchase.load_saved_spend_error": "Impossible de charger les données de dépense enregistrées.",
    "purchase.refresh_pending_error": "Impossible d'actualiser le total du contenu manquant sur cette page.",
    "curiosity.spread_intro_owned": "L'avance de la valeur de votre catalogue possédé sur le catalogue manquant",
    "curiosity.spread_intro_missing": "Le catalogue manquant dépasse encore la valeur de votre catalogue possédé de",
    "curiosity.reference_fact": "{intro} couvre environ {ratio} {label}, {detail}.",
    "curiosity.completion_progress": "Aux prix actuels du catalogue, votre contenu possédé représente environ {percent} de la valeur complète du catalogue voitures-et-circuits que vous suivez ici.",
    "curiosity.remaining_progress": "Aux prix actuels du catalogue, la partie manquante représente encore environ {percent} de la valeur du catalogue que vous comparez.",
    "curiosity.balance_ratio": "La valeur de votre contenu possédé est de {ratio}x la valeur qui manque encore dans le catalogue actuel.",
    "curiosity.closing_gap": "Aux prix actuels du catalogue, compléter le contenu manquant ajouterait environ {ratio}x à ce que vaut aujourd'hui le contenu possédé.",
    "curiosity.total_track_nights": "Contenu possédé et manquant réunis représentent environ {ratio} inscriptions SCCA Track Night avec un budget weekday lapping-night.",
    "curiosity.total_hotel_nights": "Contenu possédé et manquant réunis représentent environ {ratio} nuits d'hôtel au bord du circuit à un tarif de week-end de course.",
    "curiosity.spend_coaching": "Votre estimation actuelle de dépense couvrirait environ {ratio} mois de coaching télémétrie.",
    "curiosity.spend_slicks": "Votre estimation actuelle de dépense équivaut à environ {ratio} jeux complets de slicks GT3.",
    "curiosity.pending_fuel": "L'écart actuel pour tout acheter représente environ {ratio} fûts de carburant de course.",
    "curiosity.pending_weekends": "L'écart actuel jusqu'au catalogue complet représente environ {ratio} inscriptions régionales de course club.",
    "curiosity.upgrade_gap": "L'écart actuel jusqu'à un catalogue complet représente environ {ratio} cockpits de simulation en aluminium.",
    "reference.track-night.singular": "inscription SCCA Track Night",
    "reference.track-night.plural": "inscriptions SCCA Track Night",
    "reference.track-night.detail": "avec une estimation de lapping-night club en semaine",
    "reference.hotel-night.singular": "nuit d'hôtel au bord du circuit",
    "reference.hotel-night.plural": "nuits d'hôtel au bord du circuit",
    "reference.hotel-night.detail": "avec une estimation d'hôtel de week-end de course",
    "reference.telemetry-month.singular": "mois de coaching télémétrie",
    "reference.telemetry-month.plural": "mois de coaching télémétrie",
    "reference.telemetry-month.detail": "avec un forfait typique de données et coaching sim racing",
    "reference.slick-set.singular": "jeu complet de slicks GT3",
    "reference.slick-set.plural": "jeux complets de slicks GT3",
    "reference.slick-set.detail": "avec quatre slicks actuels de niveau pro",
    "reference.fuel-drum.singular": "fût de carburant de course",
    "reference.fuel-drum.plural": "fûts de carburant de course",
    "reference.fuel-drum.detail": "avec une estimation arrondie du carburant motorsport",
    "reference.club-race.singular": "inscription régionale de course club",
    "reference.club-race.plural": "inscriptions régionales de course club",
    "reference.club-race.detail": "avec un budget amateur modeste pour un seul week-end",
    "reference.sim-cockpit.singular": "cockpit de simulation en aluminium",
    "reference.sim-cockpit.plural": "cockpits de simulation en aluminium",
    "reference.sim-cockpit.detail": "avec une estimation solide de cockpit type 8020"
  },
  "it-IT": {
    "common.expand": "Espandi",
    "common.compact": "Compatto",
    "common.refresh": "Aggiorna",
    "common.refreshing": "Aggiornamento...",
    "common.reveal": "Mostra",
    "common.hide": "Nascondi",
    "common.hidden": "Nascosto",
    "common.sync_required": "Sincronizzazione necessaria",
    "common.open_order_history": "Apri cronologia ordini",
    "intelligence.title": "Centro intelligence",
    "intelligence.subtitle": "Progressi del membro, premi, crediti e attività recente da members-ng.",
    "intelligence.loading_snapshot": "Caricamento del riepilogo intelligence...",
    "intelligence.no_data_loaded": "Nessun dato ancora caricato.",
    "intelligence.no_data_returned": "Nessun dato restituito in questo aggiornamento.",
    "intelligence.last_refresh": "Ultimo aggiornamento {time}",
    "intelligence.member_anniversary": "Anniversario membro",
    "intelligence.today": "Oggi",
    "intelligence.unavailable": "Non disponibile",
    "intelligence.days_remaining": "{count} giorni",
    "intelligence.activity_30d": "Attività ultimi 30 giorni",
    "intelligence.active_days": "{count} giorni attivi",
    "intelligence.delta_more": "+{count} rispetto ai 30 giorni precedenti",
    "intelligence.delta_less": "{count} rispetto ai 30 giorni precedenti",
    "intelligence.delta_none": "Nessuna variazione rispetto ai 30 giorni precedenti",
    "intelligence.streak": "Serie",
    "intelligence.best_weeks": "Migliore {count} settimane",
    "intelligence.member_since": "Membro dal",
    "intelligence.last_login": "Ultimo accesso {time}",
    "intelligence.last_login_unavailable": "Ultimo accesso non disponibile",
    "intelligence.license_snapshot": "Panoramica licenze",
    "intelligence.participation_credits": "Crediti di partecipazione",
    "intelligence.recent_awards": "Premi recenti",
    "intelligence.recent_events": "Eventi recenti",
    "intelligence.weeks_progress": "{done}/{minimum} settimane • {earned} di {total}",
    "intelligence.weeks_left.one": "{count} settimana rimanente",
    "intelligence.weeks_left.other": "{count} settimane rimanenti",
    "intelligence.award_fallback": "Premio",
    "intelligence.new": "Nuovo",
    "intelligence.event_fallback": "Evento",
    "intelligence.load_error": "Impossibile caricare il riepilogo intelligence di members-ng.",
    "purchase.title": "Panoramica budget",
    "purchase.sync_continue_title": "Sincronizza la cronologia ordini per continuare.",
    "purchase.sync_note_waiting": "In attesa che la scheda Cronologia ordini completi la sincronizzazione. Questo widget si aggiorna automaticamente.",
    "purchase.sync_note_after": "Una volta terminata la sincronizzazione, questo widget si aggiorna automaticamente.",
    "purchase.last_30_days": "Ultimi 30 giorni",
    "purchase.recent_spend_default": "Spesa netta dalla cronologia ordini sincronizzata.",
    "purchase.content_spend": "Spesa contenuti",
    "purchase.content_spend_default": "Stima dal catalogo attuale.",
    "purchase.content_pending": "Contenuti mancanti",
    "purchase.pending_default": "Valore attuale del catalogo di auto e circuiti non posseduti.",
    "purchase.rotating_curiosities": "Curiosità a rotazione",
    "purchase.click_reveal_recent": "Privato per impostazione predefinita. Fai clic su questa scheda o su Mostra per vedere l'importo dei 30 giorni.",
    "purchase.wait_sync_recent": "In attesa che la sincronizzazione della cronologia ordini termini per questa scheda dashboard.",
    "purchase.open_sync_recent": "Apri la cronologia ordini per sincronizzare l'importo reale degli ultimi 30 giorni per questa scheda dashboard.",
    "purchase.orders_last_30.one": "{count} ordine negli ultimi 30 giorni. Cronologia ordini sincronizzata {time}.",
    "purchase.orders_last_30.other": "{count} ordini negli ultimi 30 giorni. Cronologia ordini sincronizzata {time}.",
    "purchase.loading_history": "Caricamento dei dati sincronizzati della cronologia ordini...",
    "purchase.open_sync_real_recent": "Apri la cronologia ordini facendo clic qui per sincronizzare la spesa recente reale.",
    "purchase.click_reveal_amount": "Fai clic su questa scheda o su Mostra per vedere l'importo.",
    "purchase.sync_required_content_spend": "La sincronizzazione della cronologia ordini è necessaria prima di mostrare qui la spesa contenuti.",
    "purchase.order_history_synced": "Cronologia ordini sincronizzata {time}.",
    "purchase.estimated_owned_catalog_synced": "Stimato dal valore del catalogo posseduto. Catalogo sincronizzato {time}.",
    "purchase.estimating_catalog": "Stima dal catalogo attuale...",
    "purchase.waiting_catalog_sync": "In attesa della sincronizzazione del catalogo.",
    "purchase.sync_unlocks_pending": "La sincronizzazione della cronologia ordini sblocca la stima dei contenuti mancanti per questa scheda.",
    "purchase.catalog_synced": "Catalogo sincronizzato {time}.",
    "purchase.refreshing_catalog_values": "Aggiornamento dei valori attuali del catalogo...",
    "purchase.current_unowned_value": "Valore attuale del catalogo di auto e circuiti non posseduti.",
    "purchase.curiosities_hidden": "Le curiosità restano nascoste finché non mostri il widget finanziario.",
    "purchase.curiosities_unlock_after_sync": "Le curiosità si sbloccano quando termina la sincronizzazione della cronologia ordini per questa scheda dashboard.",
    "purchase.waiting_budget_compare": "In attesa di dati sufficienti per confrontare il tuo budget contenuti con i costi reali del motorsport.",
    "purchase.refreshing_catalog": "Aggiornamento catalogo attuale...",
    "purchase.compact_mode": "La modalità compatta mostra i tuoi ultimi 30 giorni. Espandi per il valore totale dei contenuti e i contenuti mancanti.",
    "purchase.content_spend_explainer_actual": "<strong>Spesa contenuti</strong> usa la spesa netta per contenuti dalla cronologia ordini dopo regali e crediti automatici.",
    "purchase.content_spend_explainer_estimated": "<strong>Spesa contenuti</strong> è stimata dal valore attuale del catalogo delle tue auto e dei tuoi circuiti posseduti.",
    "purchase.open_history_paid_amount": `Per vedere l'importo pagato invece della stima, apri la cronologia ordini facendo clic <button type="button" id="iref-dashboard-purchase-status-history" class="iref-dashboard-purchase-summary-link-inline">qui</button>.`,
    "purchase.load_saved_spend_error": "Impossibile caricare i dati di spesa salvati.",
    "purchase.refresh_pending_error": "Impossibile aggiornare il totale dei contenuti mancanti in questa pagina.",
    "curiosity.spread_intro_owned": "Il vantaggio del valore del tuo catalogo posseduto rispetto al catalogo mancante",
    "curiosity.spread_intro_missing": "Il catalogo mancante supera ancora il valore del tuo catalogo posseduto di",
    "curiosity.reference_fact": "{intro} copre circa {ratio} {label}, {detail}.",
    "curiosity.completion_progress": "Ai prezzi attuali del catalogo, i tuoi contenuti posseduti rappresentano circa il {percent} del valore completo del catalogo auto-e-circuiti che stai monitorando qui.",
    "curiosity.remaining_progress": "Ai prezzi attuali del catalogo, la parte mancante rappresenta ancora circa il {percent} del valore del catalogo che stai confrontando.",
    "curiosity.balance_ratio": "Il valore dei tuoi contenuti posseduti è {ratio}x il valore ancora mancante dal catalogo attuale.",
    "curiosity.closing_gap": "Ai prezzi attuali del catalogo, completare i contenuti mancanti aggiungerebbe circa {ratio}x rispetto a quanto valgono oggi i contenuti posseduti.",
    "curiosity.total_track_nights": "Contenuti posseduti e mancanti insieme equivalgono a circa {ratio} iscrizioni SCCA Track Night con un budget weekday lapping-night.",
    "curiosity.total_hotel_nights": "Contenuti posseduti e mancanti insieme equivalgono a circa {ratio} notti in hotel vicino al circuito a tariffa da weekend di gara.",
    "curiosity.spend_coaching": "La tua stima attuale di spesa coprirebbe circa {ratio} mesi di coaching telemetria.",
    "curiosity.spend_slicks": "La tua stima attuale di spesa equivale a circa {ratio} set completi di slick GT3.",
    "curiosity.pending_fuel": "Il divario attuale per comprare tutto equivale a circa {ratio} fusti di carburante da gara.",
    "curiosity.pending_weekends": "Il divario attuale verso il catalogo completo equivale a circa {ratio} iscrizioni regionali club race.",
    "curiosity.upgrade_gap": "Il divario attuale verso un catalogo completo equivale a circa {ratio} cockpit sim in alluminio.",
    "reference.track-night.singular": "iscrizione SCCA Track Night",
    "reference.track-night.plural": "iscrizioni SCCA Track Night",
    "reference.track-night.detail": "usando una stima club-level weekday lapping-night",
    "reference.hotel-night.singular": "notte in hotel vicino al circuito",
    "reference.hotel-night.plural": "notti in hotel vicino al circuito",
    "reference.hotel-night.detail": "usando una stima hotel da weekend di gara",
    "reference.telemetry-month.singular": "mese di coaching telemetria",
    "reference.telemetry-month.plural": "mesi di coaching telemetria",
    "reference.telemetry-month.detail": "usando un tipico pacchetto di dati e coaching sim racing",
    "reference.slick-set.singular": "set completo di slick GT3",
    "reference.slick-set.plural": "set completi di slick GT3",
    "reference.slick-set.detail": "usando quattro slick professionali attuali",
    "reference.fuel-drum.singular": "fusto di carburante da gara",
    "reference.fuel-drum.plural": "fusti di carburante da gara",
    "reference.fuel-drum.detail": "usando una stima arrotondata del carburante motorsport",
    "reference.club-race.singular": "iscrizione regionale club race",
    "reference.club-race.plural": "iscrizioni regionali club race",
    "reference.club-race.detail": "usando un modesto budget amatoriale per un singolo weekend",
    "reference.sim-cockpit.singular": "cockpit sim in alluminio",
    "reference.sim-cockpit.plural": "cockpit sim in alluminio",
    "reference.sim-cockpit.detail": "usando una solida stima di cockpit stile 8020"
  }
};
function ad(e, t = {}) {
  return String(e).replace(
    /\{(\w+)\}/g,
    (n, i) => t[i] !== void 0 && t[i] !== null ? String(t[i]) : ""
  );
}
function od(e, t) {
  var i, s;
  const n = pn[t] ? t : "en-US";
  return ((i = pn[n]) == null ? void 0 : i[e]) || ((s = pn["en-US"]) == null ? void 0 : s[e]) || e;
}
function ci(e, t = {}, n = B()) {
  return ad(od(e, n), t);
}
function li() {
  return B();
}
function ta() {
  const e = document.querySelector("#scroll");
  if (!e)
    return null;
  const t = e.querySelector(".dashboard") || e.firstElementChild || null, n = (t == null ? void 0 : t.parentNode) || e;
  if (!n)
    return null;
  let i = document.querySelector("#iref-dashboard-widget-row");
  return i || (i = document.createElement("section"), i.id = "iref-dashboard-widget-row", i.className = "iref-dashboard-widget-row"), t && i !== t.previousSibling ? n.insertBefore(i, t) : i.parentNode || n.prepend(i), i;
}
function na() {
  const e = document.querySelector("#iref-dashboard-widget-row");
  e && e.children.length === 0 && e.remove();
}
const ia = "dashboard-intelligence-center", cd = "body", ld = `iref-${ia}`, R = {
  snapshot: null,
  loading: !1,
  error: "",
  expanded: !1
};
let gn = !1, yt = 0, Ve = null;
function v(e, t = {}) {
  return ci(e, t);
}
function ud() {
  const e = /* @__PURE__ */ new Date(), t = new Date(e);
  t.setDate(t.getDate() - 30);
  const n = new Intl.DateTimeFormat(li(), {
    month: "short",
    day: "numeric"
  });
  return `${n.format(t)} - ${n.format(e)}`;
}
function dd(e, t) {
  const n = Number(e) || 0, i = Number(t) || 0, s = n - i;
  return s > 0 ? v("intelligence.delta_more", { count: s }) : s < 0 ? v("intelligence.delta_less", { count: s }) : v("intelligence.delta_none");
}
function ui() {
  return location.pathname === Gu;
}
function sa() {
  return document.querySelector("#iref-dashboard-intelligence-center");
}
function ra() {
  var e;
  (e = sa()) == null || e.remove(), na();
}
function N(e) {
  return String(e || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function pd() {
  if (!ui())
    return null;
  const e = ta();
  if (!e)
    return null;
  let t = sa();
  return t || (t = document.createElement("section"), t.id = "iref-dashboard-intelligence-center", t.className = "iref-dashboard-intelligence-center"), t.parentNode !== e && e.appendChild(t), t;
}
function vt(e, t, n = "") {
  const i = Array.isArray(n) ? n.filter(Boolean) : [n].filter(Boolean);
  return `
    <article class="iref-intelligence-metric">
      <span class="iref-intelligence-metric-label">${N(e)}</span>
      <strong class="iref-intelligence-metric-value">${N(t)}</strong>
      <div class="iref-intelligence-metric-note">${i.map(
    (s) => `<span class="iref-intelligence-metric-note-line">${N(s)}</span>`
  ).join("")}</div>
    </article>
  `;
}
function At(e, t) {
  return e.length ? `<div class="iref-intelligence-card-grid">${e.map(t).join("")}</div>` : `<div class="iref-intelligence-empty">${N(
    v("intelligence.no_data_returned")
  )}</div>`;
}
function wt(e, t, n = []) {
  return `
    <article class="iref-intelligence-compact-card">
      <strong class="iref-intelligence-compact-card-title">${N(e)}</strong>
      <div class="iref-intelligence-compact-card-meta">${N(t)}</div>
      ${n.length ? `<div class="iref-intelligence-inline-actions">${n.filter(Boolean).map(
    (i) => `<span class="iref-intelligence-pill${i.kind ? ` ${i.kind}` : ""}">${N(
      i.label
    )}</span>`
  ).join("")}</div>` : ""}
    </article>
  `;
}
function gd(e) {
  var l, g, f, d;
  const t = (e == null ? void 0 : e.progress) || {}, n = t.membership || {}, i = t.activity || {}, s = Array.isArray(t.licenses) ? t.licenses : [], r = Array.isArray(t.participationCredits) ? t.participationCredits.slice(0, 6) : [], a = Array.isArray((l = t.awards) == null ? void 0 : l.recent) ? t.awards.recent.slice(0, 6) : [], o = Array.isArray(t.recentEvents) ? t.recentEvents.slice(0, 6) : [], c = ud(), u = dd(
    i.recent30DaysCount,
    i.previous30DaysCount
  );
  return `
    <div class="iref-intelligence-grid">
      ${vt(
    v("intelligence.member_anniversary"),
    (g = n.anniversary) != null && g.isToday ? v("intelligence.today") : ((f = n.anniversary) == null ? void 0 : f.daysRemaining) == null ? v("intelligence.unavailable") : v("intelligence.days_remaining", {
      count: n.anniversary.daysRemaining
    }),
    ((d = n.anniversary) == null ? void 0 : d.detail) || ""
  )}
      ${vt(
    v("intelligence.activity_30d"),
    v("intelligence.active_days", {
      count: i.recent30DaysCount || 0
    }),
    [u, c]
  )}
      ${vt(
    v("intelligence.streak"),
    String(i.consecutiveWeeks || 0),
    v("intelligence.best_weeks", {
      count: i.bestConsecutiveWeeks || 0
    })
  )}
      ${vt(
    v("intelligence.member_since"),
    n.memberSince || v("intelligence.unavailable"),
    n.lastLogin ? v("intelligence.last_login", {
      time: n.lastLoginRelative || n.lastLogin
    }) : v("intelligence.last_login_unavailable")
  )}
    </div>
    ${R.expanded ? `
          <div class="iref-intelligence-sections-grid">
            <section class="iref-intelligence-section">
              <div class="iref-intelligence-section-title">${N(
    v("intelligence.license_snapshot")
  )}</div>
              ${At(
    s,
    (h) => wt(
      h.category,
      `${h.licenseLevel} • SR ${h.safetyRating.toFixed(2)} • iR ${h.irating}`,
      [{ label: `CPI ${h.cpi}` }]
    )
  )}
            </section>
            <section class="iref-intelligence-section">
              <div class="iref-intelligence-section-title">${N(
    v("intelligence.participation_credits")
  )}</div>
              ${At(
    r,
    (h) => wt(
      h.seriesName,
      v("intelligence.weeks_progress", {
        done: h.weeksDone,
        minimum: h.minWeeks,
        earned: Hi(h.earnedCredits),
        total: Hi(h.totalCredits)
      }),
      [
        {
          label: v(
            h.remainingWeeks === 1 ? "intelligence.weeks_left.one" : "intelligence.weeks_left.other",
            {
              count: h.remainingWeeks
            }
          ),
          kind: h.remainingWeeks === 0 ? "is-positive" : ""
        }
      ]
    )
  )}
            </section>
            <section class="iref-intelligence-section">
              <div class="iref-intelligence-section-title">${N(
    v("intelligence.recent_awards")
  )}</div>
              ${At(
    a,
    (h) => wt(
      h.title,
      `${h.groupName || v("intelligence.award_fallback")} • ${oi(
        h.date
      )}`,
      [
        h.hasPdf ? { label: "PDF" } : null,
        h.viewed ? null : { label: v("intelligence.new"), kind: "is-positive" }
      ]
    )
  )}
            </section>
            <section class="iref-intelligence-section iref-intelligence-section-wide">
              <div class="iref-intelligence-section-title">${N(
    v("intelligence.recent_events")
  )}</div>
              ${At(
    o,
    (h) => wt(
      h.title,
      `${h.trackName || h.carName || v("intelligence.event_fallback")} • ${h.result || h.sessionType || ""}`,
      [{ label: ea(h.startTime) }]
    )
  )}
            </section>
          </div>
        ` : ""}
  `;
}
function tt() {
  var n, i, s, r;
  const e = pd();
  if (!e)
    return;
  const t = R.snapshot;
  e.innerHTML = `
    <div class="iref-intelligence-header">
      <div class="iref-intelligence-copy">
        <span class="iref-intelligence-label"></span>
        <h3 class="iref-intelligence-title">${N(
    v("intelligence.title")
  )}</h3>
        <p class="iref-intelligence-subtitle">${N(
    v("intelligence.subtitle")
  )}</p>
      </div>
      <div class="iref-intelligence-header-actions">
        <button type="button" id="iref-intelligence-toggle" class="iref-intelligence-toolbar-btn iref-intelligence-toggle-btn" aria-expanded="${R.expanded ? "true" : "false"}">
          ${N(
    R.expanded ? v("common.compact") : v("common.expand")
  )}
        </button>
        <button type="button" id="iref-intelligence-refresh" class="iref-intelligence-toolbar-btn">${N(
    R.loading ? v("common.refreshing") : v("common.refresh")
  )}</button>
      </div>
    </div>
    <div class="iref-intelligence-body">
      ${R.loading && !t ? `<div class="iref-intelligence-empty">${N(
    v("intelligence.loading_snapshot")
  )}</div>` : t ? gd(t) : `<div class="iref-intelligence-empty">${N(
    R.error || v("intelligence.no_data_loaded")
  )}</div>`}
    </div>
    <div class="iref-intelligence-status">${N(
    R.error || ((n = t == null ? void 0 : t.meta) != null && n.partial ? t.meta.errors.join(" | ") : (i = t == null ? void 0 : t.meta) != null && i.generatedLabel ? v("intelligence.last_refresh", {
      time: t.meta.generatedLabel
    }) : "")
  )}</div>
  `, (s = e.querySelector("#iref-intelligence-toggle")) == null || s.addEventListener("click", () => {
    R.expanded = !R.expanded, tt();
  }), (r = e.querySelector("#iref-intelligence-refresh")) == null || r.addEventListener("click", () => {
    aa(!0);
  });
}
async function aa(e = !1) {
  return Ve || (R.loading = !0, R.error = "", tt(), Ve = rd(e).then((t) => {
    R.snapshot = t, R.error = "";
  }).catch((t) => {
    R.error = (t == null ? void 0 : t.message) || v("intelligence.load_error");
  }).finally(() => {
    R.loading = !1, Ve = null, tt();
  }), Ve);
}
function Pi() {
  if (!ui()) {
    ra();
    return;
  }
  tt(), !R.snapshot && !R.loading && aa();
}
function hd(e = !0) {
  if (!e) {
    ra(), yt && (window.clearInterval(yt), yt = 0), gn = !1;
    return;
  }
  gn || (gn = !0, Pi(), yt = window.setInterval(Pi, 3e4));
}
window.addEventListener(it, () => {
  ui() && tt();
});
L.add(ia, !0, cd, ld, hd);
function fd() {
  return new Intl.NumberFormat(B(), {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
function T(e) {
  return Math.round((Number(e) || 0) * 100) / 100;
}
function Vi(e) {
  if (typeof e == "number")
    return T(e);
  if (typeof e != "string")
    return 0;
  const t = Number(e.replace(/[^0-9.-]+/g, ""));
  return Number.isFinite(t) ? T(t) : 0;
}
function md(e) {
  const t = document.createElement("iframe");
  return t.style.position = "fixed", t.style.left = "-10000px", t.style.top = "0", t.style.width = "1280px", t.style.height = "900px", t.style.opacity = "0", t.style.pointerEvents = "none", t.style.border = "0", t.setAttribute("aria-hidden", "true"), t.src = e, document.body.appendChild(t), t;
}
function _d(e, t) {
  const n = e.querySelector(`[id^="${t}"]`);
  if (!n)
    return null;
  const i = Object.keys(n).find(
    (a) => a.startsWith("__reactFiber")
  );
  if (!i)
    return null;
  let s = n[i], r = 0;
  for (; s && r <= 40; ) {
    const a = s.memoizedProps;
    if (a && Array.isArray(a.pageData))
      return a.pageData;
    s = s.return, r += 1;
  }
  return null;
}
function bd(e = []) {
  const t = /* @__PURE__ */ new Map();
  e.forEach((r) => {
    const a = r == null ? void 0 : r.package_id;
    if (!a || t.has(a))
      return;
    const o = Math.max(
      Vi(r == null ? void 0 : r.price),
      Vi(r == null ? void 0 : r.price_display)
    );
    o <= 0 || t.set(a, {
      packageId: a,
      price: o,
      owned: (r == null ? void 0 : r.owned) === !0
    });
  });
  const n = [...t.values()], i = n.filter((r) => r.owned), s = n.filter((r) => !r.owned);
  return {
    owned: i.length,
    missing: s.length,
    ownedCurrentValue: T(
      i.reduce((r, a) => r + a.price, 0)
    ),
    remainingCost: T(
      s.reduce((r, a) => r + a.price, 0)
    )
  };
}
async function Ki({ url: e, cardIdPrefix: t }) {
  const n = md(e), i = Date.now();
  try {
    return await new Promise((s, r) => {
      const a = () => {
        n.remove();
      }, o = () => {
        try {
          const c = n.contentDocument;
          if (!c || !c.body) {
            if (Date.now() - i > 15e3) {
              a(), r(new Error(`Timed out loading ${e}`));
              return;
            }
            window.setTimeout(o, 300);
            return;
          }
          const u = _d(c, t), l = /No results/i.test(c.body.innerText || "");
          if (!u && !l && Date.now() - i <= 2e4) {
            window.setTimeout(o, 300);
            return;
          }
          a(), s(
            u ? bd(u) : {
              owned: 0,
              missing: 0,
              ownedCurrentValue: 0,
              remainingCost: 0
            }
          );
        } catch (c) {
          if (Date.now() - i > 2e4) {
            a(), r(c);
            return;
          }
          window.setTimeout(o, 300);
        }
      };
      n.addEventListener(
        "load",
        () => {
          window.setTimeout(o, 500);
        },
        { once: !0 }
      ), window.setTimeout(o, 1e3);
    });
  } finally {
    n.remove();
  }
}
async function yd(e = "") {
  const t = Gr(e);
  return {
    purchaseHistorySummary: (await Jr([t]))[t] || null,
    missingContentSummary: null
  };
}
async function vd(e = "") {
  const t = Gr(e);
  return e ? Ru([t]) : null;
}
async function Ad(e = {}) {
  const t = (e == null ? void 0 : e.persist) !== !1, [n, i] = await Promise.all([
    Ki({
      url: "https://members-ng.iracing.com/web/shop/cars?filter=all&match=any&sort=package_name&tags=unowned&view=grid",
      cardIdPrefix: "store-cars-page-content-content-list-card-"
    }),
    Ki({
      url: "https://members-ng.iracing.com/web/shop/tracks?filter=all&match=any&sort=track_name&tags=unowned&view=grid",
      cardIdPrefix: "store-tracks-page-content-content-list-card-"
    })
  ]), s = {
    version: 1,
    mode: "dashboard-catalog-value",
    syncedAt: (/* @__PURE__ */ new Date()).toISOString(),
    cars: {
      owned: n.owned,
      missing: n.missing,
      ownedCurrentValue: n.ownedCurrentValue,
      remainingCost: n.remainingCost
    },
    tracks: {
      owned: i.owned,
      missing: i.missing,
      ownedCurrentValue: i.ownedCurrentValue,
      remainingCost: i.remainingCost
    },
    totals: {
      owned: n.owned + i.owned,
      missing: n.missing + i.missing,
      ownedCurrentValue: T(
        n.ownedCurrentValue + i.ownedCurrentValue
      ),
      remainingCost: T(
        n.remainingCost + i.remainingCost
      ),
      currentCatalogValue: T(
        n.ownedCurrentValue + i.ownedCurrentValue + n.remainingCost + i.remainingCost
      )
    }
  };
  return t && await Yr({
    [qu]: s
  }), s;
}
function wd(e) {
  if (!e)
    return null;
  const n = (Array.isArray(e.spendingCategoryTotals) ? e.spendingCategoryTotals : []).find((r) => (r == null ? void 0 : r.key) === "content");
  if (n && Number.isFinite(Number(n.net)))
    return T(n.net);
  const s = (Array.isArray(e.spendingCategories) ? e.spendingCategories : []).find((r) => (r == null ? void 0 : r.key) === "content");
  return s && Number.isFinite(Number(s.amount)) ? T(s.amount) : null;
}
function Sd(e) {
  if (!e || !e.totals)
    return null;
  const t = Number(e.totals.remainingCost);
  return Number.isFinite(t) ? T(t) : null;
}
function kd(e) {
  if (!e || !e.totals)
    return null;
  const t = Number(e.totals.ownedCurrentValue);
  return Number.isFinite(t) ? T(t) : null;
}
function qd(e) {
  const t = String(e || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!t)
    return 0;
  const n = new Date(Number(t[1]), Number(t[2]) - 1, Number(t[3]));
  return Number.isFinite(n.getTime()) ? n.getTime() : 0;
}
function Qi(e) {
  const t = Number(e == null ? void 0 : e.dateMs);
  return Number.isFinite(t) && t > 0 ? t : qd(e == null ? void 0 : e.dateKey);
}
function xd(e, t = 30) {
  if (!e)
    return null;
  const n = Array.isArray(e.orderRecords) ? e.orderRecords : [], i = Array.isArray(e.adjustmentRecords) ? e.adjustmentRecords : [], s = /* @__PURE__ */ new Date(), r = new Date(
    s.getFullYear(),
    s.getMonth(),
    s.getDate(),
    23,
    59,
    59,
    999
  ).getTime(), a = new Date(r);
  a.setDate(a.getDate() - Math.max(1, Number(t) || 30) + 1), a.setHours(0, 0, 0, 0);
  const o = a.getTime();
  let c = 0, u = 0, l = 0, g = 0;
  return n.forEach((f) => {
    const d = Qi(f);
    !d || d < o || d > r || (l += 1, c = T(c + Number(f.gross || 0)), u = T(u + Number(f.net || 0)));
  }), i.forEach((f) => {
    const d = Qi(f);
    (f == null ? void 0 : f.key) !== "auto-credit-applied" || !d || d < o || d > r || (g = T(g + Number(f.amount || 0)));
  }), {
    days: Math.max(1, Number(t) || 30),
    gross: T(c),
    net: T(Math.max(0, u - g)),
    autoCreditApplied: T(g),
    orders: l,
    startDateKey: a.toISOString().slice(0, 10),
    endDateKey: new Date(r).toISOString().slice(0, 10)
  };
}
function hn(e) {
  return fd().format(T(e));
}
function St(e) {
  if (!e)
    return "";
  const t = new Date(e);
  return Number.isNaN(t.getTime()) ? "" : new Intl.DateTimeFormat(B(), {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(t);
}
function Dn(e = "") {
  const t = new URL(
    "https://members.iracing.com/membersite/account/OrderHistory.do"
  );
  e && t.searchParams.set("irefSession", e), window.open(
    t.toString(),
    "_blank",
    "noopener,noreferrer"
  );
}
const Cd = [
  { key: "track-night", price: 155 },
  { key: "hotel-night", price: 189 },
  { key: "telemetry-month", price: 99 },
  { key: "slick-set", price: 3572 },
  { key: "fuel-drum", price: 780 },
  { key: "club-race", price: 495 },
  { key: "sim-cockpit", price: 649 }
];
function ee(e) {
  const t = Number(e) || 0;
  return t >= 10 ? Math.round(t).toString() : t >= 1 ? t.toFixed(1).replace(/\.0$/, "") : t.toFixed(2).replace(/0$/, "").replace(/\.$/, "");
}
function Gi(e) {
  return `${(Number(e) || 0).toFixed(1).replace(/\.0$/, "")}%`;
}
function Tt(e) {
  return Math.round((Number(e) || 0) * 100) / 100;
}
function I(e, t = {}, n = li()) {
  return ci(e, t, n);
}
function Ed(e, t, n) {
  return I(
    t >= 1.5 ? `reference.${e}.plural` : `reference.${e}.singular`,
    {},
    n
  );
}
function Rd(e, t, n, i) {
  return n.map((s) => {
    const r = Cd.find((o) => o.key === s), a = e / r.price;
    return {
      key: `${t}-${r.key}`,
      copy: I(
        "curiosity.reference_fact",
        {
          intro: I(t, {}, i),
          ratio: ee(a),
          label: Ed(r.key, a, i),
          detail: I(`reference.${r.key}.detail`, {}, i)
        },
        i
      )
    };
  });
}
function Nd(e, t, n, i) {
  const s = [], r = Tt(Math.abs(e - t));
  return r > 0 && s.push(
    ...Rd(
      r,
      e >= t ? "curiosity.spread_intro_owned" : "curiosity.spread_intro_missing",
      ["track-night", "hotel-night"],
      i
    )
  ), n > 0 && e > 0 && s.push({
    key: "completion-progress",
    copy: I(
      "curiosity.completion_progress",
      {
        percent: Gi(e / n * 100)
      },
      i
    )
  }), n > 0 && t > 0 && s.push({
    key: "remaining-progress",
    copy: I(
      "curiosity.remaining_progress",
      {
        percent: Gi(t / n * 100)
      },
      i
    )
  }), e > 0 && t > 0 && (s.push({
    key: "balance-ratio",
    copy: I(
      "curiosity.balance_ratio",
      {
        ratio: ee(e / Math.max(t, 1))
      },
      i
    )
  }), s.push({
    key: "closing-gap",
    copy: I(
      "curiosity.closing_gap",
      {
        ratio: ee(t / Math.max(e, 1))
      },
      i
    )
  })), n > 0 && (s.push({
    key: "catalog-track-nights",
    copy: I(
      "curiosity.total_track_nights",
      {
        ratio: ee(n / 155)
      },
      i
    )
  }), s.push({
    key: "catalog-hotel-nights",
    copy: I(
      "curiosity.total_hotel_nights",
      {
        ratio: ee(n / 189)
      },
      i
    )
  })), e > 0 && (s.push({
    key: "spend-vs-coaching",
    copy: I(
      "curiosity.spend_coaching",
      {
        ratio: ee(e / 99)
      },
      i
    )
  }), s.push({
    key: "spend-vs-slicks",
    copy: I(
      "curiosity.spend_slicks",
      {
        ratio: ee(e / 3572)
      },
      i
    )
  })), t > 0 && (s.push({
    key: "pending-vs-fuel",
    copy: I(
      "curiosity.pending_fuel",
      {
        ratio: ee(t / 780)
      },
      i
    )
  }), s.push({
    key: "pending-vs-weekends",
    copy: I(
      "curiosity.pending_weekends",
      {
        ratio: ee(t / 495)
      },
      i
    )
  })), e > 0 && n > e && s.push({
    key: "upgrade-gap",
    copy: I(
      "curiosity.upgrade_gap",
      {
        ratio: ee((n - e) / 649)
      },
      i
    )
  }), s;
}
function Td(e = "default") {
  const t = `iref_curiosity_seed_${e}`;
  try {
    const i = Number(localStorage.getItem(t) || 0) + 1;
    return localStorage.setItem(t, String(i)), i;
  } catch {
    return Date.now();
  }
}
function zd({
  spendAmount: e = 0,
  pendingAmount: t = 0,
  totalAmount: n = 0,
  seed: i = 0,
  limit: s = 1
}) {
  const r = li(), a = Tt(e), o = Tt(t), c = Tt(n || a + o), u = Nd(a, o, c, r).filter(
    (d, h, w) => w.findIndex((z) => z.key === d.key) === h
  );
  if (!u.length)
    return [];
  const l = Math.min(Math.max(s, 1), u.length), g = Math.abs(Number(i) || 0) % u.length, f = [];
  for (let d = 0; d < l; d += 1)
    f.push(u[(g + d) % u.length].copy);
  return f;
}
const oa = "dashboard-purchase-summary", Dd = "body", Ld = `iref-${oa}`, Id = "/web/racing/home/dashboard", ca = "iref_dashboard_purchase_state_v2", Ji = "iref_dashboard_purchase_session_token_v1", la = "iref_dashboard_purchase_autorefreshed_v2", m = {
  purchaseHistorySummary: null,
  missingContentSummary: null,
  purchaseHistoryError: "",
  missingContentError: "",
  loadingStored: !1,
  loadingPending: !1
};
let fn = !1, kt = 0, Te = null, ze = null;
const Od = Td("dashboard");
let O = !1, ue = !1, Yi = !1, di = !1, ce = "", fe = !1;
function _(e, t = {}) {
  return ci(e, t);
}
function Bd(e, t) {
  return _(
    e === 1 ? "purchase.orders_last_30.one" : "purchase.orders_last_30.other",
    {
      count: e,
      time: t
    }
  );
}
function pi() {
  return location.pathname === Id;
}
function ua() {
  return document.querySelector("#iref-dashboard-purchase-summary");
}
function da() {
  var e;
  (e = ua()) == null || e.remove(), na();
}
function Xi() {
  var n, i, s;
  if ((n = window.crypto) != null && n.randomUUID)
    return window.crypto.randomUUID();
  const e = new Uint32Array(4);
  (s = (i = window.crypto) == null ? void 0 : i.getRandomValues) == null || s.call(i, e);
  const t = [...e].map((r) => r.toString(36).padStart(7, "0")).join("");
  return `iref-${Date.now()}-${t}`;
}
function Be() {
  if (ce)
    return ce;
  try {
    const e = sessionStorage.getItem(Ji);
    return e ? (ce = e, ce) : (ce = Xi(), sessionStorage.setItem(Ji, ce), ce);
  } catch {
    return ce = Xi(), ce;
  }
}
function jd() {
  return ta();
}
function Md() {
  var n, i, s, r, a;
  if (!pi())
    return null;
  const e = jd();
  if (!e)
    return null;
  let t = ua();
  return t || (t = document.createElement("section"), t.id = "iref-dashboard-purchase-summary", t.className = "iref-dashboard-purchase-summary", t.innerHTML = `
      <div class="iref-dashboard-purchase-summary-header">
        <div class="iref-dashboard-purchase-summary-copy">
          <span class="iref-dashboard-purchase-summary-label">iRefined</span>
          <h3 id="iref-dashboard-purchase-title" class="iref-dashboard-purchase-summary-title"></h3>
        </div>
        <div class="iref-dashboard-purchase-summary-actions">
          <button
            type="button"
            id="iref-dashboard-purchase-privacy"
            class="iref-dashboard-purchase-summary-btn"
          ></button>
          <button
            type="button"
            id="iref-dashboard-purchase-expand"
            class="iref-dashboard-purchase-summary-btn"
          ></button>
          <button
            type="button"
            id="iref-dashboard-purchase-refresh"
            class="iref-dashboard-purchase-summary-btn"
          ></button>
          <button
            type="button"
            id="iref-dashboard-purchase-history"
            class="iref-dashboard-purchase-summary-btn"
          ></button>
        </div>
      </div>
      <div
        id="iref-dashboard-purchase-sync-gate"
        class="iref-dashboard-purchase-summary-sync-gate"
      >
        <div class="iref-dashboard-purchase-summary-sync-copy">
          <span id="iref-dashboard-purchase-sync-label" class="iref-dashboard-purchase-summary-sync-label"></span>
          <strong class="iref-dashboard-purchase-summary-sync-title">
            <span id="iref-dashboard-purchase-sync-title"></span>
          </strong>
          <p
            id="iref-dashboard-purchase-sync-note"
            class="iref-dashboard-purchase-summary-sync-note"
          ></p>
        </div>
        <button
          type="button"
          id="iref-dashboard-purchase-sync-open"
          class="iref-dashboard-purchase-summary-sync-btn"
        ></button>
      </div>
      <div class="iref-dashboard-purchase-summary-compact">
        <div class="iref-dashboard-purchase-summary-card iref-dashboard-purchase-summary-card-recent">
          <span id="iref-dashboard-purchase-recent-label" class="iref-dashboard-purchase-summary-card-label"></span>
          <strong
            id="iref-dashboard-purchase-recent-value"
            class="iref-dashboard-purchase-summary-card-value"
          >--</strong>
          <div
            id="iref-dashboard-purchase-recent-note"
            class="iref-dashboard-purchase-summary-card-note"
          ></div>
        </div>
      </div>
      <div class="iref-dashboard-purchase-summary-detail">
        <div class="iref-dashboard-purchase-summary-grid">
          <div class="iref-dashboard-purchase-summary-card">
            <span id="iref-dashboard-purchase-spend-label" class="iref-dashboard-purchase-summary-card-label"></span>
            <strong
              id="iref-dashboard-purchase-spend-value"
              class="iref-dashboard-purchase-summary-card-value"
            >--</strong>
            <div
              id="iref-dashboard-purchase-spend-note"
              class="iref-dashboard-purchase-summary-card-note"
            ></div>
          </div>
          <div class="iref-dashboard-purchase-summary-card">
            <span id="iref-dashboard-purchase-pending-label" class="iref-dashboard-purchase-summary-card-label"></span>
            <strong
              id="iref-dashboard-purchase-pending-value"
              class="iref-dashboard-purchase-summary-card-value"
            >--</strong>
            <div
              id="iref-dashboard-purchase-pending-note"
              class="iref-dashboard-purchase-summary-card-note"
            ></div>
          </div>
        </div>
        <div class="iref-dashboard-purchase-summary-fact">
          <span id="iref-dashboard-purchase-fact-label" class="iref-dashboard-purchase-summary-fact-label"></span>
          <div
            id="iref-dashboard-purchase-fact"
            class="iref-dashboard-purchase-summary-fact-list"
          ></div>
        </div>
      </div>
      <div
        id="iref-dashboard-purchase-status"
        class="iref-dashboard-purchase-summary-status"
      ></div>
    `, (n = t.querySelector("#iref-dashboard-purchase-privacy")) == null || n.addEventListener("click", () => {
    O = !O, pe();
  }), (i = t.querySelector("#iref-dashboard-purchase-expand")) == null || i.addEventListener("click", () => {
    ue = !ue, pe();
  }), (s = t.querySelector("#iref-dashboard-purchase-refresh")) == null || s.addEventListener("click", () => {
    ga(!0), pa(!0);
  }), (r = t.querySelector("#iref-dashboard-purchase-history")) == null || r.addEventListener("click", () => {
    fe = !0, je(), Dn(Be());
  }), (a = t.querySelector("#iref-dashboard-purchase-sync-open")) == null || a.addEventListener("click", () => {
    fe = !0, je(), Dn(Be());
  }), t.querySelectorAll(
    ".iref-dashboard-purchase-summary-card, .iref-dashboard-purchase-summary-fact"
  ).forEach((o) => {
    o.addEventListener("click", () => {
      O || (O = !0, pe());
    });
  })), t.parentNode !== e && e.appendChild(t), t;
}
function $d(e) {
  e.querySelector("#iref-dashboard-purchase-title").textContent = _(
    "purchase.title"
  ), e.querySelector("#iref-dashboard-purchase-sync-label").textContent = _(
    "common.sync_required"
  ), e.querySelector("#iref-dashboard-purchase-sync-title").textContent = _(
    "purchase.sync_continue_title"
  ), e.querySelector("#iref-dashboard-purchase-sync-open").textContent = _(
    "common.open_order_history"
  ), e.querySelector("#iref-dashboard-purchase-history").textContent = _(
    "common.open_order_history"
  ), e.querySelector("#iref-dashboard-purchase-recent-label").textContent = _(
    "purchase.last_30_days"
  ), e.querySelector("#iref-dashboard-purchase-spend-label").textContent = _(
    "purchase.content_spend"
  ), e.querySelector("#iref-dashboard-purchase-pending-label").textContent = _(
    "purchase.content_pending"
  ), e.querySelector("#iref-dashboard-purchase-fact-label").textContent = _(
    "purchase.rotating_curiosities"
  );
}
function je() {
  try {
    sessionStorage.setItem(
      ca,
      JSON.stringify({
        purchaseHistorySummary: m.purchaseHistorySummary,
        missingContentSummary: m.missingContentSummary,
        purchaseHistoryError: m.purchaseHistoryError,
        missingContentError: m.missingContentError,
        financialsRevealed: O,
        summaryExpanded: ue,
        historySyncRequested: fe
      })
    );
  } catch {
  }
}
function Fd() {
  if (!Yi) {
    Yi = !0;
    try {
      const e = sessionStorage.getItem(ca);
      if (!e)
        return;
      const t = JSON.parse(e);
      m.purchaseHistorySummary = (t == null ? void 0 : t.purchaseHistorySummary) || null, m.missingContentSummary = (t == null ? void 0 : t.missingContentSummary) || null, m.purchaseHistoryError = (t == null ? void 0 : t.purchaseHistoryError) || "", m.missingContentError = (t == null ? void 0 : t.missingContentError) || "", O = (t == null ? void 0 : t.financialsRevealed) === !0, ue = (t == null ? void 0 : t.summaryExpanded) === !0, fe = (t == null ? void 0 : t.historySyncRequested) === !0;
    } catch {
    }
  }
}
function Wd() {
  try {
    return sessionStorage.getItem(la) !== "1";
  } catch {
    return !di;
  }
}
function Hd() {
  di = !0;
  try {
    sessionStorage.setItem(la, "1");
  } catch {
  }
}
function pe() {
  var dt, We;
  const e = Md();
  if (!e)
    return;
  $d(e), e.classList.toggle("is-private", !O), e.classList.toggle("is-expanded", ue), e.classList.toggle("is-compact", !ue);
  const t = e.querySelector("#iref-dashboard-purchase-recent-value"), n = e.querySelector("#iref-dashboard-purchase-recent-note"), i = e.querySelector("#iref-dashboard-purchase-spend-value"), s = e.querySelector("#iref-dashboard-purchase-spend-note"), r = e.querySelector("#iref-dashboard-purchase-pending-value"), a = e.querySelector("#iref-dashboard-purchase-pending-note"), o = e.querySelector("#iref-dashboard-purchase-fact"), c = e.querySelector("#iref-dashboard-purchase-status"), u = e.querySelector("#iref-dashboard-purchase-privacy"), l = e.querySelector("#iref-dashboard-purchase-expand"), g = e.querySelector("#iref-dashboard-purchase-refresh"), f = e.querySelector("#iref-dashboard-purchase-sync-gate"), d = e.querySelector("#iref-dashboard-purchase-sync-note"), h = !!m.purchaseHistorySummary, w = h ? xd(m.purchaseHistorySummary, 30) : null, z = wd(m.purchaseHistorySummary), ge = kd(m.missingContentSummary), ae = h ? z === null ? ge : z : null, oe = h ? Sd(m.missingContentSummary) : null, ut = h ? zd({
    spendAmount: ae || 0,
    pendingAmount: oe || 0,
    totalAmount: (ae || 0) + (oe || 0),
    seed: Od,
    limit: 1
  }) : [];
  if (e.classList.toggle("is-sync-required", !h), f && (f.hidden = h), d && (d.textContent = _(fe ? "purchase.sync_note_waiting" : "purchase.sync_note_after")), t && (t.textContent = O && h ? w === null ? "--" : hn(w.net) : _("common.hidden")), n && (O ? h ? w ? n.textContent = Bd(
    w.orders,
    St((dt = m.purchaseHistorySummary) == null ? void 0 : dt.syncedAt)
  ) : m.loadingStored ? n.textContent = _("purchase.loading_history") : n.textContent = _("purchase.open_sync_real_recent") : n.textContent = _(fe ? "purchase.wait_sync_recent" : "purchase.open_sync_recent") : n.textContent = _("purchase.click_reveal_recent")), i && (i.textContent = O && h ? ae === null ? "--" : hn(ae) : _("common.hidden")), s && (O ? h ? z !== null && m.purchaseHistorySummary ? s.textContent = _("purchase.order_history_synced", {
    time: St(m.purchaseHistorySummary.syncedAt)
  }) : ge !== null && m.missingContentSummary ? s.textContent = _("purchase.estimated_owned_catalog_synced", {
    time: St(m.missingContentSummary.syncedAt)
  }) : s.textContent = m.loadingPending ? _("purchase.estimating_catalog") : _("purchase.waiting_catalog_sync") : s.textContent = _("purchase.sync_required_content_spend") : s.textContent = _("purchase.click_reveal_amount")), r && (r.textContent = O && h ? oe === null ? "--" : hn(oe) : _("common.hidden")), a && (a.textContent = O ? h ? m.missingContentSummary ? _("purchase.catalog_synced", {
    time: St(m.missingContentSummary.syncedAt)
  }) : m.loadingPending ? _("purchase.refreshing_catalog_values") : _("purchase.current_unowned_value") : _("purchase.sync_unlocks_pending") : _("purchase.click_reveal_amount")), o)
    if (o.innerHTML = "", O)
      if (h)
        if (ut.length) {
          const q = document.createElement("div");
          q.className = "iref-dashboard-purchase-summary-fact-copy", q.textContent = ut[0], o.appendChild(q);
        } else {
          const q = document.createElement("div");
          q.className = "iref-dashboard-purchase-summary-fact-copy", q.textContent = _("purchase.waiting_budget_compare"), o.appendChild(q);
        }
      else {
        const q = document.createElement("div");
        q.className = "iref-dashboard-purchase-summary-fact-copy", q.textContent = _("purchase.curiosities_unlock_after_sync"), o.appendChild(q);
      }
    else {
      const q = document.createElement("div");
      q.className = "iref-dashboard-purchase-summary-fact-copy", q.textContent = _("purchase.curiosities_hidden"), o.appendChild(q);
    }
  if (c) {
    const q = [];
    m.purchaseHistoryError && q.push(m.purchaseHistoryError), m.missingContentError && q.push(m.missingContentError), m.loadingPending && q.push(_("purchase.refreshing_catalog")), q.length || (h ? ue ? z !== null && m.purchaseHistorySummary ? q.push(_("purchase.content_spend_explainer_actual")) : q.push(_("purchase.content_spend_explainer_estimated")) : q.push(_("purchase.compact_mode")) : q.push("")), h && ue && z === null && ge !== null && q.push(_("purchase.open_history_paid_amount")), c.innerHTML = q.join(" "), (We = c.querySelector("#iref-dashboard-purchase-status-history")) == null || We.addEventListener("click", () => {
      fe = !0, je(), Dn(Be());
    });
  }
  g && (g.disabled = m.loadingPending || m.loadingStored || !h, g.textContent = m.loadingPending || m.loadingStored ? _("common.refreshing") : _("common.refresh")), u && (u.textContent = _(O ? "common.hide" : "common.reveal")), l && (l.textContent = _(ue ? "common.compact" : "common.expand")), je();
}
async function pa(e = !1) {
  if (Te)
    return Te;
  const t = Be();
  return t ? (m.loadingStored = !0, m.purchaseHistoryError = "", pe(), Te = yd(t).then((n) => {
    var a;
    const i = n.purchaseHistorySummary || null;
    if (!i) {
      m.purchaseHistoryError = "";
      return;
    }
    const s = ((a = m.purchaseHistorySummary) == null ? void 0 : a.syncedAt) || "", r = (i == null ? void 0 : i.syncedAt) || "";
    m.purchaseHistorySummary = i, i && r !== s && (fe = !1), vd(t), m.purchaseHistoryError = "";
  }).catch(() => {
    m.purchaseHistoryError = _("purchase.load_saved_spend_error");
  }).finally(() => {
    m.loadingStored = !1, Te = null, je(), pe();
  }), Te) : Promise.resolve(null);
}
async function ga(e = !1) {
  return ze || (m.loadingPending = !0, m.missingContentError = "", pe(), ze = Ad({ persist: !1 }).then((t) => {
    m.missingContentSummary = t, m.missingContentError = "";
  }).catch(() => {
    m.missingContentError = _("purchase.refresh_pending_error");
  }).finally(() => {
    m.loadingPending = !1, ze = null, je(), pe();
  }), ze);
}
function Zi() {
  if (!document.hidden) {
    if (!pi()) {
      da();
      return;
    }
    Fd(), Be(), pe(), !m.loadingStored && !Te && pa(!0), m.purchaseHistorySummary && !di && Wd() && !m.loadingPending && !ze && (Hd(), ga());
  }
}
function Ud(e = !0) {
  if (!e) {
    da(), kt && (window.clearInterval(kt), kt = 0), fn = !1;
    return;
  }
  fn || (fn = !0, Be(), Zi(), kt = window.setInterval(Zi, 1500));
}
window.addEventListener(it, () => {
  pi() && pe();
});
L.add(oa, !0, Dd, Ld, Ud);
window.__irefinedLoaded = !0;
console.info("[iRefined] loaded");
//# sourceMappingURL=main.js.map
