export interface PaginationRequest {
  page?: number;
  pageSize?: number;
}

export interface PaginationResponse extends Required<PaginationRequest> {
  hasNextPage: boolean;
}

export interface EnhanceWithPaginationResponse<T> {
  data: T;
  pagination: PaginationResponse;
}
