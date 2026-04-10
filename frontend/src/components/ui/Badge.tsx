import type { StockStatus } from '../../types';

const config: Record<StockStatus, { label: string; classes: string }> = {
  suficiente: { label: 'Suficiente', classes: 'bg-green-100 text-green-700' },
  bajo: { label: 'Bajo', classes: 'bg-yellow-100 text-yellow-700' },
  critico: { label: 'Crítico', classes: 'bg-red-100 text-red-700' },
};

interface Props {
  status: StockStatus;
}

export default function Badge({ status }: Props) {
  const { label, classes } = config[status];
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${classes}`}>
      {label}
    </span>
  );
}
