/**
 * ShiftEngine.js (Professional Generic Version)
 * handles customizable cycles, roles, J/SJ rotation and constraints.
 */

/**
 * Calculates if an employee is a Jolly or Semi-Jolly for the given month.
 * Logic: Rotating window of 2 months per person.
 */
export function getMonthlyRole(employee, date, employees, config) {
  const { quotas, roles } = config;
  if (!quotas || !quotas.jollyCt) return employee.role;

  const monthGlobal = date.getFullYear() * 12 + date.getMonth();
  const rotationIndex = monthGlobal; // Changes every month

  // Separate by base role
  const sameRoleStaff = employees
    .filter(e => e.role === employee.role)
    .sort((a, b) => (a.id || a.name).localeCompare(b.id || b.name));
  
  const idx = sameRoleStaff.findIndex(e => (e.id || e.name) === (employee.id || employee.name));
  if (idx === -1) return employee.role;

  const qJ = employee.role === 'CT' ? quotas.jollyCt : quotas.jollyOp;
  const qSJ = employee.role === 'CT' ? quotas.sjCt : quotas.sjOp;

  // Calculate windows
  // Jolly window: [rotationIndex * qJ, (rotationIndex + 1) * qJ]
  // SJ window follows Jolly window to avoid overlap
  const totalStaff = sameRoleStaff.length;
  
  const isJolly = (idx >= (rotationIndex * qJ) % totalStaff) && (idx < ((rotationIndex + 1) * qJ) % totalStaff);
  // Simple offset for SJ
  const sjStart = (rotationIndex * qJ + qJ) % totalStaff;
  const isSJ = (idx >= sjStart % totalStaff) && (idx < (sjStart + qSJ) % totalStaff);

  if (isJolly) return 'J';
  if (isSJ) return 'SJ';
  return employee.role;
}

/**
 * Calculates the nominal shift for a given employee on a specific date.
 */
export function getNominalShift(employee, date, config, currentRole) {
  const { cycle, baseDate } = config;
  
  // Rule: Jolly (J) stays empty (Rest) as per user request
  if (currentRole === 'J') return 'R';
  
  // Rule: Semi-Jolly (SJ) - User said "half turns"
  // We'll implement this by taking the normal shift but skipping every other working day?
  // Or just following the cycle but prioritizing them for rest if coverage is met.
  // For now, let's keep the cycle but flag them.
  
  if (!cycle || cycle.length === 0) return 'R';
  
  const bDate = new Date(baseDate);
  const diffTime = date.getTime() - bDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  const cycleIndex = (diffDays + (employee.offset || 0)) % cycle.length;
  const normalizedIndex = cycleIndex >= 0 ? cycleIndex : (cycleIndex + cycle.length) % cycle.length;
  
  const shift = cycle[normalizedIndex];

  // Semi-Jolly Logic: "Metà turni" - If shift is NOT rest, skip 50% of them?
  // User: "semijolly ha solo metà turni per riuscire a coprire il ciclo"
  if (currentRole === 'SJ' && shift !== 'R') {
    // Basic pattern: Work 1, Rest 1 of the nominal cycle working days
    // This is a simplified "half turns"
    if (diffDays % 2 === 0) return 'R';
  }

  return shift;
}

/**
 * Main calculation engine for daily distribution.
 */
export function calculateDailyShifts(employees, date, exceptions = [], config) {
  const dateStr = date.toISOString().split('T')[0];
  const { constraints = {} } = config;

  // 1. Assign roles and nominal shifts
  let daily = employees.map(e => {
    const currentRole = getMonthlyRole(e, date, employees, config);
    const nominal = getNominalShift(e, date, config, currentRole);
    const exc = exceptions.find(ex => ex.employee === e.name && ex.date === dateStr);
    
    return {
      name: e.name,
      baseRole: e.role || 'OP',
      monthlyRole: currentRole,
      nominalShift: nominal,
      finalShift: exc ? exc.type : nominal,
      isException: !!exc,
      assignedRole: e.role || 'OP',
      isJolly: currentRole === 'J',
      isSJ: currentRole === 'SJ'
    };
  });

  // 2. Dynamic Balancing - First Pass: Trim Surpluses
  const shiftTypes = Object.keys(constraints);
  shiftTypes.forEach(st => {
    const shiftConstraints = constraints[st];
    const peopleOnShift = daily.filter(p => p.finalShift === st);
    
    Object.keys(shiftConstraints).forEach(roleId => {
      const required = shiftConstraints[roleId];
      const currentOnRole = peopleOnShift.filter(p => p.assignedRole === roleId);
      
      if (currentOnRole.length > required) {
        const surplus = currentOnRole.length - required;
        // Prioritize sending Semi-Jolly, then Jolly, to Rest
        const pool = currentOnRole.sort((a, b) => {
          if (a.isSJ && !b.isSJ) return -1;
          if (a.isJolly && !b.isJolly) return -1;
          return 0;
        });
        
        for (let i = 0; i < surplus; i++) {
          pool[i].finalShift = 'R';
        }
      }
    });
  });

  // 3. Dynamic Balancing - Second Pass: Fill Deficits
  shiftTypes.forEach(st => {
    const shiftConstraints = constraints[st];
    // Re-calculate people on shift after surplus was moved to R
    const peopleOnShift = daily.filter(p => p.finalShift === st);
    
    Object.keys(shiftConstraints).forEach(roleId => {
      const required = shiftConstraints[roleId];
      const currentOnRole = peopleOnShift.filter(p => p.assignedRole === roleId).length;
      
      if (currentOnRole < required) {
        const diff = required - currentOnRole;
        // Priority for covering gaps: SJ on rest, then Jolly on rest, then others who were meant to work
        const pool = daily
          .filter(p => p.finalShift === 'R' && (p.isJolly || p.isSJ || p.nominalShift !== 'R'))
          .sort((a, b) => {
            if (a.isSJ && !b.isSJ) return -1;
            if (a.isJolly && !b.isJolly) return -1;
            return 0;
          });
        
        for (let i = 0; i < diff; i++) {
          // Find employee with the exact requested role
          const candidate = pool.find(p => p.baseRole === roleId);
          if (candidate) {
            candidate.finalShift = st;
            candidate.assignedRole = roleId;
            candidate.isCovering = true;
            pool.splice(pool.indexOf(candidate), 1);
          }
        }
      }
    });
  });

  return daily;
}
