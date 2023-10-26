export enum DoctorClientUrlQuery {
  BundleDiffFiles = '__bundle_files__',
  ManifestFile = 'manifest',
}

export enum DoctorClientRoutes {
  Overall = '/overall',
  WebpackLoaderOverall = '/webpack/loaders/overall',
  WebpackLoaderAnalysis = '/webpack/loaders/analysis',
  ModuleResolve = '/module/resolve',
  WebpackPlugins = '/webpack/plugins',
  BundleSize = '/bundle/size',
  ModuleAnalyze = '/module/analyze',
  TreeShaking = '/treeshaking',
  BundleDiff = '/resources/bundle/diff',
  RuleIndex = '/resources/rules',
  Uploader = '/resources/uploader',
  EmoCheck = '/emo/check',
}

export enum DoctorClientDiffState {
  Equal = '-',
  Up = 'UP',
  Down = 'DOWN',
}

export interface DoctorClientAssetsDiffItem {
  size: {
    baseline: number;
    current: number;
  };
  count: {
    baseline: number;
    current: number;
  };
  percent: number;
  state: DoctorClientDiffState;
}

export interface DoctorClientAssetsDiffResult {
  all: {
    total: DoctorClientAssetsDiffItem;
  };
  js: {
    total: DoctorClientAssetsDiffItem;
    initial: DoctorClientAssetsDiffItem;
  };
  css: {
    total: DoctorClientAssetsDiffItem;
    initial: DoctorClientAssetsDiffItem;
  };
  imgs: {
    total: DoctorClientAssetsDiffItem;
  };
  html: {
    total: DoctorClientAssetsDiffItem;
  };
  media: {
    total: DoctorClientAssetsDiffItem;
  };
  fonts: {
    total: DoctorClientAssetsDiffItem;
  };
  /**
   * files exclude these extensions above
   */
  others: {
    total: DoctorClientAssetsDiffItem;
  };
}

interface AssetInfo {
  size: number;
  count: number;
  files: {
    path: string;
    size: number;
    initial: boolean;
    content: string | void;
  }[];
}

export interface DoctorClientAssetsSummary {
  all: {
    total: AssetInfo;
  };
  js: {
    total: AssetInfo;
    initial: AssetInfo;
  };
  css: {
    total: AssetInfo;
    initial: AssetInfo;
  };
  imgs: {
    total: AssetInfo;
  };
  html: {
    total: AssetInfo;
  };
  media: {
    total: AssetInfo;
  };
  fonts: {
    total: AssetInfo;
  };
  /**
   * files exclude these extensions above
   */
  others: {
    total: AssetInfo;
  };
}
