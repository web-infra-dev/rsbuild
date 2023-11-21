import { Common } from '@rsbuild/doctor-types';
import { compileByWebpack5 } from '@rsbuild/test-helper';
import { cloneDeep } from 'lodash';
import path from 'path';
import { test, expect } from '@playwright/test';
import type { NormalModule, WebpackPluginInstance } from 'webpack';
import { createRsbuildDoctorPlugin } from '../test-utils';

const testLoaderPath = path.resolve(
  __dirname,
  '../fixtures/loaders/comment.js',
);

async function webpack(
  compile: typeof compileByWebpack5,
  transformer: (module: NormalModule) => void,
) {
  const file = path.resolve(__dirname, '../fixtures/b.js');

  const beforeTransform = (data: any) => data;
  let beforeTransformRes;
  const afterTransform = (data: any) => data;
  let afterTransformRes;

  /**
   * Based on https://github.com/arco-design/arco-plugins/blob/main/packages/plugin-webpack-react/src/arco-design-plugin/utils/index.ts#L37
   */
  const arcoDesignPluginForked: WebpackPluginInstance = {
    apply(compiler) {
      const pluginName = 'arco-design-plugin-forked';
      const mapper = (module: NormalModule) =>
        module.loaders.map((e) => ({
          loader: e.loader,
          options: cloneDeep(e.options),
        }));
      const hookHandler = (
        context: Common.PlainObject,
        module: NormalModule,
      ) => {
        beforeTransformRes = beforeTransform(mapper(module));
        transformer(module);
        afterTransformRes = afterTransform(mapper(module));
      };
      // @ts-ignore
      compiler.hooks.compilation.tap(pluginName, (compilation) => {
        // for webpack 5
        if (
          compiler.webpack &&
          compiler.webpack.NormalModule &&
          compiler.webpack.NormalModule.getCompilationHooks
        ) {
          compiler.webpack.NormalModule.getCompilationHooks(
            compilation,
          ).loader.tap(pluginName, hookHandler);
        } else if (compilation.hooks) {
          // for webpack 4
          compilation.hooks.normalModuleLoader.tap(pluginName, hookHandler);
        }
      });
    },
  };

  const RsbuildDoctorPlugin = createRsbuildDoctorPlugin({});

  const result = await compile(file, {
    optimization: {
      minimize: true,
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          use: {
            loader: testLoaderPath,
            options: {
              mode: 'callback',
            },
          },
        },
      ],
    },
    plugins: [
      // @ts-ignore
      RsbuildDoctorPlugin,
      // @ts-ignore
      arcoDesignPluginForked,
    ],
  });

  return {
    RsbuildDoctorPlugin,
    loaderData: RsbuildDoctorPlugin.sdk.getStoreData().loader,
    afterTransformRes,
    beforeTransformRes,
  };
}

function createTests(title: string, compile: typeof compileByWebpack5) {
  test(`${title} basic usage`, async () => {
    const { loaderData, beforeTransformRes, afterTransformRes } = await webpack(
      compile,
      () => {},
    );

    expect(beforeTransformRes).toStrictEqual([
      { loader: testLoaderPath, options: { mode: 'callback' } },
    ]);

    expect(afterTransformRes).toStrictEqual([
      { loader: testLoaderPath, options: { mode: 'callback' } },
    ]);

    // test the data from sdk
    const { options, loader } = loaderData[0].loaders[0];
    expect(loader).toEqual(testLoaderPath);
    expect(options).toStrictEqual({ mode: 'callback' });
  });

  test(`${title} overwrite loader options`, async () => {
    const { loaderData, beforeTransformRes, afterTransformRes } = await webpack(
      compile,
      (module) => {
        module.loaders[0].options.mode = 'async';
      },
    );

    expect(beforeTransformRes).toStrictEqual([
      { loader: testLoaderPath, options: { mode: 'callback' } },
    ]);

    expect(afterTransformRes).toStrictEqual([
      { loader: testLoaderPath, options: { mode: 'async' } },
    ]);

    // test the data from sdk
    const { options, loader } = loaderData[0].loaders[0];
    expect(loader).toEqual(testLoaderPath);
    expect(options).toStrictEqual({ mode: 'async' });
  });

  test(`${title} add loader and overwrite options`, async () => {
    const { loaderData, beforeTransformRes, afterTransformRes } = await webpack(
      compile,
      (module) => {
        const originLoaders = cloneDeep(module.loaders);

        originLoaders[0].options.mode = 'async';

        module.loaders = [
          ...originLoaders,
          {
            loader: testLoaderPath,
            options: { pitchResult: '// hello world' },
            ident: null,
            type: null,
          },
        ];
      },
    );

    expect(beforeTransformRes).toStrictEqual([
      { loader: testLoaderPath, options: { mode: 'callback' } },
    ]);

    expect(afterTransformRes).toStrictEqual([
      { loader: testLoaderPath, options: { mode: 'async' } },
      {
        loader: testLoaderPath,
        options: { pitchResult: '// hello world' },
      },
    ]);

    // test the data from sdk
    expect(loaderData[0].loaders).toHaveLength(2);
    expect(loaderData[0].loaders[0].options).toStrictEqual({
      pitchResult: '// hello world',
    });
    expect(loaderData[0].loaders[1].options).toStrictEqual({
      mode: 'async',
    });
  });

  test(`${title} remove all loaders`, async () => {
    const { loaderData, beforeTransformRes, afterTransformRes } = await webpack(
      compile,
      (module) => {
        module.loaders.length = 0;
      },
    );

    expect(beforeTransformRes).toStrictEqual([
      { loader: testLoaderPath, options: { mode: 'callback' } },
    ]);

    expect(afterTransformRes).toStrictEqual([]);

    // test the data from sdk
    expect(loaderData).toHaveLength(0);
  });
}

createTests('[webpack5]', compileByWebpack5);
