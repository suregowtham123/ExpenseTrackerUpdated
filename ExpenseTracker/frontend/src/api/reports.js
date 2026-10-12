import { api } from './client';

export const getDashboardSummary = (month, year) =>
  api.get('/dashboard/summary', { params: { month, year } }).then((r) => r.data);

export const getMonthlyReport = (from, to) =>
  api.get('/reports/monthly', { params: { from, to } }).then((r) => r.data);

export const getCategoryBreakdown = (from, to, type) =>
  api.get('/reports/category-breakdown', { params: { from, to, type } }).then((r) => r.data);
