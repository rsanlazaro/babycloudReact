// frontend/src/components/seguros/SeguroFormFields.js
// Fields of a "Seguro de Gastos Médicos Mayores" register, shared by:
//  - SegurosList.js  (Baby site → Listado de seguros → Editar registro)
//  - SortGes.js      (Sort_GESCA → SEGURO MED → Nuevo / Editar registro de seguro)
// Both screens edit the same table (sort_ges_seguro_mat), so they show exactly
// the same fields, in the same order, with the same rules.

import React from 'react';
import {
  CRow, CCol, CFormLabel, CFormInput, CFormSelect, CInputGroup, CInputGroupText, CAlert,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilWarning } from '@coreui/icons';
import {
  TIPO_PAGO_CONFIG, buildPagos, computeMatLiberacion, computeVidaVencimiento, toDateInput,
} from '../../utils/seguroPagos';

// Options for "Aseguradora" and "Gestor"
export const ASEGURADORAS = ['AXXA', 'Bupa'];
export const GESTORES = ['Francisco', 'Armando'];

// Saved value → matching option ignoring case ("BUPA" → "Bupa"); other values kept as-is
const toOption = (value, options) =>
  options.find(o => o.toLowerCase() === String(value || '').trim().toLowerCase()) || value || '';

/**
 * Dropdown with fixed options. A register saved earlier with a value that is not
 * in the list (e.g. typed by hand before) still shows it, marked "valor anterior",
 * so opening and saving the register never erases it.
 */
const OptionSelect = ({ value, options, onChange }) => (
  <CFormSelect value={value} onChange={e => onChange(e.target.value)}>
    <option value="">— Seleccionar —</option>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
    {value && !options.includes(value) && <option value={value}>{value} (valor anterior)</option>}
  </CFormSelect>
);

export const SEGURO_EMPTY = {
  aseguradora: '', numero_poliza: '', gestor: '',
  tipo_pago: '', valor_cuota: '', total_estimado: '', valor_alta: '',
  fecha_solicitud: '', fecha_alta: '', fecha_liberacion: '', fecha_vencimiento: '',
};

// Policy from the API → form values (dates as YYYY-MM-DD for <input type="date">)
export const policyToForm = (p = {}) => ({
  aseguradora:       toOption(p.aseguradora, ASEGURADORAS),
  numero_poliza:     p.numero_poliza     || '',
  gestor:            toOption(p.gestor, GESTORES),
  tipo_pago:         p.tipo_pago         || '',
  valor_cuota:       p.valor_cuota       ?? '',
  total_estimado:    p.total_estimado    ?? '',
  valor_alta:        p.valor_alta        ?? '',
  fecha_solicitud:   toDateInput(p.fecha_solicitud),
  fecha_alta:        toDateInput(p.fecha_alta),
  fecha_liberacion:  toDateInput(p.fecha_liberacion),
  fecha_vencimiento: toDateInput(p.fecha_vencimiento),
});

// Editing: payment type or start date changed → the payment schedule is rebuilt
export const willRebuildPagos = (form, original) => {
  if (!form || !original) return false;
  const o = policyToForm(original);
  return (form.tipo_pago !== o.tipo_pago || form.fecha_alta !== o.fecha_alta)
    && buildPagos(form.tipo_pago, form.valor_cuota, form.fecha_alta).length > 0;
};

// Only rule shared by both screens
export const validateSeguro = (form) =>
  (!form.fecha_solicitud ? 'La fecha de solicitud es obligatoria' : '');

/**
 * @param form      current values (SEGURO_EMPTY shape)
 * @param setForm   React state setter (accepts an updater function)
 * @param gestante  optional — shown as a fixed, non-editable GESCA/GESTA field
 * @param original  optional — the policy being edited (enables the "rebuild" warning)
 */
