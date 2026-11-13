// frontend/src/components/sortip/PdfMergeModal.js
// "Subir PDF" with several files: the user picks one or more PDFs, puts them in
// order, and they are merged in the browser into ONE PDF, which is what gets
// uploaded (utils/mergePdfs.js).
//
// <PdfMergeModal visible title onClose onConfirm={(mergedFile) => ...} maxBytes />

import React, { useEffect, useRef, useState } from 'react';
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton, CAlert, CSpinner, CBadge,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilArrowTop, cilArrowBottom, cilTrash, cilPlus, cilCloudUpload } from '@coreui/icons';
import { countPdfPages, mergePdfFiles } from '../../utils/mergePdfs';

const fmtSize = (b) => (b >= 1024 * 1024 ? `${(b / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
let seq = 0;

const PdfMergeModal = ({ visible, title, fileName = 'documento', onClose, onConfirm, maxBytes = 10 * 1024 * 1024 }) => {
  const inputRef = useRef(null);
  const [items, setItems] = useState([]);   // { key, file, pages, error }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) { setItems([]); setError(''); setBusy(false); }
  }, [visible]);

  const addFiles = async (list) => {
    const files = Array.from(list || []);
    if (!files.length) return;
    setError('');
    const fresh = files.map(file => ({ key: ++seq, file, pages: null, error: '' }));
    setItems(prev => [...prev, ...fresh]);
    for (const it of fresh) {
      let patch;
      if (it.file.type !== 'application/pdf' && !/\.pdf$/i.test(it.file.name)) {
        patch = { error: 'No es un archivo PDF' };
      } else {
        try { patch = { pages: await countPdfPages(it.file) }; } catch (e) { patch = { error: e.message }; }
      }
      setItems(prev => prev.map(x => (x.key === it.key ? { ...x, ...patch } : x)));
    }
  };

  const move = (i, d) => setItems(prev => {
    const next = [...prev];
    const j = i + d;
    if (j < 0 || j >= next.length) return prev;
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });
  const remove = (key) => setItems(prev => prev.filter(x => x.key !== key));

  const valid = items.filter(x => !x.error);
  const checking = items.some(x => x.pages === null && !x.error);
  const totalPages = valid.reduce((s, x) => s + (x.pages || 0), 0);
  const totalBytes = valid.reduce((s, x) => s + x.file.size, 0);
  const hasErrors = items.some(x => x.error);

  const confirm = async () => {
    if (!valid.length || hasErrors || checking) return;
    try {
      setBusy(true);
      setError('');
      const merged = await mergePdfFiles(valid.map(x => x.file), fileName);
      if (merged.size > maxBytes) {
        setError(`El PDF unido pesa ${fmtSize(merged.size)} y el máximo es ${fmtSize(maxBytes)}. Quita algún archivo o comprímelos antes.`);
        return;
      }
      onConfirm(merged);
    } catch (e) {
      setError(e.message || 'No se pudieron unir los PDF');
    } finally {
      setBusy(false);
    }
  };

  return (
    <CModal visible={visible} onClose={busy ? undefined : onClose} alignment="center" backdrop="static">
      <CModalHeader closeButton={!busy}><CModalTitle>{title}</CModalTitle></CModalHeader>
      <CModalBody>
        <p className="small text-muted mb-2">
          Selecciona uno o varios PDF. Se unen en el orden de la lista en <strong>un solo archivo</strong>, que es el que se sube.
        </p>
        <input
          ref={inputRef} type="file" accept="application/pdf" multiple style={{ display: 'none' }}
          onChange={e => { const f = e.target.files; addFiles(f); e.target.value = ''; }}
        />
        {items.length === 0 ? (
          <button type="button" className="pdf-merge-drop" onClick={() => inputRef.current?.click()}
            onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}>
            <CIcon icon={cilCloudUpload} size="xl" className="mb-2" />
            <span>Elegir archivos PDF</span>
            <small className="text-muted">o arrástralos aquí</small>
          </button>
        ) : (
          <>
            <ol className="pdf-merge-list" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}>
              {items.map((it, i) => (
                <li key={it.key} className={it.error ? 'is-error' : ''}>
                  <span className="pdf-merge-n">{i + 1}</span>
                  <span className="pdf-merge-name">
                    <span className="text-truncate d-block" title={it.file.name}>{it.file.name}</span>
                    <small className={it.error ? 'text-danger' : 'text-muted'}>
                      {it.error || (it.pages === null ? 'Revisando…' : `${it.pages} pág. · ${fmtSize(it.file.size)}`)}
                    </small>
                  </span>
                  <span className="pdf-merge-actions">
                    <CButton size="sm" color="secondary" variant="ghost" disabled={busy || i === 0} onClick={() => move(i, -1)}
                      title="Subir en el orden" aria-label={`Mover ${it.file.name} hacia arriba`}><CIcon icon={cilArrowTop} /></CButton>
                    <CButton size="sm" color="secondary" variant="ghost" disabled={busy || i === items.length - 1} onClick={() => move(i, 1)}
                      title="Bajar en el orden" aria-label={`Mover ${it.file.name} hacia abajo`}><CIcon icon={cilArrowBottom} /></CButton>
                    <CButton size="sm" color="danger" variant="ghost" disabled={busy} onClick={() => remove(it.key)}
                      title="Quitar" aria-label={`Quitar ${it.file.name}`}><CIcon icon={cilTrash} /></CButton>
                  </span>
                </li>
              ))}
            </ol>
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
              <CButton size="sm" color="secondary" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
                <CIcon icon={cilPlus} className="me-1" />Agregar más PDF
              </CButton>
              {valid.length > 0 && (
                <span className="small text-muted">
                  Total: <CBadge color="light" textColor="dark" className="border">{valid.length} archivo(s)</CBadge>{' '}
                  {totalPages} pág. · ~{fmtSize(totalBytes)}
                </span>
              )}
            </div>
          </>
        )}
        {hasErrors && <CAlert color="warning" className="py-2 mt-3 mb-0">Quita los archivos marcados en rojo para continuar.</CAlert>}
        {error && <CAlert color="danger" className="py-2 mt-3 mb-0">{error}</CAlert>}
        <style>{`
          .pdf-merge-drop {
            width: 100%; display: flex; flex-direction: column; align-items: center; padding: 28px 12px;
            border: 2px dashed #b9c3cc; border-radius: 8px; background: #f8fafb; color: #4a5560;
          }
          .pdf-merge-drop:hover, .pdf-merge-drop:focus-visible { border-color: #1ba3b8; color: #1ba3b8; }
          .pdf-merge-list { list-style: none; padding: 0; margin: 0 0 12px; max-height: 320px; overflow-y: auto; }
          .pdf-merge-list li {
            display: flex; align-items: center; gap: 10px; padding: 6px 8px;
            border: 1px solid var(--cui-border-color, #dee2e6); border-radius: 6px; margin-bottom: 6px;
          }
          .pdf-merge-list li.is-error { border-color: #e55353; background: #fdf0f0; }
          .pdf-merge-n {
            flex: 0 0 24px; height: 24px; border-radius: 50%; background: #1ba3b8; color: #fff;
            font-size: .75rem; font-weight: 700; display: flex; align-items: center; justify-content: center;
          }
          .pdf-merge-name { flex: 1 1 auto; min-width: 0; font-size: .875rem; }
          .pdf-merge-actions { flex: 0 0 auto; display: flex; }
        `}</style>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" disabled={busy} onClick={onClose}>Cancelar</CButton>
        <CButton color="primary" className="app-button" disabled={busy || checking || !valid.length || hasErrors} onClick={confirm}>
          {busy
            ? <><CSpinner size="sm" className="me-2" />Uniendo…</>
            : valid.length > 1 ? `Unir ${valid.length} PDF y subir` : 'Subir PDF'}
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default PdfMergeModal;