import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Critical Application Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#0f172a',
          color: 'white',
          textAlign: 'center',
          padding: '2rem',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
          <h1 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '1rem' }}>Qualcosa non ha funzionato</h1>
          <p style={{ color: '#94a3b8', marginBottom: '2rem', maxWidth: '500px' }}>
            L'applicazione ha riscontrato un errore imprevisto. Non preoccuparti, i tuoi dati sono al sicuro.
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '1rem 2rem',
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 10px 20px rgba(99, 102, 241, 0.3)'
              }}
            >
              Riavvia Applicazione 🚀
            </button>
            <button 
              onClick={() => {
                if (window.confirm("Attenzione: questo cancellerà TUTTI i tuoi dati salvati. Sei sicuro?")) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              style={{
                padding: '1rem 2rem',
                background: 'transparent',
                color: '#f87171',
                border: '1px solid #f87171',
                borderRadius: '12px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Reset Totale (Emergenza) 🗑️
            </button>
          </div>
          <details style={{ marginTop: '2rem', color: '#475569', fontSize: '0.8rem', textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer' }}>Dettagli Tecnici</summary>
            <pre style={{ marginTop: '1rem', whiteSpace: 'pre-wrap' }}>
              {this.state.error?.toString()}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
