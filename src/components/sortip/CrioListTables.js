// frontend/src/components/sortip/CrioListTables.js
// Sort_IPS list → Crio Embrio tab: two tables, one row per IP
//   1. Estimulación y Captura
//   2. Creación Embrionaria (same first columns + crio date, result, XX/XY/NI,
//      PDFs of the PGTA result and of the estimated transfer)
// Values come from config/sortIpSections.js → crioListRow.

import React, { useState } from 'react';
import CIcon from '@coreui/icons-react';
import { cilClock, cilSearch } from '@coreui/icons';
import { crioListRow } from '../../config/sortIpSections';

const fmt = (v) => {
  const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
};
const two = (v) => (v === '' || v === null || v === undefined ? '' : String(v).padStart(2, '0'));

const PdfLink = ({ ip, docKey, title, onViewDoc }) => {
  if (!docKey || !ip.sections?.docs?.[docKey]?.url) return null;
  return (
    <button type="button" className="crio-list-pdf" title={`Ver ${title}`} aria-label={`Ver ${title} de ${ip.nombre_completo}`}
      onClick={(e) => { e.stopPropagation(); onViewDoc(ip, docKey, `${title} — ${ip.nombre_completo}`); }}>
      PDF
    </button>
  );
};

// Everything a row shows, as searchable text (name, donor, dates as dd/mm/yyyy…)
const rowText = (ip, r, extended) => [
  ip.nombre_completo, r.donante || 'Sin confirmar', r.muestra, r.ovo, r.biopsia,
  r.captura && fmt(r.captura[0]), r.captura && fmt(r.captura[1]), r.mii, r.status.text,
  ...(extended ? [fmt(r.crioFecha), r.resultado, r.xx, r.xy, r.ni] : []),
].filter(v => v !== '' && v !== null && v !== undefined).join(' ').toLowerCase();

// Search box of one sub-table
const TableSearch = ({ id, value, onChange, label }) => (
  <div className="crio-list-search">
    <CIcon icon={cilSearch} className="crio-list-search-icon" />
    <input
      id={id} type="search" value={value} onChange={e => onChange(e.target.value)}
      placeholder="Buscar..." aria-label={`Buscar en ${label}`} autoComplete="off"
    />
  </div>
);

