// src/views/pages/programs/Registers.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CRow,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CButton,
  CFormInput,
  CFormSelect,
  CFormCheck,
  CSpinner,
  CAlert,
  CInputGroup,
  CInputGroupText,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CBadge,
  CTooltip,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilSearch,
  cilPlus,
  cilTrash,
  cilArrowTop,
  cilArrowBottom,
  cilPencil,
  cilBan,
  cilDollar,
  cilGlobeAlt,
  cilCalendar,
  cilWarning,
} from '@coreui/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../../../context/AuthContext';
import usePermissions from '../../../hooks/usePermissions';
import api from '../../../services/api';

const Registers = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useUser();
  // You can add specific permissions for registers if needed
  // const { registers: registerPerms } = usePermissions();

  // Data state
  const [registers, setRegisters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selection state
  const [selectedRegisters, setSelectedRegisters] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  // Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [registerToDelete, setRegisterToDelete] = useState(null);

  // Alert state
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  // Status options
  const statusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'active', label: 'Activo', color: 'success' },
    { value: 'completed', label: 'Completado', color: 'primary' },
    { value: 'cancelled', label: 'Cancelado', color: 'danger' },
    { value: 'pending', label: 'Pendiente', color: 'warning' },
  ];

  // Currency options
  const currencyOptions = [
    { value: 'all', label: 'Todas las monedas' },
    { value: 'USD', label: 'USD (Dólares)' },
    { value: 'EUR', label: 'EUR (Euros)' },
  ];

  // Fetch registers on mount
  useEffect(() => {
    fetchRegisters();
  }, []);

  const fetchRegisters = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/programs', { withCredentials: true });
      setRegisters(res.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching registers:', err);
      setError('Error al cargar los registros');
    } finally {
      setLoading(false);
    }
  };

  // Show notification
  const showNotification = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

  // Sorting logic
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? cilArrowTop : cilArrowBottom;
  };

  // Filter and sort registers
  const filteredAndSortedRegisters = useMemo(() => {
    let result = [...registers];
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((reg) =>
        reg.ip_name?.toLowerCase().includes(term) ||
        reg.couple_name?.toLowerCase().includes(term) ||
        reg.country?.toLowerCase().includes(term) ||
        reg.surrogate?.toLowerCase().includes(term) ||
        reg.manager?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((reg) => reg.status === statusFilter);
    }

    // Currency filter
    if (currencyFilter !== 'all') {
      result = result.filter((reg) => reg.currency === currencyFilter);
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortConfig.key] || '';
      let bVal = b[sortConfig.key] || '';
      
      if (sortConfig.key === 'created_at' || sortConfig.key === 'contract_date') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else if (sortConfig.key === 'total_program_value') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      } else {
        aVal = aVal.toString().toLowerCase();
        bVal = bVal.toString().toLowerCase();
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [registers, searchTerm, statusFilter, currencyFilter, sortConfig]);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRegisters([]);
    } else {
      setSelectedRegisters(filteredAndSortedRegisters.map((reg) => reg.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectRegister = (registerId) => {
    setSelectedRegisters((prev) => {
      if (prev.includes(registerId)) return prev.filter((id) => id !== registerId);
      return [...prev, registerId];
    });
  };

  useEffect(() => {
    setSelectAll(
      filteredAndSortedRegisters.length > 0 && 
      selectedRegisters.length === filteredAndSortedRegisters.length
    );
  }, [selectedRegisters, filteredAndSortedRegisters]);

  // Delete handlers
  const confirmDeleteRegister = (register) => {
    setRegisterToDelete(register);
    setShowDeleteModal(true);
  };

  const deleteRegister = async () => {
    if (!registerToDelete) return;

    try {
      await api.delete(`/api/programs/${registerToDelete.id}`, { withCredentials: true });
      setRegisters((prev) => prev.filter((r) => r.id !== registerToDelete.id));
      setSelectedRegisters((prev) => prev.filter((id) => id !== registerToDelete.id));
      showNotification('success', 'Registro eliminado correctamente');
    } catch (err) {
      console.error('Error deleting register:', err);
      showNotification('danger', 'Error al eliminar el registro');
    } finally {
      setShowDeleteModal(false);
      setRegisterToDelete(null);
    }
  };

  const deleteSelectedRegisters = async () => {
    if (selectedRegisters.length === 0) return;

    try {
      await api.post('/api/programs/bulk-delete', { ids: selectedRegisters }, { withCredentials: true });
      setRegisters((prev) => prev.filter((r) => !selectedRegisters.includes(r.id)));
      setSelectedRegisters([]);
      showNotification('success', `${selectedRegisters.length} registro(s) eliminado(s)`);
    } catch (err) {
      console.error('Error deleting registers:', err);
      showNotification('danger', 'Error al eliminar los registros');
    }
  };

  // Format functions
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (value, currency = 'USD') => {
    if (!value && value !== 0) return '-';
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currency,
      minimumFractionDigits: 2 
    }).format(value);
  };

  const getStatusBadge = (status) => {
    const option = statusOptions.find((opt) => opt.value === status);
    return option ? (
      <CBadge color={option.color}>{option.label}</CBadge>
    ) : (
      <CBadge color="secondary">{status}</CBadge>
    );
  };

  // Sortable header component
  const SortableHeader = ({ label, sortKey }) => (
    <CTableHeaderCell
      style={{ cursor: 'pointer', userSelect: 'none' }}
      onClick={() => handleSort(sortKey)}
    >
      <div className="d-flex align-items-center">
        {label}
        <CIcon
          icon={getSortIcon(sortKey) || cilArrowTop}
          size="sm"
          className={`ms-1 ${sortConfig.key !== sortKey ? 'text-muted opacity-25' : ''}`}
        />
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

      <CCard className="mb-4 mx-5">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Lista de Registros (Programas)</strong>
          <CButton
            color="primary"
            className="app-button"
            onClick={() => navigate('/registers/registerForm')}
          >
            <CIcon icon={cilPlus} className="me-2" />
            Nuevo registro
          </CButton>
        </CCardHeader>
        <CCardBody>
          {/* Search and filters */}
          <CRow className="mb-3 g-3">
            <CCol md={4}>
              <CInputGroup>
                <CInputGroupText>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>
                <CFormInput
                  placeholder="Buscar por nombre, país, gestante, gestor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </CInputGroup>
            </CCol>
            <CCol md={2}>
              <CFormSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={2}>
              <CFormSelect
                value={currencyFilter}
                onChange={(e) => setCurrencyFilter(e.target.value)}
              >
                {currencyOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={4} className="text-end">
              {selectedRegisters.length > 0 && (
                <CButton color="danger" variant="outline" onClick={deleteSelectedRegisters}>
                  <CIcon icon={cilTrash} className="me-2" />
                  Eliminar seleccionados ({selectedRegisters.length})
                </CButton>
              )}
            </CCol>
          </CRow>

          {/* Statistics cards */}
          <CRow className="mb-4">
            <CCol md={3}>
              <div className="p-3 bg-light rounded text-center">
                <h6 className="text-muted mb-1">Total registros</h6>
                <h4 className="mb-0 text-primary">{registers.length}</h4>
              </div>
            </CCol>
            <CCol md={3}>
              <div className="p-3 bg-light rounded text-center">
                <h6 className="text-muted mb-1">Activos</h6>
                <h4 className="mb-0 text-success">
                  {registers.filter(r => r.status === 'active').length}
                </h4>
              </div>
            </CCol>
            <CCol md={3}>
              <div className="p-3 bg-light rounded text-center">
                <h6 className="text-muted mb-1">Completados</h6>
                <h4 className="mb-0 text-info">
                  {registers.filter(r => r.status === 'completed').length}
                </h4>
              </div>
            </CCol>
            <CCol md={3}>
              <div className="p-3 bg-light rounded text-center">
                <h6 className="text-muted mb-1">Pendientes</h6>
                <h4 className="mb-0 text-warning">
                  {registers.filter(r => r.status === 'pending').length}
                </h4>
              </div>
            </CCol>
          </CRow>

          {/* Registers table */}
          <div className="table-responsive">
            <CTable hover striped>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell style={{ width: '50px' }}>
                    <CFormCheck
                      checked={selectAll}
                      onChange={handleSelectAll}
                      disabled={filteredAndSortedRegisters.length === 0}
                    />
                  </CTableHeaderCell>
                  <SortableHeader label="Nombre IP" sortKey="ip_name" />
                  <SortableHeader label="Pareja" sortKey="couple_name" />
                  <SortableHeader label="País" sortKey="country" />
                  <SortableHeader label="Fecha contrato" sortKey="contract_date" />
                  <CTableHeaderCell>Moneda</CTableHeaderCell>
                  <SortableHeader label="Valor programa" sortKey="total_program_value" />
                  <CTableHeaderCell>Fases</CTableHeaderCell>
                  <SortableHeader label="Estado" sortKey="status" />
                  <SortableHeader label="Creado" sortKey="created_at" />
                  <CTableHeaderCell style={{ width: '120px' }}>Acciones</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {filteredAndSortedRegisters.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={11} className="text-center py-4">
                      {searchTerm || statusFilter !== 'all' || currencyFilter !== 'all'
                        ? 'No se encontraron registros con los filtros aplicados'
                        : 'No hay registros. Crea uno nuevo para comenzar.'}
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  filteredAndSortedRegisters.map((register) => (
                    <CTableRow key={register.id}>
                      <CTableDataCell>
                        <CFormCheck
                          checked={selectedRegisters.includes(register.id)}
                          onChange={() => handleSelectRegister(register.id)}
                        />
                      </CTableDataCell>
                      <CTableDataCell>
                        <strong>{register.ip_name}</strong>
                      </CTableDataCell>
                      <CTableDataCell>{register.couple_name || '-'}</CTableDataCell>
                      <CTableDataCell>
                        <CIcon icon={cilGlobeAlt} size="sm" className="me-1 text-muted" />
                        {register.country}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CIcon icon={cilCalendar} size="sm" className="me-1 text-muted" />
                        {formatDate(register.contract_date)}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={register.currency === 'USD' ? 'success' : 'info'}>
                          {register.currency}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CIcon icon={cilDollar} size="sm" className="me-1 text-muted" />
                        {formatCurrency(register.total_program_value, register.currency)}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color="secondary">{register.phase_count || 0} fases</CBadge>
                      </CTableDataCell>
                      <CTableDataCell>{getStatusBadge(register.status)}</CTableDataCell>
                      <CTableDataCell>{formatDate(register.created_at)}</CTableDataCell>
                      <CTableDataCell>
                        <CButton
                          color="primary"
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/registers/registerForm/${register.id}`)}
                          title="Editar registro"
                          className="me-1"
                        >
                          <CIcon icon={cilPencil} />
                        </CButton>
                        <CButton
                          color="danger"
                          variant="ghost"
                          size="sm"
                          onClick={() => confirmDeleteRegister(register)}
                          title="Eliminar registro"
                        >
                          <CIcon icon={cilTrash} />
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          </div>

          <div className="text-muted small mt-2">
            Mostrando {filteredAndSortedRegisters.length} de {registers.length} registros
          </div>
        </CCardBody>
      </CCard>

      {/* Delete Confirmation Modal */}
      <CModal visible={showDeleteModal} onClose={() => setShowDeleteModal(false)} alignment="center">
        <CModalHeader>
          <CModalTitle className="d-flex align-items-center">
            <CIcon icon={cilWarning} className="text-danger me-2" size="lg" />
            Confirmar eliminación
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p className="mb-2">
            ¿Estás seguro de que deseas eliminar el registro <strong>"{registerToDelete?.ip_name}"</strong>?
          </p>
          <p className="text-muted mb-0">
            <small>Esta acción eliminará también todas las fases y gastos asociados. No se puede deshacer.</small>
          </p>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </CButton>
          <CButton color="danger" onClick={deleteRegister}>
            <CIcon icon={cilTrash} className="me-2" />
            Eliminar
          </CButton>
        </CModalFooter>
      </CModal>
    </CContainer>
  );
};

export default Registers;