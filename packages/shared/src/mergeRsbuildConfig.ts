import _ from 'lodash';
import { castArray, isFunction, isUndefined } from './utils';

/**
 * When merging config, some properties prefer `override` rather than `merge to array`
 */
export const isOverriddenConfigKey = (key: string) =>
  [
    // performance.removeConsole
    'removeConsole',
    // output.inlineScripts
    'inlineScripts',
    // output.inlineStyles
    'inlineStyles',
    // cssModules.auto
    'auto',
    // output.targets
    'targets',
    // server.printUrls
    'printUrls',
  ].includes(key);

export const mergeRsbuildConfig = <T>(...configs: T[]): T =>
  _.mergeWith(
    {},
    ...configs,
    (target: unknown, source: unknown, key: string) => {
      const pair = [target, source];
      if (pair.some(isUndefined)) {
        // fallback to lodash default merge behavior
        return undefined;
      }

      // Some keys should use source to override target
      if (isOverriddenConfigKey(key)) {
        return source ?? target;
      }

      if (pair.some(Array.isArray)) {
        return [...castArray(target), ...castArray(source)];
      }
      // convert function to chained function
      if (pair.some(isFunction)) {
        return [target, source];
      }
      // fallback to lodash default merge behavior
      return undefined;
    },
  );
