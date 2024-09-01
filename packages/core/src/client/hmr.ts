/**
 * This has been adapted from `create-react-app`, authored by Facebook, Inc.
 * see: https://github.com/facebookincubator/create-react-app/tree/master/packages/react-dev-utils
 *
 * Tips: this package will be bundled and running in the browser, do not import any Node.js modules.
 */
import type { ClientConfig, Rspack } from '../types';
import { formatStatsMessages } from './format';

const compilationName = RSBUILD_COMPILATION_NAME;

function formatURL({
  port,
  protocol,
  hostname,
  pathname,
}: {
  port: string | number;
  protocol: string;
  hostname: string;
  pathname: string;
}) {
  if (typeof URL !== 'undefined') {
    const url = new URL('http://localhost');
    url.port = String(port);
    url.hostname = hostname;
    url.protocol = protocol;
    url.pathname = pathname;
    url.searchParams.append('compilationName', compilationName);
    return url.toString();
  }

  // compatible with IE11
  const colon = protocol.indexOf(':') === -1 ? ':' : '';
  return `${protocol}${colon}//${hostname}:${port}${pathname}`;
}

function getSocketUrl(urlParts: ClientConfig) {
  const { location } = self;
  const { host, port, path, protocol } = urlParts;

  return formatURL({
    protocol: protocol || (location.protocol === 'https:' ? 'wss' : 'ws'),
    hostname: host || location.hostname,
    port: port || location.port,
    pathname: path || '/rsbuild-hmr',
  });
}

// Remember some state related to hot module replacement.
let isFirstCompilation = true;
let lastCompilationHash: string | null = null;
let hasCompileErrors = false;

function clearOutdatedErrors() {
  // Clean up outdated compile errors, if any.
  if (console.clear && hasCompileErrors) {
    console.clear();
  }
}

let createOverlay: undefined | ((err: string[]) => void);
let clearOverlay: undefined | (() => void);

export const registerOverlay = (
  createFn: (err: string[]) => void,
  clearFn: () => void,
): void => {
  createOverlay = createFn;
  clearOverlay = clearFn;
};

// Successful compilation.
function handleSuccess() {
  clearOutdatedErrors();

  const isHotUpdate = !isFirstCompilation;
  isFirstCompilation = false;
  hasCompileErrors = false;

  // Attempt to apply hot updates or reload.
  if (isHotUpdate) {
    tryApplyUpdates();
  }
}

// Compilation with warnings (e.g. ESLint).
function handleWarnings(warnings: Rspack.StatsError[]) {
  clearOutdatedErrors();

  const isHotUpdate = !isFirstCompilation;
  isFirstCompilation = false;
  hasCompileErrors = false;

  const formatted = formatStatsMessages({
    warnings,
    errors: [],
  });

  for (let i = 0; i < formatted.warnings.length; i++) {
    if (i === 5) {
      console.warn(
        'There were more warnings in other files, you can find a complete log in the terminal.',
      );
      break;
    }
    console.warn(formatted.warnings[i]);
  }

  // Attempt to apply hot updates or reload.
  if (isHotUpdate) {
    tryApplyUpdates();
  }
}

// Compilation with errors (e.g. syntax error or missing modules).
function handleErrors(errors: Rspack.StatsError[]) {
  clearOutdatedErrors();

  isFirstCompilation = false;
  hasCompileErrors = true;

  // "Massage" webpack messages.
  const formatted = formatStatsMessages({
    errors,
    warnings: [],
  });

  // Also log them to the console.
  for (const error of formatted.errors) {
    console.error(error);
  }

  if (createOverlay) {
    createOverlay(formatted.errors);
  }

  // Do not attempt to reload now.
  // We will reload on next success instead.
}

function isUpdateAvailable() {
  // __webpack_hash__ is the hash of the current compilation.
  // It's a global variable injected by webpack / Rspack.
  return lastCompilationHash !== __webpack_hash__;
}

// Attempt to update code on the fly, fall back to a hard reload.
function tryApplyUpdates() {
  // detect is there a newer version of this code available
  if (!isUpdateAvailable()) {
    return;
  }

  if (!import.meta.webpackHot) {
    // HotModuleReplacementPlugin is not in Rspack configuration.
    reloadPage();
    return;
  }

  // webpack disallows updates in other states.
  if (import.meta.webpackHot.status() !== 'idle') {
    return;
  }

  function handleApplyUpdates(
    err: unknown,
    updatedModules: (string | number)[] | null,
  ) {
    const forcedReload = err || !updatedModules;
    if (forcedReload) {
      if (err) {
        console.error('[HMR] Forced reload caused by: ', err);
      }

      reloadPage();
      return;
    }

    if (isUpdateAvailable()) {
      // While we were updating, there was a new update! Do it again.
      tryApplyUpdates();
    }
  }

  // https://rspack.dev/api/modules#importmetawebpackhot-webpack-specific
  import.meta.webpackHot.check(true).then(
    (updatedModules) => {
      handleApplyUpdates(null, updatedModules);
    },
    (err) => {
      handleApplyUpdates(err, null);
    },
  );
}

const MAX_RETRIES = 100;
let connection: WebSocket | null = null;
let retryCount = 0;

function onOpen() {
  // Notify users that the HMR has successfully connected.
  console.info('[HMR] connected.');
}

function onMessage(e: MessageEvent<string>) {
  const message = JSON.parse(e.data);

  if (message.compilationName && message.compilationName !== compilationName) {
    return;
  }

  switch (message.type) {
    case 'hash':
      // Update the last compilation hash
      lastCompilationHash = message.data;

      if (clearOverlay && isUpdateAvailable()) {
        clearOverlay();
      }
      break;
    case 'still-ok':
    case 'ok':
      handleSuccess();
      break;
    // Triggered when static files changed
    case 'static-changed':
    case 'content-changed':
      reloadPage();
      break;
    case 'warnings':
      handleWarnings(message.data);
      break;
    case 'errors':
      handleErrors(message.data);
      break;
  }
}

function sleep(msec = 1000) {
  return new Promise((resolve) => {
    setTimeout(resolve, msec);
  });
}

async function onClose() {
  console.info('[HMR] disconnected. Attempting to reconnect.');

  removeListeners();

  await sleep(1000);
  retryCount++;

  if (
    connection &&
    (connection.readyState === connection.CONNECTING ||
      connection.readyState === connection.OPEN)
  ) {
    retryCount = 0;
    return;
  }

  // Exceeded max retry attempts, stop retry.
  if (retryCount > MAX_RETRIES) {
    console.info(
      '[HMR] Unable to establish a connection after exceeding the maximum retry attempts.',
    );
    retryCount = 0;
    return;
  }

  reconnect();
}

// Establishing a WebSocket connection with the server.
function connect() {
  const socketUrl = getSocketUrl(RSBUILD_CLIENT_CONFIG);

  connection = new WebSocket(socketUrl);
  connection.addEventListener('open', onOpen);
  // Attempt to reconnect after disconnection
  connection.addEventListener('close', onClose);
  // Handle messages from the server.
  connection.addEventListener('message', onMessage);
}

function removeListeners() {
  if (connection) {
    connection.removeEventListener('open', onOpen);
    connection.removeEventListener('close', onClose);
    connection.removeEventListener('message', onMessage);
  }
}

/**
 * Close the current connection if it exists and then establishes a new
 * connection.
 */
function reconnect() {
  if (connection) {
    connection = null;
  }
  connect();
}

function reloadPage() {
  if (RSBUILD_DEV_LIVE_RELOAD) {
    window.location.reload();
  }
}

connect();
