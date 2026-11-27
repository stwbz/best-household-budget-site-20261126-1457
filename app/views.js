// PosBareng — HTML tiap halaman, dibangun dari state.
//
// Semua angka di halaman ini hasil hitung state.js, bukan angka yang ditulis
// di sini. Satu-satunya pengecualian: teks penjelasan dan label.

import { BILLS, CATEGORIES, FAMILY, GROUPS, MEMBERS, METHODS, SINKING_FUNDS } from './data.js';
import {
  avgDailySpend, daysLeft, emergencyMonthsLeft, emergencyTarget, envelope, memberTotals, remainingByGroup,
  safeToSpend, sinkingSplit, spentByCategory, spentByGroup, spentTotal, totalIncome, trendWithCurrent,
} from './state.js';

export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function fmt(n) {
  return `Rp${Math.round(n).toLocaleString('id-ID')}`;
}

// Angka polos dengan pemisah ribuan, untuk value input (9.000.000).
export function fmtPlain(n) {
  return Math.round(n).toLocaleString('id-ID');
}

// Ikon SVG inline kecil untuk pill badge (tanpa emoji, tanpa file luar).
const ICON_PERSON = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="8" cy="4.6" r="2.8"/><path d="M2.2 14.2c.5-3.2 2.9-4.7 5.8-4.7s5.3 1.5 5.8 4.7z"/></svg>';
const ICON_HOUSE = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1.8 1.5 7.5h1.8v6.7h3.4v-4h2.6v4h3.4V7.5h1.8z"/></svg>';
const ICON_CHEVRON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg>';
const MEMBER_PILL = { Suami: 'pill-suami', Istri: 'pill-istri', Anak: 'pill-anak', Rumah: 'pill-rumah' };

export function memberPill(m) {
  const icon = m === 'Rumah' ? ICON_HOUSE : ICON_PERSON;
  return `<span class="pill ${MEMBER_PILL[m] || 'pill-rumah'}">${icon}${esc(m)}</span>`;
}

export function categoryPill(label, color) {
  return `<span class="pill pill-cat"><span class="dot" style="background:${color}"></span>${esc(label)}</span>`;
}

export function fmtShort(n) {
  if (n >= 1000000) return `Rp${(n / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} jt`;
  if (n >= 1000) return `Rp${Math.round(n / 1000)} rb`;
  return `Rp${Math.round(n)}`;
}

function pctOf(part, whole) {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

// Donat SVG dari segmen {label, value, color}. Satu lingkaran per segmen,
// dipotong dengan stroke-dasharray — tanpa library, tanpa gambar.
function donutSVG(segments, size) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  const r = 80;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const rings = segments
    .map((s) => {
      const len = total > 0 ? (s.value / total) * c : 0;
      const ring = `<circle cx="100" cy="100" r="${r}" fill="none" stroke="${s.color}" stroke-width="34" stroke-dasharray="${len.toFixed(1)} ${(c - len).toFixed(1)}" stroke-dashoffset="${(-offset).toFixed(1)}" />`;
      offset += len;
      return ring;
    })
    .join('');
  return `<svg viewBox="0 0 200 200" width="${size}" height="${size}" role="img" aria-label="Donat distribusi pengeluaran">${rings}<circle cx="100" cy="100" r="58" fill="#fffdf6" /><text x="100" y="96" text-anchor="middle" class="donut-total">${fmtShort(total)}</text><text x="100" y="116" text-anchor="middle" class="donut-label">terpakai</text></svg>`;
}

function bar(pct, label, tone) {
  const t = tone || (pct >= 90 ? 'over' : pct >= 75 ? 'warn' : 'ok');
  return `<div class="bar"><div class="bar-fill ${t}" style="width:${Math.min(pct, 100)}%"></div></div><span class="bar-pct">${pct}%${label ? ` ${label}` : ''}</span>`;
}

function statCard(label, value, sub) {
  return `<div class="stat"><span class="stat-label">${label}</span><strong class="stat-value">${value}</strong><span class="stat-sub">${sub}</span></div>`;
}

