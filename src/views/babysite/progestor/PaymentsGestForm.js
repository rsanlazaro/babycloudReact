// src/views/pages/programs/PaymentsGestForm.js
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CCard, CCardBody, CCardHeader, CCol, CContainer, CRow,
  CButton, CFormInput, CFormSelect, CFormLabel, CFormCheck,
  CAlert, CTable, CTableHead, CTableRow, CTableHeaderCell,
  CTableBody, CTableDataCell, CModal, CModalHeader, CModalTitle,
  CModalBody, CModalFooter, CBadge, CSpinner, CAccordion, CAccordionItem,
  CAccordionHeader, CAccordionBody,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilArrowLeft, cilSave, cilPlus, cilTrash, cilWarning, cilLockLocked, cilLockUnlocked, cilChevronBottom } from '@coreui/icons';
import api from '../../../services/api';
import { useBillsAuth } from '../../../context/BillsAuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// NumInput — defined OUTSIDE component to avoid React remount / focus loss
// ─────────────────────────────────────────────────────────────────────────────
const NumInput = ({ value, onChange, placeholder = '', disabled = false, width = '110px' }) => (
  <CFormInput
    type="number" size="sm" className="no-spinners"
    style={{ width }} value={value} onChange={onChange}
    placeholder={placeholder} disabled={disabled}
  />
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
  { id: 'sdg16', concepto: '16 SDG', schemeImporte: { '375000': 20000, '400000': 15000 }, bonoTransporte: 500, section: 3 },
  { id: 'sdg20', concepto: '20 SDG', importe: 20000, bonoTransporte: 500, section: 3, triggersT1Bonus: true },
  { id: 'sdg22', concepto: '22 SDG', importe: 20000, bonoTransporte: 500, section: 3 },
  { id: 'sdg26', concepto: '26 SDG', importe: 20000, bonoTransporte: 500, section: 3 },
  { id: 'sdg32', concepto: '32 SDG', importe: 24000, bonoTransporte: 500, section: 3 },
  { id: 'sdg34', concepto: '34 SDG', importe: null,  bonoTransporte: 500, section: 3 },
  { id: 'sdg35', concepto: '35 SDG', importe: null,  bonoTransporte: 500, section: 3 },
  { id: 'sdg36', concepto: '36 SDG', importe: 24000, bonoTransporte: 650, section: 3, hasReached: true, triggersSDG36Bonus: true },
  { id: 'sdg37', concepto: '37 SDG', importe: null,  schemeBono: { '375000': 800, '400000': 850 }, section: 3 },
  { id: 'sdg38', concepto: '38 SDG', importe: null,  bonoTransporte: 1000, section: 3 },
];

const BG_CONDITIONS = [
  { id: 'puntualidad',            label: 'Puntualidad',             amount: 1500 },
  { id: 'tresReagendamientos',    label: '3 Reagendamientos',       amount: 1500 },
  { id: 'tresInasistencias',      label: '3 Inasistencias',         amount: 2000 },
  { id: 'seguimientoPsicologico', label: 'Seguimiento psicológico', amount: 5000 },
  { id: 'seguimientoMedico',      label: 'Seguimiento médico',      amount: 5000 },
  { id: 'tresPenalizaciones',     label: '3 Penalizaciones',        amount: 5000 },
];
const BG_MAX = 20000;

const PUERPERIO_ROWS = [
  { id: 'puerperio1', concepto: 'Puerperio 1 - Nacimiento',        calculatedP1: true },
  { id: 'puerperio2', concepto: 'Puerperio 2 - Firma de registro', schemeBased: true  },
  { id: 'puerperio3', concepto: 'Puerperio 3 - Salida de IPs',     schemeBased: true  },
];

const EXTRATO_MOTIVOS = [
  'Reembolso', 'Bonificación', 'Pago extraordinario', 'Adelanto', 'Otro',
];

const UNLOCK_PASSWORD = 'adm@bbcloud10';
const SCHEME_PASSWORD = 'adm@bbcloud1';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const fmt = (v) => {
  if (v === null || v === undefined || v === '') return '-';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(v);
};
const getRowImporte = (row, sv) => row.schemeImporte ? (row.schemeImporte[sv] ?? null) : (row.importe ?? null);
const getRowBono    = (row, sv) => row.schemeBono    ? (row.schemeBono[sv]    ?? 0)    : (row.bonoTransporte ?? 0);

const computeParcialidades = (n, total) => {
  const safeTotal  = Math.max(0, total || 0);
  if (n <= 1) return [safeTotal];
  const last       = 4500;
  const distribute = Math.max(0, safeTotal - last);
  if (n === 2) return [distribute, last];
  const count      = n - 1;
  const perRaw     = distribute / count;
  const perRounded = Math.round(perRaw / 500) * 500;
  const others     = Array(count - 1).fill(perRounded);
  const lastOther  = Math.max(0, distribute - perRounded * (count - 1));
  return [...others, lastOther, last];
};

