export type ApiSuccessResponse<TData> = {
  success: true;
  data: TData;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details: unknown[];
  };
};

export type ApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorResponse;
