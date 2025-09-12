import fs from 'node:fs';
import net from 'node:net';
import { platform } from 'node:os';
import { join, sep } from 'node:path';
import { URL } from 'node:url';
import type { RsbuildPlugin } from '@rsbuild/core';
import glob, {
  convertPathToPattern,
  type Options as GlobOptions,
} from 'fast-glob';
import type { Page } from 'playwright';
import sourceMap from 'source-map';
import { expect } from './fixture';

/**
 * Build an URL based on the entry name and port
 */
export const buildEntryUrl = (entryName: string, port: number) => {
  const htmlRoot = new URL(`http://localhost:${port}`);
  const homeUrl = new URL(`${entryName}.html`, htmlRoot);
  return homeUrl.href;
};

/**
 * Build the entry URL and navigate to it
 */
export const gotoPage = async (
  page: Page,
  rsbuild: { port: number },
  path = 'index',
) => {
  const url = buildEntryUrl(path, rsbuild.port);
  return page.goto(url);
};

export const noop = async () => {};

function isPortAvailable(port: number) {
  try {
    const server = net.createServer().listen(port);
    return new Promise((resolve) => {
      server.on('listening', () => {
        server.close();
        resolve(true);
      });
      server.on('error', () => {
        resolve(false);
      });
    });
  } catch {
    return false;
  }
}

const portMap = new Map();

/**
 * Get a random port
 * Available port ranges: 1024 ～ 65535
 * `10080` is not available on macOS CI, `> 50000` get 'permission denied' on Windows.
 * so we use `15000` ~ `45000`.
 */
export async function getRandomPort(
  defaultPort = Math.ceil(Math.random() * 30000) + 15000,
) {
  let port = defaultPort;
  while (true) {
    if (!portMap.get(port) && (await isPortAvailable(port))) {
      portMap.set(port, 1);
      return port;
    }
    port++;
  }
}

// fast-glob only accepts posix path
// https://github.com/mrmlnc/fast-glob#convertpathtopatternpath
const convertPath = (path: string) => {
  if (platform() === 'win32') {
    return convertPathToPattern(path);
  }
  return path;
};

/**
 * Read the contents of a directory and return a map of
 * file paths to their contents.
 */
export const readDirContents = async (path: string, options?: GlobOptions) => {
  const files = await glob(convertPath(join(path, '**/*')), options);
  const ret: Record<string, string> = {};

  await Promise.all(
    files.map((file) =>
      fs.promises.readFile(file, 'utf-8').then((content) => {
        ret[file] = content;
      }),
    ),
  );

  return ret;
};

/**
 * Expect a file to exist
 */
export const expectFile = (dir: string) =>
  expectPoll(() => fs.existsSync(dir)).toBeTruthy();

/**
 * Expect a file to exist and include specified content
 */
export const expectFileWithContent = (
  filePath: string,
  expectedContent: string,
) =>
  expectPoll(() => {
    try {
      if (!fs.existsSync(filePath)) {
        return false;
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      return content.includes(expectedContent);
    } catch {
      return false;
    }
  }).toBeTruthy();

// Windows and macOS use different new lines
export const normalizeNewlines = (str: string) => str.replace(/\r\n/g, '\n');

/**
 * A faster `expect.poll`
 */
export const expectPoll = (fn: () => boolean) => {
  return expect.poll(fn, {
    intervals: [20, 30, 40, 50, 60, 70, 80, 90, 100],
  });
};

/**
 * Read the contents of a dist directory and return a map of
 * file paths to their contents.
 */
export const getDistFiles = async (distPath: string, sourceMaps = false) => {
  return readDirContents(distPath, {
    absolute: true,
    ignore: !sourceMaps ? [join(distPath, '/**/*.map')] : [],
  });
};

export const recordPluginHooks = () => {
  const hooks: string[] = [];

  const plugin: RsbuildPlugin = {
    name: 'record-hooks-plugin',
    setup(api) {
      api.modifyRspackConfig(() => {
        hooks.push('ModifyBundlerConfig');
      });
      api.modifyWebpackChain(() => {
        hooks.push('ModifyBundlerConfig');
      });
      api.modifyRsbuildConfig(() => {
        hooks.push('ModifyRsbuildConfig');
      });
      api.modifyEnvironmentConfig(() => {
        hooks.push('ModifyEnvironmentConfig');
      });
      api.modifyBundlerChain(() => {
        hooks.push('ModifyBundlerChain');
      });
      api.modifyHTML((html) => {
        hooks.push('ModifyHTML');
        return html;
      });
      api.modifyHTMLTags((tags) => {
        hooks.push('ModifyHTMLTags');
        return tags;
      });
      api.onBeforeStartDevServer(() => {
        hooks.push('BeforeStartDevServer');
      });
      api.onAfterStartDevServer(() => {
        hooks.push('AfterStartDevServer');
      });
      api.onBeforeCreateCompiler(() => {
        hooks.push('BeforeCreateCompiler');
      });
      api.onAfterCreateCompiler(() => {
        hooks.push('AfterCreateCompiler');
      });
      api.onBeforeBuild(() => {
        hooks.push('BeforeBuild');
      });
      api.onBeforeDevCompile(() => {
        hooks.push('BeforeDevCompile');
      });
      api.onAfterBuild(() => {
        hooks.push('AfterBuild');
      });
      api.onBeforeEnvironmentCompile(() => {
        hooks.push('BeforeEnvironmentCompile');
      });
      api.onAfterEnvironmentCompile(() => {
        hooks.push('AfterEnvironmentCompile');
      });
      api.onBeforeStartProdServer(() => {
        hooks.push('BeforeStartProdServer');
      });
      api.onCloseDevServer(() => {
        hooks.push('CloseDevServer');
      });
      api.onAfterStartProdServer(() => {
        hooks.push('AfterStartProdServer');
      });
      api.onAfterDevCompile(() => {
        hooks.push('AfterDevCompile');
      });
      api.onDevCompileDone(() => {
        hooks.push('DevCompileDone');
      });
      api.onCloseBuild(() => {
        hooks.push('CloseBuild');
      });
    },
  };

  return { plugin, hooks };
};

export async function mapSourceMapPositions(
  rawSourceMap: string,
  generatedPositions: {
    line: number;
    column: number;
  }[],
) {
  const consumer = await new sourceMap.SourceMapConsumer(rawSourceMap);

  const originalPositions = generatedPositions.map((generatedPosition) =>
    consumer.originalPositionFor({
      line: generatedPosition.line,
      column: generatedPosition.column,
    }),
  );

  consumer.destroy();
  return originalPositions;
}

/**
 * Convert Windows backslash paths to posix forward slashes
 * @example
 * toPosixPath('foo\\bar') // returns 'foo/bar'
 */
export const toPosixPath = (filepath: string): string => {
  if (sep === '/') {
    return filepath;
  }
  return filepath.replace(/\\/g, '/');
};
