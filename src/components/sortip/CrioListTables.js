// frontend/src/components/sortip/CrioListTables.js
// Sort_IPS list → Crio Embrio tab
//   Sub-tabs: TABULADOR (the two tables below) · ABIERTOS · CONCLUIDOS · GENERAL
//   (these three are one-table views, still to be defined)
//   1. Estimulación y Captura — one row per estimulación (own + received splits):
//      IP · WASH · DONOR · CAPTURE TYPE · SPLITER · TIPO · ESTIMULA · CAPTURA · OVO · STATUS
//   2. Creación Embrionaria — one row per Crio Embrio:
//      IP · BIOPSIA · FIV · DAY6 · PGTA · NI · XX · XY · PDF · STATUS
// Values come from config/sortIpSections.js → crioListRows.
// Dates: gray italic = not confirmed (✓) yet; dark = confirmed; blue = captured.
// Status of each estimulación: config/sortIpSections.js → estimListStatus.
// Each table is limited to ~10 rows high; more rows scroll vertically.

import React, { useMemo, useState } from 'react';
import CIcon from '@coreui/icons-react';
import { cilClock, cilSearch } from '@coreui/icons';
import { crioListRows, crioEnvioBiopsia, biopsiaLabel } from '../../config/sortIpSections';

const fmt = (v) => {
  const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
};
const two = (v) => (v === '' || v === null || v === undefined ? '' : String(v).padStart(2, '0'));
const hasVal = (v) => v !== '' && v !== null && v !== undefined;

const SUBTABS = [
  { id: 'tabulador', label: 'Tabulador' },
  { id: 'abiertos', label: 'Abiertos' },
  { id: 'concluidos', label: 'Concluidos' },
  { id: 'general', label: 'General' },
];
const PdfLink = ({ ip, docKey, title, onViewDoc }) => {
  if (!docKey || !ip.sections?.docs?.[docKey]?.url) return null;
  return (
    <button type="button" className="crio-list-pdf" title={`Ver ${title}`} aria-label={`Ver ${title} de ${ip.nombre_completo}`}
      onClick={(e) => { e.stopPropagation(); onViewDoc(ip, docKey, `${title} — ${ip.nombre_completo}`); }}>
      PDF
    </button>
  );
};

// Date: gray italic until it is confirmed ✓
const Fecha = ({ v, ok, strong }) => (v
  ? <span className={`crio-list-date${ok ? ' is-ok' : ''}${strong ? ' is-strong' : ''}`} title={ok ? 'Confirmada' : 'Sin confirmar'}>{fmt(v)}</span>
  : null);

const Status = ({ st }) => (
  <span className="crio-list-status" style={{ color: st.color, fontStyle: st.italic ? 'italic' : undefined }}>{st.text}</span>
);

const TableSearch = ({ id, value, onChange, label }) => (
  <div className="crio-list-search">
    <CIcon icon={cilSearch} className="crio-list-search-icon" />
    <input
      id={id} type="search" value={value} onChange={e => onChange(e.target.value)}
      placeholder="Buscar..." aria-label={`Buscar en ${label}`} autoComplete="off"
    />
  </div>
);

/**
 * ips:     IPs of this view (already filtered by the list's search)
 * allIps:  every IP (names of spliters / owners, received splits)
 */
