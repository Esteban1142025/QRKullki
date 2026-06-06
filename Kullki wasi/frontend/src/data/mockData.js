// Mock Data - Cooperativa Kullki Wasi
// Datos empresariales simulados para el Control de Accesos y Trazabilidad

export const ROLES = {
  admin: {
    id: "admin",
    name: "Administrador General",
    badgeColor: "bg-red-500/20 text-red-400 border-red-500/30",
    description: "Acceso total y configuración del sistema",
    permissions: ["all"]
  },
  talento_humano: {
    id: "talento_humano",
    name: "Talento Humano",
    badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    description: "Gestión de empleados, permisos laborales y reportes de asistencia",
    permissions: ["read_employees", "write_employees", "read_reports"]
  },
  riesgos: {
    id: "riesgos",
    name: "Oficial de Riesgos",
    badgeColor: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    description: "Evaluación de bitácoras de seguridad e incidentes de accesos",
    permissions: ["read_logs", "read_alerts", "write_security"]
  },
  seguridad_fisica: {
    id: "seguridad_fisica",
    name: "Seguridad Física",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    description: "Validación QR y control de garita",
    permissions: ["validate_qr", "read_alerts"]
  },
  auditor: {
    id: "auditor",
    name: "Auditor Interno",
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    description: "Consulta de bitácoras institucionales y trazabilidad completa",
    permissions: ["read_logs", "read_reports", "read_audit"]
  },
  jefe_agencia: {
    id: "jefe_agencia",
    name: "Jefe de Agencia",
    badgeColor: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    description: "Administración local de sucursal y autorización de accesos temporales",
    permissions: ["read_employees_local", "read_logs_local", "validate_qr_local"]
  },
  tecnico_ti: {
    id: "tecnico_ti",
    name: "Técnico TI",
    badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    description: "Gestión técnica de dispositivos QR, red, servidores y logs del sistema",
    permissions: ["read_logs"]
  },
  empleado: {
    id: "empleado",
    name: "Empleado",
    badgeColor: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    description: "Consulta de permisos propios y descarga de credencial QR",
    permissions: ["read_own_profile", "read_own_qr"]
  }
};

export const AGENCIES = [
  { id: "MAT", name: "Matriz Ambato", address: "Av. Celedonio Toledo & Quis Quis", phone: "(03) 282-1234", type: "Principal", status: "Activo" },
  { id: "PEL", name: "Agencia Pelileo", address: "Av. 22 de Julio & Padre Chacón", phone: "(03) 287-4567", type: "Sucursal", status: "Activo" },
  { id: "PIL", name: "Agencia Píllaro", address: "Calle Flores & Sucre", phone: "(03) 285-1122", type: "Sucursal", status: "Activo" },
  { id: "BAN", name: "Agencia Baños", address: "Av. Amazonas & Luis A. Martínez", phone: "(03) 288-5544", type: "Sucursal", status: "Activo" },
  { id: "SAL", name: "Agencia Salcedo", address: "Calle Belisario Quevedo & Sucre", phone: "(03) 272-6677", type: "Sucursal", status: "Activo" },
  { id: "QUI", name: "Agencia Quisapincha", address: "Plaza Central Quisapincha", phone: "(03) 244-8899", type: "Extensión", status: "Activo" }
];

