import { useEffect, useState } from 'react';
import { api } from '../api';
import { MHS } from '../config';
import StatusBadge from '../components/StatusBadge';

export default function Periksa({ go, id, formId }) {
  const [asm, setAsm] = useState(null);
  const [cek, setCek] = useState(null);
  const [done, setDone] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const a = (await api(`/assessments/${id}`)).data;
      setAsm(a);
      const fid = formId || a.form?.id || a.form_id;
      const v = await api(`/forms/${fid}/validate`, {
        method: 'POST',
        body: { nim: MHS.nim, answers: a.answers || {} },
      });
      setCek(v.data);
    })().catch((e) => setErr(e.message || 'Gagal memeriksa'));
  }, [id]);

  const kirim = async () => {
    setBusy(true);
    setErr('');
    try {
      const r = await api(`/assessments/${id}/submit`, { method: 'POST' });
      setDone(r);
    } catch (e) {
      if (e.status === 422 && e.errors) go('pengisian', { id, formId, errors: e.errors });
      else setErr(e.message || 'Gagal mengirim');
    }
    setBusy(false);
  };

  // ---- Konfirmasi pengiriman ----
  if (done) {
    return (
      <div className="card ok">
        <h2>✅ Formulir Anda telah diterima</h2>
        <p>{done.message}</p>
        <div>Pengiriman: <StatusBadge status={done.data.status_pengiriman} /></div>
        <div>Peninjauan: <StatusBadge status={done.data.status_peninjauan} /></div>
        <div className="actions">
          <button onClick={() => go('status', { id })}>Lihat status</button>
          <button className="sec" onClick={() => go('hasil', { id })}>Lihat hasil</button>
          <button className="sec" onClick={() => go('riwayat')}>Riwayat</button>
        </div>
      </div>
    );
  }

  if (!cek) return <p>{err || 'Memeriksa jawaban...'}</p>;

  const ringkasan = cek.hasil_pratinjau?.ringkasan || [];
  const errs = cek.errors || {};
  const adaError = Object.keys(errs).length > 0;

  return (
    <div>
      <h2>Periksa sebelum mengirim</h2>
      {cek.kelengkapan && <p>Kelengkapan: <b>{cek.kelengkapan.persen}%</b></p>}

      {adaError && (
        <div className="card bad">
          <b>Masih ada yang perlu diperbaiki:</b>
          <ul>{Object.entries(errs).map(([k, v]) => <li key={k}>{v}</li>)}</ul>
        </div>
      )}

      <div className="card">
        <b>Ringkasan jawaban</b>
        <table>
          <tbody>
            {ringkasan.map((r) => (
              <tr key={r.question_id}>
                <td>{r.pertanyaan || r.label}</td>
                <td className={r.terisi ? '' : 'kosong'}>{r.jawaban_teks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {err && <div className="err">{err}</div>}
      <div className="actions">
        <button className="sec" onClick={() => go('pengisian', { id, formId, errors: errs })}>
          ← Ubah jawaban
        </button>
        <button disabled={busy || !cek.valid} onClick={kirim}>
          {busy ? 'Mengirim...' : 'Kirim'}
        </button>
      </div>
    </div>
  );
}