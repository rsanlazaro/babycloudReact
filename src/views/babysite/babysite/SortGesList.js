// src/views/pages/sortGes/sortGesList.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  CCard, CCardBody, CCol, CContainer, CRow,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CButton, CFormInput, CFormSelect, CFormLabel, CSpinner, CAlert,
  CInputGroup, CInputGroupText, CBadge,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CNav, CNavItem, CNavLink, CTabContent, CTabPane,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilSearch, cilPlus, cilArrowTop, cilArrowBottom,
  cilFile, cilPencil, cilTrash, cilWarning,
  cilUser, cilClipboard, cilCalendar, cilPeople,
  cilSend, cilClock, cilCheck, cilLockLocked, cilLockUnlocked,
} from '@coreui/icons';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../services/api';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const STATUS_OPTIONS = {
  iniciales:  { label: 'Iniciales',  color: 'info'      },
  en_proceso: { label: 'En Proceso', color: 'warning'   },
  aprobado:   { label: 'Aprobado',   color: 'success'   },
  rechazado:  { label: 'Rechazado',  color: 'danger'    },
  pendiente:  { label: 'Pendiente',  color: 'secondary' },
};

// Programa al que se inscribe el candidato — 1° o 2° programa
const PROGRAMA_OPTIONS = {
  '1': { label: '1°', bg: '#0071b8' },
  '2': { label: '2°', bg: '#8e44ad' },
};

// Placeholder work groups for the RESP dropdown in Admisiones / Att. Previa /
// Psicología. Real group membership isn't wired up yet — once it is, this
// hardcoded list should be replaced with whatever the groups API returns.
// TODO: replace with real group rosters once group management is implemented.
const GRUPOS_TRABAJO = ['Psicología', 'admisiones', 'seguros'];

// ── Admisiones tab — field option catalogs ──────────────────────
// NOTE: none of these columns are backed by DB columns yet — selections
// are kept in local UI state (see admisionesFields / handleAdmisionesFieldChange
// in SortGesList) until the corresponding backend fields exist.
// Vínculo is set once, at candidate creation (like Programa/Status/IP
// Responsable) — it lives on the candidate record itself, not as a
// per-tab local field. See CandidateFormFields / handleCreate / handleEdit.
const VINCULO_OPTIONS = ['Babyboom', 'Reclutadora', 'Agencia'];
const PSICO_ENT_OPTIONS  = ['RE', 's/d', 'CR', 'NR'];
const PSICO_PSIC_OPTIONS = ['A', 's/d', 'CR', 'NR'];
const HIM_OPTIONS = ['RE', 's/d', 'CR', 'NR'];

// Looks up a value from the candidate's nested psico_inicial rows (etapa,
// fecha, estado, recomendacion — same shape as GET /api/sort-ges/:id/psico-inicial).
// This is how the Admisiones tab's Psicología > Ent/Psic/HIM columns are
// linked to the candidate's own record instead of being edited locally.
// candidate.psico_inicial is populated by fetchPsicoInicialForCandidates in
// SortGesList (a separate per-candidate fetch, since the list endpoint
// itself doesn't return this) — falls back to '—' before that resolves.
const getPsicoInicialValue = (candidate, etapa, field) => {
  const rows = candidate?.psico_inicial;
  if (!Array.isArray(rows)) return '';
  const row = rows.find(r => r.etapa === etapa);
  return row?.[field] || '';
};

// Short labels for the recomendación values shown as read-only in
// SortGesList (SortGes.js's own selects show the full label + abbreviation).
const RECOMENDACION_SHORT_LABELS = {
  apta: 'A', recomendable: 'Re', con_reservas: 'CR',
  no_recomendable: 'NR', sin_datos: 's/d',
};

// Admisiones' "HIM" column shows only HIM 1's recomendación — not the most
// recent of HIM 1-4.
const getHim1Value = (candidate) => getPsicoInicialValue(candidate, 'HIM 1', 'recomendacion');

const CONSULTA_LABS_STATES = {
  programar:  { label: 'Programar'  },
  revisar:    { label: 'Revisar'    },
  programado: { label: 'Programado' },
  completado: { label: 'Completado' },
};

// "1° Consulta" (Admisiones) is derived from the candidate's FIRST "cita" in
// Cita Previa's "Iniciales" sub-tab — no longer independently editable.
// Rules (per product spec), checked in this order:
//   - "Status cita" (status) AND "Status" (status_resultados) both
//     'completado'                                            → 'completado'
//   - no fecha_cita on that cita                                → 'programar'
//   - has fecha_cita, and "final" date has already passed       → 'revisar'
//   - has fecha_cita, "final" not set or not yet passed          → 'programado'
//     ("programada" in the spec — same CONSULTA_LABS_STATES value, just
//     matching "cita"'s grammatical gender)
// candidate.cita_previa is populated by fetchCitaPreviaForCandidates in
// SortGesList (a separate per-candidate fetch, like psico_inicial) — returns
// '' (→ '—' in the cell) before that resolves or if there's no Iniciales cita yet.
const getPrimeraConsultaStatus = (candidate) => {
  const rows = candidate?.cita_previa;
  if (!Array.isArray(rows)) return '';
  const inicialesCitas = rows.filter(r => r.sub_tab === 'iniciales');
  if (inicialesCitas.length === 0) return '';
  const first = inicialesCitas[0]; // backend orders by created_at ASC — this is the first-created cita
  const bothCompletado = first.status === 'completado' && first.status_resultados === 'completado';
  if (bothCompletado) return 'completado';
  if (!first.fecha_cita) return 'programar';
  if (first.final) {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const finalDate = new Date(first.final);
    if (finalDate < hoy) return 'revisar';
  }
  return 'programado';
};

// "Labs" (Admisiones) is derived the same way, but from that same first
// "cita"'s Entrega resultados date and its "Status" (status_resultados) —
// the field grouped right next to Entrega resultados in the cita form.
// Rules (per product spec):
//   - no entrega_resultados                          → 'programar'
//   - entrega_resultados has passed AND status_resultados !== 'completado' → 'revisar'
//   - entrega_resultados not set to pass yet, OR already 'completado'      → 'programado'
const getLabsStatus = (candidate) => {
  const rows = candidate?.cita_previa;
  if (!Array.isArray(rows)) return '';
  const inicialesCitas = rows.filter(r => r.sub_tab === 'iniciales');
  if (inicialesCitas.length === 0) return '';
  const first = inicialesCitas[0];
  if (!first.entrega_resultados) return 'programar';
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const entregaDate = new Date(first.entrega_resultados);
  const passed = entregaDate < hoy;
  if (passed && first.status_resultados !== 'completado') return 'revisar';
  return 'programado';
};

// "Trat previo" (Admisiones) is derived from the candidate's FIRST "cita" in
// Cita Previa's "Tratamiento previo" sub-tab — no longer independently editable.
// Rules (per product spec):
//   - no citas registered in that sub-tab                          → nothing (→ '—')
//   - "Status cita" (status) AND "Status" (status_resultados) both
//     'completado'                                                 → 'completado' (checked first)
//   - otherwise, "final" date has already passed                   → 'revisar'
//   - otherwise (final not set, or not yet passed)                 → 'en_curso'
const TRAT_PREVIO_STATES = {
  revisar:    { label: 'Revisar'    },
  en_curso:   { label: 'En curso'   },
  completado: { label: 'Completado' },
};
const getTratPrevioStatus = (candidate) => {
  const rows = candidate?.cita_previa;
  if (!Array.isArray(rows)) return '';
  const tratCitas = rows.filter(r => r.sub_tab === 'tratamiento_previo');
  if (tratCitas.length === 0) return '';
  const first = tratCitas[0]; // backend orders by created_at ASC — this is the first-created cita
  const bothCompletado = first.status === 'completado' && first.status_resultados === 'completado';
  if (bothCompletado) return 'completado';
  if (first.final) {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const finalDate = new Date(first.final);
    if (finalDate < hoy) return 'revisar';
  }
  return 'en_curso';
};

// Att. Previa's Dr. Tratante / Próxima Cita / Status cita / Fecha de inicio /
// Fecha final / Status columns are all read-only, sourced from the
// candidate's LAST (most recently created) "cita" across ALL Cita Previa
// sub-tabs — unlike the Admisiones derivations above, this isn't scoped to
// one sub-tab.
const getLastCitaPrevia = (candidate) => {
  const rows = candidate?.cita_previa;
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return rows[rows.length - 1]; // backend orders by created_at ASC
};

// Admisiones' "ACO" date is color-coded by proximity to today:
//   - already passed          → red
//   - within the next 10 days → orange
//   - more than 10 days away  → black (default text color)
const getAcoDateColor = (dateStr) => {
  if (!dateStr) return null;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const target = new Date(String(dateStr).split('T')[0]);
  const diffDays = Math.ceil((target - hoy) / 86400000);
  if (diffDays < 0) return '#dc3545';
  if (diffDays <= 10) return '#fd7e14';
  return '#000000';
};

// Cita Previa sub-tab ids → display labels (mirrors SortGes.js's
// CITA_PREVIA_TABS, which isn't available in this file), used by
// getProximaActInfo below to name which sub-tab a cita-derived date came from.
const CITA_PREVIA_SUBTAB_LABELS = {
  iniciales:          'Iniciales',
  tratamiento_previo: 'Tratamiento previo',
  prepa_transfer:     'Prepa/Transfer',
  pre_natal:          'Pre Natal',
  materno_fetal:      'Materno Fetal',
};

