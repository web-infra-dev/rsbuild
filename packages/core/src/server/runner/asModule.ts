import type { Module, ModuleLinker, SyntheticModule } from 'node:vm';

const isModuleNamespaceObject = (
  value: unknown,
): value is Record<string, any> => {
  return Object.prototype.toString.call(value) === '[object Module]';
};

export const asModule = async (
  moduleExports: Record<string, any>,
  context: Record<string, any>,
  unlinked?: boolean,
): Promise<Module | SyntheticModule> => {
  const { Module, SyntheticModule } = await import('node:vm');

  if (moduleExports instanceof Module) {
    return moduleExports;
  }

  const exports = [...new Set(['default', ...Object.keys(moduleExports)])];

  const syntheticModule = new SyntheticModule(
    exports,
    () => {
      for (const name of exports) {
        if (name === 'default') {
          const defaultExport =
            isModuleNamespaceObject(moduleExports) && 'default' in moduleExports
              ? moduleExports.default
              : moduleExports;
          syntheticModule.setExport(name, defaultExport);
        } else {
          syntheticModule.setExport(name, moduleExports[name]);
        }
      }
    },
    { context },
  );

  if (unlinked) return syntheticModule;

  await syntheticModule.link((() => {}) as unknown as ModuleLinker);
  await syntheticModule.evaluate();
  return syntheticModule;
};
