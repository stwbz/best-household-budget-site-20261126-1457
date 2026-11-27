// PosBareng — router dan semua interaksi.
//
//   #/dashboard     Beranda (halaman utama)
//   #/rapat-gajian  Alokasi Gaji
//   #/buku-kas      Buku Kas Keluarga
//
// Semua kontrol hidup: slider alokasi, input gaji, centang tagihan, form
// Catat Pengeluaran, filter dan ubah/hapus transaksi. Setiap perubahan menulis ke
// state yang sama lalu me-render ulang, jadi tidak ada halaman yang
// menampilkan angka lama. window.__shotReady menandai halaman sudah
// selesai di-render, supaya skrip screenshot tahu kapan memotret.

import { createState, addTransaction, deleteTransaction, memberTotals, rebalanceAlloc, remainingByGroup, safeToSpend, setBillPaid, updateTransaction, addContributor, removeContributor, setContributor, setContributorAmount } from './state.js';
import { bukuKasView, dashboardView, filteredRows, fmt, missingView, PAGE_SIZE, rapatView } from './views.js';

const app = document.getElementById('app');
const state = createState();
const ui = { member: 'Semua', method: 'Semua', category: 'Semua', search: '', editingId: null, domino: '', page: 1 };

function route() {
  const hash = location.hash || '#/dashboard';
  if (hash.startsWith('#/rapat-gajian')) return 'rapat';
  if (hash.startsWith('#/buku-kas')) return 'kas';
  if (hash.startsWith('#/dashboard') || hash === '#/') return 'dashboard';
  return 'missing';
}

