// src/views/pages/sortGes/sortGesList.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  CCard, CCardBody, CCardHeader, CCol, CContainer, CRow,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CButton, CFormInput, CFormSelect, CFormLabel, CSpinner, CAlert,
  CInputGroup, CInputGroupText, CBadge,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilSearch, cilPlus, cilArrowTop, cilArrowBottom, cilFolder, cilFile } from '@coreui/icons';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const SortGesList = () => {
  const navigate = useNavigate();

  const [candidates, setCandidates]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [searchTerm, setSearchTerm]   = useState('');
  const [sortConfig, setSortConfig]   = useState({ key: 'nombre_completo', direction: 'asc' });
  const [alert, setAlert]             = useState({ show: false, type: '', message: '' });

  // ── New candidate modal ──────────────────────────────────────
  const [showModal, setShowModal]   = useState(false);
  const [creating, setCreating]     = useState(false);
  const [newForm, setNewForm]       = useState({
    nombre_completo: '',
    fecha_nacimiento: '',
    tel_1: '',
    email: '',
    esquema_ofrecido: '$400,000.00',
    ip_responsable: '',
    status: 'iniciales',
  });

  const statusOptions = {
    iniciales:  { label: 'Iniciales',  color: 'info'      },
    en_proceso: { label: 'En Proceso', color: 'warning'   },
    aprobado:   { label: 'Aprobado',   color: 'success'   },
    rechazado:  { label: 'Rechazado',  color: 'danger'    },
    pendiente:  { label: 'Pendiente',  color: 'secondary' },
  };

  useEffect(() => { fetchCandidates(); }, []);

  // ── API calls ────────────────────────────────────────────────
  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/sort-ges', { withCredentials: true });
      setCandidates(res.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching candidates:', err);
      setError('Error al cargar los candidatos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newForm.nombre_completo.trim()) {
      showNotification('warning', 'El nombre completo es obligatorio');
      return;
    }
    try {
      setCreating(true);
      // 1. Create master candidate record
      const res = await api.post('/api/sort-ges', {
        status: newForm.status,
        ip_responsable: newForm.ip_responsable || null,
      }, { withCredentials: true });

      const newId = res.data.id;

      // 2. Save initial alta-gesca fields immediately
      await api.put(`/api/sort-ges/${newId}/alta-gesca`, {
        nombre_completo:  newForm.nombre_completo,
        fecha_nacimiento: newForm.fecha_nacimiento || null,
        tel_1:            newForm.tel_1 || null,
        email:            newForm.email || null,
        esquema_ofrecido: newForm.esquema_ofrecido || null,
      }, { withCredentials: true });

      setShowModal(false);
      setNewForm({
        nombre_completo: '', fecha_nacimiento: '', tel_1: '',
        email: '', esquema_ofrecido: '$400,000.00',
        ip_responsable: '', status: 'iniciales',
      });
      // Navigate straight to the new candidate's detail view
      navigate(`/babysite/sortGes/${newId}`);
    } catch (err) {
      console.error('Error creating candidate:', err);
      showNotification('danger', 'Error al crear el candidato');
    } finally {
      setCreating(false);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────
  const showNotification = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

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
    if (!peso || !altura) return '-';
    return (peso / (altura * altura)).toFixed(1);
  };

  const getIMCClassification = (imc) => {
    if (imc === '-') return { label: '-', color: 'secondary' };
    const v = parseFloat(imc);
    if (v < 18.5) return { label: 'Bajo peso', color: 'warning' };
    if (v < 23)   return { label: 'Normal',    color: 'success' };
    if (v < 25)   return { label: 'Riesgo',    color: 'info'    };
    if (v < 30)   return { label: 'Sobrepeso', color: 'warning' };
    return { label: 'Obesidad', color: 'danger' };
  };

  const formatPHCA = (c) =>
    `${c.partos||0}-${c.hijos||0}-${c.cesareas||0}-${c.abortos||0}`;

  // ── Sort / filter ────────────────────────────────────────────
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? cilArrowTop : cilArrowBottom;
  };

  const filtered = useMemo(() => {
    let r = [...candidates];
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      r = r.filter(c =>
        c.nombre_completo?.toLowerCase().includes(t) ||
        c.status?.toLowerCase().includes(t) ||
        c.tipo_sangre?.toLowerCase().includes(t)
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

  const SortableHeader = ({ label, sortKey, style = {} }) => (
    <CTableHeaderCell style={{ cursor: 'pointer', userSelect: 'none', ...style }}
      onClick={() => handleSort(sortKey)}>
      <div className="d-flex align-items-center">
        {label}
        <CIcon icon={getSortIcon(sortKey) || cilArrowTop} size="sm"
          className={`ms-1 ${sortConfig.key !== sortKey ? 'text-muted opacity-25' : ''}`} />
      </div>
    </CTableHeaderCell>
  );

  // ── Render ───────────────────────────────────────────────────
  if (loading) {
    return (
      <CContainer className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <CSpinner color="primary" />
      </CContainer>
    );
  }

  return (
    <CContainer fluid>
      {alert.show && (
        <CAlert className="mx-5" color={alert.type} dismissible onClose={() => setAlert({ show: false })}>
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
              onClick={() => setShowModal(true)}
              style={{
                backgroundColor: '#d97ea1', borderColor: '#d97ea1',
                borderRadius: '50%', width: '40px', height: '40px', padding: 0,
              }}
              title="Nuevo candidato"
            >
              <CIcon icon={cilPlus} />
            </CButton>
          </div>
        </CCardHeader>

        <CCardBody>
          {error && <CAlert color="danger">{error}</CAlert>}

          {/* Search */}
          <CRow className="mb-3">
            <CCol md={6}>
              <CInputGroup>
                <CInputGroupText><CIcon icon={cilSearch} /></CInputGroupText>
                <CFormInput
                  placeholder="Buscar por nombre, status, tipo de sangre..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </CInputGroup>
            </CCol>
          </CRow>

          {/* Table */}
          <div className="table-responsive">
            <CTable hover striped align="middle">
              <CTableHead>
                <CTableRow>
                  <SortableHeader label="Nombre" sortKey="nombre_completo" />
                  <SortableHeader label="Edad" sortKey="fecha_nacimiento" style={{ width: '70px' }} />
                  <CTableHeaderCell style={{ width: '110px' }}>IMC</CTableHeaderCell>
                  <CTableHeaderCell style={{ width: '100px' }}>P-H-C-A</CTableHeaderCell>
                  <SortableHeader label="RH" sortKey="tipo_sangre" style={{ width: '70px' }} />
                  <SortableHeader label="ACO" sortKey="metodo_aco" />
                  <SortableHeader label="Esquema" sortKey="esquema_ofrecido" />
                  <SortableHeader label="Status" sortKey="status" />
                  <CTableHeaderCell style={{ width: '70px' }}>Folder</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {filtered.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={9} className="text-center py-4">
                      {searchTerm ? 'No se encontraron candidatos' : 'No hay candidatos registrados. Haga clic en + para agregar uno.'}
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  filtered.map(candidate => {
                    const imc = calculateIMC(candidate.peso, candidate.altura);
                    const imcClass = getIMCClassification(imc);
                    const statusInfo = statusOptions[candidate.status] || { label: candidate.status, color: 'secondary' };

                    return (
                      <CTableRow key={candidate.id}>
                        {/* Nombre */}
                        <CTableDataCell>
                          <Link to={`/babysite/sortGes/${candidate.id}`}
                            className="text-decoration-none"
                            style={{ color: '#5856d6', fontWeight: 500 }}>
                            {candidate.nombre_completo || `Candidato #${candidate.id}`}
                          </Link>
                        </CTableDataCell>

                        {/* Edad */}
                        <CTableDataCell>{calculateAge(candidate.fecha_nacimiento)}</CTableDataCell>

                        {/* IMC */}
                        <CTableDataCell>
                          <div className="d-flex align-items-center gap-1">
                            <span>{imc}</span>
                            <CBadge color={imcClass.color} size="sm">{imcClass.label}</CBadge>
                          </div>
                        </CTableDataCell>

                        {/* P-H-C-A */}
                        <CTableDataCell><code>{formatPHCA(candidate)}</code></CTableDataCell>

                        {/* RH */}
                        <CTableDataCell>
                          <CBadge color="danger">{candidate.tipo_sangre || '-'}</CBadge>
                        </CTableDataCell>

                        {/* ACO */}
                        <CTableDataCell>{candidate.metodo_aco || '-'}</CTableDataCell>

                        {/* Esquema */}
                        <CTableDataCell>{candidate.esquema_ofrecido || '-'}</CTableDataCell>

                        {/* Status */}
                        <CTableDataCell>
                          <Link to={`/babysite/sortGes/${candidate.id}`} className="text-decoration-none">
                            <CBadge color={statusInfo.color} style={{ cursor: 'pointer' }}>
                              {statusInfo.label}
                            </CBadge>
                          </Link>
                        </CTableDataCell>

                        {/* Folder */}
                        <CTableDataCell>
                          <CButton color="info" variant="ghost" size="sm"
                            onClick={() => navigate(`/babysite/sortGes/${candidate.id}`)}>
                            <CIcon icon={cilFolder} />
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    );
                  })
                )}
              </CTableBody>
            </CTable>
          </div>

          <div className="text-muted small mt-2">
            Mostrando {filtered.length} de {candidates.length} candidatos
          </div>
        </CCardBody>
      </CCard>

      {/* ── Nuevo candidato modal ────────────────────────────── */}
      <CModal visible={showModal} onClose={() => setShowModal(false)}>
        <CModalHeader>
          <CModalTitle>Nuevo candidato</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p className="text-muted small mb-3">
            Ingrese los datos básicos para crear el registro. Podrá completar el resto desde el expediente.
          </p>

          {/* Nombre completo — required */}
          <div className="mb-3">
            <CFormLabel>
              Nombre completo: <span className="text-danger">*</span>
            </CFormLabel>
            <CFormInput
              placeholder="Nombre y apellidos"
              value={newForm.nombre_completo}
              onChange={e => setNewForm(p => ({ ...p, nombre_completo: e.target.value }))}
              autoFocus
            />
          </div>

          {/* Fecha de nacimiento */}
          <div className="mb-3">
            <CFormLabel>Fecha de nacimiento:</CFormLabel>
            <CFormInput
              type="date"
              value={newForm.fecha_nacimiento}
              onChange={e => setNewForm(p => ({ ...p, fecha_nacimiento: e.target.value }))}
            />
          </div>

          {/* Teléfono */}
          <div className="mb-3">
            <CFormLabel>Teléfono:</CFormLabel>
            <CFormInput
              placeholder="+52 55 0000 0000"
              value={newForm.tel_1}
              onChange={e => setNewForm(p => ({ ...p, tel_1: e.target.value }))}
            />
          </div>

          {/* Email */}
          <div className="mb-3">
            <CFormLabel>Email:</CFormLabel>
            <CFormInput
              type="email"
              placeholder="correo@ejemplo.com"
              value={newForm.email}
              onChange={e => setNewForm(p => ({ ...p, email: e.target.value }))}
            />
          </div>

          {/* Esquema ofrecido */}
          <div className="mb-3">
            <CFormLabel>Esquema ofrecido:</CFormLabel>
            <CFormSelect
              value={newForm.esquema_ofrecido}
              onChange={e => setNewForm(p => ({ ...p, esquema_ofrecido: e.target.value }))}
            >
              <option value="$400,000.00">$400,000.00</option>
              <option value="$375,000.00">$375,000.00</option>
            </CFormSelect>
          </div>

          {/* IP Responsable */}
          <div className="mb-3">
            <CFormLabel>IP Responsable:</CFormLabel>
            <CFormInput
              placeholder="Nombre del responsable"
              value={newForm.ip_responsable}
              onChange={e => setNewForm(p => ({ ...p, ip_responsable: e.target.value }))}
            />
          </div>

          {/* Status */}
          <div className="mb-3">
            <CFormLabel>Status inicial:</CFormLabel>
            <CFormSelect
              value={newForm.status}
              onChange={e => setNewForm(p => ({ ...p, status: e.target.value }))}
            >
              <option value="iniciales">Iniciales</option>
              <option value="en_proceso">En Proceso</option>
              <option value="pendiente">Pendiente</option>
            </CFormSelect>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowModal(false)}>Cancelar</CButton>
          <CButton
            color="primary"
            onClick={handleCreate}
            disabled={creating || !newForm.nombre_completo.trim()}
            style={{ backgroundColor: '#d97ea1', borderColor: '#d97ea1' }}
          >
            {creating ? <><CSpinner size="sm" className="me-1" />Creando...</> : 'Crear y abrir expediente'}
          </CButton>
        </CModalFooter>
      </CModal>
    </CContainer>
  );
};

export default SortGesList;