// Admisiones' "Próxima Act" is the CLOSEST UPCOMING date (today or later)
// across every dated field on the candidate's record:
//   - Checklist: "Programar cita para entrega" / "...para firma"
//   - Psico Inicial: each row's Fecha
//   - Seguimiento Psicológico: each entry's Programar date
//   - Seguro de Vida: Fecha de alta, Vencimiento (per policy)
//   - Seguro de Maternidad: Fecha solicitud/alta/liberación/vencimiento,
//     plus each cuota's vencimiento (per policy)
//   - Cita Previa: Fecha cita, Inicio Tratamiento, Final, Entrega resultados
//     (per cita, across all 5 sub-tabs)
// Returns { date: Date, label: string } for the nearest one, or null if the
// candidate has no upcoming dates at all (or the relevant data hasn't
// finished loading yet — see the six fetch*ForCandidates functions above).
// Past dates are never shown here — "Próxima Act" means next/upcoming.
const getProximaActInfo = (candidate) => {
  const found = [];
  const consider = (rawDate, label) => {
    if (!rawDate) return;
    const d = new Date(String(rawDate).split('T')[0]);
    if (isNaN(d.getTime())) return;
    found.push({ date: d, label });
  };

  const cl = candidate?.checklist;
  if (cl) {
    consider(cl.cita_entrega, 'Cita entrega de documentos');
    consider(cl.cita_firma, 'Cita firma de consentimientos');
  }

  (candidate?.psico_inicial || []).forEach((row) => {
    consider(row.fecha, `Psico Inicial: ${row.etapa}`);
  });

  (candidate?.seguimiento || []).forEach((seg, i) => {
    consider(seg.programar, `Seguimiento Psicológico${seg.etapa ? `: ${seg.etapa}` : ` ${i + 1}`}`);
  });

  (candidate?.seguro_vida || []).forEach((v) => {
    consider(v.fecha_alta, 'Seguro de Vida: fecha de alta');
    consider(v.vencimiento, 'Seguro de Vida: vencimiento');
  });

  (candidate?.seguro_mat || []).forEach((p) => {
    consider(p.fecha_solicitud, 'Seguro de Maternidad: fecha de solicitud');
    consider(p.fecha_alta, 'Seguro de Maternidad: fecha de alta');
    consider(p.fecha_liberacion, 'Seguro de Maternidad: fecha de liberación');
    consider(p.fecha_vencimiento, 'Seguro de Maternidad: fecha de vencimiento');
    (p.pagos || []).forEach((cuota) => {
      consider(cuota.vencimiento, `Seguro de Maternidad: cuota ${cuota.cuota_num}`);
    });
  });

  (candidate?.cita_previa || []).forEach((cp) => {
    const subLabel = CITA_PREVIA_SUBTAB_LABELS[cp.sub_tab] || cp.sub_tab;
    consider(cp.fecha_cita, `Cita Previa (${subLabel}): fecha cita`);
    consider(cp.inicio_tratamiento, `Cita Previa (${subLabel}): inicio tratamiento`);
    consider(cp.final, `Cita Previa (${subLabel}): final`);
    consider(cp.entrega_resultados, `Cita Previa (${subLabel}): entrega resultados`);
  });

  if (found.length === 0) return null;

  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const upcoming = found.filter((f) => f.date >= hoy);
  if (upcoming.length === 0) return null;

  upcoming.sort((a, b) => a.date - b.date);
  return upcoming[0];
};

// Mirrors SortGes.js's citaStatusOpts — used to render "Status cita" labels
// read-only here in Att. Previa.
const CITA_STATUS_LABELS = {
  informar_resolucion: 'Informar resolución',
  agendar:              'Agendar',
  programado:           'Programado',
  confirmado:           'Confirmado',
  remarcar:              'Remarcar',
  no_acudio:             'No acudió / revisar',
  completado:            'Completado',
};

// Mirrors SortGes.js's citaStatusResultadosOpts — used to render Att.
// Previa's "Status" column (the second, distinct "status" field on a cita).
const CITA_STATUS_RESULTADOS_LABELS = {
  en_curso:   'En curso',
  repeticion: 'Repetición',
  completado: 'Completado',
};

// "Alta seguro" — a 5-state cyclical control. Clicking the badge advances
// to the next state; each state has its own icon + circular background
// color, per the design brief. Icon choices (cilSend for "send", cilClock
// standing in for the hourglass/waiting icon) are the closest equivalents
// in the CoreUI free icon set — swap them here if exact glyphs are needed.
const ALTA_SEGURO_STATES = [
  { key: 'nada',             label: '—',                  icon: cilSend,  bg: '#000000' },
  { key: 'espera_poliza',    label: 'Espera póliza',       icon: cilClock, bg: '#dc3545' },
  // TODO: once tracked in DB, show the actual assignment date here instead of this label
  { key: 'fecha_asignacion', label: 'Fecha de asignación', icon: cilCheck, bg: '#ffc107' },
  { key: 'liberada',         label: 'Liberada',            icon: cilCheck, bg: '#198754' },
  { key: 'asignada',         label: 'Asignada',            icon: cilCheck, bg: '#6f42c1' },
];

// Psicología tab — SDG week checkpoints tracked from week 12 through week 40.
// The first checkpoint (week 12) is combined with HIM per the spec
// ("SDG12 / HIM"); every week uses the same RE/s-d/CR/NR catalog as
// HIM_OPTIONS/PSICO_ENT_OPTIONS above.
const PSICOLOGIA_SDG_WEEKS = ['12', '16', '20', '22', '26', '32', '34', '35', '36', '37', '38', '39', '40'];

// Catalog of statuses that can land in "Status General" / "Contra Status".
// Today only "Posible descarte" exists (triggered from the "Indicar
// posible descarte" button in each of the 5 tabs), but this stays a map
// so future status types slot in without touching the render logic.
const CANDIDATE_STATUS_OPTIONS = {
  posible_descarte: { label: 'Posible descarte', bg: '#dc3545' },
};

const EMPTY_FORM = {
  nombre_completo:  '',
  fecha_nacimiento: '',
  tel_1:            '',
  email:            '',
  esquema_ofrecido: '$400,000.00',
  ip_responsable:   '',
  status:           'iniciales',
  programa:         '1',
  vinculo:          '',
};

// Tab config — icon + label + color matching the image
const TABS = [
  { id: 'data-gesca',  label: 'Data GESCA',  icon: cilUser,      color: '#0098b3' },
  { id: 'admisiones',  label: 'Admisiones',  icon: cilClipboard, color: '#5856d6' },
  { id: 'att-previa',  label: 'Att. Previa', icon: cilCalendar,  color: '#d97ea1' },
  { id: 'psicologia',  label: 'Psicología',  icon: cilPeople,    color: '#0098b3' },
];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const calculateAge = (fecha) => {
  if (!fecha) return '-';
  const today = new Date();
  const b = new Date(fecha);
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
  return age;
};

const calculateIMC = (peso, altura) => {
  if (!peso || !altura) return null;
  return parseFloat((peso / (altura * altura)).toFixed(1));
};

const getIMCInfo = (imc) => {
  if (imc === null) return { label: '-', color: 'secondary' };
  if (imc < 18.5) return { label: 'Bajo peso', color: 'warning'   };
  if (imc < 23)   return { label: 'Saludable', color: 'success'   };
  if (imc < 25)   return { label: 'Riesgo',    color: 'info'      };
  if (imc < 30)   return { label: 'Sobrepeso', color: 'warning'   };
  return           { label: 'Obesidad',  color: 'danger'    };
};

const formatPHCAE = (c) =>
  `${c.partos||0}-${c.hijos||0}-${c.cesareas||0}-${c.abortos||0}-${c.embarazos||0}`;

// Counts how many of the given Checklist values are actually filled in
// (non-empty file URLs, for the "Docs" column)
const countFilled = (...vals) => vals.filter(v => v !== null && v !== undefined && v !== '').length;

// Counts how many of the given Checklist boolean flags are checked
// (for the "Cons" column)
const countTrue = (...vals) => vals.filter(v => v === 1 || v === true).length;

// Which consent type was selected in Checklist > Consentimientos formados
// (regular / hiv / gemelar / full_consent are mutually-exclusive flags)
const getSeleccion = (c) => {
  if (c.regular)      return 'Regular';
  if (c.hiv)           return 'HIV';
  if (c.gemelar)       return 'Gemelar';
  if (c.full_consent)  return 'Full';
  return '-';
};

// ─────────────────────────────────────────────────────────────
// Reusable sub-components
// ─────────────────────────────────────────────────────────────

// Sortable column header
const SortHeader = ({ label, sortKey, sortConfig, onSort, style = {}, title, rowSpan }) => (
  <CTableHeaderCell
    style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', ...style }}
    onClick={() => onSort(sortKey)}
    title={title}
    rowSpan={rowSpan}
  >
    <div className="d-flex align-items-center gap-1">
      {label}
      <CIcon
        icon={sortConfig.key === sortKey && sortConfig.direction === 'desc'
          ? cilArrowBottom : cilArrowTop}
        size="sm"
        className={sortConfig.key !== sortKey ? 'text-muted opacity-25' : ''}
      />
    </div>
  </CTableHeaderCell>
);

