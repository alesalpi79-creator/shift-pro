import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const DEFAULT_CONFIG = {
  appName: "Turni Pro",
  appTagline: "Motore AI Industriale",
  primaryColor: "#6366f1",
  backgroundColor: "#f8fafc",
  textColor: "#0f172a",
  sidebarTextColor: "#0f172a",
  glassColor: "#ffffff",
  glassOpacity: 0.85,
  cycle: ['A', 'A', 'C', 'C', 'B', 'B', 'R', 'R'], // Default 8-day cycle as per Excel
  cycleSJ: ['A', 'R', 'C', 'R', 'R', 'B', 'R', 'R', 'R'], // Semi-Jolly 9-day cycle as per Excel
  baseDate: '2026-08-01', // Starting from a known month
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
  shiftColors: {
    A: '#0ea5e9',
    B: '#8b5cf6',
    C: '#f59e0b',
    FE: '#eab308', // Giallo
    MA: '#ef4444', // Rosso
    RT: '#22c55e', // Verde
    DS: '#be123c', // Cremisi
    '104': '#7e22ce', // Viola
    CO: '#1d4ed8',  // Blu scuro
    G: '#14b8a6'    // Teal/Verde petrolio per Giornaliero
  },
  shifts: {
    A: { label: 'Mattina', time: '06:00 - 14:00' },
    B: { label: 'Notte', time: '22:00 - 06:00' },
    C: { label: 'Pomeriggio', time: '14:00 - 22:00' },
    R: { label: 'Riposo', time: '-' },
    G: { label: 'Giornaliero', time: '08:00 - 17:00' }
  },
  quotas: {
    jollyCt: 1,
    sjCt: 1,
    jollyOp: 3,
    sjOp: 3
  },
  serverUrl: "",
  showUnderstaffedAlert: true
};

export const AppProvider = ({ children }) => {
  const [userRole, setUserRole] = useState('admin');
  
  // Gestione Multi-Schema
  const [schedules, setSchedules] = useState(() => {
    const savedSchedules = localStorage.getItem('shift_pro_schedules');
    if (savedSchedules) return JSON.parse(savedSchedules);

    // Migrazione dai vecchi tasti se presenti
    const oldConfig = localStorage.getItem('shift_pro_config');
    const oldEmployees = localStorage.getItem('shift_pro_employees');
    const oldExceptions = localStorage.getItem('shift_pro_exceptions');

    const baseConfig = oldConfig ? { ...DEFAULT_CONFIG, ...JSON.parse(oldConfig) } : DEFAULT_CONFIG;
    
    const initialSchedule = {
      id: 'sch-' + Date.now(),
      name: 'Schema 1',
      config: baseConfig,
      employees: oldEmployees ? JSON.parse(oldEmployees) : [],
      exceptions: oldExceptions ? JSON.parse(oldExceptions) : []
    };
    return [initialSchedule];
  });

  const [activeScheduleId, setActiveScheduleId] = useState(() => {
    const savedId = localStorage.getItem('shift_pro_active_id');
    if (savedId && schedules.some(s => s.id === savedId)) return savedId;
    return schedules[0].id;
  });

  // Troviamo lo schema attivo
  const activeSchedule = schedules.find(s => s.id === activeScheduleId) || schedules[0];

  // Helper per aggiornare lo schema attivo
  const updateActiveSchedule = (updates) => {
    setSchedules(prev => prev.map(s => s.id === activeScheduleId ? { ...s, ...updates } : s));
  };

  // Funzioni per gestire gli schemi
  const addSchedule = (name = "Nuovo Schema") => {
    const newId = 'sch-' + Date.now();
    const newSchedule = {
      id: newId,
      name: name,
      config: DEFAULT_CONFIG,
      employees: [],
      exceptions: []
    };
    setSchedules(prev => [...prev, newSchedule]);
    setActiveScheduleId(newId);
    return newId;
  };

  const deleteSchedule = (id) => {
    if (schedules.length <= 1) {
      alert("Non puoi eliminare l'ultimo schema rimasto.");
      return;
    }
    if (window.confirm("Sei sicuro di voler eliminare definitivamente questo schema e tutti i suoi dati?")) {
      const newSchedules = schedules.filter(s => s.id !== id);
      setSchedules(newSchedules);
      if (activeScheduleId === id) {
        setActiveScheduleId(newSchedules[0].id);
      }
    }
  };

  const renameSchedule = (id, newName) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, name: newName } : s));
  };

  // Esposizione dati e setter compatibili con i componenti esistenti
  const config = activeSchedule.config;
  const setConfig = (updater) => {
    const newConfig = typeof updater === 'function' ? updater(activeSchedule.config) : updater;
    updateActiveSchedule({ config: newConfig });
  };

  const employees = activeSchedule.employees;
  const setEmployees = (updater) => {
    const newEmployees = typeof updater === 'function' ? updater(activeSchedule.employees) : updater;
    updateActiveSchedule({ employees: newEmployees });
  };

  const exceptions = activeSchedule.exceptions;
  const setExceptions = (updater) => {
    const newExceptions = typeof updater === 'function' ? updater(activeSchedule.exceptions) : updater;
    updateActiveSchedule({ exceptions: newExceptions });
  };

  // Persistenza
  useEffect(() => {
    localStorage.setItem('shift_pro_schedules', JSON.stringify(schedules));
    localStorage.setItem('shift_pro_active_id', activeScheduleId);
  }, [schedules, activeScheduleId]);

  // Gestione Trial e Pagamento
  const [isPro, setIsPro] = useState(() => {
    return localStorage.getItem('shift_pro_is_pro') === 'true';
  });

  const [trialStartDate, setTrialStartDate] = useState(() => {
    const saved = localStorage.getItem('shift_pro_trial_start');
    if (saved) return saved;
    const now = new Date().toISOString();
    localStorage.setItem('shift_pro_trial_start', now);
    return now;
  });

  // Persistenza isPro
  useEffect(() => {
    localStorage.setItem('shift_pro_is_pro', isPro);
  }, [isPro]);

  const value = {
    userRole, setUserRole,
    schedules, activeScheduleId, setActiveScheduleId,
    addSchedule, deleteSchedule, renameSchedule,
    config, setConfig,
    employees, setEmployees,
    exceptions, setExceptions,
    isPro, setIsPro,
    trialStartDate
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);
