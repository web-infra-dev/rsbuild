import type webpack from 'webpack';
import type { WebpackChain } from '@rsbuild/shared';
import type { Configuration as WebpackConfig } from 'webpack';

export * from './plugin';
export * from './context';

export type { webpack, WebpackChain, WebpackConfig };
