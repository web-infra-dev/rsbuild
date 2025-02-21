import path from 'node:path';
import { globContentJSON, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import { createRsbuild } from '@rsbuild/core';
import { pluginVue } from '@rsbuild/plugin-vue';

rspackOnlyTest(
  'should register plugins correctly when using JavaScript API',
  async () => {
    const rsbuild = await createRsbuild({
      cwd: __dirname,
      rsbuildConfig: {
        plugins: [pluginVue()],
      },
    });

    await rsbuild.build();

    const outputs = await globContentJSON(path.join(__dirname, 'dist'));
    const outputFiles = Object.keys(outputs);

    expect(
      outputFiles.find((item) => item.includes('index.html')),
    ).toBeTruthy();
    expect(
      outputFiles.find((item) => item.includes('static/js/index.')),
    ).toBeTruthy();
  },
);
