import type { Configuration } from 'webpack';

export interface WebpackConfigData {
  name: 'webpack';
  version: string | number;
  bin?: string;
  config: Configuration;
}

export type ConfigData = WebpackConfigData[];
