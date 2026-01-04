import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CRow,
  CButton,
  CSpinner,
  CAlert,
  CFormSelect,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
  CInputGroup,
  CInputGroupText,
  CFormInput,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilArrowLeft,
  cilSave,
  cilSearch,
  cilLockLocked,
  cilLockUnlocked,
  cilPencil,
} from '@coreui/icons';
import api from '../../../services/api';

// Access names mapping
const accessNames = [
  { key: 'access_1', name: 'Listado de Nota de Atención', category: 'Progestor' },
  { key: 'access_2', name: 'Abrir de Nota de Atención', category: 'Progestor' },
  { key: 'access_3', name: 'Listado de Nota Pendiente', category: 'Progestor' },
  { key: 'access_4', name: 'Abrir Nota Pendiente', category: 'Progestor' },
  { key: 'access_5', name: 'Listado de Pagos', category: 'Progestor' },
  { key: 'access_6', name: 'Registro de Pagos', category: 'Progestor' },
  { key: 'access_7', name: 'Editar/Alterar Pagos Registrados', category: 'Progestor' },
  { key: 'access_8', name: 'Listado de Usuarios', category: 'Progestor' },
  { key: 'access_9', name: 'Crear usuario', category: 'Progestor' },
  { key: 'access_10', name: 'Editar usuario', category: 'Progestor' },
  { key: 'access_11', name: 'Contraseña de Usuario', category: 'Progestor' },
  { key: 'access_12', name: 'Permisos de Usuario', category: 'Progestor' },
  { key: 'access_13', name: 'Borrar Usuario', category: 'Progestor' },
  { key: 'access_14', name: 'Listado de Guests', category: 'Progestor' },
  { key: 'access_15', name: 'Crear Guests', category: 'Progestor' },
  { key: 'access_16', name: 'Editar Guests', category: 'Progestor' },
  { key: 'access_17', name: 'Contraseña de Guests', category: 'Progestor' },
  { key: 'access_18', name: 'Permisos de Guests', category: 'Progestor' },
  { key: 'access_19', name: 'Borrar Guests', category: 'Progestor' },
  { key: 'access_20', name: 'Generación de reportes y facturas', category: 'Progestor' },
  { key: 'access_21', name: 'Generar reporte médico', category: 'Progestor' },
  { key: 'access_22', name: 'Generar Itinerario', category: 'Progestor' },
  { key: 'access_23', name: 'Generar factura (Travel Medical Care)', category: 'Progestor' },
  { key: 'access_24', name: 'Generar factura (Nexa Travel)', category: 'Progestor' },
  { key: 'access_25', name: 'Generar factura (Babymedic)', category: 'Progestor' },
  { key: 'access_26', name: 'Dash Boards', category: 'Progestor' },
  { key: 'access_27', name: 'Listado Sort_GES', category: 'Babysite' },
  { key: 'access_28', name: 'Alta Sort_GES', category: 'Babysite' },
  { key: 'access_29', name: 'Documentación (Sort_GES)', category: 'Babysite' },
  { key: 'access_30', name: 'Alterar Documentación (Sort_GES)', category: 'Babysite' },
  { key: 'access_31', name: 'Start Programa', category: 'Babysite' },
  { key: 'access_32', name: 'Alta Seguro', category: 'Babysite' },
  { key: 'access_33', name: 'Listado Sort_IP', category: 'Babysite' },
  { key: 'access_34', name: 'Alta Sort_IP', category: 'Babysite' },
  { key: 'access_35', name: 'Editar Sort_IP', category: 'Babysite' },
  { key: 'access_36', name: 'Documentación (Sort_IP)', category: 'Babysite' },
  { key: 'access_37', name: 'Alterar/Borrar Documentación (Sort_IP)', category: 'Babysite' },
  { key: 'access_38', name: 'Start Crio Embrio', category: 'Babysite' },
  { key: 'access_39', name: 'Actualizar Seguimiento', category: 'Babysite' },
  { key: 'access_40', name: 'Programas', category: 'Babysite' },
  { key: 'access_41', name: 'Crioembrio', category: 'Babysite' },
  { key: 'access_42', name: 'Asignar/Editar Donante', category: 'Babysite' },
  { key: 'access_43', name: 'Editar Material Genético', category: 'Babysite' },
  { key: 'access_44', name: 'Seleccionar Material Genético', category: 'Babysite' },
  { key: 'access_45', name: 'Asignar/Editar Gestante', category: 'Babysite' },
  { key: 'access_46', name: 'Iniciales', category: 'Babysite' },
  { key: 'access_47', name: 'Perfil Psicológico', category: 'Babysite' },
  { key: 'access_48', name: 'Agregar Sesión Psicológica', category: 'Babysite' },
  { key: 'access_49', name: 'Alterar datos Sesión Psicológica', category: 'Babysite' },
  { key: 'access_50', name: 'Socio Económico', category: 'Babysite' },
  { key: 'access_51', name: 'Agregar Visita ESE', category: 'Babysite' },
  { key: 'access_52', name: 'Alterar Datos ESE', category: 'Babysite' },
  { key: 'access_53', name: 'Alta Citas', category: 'Babysite' },
  { key: 'access_54', name: 'Agregar Tratamientos', category: 'Babysite' },
  { key: 'access_55', name: 'Enviar a Pizarrón', category: 'Babysite' },
  { key: 'access_56', name: 'Pizarrón', category: 'Babysite' },
  { key: 'access_57', name: 'Agregar ACO', category: 'Babysite' },
  { key: 'access_58', name: 'Detener ACO', category: 'Babysite' },
  { key: 'access_59', name: 'Comenzar Preparación', category: 'Babysite' },
  { key: 'access_60', name: 'Detener Preparación', category: 'Babysite' },
  { key: 'access_61', name: 'Enviar a Transfer', category: 'Babysite' },
  { key: 'access_62', name: 'Registrar Beta', category: 'Babysite' },
  { key: 'access_63', name: 'Registrar Saco Gestacional', category: 'Babysite' },
  { key: 'access_64', name: 'Registrar Latido', category: 'Babysite' },
  { key: 'access_65', name: 'Confirmar GESTA', category: 'Babysite' },
  { key: 'access_66', name: 'Comenzar SDG GESTA', category: 'Babysite' },
  { key: 'access_67', name: 'Agenda de Seguro', category: 'Babysite' },
  { key: 'access_68', name: 'Listado Egg Donor', category: 'Babysite' },
  { key: 'access_69', name: 'Dash Boards (Egg Donor)', category: 'Babysite' },
  { key: 'access_70', name: 'Inicio', category: 'Recluta' },
  { key: 'access_71', name: 'Agregar etapa', category: 'Babycloud' },
  { key: 'access_72', name: 'Modificar estado', category: 'Babycloud' },
  { key: 'access_73', name: 'Modificar underway', category: 'Babycloud' },
  { key: 'access_74', name: 'Modificar info 1', category: 'Babycloud' },
  { key: 'access_75', name: 'Modificar info 2', category: 'Babycloud' },
  { key: 'access_76', name: 'Subir archivo 1', category: 'Babycloud' },
  { key: 'access_77', name: 'Subir archivo 2', category: 'Babycloud' },
  { key: 'access_78', name: 'Subir archivo 3', category: 'Babycloud' },
  { key: 'access_79', name: 'Habilitar 1', category: 'Babycloud' },
  { key: 'access_80', name: 'Habilitar 2', category: 'Babycloud' },
  { key: 'access_81', name: 'Habilitar 3', category: 'Babycloud' },
  { key: 'access_82', name: 'Habilitar vista de la etapa', category: 'Babycloud' },
];

