import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from './context/AppContext';
import { calculateDailyShifts } from './logic/ShiftEngine';
import StaffManager from './components/StaffManager';
import RuleSettings from './components/RuleSettings';
import Onboarding from './components/Onboarding';
import ExportModule from './components/ExportModule';
import StatsDashboard from './components/StatsDashboard';
import './index.css';

// Component Icons (Simulated)
const IconCalendar = () => <span>📅</span>;
const IconUsers = () => <span>👥</span>;
const IconSettings = () => <span>⚙️</span>;
const IconUser = () => <span>👤</span>;
const IconStats = () => <span>📊</span>;

const isHoliday = (date) => {
  if (!date) return false;
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const y = date.getFullYear();

  const holidays = [
    {d: 1, m: 1}, {d: 6, m: 1}, {d: 25, m: 4}, {d: 1, m: 5},
    {d: 2, m: 6}, {d: 15, m: 8}, {d: 1, m: 11}, {d: 8, m: 12},
    {d: 25, m: 12}, {d: 26, m: 12}
  ];

  // Pasquetta 2026 (13 Aprile), 2027 (29 Marzo) - Semplificato per ora
  if (y === 2026 && d === 6 && m === 4) return true; // Pasquetta 2026 è il 6 Aprile (Lunedì dell'Angelo)
  // Nota: Pasquetta 2026 è in realtà il 6 Aprile.
  
  return holidays.some(h => h.d === d && h.m === m);
};

