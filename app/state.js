// PosBareng — state dan semua angka turunan.
//
// Satu state, semua angka dihitung dari situ. Tidak ada angka turunan yang
// disimpan: tambah satu transaksi, dan saldo pos, batas aman harian, grafik
// anggota dan strip tagihan semuanya ikut berubah dari fungsi yang sama.

import { BILLS, CATEGORIES, EMERGENCY, FAMILY, GROUPS, INCOME, MEMBERS, SINKING_FUNDS, TRANSACTIONS, TREND } from './data.js';

export function createState() {
  return {
    // Pemasukan gabungan = daftar baris kontributor (anggota + nominal).
    // Urutan bebas, satu anggota maksimal satu baris; totalnya yang dipakai
    // semua pos dan Batas Aman.
    income: INCOME.map((c) => ({ ...c })),
    alloc: { kebutuhan: GROUPS.kebutuhan.pct, gaya: GROUPS.gaya.pct, tabungan: GROUPS.tabungan.pct },
    bills: Object.fromEntries(BILLS.map((b) => [b.id, b.paid])),
    transactions: TRANSACTIONS.map((t) => ({ ...t })),
    nextId: TRANSACTIONS.length + 1,
  };
}

export function totalIncome(state) {
  return state.income.reduce((sum, c) => sum + c.amount, 0);
}

// Anggota yang belum dipakai di baris lain (baris ke-exceptIndex boleh
// memakai anggotanya sendiri). Dipakai select kontributor supaya satu
// anggota tidak muncul dua kali.
export function freeMembers(state, exceptIndex = -1) {
  const used = new Set(state.income.map((c, i) => (i === exceptIndex ? null : c.member)));
  return MEMBERS.filter((m) => !used.has(m));
}

export function setContributor(state, index, member) {
  const row = state.income[index];
  if (!row || !freeMembers(state, index).includes(member)) return false;
  row.member = member;
  return true;
}

export function setContributorAmount(state, index, amount) {
  const row = state.income[index];
  if (!row) return false;
  row.amount = Math.max(0, amount || 0);
  return true;
}

export function addContributor(state) {
  const free = freeMembers(state);
  if (!free.length) return false;
  state.income.push({ member: free[0], amount: 0 });
  return true;
}

export function removeContributor(state, index) {
  if (state.income.length <= 1) return false;
  state.income.splice(index, 1);
  return true;
}

// Nominal satu pos = persentasenya dikali pemasukan gabungan.
export function envelope(state, group) {
  return Math.round((totalIncome(state) * state.alloc[group]) / 100);
}

export function spentByCategory(state) {
  const out = Object.fromEntries(CATEGORIES.map((c) => [c.id, 0]));
  for (const t of state.transactions) out[t.category] += t.amount;
  return out;
}

export function spentByGroup(state, group) {
  const byCat = spentByCategory(state);
  return CATEGORIES.filter((c) => c.group === group).reduce((sum, c) => sum + byCat[c.id], 0);
}

export function spentTotal(state) {
  return state.transactions.reduce((sum, t) => sum + t.amount, 0);
}

export function remainingByGroup(state, group) {
  return envelope(state, group) - spentByGroup(state, group);
}

// Batas aman belanja hari ini: sisa pos Kebutuhan + sisa pos Gaya Hidup
// dibagi sisa hari di bulan ini. Pos Tabungan terkunci, jadi tidak dihitung.
export function daysLeft() {
  return FAMILY.daysInMonth - FAMILY.today;
}

export function safeToSpend(state) {
  const left = remainingByGroup(state, 'kebutuhan') + remainingByGroup(state, 'gaya');
  return Math.floor(left / daysLeft());
}

// Rata-rata belanja per hari: total terpakai dibagi hari yang sudah berjalan
// (FAMILY.today = 15). Dihitung live dari state, jadi Catat Pengeluaran, ubah/hapus
// transaksi, dan centang tagihan ikut mengubah angka ini.
export function avgDailySpend(state) {
  return FAMILY.today > 0 ? spentTotal(state) / FAMILY.today : 0;
}

export function memberTotals(state) {
  const out = { Suami: 0, Istri: 0, Anak: 0, Rumah: 0 };
  for (const t of state.transactions) out[t.member] += t.amount;
  return out;
}