// ---------------------------------------------------------------- dashboard
export function dashboardView(state) {
  const income = totalIncome(state);
  const spent = spentTotal(state);
  const remain = remainingByGroup(state, 'kebutuhan') + remainingByGroup(state, 'gaya');
  const safe = safeToSpend(state);
  const byCat = spentByCategory(state);
  const segments = [
    { label: 'Belanja Bahan Makanan', value: byCat.belanja, color: '#1d4d2b' },
    { label: 'SPP Sekolah', value: byCat.spp, color: '#2f7a45' },
    { label: 'Tagihan & Utilitas', value: byCat.utilitas, color: '#5aa469' },
    { label: 'Makan & Jajan Luar', value: byCat.jajan, color: '#d9a441' },
    { label: 'Transportasi', value: byCat.transport, color: '#7fb069' },
    { label: 'Kebutuhan Anak', value: byCat.anak, color: '#b08968' },
    { label: 'Lainnya', value: byCat.hiburan + byCat.kesehatan + byCat.pakaian + byCat.sosial, color: '#9c9c8a' },
  ];
  // Legenda donat: hanya kategori yang sudah terpakai (Rp0 disembunyikan).
  const legend = CATEGORIES.filter((c) => byCat[c.id] > 0).map((c) => {
    const color = (segments.find((s) => s.label === c.label) || { color: '#9c9c8a' }).color;
    return `<li><span class="dot" style="background:${color}"></span>${esc(c.label)}<b>${fmt(byCat[c.id])}</b><i>${pctOf(byCat[c.id], spent)}%</i></li>`;
  }).join('');
  const members = memberTotals(state);
  const memberBars = MEMBERS.map((m) => {
    const v = members[m];
    return `<div class="member-row">${memberPill(m)}<div class="bar"><div class="bar-fill ok" style="width:${pctOf(v, spent)}%"></div></div><b>${fmt(v)}</b><i>${pctOf(v, spent)}%</i></div>`;
  }).join('');
  const bills = BILLS.map((b) => {
    const paid = state.bills[b.id];
    return `<li class="bill ${paid ? 'paid' : 'due'}"><label><input type="checkbox" data-bill="${b.id}" ${paid ? 'checked' : ''}> <span class="bill-check">${paid ? 'Lunas' : 'Tandai lunas'}</span></label><span class="bill-name">${esc(b.label)}</span><span class="bill-due">jatuh tempo ${esc(b.due)}</span><b>${fmt(b.amount)}</b></li>`;
  }).join('');
  const trend = trendWithCurrent(state);
  const maxV = Math.max(...trend.map((m) => m.income));
  const trendBars = trend
    .map((m) => {
      const hIn = Math.round((m.income / maxV) * 120);
      const hSp = Math.round((m.spent / maxV) * 120);
      return `<div class="trend-col"><div class="trend-pair"><div class="trend-bar in" style="height:${hIn}px" title="Pemasukan ${fmt(m.income)}"></div><div class="trend-bar out" style="height:${hSp}px" title="Pengeluaran ${fmt(m.spent)}"></div></div><span>${m.month}</span></div>`;
    })
    .join('');
  const sinking = sinkingSplit(state);
  const radar = sinking
    .filter((s) => s.id !== 'darurat')
    .map((s) => {
      const f = SINKING_FUNDS.find((x) => x.id === s.id);
      const p = pctOf(f.collected, f.yearly);
      return `<li><span>${esc(s.label)}</span><b>${fmt(f.collected)} / ${fmt(f.yearly)}</b>${bar(p, `· ${esc(f.due)} · ${fmt(s.monthly)}/bln`, 'ok')}</li>`;
    })
    .join('');
  const needsPct = pctOf(spentByGroup(state, 'kebutuhan'), envelope(state, 'kebutuhan'));
  const wantsPct = pctOf(spentByGroup(state, 'gaya'), envelope(state, 'gaya'));
  // Rata-rata belanja per hari, dihitung live: kalau di atas Batas Aman,
  // subline-nya menandai selisihnya (kalau di bawah, tidak ada flag).
  const avgDaily = avgDailySpend(state);
  const incomeParts = state.income.filter((c) => c.amount > 0).map((c) => `${c.member} ${fmt(c.amount)}`).join(' + ');
  const overPct = Math.round((avgDaily / safe) * 100) - 100;
  const avgSub = overPct > 0
    ? `${FAMILY.today} hari berjalan · <span class="stat-flag">${overPct}% di atas Batas Aman ${fmt(safe)}/hari</span>`
    : `${FAMILY.today} hari berjalan · di bawah Batas Aman ${fmt(safe)}/hari`;
  return `
<section class="hero">
  <div>
    <p class="hero-label">Batas Aman Belanja Hari Ini</p>
    <div class="hero-amount">${fmt(safe)}</div>
    <p class="hero-shorthand">Sisa ${fmt(remain)} ÷ ${daysLeft()} hari
      <details class="formula"><summary><span class="info-dot">i</span> Rumus</summary><p class="formula-full">Batas Aman = (Sisa Kebutuhan ${fmt(remainingByGroup(state, 'kebutuhan'))} + Sisa Gaya Hidup ${fmt(remainingByGroup(state, 'gaya'))}) ÷ ${daysLeft()} hari tersisa</p></details>
    </p>
  </div>
  <div class="hero-side">
    <span class="hero-side-label">Sisa aman bulan ini</span>
    <strong>${fmt(remain)}</strong>
    <span class="hero-side-sub">dari ${fmt(envelope(state, 'kebutuhan') + envelope(state, 'gaya'))} pos belanja</span>
  </div>
</section>
<section class="stats">
  ${statCard('Pemasukan', fmt(income), incomeParts || 'Belum ada pemasukan')}
  ${statCard('Pengeluaran', fmt(spent), `${state.transactions.length} transaksi · 1–15 Nov`)}
  ${statCard('Rata-rata Belanja/Hari', fmt(avgDaily), avgSub)}
  ${statCard('Tabungan', `${state.alloc.tabungan}%`, `${fmt(envelope(state, 'tabungan'))} dikunci tiap gajian`)}
</section>
<section class="grid-2">
  <div class="card">
    <h2>Ke mana uang pergi?</h2>
    <p class="muted">Pengeluaran 1–15 November 2026, per kategori.</p>
    <div class="donut-wrap">${donutSVG(segments, 190)}<ul class="legend">${legend}</ul></div>
  </div>
  <div class="card">
    <h2>Barometer 2 pos belanja</h2>
    <div class="meter"><span>Kebutuhan Pokok — terpakai ${fmt(spentByGroup(state, 'kebutuhan'))} dari ${fmt(envelope(state, 'kebutuhan'))}</span>${bar(needsPct, needsPct >= 90 ? 'lewat batas' : needsPct >= 75 ? 'hampir habis' : 'aman')}</div>
    <div class="meter"><span>Gaya Hidup — terpakai ${fmt(spentByGroup(state, 'gaya'))} dari ${fmt(envelope(state, 'gaya'))}</span>${bar(wantsPct, wantsPct >= 90 ? 'lewat batas' : wantsPct >= 75 ? 'hampir habis' : 'aman')}</div>
    <h2 class="sub">Rasio pengeluaran per anggota</h2>
    ${memberBars}
  </div>
</section>
<section class="grid-2">
  <div class="card">
    <h2>Tagihan bulan ini</h2>
    <ul class="bills">${bills}</ul>
  </div>
  <div class="card">
    <h2>Tren 6 bulan</h2>
    <p class="muted">Pemasukan vs pengeluaran, Juni–November 2026.</p>
    <div class="trend">${trendBars}</div>
    <p class="trend-note">November dihitung dari transaksi yang sama: ${fmt(spent)} dari ${fmt(income)}.</p>
    <h2 class="sub">Radar sinking funds terdekat</h2>
    <ul class="radar">${radar}</ul>
  </div>
</section>`;
}

