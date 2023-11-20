import { SDK } from '@rsbuild/doctor-types';
import type { Plugin } from '@rsbuild/doctor-types';
import { InternalBasePlugin } from './base';

export class InternalProgressPlugin<
  T extends Plugin.BaseCompiler,
> extends InternalBasePlugin<T> {
  public readonly name = 'progress';

  protected currentProgress: SDK.ServerAPI.InferResponseType<SDK.ServerAPI.APIExtends.GetCompileProgess> =
    {
      percentage: 100,
      message: '',
    };

  public apply(compiler: T): void {
    const { sdk, currentProgress } = this;
    if (compiler.webpack && compiler.webpack.ProgressPlugin) {
      const progress = new compiler.webpack.ProgressPlugin({
        handler(percentage: number, msg: string) {
          currentProgress.percentage = percentage;
          currentProgress.message = msg || '';

          const api = SDK.ServerAPI.APIExtends.GetCompileProgess;
          sdk.server.sendAPIDataToClient(api, {
            req: {
              api,
              body: undefined,
            },
            res: currentProgress,
          });
        },
      });
      progress.apply(compiler as any); // TODO: compatible the @rspack/core@0.3.14-canary-f95d6cb-20231120024209
    }
  }
}
