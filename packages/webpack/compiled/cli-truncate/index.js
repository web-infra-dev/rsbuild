(() => {
  var D = {
    275: (D) => {
      'use strict';
      D.exports = ({ onlyFirst: D = false } = {}) => {
        const u = [
          '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
          '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))',
        ].join('|');
        return new RegExp(u, D ? undefined : 'g');
      };
    },
    44: (D, u, e) => {
      'use strict';
      D = e.nmd(D);
      const wrapAnsi16 =
        (D, u) =>
        (...e) => {
          const t = D(...e);
          return `[${t + u}m`;
        };
      const wrapAnsi256 =
        (D, u) =>
        (...e) => {
          const t = D(...e);
          return `[${38 + u};5;${t}m`;
        };
      const wrapAnsi16m =
        (D, u) =>
        (...e) => {
          const t = D(...e);
          return `[${38 + u};2;${t[0]};${t[1]};${t[2]}m`;
        };
      const ansi2ansi = (D) => D;
      const rgb2rgb = (D, u, e) => [D, u, e];
      const setLazyProperty = (D, u, e) => {
        Object.defineProperty(D, u, {
          get: () => {
            const t = e();
            Object.defineProperty(D, u, {
              value: t,
              enumerable: true,
              configurable: true,
            });
            return t;
          },
          enumerable: true,
          configurable: true,
        });
      };
      let t;
      const makeDynamicStyles = (D, u, n, r) => {
        if (t === undefined) {
          t = e(767);
        }
        const o = r ? 10 : 0;
        const F = {};
        for (const [e, r] of Object.entries(t)) {
          const t = e === 'ansi16' ? 'ansi' : e;
          if (e === u) {
            F[t] = D(n, o);
          } else if (typeof r === 'object') {
            F[t] = D(r[u], o);
          }
        }
        return F;
      };
      function assembleStyles() {
        const D = new Map();
        const u = {
          modifier: {
            reset: [0, 0],
            bold: [1, 22],
            dim: [2, 22],
            italic: [3, 23],
            underline: [4, 24],
            inverse: [7, 27],
            hidden: [8, 28],
            strikethrough: [9, 29],
          },
          color: {
            black: [30, 39],
            red: [31, 39],
            green: [32, 39],
            yellow: [33, 39],
            blue: [34, 39],
            magenta: [35, 39],
            cyan: [36, 39],
            white: [37, 39],
            blackBright: [90, 39],
            redBright: [91, 39],
            greenBright: [92, 39],
            yellowBright: [93, 39],
            blueBright: [94, 39],
            magentaBright: [95, 39],
            cyanBright: [96, 39],
            whiteBright: [97, 39],
          },
          bgColor: {
            bgBlack: [40, 49],
            bgRed: [41, 49],
            bgGreen: [42, 49],
            bgYellow: [43, 49],
            bgBlue: [44, 49],
            bgMagenta: [45, 49],
            bgCyan: [46, 49],
            bgWhite: [47, 49],
            bgBlackBright: [100, 49],
            bgRedBright: [101, 49],
            bgGreenBright: [102, 49],
            bgYellowBright: [103, 49],
            bgBlueBright: [104, 49],
            bgMagentaBright: [105, 49],
            bgCyanBright: [106, 49],
            bgWhiteBright: [107, 49],
          },
        };
        u.color.gray = u.color.blackBright;
        u.bgColor.bgGray = u.bgColor.bgBlackBright;
        u.color.grey = u.color.blackBright;
        u.bgColor.bgGrey = u.bgColor.bgBlackBright;
        for (const [e, t] of Object.entries(u)) {
          for (const [e, n] of Object.entries(t)) {
            u[e] = { open: `[${n[0]}m`, close: `[${n[1]}m` };
            t[e] = u[e];
            D.set(n[0], n[1]);
          }
          Object.defineProperty(u, e, { value: t, enumerable: false });
        }
        Object.defineProperty(u, 'codes', { value: D, enumerable: false });
        u.color.close = '[39m';
        u.bgColor.close = '[49m';
        setLazyProperty(u.color, 'ansi', () =>
          makeDynamicStyles(wrapAnsi16, 'ansi16', ansi2ansi, false),
        );
        setLazyProperty(u.color, 'ansi256', () =>
          makeDynamicStyles(wrapAnsi256, 'ansi256', ansi2ansi, false),
        );
        setLazyProperty(u.color, 'ansi16m', () =>
          makeDynamicStyles(wrapAnsi16m, 'rgb', rgb2rgb, false),
        );
        setLazyProperty(u.bgColor, 'ansi', () =>
          makeDynamicStyles(wrapAnsi16, 'ansi16', ansi2ansi, true),
        );
        setLazyProperty(u.bgColor, 'ansi256', () =>
          makeDynamicStyles(wrapAnsi256, 'ansi256', ansi2ansi, true),
        );
        setLazyProperty(u.bgColor, 'ansi16m', () =>
          makeDynamicStyles(wrapAnsi16m, 'rgb', rgb2rgb, true),
        );
        return u;
      }
      Object.defineProperty(D, 'exports', {
        enumerable: true,
        get: assembleStyles,
      });
    },
    788: (D) => {
      'use strict';
      const u = '[\ud800-\udbff][\udc00-\udfff]';
      const astralRegex = (D) =>
        D && D.exact ? new RegExp(`^${u}$`) : new RegExp(u, 'g');
      D.exports = astralRegex;
    },
    922: (D, u, e) => {
      'use strict';
      const t = e(770);
      const n = e(629);
      function getIndexOfNearestSpace(D, u, e) {
        if (D.charAt(u) === ' ') {
          return u;
        }
        for (let t = 1; t <= 3; t++) {
          if (e) {
            if (D.charAt(u + t) === ' ') {
              return u + t;
            }
          } else if (D.charAt(u - t) === ' ') {
            return u - t;
          }
        }
        return u;
      }
      D.exports = (D, u, e) => {
        e = { position: 'end', preferTruncationOnSpace: false, ...e };
        const { position: r, space: o, preferTruncationOnSpace: F } = e;
        let s = '…';
        let c = 1;
        if (typeof D !== 'string') {
          throw new TypeError(
            `Expected \`input\` to be a string, got ${typeof D}`,
          );
        }
        if (typeof u !== 'number') {
          throw new TypeError(
            `Expected \`columns\` to be a number, got ${typeof u}`,
          );
        }
        if (u < 1) {
          return '';
        }
        if (u === 1) {
          return s;
        }
        const C = n(D);
        if (C <= u) {
          return D;
        }
        if (r === 'start') {
          if (F) {
            const e = getIndexOfNearestSpace(D, C - u + 1, true);
            return s + t(D, e, C).trim();
          }
          if (o === true) {
            s += ' ';
            c = 2;
          }
          return s + t(D, C - u + c, C);
        }
        if (r === 'middle') {
          if (o === true) {
            s = ' ' + s + ' ';
            c = 3;
          }
          const e = Math.floor(u / 2);
          if (F) {
            const n = getIndexOfNearestSpace(D, e);
            const r = getIndexOfNearestSpace(D, C - (u - e) + 1, true);
            return t(D, 0, n) + s + t(D, r, C).trim();
          }
          return t(D, 0, e) + s + t(D, C - (u - e) + c, C);
        }
        if (r === 'end') {
          if (F) {
            const e = getIndexOfNearestSpace(D, u - 1);
            return t(D, 0, e) + s;
          }
          if (o === true) {
            s = ' ' + s;
            c = 2;
          }
          return t(D, 0, u - c) + s;
        }
        throw new Error(
          `Expected \`options.position\` to be either \`start\`, \`middle\` or \`end\`, got ${r}`,
        );
      };
    },
    226: (D, u, e) => {
      const t = e(866);
      const n = {};
      for (const D of Object.keys(t)) {
        n[t[D]] = D;
      }
      const r = {
        rgb: { channels: 3, labels: 'rgb' },
        hsl: { channels: 3, labels: 'hsl' },
        hsv: { channels: 3, labels: 'hsv' },
        hwb: { channels: 3, labels: 'hwb' },
        cmyk: { channels: 4, labels: 'cmyk' },
        xyz: { channels: 3, labels: 'xyz' },
        lab: { channels: 3, labels: 'lab' },
        lch: { channels: 3, labels: 'lch' },
        hex: { channels: 1, labels: ['hex'] },
        keyword: { channels: 1, labels: ['keyword'] },
        ansi16: { channels: 1, labels: ['ansi16'] },
        ansi256: { channels: 1, labels: ['ansi256'] },
        hcg: { channels: 3, labels: ['h', 'c', 'g'] },
        apple: { channels: 3, labels: ['r16', 'g16', 'b16'] },
        gray: { channels: 1, labels: ['gray'] },
      };
      D.exports = r;
      for (const D of Object.keys(r)) {
        if (!('channels' in r[D])) {
          throw new Error('missing channels property: ' + D);
        }
        if (!('labels' in r[D])) {
          throw new Error('missing channel labels property: ' + D);
        }
        if (r[D].labels.length !== r[D].channels) {
          throw new Error('channel and label counts mismatch: ' + D);
        }
        const { channels: u, labels: e } = r[D];
        delete r[D].channels;
        delete r[D].labels;
        Object.defineProperty(r[D], 'channels', { value: u });
        Object.defineProperty(r[D], 'labels', { value: e });
      }
      r.rgb.hsl = function (D) {
        const u = D[0] / 255;
        const e = D[1] / 255;
        const t = D[2] / 255;
        const n = Math.min(u, e, t);
        const r = Math.max(u, e, t);
        const o = r - n;
        let F;
        let s;
        if (r === n) {
          F = 0;
        } else if (u === r) {
          F = (e - t) / o;
        } else if (e === r) {
          F = 2 + (t - u) / o;
        } else if (t === r) {
          F = 4 + (u - e) / o;
        }
        F = Math.min(F * 60, 360);
        if (F < 0) {
          F += 360;
        }
        const c = (n + r) / 2;
        if (r === n) {
          s = 0;
        } else if (c <= 0.5) {
          s = o / (r + n);
        } else {
          s = o / (2 - r - n);
        }
        return [F, s * 100, c * 100];
      };
      r.rgb.hsv = function (D) {
        let u;
        let e;
        let t;
        let n;
        let r;
        const o = D[0] / 255;
        const F = D[1] / 255;
        const s = D[2] / 255;
        const c = Math.max(o, F, s);
        const C = c - Math.min(o, F, s);
        const diffc = function (D) {
          return (c - D) / 6 / C + 1 / 2;
        };
        if (C === 0) {
          n = 0;
          r = 0;
        } else {
          r = C / c;
          u = diffc(o);
          e = diffc(F);
          t = diffc(s);
          if (o === c) {
            n = t - e;
          } else if (F === c) {
            n = 1 / 3 + u - t;
          } else if (s === c) {
            n = 2 / 3 + e - u;
          }
          if (n < 0) {
            n += 1;
          } else if (n > 1) {
            n -= 1;
          }
        }
        return [n * 360, r * 100, c * 100];
      };
      r.rgb.hwb = function (D) {
        const u = D[0];
        const e = D[1];
        let t = D[2];
        const n = r.rgb.hsl(D)[0];
        const o = (1 / 255) * Math.min(u, Math.min(e, t));
        t = 1 - (1 / 255) * Math.max(u, Math.max(e, t));
        return [n, o * 100, t * 100];
      };
      r.rgb.cmyk = function (D) {
        const u = D[0] / 255;
        const e = D[1] / 255;
        const t = D[2] / 255;
        const n = Math.min(1 - u, 1 - e, 1 - t);
        const r = (1 - u - n) / (1 - n) || 0;
        const o = (1 - e - n) / (1 - n) || 0;
        const F = (1 - t - n) / (1 - n) || 0;
        return [r * 100, o * 100, F * 100, n * 100];
      };
      function comparativeDistance(D, u) {
        return (D[0] - u[0]) ** 2 + (D[1] - u[1]) ** 2 + (D[2] - u[2]) ** 2;
      }
      r.rgb.keyword = function (D) {
        const u = n[D];
        if (u) {
          return u;
        }
        let e = Infinity;
        let r;
        for (const u of Object.keys(t)) {
          const n = t[u];
          const o = comparativeDistance(D, n);
          if (o < e) {
            e = o;
            r = u;
          }
        }
        return r;
      };
      r.keyword.rgb = function (D) {
        return t[D];
      };
      r.rgb.xyz = function (D) {
        let u = D[0] / 255;
        let e = D[1] / 255;
        let t = D[2] / 255;
        u = u > 0.04045 ? ((u + 0.055) / 1.055) ** 2.4 : u / 12.92;
        e = e > 0.04045 ? ((e + 0.055) / 1.055) ** 2.4 : e / 12.92;
        t = t > 0.04045 ? ((t + 0.055) / 1.055) ** 2.4 : t / 12.92;
        const n = u * 0.4124 + e * 0.3576 + t * 0.1805;
        const r = u * 0.2126 + e * 0.7152 + t * 0.0722;
        const o = u * 0.0193 + e * 0.1192 + t * 0.9505;
        return [n * 100, r * 100, o * 100];
      };
      r.rgb.lab = function (D) {
        const u = r.rgb.xyz(D);
        let e = u[0];
        let t = u[1];
        let n = u[2];
        e /= 95.047;
        t /= 100;
        n /= 108.883;
        e = e > 0.008856 ? e ** (1 / 3) : 7.787 * e + 16 / 116;
        t = t > 0.008856 ? t ** (1 / 3) : 7.787 * t + 16 / 116;
        n = n > 0.008856 ? n ** (1 / 3) : 7.787 * n + 16 / 116;
        const o = 116 * t - 16;
        const F = 500 * (e - t);
        const s = 200 * (t - n);
        return [o, F, s];
      };
      r.hsl.rgb = function (D) {
        const u = D[0] / 360;
        const e = D[1] / 100;
        const t = D[2] / 100;
        let n;
        let r;
        let o;
        if (e === 0) {
          o = t * 255;
          return [o, o, o];
        }
        if (t < 0.5) {
          n = t * (1 + e);
        } else {
          n = t + e - t * e;
        }
        const F = 2 * t - n;
        const s = [0, 0, 0];
        for (let D = 0; D < 3; D++) {
          r = u + (1 / 3) * -(D - 1);
          if (r < 0) {
            r++;
          }
          if (r > 1) {
            r--;
          }
          if (6 * r < 1) {
            o = F + (n - F) * 6 * r;
          } else if (2 * r < 1) {
            o = n;
          } else if (3 * r < 2) {
            o = F + (n - F) * (2 / 3 - r) * 6;
          } else {
            o = F;
          }
          s[D] = o * 255;
        }
        return s;
      };
      r.hsl.hsv = function (D) {
        const u = D[0];
        let e = D[1] / 100;
        let t = D[2] / 100;
        let n = e;
        const r = Math.max(t, 0.01);
        t *= 2;
        e *= t <= 1 ? t : 2 - t;
        n *= r <= 1 ? r : 2 - r;
        const o = (t + e) / 2;
        const F = t === 0 ? (2 * n) / (r + n) : (2 * e) / (t + e);
        return [u, F * 100, o * 100];
      };
      r.hsv.rgb = function (D) {
        const u = D[0] / 60;
        const e = D[1] / 100;
        let t = D[2] / 100;
        const n = Math.floor(u) % 6;
        const r = u - Math.floor(u);
        const o = 255 * t * (1 - e);
        const F = 255 * t * (1 - e * r);
        const s = 255 * t * (1 - e * (1 - r));
        t *= 255;
        switch (n) {
          case 0:
            return [t, s, o];
          case 1:
            return [F, t, o];
          case 2:
            return [o, t, s];
          case 3:
            return [o, F, t];
          case 4:
            return [s, o, t];
          case 5:
            return [t, o, F];
        }
      };
      r.hsv.hsl = function (D) {
        const u = D[0];
        const e = D[1] / 100;
        const t = D[2] / 100;
        const n = Math.max(t, 0.01);
        let r;
        let o;
        o = (2 - e) * t;
        const F = (2 - e) * n;
        r = e * n;
        r /= F <= 1 ? F : 2 - F;
        r = r || 0;
        o /= 2;
        return [u, r * 100, o * 100];
      };
      r.hwb.rgb = function (D) {
        const u = D[0] / 360;
        let e = D[1] / 100;
        let t = D[2] / 100;
        const n = e + t;
        let r;
        if (n > 1) {
          e /= n;
          t /= n;
        }
        const o = Math.floor(6 * u);
        const F = 1 - t;
        r = 6 * u - o;
        if ((o & 1) !== 0) {
          r = 1 - r;
        }
        const s = e + r * (F - e);
        let c;
        let C;
        let i;
        switch (o) {
          default:
          case 6:
          case 0:
            c = F;
            C = s;
            i = e;
            break;
          case 1:
            c = s;
            C = F;
            i = e;
            break;
          case 2:
            c = e;
            C = F;
            i = s;
            break;
          case 3:
            c = e;
            C = s;
            i = F;
            break;
          case 4:
            c = s;
            C = e;
            i = F;
            break;
          case 5:
            c = F;
            C = e;
            i = s;
            break;
        }
        return [c * 255, C * 255, i * 255];
      };
      r.cmyk.rgb = function (D) {
        const u = D[0] / 100;
        const e = D[1] / 100;
        const t = D[2] / 100;
        const n = D[3] / 100;
        const r = 1 - Math.min(1, u * (1 - n) + n);
        const o = 1 - Math.min(1, e * (1 - n) + n);
        const F = 1 - Math.min(1, t * (1 - n) + n);
        return [r * 255, o * 255, F * 255];
      };
      r.xyz.rgb = function (D) {
        const u = D[0] / 100;
        const e = D[1] / 100;
        const t = D[2] / 100;
        let n;
        let r;
        let o;
        n = u * 3.2406 + e * -1.5372 + t * -0.4986;
        r = u * -0.9689 + e * 1.8758 + t * 0.0415;
        o = u * 0.0557 + e * -0.204 + t * 1.057;
        n = n > 0.0031308 ? 1.055 * n ** (1 / 2.4) - 0.055 : n * 12.92;
        r = r > 0.0031308 ? 1.055 * r ** (1 / 2.4) - 0.055 : r * 12.92;
        o = o > 0.0031308 ? 1.055 * o ** (1 / 2.4) - 0.055 : o * 12.92;
        n = Math.min(Math.max(0, n), 1);
        r = Math.min(Math.max(0, r), 1);
        o = Math.min(Math.max(0, o), 1);
        return [n * 255, r * 255, o * 255];
      };
      r.xyz.lab = function (D) {
        let u = D[0];
        let e = D[1];
        let t = D[2];
        u /= 95.047;
        e /= 100;
        t /= 108.883;
        u = u > 0.008856 ? u ** (1 / 3) : 7.787 * u + 16 / 116;
        e = e > 0.008856 ? e ** (1 / 3) : 7.787 * e + 16 / 116;
        t = t > 0.008856 ? t ** (1 / 3) : 7.787 * t + 16 / 116;
        const n = 116 * e - 16;
        const r = 500 * (u - e);
        const o = 200 * (e - t);
        return [n, r, o];
      };
      r.lab.xyz = function (D) {
        const u = D[0];
        const e = D[1];
        const t = D[2];
        let n;
        let r;
        let o;
        r = (u + 16) / 116;
        n = e / 500 + r;
        o = r - t / 200;
        const F = r ** 3;
        const s = n ** 3;
        const c = o ** 3;
        r = F > 0.008856 ? F : (r - 16 / 116) / 7.787;
        n = s > 0.008856 ? s : (n - 16 / 116) / 7.787;
        o = c > 0.008856 ? c : (o - 16 / 116) / 7.787;
        n *= 95.047;
        r *= 100;
        o *= 108.883;
        return [n, r, o];
      };
      r.lab.lch = function (D) {
        const u = D[0];
        const e = D[1];
        const t = D[2];
        let n;
        const r = Math.atan2(t, e);
        n = (r * 360) / 2 / Math.PI;
        if (n < 0) {
          n += 360;
        }
        const o = Math.sqrt(e * e + t * t);
        return [u, o, n];
      };
      r.lch.lab = function (D) {
        const u = D[0];
        const e = D[1];
        const t = D[2];
        const n = (t / 360) * 2 * Math.PI;
        const r = e * Math.cos(n);
        const o = e * Math.sin(n);
        return [u, r, o];
      };
      r.rgb.ansi16 = function (D, u = null) {
        const [e, t, n] = D;
        let o = u === null ? r.rgb.hsv(D)[2] : u;
        o = Math.round(o / 50);
        if (o === 0) {
          return 30;
        }
        let F =
          30 +
          ((Math.round(n / 255) << 2) |
            (Math.round(t / 255) << 1) |
            Math.round(e / 255));
        if (o === 2) {
          F += 60;
        }
        return F;
      };
      r.hsv.ansi16 = function (D) {
        return r.rgb.ansi16(r.hsv.rgb(D), D[2]);
      };
      r.rgb.ansi256 = function (D) {
        const u = D[0];
        const e = D[1];
        const t = D[2];
        if (u === e && e === t) {
          if (u < 8) {
            return 16;
          }
          if (u > 248) {
            return 231;
          }
          return Math.round(((u - 8) / 247) * 24) + 232;
        }
        const n =
          16 +
          36 * Math.round((u / 255) * 5) +
          6 * Math.round((e / 255) * 5) +
          Math.round((t / 255) * 5);
        return n;
      };
      r.ansi16.rgb = function (D) {
        let u = D % 10;
        if (u === 0 || u === 7) {
          if (D > 50) {
            u += 3.5;
          }
          u = (u / 10.5) * 255;
          return [u, u, u];
        }
        const e = (~~(D > 50) + 1) * 0.5;
        const t = (u & 1) * e * 255;
        const n = ((u >> 1) & 1) * e * 255;
        const r = ((u >> 2) & 1) * e * 255;
        return [t, n, r];
      };
      r.ansi256.rgb = function (D) {
        if (D >= 232) {
          const u = (D - 232) * 10 + 8;
          return [u, u, u];
        }
        D -= 16;
        let u;
        const e = (Math.floor(D / 36) / 5) * 255;
        const t = (Math.floor((u = D % 36) / 6) / 5) * 255;
        const n = ((u % 6) / 5) * 255;
        return [e, t, n];
      };
      r.rgb.hex = function (D) {
        const u =
          ((Math.round(D[0]) & 255) << 16) +
          ((Math.round(D[1]) & 255) << 8) +
          (Math.round(D[2]) & 255);
        const e = u.toString(16).toUpperCase();
        return '000000'.substring(e.length) + e;
      };
      r.hex.rgb = function (D) {
        const u = D.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);
        if (!u) {
          return [0, 0, 0];
        }
        let e = u[0];
        if (u[0].length === 3) {
          e = e
            .split('')
            .map((D) => D + D)
            .join('');
        }
        const t = parseInt(e, 16);
        const n = (t >> 16) & 255;
        const r = (t >> 8) & 255;
        const o = t & 255;
        return [n, r, o];
      };
      r.rgb.hcg = function (D) {
        const u = D[0] / 255;
        const e = D[1] / 255;
        const t = D[2] / 255;
        const n = Math.max(Math.max(u, e), t);
        const r = Math.min(Math.min(u, e), t);
        const o = n - r;
        let F;
        let s;
        if (o < 1) {
          F = r / (1 - o);
        } else {
          F = 0;
        }
        if (o <= 0) {
          s = 0;
        } else if (n === u) {
          s = ((e - t) / o) % 6;
        } else if (n === e) {
          s = 2 + (t - u) / o;
        } else {
          s = 4 + (u - e) / o;
        }
        s /= 6;
        s %= 1;
        return [s * 360, o * 100, F * 100];
      };
      r.hsl.hcg = function (D) {
        const u = D[1] / 100;
        const e = D[2] / 100;
        const t = e < 0.5 ? 2 * u * e : 2 * u * (1 - e);
        let n = 0;
        if (t < 1) {
          n = (e - 0.5 * t) / (1 - t);
        }
        return [D[0], t * 100, n * 100];
      };
      r.hsv.hcg = function (D) {
        const u = D[1] / 100;
        const e = D[2] / 100;
        const t = u * e;
        let n = 0;
        if (t < 1) {
          n = (e - t) / (1 - t);
        }
        return [D[0], t * 100, n * 100];
      };
      r.hcg.rgb = function (D) {
        const u = D[0] / 360;
        const e = D[1] / 100;
        const t = D[2] / 100;
        if (e === 0) {
          return [t * 255, t * 255, t * 255];
        }
        const n = [0, 0, 0];
        const r = (u % 1) * 6;
        const o = r % 1;
        const F = 1 - o;
        let s = 0;
        switch (Math.floor(r)) {
          case 0:
            n[0] = 1;
            n[1] = o;
            n[2] = 0;
            break;
          case 1:
            n[0] = F;
            n[1] = 1;
            n[2] = 0;
            break;
          case 2:
            n[0] = 0;
            n[1] = 1;
            n[2] = o;
            break;
          case 3:
            n[0] = 0;
            n[1] = F;
            n[2] = 1;
            break;
          case 4:
            n[0] = o;
            n[1] = 0;
            n[2] = 1;
            break;
          default:
            n[0] = 1;
            n[1] = 0;
            n[2] = F;
        }
        s = (1 - e) * t;
        return [
          (e * n[0] + s) * 255,
          (e * n[1] + s) * 255,
          (e * n[2] + s) * 255,
        ];
      };
      r.hcg.hsv = function (D) {
        const u = D[1] / 100;
        const e = D[2] / 100;
        const t = u + e * (1 - u);
        let n = 0;
        if (t > 0) {
          n = u / t;
        }
        return [D[0], n * 100, t * 100];
      };
      r.hcg.hsl = function (D) {
        const u = D[1] / 100;
        const e = D[2] / 100;
        const t = e * (1 - u) + 0.5 * u;
        let n = 0;
        if (t > 0 && t < 0.5) {
          n = u / (2 * t);
        } else if (t >= 0.5 && t < 1) {
          n = u / (2 * (1 - t));
        }
        return [D[0], n * 100, t * 100];
      };
      r.hcg.hwb = function (D) {
        const u = D[1] / 100;
        const e = D[2] / 100;
        const t = u + e * (1 - u);
        return [D[0], (t - u) * 100, (1 - t) * 100];
      };
      r.hwb.hcg = function (D) {
        const u = D[1] / 100;
        const e = D[2] / 100;
        const t = 1 - e;
        const n = t - u;
        let r = 0;
        if (n < 1) {
          r = (t - n) / (1 - n);
        }
        return [D[0], n * 100, r * 100];
      };
      r.apple.rgb = function (D) {
        return [
          (D[0] / 65535) * 255,
          (D[1] / 65535) * 255,
          (D[2] / 65535) * 255,
        ];
      };
      r.rgb.apple = function (D) {
        return [
          (D[0] / 255) * 65535,
          (D[1] / 255) * 65535,
          (D[2] / 255) * 65535,
        ];
      };
      r.gray.rgb = function (D) {
        return [(D[0] / 100) * 255, (D[0] / 100) * 255, (D[0] / 100) * 255];
      };
      r.gray.hsl = function (D) {
        return [0, 0, D[0]];
      };
      r.gray.hsv = r.gray.hsl;
      r.gray.hwb = function (D) {
        return [0, 100, D[0]];
      };
      r.gray.cmyk = function (D) {
        return [0, 0, 0, D[0]];
      };
      r.gray.lab = function (D) {
        return [D[0], 0, 0];
      };
      r.gray.hex = function (D) {
        const u = Math.round((D[0] / 100) * 255) & 255;
        const e = (u << 16) + (u << 8) + u;
        const t = e.toString(16).toUpperCase();
        return '000000'.substring(t.length) + t;
      };
      r.rgb.gray = function (D) {
        const u = (D[0] + D[1] + D[2]) / 3;
        return [(u / 255) * 100];
      };
    },
    767: (D, u, e) => {
      const t = e(226);
      const n = e(392);
      const r = {};
      const o = Object.keys(t);
      function wrapRaw(D) {
        const wrappedFn = function (...u) {
          const e = u[0];
          if (e === undefined || e === null) {
            return e;
          }
          if (e.length > 1) {
            u = e;
          }
          return D(u);
        };
        if ('conversion' in D) {
          wrappedFn.conversion = D.conversion;
        }
        return wrappedFn;
      }
      function wrapRounded(D) {
        const wrappedFn = function (...u) {
          const e = u[0];
          if (e === undefined || e === null) {
            return e;
          }
          if (e.length > 1) {
            u = e;
          }
          const t = D(u);
          if (typeof t === 'object') {
            for (let D = t.length, u = 0; u < D; u++) {
              t[u] = Math.round(t[u]);
            }
          }
          return t;
        };
        if ('conversion' in D) {
          wrappedFn.conversion = D.conversion;
        }
        return wrappedFn;
      }
      o.forEach((D) => {
        r[D] = {};
        Object.defineProperty(r[D], 'channels', { value: t[D].channels });
        Object.defineProperty(r[D], 'labels', { value: t[D].labels });
        const u = n(D);
        const e = Object.keys(u);
        e.forEach((e) => {
          const t = u[e];
          r[D][e] = wrapRounded(t);
          r[D][e].raw = wrapRaw(t);
        });
      });
      D.exports = r;
    },
    392: (D, u, e) => {
      const t = e(226);
      function buildGraph() {
        const D = {};
        const u = Object.keys(t);
        for (let e = u.length, t = 0; t < e; t++) {
          D[u[t]] = { distance: -1, parent: null };
        }
        return D;
      }
      function deriveBFS(D) {
        const u = buildGraph();
        const e = [D];
        u[D].distance = 0;
        while (e.length) {
          const D = e.pop();
          const n = Object.keys(t[D]);
          for (let t = n.length, r = 0; r < t; r++) {
            const t = n[r];
            const o = u[t];
            if (o.distance === -1) {
              o.distance = u[D].distance + 1;
              o.parent = D;
              e.unshift(t);
            }
          }
        }
        return u;
      }
      function link(D, u) {
        return function (e) {
          return u(D(e));
        };
      }
      function wrapConversion(D, u) {
        const e = [u[D].parent, D];
        let n = t[u[D].parent][D];
        let r = u[D].parent;
        while (u[r].parent) {
          e.unshift(u[r].parent);
          n = link(t[u[r].parent][r], n);
          r = u[r].parent;
        }
        n.conversion = e;
        return n;
      }
      D.exports = function (D) {
        const u = deriveBFS(D);
        const e = {};
        const t = Object.keys(u);
        for (let D = t.length, n = 0; n < D; n++) {
          const D = t[n];
          const r = u[D];
          if (r.parent === null) {
            continue;
          }
          e[D] = wrapConversion(D, u);
        }
        return e;
      };
    },
    866: (D) => {
      'use strict';
      D.exports = {
        aliceblue: [240, 248, 255],
        antiquewhite: [250, 235, 215],
        aqua: [0, 255, 255],
        aquamarine: [127, 255, 212],
        azure: [240, 255, 255],
        beige: [245, 245, 220],
        bisque: [255, 228, 196],
        black: [0, 0, 0],
        blanchedalmond: [255, 235, 205],
        blue: [0, 0, 255],
        blueviolet: [138, 43, 226],
        brown: [165, 42, 42],
        burlywood: [222, 184, 135],
        cadetblue: [95, 158, 160],
        chartreuse: [127, 255, 0],
        chocolate: [210, 105, 30],
        coral: [255, 127, 80],
        cornflowerblue: [100, 149, 237],
        cornsilk: [255, 248, 220],
        crimson: [220, 20, 60],
        cyan: [0, 255, 255],
        darkblue: [0, 0, 139],
        darkcyan: [0, 139, 139],
        darkgoldenrod: [184, 134, 11],
        darkgray: [169, 169, 169],
        darkgreen: [0, 100, 0],
        darkgrey: [169, 169, 169],
        darkkhaki: [189, 183, 107],
        darkmagenta: [139, 0, 139],
        darkolivegreen: [85, 107, 47],
        darkorange: [255, 140, 0],
        darkorchid: [153, 50, 204],
        darkred: [139, 0, 0],
        darksalmon: [233, 150, 122],
        darkseagreen: [143, 188, 143],
        darkslateblue: [72, 61, 139],
        darkslategray: [47, 79, 79],
        darkslategrey: [47, 79, 79],
        darkturquoise: [0, 206, 209],
        darkviolet: [148, 0, 211],
        deeppink: [255, 20, 147],
        deepskyblue: [0, 191, 255],
        dimgray: [105, 105, 105],
        dimgrey: [105, 105, 105],
        dodgerblue: [30, 144, 255],
        firebrick: [178, 34, 34],
        floralwhite: [255, 250, 240],
        forestgreen: [34, 139, 34],
        fuchsia: [255, 0, 255],
        gainsboro: [220, 220, 220],
        ghostwhite: [248, 248, 255],
        gold: [255, 215, 0],
        goldenrod: [218, 165, 32],
        gray: [128, 128, 128],
        green: [0, 128, 0],
        greenyellow: [173, 255, 47],
        grey: [128, 128, 128],
        honeydew: [240, 255, 240],
        hotpink: [255, 105, 180],
        indianred: [205, 92, 92],
        indigo: [75, 0, 130],
        ivory: [255, 255, 240],
        khaki: [240, 230, 140],
        lavender: [230, 230, 250],
        lavenderblush: [255, 240, 245],
        lawngreen: [124, 252, 0],
        lemonchiffon: [255, 250, 205],
        lightblue: [173, 216, 230],
        lightcoral: [240, 128, 128],
        lightcyan: [224, 255, 255],
        lightgoldenrodyellow: [250, 250, 210],
        lightgray: [211, 211, 211],
        lightgreen: [144, 238, 144],
        lightgrey: [211, 211, 211],
        lightpink: [255, 182, 193],
        lightsalmon: [255, 160, 122],
        lightseagreen: [32, 178, 170],
        lightskyblue: [135, 206, 250],
        lightslategray: [119, 136, 153],
        lightslategrey: [119, 136, 153],
        lightsteelblue: [176, 196, 222],
        lightyellow: [255, 255, 224],
        lime: [0, 255, 0],
        limegreen: [50, 205, 50],
        linen: [250, 240, 230],
        magenta: [255, 0, 255],
        maroon: [128, 0, 0],
        mediumaquamarine: [102, 205, 170],
        mediumblue: [0, 0, 205],
        mediumorchid: [186, 85, 211],
        mediumpurple: [147, 112, 219],
        mediumseagreen: [60, 179, 113],
        mediumslateblue: [123, 104, 238],
        mediumspringgreen: [0, 250, 154],
        mediumturquoise: [72, 209, 204],
        mediumvioletred: [199, 21, 133],
        midnightblue: [25, 25, 112],
        mintcream: [245, 255, 250],
        mistyrose: [255, 228, 225],
        moccasin: [255, 228, 181],
        navajowhite: [255, 222, 173],
        navy: [0, 0, 128],
        oldlace: [253, 245, 230],
        olive: [128, 128, 0],
        olivedrab: [107, 142, 35],
        orange: [255, 165, 0],
        orangered: [255, 69, 0],
        orchid: [218, 112, 214],
        palegoldenrod: [238, 232, 170],
        palegreen: [152, 251, 152],
        paleturquoise: [175, 238, 238],
        palevioletred: [219, 112, 147],
        papayawhip: [255, 239, 213],
        peachpuff: [255, 218, 185],
        peru: [205, 133, 63],
        pink: [255, 192, 203],
        plum: [221, 160, 221],
        powderblue: [176, 224, 230],
        purple: [128, 0, 128],
        rebeccapurple: [102, 51, 153],
        red: [255, 0, 0],
        rosybrown: [188, 143, 143],
        royalblue: [65, 105, 225],
        saddlebrown: [139, 69, 19],
        salmon: [250, 128, 114],
        sandybrown: [244, 164, 96],
        seagreen: [46, 139, 87],
        seashell: [255, 245, 238],
        sienna: [160, 82, 45],
        silver: [192, 192, 192],
        skyblue: [135, 206, 235],
        slateblue: [106, 90, 205],
        slategray: [112, 128, 144],
        slategrey: [112, 128, 144],
        snow: [255, 250, 250],
        springgreen: [0, 255, 127],
        steelblue: [70, 130, 180],
        tan: [210, 180, 140],
        teal: [0, 128, 128],
        thistle: [216, 191, 216],
        tomato: [255, 99, 71],
        turquoise: [64, 224, 208],
        violet: [238, 130, 238],
        wheat: [245, 222, 179],
        white: [255, 255, 255],
        whitesmoke: [245, 245, 245],
        yellow: [255, 255, 0],
        yellowgreen: [154, 205, 50],
      };
    },
    331: (D) => {
      'use strict';
      D.exports = function () {
        return /\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74|\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F|\uD83D\uDC68(?:\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68\uD83C\uDFFB|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFE])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D[\uDC66\uDC67])|[\u2695\u2696\u2708]\uFE0F|\uD83D[\uDC66\uDC67]|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|(?:\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708])\uFE0F|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C[\uDFFB-\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFB\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)\uD83C\uDFFB|\uD83E\uDDD1(?:\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])|\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1)|(?:\uD83E\uDDD1\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFE])|(?:\uD83E\uDDD1\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)(?:\uD83C[\uDFFB\uDFFC])|\uD83D\uDC69(?:\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFC-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|(?:\uD83E\uDDD1\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)(?:\uD83C[\uDFFB-\uDFFD])|\uD83D\uDC69\u200D\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83D\uDC69(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|(?:(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)\uFE0F|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF])\u200D[\u2640\u2642]|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD6-\uDDDD])(?:(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|\u200D[\u2640\u2642])|\uD83C\uDFF4\u200D\u2620)\uFE0F|\uD83D\uDC69\u200D\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|\uD83D\uDC15\u200D\uD83E\uDDBA|\uD83D\uDC69\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC67|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF4\uD83C\uDDF2|\uD83C\uDDF6\uD83C\uDDE6|[#\*0-9]\uFE0F\u20E3|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270A-\u270D]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC70\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDCAA\uDD74\uDD7A\uDD90\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD36\uDDB5\uDDB6\uDDBB\uDDD2-\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDED5\uDEEB\uDEEC\uDEF4-\uDEFA\uDFE0-\uDFEB]|\uD83E[\uDD0D-\uDD3A\uDD3C-\uDD45\uDD47-\uDD71\uDD73-\uDD76\uDD7A-\uDDA2\uDDA5-\uDDAA\uDDAE-\uDDCA\uDDCD-\uDDFF\uDE70-\uDE73\uDE78-\uDE7A\uDE80-\uDE82\uDE90-\uDE95])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDED5\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEFA\uDFE0-\uDFEB]|\uD83E[\uDD0D-\uDD3A\uDD3C-\uDD45\uDD47-\uDD71\uDD73-\uDD76\uDD7A-\uDDA2\uDDA5-\uDDAA\uDDAE-\uDDCA\uDDCD-\uDDFF\uDE70-\uDE73\uDE78-\uDE7A\uDE80-\uDE82\uDE90-\uDE95])\uFE0F|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDC8F\uDC91\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD0F\uDD18-\uDD1F\uDD26\uDD30-\uDD39\uDD3C-\uDD3E\uDDB5\uDDB6\uDDB8\uDDB9\uDDBB\uDDCD-\uDDCF\uDDD1-\uDDDD])/g;
      };
    },
    82: (D) => {
      'use strict';
      const isFullwidthCodePoint = (D) => {
        if (Number.isNaN(D)) {
          return false;
        }
        if (
          D >= 4352 &&
          (D <= 4447 ||
            D === 9001 ||
            D === 9002 ||
            (11904 <= D && D <= 12871 && D !== 12351) ||
            (12880 <= D && D <= 19903) ||
            (19968 <= D && D <= 42182) ||
            (43360 <= D && D <= 43388) ||
            (44032 <= D && D <= 55203) ||
            (63744 <= D && D <= 64255) ||
            (65040 <= D && D <= 65049) ||
            (65072 <= D && D <= 65131) ||
            (65281 <= D && D <= 65376) ||
            (65504 <= D && D <= 65510) ||
            (110592 <= D && D <= 110593) ||
            (127488 <= D && D <= 127569) ||
            (131072 <= D && D <= 262141))
        ) {
          return true;
        }
        return false;
      };
      D.exports = isFullwidthCodePoint;
      D.exports['default'] = isFullwidthCodePoint;
    },
    770: (D, u, e) => {
      'use strict';
      const t = e(82);
      const n = e(788);
      const r = e(44);
      const o = ['', ''];
      const wrapAnsi = (D) => `${o[0]}[${D}m`;
      const checkAnsi = (D, u, e) => {
        let t = [];
        D = [...D];
        for (let e of D) {
          const n = e;
          if (e.match(';')) {
            e = e.split(';')[0][0] + '0';
          }
          const o = r.codes.get(parseInt(e, 10));
          if (o) {
            const e = D.indexOf(o.toString());
            if (e >= 0) {
              D.splice(e, 1);
            } else {
              t.push(wrapAnsi(u ? o : n));
            }
          } else if (u) {
            t.push(wrapAnsi(0));
            break;
          } else {
            t.push(wrapAnsi(n));
          }
        }
        if (u) {
          t = t.filter((D, u) => t.indexOf(D) === u);
          if (e !== undefined) {
            const D = wrapAnsi(r.codes.get(parseInt(e, 10)));
            t = t.reduce((u, e) => (e === D ? [e, ...u] : [...u, e]), []);
          }
        }
        return t.join('');
      };
      D.exports = (D, u, e) => {
        const r = [...D.normalize()];
        const F = [];
        e = typeof e === 'number' ? e : r.length;
        let s = false;
        let c;
        let C = 0;
        let i = '';
        for (const [l, a] of r.entries()) {
          let r = false;
          if (o.includes(a)) {
            const u = /\d[^m]*/.exec(D.slice(l, l + 18));
            c = u && u.length > 0 ? u[0] : undefined;
            if (C < e) {
              s = true;
              if (c !== undefined) {
                F.push(c);
              }
            }
          } else if (s && a === 'm') {
            s = false;
            r = true;
          }
          if (!s && !r) {
            ++C;
          }
          if (!n({ exact: true }).test(a) && t(a.codePointAt())) {
            ++C;
          }
          if (C > u && C <= e) {
            i += a;
          } else if (C === u && !s && c !== undefined) {
            i = checkAnsi(F);
          } else if (C >= e) {
            i += checkAnsi(F, true, c);
            break;
          }
        }
        return i;
      };
    },
    629: (D, u, e) => {
      'use strict';
      const t = e(647);
      const n = e(82);
      const r = e(331);
      const stringWidth = (D) => {
        if (typeof D !== 'string' || D.length === 0) {
          return 0;
        }
        D = t(D);
        if (D.length === 0) {
          return 0;
        }
        D = D.replace(r(), '  ');
        let u = 0;
        for (let e = 0; e < D.length; e++) {
          const t = D.codePointAt(e);
          if (t <= 31 || (t >= 127 && t <= 159)) {
            continue;
          }
          if (t >= 768 && t <= 879) {
            continue;
          }
          if (t > 65535) {
            e++;
          }
          u += n(t) ? 2 : 1;
        }
        return u;
      };
      D.exports = stringWidth;
      D.exports['default'] = stringWidth;
    },
    647: (D, u, e) => {
      'use strict';
      const t = e(275);
      D.exports = (D) => (typeof D === 'string' ? D.replace(t(), '') : D);
    },
  };
  var u = {};
  function __nccwpck_require__(e) {
    var t = u[e];
    if (t !== undefined) {
      return t.exports;
    }
    var n = (u[e] = { id: e, loaded: false, exports: {} });
    var r = true;
    try {
      D[e](n, n.exports, __nccwpck_require__);
      r = false;
    } finally {
      if (r) delete u[e];
    }
    n.loaded = true;
    return n.exports;
  }
  (() => {
    __nccwpck_require__.nmd = (D) => {
      D.paths = [];
      if (!D.children) D.children = [];
      return D;
    };
  })();
  if (typeof __nccwpck_require__ !== 'undefined')
    __nccwpck_require__.ab = __dirname + '/';
  var e = __nccwpck_require__(922);
  module.exports = e;
})();
