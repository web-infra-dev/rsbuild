import deepmerge from 'deepmerge';

export { deepmerge };

export const cloneDeep = <T>(value: T): T => deepmerge({}, value);
