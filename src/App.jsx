import { useEffect, useState } from 'react';
import { api } from './api';
import { MHS } from './config';
import Beranda from './pages/Beranda';
import Petunjuk from './pages/Petunjuk';
import Pengisian from './pages/Pengisian';
import Periksa from './pages/Periksa';
import Riwayat from './pages/Riwayat';
import Hasil from './pages/Hasil';
import Status from './pages/Status';
import Progres from './pages/Progres';

const PAGES = { beranda: Beranda, petunjuk: Petunjuk, pengisian: Pengisian,
  periksa: Periksa, riwayat: Riwayat, hasil: Hasil, status: Status, progres: Progres };

// Halaman yang menampilkan tombol refresh
const BISA_REFRESH = ['beranda', 'riwayat', 'progres'];

export default function App() {
  const [view, setView] = useState({ name: 'beranda', params: {} });
  const [notif, setNotif] = useState(0);
  const [tick, setTick] = useState(0);
  const [putar, setPutar] = useState(false);

  const go = (name, params = {}) => {
    setView({ name, params });
    window.scrollTo(0, 0);
  };
  const Page = PAGES[view.name];

  const refresh = () => {
    setTick((t) => t + 1);   // memuat ulang data halaman
    setPutar(true);
    setTimeout(() => setPutar(false), 700);
  };

  // Hitung klarifikasi yang menunggu jawaban
  useEffect(() => {
    api(`/assessments?nim=${MHS.nim}`)
      .then((r) => setNotif(r.data.reduce((n, a) => n + (a.klarifikasi_menunggu || 0), 0)))
      .catch(() => {});
  }, [view, tick]);

  return (
    <div className="app">
      <header className="top">
        <b>🩺 Telehealth Self-Assessment</b>
        <div className="top-right">
          <nav>
            <button className="link" onClick={() => go('beranda')}>Beranda</button>
            <button className="link" onClick={() => go('riwayat')}>
              Riwayat{notif > 0 && <span className="dot">{notif}</span>}
            </button>
            <button className="link" onClick={() => go('progres')}>Progres</button>
          </nav>
          {BISA_REFRESH.includes(view.name) && (
            <button className="refresh" onClick={refresh} aria-label="Muat ulang data" title="Muat ulang data">
              <svg className={putar ? 'spin' : ''} viewBox="0 0 24 24" width="18" height="18"
                fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 12a8 8 0 1 1-2.6-5.9" />
                <path d="M20 4v5h-5" />
              </svg>
            </button>
          )}
        </div>
      </header>
      <main>
        <Page key={view.name + JSON.stringify(view.params) + tick} go={go} {...view.params} />
      </main>
      <footer className="note">
        Hasil self-assessment <b>bukan diagnosis</b>. Konsultasikan dengan tenaga kesehatan.
      </footer>
    </div>
  );
}