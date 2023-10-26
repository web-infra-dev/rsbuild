export function isPackagePath(path: string) {
  return /(^|[/\\])node_modules[/\\]/.test(path);
}
