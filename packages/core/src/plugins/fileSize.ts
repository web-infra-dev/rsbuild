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
  NormalizedEnvironmentConfig,
  PrintFileSizeAsset,
  PrintFileSizeOptions,
  RsbuildPlugin,
  Rspack,
} from '../types';

type SizeMap = {
  [fileName: string]: {
    size: number;
    gzippedSize?: number;
  };
};

type SizeSnapshot = {
  files: SizeMap;
  totalSize: number;
  totalGzipSize: number;
};

type SizeSnapshots = {
  [environmentName: string]: SizeSnapshot;
};

type FormattedAsset = {
  name: string;
  filenameLabel: string;
  filenameLength: number;
  size: number;
  sizeLabel: string;
  sizeLabelLength: number;
  gzippedSize: number | null;
  gzipSizeLabel: string | null;
};

const gzip = promisify(zlib.gzip);

async function gzipSize(input: Buffer) {
  const data = await gzip(input);
  return Buffer.byteLength(data);
}

/** Get the cache file path for storing previous build sizes */
function getSnapshotPath(dir: string): string {
  return path.join(dir, 'rsbuild/file-sizes.json');
}

/** Normalize file name by removing hash for comparison across builds */
export function normalizeFilename(fileName: string): string {
  // Remove hash patterns like .a1b2c3d4. but keep the extension
  return fileName.replace(/\.[a-f0-9]{8,}\./g, '.');
}

