// frontend/src/components/sortip/ViajesRegistro.js
// Sort_IPS → Alta IP → "Registro de viajes".
// One card per trip, laid out like the reference design:
//   left  → Primer viaje / Con material genético (sin viaje),
//           Llegada (fecha, hora, no. de vuelo) · Salida (fecha, hora, no.),
//           "Confirmar vuelo"
//   right → Hospedaje (Hotel / Airbnb / Otro), Calle/No, CP, Colonia,
//           Complemento, Hotel, Room
// The list is part of the Alta IP data (`viajes`), so it is saved with
// "Guardar cambios" like every other field.

import React from 'react';
import { CRow, CCol, CButton, CBadge } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPlus, cilTrash, cilFlightTakeoff, cilCheckCircle } from '@coreui/icons';
import { HOSPEDAJE_TIPOS, newViaje } from '../../config/sortIpSections';

// Width of the lodging labels' column (fits "Complemento")
const LODGING_LABEL = '118px';

const formatDMY = (v) => {
  const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
};

// One labelled input: label on the left, input on the right (as in the design)
// labelWidth: fixed label column so inputs line up (e.g. the lodging side)
const Field = ({ id, label, value, onChange, type = 'text', disabled, width, placeholder, labelWidth }) => (
  <div className="viaje-field">
    <label htmlFor={id} className="viaje-label" style={labelWidth ? { minWidth: labelWidth } : undefined}>{label}</label>
    <input
      id={id}
      type={type}
      className="viaje-input"
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      style={width ? { maxWidth: width } : undefined}
    />
  </div>
);

const Check = ({ id, label, checked, onChange, disabled, strong }) => (
  <label htmlFor={id} className={`viaje-check${strong ? ' is-strong' : ''}`}>
    <input id={id} type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)} disabled={disabled} />
    <span>{label}</span>
  </label>
);

