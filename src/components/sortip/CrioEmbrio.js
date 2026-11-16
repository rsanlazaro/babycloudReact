// frontend/src/components/sortip/CrioEmbrio.js
// Sort_IPS → Crio embrio. Four lists, stored in the "crio" tab:
//   egg_donors      (max 10)  Egg Donor · Agencia · Catálogo
//   depositos       (no limit: any trip number, any number per trip)  Viaje · Depósito · Fecha · Status
//   estimulaciones  (max 3)  Donor · Start Estimula · Captura · Proceso/Qtd · Split
//                             (Split → Owner Qtd · Spliter Qtd · Spliter = another IP)
//   crios                     Donor · Fecha Start · Fecha Final · Fecundados ·
//                             Desarrollo · NI · PGTA · Envío PGTA · Resultado (+PDF) · XY · XX
// Rules (also checked before saving): Desarrollo ≤ Fecundados, NI ≤ Desarrollo,
// XX + XY ≤ NI.

import React from 'react';
import { CButton, CBadge, CTooltip } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPlus, cilX, cilLink, cilCheckCircle, cilClock, cilWarning, cilBan, cilCheckAlt, cilFork, cilLockLocked, cilMediaStop, cilMediaPlay } from '@coreui/icons';
import IpDocControls from './IpDocControls';
import {
  CRIO_AGENCIAS, CRIO_CATALOGOS, CRIO_DEPOSITOS, CRIO_LIMITS, crioDateStatus,
  newEggDonor, newDeposito, newEstimulacion, newCrio, newWashing, washingConfirmado, depositoStatus, crioRowErrors, estimulacionErrors, crioEnvioBiopsia, crioEstimOptions,
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

// ✓ Confirm a captured value (stored as <field>_ok). An empty field cannot be
// confirmed, and changing the value clears its confirmation (see withOk).
const ConfirmButton = ({ on, onChange, disabled, empty, label }) => (
  <button
    type="button" className={`crio-confirm${on ? ' is-on' : ''}`} disabled={disabled || empty}
    aria-pressed={!!on} aria-label={`Confirmar ${label}`}
    title={on ? `${label} confirmado${disabled ? '' : ' (clic para quitar)'}` : empty ? `Captura primero ${label}` : `Confirmar ${label}`}
    onClick={() => onChange(!on)}
  >
    <CIcon icon={cilCheckAlt} />
  </button>
);
// A value change → its confirmation is cleared
const withOk = (key, value) => ({ [key]: value, [`${key}_ok`]: false });
const OK_KEY = { owner_qtd: 'owner_ok', spliter_qtd: 'spliter_ok' };
const withQtyOk = (key, value) => ({ [key]: value, [OK_KEY[key]]: false });

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

// Estimulación: cancel / accept the process (estado '' | 'cancelado' | 'aceptado');
// clicking the active one again clears it
const EstadoButtons = ({ estado, onChange, disabled, idx }) => (
  <span className="crio-estado">
    <button type="button" className={`crio-estado-btn is-cancel${estado === 'cancelado' ? ' is-on' : ''}`} disabled={disabled}
      title="Cancelar proceso" aria-label={`Cancelar proceso ${idx + 1}`} aria-pressed={estado === 'cancelado'}
      onClick={() => onChange(estado === 'cancelado' ? '' : 'cancelado')}>
      <CIcon icon={cilBan} />
    </button>
    <button type="button" className={`crio-estado-btn is-ok${estado === 'aceptado' ? ' is-on' : ''}`} disabled={disabled}
      title="Aceptar proceso" aria-label={`Aceptar proceso ${idx + 1}`} aria-pressed={estado === 'aceptado'}
      onClick={() => onChange(estado === 'aceptado' ? '' : 'aceptado')}>
      <CIcon icon={cilCheckAlt} />
    </button>
  </span>
);
const ESTADO_LABEL = { cancelado: 'Cancelado', aceptado: 'Aceptado' };

// Washing: stop / continue the process (estado '' | 'detenido' | 'en_curso');
// clicking the active one again clears it
const WashButtons = ({ estado, onChange, disabled, idx }) => (
  <span className="crio-estado">
    <button type="button" className={`crio-wash-btn is-stop${estado === 'detenido' ? ' is-on' : ''}`} disabled={disabled}
      title="Detener washing" aria-label={`Detener washing ${idx + 1}`} aria-pressed={estado === 'detenido'}
      onClick={() => onChange(estado === 'detenido' ? '' : 'detenido')}>
      <CIcon icon={cilMediaStop} />
    </button>
    <button type="button" className={`crio-wash-btn is-play${estado === 'en_curso' ? ' is-on' : ''}`} disabled={disabled}
      title="Continuar washing" aria-label={`Continuar washing ${idx + 1}`} aria-pressed={estado === 'en_curso'}
      onClick={() => onChange(estado === 'en_curso' ? '' : 'en_curso')}>
      <CIcon icon={cilMediaPlay} />
    </button>
  </span>
);

// Generic two-button state (clicking the active one again clears it)
//   kind 'playStop': '' | 'detenido' | 'en_curso'   (■ stop / ▶ play)
//   kind 'cancelOk': '' | 'cancelado' | 'confirmado' (⊘ cancel / ✓ confirm)
const TWO = {
  playStop: [
    { v: 'detenido', icon: cilMediaStop, cls: 'crio-wash-btn is-stop', verb: 'Detener' },
    { v: 'en_curso', icon: cilMediaPlay, cls: 'crio-wash-btn is-play', verb: 'Iniciar' },
  ],
  cancelOk: [
    { v: 'cancelado', icon: cilBan, cls: 'crio-estado-btn is-cancel', verb: 'Cancelar' },
    { v: 'confirmado', icon: cilCheckAlt, cls: 'crio-estado-btn is-ok', verb: 'Confirmar' },
  ],
  cierre: [
    { v: 'anulada', icon: cilMediaStop, cls: 'crio-wash-btn is-stop', verb: 'Anular' },
    { v: 'concluida', icon: cilMediaPlay, cls: 'crio-wash-btn is-play', verb: 'Concluir' },
  ],
};
const TwoState = ({ kind, value, onChange, disabled, label }) => (
  <span className="crio-estado">
    {TWO[kind].map(b => (
      <button key={b.v} type="button" className={`${b.cls}${value === b.v ? ' is-on' : ''}`} disabled={disabled}
        title={`${b.verb} ${label}`} aria-label={`${b.verb} ${label}`} aria-pressed={value === b.v}
        onClick={() => onChange(value === b.v ? '' : b.v)}>
        <CIcon icon={b.icon} />
      </button>
    ))}
  </span>
);
const ESTADO_TXT = { detenido: 'Detenido', en_curso: 'En curso', cancelado: 'Cancelado', confirmado: 'Confirmado', anulada: 'Anulada', concluida: 'Concluida' };

// Aparta donor (month) · Reserva donor · Start aco · Stop aco: label + input +
// state buttons (+ state text), as two cells of an estimulación column
const ExtraField = ({ e, fieldKey, label, type, kind, up, disabled, n }) => {
  const estadoKey = fieldKey === 'aparta_donor' ? 'aparta_estado' : `${fieldKey}_estado`;
  const st = e[estadoKey];
  return (
    <>
      <label className="crio-label" htmlFor={`stim-${fieldKey}-${e.id}`}>{label}</label>
      <span className="crio-extra">
        <Input id={`stim-${fieldKey}-${e.id}`} type={type} value={e[fieldKey]} disabled={disabled} width={type === 'month' ? '150px' : '130px'}
          ariaLabel={`${label} ${n}`} onChange={x => up({ [fieldKey]: x })} />
        <TwoState kind={kind} value={st} disabled={disabled} label={`${label} ${n}`} onChange={v => up({ [estadoKey]: v })} />
        {st && <span className={`crio-extra-st is-${st}`}>{ESTADO_TXT[st]}</span>}
      </span>
    </>
  );
};

const CrioEmbrio = ({ data = {}, setField, disabled = false, ips: allIps = [], currentIpId, docProps, onOpenIp, soloResultados = false }) => {
  // The other IPs only: this register never appears as Owner / Spliter of
  // itself, and there is no link to the profile already open
  const ips = allIps.filter(i => String(i.id) !== String(currentIpId));
  // soloResultados → Alta IP has a trip "Con Material Genético (Sin Viaje)":
  // everything is locked except XX, XY and NI (Creación Embrionaria)
  const locked = disabled || soloResultados;
  const eggDonors = data.egg_donors || [];
  const depositos = data.depositos || [];
  const estimulaciones = data.estimulaciones || [];
  const crios = data.crios || [];
  // Washing (Proyecto parental → Lavado de semen "Sí"): until a Final date is
  // confirmed, Estimulaciones and Creación Embrionaria are blocked
  const conWashing = data.lavado_semen === 'Sí';
  const washings = data.washings || [];
  const washList = washings.length ? washings : [{ ...newWashing(), id: 'w-1' }];   // one row shown from the start
  const washBlocked = conWashing && !washingConfirmado(washings);
  const procLocked = locked || washBlocked;
  const procDisabled = disabled || washBlocked;
  const updateList = (key, list) => setField(key, list);
  const updateRow = (key, list, idx, changes) => updateList(key, list.map((r, i) => (i === idx ? { ...r, ...changes } : r)));
  const removeRow = (key, list, idx) => updateList(key, list.filter((_, i) => i !== idx));

  const donorOptions = eggDonors.filter(d => d.codigo).map(d => d.codigo);
  // Proyecto parental → Selección donante "Fenotipo": every egg donor's Agencia
  // is Fenotipo (fixed) and there is no catálogo
  const fenotipo = data.seleccion_donante === 'Fenotipo';
  // Estimulaciones Ovarias/Captura: available once there is at least one
  // Código donor and one Viaje (depósito). Donor = ONLY this register's egg
  // donors (chosen by the IP or added by a platform user).
  const stimReady = donorOptions.length > 0 && depositos.length > 0;
  const ownCodes = [...new Set(donorOptions)];
  const ownOrigen = (c) => (eggDonors.some(d => d.codigo === c && d.ip_opcion) ? 'IP' : 'AG');
  // Other IPs' estimulaciones split with this IP (ips[].splitsWithMe, from SortIP.js)
  const splitsWithMe = ips.flatMap(i => (i.splitsWithMe || []).map(e => ({ owner: i, e })));
  // Creación Embrionaria → Donor/Split: own estimulaciones + received splits
  const estimOptions = crioEstimOptions(estimulaciones, splitsWithMe);
  // A new deposit starts with the trip of the last one (editable)
  const ultimoViaje = Number(depositos[depositos.length - 1]?.viaje) || 1;
  const numViajes = new Set(depositos.map(d => Number(d.viaje)).filter(Boolean)).size;

  return (
    <div className="crio">
      {soloResultados && !disabled && (
        <div className="crio-lock-note" role="note">
          <CIcon icon={cilWarning} className="me-2 flex-shrink-0" />
          <span>
            <strong>Con Material Genético (Sin Viaje)</strong> marcado en Alta IP: Crio embrio está bloqueado.
            Solo se pueden capturar <strong>XX, XY y NI</strong> en Creación Embrionaria.
          </span>
        </div>
      )}
      {/* ── Egg donors + depósitos ── */}
      <div className="crio-top">
        <div className="crio-block">
          <div className="crio-grid crio-grid-donors crio-head">
            <span>Egg Donor</span><span>Agencia</span><span>Catálogo</span><span title="Quién registró la opción: IP (en Baby Cloud) o AG (usuario de la plataforma)">Origen</span><span />
          </div>
          {eggDonors.map((d, idx) => {
            // Options chosen by the IP in Baby Cloud are read-only here (the IP changes them in Mis datos)
            const fromIp = !!d.ip_opcion;
            const rowLocked = locked || fromIp;
            const agencia = fenotipo ? 'Fenotipo' : d.agencia;
            const sinCatalogo = agencia === 'Fenotipo';
            return (
            <div key={d.id} className={`crio-grid crio-grid-donors${fromIp ? ' crio-row-ip' : ''}`}
              title={fromIp && !locked ? 'Elegida por el IP en Baby Cloud: solo el IP puede modificarla' : undefined}>
              <Input value={d.codigo} disabled={rowLocked} ariaLabel={`Egg donor ${idx + 1}`} placeholder="Código"
                onChange={x => updateRow('egg_donors', eggDonors, idx, { codigo: x.toUpperCase() })} />
              <Select value={agencia} options={CRIO_AGENCIAS} disabled={rowLocked || fenotipo} ariaLabel={`Agencia ${idx + 1}`}
                onChange={x => updateRow('egg_donors', eggDonors, idx, { agencia: x, ...(x === 'Fenotipo' ? { catalogo: '' } : {}) })} />
              <Select value={sinCatalogo ? '' : d.catalogo} options={CRIO_CATALOGOS} disabled={rowLocked || sinCatalogo} ariaLabel={`Catálogo ${idx + 1}`}
                onChange={x => updateRow('egg_donors', eggDonors, idx, { catalogo: x })} />
              {/* Who registered this option: the IP (Baby Cloud → Mis datos) or a platform user */}
              {d.ip_opcion
                ? <span className="crio-origen is-ip" title={`Opción ${d.ip_opcion} elegida por el IP en Baby Cloud`}>IP</span>
                : <span className="crio-origen is-ag" title="Registrada por un usuario de la plataforma">AG</span>}
              {fromIp && !locked
                ? <CIcon icon={cilLockLocked} className="crio-ip-lock" title="Solo el IP puede modificarla" />
                : <RemoveButton disabled={rowLocked} label={`Quitar egg donor ${idx + 1}`} onClick={() => removeRow('egg_donors', eggDonors, idx)} />}
            </div>
            );
          })}
          {!locked && (
            <AddButton
              label="Agregar egg donor"
              disabled={eggDonors.length >= CRIO_LIMITS.eggDonors}
              onClick={() => updateList('egg_donors', [...eggDonors, { ...newEggDonor(), ...(fenotipo ? { agencia: 'Fenotipo' } : {}) }])}
              note={`${eggDonors.length} de ${CRIO_LIMITS.eggDonors} selecciones máx.`}
            />
          )}
        </div>

        <div className="crio-block crio-box">
          <div className="crio-grid crio-grid-dep crio-head">
            <span>Viaje</span><span>Depósito</span><span>Fecha</span><span /><span />
          </div>
          {depositos.map((p, idx) => (
            <div key={p.id} className="crio-grid crio-grid-dep">
              <Input
                type="number" min={1} value={p.viaje} disabled={locked} ariaLabel={`Viaje del depósito ${idx + 1}`} placeholder="—" width="64px"
                onChange={x => updateRow('depositos', depositos, idx, { viaje: x === '' ? '' : Math.max(1, Math.floor(Number(x)) || 1) })}
              />
              <Select value={p.deposito} options={CRIO_DEPOSITOS} disabled={locked} ariaLabel={`Depósito ${idx + 1}`}
                onChange={x => updateRow('depositos', depositos, idx, { deposito: x, deposito_ok: false })} />
              {/* Status: no date → Programar · not confirmed → Programado · confirmed ✓ → the Depósito (Kiromedic, Eligen…) */}
              <span className="d-inline-flex align-items-center gap-1">
                <Input type="date" value={p.fecha} disabled={locked} ariaLabel={`Fecha del depósito ${idx + 1}`} width="140px"
                  onChange={x => updateRow('depositos', depositos, idx, { fecha: x, deposito_ok: false })} />
                {(() => {
                  const st = depositoStatus(p);
                  return (
                    <span className={`crio-status is-${st.kind}`} aria-label={`Status del depósito ${idx + 1}: ${st.text}`}>
                      <CIcon icon={st.kind === 'hecho' ? cilCheckAlt : st.kind === 'programado' ? cilCheckCircle : cilClock} className="me-1" />{st.text}
                    </span>
                  );
                })()}
              </span>
              <ConfirmButton on={p.deposito_ok} empty={!p.fecha || !p.deposito} disabled={locked}
                label={`Depósito ${idx + 1}`} onChange={v => updateRow('depositos', depositos, idx, { deposito_ok: v })} />
              <RemoveButton disabled={locked} label={`Quitar depósito ${idx + 1}`} onClick={() => removeRow('depositos', depositos, idx)} />
            </div>
          ))}
          {!locked && (
            <AddButton
              label="Agregar depósito"
              onClick={() => updateList('depositos', [...depositos, newDeposito(ultimoViaje)])}
              note={depositos.length
                ? `${depositos.length} depósito${depositos.length === 1 ? '' : 's'} en ${numViajes} viaje${numViajes === 1 ? '' : 's'}`
                : 'Sin depósitos'}
            />
          )}
        </div>
      </div>

      <hr className="crio-divider" />

      {/* ── Washing (only with Lavado de semen = Sí) ──
           Envío Muestra ✓ · Final ✓ · stop / continue */}
      {conWashing && (
        <div className="crio-block mb-3">
          <div className="crio-title">Washing</div>
          {washList.map((w, idx) => {
            const up = (changes) => updateList('washings', washList.map((r, i) => (i === idx ? { ...r, ...changes } : r)));
            return (
              <div key={w.id} className={`crio-stim crio-stim-box is-owner crio-wash${w.estado === 'detenido' ? ' is-cancelado' : ''}`}>
                <label className="crio-label crio-cre-big">Envío Muestra</label>
                <span className="crio-with-ok">
                  <DateStatus date={w.envio_muestra} disabled={locked} label={`Envío muestra ${idx + 1}`} onDate={x => up(withOk('envio_muestra', x))} />
                  <ConfirmButton on={w.envio_muestra_ok} empty={!w.envio_muestra} disabled={locked} label="Envío Muestra"
                    onChange={v => up({ envio_muestra_ok: v })} />
                </span>
                <label className="crio-label crio-cre-big">Final</label>
                <span className="crio-with-ok">
                  <DateStatus date={w.fecha_final} disabled={locked} label={`Final washing ${idx + 1}`} onDate={x => up(withOk('fecha_final', x))} />
                  <ConfirmButton on={w.fecha_final_ok} empty={!w.fecha_final} disabled={locked} label="Final"
                    onChange={v => up({ fecha_final_ok: v })} />
                </span>
                <span className="ms-auto d-inline-flex align-items-center gap-2">
                  <WashButtons estado={w.estado} idx={idx} disabled={locked} onChange={x => up({ estado: x })} />
                  {washList.length > 1 && (
                    <RemoveButton disabled={locked} label={`Quitar washing ${idx + 1}`} onClick={() => updateList('washings', washList.filter((_, i) => i !== idx))} />
                  )}
                </span>
              </div>
            );
          })}
          {!locked && (
            <AddButton label="Agregar washing" onClick={() => updateList('washings', [...washList, newWashing()])}
              note="Confirma la fecha Final para habilitar Estimulaciones y Creación Embrionaria" />
          )}
        </div>
      )}
      {washBlocked && !locked && (
        <div className="crio-lock-note" role="note">
          <CIcon icon={cilWarning} className="me-2 flex-shrink-0" />
          <span>
            <strong>Lavado de semen:</strong> Estimulaciones Ovarias/Captura y Creación Embrionaria están bloqueadas
            hasta confirmar (✓) la fecha <strong>Final</strong> del Washing.
          </span>
        </div>
      )}

      {/* ── Estimulaciones Ovarias/Captura ──
           Gray: this IP is the owner (editable here).
           Yellow: this IP is the spliter of another IP's estimulación (read
           only; it is edited in the owner's record). */}
      <div className="crio-block">
        <div className="crio-title">Estimulaciones Ovarias/Captura</div>
        {!stimReady && (
          <div className="crio-note-box">
            Disponible cuando haya al menos un <strong>Código donor</strong> y un <strong>Viaje</strong> (depósito) registrados.
          </div>
        )}
        {/* Each estimulación, in 4 columns + a last row:
              1 Donor · Aparta donor · Split   2 Reserva donor · Start aco · Stop aco
              3 Start Estimula · Captura       4 Ovocitos · Owner · Spliter
              last row: Anular / Concluir estimulación */}
        {estimulaciones.map((e, idx) => {
          const spliter = ips.find(i => String(i.id) === String(e.spliter_ip_id));
          const errs = estimulacionErrors(e);
          const rowDisabled = procLocked || !stimReady;
          const up = (changes) => updateRow('estimulaciones', estimulaciones, idx, changes);
          const known = !e.donante || ownCodes.includes(e.donante);
          const n = idx + 1;
          return (
            <div key={e.id} id={`crio-estim-${idx}`} className={`crio-stim crio-stim-box is-owner${e.estado ? ` is-${e.estado}` : ''}${e.cierre === 'anulada' ? ' is-cancelado' : ''}`}>
              <div className="crio-stim-cols">
                {/* 1 */}
                <div className="crio-stim-col">
                  <label className="crio-label" htmlFor={`stim-donor-${e.id}`}>Donor</label>
                  <select
                    id={`stim-donor-${e.id}`} className="crio-input crio-strong-input" value={e.donante || ''} disabled={rowDisabled}
                    style={{ width: 150 }} aria-label={`Donor de la estimulación ${n}`}
                    onChange={ev => up({ donante: ev.target.value })}
                  >
                    <option value="">Seleccionar</option>
                    {ownCodes.map(c => <option key={`o-${c}`} value={c}>{c} · {ownOrigen(c)}</option>)}
                    {/* saved before (or removed from Egg donors): kept visible, cannot be chosen again */}
                    {!known && <option value={e.donante} disabled>{e.donante} (no está en Egg donors)</option>}
                  </select>
                  <ExtraField e={e} fieldKey="aparta_donor" label="Aparta donor" type="month" kind="cancelOk" up={up} disabled={rowDisabled} n={n} />
                  <label className="crio-check crio-label" htmlFor={`stim-split-${e.id}`}>Split</label>
                  <span className="crio-extra">
                    <input id={`stim-split-${e.id}`} type="checkbox" checked={!!e.split} disabled={rowDisabled} aria-label={`Split ${n}`}
                      onChange={ev => up({ split: ev.target.checked, ...(ev.target.checked ? {} : { spliter_qtd: '', spliter_ip_id: '', spliter_ok: false }) })} />
                    {e.split && (
                      <>
                        <select
                          className="crio-input" value={String(e.spliter_ip_id || '')} disabled={rowDisabled} style={{ width: 150 }}
                          aria-label={`IP spliter ${n}`} onChange={ev => up({ spliter_ip_id: ev.target.value })}
                        >
                          <option value="">IP con quien se divide</option>
                          {ips.map(i => <option key={i.id} value={String(i.id)}>{i.nombre_completo}</option>)}
                        </select>
                        {spliter && (
                          <button type="button" className="btn btn-link btn-sm p-0 crio-link" onClick={() => onOpenIp?.(spliter.id)}
                            title={`Abrir el registro de ${spliter.nombre_completo}`}>
                            <CIcon icon={cilLink} />
                          </button>
                        )}
                      </>
                    )}
                  </span>
                </div>
                {/* 2 */}
                <div className="crio-stim-col">
                  <ExtraField e={e} fieldKey="reserva_donor" label="Reserva donor" type="date" kind="playStop" up={up} disabled={rowDisabled} n={n} />
                  <ExtraField e={e} fieldKey="start_aco" label="Start aco" type="date" kind="playStop" up={up} disabled={rowDisabled} n={n} />
                  <ExtraField e={e} fieldKey="stop_aco" label="Stop aco" type="date" kind="playStop" up={up} disabled={rowDisabled} n={n} />
                </div>
                {/* 3 */}
                <div className="crio-stim-col">
                  <label className="crio-label">Start Estimula</label>
                  <span className="crio-with-ok">
                    <DateStatus date={e.start_estimula} disabled={rowDisabled} label={`Start estimula ${n}`}
                      onDate={x => up(withOk('start_estimula', x))} />
                    <ConfirmButton on={e.start_estimula_ok} empty={!e.start_estimula} disabled={rowDisabled} label="Start Estimula"
                      onChange={v => up({ start_estimula_ok: v })} />
                  </span>
                  <label className="crio-label">Captura</label>
                  <span className="crio-captura">
                    <DateStatus date={e.captura} disabled={rowDisabled} label={`Captura ${n}`}
                      onDate={x => up(withOk('captura', x))} />
                    <ConfirmButton on={e.captura_ok} empty={!e.captura} disabled={rowDisabled} label="Captura"
                      onChange={v => up({ captura_ok: v })} />
                    <EstadoButtons estado={e.estado} idx={idx} disabled={rowDisabled} onChange={x => up({ estado: x })} />
                  </span>
                </div>
                {/* 4 */}
                <div className="crio-stim-col">
                  <label className="crio-label" htmlFor={`stim-ovo-${e.id}`}>Ovocitos</label>
                  <Input id={`stim-ovo-${e.id}`} type="number" min="0" value={e.ovocitos} disabled={rowDisabled} ariaLabel={`Ovocitos ${n}`} width="70px"
                    onChange={x => up({ ovocitos: x })} />
                  <label className="crio-label" htmlFor={`stim-owner-${e.id}`}>Owner</label>
                  <span className="crio-with-ok">
                    <Input id={`stim-owner-${e.id}`} type="number" min="0" value={e.owner_qtd} disabled={rowDisabled} ariaLabel={`Ovocitos de owner ${n}`} width="70px"
                      onChange={x => up(withQtyOk('owner_qtd', x))} />
                    <ConfirmButton on={e.owner_ok} empty={e.owner_qtd === '' || e.owner_qtd == null} disabled={rowDisabled} label="Owner"
                      onChange={v => up({ owner_ok: v })} />
                  </span>
                  {e.split && (
                    <>
                      <label className="crio-label" htmlFor={`stim-spliter-${e.id}`}>Spliter</label>
                      <span className="crio-with-ok">
                        <Input id={`stim-spliter-${e.id}`} type="number" min="0" value={e.spliter_qtd} disabled={rowDisabled} ariaLabel={`Ovocitos de spliter ${n}`} width="70px"
                          onChange={x => up(withQtyOk('spliter_qtd', x))} />
                        <ConfirmButton on={e.spliter_ok} empty={e.spliter_qtd === '' || e.spliter_qtd == null} disabled={rowDisabled} label="Spliter"
                          onChange={v => up({ spliter_ok: v })} />
                      </span>
                    </>
                  )}
                </div>
              </div>
              {/* Last row: Anular / Concluir estimulación */}
              <div className="crio-stim-cierre">
                <span className="crio-label">Anular / Concluir estimulación</span>
                <TwoState kind="cierre" value={e.cierre} disabled={rowDisabled} label={`estimulación ${n}`} onChange={v => up({ cierre: v })} />
                {e.cierre && <span className={`crio-extra-st is-${e.cierre}`}>{ESTADO_TXT[e.cierre]}</span>}
                <span className="ms-auto">
                  <RemoveButton disabled={procLocked} label={`Quitar estimulación ${n}`} onClick={() => removeRow('estimulaciones', estimulaciones, idx)} />
                </span>
              </div>
              {(errs.length > 0 || e.estado) && (
                <div className="crio-errors" role={errs.length ? 'alert' : undefined}>
                  {e.estado && <CBadge color={e.estado === 'aceptado' ? 'dark' : 'danger'} className="me-1">Proceso {ESTADO_LABEL[e.estado].toLowerCase()}</CBadge>}
                  {errs.map(m => <CBadge key={m} color="danger" className="me-1">{m}</CBadge>)}
                </div>
              )}
            </div>
          );
        })}

        {/* Estimulaciones of OTHER IPs split with this one (this IP = spliter): read only,
            same columns; the owner's data in gray, only the Spliter amount in white */}
        {splitsWithMe.map(({ owner, e }) => {
          const none = () => {};
          return (
            <div key={`${owner.id}-${e.id}`} className={`crio-stim crio-stim-box is-spliter${e.estado ? ` is-${e.estado}` : ''}${e.cierre === 'anulada' ? ' is-cancelado' : ''}`}>
              <div className="crio-stim-cols">
                <div className="crio-stim-col">
                  <label className="crio-label">Donor</label>
                  <span className="crio-ro crio-ro-off crio-strong-input" aria-disabled="true">{e.donante || '—'}</span>
                  <ExtraField e={e} fieldKey="aparta_donor" label="Aparta donor" type="month" kind="cancelOk" up={none} disabled n="(split)" />
                  <label className="crio-check crio-label">Split</label>
                  <span className="crio-extra">
                    <input type="checkbox" checked readOnly disabled aria-label="Split recibido" />
                    <button type="button" className="btn btn-link btn-sm p-0 crio-link" onClick={() => onOpenIp?.(owner.id)}
                      title={`Owner: abrir el registro de ${owner.nombre_completo}`}>
                      <CIcon icon={cilLink} className="me-1" />{owner.nombre_completo}
                    </button>
                  </span>
                </div>
                <div className="crio-stim-col">
                  <ExtraField e={e} fieldKey="reserva_donor" label="Reserva donor" type="date" kind="playStop" up={none} disabled n="(split)" />
                  <ExtraField e={e} fieldKey="start_aco" label="Start aco" type="date" kind="playStop" up={none} disabled n="(split)" />
                  <ExtraField e={e} fieldKey="stop_aco" label="Stop aco" type="date" kind="playStop" up={none} disabled n="(split)" />
                </div>
                <div className="crio-stim-col">
                  <label className="crio-label">Start Estimula</label>
                  <span className="crio-with-ok">
                    <DateStatus date={e.start_estimula} disabled label="Start estimula (spliter)" onDate={none} />
                    <ConfirmButton on={e.start_estimula_ok} disabled label="Start Estimula" onChange={none} />
                  </span>
                  <label className="crio-label">Captura</label>
                  <span className="crio-captura">
                    <DateStatus date={e.captura} disabled label="Captura (spliter)" onDate={none} />
                    <ConfirmButton on={e.captura_ok} disabled label="Captura" onChange={none} />
                    <EstadoButtons estado={e.estado} idx={0} disabled onChange={none} />
                  </span>
                </div>
                <div className="crio-stim-col">
                  <label className="crio-label">Ovocitos</label>
                  <span className="crio-ro crio-ro-off" aria-disabled="true">{e.ovocitos || '—'}</span>
                  <label className="crio-label">Owner</label>
                  <span className="crio-with-ok">
                    <span className="crio-ro crio-ro-off" aria-disabled="true">{e.owner_qtd || '—'}</span>
                    <ConfirmButton on={e.owner_ok} disabled label="Owner" onChange={none} />
                  </span>
                  <label className="crio-label">Spliter</label>
                  <span className="crio-with-ok">
                    <span className="crio-ro crio-ro-strong">{e.spliter_qtd || '—'}</span>
                    <ConfirmButton on={e.spliter_ok} disabled label="Spliter" onChange={none} />
                  </span>
                </div>
              </div>
              <div className="crio-stim-cierre">
                <span className="crio-label">Anular / Concluir estimulación</span>
                <TwoState kind="cierre" value={e.cierre} disabled label="estimulación (split)" onChange={none} />
                {e.cierre && <span className={`crio-extra-st is-${e.cierre}`}>{ESTADO_TXT[e.cierre]}</span>}
              </div>
              <div className="crio-errors">
                <CBadge color="warning" textColor="dark" className="me-1">Split recibido · se edita en el registro del owner</CBadge>
                {e.estado && <CBadge color={e.estado === 'aceptado' ? 'dark' : 'danger'}>Proceso {ESTADO_LABEL[e.estado].toLowerCase()}</CBadge>}
              </div>
            </div>
          );
        })}

        {!locked && (
          <AddButton
            label="Agregar estimulación"
            disabled={washBlocked || !stimReady || estimulaciones.length >= CRIO_LIMITS.estimulaciones}
            onClick={() => updateList('estimulaciones', [...estimulaciones, newEstimulacion()])}
            note={stimReady ? `${estimulaciones.length} de ${CRIO_LIMITS.estimulaciones} estimulaciones máx.` : 'Registra primero un Código donor y un Viaje'}
          />
        )}
      </div>

      {/* ── Creación Embrionaria ──
           Row 1: Crio Embrio - n · Donor/Split · FIV Total · PGTA · PDF Crio Embrio
           Row 2: Fecha día 1 FIV ✓ · FIV Result ✓ · Biopsia · XX · PDF PGTA
           Row 3: Frozen FIV ✓ · Envío Biopsia ✓ · NI/6 · XY · quitar
           FIV Total ≤ Owner/Spliter · Biopsia + NI/6 = FIV Total · PGTA ≤ Biopsia · XX + XY = PGTA
           With "Con Material Genético (Sin Viaje)" only XX, XY and NI/6 are editable. */}
      <div className="crio-block mt-3">
        <div className="crio-title">Creación Embrionaria</div>
        {crios.map((c, idx) => {
          const opt = estimOptions.find(o => o.value === c.estim_ref) || null;
          // Received split → FIV Total is limited by Spliter; own estimulación → by Owner
          const errs = crioRowErrors(c, opt?.max ?? null, opt?.split ? 'Spliter' : 'Owner');
          const resKey = `crio_${c.id}_resultado`;
          const up = (changes) => updateRow('crios', crios, idx, changes);
          const pgtaOn = Number(c.pgta_qtd) > 0 || (c.pgta === 'Sí' && c.pgta_qtd === undefined);
          const biopsiaOn = Number(c.biopsia) > 0 || !!crioEnvioBiopsia(c);
          const ownerIp = opt?.split ? opt.owner : (opt?.e?.split ? ips.find(i => String(i.id) === String(opt.e.spliter_ip_id)) : null);
          const maxLabel = opt?.max !== null && opt?.max !== undefined ? `≤ ${opt.split ? 'Spliter' : 'Owner'} (${opt.max})` : '≤ Owner';
          // Date + status + ✓ confirm
          const fecha = (key, label, value = c[key], extraDisabled = false) => (
            <span className="crio-with-ok">
              <DateStatus date={value} disabled={procLocked || extraDisabled} label={`${label} ${idx + 1}`}
                onDate={x => up(withOk(key, x))} />
              <ConfirmButton on={c[`${key}_ok`]} empty={!value} disabled={procLocked || extraDisabled} label={label}
                onChange={v => up({ [`${key}_ok`]: v })} />
            </span>
          );
          const numero = (key, label, isLocked, placeholder) => (
            <Input type="number" min="0" value={c[key] ?? ''} disabled={isLocked} ariaLabel={`${label} ${idx + 1}`} width="70px"
              placeholder={placeholder} onChange={x => up({ [key]: x })} />
          );
          return (
            <div key={c.id} id={`crio-cre-${idx}`} className="crio-stim crio-cre-box">
              <div className="crio-cre-grid">
                {/* Row 1 */}
                <span className="crio-cre-name">Crio Embrio - {idx + 1}</span>
                <span className="crio-cre-donor">
                  <select
                    className="crio-input" value={c.estim_ref || (c.donante ? '__legacy' : '')} disabled={procLocked} style={{ width: 150 }}
                    aria-label={`Donor/Split del crio ${idx + 1}`}
                    onChange={ev => {
                      const o = estimOptions.find(x => x.value === ev.target.value);
                      // FIV Total starts with the ovocitos of this IP (Owner, or Spliter for a
                      // received split) and stays editable; a value typed by hand is kept
                      const auto = c.fecundados === '' || c.fecundados == null || String(c.fecundados) === String(opt?.max ?? '');
                      up({
                        estim_ref: o ? o.value : '', donante: o ? o.donante : '',
                        ...(o && auto && o.max !== null && o.max !== undefined ? { fecundados: String(o.max) } : {}),
                      });
                    }}
                  >
                    <option value="">Donor/Split</option>
                    {estimOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    {!c.estim_ref && c.donante && <option value="__legacy">{c.donante}</option>}
                  </select>
                  {ownerIp && (
                    <>
                      <CIcon icon={cilFork} className="crio-split-icon" title="Split" />
                      <button type="button" className="btn btn-link btn-sm p-0 crio-link" onClick={() => onOpenIp?.(ownerIp.id)}
                        title={`Abrir el registro de ${ownerIp.nombre_completo}`}>{ownerIp.nombre_completo}</button>
                    </>
                  )}
                  {opt && (
                    <CTooltip
                      placement="top"
                      content={`${opt.donante} · Ovocitos ${opt.e.ovocitos || '—'} · Owner ${opt.e.owner_qtd || '—'}${opt.e.split ? ` · Spliter ${opt.e.spliter_qtd || '—'}` : ''} · Captura ${opt.e.captura || '—'}`}
                    >
                      <span className="crio-eye" tabIndex={0} role="img" aria-label="Ver la estimulación">
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                          <path fill="currentColor" d="M12 5C6.5 5 2.7 9.1 1.5 12c1.2 2.9 5 7 10.5 7s9.3-4.1 10.5-7C21.3 9.1 17.5 5 12 5zm0 11.5A4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 0 1 0 9zm0-7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z" />
                        </svg>
                      </span>
                    </CTooltip>
                  )}
                </span>
                <label className="crio-label crio-cre-big">Fiv Total</label>
                <Input type="number" min="0" value={c.fecundados} disabled={procLocked} ariaLabel={`FIV Total ${idx + 1}`} width="110px"
                  placeholder={maxLabel} onChange={x => up({ fecundados: x })} />
                <label className="crio-label crio-cre-big">PGTA</label>
                {numero('pgta_qtd', 'PGTA', procLocked, '≤ Biopsia')}
                <span className="crio-cre-doc">
                  <span className="crio-small">Crio Embrio</span>
                  <IpDocControls label={`Crio Embrio ${idx + 1}`} disabled={procLocked} {...docProps(`crio_${c.id}_estimado`, `Crio Embrio ${idx + 1}`)} />
                </span>

                {/* Row 2 */}
                <label className="crio-label crio-cre-big">Fecha día 1 FIV</label>
                {fecha('fecha_start', 'Fecha día 1 FIV')}
                <label className="crio-label crio-cre-big">FIV Result</label>
                {fecha('fiv_result', 'FIV Result')}
                <label className="crio-label crio-cre-big">Biopsia</label>
                {numero('biopsia', 'Biopsia', procLocked)}
                <label className="crio-label crio-cre-big">XX</label>
                {numero('xx', 'XX', procDisabled)}
                <span className="crio-cre-doc">
                  <span className="crio-small">PGTA</span>
                  <IpDocControls label={`Resultado PGTA ${idx + 1}`} disabled={procLocked || !pgtaOn} {...docProps(resKey, `Resultado PGTA — Crio ${idx + 1}`)} />
                </span>

                {/* Row 3 */}
                <label className="crio-label crio-cre-big">Frozen FIV</label>
                {fecha('fecha_final', 'Frozen FIV')}
                <label className="crio-label crio-cre-big">Envío Biopsia</label>
                {fecha('envio_biopsia', 'Envío Biopsia', crioEnvioBiopsia(c), !biopsiaOn)}
                <label className="crio-label crio-cre-big">NI/6</label>
                {numero('ni', 'NI/6', procDisabled)}
                <label className="crio-label crio-cre-big">XY</label>
                {numero('xy', 'XY', procDisabled)}
                <span className="crio-cre-doc">
                  <RemoveButton disabled={procDisabled} label={`Quitar crio ${idx + 1}`} onClick={() => removeRow('crios', crios, idx)} />
                </span>
              </div>
              {errs.length > 0 && (
                <div className="crio-errors" role="alert">{errs.map(m => <CBadge key={m} color="danger" className="me-1">{m}</CBadge>)}</div>
              )}
            </div>
          );
        })}
        {!procDisabled && (
          <AddButton label="Agregar crio embrio" onClick={() => updateList('crios', [...crios, newCrio()])}
            note="FIV Total ≤ Owner/Spliter · Biopsia + NI/6 = FIV Total · PGTA ≤ Biopsia · XX + XY = PGTA" />
        )}
      </div>

      <style>{`
        .crio-top { display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-start; }
        .crio-block { min-width: 0; }
        .crio-box { border: 1px solid var(--cui-border-color, #d6d9dc); border-radius: 6px; padding: 8px 12px; }
        .crio-grid { display: grid; gap: 6px 10px; align-items: center; margin-bottom: 6px; }
        .crio-grid-donors { grid-template-columns: 120px 150px 150px 56px 28px; }
        /* Origen: IP (chosen in Baby Cloud → Mis datos) / AG (platform user) */
        .crio-ip-lock { justify-self: center; color: #b23b6a; width: 14px; height: 14px; }
        .crio-origen { justify-self: center; font-size: .75rem; font-weight: 800; padding: 2px 8px; border-radius: 10px; }
        .crio-origen.is-ip { background: #fbe3ec; color: #b23b6a; }
        .crio-origen.is-ag { background: #e1eef0; color: #2f7f89; }
        .crio-grid-dep { grid-template-columns: 64px 150px auto 28px 28px; }
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
        .crio-cre-box { background: #e3f1fb; border-radius: 3px; padding: 8px 10px; margin-bottom: 6px; }
        .crio-cre-grid {
          display: grid; align-items: center; gap: 6px 10px; justify-content: start;
          grid-template-columns: auto auto auto auto auto auto auto auto auto;
        }
        .crio-cre-name { color: #2f7f89; font-size: 1.15rem; white-space: nowrap; }
        .crio-cre-donor { grid-column: span 3; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
        .crio-span2 { grid-column: span 2; }
        .crio-cre-big { font-size: 1.05rem; color: #2f7f89; white-space: nowrap; }
        .crio-wash { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 12px; }
        .crio-wash-btn {
          width: 24px; height: 24px; border-radius: 50%; border: 2px solid #9aa3ab; background: #fff; color: #9aa3ab;
          display: inline-flex; align-items: center; justify-content: center; padding: 0;
        }
        .crio-wash-btn svg { width: 12px; height: 12px; }
        .crio-wash-btn.is-stop:hover:not(:disabled), .crio-wash-btn.is-stop.is-on { border-color: #d32f2f; background: #d32f2f; color: #fff; }
        .crio-wash-btn.is-play:hover:not(:disabled), .crio-wash-btn.is-play.is-on { border-color: #1e9e4a; background: #1e9e4a; color: #fff; }
        .crio-wash-btn:disabled { cursor: default; }
        .crio-wash-btn:focus-visible { outline: 2px solid #2f7f89; outline-offset: 1px; }
        /* the 4 columns stay side by side; on a narrow screen the box scrolls sideways (phones: stacked) */
        .crio-stim-cols { display: flex; flex-wrap: nowrap; align-items: flex-start; gap: 8px 10px; overflow-x: auto; padding-bottom: 2px; }
        .crio-stim-col { flex: 0 0 auto; }
        @media (max-width: 767.98px) { .crio-stim-cols { flex-wrap: wrap; } }
        .crio-stim-col .crio-status { min-width: 0; }
        .crio-stim-col .crio-ro { min-width: 70px; max-width: 150px; }
        .crio-stim-col input[type="date"] { width: 124px !important; }
        .crio-stim-col .crio-link { max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block; vertical-align: middle; }
        .crio-stim-col { display: grid; grid-template-columns: auto auto; align-items: center; gap: 6px 8px; justify-content: start; }
        .crio-stim-cierre {
          display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px;
          margin-top: 8px; padding-top: 6px; border-top: 1px dashed rgba(0,0,0,.15);
        }
        .crio-extra { display: inline-flex; align-items: center; gap: 6px; }
        .crio-extra-st { font-size: .75rem; font-weight: 700; font-style: italic; }
        .crio-extra-st.is-en_curso, .crio-extra-st.is-confirmado, .crio-extra-st.is-concluida { color: #1e9e4a; }
        .crio-extra-st.is-detenido, .crio-extra-st.is-cancelado, .crio-extra-st.is-anulada { color: #d32f2f; }
        .crio-with-ok { display: inline-flex; align-items: center; gap: 6px; }
        .crio-confirm {
          width: 24px; height: 24px; border-radius: 50%; border: 2px solid #9aa3ab; background: #fff; color: #9aa3ab;
          display: inline-flex; align-items: center; justify-content: center; padding: 0; flex-shrink: 0;
        }
        .crio-confirm svg { width: 13px; height: 13px; }
        .crio-confirm:hover:not(:disabled):not(.is-on) { border-color: #2e7d32; color: #2e7d32; }
        .crio-confirm.is-on { border-color: #2e7d32; background: #2e7d32; color: #fff; }
        .crio-confirm:disabled:not(.is-on) { opacity: .45; cursor: not-allowed; }
        .crio-confirm.is-on:disabled { cursor: default; }
        .crio-confirm:focus-visible { outline: 2px solid #2f7f89; outline-offset: 1px; }
        .crio-cre-doc { display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; }
        .crio-split-icon { color: #1d5fc4; width: 16px; height: 16px; }
        .crio-eye { display: inline-flex; color: #222; cursor: help; }
        .crio-eye:focus-visible { outline: 2px solid #2f7f89; outline-offset: 1px; }
        .crio-dias { font-size: .8rem; font-weight: 700; font-style: italic; color: #2f7f89; white-space: nowrap; }
        .crio-dias.is-empty { color: #dc3545; }
        @media (max-width: 1199.98px) {
          .crio-cre-grid { grid-template-columns: auto 1fr; }
          .crio-cre-donor, .crio-span2 { grid-column: auto; }
          .crio-cre-big { font-size: .9rem; }
          .crio-cre-grid > span:empty { display: none; }
        }
        .crio-lock-note { display: flex; align-items: flex-start; background: #f3e8fd; border: 1px solid #d9b8f7; color: #5b2a86; border-radius: 6px; padding: 8px 12px; margin-bottom: 12px; font-size: .9rem; }
        .crio-title { color: #2f7f89; font-weight: 700; font-size: 1.1rem; margin-bottom: 6px; }
        .crio-note-box { font-size: .85rem; color: #6c757d; background: #f6f7f8; border: 1px dashed #cfd4d9; border-radius: 4px; padding: 6px 10px; margin-bottom: 6px; }
        .crio-stim-box { border-radius: 3px; padding: 6px 10px; margin-bottom: 6px; }
        .crio-stim-box.is-owner { background: #e6e8e8; }       /* this IP is the owner → gray */
        .crio-stim-box.is-spliter { background: #fff3c4; }     /* this IP is the spliter → yellow */
        .crio-stim-box.is-cancelado { opacity: .7; }
        .crio-captura { display: inline-flex; align-items: center; gap: 8px; }
        .crio-estado { display: inline-flex; gap: 4px; }
        .crio-estado-btn {
          width: 24px; height: 24px; border-radius: 50%; border: 2px solid #9aa3ab; background: #fff; color: #9aa3ab;
          display: inline-flex; align-items: center; justify-content: center; padding: 0;
        }
        .crio-estado-btn svg { width: 14px; height: 14px; }
        .crio-estado-btn.is-cancel:hover:not(:disabled), .crio-estado-btn.is-cancel.is-on { border-color: #d32f2f; background: #d32f2f; color: #fff; }
        .crio-estado-btn.is-ok:hover:not(:disabled), .crio-estado-btn.is-ok.is-on { border-color: #111; background: #111; color: #fff; }
        .crio-estado-btn:disabled { cursor: default; }
        .crio-estado-btn:focus-visible { outline: 2px solid #2f7f89; outline-offset: 1px; }
        .crio-ro { display: inline-block; min-width: 80px; padding: 2px 8px; background: rgba(255,255,255,.7); border: 1px solid #d6cfa8; border-radius: 3px; }
        .crio-ro-strong { font-weight: 700; background: #fff; }
        .crio-ro-off { background: #e9ecef; border-color: #ced4da; color: #6c757d; }
        .crio-stim-grid {
          display: grid; align-items: center; gap: 6px 10px;
          grid-template-columns: auto auto auto auto auto auto auto auto 28px;
          justify-content: start;
        }
        .crio-strong-input { font-weight: 700; color: #2f7f89; }
        .crio-spliter-ip { display: inline-flex; align-items: center; gap: 4px; grid-column: span 2; }
        .crio-small .crio-label { font-size: .85rem; }
        @media (max-width: 991.98px) {
          .crio-stim-grid { grid-template-columns: auto 1fr; }
          .crio-stim-grid > span:empty { display: none; }
          .crio-spliter-ip { grid-column: span 2; }
        }
        .crio-status { font-size: .78rem; font-weight: 700; font-style: italic; white-space: nowrap; min-width: 100px; }
        .crio-status.is-programar { color: #6c757d; }
        .crio-status.is-programado { color: #198754; }
        .crio-status.is-revisar { color: #dc3545; }
        .crio-status.is-hecho { color: #0f6b55; font-style: normal; }
      `}</style>
    </div>
  );
};

export default CrioEmbrio;