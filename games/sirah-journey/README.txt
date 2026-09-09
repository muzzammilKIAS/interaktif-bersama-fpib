SIRAH JOURNEY CHALLENGE — v1.2.0
رِحْلَةُ السِّيرَة

GAME BOOTH
• 1–6 peserta bermain sebagai satu pasukan. Nama kumpulan pilihan.
• Tepat 10 checkpoint atau maksimum 240 saat, yang mana dahulu.
• Bank 52 soalan: Peristiwa 12, Tokoh 10, Tempat 8, Susun Peristiwa 8,
  Nilai & Ibrah 8, Mystery 6.
• Dua pusingan merentasi 5 kategori utama (2 soalan setiap kategori); setiap
  pusingan kira-kira 34% menggantikan satu checkpoint Peristiwa/Tokoh/Tempat
  dengan Mystery (0–2 Mystery setiap sesi).
• Set sentiasa mengandungi dua timeline dan dua Nilai & Ibrah.
• Soalan, pilihan jawapan dan kad timeline diacak; tiada ID atau topic
  berulang dalam sesi. Timeline berlainan mungkin berkongsi peristiwa.
• Peta ialah laluan pembelajaran simbolik, bukan peta sejarah berskala.
• Tiada imej manusia atau gambaran para nabi.

MULA
Lihat START_HERE.txt. Python 3 diperlukan untuk pelancar tempatan;
JavaScript game tidak memerlukan npm, pip, build, internet atau API.
Pelancar menjalankan serve.py pada loopback sahaja dan membuka pelayar.
Fail start-local.command mungkin perlu dibuka melalui Terminal:
  bash start-local.command
Jika diperlukan untuk double-click pada Mac:
  chmod +x start-local.command

MANUAL
Buka Terminal di folder index.html:
  python3 -m http.server 8080
Windows:
  py -3 -m http.server 8080
Buka http://localhost:8080
Jangan buka index.html melalui file:// untuk pemasangan PWA.
Port sibuk: hentikan server sebelumnya; jangan jalankan dua pelancar serentak.

CARA BERMAIN
Pilih 1–6 peserta > Mula Cabaran > bincang > sentuh jawapan bersama.
Timeline: sentuh peristiwa awal dahulu, kemudian kedua, kemudian ketiga.
Nombor pada kad menunjukkan urutan pilihan. Sentuh semula untuk membuang
pilihan atau gunakan Susun Semula. Tekan Semak Susunan untuk menghantar.
Jawapan terkunci sebaik dihantar: sentuhan berganda tidak menambah skor.
Jawapan salah dan penerangan satu ayat dipaparkan serta-merta.
Tekan Checkpoint Seterusnya selepas membaca. Maklum balas soalan terakhir
beralih ke keputusan selepas 2.6 saat, atau terus melalui Lihat Keputusan.
Timer berjalan semasa maklum balas dan ketika tab berada di latar belakang.
Pada tamat masa, baki cabaran dikira tidak betul untuk ketepatan daripada 10.
Kumpulan Baru mengosongkan nama dan kembali kepada 1 peserta.
Main Lagi mengekalkan nama/bilangan peserta dengan set soalan baharu.

SKOR
Betul biasa: 100. Timeline: 120. Mystery: 150.
Bonus 25 jika jawapan betul dihantar dalam 10 saat, termasuk susunan timeline.
Salah / Skip / Show Answer: 0; tidak layak menerima bonus.
Skor maksimum set biasa: 1290. Satu Mystery: 1340. Dua Mystery: 1390.
Jumlah maksimum set sebenar dipaparkan pada keputusan.
Leaderboard mengikut mata mentah; set Mystery memberi peluang 50 mata tambahan.
Ia sesuai untuk cabaran santai booth, bukan ranking pertandingan setara.
Jika mahu pertandingan setara, buang pemilihan Mystery dalam selectQuestions()
atau gunakan set tetap dan samakan mata bagi semua kumpulan.
10 betul = Sirah Champion; 8–9 = Excellent; 4–7 = Good; 0–3 = Good Try.
Ketepatan = bilangan betul / 10, termasuk sesi yang tamat masa.

MOD HOST
Tekan Mod Host untuk membuka kawalan dan mengaktifkan keyboard shortcuts.
N = NEXT: bergerak hanya selepas checkpoint dijawab/dibuka/dilangkau.
S = SKIP: tunjuk jawapan, catat 0 mata; tekan Next untuk teruskan.
A = SHOW ANSWER: buka jawapan, catat 0 mata; tiada peluang menjawab semula.
R = RESET: batalkan sesi semasa dan pulang ke skrin mula serta-merta.
Reset sesi tidak memasukkan sesi yang dibatalkan ke leaderboard.
Shortcuts tidak aktif semasa menaip nama, apabila dialog dibuka, atau Mod Host tutup.
Padam Leaderboard meminta pengesahan sebelum memadam rekod pada peranti ini.

