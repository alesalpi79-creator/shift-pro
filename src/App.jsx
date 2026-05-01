import React, { useState, useMemo } from 'react';
import { useApp } from './context/AppContext';
import { calculateDailyShifts } from './logic/ShiftEngine';
import StaffManager from './components/StaffManager';
import RuleSettings from './components/RuleSettings';
import Onboarding from './components/Onboarding';
import ExportModule from './components/ExportModule';
import './index.css';

// Component Icons (Simulated)
const IconCalendar = () => <span>📅</span>;
const IconUsers = () => <span>👥</span>;
const IconSettings = () => <span>⚙️</span>;
const IconUser = () => <span>👤</span>;

const Sidebar = ({ activeTab, setTab }) => {
  const { userRole, setUserRole, config } = useApp();
  
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
            <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>
              <IconSettings /> Impostazioni
            </div>
          </>
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
              const pwd = window.prompt("Inserisci la password di amministrazione (admin):");
              if (pwd === "admin") {
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
              const pwd = window.prompt("Inserisci la password di amministrazione (admin):");
              if (pwd === "admin") {
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
      </div>
    </div>
  );
};

const DayDetails = ({ date, onClose }) => {
  const { employees, exceptions, setExceptions, config, userRole } = useApp();
  const shifts = useMemo(() => calculateDailyShifts(employees, date, exceptions, config), [employees, date, exceptions, config]);

  const dateStr = date.toISOString().split('T')[0];

  const updateShift = (employeeName, type) => {
    if (userRole !== 'admin') return;
    const filtered = exceptions.filter(ex => !(ex.employee === employeeName && ex.date === dateStr));
    setExceptions([...filtered, { employee: employeeName, date: dateStr, type }]);
  };

  return (
    <div className="fade-in" style={{ position: 'fixed', top: 0, right: 0, width: '400px', height: '100vh', background: 'var(--bg-sidebar)', borderLeft: '1px solid var(--glass-border)', padding: '2rem', zIndex: 100, boxShadow: '-10px 0 30px rgba(0,0,0,0.5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem' }}>{date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {shifts.map(s => {
          const roleColor = config.roles.find(r => r.id === s.baseRole)?.color || 'white';
          return (
          <div key={s.name} className="glass-card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', color: roleColor }}>
                {s.name}
                {s.isJolly && <span style={{ fontSize: '0.6rem', padding: '1px 4px', background: 'var(--accent-warning)', color: 'white', borderRadius: '3px' }}>L</span>}
                {s.isSJ && <span style={{ fontSize: '0.6rem', padding: '1px 4px', background: 'var(--primary)', color: 'white', borderRadius: '3px' }}>SJ</span>}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.baseRole}</div>
            </div>
            
            <div style={{ display: 'flex', gap: '4px' }}>
              {['A', 'B', 'C', 'R'].map(st => {
                let bgColor = 'transparent';
                if (s.finalShift === st) {
                  if (st === 'A') bgColor = 'var(--shift-a)';
                  else if (st === 'B') bgColor = 'var(--shift-b)';
                  else if (st === 'C') bgColor = 'var(--shift-c)';
                  else bgColor = 'rgba(255,255,255,0.1)';
                }
                return (
                <button 
                  key={st}
                  onClick={() => updateShift(s.name, st)}
                  disabled={userRole !== 'admin'}
                  style={{ 
                    width: '30px', height: '30px', borderRadius: '6px', border: '1px solid var(--glass-border)',
                    background: bgColor,
                    color: s.finalShift === st ? 'white' : 'var(--text-muted)',
                    fontSize: '0.7rem', fontWeight: 'bold', cursor: userRole === 'admin' ? 'pointer' : 'default',
                    opacity: userRole === 'admin' ? 1 : 0.6
                  }}
                >
                  {st}
                </button>
              )})}
            </div>
          </div>
        )})}
      </div>
    </div>
  );
};

const ShiftGridView = ({ days, employees, exceptions, config, onDayClick }) => {
  const gridData = useMemo(() => {
    return days.map(date => {
      if (!date) return [];
      return calculateDailyShifts(employees, date, exceptions, config);
    });
  }, [days, employees, exceptions, config]);

  const visibleEmployees = useMemo(() => {
    return employees.filter(emp => {
      return gridData.some(dayShifts => {
        if (!dayShifts) return false;
        const s = dayShifts.find(x => x.name === emp.name);
        return s && ['A', 'B', 'C'].includes(s.finalShift);
      });
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
                      {(() => {
                        const firstValidDay = gridData.find(d => d && d.length > 0);
                        if (!firstValidDay) return null;
                        const empFirstDay = firstValidDay.find(s => s.name === emp.name);
                        if (empFirstDay?.isJolly) return <span style={{ fontSize: '0.55rem', padding: '1px 4px', background: 'var(--accent-warning)', color: 'white', borderRadius: '4px' }}>Jolly</span>;
                        if (empFirstDay?.isSJ) return <span style={{ fontSize: '0.55rem', padding: '1px 4px', background: 'var(--primary)', color: 'white', borderRadius: '4px' }}>SJ</span>;
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
                
                if (shiftType === 'R') { 
                  return <td key={date.toISOString()} onClick={() => onDayClick(date)} style={{ cursor: 'pointer' }}></td>;
                }

                // Applica il colore in base al ruolo (CT o OP)
                bgColor = roleColor;
                textColor = 'white';

                return (
                  <td key={date.toISOString()} onClick={() => onDayClick(date)} style={{ cursor: 'pointer' }}>
                    <div className="shift-pill" style={{ background: bgColor, color: textColor, border: border }}>
                      {shiftType}
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
  const [showExport, setShowExport] = useState(false);

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
      {selectedDay && <DayDetails date={selectedDay} onClose={() => setSelectedDay(null)} />}
      {showExport && <ExportModule onClose={() => setShowExport(false)} currentViewDate={viewDate} />}
      
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{monthName.charAt(0).toUpperCase() + monthName.slice(1)}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Pianificazione e bilanciamento turni giornalieri</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
             onClick={() => setShowExport(true)}
             className="btn-primary" 
             style={{ padding: '0.4rem 0.8rem', background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            📥 Esporta
          </button>
          
          <div className="view-toggle">
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
              const dailyShifts = (date && employees.length > 0) ? calculateDailyShifts(employees, date, exceptions, config) : [];
              const shiftCounts = dailyShifts.reduce((acc, p) => {
                acc[p.finalShift] = (acc[p.finalShift] || 0) + 1;
                return acc;
              }, {});

              const isToday = date && date.toDateString() === new Date().toDateString();

              return (
                <div key={i} className={`calendar-day ${!date ? 'disabled' : ''} ${isToday ? 'today' : ''}`} onClick={() => date && setSelectedDay(date)}>
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
                          if (st === 'A') { bgColor = 'var(--shift-a)'; textColor = 'white'; }
                          else if (st === 'B') { bgColor = 'var(--shift-b)'; textColor = 'white'; }
                          else if (st === 'C') { bgColor = 'var(--shift-c)'; textColor = 'white'; }
                          else if (st === 'R') { border = '1px solid var(--shift-r)'; }
                          else { bgColor = config.primaryColor; textColor = 'white'; }
                          
                          return (
                            <div key={st} style={{ 
                              fontSize: '0.65rem', padding: '1px 6px', 
                              background: bgColor, color: textColor, 
                              borderRadius: '4px', border: border, fontWeight: 600,
                              display: 'flex', gap: '4px', alignItems: 'center'
                            }}>
                              <span>{st}:</span> <span>{shiftCounts[st]}</span>
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
          onDayClick={setSelectedDay}
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
  const { config } = useApp();

  const handleOnboardingComplete = () => {
    localStorage.setItem('onboarding_complete', 'true');
    setShowOnboarding(false);
  };

  React.useEffect(() => {
    document.documentElement.style.setProperty('--bg-main', config.backgroundColor || '#0f172a');
    // adjust sidebar background slightly based on main background
    document.documentElement.style.setProperty('--bg-sidebar', (config.backgroundColor + 'E6') || '#1e293b');
    
    if (config.shiftColors) {
      document.documentElement.style.setProperty('--shift-a', config.shiftColors.A || '#0ea5e9');
      document.documentElement.style.setProperty('--shift-b', config.shiftColors.B || '#8b5cf6');
      document.documentElement.style.setProperty('--shift-c', config.shiftColors.C || '#f59e0b');
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
    <div className="app-container" style={{ '--primary': config.primaryColor }}>
      <Sidebar activeTab={activeTab} setTab={setTab} />
      <main style={{ flex: 1, padding: '2.5rem', background: `radial-gradient(circle at top right, ${config.primaryColor}11, transparent), var(--bg-main)` }}>
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'staff' && <StaffManager />}
        {activeTab === 'settings' && <RuleSettings />}
      </main>
    </div>
  );
}

export default App;
