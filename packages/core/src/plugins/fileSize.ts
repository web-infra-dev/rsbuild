/**
 * modified from https://github.com/facebook/create-react-app
 * license at https://github.com/facebook/create-react-app/blob/master/LICENSE
 */
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import zlib from 'node:zlib';
import color from 'picocolors';
import { CSS_REGEX, HTML_REGEX, JS_REGEX } from '../constants';
import { logger } from '../logger';
import type { PrintFileSizeOptions, RsbuildPlugin, Rspack } from '../types';

const gzip = promisify(zlib.gzip);

async function gzipSize(input: Buffer) {
  const data = await gzip(input);
  return data.length;
}

/** Filter source map and license files */
export const filterAsset = (asset: string): boolean =>
  !/\.map$/.test(asset) && !/\.LICENSE\.txt$/.test(asset);

const getAssetColor = (size: number) => {
  if (size > 300 * 1000) {
    return color.red;
  }
  if (size > 100 * 1000) {
    return color.yellow;
  }
  return color.green;
};

function getHeader(
  longestFileLength: number,
  longestLabelLength: number,
  options: PrintFileSizeOptions,
) {
  const longestLengths = [longestFileLength, longestLabelLength];
  const rowTypes = ['File', 'Size'];

  if (options.compressed) {
    rowTypes.push('Gzipped');
  }

  const headerRow = rowTypes.reduce((prev, cur, index) => {
    const length = longestLengths[index];
    let curLabel = cur;
    if (length) {
      curLabel =
        cur.length < length ? cur + ' '.repeat(length - cur.length) : cur;
    }
    return `${prev + curLabel}    `;
  }, '  ');

  return color.bold(color.blue(headerRow));
}

const calcFileSize = (len: number) => {
  const val = len / 1000;
  return `${val.toFixed(val < 1 ? 2 : 1)} kB`;
};

const coloringAssetName = (assetName: string) => {
  if (JS_REGEX.test(assetName)) {
    return color.cyan(assetName);
  }
  if (CSS_REGEX.test(assetName)) {
    return color.yellow(assetName);
  }
  if (HTML_REGEX.test(assetName)) {
    return color.green(assetName);
  }
  return color.magenta(assetName);
};

async function printFileSizes(
  options: PrintFileSizeOptions,
  stats: Rspack.Stats,
  rootPath: string,
) {
  const logs: string[] = [];
  if (options.detail === false && options.total === false) {
    return logs;
  }

  const formatAsset = async (
    asset: Rspack.StatsAsset,
    distPath: string,
    distFolder: string,
  ) => {
    const fileName = asset.name.split('?')[0];
    const contents = await fs.promises.readFile(path.join(distPath, fileName));
    const size = contents.length;
    const gzippedSize = options.compressed ? await gzipSize(contents) : null;
    const gzipSizeLabel = gzippedSize
      ? getAssetColor(gzippedSize)(calcFileSize(gzippedSize))
      : null;

    return {
      size,
      folder: path.join(distFolder, path.dirname(fileName)),
      name: path.basename(fileName),
      gzippedSize,
      sizeLabel: calcFileSize(size),
      gzipSizeLabel,
    };
  };

  const getAssets = async () => {
    const distPath = stats.compilation.outputOptions.path;

    if (!distPath) {
      return [];
    }

    const origin = stats.toJson({
      all: false,
      assets: true,
      cachedAssets: true,
      groupAssetsByInfo: false,
      groupAssetsByPath: false,
      groupAssetsByChunk: false,
      groupAssetsByExtension: false,
      groupAssetsByEmitStatus: false,
    });

    const filteredAssets = origin.assets!.filter((asset) =>
      filterAsset(asset.name),
    );

    const distFolder = path.relative(rootPath, distPath);

    return Promise.all(
      filteredAssets.map((asset) => formatAsset(asset, distPath, distFolder)),
    );
  };
  const assets = await getAssets();

  if (assets.length === 0) {
    return logs;
  }

  assets.sort((a, b) => a.size - b.size);

  const longestLabelLength = Math.max(...assets.map((a) => a.sizeLabel.length));
  const longestFileLength = Math.max(
    ...assets.map((a) => (a.folder + path.sep + a.name).length),
  );

  if (options.detail !== false) {
    logs.push(getHeader(longestFileLength, longestLabelLength, options));
  }

  let totalSize = 0;
  let totalGzipSize = 0;

  for (const asset of assets) {
    let { sizeLabel } = asset;
    const { name, folder, gzipSizeLabel } = asset;
    const fileNameLength = (folder + path.sep + name).length;
    const sizeLength = sizeLabel.length;

    totalSize += asset.size;

    if (asset.gzippedSize) {
      totalGzipSize += asset.gzippedSize;
    }

    if (options.detail !== false) {
      if (sizeLength < longestLabelLength) {
        const rightPadding = ' '.repeat(longestLabelLength - sizeLength);
        sizeLabel += rightPadding;
      }

      let fileNameLabel =
        color.dim(asset.folder + path.sep) + coloringAssetName(asset.name);

      if (fileNameLength < longestFileLength) {
        const rightPadding = ' '.repeat(longestFileLength - fileNameLength);
        fileNameLabel += rightPadding;
      }

      let log = `  ${fileNameLabel}    ${sizeLabel}`;

      if (gzipSizeLabel) {
        log += `    ${gzipSizeLabel}`;
      }

      logs.push(log);
    }
  }

  if (options.total !== false) {
    const totalSizeLabel = `${color.bold(
      color.blue('Total size:'),
    )}  ${calcFileSize(totalSize)}`;

    let log = `\n  ${totalSizeLabel}\n`;

    if (options.compressed) {
      const gzippedSizeLabel = `${color.bold(
        color.blue('Gzipped size:'),
      )}  ${calcFileSize(totalGzipSize)}`;
      log += `  ${gzippedSizeLabel}\n`;
    }

    logs.push(log);
  }

  return logs;
}

export const pluginFileSize = (): RsbuildPlugin => ({
  name: 'rsbuild:file-size',

  setup(api) {
    api.onAfterBuild(async ({ stats, environments, isFirstCompile }) => {
      // No need to print file sizes if there is any compilation error
      if (!stats || stats.hasErrors() || !isFirstCompile) {
        return;
      }

      await Promise.all(
        Object.values(environments).map(async (environment, index) => {
          const { printFileSize } = environment.config.performance;

          if (printFileSize === false) {
            return;
          }

          const multiStats = 'stats' in stats ? stats.stats : [stats];

          const defaultConfig = {
            total: true,
            detail: true,
            compressed: true,
          };

          const mergedConfig =
            printFileSize === true
              ? defaultConfig
              : {
                  ...defaultConfig,
                  ...printFileSize,
                };

          const statsLog = await printFileSizes(
            mergedConfig,
            multiStats[index],
            api.context.rootPath,
          );

          const name = color.green(environment.name);
          logger.info(`Production file sizes for ${name}:\n`);

          for (const log of statsLog) {
            logger.log(log);
          }
        }),
      ).catch((err) => {
        logger.warn('Failed to print file size.');
        logger.warn(err as Error);
      });
    });
  },
});
