import { expect, test } from '@e2e/helper';

test('should transform inlined CSS via lightningcss if target is node in dev', async ({
  devOnly,
}) => {
  await devOnly();

  const entry = './dist-dev/index.js';
  const { style } = await import(entry);
  expect(style).toContain(`.foo {
  -webkit-transition: all .5s;
  transition: all .5s;
}`);
});

test('should transform inlined CSS via lightningcss if target is node in build', async ({
  build,
}) => {
  await build();

  const entry = './dist-build/index.js';
  const { style } = await import(entry);
  expect(style).toContain(
    '.foo{-webkit-transition:all .5s;transition:all .5s}',
  );
});
