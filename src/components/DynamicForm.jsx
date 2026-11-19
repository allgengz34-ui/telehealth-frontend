export function isVisible(cond, answers) {
  if (!cond) return true;
  if (cond.any) return cond.any.some((c) => isVisible(c, answers));
  if (cond.all) return cond.all.every((c) => isVisible(c, answers));
  const v = answers[cond.question];
  const filled = v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && !v.length);
  if ('equals' in cond) return v === cond.equals;
  if ('in' in cond) return cond.in.includes(v);
  if ('includes' in cond) return Array.isArray(v) && v.includes(cond.includes);
  if ('filled' in cond) return filled === cond.filled;
  return true;
}

export const labelOf = (q) => q.pertanyaan || q.label || q.text || q.question || q.id;
const optVal = (o) => o.value ?? o.kode ?? o.id;
const optLabel = (o) => o.label ?? o.teks ?? String(optVal(o));

function opsi(q) {
  let o = q.options || q.opsi || q.pilihan || [];
  if (!o.length && q.type === 'scale' && q.min != null && q.max != null) {
    o = [];
    for (let i = q.min; i <= q.max; i++) o.push(i);
  }
  return o.map((x) => (typeof x === 'object' ? x : { value: x, label: String(x) }));
}

function Field({ q, value, onChange }) {
  const o = opsi(q);
  const today = new Date().toISOString().slice(0, 10);

  switch (q.type) {
    case 'text':
      return <input type="text" maxLength={q.max_length} value={value ?? ''}
        onChange={(e) => onChange(e.target.value)} />;
    case 'textarea':
      return <textarea rows={3} maxLength={q.max_length} value={value ?? ''}
        onChange={(e) => onChange(e.target.value)} />;
    case 'single_choice':
    case 'scale':
      return (
        <div className={q.type === 'scale' ? 'opts row' : 'opts'}>
          {o.map((x) => (
            <label key={String(optVal(x))} className="opt">
              <input type="radio" name={q.id} checked={value === optVal(x)}
                onChange={() => onChange(optVal(x))} />
              {optLabel(x)}
            </label>
          ))}
        </div>
      );
    case 'multi_choice': {
      const cur = Array.isArray(value) ? value : [];
      const isEx = (x) => x.exclusive || optVal(x) === 'tidak_ada';
      const exVals = o.filter(isEx).map(optVal);
      const toggle = (x) => {
        const v = optVal(x);
        if (cur.includes(v)) return onChange(cur.filter((i) => i !== v));
        if (isEx(x)) return onChange([v]);
        onChange([...cur.filter((i) => !exVals.includes(i)), v]);
      };
      return (
        <div className="opts">
          {o.map((x) => (
            <label key={optVal(x)} className="opt">
              <input type="checkbox" checked={cur.includes(optVal(x))}
                onChange={() => toggle(x)} />
              {optLabel(x)}
            </label>
          ))}
        </div>
      );
    }
    case 'number':
      return (
        <div className="num">
          <input type="number" step="any" min={q.min} max={q.max} value={value ?? ''}
            onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />
          {q.satuan && <span>{q.satuan}</span>}
        </div>
      );
    case 'date':
      return <input type="date" max={today} value={value ?? ''}
        onChange={(e) => onChange(e.target.value)} />;
    default:
      return <input type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
  }
}

// Menampilkan satu bagian (section) beserta pertanyaan yang visible
export default function DynamicForm({ section, answers, setAnswer, errors = {} }) {
  const qs = (section.questions || []).filter((q) => isVisible(q.show_if, answers));
  return (
    <div>
      {qs.map((q) => (
        <div key={q.id} className={`q ${errors[q.id] ? 'has-error' : ''}`}>
          <label className="ql">
            {labelOf(q)} {(q.required || q.wajib) && <span className="req">*</span>}
            {q.data_type === 'pengukuran' && <span className="tag">pengukuran</span>}
          </label>
          <Field q={q} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />
          {errors[q.id] && <div className="err">{errors[q.id]}</div>}
        </div>
      ))}
    </div>
  );
}