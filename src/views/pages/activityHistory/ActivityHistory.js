import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
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
  CPagination,
  CPaginationItem,
  CBadge,
  CSpinner,
  CCollapse,
  CContainer,
} from '@coreui/react';
import { cilFilter, cilReload } from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import { useUser } from '../../../context/AuthContext';
import usePermissions from '../../../hooks/usePermissions';
import api from '../../../services/api';

const ActivityHistory = () => {
  const navigate = useNavigate();
  const { history } = usePermissions();

  const canView = history.activity.visible;
  const canEdit = history.activity.editable;

  const filtersDisabled = !canEdit;

  useEffect(() => {
    if (!canView) {
      navigate('/dashboard', { replace: true });
    }
  }, [canView, navigate]);

  const [activities, setActivities] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // Filter states
  const [filters, setFilters] = useState({
    userId: '',
    activityType: '',
    entityType: '',
    startDate: '',
    endDate: '',
    searchTerm: ''
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  // Fetch users for dropdown
  useEffect(() => {
    if (canEdit) {
      fetchUsers();
    }
  }, [canEdit]);

  // Fetch activities when filters change
  useEffect(() => {
    if (canEdit) {
      fetchActivities();
    }
  }, [currentPage, filters, canEdit]);

  const fetchUsers = async () => {
    try {
      // Replace with your actual API endpoint
      const response = await api.get('/api/users', { withCredentials: true });
      const data = response.data;
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(
        Object.entries({
          page: currentPage,
          limit: itemsPerPage,
          ...filters,
        }).filter(([_, v]) => v !== '')
      );

      const response = await api.get(
        `/api/logs?${queryParams}`,
        { withCredentials: true }
      );

      console.log(response);
      console.log(response.data);
      console.log(response.data.length);

      setActivities(response.data.data || []);
      setTotalPages(Math.ceil(response.data.total / itemsPerPage));
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleResetFilters = () => {
    setFilters({
      userId: '',
      activityType: '',
      entityType: '',
      startDate: '',
      endDate: '',
      searchTerm: ''
    });
    setCurrentPage(1);
  };

  const getActivityBadge = (type) => {
    const colors = {
      login: 'info',
      create: 'success',
      update: 'warning',
      delete: 'danger',
      logout: 'secondary'
    };
    return <CBadge color={colors[type] || 'primary'}>{type}</CBadge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const exportToCSV = () => {
    const headers = ['Date', 'User', 'Activity', 'Entity', 'Description'];

    const csvData = activities.map(act => [
      formatDate(act.created_at),
      act.username || '',
      act.activity_type,
      act.entity_type || '-',
      act.description || ''
    ]);

    const csvContent =
      '\uFEFF' + // 👈 UTF-8 BOM (CRITICAL)
      [
        headers.join(','),
        ...csvData.map(row =>
          row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        )
      ].join('\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;'
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-history-${new Date().toISOString()}.csv`;
    a.click();
  };


  return (
    <CContainer lg>
      <CCard className="mb-4">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Historial de actividad</strong>
          <div>
            <CButton
              disabled={filtersDisabled}
              color="primary"
              className="me-2 app-button"
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <CIcon icon={cilFilter} className="me-1" />
              {showFilters ? 'Hide' : 'Show'} Filtros
            </CButton>
            <CButton
              disabled={filtersDisabled}
              color="secondary"
              variant="outline"
              size="sm"
              className="me-2 app-button"
              onClick={fetchActivities}
            >
              <CIcon icon={cilReload} className="me-1" />
              Refrescar
            </CButton>
            <CButton
              disabled={filtersDisabled}
              color="success"
              variant="outline"
              className='app-button'
              size="sm"
              onClick={exportToCSV}
            >
              Exportar CSV
            </CButton>
          </div>
        </CCardHeader>

        <CCardBody>
          {canEdit && (
            <CCollapse visible={showFilters}>
              <CRow className="mb-3">
                <CCol md={3}>
                  <CFormSelect
                    disabled={filtersDisabled}
                    label="User"
                    value={filters.userId}
                    onChange={(e) => handleFilterChange('userId', e.target.value)}
                  >
                    <option value="">Todos los usuarios</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.username}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormSelect
                    disabled={filtersDisabled}
                    label="Tipo de actividad"
                    value={filters.activityType}
                    onChange={(e) => handleFilterChange('activityType', e.target.value)}
                  >
                    <option value="">Todas las actividades</option>
                    <option value="login">Inicio de sesión</option>
                    <option value="logout">Cierre de sesión</option>
                    <option value="create">Creación</option>
                    <option value="update">Modificación</option>
                    <option value="delete">Eliminación</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormInput
                    disabled={filtersDisabled}
                    type="date"
                    label="Inicio de fecha"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                </CCol>

                <CCol md={3}>
                  <CFormInput
                    disabled={filtersDisabled}
                    type="date"
                    label="Fin de fecha"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormInput
                    disabled={filtersDisabled}
                    type="text"
                    label="Descripción"
                    placeholder="Busca en las descripciones..."
                    value={filters.searchTerm}
                    onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  />
                </CCol>

                <CCol md={3}>
                  <CFormSelect
                    disabled={filtersDisabled}
                    label="Tipo de sección"
                    value={filters.entityType}
                    onChange={(e) => handleFilterChange('entityType', e.target.value)}
                  >
                    <option value="">Todas las secciones</option>
                    <option value="progestor">Pro gestor</option>
                    <option value="babysite">Baby site</option>
                    <option value="recluta">Recluta</option>
                    <option value="operador">Operador</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3} className="d-flex align-items-end">
                  <CButton
                    disabled={filtersDisabled}
                    color="secondary"
                    variant="outline"
                    className="w-100"
                    onClick={handleResetFilters}
                  >
                    Resetear Filtros
                  </CButton>
                </CCol>
              </CRow>
            </CCollapse>
          )}

          {loading ? (
            <div className="text-center py-5">
              <CSpinner color="primary" />
            </div>
          ) : (
            <>
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Fecha y hora</CTableHeaderCell>
                    <CTableHeaderCell>Usuario</CTableHeaderCell>
                    <CTableHeaderCell>Actividad</CTableHeaderCell>
                    <CTableHeaderCell>Sección</CTableHeaderCell>
                    <CTableHeaderCell>Descripción</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {!canEdit ? (
                    <CTableRow>
                      <CTableDataCell colSpan="6" className="text-center">
                        No tienes los permisos necesarios
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    activities.length === 0 ? (
                      <CTableRow>
                        <CTableDataCell colSpan="6" className="text-center">
                          No se encontraron registros
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      activities.map((activity) => (
                        <CTableRow key={activity.id}>
                          <CTableDataCell>{formatDate(activity.created_at)}</CTableDataCell>
                          <CTableDataCell>
                            <strong>{activity.username}</strong>
                            <br />
                            <small className="text-muted">{activity.email}</small>
                          </CTableDataCell>
                          <CTableDataCell>
                            {getActivityBadge(activity.activity_type)}
                          </CTableDataCell>
                          <CTableDataCell>
                            {activity.entity_type ? (
                              <>
                                {activity.entity_type}
                              </>
                            ) : (
                              '-'
                            )}
                          </CTableDataCell>
                          <CTableDataCell>{activity.description}</CTableDataCell>
                        </CTableRow>
                      ))
                    )
                  )}
                </CTableBody>
              </CTable>

              {totalPages > 1 && (
                <CPagination className="justify-content-center mt-3">
                  <CPaginationItem
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previo
                  </CPaginationItem>

                  {[...Array(totalPages)].map((_, i) => (
                    <CPaginationItem
                      key={i + 1}
                      active={currentPage === i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </CPaginationItem>
                  ))}

                  <CPaginationItem
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Siguiente
                  </CPaginationItem>
                </CPagination>
              )}
            </>
          )}
        </CCardBody>
      </CCard>
      <style>{`
              .hover-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
              }
              .border-top-3 {
                border-top-width: 3px !important;
                border-top-style: solid !important;
              }
            `}</style>
    </CContainer>
  );
};

export default ActivityHistory;