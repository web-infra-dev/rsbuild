import { defineConfig } from '@rsbuild/core';

defineConfig({
  mode: 'production',
});

defineConfig(() => ({
  mode: 'production',
}));

defineConfig(async () => ({
  mode: 'production',
}));

// @ts-expect-error invalid mode
defineConfig(async () => ({
  mode: 'invalid',
}));
