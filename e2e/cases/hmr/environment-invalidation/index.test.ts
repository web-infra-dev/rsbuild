import { once } from 'node:events';
import { expect, test } from '@e2e/helper';
import type { Rspack } from '@rsbuild/core';

test('should invalidate early results only for the rebuilding environment', async ({
  devOnly,
}) => {
  const compilers: Record<string, Rspack.Compiler> = {};
  const nodeBuilding = Promise.withResolvers<void>();
  const webBuilding = Promise.withResolvers<void>();
  const releaseBuilds = Promise.withResolvers<void>();
  let pauseNode = false;
  let pauseWeb = false;

  const { server, port } = await devOnly({
    config: {
      environments: {
        web: {},
        node: { output: { target: 'node' } },
      },
      tools: {
        rspack: (config, { environment }) => {
          config.plugins.push({
            apply(compiler: Rspack.Compiler) {
              compilers[environment.name] = compiler;
              compiler.hooks.afterCompile.tapPromise(
                'pause-build',
                async () => {
                  if (environment.name === 'node' ? pauseNode : pauseWeb) {
                    const building =
                      environment.name === 'node' ? nodeBuilding : webBuilding;
                    building.resolve();
                    await releaseBuilds.promise;
                  }
                },
              );
            },
          });
        },
      },
    },
  });

  const { context, hot } = server!.environments.web;
  hot.onConnect((client) => {
    // This follows the initial stats, so receiving it completes the snapshot.
    client.send('custom', { event: 'connected' });
  });

  const connect = async () => {
    const socket = new WebSocket(
      `ws://localhost:${port}${context.config.dev.client.path}?token=${context.webSocketToken}`,
    );
    const connected = Promise.withResolvers<void>();
    const messages: { type: string; data?: unknown }[] = [];
    socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(String(data)) as (typeof messages)[number];
      if (message.type === 'custom') {
        connected.resolve();
      } else {
        messages.push(message);
      }
    });
    await connected.promise;
    return { socket, messages };
  };

  const first = await connect();
  try {
    pauseNode = true;
    compilers.node.watching!.invalidate();
    await nodeBuilding.promise;

    const earlyUpdate = once(first.socket, 'message');
    compilers.web.watching!.invalidate();
    await earlyUpdate;
    const message = first.messages.at(-1)!;
    expect(message.type).toBe('early-update');

    // A queued Node rebuild must preserve the completed Web result for new clients.
    compilers.node.watching!.invalidate();
    expect((await connect()).messages).toEqual([message]);

    // Rebuilding Web must stop replaying its previous result until it finishes.
    pauseWeb = true;
    compilers.web.watching!.invalidate();
    await webBuilding.promise;
    expect((await connect()).messages).toEqual([]);
  } finally {
    releaseBuilds.resolve();
  }
});
