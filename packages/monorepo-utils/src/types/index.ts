import type { IsMonorepoFn } from '../common/isMonorepo';
import type { GetProjectsFunc } from '../common/getProjects';

export * from './packageJson';
export * from './rushJson';

export interface MonorepoAnalyzer {
  check: IsMonorepoFn;
  getProjects: GetProjectsFunc;
}

export interface IPnpmWorkSpace {
  packages: string[];
}
