import { expect, getFileContent, test } from '@e2e/helper';
import type { ManifestData } from '@rsbuild/core';

const checkManifestIntegrity = (rsbuild: {
  getDistFiles: () => Record<string, string>;
}) => {
  const files = rsbuild.getDistFiles();
  const manifestContent = getFileContent(files, 'manifest.json');
  const manifest = JSON.parse(manifestContent) as ManifestData;

  manifest.allFiles.forEach((item) => {
    if (item.endsWith('.js')) {
      expect(manifest.integrity[item]).toBeTruthy();
    }
  });
};

test('should generate manifest file with integrity in build', async ({
  build,
}) => {
  const rsbuild = await build();
  checkManifestIntegrity(rsbuild);
});

test('should generate manifest file with integrity in build when html plugin is disabled', async ({
  build,
}) => {
  const rsbuild = await build({
    config: {
      tools: {
        htmlPlugin: false,
      },
    },
  });
  checkManifestIntegrity(rsbuild);
});

test('should generate manifest file with integrity in dev', async ({ dev }) => {
  const rsbuild = await dev();
  checkManifestIntegrity(rsbuild);
});

test('should generate manifest file with integrity in dev when html plugin is disabled', async ({
  dev,
}) => {
  const rsbuild = await dev({
    config: {
      tools: {
        htmlPlugin: false,
      },
    },
  });
  checkManifestIntegrity(rsbuild);
});
