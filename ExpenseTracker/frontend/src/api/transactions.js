import { api } from './client';

export const getTransactions = (query) => api.get('/transactions', { params: query }).then((r) => r.data);
export const getTransaction = (id) => api.get(`/transactions/${id}`).then((r) => r.data);
export const createTransaction = (input) => api.post('/transactions', input).then((r) => r.data);
export const updateTransaction = (id, input) => api.put(`/transactions/${id}`, input).then((r) => r.data);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`).then(() => undefined);