// Action buttons — same for all tabs
const ActionButtons = ({ candidate, onEdit, onDelete }) => (
  <div className="d-flex gap-1">
    <CButton color="warning" variant="ghost" size="sm" onClick={() => onEdit(candidate)}   title="Editar (requiere contraseña)">
      <CIcon icon={cilPencil} />
    </CButton>
    <CButton color="danger"  variant="ghost" size="sm" onClick={() => onDelete(candidate)} title="Eliminar (requiere contraseña)">
      <CIcon icon={cilTrash} />
    </CButton>
  </div>
);

// Maps each tab to its own dedicated backend column for RESP — Admisiones,
// Att. Previa and Psicología each persist independently now (separate DB
// columns on sort_ges_candidates), not the shared ip_responsable column
// anymore (that one stays reserved for the free-text "IP Responsable" field
// set at candidate creation/edit time — see CandidateFormFields).
const RESP_FIELD_BY_TAB = {
  admisiones:   'resp_admisiones',
  'att-previa': 'resp_att_previa',
  psicologia:   'resp_psicologia',
};

// "Resp" column dropdown — shared by Admisiones, Att. Previa and Psicología.
// Options come from GRUPOS_TRABAJO — a hardcoded placeholder list, since
// real work-group membership isn't wired up yet (see TODO above). Each tab
// keeps its own selection independent of the others, persisted to its own
// backend column (see RESP_FIELD_BY_TAB) — `respByTab` is only an
// optimistic local overlay on top of that (keyed by `${tabId}_${candidateId}`)
// until the PUT in handleRespChange resolves.
const RespSelect = ({ candidate, tabId, respByTab, onRespChange }) => {
  const key = `${tabId}_${candidate.id}`;
  const dbField = RESP_FIELD_BY_TAB[tabId];
  // Falls back to this tab's own persisted DB column only if this session
  // hasn't already overridden it locally.
  const value = respByTab[key] !== undefined ? respByTab[key] : (candidate[dbField] || '');
  return (
    <CFormSelect
      size="sm"
      value={value}
      onChange={(e) => onRespChange(tabId, candidate.id, e.target.value)}
      style={{ minWidth: '120px', fontSize: '0.8rem' }}
    >
      <option value="">— Sin asignar —</option>
      {GRUPOS_TRABAJO.map((g) => (
        <option key={g} value={g}>{g}</option>
      ))}
    </CFormSelect>
  );
};

// Plain option-list select — used for Vínculo, Ent/Psic and HIM columns
// in Admisiones. `options` is a flat array of strings used as both value
// and label.
const AdmisionesSelect = ({ value, onChange, options, blankLabel = '—' }) => (
  <CFormSelect
    size="sm"
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    style={{ minWidth: '90px', fontSize: '0.8rem' }}
  >
    <option value="">{blankLabel}</option>
    {options.map((opt) => (
      <option key={opt} value={opt}>{opt}</option>
    ))}
  </CFormSelect>
);

// Labeled-state select — used for 1° Consulta, Labs and Trat previo
// columns in Admisiones. `states` is an object of { key: { label } }.
const AdmisionesStatusSelect = ({ value, onChange, states, blankLabel = '—' }) => (
  <CFormSelect
    size="sm"
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    style={{ minWidth: '115px', fontSize: '0.8rem' }}
  >
    <option value="">{blankLabel}</option>
    {Object.entries(states).map(([key, { label }]) => (
      <option key={key} value={key}>{label}</option>
    ))}
  </CFormSelect>
);

// "Alta seguro" cyclical status badge — click advances to the next of the
// 5 states in ALTA_SEGURO_STATES, rendering that state's icon, circle
// background color and label.
const AltaSeguroBadge = ({ value, onClick }) => {
  const idx = Math.max(0, ALTA_SEGURO_STATES.findIndex((s) => s.key === value));
  const state = ALTA_SEGURO_STATES[idx] || ALTA_SEGURO_STATES[0];
  return (
    <button
      type="button"
      onClick={onClick}
      title={state.label}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        border: 'none', background: 'transparent', cursor: 'pointer', padding: 0,
      }}
    >
      <span
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '26px', height: '26px', borderRadius: '50%',
          backgroundColor: state.bg, flexShrink: 0,
        }}
      >
        <CIcon icon={state.icon} style={{ color: '#fff', width: 14, height: 14 }} />
      </span>
      <span style={{ fontSize: '0.78rem', color: '#333', whiteSpace: 'nowrap' }}>{state.label}</span>
    </button>
  );
};

// Simple lock/unlock toggle — used in Att. Previa's "Bloqueo" column.
// Local-only for now (no backend field yet); click flips between locked
// (closed padlock) and unlocked (open padlock).
const LockToggle = ({ locked, onClick }) => (
  <CButton
    type="button"
    color={locked ? 'warning' : 'secondary'}
    variant="ghost"
    size="sm"
    onClick={onClick}
    title={locked ? 'Bloqueado — clic para desbloquear' : 'Desbloqueado — clic para bloquear'}
  >
    <CIcon icon={locked ? cilLockLocked : cilLockUnlocked} />
  </CButton>
);

// Empty row
const EmptyRow = ({ colSpan, searchTerm }) => (
  <CTableRow>
    <CTableDataCell colSpan={colSpan} className="text-center py-5 text-muted">
      {searchTerm ? 'No se encontraron candidatos' : 'No hay candidatos registrados.'}
    </CTableDataCell>
  </CTableRow>
);

// ─────────────────────────────────────────────────────────────
// Tab table components
// ─────────────────────────────────────────────────────────────

const DataGescaTable = ({ rows, sortConfig, onSort, onEdit, onDelete, searchTerm }) => (
  <CTable hover striped align="middle" responsive className="nowrap-table">
    <CTableHead color="light">
      <CTableRow>
        <SortHeader label="Nombre"       sortKey="nombre_completo"  sortConfig={sortConfig} onSort={onSort} />
        <SortHeader label="Apellido"     sortKey="apellido"         sortConfig={sortConfig} onSort={onSort} />
        <SortHeader label="Edad"         sortKey="fecha_nacimiento" sortConfig={sortConfig} onSort={onSort} style={{ width: 60 }} />
        <CTableHeaderCell style={{ width: 130 }}>IMC</CTableHeaderCell>
        <SortHeader label="P-H-C-A-E"    sortKey="partos"           sortConfig={sortConfig} onSort={onSort} style={{ width: 130 }} />
        <SortHeader label="(RH)"         sortKey="tipo_sangre"      sortConfig={sortConfig} onSort={onSort} style={{ width: 60 }} />
        <CTableHeaderCell title="Archivo de documentación (Checklist)">Docs</CTableHeaderCell>
        <CTableHeaderCell title="Consentimientos formados (Checklist)">Cons</CTableHeaderCell>
        <CTableHeaderCell title="Selección en Consentimientos formados (Checklist)">Selección</CTableHeaderCell>
        <CTableHeaderCell>Esquema</CTableHeaderCell>
        <SortHeader label="Prog" sortKey="programa" sortConfig={sortConfig} onSort={onSort} style={{ width: 70 }} title="Programa (1° o 2°)" />
        <CTableHeaderCell title="Primer status registrado (ej. Posible descarte)">Status General</CTableHeaderCell>
        <CTableHeaderCell title="Segundo status registrado, si ya existía uno">Contra Status</CTableHeaderCell>
        <CTableHeaderCell style={{ width: 80 }}>Acciones</CTableHeaderCell>
      </CTableRow>
    </CTableHead>
    <CTableBody>
      {rows.length === 0 ? <EmptyRow colSpan={14} searchTerm={searchTerm} /> : rows.map(c => {
        const imc     = calculateIMC(c.peso, c.altura);
        const imcInfo = getIMCInfo(imc);
        // Nombre = first word only, Apellido = last word only (middle names, if any, are dropped)
        const parts   = (c.nombre_completo || '').trim().split(/\s+/).filter(Boolean);
        const nombre   = parts[0] || '-';
        const apellido = parts.length > 1 ? parts[parts.length - 1] : '-';
        const docsCount = countFilled(
          c.certificado_nacimiento_url, c.curp_url,
          c.comprobante_domicilio_url, c.poliza_seguro_url
        );
        const consCount = countTrue(
          c.consentimiento_informado, c.consentimiento_transferencia,
          c.aviso_privacidad, c.informacion_personal
        );
        const seleccion = getSeleccion(c);
        const progInfo = PROGRAMA_OPTIONS[c.programa];
        const statusGeneralInfo = CANDIDATE_STATUS_OPTIONS[c.status_general];
        const contraStatusInfo = CANDIDATE_STATUS_OPTIONS[c.contra_status];
        return (
          <CTableRow key={c.id}>
            <CTableDataCell>
              <Link to={`/babysite/sortGes/${c.id}`} className="text-decoration-none"
                style={{ color: '#5856d6', fontWeight: 500 }}>{nombre}</Link>
            </CTableDataCell>
            <CTableDataCell>{apellido}</CTableDataCell>
            <CTableDataCell>
              <strong style={{ color: calculateAge(c.fecha_nacimiento) > 35 ? '#dc3545' : '#0098b3' }}>
                {calculateAge(c.fecha_nacimiento)}
              </strong>
            </CTableDataCell>
            <CTableDataCell>
              <div className="d-flex align-items-center gap-1">
                {imc !== null && <span>{imc}</span>}
                <CBadge color={imcInfo.color} style={{ fontSize: '0.72rem' }}>{imcInfo.label}</CBadge>
              </div>
            </CTableDataCell>
            <CTableDataCell>
              <span style={{ color: '#d97ea1', fontWeight: 600 }}>{formatPHCAE(c)}</span>
            </CTableDataCell>
            <CTableDataCell>{c.tipo_sangre || '-'}</CTableDataCell>
            <CTableDataCell>
              <CBadge color={docsCount === 4 ? 'success' : docsCount === 0 ? 'secondary' : 'warning'}>
                {docsCount}/4
              </CBadge>
            </CTableDataCell>
            <CTableDataCell>
              <CBadge color={consCount === 4 ? 'success' : consCount === 0 ? 'secondary' : 'warning'}>
                {consCount}/4
              </CBadge>
            </CTableDataCell>
            <CTableDataCell>{seleccion}</CTableDataCell>
            <CTableDataCell>{seleccion}</CTableDataCell>
            <CTableDataCell>
              {progInfo
                ? <CBadge style={{ fontSize: '0.75rem', backgroundColor: progInfo.bg, color: '#fff' }}>{progInfo.label}</CBadge>
                : <span className="text-muted">—</span>}
            </CTableDataCell>
            <CTableDataCell>
              {statusGeneralInfo
                ? <CBadge style={{ fontSize: '0.75rem', backgroundColor: statusGeneralInfo.bg, color: '#fff' }}>{statusGeneralInfo.label}</CBadge>
                : <span className="text-muted">—</span>}
            </CTableDataCell>
            <CTableDataCell>
              {contraStatusInfo
                ? <CBadge style={{ fontSize: '0.75rem', backgroundColor: contraStatusInfo.bg, color: '#fff' }}>{contraStatusInfo.label}</CBadge>
                : <span className="text-muted">—</span>}
            </CTableDataCell>
            <CTableDataCell>
              <ActionButtons candidate={c} onEdit={onEdit} onDelete={onDelete} />
            </CTableDataCell>
          </CTableRow>
        );
      })}
    </CTableBody>
  </CTable>
);

