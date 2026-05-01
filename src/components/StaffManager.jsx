import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function StaffManager() {
  const { employees, setEmployees, config } = useApp();
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState(config.roles[1]?.id || 'OP');
  
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editOffset, setEditOffset] = useState(0);

  const addEmployee = () => {
    if (!newName) return;
    setEmployees([...employees, { 
      name: newName, 
      role: newRole, 
      offset: 0,
      id: Math.random().toString(36).substr(2, 9)
    }]);
    setNewName('');
  };

  const removeEmployee = (id) => {
    setEmployees(employees.filter(e => e.id !== id));
  };

  const startEdit = (e) => {
    setEditingId(e.id);
    setEditName(e.name);
    setEditRole(e.role);
    setEditOffset(e.offset || 0);
  };

  const saveEdit = () => {
    if (!editName) return;
    setEmployees(employees.map(e => e.id === editingId ? { ...e, name: editName, role: editRole, offset: editOffset } : e));
    setEditingId(null);
  };

  const autoBalanceOffsets = () => {
    const rolesToBalance = [...new Set(employees.map(e => e.role))];
    let newEmp = [...employees];
    
    rolesToBalance.forEach(role => {
      const empsInRole = newEmp.filter(e => e.role === role);
      if (empsInRole.length === 0) return;
      
      const step = Math.max(1, Math.round(config.cycle.length / empsInRole.length));
      let currentOffset = 0;
      
      empsInRole.forEach(e => {
        const idx = newEmp.findIndex(x => x.id === e.id);
        newEmp[idx] = { ...newEmp[idx], offset: currentOffset };
        currentOffset = (currentOffset + step) % config.cycle.length;
      });
    });
    
    setEmployees(newEmp);
  };

  return (
    <div className="fade-in">
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Aggiungi Personale</h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input 
            className="input-main"
            placeholder="Nome Completo"
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
          <select 
            className="input-main"
            style={{ width: '150px' }}
            value={newRole}
            onChange={e => setNewRole(e.target.value)}
          >
            {config.roles.map(r => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
          <button className="btn-primary" onClick={addEmployee}>Aggiungi</button>
        </div>
      </div>

      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>Lista Dipendenti ({employees.length})</h3>
          <button className="btn-primary" onClick={autoBalanceOffsets} style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
            Auto-Distribuisci Turni
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          {employees.map(e => (
            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
              {editingId === e.id ? (
                <div style={{ display: 'flex', gap: '0.5rem', width: '100%', alignItems: 'center' }}>
                  <input className="input-main" style={{ padding: '0.4rem', flex: 1 }} value={editName} onChange={ev => setEditName(ev.target.value)} />
                  <select className="input-main" style={{ padding: '0.4rem', width: '80px' }} value={editRole} onChange={ev => setEditRole(ev.target.value)}>
                    {config.roles.map(r => <option key={r.id} value={r.id}>{r.id}</option>)}
                  </select>
                  <input type="number" className="input-main" style={{ padding: '0.4rem', width: '60px' }} value={editOffset} onChange={ev => setEditOffset(parseInt(ev.target.value) || 0)} title="Offset (giorni)" />
                  <button onClick={saveEdit} style={{ background: 'var(--primary)', border: 'none', color: 'white', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer' }}>✓</button>
                  <button onClick={() => setEditingId(null)} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer' }}>X</button>
                </div>
              ) : (
                <>
                  <div>
                    <div style={{ fontWeight: '600' }}>{e.name}</div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <span style={{ fontSize: '0.75rem', color: config.roles.find(r => r.id === e.role)?.color }}>{config.roles.find(r => r.id === e.role)?.label}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Offset: {e.offset || 0}</span>
                    </div>
                  </div>
                  <div>
                    <button 
                      onClick={() => startEdit(e)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem', marginRight: '0.8rem' }}
                    >
                      ✎
                    </button>
                    <button 
                      onClick={() => removeEmployee(e.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', fontSize: '1.2rem' }}
                    >
                      ×
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {employees.length === 0 && <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Nessun dipendente censito.</div>}
        </div>
      </div>
    </div>
  );
}
