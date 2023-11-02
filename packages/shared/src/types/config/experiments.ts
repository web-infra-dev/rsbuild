export interface ExperimentsConfig {
  /**
   * Enable lazy compilation, compile dynamic imports only when they are in use.
   */
  lazyCompilation?:
    | boolean
    | {
        entries?: boolean;
        imports?: boolean;
      };
}

export type NormalizedExperimentsConfig = ExperimentsConfig;
