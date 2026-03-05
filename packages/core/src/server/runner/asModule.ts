import type { Module, ModuleLinker, SyntheticModule } from 'node:vm';

const isModuleNamespaceObject = (moduleExports: Record<string, unknown>) =>
  Object.prototype.toString.call(moduleExports) === '[object Module]';

export const asModule = async (
  moduleExports: Record<string, unknown>,
  context: Record<string, unknown>,
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
