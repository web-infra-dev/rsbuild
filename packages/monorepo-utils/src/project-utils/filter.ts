import type { Project } from '../project/project';
import { getExportsSourceDirs } from './getExportsSourceDirs';

export type Filter = FilterFunction;
export type FilterFunction = (
  projects: Project[],
) => Project[] | Promise<Project[]>;

export const defaultFilter: FilterFunction = (projects) => projects;

export const filterByField =
  (fieldName: string, checkExports?: boolean): FilterFunction =>
  (projects: Project[]) => {
    return projects.filter((p) => {
      return (
        fieldName in p.metaData ||
        (checkExports &&
          getExportsSourceDirs(p.metaData.exports || {}, fieldName).length)
      );
    });
  };
