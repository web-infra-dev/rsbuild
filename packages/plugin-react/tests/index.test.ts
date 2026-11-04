import { createRsbuild, type Rspack } from '@rsbuild/core';
import { matchPlugin, matchRules } from '@scripts/test-helper';
import { pluginReact } from '../src';

describe('plugins/react', () => {
  it('should work with swc-loader', async () => {
    const rsbuild = await createRsbuild({
      config: {
        mode: 'development',
      },
    });

    rsbuild.addPlugins([pluginReact()]);
    const config = await rsbuild.initConfigs();

    expect(matchRules(config[0], 'a.js')).toMatchSnapshot();
  });

  it('should configuring `tools.swc` to override react runtime', async () => {
    const rsbuild = await createRsbuild({
      config: {
        mode: 'development',
        tools: {
          swc: {
            jsc: {
              transform: {
                react: {
                  runtime: 'classic',
                },
              },
            },
          },
        },
      },
    });

    rsbuild.addPlugins([pluginReact()]);
    const config = await rsbuild.initConfigs();

    expect(matchRules(config[0], 'a.js')).toMatchSnapshot();
  });

  it('should set `parser.javascript.jsx` to `true` when using `preserve` react runtime', async () => {
    const rsbuild = await createRsbuild();

    rsbuild.addPlugins([
      pluginReact({
        swcReactOptions: {
          runtime: 'preserve',
        },
      }),
    ]);
    const config = await rsbuild.initConfigs();
    expect(config[0].module?.parser?.javascript).toMatchSnapshot();
  });

  it('should not apply react refresh when dev.hmr is false', async () => {
    const rsbuild = await createRsbuild({
      config: {
        dev: {
          hmr: false,
        },
      },
    });

    rsbuild.addPlugins([pluginReact()]);
    const config = await rsbuild.initConfigs();
    expect(matchPlugin(config[0], 'ReactRefreshRspackPlugin')).toBeFalsy();
  });

  it('should set transpilation scope for react refresh plugin correctly', async () => {
    const rsbuild = await createRsbuild({
      config: {
        mode: 'development',
        source: {
          include: [/foo/, /bar/],
          exclude: [/baz/],
        },
      },
    });

    rsbuild.addPlugins([pluginReact()]);

    const config = await rsbuild.initConfigs();
    expect(
      matchPlugin(config[0], 'ReactRefreshRspackPlugin'),
    ).toMatchSnapshot();
  });

  it('should not apply react refresh when target is node', async () => {
    const rsbuild = await createRsbuild({
      config: {
        output: {
          target: 'node',
        },
      },
    });

    rsbuild.addPlugins([pluginReact()]);

    const config = await rsbuild.initConfigs();
    expect(matchPlugin(config[0], 'ReactRefreshRspackPlugin')).toBeFalsy();
  });

  it('should not apply react refresh when target is web-worker', async () => {
    const rsbuild = await createRsbuild({
      config: {
        output: {
          target: 'web-worker',
        },
      },
    });

    rsbuild.addPlugins([pluginReact()]);

    const config = await rsbuild.initConfigs();
    expect(matchPlugin(config[0], 'ReactRefreshRspackPlugin')).toBeFalsy();
  });

  it('should not apply splitChunks rule when strategy is not split-by-experience', async () => {
    const rsbuild = await createRsbuild({
      config: {
        performance: {
          chunkSplit: {
            strategy: 'single-vendor',
          },
        },
      },
    });

    rsbuild.addPlugins([pluginReact()]);

    const config = await rsbuild.initConfigs();
    expect(config[0].optimization?.splitChunks).toMatchSnapshot();
  });

  it('should allow to custom jsxImportSource', async () => {
    const rsbuild = await createRsbuild();

    rsbuild.addPlugins([
      pluginReact({
        swcReactOptions: {
          importSource: '@emotion/react',
        },
      }),
    ]);
    const config = await rsbuild.initConfigs();
    expect(JSON.stringify(config[0])).toContain(
      `"importSource":"@emotion/react"`,
    );
  });

  it('should allow to enable react compiler', async () => {
    const rsbuild = await createRsbuild();

    rsbuild.addPlugins([
      pluginReact({
        reactCompiler: true,
      }),
    ]);
    const config = await rsbuild.initConfigs();

    expect(JSON.stringify(matchRules(config[0], 'a.tsx'))).toContain(
      `"reactCompiler":true`,
    );
  });

  it('should allow to configure react compiler', async () => {
    const rsbuild = await createRsbuild();

    rsbuild.addPlugins([
      pluginReact({
        reactCompiler: {
          target: '18',
        },
      }),
    ]);
    const config = await rsbuild.initConfigs();

    expect(JSON.stringify(matchRules(config[0], 'a.tsx'))).toContain(
      `"reactCompiler":{"target":"18"}`,
    );
  });

  it('should apply react compiler only to web environments', async () => {
    const rsbuild = await createRsbuild({
      config: {
        environments: {
          web: {},
          node: { output: { target: 'node' } },
          worker: { output: { target: 'web-worker' } },
        },
      },
    });

    rsbuild.addPlugins([pluginReact({ reactCompiler: true })]);
    const [web, node, worker] = await rsbuild.initConfigs();

    expect(JSON.stringify(matchRules(web, 'a.tsx'))).toContain(
      `"reactCompiler":true`,
    );
    expect(JSON.stringify(matchRules(node, 'a.tsx'))).not.toContain(
      'reactCompiler',
    );
    expect(JSON.stringify(matchRules(worker, 'a.tsx'))).not.toContain(
      'reactCompiler',
    );
  });

  describe('react compiler include and exclude', () => {
    const getJsOneOfs = (config: Rspack.Configuration) => {
      const jsRule = matchRules(config, 'a.tsx').find(
        (rule): rule is Rspack.RuleSetRule =>
          typeof rule === 'object' && rule !== null && 'oneOf' in rule,
      );
      return (jsRule?.oneOf ?? []) as Rspack.RuleSetRule[];
    };
    const getSwcOptions = (rule: Rspack.RuleSetRule) => {
      const uses = (rule.use ?? []) as {
        loader: string;
        options?: Rspack.SwcLoaderOptions;
      }[];
      return uses.find((use) => use.loader === 'builtin:swc-loader')?.options;
    };

    it('should only compile included modules', async () => {
      const rsbuild = await createRsbuild();
      rsbuild.addPlugins([
        pluginReact({
          reactCompiler: {
            target: '18',
            include: /[\\/]src[\\/]features[\\/]/,
            exclude: [
              /legacy/,
              (path: string) => path.endsWith('.stories.tsx'),
            ],
          },
        }),
      ]);
      const [config] = await rsbuild.initConfigs();
      const oneOfs = getJsOneOfs(config);
      const mainIndex = oneOfs.findIndex(
        (rule) => getSwcOptions(rule) && !rule.include,
      );
      const compilerIndex = oneOfs.findIndex((rule) => rule.include);

      // The compiler branch is tried first, so selected modules never reach the main branch.
      expect(compilerIndex).toBeGreaterThan(-1);
      expect(compilerIndex).toBeLessThan(mainIndex);

      const compilerRule = oneOfs[compilerIndex];
      const mainRule = oneOfs[mainIndex];
      expect(compilerRule.include).toEqual([/[\\/]src[\\/]features[\\/]/]);
      expect(compilerRule.exclude).toEqual([[/legacy/, expect.any(Function)]]);
      expect(
        getSwcOptions(compilerRule)?.jsc?.transform?.reactCompiler,
      ).toEqual({
        target: '18',
      });
      expect(getSwcOptions(mainRule)?.jsc?.transform).not.toHaveProperty(
        'reactCompiler',
      );

      // Apart from React Compiler, both branches transform modules the same way.
      const { reactCompiler: _, ...compilerTransform } =
        getSwcOptions(compilerRule)?.jsc?.transform ?? {};
      expect(compilerTransform).toEqual(
        getSwcOptions(mainRule)?.jsc?.transform,
      );
      expect(compilerRule.type).toEqual(mainRule.type);
      expect(compilerRule.resolve).toEqual(mainRule.resolve);
      expect(
        (compilerRule.use as { loader: string }[]).map((use) => use.loader),
      ).toEqual(
        (mainRule.use as { loader: string }[]).map((use) => use.loader),
      );
    });

    it('should enable react compiler when only exclude is set', async () => {
      const rsbuild = await createRsbuild();
      rsbuild.addPlugins([
        pluginReact({ reactCompiler: { exclude: /legacy/ } }),
      ]);
      const [config] = await rsbuild.initConfigs();
      const compilerRule = getJsOneOfs(config).find((rule) => rule.exclude);

      expect(compilerRule?.include).toBeUndefined();
      expect(getSwcOptions(compilerRule!)?.jsc?.transform?.reactCompiler).toBe(
        true,
      );
    });

    it('should not pass include and exclude to SWC', async () => {
      const rsbuild = await createRsbuild();
      rsbuild.addPlugins([
        pluginReact({ reactCompiler: { include: /src/, target: '19' } }),
      ]);
      const [config] = await rsbuild.initConfigs();

      for (const rule of getJsOneOfs(config)) {
        const reactCompiler =
          getSwcOptions(rule)?.jsc?.transform?.reactCompiler;
        expect(
          typeof reactCompiler === 'object' && 'include' in reactCompiler,
        ).toBe(false);
      }
    });

    it('should only add the compiler branch to web environments', async () => {
      const rsbuild = await createRsbuild({
        config: {
          environments: {
            web: {},
            node: { output: { target: 'node' } },
            worker: { output: { target: 'web-worker' } },
          },
        },
      });
      rsbuild.addPlugins([pluginReact({ reactCompiler: { include: /src/ } })]);
      const [web, node, worker] = await rsbuild.initConfigs();

      expect(getJsOneOfs(web).some((rule) => rule.include)).toBe(true);
      for (const config of [node, worker]) {
        expect(getJsOneOfs(config).some((rule) => rule.include)).toBe(false);
        expect(JSON.stringify(matchRules(config, 'a.tsx'))).not.toContain(
          'reactCompiler',
        );
      }
    });
  });

  it('should allow to add react plugin as single environment plugin', async () => {
    rs.stubEnv('NODE_ENV', 'production');

    const rsbuild = await createRsbuild({
      config: {
        environments: {
          web: {},
          web1: {},
        },
      },
    });

    rsbuild.addPlugins(
      [
        pluginReact({
          enableProfiler: true,
        }),
      ],
      {
        environment: 'web',
      },
    );
    const { bundlerConfigs, environmentConfigs } =
      await rsbuild.inspectConfig();

    expect(bundlerConfigs[0]).toContain('lib-react');
    expect(environmentConfigs[0]).toContain('keep_classnames');

    expect(bundlerConfigs[1]).not.toContain('lib-react');
    expect(environmentConfigs[1]).not.toContain('keep_classnames');
  });
});
