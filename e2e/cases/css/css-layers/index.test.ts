import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should bundle CSS layers as expected in build',
  async ({ buildOnly }) => {
    const rsbuild = await buildOnly();
    const files = rsbuild.getDistFiles();

    const content =
      files[Object.keys(files).find((file) => file.endsWith('.css'))!];

    expect(content).toEqual(
      '@layer a{.a{color:red}}@layer b{.b{color:green}}@layer c{@layer{.c-sub{color:#00f}.c-sub2{color:green}}.c{color:#00f}}',
    );
  },
);

rspackOnlyTest(
  'should bundle CSS layers as expected in dev',
  async ({ dev }) => {
    const rsbuild = await dev();
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
  },
);
