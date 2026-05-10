import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { calculateDailyShifts } from '../logic/ShiftEngine';

const StatsDashboard = () => {
  const { employees, exceptions, config } = useApp();
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth()); // 0-11
  const [statMode, setStatMode] = useState('monthly'); // 'monthly' or 'annual'

  const months = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const shiftTypes = ['A', 'B', 'C', 'G', 'FE', 'MA', 'RT', 'DS', '104', 'CO', 'CF'];

  const stats = useMemo(() => {
    const results = {};
    
    // Initialize results for each employee
    employees.forEach(emp => {
      results[emp.name] = {
        name: emp.name,
        role: emp.role,
        counts: shiftTypes.reduce((acc, type) => ({ ...acc, [type]: 0 }), {})
      };
    });

    const startDate = statMode === 'monthly' 
      ? new Date(viewYear, viewMonth, 1) 
      : new Date(viewYear, 0, 1);
    
    const endDate = statMode === 'monthly'
      ? new Date(viewYear, viewMonth + 1, 0)
      : new Date(viewYear, 11, 31);

    // Iterate through each day and count shifts
    let curr = new Date(startDate);
    while (curr <= endDate) {
      const dailyShifts = calculateDailyShifts(curr, employees, exceptions, config);
      dailyShifts.forEach(s => {
        if (results[s.name] && shiftTypes.includes(s.finalShift)) {
          results[s.name].counts[s.finalShift]++;
        }
      });
      curr.setDate(curr.getDate() + 1);
    }

    return Object.values(results).sort((a, b) => {
      if (a.role !== b.role) return a.role === 'CT' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [employees, exceptions, config, viewYear, viewMonth, statMode]);

  return (
    <div className="fade-in">
      <header className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', padding: '1.25rem 2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Statistiche e Conteggi</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Riepilogo turni e assenze per il personale
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="view-toggle" style={{ background: 'rgba(0,0,0,0.3)' }}>
            <button className={`toggle-btn ${statMode === 'monthly' ? 'active' : ''}`} onClick={() => setStatMode('monthly')}>Mensile</button>
            <button className={`toggle-btn ${statMode === 'annual' ? 'active' : ''}`} onClick={() => setStatMode('annual')}>Annuale</button>
          </div>

          {statMode === 'monthly' && (
            <select 
              value={viewMonth} 
              onChange={function(e) { setViewMonth(parseInt(e.target.value)) }}
              style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}
            >
              {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
          )}

          <select 
            value={viewYear} 
            onChange={(e) => setViewYear(parseInt(e.target.value))}
            style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}
          >
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </header>

      <div className="table-container glass-card" style={{ padding: '0' }}>
        <table className="shift-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left', paddingLeft: '2rem' }}>Dipendente</th>
              <th style={{ textAlign: 'center' }}>Ruolo</th>
              {shiftTypes.map(t => (
                <th key={t} style={{ textAlign: 'center', fontSize: '0.7rem' }}>
                  <div style={{ 
                    width: '24px', height: '24px', borderRadius: '4px', margin: '0 auto 4px',
                    background: config.shiftColors[t] || 'rgba(255,255,255,0.1)',
                    display: 'grid', placeItems: 'center', color: 'white'
                  }}>
                    {t}
                  </div>
                  {t}
                </th>
              ))}
              <th style={{ textAlign: 'center', borderLeft: '1px solid var(--glass-border)' }}>TOT Lav.</th>
            </tr>
          </thead>
          <tbody>
            {stats.map(row => {
              const totalWorked = row.counts.A + row.counts.B + row.counts.C + row.counts.G;
              return (
                <tr key={row.name}>
                  <td style={{ paddingLeft: '2rem' }}>
                    <div style={{ fontWeight: '600' }}>{row.name}</div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.7rem', opacity: 0.7, fontWeight: 'bold' }}>{row.role}</span>
                  </td>
                  {shiftTypes.map(t => (
                    <td key={t} style={{ textAlign: 'center', fontWeight: row.counts[t] > 0 ? '600' : '400', color: row.counts[t] > 0 ? 'var(--text-main)' : 'var(--text-muted)' }}>
                      {row.counts[t] || '-'}
                    </td>
                  ))}
                  <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--primary)', borderLeft: '1px solid var(--glass-border)' }}>
                    {totalWorked}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
        * TOT Lav. include i turni A, B, C e G (Giornaliero). Assenze e riposi sono conteggiati separatamente.
      </div>
    </div>
  );
};

export default StatsDashboard;
