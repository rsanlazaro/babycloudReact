// frontend/src/components/sortip/IpDocControls.js
// Upload / view / delete buttons for one PDF of a Sort_IPS register
// (Check list items, Crio embrio results). The parent does the actual work
// (SortIP.js → uploadIpDoc / viewIpDoc / deleteIpDoc).
//
// multiple → the upload button opens PdfMergeModal: several PDFs can be chosen,
// they are merged into one and that single PDF is what onPick receives.

import React, { useRef, useState } from 'react';
import { CButton, CSpinner } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilCloudUpload, cilTrash } from '@coreui/icons';
import PdfMergeModal from './PdfMergeModal';

const slug = (s) => String(s || 'documento').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'documento';
const IpDocControls = ({ label, doc, progress, onPick, onView, onDelete, disabled = false, multiple = false }) => {
  const inputRef = useRef(null);
  const [mergeOpen, setMergeOpen] = useState(false);
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
          onClick={() => (multiple ? setMergeOpen(true) : inputRef.current?.click())}
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
      {multiple && (
        <PdfMergeModal
          visible={mergeOpen}
          title={`${doc?.url ? 'Reemplazar' : 'Subir'} PDF — ${label}`}
          fileName={slug(label)}
          onClose={() => setMergeOpen(false)}
          onConfirm={(file) => { setMergeOpen(false); onPick(file); }}
        />
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