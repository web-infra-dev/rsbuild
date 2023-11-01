import path from 'path';
import { SDK } from '@rsbuild/doctor-types';
import { DoctorWebpackSDK } from '../sdk';
import { DoctorSlaveServer } from './server';
import type { DoctorSDKController } from './controller';

let id = 1;

interface DoctorSlaveSDKOptions {
  name: string;
  /**
   * use to sort for display in the client page.
   * the smaller the front.
   * @default 1
   */
  stage?: number;
  extraConfig?: SDK.SDKOptionsType;
  controller: DoctorSDKController;
}

export class DoctorSlaveSDK extends DoctorWebpackSDK {
  id: number;

  public readonly stage: number;

  private parent: DoctorSDKController;

  private uploadPieces!: Promise<void>;

  private finishUploadPieceSwitch!: () => void;

  constructor({ name, stage, controller, extraConfig }: DoctorSlaveSDKOptions) {
    super({ name, root: controller.root });

    const lastSdk = controller.getLastSdk();
    const port = lastSdk ? lastSdk.server.port + 1 : this.server.port;

    this.id = id++;
    this.stage = typeof stage === 'number' ? stage : 1;
    this.extraConfig = extraConfig;
    this.parent = controller;
    this.server = new DoctorSlaveServer(this, port);
    this.setName(name);
    this.clearSwitch();
  }

  private clearSwitch() {
    this.uploadPieces = new Promise<void>((resolve) => {
      this.finishUploadPieceSwitch = resolve;
    });
  }

  get isMaster() {
    return this.parent.master === this;
  }

  protected async writePieces(): Promise<void> {
    const { name, parent, isMaster, outputDir, finishUploadPieceSwitch } = this;
    this.setOutputDir(
      isMaster
        ? outputDir
        : path.join(
            parent.master.outputDir,
            '.slaves',
            name.replace(/\s+/g, '-'),
          ),
    );
    await super.writePieces(this.getStoreData());
    finishUploadPieceSwitch?.();
  }

  protected async writeManifest() {
    const { parent, cloudData } = this;

    await Promise.all(this.parent.slaves.map((item) => item.uploadPieces));

    if (cloudData) {
      cloudData.name = this.name;
      cloudData.series = parent.getSeriesData();
    }

    const result = await super.writeManifest();
    this.clearSwitch();
    return result;
  }

  getSeriesData(serverUrl = false) {
    return this.parent.getSeriesData(serverUrl);
  }

  setName(name: string) {
    this._name = this.parent.hasName(name) ? `${name}-${id}` : name;
  }

  getManifestData() {
    const data = super.getManifestData();
    data.name = this.name;
    data.series = this.getSeriesData(true);
    return data;
  }
}
