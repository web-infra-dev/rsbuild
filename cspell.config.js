import { banWords } from 'cspell-ban-words';

export default {
  version: '0.2',
  language: 'en',
  files: ['**/*.{ts,tsx,js,jsx,md,mdx}'],
  enableFiletypes: ['mdx'],
  ignoreRegExpList: [
    // ignore markdown anchors such as [modifyRsbuildConfig](#modifyrsbuildconfig)
    '#.*?\\)',
    // ignore custom anchor declarations such as ## createRsbuild \{#creatersbuild}
    '\\\\\\{#[^}]+\\}',
  ],
  ignorePaths: [
    'dist',
    'dist-*',
    'compiled',
    'coverage',
    'doc_build',
    'node_modules',
    'pnpm-lock.yaml',
    '.agents/skills',
    'README.pt-BR.md',
  ],
  flagWords: banWords,
  dictionaries: ['dictionary'],
  dictionaryDefinitions: [
    {
      name: 'dictionary',
      path: './scripts/dictionary.txt',
      addWords: true,
    },
  ],
};
