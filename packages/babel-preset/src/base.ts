import { BabelOptions } from './types';

export type BasePresetOptions = {
  presetTypeScript?: Record<string, unknown> | false;
};

export const generateBaseConfig = (
  options: BasePresetOptions = {},
): BabelOptions => {
  const config: BabelOptions = {
    presets: [],
    plugins: [],
  };
  const { presetTypeScript = {} } = options;

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

  return config;
};
