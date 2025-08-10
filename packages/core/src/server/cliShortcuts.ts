import { color, isTTY } from '../helpers';
import { logger } from '../logger';
import type { CliShortcut, NormalizedConfig } from '../types/config';

export const isCliShortcutsEnabled = (config: NormalizedConfig): boolean =>
  config.dev.cliShortcuts && isTTY('stdin');

export async function setupCliShortcuts({
  help = true,
  openPage,
  closeServer,
  printUrls,
  restartServer,
  customShortcuts,
}: {
  help?: boolean | string;
  openPage: () => Promise<void>;
  closeServer: () => Promise<void>;
  printUrls: () => void;
  restartServer?: () => Promise<boolean>;
  customShortcuts?: (shortcuts: CliShortcut[]) => CliShortcut[];
}): Promise<() => void> {
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
      throw new Error(
        `${color.dim('[rsbuild:config]')} ${color.yellow(
          'dev.cliShortcuts',
        )} option must return an array of shortcuts.`,
      );
    }
  }

  if (help) {
    logger.log(
      help === true
        ? `  ➜  ${color.dim('press')} ${color.bold('h + enter')} ${color.dim('to show shortcuts')}\n`
        : `  ➜  ${help}\n`,
    );
  }

  const { createInterface } = await import('node:readline');
  const rl = createInterface({
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

  return () => {
    rl.close();
  };
}
