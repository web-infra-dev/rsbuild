import type { ModuleLinker, SourceTextModule } from 'node:vm';

export const asModule = async (
  something: Record<string, any>,
  context: Record<string, any>,
  unlinked?: boolean,
): Promise<SourceTextModule> => {
  const { Module, SyntheticModule } = await import('node:vm');

  if (something instanceof Module) {
    return something;
  }

  const exports = [...new Set(['default', ...Object.keys(something)])];

  const module = new SyntheticModule(
    exports,
    () => {
      for (const name of exports) {
        module.setExport(
          name,
          name === 'default' ? something : something[name],
        );
      }
    },
    { context },
  );

  if (unlinked) return module;

  await module.link((() => {}) as unknown as ModuleLinker);
  await module.evaluate();
  return module;
};
