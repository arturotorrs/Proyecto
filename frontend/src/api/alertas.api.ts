import apiClient from '../lib/axios';
import type { AlertaConfig } from '../types';

export const getAlertasApi = () =>
  apiClient.get<AlertaConfig[]>('/alertas').then((r) => r.data);

export const saveAlertaApi = (data: Partial<AlertaConfig>) =>
  apiClient.post<AlertaConfig>('/alertas', data).then((r) => r.data);

export const saveAlertasBulkApi = (
  activar: Partial<AlertaConfig>[],
  desactivar: number[]
) =>
  apiClient
    .post<AlertaConfig[]>('/alertas/bulk', { activar, desactivar })
    .then((r) => r.data);

export const deleteAlertaApi = (id: number) =>
  apiClient.delete(`/alertas/${id}`).then((r) => r.data);
