import apiClient from '../lib/axios';
import type { Movimiento } from '../types';

export const getMovimientosApi = (insumo_id?: number) =>
  apiClient.get<Movimiento[]>('/movimientos', { params: insumo_id ? { insumo_id } : {} }).then((r) => r.data);

interface CreateMovimientoDto {
  tipo: 'entrada' | 'salida';
  insumo_id: number;
  cantidad: number;
  nota?: string;
  fecha?: string;
  fecha_caducidad?: string;
}

export const createMovimientoApi = (data: CreateMovimientoDto) =>
  apiClient.post('/movimientos', data).then((r) => r.data);
