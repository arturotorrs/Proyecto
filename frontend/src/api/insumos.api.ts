import apiClient from '../lib/axios';
import type { Insumo } from '../types';

export const getInsumosApi = (search?: string) =>
  apiClient.get<Insumo[]>('/insumos', { params: search ? { search } : {} }).then((r) => r.data);

export const getInsumoApi = (id: number) =>
  apiClient.get<Insumo>(`/insumos/${id}`).then((r) => r.data);

export const createInsumoApi = (data: Omit<Insumo, 'id' | 'created_at' | 'updated_at'>) =>
  apiClient.post<Insumo>('/insumos', data).then((r) => r.data);

export const updateInsumoApi = (id: number, data: Partial<Insumo>) =>
  apiClient.put<Insumo>(`/insumos/${id}`, data).then((r) => r.data);

export const deleteInsumoApi = (id: number) =>
  apiClient.delete(`/insumos/${id}`).then((r) => r.data);
