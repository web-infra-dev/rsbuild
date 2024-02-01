import { join, resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { build } from '@e2e/helper';
import { pluginReact } from '@rsbuild/plugin-react';

const fixtures = __dirname;

test.describe('performance configure multi', () => {
  let files: Record<string, string>;
  const basicFixtures = resolve(__dirname, 'basic');

  test.beforeAll(async () => {
    const rsbuild = await build({
      cwd: basicFixtures,
      plugins: [pluginReact()],
      rsbuildConfig: {
        output: {
          distPath: {
            root: 'dist-1',
          },
        },
        performance: {
          chunkSplit: {
            strategy: 'all-in-one',
          },
        },
      },
    });

    files = await rsbuild.unwrapOutputJSON();
  });

  test('chunkSplit all-in-one', async () => {
    // expect only one bundle (end with .js)
    const filePaths = Object.keys(files).filter((file) => file.endsWith('.js'));

    expect(filePaths.length).toBe(1);
  });
});

test('should generate preconnect link when preconnect is defined', async () => {
  const rsbuild = await build({
    cwd: join(fixtures, 'basic'),
    plugins: [pluginReact()],
    rsbuildConfig: {
      performance: {
        preconnect: [
          {
            href: 'http://aaaa.com',
          },
          {
            href: 'http://bbbb.com',
            crossorigin: true,
          },
        ],
      },
    },
  });

  const files = await rsbuild.unwrapOutputJSON();

  const [, content] = Object.entries(files).find(([name]) =>
    name.endsWith('.html'),
  )!;

  expect(
    content.includes('<link rel="preconnect" href="http://aaaa.com">'),
  ).toBeTruthy();

  expect(
    content.includes(
      '<link rel="preconnect" href="http://bbbb.com" crossorigin>',
    ),
  ).toBeTruthy();
});

test('should generate dnsPrefetch link when dnsPrefetch is defined', async () => {
  const rsbuild = await build({
    cwd: join(fixtures, 'basic'),
    plugins: [pluginReact()],
    rsbuildConfig: {
      performance: {
        dnsPrefetch: ['http://aaaa.com'],
      },
    },
  });

  const files = await rsbuild.unwrapOutputJSON();

  const [, content] = Object.entries(files).find(([name]) =>
    name.endsWith('.html'),
  )!;

  expect(
    content.includes('<link rel="dns-prefetch" href="http://aaaa.com">'),
  ).toBeTruthy();
});
