import { DevToolError } from '@rsbuild/doctor-utils/error';
import { Common, Manifest, SDK } from '@rsbuild/doctor-types';
import { File } from '@rsbuild/doctor-utils/build';
import { RawSourceMap, SourceMapConsumer } from 'source-map';
import { ModuleGraph, ChunkGraph, PackageGraph } from '../../graph';
import { debug } from '@rsbuild/doctor-utils/logger';
import { DoctorServer } from '../server';
import { DoctorFakeServer } from '../server/fakeServer';
import { DoctorWebpackSDKOptions } from './types';
import { SDKCore } from './core';

export class DoctorWebpackSDK<
    T extends DoctorWebpackSDKOptions = DoctorWebpackSDKOptions,
  >
  extends SDKCore<T>
  implements SDK.DoctorBuilderSDKInstance
{
  public server: DoctorServer;

  public extraConfig: SDK.SDKOptionsType | undefined;

  private type: SDK.ToDataType;

  private _summary: SDK.SummaryData = { costs: [] };

  private _configs: SDK.ConfigData = [];

  private _errors: DevToolError[] = [];

  private _loader: SDK.LoaderData = [];

  private _resolver: SDK.ResolverData = [];

  private _plugin: SDK.PluginData = {};

  private _moduleGraph = new ModuleGraph();

  private _chunkGraph = new ChunkGraph();

  private _rawSourceMapCache = new Map<string, RawSourceMap>();

  private _sourceMap = new Map<string, SourceMapConsumer>();

  private _packageGraph!: SDK.PackageGraphInstance;

  private _tileReportHtml: string | undefined;

  constructor(options: T) {
    super(options);
    this.server = options.noServer
      ? new DoctorFakeServer(this, undefined)
      : new DoctorServer(this, options.port);
    this.type = options.type || SDK.ToDataType.Normal;
    this.extraConfig = options.config;
  }

  async bootstrap() {
    debug(() => `${Date.now()}`, '[DoctorWebpackSDK][bootstrap start]');
    this.server && (await this.server.bootstrap());
    await super.bootstrap();
    debug(
      () => `${Date.now()} ${this.server.origin}`,
      '[DoctorWebpackSDK][bootstrap end]',
    );
  }

  async dispose() {
    debug(() => `${Date.now()}`, '[DoctorWebpackSDK][dispose start]');
    this.server && (await this.server.dispose());
    await super.dispose();
    debug(() => `${Date.now()}`, '[DoctorWebpackSDK][dispose end]');
  }

  async applyErrorFix(id: number) {
    const { _errors: errors } = this;
    const error = errors.find((err) => err.id === id);

    if (!error || !error.path || !error.fixData || error.fixData.isFixed) {
      return;
    }

    const { path: filePath, fixData } = error;
    const sameFileErrors = errors.filter(
      (item) => item.path === filePath && item !== error,
    );
    let content = (await File.fse.readFile(filePath, 'utf-8')).toString();

    // Application of current modification.
    const startTxt = content.substring(0, fixData.start);
    const endTxt = content.substring(fixData.end, content.length);
    const offset =
      (fixData.newText ?? '').length - (fixData.end - fixData.start);

    // Modified text.
    content = startTxt + fixData.newText + endTxt;

    // The remaining modifications of the same document need to be recalculated.
    for (const other of sameFileErrors) {
      const { fixData: otherFixData } = other;

      if (!otherFixData) {
        continue;
      }

      // After the modified text, the offset needs to be corrected.
      if (otherFixData.start >= fixData.end) {
        otherFixData.start += offset;
        otherFixData.end += offset;
      }
    }

    // Modify the write to the hard disk.
    await File.fse.writeFile(filePath, content);
  }

  clear() {
    this._errors = [];
    this._loader = [];
    this._resolver = [];
    this._plugin = {};
    this._moduleGraph = new ModuleGraph();
    this._chunkGraph = new ChunkGraph();
  }

  clearSourceMapCache(): void {
    this._rawSourceMapCache = new Map();
    this._sourceMap = new Map();
  }

  async getSourceMap(file: string): Promise<SourceMapConsumer | undefined> {
    const { _sourceMap: sourceMap, _rawSourceMapCache: rawMap } = this;

    if (sourceMap.has(file)) {
      return sourceMap.get(file)!;
    }

    const rawData = rawMap.get(file);

    // There is no data, or illegal data.
    if (
      !rawData ||
      rawData.version < 0 ||
      !rawData.sourcesContent?.[0] ||
      !rawData.mappings
    ) {
      return Promise.resolve(undefined);
    }

    try {
      const result = await new SourceMapConsumer(rawData);
      sourceMap.set(file, result);
      return result;
    } catch (e) {
      // TODO: Specific errors need to be checked.
      return Promise.resolve(undefined);
    }
  }

  reportSourceMap(data: RawSourceMap): void {
    this._rawSourceMapCache.set(data.file, data);
  }

  reportConfiguration(config: SDK.ConfigData[0]) {
    this._configs.push(config);
    this.onDataReport();
  }

  reportError(errors: Error[]) {
    errors.forEach((item) => {
      this._errors.push(
        DevToolError.from(item, {
          code: this.name,
        }),
      );
    });
    this.onDataReport();
  }

  reportLoader(data: SDK.LoaderData) {
    data.forEach((item) => {
      // find by resource.path
      let match = this._loader.find(
        (e) => e.resource.path === item.resource.path,
      );
      if (match) {
        match.loaders.push(...item.loaders);
      } else {
        match = item;
        this._loader.push(item);
      }

      match.loaders.sort((a, b) => {
        // default sort by call timestamp
        if (a.startAt !== b.startAt) {
          return a.startAt - b.startAt;
        }

        if (a.isPitch) {
          if (b.isPitch) {
            return a.loaderIndex - b.loaderIndex;
          }
          // [a, b]
          return -1;
        }

        if (b.isPitch) {
          // [b, a]
          return 1;
        }

        return b.loaderIndex - a.loaderIndex;
      });
    });
    this.onDataReport();
  }

  reportResolver(data: SDK.ResolverData): void {
    data.forEach((item) => this._resolver.push(item));
    this.onDataReport();
  }

  reportPlugin(data: SDK.PluginData): void {
    Object.keys(data).forEach((hook) => {
      if (!this._plugin[hook]) {
        this._plugin[hook] = data[hook];
      } else {
        data[hook].forEach((item) => {
          this._plugin[hook].push(item);
        });
      }
    });
    this.onDataReport();
  }

  reportModuleGraph(data: ModuleGraph): void {
    debug(() => `data size: ${data.size()}`, '[SDK.reportModuleGraph][start]');
    this._moduleGraph.fromInstance(data);
    this.createPackageGraph();
    this.onDataReport();
    debug(
      () => `sdk._moduleGraph size: ${this._moduleGraph.size()}`,
      '[SDK reportModuleGraph][end]',
    );
  }

  reportPackageGraph(data: PackageGraph): void {
    debug(() => '[SDK.reportPackageGraph][start]');
    if (!this._packageGraph) {
      this._packageGraph = data;
    }
    this.onDataReport();
    debug(
      () => `sdk._moduleGraph size: ${this._moduleGraph.size()}`,
      '[SDK reportPackageGraph][end]',
    );
  }

  reportChunkGraph(data: ChunkGraph): void {
    this._chunkGraph.addAsset(...data.getAssets());
    this._chunkGraph.addChunk(...data.getChunks());
    this._chunkGraph.addEntryPoint(...data.getEntryPoints());
    this.onDataReport();
  }

  reportSummaryData(part: Partial<SDK.SummaryData>): void {
    const keys = ['costs'] as Array<keyof SDK.SummaryData>;

    for (const key of keys) {
      const v = part[key];
      if (!v) continue;
      if (typeof v === 'object') {
        if (Array.isArray(v)) {
          (this._summary[key] as unknown[]) = [
            ...((this._summary[key] as Array<any>) || []),
            ...v,
          ];
        } else {
          (this._summary[key] as Common.PlainObject) = {
            ...((this._summary[key] as Common.PlainObject) || {}),
            ...(v as Common.PlainObject),
          };
        }
      } else {
        (this._summary[key] as unknown) = v;
      }
    }

    this.onDataReport();
  }

  reportTileHtml(tileReportHtml: string): void {
    this._tileReportHtml = tileReportHtml;
  }

  createPackageGraph() {
    debug(
      () => `sdk._moduleGraph size: ${this._moduleGraph.size()}`,
      '[SDK.createPackageGraph][start]',
    );
    if (!this._packageGraph) {
      const pkgGraph = PackageGraph.fromModuleGraph(
        this._moduleGraph,
        this.root,
        (path: string) => {
          try {
            const exists = File.fse.existsSync(path);
            if (exists) {
              debug(
                () =>
                  `sdk.PackageGraph package.json exists: ${exists}, path: ${path}`,
                '[SDK.createPackageGraph][load]',
              );
              return File.fse.readJSONSync(path);
            }
          } catch (error) {
            const { message, stack } = error as Error;
            debug(
              () =>
                `sdk.createPackageGraph error, path: ${path}, error message: ${
                  stack || message
                }`,
              '[SDK.createPackageGraph][error]',
            );
          }
        },
      );
      this._packageGraph = pkgGraph;
      debug(
        () =>
          `sdk._packageGraph packages: ${
            this._packageGraph.getPackages().length
          }`,
        '[SDK.createPackageGraph][end]',
      );
    }
  }

  public writeStore(options?: SDK.WriteStoreOptionsType) {
    debug(() => `sdk.writeStore has run.`, '[SDK.writeStore][end]');
    return this.saveManifest(this.getStoreData(), options || {});
  }

  public getStoreData(): SDK.BuilderStoreData {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const ctx = this;
    return {
      get hash() {
        return ctx.hash;
      },
      get root() {
        return ctx.root;
      },
      get envinfo() {
        return ctx._envinfo;
      },
      get pid() {
        return ctx.pid;
      },
      get errors() {
        return ctx._errors.map((err) => err.toData());
      },
      get configs() {
        return ctx._configs.slice();
      },
      get summary() {
        return { ...ctx._summary };
      },
      get resolver() {
        return ctx._resolver.slice();
      },
      get loader() {
        return ctx._loader.slice();
      },
      get moduleGraph() {
        return ctx._moduleGraph.toData({
          contextPath: ctx._configs?.[0]?.config?.context || '',
        });
      },
      get chunkGraph() {
        return ctx._chunkGraph.toData(ctx.type);
      },
      get moduleCodeMap() {
        return ctx._moduleGraph.toCodeData(ctx.type);
      },
      get plugin() {
        return { ...ctx._plugin };
      },
      get packageGraph() {
        return ctx._packageGraph
          ? ctx._packageGraph.toData()
          : {
              packages: [],
              dependencies: [],
            };
      },
      get otherReports() {
        return { tileReportHtml: ctx._tileReportHtml || '' };
      },
    };
  }

  public getManifestData(): Manifest.DoctorManifestWithShardingFiles {
    const dataValue = this.getStoreData();
    const data: Manifest.DoctorManifestWithShardingFiles = {
      client: {
        enableRoutes: this.getClientRoutes(),
      },
      data: Object.keys(dataValue).reduce((t, e) => {
        const _e = e as keyof SDK.BuilderStoreData;
        if (dataValue[_e] && typeof dataValue[_e] === 'object') {
          t[e] = [
            `${this.server.origin}${SDK.ServerAPI.API.LoadDataByKey}/${e}`,
          ];
        } else {
          t[e] = dataValue[_e];
        }

        return t;
      }, {} as Common.PlainObject) as unknown as Manifest.DoctorManifestWithShardingFiles['data'],
      __LOCAL__SERVER__: true,
      __SOCKET__URL__: this.server.socketUrl,
    };

    return data;
  }

  public getRuleContext(
    _options: SDK.RuntimeContextOptions,
  ): SDK.RuntimeContext {
    this.createPackageGraph();

    return {
      root: this.root,
      errors: this._errors.slice(),
      configs: this._configs.slice(),
      moduleGraph: this._moduleGraph,
      chunkGraph: this._chunkGraph,
      packageGraph: this._packageGraph,
      loader: this._loader.slice(),
      otherReports: { tileReportHtml: this._tileReportHtml || '' },
    };
  }

  public onDataReport(): void | Promise<void> {
    this.server.broadcast();
  }
}
