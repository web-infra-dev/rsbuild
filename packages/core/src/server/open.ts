import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { STATIC_PATH } from '../constants';
import { canParse, castArray } from '../helpers';
import { logger } from '../logger';
import type { NormalizedConfig, Routes } from '../types';
import { getHostInUrl } from './helper';

const execAsync = promisify(exec);

const supportedChromiumBrowsers = [
  'Google Chrome Canary',
  'Google Chrome Dev',
  'Google Chrome Beta',
  'Google Chrome',
  'Microsoft Edge',
  'Brave Browser',
  'Vivaldi',
  'Chromium',
];

const getTargetBrowser = async () => {
  // Use user setting first
  let targetBrowser = process.env.BROWSER;
  // If user setting not found or not support, use opening browser first
  if (!targetBrowser || !supportedChromiumBrowsers.includes(targetBrowser)) {
    const { stdout: ps } = await execAsync('ps cax');
    targetBrowser = supportedChromiumBrowsers.find((b) => ps.includes(b));
  }
  return targetBrowser;
};

/**
 * This method is modified based on source found in
 * https://github.com/facebook/create-react-app
 *
 * MIT Licensed
 * Copyright (c) 2015-present, Facebook, Inc.
 * https://github.com/facebook/create-react-app/blob/master/LICENSE
 */
async function openBrowser(url: string): Promise<boolean> {
  // If we're on OS X, the user hasn't specifically
  // requested a different browser, we can try opening
  // a Chromium browser with AppleScript. This lets us reuse an
  // existing tab when possible instead of creating a new one.
  const shouldTryOpenChromeWithAppleScript = process.platform === 'darwin';

  if (shouldTryOpenChromeWithAppleScript) {
    try {
      const targetBrowser = await getTargetBrowser();
      if (targetBrowser) {
        // Try to reuse existing tab with AppleScript
        await execAsync(
          `osascript openChrome.applescript "${encodeURI(
            url,
          )}" "${targetBrowser}"`,
          {
            cwd: STATIC_PATH,
          },
        );

        return true;
      }
      logger.debug('failed to find the target browser.');
    } catch (err) {
      logger.debug('failed to open start URL with apple script.');
      logger.debug(err);
    }
  }

  // Fallback to open
  // (It will always open new tab)
  try {
    const { default: open } = await import('../../compiled/open/index.js');
    await open(url);
    return true;
  } catch (err) {
    logger.error('Failed to open start URL.');
    logger.error(err);
    return false;
  }
}

let openedURLs: string[] = [];

const clearOpenedURLs = () => {
  openedURLs = [];
};

export const replacePortPlaceholder = (url: string, port: number): string =>
  url.replace(/<port>/g, String(port));

export function resolveUrl(str: string, base: string): string {
  if (canParse(str)) {
    return str;
  }

  try {
    const url = new URL(str, base);
    return url.href;
  } catch (e) {
    throw new Error(
      '[rsbuild:open]: Invalid input: not a valid URL or pathname',
    );
  }
}

const normalizeOpenConfig = (
  config: NormalizedConfig,
): { targets: string[]; before?: () => Promise<void> | void } => {
  const { open } = config.server;

  if (typeof open === 'boolean') {
    return { targets: [] };
  }
  if (typeof open === 'string') {
    return { targets: [open] };
  }
  if (Array.isArray(open)) {
    return { targets: open };
  }

  return {
    targets: open.target ? castArray(open.target) : [],
    before: open.before,
  };
};

export async function open({
  https,
  port,
  routes,
  config,
  clearCache,
}: {
  https?: boolean;
  port: number;
  routes: Routes;
  config: NormalizedConfig;
  clearCache?: boolean;
}): Promise<void> {
  const { targets, before } = normalizeOpenConfig(config);

  // Skip open in codesandbox. After being bundled, the `open` package will
  // try to call system xdg-open, which will cause an error on codesandbox.
  // https://github.com/codesandbox/codesandbox-client/issues/6642
  const isCodesandbox = process.env.CSB === 'true';
  if (isCodesandbox) {
    return;
  }

  if (clearCache) {
    clearOpenedURLs();
  }

  const urls: string[] = [];
  const protocol = https ? 'https' : 'http';
  const host = getHostInUrl(config.server.host);
  const baseUrl = `${protocol}://${host}:${port}`;

  if (!targets.length) {
    if (routes.length) {
      // auto open the first one
      urls.push(`${baseUrl}${routes[0].pathname}`);
    }
  } else {
    urls.push(
      ...targets.map((target) =>
        resolveUrl(replacePortPlaceholder(target, port), baseUrl),
      ),
    );
  }

  if (before) {
    await before();
  }

  for (const url of urls) {
    /**
     * If an URL has been opened in current process, we will not open it again.
     * It can prevent opening the same URL multiple times.
     */
    if (!openedURLs.includes(url)) {
      openBrowser(url);
      openedURLs.push(url);
    }
  }
}
