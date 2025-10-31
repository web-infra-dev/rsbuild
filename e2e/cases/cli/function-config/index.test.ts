import path from 'node:path';
import {
  expect,
  getFileContent,
  readDirContents,
  rspackTest,
} from '@e2e/helper';
import { remove } from 'fs-extra';

const distDir = path.join(__dirname, 'dist');

rspackTest(
  'should support exporting a function from the config file',
  async ({ execCliSync }) => {
    await remove(distDir);
    execCliSync('build');
    const files = await readDirContents(distDir);
    const content = getFileContent(files, 'index.js');
    expect(content.includes('production-production-build')).toBeTruthy();
  },
);

rspackTest('should specify env as expected', async ({ execCliSync }) => {
  await remove(distDir);
  execCliSync('build', {
    env: {
      ...process.env,
      NODE_ENV: 'development',
    },
  });
  const files = await readDirContents(distDir);
  const content = getFileContent(files, 'index.js');
  expect(content.includes('development-development-build')).toBeTruthy();
});

rspackTest('should specify env mode as expected', async ({ execCliSync }) => {
  await remove(distDir);
  execCliSync('build --env-mode staging');
  const files = await readDirContents(distDir);
  const content = getFileContent(files, 'index.js');
  expect(content.includes('production-staging-build')).toBeTruthy();
});
