import { PlainObject } from '../../common';
import { connect } from '../../thirdparty';
import { DoctorClientRoutes } from '../../client';
import { API } from './apis';

export * as ServerAPI from './apis';

interface ClientUrlFunctionWithRouteDefined<T> {
  (
    route: DoctorClientRoutes.BundleDiff,
    baselineUrl: string,
    currentUrl: string,
  ): T;
  (route?: 'homepage'): T;
}

export interface DoctorServerInstance {
  readonly app: connect.Server;

  readonly port: number;
  readonly origin: string;

  get(
    route: string,
    cb: (
      ...args: Parameters<connect.NextHandleFunction>
    ) => string | PlainObject,
  ): connect.Server;
  post(
    route: string,
    cb: (
      ...args: Parameters<connect.NextHandleFunction>
    ) => string | PlainObject,
  ): connect.Server;

  proxy(
    route: string,
    method: 'GET' | 'POST',
    cb: (
      ...args: Parameters<connect.NextHandleFunction>
    ) => PlainObject | string,
  ): void;

  getClientUrl: ClientUrlFunctionWithRouteDefined<string>;

  openClientPage: ClientUrlFunctionWithRouteDefined<Promise<void>>;

  sendAPIDataToClient(api: API, msg: unknown): void | never;

  bootstrap(): Promise<void>;
  dispose(): Promise<void>;
}
