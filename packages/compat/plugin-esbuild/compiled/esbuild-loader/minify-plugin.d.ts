import { Rspack } from '@rsbuild/core';
import { MinifyPluginOptions } from './interfaces';
declare class ESBuildMinifyPlugin {
    private readonly options;
    private readonly transform;
    constructor(options?: MinifyPluginOptions);
    apply(compiler: Rspack.Compiler): void;
    private transformAssets;
}
export default ESBuildMinifyPlugin;