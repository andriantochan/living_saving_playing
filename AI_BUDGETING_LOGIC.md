# Logika Perhitungan AI Target Pengeluaran (Budget Limit)

Dokumen ini menjelaskan bagaimana fitur "Target Pengeluaran" (Budget Limit) bekerja di dalam aplikasi Living, Saving, Playing Tracker. Sistem tidak lagi menggunakan angka mati (hardcoded), melainkan menggunakan kalkulasi berbasis riwayat **Historical Average Smoothing**.

Berikut adalah alur kerja (algoritma) perhitungan tersebut:

## 1. Filter Kategori (Fokus pada "Beban" Nyata)
Sistem pertama-tama mengeliminasi transaksi yang masuk ke dalam kategori `Income` (Pendapatan/Pemasukan) dan `Saving` (Tabungan/Investasi). 
Kedua kategori ini bukan merupakan pengeluaran yang mengurangi "jatah hidup/foya-foya" harian. Oleh karena itu, target AI **murni hanya mengambil data pengeluaran dari kategori `Living` (Kebutuhan Hidup) dan `Playing` (Keinginan/Hiburan)**.

## 2. Pengelompokan Data per Bulan Historis
Seluruh riwayat pengeluaran `Living` dan `Playing` yang lolos filter pada tahap pertama kemudian dikelompokkan ke dalam "keranjang-keranjang" bulanan (contoh: Total Pengeluaran Januari, Total Pengeluaran Februari, dll) berdasarkan tanggal transaksinya.

## 3. Eksklusi "Bulan Berjalan" (Current Month)
Sistem dengan cerdas **mengabaikan seluruh transaksi yang terjadi di bulan yang sedang berjalan** (bulan saat ini). 
**Alasannya:** Jika pengguna baru menghabiskan Rp 1.000.000 di awal bulan (misal tanggal 5), sistem tidak boleh tertipu dan menganggap bahwa gaya hidup pengguna hanya menghabiskan Rp 1.000.000 sebulan. Oleh karena itu, AI **selalu dan hanya berkaca pada bulan-bulan historis yang siklusnya sudah selesai secara penuh (tutup buku)**.

## 4. Perhitungan Ekuilibrium (Nilai Rata-Rata / Average)
Setelah mendapatkan total akumulasi (sum) pengeluaran historis untuk setiap bulan yang telah berlalu, sistem akan menghitung nilai rata-rata (average) dari seluruh bulan tersebut.
**Rumus Matematika Kasar:** `(Total Pengeluaran Bulan 1 + Total Bulan 2 + ... + Total Bulan Ke-N) / Jumlah Bulan Ke-N`.
Nilai rata-rata inilah yang disepakati sistem sebagai **Cerminan Gaya Hidup Realistis** dari pengguna. Angka ini kemudian ditetapkan menjadi "Budget Limit" atau "✨ AI Target" untuk bulan berjalan.

## 5. Fallback Pelindung Pengguna Baru (Cold Start)
Jika seorang pengguna baru saja mendaftar dan belum memiliki riwayat rekaman transaksi di bulan-bulan sebelumnya untuk dianalisis oleh sistem, AI akan menghadapi situasi kekurangan data (*cold start*). 
Sebagai solusinya, sistem akan menetapkan angka aman sebesar **Rp 5.000.000** sebagai *baseline* (patokan awal) sementara. Pada bulan berikutnya, ketika pengguna sudah memiliki riwayat 1 bulan terdaftar yang sah, sistem akan otomatis beralih menggunakan kalkulasi berdasarkan data nyata tersebut.

---
*Dirancang khusus untuk mendukung akurasi pencatatan dan psikologi penganggaran pribadi yang lebih realistis dan dapat dicapai (attainable).*
