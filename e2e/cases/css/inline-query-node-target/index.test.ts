import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'should transform inlined CSS via lightningcss if target is node in dev',
  async ({ devOnly }) => {
    await devOnly();

    // @ts-ignore
    const { style } = await import('./dist-dev/index.js');
    expect(style).toContain(`.foo {
  -webkit-transition: all .5s;
  transition: all .5s;
}`);
  },
);

rspackTest(
  'should transform inlined CSS via lightningcss if target is node in build',
  async ({ build }) => {
    await build();

    // @ts-ignore
    const { style } = await import('./dist-build/index.js');
    expect(style).toContain(
      '.foo{-webkit-transition:all .5s;transition:all .5s}',
    );
  },
);
