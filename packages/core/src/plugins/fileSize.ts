/**
 * modified from https://github.com/facebook/create-react-app
 * license at https://github.com/facebook/create-react-app/blob/master/LICENSE
 */
import path from 'node:path';
import { fse, JS_REGEX, CSS_REGEX, HTML_REGEX } from '@rsbuild/shared';
import { color, logger } from '@rsbuild/shared';
import type {
  Stats,
  MultiStats,
  StatsAsset,
  PrintFileSizeOptions,
} from '@rsbuild/shared';
import type { RsbuildPlugin } from '../types';

/** Filter source map and license files */
export const filterAsset = (asset: string) =>
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

async function printHeader(
  longestFileLength: number,
  longestLabelLength: number,
) {
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

  logger.log(color.bold(color.blue(headerRow)));
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
  stats: Stats | MultiStats,
  distPath: string,
) {
  if (config.detail === false && config.total === false) {
    return;
  }

  const { default: gzipSize } = await import('@rsbuild/shared/gzip-size');

  const formatAsset = (asset: StatsAsset) => {
    const fileName = asset.name.split('?')[0];
    const contents = fse.readFileSync(path.join(distPath, fileName));
    const size = contents.length;
    const gzippedSize = gzipSize.sync(contents);

    return {
      size,
      folder: path.join(path.basename(distPath), path.dirname(fileName)),
      name: path.basename(fileName),
      gzippedSize,
      sizeLabel: calcFileSize(size),
      gzipSizeLabel: getAssetColor(gzippedSize)(calcFileSize(gzippedSize)),
    };
  };

  const multiStats = 'stats' in stats ? stats.stats : [stats];
  const assets = multiStats
    .map((stats) => {
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

      return filteredAssets.map(formatAsset);
    })
    .reduce((single, all) => all.concat(single), []);

  if (assets.length === 0) {
    return;
  }

  assets.sort((a, b) => a.size - b.size);

  logger.info('Production file sizes:\n');

  const longestLabelLength = Math.max(...assets.map((a) => a.sizeLabel.length));
  const longestFileLength = Math.max(
    ...assets.map((a) => (a.folder + path.sep + a.name).length),
  );

  if (config.detail !== false) {
    printHeader(longestFileLength, longestLabelLength);
  }

  let totalSize = 0;
  let totalGzipSize = 0;

  assets.forEach((asset) => {
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

      logger.log(`  ${fileNameLabel}    ${sizeLabel}    ${gzipSizeLabel}`);
    }
  });

  if (config.total !== false) {
    const totalSizeLabel = `${color.bold(
      color.blue('Total size:'),
    )}  ${calcFileSize(totalSize)}`;
    const gzippedSizeLabel = `${color.bold(
      color.blue('Gzipped size:'),
    )}  ${calcFileSize(totalGzipSize)}`;
    logger.log(`\n  ${totalSizeLabel}\n  ${gzippedSizeLabel}\n`);
  }
}

export const pluginFileSize = (): RsbuildPlugin => ({
  name: 'rsbuild:file-size',

  setup(api) {
    api.onAfterBuild(async ({ stats }) => {
      const { printFileSize } = api.getNormalizedConfig().performance;

      if (printFileSize === false) {
        return;
      }

      const printFileSizeConfig =
        typeof printFileSize === 'boolean'
          ? {
              total: true,
              detail: true,
            }
          : printFileSize;

      if (stats) {
        try {
          await printFileSizes(
            printFileSizeConfig,
            stats,
            api.context.distPath,
          );
        } catch (err) {
          logger.warn('Failed to print file size.');
          logger.warn(err as Error);
        }
      }
    });
  },
});
