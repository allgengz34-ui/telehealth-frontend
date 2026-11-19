import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import DynamicForm, { isVisible } from '../components/DynamicForm';

// Kosong => null (BUKAN "tidak"); pertanyaan tersembunyi dikosongkan
function buatPayload(form, answers) {
  const payload = {};
  (form.sections || []).forEach((s) =>
    (s.questions || []).forEach((q) => {
      const v = answers[q.id];
      const kosong = v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length);
      const tampil = isVisible(s.show_if, answers) && isVisible(q.show_if, answers);
      payload[q.id] = kosong || !tampil ? null : v;
    })
  );
  return payload;
}

const TEKS_AUTO = {
  menunggu: 'Menunggu Anda selesai mengetik...',
  menyimpan: 'Menyimpan...',
  tersimpan: 'Tersimpan otomatis ✓',
  gagal: 'Gagal menyimpan otomatis. Tekan "Simpan draf".',
};

export default function Pengisian({ go, id, formId, errors: errAwal }) {
  const [form, setForm] = useState(null);
  const [fid, setFid] = useState(formId);
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState(errAwal || {});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [auto, setAuto] = useState('');
  const terakhir = useRef(''); // jawaban terakhir yang sudah tersimpan di server

  useEffect(() => {
    (async () => {
      const a = (await api(`/assessments/${id}`)).data;
      const realId = formId || a.form?.id || a.form_id;
      setFid(realId);
      const f = (await api(`/forms/${realId}`)).data;
      terakhir.current = JSON.stringify(buatPayload(f, a.answers || {}));
      setForm(f);
      setAnswers(a.answers || {});
      if (errAwal && Object.keys(errAwal).length) {
        const sec = (f.sections || []).filter((s) => isVisible(s.show_if, a.answers || {}));
        const i = sec.findIndex((s) => (s.questions || []).some((q) => errAwal[q.id]));
        if (i >= 0) setStep(i);
      }
    })().catch((e) => setMsg(e.message || 'Gagal memuat'));
  }, [id]);

  // Simpan otomatis: 1,5 detik setelah jawaban berhenti berubah
  useEffect(() => {
    if (!form) return;
    const str = JSON.stringify(buatPayload(form, answers));
    if (str === terakhir.current) return;
    setAuto('menunggu');
    const t = setTimeout(async () => {
      try {
        setAuto('menyimpan');
        await api(`/assessments/${id}`, { method: 'PATCH', body: { answers: JSON.parse(str) } });
        terakhir.current = str;
        setAuto('tersimpan');
      } catch {
        setAuto('gagal');
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [answers, form]);

  if (!form) return <p>{msg || 'Memuat...'}</p>;

  const sections = (form.sections || []).filter((s) => isVisible(s.show_if, answers));
  const idx = Math.min(step, sections.length - 1);
  const sec = sections[idx];
  const terakhirBagian = idx === sections.length - 1;

  const setAnswer = (qid, v) => {
    setAnswers((a) => ({ ...a, [qid]: v }));
    setErrors((e) => ({ ...e, [qid]: undefined }));
  };

  const simpan = async () => {
    const payload = buatPayload(form, answers);
    await api(`/assessments/${id}`, { method: 'PATCH', body: { answers: payload } });
    terakhir.current = JSON.stringify(payload);
  };

  const aksi = async (tujuan) => {
    setBusy(true);
    setMsg('');
    try {
      await simpan();
      setAuto('tersimpan');
      if (tujuan === 'draf') setMsg('✅ Draf tersimpan.');
      else if (tujuan === 'lanjut') { setStep(idx + 1); window.scrollTo(0, 0); }
      else if (tujuan === 'mundur') { setStep(idx - 1); window.scrollTo(0, 0); }
      else go('periksa', { id, formId: fid });
    } catch (e) {
      if (e.errors) setErrors(e.errors);
      setMsg(e.message || 'Gagal menyimpan');
    }
    setBusy(false);
  };

  return (
    <div>
      <h2>{form.judul}</h2>
      <p className="step">
        Bagian {idx + 1} dari {sections.length}: <b>{sec.judul || sec.title || sec.nama || sec.label}</b>
      </p>
      <div className="bar"><div style={{ width: `${((idx + 1) / sections.length) * 100}%` }} /></div>
      <div className={`auto ${auto === 'tersimpan' ? 'ok' : auto === 'gagal' ? 'bad' : ''}`}>
        {TEKS_AUTO[auto] || ''}
      </div>

      <DynamicForm section={sec} answers={answers} setAnswer={setAnswer} errors={errors} />

      {msg && <div className="note2">{msg}</div>}

      <div className="actions">
        {idx > 0 && <button className="sec" disabled={busy} onClick={() => aksi('mundur')}>← Sebelumnya</button>}
        <button className="sec" disabled={busy} onClick={() => aksi('draf')}>Simpan draf</button>
        {terakhirBagian
          ? <button disabled={busy} onClick={() => aksi('periksa')}>Periksa jawaban →</button>
          : <button disabled={busy} onClick={() => aksi('lanjut')}>Lanjut →</button>}
      </div>
    </div>
  );
}