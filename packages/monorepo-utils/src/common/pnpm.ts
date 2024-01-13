import path from 'path';
import { fse } from '@rsbuild/shared';
import { load } from 'js-yaml';
import glob, { type Options as GlobOptions } from 'fast-glob';
import pMap from 'p-map';
import { Project } from '../project/project';
import { PNPM_WORKSPACE_FILE, PACKAGE_JSON } from '../constants';
import { readPackageJson } from '../utils';
import type { IPnpmWorkSpace } from '../types';

export const getPatternsFromYaml = async (monorepoRoot: string) => {
  const workspaceYamlFilePath = path.join(monorepoRoot, PNPM_WORKSPACE_FILE);
  const yamlContent = await fse.readFile(workspaceYamlFilePath, 'utf8');
  const pnpmWorkspace = load(yamlContent) as IPnpmWorkSpace;
  return pnpmWorkspace.packages || [];
};

export const normalize = (results: string[]) =>
  results.map((fp: string) => path.normalize(fp));

const getGlobOpts = (rootPath: string, patterns: string[]): GlobOptions => {
  const globOpts: GlobOptions = {
    cwd: rootPath,
    absolute: true,
    followSymbolicLinks: false,
  };

  if (patterns.some((cfg: string) => cfg.includes('**') || cfg.includes('*'))) {
    globOpts.ignore = [
      // allow globs like "packages/**" or "packages/*",
      // but avoid picking up node_modules/**/package.json and dist/**/package.json
      '**/dist/**',
      '**/node_modules/**',
    ];
  }

  return globOpts;
};

export const makeFileFinder = (rootPath: string, patterns: string[]) => {
  const globOpts = getGlobOpts(rootPath, patterns);

  return async <FileMapperType>(
    fileName: string,
    fileMapper: (filepath: string[]) => Promise<FileMapperType[]>,
    customGlobOpts: GlobOptions = {},
  ) => {
    const options = { ...customGlobOpts, ...globOpts };

    let result = await glob(
      patterns.map((globPath) => path.posix.join(globPath, fileName)),
      options,
    );

    // fast-glob does not respect pattern order, so we re-sort by absolute path
    result = result.sort();
    // POSIX results always need to be normalized
    result = normalize(result);

    return await fileMapper(result);
  };
};

export const readPnpmProjects = async (
  monorepoRoot: string,
  patterns: string[],
) => {
  const finder = makeFileFinder(monorepoRoot, patterns);
  const mapper = async (pkgJsonFilePath: string) => {
    const pkgJson = await readPackageJson(pkgJsonFilePath);
    return {
      dir: path.dirname(pkgJsonFilePath),
      manifest: pkgJson,
    };
  };
  const projects = await finder(
    PACKAGE_JSON,
    (filePaths) =>
      pMap(filePaths, mapper, {
        concurrency: filePaths.length || Infinity,
      }),
    {},
  );
  return projects;
};

export const getProjects = async (monorepoRoot: string): Promise<Project[]> => {
  const patterns = await getPatternsFromYaml(monorepoRoot);
  const pnpmProjects = await readPnpmProjects(monorepoRoot, patterns);

  return Promise.all(
    pnpmProjects
      .filter((p) => p.manifest.name)
      .map(async (p) => {
        const project = new Project(p.manifest.name, p.dir);
        await project.init();
        return project;
      }),
  );
};