const initRS  = () => ({ penalizacion: '', reembolso: '', completed: false });
const initFRS = () => {
  const s = {};
  FIXED_ROWS.forEach(r => { s[r.id] = { ...initRS(), ...(r.hasReached ? { reached: false } : {}) }; });
  return s;
};
const initPS  = () => { const s = {}; PUERPERIO_ROWS.forEach(r => { s[r.id] = initRS(); }); return s; };
const initT   = () => Array.from({ length: 6 }, (_, i) => ({ id: i + 1, penalizacion: '', reembolso: '', completed: false, successful: false }));
const initBG  = () => ({ puntualidad: false, tresReagendamientos: false, tresInasistencias: false, seguimientoPsicologico: false, seguimientoMedico: false, tresPenalizaciones: false, extra: '' });
const initBS  = () => ({ transfer1: initRS(), vih: initRS(), gemelar: initRS() });
const initAyudaState = () => ({ penalizacion: '', reembolso: '', completed: false });

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const PaymentsGestForm = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { authenticateBills } = useBillsAuth();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [alert,   setAlert]   = useState({ show: false, type: '', message: '' });

  const [formData, setFormData] = useState({
    gesca: '', ip: '', banco: '', clabe: '', country: '',
    insurance: '', policy: '', manager: '', fum: '',
    giro_semana: '', scheme_value: '375000', status: 'active',
  });

  const [schemeLocked, setSchemeLocked] = useState(false);
  const [showSchemePasswordModal, setShowSchemePasswordModal] = useState(false);
  const [schemePasswordInput, setSchemePasswordInput] = useState('');
  const [schemePasswordError, setSchemePasswordError] = useState('');

  const [transferencias,  setTransferencias]  = useState(initT());
  const [rowStates,       setRowStates]       = useState(initFRS());
  const [puerperioStates, setPuerperioStates] = useState(initPS());
  const [bonoVIH,         setBonoVIH]         = useState(false);
  const [bonoGemelar,     setBonoGemelar]     = useState(false);
  const [bonoStates,      setBonoStates]      = useState(initBS());
  const [bgConditions,    setBgConditions]    = useState(initBG());
  // ── Buena Gestante pago-completado state ──────────────────────────────────
  const [bgState,         setBgState]         = useState(initRS());
  const [parcCount,       setParcCount]       = useState(1);
  const [parcCompleted,   setParcCompleted]   = useState([false, false, false, false]);
  const [ayudaMaternidad, setAyudaMaternidad] = useState(false);
  const [ayudaAmount,     setAyudaAmount]     = useState('');
  const [ayudaState,      setAyudaState]      = useState(initAyudaState());
  const [extratoGastos,   setExtratoGastos]   = useState([]);
  const [newExtrato,      setNewExtrato]      = useState({ fecha: '', motivo: '', valor: '' });
  const [extratoAlert,    setExtratoAlert]    = useState({ show: false, type: '', message: '' });

  const [showDeleteModal,         setShowDeleteModal]         = useState(false);
  const [deleteTarget,            setDeleteTarget]            = useState({ type: '', id: null, label: '', autoKey: '', isAuto: false });
  const [showDeletePasswordModal, setShowDeletePasswordModal] = useState(false);
  const [deletePasswordInput,     setDeletePasswordInput]     = useState('');
  const [deletePasswordError,     setDeletePasswordError]     = useState('');

  const [showDateModal, setShowDateModal] = useState(false);
  const [dateModalInfo, setDateModalInfo] = useState({
    label: '', autoKey: '', category: 'scheme',
    fecha: new Date().toISOString().split('T')[0],
    valor: 0, confirm: null,
  });

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

  // ── Calculations ──────────────────────────────────────────────────────────

  const sv = formData.scheme_value;

  const visibleTransferencias = useMemo(() => {
    const idx = transferencias.findIndex(t => t.successful);
    return idx === -1 ? transferencias : transferencias.slice(0, idx + 1);
  }, [transferencias]);

  const transferenciasTotal = useMemo(
    () => transferencias.filter(t => t.successful).length * 1000, [transferencias]);

  const schemeValue = useMemo(() => parseFloat(formData.scheme_value) || 375000, [formData.scheme_value]);

  const p1Amount = useMemo(() => 50000, []);
  const p2Amount = useMemo(() => sv === '375000' ?  50000 :  55000, [sv]);

  const ayudaAmountNum = useMemo(() => (ayudaMaternidad ? parseFloat(ayudaAmount) || 0 : 0), [ayudaMaternidad, ayudaAmount]);
  const p3BaseAmount = useMemo(() => sv === '375000' ? 100000 : 120000, [sv]);
  const p3Amount = useMemo(() => Math.max(0, p3BaseAmount - ayudaAmountNum), [p3BaseAmount, ayudaAmountNum]);

  const t1Exitosa    = useMemo(() => transferencias[0]?.successful === true, [transferencias]);
  const sdg36Reached = useMemo(() => rowStates.sdg36?.reached === true, [rowStates]);

  const sdg20Completed = useMemo(() => rowStates.sdg20?.completed === true, [rowStates]);
  const sdg36Completed = useMemo(() => rowStates.sdg36?.completed === true, [rowStates]);

  const schemePhasesTotal = useMemo(() => {
    let t = transferenciasTotal + p1Amount;
    FIXED_ROWS.forEach(r => {
      const imp = getRowImporte(r, sv);
      if (imp !== null) t += imp;
    });
    t += p2Amount + p3Amount + BG_MAX;
    return t;
  }, [sv, transferenciasTotal, p1Amount, p2Amount, p3Amount]);

  const ultimasFirmasTotal = useMemo(
    () => Math.max(0, schemeValue - schemePhasesTotal),
    [schemeValue, schemePhasesTotal]
  );

  const vihBonus     = useMemo(() => bonoVIH     ? 50000 : 0, [bonoVIH]);
  const gemelarBonus = useMemo(() => bonoGemelar ? 20000 : 0, [bonoGemelar]);

  const t1BonusGross  = useMemo(() => t1Exitosa ? 5000 : 0, [t1Exitosa]);
  const sdg36Bonus    = useMemo(() => (t1Exitosa && sdg36Reached) ? 5000 : 0, [t1Exitosa, sdg36Reached]);
  const t1Penalty     = useMemo(() => (t1Exitosa && !sdg36Reached) ? -5000 : 0, [t1Exitosa, sdg36Reached]);
  const t1NetBonus    = useMemo(() => t1BonusGross + sdg36Bonus + t1Penalty, [t1BonusGross, sdg36Bonus, t1Penalty]);

  const bgExtraBonus = useMemo(() => parseFloat(bgConditions.extra) || 0, [bgConditions]);

  const totalBonos = useMemo(
    () => t1NetBonus + vihBonus + gemelarBonus + bgExtraBonus,
    [t1NetBonus, vihBonus, gemelarBonus, bgExtraBonus]
  );

  const bgTotal = useMemo(() => {
    let t = 0;
    BG_CONDITIONS.forEach(c => { if (bgConditions[c.id]) t += c.amount; });
    return t;
  }, [bgConditions]);
  const bgDiscounted = useMemo(() => Math.max(0, BG_MAX - bgTotal), [bgTotal]);

  const bonoTransporteTotal = useMemo(() => {
    let t = 0;
    FIXED_ROWS.forEach(r => { t += getRowBono(r, sv) || 0; });
    return t;
  }, [sv]);

  const totalPenalizaciones = useMemo(() => {
    let t = 0;
    visibleTransferencias.forEach(x => { t += parseFloat(x.penalizacion) || 0; });
    FIXED_ROWS.forEach(r     => { t += parseFloat(rowStates[r.id]?.penalizacion)       || 0; });
    PUERPERIO_ROWS.forEach(r => { t += parseFloat(puerperioStates[r.id]?.penalizacion) || 0; });
    ['transfer1', 'vih', 'gemelar'].forEach(k => { t += parseFloat(bonoStates[k]?.penalizacion) || 0; });
    t += parseFloat(ayudaState.penalizacion) || 0;
    t += parseFloat(bgState.penalizacion)    || 0;  // ── BG penalizacion
    return t;
  }, [visibleTransferencias, rowStates, puerperioStates, bonoStates, ayudaState, bgState]);

  const effectiveSchemeValue = useMemo(
    () => schemeValue - bgDiscounted - totalPenalizaciones,
    [schemeValue, bgDiscounted, totalPenalizaciones]
  );

  const grandTotal = useMemo(
    () => effectiveSchemeValue + bonoTransporteTotal + totalBonos,
    [effectiveSchemeValue, bonoTransporteTotal, totalBonos]
  );

  const pagosRealizados = useMemo(
    () => extratoGastos.reduce((s, e) => s + (parseFloat(e.valor) || 0), 0),
    [extratoGastos]
  );
  const montoRestante = useMemo(() => grandTotal - pagosRealizados, [grandTotal, pagosRealizados]);

  const schemeValuePaid = useMemo(
    () => extratoGastos.filter(e => e.category === 'scheme').reduce((s, e) => s + (parseFloat(e.valor) || 0), 0),
    [extratoGastos]
  );
  const schemeValueRemaining    = useMemo(() => effectiveSchemeValue - schemeValuePaid, [effectiveSchemeValue, schemeValuePaid]);

  const bonoTransportePaid      = useMemo(
    () => extratoGastos.filter(e => e.category === 'bonoTransporte').reduce((s, e) => s + (parseFloat(e.valor) || 0), 0),
    [extratoGastos]
  );
  const bonoTransporteRemaining = useMemo(() => bonoTransporteTotal - bonoTransportePaid, [bonoTransporteTotal, bonoTransportePaid]);

  const bonosTotalesPaid        = useMemo(
    () => extratoGastos.filter(e => e.category === 'bono').reduce((s, e) => s + (parseFloat(e.valor) || 0), 0),
    [extratoGastos]
  );
  const bonosTotalesRemaining   = useMemo(() => totalBonos - bonosTotalesPaid, [totalBonos, bonosTotalesPaid]);
  const grandTotalRemaining     = useMemo(() => grandTotal - pagosRealizados, [grandTotal, pagosRealizados]);

  const getPuerperioImporte = (rowId) => {
    if (rowId === 'puerperio1') return p1Amount;
    if (rowId === 'puerperio2') return p2Amount;
    if (rowId === 'puerperio3') return p3Amount;
    return 0;
  };

  // ── Data fetch ────────────────────────────────────────────────────────────
  useEffect(() => { if (isEditMode) fetchPayment(); }, [id]);

  useEffect(() => {
    setExtratoGastos(prev => {
      let next = prev.filter(e => e.autoKey !== 'bonus_t1' && e.autoKey !== 'bonus_sdg36' && e.autoKey !== 'penalty_sdg36');

      if (t1Exitosa && sdg20Completed) {
        const sdg20Entry = extratoGastos.find(e => e.autoKey === 'fixed_sdg20');
        const fecha = sdg20Entry?.fecha || new Date().toISOString().split('T')[0];
        next = [...next, {
          id: `auto_bonus_t1_${Date.now()}`, fecha,
          movimiento: 'Bono T1 exitosa', motivo: 'Bono Transfer 1',
          valor: 5000, autoKey: 'bonus_t1', category: 'bono', isAuto: true,
        }];
      }

      if (t1Exitosa && sdg36Completed) {
        const sdg36Entry = extratoGastos.find(e => e.autoKey === 'fixed_sdg36');
        const fecha = sdg36Entry?.fecha || new Date().toISOString().split('T')[0];
        if (sdg36Reached) {
          next = [...next, {
            id: `auto_bonus_sdg36_${Date.now()}`, fecha,
            movimiento: 'Bono SDG 36 alcanzado', motivo: 'Bono adicional SDG36',
            valor: 5000, autoKey: 'bonus_sdg36', category: 'bono', isAuto: true,
          }];
        } else {
          next = [...next, {
            id: `auto_penalty_sdg36_${Date.now()}`, fecha,
            movimiento: 'Penalización SDG 36 no alcanzado', motivo: 'Penalización T1',
            valor: -5000, autoKey: 'penalty_sdg36', category: 'bono', isAuto: true,
          }];
        }
      }

      return next;
    });
  }, [t1Exitosa, sdg36Reached, sdg20Completed, sdg36Completed]);

  useEffect(() => {
    if (isEditMode) setSchemeLocked(true);
  }, [isEditMode]);

  const fetchPayment = async () => {
    try {
      setLoading(true);
      const res  = await api.get(`/api/payments-gest/${id}`, { withCredentials: true });
      const data = res.data;
      setFormData({
        gesca: data.gesca || '', ip: data.ip || '', banco: data.banco || '',
        clabe: data.clabe || '', country: data.country || '',
        insurance: data.insurance || '', policy: data.policy || '',
        manager: data.manager || '', fum: data.fum ? data.fum.split('T')[0] : '',
        giro_semana: data.giro_semana || '',
        scheme_value: String(data.scheme_value || '375000'), status: data.status || 'active',
      });
      if (data.transferencias)         setTransferencias(data.transferencias);
      if (data.row_states)             setRowStates(data.row_states);
      if (data.puerperio_states)       setPuerperioStates(data.puerperio_states);
      if (data.bono_vih !== undefined)      setBonoVIH(data.bono_vih);
      if (data.bono_gemelar !== undefined)  setBonoGemelar(data.bono_gemelar);
      if (data.bono_states)    setBonoStates(data.bono_states);
      if (data.bg_conditions)  setBgConditions(data.bg_conditions);
      if (data.bg_state)       setBgState(data.bg_state);          // ── restore BG state
      if (data.parc_count)     setParcCount(data.parc_count);
      if (data.parc_completed) setParcCompleted(data.parc_completed);
      if (data.extrato_gastos) setExtratoGastos(data.extrato_gastos);
      if (data.ayuda_maternidad !== undefined) setAyudaMaternidad(data.ayuda_maternidad);
      if (data.ayuda_amount !== undefined) setAyudaAmount(String(data.ayuda_amount || ''));
      if (data.ayuda_state) setAyudaState(data.ayuda_state);
    } catch {
      setAlert({ show: true, type: 'danger', message: 'Error al cargar el esquema de pago' });
    } finally {
      setLoading(false);
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleFormChange     = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSchemeChange = (newValue) => {
    if (schemeLocked) {
      setSchemePasswordInput('');
      setSchemePasswordError('');
      setShowSchemePasswordModal(true);
    } else {
      setFormData(p => ({ ...p, scheme_value: newValue }));
    }
  };

  const confirmSchemeChange = () => {
    if (schemePasswordInput !== SCHEME_PASSWORD) {
      setSchemePasswordError('Contraseña incorrecta');
      return;
    }
    const newValue = formData.scheme_value === '375000' ? '400000' : '375000';
    setFormData(p => ({ ...p, scheme_value: newValue }));
    setShowSchemePasswordModal(false);
    setSchemePasswordInput('');
    setSchemePasswordError('');
    authenticateBills();
  };

  const updateTransferencia  = (i, f, v) => setTransferencias(p => p.map((t, idx) => idx === i ? { ...t, [f]: v } : t));
  const updateRowState       = (rid, f, v) => setRowStates(p => ({ ...p, [rid]: { ...p[rid], [f]: v } }));
  const updatePuerperioState = (rid, f, v) => setPuerperioStates(p => ({ ...p, [rid]: { ...p[rid], [f]: v } }));
  const updateBonoState      = (k, f, v)   => setBonoStates(p => ({ ...p, [k]: { ...p[k], [f]: v } }));
  const updateBgCondition    = (k, v)      => setBgConditions(p => ({ ...p, [k]: v }));
  const updateBgState        = (f, v)      => setBgState(p => ({ ...p, [f]: v }));
  const updateAyudaState     = (f, v)      => setAyudaState(p => ({ ...p, [f]: v }));

  const handleParcCountChange = (n) => {
    setParcCount(n);
    setParcCompleted(prev => prev.map((v, i) => i >= n ? false : v));
  };

  const openDateModal = ({ autoKey, label, importe, bonoVal, penalizacion, reembolso, category, commitTrue }) => {
    const valor = (importe || 0) + (bonoVal || 0) - (parseFloat(penalizacion) || 0) + (parseFloat(reembolso) || 0);
    setDateModalInfo({ label, autoKey, valor, category, fecha: new Date().toISOString().split('T')[0], confirm: commitTrue });
    setShowDateModal(true);
  };

  const confirmDateModal = () => {
    const { label, autoKey, fecha, valor, category, confirm } = dateModalInfo;
    setExtratoGastos(prev => [
      ...prev.filter(e => e.autoKey !== autoKey),
      { id: `auto_${autoKey}_${Date.now()}`, fecha, valor, autoKey, category, movimiento: label, motivo: 'Pago de esquema', isAuto: true },
    ]);
    confirm && confirm();
    setShowDateModal(false);
  };

  const cancelDateModal = () => setShowDateModal(false);

  const openUnlockModal = ({ autoKey, label, uncomplete }) => {
    setUnlockTarget({ autoKey, label, uncomplete });
    setUnlockPasswordInput('');
    setUnlockPasswordError('');
    setShowUnlockModal(true);
  };

  const confirmUnlock = () => {
    if (unlockPasswordInput !== UNLOCK_PASSWORD) {
      setUnlockPasswordError('Contraseña incorrecta');
      return;
    }
    setExtratoGastos(prev => prev.filter(e => e.autoKey !== unlockTarget.autoKey));
    unlockTarget.uncomplete && unlockTarget.uncomplete();
    setShowUnlockModal(false);
    setUnlockPasswordInput('');
    setUnlockPasswordError('');
  };

  const addExtratoEntry = () => {
    if (!newExtrato.fecha || !newExtrato.motivo || !newExtrato.valor) {
      setExtratoAlert({ show: true, type: 'warning', message: 'Completa todos los campos' });
      setTimeout(() => setExtratoAlert({ show: false }), 4000);
      return;
    }
    setExtratoGastos(p => [...p, { id: Date.now(), ...newExtrato, valor: parseFloat(newExtrato.valor), isAuto: false, category: 'manual', movimiento: 'pago gestante' }]);
    setNewExtrato({ fecha: '', motivo: '', valor: '' });
  };

  const confirmDeleteExtrato = (entry) => {
    setDeleteTarget({
      type:    'extrato',
      id:      entry.id,
      label:   entry.movimiento || entry.motivo || 'entrada',
      autoKey: entry.autoKey || null,
      isAuto:  entry.isAuto || false,
    });
    setDeletePasswordInput('');
    setDeletePasswordError('');
    setShowDeletePasswordModal(true);
  };

  const uncompleteByAutoKey = (autoKey) => {
    if (!autoKey) return;
    if (autoKey.startsWith('transferencia_')) {
      const tId = parseInt(autoKey.split('_')[1]);
      const idx = transferencias.findIndex(t => t.id === tId);
      if (idx !== -1) updateTransferencia(idx, 'completed', false);
    } else if (autoKey.startsWith('fixed_')) {
      updateRowState(autoKey.replace('fixed_', ''), 'completed', false);
    } else if (autoKey.startsWith('puerperio_')) {
      updatePuerperioState(autoKey.replace('puerperio_', ''), 'completed', false);
    } else if (autoKey === 'bono_vih') {
      updateBonoState('vih', 'completed', false);
    } else if (autoKey === 'bono_gemelar') {
      updateBonoState('gemelar', 'completed', false);
    } else if (autoKey.startsWith('parcialidad_')) {
      const i = parseInt(autoKey.split('_')[1]);
      setParcCompleted(prev => prev.map((v, j) => j === i ? false : v));
    } else if (autoKey === 'ayuda_maternidad') {
      updateAyudaState('completed', false);
    } else if (autoKey === 'buena_gestante') {
      updateBgState('completed', false);
    }
  };

  const handleDeletePasswordSubmit = () => {
    if (deletePasswordInput !== UNLOCK_PASSWORD) {
      setDeletePasswordError('Contraseña incorrecta');
      return;
    }
    authenticateBills();
    setShowDeletePasswordModal(false);
    setDeletePasswordInput('');
    setDeletePasswordError('');
    setShowDeleteModal(true);
  };

  const handleDeletePasswordModalClose = () => {
    setShowDeletePasswordModal(false);
    setDeletePasswordInput('');
    setDeletePasswordError('');
    setDeleteTarget({ type: '', id: null, label: '', autoKey: '', isAuto: false });
  };

  const executeDelete = () => {
    if (deleteTarget.type === 'extrato') {
      setExtratoGastos(p => p.filter(e => e.id !== deleteTarget.id));
      if (deleteTarget.isAuto && deleteTarget.autoKey) {
        uncompleteByAutoKey(deleteTarget.autoKey);
      }
    }
    setShowDeleteModal(false);
    setDeleteTarget({ type: '', id: null, label: '', autoKey: '', isAuto: false });
  };

  const savePayment = async () => {
    if (!formData.gesca || !formData.ip) {
      setAlert({ show: true, type: 'danger', message: 'Completa los campos obligatorios: GESCA e IP' });
      return;
    }
    setSaving(true);
    const payload = {
      ...formData, scheme_value: parseFloat(formData.scheme_value),
      transferencias, row_states: rowStates, puerperio_states: puerperioStates,
      bono_vih: bonoVIH, bono_gemelar: bonoGemelar, bono_states: bonoStates,
      bg_conditions: bgConditions, bg_state: bgState,   // ── include BG state
      parc_count: parcCount, parc_completed: parcCompleted,
      ayuda_maternidad: ayudaMaternidad, ayuda_amount: parseFloat(ayudaAmount) || 0,
      ayuda_state: ayudaState,
      extrato_gastos: extratoGastos,
    };
    try {
      if (isEditMode) {
        await api.put(`/api/payments-gest/${id}`, payload, { withCredentials: true });
        setAlert({ show: true, type: 'success', message: 'Esquema actualizado correctamente' });
      } else {
        await api.post('/api/payments-gest', payload, { withCredentials: true });
        setAlert({ show: true, type: 'success', message: 'Esquema creado correctamente' });
        setSchemeLocked(true);
      }
      setTimeout(() => navigate('/progestor/payments-gest'), 1000);
    } catch (err) {
      setAlert({ show: true, type: 'danger', message: err.response?.data?.message || 'Error al guardar' });
    } finally {
      setSaving(false);
    }
  };

  // ── Shared styles ──────────────────────────────────────────────────────────
  const cs       = { verticalAlign: 'middle' };
  const hs       = { verticalAlign: 'middle', whiteSpace: 'nowrap' };
  const hsc      = { ...hs, textAlign: 'center' };
  const rowLocked  = { backgroundColor: 'color-mix(in srgb, var(--cui-success) 10%, transparent)' };
  const rowPrimary = { backgroundColor: 'color-mix(in srgb, var(--cui-primary) 12%, transparent)' };

  if (loading) {
    return (
      <CContainer className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <CSpinner color="primary" />
      </CContainer>
    );
  }

  const section2Rows = FIXED_ROWS.filter(r => r.section === 2);
  const section3Rows = FIXED_ROWS.filter(r => r.section === 3);
  const parcAmounts  = computeParcialidades(parcCount, ultimasFirmasTotal);

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

  const CompletedCell = ({ completed, autoKey, label, importe, bonoVal, penalizacion, reembolso, category, onCommitTrue, onUncomplete }) => (
    <CTableDataCell style={{ ...cs, textAlign: 'center' }}>
      <div className="d-flex align-items-center justify-content-center gap-1">
        <CFormCheck
          checked={completed}
          disabled={completed}
          onChange={() => {
            if (!completed) {
              openDateModal({ autoKey, label, importe: importe || 0, bonoVal: bonoVal || 0, penalizacion, reembolso, category, commitTrue: onCommitTrue });
            }
          }}
        />
        {completed && (
          <CButton
            size="sm" color="warning" variant="ghost"
            title="Clic para re-editar (requiere contraseña)"
            style={{ padding: '2px 6px' }}
            onClick={() => openUnlockModal({ autoKey, label, uncomplete: onUncomplete })}
          >
            <CIcon icon={cilLockLocked} size="sm" />
          </CButton>
        )}
      </div>
    </CTableDataCell>
  );

  const renderFixedRow = (row) => {
    const state  = rowStates[row.id] || initRS();
    const baseImp = getRowImporte(row, sv);
    const imp    = (row.id === 'sdg20' && t1Exitosa && baseImp !== null) ? baseImp + 5000 : baseImp;
    const bono   = getRowBono(row, sv);
    const locked = state.completed;
    return (
      <CTableRow key={row.id} style={locked ? rowLocked : undefined}>
        <CTableDataCell style={cs}>
          <strong>{row.concepto}</strong>
          {row.id === 'sdg20' && t1Exitosa && (
            <small className="d-block text-muted">$20,000 + $5,000 bono T1</small>
          )}
          {row.hasReached && (
            <div className="d-flex align-items-center mt-1 gap-2 flex-wrap">
              <CFormCheck checked={state.reached ?? false} disabled={locked} onChange={e => updateRowState(row.id, 'reached', e.target.checked)} />
              <small className="text-muted">¿Proceso llegó a SDG 36?</small>
              {t1Exitosa && state.reached && <CBadge color="primary" className="ms-1">+$10,000 bonos T1+SDG36</CBadge>}
              {t1Exitosa && !state.reached && <CBadge color="danger" className="ms-1">Penalización −$5,000 (bono neto: $0)</CBadge>}
              {!t1Exitosa && state.reached && <CBadge color="secondary" className="ms-1">SDG 36 alcanzado</CBadge>}
            </div>
          )}
        </CTableDataCell>
        <CTableDataCell style={cs}>
          {imp !== null
            ? <span className="fw-semibold" style={{ color: 'var(--cui-primary)' }}>{fmt(imp)}</span>
            : <span className="text-muted">—</span>}
        </CTableDataCell>
        <CTableDataCell style={cs}>
          {bono
            ? <span className="fw-semibold" style={{ color: 'var(--cui-primary)' }}>{fmt(bono)}</span>
            : <span className="text-muted">—</span>}
        </CTableDataCell>
        <CTableDataCell style={cs}><NumInput disabled={locked} value={state.penalizacion} onChange={e => updateRowState(row.id, 'penalizacion', e.target.value)} /></CTableDataCell>
        <CTableDataCell style={cs}><NumInput disabled={locked} value={state.reembolso}    onChange={e => updateRowState(row.id, 'reembolso',    e.target.value)} /></CTableDataCell>
        <CompletedCell
          completed={locked}
          autoKey={`fixed_${row.id}`}
          label={row.concepto}
          importe={imp} bonoVal={bono}
          penalizacion={state.penalizacion} reembolso={state.reembolso}
          category="scheme"
          onCommitTrue={() => updateRowState(row.id, 'completed', true)}
          onUncomplete={() => updateRowState(row.id, 'completed', false)}
        />
      </CTableRow>
    );
  };

  return (
    <CContainer fluid>
      <style>{`
        .no-spinners::-webkit-outer-spin-button,
        .no-spinners::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .no-spinners { -moz-appearance: textfield; }

        .form-check-input:checked {
          background-color: var(--cui-primary) !important;
          border-color:     var(--cui-primary) !important;
        }
        .form-check-input:focus {
          border-color: var(--cui-primary) !important;
          box-shadow: 0 0 0 0.25rem color-mix(in srgb, var(--cui-primary) 25%, transparent) !important;
        }

        .gest-table td, .gest-table th { vertical-align: middle !important; }

        /* ── Accordion headers: neutral gray, dark-mode compatible ──
           --cui-tertiary-bg is light gray in light mode and a dark tone
           in dark mode — no hardcoded colours needed. */
        .accordion-button,
        .accordion-button:not(.collapsed) {
          background-color: var(--cui-tertiary-bg, #f8f9fa) !important;
          color:            var(--cui-body-color)            !important;
          box-shadow:       none                             !important;
        }
        .accordion-button:hover {
          background-color: var(--cui-secondary-bg, #e9ecef) !important;
        }
        .accordion-button::after {
          filter: none !important;
        }

        .summary-table th {
          font-size: 0.8rem; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.04em; white-space: nowrap; padding: 0.6rem 1rem;
          background-color: color-mix(in srgb, var(--cui-primary) 15%, transparent);
          color: var(--cui-primary);
          border-bottom: 2px solid var(--cui-primary);
        }
        .summary-table td { font-size: 1rem; font-weight: 600; padding: 0.75rem 1rem; white-space: nowrap; }
        .summary-table .row-base td { color: var(--cui-primary); }
        .summary-table .row-actual td { font-style: italic; }

        .form-row-equal { display: grid; gap: 1rem; }
        .form-row-equal.cols-2 { grid-template-columns: repeat(2, 1fr); }
        .form-row-equal.cols-3 { grid-template-columns: repeat(3, 1fr); }
        .form-row-equal.cols-4 { grid-template-columns: repeat(4, 1fr); }
      `}</style>

      {alert.show && (
        <CAlert className="mx-5" color={alert.type} dismissible onClose={() => setAlert({ show: false })}>
          {alert.message}
        </CAlert>
      )}

      {/* Action bar */}
      <CRow className="mb-4 mx-5">
        <CCol>
          <CButton color="secondary" variant="outline" onClick={() => navigate('/progestor/payments-gest')} className="me-3">
            <CIcon icon={cilArrowLeft} className="me-2" />Volver a Esquemas
          </CButton>
          <CButton color="primary" className="app-button" onClick={savePayment} disabled={saving}>
            {saving
              ? <><CSpinner size="sm" className="me-2" />Guardando...</>
              : <><CIcon icon={cilSave} className="me-2" />{isEditMode ? 'Actualizar esquema' : 'Guardar esquema'}</>}
          </CButton>
        </CCol>
      </CRow>

      <CAccordion activeItemKey={1} alwaysOpen className="mx-5">

        {/* ═══ 1. Datos del programa ══════════════════════════════════════════ */}
        <CAccordionItem itemKey={1}>
          <CAccordionHeader>
            <strong>Datos del programa</strong>
          </CAccordionHeader>
          <CAccordionBody>
            <CRow className="mb-3">
              <CCol md={3}>
                <CFormLabel className="mb-1 small">Estado</CFormLabel>
                <CFormSelect name="status" value={formData.status} onChange={handleFormChange}>
                  {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={3}>
                <CFormLabel className="mb-1 small d-flex align-items-center gap-2">
                  Selección de programa
                  {schemeLocked && <CIcon icon={cilLockLocked} size="sm" className="text-warning" title="Bloqueado - requiere contraseña para cambiar" />}
                </CFormLabel>
                <div className="d-flex gap-2">
                  <CFormSelect
                    name="scheme_value"
                    value={formData.scheme_value}
                    onChange={(e) => handleSchemeChange(e.target.value)}
                    disabled={schemeLocked}
                  >
                    <option value="375000">$375,000</option>
                    <option value="400000">$400,000</option>
                  </CFormSelect>
                  {schemeLocked && (
                    <CButton
                      color="warning" variant="outline" size="sm"
                      onClick={() => { setSchemePasswordInput(''); setSchemePasswordError(''); setShowSchemePasswordModal(true); }}
                      title="Cambiar programa (requiere contraseña)"
                    >
                      <CIcon icon={cilLockLocked} />
                    </CButton>
                  )}
                </div>
              </CCol>
            </CRow>

            <div className="form-row-equal cols-2 mb-3">
              <div><CFormLabel className="mb-1 small">GESCA *</CFormLabel><CFormInput name="gesca" value={formData.gesca} onChange={handleFormChange} /></div>
              <div><CFormLabel className="mb-1 small">IP *</CFormLabel><CFormInput name="ip" value={formData.ip} onChange={handleFormChange} /></div>
            </div>
            <div className="form-row-equal cols-2 mb-3">
              <div><CFormLabel className="mb-1 small">Banco</CFormLabel><CFormInput name="banco" value={formData.banco} onChange={handleFormChange} /></div>
              <div><CFormLabel className="mb-1 small">Clabe</CFormLabel><CFormInput name="clabe" value={formData.clabe} onChange={handleFormChange} /></div>
            </div>
            <div className="form-row-equal cols-3 mb-3">
              <div><CFormLabel className="mb-1 small">País</CFormLabel><CFormInput name="country" value={formData.country} onChange={handleFormChange} /></div>
              <div><CFormLabel className="mb-1 small">Seguro</CFormLabel><CFormInput name="insurance" value={formData.insurance} onChange={handleFormChange} /></div>
              <div><CFormLabel className="mb-1 small">Póliza</CFormLabel><CFormInput name="policy" value={formData.policy} onChange={handleFormChange} /></div>
            </div>
            <div className="form-row-equal cols-3">
              <div><CFormLabel className="mb-1 small">Gestor</CFormLabel><CFormInput name="manager" value={formData.manager} onChange={handleFormChange} /></div>
              <div><CFormLabel className="mb-1 small">FUM</CFormLabel><CFormInput type="date" name="fum" value={formData.fum} onChange={handleFormChange} /></div>
              <div><CFormLabel className="mb-1 small">Giro de semana</CFormLabel><CFormInput name="giro_semana" value={formData.giro_semana} onChange={handleFormChange} /></div>
            </div>
          </CAccordionBody>
        </CAccordionItem>

        {/* ═══ Fase 1 — Transferencias ════════════════════════════════════════ */}
        <CAccordionItem itemKey={2}>
          <CAccordionHeader>
            <strong>Fase 1 / Transferencias &gt; Latido SDG8</strong>
          </CAccordionHeader>
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
                    <CTableHeaderCell style={hsc}>Exitosa</CTableHeaderCell>
                    <CTableHeaderCell style={hsc}>Pago completado</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {visibleTransferencias.map((trans, idx) => {
                    const locked   = trans.completed;
                    const autoKey  = `transferencia_${trans.id}`;
                    return (
                      <CTableRow key={trans.id} style={locked ? rowLocked : trans.successful ? rowPrimary : undefined}>
                        <CTableDataCell style={cs}>
                          <strong>Transferencia {trans.id}</strong>
                          {trans.successful && <CBadge color="primary" className="ms-2">Exitosa</CBadge>}
                        </CTableDataCell>
                        <CTableDataCell style={cs}>
                          <span className="fw-semibold" style={{ color: 'var(--cui-primary)' }}>{fmt(1000)}</span>
                        </CTableDataCell>
                        <CTableDataCell style={cs}><span className="text-muted">—</span></CTableDataCell>
                        <CTableDataCell style={cs}><NumInput disabled={locked} value={trans.penalizacion} onChange={e => updateTransferencia(idx, 'penalizacion', e.target.value)} /></CTableDataCell>
                        <CTableDataCell style={cs}><NumInput disabled={locked} value={trans.reembolso}    onChange={e => updateTransferencia(idx, 'reembolso',    e.target.value)} /></CTableDataCell>
                        <CTableDataCell style={{ ...cs, textAlign: 'center' }}>
                          <CFormCheck checked={trans.successful} disabled={locked} onChange={e => updateTransferencia(idx, 'successful', e.target.checked)} />
                        </CTableDataCell>
                        <CompletedCell
                          completed={locked} autoKey={autoKey} label={`Transferencia ${trans.id}`}
                          importe={1000} bonoVal={0}
                          penalizacion={trans.penalizacion} reembolso={trans.reembolso}
                          category="scheme"
                          onCommitTrue={() => updateTransferencia(idx, 'completed', true)}
                          onUncomplete={() => updateTransferencia(idx, 'completed', false)}
                        />
                      </CTableRow>
                    );
                  })}
                </CTableBody>
              </CTable>
            </div>
          </CAccordionBody>
        </CAccordionItem>

        {/* ═══ Fase 2 ═══════════════════════════════════════════════════════ */}
        <CAccordionItem itemKey={3}>
          <CAccordionHeader>
            <strong>Fase 2 / Beta positiva &gt; SDG 10</strong>
          </CAccordionHeader>
          <CAccordionBody>
            <div className="table-responsive">
              <CTable hover striped className="gest-table">
                <CTableHead><TheadFull /></CTableHead>
                <CTableBody>{section2Rows.map(row => renderFixedRow(row))}</CTableBody>
              </CTable>
            </div>
          </CAccordionBody>
        </CAccordionItem>

        {/* ═══ Fases de pagos ════════════════════════════════════════════════ */}
        <CAccordionItem itemKey={4}>
          <CAccordionHeader>
            <strong>Fases de pagos &gt; Descripción del Esquema</strong>
          </CAccordionHeader>
          <CAccordionBody>
            <div className="table-responsive">
              <CTable hover striped className="gest-table">
                <CTableHead><TheadFull /></CTableHead>
                <CTableBody>{section3Rows.map(row => renderFixedRow(row))}</CTableBody>
              </CTable>
            </div>
          </CAccordionBody>
        </CAccordionItem>

        {/* ═══ Bonos adicionales ══════════════════════════════════════════════ */}
        <CAccordionItem itemKey={5}>
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
                  {/* Transfer 1 + SDG36 */}
                  {(() => {
                    const statusLabel = !t1Exitosa ? 'T1 no exitosa'
                      : sdg36Reached  ? 'T1 + SDG36 (+$10,000)'
                      :                 'T1 exitosa, SDG36 no alcanzado ($0 neto)';
                    const statusColor = !t1Exitosa ? 'secondary'
                      : sdg36Reached  ? 'primary'
                      :                 'danger';
                    return (
                      <CTableRow style={{ opacity: t1Exitosa ? 1 : 0.5 }}>
                        <CTableDataCell style={cs}>
                          <strong>Transfer 1 / SDG 36 (automático)</strong>
                          <small className="d-block text-muted">Aparece automáticamente al confirmar pago de SDG20 y SDG36</small>
                        </CTableDataCell>
                        <CTableDataCell style={cs}>
                          <span className="fw-semibold" style={{ color: t1NetBonus > 0 ? 'var(--cui-primary)' : t1NetBonus < 0 ? 'var(--cui-danger)' : undefined }}>
                            {t1Exitosa ? fmt(t1NetBonus) : '—'}
                          </span>
                        </CTableDataCell>
                        <CTableDataCell style={cs}><CBadge color={statusColor}>{statusLabel}</CBadge></CTableDataCell>
                        <CTableDataCell style={cs}><span className="text-muted small">Automático</span></CTableDataCell>
                        <CTableDataCell style={cs}><span className="text-muted small">Ver extrato</span></CTableDataCell>
                        <CTableDataCell style={{ ...cs, textAlign: 'center' }}><span className="text-muted small">—</span></CTableDataCell>
                      </CTableRow>
                    );
                  })()}
                  {/* VIH */}
                  {(() => {
                    const locked = bonoVIH && bonoStates.vih.completed;
                    return (
                      <CTableRow style={locked ? rowLocked : undefined}>
                        <CTableDataCell style={cs}>
                          <div className="d-flex align-items-center gap-2">
                            <CFormCheck checked={bonoVIH} disabled={bonoStates.vih.completed} onChange={e => setBonoVIH(e.target.checked)} />
                            <strong>VIH</strong>
                          </div>
                        </CTableDataCell>
                        <CTableDataCell style={cs}><span className="fw-semibold" style={{ color: 'var(--cui-primary)' }}>{fmt(50000)}</span></CTableDataCell>
                        <CTableDataCell style={cs}><CBadge color={bonoVIH ? 'primary' : 'secondary'}>{bonoVIH ? 'Aplica' : 'No aplica'}</CBadge></CTableDataCell>
                        <CTableDataCell style={cs}><NumInput disabled={locked || !bonoVIH} value={bonoStates.vih.penalizacion} onChange={e => updateBonoState('vih', 'penalizacion', e.target.value)} /></CTableDataCell>
                        <CTableDataCell style={cs}><NumInput disabled={locked || !bonoVIH} value={bonoStates.vih.reembolso}    onChange={e => updateBonoState('vih', 'reembolso',    e.target.value)} /></CTableDataCell>
                        <CompletedCell completed={bonoStates.vih.completed} autoKey="bono_vih" label="Bono VIH"
                          importe={50000} bonoVal={0} penalizacion={bonoStates.vih.penalizacion} reembolso={bonoStates.vih.reembolso} category="bono"
                          onCommitTrue={() => updateBonoState('vih', 'completed', true)} onUncomplete={() => updateBonoState('vih', 'completed', false)} />
                      </CTableRow>
                    );
                  })()}
                  {/* Gemelar */}
                  {(() => {
                    const locked = bonoGemelar && bonoStates.gemelar.completed;
                    return (
                      <CTableRow style={locked ? rowLocked : undefined}>
                        <CTableDataCell style={cs}>
                          <div className="d-flex align-items-center gap-2">
                            <CFormCheck checked={bonoGemelar} disabled={bonoStates.gemelar.completed} onChange={e => setBonoGemelar(e.target.checked)} />
                            <strong>Gemelar</strong>
                          </div>
                        </CTableDataCell>
                        <CTableDataCell style={cs}><span className="fw-semibold" style={{ color: 'var(--cui-primary)' }}>{fmt(20000)}</span></CTableDataCell>
                        <CTableDataCell style={cs}><CBadge color={bonoGemelar ? 'primary' : 'secondary'}>{bonoGemelar ? 'Aplica' : 'No aplica'}</CBadge></CTableDataCell>
                        <CTableDataCell style={cs}><NumInput disabled={locked || !bonoGemelar} value={bonoStates.gemelar.penalizacion} onChange={e => updateBonoState('gemelar', 'penalizacion', e.target.value)} /></CTableDataCell>
                        <CTableDataCell style={cs}><NumInput disabled={locked || !bonoGemelar} value={bonoStates.gemelar.reembolso}    onChange={e => updateBonoState('gemelar', 'reembolso',    e.target.value)} /></CTableDataCell>
                        <CompletedCell completed={bonoStates.gemelar.completed} autoKey="bono_gemelar" label="Bono Gemelar"
                          importe={20000} bonoVal={0} penalizacion={bonoStates.gemelar.penalizacion} reembolso={bonoStates.gemelar.reembolso} category="bono"
                          onCommitTrue={() => updateBonoState('gemelar', 'completed', true)} onUncomplete={() => updateBonoState('gemelar', 'completed', false)} />
                      </CTableRow>
                    );
                  })()}
                </CTableBody>
              </CTable>
            </div>
          </CAccordionBody>
        </CAccordionItem>

        {/* ═══ Puerperio ════════════════════════════════════════════════════ */}
        <CAccordionItem itemKey={6}>
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
                    const state   = puerperioStates[row.id] || initRS();
                    const importe = getPuerperioImporte(row.id);
                    const locked  = state.completed;
                    return (
                      <CTableRow key={row.id} style={locked ? rowLocked : undefined}>
                        <CTableDataCell style={cs}>
                          <strong>{row.concepto}</strong>
                          {row.schemeBased && <small className="d-block text-muted">Según esquema seleccionado</small>}
                          {row.id === 'puerperio3' && ayudaMaternidad && ayudaAmountNum > 0 && (
                            <small className="d-block text-danger">Base: {fmt(p3BaseAmount)} − Ayuda maternidad: {fmt(ayudaAmountNum)}</small>
                          )}
                        </CTableDataCell>
                        <CTableDataCell style={cs}><span className="fw-semibold" style={{ color: 'var(--cui-primary)' }}>{fmt(importe)}</span></CTableDataCell>
                        <CTableDataCell style={cs}><NumInput disabled={locked} value={state.penalizacion} onChange={e => updatePuerperioState(row.id, 'penalizacion', e.target.value)} /></CTableDataCell>
                        <CTableDataCell style={cs}><NumInput disabled={locked} value={state.reembolso}    onChange={e => updatePuerperioState(row.id, 'reembolso',    e.target.value)} /></CTableDataCell>
                        <CompletedCell completed={locked} autoKey={`puerperio_${row.id}`} label={row.concepto}
                          importe={importe} bonoVal={0} penalizacion={state.penalizacion} reembolso={state.reembolso} category="scheme"
                          onCommitTrue={() => updatePuerperioState(row.id, 'completed', true)} onUncomplete={() => updatePuerperioState(row.id, 'completed', false)} />
                      </CTableRow>
                    );
                  })}
                </CTableBody>
              </CTable>
            </div>

            {/* ── Ayuda maternidad ── */}
            <div className="mb-4 p-3 rounded" style={{ border: `1px solid ${ayudaMaternidad ? 'var(--cui-primary)' : 'var(--cui-border-color)'}`, transition: 'border-color 0.2s' }}>
              <div className="d-flex align-items-center gap-3 flex-wrap mb-3">
                <div className="d-flex align-items-center gap-2">
                  <CFormCheck id="ayuda-maternidad" checked={ayudaMaternidad} disabled={ayudaState.completed}
                    onChange={e => { setAyudaMaternidad(e.target.checked); if (!e.target.checked) setAyudaAmount(''); }} />
                  <label htmlFor="ayuda-maternidad" className="mb-0 fw-semibold" style={{ cursor: 'pointer' }}>¿Ayuda maternidad?</label>
                </div>
                {ayudaMaternidad && (
                  <>
                    <div className="d-flex align-items-center gap-2">
                      <CFormLabel className="mb-0 text-muted small">Monto:</CFormLabel>
                      <CFormInput type="number" size="sm" className="no-spinners" style={{ width: '140px' }}
                        value={ayudaAmount} placeholder="0" disabled={ayudaState.completed} onChange={e => setAyudaAmount(e.target.value)} />
                    </div>
                    {ayudaAmountNum > 0 && <CBadge color="danger">−{fmt(ayudaAmountNum)} de Puerperio 3</CBadge>}
                  </>
                )}
                {!ayudaMaternidad && <small className="text-muted">Al activar, el monto se descuenta de Puerperio 3 y se registra en Extrato Gastos.</small>}
              </div>
              {ayudaMaternidad && ayudaAmountNum > 0 && (
                <div className="table-responsive">
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
                      <CTableRow style={ayudaState.completed ? rowLocked : undefined}>
                        <CTableDataCell style={cs}>
                          <strong>Ayuda maternidad</strong>
                          <small className="d-block text-muted">Descontado de Puerperio 3</small>
                        </CTableDataCell>
                        <CTableDataCell style={cs}><span className="fw-semibold" style={{ color: 'var(--cui-primary)' }}>{fmt(ayudaAmountNum)}</span></CTableDataCell>
                        <CTableDataCell style={cs}><NumInput disabled={ayudaState.completed} value={ayudaState.penalizacion} onChange={e => updateAyudaState('penalizacion', e.target.value)} /></CTableDataCell>
                        <CTableDataCell style={cs}><NumInput disabled={ayudaState.completed} value={ayudaState.reembolso}    onChange={e => updateAyudaState('reembolso',    e.target.value)} /></CTableDataCell>
                        <CompletedCell completed={ayudaState.completed} autoKey="ayuda_maternidad" label="Ayuda maternidad"
                          importe={ayudaAmountNum} bonoVal={0} penalizacion={ayudaState.penalizacion} reembolso={ayudaState.reembolso} category="scheme"
                          onCommitTrue={() => updateAyudaState('completed', true)} onUncomplete={() => updateAyudaState('completed', false)} />
                      </CTableRow>
                    </CTableBody>
                  </CTable>
                </div>
              )}
            </div>

            {/* ── Buena Gestante ── */}
            <div className="mb-4 p-3 rounded" style={{ border: '1px solid var(--cui-border-color)' }}>
              <div className="d-flex justify-content-between align-items-center mb-1 flex-wrap gap-2">
                <div>
                  <h6 className="mb-0 d-inline">Buena Gestante</h6>
                  <small className="text-muted ms-2">(parte del esquema — máx. {fmt(BG_MAX)})</small>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <CBadge color="primary">Aprobado: {fmt(bgTotal)}</CBadge>
                  {bgDiscounted > 0 && <CBadge color="danger">Descuento: −{fmt(bgDiscounted)}</CBadge>}
                  {bgExtraBonus > 0 && <CBadge color="success">Bono Extra: +{fmt(bgExtraBonus)}</CBadge>}
                </div>
              </div>
              <small className="text-muted d-block mb-3">
                Condiciones marcadas = se pagan. No marcadas = se descuentan del total del esquema. <strong>Bono extra es adicional</strong> y aparece en la columna de Bonos Totales.
              </small>

              {/* Condition checkboxes — locked while BG pago is completed */}
              <CRow className="g-2 mb-3">
                {BG_CONDITIONS.map(cond => (
                  <CCol md={4} key={cond.id}>
                    <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{
                      border: '1px solid var(--cui-border-color)',
                      backgroundColor: bgConditions[cond.id]
                        ? 'color-mix(in srgb, var(--cui-primary) 10%, transparent)'
                        : 'color-mix(in srgb, var(--cui-danger) 6%, transparent)',
                      transition: 'background-color 0.2s',
                    }}>
                      <div className="d-flex align-items-center gap-2">
                        <CFormCheck
                          checked={bgConditions[cond.id]} id={`bg-${cond.id}`}
                          disabled={bgState.completed}
                          onChange={e => updateBgCondition(cond.id, e.target.checked)}
                        />
                        <label htmlFor={`bg-${cond.id}`} className="mb-0"
                          style={{ cursor: bgState.completed ? 'default' : 'pointer', fontSize: '0.875rem' }}>
                          {cond.label}
                        </label>
                      </div>
                      <CBadge color={bgConditions[cond.id] ? 'primary' : 'danger'} className="ms-2 flex-shrink-0">
                        {bgConditions[cond.id] ? '+' : '−'}{fmt(cond.amount)}
                      </CBadge>
                    </div>
                  </CCol>
                ))}
                <CCol md={4}>
                  <div className="p-2 rounded h-100" style={{ border: '1px solid var(--cui-success)', backgroundColor: 'color-mix(in srgb, var(--cui-success) 8%, transparent)' }}>
                    <small className="text-success d-block mb-1 fw-semibold">
                      <CIcon icon={cilPlus} size="sm" className="me-1" />
                      Bono Extra (aparece en Bonos Totales)
                    </small>
                    <NumInput value={bgConditions.extra} placeholder="0"
                      disabled={bgState.completed}
                      onChange={e => updateBgCondition('extra', e.target.value)} width="100%" />
                  </div>
                </CCol>
              </CRow>

              {/* ── BG pago completado row — same pattern as all other rows ── */}
              <CTable hover striped className="gest-table mb-0">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell style={{ ...hs, minWidth: '260px' }}>Concepto</CTableHeaderCell>
                    <CTableHeaderCell style={hs}>Importe aprobado</CTableHeaderCell>
                    <CTableHeaderCell style={hs}>Penalización</CTableHeaderCell>
                    <CTableHeaderCell style={hs}>Reembolso</CTableHeaderCell>
                    <CTableHeaderCell style={hsc}>Pago completado</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  <CTableRow style={bgState.completed ? rowLocked : undefined}>
                    <CTableDataCell style={cs}>
                      <strong>Buena Gestante</strong>
                      <small className="d-block text-muted">
                        {bgDiscounted > 0
                          ? `${fmt(BG_MAX)} máx − ${fmt(bgDiscounted)} desc. = ${fmt(bgTotal)} aprobado`
                          : 'Todas las condiciones aprobadas'}
                      </small>
                    </CTableDataCell>
                    <CTableDataCell style={cs}>
                      <span className="fw-semibold" style={{ color: bgTotal > 0 ? 'var(--cui-primary)' : 'var(--cui-secondary)' }}>
                        {fmt(bgTotal)}
                      </span>
                    </CTableDataCell>
                    <CTableDataCell style={cs}>
                      <NumInput disabled={bgState.completed} value={bgState.penalizacion}
                        onChange={e => updateBgState('penalizacion', e.target.value)} />
                    </CTableDataCell>
                    <CTableDataCell style={cs}>
                      <NumInput disabled={bgState.completed} value={bgState.reembolso}
                        onChange={e => updateBgState('reembolso', e.target.value)} />
                    </CTableDataCell>
                    <CompletedCell
                      completed={bgState.completed}
                      autoKey="buena_gestante"
                      label="Buena Gestante"
                      importe={bgTotal}
                      bonoVal={0}
                      penalizacion={bgState.penalizacion}
                      reembolso={bgState.reembolso}
                      category="scheme"
                      onCommitTrue={() => updateBgState('completed', true)}
                      onUncomplete={() => updateBgState('completed', false)}
                    />
                  </CTableRow>
                </CTableBody>
              </CTable>
            </div>

            {/* ── Parcialidades ── */}
            <div className="p-3 rounded" style={{ border: '1px solid var(--cui-border-color)' }}>
              <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                <h6 className="mb-0">Últimas firmas — {fmt(ultimasFirmasTotal)} en parcialidades</h6>
                <div className="d-flex align-items-center gap-2">
                  <CFormLabel className="mb-0">Parcialidades:</CFormLabel>
                  <CFormSelect style={{ width: '80px' }} value={parcCount} onChange={e => handleParcCountChange(parseInt(e.target.value))}>
                    {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
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
                    return (
                      <CTableRow key={i} style={locked ? rowLocked : undefined}>
                        <CTableDataCell style={cs}>
                          <strong>Parcialidad {i + 1}</strong>
                          {i === parcAmounts.length - 1 && <CBadge color="secondary" className="ms-2">Última</CBadge>}
                        </CTableDataCell>
                        <CTableDataCell style={cs}><span className="fw-semibold" style={{ color: 'var(--cui-primary)' }}>{fmt(amt)}</span></CTableDataCell>
                        <CompletedCell completed={locked} autoKey={autoKey} label={`Parcialidad ${i + 1}`}
                          importe={amt} bonoVal={0} penalizacion={0} reembolso={0} category="scheme"
                          onCommitTrue={() => setParcCompleted(prev => prev.map((v, j) => j === i ? true : v))}
                          onUncomplete={() => setParcCompleted(prev => prev.map((v, j) => j === i ? false : v))} />
                      </CTableRow>
                    );
                  })}
                  <CTableRow>
                    <CTableDataCell style={cs}><em className="text-muted">Buena Gestante (referencia)</em></CTableDataCell>
                    <CTableDataCell style={cs}>
                      <span className="fw-semibold" style={{ color: bgTotal > 0 ? 'var(--cui-success)' : 'var(--cui-danger)' }}>
                        {bgTotal > 0 ? fmt(bgTotal) : `−${fmt(bgDiscounted)}`}
                      </span>
                    </CTableDataCell>
                    <CTableDataCell style={{ ...cs, textAlign: 'center' }}><small className="text-muted">ver sección BG</small></CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>
            </div>
          </CAccordionBody>
        </CAccordionItem>

        {/* ═══ Resumen del esquema ═══════════════════════════════════════════ */}
        <CAccordionItem itemKey={7}>
          <CAccordionHeader>
            <strong>Resumen del esquema</strong>
          </CAccordionHeader>
          <CAccordionBody>
            <div className="table-responsive mb-4">
              <table className="table summary-table mb-0" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr>
                    <th></th>
                    <th>Valor del Esquema</th>
                    <th>Bono de Transporte</th>
                    <th>Bonos Totales</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="row-base">
                    <td className="text-muted small">Total a pagar</td>
                    <td>
                      {fmt(effectiveSchemeValue)}
                      {bgDiscounted > 0 && <div><small className="text-danger">−{fmt(bgDiscounted)} BG</small></div>}
                    </td>
                    <td>{fmt(bonoTransporteTotal)}</td>
                    <td>{totalBonos > 0 ? fmt(totalBonos) : <span className="text-muted">—</span>}</td>
                    <td>{fmt(grandTotal)}</td>
                  </tr>
                  <tr className="row-actual">
                    <td className="text-muted small">Restante</td>
                    <td style={{ color: schemeValueRemaining <= 0 ? 'var(--cui-success)' : 'var(--cui-warning)' }}>
                      {schemeValueRemaining <= 0 ? '✓ ' : ''}{fmt(Math.max(0, schemeValueRemaining))}
                    </td>
                    <td style={{ color: bonoTransporteRemaining <= 0 ? 'var(--cui-success)' : 'var(--cui-warning)' }}>
                      {bonoTransporteRemaining <= 0 ? '✓ ' : ''}{fmt(Math.max(0, bonoTransporteRemaining))}
                    </td>
                    <td style={{ color: bonosTotalesRemaining <= 0 ? 'var(--cui-success)' : (totalBonos === 0 ? undefined : 'var(--cui-warning)') }}>
                      {totalBonos === 0 ? <span className="text-muted">—</span>
                        : bonosTotalesRemaining <= 0 ? '✓ ' + fmt(0) : fmt(bonosTotalesRemaining)}
                    </td>
                    <td style={{ color: grandTotalRemaining <= 0 ? 'var(--cui-success)' : 'var(--cui-warning)' }}>
                      {grandTotalRemaining <= 0 ? '✓ ' : ''}{fmt(Math.max(0, grandTotalRemaining))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <CRow className="g-3">
              <CCol md={6}>
                <div className="p-3 rounded h-100" style={{ border: '1px solid var(--cui-border-color)' }}>
                  <small className="text-muted d-block mb-1">Pagos realizados</small>
                  <h4 className="mb-0 fw-bold" style={{ color: 'var(--cui-primary)' }}>{fmt(pagosRealizados)}</h4>
                  <small className="text-muted">Suma de entradas en Extrato Gastos</small>
                </div>
              </CCol>
              <CCol md={6}>
                <div className="p-3 rounded h-100" style={{
                  border: `2px solid ${montoRestante <= 0 ? 'var(--cui-success)' : 'var(--cui-warning)'}`,
                  backgroundColor: montoRestante <= 0
                    ? 'color-mix(in srgb, var(--cui-success) 10%, transparent)'
                    : 'color-mix(in srgb, var(--cui-warning) 10%, transparent)',
                }}>
                  <small className="text-muted d-block mb-1">Monto restante</small>
                  <h4 className={`mb-0 fw-bold ${montoRestante <= 0 ? 'text-success' : 'text-warning'}`}>
                    {montoRestante <= 0 ? '✓ ' : ''}{fmt(Math.abs(montoRestante))}
                  </h4>
                  {montoRestante <= 0
                    ? <small className="text-success">Programa completamente cubierto</small>
                    : <small className="text-muted">Total − Pagos realizados</small>}
                </div>
              </CCol>
            </CRow>
          </CAccordionBody>
        </CAccordionItem>

        {/* ═══ Extrato Gastos ════════════════════════════════════════════════ */}
        <CAccordionItem itemKey={8}>
          <CAccordionHeader>
            <strong>Extrato Gastos</strong>
          </CAccordionHeader>
          <CAccordionBody>
            {extratoAlert.show && (
              <CAlert color={extratoAlert.type} dismissible onClose={() => setExtratoAlert({ show: false })} className="mb-3">
                {extratoAlert.message}
              </CAlert>
            )}
            <CRow className="mb-3 align-items-end g-2">
              <CCol md={3}><CFormLabel className="small text-muted mb-1">Fecha</CFormLabel><CFormInput type="date" size="sm" value={newExtrato.fecha} onChange={e => setNewExtrato(p => ({ ...p, fecha: e.target.value }))} /></CCol>
              <CCol md={2}><CFormLabel className="small text-muted mb-1">Movimiento</CFormLabel><CFormInput size="sm" value="pago gestante" disabled /></CCol>
              <CCol md={4}>
                <CFormLabel className="small text-muted mb-1">Motivo</CFormLabel>
                <CFormSelect size="sm" value={newExtrato.motivo} onChange={e => setNewExtrato(p => ({ ...p, motivo: e.target.value }))}>
                  <option value="">Seleccionar motivo...</option>
                  {EXTRATO_MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={2}><CFormLabel className="small text-muted mb-1">Valor (MXN)</CFormLabel><CFormInput type="number" size="sm" className="no-spinners" placeholder="0" value={newExtrato.valor} onChange={e => setNewExtrato(p => ({ ...p, valor: e.target.value }))} /></CCol>
              <CCol md={1}><CButton color="primary" size="sm" onClick={addExtratoEntry} className="w-100"><CIcon icon={cilPlus} /></CButton></CCol>
            </CRow>
            <div className="table-responsive">
              <CTable hover striped className="gest-table">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell style={hs}>Fecha</CTableHeaderCell>
                    <CTableHeaderCell style={hs}>Movimiento</CTableHeaderCell>
                    <CTableHeaderCell style={hs}>Motivo</CTableHeaderCell>
                    <CTableHeaderCell style={hs}>Valor (MXN)</CTableHeaderCell>
                    <CTableHeaderCell style={hs}>Acciones</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {extratoGastos.length === 0 ? (
                    <CTableRow><CTableDataCell colSpan={5} className="text-center py-4 text-muted">No hay entradas registradas</CTableDataCell></CTableRow>
                  ) : extratoGastos.map(entry => (
                    <CTableRow key={entry.id} style={
                      entry.autoKey === 'penalty_sdg36'
                        ? { backgroundColor: 'color-mix(in srgb, var(--cui-danger) 8%, transparent)' }
                        : entry.isAuto
                          ? { backgroundColor: 'color-mix(in srgb, var(--cui-primary) 6%, transparent)' }
                          : undefined
                    }>
                      <CTableDataCell style={cs}>{new Date(entry.fecha + 'T12:00:00').toLocaleDateString('es-MX')}</CTableDataCell>
                      <CTableDataCell style={cs}><CBadge color={entry.isAuto ? 'primary' : 'secondary'}>{entry.movimiento || 'pago gestante'}</CBadge></CTableDataCell>
                      <CTableDataCell style={cs}>{entry.motivo}</CTableDataCell>
                      <CTableDataCell style={cs}>
                        <span className="fw-semibold" style={{ color: parseFloat(entry.valor) < 0 ? 'var(--cui-danger)' : 'var(--cui-primary)' }}>
                          {fmt(parseFloat(entry.valor))}
                        </span>
                      </CTableDataCell>
                      <CTableDataCell style={cs}>
                        {(() => {
                          const bonusKeys = ['bonus_t1', 'bonus_sdg36', 'penalty_sdg36', 'bono_vih', 'bono_gemelar'];
                          const isBonus   = bonusKeys.includes(entry.autoKey);
                          return (
                            <CButton color="danger" variant="ghost" size="sm" disabled={isBonus}
                              title={isBonus ? 'Este registro se gestiona automáticamente con los bonos' : entry.isAuto ? 'Eliminar (desbloqueará la fila correspondiente)' : 'Eliminar'}
                              onClick={() => !isBonus && confirmDeleteExtrato(entry)}>
                              <CIcon icon={cilTrash} size="sm" />
                            </CButton>
                          );
                        })()}
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </div>
            {extratoGastos.length > 0 && (
              <div className="text-end mt-3">
                <strong>Total extrato: </strong>
                <span className="fw-bold" style={{ color: 'var(--cui-primary)' }}>
                  {fmt(extratoGastos.reduce((s, e) => s + (parseFloat(e.valor) || 0), 0))}
                </span>
              </div>
            )}
          </CAccordionBody>
        </CAccordionItem>

      </CAccordion>

      {/* ── Modal: scheme password ── */}
      <CModal visible={showSchemePasswordModal} onClose={() => setShowSchemePasswordModal(false)} alignment="center" backdrop="static" keyboard={false}>
        <CModalHeader closeButton={false}>
          <CModalTitle className="d-flex align-items-center"><CIcon icon={cilLockLocked} className="text-warning me-2" size="lg" />Cambiar programa</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p className="mb-3">El programa está bloqueado. Ingresa la contraseña para modificar:</p>
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
      <CModal visible={showDateModal} onClose={cancelDateModal} alignment="center" backdrop="static">
        <CModalHeader>
          <CModalTitle>Fecha de pago — <span style={{ color: 'var(--cui-primary)' }}>{dateModalInfo.label}</span></CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CFormLabel className="mb-1">Selecciona la fecha en que se realizó el pago:</CFormLabel>
          <CFormInput type="date" value={dateModalInfo.fecha} onChange={e => setDateModalInfo(p => ({ ...p, fecha: e.target.value }))} />
          <div className="mt-3 p-2 rounded" style={{ background: 'color-mix(in srgb, var(--cui-primary) 8%, transparent)', border: '1px solid var(--cui-border-color)' }}>
            <small className="text-muted d-block">Valor que se registrará en Extrato Gastos</small>
            <strong style={{ color: 'var(--cui-primary)' }}>{fmt(dateModalInfo.valor)}</strong>
            <small className="d-block text-muted mt-1">Importe + bono transporte − penalización + reembolso</small>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={cancelDateModal}>Cancelar</CButton>
          <CButton color="primary" className="app-button" onClick={confirmDateModal} disabled={!dateModalInfo.fecha}>
            <CIcon icon={cilSave} className="me-2" />Confirmar pago
          </CButton>
        </CModalFooter>
      </CModal>

      {/* ── Modal: unlock / re-edit ── */}
      <CModal visible={showUnlockModal} onClose={() => setShowUnlockModal(false)} alignment="center" backdrop="static" keyboard={false}>
        <CModalHeader closeButton={false}>
          <CModalTitle className="d-flex align-items-center"><CIcon icon={cilLockLocked} className="text-warning me-2" size="lg" />Desbloquear fila</CModalTitle>
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

    </CContainer>
  );
};

export default PaymentsGestForm;