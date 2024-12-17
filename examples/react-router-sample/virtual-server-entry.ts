import type { ServerBuild } from 'react-router';
import * as userServerEntry from './entry.server';

export const entry: ServerBuild['entry'] = {
  module: userServerEntry,
};

export const routes: ServerBuild['routes'] = {
  root: {
    id: 'root',
    parentId: undefined,
    path: '',
    index: undefined,
    caseSensitive: undefined,
    module: {
      action: async () => ({}),
      loader: async () => ({}),
      default: () => null,
      ErrorBoundary: () => null,
      handle: {},
      links: () => [],
      meta: () => [
        {
          title: 'App Title',
        },
      ],
    },
  },
  'routes/about': {
    id: 'routes/about',
    parentId: 'root',
    path: 'about',
    index: undefined,
    caseSensitive: undefined,
    module: {
      action: async () => ({}),
      loader: async () => ({}),
      default: () => null,
    },
  },
  'routes/about.index': {
    id: 'routes/about.index',
    parentId: 'routes/about',
    path: undefined,
    index: true,
    caseSensitive: undefined,
    module: {
      loader: async () => ({}),
      default: () => null,
    },
  },
};
export const assets: ServerBuild['assets'] = {
  entry: { imports: [], module: '/build/entry.client-ABC123.js' },
  routes: {
    root: {
      id: 'root',
      parentId: undefined,
      path: '',
      index: undefined,
      caseSensitive: undefined,
      module: '/build/root-XYZ789.js',
      imports: ['/build/shared-DEF456.js'],
      hasAction: false,
      hasLoader: true,
      hasClientAction: false,
      hasClientLoader: false,
      hasErrorBoundary: true,
    },
    'routes/about': {
      id: 'routes/about',
      parentId: 'root',
      path: 'about',
      index: undefined,
      caseSensitive: undefined,
      module: '/build/routes/about-GHI123.js',
      imports: [],
      hasAction: false,
      hasLoader: true,
      hasClientAction: false,
      hasClientLoader: false,
      hasErrorBoundary: false,
    },
  },
  url: '/build/manifest-JKL456.js',
  version: '1',
};
export const publicPath: ServerBuild['publicPath'] = '/';
export const assetsBuildDirectory: ServerBuild['assetsBuildDirectory'] = '';
export const future: ServerBuild['future'] = {};
export const isSpaMode: ServerBuild['isSpaMode'] = false;
export const basename: ServerBuild['basename'] = undefined;
