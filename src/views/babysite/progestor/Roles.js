// src/views/pages/users/Roles.js
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
  cilBan,
} from '@coreui/icons';
import api from '../../../services/api';
import usePermissions from '../../../hooks/usePermissions';

/**
 * Permission Levels for this page (users.permissions / access_12):
 * 0 = No access - redirect to /progestor/users
 * 1 = Read-only - can view but not edit permissions
 * 2 = Full access - can view and edit permissions
 */

// Access names mapping — module = top-level (Progestor/Babysite/Recluta/Babycloud),
// section = the specific page/feature within that module.
// Order follows the actual appearance order in the sidebar (_nav.js).
// locked: true = the section has no working/enabled nav entry yet (still under
// development) — its permissions are kept here so they're ready once it ships.
const accessNames = [
  // ── Progestor (order matches _nav.js) ──
  { key: 'access_20', name: 'Generación de reportes y facturas', module: 'Progestor', section: 'Reportes y facturas' },
  { key: 'access_21', name: 'Generar reporte médico', module: 'Progestor', section: 'Reportes y facturas' },
  { key: 'access_22', name: 'Generar Itinerario', module: 'Progestor', section: 'Reportes y facturas' },
  { key: 'access_23', name: 'Generar factura (Travel Medical Care)', module: 'Progestor', section: 'Reportes y facturas' },
  { key: 'access_24', name: 'Generar factura (Nexa Travel)', module: 'Progestor', section: 'Reportes y facturas' },
  { key: 'access_25', name: 'Generar factura (Babymedic)', module: 'Progestor', section: 'Reportes y facturas' },
  { key: 'access_84', name: 'Documentos legales (sección completa)', module: 'Progestor', section: 'Reportes y facturas' },
  { key: 'access_85', name: 'Doc: Aviso de privacidad simplificado', module: 'Progestor', section: 'Reportes y facturas' },
  { key: 'access_86', name: 'Doc: Obligaciones, cuidados y limitaciones durante el embarazo', module: 'Progestor', section: 'Reportes y facturas' },
  { key: 'access_87', name: 'Doc: Esquema de remuneración', module: 'Progestor', section: 'Reportes y facturas' },
  { key: 'access_88', name: 'Doc: Consentimiento informado para transferencia embrionaria y selección de programa', module: 'Progestor', section: 'Reportes y facturas' },
  { key: 'access_89', name: 'Doc: Consentimiento informado', module: 'Progestor', section: 'Reportes y facturas' },
  { key: 'access_90', name: 'Doc: Aviso de uso y explotación de imagen', module: 'Progestor', section: 'Reportes y facturas' },
  { key: 'access_91', name: 'Doc: Contrato de confidencialidad', module: 'Progestor', section: 'Reportes y facturas' },
  { key: 'access_92', name: 'Doc: Términos y condiciones', module: 'Progestor', section: 'Reportes y facturas' },
  { key: 'access_93', name: 'Doc: Información de la gestante', module: 'Progestor', section: 'Reportes y facturas' },
  { key: 'access_94', name: 'Doc: Declaración de información personal', module: 'Progestor', section: 'Reportes y facturas' },
  { key: 'access_8', name: 'Listado de Usuarios', module: 'Progestor', section: 'Users' },
  { key: 'access_9', name: 'Crear usuario', module: 'Progestor', section: 'Users' },
  { key: 'access_10', name: 'Usuario y correo', module: 'Progestor', section: 'Users' },
  { key: 'access_11', name: 'Contraseña de Usuario', module: 'Progestor', section: 'Users' },
  { key: 'access_12', name: 'Permisos de Usuario', module: 'Progestor', section: 'Users' },
  { key: 'access_13', name: 'Borrar Usuario', module: 'Progestor', section: 'Users' },
  { key: 'access_14', name: 'Listado de Guests', module: 'Progestor', section: 'guests' },
  { key: 'access_15', name: 'Crear Guests', module: 'Progestor', section: 'guests' },
  { key: 'access_16', name: 'Editar Guests', module: 'Progestor', section: 'guests' },
  { key: 'access_17', name: 'Contraseña de Guests', module: 'Progestor', section: 'guests' },
  { key: 'access_18', name: 'Permisos de Guests', module: 'Progestor', section: 'guests' },
  { key: 'access_19', name: 'Borrar Guests', module: 'Progestor', section: 'guests' },
  { key: 'access_5', name: 'Listado de Pagos', module: 'Progestor', section: 'Listado de pagos' },
  { key: 'access_6', name: 'Crear Registro', module: 'Progestor', section: 'Listado de pagos' },
  { key: 'access_7', name: 'Editar/Alterar Pagos Registrados', module: 'Progestor', section: 'Listado de pagos' },
  { key: 'access_95', name: 'Eliminar Registro', module: 'Progestor', section: 'Listado de pagos' },
  { key: 'access_1', name: 'Listado de Nota de Atención', module: 'Progestor', section: 'Listado de notas' },
  { key: 'access_2', name: 'Abrir de Nota de Atención', module: 'Progestor', section: 'Listado de notas' },
  { key: 'access_3', name: 'Listado de Nota Pendiente', module: 'Progestor', section: 'Listado de notas' },
  { key: 'access_4', name: 'Abrir Nota Pendiente', module: 'Progestor', section: 'Listado de notas' },
  { key: 'access_26', name: 'Dash Boards', module: 'Progestor', section: 'Dashboard', locked: true },
  { key: 'access_83', name: 'Historial de actividades', module: 'Progestor', section: 'Historial de actividad' },

  // ── Babysite (order matches _nav.js; sections with no nav entry go last) ──
  { key: 'access_27', name: 'Listado Sort_GES', module: 'Babysite', section: 'Listado Sort_GES' },
  { key: 'access_28', name: 'Alta Sort_GES', module: 'Babysite', section: 'Listado Sort_GES' },
  { key: 'access_29', name: 'Documentación (Sort_GES)', module: 'Babysite', section: 'Listado Sort_GES' },
  { key: 'access_30', name: 'Alterar Documentación (Sort_GES)', module: 'Babysite', section: 'Listado Sort_GES' },
  { key: 'access_31', name: 'Start Programa', module: 'Babysite', section: 'Listado Sort_GES' },
  { key: 'access_32', name: 'Alta Seguro', module: 'Babysite', section: 'Listado Sort_GES' },
  { key: 'access_33', name: 'Listado Sort_IP', module: 'Babysite', section: 'Listado Sort_IPS', locked: true },
  { key: 'access_34', name: 'Alta Sort_IP', module: 'Babysite', section: 'Listado Sort_IPS', locked: true },
  { key: 'access_35', name: 'Editar Sort_IP', module: 'Babysite', section: 'Listado Sort_IPS', locked: true },
  { key: 'access_36', name: 'Documentación (Sort_IP)', module: 'Babysite', section: 'Listado Sort_IPS', locked: true },
  { key: 'access_37', name: 'Alterar/Borrar Documentación (Sort_IP)', module: 'Babysite', section: 'Listado Sort_IPS', locked: true },
  { key: 'access_38', name: 'Start Crio Embrio', module: 'Babysite', section: 'Listado Sort_IPS', locked: true },
  { key: 'access_39', name: 'Actualizar Seguimiento', module: 'Babysite', section: 'Listado Sort_IPS', locked: true },
  { key: 'access_67', name: 'Agenda de Seguro', module: 'Babysite', section: 'Listado Sort_DON', locked: true },
  { key: 'access_68', name: 'Listado Egg Donor', module: 'Babysite', section: 'Listado Sort_DON', locked: true },
  { key: 'access_69', name: 'Dash Boards (Egg Donor)', module: 'Babysite', section: 'Listado Sort_DON', locked: true },
  { key: 'access_40', name: 'Programas', module: 'Babysite', section: 'Programas', locked: true },
  { key: 'access_41', name: 'Crioembrio', module: 'Babysite', section: 'Programas', locked: true },
  { key: 'access_42', name: 'Asignar/Editar Donante', module: 'Babysite', section: 'Programas', locked: true },
  { key: 'access_43', name: 'Editar Material Genético', module: 'Babysite', section: 'Programas', locked: true },
  { key: 'access_44', name: 'Seleccionar Material Genético', module: 'Babysite', section: 'Programas', locked: true },
  { key: 'access_45', name: 'Asignar/Editar Gestante', module: 'Babysite', section: 'Programas', locked: true },
  // Not in the nav at all yet — kept for when these are built
  { key: 'access_46', name: 'Iniciales', module: 'Babysite', section: 'Perfil', locked: true },
  { key: 'access_47', name: 'Perfil Psicológico', module: 'Babysite', section: 'Perfil', locked: true },
  { key: 'access_48', name: 'Agregar Sesión Psicológica', module: 'Babysite', section: 'Perfil', locked: true },
  { key: 'access_49', name: 'Alterar datos Sesión Psicológica', module: 'Babysite', section: 'Perfil', locked: true },
  { key: 'access_50', name: 'Socio Económico', module: 'Babysite', section: 'Perfil', locked: true },
  { key: 'access_51', name: 'Agregar Visita ESE', module: 'Babysite', section: 'Perfil', locked: true },
  { key: 'access_52', name: 'Alterar Datos ESE', module: 'Babysite', section: 'Perfil', locked: true },
  { key: 'access_53', name: 'Alta Citas', module: 'Babysite', section: 'Citas', locked: true },
  { key: 'access_54', name: 'Agregar Tratamientos', module: 'Babysite', section: 'Citas', locked: true },
  { key: 'access_55', name: 'Enviar a Pizarrón', module: 'Babysite', section: 'Citas', locked: true },
  { key: 'access_56', name: 'Pizarrón', module: 'Babysite', section: 'Citas', locked: true },
  { key: 'access_57', name: 'Agregar ACO', module: 'Babysite', section: 'ACO', locked: true },
  { key: 'access_58', name: 'Detener ACO', module: 'Babysite', section: 'ACO', locked: true },
  { key: 'access_59', name: 'Comenzar Preparación', module: 'Babysite', section: 'ACO', locked: true },
  { key: 'access_60', name: 'Detener Preparación', module: 'Babysite', section: 'ACO', locked: true },
  { key: 'access_61', name: 'Enviar a Transfer', module: 'Babysite', section: 'Gestación', locked: true },
  { key: 'access_62', name: 'Registrar Beta', module: 'Babysite', section: 'Gestación', locked: true },
  { key: 'access_63', name: 'Registrar Saco Gestacional', module: 'Babysite', section: 'Gestación', locked: true },
  { key: 'access_64', name: 'Registrar Latido', module: 'Babysite', section: 'Gestación', locked: true },
  { key: 'access_65', name: 'Confirmar GESTA', module: 'Babysite', section: 'Gestación', locked: true },
  { key: 'access_66', name: 'Comenzar SDG GESTA', module: 'Babysite', section: 'Gestación', locked: true },

  // ── Recluta (all nav entries are currently disabled) ──
  { key: 'access_70', name: 'Inicio', module: 'Recluta', section: 'Inicio', locked: true },

  // ── Babycloud (Cloud IPS_upload is enabled in nav; rest of the module shares this permission set) ──
  { key: 'access_71', name: 'Agregar etapa', module: 'Babycloud', section: 'Etapas' },
  { key: 'access_72', name: 'Modificar estado', module: 'Babycloud', section: 'Etapas' },
  { key: 'access_73', name: 'Modificar underway', module: 'Babycloud', section: 'Etapas' },
  { key: 'access_74', name: 'Modificar info 1', module: 'Babycloud', section: 'Etapas' },
  { key: 'access_75', name: 'Modificar info 2', module: 'Babycloud', section: 'Etapas' },
  { key: 'access_76', name: 'Subir archivo 1', module: 'Babycloud', section: 'Etapas' },
  { key: 'access_77', name: 'Subir archivo 2', module: 'Babycloud', section: 'Etapas' },
  { key: 'access_78', name: 'Subir archivo 3', module: 'Babycloud', section: 'Etapas' },
  { key: 'access_79', name: 'Habilitar 1', module: 'Babycloud', section: 'Etapas' },
  { key: 'access_80', name: 'Habilitar 2', module: 'Babycloud', section: 'Etapas' },
  { key: 'access_81', name: 'Habilitar 3', module: 'Babycloud', section: 'Etapas' },
  { key: 'access_82', name: 'Habilitar vista de la etapa', module: 'Babycloud', section: 'Etapas' },
];

