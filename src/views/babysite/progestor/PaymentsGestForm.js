// src/views/pages/programs/PaymentsGestForm.js
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CCol, CContainer, CRow,
  CButton, CFormInput, CFormSelect, CFormLabel, CFormCheck,
  CAlert, CTable, CTableHead, CTableRow, CTableHeaderCell,
  CTableBody, CTableDataCell, CModal, CModalHeader, CModalTitle,
  CModalBody, CModalFooter, CBadge, CSpinner, CAccordion, CAccordionItem,
  CAccordionHeader, CAccordionBody,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilArrowLeft, cilSave, cilPlus, cilTrash, cilWarning, cilLockLocked, cilLockUnlocked, cilPencil, cilDescription, cilCloudDownload } from '@coreui/icons';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSXStyle from 'xlsx-js-style';
import api from '../../../services/api';
import { useBillsAuth } from '../../../context/BillsAuthContext';

// Optional Babyboom logo for PDF export. Paste a base64 PNG data-URI here
// (e.g. 'data:image/png;base64,iVBORw0KG...') to render the real logo in reports.
// When empty, the export falls back to a styled "Babyboom Surrogacy" text mark.
const BABYBOOM_LOGO_DATAURI = '';

// ─────────────────────────────────────────────────────────────────────────────
// NumInput — defined OUTSIDE component to avoid React remount / focus loss
// ─────────────────────────────────────────────────────────────────────────────
const NumInput = ({ value, onChange, placeholder = '', disabled = false, width = '110px', inputStyle = {} }) => (
  <CFormInput type="number" size="sm" className="no-spinners"
    style={{ width }} value={value} onChange={onChange}
    placeholder={placeholder} disabled={disabled} />
);

