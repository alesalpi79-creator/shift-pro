import React, { useState, useMemo } from 'react';
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

const DayDetails = ({ date, onClose, selectedEmployee = null }) => {
  const { employees, exceptions, setExceptions, config, userRole } = useApp();
  const shifts = useMemo(() => calculateDailyShifts(date, employees, exceptions, config), [employees, date, exceptions, config]);

  // Se è stato selezionato un dipendente specifico, filtriamo la lista
  const filteredShifts = useMemo(() => {
    if (!selectedEmployee) return shifts;
    return shifts.filter(s => s.name === selectedEmployee);
  }, [shifts, selectedEmployee]);

  const dateStr = date.toISOString().split('T')[0];

  const updateShift = (employeeName, type) => {
    if (userRole !== 'admin') return;
    
    // Controlliamo se esiste già un'eccezione per questo dipendente in questa data
    const existingException = exceptions.find(ex => ex.employee === employeeName && ex.date === dateStr);
    
    const filtered = exceptions.filter(ex => !(ex.employee === employeeName && ex.date === dateStr));
    
    // Se clicchiamo sullo STESSO tipo che c'è già nell'eccezione, la rimuoviamo (toggle off)
    if (existingException && existingException.type === type) {
      setExceptions(filtered);
    } else {
      // Altrimenti aggiungiamo/aggiorniamo l'eccezione
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
                    if (s.finalShift === st) {
                      if (st === 'R') bgColor = 'rgba(255,255,255,0.15)';
                      else bgColor = config.shiftColors[st] || 'var(--primary)';
                    }
                    return (
                      <button 
                        key={st}
                        onClick={() => updateShift(s.name, st)}
                        disabled={userRole !== 'admin'}
                        data-shift={st}
                        style={{ 
                          width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--glass-border)',
                          background: bgColor,
                          color: s.finalShift === st ? 'white' : 'var(--text-muted)',
                          fontSize: '0.65rem', fontWeight: 'bold', cursor: userRole === 'admin' ? 'pointer' : 'default',
                          opacity: userRole === 'admin' ? 1 : 0.6
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

const ShiftGridView = ({ days, employees, exceptions, config, onDayClick }) => {
  const { userRole } = useApp();
  const gridData = useMemo(() => {
    return days.map(date => {
      if (!date) return [];
      return calculateDailyShifts(date, employees, exceptions, config);
    });
  }, [days, employees, exceptions, config]);

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
    <div className="table-container fade-in">
      <table className="shift-table">
        <thead>
          <tr>
            <th>Dipendente</th>
            {days.filter(d => d).map(d => (
              <th key={d.toISOString()}>
                <div style={{ fontSize: '0.6rem', opacity: 0.7 }}>{d.toLocaleDateString('it-IT', { weekday: 'short' }).slice(0, 1)}</div>
                {d.getDate()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleEmployees.map((emp, empIdx) => {
            const roleColor = config.roles?.find(r => r.id === emp.role)?.color || (emp.role === 'CT' ? '#ef4444' : (emp.role === 'OP' ? '#64748b' : config.primaryColor));
            return (
            <tr key={emp.name}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="avatar" style={{ background: roleColor }}>
                    {emp.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{emp.name}</div>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '2px' }}>
                      <span style={{ fontSize: '0.6rem', color: roleColor, fontWeight: 'bold' }}>{emp.role}</span>
                      {userRole === 'admin' && <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>[Sq. {emp.team || 1}]</span>}
                      {(() => {
                        const firstWorkingDay = gridData.find(d => d && d.some(s => s.name === emp.name));
                        if (!firstWorkingDay) return null;
                        const empData = firstWorkingDay.find(s => s.name === emp.name);
                        if (empData?.isJolly) return <span style={{ fontSize: '0.55rem', padding: '1px 4px', background: 'var(--accent-warning)', color: 'white', borderRadius: '4px' }}>Jolly</span>;
                        if (empData?.isSJ) return <span style={{ fontSize: '0.55rem', padding: '1px 4px', background: 'var(--primary)', color: 'white', borderRadius: '4px' }}>SJ</span>;
                        return null;
                      })()}
                    </div>
                  </div>
                </div>
              </td>
              {days.filter(d => d).map((date, dayIdx) => {
                const dayShifts = gridData[dayIdx + (days[0] === null ? days.filter(d => d === null).length : 0)];
                const empShift = dayShifts?.find(s => s.name === emp.name);
                const shiftType = empShift?.finalShift || 'R';
                
                let bgColor = 'transparent';
                let textColor = 'var(--text-muted)';
                let border = 'none';
                

                // Applica il colore in base al tipo di turno
                if (['A', 'B', 'C', 'G', 'R', 'FE', 'MA', 'RT', 'DS', '104', 'CO', 'CF'].includes(shiftType)) {
                  bgColor = `var(--shift-${shiftType.toLowerCase()})`;
                } else {
                  bgColor = roleColor; // Fallback se fosse un turno speciale non standard
                }
                
                if (shiftType === 'R') { 
                  return <td key={date.toISOString()} onClick={() => onDayClick(date, emp.name)} style={{ cursor: 'pointer' }}></td>;
                }
                
                textColor = 'white';

                return (
                  <td key={date.toISOString()} onClick={() => onDayClick(date, emp.name)} style={{ cursor: 'pointer' }}>
                    <div className="shift-pill" data-shift={shiftType} style={{ background: bgColor, color: textColor, border: border }}>
                      {config.shiftLabels?.[shiftType] || shiftType}
                    </div>
                  </td>
                );
              })}
            </tr>
          )})}
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

  const monthName = new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(viewDate);

  return (
    <div className="fade-in">
      {selectedDay && <DayDetails date={selectedDay} onClose={() => setSelectedDay(null)} selectedEmployee={selectedEmployee} />}
      {showExport && <ExportModule onClose={() => setShowExport(false)} currentViewDate={viewDate} />}
      
      <header className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', padding: '1.25rem 2rem', borderBottom: '1px solid var(--glass-border)' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>{monthName.charAt(0).toUpperCase() + monthName.slice(1)}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Pianificazione e bilanciamento turni giornalieri</p>
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

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>&lt;</button>
            <button className="btn-primary" style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }} onClick={() => setViewDate(new Date())}>Oggi</button>
            <button className="btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>&gt;</button>
          </div>
        </div>
      </header>

      {viewMode === 'calendar' ? (
        <div className="glass-card" style={{ padding: '0.5rem' }}>
          <div className="calendar-grid">
            {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => (
              <div key={d} style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--glass-border)' }}>{d}</div>
            ))}
            {daysInMonth.map((date, i) => {
              const dailyShifts = (date && employees.length > 0) ? calculateDailyShifts(date, employees, exceptions, config) : [];
              const shiftCounts = dailyShifts.reduce((acc, p) => {
                acc[p.finalShift] = (acc[p.finalShift] || 0) + 1;
                return acc;
              }, {});

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
                <div key={i} className={`calendar-day ${!date ? 'disabled' : ''} ${isToday ? 'today pulse-active' : ''}`} onClick={() => date && handleDayClick(date, null)} style={{ position: 'relative' }}>
                  {date && isUnderstaffed && (
                    <div style={{ position: 'absolute', top: '5px', right: '5px', fontSize: '0.8rem', zIndex: 5 }} title={missingDesc.join(' | ')}>
                      ⚠️
                    </div>
                  )}
                  {date && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span className="day-number">{date.getDate()}</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '0.5rem' }}>
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
    
    if (config.shiftColors) {
      Object.keys(config.shiftColors).forEach(k => {
        document.documentElement.style.setProperty(`--shift-${k.toLowerCase()}`, config.shiftColors[k]);
      });
    }
  }, [config.backgroundColor, config.shiftColors]);

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
      backgroundImage: config.backgroundImage ? `url(${config.backgroundImage})` : 'none',
      backgroundSize: config.backgroundMode === 'repeat' ? 'auto' : config.backgroundMode || 'cover',
      backgroundRepeat: config.backgroundMode === 'repeat' ? 'repeat' : 'no-repeat',
      backgroundPosition: 'center',
      backgroundAttachment: config.backgroundMode === 'repeat' ? 'scroll' : 'fixed',
      backgroundColor: config.backgroundColor || 'var(--bg-main)',
      position: 'relative'
    }}>
      {config.backgroundImage && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', pointerEvents: 'none', zIndex: 0 }}></div>
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