const AdmisionesTable = ({
  rows, sortConfig, onSort, onEdit, onDelete, searchTerm,
  tabId, respByTab, onRespChange,
  fieldValues, onFieldChange,
}) => {
  const getField = (candidateId, field) => fieldValues[`${candidateId}_${field}`] || '';

  return (
    <CTable hover striped align="middle" responsive className="nowrap-table">
      <CTableHead color="light">
        <CTableRow>
          <CTableHeaderCell style={{ width: 140 }} rowSpan={2}>RESP</CTableHeaderCell>
          <CTableHeaderCell style={{ width: 60 }} rowSpan={2}>Qt (i)</CTableHeaderCell>
          <SortHeader label="Nombre"   sortKey="nombre_completo" sortConfig={sortConfig} onSort={onSort} rowSpan={2} />
          <SortHeader label="Apellido" sortKey="apellido"        sortConfig={sortConfig} onSort={onSort} rowSpan={2} />
          <CTableHeaderCell rowSpan={2}>Vínculo</CTableHeaderCell>
          <CTableHeaderCell rowSpan={2} style={{ width: 190 }}>Próxima Act</CTableHeaderCell>
          <CTableHeaderCell colSpan={2} className="text-center">Psicología</CTableHeaderCell>
          <CTableHeaderCell rowSpan={2}>1° Consulta</CTableHeaderCell>
          <CTableHeaderCell rowSpan={2}>Labs</CTableHeaderCell>
          <CTableHeaderCell rowSpan={2}>HIM</CTableHeaderCell>
          <CTableHeaderCell rowSpan={2}>Trat previo</CTableHeaderCell>
          <CTableHeaderCell rowSpan={2} style={{ width: 130 }}>ACO</CTableHeaderCell>
          <CTableHeaderCell rowSpan={2}>Alta seguro</CTableHeaderCell>
          <CTableHeaderCell style={{ width: 80 }} rowSpan={2}>Acciones</CTableHeaderCell>
        </CTableRow>
        <CTableRow>
          <CTableHeaderCell style={{ width: 70 }} title="Entrevista">Ent</CTableHeaderCell>
          <CTableHeaderCell style={{ width: 70 }} title="Psicométrico">Psic</CTableHeaderCell>
        </CTableRow>
      </CTableHead>
      <CTableBody>
        {rows.length === 0 ? <EmptyRow colSpan={15} searchTerm={searchTerm} /> : rows.map(c => {
          const parts    = (c.nombre_completo || '').trim().split(' ');
          const apellido = parts.length > 1 ? parts.slice(-1)[0] : '-';
          const nombre   = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0] || '-';
          const altaSeguroValue = getField(c.id, 'alta_seguro') || 'nada';

          return (
            <CTableRow key={c.id}>
              <CTableDataCell>
                <RespSelect candidate={c} tabId={tabId} respByTab={respByTab} onRespChange={onRespChange} />
              </CTableDataCell>
              <CTableDataCell className="text-center">—</CTableDataCell>
              <CTableDataCell>
                <Link to={`/babysite/sortGes/${c.id}`} className="text-decoration-none"
                  style={{ color: '#5856d6', fontWeight: 500 }}>{nombre}</Link>
              </CTableDataCell>
              <CTableDataCell>{apellido}</CTableDataCell>

              {/* Vínculo — read-only; set at candidate creation/edit time, not per-tab */}
              <CTableDataCell>{c.vinculo || '—'}</CTableDataCell>

              {/* Próxima Act — read-only, the closest upcoming date across
                  Checklist, Psico Social, Seguro Med and Cita Previa,
                  labeled with the event it came from (see getProximaActInfo) */}
              <CTableDataCell>
                {(() => {
                  const info = getProximaActInfo(c);
                  if (!info) return '—';
                  return (
                    <div style={{ lineHeight: 1.25 }}>
                      <div style={{ fontWeight: 600 }}>{info.date.toISOString().split('T')[0]}</div>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>{info.label}</div>
                    </div>
                  );
                })()}
              </CTableDataCell>

              {/* Psicología > Ent — read-only, linked to the candidate's own
                  "Entrevista admisión" row in Psico Inicial (SortGes.js) */}
              <CTableDataCell className="text-center">
                {RECOMENDACION_SHORT_LABELS[getPsicoInicialValue(c, 'Entrevista admisión', 'recomendacion')] || '—'}
              </CTableDataCell>

              {/* Psicología > Psic — read-only, linked to the candidate's own
                  "Psicométrico" row in Psico Inicial (SortGes.js) */}
              <CTableDataCell className="text-center">
                {RECOMENDACION_SHORT_LABELS[getPsicoInicialValue(c, 'Psicométrico', 'recomendacion')] || '—'}
              </CTableDataCell>

              {/* 1° Consulta — read-only, derived from the candidate's first
                  "cita" in Cita Previa > Iniciales (see getPrimeraConsultaStatus) */}
              <CTableDataCell>
                {CONSULTA_LABS_STATES[getPrimeraConsultaStatus(c)]?.label || '—'}
              </CTableDataCell>

              {/* Labs — read-only, derived from the same first "cita"'s
                  Entrega resultados date + Status (see getLabsStatus) */}
              <CTableDataCell>
                {CONSULTA_LABS_STATES[getLabsStatus(c)]?.label || '—'}
              </CTableDataCell>

              {/* HIM — read-only, linked to the candidate's most recent
                  HIM row (1-4) in Psico Inicial (SortGes.js) */}
              <CTableDataCell className="text-center">
                {RECOMENDACION_SHORT_LABELS[getHim1Value(c)] || '—'}
              </CTableDataCell>

              {/* Trat previo — read-only, derived from the candidate's first
                  "cita" in Cita Previa > Tratamiento previo (see getTratPrevioStatus) */}
              <CTableDataCell>
                {TRAT_PREVIO_STATES[getTratPrevioStatus(c)]?.label || '—'}
              </CTableDataCell>

              {/* ACO — read-only, sourced from "Fecha inicio ACO" in Alta Gesca
                  (candidate.tiempo_metodo_aco); colored by proximity to today
                  (red = passed, orange = within 10 days, black = further out) */}
              <CTableDataCell>
                {c.tiempo_metodo_aco ? (
                  <span style={{ color: getAcoDateColor(c.tiempo_metodo_aco), fontWeight: 600 }}>
                    {String(c.tiempo_metodo_aco).split('T')[0]}
                  </span>
                ) : '—'}
              </CTableDataCell>

              {/* Alta seguro — 5-state cyclical badge */}
              <CTableDataCell>
                <AltaSeguroBadge
                  value={altaSeguroValue}
                  onClick={() => {
                    const idx = ALTA_SEGURO_STATES.findIndex(s => s.key === altaSeguroValue);
                    const next = ALTA_SEGURO_STATES[(idx + 1) % ALTA_SEGURO_STATES.length].key;
                    onFieldChange(c.id, 'alta_seguro', next);
                  }}
                />
              </CTableDataCell>

              <CTableDataCell>
                <ActionButtons candidate={c} onEdit={onEdit} onDelete={onDelete} />
              </CTableDataCell>
            </CTableRow>
          );
        })}
      </CTableBody>
    </CTable>
  );
};

