/**
 * modified from https://github.com/facebook/create-react-app
 * license at https://github.com/facebook/create-react-app/blob/master/LICENSE
 */
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import zlib from 'node:zlib';
import { JS_REGEX } from '../constants';
import { color } from '../helpers';
import { getAssetsFromStats, type RsbuildAsset } from '../helpers/stats';
import { logger } from '../logger';
import type {
  InternalContext,
  PrintFileSizeAsset,
  PrintFileSizeOptions,
  RsbuildPlugin,
  Rspack,
} from '../types';

interface FileSizeCache {
  [environmentName: string]: {
    [fileName: string]: {
      size: number;
      gzippedSize?: number;
    };
  };
}

const gzip = promisify(zlib.gzip);

async function gzipSize(input: Buffer) {
  const data = await gzip(input);
  return Buffer.byteLength(data);
}

/** Get the cache file path for storing previous build sizes */
function getCacheFilePath(cachePath: string): string {
  return path.join(cachePath, 'file-sizes-cache.json');
}

/** Normalize file name by removing hash for comparison across builds */
export function normalizeFileName(fileName: string): string {
  // Remove hash patterns like .a1b2c3d4. but keep the extension
  return fileName.replace(/\.[a-f0-9]{8,}\./g, '.');
}

/** Load previous build file sizes from cache */
async function loadPreviousSizes(cachePath: string): Promise<FileSizeCache> {
  const cacheFile = getCacheFilePath(cachePath);
  try {
    const content = await fs.promises.readFile(cacheFile, 'utf-8');
    return JSON.parse(content);
  } catch {
    // Cache doesn't exist or is invalid, return empty cache
    return {};
  }
}

/** Save current build file sizes to cache */
async function saveSizes(
  cachePath: string,
  cache: FileSizeCache,
): Promise<void> {
  const cacheFile = getCacheFilePath(cachePath);
  const cacheDir = path.dirname(cacheFile);

  try {
    await fs.promises.mkdir(cacheDir, { recursive: true });
    await fs.promises.writeFile(cacheFile, JSON.stringify(cache, null, 2));
  } catch (err) {
    // Fail silently - cache is not critical
    logger.debug('Failed to save file size cache:', err);
  }
}

const EXCLUDE_ASSET_REGEX = /\.(?:map|LICENSE\.txt|d\.ts)$/;

/** Exclude source map and license files by default */
export const excludeAsset = (asset: PrintFileSizeAsset): boolean =>
  EXCLUDE_ASSET_REGEX.test(asset.name);

