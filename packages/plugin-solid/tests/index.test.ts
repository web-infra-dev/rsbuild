import { createRequire } from 'node:module';
import { createRsbuild, type RsbuildConfig, type Rspack } from '@rsbuild/core';
import { matchRules } from '@scripts/test-helper';
import { type PluginSolidOptions, pluginSolid } from '../src';

const require = createRequire(import.meta.url);
const solidLoader = require.resolve('solid-loader');
const refreshLoader = require.resolve('solid-loader/refresh');

async function getConfig(
  options: PluginSolidOptions,
  config: RsbuildConfig = {},
  action?: 'build' | 'dev',
) {
  const rsbuild = await createRsbuild({
    config: {
      performance: { buildCache: false },
      plugins: [pluginSolid(options)],
      ...config,
    },
  });
  const [rspackConfig] = await rsbuild.initConfigs({ action });
  return rspackConfig;
}

const isRule = (
  rule: Rspack.RuleSetRules[number],
): rule is Rspack.RuleSetRule => !!rule && typeof rule === 'object';

function findLoader(
  config: Rspack.Configuration,
  loader: string,
  filename = 'App.tsx',
) {
  const rules = matchRules(config, filename)
    .filter(isRule)
    .flatMap((rule) => [rule, ...(rule.oneOf?.filter(isRule) ?? [])]);

  for (const rule of rules) {
    if (Array.isArray(rule.use)) {
      for (const use of rule.use) {
        if (typeof use === 'object' && use?.loader === loader) {
          return { options: use.options, enforce: rule.enforce };
        }
      }
    }
  }
}

describe('plugin-solid', () => {
  it.each([
    ['native', {}],
    ['babel', { compiler: 'babel' }],
  ] as const)('should select the %s compiler', async (compiler, options) => {
    const config = await getConfig(options);
    expect(findLoader(config, solidLoader)?.options).toMatchObject({
      compiler,
    });
  });

  it.each([
    ['development', undefined, true],
    ['production', undefined, false],
    ['development', false, false],
    ['production', true, true],
  ] as const)(
    'should configure Solid development mode for mode %s and dev %s',
    async (mode, dev, useDevMode) => {
      const config = await getConfig({ dev }, { mode });
      expect(config.resolve?.conditionNames).toEqual(
        useDevMode ? ['solid', 'development', '...'] : ['solid', '...'],
      );
      expect(findLoader(config, solidLoader)?.options).toMatchObject({
        solid: { dev: useDevMode },
      });
    },
  );

  it('should preserve user resolve conditions after the Solid conditions', async () => {
    const config = await getConfig(
      {},
      {
        mode: 'development',
        resolve: { conditionNames: ['custom', 'import'] },
      },
    );
    expect(config.resolve?.conditionNames).toEqual([
      'solid',
      'development',
      'custom',
      'import',
    ]);
  });

  it('should allow solid.dev to override compiler development mode independently of the runtime', async () => {
    const config = await getConfig(
      { dev: false, solid: { dev: true } },
      { mode: 'development' },
    );
    expect(config.resolve?.conditionNames).toEqual(['solid', '...']);
    expect(findLoader(config, solidLoader)?.options).toMatchObject({
      solid: { dev: true },
    });
  });

  it('should disable both refresh transforms when refresh.disabled is true', async () => {
    const config = await getConfig(
      { refresh: { disabled: true } },
      { mode: 'development' },
    );
    expect(findLoader(config, refreshLoader)).toBeUndefined();
    expect(findLoader(config, solidLoader)?.options).toMatchObject({
      refresh: false,
    });
  });

  it('should skip Solid Refresh in a none mode build with dev.hmr enabled', async () => {
    const config = await getConfig(
      {},
      { mode: 'none', dev: { hmr: true } },
      'build',
    );
    expect(findLoader(config, refreshLoader)).toBeUndefined();
  });

  it('should pass granular to the refresh pre-loader and disable inline refresh', async () => {
    const config = await getConfig(
      { refresh: { granular: false } },
      { mode: 'development' },
    );
    expect(findLoader(config, refreshLoader)).toMatchObject({
      enforce: 'pre',
      options: { granular: false },
    });
    expect(findLoader(config, solidLoader)?.options).toMatchObject({
      refresh: false,
    });
  });

  it('should only apply refresh to JSX and TSX by default', async () => {
    const config = await getConfig({}, { mode: 'development' });
    expect(findLoader(config, refreshLoader, 'a.js')).toBeUndefined();
    expect(findLoader(config, refreshLoader, 'a.ts')).toBeUndefined();
    expect(findLoader(config, refreshLoader, 'a.jsx')).toBeDefined();
    expect(findLoader(config, refreshLoader, 'a.tsx')).toBeDefined();
  });

  it('should match additional extensions literally without changing module resolution', async () => {
    const config = await getConfig(
      { extensions: ['.solid+jsx'] },
      { mode: 'development' },
    );
    expect(config.resolve?.extensions).not.toContain('.solid+jsx');
    expect(findLoader(config, refreshLoader, 'a.solid+jsx')).toBeDefined();
    // cspell:disable-next-line
    expect(findLoader(config, refreshLoader, 'a.solidddjsx')).toBeUndefined();
    expect(findLoader(config, refreshLoader, 'a.solid+jsx.js')).toBeUndefined();
  });

  it('should allow solid options to override SSR defaults', async () => {
    const config = await getConfig(
      { ssr: true, solid: { generate: 'universal', hydratable: false } },
      { output: { target: 'node' } },
    );
    expect(findLoader(config, solidLoader)?.options).toMatchObject({
      solid: { generate: 'universal', hydratable: false },
    });
  });
});
