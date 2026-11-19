import { useEffect, useState } from 'react';
import { api } from '../api';
import { MHS } from '../config';

export default function Beranda({ go }) {
  const [me, setMe] = useState(null);
  const [forms, setForms] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      setMe((await api(`/me?nim=${MHS.nim}`)).data);
      setForms((await api('/forms')).data);
    })().catch((e) => setErr(e.message || 'Gagal memuat data'));
  }, []);

  const s = me?.statistik;
  return (
    <div>
      <h2>Beranda</h2>
      {err && <div className="err">{err}</div>}

      <div className="card">
        <small>Identitas mahasiswa</small>
        <div><b>{MHS.nama}</b> · {MHS.nim} · {MHS.kelas}</div>
      </div>

      {me && (
        <div className="card">
          <small>Profil pasien</small>
          <div><b>{me.nama}</b> · No. RM {me.no_rm}</div>
          <div className="stats">
            <div><b>{s.total}</b>Total</div>
            <div><b>{s.draf}</b>Draf</div>
            <div><b>{s.menunggu}</b>Menunggu</div>
            <div><b>{s.perlu_klarifikasi}</b>Perlu klarifikasi</div>
            <div><b>{s.sudah_ditinjau}</b>Sudah ditinjau</div>
          </div>
        </div>
      )}

      <h3>Pilih formulir</h3>
      {forms.map((f) => (
        <div className="card" key={f.id}>
          <b>{f.judul}</b>
          <div><small>{f.jenis_hasil} · ± {f.estimasi_menit} menit</small></div>
          <button onClick={() => go('petunjuk', { formId: f.id })}>Isi formulir</button>
        </div>
      ))}
    </div>
  );
}