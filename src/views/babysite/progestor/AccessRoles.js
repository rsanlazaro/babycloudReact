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

// Access names mapping (same as UserRoles)
const accessNames = [
    { key: 1, name: 'Listado de Nota de Atención', category: 'Progestor' },
    { key: 2, name: 'Abrir de Nota de Atención', category: 'Progestor' },
    { key: 3, name: 'Listado de Nota Pendiente', category: 'Progestor' },
    { key: 4, name: 'Abrir Nota Pendiente', category: 'Progestor' },
    { key: 5, name: 'Listado de Pagos', category: 'Progestor' },
    { key: 6, name: 'Registro de Pagos', category: 'Progestor' },
    { key: 7, name: 'Editar/Alterar Pagos Registrados', category: 'Progestor' },
    { key: 8, name: 'Listado de Usuarios', category: 'Progestor' },
    { key: 9, name: 'Crear usuario', category: 'Progestor' },
    { key: 10, name: 'Editar usuario', category: 'Progestor' },
    { key: 11, name: 'Contraseña de Usuario', category: 'Progestor' },
    { key: 12, name: 'Permisos de Usuario', category: 'Progestor' },
    { key: 13, name: 'Borrar Usuario', category: 'Progestor' },
    { key: 14, name: 'Listado de Guests', category: 'Progestor' },
    { key: 15, name: 'Crear Guests', category: 'Progestor' },
    { key: 16, name: 'Editar Guests', category: 'Progestor' },
    { key: 17, name: 'Contraseña de Guests', category: 'Progestor' },
    { key: 18, name: 'Permisos de Guests', category: 'Progestor' },
    { key: 19, name: 'Borrar Guests', category: 'Progestor' },
    { key: 20, name: 'Generación de reportes y facturas', category: 'Progestor' },
    { key: 21, name: 'Generar reporte médico', category: 'Progestor' },
    { key: 22, name: 'Generar Itinerario', category: 'Progestor' },
    { key: 23, name: 'Generar factura (Travel Medical Care)', category: 'Progestor' },
    { key: 24, name: 'Generar factura (Nexa Travel)', category: 'Progestor' },
    { key: 25, name: 'Generar factura (Babymedic)', category: 'Progestor' },
    { key: 26, name: 'Dash Boards', category: 'Progestor' },
    { key: 27, name: 'Listado Sort_GES', category: 'Babysite' },
    { key: 28, name: 'Alta Sort_GES', category: 'Babysite' },
    { key: 29, name: 'Documentación (Sort_GES)', category: 'Babysite' },
    { key: 30, name: 'Alterar Documentación (Sort_GES)', category: 'Babysite' },
    { key: 31, name: 'Start Programa', category: 'Babysite' },
    { key: 32, name: 'Alta Seguro', category: 'Babysite' },
    { key: 33, name: 'Listado Sort_IP', category: 'Babysite' },
    { key: 34, name: 'Alta Sort_IP', category: 'Babysite' },
    { key: 35, name: 'Editar Sort_IP', category: 'Babysite' },
    { key: 36, name: 'Documentación (Sort_IP)', category: 'Babysite' },
    { key: 37, name: 'Alterar/Borrar Documentación (Sort_IP)', category: 'Babysite' },
    { key: 38, name: 'Start Crio Embrio', category: 'Babysite' },
    { key: 39, name: 'Actualizar Seguimiento', category: 'Babysite' },
    { key: 40, name: 'Programas', category: 'Babysite' },
    { key: 41, name: 'Crioembrio', category: 'Babysite' },
    { key: 42, name: 'Asignar/Editar Donante', category: 'Babysite' },
    { key: 43, name: 'Editar Material Genético', category: 'Babysite' },
    { key: 44, name: 'Seleccionar Material Genético', category: 'Babysite' },
    { key: 45, name: 'Asignar/Editar Gestante', category: 'Babysite' },
    { key: 46, name: 'Iniciales', category: 'Babysite' },
    { key: 47, name: 'Perfil Psicológico', category: 'Babysite' },
    { key: 48, name: 'Agregar Sesión Psicológica', category: 'Babysite' },
    { key: 49, name: 'Alterar datos Sesión Psicológica', category: 'Babysite' },
    { key: 50, name: 'Socio Económico', category: 'Babysite' },
    { key: 51, name: 'Agregar Visita ESE', category: 'Babysite' },
    { key: 52, name: 'Alterar Datos ESE', category: 'Babysite' },
    { key: 53, name: 'Alta Citas', category: 'Babysite' },
    { key: 54, name: 'Agregar Tratamientos', category: 'Babysite' },
    { key: 55, name: 'Enviar a Pizarrón', category: 'Babysite' },
    { key: 56, name: 'Pizarrón', category: 'Babysite' },
    { key: 57, name: 'Agregar ACO', category: 'Babysite' },
    { key: 58, name: 'Detener ACO', category: 'Babysite' },
    { key: 59, name: 'Comenzar Preparación', category: 'Babysite' },
    { key: 60, name: 'Detener Preparación', category: 'Babysite' },
    { key: 61, name: 'Enviar a Transfer', category: 'Babysite' },
    { key: 62, name: 'Registrar Beta', category: 'Babysite' },
    { key: 63, name: 'Registrar Saco Gestacional', category: 'Babysite' },
    { key: 64, name: 'Registrar Latido', category: 'Babysite' },
    { key: 65, name: 'Confirmar GESTA', category: 'Babysite' },
    { key: 66, name: 'Comenzar SDG GESTA', category: 'Babysite' },
    { key: 67, name: 'Agenda de Seguro', category: 'Babysite' },
    { key: 68, name: 'Listado Egg Donor', category: 'Babysite' },
    { key: 69, name: 'Dash Boards (Egg Donor)', category: 'Babysite' },
    { key: 70, name: 'Inicio', category: 'Recluta' },
    { key: 71, name: 'Agregar etapa', category: 'Babycloud' },
    { key: 72, name: 'Modificar estado', category: 'Babycloud' },
    { key: 73, name: 'Modificar underway', category: 'Babycloud' },
    { key: 74, name: 'Modificar info 1', category: 'Babycloud' },
    { key: 75, name: 'Modificar info 2', category: 'Babycloud' },
    { key: 76, name: 'Subir archivo 1', category: 'Babycloud' },
    { key: 77, name: 'Subir archivo 2', category: 'Babycloud' },
    { key: 78, name: 'Subir archivo 3', category: 'Babycloud' },
    { key: 79, name: 'Habilitar 1', category: 'Babycloud' },
    { key: 80, name: 'Habilitar 2', category: 'Babycloud' },
    { key: 81, name: 'Habilitar 3', category: 'Babycloud' },
    { key: 82, name: 'Habilitar vista de la etapa', category: 'Babycloud' },
    { key: 83, name: 'Historial de actividades', category: 'Babycloud' },
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

// Get unique categories
const categories = [...new Set(accessNames.map((a) => a.category))];

const AccessRoles = () => {
    const navigate = useNavigate();
    // State
    const [allPermissions, setAllPermissions] = useState({});
    const [originalPermissions, setOriginalPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
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

    const handleSetCategoryForProfile = (profileKey, category, value) => {
        setAllPermissions((prev) => {
            const newPerms = { ...prev };
            newPerms[profileKey] = { ...prev[profileKey] };
            accessNames
                .filter((access) => access.category === category)
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

    const hasChanges = () => {
        return JSON.stringify(allPermissions) !== JSON.stringify(originalPermissions);
    };

    const hasChangesForProfile = (profileKey) => {
        return JSON.stringify(allPermissions[profileKey]) !== JSON.stringify(originalPermissions[profileKey]);
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
                                                        onClick={() => handleSetCategoryForProfile(profile.key, category, 0)}
                                                        title="Sin acceso"
                                                    >
                                                        <CIcon icon={cilLockLocked} />
                                                    </CButton>
                                                    <CButton
                                                        color="warning"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleSetCategoryForProfile(profile.key, category, 1)}
                                                        title="Solo ver"
                                                    >
                                                        <CIcon icon={cilLockUnlocked} />
                                                    </CButton>
                                                    <CButton
                                                        color="success"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleSetCategoryForProfile(profile.key, category, 2)}
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
                                        </CCardBody>
                                    </CCard>
                                ))}

                                {filteredAccess.length === 0 && (
                                    <div className="text-center py-4 text-muted">
                                        No se encontraron permisos con ese criterio de búsqueda
                                    </div>
                                )}
                            </CTabPane>
                        ))}
                    </CTabContent>

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

export default AccessRoles;