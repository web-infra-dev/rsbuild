import { join } from 'node:path';
import type { MultiStats, Stats } from '@rsbuild/shared';
import { run } from './runner';

export type ServerUtils = {
  readFileSync: (fileName: string) => string;
  getHTMLPaths: () => Record<string, string>;
  distPath: string;
};

export const ssrLoadModule = async (
  stats: Stats | MultiStats,
  entryName: string,
  utils: ServerUtils,
) => {
  // TODO：need a unique and accurate ssr environment identifier.
  // get ssr bundle from server stats
  const serverStats =
    'stats' in stats
      ? stats.stats.find((s) => s.compilation.options.target === 'node')!
      : stats;

  const { chunks, entrypoints, outputPath } = serverStats.toJson({
    all: false,
    chunks: true,
    entrypoints: true,
    outputPath: true,
  });

  if (!entrypoints?.[entryName]) {
    throw new Error(`can't find ssr entry(${entryName})`);
  }

  const { chunks: entryChunks } = entrypoints[entryName];

  const files = entryChunks.reduce<string[]>((prev, curr) => {
    const c = curr ? chunks?.find((c) => c.names.includes(curr)) : undefined;

    return c
      ? prev.concat(c?.files.filter((file) => !file.endsWith('.css')))
      : prev;
  }, []);

  if (files.length === 0) {
    throw new Error(`can't get ssr bundle by entryName(${entryName})`);
  }

  if (files.length > 1) {
    throw new Error(
      `only support load single ssr bundle, but got ${files.length}: ${files.join(',')}`,
    );
  }

  const res = await run(
    files[0],
    outputPath!,
    serverStats.compilation.options,
    utils.readFileSync,
  );

  return res;
};

export const getTransformedHtml = async (
  entryName: string,
  utils: ServerUtils,
) => {
  const htmlPaths = utils.getHTMLPaths();
  const htmlPath = htmlPaths[entryName];

  if (!htmlPath) {
    throw new Error(`can't get html file by entryName(${entryName})`);
  }

  const fileName = join(utils.distPath, htmlPath);

  const fileContent = utils.readFileSync(fileName);

  return fileContent;
};
