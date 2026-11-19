import { useEffect, useState } from 'react';
import { api, keList } from '../api';
import { MHS } from '../config';

export default function Petunjuk({ go, formId }) {
  const [form, setForm] = useState(null);
  const [setuju, setSetuju] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api(`/forms/${formId}`).then((r) => setForm(r.data)).catch((e) => setErr(e.message));
  }, [formId]);

  const mulai = async () => {
    setBusy(true);
    setErr('');
    try {
      const r = await api('/assessments', {
        method: 'POST',
        body: { form_id: formId, persetujuan: true, mahasiswa: MHS, answers: {} },
      });
      go('pengisian', { id: r.data.id, formId });
    } catch (e) {
      setErr(e.message || 'Gagal memulai pengisian');
      setBusy(false);
    }
  };

  if (!form) return <p>{err || 'Memuat...'}</p>;
  return (
    <div>
      <h2>{form.judul}</h2>
      {keList(form.deskripsi || form.tujuan).map((t, i) => <p key={i}>{t}</p>)}

      <div className="card">
        <b>Petunjuk pengisian</b>
        <ul>{keList(form.petunjuk).map((t, i) => <li key={i}>{t}</li>)}</ul>
      </div>

      <div className="card">
        {keList(form.persetujuan).map((t, i) => <p key={i}>{t}</p>)}
        <label className="opt">
          <input type="checkbox" checked={setuju} onChange={(e) => setSetuju(e.target.checked)} />
          Saya telah membaca dan menyetujui.
        </label>
      </div>

      {err && <div className="err">{err}</div>}
      <button disabled={!setuju || busy} onClick={mulai}>
        {busy ? 'Memproses...' : 'Mulai'}
      </button>{' '}
      <button className="sec" onClick={() => go('beranda')}>Kembali</button>
    </div>
  );
}