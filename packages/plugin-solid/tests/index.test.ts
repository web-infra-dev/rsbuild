import { createRsbuild, type RsbuildConfig } from '@rsbuild/core';
import { matchRules } from '@scripts/test-helper';
import { pluginSolid } from '../src';

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
    const rule = matchRules(config[0], 'a.tsx').find((rule) =>
      JSON.stringify(rule).includes('solidLoader.mjs'),
    );
    expect(rule).toMatchSnapshot();
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
    const rule = matchRules(config[0], 'a.tsx');

    expect(JSON.stringify(rule)).toContain('"granular":false');
  });

  it('should use hydratable dom output for ssr option on web target', async () => {
    const rsbuild = await createRsbuild({
      config: {
        ...rsbuildConfig,
        plugins: [pluginSolid({ ssr: true })],
      },
    });
    const config = await rsbuild.initConfigs();
    const rule = matchRules(config[0], 'a.tsx').find((rule) =>
      JSON.stringify(rule).includes('solidLoader.mjs'),
    );
    expect(rule).toMatchSnapshot();
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
    const rule = matchRules(config[0], 'a.tsx').find((rule) =>
      JSON.stringify(rule).includes('solidLoader.mjs'),
    );
    expect(rule).toMatchSnapshot();
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
    const rule = matchRules(config[0], 'a.tsx').find((rule) =>
      JSON.stringify(rule).includes('solidLoader.mjs'),
    );
    expect(rule).toMatchSnapshot();
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
    const rule = matchRules(config[0], 'a.tsx').find((rule) =>
      JSON.stringify(rule).includes('solidLoader.mjs'),
    );
    expect(rule).toMatchSnapshot();
  });

  it('should allow deprecated solidPresetOptions alias', async () => {
    const rsbuild = await createRsbuild({
      config: {
        ...rsbuildConfig,
        plugins: [
          pluginSolid({
            solidPresetOptions: {
              generate: 'ssr',
              hydratable: true,
            },
          }),
        ],
      },
    });
    const config = await rsbuild.initConfigs();
    const rule = matchRules(config[0], 'a.tsx').find((rule) =>
      JSON.stringify(rule).includes('solidLoader.mjs'),
    );
    expect(rule).toMatchSnapshot();
  });
});
