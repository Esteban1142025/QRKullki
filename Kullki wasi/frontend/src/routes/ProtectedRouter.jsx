import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
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
    // Redirigir a login guardando la ubicación original
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirigir a la vista de no autorizado si no tiene el rol
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
