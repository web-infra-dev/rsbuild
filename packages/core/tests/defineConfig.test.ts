import path from 'node:path';
import ts from 'typescript';
import { toPosixPath } from '../src/helpers/path';

// The language service normalizes file names to posix separators, so the host
// has to use them too, otherwise the virtual file is missing from the program.
const projectDir = toPosixPath(path.join(import.meta.dirname, '..'));
const virtualFile = `${projectDir}/tests/defineConfig.virtual.ts`;

const compilerOptions: ts.CompilerOptions = {
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  target: ts.ScriptTarget.ES2022,
  strict: true,
  skipLibCheck: true,
  noEmit: true,
};

const getCompletions = (typed: string): string[] => {
  const source = [
    "import { defineConfig } from '../src/loadConfig';",
    '',
    'export default defineConfig({',
    "  mode: 'development',",
    `  ${typed}`,
    '});',
    '',
  ].join('\n');

  const position = source.lastIndexOf(`  ${typed}`) + `  ${typed}`.length;

  const host: ts.LanguageServiceHost = {
    getScriptFileNames: () => [virtualFile],
    getScriptVersion: () => '1',
    getScriptSnapshot: (fileName) => {
      if (fileName === virtualFile) {
        return ts.ScriptSnapshot.fromString(source);
      }
      const content = ts.sys.readFile(fileName);
      return content === undefined ? undefined : ts.ScriptSnapshot.fromString(content);
    },
    getCurrentDirectory: () => projectDir,
    getCompilationSettings: () => compilerOptions,
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
    directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories,
    realpath: ts.sys.realpath,
  };

  const service = ts.createLanguageService(host, ts.createDocumentRegistry());
  const completions = service.getCompletionsAtPosition(virtualFile, position, {});
  return completions?.entries.map((entry) => entry.name) ?? [];
};

describe('defineConfig', () => {
  it('should suggest config keys on an empty line', () => {
    const names = getCompletions('');
    expect(names).toContain('tools');
    expect(names).toContain('output');
    expect(names).toContain('source');
  });

  // Overloads that accept a config function must not take precedence over the
  // object form, otherwise a partially typed key makes overload resolution fall
  // back to the function signature and suggest `Function.prototype` members.
  it.each(['t', 'to', 'tool'])('should suggest config keys after typing "%s"', (typed) => {
    const names = getCompletions(typed);
    expect(names).toContain('tools');
    expect(names).not.toContain('apply');
    expect(names).not.toContain('prototype');
  });
});
