// rsbuild/runtime/initial-chunk-retry
import type { CrossOrigin } from '@rsbuild/core';
import type { AssetsRetryHookContext, RuntimeRetryOptions } from '../types';

interface ScriptElementAttributes {
  url: string;
  times: number;
  isAsync: boolean;
  originalQuery: string;
  crossOrigin?: CrossOrigin | boolean;
}

const TAG_TYPE: { [propName: string]: new () => HTMLElement } = {
  link: HTMLLinkElement,
  script: HTMLScriptElement,
  img: HTMLImageElement,
};
const TYPES = Object.keys(TAG_TYPE);

declare global {
  // global variables shared with async chunk
  var __RB_ASYNC_CHUNKS__: Record<string, boolean>;
}

function findCurrentDomain(url: string, domainList: string[]) {
  let domain = '';
  for (let i = 0; i < domainList.length; i++) {
    if (url.indexOf(domainList[i]) !== -1) {
      domain = domainList[i];
      break;
    }
  }
  return domain || url;
}

function findNextDomain(url: string, domainList: string[]) {
  const currentDomain = findCurrentDomain(url, domainList);
  const index = domainList.indexOf(currentDomain);
  return domainList[(index + 1) % domainList.length] || url;
}

function getRequestUrl(element: HTMLElement) {
  if (
    element instanceof HTMLScriptElement ||
    element instanceof HTMLImageElement
  ) {
    return element.src;
  }
  if (element instanceof HTMLLinkElement) {
    return element.href;
  }
  return null;
}

const defaultConfig: RuntimeRetryOptions = {
  max: 3,
  type: TYPES,
  domain: [],
  crossOrigin: false,
};

function validateTargetInfo(
  config: RuntimeRetryOptions,
  e: Event,
): { target: HTMLElement; tagName: string; url: string } | false {
  const target: HTMLElement = e.target as HTMLElement;
  const tagName = target.tagName?.toLocaleLowerCase();
  const allowTags = config.type!;
  const url = getRequestUrl(target);
  if (
    !tagName ||
    allowTags.indexOf(tagName) === -1 ||
    !TAG_TYPE[tagName] ||
    !(target instanceof TAG_TYPE[tagName]) ||
    !url
  ) {
    return false;
  }

  return { target, tagName, url };
}

