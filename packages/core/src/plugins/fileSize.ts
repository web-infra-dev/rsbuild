/**
 * modified from https://github.com/facebook/create-react-app
 * license at https://github.com/facebook/create-react-app/blob/master/LICENSE
 */
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import zlib from 'node:zlib';
import { JS_REGEX } from '../constants';
import { color, getAssetsFromStats } from '../helpers';
import { logger } from '../logger';
import type {
  PrintFileSizeAsset,
  PrintFileSizeOptions,
  RsbuildPlugin,
  Rspack,
} from '../types';

const gzip = promisify(zlib.gzip);

async function gzipSize(input: Buffer) {
  const data = await gzip(input);
  return Buffer.byteLength(data);
}

const EXCLUDE_ASSET_REGEX = /\.(?:map|LICENSE\.txt|d\.ts)$/;

/** Exclude source map and license files by default */
export const excludeAsset = (asset: PrintFileSizeAsset): boolean =>
  EXCLUDE_ASSET_REGEX.test(asset.name);

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
  maxFileLength: number,
  maxSizeLength: number,
  fileHeader: string,
  showGzipHeader: boolean,
) {
  const lengths = [maxFileLength, maxSizeLength];
  const rowTypes = [fileHeader, 'Size'];

  if (showGzipHeader) {
    rowTypes.push('Gzip');
  }

  const headerRow = rowTypes.reduce((prev, cur, index) => {
    const length = lengths[index];
    let curLabel = cur;
    if (length) {
      curLabel =
        cur.length < length ? cur + ' '.repeat(length - cur.length) : cur;
    }
    return `${prev + curLabel}   `;
  }, '');

  return color.blue(headerRow);
}

const calcFileSize = (len: number) => {
  const val = len / 1000;
  return `${val.toFixed(val < 1 ? 2 : 1)} kB`;
};

const coloringAssetName = (assetName: string) => {
  if (JS_REGEX.test(assetName)) {
    return color.cyan(assetName);
  }
  if (assetName.endsWith('.css')) {
    return color.yellow(assetName);
  }
  if (assetName.endsWith('.html')) {
    return color.green(assetName);
  }
  return color.magenta(assetName);
};

const COMPRESSIBLE_REGEX =
  /\.(?:js|css|html|json|svg|txt|xml|xhtml|wasm|manifest|md)$/i;

const isCompressible = (assetName: string) =>
  COMPRESSIBLE_REGEX.test(assetName);

