import { HmrTracker } from '../src/server/hmrTracker';

const token = 'web';

test('should settle an update when wait is registered before broadcast', async () => {
  const tracker = new HmrTracker<object>();
  const client = {};
  const promise = tracker.waitUntilSettled(token, 'hash-1', new Set([client]));

  tracker.startUpdate(token, 'hash-1', new Set([client]));
  tracker.onClientSettled(token, client, 'hash-1', 'applied');

  await expect(promise).resolves.toEqual({
    hash: 'hash-1',
    status: 'applied',
  });
});

test('should retain a settlement that arrives before wait is registered', async () => {
  const tracker = new HmrTracker<object>();
  const client = {};

  tracker.startUpdate(token, 'hash-1', new Set([client]));
  tracker.onClientSettled(token, client, 'hash-1', 'applied');

  await expect(tracker.waitUntilSettled(token, 'hash-1', new Set([client]))).resolves.toEqual({
    hash: 'hash-1',
    status: 'applied',
  });
});

test('should ignore stale acknowledgements and acknowledgements from other clients', async () => {
  const tracker = new HmrTracker<object>();
  const client = {};
  const otherClient = {};
  const promise = tracker.waitUntilSettled(token, 'hash-1', new Set([client]));
  let result: string | undefined;
  promise.then((settlement) => {
    result = settlement.status;
  });

  tracker.startUpdate(token, 'hash-1', new Set([client]));
  tracker.onClientSettled(token, client, 'stale-hash', 'applied');
  tracker.onClientSettled(token, otherClient, 'hash-1', 'applied');

  await Promise.resolve();
  expect(result).toBeUndefined();

  tracker.onClientSettled(token, client, 'hash-1', 'skipped');
  await expect(promise).resolves.toEqual({
    hash: 'hash-1',
    status: 'skipped',
  });
});

test('should resolve when all relevant clients disconnect', async () => {
  const tracker = new HmrTracker<object>();
  const clientA = {};
  const clientB = {};
  const promise = tracker.waitUntilSettled(token, 'hash-1', new Set([clientA, clientB]));
  let resolved = false;
  promise.then(() => {
    resolved = true;
  });

  tracker.startUpdate(token, 'hash-1', new Set([clientA, clientB]));
  tracker.onDisconnect(token, clientA);
  await Promise.resolve();
  expect(resolved).toBe(false);

  tracker.onDisconnect(token, clientB);
  await expect(promise).resolves.toEqual({
    hash: 'hash-1',
    status: 'skipped',
  });
});

test('should resolve an older update when a new build starts', async () => {
  const tracker = new HmrTracker<object>();
  const client = {};
  const promise = tracker.waitUntilSettled(token, 'hash-1', new Set([client]));

  tracker.startUpdate(token, 'hash-1', new Set([client]));
  tracker.onBuildStart(token);

  await expect(promise).resolves.toEqual({
    hash: 'hash-1',
    status: 'skipped',
  });
});

test('should track a new build separately when its hash is unchanged', async () => {
  const tracker = new HmrTracker<object>();
  const client = {};

  tracker.startUpdate(token, 'hash-1', new Set([client]));
  tracker.onClientSettled(token, client, 'hash-1', 'applied');
  tracker.onBuildStart(token);

  const promise = tracker.waitUntilSettled(token, 'hash-1', new Set([client]));
  tracker.skipUpdate(token, 'hash-1');

  await expect(promise).resolves.toEqual({
    hash: 'hash-1',
    status: 'skipped',
  });
});

test('should retain a skipped result for a later waiter', async () => {
  const tracker = new HmrTracker<object>();
  const client = {};

  tracker.skipUpdate(token, 'hash-1');

  await expect(tracker.waitUntilSettled(token, 'hash-1', new Set([client]))).resolves.toEqual({
    hash: 'hash-1',
    status: 'skipped',
  });
});

test('should resolve immediately when no client is connected', async () => {
  const tracker = new HmrTracker<object>();

  await expect(tracker.waitUntilSettled(token, 'hash-1')).resolves.toEqual({
    hash: 'hash-1',
    status: 'skipped',
  });
});

test('should time out when no settlement arrives', async () => {
  const tracker = new HmrTracker<object>(1);
  const client = {};

  await expect(tracker.waitUntilSettled(token, 'hash-1', new Set([client]))).resolves.toEqual({
    hash: 'hash-1',
    status: 'timeout',
  });
});
