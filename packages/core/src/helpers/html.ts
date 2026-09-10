import type { HtmlBasicTag } from '../types';

export const isNonceTag = (tag: HtmlBasicTag): boolean =>
  tag.tag === 'script' ||
  tag.tag === 'style' ||
  (tag.tag === 'link' &&
    tag.attrs?.rel === 'preload' &&
    tag.attrs?.as === 'script');
