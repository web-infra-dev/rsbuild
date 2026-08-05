import {
  createHmrHashState,
  reduceHmrHashState,
  type HmrHashEvent,
  type HmrHashState,
} from '../src/client/hmrHashState';

const reduce = (events: HmrHashEvent[], initial = createHmrHashState()) =>
  events.reduce(({ state }, event) => reduceHmrHashState(state, event), {
    state: initial,
    reload: false,
  });

const hash = (value: string, cause: 'lazy' | 'normal', appliedHash = 'initial'): HmrHashEvent => ({
  type: 'hash',
  hash: value,
  cause,
  appliedHash,
});

describe('HMR hash state', () => {
  it.each([
    {
      name: 'keeps a lazy duplicate lazy',
      causes: ['lazy', 'lazy'] as const,
      expected: 'lazy',
    },
    {
      name: 'lets a normal duplicate override lazy',
      causes: ['lazy', 'normal'] as const,
      expected: 'normal',
    },
    {
      name: 'does not let a lazy duplicate override normal',
      causes: ['normal', 'lazy'] as const,
      expected: 'normal',
    },
  ])('$name', ({ causes, expected }) => {
    const result = reduce(causes.map((cause) => hash('next', cause)));

    expect(result).toEqual({
      state: {
        lastHash: 'next',
        pending: [{ hash: 'next', cause: expected }],
        disconnected: false,
      },
      reload: false,
    });
  });

  it('fails closed when an older hash is received again', () => {
    const result = reduce([hash('one', 'lazy'), hash('two', 'lazy'), hash('one', 'lazy')]);

    expect(result).toEqual({
      state: { lastHash: 'initial', pending: [], disconnected: false },
      reload: true,
    });
  });

  it('advances the queue through each applied hash', () => {
    const queued = reduce([hash('one', 'lazy'), hash('two', 'normal')]).state;
    const first = reduceHmrHashState(queued, { type: 'applied', hash: 'one' });
    const second = reduceHmrHashState(first.state, { type: 'applied', hash: 'two' });

    expect(first.state.pending).toEqual([{ hash: 'two', cause: 'normal' }]);
    expect(second.state.pending).toEqual([]);
  });

  it('clears pending provenance after an error reset', () => {
    const queued = reduce([hash('next', 'lazy')]).state;

    expect(reduceHmrHashState(queued, { type: 'reset', appliedHash: 'initial' })).toEqual({
      state: { lastHash: 'initial', pending: [], disconnected: false },
      reload: false,
    });
  });

  it.each([
    { hash: 'initial', reload: false },
    { hash: 'missed-update', reload: true },
  ])('classifies $hash after reconnect', ({ hash: nextHash, reload }) => {
    const beforeDisconnect: HmrHashState = {
      lastHash: 'pending',
      pending: [{ hash: 'pending', cause: 'lazy' }],
      disconnected: false,
    };
    const disconnected = reduceHmrHashState(beforeDisconnect, { type: 'disconnect' }).state;
    const result = reduceHmrHashState(disconnected, hash(nextHash, 'lazy'));

    expect(result).toEqual({
      state: { lastHash: 'initial', pending: [], disconnected: false },
      reload,
    });
  });

  it('does not mutate prior state', () => {
    const state = reduce([hash('next', 'lazy')]).state;

    reduceHmrHashState(state, hash('next', 'normal'));

    expect(state.pending).toEqual([{ hash: 'next', cause: 'lazy' }]);
  });
});
