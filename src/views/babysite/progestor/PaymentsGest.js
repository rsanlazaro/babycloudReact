// src/views/pages/programs/PaymentsGest.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  CCard, CCardBody, CCardHeader, CCol, CContainer, CRow,
  CTable, CTableHead, CTableRow, CTableHeaderCell,
  CTableBody, CTableDataCell,
  CButton, CFormInput, CFormSelect, CSpinner, CAlert,
  CInputGroup, CInputGroupText,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CBadge,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilSearch, cilPlus, cilTrash, cilArrowTop, cilArrowBottom,
  cilPencil, cilWarning, cilLockLocked, cilCalendar,
} from '@coreui/icons';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../context/AuthContext';
import { useBillsAuth } from '../../../context/BillsAuthContext';
import api from '../../../services/api';

// ─── SDG order for "last paid SDG" calculation ───────────────────────────────
const FIXED_ROWS_ORDER = [
  'beta_positiva','sdg6','sdg8','sdg10','sdg12','sdg16',
  'sdg20','sdg22','sdg26','sdg32','sdg34','sdg35','sdg36','sdg37','sdg38',
];
const SDG_LABELS = {
  beta_positiva: 'Beta+', sdg6: 'SDG 6', sdg8: 'SDG 8', sdg10: 'SDG 10',
  sdg12: 'SDG 12', sdg16: 'SDG 16', sdg20: 'SDG 20', sdg22: 'SDG 22',
  sdg26: 'SDG 26', sdg32: 'SDG 32', sdg34: 'SDG 34', sdg35: 'SDG 35',
  sdg36: 'SDG 36', sdg37: 'SDG 37', sdg38: 'SDG 38',
};

const getLastSDG = (row_states) => {
  if (!row_states) return null;
  let last = null;
  FIXED_ROWS_ORDER.forEach(id => {
    if (row_states[id]?.completed) last = id;
  });
  return last;
};

