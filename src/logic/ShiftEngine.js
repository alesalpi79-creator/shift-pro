/**
 * MOTORE DI CALCOLO SHIFT-PRO (Versione 6.1 - Precisione Chirurgica)
 */

export function getMonthlyRole(employee, date, employees, config) {
  if (!employee || !date || !employees) return 'OP';
  const d = new Date(date);
  const monthsSinceEpoch = (d.getFullYear() - 2026) * 12 + d.getMonth();
  const rotationIndex = Math.floor(monthsSinceEpoch / 2); 

  const myRole = (employee.role || 'OP').toUpperCase().trim();
  const myTeam = parseInt(employee.team) || 1;

  const group = employees
    .filter(e => e && (e.role || 'OP').toUpperCase().trim() === myRole)
    .filter(e => myRole === 'CT' || (parseInt(e.team) || 1) === myTeam)
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  const N = group.length;
  const myIdx = group.findIndex(e => e.name === employee.name);
  
  // Se ci sono 4 o meno persone nel gruppo, non facciamo rotazione Jolly/SJ
  // (il sistema è pensato per 6 persone: 4 fisse + 2 in rotazione)
  if (N <= 4) return myRole;
  
  const currentSJIdx = rotationIndex % N;
  const currentJollyIdx = (rotationIndex - 1 + N * 10) % N;

  if (myIdx === currentSJIdx) return 'SJ';
  if (myIdx === currentJollyIdx) return 'J';
  return myRole;
}

export function getNominalShift(employee, date, employees, config) {
  const d = new Date(date);
  const currentRole = getMonthlyRole(employee, d, employees, config);
  
  // Jolly e SJ stanno a riposo di default (coprono solo buchi)
  if (currentRole === 'J' || currentRole === 'SJ') return 'R';

  const refStr = config.baseDate || '2026-01-01';
  const [ry, rm, rd] = refStr.split('-').map(Number);
  const ref = new Date(ry, rm - 1, rd);

  // Usiamo mezzogiorno per evitare problemi con l'ora legale (DST)
  const dCopy = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
  const refCopy = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 12, 0, 0);
  const diff = Math.round((dCopy.getTime() - refCopy.getTime()) / (1000 * 60 * 60 * 24));
  
  // Usiamo il ciclo configurato nelle impostazioni, oppure quello di default
  const cycle = config.cycle || ['A', 'A', 'C', 'C', 'R', 'B', 'B', 'R', 'R'];
  const cycleLength = cycle.length;

  let autoOffset = 0;
  const role = (employee.role || '').toUpperCase();

  if (role === 'CT') {
    // BILANCIAMENTO CT: Prendiamo solo i 4 che non sono Jolly/SJ questo mese
    const fixedCTs = employees
      .filter(e => (e.role || '').toUpperCase() === 'CT')
      .filter(e => {
         const r = getMonthlyRole(e, d, employees, config);
         return r !== 'J' && r !== 'SJ';
      })
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    const myIdx = fixedCTs.findIndex(e => e.name === employee.name);
    if (myIdx !== -1) {
      // Pattern magico per 4 persone su ciclo 9gg: 0, 2, 5, 7
      // Questo garantisce 1-1-1 perfetto senza sovrapposizioni
      const pattern = [0, 2, 5, 7];
      autoOffset = pattern[myIdx % pattern.length];
    }
  } else {
    // BILANCIAMENTO OPERATORI (Squadre)
    const myTeam = parseInt(employee.team) || 1;
    const fixedOPs = employees
      .filter(e => (e.role || '').toUpperCase() === 'OP' && (parseInt(e.team) || 1) === myTeam)
      .filter(e => {
         const r = getMonthlyRole(e, d, employees, config);
         return r !== 'J' && r !== 'SJ';
      })
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    const myIdx = fixedOPs.findIndex(e => e.name === employee.name);
    if (myIdx !== -1) {
      // Usiamo lo stesso pattern 0, 2, 5, 7 per i 4 fissi di ogni squadra
      const pattern = [0, 2, 5, 7];
      autoOffset = pattern[myIdx % pattern.length];
    }
  }

  const dayInCycle = (diff + autoOffset + (cycleLength * 1000)) % cycleLength;
  return cycle[dayInCycle] || 'R';
}

export function calculateDailyShifts(date, employees, exceptions, config) {
  if (!employees || employees.length === 0) return [];
  const d = new Date(date);
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  let daily = employees.map(e => {
    const currentRole = getMonthlyRole(e, d, employees, config);
    const nominal = getNominalShift(e, d, employees, config);
    const exc = (exceptions || []).find(ex => ex.employee === e.name && ex.date === dateStr);
    
    return {
      name: e.name,
      baseRole: (e.role || 'OP').toUpperCase().trim(),
      monthlyRole: currentRole,
      nominalShift: nominal,
      finalShift: exc ? exc.type : nominal,
      isException: !!exc,
      isJolly: currentRole === 'J',
      isSJ: currentRole === 'SJ',
      team: parseInt(e.team) || 1
    };
  });

  const groups = [
    { role: 'CT', team: null }, 
    { role: 'OP', team: 1 },
    { role: 'OP', team: 2 },
    { role: 'OP', team: 3 }
  ];

  groups.forEach(g => {
    const members = daily.filter(s => 
      s.baseRole === g.role && (g.role === 'CT' || s.team === g.team)
    );

    ['A', 'B', 'C'].forEach(st => {
      const working = members.filter(m => m.finalShift === st);
      if (working.length === 0) {
        let sj = members.find(m => m.isSJ && m.finalShift === 'R' && !m.isException);
        if (sj) sj.finalShift = st;
        else {
          let jolly = members.find(m => m.isJolly && m.finalShift === 'R' && !m.isException);
          if (jolly) jolly.finalShift = st;
        }
      } else if (working.length > 1) {
        working.forEach(m => {
          if ((m.isSJ || m.isJolly) && !m.isException) {
            if (members.filter(x => x.finalShift === st).length > 1) m.finalShift = 'R';
          }
        });
      }
    });
  });

  return daily;
}
