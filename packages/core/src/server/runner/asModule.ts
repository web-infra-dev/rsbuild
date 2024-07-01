import vm from 'node:vm';

const SYNTHETIC_MODULES_STORE = '__SYNTHETIC_MODULES_STORE';

export const asModule = async (
  something: Record<string, any>,
  context: Record<string, any>,
  unlinked?: boolean,
): Promise<vm.SourceTextModule> => {
  if (something instanceof vm.Module) {
    return something;
  }
  context[SYNTHETIC_MODULES_STORE] = context[SYNTHETIC_MODULES_STORE] || [];
  const i = context[SYNTHETIC_MODULES_STORE].length;
  context[SYNTHETIC_MODULES_STORE].push(something);
  const code = [...new Set(['default', ...Object.keys(something)])]
    .map(
      (name) =>
        `const _${name} = ${SYNTHETIC_MODULES_STORE}[${i}]${
          name === 'default' ? '' : `[${JSON.stringify(name)}]`
        }; export { _${name} as ${name}};`,
    )
    .join('\n');
  const m = new vm.SourceTextModule(code, {
    context,
  });
  if (unlinked) return m;
  await m.link((() => {}) as () => vm.Module);
  // @ts-expect-error copy from webpack
  if (m.instantiate) m.instantiate();
  await m.evaluate();
  return m;
};
