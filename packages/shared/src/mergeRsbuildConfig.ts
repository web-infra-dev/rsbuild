import _ from '@modern-js/utils/lodash';
import { isFunction, isUndefined } from './utils';
import { isOverriddenConfigKey } from '@modern-js/utils';

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
        return [..._.castArray(target), ..._.castArray(source)];
      }
      // convert function to chained function
      if (pair.some(isFunction)) {
        return [target, source];
      }
      // fallback to lodash default merge behavior
      return undefined;
    },
  );
