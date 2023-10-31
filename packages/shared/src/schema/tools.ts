import { SharedToolsConfig, FileFilterUtil } from '../types';
import { DevServerHttpsOptionsSchema } from './dev';
import { z } from '../utils';

export const FileFilterUtilSchema: z.ZodType<FileFilterUtil> = z.function(
  z.tuple([z.arrayOrNot(z.union([z.string(), z.instanceof(RegExp)]))]),
  z.void(),
);

const sharedDevServerConfigSchema = z.partialObj({
  after: z.array(z.function()),
  before: z.array(z.function()),
  client: z.partialObj({
    protocol: z.string(),
    path: z.string(),
    port: z.string(),
    host: z.string(),
  }),
  devMiddleware: z.partialObj({
    writeToDisk: z.union([
      z.boolean(),
      z.function().args(z.string()).returns(z.boolean()),
    ]),
    outputFileSystem: z.record(z.any()),
  }),
  historyApiFallback: z.union([z.boolean(), z.record(z.unknown())]),
  compress: z.boolean(),
  hot: z.boolean(),
  https: DevServerHttpsOptionsSchema,
  liveReload: z.boolean(),
  setupMiddlewares: z.array(z.function()),
  headers: z.record(z.union([z.string(), z.array(z.string())])),
  proxy: z.union([z.record(z.unknown()), z.array(z.any())]),
  watch: z.boolean(),
});

export const sharedToolsConfigSchema = z.partialObj({
  pug: z.union([z.literal(true), z.chained(z.any())]),
  sass: z.chained(z.any(), z.object({ addExcludes: FileFilterUtilSchema })),
  less: z.chained(z.any(), z.object({ addExcludes: FileFilterUtilSchema })),
  babel: z.chained(z.any(), z.any()),
  postcss: z.chained(z.any(), z.object({ addPlugins: z.function() })),
  cssLoader: z.chained(z.any(), z.object({ addPlugins: z.function() })),
  minifyCss: z.chained(z.any()),
  styleLoader: z.chained(z.any()),
  devServer: sharedDevServerConfigSchema,
  autoprefixer: z.chained(z.any()),
  bundlerChain: z.arrayOrNot(z.function()),
});

const _schema: z.ZodType<SharedToolsConfig> = sharedToolsConfigSchema;
