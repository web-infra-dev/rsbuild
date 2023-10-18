(() => {
  var e = {
    793: (e, t, r) => {
      'use strict';
      const n = r(897);
      e.exports = n.default;
    },
    897: (e, t, r) => {
      'use strict';
      Object.defineProperty(t, '__esModule', { value: true });
      t['default'] = void 0;
      var n = _interopRequireDefault(r(17));
      var o = r(739);
      var i = _interopRequireDefault(r(937));
      var a = _interopRequireDefault(r(327));
      var s = _interopRequireDefault(r(498));
      var c = _interopRequireDefault(r(677));
      var u = _interopRequireDefault(r(7));
      var f = r(684);
      var l = _interopRequireDefault(r(452));
      var p = r(552);
      function _interopRequireDefault(e) {
        return e && e.__esModule ? e : { default: e };
      }
      const d = /\[\\*([\w:]+)\\*\]/i;
      class CopyPlugin {
        constructor(e = {}) {
          (0, o.validate)(l.default, e, {
            name: 'Copy Plugin',
            baseDataPath: 'options',
          });
          this.patterns = e.patterns;
          this.options = e.options || {};
        }
        static async createSnapshot(e, t, r) {
          return new Promise((n, o) => {
            e.fileSystemInfo.createSnapshot(
              t,
              [r],
              undefined,
              undefined,
              null,
              (e, t) => {
                if (e) {
                  o(e);
                  return;
                }
                n(t);
              },
            );
          });
        }
        static async checkSnapshotValid(e, t) {
          return new Promise((r, n) => {
            e.fileSystemInfo.checkSnapshotValid(t, (e, t) => {
              if (e) {
                n(e);
                return;
              }
              r(t);
            });
          });
        }
        static getContentHash(e, t, r) {
          const { outputOptions: n } = t;
          const {
            hashDigest: o,
            hashDigestLength: i,
            hashFunction: a,
            hashSalt: s,
          } = n;
          const c = e.webpack.util.createHash(a);
          if (s) {
            c.update(s);
          }
          c.update(r);
          const u = c.digest(o);
          return u.slice(0, i);
        }
        static async runPattern(e, t, o, l, g, h) {
          const { RawSource: m } = e.webpack.sources;
          const b = typeof g === 'string' ? { from: g } : { ...g };
          b.fromOrigin = b.from;
          b.from = n.default.normalize(b.from);
          b.context =
            typeof b.context === 'undefined'
              ? e.context
              : n.default.isAbsolute(b.context)
              ? b.context
              : n.default.join(e.context, b.context);
          o.log(
            `starting to process a pattern from '${b.from}' using '${b.context}' context`,
          );
          if (n.default.isAbsolute(b.from)) {
            b.absoluteFrom = b.from;
          } else {
            b.absoluteFrom = n.default.resolve(b.context, b.from);
          }
          o.debug(`getting stats for '${b.absoluteFrom}'...`);
          const { inputFileSystem: y } = e;
          let w;
          try {
            w = await (0, p.stat)(y, b.absoluteFrom);
          } catch (e) {}
          if (w) {
            if (w.isDirectory()) {
              b.fromType = 'dir';
              o.debug(`determined '${b.absoluteFrom}' is a directory`);
            } else if (w.isFile()) {
              b.fromType = 'file';
              o.debug(`determined '${b.absoluteFrom}' is a file`);
            } else {
              o.debug(`determined '${b.absoluteFrom}' is a glob`);
            }
          }
          b.globOptions = {
            ...{ followSymbolicLinks: true },
            ...(b.globOptions || {}),
            ...{ cwd: b.context, objectMode: true },
          };
          b.globOptions.fs = y;
          switch (b.fromType) {
            case 'dir':
              t.contextDependencies.add(b.absoluteFrom);
              o.debug(`added '${b.absoluteFrom}' as a context dependency`);
              b.context = b.absoluteFrom;
              b.glob = n.default.posix.join(
                u.default.escapePath(
                  (0, s.default)(n.default.resolve(b.absoluteFrom)),
                ),
                '**/*',
              );
              b.absoluteFrom = n.default.join(b.absoluteFrom, '**/*');
              if (typeof b.globOptions.dot === 'undefined') {
                b.globOptions.dot = true;
              }
              break;
            case 'file':
              t.fileDependencies.add(b.absoluteFrom);
              o.debug(`added '${b.absoluteFrom}' as a file dependency`);
              b.context = n.default.dirname(b.absoluteFrom);
              b.glob = u.default.escapePath(
                (0, s.default)(n.default.resolve(b.absoluteFrom)),
              );
              if (typeof b.globOptions.dot === 'undefined') {
                b.globOptions.dot = true;
              }
              break;
            default: {
              const e = n.default.normalize((0, c.default)(b.absoluteFrom));
              t.contextDependencies.add(e);
              o.debug(`added '${e}' as a context dependency`);
              b.fromType = 'glob';
              b.glob = n.default.isAbsolute(b.fromOrigin)
                ? b.fromOrigin
                : n.default.posix.join(
                    u.default.escapePath(
                      (0, s.default)(n.default.resolve(b.context)),
                    ),
                    b.fromOrigin,
                  );
            }
          }
          o.log(`begin globbing '${b.glob}'...`);
          let v;
          try {
            v = await (0, i.default)(b.glob, b.globOptions);
          } catch (e) {
            t.errors.push(e);
            return;
          }
          if (v.length === 0) {
            if (b.noErrorOnMissing) {
              o.log(
                `finished to process a pattern from '${b.from}' using '${b.context}' context to '${b.to}'`,
              );
              return;
            }
            const e = new Error(`unable to locate '${b.glob}' glob`);
            t.errors.push(e);
            return;
          }
          const x = (
            await Promise.all(
              v.map(async (e) => {
                if (!e.dirent.isFile()) {
                  return false;
                }
                if (b.filter) {
                  let r;
                  try {
                    r = await b.filter(e.path);
                  } catch (e) {
                    t.errors.push(e);
                    return false;
                  }
                  if (!r) {
                    o.log(`skip '${e.path}', because it was filtered`);
                  }
                  return r ? e : false;
                }
                return e;
              }),
            )
          ).filter((e) => e);
          if (x.length === 0) {
            if (b.noErrorOnMissing) {
              o.log(
                `finished to process a pattern from '${b.from}' using '${b.context}' context to '${b.to}'`,
              );
              return;
            }
            const e = new Error(
              `unable to locate '${b.glob}' glob after filtering paths`,
            );
            t.errors.push(e);
            return;
          }
          const k = await Promise.all(
            x.map(async (t) => {
              const r = t.path;
              o.debug(`found '${r}'`);
              const i = n.default.resolve(b.context, r);
              b.to =
                typeof b.to === 'function'
                  ? await b.to({ context: b.context, absoluteFilename: i })
                  : n.default.normalize(
                      typeof b.to !== 'undefined' ? b.to : '',
                    );
              const a =
                n.default.extname(b.to) === '' ||
                b.to.slice(-1) === n.default.sep;
              const c = b.toType
                ? b.toType
                : d.test(b.to)
                ? 'template'
                : a
                ? 'dir'
                : 'file';
              o.log(`'to' option '${b.to}' determinated as '${c}'`);
              const u = n.default.relative(b.context, i);
              let f = c === 'dir' ? n.default.join(b.to, u) : b.to;
              if (n.default.isAbsolute(f)) {
                f = n.default.relative(e.options.output.path, f);
              }
              o.log(`determined that '${r}' should write to '${f}'`);
              const l = (0, s.default)(n.default.relative(e.context, i));
              return {
                absoluteFilename: i,
                sourceFilename: l,
                filename: f,
                toType: c,
              };
            }),
          );
          let _;
          try {
            _ = await Promise.all(
              k.map(async (i) => {
                const {
                  absoluteFilename: c,
                  sourceFilename: u,
                  filename: d,
                  toType: g,
                } = i;
                const w =
                  typeof b.info === 'function' ? b.info(i) || {} : b.info || {};
                const v = {
                  absoluteFilename: c,
                  sourceFilename: u,
                  filename: d,
                  force: b.force,
                  info: w,
                };
                if (b.fromType === 'dir' || b.fromType === 'glob') {
                  t.fileDependencies.add(c);
                  o.debug(`added '${c}' as a file dependency`);
                }
                let x;
                o.debug(`getting cache for '${c}'...`);
                try {
                  x = await l.getPromise(`${u}|${h}`, null);
                } catch (e) {
                  t.errors.push(e);
                  return;
                }
                if (x) {
                  o.debug(`found cache for '${c}'...`);
                  let e;
                  o.debug(`checking snapshot on valid for '${c}'...`);
                  try {
                    e = await CopyPlugin.checkSnapshotValid(t, x.snapshot);
                  } catch (e) {
                    t.errors.push(e);
                    return;
                  }
                  if (e) {
                    o.debug(`snapshot for '${c}' is valid`);
                    v.source = x.source;
                  } else {
                    o.debug(`snapshot for '${c}' is invalid`);
                  }
                } else {
                  o.debug(`missed cache for '${c}'`);
                }
                if (!v.source) {
                  const e = Date.now();
                  o.debug(`reading '${c}'...`);
                  let r;
                  try {
                    r = await (0, p.readFile)(y, c);
                  } catch (e) {
                    t.errors.push(e);
                    return;
                  }
                  o.debug(`read '${c}'`);
                  v.source = new m(r);
                  let n;
                  o.debug(`creating snapshot for '${c}'...`);
                  try {
                    n = await CopyPlugin.createSnapshot(t, e, c);
                  } catch (e) {
                    t.errors.push(e);
                    return;
                  }
                  if (n) {
                    o.debug(`created snapshot for '${c}'`);
                    o.debug(`storing cache for '${c}'...`);
                    try {
                      await l.storePromise(`${u}|${h}`, null, {
                        source: v.source,
                        snapshot: n,
                      });
                    } catch (e) {
                      t.errors.push(e);
                      return;
                    }
                    o.debug(`stored cache for '${c}'`);
                  }
                }
                if (b.transform) {
                  const t =
                    typeof b.transform === 'function'
                      ? { transformer: b.transform }
                      : b.transform;
                  if (t.transformer) {
                    o.log(`transforming content for '${c}'...`);
                    const n = v.source.buffer();
                    if (t.cache) {
                      const i =
                        e.webpack && e.webpack.util && e.webpack.util.createHash
                          ? e.webpack.util.createHash('xxhash64')
                          : r(113).createHash('md4');
                      const s = {
                        version: f.version,
                        sourceFilename: u,
                        transform: t.transformer,
                        contentHash: i.update(n).digest('hex'),
                        index: h,
                      };
                      const p = `transform|${(0, a.default)(
                        typeof t.cache.keys === 'function'
                          ? await t.cache.keys(s, c)
                          : { ...s, ...b.transform.cache.keys },
                      )}`;
                      o.debug(`getting transformation cache for '${c}'...`);
                      const d = l.getItemCache(
                        p,
                        l.getLazyHashedEtag(v.source),
                      );
                      v.source = await d.getPromise();
                      o.debug(
                        v.source
                          ? `found transformation cache for '${c}'`
                          : `no transformation cache for '${c}'`,
                      );
                      if (!v.source) {
                        const e = await t.transformer(n, c);
                        v.source = new m(e);
                        o.debug(`caching transformation for '${c}'...`);
                        await d.storePromise(v.source);
                        o.debug(`cached transformation for '${c}'`);
                      }
                    } else {
                      v.source = new m(await t.transformer(n, c));
                    }
                  }
                }
                if (g === 'template') {
                  o.log(`interpolating template '${d}' for '${u}'...`);
                  const r = CopyPlugin.getContentHash(e, t, v.source.buffer());
                  const i = n.default.extname(v.sourceFilename);
                  const a = n.default.basename(v.sourceFilename);
                  const f = a.slice(0, a.length - i.length);
                  const l = {
                    filename: (0, s.default)(n.default.relative(b.context, c)),
                    contentHash: r,
                    chunk: {
                      name: f,
                      id: v.sourceFilename,
                      hash: r,
                      contentHash: r,
                    },
                  };
                  const { path: p, info: g } = t.getPathWithInfo(
                    (0, s.default)(v.filename),
                    l,
                  );
                  v.info = { ...v.info, ...g };
                  v.filename = p;
                  o.log(`interpolated template '${d}' for '${u}'`);
                } else {
                  v.filename = (0, s.default)(v.filename);
                }
                return v;
              }),
            );
          } catch (e) {
            t.errors.push(e);
            return;
          }
          o.log(
            `finished to process a pattern from '${b.from}' using '${b.context}' context to '${b.to}'`,
          );
          return _;
        }
        apply(e) {
          const t = this.constructor.name;
          e.hooks.thisCompilation.tap(t, (r) => {
            const n = r.getLogger('copy-webpack-plugin');
            const o = r.getCache('CopyWebpackPlugin');
            r.hooks.processAssets.tapAsync(
              {
                name: 'copy-webpack-plugin',
                stage: e.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
              },
              async (t, i) => {
                n.log('starting to add additional assets...');
                const c = new Map();
                const u = [];
                this.patterns.map((t, i) =>
                  u.push(async () => {
                    let u;
                    try {
                      u = await CopyPlugin.runPattern(e, r, n, o, t, i);
                    } catch (e) {
                      r.errors.push(e);
                      return;
                    }
                    if (u && u.length > 0) {
                      if (t.transformAll) {
                        if (typeof t.to === 'undefined') {
                          r.errors.push(
                            new Error(
                              `Invalid "pattern.to" for the "pattern.from": "${t.from}" and "pattern.transformAll" function. The "to" option must be specified.`,
                            ),
                          );
                          return;
                        }
                        u.sort((e, t) =>
                          e.absoluteFilename > t.absoluteFilename
                            ? 1
                            : e.absoluteFilename < t.absoluteFilename
                            ? -1
                            : 0,
                        );
                        const n =
                          u.length === 1
                            ? o.getLazyHashedEtag(u[0].source.buffer())
                            : u.reduce((e, t, r) => {
                                e = o.mergeEtags(
                                  r === 1
                                    ? o.getLazyHashedEtag(e.source.buffer())
                                    : e,
                                  o.getLazyHashedEtag(t.source.buffer()),
                                );
                                return e;
                              });
                        const i = `transformAll|${(0, a.default)({
                          version: f.version,
                          from: t.from,
                          to: t.to,
                          transformAll: t.transformAll,
                        })}`;
                        const c = o.getLazyHashedEtag(n);
                        const l = o.getItemCache(i, c);
                        let p = await l.getPromise();
                        if (!p) {
                          p = { filename: t.to };
                          try {
                            p.data = await t.transformAll(
                              u.map((e) => ({
                                data: e.source.buffer(),
                                sourceFilename: e.sourceFilename,
                                absoluteFilename: e.absoluteFilename,
                              })),
                            );
                          } catch (e) {
                            r.errors.push(e);
                            return;
                          }
                          if (d.test(t.to)) {
                            const n = CopyPlugin.getContentHash(e, r, p.data);
                            const { path: o, info: i } = r.getPathWithInfo(
                              (0, s.default)(t.to),
                              {
                                contentHash: n,
                                chunk: { hash: n, contentHash: n },
                              },
                            );
                            p.filename = o;
                            p.info = i;
                          }
                          const { RawSource: n } = e.webpack.sources;
                          p.source = new n(p.data);
                          p.force = t.force;
                          await l.storePromise(p);
                        }
                        u = [p];
                      }
                      const n = t.priority || 0;
                      if (!c.has(n)) {
                        c.set(n, []);
                      }
                      c.get(n).push(...u);
                    }
                  }),
                );
                await (0, p.throttleAll)(this.options.concurrency || 100, u);
                const l = [...c.entries()].sort((e, t) => e[0] - t[0]);
                l.reduce((e, t) => e.concat(t[1]), [])
                  .filter(Boolean)
                  .forEach((e) => {
                    const {
                      absoluteFilename: t,
                      sourceFilename: o,
                      filename: i,
                      source: a,
                      force: s,
                    } = e;
                    const c = r.getAsset(i);
                    if (c) {
                      if (s) {
                        const s = { copied: true, sourceFilename: o };
                        n.log(
                          `force updating '${i}' from '${t}' to compilation assets, because it already exists...`,
                        );
                        r.updateAsset(i, a, { ...s, ...e.info });
                        n.log(
                          `force updated '${i}' from '${t}' to compilation assets, because it already exists`,
                        );
                        return;
                      }
                      n.log(
                        `skip adding '${i}' from '${t}' to compilation assets, because it already exists`,
                      );
                      return;
                    }
                    const u = { copied: true, sourceFilename: o };
                    n.log(
                      `writing '${i}' from '${t}' to compilation assets...`,
                    );
                    r.emitAsset(i, a, { ...u, ...e.info });
                    n.log(`written '${i}' from '${t}' to compilation assets`);
                  });
                n.log('finished to adding additional assets');
                i();
              },
            );
            if (r.hooks.statsPrinter) {
              r.hooks.statsPrinter.tap(t, (e) => {
                e.hooks.print
                  .for('asset.info.copied')
                  .tap(
                    'copy-webpack-plugin',
                    (e, { green: t, formatFlag: r }) =>
                      e ? t(r('copied')) : undefined,
                  );
              });
            }
          });
        }
      }
      var g = CopyPlugin;
      t['default'] = g;
    },
    552: (e, t) => {
      'use strict';
      Object.defineProperty(t, '__esModule', { value: true });
      t.readFile = readFile;
      t.stat = stat;
      t.throttleAll = throttleAll;
      function stat(e, t) {
        return new Promise((r, n) => {
          e.stat(t, (e, t) => {
            if (e) {
              n(e);
            }
            r(t);
          });
        });
      }
      function readFile(e, t) {
        return new Promise((r, n) => {
          e.readFile(t, (e, t) => {
            if (e) {
              n(e);
            }
            r(t);
          });
        });
      }
      const r = Symbol(`not-settled`);
      function throttleAll(e, t) {
        if (!Number.isInteger(e) || e < 1) {
          throw new TypeError(
            `Expected \`limit\` to be a finite number > 0, got \`${e}\` (${typeof e})`,
          );
        }
        if (!Array.isArray(t) || !t.every((e) => typeof e === `function`)) {
          throw new TypeError(
            `Expected \`tasks\` to be a list of functions returning a promise`,
          );
        }
        return new Promise((n, o) => {
          const i = Array(t.length).fill(r);
          const a = t.entries();
          const next = () => {
            const { done: e, value: t } = a.next();
            if (e) {
              const e = !i.includes(r);
              if (e) {
                n(i);
              }
              return;
            }
            const [s, c] = t;
            const onFulfilled = (e) => {
              i[s] = e;
              next();
            };
            c().then(onFulfilled, o);
          };
          Array(e).fill(0).forEach(next);
        });
      }
    },
    677: (e, t, r) => {
      'use strict';
      var n = r(654);
      var o = r(17).posix.dirname;
      var i = r(37).platform() === 'win32';
      var a = '/';
      var s = /\\/g;
      var c = /\\([!*?|[\](){}])/g;
      e.exports = function globParent(e, t) {
        var r = Object.assign({ flipBackslashes: true }, t);
        if (r.flipBackslashes && i && e.indexOf(a) < 0) {
          e = e.replace(s, a);
        }
        if (isEnclosure(e)) {
          e += a;
        }
        e += 'a';
        do {
          e = o(e);
        } while (isGlobby(e));
        return e.replace(c, '$1');
      };
      function isEnclosure(e) {
        var t = e.slice(-1);
        var r;
        switch (t) {
          case '}':
            r = '{';
            break;
          case ']':
            r = '[';
            break;
          default:
            return false;
        }
        var n = e.indexOf(r);
        if (n < 0) {
          return false;
        }
        return e.slice(n + 1, -1).includes(a);
      }
      function isGlobby(e) {
        if (/\([^()]+$/.test(e)) {
          return true;
        }
        if (e[0] === '{' || e[0] === '[') {
          return true;
        }
        if (/[^\\][{[]/.test(e)) {
          return true;
        }
        return n(e);
      }
    },
    71: (e) => {
      /*!
       * is-extglob <https://github.com/jonschlinkert/is-extglob>
       *
       * Copyright (c) 2014-2016, Jon Schlinkert.
       * Licensed under the MIT License.
       */
      e.exports = function isExtglob(e) {
        if (typeof e !== 'string' || e === '') {
          return false;
        }
        var t;
        while ((t = /(\\).|([@?!+*]\(.*\))/g.exec(e))) {
          if (t[2]) return true;
          e = e.slice(t.index + t[0].length);
        }
        return false;
      };
    },
    654: (e, t, r) => {
      /*!
       * is-glob <https://github.com/jonschlinkert/is-glob>
       *
       * Copyright (c) 2014-2017, Jon Schlinkert.
       * Released under the MIT License.
       */
      var n = r(71);
      var o = { '{': '}', '(': ')', '[': ']' };
      var strictCheck = function (e) {
        if (e[0] === '!') {
          return true;
        }
        var t = 0;
        var r = -2;
        var n = -2;
        var i = -2;
        var a = -2;
        var s = -2;
        while (t < e.length) {
          if (e[t] === '*') {
            return true;
          }
          if (e[t + 1] === '?' && /[\].+)]/.test(e[t])) {
            return true;
          }
          if (n !== -1 && e[t] === '[' && e[t + 1] !== ']') {
            if (n < t) {
              n = e.indexOf(']', t);
            }
            if (n > t) {
              if (s === -1 || s > n) {
                return true;
              }
              s = e.indexOf('\\', t);
              if (s === -1 || s > n) {
                return true;
              }
            }
          }
          if (i !== -1 && e[t] === '{' && e[t + 1] !== '}') {
            i = e.indexOf('}', t);
            if (i > t) {
              s = e.indexOf('\\', t);
              if (s === -1 || s > i) {
                return true;
              }
            }
          }
          if (
            a !== -1 &&
            e[t] === '(' &&
            e[t + 1] === '?' &&
            /[:!=]/.test(e[t + 2]) &&
            e[t + 3] !== ')'
          ) {
            a = e.indexOf(')', t);
            if (a > t) {
              s = e.indexOf('\\', t);
              if (s === -1 || s > a) {
                return true;
              }
            }
          }
          if (r !== -1 && e[t] === '(' && e[t + 1] !== '|') {
            if (r < t) {
              r = e.indexOf('|', t);
            }
            if (r !== -1 && e[r + 1] !== ')') {
              a = e.indexOf(')', r);
              if (a > r) {
                s = e.indexOf('\\', r);
                if (s === -1 || s > a) {
                  return true;
                }
              }
            }
          }
          if (e[t] === '\\') {
            var c = e[t + 1];
            t += 2;
            var u = o[c];
            if (u) {
              var f = e.indexOf(u, t);
              if (f !== -1) {
                t = f + 1;
              }
            }
            if (e[t] === '!') {
              return true;
            }
          } else {
            t++;
          }
        }
        return false;
      };
      var relaxedCheck = function (e) {
        if (e[0] === '!') {
          return true;
        }
        var t = 0;
        while (t < e.length) {
          if (/[*?{}()[\]]/.test(e[t])) {
            return true;
          }
          if (e[t] === '\\') {
            var r = e[t + 1];
            t += 2;
            var n = o[r];
            if (n) {
              var i = e.indexOf(n, t);
              if (i !== -1) {
                t = i + 1;
              }
            }
            if (e[t] === '!') {
              return true;
            }
          } else {
            t++;
          }
        }
        return false;
      };
      e.exports = function isGlob(e, t) {
        if (typeof e !== 'string' || e === '') {
          return false;
        }
        if (n(e)) {
          return true;
        }
        var r = strictCheck;
        if (t && t.strict === false) {
          r = relaxedCheck;
        }
        return r(e);
      };
    },
    498: (e) => {
      /*!
       * normalize-path <https://github.com/jonschlinkert/normalize-path>
       *
       * Copyright (c) 2014-2018, Jon Schlinkert.
       * Released under the MIT License.
       */
      e.exports = function (e, t) {
        if (typeof e !== 'string') {
          throw new TypeError('expected path to be a string');
        }
        if (e === '\\' || e === '/') return '/';
        var r = e.length;
        if (r <= 1) return e;
        var n = '';
        if (r > 4 && e[3] === '\\') {
          var o = e[2];
          if ((o === '?' || o === '.') && e.slice(0, 2) === '\\\\') {
            e = e.slice(2);
            n = '//';
          }
        }
        var i = e.split(/[/\\]+/);
        if (t !== false && i[i.length - 1] === '') {
          i.pop();
        }
        return n + i.join('/');
      };
    },
    856: (e, t, r) => {
      e.exports = r(113).randomBytes;
    },
    327: (e, t, r) => {
      'use strict';
      var n = r(856);
      var o = 16;
      var i = generateUID();
      var a = new RegExp(
        '(\\\\)?"@__(F|R|D|M|S|A|U|I|B|L)-' + i + '-(\\d+)__@"',
        'g',
      );
      var s = /\{\s*\[native code\]\s*\}/g;
      var c = /function.*?\(/;
      var u = /.*?=>.*?/;
      var f = /[<>\/\u2028\u2029]/g;
      var l = ['*', 'async'];
      var p = {
        '<': '\\u003C',
        '>': '\\u003E',
        '/': '\\u002F',
        '\u2028': '\\u2028',
        '\u2029': '\\u2029',
      };
      function escapeUnsafeChars(e) {
        return p[e];
      }
      function generateUID() {
        var e = n(o);
        var t = '';
        for (var r = 0; r < o; ++r) {
          t += e[r].toString(16);
        }
        return t;
      }
      function deleteFunctions(e) {
        var t = [];
        for (var r in e) {
          if (typeof e[r] === 'function') {
            t.push(r);
          }
        }
        for (var n = 0; n < t.length; n++) {
          delete e[t[n]];
        }
      }
      e.exports = function serialize(e, t) {
        t || (t = {});
        if (typeof t === 'number' || typeof t === 'string') {
          t = { space: t };
        }
        var r = [];
        var n = [];
        var o = [];
        var p = [];
        var d = [];
        var g = [];
        var h = [];
        var m = [];
        var b = [];
        var y = [];
        function replacer(e, a) {
          if (t.ignoreFunction) {
            deleteFunctions(a);
          }
          if (!a && a !== undefined && a !== BigInt(0)) {
            return a;
          }
          var s = this[e];
          var c = typeof s;
          if (c === 'object') {
            if (s instanceof RegExp) {
              return '@__R-' + i + '-' + (n.push(s) - 1) + '__@';
            }
            if (s instanceof Date) {
              return '@__D-' + i + '-' + (o.push(s) - 1) + '__@';
            }
            if (s instanceof Map) {
              return '@__M-' + i + '-' + (p.push(s) - 1) + '__@';
            }
            if (s instanceof Set) {
              return '@__S-' + i + '-' + (d.push(s) - 1) + '__@';
            }
            if (s instanceof Array) {
              var u =
                s.filter(function () {
                  return true;
                }).length !== s.length;
              if (u) {
                return '@__A-' + i + '-' + (g.push(s) - 1) + '__@';
              }
            }
            if (s instanceof URL) {
              return '@__L-' + i + '-' + (y.push(s) - 1) + '__@';
            }
          }
          if (c === 'function') {
            return '@__F-' + i + '-' + (r.push(s) - 1) + '__@';
          }
          if (c === 'undefined') {
            return '@__U-' + i + '-' + (h.push(s) - 1) + '__@';
          }
          if (c === 'number' && !isNaN(s) && !isFinite(s)) {
            return '@__I-' + i + '-' + (m.push(s) - 1) + '__@';
          }
          if (c === 'bigint') {
            return '@__B-' + i + '-' + (b.push(s) - 1) + '__@';
          }
          return a;
        }
        function serializeFunc(e) {
          var t = e.toString();
          if (s.test(t)) {
            throw new TypeError('Serializing native function: ' + e.name);
          }
          if (c.test(t)) {
            return t;
          }
          if (u.test(t)) {
            return t;
          }
          var r = t.indexOf('(');
          var n = t
            .substr(0, r)
            .trim()
            .split(' ')
            .filter(function (e) {
              return e.length > 0;
            });
          var o = n.filter(function (e) {
            return l.indexOf(e) === -1;
          });
          if (o.length > 0) {
            return (
              (n.indexOf('async') > -1 ? 'async ' : '') +
              'function' +
              (n.join('').indexOf('*') > -1 ? '*' : '') +
              t.substr(r)
            );
          }
          return t;
        }
        if (t.ignoreFunction && typeof e === 'function') {
          e = undefined;
        }
        if (e === undefined) {
          return String(e);
        }
        var w;
        if (t.isJSON && !t.space) {
          w = JSON.stringify(e);
        } else {
          w = JSON.stringify(e, t.isJSON ? null : replacer, t.space);
        }
        if (typeof w !== 'string') {
          return String(w);
        }
        if (t.unsafe !== true) {
          w = w.replace(f, escapeUnsafeChars);
        }
        if (
          r.length === 0 &&
          n.length === 0 &&
          o.length === 0 &&
          p.length === 0 &&
          d.length === 0 &&
          g.length === 0 &&
          h.length === 0 &&
          m.length === 0 &&
          b.length === 0 &&
          y.length === 0
        ) {
          return w;
        }
        return w.replace(a, function (e, i, a, s) {
          if (i) {
            return e;
          }
          if (a === 'D') {
            return 'new Date("' + o[s].toISOString() + '")';
          }
          if (a === 'R') {
            return (
              'new RegExp(' + serialize(n[s].source) + ', "' + n[s].flags + '")'
            );
          }
          if (a === 'M') {
            return 'new Map(' + serialize(Array.from(p[s].entries()), t) + ')';
          }
          if (a === 'S') {
            return 'new Set(' + serialize(Array.from(d[s].values()), t) + ')';
          }
          if (a === 'A') {
            return (
              'Array.prototype.slice.call(' +
              serialize(Object.assign({ length: g[s].length }, g[s]), t) +
              ')'
            );
          }
          if (a === 'U') {
            return 'undefined';
          }
          if (a === 'I') {
            return m[s];
          }
          if (a === 'B') {
            return 'BigInt("' + b[s] + '")';
          }
          if (a === 'L') {
            return 'new URL("' + y[s].toString() + '")';
          }
          var c = r[s];
          return serializeFunc(c);
        });
      };
    },
    739: (e) => {
      'use strict';
      e.exports = require('../schema-utils3');
    },
    684: (e) => {
      'use strict';
      e.exports = require('./package.json');
    },
    7: (e) => {
      'use strict';
      e.exports = require('@modern-js/utils/fast-glob');
    },
    937: (e) => {
      'use strict';
      e.exports = require('@modern-js/utils/globby');
    },
    113: (e) => {
      'use strict';
      e.exports = require('crypto');
    },
    37: (e) => {
      'use strict';
      e.exports = require('os');
    },
    17: (e) => {
      'use strict';
      e.exports = require('path');
    },
    452: (e) => {
      'use strict';
      e.exports = JSON.parse(
        '{"definitions":{"ObjectPattern":{"type":"object","additionalProperties":false,"properties":{"from":{"type":"string","description":"Glob or path from where we copy files.","link":"https://github.com/webpack-contrib/copy-webpack-plugin#from","minLength":1},"to":{"anyOf":[{"type":"string"},{"instanceof":"Function"}],"description":"Output path.","link":"https://github.com/webpack-contrib/copy-webpack-plugin#to"},"context":{"type":"string","description":"A path that determines how to interpret the \'from\' path.","link":"https://github.com/webpack-contrib/copy-webpack-plugin#context"},"globOptions":{"type":"object","description":"Allows to configute the glob pattern matching library used by the plugin.","link":"https://github.com/webpack-contrib/copy-webpack-plugin#globoptions"},"filter":{"instanceof":"Function","description":"Allows to filter copied assets.","link":"https://github.com/webpack-contrib/copy-webpack-plugin#filter"},"transformAll":{"instanceof":"Function","description":"Allows you to modify the contents of multiple files and save the result to one file.","link":"https://github.com/webpack-contrib/copy-webpack-plugin#transformall"},"toType":{"enum":["dir","file","template"],"description":"Determinate what is to option - directory, file or template.","link":"https://github.com/webpack-contrib/copy-webpack-plugin#totype"},"force":{"type":"boolean","description":"Overwrites files already in \'compilation.assets\' (usually added by other plugins/loaders).","link":"https://github.com/webpack-contrib/copy-webpack-plugin#force"},"priority":{"type":"number","description":"Allows to specify the priority of copying files with the same destination name.","link":"https://github.com/webpack-contrib/copy-webpack-plugin#priority"},"info":{"anyOf":[{"type":"object"},{"instanceof":"Function"}],"description":"Allows to add assets info.","link":"https://github.com/webpack-contrib/copy-webpack-plugin#info"},"transform":{"description":"Allows to modify the file contents.","link":"https://github.com/webpack-contrib/copy-webpack-plugin#transform","anyOf":[{"instanceof":"Function"},{"type":"object","additionalProperties":false,"properties":{"transformer":{"instanceof":"Function","description":"Allows to modify the file contents.","link":"https://github.com/webpack-contrib/copy-webpack-plugin#transformer"},"cache":{"description":"Enables/disables and configure caching.","link":"https://github.com/webpack-contrib/copy-webpack-plugin#cache","anyOf":[{"type":"boolean"},{"type":"object","additionalProperties":false,"properties":{"keys":{"anyOf":[{"type":"object","additionalProperties":true},{"instanceof":"Function"}]}}}]}}}]},"transformPath":{"instanceof":"Function"},"noErrorOnMissing":{"type":"boolean","description":"Doesn\'t generate an error on missing file(s).","link":"https://github.com/webpack-contrib/copy-webpack-plugin#noerroronmissing"}},"required":["from"]},"StringPattern":{"type":"string","minLength":1}},"type":"object","additionalProperties":false,"properties":{"patterns":{"type":"array","minItems":1,"items":{"anyOf":[{"$ref":"#/definitions/StringPattern"},{"$ref":"#/definitions/ObjectPattern"}]}},"options":{"type":"object","additionalProperties":false,"properties":{"concurrency":{"type":"number","description":"Limits the number of simultaneous requests to fs.","link":"https://github.com/webpack-contrib/copy-webpack-plugin#concurrency"}}}},"required":["patterns"]}',
      );
    },
  };
  var t = {};
  function __nccwpck_require__(r) {
    var n = t[r];
    if (n !== undefined) {
      return n.exports;
    }
    var o = (t[r] = { exports: {} });
    var i = true;
    try {
      e[r](o, o.exports, __nccwpck_require__);
      i = false;
    } finally {
      if (i) delete t[r];
    }
    return o.exports;
  }
  if (typeof __nccwpck_require__ !== 'undefined')
    __nccwpck_require__.ab = __dirname + '/';
  var r = __nccwpck_require__(793);
  module.exports = r;
})();