// ---------------------------------------------------------------- rapat gaji
export function rapatView(state) {
  const income = totalIncome(state);
  const sinking = sinkingSplit(state);
  const cards = sinking.map((s) => {
    if (s.id === 'darurat') {
      const target = emergencyTarget(state);
      const p = pctOf(41800000, target);
      const months = emergencyMonthsLeft(state);
      return `<div class="fund"><h3>Dana Darurat</h3><p class="muted">Target 9× pengeluaran wajib bulanan</p><strong>${fmt(41800000)} / ${fmt(target)}</strong>${bar(p, '', 'ok')}<span class="fund-meta">Setoran ${fmt(s.monthly)}/bln · ${months === null ? 'setoran 0 — naikkan pos Tabungan' : months === 0 ? 'target tercapai' : `sekitar ${months} bulan lagi`}</span></div>`;
    }
    const f = SINKING_FUNDS.find((x) => x.id === s.id);
    const p = pctOf(f.collected, f.yearly);
    return `<div class="fund"><h3>${esc(s.label)}</h3><p class="muted">Target ${fmt(f.yearly)}/tahun · jatuh tempo ${esc(f.due)}</p><strong>${fmt(f.collected)} / ${fmt(f.yearly)}</strong>${bar(p, '', 'ok')}<span class="fund-meta">Menyedot ${fmt(s.monthly)}/bln dari pos Tabungan</span></div>`;
  }).join('');
  const sliders = Object.keys(GROUPS).map((g) => {
    const group = GROUPS[g];
    return `<div class="slider-row"><label for="slider-${g}">${group.label}</label><input type="range" id="slider-${g}" data-group="${g}" min="0" max="100" value="${state.alloc[g]}"><span class="slider-val"><b>${state.alloc[g]}%</b> · ${fmt(envelope(state, g))}</span></div>`;
  }).join('');
  // Baris kontributor pemasukan: pilih anggota dulu (selektor ber-style pill
  // yang sama dengan tag anggota di seluruh app), baru isi nominal di
  // bawahnya. Satu anggota maksimal satu baris — anggota yang sudah dipakai
  // baris lain tidak muncul di pilihan. Default tampil hasil selected-nya.
  const allUsed = state.income.length >= MEMBERS.length;
  const incomeRows = state.income.map((c, i) => {
    const options = MEMBERS.map((m) => {
      const usedElsewhere = state.income.some((x, j) => j !== i && x.member === m);
      return `<option value="${esc(m)}" ${c.member === m ? 'selected' : ''} ${usedElsewhere ? 'disabled' : ''}>${esc(m)}</option>`;
    }).join('');
    return `<div class="contrib-row">
      <label>Anggota<span class="pill ${MEMBER_PILL[c.member] || 'pill-rumah'} contrib-select"><select data-contrib="${i}" aria-label="Anggota pemasukan ${i + 1}">${options}</select>${ICON_CHEVRON}</span></label>
      <label>Nominal (Rp)<input type="text" inputmode="numeric" autocomplete="off" data-contrib-amount="${i}" value="${fmtPlain(c.amount)}" placeholder="0"></label>
      ${state.income.length > 1 ? `<button type="button" class="contrib-remove" data-contrib-remove="${i}" aria-label="Hapus pemasukan ${esc(c.member)}" title="Hapus baris ini">×</button>` : ''}
    </div>`;
  }).join('');
  return `
<section class="page-head">
  <h1>Atur Alokasi Gaji</h1>
  <p>Periode ${esc(FAMILY.month)}</p>
</section>
<section class="grid-2">
  <div class="card">
    <h2>Pemasukan gabungan</h2>
    <div class="contrib-list">${incomeRows}</div>
    <button type="button" class="contrib-add" data-contrib-add ${allUsed ? 'disabled' : ''}>+ Tambah pemasukan</button>
    <p class="income-total">Total kas bulanan: <b>${fmt(income)}</b></p>
    <h2 class="sub">Alokasi Gaji</h2>
    ${sliders}
  </div>
  <div class="card">
    <h2>Target &amp; Dana Tahunan</h2>
    <p class="muted">Target tahunan yang dicicil dari pos Tabungan.</p>
    <div class="funds">${cards}</div>
  </div>
</section>`;
}