const Sidebar = ({ activeTab, setTab }) => {
  const { userRole, setUserRole, config, setConfig, employees, setEmployees, exceptions, setExceptions } = useApp();

  const handleExport = () => {
    const data = {
      config,
      employees,
      exceptions,
      exportDate: new Date().toISOString(),
      version: "21.1"
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shift-pro-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!data.config || !data.employees) throw new Error("File non valido");
        if (window.confirm("Attenzione: l'importazione sovrascriverà tutti i dati attuali. Continuare?")) {
          setConfig(data.config);
          setEmployees(data.employees);
          setExceptions(data.exceptions || []);
          alert("Dati importati con successo!");
          window.location.reload();
        }
      } catch (err) {
        alert("Errore nell'importazione: il file non sembra un backup valido.");
      }
    };
    reader.readAsText(file);
  };
  
  return (
    <div className="sidebar" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ 
          width: '32px', height: '32px', 
          background: config.primaryColor, 
          boxShadow: `0 0 15px ${config.primaryColor}88`,
          borderRadius: '8px', display: 'grid', placeItems: 'center', fontWeight: 'bold' 
        }}>{config.appName.charAt(0)}</div>
        <h2 style={{ fontSize: '1.2rem', letterSpacing: '-0.02em' }}>{config.appName}</h2>
      </div>

      <nav style={{ flex: 1 }}>
        <div className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setTab('calendar')}>
          <IconCalendar /> Calendario
        </div>
        {userRole === 'admin' && (
          <>
            <div className={`nav-item ${activeTab === 'staff' ? 'active' : ''}`} onClick={() => setTab('staff')}>
              <IconUsers /> Personale
            </div>
            <div className={`nav-item ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>
              <IconStats /> Statistiche
            </div>
            <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>
              <IconSettings /> Impostazioni
            </div>
          </>
        )}

        {config.appLogo && (
          <div style={{ marginTop: '3rem', padding: '1rem', textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '15px', border: '1px solid var(--glass-border)' }}>
            <img 
              src={config.appLogo} 
              alt="Azienda" 
              style={{ width: '100%', maxHeight: '120px', objectFit: 'contain', filter: 'drop-shadow(0 5px 15px rgba(0,0,0,0.2))' }} 
            />
          </div>
        )}
      </nav>

      <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', marginTop: 'auto' }}>
        <div 
          onClick={() => {
            if (userRole === 'admin') {
              setUserRole('viewer');
              if (activeTab === 'staff' || activeTab === 'settings') {
                setTab('calendar');
              }
            } else {
              const pwd = window.prompt("Inserisci la password di amministrazione:");
              if (pwd === "alesalpi79") {
                setUserRole('admin');
              } else if (pwd !== null) {
                alert("Password errata!");
              }
            }
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', cursor: 'pointer' }}
        >
          <IconUser /> Loggato come <strong style={{ color: 'white' }}>{userRole === 'admin' ? 'ADMIN' : 'USER'}</strong>
        </div>
        <button 
          onClick={() => {
            if (userRole === 'admin') {
              setUserRole('viewer');
              if (activeTab === 'staff' || activeTab === 'settings') {
                setTab('calendar');
              }
            } else {
              const pwd = window.prompt("Inserisci la password di amministrazione:");
              if (pwd === "alesalpi79") {
                setUserRole('admin');
              } else if (pwd !== null) {
                alert("Password errata!");
              }
            }
          }}
          className="btn-primary"
          style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--glass-border)', fontSize: '0.7rem' }}
        >
          {userRole === 'admin' ? 'Passa a Visualizzatore' : 'Passa a Amministratore'}
        </button>

        {userRole === 'admin' && (
          <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button 
              onClick={handleExport}
              className="btn-primary"
              style={{ padding: '0.4rem', fontSize: '0.65rem', background: 'var(--primary)', border: 'none' }}
              title="Salva backup dati"
            >
              📤 Backup
            </button>
            <label 
              className="btn-primary"
              style={{ padding: '0.4rem', fontSize: '0.65rem', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--glass-border)', textAlign: 'center', cursor: 'pointer' }}
              title="Ripristina dati da file"
            >
              📥 Ripristina
              <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

const DayDetails = ({ date, onClose, selectedEmployee = null, selection = [], onBatchUpdate = null }) => {
  const { employees, exceptions, setExceptions, config, userRole } = useApp();
  const shifts = useMemo(() => calculateDailyShifts(date, employees, exceptions, config), [employees, date, exceptions, config]);

  // Se è stato selezionato un dipendente specifico, filtriamo la lista
  const filteredShifts = useMemo(() => {
    if (!selectedEmployee) return shifts;
    return shifts.filter(s => s.name === selectedEmployee);
  }, [shifts, selectedEmployee]);

  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const updateShift = (employeeName, type) => {
    if (userRole !== 'admin') return;
    
    // Se c'è una selezione attiva, usiamo quella per un aggiornamento massivo
    if (selection && selection.length > 0) {
      setExceptions(prev => {
        let updated = [...prev];
        const toRemoveSet = new Set(selection);
        
        // Rimuoviamo le vecchie
        updated = updated.filter(ex => !toRemoveSet.has(`${ex.employee}|${ex.date}`));
        
        // Aggiungiamo le nuove
        if (type) {
          for (const key of selection) {
            const [name, d] = key.split('|');
            updated.push({ employee: name, date: d, type });
          }
        }
        return updated;
      });
      
      if (onBatchUpdate) onBatchUpdate(selection.length, type);
      return;
    }

    // Altrimenti aggiornamento singolo classico
    const existingException = exceptions.find(ex => ex.employee === employeeName && ex.date === dateStr);
    const filtered = exceptions.filter(ex => !(ex.employee === employeeName && ex.date === dateStr));
    
    if (existingException && existingException.type === type) {
      setExceptions(filtered);
    } else {
      setExceptions([...filtered, { employee: employeeName, date: dateStr, type }]);
    }
  };

  const renderGroup = (title, shiftList, titleColor) => {
    if (shiftList.length === 0) return null;
    return (
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '0.9rem', color: titleColor || 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${titleColor ? titleColor + '44' : 'var(--glass-border)'}`, paddingBottom: '0.25rem' }}>
          {title} ({shiftList.length})
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {shiftList.map(s => {
            const roleColor = config.roles.find(r => r.id === s.baseRole)?.color || 'white';
            return (
              <div key={s.name} className="glass-card" style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', color: roleColor }}>
                    {s.name}
                    {s.isJolly && <span style={{ fontSize: '0.6rem', padding: '1px 4px', background: 'var(--accent-warning)', color: 'white', borderRadius: '3px' }}>L</span>}
                    {s.isSJ && <span style={{ fontSize: '0.6rem', padding: '1px 4px', background: 'var(--primary)', color: 'white', borderRadius: '3px' }}>SJ</span>}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {s.baseRole} {userRole === 'admin' && s.baseRole === 'OP' ? `(SQ ${s.team})` : ''}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '240px' }}>
                  {['A', 'B', 'C', 'G', 'R', 'FE', 'MA', 'RT', 'DS', '104', 'CO', 'CF'].map(st => {
                    let bgColor = 'transparent';
                    const isSelected = s.finalShift === st;
                    if (isSelected) {
                      if (st === 'R') bgColor = 'rgba(255,255,255,0.15)';
                      else bgColor = config.shiftColors[st] || 'var(--primary)';
                    }
                    return (
                      <button 
                        key={st}
                        onClick={() => updateShift(s.name, st)}
                        data-shift={st}
                        style={{ 
                          width: '28px', height: '28px', borderRadius: '6px', border: isSelected ? '1px solid white' : '1px solid var(--glass-border)',
                          background: bgColor,
                          color: isSelected ? 'white' : 'var(--text-muted)',
                          fontSize: '0.65rem', fontWeight: 'bold', cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        title={config.shiftLabels?.[st] || st}
                      >
                        {config.shiftLabels?.[st] || st}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fade-in" style={{ position: 'fixed', top: 0, right: 0, width: '420px', height: '100vh', background: 'var(--bg-sidebar)', borderLeft: '1px solid var(--glass-border)', padding: '2rem', zIndex: 100, boxShadow: '-10px 0 30px rgba(0,0,0,0.5)', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem' }}>{date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
      </div>

      {(() => {
         let warnings = [];
         let info = [];
         ['A', 'B', 'C'].forEach(st => {
            const ctCount = shifts.filter(s => s.finalShift === st && s.baseRole === 'CT').length;
            const opCount = shifts.filter(s => s.finalShift === st && s.baseRole === 'OP').length;
            const reqCT = config.constraints?.[st]?.CT || 0;
            const reqOP = config.constraints?.[st]?.OP || 0;
            
            const shiftName = config.shiftLabels?.[st] || st;
            info.push({ shiftName, ctCount, opCount, reqCT, reqOP });

            if (ctCount < reqCT) warnings.push(`Turno ${shiftName}: Manca ${reqCT - ctCount} CT`);
            if (ctCount > reqCT) warnings.push(`Turno ${shiftName}: Esubero di ${ctCount - reqCT} CT`);
            if (opCount < reqOP) warnings.push(`Turno ${shiftName}: Mancano ${reqOP - opCount} OP`);
            if (opCount > reqOP) warnings.push(`Turno ${shiftName}: Esubero di ${opCount - reqOP} OP`);
         });
         
         return (
           <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
             {/* Riepilogo Copertura */}
             <div className="glass-card" style={{ padding: '0.75rem', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)' }}>
                {info.map((inf, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: i < 2 ? '4px' : 0 }}>
                    <span style={{ fontWeight: 'bold' }}>{inf.shiftName}:</span>
                    <span>{inf.ctCount} CT / {inf.opCount} OP</span>
                  </div>
                ))}
             </div>

             {/* Avvisi */}
             {warnings.length > 0 && (
               <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--accent-warning)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ color: 'var(--accent-warning)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>⚠️ Stato Copertura</h4>
                  <ul style={{ fontSize: '0.75rem', color: 'var(--text-main)', paddingLeft: '1.2rem', margin: 0 }}>
                     {warnings.map((w, i) => <li key={i} style={{ marginBottom: '0.2rem' }}>{w}</li>)}
                  </ul>
               </div>
             )}
           </div>
         );
      })()}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {renderGroup('Turno A (Mattina)', filteredShifts.filter(s => s.finalShift === 'A'), 'var(--shift-a)')}
        {renderGroup('Turno B (Notte)', filteredShifts.filter(s => s.finalShift === 'B'), 'var(--shift-b)')}
        {renderGroup('Turno C (Pomeriggio)', filteredShifts.filter(s => s.finalShift === 'C'), 'var(--shift-c)')}
        {renderGroup('Assenze Speciali', filteredShifts.filter(s => ['FE', 'MA', 'RT', 'DS', '104', 'CO', 'CF'].includes(s.finalShift)), 'var(--text-muted)')}
        {renderGroup('A Riposo / Jolly / Giornaliero', filteredShifts.filter(s => ['R', 'G'].includes(s.finalShift)), null)}
      </div>
    </div>
  );
};

const ShiftGridView = ({ days, employees, exceptions, config, onDayClick, selection, setSelection }) => {
  const { userRole, setExceptions } = useApp();
  const [isSelecting, setIsSelecting] = useState(false);
  const [toast, setToast] = useState(null);

  const selectionRef = useRef(selection);
  useEffect(() => { selectionRef.current = selection; }, [selection]);

  const getDateStr = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Gestione Scorciatoie da Tastiera
  useEffect(() => {
    const handleKeyDown = (e) => {
      const currentSelection = selectionRef.current;
      if (userRole !== 'admin' || currentSelection.length === 0) return;

      const keyMap = {
        'A': 'A', 'B': 'B', 'C': 'C', 'G': 'G', 'R': 'R',
        'F': 'FE', 'M': 'MA', 'P': 'RT', '1': '104', 'D': 'DS', 'S': 'DS',
        'a': 'A', 'b': 'B', 'c': 'C', 'g': 'G', 'r': 'R',
        'f': 'FE', 'm': 'MA', 'p': 'RT', 'd': 'DS', 's': 'DS'
      };
      
      const key = e.key;
      const isDelete = e.key === 'Delete' || e.key === 'Backspace';
      
      if (keyMap[key] || isDelete) {
        e.preventDefault();
        const type = isDelete ? null : keyMap[key];
        
        // Usiamo la stessa logica di DayDetails ma centralizzata
        const toProcess = [...currentSelection];
        
        setExceptions(prev => {
          const toRemoveSet = new Set(toProcess);
          const filtered = prev.filter(ex => !toRemoveSet.has(`${ex.employee}|${ex.date}`));
          if (!type) return filtered;
          const newEntries = toProcess.map(sel => {
            const [name, date] = sel.split('|');
            return { employee: name, date, type };
          });
          return [...filtered, ...newEntries];
        });

        setIsSelecting(false);
        setSelection([]); 
        showToast(type ? `Aggiornati ${toProcess.length} turni (${type})` : `Cancellati ${toProcess.length} turni`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setExceptions, userRole]);

  const handleMouseDown = (empName, date) => {
    if (userRole !== 'admin') return;
    const dStr = getDateStr(date);
    setIsSelecting(true);
    setSelection([`${empName}|${dStr}`]);
  };

  const handleMouseEnter = (empName, date) => {
    if (!isSelecting) return;
    const dStr = getDateStr(date);
    const key = `${empName}|${dStr}`;
    setSelection(prev => prev.includes(key) ? prev : [...prev, key]);
  };

  const toggleSelection = (empName, date) => {
    const dStr = getDateStr(date);
    const key = `${empName}|${dStr}`;
    setSelection(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  useEffect(() => {
    const handleMouseUp = () => {
      // Se abbiamo finito di selezionare, apriamo la finestra laterale
      if (isSelecting && selectionRef.current.length > 0) {
        const first = selectionRef.current[0];
        const [name, dStr] = first.split('|');
        const [y, m, d] = dStr.split('-').map(Number);
        onDayClick(new Date(y, m - 1, d), name);
      }
      setIsSelecting(false);
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isSelecting, onDayClick]);
  
  // Pre-filtriamo i giorni reali del mese per avere indici certi 0..30
  const realDays = useMemo(() => days.filter(d => d), [days]);

  const gridData = useMemo(() => {
    return realDays.map(date => {
      return calculateDailyShifts(date, employees, exceptions, config);
    });
  }, [realDays, employees, exceptions, config]);

  const visibleEmployees = useMemo(() => {
    return employees.filter(emp => {
      return gridData.some(dayShifts => {
        if (!dayShifts) return false;
        const s = dayShifts.find(x => x.name === emp.name);
        return s && (['A', 'B', 'C'].includes(s.finalShift) || s.isJolly || s.isSJ);
      });
      })
      .sort((a, b) => {
        if (a.role !== b.role) return a.role === 'CT' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }, [employees, gridData]);

  return (
    <div className="table-container fade-in" style={{ position: 'relative' }}>
      {toast && (
        <div style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: 'white', padding: '0.5rem 1.5rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', zIndex: 1000, boxShadow: '0 4px 15px rgba(0,0,0,0.3)', border: '1px solid white' }}>
          {toast}
        </div>
      )}
      <table className="shift-table">
        <thead>
          <tr>
            <th style={{ fontSize: '0.9rem', letterSpacing: '0.05em' }}>DIPENDENTE</th>
            {realDays.map((d, i) => {
              const dayShifts = gridData[i];
              let isUnderstaffed = false;
              let missingDesc = [];

              if (dayShifts && config.constraints) {
                 ['A', 'B', 'C'].forEach(st => {
                    const ctCount = dayShifts.filter(s => s.finalShift === st && s.baseRole === 'CT').length;
                    const opCount = dayShifts.filter(s => s.finalShift === st && s.baseRole === 'OP').length;
                    const reqCT = config.constraints?.[st]?.CT || 1;
                    const reqOP = config.constraints?.[st]?.OP || 3;
                    if (ctCount !== reqCT) {
                       isUnderstaffed = true;
                       missingDesc.push(`${config.shiftLabels?.[st] || st}: ${ctCount}/${reqCT} CT`);
                    }
                    if (opCount !== reqOP) {
                       isUnderstaffed = true;
                       missingDesc.push(`${config.shiftLabels?.[st] || st}: ${opCount}/${reqOP} OP`);
                    }
                 });
              }

              return (
                <th key={d.toISOString()} title={isUnderstaffed ? missingDesc.join(' | ') : 'Copertura OK'}
                  style={{ 
                    color: (isHoliday(d) || d.getDay() === 0 || d.getDay() === 6) ? 'var(--accent-warning)' : 'white',
                    borderTop: (d.getDay() === 0 || d.getDay() === 6 || isHoliday(d)) ? '3px solid var(--accent-warning)' : 'none'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', opacity: 0.9, marginBottom: '2px', fontWeight: '500' }}>
                    {d.toLocaleDateString('it-IT', { weekday: 'short' }).slice(0, 1).toUpperCase()}
                  </div>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: '800' }}>
                      {d.getDate()}
                    </span>
                    {isUnderstaffed && (
                      <span style={{ position: 'absolute', top: '-12px', right: '-15px', fontSize: '0.8rem' }}>⚠️</span>
                    )}
                  </div>
                </th>
              );
            })}
            {userRole === 'admin' && (
              <>
                <th style={{ background: 'var(--bg-sidebar)', color: 'var(--shift-a)', fontSize: '0.65rem' }}>A</th>
                <th style={{ background: 'var(--bg-sidebar)', color: 'var(--shift-b)', fontSize: '0.65rem' }}>B</th>
                <th style={{ background: 'var(--bg-sidebar)', color: 'var(--shift-c)', fontSize: '0.65rem' }}>C</th>
              </>
            )}
            <th style={{ background: 'var(--bg-sidebar)', color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.65rem' }}>Tot.</th>
          </tr>
        </thead>
        <tbody>
          {visibleEmployees.map((emp) => {
            const roleColor = config.roles?.find(r => r.id === emp.role)?.color || (emp.role === 'CT' ? '#ef4444' : (emp.role === 'OP' ? '#64748b' : config.primaryColor));
            
            // Calcolo conteggio per ogni tipologia di turno
            const counts = realDays.reduce((acc, _, i) => {
              const dayShifts = gridData[i];
              const empShift = dayShifts?.find(s => s.name === emp.name);
              const shiftType = empShift?.finalShift || 'R';
              
              // Incrementiamo le colonne specifiche A, B, C
              if (['A', 'B', 'C'].includes(shiftType)) {
                acc[shiftType] = (acc[shiftType] || 0) + 1;
              }
              
              // Il TOTALE include tutto tranne il riposo (R)
              if (shiftType !== 'R') {
                acc.total += 1;
              }
              
              return acc;
            }, { A: 0, B: 0, C: 0, total: 0 });

            return (
              <tr key={emp.id || emp.name}>
                <td className="sticky-col">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0' }}>
                    <div style={{ 
                      width: '38px', height: '38px', borderRadius: '50%', 
                      background: roleColor, 
                      overflow: 'hidden', 
                      display: 'flex', justifyContent: 'center', alignItems: 'center',
                      border: '2px solid var(--glass-border)',
                      flexShrink: 0,
                      boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                    }}>
                      {emp.avatar ? (
                        <img src={emp.avatar} alt={emp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'white' }}>
                          {emp.initials || emp.name.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: '1.2' }}>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'white' }}>{emp.name}</div>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '2px' }}>
                        <span style={{ fontSize: '0.65rem', color: roleColor, fontWeight: 'bold', textTransform: 'uppercase' }}>{emp.role}</span>
                        {userRole === 'admin' && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>[Sq. {emp.team || 1}]</span>}
                      </div>
                    </div>
                  </div>
                </td>
                {realDays.map((date, i) => {
                  const dayShifts = gridData[i];
                  const empShift = dayShifts?.find(s => s.name === emp.name);
                  const shiftType = empShift?.finalShift || 'R';
                  const dStr = getDateStr(date);
                  const isSelected = selection.includes(`${emp.name}|${dStr}`);
                  const bgColor = ['A', 'B', 'C', 'G', 'R', 'FE', 'MA', 'RT', 'DS', '104', 'CO', 'CF'].includes(shiftType) 
                    ? `var(--shift-${shiftType.toLowerCase()})` 
                    : roleColor;

                  return (
                    <td 
                      key={date.toISOString()} 
                      onMouseDown={() => handleMouseDown(emp.name, date)}
                      onMouseEnter={() => handleMouseEnter(emp.name, date)}
                      onClick={() => !isSelecting && onDayClick(date, emp.name)} 
                      style={{ 
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(99, 102, 241, 0.3)' : ((date.getDay() === 0 || date.getDay() === 6 || isHoliday(date)) ? 'rgba(239, 68, 68, 0.05)' : 'transparent'),
                        position: 'relative',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRight: '1px solid rgba(255, 255, 255, 0.15)',
                        transition: 'background 0.1s'
                      }}
                    >
                      {shiftType !== 'R' && (
                        <div className="shift-pill" data-shift={shiftType} style={{ 
                          background: bgColor, 
                          color: 'white', 
                          transform: isSelected ? 'scale(0.95)' : 'none',
                          boxShadow: isSelected ? '0 0 10px var(--primary)' : 'none'
                        }}>
                          {config.shiftLabels?.[shiftType] || shiftType}
                        </div>
                      )}
                      {isSelected && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '2px dashed var(--primary)', borderRadius: '4px', pointerEvents: 'none', zIndex: 10 }}></div>}
                    </td>
                  );
                })}
                {userRole === 'admin' && (
                  <>
                    <td style={{ textAlign: 'center', fontSize: '0.7rem', opacity: 0.8, background: 'rgba(255,255,255,0.01)' }}>{counts.A}</td>
                    <td style={{ textAlign: 'center', fontSize: '0.7rem', opacity: 0.8, background: 'rgba(255,255,255,0.01)' }}>{counts.B}</td>
                    <td style={{ textAlign: 'center', fontSize: '0.7rem', opacity: 0.8, background: 'rgba(255,255,255,0.01)' }}>{counts.C}</td>
                  </>
                )}
                <td style={{ textAlign: 'center', fontWeight: 'bold', background: 'rgba(255,255,255,0.03)', color: 'var(--primary)' }}>
                  <div style={{ padding: '2px 4px', fontSize: '0.75rem' }}>
                    {counts.total}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
const CalendarView = () => {
  const { employees, exceptions, config } = useApp();
  const [viewDate, setViewDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'grid'
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showExport, setShowExport] = useState(false);
  const [selection, setSelection] = useState([]); // Stato di selezione condiviso (Tank Mode)

  const handleDayClick = (date, employeeName = null) => {
    setSelectedDay(date);
    setSelectedEmployee(employeeName);
  };

  const daysInMonth = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const days = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = (firstDay.getDay() + 6) % 7;
    for(let i=0; i<startPadding; i++) days.push(null);
    for(let d=1; d<=lastDay.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  }, [viewDate]);

  const monthInputRef = React.useRef(null);
  const monthNameOnly = new Intl.DateTimeFormat('it-IT', { month: 'long' }).format(viewDate);
  const yearNumber = viewDate.getFullYear();

  return (
    <div className="fade-in">
      {selectedDay && (
        <DayDetails 
          date={selectedDay} 
          onClose={() => setSelectedDay(null)} 
          selectedEmployee={selectedEmployee} 
          selection={selection}
          onBatchUpdate={() => setSelection([])}
        />
      )}
      {showExport && <ExportModule onClose={() => setShowExport(false)} currentViewDate={viewDate} />}
      
      <header className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', padding: '1.25rem 2rem', borderBottom: '1px solid var(--glass-border)', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div style={{ cursor: 'pointer' }} onClick={() => monthInputRef.current?.showPicker()}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
              {monthNameOnly.charAt(0).toUpperCase() + monthNameOnly.slice(1)} <span style={{ opacity: 0.5, fontWeight: 300 }}>{yearNumber}</span>
            </h1>
            <div style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '0.7rem', color: 'var(--primary)', border: '1px solid var(--glass-border)', fontWeight: 'bold' }}>CAMBIA ▾</div>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Pianificazione e bilanciamento turni giornalieri</p>
          <input 
            ref={monthInputRef}
            type="month" 
            value={`${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`}
            onChange={(e) => {
              const [y, m] = e.target.value.split('-');
              if (y && m) setViewDate(new Date(parseInt(y), parseInt(m) - 1, 1));
            }}
            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }} 
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
             onClick={() => setShowExport(true)}
             className="btn-primary" 
             style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}
          >
            📥 Esporta
          </button>
          
          <div className="view-toggle" style={{ background: 'rgba(0,0,0,0.3)' }}>
            <button className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`} onClick={() => setViewMode('calendar')}>Calendario</button>
            <button className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>Griglia</button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
            <button className="btn-primary" style={{ padding: '0.5rem 0.8rem', background: 'transparent' }} onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>&lt;</button>
            <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }} onClick={() => setViewDate(new Date())}>Oggi</button>
            <button className="btn-primary" style={{ padding: '0.5rem 0.8rem', background: 'transparent' }} onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>&gt;</button>
          </div>
        </div>
      </header>

      {viewMode === 'calendar' ? (
        <div className="glass-card" style={{ padding: '0.5rem' }}>
          <div className="calendar-grid">
            {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => (
              <div key={d} style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--glass-border)' }}>{d}</div>
            ))}
            {daysInMonth.map((date, index) => {
              const dailyShifts = (date && employees.length > 0) ? calculateDailyShifts(date, employees, exceptions, config) : [];
              const shiftCounts = dailyShifts.reduce((acc, p) => {
                acc[p.finalShift] = (acc[p.finalShift] || 0) + 1;
                return acc;
              }, {});

              const isWeekend = date ? (date.getDay() === 0 || date.getDay() === 6) : false;
              const holiday = date ? isHoliday(date) : false;
              const isToday = date && date.toDateString() === new Date().toDateString();

              let isUnderstaffed = false;
              let missingDesc = [];
              if (date && employees.length > 0) {
                 ['A', 'B', 'C'].forEach(st => {
                    const ctCount = dailyShifts.filter(s => s.finalShift === st && s.baseRole === 'CT').length;
                    const opCount = dailyShifts.filter(s => s.finalShift === st && s.baseRole === 'OP').length;
                    const reqCT = config.constraints?.[st]?.CT || 1;
                    const reqOP = config.constraints?.[st]?.OP || 3;
                    if (ctCount !== reqCT) {
                       isUnderstaffed = true;
                       missingDesc.push(`${config.shiftLabels?.[st] || st}: ${ctCount}/${reqCT} CT`);
                    }
                    if (opCount !== reqOP) {
                       isUnderstaffed = true;
                       missingDesc.push(`${config.shiftLabels?.[st] || st}: ${opCount}/${reqOP} OP`);
                    }
                 });
              }

              return (
                <div 
                  key={index} 
                  className={`calendar-day ${!date ? 'disabled' : ''} ${isToday ? 'today pulse-active' : ''}`} 
                  onClick={() => date && handleDayClick(date, null)} 
                  style={{ 
                    position: 'relative',
                    background: isToday ? 'rgba(var(--primary-rgb), 0.15)' : (holiday ? 'rgba(239, 68, 68, 0.1)' : (isWeekend ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)')),
                    border: isToday ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                    minHeight: '100px'
                  }}
                >
                  {date && isUnderstaffed && (
                    <div style={{ position: 'absolute', top: '5px', right: '5px', fontSize: '0.8rem', zIndex: 5 }} title={missingDesc.join(' | ')}>
                      ⚠️
                    </div>
                  )}
                  {date && (
                    <>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        padding: '5px 8px',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        background: isToday ? 'var(--primary)' : 'transparent'
                      }}>
                        <span style={{ 
                          fontSize: '0.8rem', 
                          fontWeight: 'bold',
                          color: (holiday || date.getDay() === 0 || date.getDay() === 6) ? 'var(--accent-warning)' : 'white'
                        }}>
                          {date.getDate()} {holiday ? '🎉' : ''}
                        </span>
                        <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>
                          {date.toLocaleDateString('it-IT', { weekday: 'short' })}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '0.5rem', padding: '0 8px' }}>
                        {Object.keys(shiftCounts).map(st => {
                          let bgColor = 'transparent';
                          let textColor = 'var(--text-muted)';
                          let border = 'none';
                          if (['A', 'B', 'C', 'FE', 'MA', 'RT', 'DS', '104', 'CO'].includes(st)) {
                            bgColor = `var(--shift-${st.toLowerCase()})`;
                            textColor = 'white';
                          } else if (st === 'R') {
                            border = '1px solid var(--glass-border)';
                          } else {
                            bgColor = config.primaryColor; textColor = 'white';
                          }
                          
                          return (
                            <div key={st} style={{ 
                              fontSize: '0.65rem', padding: '1px 6px', 
                              background: bgColor, color: textColor, 
                              borderRadius: '4px', border: border, fontWeight: 600,
                              display: 'flex', gap: '4px', alignItems: 'center'
                            }}>
                              <span>{config.shiftLabels?.[st] || st}:</span> <span>{shiftCounts[st]}</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <ShiftGridView 
          days={daysInMonth} 
          employees={employees} 
          exceptions={exceptions} 
          config={config} 
          onDayClick={handleDayClick}
          selection={selection}
          setSelection={setSelection}
        />
      )}
    </div>
  );
};

function App() {
  const [activeTab, setTab] = useState('calendar');
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('onboarding_complete') && !localStorage.getItem('shift_pro_employees');
  });
  const { config, employees } = useApp();

  const handleOnboardingComplete = () => {
    localStorage.setItem('onboarding_complete', 'true');
    setShowOnboarding(false);
  };

  React.useEffect(() => {
    document.documentElement.style.setProperty('--bg-main', config.backgroundColor || '#0f172a');
    // adjust sidebar background slightly based on main background
    document.documentElement.style.setProperty('--bg-sidebar', (config.backgroundColor + 'E6') || '#1e293b');
    
    document.documentElement.style.setProperty('--text-main', config.textColor || '#ffffff');
    document.documentElement.style.setProperty('--text-sidebar', config.sidebarTextColor || '#ffffff');
    
    if (config.shiftColors) {
      Object.keys(config.shiftColors).forEach(k => {
        document.documentElement.style.setProperty(`--shift-${k.toLowerCase()}`, config.shiftColors[k]);
      });
    }
  }, [config]);

  if (showOnboarding) {
    return (
      <div style={{ '--primary': config.primaryColor }}>
        <Onboarding onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  return (
    <div className="app-container" style={{ 
      '--primary': config.primaryColor,
      '--glass-bg': `rgba(15, 23, 42, ${config.glassOpacity || 0.4})`,
      position: 'relative'
    }}>
      <div style={{
        position: 'fixed',
        top: 0, left: 0, 
        width: '100vw', height: '100vh',
        backgroundColor: config.backgroundColor || 'var(--bg-main)',
        backgroundImage: config.backgroundImage ? `url(${config.backgroundImage})` : 'none',
        backgroundSize: config.backgroundMode === 'repeat' ? 'auto' : config.backgroundMode || 'cover',
        backgroundRepeat: config.backgroundMode === 'repeat' ? 'repeat' : 'no-repeat',
        backgroundPosition: 'center',
        zIndex: -1,
        pointerEvents: 'none'
      }}></div>
      {config.backgroundImage && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', pointerEvents: 'none', zIndex: 0 }}></div>
      )}
      <Sidebar activeTab={activeTab} setTab={setTab} />
      <main style={{ 
        flex: 1, 
        minWidth: 0, 
        padding: '2.5rem', 
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          {activeTab === 'calendar' && <CalendarView />}
          {activeTab === 'staff' && <StaffManager />}
          {activeTab === 'stats' && <StatsDashboard />}
          {activeTab === 'settings' && <RuleSettings />}
        </div>
      </main>
    </div>
  );
}

export default App;
