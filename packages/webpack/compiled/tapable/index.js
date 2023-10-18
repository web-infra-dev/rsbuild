(() => {
  'use strict';
  var e = {
    410: (e, t, n) => {
      const o = n(506);
      const r = n(507);
      class AsyncParallelBailHookCodeFactory extends r {
        content({ onError: e, onResult: t, onDone: n }) {
          let o = '';
          o += `var _results = new Array(${this.options.taps.length});\n`;
          o += 'var _checkDone = function() {\n';
          o += 'for(var i = 0; i < _results.length; i++) {\n';
          o += 'var item = _results[i];\n';
          o += 'if(item === undefined) return false;\n';
          o += 'if(item.result !== undefined) {\n';
          o += t('item.result');
          o += 'return true;\n';
          o += '}\n';
          o += 'if(item.error) {\n';
          o += e('item.error');
          o += 'return true;\n';
          o += '}\n';
          o += '}\n';
          o += 'return false;\n';
          o += '}\n';
          o += this.callTapsParallel({
            onError: (e, t, n, o) => {
              let r = '';
              r += `if(${e} < _results.length && ((_results.length = ${
                e + 1
              }), (_results[${e}] = { error: ${t} }), _checkDone())) {\n`;
              r += o(true);
              r += '} else {\n';
              r += n();
              r += '}\n';
              return r;
            },
            onResult: (e, t, n, o) => {
              let r = '';
              r += `if(${e} < _results.length && (${t} !== undefined && (_results.length = ${
                e + 1
              }), (_results[${e}] = { result: ${t} }), _checkDone())) {\n`;
              r += o(true);
              r += '} else {\n';
              r += n();
              r += '}\n';
              return r;
            },
            onTap: (e, t, n, o) => {
              let r = '';
              if (e > 0) {
                r += `if(${e} >= _results.length) {\n`;
                r += n();
                r += '} else {\n';
              }
              r += t();
              if (e > 0) r += '}\n';
              return r;
            },
            onDone: n,
          });
          return o;
        }
      }
      const s = new AsyncParallelBailHookCodeFactory();
      const COMPILE = function (e) {
        s.setup(this, e);
        return s.create(e);
      };
      function AsyncParallelBailHook(e = [], t = undefined) {
        const n = new o(e, t);
        n.constructor = AsyncParallelBailHook;
        n.compile = COMPILE;
        n._call = undefined;
        n.call = undefined;
        return n;
      }
      AsyncParallelBailHook.prototype = null;
      e.exports = AsyncParallelBailHook;
    },
    598: (e, t, n) => {
      const o = n(506);
      const r = n(507);
      class AsyncParallelHookCodeFactory extends r {
        content({ onError: e, onDone: t }) {
          return this.callTapsParallel({
            onError: (t, n, o, r) => e(n) + r(true),
            onDone: t,
          });
        }
      }
      const s = new AsyncParallelHookCodeFactory();
      const COMPILE = function (e) {
        s.setup(this, e);
        return s.create(e);
      };
      function AsyncParallelHook(e = [], t = undefined) {
        const n = new o(e, t);
        n.constructor = AsyncParallelHook;
        n.compile = COMPILE;
        n._call = undefined;
        n.call = undefined;
        return n;
      }
      AsyncParallelHook.prototype = null;
      e.exports = AsyncParallelHook;
    },
    178: (e, t, n) => {
      const o = n(506);
      const r = n(507);
      class AsyncSeriesBailHookCodeFactory extends r {
        content({ onError: e, onResult: t, resultReturns: n, onDone: o }) {
          return this.callTapsSeries({
            onError: (t, n, o, r) => e(n) + r(true),
            onResult: (e, n, o) =>
              `if(${n} !== undefined) {\n${t(n)}\n} else {\n${o()}}\n`,
            resultReturns: n,
            onDone: o,
          });
        }
      }
      const s = new AsyncSeriesBailHookCodeFactory();
      const COMPILE = function (e) {
        s.setup(this, e);
        return s.create(e);
      };
      function AsyncSeriesBailHook(e = [], t = undefined) {
        const n = new o(e, t);
        n.constructor = AsyncSeriesBailHook;
        n.compile = COMPILE;
        n._call = undefined;
        n.call = undefined;
        return n;
      }
      AsyncSeriesBailHook.prototype = null;
      e.exports = AsyncSeriesBailHook;
    },
    97: (e, t, n) => {
      const o = n(506);
      const r = n(507);
      class AsyncSeriesHookCodeFactory extends r {
        content({ onError: e, onDone: t }) {
          return this.callTapsSeries({
            onError: (t, n, o, r) => e(n) + r(true),
            onDone: t,
          });
        }
      }
      const s = new AsyncSeriesHookCodeFactory();
      const COMPILE = function (e) {
        s.setup(this, e);
        return s.create(e);
      };
      function AsyncSeriesHook(e = [], t = undefined) {
        const n = new o(e, t);
        n.constructor = AsyncSeriesHook;
        n.compile = COMPILE;
        n._call = undefined;
        n.call = undefined;
        return n;
      }
      AsyncSeriesHook.prototype = null;
      e.exports = AsyncSeriesHook;
    },
    243: (e, t, n) => {
      const o = n(506);
      const r = n(507);
      class AsyncSeriesLoopHookCodeFactory extends r {
        content({ onError: e, onDone: t }) {
          return this.callTapsLooping({
            onError: (t, n, o, r) => e(n) + r(true),
            onDone: t,
          });
        }
      }
      const s = new AsyncSeriesLoopHookCodeFactory();
      const COMPILE = function (e) {
        s.setup(this, e);
        return s.create(e);
      };
      function AsyncSeriesLoopHook(e = [], t = undefined) {
        const n = new o(e, t);
        n.constructor = AsyncSeriesLoopHook;
        n.compile = COMPILE;
        n._call = undefined;
        n.call = undefined;
        return n;
      }
      AsyncSeriesLoopHook.prototype = null;
      e.exports = AsyncSeriesLoopHook;
    },
    969: (e, t, n) => {
      const o = n(506);
      const r = n(507);
      class AsyncSeriesWaterfallHookCodeFactory extends r {
        content({ onError: e, onResult: t, onDone: n }) {
          return this.callTapsSeries({
            onError: (t, n, o, r) => e(n) + r(true),
            onResult: (e, t, n) => {
              let o = '';
              o += `if(${t} !== undefined) {\n`;
              o += `${this._args[0]} = ${t};\n`;
              o += `}\n`;
              o += n();
              return o;
            },
            onDone: () => t(this._args[0]),
          });
        }
      }
      const s = new AsyncSeriesWaterfallHookCodeFactory();
      const COMPILE = function (e) {
        s.setup(this, e);
        return s.create(e);
      };
      function AsyncSeriesWaterfallHook(e = [], t = undefined) {
        if (e.length < 1)
          throw new Error('Waterfall hooks must have at least one argument');
        const n = new o(e, t);
        n.constructor = AsyncSeriesWaterfallHook;
        n.compile = COMPILE;
        n._call = undefined;
        n.call = undefined;
        return n;
      }
      AsyncSeriesWaterfallHook.prototype = null;
      e.exports = AsyncSeriesWaterfallHook;
    },
    506: (e, t, n) => {
      const o = n(837);
      const r = o.deprecate(
        () => {},
        'Hook.context is deprecated and will be removed',
      );
      const CALL_DELEGATE = function (...e) {
        this.call = this._createCall('sync');
        return this.call(...e);
      };
      const CALL_ASYNC_DELEGATE = function (...e) {
        this.callAsync = this._createCall('async');
        return this.callAsync(...e);
      };
      const PROMISE_DELEGATE = function (...e) {
        this.promise = this._createCall('promise');
        return this.promise(...e);
      };
      class Hook {
        constructor(e = [], t = undefined) {
          this._args = e;
          this.name = t;
          this.taps = [];
          this.interceptors = [];
          this._call = CALL_DELEGATE;
          this.call = CALL_DELEGATE;
          this._callAsync = CALL_ASYNC_DELEGATE;
          this.callAsync = CALL_ASYNC_DELEGATE;
          this._promise = PROMISE_DELEGATE;
          this.promise = PROMISE_DELEGATE;
          this._x = undefined;
          this.compile = this.compile;
          this.tap = this.tap;
          this.tapAsync = this.tapAsync;
          this.tapPromise = this.tapPromise;
        }
        compile(e) {
          throw new Error('Abstract: should be overridden');
        }
        _createCall(e) {
          return this.compile({
            taps: this.taps,
            interceptors: this.interceptors,
            args: this._args,
            type: e,
          });
        }
        _tap(e, t, n) {
          if (typeof t === 'string') {
            t = { name: t.trim() };
          } else if (typeof t !== 'object' || t === null) {
            throw new Error('Invalid tap options');
          }
          if (typeof t.name !== 'string' || t.name === '') {
            throw new Error('Missing name for tap');
          }
          if (typeof t.context !== 'undefined') {
            r();
          }
          t = Object.assign({ type: e, fn: n }, t);
          t = this._runRegisterInterceptors(t);
          this._insert(t);
        }
        tap(e, t) {
          this._tap('sync', e, t);
        }
        tapAsync(e, t) {
          this._tap('async', e, t);
        }
        tapPromise(e, t) {
          this._tap('promise', e, t);
        }
        _runRegisterInterceptors(e) {
          for (const t of this.interceptors) {
            if (t.register) {
              const n = t.register(e);
              if (n !== undefined) {
                e = n;
              }
            }
          }
          return e;
        }
        withOptions(e) {
          const mergeOptions = (t) =>
            Object.assign({}, e, typeof t === 'string' ? { name: t } : t);
          return {
            name: this.name,
            tap: (e, t) => this.tap(mergeOptions(e), t),
            tapAsync: (e, t) => this.tapAsync(mergeOptions(e), t),
            tapPromise: (e, t) => this.tapPromise(mergeOptions(e), t),
            intercept: (e) => this.intercept(e),
            isUsed: () => this.isUsed(),
            withOptions: (e) => this.withOptions(mergeOptions(e)),
          };
        }
        isUsed() {
          return this.taps.length > 0 || this.interceptors.length > 0;
        }
        intercept(e) {
          this._resetCompilation();
          this.interceptors.push(Object.assign({}, e));
          if (e.register) {
            for (let t = 0; t < this.taps.length; t++) {
              this.taps[t] = e.register(this.taps[t]);
            }
          }
        }
        _resetCompilation() {
          this.call = this._call;
          this.callAsync = this._callAsync;
          this.promise = this._promise;
        }
        _insert(e) {
          this._resetCompilation();
          let t;
          if (typeof e.before === 'string') {
            t = new Set([e.before]);
          } else if (Array.isArray(e.before)) {
            t = new Set(e.before);
          }
          let n = 0;
          if (typeof e.stage === 'number') {
            n = e.stage;
          }
          let o = this.taps.length;
          while (o > 0) {
            o--;
            const e = this.taps[o];
            this.taps[o + 1] = e;
            const r = e.stage || 0;
            if (t) {
              if (t.has(e.name)) {
                t.delete(e.name);
                continue;
              }
              if (t.size > 0) {
                continue;
              }
            }
            if (r > n) {
              continue;
            }
            o++;
            break;
          }
          this.taps[o] = e;
        }
      }
      Object.setPrototypeOf(Hook.prototype, null);
      e.exports = Hook;
    },
    507: (e) => {
      class HookCodeFactory {
        constructor(e) {
          this.config = e;
          this.options = undefined;
          this._args = undefined;
        }
        create(e) {
          this.init(e);
          let t;
          switch (this.options.type) {
            case 'sync':
              t = new Function(
                this.args(),
                '"use strict";\n' +
                  this.header() +
                  this.contentWithInterceptors({
                    onError: (e) => `throw ${e};\n`,
                    onResult: (e) => `return ${e};\n`,
                    resultReturns: true,
                    onDone: () => '',
                    rethrowIfPossible: true,
                  }),
              );
              break;
            case 'async':
              t = new Function(
                this.args({ after: '_callback' }),
                '"use strict";\n' +
                  this.header() +
                  this.contentWithInterceptors({
                    onError: (e) => `_callback(${e});\n`,
                    onResult: (e) => `_callback(null, ${e});\n`,
                    onDone: () => '_callback();\n',
                  }),
              );
              break;
            case 'promise':
              let e = false;
              const n = this.contentWithInterceptors({
                onError: (t) => {
                  e = true;
                  return `_error(${t});\n`;
                },
                onResult: (e) => `_resolve(${e});\n`,
                onDone: () => '_resolve();\n',
              });
              let o = '';
              o += '"use strict";\n';
              o += this.header();
              o += 'return new Promise((function(_resolve, _reject) {\n';
              if (e) {
                o += 'var _sync = true;\n';
                o += 'function _error(_err) {\n';
                o += 'if(_sync)\n';
                o +=
                  '_resolve(Promise.resolve().then((function() { throw _err; })));\n';
                o += 'else\n';
                o += '_reject(_err);\n';
                o += '};\n';
              }
              o += n;
              if (e) {
                o += '_sync = false;\n';
              }
              o += '}));\n';
              t = new Function(this.args(), o);
              break;
          }
          this.deinit();
          return t;
        }
        setup(e, t) {
          e._x = t.taps.map((e) => e.fn);
        }
        init(e) {
          this.options = e;
          this._args = e.args.slice();
        }
        deinit() {
          this.options = undefined;
          this._args = undefined;
        }
        contentWithInterceptors(e) {
          if (this.options.interceptors.length > 0) {
            const t = e.onError;
            const n = e.onResult;
            const o = e.onDone;
            let r = '';
            for (let e = 0; e < this.options.interceptors.length; e++) {
              const t = this.options.interceptors[e];
              if (t.call) {
                r += `${this.getInterceptor(e)}.call(${this.args({
                  before: t.context ? '_context' : undefined,
                })});\n`;
              }
            }
            r += this.content(
              Object.assign(e, {
                onError:
                  t &&
                  ((e) => {
                    let n = '';
                    for (let t = 0; t < this.options.interceptors.length; t++) {
                      const o = this.options.interceptors[t];
                      if (o.error) {
                        n += `${this.getInterceptor(t)}.error(${e});\n`;
                      }
                    }
                    n += t(e);
                    return n;
                  }),
                onResult:
                  n &&
                  ((e) => {
                    let t = '';
                    for (let n = 0; n < this.options.interceptors.length; n++) {
                      const o = this.options.interceptors[n];
                      if (o.result) {
                        t += `${this.getInterceptor(n)}.result(${e});\n`;
                      }
                    }
                    t += n(e);
                    return t;
                  }),
                onDone:
                  o &&
                  (() => {
                    let e = '';
                    for (let t = 0; t < this.options.interceptors.length; t++) {
                      const n = this.options.interceptors[t];
                      if (n.done) {
                        e += `${this.getInterceptor(t)}.done();\n`;
                      }
                    }
                    e += o();
                    return e;
                  }),
              }),
            );
            return r;
          } else {
            return this.content(e);
          }
        }
        header() {
          let e = '';
          if (this.needContext()) {
            e += 'var _context = {};\n';
          } else {
            e += 'var _context;\n';
          }
          e += 'var _x = this._x;\n';
          if (this.options.interceptors.length > 0) {
            e += 'var _taps = this.taps;\n';
            e += 'var _interceptors = this.interceptors;\n';
          }
          return e;
        }
        needContext() {
          for (const e of this.options.taps) if (e.context) return true;
          return false;
        }
        callTap(
          e,
          { onError: t, onResult: n, onDone: o, rethrowIfPossible: r },
        ) {
          let s = '';
          let i = false;
          for (let t = 0; t < this.options.interceptors.length; t++) {
            const n = this.options.interceptors[t];
            if (n.tap) {
              if (!i) {
                s += `var _tap${e} = ${this.getTap(e)};\n`;
                i = true;
              }
              s += `${this.getInterceptor(t)}.tap(${
                n.context ? '_context, ' : ''
              }_tap${e});\n`;
            }
          }
          s += `var _fn${e} = ${this.getTapFn(e)};\n`;
          const c = this.options.taps[e];
          switch (c.type) {
            case 'sync':
              if (!r) {
                s += `var _hasError${e} = false;\n`;
                s += 'try {\n';
              }
              if (n) {
                s += `var _result${e} = _fn${e}(${this.args({
                  before: c.context ? '_context' : undefined,
                })});\n`;
              } else {
                s += `_fn${e}(${this.args({
                  before: c.context ? '_context' : undefined,
                })});\n`;
              }
              if (!r) {
                s += '} catch(_err) {\n';
                s += `_hasError${e} = true;\n`;
                s += t('_err');
                s += '}\n';
                s += `if(!_hasError${e}) {\n`;
              }
              if (n) {
                s += n(`_result${e}`);
              }
              if (o) {
                s += o();
              }
              if (!r) {
                s += '}\n';
              }
              break;
            case 'async':
              let i = '';
              if (n) i += `(function(_err${e}, _result${e}) {\n`;
              else i += `(function(_err${e}) {\n`;
              i += `if(_err${e}) {\n`;
              i += t(`_err${e}`);
              i += '} else {\n';
              if (n) {
                i += n(`_result${e}`);
              }
              if (o) {
                i += o();
              }
              i += '}\n';
              i += '})';
              s += `_fn${e}(${this.args({
                before: c.context ? '_context' : undefined,
                after: i,
              })});\n`;
              break;
            case 'promise':
              s += `var _hasResult${e} = false;\n`;
              s += `var _promise${e} = _fn${e}(${this.args({
                before: c.context ? '_context' : undefined,
              })});\n`;
              s += `if (!_promise${e} || !_promise${e}.then)\n`;
              s += `  throw new Error('Tap function (tapPromise) did not return promise (returned ' + _promise${e} + ')');\n`;
              s += `_promise${e}.then((function(_result${e}) {\n`;
              s += `_hasResult${e} = true;\n`;
              if (n) {
                s += n(`_result${e}`);
              }
              if (o) {
                s += o();
              }
              s += `}), function(_err${e}) {\n`;
              s += `if(_hasResult${e}) throw _err${e};\n`;
              s += t(`_err${e}`);
              s += '});\n';
              break;
          }
          return s;
        }
        callTapsSeries({
          onError: e,
          onResult: t,
          resultReturns: n,
          onDone: o,
          doneReturns: r,
          rethrowIfPossible: s,
        }) {
          if (this.options.taps.length === 0) return o();
          const i = this.options.taps.findIndex((e) => e.type !== 'sync');
          const c = n || r;
          let a = '';
          let l = o;
          let p = 0;
          for (let n = this.options.taps.length - 1; n >= 0; n--) {
            const r = n;
            const u =
              l !== o && (this.options.taps[r].type !== 'sync' || p++ > 20);
            if (u) {
              p = 0;
              a += `function _next${r}() {\n`;
              a += l();
              a += `}\n`;
              l = () => `${c ? 'return ' : ''}_next${r}();\n`;
            }
            const f = l;
            const doneBreak = (e) => {
              if (e) return '';
              return o();
            };
            const h = this.callTap(r, {
              onError: (t) => e(r, t, f, doneBreak),
              onResult: t && ((e) => t(r, e, f, doneBreak)),
              onDone: !t && f,
              rethrowIfPossible: s && (i < 0 || r < i),
            });
            l = () => h;
          }
          a += l();
          return a;
        }
        callTapsLooping({ onError: e, onDone: t, rethrowIfPossible: n }) {
          if (this.options.taps.length === 0) return t();
          const o = this.options.taps.every((e) => e.type === 'sync');
          let r = '';
          if (!o) {
            r += 'var _looper = (function() {\n';
            r += 'var _loopAsync = false;\n';
          }
          r += 'var _loop;\n';
          r += 'do {\n';
          r += '_loop = false;\n';
          for (let e = 0; e < this.options.interceptors.length; e++) {
            const t = this.options.interceptors[e];
            if (t.loop) {
              r += `${this.getInterceptor(e)}.loop(${this.args({
                before: t.context ? '_context' : undefined,
              })});\n`;
            }
          }
          r += this.callTapsSeries({
            onError: e,
            onResult: (e, t, n, r) => {
              let s = '';
              s += `if(${t} !== undefined) {\n`;
              s += '_loop = true;\n';
              if (!o) s += 'if(_loopAsync) _looper();\n';
              s += r(true);
              s += `} else {\n`;
              s += n();
              s += `}\n`;
              return s;
            },
            onDone:
              t &&
              (() => {
                let e = '';
                e += 'if(!_loop) {\n';
                e += t();
                e += '}\n';
                return e;
              }),
            rethrowIfPossible: n && o,
          });
          r += '} while(_loop);\n';
          if (!o) {
            r += '_loopAsync = true;\n';
            r += '});\n';
            r += '_looper();\n';
          }
          return r;
        }
        callTapsParallel({
          onError: e,
          onResult: t,
          onDone: n,
          rethrowIfPossible: o,
          onTap: r = (e, t) => t(),
        }) {
          if (this.options.taps.length <= 1) {
            return this.callTapsSeries({
              onError: e,
              onResult: t,
              onDone: n,
              rethrowIfPossible: o,
            });
          }
          let s = '';
          s += 'do {\n';
          s += `var _counter = ${this.options.taps.length};\n`;
          if (n) {
            s += 'var _done = (function() {\n';
            s += n();
            s += '});\n';
          }
          for (let i = 0; i < this.options.taps.length; i++) {
            const done = () => {
              if (n) return 'if(--_counter === 0) _done();\n';
              else return '--_counter;';
            };
            const doneBreak = (e) => {
              if (e || !n) return '_counter = 0;\n';
              else return '_counter = 0;\n_done();\n';
            };
            s += 'if(_counter <= 0) break;\n';
            s += r(
              i,
              () =>
                this.callTap(i, {
                  onError: (t) => {
                    let n = '';
                    n += 'if(_counter > 0) {\n';
                    n += e(i, t, done, doneBreak);
                    n += '}\n';
                    return n;
                  },
                  onResult:
                    t &&
                    ((e) => {
                      let n = '';
                      n += 'if(_counter > 0) {\n';
                      n += t(i, e, done, doneBreak);
                      n += '}\n';
                      return n;
                    }),
                  onDone: !t && (() => done()),
                  rethrowIfPossible: o,
                }),
              done,
              doneBreak,
            );
          }
          s += '} while(false);\n';
          return s;
        }
        args({ before: e, after: t } = {}) {
          let n = this._args;
          if (e) n = [e].concat(n);
          if (t) n = n.concat(t);
          if (n.length === 0) {
            return '';
          } else {
            return n.join(', ');
          }
        }
        getTapFn(e) {
          return `_x[${e}]`;
        }
        getTap(e) {
          return `_taps[${e}]`;
        }
        getInterceptor(e) {
          return `_interceptors[${e}]`;
        }
      }
      e.exports = HookCodeFactory;
    },
    876: (e, t, n) => {
      const o = n(837);
      const defaultFactory = (e, t) => t;
      class HookMap {
        constructor(e, t = undefined) {
          this._map = new Map();
          this.name = t;
          this._factory = e;
          this._interceptors = [];
        }
        get(e) {
          return this._map.get(e);
        }
        for(e) {
          const t = this.get(e);
          if (t !== undefined) {
            return t;
          }
          let n = this._factory(e);
          const o = this._interceptors;
          for (let t = 0; t < o.length; t++) {
            n = o[t].factory(e, n);
          }
          this._map.set(e, n);
          return n;
        }
        intercept(e) {
          this._interceptors.push(
            Object.assign({ factory: defaultFactory }, e),
          );
        }
      }
      HookMap.prototype.tap = o.deprecate(function (e, t, n) {
        return this.for(e).tap(t, n);
      }, 'HookMap#tap(key,…) is deprecated. Use HookMap#for(key).tap(…) instead.');
      HookMap.prototype.tapAsync = o.deprecate(function (e, t, n) {
        return this.for(e).tapAsync(t, n);
      }, 'HookMap#tapAsync(key,…) is deprecated. Use HookMap#for(key).tapAsync(…) instead.');
      HookMap.prototype.tapPromise = o.deprecate(function (e, t, n) {
        return this.for(e).tapPromise(t, n);
      }, 'HookMap#tapPromise(key,…) is deprecated. Use HookMap#for(key).tapPromise(…) instead.');
      e.exports = HookMap;
    },
    274: (e, t, n) => {
      const o = n(506);
      class MultiHook {
        constructor(e, t = undefined) {
          this.hooks = e;
          this.name = t;
        }
        tap(e, t) {
          for (const n of this.hooks) {
            n.tap(e, t);
          }
        }
        tapAsync(e, t) {
          for (const n of this.hooks) {
            n.tapAsync(e, t);
          }
        }
        tapPromise(e, t) {
          for (const n of this.hooks) {
            n.tapPromise(e, t);
          }
        }
        isUsed() {
          for (const e of this.hooks) {
            if (e.isUsed()) return true;
          }
          return false;
        }
        intercept(e) {
          for (const t of this.hooks) {
            t.intercept(e);
          }
        }
        withOptions(e) {
          return new MultiHook(
            this.hooks.map((t) => t.withOptions(e)),
            this.name,
          );
        }
      }
      e.exports = MultiHook;
    },
    130: (e, t, n) => {
      const o = n(506);
      const r = n(507);
      class SyncBailHookCodeFactory extends r {
        content({
          onError: e,
          onResult: t,
          resultReturns: n,
          onDone: o,
          rethrowIfPossible: r,
        }) {
          return this.callTapsSeries({
            onError: (t, n) => e(n),
            onResult: (e, n, o) =>
              `if(${n} !== undefined) {\n${t(n)};\n} else {\n${o()}}\n`,
            resultReturns: n,
            onDone: o,
            rethrowIfPossible: r,
          });
        }
      }
      const s = new SyncBailHookCodeFactory();
      const TAP_ASYNC = () => {
        throw new Error('tapAsync is not supported on a SyncBailHook');
      };
      const TAP_PROMISE = () => {
        throw new Error('tapPromise is not supported on a SyncBailHook');
      };
      const COMPILE = function (e) {
        s.setup(this, e);
        return s.create(e);
      };
      function SyncBailHook(e = [], t = undefined) {
        const n = new o(e, t);
        n.constructor = SyncBailHook;
        n.tapAsync = TAP_ASYNC;
        n.tapPromise = TAP_PROMISE;
        n.compile = COMPILE;
        return n;
      }
      SyncBailHook.prototype = null;
      e.exports = SyncBailHook;
    },
    856: (e, t, n) => {
      const o = n(506);
      const r = n(507);
      class SyncHookCodeFactory extends r {
        content({ onError: e, onDone: t, rethrowIfPossible: n }) {
          return this.callTapsSeries({
            onError: (t, n) => e(n),
            onDone: t,
            rethrowIfPossible: n,
          });
        }
      }
      const s = new SyncHookCodeFactory();
      const TAP_ASYNC = () => {
        throw new Error('tapAsync is not supported on a SyncHook');
      };
      const TAP_PROMISE = () => {
        throw new Error('tapPromise is not supported on a SyncHook');
      };
      const COMPILE = function (e) {
        s.setup(this, e);
        return s.create(e);
      };
      function SyncHook(e = [], t = undefined) {
        const n = new o(e, t);
        n.constructor = SyncHook;
        n.tapAsync = TAP_ASYNC;
        n.tapPromise = TAP_PROMISE;
        n.compile = COMPILE;
        return n;
      }
      SyncHook.prototype = null;
      e.exports = SyncHook;
    },
    925: (e, t, n) => {
      const o = n(506);
      const r = n(507);
      class SyncLoopHookCodeFactory extends r {
        content({ onError: e, onDone: t, rethrowIfPossible: n }) {
          return this.callTapsLooping({
            onError: (t, n) => e(n),
            onDone: t,
            rethrowIfPossible: n,
          });
        }
      }
      const s = new SyncLoopHookCodeFactory();
      const TAP_ASYNC = () => {
        throw new Error('tapAsync is not supported on a SyncLoopHook');
      };
      const TAP_PROMISE = () => {
        throw new Error('tapPromise is not supported on a SyncLoopHook');
      };
      const COMPILE = function (e) {
        s.setup(this, e);
        return s.create(e);
      };
      function SyncLoopHook(e = [], t = undefined) {
        const n = new o(e, t);
        n.constructor = SyncLoopHook;
        n.tapAsync = TAP_ASYNC;
        n.tapPromise = TAP_PROMISE;
        n.compile = COMPILE;
        return n;
      }
      SyncLoopHook.prototype = null;
      e.exports = SyncLoopHook;
    },
    844: (e, t, n) => {
      const o = n(506);
      const r = n(507);
      class SyncWaterfallHookCodeFactory extends r {
        content({
          onError: e,
          onResult: t,
          resultReturns: n,
          rethrowIfPossible: o,
        }) {
          return this.callTapsSeries({
            onError: (t, n) => e(n),
            onResult: (e, t, n) => {
              let o = '';
              o += `if(${t} !== undefined) {\n`;
              o += `${this._args[0]} = ${t};\n`;
              o += `}\n`;
              o += n();
              return o;
            },
            onDone: () => t(this._args[0]),
            doneReturns: n,
            rethrowIfPossible: o,
          });
        }
      }
      const s = new SyncWaterfallHookCodeFactory();
      const TAP_ASYNC = () => {
        throw new Error('tapAsync is not supported on a SyncWaterfallHook');
      };
      const TAP_PROMISE = () => {
        throw new Error('tapPromise is not supported on a SyncWaterfallHook');
      };
      const COMPILE = function (e) {
        s.setup(this, e);
        return s.create(e);
      };
      function SyncWaterfallHook(e = [], t = undefined) {
        if (e.length < 1)
          throw new Error('Waterfall hooks must have at least one argument');
        const n = new o(e, t);
        n.constructor = SyncWaterfallHook;
        n.tapAsync = TAP_ASYNC;
        n.tapPromise = TAP_PROMISE;
        n.compile = COMPILE;
        return n;
      }
      SyncWaterfallHook.prototype = null;
      e.exports = SyncWaterfallHook;
    },
    837: (e) => {
      e.exports = require('util');
    },
  };
  var t = {};
  function __nccwpck_require__(n) {
    var o = t[n];
    if (o !== undefined) {
      return o.exports;
    }
    var r = (t[n] = { exports: {} });
    var s = true;
    try {
      e[n](r, r.exports, __nccwpck_require__);
      s = false;
    } finally {
      if (s) delete t[n];
    }
    return r.exports;
  }
  if (typeof __nccwpck_require__ !== 'undefined')
    __nccwpck_require__.ab = __dirname + '/';
  var n = {};
  (() => {
    var e = n;
    e.__esModule = true;
    e.SyncHook = __nccwpck_require__(856);
    e.SyncBailHook = __nccwpck_require__(130);
    e.SyncWaterfallHook = __nccwpck_require__(844);
    e.SyncLoopHook = __nccwpck_require__(925);
    e.AsyncParallelHook = __nccwpck_require__(598);
    e.AsyncParallelBailHook = __nccwpck_require__(410);
    e.AsyncSeriesHook = __nccwpck_require__(97);
    e.AsyncSeriesBailHook = __nccwpck_require__(178);
    e.AsyncSeriesLoopHook = __nccwpck_require__(243);
    e.AsyncSeriesWaterfallHook = __nccwpck_require__(969);
    e.HookMap = __nccwpck_require__(876);
    e.MultiHook = __nccwpck_require__(274);
  })();
  module.exports = n;
})();
