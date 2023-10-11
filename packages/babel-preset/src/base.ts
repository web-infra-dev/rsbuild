import type { BabelConfig, BasePresetOptions } from './types';

export const generateBaseConfig = (
  options: BasePresetOptions = {},
): BabelConfig => {
  const config: BabelConfig = {
    presets: [],
    plugins: [],
  };

  const {
    presetEnv = {},
    presetTypeScript = {},
    pluginDecorators = false,
    pluginTransformRuntime = {},
  } = options;

  if (presetEnv) {
    config.presets?.push([
      require.resolve('@babel/preset-env'),
      {
        modules: false,
        exclude: ['transform-typeof-symbol'],
        ...presetEnv,
      },
    ]);
  }

  if (presetTypeScript) {
    config.presets?.push([
      require.resolve('@babel/preset-typescript'),
      {
        isTSX: true,
        allExtensions: true,
        allowNamespaces: true,
        allowDeclareFields: true,
        // aligns Babel's behavior with TypeScript's default behavior.
        // https://babeljs.io/docs/en/babel-preset-typescript#optimizeconstenums
        optimizeConstEnums: true,
        ...presetTypeScript,
      },
    ]);
  }

  if (pluginTransformRuntime) {
    config.plugins?.push([
      require.resolve('@babel/plugin-transform-runtime'),
      {
        version: require('@babel/runtime/package.json').version,
      },
    ]);
  }

  if (pluginDecorators) {
    // link: https://github.com/tc39/proposal-decorators
    config.plugins?.push([
      require.resolve('@babel/plugin-proposal-decorators'),
      {
        version: pluginDecorators.version,
        // decoratorsBeforeExport property is not allowed when version is legacy
        ...(pluginDecorators.version === '2018-09'
          ? { decoratorsBeforeExport: true }
          : {}),
      },
    ]);
  }

  config.plugins?.push(
    // Stage 1
    // link: https://github.com/tc39/proposal-export-default-from
    require.resolve('@babel/plugin-proposal-export-default-from'),
    // Stage 1
    // link: https://github.com/tc39/proposal-partial-application
    require.resolve('@babel/plugin-proposal-partial-application'),
    // Stage 2
    // link: https://github.com/tc39/proposal-pipeline-operator
    [
      require.resolve('@babel/plugin-proposal-pipeline-operator'),
      { proposal: 'minimal' },
    ],
  );

  return config;
};
