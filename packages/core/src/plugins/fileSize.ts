/**
 * modified from https://github.com/facebook/create-react-app
 * license at https://github.com/facebook/create-react-app/blob/master/LICENSE
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { JS_REGEX } from '../constants';
import { color, hash } from '../helpers';
import { applyToCompiler } from '../helpers/compiler';
import type { Logger } from '../logger';
import type {
  InternalContext,
  NormalizedEnvironmentConfig,
  PrintFileSizeAsset,
  PrintFileSizeOptions,
  RsbuildPlugin,
  Rspack,
} from '../types';

type CompressionType = 'gzip' | 'brotli';

const MAX_CONCURRENT_ASSETS = 16;

type AssetProcessor = (
  names: string[],
  processAsset: (name: string, index: number) => Promise<void>,
) => Promise<void>;

/**
 * Processes up to 16 assets at a time across all environments in one build.
 * Reads each asset only when a slot is available and starts the next asset
 * as soon as one finishes. Passes the original index to preserve result order.
 *
 * On failure, stops starting new tasks. Each call waits for its running tasks
 * to finish before throwing the first error. Create a new processor for each
 * build to reset this error state.
 */
export function createAssetProcessor(): AssetProcessor {
  let active = 0;
  const waiting: (() => void)[] = [];
  let failure: { error: unknown } | undefined;

  return async (names, processAsset) => {
    let cursor = 0;

    const consume = async () => {
      while (cursor < names.length && !failure) {
        const index = cursor++;
        if (active >= MAX_CONCURRENT_ASSETS) {
          await new Promise<void>((resolve) => waiting.push(resolve));
        } else {
          active++;
        }

        try {
          // Another environment may have failed while this consumer waited.
          if (failure) {
            return;
          }
          await processAsset(names[index], index);
        } catch (error) {
          failure ??= { error };
        } finally {
          const next = waiting.shift();
          if (next) {
            // Transfer this slot to a waiting consumer.
            next();
          } else {
            active--;
          }
        }
      }
    };

    await Promise.all(
      Array.from(
        { length: Math.min(MAX_CONCURRENT_ASSETS, names.length) },
        consume,
      ),
    );
    if (failure) {
      throw failure.error;
    }
  };
}

type SizeMap = Record<
  string,
  {
    size: number;
    gzippedSize?: number;
    brotliSize?: number;
  }
>;

type SizeSnapshot = {
  files: SizeMap;
  totalSize: number;
  totalGzipSize: number;
  totalBrotliSize?: number;
  compressionType?: CompressionType | false;
};

type SizeSnapshots = Record<string, SizeSnapshot>;

type FormattedAsset = {
  filePath: string;
  filenameLabel: string;
  filenameLength: number;
  size: number;
  sizeLabel: string;
  sizeLabelLength: number;
  compressedSize: number | null;
  compressedSizeLabel: string | null;
};

function getCompression(compressed: PrintFileSizeOptions['compressed']) {
  const { type = 'gzip', level = 6 } =
    typeof compressed === 'object' ? compressed : {};

  return type === 'brotli'
    ? ({
        type,
        level,
        header: 'Br',
        label: 'brotli',
        sizeKey: 'brotliSize',
        totalKey: 'totalBrotliSize',
      } as const)
    : ({
        type,
        level,
        header: 'Gzip',
        label: 'gzipped',
        sizeKey: 'gzippedSize',
        totalKey: 'totalGzipSize',
      } as const);
}

function calcCompressedSize(
  input: Buffer | string,
  type: CompressionType,
  level: number,
) {
  return new Promise<number>((resolve, reject) => {
    const stream =
      type === 'brotli'
        ? zlib.createBrotliCompress({
            params: { [zlib.constants.BROTLI_PARAM_QUALITY]: level },
          })
        : zlib.createGzip({ level });
    let size = 0;
    // Only the size is needed; avoid retaining and concatenating compressed data.
    stream.on('data', (chunk: Buffer) => {
      size += chunk.length;
    });
    stream.on('error', reject);
    stream.on('end', () => resolve(size));
    stream.end(input);
  });
}

/** Get the cache file path for storing previous build sizes */
function getSnapshotPath(dir: string, snapshotHash: string): string {
  if (snapshotHash) {
    return path.join(dir, `rsbuild/file-sizes-${snapshotHash}.json`);
  }
  return path.join(dir, 'rsbuild/file-sizes.json');
}

/** Normalize file path by removing hash for comparison across builds */
export function normalizeFilePath(filePath: string): string {
  // Remove hash patterns like .a1b2c3d4. but keep the extension
  return filePath.replace(/\.[a-f0-9]{8,}\./g, '.');
}

