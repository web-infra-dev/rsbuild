import { HmrTracker } from '../src/server/hmrTracker';

const token = 'web';
const hash = 'hash-1';

test('should settle an update when wait is registered before broadcast', async () => {
  const tracker = new HmrTracker<object>();
  const client = {};
  const promise = tracker.waitUntilSettled(token, hash, new Set([client]));

  tracker.onBuildResult(token, { clients: new Set([client]), hash });
  tracker.onClientSettled(token, client, hash, 'applied');

  await expect(promise).resolves.toEqual({
    hash,
    status: 'applied',
  });
});

test('should retain a settlement that arrives before wait is registered', async () => {
  const tracker = new HmrTracker<object>();
  const client = {};

  tracker.onBuildResult(token, { clients: new Set([client]), hash });
  tracker.onClientSettled(token, client, hash, 'applied');

  await expect(tracker.waitUntilSettled(token, hash, new Set([client]))).resolves.toEqual({
    hash,
    status: 'applied',
  });
});

test('should ignore stale acknowledgements and acknowledgements from other clients', async () => {
  const tracker = new HmrTracker<object>();
  const client = {};
  const otherClient = {};
  const promise = tracker.waitUntilSettled(token, hash, new Set([client]));
  let result: string | undefined;
  promise.then((settlement) => {
    result = settlement.status;
  });

  tracker.onBuildResult(token, { clients: new Set([client]), hash });
  tracker.onClientSettled(token, client, 'stale-hash', 'applied');
  tracker.onClientSettled(token, otherClient, hash, 'applied');

  await Promise.resolve();
  expect(result).toBeUndefined();

  tracker.onClientSettled(token, client, hash, 'skipped');
  await expect(promise).resolves.toEqual({
    hash,
    status: 'skipped',
  });
});

test('should resolve when all relevant clients disconnect', async () => {
  const tracker = new HmrTracker<object>();
  const clientA = {};
  const clientB = {};
  const promise = tracker.waitUntilSettled(token, hash, new Set([clientA, clientB]));
  let resolved = false;
  promise.then(() => {
    resolved = true;
  });

  tracker.onBuildResult(token, { clients: new Set([clientA, clientB]), hash });
  tracker.onDisconnect(token, clientA);
  await Promise.resolve();
  expect(resolved).toBe(false);

  tracker.onDisconnect(token, clientB);
  await expect(promise).resolves.toEqual({
    hash,
    status: 'skipped',
  });
});

test('should abort an active update', async () => {
  const tracker = new HmrTracker<object>();
  const client = {};
  const promise = tracker.waitUntilSettled(token, hash, new Set([client]));

  tracker.onBuildResult(token, { clients: new Set([client]), hash });
  tracker.abortActive(token);

  await expect(promise).resolves.toEqual({
    hash,
    status: 'skipped',
  });
});

test('should resolve an older update when a new build starts', async () => {
  const tracker = new HmrTracker<object>();
  const client = {};
  const promise = tracker.waitUntilSettled(token, hash, new Set([client]));

  tracker.onBuildResult(token, { clients: new Set([client]), hash });
  tracker.onBuildStart(token);

  await expect(promise).resolves.toEqual({
    hash,
    status: 'skipped',
  });
});

test('should track a new build separately when its hash is unchanged', async () => {
  const tracker = new HmrTracker<object>();
  const client = {};

  tracker.onBuildResult(token, { clients: new Set([client]), hash });
  tracker.onClientSettled(token, client, hash, 'applied');
  tracker.onBuildStart(token);

  const promise = tracker.waitUntilSettled(token, hash, new Set([client]));
  tracker.onBuildResult(token, { hash });

  await expect(promise).resolves.toEqual({
    hash,
    status: 'skipped',
  });
});

test('should retain a skipped result for a later waiter', async () => {
  const tracker = new HmrTracker<object>();
  const client = {};

  tracker.onBuildResult(token, { hash });

  await expect(tracker.waitUntilSettled(token, hash, new Set([client]))).resolves.toEqual({
    hash,
    status: 'skipped',
  });
});

test('should skip an active waiter when the build has no hash', async () => {
  const tracker = new HmrTracker<object>();
  const client = {};
  const promise = tracker.waitUntilSettled(token, hash, new Set([client]));

  tracker.onBuildResult(token, {});

  await expect(promise).resolves.toEqual({
    hash,
    status: 'skipped',
  });
});

test('should resolve immediately when no client is connected', async () => {
  const tracker = new HmrTracker<object>();

  await expect(tracker.waitUntilSettled(token, hash)).resolves.toEqual({
    hash,
    status: 'skipped',
  });
});

test('should time out when no settlement arrives', async () => {
  const tracker = new HmrTracker<object>(1);
  const client = {};

  await expect(tracker.waitUntilSettled(token, hash, new Set([client]))).resolves.toEqual({
    hash,
    status: 'timeout',
  });
});
