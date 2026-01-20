import type {
  ClientMessage,
  ClientMessageError,
  ServerMessage,
  ServerMessageErrors,
  ServerMessageResolvedClientError,
} from '../server/socketServer';
import type { LogLevel, NormalizedClientConfig } from '../types';
import { logger } from './log';

let createOverlay: undefined | ((title: string, content: string) => void);
let clearOverlay: undefined | (() => void);

type CustomListenersMap = Map<string, ((data: any) => void)[]>;

// Install a patched `module.hot.on` that records per-module listeners and
// removes them from the global map when the module is disposed.
function setupCustomHMRListeners(customListenersMap: CustomListenersMap): void {
  // @ts-expect-error
  RSPACK_INTERCEPT_MODULE_EXECUTION.push((options: any) => {
    const module = options.module as {
      hot: {
        on: (event: string, cb: (payload: any) => void) => void;
        dispose: (cb: () => void) => void;
      };
    };

    const newListeners: CustomListenersMap = new Map();

    const addToMap = (
      map: CustomListenersMap,
      event: string,
      cb: (payload: any) => void,
    ) => {
      const existing = map.get(event) ?? [];
      existing.push(cb);
      map.set(event, existing);
    };

    module.hot.on = (event: string, cb: (payload: any) => void) => {
      addToMap(customListenersMap, event, cb);
      addToMap(newListeners, event, cb);
    };

    module.hot.dispose(() => {
      for (const [event, staleFns] of newListeners) {
        const listeners = customListenersMap.get(event);
        if (!listeners) continue;

        customListenersMap.set(
          event,
          listeners.filter((l) => !staleFns.includes(l)),
        );
      }
    });
  });
}

export const registerOverlay = (
  createFn: (title: string, content: string) => void,
  clearFn: () => void,
): void => {
  createOverlay = createFn;
  clearOverlay = clearFn;
};