const AttPreviaTable = ({
  rows, sortConfig, onSort, onEdit, onDelete, searchTerm,
  tabId, respByTab, onRespChange,
  fieldValues, onFieldChange,
}) => {
  const getField = (candidateId, field) => fieldValues[`${candidateId}_${field}`] || '';

  return (
    <CTable hover striped align="middle" responsive className="nowrap-table">
      <CTableHead color="light">
        <CTableRow>
          <CTableHeaderCell style={{ width: 140 }}>RESP</CTableHeaderCell>
          <CTableHeaderCell style={{ width: 60 }}>Qt (i)</CTableHeaderCell>
          <SortHeader label="Nombre"   sortKey="nombre_completo" sortConfig={sortConfig} onSort={onSort} />
          <SortHeader label="Apellido" sortKey="apellido"        sortConfig={sortConfig} onSort={onSort} />
          <CTableHeaderCell>Dr. Tratante</CTableHeaderCell>
          <CTableHeaderCell style={{ width: 130 }}>Próxima Cita</CTableHeaderCell>
          <CTableHeaderCell>Status cita</CTableHeaderCell>
          <CTableHeaderCell style={{ width: 130 }}>Fecha de inicio</CTableHeaderCell>
          <CTableHeaderCell style={{ width: 130 }}>Fecha final</CTableHeaderCell>
          <CTableHeaderCell className="text-center" style={{ width: 60 }}>Bloqueo</CTableHeaderCell>
          <CTableHeaderCell style={{ width: 130 }}>Status</CTableHeaderCell>
          <CTableHeaderCell style={{ width: 80 }}>Acciones</CTableHeaderCell>
        </CTableRow>
      </CTableHead>
      <CTableBody>
        {rows.length === 0 ? <EmptyRow colSpan={12} searchTerm={searchTerm} /> : rows.map(c => {
          const parts    = (c.nombre_completo || '').trim().split(' ');
          const apellido = parts.length > 1 ? parts.slice(-1)[0] : '-';
          const nombre   = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0] || '-';
          const locked   = getField(c.id, 'bloqueo') === 'true';
          const lastCita = getLastCitaPrevia(c);

          return (
            <CTableRow key={c.id}>
              <CTableDataCell>
                <RespSelect candidate={c} tabId={tabId} respByTab={respByTab} onRespChange={onRespChange} />
              </CTableDataCell>
              <CTableDataCell className="text-center">—</CTableDataCell>
              <CTableDataCell>
                <Link to={`/babysite/sortGes/${c.id}`} className="text-decoration-none"
                  style={{ color: '#5856d6', fontWeight: 500 }}>{nombre}</Link>
              </CTableDataCell>
              <CTableDataCell>{apellido}</CTableDataCell>

              {/* Dr. Tratante — read-only, sourced from the candidate's last
                  Cita Previa register (Médico Tratante) */}
              <CTableDataCell>{lastCita?.dr_tratante || '—'}</CTableDataCell>

              {/* Próxima Cita — read-only, sourced from the last cita's Fecha Cita */}
              <CTableDataCell>
                {lastCita?.fecha_cita ? String(lastCita.fecha_cita).split('T')[0] : '—'}
              </CTableDataCell>

              {/* Status cita — read-only, sourced from the last cita's Status cita */}
              <CTableDataCell>
                {lastCita?.status ? (CITA_STATUS_LABELS[lastCita.status] || lastCita.status) : '—'}
              </CTableDataCell>

              {/* Fecha de inicio — read-only, sourced from the last cita's Inicio Tratamiento */}
              <CTableDataCell>
                {lastCita?.inicio_tratamiento ? String(lastCita.inicio_tratamiento).split('T')[0] : '—'}
              </CTableDataCell>

              {/* Fecha final — read-only, sourced from the last cita's Final */}
              <CTableDataCell>
                {lastCita?.final ? String(lastCita.final).split('T')[0] : '—'}
              </CTableDataCell>

              {/* Bloqueo — lock/unlock toggle */}
              <CTableDataCell className="text-center">
                <LockToggle
                  locked={locked}
                  onClick={() => onFieldChange(c.id, 'bloqueo', locked ? 'false' : 'true')}
                />
              </CTableDataCell>

              {/* Status — read-only, sourced from the last cita's second
                  Status field (status_resultados) — NOT the candidate's own
                  status anymore */}
              <CTableDataCell>
                {lastCita?.status_resultados
                  ? (CITA_STATUS_RESULTADOS_LABELS[lastCita.status_resultados] || lastCita.status_resultados)
                  : '—'}
              </CTableDataCell>

              <CTableDataCell>
                <ActionButtons candidate={c} onEdit={onEdit} onDelete={onDelete} />
              </CTableDataCell>
            </CTableRow>
          );
        })}
      </CTableBody>
    </CTable>
  );
};

const PsicologiaTable = ({
  rows, sortConfig, onSort, onEdit, onDelete, searchTerm,
  tabId, respByTab, onRespChange,
  fieldValues, onFieldChange,
}) => {
  const getField = (candidateId, field) => fieldValues[`${candidateId}_${field}`] || '';
  const emptyColSpan = 9 + PSICOLOGIA_SDG_WEEKS.length; // RESP,Qt,Nombre,Apellido,Status,Fecha,Estado,Entrevista,Acciones + SDG weeks

  return (
    <CTable hover striped align="middle" responsive className="nowrap-table">
      <CTableHead color="light">
        <CTableRow>
          <CTableHeaderCell style={{ width: 140 }} rowSpan={2}>RESP</CTableHeaderCell>
          <CTableHeaderCell style={{ width: 60 }} rowSpan={2}>Qt (i)</CTableHeaderCell>
          <SortHeader label="Nombre"   sortKey="nombre_completo" sortConfig={sortConfig} onSort={onSort} rowSpan={2} />
          <SortHeader label="Apellido" sortKey="apellido"        sortConfig={sortConfig} onSort={onSort} rowSpan={2} />
          <SortHeader label="Status"   sortKey="status"          sortConfig={sortConfig} onSort={onSort} rowSpan={2} style={{ width: 110 }} />
          <CTableHeaderCell colSpan={2} className="text-center">Psicométrico</CTableHeaderCell>
          <CTableHeaderCell rowSpan={2}>Entrevista</CTableHeaderCell>
          {PSICOLOGIA_SDG_WEEKS.map((week, i) => (
            <CTableHeaderCell key={week} rowSpan={2} style={{ width: 90 }}>
              {i === 0 ? 'SDG12 / HIM' : `SDG ${week}`}
            </CTableHeaderCell>
          ))}
          <CTableHeaderCell style={{ width: 80 }} rowSpan={2}>Acciones</CTableHeaderCell>
        </CTableRow>
        <CTableRow>
          <CTableHeaderCell style={{ width: 125 }}>Fecha</CTableHeaderCell>
          <CTableHeaderCell style={{ width: 115 }}>Estado</CTableHeaderCell>
        </CTableRow>
      </CTableHead>
      <CTableBody>
        {rows.length === 0 ? <EmptyRow colSpan={emptyColSpan} searchTerm={searchTerm} /> : rows.map(c => {
          const stInfo   = STATUS_OPTIONS[c.status] || { label: c.status, color: 'secondary' };
          const parts    = (c.nombre_completo || '').trim().split(' ');
          const apellido = parts.length > 1 ? parts.slice(-1)[0] : '-';
          const nombre   = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0] || '-';
          return (
            <CTableRow key={c.id}>
              <CTableDataCell>
                <RespSelect candidate={c} tabId={tabId} respByTab={respByTab} onRespChange={onRespChange} />
              </CTableDataCell>
              <CTableDataCell className="text-center">—</CTableDataCell>
              <CTableDataCell>
                <Link to={`/babysite/sortGes/${c.id}`} className="text-decoration-none"
                  style={{ color: '#5856d6', fontWeight: 500 }}>{nombre}</Link>
              </CTableDataCell>
              <CTableDataCell>{apellido}</CTableDataCell>
              <CTableDataCell>
                <CBadge color={stInfo.color} style={{ fontSize: '0.75rem' }}>{stInfo.label}</CBadge>
              </CTableDataCell>

              {/* Psicométrico > Fecha — read-only, linked to the candidate's
                  own "Psicométrico" row in Psico Inicial (SortGes.js) */}
              <CTableDataCell>
                {(() => {
                  const fecha = getPsicoInicialValue(c, 'Psicométrico', 'fecha');
                  return fecha ? String(fecha).split('T')[0] : '—';
                })()}
              </CTableDataCell>

              {/* Psicométrico > Estado — despite the column header, this reads
                  the THIRD field on that Psico Inicial row (Recomendación),
                  not the "Estado" field — matching how Admisiones' "Psic"
                  column already links to the same data */}
              <CTableDataCell>
                {RECOMENDACION_SHORT_LABELS[getPsicoInicialValue(c, 'Psicométrico', 'recomendacion')] || '—'}
              </CTableDataCell>

              {/* Entrevista — read-only, shows both date and result (recomendación)
                  from the candidate's "Entrevista admisión" row in Psico Inicial */}
              <CTableDataCell>
                {(() => {
                  const fecha = getPsicoInicialValue(c, 'Entrevista admisión', 'fecha');
                  const fechaStr = fecha ? String(fecha).split('T')[0] : null;
                  const resultado = RECOMENDACION_SHORT_LABELS[getPsicoInicialValue(c, 'Entrevista admisión', 'recomendacion')];
                  if (!fechaStr && !resultado) return '—';
                  return [fechaStr, resultado].filter(Boolean).join(' — ');
                })()}
              </CTableDataCell>

              {/* SDG week checkpoints — each a RE/s-d/CR/NR select */}
              {PSICOLOGIA_SDG_WEEKS.map((week) => (
                <CTableDataCell key={week}>
                  <AdmisionesSelect
                    value={getField(c.id, `sdg_${week}`)}
                    onChange={(v) => onFieldChange(c.id, `sdg_${week}`, v)}
                    options={HIM_OPTIONS}
                  />
                </CTableDataCell>
              ))}

              <CTableDataCell>
                <ActionButtons candidate={c} onEdit={onEdit} onDelete={onDelete} />
              </CTableDataCell>
            </CTableRow>
          );
        })}
      </CTableBody>
    </CTable>
  );
};

