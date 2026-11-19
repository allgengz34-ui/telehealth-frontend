const API = 'https://telehealth.informatikaunimus.site/api';
const TOKEN = import.meta.env.VITE_API_TOKEN;

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json;
  try {
    json = await res.json();
  } catch {
    throw { status: res.status, message: 'Respons server tidak valid' };
  }
  if (!json.success) throw { status: res.status, ...json };
  return json;
}

// Mengubah string / array / object menjadi daftar teks (untuk petunjuk, dll)
export function keList(x) {
  if (!x) return [];
  if (typeof x === 'string') return [x];
  if (Array.isArray(x)) return x.flatMap(keList);
  if (typeof x === 'object') return Object.values(x).flatMap(keList);
  return [];
}

export const tgl = (t) => (t ? new Date(t).toLocaleString('id-ID') : '-');