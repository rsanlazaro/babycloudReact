// src/views/pages/guests/Guests.js
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
  CFormFeedback,
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
  cilCheckAlt,
  cilX,
  cilLockLocked,
  cilLockUnlocked,
  cilBan,
} from '@coreui/icons';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../context/AuthContext';
import usePermissions from '../../../hooks/usePermissions';
import api from '../../../services/api';

/**
 * Permission Levels:
 * 0 = Hidden (not visible)
 * 1 = Visible but not editable (read-only)
 * 2 = Visible and editable (full access)
 * 
 * Guest permissions:
 * access_14 = LIST_GUESTS - view guest list
 * access_15 = CREATE_GUEST - create new guests
 * access_16 = EDIT_GUEST - edit username, email, profile, status
 * access_17 = GUEST_PASSWORD - view/edit passwords
 * access_18 = GUEST_PERMISSIONS - view/edit guest roles
 * access_19 = DELETE_GUEST - delete guests
 */

const Guests = () => {
  const navigate = useNavigate();
  
  // Get current user and permissions
  const { user: currentUser } = useUser();
  const { guests: guestPerms } = usePermissions();

  // Data state
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selection state
  const [selectedGuests, setSelectedGuests] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Search and sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'username', direction: 'asc' });

  // Edit state
  const [editingCell, setEditingCell] = useState({ id: null, field: null });
  const [editValue, setEditValue] = useState('');

  // Password visibility state
  const [visiblePasswords, setVisiblePasswords] = useState({});

  // Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNewGuestModal, setShowNewGuestModal] = useState(false);
  const [guestToDelete, setGuestToDelete] = useState(null);

  // New guest form state
  const [newGuest, setNewGuest] = useState({
    username: '',
    email: '',
    password: '',
    profile: 'ip',
  });

  // Profile options
  const profileOptions = [
    { value: 'ip', label: 'IP' },
    { value: 'agency', label: 'Agency' },
  ];

  // New guest form errors
  const [newGuestErrors, setNewGuestErrors] = useState({});
  const [newGuestTouched, setNewGuestTouched] = useState({});

  // Alert state
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  // Redirect if no view permission (level 0)
  useEffect(() => {
    if (!guestPerms.list.visible) {
      navigate('/dashboard');
    }
  }, [guestPerms.list.visible, navigate]);

  // Fetch guests on mount
  useEffect(() => {
    if (guestPerms.list.visible) {
      fetchGuests();
    }
  }, [guestPerms.list.visible]);

  const fetchGuests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/guests', { withCredentials: true });
      setGuests(res.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching guests:', err);
      setError('Error al cargar los invitados');
    } finally {
      setLoading(false);
    }
  };

  // Show notification
  const showNotification = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

  // Validation functions
  const validateEmail = (email) => {
    if (!email || !email.trim()) return 'El correo electrónico es obligatorio';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Ingresa una dirección de correo electrónica válida';
    return '';
  };

  const validatePassword = (password) => {
    if (!password || !password.trim()) return 'La contraseña es obligatoria';
    if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return 'La contraseña debe contener una mayúscula, una minúscula y un número';
    return '';
  };

  const validateUsername = (username) => {
    if (!username || !username.trim()) return 'El nombre de usuario es obligatorio';
    if (username.length < 3) return 'El nombre de usuario debe tener al menos 3 caracteres';
    return '';
  };

  const validateProfile = (profile) => {
    if (!profile || !profile.trim()) return 'El perfil es obligatorio';
    if (!['ip', 'agency'].includes(profile)) return 'Perfil inválido';
    return '';
  };

  const validateNewGuestField = (name, value) => {
    switch (name) {
      case 'username': return validateUsername(value);
      case 'email': return validateEmail(value);
      case 'password': return validatePassword(value);
      case 'profile': return validateProfile(value);
      default: return '';
    }
  };

  const validateNewGuestForm = () => {
    const errors = {};
    errors.username = validateUsername(newGuest.username);
    errors.email = validateEmail(newGuest.email);
    errors.password = validatePassword(newGuest.password);
    errors.profile = validateProfile(newGuest.profile);
    Object.keys(errors).forEach((key) => { if (!errors[key]) delete errors[key]; });
    setNewGuestErrors(errors);
    return Object.keys(errors).length === 0;
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

  // Filter and sort guests
  const filteredAndSortedGuests = useMemo(() => {
    let result = [...guests];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((guest) =>
        guest.username?.toLowerCase().includes(term) ||
        guest.mail?.toLowerCase().includes(term) ||
        guest.profile?.toLowerCase().includes(term)
      );
    }
    result.sort((a, b) => {
      let aVal = a[sortConfig.key] || '';
      let bVal = b[sortConfig.key] || '';
      if (sortConfig.key === 'created_on') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else {
        aVal = aVal.toString().toLowerCase();
        bVal = bVal.toString().toLowerCase();
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [guests, searchTerm, sortConfig]);

  // Selection handlers
  const handleSelectAll = () => {
    // Only allow if has delete permission level 2
    if (!guestPerms.delete.editable) return;
    
    if (selectAll) {
      setSelectedGuests([]);
    } else {
      setSelectedGuests(filteredAndSortedGuests.map((guest) => guest.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectGuest = (guestId) => {
    // Only allow if has delete permission level 2
    if (!guestPerms.delete.editable) return;
    
    setSelectedGuests((prev) => {
      if (prev.includes(guestId)) return prev.filter((id) => id !== guestId);
      return [...prev, guestId];
    });
  };

  useEffect(() => {
    setSelectAll(filteredAndSortedGuests.length > 0 && selectedGuests.length === filteredAndSortedGuests.length);
  }, [selectedGuests, filteredAndSortedGuests]);

  // Inline edit handlers
  const startEditing = (guestId, field, currentValue) => {
    // Check permission for the specific field
    if (field === 'password' && !guestPerms.password.editable) return;
    if ((field === 'username' || field === 'mail' || field === 'profile' || field === 'enabled') && !guestPerms.edit.editable) return;
    
    setEditingCell({ id: guestId, field });
    setEditValue(currentValue || '');
  };

  const cancelEditing = () => {
    setEditingCell({ id: null, field: null });
    setEditValue('');
  };

  const saveEdit = async (guestId, field) => {
    if (field === 'password') {
      const error = validatePassword(editValue);
      if (error) {
        showNotification('danger', error);
        return;
      }
    }
    if (field === 'mail') {
      const error = validateEmail(editValue);
      if (error) {
        showNotification('danger', error);
        return;
      }
    }

    try {
      const updateData = { [field]: editValue };
      await api.put(`/api/guests/${guestId}`, updateData, { withCredentials: true });
      setGuests((prev) => prev.map((guest) => guest.id === guestId ? { ...guest, [field]: editValue } : guest));
      showNotification('success', 'Invitado actualizado correctamente');
      cancelEditing();
    } catch (err) {
      console.error('Error updating guest:', err);
      const message = err.response?.data?.message || 'Error al actualizar el invitado';
      showNotification('danger', message);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (guestId) => {
    // Only allow if has password permission level >= 1
    if (!guestPerms.password.visible) return;
    setVisiblePasswords((prev) => ({ ...prev, [guestId]: !prev[guestId] }));
  };

  // Toggle guest status
  const toggleGuestStatus = async (guestId, currentStatus) => {
    // Only allow if has edit permission level 2
    if (!guestPerms.edit.editable) return;
    
    try {
      const newStatus = currentStatus ? 0 : 1;
      await api.put(`/api/guests/${guestId}`, { enabled: newStatus }, { withCredentials: true });
      setGuests((prev) => prev.map((guest) => guest.id === guestId ? { ...guest, enabled: newStatus } : guest));
      showNotification('success', `Invitado ${newStatus ? 'habilitado' : 'deshabilitado'}`);
    } catch (err) {
      console.error('Error toggling guest status:', err);
      showNotification('danger', 'Error al cambiar el estado del invitado');
    }
  };

  // Delete handlers
  const confirmDeleteGuest = (guest) => {
    // Only allow if has delete permission level 2
    if (!guestPerms.delete.editable) return;
    
    setGuestToDelete(guest);
    setShowDeleteModal(true);
  };

  const deleteGuest = async () => {
    if (!guestToDelete || !guestPerms.delete.editable) return;
    
    try {
      await api.delete(`/api/guests/${guestToDelete.id}`, { withCredentials: true });
      setGuests((prev) => prev.filter((g) => g.id !== guestToDelete.id));
      setSelectedGuests((prev) => prev.filter((id) => id !== guestToDelete.id));
      showNotification('success', 'Invitado eliminado correctamente');
    } catch (err) {
      console.error('Error deleting guest:', err);
      showNotification('danger', 'Error al eliminar el invitado');
    } finally {
      setShowDeleteModal(false);
      setGuestToDelete(null);
    }
  };

  const deleteSelectedGuests = async () => {
    if (selectedGuests.length === 0 || !guestPerms.delete.editable) return;
    
    try {
      await api.post('/api/guests/bulk-delete', { ids: selectedGuests }, { withCredentials: true });
      setGuests((prev) => prev.filter((g) => !selectedGuests.includes(g.id)));
      setSelectedGuests([]);
      showNotification('success', `${selectedGuests.length} invitado(s) eliminado(s)`);
    } catch (err) {
      console.error('Error deleting guests:', err);
      showNotification('danger', 'Error al eliminar los invitados');
    }
  };

  // New guest handlers
  const handleNewGuestChange = (e) => {
    const { name, value } = e.target;
    setNewGuest((prev) => ({ ...prev, [name]: value }));
    if (newGuestTouched[name]) {
      const error = validateNewGuestField(name, value);
      setNewGuestErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleNewGuestBlur = (e) => {
    const { name, value } = e.target;
    setNewGuestTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateNewGuestField(name, value);
    setNewGuestErrors((prev) => ({ ...prev, [name]: error }));
  };

  const resetNewGuestForm = () => {
    setNewGuest({ username: '', email: '', password: '', profile: 'ip' });
    setNewGuestErrors({});
    setNewGuestTouched({});
  };

  const createGuest = async () => {
    // Only allow if has create permission level 2
    if (!guestPerms.create.editable) return;
    
    setNewGuestTouched({ username: true, email: true, password: true, profile: true });
    if (!validateNewGuestForm()) {
      showNotification('danger', 'Por favor corrija los errores antes de continuar');
      return;
    }
    
    try {
      const res = await api.post('/api/guests', newGuest, { withCredentials: true });
      setGuests((prev) => [...prev, res.data]);
      setShowNewGuestModal(false);
      resetNewGuestForm();
      showNotification('success', 'Invitado creado correctamente');
    } catch (err) {
      console.error('Error creating guest:', err);
      const message = err.response?.data?.message || 'Error al crear el invitado';
      showNotification('danger', message);
    }
  };

  // Get profile label
  const getProfileLabel = (value) => {
    const option = profileOptions.find((opt) => opt.value === value);
    return option ? option.label : value;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  /**
   * Render editable cell based on permission level
   * 0 = hidden (return null)
   * 1 = visible but not editable (show value, no edit icon)
   * 2 = visible and editable (show value with edit icon)
   */
  const renderEditableCell = (guest, field, type = 'text') => {
    // Determine which permission applies to this field
    let fieldPerm;
    if (field === 'password') fieldPerm = guestPerms.password;
    else fieldPerm = guestPerms.edit;

    // If not visible (level 0), don't show at all
    if (!fieldPerm.visible) {
      return <span className="text-muted">-</span>;
    }

    const isEditing = editingCell.id === guest.id && editingCell.field === field;

    // Editing mode
    if (isEditing) {
      return (
        <CInputGroup size="sm">
          {type === 'select' ? (
            <CFormSelect
              size="sm"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              autoFocus
            >
              {profileOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </CFormSelect>
          ) : (
            <CFormInput
              size="sm"
              type={type === 'password' ? 'text' : type}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit(guest.id, field);
                if (e.key === 'Escape') cancelEditing();
              }}
              autoFocus
            />
          )}
          <CButton color="success" variant="outline" size="sm" onClick={() => saveEdit(guest.id, field)}>
            <CIcon icon={cilCheckAlt} />
          </CButton>
          <CButton color="danger" variant="outline" size="sm" onClick={cancelEditing}>
            <CIcon icon={cilX} />
          </CButton>
        </CInputGroup>
      );
    }

    // Password field with visibility toggle
    if (field === 'password') {
      const isVisible = visiblePasswords[guest.id];
      return (
        <div className="d-flex align-items-center">
          <div
            className={`d-flex align-items-center justify-content-between flex-grow-1 ${fieldPerm.editable ? 'editable-cell' : ''}`}
            style={{ cursor: fieldPerm.editable ? 'pointer' : 'default' }}
            onClick={() => fieldPerm.editable && startEditing(guest.id, field, guest[field])}
            title={fieldPerm.editable ? 'Haz clic para editar' : 'Solo lectura'}
          >
            <span className="me-2">{isVisible ? guest[field] || '-' : '••••••••'}</span>
            {fieldPerm.editable && <CIcon icon={cilPencil} size="sm" className="text-muted edit-icon" />}
          </div>
          <CButton
            color="secondary"
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); togglePasswordVisibility(guest.id); }}
            title={isVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            <CIcon icon={isVisible ? cilLockUnlocked : cilLockLocked} />
          </CButton>
        </div>
      );
    }

    const displayValue = field === 'profile' ? getProfileLabel(guest[field]) : guest[field] || '-';

    // If editable (level 2), show edit icon on hover
    if (fieldPerm.editable) {
      return (
        <div
          className="d-flex align-items-center editable-cell"
          style={{ cursor: 'pointer' }}
          onClick={() => startEditing(guest.id, field, guest[field])}
          title="Haz clic para editar"
        >
          <span className="me-2">{displayValue}</span>
          <CIcon icon={cilPencil} size="sm" className="text-muted edit-icon" />
        </div>
      );
    }

    // Read only (level 1) - just show value
    return <span title="Solo lectura">{displayValue}</span>;
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

  // Access denied view (level 0)
  if (!guestPerms.list.visible) {
    return (
      <CContainer className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <CCard>
          <CCardBody className="text-center">
            <CIcon icon={cilBan} size="3xl" className="text-danger mb-3" />
            <h4>Acceso Denegado</h4>
            <p className="text-muted">No tienes permiso para ver esta página.</p>
          </CCardBody>
        </CCard>
      </CContainer>
    );
  }

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
          <strong>Lista de invitados</strong>
          <div>
            {/* New guest button - visible if permission level >= 1 */}
            {guestPerms.create.visible && (
              <CButton 
                color="primary" 
                className="app-button" 
                onClick={() => guestPerms.create.editable && setShowNewGuestModal(true)}
                disabled={!guestPerms.create.editable}
                style={!guestPerms.create.editable ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                title={!guestPerms.create.editable ? 'Solo lectura - No puedes crear invitados' : ''}
              >
                <CIcon icon={cilPlus} className="me-2" />
                Nuevo invitado
              </CButton>
            )}
          </div>
        </CCardHeader>
        <CCardBody>
          {/* Search and bulk actions */}
          <CRow className="mb-3">
            <CCol md={6}>
              <CInputGroup>
                <CInputGroupText>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>
                <CFormInput
                  placeholder="Buscar por nombre, correo o perfil..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </CInputGroup>
            </CCol>
            <CCol md={6} className="text-end">
              {/* Bulk delete - only if delete permission level 2 and items selected */}
              {selectedGuests.length > 0 && guestPerms.delete.editable && (
                <CButton color="danger" variant="outline" onClick={deleteSelectedGuests}>
                  <CIcon icon={cilTrash} className="me-2" />
                  Eliminar seleccionados ({selectedGuests.length})
                </CButton>
              )}
            </CCol>
          </CRow>

          {/* Guests table */}
          <div className="table-responsive">
            <CTable hover striped>
              <CTableHead>
                <CTableRow>
                  {/* Checkbox column - only if delete permission level >= 1 */}
                  {guestPerms.delete.visible && (
                    <CTableHeaderCell style={{ width: '50px' }}>
                      <CFormCheck
                        checked={selectAll}
                        onChange={handleSelectAll}
                        title={guestPerms.delete.editable ? 'Seleccionar todos' : 'Solo lectura'}
                        disabled={filteredAndSortedGuests.length === 0 || !guestPerms.delete.editable}
                      />
                    </CTableHeaderCell>
                  )}
                  <SortableHeader label="Usuario" sortKey="username" />
                  <SortableHeader label="Correo" sortKey="mail" />
                  {/* Password column - only if permission level >= 1 */}
                  {guestPerms.password.visible && <CTableHeaderCell>Contraseña</CTableHeaderCell>}
                  <SortableHeader label="Perfil" sortKey="profile" />
                  <SortableHeader label="Fecha de creación" sortKey="created_on" />
                  {/* Status column - only if edit permission level >= 1 */}
                  {guestPerms.edit.visible && <CTableHeaderCell>Estado</CTableHeaderCell>}
                  {/* Actions column - only if delete permission level >= 1 */}
                  {guestPerms.delete.visible && <CTableHeaderCell style={{ width: '80px' }}>Acciones</CTableHeaderCell>}
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {filteredAndSortedGuests.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={10} className="text-center py-4">
                      {searchTerm ? 'No se encontraron invitados' : 'No hay invitados registrados'}
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  filteredAndSortedGuests.map((guest) => (
                    <CTableRow key={guest.id}>
                      {/* Checkbox */}
                      {guestPerms.delete.visible && (
                        <CTableDataCell>
                          <CFormCheck
                            checked={selectedGuests.includes(guest.id)}
                            onChange={() => handleSelectGuest(guest.id)}
                            disabled={!guestPerms.delete.editable}
                          />
                        </CTableDataCell>
                      )}
                      
                      {/* Username */}
                      <CTableDataCell>
                        {renderEditableCell(guest, 'username')}
                      </CTableDataCell>
                      
                      {/* Email */}
                      <CTableDataCell>{renderEditableCell(guest, 'mail')}</CTableDataCell>
                      
                      {/* Password - only if permission level >= 1 */}
                      {guestPerms.password.visible && (
                        <CTableDataCell>{renderEditableCell(guest, 'password', 'password')}</CTableDataCell>
                      )}
                      
                      {/* Profile */}
                      <CTableDataCell>{renderEditableCell(guest, 'profile', 'select')}</CTableDataCell>
                      
                      {/* Created date */}
                      <CTableDataCell>{formatDate(guest.created_on)}</CTableDataCell>
                      
                      {/* Status toggle - only if edit permission level >= 1 */}
                      {guestPerms.edit.visible && (
                        <CTableDataCell>
                          <CButton
                            color={guest.enabled ? 'success' : 'secondary'}
                            variant="outline"
                            size="sm"
                            onClick={() => guestPerms.edit.editable && toggleGuestStatus(guest.id, guest.enabled)}
                            disabled={!guestPerms.edit.editable}
                            style={!guestPerms.edit.editable ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                            title={!guestPerms.edit.editable ? 'Solo lectura' : ''}
                          >
                            {guest.enabled ? 'Habilitado' : 'Deshabilitado'}
                          </CButton>
                        </CTableDataCell>
                      )}
                      
                      {/* Delete button - only if delete permission level >= 1 */}
                      {guestPerms.delete.visible && (
                        <CTableDataCell>
                          <CButton
                            color="danger"
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmDeleteGuest(guest)}
                            disabled={!guestPerms.delete.editable}
                            style={!guestPerms.delete.editable ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                            title={!guestPerms.delete.editable ? 'Solo lectura' : ''}
                          >
                            <CIcon icon={cilTrash} />
                          </CButton>
                        </CTableDataCell>
                      )}
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          </div>

          <div className="text-muted small mt-2">
            Mostrando {filteredAndSortedGuests.length} de {guests.length} invitados
          </div>
        </CCardBody>
      </CCard>

      {/* Delete Confirmation Modal */}
      <CModal visible={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <CModalHeader><CModalTitle>Confirmar eliminación</CModalTitle></CModalHeader>
        <CModalBody>
          ¿Está seguro de que desea eliminar al invitado <strong>{guestToDelete?.username}</strong>?
          Esta acción no se puede deshacer.
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</CButton>
          <CButton color="danger" onClick={deleteGuest}>Eliminar</CButton>
        </CModalFooter>
      </CModal>

      {/* New Guest Modal */}
      <CModal visible={showNewGuestModal} onClose={() => { setShowNewGuestModal(false); resetNewGuestForm(); }}>
        <CModalHeader><CModalTitle>Nuevo invitado</CModalTitle></CModalHeader>
        <CModalBody>
          <div className="mb-3">
            <label className="form-label">Usuario *</label>
            <CFormInput
              name="username"
              value={newGuest.username}
              onChange={handleNewGuestChange}
              onBlur={handleNewGuestBlur}
              placeholder="Nombre de usuario"
              invalid={newGuestTouched.username && !!newGuestErrors.username}
            />
            {newGuestTouched.username && newGuestErrors.username && (
              <CFormFeedback invalid style={{ display: 'block' }}>{newGuestErrors.username}</CFormFeedback>
            )}
          </div>
          <div className="mb-3">
            <label className="form-label">Correo electrónico *</label>
            <CFormInput
              type="email"
              name="email"
              value={newGuest.email}
              onChange={handleNewGuestChange}
              onBlur={handleNewGuestBlur}
              placeholder="correo@ejemplo.com"
              invalid={newGuestTouched.email && !!newGuestErrors.email}
            />
            {newGuestTouched.email && newGuestErrors.email && (
              <CFormFeedback invalid style={{ display: 'block' }}>{newGuestErrors.email}</CFormFeedback>
            )}
          </div>
          <div className="mb-3">
            <label className="form-label">Contraseña *</label>
            <CFormInput
              type="password"
              name="password"
              value={newGuest.password}
              onChange={handleNewGuestChange}
              onBlur={handleNewGuestBlur}
              placeholder="Contraseña"
              invalid={newGuestTouched.password && !!newGuestErrors.password}
            />
            {newGuestTouched.password && newGuestErrors.password && (
              <CFormFeedback invalid style={{ display: 'block' }}>{newGuestErrors.password}</CFormFeedback>
            )}
            <small className="text-muted">Mínimo 6 caracteres, mayúscula, minúscula y número</small>
          </div>
          <div className="mb-3">
            <label className="form-label">Perfil *</label>
            <CFormSelect
              name="profile"
              value={newGuest.profile}
              onChange={handleNewGuestChange}
              onBlur={handleNewGuestBlur}
              invalid={newGuestTouched.profile && !!newGuestErrors.profile}
            >
              {profileOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </CFormSelect>
            {newGuestTouched.profile && newGuestErrors.profile && (
              <CFormFeedback invalid style={{ display: 'block' }}>{newGuestErrors.profile}</CFormFeedback>
            )}
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => { setShowNewGuestModal(false); resetNewGuestForm(); }}>Cancelar</CButton>
          <CButton color="primary" className="app-button" onClick={createGuest}>Crear invitado</CButton>
        </CModalFooter>
      </CModal>

      <style>{`
        .editable-cell .edit-icon { opacity: 0; transition: opacity 0.2s; }
        .editable-cell:hover .edit-icon { opacity: 1; }
      `}</style>
    </CContainer>
  );
};

export default Guests;