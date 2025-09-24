import { createStubRsbuild } from '@scripts/test-helper';
import { pluginEntry } from '../src/plugins/entry';

describe('plugin-entry', () => {
  const cases = [
    {
      name: 'should set entry correctly',
      entry: {
        main: './src/main.ts',
      },
      preEntry: [],
      expected: {
        main: ['./src/main.ts'],
      },
    },
    {
      name: 'should set multiple entry correctly',
      entry: {
        foo: ['./src/polyfill.ts', './src/foo.ts'],
        bar: ['./src/polyfill.ts', './src/bar.ts'],
      },
      preEntry: [],
      expected: {
        bar: ['./src/polyfill.ts', './src/bar.ts'],
        foo: ['./src/polyfill.ts', './src/foo.ts'],
      },
    },
    {
      name: 'should set pre-entry correctly',
      entry: {
        foo: ['./src/polyfill.ts', './src/foo.ts'],
        bar: './src/bar.ts',
      },
      preEntry: ['./src/pre-entry.ts'],
      expected: {
        bar: ['./src/pre-entry.ts', './src/bar.ts'],
        foo: ['./src/pre-entry.ts', './src/polyfill.ts', './src/foo.ts'],
      },
    },
  ];

  it.each(cases)('$name', async (item) => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry()],
      config: {
        source: {
          entry: item.entry as unknown as Record<string, string | string[]>,
          preEntry: item.preEntry,
        },
      },
    });

    const config = await rsbuild.unwrapConfig();

    expect(config.entry).toEqual(item.expected);
  });

  it('should apply environments entry config correctly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry()],
      config: {
        environments: {
          web: {
            source: {
              entry: {
                index: './src/index.client',
              },
            },
          },
          ssr: {
            source: {
              entry: {
                index: './src/index.ssr',
              },
            },
          },
        },
      },
    });

    const configs = await rsbuild.initConfigs();
    expect(configs).toMatchSnapshot();
  });

  it('should apply different environments entry config correctly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry()],
      config: {
        environments: {
          web: {
            source: {
              entry: {
                index: './src/index.client',
              },
            },
          },
          ssr: {
            source: {
              entry: {
                main: './src/index.ssr',
              },
            },
          },
        },
      },
    });

    const configs = await rsbuild.initConfigs();

    expect(configs).toMatchSnapshot();
  });
});