const PaymentsGest = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useUser();
  const { authenticateBills } = useBillsAuth();

  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const [searchTerm,   setSearchTerm]   = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig,   setSortConfig]   = useState({ key: 'created_at', direction: 'desc' });

  const [showDeleteModal,         setShowDeleteModal]         = useState(false);
  const [paymentToDelete,         setPaymentToDelete]         = useState(null);
  const [showDeletePasswordModal, setShowDeletePasswordModal] = useState(false);
  const [deletePasswordInput,     setDeletePasswordInput]     = useState('');
  const [deletePasswordError,     setDeletePasswordError]     = useState('');

  const [showEditPasswordModal, setShowEditPasswordModal] = useState(false);
  const [editPasswordInput,     setEditPasswordInput]     = useState('');
  const [editPasswordError,     setEditPasswordError]     = useState('');
  const [paymentToEdit,         setPaymentToEdit]         = useState(null);

  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  const statusOptions = [
    { value: 'all',       label: 'Todos los estados' },
    { value: 'active',    label: 'Activo',      color: 'success'   },
    { value: 'completed', label: 'Completado',  color: 'primary'   },
    { value: 'cancelled', label: 'Cancelado',   color: 'danger'    },
    { value: 'pending',   label: 'Pendiente',   color: 'warning'   },
  ];

  useEffect(() => { fetchPayments(); }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/payments-gest', { withCredentials: true });
      setPayments(res.data.data || res.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching payment schemes:', err);
      setError('Error al cargar los esquemas de pago');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

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

  const filteredAndSortedPayments = useMemo(() => {
    let result = [...payments];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        p => p.gesca?.toLowerCase().includes(term) || p.ip?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter);
    }

    result.sort((a, b) => {
      let aVal = a[sortConfig.key] || '';
      let bVal = b[sortConfig.key] || '';
      if (sortConfig.key === 'created_at') {
        aVal = new Date(aVal); bVal = new Date(bVal);
      } else {
        aVal = aVal.toString().toLowerCase(); bVal = bVal.toString().toLowerCase();
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ?  1 : -1;
      return 0;
    });

    return result;
  }, [payments, searchTerm, statusFilter, sortConfig]);

  // ── Edit handlers ──────────────────────────────────────────────────────────
  const handleEditClick = (payment) => {
    setPaymentToEdit(payment);
    setEditPasswordInput('');
    setEditPasswordError('');
    setShowEditPasswordModal(true);
  };

  const handleEditPasswordSubmit = () => {
    if (editPasswordInput === 'adm@bbcloud1') {
      authenticateBills();
      setShowEditPasswordModal(false);
      setEditPasswordInput('');
      setEditPasswordError('');
      navigate(`/progestor/payments-gest/form/${paymentToEdit.id}`);
      setPaymentToEdit(null);
    } else {
      setEditPasswordError('Contraseña incorrecta');
    }
  };

  const handleEditPasswordModalClose = () => {
    setShowEditPasswordModal(false);
    setEditPasswordInput('');
    setEditPasswordError('');
    setPaymentToEdit(null);
  };

  // ── Delete handlers ────────────────────────────────────────────────────────
  const isTransitioningToConfirmation = React.useRef(false);

  const handleDeleteClick = (payment) => {
    setPaymentToDelete(payment);
    setDeletePasswordInput('');
    setDeletePasswordError('');
    setShowDeletePasswordModal(true);
  };

  const handleDeletePasswordSubmit = () => {
    if (deletePasswordInput === 'adm@bbcloud1') {
      authenticateBills();
      isTransitioningToConfirmation.current = true;
      setDeletePasswordInput('');
      setDeletePasswordError('');
      setShowDeletePasswordModal(false);
      setTimeout(() => {
        setShowDeleteModal(true);
        isTransitioningToConfirmation.current = false;
      }, 50);
    } else {
      setDeletePasswordError('Contraseña incorrecta');
    }
  };

  const handleDeletePasswordModalClose = () => {
    setShowDeletePasswordModal(false);
    setDeletePasswordInput('');
    setDeletePasswordError('');
    if (!isTransitioningToConfirmation.current) setPaymentToDelete(null);
  };

  const handleDeleteModalClose = () => {
    setShowDeleteModal(false);
    setPaymentToDelete(null);
  };

  const executeDelete = async () => {
    try {
      if (!paymentToDelete) return;
      await api.delete(`/api/payments-gest/${paymentToDelete.id}`, { withCredentials: true });
      setPayments(prev => prev.filter(p => p.id !== paymentToDelete.id));
      showNotification('success', 'Esquema de pago eliminado correctamente');
    } catch {
      showNotification('danger', 'Error al eliminar');
    }
    setShowDeleteModal(false);
    setPaymentToDelete(null);
  };

  // ── Formatting helpers ─────────────────────────────────────────────────────
  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatSchemeValue = (v) => {
    if (!v) return '-';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(v);
  };

  const getStatusBadge = (status) => {
    const opt = statusOptions.find(o => o.value === status);
    return opt
      ? <CBadge color={opt.color}>{opt.label}</CBadge>
      : <CBadge color="secondary">{status || '-'}</CBadge>;
  };

  const SortableHeader = ({ label, sortKey }) => (
    <CTableHeaderCell style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort(sortKey)}>
      <div className="d-flex align-items-center">
        {label}
        <CIcon icon={getSortIcon(sortKey) || cilArrowTop} size="sm"
          className={`ms-1 ${sortConfig.key !== sortKey ? 'text-muted opacity-25' : ''}`} />
      </div>
    </CTableHeaderCell>
  );

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
      {error && <CAlert className="mx-5" color="danger">{error}</CAlert>}

      <CCard className="mb-4 mx-5">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Esquemas de Pago (Gestantes)</strong>
          <CButton color="primary" className="app-button" onClick={() => navigate('/progestor/payments-gest/form')}>
            <CIcon icon={cilPlus} className="me-2" />Nuevo esquema
          </CButton>
        </CCardHeader>
        <CCardBody>
          {/* Search and filter */}
          <CRow className="mb-3 g-3">
            <CCol md={5}>
              <CInputGroup>
                <CInputGroupText><CIcon icon={cilSearch} /></CInputGroupText>
                <CFormInput
                  placeholder="Buscar por GESCA o IP..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  autoComplete="off"
                />
              </CInputGroup>
            </CCol>
            <CCol md={2}>
              <CFormSelect value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </CFormSelect>
            </CCol>
          </CRow>

          {/* Table */}
          <div className="table-responsive">
            <CTable hover striped>
              <CTableHead>
                <CTableRow>
                  <SortableHeader label="GESCA"   sortKey="gesca"      />
                  <SortableHeader label="IP"       sortKey="ip"         />
                  <SortableHeader label="Estado"   sortKey="status"     />
                  <CTableHeaderCell>Programa</CTableHeaderCell>
                  <SortableHeader label="Creado"   sortKey="created_at" />
                  <CTableHeaderCell>SDG</CTableHeaderCell>
                  <CTableHeaderCell style={{ width: '100px' }}>Acciones</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {filteredAndSortedPayments.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={7} className="text-center py-4">
                      {searchTerm || statusFilter !== 'all'
                        ? 'No se encontraron esquemas con los filtros aplicados'
                        : 'No hay esquemas de pago. Crea uno nuevo para comenzar.'}
                    </CTableDataCell>
                  </CTableRow>
                ) : filteredAndSortedPayments.map(payment => {
                  const lastSDGId    = getLastSDG(payment.row_states);
                  const lastSDGLabel = lastSDGId ? SDG_LABELS[lastSDGId] : null;
                  return (
                    <CTableRow key={payment.id}>
                      <CTableDataCell><strong>{payment.gesca || '-'}</strong></CTableDataCell>
                      <CTableDataCell>{payment.ip || '-'}</CTableDataCell>
                      <CTableDataCell>{getStatusBadge(payment.status)}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color="secondary">
                          {payment.scheme_value ? formatSchemeValue(payment.scheme_value) : '-'}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CIcon icon={cilCalendar} size="sm" className="me-1 text-muted" />
                        {formatDate(payment.created_at)}
                      </CTableDataCell>
                      <CTableDataCell>
                        {lastSDGLabel
                          ? <CBadge color="primary">{lastSDGLabel}</CBadge>
                          : <span className="text-muted small">Ninguno</span>}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CButton color="primary" variant="ghost" size="sm" className="me-1"
                          onClick={() => handleEditClick(payment)} title="Editar esquema">
                          <CIcon icon={cilPencil} />
                        </CButton>
                        <CButton color="danger" variant="ghost" size="sm"
                          onClick={() => handleDeleteClick(payment)} title="Eliminar esquema">
                          <CIcon icon={cilTrash} />
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  );
                })}
              </CTableBody>
            </CTable>
          </div>

          <div className="text-muted small mt-2">
            Mostrando {filteredAndSortedPayments.length} de {payments.length} esquemas
          </div>
        </CCardBody>
      </CCard>

      {/* ── Delete confirmation modal ── */}
      <CModal visible={showDeleteModal} onClose={handleDeleteModalClose} alignment="center" backdrop="static" keyboard={false}>
        <CModalHeader closeButton={false}>
          <CModalTitle className="d-flex align-items-center">
            <CIcon icon={cilWarning} className="text-danger me-2" size="lg" />Confirmar eliminación
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p className="mb-0">
            ¿Estás seguro de que deseas eliminar el esquema de{' '}
            <strong>"{paymentToDelete?.gesca || paymentToDelete?.ip}"</strong>? Esta acción no se puede deshacer.
          </p>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={handleDeleteModalClose}>Cancelar</CButton>
          <CButton color="danger" onClick={executeDelete} style={{ color: 'white' }}>
            <CIcon icon={cilTrash} className="me-2" />Eliminar
          </CButton>
        </CModalFooter>
      </CModal>

      {/* ── Password modal for delete ── */}
      <CModal visible={showDeletePasswordModal} onClose={handleDeletePasswordModalClose} alignment="center" backdrop="static" keyboard={false}>
        <CModalHeader closeButton={false}>
          <CModalTitle className="d-flex align-items-center">
            <CIcon icon={cilLockLocked} className="text-danger me-2" size="lg" />Autorización requerida
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p className="mb-3">Ingresa la contraseña para eliminar:</p>
          <CFormInput type="password" autoComplete="new-password" value={deletePasswordInput}
            onChange={e => { setDeletePasswordInput(e.target.value); setDeletePasswordError(''); }}
            onKeyDown={e => { if (e.key === 'Enter') handleDeletePasswordSubmit(); }}
            invalid={!!deletePasswordError} />
          {deletePasswordError && <div className="text-danger mt-2 small">{deletePasswordError}</div>}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={handleDeletePasswordModalClose}>Cancelar</CButton>
          <CButton color="danger" onClick={handleDeletePasswordSubmit} style={{ color: 'white' }}>
            <CIcon icon={cilTrash} className="me-2" />Continuar
          </CButton>
        </CModalFooter>
      </CModal>

      {/* ── Password modal for edit ── */}
      <CModal visible={showEditPasswordModal} onClose={handleEditPasswordModalClose} alignment="center" backdrop="static" keyboard={false}>
        <CModalHeader closeButton={false}>
          <CModalTitle className="d-flex align-items-center">
            <CIcon icon={cilLockLocked} className="text-primary me-2" size="lg" />Autorización requerida
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p className="mb-3">
            Ingresa la contraseña para editar el esquema de{' '}
            <strong>"{paymentToEdit?.gesca || paymentToEdit?.ip}"</strong>:
          </p>
          <CFormInput type="password" autoComplete="new-password" value={editPasswordInput}
            onChange={e => { setEditPasswordInput(e.target.value); setEditPasswordError(''); }}
            onKeyDown={e => { if (e.key === 'Enter') handleEditPasswordSubmit(); }}
            invalid={!!editPasswordError} />
          {editPasswordError && <div className="text-danger mt-2 small">{editPasswordError}</div>}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={handleEditPasswordModalClose}>Cancelar</CButton>
          <CButton color="primary" onClick={handleEditPasswordSubmit}>
            <CIcon icon={cilPencil} className="me-2" />Continuar
          </CButton>
        </CModalFooter>
      </CModal>
    </CContainer>
  );
};

export default PaymentsGest;