import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createInsumoApi } from '../api/insumos.api';
import { useToastStore } from '../store/toastStore';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Navbar from '../components/layout/Navbar';
import FooterIMSS from '../components/layout/FooterIMSS';
import ToastContainer from '../components/ui/Toast';

const today = new Date().toISOString().split('T')[0];

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  cantidad: z.coerce.number().int().min(0, 'La cantidad no puede ser negativa'),
  ubicacion: z.string().min(1, 'La ubicación es requerida'),
  fecha_registro: z.string().min(1, 'La fecha de registro es requerida'),
  fecha_caducidad: z
    .string()
    .min(1, 'La fecha de caducidad es requerida')
    .refine((v) => v >= today, { message: 'La caducidad no puede ser anterior a hoy' }),
  codigo: z.string().min(1, 'El código es requerido'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  initialData?: Partial<FormData> & { id?: number };
  onSuccess?: () => void;
  isEdit?: boolean;
}

export default function RegistroInsumos({ initialData, onSuccess, isEdit = false }: Props) {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: initialData
      ? {
          ...initialData,
          fecha_registro: initialData.fecha_registro?.split('T')[0] || today,
          fecha_caducidad: initialData.fecha_caducidad?.split('T')[0] || '',
          cantidad: initialData.cantidad ?? 0,
        }
      : {
          fecha_registro: today,
          cantidad: 0,
        },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (isEdit && initialData?.id) {
        const { updateInsumoApi } = await import('../api/insumos.api');
        return updateInsumoApi(initialData.id, data);
      }
      return createInsumoApi(data as Parameters<typeof createInsumoApi>[0]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insumos'] });
      addToast({
        type: 'success',
        title: isEdit ? 'Insumo actualizado' : 'Insumo registrado',
        message: isEdit ? 'Los datos han sido actualizados' : 'El insumo fue agregado al inventario',
      });
      if (!isEdit) reset({ fecha_registro: today, cantidad: 0 });
      onSuccess?.();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      addToast({ type: 'error', title: 'Error', message: msg || 'No se pudo guardar el insumo' });
    },
  });

  const form = (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Nombre *"
          placeholder="Ej: Vendajes Elásticos"
          error={errors.nombre?.message}
          {...register('nombre')}
        />
        <Input
          label="Código *"
          placeholder="Ej: VE-001"
          error={errors.codigo?.message}
          {...register('codigo')}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Descripción</label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006455] focus:border-transparent resize-none"
          rows={2}
          placeholder="Descripción del insumo (opcional)"
          {...register('descripcion')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Cantidad *"
          type="number"
          min={0}
          error={errors.cantidad?.message}
          {...register('cantidad')}
        />
        <Input
          label="Ubicación *"
          placeholder="Ej: Almacén A - Estante 1"
          error={errors.ubicacion?.message}
          {...register('ubicacion')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Fecha de Registro *"
          type="date"
          error={errors.fecha_registro?.message}
          {...register('fecha_registro')}
        />
        <Input
          label="Fecha de Caducidad *"
          type="date"
          min={today}
          error={errors.fecha_caducidad?.message}
          {...register('fecha_caducidad')}
        />
      </div>

      <Button
        type="submit"
        loading={mutation.isPending}
        size="lg"
        className="w-full uppercase tracking-wider mt-2"
      >
        {isEdit ? 'Guardar Cambios' : 'Guardar Registro'}
      </Button>
    </form>
  );

  if (isEdit) return form;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <ToastContainer />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-xl font-bold text-center text-[#006455] uppercase tracking-wide mb-6">
            Registro de Insumos
          </h1>
          {form}
          <div className="mt-4 text-center">
            <Link to="/menu" className="text-sm text-[#006455] hover:underline">
              ← Volver al Menú Principal
            </Link>
          </div>
        </div>
      </main>

      <FooterIMSS />
    </div>
  );
}
