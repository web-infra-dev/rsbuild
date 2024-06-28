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

    return {
      allFiles,
      entries,
    };
  };

export const pluginManifest = (): RsbuildPlugin => ({
  name: 'rsbuild:manifest',

  setup(api) {
    api.modifyBundlerChain(async (chain, { CHAIN_ID, environment }) => {
      const {
        output: { manifest },
      } = environment.config;

      if (manifest === false) {
        return;
      }

      const fileName =
        typeof manifest === 'string' ? manifest : 'manifest.json';

      const { RspackManifestPlugin } = await import('rspack-manifest-plugin');
      const htmlPaths = api.getHTMLPaths({ environment: environment.name });

      chain.plugin(CHAIN_ID.PLUGIN.MANIFEST).use(RspackManifestPlugin, [
        {
          fileName,
          generate: generateManifest(htmlPaths),
        },
      ]);
    });
  },
});
