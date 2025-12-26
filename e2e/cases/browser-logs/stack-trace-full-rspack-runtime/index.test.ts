import { rspackTest } from '@e2e/helper';

rspackTest(
  'should display stack frame for Rspack runtime modules',
  async ({ dev }) => {
    const rsbuild = await dev();
    await rsbuild.expectLog('[browser] Uncaught Error: foo');
    await rsbuild.expectLog(
      /at __webpack_require__\.O \(webpack\/runtime\/on_chunk_loaded:\d+:\d+\)/,
    );
  },
);
