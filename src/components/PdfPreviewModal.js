// frontend/src/components/PdfPreviewModal.js
// Shows a PDF served by the backend inside the app (no new tab, so no popup
// blocking). The PDF is downloaded with the session like any other API call;
// if it fails, the reason sent by the backend is shown.
//
// <PdfPreviewModal visible title endpoint="/api/upload/ip-doc-stream" params={{ ipId, docKey }} onClose />

import React, { useEffect, useState } from 'react';
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton, CAlert, CSpinner,
} from '@coreui/react';
import api from '../services/api';

const PdfPreviewModal = ({ visible, title, endpoint, params, onClose, color = '#1ba3b8' }) => {
  const [state, setState] = useState({ loading: false, url: null, error: '' });
  const paramsKey = JSON.stringify(params || {});

  useEffect(() => {
    if (!visible) return undefined;
    let cancelled = false;
    let objectUrl = null;
    (async () => {
      setState({ loading: true, url: null, error: '' });
      try {
        const res = await api.get(endpoint, { params, responseType: 'blob', withCredentials: true });
        objectUrl = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        if (!cancelled) setState({ loading: false, url: objectUrl, error: '' });
      } catch (err) {
        let message = err.response
          ? `No se pudo abrir el documento (error ${err.response.status})`
          : 'No se pudo conectar con el servidor para abrir el documento';
        const data = err.response?.data;
        if (data instanceof Blob) {
          try { message = JSON.parse(await data.text()).message || message; } catch (_) { /* not JSON */ }
        }
        if (!cancelled) setState({ loading: false, url: null, error: message });
      }
    })();
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, endpoint, paramsKey]);

  return (
    <CModal visible={visible} onClose={onClose} size="xl" alignment="center">
      <CModalHeader><CModalTitle>{title}</CModalTitle></CModalHeader>
      <CModalBody className="p-0">
        {state.loading && <div className="text-center py-5"><CSpinner size="sm" className="me-2" />Cargando documento...</div>}
        {state.error && <CAlert color="danger" className="m-3">{state.error}</CAlert>}
        {state.url && (
          <iframe title={title} src={state.url} style={{ width: '100%', height: '75vh', border: 'none', display: 'block' }} />
        )}
      </CModalBody>
      <CModalFooter>
        {state.url && (
          <>
            <CButton color="secondary" variant="outline" onClick={() => window.open(state.url, '_blank')}>Abrir en pestaña nueva ↗</CButton>
            <CButton color="secondary" variant="outline" href={state.url} download={`${String(title || 'documento').replace(/[^\w-]+/g, '_')}.pdf`}>Descargar</CButton>
          </>
        )}
        <CButton style={{ backgroundColor: color, borderColor: color, color: '#fff' }} onClick={onClose}>Cerrar</CButton>
      </CModalFooter>
    </CModal>
  );
};

export default PdfPreviewModal;