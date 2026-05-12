import React, { useState, useEffect } from 'react';

/**
 * Custom Dialog component to replace window.alert, window.confirm, and window.prompt
 */
const Dialog = ({ 
  isOpen, 
  type = 'alert', // 'alert', 'confirm', 'prompt'
  title, 
  message, 
  defaultValue = '', 
  onConfirm, 
  onCancel, 
  confirmText = 'Conferma', 
  cancelText = 'Annulla',
  placeholder = 'Inserisci testo...'
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (type === 'prompt') {
      onConfirm(inputValue);
    } else {
      onConfirm(true);
    }
  };

  return (
    <div className="dialog-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div className="dialog-content glass-card" style={{
        width: '90%',
        maxWidth: '400px',
        padding: '1.5rem',
        borderRadius: '24px',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}>
        {title && <h3 style={{ 
          marginTop: 0, 
          marginBottom: '0.75rem', 
          fontSize: '1.25rem',
          color: 'var(--text-main)'
        }}>{title}</h3>}
        
        <p style={{ 
          marginBottom: '1.5rem', 
          fontSize: '0.95rem', 
          color: 'var(--text-muted)',
          lineHeight: '1.5'
        }}>{message}</p>

        {type === 'prompt' && (
          <input
            autoFocus
            type="text"
            className="input-main"
            style={{ 
              width: '100%', 
              marginBottom: '1.5rem',
              padding: '12px 16px',
              fontSize: '1rem'
            }}
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirm();
              if (e.key === 'Escape') onCancel();
            }}
          />
        )}

        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '12px' 
        }}>
          {(type === 'confirm' || type === 'prompt') && (
            <button 
              onClick={onCancel}
              className="btn-primary"
              style={{ 
                background: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid var(--glass-border)',
                color: 'var(--text-main)',
                padding: '10px 20px'
              }}
            >
              {cancelText}
            </button>
          )}
          <button 
            onClick={handleConfirm}
            className="btn-primary"
            style={{ 
              background: 'var(--primary)', 
              border: 'none',
              padding: '10px 24px',
              fontWeight: 'bold'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}} />
    </div>
  );
};

export default Dialog;
