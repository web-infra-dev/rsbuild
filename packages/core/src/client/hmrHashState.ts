import type { HmrUpdateCause } from '../server/socketServer';

export type PendingHmrHash = {
  readonly hash: string;
  readonly cause: HmrUpdateCause;
};

export type HmrHashState = {
  readonly lastHash?: string;
  readonly pending: readonly PendingHmrHash[];
  readonly disconnected: boolean;
};

export type HmrHashEvent =
  | {
      readonly type: 'hash';
      readonly hash: string;
      readonly cause: HmrUpdateCause;
      readonly appliedHash: string;
    }
  | { readonly type: 'applied'; readonly hash: string }
  | { readonly type: 'disconnect' }
  | { readonly type: 'reset'; readonly appliedHash: string };

export type HmrHashTransition = {
  readonly state: HmrHashState;
  readonly reload: boolean;
};

export const createHmrHashState = (): HmrHashState => ({
  pending: [],
  disconnected: false,
});

const reset = (appliedHash: string): HmrHashState => ({
  lastHash: appliedHash,
  pending: [],
  disconnected: false,
});

export const reduceHmrHashState = (state: HmrHashState, event: HmrHashEvent): HmrHashTransition => {
  if (event.type === 'reset') {
    return { state: reset(event.appliedHash), reload: false };
  }

  if (event.type === 'disconnect') {
    return { state: { ...state, disconnected: true }, reload: false };
  }

  if (event.type === 'applied') {
    const appliedIndex = state.pending.findIndex(({ hash }) => hash === event.hash);
    if (appliedIndex !== -1) {
      return {
        state: { ...state, pending: state.pending.slice(appliedIndex + 1) },
        reload: false,
      };
    }
    if (state.lastHash === event.hash && state.pending.length > 0) {
      return { state: { ...state, pending: [] }, reload: false };
    }
    return { state, reload: false };
  }

  if (event.hash === 'XXXX') {
    return { state, reload: false };
  }

  if (state.disconnected) {
    if (event.hash !== event.appliedHash) {
      return { state: reset(event.appliedHash), reload: true };
    }
    return { state: reset(event.appliedHash), reload: false };
  }

  if (event.hash === event.appliedHash) {
    if (state.pending.length > 0 && state.lastHash !== event.hash) {
      return { state: reset(event.appliedHash), reload: true };
    }
    return { state: reset(event.appliedHash), reload: false };
  }

  const previous = state.pending[state.pending.length - 1];
  if (previous?.hash === event.hash) {
    const cause = previous.cause === 'normal' || event.cause === 'normal' ? 'normal' : 'lazy';
    return {
      state: {
        ...state,
        lastHash: event.hash,
        pending: [...state.pending.slice(0, -1), { hash: event.hash, cause }],
      },
      reload: false,
    };
  }

  if (state.pending.some(({ hash }) => hash === event.hash)) {
    return { state: reset(event.appliedHash), reload: true };
  }

  return {
    state: {
      ...state,
      lastHash: event.hash,
      pending: [...state.pending, { hash: event.hash, cause: event.cause }],
    },
    reload: false,
  };
};
