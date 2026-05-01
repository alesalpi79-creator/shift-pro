import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getMonthlyRole } from '../logic/ShiftEngine';

export default function RuleSettings() {
  const { config, setConfig, employees } = useApp();
  const [tempCycle, setTempCycle] = useState(config.cycle.join(', '));

  const saveConfig = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleCycleSave = () => {
    const newCycle = tempCycle.split(',').map(s => s.trim().toUpperCase()).filter(s => s.length > 0);
    saveConfig('cycle', newCycle);
  };

  const updateQuota = (key, val) => {
    const currentQuotas = config.quotas || {};
    saveConfig('quotas', { ...currentQuotas, [key]: parseInt(val) || 0 });
  };

  const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

  return (
    <div className="fade-in" style={{ paddingBottom: '5rem' }}>
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Identità Applicazione</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nome App</label>
            <input 
              className="input-main"
              value={config.appName}
              onChange={e => saveConfig('appName', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Colore Primario</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
               <input 
                type="color" 
                style={{ width: '50px', height: '42px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                value={config.primaryColor}
                onChange={e => saveConfig('primaryColor', e.target.value)}
              />
              <input 
                className="input-main"
                value={config.primaryColor}
                onChange={e => saveConfig('primaryColor', e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Colore Sfondo</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
               <input 
                type="color" 
                style={{ width: '50px', height: '42px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                value={config.backgroundColor || '#0f172a'}
                onChange={e => saveConfig('backgroundColor', e.target.value)}
              />
              <input 
                className="input-main"
                value={config.backgroundColor || '#0f172a'}
                onChange={e => saveConfig('backgroundColor', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Personalizzazione Colori Turni</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
          {[
            { id: 'A', label: 'Mattina (A)', default: '#0ea5e9' },
            { id: 'B', label: 'Notte (B)', default: '#8b5cf6' },
            { id: 'C', label: 'Pomeriggio (C)', default: '#f59e0b' }
          ].map(shift => (
            <div className="form-group" key={shift.id}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{shift.label}</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="color" 
                  style={{ width: '50px', height: '42px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  value={config.shiftColors?.[shift.id] || shift.default}
                  onChange={e => saveConfig('shiftColors', { ...config.shiftColors, [shift.id]: e.target.value })}
                />
                <input 
                  className="input-main"
                  value={config.shiftColors?.[shift.id] || shift.default}
                  onChange={e => saveConfig('shiftColors', { ...config.shiftColors, [shift.id]: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
          Rotazione Jolly e Semi-Jolly (Quotas)
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Rotazione ogni 2 mesi</span>
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <div className="form-group">
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Jolly CT</label>
            <input type="number" className="input-main" value={config.quotas.jollyCt} onChange={e => updateQuota('jollyCt', e.target.value)} />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SJ CT</label>
            <input type="number" className="input-main" value={config.quotas.sjCt} onChange={e => updateQuota('sjCt', e.target.value)} />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Jolly OP</label>
            <input type="number" className="input-main" value={config.quotas.jollyOp} onChange={e => updateQuota('jollyOp', e.target.value)} />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SJ OP</label>
            <input type="number" className="input-main" value={config.quotas.sjOp} onChange={e => updateQuota('sjOp', e.target.value)} />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0.5rem', color: 'var(--text-muted)' }}>Dipendente</th>
                {months.map(m => <th key={m} style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>{m}</th>)}
              </tr>
            </thead>
            <tbody>
              {employees.map(e => (
                <tr key={e.id} style={{ borderTop: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{e.name}</td>
                  {months.map((m, mIdx) => {
                    const role = getMonthlyRole(e, new Date(new Date().getFullYear(), mIdx, 1), employees, config);
                    let color = 'transparent';
                    let text = '-';
                    if (role === 'J') { color = 'var(--accent-warning)'; text = 'L'; }
                    if (role === 'SJ') { color = 'var(--primary)'; text = 'SJ'; }
                    return (
                      <td key={m} style={{ padding: '0.5rem', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '2px 6px', 
                          borderRadius: '4px', 
                          background: color === 'transparent' ? 'transparent' : color + '33',
                          border: color === 'transparent' ? 'none' : `1px solid ${color}66`,
                          color: color === 'transparent' ? 'var(--text-muted)' : color
                        }}>
                          {text}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Configurazione Ciclo Turni</h3>
        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sequenza Ciclo (es. R, R, A, A, C, C, R, R, B, B)</label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input 
              className="input-main"
              value={tempCycle}
              onChange={e => setTempCycle(e.target.value)}
            />
            <button className="btn-primary" onClick={handleCycleSave}>Salva Ciclo</button>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Attualmente il ciclo dura <strong>{config.cycle.length} giorni</strong>. Legenda: A=Mattina, B=Notte, C=Pomeriggio, R=Riposo.
          </p>
        </div>
      </div>

      <div className="glass-card">
        <h3 style={{ marginBottom: '1.5rem' }}>Vincoli di Copertura per Turno</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {['A', 'B', 'C'].map(shiftId => (
            <div key={shiftId} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Turno {config.shifts[shiftId].label}</div>
              {config.roles.map(role => (
                <div key={role.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem' }}>{role.label}</span>
                  <input 
                    type="number"
                    style={{ width: '50px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '4px', textAlign: 'center' }}
                    value={config.constraints[shiftId]?.[role.id] || 0}
                    onChange={e => {
                      const newConstraints = { ...config.constraints };
                      if (!newConstraints[shiftId]) newConstraints[shiftId] = {};
                      newConstraints[shiftId][role.id] = parseInt(e.target.value) || 0;
                      saveConfig('constraints', newConstraints);
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ marginTop: '2rem', border: '1px solid var(--accent-danger)' }}>
        <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-danger)' }}>Area Pericolosa</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Usa questo pulsante per eliminare tutti i dati salvati (nomi, dipendenti, eccezioni e impostazioni) e riportare l'app allo stato iniziale. Utile se vuoi fare una nuova installazione pulita.
        </p>
        <button 
          className="btn-primary" 
          style={{ background: 'var(--accent-danger)', color: 'white' }}
          onClick={() => {
            if(window.confirm("Sei sicuro di voler CANCELLARE TUTTI I DATI? Questa azione non può essere annullata!")) {
              localStorage.removeItem('shift_pro_config');
              localStorage.removeItem('shift_pro_employees');
              localStorage.removeItem('shift_pro_exceptions');
              localStorage.removeItem('onboarding_complete');
              window.location.reload();
            }
          }}
        >
          🗑️ Ripristino Dati di Fabbrica
        </button>
      </div>
    </div>
  );
}