const postfixRE = /[?#].*$/;
function cleanUrl(url: string) {
  return url.replace(postfixRE, '');
}
function getQueryFromUrl(url: string) {
  const parts = url.split('?')[1];
  return parts ? `?${parts.split('#')[0]}` : '';
}

function createElement(
  origin: HTMLElement,
  attributes: ScriptElementAttributes,
): { element: HTMLElement; str: string } | undefined {
  const crossOrigin =
    attributes.crossOrigin === true ? 'anonymous' : attributes.crossOrigin;
  const crossOriginAttr = crossOrigin ? `crossorigin="${crossOrigin}"` : '';
  const retryTimesAttr = attributes.times
    ? `data-rsbuild-retry-times="${attributes.times}"`
    : '';

  const originalQueryAttr = attributes.originalQuery
    ? `data-rsbuild-original-query="${attributes.originalQuery}"`
    : '';
  const isAsyncAttr = attributes.isAsync ? 'data-rsbuild-async' : '';

  if (origin instanceof HTMLScriptElement) {
    const script = document.createElement('script');
    script.src = attributes.url;
    if (crossOrigin) {
      script.crossOrigin = crossOrigin;
    }
    if (attributes.times) {
      script.dataset.rsbuildRetryTimes = String(attributes.times);
    }
    if (attributes.isAsync) {
      script.dataset.rsbuildAsync = '';
    }
    if (attributes.originalQuery !== undefined) {
      script.dataset.rsbuildOriginalQuery = attributes.originalQuery;
    }

    return {
      element: script,
      str:
        // biome-ignore lint/style/useTemplate: use "</" + "script>" instead of script tag to avoid syntax error when inlining in html
        `<script src="${attributes.url}" ${crossOriginAttr} ${retryTimesAttr} ${isAsyncAttr} ${originalQueryAttr}>` +
        '</' +
        'script>',
    };
  }
  if (origin instanceof HTMLLinkElement) {
    const link = document.createElement('link');
    link.rel = origin.rel || 'stylesheet';

    if (origin.as) {
      link.as = origin.as;
    }

    link.href = attributes.url;
    if (crossOrigin) {
      link.crossOrigin = crossOrigin;
    }
    if (attributes.times) {
      link.dataset.rsbuildRetryTimes = String(attributes.times);
    }
    if (attributes.originalQuery !== undefined) {
      link.dataset.rsbuildOriginalQuery = attributes.originalQuery;
    }
    return {
      element: link,
      str: `<link rel="${link.rel}" href="${
        attributes.url
      }" ${crossOriginAttr} ${retryTimesAttr} ${
        link.as ? `as="${link.as}"` : ''
      } ${originalQueryAttr}></link>`,
    };
  }
}

function reloadElementResource(
  origin: HTMLElement,
  fresh: { element: HTMLElement; str: string },
  attributes: ScriptElementAttributes,
) {
  if (origin instanceof HTMLScriptElement) {
    if (attributes.isAsync) {
      document.body.appendChild(fresh.element);
    } else {
      document.write(fresh.str);
    }
  }

  if (origin instanceof HTMLLinkElement) {
    document.getElementsByTagName('head')[0].appendChild(fresh.element);
  }

  if (origin instanceof HTMLImageElement) {
    origin.src = attributes.url;
    origin.dataset.rsbuildRetryTimes = String(attributes.times);
    origin.dataset.rsbuildOriginalQuery = String(attributes.originalQuery);
  }
}

function retry(config: RuntimeRetryOptions, e: Event) {
  const targetInfo = validateTargetInfo(config, e);
  if (targetInfo === false) {
    return;
  }

  const { target, tagName, url } = targetInfo;

  // If the requested failed chunk is async chunk，skip it, because async chunk will be retried by asyncChunkRetry runtime
  if (
    typeof window !== 'undefined' &&
    Object.keys(window.__RB_ASYNC_CHUNKS__ || {}).some((chunkName) => {
      return url.indexOf(chunkName) !== -1;
    })
  ) {
    return;
  }

  // Filter by config.test and config.domain
  let tester = config.test;
  if (tester) {
    if (typeof tester === 'string') {
      const regexp = new RegExp(tester);
      tester = (str: string) => regexp.test(str);
    }

    if (typeof tester !== 'function' || !tester(url)) {
      return;
    }
  }

  const domain = findCurrentDomain(url, config.domain!);

  if (
    config.domain &&
    config.domain.length > 0 &&
    config.domain.indexOf(domain) === -1
  ) {
    return;
  }

  // If the retry times has exceeded the maximum, fail
  const existRetryTimes = Number(target.dataset.rsbuildRetryTimes) || 0;
  if (existRetryTimes === config.max!) {
    if (typeof config.onFail === 'function') {
      const context: AssetsRetryHookContext = {
        times: existRetryTimes,
        domain,
        url,
        tagName,
        isAsyncChunk: false,
      };
      config.onFail(context);
    }
    return;
  }

  // Then, we will start to retry
  const nextDomain = findNextDomain(domain, config.domain!);

  // if the initial request is "/static/js/async/src_Hello_tsx.js?q=1", retry url would be "/static/js/async/src_Hello_tsx.js?q=1&retry=1"
  const originalQuery =
    target.dataset.rsbuildOriginalQuery ?? getQueryFromUrl(url);
  function getUrlRetryQuery(existRetryTimes: number): string {
    if (config.addQuery === true) {
      return originalQuery !== ''
        ? `${originalQuery}&retry=${existRetryTimes}`
        : `?retry=${existRetryTimes}`;
    }
    if (typeof config.addQuery === 'function') {
      return config.addQuery({ times: existRetryTimes, originalQuery });
    }
    return '';
  }

  const isAsync =
    Boolean(target.dataset.rsbuildAsync) ||
    (target as HTMLScriptElement).async ||
    (target as HTMLScriptElement).defer;

  const attributes: ScriptElementAttributes = {
    url:
      cleanUrl(url.replace(domain, nextDomain)) +
      getUrlRetryQuery(existRetryTimes + 1),
    times: existRetryTimes + 1,
    crossOrigin: config.crossOrigin,
    isAsync,
    originalQuery,
  };

  const element = createElement(target, attributes)!;

  if (config.onRetry && typeof config.onRetry === 'function') {
    const context: AssetsRetryHookContext = {
      times: existRetryTimes,
      domain,
      url,
      tagName,
      isAsyncChunk: false,
    };
    config.onRetry(context);
  }

  reloadElementResource(target, element, attributes);
}

function load(config: RuntimeRetryOptions, e: Event) {
  const targetInfo = validateTargetInfo(config, e);
  if (targetInfo === false) {
    return;
  }
  const { target, tagName, url } = targetInfo;
  const domain = findCurrentDomain(url, config.domain!);
  const retryTimes = Number(target.dataset.rsbuildRetryTimes) || 0;
  if (retryTimes === 0) {
    return;
  }
  if (typeof config.onSuccess === 'function') {
    const context: AssetsRetryHookContext = {
      times: retryTimes,
      domain,
      url,
      tagName,
      isAsyncChunk: false,
    };
    config.onSuccess(context);
  }
}

function resourceMonitor(
  error: (e: Event) => void,
  success: (e: Event) => void,
) {
  if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
    document.addEventListener(
      'error',
      (e) => {
        if (e && e.target instanceof Element) {
          error(e);
        }
      },
      true,
    );

    document.addEventListener(
      'load',
      (e) => {
        if (e && e.target instanceof Element) {
          success(e);
        }
      },
      true,
    );
  }
}

// @ts-expect-error init is a global function, ignore ts(6133)
function init(options: RuntimeRetryOptions) {
  const config: RuntimeRetryOptions = {};

  for (const key in defaultConfig) {
    // @ts-ignore
    config[key] = defaultConfig[key];
  }

  for (const key in options) {
    // @ts-ignore
    config[key] = options[key];
  }

  // Normalize config
  if (!Array.isArray(config.type) || config.type.length === 0) {
    config.type = defaultConfig.type;
  }
  if (!Array.isArray(config.domain) || config.domain.length === 0) {
    config.domain = defaultConfig.domain;
  }

  if (Array.isArray(config.domain)) {
    config.domain = config.domain.filter(Boolean);
  }

  // init global variables shared with async chunk
  if (typeof window !== 'undefined' && !window.__RB_ASYNC_CHUNKS__) {
    window.__RB_ASYNC_CHUNKS__ = {};
  }
  // Bind event in window
  try {
    resourceMonitor(
      (e: Event) => {
        try {
          retry(config, e);
        } catch (err) {
          console.error('retry error captured', err);
        }
      },
      (e: Event) => {
        try {
          load(config, e);
        } catch (err) {
          console.error('load error captured', err);
        }
      },
    );
  } catch (err) {
    console.error('monitor error captured', err);
  }
}