// CurrencyInput — formatted currency display (e.g. $400.00) for Penalización / Reembolso fields.
// Shows formatted value when blurred, raw number when focused for editing.
// Defined OUTSIDE component to avoid React remount / focus loss.
const fmtCurrency = (v) => {
  const n = parseFloat(v);
  if (v === '' || v === null || v === undefined || isNaN(n)) return '';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(n);
};
const CurrencyInput = ({ value, onChange, disabled = false, width = '110px', inputStyle = {} }) => {
  const [focused, setFocused] = React.useState(false);
  return (
    <CFormInput size="sm" className="no-spinners"
      style={{ width, textAlign: 'right', ...inputStyle }}
      type={focused ? 'number' : 'text'}
      value={focused ? (value ?? '') : fmtCurrency(value)}
      onChange={onChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      disabled={disabled}
      placeholder="$0.00"
    />
  );
};

// ImporteCell — shows planned amount (muted) + real-value NumInput below it.
// When locked it shows only the resolved real value.
// Must be defined outside component to avoid React remount / focus loss.
const ImporteCell = ({ planned, realValue, onChange, disabled, width = '110px', showBono = false }) => {
  const display = planned !== null && planned !== undefined ? fmt(planned) : '—';
  return (
    <div style={{ minWidth: width }}>
      <div className="text-muted" style={{ fontSize: '0.75rem', lineHeight: 1.2, marginBottom: '3px' }}>
        Plan: <span className="fw-semibold">{display}</span>
      </div>
      {disabled ? (
        <span className="fw-semibold" style={{ color: 'var(--cui-primary)', fontSize: '0.9rem' }}>
          {realValue !== '' && realValue !== null && realValue !== undefined && !isNaN(parseFloat(realValue))
            ? fmt(parseFloat(realValue))
            : display}
        </span>
      ) : (
        <NumInput value={realValue} onChange={onChange} placeholder={planned != null ? String(planned) : '0'} width={width} />
      )}
    </div>
  );
};
// - Unlocked + non-empty value → green "Guardar" button locks the field.
// - Locked → orange "Editar" pencil button opens password modal to unlock.
// - Empty fields can never be locked (Guardar button hidden when empty).
// Must be defined outside component to avoid React remount / focus loss.
const LockedFormInput = ({ name, label, value, type = 'text', locked, disabled, onChange, onLockRequest }) => (
  <div>
    <CFormLabel className="mb-1 small d-flex align-items-center gap-1">
      {label}
      {locked && <CIcon icon={cilLockLocked} size="sm" className="text-warning" />}
    </CFormLabel>
    <div className="d-flex gap-1">
      <CFormInput
        type={type} name={name} value={value}
        disabled={locked || disabled}
        onChange={onChange}
        style={{ flex: 1 }}
      />
      {/* Non-empty & unlocked: show Guardar */}
      {!locked && value && String(value).trim() !== '' && (
        <CButton size="sm" color="success" style={{ padding: '0 10px', whiteSpace: 'nowrap' }}
          title="Guardar y bloquear este campo"
          onClick={() => onLockRequest(name, 'save')}>
          <CIcon icon={cilSave} size="sm" className="me-1" />Guardar
        </CButton>
      )}
      {/* Locked: show Editar pencil */}
      {locked && (
        <CButton size="sm" color="warning" variant="outline" style={{ padding: '0 8px' }}
          title="Editar este campo (requiere contraseña)"
          onClick={() => onLockRequest(name, 'unlock')}>
          <CIcon icon={cilPencil} size="sm" />
        </CButton>
      )}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const FIXED_ROWS = [
  { id: 'beta_positiva', concepto: 'Beta positiva', importe: 2000,  bonoTransporte: null, section: 2 },
  { id: 'sdg6',          concepto: '6 SDG',         importe: null,  bonoTransporte: 1000, section: 2 },
  { id: 'sdg8',          concepto: '8 SDG',         importe: 5000,  bonoTransporte: 500,  section: 2 },
  { id: 'sdg10',         concepto: '10 SDG',        importe: 5000,  bonoTransporte: 500,  section: 2 },
  { id: 'sdg12', concepto: '12 SDG', importe: 10000, bonoTransporte: 500, section: 3 },
  { id: 'sdg16', concepto: '16 SDG', importe: 20000, bonoTransporte: 500, section: 3 },
  { id: 'sdg20', concepto: '20 SDG', importe: 20000, bonoTransporte: 500, section: 3, triggersT1Bonus: true },
  { id: 'sdg22', concepto: '22 SDG', importe: 20000, bonoTransporte: 500, section: 3 },
  { id: 'sdg26', concepto: '26 SDG', importe: 20000, bonoTransporte: 500, section: 3 },
  { id: 'sdg32', concepto: '32 SDG', importe: 24000, bonoTransporte: 500, section: 3 },
  { id: 'sdg34', concepto: '34 SDG', importe: null,  bonoTransporte: 500, section: 3 },
  { id: 'sdg35', concepto: '35 SDG', importe: null,  bonoTransporte: 500, section: 3 },
  { id: 'sdg36', concepto: '36 SDG', importe: 24000, bonoTransporte: 500, section: 3, triggersSDG36Bonus: true },
  { id: 'sdg37', concepto: '37 SDG', importe: null,  bonoTransporte: 750, section: 3 },
  { id: 'sdg38', concepto: '38 SDG', importe: null,  bonoTransporte: 750, section: 3 },
  { id: 'sdg39', concepto: '39 SDG', importe: 0,     bonoTransporte: 0,  section: 3 },
  { id: 'sdg40', concepto: '40 SDG', importe: 0,     bonoTransporte: 0,  section: 3 },
];

// SDG rows blocked by Semana de parto: selected week and all subsequent get zeroed
const BIRTH_WEEK_ORDER   = ['32', '34', '35', '36', '37', '38', '39', '40'];
const BIRTH_WEEK_ROW_IDS = ['sdg32', 'sdg34', 'sdg35', 'sdg36', 'sdg37', 'sdg38', 'sdg39', 'sdg40'];

const BG_CONDITIONS = [
  { id: 'puntualidad',            label: 'Puntualidad',             amount: 1500 },
  { id: 'tresReagendamientos',    label: '3 Reagendamientos',       amount: 1500 },
  { id: 'tresInasistencias',      label: '3 Inasistencias',         amount: 2000 },
  { id: 'seguimientoPsicologico', label: 'Seguimiento psicológico', amount: 5000 },
  { id: 'seguimientoMedico',      label: 'Seguimiento médico',      amount: 5000 },
  { id: 'tresPenalizaciones',     label: '3 Penalizaciones',        amount: 5000 },
];

const PUERPERIO_ROWS = [
  { id: 'puerperio1', concepto: 'Puerperio 1 - Nacimiento'        },
  { id: 'puerperio2', concepto: 'Puerperio 2 - Firma de registro' },
  { id: 'puerperio3', concepto: 'Puerperio 3 - Salida de IPs'     },
];

const EXTRATO_MOTIVOS = ['Reembolso', 'Bonificación', 'Pago extraordinario', 'Adelanto', 'Otro'];

const UNLOCK_PASSWORD = '26213256';
const SCHEME_PASSWORD = 'adm@bbcloud1';
const ULTIMAS_FIRMAS  = 20000; // fixed total for last section

// Fixed parcialidad distributions (max 3) — must sum to ULTIMAS_FIRMAS
const PARC_AMOUNTS = {
  1: [20000],
  2: [15000, 5000],
  3: [15000, 3000, 2000],
};

// Form fields eligible for individual locking
const FORM_FIELDS = ['gesca', 'ip', 'banco', 'clabe', 'fum', 'giro_semana'];
const initLockedFields = (locked) => {
  const s = {};
  FORM_FIELDS.forEach(f => { s[f] = locked; });
  return s;
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const fmt = (v) => {
  if (v === null || v === undefined || v === '') return '-';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(v);
};
const getRowImporte = (row, sv) => row.schemeImporte ? (row.schemeImporte[sv] ?? null) : (row.importe ?? null);
const getRowBono    = (row, sv) => row.schemeBono    ? (row.schemeBono[sv]    ?? 0)    : (row.bonoTransporte ?? 0);
// Returns true only when the row has a planned bono (not null/undefined)
const rowHasBono = (row) => row.schemeBono !== undefined || row.bonoTransporte !== null;

const initRS  = () => ({ penalizacion: '', reembolso: '', completed: false, realImporte: '', realBono: '' });
const initFRS = () => {
  const s = {};
  FIXED_ROWS.forEach(r => { s[r.id] = { ...initRS(), ...(r.hasReached ? { reached: false } : {}) }; });
  return s;
};
const initPS  = () => { const s = {}; PUERPERIO_ROWS.forEach(r => { s[r.id] = initRS(); }); return s; };
const initT   = () => Array.from({ length: 6 }, (_, i) => ({ id: i + 1, penalizacion: '', reembolso: '', completed: false, successful: false, realImporte: '', transCompleted: false, transRealBono: '', transPenalizacion: '', transReembolso: '' }));
const initBG  = () => ({ puntualidad: true, tresReagendamientos: true, tresInasistencias: true, seguimientoPsicologico: true, seguimientoMedico: true, tresPenalizaciones: true });
const initBS  = () => ({ vih: initRS(), gemelar: initRS() });
const initAyudaState = () => ({ penalizacion: '', reembolso: '', completed: false, realImporte: '' });

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const PaymentsGestForm = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { authenticateBills } = useBillsAuth();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved,  setLastSaved]  = useState(null);   // Date object
  const [saveError,  setSaveError]  = useState('');
  const [alert,   setAlert]   = useState({ show: false, type: '', message: '' });

  // refs for auto-save machinery
  const recordIdRef  = useRef(isEditMode ? id : null); // actual DB id (set on first POST for new records)
  const stateRef     = useRef({});   // always-fresh snapshot, updated every render (no deps array)
  const saveTimerRef = useRef(null);
  const isSavingRef  = useRef(false);

  // ── Scheme gate ───────────────────────────────────────────────────────────
  const [schemeSelected, setSchemeSelected] = useState(isEditMode);
  const [schemeLocked,   setSchemeLocked]   = useState(isEditMode);
  const [showSchemePasswordModal, setShowSchemePasswordModal] = useState(false);
  const [schemePasswordInput,     setSchemePasswordInput]     = useState('');
  const [schemePasswordError,     setSchemePasswordError]     = useState('');

  // ── Per-field locking ─────────────────────────────────────────────────────
  // New mode: all unlocked. Edit mode: starts unlocked, fetchPayment sets locked
  // state based on which fields actually have values (empty fields stay editable).
  const [lockedFields,      setLockedFields]      = useState(() => initLockedFields(false));
  // fieldUnlockTarget: { name, label } — the field currently asking for password
  const [fieldUnlockTarget, setFieldUnlockTarget] = useState(null);
  const [fieldUnlockPassword, setFieldUnlockPassword] = useState('');
  const [fieldUnlockError,    setFieldUnlockError]    = useState('');
  const [showFieldUnlockModal, setShowFieldUnlockModal] = useState(false);

  const [formData, setFormData] = useState({
    gesca: '', ip: '', banco: '', clabe: '',
    fum: '', giro_semana: '', scheme_value: '', status: 'active',
  });

  // ── Payment states ────────────────────────────────────────────────────────
  const [transferencias,  setTransferencias]  = useState(initT());
  const [rowStates,       setRowStates]       = useState(initFRS());
  const [puerperioStates, setPuerperioStates] = useState(initPS());
  const [bonoVIH,         setBonoVIH]         = useState(false);
  const [bonoGemelar,     setBonoGemelar]     = useState(false);
  const [bonoStates,      setBonoStates]      = useState(initBS());
  const [bgConditions,    setBgConditions]    = useState(initBG());
  const [bgState,         setBgState]         = useState(initRS());
  const [bgExtraTitle,    setBgExtraTitle]    = useState('');
  const [bgExtraImporte,  setBgExtraImporte]  = useState('');
  const [parcCount,       setParcCount]       = useState(1);
  const [parcCompleted,   setParcCompleted]   = useState([false, false, false]);
  const [parcRealAmounts, setParcRealAmounts] = useState(['', '', '']);
  const [semanaParto,     setSemanaParto]     = useState('');
  const [ayudaMaternidad, setAyudaMaternidad] = useState(false);
  const [ayudaAmount,     setAyudaAmount]     = useState('');
  const [ayudaState,      setAyudaState]      = useState(initAyudaState());
  const [extratoGastos,   setExtratoGastos]   = useState([]);
  const [newExtrato,      setNewExtrato]      = useState({ fecha: '', motivo: '', movimiento: '', valor: '' });
  const [extratoAlert,    setExtratoAlert]    = useState({ show: false, type: '', message: '' });

  // ── Extrato filters & sort ───────────────────────────────────────────────────
  const [extratoFilterFechaDesde,  setExtratoFilterFechaDesde]  = useState('');
  const [extratoFilterFechaHasta,  setExtratoFilterFechaHasta]  = useState('');
  const [extratoFilterMotivo,      setExtratoFilterMotivo]      = useState('');
  const [extratoFilterMovimiento,  setExtratoFilterMovimiento]  = useState('');
  const [extratoSort,              setExtratoSort]              = useState({ key: 'fecha', dir: 'desc' });

  // ── Extrato export (PDF / CSV) ─────────────────────────────────────────────
  const [showExportModal,    setShowExportModal]    = useState(false);
  const [exportPwOk,         setExportPwOk]         = useState(false);
  const [exportPw,           setExportPw]           = useState('');
  const [exportPwError,      setExportPwError]      = useState('');
  const [exportCols,         setExportCols]         = useState({ esquema: true, bonos: true, bono: true, pen: true, reim: true });

  // ── Comments per row ──────────────────────────────────────────────────────
  const [rowComments,       setRowComments]       = useState({});   // { [commentKey]: string }
  const [lockedComments,    setLockedComments]    = useState({});   // { [commentKey]: bool }
  const [showCommentModal,  setShowCommentModal]  = useState(false);
  const [commentCtx,        setCommentCtx]        = useState({ key: '', label: '' });
  const [commentDraft,      setCommentDraft]      = useState('');
  const [commentEditMode,   setCommentEditMode]   = useState(true);
  const [commentPwVisible,  setCommentPwVisible]  = useState(false);
  const [commentPw,         setCommentPw]         = useState('');
  const [commentPwError,    setCommentPwError]    = useState('');

  // ── Delete modals ─────────────────────────────────────────────────────────
  const [showDeleteModal,         setShowDeleteModal]         = useState(false);
  const [deleteTarget,            setDeleteTarget]            = useState({ type: '', id: null, label: '', autoKey: '', isAuto: false });
  const [showDeletePasswordModal, setShowDeletePasswordModal] = useState(false);
  const [deletePasswordInput,     setDeletePasswordInput]     = useState('');
  const [deletePasswordError,     setDeletePasswordError]     = useState('');

  // ── Date & unlock row modals ──────────────────────────────────────────────
  const [showDateModal, setShowDateModal] = useState(false);
  const [dateModalInfo, setDateModalInfo] = useState({ label: '', autoKey: '', category: 'scheme', fecha: new Date().toISOString().split('T')[0], valor: 0, confirm: null });

  const [showUnlockModal,     setShowUnlockModal]     = useState(false);
  const [unlockPasswordInput, setUnlockPasswordInput] = useState('');
  const [unlockPasswordError, setUnlockPasswordError] = useState('');
  const [unlockTarget,        setUnlockTarget]        = useState({ autoKey: '', label: '', uncomplete: null });

  const statusOptions = [
    { value: 'active',    label: 'Activo'     },
    { value: 'completed', label: 'Completado' },
    { value: 'cancelled', label: 'Cancelado'  },
    { value: 'pending',   label: 'Pendiente'  },
  ];

  // ── Keep stateRef always current — no dep array means it runs after every render ──
  useEffect(() => {
    stateRef.current = {
      formData, transferencias, rowStates, puerperioStates,
      bonoVIH, bonoGemelar, bonoStates, bgConditions, bgState, bgExtraTitle, bgExtraImporte,
      parcCount, parcCompleted, parcRealAmounts, semanaParto,
      ayudaMaternidad, ayudaAmount, ayudaState,
      extratoGastos, rowComments, schemeSelected,
    };
  });

  // ── Calculations ──────────────────────────────────────────────────────────
  const sv          = formData.scheme_value || '375000';
  const schemeValue = useMemo(() => parseFloat(formData.scheme_value) || 375000, [formData.scheme_value]);

  // Rows blocked by Semana de parto: the selected week + all subsequent SDG rows get zeroed
  const blockedBirthRowIds = useMemo(() => {
    if (!semanaParto) return new Set();
    const idx = BIRTH_WEEK_ORDER.indexOf(semanaParto);
    if (idx < 0) return new Set();
    return new Set(BIRTH_WEEK_ROW_IDS.slice(idx + 1)); // block rows AFTER selected week
  }, [semanaParto]);

  const visibleTransferencias = useMemo(() => {
    const idx = transferencias.findIndex(t => t.successful);
    return idx === -1 ? transferencias : transferencias.slice(0, idx + 1);
  }, [transferencias]);

  const t1Exitosa      = useMemo(() => transferencias[0]?.successful === true, [transferencias]);
  const sdg20Completed = useMemo(() => rowStates.sdg20?.completed === true, [rowStates]);

  // Semana de parto: 5k bonus on P1 when T1 beta positiva AND birth week ≥ 36
  // SDG20 extrato entry is always $5,000 regardless of scheme
  const t1BonusAmount = useMemo(() => 5000, []);

  // SDG36 bonus on P1: applies to BOTH schemes when T1 exitosa AND birth week ≥ 36
  // BUT the +5k P1 addition only applies for 400k (375k total stays at 5k from SDG20 only)
  const sdg36BonusApplied = useMemo(
    () => t1Exitosa && ['36', '37', '38', '39', '40'].includes(semanaParto),
    [t1Exitosa, semanaParto]
  );

  // rVal: resolve real vs planned value
  const rVal = (realField, planned) => {
    const n = parseFloat(realField);
    return (!isNaN(n) && realField !== '') ? n : (planned ?? 0);
  };

  // Transferencias paid — only importe (not reembolso) deducts from P1 pool
  const transferenciasPaid = useMemo(() => {
    return visibleTransferencias
      .filter(t => t.completed)
      .reduce((sum, t) => sum + rVal(t.realImporte, 1000) - (parseFloat(t.penalizacion) || 0), 0);
  }, [visibleTransferencias]);

  // T1 penalty: when T1 exitosa but SDG36 not reached — always 5k on both schemes
  const t1NoSDG36Penalty = useMemo(
    () => (t1Exitosa && semanaParto && !sdg36BonusApplied) ? 5000 : 0,
    [t1Exitosa, semanaParto, sdg36BonusApplied]
  );

  // P1 += 5k only for 400k when SDG36 reached (375k total is just the SDG20 5k — no P1 addition)
  const p1Amount = useMemo(
    () => Math.max(0, 50000 - transferenciasPaid + (sdg36BonusApplied ? 5000 : 0) - t1NoSDG36Penalty),
    [transferenciasPaid, sdg36BonusApplied, t1NoSDG36Penalty, sv]
  );
  const p2Base   = useMemo(() => sv === '375000' ? 50000 : 55000, [sv]);

  // CDO. GESCA deduction
  const bgDeduction = useMemo(() => {
    let t = 0;
    BG_CONDITIONS.forEach(c => { if (!bgConditions[c.id]) t += c.amount; });
    return t;
  }, [bgConditions]);

  // Fixed importe sums per section (used to derive p3 base)
  const fase2Total = useMemo(() => {
    let t = 0;
    FIXED_ROWS.filter(r => r.section === 2).forEach(r => {
      if (blockedBirthRowIds.has(r.id)) return;
      const imp = getRowImporte(r, sv);
      if (imp !== null) t += imp;
    });
    return t;
  }, [sv, blockedBirthRowIds]);

  const fasesPagosTotal = useMemo(() => {
    let t = 0;
    FIXED_ROWS.filter(r => r.section === 3).forEach(r => {
      if (blockedBirthRowIds.has(r.id)) return;
      const imp = getRowImporte(r, sv);
      if (imp !== null) t += imp;
    });
    return t;
  }, [sv, blockedBirthRowIds]);

  // Importe of SDG rows canceled because they fall AFTER the selected semana de parto.
  // These scheduled scheme payments will not happen, so they are subtracted from the total.
  const blockedScheduleImporte = useMemo(() => {
    let t = 0;
    FIXED_ROWS.forEach(r => {
      if (blockedBirthRowIds.has(r.id)) {
        const imp = getRowImporte(r, sv);
        if (imp) t += imp;
      }
    });
    return t;
  }, [blockedBirthRowIds, sv]);

  // Bono transporte of canceled SDG rows — these reduce the bono transporte cap.
  const blockedBonoTransporte = useMemo(() => {
    let t = 0;
    FIXED_ROWS.forEach(r => {
      if (blockedBirthRowIds.has(r.id)) t += getRowBono(r, sv) || 0;
    });
    return t;
  }, [blockedBirthRowIds, sv]);

  // p3BaseRaw: display-only reference value for P3 breakdown label
  const p3BaseRaw = useMemo(
    () => Math.max(0, schemeValue - fase2Total - fasesPagosTotal - 50000 - p2Base - ULTIMAS_FIRMAS),
    [schemeValue, fase2Total, fasesPagosTotal, p2Base]
  );
  // ayudaAmountNum: driven by Importe field (realImporte) when completed, or entered value when pending
  const ayudaAmountNum = useMemo(
    () => parseFloat(ayudaState.realImporte) || parseFloat(ayudaAmount) || 0,
    [ayudaState.realImporte, ayudaAmount]
  );
  // T2-T6 bono transporte amounts count as scheme payments, not bonuses — deducted from P3
  const trans45Deduction = useMemo(() => {
    let t = 0;
    visibleTransferencias.forEach(trans => {
      if ([2,3,4,5,6].includes(trans.id) && trans.transCompleted) {
        t += rVal(trans.transRealBono, 500);
      }
    });
    return t;
  }, [visibleTransferencias]);

  // ── Real-amount totals (uses user-entered realImporte, falls back to planned) ─
  const realFase2Total = useMemo(() => {
    let t = 0;
    FIXED_ROWS.filter(r => r.section === 2).forEach(r => {
      if (blockedBirthRowIds.has(r.id)) return;
      const planned = getRowImporte(r, sv);
      if (planned !== null) t += rVal(rowStates[r.id]?.realImporte, planned);
    });
    return t;
  }, [sv, rowStates, blockedBirthRowIds]);

  const realFasesPagosTotal = useMemo(() => {
    let t = 0;
    FIXED_ROWS.filter(r => r.section === 3).forEach(r => {
      if (blockedBirthRowIds.has(r.id)) return;
      const planned = getRowImporte(r, sv);
      if (planned !== null) t += rVal(rowStates[r.id]?.realImporte, planned);
    });
    return t;
  }, [sv, rowStates, blockedBirthRowIds]);

  // P3 absorbs all residuals so the full scheme total is always reached and P4 = ULTIMAS_FIRMAS.
  // CDO deduction shows as penalización separately — does NOT reduce P3 base.
  // The P1 pool is reduced by t1NoSDG36Penalty (SDG<36) so P3 absorbs that 5k and the total stays whole.
  // The SDG36 bonus is NOT subtracted here (it is extra — shown in Bonos adicionales).
  // Formula: schemeValue − realFase2 − realFasesPagos − (P1 pool − penalty) − p2Base − ayuda − trans45 − blockedSchedule − ULTIMAS_FIRMAS
  const p3Amount = useMemo(
    () => Math.max(0,
      schemeValue
      - realFase2Total - realFasesPagosTotal
      - (50000 - t1NoSDG36Penalty) - p2Base
      - trans45Deduction
      - (ayudaState.completed ? ayudaAmountNum : 0)
      - blockedScheduleImporte
      - ULTIMAS_FIRMAS
    ),
    [schemeValue, realFase2Total, realFasesPagosTotal, t1NoSDG36Penalty, p2Base, trans45Deduction, ayudaState, ayudaAmountNum, blockedScheduleImporte]
  );

  const realP3Amount = useMemo(
    () => rVal(puerperioStates.puerperio3?.realImporte, p3Amount),
    [puerperioStates, p3Amount]
  );

  // p2Adjustment kept for display only (shown in P2 breakdown label)
  const p2Adjustment = useMemo(
    () => (schemeValue - bgDeduction) - (realFase2Total + realFasesPagosTotal + 50000 + p2Base + p3BaseRaw + ULTIMAS_FIRMAS),
    [schemeValue, bgDeduction, realFase2Total, realFasesPagosTotal, p2Base, p3BaseRaw]
  );
  const vihBonus     = useMemo(() => bonoVIH     ? 50000 : 0, [bonoVIH]);
  const gemelarBonus = useMemo(() => bonoGemelar ? 20000 : 0, [bonoGemelar]);
  // P2 (Puerperio 2) = base + VIH bonus + gemelar bonus (if applicable)
  const p2Amount = useMemo(() => p2Base + vihBonus + gemelarBonus, [p2Base, vihBonus, gemelarBonus]);
  const p2AdjustedAmount = p2Amount; // P3 now absorbs residuals; P2 uses base only
  // Net bonus for display in bonos table
  // 375k + SDG≥36: 5k (SDG20 only, nothing on P1)
  // 375k + SDG<36:  0 (5k SDG20 − 5k P1 penalty = 0 net)
  // 375k + no week: 5k (pending — week not yet determined)
  // 400k + SDG≥36: 10k (5k SDG20 + 5k P1)
  // 400k + SDG<36:  0 (5k SDG20 − 5k P1 penalty = 0 net)
  const t1BonusGross = useMemo(() => {
    if (!t1Exitosa) return 0;
    if (!semanaParto) return 10000; // pending — show max possible (always 10k: 5k SDG20 + 5k P1)
    return sdg36BonusApplied ? 10000 : 0;
  }, [t1Exitosa, semanaParto, sdg36BonusApplied]);
  const totalBonos   = useMemo(() => t1BonusGross + vihBonus + gemelarBonus, [t1BonusGross, vihBonus, gemelarBonus]);

  const bonoTransporteTotal = useMemo(() => {
    let t = 0;
    FIXED_ROWS.forEach(r => {
      if (blockedBirthRowIds.has(r.id)) return;
      const planned = getRowBono(r, sv) || 0;
      t += rVal(rowStates[r.id]?.realBono, planned);
    });
    // Transferencia sub-rows: T1-T3/T6 count as bono; T4 and T5 are scheme payments (deducted from P3)
    visibleTransferencias.forEach(trans => {
      if (![2,3,4,5,6].includes(trans.id)) t += rVal(trans.transRealBono, 500);
    });
    return t;
  }, [sv, rowStates, blockedBirthRowIds, visibleTransferencias]);

  // Birth week penalty: $24,000 when semana de parto < 36 (SDG36 not reached)
  const BIRTH_WEEK_PENALTY_THRESHOLD = ['32', '34', '35'];
  const birthWeekPenalty = useMemo(
    () => (semanaParto && BIRTH_WEEK_PENALTY_THRESHOLD.includes(semanaParto)) ? 24000 : 0,
    [semanaParto]
  );

  const totalPenalizaciones = useMemo(() => {
    let t = 0;
    visibleTransferencias.forEach(x => { t += parseFloat(x.penalizacion) || 0; });
    FIXED_ROWS.forEach(r     => { t += parseFloat(rowStates[r.id]?.penalizacion)       || 0; });
    PUERPERIO_ROWS.forEach(r => { t += parseFloat(puerperioStates[r.id]?.penalizacion) || 0; });
    ['vih', 'gemelar'].forEach(k => { t += parseFloat(bonoStates[k]?.penalizacion) || 0; });
    t += parseFloat(ayudaState.penalizacion) || 0;
    t += parseFloat(bgState.penalizacion)    || 0;
    t += birthWeekPenalty;
    return t;
  }, [visibleTransferencias, rowStates, puerperioStates, bonoStates, ayudaState, bgState, birthWeekPenalty]);

  // totalReembolso: sum of reembolso amounts from completed extrato entries only
  const totalReembolso = useMemo(
    () => extratoGastos.reduce((s, e) => s + (parseFloat(e.reembolsoVal) || 0), 0),
    [extratoGastos]
  );

  // ─── Bonus cap ────────────────────────────────────────────────────────────
  // Base bono de transporte cap is 8,500, REDUCED by the bono transporte of any SDG
  // rows canceled by the semana de parto (e.g. SDG 35 cancels SDG36/37/38 → 8,500−2,000=6,500).
  // The T1/SDG36 (10k), VIH and gemelar bonuses are always allowed on top and NEVER reduce the
  // scheme. "Extra bonus" (funded from the scheme — deducted from Puerperio 4 and the final
  // total) = transporte beyond the (adjusted) cap + any Bonificación extra.
  const BASE_BONUS_CAP = 8500;
  const TOTAL_BONUS_CAP = useMemo(
    () => Math.max(0, BASE_BONUS_CAP - blockedBonoTransporte),
    [blockedBonoTransporte]
  );
  const extraBonus = useMemo(
    () => Math.max(0, bonoTransporteTotal - TOTAL_BONUS_CAP) + (parseFloat(bgExtraImporte) || 0),
    [bonoTransporteTotal, bgExtraImporte, TOTAL_BONUS_CAP]
  );

  const effectiveSchemeValue = useMemo(
    () => schemeValue - bgDeduction - totalPenalizaciones,
    [schemeValue, bgDeduction, totalPenalizaciones]
  );
  const grandTotal = useMemo(
    () => effectiveSchemeValue + bonoTransporteTotal + totalBonos - extraBonus,
    [effectiveSchemeValue, bonoTransporteTotal, totalBonos, extraBonus]
  );

  // Manual extrato entries that represent extra obligations (increase what's owed)
  const MOTIVOS_EXTRA_OBLIGACION = ['Reembolso', 'Bonificación'];
  const extraObligaciones = useMemo(
    () => extratoGastos
      .filter(e => !e.isAuto && MOTIVOS_EXTRA_OBLIGACION.includes(e.motivo))
      .reduce((s, e) => s + (parseFloat(e.valor) || 0), 0),
    [extratoGastos]
  );

  // grandTotalWithExtras: scheme total + bonuses + transport + manual obligations
  const grandTotalWithExtras = useMemo(
    () => grandTotal + extraObligaciones,
    [grandTotal, extraObligaciones]
  );

  const pagosRealizados = useMemo(
    () => extratoGastos.reduce((s, e) => s + (parseFloat(e.valor) || 0), 0),
    [extratoGastos]
  );
  const schemeValuePaid      = useMemo(() => extratoGastos.filter(e => e.category === 'scheme').reduce((s, e) => s + (parseFloat(e.valor) || 0) - (parseFloat(e.reembolsoVal) || 0) - (parseFloat(e.bonoValStored) || 0) - (parseFloat(e.importeBonoT1Val) || 0), 0), [extratoGastos]);
  const schemeValueRemaining = useMemo(() => effectiveSchemeValue - extraBonus - schemeValuePaid, [effectiveSchemeValue, extraBonus, schemeValuePaid]);
  // "Esquema real": actual amounts paid (from extrato entries using real importe inputs)
  const schemeRealPaid = schemeValuePaid;
  // ─── Puerperio summary memos ────────────────────────────────────────
  const totalPagadoPrograma = useMemo(() => {
    // Importe only — bono transporte excluded
    let t = 0;
    visibleTransferencias.filter(x => x.completed).forEach(x => {
      t += rVal(x.realImporte, 1000) - (parseFloat(x.penalizacion) || 0) + (parseFloat(x.reembolso) || 0);
    });
    // transCompleted rows: these are bono-transporte-only, excluded here
    FIXED_ROWS.forEach(r => {
      if (blockedBirthRowIds.has(r.id)) return;
      const state = rowStates[r.id];
      if (!state?.completed) return;
      const imp = getRowImporte(r, sv);
      t += rVal(state.realImporte, imp != null ? imp : 0) - (parseFloat(state.penalizacion) || 0) + (parseFloat(state.reembolso) || 0);
      // bono transporte NOT included
    });
    return t;
  }, [visibleTransferencias, rowStates, blockedBirthRowIds, sv]);

  const totalPagadoPuerperio = useMemo(() => {
    let t = 0;
    const p1BaseForResumen = p1Amount - (sdg36BonusApplied ? 5000 : 0); // bonus shown in Bonos adicionales, not here
    if (puerperioStates.puerperio1?.completed) t += rVal(puerperioStates.puerperio1.realImporte, p1BaseForResumen) - (parseFloat(puerperioStates.puerperio1.penalizacion) || 0) + (parseFloat(puerperioStates.puerperio1.reembolso) || 0);
    if (puerperioStates.puerperio2?.completed) t += rVal(puerperioStates.puerperio2.realImporte, p2AdjustedAmount) - (parseFloat(puerperioStates.puerperio2.penalizacion) || 0) + (parseFloat(puerperioStates.puerperio2.reembolso) || 0);
    if (ayudaState.completed) t += rVal(ayudaState.realImporte, ayudaAmountNum) - (parseFloat(ayudaState.penalizacion) || 0) + (parseFloat(ayudaState.reembolso) || 0);
    if (puerperioStates.puerperio3?.completed) t += rVal(puerperioStates.puerperio3.realImporte, p3Amount) - (parseFloat(puerperioStates.puerperio3.penalizacion) || 0) + (parseFloat(puerperioStates.puerperio3.reembolso) || 0);
    return t;
  }, [puerperioStates, p1Amount, p2AdjustedAmount, p3Amount, ayudaState, ayudaAmountNum, sdg36BonusApplied]);

  const totalPagadoGeneral = useMemo(() => totalPagadoPrograma + totalPagadoPuerperio, [totalPagadoPrograma, totalPagadoPuerperio]);
  const calculoPuerperio4  = useMemo(() => Math.max(0, ULTIMAS_FIRMAS - extraBonus), [extraBonus]);

  const dynamicParcAmounts = useMemo(() => {
    const p4 = Math.max(0, Math.round(calculoPuerperio4));
    if (parcCount === 1) return [p4];
    if (parcCount === 2) { const a = Math.round(p4 * 0.75); return [a, p4 - a]; }
    const a = Math.round(p4 * 0.75), b = Math.round(p4 * 0.15);
    return [a, b, p4 - a - b];
  }, [calculoPuerperio4, parcCount]);
  const parcAmounts = dynamicParcAmounts;

  // "Esquema planeado pagado": planned amounts for rows that have been marked "pago completado"
  const schemePlannedPaid = useMemo(() => {
    let t = 0;
    // transferencias — importe only (1000 each planned)
    visibleTransferencias.filter(x => x.completed).forEach(() => { t += 1000; });
    // fixed rows — importe only, NOT bono transporte
    FIXED_ROWS.forEach(r => {
      if (blockedBirthRowIds.has(r.id)) return;
      if (rowStates[r.id]?.completed) {
        const imp = getRowImporte(r, sv);
        if (imp !== null) t += imp;
      }
    });
    // puerperio — importe only
    if (puerperioStates.puerperio1?.completed) t += p1Amount - (sdg36BonusApplied ? 5000 : 0);
    if (puerperioStates.puerperio2?.completed) t += p2AdjustedAmount;
    if (puerperioStates.puerperio3?.completed) t += p3Amount;
    // ayuda maternidad — counted when completed
    if (ayudaState.completed) t += ayudaAmountNum;
    // parcialidades — importe
    dynamicParcAmounts.forEach((amt, i) => { if (parcCompleted[i]) t += amt; });
    return t;
  }, [visibleTransferencias, rowStates, puerperioStates, bonoStates,
      ayudaState, ayudaAmountNum, dynamicParcAmounts, parcCompleted, p1Amount, p2AdjustedAmount, p3Amount, sv, blockedBirthRowIds, ayudaAmountNum]);
  const bonoTransportePaid = useMemo(() => {
    let t = 0;
    FIXED_ROWS.forEach(r => {
      if (blockedBirthRowIds.has(r.id)) return;
      if (rowStates[r.id]?.completed) {
        t += rVal(rowStates[r.id]?.realBono, getRowBono(r, sv) || 0);
      }
    });
    // Transferencia trans sub-rows paid (T4/T5 excluded — they are scheme payments)
    visibleTransferencias.filter(x => x.transCompleted && ![2,3,4,5,6].includes(x.id)).forEach(trans => {
      t += rVal(trans.transRealBono, 500);
    });
    return t;
  }, [rowStates, sv, blockedBirthRowIds, visibleTransferencias]);
  const bonoTransporteRemaining = useMemo(() => bonoTransporteTotal - bonoTransportePaid, [bonoTransporteTotal, bonoTransportePaid]);

  const MOVIMIENTO_ORDER = [
    'Transferencia 1', 'Prueba Beta 1',
    'Transferencia 2', 'Prueba Beta 2',
    'Transferencia 3', 'Prueba Beta 3',
    'Transferencia 4', 'Prueba Beta 4',
    'Transferencia 5', 'Prueba Beta 5',
    'Transferencia 6', 'Prueba Beta 6',
    'Beta positiva', 'Beta Positiva',
    '6 SDG', '8 SDG', '10 SDG', '12 SDG', '16 SDG', '20 SDG',
    '22 SDG', '26 SDG', '32 SDG', '34 SDG', '35 SDG',
    '36 SDG', '37 SDG', '38 SDG', '39 SDG', '40 SDG',
    'Puerperio 1', 'Puerperio 2', 'Ayuda maternidad', 'Ayuda Maternidad', 'Puerperio 3',
    'Parcialidad 1', 'Parcialidad 2', 'Parcialidad 3',
  ];
  const getMovimientoOrder = (mov) => {
    if (!mov) return 9999;
    const idx = MOVIMIENTO_ORDER.findIndex(p => mov.toLowerCase().startsWith(p.toLowerCase()));
    return idx === -1 ? 9999 : idx;
  };

  // Resolve the component breakdown of an extrato entry (handles new split + legacy entries)
  const getExtratoComponents = (entry) => {
    const bono = parseFloat(entry.bonoValStored)   || 0;   // transporte only
    const pen  = parseFloat(entry.penalizacionVal) || 0;
    const reim = parseFloat(entry.reembolsoVal)    || 0;
    let esquema, bonoT1;
    if (entry.importeEsquemaVal != null || entry.importeBonoT1Val != null) {
      esquema = parseFloat(entry.importeEsquemaVal) || 0;
      bonoT1  = parseFloat(entry.importeBonoT1Val)  || 0;
    } else if (entry.importeVal != null) {
      // legacy single-importe entry
      esquema = parseFloat(entry.importeVal) || 0;
      bonoT1  = 0;
    } else {
      // very old entry — derive importe from total
      esquema = Math.max(0, (parseFloat(entry.valor) || 0) - bono + pen - reim);
      bonoT1  = 0;
    }
    // "Bonos" column = every non-transport bonus: T1 bonus + any bono-category importe
    // (bonificación extra, VIH, gemelar, etc.). Those move out of "Imp. de esquema".
    const isBonoCat = entry.category === 'bono';
    const bonos     = bonoT1 + (isBonoCat ? esquema : 0);
    const esquemaOut = isBonoCat ? 0 : esquema;
    const total = entry.isAuto ? (esquemaOut + bonos + bono - pen + reim) : (parseFloat(entry.valor) || 0);
    return { esquema: esquemaOut, bonos, bono, pen, reim, total };
  };

  const filteredAndSortedExtrato = useMemo(() => {
    let result = [...extratoGastos];
    if (extratoFilterFechaDesde) result = result.filter(e => e.fecha >= extratoFilterFechaDesde);
    if (extratoFilterFechaHasta) result = result.filter(e => e.fecha <= extratoFilterFechaHasta);
    if (extratoFilterMotivo)     result = result.filter(e => e.motivo === extratoFilterMotivo);
    if (extratoFilterMovimiento) result = result.filter(e => e.movimiento === extratoFilterMovimiento);
    result.sort((a, b) => {
      const dir = extratoSort.dir === 'asc' ? 1 : -1;
      if (extratoSort.key === 'movimiento') {
        const diff = getMovimientoOrder(a.movimiento) - getMovimientoOrder(b.movimiento);
        return diff !== 0 ? diff * dir : 0;
      }
      let av = a[extratoSort.key] ?? '';
      let bv = b[extratoSort.key] ?? '';
      if (extratoSort.key === 'valor') { av = parseFloat(av) || 0; bv = parseFloat(bv) || 0; }
      else { av = String(av).toLowerCase(); bv = String(bv).toLowerCase(); }
      if (av < bv) return -1 * dir;
      if (av > bv) return  1 * dir;
      return 0;
    });
    return result;
  }, [extratoGastos, extratoFilterFechaDesde, extratoFilterFechaHasta, extratoFilterMotivo, extratoFilterMovimiento, extratoSort]);

  const extratoMotivosOpts     = useMemo(() => [...new Set(extratoGastos.map(e => e.motivo).filter(Boolean))].sort(), [extratoGastos]);
  const extratoMovimientosOpts = useMemo(() => {
    const all = [...new Set(extratoGastos.map(e => e.movimiento).filter(Boolean))];
    return all.sort((a, b) => getMovimientoOrder(a) - getMovimientoOrder(b));
  }, [extratoGastos]);

  const extratoTotals = useMemo(() => {
    return filteredAndSortedExtrato.reduce((acc, e) => {
      const c = getExtratoComponents(e);
      acc.esquema += c.esquema; acc.bonos += c.bonos; acc.bono += c.bono;
      acc.pen += c.pen; acc.reim += c.reim; acc.total += c.total;
      return acc;
    }, { esquema: 0, bonos: 0, bono: 0, pen: 0, reim: 0, total: 0 });
  }, [filteredAndSortedExtrato]);
  const bonosTotalesPaid      = useMemo(() => {
    const bonoCat   = extratoGastos.filter(e => e.category === 'bono').reduce((s, e) => s + (parseFloat(e.valor) || 0), 0);
    const t1Embedded = extratoGastos.reduce((s, e) => s + (parseFloat(e.importeBonoT1Val) || 0), 0);
    return bonoCat + t1Embedded;
  }, [extratoGastos]);
  const bonosTotalesRemaining = useMemo(() => totalBonos - bonosTotalesPaid, [totalBonos, bonosTotalesPaid]);
  const grandTotalRemaining   = useMemo(() => grandTotalWithExtras - pagosRealizados, [grandTotalWithExtras, pagosRealizados]);


  const getPuerperioImporte = (rowId) => {
    if (rowId === 'puerperio1') return p1Amount;
    if (rowId === 'puerperio2') return p2AdjustedAmount;
    if (rowId === 'puerperio3') return p3Amount;
    return 0;
  };

  // ── Data fetch ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isEditMode) {
      fetchPayment();
      setSchemeSelected(true);
      setSchemeLocked(true);
      // lockedFields will be set inside fetchPayment based on which values are non-empty
    }
  }, [id]);

  // Clean up any legacy standalone bonus_t1 entries — the T1 bonus is now embedded
  // directly into the SDG20 and Puerperio 1 extrato entries (importeBonoT1Val).
  useEffect(() => {
    setExtratoGastos(prev => prev.some(e => e.autoKey === 'bonus_t1') ? prev.filter(e => e.autoKey !== 'bonus_t1') : prev);
  }, []);

  const fetchPayment = async () => {
    try {
      setLoading(true);
      const res  = await api.get(`/api/payments-gest/${id}`, { withCredentials: true });
      const data = res.data;
      setFormData({
        gesca: data.gesca || '', ip: data.ip || '', banco: data.banco || '',
        clabe: data.clabe || '',
        fum: data.fum ? data.fum.split('T')[0] : '',
        giro_semana: data.giro_semana || '',
        scheme_value: String(Math.round(parseFloat(data.scheme_value)) || 375000), status: data.status || 'active',
      });
      if (data.transferencias)               setTransferencias(data.transferencias);
      if (data.row_states)                   setRowStates(data.row_states);
      if (data.puerperio_states)             setPuerperioStates(data.puerperio_states);
      if (data.bono_vih !== undefined)       setBonoVIH(data.bono_vih);
      if (data.bono_gemelar !== undefined)   setBonoGemelar(data.bono_gemelar);
      if (data.bono_states)                  setBonoStates(data.bono_states);
      if (data.bg_conditions)                setBgConditions(data.bg_conditions);
      if (data.bg_state)                     setBgState(data.bg_state);
      if (data.bg_extra_title)               setBgExtraTitle(data.bg_extra_title);
      if (data.bg_extra_importe !== undefined) setBgExtraImporte(String(data.bg_extra_importe || ''));
      if (data.parc_count)                   setParcCount(Math.min(3, data.parc_count)); // cap at 3
      if (data.parc_completed)               setParcCompleted(data.parc_completed.slice(0, 3));
      if (data.parc_real_amounts)            setParcRealAmounts(data.parc_real_amounts.slice(0, 3));
      if (data.semana_parto)                 setSemanaParto(data.semana_parto);
      if (data.extrato_gastos)               setExtratoGastos(data.extrato_gastos);
      if (data.ayuda_maternidad !== undefined) setAyudaMaternidad(data.ayuda_maternidad);
      if (data.ayuda_amount !== undefined)   setAyudaAmount(String(data.ayuda_amount || ''));
      if (data.ayuda_state)                  setAyudaState(data.ayuda_state);
      if (data.row_comments) {
        setRowComments(data.row_comments);
        // Any key with a saved comment starts as locked
        const locked = {};
        Object.keys(data.row_comments).forEach(k => { if (data.row_comments[k]) locked[k] = true; });
        setLockedComments(locked);
      }

      // Only lock fields that actually have a value — empty fields stay editable
      const newLocked = {};
      const loadedData = {
        gesca: data.gesca, ip: data.ip, banco: data.banco, clabe: data.clabe,
        fum: data.fum, giro_semana: data.giro_semana,
      };
      FORM_FIELDS.forEach(f => {
        const v = loadedData[f];
        newLocked[f] = v !== null && v !== undefined && String(v).trim() !== '';
      });
      setLockedFields(newLocked);
    } catch {
      setAlert({ show: true, type: 'danger', message: 'Error al cargar el esquema de pago' });
    } finally {
      setLoading(false);
    }
  };

  // ── Per-field lock handlers ───────────────────────────────────────────────
  const handleFormChange = (e) => { setFormData(p => ({ ...p, [e.target.name]: e.target.value })); debouncedSave(); };

  const FIELD_LABELS = {
    gesca: 'GESCA', ip: 'IP', banco: 'Banco', clabe: 'Clabe',
    fum: 'FUM', giro_semana: 'Giro de semana',
  };

  const handleFieldLockRequest = (name, action) => {
    if (action === 'save') {
      const v = formData[name];
      if (v && String(v).trim() !== '') {
        setLockedFields(p => ({ ...p, [name]: true }));
        autoSaveDeferred();
      }
    } else if (action === 'unlock') {
      setFieldUnlockTarget({ name, label: FIELD_LABELS[name] || name });
      setFieldUnlockPassword('');
      setFieldUnlockError('');
      setShowFieldUnlockModal(true);
    }
  };

  const confirmFieldUnlock = () => {
    if (fieldUnlockPassword !== UNLOCK_PASSWORD) {
      setFieldUnlockError('Contraseña incorrecta'); return;
    }
    const name = fieldUnlockTarget.name;
    setLockedFields(p => ({ ...p, [name]: false }));
    setShowFieldUnlockModal(false);
    setFieldUnlockTarget(null);
    setFieldUnlockPassword('');
    setFieldUnlockError('');
    authenticateBills();
  };

  // ── Scheme handlers ───────────────────────────────────────────────────────
  const handleSchemeDropdownChange = (newValue) => {
    if (!newValue || schemeLocked) return;
    setFormData(p => ({ ...p, scheme_value: newValue }));
    debouncedSave();
  };

  const handleSchemeConfirm = () => {
    if (!formData.scheme_value) return;
    setSchemeSelected(true);
    setSchemeLocked(true);
    // schemeSelected will be true after render; pass override so autoSave doesn't skip
    autoSaveDeferred({ schemeSelected: true, formData });
  };

  const handleSchemeChangeRequest = () => {
    // Already locked: prompt password to unlock
    setSchemePasswordInput(''); setSchemePasswordError('');
    setShowSchemePasswordModal(true);
  };

  const confirmSchemeChange = () => {
    if (schemePasswordInput !== SCHEME_PASSWORD) {
      setSchemePasswordError('Contraseña incorrecta'); return;
    }
    // Unlock the scheme selector so user can pick a new value and re-confirm
    setSchemeLocked(false);
    setSchemeSelected(false);
    setShowSchemePasswordModal(false);
    setSchemePasswordInput(''); setSchemePasswordError('');
    authenticateBills();
  };

  // ── Row / payment handlers ────────────────────────────────────────────────
  const updateTransferencia  = (i, f, v) => { setTransferencias(p => p.map((t, idx) => idx === i ? { ...t, [f]: v } : t)); debouncedSave(); };

  // When "Beta positiva" is set on transferencia i, clear ALL subsequent transferencias'
  // payment data AND remove their extrato entries (they are hidden and must not count).
  const handleBetaSuccessful = (i, checked) => {
    setTransferencias(prev => prev.map((t, idx) => {
      if (idx === i) return { ...t, successful: checked };
      if (checked && idx > i) {
        return { ...t, completed: false, transCompleted: false, successful: false,
          realImporte: '', transRealBono: '', penalizacion: '', reembolso: '', transPenalizacion: '', transReembolso: '' };
      }
      return t;
    }));
    if (checked) {
      const clearedIds = transferencias.filter((_, idx) => idx > i).map(t => t.id);
      setExtratoGastos(prev => prev.filter(e => {
        if (!e.autoKey) return true;
        const mBeta = e.autoKey.match(/^transferencia_(\d+)$/);
        const mBono = e.autoKey.match(/^trans_bono_(\d+)$/);
        const id = mBeta ? parseInt(mBeta[1]) : mBono ? parseInt(mBono[1]) : null;
        return id === null || !clearedIds.includes(id);
      }));
    }
    autoSaveDeferred();
  };
  const updateRowState       = (rid, f, v) => { setRowStates(p => ({ ...p, [rid]: { ...(p[rid] || initRS()), [f]: v } })); debouncedSave(); };
  const updatePuerperioState = (rid, f, v) => { setPuerperioStates(p => ({ ...p, [rid]: { ...(p[rid] || initRS()), [f]: v } })); debouncedSave(); };
  const updateBonoState      = (k, f, v)   => { setBonoStates(p => ({ ...p, [k]: { ...p[k], [f]: v } })); debouncedSave(); };
  const updateBgCondition    = (k, v)      => { setBgConditions(p => ({ ...p, [k]: v })); debouncedSave(); };
  const updateBgState        = (f, v)      => { setBgState(p => ({ ...p, [f]: v })); debouncedSave(); };
  const updateAyudaState     = (f, v)      => { setAyudaState(p => ({ ...p, [f]: v })); debouncedSave(); };

  const handleExtratoSort = (key) => {
    setExtratoSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
  };
  const ExtratoSortIcon = ({ col }) => {
    const active = extratoSort.key === col;
    const up = extratoSort.dir === 'asc';
    return (
      <span style={{ marginLeft: '4px', fontSize: '0.7rem', opacity: active ? 1 : 0.3, cursor: 'pointer' }}>
        {active ? (up ? '▲' : '▼') : '⇅'}
      </span>
    );
  };

  const handleParcCountChange = (n) => {
    const capped = Math.min(3, n);
    setParcCount(capped);
    setParcCompleted(prev => prev.map((v, i) => i >= capped ? false : v));
    debouncedSave();
  };

  // Selecting a semana de parto cancels all SDG rows AFTER it. Any already-registered
  // payment for those rows must be erased (uncompleted + extrato entry removed).
  const handleSemanaPartoChange = (value) => {
    setSemanaParto(value);
    const idx = BIRTH_WEEK_ORDER.indexOf(value);
    const newBlocked = idx < 0 ? new Set() : new Set(BIRTH_WEEK_ROW_IDS.slice(idx + 1));
    if (newBlocked.size > 0) {
      setRowStates(prev => {
        const next = { ...prev };
        newBlocked.forEach(id => {
          if (next[id]) next[id] = { ...next[id], completed: false };
        });
        return next;
      });
      setExtratoGastos(prev => prev.filter(e => {
        if (!e.autoKey) return true;
        const m = e.autoKey.match(/^fixed_(.+)$/);
        return !(m && newBlocked.has(m[1]));
      }));
    }
    autoSaveDeferred();
  };

  const openDateModal = ({ autoKey, label, importe, importeBonoT1, bonoVal, penalizacion, reembolso, category, commitTrue }) => {
    const reembolsoVal      = parseFloat(reembolso)    || 0;
    const bonoValStored     = parseFloat(bonoVal)      || 0;
    const penalizacionVal   = parseFloat(penalizacion) || 0;
    const importeBonoT1Val  = parseFloat(importeBonoT1) || 0;
    const importeEsquemaVal = parseFloat(importe)      || 0;
    const valor = importeEsquemaVal + importeBonoT1Val + bonoValStored - penalizacionVal + reembolsoVal;
    setDateModalInfo({ label, autoKey, valor, importeEsquemaVal, importeBonoT1Val, bonoValStored, penalizacionVal, reembolsoVal, category, fecha: new Date().toISOString().split('T')[0], confirm: commitTrue });
    setShowDateModal(true);
  };

  const confirmDateModal = () => {
    const { label, autoKey, fecha, valor, importeEsquemaVal, importeBonoT1Val, bonoValStored, penalizacionVal, reembolsoVal, category, confirm } = dateModalInfo;
    setExtratoGastos(prev => [
      ...prev.filter(e => e.autoKey !== autoKey),
      { id: `auto_${autoKey}_${Date.now()}`, fecha, valor,
        importeEsquemaVal: importeEsquemaVal || 0, importeBonoT1Val: importeBonoT1Val || 0,
        bonoValStored: bonoValStored || 0, penalizacionVal: penalizacionVal || 0, reembolsoVal: reembolsoVal || 0,
        autoKey, category, movimiento: label, motivo: 'Pago de esquema', isAuto: true },
    ]);
    confirm && confirm();
    setShowDateModal(false);
    autoSaveDeferred();
  };

  // Enter key confirms the payment as soon as the date modal is open (date defaults to today)
  useEffect(() => {
    if (!showDateModal) return;
    const handler = (e) => {
      if (e.key === 'Enter' && dateModalInfo.fecha) { e.preventDefault(); confirmDateModal(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [showDateModal, dateModalInfo]);

  const openUnlockModal = ({ autoKey, label, uncomplete }) => {
    setUnlockTarget({ autoKey, label, uncomplete });
    setUnlockPasswordInput(''); setUnlockPasswordError('');
    setShowUnlockModal(true);
  };

  const confirmUnlock = () => {
    if (unlockPasswordInput !== UNLOCK_PASSWORD) { setUnlockPasswordError('Contraseña incorrecta'); return; }
    setExtratoGastos(prev => prev.filter(e => e.autoKey !== unlockTarget.autoKey));
    unlockTarget.uncomplete && unlockTarget.uncomplete();
    setShowUnlockModal(false);
    setUnlockPasswordInput(''); setUnlockPasswordError('');
    autoSaveDeferred();
  };

  const addExtratoEntry = () => {
    if (!newExtrato.fecha || !newExtrato.motivo || !newExtrato.movimiento || !newExtrato.valor) {
      setExtratoAlert({ show: true, type: 'warning', message: 'Completa todos los campos' });
      setTimeout(() => setExtratoAlert({ show: false }), 4000); return;
    }
    setExtratoGastos(p => [...p, { id: Date.now(), ...newExtrato, valor: parseFloat(newExtrato.valor), isAuto: false, category: 'manual' }]);
    setNewExtrato({ fecha: '', motivo: '', movimiento: '', valor: '' });
    autoSaveDeferred();
  };

  const confirmDeleteExtrato = (entry) => {
    setDeleteTarget({ type: 'extrato', id: entry.id, label: entry.movimiento || entry.motivo || 'entrada', autoKey: entry.autoKey || null, isAuto: entry.isAuto || false });
    setDeletePasswordInput(''); setDeletePasswordError('');
    setShowDeletePasswordModal(true);
  };

  const uncompleteByAutoKey = (autoKey) => {
    if (!autoKey) return;
    if      (autoKey.startsWith('transferencia_')) { const idx = transferencias.findIndex(t => t.id === parseInt(autoKey.split('_')[1])); if (idx !== -1) updateTransferencia(idx, 'completed', false); }
    else if (autoKey.startsWith('trans_bono_'))    { const idx = transferencias.findIndex(t => t.id === parseInt(autoKey.split('_')[2])); if (idx !== -1) updateTransferencia(idx, 'transCompleted', false); }
    else if (autoKey.startsWith('fixed_'))         { updateRowState(autoKey.replace('fixed_', ''), 'completed', false); }
    else if (autoKey.startsWith('puerperio_'))     { updatePuerperioState(autoKey.replace('puerperio_', ''), 'completed', false); }
    else if (autoKey === 'bono_vih')               { updateBonoState('vih', 'completed', false); }
    else if (autoKey === 'bono_gemelar')           { updateBonoState('gemelar', 'completed', false); }
    else if (autoKey.startsWith('parcialidad_'))   { const i = parseInt(autoKey.split('_')[1]); setParcCompleted(prev => prev.map((v, j) => j === i ? false : v)); }
    else if (autoKey === 'ayuda_maternidad')        { updateAyudaState('completed', false); }
    else if (autoKey === 'buena_gestante')          { updateBgState('completed', false); }
  };

  const handleDeletePasswordSubmit = () => {
    if (deletePasswordInput !== UNLOCK_PASSWORD) { setDeletePasswordError('Contraseña incorrecta'); return; }
    authenticateBills();
    setShowDeletePasswordModal(false);
    setDeletePasswordInput(''); setDeletePasswordError('');
    setShowDeleteModal(true);
  };

  const handleDeletePasswordModalClose = () => {
    setShowDeletePasswordModal(false);
    setDeletePasswordInput(''); setDeletePasswordError('');
    setDeleteTarget({ type: '', id: null, label: '', autoKey: '', isAuto: false });
  };

  const executeDelete = () => {
    if (deleteTarget.type === 'extrato') {
      setExtratoGastos(p => p.filter(e => e.id !== deleteTarget.id));
      if (deleteTarget.isAuto && deleteTarget.autoKey) uncompleteByAutoKey(deleteTarget.autoKey);
    }
    setShowDeleteModal(false);
    setDeleteTarget({ type: '', id: null, label: '', autoKey: '', isAuto: false });
    autoSaveDeferred();
  };

  // ── Comment handlers ──────────────────────────────────────────────────────
  const openCommentModal = (key, label) => {
    const existing = rowComments[key];
    setCommentCtx({ key, label });
    setCommentDraft(existing || '');
    setCommentEditMode(!lockedComments[key]);   // locked comment → view mode, else edit mode
    setCommentPwVisible(false);
    setCommentPw('');
    setCommentPwError('');
    setShowCommentModal(true);
  };

  const saveComment = () => {
    const updated = { ...rowComments, [commentCtx.key]: commentDraft };
    setRowComments(updated);
    setLockedComments(p => ({ ...p, [commentCtx.key]: true }));
    setCommentEditMode(false);
    setCommentPwVisible(false);
    autoSaveDeferred({ rowComments: updated });
  };

  const confirmCommentUnlock = () => {
    if (commentPw !== UNLOCK_PASSWORD) { setCommentPwError('Contraseña incorrecta'); return; }
    setCommentEditMode(true);
    setCommentPwVisible(false);
    setCommentPw('');
    setCommentPwError('');
  };

  // ── Export handlers ─────────────────────────────────────────────────────────
  const openExportModal = () => {
    setExportPwOk(false); setExportPw(''); setExportPwError('');
    setExportCols({ esquema: true, bonos: true, bono: true, pen: true, reim: true });
    setShowExportModal(true);
  };
  const confirmExportPw = () => {
    if (exportPw !== UNLOCK_PASSWORD) { setExportPwError('Contraseña incorrecta'); return; }
    setExportPwOk(true); setExportPw(''); setExportPwError('');
    authenticateBills();
  };
  const buildExportRows = () => {
    const cols = [{ key: 'fecha', label: 'Fecha' }, { key: 'motivo', label: 'Motivo' }, { key: 'movimiento', label: 'Movimiento' }];
    if (exportCols.esquema) cols.push({ key: 'esquema', label: 'Imp. de esquema' });
    if (exportCols.bonos)   cols.push({ key: 'bonos',   label: 'Bonos' });
    if (exportCols.bono)    cols.push({ key: 'bono',    label: 'Bono transporte' });
    if (exportCols.pen)     cols.push({ key: 'pen',     label: 'Penalización' });
    if (exportCols.reim)    cols.push({ key: 'reim',    label: 'Reembolso' });
    cols.push({ key: 'total', label: 'TOTAL' });
    // Order by Movimiento ascending (same custom logic as the on-screen column)
    const ordered = [...filteredAndSortedExtrato].sort(
      (a, b) => getMovimientoOrder(a.movimiento) - getMovimientoOrder(b.movimiento)
    );
    const rows = ordered.map(e => {
      const c = getExtratoComponents(e);
      return cols.map(col => {
        if (col.key === 'fecha')      return new Date(e.fecha + 'T12:00:00').toLocaleDateString('es-MX');
        if (col.key === 'motivo')     return e.motivo || '';
        if (col.key === 'movimiento') return e.movimiento || '';
        // for total, recompute based ONLY on selected components
        if (col.key === 'total') {
          let t = 0;
          if (exportCols.esquema) t += c.esquema;
          if (exportCols.bonos)   t += c.bonos;
          if (exportCols.bono)    t += c.bono;
          if (exportCols.pen)     t -= c.pen;
          if (exportCols.reim)    t += c.reim;
          return t;
        }
        return c[col.key] || 0;
      });
    });
    const totals = cols.map((col, i) => {
      if (i === 0) return 'TOTALES';
      if (['fecha','motivo','movimiento'].includes(col.key)) return '';
      return rows.reduce((s, r) => s + (typeof r[i] === 'number' ? r[i] : 0), 0);
    });
    return { cols, rows, totals };
  };
  const exportExcel = () => {
    const { cols, rows, totals } = buildExportRows();
    const numKeys = new Set(['esquema', 'bonos', 'bono', 'pen', 'reim', 'total']);

    // Build AOA: title rows + header + data + totals
    const aoa = [];
    aoa.push(['Extrato Gastos']);
    aoa.push([`GESCA: ${formData.gesca || '—'}`, '', `IP: ${formData.ip || '—'}`, '', `Esquema: ${fmt(schemeValue)}`]);
    aoa.push([`Generado: ${new Date().toLocaleString('es-MX')}`]);
    aoa.push([]);                              // spacer
    const headerRowIdx = aoa.length;           // 0-based row index of the header
    aoa.push(cols.map(c => c.label));
    rows.forEach(r => aoa.push(r));
    aoa.push(totals);
    const totalRowIdx = aoa.length - 1;

    const ws = XLSXStyle.utils.aoa_to_sheet(aoa);

    // Column widths
    const widthFor = (key) => {
      if (key === 'fecha') return 14;
      if (key === 'motivo') return 20;
      if (key === 'movimiento') return 22;
      return 18;
    };
    ws['!cols'] = cols.map(c => ({ wch: widthFor(c.key) }));

    // Merge title across all columns
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: cols.length - 1 } }];

    const navy   = '2D3748';
    const headBg = '6B89BE';
    const footBg = 'D6E0F2';
    const footTx = '375596';
    const stripe = 'F4F4F6';

    const setCell = (r, c, style) => {
      const ref = XLSXStyle.utils.encode_cell({ r, c });
      if (!ws[ref]) ws[ref] = { t: 's', v: '' };
      ws[ref].s = { ...(ws[ref].s || {}), ...style };
    };

    // Title styling
    setCell(0, 0, { font: { bold: true, sz: 18, color: { rgb: navy } } });
    setCell(1, 0, { font: { bold: true, sz: 10, color: { rgb: navy } } });
    setCell(1, 2, { font: { bold: true, sz: 10, color: { rgb: navy } } });
    setCell(1, 4, { font: { bold: true, sz: 10, color: { rgb: navy } } });
    setCell(2, 0, { font: { sz: 9, color: { rgb: '666666' } } });

    // Header row
    cols.forEach((col, ci) => {
      setCell(headerRowIdx, ci, {
        fill: { fgColor: { rgb: headBg } },
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 10 },
        alignment: { horizontal: numKeys.has(col.key) ? 'right' : 'left', vertical: 'center' },
      });
    });

    // Data rows: number format + alternating stripes
    rows.forEach((r, ri) => {
      const rowIdx = headerRowIdx + 1 + ri;
      const striped = ri % 2 === 1;
      cols.forEach((col, ci) => {
        const ref = XLSXStyle.utils.encode_cell({ r: rowIdx, c: ci });
        const isNum = numKeys.has(col.key);
        const style = {
          alignment: { horizontal: isNum ? 'right' : 'left' },
          font: { sz: 9, color: { rgb: '3C3C46' } },
        };
        if (striped) style.fill = { fgColor: { rgb: stripe } };
        if (ws[ref]) {
          ws[ref].s = style;
          if (isNum && typeof ws[ref].v === 'number') ws[ref].z = '"$"#,##0.00';
        }
      });
    });

    // Totals row
    cols.forEach((col, ci) => {
      const ref = XLSXStyle.utils.encode_cell({ r: totalRowIdx, c: ci });
      const isNum = numKeys.has(col.key);
      if (ws[ref]) {
        ws[ref].s = {
          fill: { fgColor: { rgb: footBg } },
          font: { bold: true, color: { rgb: footTx }, sz: 10 },
          alignment: { horizontal: isNum ? 'right' : 'left' },
        };
        if (isNum && typeof ws[ref].v === 'number') ws[ref].z = '"$"#,##0.00';
      }
    });

    const wb = XLSXStyle.utils.book_new();
    XLSXStyle.utils.book_append_sheet(wb, ws, 'Extrato Gastos');
    XLSXStyle.writeFile(wb, `extrato_${formData.gesca || 'esquema'}_${new Date().toISOString().split('T')[0]}.xlsx`);
    setShowExportModal(false);
  };
  const exportPDF = () => {
    const { cols, rows, totals } = buildExportRows();
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const marginX = 32;

    // Brand colours (Babyboom template)
    const navy     = [45, 55, 72];
    const headBlue = [107, 137, 190];
    const footBlue = [214, 224, 242];
    const footText = [55, 85, 150];
    const stripe   = [240, 240, 242];
    const pink     = [236, 96, 154];
    const brandNavy = [45, 58, 140];

    // Vector Babyboom brand mark (top-left of mark area at x,y)
    const drawBabyboomLogo = (x, y) => {
      doc.setFillColor(...pink);
      doc.circle(x + 12, y + 12, 11, 'F');           // pink balloon
      doc.setFillColor(255, 255, 255);
      doc.circle(x + 12, y + 9, 4, 'F');             // head
      doc.roundedRect(x + 8, y + 12, 8, 7, 3, 3, 'F'); // body
      doc.setFillColor(...brandNavy);
      doc.circle(x + 22, y + 6, 4, 'F');             // small blue balloon
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(...pink);
      doc.text('Babyboom', x + 30, y + 17);
      const w = doc.getTextWidth('Babyboom');
      doc.setFontSize(8);
      doc.setTextColor(...brandNavy);
      doc.text('Surrogacy', x + 30 + w - doc.getTextWidth('Surrogacy'), y + 26);
    };

    // ── Header ──
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(...navy);
    doc.text('Extrato Gastos', marginX, 44);

    doc.setFontSize(10);
    const metaY = 64;
    const labelVal = (label, val, x) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...navy);
      doc.text(label, x, metaY);
      const lw = doc.getTextWidth(label);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 90);
      doc.text(String(val || '—'), x + lw + 4, metaY);
    };
    labelVal('GESCA:', formData.gesca, marginX);
    labelVal('IP:', formData.ip, marginX + 150);
    labelVal('Esquema:', fmt(schemeValue), marginX + 290);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...navy);
    doc.text('Generado:', marginX, metaY + 16);
    const gl = doc.getTextWidth('Generado:');
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 90);
    doc.text(new Date().toLocaleString('es-MX'), marginX + gl + 4, metaY + 16);

    drawBabyboomLogo(pageW - marginX - 130, 22);

    const fmtCell = (v) => (typeof v === 'number' ? fmt(v) : v);
    const numCols = {};
    cols.forEach((c, i) => { if (!['fecha', 'motivo', 'movimiento'].includes(c.key)) numCols[i] = { halign: 'right' }; });

    autoTable(doc, {
      startY: 92,
      margin: { left: marginX, right: marginX },
      head: [cols.map(c => c.label)],
      body: rows.map(r => r.map(fmtCell)),
      foot: [totals.map(fmtCell)],
      theme: 'plain',
      styles: { fontSize: 8.5, cellPadding: 6, textColor: [60, 60, 70], lineWidth: 0 },
      headStyles: { fillColor: headBlue, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'left', fontSize: 9 },
      bodyStyles: { fillColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: stripe },
      footStyles: { fillColor: footBlue, textColor: footText, fontStyle: 'bold', fontSize: 9 },
      columnStyles: numCols,
      didParseCell: (data) => {
        if (numCols[data.column.index]) data.cell.styles.halign = 'right';
      },
    });

    doc.save(`extrato_${formData.gesca || 'esquema'}_${new Date().toISOString().split('T')[0]}.pdf`);
    setShowExportModal(false);
  };

  // ── Auto-save system ──────────────────────────────────────────────────────
  // buildPayload: snapshot of ALL saveable state, accepts overrides for mid-render calls
  const buildPayload = (overrides = {}) => {
    const s = { ...stateRef.current, ...overrides };
    return {
      ...s.formData,
      scheme_value:    parseFloat(s.formData?.scheme_value),
      transferencias:  s.transferencias,
      row_states:      s.rowStates,
      puerperio_states: s.puerperioStates,
      bono_vih:        s.bonoVIH,
      bono_gemelar:    s.bonoGemelar,
      bono_states:     s.bonoStates,
      bg_conditions:   s.bgConditions,
      bg_state:        s.bgState,
      bg_extra_title:  s.bgExtraTitle || '',
      bg_extra_importe: parseFloat(s.bgExtraImporte) || 0,
      parc_count:      s.parcCount,
      parc_completed:  s.parcCompleted,
      parc_real_amounts: s.parcRealAmounts,
      semana_parto:    s.semanaParto || '',
      ayuda_maternidad: s.ayudaMaternidad,
      ayuda_amount:    parseFloat(s.ayudaAmount) || 0,
      ayuda_state:     s.ayudaState,
      extrato_gastos:  s.extratoGastos,
      row_comments:    s.rowComments,
    };
  };

  const autoSave = async (overrides = {}) => {
    const s = { ...stateRef.current, ...overrides };
    // guard: need minimum required fields + confirmed scheme
    if (!s.formData?.gesca || !s.formData?.scheme_value) return;
    if (!s.schemeSelected) return;
    if (isSavingRef.current) return;

    isSavingRef.current = true;
    setAutoSaving(true);
    setSaveError('');

    const payload = buildPayload(overrides);
    try {
      if (!recordIdRef.current) {
        // First save — POST and capture the returned id
        const res = await api.post('/api/payments-gest', payload, { withCredentials: true });
        const newId = res.data.id || res.data.data?.id;
        recordIdRef.current = newId;
        // Update URL without triggering React Router remount (navigate unmounts the component)
        window.history.replaceState(null, '', `/progestor/payments-gest/${newId}`);
        setSchemeLocked(true);
      } else {
        await api.put(`/api/payments-gest/${recordIdRef.current}`, payload, { withCredentials: true });
      }
      setLastSaved(new Date());
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Error al guardar');
    } finally {
      isSavingRef.current = false;
      setAutoSaving(false);
    }
  };

  // autoSaveDeferred: call AFTER a batch of setState so stateRef has been updated.
  // Uses setTimeout(0) which fires after React's commit + effects phase.
  const autoSaveDeferred = (overrides = {}) => {
    setTimeout(() => autoSave(overrides), 0);
  };

  // debouncedSave: for rapid input changes (NumInput, text fields, checkboxes)
  const debouncedSave = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => autoSave(), 1500);
  };

  // ── Shared styles ─────────────────────────────────────────────────────────
  const cs         = { verticalAlign: 'middle' };
  const hs         = { verticalAlign: 'middle', whiteSpace: 'nowrap' };
  const hsc        = { ...hs, textAlign: 'center' };
  const rowLocked  = { backgroundColor: 'color-mix(in srgb, var(--cui-success) 10%, transparent)' };
  const rowPrimary = { backgroundColor: 'color-mix(in srgb, var(--cui-primary) 12%, transparent)' };
  const disabledSection = !schemeSelected ? { opacity: 0.4, pointerEvents: 'none', userSelect: 'none' } : {};

  if (loading) {
    return (
      <CContainer className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <CSpinner color="primary" />
      </CContainer>
    );
  }

  const section2Rows = FIXED_ROWS.filter(r => r.section === 2);
  const section3Rows = FIXED_ROWS.filter(r => r.section === 3);

  const TheadFull = () => (
    <CTableRow>
      <CTableHeaderCell style={{ ...hs, minWidth: '170px' }}>Concepto</CTableHeaderCell>
      <CTableHeaderCell style={hs}>Importe</CTableHeaderCell>
      <CTableHeaderCell style={hs}>Bono transporte</CTableHeaderCell>
      <CTableHeaderCell style={hs}>Penalización</CTableHeaderCell>
      <CTableHeaderCell style={hs}>Reembolso</CTableHeaderCell>
      <CTableHeaderCell style={hsc}>Pago completado</CTableHeaderCell>
    </CTableRow>
  );

  const CompletedCell = ({ completed, autoKey, label, importe, importeBonoT1, bonoVal, penalizacion, reembolso, category, onCommitTrue, onUncomplete, commentKey }) => (
    <CTableDataCell style={{ ...cs, textAlign: 'center' }}>
      <div className="d-flex align-items-center justify-content-center gap-1">
        <CFormCheck checked={completed} disabled={completed}
          onChange={() => { if (!completed) openDateModal({ autoKey, label, importe: importe || 0, importeBonoT1: importeBonoT1 || 0, bonoVal: bonoVal || 0, penalizacion, reembolso, category, commitTrue: onCommitTrue }); }} />
        {completed && (
          <CButton size="sm" color="warning" variant="ghost" style={{ padding: '2px 6px' }}
            title="Re-editar (requiere contraseña)"
            onClick={() => openUnlockModal({ autoKey, label, uncomplete: onUncomplete })}>
            <CIcon icon={cilPencil} size="sm" />
          </CButton>
        )}
        {commentKey && (
          <CButton size="sm" color="secondary" variant="ghost" style={{ padding: '2px 6px', position: 'relative' }}
            title="Ver / agregar comentario"
            onClick={() => openCommentModal(commentKey, label)}>
            <CIcon icon={cilDescription} size="sm" />
            {rowComments[commentKey] && (
              <CIcon icon={cilWarning} size="sm" style={{ position: 'absolute', top: 0, right: 0, color: 'var(--cui-warning)', fontSize: '0.65rem' }} />
            )}
          </CButton>
        )}
      </div>
    </CTableDataCell>
  );

  const renderFixedRow = (row) => {
    const isBlocked   = blockedBirthRowIds.has(row.id);
    const state       = rowStates[row.id] || initRS();
    const baseImp     = getRowImporte(row, sv);
    const plannedImp  = !isBlocked && (row.id === 'sdg20' && t1Exitosa && baseImp !== null) ? baseImp + 5000 : baseImp;
    const hasBono     = !isBlocked && rowHasBono(row);
    const plannedBono = hasBono ? getRowBono(row, sv) : null;
    const realImp     = (!isBlocked && plannedImp !== null) ? rVal(state.realImporte, plannedImp) : 0;
    const realBono    = hasBono ? rVal(state.realBono, plannedBono) : 0;
    const locked      = state.completed || isBlocked;
    // Original amounts for strikethrough display on blocked rows
    const origImp     = getRowImporte(row, sv);
    const origBono    = getRowBono(row, sv);
    const isSDG20T1     = row.id === 'sdg20' && t1Exitosa;
    const sdg20BonoT1   = isSDG20T1 ? 5000 : 0;
    const sdg20EsquemaImp = isSDG20T1 ? Math.max(0, realImp - 5000) : realImp;
    return (
      <CTableRow key={row.id} style={isBlocked ? { backgroundColor: 'color-mix(in srgb, var(--cui-danger) 4%, transparent)' } : locked ? rowLocked : undefined}>
        <CTableDataCell style={cs}>
          <strong>{row.concepto}</strong>
          {row.id === 'sdg20' && t1Exitosa && <small className="d-block text-muted">${'$'}{(20000).toLocaleString('es-MX')} + {fmt(t1BonusAmount)} bono T1</small>}
          {isBlocked && <CBadge color="danger" variant="outline" className="ms-2" style={{ fontSize: '0.7rem' }}>Excluido — parto SDG {semanaParto}</CBadge>}
        </CTableDataCell>
        <CTableDataCell style={cs}>
          {isBlocked
            ? (origImp !== null && origImp > 0
                ? <span style={{ color: 'var(--cui-danger)', textDecoration: 'line-through', opacity: 0.7 }}>{fmt(origImp)}</span>
                : <span className="text-muted">—</span>)
            : plannedImp !== null
              ? <ImporteCell planned={plannedImp} realValue={state.realImporte ?? ''}
                  disabled={locked} onChange={e => updateRowState(row.id, 'realImporte', e.target.value)} />
              : <span className="text-muted">—</span>}
        </CTableDataCell>
        <CTableDataCell style={cs}>
          {isBlocked
            ? (origBono > 0
                ? <span style={{ color: 'var(--cui-danger)', textDecoration: 'line-through', opacity: 0.7 }}>{fmt(origBono)}</span>
                : <span className="text-muted">—</span>)
            : hasBono
              ? <ImporteCell planned={plannedBono} realValue={state.realBono ?? ''}
                  disabled={locked} onChange={e => updateRowState(row.id, 'realBono', e.target.value)} />
              : <span className="text-muted">—</span>}
        </CTableDataCell>
        <CTableDataCell style={cs}><CurrencyInput disabled={locked} value={state.penalizacion} onChange={e => updateRowState(row.id, 'penalizacion', e.target.value)} inputStyle={{ color: 'var(--cui-danger)' }} /></CTableDataCell>
        <CTableDataCell style={cs}><CurrencyInput disabled={locked} value={state.reembolso}    onChange={e => updateRowState(row.id, 'reembolso',    e.target.value)} inputStyle={{ color: 'var(--cui-info)' }} /></CTableDataCell>
        {isBlocked
          ? <CTableDataCell style={{ ...cs, textAlign: 'center' }}><span className="text-muted small">—</span></CTableDataCell>
          : <CompletedCell completed={locked} autoKey={`fixed_${row.id}`} label={row.concepto}
              importe={sdg20EsquemaImp} importeBonoT1={sdg20BonoT1} bonoVal={realBono} penalizacion={state.penalizacion} reembolso={state.reembolso} category="scheme"
              commentKey={`fixed_${row.id}`}
              onCommitTrue={() => updateRowState(row.id, 'completed', true)} onUncomplete={() => updateRowState(row.id, 'completed', false)} />}
      </CTableRow>
    );
  };

  const SummarySquare = ({ label, sublabel, value, color = 'primary', negative = false }) => (
    <div className="p-3 rounded h-100" style={{
      border: `1px solid ${negative ? 'var(--cui-danger)' : 'var(--cui-border-color)'}`,
      backgroundColor: negative ? 'color-mix(in srgb, var(--cui-danger) 5%, transparent)' : undefined,
    }}>
      <small className="text-muted d-block mb-0" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</small>
      {sublabel && <small className="fw-semibold d-block mb-1" style={{ fontSize: '0.8rem' }}>{sublabel}</small>}
      <h5 className={`mb-0 fw-bold text-${negative ? 'danger' : color}`}>{fmt(value)}</h5>
    </div>
  );

  // Props shared by all LockedFormInput fields
  const fieldProps = {
    onChange:      handleFormChange,
    onLockRequest: handleFieldLockRequest,
  };

  return (
    <CContainer fluid>
      <style>{`
        .no-spinners::-webkit-outer-spin-button,
        .no-spinners::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .no-spinners { -moz-appearance: textfield; }
        .form-check-input:checked { background-color: var(--cui-primary) !important; border-color: var(--cui-primary) !important; }
        .form-check-input:focus   { border-color: var(--cui-primary) !important; box-shadow: 0 0 0 0.25rem color-mix(in srgb, var(--cui-primary) 25%, transparent) !important; }
        .gest-table td, .gest-table th { vertical-align: middle !important; }
        .accordion-button, .accordion-button:not(.collapsed) {
          background-color: var(--cui-tertiary-bg, #f8f9fa) !important;
          color: var(--cui-body-color) !important;
          box-shadow: none !important;
        }
        .accordion-button:hover { background-color: var(--cui-secondary-bg, #e9ecef) !important; }
        .accordion-button::after { filter: none !important; }
        .summary-table th {
          font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;
          white-space: nowrap; padding: 0.6rem 1rem;
          background-color: color-mix(in srgb, var(--cui-primary) 15%, transparent);
          color: var(--cui-primary); border-bottom: 2px solid var(--cui-primary);
        }
        .summary-table td       { font-size: 1rem; font-weight: 600; padding: 0.75rem 1rem; white-space: nowrap; }
        .summary-table .row-base   td { color: var(--cui-primary); }
        .summary-table .row-actual td { font-size: 0.78rem; font-style: italic; color: var(--cui-secondary-color); font-weight: 400; }
        .form-row-equal           { display: grid; gap: 1rem; }
        .form-row-equal.cols-2    { grid-template-columns: repeat(2, 1fr); }
        .form-row-equal.cols-3    { grid-template-columns: repeat(3, 1fr); }
        /* ON = green (condition met / bonus active), OFF = red (discount / inactive) */
        .toggle-btn-on  { background-color: #dcfce7 !important; border-color: #86efac !important; color: #166534 !important; }
        .toggle-btn-on:hover  { background-color: #bbf7d0 !important; }
        .toggle-btn-off { background-color: #fee2e2 !important; border-color: #fca5a5 !important; color: #991b1b !important; }
        .toggle-btn-off:hover { background-color: #fecaca !important; }
        [data-coreui-theme="dark"] .toggle-btn-on,
        html[class*="dark"] .toggle-btn-on  { background-color: #14532d !important; border-color: #16a34a !important; color: #86efac !important; }
        [data-coreui-theme="dark"] .toggle-btn-on:hover,
        html[class*="dark"] .toggle-btn-on:hover { background-color: #166534 !important; }
        [data-coreui-theme="dark"] .toggle-btn-off,
        html[class*="dark"] .toggle-btn-off { background-color: #7f1d1d !important; border-color: #b91c1c !important; color: #fca5a5 !important; }
        [data-coreui-theme="dark"] .toggle-btn-off:hover,
        html[class*="dark"] .toggle-btn-off:hover { background-color: #991b1b !important; }
      `}</style>

      {alert.show && (
        <CAlert className="mx-5" color={alert.type} dismissible onClose={() => setAlert({ show: false })}>
          {alert.message}
        </CAlert>
      )}

      {/* Action bar */}
      <CRow className="mb-4 mx-5 align-items-center">
        <CCol>
          <CButton color="secondary" variant="outline" onClick={() => navigate('/progestor/payments-gest')} className="me-3">
            <CIcon icon={cilArrowLeft} className="me-2" />Volver a Esquemas
          </CButton>
        </CCol>
        <CCol xs="auto">
          {/* Auto-save status indicator */}
          {autoSaving && (
            <span className="text-muted small d-flex align-items-center gap-1">
              <CSpinner size="sm" />Guardando…
            </span>
          )}
          {!autoSaving && saveError && (
            <span className="text-danger small">⚠ {saveError}</span>
          )}
          {!autoSaving && !saveError && lastSaved && (
            <span className="text-success small">
              ✓ Guardado {lastSaved.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {!autoSaving && !saveError && !lastSaved && schemeSelected && (
            <span className="text-muted small fst-italic">Guardado automático activo</span>
          )}
        </CCol>
      </CRow>

      <CAccordion activeItemKey={1} alwaysOpen className="mx-5">

        {/* ═══ 1. Datos del esquema ════════════════════════════════════════ */}
        <CAccordionItem itemKey={1}>
          <CAccordionHeader><strong>Datos del esquema</strong></CAccordionHeader>
          <CAccordionBody style={{ paddingBottom: '2rem' }}>

            {/* ── Scheme selector ── */}
            <div className="p-3 rounded mb-4" style={{
              border: `2px solid ${schemeSelected ? 'var(--cui-success)' : 'var(--cui-primary)'}`,
              backgroundColor: schemeSelected
                ? 'color-mix(in srgb, var(--cui-success) 6%, transparent)'
                : 'color-mix(in srgb, var(--cui-primary) 6%, transparent)',
            }}>
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <div>
                  <CFormLabel className="mb-1 fw-semibold d-flex align-items-center gap-2">
                    {schemeSelected ? '✓ Esquema confirmado' : '① Selecciona y confirma el esquema para continuar'}
                    {schemeLocked && <CIcon icon={cilLockLocked} size="sm" className="text-warning" />}
                  </CFormLabel>
                  <div className="d-flex gap-2 align-items-center flex-wrap">
                    {schemeLocked ? (
                      <div className="px-3 py-1 rounded fw-semibold" style={{
                        border: '1px solid var(--cui-success)',
                        backgroundColor: 'color-mix(in srgb, var(--cui-success) 8%, transparent)',
                        color: 'var(--cui-body-color)',
                        minWidth: '210px',
                        fontSize: '0.95rem',
                      }}>
                        {formData.scheme_value === '400000' ? 'Esquema $400,000' : 'Esquema $375,000'}
                      </div>
                    ) : (
                      <CFormSelect
                        style={{ width: '210px' }}
                        name="scheme_value"
                        value={formData.scheme_value}
                        onChange={e => handleSchemeDropdownChange(e.target.value)}
                      >
                        {!formData.scheme_value && <option value="">— Seleccionar —</option>}
                        <option value="375000">Esquema $375,000</option>
                        <option value="400000">Esquema $400,000</option>
                      </CFormSelect>
                    )}

                    {/* Confirmar button — only visible when not yet locked */}
                    {!schemeLocked && (
                      <CButton
                        color="success"
                        size="sm"
                        disabled={!formData.scheme_value}
                        onClick={handleSchemeConfirm}
                        title="Confirmar esquema y habilitar secciones"
                      >
                        <CIcon icon={cilSave} className="me-1" size="sm" />Confirmar selección
                      </CButton>
                    )}

                    {/* Change button — only visible when locked */}
                    {schemeLocked && (
                      <CButton
                        color="warning"
                        variant="outline"
                        size="sm"
                        onClick={handleSchemeChangeRequest}
                        title="Cambiar esquema (requiere contraseña)"
                      >
                        <CIcon icon={cilPencil} className="me-1" size="sm" />Cambiar
                      </CButton>
                    )}

                    {!schemeSelected && !formData.scheme_value && (
                      <small className="text-muted">Selecciona un esquema y haz clic en <strong>Confirmar selección</strong>.</small>
                    )}
                    {!schemeSelected && formData.scheme_value && (
                      <small className="text-warning fw-semibold">← Haz clic en Confirmar selección para continuar</small>
                    )}
                  </div>
                </div>
                <CFormSelect name="status" value={formData.status} onChange={handleFormChange} style={{ width: '160px' }}>
                  {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </CFormSelect>
              </div>
            </div>

            {/* ── Form fields — each locks individually ── */}
            <div className="form-row-equal cols-2 mb-3">
              <div>
                <LockedFormInput name="gesca" label="GESCA *" value={formData.gesca} locked={lockedFields.gesca} {...fieldProps} />
                {!formData.gesca && (
                  <small className="text-danger d-flex align-items-center gap-1 mt-1">
                    <CIcon icon={cilWarning} size="sm" /> Campo requerido — sin GESCA no se guardarán los cambios
                  </small>
                )}
              </div>
              <LockedFormInput name="ip" label="IP" value={formData.ip} locked={lockedFields.ip} {...fieldProps} />
            </div>
            <div className="form-row-equal cols-2 mb-3">
              <LockedFormInput name="banco" label="Banco"     value={formData.banco} locked={lockedFields.banco} {...fieldProps} />
              <LockedFormInput name="clabe" label="Clabe"     value={formData.clabe} locked={lockedFields.clabe} {...fieldProps} />
            </div>
            <div className="form-row-equal cols-2">
              <LockedFormInput name="fum"         label="FUM"            value={formData.fum}         locked={lockedFields.fum}         type="date" {...fieldProps} />
              <LockedFormInput name="giro_semana" label="Giro de semana" value={formData.giro_semana} locked={lockedFields.giro_semana} {...fieldProps} />
            </div>
          </CAccordionBody>
        </CAccordionItem>

        {/* ═══ Bonos adicionales ══════════════════════════════════════════ */}
        <CAccordionItem itemKey={2} style={disabledSection}>
          <CAccordionHeader>
            <strong>Bonos adicionales</strong>
            <small className="text-muted ms-2">— montos extra al valor del esquema</small>
          </CAccordionHeader>
          <CAccordionBody>
            <div className="table-responsive">
              <CTable hover striped className="gest-table">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell style={{ ...hs, minWidth: '230px' }}>Bono</CTableHeaderCell>
                    <CTableHeaderCell style={hs}>Importe</CTableHeaderCell>
                    <CTableHeaderCell style={hs}>Estado</CTableHeaderCell>
                    <CTableHeaderCell style={hs}>Penalización</CTableHeaderCell>
                    <CTableHeaderCell style={hs}>Reembolso</CTableHeaderCell>
                    <CTableHeaderCell style={hsc}>Pago completado</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {/* T1 + SDG36 automatic bonus */}
                  {(() => {
                    const applies    = sdg36BonusApplied;
                    const weekSet    = !!semanaParto;
                    const is400k     = sv === '400000';
                    const statusLabel = !t1Exitosa
                      ? 'T1 no exitosa'
                      : !weekSet
                        ? 'Pendiente semana de parto'
                        : is400k
                          ? applies
                            ? `T1 400k + SDG${semanaParto} → $10,000 total`
                            : `T1 400k sin SDG36 (semana ${semanaParto}) → $0`
                          : applies
                            ? `T1 375k + SDG${semanaParto} → $5,000 total`
                            : `T1 375k sin SDG36 (semana ${semanaParto}) → $0`;
                    const statusColor = !t1Exitosa ? 'secondary' : !weekSet ? 'warning' : applies ? 'primary' : 'danger';
                    return (
                      <CTableRow style={{ opacity: t1Exitosa ? 1 : 0.5 }}>
                        <CTableDataCell style={cs}>
                          <strong>Transfer 1 / SDG36 (automático)</strong>
                          <small className="d-block text-muted">
                            {is400k
                              ? applies
                                ? '+$10,000 total ($5,000 SDG20 + $5,000 Puerperio 1)'
                                : '$5,000 en SDG20 — penalización $5,000 en Puerperio 1 si SDG < 36'
                              : applies
                                ? '+$5,000 total ($5,000 SDG20, sin adición en Puerperio 1)'
                                : '$5,000 en SDG20 — penalización $5,000 en Puerperio 1 si SDG < 36'}
                          </small>
                        </CTableDataCell>
                        <CTableDataCell style={cs}>
                          <span className="fw-semibold" style={{ color: applies ? 'var(--cui-primary)' : t1Exitosa && weekSet ? 'var(--cui-danger)' : undefined }}>
                            {t1Exitosa ? fmt(t1BonusGross) : '—'}
                          </span>
                        </CTableDataCell>
                        <CTableDataCell style={cs}><CBadge color={statusColor}>{statusLabel}</CBadge></CTableDataCell>
                        <CTableDataCell style={cs}><span className="text-muted small">Automático</span></CTableDataCell>
                        <CTableDataCell style={cs}><span className="text-muted small">Ver extrato</span></CTableDataCell>
                        <CTableDataCell style={{ ...cs, textAlign: 'center' }}>
                          <CButton size="sm" color="secondary" variant="ghost" style={{ padding: '2px 6px', position: 'relative' }}
                            title="Ver / agregar comentario"
                            onClick={() => openCommentModal('bono_t1_sdg36', 'Transfer 1 / SDG36')}>
                            <CIcon icon={cilDescription} size="sm" />
                            {rowComments['bono_t1_sdg36'] && (
                              <CIcon icon={cilWarning} size="sm" style={{ position: 'absolute', top: 0, right: 0, color: 'var(--cui-warning)', fontSize: '0.65rem' }} />
                            )}
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    );
                  })()}
                  {/* VIH */}
                  {(() => {
                    return (
                      <CTableRow style={bonoVIH ? undefined : { opacity: 0.7 }}>
                        <CTableDataCell style={cs}>
                          <CButton
                            size="sm"
                            className={`d-flex align-items-center gap-2 px-3 py-1 ${bonoVIH ? 'toggle-btn-on' : 'toggle-btn-off'}`}
                            style={{ borderRadius: '6px', minWidth: '110px', justifyContent: 'space-between', border: '1px solid', transition: 'background-color 0.15s' }}
                            onClick={() => { setBonoVIH(v => !v); debouncedSave(); }}
                          >
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>VIH</span>
                            <span style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                              {bonoVIH ? <>ON +{fmt(50000)}</> : <>OFF</>}
                            </span>
                          </CButton>
                        </CTableDataCell>
                        <CTableDataCell style={cs}>
                          <span className="fw-semibold" style={{ color: bonoVIH ? 'var(--cui-primary)' : 'var(--cui-secondary-color)' }}>{fmt(50000)}</span>
                        </CTableDataCell>
                        <CTableDataCell style={cs}><CBadge color={bonoVIH ? 'success' : 'secondary'}>{bonoVIH ? 'Aplica' : 'No aplica'}</CBadge></CTableDataCell>
                        <CTableDataCell style={cs}><CFormInput size="sm" disabled value="No hay" style={{ width: '110px', textAlign: 'right', color: 'var(--cui-secondary-color)' }} /></CTableDataCell>
                        <CTableDataCell style={cs}><CFormInput size="sm" disabled value="No hay" style={{ width: '110px', textAlign: 'right', color: 'var(--cui-secondary-color)' }} /></CTableDataCell>
                        <CTableDataCell style={{ ...cs, textAlign: 'center' }}>
                          <small className="text-muted">Ver Puerperio 2</small>
                        </CTableDataCell>
                      </CTableRow>
                    );
                  })()}
                  {/* Gemelar */}
                  {(() => {
                    return (
                      <CTableRow style={bonoGemelar ? undefined : { opacity: 0.7 }}>
                        <CTableDataCell style={cs}>
                          <CButton
                            size="sm"
                            className={`d-flex align-items-center gap-2 px-3 py-1 ${bonoGemelar ? 'toggle-btn-on' : 'toggle-btn-off'}`}
                            style={{ borderRadius: '6px', minWidth: '120px', justifyContent: 'space-between', border: '1px solid', transition: 'background-color 0.15s' }}
                            onClick={() => { setBonoGemelar(v => !v); debouncedSave(); }}
                          >
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Gemelar</span>
                            <span style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                              {bonoGemelar ? <>ON +{fmt(20000)}</> : <>OFF</>}
                            </span>
                          </CButton>
                        </CTableDataCell>
                        <CTableDataCell style={cs}>
                          <span className="fw-semibold" style={{ color: bonoGemelar ? 'var(--cui-primary)' : 'var(--cui-secondary-color)' }}>{fmt(20000)}</span>
                        </CTableDataCell>
                        <CTableDataCell style={cs}><CBadge color={bonoGemelar ? 'success' : 'secondary'}>{bonoGemelar ? 'Aplica' : 'No aplica'}</CBadge></CTableDataCell>
                        <CTableDataCell style={cs}><CFormInput size="sm" disabled value="No hay" style={{ width: '110px', textAlign: 'right', color: 'var(--cui-secondary-color)' }} /></CTableDataCell>
                        <CTableDataCell style={cs}><CFormInput size="sm" disabled value="No hay" style={{ width: '110px', textAlign: 'right', color: 'var(--cui-secondary-color)' }} /></CTableDataCell>
                        <CTableDataCell style={{ ...cs, textAlign: 'center' }}>
                          <small className="text-muted">Ver Puerperio 2</small>
                        </CTableDataCell>
                      </CTableRow>
                    );
                  })()}
                </CTableBody>
              </CTable>
            </div>
          </CAccordionBody>
        </CAccordionItem>

        {/* ═══ Fase 1 — Transferencias ════════════════════════════════════ */}
        <CAccordionItem itemKey={3} style={disabledSection}>
          <CAccordionHeader><strong>Fase 1 / Transferencias &gt; Latido SDG8</strong></CAccordionHeader>
          <CAccordionBody>
            <div className="table-responsive">
              <CTable hover striped className="gest-table">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell style={{ ...hs, minWidth: '170px' }}>Concepto</CTableHeaderCell>
                    <CTableHeaderCell style={hs}>Importe</CTableHeaderCell>
                    <CTableHeaderCell style={hs}>Bono transporte</CTableHeaderCell>
                    <CTableHeaderCell style={hs}>Penalización</CTableHeaderCell>
                    <CTableHeaderCell style={hs}>Reembolso</CTableHeaderCell>
                    <CTableHeaderCell style={hsc}>Beta positiva</CTableHeaderCell>
                    <CTableHeaderCell style={hsc}>Pago completado</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {visibleTransferencias.map((trans, idx) => {
                    const betaLocked  = trans.completed;
                    const transLocked = trans.transCompleted;
                    const betaAutoKey = `transferencia_${trans.id}`;
                    const transAutoKey = `trans_bono_${trans.id}`;
                    const realBetaImp = rVal(trans.realImporte, 1000);
                    const realTransBono = rVal(trans.transRealBono, 500);
                    return (
                      <React.Fragment key={trans.id}>
                        {/* Transferencia row — no importe, bono transporte $500 */}
                        <CTableRow style={transLocked ? rowLocked : undefined}>
                          <CTableDataCell style={cs}>
                            <strong>Transferencia {trans.id}</strong>
                          </CTableDataCell>
                          <CTableDataCell style={cs}><span className="text-muted small">—</span></CTableDataCell>
                          <CTableDataCell style={cs}>
                            <ImporteCell planned={500} realValue={trans.transRealBono ?? ''}
                              disabled={transLocked} onChange={e => updateTransferencia(idx, 'transRealBono', e.target.value)} />
                          </CTableDataCell>
                          <CTableDataCell style={cs}><CurrencyInput disabled={transLocked} value={trans.transPenalizacion} onChange={e => updateTransferencia(idx, 'transPenalizacion', e.target.value)} inputStyle={{ color: 'var(--cui-danger)' }} /></CTableDataCell>
                          <CTableDataCell style={cs}><CurrencyInput disabled={transLocked} value={trans.transReembolso} onChange={e => updateTransferencia(idx, 'transReembolso', e.target.value)} inputStyle={{ color: 'var(--cui-info)' }} /></CTableDataCell>
                          <CTableDataCell style={{ ...cs, textAlign: 'center' }}><span className="text-muted small">—</span></CTableDataCell>
                          <CompletedCell completed={transLocked} autoKey={transAutoKey} label={`Transferencia ${trans.id}`}
                            importe={0} bonoVal={realTransBono} penalizacion={trans.transPenalizacion} reembolso={trans.transReembolso} category="scheme"
                            commentKey={`trans_bono_${trans.id}`}
                            onCommitTrue={() => updateTransferencia(idx, 'transCompleted', true)} onUncomplete={() => updateTransferencia(idx, 'transCompleted', false)} />
                        </CTableRow>
                        {/* Prueba Beta row — importe $1,000, no bono */}
                        <CTableRow style={betaLocked ? rowLocked : trans.successful ? rowPrimary : undefined}>
                          <CTableDataCell style={cs}>
                            <strong>Prueba Beta {trans.id}</strong>
                            {trans.successful && <CBadge color="primary" className="ms-2">Beta positiva</CBadge>}
                          </CTableDataCell>
                          <CTableDataCell style={cs}>
                            <ImporteCell planned={1000} realValue={trans.realImporte ?? ''}
                              disabled={betaLocked} onChange={e => updateTransferencia(idx, 'realImporte', e.target.value)} />
                          </CTableDataCell>
                          <CTableDataCell style={cs}><span className="text-muted small">—</span></CTableDataCell>
                          <CTableDataCell style={cs}><CurrencyInput disabled={betaLocked} value={trans.penalizacion} onChange={e => updateTransferencia(idx, 'penalizacion', e.target.value)} inputStyle={{ color: 'var(--cui-danger)' }} /></CTableDataCell>
                          <CTableDataCell style={cs}><CurrencyInput disabled={betaLocked} value={trans.reembolso} onChange={e => updateTransferencia(idx, 'reembolso', e.target.value)} inputStyle={{ color: 'var(--cui-info)' }} /></CTableDataCell>
                          <CTableDataCell style={{ ...cs, textAlign: 'center' }}>
                            <CFormCheck checked={trans.successful} disabled={betaLocked} onChange={e => handleBetaSuccessful(idx, e.target.checked)} />
                          </CTableDataCell>
                          <CompletedCell completed={betaLocked} autoKey={betaAutoKey} label={`Prueba Beta ${trans.id}`}
                            importe={realBetaImp} bonoVal={0} penalizacion={trans.penalizacion} reembolso={trans.reembolso} category="scheme"
                            commentKey={`transferencia_${trans.id}`}
                            onCommitTrue={() => updateTransferencia(idx, 'completed', true)} onUncomplete={() => updateTransferencia(idx, 'completed', false)} />
                        </CTableRow>
                      </React.Fragment>
                    );
                  })}
                </CTableBody>
              </CTable>
            </div>
          </CAccordionBody>
        </CAccordionItem>

        {/* ═══ Fase 2 ════════════════════════════════════════════════════ */}
        <CAccordionItem itemKey={4} style={disabledSection}>
          <CAccordionHeader><strong>Fase 2 / Beta positiva &gt; SDG 10</strong></CAccordionHeader>
          <CAccordionBody>
            <div className="table-responsive">
              <CTable hover striped className="gest-table">
                <CTableHead><TheadFull /></CTableHead>
                <CTableBody>{section2Rows.map(row => renderFixedRow(row))}</CTableBody>
              </CTable>
            </div>
          </CAccordionBody>
        </CAccordionItem>

        {/* ═══ Fases de pagos ════════════════════════════════════════════ */}
        <CAccordionItem itemKey={5} style={disabledSection}>
          <CAccordionHeader><strong>Fases de pagos &gt; Descripción del Esquema</strong></CAccordionHeader>
          <CAccordionBody>
            <div className="table-responsive">
              <CTable hover striped className="gest-table">
                <CTableHead><TheadFull /></CTableHead>
                <CTableBody>{section3Rows.map(row => renderFixedRow(row))}</CTableBody>
              </CTable>
            </div>

            {/* Semana de parto */}
            <div className="mt-3 p-3 rounded" style={{ border: `1px solid ${semanaParto ? 'var(--cui-primary)' : 'var(--cui-border-color)'}` }}>
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <div className="fw-semibold" style={{ minWidth: '140px' }}>Semana de parto</div>
                <CFormSelect style={{ width: '160px' }} value={semanaParto}
                  onChange={e => handleSemanaPartoChange(e.target.value)}>
                  <option value="">— Seleccionar —</option>
                  {['32', '34', '35', '36', '37', '38', '39', '40'].map(w => (
                    <option key={w} value={w}>{w} SDG</option>
                  ))}
                </CFormSelect>
                {semanaParto && (
                  ['36', '37', '38', '39', '40'].includes(semanaParto)
                    ? <CBadge color="success">+$5,000 bono aplicado a Puerperio 1 {!t1Exitosa && <>(requiere T1 beta positiva)</>}</CBadge>
                    : <CBadge color="secondary">Sin bono (semana &lt; 36)</CBadge>
                )}
              </div>
            </div>

            {/* CDO. GESCA */}
            <div className="mt-3 p-3 rounded" style={{ border: '1px solid var(--cui-border-color)' }}>
              <div className="d-flex justify-content-between align-items-start mb-1 flex-wrap gap-2">
                <div>
                  <h6 className="mb-0">CDO. GESCA</h6>
                  <small className="text-muted">Pago Cualitativo (HIM, cuidados, deberes y obligaciones de la gestante)</small>
                </div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  {bgDeduction > 0 ? <CBadge color="danger">Descuento: −{fmt(bgDeduction)}</CBadge> : <CBadge color="success">Sin descuentos</CBadge>}
                </div>
              </div>
              <small className="text-muted d-block mb-3">
                Botón <strong>ON</strong> = condición cumplida (sin descuento). Botón <strong>OFF</strong> = condición no cumplida (descuento aplicado a Puerperio 3).
              </small>
              <CRow className="g-2">
                {BG_CONDITIONS.map(cond => {
                  const isOn = bgConditions[cond.id];
                  return (
                    <CCol md={4} key={cond.id}>
                      <CButton size="sm"
                        className={`w-100 d-flex align-items-center justify-content-between px-3 py-2 ${isOn ? 'toggle-btn-on' : 'toggle-btn-off'}`}
                        style={{ borderRadius: '6px', textAlign: 'left', gap: '8px', border: '1px solid', transition: 'background-color 0.15s' }}
                        disabled={bgState.completed}
                        onClick={() => updateBgCondition(cond.id, !isOn)}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{cond.label}</span>
                        <span style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                          {isOn ? <>ON ✓</> : <>OFF −{fmt(cond.amount)}</>}
                        </span>
                      </CButton>
                    </CCol>
                  );
                })}
              </CRow>
            </div>
          </CAccordionBody>
        </CAccordionItem>

        {/* ═══ Puerperio ════════════════════════════════════════════════ */}
        <CAccordionItem itemKey={6} style={disabledSection}>
          <CAccordionHeader>
            <strong>Puerperio</strong>
            <CBadge color="secondary" className="ms-2">Esquema: {fmt(schemeValue)}</CBadge>
          </CAccordionHeader>
          <CAccordionBody>

            {/* P1 / P2 / P3 */}
            <div className="table-responsive mb-4">
              <CTable hover striped className="gest-table">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell style={{ ...hs, minWidth: '260px' }}>Concepto</CTableHeaderCell>
                    <CTableHeaderCell style={hs}>Importe</CTableHeaderCell>
                    <CTableHeaderCell style={hs}>Penalización</CTableHeaderCell>
                    <CTableHeaderCell style={hs}>Reembolso</CTableHeaderCell>
                    <CTableHeaderCell style={hsc}>Pago completado</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {PUERPERIO_ROWS.map(row => {
                    const state       = puerperioStates[row.id] || initRS();
                    const plannedImp  = getPuerperioImporte(row.id);
                    const realImp     = rVal(state.realImporte, plannedImp);
                    const locked      = state.completed;
                    const p1BonoT1    = row.id === 'puerperio1' && sdg36BonusApplied ? 5000 : 0;
                    const p1EsquemaImp = row.id === 'puerperio1' ? Math.max(0, realImp - p1BonoT1) : realImp;
                    return (
                      <React.Fragment key={row.id}>
                        <CTableRow style={locked ? rowLocked : undefined}>
                          <CTableDataCell style={cs}>
                            <strong>{row.concepto}</strong>
                            {row.id === 'puerperio1' && (
                              <div className="mt-1" style={{ fontSize: '0.78rem', color: 'var(--cui-secondary-color)' }}>
                                <span>$50,000</span>
                                {transferenciasPaid > 0 && <span className="text-danger"> − {fmt(transferenciasPaid)} <small>(transferencias)</small></span>}
                                {sdg36BonusApplied && sv === '400000' && <span className="text-success"> + $5,000 <small>(bono SDG36 — 400k)</small></span>}
                                {t1NoSDG36Penalty > 0 && <span className="text-danger"> − {fmt(t1NoSDG36Penalty)} <small>(sin SDG36 — penalización T1)</small></span>}
                                <strong className="ms-1">= {fmt(plannedImp)}</strong>
                              </div>
                            )}
                            {row.id === 'puerperio2' && (
                              <div className="mt-1" style={{ fontSize: '0.78rem', color: 'var(--cui-secondary-color)' }}>
                                <span>Base esquema: {fmt(p2Base)}</span>
                                {vihBonus > 0 && <span className="text-success"> + {fmt(vihBonus)} <small>(bono VIH)</small></span>}
                                {gemelarBonus > 0 && <span className="text-success"> + {fmt(gemelarBonus)} <small>(bono gemelar)</small></span>}
                                {p2Adjustment > 0 && <span className="text-warning d-block">+ {fmt(p2Adjustment)} <small>(ajuste: pagos reales &lt; planeado)</small></span>}
                                {p2Adjustment < 0 && <span className="text-danger d-block">{fmt(p2Adjustment)} <small>(ajuste: pagos reales &gt; planeado)</small></span>}
                                <strong className="d-block">= {fmt(p2AdjustedAmount)}</strong>
                              </div>
                            )}
                            {row.id === 'puerperio3' && (
                              <div className="mt-1" style={{ fontSize: '0.78rem', color: 'var(--cui-secondary-color)' }}>
                                {bgDeduction > 0
                                  ? <span>Base: {fmt(p3BaseRaw)} <small className="text-muted">(CDO −{fmt(bgDeduction)} se muestra en penalizaciones)</small></span>
                                  : <span>Base: {fmt(p3BaseRaw)}</span>}
                                {ayudaAmountNum > 0 && ayudaState.completed && <span className="text-danger"> − {fmt(ayudaAmountNum)} <small>(ayuda maternidad)</small></span>}
                                {ayudaAmountNum > 0 && !ayudaState.completed && <span className="text-muted"> − {fmt(ayudaAmountNum)} <small>(ayuda maternidad — pendiente de pago)</small></span>}
                                <strong className="ms-1">= {fmt(plannedImp)}</strong>
                              </div>
                            )}
                          </CTableDataCell>
                          <CTableDataCell style={cs}>
                            <ImporteCell planned={plannedImp} realValue={state.realImporte ?? ''}
                              disabled={locked} onChange={e => updatePuerperioState(row.id, 'realImporte', e.target.value)} />
                          </CTableDataCell>
                          <CTableDataCell style={cs}><CurrencyInput disabled={locked} value={state.penalizacion} onChange={e => updatePuerperioState(row.id, 'penalizacion', e.target.value)} inputStyle={{ color: 'var(--cui-danger)' }} /></CTableDataCell>
                          <CTableDataCell style={cs}><CurrencyInput disabled={locked} value={state.reembolso}    onChange={e => updatePuerperioState(row.id, 'reembolso',    e.target.value)} inputStyle={{ color: 'var(--cui-info)' }} /></CTableDataCell>
                          <CompletedCell completed={locked} autoKey={`puerperio_${row.id}`} label={row.concepto}
                            importe={p1EsquemaImp} importeBonoT1={p1BonoT1} bonoVal={0} penalizacion={state.penalizacion} reembolso={state.reembolso} category="scheme"
                            commentKey={`puerperio_${row.id}`}
                            onCommitTrue={() => updatePuerperioState(row.id, 'completed', true)} onUncomplete={() => updatePuerperioState(row.id, 'completed', false)} />
                        </CTableRow>
                        {/* Ayuda maternidad row — between P2 and P3 */}
                        {row.id === 'puerperio2' && (() => {
                          const ayudaLocked = ayudaState.completed;
                          const ayudaRealImp = rVal(ayudaState.realImporte, ayudaAmountNum);
                          return (
                            <CTableRow style={ayudaLocked ? rowLocked : undefined}>
                              <CTableDataCell style={cs}>
                                <strong>Ayuda maternidad</strong>
                                <div className="mt-1" style={{ fontSize: '0.78rem', color: 'var(--cui-secondary-color)' }}>
                                  {ayudaAmountNum > 0 && !ayudaLocked && <span className="text-danger"><small>(se descontará de P3 al completar)</small></span>}
                                  {ayudaAmountNum > 0 && ayudaLocked  && <span className="text-danger"><small>−{fmt(ayudaAmountNum)} descontado de P3</small></span>}
                                </div>
                              </CTableDataCell>
                              <CTableDataCell style={cs}>
                                <ImporteCell planned={ayudaAmountNum} realValue={ayudaState.realImporte ?? ''}
                                  disabled={ayudaLocked} onChange={e => updateAyudaState('realImporte', e.target.value)} />
                              </CTableDataCell>
                              <CTableDataCell style={cs}><CurrencyInput disabled={ayudaLocked} value={ayudaState.penalizacion} onChange={e => updateAyudaState('penalizacion', e.target.value)} inputStyle={{ color: 'var(--cui-danger)' }} /></CTableDataCell>
                              <CTableDataCell style={cs}><CurrencyInput disabled={ayudaLocked} value={ayudaState.reembolso}    onChange={e => updateAyudaState('reembolso',    e.target.value)} inputStyle={{ color: 'var(--cui-info)' }} /></CTableDataCell>
                              <CompletedCell completed={ayudaLocked} autoKey="ayuda_maternidad" label="Ayuda maternidad"
                                importe={ayudaRealImp} bonoVal={0} penalizacion={ayudaState.penalizacion} reembolso={ayudaState.reembolso} category="scheme"
                                commentKey="ayuda_maternidad"
                                onCommitTrue={() => updateAyudaState('completed', true)} onUncomplete={() => updateAyudaState('completed', false)} />
                            </CTableRow>
                          );
                        })()}
                      </React.Fragment>
                    );
                  })}
                </CTableBody>
              </CTable>
            </div>


            {/* Parcialidades — variable amounts from cálculo puerperio 4 */}
            <div className="mt-3 p-3 rounded" style={{ border: '1px solid var(--cui-border-color)' }}>
              <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                <div>
                  <h6 className="mb-0">Puerperio 4 — Parcialidades</h6>
                  <small className="text-muted">Últimas firmas: {fmt(ULTIMAS_FIRMAS)}{extraBonus > 0 && <span className="text-danger"> − {fmt(extraBonus)} (bono extra) = <strong>{fmt(calculoPuerperio4)}</strong></span>}{extraBonus === 0 && <strong> = {fmt(calculoPuerperio4)}</strong>}</small>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <CFormLabel className="mb-0">Parcialidades:</CFormLabel>
                  <CFormSelect style={{ width: '80px' }} value={parcCount} onChange={e => handleParcCountChange(parseInt(e.target.value))}>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                  </CFormSelect>
                </div>
              </div>
              <CTable hover striped className="gest-table">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell style={hs}>Parcialidad</CTableHeaderCell>
                    <CTableHeaderCell style={hs}>Importe</CTableHeaderCell>
                    <CTableHeaderCell style={hsc}>Pago completado</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {parcAmounts.map((amt, i) => {
                    const locked  = parcCompleted[i] || false;
                    const autoKey = `parcialidad_${i}`;
                    const realImp = rVal(parcRealAmounts[i], amt);
                    return (
                      <CTableRow key={i} style={locked ? rowLocked : undefined}>
                        <CTableDataCell style={cs}>
                          <strong>Parcialidad {i + 1}</strong>
                          {i === parcAmounts.length - 1 && <CBadge color="secondary" className="ms-2">Última</CBadge>}
                        </CTableDataCell>
                        <CTableDataCell style={cs}>
                          <ImporteCell planned={amt} realValue={parcRealAmounts[i] ?? ''}
                            disabled={locked}
                            onChange={e => setParcRealAmounts(prev => { const n = [...prev]; n[i] = e.target.value; debouncedSave(); return n; })} />
                        </CTableDataCell>
                        <CompletedCell completed={locked} autoKey={autoKey} label={`Parcialidad ${i + 1}`}
                          importe={realImp} bonoVal={0} penalizacion={0} reembolso={0} category="scheme"
                          commentKey={`parcialidad_${i}`}
                          onCommitTrue={() => setParcCompleted(prev => prev.map((v, j) => j === i ? true : v))}
                          onUncomplete={() => setParcCompleted(prev => prev.map((v, j) => j === i ? false : v))} />
                      </CTableRow>
                    );
                  })}
                  <CTableRow>
                    <CTableDataCell style={cs}><em className="text-muted">CDO. GESCA (referencia)</em></CTableDataCell>
                    <CTableDataCell style={cs}>
                      <span className="fw-semibold" style={{ color: bgDeduction > 0 ? 'var(--cui-danger)' : 'var(--cui-success)' }}>
                        {bgDeduction > 0 ? `−${fmt(bgDeduction)}` : '✓ Sin descuento'}
                      </span>
                    </CTableDataCell>
                    <CTableDataCell style={{ ...cs, textAlign: 'center' }}><small className="text-muted">ver CDO. GESCA en Fases de pagos</small></CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>
            </div>

            {/* Bonificación extra (CDO. GESCA) */}
            <div className="mt-3 p-3 rounded" style={{ border: '1px solid var(--cui-border-color)' }}>
              <h6 className="mb-3">Bonificación extra</h6>
              <CTable hover striped className="gest-table mb-0">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell style={{ ...hs, minWidth: '260px' }}>Título de bonificación</CTableHeaderCell>
                    <CTableHeaderCell style={hs}>Importe</CTableHeaderCell>
                    <CTableHeaderCell style={hs}>Penalización</CTableHeaderCell>
                    <CTableHeaderCell style={hs}>Reembolso</CTableHeaderCell>
                    <CTableHeaderCell style={hsc}>Pago completado</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  <CTableRow style={bgState.completed ? rowLocked : undefined}>
                    <CTableDataCell style={cs}>
                      <strong>Bonificación extra</strong>
                      <CFormInput size="sm" className="mt-1" placeholder="Título de bonificación…"
                        value={bgExtraTitle} disabled={bgState.completed}
                        onChange={e => { setBgExtraTitle(e.target.value); debouncedSave(); }}
                        style={{ maxWidth: '280px' }} />
                    </CTableDataCell>
                    <CTableDataCell style={cs}>
                      <NumInput disabled={bgState.completed} value={bgExtraImporte}
                        onChange={e => { setBgExtraImporte(e.target.value); debouncedSave(); }} />
                    </CTableDataCell>
                    <CTableDataCell style={cs}><CurrencyInput disabled={bgState.completed} value={bgState.penalizacion} onChange={e => updateBgState('penalizacion', e.target.value)} inputStyle={{ color: 'var(--cui-danger)' }} /></CTableDataCell>
                    <CTableDataCell style={cs}><CurrencyInput disabled={bgState.completed} value={bgState.reembolso}    onChange={e => updateBgState('reembolso',    e.target.value)} inputStyle={{ color: 'var(--cui-info)' }} /></CTableDataCell>
                    <CompletedCell completed={bgState.completed} autoKey="bonificacion_extra" label={bgExtraTitle || 'Bonificación extra'}
                      importe={parseFloat(bgExtraImporte) || 0} bonoVal={0} penalizacion={bgState.penalizacion} reembolso={bgState.reembolso} category="bono"
                      commentKey="bonificacion_extra"
                      onCommitTrue={() => updateBgState('completed', true)} onUncomplete={() => updateBgState('completed', false)} />
                  </CTableRow>
                </CTableBody>
              </CTable>
            </div>

            {/* Resumen del esquema (subsección) */}
            <div className="mt-3 p-3 rounded" style={{ border: '1px solid var(--cui-border-color)' }}>
              <h6 className="mb-3">Resumen del esquema</h6>
              <CRow className="g-3">
                <CCol md={6}>
                  <div className="p-3 rounded" style={{ border: '1px solid var(--cui-border-color)', height: '100%' }}>
                    <div className="mb-3">
                      <small className="text-muted d-block" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total pagado en programa</small>
                      <small className="text-muted d-block mb-1" style={{ fontSize: '0.72rem' }}>Fase 1 + Fase 2 + Fases de pagos</small>
                      <h5 className="mb-0 fw-bold" style={{ color: 'var(--cui-primary)' }}>{fmt(totalPagadoPrograma)}</h5>
                    </div>
                    <hr className="my-2" />
                    <div>
                      <small className="text-muted d-block" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total pagado en puerperios</small>
                      <small className="text-muted d-block mb-1" style={{ fontSize: '0.72rem' }}>Puerperio 1 + 2 + 3</small>
                      <h5 className="mb-0 fw-bold" style={{ color: 'var(--cui-primary)' }}>{fmt(totalPagadoPuerperio)}</h5>
                    </div>
                  </div>
                </CCol>
                <CCol md={6}>
                  <div className="p-3 rounded" style={{ border: '1px solid var(--cui-border-color)', height: '100%' }}>
                    <div className="mb-3">
                      <small className="text-muted d-block" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total pagado general</small>
                      <small className="text-muted d-block mb-1" style={{ fontSize: '0.72rem' }}>Programa + Puerperios</small>
                      <h5 className="mb-0 fw-bold" style={{ color: 'var(--cui-success)' }}>{fmt(totalPagadoGeneral)}</h5>
                    </div>
                    <hr className="my-2" />
                    <div>
                      <small className="text-muted d-block" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cálculo para Puerperio 4 (Parcialidades)</small>
                      <small className="text-muted d-block mb-1" style={{ fontSize: '0.72rem' }}>{ULTIMAS_FIRMAS.toLocaleString('es-MX')} firmas{extraBonus > 0 ? ` − ${fmt(extraBonus)} (bono extra)` : ''}</small>
                      <h5 className="mb-0 fw-bold" style={{ color: 'var(--cui-success)' }}>{fmt(calculoPuerperio4)}</h5>
                    </div>
                  </div>
                </CCol>
              </CRow>
            </div>
          </CAccordionBody>
        </CAccordionItem>


        {/* ═══ Resumen del esquema ════════════════════════════════════════ */}
        <CAccordionItem itemKey={7} style={disabledSection}>
          <CAccordionHeader><strong>Resumen del esquema</strong></CAccordionHeader>
          <CAccordionBody>
            <div className="table-responsive mb-4">
              <table className="table summary-table mb-0" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr>
                    <th></th>
                    <th>Valor del Esquema</th>
                    <th>Bono de Transporte</th>
                    <th>Bonos Totales <small style={{ fontWeight: 400, textTransform: 'none' }}>(máx. {fmt(TOTAL_BONUS_CAP)})</small></th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="row-base">
                    <td className="text-muted small">Total a pagar</td>
                    <td>
                      {fmt(effectiveSchemeValue - extraBonus)}
                    </td>
                    <td>{fmt(bonoTransporteTotal)}</td>
                    <td>{totalBonos > 0 ? fmt(totalBonos) : <span className="text-muted">—</span>}</td>
                    <td>{fmt(grandTotalWithExtras)}</td>
                  </tr>
                  {extraBonus > 0 && (
                    <tr className="row-actual">
                      <td className="text-danger">Bono extra descontado</td>
                      <td className="text-danger">− {fmt(extraBonus)} <small>(de Puerperio 4 / esquema)</small></td>
                      <td className="text-danger" title="Transporte sobre el tope de $8,500">
                        {bonoTransporteTotal > TOTAL_BONUS_CAP ? `+${fmt(bonoTransporteTotal - TOTAL_BONUS_CAP)} sobre tope` : <span className="text-muted">—</span>}
                      </td>
                      <td className="text-muted">—</td>
                      <td className="text-muted">—</td>
                    </tr>
                  )}
                  <tr className="row-actual">
                    <td className="text-muted">Restante</td>
                    <td style={{ color: schemeValueRemaining <= 0 ? 'var(--cui-success)' : 'var(--cui-warning)' }}>
                      {schemeValueRemaining <= 0 ? '✓ ' : ''}{fmt(Math.max(0, schemeValueRemaining))}
                      {extraBonus > 0 && (
                        <small className="d-block text-danger" style={{ fontWeight: 400, fontStyle: 'italic' }}>
                          {fmt(effectiveSchemeValue)} − {fmt(extraBonus)} (bono extra)
                        </small>
                      )}
                    </td>
                    <td style={{ color: bonoTransporteRemaining <= 0 ? 'var(--cui-success)' : 'var(--cui-warning)' }}>
                      {bonoTransporteRemaining <= 0 ? '✓ ' : ''}{fmt(Math.max(0, bonoTransporteRemaining))}
                    </td>
                    <td style={{ color: bonosTotalesRemaining <= 0 ? 'var(--cui-success)' : (totalBonos === 0 ? undefined : 'var(--cui-warning)') }}>
                      {totalBonos === 0 ? <span className="text-muted">—</span> : bonosTotalesRemaining <= 0 ? '✓ ' + fmt(0) : fmt(bonosTotalesRemaining)}
                    </td>
                    <td style={{ color: grandTotalRemaining <= 0 ? 'var(--cui-success)' : 'var(--cui-warning)' }}>
                      {grandTotalRemaining <= 0 ? '✓ ' : ''}{fmt(Math.max(0, grandTotalRemaining))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 6 summary squares: 3 + 3 */}
            <CRow className="g-3 mb-3">
              <CCol md={4}><SummarySquare label="Esquema de pagos" sublabel="Pagos realizados (Esquema y otros)" value={schemePlannedPaid} color="secondary" /></CCol>
              <CCol md={4}>
                <div className="p-3 rounded h-100" style={{ border: '1px solid var(--cui-border-color)' }}>
                  <small className="text-muted d-block mb-0" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total pagado</small>
                  <small className="fw-semibold d-block mb-1" style={{ fontSize: '0.8rem' }}>Transporte</small>
                  <h5 className="mb-0 fw-bold text-primary">{fmt(bonoTransportePaid)}</h5>
                  {bonoTransporteTotal > TOTAL_BONUS_CAP && (
                    <small className="text-danger d-block mt-1" style={{ fontSize: '0.72rem' }}>
                      Incluye {fmt(bonoTransporteTotal - TOTAL_BONUS_CAP)} sobre el tope de {fmt(TOTAL_BONUS_CAP)}
                    </small>
                  )}
                </div>
              </CCol>
              <CCol md={4}><SummarySquare label="Total pagado" sublabel="Bonos" value={bonosTotalesPaid} /></CCol>
            </CRow>
            <CRow className="g-3 mb-3">
              <CCol md={4}><SummarySquare label="Real Pagado Esquema" sublabel="Total pagado (real)" value={schemeRealPaid} /></CCol>
              <CCol md={4}>
                <div className="p-3 rounded h-100" style={{ border: '1px solid var(--cui-danger)', backgroundColor: 'color-mix(in srgb, var(--cui-danger) 5%, transparent)' }}>
                  <small className="text-muted d-block mb-0" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total descontado</small>
                  <small className="fw-semibold d-block mb-1" style={{ fontSize: '0.8rem' }}>Penalizaciones</small>
                  <h5 className="mb-0 fw-bold text-danger">{fmt(totalPenalizaciones + bgDeduction)}</h5>
                  {birthWeekPenalty > 0 && (
                    <small className="text-danger d-block mt-1" style={{ fontSize: '0.72rem' }}>
                      Incluye −{fmt(birthWeekPenalty)} parto SDG {semanaParto}
                    </small>
                  )}
                </div>
              </CCol>
              <CCol md={4}><SummarySquare label="Total pagado" sublabel="Reembolso" value={totalReembolso} color="info" /></CCol>
            </CRow>

            {/* Grand total — comprehensive total paid (scheme + transporte + bonos) */}
            <div className="mt-3 p-3 rounded" style={{
              border: '2px solid var(--cui-primary)',
              backgroundColor: 'color-mix(in srgb, var(--cui-primary) 8%, transparent)',
            }}>
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <small className="text-muted d-block">Total pagado (real) — Esquema + Bono transporte + Bonos</small>
                  <span className="fw-bold h4 mb-0" style={{ color: 'var(--cui-primary)' }}>{fmt(pagosRealizados)}</span>
                </div>
                <div className="text-end">
                  <small className="text-muted d-block">Desglose</small>
                  <small className="d-block">Esquema: <strong>{fmt(schemeRealPaid)}</strong></small>
                  <small className="d-block">Transporte: <strong>{fmt(bonoTransportePaid)}</strong></small>
                  <small className="d-block">Bonos: <strong>{fmt(bonosTotalesPaid)}</strong></small>
                </div>
              </div>
            </div>
          </CAccordionBody>
        </CAccordionItem>

        {/* ═══ Extrato Gastos ════════════════════════════════════════════ */}
        <CAccordionItem itemKey={8} style={disabledSection}>
          <CAccordionHeader><strong>Extrato Gastos</strong></CAccordionHeader>
          <CAccordionBody>
            {extratoAlert.show && (
              <CAlert color={extratoAlert.type} dismissible onClose={() => setExtratoAlert({ show: false })} className="mb-3">
                {extratoAlert.message}
              </CAlert>
            )}
            {/* ── Add entry row ── */}
            <CRow className="mb-3 align-items-end g-2">
              <CCol md={2}><CFormLabel className="small text-muted mb-1">Fecha</CFormLabel>
                <CFormInput type="date" size="sm" value={newExtrato.fecha} onChange={e => setNewExtrato(p => ({ ...p, fecha: e.target.value }))} /></CCol>
              <CCol md={3}>
                <CFormLabel className="small text-muted mb-1">Motivo</CFormLabel>
                <CFormSelect size="sm" value={newExtrato.motivo} onChange={e => setNewExtrato(p => ({ ...p, motivo: e.target.value }))}>
                  <option value="">Seleccionar motivo...</option>
                  {EXTRATO_MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={3}><CFormLabel className="small text-muted mb-1">Movimiento</CFormLabel>
                <CFormInput size="sm" placeholder="Descripción del movimiento..." value={newExtrato.movimiento} onChange={e => setNewExtrato(p => ({ ...p, movimiento: e.target.value }))} /></CCol>
              <CCol md={2}><CFormLabel className="small text-muted mb-1">Valor (MXN)</CFormLabel>
                <CFormInput type="number" size="sm" className="no-spinners" placeholder="0" value={newExtrato.valor} onChange={e => setNewExtrato(p => ({ ...p, valor: e.target.value }))} /></CCol>
              <CCol md={1}><CButton color="primary" size="sm" onClick={addExtratoEntry} className="w-100"><CIcon icon={cilPlus} /></CButton></CCol>
            </CRow>

            {/* ── Filters ── */}
            <div className="p-3 mb-3 rounded" style={{ border: '1px solid var(--cui-border-color)', backgroundColor: 'color-mix(in srgb, var(--cui-secondary) 4%, transparent)' }}>
              <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                <strong className="small text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>Filtros</strong>
                <div className="d-flex align-items-center gap-2">
                  {(extratoFilterFechaDesde || extratoFilterFechaHasta || extratoFilterMotivo || extratoFilterMovimiento) && (
                    <CButton size="sm" color="secondary" variant="ghost" onClick={() => { setExtratoFilterFechaDesde(''); setExtratoFilterFechaHasta(''); setExtratoFilterMotivo(''); setExtratoFilterMovimiento(''); }}>
                      ✕ Limpiar filtros
                    </CButton>
                  )}
                  <CButton size="sm" color="primary" variant="outline" onClick={openExportModal}>
                    <CIcon icon={cilCloudDownload} size="sm" className="me-1" />Generar PDF / Excel
                  </CButton>
                </div>
              </div>
              <CRow className="g-2 align-items-end">
                <CCol md={2}>
                  <CFormLabel className="small text-muted mb-1">Fecha desde</CFormLabel>
                  <CFormInput type="date" size="sm" value={extratoFilterFechaDesde} onChange={e => setExtratoFilterFechaDesde(e.target.value)} />
                </CCol>
                <CCol md={2}>
                  <CFormLabel className="small text-muted mb-1">Fecha hasta</CFormLabel>
                  <CFormInput type="date" size="sm" value={extratoFilterFechaHasta} onChange={e => setExtratoFilterFechaHasta(e.target.value)} />
                </CCol>
                <CCol md={3}>
                  <CFormLabel className="small text-muted mb-1">Motivo</CFormLabel>
                  <CFormSelect size="sm" value={extratoFilterMotivo} onChange={e => setExtratoFilterMotivo(e.target.value)}>
                    <option value="">Todos los motivos</option>
                    {extratoMotivosOpts.map(m => <option key={m} value={m}>{m}</option>)}
                  </CFormSelect>
                </CCol>
                <CCol md={3}>
                  <CFormLabel className="small text-muted mb-1">Movimiento</CFormLabel>
                  <CFormSelect size="sm" value={extratoFilterMovimiento} onChange={e => setExtratoFilterMovimiento(e.target.value)}>
                    <option value="">Todos los movimientos</option>
                    {extratoMovimientosOpts.map(m => <option key={m} value={m}>{m}</option>)}
                  </CFormSelect>
                </CCol>
                <CCol md={2}>
                  <small className="text-muted d-block">
                    {filteredAndSortedExtrato.length} de {extratoGastos.length} registros
                  </small>
                </CCol>
              </CRow>
            </div>

            <div className="table-responsive">
              <CTable hover striped className="gest-table">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell style={{ ...hs, cursor: 'pointer' }} onClick={() => handleExtratoSort('fecha')}>
                      Fecha <ExtratoSortIcon col="fecha" />
                    </CTableHeaderCell>
                    <CTableHeaderCell style={{ ...hs, cursor: 'pointer' }} onClick={() => handleExtratoSort('motivo')}>
                      Motivo <ExtratoSortIcon col="motivo" />
                    </CTableHeaderCell>
                    <CTableHeaderCell style={{ ...hs, cursor: 'pointer' }} onClick={() => handleExtratoSort('movimiento')}>
                      Movimiento <ExtratoSortIcon col="movimiento" />
                    </CTableHeaderCell>
                    <CTableHeaderCell style={{ ...hs, color: '#7c3aed', cursor: 'pointer' }} onClick={() => handleExtratoSort('importeEsquemaVal')}>
                      Importe esquema <ExtratoSortIcon col="importeEsquemaVal" />
                    </CTableHeaderCell>
                    <CTableHeaderCell style={{ ...hs, color: '#d97706', cursor: 'pointer' }} onClick={() => handleExtratoSort('importeBonoT1Val')}>
                      Bonos <ExtratoSortIcon col="importeBonoT1Val" />
                    </CTableHeaderCell>
                    <CTableHeaderCell style={{ ...hs, color: '#16a34a', cursor: 'pointer' }} onClick={() => handleExtratoSort('bonoValStored')}>
                      Bono transporte <ExtratoSortIcon col="bonoValStored" />
                    </CTableHeaderCell>
                    <CTableHeaderCell style={{ ...hs, color: 'var(--cui-danger)', cursor: 'pointer' }} onClick={() => handleExtratoSort('penalizacionVal')}>
                      Penalización <ExtratoSortIcon col="penalizacionVal" />
                    </CTableHeaderCell>
                    <CTableHeaderCell style={{ ...hs, color: 'var(--cui-info)', cursor: 'pointer' }} onClick={() => handleExtratoSort('reembolsoVal')}>
                      Reembolso <ExtratoSortIcon col="reembolsoVal" />
                    </CTableHeaderCell>
                    <CTableHeaderCell style={{ ...hs, cursor: 'pointer' }} onClick={() => handleExtratoSort('valor')}>
                      Total <ExtratoSortIcon col="valor" />
                    </CTableHeaderCell>
                    <CTableHeaderCell style={hs}>Acciones</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {filteredAndSortedExtrato.length === 0 ? (
                    <CTableRow><CTableDataCell colSpan={10} className="text-center py-4 text-muted">
                      {extratoGastos.length === 0 ? 'No hay entradas registradas' : 'Ningún registro coincide con los filtros aplicados'}
                    </CTableDataCell></CTableRow>
                  ) : filteredAndSortedExtrato.map(entry => {
                    const c = getExtratoComponents(entry);
                    const bonusKeys  = ['bono_vih', 'bono_gemelar'];
                    const isBonus    = bonusKeys.includes(entry.autoKey);
                    const commentKey = `extrato_${entry.autoKey || entry.id}`;
                    return (
                      <CTableRow key={entry.id} style={entry.isAuto ? { backgroundColor: 'color-mix(in srgb, var(--cui-primary) 6%, transparent)' } : undefined}>
                        <CTableDataCell style={cs}>{new Date(entry.fecha + 'T12:00:00').toLocaleDateString('es-MX')}</CTableDataCell>
                        <CTableDataCell style={cs}>{entry.motivo}</CTableDataCell>
                        <CTableDataCell style={cs}><CBadge color={entry.isAuto ? 'primary' : 'secondary'}>{entry.movimiento || '—'}</CBadge></CTableDataCell>
                        <CTableDataCell style={cs}>
                          {entry.isAuto && c.esquema ? <span style={{ color: '#7c3aed', fontWeight: 600 }}>{fmt(c.esquema)}</span> : <span className="text-muted">—</span>}
                        </CTableDataCell>
                        <CTableDataCell style={cs}>
                          {c.bonos ? <span style={{ color: '#d97706', fontWeight: 600 }}>{fmt(c.bonos)}</span> : <span className="text-muted">—</span>}
                        </CTableDataCell>
                        <CTableDataCell style={cs}>
                          {entry.isAuto && c.bono ? <span style={{ color: '#16a34a', fontWeight: 600 }}>{fmt(c.bono)}</span> : <span className="text-muted">—</span>}
                        </CTableDataCell>
                        <CTableDataCell style={cs}>
                          {entry.isAuto && c.pen ? <span style={{ color: 'var(--cui-danger)', fontWeight: 600 }}>{fmt(c.pen)}</span> : <span className="text-muted">—</span>}
                        </CTableDataCell>
                        <CTableDataCell style={cs}>
                          {entry.isAuto && c.reim ? <span style={{ color: 'var(--cui-info)', fontWeight: 600 }}>{fmt(c.reim)}</span> : <span className="text-muted">—</span>}
                        </CTableDataCell>
                        <CTableDataCell style={cs}>
                          <span className="fw-bold" style={{ color: c.total < 0 ? 'var(--cui-danger)' : 'var(--cui-body-color)' }}>{fmt(c.total)}</span>
                        </CTableDataCell>
                        <CTableDataCell style={cs}>
                          <div className="d-flex gap-1 align-items-center">
                            <CButton color="secondary" variant="ghost" size="sm"
                              style={{ padding: '2px 6px', position: 'relative' }}
                              title="Ver / agregar comentario"
                              onClick={() => openCommentModal(commentKey, entry.movimiento || entry.motivo || 'Entrada')}>
                              <CIcon icon={cilDescription} size="sm" />
                              {rowComments[commentKey] && (
                                <CIcon icon={cilWarning} size="sm" style={{ position: 'absolute', top: 0, right: 0, color: 'var(--cui-warning)', fontSize: '0.65rem' }} />
                              )}
                            </CButton>
                            <CButton color="danger" variant="ghost" size="sm" disabled={isBonus}
                              title={isBonus ? 'Este registro se gestiona automáticamente' : entry.isAuto ? 'Eliminar (desbloqueará la fila correspondiente)' : 'Eliminar'}
                              onClick={() => !isBonus && confirmDeleteExtrato(entry)}>
                              <CIcon icon={cilTrash} size="sm" />
                            </CButton>
                          </div>
                        </CTableDataCell>
                      </CTableRow>
                    );
                  })}
                  {filteredAndSortedExtrato.length > 0 && (
                    <CTableRow style={{ borderTop: '2px solid var(--cui-border-color)', fontWeight: 700 }}>
                      <CTableDataCell style={cs} colSpan={3} className="text-end"><strong>TOTALES</strong></CTableDataCell>
                      <CTableDataCell style={cs}><span style={{ color: '#7c3aed' }}>{fmt(extratoTotals.esquema)}</span></CTableDataCell>
                      <CTableDataCell style={cs}><span style={{ color: '#d97706' }}>{fmt(extratoTotals.bonos)}</span></CTableDataCell>
                      <CTableDataCell style={cs}><span style={{ color: '#16a34a' }}>{fmt(extratoTotals.bono)}</span></CTableDataCell>
                      <CTableDataCell style={cs}><span style={{ color: 'var(--cui-danger)' }}>{fmt(extratoTotals.pen)}</span></CTableDataCell>
                      <CTableDataCell style={cs}><span style={{ color: 'var(--cui-info)' }}>{fmt(extratoTotals.reim)}</span></CTableDataCell>
                      <CTableDataCell style={cs}><span style={{ color: 'var(--cui-primary)' }}>{fmt(extratoTotals.total)}</span></CTableDataCell>
                      <CTableDataCell style={cs}></CTableDataCell>
                    </CTableRow>
                  )}
                </CTableBody>
              </CTable>
            </div>
          </CAccordionBody>
        </CAccordionItem>

      </CAccordion>

      {/* ── Modal: export PDF / CSV ── */}
      <CModal visible={showExportModal} onClose={() => setShowExportModal(false)} alignment="center" backdrop="static" keyboard={false}>
        <CModalHeader closeButton={false}>
          <CModalTitle className="d-flex align-items-center"><CIcon icon={cilCloudDownload} className="text-primary me-2" size="lg" />Generar reporte</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {!exportPwOk ? (
            <>
              <p className="mb-3">Ingresa la contraseña para generar el reporte:</p>
              <CFormInput type="password" autoComplete="new-password" value={exportPw}
                onChange={e => { setExportPw(e.target.value); setExportPwError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') confirmExportPw(); }} invalid={!!exportPwError} />
              {exportPwError && <div className="text-danger mt-2 small">{exportPwError}</div>}
            </>
          ) : (
            <>
              <p className="mb-2">Selecciona las columnas a incluir:</p>
              <div className="mb-3">
                <CFormCheck label="Importe esquema"  checked={exportCols.esquema} onChange={e => setExportCols(p => ({ ...p, esquema: e.target.checked }))} />
                <CFormCheck label="Bonos"            checked={exportCols.bonos}   onChange={e => setExportCols(p => ({ ...p, bonos:   e.target.checked }))} />
                <CFormCheck label="Bono transporte"  checked={exportCols.bono}    onChange={e => setExportCols(p => ({ ...p, bono:    e.target.checked }))} />
                <CFormCheck label="Penalización"     checked={exportCols.pen}     onChange={e => setExportCols(p => ({ ...p, pen:     e.target.checked }))} />
                <CFormCheck label="Reembolso"        checked={exportCols.reim}    onChange={e => setExportCols(p => ({ ...p, reim:    e.target.checked }))} />
              </div>
              <small className="text-muted d-block mb-2">
                Se exportarán {filteredAndSortedExtrato.length} registro(s) según los filtros aplicados. Fecha, Motivo, Movimiento y Total siempre se incluyen.
              </small>
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowExportModal(false)}>Cancelar</CButton>
          {!exportPwOk ? (
            <CButton color="primary" onClick={confirmExportPw}><CIcon icon={cilLockUnlocked} className="me-2" />Continuar</CButton>
          ) : (
            <>
              <CButton color="success" onClick={exportExcel} disabled={!Object.values(exportCols).some(Boolean)} style={{ color: 'white' }}>
                <CIcon icon={cilCloudDownload} className="me-2" />Excel
              </CButton>
              <CButton color="danger" onClick={exportPDF} disabled={!Object.values(exportCols).some(Boolean)} style={{ color: 'white' }}>
                <CIcon icon={cilCloudDownload} className="me-2" />PDF
              </CButton>
            </>
          )}
        </CModalFooter>
      </CModal>

      {/* ── Modal: per-field unlock ── */}
      <CModal visible={showFieldUnlockModal} onClose={() => setShowFieldUnlockModal(false)} alignment="center" backdrop="static" keyboard={false}>
        <CModalHeader closeButton={false}>
          <CModalTitle className="d-flex align-items-center"><CIcon icon={cilPencil} className="text-warning me-2" size="lg" />Editar campo</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p className="mb-3">Ingresa la contraseña para editar <strong>{fieldUnlockTarget?.label}</strong>:</p>
          <CFormInput type="password" autoComplete="new-password" value={fieldUnlockPassword}
            onChange={e => { setFieldUnlockPassword(e.target.value); setFieldUnlockError(''); }}
            onKeyDown={e => { if (e.key === 'Enter') confirmFieldUnlock(); }} invalid={!!fieldUnlockError} />
          {fieldUnlockError && <div className="text-danger mt-2 small">{fieldUnlockError}</div>}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowFieldUnlockModal(false)}>Cancelar</CButton>
          <CButton color="warning" onClick={confirmFieldUnlock}><CIcon icon={cilLockUnlocked} className="me-2" />Desbloquear</CButton>
        </CModalFooter>
      </CModal>

      {/* ── Modal: scheme change password ── */}
      <CModal visible={showSchemePasswordModal} onClose={() => setShowSchemePasswordModal(false)} alignment="center" backdrop="static" keyboard={false}>
        <CModalHeader closeButton={false}>
          <CModalTitle className="d-flex align-items-center"><CIcon icon={cilLockLocked} className="text-warning me-2" size="lg" />Cambiar esquema</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p className="mb-3">El esquema está bloqueado. Ingresa la contraseña para modificar:</p>
          <CFormInput type="password" autoComplete="new-password" value={schemePasswordInput}
            onChange={e => { setSchemePasswordInput(e.target.value); setSchemePasswordError(''); }}
            onKeyDown={e => { if (e.key === 'Enter') confirmSchemeChange(); }} invalid={!!schemePasswordError} />
          {schemePasswordError && <div className="text-danger mt-2 small">{schemePasswordError}</div>}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowSchemePasswordModal(false)}>Cancelar</CButton>
          <CButton color="warning" onClick={confirmSchemeChange}><CIcon icon={cilLockUnlocked} className="me-2" />Cambiar</CButton>
        </CModalFooter>
      </CModal>

      {/* ── Modal: date picker ── */}
      <CModal visible={showDateModal} onClose={() => setShowDateModal(false)} alignment="center" backdrop="static">
        <CModalHeader>
          <CModalTitle>Fecha de pago — <span style={{ color: 'var(--cui-primary)' }}>{dateModalInfo.label}</span></CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CFormLabel className="mb-1">Selecciona la fecha en que se realizó el pago:</CFormLabel>
          <CFormInput type="date" value={dateModalInfo.fecha} autoFocus
            onChange={e => setDateModalInfo(p => ({ ...p, fecha: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter' && dateModalInfo.fecha) confirmDateModal(); }} />
          <div className="mt-3 p-2 rounded" style={{ background: 'color-mix(in srgb, var(--cui-primary) 8%, transparent)', border: '1px solid var(--cui-border-color)' }}>
            <small className="text-muted d-block">Valor que se registrará en Extrato Gastos</small>
            <strong style={{ color: parseFloat(dateModalInfo.valor) < 0 ? 'var(--cui-danger)' : 'var(--cui-primary)' }}>{fmt(dateModalInfo.valor)}</strong>
            <small className="d-block text-muted mt-1">Importe + bono transporte − penalización + reembolso</small>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowDateModal(false)}>Cancelar</CButton>
          <CButton color="primary" className="app-button" onClick={confirmDateModal} disabled={!dateModalInfo.fecha}>
            <CIcon icon={cilSave} className="me-2" />Confirmar pago
          </CButton>
        </CModalFooter>
      </CModal>

      {/* ── Modal: row unlock ── */}
      <CModal visible={showUnlockModal} onClose={() => setShowUnlockModal(false)} alignment="center" backdrop="static" keyboard={false}>
        <CModalHeader closeButton={false}>
          <CModalTitle className="d-flex align-items-center"><CIcon icon={cilPencil} className="text-warning me-2" size="lg" />Re-editar fila</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p className="mb-1">Para re-editar <strong>"{unlockTarget.label}"</strong> ingresa la contraseña de administrador:</p>
          <small className="text-muted d-block mb-3">El registro en Extrato Gastos se eliminará y la fila quedará editable nuevamente.</small>
          <CFormInput type="password" autoComplete="new-password" value={unlockPasswordInput}
            onChange={e => { setUnlockPasswordInput(e.target.value); setUnlockPasswordError(''); }}
            onKeyDown={e => { if (e.key === 'Enter') confirmUnlock(); }} invalid={!!unlockPasswordError} />
          {unlockPasswordError && <div className="text-danger mt-2 small">{unlockPasswordError}</div>}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowUnlockModal(false)}>Cancelar</CButton>
          <CButton color="warning" onClick={confirmUnlock}><CIcon icon={cilLockUnlocked} className="me-2" />Desbloquear</CButton>
        </CModalFooter>
      </CModal>

      {/* ── Modal: delete password ── */}
      <CModal visible={showDeletePasswordModal} onClose={handleDeletePasswordModalClose} alignment="center" backdrop="static" keyboard={false}>
        <CModalHeader closeButton={false}>
          <CModalTitle className="d-flex align-items-center"><CIcon icon={cilLockLocked} className="text-danger me-2" size="lg" />Autorización requerida</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p className="mb-1">Ingresa la contraseña para eliminar <strong>"{deleteTarget.label}"</strong>:</p>
          {deleteTarget.isAuto && <small className="text-warning d-block mb-2">⚠ Esta entrada fue generada automáticamente. Eliminarla también desbloqueará la fila correspondiente.</small>}
          <CFormInput type="password" autoComplete="new-password" value={deletePasswordInput}
            onChange={e => { setDeletePasswordInput(e.target.value); setDeletePasswordError(''); }}
            onKeyDown={e => { if (e.key === 'Enter') handleDeletePasswordSubmit(); }} invalid={!!deletePasswordError} />
          {deletePasswordError && <div className="text-danger mt-2 small">{deletePasswordError}</div>}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={handleDeletePasswordModalClose}>Cancelar</CButton>
          <CButton color="danger" onClick={handleDeletePasswordSubmit} style={{ color: 'white' }}><CIcon icon={cilTrash} className="me-2" />Continuar</CButton>
        </CModalFooter>
      </CModal>

      {/* ── Modal: delete confirmation ── */}
      <CModal visible={showDeleteModal} onClose={() => setShowDeleteModal(false)} alignment="center">
        <CModalHeader>
          <CModalTitle className="d-flex align-items-center"><CIcon icon={cilWarning} className="text-danger me-2" size="lg" />Confirmar eliminación</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p className="mb-0">¿Estás seguro de que deseas eliminar <strong>"{deleteTarget.label}"</strong>?</p>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</CButton>
          <CButton color="danger" onClick={executeDelete} style={{ color: 'white' }}><CIcon icon={cilTrash} className="me-2" />Eliminar</CButton>
        </CModalFooter>
      </CModal>

      {/* ── Modal: row comment ── */}
      <CModal visible={showCommentModal} onClose={() => setShowCommentModal(false)} alignment="center" size="lg">
        <CModalHeader>
          <CModalTitle className="d-flex align-items-center gap-2">
            <CIcon icon={cilDescription} className="text-secondary" size="lg" />
            Comentario — <span style={{ color: 'var(--cui-primary)' }}>{commentCtx.label}</span>
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {commentEditMode ? (
            <>
              <CFormLabel className="mb-1 small text-muted">Escribe un comentario o nota para esta etapa:</CFormLabel>
              <textarea
                className="form-control"
                rows={5}
                value={commentDraft}
                onChange={e => setCommentDraft(e.target.value)}
                placeholder="Comentario opcional…"
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            </>
          ) : (
            <>
              <div className="p-3 rounded mb-3" style={{ backgroundColor: 'var(--cui-tertiary-bg, #f8f9fa)', border: '1px solid var(--cui-border-color)', whiteSpace: 'pre-wrap', minHeight: '80px' }}>
                {rowComments[commentCtx.key] || <span className="text-muted fst-italic">Sin comentario</span>}
              </div>
              {!commentPwVisible ? (
                <CButton size="sm" color="warning" variant="outline"
                  onClick={() => { setCommentPwVisible(true); setCommentPw(''); setCommentPwError(''); }}>
                  <CIcon icon={cilPencil} className="me-1" size="sm" />Editar comentario
                </CButton>
              ) : (
                <div className="mt-2">
                  <CFormLabel className="small text-muted mb-1">Contraseña para editar:</CFormLabel>
                  <div className="d-flex gap-2">
                    <CFormInput type="password" size="sm" autoComplete="new-password"
                      value={commentPw} onChange={e => { setCommentPw(e.target.value); setCommentPwError(''); }}
                      onKeyDown={e => { if (e.key === 'Enter') confirmCommentUnlock(); }}
                      invalid={!!commentPwError} placeholder="Contraseña…" style={{ maxWidth: '220px' }} />
                    <CButton size="sm" color="warning" onClick={confirmCommentUnlock}>Confirmar</CButton>
                    <CButton size="sm" color="secondary" variant="ghost" onClick={() => setCommentPwVisible(false)}>Cancelar</CButton>
                  </div>
                  {commentPwError && <div className="text-danger small mt-1">{commentPwError}</div>}
                </div>
              )}
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowCommentModal(false)}>Cerrar</CButton>
          {commentEditMode && (
            <CButton color="primary" className="app-button" onClick={saveComment}>
              <CIcon icon={cilSave} className="me-2" />Guardar comentario
            </CButton>
          )}
        </CModalFooter>
      </CModal>

    </CContainer>
  );
};

export default PaymentsGestForm;