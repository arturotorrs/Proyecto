import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface Props {
  allowedRoles?: Array<'admin' | 'user' | 'viewer'>;
}

export default function ProtectedRoute({ allowedRoles }: Props) {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/menu" replace />;
  }

  return <Outlet />;
}