// Shared form fields for the create/edit candidate modals — defined at
// module scope (NOT inside SortGesList) so it keeps a stable identity
// across renders. Defining it inside the component body would recreate
// the component (and remount its inputs) on every keystroke, which is
// what caused focus to jump back to "Nombre completo" (its autoFocus
// input) whenever another field was clicked or typed into.
const CandidateFormFields = ({ form, setForm }) => (
  <>
    <div className="mb-3">
      <CFormLabel>Nombre completo: <span className="text-danger">*</span></CFormLabel>
      <CFormInput placeholder="Nombre y apellidos" value={form.nombre_completo}
        onChange={e => setForm(p => ({ ...p, nombre_completo: e.target.value }))} autoFocus />
    </div>
    <div className="mb-3">
      <CFormLabel>Fecha de nacimiento:</CFormLabel>
      <CFormInput type="date" value={form.fecha_nacimiento}
        onChange={e => setForm(p => ({ ...p, fecha_nacimiento: e.target.value }))} />
    </div>
    <CRow>
      <CCol md={6} className="mb-3">
        <CFormLabel>Teléfono:</CFormLabel>
        <CFormInput placeholder="+52 55 0000 0000" value={form.tel_1}
          onChange={e => setForm(p => ({ ...p, tel_1: e.target.value }))} />
      </CCol>
      <CCol md={6} className="mb-3">
        <CFormLabel>Email:</CFormLabel>
        <CFormInput type="email" placeholder="correo@ejemplo.com" value={form.email}
          onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
      </CCol>
    </CRow>
    <CRow>
      <CCol md={6} className="mb-3">
        <CFormLabel>Esquema ofrecido:</CFormLabel>
        <CFormSelect value={form.esquema_ofrecido}
          onChange={e => setForm(p => ({ ...p, esquema_ofrecido: e.target.value }))}>
          <option value="$400,000.00">$400,000.00</option>
          <option value="$375,000.00">$375,000.00</option>
        </CFormSelect>
      </CCol>
      <CCol md={6} className="mb-3">
        <CFormLabel>Status:</CFormLabel>
        <CFormSelect value={form.status}
          onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
          {Object.entries(STATUS_OPTIONS).map(([val, { label }]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </CFormSelect>
      </CCol>
    </CRow>
    <CRow>
      <CCol md={6} className="mb-3">
        <CFormLabel>Programa:</CFormLabel>
        <CFormSelect value={form.programa}
          onChange={e => setForm(p => ({ ...p, programa: e.target.value }))}>
          {Object.entries(PROGRAMA_OPTIONS).map(([val, { label }]) => (
            <option key={val} value={val}>{label} Programa</option>
          ))}
        </CFormSelect>
      </CCol>
      <CCol md={6} className="mb-3">
        <CFormLabel>IP Responsable:</CFormLabel>
        <CFormInput placeholder="Nombre del responsable" value={form.ip_responsable}
          onChange={e => setForm(p => ({ ...p, ip_responsable: e.target.value }))} />
      </CCol>
    </CRow>
    <CRow>
      <CCol md={6} className="mb-3">
        <CFormLabel>Vínculo:</CFormLabel>
        <CFormSelect value={form.vinculo}
          onChange={e => setForm(p => ({ ...p, vinculo: e.target.value }))}>
          <option value="">— Seleccionar —</option>
          {VINCULO_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </CFormSelect>
      </CCol>
    </CRow>
  </>
);

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────
const SortGesList = () => {
  const navigate = useNavigate();

  // ── Data ─────────────────────────────────────────────────────
  const [candidates, setCandidates] = useState([]);
  const [users, setUsers]           = useState([]); // kept for now — currently unused by the RESP dropdowns (see GRUPOS_TRABAJO); reintroduce if a future feature needs the raw system-user list
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [activeTab, setActiveTab]   = useState('data-gesca');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'nombre_completo', direction: 'asc' });
  const [alert, setAlert]           = useState({ show: false, type: '', message: '' });

  // Per-tab RESP selections — keyed by `${tabId}_${candidateId}`. This is
  // just an optimistic local overlay now; the actual independence between
  // Admisiones / Att. Previa / Psicología comes from each persisting to its
  // own DB column (see RESP_FIELD_BY_TAB / handleRespChange / RespSelect).
  const [respByTab, setRespByTab] = useState({});

  // Admisiones tab — local UI state for the Alta seguro column (the only
  // one left still edited directly here). Everything else that used to live
  // in this state is now read-only/derived from real data:
  // Ent/Psic/HIM ← Psico Inicial (getPsicoInicialValue/getHim1Value),
  // 1° Consulta/Labs/Trat previo ← Cita Previa (getPrimeraConsultaStatus/
  // getLabsStatus/getTratPrevioStatus), ACO ← Alta Gesca's tiempo_metodo_aco,
  // Próxima Act ← everything (see getProximaActInfo).
  // Alta seguro has no backend column yet, so its value lives only in this
  // session — keyed by `${candidateId}_${field}`.
  // (Vínculo is NOT here either — it's a real
  // candidate-record field set at creation/edit time, see VINCULO_OPTIONS.)
  const [admisionesFields, setAdmisionesFields] = useState({});

  // Att. Previa tab — local UI state for the Bloqueo column only (the sole
  // field still edited directly here). Dr. Tratante / Próxima Cita / Status
  // cita / Fecha de inicio / Fecha final / Status are all now read-only,
  // derived from the candidate's last Cita Previa register (see
  // getLastCitaPrevia). No backend column for Bloqueo yet, so it's
  // session-only — keyed by `${candidateId}_${field}`.
  const [attPreviaFields, setAttPreviaFields] = useState({});

  // Psicología tab — local UI state for the SDG-week checkpoint columns only
  // (the ones still edited directly here). Psicométrico (Fecha + the
  // Recomendación-based "Estado") and Entrevista are now read-only, linked
  // to the candidate's own Psico Inicial record (see getPsicoInicialValue).
  // The SDG-week fields have no backend columns yet, so they're
  // session-only — keyed by `${candidateId}_${field}`.
  const [psicologiaFields, setPsicologiaFields] = useState({});

  // ── Create modal ─────────────────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating]               = useState(false);
  const [createForm, setCreateForm]           = useState(EMPTY_FORM);

  // ── Edit modal ───────────────────────────────────────────────
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId]         = useState(null);
  const [saving, setSaving]               = useState(false);
  const [editForm, setEditForm]           = useState(EMPTY_FORM);

  // ── Delete modal ─────────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId]           = useState(null);
  const [deletingName, setDeletingName]       = useState('');
  const [deleting, setDeleting]               = useState(false);

  // ── Password gate ─────────────────────────────────────────────
  const ADMIN_PASSWORD                = '26213256';
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwAction, setPwAction]       = useState(null);
  const [pwInput, setPwInput]         = useState('');
  const [pwError, setPwError]         = useState('');

  // ── Lifecycle ─────────────────────────────────────────────────
  useEffect(() => { fetchCandidates(); fetchUsers(); }, []);

  // ═══════════════════════════════════════════════════════════
  // API
  // ═══════════════════════════════════════════════════════════

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/sort-ges', { withCredentials: true });
      const list = res.data || [];
      setCandidates(list);
      setError(null);
      // GET /api/sort-ges doesn't include any of a candidate's per-tab data
      // (psico_inicial, cita_previa, checklist, seguro_vida, seguro_mat,
      // seguimiento) — each is fetched individually per candidate and
      // merged in below. Together these power every derived/read-only
      // column in Admisiones and Att. Previa (Ent/Psic/HIM, 1° Consulta,
      // Labs, Trat previo, Próxima Act, and the Att. Previa columns).
      // Runs in the background — doesn't block the main table from rendering.
      fetchPsicoInicialForCandidates(list);
      fetchCitaPreviaForCandidates(list);
      fetchChecklistForCandidates(list);
      fetchSeguroVidaForCandidates(list);
      fetchSeguroMatForCandidates(list);
      fetchSeguimientoForCandidates(list);
    } catch (err) {
      console.error(err);
      setError('Error al cargar los candidatos');
    } finally {
      setLoading(false);
    }
  };

  // Shared by all the per-candidate background fetches below: hits
  // `${basePath}` for every candidate in parallel, and merges the result
  // into `candidate[stateKey]`. `extract` picks the right piece out of each
  // response (defaults to the whole response body, e.g. for list-shaped
  // endpoints like /checklist that return a single object rather than an array).
  //
  // TODO: this is N+1 per source (6 sources × N candidates on every list
  // load) — fine for a small list, but if this ever gets slow, the real
  // fix is a backend endpoint that returns all of this nested per candidate
  // in the GET /api/sort-ges response itself, so none of these six
  // functions (or their calls above) are needed at all.
  const fetchPerCandidate = async (candidateList, basePath, stateKey, extract = (res) => res.data) => {
    try {
      const results = await Promise.all(
        candidateList.map((c) =>
          api.get(`/api/sort-ges/${c.id}${basePath}`, { withCredentials: true })
            .then((res) => ({ id: c.id, value: extract(res) }))
            .catch((err) => {
              console.error(`Error fetching ${basePath} for candidate ${c.id}:`, err);
              return { id: c.id, value: extract({ data: null }) };
            })
        )
      );
      setCandidates((prev) => prev.map((c) => {
        const match = results.find((r) => r.id === c.id);
        return match ? { ...c, [stateKey]: match.value } : c;
      }));
    } catch (err) {
      console.error(`Error fetching ${basePath} for candidates:`, err);
    }
  };

  const fetchPsicoInicialForCandidates = (candidateList) =>
    fetchPerCandidate(candidateList, '/psico-inicial', 'psico_inicial', (res) => res.data || []);

  const fetchCitaPreviaForCandidates = (candidateList) =>
    fetchPerCandidate(candidateList, '/cita-previa', 'cita_previa', (res) => res.data || []);

  // Powers Próxima Act's "Programar cita para entrega" / "...para firma" dates
  const fetchChecklistForCandidates = (candidateList) =>
    fetchPerCandidate(candidateList, '/checklist', 'checklist', (res) => res.data || null);

  // Powers Próxima Act's Seguro de Vida dates
  const fetchSeguroVidaForCandidates = (candidateList) =>
    fetchPerCandidate(candidateList, '/seguro-vida', 'seguro_vida', (res) => res.data || []);

  // Powers Próxima Act's Seguro de Maternidad dates (including per-cuota vencimientos)
  const fetchSeguroMatForCandidates = (candidateList) =>
    fetchPerCandidate(candidateList, '/seguro-mat', 'seguro_mat', (res) => res.data || []);

  // Powers Próxima Act's Seguimiento Psicológico "programar" dates
  const fetchSeguimientoForCandidates = (candidateList) =>
    fetchPerCandidate(candidateList, '/seguimiento', 'seguimiento', (res) => res.data || []);

  // System users list — currently unused by the RESP dropdowns (they use
  // the hardcoded GRUPOS_TRABAJO instead, see the TODO near the top of this
  // file), but fetched still in case another feature needs it soon.
  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/users', { withCredentials: true });
      const filtered = (res.data || []).filter(
        (u) => u.username?.toLowerCase() !== 'adminbabycloud'
      );
      setUsers(filtered);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  // Persist a "Resp" reassignment from any of the three dropdown tables.
  // Each tab keeps its own local value in respByTab (so the three tabs
  // don't overwrite each other's selection on screen), but the write still
  // goes to the single shared ip_responsable column on the backend until
  // there are real per-tab/group columns to store it in.
  // Persists a RESP change to this tab's OWN dedicated column (see
  // RESP_FIELD_BY_TAB) — Admisiones/Att. Previa/Psicología no longer share
  // ip_responsable, so setting one doesn't affect the others, even after a
  // page reload.
  const handleRespChange = async (tabId, candidateId, newRespValue) => {
    const key = `${tabId}_${candidateId}`;
    setRespByTab((prev) => ({ ...prev, [key]: newRespValue })); // optimistic, tab-local
    const dbField = RESP_FIELD_BY_TAB[tabId];

    try {
      await api.put(
        `/api/sort-ges/${candidateId}`,
        { [dbField]: newRespValue || null },
        { withCredentials: true }
      );
      setCandidates((prev) => prev.map((c) =>
        c.id === candidateId ? { ...c, [dbField]: newRespValue } : c
      ));
    } catch (err) {
      console.error('Error updating Resp:', err);
      showNotification('danger', 'Error al asignar responsable');
      // Roll back the optimistic local change for this tab
      setRespByTab((prev) => {
        const n = { ...prev };
        delete n[key];
        return n;
      });
    }
  };

  // Local-only update for the Admisiones tab's not-yet-backed-by-DB fields.
  // TODO: once these fields have real backend columns, persist here the
  // same way handleRespChange does for ip_responsable.
  const handleAdmisionesFieldChange = (candidateId, field, value) => {
    setAdmisionesFields((prev) => ({ ...prev, [`${candidateId}_${field}`]: value }));
  };

  // Local-only update for the Att. Previa tab's not-yet-backed-by-DB fields.
  // TODO: once these fields have real backend columns, persist here the
  // same way handleRespChange does for ip_responsable.
  const handleAttPreviaFieldChange = (candidateId, field, value) => {
    setAttPreviaFields((prev) => ({ ...prev, [`${candidateId}_${field}`]: value }));
  };

  // Local-only update for the Psicología tab's not-yet-backed-by-DB fields.
  // TODO: once these fields have real backend columns, persist here the
  // same way handleRespChange does for ip_responsable.
  const handlePsicologiaFieldChange = (candidateId, field, value) => {
    setPsicologiaFields((prev) => ({ ...prev, [`${candidateId}_${field}`]: value }));
  };

  const handleCreate = async () => {
    if (!createForm.nombre_completo.trim()) {
      showNotification('warning', 'El nombre completo es obligatorio');
      return;
    }
    try {
      setCreating(true);
      const res = await api.post('/api/sort-ges', {
        status: createForm.status, ip_responsable: createForm.ip_responsable || null,
        programa: createForm.programa || null, vinculo: createForm.vinculo || null,
      }, { withCredentials: true });
      const newId = res.data.id;
      await api.put(`/api/sort-ges/${newId}/alta-gesca`, {
        nombre_completo:  createForm.nombre_completo,
        fecha_nacimiento: createForm.fecha_nacimiento || null,
        tel_1:            createForm.tel_1            || null,
        email:            createForm.email            || null,
        esquema_ofrecido: createForm.esquema_ofrecido || null,
      }, { withCredentials: true });
      setShowCreateModal(false);
      setCreateForm(EMPTY_FORM);
      navigate(`/babysite/sortGes/${newId}`);
    } catch (err) {
      console.error(err);
      showNotification('danger', 'Error al crear el candidato');
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async () => {
    if (!editForm.nombre_completo.trim()) {
      showNotification('warning', 'El nombre completo es obligatorio');
      return;
    }
    try {
      setSaving(true);
      await api.put(`/api/sort-ges/${editingId}`, {
        status: editForm.status, ip_responsable: editForm.ip_responsable || null,
        programa: editForm.programa || null, vinculo: editForm.vinculo || null,
      }, { withCredentials: true });
      await api.put(`/api/sort-ges/${editingId}/alta-gesca`, {
        nombre_completo:  editForm.nombre_completo,
        fecha_nacimiento: editForm.fecha_nacimiento || null,
        tel_1:            editForm.tel_1            || null,
        email:            editForm.email            || null,
        esquema_ofrecido: editForm.esquema_ofrecido || null,
      }, { withCredentials: true });
      setCandidates(prev => prev.map(c =>
        c.id === editingId ? {
          ...c,
          nombre_completo:  editForm.nombre_completo,
          fecha_nacimiento: editForm.fecha_nacimiento || null,
          telefono:         editForm.tel_1,
          email:            editForm.email,
          esquema_ofrecido: editForm.esquema_ofrecido,
          vinculo:          editForm.vinculo,
          ip_responsable:   editForm.ip_responsable,
          status:           editForm.status,
          programa:         editForm.programa,
        } : c
      ));
      setShowEditModal(false);
      setEditingId(null);
      showNotification('success', 'Candidato actualizado');
    } catch (err) {
      console.error(err);
      showNotification('danger', 'Error al actualizar el candidato');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(`/api/sort-ges/${deletingId}`, { withCredentials: true });
      setCandidates(prev => prev.filter(c => c.id !== deletingId));
      setShowDeleteModal(false);
      setDeletingId(null);
      showNotification('success', 'Candidato eliminado');
    } catch (err) {
      console.error(err);
      showNotification('danger', 'Error al eliminar el candidato');
    } finally {
      setDeleting(false);
    }
  };

  // ── Password gate ────────────────────────────────────────────
  const openEdit = (candidate) => {
    setPwAction({ type: 'edit', candidate });
    setPwInput(''); setPwError('');
    setShowPwModal(true);
  };

  const openDelete = (candidate) => {
    setPwAction({ type: 'delete', candidate });
    setPwInput(''); setPwError('');
    setShowPwModal(true);
  };

  const closePwModal = () => {
    setShowPwModal(false);
    setPwInput('');
    setPwError('');
    setPwAction(null);  // ← must reset or stale pwAction causes re-render issues
  };

  const confirmPassword = () => {
    if (!pwAction) return;  // guard against stale state
    if (pwInput !== ADMIN_PASSWORD) {
      setPwError('Contraseña incorrecta');
      setPwInput('');  // clear input so user retypes — prevents "frozen" appearance
      return;
    }
    const { type, candidate } = pwAction;
    // Close and reset pw modal before opening the next one
    setShowPwModal(false);
    setPwInput('');
    setPwError('');
    setPwAction(null);
    if (type === 'edit') {
      setEditingId(candidate.id);
      setEditForm({
        nombre_completo:  candidate.nombre_completo  || '',
        fecha_nacimiento: candidate.fecha_nacimiento
          ? candidate.fecha_nacimiento.split('T')[0] : '',
        tel_1:            candidate.telefono         || '',
        email:            candidate.email            || '',
        esquema_ofrecido: candidate.esquema_ofrecido || '$400,000.00',
        ip_responsable:   candidate.ip_responsable   || '',
        status:           candidate.status           || 'iniciales',
        programa:         candidate.programa         || '1',
        vinculo:          candidate.vinculo          || '',
      });
      setShowEditModal(true);
    } else {
      setDeletingId(candidate.id);
      setDeletingName(candidate.nombre_completo || `Candidato #${candidate.id}`);
      setShowDeleteModal(true);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────
  const showNotification = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

  const handleSort = (key) => setSortConfig(prev => ({
    key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
  }));

  const filtered = useMemo(() => {
    let r = [...candidates];
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      r = r.filter(c =>
        c.nombre_completo?.toLowerCase().includes(t) ||
        c.status?.toLowerCase().includes(t) ||
        c.tipo_sangre?.toLowerCase().includes(t) ||
        c.email?.toLowerCase().includes(t) ||
        c.ip_responsable?.toLowerCase().includes(t)
      );
    }
    r.sort((a, b) => {
      let av = a[sortConfig.key] || '';
      let bv = b[sortConfig.key] || '';
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortConfig.direction === 'asc' ? -1 : 1;
      if (av > bv) return sortConfig.direction === 'asc' ?  1 : -1;
      return 0;
    });
    return r;
  }, [candidates, searchTerm, sortConfig]);

  // Shared table props — tabId is added per-tab at the CTabPane call sites below,
  // since it must differ between Admisiones / Att. Previa / Psicología.
  const tableProps = {
    rows: filtered, sortConfig, onSort: handleSort,
    onEdit: openEdit, onDelete: openDelete, searchTerm,
    respByTab, onRespChange: handleRespChange,
  };

  // ── Shared form fields ────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <CContainer className="d-flex justify-content-center align-items-center"
        style={{ minHeight: '400px' }}>
        <CSpinner color="primary" />
      </CContainer>
    );
  }

  return (
    <CContainer fluid>
      {alert.show && (
        <CAlert className="mx-3" color={alert.type} dismissible
          onClose={() => setAlert({ show: false })}>
          {alert.message}
        </CAlert>
      )}

      <CCard className="mb-4 mx-3">
        {/* ── Tab navigation ── */}
        <div className="px-4 pt-3 pb-0 border-bottom d-flex align-items-center justify-content-between">
          {/* Tabs */}
          <CNav variant="tabs" style={{ borderBottom: 'none', gap: '4px' }}>
            {TABS.map(tab => (
              <CNavItem key={tab.id}>
                <CNavLink
                  active={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    cursor: 'pointer',
                    color:  activeTab === tab.id ? tab.color : '#6c757d',
                    fontWeight: activeTab === tab.id ? 700 : 400,
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === tab.id
                      ? `3px solid ${tab.color}` : '3px solid transparent',
                    paddingBottom: '10px',
                    paddingTop: '4px',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    transition: 'all 0.15s',
                  }}
                >
                  <CIcon icon={tab.icon} size="sm" />
                  {tab.label}
                </CNavLink>
              </CNavItem>
            ))}
          </CNav>

          {/* Search + add — top right */}
          <div className="d-flex align-items-center gap-2 pb-2">
            <CInputGroup size="sm" style={{ width: '220px' }}>
              <CInputGroupText style={{ backgroundColor: '#fff', borderRight: 'none' }}>
                <CIcon icon={cilSearch} style={{ color: '#d97ea1' }} />
              </CInputGroupText>
              <CFormInput
                placeholder="Buscar..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                autoComplete="off"
                style={{ borderLeft: 'none' }}
              />
            </CInputGroup>
            <CButton
              size="sm"
              color="primary"
              onClick={() => { setCreateForm(EMPTY_FORM); setShowCreateModal(true); }}
              style={{
                backgroundColor: '#d97ea1', borderColor: '#d97ea1',
                borderRadius: '50%', width: '32px', height: '32px', padding: 0,
              }}
              title="Nuevo candidato"
            >
              <CIcon icon={cilPlus} />
            </CButton>
          </div>
        </div>

        <CCardBody className="p-0">
          {error && <CAlert color="danger" className="m-3">{error}</CAlert>}

          {/* Count */}
          <div className="px-3 py-2 text-muted" style={{ fontSize: '0.78rem', borderBottom: '1px solid #f0f0f0' }}>
            {filtered.length} de {candidates.length} candidatos
          </div>

          {/* Tab content */}
          <CTabContent>
            <CTabPane visible={activeTab === 'data-gesca'}>
              <DataGescaTable   {...tableProps} />
            </CTabPane>
            <CTabPane visible={activeTab === 'admisiones'}>
              <AdmisionesTable
                {...tableProps}
                tabId="admisiones"
                fieldValues={admisionesFields}
                onFieldChange={handleAdmisionesFieldChange}
              />
            </CTabPane>
            <CTabPane visible={activeTab === 'att-previa'}>
              <AttPreviaTable
                {...tableProps}
                tabId="att-previa"
                fieldValues={attPreviaFields}
                onFieldChange={handleAttPreviaFieldChange}
              />
            </CTabPane>
            <CTabPane visible={activeTab === 'psicologia'}>
              <PsicologiaTable
                {...tableProps}
                tabId="psicologia"
                fieldValues={psicologiaFields}
                onFieldChange={handlePsicologiaFieldChange}
              />
            </CTabPane>
          </CTabContent>
        </CCardBody>
      </CCard>

      {/* ── Password gate modal ── */}
      <CModal visible={showPwModal} onClose={closePwModal}>
        <CModalHeader>
          <CModalTitle>
            {pwAction?.type === 'delete' ? '🗑 Eliminar candidato' : '✏️ Editar candidato'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p className="text-muted small mb-3">
            Ingrese la contraseña de administrador para continuar.
          </p>
          <CFormLabel>Contraseña:</CFormLabel>
          <CFormInput
            type="password"
            value={pwInput}
            placeholder="Contraseña"
            onChange={e => { setPwInput(e.target.value); setPwError(''); }}
            onKeyDown={e => { if (e.key === 'Enter') confirmPassword(); }}
            invalid={!!pwError}
            autoComplete="new-password"
            autoFocus
          />
          {pwError && (
            <div className="text-danger small mt-1">{pwError}</div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={closePwModal}>Cancelar</CButton>
          <CButton
            color={pwAction?.type === 'delete' ? 'danger' : 'warning'}
            onClick={confirmPassword}
            disabled={!pwInput}
          >
            Confirmar
          </CButton>
        </CModalFooter>
      </CModal>

      {/* ── Create modal ── */}
      <CModal visible={showCreateModal} onClose={() => setShowCreateModal(false)} size="lg">
        <CModalHeader><CModalTitle>Nuevo candidato</CModalTitle></CModalHeader>
        <CModalBody>
          <p className="text-muted small mb-3">
            Ingrese los datos básicos. Podrá completar el resto desde el expediente.
          </p>
          <CandidateFormFields form={createForm} setForm={setCreateForm} />
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowCreateModal(false)}>Cancelar</CButton>
          <CButton color="primary" onClick={handleCreate}
            disabled={creating || !createForm.nombre_completo.trim()}
            style={{ backgroundColor: '#d97ea1', borderColor: '#d97ea1' }}>
            {creating ? <><CSpinner size="sm" className="me-1" />Creando...</> : 'Crear y abrir expediente'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* ── Edit modal ── */}
      <CModal visible={showEditModal} onClose={() => setShowEditModal(false)} size="lg">
        <CModalHeader><CModalTitle>Editar candidato</CModalTitle></CModalHeader>
        <CModalBody>
          <CandidateFormFields form={editForm} setForm={setEditForm} />
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowEditModal(false)}>Cancelar</CButton>
          <CButton color="primary" onClick={handleEdit}
            disabled={saving || !editForm.nombre_completo.trim()}
            style={{ backgroundColor: '#d97ea1', borderColor: '#d97ea1' }}>
            {saving ? <><CSpinner size="sm" className="me-1" />Guardando...</> : 'Guardar cambios'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* ── Delete confirm modal ── */}
      <CModal visible={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <CModalHeader>
          <CModalTitle>
            <CIcon icon={cilWarning} className="me-2 text-danger" />Eliminar candidato
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>¿Está seguro de eliminar a <strong>{deletingName}</strong>?</p>
          <p className="text-danger small">
            Esta acción eliminará el expediente completo incluyendo todos los seguros,
            documentos y registros psicológicos. No se puede deshacer.
          </p>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</CButton>
          <CButton color="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? <><CSpinner size="sm" className="me-1" />Eliminando...</> : 'Eliminar definitivamente'}
          </CButton>
        </CModalFooter>
      </CModal>

      <style>{`
        .nowrap-table th,
        .nowrap-table td {
          white-space: nowrap;
          vertical-align: middle;
        }
      `}</style>
    </CContainer>
  );
};

export default SortGesList;