export function init(
  token: string,
  config: NormalizedClientConfig,
  serverHost: string,
  serverPort: number,
  liveReload: boolean,
  browserLogs: boolean,
  logLevel: LogLevel,
): void {
  logger.level = logLevel;

  const queuedMessages: ClientMessage[] = [];
  // Ids of the runtime errors sent to the server
  const clientErrors: { id: string; message?: string }[] = [];

  const customListenersMap: CustomListenersMap = new Map();

  // Hash of the last successful build
  let lastHash: string | undefined;
  let hasBuildErrors = false;

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
      url.searchParams.append('token', token);
      return url.toString();
    }

    // compatible with IE11
    const colon = protocol.indexOf(':') === -1 ? ':' : '';
    return `${protocol}${colon}//${hostname}:${port}${pathname}?token=${token}`;
  }

  function clearBuildErrors() {
    // Clean up outdated compile errors
    if (console.clear && hasBuildErrors) {
      console.clear();
    }
    hasBuildErrors = false;
  }

  // Successful compilation.
  function handleSuccess() {
    clearBuildErrors();
    tryApplyUpdates();
  }

  // Compilation with warnings (e.g. ESLint).
  function handleWarnings({ text }: { text: string[] }) {
    clearBuildErrors();

    for (let i = 0; i < text.length; i++) {
      if (i === 5) {
        logger.warn(
          '[rsbuild] Additional warnings detected. View complete log in terminal for details.',
        );
        break;
      }
      logger.warn(text[i]);
    }

    tryApplyUpdates();
  }

  // Compilation with errors (e.g. syntax error or missing modules).
  function handleErrors({ text, html }: ServerMessageErrors['data']) {
    clearBuildErrors();
    hasBuildErrors = true;

    // Also log them to the console.
    for (const error of text) {
      logger.error(error);
    }

    if (createOverlay) {
      createOverlay('Build failed', html);
    }
  }

  function handleResolvedClientError({
    id,
    message,
  }: ServerMessageResolvedClientError['data']): void {
    // If build failed, do not render client errors on overlay
    if (!createOverlay || hasBuildErrors) {
      return;
    }

    for (const item of clientErrors) {
      if (item.id === id) {
        item.message = message;
      }
    }

    createOverlay(
      'Runtime errors',
      clientErrors
        .map((item) => item.message)
        .filter(Boolean)
        .join('\n\n'),
    );
  }

  // __webpack_hash__ is the hash of the current compilation.
  // It's a global variable injected by Rspack.
  const shouldUpdate = () => lastHash !== BUILD_HASH;

  const handleApplyUpdates = (
    err: unknown,
    updatedModules: (string | number)[] | null,
  ) => {
    const forcedReload = err || !updatedModules;
    if (forcedReload) {
      if (err) {
        logger.error(
          '[rsbuild] HMR update failed, performing full reload:',
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
    if (!shouldUpdate()) {
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
    logger.info('[rsbuild] WebSocket connected.');

    // Reset reconnect count
    reconnectCount = 0;

    // To prevent WebSocket timeouts caused by proxies (e.g., nginx, docker),
    // send a periodic ping message to keep the connection alive.
    pingIntervalId = setInterval(() => {
      socketSend({ type: 'ping' });
    }, 30000);

    if (queuedMessages.length) {
      queuedMessages.forEach(socketSend);
      queuedMessages.length = 0;
    }
  }

  function onMessage(e: MessageEvent<string>) {
    const message: ServerMessage = JSON.parse(e.data);

    switch (message.type) {
      case 'hash':
        // Update the last compilation hash
        lastHash = message.data;

        if (clearOverlay && shouldUpdate()) {
          clearOverlay();
        }
        break;
      case 'ok':
        handleSuccess();
        break;
      // Triggered when static files changed
      case 'static-changed':
        reloadPage();
        break;
      case 'warnings':
        handleWarnings(message.data);
        break;
      case 'errors':
        handleErrors(message.data);
        break;
      case 'resolved-client-error':
        handleResolvedClientError(message.data);
        break;
      case 'custom': {
        const { event, ...rest } = message.data;
        if (event) {
          const cbs = customListenersMap.get(event);
          if (cbs) {
            cbs.forEach((cb) => {
              cb(rest);
            });
          }
        }
        break;
      }
    }
  }

  function onClose() {
    if (reconnectCount >= config.reconnect) {
      if (config.reconnect > 0) {
        logger.warn(
          '[rsbuild] WebSocket connection failed after maximum retry attempts.',
        );
      }
      return;
    }

    if (reconnectCount === 0) {
      logger.info('[rsbuild] WebSocket connection lost. Reconnecting...');
    }
    removeListeners();
    socket = null;
    reconnectCount++;
    setTimeout(connect, 1000 * 1.5 ** reconnectCount);
  }

  function onSocketError() {
    if (formatURL() !== formatURL(true)) {
      logger.error(
        '[rsbuild] WebSocket connection failed. Trying direct connection fallback.',
      );
      removeListeners();
      socket = null;
      connect(true);
    }
  }

  function sendError(message: string, stack?: string) {
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
    const messageInfo: ClientMessageError = {
      type: 'client-error',
      id,
      message,
      stack,
    };

    clientErrors.push({ id });

    if (isSocketReady()) {
      socketSend(messageInfo);
    } else {
      queuedMessages.push(messageInfo);
    }
  }

  function onUnhandledRejection({ reason }: PromiseRejectionEvent) {
    let message: string;
    let stack: string | undefined;

    if (reason instanceof Error) {
      message = reason.name
        ? `${reason.name}: ${reason.message}`
        : reason.message;
      stack = reason.stack;
    } else if (typeof reason === 'string') {
      message = reason;
    } else {
      try {
        message = JSON.stringify(reason);
      } catch (_) {
        return;
      }
    }

    sendError(`Uncaught (in promise) ${message}`, stack);
  }

  // Establishing a WebSocket connection with the server.
  function connect(fallback = false) {
    if (reconnectCount === 0) {
      logger.info('[rsbuild] WebSocket connecting...');
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
    if (liveReload) {
      window.location.reload();
    }
  }

  if (browserLogs && typeof window !== 'undefined') {
    window.addEventListener('error', ({ message, error }) => {
      sendError(message, error instanceof Error ? error.stack : undefined);
    });
    window.addEventListener('unhandledrejection', onUnhandledRejection);
  }

  // @ts-expect-error
  if (RSPACK_MODULE_HOT) {
    setupCustomHMRListeners(customListenersMap);
  }

  connect();
}
