/** Share the pending import while allowing a failed import to be retried. */
export const cachedImport = <T>(
  importer: () => Promise<T>,
): (() => Promise<T>) => {
  let promise: Promise<T> | undefined;

  return () =>
    (promise ??= importer().catch((error: unknown) => {
      promise = undefined;
      throw error;
    }));
};

export const getTinyglobby: () => Promise<typeof import('tinyglobby')> =
  cachedImport(() => import(/* rspackChunkName: "tinyglobby" */ 'tinyglobby'));
