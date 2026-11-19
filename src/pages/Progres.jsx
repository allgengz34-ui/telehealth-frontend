import { useEffect, useState } from 'react';
import { api, tgl } from '../api';
import { MHS } from '../config';

const WARNA = { belum_diperiksa: 'gray', disetujui: 'green', perlu_revisi: 'orange', ditolak: 'red' };

export default function Progres() {
const [d, setD] = useState(null);
const [list, setList] = useState([]);
const [err, setErr] = useState('');

useEffect(() => {
  Promise.all([api(`/uts/${MHS.nim}`), api(`/assessments?nim=${MHS.nim}`)])
    .then(([u, r]) => { setD(u.data); setList(r.data); })
    .catch((e) => setErr(e.message));
}, []);

  if (!d) return <p>{err || 'Memuat...'}</p>;

  const b = d.bukti_fitur || { tercapai: 0, total: 0, daftar: [] };
  const persen = b.total ? Math.round((b.tercapai / b.total) * 100) : 0;
  const nilai = d.penilaian;

  return (
    <div>
      <h2>Progres UTS</h2>

      <div className="card">
  <small>Laporan atas NIM {d.nim}</small>
  <div className="stats">
    <div><b>{list.length}</b>Total</div>
    <div><b>{list.filter((a) => a.status_pengiriman.kode === 'terkirim').length}</b>Terkirim</div>
    <div><b>{list.filter((a) => a.status_pengiriman.kode === 'draft').length}</b>Draf</div>
    <div><b>{list.filter((a) => a.status_peninjauan.kode === 'sudah_ditinjau').length}</b>Sudah ditinjau</div>
  </div>
</div>

      <div className="card">
        <b>Bukti fitur: {b.tercapai} dari {b.total}</b>
        <div className="bar" style={{ marginTop: 10 }}><div style={{ width: `${persen}%` }} /></div>
        <ul className="cek">
          {b.daftar.map((f) => (
            <li key={f.kode} className={f.tercapai ? 'ya' : 'belum'}>
              <span className="ic">{f.tercapai ? '✓' : ''}</span>
              <span>{f.label}</span>
            </li>
          ))}
        </ul>
        <small>Fitur klarifikasi dan tindak lanjut baru terdeteksi setelah dosen meninjau laporanmu.</small>
      </div>

      
    </div>
  );
}