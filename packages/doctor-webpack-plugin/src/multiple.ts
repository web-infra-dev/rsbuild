import { DoctorSDKController } from '@rsbuild/doctor-sdk/sdk';
import { Linter } from '@rsbuild/doctor-types';
import type { DoctorWebpackMultiplePluginOptions } from '@rsbuild/doctor-core';

import { RsbuildDoctorWebpackPlugin } from './plugin';

let globalController: DoctorSDKController | undefined;

export class RsbuildDoctorWebpackMultiplePlugin<
  Rules extends Linter.ExtendRuleData[],
> extends RsbuildDoctorWebpackPlugin<Rules> {
  private controller: DoctorSDKController;

  constructor(options: DoctorWebpackMultiplePluginOptions<Rules> = {}) {
    const controller = (() => {
      if (globalController) {
        return globalController;
      }
      const controller = new DoctorSDKController();
      globalController = controller;
      return controller;
    })();

    const instance = controller.createSlave({
      name: options.name || 'Builder',
      stage: options.stage,
      extraConfig: { disableTOSUpload: options.disableTOSUpload || false },
    });

    super({
      ...options,
      sdkInstance: instance,
    });

    this.controller = controller;
  }
}
