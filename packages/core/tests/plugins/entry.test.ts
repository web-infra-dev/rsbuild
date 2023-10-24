import { createStubRsbuild } from '@rsbuild/test-helper';
import { pluginEntry } from '@src/plugins/entry';

describe('plugin-entry', () => {
  const cases = [
    {
      name: 'should set entry correctly',
      entry: {
        main: './src/main.ts',
      },
      preEntry: [],
      expected: {
        entry: {
          main: ['./src/main.ts'],
        },
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
        entry: {
          bar: ['./src/polyfill.ts', './src/bar.ts'],
          foo: ['./src/polyfill.ts', './src/foo.ts'],
        },
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
        entry: {
          bar: ['./src/pre-entry.ts', './src/bar.ts'],
          foo: ['./src/pre-entry.ts', './src/polyfill.ts', './src/foo.ts'],
        },
      },
    },
  ];

  it.each(cases)('$name', async (item) => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry()],
      rsbuildConfig: {
        source: {
          preEntry: item.preEntry,
        },
      },
      entry: item.entry as unknown as Record<string, string | string[]>,
    });

    const config = await rsbuild.unwrapConfig();

    expect(config).toEqual(item.expected);
  });
});
