import { expect, expectPoll, test } from '@e2e/helper';

declare global {
  interface Window {
    sendPing: (value: number) => void;
  }
}

test('should receive custom events from HMR clients', async ({ page, dev }) => {
  const received: number[] = [];
  const receivedAfterUnsubscribe: number[] = [];
  let unsubscribe = () => {};

  await dev({
    config: {
      server: {
        setup({ action, server }) {
          if (action !== 'dev') return;
          const { hot } = server.environments.web;

          unsubscribe = hot.on<{ value: number }>('ping', (data, client) => {
            received.push(data.value);
            client.send('custom', { event: 'pong', data: data.value * 2 });
          });
          hot.on<{ value: number }>('ping', (data) => {
            receivedAfterUnsubscribe.push(data.value);
          });
        },
      },
    },
  });

  // Message sent before the WebSocket connected
  await expect(page.locator('#pong')).toHaveText('2');

  await page.evaluate(() => window.sendPing(5));
  await expect(page.locator('#pong')).toHaveText('10');
  expect(received).toEqual([1, 5]);

  unsubscribe();
  await page.evaluate(() => window.sendPing(7));
  await expectPoll(() => receivedAfterUnsubscribe).toEqual([1, 5, 7]);
  expect(received).toEqual([1, 5]);
});
