import net from 'node:net';
import { dev, expect, getRandomPort, test } from '@e2e/helper';

const occupyPort = async () => {
  const port = await getRandomPort();
  const blocker = net.createServer();

  await new Promise<void>((resolve, reject) => {
    blocker.once('error', reject);
    blocker.listen(port, resolve);
  });

  return {
    port,
    close: () =>
      new Promise<void>((resolve) => {
        blocker.close(() => resolve());
      }),
  };
};

test('should throw when strictPort is enabled and port is taken', async () => {
  const blocker = await occupyPort();

  try {
    await expect(
      dev({
        waitFirstCompileDone: false,
        config: {
          server: {
            port: blocker.port,
            strictPort: true,
          },
        },
      }),
    ).rejects.toThrow(/Port \d+ is occupied/);
  } finally {
    await blocker.close();
  }
});
