const { banWords } = require('cspell-ban-words');

module.exports = {
  version: '0.2',
  language: 'en',
  files: ['**/*.{ts,tsx,js,jsx,md,mdx}'],
  enableFiletypes: ['mdx'],
  ignoreRegExpList: [
    // ignore markdown anchors such as [modifyRsbuildConfig](#modifyrsbuildconfig)
    '#.*?\\)',
  ],
  ignorePaths: ['dist', 'dist-*', 'compiled', 'node_modules', 'pnpm-lock.yaml'],
  flagWords: banWords,
  dictionaries: ['dictionary'],
  dictionaryDefinitions: [
    {
      name: 'dictionary',
      path: './.cspell/dictionary.txt',
      addWords: true,
    },
  ],
};
