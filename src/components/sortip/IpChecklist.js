// frontend/src/components/sortip/IpChecklist.js
// Sort_IPS → Check list: two columns (Primer Viaje / Segundo Viaje).
// Each item has a PDF (saved immediately, section "docs") and a date (saved
// with "Guardar cambios"). Pasaportes and Serologías use an EXPIRY date: an
// alert shows when it is past or fewer than VIGENCIA_MESES_ALERTA months away.

import React from 'react';
import { CRow, CCol, CAlert, CBadge, CFormTextarea, CFormLabel } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilWarning } from '@coreui/icons';
import IpDocControls from './IpDocControls';
import {
  CHECKLIST_COLUMNS, checklistDocKey, checklistDateField, isChecklistDone,
  vigenciaStatus, vigenciaAlerts, vigenciaText, VIGENCIA_MESES_ALERTA,
} from '../../config/sortIpSections';

const formatDMY = (v) => {
  const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
};

// Status shown at the end of each row
const ItemStatus = ({ item, fecha, done }) => {
  if (item.vence) {
    const st = vigenciaStatus(fecha);
    if (st?.level === 'vencido') return <CBadge color="danger">Vencido</CBadge>;
    if (st?.level === 'por_vencer') return <CBadge color="warning" textColor="dark">Vence en {st.days} días</CBadge>;
    if (st?.level === 'vigente') return <CBadge color="success">Vigente</CBadge>;
  }
  if (done) return <span className="ip-chk-received">Recibido</span>;
  return <span className="ip-chk-request">Solicitar</span>;
};

const IpChecklist = ({ data = {}, docs = {}, setField, docProps, disabled = false }) => {
  const alerts = vigenciaAlerts(data);

  return (
    <div>
      {alerts.length > 0 && (
        <CAlert
          color={alerts.some(a => a.status.level === 'vencido') ? 'danger' : 'warning'}
          className="py-2 d-flex align-items-start gap-2"
        >
          <CIcon icon={cilWarning} className="mt-1 flex-shrink-0" />
          <div>
            <strong>Revisar vigencias</strong> (menos de {VIGENCIA_MESES_ALERTA} meses):
            <ul className="mb-0 ps-3">
              {alerts.map(a => <li key={a.item.key}>{vigenciaText(a)} ({formatDMY(a.fecha)})</li>)}
            </ul>
          </div>
        </CAlert>
      )}

      <CRow className="g-4">
        {CHECKLIST_COLUMNS.map(col => (
          <CCol lg={6} key={col.key}>
            <h5 className="ip-chk-title">{col.title}</h5>
            <div className="ip-chk-list">
              {col.docs.map(item => {
                const field = checklistDateField(item);
                const fecha = data[field] || '';
                const done = isChecklistDone(docs, item);
                const inputId = `ip-chk-${item.key}`;
                return (
                  <div key={item.key} className="ip-chk-row">
                    <label htmlFor={inputId} className="ip-chk-label">{item.label}</label>
                    <span className="ip-chk-doc">
                      <IpDocControls label={item.label} disabled={disabled} {...docProps(checklistDocKey(item), item.label)} />
                    </span>
                    <span className="ip-chk-date">
                      <span className="ip-chk-date-label">{item.vence ? 'Vence' : 'Fecha'}</span>
                      <input
                        id={inputId} type="date" className="ip-chk-input" value={fecha} disabled={disabled}
                        aria-label={`${item.vence ? 'Fecha de vencimiento' : 'Fecha'} de ${item.label}`}
                        onChange={e => setField(field, e.target.value)}
                      />
                    </span>
                    <span className="ip-chk-status"><ItemStatus item={item} fecha={fecha} done={done} /></span>
                  </div>
                );
              })}
            </div>
          </CCol>
        ))}
      </CRow>

      <div className="mt-4">
        <CFormLabel htmlFor="ip-chk-notas" className="mb-1">Notas:</CFormLabel>
        <CFormTextarea id="ip-chk-notas" rows={3} value={data.notas || ''} disabled={disabled} onChange={e => setField('notas', e.target.value)} />
      </div>

      <style>{`
        .ip-chk-title { color: #2f7f89; font-weight: 800; margin-bottom: .75rem; }
        .ip-chk-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto auto 92px;
          align-items: center; gap: 4px 10px;
          padding: 6px 0; border-bottom: 1px dashed var(--cui-border-color, #e3e6ea);
        }
        .ip-chk-label { color: #3b8f99; margin: 0; line-height: 1.25; }
        .ip-chk-date { display: inline-flex; align-items: center; gap: 4px; }
        .ip-chk-date-label { font-size: .72rem; color: #6c757d; }
        .ip-chk-input {
          border: 1px solid #c9d3cf; border-radius: 3px; padding: 1px 4px;
          font-size: .78rem; color: #1b9ec2; font-style: italic; font-weight: 700; width: 128px;
        }
        .ip-chk-input:disabled { background: #f3f5f4; }
        .ip-chk-status { text-align: right; font-size: .75rem; }
        .ip-chk-request { font-style: italic; color: #6c757d; }
        .ip-chk-received { color: #198754; font-weight: 600; }
        @media (max-width: 575.98px) {
          .ip-chk-row { grid-template-columns: minmax(0, 1fr) auto; }
          .ip-chk-date { grid-column: 1; }
          .ip-chk-status { grid-column: 2; }
        }
      `}</style>
    </div>
  );
};

export default IpChecklist;