const CrioListTables = ({ ips = [], allIps, onOpen, onViewDoc, renderName }) => {
  const all = allIps || ips;
  const [sub, setSub] = useState('tabulador');
  const [qEst, setQEst] = useState('');
  const [qCrea, setQCrea] = useState('');

  const data = useMemo(() => ips.map(ip => ({ ip, ...crioListRows(ip, all) })), [ips, all]);
  const q1 = qEst.trim().toLowerCase();
  const q2 = qCrea.trim().toLowerCase();
  const estText = (d, r) => [d.ip.nombre_completo, r.donante || 'Sin confirmar', r.captureType, r.otherName, r.e?.muestra,
    fmt(r.e?.start_estimula), fmt(r.e?.captura), r.e?.ovocitos, r.status.text, d.wash.text, fmt(d.wash.date)]
    .filter(hasVal).join(' ').toLowerCase();
  const creaText = (d, r) => [d.ip.nombre_completo, r.c && biopsiaLabel(r.c), r.c?.fecundados, fmt(r.c?.fecha_start),
    r.c?.biopsia, fmt(r.c?.fecha_final), r.c?.pgta_qtd, r.c && fmt(crioEnvioBiopsia(r.c)), r.c?.ni, r.c?.xx, r.c?.xy, d.proceso.text]
    .filter(hasVal).join(' ').toLowerCase();

  // A search keeps an IP when any of its rows matches
  const estData = data.filter(d => !q1 || d.estim.some(r => estText(d, r).includes(q1)));
  const creaData = data.filter(d => !q2 || d.crea.some(r => creaText(d, r).includes(q2)));

  const nameCell = (d, first) => (
    <td className="crio-list-name">{first ? (renderName ? renderName(d.ip) : d.ip.nombre_completo) : ''}</td>
  );
  const empty = (cols, q) => (
    <tr><td colSpan={cols} className="text-center text-muted py-4">{q ? 'Sin resultados para la búsqueda' : 'Sin IPs en esta vista'}</td></tr>
  );

  // ABIERTOS / CONCLUIDOS / GENERAL: one-table views, still to be defined
  const subLabel = SUBTABS.find(t => t.id === sub)?.label || '';
  const vistaPendiente = () => (
    <div className="crio-list-pending">
      <CIcon icon={cilClock} className="mb-2" />
      <div className="fw-bold">Vista {subLabel}</div>
      <div className="small">Esta vista (una sola tabla) se definirá más adelante. Usa <strong>Tabulador</strong> para ver Estimulación y Captura y Creación Embrionaria.</div>
    </div>
  );

  return (
    <div className="crio-list p-2">
      <div className="crio-list-head">
        <h6 className="crio-list-title is-green">Estimulación y Captura</h6>
        <div className="crio-subtabs" role="tablist" aria-label="Vista de Crio Embrio">
          {SUBTABS.map(t => (
            <button key={t.id} type="button" role="tab" aria-selected={sub === t.id}
              className={`crio-subtab${sub === t.id ? ' is-active' : ''}`} onClick={() => setSub(t.id)}>
              {t.label.toUpperCase()}
            </button>
          ))}
        </div>
        {sub === 'tabulador' && <TableSearch id="crio-search-est" value={qEst} onChange={setQEst} label="Estimulación y Captura" />}
      </div>

      {sub !== 'tabulador' ? vistaPendiente() : (
        <>
          <div className="table-responsive crio-list-scroll">
            <table className="crio-list-table is-est">
              <thead>
                <tr>
                  <th>IP</th><th className="text-center">Wash</th><th className="text-center">Donor</th>
                  <th className="text-center">Capture type</th><th className="text-center">Spliter</th><th className="text-center">Tipo</th>
                  <th className="text-center">Estimula</th><th className="text-center">Captura</th><th className="text-center">OVO</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {estData.length ? estData.flatMap(d => d.estim.map((r, i) => (
                  <tr key={`${d.ip.id}-${r.key}`} onClick={() => onOpen(d.ip.id)} className={i === 0 ? 'is-first' : ''}>
                    {nameCell(d, i === 0)}
                    <td className="text-center crio-list-small">
                      {i === 0 && (d.wash.date ? fmt(d.wash.date) : <span className={d.wash.done ? 'crio-list-wash-done' : ''}>{d.wash.text}</span>)}
                    </td>
                    <td className="text-center">{r.empty ? '' : (r.donante || <span className="crio-list-muted">Sin confirmar</span>)}</td>
                    <td className="text-center">
                      {r.empty ? '' : r.split
                        ? <button type="button" className="crio-list-split" onClick={(ev) => { ev.stopPropagation(); if (r.otherIpId) onOpen(r.otherIpId); }}
                            title={r.otherName ? `${r.received ? 'Owner' : 'Spliter'}: abrir ${r.otherName}` : 'Split'}>Split</button>
                        : <span className="crio-list-ctype">{r.captureType}</span>}
                    </td>
                    <td className="text-center fw-semibold">
                      {r.otherName && (r.received ? <span title="Owner de la estimulación">{r.otherName} <small className="text-muted">(owner)</small></span> : r.otherName)}
                    </td>
                    <td className="text-center">{r.e?.muestra || ''}</td>
                    <td className="text-center"><Fecha v={r.e?.start_estimula} ok={r.e?.start_estimula_ok} /></td>
                    <td className="text-center"><Fecha v={r.e?.captura} ok={r.e?.captura_ok} strong={r.status.key === 'capturado'} /></td>
                    <td className="text-center">
                      {r.status.key === 'capturado' ? (r.e?.ovocitos || '')
                        : (r.status.key === 'captura_estimula' ? <CIcon icon={cilClock} className="text-muted" title="Captura pendiente" /> : '')}
                    </td>
                    <td className="text-center">{!r.empty && <Status st={r.status} />}</td>
                  </tr>
                ))) : empty(10, q1)}
              </tbody>
            </table>
          </div>

          <div className="crio-list-head is-red mt-4">
            <h6 className="crio-list-title is-red">Creación Embrionaria</h6>
            <TableSearch id="crio-search-crea" value={qCrea} onChange={setQCrea} label="Creación Embrionaria" />
          </div>
          <div className="table-responsive crio-list-scroll">
            <table className="crio-list-table is-crea">
              <thead>
                <tr>
                  <th>IP</th><th className="text-center">Biopsia</th><th colSpan={2}>FIV</th><th colSpan={2}>Day6</th>
                  <th colSpan={2}>PGTA</th><th className="text-center">NI</th><th className="text-center">XX</th><th className="text-center">XY</th>
                  <th /><th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {creaData.length ? creaData.flatMap(d => d.crea.map((r, i) => {
                  const c = r.c || {};
                  return (
                    <tr key={`${d.ip.id}-${r.key}`} onClick={() => onOpen(d.ip.id)} className={i === 0 ? 'is-first' : ''}>
                      {nameCell(d, i === 0)}
                      <td className="text-center"><span className="crio-list-biopsia">{r.c ? biopsiaLabel(c) : ''}</span></td>
                      <td className="text-end crio-list-n">{c.fecundados ?? ''}</td>
                      <td><Fecha v={c.fecha_start} ok={c.fecha_start_ok} /></td>
                      <td className="text-end crio-list-n">{c.biopsia ?? ''}</td>
                      <td><Fecha v={c.fecha_final} ok={c.fecha_final_ok} /></td>
                      <td className="text-end"><span className="crio-list-num is-result">{two(c.pgta_qtd)}</span></td>
                      <td><Fecha v={r.c ? crioEnvioBiopsia(c) : ''} ok={c.envio_biopsia_ok} /></td>
                      <td className="text-center"><span className="crio-list-num is-ni">{two(c.ni)}</span></td>
                      <td className="text-center"><span className="crio-list-num is-xx">{two(c.xx)}</span></td>
                      <td className="text-center"><span className="crio-list-num is-xy">{two(c.xy)}</span></td>
                      <td className="text-center">
                        {r.c && <PdfLink ip={d.ip} docKey={`crio_${c.id}_resultado`} title="Resultado PGTA" onViewDoc={onViewDoc} />}
                      </td>
                      <td className="text-center">{i === 0 && <Status st={d.proceso} />}</td>
                    </tr>
                  );
                })) : empty(13, q2)}
              </tbody>
            </table>
          </div>
        </>
      )}

      <style>{`
        .crio-list-head {
          display: flex; align-items: flex-end; flex-wrap: wrap; gap: 6px 12px;
          padding-bottom: 0; border-bottom: 3px solid #8aa4c8;
        }
        .crio-list-head.is-red { padding-bottom: 6px; }
        .crio-list-title { font-weight: 800; margin: 0 0 4px; }
        .crio-list-title.is-green { color: #0f6b55; font-family: inherit; }
        .crio-list-title.is-red { color: #d0453a; font-style: italic; }
        .crio-subtabs { display: flex; gap: 4px; }
        .crio-subtab {
          border: none; background: #8aa4c8; color: #fff; font-weight: 700; font-size: .85rem;
          padding: 4px 16px; border-radius: 3px 3px 0 0; letter-spacing: .02em;
        }
        .crio-subtab:hover { background: #6f8db8; }
        .crio-subtab.is-active { background: #2e59a8; }
        .crio-subtab:focus-visible { outline: 2px solid #d97ea1; outline-offset: 1px; }
        .crio-list-search { position: relative; margin: 0 0 4px auto; width: 220px; max-width: 100%; }
        .crio-list-search input {
          width: 100%; border: 1px solid var(--cui-border-color, #d8dbe0); border-radius: 4px;
          padding: 3px 8px 3px 28px; font-size: .85rem;
        }
        .crio-list-search input:focus { outline: 2px solid #d97ea1; outline-offset: 0; border-color: #d97ea1; }
        .crio-list-search-icon { position: absolute; left: 8px; top: 50%; transform: translateY(-50%); color: #d97ea1; width: 14px; height: 14px; }
        .crio-list-table { width: 100%; border-collapse: collapse; white-space: nowrap; }
        .crio-list-scroll { max-height: 430px; overflow-y: auto; }
        .crio-list-scroll thead th { position: sticky; top: 0; z-index: 1; }
        .crio-list-table thead th { color: #fff; font-weight: 700; padding: 8px 10px; text-transform: uppercase; font-size: .9rem; }
        .crio-list-table.is-est thead th { background: #45c1bd; }
        .crio-list-table.is-crea thead th { background: #12a8cf; }
        .crio-list-table tbody td { padding: 6px 10px; color: #33393f; }
        .crio-list-table tbody tr { cursor: pointer; }
        .crio-list-table tbody tr.is-first td { border-top: 1px solid #eceff1; }
        .crio-list-table tbody tr:nth-child(even) td { background: #f5f6f7; }
        .crio-list-table tbody tr:hover td { background: #fbeef3; }
        .crio-list-name { color: #222; }
        .crio-list-muted { color: #6c757d; font-size: .85rem; }
        .crio-list-small { font-size: .8rem; }
        .crio-list-wash-done { color: #1d4fa8; font-weight: 700; }
        .crio-list-ctype { color: #1d4fa8; font-weight: 600; font-size: .85rem; }
        .crio-list-split { color: #1d5fc4; text-decoration: underline; background: none; border: none; padding: 0; font-size: .85rem; }
        .crio-list-date { color: #8a9096; font-style: italic; font-size: .85rem; }
        .crio-list-date.is-ok { color: #33393f; font-style: normal; }
        .crio-list-date.is-strong { color: #1d4fa8; font-weight: 700; }
        .crio-list-biopsia { color: #d0453a; font-weight: 700; font-size: .8rem; }
        .crio-list-n { font-size: 1.05rem; }
        .crio-list-status { font-weight: 700; font-size: .85rem; }
        .crio-list-num { font-weight: 700; }
        .crio-list-num.is-result { color: #2f9be0; }
        .crio-list-num.is-xx { color: #0f6b55; }
        .crio-list-num.is-xy { color: #f28c38; }
        .crio-list-num.is-ni { color: #6c757d; }
        .crio-list-pdf {
          background: #d32f2f; color: #fff; border: none; border-radius: 3px;
          font-size: .55rem; font-weight: 800; line-height: 1; padding: 4px 3px;
        }
        .crio-list-pdf:hover { background: #a82424; }
        .crio-list-pending {
          display: flex; flex-direction: column; align-items: center; text-align: center; gap: 2px;
          padding: 40px 16px; color: #6c757d;
        }
        .crio-list-pending svg { width: 28px; height: 28px; color: #8aa4c8; }
      `}</style>
    </div>
  );
};

export default CrioListTables;