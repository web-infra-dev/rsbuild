import path from 'node:path';
import { expect, readDirContents, rspackTest } from '@e2e/helper';
import { createRsbuild } from '@rsbuild/core';
import { pluginVue } from '@rsbuild/plugin-vue';

rspackTest(
  'should register plugins correctly when using JavaScript API',
  async () => {
    const rsbuild = await createRsbuild({
      cwd: __dirname,
      rsbuildConfig: {
        plugins: [pluginVue()],
      },
    });

    await rsbuild.build();

    const outputs = await readDirContents(path.join(__dirname, 'dist'));
    const outputFiles = Object.keys(outputs);

    expect(
      outputFiles.find((item) => item.includes('index.html')),
    ).toBeTruthy();
    expect(
      outputFiles.find((item) => item.includes('static/js/index.')),
    ).toBeTruthy();
  },
);
