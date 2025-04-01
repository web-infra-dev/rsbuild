import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

// https://github.com/web-infra-dev/rsbuild/issues/4924
rspackOnlyTest(
  'should inject tags to HTML template without <head> tag',
  async () => {
    const rsbuild = await build({
      cwd: __dirname,
    });
    const files = await rsbuild.unwrapOutputJSON();

    const indexHtml =
      files[Object.keys(files).find((file) => file.endsWith('index.html'))!];
    expect(indexHtml).toContain(
      '<!doctype html><head><title>Rsbuild App</title><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script defer src=',
    );
  },
);
