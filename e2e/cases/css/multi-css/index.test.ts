import { expect, rspackTest } from '@e2e/helper';

rspackTest('should emit multiple CSS files correctly', async ({ build }) => {
  const rsbuild = await build();

  const files = rsbuild.getDistFiles();
  const entry1CSS = Object.keys(files).find(
    (file) => file.includes('entry1') && file.endsWith('.css'),
  )!;
  const entry2CSS = Object.keys(files).find(
    (file) => file.includes('entry2') && file.endsWith('.css'),
  )!;
  const entry3CSS = Object.keys(files).find(
    (file) => file.includes('entry3') && file.endsWith('.css'),
  )!;

  expect(files[entry1CSS]).toContain('#entry1{color:red}');
  expect(files[entry2CSS]).toContain('#entry2{color:#00f}');
  expect(files[entry3CSS]).toContain('#entry3{color:green}');
});