function render() {
  window.__shotReady = false;
  const page = route();
  document.querySelectorAll('.nav a, .tabbar a').forEach((a) => {
    a.classList.toggle('active', a.dataset.page === page);
  });
  if (page === 'dashboard') {
    document.title = 'PosBareng — Beranda';
    app.innerHTML = dashboardView(state);
  } else if (page === 'rapat') {
    document.title = 'PosBareng — Alokasi Gaji';
    app.innerHTML = rapatView(state);
  } else if (page === 'kas') {
    document.title = 'PosBareng — Buku Kas Keluarga';
    app.innerHTML = bukuKasView(state, ui);
  } else {
    document.title = 'PosBareng — Tidak ditemukan';
    app.innerHTML = missingView();
  }
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

// Efek domino, ditulis sebagai kalimat supaya terlihat: sebelum dan sesudah
// satu transaksi disimpan.
function dominoMessage(before, after, tx) {
  const cat = tx.category;
  const group = ['belanja', 'transport', 'utilitas', 'spp', 'cicilan', 'kesehatan', 'anak'].includes(cat) ? 'kebutuhan' : 'gaya';
  const label = group === 'kebutuhan' ? 'Kebutuhan Pokok' : 'Gaya Hidup';
  return `Tersimpan: ${tx.label} ${fmt(tx.amount)}. Saldo ${label} ${fmt(before.remaining[group])} → ${fmt(after.remaining[group])} · Batas Aman hari ini ${fmt(before.safe)} → ${fmt(after.safe)} · Belanja ${tx.member} bulan ini ${fmt(before.member[tx.member])} → ${fmt(after.member[tx.member])}.`;
}

function snapshot() {
  return {
    remaining: { kebutuhan: remainingByGroup(state, 'kebutuhan'), gaya: remainingByGroup(state, 'gaya') },
    safe: safeToSpend(state),
    member: memberTotals(state),
  };
}

// Ambil angka dari input yang sudah diformat pemisah ribuan (9.000.000).
function parseAmount(text) {
  return Math.max(0, Number(String(text).replace(/\D/g, '')) || 0);
}

function formatGrouped(text) {
  const digits = String(text).replace(/\D/g, '');
  return digits ? Number(digits).toLocaleString('id-ID') : '';
}

app.addEventListener('input', (event) => {
  const el = event.target;
  if (el.matches('input[type="range"][data-group]')) {
    rebalanceAlloc(state, el.dataset.group, Number(el.value));
    render();
  }
  // Nominal baris kontributor: diformat sambil mengetik, total kas bulanan
  // dan alokasi ikut berubah live (render ulang + fokus kembali ke input).
  if (el.matches('input[data-contrib-amount]')) {
    const idx = Number(el.dataset.contribAmount);
    setContributorAmount(state, idx, parseAmount(el.value));
    render();
    const back = document.querySelector(`input[data-contrib-amount="${idx}"]`);
    if (back) {
      back.focus();
      back.setSelectionRange(back.value.length, back.value.length);
    }
  }
  // Nominal Catat Pengeluaran diformat sambil mengetik; nilai mentah tetap angka.
  if (el.id === 'qa-amount') {
    const formatted = formatGrouped(el.value);
    if (el.value !== formatted) {
      el.value = formatted;
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }
  if (el.id === 'f-search') {
    ui.search = el.value;
    ui.page = 1; // ganti filter/cari selalu kembali ke halaman 1
    render();
    const back = document.getElementById('f-search');
    if (back) {
      back.focus();
      back.setSelectionRange(back.value.length, back.value.length);
    }
  }
});

app.addEventListener('change', (event) => {
  const el = event.target;
  if (el.matches('input[type="checkbox"][data-bill]')) {
    setBillPaid(state, el.dataset.bill, el.checked);
    render();
  }
  if (el.id === 'f-member') { ui.member = el.value; ui.page = 1; render(); }
  if (el.id === 'f-method') { ui.method = el.value; ui.page = 1; render(); }
  if (el.id === 'f-category') { ui.category = el.value; ui.page = 1; render(); }
  if (el.matches('select[data-contrib]')) {
    setContributor(state, Number(el.dataset.contrib), el.value);
    render();
  }
});

app.addEventListener('submit', (event) => {
  if (event.target.id !== 'quick-add') return;
  event.preventDefault();
  const amount = parseAmount(document.getElementById('qa-amount').value);
  const tx = {
    label: document.getElementById('qa-note').value.trim() || 'Tanpa catatan',
    category: document.getElementById('qa-category').value,
    member: document.getElementById('qa-member').value,
    method: document.getElementById('qa-method').value,
    amount,
  };
  if (amount <= 0) return;
  const before = snapshot();
  if (ui.editingId) {
    updateTransaction(state, ui.editingId, tx);
    ui.editingId = null;
  } else {
    addTransaction(state, tx);
  }
  const after = snapshot();
  ui.domino = dominoMessage(before, after, tx);
  ui.page = 1; // transaksi baru (di urutan teratas) langsung terlihat
  render();
});

app.addEventListener('click', (event) => {
  const el = event.target;
  if (el.id === 'qa-cancel') {
    ui.editingId = null;
    ui.domino = '';
    render();
    return;
  }
  // Pagination riwayat transaksi: tombol ‹ › dan nomor halaman.
  const pageEl = el.closest ? el.closest('[data-page]') : null;
  if (pageEl && !pageEl.disabled) {
    const total = filteredRows(state, ui).length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const current = ui.page || 1;
    if (pageEl.dataset.page === 'prev') ui.page = Math.max(1, current - 1);
    else if (pageEl.dataset.page === 'next') ui.page = Math.min(pages, current + 1);
    else ui.page = Math.min(pages, Math.max(1, Number(pageEl.dataset.page) || 1));
    render();
    return;
  }
  if (el.dataset && el.dataset.contribAdd !== undefined) {
    addContributor(state);
    render();
    return;
  }
  if (el.dataset && el.dataset.contribRemove !== undefined) {
    removeContributor(state, Number(el.dataset.contribRemove));
    render();
    return;
  }
  const editId = el.dataset && el.dataset.edit;
  const deleteId = el.dataset && el.dataset.delete;
  if (editId) {
    ui.editingId = editId;
    ui.domino = '';
    render();
    const amount = document.getElementById('qa-amount');
    if (amount) amount.focus();
  }
  if (deleteId) {
    deleteTransaction(state, deleteId);
    if (ui.editingId === deleteId) ui.editingId = null;
    ui.domino = '';
    render();
  }
});

window.addEventListener('hashchange', render);
render();
