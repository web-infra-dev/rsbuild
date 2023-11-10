import { Loader } from '@rsbuild/doctor-utils/common';

export interface ProxyLoaderInternalOptions {
  cwd: string;
  /**
   * the url host of http server(which used to collect data).
   */
  host: string;
  /**
   * correct loader path.
   */
  loader: string;
  /** include the loader option */
  hasOptions: boolean;
  skipLoaders: string[];
}

export interface ProxyLoaderOptions {
  [key: string]: any;
  [Loader.LoaderInternalPropertyName]: ProxyLoaderInternalOptions;
}
