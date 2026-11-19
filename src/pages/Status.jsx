import { useEffect, useState } from 'react';
import { api, tgl } from '../api';
import StatusBadge from '../components/StatusBadge';

export default function Status({ go, id }) {
  const [s, setS] = useState(null);
  const [jawab, setJawab] = useState({});
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');

  const muat = () =>
    api(`/assessments/${id}/status`).then((r) => setS(r.data)).catch((e) => setErr(e.message));
  useEffect(() => { muat(); }, [id]);

  const balas = async (cid) => {
    if (!jawab[cid]?.trim()) return setErr('Jawaban tidak boleh kosong.');
    setBusy(cid);
    setErr('');
    try {
      await api(`/assessments/${id}/clarifications/${cid}/reply`, {
        method: 'POST',
        body: { jawaban: jawab[cid] },
      });
      await muat();
    } catch (e) {
      setErr(e.errors ? Object.values(e.errors).join(', ') : e.message);
    }
    setBusy('');
  };

  if (!s) return <p>{err || 'Memuat...'}</p>;
  const tl = s.tindak_lanjut;

  return (
    <div>
      <h2>Status {id}</h2>

      <div className="card">
        <div>Status pengiriman: <StatusBadge status={s.status_pengiriman} /></div>
        <div>Status peninjauan: <StatusBadge status={s.status_peninjauan} /></div>
        <p>{s.pesan}</p>
      </div>

      {err && <div className="err">{err}</div>}

      {s.klarifikasi_menunggu?.length > 0 && (
        <div className="card bad">
          <b>Petugas meminta klarifikasi</b>
          {s.klarifikasi_menunggu.map((k) => (
            <div key={k.id} className="q">
              <div className="ql">{k.pertanyaan}</div>
              <textarea rows={2} placeholder="Tulis jawaban Anda..."
                value={jawab[k.id] || ''}
                onChange={(e) => setJawab({ ...jawab, [k.id]: e.target.value })} />
              <button disabled={busy === k.id} onClick={() => balas(k.id)}>
                {busy === k.id ? 'Mengirim...' : 'Kirim jawaban'}
              </button>
            </div>
          ))}
        </div>
      )}

      {tl && (
        <div className="card ok">
          <b>Tindak lanjut: {tl.jenis?.label}</b>
          <p>{tl.arahan}</p>
          {tl.jadwal_konsultasi && <p>📅 Jadwal konsultasi: <b>{tgl(tl.jadwal_konsultasi)}</b></p>}
          <small>Dicatat oleh {tl.dicatat_oleh?.nama} · {tgl(tl.dicatat_pada)}</small>
        </div>
      )}

      <div className="card">
        <b>Timeline</b>
        <ul className="tl">
          {(s.timeline || []).map((t, i) => (
            <li key={i}>
              <small>{tgl(t.waktu)}</small>
              <div><b>{t.event}</b> — {t.keterangan}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="actions">
        <button onClick={() => go('hasil', { id })}>Lihat hasil</button>
        <button className="sec" onClick={() => go('riwayat')}>Riwayat</button>
      </div>
    </div>
  );
}