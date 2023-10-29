import _ from 'lodash';
import { join } from 'path';
import {
  logger,
  ensureArray,
  type DefaultRsbuildPlugin,
} from '@rsbuild/shared';
import { execSync } from 'child_process';

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

const getTargetBrowser = () => {
  // Use user setting first
  let targetBrowser = process.env.BROWSER;
  // If user setting not found or not support, use opening browser first
  if (!targetBrowser || !supportedChromiumBrowsers.includes(targetBrowser)) {
    const ps = execSync('ps cax').toString();
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
      const targetBrowser = getTargetBrowser();
      if (targetBrowser) {
        // Try to reuse existing tab with AppleScript
        execSync(
          `osascript openChrome.applescript "${encodeURI(
            url,
          )}" "${targetBrowser}"`,
          {
            stdio: 'ignore',
            cwd: join(__dirname, '../../static'),
          },
        );
        return true;
      }
      return false;
    } catch (err) {
      logger.error(
        'Failed to open start URL with apple script:',
        JSON.stringify(err),
      );
      return false;
    }
  }

  // Fallback to open
  // (It will always open new tab)
  try {
    const { default: open } = await import('open');
    await open(url);
    return true;
  } catch (err) {
    logger.error('Failed to open start URL:', JSON.stringify(err));
    return false;
  }
}

export const replacePlaceholder = (url: string, port: number) =>
  url.replace(/<port>/g, String(port));

const openedURLs: string[] = [];

export function pluginStartUrl(): DefaultRsbuildPlugin {
  return {
    name: 'plugin-start-url',
    async setup(api) {
      let port: number;

      api.onAfterStartDevServer(async (params) => {
        ({ port } = params);
      });

      api.onDevCompileDone(async ({ isFirstCompile }) => {
        if (!isFirstCompile || !port) {
          return;
        }

        const config = api.getNormalizedConfig();
        const { startUrl, beforeStartUrl } = config.dev;
        const { https } = api.context.devServer || {};

        if (!startUrl) {
          return;
        }

        const urls: string[] = [];

        if (startUrl === true) {
          const protocol = https ? 'https' : 'http';
          urls.push(`${protocol}://localhost:${port}`);
        } else {
          urls.push(
            ..._.castArray(startUrl).map((item) =>
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
          Promise.all(ensureArray(beforeStartUrl).map((fn) => fn())).then(
            openUrls,
          );
        } else {
          openUrls();
        }
      });
    },
  };
}
