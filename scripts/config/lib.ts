import type { LibConfig, Rsbuild } from 'rstack/lib';

export const nodeMinifyConfig = {
  jsOptions: {
    minimizerOptions: {
      // preserve variable name and disable minify for easier debugging
      mangle: false,
      minify: false,
      compress: {
        keep_fnames: true,
      },
    },
  },
} satisfies Rsbuild.Minify;

export const runtimeModeConfig: LibConfig = {
  tools: {
    rspack: {
      experiments: {
        runtimeMode: 'rspack',
      },
    },
  },
};

export const esmConfig: LibConfig = {
  ...runtimeModeConfig,
  syntax: 'es2023',
  dts: {
    isolated: true,
  },
  output: {
    minify: nodeMinifyConfig,
  },
};
