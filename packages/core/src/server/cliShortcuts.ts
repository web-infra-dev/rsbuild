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

export function setupCliShortcuts(shortcuts: CliShortcut[]): void {
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
