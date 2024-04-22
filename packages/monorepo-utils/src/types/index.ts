import type { GetProjectsFunc } from '../common/getProjects';
import type { IsMonorepoFn } from '../common/isMonorepo';

export * from './packageJson';
export * from './rushJson';

export interface MonorepoAnalyzer {
  check: IsMonorepoFn;
  getProjects: GetProjectsFunc;
}

export interface IPnpmWorkSpace {
  packages: string[];
}
