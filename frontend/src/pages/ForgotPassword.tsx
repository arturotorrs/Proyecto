import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { forgotPasswordApi } from '../api/auth.api';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import FooterIMSS from '../components/layout/FooterIMSS';

const schema = z.object({
  email: z.string().email('Ingresa un correo válido'),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError('');
    try {
      await forgotPasswordApi(data.email);
      setSent(true);
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
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#006455] uppercase tracking-wide">
            Inventario de Insumos
          </h1>
          <p className="text-sm text-gray-500 mt-1">IMSS — Traumatología</p>
        </div>

        <div className="bg-white rounded-xl shadow-md w-full max-w-md p-8">

          {sent ? (
            /* ── Estado: correo enviado ── */
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-4">
                <svg className="w-7 h-7 text-[#006455]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Revisa tu correo</h2>
              <p className="text-sm text-gray-500 mb-6">
                Si el correo está registrado, recibirás un enlace para restablecer tu
                contraseña. El enlace expira en <strong>1 hora</strong>.
              </p>
              <Link
                to="/login"
                className="text-sm text-[#006455] hover:underline font-medium"
              >
                ← Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            /* ── Formulario ── */
            <>
              <h2 className="text-xl font-semibold text-gray-800 text-center mb-2">
                ¿Olvidaste tu contraseña?
              </h2>
              <p className="text-sm text-gray-500 text-center mb-6">
                Ingresa tu correo y te enviaremos un enlace para restablecerla.
              </p>

              {serverError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-lg text-red-700 text-sm">
                  {serverError}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <Input
                  label="Correo electrónico"
                  type="email"
                  placeholder="correo@imss.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
                <Button
                  type="submit"
                  loading={isSubmitting}
                  size="lg"
                  className="w-full mt-2 uppercase tracking-wider"
                >
                  Enviar enlace
                </Button>
              </form>

              <div className="mt-4 text-center">
                <Link to="/login" className="text-sm text-[#006455] hover:underline">
                  ← Volver al inicio de sesión
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      <FooterIMSS />
    </div>
  );
}
