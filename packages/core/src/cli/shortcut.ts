/**
 * The following code is modified based on
 * https://github.com/vitejs/vite/blob/720447ee725046323387f661341d44e2ad390f41/packages/vite/src/node/shortcuts.ts
 *
 * MIT Licensed
 * Yuxi (Evan) You @yyx990803
 * Copyright (c) Yuxi (Evan) You and Vite contributor
 * https://github.com/vitejs/vite/blob/main/LICENSE
 */

import readline from 'node:readline';
import colors from 'picocolors';
import { openBrowser } from 'src/plugins/open';
import { isDev } from '../helpers';
import { Logger, logger } from '../logger';
import { RsbuildServer } from './server';

export type BindCLIShortcutsOptions<
  Server extends RsbuildServer = RsbuildServer,
> = {
  /**
   * Print a one-line shortcuts "help" hint to the terminal
   */
  print?: boolean;
  /**
   * Custom shortcuts to run when a key is pressed. These shortcuts take priority
   * over the default shortcuts if they have the same keys (except the `h` key).
   * To disable a default shortcut, define the same key but with `action: undefined`.
   */
  customShortcuts?: CLIShortcut<Server>[];
};

export type CLIShortcut<Server extends RsbuildServer = RsbuildServer> = {
  key: string;
  description: string;
  action?(server: Server): void | Promise<void>;
};

export function bindCLIShortcuts<Server extends RsbuildServer>(
  server: Server,
  opts?: BindCLIShortcutsOptions<Server>,
): void {
  if (!server._rsbuildInstance || !process.stdin.isTTY || process.env.CI) {
    return;
  }

  if (isDev()) {
    server._shortcutsOptions = opts as BindCLIShortcutsOptions<RsbuildServer>;
  }

  if (opts?.print) {
    logger.info(
      colors.dim(colors.green('  ➜')) +
        colors.dim('  press ') +
        colors.bold('h + enter') +
        colors.dim(' to show help'),
    );
  }

  const shortcuts = (opts?.customShortcuts ?? []).concat(
    (isDev()
      ? BASE_DEV_SHORTCUTS
      : BASE_PREVIEW_SHORTCUTS) as CLIShortcut<Server>[],
  );

  let actionRunning = false;

  const onInput = async (input: string) => {
    if (actionRunning) return;

    if (input === 'h') {
      const loggedKeys = new Set<string>();
      logger.info('\n  Shortcuts');

      for (const shortcut of shortcuts) {
        if (loggedKeys.has(shortcut.key)) continue;
        loggedKeys.add(shortcut.key);

        if (shortcut.action == null) continue;

        logger.info(
          colors.dim('  press ') +
            colors.bold(`${shortcut.key} + enter`) +
            colors.dim(` to ${shortcut.description}`),
        );
      }

      return;
    }

    const shortcut = shortcuts.find((shortcut) => shortcut.key === input);
    if (!shortcut || shortcut.action == null) return;

    actionRunning = true;
    await shortcut.action(server);
    actionRunning = false;
  };

  const rl = readline.createInterface({ input: process.stdin });
  rl.on('line', onInput);
  server._rsbuildInstance.onExit(rl.close);
}

/**
 * This method is modified based on source found in
 * https://github.com/vitejs/vite/blob/720447ee725046323387f661341d44e2ad390f41/packages/vite/src/node/logger.ts
 *
 * MIT Licensed
 * Copyright (c) Yuxi (Evan) You and Vite contributor
 * https://github.com/vitejs/vite/blob/main/LICENSE
 */
function clearScreen() {
  const repeatCount = process.stdout.rows - 2;
  const blank = repeatCount > 0 ? '\n'.repeat(repeatCount) : '';
  console.log(blank);
  readline.cursorTo(process.stdout, 0, 0);
  readline.clearScreenDown(process.stdout);
}

/**
 * This method is modified based on source found in
 * https://github.com/vitejs/vite/blob/720447ee725046323387f661341d44e2ad390f41/packages/vite/src/node/logger.ts
 *
 * MIT Licensed
 * Copyright (c) Yuxi (Evan) You and Vite contributor
 * https://github.com/vitejs/vite/blob/main/LICENSE
 */
export function printServerUrls(urls: string[], info: Logger['info']): void {
  const colorUrl = (url: string) =>
    colors.cyan(url.replace(/:(\d+)\//, (_, port) => `:${colors.bold(port)}/`));
  for (const url of urls) {
    info(`  ${colors.green('➜')}  ${colors.bold('Local')}:   ${colorUrl(url)}`);
  }
}

const BASE_DEV_SHORTCUTS: CLIShortcut<RsbuildServer>[] = [
  {
    key: 'r',
    description: 'restart the server',
    async action(server) {
      await server.restartServer();
    },
  },
  {
    key: 'u',
    description: 'show server url',
    action(server) {
      logger.info('');
      printServerUrls(server._startServerResult?.urls ?? [], logger.info);
    },
  },
  {
    key: 'o',
    description: 'open in browser',
    action(server) {
      const url = server._startServerResult?.urls[0];
      if (url) {
        openBrowser(url);
      } else {
        logger.warn('No URL available to open in browser');
      }
    },
  },
  {
    key: 'c',
    description: 'clear console',
    action(_server) {
      clearScreen();
    },
  },
  {
    key: 'q',
    description: 'quit',
    async action(server) {
      try {
        await server._startServerResult?.server.close();
      } finally {
        process.exit();
      }
    },
  },
];

const BASE_PREVIEW_SHORTCUTS: CLIShortcut<RsbuildServer>[] = [
  {
    key: 'o',
    description: 'open in browser',
    action(server) {
      const url = server._startServerResult?.urls[0];
      if (url) {
        openBrowser(url);
      } else {
        logger.warn('No URL available to open in browser');
      }
    },
  },
  {
    key: 'q',
    description: 'quit',
    async action(server) {
      try {
        await server._startServerResult?.server.close();
      } finally {
        process.exit();
      }
    },
  },
];
