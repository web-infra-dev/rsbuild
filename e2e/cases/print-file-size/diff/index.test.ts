import { join } from 'node:path';
import { expect, rspackTest } from '@e2e/helper';
import fse from 'fs-extra';
import { extractFileSizeLogs } from '../helper';

rspackTest(
  'should print file size diff as expected',
  async ({ cwd, build, editFile, copySrcDir }) => {
    const cacheDir = join(cwd, 'node_modules/.cache');
    await fse.remove(cacheDir);
    const srcDir = await copySrcDir();
    const config = {
      source: {
        entry: {
          index: join(srcDir, 'index.js'),
        },
      },
    };

    const rsbuild1 = await build({ config });
    expect(extractFileSizeLogs(rsbuild1.logs)).toEqual(`
File (web)                         Size      Gzip
dist/static/js/index.[[hash]].js   X.X kB   X.X kB
dist/index.html                    X.X kB   X.X kB
                          Total:   X.X kB   X.X kB`);
    rsbuild1.clearLogs();

    editFile(
      join(srcDir, 'index.js'),
      () => `import "./App.css";
import React from 'react';
import ReactDOM from 'react-dom';
console.log(React);
console.log(ReactDOM);
`,
    );

    const rsbuild2 = await build({ config });
    expect(extractFileSizeLogs(rsbuild2.logs)).toEqual(`
File (web)                           Size                 Gzip
dist/static/css/index.[[hash]].css   X.X kB (+X.X kB)   X.X kB (+X.X kB)
dist/index.html                      X.X kB (+X.X kB)   X.X kB (+X.X kB)
dist/static/js/index.[[hash]].js     X.X kB (+X.X kB)   X.X kB (+X.X kB)
dist/static/js/631.[[hash]].js       X.X kB (+X.X kB)   X.X kB (+X.X kB)
                            Total:   X.X kB (+X.X kB)   X.X kB (+X.X kB)`);
    rsbuild2.clearLogs();

    editFile(join(srcDir, 'index.js'), () => `import "./App.css";`);

    const rsbuild3 = await build({ config });
    expect(extractFileSizeLogs(rsbuild3.logs)).toEqual(`
File (web)                           Size                 Gzip
dist/static/js/index.[[hash]].js     X.X kB (-X.X kB)   X.X kB (-X.X kB)
dist/static/css/index.[[hash]].css   X.X kB              X.X kB
dist/index.html                      X.X kB (-X.X kB)   X.X kB (-X.X kB)
                            Total:   X.X kB (-X.X kB)   X.X kB (-X.X kB)`);
  },
);
