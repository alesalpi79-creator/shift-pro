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
            <h2 style={{ marginBottom: '1rem' }}>Benvenuto in {appName}!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Configuriamo la tua istanza professionale in pochi secondi.</p>
            <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nome della tua Azienda/App</label>
              <input 
                className="input-main" 
                value={appName} 
                onChange={e => setAppName(e.target.value)}
                style={{ marginTop: '0.5rem' }}
              />
            </div>
            <button className="btn-primary" style={{ width: '100%' }} onClick={() => { setConfig({...config, appName}); nextStep(); }}>Iniziamo</button>
          </div>
        )}

        {step === 2 && (
          <div className="fade-in">
            <h2 style={{ marginBottom: '1rem' }}>Scegli il tuo Stile</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>L'app si adatterà alla tua visual identity.</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
              {['#6366f1', '#10b981', '#ec4899', '#f59e0b', '#06b6d4'].map(color => (
                <div 
                  key={color} 
                  onClick={() => setConfig({...config, primaryColor: color})}
                  style={{ 
                    width: '40px', height: '40px', borderRadius: '50%', backgroundColor: color, 
                    cursor: 'pointer', border: config.primaryColor === color ? '3px solid white' : 'none',
                    transform: config.primaryColor === color ? 'scale(1.2)' : 'none',
                    transition: 'var(--transition)'
                  }} 
                />
              ))}
            </div>
            <button className="btn-primary" style={{ width: '100%' }} onClick={nextStep}>Prossimo</button>
          </div>
        )}

        {step === 3 && (
          <div className="fade-in">
            <h2 style={{ marginBottom: '1rem' }}>Quasi Pronto!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Puoi caricare il tuo personale o impostare i cicli turni dall'area Amministratore.</p>
            <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
              <ul style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '1.2rem' }}>
                <li>Gestione ruoli (Admin/Viewer) attivata</li>
                <li>Motore di bilanciamento configurato</li>
                <li>Tema premium applicato</li>
              </ul>
            </div>
            <button className="btn-primary" style={{ width: '100%' }} onClick={onComplete}>Entra nell'App</button>
          </div>
        )}
      </div>
    </div>
  );
}