// Permission options
const permissionOptions = [
  { value: 0, label: 'Sin acceso', color: 'danger', icon: cilLockLocked },
  { value: 1, label: 'Solo ver', color: 'warning', icon: cilLockUnlocked },
  { value: 2, label: 'Ver y editar', color: 'success', icon: cilPencil },
];

// Get unique categories
const categories = [...new Set(accessNames.map((a) => a.category))];

const Roles = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [originalPermissions, setOriginalPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Fetch user and permissions on mount
  useEffect(() => {
    fetchUserRoles();
  }, [id]);

  const fetchUserRoles = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/users/${id}/roles`, { withCredentials: true });
      
      setUser(res.data.user);
      
      // Initialize permissions from response
      const perms = {};
      accessNames.forEach((access) => {
        perms[access.key] = res.data.permissions[access.key] ?? 0;
      });
      
      setPermissions(perms);
      setOriginalPermissions(perms);
    } catch (err) {
      console.error('Error fetching user roles:', err);
      showNotification('danger', 'Error al cargar los permisos del usuario');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

  const handlePermissionChange = (key, value) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: parseInt(value, 10),
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put(`/api/users/${id}/roles`, { permissions }, { withCredentials: true });
      setOriginalPermissions(permissions);
      showNotification('success', 'Permisos actualizados correctamente');
    } catch (err) {
      console.error('Error saving permissions:', err);
      showNotification('danger', 'Error al guardar los permisos');
    } finally {
      setSaving(false);
    }
  };

  const handleSetAll = (value) => {
    const newPerms = {};
    accessNames.forEach((access) => {
      newPerms[access.key] = value;
    });
    setPermissions(newPerms);
  };

  const handleSetCategoryAll = (category, value) => {
    setPermissions((prev) => {
      const newPerms = { ...prev };
      accessNames
        .filter((access) => access.category === category)
        .forEach((access) => {
          newPerms[access.key] = value;
        });
      return newPerms;
    });
  };

  const hasChanges = () => {
    return JSON.stringify(permissions) !== JSON.stringify(originalPermissions);
  };

  // Filter access names by search and category
  const filteredAccess = accessNames.filter((access) => {
    const matchesSearch = access.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || access.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group filtered access by category
  const groupedAccess = filteredAccess.reduce((acc, access) => {
    if (!acc[access.category]) {
      acc[access.category] = [];
    }
    acc[access.category].push(access);
    return acc;
  }, {});

  const getPermissionBadge = (value) => {
    const option = permissionOptions.find((opt) => opt.value === value);
    return (
      <CBadge color={option?.color || 'secondary'}>
        <CIcon icon={option?.icon} size="sm" className="me-1" />
        {option?.label || 'Desconocido'}
      </CBadge>
    );
  };

  if (loading) {
    return (
      <CContainer className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <CSpinner color="primary" />
      </CContainer>
    );
  }

  return (
    <CContainer lg>
      {alert.show && (
        <CAlert color={alert.type} dismissible onClose={() => setAlert({ show: false })}>
          {alert.message}
        </CAlert>
      )}

      <CCard className="mb-4">
        <CCardHeader>
          <CRow className="align-items-center">
            <CCol>
              <div className="d-flex align-items-center">
                <CButton
                  color="secondary"
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/progestor/users')}
                  className="me-3"
                >
                  <CIcon icon={cilArrowLeft} />
                </CButton>
                <div>
                  <strong>Permisos de usuario</strong>
                  {user && (
                    <div className="small text-muted">
                      {user.username} ({user.email})
                    </div>
                  )}
                </div>
              </div>
            </CCol>
            <CCol xs="auto">
              <CButton
                color="primary"
                className="app-button"
                onClick={handleSave}
                disabled={saving || !hasChanges()}
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
        </CCardHeader>
        <CCardBody>
          {/* Filters and bulk actions */}
          <CRow className="mb-4">
            <CCol md={4}>
              <CInputGroup>
                <CInputGroupText>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>
                <CFormInput
                  placeholder="Buscar permiso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </CInputGroup>
            </CCol>
            <CCol md={3}>
              <CFormSelect
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">Todas las categorías</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={5} className="text-end">
              <span className="me-2 text-muted small">Aplicar a todos:</span>
              <CButton
                color="danger"
                variant="outline"
                size="sm"
                className="me-1"
                onClick={() => handleSetAll(0)}
              >
                Sin acceso
              </CButton>
              <CButton
                color="warning"
                variant="outline"
                size="sm"
                className="me-1"
                onClick={() => handleSetAll(1)}
              >
                Solo ver
              </CButton>
              <CButton
                color="success"
                variant="outline"
                size="sm"
                onClick={() => handleSetAll(2)}
              >
                Ver y editar
              </CButton>
            </CCol>
          </CRow>

          {/* Permissions by category */}
          {Object.entries(groupedAccess).map(([category, accesses]) => (
            <CCard key={category} className="mb-3">
              <CCardHeader className="py-2">
                <CRow className="align-items-center">
                  <CCol>
                    <strong>{category}</strong>
                    <span className="text-muted ms-2 small">({accesses.length} permisos)</span>
                  </CCol>
                  <CCol xs="auto">
                    <span className="me-2 text-muted small">Aplicar:</span>
                    <CButton
                      color="danger"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetCategoryAll(category, 0)}
                      title="Sin acceso"
                    >
                      <CIcon icon={cilLockLocked} />
                    </CButton>
                    <CButton
                      color="warning"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetCategoryAll(category, 1)}
                      title="Solo ver"
                    >
                      <CIcon icon={cilLockUnlocked} />
                    </CButton>
                    <CButton
                      color="success"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetCategoryAll(category, 2)}
                      title="Ver y editar"
                    >
                      <CIcon icon={cilPencil} />
                    </CButton>
                  </CCol>
                </CRow>
              </CCardHeader>
              <CCardBody className="p-0">
                <CTable hover striped className="mb-0">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell style={{ width: '50%' }}>Permiso</CTableHeaderCell>
                      <CTableHeaderCell style={{ width: '25%' }}>Estado actual</CTableHeaderCell>
                      <CTableHeaderCell style={{ width: '25%' }}>Cambiar a</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {accesses.map((access) => (
                      <CTableRow
                        key={access.key}
                        className={
                          permissions[access.key] !== originalPermissions[access.key]
                            ? 'alert-warning-gray'
                            : ''
                        }
                      >
                        <CTableDataCell>
                          <div className="fw-medium">{access.name}</div>
                        </CTableDataCell>
                        <CTableDataCell>
                          {getPermissionBadge(permissions[access.key])}
                        </CTableDataCell>
                        <CTableDataCell>
                          <CFormSelect
                            size="sm"
                            value={permissions[access.key]}
                            onChange={(e) => handlePermissionChange(access.key, e.target.value)}
                            style={{ maxWidth: '150px' }}
                          >
                            {permissionOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </CFormSelect>
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </CCardBody>
            </CCard>
          ))}

          {filteredAccess.length === 0 && (
            <div className="text-center py-4 text-muted">
              No se encontraron permisos con ese criterio de búsqueda
            </div>
          )}

          {/* Changes indicator */}
          {hasChanges() && (
            <CAlert className="mt-3 alert-warning-gray">
              Hay cambios sin guardar. Los permisos modificados están resaltados en gris.
            </CAlert>
          )}
        </CCardBody>
      </CCard>
    </CContainer>
  );
};

export default Roles;