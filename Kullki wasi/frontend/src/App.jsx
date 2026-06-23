import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRouter';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import RBAC from './pages/RBAC';
import QRScanner from './pages/QRScanner';
import RestrictedAreas from './pages/RestrictedAreas';
import AreaForm from './pages/AreaForm';
import Logs from './pages/Logs';
import Audit from './pages/Audit';
import Security from './pages/Security';
import Agencies from './pages/Agencies';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Events from './pages/Events';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Institutional Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            
            {/* Fallback to Dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            {/* Módulos */}
            <Route path="dashboard" element={<Dashboard />} />
            
            <Route path="employees" element={
              <ProtectedRoute allowedRoles={['admin', 'talento_humano']} allowedPermission="gestionar_usuarios">
                <Employees />
              </ProtectedRoute>
            } />

            <Route path="rbac" element={
              <ProtectedRoute allowedRoles={['admin']} allowedPermission="all">
                <RBAC />
              </ProtectedRoute>
            } />

            <Route path="qr-scanner" element={
              <ProtectedRoute allowedRoles={['admin', 'seguridad_fisica', 'jefe_agencia', 'tecnico_ti']} allowedPermission="modulo_control_qr">
                <QRScanner />
              </ProtectedRoute>
            } />

            <Route path="restricted-areas" element={
              <ProtectedRoute allowedRoles={['admin', 'riesgos', 'seguridad_fisica']} allowedPermission="modulo_areas_criticas">
                <RestrictedAreas />
              </ProtectedRoute>
            } />

            <Route path="restricted-areas/new" element={
              <ProtectedRoute allowedRoles={['admin', 'seguridad_fisica', 'tecnico_ti']} allowedPermission="modulo_areas_criticas">
                <AreaForm />
              </ProtectedRoute>
            } />

            <Route path="restricted-areas/edit/:areaId" element={
              <ProtectedRoute allowedRoles={['admin', 'seguridad_fisica', 'tecnico_ti']} allowedPermission="modulo_areas_criticas">
                <AreaForm />
              </ProtectedRoute>
            } />

            <Route path="logs" element={
              <ProtectedRoute allowedRoles={['admin', 'riesgos', 'auditor', 'tecnico_ti', 'seguridad_fisica']} allowedPermission="ver_reportes">
                <Logs />
              </ProtectedRoute>
            } />

            <Route path="audit" element={
              <ProtectedRoute allowedRoles={['admin', 'auditor', 'jefe_agencia']} allowedPermission="modulo_auditoria">
                <Audit />
              </ProtectedRoute>
            } />

            <Route path="security" element={
              <ProtectedRoute allowedRoles={['admin', 'riesgos', 'seguridad_fisica', 'auditor']} allowedPermission="modulo_areas_criticas">
                <Security />
              </ProtectedRoute>
            } />

            <Route path="agencies" element={
              <ProtectedRoute allowedRoles={['admin', 'jefe_agencia']}>
                <Agencies />
              </ProtectedRoute>
            } />

            <Route path="profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />

            <Route path="events" element={
              <ProtectedRoute allowedRoles={['admin']} allowedPermission="all">
                <Events />
              </ProtectedRoute>
            } />

            <Route path="settings" element={
              <ProtectedRoute allowedRoles={['admin']} allowedPermission="all">
                <Settings />
              </ProtectedRoute>
            } />

          </Route>

          {/* Catch All Redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