// Pembagian pos Tabungan ke sinking funds. Tiga target tahunan punya setoran
// tetap (target / 12); sisanya masuk Dana Darurat. Kalau pos Tabungan
// mengecil di bawah 1.550.000, semuanya mengecil sebanding supaya tidak ada
// yang minus.
export function sinkingSplit(state) {
  const savings = envelope(state, 'tabungan');
  const fixed = SINKING_FUNDS.map((f) => Math.round(f.yearly / 12));
  const fixedTotal = fixed.reduce((a, b) => a + b, 0);
  if (savings >= fixedTotal) {
    return SINKING_FUNDS.map((f, i) => ({ ...f, monthly: fixed[i] })).concat([
      { id: 'darurat', label: 'Dana Darurat', monthly: savings - fixedTotal },
    ]);
  }
  const scale = savings / fixedTotal;
  return SINKING_FUNDS.map((f, i) => ({ ...f, monthly: Math.round(fixed[i] * scale) })).concat([
    { id: 'darurat', label: 'Dana Darurat', monthly: 0 },
  ]);
}

export function emergencyTarget(state) {
  return EMERGENCY.multiplier * envelope(state, 'kebutuhan');
}

export function emergencyMonthsLeft(state) {
  const deposit = sinkingSplit(state).find((s) => s.id === 'darurat').monthly;
  const missing = emergencyTarget(state) - EMERGENCY.collected;
  if (missing <= 0) return 0;
  if (deposit <= 0) return null;
  return Math.ceil(missing / deposit);
}

export function trendWithCurrent(state) {
  return TREND.map((m) => (m.spent === null ? { ...m, spent: spentTotal(state) } : m));
}

// Geser satu slider: dua slider lain menyerap selisihnya secara proporsional
// supaya total tetap 100%.
export function rebalanceAlloc(state, changed, value) {
  const others = Object.keys(state.alloc).filter((g) => g !== changed);
  const old = state.alloc[changed];
  const next = Math.max(0, Math.min(100, value));
  const delta = next - old;
  const totalOther = others.reduce((sum, g) => sum + state.alloc[g], 0);
  state.alloc[changed] = next;
  if (totalOther <= 0) {
    const each = Math.max(0, 100 - next) / others.length;
    others.forEach((g) => { state.alloc[g] = Math.round(each); });
    return;
  }
  let assigned = 0;
  others.forEach((g, i) => {
    if (i === others.length - 1) {
      state.alloc[g] = Math.max(0, 100 - next - assigned);
    } else {
      const take = Math.round((state.alloc[g] / totalOther) * delta);
      state.alloc[g] = Math.max(0, state.alloc[g] - take);
      assigned += state.alloc[g];
    }
  });
  // Perbaiki pembulatan supaya total persis 100.
  const total = Object.values(state.alloc).reduce((a, b) => a + b, 0);
  if (total !== 100) state.alloc[others[others.length - 1]] += 100 - total;
}

export function addTransaction(state, tx) {
  const row = { id: `t${String(state.nextId).padStart(2, '0')}`, day: FAMILY.today, ...tx };
  state.nextId += 1;
  state.transactions.unshift(row);
  return row;
}

export function updateTransaction(state, id, patch) {
  const row = state.transactions.find((t) => t.id === id);
  if (row) Object.assign(row, patch);
  return row;
}

export function deleteTransaction(state, id) {
  const row = state.transactions.find((t) => t.id === id);
  if (row && row.bill) state.bills[row.bill] = false;
  state.transactions = state.transactions.filter((t) => t.id !== id);
}

// Mencentang tagihan menambah transaksinya; melepas centang menghapusnya.
// Jadi strip tagihan dan buku kas tidak pernah berselisih.
export function setBillPaid(state, billId, paid) {
  const bill = BILLS.find((b) => b.id === billId);
  if (!bill) return;
  state.bills[billId] = paid;
  const existing = state.transactions.find((t) => t.bill === billId);
  if (paid && !existing) {
    addTransaction(state, {
      label: bill.label, category: bill.category, member: 'Rumah', method: 'Debit', amount: bill.amount, bill: billId,
    });
  } else if (!paid && existing) {
    state.transactions = state.transactions.filter((t) => t.id !== existing.id);
  }
}

export function categoryOf(id) {
  return CATEGORIES.find((c) => c.id === id);
}
