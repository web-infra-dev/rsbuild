import { mergeRsbuildConfig } from '../src/mergeConfig';
import type { RspackConfig, RsbuildConfig } from '@rsbuild/shared';

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
        { source: { alias: {} } },
        { output: { minify: false } },
      ),
    ).toEqual({
      source: {
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
      { source: { alias: {} } },
      { source: { alias: undefined } },
      { tools: { webpack: noop } },
      { tools: { webpack: undefined } },
    );
    expect(config).toEqual({
      source: {
        alias: {},
      },
      tools: {
        webpack: noop,
      },
    });
  });

  test('should keep single function value', () => {
    const config = mergeRsbuildConfig(
      { tools: { webpack: undefined } },
      { tools: { webpack: () => ({}) } },
    );
    expect(typeof config.tools?.webpack).toEqual('function');
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
    const rspackFn = (config: RspackConfig) => {
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

  test('should merge dev.startUrl correctly', async () => {
    expect(
      mergeRsbuildConfig(
        {
          dev: {
            startUrl: ['http://localhost:3000'],
          },
        },
        {
          dev: {
            startUrl: false,
          },
        },
      ),
    ).toEqual({
      dev: {
        startUrl: false,
      },
    });
  });
});
