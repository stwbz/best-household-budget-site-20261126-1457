// PosBareng — data keluarga Santoso, November 2026.
//
// Satu-satunya tempat angka awal ditulis. Semua halaman dihitung dari data
// ini lewat state.js, jadi tidak ada angka yang ditulis dua kali di tempat
// berbeda: kalau satu transaksi berubah, dashboard, rapat gajian dan buku kas
// ikut berubah dari sumber yang sama. Semua nominal dalam rupiah.

export const FAMILY = {
  name: 'Keluarga Santoso',
  city: 'Jakarta',
  month: 'November 2026',
  daysInMonth: 30,
  today: 15, // posisi "sekarang": 15 November, 15 hari tersisa di bulan ini
};

export const INCOME = [
  { member: 'Suami', amount: 9000000 },
  { member: 'Istri', amount: 6000000 },
];

// Tiga pos anggaran. Persentasenya dikunci total 100% oleh slider di halaman
// Rapat Gajian; nominal pos dihitung dari persentase dikali pemasukan.
export const GROUPS = {
  kebutuhan: { label: 'Kebutuhan Pokok', short: 'Kebutuhan', pct: 55 },
  gaya: { label: 'Gaya Hidup', short: 'Gaya Hidup', pct: 20 },
  tabungan: { label: 'Tabungan & Target Tahunan', short: 'Tabungan', pct: 25 },
};

// Kategori belanja. Anggaran per kategori dijumlahkan per pos:
// Kebutuhan 8.250.000 = 2.400.000 + 1.200.000 + 1.180.000 + 1.200.000
//   + 850.000 + 420.000 + 1.000.000; Gaya Hidup 3.000.000 = 1.200.000
//   + 450.000 + 750.000 + 600.000.
export const CATEGORIES = [
  { id: 'belanja', label: 'Belanja Bahan Makanan', group: 'kebutuhan', budget: 2400000 },
  { id: 'transport', label: 'Transportasi', group: 'kebutuhan', budget: 1200000 },
  { id: 'utilitas', label: 'Tagihan & Utilitas', group: 'kebutuhan', budget: 1180000 },
  { id: 'spp', label: 'SPP Sekolah', group: 'kebutuhan', budget: 1200000 },
  { id: 'cicilan', label: 'Cicilan Motor', group: 'kebutuhan', budget: 850000 },
  { id: 'kesehatan', label: 'Kesehatan', group: 'kebutuhan', budget: 420000 },
  { id: 'anak', label: 'Kebutuhan Anak', group: 'kebutuhan', budget: 1000000 },
  { id: 'jajan', label: 'Makan & Jajan Luar', group: 'gaya', budget: 1200000 },
  { id: 'hiburan', label: 'Hiburan & Langganan', group: 'gaya', budget: 450000 },
  { id: 'pakaian', label: 'Belanja Pakaian & Rumah', group: 'gaya', budget: 750000 },
  { id: 'sosial', label: 'Dana Sosial & Hadiah', group: 'gaya', budget: 600000 },
];

// Target tahunan yang dicicil dari pos Tabungan. Setoran bulanan = target
// tahunan dibagi 12: pajak 300.000, Lebaran 750.000, uang pangkal 500.000.
// Ketiganya berjumlah 1.550.000; sisanya masuk Dana Darurat.
export const SINKING_FUNDS = [
  { id: 'pajak', label: 'Pajak Motor & Mobil', yearly: 3600000, collected: 3300000, due: 'Des 2026' },
  { id: 'lebaran', label: 'Dana Lebaran & Mudik', yearly: 9000000, collected: 5250000, due: 'Mar 2027' },
  { id: 'sekolah', label: 'Uang Pangkal & Buku Sekolah', yearly: 6000000, collected: 4000000, due: 'Jun 2027' },
];

// Dana darurat: target 9 kali pengeluaran wajib bulanan (pos Kebutuhan
// 8.250.000 = 74.250.000), terkumpul 41.800.000 (56%).
export const EMERGENCY = { multiplier: 9, collected: 41800000 };

// Tagihan bulanan. Yang sudah lunas punya transaksi yang sama di bawah
// (field bill), jadi mencentang atau melepas centang tagihan menambah atau
// menghapus transaksi itu juga — angka tidak pernah ditulis dua kali.
export const BILLS = [
  { id: 'listrik', label: 'Listrik PLN', amount: 650000, due: '10 Nov', category: 'utilitas', paid: true },
  { id: 'air', label: 'Air PDAM', amount: 180000, due: '12 Nov', category: 'utilitas', paid: true },
  { id: 'internet', label: 'Internet', amount: 350000, due: '15 Nov', category: 'utilitas', paid: false },
  { id: 'spp-bill', label: 'SPP Sekolah', amount: 1200000, due: '5 Nov', category: 'spp', paid: true },
  { id: 'cicilan-bill', label: 'Cicilan Motor', amount: 850000, due: '20 Nov', category: 'cicilan', paid: false },
];

