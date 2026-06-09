import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// allowedRoles: array de roles con acceso por defecto
// allowedPermission: código de permiso BD que TAMBIÉN otorga acceso (coincide con MENU_ITEMS)
export const ProtectedRoute = ({ children, allowedRoles, allowedPermission }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#070b13]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-[#8DC63F]"></div>
          <p className="text-slate-400 font-medium">Verificando credenciales Kullki Wasi...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si no hay restricción de roles/permisos, permitir acceso
  if (!allowedRoles && !allowedPermission) return children;

  const userPerms = user.permissions || [];
  const isSuperUser = userPerms.includes('all');

  // SuperAdmin siempre tiene acceso
  if (isSuperUser) return children;

  // Acceso por rol hardcoded
  if (allowedRoles && allowedRoles.includes(user.role)) return children;

  // Acceso por permiso otorgado dinámicamente desde RBAC
  if (allowedPermission && userPerms.includes(allowedPermission)) return children;

  // Sin acceso: redirigir al dashboard
  return <Navigate to="/dashboard" replace />;
};
