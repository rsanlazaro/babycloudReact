// frontend/src/components/sortip/PendingDocsDot.js
// Red dot next to an IP's name when a trip already has its flight but its
// documents are incomplete (rule: config/sortIpSections.js → pendingDocs).
// Clicking it opens the red ALERTA: "Favor de subir documentos".

import React, { useState } from 'react';
import { CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilWarning } from '@coreui/icons';

const PendingDocsDot = ({ pending = [], ipName, actionLabel, onAction }) => {
  const [open, setOpen] = useState(false);
  if (!pending.length) return null;
  const total = pending.reduce((t, p) => t + p.faltantes.length, 0);

  return (
    <>
      <button
        type="button"
        className="pending-docs-dot"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        title="Documentos pendientes"
        aria-label={`Alerta: ${total} documento${total === 1 ? '' : 's'} pendiente${total === 1 ? '' : 's'}`}
      />
      <CModal visible={open} onClose={() => setOpen(false)} alignment="center">
        <div onClick={(e) => e.stopPropagation()}>
          <CModalHeader className="bg-danger text-white" closeButton={false}>
            <CModalTitle className="d-flex align-items-center gap-2">
              <CIcon icon={cilWarning} size="lg" />ALERTA
            </CModalTitle>
          </CModalHeader>
          <CModalBody>
            <p className="fs-5 fw-bold text-danger mb-2">Favor de subir documentos</p>
            {ipName && <p className="text-muted mb-3">{ipName} ya tiene vuelo, pero faltan documentos del Check list:</p>}
            {pending.map(p => (
              <div key={p.numero} className="mb-2">
                <div className="fw-semibold">Viaje {p.numero} · {p.columna}</div>
                <ul className="mb-0 ps-3">
                  {p.faltantes.map(f => <li key={f}>{f}</li>)}
                </ul>
              </div>
            ))}
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" variant="outline" onClick={() => setOpen(false)}>Cerrar</CButton>
            {onAction && (
              <CButton color="danger" className="text-white" onClick={() => { setOpen(false); onAction(); }}>
                {actionLabel || 'Subir documentos'}
              </CButton>
            )}
          </CModalFooter>
        </div>
      </CModal>
      <style>{`
        .pending-docs-dot {
          display: inline-block; width: 14px; height: 14px; border-radius: 50%;
          background: #dc3545; border: 2px solid #fff; box-shadow: 0 0 0 1px #dc3545;
          padding: 0; margin-left: 8px; vertical-align: middle; cursor: pointer;
          animation: pending-docs-pulse 1.6s ease-in-out infinite;
        }
        .pending-docs-dot:focus-visible { outline: 2px solid #dc3545; outline-offset: 2px; }
        @keyframes pending-docs-pulse {
          0%, 100% { box-shadow: 0 0 0 1px #dc3545, 0 0 0 0 rgba(220,53,69,.5); }
          50% { box-shadow: 0 0 0 1px #dc3545, 0 0 0 6px rgba(220,53,69,0); }
        }
        @media (prefers-reduced-motion: reduce) { .pending-docs-dot { animation: none; } }
      `}</style>
    </>
  );
};

export default PendingDocsDot;