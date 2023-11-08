declare module 'webpack-bundle-analyzer/lib/viewer' {
  export function generateReport(bundleStats: any, opts: any): Promise<void>;
}
