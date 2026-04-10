import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getInsumosApi, deleteInsumoApi } from '../api/insumos.api';
import { getMovimientosApi } from '../api/movimientos.api';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { getSocket } from '../lib/socket';
import { getStockStatus, formatDate } from '../lib/utils';
import type { Insumo } from '../types';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Navbar from '../components/layout/Navbar';
import FooterIMSS from '../components/layout/FooterIMSS';
import ToastContainer from '../components/ui/Toast';
import RegistroInsumos from './RegistroInsumos';
import { useEffect } from 'react';

export default function GestionInventario() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [editInsumo, setEditInsumo] = useState<Insumo | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [movExpanded, setMovExpanded] = useState(false);
  const MOV_PAGE_SIZE = 5;

  // Debounce de búsqueda
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Socket.io — actualización en tiempo real del inventario
  useEffect(() => {
    const socket = getSocket();
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ['insumos'] });
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
    };
    socket.on('inventario:actualizado', handler);
    return () => { socket.off('inventario:actualizado', handler); };
  }, [queryClient]);

  const { data: insumos = [], isLoading } = useQuery({
    queryKey: ['insumos', debouncedSearch],
    queryFn: () => getInsumosApi(debouncedSearch || undefined),
  });

  const { data: movimientos = [] } = useQuery({
    queryKey: ['movimientos'],
    queryFn: () => getMovimientosApi(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteInsumoApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insumos'] });
      addToast({ type: 'success', title: 'Insumo eliminado' });
      setDeleteId(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      addToast({ type: 'error', title: 'Error al eliminar', message: msg });
      setDeleteId(null);
    },
  });

  const handleEdit = useCallback((insumo: Insumo) => setEditInsumo(insumo), []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <ToastContainer />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-10">
        {/* Encabezado */}
        <div className="mb-6">
          <div className="relative flex items-center justify-center">
            <Link
              to="/menu"
              className="absolute left-0 p-1.5 text-[#006455] hover:bg-green-50 rounded-lg transition-colors"
              title="Volver al Menú Principal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-[#006455] uppercase tracking-wide">
              Gestión de Inventario y Alertas
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1 text-center">Visualización de Existencias en Tiempo Real</p>
        </div>

        {/* Buscador */}
        <div className="relative mb-4 max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar insumo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006455] focus:border-transparent bg-white"
          />
        </div>

        {/* Tabla de inventario */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Código</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Insumo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Existencia</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ubicación</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Caducidad</th>
                {user?.rol === 'admin' && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">Cargando...</td></tr>
              ) : insumos.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">No se encontraron insumos</td></tr>
              ) : insumos.map((insumo) => (
                <tr key={insumo.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{insumo.codigo}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{insumo.nombre}</td>
                  <td className="px-4 py-3 text-gray-700">{insumo.cantidad}</td>
                  <td className="px-4 py-3">
                    <Badge status={getStockStatus(insumo.cantidad)} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{insumo.ubicacion || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(insumo.fecha_caducidad)}</td>
                  {user?.rol === 'admin' && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(insumo)}
                          className="p-1.5 text-[#006455] hover:bg-green-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteId(insumo.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Historial de movimientos */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Historial de Movimientos</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Insumo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ubicación</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cantidad</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nota</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {movimientos.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-6 text-gray-400">Sin movimientos registrados</td></tr>
                ) : (movExpanded ? movimientos : movimientos.slice(0, MOV_PAGE_SIZE)).map((mov) => (
                  <tr key={mov.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(mov.fecha.replace(' ', 'T')).toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${mov.tipo === 'entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {mov.tipo.charAt(0).toUpperCase() + mov.tipo.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{mov.insumo_nombre}</td>
                    <td className="px-4 py-3 text-gray-600">{mov.insumo_ubicacion || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{mov.cantidad}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{mov.nota || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{mov.usuario_nombre}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Barra de expandir/contraer */}
            {movimientos.length > MOV_PAGE_SIZE && (
              <button
                onClick={() => setMovExpanded((prev) => !prev)}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-[#006455] font-medium hover:bg-gray-50 border-t border-gray-100 transition-colors"
              >
                {movExpanded ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    Mostrar menos
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Mostrar todos ({movimientos.length} movimientos)
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </main>

      {/* Modal Editar */}
      <Modal
        open={editInsumo !== null}
        onClose={() => setEditInsumo(null)}
        title="Editar Insumo"
      >
        {editInsumo && (
          <RegistroInsumos
            isEdit
            initialData={{
              ...editInsumo,
              descripcion: editInsumo.descripcion ?? undefined,
              ubicacion: editInsumo.ubicacion ?? undefined,
              fecha_caducidad: editInsumo.fecha_caducidad ?? undefined,
            }}
            onSuccess={() => setEditInsumo(null)}
          />
        )}
      </Modal>

      {/* Modal Confirmar Eliminar */}
      <Modal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Confirmar Eliminación"
      >
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-gray-700 mb-6">¿Estás seguro de eliminar este insumo? Esta acción no se puede deshacer.</p>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>

      <FooterIMSS />
    </div>
  );
}
