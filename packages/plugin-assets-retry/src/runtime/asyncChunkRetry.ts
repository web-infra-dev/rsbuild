// rsbuild/runtime/async-chunk-retry
import type { AssetsRetryHookContext, RuntimeRetryOptions } from '../types.js';

type ChunkId = string; // e.g: src_AsyncCompTest_tsx
type ChunkFilename = string; // e.g: static/js/async/src_AsyncCompTest_tsx.js
type ChunkSrcUrl = string; // publicPath + ChunkFilename e.g: http://localhost:3000/static/js/async/src_AsyncCompTest_tsx.js

type Retry = {
  nextDomain: string;
  nextRetryUrl: ChunkSrcUrl;
  existRetryTimes: number;
  originalScriptFilename: ChunkFilename;
  originalSrcUrl: ChunkSrcUrl;
};

type RetryCollector = Record<ChunkId, Retry>;

declare global {
  // RuntimeGlobals.require
  var __RUNTIME_GLOBALS_REQUIRE__: unknown;
  // RuntimeGlobals.ensure
  var __RUNTIME_GLOBALS_ENSURE_CHUNK__: (chunkId: ChunkId) => Promise<unknown>;
  // RuntimeGlobals.getChunkScriptFilename
  var __RUNTIME_GLOBALS_GET_CHUNK_SCRIPT_FILENAME__: (
    chunkId: ChunkId,
  ) => string;
  // RuntimeGlobals.getChunkCssFilename
  var __RUNTIME_GLOBALS_GET_CSS_FILENAME__:
    | ((chunkId: ChunkId) => string)
    | undefined;
  // RuntimeGlobals.getChunkCssFilename when using Rspack.CssExtractPlugin
  var __RUNTIME_GLOBALS_GET_MINI_CSS_EXTRACT_FILENAME__:
    | ((chunkId: ChunkId) => string)
    | undefined;
  // RuntimeGlobals.loadScript
  var __RUNTIME_GLOBALS_LOAD_SCRIPT__: (
    url: ChunkSrcUrl,
    done: unknown,
    key: string,
    chunkId: ChunkId,
  ) => void;
  // RuntimeGlobals.publicPath
  var __RUNTIME_GLOBALS_PUBLIC_PATH__: string;
  // user options
  var __RETRY_OPTIONS__: RuntimeRetryOptions;
  // global variables shared with initial chunk retry runtime
  var __RB_ASYNC_CHUNKS__: Record<ChunkFilename, boolean>;
}

// init retryCollector and nextRetry function
const config = __RETRY_OPTIONS__;
const maxRetries = config.max || 3;
const retryCollector: RetryCollector = {};

function findCurrentDomain(url: string) {
  const domainList = config.domain ?? [];
  let domain = '';
  for (let i = 0; i < domainList.length; i++) {
    if (url.indexOf(domainList[i]) !== -1) {
      domain = domainList[i];
      break;
    }
  }
  return domain || window.origin;
}

function findNextDomain(url: string) {
  const domainList = config.domain ?? [];
  const currentDomain = findCurrentDomain(url);
  const index = domainList.indexOf(currentDomain);
  return domainList[(index + 1) % domainList.length] || url;
}

