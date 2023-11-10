import type { DoctorWebpackSDK } from '@rsbuild/doctor-sdk/sdk';
import type { Linter, Plugin } from '@rsbuild/doctor-types';
import {
  internalPluginTapPostOptions,
  internalPluginTapPreOptions,
} from '../constants';
import type { InternalPlugin, DoctorPluginInstance } from '@/types';

export abstract class InternalBasePlugin<T extends Plugin.BaseCompiler>
  implements InternalPlugin<T, Linter.ExtendRuleData[]>
{
  abstract name: string;

  constructor(
    public readonly scheduler: DoctorPluginInstance<
      Plugin.BaseCompiler,
      Linter.ExtendRuleData[]
    >,
  ) {}

  abstract apply(compiler: T): void;

  get options() {
    return this.scheduler.options;
  }

  get sdk(): DoctorWebpackSDK {
    return this.scheduler.sdk;
  }

  get tapPostOptions() {
    return internalPluginTapPostOptions(this.name);
  }

  get tapPreOptions() {
    return internalPluginTapPreOptions(this.name);
  }
}
