import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { useApp } from '../context/AppContext';
import { calculateDailyShifts } from '../logic/ShiftEngine';

export default function ExportModule({ onClose, currentViewDate }) {
  const { employees, exceptions, config, isPro, setIsPro } = useApp();
  const [format, setFormat] = useState('pdf');
  const [period, setPeriod] = useState('current'); // 'current', 'specific', 'year'
  const [specificMonth, setSpecificMonth] = useState(currentViewDate.getMonth());

  const months = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
  const viewYear = currentViewDate.getFullYear();

  const handleYearClick = () => {
    if (!isPro) {
        // Option to trigger a "Go Pro" dialog or just alert for now
        // But better to show it's disabled or requires premium
        return;
    }
    setPeriod('year');
  };

  const getMonthData = (year, monthIdx) => {
    const lastDay = new Date(year, monthIdx + 1, 0).getDate();
    const headers = ['Dipendente'];
    for(let d=1; d<=lastDay; d++) {
        headers.push(`${d}`);
    }

    const activeEmployeesMap = new Set();
    const monthlyShifts = [];
    for(let d=1; d<=lastDay; d++) {
        const date = new Date(year, monthIdx, d);
        const dailyShifts = calculateDailyShifts(date, employees, exceptions, config);
        monthlyShifts.push(dailyShifts);
        dailyShifts.forEach(s => {
             if (config.shiftColors[s.finalShift]) {
                 activeEmployeesMap.add(s.name);
             }
        });
    }

    const visibleEmployees = employees.filter(emp => activeEmployeesMap.has(emp.name));

    const body = visibleEmployees.map(emp => {
      const row = [emp.name];
      for(let d=1; d<=lastDay; d++) {
        const dailyShifts = monthlyShifts[d-1];
        const myShift = dailyShifts.find(s => s.name === emp.name);
        const val = myShift ? (myShift.finalShift === 'R' ? '' : (config.shiftLabels?.[myShift.finalShift] || myShift.finalShift)) : '';
        row.push(val);
      }
      return row;
    });

    return { headers, body, monthName: months[monthIdx] };
  };

  const handleExport = async () => {
    // Safety check for Premium features
    if (period === 'year' && !isPro) {
        alert("L'esportazione annuale richiede il pacchetto Premium.");
        setPeriod('current');
        return;
    }

    // Generate data
    const dataToExport = [];
    if (period === 'year') {
        for(let i=0; i<12; i++) {
            dataToExport.push(getMonthData(viewYear, i));
        }
    } else {
        const targetMonth = period === 'current' ? currentViewDate.getMonth() : parseInt(specificMonth);
        dataToExport.push(getMonthData(viewYear, targetMonth));
    }

    const titlePrefix = config.appName ? `${config.appName}_` : 'Turni_';
    let outputBase64 = '';
    let fileName = '';

    try {
        if (format === 'excel') {
            const wb = XLSX.utils.book_new();
            dataToExport.forEach(monthData => {
                const ws = XLSX.utils.aoa_to_sheet([monthData.headers, ...monthData.body]);
                XLSX.utils.book_append_sheet(wb, ws, monthData.monthName);
            });
            fileName = period === 'year' ? `Pianificazione_Annuale_${viewYear}.xlsx` : `Pianificazione_${dataToExport[0].monthName}_${viewYear}.xlsx`;
            fileName = titlePrefix + fileName;
            
            // Get raw Base64 from SheetJS
            outputBase64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
            
        } else {
            const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
            
            dataToExport.forEach((monthData, index) => {
                if (index > 0) doc.addPage();
                
                let startY = 22;
                if (config.appLogo) {
                    try {
                        doc.addImage(config.appLogo, 'PNG', 14, 10, 15, 15);
                        doc.setFontSize(16);
                        doc.text(`${config.appName || 'Turni Pro'} - Pianificazione - ${monthData.monthName} ${viewYear}`, 32, 20);
                        startY = 30;
                    } catch(e) {
                        doc.setFontSize(16);
                        doc.text(`${config.appName || 'Turni Pro'} - Pianificazione - ${monthData.monthName} ${viewYear}`, 14, 15);
                    }
                } else {
                    doc.setFontSize(16);
                    doc.text(`${config.appName || 'Turni Pro'} - Pianificazione - ${monthData.monthName} ${viewYear}`, 14, 15);
                }
                
                autoTable(doc, {
                   startY: 22,
                   head: [monthData.headers],
                   body: monthData.body,
                   theme: 'grid',
                   styles: { 
                     fontSize: 7, 
                     halign: 'center',
                     cellPadding: 1,
                     lineColor: [200, 200, 200]
                   },
                   headStyles: { 
                       fillColor: [30, 41, 59], // Blu notte professionale
                       textColor: 255, 
                       fontStyle: 'bold',
                       halign: 'center'
                   },
                   columnStyles: { 0: { halign: 'left', fontStyle: 'bold', minCellWidth: 35 } },
                   didParseCell: function(data) {
                       if (data.section === 'body') {
                           if (data.column.index === 0) {
                               const empName = data.cell.raw;
                               const emp = employees.find(e => e.name === empName);
                               if (emp) {
                                   const roleColor = config.roles?.find(r => r.id === emp.role)?.color || (emp.role === 'CT' ? '#ef4444' : (emp.role === 'OP' ? '#64748b' : '#000000'));
                                   if (roleColor && roleColor.startsWith('#')) {
                                       try {
                                           const hex = roleColor.replace('#', '');
                                           const r = parseInt(hex.substring(0,2), 16) || 0;
                                           const g = parseInt(hex.substring(2,4), 16) || 0;
                                           const b = parseInt(hex.substring(4,6), 16) || 0;
                                           data.cell.styles.textColor = [r, g, b];
                                       } catch(err) {
                                           data.cell.styles.textColor = [0, 0, 0];
                                       }
                                   }
                                   data.cell.styles.fontStyle = 'bold';
                               }
                           } else if (data.column.index > 0) {
                               const val = data.cell.raw;
                               if (!val) return;

                               const shiftKey = Object.keys(config.shiftLabels || {}).find(k => config.shiftLabels[k] === val) || val;
                               const hexColor = config.shiftColors?.[shiftKey];
                               
                               if (hexColor && hexColor.startsWith('#')) {
                                   try {
                                       const hex = hexColor.replace('#', '');
                                       const r = parseInt(hex.substring(0,2), 16);
                                       const g = parseInt(hex.substring(2,4), 16);
                                       const b = parseInt(hex.substring(4,6), 16);
                                       
                                       // Versione Pastello: Sfondo leggerissimo (10% del colore originale)
                                       data.cell.styles.fillColor = [
                                           255 - (255 - r) * 0.15,
                                           255 - (255 - g) * 0.15,
                                           255 - (255 - b) * 0.15
                                       ];
                                       data.cell.styles.textColor = [r, g, b]; // Testo con colore originale
                                       data.cell.styles.fontStyle = 'bold';
                                   } catch(e) {}
                               } else if (shiftKey === 'R') { 
                                   data.cell.styles.textColor = 200; 
                               }
                           }
                       }
                   }
                });
            });

            fileName = period === 'year' ? `Pianificazione_Annuale_${viewYear}.pdf` : `Pianificazione_${dataToExport[0].monthName}_${viewYear}.pdf`;
            fileName = titlePrefix + fileName;
            
            // Get Base64 from jsPDF string
            const pdfDataUri = doc.output('datauristring');
            outputBase64 = pdfDataUri.split(',')[1];
        }

        // Setup download fallback helper
        const triggerWebDownload = (base64, filename, mimeType) => {
            const link = document.createElement('a');
            link.href = `data:${mimeType};base64,${base64}`;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        try {
            // Attempt native Capacitor save
            if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
                const result = await Filesystem.writeFile({
                    path: fileName,
                    data: outputBase64,
                    directory: Directory.Cache
                });
                await Share.share({
                    title: fileName,
                    text: 'Ecco i turni esportati.',
                    url: result.uri,
                    dialogTitle: 'Salva o Condividi i Turni'
                });
            } else {
                throw new Error("Not a native platform");
            }
        } catch (capacitorError) {
            // Web browser download fallback
            const mimeType = format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf';
            triggerWebDownload(outputBase64, fileName, mimeType);
        }

        onClose();
        
    } catch (e) {
        console.error('Export Failed:', e);
        alert('Errore di esportazione: ' + e.message);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-card fade-in" style={{ width: '90%', maxWidth: '400px', padding: '2rem', background: 'var(--bg-main)' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.3rem' }}>Stampa ed Esporta</h2>
        
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Formato Output</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
               className={`btn-primary ${format === 'pdf' ? '' : 'inactive'}`} 
               style={{ flex: 1, opacity: format === 'pdf' ? 1 : 0.5 }}
               onClick={() => setFormat('pdf')}
            >📄 PDF</button>
            <button 
               className={`btn-primary ${format === 'excel' ? '' : 'inactive'}`} 
               style={{ flex: 1, opacity: format === 'excel' ? 1 : 0.5, background: '#10b981' }}
               onClick={() => setFormat('excel')}
            >📊 Excel</button>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Intervallo Temporale ({viewYear})</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
             <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="radio" checked={period === 'current'} onChange={() => setPeriod('current')} />
                Mese Visualizzato ({months[currentViewDate.getMonth()]})
             </label>
             
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="radio" checked={period === 'specific'} onChange={() => setPeriod('specific')} />
                    Mese Specifico:
                </label>
                <select 
                   className="input-main" 
                   style={{ padding: '0.4rem', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)', color: 'white', borderRadius: '4px', flex: 1 }}
                   value={specificMonth} 
                   onChange={e => { setPeriod('specific'); setSpecificMonth(e.target.value); }}
                >
                    {months.map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
                </select>
             </div>

             <div 
                style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginTop: '0.5rem',
                    padding: '8px',
                    borderRadius: '8px',
                    background: !isPro ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                    border: !isPro ? '1px dashed var(--primary)' : 'none',
                    opacity: !isPro && period === 'year' ? 1 : (period === 'year' ? 1 : 0.8),
                    cursor: 'pointer'
                }}
                onClick={handleYearClick}
             >
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1 }}>
                    <input 
                        type="radio" 
                        checked={period === 'year'} 
                        onChange={handleYearClick}
                        disabled={!isPro}
                    />
                    <span style={{ fontWeight: period === 'year' ? 'bold' : 'normal' }}>
                        Tutto l'anno (12 Mesi)
                    </span>
                </label>
                {!isPro && (
                    <span style={{ 
                        fontSize: '0.7rem', 
                        background: 'var(--primary)', 
                        color: 'white', 
                        padding: '2px 6px', 
                        borderRadius: '4px',
                        fontWeight: 'bold'
                    }}>
                        PREMIUM 👑
                    </span>
                )}
             </div>

             {!isPro && period !== 'year' && (
                 <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                    Sblocca l'esportazione annuale con il pacchetto Premium.
                 </p>
             )}
          </div>
        </div>

        {!isPro && period === 'year' && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.85rem', color: '#f59e0b', margin: 0 }}>
                    L'esportazione annuale è una funzione Premium. Abbonati per scaricare la pianificazione completa.
                </p>
                <button 
                    onClick={() => {
                        // For demo purposes, we can set isPro to true, 
                        // but in production this would go to the payment flow
                        if(confirm("Vuoi attivare la prova gratuita del pacchetto Premium?")) {
                            setIsPro(true);
                        }
                    }}
                    style={{ 
                        marginTop: '0.5rem', 
                        background: '#f59e0b', 
                        color: 'white', 
                        border: 'none', 
                        padding: '4px 10px', 
                        borderRadius: '4px', 
                        fontSize: '0.8rem', 
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    Scopri Premium
                </button>
            </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>Annulla</button>
          <button onClick={handleExport} className="btn-primary" style={{ flex: 1, background: 'var(--primary)' }}>Genera File</button>
        </div>
      </div>
    </div>
  );
}
