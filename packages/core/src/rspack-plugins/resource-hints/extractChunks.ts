/**
 * This method is modified based on source found in
 * https://github.com/vuejs/preload-webpack-plugin/blob/master/src/lib/extract-chunks.js
 *
 * Copyright 2018 Google Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { Chunk, ChunkGroup, Compilation } from '@rspack/core';
import type { ResourceHintsIncludeType } from '../../types';

function isAsyncChunk(chunk: Chunk | ChunkGroup): boolean {
  if ('canBeInitial' in chunk) {
    return !chunk.canBeInitial();
  }
  if ('isInitial' in chunk) {
    return !chunk.isInitial();
  }
  return false;
}

export function extractChunks(
  compilation: Compilation,
  includeType?: ResourceHintsIncludeType,
):
  | Chunk[]
  | {
      files: string[];
      auxiliaryFiles?: string[];
    }[] {
  const chunks = [...compilation.chunks];

  // 'asyncChunks' are chunks intended for lazy/async loading usually generated as
  // part of code-splitting with import() or require.ensure(). By default, asyncChunks
  // get wired up using link rel=preload when using this plugin. This behavior can be
  // configured to preload all types of chunks or just prefetch chunks as needed.
  if (includeType === undefined || includeType === 'async-chunks') {
    return chunks.filter(isAsyncChunk);
  }

  if (includeType === 'initial') {
    return chunks.filter((chunk) => !isAsyncChunk(chunk));
  }

  if (includeType === 'all-chunks') {
    // Async chunks, vendor chunks, normal chunks.
    return chunks;
  }

  if (includeType === 'all-assets') {
    // Every asset, regardless of which chunk it's in.
    // Wrap it in a single, "pseudo-chunk" return value.
    // Note: webpack5 will extract license default, we do not need to preload them
    // @ts-expect-error
    const licenseAssets = [...(compilation.assetsInfo?.values() || [])]
      .map((info) => {
        if (info.related?.license) {
          return info.related.license;
        }
        return false;
      })
      .filter(Boolean);

    return [
      {
        files: Object.keys(compilation.assets).filter(
          (t) => !licenseAssets.includes(t),
        ),
      },
    ];
  }

  return chunks;
}
