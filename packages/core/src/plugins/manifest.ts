import type {
  FileDescriptor,
  InternalOptions,
} from '../../compiled/rspack-manifest-plugin';
import {
  color,
  ensureAssetPrefix,
  getPublicPathFromCompiler,
  isObject,
} from '../helpers';
import { logger } from '../logger';
import { recursiveChunkEntryNames } from '../rspack-plugins/resource-hints/doesChunkBelongToHtml';
import type {
  EnvironmentContext,
  ManifestByEntry,
  ManifestConfig,
  ManifestData,
  ManifestObjectConfig,
  RsbuildPlugin,
} from '../types';

const isCSSPath = (filePath: string) => filePath.endsWith('.css');

const generateManifest =
  (
    htmlPaths: Record<string, string>,
    manifestOptions: ManifestObjectConfig,
    environment: EnvironmentContext,
  ): InternalOptions['generate'] =>
  (
    _seed: Record<string, any>,
    files: FileDescriptor[],
    entries: Record<string, string[]>,
    { compilation },
  ) => {
    const chunkEntries = new Map<string, FileDescriptor[]>();
    const licenseMap = new Map<string, string>();
    const publicPath = getPublicPathFromCompiler(compilation);

    const allFiles = files.map((file) => {
      if (file.chunk) {
        const entryNames = recursiveChunkEntryNames(file.chunk);

        for (const entryName of entryNames) {
          chunkEntries.set(entryName, [
            file,
            ...(chunkEntries.get(entryName) || []),
          ]);
        }
      }

      if (file.path.endsWith('.LICENSE.txt')) {
        const sourceFilePath = file.path.split('.LICENSE.txt')[0];
        licenseMap.set(sourceFilePath, file.path);
      }
      return file.path;
    });

    const manifestEntries: ManifestData['entries'] = {};

    for (const [entryName, chunkFiles] of chunkEntries) {
      const assets = new Set<string>();
      const initialJS: string[] = [];
      const initialCSS: string[] = [];
      const asyncJS: string[] = [];
      const asyncCSS: string[] = [];

      // Get the initial chunks from `entries`, since they come from
      // `compilation.entrypoints.get(entryName).getFiles()`, which ensures
      // the correct chunk order (especially important for CSS chunks where
      // order must be preserved).
      if (entries[entryName]) {
        for (const filePath of entries[entryName]) {
          const fileURL = ensureAssetPrefix(filePath, publicPath);
          if (isCSSPath(filePath)) {
            initialCSS.push(fileURL);
          } else {
            initialJS.push(fileURL);
          }
        }
      }

      for (const file of chunkFiles) {
        if (!file.isInitial) {
          if (isCSSPath(file.path)) {
            asyncCSS.push(file.path);
          } else {
            asyncJS.push(file.path);
          }
        }

        const relatedLICENSE = licenseMap.get(file.path);

        if (relatedLICENSE) {
          assets.add(relatedLICENSE);
        }

        if (file.chunk) {
          for (const auxiliaryFile of file.chunk.auxiliaryFiles) {
            assets.add(auxiliaryFile);
          }
        }
      }

      const entryManifest: ManifestByEntry = {};

      if (assets.size) {
        entryManifest.assets = Array.from(assets);
      }

      const htmlPath = files.find((f) => f.name === htmlPaths[entryName])?.path;

      if (htmlPath) {
        entryManifest.html = [htmlPath];
      }

      if (initialJS.length) {
        entryManifest.initial = {
          js: initialJS,
        };
      }

      if (initialCSS.length) {
        entryManifest.initial = {
          ...(entryManifest.initial || {}),
          css: initialCSS,
        };
      }

      if (asyncJS.length) {
        entryManifest.async = {
          js: asyncJS,
        };
      }

      if (asyncCSS.length) {
        entryManifest.async = {
          ...(entryManifest.async || {}),
          css: asyncCSS,
        };
      }

      manifestEntries[entryName] = entryManifest;
    }

    const manifestData: ManifestData = {
      allFiles,
      entries: manifestEntries,
    };

    if (manifestOptions.generate) {
      const generatedManifest = manifestOptions.generate({
        files,
        manifestData,
      });

      if (isObject(generatedManifest)) {
        environment.manifest = generatedManifest;
        return generatedManifest;
      }

      throw new Error(
        `${color.dim('[rsbuild:manifest]')} \`manifest.generate\` function must return a valid manifest object.`,
      );
    }

    environment.manifest = manifestData;
    return manifestData;
  };

function normalizeManifestObjectConfig(
  manifest?: ManifestConfig,
): ManifestObjectConfig & { filename: string } {
  if (typeof manifest === 'string') {
    return {
      filename: manifest,
    };
  }

  const defaultOptions = {
    filename: 'manifest.json',
  } satisfies ManifestObjectConfig;

  if (typeof manifest === 'boolean') {
    return defaultOptions;
  }

  return {
    ...defaultOptions,
    ...manifest,
  };
}

export const pluginManifest = (): RsbuildPlugin => ({
  name: 'rsbuild:manifest',

  setup(api) {
    const manifestFilenames = new Map<string, string>();

    api.modifyBundlerChain(async (chain, { CHAIN_ID, environment, isDev }) => {
      const {
        output: { manifest },
        dev: { writeToDisk },
      } = environment.config;

      if (manifest === false) {
        return;
      }

      const manifestOptions = normalizeManifestObjectConfig(manifest);

      const { RspackManifestPlugin } = await import(
        '../../compiled/rspack-manifest-plugin/index.js'
      );
      const { htmlPaths } = environment;

      // Exclude `*.LICENSE.txt` files by default
      const filter =
        manifestOptions.filter ??
        ((file: FileDescriptor) => !file.name.endsWith('.LICENSE.txt'));

      manifestFilenames.set(environment.name, manifestOptions.filename);

      chain.plugin(CHAIN_ID.PLUGIN.MANIFEST).use(RspackManifestPlugin, [
        {
          fileName: manifestOptions.filename,
          filter,
          writeToFileEmit: isDev && writeToDisk !== true,
          generate: generateManifest(htmlPaths, manifestOptions, environment),
        },
      ]);
    });

    // validate duplicated manifest filenames and throw a warning
    api.onAfterCreateCompiler(() => {
      if (manifestFilenames.size <= 1) {
        manifestFilenames.clear();
        return;
      }

      const environmentNames = Array.from(manifestFilenames.keys());
      const filenames = Array.from(manifestFilenames.values());
      const uniqueFilenames = new Set(filenames);

      if (uniqueFilenames.size !== filenames.length) {
        logger.warn(
          `${color.dim('[rsbuild:manifest]')} The ${color.yellow(
            '"manifest.filename"',
          )} option must be unique when there are multiple environments (${environmentNames.join(
            ', ',
          )}), otherwise the manifest file will be overwritten.`,
        );
      }

      manifestFilenames.clear();
    });
  },
});
