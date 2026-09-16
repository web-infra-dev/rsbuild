import { execFileSync } from 'node:child_process';
import { join, relative } from 'node:path';
import { expect, test } from '@e2e/helper';

// SSR entries and async chunks emitted to the same directory could
// collide when a compact-hashed chunk ID matched an entry name (e.g. "a").
test('should avoid filename conflicts between node entries and async chunks', async ({
  build,
}) => {
  const rsbuild = await build();
  const files = Object.keys(rsbuild.getDistFiles()).map((file) =>
    relative(rsbuild.distPath, file),
  );

  expect(files).toContain('a.js');
  expect(files).toHaveLength(2);
  expect(files.every((file) => /^[^/\\]+\.js$/.test(file))).toBe(true);
  expect(
    execFileSync(process.execPath, [join(rsbuild.distPath, 'a.js')], {
      encoding: 'utf8',
    }).trim(),
  ).toBe('async chunk loaded');
});