const postfixRE = /[?#].*$/;
function cleanUrl(url: string) {
  return url.replace(postfixRE, '');
}
function getQueryFromUrl(url: string) {
  const parts = url.split('?')[1];
  return parts ? `?${parts.split('#')[0]}` : '';
}

function getUrlRetryQuery(
  existRetryTimes: number,
  originalQuery: string,
): string {
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

function removeDomainFromUrl(url: string): string {
  const protocolStartIndex = url.indexOf('//');

  // case /app/main/static/js/index.js
  if (protocolStartIndex === -1 && url.startsWith('/')) {
    return url;
  }

  // case "//cdn.com/app/main/static/js/index.js"
  // case "http://cdn.com/app/main/static/js/index.js"
  const protocolEndIndex = protocolStartIndex + 2;
  const pathStartIndex = url.indexOf('/', protocolEndIndex);

  return url.slice(pathStartIndex);
}

// "http://cdn.com/app/main/static/js/index.js?query=1#hash" -> "/app/main/static/js/index.js"
function getAbsolutePathFromUrl(url: string): string {
  return cleanUrl(removeDomainFromUrl(url));
}

function getNextRetryUrl(
  existRetryTimes: number,
  nextDomain: string,
  originalSrcUrl: string,
) {
  const absolutePath = getAbsolutePathFromUrl(originalSrcUrl);
  return (
    nextDomain +
    absolutePath +
    getUrlRetryQuery(existRetryTimes, getQueryFromUrl(originalSrcUrl))
  );
}

function getCurrentRetry(chunkId: string): Retry | undefined {
  return retryCollector[chunkId];
}

function initRetry(chunkId: string): Retry {
  const originalScriptFilename = originalGetChunkScriptFilename(chunkId);

  const originalSrcUrl =
    __RUNTIME_GLOBALS_PUBLIC_PATH__ + originalScriptFilename;

  const existRetryTimes = 1;
  const nextDomain = config.domain?.[0] ?? window.origin;

  return {
    existRetryTimes,
    nextDomain,
    nextRetryUrl: getNextRetryUrl(existRetryTimes, nextDomain, originalSrcUrl),

    originalScriptFilename,
    originalSrcUrl,
  };
}

function nextRetry(chunkId: string): Retry {
  const currRetry = getCurrentRetry(chunkId);

  let nextRetry: Retry;
  if (!currRetry) {
    nextRetry = initRetry(chunkId);
  } else {
    const { originalScriptFilename, originalSrcUrl } = currRetry;
    const existRetryTimes = currRetry.existRetryTimes + 1;
    const nextDomain = findNextDomain(currRetry.nextDomain);

    nextRetry = {
      existRetryTimes,
      nextDomain,
      nextRetryUrl: getNextRetryUrl(
        existRetryTimes,
        nextDomain,
        originalSrcUrl,
      ),

      originalScriptFilename,
      originalSrcUrl,
    };
  }

  retryCollector[chunkId] = nextRetry;
  return nextRetry;
}

// rewrite webpack runtime with nextRetry()
const originalEnsureChunk = __RUNTIME_GLOBALS_ENSURE_CHUNK__;
const originalGetChunkScriptFilename =
  __RUNTIME_GLOBALS_GET_CHUNK_SCRIPT_FILENAME__;
const originalGetCssFilename =
  __RUNTIME_GLOBALS_GET_MINI_CSS_EXTRACT_FILENAME__ ??
  __RUNTIME_GLOBALS_GET_CSS_FILENAME__ ??
  (() => null);
const originalLoadScript = __RUNTIME_GLOBALS_LOAD_SCRIPT__;

// if users want to support es5, add Promise polyfill first https://github.com/webpack/webpack/issues/12877
function ensureChunk(chunkId: string): Promise<unknown> {
  const result = originalEnsureChunk(chunkId);
  const originalScriptFilename = originalGetChunkScriptFilename(chunkId);
  const originalCssFilename = originalGetCssFilename(chunkId);

  // mark the async chunk name in the global variables and share it with initial chunk retry to avoid duplicate retrying
  if (typeof window !== 'undefined') {
    if (originalScriptFilename) {
      window.__RB_ASYNC_CHUNKS__[originalScriptFilename] = true;
    }
    if (originalCssFilename) {
      window.__RB_ASYNC_CHUNKS__[originalCssFilename] = true;
    }
  }

  return result.catch((error: Error) => {
    const { existRetryTimes, originalSrcUrl, nextRetryUrl, nextDomain } =
      nextRetry(chunkId);

    // At present, we don't consider the switching domain and addQuery of async CSS chunk
    // 1. Async js chunk will be requested first. It is rare for async CSS chunk to fail alone.
    // 2. the code of loading CSS in webpack runtime is complex and it may be modified by cssExtractPlugin, increase the complexity of this plugin.
    const isCssAsyncChunkLoadFailed = Boolean(
      error?.message?.includes('CSS chunk'),
    );

    const createContext = (times: number): AssetsRetryHookContext => ({
      times,
      domain: nextDomain,
      url: nextRetryUrl,
      tagName: isCssAsyncChunkLoadFailed ? 'link' : 'script',
      isAsyncChunk: true,
    });

    const context = createContext(existRetryTimes - 1);

    if (existRetryTimes > maxRetries) {
      error.message = `Loading chunk ${chunkId} from ${originalSrcUrl} failed after ${maxRetries} retries: "${error.message}"`;
      if (typeof config.onFail === 'function') {
        config.onFail(context);
      }
      throw error;
    }

    // Filter by config.test and config.domain
    let tester = config.test;
    if (tester) {
      if (typeof tester === 'string') {
        const regexp = new RegExp(tester);
        tester = (str: string) => regexp.test(str);
      }

      if (typeof tester !== 'function' || !tester(nextRetryUrl)) {
        throw error;
      }
    }

    if (
      config.domain &&
      config.domain.length > 0 &&
      config.domain.indexOf(nextDomain) === -1
    ) {
      throw error;
    }

    // Start retry
    if (typeof config.onRetry === 'function') {
      config.onRetry(context);
    }

    return ensureChunk(chunkId).then((result) => {
      if (typeof config.onSuccess === 'function') {
        const context = createContext(existRetryTimes);
        const { existRetryTimes: currRetryTimes } =
          getCurrentRetry(chunkId) ?? {};

        if (currRetryTimes === existRetryTimes) {
          config.onSuccess(context);
        }
      }
      return result;
    });
  });
}

function loadScript(
  originalUrl: ChunkSrcUrl,
  done: unknown,
  key: string,
  chunkId: ChunkId,
) {
  const retry = getCurrentRetry(chunkId);
  return originalLoadScript(
    retry ? retry.nextRetryUrl : originalUrl,
    done,
    key,
    chunkId,
  );
}

function registerAsyncChunkRetry() {
  // init global variables shared between initial-chunk-retry and async-chunk-retry
  if (typeof window !== 'undefined' && !window.__RB_ASYNC_CHUNKS__) {
    window.__RB_ASYNC_CHUNKS__ = {};
  }

  if (typeof __RUNTIME_GLOBALS_REQUIRE__ !== 'undefined') {
    try {
      __RUNTIME_GLOBALS_ENSURE_CHUNK__ = ensureChunk;
      __RUNTIME_GLOBALS_LOAD_SCRIPT__ = loadScript;
    } catch (e) {
      console.error(
        '[@rsbuild/plugin-assets-retry] Register async chunk retry runtime failed',
        e,
      );
    }
  }
}

registerAsyncChunkRetry();
