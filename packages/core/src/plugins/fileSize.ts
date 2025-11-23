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
function getCacheFilePath(rootPath: string): string {
  return path.join(
    rootPath,
    'node_modules',
    '.cache',
    'rsbuild',
    'file-sizes-cache.json',
  );
}

/** Normalize file name by removing hash for comparison across builds */
export function normalizeFileName(fileName: string): string {
  // Remove hash patterns like .a1b2c3d4. but keep the extension
  return fileName.replace(/\.[a-f0-9]{8,}\./g, '.');
}

/** Load previous build file sizes from cache */
async function loadPreviousSizes(rootPath: string): Promise<FileSizeCache> {
  const cacheFile = getCacheFilePath(rootPath);
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
  rootPath: string,
  cache: FileSizeCache,
): Promise<void> {
  const cacheFile = getCacheFilePath(rootPath);
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
  maxDiffLength: number,
  fileHeader: string,
  showDiffHeader: boolean,
  showGzipHeader: boolean,
) {
  const lengths = [maxFileLength, maxSizeLength];
  const rowTypes = [fileHeader, 'Size'];

  if (showDiffHeader) {
    rowTypes.push('Diff');
    lengths.push(maxDiffLength);
  }

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
  const showDiff = options.showDiff !== false;

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

    // Calculate size difference
    let diffSize: number | null = null;
    let diffText: string | null = null;
    if (showDiff && previousSize !== undefined) {
      diffSize = size - previousSize;
      if (diffSize !== 0) {
        const diffStr = calcFileSize(Math.abs(diffSize));
        const sign = diffSize > 0 ? '+' : '-';
        diffText = `${sign}${diffStr}`;
      } else {
        diffText = '0 kB';
      }
    }

    // Store current size for next build
    currentSizes[normalizedName] = {
      size,
      gzippedSize: gzippedSize ?? undefined,
    };

    return {
      size,
      folder: path.join(relativeDistPath, path.dirname(fileName)),
      name: path.basename(fileName),
      gzippedSize,
      sizeLabel: calcFileSize(size),
      gzipSizeLabel,
      diffSize,
      diffText,
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
      ...assets.map((a) => a.sizeLabel.length),
      totalSizeStr.length,
    );

    // Calculate max diff length
    const maxDiffLength = showDiff
      ? Math.max(
          ...assets.map((a) => (a.diffText ? a.diffText.length : 0)),
          4, // minimum length for 'Diff' header
        )
      : 0;

    const showDiffHeader =
      showDiff && assets.some((item) => item.diffText !== null);
    const showGzipHeader = Boolean(
      options.compressed && assets.some((item) => item.gzippedSize !== null),
    );

    logs.push(
      getHeader(
        maxFileLength,
        maxSizeLength,
        maxDiffLength,
        fileHeader,
        showDiffHeader,
        showGzipHeader,
      ),
    );

    for (const asset of assets) {
      let { sizeLabel, diffText, diffSize } = asset;
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

      // Add diff column if enabled and there's a diff to show
      if (showDiffHeader) {
        if (diffText) {
          // Apply color based on whether size increased or decreased
          const colorFn =
            diffSize! > 0 ? color.red : diffSize! < 0 ? color.green : color.dim;
          let diffLabel = colorFn(diffText);

          // Add padding if needed
          if (diffText.length < maxDiffLength) {
            const rightPadding = ' '.repeat(maxDiffLength - diffText.length);
            diffLabel += rightPadding;
          }
          log += `   ${diffLabel}`;
        } else {
          // No previous data for this file (new file)
          const newLabel = color.cyan('NEW');
          const newLength = 3; // length of 'NEW'
          const rightPadding = ' '.repeat(
            Math.max(0, maxDiffLength - newLength),
          );
          log += `   ${newLabel}${rightPadding}`;
        }
      }

      if (showDiffHeader) {
        log = log.trimEnd();
      }

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

      // Check if any environment has showDiff enabled
      const hasShowDiff = Object.values(environments).some((environment) => {
        const { printFileSize } = environment.config.performance;
        if (printFileSize === false) return false;
        if (printFileSize === true) return false; // uses default (false)
        return printFileSize.showDiff === true;
      });

      // Load previous build sizes for comparison (only if showDiff is enabled)
      const previousSizes = hasShowDiff
        ? await loadPreviousSizes(api.context.rootPath)
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
            showDiff: false,
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
      if (hasShowDiff) {
        await saveSizes(api.context.rootPath, newCache);
      }
    });
  },
});
