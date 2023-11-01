import { SDK } from '@rsbuild/doctor-types';
import { Server } from '@rsbuild/doctor-utils/build';
import { DoctorServer } from '.';

export class DoctorFakeServer extends DoctorServer {
  constructor(
    protected sdk: SDK.DoctorBuilderSDKInstance,
    port = Server.defaultPort,
  ) {
    super(sdk, port);
    this.sdk = sdk;
  }

  async openClientPage() {}
}
