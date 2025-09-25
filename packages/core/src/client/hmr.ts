import type {
  ClientMessage,
  ClientMessageRuntimeError,
  SocketMessage,
} from '../server/socketServer';
import type { NormalizedClientConfig } from '../types';

const config: NormalizedClientConfig = RSBUILD_CLIENT_CONFIG;
const serverHost = RSBUILD_SERVER_HOST;
const serverPort = RSBUILD_SERVER_PORT;

function formatURL(fallback?: boolean) {
  const { location } = self;
  const hostname = (fallback ? serverHost : config.host) || location.hostname;
  const port = (fallback ? serverPort : config.port) || location.port;
  const protocol =
    config.protocol || (location.protocol === 'https:' ? 'wss' : 'ws');
  const pathname = config.path;

  if (typeof URL !== 'undefined') {
    const url = new URL('http://localhost');
    url.port = String(port);
    url.hostname = hostname;
    url.protocol = protocol;
    url.pathname = pathname;
    url.searchParams.append('token', RSBUILD_WEB_SOCKET_TOKEN);
    return url.toString();
  }

  // compatible with IE11
  const colon = protocol.indexOf(':') === -1 ? ':' : '';
  return `${protocol}${colon}//${hostname}:${port}${pathname}?token=${RSBUILD_WEB_SOCKET_TOKEN}`;
}

// Remember some state related to hot module replacement.
let lastCompilationHash: string | undefined;
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
  hasCompileErrors = false;
  tryApplyUpdates();
}

// Compilation with warnings (e.g. ESLint).
function handleWarnings({ text }: { text: string[] }) {
  clearOutdatedErrors();

  hasCompileErrors = false;

  for (let i = 0; i < text.length; i++) {
    if (i === 5) {
      console.warn(
        '[rsbuild] Additional warnings detected. View complete log in terminal for details.',
      );
      break;
    }
    console.warn(text[i]);
  }

  tryApplyUpdates();
}

// Compilation with errors (e.g. syntax error or missing modules).
function handleErrors({ text, html }: { text: string[]; html: string }) {
  clearOutdatedErrors();

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

const handleApplyUpdates = (
  err: unknown,
  updatedModules: (string | number)[] | null,
) => {
  const forcedReload = err || !updatedModules;
  if (forcedReload) {
    if (err) {
      console.error(
        '[rsbuild] HMR update failed, performing full reload: ',
        err,
      );
    }
    reloadPage();
    return;
  }

  // While we were updating, there was a new update! Do it again.
  tryApplyUpdates();
};

// Attempt to update code on the fly, fall back to a hard reload.
function tryApplyUpdates() {
  // detect is there a newer version of this code available
  if (!isUpdateAvailable()) {
    return;
  }

  if (import.meta.webpackHot) {
    // Rspack disallows updates in other states.
    if (import.meta.webpackHot.status() !== 'idle') {
      return;
    }

    // https://rspack.rs/api/runtime-api/module-variables#importmetawebpackhot
    import.meta.webpackHot.check(true).then(
      (updatedModules) => {
        handleApplyUpdates(null, updatedModules);
      },
      (err: unknown) => {
        handleApplyUpdates(err, null);
      },
    );
    return;
  }

  // HotModuleReplacementPlugin is not registered in Rspack configuration
  // fallback to reload page
  reloadPage();
}

let socket: WebSocket | null = null;
let reconnectCount = 0;
let pingIntervalId: ReturnType<typeof setInterval>;

const isSocketReady = () => socket && socket.readyState === socket.OPEN;
const socketSend = (data: ClientMessage) => {
  if (isSocketReady()) {
    socket!.send(JSON.stringify(data));
  }
};

function onOpen() {
  // Notify users that the WebSocket has successfully connected.
  console.info('[rsbuild] WebSocket connected.');

  // Reset reconnect count
  reconnectCount = 0;

  // To prevent WebSocket timeouts caused by proxies (e.g., nginx, docker),
  // send a periodic ping message to keep the connection alive.
  pingIntervalId = setInterval(() => {
    socketSend({ type: 'ping' });
  }, 30000);

  if (errorMessages.length) {
    errorMessages.forEach((message) => {
      socketSend(message);
    });
    errorMessages.length = 0;
  }
}

function onMessage(e: MessageEvent<string>) {
  const message: SocketMessage = JSON.parse(e.data);

  switch (message.type) {
    case 'hash':
      // Update the last compilation hash
      lastCompilationHash = message.data;

      if (clearOverlay && isUpdateAvailable()) {
        clearOverlay();
      }
      break;
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
      console.warn(
        '[rsbuild] WebSocket connection failed after maximum retry attempts.',
      );
    }
    return;
  }

  if (reconnectCount === 0) {
    console.info('[rsbuild] WebSocket connection lost. Reconnecting...');
  }
  removeListeners();
  socket = null;
  reconnectCount++;
  setTimeout(connect, 1000 * 1.5 ** reconnectCount);
}

function onSocketError() {
  if (formatURL() !== formatURL(true)) {
    console.error(
      '[rsbuild] WebSocket connection failed. Trying direct connection fallback.',
    );
    removeListeners();
    socket = null;
    connect(true);
  }
}

const errorMessages: ClientMessageRuntimeError[] = [];

function onRuntimeError(event: ErrorEvent) {
  const message: ClientMessageRuntimeError = {
    type: 'runtime-error',
    message: event.message,
  };
  if (isSocketReady()) {
    socketSend(message);
  } else {
    errorMessages.push(message);
  }
}

// Establishing a WebSocket connection with the server.
function connect(fallback = false) {
  if (reconnectCount === 0) {
    console.info('[rsbuild] WebSocket connecting...');
  }

  const socketUrl = formatURL(fallback);
  socket = new WebSocket(socketUrl);
  socket.addEventListener('open', onOpen);
  // Attempt to reconnect after disconnection
  socket.addEventListener('close', onClose);
  // Handle messages from the server.
  socket.addEventListener('message', onMessage);
  // Handle errors
  if (!fallback) {
    socket.addEventListener('error', onSocketError);
  }
}

function removeListeners() {
  clearInterval(pingIntervalId);
  if (socket) {
    socket.removeEventListener('open', onOpen);
    socket.removeEventListener('close', onClose);
    socket.removeEventListener('message', onMessage);
    socket.removeEventListener('error', onSocketError);
  }
}

function reloadPage() {
  if (RSBUILD_DEV_LIVE_RELOAD) {
    window.location.reload();
  }
}

if (RSBUILD_DEV_BROWSER_LOGS && typeof window !== 'undefined') {
  window.addEventListener('error', onRuntimeError);
}

connect();
