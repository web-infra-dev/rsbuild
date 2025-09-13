import { expect, rspackTest } from '@e2e/helper';
import type { RsbuildPlugin } from '@rsbuild/core';

rspackTest('should allow plugin to modify HTML content', async ({ build }) => {
  const myPlugin: RsbuildPlugin = {
    name: 'my-plugin',
    setup(api) {
      api.modifyHTML((html, { compilation, filename }) => {
        return html.replace(
          '<body>',
          `<body>
            <div>${filename}</div>
            <div>assets: ${Object.keys(compilation.assets).length}</div>
            `,
        );
      });
    },
  };

  const rsbuild = await build({
    rsbuildConfig: {
      plugins: [myPlugin],
    },
  });

  const files = rsbuild.getDistFiles();
  const indexHTML = Object.keys(files).find(
    (file) => file.includes('index') && file.endsWith('.html'),
  );

  const html = files[indexHTML!];

  expect(html.includes('<div>index.html</div>')).toBeTruthy();
  expect(html.includes('<div>assets: 2</div>')).toBeTruthy();
});

rspackTest(
  'should run modifyHTML hook after modifyHTMLTags hook',
  async ({ build }) => {
    const myPlugin: RsbuildPlugin = {
      name: 'my-plugin',
      setup(api) {
        api.modifyHTMLTags((tags) => {
          tags.bodyTags.push({
            tag: 'div',
            children: 'foo',
          });
          return tags;
        });
        api.modifyHTML((html) => {
          return html.replace('foo', 'bar');
        });
      },
    };

    const rsbuild = await build({
      rsbuildConfig: {
        plugins: [myPlugin],
      },
    });

    const files = rsbuild.getDistFiles();
    const indexHTML = Object.keys(files).find(
      (file) => file.includes('index') && file.endsWith('.html'),
    );

    const html = files[indexHTML!];

    expect(html.includes('foo')).toBeFalsy();
    expect(html.includes('bar')).toBeTruthy();
  },
);
