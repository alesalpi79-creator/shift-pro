import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Onboarding({ onComplete }) {
  const { config, setConfig, setEmployees } = useApp();
  const [step, setStep] = useState(1);
  const [appName, setAppName] = useState(config.appName);

  const nextStep = () => setStep(step + 1);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-main)', display: 'grid', placeItems: 'center', zIndex: 1000 }}>
      <div className="glass-card" style={{ maxWidth: '450px', width: '90%', textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚀</div>
        
        {step === 1 && (
          <div className="fade-in">
            <h1 style={{ fontSize: '1.75rem', fontWeight: '900', marginBottom: '0.5rem', letterSpacing: '-0.04em' }}>Benvenuto in {appName} AI</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.95rem' }}>Il motore avanzato per l'ottimizzazione dei turni industriali complessi.</p>
            <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
              <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '1px', color: 'var(--text-muted)' }}>Identità Aziendale</label>
              <input 
                className="input-main" 
                value={appName} 
                onChange={e => setAppName(e.target.value)}
                style={{ marginTop: '0.75rem', fontSize: '1.1rem', padding: '15px' }}
              />
            </div>
            <button className="btn-primary" style={{ width: '100%', padding: '18px' }} onClick={() => { setConfig({...config, appName}); nextStep(); }}>Configura Archivio</button>
          </div>
        )}

        {step === 2 && (
          <div className="fade-in">
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>Identità Visiva</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Personalizza l'interfaccia con il colore del tuo brand.</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', marginBottom: '2.5rem' }}>
              {['#6366f1', '#10b981', '#ec4899', '#f59e0b', '#06b6d4'].map(color => (
                <div 
                  key={color} 
                  onClick={() => setConfig({...config, primaryColor: color})}
                  style={{ 
                    width: '45px', height: '45px', borderRadius: '14px', backgroundColor: color, 
                    cursor: 'pointer', border: config.primaryColor === color ? '3px solid white' : '2px solid rgba(255,255,255,0.1)',
                    transform: config.primaryColor === color ? 'scale(1.15)' : 'none',
                    transition: 'var(--transition)',
                    boxShadow: config.primaryColor === color ? `0 0 20px ${color}88` : 'none'
                  }} 
                />
              ))}
            </div>
            <button className="btn-primary" style={{ width: '100%', padding: '18px' }} onClick={nextStep}>Prossimo</button>
          </div>
        )}

        {step === 3 && (
          <div className="fade-in">
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>Sistema Pronto</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Algoritmo di rotazione e bilanciamento carichi configurato.</p>
            <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '2.5rem' }}>
              <ul style={{ fontSize: '0.85rem', color: 'var(--text-main)', listStyle: 'none' }}>
                <li style={{ marginBottom: '10px' }}>✅ Engine Industriale Attivato</li>
                <li style={{ marginBottom: '10px' }}>✅ Supporto Drag & Drop Abilitato</li>
                <li style={{ marginBottom: '0' }}>✅ Dashboard Analitica Pronta</li>
              </ul>
            </div>
            <button className="btn-primary" style={{ width: '100%', padding: '18px' }} onClick={onComplete}>Accedi alla Dashboard</button>
          </div>
        )}
      </div>
    </div>
  );
}
