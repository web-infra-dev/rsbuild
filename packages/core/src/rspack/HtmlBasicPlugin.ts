import type HtmlWebpackPlugin from 'html-webpack-plugin';
import type { Compiler, Compilation } from '@rspack/core';
import {
  partition,
  isFunction,
  withPublicPath,
  type HtmlInjectTag,
  type HtmlInjectTagHandler,
  type HtmlInjectTagDescriptor,
  type HtmlInjectTagUtils,
} from '@rsbuild/shared';
import { getHTMLPlugin } from '../provider/htmlPluginUtil';

export interface TagConfig {
  hash?: HtmlInjectTag['hash'];
  publicPath?: HtmlInjectTag['publicPath'];
  append?: HtmlInjectTag['append'];
  includes?: string[];
  tags?: HtmlInjectTagDescriptor[];
}

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

const withHash = (url: string, hash: string) => `${url}?${hash}`;

export type HtmlInfo = {
  favicon?: string;
  tagConfig?: TagConfig;
  templateContent?: string;
};

export type HtmlBasicPluginOptions = {
  info: Record<string, HtmlInfo>;
};

export type AlterAssetTagGroupsData = {
  headTags: HtmlWebpackPlugin.HtmlTagObject[];
  bodyTags: HtmlWebpackPlugin.HtmlTagObject[];
  outputName: string;
  publicPath: string;
  plugin: HtmlWebpackPlugin;
};

export const hasTitle = (html?: string): boolean =>
  html ? /<title/i.test(html) && /<\/title/i.test(html) : false;

const modifyTags = (
  data: AlterAssetTagGroupsData,
  tagConfig: TagConfig,
  compilationHash: string,
  entryName: string,
) => {
  // skip unmatched file and empty tag list.
  const includesCurrentFile =
    !tagConfig.includes || tagConfig.includes.includes(data.outputName);

  if (!includesCurrentFile || !tagConfig.tags?.length) {
    return data;
  }

  // convert tags between `HtmlInjectTag` and `HtmlWebpackPlugin.HtmlTagObject`.
  const formatTags = (
    tags: HtmlWebpackPlugin.HtmlTagObject[],
    override?: Partial<HtmlInjectTag>,
  ) => {
    const ret: HtmlInjectTag[] = [];
    for (const tag of tags) {
      ret.push({
        tag: tag.tagName,
        attrs: tag.attributes,
        children: tag.innerHTML,
        publicPath: false,
        ...override,
      });
    }
    return ret;
  };

  const fromInjectTags = (tags: HtmlInjectTag[]) => {
    const ret: HtmlWebpackPlugin.HtmlTagObject[] = [];

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
            filename = withHash(filename, optHash);
          }
        } else if (optHash === true) {
          if (compilationHash.length) {
            filename = withHash(filename, compilationHash);
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

  // create tag list from html-webpack-plugin and options.
  const handlers: HtmlInjectTagHandler[] = [];
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

  const getPriority = (tag: HtmlInjectTag) => {
    const head = tag.head ?? HEAD_TAGS.includes(tag.tag);
    let priority = head ? -2 : 2;

    const append = tag.append ?? tagConfig.append;
    if (typeof append === 'boolean') {
      priority += append ? 1 : -1;
    }

    return priority;
  };

  // apply tag handler callbacks.
  tags = tags.sort((tag1, tag2) => getPriority(tag1) - getPriority(tag2));

  const utils: HtmlInjectTagUtils = {
    outputName: data.outputName,
    publicPath: data.publicPath,
    hash: compilationHash,
    entryName,
  };
  for (const handler of handlers) {
    tags = handler(tags, utils) || tags;
  }

  // apply to html-webpack-plugin.
  const [headTags, bodyTags] = partition(
    tags,
    (tag) => tag.head ?? HEAD_TAGS.includes(tag.tag),
  );
  data.headTags = fromInjectTags(headTags);
  data.bodyTags = fromInjectTags(bodyTags);

  return data;
};

export class HtmlBasicPlugin {
  readonly name: string;

  readonly options: HtmlBasicPluginOptions;

  constructor(options: HtmlBasicPluginOptions) {
    this.name = 'HtmlBasicPlugin';
    this.options = options;
  }

  apply(compiler: Compiler) {
    const addTitleTag = (
      headTags: HtmlWebpackPlugin.HtmlTagObject[],
      title = '',
    ) => {
      headTags.unshift({
        tagName: 'title',
        innerHTML: title,
        attributes: {},
        voidTag: false,
        meta: {},
      });
    };

    const addFavicon = (
      headTags: HtmlWebpackPlugin.HtmlTagObject[],
      entryName: string,
    ) => {
      const { favicon } = this.options.info[entryName];
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

    compiler.hooks.compilation.tap(this.name, (compilation: Compilation) => {
      const compilationHash = compilation.hash || '';

      getHTMLPlugin()
        .getHooks(compilation)
        .alterAssetTagGroups.tap(this.name, (data) => {
          const entryName = data.plugin.options?.entryName;

          if (!entryName) {
            return data;
          }

          const { headTags } = data;
          const { tagConfig, templateContent } = this.options.info[entryName];

          if (!hasTitle(templateContent)) {
            addTitleTag(headTags, data.plugin.options?.title);
          }

          if (tagConfig) {
            modifyTags(data, tagConfig, compilationHash, entryName);
          }

          addFavicon(headTags, entryName);
          return data;
        });
    });
  }
}
