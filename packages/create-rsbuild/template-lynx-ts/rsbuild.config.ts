import { defineConfig } from '@rsbuild/core';
import { pluginQRCode } from '@lynx-js/qrcode-rsbuild-plugin';
import { pluginReactLynx } from '@lynx-js/react-rsbuild-plugin';
import { pluginLynx } from '@lynx-js/rsbuild-plugin';

// Docs: https://rsbuild.rs/config/
export default defineConfig({
  environments: {
    lynx: {},
  },
  source: {
    entry: {
      main: './src/index.tsx',
    },
  },
  plugins: [pluginLynx(), pluginReactLynx(), pluginQRCode()],
});
