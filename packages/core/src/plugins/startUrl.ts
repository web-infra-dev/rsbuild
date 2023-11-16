import { join } from 'path';
import {
  logger,
  castArray,
  type DefaultRsbuildPlugin,
  normalizeUrl,
} from '@rsbuild/shared';
import { exec } from 'child_process';
import { promisify } from 'util';

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
            cwd: join(__dirname, '../../static'),
          },
        );

        return true;
      }
      return false;
    } catch (err) {
      logger.error('Failed to open start URL with apple script.');
      logger.error(err);
      return false;
    }
  }

  // Fallback to open
  // (It will always open new tab)
  try {
    const { default: open } = await import('../../compiled/open');
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

const openedURLs: string[] = [];

export function pluginStartUrl(): DefaultRsbuildPlugin {
  return {
    name: 'plugin-start-url',
    setup(api) {
      api.onAfterStartDevServer(async (params) => {
        const { port, routes } = params;
        const config = api.getNormalizedConfig();
        const { startUrl, beforeStartUrl } = config.dev;
        const { open, https } = api.context.devServer || {};
        const shouldOpen = Boolean(startUrl) || open;

        if (!shouldOpen) {
          return;
        }

        const urls: string[] = [];

        if (startUrl === true || !startUrl) {
          const protocol = https ? 'https' : 'http';
          if (routes.length) {
            // auto open the first one
            urls.push(
              normalizeUrl(
                `${protocol}://localhost:${port}/${routes[0].route}`,
              ),
            );
          }
        } else {
          urls.push(
            ...castArray(startUrl).map((item) =>
              replacePlaceholder(item, port),
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

        if (beforeStartUrl) {
          Promise.all(castArray(beforeStartUrl).map((fn) => fn())).then(
            openUrls,
          );
        } else {
          openUrls();
        }
      });
    },
  };
}
