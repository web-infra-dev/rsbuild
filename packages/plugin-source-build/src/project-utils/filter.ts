import type { Project } from '../project';
import type { ExportsConfig } from '../types/packageJson';

export type Filter = FilterFunction;
export type FilterFunction = (
  projects: Project[],
) => Project[] | Promise<Project[]>;

function hasExportsSourceField(
  exportsConfig: ExportsConfig,
  sourceField: string,
) {
  return (
    typeof exportsConfig[sourceField] === 'string' ||
    Object.values(exportsConfig).some(
      (moduleRules) =>
        typeof moduleRules === 'object' &&
        typeof moduleRules[sourceField] === 'string',
    )
  );
}

export const filterByField =
  (fieldName: string, checkExports?: boolean): FilterFunction =>
  (projects: Project[]) => {
    return projects.filter((p) => {
      return (
        fieldName in p.metaData ||
        (checkExports &&
          hasExportsSourceField(p.metaData.exports || {}, fieldName))
      );
    });
  };
