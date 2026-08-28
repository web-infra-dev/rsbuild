import { createRsbuild, type RsbuildConfig, type Rspack } from '@rsbuild/core';
import { matchRules } from '@scripts/test-helper';
import { pluginSolid } from '../src';

const isRule = (
  rule: Rspack.RuleSetRules[number],
): rule is Rspack.RuleSetRule => !!rule && typeof rule === 'object';

const getSolidLoaderOptions = (config: Rspack.Configuration) => {
  const rules = matchRules(config, 'a.tsx')
    .filter(isRule)
    .flatMap((rule) => [rule, ...(rule.oneOf?.filter(isRule) ?? [])]);

  for (const rule of rules) {
    if (!Array.isArray(rule.use)) {
      continue;
    }

    const solidLoader = rule.use.find(
      (item) =>
        typeof item === 'object' && item.loader?.includes('solidLoader.mjs'),
    );

    if (solidLoader && typeof solidLoader === 'object') {
      return solidLoader.options;
    }
  }

  throw new Error('Solid loader not found');
};

describe('plugin-solid', () => {
  const rsbuildConfig: RsbuildConfig = {
    performance: {
      buildCache: false,
    },
  };

  it('should use native compiler by default', async () => {
    const rsbuild = await createRsbuild({
      config: {
        ...rsbuildConfig,
        plugins: [pluginSolid()],
      },
    });
    const config = await rsbuild.initConfigs();

    expect(getSolidLoaderOptions(config[0])).toEqual({
      compiler: 'native',
      decoratorVersion: '2023-11',
      solid: {
        builtIns: [
          'For',
          'Show',
          'Switch',
          'Match',
          'Loading',
          'Reveal',
          'Portal',
          'Repeat',
          'Dynamic',
          'Errored',
        ],
        contextToCustomElements: true,
        dev: false,
        generate: 'dom',
        hydratable: false,
        moduleName: '@solidjs/web',
        wrapConditionals: true,
      },
    });
  });

  it('should allow using Babel compiler', async () => {
    const rsbuild = await createRsbuild({
      config: {
        ...rsbuildConfig,
        plugins: [pluginSolid({ compiler: 'babel' })],
      },
    });
    const config = await rsbuild.initConfigs();

    expect(JSON.stringify(matchRules(config[0], 'a.tsx'))).toContain(
      '"compiler":"babel"',
    );
  });

  it('should pass decorator version to Babel compiler', async () => {
    const rsbuild = await createRsbuild({
      config: {
        ...rsbuildConfig,
        source: {
          decorators: {
            version: 'legacy',
          },
        },
        plugins: [pluginSolid({ compiler: 'babel' })],
      },
    });
    const config = await rsbuild.initConfigs();

    expect(getSolidLoaderOptions(config[0])).toEqual(
      expect.objectContaining({
        decoratorVersion: 'legacy',
      }),
    );
  });

  it('should add solid resolve condition', async () => {
    const rsbuild = await createRsbuild({
      config: {
        ...rsbuildConfig,
        plugins: [pluginSolid()],
      },
    });
    const config = await rsbuild.initConfigs();
    expect(config[0].resolve?.conditionNames).toEqual(['solid', '...']);
  });

  it('should enable Solid development mode in development mode', async () => {
    const rsbuild = await createRsbuild({
      config: {
        ...rsbuildConfig,
        mode: 'development',
        plugins: [pluginSolid()],
      },
    });
    const config = await rsbuild.initConfigs();

    expect(config[0].resolve?.conditionNames).toEqual([
      'solid',
      'development',
      '...',
    ]);
    expect(JSON.stringify(matchRules(config[0], 'a.tsx'))).toContain(
      '"dev":true',
    );
  });

  it('should preserve user resolve condition names', async () => {
    const rsbuild = await createRsbuild({
      config: {
        ...rsbuildConfig,
        mode: 'development',
        resolve: {
          conditionNames: ['custom', 'import'],
        },
        plugins: [pluginSolid()],
      },
    });
    const config = await rsbuild.initConfigs();
    expect(config[0].resolve?.conditionNames).toEqual([
      'solid',
      'development',
      'custom',
      'import',
    ]);
  });

  it('should allow disabling Solid development mode', async () => {
    const rsbuild = await createRsbuild({
      config: {
        ...rsbuildConfig,
        mode: 'development',
        plugins: [pluginSolid({ dev: false })],
      },
    });
    const config = await rsbuild.initConfigs();

    expect(config[0].resolve?.conditionNames).toEqual(['solid', '...']);
    expect(JSON.stringify(matchRules(config[0], 'a.tsx'))).toContain(
      '"dev":false',
    );
  });

  it('should disable Solid development mode in production by default', async () => {
    const rsbuild = await createRsbuild({
      config: {
        ...rsbuildConfig,
        mode: 'production',
        plugins: [pluginSolid()],
      },
    });
    const config = await rsbuild.initConfigs();

    expect(config[0].resolve?.conditionNames).toEqual(['solid', '...']);
    expect(JSON.stringify(matchRules(config[0], 'a.tsx'))).toContain(
      '"dev":false',
    );
  });

  it('should allow forcing Solid development mode in production mode', async () => {
    const rsbuild = await createRsbuild({
      config: {
        ...rsbuildConfig,
        mode: 'production',
        plugins: [pluginSolid({ dev: true })],
      },
    });
    const config = await rsbuild.initConfigs();

    expect(config[0].resolve?.conditionNames).toEqual([
      'solid',
      'development',
      '...',
    ]);
    expect(JSON.stringify(matchRules(config[0], 'a.tsx'))).toContain(
      '"dev":true',
    );
  });

  it('should allow solid.dev to override compiler development mode', async () => {
    const rsbuild = await createRsbuild({
      config: {
        ...rsbuildConfig,
        mode: 'development',
        plugins: [pluginSolid({ dev: false, solid: { dev: true } })],
      },
    });
    const config = await rsbuild.initConfigs();

    expect(config[0].resolve?.conditionNames).toEqual(['solid', '...']);
    expect(JSON.stringify(matchRules(config[0], 'a.tsx'))).toContain(
      '"dev":true',
    );
  });

  it('should allow disabling solid refresh via refresh.disabled', async () => {
    const rsbuild = await createRsbuild({
      config: {
        ...rsbuildConfig,
        plugins: [pluginSolid({ refresh: { disabled: true } })],
      },
    });
    const config = await rsbuild.initConfigs();

    expect(
      JSON.stringify(matchRules(config[0], 'a.tsx')).includes(
        'refreshLoader.mjs',
      ),
    ).toEqual(false);
  });

  it('should configure granular solid refresh', async () => {
    const rsbuild = await createRsbuild({
      config: {
        ...rsbuildConfig,
        plugins: [pluginSolid({ refresh: { granular: false } })],
      },
    });
    const config = await rsbuild.initConfigs();
    const refreshRule = matchRules(config[0], 'a.tsx').find(
      (rule) =>
        isRule(rule) && JSON.stringify(rule).includes('refreshLoader.mjs'),
    );

    expect(refreshRule?.enforce).toBe('pre');
    expect(JSON.stringify(refreshRule)).toContain('"granular":false');
  });

  it('should only apply solid refresh to JSX and TSX by default', async () => {
    const rsbuild = await createRsbuild({
      config: {
        ...rsbuildConfig,
        plugins: [pluginSolid()],
      },
    });
    const config = await rsbuild.initConfigs();
    const hasRefreshLoader = (filename: string) =>
      JSON.stringify(matchRules(config[0], filename)).includes(
        'refreshLoader.mjs',
      );

    expect(hasRefreshLoader('a.js')).toBe(false);
    expect(hasRefreshLoader('a.ts')).toBe(false);
    expect(hasRefreshLoader('a.jsx')).toBe(true);
    expect(hasRefreshLoader('a.tsx')).toBe(true);
  });

  it('should use hydratable dom output for ssr option on web target', async () => {
    const rsbuild = await createRsbuild({
      config: {
        ...rsbuildConfig,
        plugins: [pluginSolid({ ssr: true })],
      },
    });
    const config = await rsbuild.initConfigs();

    expect(getSolidLoaderOptions(config[0])).toEqual(
      expect.objectContaining({
        solid: expect.objectContaining({
          generate: 'dom',
          hydratable: true,
        }),
      }),
    );
  });

  it('should use ssr output for ssr option on node target', async () => {
    const rsbuild = await createRsbuild({
      config: {
        ...rsbuildConfig,
        output: {
          target: 'node',
        },
        plugins: [pluginSolid({ ssr: true })],
      },
    });
    const config = await rsbuild.initConfigs();

    expect(getSolidLoaderOptions(config[0])).toEqual(
      expect.objectContaining({
        solid: expect.objectContaining({
          generate: 'ssr',
          hydratable: true,
        }),
      }),
    );
  });

  it('should allow solid options to override ssr defaults', async () => {
    const rsbuild = await createRsbuild({
      config: {
        ...rsbuildConfig,
        output: {
          target: 'node',
        },
        plugins: [
          pluginSolid({
            ssr: true,
            solid: {
              generate: 'universal',
              hydratable: false,
            },
          }),
        ],
      },
    });
    const config = await rsbuild.initConfigs();

    expect(getSolidLoaderOptions(config[0])).toEqual(
      expect.objectContaining({
        solid: expect.objectContaining({
          generate: 'universal',
          hydratable: false,
        }),
      }),
    );
  });

  it('should allow to configure solid options', async () => {
    const rsbuild = await createRsbuild({
      config: {
        ...rsbuildConfig,
        plugins: [
          pluginSolid({
            solid: {
              generate: 'ssr',
              hydratable: true,
            },
          }),
        ],
      },
    });
    const config = await rsbuild.initConfigs();

    expect(getSolidLoaderOptions(config[0])).toEqual(
      expect.objectContaining({
        solid: expect.objectContaining({
          generate: 'ssr',
          hydratable: true,
        }),
      }),
    );
  });
});
