import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from '@e2e/helper';
import { getFileContent } from '@rstackjs/test-utils';

for (const mode of ['package', 'workspace', 'shared']) {
  test(`should respect the PostCSS config search boundary (${mode})`, async ({
    build,
  }) => {
    const parent = await mkdtemp(join(tmpdir(), 'rsbuild-postcss-'));
    const workspace = join(parent, 'workspace');
    const app = join(workspace, 'app');

    try {
      await mkdir(app, { recursive: true });
      await cp(join(import.meta.dirname, 'src'), join(app, 'src'), {
        recursive: true,
      });
      await writeFile(join(app, 'package.json'), '{}');
      await writeFile(
        join(parent, 'postcss.config.cjs'),
        'throw new Error("PostCSS config outside the project was loaded");',
      );

      if (mode !== 'package') {
        await writeFile(
          join(workspace, 'package.json'),
          '{"workspaces":["app"]}',
        );
      }
      const shared = mode === 'shared';
      if (shared) {
        await writeFile(
          join(workspace, 'postcss.config.cjs'),
          `module.exports = {
            plugins: [{
              postcssPlugin: 'workspace-marker',
              Declaration(decl) { decl.value = 'shared'; },
            }],
          };`,
        );
      }

      const rsbuild = await build({ cwd: app });
      const css = getFileContent(rsbuild.getDistFiles(), 'index.css');
      expect(css).toContain(`--marker:${shared ? 'shared' : 'original'}`);
    } finally {
      await rm(parent, { recursive: true, force: true });
    }
  });
}
