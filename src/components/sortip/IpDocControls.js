// frontend/src/components/sortip/IpDocControls.js
// Upload / view / delete buttons for one PDF of a Sort_IPS register
// (Check list items, Crio embrio results). The parent does the actual work
// (SortIP.js → uploadIpDoc / viewIpDoc / deleteIpDoc).

import React, { useRef } from 'react';
import { CButton, CSpinner } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilCloudUpload, cilTrash } from '@coreui/icons';

const IpDocControls = ({ label, doc, progress, onPick, onView, onDelete, disabled = false }) => {
  const inputRef = useRef(null);

  if (progress !== undefined) {
    return (
      <span className="text-muted small d-inline-flex align-items-center" aria-live="polite">
        <CSpinner size="sm" className="me-1" />{progress}%
      </span>
    );
  }

  return (
    <span className="d-inline-flex align-items-center gap-1">
      <input
        ref={inputRef} type="file" accept="application/pdf" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (f) onPick(f); }}
      />
      {!disabled && (
        <CButton
          size="sm" color="secondary" variant="ghost" className="px-1 py-0"
          onClick={() => inputRef.current?.click()}
          title={doc?.url ? `Reemplazar PDF: ${label}` : `Subir PDF: ${label}`}
          aria-label={doc?.url ? `Reemplazar PDF de ${label}` : `Subir PDF de ${label}`}
        >
          <CIcon icon={cilCloudUpload} />
        </CButton>
      )}
      {doc?.url && (
        <>
          <button
            type="button" className="ip-doc-pdf" onClick={onView}
            title={`Ver PDF: ${label}`} aria-label={`Ver PDF de ${label}`}
          >
            PDF
          </button>
          {!disabled && (
            <CButton
              size="sm" color="danger" variant="ghost" className="px-1 py-0"
              onClick={onDelete} title={`Eliminar PDF: ${label}`} aria-label={`Eliminar PDF de ${label}`}
            >
              <CIcon icon={cilTrash} />
            </CButton>
          )}
        </>
      )}
      <style>{`
        .ip-doc-pdf {
          background: #fff; color: #d32f2f; border: 1.5px solid #d32f2f; border-radius: 3px;
          font-size: .62rem; font-weight: 800; line-height: 1; padding: 3px 4px; letter-spacing: .02em;
        }
        .ip-doc-pdf:hover { background: #d32f2f; color: #fff; }
      `}</style>
    </span>
  );
};

export default IpDocControls;