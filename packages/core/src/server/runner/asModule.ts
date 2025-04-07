import vm from 'node:vm';

export const asModule = async (
  something: Record<string, any>,
  context: Record<string, any>,
  unlinked?: boolean,
): Promise<vm.SourceTextModule> => {
  if (something instanceof vm.Module) {
    return something;
  }

  const exports = [...new Set(['default', ...Object.keys(something)])];

  const m = new vm.SyntheticModule(
    exports,
    () => {
      for (const name of exports) {
        m.setExport(name, name === 'default' ? something : something[name]);
      }
    },
    {
      context,
    },
  );
  if (unlinked) return m;
  await m.link((() => {}) as () => vm.Module);
  // @ts-expect-error copy from webpack
  if (m.instantiate) m.instantiate();
  await m.evaluate();
  return m;
};
