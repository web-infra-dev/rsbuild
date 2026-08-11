import hello from 'esm-pkg';
import undefinedDefault from 'cjs-undefined-pkg';
import { result as staticImportOnlyResult } from 'esm-import-only-pkg/server';

const helloType = typeof hello;
const undefinedType = typeof undefinedDefault;

export { helloType, undefinedType };
export { staticImportOnlyResult };

export const getDynamicImportOnlyResult = async () => {
  const { result } = await import('esm-import-only-pkg/server');
  return result;
};

export const result = helloType === 'function' ? hello() : `BUG: hello is ${helloType}`;
