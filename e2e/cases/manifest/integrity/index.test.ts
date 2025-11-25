import { expect, getFileContent, rspackTest } from '@e2e/helper';
import type { ManifestData } from '@rsbuild/core';

rspackTest(
  'should generate manifest file with integrity in build',
  async ({ build }) => {
    const rsbuild = await build();
    const files = rsbuild.getDistFiles();
    const manifestContent = getFileContent(files, 'manifest.json');
    const manifest = JSON.parse(manifestContent) as ManifestData;
    manifest.allFiles.forEach((item) => {
      if (item.endsWith('.js')) {
        expect(manifest.integrity[item]).toBeTruthy();
      }
    });
  },
);

rspackTest(
  'should generate manifest file with integrity in dev',
  async ({ dev }) => {
    const rsbuild = await dev();
    const files = rsbuild.getDistFiles();
    const manifestContent = getFileContent(files, 'manifest.json');
    const manifest = JSON.parse(manifestContent) as ManifestData;
    manifest.allFiles.forEach((item) => {
      if (item.endsWith('.js')) {
        expect(manifest.integrity[item]).toBeTruthy();
      }
    });
  },
);
