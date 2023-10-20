import { expect, describe, it, beforeEach, afterEach } from 'vitest';
import { pluginEntry } from '@rsbuild/core/plugins/entry';
import { pluginHtml } from '@rsbuild/core/plugins/html';
import { pluginInlineChunk } from '@rsbuild/core/plugins/inlineChunk';
import { createStubRsbuild } from '../helper';

describe('plugins/inlineChunk', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    process.env.NODE_ENV = 'test';
  });

  it('should add InlineChunkHtmlPlugin properly by default', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml(), pluginInlineChunk()],
      entry: {
        main: './src/main.ts',
      },
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should use proper plugin options when enableInlineScripts is true', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml(), pluginInlineChunk()],
      entry: {
        main: './src/main.ts',
      },
      rsbuildConfig: {
        output: {
          enableInlineScripts: true,
        },
      },
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should use proper plugin options when enableInlineStyles is true', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml(), pluginInlineChunk()],
      entry: {
        main: './src/main.ts',
      },
      rsbuildConfig: {
        output: {
          enableInlineStyles: true,
        },
      },
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should use proper plugin options when disableInlineRuntimeChunk is true', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml(), pluginInlineChunk()],
      entry: {
        main: './src/main.ts',
      },
      rsbuildConfig: {
        output: {
          disableInlineRuntimeChunk: true,
        },
      },
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should not apply InlineChunkHtmlPlugin when target is node', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml(), pluginInlineChunk()],
      entry: {
        main: './src/main.ts',
      },
      target: 'node',
    });

    expect(
      await rsbuild.matchWebpackPlugin('InlineChunkHtmlPlugin'),
    ).toBeFalsy();
  });

  it('should not apply InlineChunkHtmlPlugin when target is web-worker', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml(), pluginInlineChunk()],
      entry: {
        main: './src/main.ts',
      },
      target: 'web-worker',
    });

    expect(
      await rsbuild.matchWebpackPlugin('InlineChunkHtmlPlugin'),
    ).toBeFalsy();
  });

  it('should not apply InlineChunkHtmlPlugin in development mode', async () => {
    process.env.NODE_ENV = 'development';
    const rsbuild = await createStubRsbuild({
      plugins: [pluginEntry(), pluginHtml(), pluginInlineChunk()],
      entry: {
        main: './src/main.ts',
      },
    });

    expect(
      await rsbuild.matchWebpackPlugin('InlineChunkHtmlPlugin'),
    ).toBeFalsy();
  });
});