async function printFileSizes(
  options: PrintFileSizeOptions,
  stats: Rspack.Stats,
  rootPath: string,
  environmentName: string,
) {
  const logs: string[] = [];

  let showTotal = options.total !== false;
  const showDetail = options.detail !== false;
  const exclude = options.exclude ?? excludeAsset;

  if (!showTotal && !showDetail) {
    return logs;
  }

  const formatAsset = async (
    asset: Rspack.StatsAsset,
    distPath: string,
    distFolder: string,
  ) => {
    const fileName = asset.name.split('?')[0];
    const contents = await fs.promises.readFile(path.join(distPath, fileName));
    const size = Buffer.byteLength(contents);
    const compressible = options.compressed && isCompressible(fileName);
    const gzippedSize = compressible ? await gzipSize(contents) : null;
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

    const filteredAssets = getAssetsFromStats(stats).filter((asset) => {
      const assetInfo: PrintFileSizeAsset = {
        name: asset.name,
        size: asset.size,
      };
      if (exclude(assetInfo)) {
        return false;
      }
      if (options.include) {
        return options.include(assetInfo);
      }
      return true;
    });

    const distFolder = path.relative(rootPath, distPath);

    return Promise.all(
      filteredAssets.map((asset) => formatAsset(asset, distPath, distFolder)),
    );
  };
  const assets = await getAssets();

  if (assets.length === 0) {
    return logs;
  }

  logs.push('');

  assets.sort((a, b) => a.size - b.size);

  let totalSize = 0;
  let totalGzipSize = 0;

  // No need to print total size if there is only one asset and detail is true
  showTotal = showTotal && !(showDetail && assets.length === 1);

  for (const asset of assets) {
    totalSize += asset.size;
    if (options.compressed) {
      totalGzipSize += asset.gzippedSize ?? asset.size;
    }
  }

  const fileHeader = showDetail ? `File (${environmentName})` : '';
  const totalSizeLabel = showTotal
    ? showDetail
      ? 'Total:'
      : `Total size (${environmentName}):`
    : '';
  const totalSizeStr = showTotal ? calcFileSize(totalSize) : '';

  if (showDetail) {
    const maxFileLength = Math.max(
      ...assets.map((a) => (a.folder + path.sep + a.name).length),
      showTotal ? totalSizeLabel.length : 0,
      fileHeader.length,
    );

    const maxSizeLength = Math.max(
      ...assets.map((a) => a.sizeLabel.length),
      totalSizeStr.length,
    );

    const showGzipHeader = Boolean(
      options.compressed && assets.some((item) => item.gzippedSize !== null),
    );

    logs.push(
      getHeader(maxFileLength, maxSizeLength, fileHeader, showGzipHeader),
    );

    for (const asset of assets) {
      let { sizeLabel } = asset;
      const { name, folder, gzipSizeLabel } = asset;
      const fileNameLength = (folder + path.sep + name).length;
      const sizeLength = sizeLabel.length;

      if (sizeLength < maxSizeLength) {
        const rightPadding = ' '.repeat(maxSizeLength - sizeLength);
        sizeLabel += rightPadding;
      }

      let fileNameLabel =
        color.dim(asset.folder + path.sep) + coloringAssetName(asset.name);

      if (fileNameLength < maxFileLength) {
        const rightPadding = ' '.repeat(maxFileLength - fileNameLength);
        fileNameLabel += rightPadding;
      }

      let log = `${fileNameLabel}   ${sizeLabel}`;

      if (gzipSizeLabel) {
        log += `   ${gzipSizeLabel}`;
      }

      logs.push(log);
    }

    if (showTotal) {
      logs.push('');
      let log = '';
      log += ' '.repeat(maxFileLength - totalSizeLabel.length);
      log += color.magenta(totalSizeLabel);
      log += `   ${totalSizeStr}`;

      if (options.compressed) {
        const colorFn = getAssetColor(totalGzipSize / assets.length);
        log += ' '.repeat(maxSizeLength - totalSizeStr.length);
        log += `   ${colorFn(calcFileSize(totalGzipSize))}`;
      }

      logs.push(log);
    }
  } else if (showTotal) {
    let log = `${color.magenta(totalSizeLabel)} ${totalSizeStr}`;

    if (options.compressed) {
      log += color.green(` (${calcFileSize(totalGzipSize)} gzipped)`);
    }

    logs.push(log);
  }

  logs.push('');

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

      const logs: string[] = [];

      await Promise.all(
        Object.values(environments).map(async (environment, index) => {
          const { printFileSize } = environment.config.performance;

          if (printFileSize === false) {
            return;
          }

          const multiStats = 'stats' in stats ? stats.stats : [stats];

          const defaultConfig: PrintFileSizeOptions = {
            total: true,
            detail: true,
            // print compressed size for the browser targets by default
            compressed: environment.config.output.target !== 'node',
          };

          const mergedConfig =
            printFileSize === true
              ? defaultConfig
              : {
                  ...defaultConfig,
                  ...printFileSize,
                };

          const statsLogs = await printFileSizes(
            mergedConfig,
            multiStats[index],
            api.context.rootPath,
            environment.name,
          );

          logs.push(...statsLogs);
        }),
      ).catch((err) => {
        logger.warn('Failed to print file size.');
        logger.warn(err as Error);
      });

      logger.log(logs.join('\n'));
    });
  },
});
