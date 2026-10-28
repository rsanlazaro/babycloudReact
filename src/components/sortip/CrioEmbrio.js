// frontend/src/components/sortip/CrioEmbrio.js
// Sort_IPS → Crio embrio. Four lists, stored in the "crio" tab:
//   egg_donors      (max 10)  Egg Donor · Agencia · Catálogo
//   depositos       (max 4, 2 per viaje)  Viaje · Depósito · Fecha · Status
//   estimulaciones  (max 3)  Donor · Start Estimula · Captura · Proceso/Qtd · Split
//                             (Split → Owner Qtd · Spliter Qtd · Spliter = another IP)
//   crios                     Donor · Fecha Start · Fecha Final · Fecundados ·
//                             Desarrollo · NI · PGTA · Envío PGTA · Resultado (+PDF) · XY · XX
// Rules (also checked before saving): Desarrollo ≤ Fecundados, NI ≤ Desarrollo,
// XX + XY ≤ NI.

import React from 'react';
import { CButton, CBadge } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPlus, cilX, cilLink, cilCheckCircle, cilClock, cilWarning } from '@coreui/icons';
import IpDocControls from './IpDocControls';
import {
  CRIO_AGENCIAS, CRIO_CATALOGOS, CRIO_DEPOSITOS, CRIO_PROCESOS, CRIO_LIMITS, crioDateStatus, CRIO_MUESTRA,
  newEggDonor, newDeposito, newEstimulacion, newCrio, crioRowErrors,
} from '../../config/sortIpSections';

const Select = ({ id, value, options, onChange, disabled, placeholder = 'Seleccionar', ariaLabel, width }) => (
  <select id={id} className="crio-input" value={value || ''} disabled={disabled} aria-label={ariaLabel}
    onChange={e => onChange(e.target.value)} style={width ? { width } : undefined}>
    <option value="">{placeholder}</option>
    {options.map(o => (typeof o === 'object'
      ? <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
      : <option key={o} value={o}>{o}</option>))}
  </select>
);

const Input = ({ id, value, onChange, type = 'text', disabled, placeholder, ariaLabel, width, min }) => (
  <input id={id} type={type} className="crio-input" value={value ?? ''} disabled={disabled} placeholder={placeholder}
    aria-label={ariaLabel} min={min} onChange={e => onChange(e.target.value)} style={width ? { width } : undefined} />
);

// Date + its status ("Incluir Status"), calculated from the date:
// Programar (no date) → Programado (date set) → Revisar (date passed)
const STATUS_ICON = { programar: cilClock, programado: cilCheckCircle, revisar: cilWarning };
const DateStatus = ({ id, date, onDate, disabled, label }) => {
  const st = crioDateStatus(date);
  return (
    <span className="d-inline-flex align-items-center gap-1">
      <Input id={id} type="date" value={date} disabled={disabled} ariaLabel={label} onChange={onDate} width="140px" />
      <span className={`crio-status is-${st.key}`} aria-label={`Status de ${label}: ${st.label}`}>
        <CIcon icon={STATUS_ICON[st.key]} className="me-1" />{st.label}
      </span>
    </span>
  );
};

const AddButton = ({ onClick, disabled, label, note }) => (
  <div className="d-flex align-items-center gap-2 mt-1">
    <CButton size="sm" color="info" variant="ghost" className="rounded-circle p-1" onClick={onClick} disabled={disabled} title={label} aria-label={label}>
      <CIcon icon={cilPlus} />
    </CButton>
    <span className="crio-note">{note}</span>
  </div>
);

const RemoveButton = ({ onClick, label, disabled }) => (disabled ? null : (
  <CButton size="sm" color="danger" variant="ghost" className="px-1 py-0" onClick={onClick} title={label} aria-label={label}>
    <CIcon icon={cilX} />
  </CButton>
));

