import {
  type HtmlBasicTag,
  type HtmlTag,
  type HtmlTagDescriptor,
  type HtmlTagUtils,
  type ModifyHTMLTagsFn,
  isFunction,
  partition,
} from '@rsbuild/shared';
import type { Compilation, Compiler } from '@rspack/core';
import type HtmlWebpackPlugin from 'html-webpack-plugin';
import type { HtmlTagObject } from 'html-webpack-plugin';
import { ensureAssetPrefix } from '../helpers';
import { getHTMLPlugin } from '../pluginHelper';

export type TagConfig = {
  tags?: HtmlTagDescriptor[];
  hash?: HtmlTag['hash'];
  append?: HtmlTag['append'];
  publicPath?: HtmlTag['publicPath'];
};

/** @see {@link https://developer.mozilla.org/en-US/docs/Glossary/Void_element} */
export const VOID_TAGS = [
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'keygen',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
];

/** @see {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/head#see_also} */
export const HEAD_TAGS = [
  'title',
  'base',
  'link',
  'style',
  'meta',
  'script',
  'noscript',
  'template',
];

export const FILE_ATTRS = {
  link: 'href',
  script: 'src',
};

export type HtmlInfo = {
  favicon?: string;
  tagConfig?: TagConfig;
  templateContent?: string;
};

export type HtmlBasicPluginOptions = Record<string, HtmlInfo>;

export type AlterAssetTagGroupsData = {
  headTags: HtmlTagObject[];
  bodyTags: HtmlTagObject[];
  outputName: string;
  publicPath: string;
  plugin: HtmlWebpackPlugin;
};

export const hasTitle = (html?: string): boolean =>
  html ? /<title/i.test(html) && /<\/title/i.test(html) : false;

const getTagPriority = (tag: HtmlTag, tagConfig: TagConfig) => {
  const head = tag.head ?? HEAD_TAGS.includes(tag.tag);
  let priority = head ? -2 : 2;

  const append = tag.append ?? tagConfig.append;
  if (typeof append === 'boolean') {
    priority += append ? 1 : -1;
  }

  return priority;
};

/**
 * `HtmlTagObject` -> `HtmlBasicTag`
 */
const formatBasicTag = (tag: HtmlTagObject): HtmlBasicTag => ({
  tag: tag.tagName,
  attrs: tag.attributes,
  children: tag.innerHTML,
});

/**
 * `HtmlBasicTag` -> `HtmlTagObject`
 */
const fromBasicTag = (tag: HtmlBasicTag): HtmlTagObject => ({
  meta: {},
  tagName: tag.tag,
  attributes: tag.attrs ?? {},
  voidTag: VOID_TAGS.includes(tag.tag),
  innerHTML: tag.children,
});

/**
 * `HtmlTagObject[]` -> `HtmlTag[]`
 */
const formatTags = (
  tags: HtmlTagObject[],
  override?: Partial<HtmlTag>,
): HtmlTag[] =>
  tags.map((tag) => ({
    ...formatBasicTag(tag),
    publicPath: false,
    ...override,
  }));

