import type fs from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@e2e/helper';
import type { RsbuildPlugin, Rspack } from '@rsbuild/core';

test('should retain only recent HMR updates and lazy chunks', async ({
  dev,
  page,
  copySrcDir,
  editFile,
}) => {
  const entry = join(await copySrcDir(), 'index.js');
  let compiler!: Rspack.Compiler;
  await dev({
    config: {
      source: { entry: { index: entry } },
      tools: {
        rspack(_config, { appendPlugins }) {
          appendPlugins({
            apply(value: Rspack.Compiler) {
              compiler = value;
            },
          });
        },
      },
    },
  });
  await page.evaluate('window.hmrState = 123');

  for (let version = 1; version <= 3; version++) {
    await editFile(entry, (code) =>
      code
        .replace(`version=${version - 1}`, `version=${version}`)
        .replace(`>${version - 1}<`, `>${version}<`),
    );
    await expect(page.locator('#test')).toHaveText(String(version));
  }

  const outputFileSystem = compiler.outputFileSystem as typeof fs;
  const updates = outputFileSystem.readdirSync(
    join(compiler.outputPath, 'updates'),
  );
  const chunks = outputFileSystem.readdirSync(
    join(compiler.outputPath, 'static/js/async'),
  );

  // Retain two updates and two lazy chunks, including their source maps.
  expect(updates.filter((name) => name.endsWith('.json'))).toHaveLength(2);
  expect(updates.length).toBeLessThanOrEqual(6);
  expect(chunks.length).toBeLessThanOrEqual(4);
  expect(await page.evaluate('window.hmrState')).toBe(123);
});

test('should preserve assets still owned by another environment', async ({
  dev,
  page,
  copySrcDir,
  editFile,
}) => {
  const src = await copySrcDir();
  const entry = join(src, 'index.js');
  let emitSharedAsset = true;
  const { port } = await dev({
    config: {
      environments: {
        web: { source: { entry: { index: entry } } },
        other: { source: { entry: { other: join(src, 'other.js') } } },
      },
      plugins: [
        {
          name: 'shared-asset',
          setup(api) {
            api.processAssets(
              { stage: 'additional' },
              ({ compilation, sources, environment }) => {
                if (environment.name === 'other' || emitSharedAsset) {
                  compilation.emitAsset(
                    'shared.txt',
                    new sources.RawSource('shared'),
                  );
                }
              },
            );
          },
        } satisfies RsbuildPlugin,
      ],
    },
  });

  emitSharedAsset = false;
  for (let version = 1; version <= 2; version++) {
    await editFile(entry, (code) =>
      code.replace(`>${version - 1}<`, `>${version}<`),
    );
    await expect(page.locator('#test')).toHaveText(String(version));
  }

  const response = await page.request.get(
    `http://localhost:${port}/shared.txt`,
  );
  expect(await response.text()).toBe('shared');
});
