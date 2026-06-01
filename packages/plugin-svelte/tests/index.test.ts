import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRsbuild } from '@rsbuild/core';
import { matchRules } from '@scripts/test-helper';
import { pluginSvelte } from '../src';

const createFakeSvelteProject = (version: string) => {
  const cwd = mkdtempSync(path.join(tmpdir(), 'rsbuild-plugin-svelte-'));
  const svelteDir = path.join(cwd, 'node_modules/svelte');

  mkdirSync(svelteDir, { recursive: true });
  writeFileSync(
    path.join(svelteDir, 'package.json'),
    JSON.stringify({ name: 'svelte', version }),
  );

  return cwd;
};

describe('plugin-svelte', () => {
  afterEach(() => {
    rs.unstubAllEnvs();
  });

  it('should add svelte loader and resolve config properly', async () => {
    const rsbuild = await createRsbuild({
      cwd: __dirname,
      config: {
        plugins: [pluginSvelte()],
      },
    });

    const rspackConfigs = await rsbuild.initConfigs();
    expect(matchRules(rspackConfigs[0], 'a.svelte')).toMatchSnapshot();
    expect(rspackConfigs[0].resolve).toMatchSnapshot();
  });

  it('should add rule for `.svelte.js` and `.svelte.ts` as expected', async () => {
    const rsbuild = await createRsbuild({
      cwd: __dirname,
      config: {
        plugins: [pluginSvelte()],
      },
    });

    const rspackConfigs = await rsbuild.initConfigs();
    expect(matchRules(rspackConfigs[0], 'a.svelte.js')).toMatchSnapshot();
    expect(matchRules(rspackConfigs[0], 'a.svelte.ts')).toMatchSnapshot();
  });

  it('should reject svelte versions lower than 5', async () => {
    const cwd = createFakeSvelteProject('4.2.20');

    try {
      const rsbuild = await createRsbuild({
        cwd,
        config: {
          plugins: [pluginSvelte()],
        },
      });

      await expect(rsbuild.initConfigs()).rejects.toThrow(
        '@rsbuild/plugin-svelte requires svelte >= 5.0.0, but found 4.2.20',
      );
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('should set dev and hotReload to false in production mode', async () => {
    rs.stubEnv('NODE_ENV', 'production');
    const rsbuild = await createRsbuild({
      cwd: __dirname,
      config: {
        plugins: [pluginSvelte()],
      },
    });
    const rspackConfigs = await rsbuild.initConfigs();
    expect(matchRules(rspackConfigs[0], 'a.svelte')).toMatchSnapshot();
  });

  it('should turn off HMR by hand correctly', async () => {
    const rsbuild = await createRsbuild({
      cwd: __dirname,
      config: {
        dev: {
          hmr: false,
        },
        plugins: [pluginSvelte()],
      },
    });
    const rspackConfigs = await rsbuild.initConfigs();
    expect(matchRules(rspackConfigs[0], 'a.svelte')).toMatchSnapshot();
  });

  it('should override default svelte-loader options throw options.svelteLoaderOptions', async () => {
    const rsbuild = await createRsbuild({
      cwd: __dirname,
      config: {
        plugins: [
          pluginSvelte({
            svelteLoaderOptions: {
              preprocess: null,
            },
          }),
        ],
      },
    });
    const rspackConfigs = await rsbuild.initConfigs();
    expect(matchRules(rspackConfigs[0], 'a.svelte')).toMatchSnapshot();
  });

  it('should support pass custom preprocess options', async () => {
    const rsbuild = await createRsbuild({
      cwd: __dirname,
      config: {
        plugins: [
          pluginSvelte({
            preprocessOptions: {
              aliases: [
                ['potato', 'potatoLanguage'],
                ['pot', 'potatoLanguage'],
              ],
              /** Add a custom language preprocessor */
              potatoLanguage: ({ content }: { content: string }) => {
                const { code, map } =
                  // rslint-disable-next-line @typescript-eslint/no-require-imports
                  require('potato-language').render(content);
                return { code, map };
              },
            },
          }),
        ],
      },
    });
    const rspackConfigs = await rsbuild.initConfigs();
    expect(matchRules(rspackConfigs[0], 'a.svelte')).toMatchSnapshot();
  });
});
