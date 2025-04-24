/**
 * This method is modified based on source found in
 * https://github.com/vuejs/preload-webpack-plugin/blob/master/src/index.js
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

import type {
  Chunk,
  Compilation,
  Compiler,
  RspackPluginInstance,
} from '@rspack/core';
import {
  castArray,
  ensureAssetPrefix,
  isFunction,
  upperFirst,
} from '../../helpers';
import { getHTMLPlugin } from '../../pluginHelper';
import type {
  HtmlRspackPlugin,
  ResourceHintsFilter,
  ResourceHintsFilterFn,
  ResourceHintsOptions,
} from '../../types';
import { doesChunkBelongToHtml } from './doesChunkBelongToHtml';
import { extractChunks } from './extractChunks';
import { type ResourceType, getResourceType } from './getResourceType';

const defaultOptions: ResourceHintsOptions = {
  type: 'async-chunks',
  dedupe: true,
};

type LinkType = 'preload' | 'prefetch';

interface Attributes {
  [attributeName: string]: string | boolean | null | undefined;
  href: string;
  rel: LinkType;
  as?: ResourceType;
  crossorigin?: string;
}

const applyFilter = (
  files: string[],
  include?: ResourceHintsFilter,
  exclude?: ResourceHintsFilter,
) => {
  const includeRegExp: RegExp[] = [];
  const excludeRegExp: RegExp[] = [];
  const includeFn: ResourceHintsFilterFn[] = [];
  const excludeFn: ResourceHintsFilterFn[] = [];

  if (include) {
    for (const item of castArray(include)) {
      if (typeof item === 'string') {
        includeRegExp.push(new RegExp(item));
      } else if (isFunction(item)) {
        includeFn.push(item);
      } else {
        includeRegExp.push(item);
      }
    }
  }
  if (exclude) {
    for (const item of castArray(exclude)) {
      if (typeof item === 'string') {
        excludeRegExp.push(new RegExp(item));
      } else if (isFunction(item)) {
        excludeFn.push(item);
      } else {
        excludeRegExp.push(item);
      }
    }
  }

  return files.filter((file) => {
    let includeMatched = false;

    for (const item of includeRegExp) {
      if (item.test(file)) {
        includeMatched = true;
      }
    }
    for (const item of includeFn) {
      if (item(file)) {
        includeMatched = true;
      }
    }

    // If there are include filters and no include filter is matched, skip the file
    const hasIncludeFilter = includeRegExp.length + includeFn.length > 0;
    if (hasIncludeFilter && !includeMatched) {
      return false;
    }

    for (const item of excludeRegExp) {
      if (item.test(file)) {
        return false;
      }
    }
    for (const item of excludeFn) {
      if (item(file)) {
        return false;
      }
    }
    return true;
  });
};

function filterResourceHints(
  resourceHints: HtmlRspackPlugin.HtmlTagObject[],
  scripts: HtmlRspackPlugin.HtmlTagObject[],
): HtmlRspackPlugin.HtmlTagObject[] {
  return resourceHints.filter(
    (resourceHint) =>
      !scripts.find(
        (script) => script.attributes.src === resourceHint.attributes.href,
      ),
  );
}

function generateLinks(
  options: ResourceHintsOptions,
  type: LinkType,
  compilation: Compilation,
  data: HtmlRspackPlugin.BeforeAssetTagGenerationData,
  HTMLCount: number,
): HtmlRspackPlugin.HtmlTagObject[] {
  // get all chunks
  const extractedChunks = extractChunks(compilation, options.type);

  const htmlChunks =
    // Handle all chunks.
    options.type === 'all-assets' || HTMLCount === 1
      ? extractedChunks
      : // Only handle chunks imported by this HtmlRspackPlugin.
        extractedChunks.filter((chunk) =>
          doesChunkBelongToHtml({
            chunk: chunk as Chunk,
            compilation,
            htmlPluginData: data,
            pluginOptions: options,
          }),
        );

  // Flatten the list of files.
  const allFiles = htmlChunks
    .reduce(
      (accumulated: string[], chunk) =>
        accumulated.concat([
          ...chunk.files,
          // related assets are inside auxiliaryFiles
          ...(chunk.auxiliaryFiles || []),
        ]),
      [],
    )
    // source map files should always be excluded
    .filter((file) => !file.endsWith('.map'));

  const uniqueFiles = new Set<string>(allFiles);
  const filteredFiles = applyFilter(
    [...uniqueFiles],
    options.include,
    options.exclude,
  );

  // Sort to ensure the output is predictable.
  const sortedFilteredFiles = filteredFiles.sort();
  const links: HtmlRspackPlugin.HtmlTagObject[] = [];
  const { publicPath, crossOriginLoading } = compilation.outputOptions;

  for (const file of sortedFilteredFiles) {
    const href = ensureAssetPrefix(file, publicPath);
    const attributes: Attributes = {
      href,
      rel: type,
    };

    if (type === 'preload') {
      // If we're preloading this resource (as opposed to prefetching),
      // then we need to set the 'as' attribute correctly.
      attributes.as = getResourceType({
        href,
        file,
      });

      // On the off chance that we have a cross-origin 'href' attribute,
      // set crossOrigin on the <link> to trigger CORS mode. Non-CORS
      // fonts can't be used.
      if (attributes.as === 'font') {
        attributes.crossorigin = '';
      }

      if (attributes.as === 'script' || attributes.as === 'style') {
        if (
          crossOriginLoading &&
          !(crossOriginLoading !== 'use-credentials' && publicPath === '/')
        ) {
          attributes.crossorigin =
            crossOriginLoading === 'anonymous' ? '' : crossOriginLoading;
        }
      }
    }

    links.push({
      tagName: 'link',
      attributes,
      voidTag: true,
      meta: {},
    });
  }

  return links;
}

export class HtmlResourceHintsPlugin implements RspackPluginInstance {
  readonly options: ResourceHintsOptions;

  name = 'HtmlResourceHintsPlugin';

  resourceHints: HtmlRspackPlugin.HtmlTagObject[] = [];

  type: LinkType;

  HTMLCount: number;

  constructor(
    options: ResourceHintsOptions,
    type: LinkType,
    HTMLCount: number,
  ) {
    this.options = { ...defaultOptions, ...options };
    this.type = type;
    this.HTMLCount = HTMLCount;
  }

  apply(compiler: Compiler): void {
    compiler.hooks.compilation.tap(this.name, (compilation) => {
      const pluginHooks = getHTMLPlugin().getCompilationHooks(compilation);
      const pluginName = `HTML${upperFirst(this.type)}Plugin`;

      pluginHooks.beforeAssetTagGeneration.tap(pluginName, (data) => {
        this.resourceHints = generateLinks(
          this.options,
          this.type,
          compilation,
          data,
          this.HTMLCount,
        );

        return data;
      });

      pluginHooks.alterAssetTags.tap(pluginName, (data) => {
        if (this.resourceHints) {
          data.assetTags.styles = [
            ...(this.options.dedupe
              ? filterResourceHints(this.resourceHints, data.assetTags.scripts)
              : this.resourceHints),
            ...data.assetTags.styles,
          ];
        }
        return data;
      });
    });
  }
}
