(() => {
  var e = {
    4133: (e, r, t) => {
      'use strict';
      var a = t(5507);
      e.exports = defineKeywords;
      function defineKeywords(e, r) {
        if (Array.isArray(r)) {
          for (var t = 0; t < r.length; t++) get(r[t])(e);
          return e;
        }
        if (r) {
          get(r)(e);
          return e;
        }
        for (r in a) get(r)(e);
        return e;
      }
      defineKeywords.get = get;
      function get(e) {
        var r = a[e];
        if (!r) throw new Error('Unknown keyword ' + e);
        return r;
      }
    },
    7921: (e, r, t) => {
      'use strict';
      var a = /^(\d\d):(\d\d):(\d\d)(\.\d+)?(z|[+-]\d\d:\d\d)?$/i;
      var s = /t|\s/i;
      var i = {
        date: compareDate,
        time: compareTime,
        'date-time': compareDateTime,
      };
      var o = {
        type: 'object',
        required: ['$data'],
        properties: {
          $data: {
            type: 'string',
            anyOf: [
              { format: 'relative-json-pointer' },
              { format: 'json-pointer' },
            ],
          },
        },
        additionalProperties: false,
      };
      e.exports = function (e) {
        var r = 'format' + e;
        return function defFunc(a) {
          defFunc.definition = {
            type: 'string',
            inline: t(6516),
            statements: true,
            errors: 'full',
            dependencies: ['format'],
            metaSchema: { anyOf: [{ type: 'string' }, o] },
          };
          a.addKeyword(r, defFunc.definition);
          a.addKeyword('formatExclusive' + e, {
            dependencies: ['format' + e],
            metaSchema: { anyOf: [{ type: 'boolean' }, o] },
          });
          extendFormats(a);
          return a;
        };
      };
      function extendFormats(e) {
        var r = e._formats;
        for (var t in i) {
          var a = r[t];
          if (typeof a != 'object' || a instanceof RegExp || !a.validate)
            a = r[t] = { validate: a };
          if (!a.compare) a.compare = i[t];
        }
      }
      function compareDate(e, r) {
        if (!(e && r)) return;
        if (e > r) return 1;
        if (e < r) return -1;
        if (e === r) return 0;
      }
      function compareTime(e, r) {
        if (!(e && r)) return;
        e = e.match(a);
        r = r.match(a);
        if (!(e && r)) return;
        e = e[1] + e[2] + e[3] + (e[4] || '');
        r = r[1] + r[2] + r[3] + (r[4] || '');
        if (e > r) return 1;
        if (e < r) return -1;
        if (e === r) return 0;
      }
      function compareDateTime(e, r) {
        if (!(e && r)) return;
        e = e.split(s);
        r = r.split(s);
        var t = compareDate(e[0], r[0]);
        if (t === undefined) return;
        return t || compareTime(e[1], r[1]);
      }
    },
    2298: (e) => {
      'use strict';
      e.exports = { metaSchemaRef: metaSchemaRef };
      var r = 'http://json-schema.org/draft-07/schema';
      function metaSchemaRef(e) {
        var t = e._opts.defaultMeta;
        if (typeof t == 'string') return { $ref: t };
        if (e.getSchema(r)) return { $ref: r };
        console.warn('meta schema not defined');
        return {};
      }
    },
    3672: (e) => {
      'use strict';
      e.exports = function defFunc(e) {
        defFunc.definition = {
          type: 'object',
          macro: function (e, r) {
            if (!e) return true;
            var t = Object.keys(r.properties);
            if (t.length == 0) return true;
            return { required: t };
          },
          metaSchema: { type: 'boolean' },
          dependencies: ['properties'],
        };
        e.addKeyword('allRequired', defFunc.definition);
        return e;
      };
    },
    2390: (e) => {
      'use strict';
      e.exports = function defFunc(e) {
        defFunc.definition = {
          type: 'object',
          macro: function (e) {
            if (e.length == 0) return true;
            if (e.length == 1) return { required: e };
            var r = e.map(function (e) {
              return { required: [e] };
            });
            return { anyOf: r };
          },
          metaSchema: { type: 'array', items: { type: 'string' } },
        };
        e.addKeyword('anyRequired', defFunc.definition);
        return e;
      };
    },
    9357: (e, r, t) => {
      'use strict';
      var a = t(2298);
      e.exports = function defFunc(e) {
        defFunc.definition = {
          type: 'object',
          macro: function (e) {
            var r = [];
            for (var t in e) r.push(getSchema(t, e[t]));
            return { allOf: r };
          },
          metaSchema: {
            type: 'object',
            propertyNames: { type: 'string', format: 'json-pointer' },
            additionalProperties: a.metaSchemaRef(e),
          },
        };
        e.addKeyword('deepProperties', defFunc.definition);
        return e;
      };
      function getSchema(e, r) {
        var t = e.split('/');
        var a = {};
        var s = a;
        for (var i = 1; i < t.length; i++) {
          var o = t[i];
          var n = i == t.length - 1;
          o = unescapeJsonPointer(o);
          var l = (s.properties = {});
          var u = undefined;
          if (/[0-9]+/.test(o)) {
            var f = +o;
            u = s.items = [];
            while (f--) u.push({});
          }
          s = n ? r : {};
          l[o] = s;
          if (u) u.push(s);
        }
        return a;
      }
      function unescapeJsonPointer(e) {
        return e.replace(/~1/g, '/').replace(/~0/g, '~');
      }
    },
    5568: (e) => {
      'use strict';
      e.exports = function defFunc(e) {
        defFunc.definition = {
          type: 'object',
          inline: function (e, r, t) {
            var a = '';
            for (var s = 0; s < t.length; s++) {
              if (s) a += ' && ';
              a += '(' + getData(t[s], e.dataLevel) + ' !== undefined)';
            }
            return a;
          },
          metaSchema: {
            type: 'array',
            items: { type: 'string', format: 'json-pointer' },
          },
        };
        e.addKeyword('deepRequired', defFunc.definition);
        return e;
      };
      function getData(e, r) {
        var t = 'data' + (r || '');
        if (!e) return t;
        var a = t;
        var s = e.split('/');
        for (var i = 1; i < s.length; i++) {
          var o = s[i];
          t += getProperty(unescapeJsonPointer(o));
          a += ' && ' + t;
        }
        return a;
      }
      var r = /^[a-z$_][a-z$_0-9]*$/i;
      var t = /^[0-9]+$/;
      var a = /'|\\/g;
      function getProperty(e) {
        return t.test(e)
          ? '[' + e + ']'
          : r.test(e)
          ? '.' + e
          : "['" + e.replace(a, '\\$&') + "']";
      }
      function unescapeJsonPointer(e) {
        return e.replace(/~1/g, '/').replace(/~0/g, '~');
      }
    },
    6516: (e) => {
      'use strict';
      e.exports = function generate__formatLimit(e, r, t) {
        var a = ' ';
        var s = e.level;
        var i = e.dataLevel;
        var o = e.schema[r];
        var n = e.schemaPath + e.util.getProperty(r);
        var l = e.errSchemaPath + '/' + r;
        var u = !e.opts.allErrors;
        var f;
        var c = 'data' + (i || '');
        var h = 'valid' + s;
        a += 'var ' + h + ' = undefined;';
        if (e.opts.format === false) {
          a += ' ' + h + ' = true; ';
          return a;
        }
        var d = e.schema.format,
          p = e.opts.$data && d.$data,
          m = '';
        if (p) {
          var g = e.util.getData(d.$data, i, e.dataPathArr),
            y = 'format' + s,
            P = 'compare' + s;
          a +=
            ' var ' +
            y +
            ' = formats[' +
            g +
            '] , ' +
            P +
            ' = ' +
            y +
            ' && ' +
            y +
            '.compare;';
        } else {
          var y = e.formats[d];
          if (!(y && y.compare)) {
            a += '  ' + h + ' = true; ';
            return a;
          }
          var P = 'formats' + e.util.getProperty(d) + '.compare';
        }
        var b = r == 'formatMaximum',
          E = 'formatExclusive' + (b ? 'Maximum' : 'Minimum'),
          S = e.schema[E],
          w = e.opts.$data && S && S.$data,
          x = b ? '<' : '>',
          $ = 'result' + s;
        var _ = e.opts.$data && o && o.$data,
          R;
        if (_) {
          a +=
            ' var schema' +
            s +
            ' = ' +
            e.util.getData(o.$data, i, e.dataPathArr) +
            '; ';
          R = 'schema' + s;
        } else {
          R = o;
        }
        if (w) {
          var F = e.util.getData(S.$data, i, e.dataPathArr),
            O = 'exclusive' + s,
            D = 'op' + s,
            j = "' + " + D + " + '";
          a += ' var schemaExcl' + s + ' = ' + F + '; ';
          F = 'schemaExcl' + s;
          a +=
            ' if (typeof ' +
            F +
            " != 'boolean' && " +
            F +
            ' !== undefined) { ' +
            h +
            ' = false; ';
          var f = E;
          var I = I || [];
          I.push(a);
          a = '';
          if (e.createErrors !== false) {
            a +=
              " { keyword: '" +
              (f || '_formatExclusiveLimit') +
              "' , dataPath: (dataPath || '') + " +
              e.errorPath +
              ' , schemaPath: ' +
              e.util.toQuotedString(l) +
              ' , params: {} ';
            if (e.opts.messages !== false) {
              a += " , message: '" + E + " should be boolean' ";
            }
            if (e.opts.verbose) {
              a +=
                ' , schema: validate.schema' +
                n +
                ' , parentSchema: validate.schema' +
                e.schemaPath +
                ' , data: ' +
                c +
                ' ';
            }
            a += ' } ';
          } else {
            a += ' {} ';
          }
          var k = a;
          a = I.pop();
          if (!e.compositeRule && u) {
            if (e.async) {
              a += ' throw new ValidationError([' + k + ']); ';
            } else {
              a += ' validate.errors = [' + k + ']; return false; ';
            }
          } else {
            a +=
              ' var err = ' +
              k +
              ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
          }
          a += ' }  ';
          if (u) {
            m += '}';
            a += ' else { ';
          }
          if (_) {
            a +=
              ' if (' +
              R +
              ' === undefined) ' +
              h +
              ' = true; else if (typeof ' +
              R +
              " != 'string') " +
              h +
              ' = false; else { ';
            m += '}';
          }
          if (p) {
            a += ' if (!' + P + ') ' + h + ' = true; else { ';
            m += '}';
          }
          a += ' var ' + $ + ' = ' + P + '(' + c + ',  ';
          if (_) {
            a += '' + R;
          } else {
            a += '' + e.util.toQuotedString(o);
          }
          a +=
            ' ); if (' +
            $ +
            ' === undefined) ' +
            h +
            ' = false; var ' +
            O +
            ' = ' +
            F +
            ' === true; if (' +
            h +
            ' === undefined) { ' +
            h +
            ' = ' +
            O +
            ' ? ' +
            $ +
            ' ' +
            x +
            ' 0 : ' +
            $ +
            ' ' +
            x +
            '= 0; } if (!' +
            h +
            ') var op' +
            s +
            ' = ' +
            O +
            " ? '" +
            x +
            "' : '" +
            x +
            "=';";
        } else {
          var O = S === true,
            j = x;
          if (!O) j += '=';
          var D = "'" + j + "'";
          if (_) {
            a +=
              ' if (' +
              R +
              ' === undefined) ' +
              h +
              ' = true; else if (typeof ' +
              R +
              " != 'string') " +
              h +
              ' = false; else { ';
            m += '}';
          }
          if (p) {
            a += ' if (!' + P + ') ' + h + ' = true; else { ';
            m += '}';
          }
          a += ' var ' + $ + ' = ' + P + '(' + c + ',  ';
          if (_) {
            a += '' + R;
          } else {
            a += '' + e.util.toQuotedString(o);
          }
          a +=
            ' ); if (' +
            $ +
            ' === undefined) ' +
            h +
            ' = false; if (' +
            h +
            ' === undefined) ' +
            h +
            ' = ' +
            $ +
            ' ' +
            x;
          if (!O) {
            a += '=';
          }
          a += ' 0;';
        }
        a += '' + m + 'if (!' + h + ') { ';
        var f = r;
        var I = I || [];
        I.push(a);
        a = '';
        if (e.createErrors !== false) {
          a +=
            " { keyword: '" +
            (f || '_formatLimit') +
            "' , dataPath: (dataPath || '') + " +
            e.errorPath +
            ' , schemaPath: ' +
            e.util.toQuotedString(l) +
            ' , params: { comparison: ' +
            D +
            ', limit:  ';
          if (_) {
            a += '' + R;
          } else {
            a += '' + e.util.toQuotedString(o);
          }
          a += ' , exclusive: ' + O + ' } ';
          if (e.opts.messages !== false) {
            a += " , message: 'should be " + j + ' "';
            if (_) {
              a += "' + " + R + " + '";
            } else {
              a += '' + e.util.escapeQuotes(o);
            }
            a += '"\' ';
          }
          if (e.opts.verbose) {
            a += ' , schema:  ';
            if (_) {
              a += 'validate.schema' + n;
            } else {
              a += '' + e.util.toQuotedString(o);
            }
            a +=
              '         , parentSchema: validate.schema' +
              e.schemaPath +
              ' , data: ' +
              c +
              ' ';
          }
          a += ' } ';
        } else {
          a += ' {} ';
        }
        var k = a;
        a = I.pop();
        if (!e.compositeRule && u) {
          if (e.async) {
            a += ' throw new ValidationError([' + k + ']); ';
          } else {
            a += ' validate.errors = [' + k + ']; return false; ';
          }
        } else {
          a +=
            ' var err = ' +
            k +
            ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
        }
        a += '}';
        return a;
      };
    },
    2558: (e) => {
      'use strict';
      e.exports = function generate_patternRequired(e, r, t) {
        var a = ' ';
        var s = e.level;
        var i = e.dataLevel;
        var o = e.schema[r];
        var n = e.schemaPath + e.util.getProperty(r);
        var l = e.errSchemaPath + '/' + r;
        var u = !e.opts.allErrors;
        var f = 'data' + (i || '');
        var c = 'valid' + s;
        var h = 'key' + s,
          d = 'idx' + s,
          p = 'patternMatched' + s,
          m = 'dataProperties' + s,
          g = '',
          y = e.opts.ownProperties;
        a += 'var ' + c + ' = true;';
        if (y) {
          a += ' var ' + m + ' = undefined;';
        }
        var P = o;
        if (P) {
          var b,
            E = -1,
            S = P.length - 1;
          while (E < S) {
            b = P[(E += 1)];
            a += ' var ' + p + ' = false;  ';
            if (y) {
              a +=
                ' ' +
                m +
                ' = ' +
                m +
                ' || Object.keys(' +
                f +
                '); for (var ' +
                d +
                '=0; ' +
                d +
                '<' +
                m +
                '.length; ' +
                d +
                '++) { var ' +
                h +
                ' = ' +
                m +
                '[' +
                d +
                ']; ';
            } else {
              a += ' for (var ' + h + ' in ' + f + ') { ';
            }
            a +=
              ' ' +
              p +
              ' = ' +
              e.usePattern(b) +
              '.test(' +
              h +
              '); if (' +
              p +
              ') break; } ';
            var w = e.util.escapeQuotes(b);
            a += ' if (!' + p + ') { ' + c + ' = false;  var err =   ';
            if (e.createErrors !== false) {
              a +=
                " { keyword: '" +
                'patternRequired' +
                "' , dataPath: (dataPath || '') + " +
                e.errorPath +
                ' , schemaPath: ' +
                e.util.toQuotedString(l) +
                " , params: { missingPattern: '" +
                w +
                "' } ";
              if (e.opts.messages !== false) {
                a +=
                  " , message: 'should have property matching pattern \\'" +
                  w +
                  "\\'' ";
              }
              if (e.opts.verbose) {
                a +=
                  ' , schema: validate.schema' +
                  n +
                  ' , parentSchema: validate.schema' +
                  e.schemaPath +
                  ' , data: ' +
                  f +
                  ' ';
              }
              a += ' } ';
            } else {
              a += ' {} ';
            }
            a +=
              ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; }   ';
            if (u) {
              g += '}';
              a += ' else { ';
            }
          }
        }
        a += '' + g;
        return a;
      };
    },
    5244: (e) => {
      'use strict';
      e.exports = function generate_switch(e, r, t) {
        var a = ' ';
        var s = e.level;
        var i = e.dataLevel;
        var o = e.schema[r];
        var n = e.schemaPath + e.util.getProperty(r);
        var l = e.errSchemaPath + '/' + r;
        var u = !e.opts.allErrors;
        var f = 'data' + (i || '');
        var c = 'valid' + s;
        var h = 'errs__' + s;
        var d = e.util.copy(e);
        var p = '';
        d.level++;
        var m = 'valid' + d.level;
        var g = 'ifPassed' + e.level,
          y = d.baseId,
          P;
        a += 'var ' + g + ';';
        var b = o;
        if (b) {
          var E,
            S = -1,
            w = b.length - 1;
          while (S < w) {
            E = b[(S += 1)];
            if (S && !P) {
              a += ' if (!' + g + ') { ';
              p += '}';
            }
            if (
              E.if &&
              (e.opts.strictKeywords
                ? typeof E.if == 'object' && Object.keys(E.if).length > 0
                : e.util.schemaHasRules(E.if, e.RULES.all))
            ) {
              a += ' var ' + h + ' = errors;   ';
              var x = e.compositeRule;
              e.compositeRule = d.compositeRule = true;
              d.createErrors = false;
              d.schema = E.if;
              d.schemaPath = n + '[' + S + '].if';
              d.errSchemaPath = l + '/' + S + '/if';
              a += '  ' + e.validate(d) + ' ';
              d.baseId = y;
              d.createErrors = true;
              e.compositeRule = d.compositeRule = x;
              a += ' ' + g + ' = ' + m + '; if (' + g + ') {  ';
              if (typeof E.then == 'boolean') {
                if (E.then === false) {
                  var $ = $ || [];
                  $.push(a);
                  a = '';
                  if (e.createErrors !== false) {
                    a +=
                      " { keyword: '" +
                      'switch' +
                      "' , dataPath: (dataPath || '') + " +
                      e.errorPath +
                      ' , schemaPath: ' +
                      e.util.toQuotedString(l) +
                      ' , params: { caseIndex: ' +
                      S +
                      ' } ';
                    if (e.opts.messages !== false) {
                      a +=
                        ' , message: \'should pass "switch" keyword validation\' ';
                    }
                    if (e.opts.verbose) {
                      a +=
                        ' , schema: validate.schema' +
                        n +
                        ' , parentSchema: validate.schema' +
                        e.schemaPath +
                        ' , data: ' +
                        f +
                        ' ';
                    }
                    a += ' } ';
                  } else {
                    a += ' {} ';
                  }
                  var _ = a;
                  a = $.pop();
                  if (!e.compositeRule && u) {
                    if (e.async) {
                      a += ' throw new ValidationError([' + _ + ']); ';
                    } else {
                      a += ' validate.errors = [' + _ + ']; return false; ';
                    }
                  } else {
                    a +=
                      ' var err = ' +
                      _ +
                      ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
                  }
                }
                a += ' var ' + m + ' = ' + E.then + '; ';
              } else {
                d.schema = E.then;
                d.schemaPath = n + '[' + S + '].then';
                d.errSchemaPath = l + '/' + S + '/then';
                a += '  ' + e.validate(d) + ' ';
                d.baseId = y;
              }
              a +=
                '  } else {  errors = ' +
                h +
                '; if (vErrors !== null) { if (' +
                h +
                ') vErrors.length = ' +
                h +
                '; else vErrors = null; } } ';
            } else {
              a += ' ' + g + ' = true;  ';
              if (typeof E.then == 'boolean') {
                if (E.then === false) {
                  var $ = $ || [];
                  $.push(a);
                  a = '';
                  if (e.createErrors !== false) {
                    a +=
                      " { keyword: '" +
                      'switch' +
                      "' , dataPath: (dataPath || '') + " +
                      e.errorPath +
                      ' , schemaPath: ' +
                      e.util.toQuotedString(l) +
                      ' , params: { caseIndex: ' +
                      S +
                      ' } ';
                    if (e.opts.messages !== false) {
                      a +=
                        ' , message: \'should pass "switch" keyword validation\' ';
                    }
                    if (e.opts.verbose) {
                      a +=
                        ' , schema: validate.schema' +
                        n +
                        ' , parentSchema: validate.schema' +
                        e.schemaPath +
                        ' , data: ' +
                        f +
                        ' ';
                    }
                    a += ' } ';
                  } else {
                    a += ' {} ';
                  }
                  var _ = a;
                  a = $.pop();
                  if (!e.compositeRule && u) {
                    if (e.async) {
                      a += ' throw new ValidationError([' + _ + ']); ';
                    } else {
                      a += ' validate.errors = [' + _ + ']; return false; ';
                    }
                  } else {
                    a +=
                      ' var err = ' +
                      _ +
                      ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
                  }
                }
                a += ' var ' + m + ' = ' + E.then + '; ';
              } else {
                d.schema = E.then;
                d.schemaPath = n + '[' + S + '].then';
                d.errSchemaPath = l + '/' + S + '/then';
                a += '  ' + e.validate(d) + ' ';
                d.baseId = y;
              }
            }
            P = E.continue;
          }
        }
        a += '' + p + 'var ' + c + ' = ' + m + ';';
        return a;
      };
    },
    8882: (e) => {
      'use strict';
      var r = {};
      var t = {
        timestamp: function () {
          return Date.now();
        },
        datetime: function () {
          return new Date().toISOString();
        },
        date: function () {
          return new Date().toISOString().slice(0, 10);
        },
        time: function () {
          return new Date().toISOString().slice(11);
        },
        random: function () {
          return Math.random();
        },
        randomint: function (e) {
          var r = (e && e.max) || 2;
          return function () {
            return Math.floor(Math.random() * r);
          };
        },
        seq: function (e) {
          var t = (e && e.name) || '';
          r[t] = r[t] || 0;
          return function () {
            return r[t]++;
          };
        },
      };
      e.exports = function defFunc(e) {
        defFunc.definition = {
          compile: function (e, r, t) {
            var a = {};
            for (var s in e) {
              var i = e[s];
              var o = getDefault(typeof i == 'string' ? i : i.func);
              a[s] = o.length ? o(i.args) : o;
            }
            return t.opts.useDefaults && !t.compositeRule
              ? assignDefaults
              : noop;
            function assignDefaults(r) {
              for (var s in e) {
                if (
                  r[s] === undefined ||
                  (t.opts.useDefaults == 'empty' &&
                    (r[s] === null || r[s] === ''))
                )
                  r[s] = a[s]();
              }
              return true;
            }
            function noop() {
              return true;
            }
          },
          DEFAULTS: t,
          metaSchema: {
            type: 'object',
            additionalProperties: {
              type: ['string', 'object'],
              additionalProperties: false,
              required: ['func', 'args'],
              properties: {
                func: { type: 'string' },
                args: { type: 'object' },
              },
            },
          },
        };
        e.addKeyword('dynamicDefaults', defFunc.definition);
        return e;
        function getDefault(e) {
          var r = t[e];
          if (r) return r;
          throw new Error(
            'invalid "dynamicDefaults" keyword property value: ' + e,
          );
        }
      };
    },
    442: (e, r, t) => {
      'use strict';
      e.exports = t(7921)('Maximum');
    },
    4422: (e, r, t) => {
      'use strict';
      e.exports = t(7921)('Minimum');
    },
    5507: (e, r, t) => {
      'use strict';
      e.exports = {
        instanceof: t(3300),
        range: t(6962),
        regexp: t(4840),
        typeof: t(1147),
        dynamicDefaults: t(8882),
        allRequired: t(3672),
        anyRequired: t(2390),
        oneRequired: t(9425),
        prohibited: t(8460),
        uniqueItemProperties: t(7705),
        deepProperties: t(9357),
        deepRequired: t(5568),
        formatMinimum: t(4422),
        formatMaximum: t(442),
        patternRequired: t(1780),
        switch: t(593),
        select: t(9128),
        transform: t(2615),
      };
    },
    3300: (e) => {
      'use strict';
      var r = {
        Object: Object,
        Array: Array,
        Function: Function,
        Number: Number,
        String: String,
        Date: Date,
        RegExp: RegExp,
      };
      e.exports = function defFunc(e) {
        if (typeof Buffer != 'undefined') r.Buffer = Buffer;
        if (typeof Promise != 'undefined') r.Promise = Promise;
        defFunc.definition = {
          compile: function (e) {
            if (typeof e == 'string') {
              var r = getConstructor(e);
              return function (e) {
                return e instanceof r;
              };
            }
            var t = e.map(getConstructor);
            return function (e) {
              for (var r = 0; r < t.length; r++)
                if (e instanceof t[r]) return true;
              return false;
            };
          },
          CONSTRUCTORS: r,
          metaSchema: {
            anyOf: [
              { type: 'string' },
              { type: 'array', items: { type: 'string' } },
            ],
          },
        };
        e.addKeyword('instanceof', defFunc.definition);
        return e;
        function getConstructor(e) {
          var t = r[e];
          if (t) return t;
          throw new Error('invalid "instanceof" keyword value ' + e);
        }
      };
    },
    9425: (e) => {
      'use strict';
      e.exports = function defFunc(e) {
        defFunc.definition = {
          type: 'object',
          macro: function (e) {
            if (e.length == 0) return true;
            if (e.length == 1) return { required: e };
            var r = e.map(function (e) {
              return { required: [e] };
            });
            return { oneOf: r };
          },
          metaSchema: { type: 'array', items: { type: 'string' } },
        };
        e.addKeyword('oneRequired', defFunc.definition);
        return e;
      };
    },
    1780: (e, r, t) => {
      'use strict';
      e.exports = function defFunc(e) {
        defFunc.definition = {
          type: 'object',
          inline: t(2558),
          statements: true,
          errors: 'full',
          metaSchema: {
            type: 'array',
            items: { type: 'string', format: 'regex' },
            uniqueItems: true,
          },
        };
        e.addKeyword('patternRequired', defFunc.definition);
        return e;
      };
    },
    8460: (e) => {
      'use strict';
      e.exports = function defFunc(e) {
        defFunc.definition = {
          type: 'object',
          macro: function (e) {
            if (e.length == 0) return true;
            if (e.length == 1) return { not: { required: e } };
            var r = e.map(function (e) {
              return { required: [e] };
            });
            return { not: { anyOf: r } };
          },
          metaSchema: { type: 'array', items: { type: 'string' } },
        };
        e.addKeyword('prohibited', defFunc.definition);
        return e;
      };
    },
    6962: (e) => {
      'use strict';
      e.exports = function defFunc(e) {
        defFunc.definition = {
          type: 'number',
          macro: function (e, r) {
            var t = e[0],
              a = e[1],
              s = r.exclusiveRange;
            validateRangeSchema(t, a, s);
            return s === true
              ? { exclusiveMinimum: t, exclusiveMaximum: a }
              : { minimum: t, maximum: a };
          },
          metaSchema: {
            type: 'array',
            minItems: 2,
            maxItems: 2,
            items: { type: 'number' },
          },
        };
        e.addKeyword('range', defFunc.definition);
        e.addKeyword('exclusiveRange');
        return e;
        function validateRangeSchema(e, r, t) {
          if (t !== undefined && typeof t != 'boolean')
            throw new Error(
              'Invalid schema for exclusiveRange keyword, should be boolean',
            );
          if (e > r || (t && e == r))
            throw new Error('There are no numbers in range');
        }
      };
    },
    4840: (e) => {
      'use strict';
      e.exports = function defFunc(e) {
        defFunc.definition = {
          type: 'string',
          inline: function (e, r, t) {
            return getRegExp() + '.test(data' + (e.dataLevel || '') + ')';
            function getRegExp() {
              try {
                if (typeof t == 'object') return new RegExp(t.pattern, t.flags);
                var e = t.match(/^\/(.*)\/([gimuy]*)$/);
                if (e) return new RegExp(e[1], e[2]);
                throw new Error('cannot parse string into RegExp');
              } catch (e) {
                console.error('regular expression', t, 'is invalid');
                throw e;
              }
            }
          },
          metaSchema: {
            type: ['string', 'object'],
            properties: {
              pattern: { type: 'string' },
              flags: { type: 'string' },
            },
            required: ['pattern'],
            additionalProperties: false,
          },
        };
        e.addKeyword('regexp', defFunc.definition);
        return e;
      };
    },
    9128: (e, r, t) => {
      'use strict';
      var a = t(2298);
      e.exports = function defFunc(e) {
        if (!e._opts.$data) {
          console.warn('keyword select requires $data option');
          return e;
        }
        var r = a.metaSchemaRef(e);
        var t = [];
        defFunc.definition = {
          validate: function v(e, r, t) {
            if (t.selectCases === undefined)
              throw new Error('keyword "selectCases" is absent');
            var a = getCompiledSchemas(t, false);
            var s = a.cases[e];
            if (s === undefined) s = a.default;
            if (typeof s == 'boolean') return s;
            var i = s(r);
            if (!i) v.errors = s.errors;
            return i;
          },
          $data: true,
          metaSchema: { type: ['string', 'number', 'boolean', 'null'] },
        };
        e.addKeyword('select', defFunc.definition);
        e.addKeyword('selectCases', {
          compile: function (e, r) {
            var t = getCompiledSchemas(r);
            for (var a in e) t.cases[a] = compileOrBoolean(e[a]);
            return function () {
              return true;
            };
          },
          valid: true,
          metaSchema: { type: 'object', additionalProperties: r },
        });
        e.addKeyword('selectDefault', {
          compile: function (e, r) {
            var t = getCompiledSchemas(r);
            t.default = compileOrBoolean(e);
            return function () {
              return true;
            };
          },
          valid: true,
          metaSchema: r,
        });
        return e;
        function getCompiledSchemas(e, r) {
          var a;
          t.some(function (r) {
            if (r.parentSchema === e) {
              a = r;
              return true;
            }
          });
          if (!a && r !== false) {
            a = { parentSchema: e, cases: {}, default: true };
            t.push(a);
          }
          return a;
        }
        function compileOrBoolean(r) {
          return typeof r == 'boolean' ? r : e.compile(r);
        }
      };
    },
    593: (e, r, t) => {
      'use strict';
      var a = t(2298);
      e.exports = function defFunc(e) {
        if (e.RULES.keywords.switch && e.RULES.keywords.if) return;
        var r = a.metaSchemaRef(e);
        defFunc.definition = {
          inline: t(5244),
          statements: true,
          errors: 'full',
          metaSchema: {
            type: 'array',
            items: {
              required: ['then'],
              properties: {
                if: r,
                then: { anyOf: [{ type: 'boolean' }, r] },
                continue: { type: 'boolean' },
              },
              additionalProperties: false,
              dependencies: { continue: ['if'] },
            },
          },
        };
        e.addKeyword('switch', defFunc.definition);
        return e;
      };
    },
    2615: (e) => {
      'use strict';
      e.exports = function defFunc(e) {
        var r = {
          trimLeft: function (e) {
            return e.replace(/^[\s]+/, '');
          },
          trimRight: function (e) {
            return e.replace(/[\s]+$/, '');
          },
          trim: function (e) {
            return e.trim();
          },
          toLowerCase: function (e) {
            return e.toLowerCase();
          },
          toUpperCase: function (e) {
            return e.toUpperCase();
          },
          toEnumCase: function (e, r) {
            return r.hash[makeHashTableKey(e)] || e;
          },
        };
        defFunc.definition = {
          type: 'string',
          errors: false,
          modifying: true,
          valid: true,
          compile: function (e, t) {
            var a;
            if (e.indexOf('toEnumCase') !== -1) {
              a = { hash: {} };
              if (!t.enum)
                throw new Error(
                  'Missing enum. To use `transform:["toEnumCase"]`, `enum:[...]` is required.',
                );
              for (var s = t.enum.length; s--; s) {
                var i = t.enum[s];
                if (typeof i !== 'string') continue;
                var o = makeHashTableKey(i);
                if (a.hash[o])
                  throw new Error(
                    'Invalid enum uniqueness. To use `transform:["toEnumCase"]`, all values must be unique when case insensitive.',
                  );
                a.hash[o] = i;
              }
            }
            return function (t, s, i, o) {
              if (!i) return;
              for (var n = 0, l = e.length; n < l; n++) t = r[e[n]](t, a);
              i[o] = t;
            };
          },
          metaSchema: {
            type: 'array',
            items: {
              type: 'string',
              enum: [
                'trimLeft',
                'trimRight',
                'trim',
                'toLowerCase',
                'toUpperCase',
                'toEnumCase',
              ],
            },
          },
        };
        e.addKeyword('transform', defFunc.definition);
        return e;
        function makeHashTableKey(e) {
          return e.toLowerCase();
        }
      };
    },
    1147: (e) => {
      'use strict';
      var r = [
        'undefined',
        'string',
        'number',
        'object',
        'function',
        'boolean',
        'symbol',
      ];
      e.exports = function defFunc(e) {
        defFunc.definition = {
          inline: function (e, r, t) {
            var a = 'data' + (e.dataLevel || '');
            if (typeof t == 'string') return 'typeof ' + a + ' == "' + t + '"';
            t = 'validate.schema' + e.schemaPath + '.' + r;
            return t + '.indexOf(typeof ' + a + ') >= 0';
          },
          metaSchema: {
            anyOf: [
              { type: 'string', enum: r },
              { type: 'array', items: { type: 'string', enum: r } },
            ],
          },
        };
        e.addKeyword('typeof', defFunc.definition);
        return e;
      };
    },
    7705: (e) => {
      'use strict';
      var r = ['number', 'integer', 'string', 'boolean', 'null'];
      e.exports = function defFunc(e) {
        defFunc.definition = {
          type: 'array',
          compile: function (e, r, t) {
            var a = t.util.equal;
            var s = getScalarKeys(e, r);
            return function (r) {
              if (r.length > 1) {
                for (var t = 0; t < e.length; t++) {
                  var i,
                    o = e[t];
                  if (s[t]) {
                    var n = {};
                    for (i = r.length; i--; ) {
                      if (!r[i] || typeof r[i] != 'object') continue;
                      var l = r[i][o];
                      if (l && typeof l == 'object') continue;
                      if (typeof l == 'string') l = '"' + l;
                      if (n[l]) return false;
                      n[l] = true;
                    }
                  } else {
                    for (i = r.length; i--; ) {
                      if (!r[i] || typeof r[i] != 'object') continue;
                      for (var u = i; u--; ) {
                        if (
                          r[u] &&
                          typeof r[u] == 'object' &&
                          a(r[i][o], r[u][o])
                        )
                          return false;
                      }
                    }
                  }
                }
              }
              return true;
            };
          },
          metaSchema: { type: 'array', items: { type: 'string' } },
        };
        e.addKeyword('uniqueItemProperties', defFunc.definition);
        return e;
      };
      function getScalarKeys(e, t) {
        return e.map(function (e) {
          var a = t.items && t.items.properties;
          var s = a && a[e] && a[e].type;
          return Array.isArray(s)
            ? s.indexOf('object') < 0 && s.indexOf('array') < 0
            : r.indexOf(s) >= 0;
        });
      }
    },
    8601: (e, r, t) => {
      'use strict';
      var a = t(6905),
        s = t(8708),
        i = t(4578),
        o = t(4841),
        n = t(7351),
        l = t(3978),
        u = t(8404),
        f = t(9341),
        c = t(7224);
      e.exports = Ajv;
      Ajv.prototype.validate = validate;
      Ajv.prototype.compile = compile;
      Ajv.prototype.addSchema = addSchema;
      Ajv.prototype.addMetaSchema = addMetaSchema;
      Ajv.prototype.validateSchema = validateSchema;
      Ajv.prototype.getSchema = getSchema;
      Ajv.prototype.removeSchema = removeSchema;
      Ajv.prototype.addFormat = addFormat;
      Ajv.prototype.errorsText = errorsText;
      Ajv.prototype._addSchema = _addSchema;
      Ajv.prototype._compile = _compile;
      Ajv.prototype.compileAsync = t(6211);
      var h = t(398);
      Ajv.prototype.addKeyword = h.add;
      Ajv.prototype.getKeyword = h.get;
      Ajv.prototype.removeKeyword = h.remove;
      Ajv.prototype.validateKeyword = h.validate;
      var d = t(8373);
      Ajv.ValidationError = d.Validation;
      Ajv.MissingRefError = d.MissingRef;
      Ajv.$dataMetaSchema = f;
      var p = 'http://json-schema.org/draft-07/schema';
      var m = [
        'removeAdditional',
        'useDefaults',
        'coerceTypes',
        'strictDefaults',
      ];
      var g = ['/properties'];
      function Ajv(e) {
        if (!(this instanceof Ajv)) return new Ajv(e);
        e = this._opts = c.copy(e) || {};
        setLogger(this);
        this._schemas = {};
        this._refs = {};
        this._fragments = {};
        this._formats = l(e.format);
        this._cache = e.cache || new i();
        this._loadingSchemas = {};
        this._compilations = [];
        this.RULES = u();
        this._getId = chooseGetId(e);
        e.loopRequired = e.loopRequired || Infinity;
        if (e.errorDataPath == 'property') e._errorDataPathProperty = true;
        if (e.serialize === undefined) e.serialize = n;
        this._metaOpts = getMetaSchemaOptions(this);
        if (e.formats) addInitialFormats(this);
        if (e.keywords) addInitialKeywords(this);
        addDefaultMetaSchema(this);
        if (typeof e.meta == 'object') this.addMetaSchema(e.meta);
        if (e.nullable)
          this.addKeyword('nullable', { metaSchema: { type: 'boolean' } });
        addInitialSchemas(this);
      }
      function validate(e, r) {
        var t;
        if (typeof e == 'string') {
          t = this.getSchema(e);
          if (!t) throw new Error('no schema with key or ref "' + e + '"');
        } else {
          var a = this._addSchema(e);
          t = a.validate || this._compile(a);
        }
        var s = t(r);
        if (t.$async !== true) this.errors = t.errors;
        return s;
      }
      function compile(e, r) {
        var t = this._addSchema(e, undefined, r);
        return t.validate || this._compile(t);
      }
      function addSchema(e, r, t, a) {
        if (Array.isArray(e)) {
          for (var i = 0; i < e.length; i++)
            this.addSchema(e[i], undefined, t, a);
          return this;
        }
        var o = this._getId(e);
        if (o !== undefined && typeof o != 'string')
          throw new Error('schema id must be string');
        r = s.normalizeId(r || o);
        checkUnique(this, r);
        this._schemas[r] = this._addSchema(e, t, a, true);
        return this;
      }
      function addMetaSchema(e, r, t) {
        this.addSchema(e, r, t, true);
        return this;
      }
      function validateSchema(e, r) {
        var t = e.$schema;
        if (t !== undefined && typeof t != 'string')
          throw new Error('$schema must be a string');
        t = t || this._opts.defaultMeta || defaultMeta(this);
        if (!t) {
          this.logger.warn('meta-schema not available');
          this.errors = null;
          return true;
        }
        var a = this.validate(t, e);
        if (!a && r) {
          var s = 'schema is invalid: ' + this.errorsText();
          if (this._opts.validateSchema == 'log') this.logger.error(s);
          else throw new Error(s);
        }
        return a;
      }
      function defaultMeta(e) {
        var r = e._opts.meta;
        e._opts.defaultMeta =
          typeof r == 'object'
            ? e._getId(r) || r
            : e.getSchema(p)
            ? p
            : undefined;
        return e._opts.defaultMeta;
      }
      function getSchema(e) {
        var r = _getSchemaObj(this, e);
        switch (typeof r) {
          case 'object':
            return r.validate || this._compile(r);
          case 'string':
            return this.getSchema(r);
          case 'undefined':
            return _getSchemaFragment(this, e);
        }
      }
      function _getSchemaFragment(e, r) {
        var t = s.schema.call(e, { schema: {} }, r);
        if (t) {
          var i = t.schema,
            n = t.root,
            l = t.baseId;
          var u = a.call(e, i, n, undefined, l);
          e._fragments[r] = new o({
            ref: r,
            fragment: true,
            schema: i,
            root: n,
            baseId: l,
            validate: u,
          });
          return u;
        }
      }
      function _getSchemaObj(e, r) {
        r = s.normalizeId(r);
        return e._schemas[r] || e._refs[r] || e._fragments[r];
      }
      function removeSchema(e) {
        if (e instanceof RegExp) {
          _removeAllSchemas(this, this._schemas, e);
          _removeAllSchemas(this, this._refs, e);
          return this;
        }
        switch (typeof e) {
          case 'undefined':
            _removeAllSchemas(this, this._schemas);
            _removeAllSchemas(this, this._refs);
            this._cache.clear();
            return this;
          case 'string':
            var r = _getSchemaObj(this, e);
            if (r) this._cache.del(r.cacheKey);
            delete this._schemas[e];
            delete this._refs[e];
            return this;
          case 'object':
            var t = this._opts.serialize;
            var a = t ? t(e) : e;
            this._cache.del(a);
            var i = this._getId(e);
            if (i) {
              i = s.normalizeId(i);
              delete this._schemas[i];
              delete this._refs[i];
            }
        }
        return this;
      }
      function _removeAllSchemas(e, r, t) {
        for (var a in r) {
          var s = r[a];
          if (!s.meta && (!t || t.test(a))) {
            e._cache.del(s.cacheKey);
            delete r[a];
          }
        }
      }
      function _addSchema(e, r, t, a) {
        if (typeof e != 'object' && typeof e != 'boolean')
          throw new Error('schema should be object or boolean');
        var i = this._opts.serialize;
        var n = i ? i(e) : e;
        var l = this._cache.get(n);
        if (l) return l;
        a = a || this._opts.addUsedSchema !== false;
        var u = s.normalizeId(this._getId(e));
        if (u && a) checkUnique(this, u);
        var f = this._opts.validateSchema !== false && !r;
        var c;
        if (f && !(c = u && u == s.normalizeId(e.$schema)))
          this.validateSchema(e, true);
        var h = s.ids.call(this, e);
        var d = new o({ id: u, schema: e, localRefs: h, cacheKey: n, meta: t });
        if (u[0] != '#' && a) this._refs[u] = d;
        this._cache.put(n, d);
        if (f && c) this.validateSchema(e, true);
        return d;
      }
      function _compile(e, r) {
        if (e.compiling) {
          e.validate = callValidate;
          callValidate.schema = e.schema;
          callValidate.errors = null;
          callValidate.root = r ? r : callValidate;
          if (e.schema.$async === true) callValidate.$async = true;
          return callValidate;
        }
        e.compiling = true;
        var t;
        if (e.meta) {
          t = this._opts;
          this._opts = this._metaOpts;
        }
        var s;
        try {
          s = a.call(this, e.schema, r, e.localRefs);
        } catch (r) {
          delete e.validate;
          throw r;
        } finally {
          e.compiling = false;
          if (e.meta) this._opts = t;
        }
        e.validate = s;
        e.refs = s.refs;
        e.refVal = s.refVal;
        e.root = s.root;
        return s;
        function callValidate() {
          var r = e.validate;
          var t = r.apply(this, arguments);
          callValidate.errors = r.errors;
          return t;
        }
      }
      function chooseGetId(e) {
        switch (e.schemaId) {
          case 'auto':
            return _get$IdOrId;
          case 'id':
            return _getId;
          default:
            return _get$Id;
        }
      }
      function _getId(e) {
        if (e.$id) this.logger.warn('schema $id ignored', e.$id);
        return e.id;
      }
      function _get$Id(e) {
        if (e.id) this.logger.warn('schema id ignored', e.id);
        return e.$id;
      }
      function _get$IdOrId(e) {
        if (e.$id && e.id && e.$id != e.id)
          throw new Error('schema $id is different from id');
        return e.$id || e.id;
      }
      function errorsText(e, r) {
        e = e || this.errors;
        if (!e) return 'No errors';
        r = r || {};
        var t = r.separator === undefined ? ', ' : r.separator;
        var a = r.dataVar === undefined ? 'data' : r.dataVar;
        var s = '';
        for (var i = 0; i < e.length; i++) {
          var o = e[i];
          if (o) s += a + o.dataPath + ' ' + o.message + t;
        }
        return s.slice(0, -t.length);
      }
      function addFormat(e, r) {
        if (typeof r == 'string') r = new RegExp(r);
        this._formats[e] = r;
        return this;
      }
      function addDefaultMetaSchema(e) {
        var r;
        if (e._opts.$data) {
          r = t(7664);
          e.addMetaSchema(r, r.$id, true);
        }
        if (e._opts.meta === false) return;
        var a = t(7136);
        if (e._opts.$data) a = f(a, g);
        e.addMetaSchema(a, p, true);
        e._refs['http://json-schema.org/schema'] = p;
      }
      function addInitialSchemas(e) {
        var r = e._opts.schemas;
        if (!r) return;
        if (Array.isArray(r)) e.addSchema(r);
        else for (var t in r) e.addSchema(r[t], t);
      }
      function addInitialFormats(e) {
        for (var r in e._opts.formats) {
          var t = e._opts.formats[r];
          e.addFormat(r, t);
        }
      }
      function addInitialKeywords(e) {
        for (var r in e._opts.keywords) {
          var t = e._opts.keywords[r];
          e.addKeyword(r, t);
        }
      }
      function checkUnique(e, r) {
        if (e._schemas[r] || e._refs[r])
          throw new Error('schema with key or id "' + r + '" already exists');
      }
      function getMetaSchemaOptions(e) {
        var r = c.copy(e._opts);
        for (var t = 0; t < m.length; t++) delete r[m[t]];
        return r;
      }
      function setLogger(e) {
        var r = e._opts.logger;
        if (r === false) {
          e.logger = { log: noop, warn: noop, error: noop };
        } else {
          if (r === undefined) r = console;
          if (!(typeof r == 'object' && r.log && r.warn && r.error))
            throw new Error(
              'logger must implement log, warn and error methods',
            );
          e.logger = r;
        }
      }
      function noop() {}
    },
    4578: (e) => {
      'use strict';
      var r = (e.exports = function Cache() {
        this._cache = {};
      });
      r.prototype.put = function Cache_put(e, r) {
        this._cache[e] = r;
      };
      r.prototype.get = function Cache_get(e) {
        return this._cache[e];
      };
      r.prototype.del = function Cache_del(e) {
        delete this._cache[e];
      };
      r.prototype.clear = function Cache_clear() {
        this._cache = {};
      };
    },
    6211: (e, r, t) => {
      'use strict';
      var a = t(8373).MissingRef;
      e.exports = compileAsync;
      function compileAsync(e, r, t) {
        var s = this;
        if (typeof this._opts.loadSchema != 'function')
          throw new Error('options.loadSchema should be a function');
        if (typeof r == 'function') {
          t = r;
          r = undefined;
        }
        var i = loadMetaSchemaOf(e).then(function () {
          var t = s._addSchema(e, undefined, r);
          return t.validate || _compileAsync(t);
        });
        if (t) {
          i.then(function (e) {
            t(null, e);
          }, t);
        }
        return i;
        function loadMetaSchemaOf(e) {
          var r = e.$schema;
          return r && !s.getSchema(r)
            ? compileAsync.call(s, { $ref: r }, true)
            : Promise.resolve();
        }
        function _compileAsync(e) {
          try {
            return s._compile(e);
          } catch (e) {
            if (e instanceof a) return loadMissingSchema(e);
            throw e;
          }
          function loadMissingSchema(t) {
            var a = t.missingSchema;
            if (added(a))
              throw new Error(
                'Schema ' +
                  a +
                  ' is loaded but ' +
                  t.missingRef +
                  ' cannot be resolved',
              );
            var i = s._loadingSchemas[a];
            if (!i) {
              i = s._loadingSchemas[a] = s._opts.loadSchema(a);
              i.then(removePromise, removePromise);
            }
            return i
              .then(function (e) {
                if (!added(a)) {
                  return loadMetaSchemaOf(e).then(function () {
                    if (!added(a)) s.addSchema(e, a, undefined, r);
                  });
                }
              })
              .then(function () {
                return _compileAsync(e);
              });
            function removePromise() {
              delete s._loadingSchemas[a];
            }
            function added(e) {
              return s._refs[e] || s._schemas[e];
            }
          }
        }
      }
    },
    8373: (e, r, t) => {
      'use strict';
      var a = t(8708);
      e.exports = {
        Validation: errorSubclass(ValidationError),
        MissingRef: errorSubclass(MissingRefError),
      };
      function ValidationError(e) {
        this.message = 'validation failed';
        this.errors = e;
        this.ajv = this.validation = true;
      }
      MissingRefError.message = function (e, r) {
        return "can't resolve reference " + r + ' from id ' + e;
      };
      function MissingRefError(e, r, t) {
        this.message = t || MissingRefError.message(e, r);
        this.missingRef = a.url(e, r);
        this.missingSchema = a.normalizeId(a.fullPath(this.missingRef));
      }
      function errorSubclass(e) {
        e.prototype = Object.create(Error.prototype);
        e.prototype.constructor = e;
        return e;
      }
    },
    3978: (e, r, t) => {
      'use strict';
      var a = t(7224);
      var s = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
      var i = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      var o = /^(\d\d):(\d\d):(\d\d)(\.\d+)?(z|[+-]\d\d(?::?\d\d)?)?$/i;
      var n =
        /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i;
      var l =
        /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
      var u =
        /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
      var f =
        /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i;
      var c =
        /^(?:(?:http[s\u017F]?|ftp):\/\/)(?:(?:[\0-\x08\x0E-\x1F!-\x9F\xA1-\u167F\u1681-\u1FFF\u200B-\u2027\u202A-\u202E\u2030-\u205E\u2060-\u2FFF\u3001-\uD7FF\uE000-\uFEFE\uFF00-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+(?::(?:[\0-\x08\x0E-\x1F!-\x9F\xA1-\u167F\u1681-\u1FFF\u200B-\u2027\u202A-\u202E\u2030-\u205E\u2060-\u2FFF\u3001-\uD7FF\uE000-\uFEFE\uFF00-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])*)?@)?(?:(?!10(?:\.[0-9]{1,3}){3})(?!127(?:\.[0-9]{1,3}){3})(?!169\.254(?:\.[0-9]{1,3}){2})(?!192\.168(?:\.[0-9]{1,3}){2})(?!172\.(?:1[6-9]|2[0-9]|3[01])(?:\.[0-9]{1,3}){2})(?:[1-9][0-9]?|1[0-9][0-9]|2[01][0-9]|22[0-3])(?:\.(?:1?[0-9]{1,2}|2[0-4][0-9]|25[0-5])){2}(?:\.(?:[1-9][0-9]?|1[0-9][0-9]|2[0-4][0-9]|25[0-4]))|(?:(?:(?:[0-9a-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+-)*(?:[0-9a-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+)(?:\.(?:(?:[0-9a-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+-)*(?:[0-9a-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+)*(?:\.(?:(?:[a-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]){2,})))(?::[0-9]{2,5})?(?:\/(?:[\0-\x08\x0E-\x1F!-\x9F\xA1-\u167F\u1681-\u1FFF\u200B-\u2027\u202A-\u202E\u2030-\u205E\u2060-\u2FFF\u3001-\uD7FF\uE000-\uFEFE\uFF00-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])*)?$/i;
      var h = /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
      var d = /^(?:\/(?:[^~/]|~0|~1)*)*$/;
      var p = /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i;
      var m = /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/;
      e.exports = formats;
      function formats(e) {
        e = e == 'full' ? 'full' : 'fast';
        return a.copy(formats[e]);
      }
      formats.fast = {
        date: /^\d\d\d\d-[0-1]\d-[0-3]\d$/,
        time: /^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i,
        'date-time':
          /^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i,
        uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i,
        'uri-reference':
          /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i,
        'uri-template': f,
        url: c,
        email:
          /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i,
        hostname: n,
        ipv4: /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
        ipv6: /^\s*(?:(?:(?:[0-9a-f]{1,4}:){7}(?:[0-9a-f]{1,4}|:))|(?:(?:[0-9a-f]{1,4}:){6}(?::[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(?:(?:[0-9a-f]{1,4}:){5}(?:(?:(?::[0-9a-f]{1,4}){1,2})|:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(?:(?:[0-9a-f]{1,4}:){4}(?:(?:(?::[0-9a-f]{1,4}){1,3})|(?:(?::[0-9a-f]{1,4})?:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){3}(?:(?:(?::[0-9a-f]{1,4}){1,4})|(?:(?::[0-9a-f]{1,4}){0,2}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){2}(?:(?:(?::[0-9a-f]{1,4}){1,5})|(?:(?::[0-9a-f]{1,4}){0,3}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){1}(?:(?:(?::[0-9a-f]{1,4}){1,6})|(?:(?::[0-9a-f]{1,4}){0,4}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?::(?:(?:(?::[0-9a-f]{1,4}){1,7})|(?:(?::[0-9a-f]{1,4}){0,5}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(?:%.+)?\s*$/i,
        regex: regex,
        uuid: h,
        'json-pointer': d,
        'json-pointer-uri-fragment': p,
        'relative-json-pointer': m,
      };
      formats.full = {
        date: date,
        time: time,
        'date-time': date_time,
        uri: uri,
        'uri-reference': u,
        'uri-template': f,
        url: c,
        email:
          /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
        hostname: n,
        ipv4: /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
        ipv6: /^\s*(?:(?:(?:[0-9a-f]{1,4}:){7}(?:[0-9a-f]{1,4}|:))|(?:(?:[0-9a-f]{1,4}:){6}(?::[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(?:(?:[0-9a-f]{1,4}:){5}(?:(?:(?::[0-9a-f]{1,4}){1,2})|:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(?:(?:[0-9a-f]{1,4}:){4}(?:(?:(?::[0-9a-f]{1,4}){1,3})|(?:(?::[0-9a-f]{1,4})?:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){3}(?:(?:(?::[0-9a-f]{1,4}){1,4})|(?:(?::[0-9a-f]{1,4}){0,2}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){2}(?:(?:(?::[0-9a-f]{1,4}){1,5})|(?:(?::[0-9a-f]{1,4}){0,3}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){1}(?:(?:(?::[0-9a-f]{1,4}){1,6})|(?:(?::[0-9a-f]{1,4}){0,4}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?::(?:(?:(?::[0-9a-f]{1,4}){1,7})|(?:(?::[0-9a-f]{1,4}){0,5}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(?:%.+)?\s*$/i,
        regex: regex,
        uuid: h,
        'json-pointer': d,
        'json-pointer-uri-fragment': p,
        'relative-json-pointer': m,
      };
      function isLeapYear(e) {
        return e % 4 === 0 && (e % 100 !== 0 || e % 400 === 0);
      }
      function date(e) {
        var r = e.match(s);
        if (!r) return false;
        var t = +r[1];
        var a = +r[2];
        var o = +r[3];
        return (
          a >= 1 &&
          a <= 12 &&
          o >= 1 &&
          o <= (a == 2 && isLeapYear(t) ? 29 : i[a])
        );
      }
      function time(e, r) {
        var t = e.match(o);
        if (!t) return false;
        var a = t[1];
        var s = t[2];
        var i = t[3];
        var n = t[5];
        return (
          ((a <= 23 && s <= 59 && i <= 59) ||
            (a == 23 && s == 59 && i == 60)) &&
          (!r || n)
        );
      }
      var g = /t|\s/i;
      function date_time(e) {
        var r = e.split(g);
        return r.length == 2 && date(r[0]) && time(r[1], true);
      }
      var y = /\/|:/;
      function uri(e) {
        return y.test(e) && l.test(e);
      }
      var P = /[^\\]\\Z/;
      function regex(e) {
        if (P.test(e)) return false;
        try {
          new RegExp(e);
          return true;
        } catch (e) {
          return false;
        }
      }
    },
    6905: (e, r, t) => {
      'use strict';
      var a = t(8708),
        s = t(7224),
        i = t(8373),
        o = t(7351);
      var n = t(2801);
      var l = s.ucs2length;
      var u = t(7447);
      var f = i.Validation;
      e.exports = compile;
      function compile(e, r, t, c) {
        var h = this,
          d = this._opts,
          p = [undefined],
          m = {},
          g = [],
          y = {},
          P = [],
          b = {},
          E = [];
        r = r || { schema: e, refVal: p, refs: m };
        var S = checkCompiling.call(this, e, r, c);
        var w = this._compilations[S.index];
        if (S.compiling) return (w.callValidate = callValidate);
        var x = this._formats;
        var $ = this.RULES;
        try {
          var _ = localCompile(e, r, t, c);
          w.validate = _;
          var R = w.callValidate;
          if (R) {
            R.schema = _.schema;
            R.errors = null;
            R.refs = _.refs;
            R.refVal = _.refVal;
            R.root = _.root;
            R.$async = _.$async;
            if (d.sourceCode) R.source = _.source;
          }
          return _;
        } finally {
          endCompiling.call(this, e, r, c);
        }
        function callValidate() {
          var e = w.validate;
          var r = e.apply(this, arguments);
          callValidate.errors = e.errors;
          return r;
        }
        function localCompile(e, t, o, c) {
          var y = !t || (t && t.schema == e);
          if (t.schema != r.schema) return compile.call(h, e, t, o, c);
          var b = e.$async === true;
          var S = n({
            isTop: true,
            schema: e,
            isRoot: y,
            baseId: c,
            root: t,
            schemaPath: '',
            errSchemaPath: '#',
            errorPath: '""',
            MissingRefError: i.MissingRef,
            RULES: $,
            validate: n,
            util: s,
            resolve: a,
            resolveRef: resolveRef,
            usePattern: usePattern,
            useDefault: useDefault,
            useCustomRule: useCustomRule,
            opts: d,
            formats: x,
            logger: h.logger,
            self: h,
          });
          S =
            vars(p, refValCode) +
            vars(g, patternCode) +
            vars(P, defaultCode) +
            vars(E, customRuleCode) +
            S;
          if (d.processCode) S = d.processCode(S, e);
          var w;
          try {
            var _ = new Function(
              'self',
              'RULES',
              'formats',
              'root',
              'refVal',
              'defaults',
              'customRules',
              'equal',
              'ucs2length',
              'ValidationError',
              S,
            );
            w = _(h, $, x, r, p, P, E, u, l, f);
            p[0] = w;
          } catch (e) {
            h.logger.error('Error compiling schema, function code:', S);
            throw e;
          }
          w.schema = e;
          w.errors = null;
          w.refs = m;
          w.refVal = p;
          w.root = y ? w : t;
          if (b) w.$async = true;
          if (d.sourceCode === true) {
            w.source = { code: S, patterns: g, defaults: P };
          }
          return w;
        }
        function resolveRef(e, s, i) {
          s = a.url(e, s);
          var o = m[s];
          var n, l;
          if (o !== undefined) {
            n = p[o];
            l = 'refVal[' + o + ']';
            return resolvedRef(n, l);
          }
          if (!i && r.refs) {
            var u = r.refs[s];
            if (u !== undefined) {
              n = r.refVal[u];
              l = addLocalRef(s, n);
              return resolvedRef(n, l);
            }
          }
          l = addLocalRef(s);
          var f = a.call(h, localCompile, r, s);
          if (f === undefined) {
            var c = t && t[s];
            if (c) {
              f = a.inlineRef(c, d.inlineRefs)
                ? c
                : compile.call(h, c, r, t, e);
            }
          }
          if (f === undefined) {
            removeLocalRef(s);
          } else {
            replaceLocalRef(s, f);
            return resolvedRef(f, l);
          }
        }
        function addLocalRef(e, r) {
          var t = p.length;
          p[t] = r;
          m[e] = t;
          return 'refVal' + t;
        }
        function removeLocalRef(e) {
          delete m[e];
        }
        function replaceLocalRef(e, r) {
          var t = m[e];
          p[t] = r;
        }
        function resolvedRef(e, r) {
          return typeof e == 'object' || typeof e == 'boolean'
            ? { code: r, schema: e, inline: true }
            : { code: r, $async: e && !!e.$async };
        }
        function usePattern(e) {
          var r = y[e];
          if (r === undefined) {
            r = y[e] = g.length;
            g[r] = e;
          }
          return 'pattern' + r;
        }
        function useDefault(e) {
          switch (typeof e) {
            case 'boolean':
            case 'number':
              return '' + e;
            case 'string':
              return s.toQuotedString(e);
            case 'object':
              if (e === null) return 'null';
              var r = o(e);
              var t = b[r];
              if (t === undefined) {
                t = b[r] = P.length;
                P[t] = e;
              }
              return 'default' + t;
          }
        }
        function useCustomRule(e, r, t, a) {
          if (h._opts.validateSchema !== false) {
            var s = e.definition.dependencies;
            if (
              s &&
              !s.every(function (e) {
                return Object.prototype.hasOwnProperty.call(t, e);
              })
            )
              throw new Error(
                'parent schema must have all required keywords: ' + s.join(','),
              );
            var i = e.definition.validateSchema;
            if (i) {
              var o = i(r);
              if (!o) {
                var n = 'keyword schema is invalid: ' + h.errorsText(i.errors);
                if (h._opts.validateSchema == 'log') h.logger.error(n);
                else throw new Error(n);
              }
            }
          }
          var l = e.definition.compile,
            u = e.definition.inline,
            f = e.definition.macro;
          var c;
          if (l) {
            c = l.call(h, r, t, a);
          } else if (f) {
            c = f.call(h, r, t, a);
            if (d.validateSchema !== false) h.validateSchema(c, true);
          } else if (u) {
            c = u.call(h, a, e.keyword, r, t);
          } else {
            c = e.definition.validate;
            if (!c) return;
          }
          if (c === undefined)
            throw new Error(
              'custom keyword "' + e.keyword + '"failed to compile',
            );
          var p = E.length;
          E[p] = c;
          return { code: 'customRule' + p, validate: c };
        }
      }
      function checkCompiling(e, r, t) {
        var a = compIndex.call(this, e, r, t);
        if (a >= 0) return { index: a, compiling: true };
        a = this._compilations.length;
        this._compilations[a] = { schema: e, root: r, baseId: t };
        return { index: a, compiling: false };
      }
      function endCompiling(e, r, t) {
        var a = compIndex.call(this, e, r, t);
        if (a >= 0) this._compilations.splice(a, 1);
      }
      function compIndex(e, r, t) {
        for (var a = 0; a < this._compilations.length; a++) {
          var s = this._compilations[a];
          if (s.schema == e && s.root == r && s.baseId == t) return a;
        }
        return -1;
      }
      function patternCode(e, r) {
        return (
          'var pattern' + e + ' = new RegExp(' + s.toQuotedString(r[e]) + ');'
        );
      }
      function defaultCode(e) {
        return 'var default' + e + ' = defaults[' + e + '];';
      }
      function refValCode(e, r) {
        return r[e] === undefined
          ? ''
          : 'var refVal' + e + ' = refVal[' + e + '];';
      }
      function customRuleCode(e) {
        return 'var customRule' + e + ' = customRules[' + e + '];';
      }
      function vars(e, r) {
        if (!e.length) return '';
        var t = '';
        for (var a = 0; a < e.length; a++) t += r(a, e);
        return t;
      }
    },
    8708: (e, r, t) => {
      'use strict';
      var a = t(199),
        s = t(7447),
        i = t(7224),
        o = t(4841),
        n = t(4432);
      e.exports = resolve;
      resolve.normalizeId = normalizeId;
      resolve.fullPath = getFullPath;
      resolve.url = resolveUrl;
      resolve.ids = resolveIds;
      resolve.inlineRef = inlineRef;
      resolve.schema = resolveSchema;
      function resolve(e, r, t) {
        var a = this._refs[t];
        if (typeof a == 'string') {
          if (this._refs[a]) a = this._refs[a];
          else return resolve.call(this, e, r, a);
        }
        a = a || this._schemas[t];
        if (a instanceof o) {
          return inlineRef(a.schema, this._opts.inlineRefs)
            ? a.schema
            : a.validate || this._compile(a);
        }
        var s = resolveSchema.call(this, r, t);
        var i, n, l;
        if (s) {
          i = s.schema;
          r = s.root;
          l = s.baseId;
        }
        if (i instanceof o) {
          n = i.validate || e.call(this, i.schema, r, undefined, l);
        } else if (i !== undefined) {
          n = inlineRef(i, this._opts.inlineRefs)
            ? i
            : e.call(this, i, r, undefined, l);
        }
        return n;
      }
      function resolveSchema(e, r) {
        var t = a.parse(r),
          s = _getFullPath(t),
          i = getFullPath(this._getId(e.schema));
        if (Object.keys(e.schema).length === 0 || s !== i) {
          var n = normalizeId(s);
          var l = this._refs[n];
          if (typeof l == 'string') {
            return resolveRecursive.call(this, e, l, t);
          } else if (l instanceof o) {
            if (!l.validate) this._compile(l);
            e = l;
          } else {
            l = this._schemas[n];
            if (l instanceof o) {
              if (!l.validate) this._compile(l);
              if (n == normalizeId(r)) return { schema: l, root: e, baseId: i };
              e = l;
            } else {
              return;
            }
          }
          if (!e.schema) return;
          i = getFullPath(this._getId(e.schema));
        }
        return getJsonPointer.call(this, t, i, e.schema, e);
      }
      function resolveRecursive(e, r, t) {
        var a = resolveSchema.call(this, e, r);
        if (a) {
          var s = a.schema;
          var i = a.baseId;
          e = a.root;
          var o = this._getId(s);
          if (o) i = resolveUrl(i, o);
          return getJsonPointer.call(this, t, i, s, e);
        }
      }
      var l = i.toHash([
        'properties',
        'patternProperties',
        'enum',
        'dependencies',
        'definitions',
      ]);
      function getJsonPointer(e, r, t, a) {
        e.fragment = e.fragment || '';
        if (e.fragment.slice(0, 1) != '/') return;
        var s = e.fragment.split('/');
        for (var o = 1; o < s.length; o++) {
          var n = s[o];
          if (n) {
            n = i.unescapeFragment(n);
            t = t[n];
            if (t === undefined) break;
            var u;
            if (!l[n]) {
              u = this._getId(t);
              if (u) r = resolveUrl(r, u);
              if (t.$ref) {
                var f = resolveUrl(r, t.$ref);
                var c = resolveSchema.call(this, a, f);
                if (c) {
                  t = c.schema;
                  a = c.root;
                  r = c.baseId;
                }
              }
            }
          }
        }
        if (t !== undefined && t !== a.schema)
          return { schema: t, root: a, baseId: r };
      }
      var u = i.toHash([
        'type',
        'format',
        'pattern',
        'maxLength',
        'minLength',
        'maxProperties',
        'minProperties',
        'maxItems',
        'minItems',
        'maximum',
        'minimum',
        'uniqueItems',
        'multipleOf',
        'required',
        'enum',
      ]);
      function inlineRef(e, r) {
        if (r === false) return false;
        if (r === undefined || r === true) return checkNoRef(e);
        else if (r) return countKeys(e) <= r;
      }
      function checkNoRef(e) {
        var r;
        if (Array.isArray(e)) {
          for (var t = 0; t < e.length; t++) {
            r = e[t];
            if (typeof r == 'object' && !checkNoRef(r)) return false;
          }
        } else {
          for (var a in e) {
            if (a == '$ref') return false;
            r = e[a];
            if (typeof r == 'object' && !checkNoRef(r)) return false;
          }
        }
        return true;
      }
      function countKeys(e) {
        var r = 0,
          t;
        if (Array.isArray(e)) {
          for (var a = 0; a < e.length; a++) {
            t = e[a];
            if (typeof t == 'object') r += countKeys(t);
            if (r == Infinity) return Infinity;
          }
        } else {
          for (var s in e) {
            if (s == '$ref') return Infinity;
            if (u[s]) {
              r++;
            } else {
              t = e[s];
              if (typeof t == 'object') r += countKeys(t) + 1;
              if (r == Infinity) return Infinity;
            }
          }
        }
        return r;
      }
      function getFullPath(e, r) {
        if (r !== false) e = normalizeId(e);
        var t = a.parse(e);
        return _getFullPath(t);
      }
      function _getFullPath(e) {
        return a.serialize(e).split('#')[0] + '#';
      }
      var f = /#\/?$/;
      function normalizeId(e) {
        return e ? e.replace(f, '') : '';
      }
      function resolveUrl(e, r) {
        r = normalizeId(r);
        return a.resolve(e, r);
      }
      function resolveIds(e) {
        var r = normalizeId(this._getId(e));
        var t = { '': r };
        var o = { '': getFullPath(r, false) };
        var l = {};
        var u = this;
        n(e, { allKeys: true }, function (e, r, n, f, c, h, d) {
          if (r === '') return;
          var p = u._getId(e);
          var m = t[f];
          var g = o[f] + '/' + c;
          if (d !== undefined)
            g += '/' + (typeof d == 'number' ? d : i.escapeFragment(d));
          if (typeof p == 'string') {
            p = m = normalizeId(m ? a.resolve(m, p) : p);
            var y = u._refs[p];
            if (typeof y == 'string') y = u._refs[y];
            if (y && y.schema) {
              if (!s(e, y.schema))
                throw new Error(
                  'id "' + p + '" resolves to more than one schema',
                );
            } else if (p != normalizeId(g)) {
              if (p[0] == '#') {
                if (l[p] && !s(e, l[p]))
                  throw new Error(
                    'id "' + p + '" resolves to more than one schema',
                  );
                l[p] = e;
              } else {
                u._refs[p] = g;
              }
            }
          }
          t[r] = m;
          o[r] = g;
        });
        return l;
      }
    },
    8404: (e, r, t) => {
      'use strict';
      var a = t(734),
        s = t(7224).toHash;
      e.exports = function rules() {
        var e = [
          {
            type: 'number',
            rules: [
              { maximum: ['exclusiveMaximum'] },
              { minimum: ['exclusiveMinimum'] },
              'multipleOf',
              'format',
            ],
          },
          {
            type: 'string',
            rules: ['maxLength', 'minLength', 'pattern', 'format'],
          },
          {
            type: 'array',
            rules: ['maxItems', 'minItems', 'items', 'contains', 'uniqueItems'],
          },
          {
            type: 'object',
            rules: [
              'maxProperties',
              'minProperties',
              'required',
              'dependencies',
              'propertyNames',
              { properties: ['additionalProperties', 'patternProperties'] },
            ],
          },
          {
            rules: [
              '$ref',
              'const',
              'enum',
              'not',
              'anyOf',
              'oneOf',
              'allOf',
              'if',
            ],
          },
        ];
        var r = ['type', '$comment'];
        var t = [
          '$schema',
          '$id',
          'id',
          '$data',
          '$async',
          'title',
          'description',
          'default',
          'definitions',
          'examples',
          'readOnly',
          'writeOnly',
          'contentMediaType',
          'contentEncoding',
          'additionalItems',
          'then',
          'else',
        ];
        var i = [
          'number',
          'integer',
          'string',
          'array',
          'object',
          'boolean',
          'null',
        ];
        e.all = s(r);
        e.types = s(i);
        e.forEach(function (t) {
          t.rules = t.rules.map(function (t) {
            var s;
            if (typeof t == 'object') {
              var i = Object.keys(t)[0];
              s = t[i];
              t = i;
              s.forEach(function (t) {
                r.push(t);
                e.all[t] = true;
              });
            }
            r.push(t);
            var o = (e.all[t] = { keyword: t, code: a[t], implements: s });
            return o;
          });
          e.all.$comment = { keyword: '$comment', code: a.$comment };
          if (t.type) e.types[t.type] = t;
        });
        e.keywords = s(r.concat(t));
        e.custom = {};
        return e;
      };
    },
    4841: (e, r, t) => {
      'use strict';
      var a = t(7224);
      e.exports = SchemaObject;
      function SchemaObject(e) {
        a.copy(e, this);
      }
    },
    7980: (e) => {
      'use strict';
      e.exports = function ucs2length(e) {
        var r = 0,
          t = e.length,
          a = 0,
          s;
        while (a < t) {
          r++;
          s = e.charCodeAt(a++);
          if (s >= 55296 && s <= 56319 && a < t) {
            s = e.charCodeAt(a);
            if ((s & 64512) == 56320) a++;
          }
        }
        return r;
      };
    },
    7224: (e, r, t) => {
      'use strict';
      e.exports = {
        copy: copy,
        checkDataType: checkDataType,
        checkDataTypes: checkDataTypes,
        coerceToTypes: coerceToTypes,
        toHash: toHash,
        getProperty: getProperty,
        escapeQuotes: escapeQuotes,
        equal: t(7447),
        ucs2length: t(7980),
        varOccurences: varOccurences,
        varReplace: varReplace,
        schemaHasRules: schemaHasRules,
        schemaHasRulesExcept: schemaHasRulesExcept,
        schemaUnknownRules: schemaUnknownRules,
        toQuotedString: toQuotedString,
        getPathExpr: getPathExpr,
        getPath: getPath,
        getData: getData,
        unescapeFragment: unescapeFragment,
        unescapeJsonPointer: unescapeJsonPointer,
        escapeFragment: escapeFragment,
        escapeJsonPointer: escapeJsonPointer,
      };
      function copy(e, r) {
        r = r || {};
        for (var t in e) r[t] = e[t];
        return r;
      }
      function checkDataType(e, r, t, a) {
        var s = a ? ' !== ' : ' === ',
          i = a ? ' || ' : ' && ',
          o = a ? '!' : '',
          n = a ? '' : '!';
        switch (e) {
          case 'null':
            return r + s + 'null';
          case 'array':
            return o + 'Array.isArray(' + r + ')';
          case 'object':
            return (
              '(' +
              o +
              r +
              i +
              'typeof ' +
              r +
              s +
              '"object"' +
              i +
              n +
              'Array.isArray(' +
              r +
              '))'
            );
          case 'integer':
            return (
              '(typeof ' +
              r +
              s +
              '"number"' +
              i +
              n +
              '(' +
              r +
              ' % 1)' +
              i +
              r +
              s +
              r +
              (t ? i + o + 'isFinite(' + r + ')' : '') +
              ')'
            );
          case 'number':
            return (
              '(typeof ' +
              r +
              s +
              '"' +
              e +
              '"' +
              (t ? i + o + 'isFinite(' + r + ')' : '') +
              ')'
            );
          default:
            return 'typeof ' + r + s + '"' + e + '"';
        }
      }
      function checkDataTypes(e, r, t) {
        switch (e.length) {
          case 1:
            return checkDataType(e[0], r, t, true);
          default:
            var a = '';
            var s = toHash(e);
            if (s.array && s.object) {
              a = s.null ? '(' : '(!' + r + ' || ';
              a += 'typeof ' + r + ' !== "object")';
              delete s.null;
              delete s.array;
              delete s.object;
            }
            if (s.number) delete s.integer;
            for (var i in s)
              a += (a ? ' && ' : '') + checkDataType(i, r, t, true);
            return a;
        }
      }
      var a = toHash(['string', 'number', 'integer', 'boolean', 'null']);
      function coerceToTypes(e, r) {
        if (Array.isArray(r)) {
          var t = [];
          for (var s = 0; s < r.length; s++) {
            var i = r[s];
            if (a[i]) t[t.length] = i;
            else if (e === 'array' && i === 'array') t[t.length] = i;
          }
          if (t.length) return t;
        } else if (a[r]) {
          return [r];
        } else if (e === 'array' && r === 'array') {
          return ['array'];
        }
      }
      function toHash(e) {
        var r = {};
        for (var t = 0; t < e.length; t++) r[e[t]] = true;
        return r;
      }
      var s = /^[a-z$_][a-z$_0-9]*$/i;
      var i = /'|\\/g;
      function getProperty(e) {
        return typeof e == 'number'
          ? '[' + e + ']'
          : s.test(e)
          ? '.' + e
          : "['" + escapeQuotes(e) + "']";
      }
      function escapeQuotes(e) {
        return e
          .replace(i, '\\$&')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\f/g, '\\f')
          .replace(/\t/g, '\\t');
      }
      function varOccurences(e, r) {
        r += '[^0-9]';
        var t = e.match(new RegExp(r, 'g'));
        return t ? t.length : 0;
      }
      function varReplace(e, r, t) {
        r += '([^0-9])';
        t = t.replace(/\$/g, '$$$$');
        return e.replace(new RegExp(r, 'g'), t + '$1');
      }
      function schemaHasRules(e, r) {
        if (typeof e == 'boolean') return !e;
        for (var t in e) if (r[t]) return true;
      }
      function schemaHasRulesExcept(e, r, t) {
        if (typeof e == 'boolean') return !e && t != 'not';
        for (var a in e) if (a != t && r[a]) return true;
      }
      function schemaUnknownRules(e, r) {
        if (typeof e == 'boolean') return;
        for (var t in e) if (!r[t]) return t;
      }
      function toQuotedString(e) {
        return "'" + escapeQuotes(e) + "'";
      }
      function getPathExpr(e, r, t, a) {
        var s = t
          ? "'/' + " +
            r +
            (a ? '' : ".replace(/~/g, '~0').replace(/\\//g, '~1')")
          : a
          ? "'[' + " + r + " + ']'"
          : "'[\\'' + " + r + " + '\\']'";
        return joinPaths(e, s);
      }
      function getPath(e, r, t) {
        var a = t
          ? toQuotedString('/' + escapeJsonPointer(r))
          : toQuotedString(getProperty(r));
        return joinPaths(e, a);
      }
      var o = /^\/(?:[^~]|~0|~1)*$/;
      var n = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
      function getData(e, r, t) {
        var a, s, i, l;
        if (e === '') return 'rootData';
        if (e[0] == '/') {
          if (!o.test(e)) throw new Error('Invalid JSON-pointer: ' + e);
          s = e;
          i = 'rootData';
        } else {
          l = e.match(n);
          if (!l) throw new Error('Invalid JSON-pointer: ' + e);
          a = +l[1];
          s = l[2];
          if (s == '#') {
            if (a >= r)
              throw new Error(
                'Cannot access property/index ' +
                  a +
                  ' levels up, current level is ' +
                  r,
              );
            return t[r - a];
          }
          if (a > r)
            throw new Error(
              'Cannot access data ' + a + ' levels up, current level is ' + r,
            );
          i = 'data' + (r - a || '');
          if (!s) return i;
        }
        var u = i;
        var f = s.split('/');
        for (var c = 0; c < f.length; c++) {
          var h = f[c];
          if (h) {
            i += getProperty(unescapeJsonPointer(h));
            u += ' && ' + i;
          }
        }
        return u;
      }
      function joinPaths(e, r) {
        if (e == '""') return r;
        return (e + ' + ' + r).replace(/([^\\])' \+ '/g, '$1');
      }
      function unescapeFragment(e) {
        return unescapeJsonPointer(decodeURIComponent(e));
      }
      function escapeFragment(e) {
        return encodeURIComponent(escapeJsonPointer(e));
      }
      function escapeJsonPointer(e) {
        return e.replace(/~/g, '~0').replace(/\//g, '~1');
      }
      function unescapeJsonPointer(e) {
        return e.replace(/~1/g, '/').replace(/~0/g, '~');
      }
    },
    9341: (e) => {
      'use strict';
      var r = [
        'multipleOf',
        'maximum',
        'exclusiveMaximum',
        'minimum',
        'exclusiveMinimum',
        'maxLength',
        'minLength',
        'pattern',
        'additionalItems',
        'maxItems',
        'minItems',
        'uniqueItems',
        'maxProperties',
        'minProperties',
        'required',
        'additionalProperties',
        'enum',
        'format',
        'const',
      ];
      e.exports = function (e, t) {
        for (var a = 0; a < t.length; a++) {
          e = JSON.parse(JSON.stringify(e));
          var s = t[a].split('/');
          var i = e;
          var o;
          for (o = 1; o < s.length; o++) i = i[s[o]];
          for (o = 0; o < r.length; o++) {
            var n = r[o];
            var l = i[n];
            if (l) {
              i[n] = {
                anyOf: [
                  l,
                  {
                    $ref: 'https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#',
                  },
                ],
              };
            }
          }
        }
        return e;
      };
    },
    7125: (e, r, t) => {
      'use strict';
      var a = t(7136);
      e.exports = {
        $id: 'https://github.com/ajv-validator/ajv/blob/master/lib/definition_schema.js',
        definitions: { simpleTypes: a.definitions.simpleTypes },
        type: 'object',
        dependencies: {
          schema: ['validate'],
          $data: ['validate'],
          statements: ['inline'],
          valid: { not: { required: ['macro'] } },
        },
        properties: {
          type: a.properties.type,
          schema: { type: 'boolean' },
          statements: { type: 'boolean' },
          dependencies: { type: 'array', items: { type: 'string' } },
          metaSchema: { type: 'object' },
          modifying: { type: 'boolean' },
          valid: { type: 'boolean' },
          $data: { type: 'boolean' },
          async: { type: 'boolean' },
          errors: { anyOf: [{ type: 'boolean' }, { const: 'full' }] },
        },
      };
    },
    9510: (e) => {
      'use strict';
      e.exports = function generate__limit(e, r, t) {
        var a = ' ';
        var s = e.level;
        var i = e.dataLevel;
        var o = e.schema[r];
        var n = e.schemaPath + e.util.getProperty(r);
        var l = e.errSchemaPath + '/' + r;
        var u = !e.opts.allErrors;
        var f;
        var c = 'data' + (i || '');
        var h = e.opts.$data && o && o.$data,
          d;
        if (h) {
          a +=
            ' var schema' +
            s +
            ' = ' +
            e.util.getData(o.$data, i, e.dataPathArr) +
            '; ';
          d = 'schema' + s;
        } else {
          d = o;
        }
        var p = r == 'maximum',
          m = p ? 'exclusiveMaximum' : 'exclusiveMinimum',
          g = e.schema[m],
          y = e.opts.$data && g && g.$data,
          P = p ? '<' : '>',
          b = p ? '>' : '<',
          f = undefined;
        if (!(h || typeof o == 'number' || o === undefined)) {
          throw new Error(r + ' must be number');
        }
        if (
          !(
            y ||
            g === undefined ||
            typeof g == 'number' ||
            typeof g == 'boolean'
          )
        ) {
          throw new Error(m + ' must be number or boolean');
        }
        if (y) {
          var E = e.util.getData(g.$data, i, e.dataPathArr),
            S = 'exclusive' + s,
            w = 'exclType' + s,
            x = 'exclIsNumber' + s,
            $ = 'op' + s,
            _ = "' + " + $ + " + '";
          a += ' var schemaExcl' + s + ' = ' + E + '; ';
          E = 'schemaExcl' + s;
          a +=
            ' var ' +
            S +
            '; var ' +
            w +
            ' = typeof ' +
            E +
            '; if (' +
            w +
            " != 'boolean' && " +
            w +
            " != 'undefined' && " +
            w +
            " != 'number') { ";
          var f = m;
          var R = R || [];
          R.push(a);
          a = '';
          if (e.createErrors !== false) {
            a +=
              " { keyword: '" +
              (f || '_exclusiveLimit') +
              "' , dataPath: (dataPath || '') + " +
              e.errorPath +
              ' , schemaPath: ' +
              e.util.toQuotedString(l) +
              ' , params: {} ';
            if (e.opts.messages !== false) {
              a += " , message: '" + m + " should be boolean' ";
            }
            if (e.opts.verbose) {
              a +=
                ' , schema: validate.schema' +
                n +
                ' , parentSchema: validate.schema' +
                e.schemaPath +
                ' , data: ' +
                c +
                ' ';
            }
            a += ' } ';
          } else {
            a += ' {} ';
          }
          var F = a;
          a = R.pop();
          if (!e.compositeRule && u) {
            if (e.async) {
              a += ' throw new ValidationError([' + F + ']); ';
            } else {
              a += ' validate.errors = [' + F + ']; return false; ';
            }
          } else {
            a +=
              ' var err = ' +
              F +
              ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
          }
          a += ' } else if ( ';
          if (h) {
            a +=
              ' (' + d + ' !== undefined && typeof ' + d + " != 'number') || ";
          }
          a +=
            ' ' +
            w +
            " == 'number' ? ( (" +
            S +
            ' = ' +
            d +
            ' === undefined || ' +
            E +
            ' ' +
            P +
            '= ' +
            d +
            ') ? ' +
            c +
            ' ' +
            b +
            '= ' +
            E +
            ' : ' +
            c +
            ' ' +
            b +
            ' ' +
            d +
            ' ) : ( (' +
            S +
            ' = ' +
            E +
            ' === true) ? ' +
            c +
            ' ' +
            b +
            '= ' +
            d +
            ' : ' +
            c +
            ' ' +
            b +
            ' ' +
            d +
            ' ) || ' +
            c +
            ' !== ' +
            c +
            ') { var op' +
            s +
            ' = ' +
            S +
            " ? '" +
            P +
            "' : '" +
            P +
            "='; ";
          if (o === undefined) {
            f = m;
            l = e.errSchemaPath + '/' + m;
            d = E;
            h = y;
          }
        } else {
          var x = typeof g == 'number',
            _ = P;
          if (x && h) {
            var $ = "'" + _ + "'";
            a += ' if ( ';
            if (h) {
              a +=
                ' (' +
                d +
                ' !== undefined && typeof ' +
                d +
                " != 'number') || ";
            }
            a +=
              ' ( ' +
              d +
              ' === undefined || ' +
              g +
              ' ' +
              P +
              '= ' +
              d +
              ' ? ' +
              c +
              ' ' +
              b +
              '= ' +
              g +
              ' : ' +
              c +
              ' ' +
              b +
              ' ' +
              d +
              ' ) || ' +
              c +
              ' !== ' +
              c +
              ') { ';
          } else {
            if (x && o === undefined) {
              S = true;
              f = m;
              l = e.errSchemaPath + '/' + m;
              d = g;
              b += '=';
            } else {
              if (x) d = Math[p ? 'min' : 'max'](g, o);
              if (g === (x ? d : true)) {
                S = true;
                f = m;
                l = e.errSchemaPath + '/' + m;
                b += '=';
              } else {
                S = false;
                _ += '=';
              }
            }
            var $ = "'" + _ + "'";
            a += ' if ( ';
            if (h) {
              a +=
                ' (' +
                d +
                ' !== undefined && typeof ' +
                d +
                " != 'number') || ";
            }
            a +=
              ' ' + c + ' ' + b + ' ' + d + ' || ' + c + ' !== ' + c + ') { ';
          }
        }
        f = f || r;
        var R = R || [];
        R.push(a);
        a = '';
        if (e.createErrors !== false) {
          a +=
            " { keyword: '" +
            (f || '_limit') +
            "' , dataPath: (dataPath || '') + " +
            e.errorPath +
            ' , schemaPath: ' +
            e.util.toQuotedString(l) +
            ' , params: { comparison: ' +
            $ +
            ', limit: ' +
            d +
            ', exclusive: ' +
            S +
            ' } ';
          if (e.opts.messages !== false) {
            a += " , message: 'should be " + _ + ' ';
            if (h) {
              a += "' + " + d;
            } else {
              a += '' + d + "'";
            }
          }
          if (e.opts.verbose) {
            a += ' , schema:  ';
            if (h) {
              a += 'validate.schema' + n;
            } else {
              a += '' + o;
            }
            a +=
              '         , parentSchema: validate.schema' +
              e.schemaPath +
              ' , data: ' +
              c +
              ' ';
          }
          a += ' } ';
        } else {
          a += ' {} ';
        }
        var F = a;
        a = R.pop();
        if (!e.compositeRule && u) {
          if (e.async) {
            a += ' throw new ValidationError([' + F + ']); ';
          } else {
            a += ' validate.errors = [' + F + ']; return false; ';
          }
        } else {
          a +=
            ' var err = ' +
            F +
            ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
        }
        a += ' } ';
        if (u) {
          a += ' else { ';
        }
        return a;
      };
    },
    2982: (e) => {
      'use strict';
      e.exports = function generate__limitItems(e, r, t) {
        var a = ' ';
        var s = e.level;
        var i = e.dataLevel;
        var o = e.schema[r];
        var n = e.schemaPath + e.util.getProperty(r);
        var l = e.errSchemaPath + '/' + r;
        var u = !e.opts.allErrors;
        var f;
        var c = 'data' + (i || '');
        var h = e.opts.$data && o && o.$data,
          d;
        if (h) {
          a +=
            ' var schema' +
            s +
            ' = ' +
            e.util.getData(o.$data, i, e.dataPathArr) +
            '; ';
          d = 'schema' + s;
        } else {
          d = o;
        }
        if (!(h || typeof o == 'number')) {
          throw new Error(r + ' must be number');
        }
        var p = r == 'maxItems' ? '>' : '<';
        a += 'if ( ';
        if (h) {
          a += ' (' + d + ' !== undefined && typeof ' + d + " != 'number') || ";
        }
        a += ' ' + c + '.length ' + p + ' ' + d + ') { ';
        var f = r;
        var m = m || [];
        m.push(a);
        a = '';
        if (e.createErrors !== false) {
          a +=
            " { keyword: '" +
            (f || '_limitItems') +
            "' , dataPath: (dataPath || '') + " +
            e.errorPath +
            ' , schemaPath: ' +
            e.util.toQuotedString(l) +
            ' , params: { limit: ' +
            d +
            ' } ';
          if (e.opts.messages !== false) {
            a += " , message: 'should NOT have ";
            if (r == 'maxItems') {
              a += 'more';
            } else {
              a += 'fewer';
            }
            a += ' than ';
            if (h) {
              a += "' + " + d + " + '";
            } else {
              a += '' + o;
            }
            a += " items' ";
          }
          if (e.opts.verbose) {
            a += ' , schema:  ';
            if (h) {
              a += 'validate.schema' + n;
            } else {
              a += '' + o;
            }
            a +=
              '         , parentSchema: validate.schema' +
              e.schemaPath +
              ' , data: ' +
              c +
              ' ';
          }
          a += ' } ';
        } else {
          a += ' {} ';
        }
        var g = a;
        a = m.pop();
        if (!e.compositeRule && u) {
          if (e.async) {
            a += ' throw new ValidationError([' + g + ']); ';
          } else {
            a += ' validate.errors = [' + g + ']; return false; ';
          }
        } else {
          a +=
            ' var err = ' +
            g +
            ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
        }
        a += '} ';
        if (u) {
          a += ' else { ';
        }
        return a;
      };
    },
    8598: (e) => {
      'use strict';
      e.exports = function generate__limitLength(e, r, t) {
        var a = ' ';
        var s = e.level;
        var i = e.dataLevel;
        var o = e.schema[r];
        var n = e.schemaPath + e.util.getProperty(r);
        var l = e.errSchemaPath + '/' + r;
        var u = !e.opts.allErrors;
        var f;
        var c = 'data' + (i || '');
        var h = e.opts.$data && o && o.$data,
          d;
        if (h) {
          a +=
            ' var schema' +
            s +
            ' = ' +
            e.util.getData(o.$data, i, e.dataPathArr) +
            '; ';
          d = 'schema' + s;
        } else {
          d = o;
        }
        if (!(h || typeof o == 'number')) {
          throw new Error(r + ' must be number');
        }
        var p = r == 'maxLength' ? '>' : '<';
        a += 'if ( ';
        if (h) {
          a += ' (' + d + ' !== undefined && typeof ' + d + " != 'number') || ";
        }
        if (e.opts.unicode === false) {
          a += ' ' + c + '.length ';
        } else {
          a += ' ucs2length(' + c + ') ';
        }
        a += ' ' + p + ' ' + d + ') { ';
        var f = r;
        var m = m || [];
        m.push(a);
        a = '';
        if (e.createErrors !== false) {
          a +=
            " { keyword: '" +
            (f || '_limitLength') +
            "' , dataPath: (dataPath || '') + " +
            e.errorPath +
            ' , schemaPath: ' +
            e.util.toQuotedString(l) +
            ' , params: { limit: ' +
            d +
            ' } ';
          if (e.opts.messages !== false) {
            a += " , message: 'should NOT be ";
            if (r == 'maxLength') {
              a += 'longer';
            } else {
              a += 'shorter';
            }
            a += ' than ';
            if (h) {
              a += "' + " + d + " + '";
            } else {
              a += '' + o;
            }
            a += " characters' ";
          }
          if (e.opts.verbose) {
            a += ' , schema:  ';
            if (h) {
              a += 'validate.schema' + n;
            } else {
              a += '' + o;
            }
            a +=
              '         , parentSchema: validate.schema' +
              e.schemaPath +
              ' , data: ' +
              c +
              ' ';
          }
          a += ' } ';
        } else {
          a += ' {} ';
        }
        var g = a;
        a = m.pop();
        if (!e.compositeRule && u) {
          if (e.async) {
            a += ' throw new ValidationError([' + g + ']); ';
          } else {
            a += ' validate.errors = [' + g + ']; return false; ';
          }
        } else {
          a +=
            ' var err = ' +
            g +
            ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
        }
        a += '} ';
        if (u) {
          a += ' else { ';
        }
        return a;
      };
    },
    1667: (e) => {
      'use strict';
      e.exports = function generate__limitProperties(e, r, t) {
        var a = ' ';
        var s = e.level;
        var i = e.dataLevel;
        var o = e.schema[r];
        var n = e.schemaPath + e.util.getProperty(r);
        var l = e.errSchemaPath + '/' + r;
        var u = !e.opts.allErrors;
        var f;
        var c = 'data' + (i || '');
        var h = e.opts.$data && o && o.$data,
          d;
        if (h) {
          a +=
            ' var schema' +
            s +
            ' = ' +
            e.util.getData(o.$data, i, e.dataPathArr) +
            '; ';
          d = 'schema' + s;
        } else {
          d = o;
        }
        if (!(h || typeof o == 'number')) {
          throw new Error(r + ' must be number');
        }
        var p = r == 'maxProperties' ? '>' : '<';
        a += 'if ( ';
        if (h) {
          a += ' (' + d + ' !== undefined && typeof ' + d + " != 'number') || ";
        }
        a += ' Object.keys(' + c + ').length ' + p + ' ' + d + ') { ';
        var f = r;
        var m = m || [];
        m.push(a);
        a = '';
        if (e.createErrors !== false) {
          a +=
            " { keyword: '" +
            (f || '_limitProperties') +
            "' , dataPath: (dataPath || '') + " +
            e.errorPath +
            ' , schemaPath: ' +
            e.util.toQuotedString(l) +
            ' , params: { limit: ' +
            d +
            ' } ';
          if (e.opts.messages !== false) {
            a += " , message: 'should NOT have ";
            if (r == 'maxProperties') {
              a += 'more';
            } else {
              a += 'fewer';
            }
            a += ' than ';
            if (h) {
              a += "' + " + d + " + '";
            } else {
              a += '' + o;
            }
            a += " properties' ";
          }
          if (e.opts.verbose) {
            a += ' , schema:  ';
            if (h) {
              a += 'validate.schema' + n;
            } else {
              a += '' + o;
            }
            a +=
              '         , parentSchema: validate.schema' +
              e.schemaPath +
              ' , data: ' +
              c +
              ' ';
          }
          a += ' } ';
        } else {
          a += ' {} ';
        }
        var g = a;
        a = m.pop();
        if (!e.compositeRule && u) {
          if (e.async) {
            a += ' throw new ValidationError([' + g + ']); ';
          } else {
            a += ' validate.errors = [' + g + ']; return false; ';
          }
        } else {
          a +=
            ' var err = ' +
            g +
            ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
        }
        a += '} ';
        if (u) {
          a += ' else { ';
        }
        return a;
      };
    },
    1308: (e) => {
      'use strict';
      e.exports = function generate_allOf(e, r, t) {
        var a = ' ';
        var s = e.schema[r];
        var i = e.schemaPath + e.util.getProperty(r);
        var o = e.errSchemaPath + '/' + r;
        var n = !e.opts.allErrors;
        var l = e.util.copy(e);
        var u = '';
        l.level++;
        var f = 'valid' + l.level;
        var c = l.baseId,
          h = true;
        var d = s;
        if (d) {
          var p,
            m = -1,
            g = d.length - 1;
          while (m < g) {
            p = d[(m += 1)];
            if (
              e.opts.strictKeywords
                ? (typeof p == 'object' && Object.keys(p).length > 0) ||
                  p === false
                : e.util.schemaHasRules(p, e.RULES.all)
            ) {
              h = false;
              l.schema = p;
              l.schemaPath = i + '[' + m + ']';
              l.errSchemaPath = o + '/' + m;
              a += '  ' + e.validate(l) + ' ';
              l.baseId = c;
              if (n) {
                a += ' if (' + f + ') { ';
                u += '}';
              }
            }
          }
        }
        if (n) {
          if (h) {
            a += ' if (true) { ';
          } else {
            a += ' ' + u.slice(0, -1) + ' ';
          }
        }
        return a;
      };
    },
    7128: (e) => {
      'use strict';
      e.exports = function generate_anyOf(e, r, t) {
        var a = ' ';
        var s = e.level;
        var i = e.dataLevel;
        var o = e.schema[r];
        var n = e.schemaPath + e.util.getProperty(r);
        var l = e.errSchemaPath + '/' + r;
        var u = !e.opts.allErrors;
        var f = 'data' + (i || '');
        var c = 'valid' + s;
        var h = 'errs__' + s;
        var d = e.util.copy(e);
        var p = '';
        d.level++;
        var m = 'valid' + d.level;
        var g = o.every(function (r) {
          return e.opts.strictKeywords
            ? (typeof r == 'object' && Object.keys(r).length > 0) || r === false
            : e.util.schemaHasRules(r, e.RULES.all);
        });
        if (g) {
          var y = d.baseId;
          a += ' var ' + h + ' = errors; var ' + c + ' = false;  ';
          var P = e.compositeRule;
          e.compositeRule = d.compositeRule = true;
          var b = o;
          if (b) {
            var E,
              S = -1,
              w = b.length - 1;
            while (S < w) {
              E = b[(S += 1)];
              d.schema = E;
              d.schemaPath = n + '[' + S + ']';
              d.errSchemaPath = l + '/' + S;
              a += '  ' + e.validate(d) + ' ';
              d.baseId = y;
              a += ' ' + c + ' = ' + c + ' || ' + m + '; if (!' + c + ') { ';
              p += '}';
            }
          }
          e.compositeRule = d.compositeRule = P;
          a += ' ' + p + ' if (!' + c + ') {   var err =   ';
          if (e.createErrors !== false) {
            a +=
              " { keyword: '" +
              'anyOf' +
              "' , dataPath: (dataPath || '') + " +
              e.errorPath +
              ' , schemaPath: ' +
              e.util.toQuotedString(l) +
              ' , params: {} ';
            if (e.opts.messages !== false) {
              a += " , message: 'should match some schema in anyOf' ";
            }
            if (e.opts.verbose) {
              a +=
                ' , schema: validate.schema' +
                n +
                ' , parentSchema: validate.schema' +
                e.schemaPath +
                ' , data: ' +
                f +
                ' ';
            }
            a += ' } ';
          } else {
            a += ' {} ';
          }
          a +=
            ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
          if (!e.compositeRule && u) {
            if (e.async) {
              a += ' throw new ValidationError(vErrors); ';
            } else {
              a += ' validate.errors = vErrors; return false; ';
            }
          }
          a +=
            ' } else {  errors = ' +
            h +
            '; if (vErrors !== null) { if (' +
            h +
            ') vErrors.length = ' +
            h +
            '; else vErrors = null; } ';
          if (e.opts.allErrors) {
            a += ' } ';
          }
        } else {
          if (u) {
            a += ' if (true) { ';
          }
        }
        return a;
      };
    },
    3365: (e) => {
      'use strict';
      e.exports = function generate_comment(e, r, t) {
        var a = ' ';
        var s = e.schema[r];
        var i = e.errSchemaPath + '/' + r;
        var o = !e.opts.allErrors;
        var n = e.util.toQuotedString(s);
        if (e.opts.$comment === true) {
          a += ' console.log(' + n + ');';
        } else if (typeof e.opts.$comment == 'function') {
          a +=
            ' self._opts.$comment(' +
            n +
            ', ' +
            e.util.toQuotedString(i) +
            ', validate.root.schema);';
        }
        return a;
      };
    },
    3507: (e) => {
      'use strict';
      e.exports = function generate_const(e, r, t) {
        var a = ' ';
        var s = e.level;
        var i = e.dataLevel;
        var o = e.schema[r];
        var n = e.schemaPath + e.util.getProperty(r);
        var l = e.errSchemaPath + '/' + r;
        var u = !e.opts.allErrors;
        var f = 'data' + (i || '');
        var c = 'valid' + s;
        var h = e.opts.$data && o && o.$data,
          d;
        if (h) {
          a +=
            ' var schema' +
            s +
            ' = ' +
            e.util.getData(o.$data, i, e.dataPathArr) +
            '; ';
          d = 'schema' + s;
        } else {
          d = o;
        }
        if (!h) {
          a += ' var schema' + s + ' = validate.schema' + n + ';';
        }
        a +=
          'var ' +
          c +
          ' = equal(' +
          f +
          ', schema' +
          s +
          '); if (!' +
          c +
          ') {   ';
        var p = p || [];
        p.push(a);
        a = '';
        if (e.createErrors !== false) {
          a +=
            " { keyword: '" +
            'const' +
            "' , dataPath: (dataPath || '') + " +
            e.errorPath +
            ' , schemaPath: ' +
            e.util.toQuotedString(l) +
            ' , params: { allowedValue: schema' +
            s +
            ' } ';
          if (e.opts.messages !== false) {
            a += " , message: 'should be equal to constant' ";
          }
          if (e.opts.verbose) {
            a +=
              ' , schema: validate.schema' +
              n +
              ' , parentSchema: validate.schema' +
              e.schemaPath +
              ' , data: ' +
              f +
              ' ';
          }
          a += ' } ';
        } else {
          a += ' {} ';
        }
        var m = a;
        a = p.pop();
        if (!e.compositeRule && u) {
          if (e.async) {
            a += ' throw new ValidationError([' + m + ']); ';
          } else {
            a += ' validate.errors = [' + m + ']; return false; ';
          }
        } else {
          a +=
            ' var err = ' +
            m +
            ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
        }
        a += ' }';
        if (u) {
          a += ' else { ';
        }
        return a;
      };
    },
    3348: (e) => {
      'use strict';
      e.exports = function generate_contains(e, r, t) {
        var a = ' ';
        var s = e.level;
        var i = e.dataLevel;
        var o = e.schema[r];
        var n = e.schemaPath + e.util.getProperty(r);
        var l = e.errSchemaPath + '/' + r;
        var u = !e.opts.allErrors;
        var f = 'data' + (i || '');
        var c = 'valid' + s;
        var h = 'errs__' + s;
        var d = e.util.copy(e);
        var p = '';
        d.level++;
        var m = 'valid' + d.level;
        var g = 'i' + s,
          y = (d.dataLevel = e.dataLevel + 1),
          P = 'data' + y,
          b = e.baseId,
          E = e.opts.strictKeywords
            ? (typeof o == 'object' && Object.keys(o).length > 0) || o === false
            : e.util.schemaHasRules(o, e.RULES.all);
        a += 'var ' + h + ' = errors;var ' + c + ';';
        if (E) {
          var S = e.compositeRule;
          e.compositeRule = d.compositeRule = true;
          d.schema = o;
          d.schemaPath = n;
          d.errSchemaPath = l;
          a +=
            ' var ' +
            m +
            ' = false; for (var ' +
            g +
            ' = 0; ' +
            g +
            ' < ' +
            f +
            '.length; ' +
            g +
            '++) { ';
          d.errorPath = e.util.getPathExpr(
            e.errorPath,
            g,
            e.opts.jsonPointers,
            true,
          );
          var w = f + '[' + g + ']';
          d.dataPathArr[y] = g;
          var x = e.validate(d);
          d.baseId = b;
          if (e.util.varOccurences(x, P) < 2) {
            a += ' ' + e.util.varReplace(x, P, w) + ' ';
          } else {
            a += ' var ' + P + ' = ' + w + '; ' + x + ' ';
          }
          a += ' if (' + m + ') break; }  ';
          e.compositeRule = d.compositeRule = S;
          a += ' ' + p + ' if (!' + m + ') {';
        } else {
          a += ' if (' + f + '.length == 0) {';
        }
        var $ = $ || [];
        $.push(a);
        a = '';
        if (e.createErrors !== false) {
          a +=
            " { keyword: '" +
            'contains' +
            "' , dataPath: (dataPath || '') + " +
            e.errorPath +
            ' , schemaPath: ' +
            e.util.toQuotedString(l) +
            ' , params: {} ';
          if (e.opts.messages !== false) {
            a += " , message: 'should contain a valid item' ";
          }
          if (e.opts.verbose) {
            a +=
              ' , schema: validate.schema' +
              n +
              ' , parentSchema: validate.schema' +
              e.schemaPath +
              ' , data: ' +
              f +
              ' ';
          }
          a += ' } ';
        } else {
          a += ' {} ';
        }
        var _ = a;
        a = $.pop();
        if (!e.compositeRule && u) {
          if (e.async) {
            a += ' throw new ValidationError([' + _ + ']); ';
          } else {
            a += ' validate.errors = [' + _ + ']; return false; ';
          }
        } else {
          a +=
            ' var err = ' +
            _ +
            ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
        }
        a += ' } else { ';
        if (E) {
          a +=
            '  errors = ' +
            h +
            '; if (vErrors !== null) { if (' +
            h +
            ') vErrors.length = ' +
            h +
            '; else vErrors = null; } ';
        }
        if (e.opts.allErrors) {
          a += ' } ';
        }
        return a;
      };
    },
    9481: (e) => {
      'use strict';
      e.exports = function generate_custom(e, r, t) {
        var a = ' ';
        var s = e.level;
        var i = e.dataLevel;
        var o = e.schema[r];
        var n = e.schemaPath + e.util.getProperty(r);
        var l = e.errSchemaPath + '/' + r;
        var u = !e.opts.allErrors;
        var f;
        var c = 'data' + (i || '');
        var h = 'valid' + s;
        var d = 'errs__' + s;
        var p = e.opts.$data && o && o.$data,
          m;
        if (p) {
          a +=
            ' var schema' +
            s +
            ' = ' +
            e.util.getData(o.$data, i, e.dataPathArr) +
            '; ';
          m = 'schema' + s;
        } else {
          m = o;
        }
        var g = this,
          y = 'definition' + s,
          P = g.definition,
          b = '';
        var E, S, w, x, $;
        if (p && P.$data) {
          $ = 'keywordValidate' + s;
          var _ = P.validateSchema;
          a +=
            ' var ' +
            y +
            " = RULES.custom['" +
            r +
            "'].definition; var " +
            $ +
            ' = ' +
            y +
            '.validate;';
        } else {
          x = e.useCustomRule(g, o, e.schema, e);
          if (!x) return;
          m = 'validate.schema' + n;
          $ = x.code;
          E = P.compile;
          S = P.inline;
          w = P.macro;
        }
        var R = $ + '.errors',
          F = 'i' + s,
          O = 'ruleErr' + s,
          D = P.async;
        if (D && !e.async) throw new Error('async keyword in sync schema');
        if (!(S || w)) {
          a += '' + R + ' = null;';
        }
        a += 'var ' + d + ' = errors;var ' + h + ';';
        if (p && P.$data) {
          b += '}';
          a += ' if (' + m + ' === undefined) { ' + h + ' = true; } else { ';
          if (_) {
            b += '}';
            a +=
              ' ' +
              h +
              ' = ' +
              y +
              '.validateSchema(' +
              m +
              '); if (' +
              h +
              ') { ';
          }
        }
        if (S) {
          if (P.statements) {
            a += ' ' + x.validate + ' ';
          } else {
            a += ' ' + h + ' = ' + x.validate + '; ';
          }
        } else if (w) {
          var j = e.util.copy(e);
          var b = '';
          j.level++;
          var I = 'valid' + j.level;
          j.schema = x.validate;
          j.schemaPath = '';
          var k = e.compositeRule;
          e.compositeRule = j.compositeRule = true;
          var C = e.validate(j).replace(/validate\.schema/g, $);
          e.compositeRule = j.compositeRule = k;
          a += ' ' + C;
        } else {
          var A = A || [];
          A.push(a);
          a = '';
          a += '  ' + $ + '.call( ';
          if (e.opts.passContext) {
            a += 'this';
          } else {
            a += 'self';
          }
          if (E || P.schema === false) {
            a += ' , ' + c + ' ';
          } else {
            a +=
              ' , ' + m + ' , ' + c + ' , validate.schema' + e.schemaPath + ' ';
          }
          a += " , (dataPath || '')";
          if (e.errorPath != '""') {
            a += ' + ' + e.errorPath;
          }
          var N = i ? 'data' + (i - 1 || '') : 'parentData',
            T = i ? e.dataPathArr[i] : 'parentDataProperty';
          a += ' , ' + N + ' , ' + T + ' , rootData )  ';
          var L = a;
          a = A.pop();
          if (P.errors === false) {
            a += ' ' + h + ' = ';
            if (D) {
              a += 'await ';
            }
            a += '' + L + '; ';
          } else {
            if (D) {
              R = 'customErrors' + s;
              a +=
                ' var ' +
                R +
                ' = null; try { ' +
                h +
                ' = await ' +
                L +
                '; } catch (e) { ' +
                h +
                ' = false; if (e instanceof ValidationError) ' +
                R +
                ' = e.errors; else throw e; } ';
            } else {
              a += ' ' + R + ' = null; ' + h + ' = ' + L + '; ';
            }
          }
        }
        if (P.modifying) {
          a += ' if (' + N + ') ' + c + ' = ' + N + '[' + T + '];';
        }
        a += '' + b;
        if (P.valid) {
          if (u) {
            a += ' if (true) { ';
          }
        } else {
          a += ' if ( ';
          if (P.valid === undefined) {
            a += ' !';
            if (w) {
              a += '' + I;
            } else {
              a += '' + h;
            }
          } else {
            a += ' ' + !P.valid + ' ';
          }
          a += ') { ';
          f = g.keyword;
          var A = A || [];
          A.push(a);
          a = '';
          var A = A || [];
          A.push(a);
          a = '';
          if (e.createErrors !== false) {
            a +=
              " { keyword: '" +
              (f || 'custom') +
              "' , dataPath: (dataPath || '') + " +
              e.errorPath +
              ' , schemaPath: ' +
              e.util.toQuotedString(l) +
              " , params: { keyword: '" +
              g.keyword +
              "' } ";
            if (e.opts.messages !== false) {
              a +=
                ' , message: \'should pass "' +
                g.keyword +
                '" keyword validation\' ';
            }
            if (e.opts.verbose) {
              a +=
                ' , schema: validate.schema' +
                n +
                ' , parentSchema: validate.schema' +
                e.schemaPath +
                ' , data: ' +
                c +
                ' ';
            }
            a += ' } ';
          } else {
            a += ' {} ';
          }
          var q = a;
          a = A.pop();
          if (!e.compositeRule && u) {
            if (e.async) {
              a += ' throw new ValidationError([' + q + ']); ';
            } else {
              a += ' validate.errors = [' + q + ']; return false; ';
            }
          } else {
            a +=
              ' var err = ' +
              q +
              ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
          }
          var z = a;
          a = A.pop();
          if (S) {
            if (P.errors) {
              if (P.errors != 'full') {
                a +=
                  '  for (var ' +
                  F +
                  '=' +
                  d +
                  '; ' +
                  F +
                  '<errors; ' +
                  F +
                  '++) { var ' +
                  O +
                  ' = vErrors[' +
                  F +
                  ']; if (' +
                  O +
                  '.dataPath === undefined) ' +
                  O +
                  ".dataPath = (dataPath || '') + " +
                  e.errorPath +
                  '; if (' +
                  O +
                  '.schemaPath === undefined) { ' +
                  O +
                  '.schemaPath = "' +
                  l +
                  '"; } ';
                if (e.opts.verbose) {
                  a +=
                    ' ' +
                    O +
                    '.schema = ' +
                    m +
                    '; ' +
                    O +
                    '.data = ' +
                    c +
                    '; ';
                }
                a += ' } ';
              }
            } else {
              if (P.errors === false) {
                a += ' ' + z + ' ';
              } else {
                a +=
                  ' if (' +
                  d +
                  ' == errors) { ' +
                  z +
                  ' } else {  for (var ' +
                  F +
                  '=' +
                  d +
                  '; ' +
                  F +
                  '<errors; ' +
                  F +
                  '++) { var ' +
                  O +
                  ' = vErrors[' +
                  F +
                  ']; if (' +
                  O +
                  '.dataPath === undefined) ' +
                  O +
                  ".dataPath = (dataPath || '') + " +
                  e.errorPath +
                  '; if (' +
                  O +
                  '.schemaPath === undefined) { ' +
                  O +
                  '.schemaPath = "' +
                  l +
                  '"; } ';
                if (e.opts.verbose) {
                  a +=
                    ' ' +
                    O +
                    '.schema = ' +
                    m +
                    '; ' +
                    O +
                    '.data = ' +
                    c +
                    '; ';
                }
                a += ' } } ';
              }
            }
          } else if (w) {
            a += '   var err =   ';
            if (e.createErrors !== false) {
              a +=
                " { keyword: '" +
                (f || 'custom') +
                "' , dataPath: (dataPath || '') + " +
                e.errorPath +
                ' , schemaPath: ' +
                e.util.toQuotedString(l) +
                " , params: { keyword: '" +
                g.keyword +
                "' } ";
              if (e.opts.messages !== false) {
                a +=
                  ' , message: \'should pass "' +
                  g.keyword +
                  '" keyword validation\' ';
              }
              if (e.opts.verbose) {
                a +=
                  ' , schema: validate.schema' +
                  n +
                  ' , parentSchema: validate.schema' +
                  e.schemaPath +
                  ' , data: ' +
                  c +
                  ' ';
              }
              a += ' } ';
            } else {
              a += ' {} ';
            }
            a +=
              ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
            if (!e.compositeRule && u) {
              if (e.async) {
                a += ' throw new ValidationError(vErrors); ';
              } else {
                a += ' validate.errors = vErrors; return false; ';
              }
            }
          } else {
            if (P.errors === false) {
              a += ' ' + z + ' ';
            } else {
              a +=
                ' if (Array.isArray(' +
                R +
                ')) { if (vErrors === null) vErrors = ' +
                R +
                '; else vErrors = vErrors.concat(' +
                R +
                '); errors = vErrors.length;  for (var ' +
                F +
                '=' +
                d +
                '; ' +
                F +
                '<errors; ' +
                F +
                '++) { var ' +
                O +
                ' = vErrors[' +
                F +
                ']; if (' +
                O +
                '.dataPath === undefined) ' +
                O +
                ".dataPath = (dataPath || '') + " +
                e.errorPath +
                ';  ' +
                O +
                '.schemaPath = "' +
                l +
                '";  ';
              if (e.opts.verbose) {
                a +=
                  ' ' + O + '.schema = ' + m + '; ' + O + '.data = ' + c + '; ';
              }
              a += ' } } else { ' + z + ' } ';
            }
          }
          a += ' } ';
          if (u) {
            a += ' else { ';
          }
        }
        return a;
      };
    },
    7862: (e) => {
      'use strict';
      e.exports = function generate_dependencies(e, r, t) {
        var a = ' ';
        var s = e.level;
        var i = e.dataLevel;
        var o = e.schema[r];
        var n = e.schemaPath + e.util.getProperty(r);
        var l = e.errSchemaPath + '/' + r;
        var u = !e.opts.allErrors;
        var f = 'data' + (i || '');
        var c = 'errs__' + s;
        var h = e.util.copy(e);
        var d = '';
        h.level++;
        var p = 'valid' + h.level;
        var m = {},
          g = {},
          y = e.opts.ownProperties;
        for (S in o) {
          if (S == '__proto__') continue;
          var P = o[S];
          var b = Array.isArray(P) ? g : m;
          b[S] = P;
        }
        a += 'var ' + c + ' = errors;';
        var E = e.errorPath;
        a += 'var missing' + s + ';';
        for (var S in g) {
          b = g[S];
          if (b.length) {
            a += ' if ( ' + f + e.util.getProperty(S) + ' !== undefined ';
            if (y) {
              a +=
                ' && Object.prototype.hasOwnProperty.call(' +
                f +
                ", '" +
                e.util.escapeQuotes(S) +
                "') ";
            }
            if (u) {
              a += ' && ( ';
              var w = b;
              if (w) {
                var x,
                  $ = -1,
                  _ = w.length - 1;
                while ($ < _) {
                  x = w[($ += 1)];
                  if ($) {
                    a += ' || ';
                  }
                  var R = e.util.getProperty(x),
                    F = f + R;
                  a += ' ( ( ' + F + ' === undefined ';
                  if (y) {
                    a +=
                      ' || ! Object.prototype.hasOwnProperty.call(' +
                      f +
                      ", '" +
                      e.util.escapeQuotes(x) +
                      "') ";
                  }
                  a +=
                    ') && (missing' +
                    s +
                    ' = ' +
                    e.util.toQuotedString(e.opts.jsonPointers ? x : R) +
                    ') ) ';
                }
              }
              a += ')) {  ';
              var O = 'missing' + s,
                D = "' + " + O + " + '";
              if (e.opts._errorDataPathProperty) {
                e.errorPath = e.opts.jsonPointers
                  ? e.util.getPathExpr(E, O, true)
                  : E + ' + ' + O;
              }
              var j = j || [];
              j.push(a);
              a = '';
              if (e.createErrors !== false) {
                a +=
                  " { keyword: '" +
                  'dependencies' +
                  "' , dataPath: (dataPath || '') + " +
                  e.errorPath +
                  ' , schemaPath: ' +
                  e.util.toQuotedString(l) +
                  " , params: { property: '" +
                  e.util.escapeQuotes(S) +
                  "', missingProperty: '" +
                  D +
                  "', depsCount: " +
                  b.length +
                  ", deps: '" +
                  e.util.escapeQuotes(b.length == 1 ? b[0] : b.join(', ')) +
                  "' } ";
                if (e.opts.messages !== false) {
                  a += " , message: 'should have ";
                  if (b.length == 1) {
                    a += 'property ' + e.util.escapeQuotes(b[0]);
                  } else {
                    a += 'properties ' + e.util.escapeQuotes(b.join(', '));
                  }
                  a +=
                    ' when property ' +
                    e.util.escapeQuotes(S) +
                    " is present' ";
                }
                if (e.opts.verbose) {
                  a +=
                    ' , schema: validate.schema' +
                    n +
                    ' , parentSchema: validate.schema' +
                    e.schemaPath +
                    ' , data: ' +
                    f +
                    ' ';
                }
                a += ' } ';
              } else {
                a += ' {} ';
              }
              var I = a;
              a = j.pop();
              if (!e.compositeRule && u) {
                if (e.async) {
                  a += ' throw new ValidationError([' + I + ']); ';
                } else {
                  a += ' validate.errors = [' + I + ']; return false; ';
                }
              } else {
                a +=
                  ' var err = ' +
                  I +
                  ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
              }
            } else {
              a += ' ) { ';
              var k = b;
              if (k) {
                var x,
                  C = -1,
                  A = k.length - 1;
                while (C < A) {
                  x = k[(C += 1)];
                  var R = e.util.getProperty(x),
                    D = e.util.escapeQuotes(x),
                    F = f + R;
                  if (e.opts._errorDataPathProperty) {
                    e.errorPath = e.util.getPath(E, x, e.opts.jsonPointers);
                  }
                  a += ' if ( ' + F + ' === undefined ';
                  if (y) {
                    a +=
                      ' || ! Object.prototype.hasOwnProperty.call(' +
                      f +
                      ", '" +
                      e.util.escapeQuotes(x) +
                      "') ";
                  }
                  a += ') {  var err =   ';
                  if (e.createErrors !== false) {
                    a +=
                      " { keyword: '" +
                      'dependencies' +
                      "' , dataPath: (dataPath || '') + " +
                      e.errorPath +
                      ' , schemaPath: ' +
                      e.util.toQuotedString(l) +
                      " , params: { property: '" +
                      e.util.escapeQuotes(S) +
                      "', missingProperty: '" +
                      D +
                      "', depsCount: " +
                      b.length +
                      ", deps: '" +
                      e.util.escapeQuotes(b.length == 1 ? b[0] : b.join(', ')) +
                      "' } ";
                    if (e.opts.messages !== false) {
                      a += " , message: 'should have ";
                      if (b.length == 1) {
                        a += 'property ' + e.util.escapeQuotes(b[0]);
                      } else {
                        a += 'properties ' + e.util.escapeQuotes(b.join(', '));
                      }
                      a +=
                        ' when property ' +
                        e.util.escapeQuotes(S) +
                        " is present' ";
                    }
                    if (e.opts.verbose) {
                      a +=
                        ' , schema: validate.schema' +
                        n +
                        ' , parentSchema: validate.schema' +
                        e.schemaPath +
                        ' , data: ' +
                        f +
                        ' ';
                    }
                    a += ' } ';
                  } else {
                    a += ' {} ';
                  }
                  a +=
                    ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; } ';
                }
              }
            }
            a += ' }   ';
            if (u) {
              d += '}';
              a += ' else { ';
            }
          }
        }
        e.errorPath = E;
        var N = h.baseId;
        for (var S in m) {
          var P = m[S];
          if (
            e.opts.strictKeywords
              ? (typeof P == 'object' && Object.keys(P).length > 0) ||
                P === false
              : e.util.schemaHasRules(P, e.RULES.all)
          ) {
            a +=
              ' ' +
              p +
              ' = true; if ( ' +
              f +
              e.util.getProperty(S) +
              ' !== undefined ';
            if (y) {
              a +=
                ' && Object.prototype.hasOwnProperty.call(' +
                f +
                ", '" +
                e.util.escapeQuotes(S) +
                "') ";
            }
            a += ') { ';
            h.schema = P;
            h.schemaPath = n + e.util.getProperty(S);
            h.errSchemaPath = l + '/' + e.util.escapeFragment(S);
            a += '  ' + e.validate(h) + ' ';
            h.baseId = N;
            a += ' }  ';
            if (u) {
              a += ' if (' + p + ') { ';
              d += '}';
            }
          }
        }
        if (u) {
          a += '   ' + d + ' if (' + c + ' == errors) {';
        }
        return a;
      };
    },
    3691: (e) => {
      'use strict';
      e.exports = function generate_enum(e, r, t) {
        var a = ' ';
        var s = e.level;
        var i = e.dataLevel;
        var o = e.schema[r];
        var n = e.schemaPath + e.util.getProperty(r);
        var l = e.errSchemaPath + '/' + r;
        var u = !e.opts.allErrors;
        var f = 'data' + (i || '');
        var c = 'valid' + s;
        var h = e.opts.$data && o && o.$data,
          d;
        if (h) {
          a +=
            ' var schema' +
            s +
            ' = ' +
            e.util.getData(o.$data, i, e.dataPathArr) +
            '; ';
          d = 'schema' + s;
        } else {
          d = o;
        }
        var p = 'i' + s,
          m = 'schema' + s;
        if (!h) {
          a += ' var ' + m + ' = validate.schema' + n + ';';
        }
        a += 'var ' + c + ';';
        if (h) {
          a +=
            ' if (schema' +
            s +
            ' === undefined) ' +
            c +
            ' = true; else if (!Array.isArray(schema' +
            s +
            ')) ' +
            c +
            ' = false; else {';
        }
        a +=
          '' +
          c +
          ' = false;for (var ' +
          p +
          '=0; ' +
          p +
          '<' +
          m +
          '.length; ' +
          p +
          '++) if (equal(' +
          f +
          ', ' +
          m +
          '[' +
          p +
          '])) { ' +
          c +
          ' = true; break; }';
        if (h) {
          a += '  }  ';
        }
        a += ' if (!' + c + ') {   ';
        var g = g || [];
        g.push(a);
        a = '';
        if (e.createErrors !== false) {
          a +=
            " { keyword: '" +
            'enum' +
            "' , dataPath: (dataPath || '') + " +
            e.errorPath +
            ' , schemaPath: ' +
            e.util.toQuotedString(l) +
            ' , params: { allowedValues: schema' +
            s +
            ' } ';
          if (e.opts.messages !== false) {
            a += " , message: 'should be equal to one of the allowed values' ";
          }
          if (e.opts.verbose) {
            a +=
              ' , schema: validate.schema' +
              n +
              ' , parentSchema: validate.schema' +
              e.schemaPath +
              ' , data: ' +
              f +
              ' ';
          }
          a += ' } ';
        } else {
          a += ' {} ';
        }
        var y = a;
        a = g.pop();
        if (!e.compositeRule && u) {
          if (e.async) {
            a += ' throw new ValidationError([' + y + ']); ';
          } else {
            a += ' validate.errors = [' + y + ']; return false; ';
          }
        } else {
          a +=
            ' var err = ' +
            y +
            ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
        }
        a += ' }';
        if (u) {
          a += ' else { ';
        }
        return a;
      };
    },
    1811: (e) => {
      'use strict';
      e.exports = function generate_format(e, r, t) {
        var a = ' ';
        var s = e.level;
        var i = e.dataLevel;
        var o = e.schema[r];
        var n = e.schemaPath + e.util.getProperty(r);
        var l = e.errSchemaPath + '/' + r;
        var u = !e.opts.allErrors;
        var f = 'data' + (i || '');
        if (e.opts.format === false) {
          if (u) {
            a += ' if (true) { ';
          }
          return a;
        }
        var c = e.opts.$data && o && o.$data,
          h;
        if (c) {
          a +=
            ' var schema' +
            s +
            ' = ' +
            e.util.getData(o.$data, i, e.dataPathArr) +
            '; ';
          h = 'schema' + s;
        } else {
          h = o;
        }
        var d = e.opts.unknownFormats,
          p = Array.isArray(d);
        if (c) {
          var m = 'format' + s,
            g = 'isObject' + s,
            y = 'formatType' + s;
          a +=
            ' var ' +
            m +
            ' = formats[' +
            h +
            ']; var ' +
            g +
            ' = typeof ' +
            m +
            " == 'object' && !(" +
            m +
            ' instanceof RegExp) && ' +
            m +
            '.validate; var ' +
            y +
            ' = ' +
            g +
            ' && ' +
            m +
            ".type || 'string'; if (" +
            g +
            ') { ';
          if (e.async) {
            a += ' var async' + s + ' = ' + m + '.async; ';
          }
          a += ' ' + m + ' = ' + m + '.validate; } if (  ';
          if (c) {
            a +=
              ' (' + h + ' !== undefined && typeof ' + h + " != 'string') || ";
          }
          a += ' (';
          if (d != 'ignore') {
            a += ' (' + h + ' && !' + m + ' ';
            if (p) {
              a += ' && self._opts.unknownFormats.indexOf(' + h + ') == -1 ';
            }
            a += ') || ';
          }
          a +=
            ' (' +
            m +
            ' && ' +
            y +
            " == '" +
            t +
            "' && !(typeof " +
            m +
            " == 'function' ? ";
          if (e.async) {
            a +=
              ' (async' +
              s +
              ' ? await ' +
              m +
              '(' +
              f +
              ') : ' +
              m +
              '(' +
              f +
              ')) ';
          } else {
            a += ' ' + m + '(' + f + ') ';
          }
          a += ' : ' + m + '.test(' + f + '))))) {';
        } else {
          var m = e.formats[o];
          if (!m) {
            if (d == 'ignore') {
              e.logger.warn(
                'unknown format "' +
                  o +
                  '" ignored in schema at path "' +
                  e.errSchemaPath +
                  '"',
              );
              if (u) {
                a += ' if (true) { ';
              }
              return a;
            } else if (p && d.indexOf(o) >= 0) {
              if (u) {
                a += ' if (true) { ';
              }
              return a;
            } else {
              throw new Error(
                'unknown format "' +
                  o +
                  '" is used in schema at path "' +
                  e.errSchemaPath +
                  '"',
              );
            }
          }
          var g = typeof m == 'object' && !(m instanceof RegExp) && m.validate;
          var y = (g && m.type) || 'string';
          if (g) {
            var P = m.async === true;
            m = m.validate;
          }
          if (y != t) {
            if (u) {
              a += ' if (true) { ';
            }
            return a;
          }
          if (P) {
            if (!e.async) throw new Error('async format in sync schema');
            var b = 'formats' + e.util.getProperty(o) + '.validate';
            a += ' if (!(await ' + b + '(' + f + '))) { ';
          } else {
            a += ' if (! ';
            var b = 'formats' + e.util.getProperty(o);
            if (g) b += '.validate';
            if (typeof m == 'function') {
              a += ' ' + b + '(' + f + ') ';
            } else {
              a += ' ' + b + '.test(' + f + ') ';
            }
            a += ') { ';
          }
        }
        var E = E || [];
        E.push(a);
        a = '';
        if (e.createErrors !== false) {
          a +=
            " { keyword: '" +
            'format' +
            "' , dataPath: (dataPath || '') + " +
            e.errorPath +
            ' , schemaPath: ' +
            e.util.toQuotedString(l) +
            ' , params: { format:  ';
          if (c) {
            a += '' + h;
          } else {
            a += '' + e.util.toQuotedString(o);
          }
          a += '  } ';
          if (e.opts.messages !== false) {
            a += ' , message: \'should match format "';
            if (c) {
              a += "' + " + h + " + '";
            } else {
              a += '' + e.util.escapeQuotes(o);
            }
            a += '"\' ';
          }
          if (e.opts.verbose) {
            a += ' , schema:  ';
            if (c) {
              a += 'validate.schema' + n;
            } else {
              a += '' + e.util.toQuotedString(o);
            }
            a +=
              '         , parentSchema: validate.schema' +
              e.schemaPath +
              ' , data: ' +
              f +
              ' ';
          }
          a += ' } ';
        } else {
          a += ' {} ';
        }
        var S = a;
        a = E.pop();
        if (!e.compositeRule && u) {
          if (e.async) {
            a += ' throw new ValidationError([' + S + ']); ';
          } else {
            a += ' validate.errors = [' + S + ']; return false; ';
          }
        } else {
          a +=
            ' var err = ' +
            S +
            ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
        }
        a += ' } ';
        if (u) {
          a += ' else { ';
        }
        return a;
      };
    },
    2678: (e) => {
      'use strict';
      e.exports = function generate_if(e, r, t) {
        var a = ' ';
        var s = e.level;
        var i = e.dataLevel;
        var o = e.schema[r];
        var n = e.schemaPath + e.util.getProperty(r);
        var l = e.errSchemaPath + '/' + r;
        var u = !e.opts.allErrors;
        var f = 'data' + (i || '');
        var c = 'valid' + s;
        var h = 'errs__' + s;
        var d = e.util.copy(e);
        d.level++;
        var p = 'valid' + d.level;
        var m = e.schema['then'],
          g = e.schema['else'],
          y =
            m !== undefined &&
            (e.opts.strictKeywords
              ? (typeof m == 'object' && Object.keys(m).length > 0) ||
                m === false
              : e.util.schemaHasRules(m, e.RULES.all)),
          P =
            g !== undefined &&
            (e.opts.strictKeywords
              ? (typeof g == 'object' && Object.keys(g).length > 0) ||
                g === false
              : e.util.schemaHasRules(g, e.RULES.all)),
          b = d.baseId;
        if (y || P) {
          var E;
          d.createErrors = false;
          d.schema = o;
          d.schemaPath = n;
          d.errSchemaPath = l;
          a += ' var ' + h + ' = errors; var ' + c + ' = true;  ';
          var S = e.compositeRule;
          e.compositeRule = d.compositeRule = true;
          a += '  ' + e.validate(d) + ' ';
          d.baseId = b;
          d.createErrors = true;
          a +=
            '  errors = ' +
            h +
            '; if (vErrors !== null) { if (' +
            h +
            ') vErrors.length = ' +
            h +
            '; else vErrors = null; }  ';
          e.compositeRule = d.compositeRule = S;
          if (y) {
            a += ' if (' + p + ') {  ';
            d.schema = e.schema['then'];
            d.schemaPath = e.schemaPath + '.then';
            d.errSchemaPath = e.errSchemaPath + '/then';
            a += '  ' + e.validate(d) + ' ';
            d.baseId = b;
            a += ' ' + c + ' = ' + p + '; ';
            if (y && P) {
              E = 'ifClause' + s;
              a += ' var ' + E + " = 'then'; ";
            } else {
              E = "'then'";
            }
            a += ' } ';
            if (P) {
              a += ' else { ';
            }
          } else {
            a += ' if (!' + p + ') { ';
          }
          if (P) {
            d.schema = e.schema['else'];
            d.schemaPath = e.schemaPath + '.else';
            d.errSchemaPath = e.errSchemaPath + '/else';
            a += '  ' + e.validate(d) + ' ';
            d.baseId = b;
            a += ' ' + c + ' = ' + p + '; ';
            if (y && P) {
              E = 'ifClause' + s;
              a += ' var ' + E + " = 'else'; ";
            } else {
              E = "'else'";
            }
            a += ' } ';
          }
          a += ' if (!' + c + ') {   var err =   ';
          if (e.createErrors !== false) {
            a +=
              " { keyword: '" +
              'if' +
              "' , dataPath: (dataPath || '') + " +
              e.errorPath +
              ' , schemaPath: ' +
              e.util.toQuotedString(l) +
              ' , params: { failingKeyword: ' +
              E +
              ' } ';
            if (e.opts.messages !== false) {
              a += " , message: 'should match \"' + " + E + " + '\" schema' ";
            }
            if (e.opts.verbose) {
              a +=
                ' , schema: validate.schema' +
                n +
                ' , parentSchema: validate.schema' +
                e.schemaPath +
                ' , data: ' +
                f +
                ' ';
            }
            a += ' } ';
          } else {
            a += ' {} ';
          }
          a +=
            ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
          if (!e.compositeRule && u) {
            if (e.async) {
              a += ' throw new ValidationError(vErrors); ';
            } else {
              a += ' validate.errors = vErrors; return false; ';
            }
          }
          a += ' }   ';
          if (u) {
            a += ' else { ';
          }
        } else {
          if (u) {
            a += ' if (true) { ';
          }
        }
        return a;
      };
    },
    734: (e, r, t) => {
      'use strict';
      e.exports = {
        $ref: t(6915),
        allOf: t(1308),
        anyOf: t(7128),
        $comment: t(3365),
        const: t(3507),
        contains: t(3348),
        dependencies: t(7862),
        enum: t(3691),
        format: t(1811),
        if: t(2678),
        items: t(7540),
        maximum: t(9510),
        minimum: t(9510),
        maxItems: t(2982),
        minItems: t(2982),
        maxLength: t(8598),
        minLength: t(8598),
        maxProperties: t(1667),
        minProperties: t(1667),
        multipleOf: t(2958),
        not: t(4453),
        oneOf: t(8899),
        pattern: t(5476),
        properties: t(6435),
        propertyNames: t(3862),
        required: t(3478),
        uniqueItems: t(6266),
        validate: t(2801),
      };
    },
    7540: (e) => {
      'use strict';
      e.exports = function generate_items(e, r, t) {
        var a = ' ';
        var s = e.level;
        var i = e.dataLevel;
        var o = e.schema[r];
        var n = e.schemaPath + e.util.getProperty(r);
        var l = e.errSchemaPath + '/' + r;
        var u = !e.opts.allErrors;
        var f = 'data' + (i || '');
        var c = 'valid' + s;
        var h = 'errs__' + s;
        var d = e.util.copy(e);
        var p = '';
        d.level++;
        var m = 'valid' + d.level;
        var g = 'i' + s,
          y = (d.dataLevel = e.dataLevel + 1),
          P = 'data' + y,
          b = e.baseId;
        a += 'var ' + h + ' = errors;var ' + c + ';';
        if (Array.isArray(o)) {
          var E = e.schema.additionalItems;
          if (E === false) {
            a += ' ' + c + ' = ' + f + '.length <= ' + o.length + '; ';
            var S = l;
            l = e.errSchemaPath + '/additionalItems';
            a += '  if (!' + c + ') {   ';
            var w = w || [];
            w.push(a);
            a = '';
            if (e.createErrors !== false) {
              a +=
                " { keyword: '" +
                'additionalItems' +
                "' , dataPath: (dataPath || '') + " +
                e.errorPath +
                ' , schemaPath: ' +
                e.util.toQuotedString(l) +
                ' , params: { limit: ' +
                o.length +
                ' } ';
              if (e.opts.messages !== false) {
                a +=
                  " , message: 'should NOT have more than " +
                  o.length +
                  " items' ";
              }
              if (e.opts.verbose) {
                a +=
                  ' , schema: false , parentSchema: validate.schema' +
                  e.schemaPath +
                  ' , data: ' +
                  f +
                  ' ';
              }
              a += ' } ';
            } else {
              a += ' {} ';
            }
            var x = a;
            a = w.pop();
            if (!e.compositeRule && u) {
              if (e.async) {
                a += ' throw new ValidationError([' + x + ']); ';
              } else {
                a += ' validate.errors = [' + x + ']; return false; ';
              }
            } else {
              a +=
                ' var err = ' +
                x +
                ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
            }
            a += ' } ';
            l = S;
            if (u) {
              p += '}';
              a += ' else { ';
            }
          }
          var $ = o;
          if ($) {
            var _,
              R = -1,
              F = $.length - 1;
            while (R < F) {
              _ = $[(R += 1)];
              if (
                e.opts.strictKeywords
                  ? (typeof _ == 'object' && Object.keys(_).length > 0) ||
                    _ === false
                  : e.util.schemaHasRules(_, e.RULES.all)
              ) {
                a += ' ' + m + ' = true; if (' + f + '.length > ' + R + ') { ';
                var O = f + '[' + R + ']';
                d.schema = _;
                d.schemaPath = n + '[' + R + ']';
                d.errSchemaPath = l + '/' + R;
                d.errorPath = e.util.getPathExpr(
                  e.errorPath,
                  R,
                  e.opts.jsonPointers,
                  true,
                );
                d.dataPathArr[y] = R;
                var D = e.validate(d);
                d.baseId = b;
                if (e.util.varOccurences(D, P) < 2) {
                  a += ' ' + e.util.varReplace(D, P, O) + ' ';
                } else {
                  a += ' var ' + P + ' = ' + O + '; ' + D + ' ';
                }
                a += ' }  ';
                if (u) {
                  a += ' if (' + m + ') { ';
                  p += '}';
                }
              }
            }
          }
          if (
            typeof E == 'object' &&
            (e.opts.strictKeywords
              ? (typeof E == 'object' && Object.keys(E).length > 0) ||
                E === false
              : e.util.schemaHasRules(E, e.RULES.all))
          ) {
            d.schema = E;
            d.schemaPath = e.schemaPath + '.additionalItems';
            d.errSchemaPath = e.errSchemaPath + '/additionalItems';
            a +=
              ' ' +
              m +
              ' = true; if (' +
              f +
              '.length > ' +
              o.length +
              ') {  for (var ' +
              g +
              ' = ' +
              o.length +
              '; ' +
              g +
              ' < ' +
              f +
              '.length; ' +
              g +
              '++) { ';
            d.errorPath = e.util.getPathExpr(
              e.errorPath,
              g,
              e.opts.jsonPointers,
              true,
            );
            var O = f + '[' + g + ']';
            d.dataPathArr[y] = g;
            var D = e.validate(d);
            d.baseId = b;
            if (e.util.varOccurences(D, P) < 2) {
              a += ' ' + e.util.varReplace(D, P, O) + ' ';
            } else {
              a += ' var ' + P + ' = ' + O + '; ' + D + ' ';
            }
            if (u) {
              a += ' if (!' + m + ') break; ';
            }
            a += ' } }  ';
            if (u) {
              a += ' if (' + m + ') { ';
              p += '}';
            }
          }
        } else if (
          e.opts.strictKeywords
            ? (typeof o == 'object' && Object.keys(o).length > 0) || o === false
            : e.util.schemaHasRules(o, e.RULES.all)
        ) {
          d.schema = o;
          d.schemaPath = n;
          d.errSchemaPath = l;
          a +=
            '  for (var ' +
            g +
            ' = ' +
            0 +
            '; ' +
            g +
            ' < ' +
            f +
            '.length; ' +
            g +
            '++) { ';
          d.errorPath = e.util.getPathExpr(
            e.errorPath,
            g,
            e.opts.jsonPointers,
            true,
          );
          var O = f + '[' + g + ']';
          d.dataPathArr[y] = g;
          var D = e.validate(d);
          d.baseId = b;
          if (e.util.varOccurences(D, P) < 2) {
            a += ' ' + e.util.varReplace(D, P, O) + ' ';
          } else {
            a += ' var ' + P + ' = ' + O + '; ' + D + ' ';
          }
          if (u) {
            a += ' if (!' + m + ') break; ';
          }
          a += ' }';
        }
        if (u) {
          a += ' ' + p + ' if (' + h + ' == errors) {';
        }
        return a;
      };
    },
    2958: (e) => {
      'use strict';
      e.exports = function generate_multipleOf(e, r, t) {
        var a = ' ';
        var s = e.level;
        var i = e.dataLevel;
        var o = e.schema[r];
        var n = e.schemaPath + e.util.getProperty(r);
        var l = e.errSchemaPath + '/' + r;
        var u = !e.opts.allErrors;
        var f = 'data' + (i || '');
        var c = e.opts.$data && o && o.$data,
          h;
        if (c) {
          a +=
            ' var schema' +
            s +
            ' = ' +
            e.util.getData(o.$data, i, e.dataPathArr) +
            '; ';
          h = 'schema' + s;
        } else {
          h = o;
        }
        if (!(c || typeof o == 'number')) {
          throw new Error(r + ' must be number');
        }
        a += 'var division' + s + ';if (';
        if (c) {
          a += ' ' + h + ' !== undefined && ( typeof ' + h + " != 'number' || ";
        }
        a += ' (division' + s + ' = ' + f + ' / ' + h + ', ';
        if (e.opts.multipleOfPrecision) {
          a +=
            ' Math.abs(Math.round(division' +
            s +
            ') - division' +
            s +
            ') > 1e-' +
            e.opts.multipleOfPrecision +
            ' ';
        } else {
          a += ' division' + s + ' !== parseInt(division' + s + ') ';
        }
        a += ' ) ';
        if (c) {
          a += '  )  ';
        }
        a += ' ) {   ';
        var d = d || [];
        d.push(a);
        a = '';
        if (e.createErrors !== false) {
          a +=
            " { keyword: '" +
            'multipleOf' +
            "' , dataPath: (dataPath || '') + " +
            e.errorPath +
            ' , schemaPath: ' +
            e.util.toQuotedString(l) +
            ' , params: { multipleOf: ' +
            h +
            ' } ';
          if (e.opts.messages !== false) {
            a += " , message: 'should be multiple of ";
            if (c) {
              a += "' + " + h;
            } else {
              a += '' + h + "'";
            }
          }
          if (e.opts.verbose) {
            a += ' , schema:  ';
            if (c) {
              a += 'validate.schema' + n;
            } else {
              a += '' + o;
            }
            a +=
              '         , parentSchema: validate.schema' +
              e.schemaPath +
              ' , data: ' +
              f +
              ' ';
          }
          a += ' } ';
        } else {
          a += ' {} ';
        }
        var p = a;
        a = d.pop();
        if (!e.compositeRule && u) {
          if (e.async) {
            a += ' throw new ValidationError([' + p + ']); ';
          } else {
            a += ' validate.errors = [' + p + ']; return false; ';
          }
        } else {
          a +=
            ' var err = ' +
            p +
            ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
        }
        a += '} ';
        if (u) {
          a += ' else { ';
        }
        return a;
      };
    },
    4453: (e) => {
      'use strict';
      e.exports = function generate_not(e, r, t) {
        var a = ' ';
        var s = e.level;
        var i = e.dataLevel;
        var o = e.schema[r];
        var n = e.schemaPath + e.util.getProperty(r);
        var l = e.errSchemaPath + '/' + r;
        var u = !e.opts.allErrors;
        var f = 'data' + (i || '');
        var c = 'errs__' + s;
        var h = e.util.copy(e);
        h.level++;
        var d = 'valid' + h.level;
        if (
          e.opts.strictKeywords
            ? (typeof o == 'object' && Object.keys(o).length > 0) || o === false
            : e.util.schemaHasRules(o, e.RULES.all)
        ) {
          h.schema = o;
          h.schemaPath = n;
          h.errSchemaPath = l;
          a += ' var ' + c + ' = errors;  ';
          var p = e.compositeRule;
          e.compositeRule = h.compositeRule = true;
          h.createErrors = false;
          var m;
          if (h.opts.allErrors) {
            m = h.opts.allErrors;
            h.opts.allErrors = false;
          }
          a += ' ' + e.validate(h) + ' ';
          h.createErrors = true;
          if (m) h.opts.allErrors = m;
          e.compositeRule = h.compositeRule = p;
          a += ' if (' + d + ') {   ';
          var g = g || [];
          g.push(a);
          a = '';
          if (e.createErrors !== false) {
            a +=
              " { keyword: '" +
              'not' +
              "' , dataPath: (dataPath || '') + " +
              e.errorPath +
              ' , schemaPath: ' +
              e.util.toQuotedString(l) +
              ' , params: {} ';
            if (e.opts.messages !== false) {
              a += " , message: 'should NOT be valid' ";
            }
            if (e.opts.verbose) {
              a +=
                ' , schema: validate.schema' +
                n +
                ' , parentSchema: validate.schema' +
                e.schemaPath +
                ' , data: ' +
                f +
                ' ';
            }
            a += ' } ';
          } else {
            a += ' {} ';
          }
          var y = a;
          a = g.pop();
          if (!e.compositeRule && u) {
            if (e.async) {
              a += ' throw new ValidationError([' + y + ']); ';
            } else {
              a += ' validate.errors = [' + y + ']; return false; ';
            }
          } else {
            a +=
              ' var err = ' +
              y +
              ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
          }
          a +=
            ' } else {  errors = ' +
            c +
            '; if (vErrors !== null) { if (' +
            c +
            ') vErrors.length = ' +
            c +
            '; else vErrors = null; } ';
          if (e.opts.allErrors) {
            a += ' } ';
          }
        } else {
          a += '  var err =   ';
          if (e.createErrors !== false) {
            a +=
              " { keyword: '" +
              'not' +
              "' , dataPath: (dataPath || '') + " +
              e.errorPath +
              ' , schemaPath: ' +
              e.util.toQuotedString(l) +
              ' , params: {} ';
            if (e.opts.messages !== false) {
              a += " , message: 'should NOT be valid' ";
            }
            if (e.opts.verbose) {
              a +=
                ' , schema: validate.schema' +
                n +
                ' , parentSchema: validate.schema' +
                e.schemaPath +
                ' , data: ' +
                f +
                ' ';
            }
            a += ' } ';
          } else {
            a += ' {} ';
          }
          a +=
            ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
          if (u) {
            a += ' if (false) { ';
          }
        }
        return a;
      };
    },
    8899: (e) => {
      'use strict';
      e.exports = function generate_oneOf(e, r, t) {
        var a = ' ';
        var s = e.level;
        var i = e.dataLevel;
        var o = e.schema[r];
        var n = e.schemaPath + e.util.getProperty(r);
        var l = e.errSchemaPath + '/' + r;
        var u = !e.opts.allErrors;
        var f = 'data' + (i || '');
        var c = 'valid' + s;
        var h = 'errs__' + s;
        var d = e.util.copy(e);
        var p = '';
        d.level++;
        var m = 'valid' + d.level;
        var g = d.baseId,
          y = 'prevValid' + s,
          P = 'passingSchemas' + s;
        a +=
          'var ' +
          h +
          ' = errors , ' +
          y +
          ' = false , ' +
          c +
          ' = false , ' +
          P +
          ' = null; ';
        var b = e.compositeRule;
        e.compositeRule = d.compositeRule = true;
        var E = o;
        if (E) {
          var S,
            w = -1,
            x = E.length - 1;
          while (w < x) {
            S = E[(w += 1)];
            if (
              e.opts.strictKeywords
                ? (typeof S == 'object' && Object.keys(S).length > 0) ||
                  S === false
                : e.util.schemaHasRules(S, e.RULES.all)
            ) {
              d.schema = S;
              d.schemaPath = n + '[' + w + ']';
              d.errSchemaPath = l + '/' + w;
              a += '  ' + e.validate(d) + ' ';
              d.baseId = g;
            } else {
              a += ' var ' + m + ' = true; ';
            }
            if (w) {
              a +=
                ' if (' +
                m +
                ' && ' +
                y +
                ') { ' +
                c +
                ' = false; ' +
                P +
                ' = [' +
                P +
                ', ' +
                w +
                ']; } else { ';
              p += '}';
            }
            a +=
              ' if (' +
              m +
              ') { ' +
              c +
              ' = ' +
              y +
              ' = true; ' +
              P +
              ' = ' +
              w +
              '; }';
          }
        }
        e.compositeRule = d.compositeRule = b;
        a += '' + p + 'if (!' + c + ') {   var err =   ';
        if (e.createErrors !== false) {
          a +=
            " { keyword: '" +
            'oneOf' +
            "' , dataPath: (dataPath || '') + " +
            e.errorPath +
            ' , schemaPath: ' +
            e.util.toQuotedString(l) +
            ' , params: { passingSchemas: ' +
            P +
            ' } ';
          if (e.opts.messages !== false) {
            a += " , message: 'should match exactly one schema in oneOf' ";
          }
          if (e.opts.verbose) {
            a +=
              ' , schema: validate.schema' +
              n +
              ' , parentSchema: validate.schema' +
              e.schemaPath +
              ' , data: ' +
              f +
              ' ';
          }
          a += ' } ';
        } else {
          a += ' {} ';
        }
        a +=
          ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
        if (!e.compositeRule && u) {
          if (e.async) {
            a += ' throw new ValidationError(vErrors); ';
          } else {
            a += ' validate.errors = vErrors; return false; ';
          }
        }
        a +=
          '} else {  errors = ' +
          h +
          '; if (vErrors !== null) { if (' +
          h +
          ') vErrors.length = ' +
          h +
          '; else vErrors = null; }';
        if (e.opts.allErrors) {
          a += ' } ';
        }
        return a;
      };
    },
    5476: (e) => {
      'use strict';
      e.exports = function generate_pattern(e, r, t) {
        var a = ' ';
        var s = e.level;
        var i = e.dataLevel;
        var o = e.schema[r];
        var n = e.schemaPath + e.util.getProperty(r);
        var l = e.errSchemaPath + '/' + r;
        var u = !e.opts.allErrors;
        var f = 'data' + (i || '');
        var c = e.opts.$data && o && o.$data,
          h;
        if (c) {
          a +=
            ' var schema' +
            s +
            ' = ' +
            e.util.getData(o.$data, i, e.dataPathArr) +
            '; ';
          h = 'schema' + s;
        } else {
          h = o;
        }
        var d = c ? '(new RegExp(' + h + '))' : e.usePattern(o);
        a += 'if ( ';
        if (c) {
          a += ' (' + h + ' !== undefined && typeof ' + h + " != 'string') || ";
        }
        a += ' !' + d + '.test(' + f + ') ) {   ';
        var p = p || [];
        p.push(a);
        a = '';
        if (e.createErrors !== false) {
          a +=
            " { keyword: '" +
            'pattern' +
            "' , dataPath: (dataPath || '') + " +
            e.errorPath +
            ' , schemaPath: ' +
            e.util.toQuotedString(l) +
            ' , params: { pattern:  ';
          if (c) {
            a += '' + h;
          } else {
            a += '' + e.util.toQuotedString(o);
          }
          a += '  } ';
          if (e.opts.messages !== false) {
            a += ' , message: \'should match pattern "';
            if (c) {
              a += "' + " + h + " + '";
            } else {
              a += '' + e.util.escapeQuotes(o);
            }
            a += '"\' ';
          }
          if (e.opts.verbose) {
            a += ' , schema:  ';
            if (c) {
              a += 'validate.schema' + n;
            } else {
              a += '' + e.util.toQuotedString(o);
            }
            a +=
              '         , parentSchema: validate.schema' +
              e.schemaPath +
              ' , data: ' +
              f +
              ' ';
          }
          a += ' } ';
        } else {
          a += ' {} ';
        }
        var m = a;
        a = p.pop();
        if (!e.compositeRule && u) {
          if (e.async) {
            a += ' throw new ValidationError([' + m + ']); ';
          } else {
            a += ' validate.errors = [' + m + ']; return false; ';
          }
        } else {
          a +=
            ' var err = ' +
            m +
            ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
        }
        a += '} ';
        if (u) {
          a += ' else { ';
        }
        return a;
      };
    },
    6435: (e) => {
      'use strict';
      e.exports = function generate_properties(e, r, t) {
        var a = ' ';
        var s = e.level;
        var i = e.dataLevel;
        var o = e.schema[r];
        var n = e.schemaPath + e.util.getProperty(r);
        var l = e.errSchemaPath + '/' + r;
        var u = !e.opts.allErrors;
        var f = 'data' + (i || '');
        var c = 'errs__' + s;
        var h = e.util.copy(e);
        var d = '';
        h.level++;
        var p = 'valid' + h.level;
        var m = 'key' + s,
          g = 'idx' + s,
          y = (h.dataLevel = e.dataLevel + 1),
          P = 'data' + y,
          b = 'dataProperties' + s;
        var E = Object.keys(o || {}).filter(notProto),
          S = e.schema.patternProperties || {},
          w = Object.keys(S).filter(notProto),
          x = e.schema.additionalProperties,
          $ = E.length || w.length,
          _ = x === false,
          R = typeof x == 'object' && Object.keys(x).length,
          F = e.opts.removeAdditional,
          O = _ || R || F,
          D = e.opts.ownProperties,
          j = e.baseId;
        var I = e.schema.required;
        if (I && !(e.opts.$data && I.$data) && I.length < e.opts.loopRequired) {
          var k = e.util.toHash(I);
        }
        function notProto(e) {
          return e !== '__proto__';
        }
        a += 'var ' + c + ' = errors;var ' + p + ' = true;';
        if (D) {
          a += ' var ' + b + ' = undefined;';
        }
        if (O) {
          if (D) {
            a +=
              ' ' +
              b +
              ' = ' +
              b +
              ' || Object.keys(' +
              f +
              '); for (var ' +
              g +
              '=0; ' +
              g +
              '<' +
              b +
              '.length; ' +
              g +
              '++) { var ' +
              m +
              ' = ' +
              b +
              '[' +
              g +
              ']; ';
          } else {
            a += ' for (var ' + m + ' in ' + f + ') { ';
          }
          if ($) {
            a += ' var isAdditional' + s + ' = !(false ';
            if (E.length) {
              if (E.length > 8) {
                a += ' || validate.schema' + n + '.hasOwnProperty(' + m + ') ';
              } else {
                var C = E;
                if (C) {
                  var A,
                    N = -1,
                    T = C.length - 1;
                  while (N < T) {
                    A = C[(N += 1)];
                    a += ' || ' + m + ' == ' + e.util.toQuotedString(A) + ' ';
                  }
                }
              }
            }
            if (w.length) {
              var L = w;
              if (L) {
                var q,
                  z = -1,
                  M = L.length - 1;
                while (z < M) {
                  q = L[(z += 1)];
                  a += ' || ' + e.usePattern(q) + '.test(' + m + ') ';
                }
              }
            }
            a += ' ); if (isAdditional' + s + ') { ';
          }
          if (F == 'all') {
            a += ' delete ' + f + '[' + m + ']; ';
          } else {
            var U = e.errorPath;
            var V = "' + " + m + " + '";
            if (e.opts._errorDataPathProperty) {
              e.errorPath = e.util.getPathExpr(
                e.errorPath,
                m,
                e.opts.jsonPointers,
              );
            }
            if (_) {
              if (F) {
                a += ' delete ' + f + '[' + m + ']; ';
              } else {
                a += ' ' + p + ' = false; ';
                var Q = l;
                l = e.errSchemaPath + '/additionalProperties';
                var K = K || [];
                K.push(a);
                a = '';
                if (e.createErrors !== false) {
                  a +=
                    " { keyword: '" +
                    'additionalProperties' +
                    "' , dataPath: (dataPath || '') + " +
                    e.errorPath +
                    ' , schemaPath: ' +
                    e.util.toQuotedString(l) +
                    " , params: { additionalProperty: '" +
                    V +
                    "' } ";
                  if (e.opts.messages !== false) {
                    a += " , message: '";
                    if (e.opts._errorDataPathProperty) {
                      a += 'is an invalid additional property';
                    } else {
                      a += 'should NOT have additional properties';
                    }
                    a += "' ";
                  }
                  if (e.opts.verbose) {
                    a +=
                      ' , schema: false , parentSchema: validate.schema' +
                      e.schemaPath +
                      ' , data: ' +
                      f +
                      ' ';
                  }
                  a += ' } ';
                } else {
                  a += ' {} ';
                }
                var H = a;
                a = K.pop();
                if (!e.compositeRule && u) {
                  if (e.async) {
                    a += ' throw new ValidationError([' + H + ']); ';
                  } else {
                    a += ' validate.errors = [' + H + ']; return false; ';
                  }
                } else {
                  a +=
                    ' var err = ' +
                    H +
                    ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
                }
                l = Q;
                if (u) {
                  a += ' break; ';
                }
              }
            } else if (R) {
              if (F == 'failing') {
                a += ' var ' + c + ' = errors;  ';
                var J = e.compositeRule;
                e.compositeRule = h.compositeRule = true;
                h.schema = x;
                h.schemaPath = e.schemaPath + '.additionalProperties';
                h.errSchemaPath = e.errSchemaPath + '/additionalProperties';
                h.errorPath = e.opts._errorDataPathProperty
                  ? e.errorPath
                  : e.util.getPathExpr(e.errorPath, m, e.opts.jsonPointers);
                var B = f + '[' + m + ']';
                h.dataPathArr[y] = m;
                var Z = e.validate(h);
                h.baseId = j;
                if (e.util.varOccurences(Z, P) < 2) {
                  a += ' ' + e.util.varReplace(Z, P, B) + ' ';
                } else {
                  a += ' var ' + P + ' = ' + B + '; ' + Z + ' ';
                }
                a +=
                  ' if (!' +
                  p +
                  ') { errors = ' +
                  c +
                  '; if (validate.errors !== null) { if (errors) validate.errors.length = errors; else validate.errors = null; } delete ' +
                  f +
                  '[' +
                  m +
                  ']; }  ';
                e.compositeRule = h.compositeRule = J;
              } else {
                h.schema = x;
                h.schemaPath = e.schemaPath + '.additionalProperties';
                h.errSchemaPath = e.errSchemaPath + '/additionalProperties';
                h.errorPath = e.opts._errorDataPathProperty
                  ? e.errorPath
                  : e.util.getPathExpr(e.errorPath, m, e.opts.jsonPointers);
                var B = f + '[' + m + ']';
                h.dataPathArr[y] = m;
                var Z = e.validate(h);
                h.baseId = j;
                if (e.util.varOccurences(Z, P) < 2) {
                  a += ' ' + e.util.varReplace(Z, P, B) + ' ';
                } else {
                  a += ' var ' + P + ' = ' + B + '; ' + Z + ' ';
                }
                if (u) {
                  a += ' if (!' + p + ') break; ';
                }
              }
            }
            e.errorPath = U;
          }
          if ($) {
            a += ' } ';
          }
          a += ' }  ';
          if (u) {
            a += ' if (' + p + ') { ';
            d += '}';
          }
        }
        var G = e.opts.useDefaults && !e.compositeRule;
        if (E.length) {
          var Y = E;
          if (Y) {
            var A,
              W = -1,
              X = Y.length - 1;
            while (W < X) {
              A = Y[(W += 1)];
              var ee = o[A];
              if (
                e.opts.strictKeywords
                  ? (typeof ee == 'object' && Object.keys(ee).length > 0) ||
                    ee === false
                  : e.util.schemaHasRules(ee, e.RULES.all)
              ) {
                var re = e.util.getProperty(A),
                  B = f + re,
                  te = G && ee.default !== undefined;
                h.schema = ee;
                h.schemaPath = n + re;
                h.errSchemaPath = l + '/' + e.util.escapeFragment(A);
                h.errorPath = e.util.getPath(
                  e.errorPath,
                  A,
                  e.opts.jsonPointers,
                );
                h.dataPathArr[y] = e.util.toQuotedString(A);
                var Z = e.validate(h);
                h.baseId = j;
                if (e.util.varOccurences(Z, P) < 2) {
                  Z = e.util.varReplace(Z, P, B);
                  var ae = B;
                } else {
                  var ae = P;
                  a += ' var ' + P + ' = ' + B + '; ';
                }
                if (te) {
                  a += ' ' + Z + ' ';
                } else {
                  if (k && k[A]) {
                    a += ' if ( ' + ae + ' === undefined ';
                    if (D) {
                      a +=
                        ' || ! Object.prototype.hasOwnProperty.call(' +
                        f +
                        ", '" +
                        e.util.escapeQuotes(A) +
                        "') ";
                    }
                    a += ') { ' + p + ' = false; ';
                    var U = e.errorPath,
                      Q = l,
                      se = e.util.escapeQuotes(A);
                    if (e.opts._errorDataPathProperty) {
                      e.errorPath = e.util.getPath(U, A, e.opts.jsonPointers);
                    }
                    l = e.errSchemaPath + '/required';
                    var K = K || [];
                    K.push(a);
                    a = '';
                    if (e.createErrors !== false) {
                      a +=
                        " { keyword: '" +
                        'required' +
                        "' , dataPath: (dataPath || '') + " +
                        e.errorPath +
                        ' , schemaPath: ' +
                        e.util.toQuotedString(l) +
                        " , params: { missingProperty: '" +
                        se +
                        "' } ";
                      if (e.opts.messages !== false) {
                        a += " , message: '";
                        if (e.opts._errorDataPathProperty) {
                          a += 'is a required property';
                        } else {
                          a += "should have required property \\'" + se + "\\'";
                        }
                        a += "' ";
                      }
                      if (e.opts.verbose) {
                        a +=
                          ' , schema: validate.schema' +
                          n +
                          ' , parentSchema: validate.schema' +
                          e.schemaPath +
                          ' , data: ' +
                          f +
                          ' ';
                      }
                      a += ' } ';
                    } else {
                      a += ' {} ';
                    }
                    var H = a;
                    a = K.pop();
                    if (!e.compositeRule && u) {
                      if (e.async) {
                        a += ' throw new ValidationError([' + H + ']); ';
                      } else {
                        a += ' validate.errors = [' + H + ']; return false; ';
                      }
                    } else {
                      a +=
                        ' var err = ' +
                        H +
                        ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
                    }
                    l = Q;
                    e.errorPath = U;
                    a += ' } else { ';
                  } else {
                    if (u) {
                      a += ' if ( ' + ae + ' === undefined ';
                      if (D) {
                        a +=
                          ' || ! Object.prototype.hasOwnProperty.call(' +
                          f +
                          ", '" +
                          e.util.escapeQuotes(A) +
                          "') ";
                      }
                      a += ') { ' + p + ' = true; } else { ';
                    } else {
                      a += ' if (' + ae + ' !== undefined ';
                      if (D) {
                        a +=
                          ' &&   Object.prototype.hasOwnProperty.call(' +
                          f +
                          ", '" +
                          e.util.escapeQuotes(A) +
                          "') ";
                      }
                      a += ' ) { ';
                    }
                  }
                  a += ' ' + Z + ' } ';
                }
              }
              if (u) {
                a += ' if (' + p + ') { ';
                d += '}';
              }
            }
          }
        }
        if (w.length) {
          var ie = w;
          if (ie) {
            var q,
              oe = -1,
              ne = ie.length - 1;
            while (oe < ne) {
              q = ie[(oe += 1)];
              var ee = S[q];
              if (
                e.opts.strictKeywords
                  ? (typeof ee == 'object' && Object.keys(ee).length > 0) ||
                    ee === false
                  : e.util.schemaHasRules(ee, e.RULES.all)
              ) {
                h.schema = ee;
                h.schemaPath =
                  e.schemaPath + '.patternProperties' + e.util.getProperty(q);
                h.errSchemaPath =
                  e.errSchemaPath +
                  '/patternProperties/' +
                  e.util.escapeFragment(q);
                if (D) {
                  a +=
                    ' ' +
                    b +
                    ' = ' +
                    b +
                    ' || Object.keys(' +
                    f +
                    '); for (var ' +
                    g +
                    '=0; ' +
                    g +
                    '<' +
                    b +
                    '.length; ' +
                    g +
                    '++) { var ' +
                    m +
                    ' = ' +
                    b +
                    '[' +
                    g +
                    ']; ';
                } else {
                  a += ' for (var ' + m + ' in ' + f + ') { ';
                }
                a += ' if (' + e.usePattern(q) + '.test(' + m + ')) { ';
                h.errorPath = e.util.getPathExpr(
                  e.errorPath,
                  m,
                  e.opts.jsonPointers,
                );
                var B = f + '[' + m + ']';
                h.dataPathArr[y] = m;
                var Z = e.validate(h);
                h.baseId = j;
                if (e.util.varOccurences(Z, P) < 2) {
                  a += ' ' + e.util.varReplace(Z, P, B) + ' ';
                } else {
                  a += ' var ' + P + ' = ' + B + '; ' + Z + ' ';
                }
                if (u) {
                  a += ' if (!' + p + ') break; ';
                }
                a += ' } ';
                if (u) {
                  a += ' else ' + p + ' = true; ';
                }
                a += ' }  ';
                if (u) {
                  a += ' if (' + p + ') { ';
                  d += '}';
                }
              }
            }
          }
        }
        if (u) {
          a += ' ' + d + ' if (' + c + ' == errors) {';
        }
        return a;
      };
    },
    3862: (e) => {
      'use strict';
      e.exports = function generate_propertyNames(e, r, t) {
        var a = ' ';
        var s = e.level;
        var i = e.dataLevel;
        var o = e.schema[r];
        var n = e.schemaPath + e.util.getProperty(r);
        var l = e.errSchemaPath + '/' + r;
        var u = !e.opts.allErrors;
        var f = 'data' + (i || '');
        var c = 'errs__' + s;
        var h = e.util.copy(e);
        var d = '';
        h.level++;
        var p = 'valid' + h.level;
        a += 'var ' + c + ' = errors;';
        if (
          e.opts.strictKeywords
            ? (typeof o == 'object' && Object.keys(o).length > 0) || o === false
            : e.util.schemaHasRules(o, e.RULES.all)
        ) {
          h.schema = o;
          h.schemaPath = n;
          h.errSchemaPath = l;
          var m = 'key' + s,
            g = 'idx' + s,
            y = 'i' + s,
            P = "' + " + m + " + '",
            b = (h.dataLevel = e.dataLevel + 1),
            E = 'data' + b,
            S = 'dataProperties' + s,
            w = e.opts.ownProperties,
            x = e.baseId;
          if (w) {
            a += ' var ' + S + ' = undefined; ';
          }
          if (w) {
            a +=
              ' ' +
              S +
              ' = ' +
              S +
              ' || Object.keys(' +
              f +
              '); for (var ' +
              g +
              '=0; ' +
              g +
              '<' +
              S +
              '.length; ' +
              g +
              '++) { var ' +
              m +
              ' = ' +
              S +
              '[' +
              g +
              ']; ';
          } else {
            a += ' for (var ' + m + ' in ' + f + ') { ';
          }
          a += ' var startErrs' + s + ' = errors; ';
          var $ = m;
          var _ = e.compositeRule;
          e.compositeRule = h.compositeRule = true;
          var R = e.validate(h);
          h.baseId = x;
          if (e.util.varOccurences(R, E) < 2) {
            a += ' ' + e.util.varReplace(R, E, $) + ' ';
          } else {
            a += ' var ' + E + ' = ' + $ + '; ' + R + ' ';
          }
          e.compositeRule = h.compositeRule = _;
          a +=
            ' if (!' +
            p +
            ') { for (var ' +
            y +
            '=startErrs' +
            s +
            '; ' +
            y +
            '<errors; ' +
            y +
            '++) { vErrors[' +
            y +
            '].propertyName = ' +
            m +
            '; }   var err =   ';
          if (e.createErrors !== false) {
            a +=
              " { keyword: '" +
              'propertyNames' +
              "' , dataPath: (dataPath || '') + " +
              e.errorPath +
              ' , schemaPath: ' +
              e.util.toQuotedString(l) +
              " , params: { propertyName: '" +
              P +
              "' } ";
            if (e.opts.messages !== false) {
              a += " , message: 'property name \\'" + P + "\\' is invalid' ";
            }
            if (e.opts.verbose) {
              a +=
                ' , schema: validate.schema' +
                n +
                ' , parentSchema: validate.schema' +
                e.schemaPath +
                ' , data: ' +
                f +
                ' ';
            }
            a += ' } ';
          } else {
            a += ' {} ';
          }
          a +=
            ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
          if (!e.compositeRule && u) {
            if (e.async) {
              a += ' throw new ValidationError(vErrors); ';
            } else {
              a += ' validate.errors = vErrors; return false; ';
            }
          }
          if (u) {
            a += ' break; ';
          }
          a += ' } }';
        }
        if (u) {
          a += ' ' + d + ' if (' + c + ' == errors) {';
        }
        return a;
      };
    },
    6915: (e) => {
      'use strict';
      e.exports = function generate_ref(e, r, t) {
        var a = ' ';
        var s = e.level;
        var i = e.dataLevel;
        var o = e.schema[r];
        var n = e.errSchemaPath + '/' + r;
        var l = !e.opts.allErrors;
        var u = 'data' + (i || '');
        var f = 'valid' + s;
        var c, h;
        if (o == '#' || o == '#/') {
          if (e.isRoot) {
            c = e.async;
            h = 'validate';
          } else {
            c = e.root.schema.$async === true;
            h = 'root.refVal[0]';
          }
        } else {
          var d = e.resolveRef(e.baseId, o, e.isRoot);
          if (d === undefined) {
            var p = e.MissingRefError.message(e.baseId, o);
            if (e.opts.missingRefs == 'fail') {
              e.logger.error(p);
              var m = m || [];
              m.push(a);
              a = '';
              if (e.createErrors !== false) {
                a +=
                  " { keyword: '" +
                  '$ref' +
                  "' , dataPath: (dataPath || '') + " +
                  e.errorPath +
                  ' , schemaPath: ' +
                  e.util.toQuotedString(n) +
                  " , params: { ref: '" +
                  e.util.escapeQuotes(o) +
                  "' } ";
                if (e.opts.messages !== false) {
                  a +=
                    " , message: 'can\\'t resolve reference " +
                    e.util.escapeQuotes(o) +
                    "' ";
                }
                if (e.opts.verbose) {
                  a +=
                    ' , schema: ' +
                    e.util.toQuotedString(o) +
                    ' , parentSchema: validate.schema' +
                    e.schemaPath +
                    ' , data: ' +
                    u +
                    ' ';
                }
                a += ' } ';
              } else {
                a += ' {} ';
              }
              var g = a;
              a = m.pop();
              if (!e.compositeRule && l) {
                if (e.async) {
                  a += ' throw new ValidationError([' + g + ']); ';
                } else {
                  a += ' validate.errors = [' + g + ']; return false; ';
                }
              } else {
                a +=
                  ' var err = ' +
                  g +
                  ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
              }
              if (l) {
                a += ' if (false) { ';
              }
            } else if (e.opts.missingRefs == 'ignore') {
              e.logger.warn(p);
              if (l) {
                a += ' if (true) { ';
              }
            } else {
              throw new e.MissingRefError(e.baseId, o, p);
            }
          } else if (d.inline) {
            var y = e.util.copy(e);
            y.level++;
            var P = 'valid' + y.level;
            y.schema = d.schema;
            y.schemaPath = '';
            y.errSchemaPath = o;
            var b = e.validate(y).replace(/validate\.schema/g, d.code);
            a += ' ' + b + ' ';
            if (l) {
              a += ' if (' + P + ') { ';
            }
          } else {
            c = d.$async === true || (e.async && d.$async !== false);
            h = d.code;
          }
        }
        if (h) {
          var m = m || [];
          m.push(a);
          a = '';
          if (e.opts.passContext) {
            a += ' ' + h + '.call(this, ';
          } else {
            a += ' ' + h + '( ';
          }
          a += ' ' + u + ", (dataPath || '')";
          if (e.errorPath != '""') {
            a += ' + ' + e.errorPath;
          }
          var E = i ? 'data' + (i - 1 || '') : 'parentData',
            S = i ? e.dataPathArr[i] : 'parentDataProperty';
          a += ' , ' + E + ' , ' + S + ', rootData)  ';
          var w = a;
          a = m.pop();
          if (c) {
            if (!e.async)
              throw new Error('async schema referenced by sync schema');
            if (l) {
              a += ' var ' + f + '; ';
            }
            a += ' try { await ' + w + '; ';
            if (l) {
              a += ' ' + f + ' = true; ';
            }
            a +=
              ' } catch (e) { if (!(e instanceof ValidationError)) throw e; if (vErrors === null) vErrors = e.errors; else vErrors = vErrors.concat(e.errors); errors = vErrors.length; ';
            if (l) {
              a += ' ' + f + ' = false; ';
            }
            a += ' } ';
            if (l) {
              a += ' if (' + f + ') { ';
            }
          } else {
            a +=
              ' if (!' +
              w +
              ') { if (vErrors === null) vErrors = ' +
              h +
              '.errors; else vErrors = vErrors.concat(' +
              h +
              '.errors); errors = vErrors.length; } ';
            if (l) {
              a += ' else { ';
            }
          }
        }
        return a;
      };
    },
    3478: (e) => {
      'use strict';
      e.exports = function generate_required(e, r, t) {
        var a = ' ';
        var s = e.level;
        var i = e.dataLevel;
        var o = e.schema[r];
        var n = e.schemaPath + e.util.getProperty(r);
        var l = e.errSchemaPath + '/' + r;
        var u = !e.opts.allErrors;
        var f = 'data' + (i || '');
        var c = 'valid' + s;
        var h = e.opts.$data && o && o.$data,
          d;
        if (h) {
          a +=
            ' var schema' +
            s +
            ' = ' +
            e.util.getData(o.$data, i, e.dataPathArr) +
            '; ';
          d = 'schema' + s;
        } else {
          d = o;
        }
        var p = 'schema' + s;
        if (!h) {
          if (
            o.length < e.opts.loopRequired &&
            e.schema.properties &&
            Object.keys(e.schema.properties).length
          ) {
            var m = [];
            var g = o;
            if (g) {
              var y,
                P = -1,
                b = g.length - 1;
              while (P < b) {
                y = g[(P += 1)];
                var E = e.schema.properties[y];
                if (
                  !(
                    E &&
                    (e.opts.strictKeywords
                      ? (typeof E == 'object' && Object.keys(E).length > 0) ||
                        E === false
                      : e.util.schemaHasRules(E, e.RULES.all))
                  )
                ) {
                  m[m.length] = y;
                }
              }
            }
          } else {
            var m = o;
          }
        }
        if (h || m.length) {
          var S = e.errorPath,
            w = h || m.length >= e.opts.loopRequired,
            x = e.opts.ownProperties;
          if (u) {
            a += ' var missing' + s + '; ';
            if (w) {
              if (!h) {
                a += ' var ' + p + ' = validate.schema' + n + '; ';
              }
              var $ = 'i' + s,
                _ = 'schema' + s + '[' + $ + ']',
                R = "' + " + _ + " + '";
              if (e.opts._errorDataPathProperty) {
                e.errorPath = e.util.getPathExpr(S, _, e.opts.jsonPointers);
              }
              a += ' var ' + c + ' = true; ';
              if (h) {
                a +=
                  ' if (schema' +
                  s +
                  ' === undefined) ' +
                  c +
                  ' = true; else if (!Array.isArray(schema' +
                  s +
                  ')) ' +
                  c +
                  ' = false; else {';
              }
              a +=
                ' for (var ' +
                $ +
                ' = 0; ' +
                $ +
                ' < ' +
                p +
                '.length; ' +
                $ +
                '++) { ' +
                c +
                ' = ' +
                f +
                '[' +
                p +
                '[' +
                $ +
                ']] !== undefined ';
              if (x) {
                a +=
                  ' &&   Object.prototype.hasOwnProperty.call(' +
                  f +
                  ', ' +
                  p +
                  '[' +
                  $ +
                  ']) ';
              }
              a += '; if (!' + c + ') break; } ';
              if (h) {
                a += '  }  ';
              }
              a += '  if (!' + c + ') {   ';
              var F = F || [];
              F.push(a);
              a = '';
              if (e.createErrors !== false) {
                a +=
                  " { keyword: '" +
                  'required' +
                  "' , dataPath: (dataPath || '') + " +
                  e.errorPath +
                  ' , schemaPath: ' +
                  e.util.toQuotedString(l) +
                  " , params: { missingProperty: '" +
                  R +
                  "' } ";
                if (e.opts.messages !== false) {
                  a += " , message: '";
                  if (e.opts._errorDataPathProperty) {
                    a += 'is a required property';
                  } else {
                    a += "should have required property \\'" + R + "\\'";
                  }
                  a += "' ";
                }
                if (e.opts.verbose) {
                  a +=
                    ' , schema: validate.schema' +
                    n +
                    ' , parentSchema: validate.schema' +
                    e.schemaPath +
                    ' , data: ' +
                    f +
                    ' ';
                }
                a += ' } ';
              } else {
                a += ' {} ';
              }
              var O = a;
              a = F.pop();
              if (!e.compositeRule && u) {
                if (e.async) {
                  a += ' throw new ValidationError([' + O + ']); ';
                } else {
                  a += ' validate.errors = [' + O + ']; return false; ';
                }
              } else {
                a +=
                  ' var err = ' +
                  O +
                  ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
              }
              a += ' } else { ';
            } else {
              a += ' if ( ';
              var D = m;
              if (D) {
                var j,
                  $ = -1,
                  I = D.length - 1;
                while ($ < I) {
                  j = D[($ += 1)];
                  if ($) {
                    a += ' || ';
                  }
                  var k = e.util.getProperty(j),
                    C = f + k;
                  a += ' ( ( ' + C + ' === undefined ';
                  if (x) {
                    a +=
                      ' || ! Object.prototype.hasOwnProperty.call(' +
                      f +
                      ", '" +
                      e.util.escapeQuotes(j) +
                      "') ";
                  }
                  a +=
                    ') && (missing' +
                    s +
                    ' = ' +
                    e.util.toQuotedString(e.opts.jsonPointers ? j : k) +
                    ') ) ';
                }
              }
              a += ') {  ';
              var _ = 'missing' + s,
                R = "' + " + _ + " + '";
              if (e.opts._errorDataPathProperty) {
                e.errorPath = e.opts.jsonPointers
                  ? e.util.getPathExpr(S, _, true)
                  : S + ' + ' + _;
              }
              var F = F || [];
              F.push(a);
              a = '';
              if (e.createErrors !== false) {
                a +=
                  " { keyword: '" +
                  'required' +
                  "' , dataPath: (dataPath || '') + " +
                  e.errorPath +
                  ' , schemaPath: ' +
                  e.util.toQuotedString(l) +
                  " , params: { missingProperty: '" +
                  R +
                  "' } ";
                if (e.opts.messages !== false) {
                  a += " , message: '";
                  if (e.opts._errorDataPathProperty) {
                    a += 'is a required property';
                  } else {
                    a += "should have required property \\'" + R + "\\'";
                  }
                  a += "' ";
                }
                if (e.opts.verbose) {
                  a +=
                    ' , schema: validate.schema' +
                    n +
                    ' , parentSchema: validate.schema' +
                    e.schemaPath +
                    ' , data: ' +
                    f +
                    ' ';
                }
                a += ' } ';
              } else {
                a += ' {} ';
              }
              var O = a;
              a = F.pop();
              if (!e.compositeRule && u) {
                if (e.async) {
                  a += ' throw new ValidationError([' + O + ']); ';
                } else {
                  a += ' validate.errors = [' + O + ']; return false; ';
                }
              } else {
                a +=
                  ' var err = ' +
                  O +
                  ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
              }
              a += ' } else { ';
            }
          } else {
            if (w) {
              if (!h) {
                a += ' var ' + p + ' = validate.schema' + n + '; ';
              }
              var $ = 'i' + s,
                _ = 'schema' + s + '[' + $ + ']',
                R = "' + " + _ + " + '";
              if (e.opts._errorDataPathProperty) {
                e.errorPath = e.util.getPathExpr(S, _, e.opts.jsonPointers);
              }
              if (h) {
                a +=
                  ' if (' +
                  p +
                  ' && !Array.isArray(' +
                  p +
                  ')) {  var err =   ';
                if (e.createErrors !== false) {
                  a +=
                    " { keyword: '" +
                    'required' +
                    "' , dataPath: (dataPath || '') + " +
                    e.errorPath +
                    ' , schemaPath: ' +
                    e.util.toQuotedString(l) +
                    " , params: { missingProperty: '" +
                    R +
                    "' } ";
                  if (e.opts.messages !== false) {
                    a += " , message: '";
                    if (e.opts._errorDataPathProperty) {
                      a += 'is a required property';
                    } else {
                      a += "should have required property \\'" + R + "\\'";
                    }
                    a += "' ";
                  }
                  if (e.opts.verbose) {
                    a +=
                      ' , schema: validate.schema' +
                      n +
                      ' , parentSchema: validate.schema' +
                      e.schemaPath +
                      ' , data: ' +
                      f +
                      ' ';
                  }
                  a += ' } ';
                } else {
                  a += ' {} ';
                }
                a +=
                  ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; } else if (' +
                  p +
                  ' !== undefined) { ';
              }
              a +=
                ' for (var ' +
                $ +
                ' = 0; ' +
                $ +
                ' < ' +
                p +
                '.length; ' +
                $ +
                '++) { if (' +
                f +
                '[' +
                p +
                '[' +
                $ +
                ']] === undefined ';
              if (x) {
                a +=
                  ' || ! Object.prototype.hasOwnProperty.call(' +
                  f +
                  ', ' +
                  p +
                  '[' +
                  $ +
                  ']) ';
              }
              a += ') {  var err =   ';
              if (e.createErrors !== false) {
                a +=
                  " { keyword: '" +
                  'required' +
                  "' , dataPath: (dataPath || '') + " +
                  e.errorPath +
                  ' , schemaPath: ' +
                  e.util.toQuotedString(l) +
                  " , params: { missingProperty: '" +
                  R +
                  "' } ";
                if (e.opts.messages !== false) {
                  a += " , message: '";
                  if (e.opts._errorDataPathProperty) {
                    a += 'is a required property';
                  } else {
                    a += "should have required property \\'" + R + "\\'";
                  }
                  a += "' ";
                }
                if (e.opts.verbose) {
                  a +=
                    ' , schema: validate.schema' +
                    n +
                    ' , parentSchema: validate.schema' +
                    e.schemaPath +
                    ' , data: ' +
                    f +
                    ' ';
                }
                a += ' } ';
              } else {
                a += ' {} ';
              }
              a +=
                ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; } } ';
              if (h) {
                a += '  }  ';
              }
            } else {
              var A = m;
              if (A) {
                var j,
                  N = -1,
                  T = A.length - 1;
                while (N < T) {
                  j = A[(N += 1)];
                  var k = e.util.getProperty(j),
                    R = e.util.escapeQuotes(j),
                    C = f + k;
                  if (e.opts._errorDataPathProperty) {
                    e.errorPath = e.util.getPath(S, j, e.opts.jsonPointers);
                  }
                  a += ' if ( ' + C + ' === undefined ';
                  if (x) {
                    a +=
                      ' || ! Object.prototype.hasOwnProperty.call(' +
                      f +
                      ", '" +
                      e.util.escapeQuotes(j) +
                      "') ";
                  }
                  a += ') {  var err =   ';
                  if (e.createErrors !== false) {
                    a +=
                      " { keyword: '" +
                      'required' +
                      "' , dataPath: (dataPath || '') + " +
                      e.errorPath +
                      ' , schemaPath: ' +
                      e.util.toQuotedString(l) +
                      " , params: { missingProperty: '" +
                      R +
                      "' } ";
                    if (e.opts.messages !== false) {
                      a += " , message: '";
                      if (e.opts._errorDataPathProperty) {
                        a += 'is a required property';
                      } else {
                        a += "should have required property \\'" + R + "\\'";
                      }
                      a += "' ";
                    }
                    if (e.opts.verbose) {
                      a +=
                        ' , schema: validate.schema' +
                        n +
                        ' , parentSchema: validate.schema' +
                        e.schemaPath +
                        ' , data: ' +
                        f +
                        ' ';
                    }
                    a += ' } ';
                  } else {
                    a += ' {} ';
                  }
                  a +=
                    ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; } ';
                }
              }
            }
          }
          e.errorPath = S;
        } else if (u) {
          a += ' if (true) {';
        }
        return a;
      };
    },
    6266: (e) => {
      'use strict';
      e.exports = function generate_uniqueItems(e, r, t) {
        var a = ' ';
        var s = e.level;
        var i = e.dataLevel;
        var o = e.schema[r];
        var n = e.schemaPath + e.util.getProperty(r);
        var l = e.errSchemaPath + '/' + r;
        var u = !e.opts.allErrors;
        var f = 'data' + (i || '');
        var c = 'valid' + s;
        var h = e.opts.$data && o && o.$data,
          d;
        if (h) {
          a +=
            ' var schema' +
            s +
            ' = ' +
            e.util.getData(o.$data, i, e.dataPathArr) +
            '; ';
          d = 'schema' + s;
        } else {
          d = o;
        }
        if ((o || h) && e.opts.uniqueItems !== false) {
          if (h) {
            a +=
              ' var ' +
              c +
              '; if (' +
              d +
              ' === false || ' +
              d +
              ' === undefined) ' +
              c +
              ' = true; else if (typeof ' +
              d +
              " != 'boolean') " +
              c +
              ' = false; else { ';
          }
          a +=
            ' var i = ' + f + '.length , ' + c + ' = true , j; if (i > 1) { ';
          var p = e.schema.items && e.schema.items.type,
            m = Array.isArray(p);
          if (
            !p ||
            p == 'object' ||
            p == 'array' ||
            (m && (p.indexOf('object') >= 0 || p.indexOf('array') >= 0))
          ) {
            a +=
              ' outer: for (;i--;) { for (j = i; j--;) { if (equal(' +
              f +
              '[i], ' +
              f +
              '[j])) { ' +
              c +
              ' = false; break outer; } } } ';
          } else {
            a +=
              ' var itemIndices = {}, item; for (;i--;) { var item = ' +
              f +
              '[i]; ';
            var g = 'checkDataType' + (m ? 's' : '');
            a +=
              ' if (' +
              e.util[g](p, 'item', e.opts.strictNumbers, true) +
              ') continue; ';
            if (m) {
              a += " if (typeof item == 'string') item = '\"' + item; ";
            }
            a +=
              " if (typeof itemIndices[item] == 'number') { " +
              c +
              ' = false; j = itemIndices[item]; break; } itemIndices[item] = i; } ';
          }
          a += ' } ';
          if (h) {
            a += '  }  ';
          }
          a += ' if (!' + c + ') {   ';
          var y = y || [];
          y.push(a);
          a = '';
          if (e.createErrors !== false) {
            a +=
              " { keyword: '" +
              'uniqueItems' +
              "' , dataPath: (dataPath || '') + " +
              e.errorPath +
              ' , schemaPath: ' +
              e.util.toQuotedString(l) +
              ' , params: { i: i, j: j } ';
            if (e.opts.messages !== false) {
              a +=
                " , message: 'should NOT have duplicate items (items ## ' + j + ' and ' + i + ' are identical)' ";
            }
            if (e.opts.verbose) {
              a += ' , schema:  ';
              if (h) {
                a += 'validate.schema' + n;
              } else {
                a += '' + o;
              }
              a +=
                '         , parentSchema: validate.schema' +
                e.schemaPath +
                ' , data: ' +
                f +
                ' ';
            }
            a += ' } ';
          } else {
            a += ' {} ';
          }
          var P = a;
          a = y.pop();
          if (!e.compositeRule && u) {
            if (e.async) {
              a += ' throw new ValidationError([' + P + ']); ';
            } else {
              a += ' validate.errors = [' + P + ']; return false; ';
            }
          } else {
            a +=
              ' var err = ' +
              P +
              ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
          }
          a += ' } ';
          if (u) {
            a += ' else { ';
          }
        } else {
          if (u) {
            a += ' if (true) { ';
          }
        }
        return a;
      };
    },
    2801: (e) => {
      'use strict';
      e.exports = function generate_validate(e, r, t) {
        var a = '';
        var s = e.schema.$async === true,
          i = e.util.schemaHasRulesExcept(e.schema, e.RULES.all, '$ref'),
          o = e.self._getId(e.schema);
        if (e.opts.strictKeywords) {
          var n = e.util.schemaUnknownRules(e.schema, e.RULES.keywords);
          if (n) {
            var l = 'unknown keyword: ' + n;
            if (e.opts.strictKeywords === 'log') e.logger.warn(l);
            else throw new Error(l);
          }
        }
        if (e.isTop) {
          a += ' var validate = ';
          if (s) {
            e.async = true;
            a += 'async ';
          }
          a +=
            "function(data, dataPath, parentData, parentDataProperty, rootData) { 'use strict'; ";
          if (o && (e.opts.sourceCode || e.opts.processCode)) {
            a += ' ' + ('/*# sourceURL=' + o + ' */') + ' ';
          }
        }
        if (typeof e.schema == 'boolean' || !(i || e.schema.$ref)) {
          var r = 'false schema';
          var u = e.level;
          var f = e.dataLevel;
          var c = e.schema[r];
          var h = e.schemaPath + e.util.getProperty(r);
          var d = e.errSchemaPath + '/' + r;
          var p = !e.opts.allErrors;
          var m;
          var g = 'data' + (f || '');
          var y = 'valid' + u;
          if (e.schema === false) {
            if (e.isTop) {
              p = true;
            } else {
              a += ' var ' + y + ' = false; ';
            }
            var P = P || [];
            P.push(a);
            a = '';
            if (e.createErrors !== false) {
              a +=
                " { keyword: '" +
                (m || 'false schema') +
                "' , dataPath: (dataPath || '') + " +
                e.errorPath +
                ' , schemaPath: ' +
                e.util.toQuotedString(d) +
                ' , params: {} ';
              if (e.opts.messages !== false) {
                a += " , message: 'boolean schema is false' ";
              }
              if (e.opts.verbose) {
                a +=
                  ' , schema: false , parentSchema: validate.schema' +
                  e.schemaPath +
                  ' , data: ' +
                  g +
                  ' ';
              }
              a += ' } ';
            } else {
              a += ' {} ';
            }
            var b = a;
            a = P.pop();
            if (!e.compositeRule && p) {
              if (e.async) {
                a += ' throw new ValidationError([' + b + ']); ';
              } else {
                a += ' validate.errors = [' + b + ']; return false; ';
              }
            } else {
              a +=
                ' var err = ' +
                b +
                ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
            }
          } else {
            if (e.isTop) {
              if (s) {
                a += ' return data; ';
              } else {
                a += ' validate.errors = null; return true; ';
              }
            } else {
              a += ' var ' + y + ' = true; ';
            }
          }
          if (e.isTop) {
            a += ' }; return validate; ';
          }
          return a;
        }
        if (e.isTop) {
          var E = e.isTop,
            u = (e.level = 0),
            f = (e.dataLevel = 0),
            g = 'data';
          e.rootId = e.resolve.fullPath(e.self._getId(e.root.schema));
          e.baseId = e.baseId || e.rootId;
          delete e.isTop;
          e.dataPathArr = [''];
          if (
            e.schema.default !== undefined &&
            e.opts.useDefaults &&
            e.opts.strictDefaults
          ) {
            var S = 'default is ignored in the schema root';
            if (e.opts.strictDefaults === 'log') e.logger.warn(S);
            else throw new Error(S);
          }
          a += ' var vErrors = null; ';
          a += ' var errors = 0;     ';
          a += ' if (rootData === undefined) rootData = data; ';
        } else {
          var u = e.level,
            f = e.dataLevel,
            g = 'data' + (f || '');
          if (o) e.baseId = e.resolve.url(e.baseId, o);
          if (s && !e.async) throw new Error('async schema in sync schema');
          a += ' var errs_' + u + ' = errors;';
        }
        var y = 'valid' + u,
          p = !e.opts.allErrors,
          w = '',
          x = '';
        var m;
        var $ = e.schema.type,
          _ = Array.isArray($);
        if ($ && e.opts.nullable && e.schema.nullable === true) {
          if (_) {
            if ($.indexOf('null') == -1) $ = $.concat('null');
          } else if ($ != 'null') {
            $ = [$, 'null'];
            _ = true;
          }
        }
        if (_ && $.length == 1) {
          $ = $[0];
          _ = false;
        }
        if (e.schema.$ref && i) {
          if (e.opts.extendRefs == 'fail') {
            throw new Error(
              '$ref: validation keywords used in schema at path "' +
                e.errSchemaPath +
                '" (see option extendRefs)',
            );
          } else if (e.opts.extendRefs !== true) {
            i = false;
            e.logger.warn(
              '$ref: keywords ignored in schema at path "' +
                e.errSchemaPath +
                '"',
            );
          }
        }
        if (e.schema.$comment && e.opts.$comment) {
          a += ' ' + e.RULES.all.$comment.code(e, '$comment');
        }
        if ($) {
          if (e.opts.coerceTypes) {
            var R = e.util.coerceToTypes(e.opts.coerceTypes, $);
          }
          var F = e.RULES.types[$];
          if (R || _ || F === true || (F && !$shouldUseGroup(F))) {
            var h = e.schemaPath + '.type',
              d = e.errSchemaPath + '/type';
            var h = e.schemaPath + '.type',
              d = e.errSchemaPath + '/type',
              O = _ ? 'checkDataTypes' : 'checkDataType';
            a += ' if (' + e.util[O]($, g, e.opts.strictNumbers, true) + ') { ';
            if (R) {
              var D = 'dataType' + u,
                j = 'coerced' + u;
              a +=
                ' var ' +
                D +
                ' = typeof ' +
                g +
                '; var ' +
                j +
                ' = undefined; ';
              if (e.opts.coerceTypes == 'array') {
                a +=
                  ' if (' +
                  D +
                  " == 'object' && Array.isArray(" +
                  g +
                  ') && ' +
                  g +
                  '.length == 1) { ' +
                  g +
                  ' = ' +
                  g +
                  '[0]; ' +
                  D +
                  ' = typeof ' +
                  g +
                  '; if (' +
                  e.util.checkDataType(e.schema.type, g, e.opts.strictNumbers) +
                  ') ' +
                  j +
                  ' = ' +
                  g +
                  '; } ';
              }
              a += ' if (' + j + ' !== undefined) ; ';
              var I = R;
              if (I) {
                var k,
                  C = -1,
                  A = I.length - 1;
                while (C < A) {
                  k = I[(C += 1)];
                  if (k == 'string') {
                    a +=
                      ' else if (' +
                      D +
                      " == 'number' || " +
                      D +
                      " == 'boolean') " +
                      j +
                      " = '' + " +
                      g +
                      '; else if (' +
                      g +
                      ' === null) ' +
                      j +
                      " = ''; ";
                  } else if (k == 'number' || k == 'integer') {
                    a +=
                      ' else if (' +
                      D +
                      " == 'boolean' || " +
                      g +
                      ' === null || (' +
                      D +
                      " == 'string' && " +
                      g +
                      ' && ' +
                      g +
                      ' == +' +
                      g +
                      ' ';
                    if (k == 'integer') {
                      a += ' && !(' + g + ' % 1)';
                    }
                    a += ')) ' + j + ' = +' + g + '; ';
                  } else if (k == 'boolean') {
                    a +=
                      ' else if (' +
                      g +
                      " === 'false' || " +
                      g +
                      ' === 0 || ' +
                      g +
                      ' === null) ' +
                      j +
                      ' = false; else if (' +
                      g +
                      " === 'true' || " +
                      g +
                      ' === 1) ' +
                      j +
                      ' = true; ';
                  } else if (k == 'null') {
                    a +=
                      ' else if (' +
                      g +
                      " === '' || " +
                      g +
                      ' === 0 || ' +
                      g +
                      ' === false) ' +
                      j +
                      ' = null; ';
                  } else if (e.opts.coerceTypes == 'array' && k == 'array') {
                    a +=
                      ' else if (' +
                      D +
                      " == 'string' || " +
                      D +
                      " == 'number' || " +
                      D +
                      " == 'boolean' || " +
                      g +
                      ' == null) ' +
                      j +
                      ' = [' +
                      g +
                      ']; ';
                  }
                }
              }
              a += ' else {   ';
              var P = P || [];
              P.push(a);
              a = '';
              if (e.createErrors !== false) {
                a +=
                  " { keyword: '" +
                  (m || 'type') +
                  "' , dataPath: (dataPath || '') + " +
                  e.errorPath +
                  ' , schemaPath: ' +
                  e.util.toQuotedString(d) +
                  " , params: { type: '";
                if (_) {
                  a += '' + $.join(',');
                } else {
                  a += '' + $;
                }
                a += "' } ";
                if (e.opts.messages !== false) {
                  a += " , message: 'should be ";
                  if (_) {
                    a += '' + $.join(',');
                  } else {
                    a += '' + $;
                  }
                  a += "' ";
                }
                if (e.opts.verbose) {
                  a +=
                    ' , schema: validate.schema' +
                    h +
                    ' , parentSchema: validate.schema' +
                    e.schemaPath +
                    ' , data: ' +
                    g +
                    ' ';
                }
                a += ' } ';
              } else {
                a += ' {} ';
              }
              var b = a;
              a = P.pop();
              if (!e.compositeRule && p) {
                if (e.async) {
                  a += ' throw new ValidationError([' + b + ']); ';
                } else {
                  a += ' validate.errors = [' + b + ']; return false; ';
                }
              } else {
                a +=
                  ' var err = ' +
                  b +
                  ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
              }
              a += ' } if (' + j + ' !== undefined) {  ';
              var N = f ? 'data' + (f - 1 || '') : 'parentData',
                T = f ? e.dataPathArr[f] : 'parentDataProperty';
              a += ' ' + g + ' = ' + j + '; ';
              if (!f) {
                a += 'if (' + N + ' !== undefined)';
              }
              a += ' ' + N + '[' + T + '] = ' + j + '; } ';
            } else {
              var P = P || [];
              P.push(a);
              a = '';
              if (e.createErrors !== false) {
                a +=
                  " { keyword: '" +
                  (m || 'type') +
                  "' , dataPath: (dataPath || '') + " +
                  e.errorPath +
                  ' , schemaPath: ' +
                  e.util.toQuotedString(d) +
                  " , params: { type: '";
                if (_) {
                  a += '' + $.join(',');
                } else {
                  a += '' + $;
                }
                a += "' } ";
                if (e.opts.messages !== false) {
                  a += " , message: 'should be ";
                  if (_) {
                    a += '' + $.join(',');
                  } else {
                    a += '' + $;
                  }
                  a += "' ";
                }
                if (e.opts.verbose) {
                  a +=
                    ' , schema: validate.schema' +
                    h +
                    ' , parentSchema: validate.schema' +
                    e.schemaPath +
                    ' , data: ' +
                    g +
                    ' ';
                }
                a += ' } ';
              } else {
                a += ' {} ';
              }
              var b = a;
              a = P.pop();
              if (!e.compositeRule && p) {
                if (e.async) {
                  a += ' throw new ValidationError([' + b + ']); ';
                } else {
                  a += ' validate.errors = [' + b + ']; return false; ';
                }
              } else {
                a +=
                  ' var err = ' +
                  b +
                  ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
              }
            }
            a += ' } ';
          }
        }
        if (e.schema.$ref && !i) {
          a += ' ' + e.RULES.all.$ref.code(e, '$ref') + ' ';
          if (p) {
            a += ' } if (errors === ';
            if (E) {
              a += '0';
            } else {
              a += 'errs_' + u;
            }
            a += ') { ';
            x += '}';
          }
        } else {
          var L = e.RULES;
          if (L) {
            var F,
              q = -1,
              z = L.length - 1;
            while (q < z) {
              F = L[(q += 1)];
              if ($shouldUseGroup(F)) {
                if (F.type) {
                  a +=
                    ' if (' +
                    e.util.checkDataType(F.type, g, e.opts.strictNumbers) +
                    ') { ';
                }
                if (e.opts.useDefaults) {
                  if (F.type == 'object' && e.schema.properties) {
                    var c = e.schema.properties,
                      M = Object.keys(c);
                    var U = M;
                    if (U) {
                      var V,
                        Q = -1,
                        K = U.length - 1;
                      while (Q < K) {
                        V = U[(Q += 1)];
                        var H = c[V];
                        if (H.default !== undefined) {
                          var J = g + e.util.getProperty(V);
                          if (e.compositeRule) {
                            if (e.opts.strictDefaults) {
                              var S = 'default is ignored for: ' + J;
                              if (e.opts.strictDefaults === 'log')
                                e.logger.warn(S);
                              else throw new Error(S);
                            }
                          } else {
                            a += ' if (' + J + ' === undefined ';
                            if (e.opts.useDefaults == 'empty') {
                              a +=
                                ' || ' + J + ' === null || ' + J + " === '' ";
                            }
                            a += ' ) ' + J + ' = ';
                            if (e.opts.useDefaults == 'shared') {
                              a += ' ' + e.useDefault(H.default) + ' ';
                            } else {
                              a += ' ' + JSON.stringify(H.default) + ' ';
                            }
                            a += '; ';
                          }
                        }
                      }
                    }
                  } else if (
                    F.type == 'array' &&
                    Array.isArray(e.schema.items)
                  ) {
                    var B = e.schema.items;
                    if (B) {
                      var H,
                        C = -1,
                        Z = B.length - 1;
                      while (C < Z) {
                        H = B[(C += 1)];
                        if (H.default !== undefined) {
                          var J = g + '[' + C + ']';
                          if (e.compositeRule) {
                            if (e.opts.strictDefaults) {
                              var S = 'default is ignored for: ' + J;
                              if (e.opts.strictDefaults === 'log')
                                e.logger.warn(S);
                              else throw new Error(S);
                            }
                          } else {
                            a += ' if (' + J + ' === undefined ';
                            if (e.opts.useDefaults == 'empty') {
                              a +=
                                ' || ' + J + ' === null || ' + J + " === '' ";
                            }
                            a += ' ) ' + J + ' = ';
                            if (e.opts.useDefaults == 'shared') {
                              a += ' ' + e.useDefault(H.default) + ' ';
                            } else {
                              a += ' ' + JSON.stringify(H.default) + ' ';
                            }
                            a += '; ';
                          }
                        }
                      }
                    }
                  }
                }
                var G = F.rules;
                if (G) {
                  var Y,
                    W = -1,
                    X = G.length - 1;
                  while (W < X) {
                    Y = G[(W += 1)];
                    if ($shouldUseRule(Y)) {
                      var ee = Y.code(e, Y.keyword, F.type);
                      if (ee) {
                        a += ' ' + ee + ' ';
                        if (p) {
                          w += '}';
                        }
                      }
                    }
                  }
                }
                if (p) {
                  a += ' ' + w + ' ';
                  w = '';
                }
                if (F.type) {
                  a += ' } ';
                  if ($ && $ === F.type && !R) {
                    a += ' else { ';
                    var h = e.schemaPath + '.type',
                      d = e.errSchemaPath + '/type';
                    var P = P || [];
                    P.push(a);
                    a = '';
                    if (e.createErrors !== false) {
                      a +=
                        " { keyword: '" +
                        (m || 'type') +
                        "' , dataPath: (dataPath || '') + " +
                        e.errorPath +
                        ' , schemaPath: ' +
                        e.util.toQuotedString(d) +
                        " , params: { type: '";
                      if (_) {
                        a += '' + $.join(',');
                      } else {
                        a += '' + $;
                      }
                      a += "' } ";
                      if (e.opts.messages !== false) {
                        a += " , message: 'should be ";
                        if (_) {
                          a += '' + $.join(',');
                        } else {
                          a += '' + $;
                        }
                        a += "' ";
                      }
                      if (e.opts.verbose) {
                        a +=
                          ' , schema: validate.schema' +
                          h +
                          ' , parentSchema: validate.schema' +
                          e.schemaPath +
                          ' , data: ' +
                          g +
                          ' ';
                      }
                      a += ' } ';
                    } else {
                      a += ' {} ';
                    }
                    var b = a;
                    a = P.pop();
                    if (!e.compositeRule && p) {
                      if (e.async) {
                        a += ' throw new ValidationError([' + b + ']); ';
                      } else {
                        a += ' validate.errors = [' + b + ']; return false; ';
                      }
                    } else {
                      a +=
                        ' var err = ' +
                        b +
                        ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
                    }
                    a += ' } ';
                  }
                }
                if (p) {
                  a += ' if (errors === ';
                  if (E) {
                    a += '0';
                  } else {
                    a += 'errs_' + u;
                  }
                  a += ') { ';
                  x += '}';
                }
              }
            }
          }
        }
        if (p) {
          a += ' ' + x + ' ';
        }
        if (E) {
          if (s) {
            a += ' if (errors === 0) return data;           ';
            a += ' else throw new ValidationError(vErrors); ';
          } else {
            a += ' validate.errors = vErrors; ';
            a += ' return errors === 0;       ';
          }
          a += ' }; return validate;';
        } else {
          a += ' var ' + y + ' = errors === errs_' + u + ';';
        }
        function $shouldUseGroup(e) {
          var r = e.rules;
          for (var t = 0; t < r.length; t++)
            if ($shouldUseRule(r[t])) return true;
        }
        function $shouldUseRule(r) {
          return (
            e.schema[r.keyword] !== undefined ||
            (r.implements && $ruleImplementsSomeKeyword(r))
          );
        }
        function $ruleImplementsSomeKeyword(r) {
          var t = r.implements;
          for (var a = 0; a < t.length; a++)
            if (e.schema[t[a]] !== undefined) return true;
        }
        return a;
      };
    },
    398: (e, r, t) => {
      'use strict';
      var a = /^[a-z_$][a-z0-9_$-]*$/i;
      var s = t(9481);
      var i = t(7125);
      e.exports = {
        add: addKeyword,
        get: getKeyword,
        remove: removeKeyword,
        validate: validateKeyword,
      };
      function addKeyword(e, r) {
        var t = this.RULES;
        if (t.keywords[e])
          throw new Error('Keyword ' + e + ' is already defined');
        if (!a.test(e))
          throw new Error('Keyword ' + e + ' is not a valid identifier');
        if (r) {
          this.validateKeyword(r, true);
          var i = r.type;
          if (Array.isArray(i)) {
            for (var o = 0; o < i.length; o++) _addRule(e, i[o], r);
          } else {
            _addRule(e, i, r);
          }
          var n = r.metaSchema;
          if (n) {
            if (r.$data && this._opts.$data) {
              n = {
                anyOf: [
                  n,
                  {
                    $ref: 'https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#',
                  },
                ],
              };
            }
            r.validateSchema = this.compile(n, true);
          }
        }
        t.keywords[e] = t.all[e] = true;
        function _addRule(e, r, a) {
          var i;
          for (var o = 0; o < t.length; o++) {
            var n = t[o];
            if (n.type == r) {
              i = n;
              break;
            }
          }
          if (!i) {
            i = { type: r, rules: [] };
            t.push(i);
          }
          var l = {
            keyword: e,
            definition: a,
            custom: true,
            code: s,
            implements: a.implements,
          };
          i.rules.push(l);
          t.custom[e] = l;
        }
        return this;
      }
      function getKeyword(e) {
        var r = this.RULES.custom[e];
        return r ? r.definition : this.RULES.keywords[e] || false;
      }
      function removeKeyword(e) {
        var r = this.RULES;
        delete r.keywords[e];
        delete r.all[e];
        delete r.custom[e];
        for (var t = 0; t < r.length; t++) {
          var a = r[t].rules;
          for (var s = 0; s < a.length; s++) {
            if (a[s].keyword == e) {
              a.splice(s, 1);
              break;
            }
          }
        }
        return this;
      }
      function validateKeyword(e, r) {
        validateKeyword.errors = null;
        var t = (this._validateKeyword =
          this._validateKeyword || this.compile(i, true));
        if (t(e)) return true;
        validateKeyword.errors = t.errors;
        if (r)
          throw new Error(
            'custom keyword definition is invalid: ' +
              this.errorsText(t.errors),
          );
        else return false;
      }
    },
    7447: (e) => {
      'use strict';
      e.exports = function equal(e, r) {
        if (e === r) return true;
        if (e && r && typeof e == 'object' && typeof r == 'object') {
          if (e.constructor !== r.constructor) return false;
          var t, a, s;
          if (Array.isArray(e)) {
            t = e.length;
            if (t != r.length) return false;
            for (a = t; a-- !== 0; ) if (!equal(e[a], r[a])) return false;
            return true;
          }
          if (e.constructor === RegExp)
            return e.source === r.source && e.flags === r.flags;
          if (e.valueOf !== Object.prototype.valueOf)
            return e.valueOf() === r.valueOf();
          if (e.toString !== Object.prototype.toString)
            return e.toString() === r.toString();
          s = Object.keys(e);
          t = s.length;
          if (t !== Object.keys(r).length) return false;
          for (a = t; a-- !== 0; )
            if (!Object.prototype.hasOwnProperty.call(r, s[a])) return false;
          for (a = t; a-- !== 0; ) {
            var i = s[a];
            if (!equal(e[i], r[i])) return false;
          }
          return true;
        }
        return e !== e && r !== r;
      };
    },
    7351: (e) => {
      'use strict';
      e.exports = function (e, r) {
        if (!r) r = {};
        if (typeof r === 'function') r = { cmp: r };
        var t = typeof r.cycles === 'boolean' ? r.cycles : false;
        var a =
          r.cmp &&
          (function (e) {
            return function (r) {
              return function (t, a) {
                var s = { key: t, value: r[t] };
                var i = { key: a, value: r[a] };
                return e(s, i);
              };
            };
          })(r.cmp);
        var s = [];
        return (function stringify(e) {
          if (e && e.toJSON && typeof e.toJSON === 'function') {
            e = e.toJSON();
          }
          if (e === undefined) return;
          if (typeof e == 'number') return isFinite(e) ? '' + e : 'null';
          if (typeof e !== 'object') return JSON.stringify(e);
          var r, i;
          if (Array.isArray(e)) {
            i = '[';
            for (r = 0; r < e.length; r++) {
              if (r) i += ',';
              i += stringify(e[r]) || 'null';
            }
            return i + ']';
          }
          if (e === null) return 'null';
          if (s.indexOf(e) !== -1) {
            if (t) return JSON.stringify('__cycle__');
            throw new TypeError('Converting circular structure to JSON');
          }
          var o = s.push(e) - 1;
          var n = Object.keys(e).sort(a && a(e));
          i = '';
          for (r = 0; r < n.length; r++) {
            var l = n[r];
            var u = stringify(e[l]);
            if (!u) continue;
            if (i) i += ',';
            i += JSON.stringify(l) + ':' + u;
          }
          s.splice(o, 1);
          return '{' + i + '}';
        })(e);
      };
    },
    4432: (e) => {
      'use strict';
      var r = (e.exports = function (e, r, t) {
        if (typeof r == 'function') {
          t = r;
          r = {};
        }
        t = r.cb || t;
        var a = typeof t == 'function' ? t : t.pre || function () {};
        var s = t.post || function () {};
        _traverse(r, a, s, e, '', e);
      });
      r.keywords = {
        additionalItems: true,
        items: true,
        contains: true,
        additionalProperties: true,
        propertyNames: true,
        not: true,
      };
      r.arrayKeywords = { items: true, allOf: true, anyOf: true, oneOf: true };
      r.propsKeywords = {
        definitions: true,
        properties: true,
        patternProperties: true,
        dependencies: true,
      };
      r.skipKeywords = {
        default: true,
        enum: true,
        const: true,
        required: true,
        maximum: true,
        minimum: true,
        exclusiveMaximum: true,
        exclusiveMinimum: true,
        multipleOf: true,
        maxLength: true,
        minLength: true,
        pattern: true,
        format: true,
        maxItems: true,
        minItems: true,
        uniqueItems: true,
        maxProperties: true,
        minProperties: true,
      };
      function _traverse(e, t, a, s, i, o, n, l, u, f) {
        if (s && typeof s == 'object' && !Array.isArray(s)) {
          t(s, i, o, n, l, u, f);
          for (var c in s) {
            var h = s[c];
            if (Array.isArray(h)) {
              if (c in r.arrayKeywords) {
                for (var d = 0; d < h.length; d++)
                  _traverse(
                    e,
                    t,
                    a,
                    h[d],
                    i + '/' + c + '/' + d,
                    o,
                    i,
                    c,
                    s,
                    d,
                  );
              }
            } else if (c in r.propsKeywords) {
              if (h && typeof h == 'object') {
                for (var p in h)
                  _traverse(
                    e,
                    t,
                    a,
                    h[p],
                    i + '/' + c + '/' + escapeJsonPtr(p),
                    o,
                    i,
                    c,
                    s,
                    p,
                  );
              }
            } else if (
              c in r.keywords ||
              (e.allKeys && !(c in r.skipKeywords))
            ) {
              _traverse(e, t, a, h, i + '/' + c, o, i, c, s);
            }
          }
          a(s, i, o, n, l, u, f);
        }
      }
      function escapeJsonPtr(e) {
        return e.replace(/~/g, '~0').replace(/\//g, '~1');
      }
    },
    5826: (e, r, t) => {
      'use strict';
      Object.defineProperty(r, '__esModule', { value: true });
      r['default'] = void 0;
      const { stringHints: a, numberHints: s } = t(544);
      const i = {
        type: 1,
        not: 1,
        oneOf: 1,
        anyOf: 1,
        if: 1,
        enum: 1,
        const: 1,
        instanceof: 1,
        required: 2,
        pattern: 2,
        patternRequired: 2,
        format: 2,
        formatMinimum: 2,
        formatMaximum: 2,
        minimum: 2,
        exclusiveMinimum: 2,
        maximum: 2,
        exclusiveMaximum: 2,
        multipleOf: 2,
        uniqueItems: 2,
        contains: 2,
        minLength: 2,
        maxLength: 2,
        minItems: 2,
        maxItems: 2,
        minProperties: 2,
        maxProperties: 2,
        dependencies: 2,
        propertyNames: 2,
        additionalItems: 2,
        additionalProperties: 2,
        absolutePath: 2,
      };
      function filterMax(e, r) {
        const t = e.reduce((e, t) => Math.max(e, r(t)), 0);
        return e.filter((e) => r(e) === t);
      }
      function filterChildren(e) {
        let r = e;
        r = filterMax(r, (e) => (e.dataPath ? e.dataPath.length : 0));
        r = filterMax(r, (e) => i[e.keyword] || 2);
        return r;
      }
      function findAllChildren(e, r) {
        let t = e.length - 1;
        const predicate = (r) => e[t].schemaPath.indexOf(r) !== 0;
        while (t > -1 && !r.every(predicate)) {
          if (e[t].keyword === 'anyOf' || e[t].keyword === 'oneOf') {
            const r = extractRefs(e[t]);
            const a = findAllChildren(e.slice(0, t), r.concat(e[t].schemaPath));
            t = a - 1;
          } else {
            t -= 1;
          }
        }
        return t + 1;
      }
      function extractRefs(e) {
        const { schema: r } = e;
        if (!Array.isArray(r)) {
          return [];
        }
        return r.map(({ $ref: e }) => e).filter((e) => e);
      }
      function groupChildrenByFirstChild(e) {
        const r = [];
        let t = e.length - 1;
        while (t > 0) {
          const a = e[t];
          if (a.keyword === 'anyOf' || a.keyword === 'oneOf') {
            const s = extractRefs(a);
            const i = findAllChildren(e.slice(0, t), s.concat(a.schemaPath));
            if (i !== t) {
              r.push(Object.assign({}, a, { children: e.slice(i, t) }));
              t = i;
            } else {
              r.push(a);
            }
          } else {
            r.push(a);
          }
          t -= 1;
        }
        if (t === 0) {
          r.push(e[t]);
        }
        return r.reverse();
      }
      function indent(e, r) {
        return e.replace(/\n(?!$)/g, `\n${r}`);
      }
      function hasNotInSchema(e) {
        return !!e.not;
      }
      function findFirstTypedSchema(e) {
        if (hasNotInSchema(e)) {
          return findFirstTypedSchema(e.not);
        }
        return e;
      }
      function canApplyNot(e) {
        const r = findFirstTypedSchema(e);
        return (
          likeNumber(r) ||
          likeInteger(r) ||
          likeString(r) ||
          likeNull(r) ||
          likeBoolean(r)
        );
      }
      function isObject(e) {
        return typeof e === 'object' && e !== null;
      }
      function likeNumber(e) {
        return (
          e.type === 'number' ||
          typeof e.minimum !== 'undefined' ||
          typeof e.exclusiveMinimum !== 'undefined' ||
          typeof e.maximum !== 'undefined' ||
          typeof e.exclusiveMaximum !== 'undefined' ||
          typeof e.multipleOf !== 'undefined'
        );
      }
      function likeInteger(e) {
        return (
          e.type === 'integer' ||
          typeof e.minimum !== 'undefined' ||
          typeof e.exclusiveMinimum !== 'undefined' ||
          typeof e.maximum !== 'undefined' ||
          typeof e.exclusiveMaximum !== 'undefined' ||
          typeof e.multipleOf !== 'undefined'
        );
      }
      function likeString(e) {
        return (
          e.type === 'string' ||
          typeof e.minLength !== 'undefined' ||
          typeof e.maxLength !== 'undefined' ||
          typeof e.pattern !== 'undefined' ||
          typeof e.format !== 'undefined' ||
          typeof e.formatMinimum !== 'undefined' ||
          typeof e.formatMaximum !== 'undefined'
        );
      }
      function likeBoolean(e) {
        return e.type === 'boolean';
      }
      function likeArray(e) {
        return (
          e.type === 'array' ||
          typeof e.minItems === 'number' ||
          typeof e.maxItems === 'number' ||
          typeof e.uniqueItems !== 'undefined' ||
          typeof e.items !== 'undefined' ||
          typeof e.additionalItems !== 'undefined' ||
          typeof e.contains !== 'undefined'
        );
      }
      function likeObject(e) {
        return (
          e.type === 'object' ||
          typeof e.minProperties !== 'undefined' ||
          typeof e.maxProperties !== 'undefined' ||
          typeof e.required !== 'undefined' ||
          typeof e.properties !== 'undefined' ||
          typeof e.patternProperties !== 'undefined' ||
          typeof e.additionalProperties !== 'undefined' ||
          typeof e.dependencies !== 'undefined' ||
          typeof e.propertyNames !== 'undefined' ||
          typeof e.patternRequired !== 'undefined'
        );
      }
      function likeNull(e) {
        return e.type === 'null';
      }
      function getArticle(e) {
        if (/^[aeiou]/i.test(e)) {
          return 'an';
        }
        return 'a';
      }
      function getSchemaNonTypes(e) {
        if (!e) {
          return '';
        }
        if (!e.type) {
          if (likeNumber(e) || likeInteger(e)) {
            return ' | should be any non-number';
          }
          if (likeString(e)) {
            return ' | should be any non-string';
          }
          if (likeArray(e)) {
            return ' | should be any non-array';
          }
          if (likeObject(e)) {
            return ' | should be any non-object';
          }
        }
        return '';
      }
      function formatHints(e) {
        return e.length > 0 ? `(${e.join(', ')})` : '';
      }
      function getHints(e, r) {
        if (likeNumber(e) || likeInteger(e)) {
          return s(e, r);
        } else if (likeString(e)) {
          return a(e, r);
        }
        return [];
      }
      class ValidationError extends Error {
        constructor(e, r, t = {}) {
          super();
          this.name = 'ValidationError';
          this.errors = e;
          this.schema = r;
          let a;
          let s;
          if (r.title && (!t.name || !t.baseDataPath)) {
            const e = r.title.match(/^(.+) (.+)$/);
            if (e) {
              if (!t.name) {
                [, a] = e;
              }
              if (!t.baseDataPath) {
                [, , s] = e;
              }
            }
          }
          this.headerName = t.name || a || 'Object';
          this.baseDataPath = t.baseDataPath || s || 'configuration';
          this.postFormatter = t.postFormatter || null;
          const i = `Invalid ${this.baseDataPath} object. ${
            this.headerName
          } has been initialized using ${getArticle(this.baseDataPath)} ${
            this.baseDataPath
          } object that does not match the API schema.\n`;
          this.message = `${i}${this.formatValidationErrors(e)}`;
          Error.captureStackTrace(this, this.constructor);
        }
        getSchemaPart(e) {
          const r = e.split('/');
          let t = this.schema;
          for (let e = 1; e < r.length; e++) {
            const a = t[r[e]];
            if (!a) {
              break;
            }
            t = a;
          }
          return t;
        }
        formatSchema(e, r = true, t = []) {
          let a = r;
          const formatInnerSchema = (r, s) => {
            if (!s) {
              return this.formatSchema(r, a, t);
            }
            if (t.includes(r)) {
              return '(recursive)';
            }
            return this.formatSchema(r, a, t.concat(e));
          };
          if (hasNotInSchema(e) && !likeObject(e)) {
            if (canApplyNot(e.not)) {
              a = !r;
              return formatInnerSchema(e.not);
            }
            const t = !e.not.not;
            const s = r ? '' : 'non ';
            a = !r;
            return t ? s + formatInnerSchema(e.not) : formatInnerSchema(e.not);
          }
          if (e.instanceof) {
            const { instanceof: r } = e;
            const t = !Array.isArray(r) ? [r] : r;
            return t
              .map((e) => (e === 'Function' ? 'function' : e))
              .join(' | ');
          }
          if (e.enum) {
            return e.enum.map((e) => JSON.stringify(e)).join(' | ');
          }
          if (typeof e.const !== 'undefined') {
            return JSON.stringify(e.const);
          }
          if (e.oneOf) {
            return e.oneOf.map((e) => formatInnerSchema(e, true)).join(' | ');
          }
          if (e.anyOf) {
            return e.anyOf.map((e) => formatInnerSchema(e, true)).join(' | ');
          }
          if (e.allOf) {
            return e.allOf.map((e) => formatInnerSchema(e, true)).join(' & ');
          }
          if (e.if) {
            const { if: r, then: t, else: a } = e;
            return `${r ? `if ${formatInnerSchema(r)}` : ''}${
              t ? ` then ${formatInnerSchema(t)}` : ''
            }${a ? ` else ${formatInnerSchema(a)}` : ''}`;
          }
          if (e.$ref) {
            return formatInnerSchema(this.getSchemaPart(e.$ref), true);
          }
          if (likeNumber(e) || likeInteger(e)) {
            const [t, ...a] = getHints(e, r);
            const s = `${t}${a.length > 0 ? ` ${formatHints(a)}` : ''}`;
            return r ? s : a.length > 0 ? `non-${t} | ${s}` : `non-${t}`;
          }
          if (likeString(e)) {
            const [t, ...a] = getHints(e, r);
            const s = `${t}${a.length > 0 ? ` ${formatHints(a)}` : ''}`;
            return r ? s : s === 'string' ? 'non-string' : `non-string | ${s}`;
          }
          if (likeBoolean(e)) {
            return `${r ? '' : 'non-'}boolean`;
          }
          if (likeArray(e)) {
            a = true;
            const r = [];
            if (typeof e.minItems === 'number') {
              r.push(
                `should not have fewer than ${e.minItems} item${
                  e.minItems > 1 ? 's' : ''
                }`,
              );
            }
            if (typeof e.maxItems === 'number') {
              r.push(
                `should not have more than ${e.maxItems} item${
                  e.maxItems > 1 ? 's' : ''
                }`,
              );
            }
            if (e.uniqueItems) {
              r.push('should not have duplicate items');
            }
            const t =
              typeof e.additionalItems === 'undefined' ||
              Boolean(e.additionalItems);
            let s = '';
            if (e.items) {
              if (Array.isArray(e.items) && e.items.length > 0) {
                s = `${e.items.map((e) => formatInnerSchema(e)).join(', ')}`;
                if (t) {
                  if (
                    e.additionalItems &&
                    isObject(e.additionalItems) &&
                    Object.keys(e.additionalItems).length > 0
                  ) {
                    r.push(
                      `additional items should be ${formatInnerSchema(
                        e.additionalItems,
                      )}`,
                    );
                  }
                }
              } else if (e.items && Object.keys(e.items).length > 0) {
                s = `${formatInnerSchema(e.items)}`;
              } else {
                s = 'any';
              }
            } else {
              s = 'any';
            }
            if (e.contains && Object.keys(e.contains).length > 0) {
              r.push(
                `should contains at least one ${this.formatSchema(
                  e.contains,
                )} item`,
              );
            }
            return `[${s}${t ? ', ...' : ''}]${
              r.length > 0 ? ` (${r.join(', ')})` : ''
            }`;
          }
          if (likeObject(e)) {
            a = true;
            const r = [];
            if (typeof e.minProperties === 'number') {
              r.push(
                `should not have fewer than ${e.minProperties} ${
                  e.minProperties > 1 ? 'properties' : 'property'
                }`,
              );
            }
            if (typeof e.maxProperties === 'number') {
              r.push(
                `should not have more than ${e.maxProperties} ${
                  e.minProperties && e.minProperties > 1
                    ? 'properties'
                    : 'property'
                }`,
              );
            }
            if (
              e.patternProperties &&
              Object.keys(e.patternProperties).length > 0
            ) {
              const t = Object.keys(e.patternProperties);
              r.push(
                `additional property names should match pattern${
                  t.length > 1 ? 's' : ''
                } ${t.map((e) => JSON.stringify(e)).join(' | ')}`,
              );
            }
            const t = e.properties ? Object.keys(e.properties) : [];
            const s = e.required ? e.required : [];
            const i = [...new Set([].concat(s).concat(t))];
            const o = i
              .map((e) => {
                const r = s.includes(e);
                return `${e}${r ? '' : '?'}`;
              })
              .concat(
                typeof e.additionalProperties === 'undefined' ||
                  Boolean(e.additionalProperties)
                  ? e.additionalProperties && isObject(e.additionalProperties)
                    ? [`<key>: ${formatInnerSchema(e.additionalProperties)}`]
                    : ['…']
                  : [],
              )
              .join(', ');
            const { dependencies: n, propertyNames: l, patternRequired: u } = e;
            if (n) {
              Object.keys(n).forEach((e) => {
                const t = n[e];
                if (Array.isArray(t)) {
                  r.push(
                    `should have ${t.length > 1 ? 'properties' : 'property'} ${t
                      .map((e) => `'${e}'`)
                      .join(', ')} when property '${e}' is present`,
                  );
                } else {
                  r.push(
                    `should be valid according to the schema ${formatInnerSchema(
                      t,
                    )} when property '${e}' is present`,
                  );
                }
              });
            }
            if (l && Object.keys(l).length > 0) {
              r.push(
                `each property name should match format ${JSON.stringify(
                  e.propertyNames.format,
                )}`,
              );
            }
            if (u && u.length > 0) {
              r.push(
                `should have property matching pattern ${u.map((e) =>
                  JSON.stringify(e),
                )}`,
              );
            }
            return `object {${o ? ` ${o} ` : ''}}${
              r.length > 0 ? ` (${r.join(', ')})` : ''
            }`;
          }
          if (likeNull(e)) {
            return `${r ? '' : 'non-'}null`;
          }
          if (Array.isArray(e.type)) {
            return `${e.type.join(' | ')}`;
          }
          return JSON.stringify(e, null, 2);
        }
        getSchemaPartText(e, r, t = false, a = true) {
          if (!e) {
            return '';
          }
          if (Array.isArray(r)) {
            for (let t = 0; t < r.length; t++) {
              const a = e[r[t]];
              if (a) {
                e = a;
              } else {
                break;
              }
            }
          }
          while (e.$ref) {
            e = this.getSchemaPart(e.$ref);
          }
          let s = `${this.formatSchema(e, a)}${t ? '.' : ''}`;
          if (e.description) {
            s += `\n-> ${e.description}`;
          }
          if (e.link) {
            s += `\n-> Read more at ${e.link}`;
          }
          return s;
        }
        getSchemaPartDescription(e) {
          if (!e) {
            return '';
          }
          while (e.$ref) {
            e = this.getSchemaPart(e.$ref);
          }
          let r = '';
          if (e.description) {
            r += `\n-> ${e.description}`;
          }
          if (e.link) {
            r += `\n-> Read more at ${e.link}`;
          }
          return r;
        }
        formatValidationError(e) {
          const { keyword: r, dataPath: t } = e;
          const a = `${this.baseDataPath}${t}`;
          switch (r) {
            case 'type': {
              const { parentSchema: r, params: t } = e;
              switch (t.type) {
                case 'number':
                  return `${a} should be a ${this.getSchemaPartText(
                    r,
                    false,
                    true,
                  )}`;
                case 'integer':
                  return `${a} should be an ${this.getSchemaPartText(
                    r,
                    false,
                    true,
                  )}`;
                case 'string':
                  return `${a} should be a ${this.getSchemaPartText(
                    r,
                    false,
                    true,
                  )}`;
                case 'boolean':
                  return `${a} should be a ${this.getSchemaPartText(
                    r,
                    false,
                    true,
                  )}`;
                case 'array':
                  return `${a} should be an array:\n${this.getSchemaPartText(
                    r,
                  )}`;
                case 'object':
                  return `${a} should be an object:\n${this.getSchemaPartText(
                    r,
                  )}`;
                case 'null':
                  return `${a} should be a ${this.getSchemaPartText(
                    r,
                    false,
                    true,
                  )}`;
                default:
                  return `${a} should be:\n${this.getSchemaPartText(r)}`;
              }
            }
            case 'instanceof': {
              const { parentSchema: r } = e;
              return `${a} should be an instance of ${this.getSchemaPartText(
                r,
                false,
                true,
              )}`;
            }
            case 'pattern': {
              const { params: r, parentSchema: t } = e;
              const { pattern: s } = r;
              return `${a} should match pattern ${JSON.stringify(
                s,
              )}${getSchemaNonTypes(t)}.${this.getSchemaPartDescription(t)}`;
            }
            case 'format': {
              const { params: r, parentSchema: t } = e;
              const { format: s } = r;
              return `${a} should match format ${JSON.stringify(
                s,
              )}${getSchemaNonTypes(t)}.${this.getSchemaPartDescription(t)}`;
            }
            case 'formatMinimum':
            case 'formatMaximum': {
              const { params: r, parentSchema: t } = e;
              const { comparison: s, limit: i } = r;
              return `${a} should be ${s} ${JSON.stringify(
                i,
              )}${getSchemaNonTypes(t)}.${this.getSchemaPartDescription(t)}`;
            }
            case 'minimum':
            case 'maximum':
            case 'exclusiveMinimum':
            case 'exclusiveMaximum': {
              const { parentSchema: r, params: t } = e;
              const { comparison: s, limit: i } = t;
              const [, ...o] = getHints(r, true);
              if (o.length === 0) {
                o.push(`should be ${s} ${i}`);
              }
              return `${a} ${o.join(' ')}${getSchemaNonTypes(
                r,
              )}.${this.getSchemaPartDescription(r)}`;
            }
            case 'multipleOf': {
              const { params: r, parentSchema: t } = e;
              const { multipleOf: s } = r;
              return `${a} should be multiple of ${s}${getSchemaNonTypes(
                t,
              )}.${this.getSchemaPartDescription(t)}`;
            }
            case 'patternRequired': {
              const { params: r, parentSchema: t } = e;
              const { missingPattern: s } = r;
              return `${a} should have property matching pattern ${JSON.stringify(
                s,
              )}${getSchemaNonTypes(t)}.${this.getSchemaPartDescription(t)}`;
            }
            case 'minLength': {
              const { params: r, parentSchema: t } = e;
              const { limit: s } = r;
              if (s === 1) {
                return `${a} should be a non-empty string${getSchemaNonTypes(
                  t,
                )}.${this.getSchemaPartDescription(t)}`;
              }
              const i = s - 1;
              return `${a} should be longer than ${i} character${
                i > 1 ? 's' : ''
              }${getSchemaNonTypes(t)}.${this.getSchemaPartDescription(t)}`;
            }
            case 'minItems': {
              const { params: r, parentSchema: t } = e;
              const { limit: s } = r;
              if (s === 1) {
                return `${a} should be a non-empty array${getSchemaNonTypes(
                  t,
                )}.${this.getSchemaPartDescription(t)}`;
              }
              return `${a} should not have fewer than ${s} items${getSchemaNonTypes(
                t,
              )}.${this.getSchemaPartDescription(t)}`;
            }
            case 'minProperties': {
              const { params: r, parentSchema: t } = e;
              const { limit: s } = r;
              if (s === 1) {
                return `${a} should be a non-empty object${getSchemaNonTypes(
                  t,
                )}.${this.getSchemaPartDescription(t)}`;
              }
              return `${a} should not have fewer than ${s} properties${getSchemaNonTypes(
                t,
              )}.${this.getSchemaPartDescription(t)}`;
            }
            case 'maxLength': {
              const { params: r, parentSchema: t } = e;
              const { limit: s } = r;
              const i = s + 1;
              return `${a} should be shorter than ${i} character${
                i > 1 ? 's' : ''
              }${getSchemaNonTypes(t)}.${this.getSchemaPartDescription(t)}`;
            }
            case 'maxItems': {
              const { params: r, parentSchema: t } = e;
              const { limit: s } = r;
              return `${a} should not have more than ${s} items${getSchemaNonTypes(
                t,
              )}.${this.getSchemaPartDescription(t)}`;
            }
            case 'maxProperties': {
              const { params: r, parentSchema: t } = e;
              const { limit: s } = r;
              return `${a} should not have more than ${s} properties${getSchemaNonTypes(
                t,
              )}.${this.getSchemaPartDescription(t)}`;
            }
            case 'uniqueItems': {
              const { params: r, parentSchema: t } = e;
              const { i: s } = r;
              return `${a} should not contain the item '${
                e.data[s]
              }' twice${getSchemaNonTypes(t)}.${this.getSchemaPartDescription(
                t,
              )}`;
            }
            case 'additionalItems': {
              const { params: r, parentSchema: t } = e;
              const { limit: s } = r;
              return `${a} should not have more than ${s} items${getSchemaNonTypes(
                t,
              )}. These items are valid:\n${this.getSchemaPartText(t)}`;
            }
            case 'contains': {
              const { parentSchema: r } = e;
              return `${a} should contains at least one ${this.getSchemaPartText(
                r,
                ['contains'],
              )} item${getSchemaNonTypes(r)}.`;
            }
            case 'required': {
              const { parentSchema: r, params: t } = e;
              const s = t.missingProperty.replace(/^\./, '');
              const i = r && Boolean(r.properties && r.properties[s]);
              return `${a} misses the property '${s}'${getSchemaNonTypes(r)}.${
                i
                  ? ` Should be:\n${this.getSchemaPartText(r, [
                      'properties',
                      s,
                    ])}`
                  : this.getSchemaPartDescription(r)
              }`;
            }
            case 'additionalProperties': {
              const { params: r, parentSchema: t } = e;
              const { additionalProperty: s } = r;
              return `${a} has an unknown property '${s}'${getSchemaNonTypes(
                t,
              )}. These properties are valid:\n${this.getSchemaPartText(t)}`;
            }
            case 'dependencies': {
              const { params: r, parentSchema: t } = e;
              const { property: s, deps: i } = r;
              const o = i
                .split(',')
                .map((e) => `'${e.trim()}'`)
                .join(', ');
              return `${a} should have properties ${o} when property '${s}' is present${getSchemaNonTypes(
                t,
              )}.${this.getSchemaPartDescription(t)}`;
            }
            case 'propertyNames': {
              const { params: r, parentSchema: t, schema: s } = e;
              const { propertyName: i } = r;
              return `${a} property name '${i}' is invalid${getSchemaNonTypes(
                t,
              )}. Property names should be match format ${JSON.stringify(
                s.format,
              )}.${this.getSchemaPartDescription(t)}`;
            }
            case 'enum': {
              const { parentSchema: r } = e;
              if (r && r.enum && r.enum.length === 1) {
                return `${a} should be ${this.getSchemaPartText(
                  r,
                  false,
                  true,
                )}`;
              }
              return `${a} should be one of these:\n${this.getSchemaPartText(
                r,
              )}`;
            }
            case 'const': {
              const { parentSchema: r } = e;
              return `${a} should be equal to constant ${this.getSchemaPartText(
                r,
                false,
                true,
              )}`;
            }
            case 'not': {
              const r = likeObject(e.parentSchema)
                ? `\n${this.getSchemaPartText(e.parentSchema)}`
                : '';
              const t = this.getSchemaPartText(e.schema, false, false, false);
              if (canApplyNot(e.schema)) {
                return `${a} should be any ${t}${r}.`;
              }
              const { schema: s, parentSchema: i } = e;
              return `${a} should not be ${this.getSchemaPartText(
                s,
                false,
                true,
              )}${i && likeObject(i) ? `\n${this.getSchemaPartText(i)}` : ''}`;
            }
            case 'oneOf':
            case 'anyOf': {
              const { parentSchema: r, children: t } = e;
              if (t && t.length > 0) {
                if (e.schema.length === 1) {
                  const e = t[t.length - 1];
                  const a = t.slice(0, t.length - 1);
                  return this.formatValidationError(
                    Object.assign({}, e, {
                      children: a,
                      parentSchema: Object.assign({}, r, e.parentSchema),
                    }),
                  );
                }
                let s = filterChildren(t);
                if (s.length === 1) {
                  return this.formatValidationError(s[0]);
                }
                s = groupChildrenByFirstChild(s);
                return `${a} should be one of these:\n${this.getSchemaPartText(
                  r,
                )}\nDetails:\n${s
                  .map(
                    (e) => ` * ${indent(this.formatValidationError(e), '   ')}`,
                  )
                  .join('\n')}`;
              }
              return `${a} should be one of these:\n${this.getSchemaPartText(
                r,
              )}`;
            }
            case 'if': {
              const { params: r, parentSchema: t } = e;
              const { failingKeyword: s } = r;
              return `${a} should match "${s}" schema:\n${this.getSchemaPartText(
                t,
                [s],
              )}`;
            }
            case 'absolutePath': {
              const { message: r, parentSchema: t } = e;
              return `${a}: ${r}${this.getSchemaPartDescription(t)}`;
            }
            default: {
              const { message: r, parentSchema: t } = e;
              const s = JSON.stringify(e, null, 2);
              return `${a} ${r} (${s}).\n${this.getSchemaPartText(t, false)}`;
            }
          }
        }
        formatValidationErrors(e) {
          return e
            .map((e) => {
              let r = this.formatValidationError(e);
              if (this.postFormatter) {
                r = this.postFormatter(r, e);
              }
              return ` - ${indent(r, '   ')}`;
            })
            .join('\n');
        }
      }
      var o = ValidationError;
      r['default'] = o;
    },
    1489: (e, r, t) => {
      'use strict';
      const { validate: a, ValidationError: s } = t(2121);
      e.exports = { validate: a, ValidationError: s };
    },
    9294: (e, r) => {
      'use strict';
      Object.defineProperty(r, '__esModule', { value: true });
      r['default'] = void 0;
      function errorMessage(e, r, t) {
        return {
          dataPath: undefined,
          schemaPath: undefined,
          keyword: 'absolutePath',
          params: { absolutePath: t },
          message: e,
          parentSchema: r,
        };
      }
      function getErrorFor(e, r, t) {
        const a = e
          ? `The provided value ${JSON.stringify(t)} is not an absolute path!`
          : `A relative path is expected. However, the provided value ${JSON.stringify(
              t,
            )} is an absolute path!`;
        return errorMessage(a, r, t);
      }
      function addAbsolutePathKeyword(e) {
        e.addKeyword('absolutePath', {
          errors: true,
          type: 'string',
          compile(e, r) {
            const callback = (t) => {
              let a = true;
              const s = t.includes('!');
              if (s) {
                callback.errors = [
                  errorMessage(
                    `The provided value ${JSON.stringify(
                      t,
                    )} contains exclamation mark (!) which is not allowed because it's reserved for loader syntax.`,
                    r,
                    t,
                  ),
                ];
                a = false;
              }
              const i = e === /^(?:[A-Za-z]:(\\|\/)|\\\\|\/)/.test(t);
              if (!i) {
                callback.errors = [getErrorFor(e, r, t)];
                a = false;
              }
              return a;
            };
            callback.errors = [];
            return callback;
          },
        });
        return e;
      }
      var t = addAbsolutePathKeyword;
      r['default'] = t;
    },
    6378: (e) => {
      'use strict';
      class Range {
        static getOperator(e, r) {
          if (e === 'left') {
            return r ? '>' : '>=';
          }
          return r ? '<' : '<=';
        }
        static formatRight(e, r, t) {
          if (r === false) {
            return Range.formatLeft(e, !r, !t);
          }
          return `should be ${Range.getOperator('right', t)} ${e}`;
        }
        static formatLeft(e, r, t) {
          if (r === false) {
            return Range.formatRight(e, !r, !t);
          }
          return `should be ${Range.getOperator('left', t)} ${e}`;
        }
        static formatRange(e, r, t, a, s) {
          let i = 'should be';
          i += ` ${Range.getOperator(s ? 'left' : 'right', s ? t : !t)} ${e} `;
          i += s ? 'and' : 'or';
          i += ` ${Range.getOperator(s ? 'right' : 'left', s ? a : !a)} ${r}`;
          return i;
        }
        static getRangeValue(e, r) {
          let t = r ? Infinity : -Infinity;
          let a = -1;
          const s = r ? ([e]) => e <= t : ([e]) => e >= t;
          for (let r = 0; r < e.length; r++) {
            if (s(e[r])) {
              [t] = e[r];
              a = r;
            }
          }
          if (a > -1) {
            return e[a];
          }
          return [Infinity, true];
        }
        constructor() {
          this._left = [];
          this._right = [];
        }
        left(e, r = false) {
          this._left.push([e, r]);
        }
        right(e, r = false) {
          this._right.push([e, r]);
        }
        format(e = true) {
          const [r, t] = Range.getRangeValue(this._left, e);
          const [a, s] = Range.getRangeValue(this._right, !e);
          if (!Number.isFinite(r) && !Number.isFinite(a)) {
            return '';
          }
          const i = t ? r + 1 : r;
          const o = s ? a - 1 : a;
          if (i === o) {
            return `should be ${e ? '' : '!'}= ${i}`;
          }
          if (Number.isFinite(r) && !Number.isFinite(a)) {
            return Range.formatLeft(r, e, t);
          }
          if (!Number.isFinite(r) && Number.isFinite(a)) {
            return Range.formatRight(a, e, s);
          }
          return Range.formatRange(r, a, t, s, e);
        }
      }
      e.exports = Range;
    },
    544: (e, r, t) => {
      'use strict';
      const a = t(6378);
      e.exports.stringHints = function stringHints(e, r) {
        const t = [];
        let a = 'string';
        const s = { ...e };
        if (!r) {
          const e = s.minLength;
          const r = s.formatMinimum;
          const t = s.formatExclusiveMaximum;
          s.minLength = s.maxLength;
          s.maxLength = e;
          s.formatMinimum = s.formatMaximum;
          s.formatMaximum = r;
          s.formatExclusiveMaximum = !s.formatExclusiveMinimum;
          s.formatExclusiveMinimum = !t;
        }
        if (typeof s.minLength === 'number') {
          if (s.minLength === 1) {
            a = 'non-empty string';
          } else {
            const e = Math.max(s.minLength - 1, 0);
            t.push(`should be longer than ${e} character${e > 1 ? 's' : ''}`);
          }
        }
        if (typeof s.maxLength === 'number') {
          if (s.maxLength === 0) {
            a = 'empty string';
          } else {
            const e = s.maxLength + 1;
            t.push(`should be shorter than ${e} character${e > 1 ? 's' : ''}`);
          }
        }
        if (s.pattern) {
          t.push(
            `should${r ? '' : ' not'} match pattern ${JSON.stringify(
              s.pattern,
            )}`,
          );
        }
        if (s.format) {
          t.push(
            `should${r ? '' : ' not'} match format ${JSON.stringify(s.format)}`,
          );
        }
        if (s.formatMinimum) {
          t.push(
            `should be ${
              s.formatExclusiveMinimum ? '>' : '>='
            } ${JSON.stringify(s.formatMinimum)}`,
          );
        }
        if (s.formatMaximum) {
          t.push(
            `should be ${
              s.formatExclusiveMaximum ? '<' : '<='
            } ${JSON.stringify(s.formatMaximum)}`,
          );
        }
        return [a].concat(t);
      };
      e.exports.numberHints = function numberHints(e, r) {
        const t = [e.type === 'integer' ? 'integer' : 'number'];
        const s = new a();
        if (typeof e.minimum === 'number') {
          s.left(e.minimum);
        }
        if (typeof e.exclusiveMinimum === 'number') {
          s.left(e.exclusiveMinimum, true);
        }
        if (typeof e.maximum === 'number') {
          s.right(e.maximum);
        }
        if (typeof e.exclusiveMaximum === 'number') {
          s.right(e.exclusiveMaximum, true);
        }
        const i = s.format(r);
        if (i) {
          t.push(i);
        }
        if (typeof e.multipleOf === 'number') {
          t.push(`should${r ? '' : ' not'} be multiple of ${e.multipleOf}`);
        }
        return t;
      };
    },
    2121: (e, r, t) => {
      'use strict';
      Object.defineProperty(r, '__esModule', { value: true });
      r.validate = validate;
      Object.defineProperty(r, 'ValidationError', {
        enumerable: true,
        get: function () {
          return s.default;
        },
      });
      var a = _interopRequireDefault(t(9294));
      var s = _interopRequireDefault(t(5826));
      function _interopRequireDefault(e) {
        return e && e.__esModule ? e : { default: e };
      }
      const i = t(8601);
      const o = t(4133);
      const n = new i({ allErrors: true, verbose: true, $data: true });
      o(n, ['instanceof', 'formatMinimum', 'formatMaximum', 'patternRequired']);
      (0, a.default)(n);
      function validate(e, r, t) {
        let a = [];
        if (Array.isArray(r)) {
          a = Array.from(r, (r) => validateObject(e, r));
          a.forEach((e, r) => {
            const applyPrefix = (e) => {
              e.dataPath = `[${r}]${e.dataPath}`;
              if (e.children) {
                e.children.forEach(applyPrefix);
              }
            };
            e.forEach(applyPrefix);
          });
          a = a.reduce((e, r) => {
            e.push(...r);
            return e;
          }, []);
        } else {
          a = validateObject(e, r);
        }
        if (a.length > 0) {
          throw new s.default(a, e, t);
        }
      }
      function validateObject(e, r) {
        const t = n.compile(e);
        const a = t(r);
        if (a) return [];
        return t.errors ? filterErrors(t.errors) : [];
      }
      function filterErrors(e) {
        let r = [];
        for (const t of e) {
          const { dataPath: e } = t;
          let a = [];
          r = r.filter((r) => {
            if (r.dataPath.includes(e)) {
              if (r.children) {
                a = a.concat(r.children.slice(0));
              }
              r.children = undefined;
              a.push(r);
              return false;
            }
            return true;
          });
          if (a.length) {
            t.children = a;
          }
          r.push(t);
        }
        return r;
      }
    },
    199: function (e, r) {
      /** @license URI.js v4.4.1 (c) 2011 Gary Court. License: http://github.com/garycourt/uri-js */
      (function (e, t) {
        true ? t(r) : 0;
      })(this, function (e) {
        'use strict';
        function merge() {
          for (var e = arguments.length, r = Array(e), t = 0; t < e; t++) {
            r[t] = arguments[t];
          }
          if (r.length > 1) {
            r[0] = r[0].slice(0, -1);
            var a = r.length - 1;
            for (var s = 1; s < a; ++s) {
              r[s] = r[s].slice(1, -1);
            }
            r[a] = r[a].slice(1);
            return r.join('');
          } else {
            return r[0];
          }
        }
        function subexp(e) {
          return '(?:' + e + ')';
        }
        function typeOf(e) {
          return e === undefined
            ? 'undefined'
            : e === null
            ? 'null'
            : Object.prototype.toString
                .call(e)
                .split(' ')
                .pop()
                .split(']')
                .shift()
                .toLowerCase();
        }
        function toUpperCase(e) {
          return e.toUpperCase();
        }
        function toArray(e) {
          return e !== undefined && e !== null
            ? e instanceof Array
              ? e
              : typeof e.length !== 'number' ||
                e.split ||
                e.setInterval ||
                e.call
              ? [e]
              : Array.prototype.slice.call(e)
            : [];
        }
        function assign(e, r) {
          var t = e;
          if (r) {
            for (var a in r) {
              t[a] = r[a];
            }
          }
          return t;
        }
        function buildExps(e) {
          var r = '[A-Za-z]',
            t = '[\\x0D]',
            a = '[0-9]',
            s = '[\\x22]',
            i = merge(a, '[A-Fa-f]'),
            o = '[\\x0A]',
            n = '[\\x20]',
            l = subexp(
              subexp('%[EFef]' + i + '%' + i + i + '%' + i + i) +
                '|' +
                subexp('%[89A-Fa-f]' + i + '%' + i + i) +
                '|' +
                subexp('%' + i + i),
            ),
            u = '[\\:\\/\\?\\#\\[\\]\\@]',
            f = "[\\!\\$\\&\\'\\(\\)\\*\\+\\,\\;\\=]",
            c = merge(u, f),
            h = e
              ? '[\\xA0-\\u200D\\u2010-\\u2029\\u202F-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF]'
              : '[]',
            d = e ? '[\\uE000-\\uF8FF]' : '[]',
            p = merge(r, a, '[\\-\\.\\_\\~]', h),
            m = subexp(r + merge(r, a, '[\\+\\-\\.]') + '*'),
            g = subexp(subexp(l + '|' + merge(p, f, '[\\:]')) + '*'),
            y = subexp(
              subexp('25[0-5]') +
                '|' +
                subexp('2[0-4]' + a) +
                '|' +
                subexp('1' + a + a) +
                '|' +
                subexp('[1-9]' + a) +
                '|' +
                a,
            ),
            P = subexp(
              subexp('25[0-5]') +
                '|' +
                subexp('2[0-4]' + a) +
                '|' +
                subexp('1' + a + a) +
                '|' +
                subexp('0?[1-9]' + a) +
                '|0?0?' +
                a,
            ),
            b = subexp(P + '\\.' + P + '\\.' + P + '\\.' + P),
            E = subexp(i + '{1,4}'),
            S = subexp(subexp(E + '\\:' + E) + '|' + b),
            w = subexp(subexp(E + '\\:') + '{6}' + S),
            x = subexp('\\:\\:' + subexp(E + '\\:') + '{5}' + S),
            $ = subexp(subexp(E) + '?\\:\\:' + subexp(E + '\\:') + '{4}' + S),
            _ = subexp(
              subexp(subexp(E + '\\:') + '{0,1}' + E) +
                '?\\:\\:' +
                subexp(E + '\\:') +
                '{3}' +
                S,
            ),
            R = subexp(
              subexp(subexp(E + '\\:') + '{0,2}' + E) +
                '?\\:\\:' +
                subexp(E + '\\:') +
                '{2}' +
                S,
            ),
            F = subexp(
              subexp(subexp(E + '\\:') + '{0,3}' + E) +
                '?\\:\\:' +
                E +
                '\\:' +
                S,
            ),
            O = subexp(subexp(subexp(E + '\\:') + '{0,4}' + E) + '?\\:\\:' + S),
            D = subexp(subexp(subexp(E + '\\:') + '{0,5}' + E) + '?\\:\\:' + E),
            j = subexp(subexp(subexp(E + '\\:') + '{0,6}' + E) + '?\\:\\:'),
            I = subexp([w, x, $, _, R, F, O, D, j].join('|')),
            k = subexp(subexp(p + '|' + l) + '+'),
            C = subexp(I + '\\%25' + k),
            A = subexp(I + subexp('\\%25|\\%(?!' + i + '{2})') + k),
            N = subexp('[vV]' + i + '+\\.' + merge(p, f, '[\\:]') + '+'),
            T = subexp('\\[' + subexp(A + '|' + I + '|' + N) + '\\]'),
            L = subexp(subexp(l + '|' + merge(p, f)) + '*'),
            q = subexp(T + '|' + b + '(?!' + L + ')' + '|' + L),
            z = subexp(a + '*'),
            M = subexp(subexp(g + '@') + '?' + q + subexp('\\:' + z) + '?'),
            U = subexp(l + '|' + merge(p, f, '[\\:\\@]')),
            V = subexp(U + '*'),
            Q = subexp(U + '+'),
            K = subexp(subexp(l + '|' + merge(p, f, '[\\@]')) + '+'),
            H = subexp(subexp('\\/' + V) + '*'),
            J = subexp('\\/' + subexp(Q + H) + '?'),
            B = subexp(K + H),
            Z = subexp(Q + H),
            G = '(?!' + U + ')',
            Y = subexp(H + '|' + J + '|' + B + '|' + Z + '|' + G),
            W = subexp(subexp(U + '|' + merge('[\\/\\?]', d)) + '*'),
            X = subexp(subexp(U + '|[\\/\\?]') + '*'),
            ee = subexp(subexp('\\/\\/' + M + H) + '|' + J + '|' + Z + '|' + G),
            re = subexp(
              m +
                '\\:' +
                ee +
                subexp('\\?' + W) +
                '?' +
                subexp('\\#' + X) +
                '?',
            ),
            te = subexp(subexp('\\/\\/' + M + H) + '|' + J + '|' + B + '|' + G),
            ae = subexp(te + subexp('\\?' + W) + '?' + subexp('\\#' + X) + '?'),
            se = subexp(re + '|' + ae),
            ie = subexp(m + '\\:' + ee + subexp('\\?' + W) + '?'),
            oe =
              '^(' +
              m +
              ')\\:' +
              subexp(
                subexp(
                  '\\/\\/(' +
                    subexp('(' + g + ')@') +
                    '?(' +
                    q +
                    ')' +
                    subexp('\\:(' + z + ')') +
                    '?)',
                ) +
                  '?(' +
                  H +
                  '|' +
                  J +
                  '|' +
                  Z +
                  '|' +
                  G +
                  ')',
              ) +
              subexp('\\?(' + W + ')') +
              '?' +
              subexp('\\#(' + X + ')') +
              '?$',
            ne =
              '^(){0}' +
              subexp(
                subexp(
                  '\\/\\/(' +
                    subexp('(' + g + ')@') +
                    '?(' +
                    q +
                    ')' +
                    subexp('\\:(' + z + ')') +
                    '?)',
                ) +
                  '?(' +
                  H +
                  '|' +
                  J +
                  '|' +
                  B +
                  '|' +
                  G +
                  ')',
              ) +
              subexp('\\?(' + W + ')') +
              '?' +
              subexp('\\#(' + X + ')') +
              '?$',
            le =
              '^(' +
              m +
              ')\\:' +
              subexp(
                subexp(
                  '\\/\\/(' +
                    subexp('(' + g + ')@') +
                    '?(' +
                    q +
                    ')' +
                    subexp('\\:(' + z + ')') +
                    '?)',
                ) +
                  '?(' +
                  H +
                  '|' +
                  J +
                  '|' +
                  Z +
                  '|' +
                  G +
                  ')',
              ) +
              subexp('\\?(' + W + ')') +
              '?$',
            ue = '^' + subexp('\\#(' + X + ')') + '?$',
            fe =
              '^' +
              subexp('(' + g + ')@') +
              '?(' +
              q +
              ')' +
              subexp('\\:(' + z + ')') +
              '?$';
          return {
            NOT_SCHEME: new RegExp(merge('[^]', r, a, '[\\+\\-\\.]'), 'g'),
            NOT_USERINFO: new RegExp(merge('[^\\%\\:]', p, f), 'g'),
            NOT_HOST: new RegExp(merge('[^\\%\\[\\]\\:]', p, f), 'g'),
            NOT_PATH: new RegExp(merge('[^\\%\\/\\:\\@]', p, f), 'g'),
            NOT_PATH_NOSCHEME: new RegExp(merge('[^\\%\\/\\@]', p, f), 'g'),
            NOT_QUERY: new RegExp(
              merge('[^\\%]', p, f, '[\\:\\@\\/\\?]', d),
              'g',
            ),
            NOT_FRAGMENT: new RegExp(
              merge('[^\\%]', p, f, '[\\:\\@\\/\\?]'),
              'g',
            ),
            ESCAPE: new RegExp(merge('[^]', p, f), 'g'),
            UNRESERVED: new RegExp(p, 'g'),
            OTHER_CHARS: new RegExp(merge('[^\\%]', p, c), 'g'),
            PCT_ENCODED: new RegExp(l, 'g'),
            IPV4ADDRESS: new RegExp('^(' + b + ')$'),
            IPV6ADDRESS: new RegExp(
              '^\\[?(' +
                I +
                ')' +
                subexp(subexp('\\%25|\\%(?!' + i + '{2})') + '(' + k + ')') +
                '?\\]?$',
            ),
          };
        }
        var r = buildExps(false);
        var t = buildExps(true);
        var a = (function () {
          function sliceIterator(e, r) {
            var t = [];
            var a = true;
            var s = false;
            var i = undefined;
            try {
              for (
                var o = e[Symbol.iterator](), n;
                !(a = (n = o.next()).done);
                a = true
              ) {
                t.push(n.value);
                if (r && t.length === r) break;
              }
            } catch (e) {
              s = true;
              i = e;
            } finally {
              try {
                if (!a && o['return']) o['return']();
              } finally {
                if (s) throw i;
              }
            }
            return t;
          }
          return function (e, r) {
            if (Array.isArray(e)) {
              return e;
            } else if (Symbol.iterator in Object(e)) {
              return sliceIterator(e, r);
            } else {
              throw new TypeError(
                'Invalid attempt to destructure non-iterable instance',
              );
            }
          };
        })();
        var toConsumableArray = function (e) {
          if (Array.isArray(e)) {
            for (var r = 0, t = Array(e.length); r < e.length; r++) t[r] = e[r];
            return t;
          } else {
            return Array.from(e);
          }
        };
        var s = 2147483647;
        var i = 36;
        var o = 1;
        var n = 26;
        var l = 38;
        var u = 700;
        var f = 72;
        var c = 128;
        var h = '-';
        var d = /^xn--/;
        var p = /[^\0-\x7E]/;
        var m = /[\x2E\u3002\uFF0E\uFF61]/g;
        var g = {
          overflow: 'Overflow: input needs wider integers to process',
          'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
          'invalid-input': 'Invalid input',
        };
        var y = i - o;
        var P = Math.floor;
        var b = String.fromCharCode;
        function error$1(e) {
          throw new RangeError(g[e]);
        }
        function map(e, r) {
          var t = [];
          var a = e.length;
          while (a--) {
            t[a] = r(e[a]);
          }
          return t;
        }
        function mapDomain(e, r) {
          var t = e.split('@');
          var a = '';
          if (t.length > 1) {
            a = t[0] + '@';
            e = t[1];
          }
          e = e.replace(m, '.');
          var s = e.split('.');
          var i = map(s, r).join('.');
          return a + i;
        }
        function ucs2decode(e) {
          var r = [];
          var t = 0;
          var a = e.length;
          while (t < a) {
            var s = e.charCodeAt(t++);
            if (s >= 55296 && s <= 56319 && t < a) {
              var i = e.charCodeAt(t++);
              if ((i & 64512) == 56320) {
                r.push(((s & 1023) << 10) + (i & 1023) + 65536);
              } else {
                r.push(s);
                t--;
              }
            } else {
              r.push(s);
            }
          }
          return r;
        }
        var E = function ucs2encode(e) {
          return String.fromCodePoint.apply(String, toConsumableArray(e));
        };
        var S = function basicToDigit(e) {
          if (e - 48 < 10) {
            return e - 22;
          }
          if (e - 65 < 26) {
            return e - 65;
          }
          if (e - 97 < 26) {
            return e - 97;
          }
          return i;
        };
        var w = function digitToBasic(e, r) {
          return e + 22 + 75 * (e < 26) - ((r != 0) << 5);
        };
        var x = function adapt(e, r, t) {
          var a = 0;
          e = t ? P(e / u) : e >> 1;
          e += P(e / r);
          for (; e > (y * n) >> 1; a += i) {
            e = P(e / y);
          }
          return P(a + ((y + 1) * e) / (e + l));
        };
        var $ = function decode(e) {
          var r = [];
          var t = e.length;
          var a = 0;
          var l = c;
          var u = f;
          var d = e.lastIndexOf(h);
          if (d < 0) {
            d = 0;
          }
          for (var p = 0; p < d; ++p) {
            if (e.charCodeAt(p) >= 128) {
              error$1('not-basic');
            }
            r.push(e.charCodeAt(p));
          }
          for (var m = d > 0 ? d + 1 : 0; m < t; ) {
            var g = a;
            for (var y = 1, b = i; ; b += i) {
              if (m >= t) {
                error$1('invalid-input');
              }
              var E = S(e.charCodeAt(m++));
              if (E >= i || E > P((s - a) / y)) {
                error$1('overflow');
              }
              a += E * y;
              var w = b <= u ? o : b >= u + n ? n : b - u;
              if (E < w) {
                break;
              }
              var $ = i - w;
              if (y > P(s / $)) {
                error$1('overflow');
              }
              y *= $;
            }
            var _ = r.length + 1;
            u = x(a - g, _, g == 0);
            if (P(a / _) > s - l) {
              error$1('overflow');
            }
            l += P(a / _);
            a %= _;
            r.splice(a++, 0, l);
          }
          return String.fromCodePoint.apply(String, r);
        };
        var _ = function encode(e) {
          var r = [];
          e = ucs2decode(e);
          var t = e.length;
          var a = c;
          var l = 0;
          var u = f;
          var d = true;
          var p = false;
          var m = undefined;
          try {
            for (
              var g = e[Symbol.iterator](), y;
              !(d = (y = g.next()).done);
              d = true
            ) {
              var E = y.value;
              if (E < 128) {
                r.push(b(E));
              }
            }
          } catch (e) {
            p = true;
            m = e;
          } finally {
            try {
              if (!d && g.return) {
                g.return();
              }
            } finally {
              if (p) {
                throw m;
              }
            }
          }
          var S = r.length;
          var $ = S;
          if (S) {
            r.push(h);
          }
          while ($ < t) {
            var _ = s;
            var R = true;
            var F = false;
            var O = undefined;
            try {
              for (
                var D = e[Symbol.iterator](), j;
                !(R = (j = D.next()).done);
                R = true
              ) {
                var I = j.value;
                if (I >= a && I < _) {
                  _ = I;
                }
              }
            } catch (e) {
              F = true;
              O = e;
            } finally {
              try {
                if (!R && D.return) {
                  D.return();
                }
              } finally {
                if (F) {
                  throw O;
                }
              }
            }
            var k = $ + 1;
            if (_ - a > P((s - l) / k)) {
              error$1('overflow');
            }
            l += (_ - a) * k;
            a = _;
            var C = true;
            var A = false;
            var N = undefined;
            try {
              for (
                var T = e[Symbol.iterator](), L;
                !(C = (L = T.next()).done);
                C = true
              ) {
                var q = L.value;
                if (q < a && ++l > s) {
                  error$1('overflow');
                }
                if (q == a) {
                  var z = l;
                  for (var M = i; ; M += i) {
                    var U = M <= u ? o : M >= u + n ? n : M - u;
                    if (z < U) {
                      break;
                    }
                    var V = z - U;
                    var Q = i - U;
                    r.push(b(w(U + (V % Q), 0)));
                    z = P(V / Q);
                  }
                  r.push(b(w(z, 0)));
                  u = x(l, k, $ == S);
                  l = 0;
                  ++$;
                }
              }
            } catch (e) {
              A = true;
              N = e;
            } finally {
              try {
                if (!C && T.return) {
                  T.return();
                }
              } finally {
                if (A) {
                  throw N;
                }
              }
            }
            ++l;
            ++a;
          }
          return r.join('');
        };
        var R = function toUnicode(e) {
          return mapDomain(e, function (e) {
            return d.test(e) ? $(e.slice(4).toLowerCase()) : e;
          });
        };
        var F = function toASCII(e) {
          return mapDomain(e, function (e) {
            return p.test(e) ? 'xn--' + _(e) : e;
          });
        };
        var O = {
          version: '2.1.0',
          ucs2: { decode: ucs2decode, encode: E },
          decode: $,
          encode: _,
          toASCII: F,
          toUnicode: R,
        };
        var D = {};
        function pctEncChar(e) {
          var r = e.charCodeAt(0);
          var t = void 0;
          if (r < 16) t = '%0' + r.toString(16).toUpperCase();
          else if (r < 128) t = '%' + r.toString(16).toUpperCase();
          else if (r < 2048)
            t =
              '%' +
              ((r >> 6) | 192).toString(16).toUpperCase() +
              '%' +
              ((r & 63) | 128).toString(16).toUpperCase();
          else
            t =
              '%' +
              ((r >> 12) | 224).toString(16).toUpperCase() +
              '%' +
              (((r >> 6) & 63) | 128).toString(16).toUpperCase() +
              '%' +
              ((r & 63) | 128).toString(16).toUpperCase();
          return t;
        }
        function pctDecChars(e) {
          var r = '';
          var t = 0;
          var a = e.length;
          while (t < a) {
            var s = parseInt(e.substr(t + 1, 2), 16);
            if (s < 128) {
              r += String.fromCharCode(s);
              t += 3;
            } else if (s >= 194 && s < 224) {
              if (a - t >= 6) {
                var i = parseInt(e.substr(t + 4, 2), 16);
                r += String.fromCharCode(((s & 31) << 6) | (i & 63));
              } else {
                r += e.substr(t, 6);
              }
              t += 6;
            } else if (s >= 224) {
              if (a - t >= 9) {
                var o = parseInt(e.substr(t + 4, 2), 16);
                var n = parseInt(e.substr(t + 7, 2), 16);
                r += String.fromCharCode(
                  ((s & 15) << 12) | ((o & 63) << 6) | (n & 63),
                );
              } else {
                r += e.substr(t, 9);
              }
              t += 9;
            } else {
              r += e.substr(t, 3);
              t += 3;
            }
          }
          return r;
        }
        function _normalizeComponentEncoding(e, r) {
          function decodeUnreserved(e) {
            var t = pctDecChars(e);
            return !t.match(r.UNRESERVED) ? e : t;
          }
          if (e.scheme)
            e.scheme = String(e.scheme)
              .replace(r.PCT_ENCODED, decodeUnreserved)
              .toLowerCase()
              .replace(r.NOT_SCHEME, '');
          if (e.userinfo !== undefined)
            e.userinfo = String(e.userinfo)
              .replace(r.PCT_ENCODED, decodeUnreserved)
              .replace(r.NOT_USERINFO, pctEncChar)
              .replace(r.PCT_ENCODED, toUpperCase);
          if (e.host !== undefined)
            e.host = String(e.host)
              .replace(r.PCT_ENCODED, decodeUnreserved)
              .toLowerCase()
              .replace(r.NOT_HOST, pctEncChar)
              .replace(r.PCT_ENCODED, toUpperCase);
          if (e.path !== undefined)
            e.path = String(e.path)
              .replace(r.PCT_ENCODED, decodeUnreserved)
              .replace(e.scheme ? r.NOT_PATH : r.NOT_PATH_NOSCHEME, pctEncChar)
              .replace(r.PCT_ENCODED, toUpperCase);
          if (e.query !== undefined)
            e.query = String(e.query)
              .replace(r.PCT_ENCODED, decodeUnreserved)
              .replace(r.NOT_QUERY, pctEncChar)
              .replace(r.PCT_ENCODED, toUpperCase);
          if (e.fragment !== undefined)
            e.fragment = String(e.fragment)
              .replace(r.PCT_ENCODED, decodeUnreserved)
              .replace(r.NOT_FRAGMENT, pctEncChar)
              .replace(r.PCT_ENCODED, toUpperCase);
          return e;
        }
        function _stripLeadingZeros(e) {
          return e.replace(/^0*(.*)/, '$1') || '0';
        }
        function _normalizeIPv4(e, r) {
          var t = e.match(r.IPV4ADDRESS) || [];
          var s = a(t, 2),
            i = s[1];
          if (i) {
            return i.split('.').map(_stripLeadingZeros).join('.');
          } else {
            return e;
          }
        }
        function _normalizeIPv6(e, r) {
          var t = e.match(r.IPV6ADDRESS) || [];
          var s = a(t, 3),
            i = s[1],
            o = s[2];
          if (i) {
            var n = i.toLowerCase().split('::').reverse(),
              l = a(n, 2),
              u = l[0],
              f = l[1];
            var c = f ? f.split(':').map(_stripLeadingZeros) : [];
            var h = u.split(':').map(_stripLeadingZeros);
            var d = r.IPV4ADDRESS.test(h[h.length - 1]);
            var p = d ? 7 : 8;
            var m = h.length - p;
            var g = Array(p);
            for (var y = 0; y < p; ++y) {
              g[y] = c[y] || h[m + y] || '';
            }
            if (d) {
              g[p - 1] = _normalizeIPv4(g[p - 1], r);
            }
            var P = g.reduce(function (e, r, t) {
              if (!r || r === '0') {
                var a = e[e.length - 1];
                if (a && a.index + a.length === t) {
                  a.length++;
                } else {
                  e.push({ index: t, length: 1 });
                }
              }
              return e;
            }, []);
            var b = P.sort(function (e, r) {
              return r.length - e.length;
            })[0];
            var E = void 0;
            if (b && b.length > 1) {
              var S = g.slice(0, b.index);
              var w = g.slice(b.index + b.length);
              E = S.join(':') + '::' + w.join(':');
            } else {
              E = g.join(':');
            }
            if (o) {
              E += '%' + o;
            }
            return E;
          } else {
            return e;
          }
        }
        var j =
          /^(?:([^:\/?#]+):)?(?:\/\/((?:([^\/?#@]*)@)?(\[[^\/?#\]]+\]|[^\/?#:]*)(?:\:(\d*))?))?([^?#]*)(?:\?([^#]*))?(?:#((?:.|\n|\r)*))?/i;
        var I = ''.match(/(){0}/)[1] === undefined;
        function parse(e) {
          var a =
            arguments.length > 1 && arguments[1] !== undefined
              ? arguments[1]
              : {};
          var s = {};
          var i = a.iri !== false ? t : r;
          if (a.reference === 'suffix')
            e = (a.scheme ? a.scheme + ':' : '') + '//' + e;
          var o = e.match(j);
          if (o) {
            if (I) {
              s.scheme = o[1];
              s.userinfo = o[3];
              s.host = o[4];
              s.port = parseInt(o[5], 10);
              s.path = o[6] || '';
              s.query = o[7];
              s.fragment = o[8];
              if (isNaN(s.port)) {
                s.port = o[5];
              }
            } else {
              s.scheme = o[1] || undefined;
              s.userinfo = e.indexOf('@') !== -1 ? o[3] : undefined;
              s.host = e.indexOf('//') !== -1 ? o[4] : undefined;
              s.port = parseInt(o[5], 10);
              s.path = o[6] || '';
              s.query = e.indexOf('?') !== -1 ? o[7] : undefined;
              s.fragment = e.indexOf('#') !== -1 ? o[8] : undefined;
              if (isNaN(s.port)) {
                s.port = e.match(/\/\/(?:.|\n)*\:(?:\/|\?|\#|$)/)
                  ? o[4]
                  : undefined;
              }
            }
            if (s.host) {
              s.host = _normalizeIPv6(_normalizeIPv4(s.host, i), i);
            }
            if (
              s.scheme === undefined &&
              s.userinfo === undefined &&
              s.host === undefined &&
              s.port === undefined &&
              !s.path &&
              s.query === undefined
            ) {
              s.reference = 'same-document';
            } else if (s.scheme === undefined) {
              s.reference = 'relative';
            } else if (s.fragment === undefined) {
              s.reference = 'absolute';
            } else {
              s.reference = 'uri';
            }
            if (
              a.reference &&
              a.reference !== 'suffix' &&
              a.reference !== s.reference
            ) {
              s.error =
                s.error || 'URI is not a ' + a.reference + ' reference.';
            }
            var n = D[(a.scheme || s.scheme || '').toLowerCase()];
            if (!a.unicodeSupport && (!n || !n.unicodeSupport)) {
              if (s.host && (a.domainHost || (n && n.domainHost))) {
                try {
                  s.host = O.toASCII(
                    s.host.replace(i.PCT_ENCODED, pctDecChars).toLowerCase(),
                  );
                } catch (e) {
                  s.error =
                    s.error ||
                    "Host's domain name can not be converted to ASCII via punycode: " +
                      e;
                }
              }
              _normalizeComponentEncoding(s, r);
            } else {
              _normalizeComponentEncoding(s, i);
            }
            if (n && n.parse) {
              n.parse(s, a);
            }
          } else {
            s.error = s.error || 'URI can not be parsed.';
          }
          return s;
        }
        function _recomposeAuthority(e, a) {
          var s = a.iri !== false ? t : r;
          var i = [];
          if (e.userinfo !== undefined) {
            i.push(e.userinfo);
            i.push('@');
          }
          if (e.host !== undefined) {
            i.push(
              _normalizeIPv6(_normalizeIPv4(String(e.host), s), s).replace(
                s.IPV6ADDRESS,
                function (e, r, t) {
                  return '[' + r + (t ? '%25' + t : '') + ']';
                },
              ),
            );
          }
          if (typeof e.port === 'number' || typeof e.port === 'string') {
            i.push(':');
            i.push(String(e.port));
          }
          return i.length ? i.join('') : undefined;
        }
        var k = /^\.\.?\//;
        var C = /^\/\.(\/|$)/;
        var A = /^\/\.\.(\/|$)/;
        var N = /^\/?(?:.|\n)*?(?=\/|$)/;
        function removeDotSegments(e) {
          var r = [];
          while (e.length) {
            if (e.match(k)) {
              e = e.replace(k, '');
            } else if (e.match(C)) {
              e = e.replace(C, '/');
            } else if (e.match(A)) {
              e = e.replace(A, '/');
              r.pop();
            } else if (e === '.' || e === '..') {
              e = '';
            } else {
              var t = e.match(N);
              if (t) {
                var a = t[0];
                e = e.slice(a.length);
                r.push(a);
              } else {
                throw new Error('Unexpected dot segment condition');
              }
            }
          }
          return r.join('');
        }
        function serialize(e) {
          var a =
            arguments.length > 1 && arguments[1] !== undefined
              ? arguments[1]
              : {};
          var s = a.iri ? t : r;
          var i = [];
          var o = D[(a.scheme || e.scheme || '').toLowerCase()];
          if (o && o.serialize) o.serialize(e, a);
          if (e.host) {
            if (s.IPV6ADDRESS.test(e.host)) {
            } else if (a.domainHost || (o && o.domainHost)) {
              try {
                e.host = !a.iri
                  ? O.toASCII(
                      e.host.replace(s.PCT_ENCODED, pctDecChars).toLowerCase(),
                    )
                  : O.toUnicode(e.host);
              } catch (r) {
                e.error =
                  e.error ||
                  "Host's domain name can not be converted to " +
                    (!a.iri ? 'ASCII' : 'Unicode') +
                    ' via punycode: ' +
                    r;
              }
            }
          }
          _normalizeComponentEncoding(e, s);
          if (a.reference !== 'suffix' && e.scheme) {
            i.push(e.scheme);
            i.push(':');
          }
          var n = _recomposeAuthority(e, a);
          if (n !== undefined) {
            if (a.reference !== 'suffix') {
              i.push('//');
            }
            i.push(n);
            if (e.path && e.path.charAt(0) !== '/') {
              i.push('/');
            }
          }
          if (e.path !== undefined) {
            var l = e.path;
            if (!a.absolutePath && (!o || !o.absolutePath)) {
              l = removeDotSegments(l);
            }
            if (n === undefined) {
              l = l.replace(/^\/\//, '/%2F');
            }
            i.push(l);
          }
          if (e.query !== undefined) {
            i.push('?');
            i.push(e.query);
          }
          if (e.fragment !== undefined) {
            i.push('#');
            i.push(e.fragment);
          }
          return i.join('');
        }
        function resolveComponents(e, r) {
          var t =
            arguments.length > 2 && arguments[2] !== undefined
              ? arguments[2]
              : {};
          var a = arguments[3];
          var s = {};
          if (!a) {
            e = parse(serialize(e, t), t);
            r = parse(serialize(r, t), t);
          }
          t = t || {};
          if (!t.tolerant && r.scheme) {
            s.scheme = r.scheme;
            s.userinfo = r.userinfo;
            s.host = r.host;
            s.port = r.port;
            s.path = removeDotSegments(r.path || '');
            s.query = r.query;
          } else {
            if (
              r.userinfo !== undefined ||
              r.host !== undefined ||
              r.port !== undefined
            ) {
              s.userinfo = r.userinfo;
              s.host = r.host;
              s.port = r.port;
              s.path = removeDotSegments(r.path || '');
              s.query = r.query;
            } else {
              if (!r.path) {
                s.path = e.path;
                if (r.query !== undefined) {
                  s.query = r.query;
                } else {
                  s.query = e.query;
                }
              } else {
                if (r.path.charAt(0) === '/') {
                  s.path = removeDotSegments(r.path);
                } else {
                  if (
                    (e.userinfo !== undefined ||
                      e.host !== undefined ||
                      e.port !== undefined) &&
                    !e.path
                  ) {
                    s.path = '/' + r.path;
                  } else if (!e.path) {
                    s.path = r.path;
                  } else {
                    s.path =
                      e.path.slice(0, e.path.lastIndexOf('/') + 1) + r.path;
                  }
                  s.path = removeDotSegments(s.path);
                }
                s.query = r.query;
              }
              s.userinfo = e.userinfo;
              s.host = e.host;
              s.port = e.port;
            }
            s.scheme = e.scheme;
          }
          s.fragment = r.fragment;
          return s;
        }
        function resolve(e, r, t) {
          var a = assign({ scheme: 'null' }, t);
          return serialize(
            resolveComponents(parse(e, a), parse(r, a), a, true),
            a,
          );
        }
        function normalize(e, r) {
          if (typeof e === 'string') {
            e = serialize(parse(e, r), r);
          } else if (typeOf(e) === 'object') {
            e = parse(serialize(e, r), r);
          }
          return e;
        }
        function equal(e, r, t) {
          if (typeof e === 'string') {
            e = serialize(parse(e, t), t);
          } else if (typeOf(e) === 'object') {
            e = serialize(e, t);
          }
          if (typeof r === 'string') {
            r = serialize(parse(r, t), t);
          } else if (typeOf(r) === 'object') {
            r = serialize(r, t);
          }
          return e === r;
        }
        function escapeComponent(e, a) {
          return (
            e &&
            e.toString().replace(!a || !a.iri ? r.ESCAPE : t.ESCAPE, pctEncChar)
          );
        }
        function unescapeComponent(e, a) {
          return (
            e &&
            e
              .toString()
              .replace(
                !a || !a.iri ? r.PCT_ENCODED : t.PCT_ENCODED,
                pctDecChars,
              )
          );
        }
        var T = {
          scheme: 'http',
          domainHost: true,
          parse: function parse(e, r) {
            if (!e.host) {
              e.error = e.error || 'HTTP URIs must have a host.';
            }
            return e;
          },
          serialize: function serialize(e, r) {
            var t = String(e.scheme).toLowerCase() === 'https';
            if (e.port === (t ? 443 : 80) || e.port === '') {
              e.port = undefined;
            }
            if (!e.path) {
              e.path = '/';
            }
            return e;
          },
        };
        var L = {
          scheme: 'https',
          domainHost: T.domainHost,
          parse: T.parse,
          serialize: T.serialize,
        };
        function isSecure(e) {
          return typeof e.secure === 'boolean'
            ? e.secure
            : String(e.scheme).toLowerCase() === 'wss';
        }
        var q = {
          scheme: 'ws',
          domainHost: true,
          parse: function parse(e, r) {
            var t = e;
            t.secure = isSecure(t);
            t.resourceName = (t.path || '/') + (t.query ? '?' + t.query : '');
            t.path = undefined;
            t.query = undefined;
            return t;
          },
          serialize: function serialize(e, r) {
            if (e.port === (isSecure(e) ? 443 : 80) || e.port === '') {
              e.port = undefined;
            }
            if (typeof e.secure === 'boolean') {
              e.scheme = e.secure ? 'wss' : 'ws';
              e.secure = undefined;
            }
            if (e.resourceName) {
              var t = e.resourceName.split('?'),
                s = a(t, 2),
                i = s[0],
                o = s[1];
              e.path = i && i !== '/' ? i : undefined;
              e.query = o;
              e.resourceName = undefined;
            }
            e.fragment = undefined;
            return e;
          },
        };
        var z = {
          scheme: 'wss',
          domainHost: q.domainHost,
          parse: q.parse,
          serialize: q.serialize,
        };
        var M = {};
        var U = true;
        var V =
          '[A-Za-z0-9\\-\\.\\_\\~' +
          (U
            ? '\\xA0-\\u200D\\u2010-\\u2029\\u202F-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF'
            : '') +
          ']';
        var Q = '[0-9A-Fa-f]';
        var K = subexp(
          subexp('%[EFef]' + Q + '%' + Q + Q + '%' + Q + Q) +
            '|' +
            subexp('%[89A-Fa-f]' + Q + '%' + Q + Q) +
            '|' +
            subexp('%' + Q + Q),
        );
        var H = "[A-Za-z0-9\\!\\$\\%\\'\\*\\+\\-\\^\\_\\`\\{\\|\\}\\~]";
        var J = "[\\!\\$\\%\\'\\(\\)\\*\\+\\,\\-\\.0-9\\<\\>A-Z\\x5E-\\x7E]";
        var B = merge(J, '[\\"\\\\]');
        var Z = "[\\!\\$\\'\\(\\)\\*\\+\\,\\;\\:\\@]";
        var G = new RegExp(V, 'g');
        var Y = new RegExp(K, 'g');
        var W = new RegExp(merge('[^]', H, '[\\.]', '[\\"]', B), 'g');
        var X = new RegExp(merge('[^]', V, Z), 'g');
        var ee = X;
        function decodeUnreserved(e) {
          var r = pctDecChars(e);
          return !r.match(G) ? e : r;
        }
        var re = {
          scheme: 'mailto',
          parse: function parse$$1(e, r) {
            var t = e;
            var a = (t.to = t.path ? t.path.split(',') : []);
            t.path = undefined;
            if (t.query) {
              var s = false;
              var i = {};
              var o = t.query.split('&');
              for (var n = 0, l = o.length; n < l; ++n) {
                var u = o[n].split('=');
                switch (u[0]) {
                  case 'to':
                    var f = u[1].split(',');
                    for (var c = 0, h = f.length; c < h; ++c) {
                      a.push(f[c]);
                    }
                    break;
                  case 'subject':
                    t.subject = unescapeComponent(u[1], r);
                    break;
                  case 'body':
                    t.body = unescapeComponent(u[1], r);
                    break;
                  default:
                    s = true;
                    i[unescapeComponent(u[0], r)] = unescapeComponent(u[1], r);
                    break;
                }
              }
              if (s) t.headers = i;
            }
            t.query = undefined;
            for (var d = 0, p = a.length; d < p; ++d) {
              var m = a[d].split('@');
              m[0] = unescapeComponent(m[0]);
              if (!r.unicodeSupport) {
                try {
                  m[1] = O.toASCII(unescapeComponent(m[1], r).toLowerCase());
                } catch (e) {
                  t.error =
                    t.error ||
                    "Email address's domain name can not be converted to ASCII via punycode: " +
                      e;
                }
              } else {
                m[1] = unescapeComponent(m[1], r).toLowerCase();
              }
              a[d] = m.join('@');
            }
            return t;
          },
          serialize: function serialize$$1(e, r) {
            var t = e;
            var a = toArray(e.to);
            if (a) {
              for (var s = 0, i = a.length; s < i; ++s) {
                var o = String(a[s]);
                var n = o.lastIndexOf('@');
                var l = o
                  .slice(0, n)
                  .replace(Y, decodeUnreserved)
                  .replace(Y, toUpperCase)
                  .replace(W, pctEncChar);
                var u = o.slice(n + 1);
                try {
                  u = !r.iri
                    ? O.toASCII(unescapeComponent(u, r).toLowerCase())
                    : O.toUnicode(u);
                } catch (e) {
                  t.error =
                    t.error ||
                    "Email address's domain name can not be converted to " +
                      (!r.iri ? 'ASCII' : 'Unicode') +
                      ' via punycode: ' +
                      e;
                }
                a[s] = l + '@' + u;
              }
              t.path = a.join(',');
            }
            var f = (e.headers = e.headers || {});
            if (e.subject) f['subject'] = e.subject;
            if (e.body) f['body'] = e.body;
            var c = [];
            for (var h in f) {
              if (f[h] !== M[h]) {
                c.push(
                  h
                    .replace(Y, decodeUnreserved)
                    .replace(Y, toUpperCase)
                    .replace(X, pctEncChar) +
                    '=' +
                    f[h]
                      .replace(Y, decodeUnreserved)
                      .replace(Y, toUpperCase)
                      .replace(ee, pctEncChar),
                );
              }
            }
            if (c.length) {
              t.query = c.join('&');
            }
            return t;
          },
        };
        var te = /^([^\:]+)\:(.*)/;
        var ae = {
          scheme: 'urn',
          parse: function parse$$1(e, r) {
            var t = e.path && e.path.match(te);
            var a = e;
            if (t) {
              var s = r.scheme || a.scheme || 'urn';
              var i = t[1].toLowerCase();
              var o = t[2];
              var n = s + ':' + (r.nid || i);
              var l = D[n];
              a.nid = i;
              a.nss = o;
              a.path = undefined;
              if (l) {
                a = l.parse(a, r);
              }
            } else {
              a.error = a.error || 'URN can not be parsed.';
            }
            return a;
          },
          serialize: function serialize$$1(e, r) {
            var t = r.scheme || e.scheme || 'urn';
            var a = e.nid;
            var s = t + ':' + (r.nid || a);
            var i = D[s];
            if (i) {
              e = i.serialize(e, r);
            }
            var o = e;
            var n = e.nss;
            o.path = (a || r.nid) + ':' + n;
            return o;
          },
        };
        var se = /^[0-9A-Fa-f]{8}(?:\-[0-9A-Fa-f]{4}){3}\-[0-9A-Fa-f]{12}$/;
        var ie = {
          scheme: 'urn:uuid',
          parse: function parse(e, r) {
            var t = e;
            t.uuid = t.nss;
            t.nss = undefined;
            if (!r.tolerant && (!t.uuid || !t.uuid.match(se))) {
              t.error = t.error || 'UUID is not valid.';
            }
            return t;
          },
          serialize: function serialize(e, r) {
            var t = e;
            t.nss = (e.uuid || '').toLowerCase();
            return t;
          },
        };
        D[T.scheme] = T;
        D[L.scheme] = L;
        D[q.scheme] = q;
        D[z.scheme] = z;
        D[re.scheme] = re;
        D[ae.scheme] = ae;
        D[ie.scheme] = ie;
        e.SCHEMES = D;
        e.pctEncChar = pctEncChar;
        e.pctDecChars = pctDecChars;
        e.parse = parse;
        e.removeDotSegments = removeDotSegments;
        e.serialize = serialize;
        e.resolveComponents = resolveComponents;
        e.resolve = resolve;
        e.normalize = normalize;
        e.equal = equal;
        e.escapeComponent = escapeComponent;
        e.unescapeComponent = unescapeComponent;
        Object.defineProperty(e, '__esModule', { value: true });
      });
    },
    7664: (e) => {
      'use strict';
      e.exports = JSON.parse(
        '{"$schema":"http://json-schema.org/draft-07/schema#","$id":"https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#","description":"Meta-schema for $data reference (JSON Schema extension proposal)","type":"object","required":["$data"],"properties":{"$data":{"type":"string","anyOf":[{"format":"relative-json-pointer"},{"format":"json-pointer"}]}},"additionalProperties":false}',
      );
    },
    7136: (e) => {
      'use strict';
      e.exports = JSON.parse(
        '{"$schema":"http://json-schema.org/draft-07/schema#","$id":"http://json-schema.org/draft-07/schema#","title":"Core schema meta-schema","definitions":{"schemaArray":{"type":"array","minItems":1,"items":{"$ref":"#"}},"nonNegativeInteger":{"type":"integer","minimum":0},"nonNegativeIntegerDefault0":{"allOf":[{"$ref":"#/definitions/nonNegativeInteger"},{"default":0}]},"simpleTypes":{"enum":["array","boolean","integer","null","number","object","string"]},"stringArray":{"type":"array","items":{"type":"string"},"uniqueItems":true,"default":[]}},"type":["object","boolean"],"properties":{"$id":{"type":"string","format":"uri-reference"},"$schema":{"type":"string","format":"uri"},"$ref":{"type":"string","format":"uri-reference"},"$comment":{"type":"string"},"title":{"type":"string"},"description":{"type":"string"},"default":true,"readOnly":{"type":"boolean","default":false},"examples":{"type":"array","items":true},"multipleOf":{"type":"number","exclusiveMinimum":0},"maximum":{"type":"number"},"exclusiveMaximum":{"type":"number"},"minimum":{"type":"number"},"exclusiveMinimum":{"type":"number"},"maxLength":{"$ref":"#/definitions/nonNegativeInteger"},"minLength":{"$ref":"#/definitions/nonNegativeIntegerDefault0"},"pattern":{"type":"string","format":"regex"},"additionalItems":{"$ref":"#"},"items":{"anyOf":[{"$ref":"#"},{"$ref":"#/definitions/schemaArray"}],"default":true},"maxItems":{"$ref":"#/definitions/nonNegativeInteger"},"minItems":{"$ref":"#/definitions/nonNegativeIntegerDefault0"},"uniqueItems":{"type":"boolean","default":false},"contains":{"$ref":"#"},"maxProperties":{"$ref":"#/definitions/nonNegativeInteger"},"minProperties":{"$ref":"#/definitions/nonNegativeIntegerDefault0"},"required":{"$ref":"#/definitions/stringArray"},"additionalProperties":{"$ref":"#"},"definitions":{"type":"object","additionalProperties":{"$ref":"#"},"default":{}},"properties":{"type":"object","additionalProperties":{"$ref":"#"},"default":{}},"patternProperties":{"type":"object","additionalProperties":{"$ref":"#"},"propertyNames":{"format":"regex"},"default":{}},"dependencies":{"type":"object","additionalProperties":{"anyOf":[{"$ref":"#"},{"$ref":"#/definitions/stringArray"}]}},"propertyNames":{"$ref":"#"},"const":true,"enum":{"type":"array","items":true,"minItems":1,"uniqueItems":true},"type":{"anyOf":[{"$ref":"#/definitions/simpleTypes"},{"type":"array","items":{"$ref":"#/definitions/simpleTypes"},"minItems":1,"uniqueItems":true}]},"format":{"type":"string"},"contentMediaType":{"type":"string"},"contentEncoding":{"type":"string"},"if":{"$ref":"#"},"then":{"$ref":"#"},"else":{"$ref":"#"},"allOf":{"$ref":"#/definitions/schemaArray"},"anyOf":{"$ref":"#/definitions/schemaArray"},"oneOf":{"$ref":"#/definitions/schemaArray"},"not":{"$ref":"#"}},"default":true}',
      );
    },
  };
  var r = {};
  function __nccwpck_require__(t) {
    var a = r[t];
    if (a !== undefined) {
      return a.exports;
    }
    var s = (r[t] = { exports: {} });
    var i = true;
    try {
      e[t].call(s.exports, s, s.exports, __nccwpck_require__);
      i = false;
    } finally {
      if (i) delete r[t];
    }
    return s.exports;
  }
  if (typeof __nccwpck_require__ !== 'undefined')
    __nccwpck_require__.ab = __dirname + '/';
  var t = __nccwpck_require__(1489);
  module.exports = t;
})();
