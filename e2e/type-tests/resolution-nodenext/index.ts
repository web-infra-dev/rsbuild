// This folder disables `skipLibCheck` to check the public types of @rsbuild/core.
import '@rsbuild/core/types';
import { createRsbuild, defineConfig } from '@rsbuild/core';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginLess } from '@rsbuild/plugin-less';
import { pluginPreact } from '@rsbuild/plugin-preact';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSass } from '@rsbuild/plugin-sass';
import { pluginSolid } from '@rsbuild/plugin-solid';
import { pluginStylus } from '@rsbuild/plugin-stylus';
import { pluginSvelte } from '@rsbuild/plugin-svelte';
import { pluginSvgr } from '@rsbuild/plugin-svgr';
import { pluginVue } from '@rsbuild/plugin-vue';

const plugins = [
  pluginBabel(),
  pluginLess(),
  pluginPreact(),
  pluginReact(),
  pluginSass(),
  pluginSolid(),
  pluginStylus(),
  pluginSvelte(),
  pluginSvgr(),
  pluginVue(),
];

createRsbuild({
  config: {
    plugins,
  },
});

defineConfig({ plugins });