export const AREAS = [
  { id: "BOV", name: "Bóveda Principal", riskLevel: "Crítico", status: "Protegido", allowedRoles: ["admin", "jefe_agencia", "seguridad_fisica"], schedule: "08:00 - 18:00" },
  { id: "SRV", name: "Cuarto de Servidores TI", riskLevel: "Alto", status: "Protegido", allowedRoles: ["admin", "tecnico_ti"], schedule: "24/7" },
  { id: "CAJ", name: "Área de Cajas", riskLevel: "Alto", status: "Protegido", allowedRoles: ["admin", "jefe_agencia", "empleado", "seguridad_fisica"], schedule: "08:30 - 17:00" },
  { id: "ARC", name: "Archivo General e Histórico", riskLevel: "Medio", status: "Monitoreado", allowedRoles: ["admin", "talento_humano", "auditor"], schedule: "08:00 - 17:00" },
  { id: "ADM", name: "Oficinas Administrativas", riskLevel: "Bajo", status: "Libre", allowedRoles: ["all"], schedule: "07:30 - 19:00" },
  { id: "PAR", name: "Parqueadero Institucional", riskLevel: "Bajo", status: "Libre", allowedRoles: ["all"], schedule: "24/7" }
];

export const EMPLOYEES = [
  {
    id: "KW-000",
    dni: "211208",
    name: "Dylonni",
    role: "admin",
    department: "Administración General",
    agency: "MAT",
    email: "dylonni@kullkiwasi.com.ec",
    status: "Activo",
    phone: "0999999999",
    qrCode: "KULLKIWASI-ADMIN-211208-000",
    photo: "https://i.pinimg.com/736x/8b/4f/f4/8b4ff44d856ee252fec92eb93e090df4.jpg",
    hireDate: "2020-01-01"
  },
  {
    id: "KW-001",
    dni: "1804293840",
    name: "Segundo Segundo Chango",
    role: "admin",
    department: "Tecnología e Información",
    agency: "MAT",
    email: "schango@kullkiwasi.com.ec",
    status: "Activo",
    phone: "0987654321",
    qrCode: "KULLKIWASI-ADMIN-1804293840-001",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    hireDate: "2018-03-01"
  },
  {
    id: "KW-002",
    dni: "1802956711",
    name: "Ana Isabel Masaquiza",
    role: "talento_humano",
    department: "Talento Humano",
    agency: "MAT",
    email: "amasaquiza@kullkiwasi.com.ec",
    status: "Activo",
    phone: "0991234567",
    qrCode: "KULLKIWASI-TH-1802956711-002",
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
    hireDate: "2020-07-15"
  },
  {
    id: "KW-003",
    dni: "1803159981",
    name: "Carlos Vinicio Toalombo",
    role: "riesgos",
    department: "Gestión de Riesgos",
    agency: "MAT",
    email: "ctoalombo@kullkiwasi.com.ec",
    status: "Activo",
    phone: "0992345678",
    qrCode: "KULLKIWASI-RIESGOS-1803159981-003",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    hireDate: "2019-11-01"
  },
  {
    id: "KW-004",
    dni: "1804981122",
    name: "Luis Franklin Guato",
    role: "seguridad_fisica",
    department: "Seguridad y Vigilancia",
    agency: "MAT",
    email: "lguato@kullkiwasi.com.ec",
    status: "Activo",
    phone: "0983456789",
    qrCode: "KULLKIWASI-SEG-1804981122-004",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    hireDate: "2021-02-15"
  },
  {
    id: "KW-005",
    dni: "1801245781",
    name: "Martha Elena Chimbo",
    role: "auditor",
    department: "Auditoría Interna",
    agency: "MAT",
    email: "mchimbo@kullkiwasi.com.ec",
    status: "Activo",
    phone: "0974567890",
    qrCode: "KULLKIWASI-AUDIT-1801245781-005",
    photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150",
    hireDate: "2017-05-10"
  },
  {
    id: "KW-006",
    dni: "1802998811",
    name: "José Manuel Lema",
    role: "jefe_agencia",
    department: "Operaciones Financieras",
    agency: "PEL",
    email: "jlema@kullkiwasi.com.ec",
    status: "Activo",
    phone: "0965678901",
    qrCode: "KULLKIWASI-JEFE-1802998811-006",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    hireDate: "2015-10-20"
  },
  {
    id: "KW-007",
    dni: "1805123456",
    name: "Darwin Xavier Pacari",
    role: "tecnico_ti",
    department: "Tecnología e Información",
    agency: "MAT",
    email: "dpacari@kullkiwasi.com.ec",
    status: "Activo",
    phone: "0996789012",
    qrCode: "KULLKIWASI-TI-1805123456-007",
    photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150",
    hireDate: "2022-09-01"
  },
  {
    id: "KW-008",
    dni: "1806334455",
    name: "María Carmen Pilamunga",
    role: "empleado",
    department: "Caja y Servicios",
    agency: "MAT",
    email: "mpilamunga@kullkiwasi.com.ec",
    status: "Activo",
    phone: "0981122334",
    qrCode: "KULLKIWASI-EMP-1806334455-008",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    hireDate: "2023-01-15"
  },
  {
    id: "KW-009",
    dni: "1807445566",
    name: "Esteban René Quinatoa",
    role: "empleado",
    department: "Negocios y Microcrédito",
    agency: "PIL",
    email: "equinatoa@kullkiwasi.com.ec",
    status: "Activo",
    phone: "0982233445",
    qrCode: "KULLKIWASI-EMP-1807445566-009",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
    hireDate: "2023-05-10"
  },
  {
    id: "KW-010",
    dni: "1808556677",
    name: "Rosa Verónica Yucailla",
    role: "empleado",
    department: "Caja y Servicios",
    agency: "BAN",
    email: "ryucailla@kullkiwasi.com.ec",
    status: "Inactivo",
    phone: "0983344556",
    qrCode: "KULLKIWASI-EMP-1808556677-010",
    photo: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150",
    hireDate: "2022-11-20"
  }
];

