import fs from 'node:fs';
import path from 'node:path';
import { getMonorepoBaseData, getMonorepoSubProjects } from '../common';
import type { Project } from '../project';
import type { MonorepoAnalyzer } from '../types';
import { readPackageJson } from '../utils';
import type { Filter } from './filter';

export type ExtraMonorepoStrategies = Record<string, MonorepoAnalyzer>;

export interface GetDependentProjectsOptions {
  // Find the start of the monorepo root path
  cwd?: string;
  recursive?: boolean;
  filter?: Filter;
  extraMonorepoStrategies?: ExtraMonorepoStrategies;
}

async function pathExists(path: string) {
  return fs.promises
    .access(path)
    .then(() => true)
    .catch(() => false);
}

const getDependentProjects = async (
  projectNameOrRootPath: string,
  options: GetDependentProjectsOptions,
): Promise<Project[]> => {
  const {
    cwd = process.cwd(),
    recursive,
    filter,
    extraMonorepoStrategies,
  } = options;

  // check if first argument is projectRootPath.
  const currentProjectPkgJsonPath = path.join(
    projectNameOrRootPath,
    'package.json',
  );

  let projectName: string;
  if (await pathExists(currentProjectPkgJsonPath)) {
    ({ name: projectName } = await readPackageJson(currentProjectPkgJsonPath));
  } else {
    projectName = projectNameOrRootPath;
  }

  const monoBaseData = await getMonorepoBaseData(cwd, extraMonorepoStrategies);
  if (!monoBaseData.isMonorepo) {
    return [];
  }

  const projects = await getMonorepoSubProjects(monoBaseData);
  const currentProject = projects.find(
    (project) => project.name === projectName,
  );

  if (!currentProject) {
    return [];
  }

  let dependentProjects = currentProject.getDependentProjects(projects, {
    recursive,
  });
  if (filter) {
    dependentProjects = await filter(dependentProjects);
  }

  return dependentProjects;
};

export { getDependentProjects };
