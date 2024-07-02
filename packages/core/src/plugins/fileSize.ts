/**
 * modified from https://github.com/facebook/create-react-app
 * license at https://github.com/facebook/create-react-app/blob/master/LICENSE
 */
import fs from 'node:fs';
import path from 'node:path';
import { color } from '@rsbuild/shared';
import type { PrintFileSizeOptions, Stats, StatsAsset } from '@rsbuild/shared';
import { CSS_REGEX, HTML_REGEX, JS_REGEX } from '../constants';
import { logger } from '../logger';
import type { RsbuildPlugin } from '../types';

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

function getHeader(longestFileLength: number, longestLabelLength: number) {
  const longestLengths = [longestFileLength, longestLabelLength];
  const headerRow = ['File', 'Size', 'Gzipped'].reduce((prev, cur, index) => {
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
  config: PrintFileSizeOptions,
  stats: Stats,
  rootPath: string,
) {
  const logs: string[] = [];
  if (config.detail === false && config.total === false) {
    return logs;
  }

  const { default: gzipSize } = await import('@rsbuild/shared/gzip-size');

  const formatAsset = (
    asset: StatsAsset,
    distPath: string,
    distFolder: string,
  ) => {
    const fileName = asset.name.split('?')[0];
    const contents = fs.readFileSync(path.join(distPath, fileName));
    const size = contents.length;
    const gzippedSize = gzipSize.sync(contents);

    return {
      size,
      folder: path.join(distFolder, path.dirname(fileName)),
      name: path.basename(fileName),
      gzippedSize,
      sizeLabel: calcFileSize(size),
      gzipSizeLabel: getAssetColor(gzippedSize)(calcFileSize(gzippedSize)),
    };
  };

  const getAssets = () => {
    const distPath = stats.compilation.outputOptions.path;

    if (!distPath) {
      return [];
    }

    const origin = stats.toJson({
      all: false,
      assets: true,
      // TODO: need supported in rspack
      // @ts-expect-error
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

    return filteredAssets.map((asset) =>
      formatAsset(asset, distPath, distFolder),
    );
  };
  const assets = getAssets();

  if (assets.length === 0) {
    return logs;
  }

  assets.sort((a, b) => a.size - b.size);

  const longestLabelLength = Math.max(...assets.map((a) => a.sizeLabel.length));
  const longestFileLength = Math.max(
    ...assets.map((a) => (a.folder + path.sep + a.name).length),
  );

  if (config.detail !== false) {
    logs.push(getHeader(longestFileLength, longestLabelLength));
  }

  let totalSize = 0;
  let totalGzipSize = 0;

  for (const asset of assets) {
    let { sizeLabel } = asset;
    const { name, folder, gzipSizeLabel } = asset;
    const fileNameLength = (folder + path.sep + name).length;
    const sizeLength = sizeLabel.length;

    totalSize += asset.size;
    totalGzipSize += asset.gzippedSize;

    if (config.detail !== false) {
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

      logs.push(`  ${fileNameLabel}    ${sizeLabel}    ${gzipSizeLabel}`);
    }
  }

  if (config.total !== false) {
    const totalSizeLabel = `${color.bold(
      color.blue('Total size:'),
    )}  ${calcFileSize(totalSize)}`;
    const gzippedSizeLabel = `${color.bold(
      color.blue('Gzipped size:'),
    )}  ${calcFileSize(totalGzipSize)}`;
    logs.push(`\n  ${totalSizeLabel}\n  ${gzippedSizeLabel}\n`);
  }

  return logs;
}

export const pluginFileSize = (): RsbuildPlugin => ({
  name: 'rsbuild:file-size',

  setup(api) {
    api.onAfterBuild(async ({ stats, environments }) => {
      if (!stats) {
        return;
      }

      await Promise.all(
        Object.values(environments).map(async (environment, index) => {
          const { printFileSize } = environment.config.performance;

          const multiStats = 'stats' in stats ? stats.stats : [stats];

          const printFileSizeConfig =
            typeof printFileSize === 'boolean'
              ? {
                  total: true,
                  detail: true,
                }
              : printFileSize;

          if (printFileSize) {
            const statsLog = await printFileSizes(
              printFileSizeConfig,
              multiStats[index],
              api.context.rootPath,
            );

            const name = color.green(environment.name);
            logger.info(`Production file sizes for ${name}:\n`);

            for (const log of statsLog) {
              logger.log(log);
            }
          }
        }),
      ).catch((err) => {
        logger.warn('Failed to print file size.');
        logger.warn(err as Error);
      });
    });
  },
});