// Permission options
const permissionOptions = [
  { value: 0, label: 'Sin acceso', color: 'danger', icon: cilLockLocked },
  { value: 1, label: 'Solo ver', color: 'warning', icon: cilLockUnlocked },
  { value: 2, label: 'Ver y editar', color: 'success', icon: cilPencil },
];

// Get unique modules
const modules = [...new Set(accessNames.map((a) => a.module))];

const Roles = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Get permissions for this page
  const { users: userPerms } = usePermissions();
  
  // Check access level for users.permissions (access_12)
  const canView = userPerms.permissions.visible;   // level >= 1
  const canEdit = userPerms.permissions.editable;  // level >= 2

  // State
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [originalPermissions, setOriginalPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');

  // Redirect if no view permission (level 0)
  useEffect(() => {
    if (!canView) {
      navigate('/progestor/users');
    }
  }, [canView, navigate]);

  // Fetch user and permissions on mount
  useEffect(() => {
    if (canView) {
      fetchUserRoles();
    }
  }, [id, canView]);

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
    // Only allow changes if has edit permission (level 2)
    if (!canEdit) return;
    
    setPermissions((prev) => ({
      ...prev,
      [key]: parseInt(value, 10),
    }));
  };

  const handleSave = async () => {
    // Only allow save if has edit permission (level 2)
    if (!canEdit) return;
    
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
    // Only allow changes if has edit permission (level 2)
    if (!canEdit) return;
    
    const newPerms = {};
    accessNames.forEach((access) => {
      newPerms[access.key] = value;
    });
    setPermissions(newPerms);
  };

  const handleSetSectionAll = (module, section, value) => {
    // Only allow changes if has edit permission (level 2)
    if (!canEdit) return;
    
    setPermissions((prev) => {
      const newPerms = { ...prev };
      accessNames
        .filter((access) => access.module === module && access.section === section)
        .forEach((access) => {
          newPerms[access.key] = value;
        });
      return newPerms;
    });
  };

  const handleSetModuleAll = (module, value) => {
    // Only allow changes if has edit permission (level 2)
    if (!canEdit) return;

    setPermissions((prev) => {
      const newPerms = { ...prev };
      accessNames
        .filter((access) => access.module === module)
        .forEach((access) => {
          newPerms[access.key] = value;
        });
      return newPerms;
    });
  };

  const hasChanges = () => {
    return JSON.stringify(permissions) !== JSON.stringify(originalPermissions);
  };

  const handleDiscardChanges = () => {
    setPermissions({ ...originalPermissions });
  };

  // Filter access names by search and module
  const filteredAccess = accessNames.filter((access) => {
    const matchesSearch = access.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = selectedModule === 'all' || access.module === selectedModule;
    return matchesSearch && matchesModule;
  });

  // Group filtered access by module, then by section within each module
  const groupedAccess = filteredAccess.reduce((acc, access) => {
    if (!acc[access.module]) acc[access.module] = {};
    if (!acc[access.module][access.section]) acc[access.module][access.section] = [];
    acc[access.module][access.section].push(access);
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

  // Access denied view (level 0)
  if (!canView) {
    return (
      <CContainer className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <CCard>
          <CCardBody className="text-center">
            <CIcon icon={cilBan} size="3xl" className="text-danger mb-3" />
            <h4>Acceso Denegado</h4>
            <p className="text-muted">No tienes permiso para ver esta página.</p>
            <CButton color="primary" onClick={() => navigate('/progestor/users')}>
              Volver a usuarios
            </CButton>
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
    <CContainer lg>
      {alert.show && (
        <CAlert color={alert.type} dismissible onClose={() => setAlert({ show: false })}>
          {alert.message}
        </CAlert>
      )}

      {/* Read-only banner when level 1 */}
      {!canEdit && (
        <CAlert color="warning" className="d-flex align-items-center">
          <CIcon icon={cilLockUnlocked} className="me-2" />
          <span>
            <strong>Modo solo lectura.</strong> No tienes permiso para modificar los permisos de este usuario.
          </span>
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
              {/* Save button - only show if has edit permission */}
              {canEdit ? (
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
              ) : (
                <CBadge color="warning" className="px-3 py-2">
                  <CIcon icon={cilLockUnlocked} className="me-1" />
                  Solo lectura
                </CBadge>
              )}
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
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
              >
                <option value="all">Todos los módulos</option>
                {modules.map((mod) => (
                  <option key={mod} value={mod}>
                    {mod}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
            {/* Bulk actions - only show if has edit permission */}
            {canEdit && (
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
            )}
          </CRow>

          {/* Permissions grouped by module, then by section within each module */}
          {Object.entries(groupedAccess).map(([module, sections]) => {
            const moduleCount = Object.values(sections).reduce((sum, arr) => sum + arr.length, 0);
            return (
              <CCard key={module} className="mb-3">
                <CCardHeader className="py-2">
                  <CRow className="align-items-center">
                    <CCol>
                      <strong>{module}</strong>
                      <span className="text-muted ms-2 small">({moduleCount} permisos)</span>
                    </CCol>
                    {/* Module bulk actions - only show if has edit permission */}
                    {canEdit && (
                      <CCol xs="auto">
                        <span className="me-2 text-muted small">Aplicar a todo el módulo:</span>
                        <CButton
                          color="danger"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetModuleAll(module, 0)}
                          title="Sin acceso"
                        >
                          <CIcon icon={cilLockLocked} />
                        </CButton>
                        <CButton
                          color="warning"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetModuleAll(module, 1)}
                          title="Solo ver"
                        >
                          <CIcon icon={cilLockUnlocked} />
                        </CButton>
                        <CButton
                          color="success"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetModuleAll(module, 2)}
                          title="Ver y editar"
                        >
                          <CIcon icon={cilPencil} />
                        </CButton>
                      </CCol>
                    )}
                  </CRow>
                </CCardHeader>
                <CCardBody className="p-0">
                  {Object.entries(sections).map(([section, accesses], idx) => (
                    <div key={section} className={idx > 0 ? 'border-top' : ''}>
                      <div className="d-flex align-items-center justify-content-between px-3 py-2 bg-body-tertiary">
                        <div>
                          <span className="fw-semibold">{section}</span>
                          <span className="text-muted ms-2 small">({accesses.length} permisos)</span>
                          {accesses[0]?.locked && (
                            <CBadge color="secondary" className="ms-2" title="Esta sección aún no está disponible en el sistema; se desarrollará más adelante">
                              En desarrollo
                            </CBadge>
                          )}
                        </div>
                        {/* Section bulk actions - only show if has edit permission */}
                        {canEdit && (
                          <div>
                            <span className="me-2 text-muted small">Aplicar:</span>
                            <CButton
                              color="danger"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetSectionAll(module, section, 0)}
                              title="Sin acceso"
                            >
                              <CIcon icon={cilLockLocked} />
                            </CButton>
                            <CButton
                              color="warning"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetSectionAll(module, section, 1)}
                              title="Solo ver"
                            >
                              <CIcon icon={cilLockUnlocked} />
                            </CButton>
                            <CButton
                              color="success"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetSectionAll(module, section, 2)}
                              title="Ver y editar"
                            >
                              <CIcon icon={cilPencil} />
                            </CButton>
                          </div>
                        )}
                      </div>
                      <CTable hover striped className="mb-0">
                        <CTableHead>
                          <CTableRow>
                            <CTableHeaderCell style={{ width: '50%' }}>Permiso</CTableHeaderCell>
                            <CTableHeaderCell style={{ width: '25%' }}>Estado actual</CTableHeaderCell>
                            {/* Only show "Cambiar a" column if can edit */}
                            {canEdit && (
                              <CTableHeaderCell style={{ width: '25%' }}>Cambiar a</CTableHeaderCell>
                            )}
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
                              {/* Only show select if can edit */}
                              {canEdit && (
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
                              )}
                            </CTableRow>
                          ))}
                        </CTableBody>
                      </CTable>
                    </div>
                  ))}
                </CCardBody>
              </CCard>
            );
          })}

          {filteredAccess.length === 0 && (
            <div className="text-center py-4 text-muted">
              No se encontraron permisos con ese criterio de búsqueda
            </div>
          )}

          {/* Bottom padding so the sticky save bar never covers the last rows */}
          {canEdit && hasChanges() && <div style={{ height: '76px' }} />}
        </CCardBody>
      </CCard>

      {/* Sticky save bar — lets the user save from anywhere on the page,
          without having to scroll back up to the header */}
      {canEdit && hasChanges() && (
        <div
          className="sticky-save-bar"
          style={{
            position: 'fixed',
            left: 'var(--cui-sidebar-occupy-start, 0)',
            right: 0,
            bottom: 0,
            zIndex: 1030,
          }}
        >
          <div
            className="d-flex align-items-center justify-content-between shadow"
            style={{
              backgroundColor: 'var(--app-primary, #eb6c9c)',
              opacity: 1,
              padding: '0.75rem 1.25rem',
            }}
          >
            <span className="text-white fw-medium">Hay cambios sin guardar. Los permisos modificados están resaltados en gris.</span>
            <div className="d-flex gap-2">
              <CButton
                variant="outline"
                size="sm"
                onClick={handleDiscardChanges}
                disabled={saving}
                className="sticky-bar-discard-btn"
              >
                Descartar cambios
              </CButton>
              <CButton
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="sticky-bar-save-btn"
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
            </div>
          </div>
        </div>
      )}

      <style>{`
        .sticky-bar-discard-btn {
          color: #fff !important;
          border-color: #fff !important;
          background-color: transparent !important;
        }
        .sticky-bar-discard-btn:hover:not(:disabled) {
          color: var(--app-primary, #eb6c9c) !important;
          background-color: #fff !important;
          border-color: #fff !important;
        }
        .sticky-bar-save-btn {
          color: var(--app-primary, #eb6c9c) !important;
          background-color: #fff !important;
          border-color: #fff !important;
        }
        .sticky-bar-save-btn:hover:not(:disabled) {
          color: #fff !important;
          background-color: var(--app-primary-dark, #df457b) !important;
          border-color: var(--app-primary-dark, #df457b) !important;
        }
      `}</style>
    </CContainer>
  );
};

export default Roles;