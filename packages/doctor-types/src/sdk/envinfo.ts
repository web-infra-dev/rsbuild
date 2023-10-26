export interface EnvInfo {
  /**
   * @example "macOS 11.4"
   */
  os: string;
  /**
   * @example "(12) x64 Intel(R) Core(TM) i7-9750H CPU @ 2.60GHz"
   */
  cpu: string;
  /**
   * @example "1.07 GB / 32.00 GB"
   */
  memory: string;
  nodeVersion: string;
  yarnVersion: string;
  npmVersion: string;
  pnpmVersion: string;

  [key: string]: string;
}
