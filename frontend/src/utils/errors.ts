import axios from 'axios';

import type { ApiError } from '../types/common';

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Cannot reach the server. Please check that the backend is running.';
    }
    const detail = (error.response.data as ApiError | undefined)?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return detail.map((item) => item.msg).join(', ');
  }
  return 'Something went wrong. Please try again.';
}
