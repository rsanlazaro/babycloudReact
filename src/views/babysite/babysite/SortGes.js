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
  // Each entry: { id, fecha_alta, aseguradora, gestor, cuotas, valor, vencimiento }
  // ─────────────────────────────────────────────────────────────
  const [segurosVida, setSegurosVida] = useState([]);
  // Modal: 'new' | 'edit' | 'detail' | null
  const [modalVida, setModalVida] = useState(null);
  const [editingVidaId, setEditingVidaId] = useState(null);
  const VIDA_EMPTY = { fecha_alta: '', aseguradora: '', gestor: '', cuotas: '', valor: '', vencimiento: '' };
  const [formVida, setFormVida] = useState(VIDA_EMPTY);
  const [detailVida, setDetailVida] = useState(null); // which record to show detail for

  // ─────────────────────────────────────────────────────────────
  // SEGURO MED — Seguro de Maternidad
  // Each policy: { id, gestor, cantidad_cuotas, valor_cuota, fecha_liberacion,
  //               fecha_alta, fecha_vencimiento, aseguradora, numero_poliza,
  //               pagos: [{ cuota_num, vencimiento, fecha_pago, status }] }
  // ─────────────────────────────────────────────────────────────
  const [segurosMat, setSegurosMat] = useState([]);
  // Modal: 'new' | 'pago' | null
  const [modalMat, setModalMat] = useState(null);
  const MAT_EMPTY = {
    gestor: '', cantidad_cuotas: '', valor_cuota: '',
    fecha_liberacion: '', fecha_alta: '', fecha_vencimiento: '',
    aseguradora: '', numero_poliza: '',
  };
  const [formMat, setFormMat] = useState(MAT_EMPTY);
  // For "Añadir pago" modal: which policy + which cuota row
  const [pagoTarget, setPagoTarget] = useState({ polizaId: null, cuotaNum: null });
  const [fechaPagoInput, setFechaPagoInput] = useState('');

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

  // Build pagos array from cantidad_cuotas + fecha_liberacion + valor_cuota
  const buildPagos = (cantidad, valorCuota, fechaLiberacion) => {
    const n = parseInt(cantidad, 10);
    if (!n || n < 1) return [];
    return Array.from({ length: n }, (_, i) => {
      let vencimiento = '';
      if (fechaLiberacion) {
        const d = new Date(fechaLiberacion);
        d.setMonth(d.getMonth() + i);
        vencimiento = d.toISOString().split('T')[0];
      }
      return { cuota_num: i + 1, total: n, vencimiento, fecha_pago: '', status: 'pendiente' };
    });
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
      // TODO: Replace with actual API endpoint
      // const res = await api.get(`/api/sort-ges/${id}`, { withCredentials: true });
      const mockData = {
        id: parseInt(id), nombre: 'Maria', apellido: 'de Las Flores Vasquez',
        foto: 'https://randomuser.me/api/portraits/women/1.jpg',
        direccion: 'Calle de la Gloria Altiva 36 Lote 5',
        ciudad: 'Miguel Hidalgo', estado: 'Mexico', cp: '25001',
        telefono: '+52 5514789658', status: 'iniciales',
        ip_responsable: 'Ronaldo Fenomeno',
        nombre_completo: 'Maria de Las Flores Vasquez',
        curp: 'FLVM900515HDFRRS09', rfc: 'FLVM900515AB1',
        esquema_ofrecido: '$400,000.00',
        tel_1: '+52 5514789658', tel_2: '+52 5512345678',
        email: 'maria.flores@email.com', estado_civil: 'casada',
        rni: 'RNI-2024-001234', fecha_nacimiento: '1990-05-15',
        banco: 'BBVA', clabe_interbancaria: '012345678901234567',
        numero: '36', postal: '25001', alcaldia_municipio: 'Miguel Hidalgo',
        ocupacion: 'Profesionista', tipo_sangre: 'O+', peso: '65',
        fumador: false, metodo_aco: 'diu_cobre', embarazos: '2',
        cesareas: '0', partos: '2', abortos: '0', altura: '1.65',
        fumador_desde: '', tiempo_metodo_aco: '2022-01-15',
        fecha_ultima_menstruacion: '2024-01-10', hijos: '2', ultima_cesarea: '',
      };
      setCandidate(mockData);
      setRegistroInicial({
        nombre_completo: mockData.nombre_completo || '',
        curp: mockData.curp || '', rfc: mockData.rfc || '',
        esquema_ofrecido: mockData.esquema_ofrecido || '$400,000.00',
        tel_1: mockData.tel_1 || '', tel_2: mockData.tel_2 || '',
        email: mockData.email || '', estado_civil: mockData.estado_civil || '',
        rni: mockData.rni || '', fecha_nacimiento: mockData.fecha_nacimiento || '',
        edad: '', banco: mockData.banco || '',
        clabe_interbancaria: mockData.clabe_interbancaria || '',
        direccion: mockData.direccion || '', numero: mockData.numero || '',
        postal: mockData.postal || '', alcaldia_municipio: mockData.alcaldia_municipio || '',
        estado: mockData.estado || '', ocupacion: mockData.ocupacion || '',
      });
      setDatosSalud({
        tipo_sangre: mockData.tipo_sangre || '', peso: mockData.peso || '',
        fumador: mockData.fumador || false, metodo_aco: mockData.metodo_aco || '',
        embarazos: mockData.embarazos || '', cesareas: mockData.cesareas || '',
        partos: mockData.partos || '', abortos: mockData.abortos || '',
        altura: mockData.altura || '', imc: '', imc_clasificacion: '',
        fumador_desde: mockData.fumador_desde || '',
        tiempo_metodo_aco: mockData.tiempo_metodo_aco || '',
        fecha_ultima_menstruacion: mockData.fecha_ultima_menstruacion || '',
        hijos: mockData.hijos || '', ultima_cesarea: mockData.ultima_cesarea || '',
      });

      // TODO: also load seguro data
      // const segRes = await api.get(`/api/sort-ges/${id}/seguro-med`, { withCredentials: true });
      // if (segRes.data?.data) { populate seguroVida / seguroMaternidad }

      setError(null);
    } catch (err) {
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
  const openNuevoVida = () => {
    setFormVida(VIDA_EMPTY);
    setEditingVidaId(null);
    setModalVida('new');
  };
  const openEditVida = (seg) => {
    setFormVida({ fecha_alta: seg.fecha_alta, aseguradora: seg.aseguradora, gestor: seg.gestor, cuotas: seg.cuotas, valor: seg.valor, vencimiento: seg.vencimiento });
    setEditingVidaId(seg.id);
    setModalVida('new');
  };
  const saveVida = () => {
    if (editingVidaId !== null) {
      setSegurosVida(prev => prev.map(s => s.id === editingVidaId ? { ...s, ...formVida } : s));
    } else {
      const newId = Date.now();
      setSegurosVida(prev => [...prev, { id: newId, ...formVida }]);
    }
    setModalVida(null);
    showNotification('success', editingVidaId ? 'Seguro actualizado' : 'Seguro de vida registrado');
  };
  const deleteVida = (segId) => {
    setSegurosVida(prev => prev.filter(s => s.id !== segId));
    showNotification('info', 'Seguro eliminado');
  };

  // ── Seguro de Maternidad CRUD ────────────────────────────────
  const openNuevoMat = () => {
    setFormMat(MAT_EMPTY);
    setModalMat('new');
  };
  const saveMat = () => {
    const newId = Date.now();
    const pagos = buildPagos(formMat.cantidad_cuotas, formMat.valor_cuota, formMat.fecha_liberacion);
    setSegurosMat(prev => [...prev, { id: newId, ...formMat, pagos }]);
    setModalMat(null);
    showNotification('success', 'Seguro de maternidad registrado');
  };
  const deleteMat = (polizaId) => {
    setSegurosMat(prev => prev.filter(p => p.id !== polizaId));
    showNotification('info', 'Póliza eliminada');
  };

  // Open "Guardar pago" modal for a specific cuota
  const openPagoModal = (polizaId, cuotaNum) => {
    setPagoTarget({ polizaId, cuotaNum });
    setFechaPagoInput(new Date().toISOString().split('T')[0]);
    setModalMat('pago');
  };
  const savePago = () => {
    setSegurosMat(prev => prev.map(p => {
      if (p.id !== pagoTarget.polizaId) return p;
      return {
        ...p,
        pagos: p.pagos.map(c =>
          c.cuota_num === pagoTarget.cuotaNum
            ? { ...c, fecha_pago: fechaPagoInput, status: 'abonado' }
            : c
        ),
      };
    }));
    setModalMat(null);
    showNotification('success', 'Pago registrado');
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
  const handlePsicoInicialChange = (rowId, field, value) => {
    setPsicoInicial(prev => prev.map(r => r.id === rowId ? { ...r, [field]: value } : r));
  };

  // ── Seguimiento Psicológico handlers ────────────────────────
  const addSeguimiento = () => {
    const newId = Date.now();
    setSeguimientos(prev => [...prev, { id: newId, ...SEG_EMPTY }]);
    setSeguimientoOpen(prev => [...prev, newId]); // auto-expand new item
  };

  const updateSeguimiento = (segId, field, value) => {
    setSeguimientos(prev => prev.map(s => s.id === segId ? { ...s, [field]: value } : s));
  };

  const deleteSeguimiento = (segId) => {
    setSeguimientos(prev => prev.filter(s => s.id !== segId));
    setSeguimientoOpen(prev => prev.filter(id => id !== segId));
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

  // ─────────────────────────────────────────────────────────────
  // Save handlers
  // ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      setSaving(true);
      // TODO: await api.put(`/api/sort-ges/${id}`, { registroInicial, datosSalud }, { withCredentials: true });
      await new Promise(resolve => setTimeout(resolve, 500));
      showNotification('success', 'Datos guardados correctamente');
    } catch (err) {
      showNotification('danger', 'Error al guardar los datos');
    } finally {
      setSaving(false);
    }
  };

  // TODO: replace with real API call when backend is ready
  const handleSaveSeguroMed = async () => {
    try {
      setSavingSeguro(true);
      // TODO: await api.put(`/api/sort-ges/${id}/seguro-med`, { segurosVida, segurosMat }, { withCredentials: true });
      await new Promise(resolve => setTimeout(resolve, 400));
      showNotification('success', 'Seguros guardados correctamente');
    } catch (err) {
      showNotification('danger', 'Error al guardar los seguros');
    } finally {
      setSavingSeguro(false);
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
                  <h3 className="mb-1" style={{ color: '#5856d6' }}>{candidate.nombre} {candidate.apellido}</h3>
                  <p className="text-muted mb-1">{candidate.direccion}</p>
                  <p className="text-muted mb-1">{candidate.cp} - {candidate.ciudad} - {candidate.estado}</p>
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
                                  onChange={() => !isFieldLocked('datosSalud', 'fumador') && setDatosSalud(prev => ({ ...prev, fumador: true }))}
                                  disabled={isFieldLocked('datosSalud', 'fumador')} />
                                <CFormCheck type="radio" name="fumador" id="fumadorNo" label="No"
                                  checked={datosSalud.fumador === false}
                                  onChange={() => !isFieldLocked('datosSalud', 'fumador') && setDatosSalud(prev => ({ ...prev, fumador: false }))}
                                  disabled={isFieldLocked('datosSalud', 'fumador')} />
                                {isFieldLocked('datosSalud', 'fumador') && (
                                  <CButton color="warning" variant="outline" size="sm" onClick={() => requestUnlock('datosSalud', 'fumador')}>
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
                        {['consentimiento_informado', 'consentimiento_transferencia', 'aviso_privacidad', 'informacion_personal'].map(field => (
                          <div className="mb-3" key={field}>
                            <CFormCheck id={field}
                              label={{ consentimiento_informado: 'Consentimiento informado', consentimiento_transferencia: 'Consentimiento de transferencia embrionaria', aviso_privacidad: 'Aviso de privacidad', informacion_personal: 'Información personal' }[field]}
                              checked={consentimientos[field]}
                              onChange={() => handleConsentimientoChange(field)} />
                          </div>
                        ))}
                      </CCol>
                      <CCol md={6}>
                        {['regular', 'hiv', 'gemelar', 'full'].map(field => (
                          <div className="mb-3" key={field}>
                            <CFormCheck id={field}
                              label={{ regular: 'Regular', hiv: 'HIV', gemelar: 'Gemelar', full: 'Full' }[field]}
                              checked={consentimientos[field]}
                              onChange={() => handleConsentimientoChange(field)} />
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

                    {/* ── Summary cards (shown after ≥1 record) ── */}
                    {segurosVida.length > 0 && (
                      <div className="mb-4">
                        {segurosVida.map((seg) => {
                          const st = getVidaStatus(seg.vencimiento);
                          return (
                            <div
                              key={seg.id}
                              className="d-flex align-items-center justify-content-between p-3 mb-2 rounded border"
                              style={{ backgroundColor: '#f8f9fa' }}
                            >
                              {/* Left: three summary fields */}
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
                              </div>
                              {/* Right: actions */}
                              <div className="d-flex gap-2 ms-3 flex-shrink-0">
                                <CButton
                                  size="sm" color="info" variant="outline"
                                  onClick={() => setDetailVida(detailVida === seg.id ? null : seg.id)}
                                  title="Ver detalle"
                                >
                                  {detailVida === seg.id ? 'Ocultar' : 'Ver más'}
                                </CButton>
                                <CButton
                                  size="sm" color="warning" variant="outline"
                                  onClick={() => openEditVida(seg)}
                                  title="Editar"
                                >
                                  Editar
                                </CButton>
                                <CButton
                                  size="sm" color="danger" variant="outline"
                                  onClick={() => deleteVida(seg.id)}
                                  title="Eliminar"
                                >
                                  <CIcon icon={cilTrash} />
                                </CButton>
                              </div>
                            </div>
                          );
                        })}

                        {/* Expanded detail panel */}
                        {detailVida !== null && (() => {
                          const seg = segurosVida.find(s => s.id === detailVida);
                          if (!seg) return null;
                          return (
                            <div className="border rounded p-3 mb-3" style={{ backgroundColor: '#fff' }}>
                              <CRow>
                                {[
                                  ['Aseguradora', seg.aseguradora],
                                  ['Gestor', seg.gestor],
                                  ['Cuotas', seg.cuotas],
                                  ['Valor', seg.valor ? `$${seg.valor}` : '—'],
                                  ['Fecha de alta', seg.fecha_alta],
                                  ['Vencimiento', seg.vencimiento],
                                ].map(([label, val]) => (
                                  <CCol md={4} className="mb-2" key={label}>
                                    <div className="text-muted small">{label}</div>
                                    <strong>{val || '—'}</strong>
                                  </CCol>
                                ))}
                              </CRow>
                            </div>
                          );
                        })()}
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
                      <div key={poliza.id} className="mb-4 border rounded p-3">
                        {/* Poliza header */}
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <div>
                            <strong>{poliza.aseguradora || 'Sin aseguradora'}</strong>
                            <span className="text-muted ms-2 small">Póliza {poliza.numero_poliza || '—'}</span>
                            <span className="text-muted ms-2 small">· Gestor: {poliza.gestor || '—'}</span>
                          </div>
                          <CButton
                            size="sm" color="danger" variant="ghost"
                            onClick={() => deleteMat(poliza.id)}
                            title="Eliminar póliza"
                          >
                            <CIcon icon={cilTrash} />
                          </CButton>
                        </div>

                        {/* Cuotas table */}
                        <CTable bordered responsive size="sm">
                          <CTableHead color="light">
                            <CTableRow>
                              <CTableHeaderCell>Cuota</CTableHeaderCell>
                              <CTableHeaderCell>Valor de pago</CTableHeaderCell>
                              <CTableHeaderCell>Vencimiento</CTableHeaderCell>
                              <CTableHeaderCell>Status</CTableHeaderCell>
                              <CTableHeaderCell>Fecha de pago</CTableHeaderCell>
                              <CTableHeaderCell style={{ width: '200px' }}>Acciones</CTableHeaderCell>
                            </CTableRow>
                          </CTableHead>
                          <CTableBody>
                            {poliza.pagos.map((cuota) => {
                              const st = getCuotaStatus(cuota);
                              const esCancelado = cuota.status === 'cancelado';
                              const esPagado = !!cuota.fecha_pago && cuota.status !== 'cancelado';
                              return (
                                <CTableRow key={cuota.cuota_num}>
                                  {/* Cuota N/Total */}
                                  <CTableDataCell>
                                    <strong>{cuota.cuota_num}/{cuota.total}</strong>
                                  </CTableDataCell>
                                  {/* Valor */}
                                  <CTableDataCell>
                                    {poliza.valor_cuota ? `$${Number(poliza.valor_cuota).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—'}
                                  </CTableDataCell>
                                  {/* Vencimiento */}
                                  <CTableDataCell>{cuota.vencimiento || '—'}</CTableDataCell>
                                  {/* Status badge */}
                                  <CTableDataCell>
                                    <CBadge color={st.color}>{st.label}</CBadge>
                                  </CTableDataCell>
                                  {/* Fecha de pago */}
                                  <CTableDataCell>
                                    {cuota.fecha_pago || '—'}
                                  </CTableDataCell>
                                  {/* Acciones */}
                                  <CTableDataCell>
                                    <div className="d-flex gap-1">
                                      {!esCancelado && !esPagado && (
                                        <CButton
                                          size="sm"
                                          color="success"
                                          variant="outline"
                                          onClick={() => openPagoModal(poliza.id, cuota.cuota_num)}
                                          title="Registrar pago"
                                        >
                                          Guardar
                                        </CButton>
                                      )}
                                      {!esCancelado && (
                                        <CButton
                                          size="sm"
                                          color="danger"
                                          variant="outline"
                                          onClick={() => anularCuota(poliza.id, cuota.cuota_num)}
                                          title="Anular cuota"
                                        >
                                          Anular
                                        </CButton>
                                      )}
                                      {esCancelado && (
                                        <span className="text-muted small">—</span>
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
                  <CAccordionBody>
                    <CTable bordered responsive>
                      <CTableHead color="light">
                        <CTableRow>
                          <CTableHeaderCell style={{ minWidth: '210px' }}>Etapa</CTableHeaderCell>
                          <CTableHeaderCell style={{ minWidth: '155px' }}>Fecha</CTableHeaderCell>
                          <CTableHeaderCell style={{ minWidth: '160px' }}>Estado</CTableHeaderCell>
                          <CTableHeaderCell style={{ minWidth: '175px' }}>Recomendación</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {psicoInicial.map((row) => {
                          const sec = `psico_row_${row.id}`;
                          return (
                          <CTableRow key={row.id}>
                            {/* Etapa — fixed label */}
                            <CTableDataCell>
                              <span className="fw-semibold" style={{ color: '#0098b3' }}>{row.etapa}</span>
                            </CTableDataCell>

                            {/* Fecha */}
                            <CTableDataCell>
                              {renderTableInput(
                                sec, 'fecha', row.fecha,
                                e => handlePsicoInicialChange(row.id, 'fecha', e.target.value),
                                'date'
                              )}
                            </CTableDataCell>

                            {/* Estado */}
                            <CTableDataCell>
                              {renderTableSelect(
                                sec, 'estado', row.estado,
                                e => handlePsicoInicialChange(row.id, 'estado', e.target.value),
                                estadoPsicoOpts
                              )}
                            </CTableDataCell>

                            {/* Recomendación */}
                            <CTableDataCell>
                              {renderTableSelect(
                                sec, 'recomendacion', row.recomendacion,
                                e => handlePsicoInicialChange(row.id, 'recomendacion', e.target.value),
                                recomendacionOpts
                              )}
                            </CTableDataCell>
                          </CTableRow>
                          );
                        })}
                      </CTableBody>
                    </CTable>
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
        <CModalHeader><CModalTitle>Confirmar guardado</CModalTitle></CModalHeader>
        <CModalBody>
          <p>¿Desea guardar y bloquear este campo?</p>
          {pendingFieldLock.field && <p><strong>Campo:</strong> {pendingFieldLock.field.replace(/_/g, ' ')}</p>}
          {pendingFieldLock.value && <p><strong>Valor:</strong> {pendingFieldLock.value}</p>}
          <p className="text-muted small">Una vez bloqueado, necesitará una contraseña de administrador para poder editarlo.</p>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={cancelFieldLock}>Cancelar</CButton>
          <CButton color="primary" onClick={confirmFieldLock}>Guardar y bloquear</CButton>
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
            <CCol md={6} className="mb-3">
              <CFormLabel>Fecha de alta:</CFormLabel>
              <CFormInput type="date" value={formVida.fecha_alta} onChange={e => setFormVida(p => ({ ...p, fecha_alta: e.target.value }))} />
            </CCol>
            <CCol md={6} className="mb-3">
              <CFormLabel>Aseguradora:</CFormLabel>
              <CFormInput placeholder="Ej. GNP, Metlife…" value={formVida.aseguradora} onChange={e => setFormVida(p => ({ ...p, aseguradora: e.target.value }))} />
            </CCol>
            <CCol md={6} className="mb-3">
              <CFormLabel>Gestor:</CFormLabel>
              <CFormInput placeholder="Nombre del gestor" value={formVida.gestor} onChange={e => setFormVida(p => ({ ...p, gestor: e.target.value }))} />
            </CCol>
            <CCol md={3} className="mb-3">
              <CFormLabel>Cuotas:</CFormLabel>
              <CFormInput type="number" min="1" placeholder="Nº de cuotas" value={formVida.cuotas} onChange={e => setFormVida(p => ({ ...p, cuotas: e.target.value }))} />
            </CCol>
            <CCol md={3} className="mb-3">
              <CFormLabel>Valor:</CFormLabel>
              <CInputGroup>
                <CInputGroupText>$</CInputGroupText>
                <CFormInput type="number" min="0" step="0.01" placeholder="0.00" value={formVida.valor} onChange={e => setFormVida(p => ({ ...p, valor: e.target.value }))} />
              </CInputGroup>
            </CCol>
            <CCol md={6} className="mb-3">
              <CFormLabel>Vencimiento cobertura:</CFormLabel>
              <CFormInput type="date" value={formVida.vencimiento} onChange={e => setFormVida(p => ({ ...p, vencimiento: e.target.value }))} />
            </CCol>
          </CRow>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setModalVida(null)}>Cancelar</CButton>
          <CButton
            color="primary"
            onClick={saveVida}
            style={{ backgroundColor: '#899973', borderColor: '#899973' }}
          >
            <CIcon icon={cilSave} className="me-1" />
            {editingVidaId !== null ? 'Actualizar' : 'Registrar'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* ── Modal: Nuevo Seguro de Maternidad ─────────────── */}
      <CModal visible={modalMat === 'new'} onClose={() => setModalMat(null)} size="lg">
        <CModalHeader>
          <CModalTitle>Nuevo seguro de maternidad</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CRow>
            <CCol md={6} className="mb-3">
              <CFormLabel>Gestor:</CFormLabel>
              <CFormInput placeholder="Nombre del gestor" value={formMat.gestor} onChange={e => setFormMat(p => ({ ...p, gestor: e.target.value }))} />
            </CCol>
            <CCol md={3} className="mb-3">
              <CFormLabel>Cantidad de cuotas:</CFormLabel>
              <CFormInput type="number" min="1" placeholder="Ej. 4" value={formMat.cantidad_cuotas} onChange={e => setFormMat(p => ({ ...p, cantidad_cuotas: e.target.value }))} />
            </CCol>
            <CCol md={3} className="mb-3">
              <CFormLabel>Valor por cuota:</CFormLabel>
              <CInputGroup>
                <CInputGroupText>$</CInputGroupText>
                <CFormInput type="number" min="0" step="0.01" placeholder="0.00" value={formMat.valor_cuota} onChange={e => setFormMat(p => ({ ...p, valor_cuota: e.target.value }))} />
              </CInputGroup>
            </CCol>
            <CCol md={4} className="mb-3">
              <CFormLabel>Fecha de liberación:</CFormLabel>
              <CFormInput type="date" value={formMat.fecha_liberacion} onChange={e => setFormMat(p => ({ ...p, fecha_liberacion: e.target.value }))} />
            </CCol>
            <CCol md={4} className="mb-3">
              <CFormLabel>Fecha de alta:</CFormLabel>
              <CFormInput type="date" value={formMat.fecha_alta} onChange={e => setFormMat(p => ({ ...p, fecha_alta: e.target.value }))} />
            </CCol>
            <CCol md={4} className="mb-3">
              <CFormLabel>Fecha de vencimiento:</CFormLabel>
              <CFormInput type="date" value={formMat.fecha_vencimiento} onChange={e => setFormMat(p => ({ ...p, fecha_vencimiento: e.target.value }))} />
            </CCol>
            <CCol md={6} className="mb-3">
              <CFormLabel>Aseguradora:</CFormLabel>
              <CFormInput placeholder="Ej. GNP, Metlife…" value={formMat.aseguradora} onChange={e => setFormMat(p => ({ ...p, aseguradora: e.target.value }))} />
            </CCol>
            <CCol md={6} className="mb-3">
              <CFormLabel>Número de póliza:</CFormLabel>
              <CFormInput placeholder="Ej. POL-000456" value={formMat.numero_poliza} onChange={e => setFormMat(p => ({ ...p, numero_poliza: e.target.value }))} />
            </CCol>
          </CRow>
          {/* Preview of generated cuotas */}
          {formMat.cantidad_cuotas && formMat.fecha_liberacion && (
            <div className="mt-2">
              <p className="text-muted small mb-2">Vista previa de cuotas generadas:</p>
              <div className="d-flex flex-wrap gap-2">
                {buildPagos(formMat.cantidad_cuotas, formMat.valor_cuota, formMat.fecha_liberacion).map(c => (
                  <CBadge key={c.cuota_num} color="secondary">
                    {c.cuota_num}/{c.total} — {c.vencimiento}
                  </CBadge>
                ))}
              </div>
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setModalMat(null)}>Cancelar</CButton>
          <CButton
            color="primary"
            onClick={saveMat}
            style={{ backgroundColor: '#899973', borderColor: '#899973' }}
          >
            <CIcon icon={cilSave} className="me-1" />Registrar
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
          <CFormLabel>Fecha de pago:</CFormLabel>
          <CFormInput
            type="date"
            value={fechaPagoInput}
            onChange={e => setFechaPagoInput(e.target.value)}
          />
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setModalMat(null)}>Cancelar</CButton>
          <CButton
            color="success"
            onClick={savePago}
            disabled={!fechaPagoInput}
          >
            <CIcon icon={cilSave} className="me-1" />Confirmar pago
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
      `}</style>
    </CContainer>
  );
};

export default SortGes;