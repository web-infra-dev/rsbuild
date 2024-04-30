// rsbuild/runtime/async-chunk-retry
import type { AssetsRetryHookContext, RuntimeRetryOptions } from '../types';

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
  return domain || url;
}

function findNextDomain(url: string) {
  const domainList = config.domain ?? [];
  const currentDomain = findCurrentDomain(url);
  const index = domainList.indexOf(currentDomain);
  return domainList[(index + 1) % domainList.length] || url;
}

// TODO: add option query to onRetry with initial chunk together
// function getUrlRetryQuery(existRetryTimes: number): string {
//   return `?retry-attempt=${existRetryTimes}`;
// }

function getCurrentRetry(chunkId: string): Retry | undefined {
  return retryCollector[chunkId];
}

function initRetry(chunkId: string): Retry {
  const originalScriptFilename = originalGetChunkScriptFilename(chunkId);

  const originalSrcUrl =
    __RUNTIME_GLOBALS_PUBLIC_PATH__ + originalScriptFilename;

  const nextDomain = config.domain?.[0] ?? __RUNTIME_GLOBALS_PUBLIC_PATH__;

  const existRetryTimes = 1;

  return {
    existRetryTimes,
    nextDomain,
    nextRetryUrl:
      nextDomain +
      (nextDomain[nextDomain.length - 1] === '/' ? '' : '/') +
      originalScriptFilename,
    // + getUrlRetryQuery(existRetryTimes),

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
    const existRetryTimes = currRetry.existRetryTimes + 1;
    const nextDomain = findNextDomain(currRetry.nextDomain);
    nextRetry = {
      existRetryTimes,
      nextDomain,
      nextRetryUrl:
        nextDomain +
        (nextDomain[nextDomain.length - 1] === '/' ? '' : '/') +
        currRetry.originalScriptFilename,
      // + getUrlRetryQuery(existRetryTimes),

      originalScriptFilename: currRetry.originalScriptFilename,
      originalSrcUrl: currRetry.originalSrcUrl,
    };
  }

  retryCollector[chunkId] = nextRetry;
  return nextRetry;
}

// rewrite webpack runtime with nextRetry()
const originalEnsureChunk = __RUNTIME_GLOBALS_ENSURE_CHUNK__;
const originalGetChunkScriptFilename =
  __RUNTIME_GLOBALS_GET_CHUNK_SCRIPT_FILENAME__;
const originalLoadScript = __RUNTIME_GLOBALS_LOAD_SCRIPT__;

// if users want to support es5, add Promise polyfill first https://github.com/webpack/webpack/issues/12877
function ensureChunk(chunkId: string): Promise<unknown> {
  const result = originalEnsureChunk(chunkId);
  const originalScriptFilename = originalGetChunkScriptFilename(chunkId);

  // mark the async chunk name in the global variables and share it with initial chunk retry
  if (
    typeof window !== 'undefined' &&
    !window.__RB_ASYNC_CHUNKS__[originalScriptFilename]
  ) {
    window.__RB_ASYNC_CHUNKS__[originalScriptFilename] = true;
  }

  return result.catch(function (error: Error) {
    const { existRetryTimes, originalSrcUrl, nextRetryUrl, nextDomain } =
      nextRetry(chunkId);

    const createContext = (times: number): AssetsRetryHookContext => ({
      times,
      domain: nextDomain,
      url: nextRetryUrl,
      tagName: 'script',
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

    // biome-ignore lint/complexity/useArrowFunction: use function instead of () => {}
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
  // init global variables shared with async chunk
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