/** Load previous build file sizes from snapshots */
async function loadPrevSnapshots(dir: string): Promise<SizeSnapshots | null> {
  const snapshotPath = getSnapshotPath(dir);
  try {
    const content = await fs.promises.readFile(snapshotPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    // Cache doesn't exist or is invalid
    return null;
  }
}

/** Save current build file sizes to snapshots */
async function saveSnapshots(
  dir: string,
  snapshots: SizeSnapshots,
): Promise<void> {
  const snapshotPath = getSnapshotPath(dir);
  try {
    await fs.promises.mkdir(path.dirname(snapshotPath), { recursive: true });
    await fs.promises.writeFile(
      snapshotPath,
      JSON.stringify(snapshots, null, 2),
    );
  } catch (err) {
    // Fail silently - snapshots is not critical
    logger.debug('Failed to save file size snapshots:', err);
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

/** Calculate the file size in kB. */
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

/** Check if the asset is compressible. */
const isCompressible = (assetName: string) =>
  COMPRESSIBLE_REGEX.test(assetName);

const pickAssetInfo = (asset: PrintFileSizeAsset): PrintFileSizeAsset => ({
  name: asset.name,
  size: asset.size,
});

const calcTotalSize = (assets: FormattedAsset[], compressed?: boolean) => {
  let totalSize = 0;
  let totalGzipSize = 0;

  for (const { size, gzippedSize } of assets) {
    totalSize += size;
    if (compressed) {
      totalGzipSize += gzippedSize ?? size;
    }
  }

  return {
    totalSize,
    totalGzipSize,
  };
};

async function printFileSizes(
  options: PrintFileSizeOptions,
  stats: Rspack.Stats,
  rootPath: string,
  distPath: string,
  environmentName: string,
  previousSizes: SizeSnapshots | null,
) {
  const logs: string[] = [];
  const showDetail = options.detail !== false;
  const showDiff = options.diff !== false && previousSizes !== null;
  let showTotal = options.total !== false;

  if (!showTotal && !showDetail) {
    return { logs };
  }

  const relativeDistPath = path.relative(rootPath, distPath);
  const snapshot: SizeSnapshot = {
    files: {},
    totalSize: 0,
    totalGzipSize: 0,
  };

  const formatAsset = async (asset: RsbuildAsset): Promise<FormattedAsset> => {
    const fileName = asset.name.split('?')[0];
    const contents = await fs.promises.readFile(path.join(distPath, fileName));
    const size = Buffer.byteLength(contents);
    const compressible = options.compressed && isCompressible(fileName);
    const gzippedSize = compressible ? await gzipSize(contents) : null;

    // Normalize filename for comparison (remove hash)
    const normalizedName = normalizeFilename(fileName);

    // Store current size for next build
    snapshot.files[normalizeFilename(fileName)] = {
      size,
      gzippedSize: gzippedSize ?? undefined,
    };

    // Append inline diff to sizeLabel
    let sizeLabel = calcFileSize(size);
    let sizeLabelLength = sizeLabel.length;
    let gzipSizeLabel = gzippedSize
      ? getAssetColor(gzippedSize)(calcFileSize(gzippedSize))
      : null;

    // Calculate size differences for inline display
    if (showDiff) {
      const sizeData = previousSizes[environmentName]?.files[normalizedName];
      const sizeDiff = size - (sizeData?.size ?? 0);
      if (sizeDiff !== 0) {
        const { label, length } = formatDiff(sizeDiff);
        sizeLabel += ` ${label}`;
        sizeLabelLength += length + 1;
      }

      if (gzippedSize !== null) {
        const gzipDiff = gzippedSize - (sizeData?.gzippedSize ?? 0);
        if (gzipDiff !== 0) {
          gzipSizeLabel += ` ${formatDiff(gzipDiff).label}`;
        }
      }
    }

    const folder = path.join(relativeDistPath, path.dirname(fileName));
    const name = path.basename(fileName);
    const filenameLabel =
      color.dim(folder + path.sep) + coloringAssetName(name);
    const filenameLength = (folder + path.sep + name).length;

    return {
      name,
      filenameLabel,
      filenameLength,
      size,
      sizeLabel,
      sizeLabelLength,
      gzippedSize,
      gzipSizeLabel,
    };
  };

  const getAssets = async () => {
    const assets = getAssetsFromStats(stats);
    const exclude = options.exclude ?? excludeAsset;

    const filteredAssets = assets.filter((asset) => {
      if (exclude(asset)) {
        return false;
      }
      if (options.include) {
        return options.include(asset);
      }
      return true;
    });

    const formattedAssets = await Promise.all(
      filteredAssets.map((asset) => formatAsset(asset)),
    );

    return formattedAssets.sort((a, b) => a.size - b.size);
  };

  const assets = await getAssets();

  if (assets.length === 0) {
    return { logs };
  }

  logs.push('');

  // No need to print total size if there is only one asset and detail is true
  if (showDetail && assets.length === 1) {
    showTotal = false;
  }

  const { totalSize, totalGzipSize } = calcTotalSize(
    assets,
    options.compressed,
  );

  snapshot.totalSize = totalSize;
  snapshot.totalGzipSize = totalGzipSize;

  const fileHeader = showDetail ? `File (${environmentName})` : '';

  const getTotalSizeLabel = () => {
    if (!showTotal) {
      return {
        totalSizeTitle: '',
        totalSizeLabel: '',
        totalSizeLabelLength: 0,
      };
    }

    const totalSizeTitle = showDetail
      ? 'Total:'
      : `Total size (${environmentName}):`;

    let totalSizeLabel = calcFileSize(totalSize);
    let totalSizeLabelLength = totalSizeLabel.length;
    if (showDiff) {
      const totalSizeDiff =
        totalSize - (previousSizes[environmentName]?.totalSize ?? 0);
      if (totalSizeDiff !== 0) {
        const { label, length } = formatDiff(totalSizeDiff);
        totalSizeLabel += ` ${label}`;
        totalSizeLabelLength += length + 1;
      }
    }

    return { totalSizeTitle, totalSizeLabel, totalSizeLabelLength };
  };

  const { totalSizeTitle, totalSizeLabel, totalSizeLabelLength } =
    getTotalSizeLabel();

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
      ...assets.map((asset) => asset.filenameLength),
      showTotal ? totalSizeTitle.length : 0,
      fileHeader.length,
    );

    const maxSizeLength = Math.max(
      ...assets.map((a) => a.sizeLabelLength),
      totalSizeLabelLength,
    );

    const showGzipHeader = Boolean(
      options.compressed && assets.some((item) => item.gzippedSize !== null),
    );

    logs.push(
      getHeader(maxFileLength, maxSizeLength, fileHeader, showGzipHeader),
    );

    for (const asset of assets) {
      let { sizeLabel, sizeLabelLength, gzipSizeLabel } = asset;
      const { filenameLength } = asset;
      let { filenameLabel } = asset;

      if (sizeLabelLength < maxSizeLength) {
        const rightPadding = ' '.repeat(maxSizeLength - sizeLabelLength);
        sizeLabel += rightPadding;
      }

      if (filenameLength < maxFileLength) {
        const rightPadding = ' '.repeat(maxFileLength - filenameLength);
        filenameLabel += rightPadding;
      }

      let log = `${filenameLabel}   ${sizeLabel}`;

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
        log += ' '.repeat(maxFileLength - totalSizeTitle.length);
        log += color.magenta(totalSizeTitle);
        log += `   ${totalSizeLabel}`;

        if (options.compressed) {
          const colorFn = getAssetColor(totalGzipSize / assets.length);
          log += ' '.repeat(maxSizeLength - totalSizeLabelLength);
          log += `   ${colorFn(calcFileSize(totalGzipSize))}`;

          if (showDiff) {
            const totalGzipSizeDiff =
              totalGzipSize -
              (previousSizes[environmentName]?.totalGzipSize ?? 0);
            if (totalGzipSizeDiff !== 0) {
              log += ` ${formatDiff(totalGzipSizeDiff).label}`;
            }
          }
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
      let log = `${color.magenta(totalSizeTitle)} ${totalSizeLabel}`;

      if (options.compressed) {
        log += color.green(` (${calcFileSize(totalGzipSize)} gzipped)`);
      }

      logs.push(log);
    }
  }

  logs.push('');

  return { logs, snapshot };
}

const normalizeConfig = (config: NormalizedEnvironmentConfig) => {
  const { printFileSize } = config.performance;
  const defaultConfig: PrintFileSizeOptions = {
    total: true,
    detail: true,
    diff: false,
    // print compressed size for the browser targets by default
    compressed: config.output.target !== 'node',
  };

  return printFileSize === true
    ? defaultConfig
    : {
        ...defaultConfig,
        ...printFileSize,
      };
};

export const pluginFileSize = (context: InternalContext): RsbuildPlugin => ({
  name: 'rsbuild:file-size',

  setup(api) {
    api.onAfterBuild(async ({ stats, isFirstCompile }) => {
      const { hasErrors } = context.buildState;
      // No need to print file sizes if there is any compilation error
      if (!stats || hasErrors || !isFirstCompile) {
        return;
      }

      const environments = context.environmentList.filter(
        ({ config }) => config.performance.printFileSize !== false,
      );

      // If no environment has printFileSize enabled, skip
      if (!environments.length) {
        return;
      }

      // Check if any environment has diff enabled
      const showDiff = environments.some((environment) => {
        const { printFileSize } = environment.config.performance;
        return typeof printFileSize === 'object' && Boolean(printFileSize.diff);
      });

      // Load previous build sizes for comparison (only if diff is enabled)
      const prevSnapshots = showDiff
        ? await loadPrevSnapshots(api.context.cachePath)
        : null;
      const nextSnapshots: SizeSnapshots = {};

      const logs = await Promise.all(
        environments.map(async ({ name, index, config, distPath }) => {
          const statsItem = 'stats' in stats ? stats.stats[index] : stats;
          const { logs: sizeLogs, snapshot } = await printFileSizes(
            normalizeConfig(config),
            statsItem,
            api.context.rootPath,
            distPath,
            name,
            prevSnapshots,
          );

          // Store current sizes for this environment
          if (snapshot) {
            nextSnapshots[name] = snapshot;
          }

          return sizeLogs.join('\n');
        }),
      ).catch((err: unknown) => {
        logger.warn('Failed to print file size.');
        logger.warn(err);
      });

      if (logs) {
        logger.log(logs.join('\n'));
      }

      // Save current sizes for next build comparison (only if diff is enabled)
      if (showDiff) {
        await saveSnapshots(api.context.cachePath, nextSnapshots);
      }
    });
  },
});
