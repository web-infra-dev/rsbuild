import readline from 'node:readline';
import { color, isTTY } from '../helpers';
import { logger } from '../logger';
import type { CliShortcut, NormalizedDevConfig } from '../types/config';
import { onBeforeRestartServer } from './restart';

export const isCliShortcutsEnabled = (
  devConfig: NormalizedDevConfig,
): boolean => devConfig.cliShortcuts && isTTY('stdin');

export function setupCliShortcuts({
  help = true,
  openPage,
  closeServer,
  printUrls,
  restartServer,
  customShortcuts,
}: {
  help?: boolean;
  openPage: () => Promise<void>;
  closeServer: () => Promise<void>;
  printUrls: () => void;
  restartServer?: () => Promise<void>;
  customShortcuts?: (shortcuts: CliShortcut[]) => CliShortcut[];
}): void {
  let shortcuts = [
    {
      key: 'c',
      description: `${color.bold('c + enter')}  ${color.dim('clear console')}`,
      action: () => {
        console.clear();
      },
    },
    {
      key: 'o',
      description: `${color.bold('o + enter')}  ${color.dim('open in browser')}`,
      action: openPage,
    },
    {
      key: 'q',
      description: `${color.bold('q + enter')}  ${color.dim('quit process')}`,
      action: async () => {
        try {
          await closeServer();
        } finally {
          process.exit(0);
        }
      },
    },
    restartServer
      ? {
          key: 'r',
          description: `${color.bold('r + enter')}  ${color.dim('restart server')}`,
          action: restartServer,
        }
      : null,
    {
      key: 'u',
      description: `${color.bold('u + enter')}  ${color.dim('show urls')}`,
      action: printUrls,
    },
  ].filter(Boolean) as CliShortcut[];

  if (customShortcuts) {
    shortcuts = customShortcuts(shortcuts);

    if (!Array.isArray(shortcuts)) {
      throw new Error('`dev.cliShortcuts` must return an array of shortcuts.');
    }
  }

  if (help) {
    logger.log(
      `  ➜ ${color.dim('press')} ${color.bold('h + enter')} ${color.dim('to show shortcuts')}\n`,
    );
  }

  const rl = readline.createInterface({
    input: process.stdin,
  });

  rl.on('line', (input) => {
    if (input === 'h') {
      let message = `\n  ${color.bold(color.blue('Shortcuts:'))}\n`;
      for (const shortcut of shortcuts) {
        message += `  ${shortcut.description}\n`;
      }
      logger.log(message);
    }

    for (const shortcut of shortcuts) {
      if (input === shortcut.key) {
        shortcut.action();
        return;
      }
    }
  });

  onBeforeRestartServer(() => {
    rl.close();
  });
}
