// frontend/src/components/sortip/ProyectoParental.js
// Sort_IPS → Crio embrio tab → "Proyecto parental" (saved in the crio section,
// with "Guardar cambios"). The IP also fills it in Baby Cloud → Mis datos.
//
//   programa_tipo         Single | Double
//   captura_tipo          Full | Split
//   seleccion_donante     Fenotipo | Catálogo
//   categoria_donante     "Fenotipo" when Selección donante is Fenotipo;
//                         one of the catálogos (VIP, Diamante…) when it is Catálogo
//   preferencia_embarazo  Único | Gemelar
//   lavado_semen          Sí | No

import React from 'react';
import { CRow, CCol, CFormLabel, CFormSelect } from '@coreui/react';
import {
  PROGRAMA_TIPOS, CAPTURA_TIPOS, SELECCION_DONANTE, EMBARAZO_PREFERENCIAS, SI_NO, categoriaDonanteOptions,
} from '../../config/sortIpSections';

const Field = ({ id, label, value, options, onChange, disabled, placeholder = 'Seleccionar...' }) => (
  <>
    <CFormLabel htmlFor={id} className="mb-1">{label}:</CFormLabel>
    <CFormSelect id={id} value={value || ''} disabled={disabled} onChange={e => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
      {/* a value no longer in the list is kept visible */}
      {value && !options.includes(value) && <option value={value}>{value}</option>}
    </CFormSelect>
  </>
);

const ProyectoParental = ({ data = {}, setField, disabled = false }) => {
  const seleccion = data.seleccion_donante || '';
  const catOptions = categoriaDonanteOptions(seleccion);

  // Fenotipo → Categoría donante is also "Fenotipo"; Catálogo → choose a catálogo
  const changeSeleccion = (v) => {
    setField('seleccion_donante', v);
    if (v === 'Fenotipo') {
      setField('categoria_donante', 'Fenotipo');
      // Egg donors (Crio embrio): Agencia Fenotipo, no catálogo
      if (Array.isArray(data.egg_donors) && data.egg_donors.length) {
        setField('egg_donors', data.egg_donors.map(d => ({ ...d, agencia: 'Fenotipo', catalogo: '' })));
      }
    }
    else if (!categoriaDonanteOptions(v).includes(data.categoria_donante)) setField('categoria_donante', '');
  };

  return (
    <div className="mb-4">
      <h6 className="fw-bold pb-1 mb-3" style={{ color: '#5b2bd9', borderBottom: '2px solid #e2d8fb' }}>
        Proyecto parental
        <small className="text-muted fw-normal ms-2">También lo llena el IP en Baby Cloud → Mis datos</small>
      </h6>
      <CRow className="g-3">
        <CCol md={4}>
          <Field id="pp-programa" label="Tipo programa" value={data.programa_tipo} options={PROGRAMA_TIPOS}
            disabled={disabled} onChange={v => setField('programa_tipo', v)} />
        </CCol>
        <CCol md={4}>
          <Field id="pp-captura" label="Tipo captura" value={data.captura_tipo} options={CAPTURA_TIPOS}
            disabled={disabled} onChange={v => setField('captura_tipo', v)} />
        </CCol>
        <CCol md={4}>
          <Field id="pp-embarazo" label="Preferencia embarazo" value={data.preferencia_embarazo} options={EMBARAZO_PREFERENCIAS}
            disabled={disabled} onChange={v => setField('preferencia_embarazo', v)} />
        </CCol>
        <CCol md={4}>
          <Field id="pp-seleccion" label="Selección donante" value={seleccion} options={SELECCION_DONANTE}
            disabled={disabled} onChange={changeSeleccion} />
        </CCol>
        <CCol md={4}>
          <Field id="pp-categoria" label="Categoría donante" value={data.categoria_donante} options={catOptions}
            disabled={disabled || seleccion !== 'Catálogo'}
            placeholder={seleccion ? 'Seleccionar...' : 'Elige primero la selección'}
            onChange={v => setField('categoria_donante', v)} />
        </CCol>
        <CCol md={4}>
          <Field id="pp-lavado" label="Lavado de semen" value={data.lavado_semen} options={SI_NO}
            disabled={disabled} onChange={v => setField('lavado_semen', v)} />
        </CCol>
      </CRow>
    </div>
  );
};

export default ProyectoParental;