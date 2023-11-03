/**
 * Copyright JS Foundation and other contributors.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file at
 * https://github.com/jantimon/html-webpack-plugin/blob/main/LICENSE
 *
 * Modified from https://github.com/jantimon/html-webpack-plugin/blob/2f5de7ab9e8bca60e9e200f2e4b4cfab90db28d4/index.js#L800
 */

import type { MetaOptions } from '@rsbuild/shared';
import type { HtmlTagObject } from 'html-webpack-plugin';

export const generateMetaTags = (
  metaOptions?: MetaOptions,
): HtmlTagObject[] => {
  if (!metaOptions) {
    return [];
  }

  // Make tags self-closing in case of xhtml
  // Turn { "viewport" : "width=500, initial-scale=1" } into
  // [{ name:"viewport" content:"width=500, initial-scale=1" }]
  const metaTagAttributeObjects = Object.keys(metaOptions)
    .map((metaName) => {
      const metaTagContent = metaOptions[metaName];
      return typeof metaTagContent === 'string'
        ? {
            name: metaName,
            content: metaTagContent,
          }
        : metaTagContent;
    })
    .filter((attribute) => attribute !== false);

  // Turn [{ name:"viewport" content:"width=500, initial-scale=1" }] into
  // the html-webpack-plugin tag structure
  return metaTagAttributeObjects.map((metaTagAttributes) => {
    if (metaTagAttributes === false) {
      throw new Error('Invalid meta tag');
    }

    return {
      tagName: 'meta',
      voidTag: true,
      attributes: metaTagAttributes,
      meta: {},
    };
  });
};
