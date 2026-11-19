import { useEffect, useState } from 'react';
import { api, keList } from '../api';

export default function Hasil({ go, id }) {
  const [h, setH] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api(`/assessments/${id}/hasil`)
      .then((r) => setH(r.data.hasil || r.data))
      .catch((e) => setErr(e.message));
  }, [id]);

  if (!h) return <p>{err || 'Memuat...'}</p>;
  const k = h.kelengkapan;
  const p = h.perubahan;

  return (
    <div>
      <h2>Hasil assessment</h2>
      <h3>{h.judul}</h3>

      {h.skor && (
        <div className="card ok">
          <div className="skor">{h.skor.total} <small>/ {h.skor.maks}</small></div>
          <b>Kategori: {h.skor.kategori?.label}</b> ({h.skor.kategori?.rentang})
          <p>{h.skor.keterangan}</p>
        </div>
      )}

      {k && (
        <div className="card">
          <b>Kelengkapan: {k.label} ({k.persen}%)</b>
          <div>Pertanyaan wajib terisi: {k.wajib_terisi} dari {k.wajib_total}</div>
        </div>
      )}

      <div className="card">
        <b>Ringkasan jawaban</b>
        <table>
          <tbody>
            {(h.ringkasan || []).map((r) => (
              <tr key={r.question_id}>
                <td>{r.pertanyaan || r.label}
                  {r.data_type === 'pengukuran' && <span className="tag">pengukuran</span>}</td>
                <td className={r.terisi ? '' : 'kosong'}>
                  {r.jawaban_teks}{r.satuan ? ` ${r.satuan}` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {p && p.perubahan?.length > 0 && (
        <div className="card">
          <b>Perubahan dibanding pengisian sebelumnya ({p.pembanding_id})</b>
          {p.skor && <p>Skor: {p.skor.sebelumnya} → {p.skor.sekarang} ({p.skor.selisih > 0 ? '+' : ''}{p.skor.selisih})</p>}
          <ul>
            {p.perubahan.map((c, i) => (
              <li key={i}>{c.label}: {c.sebelumnya} → <b>{c.sekarang}</b></li>
            ))}
          </ul>
        </div>
      )}

      <div className="card warn">
        <b>Keterbatasan hasil</b>
        {keList(h.keterbatasan).map((t, i) => <p key={i}>{t}</p>)}
        <b>Langkah berikutnya</b>
        {keList(h.langkah_berikutnya).map((t, i) => <p key={i}>{t}</p>)}
      </div>

      <div className="actions">
        <button onClick={() => go('status', { id })}>Lihat status</button>
        <button className="sec" onClick={() => go('riwayat')}>Riwayat</button>
      </div>
    </div>
  );
}