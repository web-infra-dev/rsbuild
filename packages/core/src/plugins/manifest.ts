import type { Chunk } from '@rspack/core';
import { recursiveChunkEntryNames } from '../rspack/preload/helpers';
import type { RsbuildPlugin } from '../types';

type FilePath = string;

type ManifestByEntry = {
  initial?: {
    js?: FilePath[];
    css?: FilePath[];
  };
  async?: {
    js?: FilePath[];
    css?: FilePath[];
  };
  /** other assets (e.g. png、svg、source map) related to the current entry */
  assets?: FilePath[];
  html?: FilePath[];
};

type ManifestList = {
  entries: {
    /** relate to rsbuild source.entry */
    [entryName: string]: ManifestByEntry;
  };
  /** Flatten all assets */
  allFiles: FilePath[];
  /** Assets grouped by chunk name */
  namedChunks: {
    [chunkName: string]: {
      js?: FilePath[];
      css?: FilePath[];
      assets?: FilePath[];
    };
  };
};

type FileDescriptor = {
  chunk?: Chunk;
  isInitial: boolean;
  name: string;
  path: string;
};

const generateManifest =
  (htmlPaths: Record<string, string>) =>
  (_seed: Record<string, any>, files: FileDescriptor[]) => {
    const chunkEntries = new Map<string, FileDescriptor[]>();
    const licenseMap = new Map<string, string>();
    const chunkMap = new Map<
      string,
      { js: string[]; css: string[]; assets: Set<string> }
    >();

    const allFiles = files.map((file) => {
      if (file.chunk) {
        const names = recursiveChunkEntryNames(file.chunk);

        for (const name of names) {
          chunkEntries.set(name, [file, ...(chunkEntries.get(name) || [])]);
        }

        // Track files by chunk name
        if (file.chunk.name) {
          if (!chunkMap.has(file.chunk.name)) {
            chunkMap.set(file.chunk.name, {
              js: [],
              css: [],
              assets: new Set(),
            });
          }
          const chunkFiles = chunkMap.get(file.chunk.name)!;

          if (file.path.endsWith('.css')) {
            chunkFiles.css.push(file.path);
          } else if (file.path.endsWith('.js')) {
            chunkFiles.js.push(file.path);
          }

          // Add auxiliary files to assets
          for (const auxiliaryFile of file.chunk.auxiliaryFiles) {
            chunkFiles.assets.add(auxiliaryFile);
          }
        }
      }

      if (file.path.endsWith('.LICENSE.txt')) {
        const sourceFilePath = file.path.split('.LICENSE.txt')[0];
        licenseMap.set(sourceFilePath, file.path);

        // Add license files to corresponding chunk assets
        for (const [_, chunkFiles] of chunkMap.entries()) {
          if (
            chunkFiles.js.includes(sourceFilePath) ||
            chunkFiles.css.includes(sourceFilePath)
          ) {
            chunkFiles.assets.add(file.path);
          }
        }
      }
      return file.path;
    });

    const entries: ManifestList['entries'] = {};

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

        for (const auxiliaryFile of file.chunk!.auxiliaryFiles) {
          assets.add(auxiliaryFile);
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

    const result: ManifestList = {
      allFiles,
      entries,
      namedChunks: {},
    };

    // Add chunks to manifest
    for (const [chunkName, files] of chunkMap.entries()) {
      result.namedChunks[chunkName] = {
        js: files.js.length > 0 ? files.js : undefined,
        css: files.css.length > 0 ? files.css : undefined,
        assets: files.assets.size > 0 ? Array.from(files.assets) : undefined,
      };
    }

    return result;
  };

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

      const fileName =
        typeof manifest === 'string' ? manifest : 'manifest.json';

      const { RspackManifestPlugin } = await import(
        '../../compiled/rspack-manifest-plugin/index.js'
      );
      const { htmlPaths } = environment;

      chain.plugin(CHAIN_ID.PLUGIN.MANIFEST).use(RspackManifestPlugin, [
        {
          fileName,
          writeToFileEmit: isDev && writeToDisk !== true,
          generate: generateManifest(htmlPaths),
        },
      ]);
    });
  },
});
