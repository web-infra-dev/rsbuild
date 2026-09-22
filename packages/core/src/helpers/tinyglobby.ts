import { cachedImport } from './cachedImport';

export const getTinyglobby: () => Promise<typeof import('tinyglobby')> =
  cachedImport(() => import(/* rspackChunkName: "tinyglobby" */ 'tinyglobby'));