// sinViaje / onSinViajeChange: "Continuar con el programa sin viajar" (register
// level). While on, the trips are kept but not shown or required.
const ViajesRegistro = ({ viajes = [], onChange, disabled = false, notify, sinViaje = false, onSinViajeChange }) => {
  const update = (idx, changes) => onChange(viajes.map((v, i) => (i === idx ? { ...v, ...changes } : v)));
  const add = () => onChange([...viajes, newViaje(viajes.length === 0)]);
  const remove = (idx) => {
    if (!window.confirm('¿Eliminar este viaje? Se quitará al guardar los cambios.')) return;
    onChange(viajes.filter((_, i) => i !== idx));
  };

  // "Confirmar vuelo" has no conditions: it can be pressed at any time
  const confirmarVuelo = (idx) => {
    update(idx, { vuelo_confirmado: true, vuelo_confirmado_en: new Date().toLocaleDateString('en-CA') });
  };

  const sinViajeSwitch = onSinViajeChange && (
    <label htmlFor="viajes-sin-viaje" className="viaje-sinviaje mb-3">
      <input
        id="viajes-sin-viaje" type="checkbox" checked={!!sinViaje} disabled={disabled}
        onChange={e => onSinViajeChange(e.target.checked)}
      />
      <span>
        <strong>Continuar con el programa sin viajar</strong>
        <small className="d-block text-muted">El IP no viaja (por ejemplo, envía su material genético). No se piden viajes ni vuelos.</small>
      </span>
    </label>
  );

  if (sinViaje) {
    return (
      <div>
        {sinViajeSwitch}
        <div className="viaje-sinviaje-note">
          El programa continúa <strong>sin viaje</strong>.
          {viajes.length > 0 && ` Los ${viajes.length} viaje(s) capturados se conservan; desmarca la opción para verlos.`}
        </div>
        <style>{`
          .viaje-sinviaje { display: flex; align-items: flex-start; gap: 10px; cursor: pointer; color: #2f7f89; }
          .viaje-sinviaje input { width: 18px; height: 18px; margin-top: 3px; accent-color: #2f7f89; }
          .viaje-sinviaje-note { background: #e8f3f4; border: 1px dashed #2f8b96; border-radius: 6px; padding: 10px 14px; color: #24434a; }
        `}</style>
      </div>
    );
  }

  return (
    <div>
      {sinViajeSwitch}
      {viajes.length === 0 && (
        <p className="text-muted small mb-3">No hay viajes registrados.</p>
      )}

      {viajes.map((v, idx) => {
        const sinViaje = !!v.con_material_genetico;
        const flightDisabled = disabled || sinViaje;
        const pid = `viaje-${v.id || idx}`;
        return (
          <div key={v.id || idx} className="viaje-card mb-3">
            {/* Card header: number, status, delete */}
            <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                <strong className="viaje-title"><CIcon icon={cilFlightTakeoff} className="me-1" />Viaje {idx + 1}</strong>
                {sinViaje && <CBadge color="secondary">Sin viaje</CBadge>}
                {v.vuelo_confirmado && (
                  <CBadge color="success">
                    <CIcon icon={cilCheckCircle} className="me-1" />
                    Vuelo confirmado{v.vuelo_confirmado_en ? ` · ${formatDMY(v.vuelo_confirmado_en)}` : ''}
                  </CBadge>
                )}
              </div>
              {!disabled && (
                <CButton size="sm" color="danger" variant="ghost" onClick={() => remove(idx)} title="Eliminar viaje" aria-label={`Eliminar viaje ${idx + 1}`}>
                  <CIcon icon={cilTrash} />
                </CButton>
              )}
            </div>

            <CRow className="g-3">
              {/* ── Left: trip type + flights ── */}
              <CCol lg={6} className="viaje-left">
                <div className="d-flex flex-wrap gap-3 mb-3">
                  {/* Trip type — one option at a time */}
                  <Check
                    id={`${pid}-primer`} label="Primer Viaje" strong
                    checked={v.primer_viaje} disabled={disabled}
                    onChange={c => update(idx, { primer_viaje: c, ...(c ? { segundo_viaje: false, con_material_genetico: false } : {}) })}
                  />
                  <Check
                    id={`${pid}-segundo`} label="Segundo Viaje" strong
                    checked={v.segundo_viaje} disabled={disabled}
                    onChange={c => update(idx, { segundo_viaje: c, ...(c ? { primer_viaje: false, con_material_genetico: false } : {}) })}
                  />
                  <Check
                    id={`${pid}-material`} label={<em>Con Material Genético (Sin Viaje)</em>} strong
                    checked={v.con_material_genetico} disabled={disabled}
                    onChange={c => update(idx, {
                      con_material_genetico: c,
                      ...(c ? { primer_viaje: false, segundo_viaje: false } : {}),
                    })}
                  />
                </div>

                <CRow className="g-3">
                  <CCol sm={6}>
                    <div className="viaje-subtitle">Llegada</div>
                    <Field id={`${pid}-ll-fecha`} label="Fecha" type="date" value={v.llegada_fecha} disabled={flightDisabled} onChange={x => update(idx, { llegada_fecha: x })} />
                    <Field id={`${pid}-ll-hora`} label="Hora" type="time" value={v.llegada_hora} disabled={flightDisabled} onChange={x => update(idx, { llegada_hora: x })} />
                    <Field id={`${pid}-ll-no`} label="No" value={v.llegada_vuelo} disabled={flightDisabled} width="110px" placeholder="Vuelo" onChange={x => update(idx, { llegada_vuelo: x.toUpperCase() })} />
                  </CCol>
                  <CCol sm={6}>
                    <div className="viaje-subtitle">Salida</div>
                    <Field id={`${pid}-sa-fecha`} label="Fecha" type="date" value={v.salida_fecha} disabled={flightDisabled} onChange={x => update(idx, { salida_fecha: x })} />
                    <Field id={`${pid}-sa-hora`} label="Hora" type="time" value={v.salida_hora} disabled={flightDisabled} onChange={x => update(idx, { salida_hora: x })} />
                    <Field id={`${pid}-sa-no`} label="No" value={v.salida_vuelo} disabled={flightDisabled} width="110px" placeholder="Vuelo" onChange={x => update(idx, { salida_vuelo: x.toUpperCase() })} />
                  </CCol>
                </CRow>

                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-2">
                  {/* Itinerary sent to the IP (Data IP → "Itinerario": Confirmar → Enviar → Enviado) */}
                  <Check
                    id={`${pid}-itinerario`}
                    label={v.itinerario_enviado
                      ? `Itinerario enviado${v.itinerario_enviado_en ? ` · ${formatDMY(v.itinerario_enviado_en)}` : ''}`
                      : 'Itinerario enviado'}
                    checked={v.itinerario_enviado} disabled={disabled}
                    onChange={c => update(idx, {
                      itinerario_enviado: c,
                      itinerario_enviado_en: c ? new Date().toLocaleDateString('en-CA') : '',
                    })}
                  />
                  {v.vuelo_confirmado ? (
                    !disabled && (
                      <button type="button" className="btn btn-link btn-sm p-0 text-muted"
                        onClick={() => update(idx, { vuelo_confirmado: false, vuelo_confirmado_en: '' })}>
                        Quitar confirmación
                      </button>
                    )
                  ) : (
                    <button type="button" className="viaje-confirm" disabled={disabled} onClick={() => confirmarVuelo(idx)}>
                      Confirmar vuelo
                    </button>
                  )}
                </div>
              </CCol>

              {/* ── Right: lodging ── */}
              <CCol lg={6} className="viaje-right">
                <div className="d-flex align-items-center flex-wrap gap-3 mb-2">
                  <span className="viaje-label viaje-label-lg">Hospedaje</span>
                  {HOSPEDAJE_TIPOS.map(t => (
                    <Check
                      key={t.value} id={`${pid}-hosp-${t.value}`} label={t.label}
                      checked={v.hospedaje_tipo === t.value} disabled={disabled}
                      // one option at a time; clicking the checked one clears it
                      onChange={c => update(idx, { hospedaje_tipo: c ? t.value : '' })}
                    />
                  ))}
                </div>
                <Field id={`${pid}-calle`} label="Calle/No" labelWidth={LODGING_LABEL} value={v.hospedaje_calle_no} disabled={disabled} onChange={x => update(idx, { hospedaje_calle_no: x })} />
                <div className="d-flex gap-3 flex-wrap">
                  <div style={{ flex: '0 1 200px' }}>
                    <Field id={`${pid}-cp`} label="CP" labelWidth={LODGING_LABEL} value={v.hospedaje_cp} disabled={disabled} onChange={x => update(idx, { hospedaje_cp: x })} />
                  </div>
                  <div style={{ flex: '1 1 240px' }}>
                    <Field id={`${pid}-colonia`} label="Colonia" labelWidth="auto" value={v.hospedaje_colonia} disabled={disabled} onChange={x => update(idx, { hospedaje_colonia: x })} />
                  </div>
                </div>
                <Field id={`${pid}-complemento`} label="Complemento" labelWidth={LODGING_LABEL} value={v.hospedaje_complemento} disabled={disabled} onChange={x => update(idx, { hospedaje_complemento: x })} />
                {/* Hotel name + room: only when the lodging is a hotel */}
                {v.hospedaje_tipo === 'hotel' && (
                  <div className="d-flex gap-3 flex-wrap">
                    <div style={{ flex: '1 1 260px' }}>
                      <Field id={`${pid}-hotel`} label="Hotel" labelWidth={LODGING_LABEL} value={v.hospedaje_hotel} disabled={disabled} placeholder="Nombre del hotel" onChange={x => update(idx, { hospedaje_hotel: x })} />
                    </div>
                    <div style={{ flex: '0 1 200px' }}>
                      <Field id={`${pid}-room`} label="Room" labelWidth="auto" value={v.hospedaje_room} disabled={disabled} onChange={x => update(idx, { hospedaje_room: x })} />
                    </div>
                  </div>
                )}
              </CCol>
            </CRow>
          </div>
        );
      })}

      {!disabled && (
        <CButton size="sm" color="info" variant="outline" onClick={add}>
          <CIcon icon={cilPlus} className="me-1" />Agregar viaje
        </CButton>
      )}

      <style>{`
        .viaje-sinviaje { display: flex; align-items: flex-start; gap: 10px; cursor: pointer; color: #2f7f89; }
        .viaje-sinviaje input { width: 18px; height: 18px; margin-top: 3px; accent-color: #2f7f89; }
        .viaje-card {
          background: #d9e7cb;
          border: 1px solid #c3d6b2;
          border-radius: 8px;
          padding: 12px 16px;
        }
        .viaje-title { color: #2f7f89; }
        .viaje-subtitle { color: #2f7f89; font-weight: 700; font-size: .9rem; margin: 0 0 6px 0; }
        .viaje-label { color: #3b8f99; font-size: 1.05rem; white-space: nowrap; min-width: 62px; }
        .viaje-label-lg { font-size: 1.15rem; }
        .viaje-field { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .viaje-input {
          flex: 1 1 auto; min-width: 0; width: 100%;
          background: #e9f0e3; border: 1px solid #9aa996; border-radius: 3px;
          padding: 3px 8px; font-size: .9rem; color: #24434a;
        }
        .viaje-input:focus { outline: 2px solid #3b8f99; outline-offset: 0; border-color: #3b8f99; }
        .viaje-input:disabled { background: #dfe7d8; color: #8a988a; }
        .viaje-check { display: inline-flex; align-items: center; gap: 6px; color: #3b8f99; margin: 0; cursor: pointer; }
        .viaje-check input { width: 18px; height: 18px; accent-color: #3b8f99; cursor: pointer; }
        .viaje-check.is-strong { font-weight: 700; }
        .viaje-confirm {
          background: #3fbfbd; color: #fff; border: none; border-radius: 6px;
          padding: 3px 14px; font-size: .8rem; font-weight: 600;
        }
        .viaje-confirm:hover:not(:disabled) { background: #2fa8a6; }
        .viaje-confirm:disabled { opacity: .5; cursor: not-allowed; }
        @media (min-width: 992px) {
          .viaje-left { border-right: 4px solid #2f8b96; padding-right: 20px; }
          .viaje-right { padding-left: 20px; }
        }
      `}</style>
    </div>
  );
};

export default ViajesRegistro;