// ---------------------------------------------------------------- buku kas
// Baris per halaman riwayat transaksi. 28 transaksi = 4 halaman (8+8+8+4).
export const PAGE_SIZE = 8;

// Baris transaksi yang lolos filter + cari, diurutkan terbaru dulu
// (hari menurun, lalu urutan awal). Dipakai view dan handler pagination
// supaya keduanya selalu menghitung dari daftar yang sama.
export function filteredRows(state, ui) {
  return state.transactions
    .map((t, i) => ({ ...t, _i: i }))
    .filter((t) => {
      if (ui.member !== 'Semua' && t.member !== ui.member) return false;
      if (ui.method !== 'Semua' && t.method !== ui.method) return false;
      if (ui.category !== 'Semua' && t.category !== ui.category) return false;
      if (ui.search && !`${t.label} ${t.category}`.toLowerCase().includes(ui.search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => b.day - a.day || a._i - b._i);
}

export function bukuKasView(state, ui) {
  const byCat = spentByCategory(state);
  const rows = filteredRows(state, ui);
  const total = rows.length;
  // Halaman aktif di-clamp: kalau filter/hapus baris membuat halaman
  // terakhir mengecil, tampilkan halaman terakhir yang masih ada.
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, ui.page || 1), pages);
  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);
  const rangeText = total === 0 ? 'Menampilkan 0 dari 0 transaksi' : `Menampilkan ${start}–${end} dari ${total} transaksi`;
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const body = pageRows
    .map((t) => {
      const cat = CATEGORIES.find((c) => c.id === t.category);
      const color = (['belanja', 'spp', 'utilitas', 'jajan', 'transport', 'anak'].includes(t.category)
        ? { belanja: '#1d4d2b', spp: '#2f7a45', utilitas: '#5aa469', jajan: '#d9a441', transport: '#7fb069', anak: '#b08968' }[t.category]
        : '#9c9c8a');
      return `<tr><td>${t.day} Nov</td><td>${esc(t.label)}${t.bill ? ' <span class="tag-bill">tagihan</span>' : ''}</td><td>${categoryPill(cat.label, color)}</td><td>${memberPill(t.member)}</td><td>${esc(t.method)}</td><td class="num">−${fmt(t.amount)}</td><td class="actions"><button type="button" data-edit="${t.id}">Ubah</button><button type="button" data-delete="${t.id}">Hapus</button></td></tr>`;
    })
    .join('');
  const editing = ui.editingId ? state.transactions.find((t) => t.id === ui.editingId) : null;
  const qa = editing || { amount: '', category: 'belanja', member: 'Istri', method: 'QRIS', label: '' };
  const catOptions = CATEGORIES.map((c) => `<option value="${c.id}" ${qa.category === c.id ? 'selected' : ''}>${esc(c.label)}</option>`).join('');
  const memberOptions = MEMBERS.map((m) => `<option ${qa.member === m ? 'selected' : ''}>${m}</option>`).join('');
  const methodOptions = METHODS.map((m) => `<option ${qa.method === m ? 'selected' : ''}>${m}</option>`).join('');
  return `
<section class="page-head">
  <h1>Buku Kas Keluarga</h1>
</section>
<section class="card">
  <h2>${editing ? 'Ubah transaksi' : 'Catat Pengeluaran'}</h2>
  <form id="quick-add">
    <label>Nominal (Rp)<input type="text" inputmode="numeric" autocomplete="off" id="qa-amount" value="${qa.amount === '' ? '' : fmtPlain(qa.amount)}" placeholder="250.000" required></label>
    <label class="qa-wide">Kategori<select id="qa-category">${catOptions}</select></label>
    <label>Tag pelaku<select id="qa-member">${memberOptions}</select></label>
    <label>Metode<select id="qa-method">${methodOptions}</select></label>
    <label>Catatan<input type="text" id="qa-note" value="${esc(qa.label)}" placeholder="cth. Belanja dapur" maxlength="80"></label>
    <button type="submit">${editing ? 'Simpan perubahan' : 'Simpan'}</button>
    ${editing ? '<button type="button" id="qa-cancel">Batal</button>' : ''}
  </form>
  ${ui.domino ? `<p class="domino" role="status">${ui.domino}</p>` : ''}
</section>
<section class="card">
  <div class="table-head"><h2>Riwayat transaksi</h2><span class="count-badge">${total} transaksi</span></div>
  <div class="filters">
    <label>Anggota<select id="f-member"><option>Semua</option>${MEMBERS.map((m) => `<option ${ui.member === m ? 'selected' : ''}>${m}</option>`).join('')}</select></label>
    <label>Metode<select id="f-method"><option>Semua</option>${METHODS.map((m) => `<option ${ui.method === m ? 'selected' : ''}>${m}</option>`).join('')}</select></label>
    <label>Kategori<select id="f-category"><option value="Semua">Semua</option>${CATEGORIES.map((c) => `<option value="${c.id}" ${ui.category === c.id ? 'selected' : ''}>${esc(c.label)}</option>`).join('')}</select></label>
    <label>Cari<input type="search" id="f-search" value="${esc(ui.search)}" placeholder="cth. pasar"></label>
  </div>
  <div class="table-wrap"><table>
    <thead><tr><th>Tanggal</th><th>Transaksi</th><th>Kategori</th><th>Anggota</th><th>Metode</th><th class="num">Jumlah</th><th></th></tr></thead>
    <tbody>${body || '<tr><td colspan="7">Tidak ada transaksi yang cocok dengan filter.</td></tr>'}</tbody>
  </table></div>
  <p class="table-foot">Total terpakai ${fmt(spentTotal(state))} · Kebutuhan ${fmt(spentByGroup(state, 'kebutuhan'))} · Gaya Hidup ${fmt(spentByGroup(state, 'gaya'))} · Sisa aman ${fmt(remainingByGroup(state, 'kebutuhan') + remainingByGroup(state, 'gaya'))}</p>
  <div class="pager">
    <span class="pager-info">${rangeText}</span>
    <div class="pager-btns" role="navigation" aria-label="Halaman riwayat transaksi">
      <button type="button" data-page="prev" ${page <= 1 ? 'disabled' : ''} aria-label="Halaman sebelumnya">‹</button>
      ${Array.from({ length: pages }, (_, i) => {
        const p = i + 1;
        return `<button type="button" data-page="${p}" ${p === page ? 'class="current" aria-current="page"' : ''}>${p}</button>`;
      }).join('')}
      <button type="button" data-page="next" ${page >= pages ? 'disabled' : ''} aria-label="Halaman berikutnya">›</button>
    </div>
  </div>
</section>`;
}

export function missingView() {
  return `<section class="page-head"><h1>Halaman tidak ditemukan</h1><p>Tidak ada halaman di alamat ini. <a href="#/dashboard">Kembali ke Beranda</a>.</p></section>`;
}
