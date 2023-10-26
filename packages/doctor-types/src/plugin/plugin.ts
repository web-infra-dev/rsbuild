export interface DoctorWebpackPluginFeatures {
  /**
   * turn off it if you need not to analyze the executions of webpack loaders.
   * @default true
   */
  loader?: boolean;
  /**
   * turn off it if you need not to analyze the executions of webpack plugins.
   * @default true
   */
  plugins?: boolean;
  /**
   * turn off it if you need not to analyze the executions of resolver.
   * @default false
   */
  resolver?: boolean;
  /**
   * turn off it if you need not to analyze the output bundle.
   * @default true
   */
  bundle?: boolean;
  /**
   * turn off it if you need not to analyze the result of tree shaking.
   * @default false
   */
  treeShaking?: boolean;
  /**
   * turn on it if you just use lite mode. This mode do not have source codes.
   * @default false
   */
  lite?: boolean;
}
