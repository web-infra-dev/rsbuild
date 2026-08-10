import {
  defineConfig,
  type RsbuildConfig,
  type RsbuildConfigAsyncFn,
  type RsbuildConfigDefinition,
  type RsbuildConfigSyncFn,
} from '@rsbuild/core';

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

export const objectConfig: RsbuildConfig = defineConfig({
  mode: 'production',
});

export const syncConfig: RsbuildConfigSyncFn = defineConfig(() => ({
  mode: 'production',
}));

export const asyncConfig: RsbuildConfigAsyncFn = defineConfig(async () => ({
  mode: 'production',
}));

declare const dynamicDefinition: RsbuildConfigDefinition;
defineConfig(dynamicDefinition);
