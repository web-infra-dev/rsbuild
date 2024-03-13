import fs from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSvgr } from '@rsbuild/plugin-svgr';

const nodeModulesPath = join(__dirname, '../../../node_modules');
const reactCode = fs.readFileSync(
  join(nodeModulesPath, 'react/umd/react.production.min.js'),
  'utf-8',
);
const reactDomCode = fs.readFileSync(
  join(nodeModulesPath, 'react-dom/umd/react-dom.production.min.js'),
  'utf-8',
);

export default defineConfig({
  plugins: [pluginReact(), pluginSvgr()],
  output: {
    externals: {
      react: 'React',
      'react-dom': 'ReactDOM',
    },
  },
  html: {
    tags: [
      {
        tag: 'script',
        head: true,
        append: false,
        children: reactCode,
      },
      {
        tag: 'script',
        head: true,
        append: false,
        children: reactDomCode,
      },
    ],
    template: './static/index.html',
  },
});
