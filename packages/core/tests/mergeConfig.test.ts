import type { RsbuildConfig, Rspack } from '../src';
import { mergeRsbuildConfig } from '../src/mergeConfig';

describe('mergeRsbuildConfig', () => {
  it('should use `false` to replace empty object', () => {
    expect(
      mergeRsbuildConfig(
        { tools: { htmlPlugin: {} } },
        { tools: { htmlPlugin: false } },
      ),
    ).toEqual({
      tools: { htmlPlugin: false },
    });
  });

  test('should set value when target value is not undefined', () => {
    expect(
      mergeRsbuildConfig(
        { resolve: { alias: {} } },
        { output: { minify: false } },
      ),
    ).toEqual({
      resolve: {
        alias: {},
      },
      output: {
        minify: false,
      },
    });
  });

  test('should ignore undefined property', () => {
    const noop = () => ({});
    const config = mergeRsbuildConfig(
      { resolve: { alias: {} } },
      { resolve: { alias: undefined } },
      { tools: { rspack: noop } },
      { tools: { rspack: undefined } },
    );
    expect(config).toEqual({
      resolve: {
        alias: {},
      },
      tools: {
        rspack: noop,
      },
    });
  });

  test('should keep single function value', () => {
    const config = mergeRsbuildConfig(
      { tools: { rspack: undefined } },
      { tools: { rspack: () => ({}) } },
    );
    expect(typeof config.tools?.rspack).toEqual('function');
  });

  test('should merge string and string[] correctly', async () => {
    expect(
      mergeRsbuildConfig(
        {
          source: {
            preEntry: './a.js',
          },
        },
        {
          source: {
            preEntry: ['./b.js', './c.js'],
          },
        },
      ),
    ).toEqual({
      source: {
        preEntry: ['./a.js', './b.js', './c.js'],
      },
    });
  });

  test('should deep merge object correctly', async () => {
    expect(
      mergeRsbuildConfig(
        {
          output: {
            distPath: {
              root: 'foo',
              image: 'foo-image',
            },
          },
        },
        {
          output: {
            distPath: {
              root: 'bar',
              svg: 'bar-svg',
            },
          },
        },
      ),
    ).toEqual({
      output: {
        distPath: {
          root: 'bar',
          image: 'foo-image',
          svg: 'bar-svg',
        },
      },
    });
  });

  test('should merge function and object correctly', async () => {
    const rspackFn = (config: Rspack.Configuration) => {
      config.devtool = 'source-map';
    };

    expect(
      mergeRsbuildConfig(
        {
          tools: {
            rspack: {
              devtool: 'eval-cheap-source-map',
            },
          },
        },
        {
          tools: { rspack: rspackFn },
        },
      ),
    ).toEqual({
      tools: {
        rspack: [{ devtool: 'eval-cheap-source-map' }, rspackFn],
      },
    });
  });

  it('should not modify the original objects', () => {
    const obj: RsbuildConfig = {
      source: { include: ['1'] },
    };
    const other1: RsbuildConfig = {
      source: { include: ['2'] },
    };
    const other2: RsbuildConfig = {
      source: { include: ['3'] },
    };

    const res = mergeRsbuildConfig(obj, other1, other2);

    expect(res).toEqual({
      source: {
        include: ['1', '2', '3'],
      },
    });

    expect(obj).toEqual({ source: { include: ['1'] } });
    expect(other1).toEqual({
      source: { include: ['2'] },
    });
    expect(other2).toEqual({
      source: { include: ['3'] },
    });
  });

  it('should not modify the original objects when the merged config modified', () => {
    const obj: RsbuildConfig = {
      resolve: {
        alias: {},
      },
    };

    const other: RsbuildConfig = {};

    const res = mergeRsbuildConfig(obj, other);

    if (!res.source?.entry) {
      res.source ||= {};
      res.source.entry = {
        index: './index',
      };
    }

    expect(res).toEqual({
      resolve: {
        alias: {},
      },
      source: {
        entry: {
          index: './index',
        },
      },
    });

    expect(obj).toEqual({
      resolve: {
        alias: {},
      },
    });
  });

  test('should merge server.open correctly', async () => {
    expect(
      mergeRsbuildConfig(
        {
          server: {
            open: ['http://localhost:3000'],
          },
        },
        {
          server: {
            open: false,
          },
        },
      ),
    ).toEqual({
      server: {
        open: false,
      },
    });
  });

  test('should merge tools.htmlPlugin correctly', async () => {
    expect(
      mergeRsbuildConfig(
        {
          tools: {
            htmlPlugin: {},
          },
        },
        {
          tools: {
            htmlPlugin: false,
          },
        },
      ),
    ).toEqual({
      tools: {
        htmlPlugin: false,
      },
    });

    expect(
      mergeRsbuildConfig(
        {
          tools: {
            htmlPlugin: false,
          },
        },
        {
          tools: {
            htmlPlugin: {},
          },
        },
      ),
    ).toEqual({
      tools: {
        htmlPlugin: {},
      },
    });
  });

  it('should merge SWC plugins as expected', () => {
    expect(
      mergeRsbuildConfig(
        {
          tools: {
            swc: {
              jsc: {
                experimental: {
                  plugins: [['@swc/plugin-foo', {}]],
                },
              },
            },
          },
        },
        {
          tools: {
            swc: {
              jsc: {
                experimental: {
                  plugins: [['@swc/plugin-bar', {}]],
                },
              },
            },
          },
        },
      ),
    ).toEqual({
      tools: {
        swc: {
          jsc: {
            experimental: {
              plugins: [
                ['@swc/plugin-foo', {}],
                ['@swc/plugin-bar', {}],
              ],
            },
          },
        },
      },
    });
  });

  it('should merge Rspack plugins as expected', () => {
    class A {
      a = 1;

      apply() {
        return this.a;
      }
    }

    const pluginA = new A();

    const mergedConfig = mergeRsbuildConfig(
      {
        tools: {
          rspack: {
            plugins: [pluginA],
          },
        },
      },
      {},
    );

    expect(mergedConfig).toEqual({
      tools: {
        rspack: {
          plugins: [pluginA],
        },
      },
    });

    expect(mergedConfig.tools?.rspack.plugins[0] instanceof A).toBeTruthy();
  });

  test('should merge overrideBrowserslist in environments as expected', async () => {
    expect(
      mergeRsbuildConfig(
        {
          output: {
            overrideBrowserslist: ['chrome 50'],
          },
          environments: {
            web: {
              output: {
                overrideBrowserslist: ['edge 10'],
              },
            },
            node: {
              output: {
                overrideBrowserslist: ['node 14'],
              },
            },
          },
        },
        {
          output: {
            overrideBrowserslist: ['chrome 100'],
          },
        },
        {
          environments: {
            web: {
              output: {
                overrideBrowserslist: ['edge 11'],
              },
            },
            node: {
              output: {
                overrideBrowserslist: ['node 16'],
              },
            },
          },
        },
      ),
    ).toEqual({
      output: {
        overrideBrowserslist: ['chrome 100'],
      },
      environments: {
        web: {
          output: {
            overrideBrowserslist: ['edge 11'],
          },
        },
        node: {
          output: {
            overrideBrowserslist: ['node 16'],
          },
        },
      },
    });
  });

  test('should merge output.filename.js as expected', async () => {
    const fn = () => 'custom-output2.js';
    expect(
      mergeRsbuildConfig(
        {
          output: {
            filename: {
              js: 'custom-output.js',
            },
          },
        },
        {
          output: {
            filename: {
              js: fn,
            },
          },
        },
      ),
    ).toEqual({
      output: {
        filename: {
          js: fn,
        },
      },
    });
  });
});
