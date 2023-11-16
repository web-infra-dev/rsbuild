import { Manifest } from '@rsbuild/doctor-types';
import { DoctorSlaveSDK } from './slave';

export class DoctorSDKController {
  readonly slaves: DoctorSlaveSDK[] = [];

  public root = '';

  constructor(root = process.cwd()) {
    this.root = root;
  }

  get master() {
    return this.slaves[0];
  }

  getLastSdk() {
    return this.slaves[this.slaves.length - 1];
  }

  hasName(name: string) {
    return Boolean(this.slaves.find((item) => item.name === name));
  }

  getSeriesData(serverUrl = false) {
    return this.slaves.map((item) => {
      const data: Manifest.DoctorManifestSeriesData = {
        name: item.name,
        path: item.diskManifestPath,
        stage: item.stage,
        cloudUrl: '', // TODO: Delete the cloud path property.
      };

      if (serverUrl) {
        data.origin = item.server.origin;
      }

      return data;
    });
  }

  createSlave({
    name,
    stage,
    extraConfig,
  }: Omit<ConstructorParameters<typeof DoctorSlaveSDK>[0], 'controller'>) {
    const slave = new DoctorSlaveSDK({
      name,
      stage,
      controller: this,
      extraConfig,
    });
    this.slaves.push(slave);
    // sort by stage after create slave sdk.
    this.slaves.sort((a, b) => a.stage - b.stage);
    return slave;
  }
}
