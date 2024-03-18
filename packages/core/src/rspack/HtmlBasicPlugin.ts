import type HtmlWebpackPlugin from 'html-webpack-plugin';
import type { HtmlTagObject } from 'html-webpack-plugin';
import type { Compiler, Compilation } from '@rspack/core';
import {
  partition,
  isFunction,
  withPublicPath,
  type HtmlTag,
  type HtmlTagHandler,
  type HtmlTagDescriptor,
  type HtmlTagUtils,
} from '@rsbuild/shared';
import { getHTMLPlugin } from '../provider/htmlPluginUtil';

export type TagConfig = {
  hash?: HtmlTag['hash'];
  publicPath?: HtmlTag['publicPath'];
  append?: HtmlTag['append'];
  tags?: HtmlTagDescriptor[];
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

// convert tags between `HtmlTag` and `HtmlTagObject`.
const formatTags = (
  tags: HtmlTagObject[],
  override?: Partial<HtmlTag>,
): HtmlTag[] =>
  tags.map((tag) => ({
    tag: tag.tagName,
    attrs: tag.attributes,
    children: tag.innerHTML,
    publicPath: false,
    ...override,
  }));

const modifyTags = (
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
          filename = withPublicPath(filename, optPublicPath);
        } else if (optPublicPath !== false) {
          filename = withPublicPath(filename, data.publicPath);
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
      }

      ret.push({
        meta: {},
        tagName: tag.tag,
        attributes: attrs,
        voidTag: VOID_TAGS.includes(tag.tag),
        innerHTML: tag.children,
      });
    }
    return ret;
  };

  // create tag list from html-webpack-plugin and options
  const handlers: HtmlTagHandler[] = [];
  let tags = [
    ...formatTags(data.headTags, { head: true }),
    ...formatTags(data.bodyTags, { head: false }),
  ];

  for (const tag of tagConfig.tags) {
    if (isFunction(tag)) {
      handlers.push(tag);
    } else {
      tags.push(tag);
    }
  }

  // apply tag handler callbacks
  tags = tags.sort(
    (tag1, tag2) =>
      getTagPriority(tag1, tagConfig) - getTagPriority(tag2, tagConfig),
  );

  const utils: HtmlTagUtils = {
    outputName: data.outputName,
    publicPath: data.publicPath,
    hash: compilationHash,
    entryName,
  };

  for (const handler of handlers) {
    tags = handler(tags, utils) || tags;
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

  constructor(options: HtmlBasicPluginOptions) {
    this.name = 'HtmlBasicPlugin';
    this.options = options;
  }

  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap(this.name, (compilation: Compilation) => {
      getHTMLPlugin()
        .getHooks(compilation)
        .alterAssetTagGroups.tap(this.name, (data) => {
          const entryName = data.plugin.options?.entryName;

          if (!entryName) {
            return data;
          }

          const { headTags } = data;
          const { favicon, tagConfig, templateContent } =
            this.options[entryName];

          if (!hasTitle(templateContent)) {
            addTitleTag(headTags, data.plugin.options?.title);
          }

          addFavicon(headTags, favicon);

          if (tagConfig) {
            const hash = compilation.hash ?? '';
            modifyTags(data, tagConfig, hash, entryName);
          }

          return data;
        });
    });
  }
}
