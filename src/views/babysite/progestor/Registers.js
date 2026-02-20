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
  cilLockLocked,
  cilCloudDownload,
} from '@coreui/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../../../context/AuthContext';
import { useBillsAuth } from '../../../context/BillsAuthContext';
import usePermissions from '../../../hooks/usePermissions';
import api from '../../../services/api';

const Registers = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useUser();
  const { authenticateBills } = useBillsAuth();
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
  const [deleteType, setDeleteType] = useState('single'); // 'single' or 'bulk'

  // Password modal state for delete
  const [showDeletePasswordModal, setShowDeletePasswordModal] = useState(false);
  const [deletePasswordInput, setDeletePasswordInput] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState('');

  // Password modal state for edit
  const [showEditPasswordModal, setShowEditPasswordModal] = useState(false);
  const [editPasswordInput, setEditPasswordInput] = useState('');
  const [editPasswordError, setEditPasswordError] = useState('');
  const [registerToEdit, setRegisterToEdit] = useState(null);

  // Password modal state for export
  const [showExportPasswordModal, setShowExportPasswordModal] = useState(false);
  const [exportPasswordInput, setExportPasswordInput] = useState('');
  const [exportPasswordError, setExportPasswordError] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  // Export warning state
  const [showExportWarning, setShowExportWarning] = useState(false);
  const [daysSinceLastExport, setDaysSinceLastExport] = useState(0);

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

  // Check last export date on mount
  useEffect(() => {
    const lastExportDate = localStorage.getItem('registersLastExportDate');
    if (lastExportDate) {
      const lastDate = new Date(lastExportDate);
      const now = new Date();
      const diffTime = Math.abs(now - lastDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 5) {
        setDaysSinceLastExport(diffDays);
        setShowExportWarning(true);
      }
    } else {
      // No export has ever been made
      setDaysSinceLastExport(-1); // -1 indicates never exported
      setShowExportWarning(true);
    }
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

  // Edit handlers
  const handleEditClick = (register) => {
    setRegisterToEdit(register);
    setEditPasswordInput('');
    setEditPasswordError('');
    setShowEditPasswordModal(true);
  };

  const handleEditPasswordSubmit = () => {
    const correctPassword = 'adm@bbcloud1';
    
    if (editPasswordInput === correctPassword) {
      authenticateBills(); // Persist authentication
      setShowEditPasswordModal(false);
      setEditPasswordInput('');
      setEditPasswordError('');
      navigate(`/registers/registerForm/${registerToEdit.id}`);
      setRegisterToEdit(null);
    } else {
      setEditPasswordError('Contraseña incorrecta');
    }
  };

  const handleEditPasswordModalClose = () => {
    setShowEditPasswordModal(false);
    setEditPasswordInput('');
    setEditPasswordError('');
    setRegisterToEdit(null);
  };

  // Export handlers
  const handleExportClick = () => {
    setExportPasswordInput('');
    setExportPasswordError('');
    setShowExportPasswordModal(true);
  };

  const handleExportPasswordSubmit = () => {
    const correctPassword = 'adm@bbcloud10';
    
    if (exportPasswordInput === correctPassword) {
      setShowExportPasswordModal(false);
      setExportPasswordInput('');
      setExportPasswordError('');
      exportToCSV();
    } else {
      setExportPasswordError('Contraseña incorrecta');
    }
  };

  const handleExportPasswordModalClose = () => {
    setShowExportPasswordModal(false);
    setExportPasswordInput('');
    setExportPasswordError('');
  };

  const exportToCSV = async () => {
    try {
      setExportLoading(true);
      showNotification('info', 'Preparando exportación, por favor espere...');

      // Fetch detailed data for all programs (with phases and expenses)
      const detailedPrograms = await Promise.all(
        registers.map(async (reg) => {
          try {
            const response = await api.get(`/api/programs/${reg.id}`, { withCredentials: true });
            return response.data;
          } catch (err) {
            console.error(`Error fetching program ${reg.id}:`, err);
            return { ...reg, phases: [], expenses: [] };
          }
        })
      );

      // Define CSV headers - Program info + Phase columns + Expense summary
      const headers = [
        // Program info
        'ID',
        'Nombre IP',
        'Pareja',
        'País',
        'Fecha Contrato',
        'Depósito 1',
        'Depósito 2',
        'Donante Select',
        'Select 2',
        'Select 3',
        'Select R',
        'Catálogo',
        'Valor Catálogo',
        'Crio Embrio',
        'XX',
        'XY',
        'NI',
        'Tanque',
        'Gestante',
        'Parto',
        'CLABE',
        'Seguro',
        'Póliza',
        'Gestor',
        'Moneda',
        'Tipo de Cambio',
        'Estado',
        'Valor Total Programa',
        'Fecha Creación',
        'Fecha Actualización',
        // Phase columns (up to 10 phases)
        ...Array.from({ length: 10 }, (_, i) => [
          `Fase ${i + 1} Nombre`,
          `Fase ${i + 1} Valor`,
          `Fase ${i + 1} Pago 1`,
          `Fase ${i + 1} Fecha Pago 1`,
          `Fase ${i + 1} Pago 2`,
          `Fase ${i + 1} Fecha Pago 2`,
          `Fase ${i + 1} Pago 3`,
          `Fase ${i + 1} Fecha Pago 3`,
          `Fase ${i + 1} Facturado a`,
          `Fase ${i + 1} Notas`,
        ]).flat(),
        // Expense summary
        'Total Entradas',
        'Total Salidas',
        'Número de Gastos',
        // Expense details (concatenated)
        'Detalle de Gastos'
      ];

      // Helper to format date
      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
          return new Date(dateStr).toLocaleDateString('es-MX');
        } catch {
          return '';
        }
      };

      // Convert data to CSV rows
      const rows = detailedPrograms.map(prog => {
        const phases = prog.phases || [];
        const expenses = prog.expenses || [];

        // Calculate expense totals
        const totalEntradas = expenses
          .filter(e => e.movement_type === 'entrada')
          .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
        const totalSalidas = expenses
          .filter(e => e.movement_type === 'salida')
          .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

        // Format expense details
        const expenseDetails = expenses.map(e => 
          `${formatDate(e.expense_date)}: ${e.movement_type} - ${e.reason} - ${e.amount} ${e.currency || 'MXN'}`
        ).join(' | ');

        // Build row
        const row = [
          // Program info
          prog.id || '',
          prog.ip_name || '',
          prog.couple_name || '',
          prog.country || '',
          formatDate(prog.contract_date),
          prog.deposit_1 || '',
          prog.deposit_2 || '',
          prog.donor_select || '',
          prog.select_2 || '',
          prog.select_3 || '',
          prog.select_r || '',
          prog.catalog || '',
          prog.catalog_value || '',
          prog.crio_embryo || '',
          prog.xx_count || '',
          prog.xy_count || '',
          prog.ni_count || '',
          prog.tank || '',
          prog.surrogate || '',
          prog.birth_info || '',
          prog.clabe || '',
          prog.insurance || '',
          prog.policy || '',
          prog.manager || '',
          prog.currency || '',
          prog.exchange_rate || '',
          prog.status || '',
          prog.total_program_value || 0,
          formatDate(prog.created_at),
          formatDate(prog.updated_at),
        ];

        // Add phase data (up to 10 phases)
        for (let i = 0; i < 10; i++) {
          const phase = phases[i];
          if (phase) {
            row.push(
              phase.phase_name || '',
              phase.phase_value || '',
              phase.payment_1_amount || '',
              formatDate(phase.payment_1_date),
              phase.payment_2_amount || '',
              formatDate(phase.payment_2_date),
              phase.payment_3_amount || '',
              formatDate(phase.payment_3_date),
              phase.invoiced_to || '',
              phase.notes || ''
            );
          } else {
            // Empty phase columns
            row.push('', '', '', '', '', '', '', '', '', '');
          }
        }

        // Add expense summary
        row.push(
          totalEntradas,
          totalSalidas,
          expenses.length,
          expenseDetails
        );

        return row;
      });

      // Escape CSV values (handle commas, quotes, newlines)
      const escapeCSV = (value) => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('|')) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      };

      // Build CSV content
      const csvContent = [
        headers.map(escapeCSV).join(','),
        ...rows.map(row => row.map(escapeCSV).join(','))
      ].join('\n');

      // Add BOM for Excel compatibility with special characters
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Create download link
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().split('T')[0];
      
      link.setAttribute('href', url);
      link.setAttribute('download', `registros_programas_completo_${timestamp}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Save export date to localStorage
      localStorage.setItem('registersLastExportDate', new Date().toISOString());
      setShowExportWarning(false);

      showNotification('success', `Se exportaron ${registers.length} registros con fases y gastos correctamente`);
    } catch (err) {
      console.error('Error exporting to CSV:', err);
      showNotification('danger', 'Error al exportar los datos');
    } finally {
      setExportLoading(false);
    }
  };

  // Delete handlers
  const handleDeleteClick = (register) => {
    setRegisterToDelete(register);
    setDeleteType('single');
    setDeletePasswordInput('');
    setDeletePasswordError('');
    setShowDeletePasswordModal(true);
  };

  const handleBulkDeleteClick = () => {
    if (selectedRegisters.length === 0) return;
    setDeleteType('bulk');
    setDeletePasswordInput('');
    setDeletePasswordError('');
    setShowDeletePasswordModal(true);
  };

  // Ref to track if we're transitioning between modals
  const isTransitioningToConfirmation = React.useRef(false);

  const handleDeletePasswordSubmit = () => {
    const correctPassword = 'adm@bbcloud1';
    
    if (deletePasswordInput === correctPassword) {
      authenticateBills(); // Persist authentication
      isTransitioningToConfirmation.current = true;
      setDeletePasswordInput('');
      setDeletePasswordError('');
      setShowDeletePasswordModal(false);
      // Use setTimeout to ensure the password modal is fully closed before opening confirmation
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
    // Only reset these when user explicitly cancels (not when transitioning to confirmation modal)
    if (!isTransitioningToConfirmation.current) {
      setRegisterToDelete(null);
      setDeleteType('single');
    }
  };

  const handleDeleteModalClose = () => {
    setShowDeleteModal(false);
    setRegisterToDelete(null);
    setDeleteType('single');
  };

  const executeDelete = async () => {
    if (deleteType === 'single') {
      if (!registerToDelete) return;
      
      try {
        await api.delete(`/api/programs/${registerToDelete.id}`, { withCredentials: true });
        setRegisters((prev) => prev.filter((r) => r.id !== registerToDelete.id));
        setSelectedRegisters((prev) => prev.filter((id) => id !== registerToDelete.id));
        showNotification('success', 'Registro eliminado correctamente');
      } catch (err) {
        console.error('Error deleting register:', err);
        showNotification('danger', 'Error al eliminar el registro');
      }
    } else {
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
    }
    
    setShowDeleteModal(false);
    setRegisterToDelete(null);
    setDeleteType('single');
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

      {showExportWarning && (
        <CAlert 
          className="mx-5" 
          color="warning" 
          dismissible 
          onClose={() => setShowExportWarning(false)}
        >
          <div className="d-flex align-items-center">
            <CIcon icon={cilWarning} className="me-2" size="lg" />
            <div>
              <strong>¡Atención!</strong>{' '}
              {daysSinceLastExport === -1 
                ? 'Nunca se ha realizado una exportación de datos. Se recomienda exportar los registros periódicamente como respaldo.'
                : `Han pasado ${daysSinceLastExport} días desde la última exportación de datos. Se recomienda realizar una exportación como respaldo.`
              }
            </div>
          </div>
        </CAlert>
      )}

      <CCard className="mb-4 mx-5">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Lista de Registros (Programas)</strong>
          <div className="d-flex gap-2">
            <CButton
              color="success"
              onClick={handleExportClick}
              disabled={exportLoading}
              style={{ color: 'white' }}
            >
              {exportLoading ? (
                <>
                  <CSpinner size="sm" className="me-2" />
                  Exportando...
                </>
              ) : (
                <>
                  <CIcon icon={cilCloudDownload} className="me-2" />
                  Exportar CSV
                </>
              )}
            </CButton>
            <CButton
              color="primary"
              className="app-button"
              onClick={() => navigate('/registers/registerForm')}
            >
              <CIcon icon={cilPlus} className="me-2" />
              Nuevo registro
            </CButton>
          </div>
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
                  autoComplete="off"
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
                <CButton color="danger" variant="outline" onClick={handleBulkDeleteClick}>
                  <CIcon icon={cilTrash} className="me-2" />
                  Eliminar seleccionados ({selectedRegisters.length})
                </CButton>
              )}
            </CCol>
          </CRow>

          {/* Statistics cards */}
          <CRow className="mb-4">
            <CCol md={3}>
              <div className="p-3 rounded text-center">
                <h6 className="text-muted mb-1">Total registros</h6>
                <h4 className="mb-0 text-primary">{registers.length}</h4>
              </div>
            </CCol>
            <CCol md={3}>
              <div className="p-3 rounded text-center">
                <h6 className="text-muted mb-1">Activos</h6>
                <h4 className="mb-0 text-success">
                  {registers.filter(r => r.status === 'active').length}
                </h4>
              </div>
            </CCol>
            <CCol md={3}>
              <div className="p-3 rounded text-center">
                <h6 className="text-muted mb-1">Completados</h6>
                <h4 className="mb-0 text-info">
                  {registers.filter(r => r.status === 'completed').length}
                </h4>
              </div>
            </CCol>
            <CCol md={3}>
              <div className="p-3 rounded text-center">
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
                          onClick={() => handleEditClick(register)}
                          title="Editar registro"
                          className="me-1"
                        >
                          <CIcon icon={cilPencil} />
                        </CButton>
                        <CButton
                          color="danger"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(register)}
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
      <CModal 
        visible={showDeleteModal} 
        onClose={handleDeleteModalClose} 
        alignment="center"
        backdrop="static"
        keyboard={false}
      >
        <CModalHeader closeButton={false}>
          <CModalTitle className="d-flex align-items-center">
            <CIcon icon={cilWarning} className="text-danger me-2" size="lg" />
            Confirmar eliminación
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {deleteType === 'single' ? (
            <>
              <p className="mb-2">
                ¿Estás seguro de que deseas eliminar el registro <strong>"{registerToDelete?.ip_name}"</strong>?
              </p>
              <p className="text-muted mb-0">
                <small>Esta acción eliminará también todas las fases y gastos asociados. No se puede deshacer.</small>
              </p>
            </>
          ) : (
            <>
              <p className="mb-2">
                ¿Estás seguro de que deseas eliminar <strong>{selectedRegisters.length} registro(s)</strong>?
              </p>
              <p className="text-muted mb-0">
                <small>Esta acción eliminará también todas las fases y gastos asociados. No se puede deshacer.</small>
              </p>
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={handleDeleteModalClose}>
            Cancelar
          </CButton>
          <CButton 
            color="danger" 
            onClick={executeDelete}
            style={{ color: 'white' }}
          >
            <CIcon icon={cilTrash} className="me-2" />
            Eliminar
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Password Modal for Delete */}
      <CModal 
        visible={showDeletePasswordModal} 
        onClose={handleDeletePasswordModalClose} 
        alignment="center"
        backdrop="static"
        keyboard={false}
      >
        <CModalHeader closeButton={false}>
          <CModalTitle className="d-flex align-items-center">
            <CIcon icon={cilLockLocked} className="text-danger me-2" size="lg" />
            Autorización requerida
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p className="mb-3">
            Ingresa la contraseña para eliminar {deleteType === 'single' 
              ? <>el registro <strong>"{registerToDelete?.ip_name}"</strong></>
              : <><strong>{selectedRegisters.length} registro(s)</strong></>
            }:
          </p>
          <CFormInput
            type="password"
            autoComplete="new-password"
            value={deletePasswordInput}
            onChange={(e) => {
              setDeletePasswordInput(e.target.value);
              setDeletePasswordError('');
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleDeletePasswordSubmit();
              }
            }}
            invalid={!!deletePasswordError}
          />
          {deletePasswordError && (
            <div className="text-danger mt-2 small">{deletePasswordError}</div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={handleDeletePasswordModalClose}>
            Cancelar
          </CButton>
          <CButton 
            color="danger" 
            onClick={handleDeletePasswordSubmit}
            style={{ color: 'white' }}
          >
            <CIcon icon={cilTrash} className="me-2" />
            Continuar
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Password Modal for Edit */}
      <CModal 
        visible={showEditPasswordModal} 
        onClose={handleEditPasswordModalClose} 
        alignment="center"
        backdrop="static"
        keyboard={false}
      >
        <CModalHeader closeButton={false}>
          <CModalTitle className="d-flex align-items-center">
            <CIcon icon={cilLockLocked} className="text-primary me-2" size="lg" />
            Autorización requerida
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p className="mb-3">
            Ingresa la contraseña para editar el registro <strong>"{registerToEdit?.ip_name}"</strong>:
          </p>
          <CFormInput
            type="password"
            autoComplete="new-password"
            value={editPasswordInput}
            onChange={(e) => {
              setEditPasswordInput(e.target.value);
              setEditPasswordError('');
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleEditPasswordSubmit();
              }
            }}
            invalid={!!editPasswordError}
          />
          {editPasswordError && (
            <div className="text-danger mt-2 small">{editPasswordError}</div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={handleEditPasswordModalClose}>
            Cancelar
          </CButton>
          <CButton 
            color="primary" 
            onClick={handleEditPasswordSubmit}
          >
            <CIcon icon={cilPencil} className="me-2" />
            Continuar
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Password Modal for Export */}
      <CModal 
        visible={showExportPasswordModal} 
        onClose={handleExportPasswordModalClose} 
        alignment="center"
        backdrop="static"
        keyboard={false}
      >
        <CModalHeader closeButton={false}>
          <CModalTitle className="d-flex align-items-center">
            <CIcon icon={cilLockLocked} className="text-success me-2" size="lg" />
            Autorización requerida
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p className="mb-3">
            Ingresa la contraseña para exportar <strong>{registers.length} registros</strong> a CSV:
          </p>
          <CFormInput
            type="password"
            autoComplete="new-password"
            value={exportPasswordInput}
            onChange={(e) => {
              setExportPasswordInput(e.target.value);
              setExportPasswordError('');
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleExportPasswordSubmit();
              }
            }}
            invalid={!!exportPasswordError}
          />
          {exportPasswordError && (
            <div className="text-danger mt-2 small">{exportPasswordError}</div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={handleExportPasswordModalClose}>
            Cancelar
          </CButton>
          <CButton 
            color="success" 
            onClick={handleExportPasswordSubmit}
            style={{ color: 'white' }}
          >
            <CIcon icon={cilCloudDownload} className="me-2" />
            Exportar
          </CButton>
        </CModalFooter>
      </CModal>
    </CContainer>
  );
};

export default Registers;