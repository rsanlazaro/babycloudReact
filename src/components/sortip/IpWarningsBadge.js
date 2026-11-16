// frontend/src/components/sortip/IpWarningsBadge.js
// Red circle with the number of occurrences / warnings of an IP
// (config/sortIpSections.js → ipWarnings). Clicking it lists them by section.
//
// <IpWarningsBadge warnings ipName onGo={(sectionKey) => ...} goLabel />
//   onGo (optional) → a button per section ("Ir a Check list"…) or, with
//   goLabel, one button for the whole list ("Abrir registro")
// <WarningCount n /> → the same red circle, only the number (tabs)

import React, { useState } from 'react';
import { CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilWarning } from '@coreui/icons';
import { IP_SECTIONS } from '../../config/sortIpSections';

const STYLE = `
  .ip-warn-count {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 20px; height: 20px; padding: 0 5px; border-radius: 999px;
    background: #dc3545; color: #fff; font-size: .72rem; font-weight: 800; line-height: 1;
    border: 2px solid #fff; box-shadow: 0 0 0 1px #dc3545; vertical-align: middle;
  }
  button.ip-warn-count { cursor: pointer; margin-left: 8px; }
  button.ip-warn-count:focus-visible { outline: 2px solid #dc3545; outline-offset: 2px; }
`;

export const WarningCount = ({ n, className = '', title }) => (n > 0 ? (
  <span className={`ip-warn-count ${className}`} title={title || `${n} alerta${n === 1 ? '' : 's'}`}
    aria-label={`${n} alerta${n === 1 ? '' : 's'}`}>
    {n > 99 ? '99+' : n}
    <style>{STYLE}</style>
  </span>
) : null);

const IpWarningsBadge = ({ warnings = [], ipName, onGo, goLabel }) => {
  const [open, setOpen] = useState(false);
  if (!warnings.length) return null;
  const n = warnings.length;
  const groups = IP_SECTIONS
    .map(s => ({ s, items: warnings.filter(w => w.section === s.key) }))
    .filter(g => g.items.length);

  return (
    <>
      <button type="button" className="ip-warn-count" onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        title="Ver alertas" aria-label={`${n} alerta${n === 1 ? '' : 's'}${ipName ? ` de ${ipName}` : ''}: ver detalle`}>
        {n > 99 ? '99+' : n}
      </button>
      <CModal visible={open} onClose={() => setOpen(false)} alignment="center" scrollable>
        <div onClick={(e) => e.stopPropagation()}>
          <CModalHeader className="bg-danger text-white" closeButton={false}>
            <CModalTitle className="d-flex align-items-center gap-2">
              <CIcon icon={cilWarning} size="lg" />{n} alerta{n === 1 ? '' : 's'}
            </CModalTitle>
          </CModalHeader>
          <CModalBody>
            {ipName && <p className="fw-bold mb-3">{ipName}</p>}
            {groups.map(({ s, items }) => (
              <div key={s.key} className="mb-3">
                <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                  <span className="fw-semibold" style={{ color: s.color }}>
                    {s.label} <span className="ip-warn-count ms-1">{items.length}</span>
                  </span>
                  {onGo && !goLabel && (
                    <CButton size="sm" color="link" className="p-0" onClick={() => { setOpen(false); onGo(s.key); }}>Ir a {s.label}</CButton>
                  )}
                </div>
                <ul className="mb-0 ps-3 small">{items.map((w, i) => <li key={i}>{w.text}</li>)}</ul>
              </div>
            ))}
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" variant="outline" onClick={() => setOpen(false)}>Cerrar</CButton>
            {onGo && goLabel && (
              <CButton color="danger" className="text-white" onClick={() => { setOpen(false); onGo(groups[0]?.s.key); }}>{goLabel}</CButton>
            )}
          </CModalFooter>
        </div>
      </CModal>
      <style>{STYLE}</style>
    </>
  );
};

export default IpWarningsBadge;