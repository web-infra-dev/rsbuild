import { parseCommonConfig } from '../src/shared/parseCommonConfig';

describe('parseCommonConfig', () => {
  test('output.cssModuleLocalIdentName', () => {
    expect(
      parseCommonConfig({
        output: {
          cssModuleLocalIdentName: '[local]-[hash:base64:6]',
        },
      }).rsbuildConfig,
    ).toMatchSnapshot();
  });

  test('output.disableCssModuleExtension', () => {
    expect(
      parseCommonConfig({
        output: {
          disableCssModuleExtension: true,
        },
      }).rsbuildConfig,
    ).toMatchSnapshot();
  });

  test('html.metaByEntries', () => {
    expect(
      parseCommonConfig({
        html: {
          metaByEntries: {
            foo: {
              viewport: 'bar',
            },
          },
        },
      }).rsbuildConfig,
    ).toMatchSnapshot();

    expect(
      parseCommonConfig({
        html: {
          meta: {
            charset: {
              charset: 'UTF-8',
            },
          },
          metaByEntries: {
            foo: {
              viewport: 'bar',
            },
          },
        },
      }).rsbuildConfig,
    ).toMatchSnapshot();
  });

  test('html.titleByEntries', () => {
    expect(
      parseCommonConfig({
        html: {
          titleByEntries: {
            foo: 'Foo',
          },
        },
      }).rsbuildConfig,
    ).toMatchSnapshot();

    expect(
      parseCommonConfig({
        html: {
          title: 'Default',
          titleByEntries: {
            foo: 'Foo',
          },
        },
      }).rsbuildConfig,
    ).toMatchSnapshot();
  });

  test('html.faviconByEntries', () => {
    expect(
      parseCommonConfig({
        html: {
          faviconByEntries: {
            foo: 'https://www.foo.com/foo.ico',
          },
        },
      }).rsbuildConfig,
    ).toMatchSnapshot();

    expect(
      parseCommonConfig({
        html: {
          favicon: 'https://www.foo.com/default.ico',
          faviconByEntries: {
            foo: 'https://www.foo.com/foo.ico',
          },
        },
      }).rsbuildConfig,
    ).toMatchSnapshot();
  });

  test('html.faviconByEntries', () => {
    expect(
      parseCommonConfig({
        html: {
          injectByEntries: {
            foo: 'head',
          },
        },
      }).rsbuildConfig,
    ).toMatchSnapshot();

    expect(
      parseCommonConfig({
        html: {
          inject: 'body',
          injectByEntries: {
            foo: 'head',
          },
        },
      }).rsbuildConfig,
    ).toMatchSnapshot();
  });

  test('html.templateByEntries', () => {
    expect(
      parseCommonConfig({
        html: {
          templateByEntries: {
            foo: './static/foo.html',
          },
        },
      }).rsbuildConfig,
    ).toMatchSnapshot();

    expect(
      parseCommonConfig({
        html: {
          template: './static/index.html',
          templateByEntries: {
            foo: './static/foo.html',
          },
        },
      }).rsbuildConfig,
    ).toMatchSnapshot();
  });

  test('html.templateParametersByEntries', () => {
    expect(
      parseCommonConfig({
        html: {
          templateParametersByEntries: {
            foo: {
              name: 'jack',
            },
          },
        },
      }).rsbuildConfig,
    ).toMatchSnapshot();

    expect(
      parseCommonConfig({
        html: {
          templateParameters: {
            name: 'jack',
          },
          templateParametersByEntries: {
            foo: {
              name: 'rose',
            },
          },
        },
      }).rsbuildConfig,
    ).toMatchSnapshot();
  });

  test('output.assetsRetry', () => {
    expect(
      parseCommonConfig({}).rsbuildPlugins.some(
        (item) => item.name === 'rsbuild:assets-retry',
      ),
    ).toBeFalsy();

    expect(
      parseCommonConfig({
        output: {
          assetsRetry: {},
        },
      }).rsbuildPlugins.some((item) => item.name === 'rsbuild:assets-retry'),
    ).toBeTruthy();
  });
});
