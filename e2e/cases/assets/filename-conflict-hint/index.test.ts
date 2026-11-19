import { expect, test } from '@e2e/helper';

test('should print output.filename hints as expected', async ({ build }) => {
  const rsbuild = await build({
    catchBuildError: true,
  });

  expect(rsbuild.buildError).toBeTruthy();

  await rsbuild.expectLog(
    /(?:You may need to adjust output\.filename configuration to prevent name conflicts\.|Multiple assets \(from "\.\.\/\.\.\/\.\.\/assets\/icon\.png" and "\.\.\/\.\.\/\.\.\/assets\/image\.png"\) produce different content for the same output file "static\/image\/image\.png"\.)/,
  );
});
