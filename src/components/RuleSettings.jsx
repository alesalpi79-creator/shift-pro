import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { getMonthlyRole } from '../logic/ShiftEngine';

const PremiumColorPicker = ({ value, onChange, label, isOpen, onToggle, selectedHue, setSelectedHue }) => {
  const hues = [
    { name: 'Rosso', color: '#ef4444', shades: ['#fee2e2', '#fca5a5', '#f87171', '#ef4444', '#b91c1c'] },
    { name: 'Arancio', color: '#f97316', shades: ['#ffedd5', '#fdba74', '#fb923c', '#f97316', '#c2410c'] },
    { name: 'Giallo', color: '#eab308', shades: ['#fef9c3', '#fde047', '#facc15', '#eab308', '#a16207'] },
    { name: 'Verde', color: '#22c55e', shades: ['#dcfce7', '#86efac', '#4ade80', '#22c55e', '#15803d'] },
    { name: 'Ciano', color: '#06b6d4', shades: ['#cffafe', '#67e8f9', '#22d3ee', '#06b6d4', '#0e7490'] },
    { name: 'Blu', color: '#3b82f6', shades: ['#dbeafe', '#93c5fd', '#60a5fa', '#3b82f6', '#1d4ed8'] },
    { name: 'Indaco', color: '#6366f1', shades: ['#e0e7ff', '#a5b4fc', '#818cf8', '#6366f1', '#4338ca'] },
    { name: 'Viola', color: '#a855f7', shades: ['#ede9fe', '#ddd6fe', '#c084fc', '#a855f7', '#7e22ce'] },
    { name: 'Rosa', color: '#ec4899', shades: ['#fce7f3', '#f9a8d4', '#f472b6', '#ec4899', '#be185d'] },
    { name: 'Grigio', color: '#64748b', shades: ['#f1f5f9', '#cbd5e1', '#94a3b8', '#64748b', '#334155'] },
  ];

  return (
    <div className="form-group" style={{ marginBottom: '1.25rem' }} onClick={e => e.stopPropagation()}>
      {label && <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.6rem', display: 'block' }}>{label}</label>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div 
          onClick={onToggle}
          style={{ 
            width: '100%', height: '42px', borderRadius: '12px', background: value, 
            border: '1px solid var(--glass-border)', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.75rem', fontWeight: 'bold',
            color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.3)', transition: 'all 0.2s'
          }} 
        >
          {isOpen ? 'CHIUDI TAVOLOZZA' : 'CAMBIA COLORE'}
        </div>

        {isOpen && (
          <div style={{ 
            padding: '1rem', background: 'var(--bg-sidebar)', marginTop: '8px', 
            borderRadius: '16px', border: '1px solid var(--primary)', 
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)', zIndex: 100,
            animation: 'fadeUpIn 0.3s ease'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>1. Scegli Tonalità</div>
            <div style={{ display: 'flex', overflowX: 'auto', gap: '12px', paddingBottom: '12px' }} className="no-scrollbar">
              {hues.map(h => (
                <div 
                  key={h.name}
                  onClick={() => setSelectedHue(h)}
                  style={{ 
                    width: '36px', height: '36px', borderRadius: '50%', background: h.color, 
                    border: selectedHue?.name === h.name ? '3px solid white' : '2px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer', flexShrink: 0, transform: selectedHue?.name === h.name ? 'scale(1.15)' : 'none',
                    transition: 'all 0.2s', boxShadow: selectedHue?.name === h.name ? `0 0 15px ${h.color}` : 'none'
                  }}
                />
              ))}
              <div style={{ position: 'relative', width: '36px', height: '36px', flexShrink: 0 }}>
                <input 
                  type="color" 
                  value={value} 
                  onChange={e => onChange(e.target.value)}
                  style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} 
                />
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'conic-gradient(red, yellow, green, cyan, blue, magenta, red)', border: '2px solid white' }}></div>
              </div>
            </div>

            {selectedHue && (
              <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>2. Gradazione ({selectedHue.name})</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                  {selectedHue.shades.map(s => (
                    <div 
                      key={s}
                      onClick={() => onChange(s)}
                      style={{ 
                        height: '34px', borderRadius: '8px', background: s, 
                        border: value === s ? '3px solid white' : '1px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: value === s ? `0 0 10px ${s}` : 'none',
                        transform: value === s ? 'scale(1.1)' : 'none'
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default function RuleSettings() {
  const { config, setConfig, employees, setEmployees, exceptions, setExceptions } = useApp();
  const [activeSection, setActiveSection] = useState('design');
  
  // Stato persistente per il color picker per evitare chiusure dovute a re-render
  const [openPickerId, setOpenPickerId] = useState(() => localStorage.getItem('sp_open_picker') || null);
  const [selectedHue, setSelectedHue] = useState(() => {
    const saved = localStorage.getItem('sp_selected_hue');
    try { return saved ? JSON.parse(saved) : null; } catch(e) { return null; }
  });

  const togglePicker = (id) => {
    const newId = openPickerId === id ? null : id;
    setOpenPickerId(newId);
    if (newId) localStorage.setItem('sp_open_picker', newId);
    else localStorage.removeItem('sp_open_picker');
  };

  const handleHueSelect = (hue) => {
    setSelectedHue(hue);
    localStorage.setItem('sp_selected_hue', JSON.stringify(hue));
  };

  const [tempCycle, setTempCycle] = useState(() => {
    const cycle = config.cycle || [];
    return Array.isArray(cycle) ? cycle.join(', ') : (typeof cycle === 'string' ? cycle : '');
  });

  const saveConfig = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const safeShiftLabels = config.shiftLabels || {};
  const safeShiftColors = config.shiftColors || {};
  const safeCycle = Array.isArray(config.cycle) ? config.cycle : (typeof config.cycle === 'string' ? config.cycle.split(',').map(s => s.trim()) : []);

  const handleCycleSave = () => {
    const newCycle = tempCycle.split(',').map(s => s.trim().toUpperCase()).filter(s => s.length > 0);
    saveConfig('cycle', newCycle);
  };

  const updateQuota = (key, val) => {
    const currentQuotas = config.quotas || {};
    saveConfig('quotas', { ...currentQuotas, [key]: parseInt(val) || 0 });
  };

  const addNewShift = () => {
    const name = window.prompt("Inserisci la sigla del nuovo turno (es. ST, PERM, ...):");
    if (name && name.trim()) {
      const id = name.trim().toUpperCase();
      if (config.shiftColors[id]) {
        alert("Questa sigla esiste già!");
        return;
      }
      const newColors = { ...safeShiftColors, [id]: '#6366f1' };
      const newLabels = { ...safeShiftLabels, [id]: id };
      setConfig(prev => ({
        ...prev,
        shiftColors: newColors,
        shiftLabels: newLabels
      }));
    }
  };

  const removeShift = (id) => {
    if (['A', 'B', 'C', 'R'].includes(id)) {
      alert("I turni base (A, B, C, R) non possono essere rimossi.");
      return;
    }
    if (window.confirm(`Rimuovere la sigla ${id}?`)) {
      const newColors = { ...safeShiftColors };
      const newLabels = { ...safeShiftLabels };
      delete newColors[id];
      delete newLabels[id];
      setConfig(prev => ({
        ...prev,
        shiftColors: newColors,
        shiftLabels: newLabels
      }));
    }
  };

  const handleExport = () => {
    const data = {
      config,
      employees,
      exceptions,
      exportDate: new Date().toISOString(),
      version: "21.0"
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
          alert("Dati importati con successo! L'app verrà ricaricata.");
          window.location.reload();
        }
      } catch (err) {
        alert("Errore nell'importazione: il file non sembra un backup valido di Shift-Pro.");
      }
    };
    reader.readAsText(file);
  };

  const [activeDesignCard, setActiveDesignCard] = useState(0);
  const designCardsRef = useRef(null);

  const handleDesignScroll = (e) => {
    const scrollLeft = e.target.scrollLeft;
    const width = e.target.offsetWidth;
    const index = Math.round(scrollLeft / width);
    if (index !== activeDesignCard) setActiveDesignCard(index);
  };

  const scrollToCard = (index) => {
    if (designCardsRef.current) {
      const width = designCardsRef.current.offsetWidth;
      designCardsRef.current.scrollTo({ left: index * width, behavior: 'smooth' });
      setActiveDesignCard(index);
    }
  };

  const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

  const renderDesign = () => (
    <div className="fade-in">
      <div 
        ref={designCardsRef}
        onScroll={handleDesignScroll}
        style={{ 
          display: 'flex', 
          overflowX: 'auto', 
          paddingBottom: '1rem', 
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          padding: '10px',
          width: '100%',
          boxSizing: 'border-box'
        }} 
        className="no-scrollbar settings-horizontal-flow"
      >
        {/* SCHEDA 1: IDENTITÀ APP */}
        <div className="glass-card" style={{ width: '100%', minWidth: '100%', flex: '0 0 100%', scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column', gap: '1.2rem', boxSizing: 'border-box' }}>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>🏷️ Identità</h3>
          
          <div className="form-group">
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Logo Aziendale</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {config.appLogo ? (
                <img src={config.appLogo} alt="Logo Preview" style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'contain', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }} />
              ) : (
                <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: config.primaryColor, display: 'grid', placeItems: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>{config.appName.charAt(0)}</div>
              )}
              <label className="btn-primary" style={{ flex: 1, textAlign: 'center', cursor: 'pointer', fontSize: '0.75rem', padding: '10px' }}>
                {config.appLogo ? '🔄 Cambia' : '🖼️ Carica'}
                <input 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => saveConfig('appLogo', reader.result);
                      reader.readAsDataURL(file);
                    }
                  }} 
                />
              </label>
              {config.appLogo && (
                <button 
                  className="btn-primary" 
                  style={{ background: 'var(--accent-danger)', padding: '0 12px' }}
                  onClick={() => saveConfig('appLogo', '')}
                >✕</button>
              )}
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.5rem', display: 'block' }}>Nome App</label>
            <input className="input-main" value={config.appName} onChange={e => saveConfig('appName', e.target.value)} style={{ fontSize: '0.9rem', padding: '10px' }} />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.5rem', display: 'block' }}>Sottotitolo</label>
            <input className="input-main" value={config.appTagline || ''} placeholder="Es: Motore AI Industriale" onChange={e => saveConfig('appTagline', e.target.value)} style={{ fontSize: '0.85rem', padding: '10px' }} />
          </div>
        </div>

        {/* SCHEDA 2: TAVOLOZZA COLORI */}
        <div className="glass-card" style={{ width: '100%', minWidth: '100%', flex: '0 0 100%', scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column', gap: '0.8rem', boxSizing: 'border-box' }}>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>🎨 Tavolozza</h3>
          
          <PremiumColorPicker label="Primario" value={config.primaryColor} onChange={val => saveConfig('primaryColor', val)} isOpen={openPickerId === 'primary'} onToggle={() => togglePicker('primary')} selectedHue={selectedHue} setSelectedHue={handleHueSelect} />
          
          <PremiumColorPicker label="Sfondo" value={config.backgroundColor || '#0f172a'} onChange={val => saveConfig('backgroundColor', val)} isOpen={openPickerId === 'bg'} onToggle={() => togglePicker('bg')} selectedHue={selectedHue} setSelectedHue={handleHueSelect} />
          
          <PremiumColorPicker label="Testo App" value={config.textColor || '#ffffff'} onChange={val => saveConfig('textColor', val)} isOpen={openPickerId === 'text'} onToggle={() => togglePicker('text')} selectedHue={selectedHue} setSelectedHue={handleHueSelect} />
          
          <PremiumColorPicker label="Testo Sidebar" value={config.sidebarTextColor || '#ffffff'} onChange={val => saveConfig('sidebarTextColor', val)} isOpen={openPickerId === 'sideText'} onToggle={() => togglePicker('sideText')} selectedHue={selectedHue} setSelectedHue={handleHueSelect} />
        </div>

        {/* SCHEDA 3: SFONDO & EFFETTI */}
        <div className="glass-card" style={{ width: '100%', minWidth: '100%', flex: '0 0 100%', scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column', gap: '1.2rem', boxSizing: 'border-box' }}>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>🖼️ Effetti</h3>
          
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.8rem', display: 'block' }}>Sfondo Personalizzato</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input 
                className="input-main" 
                style={{ flex: 1, fontSize: '0.8rem' }}
                placeholder="URL immagine..." 
                value={config.backgroundImage && !config.backgroundImage.startsWith('data:') ? config.backgroundImage : ''} 
                onChange={e => saveConfig('backgroundImage', e.target.value)} 
              />
              <label className="btn-primary" style={{ padding: '0 12px', display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.7rem', background: 'var(--primary)' }}>
                📁
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                  const file = e.target.files[0];
                  if (file && file.size <= 1.5 * 1024 * 1024) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      saveConfig('backgroundImage', reader.result);
                      if (!config.backgroundMode) saveConfig('backgroundMode', 'cover');
                    };
                    reader.readAsDataURL(file);
                  } else if (file) alert("Immagine troppo grande (>1.5MB)");
                }} />
              </label>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Visualizzazione:</div>
              <div style={{ display: 'flex', gap: '4px', opacity: config.backgroundImage ? 1 : 0.5 }}>
                {['cover', 'repeat', 'contain'].map(m => (
                  <button key={m} className={`toggle-btn ${config.backgroundMode === m ? 'active' : ''}`} style={{ flex: 1, fontSize: '0.65rem', padding: '6px' }} onClick={() => saveConfig('backgroundMode', m)}>
                    {m === 'cover' ? 'Adatta' : m === 'repeat' ? 'Ripeti' : 'Centra'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Opacità Vetro</label>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary)' }}>{Math.round((config.glassOpacity || 0.4) * 100)}%</span>
            </div>
            <input type="range" min="0.1" max="0.9" step="0.05" style={{ width: '100%', accentColor: 'var(--primary)' }} value={config.glassOpacity || 0.4} onChange={e => saveConfig('glassOpacity', parseFloat(e.target.value))} />
          </div>
        </div>
        {/* SCHEDA 4: COLORI E SIGLE TURNI */}
        <div className="glass-card" style={{ width: '100%', minWidth: '100%', flex: '0 0 100%', scrollSnapAlign: 'start', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>🎨 Sigle Turni</h3>
            <button 
              onClick={addNewShift}
              style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold', display: 'grid', placeItems: 'center', boxShadow: '0 4px 10px var(--primary)44' }}
            >+</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem' }}>
            {Object.keys(config.shiftColors).map(id => (
              <div key={id} style={{ textAlign: 'center', position: 'relative' }}>
                { !['A', 'B', 'C', 'R'].includes(id) && (
                  <button 
                    onClick={() => removeShift(id)}
                    style={{ position: 'absolute', top: '-5px', right: '5px', width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.6rem', cursor: 'pointer', zIndex: 1 }}
                  >✕</button>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <PremiumColorPicker value={safeShiftColors[id] || '#6366f1'} onChange={val => saveConfig('shiftColors', { ...safeShiftColors, [id]: val })} isOpen={openPickerId === `shift-${id}`} onToggle={() => togglePicker(`shift-${id}`)} selectedHue={selectedHue} setSelectedHue={handleHueSelect} />
                  <input 
                    className="input-main"
                    style={{ width: '60px', textAlign: 'center', fontSize: '0.7rem', padding: '5px', fontWeight: 'bold', marginTop: '-10px' }}
                    value={safeShiftLabels[id] || id}
                    onChange={e => {
                      const newLabels = { ...safeShiftLabels };
                      newLabels[id] = e.target.value.toUpperCase();
                      saveConfig('shiftLabels', newLabels);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* INDICATORI DI PAGINA (PUNTINI) */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '1rem', marginBottom: '2rem' }}>
        {[0, 1, 2, 3].map(i => (
          <div 
            key={i} 
            onClick={() => scrollToCard(i)}
            style={{ 
              width: activeDesignCard === i ? '24px' : '10px', 
              height: '10px', 
              borderRadius: '10px', 
              background: activeDesignCard === i ? 'var(--primary)' : 'rgba(255,255,255,0.2)',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: activeDesignCard === i ? '0 0 10px var(--primary-glow)' : 'none'
            }}
          />
        ))}
      </div>
    </div>
  );

  const renderRules = () => (
    <div className="fade-in">
      <div style={{ 
        background: 'var(--bg-main)', // Uso variabile dinamica
        backdropFilter: 'blur(40px)',
        borderRadius: '50%', width: '280px', height: '280px', margin: '0 auto 2rem auto',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        border: '5px solid var(--primary)', 
        boxShadow: '0 15px 40px var(--primary-glow)',
        position: 'relative'
      }}>
        <div style={{ position: 'absolute', top: '15%', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '3px', color: 'var(--primary)', fontWeight: '900' }}>Algoritmo</div>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', color: 'var(--text-main)' }}>Ciclo Turni</h3>
        <input 
          className="input-main" 
          style={{ width: '85%', textAlign: 'center', background: 'rgba(0,0,0,0.05)', border: '2px solid var(--primary)', fontSize: '1.2rem', letterSpacing: '2px', fontWeight: 'bold', borderRadius: '10px', color: 'var(--text-main)' }} 
          value={tempCycle} 
          onChange={e => setTempCycle(e.target.value.toUpperCase())} 
        />
        <button className="btn-primary" onClick={handleCycleSave} style={{ marginTop: '1.5rem', borderRadius: '2rem', padding: '12px 30px', background: '#6366f1', fontWeight: 'bold', boxShadow: '0 10px 20px rgba(99, 102, 241, 0.4)' }}>Salva Ciclo</button>
      </div>

      <div className="glass-card">
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Quote Jolly / SJ</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <div className="form-group">
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Jolly CT</label>
            <input type="number" className="input-main" value={(config.quotas && config.quotas.jollyCt) || 0} onChange={e => updateQuota('jollyCt', e.target.value)} />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SJ CT</label>
            <input type="number" className="input-main" value={(config.quotas && config.quotas.sjCt) || 0} onChange={e => updateQuota('sjCt', e.target.value)} />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Jolly OP</label>
            <input type="number" className="input-main" value={(config.quotas && config.quotas.jollyOp) || 0} onChange={e => updateQuota('jollyOp', e.target.value)} />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SJ OP</label>
            <input type="number" className="input-main" value={(config.quotas && config.quotas.sjOp) || 0} onChange={e => updateQuota('sjOp', e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );

  const renderConstraints = () => (
    <div className="fade-in">
      <div className="glass-card" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: config.showUnderstaffedAlert ? '1px solid var(--accent-warning)' : '1px solid var(--glass-border)' }}>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Avvisi di Copertura</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Mostra il triangolino ⚠️ se manca personale</div>
        </div>
        <button 
          onClick={() => saveConfig('showUnderstaffedAlert', !config.showUnderstaffedAlert)}
          className={`toggle-btn ${config.showUnderstaffedAlert ? 'active' : ''}`}
          style={{ background: config.showUnderstaffedAlert ? 'var(--accent-warning)' : 'rgba(255,255,255,0.1)', color: 'white', minWidth: '80px' }}
        >
          {config.showUnderstaffedAlert ? 'ATTIVI' : 'OFF'}
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1rem', margin: 0 }}>Vincoli Personale per Turno</h3>
        <button 
          onClick={() => {
            const name = window.prompt("Nome del nuovo ruolo (es. Supervisore, Tecnico...):");
            if (name && name.trim()) {
              const newRoles = [...(config.roles || [])];
              const id = name.trim().toUpperCase().substring(0, 3);
              if (newRoles.find(r => r.id === id)) {
                alert("Esiste già un ruolo con ID simile.");
                return;
              }
              newRoles.push({ id, label: name.trim(), color: '#6366f1' });
              saveConfig('roles', newRoles);
            }
          }}
          className="btn-primary" 
          style={{ padding: '6px 12px', fontSize: '0.7rem' }}
        >+ Nuovo Ruolo</button>
      </div>

      <div style={{ display: 'flex', overflowX: 'auto', gap: '1rem', paddingBottom: '1rem' }} className="no-scrollbar">
        {(['A', 'B', 'C']).map(shiftId => (
          <div key={shiftId} className="glass-card" style={{ minWidth: '260px', flex: '0 0 260px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', color: safeShiftColors[shiftId] || 'var(--primary)' }}>
              Turno {safeShiftLabels[shiftId] || shiftId}
            </div>
            {(config.roles || []).map(role => (
              <div key={role.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span 
                    style={{ fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer' }}
                    title="Clicca per rinominare"
                    onClick={() => {
                      const newName = window.prompt(`Rinomina "${role.label}":`, role.label);
                      if (newName && newName.trim()) {
                        const newRoles = config.roles.map(r => r.id === role.id ? { ...r, label: newName.trim() } : r);
                        saveConfig('roles', newRoles);
                      }
                    }}
                  >{role.label}</span>
                  { !['CT', 'OP'].includes(role.id) && (
                    <button 
                      onClick={() => {
                        if (window.confirm(`Eliminare il ruolo "${role.label}"?`)) {
                          const newRoles = config.roles.filter(r => r.id !== role.id);
                          saveConfig('roles', newRoles);
                        }
                      }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--accent-danger)', fontSize: '0.6rem', cursor: 'pointer', padding: 0 }}
                    >🗑️</button>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button 
                    onClick={() => {
                      const constraints = config.constraints || {};
                      const val = Math.max(0, (constraints[shiftId]?.[role.id] || 0) - 1);
                      const newConstraints = { ...config.constraints };
                      if (!newConstraints[shiftId]) newConstraints[shiftId] = {};
                      newConstraints[shiftId][role.id] = val;
                      saveConfig('constraints', newConstraints);
                    }}
                    style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                  >-</button>
                  <span style={{ minWidth: '15px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>{config.constraints[shiftId]?.[role.id] || 0}</span>
                  <button 
                    onClick={() => {
                      const val = (config.constraints[shiftId]?.[role.id] || 0) + 1;
                      const newConstraints = { ...config.constraints };
                      if (!newConstraints[shiftId]) newConstraints[shiftId] = {};
                      newConstraints[shiftId][role.id] = val;
                      saveConfig('constraints', newConstraints);
                    }}
                    style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                  >+</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  const renderIntegration = () => (
    <div className="fade-in">
      <div className="glass-card" style={{ border: '1px solid var(--primary)' }}>
        <h3 style={{ color: 'var(--primary)', fontSize: '1rem', marginBottom: '1rem' }}>🌐 Integrazione Aziendale (On-Premise)</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Configura l'indirizzo del server interno della tua azienda per abilitare la sincronizzazione dei dati in una rete privata.
        </p>
        
        <div className="form-group">
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>URL del Server Aziendale</label>
          <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
            <input 
              className="input-main" 
              placeholder="https://server.azienda.it/api" 
              value={config.serverUrl || ""} 
              onChange={e => saveConfig('serverUrl', e.target.value)} 
            />
          </div>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Nota: I dati rimarranno comunque salvati localmente finché non verrà abilitata la sincronizzazione attiva.
          </p>
        </div>

        <div style={{ marginTop: '1.5rem', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '5px' }}>Stato Collegamento:</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', color: config.serverUrl ? 'var(--accent-warning)' : 'var(--text-muted)' }}>
             <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: config.serverUrl ? 'var(--accent-warning)' : '#ccc' }}></span>
             {config.serverUrl ? "Configurato (Sincronizzazione Manuale)" : "Non Configurato"}
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>📦 Backup & Ripristino</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Usa questi tasti per spostare i dati tra PC e Telefono.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button 
            className="btn-primary" 
            style={{ width: '100%', fontSize: '0.8rem' }}
            onClick={handleExport}
          >
            📤 Esporta
          </button>
          <label className="btn-primary" style={{ width: '100%', fontSize: '0.8rem', textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}>
            📥 Importa
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
          </label>
        </div>
      </div>

      <div className="glass-card" style={{ marginTop: '1.5rem', border: '1px solid var(--accent-danger)' }}>
        <h3 style={{ color: 'var(--accent-danger)', fontSize: '1rem', marginBottom: '1rem' }}>Reset Totale</h3>
        <button 
          className="btn-primary" 
          style={{ background: 'var(--accent-danger)', width: '100%' }}
          onClick={() => {
            if(window.confirm("CANCELLARE TUTTO?")) {
              localStorage.clear();
              window.location.reload();
            }
          }}
        >
          🗑️ Ripristino Fabbrica
        </button>
      </div>
    </div>
  );

  return (
    <div className="settings-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="glass-card" style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', padding: '8px', borderBottom: '1px solid var(--glass-border)', backdropFilter: 'blur(20px)', overflowX: 'auto' }} className="no-scrollbar">
        <button 
          className={`toggle-btn ${activeSection === 'design' ? 'active' : ''}`} 
          style={{ flex: '1 0 auto', color: activeSection === 'design' ? 'white' : 'var(--text-muted)' }} 
          onClick={() => setActiveSection('design')}
        >🎨 Estetica</button>
        <button 
          className={`toggle-btn ${activeSection === 'rules' ? 'active' : ''}`} 
          style={{ flex: '1 0 auto', color: activeSection === 'rules' ? 'white' : 'var(--text-muted)' }} 
          onClick={() => setActiveSection('rules')}
        >📊 Regole</button>
        <button 
          className={`toggle-btn ${activeSection === 'constraints' ? 'active' : ''}`} 
          style={{ flex: '1 0 auto', color: activeSection === 'constraints' ? 'white' : 'var(--text-muted)' }} 
          onClick={() => setActiveSection('constraints')}
        >⚠️ Sicurezza</button>
        <button 
          className={`toggle-btn ${activeSection === 'integration' ? 'active' : ''}`} 
          style={{ flex: '1 0 auto', color: activeSection === 'integration' ? 'white' : 'var(--text-muted)' }} 
          onClick={() => setActiveSection('integration')}
        >🌐 Integrazione</button>
      </div>

      <div className="section-content">
        {activeSection === 'design' && renderDesign()}
        {activeSection === 'rules' && renderRules()}
        {activeSection === 'constraints' && renderConstraints()}
        {activeSection === 'integration' && renderIntegration()}
      </div>
    </div>
  );
}