const applyTagConfig = (
  data: AlterAssetTagGroupsData,
  tagConfig: TagConfig,
  compilationHash: string,
  entryName: string,
) => {
  if (!tagConfig.tags?.length) {
    return data;
  }

  const fromInjectTags = (tags: HtmlTag[]) => {
    const ret: HtmlTagObject[] = [];

    for (const tag of tags) {
      // apply publicPath and hash to filename attr.
      const attrs = { ...tag.attrs };
      const filenameTag = FILE_ATTRS[tag.tag as keyof typeof FILE_ATTRS];
      let filename = attrs[filenameTag];

      if (typeof filename === 'string') {
        const optPublicPath = tag.publicPath ?? tagConfig.publicPath;

        if (typeof optPublicPath === 'function') {
          filename = optPublicPath(filename, data.publicPath);
        } else if (typeof optPublicPath === 'string') {
          filename = ensureAssetPrefix(filename, optPublicPath);
        } else if (optPublicPath !== false) {
          filename = ensureAssetPrefix(filename, data.publicPath);
        }

        const optHash = tag.hash ?? tagConfig.hash;

        if (typeof optHash === 'function') {
          if (compilationHash.length) {
            filename = optHash(filename, compilationHash);
          }
        } else if (typeof optHash === 'string') {
          if (optHash.length) {
            filename = `${filename}?${optHash}`;
          }
        } else if (optHash === true) {
          if (compilationHash.length) {
            filename = `${filename}?${compilationHash}`;
          }
        }

        attrs[filenameTag] = filename;
        tag.attrs = attrs;
      }

      ret.push(fromBasicTag(tag));
    }
    return ret;
  };

  let tags = [
    ...formatTags(data.headTags, { head: true }),
    ...formatTags(data.bodyTags, { head: false }),
  ];

  const utils: HtmlTagUtils = {
    hash: compilationHash,
    entryName,
    outputName: data.outputName,
    publicPath: data.publicPath,
  };

  for (const item of tagConfig.tags) {
    if (isFunction(item)) {
      tags = item(tags, utils) || tags;
    } else {
      tags.push(item);
    }

    tags = tags.sort(
      (tag1, tag2) =>
        getTagPriority(tag1, tagConfig) - getTagPriority(tag2, tagConfig),
    );
  }

  const [headTags, bodyTags] = partition(
    tags,
    (tag) => tag.head ?? HEAD_TAGS.includes(tag.tag),
  );
  data.headTags = fromInjectTags(headTags);
  data.bodyTags = fromInjectTags(bodyTags);

  return data;
};

const addTitleTag = (headTags: HtmlTagObject[], title = '') => {
  headTags.unshift({
    tagName: 'title',
    innerHTML: title,
    attributes: {},
    voidTag: false,
    meta: {},
  });
};

const addFavicon = (headTags: HtmlTagObject[], favicon?: string) => {
  if (favicon) {
    headTags.unshift({
      tagName: 'link',
      voidTag: true,
      attributes: {
        rel: 'icon',
        href: favicon,
      },
      meta: {},
    });
  }
};

export class HtmlBasicPlugin {
  readonly name: string;

  readonly options: HtmlBasicPluginOptions;

  readonly modifyTagsFn?: ModifyHTMLTagsFn;

  constructor(
    options: HtmlBasicPluginOptions,
    modifyTagsFn?: ModifyHTMLTagsFn,
  ) {
    this.name = 'HtmlBasicPlugin';
    this.options = options;
    this.modifyTagsFn = modifyTagsFn;
  }

  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap(this.name, (compilation: Compilation) => {
      getHTMLPlugin()
        .getHooks(compilation)
        .alterAssetTagGroups.tapPromise(this.name, async (data) => {
          const entryName = data.plugin.options?.entryName;

          if (!entryName) {
            return data;
          }

          const { headTags, bodyTags } = data;
          const { favicon, tagConfig, templateContent } =
            this.options[entryName];

          if (!hasTitle(templateContent)) {
            addTitleTag(headTags, data.plugin.options?.title);
          }

          addFavicon(headTags, favicon);

          const tags = {
            headTags: headTags.map(formatBasicTag),
            bodyTags: bodyTags.map(formatBasicTag),
          };

          const modified = this.modifyTagsFn
            ? await this.modifyTagsFn(tags, {
                compilation,
                assetPrefix: data.publicPath,
                filename: data.outputName,
              })
            : tags;

          Object.assign(data, {
            headTags: modified.headTags.map(fromBasicTag),
            bodyTags: modified.bodyTags.map(fromBasicTag),
          });

          if (tagConfig) {
            const hash = compilation.hash ?? '';
            applyTagConfig(data, tagConfig, hash, entryName);
          }

          return data;
        });
    });
  }
}
