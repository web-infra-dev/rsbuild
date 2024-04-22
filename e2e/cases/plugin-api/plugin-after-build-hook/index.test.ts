import path from 'node:path';
import { expect, test } from '@playwright/test';
import { type RsbuildPlugin, createRsbuild } from '@rsbuild/core';
import { fse } from '@rsbuild/shared';

const distFile = path.join(__dirname, 'node_modules/hooksTempFile');

const write = (str: string) => {
  let content: string;
  if (fse.existsSync(distFile)) {
    content = `${fse.readFileSync(distFile, 'utf-8')},${str}`;
  } else {
    content = str;
  }
  fse.outputFileSync(distFile, content);
};

const plugin: RsbuildPlugin = {
  name: 'test-plugin',
  setup(api) {
    api.onAfterBuild(async () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          write('1');
          resolve();
        }, 10);
      });
    });
  },
};

test('should run onAfterBuild hooks correctly when have multiple targets', async () => {
  fse.removeSync(distFile);

  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      plugins: [plugin],
      output: {
        targets: ['web', 'node'],
      },
    },
  });

  await rsbuild.build();
  write('2');

  expect(fse.readFileSync(distFile, 'utf-8').split(',')).toEqual(['1', '2']);
});
