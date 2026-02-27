// src/views/pages/sortGes/sortGesList.js
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
  CSpinner,
  CAlert,
  CInputGroup,
  CInputGroupText,
  CBadge,
  CAvatar,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilSearch,
  cilPlus,
  cilArrowTop,
  cilArrowBottom,
  cilFolder,
  cilFile,
} from '@coreui/icons';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const SortGesList = () => {
  const navigate = useNavigate();

  // Data state
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search and sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'nombre', direction: 'asc' });

  // Alert state
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  // Status options with colors
  const statusOptions = {
    iniciales: { label: 'Iniciales', color: 'info' },
    en_proceso: { label: 'En Proceso', color: 'warning' },
    aprobado: { label: 'Aprobado', color: 'success' },
    rechazado: { label: 'Rechazado', color: 'danger' },
    pendiente: { label: 'Pendiente', color: 'secondary' },
  };

  // Fetch candidates on mount
  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API endpoint
      // const res = await api.get('/api/sort-ges', { withCredentials: true });
      // setCandidates(res.data);
      
      // Mock data for development
      const mockData = [
        {
          id: 1,
          nombre: 'Maria',
          apellido: 'de Las Flores Vasquez',
          fecha_nacimiento: '1990-05-15',
          peso: 65,
          altura: 1.65,
          partos: 2,
          hijos: 2,
          cesareas: 0,
          abortos: 0,
          tipo_sangre: 'O+',
          metodo_aco: 'DIU Cobre',
          adm: 'Completo',
          select_progr: 'Programa A',
          esquema: '$400,000.00',
          programa: 'GES Principal',
          status: 'iniciales',
          foto: 'https://randomuser.me/api/portraits/women/1.jpg',
          ip_responsable: 'Ronaldo Fenomeno',
          direccion: 'Calle de la Gloria Altiva 36 Lote 5',
          ciudad: 'Miguel Hidalgo',
          estado: 'Mexico',
          cp: '25001',
          telefono: '+52 5514789658',
        },
        {
          id: 2,
          nombre: 'Ana',
          apellido: 'García López',
          fecha_nacimiento: '1988-08-22',
          peso: 58,
          altura: 1.60,
          partos: 1,
          hijos: 1,
          cesareas: 1,
          abortos: 0,
          tipo_sangre: 'A+',
          metodo_aco: 'Pastillas',
          adm: 'Pendiente',
          select_progr: 'Programa B',
          esquema: '$375,000.00',
          programa: 'GES Secundario',
          status: 'en_proceso',
          foto: 'https://randomuser.me/api/portraits/women/2.jpg',
          ip_responsable: 'Carlos Mendez',
          direccion: 'Av. Reforma 123',
          ciudad: 'Benito Juarez',
          estado: 'CDMX',
          cp: '03100',
          telefono: '+52 5512345678',
        },
      ];
      setCandidates(mockData);
      setError(null);
    } catch (err) {
      console.error('Error fetching candidates:', err);
      setError('Error al cargar los candidatos');
    } finally {
      setLoading(false);
    }
  };

  // Show notification
  const showNotification = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

  // Calculate age from birth date
  const calculateAge = (fechaNacimiento) => {
    if (!fechaNacimiento) return '-';
    const today = new Date();
    const birthDate = new Date(fechaNacimiento);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Calculate IMC
  const calculateIMC = (peso, altura) => {
    if (!peso || !altura) return '-';
    const imc = peso / (altura * altura);
    return imc.toFixed(1);
  };

  // Get IMC classification
  const getIMCClassification = (imc) => {
    if (imc === '-') return { label: '-', color: 'secondary' };
    const imcValue = parseFloat(imc);
    if (imcValue < 18.5) return { label: 'Bajo peso', color: 'warning' };
    if (imcValue < 23) return { label: 'Normal', color: 'success' };
    if (imcValue < 25) return { label: 'Riesgo', color: 'info' };
    if (imcValue < 30) return { label: 'Sobrepeso', color: 'warning' };
    return { label: 'Obesidad', color: 'danger' };
  };

  // Format P-H-C-A (Partos-Hijos-Cesareas-Abortos)
  const formatPHCA = (candidate) => {
    return `${candidate.partos || 0}-${candidate.hijos || 0}-${candidate.cesareas || 0}-${candidate.abortos || 0}`;
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

  // Filter and sort candidates
  const filteredAndSortedCandidates = useMemo(() => {
    let result = [...candidates];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((candidate) =>
        candidate.nombre?.toLowerCase().includes(term) ||
        candidate.apellido?.toLowerCase().includes(term) ||
        candidate.status?.toLowerCase().includes(term) ||
        candidate.programa?.toLowerCase().includes(term)
      );
    }
    result.sort((a, b) => {
      let aVal = a[sortConfig.key] || '';
      let bVal = b[sortConfig.key] || '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [candidates, searchTerm, sortConfig]);

  // Navigate to detail view
  const handleRowClick = (candidateId) => {
    navigate(`/babysite/sortGes/${candidateId}`);
  };

  // Sortable header component
  const SortableHeader = ({ label, sortKey, style = {} }) => (
    <CTableHeaderCell
      style={{ cursor: 'pointer', userSelect: 'none', ...style }}
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

      <CCard className="mb-4 mx-3">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Listado de Sort_GESC</strong>
          <div className="d-flex align-items-center gap-2">
            <CButton color="light" variant="ghost" className="rounded-circle">
              <CIcon icon={cilFile} />
            </CButton>
            <CButton 
              color="primary" 
              style={{ 
                backgroundColor: '#d97ea1', 
                borderColor: '#d97ea1',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                padding: 0,
              }}
            >
              <CIcon icon={cilPlus} />
            </CButton>
          </div>
        </CCardHeader>
        <CCardBody>
          {/* Search */}
          <CRow className="mb-3">
            <CCol md={6}>
              <CInputGroup>
                <CInputGroupText>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>
                <CFormInput
                  placeholder="Buscar por nombre, apellido, status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </CInputGroup>
            </CCol>
          </CRow>

          {/* Candidates table */}
          <div className="table-responsive">
            <CTable hover striped align="middle">
              <CTableHead>
                <CTableRow>
                  <SortableHeader label="Nombre" sortKey="nombre" />
                  <SortableHeader label="Apellido" sortKey="apellido" />
                  <SortableHeader label="Edad" sortKey="fecha_nacimiento" style={{ width: '70px' }} />
                  <CTableHeaderCell style={{ width: '100px' }}>IMC</CTableHeaderCell>
                  <CTableHeaderCell style={{ width: '100px' }}>P-H-C-A</CTableHeaderCell>
                  <SortableHeader label="(RH)" sortKey="tipo_sangre" style={{ width: '70px' }} />
                  <SortableHeader label=">ACO" sortKey="metodo_aco" />
                  <SortableHeader label="ADM" sortKey="adm" style={{ width: '90px' }} />
                  <SortableHeader label="Select Progr" sortKey="select_progr" />
                  <SortableHeader label="Esquema" sortKey="esquema" />
                  <SortableHeader label="Programa" sortKey="programa" />
                  <SortableHeader label="Status" sortKey="status" />
                  <CTableHeaderCell style={{ width: '70px' }}>Folder</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {filteredAndSortedCandidates.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={13} className="text-center py-4">
                      {searchTerm ? 'No se encontraron candidatos' : 'No hay candidatos registrados'}
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  filteredAndSortedCandidates.map((candidate) => {
                    const imc = calculateIMC(candidate.peso, candidate.altura);
                    const imcClass = getIMCClassification(imc);
                    const statusInfo = statusOptions[candidate.status] || { label: candidate.status, color: 'secondary' };
                    
                    return (
                      <CTableRow key={candidate.id}>
                        {/* Nombre - clickable */}
                        <CTableDataCell>
                          <Link
                            to={`/babysite/sortGes/${candidate.id}`}
                            className="text-decoration-none"
                            style={{ color: '#5856d6', fontWeight: 500 }}
                          >
                            {candidate.nombre}
                          </Link>
                        </CTableDataCell>
                        
                        {/* Apellido */}
                        <CTableDataCell>{candidate.apellido}</CTableDataCell>
                        
                        {/* Edad */}
                        <CTableDataCell>{calculateAge(candidate.fecha_nacimiento)}</CTableDataCell>
                        
                        {/* IMC */}
                        <CTableDataCell>
                          <div className="d-flex align-items-center gap-1">
                            <span>{imc}</span>
                            <CBadge color={imcClass.color} size="sm">{imcClass.label}</CBadge>
                          </div>
                        </CTableDataCell>
                        
                        {/* P-H-C-A */}
                        <CTableDataCell>
                          <code>{formatPHCA(candidate)}</code>
                        </CTableDataCell>
                        
                        {/* RH (Tipo de sangre) */}
                        <CTableDataCell>
                          <CBadge color="danger">{candidate.tipo_sangre || '-'}</CBadge>
                        </CTableDataCell>
                        
                        {/* >ACO */}
                        <CTableDataCell>{candidate.metodo_aco || '-'}</CTableDataCell>
                        
                        {/* ADM */}
                        <CTableDataCell>
                          <CBadge color={candidate.adm === 'Completo' ? 'success' : 'warning'}>
                            {candidate.adm || '-'}
                          </CBadge>
                        </CTableDataCell>
                        
                        {/* Select Progr */}
                        <CTableDataCell>{candidate.select_progr || '-'}</CTableDataCell>
                        
                        {/* Esquema */}
                        <CTableDataCell>{candidate.esquema || '-'}</CTableDataCell>
                        
                        {/* Programa */}
                        <CTableDataCell>{candidate.programa || '-'}</CTableDataCell>
                        
                        {/* Status */}
                        <CTableDataCell>
                          <Link 
                            to={`/babysite/sortGes/${candidate.id}`}
                            className="text-decoration-none"
                          >
                            <CBadge 
                              color={statusInfo.color}
                              style={{ cursor: 'pointer' }}
                            >
                              {statusInfo.label}
                            </CBadge>
                          </Link>
                        </CTableDataCell>
                        
                        {/* Folder */}
                        <CTableDataCell>
                          <CButton
                            color="info"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRowClick(candidate.id)}
                          >
                            <CIcon icon={cilFolder} />
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    );
                  })
                )}
              </CTableBody>
            </CTable>
          </div>

          <div className="text-muted small mt-2">
            Mostrando {filteredAndSortedCandidates.length} de {candidates.length} candidatos
          </div>
        </CCardBody>
      </CCard>
    </CContainer>
  );
};

export default SortGesList;