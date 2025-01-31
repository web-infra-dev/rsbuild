import { createRequestHandler } from '@react-router/cloudflare';
import type { RsbuildPlugin } from '@rsbuild/core';
import type { AppLoadContext, ServerBuild } from 'react-router';
import type { GetPlatformProxyOptions, PlatformProxy } from 'wrangler';

type CfProperties = Record<string, unknown>;

type LoadContext<Env, Cf extends CfProperties> = {
  cloudflare: Omit<PlatformProxy<Env, Cf>, 'dispose'>;
};

type GetLoadContext<Env, Cf extends CfProperties> = (args: {
  request: Request;
  context: LoadContext<Env, Cf>;
}) => AppLoadContext | Promise<AppLoadContext>;

async function importWrangler() {
  try {
    return import('wrangler');
  } catch (_) {
    throw Error('Could not import `wrangler`. Do you have it installed?');
  }
}

export const cloudflareDevProxy = <Env, Cf extends CfProperties>(
  options: {
    getLoadContext?: GetLoadContext<Env, Cf>;
  } & GetPlatformProxyOptions = {},
): RsbuildPlugin => {
  const { getLoadContext, ...restOptions } = options;

  return {
    name: 'rsbuild:cloudflare-dev-proxy',

    setup(api) {
      api.modifyRsbuildConfig(async (config) => {
        const existingMiddlewares = config.dev?.setupMiddlewares || [];
        const { getPlatformProxy } = await importWrangler();
        const { dispose, ...cloudflare } = await getPlatformProxy<Env, Cf>(
          restOptions,
        );
        return {
          ...config,
          tools: {
            ...config.tools,
            rspack: (rspackConfig) => ({
              ...rspackConfig,
              resolve: {
                ...rspackConfig.resolve,
                conditionNames: ['workerd', 'worker'],
              },
            }),
          },
          dev: {
            ...config.dev,
            setupMiddlewares: [
              ...existingMiddlewares,
              (middlewares, server) => {
                const context = { cloudflare };

                middlewares.unshift(async (req, res, next) => {
                  const bundle = (await server.environments.node.loadBundle(
                    'app',
                  )) as unknown as ServerBuild;
                  console.log('test', bundle);
                  try {
                    if (!bundle) {
                      throw new Error('Failed to load server bundle');
                    }

                    const handler = createRequestHandler({
                      build: bundle,
                      mode: 'development',
                    });

                    const origin =
                      req.headers.origin && req.headers.origin !== 'null'
                        ? req.headers.origin
                        : `http://${req.headers.host}`;
                    const url = new URL(req.url!, origin);

                    const controller = new AbortController();
                    res.on('finish', () => controller.abort());

                    const request = new Request(url.href, {
                      method: req.method,
                      headers: new Headers(req.headers as any),
                      signal: controller.signal,
                      body:
                        req.method !== 'GET' && req.method !== 'HEAD'
                          ? new ReadableStream({
                              start(controller) {
                                req.on('data', (chunk) =>
                                  controller.enqueue(chunk),
                                );
                                req.on('end', () => controller.close());
                              },
                            })
                          : undefined,
                    });

                    const loadContext = getLoadContext
                      ? await getLoadContext({ request, context })
                      : context;
                    const response = await handler(request, loadContext);

                    res.statusCode = response.status;
                    for (const [key, value] of response.headers) {
                      res.setHeader(key, value);
                    }

                    if (response.body) {
                      const reader = response.body.getReader();
                      while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        res.write(value);
                      }
                      res.end();
                    } else {
                      res.end();
                    }
                  } catch (error) {
                    next();
                  }
                });
              },
            ],
          },
        };
      });
    },
  };
};
