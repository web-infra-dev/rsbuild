import type { RsbuildEntry, RsbuildTarget } from './rsbuild';

export type BundlerType = 'rspack' | 'webpack';

/** The public context */
export type Context = {
  /** The entry points object. */
  entry: RsbuildEntry;
  /** The build target type. */
  target: RsbuildTarget | RsbuildTarget[];
  /** The root path of current project. */
  rootPath: string;
  /** Absolute path of output files. */
  distPath: string;
  /** Absolute path of cache files. */
  cachePath: string;
  /** Absolute path of tsconfig.json. */
  tsconfigPath?: string;
  /** Info of dev server  */
  devServer?: {
    open?: boolean;
    hostname: string;
    port: number;
    https: boolean;
  };
  bundlerType: BundlerType;
};
