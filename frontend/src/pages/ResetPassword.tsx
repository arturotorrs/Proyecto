import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { resetPasswordApi } from '../api/auth.api';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import FooterIMSS from '../components/layout/FooterIMSS';

const schema = z
  .object({
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError('');
    try {
      await resetPasswordApi(token, data.password);
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setServerError(msg || 'Ocurrió un error. Intenta de nuevo.');
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">

        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#006455] mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#006455] uppercase tracking-wide">
            Inventario de Insumos
          </h1>
          <p className="text-sm text-gray-500 mt-1">IMSS — Traumatología</p>
        </div>

        <div className="bg-white rounded-xl shadow-md w-full max-w-md p-8">

          {/* Token inválido / no presente */}
          {!token ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mb-4">
                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Enlace inválido</h2>
              <p className="text-sm text-gray-500 mb-6">
                Este enlace no es válido o ha expirado. Solicita uno nuevo.
              </p>
              <Link to="/forgot-password" className="text-sm text-[#006455] hover:underline font-medium">
                Solicitar nuevo enlace
              </Link>
            </div>

          ) : done ? (
            /* ── Éxito ── */
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-4">
                <svg className="w-7 h-7 text-[#006455]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Contraseña actualizada</h2>
              <p className="text-sm text-gray-500 mb-6">
                Tu contraseña fue restablecida correctamente.
                Serás redirigido al inicio de sesión en unos segundos.
              </p>
              <Link to="/login" className="text-sm text-[#006455] hover:underline font-medium">
                Ir al inicio de sesión →
              </Link>
            </div>

          ) : (
            /* ── Formulario ── */
            <>
              <h2 className="text-xl font-semibold text-gray-800 text-center mb-2">
                Nueva contraseña
              </h2>
              <p className="text-sm text-gray-500 text-center mb-6">
                Elige una contraseña segura de al menos 6 caracteres.
              </p>

              {serverError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-lg text-red-700 text-sm">
                  {serverError}{' '}
                  {serverError.toLowerCase().includes('expirado') && (
                    <Link to="/forgot-password" className="underline font-medium">
                      Solicitar nuevo enlace
                    </Link>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <Input
                  label="Nueva contraseña"
                  type="password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register('password')}
                />
                <Input
                  label="Confirmar contraseña"
                  type="password"
                  placeholder="••••••••"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
                <Button
                  type="submit"
                  loading={isSubmitting}
                  size="lg"
                  className="w-full mt-2 uppercase tracking-wider"
                >
                  Restablecer contraseña
                </Button>
              </form>
            </>
          )}
        </div>
      </div>

      <FooterIMSS />
    </div>
  );
}
