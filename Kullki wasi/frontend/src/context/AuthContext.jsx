import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api/apiClient';
import { agencyKey } from '../utils/agencyStorage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('kw_user');
    localStorage.removeItem('kw_token');
    setUser(null);
  };

  useEffect(() => {
    // Restaurar sesión activa y refrescar permisos desde la BD
    const storedUser = localStorage.getItem('kw_user');
    const storedToken = localStorage.getItem('kw_token');

    if (storedUser && storedToken) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        // Refrescar permisos y datos de agencia desde la BD en background
        apiClient.get(`/auth/permissions/${parsed.dni}`)
          .then(res => {
            const updated = {
              ...parsed,
              permissions: res.data.permissions,
              // Actualizar el nombre de la agencia desde BD (sin pisar un switch manual)
              agencyName: res.data.agencyName || parsed.agencyName,
            };
            localStorage.setItem('kw_user', JSON.stringify(updated));
            setUser(updated);
          })
          .catch(() => { /* falla silenciosa — usamos los permisos del localStorage */ });
      } catch (e) {
        localStorage.removeItem('kw_user');
        localStorage.removeItem('kw_token');
      }
    }
    setLoading(false);

    const handleExpired = () => {
      logout();
      navigate('/login?expired=true', { replace: true });
    };

    const handleForbidden = () => {
      navigate('/unauthorized', { replace: true });
    };

    window.addEventListener('auth:expired', handleExpired);
    window.addEventListener('auth:forbidden', handleForbidden);

    return () => {
      window.removeEventListener('auth:expired', handleExpired);
      window.removeEventListener('auth:forbidden', handleForbidden);
    };
  }, [navigate]);

  const login = async (cedula, password) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/login', {
        cedula,
        password
      });
      
      const { token, user: sessionUser } = response.data;
      
      localStorage.setItem('kw_user', JSON.stringify(sessionUser));
      localStorage.setItem('kw_token', token);
      setUser(sessionUser);

      // Registrar bitácora de login — aislada por agencia
      const loginLog = {
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        employeeId: sessionUser.id,
        name: sessionUser.name,
        role: sessionUser.role,
        agency: sessionUser.agency,
        area: "Plataforma Web",
        device: "Navegador Web",
        status: "Autorizado",
        details: `Inicio de sesión web exitoso.`,
        risk: "Bajo"
      };
      const logKey = agencyKey('kw_dynamic_logs', sessionUser.agency);
      const currentLogs = JSON.parse(localStorage.getItem(logKey) || '[]');
      localStorage.setItem(logKey, JSON.stringify([loginLog, ...currentLogs]));

      return sessionUser;
    } catch (error) {
      const msg = error.response?.data?.detail || "Error al conectar con el servidor";
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const loginAsRole = async (roleId) => {
    // Como ahora usamos BD, solo funcionará si sabemos las credenciales o hacemos un endpoint especial.
    // Para no romper el UI, mapeamos a nuestros dos usuarios creados:
    let cedula = "1712345678"; // empleado
    if (roleId === "admin" || roleId === "talento_humano") cedula = "0987654321"; // admin
    
    if (cedula === "0987654321") {
      return login(cedula, "admin123");
    }
    return login(cedula, "empleado123");
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.permissions.includes('all')) return true;
    return user.permissions.includes(permission);
  };

  const switchAgency = (agencyId, agencyName) => {
    const updated = { ...user, agency: agencyId, agencyDisplayName: agencyName };
    localStorage.setItem('kw_user', JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginAsRole, logout, hasPermission, switchAgency }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
