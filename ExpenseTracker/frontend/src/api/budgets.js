import { api } from './client';

export const getBudgets = (month, year) => api.get('/budgets', { params: { month, year } }).then((r) => r.data);
export const createBudget = (input) => api.post('/budgets', input).then((r) => r.data);
export const updateBudget = (id, input) => api.put(`/budgets/${id}`, input).then((r) => r.data);
export const deleteBudget = (id) => api.delete(`/budgets/${id}`).then(() => undefined);
