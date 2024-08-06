import { join } from 'node:path';
import type { EnvironmentContext, Stats } from '../types';
import { run } from './runner';

export type ServerUtils = {
  readFileSync: (fileName: string) => string;
  environment: EnvironmentContext;
};

export const loadBundle = async <T>(
  stats: Stats,
  entryName: string,
  utils: ServerUtils,
): Promise<T> => {
  const { chunks, entrypoints, outputPath } = stats.toJson({
    all: false,
    chunks: true,
    entrypoints: true,
    outputPath: true,
  });

  if (!entrypoints?.[entryName]) {
    throw new Error(`can't find entry(${entryName})`);
  }

  const { chunks: entryChunks = [] } = entrypoints[entryName];

  // find main entryChunk from chunks
  const files = entryChunks.reduce<string[]>((prev, entryChunkName) => {
    const chunk = chunks?.find(
      (chunk) => chunk.entry && chunk.names?.includes(String(entryChunkName)),
    );

    return chunk?.files
      ? prev.concat(chunk.files.filter((file) => !file.endsWith('.css')))
      : prev;
  }, []);

  if (files.length === 0) {
    throw new Error(`can't get bundle by entryName(${entryName})`);
  }

  // An entrypoint should have only one entryChunk, but there may be some boundary cases
  if (files.length > 1) {
    throw new Error(
      `only support load single entry chunk, but got ${files.length}: ${files.join(',')}`,
    );
  }

  const res = await run<T>(
    files[0],
    outputPath!,
    stats.compilation.options,
    utils.readFileSync,
  );

  return res;
};

export const getTransformedHtml = async (
  entryName: string,
  utils: ServerUtils,
): Promise<string> => {
  const { htmlPaths, distPath } = utils.environment;
  const htmlPath = htmlPaths[entryName];

  if (!htmlPath) {
    throw new Error(`can't get html file by entryName(${entryName})`);
  }

  const fileName = join(distPath, htmlPath);

  const fileContent = utils.readFileSync(fileName);

  return fileContent;
};
