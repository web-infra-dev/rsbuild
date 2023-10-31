import { DataWithUrl } from '../sdk/types';

export const transformDataUrls = (
  d: DataWithUrl[],
): Record<string, string[] | string> => {
  return d.reduce((t: { [key: string]: string[] | string }, item) => {
    t[item.name] = Array.isArray(item.files)
      ? item.files.map((e) => e.path)
      : item.files;
    return t;
  }, {});
};
