import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const DEFAULT_CONFIG = {
  appName: "Turni Pro",
  primaryColor: "#6366f1",
  backgroundColor: "#0f172a",
  cycle: ['R', 'R', 'A', 'A', 'C', 'C', 'R', 'R', 'B', 'B'], // Default 10-day cycle
  baseDate: '2027-01-01',
  constraints: {
    A: { CT: 1, OP: 3 },
    B: { CT: 1, OP: 3 },
    C: { CT: 1, OP: 3 }
  },
  roles: [
    { id: 'CT', label: 'Capoturno', color: '#ef4444' },
    { id: 'OP', label: 'Operatore', color: '#64748b' },
    { id: 'SJ', label: 'Semi-Jolly', color: '#3b82f6' },
    { id: 'J', label: 'Jolly', color: '#f59e0b' }
  ],
  shifts: {
    A: { label: 'Mattina', time: '06:00 - 14:00' },
    B: { label: 'Notte', time: '22:00 - 06:00' },
    C: { label: 'Pomeriggio', time: '14:00 - 22:00' },
    R: { label: 'Riposo', time: '-' }
  },
  quotas: {
    jollyCt: 1,
    sjCt: 1,
    jollyOp: 3,
    sjOp: 3
  }
};

export const AppProvider = ({ children }) => {
  const [userRole, setUserRole] = useState('admin'); // 'admin' or 'viewer'
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('shift_pro_config');
    const parsed = saved ? JSON.parse(saved) : {};
    // Merge to ensure new properties like 'quotas' exist
    return { ...DEFAULT_CONFIG, ...parsed, quotas: { ...DEFAULT_CONFIG.quotas, ...(parsed.quotas || {}) } };
  });

  const [employees, setEmployees] = useState(() => {
    const saved = localStorage.getItem('shift_pro_employees');
    return saved ? JSON.parse(saved) : [];
  });

  const [exceptions, setExceptions] = useState(() => {
    const saved = localStorage.getItem('shift_pro_exceptions');
    return saved ? JSON.parse(saved) : [];
  });

  // Persistence
  useEffect(() => {
    localStorage.setItem('shift_pro_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('shift_pro_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('shift_pro_exceptions', JSON.stringify(exceptions));
  }, [exceptions]);

  const value = {
    userRole, setUserRole,
    config, setConfig,
    employees, setEmployees,
    exceptions, setExceptions
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);
