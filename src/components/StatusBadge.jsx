const WARNA = {
  draft: 'gray', belum_dikirim: 'gray',
  terkirim: 'blue', menunggu_peninjauan: 'orange',
  sedang_ditinjau: 'blue', perlu_klarifikasi: 'red',
  klarifikasi_dijawab: 'purple', sudah_ditinjau: 'green',
};

export default function StatusBadge({ status }) {
  if (!status) return null;
  return <span className={`badge ${WARNA[status.kode] || 'gray'}`}>{status.label}</span>;
}