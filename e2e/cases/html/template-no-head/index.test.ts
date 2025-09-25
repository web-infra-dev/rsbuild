import { expect, getFileContent, rspackTest } from '@e2e/helper';

// https://github.com/web-infra-dev/rsbuild/issues/4924
rspackTest(
  'should inject tags to HTML template without <head> tag',
  async ({ build }) => {
    const rsbuild = await build();
    const files = rsbuild.getDistFiles();

    const indexHtml = getFileContent(files, 'index.html');
    expect(indexHtml).toContain(
      '<!doctype html><head><title>Rsbuild App</title><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script defer src=',
    );
  },
);
