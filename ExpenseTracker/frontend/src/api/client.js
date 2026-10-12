import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5080/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

/** Turns any thrown value into a friendly message (understands ASP.NET ProblemDetails). */
export function getErrorMessage(err) {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return 'Cannot reach the server. Make sure the backend API is running.';
    }
    const data = err.response.data;
    if (data && data.errors && typeof data.errors === 'object') {
      const messages = Object.values(data.errors).flat();
      if (messages.length > 0) return messages.join(' ');
    }
    if (data && data.detail) return data.detail;
    if (data && data.title) return data.title;
    return `Request failed (HTTP ${err.response.status}).`;
  }
  return err instanceof Error ? err.message : 'Something went wrong.';
}
