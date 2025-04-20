import type { FileDescriptor } from '../../compiled/rspack-manifest-plugin';
import { isObject } from '../helpers';
import { recursiveChunkEntryNames } from '../rspack/resource-hints/doesChunkBelongToHtml';
import type {
  ManifestByEntry,
  ManifestConfig,
  ManifestData,
  ManifestObjectConfig,
  RsbuildPlugin,
} from '../types';

const generateManifest =
  (htmlPaths: Record<string, string>, manifestOptions: ManifestObjectConfig) =>
  (_seed: Record<string, any>, files: FileDescriptor[]) => {
    const chunkEntries = new Map<string, FileDescriptor[]>();

    const licenseMap = new Map<string, string>();

    const allFiles = files.map((file) => {
      if (file.chunk) {
        const names = recursiveChunkEntryNames(file.chunk);

        for (const name of names) {
          chunkEntries.set(name, [file, ...(chunkEntries.get(name) || [])]);
        }
      }

      if (file.path.endsWith('.LICENSE.txt')) {
        const sourceFilePath = file.path.split('.LICENSE.txt')[0];
        licenseMap.set(sourceFilePath, file.path);
      }
      return file.path;
    });

    const entries: ManifestData['entries'] = {};

    for (const [name, chunkFiles] of chunkEntries) {
      const assets = new Set<string>();
      const initialJS: string[] = [];
      const asyncJS: string[] = [];
      const initialCSS: string[] = [];
      const asyncCSS: string[] = [];

      for (const file of chunkFiles) {
        if (file.isInitial) {
          if (file.path.endsWith('.css')) {
            initialCSS.push(file.path);
          } else {
            initialJS.push(file.path);
          }
        } else {
          if (file.path.endsWith('.css')) {
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

      const htmlPath = files.find((f) => f.name === htmlPaths[name])?.path;

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

      entries[name] = entryManifest;
    }

    const manifestData: ManifestData = {
      allFiles,
      entries,
    };

    if (manifestOptions.generate) {
      const generatedManifest = manifestOptions.generate({
        files,
        manifestData,
      });

      if (isObject(generatedManifest)) {
        return generatedManifest;
      }

      throw new Error(
        '[rsbuild:manifest] `manifest.generate` function must return a valid manifest object.',
      );
    }

    return manifestData;
  };

function normalizeManifestObjectConfig(
  manifest?: ManifestConfig,
): ManifestObjectConfig {
  if (typeof manifest === 'string') {
    return {
      filename: manifest,
    };
  }

  const defaultOptions: ManifestObjectConfig = {
    filename: 'manifest.json',
  };

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

      chain.plugin(CHAIN_ID.PLUGIN.MANIFEST).use(RspackManifestPlugin, [
        {
          fileName: manifestOptions.filename,
          filter,
          writeToFileEmit: isDev && writeToDisk !== true,
          generate: generateManifest(htmlPaths, manifestOptions),
        },
      ]);
    });
  },
});