const CrioEmbrio = ({ data = {}, setField, disabled = false, ips = [], docProps, onOpenIp }) => {
  const eggDonors = data.egg_donors || [];
  const depositos = data.depositos || [];
  const estimulaciones = data.estimulaciones || [];
  const crios = data.crios || [];

  const updateList = (key, list) => setField(key, list);
  const updateRow = (key, list, idx, changes) => updateList(key, list.map((r, i) => (i === idx ? { ...r, ...changes } : r)));
  const removeRow = (key, list, idx) => updateList(key, list.filter((_, i) => i !== idx));

  const donorOptions = eggDonors.filter(d => d.codigo).map(d => d.codigo);
  const porViaje = (v) => depositos.filter(d => Number(d.viaje) === v).length;
  const viajeLibre = porViaje(1) < CRIO_LIMITS.depositosPorViaje ? 1 : porViaje(2) < CRIO_LIMITS.depositosPorViaje ? 2 : null;

  return (
    <div className="crio">
      {/* ── Egg donors + depósitos ── */}
      <div className="crio-top">
        <div className="crio-block">
          <div className="crio-grid crio-grid-donors crio-head">
            <span>Egg Donor</span><span>Agencia</span><span>Catálogo</span><span />
          </div>
          {eggDonors.map((d, idx) => (
            <div key={d.id} className="crio-grid crio-grid-donors">
              <Input value={d.codigo} disabled={disabled} ariaLabel={`Egg donor ${idx + 1}`} placeholder="Código"
                onChange={x => updateRow('egg_donors', eggDonors, idx, { codigo: x.toUpperCase() })} />
              <Select value={d.agencia} options={CRIO_AGENCIAS} disabled={disabled} ariaLabel={`Agencia ${idx + 1}`}
                onChange={x => updateRow('egg_donors', eggDonors, idx, { agencia: x })} />
              <Select value={d.catalogo} options={CRIO_CATALOGOS} disabled={disabled} ariaLabel={`Catálogo ${idx + 1}`}
                onChange={x => updateRow('egg_donors', eggDonors, idx, { catalogo: x })} />
              <RemoveButton disabled={disabled} label={`Quitar egg donor ${idx + 1}`} onClick={() => removeRow('egg_donors', eggDonors, idx)} />
            </div>
          ))}
          {!disabled && (
            <AddButton
              label="Agregar egg donor"
              disabled={eggDonors.length >= CRIO_LIMITS.eggDonors}
              onClick={() => updateList('egg_donors', [...eggDonors, newEggDonor()])}
              note={`${eggDonors.length} de ${CRIO_LIMITS.eggDonors} selecciones máx.`}
            />
          )}
          {/* Donor chosen for the program (Data IP → "Selec Dona") */}
          <div className="d-flex align-items-center gap-2 mt-2">
            <label htmlFor="crio-donante-sel" className="crio-label crio-strong">Donante seleccionado</label>
            <Select
              id="crio-donante-sel" value={data.donante_seleccionado} disabled={disabled || !donorOptions.length}
              options={donorOptions} placeholder={donorOptions.length ? 'Seleccionar' : 'Sin egg donors'} width="150px"
              ariaLabel="Donante seleccionado" onChange={x => setField('donante_seleccionado', x)}
            />
          </div>
        </div>

        <div className="crio-block crio-box">
          <div className="crio-grid crio-grid-dep crio-head">
            <span>Viaje</span><span>Depósito</span><span>Fecha</span><span />
          </div>
          {depositos.map((p, idx) => (
            <div key={p.id} className="crio-grid crio-grid-dep">
              <Select
                value={String(p.viaje || '')} disabled={disabled} ariaLabel={`Viaje del depósito ${idx + 1}`} placeholder="—" width="64px"
                options={[1, 2].map(v => ({
                  value: String(v), label: String(v),
                  disabled: Number(p.viaje) !== v && porViaje(v) >= CRIO_LIMITS.depositosPorViaje,
                }))}
                onChange={x => updateRow('depositos', depositos, idx, { viaje: Number(x) || '' })}
              />
              <Select value={p.deposito} options={CRIO_DEPOSITOS} disabled={disabled} ariaLabel={`Depósito ${idx + 1}`}
                onChange={x => updateRow('depositos', depositos, idx, { deposito: x })} />
              <DateStatus
                date={p.fecha} disabled={disabled} label={`Fecha del depósito ${idx + 1}`}
                onDate={x => updateRow('depositos', depositos, idx, { fecha: x })}
              />
              <RemoveButton disabled={disabled} label={`Quitar depósito ${idx + 1}`} onClick={() => removeRow('depositos', depositos, idx)} />
            </div>
          ))}
          {!disabled && (
            <AddButton
              label="Agregar depósito"
              disabled={depositos.length >= CRIO_LIMITS.depositos || !viajeLibre}
              onClick={() => updateList('depositos', [...depositos, newDeposito(viajeLibre)])}
              note={`${depositos.length} de ${CRIO_LIMITS.depositos} depósitos (${CRIO_LIMITS.depositosPorViaje} por viaje)`}
            />
          )}
        </div>
      </div>

      <hr className="crio-divider" />

      {/* ── Estimulaciones ── */}
      <div className="crio-block">
        {estimulaciones.map((e, idx) => {
          const spliter = ips.find(i => String(i.id) === String(e.spliter_ip_id));
          return (
            <div key={e.id} className="crio-stim">
              <div className="crio-line">
                <label className="crio-label">Donor Select</label>
                <Select value={e.donante} options={donorOptions} disabled={disabled} ariaLabel={`Donante de la estimulación ${idx + 1}`}
                  placeholder={donorOptions.length ? 'Seleccionar' : 'Sin egg donors'} width="130px"
                  onChange={x => updateRow('estimulaciones', estimulaciones, idx, { donante: x })} />
                <label className="crio-label">Start Estimula</label>
                <DateStatus date={e.start_estimula} disabled={disabled} label={`Start estimula ${idx + 1}`}
                  onDate={x => updateRow('estimulaciones', estimulaciones, idx, { start_estimula: x })} />
                <label className="crio-label">Captura</label>
                <DateStatus date={e.captura} disabled={disabled} label={`Captura ${idx + 1}`}
                  onDate={x => updateRow('estimulaciones', estimulaciones, idx, { captura: x })} />
                <label className="crio-check">
                  <input type="checkbox" checked={!!e.split} disabled={disabled}
                    onChange={ev => updateRow('estimulaciones', estimulaciones, idx, {
                      split: ev.target.checked, ...(ev.target.checked ? {} : { spliter_qtd: '', spliter_ip_id: '' }),
                    })} />
                  <span>Split</span>
                </label>
                <label className="crio-label">Proceso</label>
                <Select value={e.proceso} options={CRIO_PROCESOS} disabled={disabled} ariaLabel={`Proceso ${idx + 1}`} width="140px"
                  onChange={x => updateRow('estimulaciones', estimulaciones, idx, { proceso: x })} />
                <Input type="number" min="0" value={e.proceso_qtd} disabled={disabled} placeholder="Qtd" ariaLabel={`Cantidad del proceso ${idx + 1}`} width="64px"
                  onChange={x => updateRow('estimulaciones', estimulaciones, idx, { proceso_qtd: x })} />
                <label className="crio-label">Muestra</label>
                <Select value={e.muestra} options={CRIO_MUESTRA} disabled={disabled} ariaLabel={`Muestra ${idx + 1}`} width="100px"
                  onChange={x => updateRow('estimulaciones', estimulaciones, idx, { muestra: x })} />
                <label className="crio-label">MII</label>
                <Input type="number" min="0" value={e.mii} disabled={disabled} ariaLabel={`MII ${idx + 1}`} width="64px"
                  onChange={x => updateRow('estimulaciones', estimulaciones, idx, { mii: x })} />
                <RemoveButton disabled={disabled} label={`Quitar estimulación ${idx + 1}`} onClick={() => removeRow('estimulaciones', estimulaciones, idx)} />
              </div>
              {e.split && (
                <div className="crio-line crio-sub">
                  <label className="crio-label crio-strong">Owner</label>
                  <Input type="number" min="0" value={e.owner_qtd} disabled={disabled} placeholder="Qtd" ariaLabel={`Qtd owner ${idx + 1}`} width="80px"
                    onChange={x => updateRow('estimulaciones', estimulaciones, idx, { owner_qtd: x })} />
                  <label className="crio-label crio-strong ms-3">Spliter</label>
                  <Input type="number" min="0" value={e.spliter_qtd} disabled={disabled} placeholder="Qtd" ariaLabel={`Qtd spliter ${idx + 1}`} width="80px"
                    onChange={x => updateRow('estimulaciones', estimulaciones, idx, { spliter_qtd: x })} />
                  <Select
                    value={String(e.spliter_ip_id || '')} disabled={disabled} ariaLabel={`IP spliter ${idx + 1}`} width="240px"
                    placeholder="IP con quien se divide"
                    options={ips.map(i => ({ value: String(i.id), label: i.nombre_completo }))}
                    onChange={x => updateRow('estimulaciones', estimulaciones, idx, { spliter_ip_id: x })}
                  />
                  {spliter && (
                    <button type="button" className="btn btn-link btn-sm p-0 crio-link" onClick={() => onOpenIp?.(spliter.id)}>
                      <CIcon icon={cilLink} className="me-1" />{spliter.nombre_completo}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {!disabled && (
          <AddButton
            label="Agregar estimulación"
            disabled={estimulaciones.length >= CRIO_LIMITS.estimulaciones}
            onClick={() => updateList('estimulaciones', [...estimulaciones, newEstimulacion()])}
            note={`${estimulaciones.length} de ${CRIO_LIMITS.estimulaciones} estimulaciones máx.`}
          />
        )}
      </div>

      {/* ── Crio Embrio ── */}
      <div className="crio-block mt-3">
        {crios.map((c, idx) => {
          const errs = crioRowErrors(c);
          const resKey = `crio_${c.id}_resultado`;
          return (
            <div key={c.id} className="crio-stim">
              <div className="crio-line">
                <label className="crio-label">Crio Embrio</label>
                <Select value={c.donante} options={donorOptions} disabled={disabled} ariaLabel={`Donante del crio ${idx + 1}`}
                  placeholder="Donor" width="110px" onChange={x => updateRow('crios', crios, idx, { donante: x })} />
                <label className="crio-label crio-small">Fecha Start</label>
                <Input type="date" value={c.fecha_start} disabled={disabled} ariaLabel={`Fecha start ${idx + 1}`} width="140px"
                  onChange={x => updateRow('crios', crios, idx, { fecha_start: x })} />
                <label className="crio-label crio-small">Fecha Final</label>
                <DateStatus date={c.fecha_final} disabled={disabled} label={`Fecha final ${idx + 1}`}
                  onDate={x => updateRow('crios', crios, idx, { fecha_final: x })} />
                <label className="crio-label">Fecundados</label>
                <Input type="number" min="0" value={c.fecundados} disabled={disabled} ariaLabel={`Fecundados ${idx + 1}`} width="64px"
                  onChange={x => updateRow('crios', crios, idx, { fecundados: x })} />
                <label className="crio-label">Desarrollo</label>
                <Input type="number" min="0" value={c.desarrollo} disabled={disabled} ariaLabel={`Desarrollo ${idx + 1}`} width="64px"
                  onChange={x => updateRow('crios', crios, idx, { desarrollo: x })} />
                <label className="crio-label">NI</label>
                <Input type="number" min="0" value={c.ni} disabled={disabled} ariaLabel={`NI ${idx + 1}`} width="64px"
                  onChange={x => updateRow('crios', crios, idx, { ni: x })} />
                <label className="crio-label">PGTA</label>
                <Select value={c.pgta} options={['Sí', 'No']} disabled={disabled} ariaLabel={`PGTA ${idx + 1}`} width="96px"
                  onChange={x => updateRow('crios', crios, idx, { pgta: x })} />
                <RemoveButton disabled={disabled} label={`Quitar crio ${idx + 1}`} onClick={() => removeRow('crios', crios, idx)} />
              </div>
              <div className="crio-line crio-sub">
                <label className="crio-label">Envío PGTA</label>
                <Input type="date" value={c.envio_pgta} disabled={disabled || c.pgta !== 'Sí'} ariaLabel={`Envío PGTA ${idx + 1}`} width="140px"
                  onChange={x => updateRow('crios', crios, idx, { envio_pgta: x })} />
                <label className="crio-label">Resultado</label>
                <DateStatus date={c.resultado} disabled={disabled || c.pgta !== 'Sí'} label={`Resultado ${idx + 1}`}
                  onDate={x => updateRow('crios', crios, idx, { resultado: x })} />
                <IpDocControls label={`Resultado PGTA ${idx + 1}`} disabled={disabled || c.pgta !== 'Sí'} {...docProps(resKey, `Resultado PGTA — Crio ${idx + 1}`)} />
                <label className="crio-label ms-2">XY</label>
                <Input type="number" min="0" value={c.xy} disabled={disabled} ariaLabel={`XY ${idx + 1}`} width="64px"
                  onChange={x => updateRow('crios', crios, idx, { xy: x })} />
                <label className="crio-label">XX</label>
                <Input type="number" min="0" value={c.xx} disabled={disabled} ariaLabel={`XX ${idx + 1}`} width="64px"
                  onChange={x => updateRow('crios', crios, idx, { xx: x })} />
                <label className="crio-label ms-2">Estimado tr.</label>
                <IpDocControls label={`Estimado de transfer ${idx + 1}`} disabled={disabled} {...docProps(`crio_${c.id}_estimado`, `Estimado de transfer — Crio ${idx + 1}`)} />
              </div>
              {errs.length > 0 && (
                <div className="crio-errors" role="alert">{errs.map(m => <CBadge key={m} color="danger" className="me-1">{m}</CBadge>)}</div>
              )}
            </div>
          );
        })}
        {!disabled && (
          <AddButton label="Agregar crio embrio" onClick={() => updateList('crios', [...crios, newCrio()])}
            note="Desarrollo no puede rebasar los fecundados · NI no puede ser mayor a desarrollo · XX + XY no puede pasar NI" />
        )}
      </div>

      <style>{`
        .crio-top { display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-start; }
        .crio-block { min-width: 0; }
        .crio-box { border: 1px solid var(--cui-border-color, #d6d9dc); border-radius: 6px; padding: 8px 12px; }
        .crio-grid { display: grid; gap: 6px 10px; align-items: center; margin-bottom: 6px; }
        .crio-grid-donors { grid-template-columns: 120px 150px 150px 28px; }
        .crio-grid-dep { grid-template-columns: 64px 150px auto 28px; }
        .crio-head span { color: #2f7f89; font-size: 1.05rem; }
        .crio-label { color: #2f7f89; font-size: 1rem; margin: 0; white-space: nowrap; }
        .crio-strong { font-weight: 700; }
        .crio-small { font-size: .8rem; color: #6c757d; }
        .crio-input {
          border: 1px solid #c3c9cc; border-radius: 3px; padding: 3px 6px; font-size: .85rem;
          background: #f2f7ee; min-width: 0; max-width: 100%;
        }
        .crio-input:disabled { background: #eef0ef; color: #8a948f; }
        .crio-check { display: inline-flex; align-items: center; gap: 6px; color: #2f7f89; margin: 0; }
        .crio-check input { width: 16px; height: 16px; accent-color: #2f7f89; }
        .crio-line { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; }
        .crio-stim { padding: 6px 0; border-bottom: 1px solid var(--cui-border-color-translucent, #eceff1); }
        .crio-sub { background: var(--cui-tertiary-bg, #eceeee); padding: 4px 8px; margin-top: 4px; border-radius: 3px; }
        .crio-link { color: #2f7f89; }
        .crio-note { font-size: .75rem; color: #6c757d; border: 1px solid #d6d9dc; border-radius: 3px; padding: 1px 8px; }
        .crio-divider { border-top: 2px solid #2f8b96; opacity: 1; margin: 18px 0; }
        .crio-errors { margin-top: 4px; }
        .crio-status { font-size: .78rem; font-weight: 700; font-style: italic; white-space: nowrap; min-width: 100px; }
        .crio-status.is-programar { color: #6c757d; }
        .crio-status.is-programado { color: #198754; }
        .crio-status.is-revisar { color: #dc3545; }
      `}</style>
    </div>
  );
};

export default CrioEmbrio;