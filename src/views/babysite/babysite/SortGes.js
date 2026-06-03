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
  { 
    id: 'alta-gesca', 
    label: 'ALTA GESCA', 
    color: '#d97ea1', 
    icon: cilUser 
  },
  { 
    id: 'checklist', 
    label: 'CHECK LIST', 
    color: '#0071b8', 
    icon: cilClipboard 
  },
  { 
    id: 'seguro-med', 
    label: 'SEGURO MED', 
    color: '#899973', 
    icon: cilShieldAlt 
  },
  { 
    id: 'psico-social', 
    label: 'PSICO SOCIAL', 
    color: '#0098b3', 
    icon: cilPeople 
  },
  { 
    id: 'cita-previa', 
    label: 'CITA PREVIA', 
    color: '#a14567', 
    icon: cilCalendar 
  },
];

const SortGes = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Active tab state
  const [activeTab, setActiveTab] = useState('alta-gesca');

  // Data state
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Alert state
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  // Field locking state
  const [lockedFields, setLockedFields] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingFieldLock, setPendingFieldLock] = useState({ section: null, field: null, value: null });
  const [fieldToUnlock, setFieldToUnlock] = useState({ section: null, field: null });
  const [unlockPassword, setUnlockPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Use ref for active editing field to avoid race conditions with blur/focus events
  const activeEditingFieldRef = useRef({ section: null, field: null, initialValue: null });

  // Password for unlocking fields
  const UNLOCK_PASSWORD = 'adm@bbcloud1';

  // Form data state - Alta GESCA - Registro Inicial
  const [registroInicial, setRegistroInicial] = useState({
    nombre_completo: '',
    curp: '',
    rfc: '',
    esquema_ofrecido: '$400,000.00',
    tel_1: '',
    tel_2: '',
    email: '',
    estado_civil: '',
    rni: '',
    fecha_nacimiento: '',
    edad: '',
    banco: '',
    clabe_interbancaria: '',
    direccion: '',
    numero: '',
    postal: '',
    alcaldia_municipio: '',
    estado: '',
    ocupacion: '',
  });

  // Form data state - Checklist - Archivado de documentación
  const [documentos, setDocumentos] = useState({
    certificado_nacimiento: null,
    curp: null,
    comprobante_domicilio: null,
    poliza_seguro: null,
    cita_entrega: '',
  });

  // Form data state - Checklist - Consentimientos firmados
  const [consentimientos, setConsentimientos] = useState({
    cita_firma: '',
    consentimiento_informado: false,
    consentimiento_transferencia: false,
    aviso_privacidad: false,
    informacion_personal: false,
    regular: false,
    hiv: false,
    gemelar: false,
    full: false,
  });

  // Form data state - Alta GESCA - Datos de Salud
  const [datosSalud, setDatosSalud] = useState({
    tipo_sangre: '',
    peso: '',
    fumador: false,
    metodo_aco: '',
    embarazos: '',
    cesareas: '',
    partos: '',
    abortos: '',
    altura: '',
    imc: '',
    imc_clasificacion: '',
    fumador_desde: '',
    tiempo_metodo_aco: '',
    fecha_ultima_menstruacion: '',
    hijos: '',
    ultima_cesarea: '',
  });

  // Form data state - PSICO SOCIAL - Perfil Psicológico
  const [perfilPsicologico, setPerfilPsicologico] = useState([
    { id: 1, descripcion: '', fecha: '', estado: '', perfil: '', responsable: '' },
  ]);

  // Estado options for perfil psicológico
  const estadoPsicoOptions = [
    { value: '', label: 'Seleccionar...' },
    { value: 'programar', label: 'Programar' },
    { value: 'concluido', label: 'Concluido' },
    { value: 'no_aplica', label: 'No aplica' },
  ];

  // Select options
  const esquemaOptions = [
    { value: '$400,000.00', label: '$400,000.00' },
    { value: '$375,000.00', label: '$375,000.00' },
  ];

  const tipoSangreOptions = [
    { value: '', label: 'Seleccionar...' },
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' },
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

  // Fetch candidate on mount
  useEffect(() => {
    if (id) {
      fetchCandidate();
    }
  }, [id]);

  // Calculate IMC when peso or altura changes
  useEffect(() => {
    const peso = parseFloat(datosSalud.peso);
    const altura = parseFloat(datosSalud.altura);
    
    if (peso > 0 && altura > 0) {
      const imc = peso / (altura * altura);
      const imcRounded = imc.toFixed(1);
      let clasificacion = '';
      
      if (imc < 18.5) {
        clasificacion = 'Bajo peso';
      } else if (imc >= 18.5 && imc < 23) {
        clasificacion = 'Peso normal';
      } else if (imc >= 23 && imc < 25) {
        clasificacion = 'Riesgo de sobrepeso';
      } else if (imc >= 25 && imc < 30) {
        clasificacion = 'Sobrepeso';
      } else {
        clasificacion = 'Obesidad';
      }
      
      setDatosSalud(prev => ({
        ...prev,
        imc: imcRounded,
        imc_clasificacion: clasificacion,
      }));
    }
  }, [datosSalud.peso, datosSalud.altura]);

  // Calculate age from fecha_nacimiento
  useEffect(() => {
    if (registroInicial.fecha_nacimiento) {
      const today = new Date();
      const birthDate = new Date(registroInicial.fecha_nacimiento);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setRegistroInicial(prev => ({ ...prev, edad: age.toString() }));
    }
  }, [registroInicial.fecha_nacimiento]);

  const fetchCandidate = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API endpoint
      // const res = await api.get(`/api/sort-ges/${id}`, { withCredentials: true });
      // setCandidate(res.data);
      
      // Mock data for development
      const mockData = {
        id: parseInt(id),
        nombre: 'Maria',
        apellido: 'de Las Flores Vasquez',
        foto: 'https://randomuser.me/api/portraits/women/1.jpg',
        direccion: 'Calle de la Gloria Altiva 36 Lote 5',
        ciudad: 'Miguel Hidalgo',
        estado: 'Mexico',
        cp: '25001',
        telefono: '+52 5514789658',
        status: 'iniciales',
        ip_responsable: 'Ronaldo Fenomeno',
        // Registro Inicial data
        nombre_completo: 'Maria de Las Flores Vasquez',
        curp: 'FLVM900515HDFRRS09',
        rfc: 'FLVM900515AB1',
        esquema_ofrecido: '$400,000.00',
        tel_1: '+52 5514789658',
        tel_2: '+52 5512345678',
        email: 'maria.flores@email.com',
        estado_civil: 'casada',
        rni: 'RNI-2024-001234',
        fecha_nacimiento: '1990-05-15',
        banco: 'BBVA',
        clabe_interbancaria: '012345678901234567',
        numero: '36',
        postal: '25001',
        alcaldia_municipio: 'Miguel Hidalgo',
        ocupacion: 'Profesionista',
        // Datos de Salud
        tipo_sangre: 'O+',
        peso: '65',
        fumador: false,
        metodo_aco: 'diu_cobre',
        embarazos: '2',
        cesareas: '0',
        partos: '2',
        abortos: '0',
        altura: '1.65',
        fumador_desde: '',
        tiempo_metodo_aco: '2022-01-15',
        fecha_ultima_menstruacion: '2024-01-10',
        hijos: '2',
        ultima_cesarea: '',
      };
      
      setCandidate(mockData);
      
      // Populate form data
      setRegistroInicial({
        nombre_completo: mockData.nombre_completo || '',
        curp: mockData.curp || '',
        rfc: mockData.rfc || '',
        esquema_ofrecido: mockData.esquema_ofrecido || '$400,000.00',
        tel_1: mockData.tel_1 || '',
        tel_2: mockData.tel_2 || '',
        email: mockData.email || '',
        estado_civil: mockData.estado_civil || '',
        rni: mockData.rni || '',
        fecha_nacimiento: mockData.fecha_nacimiento || '',
        edad: '',
        banco: mockData.banco || '',
        clabe_interbancaria: mockData.clabe_interbancaria || '',
        direccion: mockData.direccion || '',
        numero: mockData.numero || '',
        postal: mockData.postal || '',
        alcaldia_municipio: mockData.alcaldia_municipio || '',
        estado: mockData.estado || '',
        ocupacion: mockData.ocupacion || '',
      });
      
      setDatosSalud({
        tipo_sangre: mockData.tipo_sangre || '',
        peso: mockData.peso || '',
        fumador: mockData.fumador || false,
        metodo_aco: mockData.metodo_aco || '',
        embarazos: mockData.embarazos || '',
        cesareas: mockData.cesareas || '',
        partos: mockData.partos || '',
        abortos: mockData.abortos || '',
        altura: mockData.altura || '',
        imc: '',
        imc_clasificacion: '',
        fumador_desde: mockData.fumador_desde || '',
        tiempo_metodo_aco: mockData.tiempo_metodo_aco || '',
        fecha_ultima_menstruacion: mockData.fecha_ultima_menstruacion || '',
        hijos: mockData.hijos || '',
        ultima_cesarea: mockData.ultima_cesarea || '',
      });
      
      setError(null);
    } catch (err) {
      console.error('Error fetching candidate:', err);
      setError('Error al cargar los datos del candidato');
    } finally {
      setLoading(false);
    }
  };

  // Show notification
  const showNotification = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

  // Handle Registro Inicial changes
  const handleRegistroInicialChange = (e) => {
    const { name, value } = e.target;
    // Only allow changes if field is not locked
    if (!isFieldLocked('registroInicial', name)) {
      setRegistroInicial(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle Datos Salud changes
  const handleDatosSaludChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Only allow changes if field is not locked
    if (!isFieldLocked('datosSalud', name)) {
      setDatosSalud(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  // Handle Perfil Psicológico table changes
  const handlePerfilPsicoChange = (id, field, value) => {
    setPerfilPsicologico(prev => prev.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  // Handle perfil radio selection (only one can be selected)
  const handlePerfilRadioChange = (id, selectedPerfil) => {
    setPerfilPsicologico(prev => prev.map(row => 
      row.id === id ? { ...row, perfil: selectedPerfil } : row
    ));
  };

  // Add new row to perfil psicológico
  const addPerfilPsicoRow = () => {
    const newId = Math.max(...perfilPsicologico.map(r => r.id), 0) + 1;
    setPerfilPsicologico(prev => [...prev, {
      id: newId,
      descripcion: '',
      fecha: '',
      estado: '',
      perfil: '',
      responsable: '',
    }]);
  };

  // Remove row from perfil psicológico
  const removePerfilPsicoRow = (id) => {
    if (perfilPsicologico.length > 1) {
      setPerfilPsicologico(prev => prev.filter(row => row.id !== id));
    }
  };

  // Check if a field is locked
  const isFieldLocked = (section, field) => {
    return lockedFields[`${section}.${field}`] === true;
  };

  // Handle field focus - track which field is being edited and its initial value
  const handleFieldFocus = (section, field, currentValue) => {
    activeEditingFieldRef.current = { section, field, initialValue: currentValue || '' };
  };

  // Handle field blur - show confirmation to lock the field that was being edited
  const handleFieldBlur = (section, field, currentValue) => {
    const activeField = activeEditingFieldRef.current;
    
    // Only process if this is the field we were tracking
    if (activeField.section !== section || activeField.field !== field) {
      return;
    }
    
    // Don't show modal for empty values, already locked fields, or auto-calculated fields
    if (!currentValue || currentValue === '' || isFieldLocked(section, field)) {
      activeEditingFieldRef.current = { section: null, field: null, initialValue: null };
      return;
    }
    if (field === 'edad' || field === 'imc' || field === 'imc_clasificacion') {
      activeEditingFieldRef.current = { section: null, field: null, initialValue: null };
      return;
    }
    
    // Check if value changed from initial
    if (currentValue !== activeField.initialValue) {
      setPendingFieldLock({ section, field, value: currentValue });
      setShowConfirmModal(true);
    }
    
    activeEditingFieldRef.current = { section: null, field: null, initialValue: null };
  };

  // Confirm field lock
  const confirmFieldLock = () => {
    const { section, field } = pendingFieldLock;
    setLockedFields(prev => ({
      ...prev,
      [`${section}.${field}`]: true,
    }));
    setShowConfirmModal(false);
    setPendingFieldLock({ section: null, field: null, value: null });
    showNotification('success', 'Campo guardado y bloqueado');
  };

  // Cancel field lock
  const cancelFieldLock = () => {
    setShowConfirmModal(false);
    setPendingFieldLock({ section: null, field: null, value: null });
  };

  // Request to unlock a field
  const requestUnlock = (section, field) => {
    setFieldToUnlock({ section, field });
    setUnlockPassword('');
    setPasswordError('');
    setShowPasswordModal(true);
  };

  // Verify password and unlock field
  const verifyPasswordAndUnlock = () => {
    if (unlockPassword === UNLOCK_PASSWORD) {
      const { section, field } = fieldToUnlock;
      setLockedFields(prev => {
        const newLocked = { ...prev };
        delete newLocked[`${section}.${field}`];
        return newLocked;
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

  // Cancel unlock
  const cancelUnlock = () => {
    setShowPasswordModal(false);
    setFieldToUnlock({ section: null, field: null });
    setUnlockPassword('');
    setPasswordError('');
  };

  // Render lockable input field
  const renderLockableInput = (section, field, value, onChange, props = {}) => {
    const locked = isFieldLocked(section, field);
    const { type = 'text', placeholder = '', disabled: propsDisabled, ...restProps } = props;
    
    const handleFocus = (e) => {
      handleFieldFocus(section, field, e.target.value);
    };
    
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.target.blur(); // This will trigger the blur handler
      }
    };
    
    const handleBlur = (e) => {
      const currentValue = e.target.value;
      handleFieldBlur(section, field, currentValue);
    };
    
    return (
      <CInputGroup>
        <CFormInput
          type={type}
          name={field}
          value={value || ''}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={locked || propsDisabled}
          style={locked ? { backgroundColor: '#e9ecef' } : {}}
          {...restProps}
        />
        {locked ? (
          <CButton
            color="warning"
            variant="outline"
            onClick={() => requestUnlock(section, field)}
            title="Desbloquear campo"
          >
            <CIcon icon={cilLockLocked} />
          </CButton>
        ) : value ? (
          <CInputGroupText style={{ backgroundColor: 'transparent', border: 'none' }}>
            <CIcon icon={cilLockUnlocked} className="text-muted" style={{ opacity: 0.5 }} />
          </CInputGroupText>
        ) : null}
      </CInputGroup>
    );
  };

  // Render lockable select field
  const renderLockableSelect = (section, field, value, onChange, options, props = {}) => {
    const locked = isFieldLocked(section, field);
    
    const handleFocus = (e) => {
      handleFieldFocus(section, field, e.target.value);
    };
    
    const handleBlur = (e) => {
      const currentValue = e.target.value;
      handleFieldBlur(section, field, currentValue);
    };

    const handleChange = (e) => {
      // First update the value
      onChange(e);
      // Then check if we should show lock confirmation
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
          name={field}
          value={value || ''}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={locked}
          style={locked ? { backgroundColor: '#e9ecef' } : {}}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </CFormSelect>
        {locked ? (
          <CButton
            color="warning"
            variant="outline"
            onClick={() => requestUnlock(section, field)}
            title="Desbloquear campo"
          >
            <CIcon icon={cilLockLocked} />
          </CButton>
        ) : value ? (
          <CInputGroupText style={{ backgroundColor: 'transparent', border: 'none' }}>
            <CIcon icon={cilLockUnlocked} className="text-muted" style={{ opacity: 0.5 }} />
          </CInputGroupText>
        ) : null}
      </CInputGroup>
    );
  };

  // Save data
  const handleSave = async () => {
    try {
      setSaving(true);
      // TODO: Implement save API call
      // await api.put(`/api/sort-ges/${id}`, { registroInicial, datosSalud }, { withCredentials: true });
      
      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      showNotification('success', 'Datos guardados correctamente');
    } catch (err) {
      console.error('Error saving data:', err);
      showNotification('danger', 'Error al guardar los datos');
    } finally {
      setSaving(false);
    }
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    const statusMap = {
      iniciales: { label: 'Iniciales', color: 'info' },
      en_proceso: { label: 'En Proceso', color: 'warning' },
      aprobado: { label: 'Aprobado', color: 'success' },
      rechazado: { label: 'Rechazado', color: 'danger' },
    };
    return statusMap[status] || { label: status, color: 'secondary' };
  };

  // Get IMC badge color
  const getIMCBadgeColor = (clasificacion) => {
    const colorMap = {
      'Bajo peso': 'warning',
      'Peso normal': 'success',
      'Riesgo de sobrepeso': 'info',
      'Sobrepeso': 'warning',
      'Obesidad': 'danger',
    };
    return colorMap[clasificacion] || 'secondary';
  };

  // Calculate document upload status
  const getDocumentosStatus = () => {
    const docs = [
      documentos.certificado_nacimiento,
      documentos.curp,
      documentos.comprobante_domicilio,
      documentos.poliza_seguro,
    ];
    const uploadedCount = docs.filter(doc => doc !== null).length;
    
    if (uploadedCount === 0) return { label: 'Sin dts', color: 'secondary' };
    if (uploadedCount === 4) return { label: 'Completado', color: 'success' };
    return { label: 'Incompleto', color: 'warning' };
  };

  // Calculate cita entrega status
  const getCitaEntregaStatus = () => {
    const docStatus = getDocumentosStatus();
    
    if (docStatus.label === 'Completado') {
      return { label: 'Completado', color: 'success' };
    }
    
    // Check if date is selected - show programada/reprogramar based on date
    if (documentos.cita_entrega) {
      const citaDate = new Date(documentos.cita_entrega);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      citaDate.setHours(0, 0, 0, 0);
      
      if (citaDate < today) {
        return { label: 'Reprogramar', color: 'danger' };
      }
      return { label: 'Programada', color: 'info' };
    }
    
    // No date selected
    return { label: 'Sin dts', color: 'secondary' };
  };

  // Calculate consentimientos status
  const getConsentimientosStatus = () => {
    const checks = [
      consentimientos.consentimiento_informado,
      consentimientos.consentimiento_transferencia,
      consentimientos.aviso_privacidad,
      consentimientos.informacion_personal,
      consentimientos.regular,
      consentimientos.hiv,
      consentimientos.gemelar,
      consentimientos.full,
    ];
    const checkedCount = checks.filter(Boolean).length;
    
    if (checkedCount === 0) return { label: 'Sin dts', color: 'secondary' };
    if (checkedCount === 8) return { label: 'Completado', color: 'success' };
    return { label: 'Incompleto', color: 'warning' };
  };

  // Calculate cita firma status
  const getCitaFirmaStatus = () => {
    const consentStatus = getConsentimientosStatus();
    
    if (consentStatus.label === 'Completado') {
      return { label: 'Completado', color: 'success' };
    }
    
    // Check if date is selected - show programada/reprogramar based on date
    if (consentimientos.cita_firma) {
      const citaDate = new Date(consentimientos.cita_firma);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      citaDate.setHours(0, 0, 0, 0);
      
      if (citaDate < today) {
        return { label: 'Reprogramar', color: 'danger' };
      }
      return { label: 'Programada', color: 'info' };
    }
    
    // No date selected
    return { label: 'Sin dts', color: 'secondary' };
  };

  // Handle document file upload
  const handleDocumentUpload = (fieldName, event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setDocumentos(prev => ({
        ...prev,
        [fieldName]: {
          name: file.name,
          file: file,
          uploadedAt: new Date().toISOString(),
        },
      }));
      showNotification('success', `Archivo "${file.name}" cargado correctamente`);
    } else if (file) {
      showNotification('danger', 'Por favor seleccione un archivo PDF');
    }
  };

  // Remove uploaded document
  const handleRemoveDocument = (fieldName) => {
    setDocumentos(prev => ({
      ...prev,
      [fieldName]: null,
    }));
    showNotification('info', 'Archivo eliminado');
  };

  // Handle consentimiento checkbox change
  const handleConsentimientoChange = (fieldName) => {
    setConsentimientos(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  // Handle cita date changes
  const handleCitaEntregaChange = (e) => {
    setDocumentos(prev => ({
      ...prev,
      cita_entrega: e.target.value,
    }));
  };

  const handleCitaFirmaChange = (e) => {
    setConsentimientos(prev => ({
      ...prev,
      cita_firma: e.target.value,
    }));
  };

  // Auto-set cita_entrega to today when all documents are uploaded
  useEffect(() => {
    const docStatus = getDocumentosStatus();
    if (docStatus.label === 'Completado') {
      const today = new Date().toISOString().split('T')[0];
      setDocumentos(prev => ({
        ...prev,
        cita_entrega: today,
      }));
    }
  }, [documentos.certificado_nacimiento, documentos.curp, documentos.comprobante_domicilio, documentos.poliza_seguro]);

  // Auto-set cita_firma to today when all consentimientos are checked
  useEffect(() => {
    const consentStatus = getConsentimientosStatus();
    if (consentStatus.label === 'Completado') {
      const today = new Date().toISOString().split('T')[0];
      setConsentimientos(prev => ({
        ...prev,
        cita_firma: today,
      }));
    }
  }, [
    consentimientos.consentimiento_informado,
    consentimientos.consentimiento_transferencia,
    consentimientos.aviso_privacidad,
    consentimientos.informacion_personal,
    consentimientos.regular,
    consentimientos.hiv,
    consentimientos.gemelar,
    consentimientos.full,
  ]);

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
          <CIcon icon={cilArrowLeft} className="me-2" />
          Volver a la lista
        </CButton>
      </CContainer>
    );
  }

  const statusInfo = getStatusBadge(candidate.status);

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
            <CButton 
              color="primary" 
              style={{ 
                backgroundColor: '#d97ea1', 
                borderColor: '#d97ea1',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                padding: 0,
              }}
            >
              <CIcon icon={cilFile} />
            </CButton>
          </div>
        </CCardHeader>
        <CCardBody>
          {/* Candidate Header Info */}
          <CRow className="mb-4">
            <CCol md={8}>
              <div className="d-flex align-items-start">
                <div>
                  <h3 className="mb-1" style={{ color: '#5856d6' }}>
                    {candidate.nombre} {candidate.apellido}
                  </h3>
                  <p className="text-muted mb-1">{candidate.direccion}</p>
                  <p className="text-muted mb-1">{candidate.cp} - {candidate.ciudad} - {candidate.estado}</p>
                  <p className="text-muted mb-1">{candidate.telefono}</p>
                  <p className="mb-1">
                    Status: <CBadge color={statusInfo.color}>{statusInfo.label}</CBadge>
                  </p>
                  <p className="text-muted mb-0">
                    <strong>IP:</strong> {candidate.ip_responsable}
                  </p>
                </div>
                <div className="ms-3">
                  <CButton 
                    color="light" 
                    variant="outline"
                    size="sm"
                    style={{ color: '#dc3545' }}
                  >
                    <CIcon icon={cilFile} className="me-1" />
                    PDF
                  </CButton>
                </div>
              </div>
            </CCol>
            <CCol md={4} className="text-end">
              <CAvatar 
                src={candidate.foto} 
                size="xl" 
                style={{ 
                  width: '120px', 
                  height: '120px', 
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
              />
            </CCol>
          </CRow>

          {/* Tabs Navigation */}
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
                    borderRadius: '8px',
                    marginRight: '8px',
                    padding: '10px 20px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <CIcon icon={tab.icon} />
                  {tab.label}
                </CNavLink>
              </CNavItem>
            ))}
          </CNav>

          {/* Tab Content */}
          <CTabContent>
            {/* ALTA GESCA Tab */}
            <CTabPane visible={activeTab === 'alta-gesca'}>
              <CAccordion activeItemKey={1} alwaysOpen>
                {/* Accordion 1: Registro Inicial / Datos personales */}
                <CAccordionItem itemKey={1}>
                  <CAccordionHeader>
                    <strong>Registro Inicial / Datos personales</strong>
                  </CAccordionHeader>
                  <CAccordionBody>
                    <CRow>
                      {/* First Column - Narrower */}
                      <CCol md={4}>
                        <div className="mb-2">
                          <CFormLabel>Nombre completo:</CFormLabel>
                          {renderLockableInput('registroInicial', 'nombre_completo', registroInicial.nombre_completo, handleRegistroInicialChange, { placeholder: 'Nombre completo' })}
                        </div>
                        <div className="mb-2">
                          <CFormLabel>CURP:</CFormLabel>
                          {renderLockableInput('registroInicial', 'curp', registroInicial.curp, handleRegistroInicialChange, { placeholder: 'CURP', maxLength: 18 })}
                        </div>
                        <div className="mb-2">
                          <CFormLabel>RFC:</CFormLabel>
                          {renderLockableInput('registroInicial', 'rfc', registroInicial.rfc, handleRegistroInicialChange, { placeholder: 'RFC' })}
                        </div>
                        <div className="mb-2">
                          <CFormLabel>Esquema ofrecido:</CFormLabel>
                          {renderLockableSelect('registroInicial', 'esquema_ofrecido', registroInicial.esquema_ofrecido, handleRegistroInicialChange, esquemaOptions)}
                        </div>
                        <div className="mb-2">
                          <CFormLabel>Tel 1:</CFormLabel>
                          {renderLockableInput('registroInicial', 'tel_1', registroInicial.tel_1, handleRegistroInicialChange, { placeholder: 'Teléfono 1' })}
                        </div>
                        <div className="mb-2">
                          <CFormLabel>Tel 2:</CFormLabel>
                          {renderLockableInput('registroInicial', 'tel_2', registroInicial.tel_2, handleRegistroInicialChange, { placeholder: 'Teléfono 2' })}
                        </div>
                        <div className="mb-2">
                          <CFormLabel>Email:</CFormLabel>
                          {renderLockableInput('registroInicial', 'email', registroInicial.email, handleRegistroInicialChange, { type: 'email', placeholder: 'correo@ejemplo.com' })}
                        </div>
                        <div className="mb-2">
                          <CFormLabel>Estado civil:</CFormLabel>
                          {renderLockableSelect('registroInicial', 'estado_civil', registroInicial.estado_civil, handleRegistroInicialChange, estadoCivilOptions)}
                        </div>
                      </CCol>

                      {/* Second Column - Wider with split fields */}
                      <CCol md={8}>
                        {/* RNI - full width at the beginning */}
                        <div className="mb-2">
                          <CFormLabel>RNI:</CFormLabel>
                          {renderLockableInput('registroInicial', 'rni', registroInicial.rni, handleRegistroInicialChange, { placeholder: 'RNI' })}
                        </div>

                        {/* Fecha de nacimiento + Edad */}
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
                              <CFormInput
                                name="edad"
                                value={registroInicial.edad}
                                readOnly
                                disabled
                                placeholder="Automático"
                              />
                            </div>
                          </CCol>
                        </CRow>

                        {/* Banco + CLABE */}
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

                        {/* Dirección - full width */}
                        <div className="mb-2">
                          <CFormLabel>Dirección:</CFormLabel>
                          {renderLockableInput('registroInicial', 'direccion', registroInicial.direccion, handleRegistroInicialChange, { placeholder: 'Calle y nombre' })}
                        </div>

                        {/* Número + Código Postal */}
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

                        {/* Alcaldía/municipio + Estado */}
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

                        {/* Ocupación - full width */}
                        <div className="mb-2">
                          <CFormLabel>Ocupación (especificar):</CFormLabel>
                          {renderLockableInput('registroInicial', 'ocupacion', registroInicial.ocupacion, handleRegistroInicialChange, { placeholder: 'Ocupación' })}
                        </div>
                      </CCol>
                    </CRow>
                  </CAccordionBody>
                </CAccordionItem>

                {/* Accordion 2: Datos de Salud Iniciales */}
                <CAccordionItem itemKey={2}>
                  <CAccordionHeader>
                    <strong>Datos de Salud Iniciales de Requisitos al Programa</strong>
                  </CAccordionHeader>
                  <CAccordionBody>
                    <CRow>
                      {/* First Column */}
                      <CCol md={6}>
                        {/* Tipo de sangre + IMC */}
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
                                <CFormInput
                                  name="imc"
                                  value={datosSalud.imc}
                                  readOnly
                                  disabled
                                  placeholder="Auto"
                                />
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

                        {/* Peso + Altura */}
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

                        {/* Fumador + Fumador desde */}
                        <CRow>
                          <CCol md={6}>
                            <div className="mb-2">
                              <CFormLabel>Fumador:</CFormLabel>
                              <div className="d-flex align-items-center gap-3 mt-1">
                                <CFormCheck
                                  type="radio"
                                  name="fumador"
                                  id="fumadorSi"
                                  label="Sí"
                                  checked={datosSalud.fumador === true}
                                  onChange={() => !isFieldLocked('datosSalud', 'fumador') && setDatosSalud(prev => ({ ...prev, fumador: true }))}
                                  disabled={isFieldLocked('datosSalud', 'fumador')}
                                />
                                <CFormCheck
                                  type="radio"
                                  name="fumador"
                                  id="fumadorNo"
                                  label="No"
                                  checked={datosSalud.fumador === false}
                                  onChange={() => !isFieldLocked('datosSalud', 'fumador') && setDatosSalud(prev => ({ ...prev, fumador: false }))}
                                  disabled={isFieldLocked('datosSalud', 'fumador')}
                                />
                                {isFieldLocked('datosSalud', 'fumador') && (
                                  <CButton
                                    color="warning"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => requestUnlock('datosSalud', 'fumador')}
                                    title="Desbloquear campo"
                                  >
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

                        {/* Método ACO + Fecha inicio ACO */}
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

                      {/* Second Column */}
                      <CCol md={6}>
                        {/* Embarazos + Cesáreas + Hijos */}
                        <CRow>
                          <CCol md={4}>
                            <div className="mb-2">
                              <CFormLabel>Embarazos:</CFormLabel>
                              {renderLockableInput('datosSalud', 'embarazos', datosSalud.embarazos, handleDatosSaludChange, { type: 'number', min: '0', placeholder: '#' })}
                            </div>
                          </CCol>
                          <CCol md={4}>
                            <div className="mb-2">
                              <CFormLabel>Cesáreas:</CFormLabel>
                              {renderLockableInput('datosSalud', 'cesareas', datosSalud.cesareas, handleDatosSaludChange, { type: 'number', min: '0', placeholder: '#' })}
                            </div>
                          </CCol>
                          <CCol md={4}>
                            <div className="mb-2">
                              <CFormLabel>Hijos:</CFormLabel>
                              {renderLockableInput('datosSalud', 'hijos', datosSalud.hijos, handleDatosSaludChange, { type: 'number', min: '0', placeholder: '#' })}
                            </div>
                          </CCol>
                        </CRow>

                        {/* Fecha última menstruación + Fecha última cesárea */}
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

                        {/* Partos + Abortos */}
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

            {/* CHECK LIST Tab */}
            <CTabPane visible={activeTab === 'checklist'}>
              <CAccordion alwaysOpen activeItemKey={1}>
                {/* Archivado de documentación */}
                <CAccordionItem itemKey={1}>
                  <CAccordionHeader>
                    <strong>Archivado de documentación</strong>
                  </CAccordionHeader>
                  <CAccordionBody>
                    <CRow>
                      {/* First Column - Document uploads */}
                      <CCol md={6}>
                        {/* Certificado de nacimiento */}
                        <div className="mb-3">
                          <CFormLabel>Certificado de nacimiento:</CFormLabel>
                          <div className="d-flex align-items-center gap-2">
                            <input
                              type="file"
                              accept=".pdf"
                              id="certificado_nacimiento"
                              style={{ display: 'none' }}
                              onChange={(e) => handleDocumentUpload('certificado_nacimiento', e)}
                            />
                            <CButton
                              color={documentos.certificado_nacimiento ? 'success' : undefined}
                              variant="outline"
                              onClick={() => document.getElementById('certificado_nacimiento').click()}
                              className={`d-flex align-items-center gap-2 ${!documentos.certificado_nacimiento ? 'pdf-upload-btn' : ''}`}
                              style={!documentos.certificado_nacimiento ? { borderColor: '#0071b8', color: '#0071b8' } : {}}
                            >
                              {documentos.certificado_nacimiento ? (
                                <>
                                  <CIcon icon={cilFile} />
                                  PDF
                                </>
                              ) : (
                                <>
                                  <CIcon icon={cilCloudUpload} />
                                  Subir PDF
                                </>
                              )}
                            </CButton>
                            {documentos.certificado_nacimiento && (
                              <>
                                <span className="text-muted small text-truncate" style={{ maxWidth: '150px' }}>
                                  {documentos.certificado_nacimiento.name}
                                </span>
                                <CButton
                                  color="danger"
                                  variant="ghost"
                                  size="sm"
                                  className="remove-file-btn"
                                  onClick={() => handleRemoveDocument('certificado_nacimiento')}
                                >
                                  <CIcon icon={cilXCircle} />
                                </CButton>
                              </>
                            )}
                          </div>
                        </div>

                        {/* CURP */}
                        <div className="mb-3">
                          <CFormLabel>CURP:</CFormLabel>
                          <div className="d-flex align-items-center gap-2">
                            <input
                              type="file"
                              accept=".pdf"
                              id="curp_doc"
                              style={{ display: 'none' }}
                              onChange={(e) => handleDocumentUpload('curp', e)}
                            />
                            <CButton
                              color={documentos.curp ? 'success' : undefined}
                              style={!documentos.curp ? { borderColor: '#0071b8', color: '#0071b8' } : {}}
                              variant="outline"
                              onClick={() => document.getElementById('curp_doc').click()}
                              className={`d-flex align-items-center gap-2 ${!documentos.curp ? 'pdf-upload-btn' : ''}`}
                            >
                              {documentos.curp ? (
                                <>
                                  <CIcon icon={cilFile} />
                                  PDF
                                </>
                              ) : (
                                <>
                                  <CIcon icon={cilCloudUpload} />
                                  Subir PDF
                                </>
                              )}
                            </CButton>
                            {documentos.curp && (
                              <>
                                <span className="text-muted small text-truncate" style={{ maxWidth: '150px' }}>
                                  {documentos.curp.name}
                                </span>
                                <CButton
                                  color="danger"
                                  variant="ghost"
                                  size="sm"
                                  className="remove-file-btn"
                                  onClick={() => handleRemoveDocument('curp')}
                                >
                                  <CIcon icon={cilXCircle} />
                                </CButton>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Comprobante de domicilio */}
                        <div className="mb-3">
                          <CFormLabel>Comprobante de domicilio:</CFormLabel>
                          <div className="d-flex align-items-center gap-2">
                            <input
                              type="file"
                              accept=".pdf"
                              id="comprobante_domicilio"
                              style={{ display: 'none' }}
                              onChange={(e) => handleDocumentUpload('comprobante_domicilio', e)}
                            />
                            <CButton
                              color={documentos.comprobante_domicilio ? 'success' : undefined}
                              style={!documentos.comprobante_domicilio ? { borderColor: '#0071b8', color: '#0071b8' } : {}}
                              variant="outline"
                              onClick={() => document.getElementById('comprobante_domicilio').click()}
                              className={`d-flex align-items-center gap-2 ${!documentos.comprobante_domicilio ? 'pdf-upload-btn' : ''}`}
                            >
                              {documentos.comprobante_domicilio ? (
                                <>
                                  <CIcon icon={cilFile} />
                                  PDF
                                </>
                              ) : (
                                <>
                                  <CIcon icon={cilCloudUpload} />
                                  Subir PDF
                                </>
                              )}
                            </CButton>
                            {documentos.comprobante_domicilio && (
                              <>
                                <span className="text-muted small text-truncate" style={{ maxWidth: '150px' }}>
                                  {documentos.comprobante_domicilio.name}
                                </span>
                                <CButton
                                  color="danger"
                                  variant="ghost"
                                  size="sm"
                                  className="remove-file-btn"
                                  onClick={() => handleRemoveDocument('comprobante_domicilio')}
                                >
                                  <CIcon icon={cilXCircle} />
                                </CButton>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Poliza de seguro */}
                        <div className="mb-3">
                          <CFormLabel>Póliza de seguro:</CFormLabel>
                          <div className="d-flex align-items-center gap-2">
                            <input
                              type="file"
                              accept=".pdf"
                              id="poliza_seguro"
                              style={{ display: 'none' }}
                              onChange={(e) => handleDocumentUpload('poliza_seguro', e)}
                            />
                            <CButton
                              color={documentos.poliza_seguro ? 'success' : undefined}
                              style={!documentos.poliza_seguro ? { borderColor: '#0071b8', color: '#0071b8' } : {}}
                              variant="outline"
                              onClick={() => document.getElementById('poliza_seguro').click()}
                              className={`d-flex align-items-center gap-2 ${!documentos.poliza_seguro ? 'pdf-upload-btn' : ''}`}
                            >
                              {documentos.poliza_seguro ? (
                                <>
                                  <CIcon icon={cilFile} />
                                  PDF
                                </>
                              ) : (
                                <>
                                  <CIcon icon={cilCloudUpload} />
                                  Subir PDF
                                </>
                              )}
                            </CButton>
                            {documentos.poliza_seguro && (
                              <>
                                <span className="text-muted small text-truncate" style={{ maxWidth: '150px' }}>
                                  {documentos.poliza_seguro.name}
                                </span>
                                <CButton
                                  color="danger"
                                  variant="ghost"
                                  size="sm"
                                  className="remove-file-btn"
                                  onClick={() => handleRemoveDocument('poliza_seguro')}
                                >
                                  <CIcon icon={cilXCircle} />
                                </CButton>
                              </>
                            )}
                          </div>
                        </div>
                      </CCol>

                      {/* Second Column - Cita and Status */}
                      <CCol md={6}>
                        <div className="mb-3">
                          <CFormLabel>Programar cita para entrega:</CFormLabel>
                          <CInputGroup>
                            <CFormInput
                              type="date"
                              value={documentos.cita_entrega}
                              onChange={handleCitaEntregaChange}
                              disabled={getDocumentosStatus().label === 'Completado'}
                              style={getDocumentosStatus().label === 'Completado' ? { backgroundColor: '#e9ecef' } : {}}
                            />
                            <CInputGroupText>
                              <CBadge color={getCitaEntregaStatus().color}>
                                {getCitaEntregaStatus().label}
                              </CBadge>
                            </CInputGroupText>
                          </CInputGroup>
                        </div>

                        <div className="mb-3">
                          <CFormLabel>Estado de documentación:</CFormLabel>
                          <CInputGroup>
                            <CFormInput
                              value={getDocumentosStatus().label}
                              readOnly
                              disabled
                              style={{ backgroundColor: '#e9ecef' }}
                            />
                            <CInputGroupText>
                              <CBadge color={getDocumentosStatus().color}>
                                {getDocumentosStatus().label}
                              </CBadge>
                            </CInputGroupText>
                          </CInputGroup>
                        </div>
                      </CCol>
                    </CRow>
                  </CAccordionBody>
                </CAccordionItem>

                {/* Consentimientos firmados */}
                <CAccordionItem itemKey={2}>
                  <CAccordionHeader>
                    <strong>Consentimientos firmados</strong>
                  </CAccordionHeader>
                  <CAccordionBody>
                    <CRow className="mb-4">
                      {/* Cita para firma and status */}
                      <CCol md={6}>
                        <div className="mb-3">
                          <CFormLabel>Programar cita para firma:</CFormLabel>
                          <CInputGroup>
                            <CFormInput
                              type="date"
                              value={consentimientos.cita_firma}
                              onChange={handleCitaFirmaChange}
                              disabled={getConsentimientosStatus().label === 'Completado'}
                              style={getConsentimientosStatus().label === 'Completado' ? { backgroundColor: '#e9ecef' } : {}}
                            />
                            <CInputGroupText>
                              <CBadge color={getCitaFirmaStatus().color}>
                                {getCitaFirmaStatus().label}
                              </CBadge>
                            </CInputGroupText>
                          </CInputGroup>
                        </div>
                      </CCol>
                      <CCol md={6}>
                        <div className="mb-3">
                          <CFormLabel>Estado de consentimientos:</CFormLabel>
                          <CInputGroup>
                            <CFormInput
                              value={getConsentimientosStatus().label}
                              readOnly
                              disabled
                              style={{ backgroundColor: '#e9ecef' }}
                            />
                            <CInputGroupText>
                              <CBadge color={getConsentimientosStatus().color}>
                                {getConsentimientosStatus().label}
                              </CBadge>
                            </CInputGroupText>
                          </CInputGroup>
                        </div>
                      </CCol>
                    </CRow>

                    {/* Checkboxes for consentimientos */}
                    <CRow>
                      <CCol md={6}>
                        <div className="mb-3">
                          <CFormCheck
                            id="consentimiento_informado"
                            label="Consentimiento informado"
                            checked={consentimientos.consentimiento_informado}
                            onChange={() => handleConsentimientoChange('consentimiento_informado')}
                          />
                        </div>
                        <div className="mb-3">
                          <CFormCheck
                            id="consentimiento_transferencia"
                            label="Consentimiento de transferencia embrionaria"
                            checked={consentimientos.consentimiento_transferencia}
                            onChange={() => handleConsentimientoChange('consentimiento_transferencia')}
                          />
                        </div>
                        <div className="mb-3">
                          <CFormCheck
                            id="aviso_privacidad"
                            label="Aviso de privacidad"
                            checked={consentimientos.aviso_privacidad}
                            onChange={() => handleConsentimientoChange('aviso_privacidad')}
                          />
                        </div>
                        <div className="mb-3">
                          <CFormCheck
                            id="informacion_personal"
                            label="Información personal"
                            checked={consentimientos.informacion_personal}
                            onChange={() => handleConsentimientoChange('informacion_personal')}
                          />
                        </div>
                      </CCol>
                      <CCol md={6}>
                        <div className="mb-3">
                          <CFormCheck
                            id="regular"
                            label="Regular"
                            checked={consentimientos.regular}
                            onChange={() => handleConsentimientoChange('regular')}
                          />
                        </div>
                        <div className="mb-3">
                          <CFormCheck
                            id="hiv"
                            label="HIV"
                            checked={consentimientos.hiv}
                            onChange={() => handleConsentimientoChange('hiv')}
                          />
                        </div>
                        <div className="mb-3">
                          <CFormCheck
                            id="gemelar"
                            label="Gemelar"
                            checked={consentimientos.gemelar}
                            onChange={() => handleConsentimientoChange('gemelar')}
                          />
                        </div>
                        <div className="mb-3">
                          <CFormCheck
                            id="full"
                            label="Full"
                            checked={consentimientos.full}
                            onChange={() => handleConsentimientoChange('full')}
                          />
                        </div>
                      </CCol>
                    </CRow>
                  </CAccordionBody>
                </CAccordionItem>
              </CAccordion>
            </CTabPane>

            {/* SEGURO MED Tab */}
            <CTabPane visible={activeTab === 'seguro-med'}>
              <CAccordion alwaysOpen>
                <CAccordionItem itemKey={1}>
                  <CAccordionHeader>
                    <strong>Información del Seguro Médico</strong>
                  </CAccordionHeader>
                  <CAccordionBody>
                    <p className="text-muted">Contenido del seguro médico...</p>
                    {/* TODO: Add insurance content */}
                  </CAccordionBody>
                </CAccordionItem>
                <CAccordionItem itemKey={2}>
                  <CAccordionHeader>
                    <strong>Cobertura y Beneficios</strong>
                  </CAccordionHeader>
                  <CAccordionBody>
                    <p className="text-muted">Contenido de cobertura...</p>
                    {/* TODO: Add coverage content */}
                  </CAccordionBody>
                </CAccordionItem>
              </CAccordion>
            </CTabPane>

            {/* PSICO SOCIAL Tab */}
            <CTabPane visible={activeTab === 'psico-social'}>
              <CAccordion alwaysOpen>
                <CAccordionItem itemKey={1}>
                  <CAccordionHeader>
                    <strong>Perfil psicológico</strong>
                  </CAccordionHeader>
                  <CAccordionBody>
                    <CTable bordered hover responsive>
                      <CTableHead>
                        <CTableRow>
                          <CTableHeaderCell style={{ minWidth: '180px' }}>Descripción</CTableHeaderCell>
                          <CTableHeaderCell style={{ minWidth: '140px' }}>Fecha</CTableHeaderCell>
                          <CTableHeaderCell style={{ minWidth: '140px' }}>Estado</CTableHeaderCell>
                          <CTableHeaderCell colSpan={4} className="text-center" style={{ backgroundColor: '#f8f9fa' }}>Perfil</CTableHeaderCell>
                          <CTableHeaderCell style={{ minWidth: '150px' }}>Responsable</CTableHeaderCell>
                          <CTableHeaderCell style={{ width: '50px' }}></CTableHeaderCell>
                        </CTableRow>
                        <CTableRow>
                          <CTableHeaderCell></CTableHeaderCell>
                          <CTableHeaderCell></CTableHeaderCell>
                          <CTableHeaderCell></CTableHeaderCell>
                          <CTableHeaderCell className="text-center" style={{ fontSize: '0.85rem', minWidth: '70px' }}>Apta</CTableHeaderCell>
                          <CTableHeaderCell className="text-center" style={{ fontSize: '0.85rem', minWidth: '90px' }}>Recomendable</CTableHeaderCell>
                          <CTableHeaderCell className="text-center" style={{ fontSize: '0.85rem', minWidth: '90px' }}>Con reservas</CTableHeaderCell>
                          <CTableHeaderCell className="text-center" style={{ fontSize: '0.85rem', minWidth: '110px' }}>No recomendable</CTableHeaderCell>
                          <CTableHeaderCell></CTableHeaderCell>
                          <CTableHeaderCell></CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {perfilPsicologico.map((row) => (
                          <CTableRow key={row.id}>
                            <CTableDataCell>
                              <CFormInput
                                size="sm"
                                value={row.descripcion}
                                onChange={(e) => handlePerfilPsicoChange(row.id, 'descripcion', e.target.value)}
                                placeholder="Descripción..."
                              />
                            </CTableDataCell>
                            <CTableDataCell>
                              <CFormInput
                                type="date"
                                size="sm"
                                value={row.fecha}
                                onChange={(e) => handlePerfilPsicoChange(row.id, 'fecha', e.target.value)}
                              />
                            </CTableDataCell>
                            <CTableDataCell>
                              <CFormSelect
                                size="sm"
                                value={row.estado}
                                onChange={(e) => handlePerfilPsicoChange(row.id, 'estado', e.target.value)}
                              >
                                {estadoPsicoOptions.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </CFormSelect>
                            </CTableDataCell>
                            <CTableDataCell className="text-center">
                              <CFormCheck
                                type="radio"
                                name={`perfil-${row.id}`}
                                checked={row.perfil === 'apta'}
                                onChange={() => handlePerfilRadioChange(row.id, 'apta')}
                              />
                            </CTableDataCell>
                            <CTableDataCell className="text-center">
                              <CFormCheck
                                type="radio"
                                name={`perfil-${row.id}`}
                                checked={row.perfil === 'recomendable'}
                                onChange={() => handlePerfilRadioChange(row.id, 'recomendable')}
                              />
                            </CTableDataCell>
                            <CTableDataCell className="text-center">
                              <CFormCheck
                                type="radio"
                                name={`perfil-${row.id}`}
                                checked={row.perfil === 'con_reservas'}
                                onChange={() => handlePerfilRadioChange(row.id, 'con_reservas')}
                              />
                            </CTableDataCell>
                            <CTableDataCell className="text-center">
                              <CFormCheck
                                type="radio"
                                name={`perfil-${row.id}`}
                                checked={row.perfil === 'no_recomendable'}
                                onChange={() => handlePerfilRadioChange(row.id, 'no_recomendable')}
                              />
                            </CTableDataCell>
                            <CTableDataCell>
                              <CFormInput
                                size="sm"
                                value={row.responsable}
                                onChange={(e) => handlePerfilPsicoChange(row.id, 'responsable', e.target.value)}
                                placeholder="Responsable..."
                              />
                            </CTableDataCell>
                            <CTableDataCell className="text-center">
                              <CButton
                                color="danger"
                                variant="ghost"
                                size="sm"
                                onClick={() => removePerfilPsicoRow(row.id)}
                                disabled={perfilPsicologico.length === 1}
                                title="Eliminar fila"
                              >
                                <CIcon icon={cilTrash} />
                              </CButton>
                            </CTableDataCell>
                          </CTableRow>
                        ))}
                      </CTableBody>
                    </CTable>
                    <CButton
                      color="primary"
                      variant="outline"
                      size="sm"
                      onClick={addPerfilPsicoRow}
                      className="mt-2"
                    >
                      <CIcon icon={cilPlus} className="me-1" />
                      Agregar fila
                    </CButton>
                  </CAccordionBody>
                </CAccordionItem>
                <CAccordionItem itemKey={2}>
                  <CAccordionHeader>
                    <strong>Seguimiento psicológico</strong>
                  </CAccordionHeader>
                  <CAccordionBody>
                    <p className="text-muted">Contenido de seguimiento psicológico...</p>
                    {/* TODO: Add psychological follow-up content */}
                  </CAccordionBody>
                </CAccordionItem>
              </CAccordion>
            </CTabPane>

            {/* CITA PREVIA Tab */}
            <CTabPane visible={activeTab === 'cita-previa'}>
              <CAccordion alwaysOpen>
                <CAccordionItem itemKey={1}>
                  <CAccordionHeader>
                    <strong>Historial de Citas</strong>
                  </CAccordionHeader>
                  <CAccordionBody>
                    <p className="text-muted">Contenido del historial de citas...</p>
                    {/* TODO: Add appointment history content */}
                  </CAccordionBody>
                </CAccordionItem>
                <CAccordionItem itemKey={2}>
                  <CAccordionHeader>
                    <strong>Programar Nueva Cita</strong>
                  </CAccordionHeader>
                  <CAccordionBody>
                    <p className="text-muted">Contenido para programar citas...</p>
                    {/* TODO: Add appointment scheduling content */}
                  </CAccordionBody>
                </CAccordionItem>
              </CAccordion>
            </CTabPane>
          </CTabContent>

          {/* Action Buttons */}
          <CRow className="mt-4">
            <CCol className="d-flex justify-content-between">
              <CButton 
                color="secondary" 
                variant="outline"
                onClick={() => navigate('/babysite/sortGes')}
              >
                <CIcon icon={cilArrowLeft} className="me-2" />
                Volver a la lista
              </CButton>
              <CButton 
                color="primary" 
                className="app-button"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <CSpinner size="sm" className="me-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CIcon icon={cilSave} className="me-2" />
                    Guardar cambios
                  </>
                )}
              </CButton>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Confirmation Modal for Field Lock */}
      <CModal visible={showConfirmModal} onClose={cancelFieldLock}>
        <CModalHeader>
          <CModalTitle>Confirmar guardado</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>¿Desea guardar y bloquear este campo?</p>
          {pendingFieldLock.field && (
            <p><strong>Campo:</strong> {pendingFieldLock.field.replace(/_/g, ' ')}</p>
          )}
          {pendingFieldLock.value && (
            <p><strong>Valor:</strong> {pendingFieldLock.value}</p>
          )}
          <p className="text-muted small">
            Una vez bloqueado, necesitará una contraseña de administrador para poder editarlo.
          </p>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={cancelFieldLock}>
            Cancelar
          </CButton>
          <CButton color="primary" onClick={confirmFieldLock}>
            Guardar y bloquear
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Password Modal for Field Unlock */}
      <CModal visible={showPasswordModal} onClose={cancelUnlock}>
        <CModalHeader>
          <CModalTitle>Desbloquear campo</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>Ingrese la contraseña de administrador para desbloquear este campo:</p>
          <CFormInput
            type="password"
            value={unlockPassword}
            onChange={(e) => setUnlockPassword(e.target.value)}
            placeholder="Contraseña"
            onKeyDown={(e) => {
              if (e.key === 'Enter') verifyPasswordAndUnlock();
            }}
            invalid={!!passwordError}
          />
          {passwordError && (
            <div className="text-danger small mt-1">{passwordError}</div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={cancelUnlock}>
            Cancelar
          </CButton>
          <CButton color="primary" onClick={verifyPasswordAndUnlock}>
            Desbloquear
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Custom styles for tabs */}
      <style>{`
        .nav-link:hover {
          opacity: 0.85;
        }
        .accordion-button:not(.collapsed) {
          background-color: #f8f9fa;
          color: #333;
        }
        .accordion-button:focus {
          box-shadow: none;
          border-color: rgba(0,0,0,.125);
        }
        .remove-file-btn {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        .remove-file-btn:hover {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        .remove-file-btn:focus {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        .form-check-input:checked {
          background-color: #0071b8 !important;
          border-color: #0071b8 !important;
        }
        .form-check-input:focus {
          border-color: #0071b8 !important;
          box-shadow: 0 0 0 0.25rem rgba(0, 113, 184, 0.25) !important;
        }
        .pdf-upload-btn:hover {
          background-color: #0071b8 !important;
          border-color: #0071b8 !important;
          color: #fff !important;
        }
      `}</style>
    </CContainer>
  );
};

export default SortGes;