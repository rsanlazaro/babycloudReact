// src/views/pages/access/AccessRoles.js
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
    CNav,
    CNavItem,
    CNavLink,
    CTabContent,
    CTabPane,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
    cilSave,
    cilSearch,
    cilLockLocked,
    cilLockUnlocked,
    cilPencil,
    cilReload,
    cilArrowLeft,
} from '@coreui/icons';
import api from '../../../services/api';

// Access names mapping (same structure as Roles.js) — module = top-level
// (Progestor/Babysite/Recluta/Babycloud), section = the specific page/feature.
// Order follows the actual appearance order in the sidebar (_nav.js).
// locked: true = the section has no working/enabled nav entry yet (still under
// development) — its permissions are kept here so they're ready once it ships.
const accessNames = [
    // ── Progestor (order matches _nav.js) ──
    { key: 20, name: 'Generación de reportes y facturas', module: 'Progestor', section: 'Reportes y facturas' },
    { key: 21, name: 'Generar reporte médico', module: 'Progestor', section: 'Reportes y facturas' },
    { key: 22, name: 'Generar Itinerario', module: 'Progestor', section: 'Reportes y facturas' },
    { key: 23, name: 'Generar factura (Travel Medical Care)', module: 'Progestor', section: 'Reportes y facturas' },
    { key: 24, name: 'Generar factura (Nexa Travel)', module: 'Progestor', section: 'Reportes y facturas' },
    { key: 25, name: 'Generar factura (Babymedic)', module: 'Progestor', section: 'Reportes y facturas' },
    { key: 84, name: 'Documentos legales (sección completa)', module: 'Progestor', section: 'Reportes y facturas' },
    { key: 85, name: 'Doc: Aviso de privacidad simplificado', module: 'Progestor', section: 'Reportes y facturas' },
    { key: 86, name: 'Doc: Obligaciones, cuidados y limitaciones durante el embarazo', module: 'Progestor', section: 'Reportes y facturas' },
    { key: 87, name: 'Doc: Esquema de remuneración', module: 'Progestor', section: 'Reportes y facturas' },
    { key: 88, name: 'Doc: Consentimiento informado para transferencia embrionaria y selección de programa', module: 'Progestor', section: 'Reportes y facturas' },
    { key: 89, name: 'Doc: Consentimiento informado', module: 'Progestor', section: 'Reportes y facturas' },
    { key: 90, name: 'Doc: Aviso de uso y explotación de imagen', module: 'Progestor', section: 'Reportes y facturas' },
    { key: 91, name: 'Doc: Contrato de confidencialidad', module: 'Progestor', section: 'Reportes y facturas' },
    { key: 92, name: 'Doc: Términos y condiciones', module: 'Progestor', section: 'Reportes y facturas' },
    { key: 93, name: 'Doc: Información de la gestante', module: 'Progestor', section: 'Reportes y facturas' },
    { key: 94, name: 'Doc: Declaración de información personal', module: 'Progestor', section: 'Reportes y facturas' },
    { key: 8, name: 'Listado de Usuarios', module: 'Progestor', section: 'Users' },
    { key: 9, name: 'Crear usuario', module: 'Progestor', section: 'Users' },
    { key: 10, name: 'Usuario y correo', module: 'Progestor', section: 'Users' },
    { key: 11, name: 'Contraseña de Usuario', module: 'Progestor', section: 'Users' },
    { key: 12, name: 'Permisos de Usuario', module: 'Progestor', section: 'Users' },
    { key: 13, name: 'Borrar Usuario', module: 'Progestor', section: 'Users' },
    { key: 14, name: 'Listado de Guests', module: 'Progestor', section: 'guests' },
    { key: 15, name: 'Crear Guests', module: 'Progestor', section: 'guests' },
    { key: 16, name: 'Editar Guests', module: 'Progestor', section: 'guests' },
    { key: 17, name: 'Contraseña de Guests', module: 'Progestor', section: 'guests' },
    { key: 18, name: 'Permisos de Guests', module: 'Progestor', section: 'guests' },
    { key: 19, name: 'Borrar Guests', module: 'Progestor', section: 'guests' },
    { key: 5, name: 'Listado de Pagos', module: 'Progestor', section: 'Listado de pagos' },
    { key: 6, name: 'Crear Registro', module: 'Progestor', section: 'Listado de pagos' },
    { key: 7, name: 'Editar/Alterar Pagos Registrados', module: 'Progestor', section: 'Listado de pagos' },
    { key: 95, name: 'Eliminar Registro', module: 'Progestor', section: 'Listado de pagos' },
    { key: 1, name: 'Listado de Nota de Atención', module: 'Progestor', section: 'Listado de notas' },
    { key: 2, name: 'Abrir de Nota de Atención', module: 'Progestor', section: 'Listado de notas' },
    { key: 3, name: 'Listado de Nota Pendiente', module: 'Progestor', section: 'Listado de notas' },
    { key: 4, name: 'Abrir Nota Pendiente', module: 'Progestor', section: 'Listado de notas' },
    { key: 26, name: 'Dash Boards', module: 'Progestor', section: 'Dashboard', locked: true },
    { key: 83, name: 'Historial de actividades', module: 'Progestor', section: 'Historial de actividad' },

    // ── Babysite (order matches _nav.js; sections with no nav entry go last) ──
    { key: 27, name: 'Listado Sort_GES', module: 'Babysite', section: 'Listado Sort_GES' },
    { key: 28, name: 'Alta Sort_GES', module: 'Babysite', section: 'Listado Sort_GES' },
    { key: 29, name: 'Documentación (Sort_GES)', module: 'Babysite', section: 'Listado Sort_GES' },
    { key: 30, name: 'Alterar Documentación (Sort_GES)', module: 'Babysite', section: 'Listado Sort_GES' },
    { key: 31, name: 'Start Programa', module: 'Babysite', section: 'Listado Sort_GES' },
    { key: 32, name: 'Alta Seguro', module: 'Babysite', section: 'Listado Sort_GES' },
    { key: 33, name: 'Listado Sort_IP', module: 'Babysite', section: 'Listado Sort_IPS', locked: true },
    { key: 34, name: 'Alta Sort_IP', module: 'Babysite', section: 'Listado Sort_IPS', locked: true },
    { key: 35, name: 'Editar Sort_IP', module: 'Babysite', section: 'Listado Sort_IPS', locked: true },
    { key: 36, name: 'Documentación (Sort_IP)', module: 'Babysite', section: 'Listado Sort_IPS', locked: true },
    { key: 37, name: 'Alterar/Borrar Documentación (Sort_IP)', module: 'Babysite', section: 'Listado Sort_IPS', locked: true },
    { key: 38, name: 'Start Crio Embrio', module: 'Babysite', section: 'Listado Sort_IPS', locked: true },
    { key: 39, name: 'Actualizar Seguimiento', module: 'Babysite', section: 'Listado Sort_IPS', locked: true },
    { key: 67, name: 'Agenda de Seguro', module: 'Babysite', section: 'Listado Sort_DON', locked: true },
    { key: 68, name: 'Listado Egg Donor', module: 'Babysite', section: 'Listado Sort_DON', locked: true },
    { key: 69, name: 'Dash Boards (Egg Donor)', module: 'Babysite', section: 'Listado Sort_DON', locked: true },
    { key: 40, name: 'Programas', module: 'Babysite', section: 'Programas', locked: true },
    { key: 41, name: 'Crioembrio', module: 'Babysite', section: 'Programas', locked: true },
    { key: 42, name: 'Asignar/Editar Donante', module: 'Babysite', section: 'Programas', locked: true },
    { key: 43, name: 'Editar Material Genético', module: 'Babysite', section: 'Programas', locked: true },
    { key: 44, name: 'Seleccionar Material Genético', module: 'Babysite', section: 'Programas', locked: true },
    { key: 45, name: 'Asignar/Editar Gestante', module: 'Babysite', section: 'Programas', locked: true },
    // Not in the nav at all yet — kept for when these are built
    { key: 46, name: 'Iniciales', module: 'Babysite', section: 'Perfil', locked: true },
    { key: 47, name: 'Perfil Psicológico', module: 'Babysite', section: 'Perfil', locked: true },
    { key: 48, name: 'Agregar Sesión Psicológica', module: 'Babysite', section: 'Perfil', locked: true },
    { key: 49, name: 'Alterar datos Sesión Psicológica', module: 'Babysite', section: 'Perfil', locked: true },
    { key: 50, name: 'Socio Económico', module: 'Babysite', section: 'Perfil', locked: true },
    { key: 51, name: 'Agregar Visita ESE', module: 'Babysite', section: 'Perfil', locked: true },
    { key: 52, name: 'Alterar Datos ESE', module: 'Babysite', section: 'Perfil', locked: true },
    { key: 53, name: 'Alta Citas', module: 'Babysite', section: 'Citas', locked: true },
    { key: 54, name: 'Agregar Tratamientos', module: 'Babysite', section: 'Citas', locked: true },
    { key: 55, name: 'Enviar a Pizarrón', module: 'Babysite', section: 'Citas', locked: true },
    { key: 56, name: 'Pizarrón', module: 'Babysite', section: 'Citas', locked: true },
    { key: 57, name: 'Agregar ACO', module: 'Babysite', section: 'ACO', locked: true },
    { key: 58, name: 'Detener ACO', module: 'Babysite', section: 'ACO', locked: true },
    { key: 59, name: 'Comenzar Preparación', module: 'Babysite', section: 'ACO', locked: true },
    { key: 60, name: 'Detener Preparación', module: 'Babysite', section: 'ACO', locked: true },
    { key: 61, name: 'Enviar a Transfer', module: 'Babysite', section: 'Gestación', locked: true },
    { key: 62, name: 'Registrar Beta', module: 'Babysite', section: 'Gestación', locked: true },
    { key: 63, name: 'Registrar Saco Gestacional', module: 'Babysite', section: 'Gestación', locked: true },
    { key: 64, name: 'Registrar Latido', module: 'Babysite', section: 'Gestación', locked: true },
    { key: 65, name: 'Confirmar GESTA', module: 'Babysite', section: 'Gestación', locked: true },
    { key: 66, name: 'Comenzar SDG GESTA', module: 'Babysite', section: 'Gestación', locked: true },

    // ── Recluta (all nav entries are currently disabled) ──
    { key: 70, name: 'Inicio', module: 'Recluta', section: 'Inicio', locked: true },

    // ── Babycloud (Cloud IPS_upload is enabled in nav; rest of the module shares this permission set) ──
    { key: 71, name: 'Agregar etapa', module: 'Babycloud', section: 'Etapas' },
    { key: 72, name: 'Modificar estado', module: 'Babycloud', section: 'Etapas' },
    { key: 73, name: 'Modificar underway', module: 'Babycloud', section: 'Etapas' },
    { key: 74, name: 'Modificar info 1', module: 'Babycloud', section: 'Etapas' },
    { key: 75, name: 'Modificar info 2', module: 'Babycloud', section: 'Etapas' },
    { key: 76, name: 'Subir archivo 1', module: 'Babycloud', section: 'Etapas' },
    { key: 77, name: 'Subir archivo 2', module: 'Babycloud', section: 'Etapas' },
    { key: 78, name: 'Subir archivo 3', module: 'Babycloud', section: 'Etapas' },
    { key: 79, name: 'Habilitar 1', module: 'Babycloud', section: 'Etapas' },
    { key: 80, name: 'Habilitar 2', module: 'Babycloud', section: 'Etapas' },
    { key: 81, name: 'Habilitar 3', module: 'Babycloud', section: 'Etapas' },
    { key: 82, name: 'Habilitar vista de la etapa', module: 'Babycloud', section: 'Etapas' },
];

