(() => {
  // .wrangler/tmp/bundle-CJYlYN/checked-fetch.js
  var urls = /* @__PURE__ */ new Set();
  function checkURL(request, init) {
    const url =
      request instanceof URL
        ? request
        : new URL(
            (typeof request === 'string'
              ? new Request(request, init)
              : request
            ).url,
          );
    if (url.port && url.port !== '443' && url.protocol === 'https:') {
      if (!urls.has(url.toString())) {
        urls.add(url.toString());
        console.warn(
          `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`,
        );
      }
    }
  }
  globalThis.fetch = new Proxy(globalThis.fetch, {
    apply(target, thisArg, argArray) {
      const [request, init] = argArray;
      checkURL(request, init);
      return Reflect.apply(target, thisArg, argArray);
    },
  });

  // ../../node_modules/.pnpm/wrangler@3.19.0/node_modules/wrangler/templates/middleware/common.ts
  var __facade_middleware__ = [];
  function __facade_register__(...args) {
    __facade_middleware__.push(...args.flat());
  }
  function __facade_registerInternal__(...args) {
    __facade_middleware__.unshift(...args.flat());
  }
  function __facade_invokeChain__(
    request,
    env,
    ctx,
    dispatch,
    middlewareChain,
  ) {
    const [head, ...tail] = middlewareChain;
    const middlewareCtx = {
      dispatch,
      next(newRequest, newEnv) {
        return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
      },
    };
    return head(request, env, ctx, middlewareCtx);
  }
  function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
    return __facade_invokeChain__(request, env, ctx, dispatch, [
      ...__facade_middleware__,
      finalMiddleware,
    ]);
  }

  // ../../node_modules/.pnpm/wrangler@3.19.0/node_modules/wrangler/templates/middleware/loader-sw.ts
  var __FACADE_EVENT_TARGET__;
  if (globalThis.MINIFLARE) {
    __FACADE_EVENT_TARGET__ = new (Object.getPrototypeOf(WorkerGlobalScope))();
  } else {
    __FACADE_EVENT_TARGET__ = new EventTarget();
  }
  function __facade_isSpecialEvent__(type) {
    return type === 'fetch' || type === 'scheduled';
  }
  var __facade__originalAddEventListener__ = globalThis.addEventListener;
  var __facade__originalRemoveEventListener__ = globalThis.removeEventListener;
  var __facade__originalDispatchEvent__ = globalThis.dispatchEvent;
  globalThis.addEventListener = function (type, listener, options) {
    if (__facade_isSpecialEvent__(type)) {
      __FACADE_EVENT_TARGET__.addEventListener(type, listener, options);
    } else {
      __facade__originalAddEventListener__(type, listener, options);
    }
  };
  globalThis.removeEventListener = function (type, listener, options) {
    if (__facade_isSpecialEvent__(type)) {
      __FACADE_EVENT_TARGET__.removeEventListener(type, listener, options);
    } else {
      __facade__originalRemoveEventListener__(type, listener, options);
    }
  };
  globalThis.dispatchEvent = function (event) {
    if (__facade_isSpecialEvent__(event.type)) {
      return __FACADE_EVENT_TARGET__.dispatchEvent(event);
    } else {
      return __facade__originalDispatchEvent__(event);
    }
  };
  globalThis.addMiddleware = __facade_register__;
  globalThis.addMiddlewareInternal = __facade_registerInternal__;
  var __facade_waitUntil__ = Symbol('__facade_waitUntil__');
  var __facade_response__ = Symbol('__facade_response__');
  var __facade_dispatched__ = Symbol('__facade_dispatched__');
  var __Facade_ExtendableEvent__ = class extends Event {
    [__facade_waitUntil__] = [];
    waitUntil(promise) {
      if (!(this instanceof __Facade_ExtendableEvent__)) {
        throw new TypeError('Illegal invocation');
      }
      this[__facade_waitUntil__].push(promise);
    }
  };
  var __Facade_FetchEvent__ = class extends __Facade_ExtendableEvent__ {
    #request;
    #passThroughOnException;
    [__facade_response__];
    [__facade_dispatched__] = false;
    constructor(type, init) {
      super(type);
      this.#request = init.request;
      this.#passThroughOnException = init.passThroughOnException;
    }
    get request() {
      return this.#request;
    }
    respondWith(response) {
      if (!(this instanceof __Facade_FetchEvent__)) {
        throw new TypeError('Illegal invocation');
      }
      if (this[__facade_response__] !== void 0) {
        throw new DOMException(
          'FetchEvent.respondWith() has already been called; it can only be called once.',
          'InvalidStateError',
        );
      }
      if (this[__facade_dispatched__]) {
        throw new DOMException(
          'Too late to call FetchEvent.respondWith(). It must be called synchronously in the event handler.',
          'InvalidStateError',
        );
      }
      this.stopImmediatePropagation();
      this[__facade_response__] = response;
    }
    passThroughOnException() {
      if (!(this instanceof __Facade_FetchEvent__)) {
        throw new TypeError('Illegal invocation');
      }
      this.#passThroughOnException();
    }
  };
  var __Facade_ScheduledEvent__ = class extends __Facade_ExtendableEvent__ {
    #scheduledTime;
    #cron;
    #noRetry;
    constructor(type, init) {
      super(type);
      this.#scheduledTime = init.scheduledTime;
      this.#cron = init.cron;
      this.#noRetry = init.noRetry;
    }
    get scheduledTime() {
      return this.#scheduledTime;
    }
    get cron() {
      return this.#cron;
    }
    noRetry() {
      if (!(this instanceof __Facade_ScheduledEvent__)) {
        throw new TypeError('Illegal invocation');
      }
      this.#noRetry();
    }
  };
  __facade__originalAddEventListener__('fetch', (event) => {
    const ctx = {
      waitUntil: event.waitUntil.bind(event),
      passThroughOnException: event.passThroughOnException.bind(event),
    };
    const __facade_sw_dispatch__ = function (type, init) {
      if (type === 'scheduled') {
        const facadeEvent = new __Facade_ScheduledEvent__('scheduled', {
          scheduledTime: Date.now(),
          cron: init.cron ?? '',
          noRetry() {},
        });
        __FACADE_EVENT_TARGET__.dispatchEvent(facadeEvent);
        event.waitUntil(Promise.all(facadeEvent[__facade_waitUntil__]));
      }
    };
    const __facade_sw_fetch__ = function (request, _env, ctx2) {
      const facadeEvent = new __Facade_FetchEvent__('fetch', {
        request,
        passThroughOnException: ctx2.passThroughOnException,
      });
      __FACADE_EVENT_TARGET__.dispatchEvent(facadeEvent);
      facadeEvent[__facade_dispatched__] = true;
      event.waitUntil(Promise.all(facadeEvent[__facade_waitUntil__]));
      const response = facadeEvent[__facade_response__];
      if (response === void 0) {
        throw new Error('No response!');
      }
      return response;
    };
    event.respondWith(
      __facade_invoke__(
        event.request,
        globalThis,
        ctx,
        __facade_sw_dispatch__,
        __facade_sw_fetch__,
      ),
    );
  });
  __facade__originalAddEventListener__('scheduled', (event) => {
    const facadeEvent = new __Facade_ScheduledEvent__('scheduled', {
      scheduledTime: event.scheduledTime,
      cron: event.cron,
      noRetry: event.noRetry.bind(event),
    });
    __FACADE_EVENT_TARGET__.dispatchEvent(facadeEvent);
    event.waitUntil(Promise.all(facadeEvent[__facade_waitUntil__]));
  });

  // ../../node_modules/.pnpm/wrangler@3.19.0/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
  function reduceError(e) {
    return {
      name: e?.name,
      message: e?.message ?? String(e),
      stack: e?.stack,
      cause: e?.cause === void 0 ? void 0 : reduceError(e.cause),
    };
  }
  var jsonError = async (request, env, _ctx, middlewareCtx) => {
    try {
      return await middlewareCtx.next(request, env);
    } catch (e) {
      const error = reduceError(e);
      return Response.json(error, {
        status: 500,
        headers: { 'MF-Experimental-Error-Stack': 'true' },
      });
    }
  };
  var middleware_miniflare3_json_error_default = jsonError;

  // .wrangler/tmp/bundle-CJYlYN/middleware-insertion-facade.js
  __facade_registerInternal__([middleware_miniflare3_json_error_default]);

  // dist/worker/index.js
  (function () {
    var __webpack_modules__ = {
      './src/index.ts': function (
        __unused_webpack_module,
        __webpack_exports__2,
        __webpack_require__2,
      ) {
        'use strict';
        __webpack_require__2.r(__webpack_exports__2);
        var hono__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__2(
          /*! hono */
          '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/index.js',
        );
        const app = new hono__WEBPACK_IMPORTED_MODULE_0__.Hono();
        app.get('/', (c) => c.text('Hello Cloudflare Workers!'));
        app.fire();
      },
      '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/compose.js':
        function (
          __unused_webpack___webpack_module__,
          __webpack_exports__2,
          __webpack_require__2,
        ) {
          'use strict';
          __webpack_require__2.r(__webpack_exports__2);
          __webpack_require__2.d(__webpack_exports__2, {
            compose: function () {
              return compose;
            },
          });
          var _context_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__2(
            /*! ./context.js */
            '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/context.js',
          );
          var compose = (middleware, onError, onNotFound) => {
            return (context, next) => {
              let index = -1;
              return dispatch(0);
              async function dispatch(i) {
                if (i <= index) throw new Error('next() called multiple times');
                index = i;
                let res;
                let isError = false;
                let handler;
                if (middleware[i]) {
                  handler = middleware[i][0][0];
                  if (
                    context instanceof
                    _context_js__WEBPACK_IMPORTED_MODULE_0__.Context
                  )
                    context.req.routeIndex = i;
                } else handler = (i === middleware.length && next) || void 0;
                if (!handler) {
                  if (
                    context instanceof
                      _context_js__WEBPACK_IMPORTED_MODULE_0__.Context &&
                    context.finalized === false &&
                    onNotFound
                  )
                    res = await onNotFound(context);
                } else
                  try {
                    res = await handler(context, () => {
                      return dispatch(i + 1);
                    });
                  } catch (err) {
                    if (
                      err instanceof Error &&
                      context instanceof
                        _context_js__WEBPACK_IMPORTED_MODULE_0__.Context &&
                      onError
                    ) {
                      context.error = err;
                      res = await onError(err, context);
                      isError = true;
                    } else throw err;
                  }
                if (res && (context.finalized === false || isError))
                  context.res = res;
                return context;
              }
            };
          };
        },
      '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/context.js':
        function (
          __unused_webpack___webpack_module__,
          __webpack_exports__2,
          __webpack_require__2,
        ) {
          'use strict';
          __webpack_require__2.r(__webpack_exports__2);
          __webpack_require__2.d(__webpack_exports__2, {
            Context: function () {
              return Context;
            },
          });
          var _utils_cookie_js__WEBPACK_IMPORTED_MODULE_0__ =
            __webpack_require__2(
              /*! ./utils/cookie.js */
              '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/utils/cookie.js',
            );
          var _utils_html_js__WEBPACK_IMPORTED_MODULE_1__ =
            __webpack_require__2(
              /*! ./utils/html.js */
              '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/utils/html.js',
            );
          var _utils_stream_js__WEBPACK_IMPORTED_MODULE_2__ =
            __webpack_require__2(
              /*! ./utils/stream.js */
              '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/utils/stream.js',
            );
          var __accessCheck = (obj, member, msg) => {
            if (!member.has(obj)) throw TypeError('Cannot ' + msg);
          };
          var __privateGet = (obj, member, getter) => {
            __accessCheck(obj, member, 'read from private field');
            return getter ? getter.call(obj) : member.get(obj);
          };
          var __privateAdd = (obj, member, value) => {
            if (member.has(obj))
              throw TypeError(
                'Cannot add the same private member more than once',
              );
            member instanceof WeakSet
              ? member.add(obj)
              : member.set(obj, value);
          };
          var __privateSet = (obj, member, value, setter) => {
            __accessCheck(obj, member, 'write to private field');
            setter ? setter.call(obj, value) : member.set(obj, value);
            return value;
          };
          var TEXT_PLAIN = 'text/plain; charset=UTF-8';
          var _status,
            _executionCtx,
            _headers,
            _preparedHeaders,
            _res,
            _isFresh;
          var Context = class {
            constructor(req, options) {
              this.env = {};
              this._var = {};
              this.finalized = false;
              this.error = void 0;
              __privateAdd(this, _status, 200);
              __privateAdd(this, _executionCtx, void 0);
              __privateAdd(this, _headers, void 0);
              __privateAdd(this, _preparedHeaders, void 0);
              __privateAdd(this, _res, void 0);
              __privateAdd(this, _isFresh, true);
              this.renderer = (content) => this.html(content);
              this.notFoundHandler = () => new Response();
              this.render = (...args) => this.renderer(...args);
              this.setRenderer = (renderer) => {
                this.renderer = renderer;
              };
              this.header = (name, value, options2) => {
                if (value === void 0) {
                  if (__privateGet(this, _headers))
                    __privateGet(this, _headers).delete(name);
                  else if (__privateGet(this, _preparedHeaders))
                    delete __privateGet(this, _preparedHeaders)[
                      name.toLocaleLowerCase()
                    ];
                  if (this.finalized) this.res.headers.delete(name);
                  return;
                }
                if (options2?.append) {
                  if (!__privateGet(this, _headers)) {
                    __privateSet(this, _isFresh, false);
                    __privateSet(
                      this,
                      _headers,
                      new Headers(__privateGet(this, _preparedHeaders)),
                    );
                    __privateSet(this, _preparedHeaders, {});
                  }
                  __privateGet(this, _headers).append(name, value);
                } else if (__privateGet(this, _headers))
                  __privateGet(this, _headers).set(name, value);
                else {
                  __privateGet(this, _preparedHeaders) ??
                    __privateSet(this, _preparedHeaders, {});
                  __privateGet(this, _preparedHeaders)[name.toLowerCase()] =
                    value;
                }
                if (this.finalized) {
                  if (options2?.append) this.res.headers.append(name, value);
                  else this.res.headers.set(name, value);
                }
              };
              this.status = (status) => {
                __privateSet(this, _isFresh, false);
                __privateSet(this, _status, status);
              };
              this.set = (key, value) => {
                this._var ?? (this._var = {});
                this._var[key] = value;
              };
              this.get = (key) => {
                return this._var ? this._var[key] : void 0;
              };
              this.newResponse = (data, arg, headers) => {
                if (
                  __privateGet(this, _isFresh) &&
                  !headers &&
                  !arg &&
                  __privateGet(this, _status) === 200
                )
                  return new Response(data, {
                    headers: __privateGet(this, _preparedHeaders),
                  });
                if (arg && typeof arg !== 'number') {
                  const res = new Response(data, arg);
                  const contentType = __privateGet(this, _preparedHeaders)?.[
                    'content-type'
                  ];
                  if (contentType) res.headers.set('content-type', contentType);
                  return res;
                }
                const status = arg ?? __privateGet(this, _status);
                __privateGet(this, _preparedHeaders) ??
                  __privateSet(this, _preparedHeaders, {});
                __privateGet(this, _headers) ??
                  __privateSet(this, _headers, new Headers());
                for (const [k, v] of Object.entries(
                  __privateGet(this, _preparedHeaders),
                ))
                  __privateGet(this, _headers).set(k, v);
                if (__privateGet(this, _res)) {
                  __privateGet(this, _res).headers.forEach((v, k) => {
                    __privateGet(this, _headers)?.set(k, v);
                  });
                  for (const [k, v] of Object.entries(
                    __privateGet(this, _preparedHeaders),
                  ))
                    __privateGet(this, _headers).set(k, v);
                }
                headers ?? (headers = {});
                for (const [k, v] of Object.entries(headers))
                  if (typeof v === 'string')
                    __privateGet(this, _headers).set(k, v);
                  else {
                    __privateGet(this, _headers).delete(k);
                    for (const v2 of v)
                      __privateGet(this, _headers).append(k, v2);
                  }
                return new Response(data, {
                  status,
                  headers: __privateGet(this, _headers),
                });
              };
              this.body = (data, arg, headers) => {
                return typeof arg === 'number'
                  ? this.newResponse(data, arg, headers)
                  : this.newResponse(data, arg);
              };
              this.text = (text, arg, headers) => {
                if (!__privateGet(this, _preparedHeaders)) {
                  if (__privateGet(this, _isFresh) && !headers && !arg)
                    return new Response(text);
                  __privateSet(this, _preparedHeaders, {});
                }
                __privateGet(this, _preparedHeaders)['content-type'] =
                  TEXT_PLAIN;
                return typeof arg === 'number'
                  ? this.newResponse(text, arg, headers)
                  : this.newResponse(text, arg);
              };
              this.json = (object, arg, headers) => {
                const body = JSON.stringify(object);
                __privateGet(this, _preparedHeaders) ??
                  __privateSet(this, _preparedHeaders, {});
                __privateGet(this, _preparedHeaders)['content-type'] =
                  'application/json; charset=UTF-8';
                return typeof arg === 'number'
                  ? this.newResponse(body, arg, headers)
                  : this.newResponse(body, arg);
              };
              this.jsonT = (object, arg, headers) => {
                return this.json(object, arg, headers);
              };
              this.html = (html, arg, headers) => {
                __privateGet(this, _preparedHeaders) ??
                  __privateSet(this, _preparedHeaders, {});
                __privateGet(this, _preparedHeaders)['content-type'] =
                  'text/html; charset=UTF-8';
                if (typeof html === 'object') {
                  if (!(html instanceof Promise)) html = html.toString();
                  if (html instanceof Promise)
                    return html
                      .then((html2) =>
                        (0,
                        _utils_html_js__WEBPACK_IMPORTED_MODULE_1__.resolveStream)(
                          html2,
                        ),
                      )
                      .then((html2) => {
                        return typeof arg === 'number'
                          ? this.newResponse(html2, arg, headers)
                          : this.newResponse(html2, arg);
                      });
                }
                return typeof arg === 'number'
                  ? this.newResponse(html, arg, headers)
                  : this.newResponse(html, arg);
              };
              this.redirect = (location, status = 302) => {
                __privateGet(this, _headers) ??
                  __privateSet(this, _headers, new Headers());
                __privateGet(this, _headers).set('Location', location);
                return this.newResponse(null, status);
              };
              this.streamText = (cb, arg, headers) => {
                headers ?? (headers = {});
                this.header('content-type', TEXT_PLAIN);
                this.header('x-content-type-options', 'nosniff');
                this.header('transfer-encoding', 'chunked');
                return this.stream(cb, arg, headers);
              };
              this.stream = (cb, arg, headers) => {
                const { readable, writable } = new TransformStream();
                const stream =
                  new _utils_stream_js__WEBPACK_IMPORTED_MODULE_2__.StreamingApi(
                    writable,
                  );
                cb(stream).finally(() => stream.close());
                return typeof arg === 'number'
                  ? this.newResponse(readable, arg, headers)
                  : this.newResponse(readable, arg);
              };
              this.cookie = (name, value, opt) => {
                const cookie = (0,
                _utils_cookie_js__WEBPACK_IMPORTED_MODULE_0__.serialize)(
                  name,
                  value,
                  opt,
                );
                this.header('set-cookie', cookie, {
                  append: true,
                });
              };
              this.notFound = () => {
                return this.notFoundHandler(this);
              };
              this.req = req;
              if (options) {
                __privateSet(this, _executionCtx, options.executionCtx);
                this.env = options.env;
                if (options.notFoundHandler)
                  this.notFoundHandler = options.notFoundHandler;
              }
            }
            get event() {
              if (
                __privateGet(this, _executionCtx) &&
                'respondWith' in __privateGet(this, _executionCtx)
              )
                return __privateGet(this, _executionCtx);
              else throw Error('This context has no FetchEvent');
            }
            get executionCtx() {
              if (__privateGet(this, _executionCtx))
                return __privateGet(this, _executionCtx);
              else throw Error('This context has no ExecutionContext');
            }
            get res() {
              __privateSet(this, _isFresh, false);
              return (
                __privateGet(this, _res) ||
                __privateSet(
                  this,
                  _res,
                  new Response('404 Not Found', {
                    status: 404,
                  }),
                )
              );
            }
            set res(_res2) {
              __privateSet(this, _isFresh, false);
              if (__privateGet(this, _res) && _res2) {
                __privateGet(this, _res).headers.delete('content-type');
                __privateGet(this, _res).headers.forEach((v, k) => {
                  _res2.headers.set(k, v);
                });
              }
              __privateSet(this, _res, _res2);
              this.finalized = true;
            }
            get var() {
              return {
                ...this._var,
              };
            }
            get runtime() {
              const global = globalThis;
              if (global?.Deno !== void 0) return 'deno';
              if (global?.Bun !== void 0) return 'bun';
              if (typeof global?.WebSocketPair === 'function') return 'workerd';
              if (typeof global?.EdgeRuntime === 'string') return 'edge-light';
              if (global?.fastly !== void 0) return 'fastly';
              if (global?.__lagon__ !== void 0) return 'lagon';
              if (global?.process?.release?.name === 'node') return 'node';
              return 'other';
            }
          };
          _status = /* @__PURE__ */ new WeakMap();
          _executionCtx = /* @__PURE__ */ new WeakMap();
          _headers = /* @__PURE__ */ new WeakMap();
          _preparedHeaders = /* @__PURE__ */ new WeakMap();
          _res = /* @__PURE__ */ new WeakMap();
          _isFresh = /* @__PURE__ */ new WeakMap();
        },
      '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/helper/html/index.js':
        function (
          __unused_webpack___webpack_module__,
          __webpack_exports__2,
          __webpack_require__2,
        ) {
          'use strict';
          __webpack_require__2.r(__webpack_exports__2);
          __webpack_require__2.d(__webpack_exports__2, {
            html: function () {
              return html;
            },
            raw: function () {
              return raw;
            },
          });
          var _utils_html_js__WEBPACK_IMPORTED_MODULE_0__ =
            __webpack_require__2(
              /*! ../../utils/html.js */
              '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/utils/html.js',
            );
          var raw = (value, callbacks) => {
            const escapedString = new String(value);
            escapedString.isEscaped = true;
            escapedString.callbacks = callbacks;
            return escapedString;
          };
          var html = (strings, ...values) => {
            const buffer = [''];
            for (let i = 0, len = strings.length - 1; i < len; i++) {
              buffer[0] += strings[i];
              const children =
                values[i] instanceof Array
                  ? values[i].flat(Infinity)
                  : [values[i]];
              for (let i2 = 0, len2 = children.length; i2 < len2; i2++) {
                const child = children[i2];
                if (typeof child === 'string')
                  (0,
                  _utils_html_js__WEBPACK_IMPORTED_MODULE_0__.escapeToBuffer)(
                    child,
                    buffer,
                  );
                else if (
                  typeof child === 'boolean' ||
                  child === null ||
                  child === void 0
                )
                  continue;
                else if (
                  (typeof child === 'object' && child.isEscaped) ||
                  typeof child === 'number'
                ) {
                  const tmp = child.toString();
                  if (tmp instanceof Promise) buffer.unshift('', tmp);
                  else buffer[0] += tmp;
                } else
                  (0,
                  _utils_html_js__WEBPACK_IMPORTED_MODULE_0__.escapeToBuffer)(
                    child.toString(),
                    buffer,
                  );
              }
            }
            buffer[0] += strings[strings.length - 1];
            return buffer.length === 1
              ? raw(buffer[0])
              : (0,
                _utils_html_js__WEBPACK_IMPORTED_MODULE_0__.stringBufferToString)(
                  buffer,
                );
          };
        },
      '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/hono-base.js':
        function (
          __unused_webpack___webpack_module__,
          __webpack_exports__2,
          __webpack_require__2,
        ) {
          'use strict';
          __webpack_require__2.r(__webpack_exports__2);
          __webpack_require__2.d(__webpack_exports__2, {
            HonoBase: function () {
              return Hono;
            },
          });
          var _compose_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__2(
            /*! ./compose.js */
            '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/compose.js',
          );
          var _context_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__2(
            /*! ./context.js */
            '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/context.js',
          );
          var _http_exception_js__WEBPACK_IMPORTED_MODULE_2__ =
            __webpack_require__2(
              /*! ./http-exception.js */
              '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/http-exception.js',
            );
          var _request_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__2(
            /*! ./request.js */
            '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/request.js',
          );
          var _router_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__2(
            /*! ./router.js */
            '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/router.js',
          );
          var _utils_url_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__2(
            /*! ./utils/url.js */
            '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/utils/url.js',
          );
          var __accessCheck = (obj, member, msg) => {
            if (!member.has(obj)) throw TypeError('Cannot ' + msg);
          };
          var __privateGet = (obj, member, getter) => {
            __accessCheck(obj, member, 'read from private field');
            return getter ? getter.call(obj) : member.get(obj);
          };
          var __privateAdd = (obj, member, value) => {
            if (member.has(obj))
              throw TypeError(
                'Cannot add the same private member more than once',
              );
            member instanceof WeakSet
              ? member.add(obj)
              : member.set(obj, value);
          };
          var __privateSet = (obj, member, value, setter) => {
            __accessCheck(obj, member, 'write to private field');
            setter ? setter.call(obj, value) : member.set(obj, value);
            return value;
          };
          function defineDynamicClass() {
            return class {};
          }
          var notFoundHandler = (c) => {
            return c.text('404 Not Found', 404);
          };
          var errorHandler = (err, c) => {
            if (
              err instanceof
              _http_exception_js__WEBPACK_IMPORTED_MODULE_2__.HTTPException
            )
              return err.getResponse();
            console.error(err);
            const message = 'Internal Server Error';
            return c.text(message, 500);
          };
          var _path;
          var _Hono = class extends defineDynamicClass() {
            constructor(options = {}) {
              super();
              this._basePath = '/';
              __privateAdd(this, _path, '/');
              this.routes = [];
              this.notFoundHandler = notFoundHandler;
              this.errorHandler = errorHandler;
              this.head = () => {
                console.warn(
                  '`app.head()` is no longer used. `app.get()` implicitly handles the HEAD method.',
                );
                return this;
              };
              this.handleEvent = (event) => {
                return this.dispatch(
                  event.request,
                  event,
                  void 0,
                  event.request.method,
                );
              };
              this.fetch = (request, Env, executionCtx) => {
                return this.dispatch(
                  request,
                  executionCtx,
                  Env,
                  request.method,
                );
              };
              this.request = (input, requestInit, Env, executionCtx) => {
                if (input instanceof Request) {
                  if (requestInit !== void 0)
                    input = new Request(input, requestInit);
                  return this.fetch(input, Env, executionCtx);
                }
                input = input.toString();
                const path = /^https?:\/\//.test(input)
                  ? input
                  : `http://localhost${(0,
                    _utils_url_js__WEBPACK_IMPORTED_MODULE_5__.mergePath)(
                      '/',
                      input,
                    )}`;
                const req = new Request(path, requestInit);
                return this.fetch(req, Env, executionCtx);
              };
              this.fire = () => {
                addEventListener('fetch', (event) => {
                  event.respondWith(
                    this.dispatch(
                      event.request,
                      event,
                      void 0,
                      event.request.method,
                    ),
                  );
                });
              };
              const allMethods = [
                ..._router_js__WEBPACK_IMPORTED_MODULE_4__.METHODS,
                _router_js__WEBPACK_IMPORTED_MODULE_4__.METHOD_NAME_ALL_LOWERCASE,
              ];
              allMethods.map((method) => {
                this[method] = (args1, ...args) => {
                  if (typeof args1 === 'string')
                    __privateSet(this, _path, args1);
                  else this.addRoute(method, __privateGet(this, _path), args1);
                  args.map((handler) => {
                    if (typeof handler !== 'string')
                      this.addRoute(method, __privateGet(this, _path), handler);
                  });
                  return this;
                };
              });
              this.on = (method, path, ...handlers) => {
                if (!method) return this;
                __privateSet(this, _path, path);
                for (const m of [method].flat())
                  handlers.map((handler) => {
                    this.addRoute(
                      m.toUpperCase(),
                      __privateGet(this, _path),
                      handler,
                    );
                  });
                return this;
              };
              this.use = (arg1, ...handlers) => {
                if (typeof arg1 === 'string') __privateSet(this, _path, arg1);
                else handlers.unshift(arg1);
                handlers.map((handler) => {
                  this.addRoute(
                    _router_js__WEBPACK_IMPORTED_MODULE_4__.METHOD_NAME_ALL,
                    __privateGet(this, _path),
                    handler,
                  );
                });
                return this;
              };
              const strict = options.strict ?? true;
              delete options.strict;
              Object.assign(this, options);
              this.getPath = strict
                ? options.getPath ??
                  _utils_url_js__WEBPACK_IMPORTED_MODULE_5__.getPath
                : _utils_url_js__WEBPACK_IMPORTED_MODULE_5__.getPathNoStrict;
            }
            clone() {
              const clone = new _Hono({
                router: this.router,
                getPath: this.getPath,
              });
              clone.routes = this.routes;
              return clone;
            }
            route(path, app) {
              const subApp = this.basePath(path);
              if (!app) return subApp;
              app.routes.map((r) => {
                const handler =
                  app.errorHandler === errorHandler
                    ? r.handler
                    : async (c, next) =>
                        (
                          await (0,
                          _compose_js__WEBPACK_IMPORTED_MODULE_0__.compose)(
                            [],
                            app.errorHandler,
                          )(c, () => r.handler(c, next))
                        ).res;
                subApp.addRoute(r.method, r.path, handler);
              });
              return this;
            }
            basePath(path) {
              const subApp = this.clone();
              subApp._basePath = (0,
              _utils_url_js__WEBPACK_IMPORTED_MODULE_5__.mergePath)(
                this._basePath,
                path,
              );
              return subApp;
            }
            onError(handler) {
              this.errorHandler = handler;
              return this;
            }
            notFound(handler) {
              this.notFoundHandler = handler;
              return this;
            }
            showRoutes() {
              const length = 8;
              this.routes.map((route) => {
                console.log(
                  `\x1B[32m${route.method}\x1B[0m ${' '.repeat(
                    length - route.method.length,
                  )} ${route.path}`,
                );
              });
            }
            mount(path, applicationHandler, optionHandler) {
              const mergedPath = (0,
              _utils_url_js__WEBPACK_IMPORTED_MODULE_5__.mergePath)(
                this._basePath,
                path,
              );
              const pathPrefixLength =
                mergedPath === '/' ? 0 : mergedPath.length;
              const handler = async (c, next) => {
                let executionContext = void 0;
                try {
                  executionContext = c.executionCtx;
                } catch {}
                const options = optionHandler
                  ? optionHandler(c)
                  : [c.env, executionContext];
                const optionsArray = Array.isArray(options)
                  ? options
                  : [options];
                const queryStrings = (0,
                _utils_url_js__WEBPACK_IMPORTED_MODULE_5__.getQueryStrings)(
                  c.req.url,
                );
                const res = await applicationHandler(
                  new Request(
                    new URL(
                      (c.req.path.slice(pathPrefixLength) || '/') +
                        queryStrings,
                      c.req.url,
                    ),
                    c.req.raw,
                  ),
                  ...optionsArray,
                );
                if (res) return res;
                await next();
              };
              this.addRoute(
                _router_js__WEBPACK_IMPORTED_MODULE_4__.METHOD_NAME_ALL,
                (0, _utils_url_js__WEBPACK_IMPORTED_MODULE_5__.mergePath)(
                  path,
                  '*',
                ),
                handler,
              );
              return this;
            }
            get routerName() {
              this.matchRoute('GET', '/');
              return this.router.name;
            }
            addRoute(method, path, handler) {
              method = method.toUpperCase();
              path = (0, _utils_url_js__WEBPACK_IMPORTED_MODULE_5__.mergePath)(
                this._basePath,
                path,
              );
              const r = {
                path,
                method,
                handler,
              };
              this.router.add(method, path, [handler, r]);
              this.routes.push(r);
            }
            matchRoute(method, path) {
              return this.router.match(method, path);
            }
            handleError(err, c) {
              if (err instanceof Error) return this.errorHandler(err, c);
              throw err;
            }
            dispatch(request, executionCtx, env, method) {
              if (method === 'HEAD')
                return (async () =>
                  new Response(
                    null,
                    await this.dispatch(request, executionCtx, env, 'GET'),
                  ))();
              const path = this.getPath(request, {
                env,
              });
              const matchResult = this.matchRoute(method, path);
              const c = new _context_js__WEBPACK_IMPORTED_MODULE_1__.Context(
                new _request_js__WEBPACK_IMPORTED_MODULE_3__.HonoRequest(
                  request,
                  path,
                  matchResult,
                ),
                {
                  env,
                  executionCtx,
                  notFoundHandler: this.notFoundHandler,
                },
              );
              if (matchResult[0].length === 1) {
                let res;
                try {
                  res = matchResult[0][0][0][0](c, async () => {});
                  if (!res) return this.notFoundHandler(c);
                } catch (err) {
                  return this.handleError(err, c);
                }
                if (res instanceof Response) return res;
                return (async () => {
                  let awaited;
                  try {
                    awaited = await res;
                    if (!awaited) return this.notFoundHandler(c);
                  } catch (err) {
                    return this.handleError(err, c);
                  }
                  return awaited;
                })();
              }
              const composed = (0,
              _compose_js__WEBPACK_IMPORTED_MODULE_0__.compose)(
                matchResult[0],
                this.errorHandler,
                this.notFoundHandler,
              );
              return (async () => {
                try {
                  const context = await composed(c);
                  if (!context.finalized)
                    throw new Error(
                      'Context is not finalized. You may forget returning Response object or `await next()`',
                    );
                  return context.res;
                } catch (err) {
                  return this.handleError(err, c);
                }
              })();
            }
          };
          var Hono = _Hono;
          _path = /* @__PURE__ */ new WeakMap();
        },
      '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/hono.js':
        function (
          __unused_webpack___webpack_module__,
          __webpack_exports__2,
          __webpack_require__2,
        ) {
          'use strict';
          __webpack_require__2.r(__webpack_exports__2);
          __webpack_require__2.d(__webpack_exports__2, {
            Hono: function () {
              return Hono;
            },
          });
          var _hono_base_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__2(
            /*! ./hono-base.js */
            '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/hono-base.js',
          );
          var _router_reg_exp_router_index_js__WEBPACK_IMPORTED_MODULE_1__ =
            __webpack_require__2(
              /*! ./router/reg-exp-router/index.js */
              '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/router/reg-exp-router/index.js',
            );
          var _router_smart_router_index_js__WEBPACK_IMPORTED_MODULE_2__ =
            __webpack_require__2(
              /*! ./router/smart-router/index.js */
              '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/router/smart-router/index.js',
            );
          var _router_trie_router_index_js__WEBPACK_IMPORTED_MODULE_3__ =
            __webpack_require__2(
              /*! ./router/trie-router/index.js */
              '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/router/trie-router/index.js',
            );
          var Hono = class extends _hono_base_js__WEBPACK_IMPORTED_MODULE_0__.HonoBase {
            constructor(options = {}) {
              super(options);
              this.router =
                options.router ??
                new _router_smart_router_index_js__WEBPACK_IMPORTED_MODULE_2__.SmartRouter(
                  {
                    routers: [
                      new _router_reg_exp_router_index_js__WEBPACK_IMPORTED_MODULE_1__.RegExpRouter(),
                      new _router_trie_router_index_js__WEBPACK_IMPORTED_MODULE_3__.TrieRouter(),
                    ],
                  },
                );
            }
          };
        },
      '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/http-exception.js':
        function (
          __unused_webpack___webpack_module__,
          __webpack_exports__2,
          __webpack_require__2,
        ) {
          'use strict';
          __webpack_require__2.r(__webpack_exports__2);
          __webpack_require__2.d(__webpack_exports__2, {
            HTTPException: function () {
              return HTTPException;
            },
          });
          var HTTPException = class extends Error {
            constructor(status = 500, options) {
              super(options?.message);
              this.res = options?.res;
              this.status = status;
            }
            getResponse() {
              if (this.res) return this.res;
              return new Response(this.message, {
                status: this.status,
              });
            }
          };
        },
      '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/index.js':
        function (
          __unused_webpack___webpack_module__,
          __webpack_exports__2,
          __webpack_require__2,
        ) {
          'use strict';
          __webpack_require__2.r(__webpack_exports__2);
          __webpack_require__2.d(__webpack_exports__2, {
            Hono: function () {
              return _hono_js__WEBPACK_IMPORTED_MODULE_0__.Hono;
            },
          });
          var _hono_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__2(
            /*! ./hono.js */
            '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/hono.js',
          );
        },
      '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/request.js':
        function (
          __unused_webpack___webpack_module__,
          __webpack_exports__2,
          __webpack_require__2,
        ) {
          'use strict';
          __webpack_require__2.r(__webpack_exports__2);
          __webpack_require__2.d(__webpack_exports__2, {
            HonoRequest: function () {
              return HonoRequest;
            },
          });
          var _utils_body_js__WEBPACK_IMPORTED_MODULE_0__ =
            __webpack_require__2(
              /*! ./utils/body.js */
              '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/utils/body.js',
            );
          var _utils_cookie_js__WEBPACK_IMPORTED_MODULE_1__ =
            __webpack_require__2(
              /*! ./utils/cookie.js */
              '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/utils/cookie.js',
            );
          var _utils_url_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__2(
            /*! ./utils/url.js */
            '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/utils/url.js',
          );
          var __accessCheck = (obj, member, msg) => {
            if (!member.has(obj)) throw TypeError('Cannot ' + msg);
          };
          var __privateGet = (obj, member, getter) => {
            __accessCheck(obj, member, 'read from private field');
            return getter ? getter.call(obj) : member.get(obj);
          };
          var __privateAdd = (obj, member, value) => {
            if (member.has(obj))
              throw TypeError(
                'Cannot add the same private member more than once',
              );
            member instanceof WeakSet
              ? member.add(obj)
              : member.set(obj, value);
          };
          var __privateSet = (obj, member, value, setter) => {
            __accessCheck(obj, member, 'write to private field');
            setter ? setter.call(obj, value) : member.set(obj, value);
            return value;
          };
          var _validatedData, _matchResult;
          var HonoRequest = class {
            constructor(request, path = '/', matchResult = [[]]) {
              __privateAdd(this, _validatedData, void 0);
              __privateAdd(this, _matchResult, void 0);
              this.routeIndex = 0;
              this.bodyCache = {};
              this.cachedBody = (key) => {
                const { bodyCache, raw } = this;
                const cachedBody = bodyCache[key];
                if (cachedBody) return cachedBody;
                if (bodyCache.arrayBuffer)
                  return (async () => {
                    return await new Response(bodyCache.arrayBuffer)[key]();
                  })();
                return (bodyCache[key] = raw[key]());
              };
              this.raw = request;
              this.path = path;
              __privateSet(this, _matchResult, matchResult);
              __privateSet(this, _validatedData, {});
            }
            param(key) {
              if (key) {
                const param = __privateGet(this, _matchResult)[1]
                  ? __privateGet(this, _matchResult)[1][
                      __privateGet(this, _matchResult)[0][this.routeIndex][1][
                        key
                      ]
                    ]
                  : __privateGet(this, _matchResult)[0][this.routeIndex][1][
                      key
                    ];
                return param
                  ? /\%/.test(param)
                    ? (0,
                      _utils_url_js__WEBPACK_IMPORTED_MODULE_2__.decodeURIComponent_)(
                        param,
                      )
                    : param
                  : void 0;
              } else {
                const decoded = {};
                const keys = Object.keys(
                  __privateGet(this, _matchResult)[0][this.routeIndex][1],
                );
                for (let i = 0, len = keys.length; i < len; i++) {
                  const key2 = keys[i];
                  const value = __privateGet(this, _matchResult)[1]
                    ? __privateGet(this, _matchResult)[1][
                        __privateGet(this, _matchResult)[0][this.routeIndex][1][
                          key2
                        ]
                      ]
                    : __privateGet(this, _matchResult)[0][this.routeIndex][1][
                        key2
                      ];
                  if (value && typeof value === 'string')
                    decoded[key2] = /\%/.test(value)
                      ? (0,
                        _utils_url_js__WEBPACK_IMPORTED_MODULE_2__.decodeURIComponent_)(
                          value,
                        )
                      : value;
                }
                return decoded;
              }
            }
            query(key) {
              return (0,
              _utils_url_js__WEBPACK_IMPORTED_MODULE_2__.getQueryParam)(
                this.url,
                key,
              );
            }
            queries(key) {
              return (0,
              _utils_url_js__WEBPACK_IMPORTED_MODULE_2__.getQueryParams)(
                this.url,
                key,
              );
            }
            header(name) {
              if (name)
                return this.raw.headers.get(name.toLowerCase()) ?? void 0;
              const headerData = {};
              this.raw.headers.forEach((value, key) => {
                headerData[key] = value;
              });
              return headerData;
            }
            cookie(key) {
              const cookie = this.raw.headers.get('Cookie');
              if (!cookie) return;
              const obj = (0,
              _utils_cookie_js__WEBPACK_IMPORTED_MODULE_1__.parse)(cookie);
              if (key) {
                const value = obj[key];
                return value;
              } else return obj;
            }
            async parseBody(options) {
              if (this.bodyCache.parsedBody) return this.bodyCache.parsedBody;
              const parsedBody = await (0,
              _utils_body_js__WEBPACK_IMPORTED_MODULE_0__.parseBody)(
                this,
                options,
              );
              this.bodyCache.parsedBody = parsedBody;
              return parsedBody;
            }
            json() {
              return this.cachedBody('json');
            }
            text() {
              return this.cachedBody('text');
            }
            arrayBuffer() {
              return this.cachedBody('arrayBuffer');
            }
            blob() {
              return this.cachedBody('blob');
            }
            formData() {
              return this.cachedBody('formData');
            }
            addValidatedData(target, data) {
              __privateGet(this, _validatedData)[target] = data;
            }
            valid(target) {
              return __privateGet(this, _validatedData)[target];
            }
            get url() {
              return this.raw.url;
            }
            get method() {
              return this.raw.method;
            }
            get matchedRoutes() {
              return __privateGet(this, _matchResult)[0].map(
                ([[, route]]) => route,
              );
            }
            get routePath() {
              return __privateGet(this, _matchResult)[0].map(
                ([[, route]]) => route,
              )[this.routeIndex].path;
            }
            get headers() {
              return this.raw.headers;
            }
            get body() {
              return this.raw.body;
            }
            get bodyUsed() {
              return this.raw.bodyUsed;
            }
            get integrity() {
              return this.raw.integrity;
            }
            get keepalive() {
              return this.raw.keepalive;
            }
            get referrer() {
              return this.raw.referrer;
            }
            get signal() {
              return this.raw.signal;
            }
          };
          _validatedData = /* @__PURE__ */ new WeakMap();
          _matchResult = /* @__PURE__ */ new WeakMap();
        },
      '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/router.js':
        function (
          __unused_webpack___webpack_module__,
          __webpack_exports__2,
          __webpack_require__2,
        ) {
          'use strict';
          __webpack_require__2.r(__webpack_exports__2);
          __webpack_require__2.d(__webpack_exports__2, {
            MESSAGE_MATCHER_IS_ALREADY_BUILT: function () {
              return MESSAGE_MATCHER_IS_ALREADY_BUILT;
            },
            METHODS: function () {
              return METHODS;
            },
            METHOD_NAME_ALL: function () {
              return METHOD_NAME_ALL;
            },
            METHOD_NAME_ALL_LOWERCASE: function () {
              return METHOD_NAME_ALL_LOWERCASE;
            },
            UnsupportedPathError: function () {
              return UnsupportedPathError;
            },
          });
          var METHOD_NAME_ALL = 'ALL';
          var METHOD_NAME_ALL_LOWERCASE = 'all';
          var METHODS = ['get', 'post', 'put', 'delete', 'options', 'patch'];
          var MESSAGE_MATCHER_IS_ALREADY_BUILT =
            'Can not add a route since the matcher is already built.';
          var UnsupportedPathError = class extends Error {};
        },
      '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/router/reg-exp-router/index.js':
        function (
          __unused_webpack___webpack_module__,
          __webpack_exports__2,
          __webpack_require__2,
        ) {
          'use strict';
          __webpack_require__2.r(__webpack_exports__2);
          __webpack_require__2.d(__webpack_exports__2, {
            RegExpRouter: function () {
              return _router_js__WEBPACK_IMPORTED_MODULE_0__.RegExpRouter;
            },
          });
          var _router_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__2(
            /*! ./router.js */
            '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/router/reg-exp-router/router.js',
          );
        },
      '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/router/reg-exp-router/node.js':
        function (
          __unused_webpack___webpack_module__,
          __webpack_exports__2,
          __webpack_require__2,
        ) {
          'use strict';
          __webpack_require__2.r(__webpack_exports__2);
          __webpack_require__2.d(__webpack_exports__2, {
            Node: function () {
              return Node;
            },
            PATH_ERROR: function () {
              return PATH_ERROR;
            },
          });
          var LABEL_REG_EXP_STR = '[^/]+';
          var ONLY_WILDCARD_REG_EXP_STR = '.*';
          var TAIL_WILDCARD_REG_EXP_STR = '(?:|/.*)';
          var PATH_ERROR = Symbol();
          function compareKey(a, b) {
            if (a.length === 1) return b.length === 1 ? (a < b ? -1 : 1) : -1;
            if (b.length === 1) return 1;
            if (
              a === ONLY_WILDCARD_REG_EXP_STR ||
              a === TAIL_WILDCARD_REG_EXP_STR
            )
              return 1;
            else if (
              b === ONLY_WILDCARD_REG_EXP_STR ||
              b === TAIL_WILDCARD_REG_EXP_STR
            )
              return -1;
            if (a === LABEL_REG_EXP_STR) return 1;
            else if (b === LABEL_REG_EXP_STR) return -1;
            return a.length === b.length
              ? a < b
                ? -1
                : 1
              : b.length - a.length;
          }
          var Node = class {
            constructor() {
              this.children = {};
            }
            insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
              if (tokens.length === 0) {
                if (this.index !== void 0) throw PATH_ERROR;
                if (pathErrorCheckOnly) return;
                this.index = index;
                return;
              }
              const [token, ...restTokens] = tokens;
              const pattern =
                token === '*'
                  ? restTokens.length === 0
                    ? ['', '', ONLY_WILDCARD_REG_EXP_STR]
                    : ['', '', LABEL_REG_EXP_STR]
                  : token === '/*'
                  ? ['', '', TAIL_WILDCARD_REG_EXP_STR]
                  : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
              let node;
              if (pattern) {
                const name = pattern[1];
                let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
                if (name && pattern[2]) {
                  regexpStr = regexpStr.replace(
                    /^\((?!\?:)(?=[^)]+\)$)/,
                    '(?:',
                  );
                  if (/\((?!\?:)/.test(regexpStr)) throw PATH_ERROR;
                }
                node = this.children[regexpStr];
                if (!node) {
                  if (
                    Object.keys(this.children).some(
                      (k) =>
                        k !== ONLY_WILDCARD_REG_EXP_STR &&
                        k !== TAIL_WILDCARD_REG_EXP_STR,
                    )
                  )
                    throw PATH_ERROR;
                  if (pathErrorCheckOnly) return;
                  node = this.children[regexpStr] = new Node();
                  if (name !== '') node.varIndex = context.varIndex++;
                }
                if (!pathErrorCheckOnly && name !== '')
                  paramMap.push([name, node.varIndex]);
              } else {
                node = this.children[token];
                if (!node) {
                  if (
                    Object.keys(this.children).some(
                      (k) =>
                        k.length > 1 &&
                        k !== ONLY_WILDCARD_REG_EXP_STR &&
                        k !== TAIL_WILDCARD_REG_EXP_STR,
                    )
                  )
                    throw PATH_ERROR;
                  if (pathErrorCheckOnly) return;
                  node = this.children[token] = new Node();
                }
              }
              node.insert(
                restTokens,
                index,
                paramMap,
                context,
                pathErrorCheckOnly,
              );
            }
            buildRegExpStr() {
              const childKeys = Object.keys(this.children).sort(compareKey);
              const strList = childKeys.map((k) => {
                const c = this.children[k];
                return (
                  (typeof c.varIndex === 'number'
                    ? `(${k})@${c.varIndex}`
                    : k) + c.buildRegExpStr()
                );
              });
              if (typeof this.index === 'number')
                strList.unshift(`#${this.index}`);
              if (strList.length === 0) return '';
              if (strList.length === 1) return strList[0];
              return '(?:' + strList.join('|') + ')';
            }
          };
        },
      '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/router/reg-exp-router/router.js':
        function (
          __unused_webpack___webpack_module__,
          __webpack_exports__2,
          __webpack_require__2,
        ) {
          'use strict';
          __webpack_require__2.r(__webpack_exports__2);
          __webpack_require__2.d(__webpack_exports__2, {
            RegExpRouter: function () {
              return RegExpRouter;
            },
          });
          var _router_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__2(
            /*! ../../router.js */
            '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/router.js',
          );
          var _utils_url_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__2(
            /*! ../../utils/url.js */
            '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/utils/url.js',
          );
          var _node_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__2(
            /*! ./node.js */
            '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/router/reg-exp-router/node.js',
          );
          var _trie_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__2(
            /*! ./trie.js */
            '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/router/reg-exp-router/trie.js',
          );
          var methodNames = [
            (0, _router_js__WEBPACK_IMPORTED_MODULE_0__.METHOD_NAME_ALL),
            ...(0, _router_js__WEBPACK_IMPORTED_MODULE_0__.METHODS),
          ].map((method) => method.toUpperCase());
          var emptyParam = [];
          var nullMatcher = [/^$/, [], {}];
          var wildcardRegExpCache = {};
          function buildWildcardRegExp(path) {
            return (
              wildcardRegExpCache[path] ??
              (wildcardRegExpCache[path] = new RegExp(
                path === '*' ? '' : `^${path.replace(/\/\*/, '(?:|/.*)')}$`,
              ))
            );
          }
          function clearWildcardRegExpCache() {
            wildcardRegExpCache = {};
          }
          function buildMatcherFromPreprocessedRoutes(routes) {
            const trie = new _trie_js__WEBPACK_IMPORTED_MODULE_3__.Trie();
            const handlerData = [];
            if (routes.length === 0) return nullMatcher;
            const routesWithStaticPathFlag = routes
              .map((route) => [!/\*|\/:/.test(route[0]), ...route])
              .sort(([isStaticA, pathA], [isStaticB, pathB]) =>
                isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length,
              );
            const staticMap = {};
            for (
              let i = 0, j = -1, len = routesWithStaticPathFlag.length;
              i < len;
              i++
            ) {
              const [pathErrorCheckOnly, path, handlers] =
                routesWithStaticPathFlag[i];
              if (pathErrorCheckOnly)
                staticMap[path] = [handlers.map(([h]) => [h, {}]), emptyParam];
              else j++;
              let paramAssoc;
              try {
                paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
              } catch (e) {
                throw e === _node_js__WEBPACK_IMPORTED_MODULE_2__.PATH_ERROR
                  ? new _router_js__WEBPACK_IMPORTED_MODULE_0__.UnsupportedPathError(
                      path,
                    )
                  : e;
              }
              if (pathErrorCheckOnly) continue;
              handlerData[j] = handlers.map(([h, paramCount]) => {
                const paramIndexMap = {};
                paramCount -= 1;
                for (; paramCount >= 0; paramCount--) {
                  const [key, value] = paramAssoc[paramCount];
                  paramIndexMap[key] = value;
                }
                return [h, paramIndexMap];
              });
            }
            const [regexp, indexReplacementMap, paramReplacementMap] =
              trie.buildRegExp();
            for (let i = 0, len = handlerData.length; i < len; i++)
              for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
                const map = handlerData[i][j]?.[1];
                if (!map) continue;
                const keys = Object.keys(map);
                for (let k = 0, len3 = keys.length; k < len3; k++)
                  map[keys[k]] = paramReplacementMap[map[keys[k]]];
              }
            const handlerMap = [];
            for (const i in indexReplacementMap)
              handlerMap[i] = handlerData[indexReplacementMap[i]];
            return [regexp, handlerMap, staticMap];
          }
          function findMiddleware(middleware, path) {
            if (!middleware) return void 0;
            for (const k of Object.keys(middleware).sort(
              (a, b) => b.length - a.length,
            )) {
              if (buildWildcardRegExp(k).test(path)) return [...middleware[k]];
            }
            return void 0;
          }
          var RegExpRouter = class {
            constructor() {
              this.name = 'RegExpRouter';
              this.middleware = {
                [_router_js__WEBPACK_IMPORTED_MODULE_0__.METHOD_NAME_ALL]: {},
              };
              this.routes = {
                [_router_js__WEBPACK_IMPORTED_MODULE_0__.METHOD_NAME_ALL]: {},
              };
            }
            add(method, path, handler) {
              var _a;
              const { middleware, routes } = this;
              if (!middleware || !routes)
                throw new Error(
                  _router_js__WEBPACK_IMPORTED_MODULE_0__.MESSAGE_MATCHER_IS_ALREADY_BUILT,
                );
              if (methodNames.indexOf(method) === -1) methodNames.push(method);
              if (!middleware[method])
                [middleware, routes].forEach((handlerMap) => {
                  handlerMap[method] = {};
                  Object.keys(
                    handlerMap[
                      _router_js__WEBPACK_IMPORTED_MODULE_0__.METHOD_NAME_ALL
                    ],
                  ).forEach((p) => {
                    handlerMap[method][p] = [
                      ...handlerMap[
                        _router_js__WEBPACK_IMPORTED_MODULE_0__.METHOD_NAME_ALL
                      ][p],
                    ];
                  });
                });
              if (path === '/*') path = '*';
              const paramCount = (path.match(/\/:/g) || []).length;
              if (/\*$/.test(path)) {
                const re = buildWildcardRegExp(path);
                if (
                  method ===
                  _router_js__WEBPACK_IMPORTED_MODULE_0__.METHOD_NAME_ALL
                )
                  Object.keys(middleware).forEach((m) => {
                    var _a2;
                    (_a2 = middleware[m])[path] ||
                      (_a2[path] =
                        findMiddleware(middleware[m], path) ||
                        findMiddleware(
                          middleware[
                            _router_js__WEBPACK_IMPORTED_MODULE_0__
                              .METHOD_NAME_ALL
                          ],
                          path,
                        ) ||
                        []);
                  });
                else
                  (_a = middleware[method])[path] ||
                    (_a[path] =
                      findMiddleware(middleware[method], path) ||
                      findMiddleware(
                        middleware[
                          _router_js__WEBPACK_IMPORTED_MODULE_0__
                            .METHOD_NAME_ALL
                        ],
                        path,
                      ) ||
                      []);
                Object.keys(middleware).forEach((m) => {
                  if (
                    method ===
                      _router_js__WEBPACK_IMPORTED_MODULE_0__.METHOD_NAME_ALL ||
                    method === m
                  )
                    Object.keys(middleware[m]).forEach((p) => {
                      re.test(p) &&
                        middleware[m][p].push([handler, paramCount]);
                    });
                });
                Object.keys(routes).forEach((m) => {
                  if (
                    method ===
                      _router_js__WEBPACK_IMPORTED_MODULE_0__.METHOD_NAME_ALL ||
                    method === m
                  )
                    Object.keys(routes[m]).forEach(
                      (p) =>
                        re.test(p) && routes[m][p].push([handler, paramCount]),
                    );
                });
                return;
              }
              const paths = (0,
              _utils_url_js__WEBPACK_IMPORTED_MODULE_1__.checkOptionalParameter)(
                path,
              ) || [path];
              for (let i = 0, len = paths.length; i < len; i++) {
                const path2 = paths[i];
                Object.keys(routes).forEach((m) => {
                  var _a2;
                  if (
                    method ===
                      _router_js__WEBPACK_IMPORTED_MODULE_0__.METHOD_NAME_ALL ||
                    method === m
                  ) {
                    (_a2 = routes[m])[path2] ||
                      (_a2[path2] = [
                        ...(findMiddleware(middleware[m], path2) ||
                          findMiddleware(
                            middleware[
                              _router_js__WEBPACK_IMPORTED_MODULE_0__
                                .METHOD_NAME_ALL
                            ],
                            path2,
                          ) ||
                          []),
                      ]);
                    routes[m][path2].push([
                      handler,
                      paths.length === 2 && i === 0
                        ? paramCount - 1
                        : paramCount,
                    ]);
                  }
                });
              }
            }
            match(method, path) {
              clearWildcardRegExpCache();
              const matchers = this.buildAllMatchers();
              this.match = (method2, path2) => {
                const matcher = matchers[method2];
                const staticMatch = matcher[2][path2];
                if (staticMatch) return staticMatch;
                const match = path2.match(matcher[0]);
                if (!match) return [[], emptyParam];
                const index = match.indexOf('', 1);
                return [matcher[1][index], match];
              };
              return this.match(method, path);
            }
            buildAllMatchers() {
              const matchers = {};
              methodNames.forEach((method) => {
                matchers[method] =
                  this.buildMatcher(method) ||
                  matchers[
                    _router_js__WEBPACK_IMPORTED_MODULE_0__.METHOD_NAME_ALL
                  ];
              });
              this.middleware = this.routes = void 0;
              return matchers;
            }
            buildMatcher(method) {
              const routes = [];
              let hasOwnRoute =
                method ===
                _router_js__WEBPACK_IMPORTED_MODULE_0__.METHOD_NAME_ALL;
              [this.middleware, this.routes].forEach((r) => {
                const ownRoute = r[method]
                  ? Object.keys(r[method]).map((path) => [
                      path,
                      r[method][path],
                    ])
                  : [];
                if (ownRoute.length !== 0) {
                  hasOwnRoute || (hasOwnRoute = true);
                  routes.push(...ownRoute);
                } else if (
                  method !==
                  _router_js__WEBPACK_IMPORTED_MODULE_0__.METHOD_NAME_ALL
                )
                  routes.push(
                    ...Object.keys(
                      r[
                        _router_js__WEBPACK_IMPORTED_MODULE_0__.METHOD_NAME_ALL
                      ],
                    ).map((path) => [
                      path,
                      r[
                        _router_js__WEBPACK_IMPORTED_MODULE_0__.METHOD_NAME_ALL
                      ][path],
                    ]),
                  );
              });
              if (!hasOwnRoute) return null;
              else return buildMatcherFromPreprocessedRoutes(routes);
            }
          };
        },
      '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/router/reg-exp-router/trie.js':
        function (
          __unused_webpack___webpack_module__,
          __webpack_exports__2,
          __webpack_require__2,
        ) {
          'use strict';
          __webpack_require__2.r(__webpack_exports__2);
          __webpack_require__2.d(__webpack_exports__2, {
            Trie: function () {
              return Trie;
            },
          });
          var _node_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__2(
            /*! ./node.js */
            '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/router/reg-exp-router/node.js',
          );
          var Trie = class {
            constructor() {
              this.context = {
                varIndex: 0,
              };
              this.root = new _node_js__WEBPACK_IMPORTED_MODULE_0__.Node();
            }
            insert(path, index, pathErrorCheckOnly) {
              const paramAssoc = [];
              const groups = [];
              for (let i = 0; ; ) {
                let replaced = false;
                path = path.replace(/\{[^}]+\}/g, (m) => {
                  const mark = `@\\${i}`;
                  groups[i] = [mark, m];
                  i++;
                  replaced = true;
                  return mark;
                });
                if (!replaced) break;
              }
              const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
              for (let i = groups.length - 1; i >= 0; i--) {
                const [mark] = groups[i];
                for (let j = tokens.length - 1; j >= 0; j--)
                  if (tokens[j].indexOf(mark) !== -1) {
                    tokens[j] = tokens[j].replace(mark, groups[i][1]);
                    break;
                  }
              }
              this.root.insert(
                tokens,
                index,
                paramAssoc,
                this.context,
                pathErrorCheckOnly,
              );
              return paramAssoc;
            }
            buildRegExp() {
              let regexp = this.root.buildRegExpStr();
              if (regexp === '') return [/^$/, [], []];
              let captureIndex = 0;
              const indexReplacementMap = [];
              const paramReplacementMap = [];
              regexp = regexp.replace(
                /#(\d+)|@(\d+)|\.\*\$/g,
                (_, handlerIndex, paramIndex) => {
                  if (typeof handlerIndex !== 'undefined') {
                    indexReplacementMap[++captureIndex] = Number(handlerIndex);
                    return '$()';
                  }
                  if (typeof paramIndex !== 'undefined') {
                    paramReplacementMap[Number(paramIndex)] = ++captureIndex;
                    return '';
                  }
                  return '';
                },
              );
              return [
                new RegExp(`^${regexp}`),
                indexReplacementMap,
                paramReplacementMap,
              ];
            }
          };
        },
      '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/router/smart-router/index.js':
        function (
          __unused_webpack___webpack_module__,
          __webpack_exports__2,
          __webpack_require__2,
        ) {
          'use strict';
          __webpack_require__2.r(__webpack_exports__2);
          __webpack_require__2.d(__webpack_exports__2, {
            SmartRouter: function () {
              return _router_js__WEBPACK_IMPORTED_MODULE_0__.SmartRouter;
            },
          });
          var _router_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__2(
            /*! ./router.js */
            '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/router/smart-router/router.js',
          );
        },
      '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/router/smart-router/router.js':
        function (
          __unused_webpack___webpack_module__,
          __webpack_exports__2,
          __webpack_require__2,
        ) {
          'use strict';
          __webpack_require__2.r(__webpack_exports__2);
          __webpack_require__2.d(__webpack_exports__2, {
            SmartRouter: function () {
              return SmartRouter;
            },
          });
          var _router_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__2(
            /*! ../../router.js */
            '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/router.js',
          );
          var SmartRouter = class {
            constructor(init) {
              this.name = 'SmartRouter';
              this.routers = [];
              this.routes = [];
              Object.assign(this, init);
            }
            add(method, path, handler) {
              if (!this.routes)
                throw new Error(
                  _router_js__WEBPACK_IMPORTED_MODULE_0__.MESSAGE_MATCHER_IS_ALREADY_BUILT,
                );
              this.routes.push([method, path, handler]);
            }
            match(method, path) {
              if (!this.routes) throw new Error('Fatal error');
              const { routers, routes } = this;
              const len = routers.length;
              let i = 0;
              let res;
              for (; i < len; i++) {
                const router = routers[i];
                try {
                  routes.forEach((args) => {
                    router.add(...args);
                  });
                  res = router.match(method, path);
                } catch (e) {
                  if (
                    e instanceof
                    _router_js__WEBPACK_IMPORTED_MODULE_0__.UnsupportedPathError
                  )
                    continue;
                  throw e;
                }
                this.match = router.match.bind(router);
                this.routers = [router];
                this.routes = void 0;
                break;
              }
              if (i === len) throw new Error('Fatal error');
              this.name = `SmartRouter + ${this.activeRouter.name}`;
              return res;
            }
            get activeRouter() {
              if (this.routes || this.routers.length !== 1)
                throw new Error('No active router has been determined yet.');
              return this.routers[0];
            }
          };
        },
      '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/router/trie-router/index.js':
        function (
          __unused_webpack___webpack_module__,
          __webpack_exports__2,
          __webpack_require__2,
        ) {
          'use strict';
          __webpack_require__2.r(__webpack_exports__2);
          __webpack_require__2.d(__webpack_exports__2, {
            TrieRouter: function () {
              return _router_js__WEBPACK_IMPORTED_MODULE_0__.TrieRouter;
            },
          });
          var _router_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__2(
            /*! ./router.js */
            '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/router/trie-router/router.js',
          );
        },
      '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/router/trie-router/node.js':
        function (
          __unused_webpack___webpack_module__,
          __webpack_exports__2,
          __webpack_require__2,
        ) {
          'use strict';
          __webpack_require__2.r(__webpack_exports__2);
          __webpack_require__2.d(__webpack_exports__2, {
            Node: function () {
              return Node;
            },
          });
          var _router_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__2(
            /*! ../../router.js */
            '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/router.js',
          );
          var _utils_url_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__2(
            /*! ../../utils/url.js */
            '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/utils/url.js',
          );
          var Node = class {
            constructor(method, handler, children) {
              this.order = 0;
              this.params = {};
              this.children = children || {};
              this.methods = [];
              this.name = '';
              if (method && handler) {
                const m = {};
                m[method] = {
                  handler,
                  params: {},
                  possibleKeys: [],
                  score: 0,
                  name: this.name,
                };
                this.methods = [m];
              }
              this.patterns = [];
            }
            insert(method, path, handler) {
              this.name = `${method} ${path}`;
              this.order = ++this.order;
              let curNode = this;
              const parts = (0,
              _utils_url_js__WEBPACK_IMPORTED_MODULE_1__.splitRoutingPath)(
                path,
              );
              const possibleKeys = [];
              const parentPatterns = [];
              for (let i = 0, len = parts.length; i < len; i++) {
                const p = parts[i];
                if (Object.keys(curNode.children).includes(p)) {
                  parentPatterns.push(...curNode.patterns);
                  curNode = curNode.children[p];
                  const pattern2 = (0,
                  _utils_url_js__WEBPACK_IMPORTED_MODULE_1__.getPattern)(p);
                  if (pattern2) possibleKeys.push(pattern2[1]);
                  continue;
                }
                curNode.children[p] = new Node();
                const pattern = (0,
                _utils_url_js__WEBPACK_IMPORTED_MODULE_1__.getPattern)(p);
                if (pattern) {
                  curNode.patterns.push(pattern);
                  parentPatterns.push(...curNode.patterns);
                  possibleKeys.push(pattern[1]);
                }
                parentPatterns.push(...curNode.patterns);
                curNode = curNode.children[p];
              }
              if (!curNode.methods.length) curNode.methods = [];
              const m = {};
              const handlerSet = {
                handler,
                params: {},
                possibleKeys,
                name: this.name,
                score: this.order,
              };
              m[method] = handlerSet;
              curNode.methods.push(m);
              return curNode;
            }
            gHSets(node, method, params) {
              const handlerSets = [];
              for (let i = 0, len = node.methods.length; i < len; i++) {
                const m = node.methods[i];
                const handlerSet =
                  m[method] ||
                  m[_router_js__WEBPACK_IMPORTED_MODULE_0__.METHOD_NAME_ALL];
                if (handlerSet !== void 0) {
                  handlerSet.possibleKeys.map((key) => {
                    handlerSet.params[key] = params[key];
                  });
                  handlerSets.push(handlerSet);
                }
              }
              return handlerSets;
            }
            search(method, path) {
              const handlerSets = [];
              const params = {};
              this.params = {};
              const curNode = this;
              let curNodes = [curNode];
              const parts = (0,
              _utils_url_js__WEBPACK_IMPORTED_MODULE_1__.splitPath)(path);
              for (let i = 0, len = parts.length; i < len; i++) {
                const part = parts[i];
                const isLast = i === len - 1;
                const tempNodes = [];
                for (let j = 0, len2 = curNodes.length; j < len2; j++) {
                  const node = curNodes[j];
                  const nextNode = node.children[part];
                  if (nextNode) {
                    if (isLast === true) {
                      if (nextNode.children['*'])
                        handlerSets.push(
                          ...this.gHSets(nextNode.children['*'], method, {
                            ...params,
                            ...node.params,
                          }),
                        );
                      handlerSets.push(
                        ...this.gHSets(nextNode, method, {
                          ...params,
                          ...node.params,
                        }),
                      );
                    } else tempNodes.push(nextNode);
                  }
                  for (let k = 0, len3 = node.patterns.length; k < len3; k++) {
                    const pattern = node.patterns[k];
                    if (pattern === '*') {
                      const astNode = node.children['*'];
                      if (astNode) {
                        handlerSets.push(
                          ...this.gHSets(astNode, method, {
                            ...params,
                            ...node.params,
                          }),
                        );
                        tempNodes.push(astNode);
                      }
                      continue;
                    }
                    if (part === '') continue;
                    const [key, name, matcher] = pattern;
                    const child = node.children[key];
                    const restPathString = parts.slice(i).join('/');
                    if (
                      matcher instanceof RegExp &&
                      matcher.test(restPathString)
                    ) {
                      params[name] = restPathString;
                      handlerSets.push(
                        ...this.gHSets(child, method, {
                          ...params,
                          ...node.params,
                        }),
                      );
                      continue;
                    }
                    if (
                      matcher === true ||
                      (matcher instanceof RegExp && matcher.test(part))
                    ) {
                      if (typeof key === 'string') {
                        params[name] = part;
                        if (isLast === true) {
                          handlerSets.push(
                            ...this.gHSets(child, method, {
                              ...params,
                              ...node.params,
                            }),
                          );
                          if (child.children['*'])
                            handlerSets.push(
                              ...this.gHSets(child.children['*'], method, {
                                ...params,
                                ...node.params,
                              }),
                            );
                        } else {
                          child.params = {
                            ...params,
                          };
                          tempNodes.push(child);
                        }
                      }
                    }
                  }
                }
                curNodes = tempNodes;
              }
              const results = handlerSets.sort((a, b) => {
                return a.score - b.score;
              });
              return [
                results.map(({ handler, params: params2 }) => [
                  handler,
                  params2,
                ]),
              ];
            }
          };
        },
      '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/router/trie-router/router.js':
        function (
          __unused_webpack___webpack_module__,
          __webpack_exports__2,
          __webpack_require__2,
        ) {
          'use strict';
          __webpack_require__2.r(__webpack_exports__2);
          __webpack_require__2.d(__webpack_exports__2, {
            TrieRouter: function () {
              return TrieRouter;
            },
          });
          var _utils_url_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__2(
            /*! ../../utils/url.js */
            '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/utils/url.js',
          );
          var _node_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__2(
            /*! ./node.js */
            '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/router/trie-router/node.js',
          );
          var TrieRouter = class {
            constructor() {
              this.name = 'TrieRouter';
              this.node = new _node_js__WEBPACK_IMPORTED_MODULE_1__.Node();
            }
            add(method, path, handler) {
              const results = (0,
              _utils_url_js__WEBPACK_IMPORTED_MODULE_0__.checkOptionalParameter)(
                path,
              );
              if (results) {
                for (const p of results) this.node.insert(method, p, handler);
                return;
              }
              this.node.insert(method, path, handler);
            }
            match(method, path) {
              return this.node.search(method, path);
            }
          };
        },
      '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/utils/body.js':
        function (
          __unused_webpack___webpack_module__,
          __webpack_exports__2,
          __webpack_require__2,
        ) {
          'use strict';
          __webpack_require__2.r(__webpack_exports__2);
          __webpack_require__2.d(__webpack_exports__2, {
            parseBody: function () {
              return parseBody;
            },
          });
          var isArrayField = (value) => {
            return Array.isArray(value);
          };
          var parseBody = async (
            request,
            options = {
              all: false,
            },
          ) => {
            let body = {};
            const contentType = request.headers.get('Content-Type');
            if (
              contentType &&
              (contentType.startsWith('multipart/form-data') ||
                contentType.startsWith('application/x-www-form-urlencoded'))
            ) {
              const formData = await request.formData();
              if (formData) {
                const form = {};
                formData.forEach((value, key) => {
                  const shouldParseAllValues =
                    options.all || key.slice(-2) === '[]';
                  if (!shouldParseAllValues) {
                    form[key] = value;
                    return;
                  }
                  if (form[key] && isArrayField(form[key])) {
                    form[key].push(value);
                    return;
                  }
                  if (form[key]) {
                    form[key] = [form[key], value];
                    return;
                  }
                  form[key] = value;
                });
                body = form;
              }
            }
            return body;
          };
        },
      '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/utils/cookie.js':
        function (
          __unused_webpack___webpack_module__,
          __webpack_exports__2,
          __webpack_require__2,
        ) {
          'use strict';
          __webpack_require__2.r(__webpack_exports__2);
          __webpack_require__2.d(__webpack_exports__2, {
            parse: function () {
              return parse;
            },
            parseSigned: function () {
              return parseSigned;
            },
            serialize: function () {
              return serialize;
            },
            serializeSigned: function () {
              return serializeSigned;
            },
          });
          var _url_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__2(
            /*! ./url.js */
            '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/utils/url.js',
          );
          var algorithm = {
            name: 'HMAC',
            hash: 'SHA-256',
          };
          var getCryptoKey = async (secret) => {
            const secretBuf =
              typeof secret === 'string'
                ? new TextEncoder().encode(secret)
                : secret;
            return await crypto.subtle.importKey(
              'raw',
              secretBuf,
              algorithm,
              false,
              ['sign', 'verify'],
            );
          };
          var makeSignature = async (value, secret) => {
            const key = await getCryptoKey(secret);
            const signature = await crypto.subtle.sign(
              algorithm.name,
              key,
              new TextEncoder().encode(value),
            );
            return btoa(String.fromCharCode(...new Uint8Array(signature)));
          };
          var verifySignature = async (base64Signature, value, secret) => {
            try {
              const signatureBinStr = atob(base64Signature);
              const signature = new Uint8Array(signatureBinStr.length);
              for (let i = 0; i < signatureBinStr.length; i++)
                signature[i] = signatureBinStr.charCodeAt(i);
              return await crypto.subtle.verify(
                algorithm,
                secret,
                signature,
                new TextEncoder().encode(value),
              );
            } catch (e) {
              return false;
            }
          };
          var validCookieNameRegEx = /^[\w!#$%&'*.^`|~+-]+$/;
          var validCookieValueRegEx = /^[ !#-:<-[\]-~]*$/;
          var parse = (cookie, name) => {
            const pairs = cookie.trim().split(';');
            return pairs.reduce((parsedCookie, pairStr) => {
              pairStr = pairStr.trim();
              const valueStartPos = pairStr.indexOf('=');
              if (valueStartPos === -1) return parsedCookie;
              const cookieName = pairStr.substring(0, valueStartPos).trim();
              if (
                (name && name !== cookieName) ||
                !validCookieNameRegEx.test(cookieName)
              )
                return parsedCookie;
              let cookieValue = pairStr.substring(valueStartPos + 1).trim();
              if (cookieValue.startsWith('"') && cookieValue.endsWith('"'))
                cookieValue = cookieValue.slice(1, -1);
              if (validCookieValueRegEx.test(cookieValue))
                parsedCookie[cookieName] = (0,
                _url_js__WEBPACK_IMPORTED_MODULE_0__.decodeURIComponent_)(
                  cookieValue,
                );
              return parsedCookie;
            }, {});
          };
          var parseSigned = async (cookie, secret, name) => {
            const parsedCookie = {};
            const secretKey = await getCryptoKey(secret);
            for (const [key, value] of Object.entries(parse(cookie, name))) {
              const signatureStartPos = value.lastIndexOf('.');
              if (signatureStartPos < 1) continue;
              const signedValue = value.substring(0, signatureStartPos);
              const signature = value.substring(signatureStartPos + 1);
              if (signature.length !== 44 || !signature.endsWith('=')) continue;
              const isVerified = await verifySignature(
                signature,
                signedValue,
                secretKey,
              );
              parsedCookie[key] = isVerified ? signedValue : false;
            }
            return parsedCookie;
          };
          var _serialize = (name, value, opt = {}) => {
            let cookie = `${name}=${value}`;
            if (opt && typeof opt.maxAge === 'number' && opt.maxAge >= 0)
              cookie += `; Max-Age=${Math.floor(opt.maxAge)}`;
            if (opt.domain) cookie += `; Domain=${opt.domain}`;
            if (opt.path) cookie += `; Path=${opt.path}`;
            if (opt.expires) cookie += `; Expires=${opt.expires.toUTCString()}`;
            if (opt.httpOnly) cookie += '; HttpOnly';
            if (opt.secure) cookie += '; Secure';
            if (opt.sameSite) cookie += `; SameSite=${opt.sameSite}`;
            if (opt.partitioned) cookie += '; Partitioned';
            return cookie;
          };
          var serialize = (name, value, opt = {}) => {
            value = encodeURIComponent(value);
            return _serialize(name, value, opt);
          };
          var serializeSigned = async (name, value, secret, opt = {}) => {
            const signature = await makeSignature(value, secret);
            value = `${value}.${signature}`;
            value = encodeURIComponent(value);
            return _serialize(name, value, opt);
          };
        },
      '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/utils/html.js':
        function (
          __unused_webpack___webpack_module__,
          __webpack_exports__2,
          __webpack_require__2,
        ) {
          'use strict';
          __webpack_require__2.r(__webpack_exports__2);
          __webpack_require__2.d(__webpack_exports__2, {
            escapeToBuffer: function () {
              return escapeToBuffer;
            },
            resolveStream: function () {
              return resolveStream;
            },
            stringBufferToString: function () {
              return stringBufferToString;
            },
          });
          var _helper_html_index_js__WEBPACK_IMPORTED_MODULE_0__ =
            __webpack_require__2(
              /*! ../helper/html/index.js */
              '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/helper/html/index.js',
            );
          var escapeRe = /[&<>'"]/;
          var stringBufferToString = async (buffer) => {
            let str = '';
            const callbacks = [];
            for (let i = buffer.length - 1; i >= 0; i--) {
              let r = await buffer[i];
              if (typeof r === 'object') callbacks.push(...(r.callbacks || []));
              r = await (typeof r === 'object' ? r.toString() : r);
              if (typeof r === 'object') callbacks.push(...(r.callbacks || []));
              str += r;
            }
            return (0, _helper_html_index_js__WEBPACK_IMPORTED_MODULE_0__.raw)(
              str,
              callbacks,
            );
          };
          var escapeToBuffer = (str, buffer) => {
            const match = str.search(escapeRe);
            if (match === -1) {
              buffer[0] += str;
              return;
            }
            let escape;
            let index;
            let lastIndex = 0;
            for (index = match; index < str.length; index++) {
              switch (str.charCodeAt(index)) {
                case 34:
                  escape = '&quot;';
                  break;
                case 39:
                  escape = '&#39;';
                  break;
                case 38:
                  escape = '&amp;';
                  break;
                case 60:
                  escape = '&lt;';
                  break;
                case 62:
                  escape = '&gt;';
                  break;
                default:
                  continue;
              }
              buffer[0] += str.substring(lastIndex, index) + escape;
              lastIndex = index + 1;
            }
            buffer[0] += str.substring(lastIndex, index);
          };
          var resolveStream = (str, buffer) => {
            if (!str.callbacks?.length) return Promise.resolve(str);
            const callbacks = str.callbacks;
            if (buffer) buffer[0] += str;
            else buffer = [str];
            return Promise.all(
              callbacks.map((c) =>
                c({
                  buffer,
                }),
              ),
            ).then((res) =>
              Promise.all(res.map((str2) => resolveStream(str2, buffer))).then(
                () => buffer[0],
              ),
            );
          };
        },
      '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/utils/stream.js':
        function (
          __unused_webpack___webpack_module__,
          __webpack_exports__2,
          __webpack_require__2,
        ) {
          'use strict';
          __webpack_require__2.r(__webpack_exports__2);
          __webpack_require__2.d(__webpack_exports__2, {
            StreamingApi: function () {
              return StreamingApi;
            },
          });
          var StreamingApi = class {
            constructor(writable) {
              this.writable = writable;
              this.writer = writable.getWriter();
              this.encoder = new TextEncoder();
            }
            async write(input) {
              try {
                if (typeof input === 'string')
                  input = this.encoder.encode(input);
                await this.writer.write(input);
              } catch (e) {}
              return this;
            }
            async writeln(input) {
              await this.write(input + '\n');
              return this;
            }
            sleep(ms) {
              return new Promise((res) => setTimeout(res, ms));
            }
            async close() {
              try {
                await this.writer.close();
              } catch (e) {}
            }
            async pipe(body) {
              this.writer.releaseLock();
              await body.pipeTo(this.writable, {
                preventClose: true,
              });
              this.writer = this.writable.getWriter();
            }
          };
        },
      '../../node_modules/.pnpm/hono@3.11.4/node_modules/hono/dist/utils/url.js':
        function (
          __unused_webpack___webpack_module__,
          __webpack_exports__2,
          __webpack_require__2,
        ) {
          'use strict';
          __webpack_require__2.r(__webpack_exports__2);
          __webpack_require__2.d(__webpack_exports__2, {
            checkOptionalParameter: function () {
              return checkOptionalParameter;
            },
            decodeURIComponent_: function () {
              return decodeURIComponent_;
            },
            getPath: function () {
              return getPath;
            },
            getPathNoStrict: function () {
              return getPathNoStrict;
            },
            getPattern: function () {
              return getPattern;
            },
            getQueryParam: function () {
              return getQueryParam;
            },
            getQueryParams: function () {
              return getQueryParams;
            },
            getQueryStrings: function () {
              return getQueryStrings;
            },
            mergePath: function () {
              return mergePath;
            },
            splitPath: function () {
              return splitPath;
            },
            splitRoutingPath: function () {
              return splitRoutingPath;
            },
          });
          var splitPath = (path) => {
            const paths = path.split('/');
            if (paths[0] === '') paths.shift();
            return paths;
          };
          var splitRoutingPath = (path) => {
            const groups = [];
            for (let i = 0; ; ) {
              let replaced = false;
              path = path.replace(/\{[^}]+\}/g, (m) => {
                const mark = `@\\${i}`;
                groups[i] = [mark, m];
                i++;
                replaced = true;
                return mark;
              });
              if (!replaced) break;
            }
            const paths = path.split('/');
            if (paths[0] === '') paths.shift();
            for (let i = groups.length - 1; i >= 0; i--) {
              const [mark] = groups[i];
              for (let j = paths.length - 1; j >= 0; j--)
                if (paths[j].indexOf(mark) !== -1) {
                  paths[j] = paths[j].replace(mark, groups[i][1]);
                  break;
                }
            }
            return paths;
          };
          var patternCache = {};
          var getPattern = (label) => {
            if (label === '*') return '*';
            const match = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
            if (match) {
              if (!patternCache[label]) {
                if (match[2])
                  patternCache[label] = [
                    label,
                    match[1],
                    new RegExp('^' + match[2] + '$'),
                  ];
                else patternCache[label] = [label, match[1], true];
              }
              return patternCache[label];
            }
            return null;
          };
          var getPath = (request) => {
            const match = request.url.match(/^https?:\/\/[^/]+(\/[^?]*)/);
            return match ? match[1] : '';
          };
          var getQueryStrings = (url) => {
            const queryIndex = url.indexOf('?', 8);
            return queryIndex === -1 ? '' : '?' + url.slice(queryIndex + 1);
          };
          var getPathNoStrict = (request) => {
            const result = getPath(request);
            return result.length > 1 && result[result.length - 1] === '/'
              ? result.slice(0, -1)
              : result;
          };
          var mergePath = (...paths) => {
            let p = '';
            let endsWithSlash = false;
            for (let path of paths) {
              if (p[p.length - 1] === '/') {
                p = p.slice(0, -1);
                endsWithSlash = true;
              }
              if (path[0] !== '/') path = `/${path}`;
              if (path === '/' && endsWithSlash) p = `${p}/`;
              else if (path !== '/') p = `${p}${path}`;
              if (path === '/' && p === '') p = '/';
            }
            return p;
          };
          var checkOptionalParameter = (path) => {
            const match = path.match(/^(.+|)(\/\:[^\/]+)\?$/);
            if (!match) return null;
            const base = match[1];
            const optional = base + match[2];
            return [base === '' ? '/' : base.replace(/\/$/, ''), optional];
          };
          var _decodeURI = (value) => {
            if (!/[%+]/.test(value)) return value;
            if (value.indexOf('+') !== -1) value = value.replace(/\+/g, ' ');
            return /%/.test(value) ? decodeURIComponent_(value) : value;
          };
          var _getQueryParam = (url, key, multiple) => {
            let encoded;
            if (!multiple && key && !/[%+]/.test(key)) {
              let keyIndex2 = url.indexOf(`?${key}`, 8);
              if (keyIndex2 === -1) keyIndex2 = url.indexOf(`&${key}`, 8);
              while (keyIndex2 !== -1) {
                const trailingKeyCode = url.charCodeAt(
                  keyIndex2 + key.length + 1,
                );
                if (trailingKeyCode === 61) {
                  const valueIndex = keyIndex2 + key.length + 2;
                  const endIndex = url.indexOf('&', valueIndex);
                  return _decodeURI(
                    url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex),
                  );
                } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode))
                  return '';
                keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
              }
              encoded = /[%+]/.test(url);
              if (!encoded) return void 0;
            }
            const results = {};
            encoded ?? (encoded = /[%+]/.test(url));
            let keyIndex = url.indexOf('?', 8);
            while (keyIndex !== -1) {
              const nextKeyIndex = url.indexOf('&', keyIndex + 1);
              let valueIndex = url.indexOf('=', keyIndex);
              if (valueIndex > nextKeyIndex && nextKeyIndex !== -1)
                valueIndex = -1;
              let name = url.slice(
                keyIndex + 1,
                valueIndex === -1
                  ? nextKeyIndex === -1
                    ? void 0
                    : nextKeyIndex
                  : valueIndex,
              );
              if (encoded) name = _decodeURI(name);
              keyIndex = nextKeyIndex;
              if (name === '') continue;
              let value;
              if (valueIndex === -1) value = '';
              else {
                value = url.slice(
                  valueIndex + 1,
                  nextKeyIndex === -1 ? void 0 : nextKeyIndex,
                );
                if (encoded) value = _decodeURI(value);
              }
              if (multiple) (results[name] ?? (results[name] = [])).push(value);
              else results[name] ?? (results[name] = value);
            }
            return key ? results[key] : results;
          };
          var getQueryParam = _getQueryParam;
          var getQueryParams = (url, key) => {
            return _getQueryParam(url, key, true);
          };
          var decodeURIComponent_ = decodeURIComponent;
        },
    };
    var __webpack_module_cache__ = {};
    function __webpack_require__(moduleId) {
      var cachedModule = __webpack_module_cache__[moduleId];
      if (cachedModule !== void 0) {
        return cachedModule.exports;
      }
      var module = (__webpack_module_cache__[moduleId] = {
        exports: {},
      });
      __webpack_modules__[moduleId](
        module,
        module.exports,
        __webpack_require__,
      );
      return module.exports;
    }
    !(function () {
      __webpack_require__.o = function (obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
      };
    })();
    !(function () {
      __webpack_require__.d = function (exports, definition) {
        for (var key in definition) {
          if (
            __webpack_require__.o(definition, key) &&
            !__webpack_require__.o(exports, key)
          ) {
            Object.defineProperty(exports, key, {
              enumerable: true,
              get: definition[key],
            });
          }
        }
      };
    })();
    !(function () {
      __webpack_require__.r = function (exports) {
        if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
          Object.defineProperty(exports, Symbol.toStringTag, {
            value: 'Module',
          });
        }
        Object.defineProperty(exports, '__esModule', { value: true });
      };
    })();
    var __webpack_exports__ = __webpack_require__('./src/index.ts');
  })();
})();
//# sourceMappingURL=index.js.map
