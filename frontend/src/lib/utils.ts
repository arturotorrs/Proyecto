import type { StockStatus } from '../types';

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function getStockStatus(cantidad: number, limite = 10): StockStatus {
  if (cantidad < 5) return 'critico';
  if (cantidad <= limite) return 'bajo';
  return 'suficiente';
}
