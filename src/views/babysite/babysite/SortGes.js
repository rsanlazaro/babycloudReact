// src/views/pages/sortGes/sortGes.js
import React, { useState, useEffect, useRef } from 'react';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CRow,
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
  CAccordion,
  CAccordionItem,
  CAccordionHeader,
  CAccordionBody,
  CFormInput,
  CFormSelect,
  CFormCheck,
  CFormLabel,
  CFormTextarea,
  CButton,
  CSpinner,
  CAlert,
  CAvatar,
  CBadge,
  CInputGroup,
  CInputGroupText,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilArrowLeft,
  cilSave,
  cilFile,
  cilCalendar,
  cilUser,
  cilShieldAlt,
  cilPeople,
  cilClipboard,
  cilCloudUpload,
  cilXCircle,
  cilLockLocked,
  cilLockUnlocked,
  cilPlus,
  cilTrash,
} from '@coreui/icons';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';

// Tab configuration with colors and icons
const TAB_CONFIG = [
  { id: 'alta-gesca',  label: 'ALTA GESCA',  color: '#d97ea1', icon: cilUser      },
  { id: 'checklist',  label: 'CHECK LIST',   color: '#0071b8', icon: cilClipboard },
  { id: 'seguro-med', label: 'SEGURO MED',   color: '#899973', icon: cilShieldAlt },
  { id: 'psico-social', label: 'PSICO SOCIAL', color: '#0098b3', icon: cilPeople  },
  { id: 'cita-previa', label: 'CITA PREVIA', color: '#a14567', icon: cilCalendar  },
];

