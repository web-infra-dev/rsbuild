import type fs from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@e2e/helper';
import type { RsbuildPlugin, Rspack } from '@rsbuild/core';
import { rs } from 'rstack/test';

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
      source: {
        entry: { index: entry },
      },
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

  const editVersion = async (version: number) => {
    await editFile(entry, (code) =>
      code
        .replace(`version=${version - 1}`, `version=${version}`)
        .replace(`>${version - 1}<`, `>${version}<`),
    );
    await expect(page.locator('#test')).toHaveText(String(version));
  };

  const outputFileSystem = compiler.outputFileSystem as typeof fs;
  const updatesDir = join(compiler.outputPath, 'updates');
  for (let version = 1; version <= 3; version++) {
    await editVersion(version);
  }
  expect(
    outputFileSystem
      .readdirSync(updatesDir)
      .filter((name) => name.endsWith('.json')),
  ).toHaveLength(3);

  using _clock = advanceGracePeriod();
  await editVersion(4);
  const updates = outputFileSystem.readdirSync(updatesDir);
  const chunks = outputFileSystem.readdirSync(
    join(compiler.outputPath, 'static/js/async'),
  );

  // Retain two updates and two lazy chunks, including their source maps.
  expect(updates.filter((name) => name.endsWith('.json'))).toHaveLength(2);
  expect(updates.length).toBeLessThanOrEqual(6);
  expect(chunks.length).toBeLessThanOrEqual(4);
  expect(await page.evaluate('window.hmrState')).toBe(123);
});

function advanceGracePeriod() {
  const now = performance.now.bind(performance);
  return rs.spyOn(performance, 'now').mockImplementation(() => now() + 30_000);
}

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
        web: {
          source: {
            entry: { index: entry },
          },
        },
        other: {
          source: {
            entry: { other: join(src, 'other.js') },
          },
        },
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
  await editFile(entry, (code) => code.replace('>0<', '>1<'));
  await expect(page.locator('#test')).toHaveText('1');

  using _clock = advanceGracePeriod();
  await editFile(entry, (code) => code.replace('>1<', '>2<'));
  await expect(page.locator('#test')).toHaveText('2');

  const response = await page.request.get(
    `http://localhost:${port}/shared.txt`,
  );
  expect(await response.text()).toBe('shared');
});
