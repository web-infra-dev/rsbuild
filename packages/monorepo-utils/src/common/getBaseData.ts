import path from 'node:path';
import type { MonorepoAnalyzer } from '../types';
import type { GetProjectsFunc } from './getProjects';
import { type IsMonorepoFn, isMonorepo } from './isMonorepo';

export interface IMonorepoBaseData {
  isMonorepo: boolean;
  type: string;
  rootPath: string;
  getProjects?: GetProjectsFunc;
}

export const getMonorepoBaseData = async (
  starFindPath: string,
  otherMonorepoAnalyzer?: Record<string, MonorepoAnalyzer>,
): Promise<IMonorepoBaseData> => {
  let repoIsMonorepo = false;
  let findPath = starFindPath;
  let type = '';
  let otherMonorepoChecks: Record<string, IsMonorepoFn> | undefined;
  if (otherMonorepoAnalyzer) {
    otherMonorepoChecks = otherMonorepoChecks ?? {};
    for (const [monoType, analyzer] of Object.entries(otherMonorepoAnalyzer)) {
      otherMonorepoChecks[monoType] = analyzer.check;
    }
  }

  while (true) {
    const result = await isMonorepo(findPath, otherMonorepoChecks);
    if (result.isMonorepo) {
      repoIsMonorepo = true;
      ({ type } = result);
      break;
    }

    // find system root path
    if (findPath === path.dirname(findPath)) {
      break;
    }

    findPath = path.dirname(findPath);
  }

  return {
    isMonorepo: repoIsMonorepo,
    rootPath: repoIsMonorepo ? findPath : '',
    type,
    getProjects: otherMonorepoAnalyzer?.[type]?.getProjects,
  };
};