/** Load previous build file sizes from snapshots */
async function loadPrevSnapshots(snapshotPath: string) {
  try {
    const content = await fs.promises.readFile(snapshotPath, 'utf-8');
    return JSON.parse(content) as SizeSnapshots;
  } catch {
    // Cache doesn't exist or is invalid
    return null;
  }
}

/** Save current build file sizes to snapshots */
async function saveSnapshots(
  snapshotPath: string,
  snapshots: SizeSnapshots,
  logger: Logger,
): Promise<void> {
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

const EXCLUDE_ASSET_REGEX = /\.(?:map|LICENSE\.txt|d\.(?:ts|mts|cts))$/;

/** Exclude source map, license, and type declaration files by default */
export const excludeAsset = (asset: PrintFileSizeAsset): boolean =>
  EXCLUDE_ASSET_REGEX.test(asset.name);

/** Check if the size difference is significant */
const isSignificantDiff = (diff: number) => Math.abs(diff) >= 10;

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
  return (input: string) => input;
};

function getHeader(
  maxFileLength: number,
  maxSizeLength: number,
  fileHeader: string,
  compressionHeader: string | false,
) {
  const lengths = [maxFileLength, maxSizeLength];
  const rowTypes = [fileHeader, 'Size'];

  if (compressionHeader) {
    rowTypes.push(compressionHeader);
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
  /\.(?:js|mjs|cjs|jsx|ts|tsx|mts|cts|css|html|json|svg|txt|xml|xhtml|wasm|manifest|md)$/i;

/** Check if the asset is compressible. */
const isCompressible = (assetName: string) =>
  COMPRESSIBLE_REGEX.test(assetName);

const getFilePath = (assetName: string) => {
  const queryIndex = assetName.indexOf('?');
  return queryIndex === -1 ? assetName : assetName.slice(0, queryIndex);
};

const calcTotalSize = (assets: FormattedAsset[], compressed?: boolean) => {
  let totalSize = 0;
  let totalCompressedSize = 0;

  for (const { size, compressedSize } of assets) {
    totalSize += size;
    if (compressed) {
      totalCompressedSize += compressedSize ?? size;
    }
  }

  return {
    totalSize,
    totalCompressedSize,
  };
};

async function getFileSizes(
  options: PrintFileSizeOptions,
  compilation: Rspack.Compilation,
  processAssets: AssetProcessor,
) {
  if (options.detail === false && options.total === false) {
    return [];
  }

  const { exclude, include } = options;
  const compression = getCompression(options.compressed);
  const fileSizes: {
    filePath: string;
    size: number;
    compressedSize: number | null;
  }[] = [];
  const compilationAssets = compilation.assets;

  const names = Object.keys(compilationAssets);
  await processAssets(names, async (assetName, index) => {
    const filePath = getFilePath(assetName);

    if (!exclude && EXCLUDE_ASSET_REGEX.test(filePath)) {
      return;
    }

    // Accessing an asset retrieves its Source through the Rust-JS bridge,
    // so filter by filename before reading it.
    const value = compilationAssets[assetName];
    const content =
      options.compressed && isCompressible(filePath)
        ? value.buffer()
        : undefined;
    const size = content === undefined ? value.size() : content.length;

    if (exclude || include) {
      const publicAsset: PrintFileSizeAsset = {
        name: filePath,
        size,
      };
      if (exclude?.(publicAsset)) {
        return;
      }
      if (include && !include(publicAsset)) {
        return;
      }
    }

    const compressedSize =
      content === undefined
        ? null
        : await calcCompressedSize(
            content,
            compression.type,
            compression.level,
          );
    // Preserve input order regardless of compression completion order.
    fileSizes[index] = { filePath, size, compressedSize };
  });

  return fileSizes.filter(Boolean);
}

function printFileSizes(
  options: PrintFileSizeOptions,
  fileSizes: Awaited<ReturnType<typeof getFileSizes>>,
  rootPath: string,
  distPath: string,
  environmentName: string,
  previousSizes: SizeSnapshots | null,
  saveSnapshot: boolean,
) {
  const logs: string[] = [];
  const compression = getCompression(options.compressed);
  const prev = previousSizes?.[environmentName];
  const showDetail = options.detail !== false;
  const showDiff = options.diff !== false && previousSizes !== null;
  // Legacy snapshots have no compression type and a zero gzip total when disabled.
  const prevType =
    prev?.compressionType ?? (prev?.totalGzipSize ? 'gzip' : false);
  const showCompressedDiff = showDiff && prevType === compression.type;
  let showTotal = options.total !== false;

  if (!showTotal && !showDetail) {
    return { logs };
  }

  const relativeDistPath = path.relative(rootPath, distPath);
  const rootFolderLabel = `${relativeDistPath || '.'}${path.sep}`;
  const snapshot: SizeSnapshot | null = saveSnapshot
    ? {
        files: {},
        totalSize: 0,
        totalGzipSize: 0,
        compressionType: options.compressed ? compression.type : false,
      }
    : null;

  const formatAsset = (
    filePath: string,
    size: number,
    compressedSize: number | null,
  ): FormattedAsset => {
    let normalizedPath = '';

    // Store current size for next build
    if (snapshot || showDiff) {
      // Normalize filename for comparison (remove hash)
      normalizedPath = normalizeFilePath(filePath);

      if (snapshot) {
        snapshot.files[normalizedPath] = {
          size,
          [compression.sizeKey]: compressedSize ?? undefined,
        };
      }
    }

    // Append inline diff to sizeLabel
    let sizeLabel = calcFileSize(size);
    let sizeLabelLength = sizeLabel.length;
    let compressedSizeLabel = compressedSize
      ? getAssetColor(compressedSize)(calcFileSize(compressedSize))
      : null;

    // Calculate size differences for inline display
    if (showDiff) {
      const sizeData = prev?.files[normalizedPath];
      const sizeDiff = size - (sizeData?.size ?? 0);
      if (isSignificantDiff(sizeDiff)) {
        const { label, length } = formatDiff(sizeDiff);
        sizeLabel += ` ${label}`;
        sizeLabelLength += length + 1;
      }

      if (compressedSize !== null && showCompressedDiff) {
        const compressedDiff =
          compressedSize - (sizeData?.[compression.sizeKey] ?? 0);
        if (isSignificantDiff(compressedDiff)) {
          compressedSizeLabel += ` ${formatDiff(compressedDiff).label}`;
        }
      }
    }

    const separatorIndex = filePath.lastIndexOf('/');
    const folderLabel =
      separatorIndex === -1
        ? rootFolderLabel
        : `${path.join(relativeDistPath, filePath.slice(0, separatorIndex))}${path.sep}`;
    const filename =
      separatorIndex === -1 ? filePath : filePath.slice(separatorIndex + 1);
    const filenameLabel = color.dim(folderLabel) + coloringAssetName(filename);
    const filenameLength = folderLabel.length + filename.length;

    return {
      filePath,
      filenameLabel,
      filenameLength,
      size,
      sizeLabel,
      sizeLabelLength,
      compressedSize,
      compressedSizeLabel,
    };
  };

  const assets = fileSizes
    .map(({ filePath, size, compressedSize }) =>
      formatAsset(filePath, size, compressedSize),
    )
    .sort((a, b) => a.size - b.size);

  if (assets.length === 0) {
    return { logs };
  }

  logs.push('');

  // No need to print total size if there is only one asset and detail is true
  if (showDetail && assets.length === 1) {
    showTotal = false;
  }

  const { totalSize, totalCompressedSize } = calcTotalSize(
    assets,
    Boolean(options.compressed),
  );

  if (snapshot) {
    snapshot.totalSize = totalSize;
    if (options.compressed) {
      snapshot[compression.totalKey] = totalCompressedSize;
    }
  }

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
      const totalSizeDiff = totalSize - (prev?.totalSize ?? 0);
      if (isSignificantDiff(totalSizeDiff)) {
        const { label, length } = formatDiff(totalSizeDiff);
        totalSizeLabel += ` ${label}`;
        totalSizeLabelLength += length + 1;
      }
    }

    return { totalSizeTitle, totalSizeLabel, totalSizeLabelLength };
  };

  const { totalSizeTitle, totalSizeLabel, totalSizeLabelLength } =
    getTotalSizeLabel();

  const getCompressedTotalDiff = () => {
    if (!showCompressedDiff) {
      return '';
    }

    const diff = totalCompressedSize - (prev?.[compression.totalKey] ?? 0);
    return isSignificantDiff(diff) ? ` ${formatDiff(diff).label}` : '';
  };

  const getCustomTotal = () => {
    if (typeof options.total === 'function') {
      return options.total({
        environmentName,
        distPath: relativeDistPath,
        assets: assets.map((asset) => ({
          name: asset.filePath,
          size: asset.size,
        })),
        totalSize,
        totalGzipSize: compression.type === 'gzip' ? totalCompressedSize : 0,
        totalBrotliSize:
          options.compressed && compression.type === 'brotli'
            ? totalCompressedSize
            : undefined,
      });
    }
    return null;
  };

  if (showDetail) {
    let maxFileLength = Math.max(
      showTotal ? totalSizeTitle.length : 0,
      fileHeader.length,
    );
    let maxSizeLength = totalSizeLabelLength;
    let hasCompressedSize = false;

    for (const asset of assets) {
      if (asset.filenameLength > maxFileLength) {
        maxFileLength = asset.filenameLength;
      }
      if (asset.sizeLabelLength > maxSizeLength) {
        maxSizeLength = asset.sizeLabelLength;
      }
      if (asset.compressedSize !== null) {
        hasCompressedSize = true;
      }
    }

    const showCompressedHeader = Boolean(
      options.compressed && hasCompressedSize,
    );

    logs.push(
      getHeader(
        maxFileLength,
        maxSizeLength,
        fileHeader,
        showCompressedHeader && compression.header,
      ),
    );

    for (const asset of assets) {
      let { sizeLabel, filenameLabel } = asset;
      const { sizeLabelLength, compressedSizeLabel, filenameLength } = asset;

      if (sizeLabelLength < maxSizeLength) {
        const rightPadding = ' '.repeat(maxSizeLength - sizeLabelLength);
        sizeLabel += rightPadding;
      }

      if (filenameLength < maxFileLength) {
        const rightPadding = ' '.repeat(maxFileLength - filenameLength);
        filenameLabel += rightPadding;
      }

      let log = `${filenameLabel}   ${sizeLabel}`;

      if (compressedSizeLabel) {
        log += `   ${compressedSizeLabel}`;
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
          const colorFn = getAssetColor(totalCompressedSize / assets.length);
          log += ' '.repeat(maxSizeLength - totalSizeLabelLength);
          log += `   ${colorFn(calcFileSize(totalCompressedSize))}${getCompressedTotalDiff()}`;
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
        log += color.green(
          ` (${calcFileSize(totalCompressedSize)}${getCompressedTotalDiff()} ${compression.label})`,
        );
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
    let fileSizeResults: ReturnType<typeof getFileSizes>[] | undefined;
    let processAssets: AssetProcessor | undefined;

    api.onBeforeBuild(({ isFirstCompile }) => {
      fileSizeResults = isFirstCompile ? [] : undefined;
      processAssets = isFirstCompile ? createAssetProcessor() : undefined;
    });

    api.onAfterCreateCompiler(({ compiler }) => {
      if (context.action !== 'build') {
        return;
      }
      applyToCompiler(compiler, (compiler, index) => {
        const { config } = context.environmentList[index];
        if (config.performance.printFileSize === false) {
          return;
        }
        compiler.hooks.emit.tapPromise(
          { name: 'rsbuild:file-size', stage: Infinity },
          async (compilation) => {
            if (
              !fileSizeResults ||
              !processAssets ||
              compilation.errors.length
            ) {
              return;
            }
            fileSizeResults[index] = getFileSizes(
              normalizeConfig(config),
              compilation,
              processAssets,
            );
            // Report errors after the build, without preventing asset emission.
            await fileSizeResults[index].catch(() => {});
          },
        );
      });
    });

    api.onAfterBuild(async ({ stats, isFirstCompile }) => {
      const results = fileSizeResults;
      fileSizeResults = undefined;
      processAssets = undefined;
      const { hasErrors } = context.buildState;
      // No need to print file sizes if there is any compilation error
      if (!stats || hasErrors || !isFirstCompile || !results) {
        return;
      }

      const environments = context.environmentList.filter(
        ({ index }) => results[index] !== undefined,
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

      // If `configFile` is provided, use it to generate a unique snapshot path
      // to avoid collision when using multiple Rsbuild config files
      const { configFile } = api.context;
      const snapshotHash = showDiff && configFile ? await hash(configFile) : '';
      const snapshotPath = showDiff
        ? getSnapshotPath(api.context.cachePath, snapshotHash)
        : '';

      // Load previous build sizes for comparison (only if diff is enabled)
      const prevSnapshots = showDiff
        ? await loadPrevSnapshots(snapshotPath)
        : null;
      const nextSnapshots: SizeSnapshots = {};

      const logs = await Promise.all(
        environments.map(async ({ name, index, config, distPath }) => {
          const { logs: sizeLogs, snapshot } = printFileSizes(
            normalizeConfig(config),
            await results[index],
            api.context.rootPath,
            distPath,
            name,
            prevSnapshots,
            showDiff,
          );

          // Store current sizes for this environment
          if (snapshot) {
            nextSnapshots[name] = snapshot;
          }

          return sizeLogs.join('\n');
        }),
      ).catch((err: unknown) => {
        api.logger.warn('Failed to print file size.');
        api.logger.warn(err);
      });

      if (logs) {
        api.logger.log(logs.join(''));
      }

      // Save current sizes for next build comparison (only if diff is enabled)
      if (showDiff) {
        await saveSnapshots(snapshotPath, nextSnapshots, api.logger);
      }
    });
  },
});
