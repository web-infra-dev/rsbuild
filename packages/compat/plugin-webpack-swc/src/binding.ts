import { type Output, Compiler as RawCompiler } from '@modern-js/swc-plugins';
import type { TransformConfig } from './types.js';

export {
  minify,
  minifySync,
  minifyCss,
  minifyCssSync,
} from '@modern-js/swc-plugins';

export class Compiler extends RawCompiler {
  config: TransformConfig;

  constructor(finalConfig: TransformConfig) {
    super(finalConfig);
    this.config = finalConfig;
  }
}

export function transformSync(
  config: Required<TransformConfig>,
  filename: string,
  code: string,
  map?: string,
): Output {
  const compiler = new Compiler(config);

  return compiler.transformSync(filename, code, map);
}

export function transform(
  config: Required<TransformConfig>,
  filename: string,
  code: string,
  map?: string,
): Promise<Output> {
  let compiler: Compiler;
  try {
    compiler = new Compiler(config);
  } catch (e) {
    throw new Error(
      `[rsbuild:plugin-webpack-swc] Failed to initialize config: \n${e}`,
    );
  }
  return compiler.transform(filename, code, map);
}
