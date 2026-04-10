export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'user' | 'viewer';
}

export interface Insumo {
  id: number;
  nombre: string;
  descripcion: string | null;
  cantidad: number;
  ubicacion: string | null;
  fecha_registro: string;
  fecha_caducidad: string | null;
  codigo: string;
  created_at: string;
  updated_at: string;
}

export interface Movimiento {
  id: number;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  nota: string | null;
  fecha: string;
  user_id: number;
  insumo_id: number;
  usuario_nombre?: string;
  usuario_rol?: string;
  insumo_nombre?: string;
  insumo_codigo?: string;
  insumo_ubicacion?: string;
}

export interface AlertaConfig {
  id: number;
  user_id: number;
  insumo_id: number;
  limite_stock: number;
  frecuencia_valor: number;
  frecuencia_unidad: 'minutos' | 'horas' | 'dias';
  dias_caducidad: number;
  insumo_nombre?: string;
  insumo_codigo?: string;
  insumo_cantidad?: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export type StockStatus = 'suficiente' | 'bajo' | 'critico';
