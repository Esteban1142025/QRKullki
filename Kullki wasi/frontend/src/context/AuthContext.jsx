import React, { createContext, useContext, useState, useEffect } from 'react';
import { EMPLOYEES, ROLES } from '../data/mockData';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restaurar sesión activa
    const storedUser = localStorage.getItem('kw_user');
    const storedToken = localStorage.getItem('kw_token');
    
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('kw_user');
        localStorage.removeItem('kw_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (dniOrEmail, password) => {
    setLoading(true);
    // Simular un pequeño retardo de red (300ms)
    await new Promise(resolve => setTimeout(resolve, 300));

    // Buscar en la lista de empleados
    const employee = EMPLOYEES.find(
      emp => (emp.dni === dniOrEmail || emp.email.toLowerCase() === dniOrEmail.toLowerCase())
    );

    if (!employee) {
      setLoading(false);
      throw new Error("Usuario o número de cédula no registrado en la Cooperativa.");
    }

    if (employee.status !== "Activo") {
      setLoading(false);
      throw new Error("Su cuenta institucional está inactiva. Contacte a Talento Humano.");
    }

    // Simular validación de clave simple (cualquier contraseña o una específica)
    // Para facilidades de demo, aceptaremos "kullki123", el DNI, o cualquier clave de más de 4 caracteres
    if (password.length < 4) {
      setLoading(false);
      throw new Error("Contraseña incorrecta (min. 4 caracteres para pruebas).");
    }

    // Obtener detalles del rol correspondiente
    const roleDetails = ROLES[employee.role] || { id: "empleado", name: "Empleado", permissions: ["read_own_profile"] };
    
    const sessionUser = {
      ...employee,
      roleName: roleDetails.name,
      badgeColor: roleDetails.badgeColor,
      permissions: roleDetails.permissions
    };

    // Crear token JWT simulado
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify({ 
      sub: employee.id, 
      name: employee.name, 
      role: employee.role, 
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 2) // 2 horas
    }));
    const signature = "simulated_signature_kullkiwasi";
    const token = `${header}.${payload}.${signature}`;

    localStorage.setItem('kw_user', JSON.stringify(sessionUser));
    localStorage.setItem('kw_token', token);
    setUser(sessionUser);
    setLoading(false);

    // Registrar bitácora de login simulado
    const loginLog = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      employeeId: employee.id,
      name: employee.name,
      role: employee.role,
      agency: employee.agency,
      area: "Plataforma Web",
      device: "Navegador Web (Web App)",
      status: "Autorizado",
      details: `Inicio de sesión exitoso en la web como ${roleDetails.name}.`,
      risk: "Bajo"
    };

    // Guardar logs dinámicos en localStorage para persistencia en la simulación
    const currentLogs = JSON.parse(localStorage.getItem('kw_dynamic_logs') || '[]');
    localStorage.setItem('kw_dynamic_logs', JSON.stringify([loginLog, ...currentLogs]));

    return sessionUser;
  };

  const loginAsRole = async (roleId) => {
    // Buscar un empleado con este rol
    const employee = EMPLOYEES.find(emp => emp.role === roleId && emp.status === "Activo") || EMPLOYEES[0];
    return login(employee.dni, "kullki123");
  };

  const logout = () => {
    localStorage.removeItem('kw_user');
    localStorage.removeItem('kw_token');
    setUser(null);
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.permissions.includes('all')) return true;
    return user.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginAsRole, logout, hasPermission }}>
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
