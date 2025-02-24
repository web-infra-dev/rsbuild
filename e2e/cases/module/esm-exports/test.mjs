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
import { pluginSwc } from '@rsbuild/plugin-webpack-swc';
import { webpackProvider } from '@rsbuild/webpack';

export default {
  pluginBabel,
  pluginLess,
  pluginReact,
  pluginPreact,
  pluginSvgr,
  pluginSass,
  pluginSolid,
  pluginStylus,
  pluginSvelte,
  pluginVue,
  pluginSwc,
  webpackProvider,
};
