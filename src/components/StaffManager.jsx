import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getMonthlyRole } from '../logic/ShiftEngine';

export default function StaffManager() {
  const { employees, setEmployees, config, setExceptions } = useApp();
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState(config.roles[1]?.id || 'OP');
  
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editTeam, setEditTeam] = useState(1);
  const [editOffset, setEditOffset] = useState(0);
  const [editAvatar, setEditAvatar] = useState(null);
  const [editInitials, setEditInitials] = useState('');

  const today = new Date();

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
    setEditTeam(e.team || 1);
    setEditOffset(e.offset || 0);
    setEditAvatar(e.avatar || null);
    setEditInitials(e.initials || e.name.substring(0, 2).toUpperCase());
  };

  const saveEdit = () => {
    if (!editName) return;
    setEmployees(employees.map(e => e.id === editingId ? { 
      ...e, 
      name: editName, 
      role: editRole, 
      offset: editOffset, 
      team: editTeam,
      avatar: editAvatar,
      initials: editInitials
    } : e));
    setEditingId(null);
  };

  const autoBalanceOffsets = () => {
    let newEmp = [...employees];
    
    // 1. Bilanciamento Capiturni (Pattern ottimizzato per ciclo 9gg e 4 fissi)
    // 0, 2, 5, 7 sono per i 4 fissi (copertura perfetta 1-1-1)
    // 3, 8 sono per SJ e Jolly
    const ctPattern = [0, 2, 5, 7, 3, 8]; 
    const cts = newEmp.filter(e => (e.role || '').toUpperCase() === 'CT');
    cts.forEach((e, i) => {
      const idx = newEmp.findIndex(x => x.id === e.id);
      newEmp[idx] = { ...newEmp[idx], offset: ctPattern[i % ctPattern.length] };
    });

    // 2. Bilanciamento Operatori (Squadra per squadra)
    const opPattern = [0, 3, 6, 1, 4, 7];
    [1, 2, 3].forEach(t => {
      const ops = newEmp.filter(e => (e.role || '').toUpperCase() === 'OP' && (parseInt(e.team) || 1) === t);
      ops.forEach((e, i) => {
        const idx = newEmp.findIndex(x => x.id === e.id);
        newEmp[idx] = { ...newEmp[idx], offset: opPattern[i % opPattern.length] };
      });
    });

    setEmployees(newEmp);
    setExceptions([]); 
    alert("Capiturni e Squadre ricalcolati con successo!");
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
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
                <div style={{ display: 'flex', gap: '0.5rem', width: '100%', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input className="input-main" style={{ padding: '0.4rem', flex: '1 1 100%' }} value={editName} onChange={ev => setEditName(ev.target.value)} />
                  <select className="input-main" style={{ padding: '0.4rem', width: '80px' }} value={editRole} onChange={ev => setEditRole(ev.target.value)}>
                    {config.roles.map(r => <option key={r.id} value={r.id}>{r.id}</option>)}
                  </select>
                  {editRole === 'OP' && (
                    <select 
                      className="input-main" 
                      style={{ padding: '0.4rem', width: '90px' }} 
                      value={editTeam} 
                      onChange={ev => setEditTeam(parseInt(ev.target.value))}
                    >
                      <option value="1">Sq. 1</option>
                      <option value="2">Sq. 2</option>
                      <option value="3">Sq. 3</option>
                    </select>
                  )}
                  <input type="number" className="input-main" style={{ padding: '0.4rem', width: '60px' }} value={editOffset} onChange={ev => setEditOffset(parseInt(ev.target.value) || 0)} title="Offset" />
                  
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', marginTop: '10px', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {editAvatar ? <img src={editAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontWeight: 'bold' }}>{editInitials}</span>}
                    </div>
                    <label className="btn-primary" style={{ fontSize: '0.65rem', padding: '5px 10px', cursor: 'pointer' }}>
                      Carica Foto
                      <input type="file" hidden accept="image/*" onChange={handleAvatarUpload} />
                    </label>
                    {editAvatar && <button onClick={() => setEditAvatar(null)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-danger)', fontSize: '0.65rem', cursor: 'pointer' }}>Rimuovi</button>}
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block' }}>Iniziali</label>
                      <input className="input-main" style={{ padding: '4px', width: '50px', textAlign: 'center' }} value={editInitials} onChange={ev => setEditInitials(ev.target.value.toUpperCase().substring(0, 2))} maxLength={2} />
                    </div>
                  </div>

                  <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                    <button onClick={saveEdit} style={{ background: 'var(--primary)', border: 'none', color: 'var(--text-main)', padding: '0.6rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Salva Modifiche ✓</button>
                    <button onClick={() => setEditingId(null)} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>Annulla</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ 
                      width: '45px', height: '45px', borderRadius: '50%', 
                      background: 'var(--primary)', 
                      overflow: 'hidden', 
                      display: 'flex', justifyContent: 'center', alignItems: 'center',
                      border: '2px solid var(--glass-border)',
                      flexShrink: 0
                    }}>
                      {e.avatar ? (
                        <img src={e.avatar} alt={e.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>{e.initials || e.name.substring(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {e.name}
                        {(() => {
                          const mRole = getMonthlyRole(e, today, employees, config);
                          if (mRole === 'SJ') return <span style={{ fontSize: '0.6rem', padding: '1px 4px', background: 'var(--primary)', color: 'var(--text-main)', borderRadius: '3px' }}>SJ</span>;
                          if (mRole === 'J') return <span style={{ fontSize: '0.6rem', padding: '1px 4px', background: 'var(--accent-warning)', color: 'var(--text-main)', borderRadius: '3px' }}>JOLLY</span>;
                          return null;
                        })()}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: config.roles.find(r => r.id === e.role)?.color }}>
                          {config.roles.find(r => r.id === e.role)?.label}
                        </span>
                        {e.role === 'OP' && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Squadra {e.team || 1}</span>}
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 4px', borderRadius: '3px' }}>Off: {e.offset || 0}</span>
                      </div>
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