const SortGes = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('alta-gesca');
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  // Field locking
  const [lockedFields, setLockedFields] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingFieldLock, setPendingFieldLock] = useState({ section: null, field: null, value: null });
  const [fieldToUnlock, setFieldToUnlock] = useState({ section: null, field: null });
  const [unlockPassword, setUnlockPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const activeEditingFieldRef = useRef({ section: null, field: null, initialValue: null });
  const UNLOCK_PASSWORD = '26213256';

  // Historial gate — password-protected visibility per seguimiento
  const [historialUnlocked, setHistorialUnlocked] = useState({}); // { [segId]: true }
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [historialTargetId, setHistorialTargetId] = useState(null);
  const [historialPassword, setHistorialPassword] = useState('');
  const [historialPasswordError, setHistorialPasswordError] = useState('');

  // ─────────────────────────────────────────────────────────────
  // ALTA GESCA state
  // ─────────────────────────────────────────────────────────────
  const [registroInicial, setRegistroInicial] = useState({
    nombre_completo: '', curp: '', rfc: '', esquema_ofrecido: '$400,000.00',
    tel_1: '', tel_2: '', email: '', estado_civil: '', rni: '',
    fecha_nacimiento: '', edad: '', banco: '', clabe_interbancaria: '',
    direccion: '', numero: '', postal: '', alcaldia_municipio: '',
    estado: '', ocupacion: '',
  });

  const [datosSalud, setDatosSalud] = useState({
    tipo_sangre: '', peso: '', fumador: false, metodo_aco: '',
    embarazos: '', cesareas: '', partos: '', abortos: '', altura: '',
    imc: '', imc_clasificacion: '', fumador_desde: '',
    tiempo_metodo_aco: '', fecha_ultima_menstruacion: '',
    hijos: '', ultima_cesarea: '',
  });

  // ─────────────────────────────────────────────────────────────
  // CHECK LIST state
  // ─────────────────────────────────────────────────────────────
  const [documentos, setDocumentos] = useState({
    certificado_nacimiento: null, curp: null,
    comprobante_domicilio: null, poliza_seguro: null, cita_entrega: '',
  });

  const [consentimientos, setConsentimientos] = useState({
    cita_firma: '', consentimiento_informado: false,
    consentimiento_transferencia: false, aviso_privacidad: false,
    informacion_personal: false, regular: false, hiv: false,
    gemelar: false, full: false,
  });

  // ─────────────────────────────────────────────────────────────
  // SEGURO MED — Seguro de Vida
  // Each entry: { id, fecha_alta, aseguradora, gestor, cuotas, valor, vencimiento,
  //               pago_monto, pago_fecha }
  // cuotas is ALWAYS 1 — fixed, never user-editable
  // ─────────────────────────────────────────────────────────────
  const [segurosVida, setSegurosVida] = useState([]);
  // Modal: 'new' | 'pago' | null
  const [modalVida, setModalVida] = useState(null);
  const [editingVidaId, setEditingVidaId] = useState(null);
  const VIDA_EMPTY = { fecha_alta: '', aseguradora: '', gestor: '', cuotas: '1', valor: '', vencimiento: '', pago_monto: '', pago_fecha: '' };
  const [formVida, setFormVida] = useState(VIDA_EMPTY);
  const [detailVida, setDetailVida] = useState(null); // which record to show detail for

  // Edit-password gate for Seguro de Vida
  const [showVidaEditModal, setShowVidaEditModal] = useState(false);
  const [vidaEditTarget, setVidaEditTarget] = useState(null); // the seg object to edit after password
  const [vidaEditPassword, setVidaEditPassword] = useState('');
  const [vidaEditPasswordError, setVidaEditPasswordError] = useState('');

  // Payment-only edit gate (separate from general info edit)
  const [showVidaPagoEditModal, setShowVidaPagoEditModal] = useState(false);
  const [vidaPagoEditTarget, setVidaPagoEditTarget] = useState(null);
  const [vidaPagoEditPassword, setVidaPagoEditPassword] = useState('');
  const [vidaPagoEditPasswordError, setVidaPagoEditPasswordError] = useState('');
  const [editingPagoVidaId, setEditingPagoVidaId] = useState(null); // segId whose payment is being edited

  // Staged (unsaved) payment inputs per segId: { [segId]: { monto, fecha } }
  const [pendingPagoVida, setPendingPagoVida] = useState({});

  // ─────────────────────────────────────────────────────────────
  // SEGURO MED — Seguro de Maternidad
  // Each policy: { id, gestor, tipo_pago, valor_cuota, fecha_alta,
  //               fecha_liberacion, fecha_vencimiento, aseguradora, numero_poliza,
  //               pagos: [{ cuota_num, total, vencimiento, fecha_pago, status }] }
  // ─────────────────────────────────────────────────────────────
  const [segurosMat, setSegurosMat] = useState([]);
  // Modal: 'new' | 'pago' | null
  const [modalMat, setModalMat] = useState(null);
  const [editingMatId, setEditingMatId] = useState(null);
  const MAT_EMPTY = {
    gestor: '', tipo_pago: '', valor_cuota: '', total_estimado: '',
    fecha_solicitud: '', fecha_alta: '', fecha_liberacion: '', fecha_vencimiento: '',
    aseguradora: '', numero_poliza: '',
  };
  const [formMat, setFormMat] = useState(MAT_EMPTY);
  // For "Añadir pago" modal: which policy + which cuota row
  const [pagoTarget, setPagoTarget] = useState({ polizaId: null, cuotaNum: null, valorSugerido: '' });
  const [fechaPagoInput, setFechaPagoInput] = useState('');
  const [montoPagoInput, setMontoPagoInput] = useState('');

  const [savingSeguro, setSavingSeguro] = useState(false);

  // ─────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────
  // PSICO SOCIAL state
  // ─────────────────────────────────────────────────────────────

  // Psico Inicial — fixed 7 rows, each editable
  const PSICO_INICIAL_ETAPAS = [
    'Entrevista admisión',
    'Psicométrico',
    'Estudios Socio Económicos',
    'HIM 1',
    'HIM 2',
    'HIM 3',
    'HIM 4',
  ];
  const [psicoInicial, setPsicoInicial] = useState(
    PSICO_INICIAL_ETAPAS.map((etapa, i) => ({
      id: i + 1,
      etapa,
      fecha: '',
      estado: '',
      recomendacion: '',
    }))
  );

  // Seguimiento Psicológico — dynamic list, each is an accordion item
  const SEG_EMPTY = {
    etapa: '',
    motivo: '',
    complemento: '',
    complemento2: '',
    programar: '',
    status: 'sin_dts',
    asistencia: '',
    informe: '',
    incidencia: '',
    historial: '',
  };
  const [seguimientos, setSeguimientos] = useState([]);
  // Track which seguimiento accordion items are open (by id)
  const [seguimientoOpen, setSeguimientoOpen] = useState([]);

  // ─────────────────────────────────────────────────────────────
  // Select options
  // ─────────────────────────────────────────────────────────────
  const esquemaOptions = [
    { value: '$400,000.00', label: '$400,000.00' },
    { value: '$375,000.00', label: '$375,000.00' },
  ];
  const tipoSangreOptions = [
    { value: '', label: 'Seleccionar...' },
    { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
  ];
  const metodoAcoOptions = [
    { value: '', label: 'Seleccionar...' },
    { value: 'implante', label: 'Implante' },
    { value: 'diu_cobre', label: 'DIU Cobre' },
    { value: 'diu_plata', label: 'DIU Plata' },
    { value: 'diu_mirena', label: 'DIU Mirena' },
    { value: 'pastillas', label: 'Pastillas' },
    { value: 'preservativo', label: 'Preservativo' },
    { value: 'otros', label: 'Otros' },
  ];
  const estadoCivilOptions = [
    { value: '', label: 'Seleccionar...' },
    { value: 'soltera', label: 'Soltera' },
    { value: 'casada', label: 'Casada' },
    { value: 'divorciada', label: 'Divorciada' },
    { value: 'viuda', label: 'Viuda' },
    { value: 'union_libre', label: 'Unión Libre' },
  ];
  // ── Psico Inicial selects ────────────────────────────────────
  const estadoPsicoOpts = [
    { value: '', label: 'Seleccionar...' },
    { value: 'concluido',  label: 'Concluido'  },
    { value: 'agendado',   label: 'Agendado'   },
    { value: 'programar',  label: 'Programar'  },
  ];
  const recomendacionOpts = [
    { value: '', label: 'Seleccionar...' },
    { value: 'apta',             label: 'Apta'             },
    { value: 'recomendable',     label: 'Recomendable'     },
    { value: 'con_reservas',     label: 'Con reservas'     },
    { value: 'no_recomendable',  label: 'No recomendable'  },
  ];
  // ── Seguimiento Psicológico selects ─────────────────────────
  const motivoOpts = [
    { value: '', label: 'Seleccionar...' },
    { value: 'him',              label: 'HIM'                },
    { value: 'cita_psicologica', label: 'Cita psicológica'   },
    { value: 'psicometria',      label: 'Psicometría'        },
    { value: 'otro',             label: 'Otro'               },
  ];
  const complementoOpts = [
    { value: '', label: 'Seleccionar...' },
    { value: 'inicial',              label: 'Inicial'              },
    { value: 'seguimiento',          label: 'Seguimiento'          },
    { value: 'retencion_emocional',  label: 'Retención emocional'  },
    { value: 'puerperio',            label: 'Puerperio'            },
    { value: 'alta_psicologica',     label: 'Alta psicológica'     },
  ];
  const complemento2Opts = [
    { value: '', label: 'Seleccionar...' },
    { value: 'semana_12',  label: 'Semana 12' },
    { value: 'semana_16',  label: 'Semana 16' },
    { value: 'semana_24',  label: 'Semana 24' },
    { value: 'familiar',   label: 'Familiar'  },
    { value: 'otro',       label: 'Otro'      },
  ];
  const segStatusOpts = [
    { value: 'sin_dts',     label: 'Sin dts',     color: 'secondary' },
    { value: 'programada',  label: 'Programada',  color: 'info'      },
    { value: 'reprogramar', label: 'Reprogramar', color: 'warning'   },
    { value: 'completado',  label: 'Completado',  color: 'success'   },
  ];
  const asistenciaOpts = [
    { value: '', label: 'Seleccionar...' },
    { value: 'asistio',          label: 'Asistió'             },
    { value: 'no_asistio',       label: 'No asistió'          },
    { value: 'reprogramar_ai',   label: 'Reprogramar (AI)'    },
    { value: 'remarco',          label: 'Remarcó'             },
    { value: 'otro',             label: 'Otro'                },
  ];
  const informeOpts = [
    { value: '', label: 'Seleccionar...' },
    { value: 'apta',              label: 'Apta'               },
    { value: 'recomendable',      label: 'Recomendable'       },
    { value: 'con_reserva',       label: 'Con reserva'        },
    { value: 'alerta_incidencia', label: 'Alerta incidencia'  },
  ];
  const incidenciaOpts = [
    { value: '', label: 'Seleccionar...' },
    { value: 'sin_incidencias',     label: 'Sin incidencias'     },
    { value: 'situacion_emocional', label: 'Situación emocional' },
    { value: 'situacion_parental',  label: 'Situación parental'  },
    { value: 'situacion_medica',    label: 'Situación médica'    },
    { value: 'administrativa',      label: 'Administrativa'      },
    { value: 'inconformidad',       label: 'Inconformidad'       },
  ];
  // Vida status derived from vencimiento date
  const getVidaStatus = (vencimiento) => {
    if (!vencimiento) return { label: 'Sin datos', color: 'secondary' };
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const venc = new Date(vencimiento);
    if (venc < hoy) return { label: 'Vencido', color: 'danger' };
    const diff = Math.ceil((venc - hoy) / 86400000);
    if (diff <= 30) return { label: 'Por vencer', color: 'warning' };
    return { label: 'Asegurada', color: 'success' };
  };

  // Maternidad cuota status derived from vencimiento + whether payment registered
  const getCuotaStatus = (cuota) => {
    if (cuota.status === 'cancelado') return { label: 'Cancelado', color: 'dark' };
    if (cuota.fecha_pago) return { label: 'Abonado', color: 'success' };
    if (!cuota.vencimiento) return { label: 'Sin datos', color: 'secondary' };
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const venc = new Date(cuota.vencimiento);
    const diff = Math.ceil((venc - hoy) / 86400000);
    if (diff >= 10) return { label: 'Esperando pago', color: 'info' };
    if (venc < hoy) return { label: 'Carencia', color: 'danger' };
    return { label: 'Esperando pago', color: 'info' };
  };

  // Tipo de pago config: months between payments, total payments over ~9 months coverage
  const TIPO_PAGO_CONFIG = {
    mensual:     { intervalo: 1,  label: 'Mensual',     cuotas: 12 },
    bimestral:   { intervalo: 2,  label: 'Bimestral',   cuotas: 6  },
    trimestral:  { intervalo: 3,  label: 'Trimestral',  cuotas: 3  },
    semestral:   { intervalo: 6,  label: 'Semestral',   cuotas: 2  },
    anual:       { intervalo: 12, label: 'Anual',       cuotas: 1  },
  };

  // Build pagos from tipo_pago + fecha_alta (payments start at month+intervalo − 10 days)
  const buildPagos = (tipoPago, valorCuota, fechaAlta) => {
    const cfg = TIPO_PAGO_CONFIG[tipoPago];
    if (!cfg || !fechaAlta) return [];
    const base = new Date(fechaAlta);
    return Array.from({ length: cfg.cuotas }, (_, i) => {
      // Advance (i+1) intervals from alta, then subtract 10 days
      const d = new Date(base);
      d.setMonth(d.getMonth() + cfg.intervalo * (i + 1));
      d.setDate(d.getDate() - 10);
      const vencimiento = d.toISOString().split('T')[0];
      return { cuota_num: i + 1, total: cfg.cuotas, vencimiento, fecha_pago: '', status: 'pendiente' };
    });
  };

  // Compute suggested fecha_liberacion = fecha_alta + 90 days
  const computeMatLiberacion = (fechaAlta) => {
    if (!fechaAlta) return '';
    const d = new Date(fechaAlta);
    d.setDate(d.getDate() + 90);
    return d.toISOString().split('T')[0];
  };

  // Compute total estimate label for the modal
  const computeMatTotal = (tipoPago, valorCuota) => {
    const cfg = TIPO_PAGO_CONFIG[tipoPago];
    if (!cfg || !valorCuota) return null;
    const total = cfg.cuotas * parseFloat(valorCuota);
    return { cuotas: cfg.cuotas, total };
  };

  // ─────────────────────────────────────────────────────────────
  // Effects
  // ─────────────────────────────────────────────────────────────
  useEffect(() => { if (id) fetchCandidate(); }, [id]);

  useEffect(() => {
    const peso = parseFloat(datosSalud.peso);
    const altura = parseFloat(datosSalud.altura);
    if (peso > 0 && altura > 0) {
      const imc = peso / (altura * altura);
      const imcRounded = imc.toFixed(1);
      let clasificacion = '';
      if (imc < 18.5) clasificacion = 'Bajo peso';
      else if (imc < 23) clasificacion = 'Peso normal';
      else if (imc < 25) clasificacion = 'Riesgo de sobrepeso';
      else if (imc < 30) clasificacion = 'Sobrepeso';
      else clasificacion = 'Obesidad';
      setDatosSalud(prev => ({ ...prev, imc: imcRounded, imc_clasificacion: clasificacion }));
    }
  }, [datosSalud.peso, datosSalud.altura]);

  useEffect(() => {
    if (registroInicial.fecha_nacimiento) {
      const today = new Date();
      const birthDate = new Date(registroInicial.fecha_nacimiento);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      setRegistroInicial(prev => ({ ...prev, edad: age.toString() }));
    }
  }, [registroInicial.fecha_nacimiento]);

  useEffect(() => {
    if (getDocumentosStatus().label === 'Completado') {
      const today = new Date().toISOString().split('T')[0];
      setDocumentos(prev => ({ ...prev, cita_entrega: today }));
    }
  }, [documentos.certificado_nacimiento, documentos.curp, documentos.comprobante_domicilio, documentos.poliza_seguro]);

  useEffect(() => {
    if (getConsentimientosStatus().label === 'Completado') {
      const today = new Date().toISOString().split('T')[0];
      setConsentimientos(prev => ({ ...prev, cita_firma: today }));
    }
  }, [
    consentimientos.consentimiento_informado, consentimientos.consentimiento_transferencia,
    consentimientos.aviso_privacidad, consentimientos.informacion_personal,
    consentimientos.regular, consentimientos.hiv, consentimientos.gemelar, consentimientos.full,
  ]);

  // ─────────────────────────────────────────────────────────────
  // Fetch candidate
  // ─────────────────────────────────────────────────────────────
  const fetchCandidate = async () => {
    try {
      setLoading(true);

      // Load candidate + all tabs in parallel
      const [candidateRes, altaRes, checklistRes, vidaRes, matRes, psicoRes, segRes] =
        await Promise.all([
          api.get(`/api/sort-ges/${id}`,               { withCredentials: true }),
          api.get(`/api/sort-ges/${id}/alta-gesca`,    { withCredentials: true }),
          api.get(`/api/sort-ges/${id}/checklist`,     { withCredentials: true }),
          api.get(`/api/sort-ges/${id}/seguro-vida`,   { withCredentials: true }),
          api.get(`/api/sort-ges/${id}/seguro-mat`,    { withCredentials: true }),
          api.get(`/api/sort-ges/${id}/psico-inicial`, { withCredentials: true }),
          api.get(`/api/sort-ges/${id}/seguimiento`,   { withCredentials: true }),
        ]);

      // ── Candidate master ─────────────────────────────────────
      setCandidate(candidateRes.data);

      // ── Alta GESCA ───────────────────────────────────────────
      const a = altaRes.data || {};
      setRegistroInicial({
        nombre_completo:     a.nombre_completo     || '',
        curp:                a.curp                || '',
        rfc:                 a.rfc                 || '',
        esquema_ofrecido:    a.esquema_ofrecido    || '$400,000.00',
        tel_1:               a.tel_1               || '',
        tel_2:               a.tel_2               || '',
        email:               a.email               || '',
        estado_civil:        a.estado_civil        || '',
        rni:                 a.rni                 || '',
        fecha_nacimiento:    a.fecha_nacimiento    || '',
        edad:                '',
        banco:               a.banco               || '',
        clabe_interbancaria: a.clabe_interbancaria || '',
        direccion:           a.direccion           || '',
        numero:              a.numero              || '',
        postal:              a.postal              || '',
        alcaldia_municipio:  a.alcaldia_municipio  || '',
        estado:              a.estado              || '',
        ocupacion:           a.ocupacion           || '',
      });
      setDatosSalud({
        tipo_sangre:               a.tipo_sangre               || '',
        peso:                      a.peso                      || '',
        fumador:                   !!a.fumador,
        metodo_aco:                a.metodo_aco                || '',
        embarazos:                 a.embarazos                 || '',
        cesareas:                  a.cesareas                  || '',
        partos:                    a.partos                    || '',
        abortos:                   a.abortos                   || '',
        altura:                    a.altura                    || '',
        imc:                       '',
        imc_clasificacion:         '',
        fumador_desde:             a.fumador_desde             || '',
        tiempo_metodo_aco:         a.tiempo_metodo_aco         || '',
        fecha_ultima_menstruacion: a.fecha_ultima_menstruacion || '',
        hijos:                     a.hijos                     || '',
        ultima_cesarea:            a.ultima_cesarea            || '',
      });
      // Restore field lock state persisted in DB
      if (a.locked_fields) {
        try {
          const parsed = typeof a.locked_fields === 'string'
            ? JSON.parse(a.locked_fields) : a.locked_fields;
          setLockedFields(parsed || {});
        } catch (_) {}
      }

      // ── Checklist ────────────────────────────────────────────
      const cl = checklistRes.data || {};
      setDocumentos({
        certificado_nacimiento: cl.certificado_nacimiento_url ? { name: cl.certificado_nacimiento_url } : null,
        curp:                   cl.curp_url                   ? { name: cl.curp_url }                   : null,
        comprobante_domicilio:  cl.comprobante_domicilio_url  ? { name: cl.comprobante_domicilio_url }  : null,
        poliza_seguro:          cl.poliza_seguro_url          ? { name: cl.poliza_seguro_url }          : null,
        cita_entrega:           cl.cita_entrega               || '',
      });
      setConsentimientos({
        cita_firma:                   cl.cita_firma                      || '',
        consentimiento_informado:     !!cl.consentimiento_informado,
        consentimiento_transferencia: !!cl.consentimiento_transferencia,
        aviso_privacidad:             !!cl.aviso_privacidad,
        informacion_personal:         !!cl.informacion_personal,
        regular:                      !!cl.regular,
        hiv:                          !!cl.hiv,
        gemelar:                      !!cl.gemelar,
        full:                         !!cl.full_consent,
      });

      // ── Seguro de Vida ───────────────────────────────────────
      setSegurosVida((vidaRes.data || []).map(v => ({
        id:          v.id,
        fecha_alta:  v.fecha_alta  || '',
        aseguradora: v.aseguradora || '',
        gestor:      v.gestor      || '',
        cuotas:      '1',
        valor:       v.valor       || '',
        vencimiento: v.vencimiento || '',
        pago_monto:  v.pago_monto  || '',
        pago_fecha:  v.fecha_pago  || '',
      })));

      // ── Seguro de Maternidad ─────────────────────────────────
      setSegurosMat((matRes.data || []).map(p => ({
        id:               p.id,
        gestor:           p.gestor            || '',
        tipo_pago:        p.tipo_pago         || '',
        valor_cuota:      p.valor_cuota       || '',
        total_estimado:   p.total_estimado    || '',
        fecha_solicitud:  p.fecha_solicitud   || '',
        fecha_alta:       p.fecha_alta        || '',
        fecha_liberacion: p.fecha_liberacion  || '',
        fecha_vencimiento:p.fecha_vencimiento || '',
        aseguradora:      p.aseguradora       || '',
        numero_poliza:    p.numero_poliza     || '',
        pagos: (p.pagos || []).map(c => ({
          cuota_num:  c.cuota_num,
          total:      c.total_cuotas,
          vencimiento:c.vencimiento || '',
          fecha_pago: c.fecha_pago  || '',
          monto_pago: c.monto_pago  || '',
          status:     c.status      || 'pendiente',
        })),
      })));

      // ── Psico Inicial ────────────────────────────────────────
      const psicoRows = psicoRes.data || [];
      if (psicoRows.length > 0) {
        setPsicoInicial(psicoRows.map(r => ({
          id:           r.etapa_orden,
          etapa:        r.etapa,
          fecha:        r.fecha         || '',
          estado:       r.estado        || '',
          recomendacion:r.recomendacion || '',
        })));
      }

      // ── Seguimientos ─────────────────────────────────────────
      setSeguimientos((segRes.data || []).map(s => ({
        id:          s.id,
        etapa:       s.etapa        || '',
        motivo:      s.motivo       || '',
        complemento: s.complemento  || '',
        complemento2:s.complemento2 || '',
        programar:   s.programar    || '',
        status:      'sin_dts',      // always re-derived client-side from date
        asistencia:  s.asistencia   || '',
        informe:     s.informe      || '',
        incidencia:  s.incidencia   || '',
        historial:   s.historial    || '',
      })));

      setError(null);
    } catch (err) {
      console.error('Error fetching candidate:', err);
      setError('Error al cargar los datos del candidato');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Notifications
  // ─────────────────────────────────────────────────────────────
  const showNotification = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

  // ─────────────────────────────────────────────────────────────
  // Field change handlers
  // ─────────────────────────────────────────────────────────────
  const handleRegistroInicialChange = (e) => {
    const { name, value } = e.target;
    if (!isFieldLocked('registroInicial', name))
      setRegistroInicial(prev => ({ ...prev, [name]: value }));
  };

  const handleDatosSaludChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (!isFieldLocked('datosSalud', name))
      setDatosSalud(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // ── Seguro de Vida CRUD ──────────────────────────────────────

  // Auto-compute vencimiento = fecha_alta + 1 year
  const computeVidaVencimiento = (fechaAlta) => {
    if (!fechaAlta) return '';
    const d = new Date(fechaAlta);
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  };

  const openNuevoVida = () => {
    setFormVida(VIDA_EMPTY);
    setEditingVidaId(null);
    setModalVida('new');
  };

  // Password gate — user clicks "Editar" → password modal → then openEditVida
  const requestEditVida = (seg) => {
    setVidaEditTarget(seg);
    setVidaEditPassword('');
    setVidaEditPasswordError('');
    setShowVidaEditModal(true);
  };
  const confirmVidaEdit = () => {
    if (vidaEditPassword === UNLOCK_PASSWORD) {
      setFormVida({
        fecha_alta: vidaEditTarget.fecha_alta,
        aseguradora: vidaEditTarget.aseguradora,
        gestor: vidaEditTarget.gestor,
        cuotas: '1',
        valor: vidaEditTarget.valor,
        vencimiento: vidaEditTarget.vencimiento,
        pago_monto: vidaEditTarget.pago_monto || '',
        pago_fecha: vidaEditTarget.pago_fecha || '',
      });
      setEditingVidaId(vidaEditTarget.id);
      setShowVidaEditModal(false);
      setVidaEditTarget(null);
      setVidaEditPassword('');
      setVidaEditPasswordError('');
      setModalVida('new');
    } else {
      setVidaEditPasswordError('Contraseña incorrecta');
    }
  };
  const cancelVidaEdit = () => {
    setShowVidaEditModal(false);
    setVidaEditTarget(null);
    setVidaEditPassword('');
    setVidaEditPasswordError('');
  };

  // Payment-only edit gate
  const requestEditPagoVida = (seg) => {
    setVidaPagoEditTarget(seg);
    setVidaPagoEditPassword('');
    setVidaPagoEditPasswordError('');
    setShowVidaPagoEditModal(true);
  };
  const confirmVidaPagoEdit = () => {
    if (vidaPagoEditPassword === UNLOCK_PASSWORD) {
      // Pre-fill pending with current saved values so inputs are not empty
      setPendingPagoVida(prev => ({
        ...prev,
        [vidaPagoEditTarget.id]: {
          monto: vidaPagoEditTarget.pago_monto || '',
          fecha: vidaPagoEditTarget.pago_fecha || new Date().toISOString().split('T')[0],
        },
      }));
      setEditingPagoVidaId(vidaPagoEditTarget.id);
      setShowVidaPagoEditModal(false);
      setVidaPagoEditTarget(null);
      setVidaPagoEditPassword('');
      setVidaPagoEditPasswordError('');
    } else {
      setVidaPagoEditPasswordError('Contraseña incorrecta');
    }
  };
  const cancelVidaPagoEdit = () => {
    setShowVidaPagoEditModal(false);
    setVidaPagoEditTarget(null);
    setVidaPagoEditPassword('');
    setVidaPagoEditPasswordError('');
  };

  // Commit staged payment to the record
  const saveVidaPago = async (segId) => {
    const p = pendingPagoVida[segId];
    if (!p) return;
    try {
      await api.put(
        `/api/sort-ges/${id}/seguro-vida/${segId}/pago`,
        { monto: p.monto, fecha_pago: p.fecha },
        { withCredentials: true }
      );
      setSegurosVida(prev => prev.map(s =>
        s.id === segId ? { ...s, pago_monto: p.monto, pago_fecha: p.fecha } : s
      ));
      setPendingPagoVida(prev => { const n = { ...prev }; delete n[segId]; return n; });
      setEditingPagoVidaId(null);
      showNotification('success', 'Pago guardado correctamente');
    } catch (err) {
      showNotification('danger', 'Error al guardar el pago');
    }
  };

  const saveVida = async () => {
    try {
      const payload = { ...formVida, cuotas: 1 };
      if (editingVidaId !== null) {
        await api.put(`/api/sort-ges/${id}/seguro-vida/${editingVidaId}`, payload, { withCredentials: true });
        setSegurosVida(prev => prev.map(s => s.id === editingVidaId ? { ...s, ...payload } : s));
        showNotification('success', 'Seguro actualizado');
      } else {
        const res = await api.post(`/api/sort-ges/${id}/seguro-vida`, payload, { withCredentials: true });
        setSegurosVida(prev => [...prev, {
          id:          res.data.id,
          fecha_alta:  res.data.fecha_alta  || '',
          aseguradora: res.data.aseguradora || '',
          gestor:      res.data.gestor      || '',
          cuotas:      '1',
          valor:       res.data.valor       || '',
          vencimiento: res.data.vencimiento || '',
          pago_monto:  '',
          pago_fecha:  '',
        }]);
        showNotification('success', 'Seguro de vida registrado');
      }
    } catch (err) {
      console.error(err);
      showNotification('danger', 'Error al guardar el seguro de vida');
    }
    setModalVida(null);
  };

  const deleteVida = async (segId) => {
    try {
      await api.delete(`/api/sort-ges/${id}/seguro-vida/${segId}`, { withCredentials: true });
      setSegurosVida(prev => prev.filter(s => s.id !== segId));
      if (detailVida === segId) setDetailVida(null);
      showNotification('info', 'Seguro eliminado');
    } catch (err) {
      showNotification('danger', 'Error al eliminar el seguro');
    }
  };

  // ── Seguro de Maternidad CRUD ────────────────────────────────
  const openNuevoMat = () => {
    setFormMat(MAT_EMPTY);
    setEditingMatId(null);
    setModalMat('new');
  };
  const openEditMat = (poliza) => {
    setFormMat({
      gestor:           poliza.gestor || '',
      tipo_pago:        poliza.tipo_pago || '',
      valor_cuota:      poliza.valor_cuota || '',
      total_estimado:   poliza.total_estimado || '',
      fecha_solicitud:  poliza.fecha_solicitud || '',
      fecha_alta:       poliza.fecha_alta || '',
      fecha_liberacion: poliza.fecha_liberacion || '',
      fecha_vencimiento:poliza.fecha_vencimiento || '',
      aseguradora:      poliza.aseguradora || '',
      numero_poliza:    poliza.numero_poliza || '',
    });
    setEditingMatId(poliza.id);
    setModalMat('new');
  };
  const saveMat = async () => {
    try {
      const pagos = buildPagos(formMat.tipo_pago, formMat.valor_cuota, formMat.fecha_alta);
      if (editingMatId !== null) {
        const oldPoliza = segurosMat.find(p => p.id === editingMatId);
        const rebuildPagos = formMat.tipo_pago !== oldPoliza?.tipo_pago
          || formMat.fecha_alta !== oldPoliza?.fecha_alta;
        await api.put(
          `/api/sort-ges/${id}/seguro-mat/${editingMatId}`,
          { ...formMat, rebuildPagos, pagos: rebuildPagos ? pagos : [] },
          { withCredentials: true }
        );
        setSegurosMat(prev => prev.map(p =>
          p.id === editingMatId
            ? { ...p, ...formMat, pagos: rebuildPagos ? pagos : p.pagos }
            : p
        ));
        showNotification('success', 'Póliza actualizada');
      } else {
        const res = await api.post(
          `/api/sort-ges/${id}/seguro-mat`,
          { ...formMat, pagos },
          { withCredentials: true }
        );
        const data = res.data;
        setSegurosMat(prev => [...prev, {
          id:               data.id,
          gestor:           data.gestor            || '',
          tipo_pago:        data.tipo_pago         || '',
          valor_cuota:      data.valor_cuota       || '',
          total_estimado:   data.total_estimado    || '',
          fecha_solicitud:  data.fecha_solicitud   || '',
          fecha_alta:       data.fecha_alta        || '',
          fecha_liberacion: data.fecha_liberacion  || '',
          fecha_vencimiento:data.fecha_vencimiento || '',
          aseguradora:      data.aseguradora       || '',
          numero_poliza:    data.numero_poliza     || '',
          pagos: (data.pagos || []).map(c => ({
            cuota_num:  c.cuota_num,
            total:      c.total_cuotas,
            vencimiento:c.vencimiento || '',
            fecha_pago: c.fecha_pago  || '',
            monto_pago: c.monto_pago  || '',
            status:     c.status      || 'pendiente',
          })),
        }]);
        showNotification('success', 'Seguro de maternidad registrado');
      }
    } catch (err) {
      console.error(err);
      showNotification('danger', 'Error al guardar el seguro de maternidad');
    }
    setEditingMatId(null);
    setModalMat(null);
  };

  const deleteMat = async (polizaId) => {
    try {
      await api.delete(`/api/sort-ges/${id}/seguro-mat/${polizaId}`, { withCredentials: true });
      setSegurosMat(prev => prev.filter(p => p.id !== polizaId));
      showNotification('info', 'Póliza eliminada');
    } catch (err) {
      showNotification('danger', 'Error al eliminar la póliza');
    }
  };

  // Password gate for editing/removing a cuota payment
  const [showMatPagoEditModal, setShowMatPagoEditModal] = useState(false);
  const [matPagoEditAction, setMatPagoEditAction] = useState(null); // { type: 'edit'|'remove', polizaId, cuotaNum, valorSugerido }
  const [matPagoEditPassword, setMatPagoEditPassword] = useState('');
  const [matPagoEditPasswordError, setMatPagoEditPasswordError] = useState('');

  const requestMatPagoAction = (type, polizaId, cuotaNum, valorSugerido) => {
    setMatPagoEditAction({ type, polizaId, cuotaNum, valorSugerido });
    setMatPagoEditPassword('');
    setMatPagoEditPasswordError('');
    setShowMatPagoEditModal(true);
  };
  const confirmMatPagoAction = async () => {
    if (matPagoEditPassword !== UNLOCK_PASSWORD) {
      setMatPagoEditPasswordError('Contraseña incorrecta');
      return;
    }
    const { type, polizaId, cuotaNum, valorSugerido } = matPagoEditAction;
    if (type === 'edit') {
      openPagoModal(polizaId, cuotaNum, valorSugerido);
    } else if (type === 'remove') {
      try {
        await api.delete(
          `/api/sort-ges/${id}/seguro-mat/${polizaId}/cuotas/${cuotaNum}/pago`,
          { withCredentials: true }
        );
        setSegurosMat(prev => prev.map(p => {
          if (p.id !== polizaId) return p;
          return {
            ...p,
            pagos: p.pagos.map(c =>
              c.cuota_num === cuotaNum
                ? { ...c, fecha_pago: '', monto_pago: '', status: 'pendiente' }
                : c
            ),
          };
        }));
        showNotification('info', 'Pago eliminado');
      } catch (err) {
        showNotification('danger', 'Error al eliminar el pago');
      }
    }
    setShowMatPagoEditModal(false);
    setMatPagoEditAction(null);
    setMatPagoEditPassword('');
    setMatPagoEditPasswordError('');
  };
  const cancelMatPagoAction = () => {
    setShowMatPagoEditModal(false);
    setMatPagoEditAction(null);
    setMatPagoEditPassword('');
    setMatPagoEditPasswordError('');
  };

  // Open "Pagar" modal for a specific cuota — pre-fill amount and today's date
  const openPagoModal = (polizaId, cuotaNum, valorSugerido) => {
    setPagoTarget({ polizaId, cuotaNum, valorSugerido });
    setFechaPagoInput(new Date().toISOString().split('T')[0]);
    setMontoPagoInput(valorSugerido ? String(valorSugerido) : '');
    setModalMat('pago');
  };
  const savePago = async () => {
    try {
      await api.put(
        `/api/sort-ges/${id}/seguro-mat/${pagoTarget.polizaId}/cuotas/${pagoTarget.cuotaNum}`,
        { monto_pago: montoPagoInput, fecha_pago: fechaPagoInput, status: 'abonado' },
        { withCredentials: true }
      );
      setSegurosMat(prev => prev.map(p => {
        if (p.id !== pagoTarget.polizaId) return p;
        return {
          ...p,
          pagos: p.pagos.map(c =>
            c.cuota_num === pagoTarget.cuotaNum
              ? { ...c, fecha_pago: fechaPagoInput, monto_pago: montoPagoInput, status: 'abonado' }
              : c
          ),
        };
      }));
      setModalMat(null);
      showNotification('success', 'Pago registrado');
    } catch (err) {
      showNotification('danger', 'Error al registrar el pago');
    }
  };
  const anularCuota = (polizaId, cuotaNum) => {
    setSegurosMat(prev => prev.map(p => {
      if (p.id !== polizaId) return p;
      return {
        ...p,
        pagos: p.pagos.map(c =>
          c.cuota_num === cuotaNum ? { ...c, status: 'cancelado', fecha_pago: '' } : c
        ),
      };
    }));
  };

  // ── Psico Inicial handlers ───────────────────────────────────
  const handlePsicoInicialChange = async (rowId, field, value) => {
    setPsicoInicial(prev => prev.map(r => r.id === rowId ? { ...r, [field]: value } : r));
    try {
      const row = psicoInicial.find(r => r.id === rowId);
      await api.put(
        `/api/sort-ges/${id}/psico-inicial/${rowId}`,
        { fecha: row.fecha, estado: row.estado, recomendacion: row.recomendacion, [field]: value },
        { withCredentials: true }
      );
    } catch (err) {
      console.error('Error saving psico inicial:', err);
    }
  };

  // ── Seguimiento Psicológico handlers ────────────────────────
  const addSeguimiento = async () => {
    try {
      const res = await api.post(
        `/api/sort-ges/${id}/seguimiento`,
        { ...SEG_EMPTY },
        { withCredentials: true }
      );
      const newId = res.data.id;
      setSeguimientos(prev => [...prev, { id: newId, ...SEG_EMPTY }]);
      setSeguimientoOpen(prev => [...prev, newId]);
    } catch (err) {
      showNotification('danger', 'Error al crear el seguimiento');
    }
  };

  const updateSeguimiento = async (segId, field, value) => {
    setSeguimientos(prev => prev.map(s => s.id === segId ? { ...s, [field]: value } : s));
    try {
      const seg = seguimientos.find(s => s.id === segId);
      await api.put(
        `/api/sort-ges/${id}/seguimiento/${segId}`,
        { ...seg, [field]: value },
        { withCredentials: true }
      );
    } catch (err) {
      console.error('Error saving seguimiento:', err);
    }
  };

  const deleteSeguimiento = async (segId) => {
    try {
      await api.delete(`/api/sort-ges/${id}/seguimiento/${segId}`, { withCredentials: true });
      setSeguimientos(prev => prev.filter(s => s.id !== segId));
      setSeguimientoOpen(prev => prev.filter(openId => openId !== segId));
    } catch (err) {
      showNotification('danger', 'Error al eliminar el seguimiento');
    }
  };

  const toggleSeguimientoOpen = (segId) => {
    setSeguimientoOpen(prev =>
      prev.includes(segId) ? prev.filter(id => id !== segId) : [...prev, segId]
    );
  };

  // Auto-derive status from programar date
  const deriveSeguimientoStatus = (seg) => {
    if (!seg.programar) return 'sin_dts';
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const prog = new Date(seg.programar);
    if (seg.asistencia === 'asistio') return 'completado';
    if (prog < hoy) return 'reprogramar';
    return 'programada';
  };

  // ── Historial gate handlers ──────────────────────────────────
  const requestHistorialUnlock = (segId) => {
    setHistorialTargetId(segId);
    setHistorialPassword('');
    setHistorialPasswordError('');
    setShowHistorialModal(true);
  };

  const confirmHistorialUnlock = () => {
    if (historialPassword === UNLOCK_PASSWORD) {
      setHistorialUnlocked(prev => ({ ...prev, [historialTargetId]: true }));
      setShowHistorialModal(false);
      setHistorialTargetId(null);
      setHistorialPassword('');
      setHistorialPasswordError('');
    } else {
      setHistorialPasswordError('Contraseña incorrecta');
    }
  };

  const cancelHistorialUnlock = () => {
    setShowHistorialModal(false);
    setHistorialTargetId(null);
    setHistorialPassword('');
    setHistorialPasswordError('');
  };

  // ─────────────────────────────────────────────────────────────
  // Unified field locking — works for ALL tabs
  // Key format: "section.field"  (section can be any string, e.g. "psico.1.fecha")
  // ─────────────────────────────────────────────────────────────
  const isFieldLocked = (section, field) => lockedFields[`${section}.${field}`] === true;

  const lockField = (section, field) => {
    setLockedFields(prev => ({ ...prev, [`${section}.${field}`]: true }));
  };

  const handleFieldFocus = (section, field, currentValue) => {
    activeEditingFieldRef.current = { section, field, initialValue: currentValue || '' };
  };

  const handleFieldBlur = (section, field, currentValue) => {
    const activeField = activeEditingFieldRef.current;
    if (activeField.section !== section || activeField.field !== field) return;
    if (!currentValue || currentValue === '' || isFieldLocked(section, field)) {
      activeEditingFieldRef.current = { section: null, field: null, initialValue: null };
      return;
    }
    if (field === 'edad' || field === 'imc' || field === 'imc_clasificacion') {
      activeEditingFieldRef.current = { section: null, field: null, initialValue: null };
      return;
    }
    if (currentValue !== activeField.initialValue) {
      setPendingFieldLock({ section, field, value: currentValue });
      setShowConfirmModal(true);
    }
    activeEditingFieldRef.current = { section: null, field: null, initialValue: null };
  };

  const confirmFieldLock = () => {
    const { section, field } = pendingFieldLock;
    lockField(section, field);
    setShowConfirmModal(false);
    setPendingFieldLock({ section: null, field: null, value: null });
    showNotification('success', 'Campo guardado y bloqueado');
  };

  const cancelFieldLock = () => {
    setShowConfirmModal(false);
    setPendingFieldLock({ section: null, field: null, value: null });
  };

  const requestUnlock = (section, field) => {
    setFieldToUnlock({ section, field });
    setUnlockPassword('');
    setPasswordError('');
    setShowPasswordModal(true);
  };

  const verifyPasswordAndUnlock = () => {
    if (unlockPassword === UNLOCK_PASSWORD) {
      const { section, field } = fieldToUnlock;
      setLockedFields(prev => {
        const n = { ...prev };
        delete n[`${section}.${field}`];
        return n;
      });
      setShowPasswordModal(false);
      setFieldToUnlock({ section: null, field: null });
      setUnlockPassword('');
      setPasswordError('');
      showNotification('success', 'Campo desbloqueado para edición');
    } else {
      setPasswordError('Contraseña incorrecta');
    }
  };

  const cancelUnlock = () => {
    setShowPasswordModal(false);
    setFieldToUnlock({ section: null, field: null });
    setUnlockPassword('');
    setPasswordError('');
  };

  // ─────────────────────────────────────────────────────────────
  // Lockable field renderers
  // ─────────────────────────────────────────────────────────────

  // Lock icon button — reused in all renderers
  const LockBtn = ({ section, field }) => (
    <CButton
      color="warning" variant="outline" size="sm"
      onClick={() => requestUnlock(section, field)}
      title="Editar campo"
      style={{ borderRadius: '0 4px 4px 0', whiteSpace: 'nowrap' }}
    >
      <CIcon icon={cilLockLocked} />
    </CButton>
  );

  // ── Standard input (Alta GESCA, Checklist) ───────────────────
  const renderLockableInput = (section, field, value, onChange, props = {}) => {
    const locked = isFieldLocked(section, field);
    const { type = 'text', placeholder = '', disabled: propsDisabled, ...restProps } = props;
    return (
      <CInputGroup>
        <CFormInput
          type={type} name={field} value={value || ''}
          onChange={onChange}
          onFocus={(e) => handleFieldFocus(section, field, e.target.value)}
          onBlur={(e) => handleFieldBlur(section, field, e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } }}
          placeholder={placeholder}
          disabled={locked || propsDisabled}
          style={locked ? { backgroundColor: '#e9ecef' } : {}}
          {...restProps}
        />
        {locked
          ? <LockBtn section={section} field={field} />
          : value
            ? <CInputGroupText style={{ backgroundColor: 'transparent', border: 'none' }}>
                <CIcon icon={cilLockUnlocked} className="text-muted" style={{ opacity: 0.4 }} />
              </CInputGroupText>
            : null
        }
      </CInputGroup>
    );
  };

  // ── Standard select (Alta GESCA, Checklist) ──────────────────
  const renderLockableSelect = (section, field, value, onChange, options, props = {}) => {
    const locked = isFieldLocked(section, field);
    const handleChange = (e) => {
      onChange(e);
      const currentValue = e.target.value;
      const initialValue = activeEditingFieldRef.current.initialValue;
      if (currentValue && currentValue !== '' && currentValue !== initialValue) {
        setPendingFieldLock({ section, field, value: currentValue });
        setShowConfirmModal(true);
        activeEditingFieldRef.current = { section: null, field: null, initialValue: null };
      }
    };
    return (
      <CInputGroup>
        <CFormSelect
          name={field} value={value || ''}
          onChange={handleChange}
          onFocus={(e) => handleFieldFocus(section, field, e.target.value)}
          onBlur={(e) => handleFieldBlur(section, field, e.target.value)}
          disabled={locked}
          style={locked ? { backgroundColor: '#e9ecef' } : {}}
          {...props}
        >
          {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </CFormSelect>
        {locked
          ? <LockBtn section={section} field={field} />
          : value
            ? <CInputGroupText style={{ backgroundColor: 'transparent', border: 'none' }}>
                <CIcon icon={cilLockUnlocked} className="text-muted" style={{ opacity: 0.4 }} />
              </CInputGroupText>
            : null
        }
      </CInputGroup>
    );
  };

  // ── Table cell input (Psico Inicial) ─────────────────────────
  // section = e.g. "psico_row_1"
  const renderTableInput = (section, field, value, onChange, type = 'text') => {
    const locked = isFieldLocked(section, field);
    return (
      <CInputGroup size="sm">
        <CFormInput
          type={type}
          size="sm"
          value={value || ''}
          onChange={onChange}
          onFocus={() => handleFieldFocus(section, field, value)}
          onBlur={(e) => handleFieldBlur(section, field, e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } }}
          disabled={locked}
          style={locked ? { backgroundColor: '#e9ecef' } : {}}
        />
        {locked && <LockBtn section={section} field={field} />}
      </CInputGroup>
    );
  };

  // ── Table cell select (Psico Inicial) ────────────────────────
  const renderTableSelect = (section, field, value, onChange, options) => {
    const locked = isFieldLocked(section, field);
    const handleChange = (e) => {
      onChange(e);
      const cv = e.target.value;
      const init = activeEditingFieldRef.current.initialValue;
      if (cv && cv !== '' && cv !== init) {
        setPendingFieldLock({ section, field, value: cv });
        setShowConfirmModal(true);
        activeEditingFieldRef.current = { section: null, field: null, initialValue: null };
      }
    };
    return (
      <CInputGroup size="sm">
        <CFormSelect
          size="sm"
          value={value || ''}
          onChange={handleChange}
          onFocus={() => handleFieldFocus(section, field, value)}
          onBlur={(e) => handleFieldBlur(section, field, e.target.value)}
          disabled={locked}
          style={locked ? { backgroundColor: '#e9ecef' } : {}}
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </CFormSelect>
        {locked && <LockBtn section={section} field={field} />}
      </CInputGroup>
    );
  };

  // ── Seguimiento input (scoped by segId) ──────────────────────
  const renderSegInput = (segId, field, value, type = 'text', placeholder = '') => {
    const section = `seg_${segId}`;
    const locked = isFieldLocked(section, field);
    return (
      <CInputGroup size="sm">
        <CFormInput
          type={type}
          size="sm"
          value={value || ''}
          placeholder={placeholder}
          onChange={e => updateSeguimiento(segId, field, e.target.value)}
          onFocus={() => handleFieldFocus(section, field, value)}
          onBlur={(e) => handleFieldBlur(section, field, e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } }}
          disabled={locked}
          style={locked ? { backgroundColor: '#e9ecef' } : {}}
        />
        {locked
          ? <LockBtn section={section} field={field} />
          : value
            ? <CInputGroupText style={{ backgroundColor: 'transparent', border: 'none' }}>
                <CIcon icon={cilLockUnlocked} className="text-muted" style={{ opacity: 0.4 }} />
              </CInputGroupText>
            : null
        }
      </CInputGroup>
    );
  };

  // ── Seguimiento select (scoped by segId) ─────────────────────
  const renderSegSelect = (segId, field, value, options) => {
    const section = `seg_${segId}`;
    const locked = isFieldLocked(section, field);
    const handleChange = (e) => {
      updateSeguimiento(segId, field, e.target.value);
      const cv = e.target.value;
      const init = activeEditingFieldRef.current.initialValue;
      if (cv && cv !== '' && cv !== init) {
        setPendingFieldLock({ section, field, value: cv });
        setShowConfirmModal(true);
        activeEditingFieldRef.current = { section: null, field: null, initialValue: null };
      }
    };
    return (
      <CInputGroup size="sm">
        <CFormSelect
          size="sm"
          value={value || ''}
          onChange={handleChange}
          onFocus={() => handleFieldFocus(section, field, value)}
          onBlur={(e) => handleFieldBlur(section, field, e.target.value)}
          disabled={locked}
          style={locked ? { backgroundColor: '#e9ecef' } : {}}
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </CFormSelect>
        {locked
          ? <LockBtn section={section} field={field} />
          : value
            ? <CInputGroupText style={{ backgroundColor: 'transparent', border: 'none' }}>
                <CIcon icon={cilLockUnlocked} className="text-muted" style={{ opacity: 0.4 }} />
              </CInputGroupText>
            : null
        }
      </CInputGroup>
    );
  };

  // ── Lockable checkbox ────────────────────────────────────────
  // For checkboxes: lock fires immediately on check, not on blur
  const renderLockableCheck = (section, field, checked, onChange, label) => {
    const locked = isFieldLocked(section, field);
    return (
      <div className="d-flex align-items-center gap-2">
        <CFormCheck
          id={`${section}_${field}`}
          label={label}
          checked={!!checked}
          disabled={locked}
          onChange={(e) => {
            if (locked) return;
            onChange(e);
            // Only lock when checking ON (not unchecking)
            if (e.target.checked) {
              setPendingFieldLock({ section, field, value: 'checked' });
              setShowConfirmModal(true);
            }
          }}
        />
        {locked && (
          <CButton
            color="warning" variant="outline" size="sm"
            onClick={() => requestUnlock(section, field)}
            title="Editar campo"
            style={{ padding: '1px 6px', fontSize: '0.75rem' }}
          >
            <CIcon icon={cilLockLocked} />
          </CButton>
        )}
      </div>
    );
  };

  // Tab 1 + Tab 2 — triggered by the global "Guardar cambios" button
  const handleSave = async () => {
    try {
      setSaving(true);
      await Promise.all([
        api.put(`/api/sort-ges/${id}/alta-gesca`, {
          ...registroInicial,
          ...datosSalud,
          locked_fields: lockedFields,
        }, { withCredentials: true }),
        api.put(`/api/sort-ges/${id}/checklist`, {
          certificado_nacimiento_url: documentos.certificado_nacimiento?.name || null,
          curp_url:                   documentos.curp?.name                   || null,
          comprobante_domicilio_url:  documentos.comprobante_domicilio?.name  || null,
          poliza_seguro_url:          documentos.poliza_seguro?.name          || null,
          cita_entrega:               documentos.cita_entrega                 || null,
          cita_firma:                 consentimientos.cita_firma              || null,
          consentimiento_informado:     consentimientos.consentimiento_informado,
          consentimiento_transferencia: consentimientos.consentimiento_transferencia,
          aviso_privacidad:             consentimientos.aviso_privacidad,
          informacion_personal:         consentimientos.informacion_personal,
          regular:                      consentimientos.regular,
          hiv:                          consentimientos.hiv,
          gemelar:                      consentimientos.gemelar,
          full_consent:                 consentimientos.full,
        }, { withCredentials: true }),
      ]);
      showNotification('success', 'Datos guardados correctamente');
    } catch (err) {
      console.error('Error saving:', err);
      showNotification('danger', 'Error al guardar los datos');
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Status helpers
  // ─────────────────────────────────────────────────────────────
  const getStatusBadge = (status) => {
    const map = {
      iniciales:  { label: 'Iniciales',  color: 'info'      },
      en_proceso: { label: 'En Proceso', color: 'warning'   },
      aprobado:   { label: 'Aprobado',   color: 'success'   },
      rechazado:  { label: 'Rechazado',  color: 'danger'    },
    };
    return map[status] || { label: status, color: 'secondary' };
  };

  const getIMCBadgeColor = (clasificacion) => {
    const map = {
      'Bajo peso': 'warning', 'Peso normal': 'success',
      'Riesgo de sobrepeso': 'info', 'Sobrepeso': 'warning', 'Obesidad': 'danger',
    };
    return map[clasificacion] || 'secondary';
  };

  const getDocumentosStatus = () => {
    const docs = [documentos.certificado_nacimiento, documentos.curp, documentos.comprobante_domicilio, documentos.poliza_seguro];
    const n = docs.filter(Boolean).length;
    if (n === 0) return { label: 'Sin dts', color: 'secondary' };
    if (n === 4) return { label: 'Completado', color: 'success' };
    return { label: 'Incompleto', color: 'warning' };
  };

  const getCitaEntregaStatus = () => {
    const docStatus = getDocumentosStatus();
    if (docStatus.label === 'Completado') return { label: 'Completado', color: 'success' };
    if (documentos.cita_entrega) {
      const citaDate = new Date(documentos.cita_entrega);
      const today = new Date(); today.setHours(0,0,0,0); citaDate.setHours(0,0,0,0);
      return citaDate < today ? { label: 'Reprogramar', color: 'danger' } : { label: 'Programada', color: 'info' };
    }
    return { label: 'Sin dts', color: 'secondary' };
  };

  const getConsentimientosStatus = () => {
    const checks = [
      consentimientos.consentimiento_informado, consentimientos.consentimiento_transferencia,
      consentimientos.aviso_privacidad, consentimientos.informacion_personal,
      consentimientos.regular, consentimientos.hiv, consentimientos.gemelar, consentimientos.full,
    ];
    const n = checks.filter(Boolean).length;
    if (n === 0) return { label: 'Sin dts', color: 'secondary' };
    if (n === 8) return { label: 'Completado', color: 'success' };
    return { label: 'Incompleto', color: 'warning' };
  };

  const getCitaFirmaStatus = () => {
    const s = getConsentimientosStatus();
    if (s.label === 'Completado') return { label: 'Completado', color: 'success' };
    if (consentimientos.cita_firma) {
      const citaDate = new Date(consentimientos.cita_firma);
      const today = new Date(); today.setHours(0,0,0,0); citaDate.setHours(0,0,0,0);
      return citaDate < today ? { label: 'Reprogramar', color: 'danger' } : { label: 'Programada', color: 'info' };
    }
    return { label: 'Sin dts', color: 'secondary' };
  };

  // ─────────────────────────────────────────────────────────────
  // Document upload helpers
  // ─────────────────────────────────────────────────────────────
  const handleDocumentUpload = (fieldName, event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setDocumentos(prev => ({ ...prev, [fieldName]: { name: file.name, file, uploadedAt: new Date().toISOString() } }));
      showNotification('success', `Archivo "${file.name}" cargado correctamente`);
    } else if (file) {
      showNotification('danger', 'Por favor seleccione un archivo PDF');
    }
  };

  const handleRemoveDocument = (fieldName) => {
    setDocumentos(prev => ({ ...prev, [fieldName]: null }));
    showNotification('info', 'Archivo eliminado');
  };

  const handleConsentimientoChange = (fieldName) => {
    setConsentimientos(prev => ({ ...prev, [fieldName]: !prev[fieldName] }));
  };

  // ─────────────────────────────────────────────────────────────
  // Render helpers
  // ─────────────────────────────────────────────────────────────

  /** Reusable money input */
  const renderMoneyInput = (stateObj, fieldName, handler, placeholder = '0.00') => (
    <CInputGroup>
      <CInputGroupText>$</CInputGroupText>
      <CFormInput
        type="number" min="0" step="0.01"
        name={fieldName}
        value={stateObj[fieldName]}
        onChange={handler}
        placeholder={placeholder}
      />
    </CInputGroup>
  );

  // ─────────────────────────────────────────────────────────────
  // Loading / error guards
  // ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <CContainer className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <CSpinner color="primary" />
      </CContainer>
    );
  }

  if (error || !candidate) {
    return (
      <CContainer className="mx-5">
        <CAlert color="danger">{error || 'Candidato no encontrado'}</CAlert>
        <CButton color="secondary" onClick={() => navigate('/babysite/sortGes')}>
          <CIcon icon={cilArrowLeft} className="me-2" />Volver a la lista
        </CButton>
      </CContainer>
    );
  }

  const statusInfo = getStatusBadge(candidate.status);

  // ═════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════
  return (
    <CContainer fluid>
      {alert.show && (
        <CAlert className="mx-3" color={alert.type} dismissible onClose={() => setAlert({ show: false })}>
          {alert.message}
        </CAlert>
      )}

      <CCard className="mb-4 mx-3">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Listado de Sort_GESC</strong>
          <div className="d-flex align-items-center gap-2">
            <CButton color="light" variant="ghost" className="rounded-circle">
              <CIcon icon={cilFile} />
            </CButton>
            <CButton color="primary" style={{ backgroundColor: '#d97ea1', borderColor: '#d97ea1', borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}>
              <CIcon icon={cilFile} />
            </CButton>
          </div>
        </CCardHeader>

        <CCardBody>
          {/* Candidate header */}
          <CRow className="mb-4">
            <CCol md={8}>
              <div className="d-flex align-items-start">
                <div>
                  <h3 className="mb-1" style={{ color: '#5856d6' }}>
                    {candidate.nombre_completo || `Candidato #${candidate.id}`}
                  </h3>
                  <p className="text-muted mb-1">
                    {[candidate.direccion, candidate.numero].filter(Boolean).join(' ')}
                  </p>
                  <p className="text-muted mb-1">
                    {[candidate.postal, candidate.ciudad, candidate.estado].filter(Boolean).join(' - ')}
                  </p>
                  <p className="text-muted mb-1">{candidate.telefono}</p>
                  <p className="mb-1">Status: <CBadge color={statusInfo.color}>{statusInfo.label}</CBadge></p>
                  <p className="text-muted mb-0"><strong>IP:</strong> {candidate.ip_responsable}</p>
                </div>
                <div className="ms-3">
                  <CButton color="light" variant="outline" size="sm" style={{ color: '#dc3545' }}>
                    <CIcon icon={cilFile} className="me-1" />PDF
                  </CButton>
                </div>
              </div>
            </CCol>
            <CCol md={4} className="text-end">
              <CAvatar src={candidate.foto} size="xl" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover' }} />
            </CCol>
          </CRow>

          {/* Tab navigation */}
          <CNav variant="tabs" className="mb-3" style={{ borderBottom: 'none' }}>
            {TAB_CONFIG.map((tab) => (
              <CNavItem key={tab.id}>
                <CNavLink
                  active={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    backgroundColor: activeTab === tab.id ? tab.color : 'transparent',
                    color: activeTab === tab.id ? '#fff' : tab.color,
                    border: `2px solid ${tab.color}`,
                    borderRadius: '8px', marginRight: '8px',
                    padding: '10px 20px', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}
                >
                  <CIcon icon={tab.icon} />{tab.label}
                </CNavLink>
              </CNavItem>
            ))}
          </CNav>

          {/* ════════════════════════════════════════════════════
              TAB CONTENT
          ════════════════════════════════════════════════════ */}
          <CTabContent>

            {/* ── ALTA GESCA ─────────────────────────────────── */}
            <CTabPane visible={activeTab === 'alta-gesca'}>
              <CAccordion activeItemKey={1} alwaysOpen>
                <CAccordionItem itemKey={1}>
                  <CAccordionHeader><strong>Registro Inicial / Datos personales</strong></CAccordionHeader>
                  <CAccordionBody>
                    <CRow>
                      <CCol md={4}>
                        {[
                          ['Nombre completo:', 'nombre_completo', { placeholder: 'Nombre completo' }],
                          ['CURP:', 'curp', { placeholder: 'CURP', maxLength: 18 }],
                          ['RFC:', 'rfc', { placeholder: 'RFC' }],
                          ['Tel 1:', 'tel_1', { placeholder: 'Teléfono 1' }],
                          ['Tel 2:', 'tel_2', { placeholder: 'Teléfono 2' }],
                          ['Email:', 'email', { type: 'email', placeholder: 'correo@ejemplo.com' }],
                        ].map(([label, field, props]) => (
                          <div className="mb-2" key={field}>
                            <CFormLabel>{label}</CFormLabel>
                            {renderLockableInput('registroInicial', field, registroInicial[field], handleRegistroInicialChange, props)}
                          </div>
                        ))}
                        <div className="mb-2">
                          <CFormLabel>Esquema ofrecido:</CFormLabel>
                          {renderLockableSelect('registroInicial', 'esquema_ofrecido', registroInicial.esquema_ofrecido, handleRegistroInicialChange, esquemaOptions)}
                        </div>
                        <div className="mb-2">
                          <CFormLabel>Estado civil:</CFormLabel>
                          {renderLockableSelect('registroInicial', 'estado_civil', registroInicial.estado_civil, handleRegistroInicialChange, estadoCivilOptions)}
                        </div>
                      </CCol>
                      <CCol md={8}>
                        <div className="mb-2">
                          <CFormLabel>RNI:</CFormLabel>
                          {renderLockableInput('registroInicial', 'rni', registroInicial.rni, handleRegistroInicialChange, { placeholder: 'RNI' })}
                        </div>
                        <CRow>
                          <CCol md={6}>
                            <div className="mb-2">
                              <CFormLabel>Fecha de nacimiento:</CFormLabel>
                              {renderLockableInput('registroInicial', 'fecha_nacimiento', registroInicial.fecha_nacimiento, handleRegistroInicialChange, { type: 'date' })}
                            </div>
                          </CCol>
                          <CCol md={6}>
                            <div className="mb-2">
                              <CFormLabel>Edad:</CFormLabel>
                              <CFormInput name="edad" value={registroInicial.edad} readOnly disabled placeholder="Automático" />
                            </div>
                          </CCol>
                        </CRow>
                        <CRow>
                          <CCol md={4}>
                            <div className="mb-2">
                              <CFormLabel>Banco:</CFormLabel>
                              {renderLockableInput('registroInicial', 'banco', registroInicial.banco, handleRegistroInicialChange, { placeholder: 'Banco' })}
                            </div>
                          </CCol>
                          <CCol md={8}>
                            <div className="mb-2">
                              <CFormLabel>CLABE Interbancaria:</CFormLabel>
                              {renderLockableInput('registroInicial', 'clabe_interbancaria', registroInicial.clabe_interbancaria, handleRegistroInicialChange, { placeholder: '18 dígitos', maxLength: 18 })}
                            </div>
                          </CCol>
                        </CRow>
                        <div className="mb-2">
                          <CFormLabel>Dirección:</CFormLabel>
                          {renderLockableInput('registroInicial', 'direccion', registroInicial.direccion, handleRegistroInicialChange, { placeholder: 'Calle y nombre' })}
                        </div>
                        <CRow>
                          <CCol md={6}>
                            <div className="mb-2">
                              <CFormLabel>Número:</CFormLabel>
                              {renderLockableInput('registroInicial', 'numero', registroInicial.numero, handleRegistroInicialChange, { placeholder: 'Ext/Int' })}
                            </div>
                          </CCol>
                          <CCol md={6}>
                            <div className="mb-2">
                              <CFormLabel>Código Postal:</CFormLabel>
                              {renderLockableInput('registroInicial', 'postal', registroInicial.postal, handleRegistroInicialChange, { placeholder: 'C.P.', maxLength: 5 })}
                            </div>
                          </CCol>
                        </CRow>
                        <CRow>
                          <CCol md={6}>
                            <div className="mb-2">
                              <CFormLabel>Alcaldía o municipio:</CFormLabel>
                              {renderLockableInput('registroInicial', 'alcaldia_municipio', registroInicial.alcaldia_municipio, handleRegistroInicialChange, { placeholder: 'Alcaldía/Municipio' })}
                            </div>
                          </CCol>
                          <CCol md={6}>
                            <div className="mb-2">
                              <CFormLabel>Estado:</CFormLabel>
                              {renderLockableInput('registroInicial', 'estado', registroInicial.estado, handleRegistroInicialChange, { placeholder: 'Estado' })}
                            </div>
                          </CCol>
                        </CRow>
                        <div className="mb-2">
                          <CFormLabel>Ocupación (especificar):</CFormLabel>
                          {renderLockableInput('registroInicial', 'ocupacion', registroInicial.ocupacion, handleRegistroInicialChange, { placeholder: 'Ocupación' })}
                        </div>
                      </CCol>
                    </CRow>
                  </CAccordionBody>
                </CAccordionItem>

                <CAccordionItem itemKey={2}>
                  <CAccordionHeader><strong>Datos de Salud Iniciales de Requisitos al Programa</strong></CAccordionHeader>
                  <CAccordionBody>
                    <CRow>
                      <CCol md={6}>
                        <CRow>
                          <CCol md={6}>
                            <div className="mb-2">
                              <CFormLabel>Tipo de sangre:</CFormLabel>
                              {renderLockableSelect('datosSalud', 'tipo_sangre', datosSalud.tipo_sangre, handleDatosSaludChange, tipoSangreOptions)}
                            </div>
                          </CCol>
                          <CCol md={6}>
                            <div className="mb-2">
                              <CFormLabel>IMC:</CFormLabel>
                              <CInputGroup>
                                <CFormInput name="imc" value={datosSalud.imc} readOnly disabled placeholder="Auto" />
                                {datosSalud.imc_clasificacion && (
                                  <CInputGroupText style={{ padding: '0.25rem 0.5rem' }}>
                                    <CBadge color={getIMCBadgeColor(datosSalud.imc_clasificacion)} style={{ fontSize: '0.7rem' }}>
                                      {datosSalud.imc_clasificacion}
                                    </CBadge>
                                  </CInputGroupText>
                                )}
                              </CInputGroup>
                            </div>
                          </CCol>
                        </CRow>
                        <CRow>
                          <CCol md={6}>
                            <div className="mb-2">
                              <CFormLabel>Peso (kg):</CFormLabel>
                              {renderLockableInput('datosSalud', 'peso', datosSalud.peso, handleDatosSaludChange, { type: 'number', step: '0.1', placeholder: 'kg' })}
                            </div>
                          </CCol>
                          <CCol md={6}>
                            <div className="mb-2">
                              <CFormLabel>Altura (m):</CFormLabel>
                              {renderLockableInput('datosSalud', 'altura', datosSalud.altura, handleDatosSaludChange, { type: 'number', step: '0.01', placeholder: 'm' })}
                            </div>
                          </CCol>
                        </CRow>
                        <CRow>
                          <CCol md={6}>
                            <div className="mb-2">
                              <CFormLabel>Fumador:</CFormLabel>
                              <div className="d-flex align-items-center gap-3 mt-1">
                                <CFormCheck type="radio" name="fumador" id="fumadorSi" label="Sí"
                                  checked={datosSalud.fumador === true}
                                  disabled={isFieldLocked('datosSalud', 'fumador')}
                                  onChange={() => {
                                    if (isFieldLocked('datosSalud', 'fumador')) return;
                                    setDatosSalud(prev => ({ ...prev, fumador: true }));
                                    setPendingFieldLock({ section: 'datosSalud', field: 'fumador', value: 'Sí' });
                                    setShowConfirmModal(true);
                                  }} />
                                <CFormCheck type="radio" name="fumador" id="fumadorNo" label="No"
                                  checked={datosSalud.fumador === false}
                                  disabled={isFieldLocked('datosSalud', 'fumador')}
                                  onChange={() => {
                                    if (isFieldLocked('datosSalud', 'fumador')) return;
                                    setDatosSalud(prev => ({ ...prev, fumador: false }));
                                    setPendingFieldLock({ section: 'datosSalud', field: 'fumador', value: 'No' });
                                    setShowConfirmModal(true);
                                  }} />
                                {isFieldLocked('datosSalud', 'fumador') && (
                                  <CButton color="warning" variant="outline" size="sm"
                                    onClick={() => requestUnlock('datosSalud', 'fumador')}>
                                    <CIcon icon={cilLockLocked} />
                                  </CButton>
                                )}
                              </div>
                            </div>
                          </CCol>
                          <CCol md={6}>
                            <div className="mb-2">
                              <CFormLabel>Fumador desde:</CFormLabel>
                              {renderLockableInput('datosSalud', 'fumador_desde', datosSalud.fumador_desde, handleDatosSaludChange, { type: 'date', disabled: !datosSalud.fumador })}
                            </div>
                          </CCol>
                        </CRow>
                        <CRow>
                          <CCol md={6}>
                            <div className="mb-2">
                              <CFormLabel>Método ACO:</CFormLabel>
                              {renderLockableSelect('datosSalud', 'metodo_aco', datosSalud.metodo_aco, handleDatosSaludChange, metodoAcoOptions)}
                            </div>
                          </CCol>
                          <CCol md={6}>
                            <div className="mb-2">
                              <CFormLabel>Fecha inicio ACO:</CFormLabel>
                              {renderLockableInput('datosSalud', 'tiempo_metodo_aco', datosSalud.tiempo_metodo_aco, handleDatosSaludChange, { type: 'date' })}
                            </div>
                          </CCol>
                        </CRow>
                      </CCol>
                      <CCol md={6}>
                        <CRow>
                          {[['Embarazos:', 'embarazos'], ['Cesáreas:', 'cesareas'], ['Hijos:', 'hijos']].map(([label, field]) => (
                            <CCol md={4} key={field}>
                              <div className="mb-2">
                                <CFormLabel>{label}</CFormLabel>
                                {renderLockableInput('datosSalud', field, datosSalud[field], handleDatosSaludChange, { type: 'number', min: '0', placeholder: '#' })}
                              </div>
                            </CCol>
                          ))}
                        </CRow>
                        <CRow>
                          <CCol md={6}>
                            <div className="mb-2">
                              <CFormLabel>Última menstruación:</CFormLabel>
                              {renderLockableInput('datosSalud', 'fecha_ultima_menstruacion', datosSalud.fecha_ultima_menstruacion, handleDatosSaludChange, { type: 'date' })}
                            </div>
                          </CCol>
                          <CCol md={6}>
                            <div className="mb-2">
                              <CFormLabel>Última cesárea:</CFormLabel>
                              {renderLockableInput('datosSalud', 'ultima_cesarea', datosSalud.ultima_cesarea, handleDatosSaludChange, { type: 'date' })}
                            </div>
                          </CCol>
                        </CRow>
                        <CRow>
                          <CCol md={6}>
                            <div className="mb-2">
                              <CFormLabel>Partos:</CFormLabel>
                              {renderLockableInput('datosSalud', 'partos', datosSalud.partos, handleDatosSaludChange, { type: 'number', min: '0', placeholder: '#' })}
                            </div>
                          </CCol>
                          <CCol md={6}>
                            <div className="mb-2">
                              <CFormLabel>Abortos:</CFormLabel>
                              {renderLockableInput('datosSalud', 'abortos', datosSalud.abortos, handleDatosSaludChange, { type: 'number', min: '0', placeholder: '#' })}
                            </div>
                          </CCol>
                        </CRow>
                      </CCol>
                    </CRow>
                  </CAccordionBody>
                </CAccordionItem>
              </CAccordion>
            </CTabPane>

            {/* ── CHECK LIST ─────────────────────────────────── */}
            <CTabPane visible={activeTab === 'checklist'}>
              <CAccordion alwaysOpen activeItemKey={1}>
                <CAccordionItem itemKey={1}>
                  <CAccordionHeader><strong>Archivado de documentación</strong></CAccordionHeader>
                  <CAccordionBody>
                    <CRow>
                      <CCol md={6}>
                        {[
                          { key: 'certificado_nacimiento', label: 'Certificado de nacimiento:', inputId: 'certificado_nacimiento' },
                          { key: 'curp',                   label: 'CURP:',                       inputId: 'curp_doc'               },
                          { key: 'comprobante_domicilio',  label: 'Comprobante de domicilio:',    inputId: 'comprobante_domicilio'  },
                          { key: 'poliza_seguro',          label: 'Póliza de seguro:',            inputId: 'poliza_seguro'          },
                        ].map(({ key, label, inputId }) => (
                          <div className="mb-3" key={key}>
                            <CFormLabel>{label}</CFormLabel>
                            <div className="d-flex align-items-center gap-2">
                              <input type="file" accept=".pdf" id={inputId} style={{ display: 'none' }} onChange={(e) => handleDocumentUpload(key, e)} />
                              <CButton
                                color={documentos[key] ? 'success' : undefined}
                                style={!documentos[key] ? { borderColor: '#0071b8', color: '#0071b8' } : {}}
                                variant="outline"
                                onClick={() => document.getElementById(inputId).click()}
                                className={`d-flex align-items-center gap-2 ${!documentos[key] ? 'pdf-upload-btn' : ''}`}
                              >
                                <CIcon icon={documentos[key] ? cilFile : cilCloudUpload} />
                                {documentos[key] ? 'PDF' : 'Subir PDF'}
                              </CButton>
                              {documentos[key] && (
                                <>
                                  <span className="text-muted small text-truncate" style={{ maxWidth: '150px' }}>{documentos[key].name}</span>
                                  <CButton color="danger" variant="ghost" size="sm" className="remove-file-btn" onClick={() => handleRemoveDocument(key)}>
                                    <CIcon icon={cilXCircle} />
                                  </CButton>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </CCol>
                      <CCol md={6}>
                        <div className="mb-3">
                          <CFormLabel>Programar cita para entrega:</CFormLabel>
                          <CInputGroup>
                            <CFormInput type="date" value={documentos.cita_entrega}
                              onChange={(e) => setDocumentos(prev => ({ ...prev, cita_entrega: e.target.value }))}
                              disabled={getDocumentosStatus().label === 'Completado'}
                              style={getDocumentosStatus().label === 'Completado' ? { backgroundColor: '#e9ecef' } : {}} />
                            <CInputGroupText>
                              <CBadge color={getCitaEntregaStatus().color}>{getCitaEntregaStatus().label}</CBadge>
                            </CInputGroupText>
                          </CInputGroup>
                        </div>
                        <div className="mb-3">
                          <CFormLabel>Estado de documentación:</CFormLabel>
                          <CInputGroup>
                            <CFormInput value={getDocumentosStatus().label} readOnly disabled style={{ backgroundColor: '#e9ecef' }} />
                            <CInputGroupText>
                              <CBadge color={getDocumentosStatus().color}>{getDocumentosStatus().label}</CBadge>
                            </CInputGroupText>
                          </CInputGroup>
                        </div>
                      </CCol>
                    </CRow>
                  </CAccordionBody>
                </CAccordionItem>

                <CAccordionItem itemKey={2}>
                  <CAccordionHeader><strong>Consentimientos firmados</strong></CAccordionHeader>
                  <CAccordionBody>
                    <CRow className="mb-4">
                      <CCol md={6}>
                        <div className="mb-3">
                          <CFormLabel>Programar cita para firma:</CFormLabel>
                          <CInputGroup>
                            <CFormInput type="date" value={consentimientos.cita_firma}
                              onChange={(e) => setConsentimientos(prev => ({ ...prev, cita_firma: e.target.value }))}
                              disabled={getConsentimientosStatus().label === 'Completado'}
                              style={getConsentimientosStatus().label === 'Completado' ? { backgroundColor: '#e9ecef' } : {}} />
                            <CInputGroupText>
                              <CBadge color={getCitaFirmaStatus().color}>{getCitaFirmaStatus().label}</CBadge>
                            </CInputGroupText>
                          </CInputGroup>
                        </div>
                      </CCol>
                      <CCol md={6}>
                        <div className="mb-3">
                          <CFormLabel>Estado de consentimientos:</CFormLabel>
                          <CInputGroup>
                            <CFormInput value={getConsentimientosStatus().label} readOnly disabled style={{ backgroundColor: '#e9ecef' }} />
                            <CInputGroupText>
                              <CBadge color={getConsentimientosStatus().color}>{getConsentimientosStatus().label}</CBadge>
                            </CInputGroupText>
                          </CInputGroup>
                        </div>
                      </CCol>
                    </CRow>
                    <CRow>
                      <CCol md={6}>
                        {[
                          ['consentimiento_informado',    'Consentimiento informado'],
                          ['consentimiento_transferencia','Consentimiento de transferencia embrionaria'],
                          ['aviso_privacidad',            'Aviso de privacidad'],
                          ['informacion_personal',        'Información personal'],
                        ].map(([field, label]) => (
                          <div className="mb-3" key={field}>
                            {renderLockableCheck(
                              'consentimientos', field,
                              consentimientos[field],
                              () => handleConsentimientoChange(field),
                              label
                            )}
                          </div>
                        ))}
                      </CCol>
                      <CCol md={6}>
                        {[
                          ['regular', 'Regular'],
                          ['hiv',     'HIV'],
                          ['gemelar', 'Gemelar'],
                          ['full',    'Full'],
                        ].map(([field, label]) => (
                          <div className="mb-3" key={field}>
                            {renderLockableCheck(
                              'consentimientos', field,
                              consentimientos[field],
                              () => handleConsentimientoChange(field),
                              label
                            )}
                          </div>
                        ))}
                      </CCol>
                    </CRow>
                  </CAccordionBody>
                </CAccordionItem>
              </CAccordion>
            </CTabPane>

            {/* ══════════════════════════════════════════════════
                SEGURO MED TAB
            ══════════════════════════════════════════════════ */}
            <CTabPane visible={activeTab === 'seguro-med'}>
              <CAccordion alwaysOpen activeItemKey={1}>

                {/* ────────────────────────────────────────────
                    SEGURO DE VIDA
                ──────────────────────────────────────────── */}
                <CAccordionItem itemKey={1}>
                  <CAccordionHeader><strong>Seguro de Vida</strong></CAccordionHeader>
                  <CAccordionBody>

                    {/* ── Cards — each with its own inline detail panel ── */}
                    {segurosVida.length > 0 && (
                      <div className="mb-4">
                        {segurosVida.map((seg) => {
                          const st = getVidaStatus(seg.vencimiento);
                          const isOpen = detailVida === seg.id;
                          const isEditingPago = editingPagoVidaId === seg.id;
                          const pending = pendingPagoVida[seg.id] || {};

                          // Suggested values
                          const sugMonto = seg.valor || '';
                          const sugFecha = new Date().toISOString().split('T')[0];

                          // Difference calculation — use pending monto if staging, else saved
                          const valorNum  = parseFloat(seg.valor) || 0;
                          const liveMonto = pendingPagoVida[seg.id]?.monto ?? seg.pago_monto ?? '';
                          const pagoNum   = parseFloat(liveMonto) || 0;
                          const diff      = valorNum - pagoNum;
                          const hasPago   = !!seg.pago_fecha;

                          return (
                            <div key={seg.id} className="mb-2">
                              {/* ── Header card ── */}
                              <div
                                className="d-flex align-items-center justify-content-between p-3 rounded border"
                                style={{ backgroundColor: '#f8f9fa', borderRadius: isOpen ? '6px 6px 0 0' : '6px' }}
                              >
                                {/* Left: summary fields */}
                                <div className="d-flex gap-4 align-items-center flex-wrap">
                                  <div>
                                    <div className="text-muted small">Estatus</div>
                                    <CBadge color={st.color} style={{ fontSize: '0.8rem' }}>{st.label}</CBadge>
                                  </div>
                                  <div>
                                    <div className="text-muted small">Fecha de alta</div>
                                    <strong>{seg.fecha_alta || '—'}</strong>
                                  </div>
                                  <div>
                                    <div className="text-muted small">Vencimiento cobertura</div>
                                    <strong>{seg.vencimiento || '—'}</strong>
                                  </div>
                                  <div>
                                    <div className="text-muted small">Aseguradora</div>
                                    <span>{seg.aseguradora || '—'}</span>
                                  </div>
                                  {/* Payment indicator */}
                                  {hasPago ? (
                                    <div>
                                      <div className="text-muted small">Pago registrado</div>
                                      <CBadge color="success" style={{ fontSize: '0.78rem' }}>
                                        {seg.pago_fecha}
                                        {seg.pago_monto ? ` · $${Number(seg.pago_monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : ''}
                                      </CBadge>
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="text-muted small">Pago</div>
                                      <CBadge color="secondary" style={{ fontSize: '0.78rem' }}>Sin pago</CBadge>
                                    </div>
                                  )}
                                  {/* Missing amount — shown in header when diff > 0 */}
                                  {valorNum > 0 && diff > 0 && (
                                    <div>
                                      <div className="text-muted small">Falta</div>
                                      <CBadge color="danger" style={{ fontSize: '0.78rem' }}>
                                        ${diff.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                      </CBadge>
                                    </div>
                                  )}
                                </div>

                                {/* Right: actions */}
                                <div className="d-flex gap-2 ms-3 flex-shrink-0">
                                  <CButton
                                    size="sm" color="info" variant="outline"
                                    onClick={() => setDetailVida(isOpen ? null : seg.id)}
                                  >
                                    {isOpen ? 'Ocultar' : 'Ver más'}
                                  </CButton>
                                  <CButton
                                    size="sm" color="warning" variant="outline"
                                    onClick={() => requestEditVida(seg)}
                                    title="Editar info general (requiere contraseña)"
                                  >
                                    <CIcon icon={cilLockLocked} className="me-1" />Editar
                                  </CButton>
                                  <CButton
                                    size="sm" color="danger" variant="outline"
                                    onClick={() => deleteVida(seg.id)}
                                  >
                                    <CIcon icon={cilTrash} />
                                  </CButton>
                                </div>
                              </div>

                              {/* ── Inline detail panel — directly below its own card ── */}
                              {isOpen && (
                                <div
                                  className="border border-top-0 rounded-bottom p-3"
                                  style={{ backgroundColor: '#fff' }}
                                >
                                  {/* Policy info */}
                                  <CRow className="mb-2">
                                    {[
                                      ['Aseguradora', seg.aseguradora],
                                      ['Gestor', seg.gestor],
                                      ['N° de cuotas', '1 (única)'],
                                      ['Valor', seg.valor ? `$${Number(seg.valor).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—'],
                                      ['Fecha de alta', seg.fecha_alta],
                                      ['Vencimiento', seg.vencimiento],
                                    ].map(([label, val]) => (
                                      <CCol md={4} className="mb-2" key={label}>
                                        <div className="text-muted small">{label}</div>
                                        <strong>{val || '—'}</strong>
                                      </CCol>
                                    ))}
                                  </CRow>

                                  {/* Payment section */}
                                  <hr className="my-2" />
                                  <p className="fw-semibold small mb-2 text-uppercase"
                                    style={{ letterSpacing: '0.05em', color: '#899973' }}>
                                    Registro de pago
                                  </p>

                                  {hasPago && !isEditingPago ? (
                                    /* ── Read-only paid state ── */
                                    <div>
                                      <CRow className="mb-2">
                                        <CCol md={3}>
                                          <div className="text-muted small">Monto pagado</div>
                                          <strong>
                                            {seg.pago_monto
                                              ? `$${Number(seg.pago_monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                                              : '—'}
                                          </strong>
                                        </CCol>
                                        <CCol md={3}>
                                          <div className="text-muted small">Fecha de pago</div>
                                          <strong>{seg.pago_fecha}</strong>
                                        </CCol>
                                        <CCol md={3}>
                                          <div className="text-muted small">Estado</div>
                                          <CBadge color={diff > 0 ? 'warning' : 'success'}>
                                            {diff > 0 ? 'Pago parcial' : 'Pagado'}
                                          </CBadge>
                                        </CCol>
                                        <CCol md={3}>
                                          <div className="text-muted small">Diferencia</div>
                                          {valorNum > 0 && (
                                            <span style={{ color: diff > 0 ? '#dc3545' : '#198754', fontWeight: 600 }}>
                                              {diff > 0
                                                ? `Falta $${diff.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                                                : 'Completo'}
                                            </span>
                                          )}
                                        </CCol>
                                      </CRow>
                                      <CButton
                                        size="sm" color="warning" variant="outline"
                                        onClick={() => requestEditPagoVida(seg)}
                                        title="Editar pago (requiere contraseña)"
                                      >
                                        <CIcon icon={cilLockLocked} className="me-1" />Editar pago
                                      </CButton>
                                    </div>

                                  ) : (
                                    /* ── Payment form (new or editing) ── */
                                    <div>
                                      <p className="text-muted small mb-2">
                                        {isEditingPago
                                          ? 'Modifique la información del pago.'
                                          : 'Registre el pago una vez realizado.'}
                                      </p>
                                    <CRow className="align-items-center g-2">
                                        <CCol md={4}>
                                          <CFormLabel className="fw-semibold small text-muted mb-1">
                                            Monto: <span className="text-danger">*</span>
                                          </CFormLabel>
                                          <CInputGroup>
                                            <CInputGroupText>$</CInputGroupText>
                                            <CFormInput
                                              type="number" min="0" step="0.01"
                                              placeholder={sugMonto ? Number(sugMonto).toFixed(2) : '0.00'}
                                              value={pendingPagoVida[seg.id]?.monto ?? ''}
                                              onChange={e => {
                                                setPendingPagoVida(prev => ({
                                                  ...prev,
                                                  [seg.id]: {
                                                    fecha: prev[seg.id]?.fecha || sugFecha,
                                                    monto: e.target.value,
                                                  },
                                                }));
                                              }}
                                            />
                                          </CInputGroup>
                                          {sugMonto && (
                                            <div className="text-muted" style={{ fontSize: '0.72rem', marginTop: '2px' }}>
                                              Sugerido: ${Number(sugMonto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                            </div>
                                          )}
                                        </CCol>

                                        <CCol md={4}>
                                          <CFormLabel className="fw-semibold small text-muted mb-1">
                                            Fecha: <span className="text-danger">*</span>
                                          </CFormLabel>
                                          <CFormInput
                                            type="date"
                                            value={pendingPagoVida[seg.id]?.fecha || sugFecha}
                                            onChange={e => {
                                              setPendingPagoVida(prev => ({
                                                ...prev,
                                                [seg.id]: {
                                                  monto: prev[seg.id]?.monto ?? '',
                                                  fecha: e.target.value,
                                                },
                                              }));
                                            }}
                                          />
                                          <div className="text-muted" style={{ fontSize: '0.72rem', marginTop: '2px' }}>
                                            Sugerida: {sugFecha}
                                          </div>
                                        </CCol>

                                        <CCol md={4} className="d-flex flex-column align-items-start" style={{ paddingTop: '22px' }}>
                                          <div className="d-flex align-items-center gap-2">
                                            <div className="d-flex gap-1">
                                              <CButton
                                                size="sm"
                                                color="success"
                                                disabled={!pendingPagoVida[seg.id]?.monto || !pendingPagoVida[seg.id]?.fecha}
                                                onClick={() => {
                                              if (!isEditingPago) {
                                                // First save — commit pending directly via API
                                                const p = pendingPagoVida[seg.id] || {};
                                                api.put(
                                                  `/api/sort-ges/${id}/seguro-vida/${seg.id}/pago`,
                                                  { monto: p.monto, fecha_pago: p.fecha },
                                                  { withCredentials: true }
                                                ).then(() => {
                                                  setSegurosVida(prev => prev.map(s =>
                                                    s.id === seg.id
                                                      ? { ...s, pago_monto: p.monto, pago_fecha: p.fecha }
                                                      : s
                                                  ));
                                                  setPendingPagoVida(prev => { const n = { ...prev }; delete n[seg.id]; return n; });
                                                  setEditingPagoVidaId(null);
                                                  showNotification('success', isEditingPago ? 'Pago actualizado' : 'Pago registrado correctamente');
                                                }).catch(() => showNotification('danger', 'Error al guardar el pago'));
                                              } else {
                                                saveVidaPago(seg.id);
                                              }
                                            }}
                                              >
                                                <CIcon icon={cilSave} className="me-1" />Guardar
                                              </CButton>
                                              {isEditingPago && (
                                                <CButton
                                                  size="sm" color="secondary" variant="ghost"
                                                  onClick={() => {
                                                    setEditingPagoVidaId(null);
                                                    setPendingPagoVida(prev => { const n = { ...prev }; delete n[seg.id]; return n; });
                                                  }}
                                                >
                                                  Cancelar
                                                </CButton>
                                              )}
                                            </div>
                                            {/* Difference — inline next to button so it never shifts the button */}
                                            {valorNum > 0 && pendingPagoVida[seg.id]?.monto && (
                                              <span style={{ fontSize: '0.80rem', whiteSpace: 'nowrap' }}>
                                                {diff > 0 ? (
                                                  <span className="text-danger fw-semibold">Falta ${diff.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                                                ) : diff < 0 ? (
                                                  <span className="text-warning fw-semibold">+${Math.abs(diff).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                                                ) : (
                                                  <span className="text-success fw-semibold">✓ Completo</span>
                                                )}
                                              </span>
                                            )}
                                          </div>
                                        </CCol>
                                      </CRow>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Empty state */}
                    {segurosVida.length === 0 && (
                      <p className="text-muted small mb-3">No hay seguros de vida registrados.</p>
                    )}

                    {/* "Nuevo seguro" button */}
                    <CButton
                      color="primary"
                      variant="outline"
                      size="sm"
                      onClick={openNuevoVida}
                      style={{ borderColor: '#899973', color: '#899973' }}
                    >
                      <CIcon icon={cilPlus} className="me-1" />Nuevo seguro
                    </CButton>
                  </CAccordionBody>
                </CAccordionItem>

                {/* ────────────────────────────────────────────
                    SEGURO DE MATERNIDAD
                ──────────────────────────────────────────── */}
                <CAccordionItem itemKey={2}>
                  <CAccordionHeader><strong>Seguro de Maternidad</strong></CAccordionHeader>
                  <CAccordionBody>

                    {/* Polizas list */}
                    {segurosMat.map((poliza) => (
                      <div key={poliza.id} className="mb-4">
                        {/* ── Poliza header ── */}
                        {(() => {
                          const totalCuotas  = poliza.pagos.length;
                          const pagadas      = poliza.pagos.filter(c => c.fecha_pago && c.status !== 'cancelado');
                          const montoPagado  = pagadas.reduce((s, c) => s + (parseFloat(c.monto_pago) || 0), 0);
                          const valorCuota   = parseFloat(poliza.valor_cuota) || 0;
                          const totalEstimado = valorCuota * totalCuotas;
                          const porPagar      = totalEstimado - montoPagado;
                          return (
                            <div
                              className="d-flex align-items-center justify-content-between px-3 py-2"
                              style={{
                                backgroundColor: '#f8f9fa',
                                borderRadius: '6px 6px 0 0',
                                border: '1px solid #dee2e6',
                              }}
                            >
                              <div className="d-flex align-items-center gap-3 flex-wrap">
                                <strong>
                                  {poliza.aseguradora || 'Sin aseguradora'}
                                </strong>
                                {poliza.numero_poliza && (
                                  <span className="text-muted small">Póliza {poliza.numero_poliza}</span>
                                )}
                                {poliza.gestor && (
                                  <span className="text-muted small">· Gestor: {poliza.gestor}</span>
                                )}
                                {poliza.tipo_pago && (
                                  <CBadge color="light" textColor="dark" className="border">
                                    {TIPO_PAGO_CONFIG[poliza.tipo_pago]?.label}
                                  </CBadge>
                                )}
                                {/* Computed totals */}
                                <span className="text-muted small" style={{ borderLeft: '1px solid #dee2e6', paddingLeft: '0.75rem' }}>
                                  Pagado:{' '}
                                  <strong style={{ color: '#198754' }}>
                                    ${montoPagado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                  </strong>
                                </span>
                                {porPagar > 0 && (
                                  <span className="text-muted small">
                                    Por pagar:{' '}
                                    <strong style={{ color: '#dc3545' }}>
                                      ${porPagar.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </strong>
                                  </span>
                                )}
                                {porPagar <= 0 && totalEstimado > 0 && (
                                  <CBadge color="success" style={{ fontSize: '0.75rem' }}>✓ Completado</CBadge>
                                )}
                              </div>
                              <div className="d-flex gap-2 flex-shrink-0">
                                <CButton
                                  size="sm" color="warning" variant="outline"
                                  onClick={() => openEditMat(poliza)}
                                  style={{ fontSize: '0.78rem' }}
                                >
                                  <CIcon icon={cilLockLocked} className="me-1" />Editar
                                </CButton>
                                <CButton
                                  size="sm" color="danger" variant="ghost"
                                  onClick={() => deleteMat(poliza.id)}
                                >
                                  <CIcon icon={cilTrash} />
                                </CButton>
                              </div>
                            </div>
                          );
                        })()}

                        {/* ── Cuotas table ── */}
                        <CTable
                          responsive
                          size="sm"
                          style={{
                            border: '1px solid #dee2e6',
                            borderTop: 'none',
                            borderRadius: '0 0 6px 6px',
                            overflow: 'hidden',
                            marginBottom: 0,
                          }}
                        >
                          <CTableHead>
                            <CTableRow style={{ backgroundColor: '#f8f9fa' }}>
                              <CTableHeaderCell
                                className="text-center"
                                style={{ width: '70px', fontWeight: 700, fontSize: '0.82rem' }}
                              >
                                Cuota
                              </CTableHeaderCell>
                              <CTableHeaderCell style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                                Valor de Pago
                              </CTableHeaderCell>
                              <CTableHeaderCell style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                                Vencimiento
                              </CTableHeaderCell>
                              <CTableHeaderCell style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                                Status
                              </CTableHeaderCell>
                              <CTableHeaderCell style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                                Fecha de Pago
                              </CTableHeaderCell>
                              <CTableHeaderCell style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                                Acciones
                              </CTableHeaderCell>
                            </CTableRow>
                          </CTableHead>
                          <CTableBody>
                            {poliza.pagos.map((cuota) => {
                              const st = getCuotaStatus(cuota);
                              const esCancelado = cuota.status === 'cancelado';
                              const esPagado = !!cuota.fecha_pago && cuota.status !== 'cancelado';

                              const statusColor = {
                                success:   '#198754',
                                info:      '#0dcaf0',
                                danger:    '#dc3545',
                                warning:   '#fd7e14',
                                dark:      '#6c757d',
                                secondary: '#6c757d',
                              }[st.color] || '#333';

                              return (
                                <CTableRow
                                  key={cuota.cuota_num}
                                  style={{ borderBottom: '1px solid #f0f0f0' }}
                                >
                                  {/* Cuota N/Total */}
                                  <CTableDataCell
                                    className="text-center"
                                    style={{ fontWeight: 600, fontSize: '0.85rem' }}
                                  >
                                    {cuota.cuota_num}/{cuota.total}
                                  </CTableDataCell>

                                  {/* Valor */}
                                  <CTableDataCell style={{ fontSize: '0.85rem' }}>
                                    {poliza.valor_cuota
                                      ? `$${Number(poliza.valor_cuota).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                                      : '—'}
                                  </CTableDataCell>

                                  {/* Vencimiento */}
                                  <CTableDataCell style={{ fontSize: '0.85rem' }}>
                                    {cuota.vencimiento || '—'}
                                  </CTableDataCell>

                                  {/* Status */}
                                  <CTableDataCell
                                    style={{ fontWeight: 600, color: statusColor, fontSize: '0.85rem' }}
                                  >
                                    {st.label}
                                  </CTableDataCell>

                                  {/* Fecha de pago */}
                                  <CTableDataCell style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                    {cuota.fecha_pago ? (
                                      <>
                                        {cuota.fecha_pago}
                                        {cuota.monto_pago && (
                                          <span className="text-muted ms-1">
                                            (${Number(cuota.monto_pago).toLocaleString('es-MX', { minimumFractionDigits: 2 })})
                                          </span>
                                        )}
                                      </>
                                    ) : '—'}
                                  </CTableDataCell>

                                  {/* Acciones */}
                                  <CTableDataCell>
                                    <div className="d-flex gap-2 align-items-center">
                                      {esCancelado ? (
                                        <span className="text-muted small">—</span>
                                      ) : esPagado ? (
                                        <>
                                          <CButton
                                            size="sm" color="link" className="p-0"
                                            style={{ color: '#0071b8', fontSize: '0.82rem', textDecoration: 'none' }}
                                            onClick={() => requestMatPagoAction('edit', poliza.id, cuota.cuota_num, cuota.monto_pago || poliza.valor_cuota)}
                                          >
                                            Editar
                                          </CButton>
                                          <CButton
                                            size="sm" color="link" className="p-0"
                                            style={{ color: '#dc3545', fontSize: '0.82rem', textDecoration: 'none' }}
                                            onClick={() => requestMatPagoAction('remove', poliza.id, cuota.cuota_num, null)}
                                          >
                                            Eliminar pago
                                          </CButton>
                                        </>
                                      ) : (
                                        <CButton
                                          size="sm" color="link" className="p-0"
                                          style={{ color: '#198754', fontSize: '0.82rem', textDecoration: 'none' }}
                                          onClick={() => openPagoModal(poliza.id, cuota.cuota_num, poliza.valor_cuota)}
                                        >
                                          Pagar
                                        </CButton>
                                      )}
                                    </div>
                                  </CTableDataCell>
                                </CTableRow>
                              );
                            })}
                          </CTableBody>
                        </CTable>
                      </div>
                    ))}

                    {segurosMat.length === 0 && (
                      <p className="text-muted small mb-3">No hay seguros de maternidad registrados.</p>
                    )}

                    {/* Action buttons */}
                    <div className="d-flex gap-2">
                      <CButton
                        color="primary"
                        variant="outline"
                        size="sm"
                        onClick={openNuevoMat}
                        style={{ borderColor: '#899973', color: '#899973' }}
                      >
                        <CIcon icon={cilPlus} className="me-1" />Nuevo seguro
                      </CButton>
                    </div>
                  </CAccordionBody>
                </CAccordionItem>
              </CAccordion>
            </CTabPane>

            {/* ── PSICO SOCIAL ───────────────────────────────── */}
            <CTabPane visible={activeTab === 'psico-social'}>
              <CAccordion alwaysOpen activeItemKey={1}>

                {/* ════════════════════════════════════════════
                    PSICO INICIAL
                ════════════════════════════════════════════ */}
                <CAccordionItem itemKey={1}>
                  <CAccordionHeader><strong>Psico Inicial</strong></CAccordionHeader>
                  <CAccordionBody style={{ padding: '4px 0' }}>
                    <div style={{ display: 'inline-block', minWidth: '580px' }}>
                      {psicoInicial.map((row, idx) => {
                        const sec = `psico_row_${row.id}`;
                        return (
                          <div
                            key={row.id}
                            className="d-flex align-items-center psico-row"
                            style={{
                              gap: '0',
                              padding: '4px 8px',
                              borderBottom: idx < psicoInicial.length - 1 ? '1px solid #f0f0f0' : 'none',
                            }}
                          >
                            {/* Etapa — plain teal label */}
                            <div style={{ width: '200px', flexShrink: 0, paddingRight: '16px' }}>
                              <span style={{ color: '#0098b3', fontSize: '0.9rem' }}>
                                {row.etapa}
                              </span>
                            </div>

                            {/* Fecha — stripped input */}
                            <div className="psico-field" style={{ width: '145px', flexShrink: 0, paddingRight: '16px' }}>
                              {renderTableInput(
                                sec, 'fecha', row.fecha,
                                e => handlePsicoInicialChange(row.id, 'fecha', e.target.value),
                                'date'
                              )}
                            </div>

                            {/* Estado — stripped select */}
                            <div className="psico-field" style={{ width: '160px', flexShrink: 0, paddingRight: '16px' }}>
                              {renderTableSelect(
                                sec, 'estado', row.estado,
                                e => handlePsicoInicialChange(row.id, 'estado', e.target.value),
                                estadoPsicoOpts
                              )}
                            </div>

                            {/* Recomendación — stripped select */}
                            <div className="psico-field" style={{ width: '175px', flexShrink: 0 }}>
                              {renderTableSelect(
                                sec, 'recomendacion', row.recomendacion,
                                e => handlePsicoInicialChange(row.id, 'recomendacion', e.target.value),
                                recomendacionOpts
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CAccordionBody>
                </CAccordionItem>

                {/* ════════════════════════════════════════════
                    SEGUIMIENTO PSICOLÓGICO
                ════════════════════════════════════════════ */}
                <CAccordionItem itemKey={2}>
                  <CAccordionHeader><strong>Seguimiento Psicológico</strong></CAccordionHeader>
                  <CAccordionBody>

                    {/* "Nuevo seguimiento" button */}
                    <div className="mb-3">
                      <CButton
                        color="primary"
                        variant="outline"
                        size="sm"
                        onClick={addSeguimiento}
                        style={{ borderColor: '#0098b3', color: '#0098b3' }}
                      >
                        <CIcon icon={cilPlus} className="me-1" />Nuevo seguimiento
                      </CButton>
                    </div>

                    {seguimientos.length === 0 && (
                      <p className="text-muted small">No hay seguimientos registrados.</p>
                    )}

                    {/* One accordion per seguimiento — nested inside the outer one */}
                    {seguimientos.map((seg, idx) => {
                      const isOpen = seguimientoOpen.includes(seg.id);
                      const autoStatus = deriveSeguimientoStatus(seg);
                      const statusInfo = segStatusOpts.find(o => o.value === autoStatus) || segStatusOpts[0];
                      const informeLabel = informeOpts.find(o => o.value === seg.informe)?.label || '—';
                      const incidenciaLabel = incidenciaOpts.find(o => o.value === seg.incidencia)?.label || '—';

                      return (
                        <div key={seg.id} className="border rounded mb-2 overflow-hidden">
                          {/* ── Custom accordion header ── */}
                          <div
                            className="d-flex align-items-center justify-content-between px-3 py-2"
                            style={{
                              backgroundColor: isOpen ? '#e8f6f9' : '#f8f9fa',
                              cursor: 'pointer',
                              borderBottom: isOpen ? '1px solid #dee2e6' : 'none',
                            }}
                            onClick={() => toggleSeguimientoOpen(seg.id)}
                          >
                            {/* Summary chips */}
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <strong style={{ color: '#0098b3', minWidth: '140px' }}>
                                {seg.etapa || `Seguimiento ${idx + 1}`}
                              </strong>
                              {seg.programar && (
                                <CBadge color="light" textColor="dark" className="border">
                                  📅 {seg.programar}
                                </CBadge>
                              )}
                              <CBadge color={statusInfo.color}>{statusInfo.label}</CBadge>
                              {seg.informe && (
                                <CBadge color="info" style={{ backgroundColor: '#0098b3' }}>
                                  {informeLabel}
                                </CBadge>
                              )}
                              {seg.incidencia && seg.incidencia !== 'sin_incidencias' && (
                                <CBadge color="warning">{incidenciaLabel}</CBadge>
                              )}
                            </div>
                            {/* Right actions */}
                            <div className="d-flex align-items-center gap-2 ms-2 flex-shrink-0">
                              <CButton
                                size="sm"
                                color="danger"
                                variant="ghost"
                                onClick={e => { e.stopPropagation(); deleteSeguimiento(seg.id); }}
                                title="Eliminar seguimiento"
                              >
                                <CIcon icon={cilTrash} />
                              </CButton>
                              <span className="text-muted small">{isOpen ? '▲' : '▼'}</span>
                            </div>
                          </div>

                          {/* ── Expanded form body ── */}
                          {isOpen && (
                            <div className="p-3">
                              <CRow>
                                {/* Etapa */}
                                <CCol md={4} className="mb-3">
                                  <CFormLabel className="fw-semibold small text-muted">Etapa:</CFormLabel>
                                  {renderSegInput(seg.id, 'etapa', seg.etapa, 'text', 'Nombre de la etapa')}
                                </CCol>

                                {/* Motivo */}
                                <CCol md={4} className="mb-3">
                                  <CFormLabel className="fw-semibold small text-muted">Motivo:</CFormLabel>
                                  {renderSegSelect(seg.id, 'motivo', seg.motivo, motivoOpts)}
                                </CCol>

                                {/* Complemento */}
                                <CCol md={4} className="mb-3">
                                  <CFormLabel className="fw-semibold small text-muted">Complemento:</CFormLabel>
                                  {renderSegSelect(seg.id, 'complemento', seg.complemento, complementoOpts)}
                                </CCol>

                                {/* Complemento 2 */}
                                <CCol md={4} className="mb-3">
                                  <CFormLabel className="fw-semibold small text-muted">Complemento 2:</CFormLabel>
                                  {renderSegSelect(seg.id, 'complemento2', seg.complemento2, complemento2Opts)}
                                </CCol>

                                {/* Programar */}
                                <CCol md={4} className="mb-3">
                                  <CFormLabel className="fw-semibold small text-muted">Programar:</CFormLabel>
                                  {renderSegInput(seg.id, 'programar', seg.programar, 'date')}
                                </CCol>

                                {/* Status — auto-derived, read-only */}
                                <CCol md={4} className="mb-3">
                                  <CFormLabel className="fw-semibold small text-muted">Status:</CFormLabel>
                                  <div className="mt-1">
                                    <CBadge color={statusInfo.color} style={{ fontSize: '0.85rem', padding: '0.35em 0.65em' }}>
                                      {statusInfo.label}
                                    </CBadge>
                                  </div>
                                </CCol>

                                {/* Asistencia */}
                                <CCol md={4} className="mb-3">
                                  <CFormLabel className="fw-semibold small text-muted">Asistencia:</CFormLabel>
                                  {renderSegSelect(seg.id, 'asistencia', seg.asistencia, asistenciaOpts)}
                                </CCol>

                                {/* Informe resolución */}
                                <CCol md={4} className="mb-3">
                                  <CFormLabel className="fw-semibold small text-muted">Informe resolución:</CFormLabel>
                                  {renderSegSelect(seg.id, 'informe', seg.informe, informeOpts)}
                                </CCol>

                                {/* Incidencia */}
                                <CCol md={4} className="mb-3">
                                  <CFormLabel className="fw-semibold small text-muted">Incidencia:</CFormLabel>
                                  {renderSegSelect(seg.id, 'incidencia', seg.incidencia, incidenciaOpts)}
                                </CCol>

                                {/* ── Historial de seguimiento — password-gated ── */}
                                <CCol md={12} className="mb-3">
                                  <CFormLabel className="fw-semibold small text-muted">
                                    Historial de seguimiento:
                                  </CFormLabel>
                                  {historialUnlocked[seg.id] ? (
                                    <div>
                                      <CFormTextarea
                                        rows={3}
                                        size="sm"
                                        value={seg.historial}
                                        onChange={e => updateSeguimiento(seg.id, 'historial', e.target.value)}
                                        placeholder="Notas del seguimiento…"
                                      />
                                      <div className="text-end mt-1">
                                        <CButton
                                          size="sm" color="secondary" variant="ghost"
                                          onClick={() => setHistorialUnlocked(prev => {
                                            const n = { ...prev }; delete n[seg.id]; return n;
                                          })}
                                          title="Ocultar historial"
                                        >
                                          <CIcon icon={cilLockLocked} className="me-1" />Ocultar
                                        </CButton>
                                      </div>
                                    </div>
                                  ) : (
                                    <div
                                      className="d-flex align-items-center gap-2 p-2 rounded"
                                      style={{ backgroundColor: '#f8f9fa', border: '1px dashed #ced4da' }}
                                    >
                                      <CIcon icon={cilLockLocked} className="text-muted" />
                                      <span className="text-muted small">Contenido protegido</span>
                                      <CButton
                                        size="sm" color="warning" variant="outline"
                                        className="ms-auto"
                                        onClick={() => requestHistorialUnlock(seg.id)}
                                      >
                                        <CIcon icon={cilLockLocked} className="me-1" />Desbloquear
                                      </CButton>
                                    </div>
                                  )}
                                </CCol>
                              </CRow>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CAccordionBody>
                </CAccordionItem>
              </CAccordion>
            </CTabPane>

            {/* ── CITA PREVIA ────────────────────────────────── */}
            <CTabPane visible={activeTab === 'cita-previa'}>
              <CAccordion alwaysOpen>
                <CAccordionItem itemKey={1}>
                  <CAccordionHeader><strong>Historial de Citas</strong></CAccordionHeader>
                  <CAccordionBody><p className="text-muted">Contenido del historial de citas…</p></CAccordionBody>
                </CAccordionItem>
                <CAccordionItem itemKey={2}>
                  <CAccordionHeader><strong>Programar Nueva Cita</strong></CAccordionHeader>
                  <CAccordionBody><p className="text-muted">Contenido para programar citas…</p></CAccordionBody>
                </CAccordionItem>
              </CAccordion>
            </CTabPane>

          </CTabContent>

          {/* ── Global action buttons ─────────────────────── */}
          <CRow className="mt-4">
            <CCol className="d-flex justify-content-between">
              <CButton color="secondary" variant="outline" onClick={() => navigate('/babysite/sortGes')}>
                <CIcon icon={cilArrowLeft} className="me-2" />Volver a la lista
              </CButton>
              <CButton color="primary" className="app-button" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <><CSpinner size="sm" className="me-2" />Guardando...</>
                ) : (
                  <><CIcon icon={cilSave} className="me-2" />Guardar cambios</>
                )}
              </CButton>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* ── Confirm lock modal ─────────────────────────────── */}
      <CModal visible={showConfirmModal} onClose={cancelFieldLock}>
        <CModalHeader><CModalTitle>Confirmar y bloquear campo</CModalTitle></CModalHeader>
        <CModalBody>
          <p>¿Desea guardar y bloquear este campo?</p>
          {pendingFieldLock.field && (
            <p><strong>Campo:</strong> {pendingFieldLock.field.replace(/_/g, ' ')}</p>
          )}
          {pendingFieldLock.value && (
            <p><strong>Valor:</strong> {String(pendingFieldLock.value)}</p>
          )}
          <p className="text-muted small">
            Una vez bloqueado, necesitará la contraseña de administrador para editarlo.
          </p>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={cancelFieldLock}>Cancelar</CButton>
          <CButton color="primary" onClick={confirmFieldLock}
            style={{ backgroundColor: '#d97ea1', borderColor: '#d97ea1' }}>
            Guardar y bloquear
          </CButton>
        </CModalFooter>
      </CModal>

      {/* ── Unlock password modal ──────────────────────────── */}
      <CModal visible={showPasswordModal} onClose={cancelUnlock}>
        <CModalHeader><CModalTitle>Desbloquear campo</CModalTitle></CModalHeader>
        <CModalBody>
          <p>Ingrese la contraseña de administrador para desbloquear este campo:</p>
          <CFormInput
            type="password" value={unlockPassword}
            onChange={(e) => setUnlockPassword(e.target.value)}
            placeholder="Contraseña"
            onKeyDown={(e) => { if (e.key === 'Enter') verifyPasswordAndUnlock(); }}
            invalid={!!passwordError}
          />
          {passwordError && <div className="text-danger small mt-1">{passwordError}</div>}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={cancelUnlock}>Cancelar</CButton>
          <CButton color="primary" onClick={verifyPasswordAndUnlock}>Desbloquear</CButton>
        </CModalFooter>
      </CModal>

      {/* ── Modal: Nuevo / Editar Seguro de Vida ──────────── */}
      <CModal visible={modalVida === 'new'} onClose={() => setModalVida(null)} size="lg">
        <CModalHeader>
          <CModalTitle>{editingVidaId !== null ? 'Editar seguro de vida' : 'Nuevo seguro de vida'}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CRow>
            {/* Fecha de alta */}
            <CCol md={6} className="mb-3">
              <CFormLabel>Fecha de alta: <span className="text-danger">*</span></CFormLabel>
              <CFormInput
                type="date"
                value={formVida.fecha_alta}
                onChange={e => {
                  const fa = e.target.value;
                  const autoVenc = computeVidaVencimiento(fa);
                  setFormVida(p => ({
                    ...p,
                    fecha_alta: fa,
                    // Only auto-fill vencimiento if user hasn't overridden it yet
                    vencimiento: p.vencimiento === computeVidaVencimiento(p.fecha_alta) || !p.vencimiento
                      ? autoVenc
                      : p.vencimiento,
                  }));
                }}
              />
            </CCol>

            {/* Aseguradora */}
            <CCol md={6} className="mb-3">
              <CFormLabel>Aseguradora:</CFormLabel>
              <CFormInput
                placeholder="Ej. GNP, Metlife…"
                value={formVida.aseguradora}
                onChange={e => setFormVida(p => ({ ...p, aseguradora: e.target.value }))}
              />
            </CCol>

            {/* Gestor */}
            <CCol md={6} className="mb-3">
              <CFormLabel>Gestor:</CFormLabel>
              <CFormInput
                placeholder="Nombre del gestor"
                value={formVida.gestor}
                onChange={e => setFormVida(p => ({ ...p, gestor: e.target.value }))}
              />
            </CCol>

            {/* N° de cuotas — always 1, fixed */}
            <CCol md={3} className="mb-3">
              <CFormLabel>N° de cuotas:</CFormLabel>
              <CInputGroup>
                <CFormInput
                  type="number"
                  value="1"
                  disabled
                  style={{ backgroundColor: '#e9ecef', fontWeight: 600, textAlign: 'center' }}
                />
                <CInputGroupText
                  style={{ backgroundColor: '#e9ecef', fontSize: '0.75rem', color: '#6c757d' }}
                >
                  Fijo
                </CInputGroupText>
              </CInputGroup>
              <div className="text-muted" style={{ fontSize: '0.72rem', marginTop: '3px' }}>
                El seguro de vida siempre es una cuota única
              </div>
            </CCol>

            {/* Valor */}
            <CCol md={3} className="mb-3">
              <CFormLabel>Valor:</CFormLabel>
              <CInputGroup>
                <CInputGroupText>$</CInputGroupText>
                <CFormInput
                  type="number" min="0" step="0.01" placeholder="0.00"
                  value={formVida.valor}
                  onChange={e => setFormVida(p => ({ ...p, valor: e.target.value }))}
                />
              </CInputGroup>
            </CCol>

            {/* Vencimiento — auto-suggested from fecha_alta + 1 year */}
            <CCol md={6} className="mb-3">
              <CFormLabel>
                Vencimiento cobertura:
                {formVida.fecha_alta && (
                  <span className="text-muted ms-2" style={{ fontSize: '0.75rem' }}>
                    (sugerido: {computeVidaVencimiento(formVida.fecha_alta)})
                  </span>
                )}
              </CFormLabel>
              <CFormInput
                type="date"
                value={formVida.vencimiento}
                onChange={e => setFormVida(p => ({ ...p, vencimiento: e.target.value }))}
              />
            </CCol>
          </CRow>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setModalVida(null)}>Cancelar</CButton>
          <CButton
            color="primary"
            onClick={saveVida}
            disabled={!formVida.fecha_alta}
            style={{ backgroundColor: '#899973', borderColor: '#899973' }}
          >
            <CIcon icon={cilSave} className="me-1" />
            {editingVidaId !== null ? 'Actualizar' : 'Registrar'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* ── Modal: Contraseña para editar Seguro de Vida ──── */}
      <CModal visible={showVidaEditModal} onClose={cancelVidaEdit}>
        <CModalHeader>
          <CModalTitle>
            <CIcon icon={cilLockLocked} className="me-2 text-warning" />
            Editar seguro de vida
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p className="text-muted small mb-3">
            Ingrese la contraseña para habilitar la edición de este seguro.
          </p>
          <CFormLabel>Contraseña:</CFormLabel>
          <CFormInput
            type="password"
            value={vidaEditPassword}
            onChange={e => setVidaEditPassword(e.target.value)}
            placeholder="Contraseña"
            onKeyDown={e => { if (e.key === 'Enter') confirmVidaEdit(); }}
            invalid={!!vidaEditPasswordError}
            autoFocus
          />
          {vidaEditPasswordError && (
            <div className="text-danger small mt-1">{vidaEditPasswordError}</div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={cancelVidaEdit}>Cancelar</CButton>
          <CButton color="warning" onClick={confirmVidaEdit} disabled={!vidaEditPassword}>
            <CIcon icon={cilLockUnlocked} className="me-1" />Desbloquear
          </CButton>
        </CModalFooter>
      </CModal>

      {/* ── Modal: Nuevo Seguro de Maternidad ─────────────── */}
      <CModal visible={modalMat === 'new'} onClose={() => { setModalMat(null); setEditingMatId(null); }} size="lg">
        <CModalHeader>
          <CModalTitle>{editingMatId !== null ? 'Editar seguro de maternidad' : 'Nuevo seguro de maternidad'}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CRow>
            {/* Gestor — required */}
            <CCol md={6} className="mb-3">
              <CFormLabel>Gestor: <span className="text-danger">*</span></CFormLabel>
              <CFormInput
                placeholder="Nombre del gestor"
                value={formMat.gestor}
                onChange={e => setFormMat(p => ({ ...p, gestor: e.target.value }))}
              />
            </CCol>

            {/* Tipo de pago */}
            <CCol md={6} className="mb-3">
              <CFormLabel>Tipo de pago:</CFormLabel>
              <CFormSelect
                value={formMat.tipo_pago}
                onChange={e => setFormMat(p => ({
                  ...p,
                  tipo_pago: e.target.value,
                  total_estimado: p.valor_cuota && e.target.value
                    ? (parseFloat(p.valor_cuota) * (TIPO_PAGO_CONFIG[e.target.value]?.cuotas || 0)).toFixed(2)
                    : '',
                }))}
              >
                <option value="">— Seleccionar —</option>
                {Object.entries(TIPO_PAGO_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </CFormSelect>
            </CCol>

            {/* Valor por cuota */}
            <CCol md={6} className="mb-3">
              <CFormLabel>Valor por cuota:</CFormLabel>
              <CInputGroup>
                <CInputGroupText>$</CInputGroupText>
                <CFormInput
                  type="number" min="0" step="0.01" placeholder="0.00"
                  value={formMat.valor_cuota}
                  onChange={e => {
                    const v = e.target.value;
                    const cfg = TIPO_PAGO_CONFIG[formMat.tipo_pago];
                    const newTotal = cfg && v ? (parseFloat(v) * cfg.cuotas).toFixed(2) : '';
                    setFormMat(p => ({ ...p, valor_cuota: v, total_estimado: newTotal }));
                  }}
                />
              </CInputGroup>
            </CCol>

            {/* Total estimado — editable, linked to valor_cuota */}
            <CCol md={6} className="mb-3">
              <CFormLabel>
                Total estimado:
                {formMat.tipo_pago && TIPO_PAGO_CONFIG[formMat.tipo_pago] && (
                  <span className="text-muted ms-1" style={{ fontSize: '0.72rem' }}>
                    ({TIPO_PAGO_CONFIG[formMat.tipo_pago].cuotas} cuota{TIPO_PAGO_CONFIG[formMat.tipo_pago].cuotas > 1 ? 's' : ''})
                  </span>
                )}
              </CFormLabel>
              <CInputGroup>
                <CInputGroupText>$</CInputGroupText>
                <CFormInput
                  type="number" min="0" step="0.01" placeholder="0.00"
                  value={formMat.total_estimado || ''}
                  disabled={!formMat.tipo_pago}
                  style={!formMat.tipo_pago ? { backgroundColor: '#e9ecef' } : {}}
                  onChange={e => {
                    const t = e.target.value;
                    const cfg = TIPO_PAGO_CONFIG[formMat.tipo_pago];
                    const newCuota = cfg && t && cfg.cuotas > 0
                      ? (parseFloat(t) / cfg.cuotas).toFixed(2)
                      : '';
                    setFormMat(p => ({ ...p, total_estimado: t, valor_cuota: newCuota }));
                  }}
                />
              </CInputGroup>
              {!formMat.tipo_pago && (
                <div className="text-muted" style={{ fontSize: '0.72rem', marginTop: '3px' }}>
                  Seleccione tipo de pago primero
                </div>
              )}
            </CCol>

            {/* ── Fechas row 1: solicitud + alta ── */}
            <CCol md={6} className="mb-3">
              <CFormLabel>Fecha de solicitud: <span className="text-danger">*</span></CFormLabel>
              <CFormInput
                type="date"
                value={formMat.fecha_solicitud || ''}
                onChange={e => setFormMat(p => ({ ...p, fecha_solicitud: e.target.value }))}
              />
            </CCol>

            <CCol md={6} className="mb-3">
              <CFormLabel>Fecha de alta:</CFormLabel>
              <CFormInput
                type="date"
                value={formMat.fecha_alta}
                onChange={e => {
                  const fa = e.target.value;
                  const sugLib = computeMatLiberacion(fa);
                  const sugVenc = computeVidaVencimiento(fa);
                  setFormMat(p => ({
                    ...p,
                    fecha_alta: fa,
                    fecha_liberacion: p.fecha_liberacion === computeMatLiberacion(p.fecha_alta) || !p.fecha_liberacion
                      ? sugLib : p.fecha_liberacion,
                    fecha_vencimiento: p.fecha_vencimiento === computeVidaVencimiento(p.fecha_alta) || !p.fecha_vencimiento
                      ? sugVenc : p.fecha_vencimiento,
                  }));
                }}
              />
            </CCol>

            {/* ── Fechas row 2: liberación + vencimiento ── */}
            <CCol md={6} className="mb-3">
              <CFormLabel>Fecha de liberación:</CFormLabel>
              <CFormInput
                type="date"
                value={formMat.fecha_liberacion}
                onChange={e => setFormMat(p => ({ ...p, fecha_liberacion: e.target.value }))}
              />
            </CCol>

            <CCol md={6} className="mb-3">
              <CFormLabel>Fecha de vencimiento:</CFormLabel>
              <CFormInput
                type="date"
                value={formMat.fecha_vencimiento}
                onChange={e => setFormMat(p => ({ ...p, fecha_vencimiento: e.target.value }))}
              />
            </CCol>

            {/* Aseguradora — dropdown AXXA / BUPA */}
            <CCol md={6} className="mb-3">
              <CFormLabel>Aseguradora:</CFormLabel>
              <CFormSelect
                value={formMat.aseguradora}
                onChange={e => setFormMat(p => ({ ...p, aseguradora: e.target.value }))}
              >
                <option value="">— Seleccionar —</option>
                <option value="AXXA">AXXA</option>
                <option value="BUPA">BUPA</option>
              </CFormSelect>
            </CCol>

            {/* Número de póliza */}
            <CCol md={6} className="mb-3">
              <CFormLabel>Número de póliza:</CFormLabel>
              <CFormInput
                placeholder="Ej. POL-000456"
                value={formMat.numero_poliza}
                onChange={e => setFormMat(p => ({ ...p, numero_poliza: e.target.value }))}
              />
            </CCol>
          </CRow>

          {/* ── Payment calendar preview ── */}
          {formMat.tipo_pago && formMat.fecha_alta && (() => {
            const pagos = buildPagos(formMat.tipo_pago, formMat.valor_cuota, formMat.fecha_alta);
            const cfg = TIPO_PAGO_CONFIG[formMat.tipo_pago];
            const valorNum = parseFloat(formMat.valor_cuota) || 0;
            const totalNum = valorNum * cfg.cuotas;
            return (
              <div className="mt-3">
                {/* Header bar */}
                <div
                  className="d-flex align-items-center px-3 py-2"
                  style={{
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px 6px 0 0',
                    border: '1px solid #dee2e6',
                  }}
                >
                  <span style={{ width: '70px', fontWeight: 700, fontSize: '0.80rem', color: '#899973' }}>
                    Cuota
                  </span>
                  <span style={{ flex: 1, fontWeight: 700, fontSize: '0.80rem' }}>
                    Fecha de pago — {cfg.label} ({cfg.cuotas} cuota{cfg.cuotas > 1 ? 's' : ''})
                  </span>
                  <span style={{ width: '110px', fontWeight: 700, fontSize: '0.80rem', textAlign: 'right' }}>
                    Monto
                  </span>
                </div>

                {/* Rows */}
                <div
                  style={{
                    border: '1px solid #dee2e6',
                    borderTop: 'none',
                    borderRadius: '0 0 6px 6px',
                    overflow: 'hidden',
                  }}
                >
                  {pagos.map((c, idx) => (
                    <div
                      key={c.cuota_num}
                      className="d-flex align-items-center px-3 py-1"
                      style={{
                        borderBottom: idx < pagos.length - 1 ? '1px solid #f0f0f0' : 'none',
                        backgroundColor: '#fff',
                        fontSize: '0.83rem',
                      }}
                    >
                      <span style={{ width: '70px', fontWeight: 600, color: '#899973' }}>
                        {c.cuota_num}/{c.total}
                      </span>
                      <span style={{ flex: 1 }}>{c.vencimiento}</span>
                      <span style={{ width: '110px', textAlign: 'right' }}>
                        {valorNum > 0
                          ? `$${valorNum.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                          : <span className="text-muted">—</span>}
                      </span>
                    </div>
                  ))}

                  {/* Total row */}
                  {valorNum > 0 && (
                    <div
                      className="d-flex align-items-center px-3 py-1"
                      style={{ backgroundColor: '#f8f9fa', borderTop: '1px solid #dee2e6', fontSize: '0.83rem' }}
                    >
                      <span style={{ flex: 1, fontWeight: 700, textAlign: 'right', paddingRight: '8px' }}>
                        Total estimado:
                      </span>
                      <span style={{ width: '110px', fontWeight: 700, textAlign: 'right', color: '#899973' }}>
                        ${totalNum.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => { setModalMat(null); setEditingMatId(null); }}>Cancelar</CButton>
          <CButton
            color="primary"
            onClick={saveMat}
            disabled={!formMat.gestor || !formMat.fecha_solicitud}
            style={{ backgroundColor: '#899973', borderColor: '#899973' }}
          >
            <CIcon icon={cilSave} className="me-1" />{editingMatId !== null ? 'Actualizar' : 'Registrar'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* ── Modal: Registrar Pago de Cuota ────────────────── */}
      <CModal visible={modalMat === 'pago'} onClose={() => setModalMat(null)}>
        <CModalHeader>
          <CModalTitle>Registrar pago</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {pagoTarget.cuotaNum && (
            <p className="text-muted small mb-3">
              Cuota <strong>{pagoTarget.cuotaNum}</strong> de la póliza seleccionada.
            </p>
          )}
          <CRow>
            <CCol md={6} className="mb-3">
              <CFormLabel>Monto: <span className="text-danger">*</span></CFormLabel>
              <CInputGroup>
                <CInputGroupText>$</CInputGroupText>
                <CFormInput
                  type="number" min="0" step="0.01" placeholder="0.00"
                  value={montoPagoInput}
                  onChange={e => setMontoPagoInput(e.target.value)}
                />
              </CInputGroup>
              {pagoTarget.valorSugerido && (
                <div className="text-muted" style={{ fontSize: '0.72rem', marginTop: '3px' }}>
                  Sugerido: ${Number(pagoTarget.valorSugerido).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
              )}
            </CCol>
            <CCol md={6} className="mb-3">
              <CFormLabel>Fecha de pago: <span className="text-danger">*</span></CFormLabel>
              <CFormInput
                type="date"
                value={fechaPagoInput}
                onChange={e => setFechaPagoInput(e.target.value)}
              />
            </CCol>
          </CRow>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setModalMat(null)}>Cancelar</CButton>
          <CButton
            color="success"
            onClick={savePago}
            disabled={!fechaPagoInput || !montoPagoInput}
          >
            <CIcon icon={cilSave} className="me-1" />Confirmar pago
          </CButton>
        </CModalFooter>
      </CModal>
      {/* ── Modal: Contraseña para editar PAGO de Seguro de Vida ── */}
      <CModal visible={showVidaPagoEditModal} onClose={cancelVidaPagoEdit}>
        <CModalHeader>
          <CModalTitle>
            <CIcon icon={cilLockLocked} className="me-2 text-warning" />
            Editar pago del seguro de vida
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p className="text-muted small mb-3">
            Ingrese la contraseña para modificar únicamente la información de pago.
          </p>
          <CFormLabel>Contraseña:</CFormLabel>
          <CFormInput
            type="password"
            value={vidaPagoEditPassword}
            onChange={e => setVidaPagoEditPassword(e.target.value)}
            placeholder="Contraseña"
            onKeyDown={e => { if (e.key === 'Enter') confirmVidaPagoEdit(); }}
            invalid={!!vidaPagoEditPasswordError}
            autoFocus
          />
          {vidaPagoEditPasswordError && (
            <div className="text-danger small mt-1">{vidaPagoEditPasswordError}</div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={cancelVidaPagoEdit}>Cancelar</CButton>
          <CButton color="warning" onClick={confirmVidaPagoEdit} disabled={!vidaPagoEditPassword}>
            <CIcon icon={cilLockUnlocked} className="me-1" />Desbloquear
          </CButton>
        </CModalFooter>
      </CModal>

      {/* ── Modal: Contraseña para editar/eliminar pago de Maternidad ── */}
      <CModal visible={showMatPagoEditModal} onClose={cancelMatPagoAction}>
        <CModalHeader>
          <CModalTitle>
            <CIcon icon={cilLockLocked} className="me-2 text-warning" />
            {matPagoEditAction?.type === 'remove' ? 'Eliminar pago' : 'Editar pago'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p className="text-muted small mb-3">
            {matPagoEditAction?.type === 'remove'
              ? 'Ingrese la contraseña para eliminar la información de este pago.'
              : 'Ingrese la contraseña para modificar la información de este pago.'}
          </p>
          <CFormLabel>Contraseña:</CFormLabel>
          <CFormInput
            type="password"
            value={matPagoEditPassword}
            onChange={e => setMatPagoEditPassword(e.target.value)}
            placeholder="Contraseña"
            onKeyDown={e => { if (e.key === 'Enter') confirmMatPagoAction(); }}
            invalid={!!matPagoEditPasswordError}
            autoFocus
          />
          {matPagoEditPasswordError && (
            <div className="text-danger small mt-1">{matPagoEditPasswordError}</div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={cancelMatPagoAction}>Cancelar</CButton>
          <CButton
            color={matPagoEditAction?.type === 'remove' ? 'danger' : 'warning'}
            onClick={confirmMatPagoAction}
            disabled={!matPagoEditPassword}
          >
            <CIcon icon={cilLockUnlocked} className="me-1" />
            {matPagoEditAction?.type === 'remove' ? 'Eliminar' : 'Desbloquear'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* ── Historial unlock modal ────────────────────────── */}
      <CModal visible={showHistorialModal} onClose={cancelHistorialUnlock}>
        <CModalHeader>
          <CModalTitle>
            <CIcon icon={cilLockLocked} className="me-2 text-warning" />
            Historial de seguimiento
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p className="text-muted small mb-3">
            Esta sección es confidencial. Ingrese la contraseña para ver y editar el historial.
          </p>
          <CFormLabel>Contraseña:</CFormLabel>
          <CFormInput
            type="password"
            value={historialPassword}
            onChange={e => setHistorialPassword(e.target.value)}
            placeholder="Contraseña"
            onKeyDown={e => { if (e.key === 'Enter') confirmHistorialUnlock(); }}
            invalid={!!historialPasswordError}
            autoFocus
          />
          {historialPasswordError && (
            <div className="text-danger small mt-1">{historialPasswordError}</div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={cancelHistorialUnlock}>Cancelar</CButton>
          <CButton color="warning" onClick={confirmHistorialUnlock} disabled={!historialPassword}>
            <CIcon icon={cilLockUnlocked} className="me-1" />Desbloquear
          </CButton>
        </CModalFooter>
      </CModal>

      <style>{`
        .nav-link:hover { opacity: 0.85; }
        .accordion-button:not(.collapsed) { background-color: #f8f9fa; color: #333; }
        .accordion-button:focus { box-shadow: none; border-color: rgba(0,0,0,.125); }
        .remove-file-btn { background: transparent !important; border: none !important; box-shadow: none !important; }
        .remove-file-btn:hover, .remove-file-btn:focus { background: transparent !important; border: none !important; box-shadow: none !important; }
        .form-check-input:checked { background-color: #0071b8 !important; border-color: #0071b8 !important; }
        .form-check-input:focus { border-color: #0071b8 !important; box-shadow: 0 0 0 0.25rem rgba(0, 113, 184, 0.25) !important; }
        .pdf-upload-btn:hover { background-color: #0071b8 !important; border-color: #0071b8 !important; color: #fff !important; }

        /* ── Psico Inicial — plain-text input style ── */
        .psico-field .input-group,
        .psico-field .form-control,
        .psico-field .form-select {
          background: transparent !important;
          border: none !important;
          border-bottom: 1px solid #dee2e6 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          padding-left: 0 !important;
          font-size: 0.88rem !important;
        }
        .psico-field .form-select {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23adb5bd' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e") !important;
          background-repeat: no-repeat !important;
          background-position: right 4px center !important;
          background-size: 10px !important;
          padding-right: 20px !important;
        }
        .psico-field .form-control:focus,
        .psico-field .form-select:focus {
          border-bottom-color: #0098b3 !important;
          box-shadow: none !important;
        }
        .psico-field .form-control:disabled,
        .psico-field .form-select:disabled {
          background: transparent !important;
          color: #495057 !important;
        }
        .psico-field .input-group .btn {
          background: transparent !important;
          border: none !important;
          border-bottom: 1px solid #dee2e6 !important;
          border-radius: 0 !important;
          padding: 0 4px !important;
          color: #fd7e14 !important;
        }
        .psico-field .input-group-text {
          display: none !important;
        }
        .psico-row:hover {
          background-color: #fafafa;
        }
      `}</style>
    </CContainer>
  );
};

export default SortGes;