const SeguroFormFields = ({ form, setForm, gestante, original }) => {
  const set = (changes) => setForm(f => ({ ...f, ...changes }));
  const cfg = TIPO_PAGO_CONFIG[form.tipo_pago];

  const rebuild = willRebuildPagos(form, original);
  const nuevasCuotas = rebuild ? buildPagos(form.tipo_pago, form.valor_cuota, form.fecha_alta).length : 0;
  const paidCount = (original?.pagos || []).filter(c => c.fecha_pago).length;

  return (
    <CRow>
      {gestante !== undefined && (
        <CCol xs={12} className="mb-3">
          <CFormLabel>GESCA/GESTA:</CFormLabel>
          <CFormInput value={gestante || '—'} disabled readOnly style={{ fontWeight: 600 }} />
          <div className="text-muted" style={{ fontSize: '0.72rem', marginTop: '3px' }}>
            Perfil actual — el registro se asigna a esta gestante.
          </div>
        </CCol>
      )}

      <CCol md={6} className="mb-3">
        <CFormLabel>Aseguradora:</CFormLabel>
        <OptionSelect value={form.aseguradora} options={ASEGURADORAS} onChange={v => set({ aseguradora: v })} />
      </CCol>
      <CCol md={6} className="mb-3">
        <CFormLabel>Número de póliza:</CFormLabel>
        <CFormInput
          placeholder="Opcional — se puede capturar después"
          value={form.numero_poliza}
          onChange={e => set({ numero_poliza: e.target.value })}
        />
      </CCol>

      <CCol md={6} className="mb-3">
        <CFormLabel>Gestor:</CFormLabel>
        <OptionSelect value={form.gestor} options={GESTORES} onChange={v => set({ gestor: v })} />
      </CCol>
      <CCol md={6} className="mb-3">
        <CFormLabel>Tipo de pago:</CFormLabel>
        <CFormSelect
          value={form.tipo_pago}
          onChange={e => {
            const tipo = e.target.value;
            const c = TIPO_PAGO_CONFIG[tipo];
            set({
              tipo_pago: tipo,
              total_estimado: form.valor_cuota && c ? (parseFloat(form.valor_cuota) * c.cuotas).toFixed(2) : '',
            });
          }}
        >
          <option value="">— Seleccionar —</option>
          {Object.entries(TIPO_PAGO_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </CFormSelect>
      </CCol>

      <CCol md={6} className="mb-3">
        <CFormLabel>Valor por cuota:</CFormLabel>
        <CInputGroup>
          <CInputGroupText>$</CInputGroupText>
          <CFormInput
            type="number" min="0" step="0.01" placeholder="0.00"
            value={form.valor_cuota}
            onChange={e => {
              const v = e.target.value;
              set({ valor_cuota: v, total_estimado: cfg && v ? (parseFloat(v) * cfg.cuotas).toFixed(2) : '' });
            }}
          />
        </CInputGroup>
      </CCol>
      <CCol md={6} className="mb-3">
        <CFormLabel>
          Total estimado:
          {cfg && (
            <span className="text-muted ms-1" style={{ fontSize: '0.72rem' }}>
              ({cfg.cuotas} cuota{cfg.cuotas > 1 ? 's' : ''})
            </span>
          )}
        </CFormLabel>
        <CInputGroup>
          <CInputGroupText>$</CInputGroupText>
          <CFormInput
            type="number" min="0" step="0.01" placeholder="0.00"
            value={form.total_estimado}
            disabled={!form.tipo_pago}
            onChange={e => {
              const t = e.target.value;
              set({ total_estimado: t, valor_cuota: cfg && t && cfg.cuotas > 0 ? (parseFloat(t) / cfg.cuotas).toFixed(2) : '' });
            }}
          />
        </CInputGroup>
        {!form.tipo_pago && (
          <div className="text-muted" style={{ fontSize: '0.72rem', marginTop: '3px' }}>
            Seleccione tipo de pago primero
          </div>
        )}
      </CCol>

      <CCol md={6} className="mb-3">
        <CFormLabel>Valor de alta:</CFormLabel>
        <CInputGroup>
          <CInputGroupText>$</CInputGroupText>
          <CFormInput
            type="number" min="0" step="0.01" placeholder="0.00"
            value={form.valor_alta}
            onChange={e => set({ valor_alta: e.target.value })}
          />
        </CInputGroup>
      </CCol>
      <CCol md={6} className="mb-3">
        <CFormLabel>Fecha de solicitud: <span className="text-danger">*</span></CFormLabel>
        <CFormInput type="date" value={form.fecha_solicitud} onChange={e => set({ fecha_solicitud: e.target.value })} />
      </CCol>
      <CCol md={6} className="mb-3">
        <CFormLabel>Fecha de alta (Start Póliza):</CFormLabel>
        <CFormInput
          type="date"
          value={form.fecha_alta}
          onChange={e => {
            // Suggestions: liberación +93 días, vencimiento +1 año (kept if edited by hand)
            const fa = e.target.value;
            setForm(f => ({
              ...f,
              fecha_alta: fa,
              fecha_liberacion: f.fecha_liberacion === computeMatLiberacion(f.fecha_alta) || !f.fecha_liberacion
                ? computeMatLiberacion(fa) : f.fecha_liberacion,
              fecha_vencimiento: f.fecha_vencimiento === computeVidaVencimiento(f.fecha_alta) || !f.fecha_vencimiento
                ? computeVidaVencimiento(fa) : f.fecha_vencimiento,
            }));
          }}
        />
      </CCol>

      <CCol md={6} className="mb-3">
        <CFormLabel>Fecha de liberación:</CFormLabel>
        <CFormInput type="date" value={form.fecha_liberacion} onChange={e => set({ fecha_liberacion: e.target.value })} />
      </CCol>
      <CCol md={6} className="mb-3">
        <CFormLabel>Fecha de vencimiento:</CFormLabel>
        <CFormInput type="date" value={form.fecha_vencimiento} onChange={e => set({ fecha_vencimiento: e.target.value })} />
      </CCol>

      {rebuild && (
        <CCol xs={12}>
          <CAlert color="warning" className="py-2 mb-0 d-flex align-items-start gap-2">
            <CIcon icon={cilWarning} className="mt-1 flex-shrink-0" />
            <span>
              Cambiaste el tipo de pago o la fecha de alta: al guardar se volverán a calcular las cuotas ({nuevasCuotas}).
              {paidCount > 0 && (
                <> <strong>Se perderán {paidCount} pago{paidCount > 1 ? 's' : ''} ya registrado{paidCount > 1 ? 's' : ''} y sus comprobantes.</strong></>
              )}
            </span>
          </CAlert>
        </CCol>
      )}
    </CRow>
  );
};

export default SeguroFormFields;