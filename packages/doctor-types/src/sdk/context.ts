import type { ChunkGraphInstance } from './chunk';
import type { ModuleGraphInstance } from './module';
import type { PackageGraphInstance, OtherReports } from './package';
import { ConfigData } from './config';
import { LoaderData } from './loader';

export interface RuntimeContext {
  /** Project root directory */
  root: string;

  /** Project configuration */
  configs: ConfigData;

  /** build error */
  errors: Error[];

  /** Chunk chart */
  chunkGraph: ChunkGraphInstance;

  /** Module diagram */
  moduleGraph: ModuleGraphInstance;

  /** Dependency graph */
  packageGraph: PackageGraphInstance;
  loader: LoaderData;
  otherReports?: OtherReports | undefined;
}

export interface RuntimeContextOptions {}
