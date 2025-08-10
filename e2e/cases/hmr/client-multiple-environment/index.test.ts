import { join } from 'node:path';
import { dev, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

const cwd = __dirname;

rspackOnlyTest(
  'should allow to set different dev.client for multiple environments',
  async ({ page }) => {
    const rsbuild = await dev({
      cwd,
      page,
      rsbuildConfig: {
        dev: {
          writeToDisk: true,
        },
        environments: {
          foo: {
            source: {
              entry: {
                foo: join(cwd, 'foo.js'),
              },
            },
            dev: {
              client: {
                host: 'http://foo.com',
              },
            },
          },
          bar: {
            source: {
              entry: {
                bar: join(cwd, 'bar.js'),
              },
            },
            dev: {
              client: {
                host: 'http://bar.com',
              },
            },
          },
        },
      },
    });

    const files = await rsbuild.getDistFiles();
    const filenames = Object.keys(files);
    const fooJs = filenames.find((name) => name.endsWith('foo.js'));
    const barJs = filenames.find((name) => name.endsWith('bar.js'));
    expect(files[fooJs!].includes('"host":"http://foo.com"')).toBeTruthy();
    expect(files[barJs!].includes('"host":"http://bar.com"')).toBeTruthy();
    await rsbuild.close();
  },
);