// Transaksi 1–15 November 2026. Jumlah per kategori WAJIB sama dengan angka
// terpakai yang dipakai dashboard (dihitung, bukan ditulis):
// Belanja 1.650.000, Transport 720.000, Utilitas 830.000, SPP 1.200.000,
// Cicilan 0, Kesehatan 250.000, Anak 640.000, Jajan 780.000,
// Hiburan 450.000, Pakaian 180.000, Sosial 50.000 — total 6.750.000.
export const TRANSACTIONS = [
  { id: 't01', day: 1, label: 'Belanja mingguan pasar', category: 'belanja', member: 'Suami', method: 'Tunai', amount: 385000 },
  { id: 't02', day: 1, label: 'Langganan streaming & musik', category: 'hiburan', member: 'Rumah', method: 'Debit', amount: 199000 },
  { id: 't03', day: 2, label: 'Makan malam keluarga', category: 'jajan', member: 'Rumah', method: 'QRIS', amount: 214000 },
  { id: 't04', day: 2, label: 'Bensin motor', category: 'transport', member: 'Suami', method: 'QRIS', amount: 52000 },
  { id: 't05', day: 3, label: 'Belanja bulanan supermarket', category: 'belanja', member: 'Istri', method: 'QRIS', amount: 642000 },
  { id: 't06', day: 3, label: 'Sayur pasar pagi', category: 'belanja', member: 'Istri', method: 'Tunai', amount: 96000 },
  { id: 't07', day: 3, label: 'Susu formula & popok', category: 'anak', member: 'Istri', method: 'QRIS', amount: 412000 },
  { id: 't08', day: 4, label: 'Buah & camilan', category: 'belanja', member: 'Istri', method: 'Tunai', amount: 52000 },
  { id: 't09', day: 4, label: 'Tol & parkir kantor', category: 'transport', member: 'Suami', method: 'QRIS', amount: 86000 },
  { id: 't10', day: 5, label: 'SPP sekolah anak', category: 'spp', member: 'Rumah', method: 'Debit', amount: 1200000, bill: 'spp-bill' },
  { id: 't11', day: 5, label: 'Sumbangan RT', category: 'sosial', member: 'Suami', method: 'Tunai', amount: 50000 },
  { id: 't12', day: 6, label: 'Bensin mobil', category: 'transport', member: 'Suami', method: 'Debit', amount: 210000 },
  { id: 't13', day: 6, label: 'Jajan kopi & roti', category: 'jajan', member: 'Suami', method: 'QRIS', amount: 96000 },
  { id: 't14', day: 7, label: 'Ojek online anak sekolah', category: 'transport', member: 'Istri', method: 'QRIS', amount: 64000 },
  { id: 't15', day: 8, label: 'Periksa gigi anak', category: 'kesehatan', member: 'Anak', method: 'QRIS', amount: 250000 },
  { id: 't16', day: 9, label: 'Makan siang di luar', category: 'jajan', member: 'Istri', method: 'QRIS', amount: 158000 },
  { id: 't17', day: 10, label: 'Belanja dapur mingguan', category: 'belanja', member: 'Istri', method: 'QRIS', amount: 287000 },
  { id: 't18', day: 10, label: 'Listrik PLN', category: 'utilitas', member: 'Rumah', method: 'Debit', amount: 650000, bill: 'listrik' },
  { id: 't19', day: 10, label: 'Kaos & celana anak', category: 'pakaian', member: 'Istri', method: 'QRIS', amount: 180000 },
  { id: 't20', day: 11, label: 'Bensin motor', category: 'transport', member: 'Suami', method: 'QRIS', amount: 48000 },
  { id: 't21', day: 11, label: 'Buku & alat tulis anak', category: 'anak', member: 'Istri', method: 'Tunai', amount: 228000 },
  { id: 't22', day: 12, label: 'Air PDAM', category: 'utilitas', member: 'Rumah', method: 'Debit', amount: 180000, bill: 'air' },
  { id: 't23', day: 12, label: 'Jajan anak & es krim', category: 'jajan', member: 'Anak', method: 'Tunai', amount: 74000 },
  { id: 't24', day: 13, label: 'Beras & minyak goreng', category: 'belanja', member: 'Suami', method: 'Debit', amount: 188000 },
  { id: 't25', day: 13, label: 'Tiket bioskop keluarga', category: 'hiburan', member: 'Rumah', method: 'QRIS', amount: 251000 },
  { id: 't26', day: 14, label: 'Tol & parkir', category: 'transport', member: 'Suami', method: 'QRIS', amount: 92000 },
  { id: 't27', day: 14, label: 'Makan malam akhir pekan', category: 'jajan', member: 'Rumah', method: 'Debit', amount: 238000 },
  { id: 't28', day: 15, label: 'Bensin mobil', category: 'transport', member: 'Suami', method: 'Debit', amount: 168000 },
];

// Tren bulanan pemasukan vs pengeluaran. November dihitung dari transaksi
// (spent null = isi dari state), lima bulan sebelumnya sudah tutup.
export const TREND = [
  { month: 'Jun', income: 15000000, spent: 6120000 },
  { month: 'Jul', income: 15000000, spent: 6480000 },
  { month: 'Agu', income: 15000000, spent: 6050000 },
  { month: 'Sep', income: 15000000, spent: 6710000 },
  { month: 'Okt', income: 15000000, spent: 6390000 },
  { month: 'Nov', income: 15000000, spent: null },
];

export const MEMBERS = ['Suami', 'Istri', 'Anak', 'Rumah'];
export const METHODS = ['QRIS', 'Tunai', 'Debit'];
