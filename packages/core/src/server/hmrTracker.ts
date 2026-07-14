import type { HmrSettlement } from '../types';

type HmrSettlementStatus = HmrSettlement['status'];

type UpdateRecord<Client> = {
  /** Connected clients eligible to settle this update. */
  clients: Set<Client>;
  /** Build generation used to distinguish repeated hashes. */
  generation: number;
  /** Compilation hash for this update. */
  hash: string;
  /** Shared settlement promise for all waiters. */
  promise?: Promise<HmrSettlement>;
  /** Resolver for the shared settlement promise. */
  resolve?: (result: HmrSettlement) => void;
  /** Whether onBuildResult has reported this update. */
  started: boolean;
  /** Final status, or undefined while pending. */
  status?: HmrSettlementStatus;
  /** Timer that settles this update with the timeout status. */
  timeout?: NodeJS.Timeout;
};

type EnvironmentState<Client> = {
  generation: number;
  record?: UpdateRecord<Client>;
};

type HmrBuildResult<Client> = {
  clients?: ReadonlySet<Client>;
  hash?: string;
};

const HMR_SETTLEMENT_TIMEOUT = 2000;

export class HmrTracker<Client> {
  private readonly states = new Map<string, EnvironmentState<Client>>();

  private readonly timeout: number;

  constructor(timeout: number = HMR_SETTLEMENT_TIMEOUT) {
    this.timeout = timeout;
  }

  public waitUntilSettled(
    token: string,
    hash: string,
    clients?: ReadonlySet<Client>,
  ): Promise<HmrSettlement> {
    if (!clients?.size) {
      return Promise.resolve({ hash, status: 'skipped' });
    }

    const state = this.getState(token);
    const { record: current } = state;

    if (current?.generation === state.generation) {
      if (current.hash === hash) {
        return this.waitFor(current);
      }
      if (current.started) {
        return Promise.resolve({ hash, status: 'skipped' });
      }
    }

    if (current) {
      this.settle(current, 'skipped');
    }

    const record: UpdateRecord<Client> = {
      clients: new Set(clients),
      generation: state.generation,
      hash,
      started: false,
    };
    state.record = record;
    return this.waitFor(record);
  }

  /** Track the clients of an HMR update, or skip it when no clients are provided. */
  public onBuildResult(token: string, { clients, hash }: HmrBuildResult<Client>): void {
    if (!hash) {
      this.abortActive(token);
      return;
    }

    const state = this.getState(token);
    let { record } = state;

    if (record?.generation !== state.generation || record.hash !== hash) {
      if (record) {
        this.settle(record, 'skipped');
      }
      record = {
        clients: new Set(clients),
        generation: state.generation,
        hash,
        started: true,
      };
      state.record = record;
    } else if (record.status === undefined) {
      record.started = true;
      record.clients = new Set(clients);
    }

    if (!clients?.size) {
      this.settle(record, 'skipped');
    }
  }

  /** Abort active updates interrupted outside the build lifecycle. */
  public abortActive(token?: string): void {
    if (token) {
      const record = this.states.get(token)?.record;
      if (record) {
        this.settle(record, 'skipped');
      }
      return;
    }

    for (const { record } of this.states.values()) {
      if (record) {
        this.settle(record, 'skipped');
      }
    }
  }

  /** Invalidate the previous record so a repeated hash belongs to the new build. */
  public onBuildStart(token: string): void {
    const state = this.getState(token);
    if (state.record) {
      this.settle(state.record, 'skipped');
    }
    state.generation++;
  }

  public onClientSettled(
    token: string,
    client: Client,
    hash: string,
    status: HmrSettlementStatus,
  ): void {
    const record = this.states.get(token)?.record;
    if (record?.hash === hash && record.clients.has(client)) {
      this.settle(record, status);
    }
  }

  public onDisconnect(token: string, client: Client): void {
    const record = this.states.get(token)?.record;
    if (record?.clients.delete(client) && record.clients.size === 0) {
      this.settle(record, 'skipped');
    }
  }

  public close(): void {
    this.abortActive();
    this.states.clear();
  }

  private getState(token: string): EnvironmentState<Client> {
    let state = this.states.get(token);
    if (!state) {
      state = { generation: 0 };
      this.states.set(token, state);
    }
    return state;
  }

  private settle(record: UpdateRecord<Client>, status: HmrSettlementStatus): void {
    if (record.status !== undefined) {
      return;
    }

    record.status = status;
    record.clients.clear();
    if (record.timeout) {
      clearTimeout(record.timeout);
      record.timeout = undefined;
    }
    record.resolve?.({ hash: record.hash, status });
    record.promise = undefined;
    record.resolve = undefined;
  }

  private waitFor(record: UpdateRecord<Client>): Promise<HmrSettlement> {
    if (record.status !== undefined) {
      return Promise.resolve({ hash: record.hash, status: record.status });
    }
    if (record.promise) {
      return record.promise;
    }

    let resolve!: NonNullable<UpdateRecord<Client>['resolve']>;
    const promise = new Promise<HmrSettlement>((resolver) => {
      resolve = resolver;
    });
    record.promise = promise;
    record.resolve = resolve;
    record.timeout = setTimeout(() => {
      record.timeout = undefined;
      this.settle(record, 'timeout');
    }, this.timeout).unref();
    return promise;
  }
}