/** Format a size difference for inline display */
const formatDiff = (diff: number) => {
  const sign = diff > 0 ? '+' : '-';
  const label = `(${sign}${calcFileSize(Math.abs(diff))})`;
  const colorFn = diff > 0 ? color.red : color.green;
  return {
    label: colorFn(label),
    length: label.length,
  };
};

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
  distPath: string,
  environmentName: string,
  previousSizes: FileSizeCache,
) {
  const logs: string[] = [];
  const showDetail = options.detail !== false;
  let showTotal = options.total !== false;
  const showDiff = options.diff === true;

  if (!showTotal && !showDetail) {
    return { logs, currentSizes: {} };
  }

  const exclude = options.exclude ?? excludeAsset;
  const relativeDistPath = path.relative(rootPath, distPath);
  const currentSizes: {
    [fileName: string]: { size: number; gzippedSize?: number };
  } = {};

  const formatAsset = async (asset: RsbuildAsset) => {
    const fileName = asset.name.split('?')[0];
    const contents = await fs.promises.readFile(path.join(distPath, fileName));
    const size = Buffer.byteLength(contents);
    const compressible = options.compressed && isCompressible(fileName);
    const gzippedSize = compressible ? await gzipSize(contents) : null;
    const gzipSizeLabel = gzippedSize
      ? getAssetColor(gzippedSize)(calcFileSize(gzippedSize))
      : null;

    // Normalize filename for comparison (remove hash)
    const normalizedName = normalizeFileName(fileName);
    const previousSizeData = previousSizes[environmentName]?.[normalizedName];
    const previousSize = previousSizeData?.size;

    // Calculate size differences for inline display
    let sizeDiff: number | null = null;
    let gzipDiff: number | null = null;
    if (showDiff && previousSize !== undefined) {
      sizeDiff = size - previousSize;
      if (gzippedSize && previousSizeData?.gzippedSize !== undefined) {
        gzipDiff = gzippedSize - previousSizeData.gzippedSize;
      }
    }

    // Store current size for next build
    currentSizes[normalizedName] = {
      size,
      gzippedSize: gzippedSize ?? undefined,
    };

    const isNew = showDiff && previousSize === undefined;

    // Append inline diff to sizeLabel
    let sizeLabel = calcFileSize(size);
    let sizeLabelLength = sizeLabel.length;
    if (isNew) {
      sizeLabel += ` ${color.cyan('(NEW)')}`;
      sizeLabelLength += 6;
    } else if (sizeDiff !== null && sizeDiff !== 0) {
      const { label, length } = formatDiff(sizeDiff);
      sizeLabel += ` ${label}`;
      sizeLabelLength += length + 1;
    }

    return {
      size,
      sizeLabel,
      sizeLabelLength,
      folder: path.join(relativeDistPath, path.dirname(fileName)),
      name: path.basename(fileName),
      gzippedSize,
      gzipSizeLabel,
      gzipDiff,
      isNew,
    };
  };

  const pickAssetInfo = (asset: PrintFileSizeAsset): PrintFileSizeAsset => ({
    name: asset.name,
    size: asset.size,
  });

  const getAssets = async () => {
    const assets = getAssetsFromStats(stats);
    const filteredAssets = assets.filter((asset) => {
      if (exclude(asset)) {
        return false;
      }
      if (options.include) {
        return options.include(asset);
      }
      return true;
    });

    return Promise.all(filteredAssets.map((asset) => formatAsset(asset)));
  };

  const assets = await getAssets();

  if (assets.length === 0) {
    return { logs, currentSizes: {} };
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

  const getCustomTotal = () => {
    if (typeof options.total === 'function') {
      return options.total({
        environmentName,
        distPath: relativeDistPath,
        assets: assets.map((asset) => pickAssetInfo(asset)),
        totalSize,
        totalGzipSize,
      });
    }
    return null;
  };

  if (showDetail) {
    const maxFileLength = Math.max(
      ...assets.map((a) => (a.folder + path.sep + a.name).length),
      showTotal ? totalSizeLabel.length : 0,
      fileHeader.length,
    );

    const maxSizeLength = Math.max(
      ...assets.map((a) => a.sizeLabelLength),
      totalSizeStr.length,
    );

    const showGzipHeader = Boolean(
      options.compressed && assets.some((item) => item.gzippedSize !== null),
    );

    logs.push(
      getHeader(maxFileLength, maxSizeLength, fileHeader, showGzipHeader),
    );

    for (const asset of assets) {
      let { sizeLabel, sizeLabelLength, gzipSizeLabel, gzipDiff, isNew } =
        asset;
      const { name, folder } = asset;

      // Append inline diff to gzipSizeLabel (only for existing files with changes)
      if (gzipSizeLabel && !isNew && gzipDiff !== null && gzipDiff !== 0) {
        gzipSizeLabel += ` ${formatDiff(gzipDiff).label}`;
      }

      const fileNameLength = (folder + path.sep + name).length;

      let fileNameLabel =
        color.dim(asset.folder + path.sep) + coloringAssetName(asset.name);

      if (sizeLabelLength < maxSizeLength) {
        const rightPadding = ' '.repeat(maxSizeLength - sizeLabelLength);
        sizeLabel += rightPadding;
      }

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

      const customTotal = getCustomTotal();
      if (customTotal) {
        // Custom total display
        logs.push(customTotal);
      } else {
        // Default total display
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
    }
  } else if (showTotal) {
    const customTotal = getCustomTotal();
    if (customTotal) {
      // Custom total display
      logs.push(customTotal);
    } else {
      // Default total display
      let log = `${color.magenta(totalSizeLabel)} ${totalSizeStr}`;

      if (options.compressed) {
        log += color.green(` (${calcFileSize(totalGzipSize)} gzipped)`);
      }

      logs.push(log);
    }
  }

  logs.push('');

  return { logs, currentSizes };
}

export const pluginFileSize = (context: InternalContext): RsbuildPlugin => ({
  name: 'rsbuild:file-size',

  setup(api) {
    api.onAfterBuild(async ({ stats, environments, isFirstCompile }) => {
      const { hasErrors } = context.buildState;
      // No need to print file sizes if there is any compilation error
      if (!stats || hasErrors || !isFirstCompile) {
        return;
      }

      // Check if any environment has diff enabled
      const showDiff = context.environmentList.some((environment) => {
        const { printFileSize } = environment.config.performance;
        if (typeof printFileSize === 'boolean') {
          // uses default (false)
          return false;
        }
        return printFileSize.diff;
      });

      // Load previous build sizes for comparison (only if showDiff is enabled)
      const previousSizes = showDiff
        ? await loadPreviousSizes(api.context.cachePath)
        : {};
      const newCache: FileSizeCache = {};

      const logs: string[] = [];

      await Promise.all(
        Object.values(environments).map(async (environment, index) => {
          const { printFileSize } = environment.config.performance;

          if (printFileSize === false) {
            return;
          }

          const defaultConfig: PrintFileSizeOptions = {
            total: true,
            detail: true,
            // print compressed size for the browser targets by default
            compressed: environment.config.output.target !== 'node',
            // disable diff by default to avoid breaking existing output expectations
            diff: false,
          };

          const mergedConfig =
            printFileSize === true
              ? defaultConfig
              : {
                  ...defaultConfig,
                  ...printFileSize,
                };

          const statsItem = 'stats' in stats ? stats.stats[index] : stats;
          const { logs: statsLogs, currentSizes } = await printFileSizes(
            mergedConfig,
            statsItem,
            api.context.rootPath,
            environment.distPath,
            environment.name,
            previousSizes,
          );

          logs.push(...statsLogs);

          // Store current sizes for this environment
          newCache[environment.name] = currentSizes;
        }),
      ).catch((err: unknown) => {
        logger.warn('Failed to print file size.');
        logger.warn(err);
      });

      logger.log(logs.join('\n'));

      // Save current sizes for next build comparison (only if showDiff is enabled)
      if (showDiff) {
        await saveSizes(api.context.cachePath, newCache);
      }
    });
  },
});
