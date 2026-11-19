import { useEffect, useState } from 'react';
import { api, tgl } from '../api';
import { MHS } from '../config';
import StatusBadge from '../components/StatusBadge';

// Aturan tiap filter berdasarkan kode status dari API
const FILTER = [
  { key: 'semua', label: 'Semua', cocok: () => true },
  { key: 'draf', label: 'Draf', cocok: (a) => a.status_pengiriman.kode === 'draft' },
  {
    key: 'diproses', label: 'Diproses',
    cocok: (a) => ['menunggu_peninjauan', 'sedang_ditinjau', 'klarifikasi_dijawab']
      .includes(a.status_peninjauan.kode),
  },
  { key: 'klarifikasi', label: 'Perlu klarifikasi', cocok: (a) => a.status_peninjauan.kode === 'perlu_klarifikasi' },
  { key: 'selesai', label: 'Sudah ditinjau', cocok: (a) => a.status_peninjauan.kode === 'sudah_ditinjau' },
];

export default function Riwayat({ go }) {
  const [list, setList] = useState(null);
  const [err, setErr] = useState('');
  const [hapusId, setHapusId] = useState('');
  const [filter, setFilter] = useState('semua');

  useEffect(() => {
    api(`/assessments?nim=${MHS.nim}`)
      .then((r) => setList(r.data))
      .catch((e) => setErr(e.message));
  }, []);

  const hapus = async (a) => {
    const nama = a.judul || a.form?.judul || a.id;
    if (!window.confirm(`Hapus draf "${nama}"?\nDraf yang dihapus tidak bisa dikembalikan.`)) return;

    setHapusId(a.id);
    setErr('');
    try {
      await api(`/assessments/${a.id}`, { method: 'DELETE' });
      setList((l) => l.filter((x) => x.id !== a.id));
    } catch (e) {
      setErr(e.status === 409
        ? 'Laporan yang sudah dikirim tidak dapat dihapus.'
        : e.message || 'Gagal menghapus draf');
    }
    setHapusId('');
  };

  if (!list) return <p>{err || 'Memuat...'}</p>;

  const aktif = FILTER.find((f) => f.key === filter);
  const tampil = list.filter(aktif.cocok);

  return (
    <div>
      <h2>Riwayat pengisian</h2>

      <div className="chips">
        {FILTER.map((f) => (
          <button
            key={f.key}
            className={`chip ${filter === f.key ? 'on' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label} <span className="n">{list.filter(f.cocok).length}</span>
          </button>
        ))}
      </div>

      {err && <div className="err">{err}</div>}
      {tampil.length === 0 && (
        <p>{list.length === 0 ? 'Belum ada pengisian.' : 'Tidak ada data pada filter ini.'}</p>
      )}

      {tampil.map((a) => {
        const draf = a.status_pengiriman.kode === 'draft';
        const belumLengkap = draf && a.status_kelengkapan && a.status_kelengkapan !== 'lengkap';
        return (
          <div className="card" key={a.id}>
            <b>{a.judul || a.form?.judul}</b> <small>({a.id})</small>
            <div><small>{a.form?.judul} · dibuat {tgl(a.dibuat_pada)}</small></div>
            <div>
              <StatusBadge status={a.status_pengiriman} />
              <StatusBadge status={a.status_peninjauan} />
              {belumLengkap && <span className="badge orange">Belum lengkap</span>}
              {a.klarifikasi_menunggu > 0 && (
                <span className="tag red">{a.klarifikasi_menunggu} klarifikasi</span>
              )}
            </div>
            <div className="actions">
              {draf ? (
                <>
                  <button onClick={() => go('pengisian', { id: a.id, formId: a.form?.id })}>
                    Lanjutkan pengisian
                  </button>
                  <button className="danger" disabled={hapusId === a.id} onClick={() => hapus(a)}>
                    {hapusId === a.id ? 'Menghapus...' : 'Hapus draf'}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => go('hasil', { id: a.id })}>Hasil</button>
                  <button className="sec" onClick={() => go('status', { id: a.id })}>Status</button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}