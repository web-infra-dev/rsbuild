import { basename, relative } from 'path';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';

test.describe('tools.htmlPlugin for multiple outputs', async () => {
  let rsbuild: Awaited<ReturnType<typeof build>> | undefined = undefined;
  let htmls: Record<string, string> = {};
  test.beforeAll(async () => {
    const _rsbuild = await build({
      cwd: __dirname,
      runServer: true,
      rsbuildConfig: {
        source: {
          entry: {
            ibmPreOnly: './src/ibm-only.js',
            app: './src/app.js',
            landing: './src/landing.js',
          },
        },
        tools: {
          htmlPlugin(config, { entryName }) {
            if (entryName === 'ibmPreOnly') {
              return { disabled: true };
            }
            if (entryName === 'app') {
              return {
                ...config,
                title: 'App Default',
                filename: 'app-default.html',
                publicPath: '/',
                flavors: [
                  {
                    title: 'App - IBM',
                    filename: 'app-ibm-oem.html',
                    chunks: ['ibmPreOnly', ...(config.chunks as string[])],
                    publicPath: 'https://ibm-cdn.example.com/',
                    meta: { 'api:prefix': 'https://ibm.example.com' },
                  },
                  {
                    title: 'App - AOC',
                    filename: 'app-aoc-oem.html',
                    publicPath: 'https://aoc-cdn.example.com/',
                    meta: { 'api:prefix': 'https://aoc.example.com' },
                  },
                ],
              };
            }
            return { ...config, title: entryName };
          },
        },
      },
    });
    rsbuild = _rsbuild;
    htmls = Object.fromEntries(
      Object.entries(await _rsbuild.unwrapOutputJSON())
        .filter(([filepath]) => /\.html$/.test(filepath))
        .map(([filepath, content]) => {
          const name = basename(relative(_rsbuild.distPath, filepath), '.html');
          return [name, content] as const;
        }),
    );
  });

  test.afterAll(async () => {
    htmls = {};
    await rsbuild?.close();
    rsbuild = void 0;
  });

  test('should skip disabled entry', () => {
    expect(htmls).not.toHaveProperty('ibmPreOnly');
  });
  test('should create html as usual', () => {
    expect(Object.keys(htmls)).toMatchObject(
      expect.arrayContaining([
        'app-default',
        'app-ibm-oem',
        'app-aoc-oem',
        'landing',
      ]),
    );
  });

  test("flavors has it's own title", () => {
    expect(htmls['app-aoc-oem']).toMatch('<title>App - AOC</title>');
    expect(htmls['app-ibm-oem']).toMatch('<title>App - IBM</title>');
    expect(htmls['app-default']).toMatch('<title>App Default</title>');
  });
  test("flavors has it's own publicPath", () => {
    expect(htmls['app-aoc-oem']).toMatch(
      'https://aoc-cdn.example.com/static/js/app',
    );
    expect(htmls['app-ibm-oem']).toMatch(
      'https://ibm-cdn.example.com/static/js/app',
    );
  });

  test("flavors has it's own chunk list", () => {
    expect(htmls['app-ibm-oem']).toMatch(
      'https://ibm-cdn.example.com/static/js/ibmPreOnly',
    );

    expect(htmls['app-aoc-oem']).not.toMatch(
      'https://ibm-cdn.example.com/static/js/ibmPreOnly',
    );
  });

  test("flavors has it's own meta", () => {
    expect(htmls['app-ibm-oem']).toMatch(
      /<meta.+name="api:prefix".+content="https:\/\/ibm.example.com"/,
    );

    expect(htmls['app-aoc-oem']).toMatch(
      /<meta.+name="api:prefix".+content="https:\/\/aoc.example.com"/,
    );

    expect(htmls['app-default']).not.toMatch(/<meta.+name="api:prefix"/);
  });
});
