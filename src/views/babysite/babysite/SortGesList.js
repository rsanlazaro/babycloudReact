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

const EMPTY_FORM = {
  nombre_completo:  '',
  fecha_nacimiento: '',
  tel_1:            '',
  email:            '',
  esquema_ofrecido: '$400,000.00',
  ip_responsable:   '',
  status:           'iniciales',
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

const formatPHCA = (c) =>
  `${c.partos||0}-${c.hijos||0}-${c.cesareas||0}-${c.abortos||0}`;

// Normalize a phone number for comparison (digits only)
const normalizePhone = (phone) => (phone || '').replace(/\D/g, '');

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');

// A valid phone: only digits/spaces/+/-/parentheses as typed, and at least
// 10 actual digits once separators are stripped
const isValidPhone = (phone) => {
  if (!/^[0-9+\-\s()]+$/.test(phone || '')) return false;
  return normalizePhone(phone).length >= 10;
};

// ─────────────────────────────────────────────────────────────
// Reusable sub-components
// ─────────────────────────────────────────────────────────────

// Sortable column header
const SortHeader = ({ label, sortKey, sortConfig, onSort, style = {} }) => (
  <CTableHeaderCell
    style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', ...style }}
    onClick={() => onSort(sortKey)}
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
        <SortHeader label="P-H-C-A"      sortKey="partos"           sortConfig={sortConfig} onSort={onSort} style={{ width: 110 }} />
        <SortHeader label="(RH)"         sortKey="tipo_sangre"      sortConfig={sortConfig} onSort={onSort} style={{ width: 60 }} />
        <SortHeader label=">ACO"         sortKey="metodo_aco"       sortConfig={sortConfig} onSort={onSort} />
        <CTableHeaderCell>ADM</CTableHeaderCell>
        <CTableHeaderCell>Select Progr</CTableHeaderCell>
        <CTableHeaderCell>Esquema</CTableHeaderCell>
        <CTableHeaderCell>Programa</CTableHeaderCell>
        <SortHeader label="Status"       sortKey="status"           sortConfig={sortConfig} onSort={onSort} style={{ width: 110 }} />
        <CTableHeaderCell style={{ width: 80 }}>Acciones</CTableHeaderCell>
      </CTableRow>
    </CTableHead>
    <CTableBody>
      {rows.length === 0 ? <EmptyRow colSpan={13} searchTerm={searchTerm} /> : rows.map(c => {
        const imc     = calculateIMC(c.peso, c.altura);
        const imcInfo = getIMCInfo(imc);
        const stInfo  = STATUS_OPTIONS[c.status] || { label: c.status, color: 'secondary' };
        // Split nombre_completo into nombre + apellido heuristically (last word = apellido)
        const parts   = (c.nombre_completo || '').trim().split(' ');
        const apellido = parts.length > 1 ? parts.slice(-1)[0] : '-';
        const nombre   = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0] || '-';
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
              <span style={{ color: '#d97ea1', fontWeight: 600 }}>{formatPHCA(c)}</span>
            </CTableDataCell>
            <CTableDataCell>{c.tipo_sangre || '-'}</CTableDataCell>
            <CTableDataCell>{c.metodo_aco  || '-'}</CTableDataCell>
            <CTableDataCell>—</CTableDataCell>
            <CTableDataCell>—</CTableDataCell>
            <CTableDataCell>{c.esquema_ofrecido || '-'}</CTableDataCell>
            <CTableDataCell>—</CTableDataCell>
            <CTableDataCell>
              <CBadge color={stInfo.color} style={{ fontSize: '0.75rem' }}>{stInfo.label}</CBadge>
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

const AdmisionesTable = ({ rows, sortConfig, onSort, onEdit, onDelete, searchTerm }) => (
  <CTable hover striped align="middle" responsive className="nowrap-table">
    <CTableHead color="light">
      <CTableRow>
        <CTableHeaderCell style={{ width: 80 }}>RESP</CTableHeaderCell>
        <CTableHeaderCell style={{ width: 60 }}>Qt (i)</CTableHeaderCell>
        <SortHeader label="Nombre"       sortKey="nombre_completo"  sortConfig={sortConfig} onSort={onSort} />
        <SortHeader label="Apellido"     sortKey="apellido"         sortConfig={sortConfig} onSort={onSort} />
        <CTableHeaderCell>Att. Agencia</CTableHeaderCell>
        <CTableHeaderCell>Prox. Act</CTableHeaderCell>
        <CTableHeaderCell>Seguro</CTableHeaderCell>
        <CTableHeaderCell>Psicol</CTableHeaderCell>
        <CTableHeaderCell>Metria</CTableHeaderCell>
        <CTableHeaderCell>Cita 1</CTableHeaderCell>
        <CTableHeaderCell>Labs</CTableHeaderCell>
        <CTableHeaderCell>HIM</CTableHeaderCell>
        <CTableHeaderCell>Att. Previa</CTableHeaderCell>
        <CTableHeaderCell>ACO</CTableHeaderCell>
        <CTableHeaderCell>Asignar</CTableHeaderCell>
        <CTableHeaderCell style={{ width: 80 }}>Acciones</CTableHeaderCell>
      </CTableRow>
    </CTableHead>
    <CTableBody>
      {rows.length === 0 ? <EmptyRow colSpan={16} searchTerm={searchTerm} /> : rows.map(c => {
        const parts   = (c.nombre_completo || '').trim().split(' ');
        const apellido = parts.length > 1 ? parts.slice(-1)[0] : '-';
        const nombre   = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0] || '-';
        return (
          <CTableRow key={c.id}>
            <CTableDataCell>
              <span className="text-muted small">{c.ip_responsable || '—'}</span>
            </CTableDataCell>
            <CTableDataCell className="text-center">—</CTableDataCell>
            <CTableDataCell>
              <Link to={`/babysite/sortGes/${c.id}`} className="text-decoration-none"
                style={{ color: '#5856d6', fontWeight: 500 }}>{nombre}</Link>
            </CTableDataCell>
            <CTableDataCell>{apellido}</CTableDataCell>
            {/* Operational columns — populated from sortGes detail once available */}
            {Array(11).fill(null).map((_, i) => <CTableDataCell key={i}>—</CTableDataCell>)}
            <CTableDataCell>
              <ActionButtons candidate={c} onEdit={onEdit} onDelete={onDelete} />
            </CTableDataCell>
          </CTableRow>
        );
      })}
    </CTableBody>
  </CTable>
);

const AttPreviaTable = ({ rows, sortConfig, onSort, onEdit, onDelete, searchTerm }) => (
  <CTable hover striped align="middle" responsive className="nowrap-table">
    <CTableHead color="light">
      <CTableRow>
        <CTableHeaderCell style={{ width: 80 }}>RESP</CTableHeaderCell>
        <CTableHeaderCell style={{ width: 60 }}>Qt (i)</CTableHeaderCell>
        <SortHeader label="Nombre"       sortKey="nombre_completo"  sortConfig={sortConfig} onSort={onSort} />
        <SortHeader label="Apellido"     sortKey="apellido"         sortConfig={sortConfig} onSort={onSort} />
        <CTableHeaderCell>Att. Agencia</CTableHeaderCell>
        <CTableHeaderCell>Prox. Act</CTableHeaderCell>
        <CTableHeaderCell>Seguro</CTableHeaderCell>
        <CTableHeaderCell>Psicol</CTableHeaderCell>
        <CTableHeaderCell>Metria</CTableHeaderCell>
        <CTableHeaderCell>Cita 1</CTableHeaderCell>
        <CTableHeaderCell>Labs</CTableHeaderCell>
        <CTableHeaderCell>HIM</CTableHeaderCell>
        <CTableHeaderCell>Att. Previa</CTableHeaderCell>
        <CTableHeaderCell>ACO</CTableHeaderCell>
        <CTableHeaderCell>Asignar</CTableHeaderCell>
        <CTableHeaderCell style={{ width: 80 }}>Acciones</CTableHeaderCell>
      </CTableRow>
    </CTableHead>
    <CTableBody>
      {rows.length === 0 ? <EmptyRow colSpan={16} searchTerm={searchTerm} /> : rows.map(c => {
        const parts   = (c.nombre_completo || '').trim().split(' ');
        const apellido = parts.length > 1 ? parts.slice(-1)[0] : '-';
        const nombre   = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0] || '-';
        return (
          <CTableRow key={c.id}>
            <CTableDataCell>
              <span className="text-muted small">{c.ip_responsable || '—'}</span>
            </CTableDataCell>
            <CTableDataCell className="text-center">—</CTableDataCell>
            <CTableDataCell>
              <Link to={`/babysite/sortGes/${c.id}`} className="text-decoration-none"
                style={{ color: '#5856d6', fontWeight: 500 }}>{nombre}</Link>
            </CTableDataCell>
            <CTableDataCell>{apellido}</CTableDataCell>
            {Array(11).fill(null).map((_, i) => <CTableDataCell key={i}>—</CTableDataCell>)}
            <CTableDataCell>
              <ActionButtons candidate={c} onEdit={onEdit} onDelete={onDelete} />
            </CTableDataCell>
          </CTableRow>
        );
      })}
    </CTableBody>
  </CTable>
);

const PsicologiaTable = ({ rows, sortConfig, onSort, onEdit, onDelete, searchTerm }) => (
  <CTable hover striped align="middle" responsive className="nowrap-table">
    <CTableHead color="light">
      <CTableRow>
        <CTableHeaderCell style={{ width: 80 }}>RESP</CTableHeaderCell>
        <CTableHeaderCell style={{ width: 60 }}>Qt (i)</CTableHeaderCell>
        <SortHeader label="Nombre"       sortKey="nombre_completo"  sortConfig={sortConfig} onSort={onSort} />
        <SortHeader label="Apellido"     sortKey="apellido"         sortConfig={sortConfig} onSort={onSort} />
        <SortHeader label="Status"       sortKey="status"           sortConfig={sortConfig} onSort={onSort} style={{ width: 110 }} />
        <CTableHeaderCell>Psicométrico</CTableHeaderCell>
        <CTableHeaderCell>Entrevista</CTableHeaderCell>
        <CTableHeaderCell>SDG 12</CTableHeaderCell>
        <CTableHeaderCell>SDG 16</CTableHeaderCell>
        <CTableHeaderCell>SDG 20</CTableHeaderCell>
        <CTableHeaderCell>SDG 22</CTableHeaderCell>
        <CTableHeaderCell>SDG 26</CTableHeaderCell>
        <CTableHeaderCell>SDG 32</CTableHeaderCell>
        <CTableHeaderCell>SDG 34</CTableHeaderCell>
        <CTableHeaderCell>SDG 35</CTableHeaderCell>
        <CTableHeaderCell>SDG 36</CTableHeaderCell>
        <CTableHeaderCell style={{ width: 80 }}>Acciones</CTableHeaderCell>
      </CTableRow>
    </CTableHead>
    <CTableBody>
      {rows.length === 0 ? <EmptyRow colSpan={17} searchTerm={searchTerm} /> : rows.map(c => {
        const stInfo  = STATUS_OPTIONS[c.status] || { label: c.status, color: 'secondary' };
        const parts   = (c.nombre_completo || '').trim().split(' ');
        const apellido = parts.length > 1 ? parts.slice(-1)[0] : '-';
        const nombre   = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0] || '-';
        return (
          <CTableRow key={c.id}>
            <CTableDataCell>
              <span className="text-muted small">{c.ip_responsable || '—'}</span>
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
            {/* SDG columns — populated from psico_inicial data once wired */}
            {Array(11).fill(null).map((_, i) => <CTableDataCell key={i}>—</CTableDataCell>)}
            <CTableDataCell>
              <ActionButtons candidate={c} onEdit={onEdit} onDelete={onDelete} />
            </CTableDataCell>
          </CTableRow>
        );
      })}
    </CTableBody>
  </CTable>
);

// Allow only digits, spaces, +, -, ( and ) while typing a phone number
const sanitizePhoneInput = (value) => value.replace(/[^0-9+\-\s()]/g, '');

// Shared form fields — defined at module scope (NOT inside SortGesList) so it
// keeps a stable identity across renders. Defining it inside the component
// body would recreate the component (and its inputs) on every keystroke,
// which is what caused focus to jump back to "Nombre completo" (its autoFocus
// input) whenever another field was clicked/typed into.
const CandidateFormFields = ({ form, setForm }) => (
  <>
    <div className="mb-3">
      <CFormLabel>Nombre completo: <span className="text-danger">*</span></CFormLabel>
      <CFormInput placeholder="Nombre y apellidos" value={form.nombre_completo}
        onChange={e => setForm(p => ({ ...p, nombre_completo: e.target.value }))} autoFocus />
    </div>
    <div className="mb-3">
      <CFormLabel>Fecha de nacimiento: <span className="text-danger">*</span></CFormLabel>
      <CFormInput type="date" value={form.fecha_nacimiento}
        onChange={e => setForm(p => ({ ...p, fecha_nacimiento: e.target.value }))} />
    </div>
    <CRow>
      <CCol md={6} className="mb-3">
        <CFormLabel>Teléfono: <span className="text-danger">*</span></CFormLabel>
        <CFormInput placeholder="+52 55 0000 0000" value={form.tel_1}
          inputMode="tel"
          onChange={e => setForm(p => ({ ...p, tel_1: sanitizePhoneInput(e.target.value) }))} />
        <small className="text-muted">Solo números, espacios, +, - y paréntesis</small>
      </CCol>
      <CCol md={6} className="mb-3">
        <CFormLabel>Email: <span className="text-danger">*</span></CFormLabel>
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
    <div className="mb-3">
      <CFormLabel>IP Responsable:</CFormLabel>
      <CFormInput placeholder="Nombre del responsable" value={form.ip_responsable}
        onChange={e => setForm(p => ({ ...p, ip_responsable: e.target.value }))} />
    </div>
  </>
);

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────
const SortGesList = () => {
  const navigate = useNavigate();

  // ── Data ─────────────────────────────────────────────────────
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [activeTab, setActiveTab]   = useState('data-gesca');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'nombre_completo', direction: 'asc' });
  const [alert, setAlert]           = useState({ show: false, type: '', message: '' });
  const [formError, setFormError]   = useState('');

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
  useEffect(() => { fetchCandidates(); }, []);

  // ═══════════════════════════════════════════════════════════
  // API
  // ═══════════════════════════════════════════════════════════

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/sort-ges', { withCredentials: true });
      setCandidates(res.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Error al cargar los candidatos');
    } finally {
      setLoading(false);
    }
  };

  // Validate required fields + duplicate phone number across candidates
  const validateCandidateForm = (form, { excludeId = null } = {}) => {
    if (!form.nombre_completo.trim()) return 'El nombre completo es obligatorio';
    if (!form.fecha_nacimiento) return 'La fecha de nacimiento es obligatoria';
    if (!form.tel_1.trim()) return 'El teléfono es obligatorio';
    if (!isValidPhone(form.tel_1)) return 'El teléfono solo debe contener números (10 dígitos mínimo)';
    if (!form.email.trim()) return 'El email es obligatorio';
    if (!isValidEmail(form.email)) return 'Ingresa un email válido';

    const normalizedPhone = normalizePhone(form.tel_1);
    const duplicate = candidates.some(c =>
      c.id !== excludeId &&
      normalizedPhone &&
      normalizePhone(c.telefono) === normalizedPhone
    );
    if (duplicate) return 'Ya existe un candidato registrado con este número de teléfono';

    return null;
  };

  const handleCreate = async () => {
    const validationError = validateCandidateForm(createForm);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError('');
    try {
      setCreating(true);
      const res = await api.post('/api/sort-ges', {
        status: createForm.status, ip_responsable: createForm.ip_responsable || null,
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
      const message = err.response?.data?.message || 'Error al crear el candidato';
      setFormError(message);
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async () => {
    const validationError = validateCandidateForm(editForm, { excludeId: editingId });
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError('');
    try {
      setSaving(true);
      await api.put(`/api/sort-ges/${editingId}`, {
        status: editForm.status, ip_responsable: editForm.ip_responsable || null,
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
          ip_responsable:   editForm.ip_responsable,
          status:           editForm.status,
        } : c
      ));
      setShowEditModal(false);
      setEditingId(null);
      showNotification('success', 'Candidato actualizado');
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.message || 'Error al actualizar el candidato';
      setFormError(message);
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
      });
      setFormError('');
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

  // Shared table props
  const tableProps = {
    rows: filtered, sortConfig, onSort: handleSort,
        onEdit: openEdit, onDelete: openDelete, searchTerm,
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
              onClick={() => { setCreateForm(EMPTY_FORM); setFormError(''); setShowCreateModal(true); }}
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
              <AdmisionesTable  {...tableProps} />
            </CTabPane>
            <CTabPane visible={activeTab === 'att-previa'}>
              <AttPreviaTable   {...tableProps} />
            </CTabPane>
            <CTabPane visible={activeTab === 'psicologia'}>
              <PsicologiaTable  {...tableProps} />
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
      <CModal visible={showCreateModal} onClose={() => { setShowCreateModal(false); setFormError(''); }} size="lg">
        <CModalHeader><CModalTitle>Nuevo candidato</CModalTitle></CModalHeader>
        <CModalBody>
          <p className="text-muted small mb-3">
            Ingrese los datos básicos. Podrá completar el resto desde el expediente.
          </p>
          {formError && (
            <CAlert color="danger" dismissible onClose={() => setFormError('')}>
              {formError}
            </CAlert>
          )}
          <CandidateFormFields form={createForm} setForm={setCreateForm} />
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => { setShowCreateModal(false); setFormError(''); }}>Cancelar</CButton>
          <CButton color="primary" onClick={handleCreate}
            disabled={creating || !createForm.nombre_completo.trim() || !createForm.fecha_nacimiento || !createForm.tel_1.trim() || !createForm.email.trim()}
            style={{ backgroundColor: '#d97ea1', borderColor: '#d97ea1' }}>
            {creating ? <><CSpinner size="sm" className="me-1" />Creando...</> : 'Crear y abrir expediente'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* ── Edit modal ── */}
      <CModal visible={showEditModal} onClose={() => { setShowEditModal(false); setFormError(''); }} size="lg">
        <CModalHeader><CModalTitle>Editar candidato</CModalTitle></CModalHeader>
        <CModalBody>
          {formError && (
            <CAlert color="danger" dismissible onClose={() => setFormError('')}>
              {formError}
            </CAlert>
          )}
          <CandidateFormFields form={editForm} setForm={setEditForm} />
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => { setShowEditModal(false); setFormError(''); }}>Cancelar</CButton>
          <CButton color="primary" onClick={handleEdit}
            disabled={saving || !editForm.nombre_completo.trim() || !editForm.fecha_nacimiento || !editForm.tel_1.trim() || !editForm.email.trim()}
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