const CrioListTables = ({ ips = [], onOpen, onViewDoc, ipName = () => '' }) => {
  const rows = ips.map(ip => ({ ip, r: crioListRow(ip) }));
  // Each sub-table has its own search
  const [qEst, setQEst]   = useState('');
  const [qCrea, setQCrea] = useState('');
  const match = (q, extended) => ({ ip, r }) => !q.trim() || rowText(ip, r, extended).includes(q.trim().toLowerCase());
  const rowsEst = rows.filter(match(qEst, false));
  const rowsCrea = rows.filter(match(qCrea, true));

  // Columns shared by both tables
  const baseCells = (ip, r) => (
    <>
      <td className="crio-list-name">{ip.nombre_completo}</td>
      <td>{r.donante || <span className="crio-list-muted">Sin confirmar</span>}</td>
      <td className="text-center">{r.muestra}</td>
      <td className="text-center">
        {r.ovo === 'Split'
          ? <span className="crio-list-split" title={r.spliterIpId ? `Split con ${ipName(r.spliterIpId)}` : 'Split'}>Split</span>
          : r.ovo}
      </td>
      <td className="text-center">{r.biopsia && <span className="crio-list-biopsia">{r.biopsia}</span>}</td>
      <td className="crio-list-small">
        {r.captura ? `${fmt(r.captura[0]) || '—'} - ${fmt(r.captura[1]) || '—'}` : (r.donante ? <span className="crio-list-muted">Sin confirmar</span> : '')}
      </td>
      <td className="text-center">
        {r.mii !== '' ? r.mii : (r.capturaPendiente ? <CIcon icon={cilClock} className="text-muted" title="Captura pendiente" /> : '')}
      </td>
    </>
  );

  const statusCell = (r) => (
    <td className="text-end"><span className="crio-list-status" style={{ color: r.status.color }}>{r.status.text}</span></td>
  );

  const empty = (cols, q) => (
    <tr><td colSpan={cols} className="text-center text-muted py-4">{q.trim() ? 'Sin resultados para la búsqueda' : 'Sin IPs en esta vista'}</td></tr>
  );

  return (
    <div className="crio-list p-2">
      <div className="crio-list-head is-green">
        <h6 className="crio-list-title is-green">Estimulación y Captura</h6>
        <span className="crio-list-count">{rowsEst.length} de {rows.length}</span>
        <TableSearch id="crio-search-est" value={qEst} onChange={setQEst} label="Estimulación y Captura" />
      </div>
      <div className="table-responsive">
        <table className="crio-list-table">
          <thead>
            <tr>
              <th>IP</th><th>Donante</th><th className="text-center">Muestra</th><th className="text-center">OVO</th>
              <th className="text-center">PGTA</th><th>Captura</th><th className="text-center">MII</th><th className="text-end">Status</th>
            </tr>
          </thead>
          <tbody>
            {rowsEst.length ? rowsEst.map(({ ip, r }) => (
              <tr key={ip.id} onClick={() => onOpen(ip.id)}>{baseCells(ip, r)}{statusCell(r)}</tr>
            )) : empty(8, qEst)}
          </tbody>
        </table>
      </div>

      <div className="crio-list-head is-red mt-4">
        <h6 className="crio-list-title is-red">Creación Embrionaria</h6>
        <span className="crio-list-count">{rowsCrea.length} de {rows.length}</span>
        <TableSearch id="crio-search-crea" value={qCrea} onChange={setQCrea} label="Creación Embrionaria" />
      </div>
      <div className="table-responsive">
        <table className="crio-list-table">
          <thead>
            <tr>
              <th>IP</th><th>Crio Embrio</th><th className="text-center">Muestra</th><th className="text-center">OVO</th>
              <th className="text-center">PGTA</th><th>Captura</th><th className="text-center">MII</th><th>Crio Embrio</th>
              <th className="text-center">Result.</th><th className="text-center">XX</th><th className="text-center">XY</th>
              <th className="text-center">NI</th><th className="text-center">Estimado tr.</th><th className="text-end">Status</th>
            </tr>
          </thead>
          <tbody>
            {rowsCrea.length ? rowsCrea.map(({ ip, r }) => (
              <tr key={ip.id} onClick={() => onOpen(ip.id)}>
                {baseCells(ip, r)}
                <td>{fmt(r.crioFecha)}</td>
                <td className="text-center text-nowrap">
                  <span className="crio-list-num is-result">{two(r.resultado)}</span>
                  <PdfLink ip={ip} docKey={r.resultadoDocKey} title="Resultado PGTA" onViewDoc={onViewDoc} />
                </td>
                <td className="text-center"><span className="crio-list-num is-xx">{two(r.xx)}</span></td>
                <td className="text-center"><span className="crio-list-num is-xy">{two(r.xy)}</span></td>
                <td className="text-center"><span className="crio-list-num is-ni">{two(r.ni)}</span></td>
                <td className="text-center"><PdfLink ip={ip} docKey={r.estimadoDocKey} title="Estimado de transfer" onViewDoc={onViewDoc} /></td>
                {statusCell(r)}
              </tr>
            )) : empty(14, qCrea)}
          </tbody>
        </table>
      </div>

      <style>{`
        .crio-list-head {
          display: flex; align-items: center; flex-wrap: wrap; gap: 6px 12px;
          padding-bottom: 6px; border-bottom: 3px solid #8aa4c8;
        }
        .crio-list-title { font-weight: 800; margin: 0; }
        .crio-list-count { font-size: .75rem; color: #6c757d; }
        .crio-list-search { position: relative; margin-left: auto; width: 220px; max-width: 100%; }
        .crio-list-search input {
          width: 100%; border: 1px solid var(--cui-border-color, #d8dbe0); border-radius: 4px;
          padding: 3px 8px 3px 28px; font-size: .85rem;
        }
        .crio-list-search input:focus { outline: 2px solid #d97ea1; outline-offset: 0; border-color: #d97ea1; }
        .crio-list-search-icon { position: absolute; left: 8px; top: 50%; transform: translateY(-50%); color: #d97ea1; width: 14px; height: 14px; }
        .crio-list-title.is-green { color: #0f6b55; }
        .crio-list-title.is-red { color: #d0453a; font-style: italic; }
        .crio-list-table { width: 100%; border-collapse: collapse; white-space: nowrap; }
        .crio-list-table thead th { background: #f6d5e1; color: #4a4f55; font-weight: 500; padding: 8px 10px; }
        .crio-list-table tbody td { padding: 6px 10px; color: #33393f; }
        .crio-list-table tbody tr { cursor: pointer; }
        .crio-list-table tbody tr:nth-child(even) td { background: #f5f6f7; }
        .crio-list-table tbody tr:hover td { background: #fbeef3; }
        .crio-list-name { color: #222; }
        .crio-list-muted { color: #6c757d; font-size: .85rem; }
        .crio-list-small { font-size: .8rem; }
        .crio-list-split { color: #1d5fc4; text-decoration: underline; font-style: italic; }
        .crio-list-biopsia { color: #d0453a; font-weight: 700; font-style: italic; font-size: .82rem; }
        .crio-list-status { font-weight: 700; }
        .crio-list-num { font-weight: 700; }
        .crio-list-num.is-result { color: #2f9be0; margin-right: 6px; }
        .crio-list-num.is-xx { color: #0f6b55; }
        .crio-list-num.is-xy { color: #f28c38; }
        .crio-list-num.is-ni { color: #6c757d; }
        .crio-list-pdf {
          background: #fff; color: #d32f2f; border: 1.5px solid #d32f2f; border-radius: 3px;
          font-size: .6rem; font-weight: 800; line-height: 1; padding: 3px 4px;
        }
        .crio-list-pdf:hover { background: #d32f2f; color: #fff; }
      `}</style>
    </div>
  );
};

export default CrioListTables;