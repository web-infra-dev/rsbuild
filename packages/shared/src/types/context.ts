import type { BuilderEntry, BuilderTarget } from './builder';

export type BundlerType = 'webpack' | 'rspack';

/** The public context */
export type BuilderContext = {
  /** The entry points object. */
  entry: BuilderEntry;
  /** The build target type. */
  target: BuilderTarget | BuilderTarget[];
  /** The root path of current project. */
  rootPath: string;
  /** Absolute path of source files. */
  srcPath: string;
  /** Absolute path of output files. */
  distPath: string;
  /** Absolute path of cache files. */
  cachePath: string;
  /** Absolute path to the config file of hight-level solutions. */
  configPath?: string;
  /** Absolute path of tsconfig.json. */
  tsconfigPath?: string;
  /** Info of dev server  */
  devServer?: {
    hostname: string;
    port: number;
    https: boolean;
  };
  bundlerType: BundlerType;
};