export const ACCESS_LOGS = [
  { id: "LOG-1001", timestamp: "2026-05-19T11:30:15-05:00", employeeId: "KW-001", name: "Segundo Segundo Chango", role: "admin", agency: "MAT", area: "Cuarto de Servidores TI", device: "Lector Servidores Matriz", status: "Autorizado", details: "Acceso normal de administrador.", risk: "Bajo" },
  { id: "LOG-1002", timestamp: "2026-05-19T11:25:40-05:00", employeeId: "KW-008", name: "María Carmen Pilamunga", role: "empleado", agency: "MAT", area: "Área de Cajas", device: "Torniquete Entrada Matriz", status: "Autorizado", details: "Ingreso al turno matutino.", risk: "Bajo" },
  { id: "LOG-1003", timestamp: "2026-05-19T11:15:22-05:00", employeeId: "KW-006", name: "José Manuel Lema", role: "jefe_agencia", agency: "PEL", area: "Bóveda Principal", device: "Torniquete Pelileo", status: "Autorizado", details: "Apertura diaria de bóveda de agencia.", risk: "Medio" },
  { id: "LOG-1004", timestamp: "2026-05-19T10:45:10-05:00", employeeId: "KW-009", name: "Esteban René Quinatoa", role: "empleado", agency: "PIL", area: "Cuarto de Servidores TI", device: "Torniquete Píllaro", status: "Denegado", details: "Código QR sin permisos para esta área.", risk: "Alto" },
  { id: "LOG-1005", timestamp: "2026-05-19T09:30:00-05:00", employeeId: "KW-010", name: "Rosa Verónica Yucailla", role: "empleado", agency: "BAN", area: "Oficinas Administrativas", device: "Torniquete Entrada Matriz", status: "Denegado", details: "Contrato inactivo. Acceso revocado.", risk: "Alto" },
  { id: "LOG-1006", timestamp: "2026-05-19T08:15:05-05:00", employeeId: "KW-004", name: "Luis Franklin Guato", role: "seguridad_fisica", agency: "MAT", area: "Bóveda Principal", device: "Lector Bóveda Matriz", status: "Autorizado", details: "Ronda de inspección matutina.", risk: "Bajo" },
  { id: "LOG-1007", timestamp: "2026-05-19T07:45:00-05:00", employeeId: "KW-002", name: "Ana Isabel Masaquiza", role: "talento_humano", agency: "MAT", area: "Oficinas Administrativas", device: "Torniquete Entrada Matriz", status: "Autorizado", details: "Ingreso puntual.", risk: "Bajo" },
  { id: "LOG-1008", timestamp: "2026-05-19T06:12:35-05:00", employeeId: "KW-009", name: "Esteban René Quinatoa", role: "empleado", agency: "PIL", area: "Oficinas Administrativas", device: "Torniquete Píllaro", status: "Denegado", details: "Acceso fuera del horario laboral establecido.", risk: "Medio" }
];

