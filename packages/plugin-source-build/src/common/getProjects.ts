import type { Project } from '../project';
import type { IMonorepoBaseData } from './getBaseData';

export type GetProjectsFunc = (
  rootPath: string,
) => Promise<Project[]> | Project[];

export const getMonorepoSubProjects = async (
  monorepoBaseData: IMonorepoBaseData,
): Promise<Project[]> => {
  const { type, rootPath, getProjects } = monorepoBaseData;
  if (type === 'pnpm') {
    const { getProjects: getPnpmMonorepoSubProjects } = await import('./pnpm');
    return getPnpmMonorepoSubProjects(rootPath);
  }

  if (type === 'rush') {
    const { getProjects: getRushMonorepoSubProjects } = await import('./rush');
    return getRushMonorepoSubProjects(rootPath);
  }

  if (getProjects) {
    return getProjects(rootPath);
  }

  return [];
};
