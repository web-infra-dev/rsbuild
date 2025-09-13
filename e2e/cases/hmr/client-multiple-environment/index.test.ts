import { join } from 'node:path';
import { expect, rspackTest } from '@e2e/helper';

const cwd = __dirname;

rspackTest(
  'should allow to set different dev.client for multiple environments',
  async ({ dev }) => {
    const rsbuild = await dev({
      rsbuildConfig: {
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

    const files = rsbuild.getDistFiles();
    const filenames = Object.keys(files);
    const fooJs = filenames.find((name) => name.endsWith('foo.js'));
    const barJs = filenames.find((name) => name.endsWith('bar.js'));
    expect(files[fooJs!].includes('"host":"http://foo.com"')).toBeTruthy();
    expect(files[barJs!].includes('"host":"http://bar.com"')).toBeTruthy();
  },
);
