// src/views/pages/users/Users.js
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
  cilPeople,
  cilLockLocked,
  cilLockUnlocked,
  cilBan,
} from '@coreui/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../../../context/AuthContext';
import usePermissions from '../../../hooks/usePermissions';
import api from '../../../services/api';

/**
 * Permission Levels:
 * 0 = Hidden (not visible)
 * 1 = Visible but not editable (read-only)
 * 2 = Visible and editable (full access)
 * 
 * User permissions:
 * access_8  = LIST_USERS - view user list
 * access_9  = CREATE_USER - create new users
 * access_10 = EDIT_USER - edit username, email, status
 * access_11 = USER_PASSWORD - view/edit passwords
 * access_12 = USER_PERMISSIONS - view/edit user roles
 * access_13 = DELETE_USER - delete users
 */

const Users = () => {
  const navigate = useNavigate();
  
  // Get current user and permissions
  const { user: currentUser } = useUser();
  const { users: userPerms } = usePermissions();

  // Data state
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selection state
  const [selectedUsers, setSelectedUsers] = useState([]);
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
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // New user form state
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    profile: 'recluta',
  });

  // New user form errors
  const [newUserErrors, setNewUserErrors] = useState({});
  const [newUserTouched, setNewUserTouched] = useState({});

  // Alert state
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  // Profile options
  const profileOptions = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'admin_junior', label: 'Admin Jr' },
    { value: 'coordinador', label: 'Coordinador' },
    { value: 'operador', label: 'Operador' },
    { value: 'recluta', label: 'Recluta' },
  ];

  // Redirect if no view permission (level 0)
  useEffect(() => {
    if (!userPerms.list.visible) {
      navigate('/dashboard');
    }
  }, [userPerms.list.visible, navigate]);

  // Fetch users on mount
  useEffect(() => {
    if (userPerms.list.visible) {
      fetchUsers();
    }
  }, [userPerms.list.visible]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/users', { withCredentials: true });
      setUsers(res.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Error al cargar los usuarios');
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Ingresa una dirección de correo electrónico válida';
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

  const validateNewUserField = (name, value) => {
    switch (name) {
      case 'username': return validateUsername(value);
      case 'email': return validateEmail(value);
      case 'password': return validatePassword(value);
      default: return '';
    }
  };

  const validateNewUserForm = () => {
    const errors = {};
    errors.username = validateUsername(newUser.username);
    errors.email = validateEmail(newUser.email);
    errors.password = validatePassword(newUser.password);
    Object.keys(errors).forEach((key) => { if (!errors[key]) delete errors[key]; });
    setNewUserErrors(errors);
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

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((user) =>
        user.username?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.profile?.toLowerCase().includes(term)
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
  }, [users, searchTerm, sortConfig]);

  // Get selectable users (exclude current user)
  const selectableUsers = useMemo(() => {
    return filteredAndSortedUsers.filter((user) => user.id !== currentUser?.id);
  }, [filteredAndSortedUsers, currentUser]);

  // Selection handlers
  const handleSelectAll = () => {
    // Only allow if has delete permission level 2
    if (!userPerms.delete.editable) return;
    
    if (selectAll) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(selectableUsers.map((user) => user.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectUser = (userId) => {
    // Only allow if has delete permission level 2
    if (!userPerms.delete.editable) return;
    if (userId === currentUser?.id) return;
    
    setSelectedUsers((prev) => {
      if (prev.includes(userId)) return prev.filter((id) => id !== userId);
      return [...prev, userId];
    });
  };

  useEffect(() => {
    setSelectAll(selectableUsers.length > 0 && selectedUsers.length === selectableUsers.length);
  }, [selectedUsers, selectableUsers]);

  // Inline edit handlers
  const startEditing = (userId, field, currentValue) => {
    // Check permission for the specific field
    if (field === 'password' && !userPerms.password.editable) return;
    if (field === 'profile' && !userPerms.permissions.editable) return;
    if ((field === 'username' || field === 'email' || field === 'enabled') && !userPerms.edit.editable) return;
    
    setEditingCell({ id: userId, field });
    setEditValue(currentValue || '');
  };

  const cancelEditing = () => {
    setEditingCell({ id: null, field: null });
    setEditValue('');
  };

  const saveEdit = async (userId, field) => {
    if (field === 'password') {
      const error = validatePassword(editValue);
      if (error) {
        showNotification('danger', error);
        return;
      }
    }
    if (field === 'email') {
      const error = validateEmail(editValue);
      if (error) {
        showNotification('danger', error);
        return;
      }
    }

    try {
      const updateData = { [field]: editValue };
      await api.put(`/api/users/${userId}`, updateData, { withCredentials: true });
      setUsers((prev) => prev.map((user) => user.id === userId ? { ...user, [field]: editValue } : user));
      showNotification('success', 'Usuario actualizado correctamente');
      cancelEditing();
    } catch (err) {
      console.error('Error updating user:', err);
      const message = err.response?.data?.message || 'Error al actualizar el usuario';
      showNotification('danger', message);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (userId) => {
    // Only allow if has password permission level >= 1
    if (!userPerms.password.visible) return;
    setVisiblePasswords((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  // Toggle user status
  const toggleUserStatus = async (userId, currentStatus) => {
    // Only allow if has edit permission level 2
    if (!userPerms.edit.editable) return;
    
    try {
      const newStatus = currentStatus ? 0 : 1;
      await api.put(`/api/users/${userId}`, { enabled: newStatus }, { withCredentials: true });
      setUsers((prev) => prev.map((user) => user.id === userId ? { ...user, enabled: newStatus } : user));
      showNotification('success', `Usuario ${newStatus ? 'habilitado' : 'deshabilitado'}`);
    } catch (err) {
      console.error('Error toggling user status:', err);
      showNotification('danger', 'Error al cambiar el estado del usuario');
    }
  };

  // Delete handlers
  const confirmDeleteUser = (user) => {
    // Only allow if has delete permission level 2
    if (!userPerms.delete.editable) return;
    if (user.id === currentUser?.id) return;
    
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const deleteUser = async () => {
    if (!userToDelete || !userPerms.delete.editable) return;
    
    try {
      await api.delete(`/api/users/${userToDelete.id}`, { withCredentials: true });
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setSelectedUsers((prev) => prev.filter((id) => id !== userToDelete.id));
      showNotification('success', 'Usuario eliminado correctamente');
    } catch (err) {
      console.error('Error deleting user:', err);
      showNotification('danger', 'Error al eliminar el usuario');
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const deleteSelectedUsers = async () => {
    if (selectedUsers.length === 0 || !userPerms.delete.editable) return;
    
    const idsToDelete = selectedUsers.filter((id) => id !== currentUser?.id);
    if (idsToDelete.length === 0) {
      showNotification('warning', 'No hay usuarios seleccionados para eliminar');
      return;
    }
    
    try {
      await api.post('/api/users/bulk-delete', { ids: idsToDelete }, { withCredentials: true });
      setUsers((prev) => prev.filter((u) => !idsToDelete.includes(u.id)));
      setSelectedUsers([]);
      showNotification('success', `${idsToDelete.length} usuario(s) eliminado(s)`);
    } catch (err) {
      console.error('Error deleting users:', err);
      showNotification('danger', 'Error al eliminar los usuarios');
    }
  };

  // New user handlers
  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
    if (newUserTouched[name]) {
      const error = validateNewUserField(name, value);
      setNewUserErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleNewUserBlur = (e) => {
    const { name, value } = e.target;
    setNewUserTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateNewUserField(name, value);
    setNewUserErrors((prev) => ({ ...prev, [name]: error }));
  };

  const resetNewUserForm = () => {
    setNewUser({ username: '', email: '', password: '', profile: 'recluta' });
    setNewUserErrors({});
    setNewUserTouched({});
  };

  const createUser = async () => {
    // Only allow if has create permission level 2
    if (!userPerms.create.editable) return;
    
    setNewUserTouched({ username: true, email: true, password: true });
    if (!validateNewUserForm()) {
      showNotification('danger', 'Por favor corrija los errores antes de continuar');
      return;
    }
    
    try {
      const res = await api.post('/api/users', newUser, { withCredentials: true });
      setUsers((prev) => [...prev, res.data]);
      setShowNewUserModal(false);
      resetNewUserForm();
      showNotification('success', 'Usuario creado correctamente');
    } catch (err) {
      console.error('Error creating user:', err);
      const message = err.response?.data?.message || 'Error al crear el usuario';
      showNotification('danger', message);
    }
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

  // Get profile label
  const getProfileLabel = (value) => {
    const option = profileOptions.find((opt) => opt.value === value);
    return option ? option.label : value;
  };

  const isCurrentUser = (userId) => userId === currentUser?.id;

  /**
   * Render editable cell based on permission level
   * 0 = hidden (return null)
   * 1 = visible but not editable (show value, no edit icon)
   * 2 = visible and editable (show value with edit icon)
   */
  const renderEditableCell = (user, field, type = 'text') => {
    // Determine which permission applies to this field
    let fieldPerm;
    if (field === 'password') fieldPerm = userPerms.password;
    else if (field === 'profile') fieldPerm = userPerms.permissions;
    else fieldPerm = userPerms.edit;

    // If not visible (level 0), don't show at all
    if (!fieldPerm.visible) {
      return <span className="text-muted">-</span>;
    }

    const isEditing = editingCell.id === user.id && editingCell.field === field;

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
                if (e.key === 'Enter') saveEdit(user.id, field);
                if (e.key === 'Escape') cancelEditing();
              }}
              autoFocus
            />
          )}
          <CButton color="success" variant="outline" size="sm" onClick={() => saveEdit(user.id, field)}>
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
      const isVisible = visiblePasswords[user.id];
      return (
        <div className="d-flex align-items-center">
          <div
            className={`d-flex align-items-center justify-content-between flex-grow-1 ${fieldPerm.editable ? 'editable-cell' : ''}`}
            style={{ cursor: fieldPerm.editable ? 'pointer' : 'default' }}
            onClick={() => fieldPerm.editable && startEditing(user.id, field, user[field])}
            title={fieldPerm.editable ? 'Haz clic para editar' : 'Solo lectura'}
          >
            <span className="me-2">{isVisible ? user[field] || '-' : '••••••••'}</span>
            {fieldPerm.editable && <CIcon icon={cilPencil} size="sm" className="text-muted edit-icon" />}
          </div>
          <CButton
            color="secondary"
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); togglePasswordVisibility(user.id); }}
            title={isVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            <CIcon icon={isVisible ? cilLockUnlocked : cilLockLocked} />
          </CButton>
        </div>
      );
    }

    const displayValue = field === 'profile' ? getProfileLabel(user[field]) : user[field] || '-';

    // If editable (level 2), show edit icon on hover
    if (fieldPerm.editable) {
      return (
        <div
          className="d-flex align-items-center editable-cell"
          style={{ cursor: 'pointer' }}
          onClick={() => startEditing(user.id, field, user[field])}
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
  if (!userPerms.list.visible) {
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
          <strong>Lista de usuarios</strong>
          <div>
            {/* Roles button - visible if permission level >= 1 */}
            {userPerms.permissions.visible && (
              <CButton 
                href="/progestor/users/roles" 
                color="primary" 
                className="app-button mx-2"
                disabled={!userPerms.permissions.editable}
                style={!userPerms.permissions.editable ? { opacity: 0.6 } : {}}
                title={!userPerms.permissions.editable ? 'Solo lectura' : ''}
              >
                <CIcon icon={cilLockUnlocked} className="me-2" />
                Roles
              </CButton>
            )}
            
            {/* New user button - visible if permission level >= 1 */}
            {userPerms.create.visible && (
              <CButton 
                color="primary" 
                className="app-button" 
                onClick={() => userPerms.create.editable && setShowNewUserModal(true)}
                disabled={!userPerms.create.editable}
                style={!userPerms.create.editable ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                title={!userPerms.create.editable ? 'Solo lectura - No puedes crear usuarios' : ''}
              >
                <CIcon icon={cilPlus} className="me-2" />
                Nuevo usuario
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
              {selectedUsers.length > 0 && userPerms.delete.editable && (
                <CButton color="danger" variant="outline" onClick={deleteSelectedUsers}>
                  <CIcon icon={cilTrash} className="me-2" />
                  Eliminar seleccionados ({selectedUsers.length})
                </CButton>
              )}
            </CCol>
          </CRow>

          {/* Users table */}
          <div className="table-responsive">
            <CTable hover striped>
              <CTableHead>
                <CTableRow>
                  {/* Checkbox column - only if delete permission level >= 1 */}
                  {userPerms.delete.visible && (
                    <CTableHeaderCell style={{ width: '50px' }}>
                      <CFormCheck
                        checked={selectAll}
                        onChange={handleSelectAll}
                        title={userPerms.delete.editable ? 'Seleccionar todos' : 'Solo lectura'}
                        disabled={selectableUsers.length === 0 || !userPerms.delete.editable}
                      />
                    </CTableHeaderCell>
                  )}
                  <SortableHeader label="Usuario" sortKey="username" />
                  <SortableHeader label="Correo" sortKey="email" />
                  {/* Password column - only if permission level >= 1 */}
                  {userPerms.password.visible && <CTableHeaderCell>Contraseña</CTableHeaderCell>}
                  <SortableHeader label="Perfil" sortKey="profile" />
                  <SortableHeader label="Fecha de creación" sortKey="created_on" />
                  {/* Status column - only if edit permission level >= 1 */}
                  {userPerms.edit.visible && <CTableHeaderCell>Estado</CTableHeaderCell>}
                  {/* Roles column - only if permissions permission level >= 1 */}
                  {userPerms.permissions.visible && <CTableHeaderCell>Roles</CTableHeaderCell>}
                  {/* Actions column - only if delete permission level >= 1 */}
                  {userPerms.delete.visible && <CTableHeaderCell style={{ width: '80px' }}>Acciones</CTableHeaderCell>}
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {filteredAndSortedUsers.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={10} className="text-center py-4">
                      {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  filteredAndSortedUsers.map((user) => {
                    const isCurrent = isCurrentUser(user.id);
                    return (
                      <CTableRow key={user.id} style={isCurrent ? { opacity: 0.6 } : {}}>
                        {/* Checkbox */}
                        {userPerms.delete.visible && (
                          <CTableDataCell>
                            {isCurrent ? (
                              <CTooltip content="No puedes seleccionar tu propia cuenta" placement="top">
                                <span><CFormCheck checked={false} disabled /></span>
                              </CTooltip>
                            ) : (
                              <CFormCheck
                                checked={selectedUsers.includes(user.id)}
                                onChange={() => handleSelectUser(user.id)}
                                disabled={!userPerms.delete.editable}
                              />
                            )}
                          </CTableDataCell>
                        )}
                        
                        {/* Username */}
                        <CTableDataCell>
                          {renderEditableCell(user, 'username')}
                          {isCurrent && <small className="text-muted d-block">(Tu cuenta)</small>}
                        </CTableDataCell>
                        
                        {/* Email */}
                        <CTableDataCell>{renderEditableCell(user, 'email')}</CTableDataCell>
                        
                        {/* Password - only if permission level >= 1 */}
                        {userPerms.password.visible && (
                          <CTableDataCell>{renderEditableCell(user, 'password', 'password')}</CTableDataCell>
                        )}
                        
                        {/* Profile */}
                        <CTableDataCell>{renderEditableCell(user, 'profile', 'select')}</CTableDataCell>
                        
                        {/* Created date */}
                        <CTableDataCell>{formatDate(user.created_on)}</CTableDataCell>
                        
                        {/* Status toggle - only if edit permission level >= 1 */}
                        {userPerms.edit.visible && (
                          <CTableDataCell>
                            <CButton
                              color={user.enabled ? 'success' : 'secondary'}
                              variant="outline"
                              size="sm"
                              onClick={() => userPerms.edit.editable && toggleUserStatus(user.id, user.enabled)}
                              disabled={!userPerms.edit.editable}
                              style={!userPerms.edit.editable ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                              title={!userPerms.edit.editable ? 'Solo lectura' : ''}
                            >
                              {user.enabled ? 'Habilitado' : 'Deshabilitado'}
                            </CButton>
                          </CTableDataCell>
                        )}
                        
                        {/* Roles link - only if permissions permission level >= 1 */}
                        {userPerms.permissions.visible && (
                          <CTableDataCell>
                            <Link to={`/progestor/users/${user.id}/roles`}>
                              <CButton color="info" variant="outline" size="sm">
                                <CIcon icon={cilPeople} className="me-1" />
                                Ver roles
                              </CButton>
                            </Link>
                          </CTableDataCell>
                        )}
                        
                        {/* Delete button - only if delete permission level >= 1 */}
                        {userPerms.delete.visible && (
                          <CTableDataCell>
                            {isCurrent ? (
                              <CTooltip content="No puedes eliminar tu propia cuenta" placement="top">
                                <span>
                                  <CButton color="danger" variant="ghost" size="sm" disabled>
                                    <CIcon icon={cilTrash} />
                                  </CButton>
                                </span>
                              </CTooltip>
                            ) : (
                              <CButton
                                color="danger"
                                variant="ghost"
                                size="sm"
                                onClick={() => confirmDeleteUser(user)}
                                disabled={!userPerms.delete.editable}
                                style={!userPerms.delete.editable ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                                title={!userPerms.delete.editable ? 'Solo lectura' : ''}
                              >
                                <CIcon icon={cilTrash} />
                              </CButton>
                            )}
                          </CTableDataCell>
                        )}
                      </CTableRow>
                    );
                  })
                )}
              </CTableBody>
            </CTable>
          </div>

          <div className="text-muted small mt-2">
            Mostrando {filteredAndSortedUsers.length} de {users.length} usuarios
          </div>
        </CCardBody>
      </CCard>

      {/* Delete Confirmation Modal */}
      <CModal visible={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <CModalHeader><CModalTitle>Confirmar eliminación</CModalTitle></CModalHeader>
        <CModalBody>
          ¿Está seguro de que desea eliminar al usuario <strong>{userToDelete?.username}</strong>?
          Esta acción no se puede deshacer.
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</CButton>
          <CButton color="danger" onClick={deleteUser}>Eliminar</CButton>
        </CModalFooter>
      </CModal>

      {/* New User Modal */}
      <CModal visible={showNewUserModal} onClose={() => { setShowNewUserModal(false); resetNewUserForm(); }}>
        <CModalHeader><CModalTitle>Nuevo usuario</CModalTitle></CModalHeader>
        <CModalBody>
          <div className="mb-3">
            <label className="form-label">Usuario *</label>
            <CFormInput
              name="username"
              value={newUser.username}
              onChange={handleNewUserChange}
              onBlur={handleNewUserBlur}
              placeholder="Nombre de usuario"
              invalid={newUserTouched.username && !!newUserErrors.username}
            />
            {newUserTouched.username && newUserErrors.username && (
              <CFormFeedback invalid style={{ display: 'block' }}>{newUserErrors.username}</CFormFeedback>
            )}
          </div>
          <div className="mb-3">
            <label className="form-label">Correo electrónico *</label>
            <CFormInput
              type="email"
              name="email"
              value={newUser.email}
              onChange={handleNewUserChange}
              onBlur={handleNewUserBlur}
              placeholder="correo@ejemplo.com"
              invalid={newUserTouched.email && !!newUserErrors.email}
            />
            {newUserTouched.email && newUserErrors.email && (
              <CFormFeedback invalid style={{ display: 'block' }}>{newUserErrors.email}</CFormFeedback>
            )}
          </div>
          <div className="mb-3">
            <label className="form-label">Contraseña *</label>
            <CFormInput
              type="password"
              name="password"
              value={newUser.password}
              onChange={handleNewUserChange}
              onBlur={handleNewUserBlur}
              placeholder="Contraseña"
              invalid={newUserTouched.password && !!newUserErrors.password}
            />
            {newUserTouched.password && newUserErrors.password && (
              <CFormFeedback invalid style={{ display: 'block' }}>{newUserErrors.password}</CFormFeedback>
            )}
            <small className="text-muted">Mínimo 6 caracteres, mayúscula, minúscula y número</small>
          </div>
          <div className="mb-3">
            <label className="form-label">Perfil</label>
            <CFormSelect name="profile" value={newUser.profile} onChange={handleNewUserChange}>
              {profileOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </CFormSelect>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => { setShowNewUserModal(false); resetNewUserForm(); }}>Cancelar</CButton>
          <CButton color="primary" className="app-button" onClick={createUser}>Crear usuario</CButton>
        </CModalFooter>
      </CModal>

      <style>{`
        .editable-cell .edit-icon { opacity: 0; transition: opacity 0.2s; }
        .editable-cell:hover .edit-icon { opacity: 1; }
      `}</style>
    </CContainer>
  );
};

export default Users;