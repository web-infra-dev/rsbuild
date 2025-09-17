import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'should allow to disable the built-in lightningcss loader',
  async ({ build }) => {
    const rsbuild = await build();
    const files = rsbuild.getDistFiles();

    const content =
      files[Object.keys(files).find((file) => file.endsWith('.css'))!];

    expect(content).not.toContain('-webkit-');
    expect(content).not.toContain('-ms-');
  },
);
