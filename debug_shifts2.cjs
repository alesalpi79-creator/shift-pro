const fs = require('fs');
const config = {
  cycle: ['A', 'A', 'C', 'C', 'B', 'B', 'R', 'R'],
  cycleSJ: ['A', 'R', 'C', 'R', 'R', 'B', 'R', 'R', 'R'],
  baseDate: '2026-08-01',
  quotas: { jollyCt: 1, sjCt: 0, jollyOp: 3, sjOp: 3 }
};
let employees = [];
for (let i = 1; i <= 6; i++) employees.push({ id: 'CT'+i, name: 'CT'+i, role: 'CT' });
for (let i = 1; i <= 18; i++) employees.push({ id: 'OP'+i, name: 'OP'+i, role: 'OP' });

const rolesToBalance = [...new Set(employees.map(e => e.role))];
rolesToBalance.forEach(role => {
  const empsInRole = employees.filter(e => e.role === role);
  const step = Math.max(1, Math.floor(config.cycle.length / 4));
  let currentOffset = 0;
  empsInRole.forEach(e => {
    const idx = employees.findIndex(x => x.id === e.id);
    employees[idx].offset = currentOffset;
    currentOffset = (currentOffset + step) % config.cycle.length;
  });
});

function getMonthlyRole(employee, date, employees, config) {
  const monthGlobal = date.getFullYear() * 12 + date.getMonth();
  const rotationIndex = Math.floor(monthGlobal / 2);
  const baseStaff = employees.filter(e => e.role === employee.role);
  const byOffset = {};
  baseStaff.forEach(e => {
    const off = e.offset || 0;
    if (!byOffset[off]) byOffset[off] = [];
    byOffset[off].push(e);
  });
  Object.values(byOffset).forEach(arr => arr.sort((a,b) => (a.id).localeCompare(b.id)));
  const sameRoleStaff = [];
  const maxLen = Math.max(0, ...Object.values(byOffset).map(arr => arr.length));
  for (let i = 0; i < maxLen; i++) {
    Object.keys(byOffset).sort((a,b) => Number(a)-Number(b)).forEach(off => {
      if (byOffset[off][i]) sameRoleStaff.push(byOffset[off][i]);
    });
  }
  const idx = sameRoleStaff.findIndex(e => e.id === employee.id);
  const qJ = employee.role === 'CT' ? config.quotas.jollyCt : config.quotas.jollyOp;
  const qSJ = employee.role === 'CT' ? config.quotas.sjCt : config.quotas.sjOp;
  const isIndexInWindow = (index, start, length, total) => {
    const end = start + length;
    if (end <= total) return index >= start && index < end;
    return index >= start || index < (end % total);
  };
  const jStart = (rotationIndex * qJ) % sameRoleStaff.length;
  const isJolly = isIndexInWindow(idx, jStart, qJ, sameRoleStaff.length);
  const sjStart = (jStart + qJ) % sameRoleStaff.length;
  const isSJ = isIndexInWindow(idx, sjStart, qSJ, sameRoleStaff.length);
  if (isJolly) return 'J';
  if (isSJ) return 'SJ';
  return employee.role;
}

function getNominalShift(employee, date, config, currentRole) {
  if (currentRole === 'J') return 'R';
  const activeCycle = currentRole === 'SJ' ? config.cycleSJ : config.cycle;
  const bDate = new Date(config.baseDate);
  const diffTime = date.getTime() - bDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const cycleIndex = (diffDays + (employee.offset || 0)) % activeCycle.length;
  const normalizedIndex = cycleIndex >= 0 ? cycleIndex : (cycleIndex + activeCycle.length) % activeCycle.length;
  return activeCycle[normalizedIndex];
}

const date = new Date(`2026-05-02T12:00:00Z`); // Day 2
employees.forEach(e => {
  const role = getMonthlyRole(e, date, employees, config);
  const shift = getNominalShift(e, date, config, role);
  console.log(`${e.name} (offset ${e.offset}) -> Role: ${role}, Shift: ${shift}`);
});
