import { api } from './client';

export const getCategories = () => api.get('/categories').then((r) => r.data);
export const createCategory = (input) => api.post('/categories', input).then((r) => r.data);
export const updateCategory = (id, input) => api.put(`/categories/${id}`, input).then((r) => r.data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`).then(() => undefined);
