import readline from 'node:readline';
import color from 'picocolors';
import { logger } from '../logger';
import type { NormalizedDevConfig } from '../types/config';
import { onBeforeRestartServer } from './restart';

export type CliShortcut = {
  key: string;
  description: string;
  action: () => void | Promise<void>;
};

export const isCliShortcutsEnabled = (
  devConfig: NormalizedDevConfig,
): boolean => devConfig.cliShortcuts && process.stdin.isTTY && !process.env.CI;

export function setupCliShortcuts({
  openPage,
  closeServer,
  printUrls,
}: {
  openPage: () => Promise<void>;
  closeServer: () => Promise<void>;
  printUrls: () => void;
}): void {
  const shortcuts: CliShortcut[] = [
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
    {
      key: 'u',
      description: `${color.bold('u + enter')}  ${color.dim('show urls')}`,
      action: printUrls,
    },
  ];

  logger.log(
    `  ➜ ${color.dim('press')} ${color.bold('h + enter')} ${color.dim('to show shortcuts')}\n`,
  );

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
