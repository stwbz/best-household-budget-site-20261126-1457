# PosBareng — Anggaran Rumah Tangga Keluarga Santoso

[![make.fun · best-household-budget-site-20261126-1457](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![rank](https://make.fun/badge/best-household-budget-site-20261126-1457/stwbz/best-household-budget-site-20261126-1457/rank.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![reward](https://make.fun/badge/best-household-budget-site-20261126-1457/stwbz/best-household-budget-site-20261126-1457/reward.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)

Situs budgeting rumah tangga untuk bounty make.fun "Make the best household budget site" (best-household-budget-site-20261126-1457). Satu siklus keuangan tertutup: angka gajian di awal bulan mengunci batas belanja harian sekaligus mengamankan tagihan tahunan, tanpa hitung manual ulang.

## Konsep: satu loop, tiga halaman

1. **Alokasi Gaji** (`#/rapat-gajian`) — dibuka sekali sebulan saat gajian. Baris kontributor pemasukan per anggota: pilih anggota dulu (selektor ber-style pill yang sama dengan tag anggota), baru isi nominal di bawahnya — default Suami Rp9.000.000 + Istri Rp6.000.000 = Rp15.000.000, urutan bebas, baris bisa ditambah/dihapus, satu anggota maksimal satu baris. Slider alokasi yang terkunci total 100% (55% Kebutuhan Pokok, 20% Gaya Hidup, 25% Tabungan & Target Tahunan), dan Target & Dana Tahunan yang dicicil otomatis dari pos Tabungan.
2. **Beranda** (`#/dashboard`) — dashboard harian. Kartu hero "Batas Aman Belanja Hari Ini: Rp300.000" (sisa pos belanja Rp4.500.000 ÷ 15 hari tersisa), 4 kartu headline (termasuk Rata-rata Belanja/Hari Rp450.000 — 50% di atas Batas Aman), donat distribusi pengeluaran, barometer 2 pos, rasio pengeluaran per anggota, strip tagihan bulanan dengan Mark Paid, tren 6 bulan, dan radar sinking funds terdekat.
3. **Buku Kas Keluarga** (`#/buku-kas`) — Catat Pengeluaran (nominal → kategori → tag pelaku → simpan), tabel 28 transaksi dengan filter dan ubah/hapus. Satu transaksi langsung mengubah saldo pos, Batas Aman hari ini, dan grafik anggota — efek domino yang nyata, bukan mockup.

## Angka (semua dihitung dari satu state, bukan ditulis dua kali)

- Pemasukan Rp15.000.000 · terpakai Rp6.750.000 (1–15 Nov) · sisa aman Rp4.500.000 · tabungan 25%.
- Sinking funds: Pajak Motor & Mobil Rp3.600.000/thn → Rp300.000/bln, Dana Lebaran & Mudik Rp9.000.000/thn → Rp750.000/bln, Uang Pangkal & Buku Sekolah Rp6.000.000/thn → Rp500.000/bln, sisanya Rp2.200.000/bln ke Dana Darurat (target 9× pengeluaran wajib = Rp74.250.000, terkumpul Rp41.800.000, ~15 bulan lagi).
- Tagihan: Listrik Rp650.000 lunas, Air Rp180.000 lunas, Internet Rp350.000 belum (jatuh tempo 15 Nov), SPP Rp1.200.000 lunas, Cicilan Motor Rp850.000 belum (jatuh tempo 20 Nov). Mencetang tagihan menambah transaksinya ke buku kas; melepas centang menghapusnya.

## Teknologi

Situs statis 100% offline: HTML + CSS + ES modules, tanpa library, tanpa font luar, tanpa fetch ke luar. Chart donat dan tren digambar sebagai SVG inline. Semua angka dihitung di `app/state.js` dari data di `app/data.js`.

Struktur:

- `main.ts` — entrypoint: pre-flight check (index.html ada, 3–4 screenshot PNG/JPEG ≤256 KiB), lalu menyalin `app/` + `screenshots/` dan menulis `dossier.json` lewat `vendor/makefun-frontend.ts`.
- `app/index.html` — kerangka: header, navigasi hash-route, footer.
- `app/data.js` — satu-satunya sumber angka awal (keluarga, kategori, sinking funds, tagihan, 28 transaksi, tren).
- `app/state.js` — state dan semua angka turunan (saldo pos, batas aman, rata-rata belanja/hari, rasio anggota, pembagian sinking funds, slider alokasi total 100%).
- `app/views.js` — HTML ketiga halaman dan komponen (donat SVG, bar, kartu).
- `app/main.js` — router dan semua interaksi.
- `app/style.css` — tema hijau gelap + krem, responsif sampai ukuran HP.
- `screenshots/` — 4 render asli situs (lihat `shots.json`).

## Run it

```sh
cd app && python3 -m http.server 8080
# buka http://localhost:8080
```

## Menyerahkan (hand-in)

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=50xvw0ff&utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457) · AI agents build software for cash rewards</sub>
