import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from './context/AppContext';
// Trigger Deploy: Rename project v2.6.9
import chaosImg from './assets/chaos.png';
import heroMockup from './assets/hero_mockup.png';
import logisticsMockup from './assets/logistics_mockup.png';
import medicalMockup from './assets/medical_mockup.png';
import { calculateDailyShifts } from './logic/ShiftEngine';
import StaffManager from './components/StaffManager';
import RuleSettings from './components/RuleSettings';
import Onboarding from './components/Onboarding';
import ExportModule from './components/ExportModule';
import StatsDashboard from './components/StatsDashboard';
import Dialog from './components/Dialog';
import './index.css';

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
    '255, 255, 255';
};

// Component Icons (Simulated Premium)
const IconCalendar = () => <span className="nav-icon">📅</span>;
const IconUsers = () => <span className="nav-icon">👥</span>;
const IconSettings = () => <span className="nav-icon">⚙️</span>;
const IconUser = () => <span className="nav-icon">👤</span>;
const IconStats = () => <span className="nav-icon">📊</span>;
const IconExport = () => <span className="nav-icon">📦</span>;

const getEaster = (year) => {
  const f = Math.floor,
    G = year % 19,
    C = f(year / 100),
    H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30,
    I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11)),
    J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7,
    L = I - J,
    month = 3 + f((L + 40) / 44),
    day = L + 28 - 31 * f(month / 4);
  return { d: day, m: month };
};

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

  // Calcolo Pasquetta (Lunedì dell'Angelo)
  const easter = getEaster(y);
  const pasquetta = new Date(y, easter.m - 1, easter.d + 1);
  if (d === pasquetta.getDate() && m === (pasquetta.getMonth() + 1)) return true;
  
  return holidays.some(h => h.d === d && h.m === m);
};

