import { SDK } from '@rsbuild/doctor-types';

export function getDataByPagination<T>(
  data: T[],
  pagination: SDK.ServerAPI.PaginationRequest,
): {
  data: T[];
  pagination: SDK.ServerAPI.PaginationResponse;
} {
  const { page = 1, pageSize = 1000 } = pagination;

  return {
    data: data.slice((page - 1) * pageSize, page * pageSize),
    pagination: {
      page,
      pageSize,
      hasNextPage: page <= 0 ? false : page * pageSize < data.length,
    },
  };
}
