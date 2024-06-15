import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { type Routes, castArray, debug, logger } from '@rsbuild/shared';
import { STATIC_PATH } from '../constants';
import { canParse } from '../helpers';
import type { NormalizedConfig, RsbuildPlugin } from '../types';

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
export async function openBrowser(url: string): Promise<boolean> {
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
      debug('Failed to find the target browser.');
    } catch (err) {
      debug('Failed to open start URL with apple script.');
      logger.debug(err);
    }
  }

  // Fallback to open
  // (It will always open new tab)
  try {
    const { default: open } = await import('open');
    await open(url);
    return true;
  } catch (err) {
    logger.error('Failed to open start URL.');
    logger.error(err);
    return false;
  }
}

export const replacePlaceholder = (url: string, port: number) =>
  url.replace(/<port>/g, String(port));

export function resolveUrl(str: string, base: string) {
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

const openedURLs: string[] = [];

const normalizeOpenConfig = (
  config: NormalizedConfig,
): { targets?: string[]; before?: () => Promise<void> | void } => {
  const open = config.server.open || config.dev.startUrl;
  const { beforeStartUrl } = config.dev;

  if (open === false) {
    return {};
  }
  if (open === true) {
    return { targets: [], before: beforeStartUrl };
  }
  if (typeof open === 'string') {
    return { targets: [open], before: beforeStartUrl };
  }
  if (Array.isArray(open)) {
    return { targets: open, before: beforeStartUrl };
  }

  return {
    targets: open.target ? castArray(open.target) : [],
    before: open.before,
  };
};

export function pluginOpen(): RsbuildPlugin {
  return {
    name: 'rsbuild:open',
    setup(api) {
      const onStartServer = async (params: {
        port: number;
        routes: Routes;
      }) => {
        const { port, routes } = params;
        const config = api.getNormalizedConfig();
        const { https } = api.context.devServer || {};
        const { targets, before } = normalizeOpenConfig(config);

        // Skip open in codesandbox. After being bundled, the `open` package will
        // try to call system xdg-open, which will cause an error on codesandbox.
        // https://github.com/codesandbox/codesandbox-client/issues/6642
        const isCodesandbox = process.env.CSB === 'true';
        const shouldOpen = targets !== undefined && !isCodesandbox;

        if (!shouldOpen) {
          return;
        }

        const urls: string[] = [];
        const protocol = https ? 'https' : 'http';
        const baseUrl = `${protocol}://localhost:${port}`;

        if (!targets.length) {
          if (routes.length) {
            // auto open the first one
            urls.push(`${baseUrl}${routes[0].pathname}`);
          }
        } else {
          urls.push(
            ...targets.map((target) =>
              resolveUrl(replacePlaceholder(target, port), baseUrl),
            ),
          );
        }

        const openUrls = () => {
          for (const url of urls) {
            /**
             * If a URL has been opened in current process, we will not open it again.
             * It can prevent opening the same URL multiple times.
             */
            if (!openedURLs.includes(url)) {
              openBrowser(url);
              openedURLs.push(url);
            }
          }
        };

        if (before) {
          await before();
        }
        openUrls();
      };

      api.onAfterStartDevServer(onStartServer);
      api.onAfterStartProdServer(onStartServer);
    },
  };
}