const Sidebar = ({ activeTab, setTab, setView, setShowLogin, setShowExport, showAlert, showConfirm, showPrompt }) => {
  const { 
    userRole, setUserRole, 
    schedules, activeScheduleId, setActiveScheduleId, 
    addSchedule, deleteSchedule, renameSchedule,
    config, setConfig, employees, setEmployees, exceptions, setExceptions, isPro, isTrialExpired 
  } = useApp();

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
    link.download = `${config.appName.replace(/\s+/g, '-').toLowerCase()}-backup-${new Date().toISOString().split('T')[0]}.json`;
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
        if (true) {
          showConfirm("Attenzione", "L'importazione sovrascriverà tutti i dati dello schema attuale. Continuare?", () => {
            setConfig(data.config);
            setEmployees(data.employees);
            setExceptions(data.exceptions || []);
            showAlert("Successo", "Dati importati con successo!");
          });
        }
      } catch (err) {
        showAlert("Errore", "Il file non sembra un backup valido.");
      }
    };
    reader.readAsText(file);
  };
  
  return (
    <div className="sidebar">
      <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0 0.5rem' }}>
        <div style={{ 
          width: '42px', height: '42px', 
          background: `linear-gradient(135deg, ${config.primaryColor}, #fff)`, 
          boxShadow: `0 8px 25px ${config.primaryColor}66`,
          borderRadius: '12px', display: 'grid', placeItems: 'center', fontWeight: '900',
          color: 'var(--bg-main)', fontSize: '1.4rem'
        }}>{config.appName.charAt(0)}</div>
        <div>
          <h2 style={{ fontSize: '1.25rem', letterSpacing: '-0.04em', fontWeight: '800', lineHeight: 1 }}>{config.appName}</h2>
          {config.appTagline && (
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px', fontWeight: '700' }}>
              {config.appTagline}
            </div>
          )}
        </div>
      </div>

      {/* Switcher Schemi Premium */}
      <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.1em' }}>Database Schemi</span>
          {userRole === 'admin' && (
              <button 
                onClick={() => {
                  showPrompt("Nuovo Schema", "Inserisci il nome del nuovo schema:", "", (name) => {
                    if (name) addSchedule(name);
                  });
                }}
                style={{ background: 'var(--primary)', border: 'none', color: 'white', width: '20px', height: '20px', borderRadius: '50%', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', display: 'grid', placeItems: 'center' }}
                title="Crea nuovo archivio"
              >+</button>
          )}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
          {schedules.map(sch => (
            <div 
              key={sch.id}
              className={`nav-item ${activeScheduleId === sch.id ? 'active' : ''}`}
              style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', marginBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}
              onClick={() => setActiveScheduleId(sch.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <span style={{ fontSize: '0.8rem' }}>{activeScheduleId === sch.id ? '📍' : '📄'}</span>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sch.name}</span>
              </div>
              
              {userRole === 'admin' && activeScheduleId === sch.id && (
                <div style={{ display: 'flex', gap: '6px', opacity: 0.7 }}>
                   <span onClick={(e) => { e.stopPropagation(); showPrompt("Rinomina", "Nuovo nome per lo schema:", sch.name, (n) => { if(n) renameSchedule(sch.id, n); }); }} style={{ cursor: 'pointer' }} title="Rinomina">✏️</span>
                   {schedules.length > 1 && <span onClick={(e) => { e.stopPropagation(); showConfirm("Elimina Schema", `Sei sicuro di voler eliminare lo schema "${sch.name}"?`, () => deleteSchedule(sch.id)); }} style={{ cursor: 'pointer' }} title="Elimina">🗑️</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <nav style={{ flex: 1 }}>
        <div className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => { setTab('home'); setView('landing'); }}>
          <span className="nav-icon">🏠</span> Home
        </div>
        <div className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => { setTab('calendar'); setView('app'); }}>
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
            <div className="nav-item" onClick={() => setShowExport(true)} style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
              <IconExport /> Esporta PDF/Excel
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
              showPrompt("Accesso Admin", "Inserisci la password di amministrazione:", "", (pwd) => {
                const adminPwd = config.adminPassword;
                if (pwd === adminPwd) {
                  setUserRole('admin');
                } else if (!adminPwd) {
                  showAlert("Configurazione", "Nessuna password impostata. Vai nelle impostazioni per crearne una o usa l'accesso amministratore per sbloccare.");
                } else {
                  showAlert("Errore", "Password errata!");
                }
              });
            }
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', cursor: 'pointer' }}
        >
          <IconUser /> Loggato come <strong style={{ color: 'var(--text-main)' }}>{userRole === 'admin' ? 'ADMIN' : 'USER'}</strong>
        </div>
        <button 
          onClick={() => {
            if (userRole === 'admin') {
              setUserRole('viewer');
              if (activeTab === 'staff' || activeTab === 'settings') {
                setTab('calendar');
              }
            } else {
              if (!isPro && !isTrialExpired) {
                setUserRole('admin');
              } else {
                setShowLogin(true);
              }
            }
          }}
          className="btn-primary"
          style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--glass-border)', fontSize: '0.7rem' }}
        >
          {userRole === 'admin' ? 'Passa a Visualizzatore' : 'Accesso Amministratore'}
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

        {!isPro && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--primary-glow)', borderRadius: '12px', border: '1px solid var(--primary)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '5px' }}>VERSIONE TRIAL</div>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '10px' }}>Passa a Pro per sbloccare tutte le funzioni.</p>
            <button 
              className="btn-primary" 
              style={{ width: '100%', fontSize: '0.7rem', background: 'var(--primary)', border: 'none' }}
              onClick={() => {
                window.location.href = 'https://buy.stripe.com/3cI8wP1T67tDcSkdPO8bS00';
              }}
            >
              🚀 ATTIVA PRO
            </button>
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
    return (shifts || []).filter(s => s.name === selectedEmployee);
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
        updated = (updated || []).filter(ex => !toRemoveSet.has(`${ex.employee}|${ex.date}`));
        
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
    const filtered = (exceptions || []).filter(ex => !(ex.employee === employeeName && ex.date === dateStr));
    
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
    <div className="fade-in" style={{ position: 'fixed', top: 0, right: 0, width: '380px', height: '100vh', background: 'var(--bg-sidebar)', borderLeft: '1px solid var(--glass-border)', padding: '1.25rem', zIndex: 100, boxShadow: '-10px 0 30px rgba(0,0,0,0.5)', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem' }}>{date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
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
             {config.showUnderstaffedAlert && warnings.length > 0 && (
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
        {renderGroup('Turno A (Mattina)', (filteredShifts || []).filter(s => s.finalShift === 'A'), 'var(--shift-a)')}
        {renderGroup('Turno B (Notte)', (filteredShifts || []).filter(s => s.finalShift === 'B'), 'var(--shift-b)')}
        {renderGroup('Turno C (Pomeriggio)', (filteredShifts || []).filter(s => s.finalShift === 'C'), 'var(--shift-c)')}
        {renderGroup('Assenze Speciali', (filteredShifts || []).filter(s => ['FE', 'MA', 'RT', 'DS', '104', 'CO', 'CF'].includes(s.finalShift)), 'var(--text-muted)')}
        {renderGroup('A Riposo / Jolly / Giornaliero', (filteredShifts || []).filter(s => ['R', 'G'].includes(s.finalShift)), null)}
      </div>
    </div>
  );
};

const DailySummaryView = ({ days, employees, exceptions, config, onDayClick }) => {
  const realDays = useMemo(() => days.filter(d => d), [days]);

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
      {realDays.map(date => {
        const shifts = calculateDailyShifts(date, employees, exceptions, config);
        const dateStr = date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
        const isHolidayDay = isHoliday(date) || date.getDay() === 0;

        const renderGroup = (label, members, color) => (
          <div style={{ marginBottom: '0.8rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: '800', color: color || 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {members.length > 0 ? members.map(m => (
                <div key={m.name} style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', border: `1px solid ${color}44` }}>
                  {m.name}
                </div>
              )) : <span style={{ fontSize: '0.75rem', opacity: 0.3 }}>-</span>}
            </div>
          </div>
        );

        return (
          <div key={date.toISOString()} className="glass-card" onClick={() => onDayClick(date)} style={{ cursor: 'pointer', borderTop: isHolidayDay ? '4px solid var(--accent-warning)' : '1px solid var(--glass-border)' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', textTransform: 'capitalize', color: isHolidayDay ? 'var(--accent-warning)' : 'inherit' }}>{dateStr}</h3>
            {renderGroup('Mattina (A)', shifts.filter(s => s.finalShift === 'A'), 'var(--shift-a)')}
            {renderGroup('Pomeriggio (C)', shifts.filter(s => s.finalShift === 'C'), 'var(--shift-c)')}
            {renderGroup('Notte (B)', shifts.filter(s => s.finalShift === 'B'), 'var(--shift-b)')}
          </div>
        );
      })}
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
    return (employees || []).filter(emp => {
      if (!emp) return false;
      // Se ci sono 5 o meno dipendenti in totale, li mostriamo tutti sempre (uso personale)
      if ((employees || []).length <= 5) return true;

      // Altrimenti mostriamo solo chi ha turni attivi nel periodo (uso aziendale)
      return (gridData || []).some(dayShifts => {
        if (!dayShifts || !Array.isArray(dayShifts)) return false;
        const s = dayShifts.find(x => x && x.name === emp.name);
        return s && (['A', 'B', 'C'].includes(s.finalShift) || s.isJolly || s.isSJ);
      });
      })
      .sort((a, b) => {
        if (!a || !b) return 0;
        const roleA = a.role || '';
        const roleB = b.role || '';
        if (roleA !== roleB) return roleA === 'CT' ? -1 : 1;
        return (a.name || '').localeCompare(b.name || '');
      });
  }, [employees, gridData]);

  return (
    <div className="table-container fade-in" style={{ position: 'relative' }}>
      {toast && (
        <div style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: 'white', padding: '0.5rem 1.5rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', zIndex: 1000, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', border: '1px solid white' }}>
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

              if (dayShifts && Array.isArray(dayShifts) && config.constraints) {
                 ['A', 'B', 'C'].forEach(st => {
                    const ctCount = dayShifts.filter(s => s && s.finalShift === st && s.baseRole === 'CT').length;
                    const opCount = dayShifts.filter(s => s && s.finalShift === st && s.baseRole === 'OP').length;
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
                    color: (isHoliday(d) || d.getDay() === 0 || d.getDay() === 6) ? 'var(--accent-warning)' : '#1e293b',
                    background: 'white',
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
                    {config.showUnderstaffedAlert && isUnderstaffed && (
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
                      <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>{emp.name}</div>
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
                          color: shiftType === 'R' ? 'var(--text-muted)' : 'white', 
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
const ProjectPreviewTable = () => {
  const fakeData = [
    { name: "Mario Rossi", role: "CT", shifts: ['A', 'A', 'C', 'C', 'R', 'R', 'B', 'B', 'A', 'A', 'C', 'C', 'R', 'B', 'B'] },
    { name: "Luca Bianchi", role: "OP", shifts: ['G', 'G', 'G', 'G', 'G', 'R', 'R', 'G', 'G', 'G', 'G', 'G', 'R', 'R', 'G'] },
    { name: "Anna Verdi", role: "OP", shifts: ['R', 'R', 'B', 'B', 'R', 'R', 'A', 'A', 'C', 'C', 'R', 'R', 'B', 'B', 'R'] },
    { name: "Elena Neri", role: "SJ", shifts: ['C', 'C', 'R', 'R', 'B', 'B', 'R', 'R', 'A', 'A', 'C', 'C', 'R', 'R', 'B'] },
  ];

  return (
    <div style={{ overflowX: 'auto', background: '#0f172a', padding: '1.5rem', borderRadius: '2rem', marginTop: '2.5rem', boxShadow: '0 30px 60px -10px rgba(0,0,0,0.3)' }}>
       <h4 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '0.9rem', opacity: 0.7, fontWeight: 500, letterSpacing: '0.05em' }}>PREVIEW OUTPUT ALGORITMO</h4>
       <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: '0.8rem' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem' }}>DIPENDENTE</th>
              {[...Array(15)].map((_, i) => (
                <th key={i} style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem' }}>{i+1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fakeData.map((emp, i) => (
              <tr key={i}>
                <td style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontWeight: '800', color: 'white' }}>{emp.name}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 'bold' }}>{emp.role}</div>
                </td>
                {emp.shifts.map((s, j) => (
                  <td key={j} style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ 
                      width: '28px', height: '28px', borderRadius: '8px', 
                      background: s === 'A' ? 'var(--shift-a)' : s === 'B' ? 'var(--shift-b)' : s === 'C' ? 'var(--shift-c)' : s === 'G' ? 'var(--shift-g)' : 'rgba(255,255,255,0.05)',
                      display: 'grid', placeItems: 'center', margin: '0 auto',
                      fontSize: '0.7rem', fontWeight: 'bold',
                      boxShadow: s !== 'R' ? '0 4px 10px rgba(0,0,0,0.2)' : 'none'
                    }}>{s}</div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
       </table>
    </div>
  );
};


const LandingPage = ({ config, setView, onEnter }) => {
  return (
    <div className="landing-page" style={{ color: '#1e293b' }}>
      <nav className="glass-nav" style={{ 
        position: 'fixed', top: '1.5rem', left: '50%', transform: 'translateX(-50%)', 
        width: '90%', maxWidth: '1200px', padding: '0.75rem 1.5rem', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(15px)',
        border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: '100px',
        zIndex: 1000, boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '8px', display: 'grid', placeItems: 'center', color: 'white', fontWeight: '900' }}>T</div>
          <span style={{ fontWeight: '800', fontSize: '1.1rem', letterSpacing: '-0.02em' }}>{config.appName}</span>
        </div>
        <div style={{ display: 'flex', gap: '2rem', fontSize: '0.85rem', fontWeight: '600' }}>
          <a href="#features" style={{ color: 'inherit', textDecoration: 'none' }}>Funzionalità</a>
          <a href="#demo" style={{ color: 'inherit', textDecoration: 'none' }}>Demo Video</a>
          <a href="#pricing" style={{ color: 'inherit', textDecoration: 'none' }}>Prezzi</a>
        </div>
        <button onClick={onEnter} className="btn-primary" style={{ padding: '0.6rem 1.5rem', borderRadius: '50px', fontSize: '0.8rem' }}>Prova Gratis</button>
      </nav>

      <header style={{ 
        padding: '10rem 2rem 6rem', textAlign: 'center', maxWidth: '1000px', margin: '0 auto',
        position: 'relative', overflow: 'hidden'
      }}>
        <div className="badge" style={{ display: 'inline-block', padding: '0.5rem 1rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', borderRadius: '100px', fontSize: '0.75rem', fontWeight: '800', marginBottom: '2rem', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
          NUOVA VERSIONE 2.7 • OTTIMIZZAZIONE AI
        </div>
        <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', fontWeight: '900', lineHeight: '1', letterSpacing: '-0.04em', marginBottom: '1.5rem', color: '#0f172a' }}>
          Gestisci i tuoi <span style={{ color: 'var(--primary)' }}>Turni Pro AI</span> in pochi secondi.
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#64748b', marginBottom: '3rem', maxWidth: '700px', margin: '0 auto 3rem' }}>
          Turni Pro AI è l'unico software che combina algoritmi di rotazione industriale con un'interfaccia premium. Gestisci il tuo team senza stress.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onEnter} className="btn-primary" style={{ padding: '1.25rem 2.5rem', fontSize: '1rem', borderRadius: '1rem', boxShadow: '0 20px 40px var(--primary-glow)' }}>Inizia Ora — È Gratis</button>
          <button className="btn-secondary" style={{ padding: '1.25rem 2.5rem', fontSize: '1rem', borderRadius: '1rem', background: 'white', border: '1px solid #e2e8f0', color: '#0f172a' }}>Guarda Demo</button>
        </div>

        {/* Dashboard Mockup Visual */}
        <div style={{ position: 'relative', marginTop: '5rem', perspective: '1000px' }}>
           <img 
              src={heroMockup} 
              alt="Dashboard Preview" 
              style={{ 
                width: '100%', 
                borderRadius: '1.5rem', 
                boxShadow: '0 50px 100px -20px rgba(0,0,0,0.15)',
                transform: 'rotateX(5deg)',
                border: '1px solid rgba(0,0,0,0.05)'
              }} 
           />
           <div style={{ position: 'absolute', bottom: '-2rem', left: '50%', transform: 'translateX(-50%)', width: '80%', height: '100px', background: 'var(--primary)', filter: 'blur(100px)', opacity: 0.1, zIndex: -1 }}></div>
        </div>
      </header>

      <section id="features" style={{ padding: '6rem 2rem', background: '#f8fafc' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '1rem' }}>Sviluppato per la complessità.</h2>
            <p style={{ color: '#64748b' }}>Tutto ciò di cui hai bisogno per gestire turni 24/7, reperibilità e assenze.</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div className="feature-card" style={{ padding: '2.5rem', background: 'white', borderRadius: '2rem', border: '1px solid #f1f5f9', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
              <div style={{ width: '50px', height: '50px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', display: 'grid', placeItems: 'center', fontSize: '1.5rem', marginBottom: '1.5rem' }}>🤖</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem' }}>Cicli Automatici</h3>
              <p style={{ color: '#64748b', lineHeight: '1.6' }}>Inserisci la sequenza (es: Mattina-Pomeriggio-Notte) e l'algoritmo popola l'intero anno istantaneamente.</p>
            </div>
            <div className="feature-card" style={{ padding: '2.5rem', background: 'white', borderRadius: '2rem', border: '1px solid #f1f5f9', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
              <div style={{ width: '50px', height: '50px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', display: 'grid', placeItems: 'center', fontSize: '1.5rem', marginBottom: '1.5rem' }}>📱</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem' }}>PWA & Mobile Ready</h3>
              <p style={{ color: '#64748b', lineHeight: '1.6' }}>Installa l'app sul tuo telefono. Funziona offline e si sincronizza quando torni online.</p>
            </div>
            <div className="feature-card" style={{ padding: '2.5rem', background: 'white', borderRadius: '2rem', border: '1px solid #f1f5f9', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
              <div style={{ width: '50px', height: '50px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', display: 'grid', placeItems: 'center', fontSize: '1.5rem', marginBottom: '1.5rem' }}>📊</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem' }}>Esportazione PDF</h3>
              <p style={{ color: '#64748b', lineHeight: '1.6' }}>Genera report professionali in PDF o Excel da stampare o inviare al team con un click.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="demo" style={{ padding: '8rem 2rem', textAlign: 'center' }}>
         <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '3rem' }}>Guarda Turni Pro in azione.</h2>
            <div style={{ 
               aspectRatio: '16/9', 
               background: '#0f172a', 
               borderRadius: '2.5rem', 
               display: 'grid', 
               placeItems: 'center',
               boxShadow: '0 40px 80px -15px rgba(0,0,0,0.2)',
               overflow: 'hidden',
               position: 'relative'
            }}>
               <div style={{ position: 'absolute', inset: 0, background: `url(${logisticsMockup})`, backgroundSize: 'cover', opacity: 0.4 }}></div>
               <button style={{ 
                  width: '80px', height: '80px', borderRadius: '50%', 
                  background: 'white', border: 'none', cursor: 'pointer',
                  fontSize: '1.5rem', display: 'grid', placeItems: 'center',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                  zIndex: 1, transition: 'transform 0.3s'
               }}
               onMouseEnter={e => e.target.style.transform = 'scale(1.1)'}
               onMouseLeave={e => e.target.style.transform = 'scale(1)'}
               >▶️</button>
            </div>
         </div>
      </section>

      {/* NEW: HOW IT WORKS SECTION */}
      <section style={{ padding: '6rem 2rem', background: 'white' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '1rem' }}>Inizia in 3 semplici passi.</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
            <div style={{ display: 'flex', gap: '3rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <div style={{ fontSize: '4rem', fontWeight: '900', color: 'var(--primary)', opacity: 0.2, marginBottom: '-1rem' }}>01</div>
                <h3 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '1rem' }}>Configura il tuo Team</h3>
                <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Aggiungi i dipendenti, assegna i ruoli (CT, OP, Jolly) e definisci le squadre di appartenenza.</p>
              </div>
              <div style={{ flex: 1, minWidth: '300px', background: '#f1f5f9', borderRadius: '2rem', padding: '2rem' }}>
                <img src={medicalMockup} alt="Step 1" style={{ width: '100%', borderRadius: '1rem', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '3rem', alignItems: 'center', flexWrap: 'wrap-reverse' }}>
              <div style={{ flex: 1, minWidth: '300px', background: '#f1f5f9', borderRadius: '2rem', padding: '2rem' }}>
                <ProjectPreviewTable />
              </div>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <div style={{ fontSize: '4rem', fontWeight: '900', color: 'var(--primary)', opacity: 0.2, marginBottom: '-1rem' }}>02</div>
                <h3 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '1rem' }}>Definisci la Rotazione</h3>
                <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Imposta il ciclo di turni desiderato. L'algoritmo calcolerà automaticamente la copertura ottimale per ogni giorno dell'anno.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '3rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <div style={{ fontSize: '4rem', fontWeight: '900', color: 'var(--primary)', opacity: 0.2, marginBottom: '-1rem' }}>03</div>
                <h3 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '1rem' }}>Gestisci le Eccezioni</h3>
                <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Ferie impreviste o malattie? Trascina e cambia i turni in tempo reale. L'interfaccia reattiva aggiorna tutto istantaneamente.</p>
              </div>
              <div style={{ flex: 1, minWidth: '300px', background: '#f1f5f9', borderRadius: '2rem', padding: '2rem' }}>
                <img src={heroMockup} alt="Step 3" style={{ width: '100%', borderRadius: '1rem', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" style={{ padding: '8rem 2rem', background: '#0f172a', color: 'white' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '1.5rem' }}>Prezzo semplice, <span style={{ color: 'var(--primary)' }}>per sempre.</span></h2>
          <p style={{ color: '#94a3b8', fontSize: '1.25rem', marginBottom: '4rem' }}>Nessun abbonamento mensile. Paghi una volta, lo usi per sempre su tutti i tuoi dispositivi.</p>
          
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '3rem', padding: '4rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '2rem', right: '-3rem', background: 'var(--primary)', padding: '0.5rem 4rem', transform: 'rotate(45deg)', fontWeight: '900', fontSize: '0.8rem' }}>BEST VALUE</div>
            <div style={{ fontSize: '1rem', color: 'var(--primary)', fontWeight: '800', marginBottom: '1rem' }}>LICENZA ILLIMITATA</div>
            <div style={{ fontSize: '5rem', fontWeight: '900', marginBottom: '1rem' }}>€7,99</div>
            <p style={{ color: '#94a3b8', marginBottom: '3rem' }}>Una tantum • Aggiornamenti inclusi • Supporto prioritario</p>
            <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto 3rem', display: 'flex', flexDirection: 'column', gap: '1rem', color: '#cbd5e1' }}>
              <li>✅ Gestione illimitata dipendenti</li>
              <li>✅ Backup cloud & Sincronizzazione multi-device</li>
              <li>✅ Esportazione Excel e PDF senza limiti</li>
              <li>✅ Supporto per turni complessi 24/7</li>
            </ul>
            <button onClick={onEnter} className="btn-primary" style={{ width: '100%', padding: '1.5rem', fontSize: '1.2rem', borderRadius: '1rem' }}>Inizia Versione Pro</button>
            
            {/* Play Store Info Section */}
            <div style={{ 
               marginTop: '3rem', 
               paddingTop: '3rem', 
               borderTop: '1px solid rgba(255,255,255,0.1)',
               display: 'flex',
               flexDirection: 'column',
               alignItems: 'center',
               gap: '1.5rem'
            }}>
               <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  background: 'rgba(255,255,255,0.05)', 
                  padding: '8px 16px', 
                  borderRadius: '100px',
                  border: '1px solid rgba(255,255,255,0.1)'
               }}>
                  <span style={{ fontSize: '1.2rem' }}>🤖</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.5px', color: '#94a3b8' }}>ANDROID APP COMING SOON</span>
               </div>
               <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '500px' }}>
                  Stiamo finalizzando la release ufficiale sul Google Play Store. Nel frattempo, puoi installare la PWA direttamente dal browser Chrome sul tuo smartphone.
               </p>
               <div style={{ opacity: 0.3, filter: 'grayscale(1)', cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play Store" style={{ height: '45px' }} />
               </div>
            </div>
          </div>
        </div>
      </section>

      <footer style={{ padding: '4rem 2rem', textAlign: 'center', borderTop: '1px solid #f1f5f9' }}>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>© 2026 {config.appName} — Made with ❤️ for Professionals.</p>
      </footer>
    </div>
  );
};

const LoginOverlay = ({ onLogin, onCancel }) => {
  const [pwd, setPwd] = useState("");
  return (
    <div className="dialog-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(10px)', display: 'grid', placeItems: 'center', zIndex: 10000 }}>
       <div className="glass-card fade-in" style={{ width: '90%', maxWidth: '380px', padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ width: '60px', height: '60px', background: 'var(--primary)', borderRadius: '15px', display: 'grid', placeItems: 'center', margin: '0 auto 2rem', color: 'white', fontSize: '1.5rem', boxShadow: '0 10px 20px var(--primary-glow)' }}>🔒</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '0.5rem' }}>Area Riservata</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '2rem' }}>Inserisci la tua password amministratore per sbloccare le funzioni di editing.</p>
          <input 
            type="password" 
            className="input-main" 
            autoFocus
            style={{ textAlign: 'center', fontSize: '1.2rem', padding: '1rem', letterSpacing: '4px', marginBottom: '1.5rem' }}
            placeholder="••••••••"
            value={pwd}
            onChange={e => setPwd(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onLogin(pwd)}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button onClick={() => onLogin(pwd)} className="btn-primary" style={{ width: '100%', padding: '1rem', borderRadius: '12px' }}>Accedi Ora</button>
            <button onClick={onCancel} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer' }}>Torna al Calendario</button>
          </div>
       </div>
    </div>
  );
};

const PaywallOverlay = ({ onUnlock }) => {
  return (
    <div className="dialog-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(20px)', display: 'grid', placeItems: 'center', zIndex: 20000 }}>
       <div className="glass-card fade-in" style={{ width: '90%', maxWidth: '420px', padding: '3rem', textAlign: 'center', border: '1px solid var(--primary)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>⌛</div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '1rem' }}>Periodo Trial Scaduto</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2.5rem', lineHeight: '1.6' }}>Hai utilizzato tutte le funzionalità gratuite. Passa alla versione Pro per continuare a gestire i tuoi turni senza limiti.</p>
          
          <button 
            onClick={() => window.location.href = 'https://buy.stripe.com/3cI8wP1T67tDcSkdPO8bS00'}
            className="btn-primary" 
            style={{ width: '100%', padding: '1.25rem', borderRadius: '15px', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem' }}
          >
            Sblocca Versione Pro — €7,99
          </button>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pagamento unico • Accesso a vita</div>
       </div>
    </div>
  );
};

const CalendarView = ({ viewDate, setViewDate, showExport, setShowExport }) => {
  const { employees, exceptions, config } = useApp();
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selection, setSelection] = useState([]);
  const [calendarMode, setCalendarMode] = useState('grid');

  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const startDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const prevMonthDays = daysInMonth(viewDate.getFullYear(), viewDate.getMonth() - 1);
  
  const calendarDays = [];
  // Adjusted for Italian Week (Mon-Sun)
  const adjustedStart = startDay === 0 ? 6 : startDay - 1;
  
  for (let i = adjustedStart - 1; i >= 0; i--) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth(viewDate.getFullYear(), viewDate.getMonth()); i++) {
    calendarDays.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), i));
  }

  return (
    <div className="calendar-view">
      <header className="calendar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '900', letterSpacing: '-0.04em', textTransform: 'capitalize' }}>
            {viewDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="month-nav">
            <button className="nav-btn" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>←</button>
            <button className="nav-btn" onClick={() => setViewDate(new Date())}>Oggi</button>
            <button className="nav-btn" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>→</button>
          </div>
          
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px', border: '1px solid var(--glass-border)', marginLeft: '1rem' }}>
            <button 
              onClick={() => setCalendarMode('grid')}
              style={{ 
                padding: '0.5rem 1rem', fontSize: '0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: calendarMode === 'grid' ? 'var(--primary)' : 'transparent',
                color: calendarMode === 'grid' ? 'white' : 'var(--text-muted)',
                fontWeight: 'bold', transition: 'all 0.2s'
              }}
            >Griglia</button>
            <button 
              onClick={() => setCalendarMode('summary')}
              style={{ 
                padding: '0.5rem 1rem', fontSize: '0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: calendarMode === 'summary' ? 'var(--primary)' : 'transparent',
                color: calendarMode === 'summary' ? 'white' : 'var(--text-muted)',
                fontWeight: 'bold', transition: 'all 0.2s'
              }}
            >Riepilogo</button>
          </div>
        </div>
        
        <div className="legend" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {Object.entries(config.shiftColors).map(([id, color]) => (
            <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', fontWeight: 'bold' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: color }}></div>
              <span style={{ opacity: 0.8, textTransform: 'uppercase' }}>{config.shiftLabels?.[id] || id}</span>
            </div>
          ))}
        </div>
      </header>

      {calendarMode === 'grid' ? (
        <ShiftGridView 
          days={calendarDays} 
          employees={employees} 
          exceptions={exceptions} 
          config={config} 
          selection={selection}
          setSelection={setSelection}
          onDayClick={(date, empName) => {
            setSelectedDay(date);
            setSelectedEmployee(empName);
          }} 
        />
      ) : (
        <DailySummaryView 
          days={calendarDays} 
          employees={employees} 
          exceptions={exceptions} 
          config={config} 
          onDayClick={(date) => setSelectedDay(date)}
        />
      )}

      {selectedDay && (
        <DayDetails 
          date={selectedDay} 
          selectedEmployee={selectedEmployee}
          selection={selection}
          onBatchUpdate={() => setSelection([])}
          onClose={() => {
            setSelectedDay(null);
            setSelectedEmployee(null);
            setSelection([]);
          }} 
        />
      )}
    </div>
  );
};

export default function App() {
  const { config, employees, exceptions, setConfig, setEmployees, setExceptions, isPro, isTrialExpired } = useApp();
  const [view, setView] = useState('landing');
  const [activeTab, setTab] = useState('calendar');
  const [viewDate, setViewDate] = useState(new Date());
  const [showLogin, setShowLogin] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [userRole, setUserRole] = useState('viewer');
  
  const [dialog, setDialog] = useState({ 
    isOpen: false, 
    type: 'alert', 
    title: '', 
    message: '', 
    defaultValue: '', 
    onConfirm: () => {} 
  });

  const showAlert = (title, message) => {
    setDialog({ isOpen: true, type: 'alert', title, message, onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false })) });
  };

  const showConfirm = (title, message, onConfirm) => {
    setDialog({ 
      isOpen: true, 
      type: 'confirm', 
      title, 
      message, 
      onConfirm: () => {
        onConfirm();
        setDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const showPrompt = (title, message, defaultValue, onConfirm) => {
    setDialog({ 
      isOpen: true, 
      type: 'prompt', 
      title, 
      message, 
      defaultValue, 
      onConfirm: (val) => {
        onConfirm(val);
        setDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleOnboardingComplete = (data) => {
    setConfig(prev => ({ ...prev, ...data.config }));
    setEmployees(data.employees);
    setView('app');
  };

  const handleLogin = (pwd) => {
    const adminPwd = config.adminPassword;
    const guestPwd = config.guestPassword || "guest123";

    if (adminPwd && pwd === adminPwd) {
      setUserRole('admin');
      setShowLogin(false);
    } else if (!adminPwd && pwd === "admin") { // Default temporaneo se non impostata
      showPrompt("Crea Password", "Benvenuto! Crea la tua Password Amministratore personalizzata (min 4 caratteri):", "", (newPwd) => {
        if (newPwd && newPwd.trim().length >= 4) {
          setConfig(prev => ({ ...prev, adminPassword: newPwd.trim() }));
          setUserRole('admin');
          setShowLogin(false);
          showAlert("Successo", "Password salvata! Usala per i prossimi accessi.");
        } else {
          showAlert("Errore", "Password troppo corta.");
        }
      });
    } else if (pwd === guestPwd) {
      setUserRole('viewer');
      setShowLogin(false);
    } else {
      showAlert("Errore", "Password errata!");
    }
  };

  const [hasVisited, setHasVisited] = useState(() => localStorage.getItem('shift_pro_onboarded') === 'true');

  if (!hasVisited && view !== 'app') {
    return (
      <div style={{ '--primary': config.primaryColor }}>
        <Onboarding onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  const isLanding = view === 'landing' || view.startsWith('case-study');

  return (
    <div className="app-container" style={{ position: 'relative' }}>
      {view !== 'landing' && showLogin && (
        <LoginOverlay onLogin={handleLogin} onCancel={() => setShowLogin(false)} />
      )}
      {showExport && <ExportModule onClose={() => setShowExport(false)} currentViewDate={viewDate} />}
      {view !== 'landing' && !isPro && isTrialExpired && (
        <PaywallOverlay onUnlock={() => setIsPro(true)} />
      )}
      {/* Background Layer: Only active in App view, neutral in Landing */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, 
        width: '100vw', height: '100vh',
        background: isLanding 
          ? 'radial-gradient(circle at 50% 50%, #ffffff 0%, #f1f5f9 100%)' 
          : (config.backgroundColor || 'var(--bg-main)'),
        backgroundImage: (!isLanding && config.backgroundImage) ? `url(${config.backgroundImage})` : 'none',
        backgroundSize: config.backgroundMode === 'repeat' ? 'auto' : config.backgroundMode || 'cover',
        backgroundRepeat: config.backgroundMode === 'repeat' ? 'repeat' : 'no-repeat',
        backgroundPosition: 'center',
        zIndex: -1,
        pointerEvents: 'none'
      }}></div>

      {!isLanding && config.backgroundImage && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', pointerEvents: 'none', zIndex: 0 }}></div>
      )}
      {view !== 'landing' && (
        <Sidebar activeTab={activeTab} setTab={setTab} setView={setView} setShowLogin={setShowLogin} setShowExport={setShowExport} showAlert={showAlert} showConfirm={showConfirm} showPrompt={showPrompt} />
      )}
      <main style={{ 
        flex: 1, 
        minWidth: 0, 
        padding: view === 'landing' ? '0' : '1.5rem', 
        position: 'relative',
        zIndex: 1,
        overflowY: 'auto'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          {view === 'landing' ? (
            <LandingPage 
              config={config} 
              setView={setView} 
              onEnter={() => { 
                try {
                  setView('app'); 
                  setTab('calendar');
                } catch (e) {
                  console.error("Transition Error:", e);
                }
              }} 
            />
          ) : (
            <>
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                   <h1 style={{ fontSize: '2.25rem', fontWeight: '900', letterSpacing: '-0.04em', marginBottom: '0.25rem' }}>
                     {activeTab === 'calendar' ? 'Gestione Turni' : 
                      activeTab === 'staff' ? 'Team Management' : 
                      activeTab === 'stats' ? 'Analytics Avanzate' : 'Impostazioni Sistema'}
                   </h1>
                   <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                     {activeTab === 'calendar' ? 'Ottimizzazione rotazioni industriali in tempo reale.' : 
                      activeTab === 'staff' ? 'Configura i ruoli e le competenze del tuo team.' : 
                      activeTab === 'stats' ? 'Monitora performance e bilanciamento dei carichi.' : 'Configura l\'algoritmo e l\'identità visiva.'}
                   </p>
                </div>
                {activeTab === 'calendar' && (
                   <div style={{ display: 'flex', gap: '1rem' }}>
                     <button className="btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowExport(true)}>📥 Esporta PDF</button>
                     <button className="btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} onClick={() => window.print()}>🖨️ Stampa</button>
                   </div>
                )}
              </header>

              {activeTab === 'calendar' && <CalendarView viewDate={viewDate} setViewDate={setViewDate} showExport={showExport} setShowExport={setShowExport} />}
              {activeTab === 'staff' && <StaffManager />}
              {activeTab === 'stats' && <StatsDashboard />}
              {activeTab === 'settings' && <RuleSettings showAlert={showAlert} showConfirm={showConfirm} showPrompt={showPrompt} />}
            </>
          )}
        </div>
      </main>

      <Dialog 
        isOpen={dialog.isOpen}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        defaultValue={dialog.defaultValue}
        onConfirm={dialog.onConfirm}
        onCancel={() => setDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
