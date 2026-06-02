import React from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardAdmin from './DashboardAdmin';
import DashboardEmpleado from './DashboardEmpleado';

const Dashboard = () => {
  const { user } = useAuth();
  
  // El rol 'empleado' es el usuario final. Ellos solo ven sus permisos asignados.
  if (user?.role === 'empleado') {
    return <DashboardEmpleado />;
  }

  // Cualquier otro rol (admin, recursos_humanos, seguridad, etc.) ve el dashboard administrativo
  return <DashboardAdmin />;
};

export default Dashboard;
