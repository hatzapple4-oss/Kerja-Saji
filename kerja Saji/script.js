const $ = s => document.querySelector(s);
const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Daftar wilayah resmi (pemilik usaha dan pelamar memilih dari daftar ini, bukan mengetik bebas)
// Koordinat = titik pusat kota, jadi jarak yang ditampilkan hanya perkiraan
const WIL = {
  Jakarta:[-6.2088,106.8456], Bogor:[-6.5950,106.8166], Depok:[-6.4025,106.7942], Tangerang:[-6.1783,106.6319], Bekasi:[-6.2383,106.9756],
  Bandung:[-6.9175,107.6191], Cirebon:[-6.7063,108.5570], Semarang:[-6.9667,110.4167], Kudus:[-6.8048,110.8405], Jepara:[-6.5890,110.6680],
  Pati:[-6.7559,111.0380], Demak:[-6.8909,110.6384], Surakarta:[-7.5755,110.8243], Yogyakarta:[-7.7956,110.3695], Surabaya:[-7.2575,112.7521],
  Malang:[-7.9666,112.6326], Denpasar:[-8.6705,115.2126], Medan:[3.5952,98.6722], Palembang:[-2.9761,104.7754], Makassar:[-5.1477,119.4327], Balikpapan:[-1.2379,116.8529]
};
const jarak = (a, b) => { // rumus haversine, hasil km
  const r = x => x * Math.PI / 180, dLa = r(b[0] - a[0]), dLo = r(b[1] - a[1]);
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(dLo / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};
document.querySelectorAll('.selW').forEach(s => s.innerHTML = Object.keys(WIL).sort().map(w => `<option>${w}</option>`).join(''));

// DATA CONTOH untuk demo. Setelah pemilik usaha mendaftar, data ini tidak dipakai lagi
const JOBS = [
  { id:1, foto:'img/barista.jpg', judul:'Barista', tipe:'Shift pagi–siang', gaji:'Rp2,8–3,5 juta',
    tugas:['Meracik kopi dan minuman','Menjaga kebersihan bar','Melayani pelanggan'],
    syarat:['Minimal SMA/SMK','Pengalaman barista menjadi nilai tambah','Bersedia kerja akhir pekan'] },
  { id:2, foto:'img/koki.jpg', judul:'Koki Pembantu', tipe:'Penuh waktu', gaji:'Rp3,0–3,8 juta',
    tugas:['Menyiapkan bahan dan bumbu','Memasak menu harian','Menjaga standar kebersihan dapur'],
    syarat:['Bisa memasak masakan Jawa','Tahan kerja saat jam ramai','Jujur dan disiplin'] },
  { id:3, foto:'img/pelayan.jpg', judul:'Pelayan dan Kasir', tipe:'Shift sore–malam', gaji:'Rp2,5–3,2 juta',
    tugas:['Mencatat dan mengantar pesanan','Mengoperasikan kasir','Merapikan meja'],
    syarat:['Ramah dan cekatan','Mampu berhitung dasar','Domisili dekat lokasi'] }
];
const COMPANIES = {
  1:{ usaha:'Kopi Joglo Rasa', jenis:'Kafe', wilayah:'Kudus', alamat:'Jl. Sunan Muria No. 12, Kudus', karyawan:8, jam:'08.00–22.00', kontak:'0812-3456-7890',
      tentang:'Kafe bernuansa rumah joglo dengan menu kopi susu dan kudapan khas Kudus.', fasilitas:'Makan siang, Seragam, Bonus akhir tahun' },
  2:{ usaha:'Dapur Bu Tini', jenis:'Warung makan', wilayah:'Kudus', alamat:'Jl. Ahmad Yani No. 45, Kudus', karyawan:12, jam:'06.00–17.00', kontak:'0813-1111-2222',
      tentang:'Warung masakan rumahan yang terkenal dengan soto kudus dan pindang serani.', fasilitas:'Makan 2 kali, Uang lembur, Libur mingguan' },
  3:{ usaha:'Bakmi Pak Hadi', jenis:'Restoran', wilayah:'Jepara', alamat:'Jl. Diponegoro No. 8, Jepara', karyawan:6, jam:'16.00–23.00', kontak:'0857-9999-0000',
      tentang:'Kedai bakmi jawa dengan pelanggan setia di pusat kota.', fasilitas:'Makan malam, Uang transport, Bonus ramai' }
};
const seed = () => JOBS.map(j => ({ ...j, terisi:true }));
// Slot lowongan kosong untuk pemilik usaha: tidak ada isi otomatis, semua diisi sendiri
const blank = () => JOBS.map(j => ({ id:j.id, foto:j.foto, judul:'', tipe:'', gaji:'', tugas:[], syarat:[], terisi:false }));

const bg = u => `background-image:url('${u}'),linear-gradient(135deg,#12403c,#f2b431)`;
const ava = (f, nama, cls = '') => f
  ? `<div class="ava ${cls}" style="background-image:url('${f}')"></div>`
  : `<div class="ava ${cls}">${esc((nama || '?')[0].toUpperCase())}</div>`;

let S = JSON.parse(localStorage.getItem('kerjaSaji') || '{"user":null,"apps":[],"chats":{}}');
S.jobs ||= seed();
const save = () => localStorage.setItem('kerjaSaji', JSON.stringify(S));
const co = j => S.company || COMPANIES[j.id];
const fas = j => (co(j).fasilitas || '').split(',').map(x => x.trim()).filter(Boolean);
const lines = t => t.split('\n').map(x => x.trim()).filter(Boolean);
const daftar = a => a.length ? `<ul>${a.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="meta">Belum diisi.</p>';
const jarakTxt = km => km === null ? '' : km <= 5 ? 'Di wilayahmu' : `± ${Math.round(km)} km`;
let fotoData = '', role = null, stack = [], chatKey = null, chatAs = null, ref = null;

function show(id, push = true) {
  const cur = document.querySelector('.view:not([hidden])');
  if (push && cur) stack.push(cur.id);
  document.querySelectorAll('.view').forEach(v => v.hidden = v.id !== id);
  $('#btnBack').hidden = !stack.length || id === 'v-home';
  $('#btnOut').hidden = !S.user;
  window.scrollTo(0, 0);
}
function back() { const p = stack.pop(); if (p === 'v-home') home(); else if (p) show(p, false); }

// 1. Pilih peran
document.querySelectorAll('.role').forEach(b => b.onclick = () => {
  role = b.dataset.role;
  $('#formTitle').textContent = role === 'pelamar' ? 'Isi data dirimu (CV singkat)' : 'Isi data usahamu';
  $('#fotoLabel').textContent = role === 'pelamar' ? 'Foto profil' : 'Logo atau foto usaha';
  fotoData = ''; $('#foto').value = ''; $('#fotoPrev').style.backgroundImage = ''; $('#fotoPrev').textContent = '+';
  $('.g-pelamar').hidden = role !== 'pelamar';
  $('.g-perusahaan').hidden = role !== 'perusahaan';
  document.querySelectorAll('.grp').forEach(g => g.querySelectorAll('input,select,textarea').forEach(i => i.disabled = g.hidden));
  show('v-form');
});

// Foto: dikecilkan dulu agar muat di localStorage
$('#foto').onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    const im = new Image();
    im.onload = () => {
      const k = 240 / Math.min(im.width, im.height), c = document.createElement('canvas');
      c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      fotoData = c.toDataURL('image/jpeg', .8);
      $('#fotoPrev').style.backgroundImage = `url('${fotoData}')`; $('#fotoPrev').textContent = '';
    };
    im.src = r.result;
  };
  r.readAsDataURL(f);
};

// 2. Simpan data pengguna
$('#form').onsubmit = e => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target));
  S.user = { role, ...d, foto: fotoData };
  if (role === 'perusahaan') {
    // data lowongan dikosongkan hanya untuk usaha baru, bukan saat usaha yang sama masuk lagi
    if (!S.company || S.company.usaha !== S.user.usaha) S.jobs = blank();
    S.company = S.user;
  }
  ref = null; save(); stack = []; home();
};

// 3. Beranda
function home() {
  const u = S.user, p = u.role === 'pelamar';
  $('#profile').innerHTML = p
    ? `<div class="prof-row">${ava(u.foto, u.nama)}<div><h3>${esc(u.nama)}</h3></div></div><p>${esc(u.pendidikan)} · ${esc(u.wilayah || '')} · WA ${esc(u.kontak)}</p><p>${esc(u.pengalaman || 'Belum ada pengalaman dicantumkan')}</p>
       <div class="tags">${(u.keahlian || '').split(',').filter(x => x.trim()).map(k => `<span class="tag">${esc(k.trim())}</span>`).join('')}</div>`
    : `<div class="prof-row">${ava(u.foto, u.usaha)}<div><h3>${esc(u.usaha)}</h3></div></div><p>${esc(u.jenis)} · ${esc(u.wilayah || '')} · ${esc(u.alamat)}</p><p>${esc(u.karyawan)} karyawan · ${esc(u.kontak || '')}</p><p>${esc(u.tentang)}</p>`;
  $('#homeTitle').textContent = p ? 'Lowongan di sekitarmu' : 'Lowongan usahamu';
  $('#filter').hidden = !p;
  if (p && !ref) { $('#fWil').value = WIL[u.wilayah] ? u.wilayah : 'Kudus'; ref = WIL[$('#fWil').value]; }
  renderJobs(); show('v-home', false);
}
function renderJobs() {
  const u = S.user, p = u.role === 'pelamar', rad = +$('#fRad').value;
  let list = S.jobs.map(j => { const c = co(j), pt = WIL[c.wilayah]; return { j, c, km: p && ref && pt ? jarak(ref, pt) : null }; });
  if (p) {  // pelamar hanya melihat lowongan yang sudah diisi lengkap oleh pemilik usaha
    list = list.filter(x => x.j.terisi);
    if (rad) list = list.filter(x => x.km !== null && x.km <= rad);
    list.sort((a, b) => (a.km ?? 1e9) - (b.km ?? 1e9));
  }
  $('#homeNote').textContent = p ? (S.company ? 'Jarak dihitung dari pusat wilayah, bukan dari alamat tepat.' : 'Menampilkan data contoh untuk demo. Lowongan asli muncul setelah pemilik usaha mengisinya.') : '';
  $('#jobs').innerHTML = list.length ? list.map(({ j, c, km }) => {
    const n = S.apps.filter(a => a.jobId === j.id).length;
    return `<button class="job" data-id="${j.id}"><span class="thumb" style="${bg(j.foto)}"></span><span>
      <b>${esc(j.judul || 'Lowongan ' + j.id + ' (belum diisi)')}</b>
      <small>${esc(c.usaha)} · ${esc(c.wilayah || '-')}${p && km !== null ? ' · ' + jarakTxt(km) : ''}</small>
      ${p ? `<span class="tags">${fas(j).slice(0, 3).map(f => `<span class="tag">${esc(f)}</span>`).join('')}</span>`
          : `<small>Gaji ${esc(j.gaji || '-')} · ${n} pelamar</small>${j.terisi ? '' : '<span class="tags"><span class="tag warn">Belum lengkap, belum tampil ke pelamar</span></span>'}`}
      </span></button>`;
  }).join('') : `<p class="meta">${p ? 'Belum ada lowongan pada jarak ini. Coba perluas jarak atau pilih wilayah lain.' : ''}</p>`;
  document.querySelectorAll('.job').forEach(b => b.onclick = () => detail(+b.dataset.id));
}
$('#fWil').onchange = () => { ref = WIL[$('#fWil').value]; renderJobs(); };
$('#fRad').onchange = renderJobs;
$('#btnGps').onclick = () => {
  if (!navigator.geolocation) return alert('Perangkat ini tidak mendukung lokasi.');
  navigator.geolocation.getCurrentPosition(
    p => { ref = [p.coords.latitude, p.coords.longitude]; renderJobs(); },
    () => alert('Izin lokasi ditolak. Pilih wilayahmu secara manual.'));
};

// 4. Keterangan loker
function detail(id, push = true) {
  const j = S.jobs.find(x => x.id === id), u = S.user, p = u.role === 'pelamar', c = co(j);
  let html = `<div class="banner" style="${bg(j.foto)}"></div><h2>${esc(j.judul || 'Lowongan belum diisi')}</h2>
    <p class="meta">${esc(c.usaha)} · ${esc(c.wilayah || '-')}${j.tipe ? ' · ' + esc(j.tipe) : ''}${p ? '' : ' · Gaji ' + esc(j.gaji || '-')}</p>
    <div class="box"><h3>Jobdesk</h3>${daftar(j.tugas)}</div><div class="box"><h3>Persyaratan</h3>${daftar(j.syarat)}</div>`;
  if (p) {
    const pt = WIL[c.wilayah], km = ref && pt ? jarak(ref, pt) : null;
    const maps = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(c.alamat + ' ' + c.usaha);
    html += `<div class="box"><h3>Yang kamu dapatkan</h3><div class="tags">${fas(j).map(f => `<span class="tag">${esc(f)}</span>`).join('')}</div>
      <p class="meta">Rincian gaji dibicarakan lewat chat setelah kamu melamar.</p></div>
      <div class="box tempat"><h3>Tentang tempat kerja</h3>
      <div class="prof-row">${ava(c.foto, c.usaha)}<div><b>${esc(c.usaha)}</b><div class="meta">${esc(c.jenis)} · ${esc(c.karyawan)} karyawan</div></div></div>
      <p>${esc(c.tentang)}</p>
      <dl class="info"><dt>Wilayah</dt><dd>${esc(c.wilayah || '-')}${km !== null ? ' (' + jarakTxt(km) + ')' : ''}</dd><dt>Alamat</dt><dd>${esc(c.alamat)}</dd><dt>Jam operasional</dt><dd>${esc(c.jam || '-')}</dd><dt>Kontak</dt><dd>${esc(c.kontak || '-')}</dd></dl>
      <a class="link" href="${maps}" target="_blank" rel="noopener">Lihat lokasi di peta</a></div>
      <button class="primary" id="btnLamar">${S.apps.some(a => a.jobId === id && a.nama === u.nama) ? 'Buka chat' : 'Lamar sekarang'}</button>`;
  } else {
    const ap = S.apps.filter(a => a.jobId === id);
    html += `<button class="primary btn-edit" id="btnEdit">Edit lowongan</button>
      <div class="box"><h3>Pelamar masuk (${ap.length})</h3>${ap.length ? ap.map(a =>
      `<div class="pel">${ava(a.foto, a.nama)}<div style="flex:1"><b>${esc(a.nama)}</b><small>${esc(a.pendidikan)} · ${esc(a.keahlian || '-')}<br>${esc(a.pengalaman || '')} · WA ${esc(a.kontak)}</small></div>
       <button data-i="${S.apps.indexOf(a)}">Chat</button></div>`).join('') : '<p class="meta">Belum ada pelamar.</p>'}</div>`;
  }
  $('#v-detail').innerHTML = html;
  show('v-detail', push);
  if (p) $('#btnLamar').onclick = () => {
    const key = id + ':' + u.nama;
    if (!S.apps.some(a => a.jobId === id && a.nama === u.nama)) {
      S.apps.push({ jobId:id, nama:u.nama, kontak:u.kontak, pendidikan:u.pendidikan, pengalaman:u.pengalaman, keahlian:u.keahlian, foto:u.foto });
      S.chats[key] ||= []; save();   // tanpa pesan otomatis
    }
    openChat(key, `Chat dengan ${c.usaha}`, 'pelamar');
  };
  else {
    $('#btnEdit').onclick = () => openEdit(id);
    document.querySelectorAll('.pel button').forEach(b => b.onclick = () => {
      const a = S.apps[+b.dataset.i];
      openChat(a.jobId + ':' + a.nama, `Chat dengan ${a.nama}`, 'usaha');
    });
  }
}

// Edit lowongan (pemilik usaha)
let editId = null;
function openEdit(id) {
  const j = S.jobs.find(x => x.id === id), f = $('#editForm'); editId = id;
  f.judul.value = j.judul; f.tipe.value = j.tipe; f.gaji.value = j.gaji;
  f.tugas.value = j.tugas.join('\n'); f.syarat.value = j.syarat.join('\n');
  show('v-edit');
}
$('#editForm').onsubmit = e => {
  e.preventDefault();
  const f = e.target, j = S.jobs.find(x => x.id === editId);
  j.judul = f.judul.value.trim(); j.tipe = f.tipe.value.trim(); j.gaji = f.gaji.value.trim();
  j.tugas = lines(f.tugas.value); j.syarat = lines(f.syarat.value);
  j.terisi = !!(j.judul && j.tipe && j.gaji && j.tugas.length && j.syarat.length);
  save(); stack.pop(); detail(editId, false);
};

// 5. Chat (tanpa balasan otomatis: semua pesan ditulis langsung oleh pengguna)
function openChat(key, title, as) {
  chatKey = key; chatAs = as;
  $('#chatTitle').textContent = title;
  renderMsgs(); show('v-chat');
}
function renderMsgs() {
  const list = S.chats[chatKey] || [];
  $('#msgs').innerHTML = list.length
    ? list.map(m => `<div class="m ${m.from === chatAs ? 'me' : ''}">${esc(m.text)}</div>`).join('')
    : `<p class="empty">Belum ada pesan. ${chatAs === 'pelamar' ? 'Mulai dengan memperkenalkan dirimu.' : 'Mulai percakapan dengan pelamar.'}</p>`;
  $('#msgs').scrollTop = 1e6;
}
$('#chatForm').onsubmit = e => {
  e.preventDefault();
  const t = $('#chatInput').value.trim(); if (!t) return;
  (S.chats[chatKey] ||= []).push({ from: chatAs, text: t });
  $('#chatInput').value = ''; save(); renderMsgs();
};

$('#btnBack').onclick = back;
$('#btnOut').onclick = () => { S.user = null; ref = null; save(); stack = []; show('v-start', false); };
if (S.user) home(); else show('v-start', false);