// Profile options
const profiles = [
    { key: 'super_admin', label: 'Super Admin', color: 'danger' },
    { key: 'admin_junior', label: 'Admin Jr', color: 'warning' },
    { key: 'coordinador', label: 'Coordinador', color: 'info' },
    { key: 'operador', label: 'Operador', color: 'primary' },
    { key: 'recluta', label: 'Recluta', color: 'secondary' },
];

// Permission options
const permissionOptions = [
    { value: 0, label: 'Sin acceso', color: 'danger', icon: cilLockLocked },
    { value: 1, label: 'Solo ver', color: 'warning', icon: cilLockUnlocked },
    { value: 2, label: 'Ver y editar', color: 'success', icon: cilPencil },
];

// Get unique modules
const modules = [...new Set(accessNames.map((a) => a.module))];

const AccessRoles = () => {
    const navigate = useNavigate();
    // State
    const [allPermissions, setAllPermissions] = useState({});
    const [originalPermissions, setOriginalPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedModule, setSelectedModule] = useState('all');
    const [activeTab, setActiveTab] = useState('super_admin');

    // Fetch all permissions on mount
    useEffect(() => {
        fetchAccessRoles();
    }, []);

    const fetchAccessRoles = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/users/access', { withCredentials: true });

            // Initialize permissions for all profiles
            const perms = {};
            profiles.forEach((profile) => {
                perms[profile.key] = {};
                accessNames.forEach((access) => {
                    const fieldKey = `${profile.key}_${access.key}`;
                    perms[profile.key][access.key] = res.data[fieldKey] ?? 0;
                });
            });

            setAllPermissions(perms);
            setOriginalPermissions(JSON.parse(JSON.stringify(perms)));
        } catch (err) {
            console.error('Error fetching access roles:', err);
            showNotification('danger', 'Error al cargar los permisos de acceso');
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (type, message) => {
        setAlert({ show: true, type, message });
        setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
    };

    const handlePermissionChange = (profileKey, accessKey, value) => {
        setAllPermissions((prev) => ({
            ...prev,
            [profileKey]: {
                ...prev[profileKey],
                [accessKey]: parseInt(value, 10),
            },
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            // Convert to flat structure for API
            const flatPermissions = {};
            profiles.forEach((profile) => {
                accessNames.forEach((access) => {
                    flatPermissions[`${profile.key}_${access.key}`] = allPermissions[profile.key][access.key];
                });
            });

            await api.put('/api/users/access', { permissions: flatPermissions }, { withCredentials: true });
            setOriginalPermissions(JSON.parse(JSON.stringify(allPermissions)));
            showNotification('success', 'Permisos de acceso actualizados correctamente');
        } catch (err) {
            console.error('Error saving access roles:', err);
            showNotification('danger', 'Error al guardar los permisos de acceso');
        } finally {
            setSaving(false);
        }
    };

    const handleSetAllForProfile = (profileKey, value) => {
        setAllPermissions((prev) => {
            const newPerms = { ...prev };
            newPerms[profileKey] = {};
            accessNames.forEach((access) => {
                newPerms[profileKey][access.key] = value;
            });
            return newPerms;
        });
    };

    const handleSetSectionForProfile = (profileKey, module, section, value) => {
        setAllPermissions((prev) => {
            const newPerms = { ...prev };
            newPerms[profileKey] = { ...prev[profileKey] };
            accessNames
                .filter((access) => access.module === module && access.section === section)
                .forEach((access) => {
                    newPerms[profileKey][access.key] = value;
                });
            return newPerms;
        });
    };

    const handleSetModuleForProfile = (profileKey, module, value) => {
        setAllPermissions((prev) => {
            const newPerms = { ...prev };
            newPerms[profileKey] = { ...prev[profileKey] };
            accessNames
                .filter((access) => access.module === module)
                .forEach((access) => {
                    newPerms[profileKey][access.key] = value;
                });
            return newPerms;
        });
    };

    const handleResetProfile = (profileKey) => {
        setAllPermissions((prev) => ({
            ...prev,
            [profileKey]: { ...originalPermissions[profileKey] },
        }));
    };

    const handleDiscardAllChanges = () => {
        setAllPermissions(JSON.parse(JSON.stringify(originalPermissions)));
    };

    const hasChanges = () => {
        return JSON.stringify(allPermissions) !== JSON.stringify(originalPermissions);
    };

    const hasChangesForProfile = (profileKey) => {
        return JSON.stringify(allPermissions[profileKey]) !== JSON.stringify(originalPermissions[profileKey]);
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
                            <CButton
                                color="secondary"
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate('/progestor/users')}
                                className="me-3"
                            >
                                <CIcon icon={cilArrowLeft} />
                            </CButton>
                            <strong>Permisos de acceso por perfil</strong>
                            <div className="small text-muted">
                                Configura los permisos predeterminados para cada tipo de perfil
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
                                        Guardar todos los cambios
                                    </>
                                )}
                            </CButton>
                        </CCol>
                    </CRow>
                </CCardHeader>
                <CCardBody>
                    {/* Filters */}
                    <CRow className="mb-4">
                        <CCol md={5}>
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
                        <CCol md={4}>
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
                    </CRow>

                    {/* Profile Tabs */}
                    <CNav variant="tabs" className="mb-3">
                        {profiles.map((profile) => (
                            <CNavItem key={profile.key}>
                                <CNavLink
                                    active={activeTab === profile.key}
                                    onClick={() => setActiveTab(profile.key)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <CBadge color={profile.color} className="me-2">
                                        {profile.label}
                                    </CBadge>
                                    {hasChangesForProfile(profile.key) && (
                                        <CBadge color="warning" shape="rounded-pill">
                                            •
                                        </CBadge>
                                    )}
                                </CNavLink>
                            </CNavItem>
                        ))}
                    </CNav>

                    <CTabContent>
                        {profiles.map((profile) => (
                            <CTabPane
                                key={profile.key}
                                visible={activeTab === profile.key}
                            >
                                {/* Bulk actions for profile */}
                                <CRow className="mb-3 align-items-center">
                                    <CCol>
                                        <span className="me-2 text-muted">Aplicar a todos los permisos de {profile.label}:</span>
                                        <CButton
                                            color="danger"
                                            variant="outline"
                                            size="sm"
                                            className="me-1"
                                            onClick={() => handleSetAllForProfile(profile.key, 0)}
                                        >
                                            Sin acceso
                                        </CButton>
                                        <CButton
                                            color="warning"
                                            variant="outline"
                                            size="sm"
                                            className="me-1"
                                            onClick={() => handleSetAllForProfile(profile.key, 1)}
                                        >
                                            Solo ver
                                        </CButton>
                                        <CButton
                                            color="success"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleSetAllForProfile(profile.key, 2)}
                                        >
                                            Ver y editar
                                        </CButton>
                                    </CCol>
                                    <CCol xs="auto">
                                        {hasChangesForProfile(profile.key) && (
                                            <CButton
                                                color="secondary"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleResetProfile(profile.key)}
                                            >
                                                <CIcon icon={cilReload} className="me-1" />
                                                Restablecer
                                            </CButton>
                                        )}
                                    </CCol>
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
                                                    <CCol xs="auto">
                                                        <span className="me-2 text-muted small">Aplicar a todo el módulo:</span>
                                                        <CButton
                                                            color="danger"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleSetModuleForProfile(profile.key, module, 0)}
                                                            title="Sin acceso"
                                                        >
                                                            <CIcon icon={cilLockLocked} />
                                                        </CButton>
                                                        <CButton
                                                            color="warning"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleSetModuleForProfile(profile.key, module, 1)}
                                                            title="Solo ver"
                                                        >
                                                            <CIcon icon={cilLockUnlocked} />
                                                        </CButton>
                                                        <CButton
                                                            color="success"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleSetModuleForProfile(profile.key, module, 2)}
                                                            title="Ver y editar"
                                                        >
                                                            <CIcon icon={cilPencil} />
                                                        </CButton>
                                                    </CCol>
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
                                                            <div>
                                                                <span className="me-2 text-muted small">Aplicar:</span>
                                                                <CButton
                                                                    color="danger"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleSetSectionForProfile(profile.key, module, section, 0)}
                                                                    title="Sin acceso"
                                                                >
                                                                    <CIcon icon={cilLockLocked} />
                                                                </CButton>
                                                                <CButton
                                                                    color="warning"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleSetSectionForProfile(profile.key, module, section, 1)}
                                                                    title="Solo ver"
                                                                >
                                                                    <CIcon icon={cilLockUnlocked} />
                                                                </CButton>
                                                                <CButton
                                                                    color="success"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleSetSectionForProfile(profile.key, module, section, 2)}
                                                                    title="Ver y editar"
                                                                >
                                                                    <CIcon icon={cilPencil} />
                                                                </CButton>
                                                            </div>
                                                        </div>
                                                        <CTable hover striped className="mb-0">
                                                            <CTableHead>
                                                                <CTableRow>
                                                                    <CTableHeaderCell style={{ width: '50%' }}>Permiso</CTableHeaderCell>
                                                                    <CTableHeaderCell style={{ width: '25%' }}>Estado actual</CTableHeaderCell>
                                                                    <CTableHeaderCell style={{ width: '25%' }}>Cambiar a</CTableHeaderCell>
                                                                </CTableRow>
                                                            </CTableHead>
                                                            <CTableBody>
                                                                {accesses.map((access) => {
                                                                    const currentValue = allPermissions[profile.key]?.[access.key] ?? 0;
                                                                    const originalValue = originalPermissions[profile.key]?.[access.key] ?? 0;
                                                                    const hasChanged = currentValue !== originalValue;

                                                                    return (
                                                                        <CTableRow
                                                                            key={access.key}
                                                                            className={hasChanged ? 'alert-warning-gray' : ''}
                                                                        >
                                                                            <CTableDataCell>
                                                                                <div className="fw-medium">{access.name}</div>
                                                                            </CTableDataCell>
                                                                            <CTableDataCell>
                                                                                {getPermissionBadge(currentValue)}
                                                                            </CTableDataCell>
                                                                            <CTableDataCell>
                                                                                <CFormSelect
                                                                                    size="sm"
                                                                                    value={currentValue}
                                                                                    onChange={(e) =>
                                                                                        handlePermissionChange(profile.key, access.key, e.target.value)
                                                                                    }
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
                                                                    );
                                                                })}
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
                            </CTabPane>
                        ))}
                    </CTabContent>

                    {/* Bottom padding so the sticky save bar never covers the last rows */}
                    {hasChanges() && <div style={{ height: '76px' }} />}
                </CCardBody>
            </CCard>

            {/* Sticky save bar — lets the user save from anywhere on the page,
                without having to scroll back up to the header */}
            {hasChanges() && (
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
                                onClick={handleDiscardAllChanges}
                                disabled={saving}
                                className="sticky-bar-discard-btn"
                            >
                                Descartar todos los cambios
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
                                        Guardar todos los cambios
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

export default AccessRoles;