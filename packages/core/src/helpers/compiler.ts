import { DEFAULT_ASSET_PREFIX } from '../constants';
import type { Rspack } from '../types';

export const isMultiCompiler = (
  compiler: Rspack.Compiler | Rspack.MultiCompiler,
): compiler is Rspack.MultiCompiler => {
  return 'compilers' in compiler && Array.isArray(compiler.compilers);
};

export const getPublicPathFromCompiler = (
  compiler: Rspack.Compiler | Rspack.Compilation,
): string => {
  const { publicPath } = compiler.options.output;

  if (typeof publicPath === 'string') {
    // 'auto' is a magic value in Rspack and behave like `publicPath: ""`
    if (publicPath === 'auto') {
      return '';
    }
    return publicPath.endsWith('/') ? publicPath : `${publicPath}/`;
  }

  // publicPath function is not supported yet, fallback to default value
  return DEFAULT_ASSET_PREFIX;
};

export const applyToCompiler = (
  compiler: Rspack.Compiler | Rspack.MultiCompiler,
  apply: (c: Rspack.Compiler, index: number) => void,
): void => {
  if (isMultiCompiler(compiler)) {
    compiler.compilers.forEach(apply);
  } else {
    apply(compiler, 0);
  }
};
