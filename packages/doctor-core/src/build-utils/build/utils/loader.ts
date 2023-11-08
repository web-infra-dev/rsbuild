import { getOptions } from 'loader-utils';
import path from 'path';
import { omit } from 'lodash';
import { Loader } from '@rsbuild/doctor-utils';
import type { Common, Plugin } from '@rsbuild/doctor-types';
import { Rule, SourceMapInput as WebpackSourceMapInput } from '../../../types';

export function loadLoaderModule(
  p: string,
  cwd = process.cwd(),
): {
  default: Plugin.LoaderDefinition<Common.PlainObject, {}>;
  pitch: Plugin.PitchLoaderDefinitionFunction;
  raw: boolean | void;
} {
  const mod = require(
    process.env.DOCTOR_TEST
      ? path.resolve(cwd, p)
      : require.resolve(p, {
          paths: [cwd, path.resolve(cwd, 'node_modules')],
        }),
  );

  const isESM = mod.__esModule && typeof mod.default === 'function';

  return {
    default: isESM ? mod.default : typeof mod === 'function' ? mod : null,
    pitch: mod.default?.pitch || mod.pitch,
    raw: mod.default?.raw || mod.raw || false,
  };
}

export function getLoaderOptions<T>(loaderContext: Plugin.LoaderContext<T>) {
  // webpack5
  if (typeof loaderContext.getOptions === 'function') {
    return loaderContext.getOptions();
  }

  // webpack4
  return getOptions(loaderContext as any) as unknown as Readonly<T>;
}

export function extractLoaderName(loaderPath: string, cwd = ''): string {
  let res = loaderPath.replace(cwd, '');

  if (!path.isAbsolute(res)) return res;

  const nms = '/node_modules/';
  const idx = res.lastIndexOf(nms);

  if (idx !== -1) {
    // babel-loader/lib/index.js
    res = res.slice(idx + nms.length);

    const ln = 'loader';
    const lnIdx = res.lastIndexOf(ln);
    if (lnIdx > -1) {
      // babel-loader
      res = res.slice(0, lnIdx + ln.length);
    }
  }

  return res;
}

export function mapEachRules<T extends Plugin.BuildRuleSetRule>(
  rules: T[],
  callback: (rule: T) => T,
): T[] {
  return rules.map((rule, i) => {
    if (typeof rule === 'string') {
      return callback({
        loader: rule,
      } as unknown as T);
    }

    // https://webpack.js.org/configuration/module/#ruleloader
    if (rule.loader && typeof rule.loader === 'string') {
      return callback(rule);
    }

    // https://webpack.js.org/configuration/module/#ruleloaders
    if (Array.isArray((rule as unknown as Rule).loaders)) {
      const { loaders, ...rest } = rule as unknown as Rule;
      return {
        ...(rest as Plugin.RuleSetRule),
        use: mapEachRules(loaders as T[], callback),
      } as unknown as T;
    }

    if (rule.use) {
      if (typeof rule.use === 'string') {
        return {
          ...rule,
          use: mapEachRules(
            [
              {
                loader: rule.use,
                options: rule.options,
              } as T,
            ],
            callback,
          ),
        };
      }

      if (Array.isArray(rule.use)) {
        return {
          ...rule,
          use: mapEachRules(rule.use as T[], callback),
        };
      }
      return {
        ...rule,
        use: mapEachRules([rule.use] as T[], callback),
      };

      throw new Error(
        `webpack.module.rules.use[${i}] parse error: ${rule.use}`,
      );
    }

    // nested rule, https://webpack.js.org/configuration/module/#nested-rules
    if ('rules' in rule && Array.isArray(rule.rules)) {
      return {
        ...rule,
        rules: mapEachRules(rule.rules as T[], callback),
      };
    }

    // nested rule
    if (Array.isArray(rule.oneOf)) {
      return {
        ...rule,
        oneOf: mapEachRules(rule.oneOf as T[], callback),
      };
    }

    return rule;
  });
}

export function createLoaderContextTrap(
  this: Plugin.LoaderContext<Common.PlainObject>,
  final: (
    err: Error | null | undefined,
    res: string | Buffer | null,
    sourceMap?: WebpackSourceMapInput,
  ) => void,
) {
  // callback
  const cb = this.callback;
  let callback: typeof this.callback = (...args: any[]) => {
    final(args[0], args[1] ?? null, args[2]);
    return cb.call(this, ...args);
  };
  // async
  const ac = this.async;
  let async: typeof this.async = (...args) => {
    const cb = ac(...args);
    return (...args) => {
      final(args[0], args[1] ?? null, args[2]);
      return cb(...args);
    };
  };

  // proxy loader context for async loader function.
  const trap = new Proxy(this, {
    get(target, key, receiver) {
      switch (key) {
        case 'async':
          return async;
        case 'callback':
          return callback;
        case 'query':
          if (target.query) {
            // avoid loader options validation error.
            if (typeof target.query === 'string') {
              const res = target.query.replace(
                // eslint-disable-next-line no-useless-escape
                new RegExp(
                  `"${Loader.LoaderInternalPropertyName}":\{[^\}]*\},{0,1}`,
                ),
                '',
              );
              return res;
            }

            if (typeof target.query === 'object') {
              const options = target.query[Loader.LoaderInternalPropertyName];

              // webpack4 https://v4.webpack.js.org/api/loaders/#thisquery
              // webpack5 https://webpack.js.org/api/loaders/#thisquery
              if (options.hasOptions) {
                return omit(target.query, [Loader.LoaderInternalPropertyName]);
              }
              return target.resourceQuery;
            }
          }

          return Reflect.get(target, key, receiver);
        case 'getOptions':
          // avoid loader options validation error.
          return typeof target.getOptions === 'function'
            ? () =>
                omit(target.getOptions(), [Loader.LoaderInternalPropertyName])
            : Reflect.get(target, key, receiver);
        default:
          const _target = target as unknown as Record<string | symbol, unknown>;
          return _target[key];
      }
    },
    set(target, key, value, receiver) {
      switch (key) {
        // avoid to be called in infinite loop when other overwrite Plugin.LoaderContext.callback
        case 'async':
          async = value;
          return true;
        case 'callback':
          callback = value;
          return true;
        default:
          return Reflect.set(target, key, value, receiver);
      }
    },
    defineProperty(target, p, attrs) {
      return Reflect.defineProperty(target, p, attrs);
    },
  });

  return trap;
}
