import { expect, getFileContent, test } from '@e2e/helper';

test('should bundle CSS layers as expected in build', async ({ build }) => {
  const rsbuild = await build();
  const files = rsbuild.getDistFiles();
  const content = getFileContent(files, 'index.css');
  expect(content).toEqual(
    '@layer a{.a{color:red}}@layer b{.b{color:green}}@layer c{@layer{.c-sub{color:#00f}.c-sub2{color:green}}.c{color:#00f}}',
  );
});

test('should bundle CSS layers as expected in dev', async ({ dev }) => {
  const rsbuild = await dev();
  const files = rsbuild.getDistFiles();
  const content = getFileContent(files, 'index.css');
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
});
