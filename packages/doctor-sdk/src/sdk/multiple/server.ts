import { Server } from '@rsbuild/doctor-utils';
import { DoctorServer } from '../server';
import type { DoctorSlaveSDK } from './slave';

export class DoctorSlaveServer extends DoctorServer {
  protected sdk: DoctorSlaveSDK;

  constructor(sdk: DoctorSlaveSDK, port = Server.defaultPort) {
    super(sdk, port);
    this.sdk = sdk;
  }

  async openClientPage(...args: unknown[]) {
    if (this.sdk.isMaster) {
      return super.openClientPage(...(args as ['homepage']));
    }

    return Promise.resolve();
  }
}
