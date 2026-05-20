import { expect, test } from '@e2e/helper';

const findDistFile = (
  files: Record<string, string>,
  matcher: (filename: string) => boolean,
) => {
  const matched = Object.entries(files).find(([filename]) => matcher(filename));

  expect(matched).toBeTruthy();

  return matched![1];
};

test('should define import.meta.env.SSR based on environment target', async ({
  build,
}) => {
  const rsbuild = await build();
  const files = rsbuild.getDistFiles();

  const webBundle = findDistFile(files, (filename) =>
    filename.endsWith('dist/static/js/index.js'),
  );
  const nodeBundle = findDistFile(files, (filename) =>
    filename.endsWith('dist/node/index.js'),
  );

  expect(webBundle).toContain('"SSR":false');
  expect(webBundle).toContain("console.log('direct SSR:', false);");
  expect(webBundle).toContain("console.log('destructured SSR:', SSR);");

  expect(nodeBundle).toContain('const directSSR = true;');
  expect(nodeBundle).toContain('"SSR":true');
  expect(nodeBundle).toContain("console.log('direct SSR:', true);");
  expect(nodeBundle).toContain("console.log('destructured SSR:', SSR);");
});