LEADERBOARD DAN SIMPANAN
Top 5 menggunakan localStorage pada pelayar/peranti/asal URL yang sama.
Ranking: skor tertinggi; jika seri, masa lebih singkat dahulu.
Hari ini mengikut tarikh setempat peranti. Tarikh baharu memulakan rekod baharu.
Nama kumpulan, mata sesi terakhir, bunyi dan bilangan peserta disimpan setempat.
Muat semula semasa game membatalkan sesi aktif; tiada pemulihan game separuh jalan.
Tiada maklumat dihantar kepada server luaran.
Private browsing atau storage disekat mungkin tidak mengekalkan rekod.
Jika simpanan gagal, game masih boleh dimainkan dengan simpanan sementara.
Membersihkan site data turut memadam cache dan leaderboard.

ATTRACT MODE
Selepas 30 saat tanpa aktiviti di skrin mula/keputusan, skrin BERANI CUBA muncul.
Ia tidak mengganggu sesi aktif. Sentuh skrin, Enter atau Escape untuk kembali
ke skrin mula. Animasi menghormati tetapan prefers-reduced-motion.

PWA DAN OFFLINE
manifest.webmanifest + sw.js menyimpan SEMUA fail game penting, ikon dan
bank soalan secara tempatan. Baloo 2 (teks Melayu) dan Noto Naskh Arabic
(teks Arab) dibundel secara tempatan dalam fonts/; tiada CDN, tracking
atau online API semasa permainan.
Tunggu status “Sedia offline” selepas akses pertama melalui localhost/HTTPS.
Chrome/Edge: butang Pasang app, atau menu pelayar > Install app jika tersedia.
iOS/iPadOS: Safari > Share > Add to Home Screen.
Pemasangan sebenar bergantung pada pelayar, peranti dan polisi organisasi.
Selepas cache siap, game boleh dibuka semula dari PWA/alamat yang sama tanpa
internet, selagi cache tidak dibersihkan atau dibuang oleh sistem.
Simpan origin yang sama (localhost:8080); port baharu mempunyai rekod/cache lain.

UNTUK TELEFON/TABLET
Game responsif, tetapi localhost komputer hanya merujuk komputer itu.
Untuk peranti lain, hos fail web di HTTPS dan buka sekali pada setiap peranti.
PWA/service worker tidak aktif melalui alamat HTTP LAN biasa.
ZIP ini ialah pakej tempatan; tiada hosting awam disediakan bersama ZIP.

EDIT CODING
index.html: struktur skrin; styles.css: reka bentuk dan saiz teks.
app.js: pemilihan soalan, timer, skor, leaderboard, host dan PWA.
questions.js: bank soalan (window.SIRAH_QUESTIONS).
Setiap soalan: id, category, type, question, options, correctAnswer,
shortExplanation, points, topic.
MCQ: 4 pilihan unik; correctAnswer sepadan tepat dengan satu pilihan.
Timeline: 3 item unik; correctAnswer ialah array dalam urutan yang betul.
Gunakan ID unik dan topic sama bagi variasi fakta sama untuk mengelak ulangan.
Penjelasan: satu ayat ringkas, fakta asas yang jelas, elak riwayat dipertikaikan.
Soalan Nilai & Ibrah ialah rumusan pendidikan, bukan petikan literal hadis.

KEMAS KINI OFFLINE
Selepas edit fail, naikkan VERSION dalam sw.js (contoh 1.0.1).
Buka semula (satu refresh biasa) ketika server berjalan — cukup, tak perlu
tutup semua tab. app.js semak versi baharu setiap kali dibuka dan terus
ambil alih (skipWaiting + clients.claim); jika satu sesi permainan tengah
berjalan semasa versi baharu dikesan, ia tunggu sesi itu tamat dahulu
supaya tak terputus di tengah checkpoint.
Jangan ubah bank soalan tanpa mengemas kini versi cache.

BAHASA ARAB
Teks Arab menggunakan lang=ar dan dir=rtl pada elemen berkaitan.
Font Arab mengutamakan Lotus/Lotus Linotype jika terpasang pada sistem
(font berlesen, tiada versi web percuma — tidak dibundel); Noto Naskh
Arabic dibundel secara tempatan sebagai fallback supaya teks Arab
sentiasa terpapar dengan gaya Naskh yang kemas walau tanpa Lotus
dipasang. Fallback seterusnya: Traditional Arabic/Geeza Pro/serif.

RUJUKAN
Rujukan semakan kandungan disertakan dalam SOURCES.txt.
Keputusan semakan teknikal dan batasan ujian terdapat dalam QA_REPORT.txt.
