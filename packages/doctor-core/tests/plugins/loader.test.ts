import { Loader } from '@rsbuild/doctor-utils/common';
import { describe, it, expect } from 'vitest';
import path from 'path';
import { ProxyLoaderInternalOptions } from '@/types';
import { interceptLoader } from '@/inner-plugins/utils';

describe('test src/utils/loader.ts', () => {
  describe('interceptLoader()', () => {
    const babelLoader = 'babel-loader';
    const stringLoader = 'string-loader';
    const tsLoader = 'ts-loader';
    const resolvedBabelLoader = require.resolve(babelLoader);
    const resolvedStringLoader = require.resolve(stringLoader);
    const exampleWebpackPath = path.resolve(__dirname, '../../../compat/webpack');
    const resolvedTsLoader = require.resolve(tsLoader, {
      paths: [exampleWebpackPath],
    });
    const proxyLoaderPath = path.resolve(__dirname, '../../src/loaders/proxy.ts');
    const internalOptions: Omit<ProxyLoaderInternalOptions, 'loader' | 'hasOptions'> = {
      cwd: __dirname,
      host: 'http://localhost:3000',
      skipLoaders: ['a', 'b'],
    };

    it('[string] rule.loader', () => {
      expect(
        interceptLoader(
          [
            {
              test: /\.js$/,
              loader: babelLoader,
              options: {
                a: 1,
              },
            },
          ],
          proxyLoaderPath,
          internalOptions,
          path.join(__dirname, '../../')
        ),
      ).toStrictEqual([
        {
          test: /\.js$/,
          loader: proxyLoaderPath,
          options: {
            a: 1,
            [Loader.LoaderInternalPropertyName]: {
              ...internalOptions,
              hasOptions: true,
              loader: resolvedBabelLoader,
            },
          },
        },
      ]);
    });

    it('[Array] rule.loaders', () => {
      expect(
        interceptLoader(
          [
            {
              test: /\.js$/,
              loaders: [
                {
                  loader: babelLoader,
                  options: {
                    aa: 1,
                  },
                },
              ],
            },
          ],
          proxyLoaderPath,
          internalOptions,
          path.join(__dirname, '../../')
        ),
      ).toStrictEqual([
        {
          test: /\.js$/,
          use: [
            {
              loader: proxyLoaderPath,
              options: {
                aa: 1,
                [Loader.LoaderInternalPropertyName]: {
                  ...internalOptions,
                  hasOptions: true,
                  loader: resolvedBabelLoader,
                },
              },
            },
          ],
        },
      ]);
    });

    it('[String] rule.use', () => {
      expect(
        interceptLoader(
          [
            {
              test: /\.js$/,
              use: [babelLoader],
            },
          ],
          proxyLoaderPath,
          internalOptions,
          path.join(__dirname, '../../')
        ),
      ).toStrictEqual([
        {
          test: /\.js$/,
          use: [
            {
              loader: proxyLoaderPath,
              options: {
                [Loader.LoaderInternalPropertyName]: {
                  ...internalOptions,
                  hasOptions: false,
                  loader: resolvedBabelLoader,
                },
              },
            },
          ],
        },
      ]);
    });

    it('[Array] rule.use', () => {
      expect(
        interceptLoader(
          [
            {
              test: /\.js$/,
              use: [
                {
                  loader: babelLoader,
                  options: {
                    aa: 1,
                  },
                },
                stringLoader,
              ],
            },
          ],
          proxyLoaderPath,
          internalOptions,
          path.join(__dirname, '../../')
        ),
      ).toStrictEqual([
        {
          test: /\.js$/,
          use: [
            {
              loader: proxyLoaderPath,
              options: {
                aa: 1,
                [Loader.LoaderInternalPropertyName]: {
                  ...internalOptions,
                  hasOptions: true,
                  loader: resolvedBabelLoader,
                },
              },
            },
            {
              loader: proxyLoaderPath,
              options: {
                [Loader.LoaderInternalPropertyName]: {
                  ...internalOptions,
                  hasOptions: false,
                  loader: resolvedStringLoader,
                },
              },
            },
          ],
        },
      ]);
    });

    it('[Array] rule.rules', () => {
      expect(
        interceptLoader(
          [
            {
              test: /\.js$/,
              rules: [
                {
                  test: /a/,
                  use: [babelLoader],
                },
              ],
            },
          ],
          proxyLoaderPath,
          internalOptions,
          path.join(__dirname, '../../')
        ),
      ).toStrictEqual([
        {
          test: /\.js$/,
          rules: [
            {
              test: /a/,
              use: [
                {
                  loader: proxyLoaderPath,
                  options: {
                    [Loader.LoaderInternalPropertyName]: {
                      ...internalOptions,
                      hasOptions: false,
                      loader: resolvedBabelLoader,
                    },
                  },
                },
              ],
            },
          ],
        },
      ]);
    });

    it('[Array] rule.oneOf', () => {
      expect(
        interceptLoader(
          [
            {
              test: /\.js$/,
              oneOf: [
                {
                  test: /a/,
                  use: [babelLoader],
                },
                {
                  test: /b/,
                  use: [babelLoader],
                },
              ],
            },
          ],
          proxyLoaderPath,
          internalOptions,
          path.join(__dirname, '../../')
        ),
      ).toStrictEqual([
        {
          test: /\.js$/,
          oneOf: [
            {
              test: /a/,
              use: [
                {
                  loader: proxyLoaderPath,
                  options: {
                    [Loader.LoaderInternalPropertyName]: {
                      ...internalOptions,
                      hasOptions: false,
                      loader: resolvedBabelLoader,
                    },
                  },
                },
              ],
            },
            {
              test: /b/,
              use: [
                {
                  loader: proxyLoaderPath,
                  options: {
                    [Loader.LoaderInternalPropertyName]: {
                      ...internalOptions,
                      hasOptions: false,
                      loader: resolvedBabelLoader,
                    },
                  },
                },
              ],
            },
          ],
        },
      ]);
    });

    it('[string] rule.loader with resolveOptions', () => {
      expect(
        interceptLoader(
          [
            {
              test: /\.ts$/,
              loader: tsLoader,
              options: {
                a: 1,
              },
            },
          ],
          proxyLoaderPath,
          internalOptions,
          undefined,
          {
            modules: [path.join(exampleWebpackPath, 'node_modules')],
          },
        ),
      ).toStrictEqual([
        {
          test: /\.ts$/,
          loader: proxyLoaderPath,
          options: {
            a: 1,
            [Loader.LoaderInternalPropertyName]: {
              ...internalOptions,
              hasOptions: true,
              loader: resolvedTsLoader,
            },
          },
        },
      ]);
    });

    it('builtin:swc-loader test', () => {
      expect(
        interceptLoader(
          [
            {
              test: /\.jsx$/,
              use: {
                loader: 'builtin:swc-loader',
                options: {
                  sourceMap: true,
                  jsc: {
                    parser: {
                      syntax: 'ecmascript',
                      jsx: true,
                    },
                    transform: {
                      react: {
                        pragma: 'React.createElement',
                        pragmaFrag: 'React.Fragment',
                        throwIfNamespace: true,
                        development: false,
                        useBuiltins: false,
                      },
                    },
                  },
                },
              },
            },
          ],
          proxyLoaderPath,
          internalOptions,
        ),
      ).toStrictEqual([
        {
          test: /\.jsx$/,
          use: [
            {
              loader: 'builtin:swc-loader',
              options: {
                sourceMap: true,
                jsc: {
                  parser: {
                    syntax: 'ecmascript',
                    jsx: true,
                  },
                  transform: {
                    react: {
                      pragma: 'React.createElement',
                      pragmaFrag: 'React.Fragment',
                      throwIfNamespace: true,
                      development: false,
                      useBuiltins: false,
                    },
                  },
                },
              },
            },
          ],
        },
      ]);
    });
  });
});
