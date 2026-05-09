import { HttpErrorResponse } from '@angular/common/http';
import type { ApiErrorResponse } from '../api/api-response';

export const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof HttpErrorResponse) {
    const response = error.error as Partial<ApiErrorResponse> | null;
    return response?.error?.message ?? 'Request failed. Please try again.';
  }

  return 'Request failed. Please try again.';
};