export const SECURITY_ALERTS = [
  { id: "ALT-201", timestamp: "2026-05-19T10:45:10-05:00", type: "Acceso No Autorizado", severity: "Crítica", area: "Cuarto de Servidores TI", agency: "Agencia Píllaro", details: "Empleado 'Esteban René Quinatoa' intentó escanear QR sin credenciales de sistemas.", isResolved: false, resolvedBy: "" },
  { id: "ALT-202", timestamp: "2026-05-19T09:30:00-05:00", type: "Credencial Bloqueada", severity: "Alta", area: "Oficinas Administrativas", agency: "Agencia Baños", details: "Intento de acceso con código QR perteneciente a empleada inactiva 'Rosa Verónica Yucailla'.", isResolved: false, resolvedBy: "" },
  { id: "ALT-203", timestamp: "2026-05-19T06:12:35-05:00", type: "Horario Violado", severity: "Media", area: "Oficinas Administrativas", agency: "Agencia Píllaro", details: "Escaneo de QR a las 06:12 AM por 'Esteban René Quinatoa', fuera de su rango laboral permitido (07:30 - 19:00).", isResolved: true, resolvedBy: "Luis Franklin Guato (Seguridad)" },
  { id: "ALT-204", timestamp: "2026-05-18T23:15:00-05:00", type: "Lector Desconectado", severity: "Alta", area: "Bóveda Principal", agency: "Agencia Salcedo", details: "El dispositivo terminal QR 'Lector Bóveda Salcedo' dejó de reportar latidos. Estado: Offline.", isResolved: true, resolvedBy: "Segundo Segundo Chango (Admin)" }
];

export const QR_DEVICES = [
  { id: "DEV-01", name: "Lector Acceso Matriz Principal", type: "Torniquete", agency: "MAT", area: "Oficinas Administrativas", ip: "192.168.10.25", status: "Online", lastPulse: "2026-05-19T11:44:50-05:00" },
  { id: "DEV-02", name: "Lector Bóveda Matriz", type: "Lector Biométrico/QR", agency: "MAT", area: "Bóveda Principal", ip: "192.168.10.26", status: "Online", lastPulse: "2026-05-19T11:44:12-05:00" },
  { id: "DEV-03", name: "Lector Servidores Matriz", type: "Lector QR de Seguridad", agency: "MAT", area: "Cuarto de Servidores TI", ip: "192.168.10.27", status: "Online", lastPulse: "2026-05-19T11:43:55-05:00" },
  { id: "DEV-04", name: "Torniquete Acceso Pelileo", type: "Torniquete", agency: "PEL", area: "Oficinas Administrativas", ip: "192.168.12.15", status: "Online", lastPulse: "2026-05-19T11:42:01-05:00" },
  { id: "DEV-05", name: "Torniquete Acceso Píllaro", type: "Torniquete", agency: "PIL", area: "Oficinas Administrativas", ip: "192.168.13.15", status: "Online", lastPulse: "2026-05-19T11:41:48-05:00" },
  { id: "DEV-06", name: "Lector Bóveda Salcedo", type: "Lector QR de Seguridad", agency: "SAL", area: "Bóveda Principal", ip: "192.168.14.20", status: "Offline", lastPulse: "2026-05-18T23:15:00-05:00" }
];
