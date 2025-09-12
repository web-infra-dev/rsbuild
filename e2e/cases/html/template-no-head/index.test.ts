import { expect, rspackOnlyTest } from '@e2e/helper';

// https://github.com/web-infra-dev/rsbuild/issues/4924
rspackOnlyTest(
  'should inject tags to HTML template without <head> tag',
  async ({ buildOnly }) => {
    const rsbuild = await buildOnly();
    const files = rsbuild.getDistFiles();

    const indexHtml =
      files[Object.keys(files).find((file) => file.endsWith('index.html'))!];
    expect(indexHtml).toContain(
      '<!doctype html><head><title>Rsbuild App</title><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script defer src=',
    );
  },
);
