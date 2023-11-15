import path from 'path';
import { expect, test } from '@playwright/test';
import { pluginImageCompress } from '@rsbuild/plugin-image-compress';
import { providerType } from '@scripts/helper';
import { build } from '@scripts/shared';
import { SharedRsbuildPluginAPI } from '@rsbuild/shared';

test('should compress image with use plugin-image-compress', async () => {
  let assets: any[];
  await expect(
    build({
      cwd: __dirname,
      plugins: [
        pluginImageCompress(),
        {
          name: 'plugin-file-size',

          setup(api: SharedRsbuildPluginAPI) {
            api.onAfterBuild(async ({ stats }) => {
              const res = stats?.toJson({
                all: false,
                assets: true,
              });

              const allAssets =
                res?.assets ||
                // @ts-expect-error
                res?.children.reduce(
                  (prev: any[], curr: any) => prev.concat(curr.assets || []),
                  [],
                );

              assets = allAssets?.filter((a: any) =>
                ['.png', '.jpeg', '.ico'].includes(path.extname(a.name)),
              );
            });
          },
        },
      ],
    }),
  ).resolves.toBeDefined();

  expect(
    assets!.find((a) => path.extname(a.name) === '.png').size,
  ).toBeLessThanOrEqual(46126);

  if (providerType !== 'rspack') {
    // TODO: rspack stats structure is inconsistent with webpack v5, but it does not affect the use
    assets!.forEach((a) => {
      expect(a.info.minimized).toBeTruthy();
    });
  }
});
