import { build, dev, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should bundle CSS layers as expected in build', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });
  const files = rsbuild.getDistFiles();

  const content =
    files[Object.keys(files).find((file) => file.endsWith('.css'))!];

  expect(content).toEqual(
    '@layer a{.a{color:red}}@layer b{.b{color:green}}@layer c{@layer{.c-sub{color:#00f}.c-sub2{color:green}}.c{color:#00f}}',
  );
});

rspackOnlyTest(
  'should bundle CSS layers as expected in dev',
  async ({ page }) => {
    const rsbuild = await dev({
      cwd: __dirname,
      page,
      rsbuildConfig: {
        dev: {
          writeToDisk: true,
        },
      },
    });
    const files = rsbuild.getDistFiles();

    const content =
      files[Object.keys(files).find((file) => file.endsWith('.css'))!];

    expect(content.trim()).toEqual(`@layer a {
.a {
  color: red;
}

}
@layer b {
.b {
  color: green;
}

}
@layer c {
@layer {.c-sub {
  color: #00f;
}

.c-sub2 {
  color: green;
}
}
}
@layer c {
.c {
  color: #00f;
}

}`);

    await rsbuild.close();
  },
);
