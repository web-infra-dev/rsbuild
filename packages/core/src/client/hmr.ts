import type { NormalizedClientConfig } from '../types';

const compilationId = RSBUILD_COMPILATION_NAME;
const config: NormalizedClientConfig = RSBUILD_CLIENT_CONFIG;
const resolvedConfig: NormalizedClientConfig = RSBUILD_RESOLVED_CLIENT_CONFIG;

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
    url.searchParams.append('compilationId', compilationId);
    return url.toString();
  }

  // compatible with IE11
  const colon = protocol.indexOf(':') === -1 ? ':' : '';
  return `${protocol}${colon}//${hostname}:${port}${pathname}`;
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

let createOverlay: undefined | ((html: string) => void);
let clearOverlay: undefined | (() => void);

export const registerOverlay = (
  createFn: (html: string) => void,
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
function handleWarnings({ text }: { text: string[] }) {
  clearOutdatedErrors();

  const isHotUpdate = !isFirstCompilation;
  isFirstCompilation = false;
  hasCompileErrors = false;

  for (let i = 0; i < text.length; i++) {
    if (i === 5) {
      console.warn(
        'There were more warnings in other files, you can find a complete log in the terminal.',
      );
      break;
    }
    console.warn(text[i]);
  }

  // Attempt to apply hot updates or reload.
  if (isHotUpdate) {
    tryApplyUpdates();
  }
}

// Compilation with errors (e.g. syntax error or missing modules).
function handleErrors({ text, html }: { text: string[]; html: string }) {
  clearOutdatedErrors();

  isFirstCompilation = false;
  hasCompileErrors = true;

  // Also log them to the console.
  for (const error of text) {
    console.error(error);
  }

  if (createOverlay) {
    createOverlay(html);
  }
}

// __webpack_hash__ is the hash of the current compilation.
// It's a global variable injected by Rspack.
const isUpdateAvailable = () => lastCompilationHash !== WEBPACK_HASH;

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

  // Rspack disallows updates in other states.
  if (import.meta.webpackHot.status() !== 'idle') {
    return;
  }

  const handleApplyUpdates = (
    err: unknown,
    updatedModules: (string | number)[] | null,
  ) => {
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
  };

  // https://rspack.dev/api/runtime-api/module-variables#importmetawebpackhot
  import.meta.webpackHot.check(true).then(
    (updatedModules) => handleApplyUpdates(null, updatedModules),
    (err) => handleApplyUpdates(err, null),
  );
}

let connection: WebSocket | null = null;
let reconnectCount = 0;

function onOpen() {
  // Notify users that the HMR has successfully connected.
  console.info('[HMR] connected.');
}

function onMessage(e: MessageEvent<string>) {
  const message = JSON.parse(e.data);

  if (message.compilationId && message.compilationId !== compilationId) {
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

function onClose() {
  if (reconnectCount >= config.reconnect) {
    if (config.reconnect > 0) {
      console.info(
        '[HMR] Connection failure after maximum reconnect limit exceeded.',
      );
    }
    return;
  }

  console.info('[HMR] disconnected. Attempting to reconnect.');
  removeListeners();
  connection = null;
  reconnectCount++;
  setTimeout(connect, 1000 * 1.5 ** reconnectCount);
}

function onError() {
  if (!config.port) {
    console.error(
      '[HMR] WebSocket connection error, attempting direct fallback',
    );
    removeListeners();
    connection = null;
    connect(true);
  }
}

// Establishing a WebSocket connection with the server.
function connect(fallback = false) {
  const { location } = self;
  const { host, port, path, protocol } = fallback ? resolvedConfig : config;
  const socketUrl = formatURL({
    protocol: protocol || (location.protocol === 'https:' ? 'wss' : 'ws'),
    hostname: host || location.hostname,
    port: port || location.port,
    pathname: path || '/rsbuild-hmr',
  });

  connection = new WebSocket(socketUrl);
  connection.addEventListener('open', onOpen);
  // Attempt to reconnect after disconnection
  connection.addEventListener('close', onClose);
  // Handle messages from the server.
  connection.addEventListener('message', onMessage);
  // Handle errors
  if (!fallback) {
    connection.addEventListener('error', onError);
  }
}

function removeListeners() {
  if (connection) {
    connection.removeEventListener('open', onOpen);
    connection.removeEventListener('close', onClose);
    connection.removeEventListener('message', onMessage);
    connection.removeEventListener('error', onError);
  }
}

function reloadPage() {
  if (RSBUILD_DEV_LIVE_RELOAD) {
    window.location.reload();
  }
}

connect();
