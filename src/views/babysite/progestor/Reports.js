import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CRow,
  CButton,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilArrowLeft,
  cilMedicalCross,
  cilAirplaneMode,
} from '@coreui/icons';

import usePermissions from '../../../hooks/usePermissions';

const Reports = () => {
  const navigate = useNavigate();
  const { reports } = usePermissions();

  const canViewMedical = reports.medical.visible;
  const canEditMedical = reports.medical.editable;
  const canViewItinerary = reports.itinerary.visible;
  const canEditItinerary = reports.itinerary.editable;

  const reportsSections = [
    {
      title: 'Reporte Médico',
      description: 'Generación de reportes médicos para pacientes',
      icon: cilMedicalCross,
      path: '/progestor/admin/reports/medical',
      color: 'danger',
      visible: canViewMedical,
      editable: canEditMedical,
    },
    {
      title: 'Itinerary Babymedic',
      description: 'Generación de itinerarios Babymedic',
      icon: cilAirplaneMode,
      path: '/progestor/admin/reports/itinerary-babymedic',
      color: 'info',
      visible: canViewItinerary,
      editable: canEditItinerary,
    },
  ];

  // Redirect if no view permission
  useEffect(() => {
    if (!canViewMedical && !canViewItinerary ) {
      navigate('/progestor/admin');
    }
  }, [canViewMedical, navigate]);

  return (
    <CContainer lg>
      <CCard className="mb-4">
        <CCardHeader>
          <CRow className="align-items-center">
            <CCol>
              <div className="d-flex align-items-center">
                <CButton
                  color="secondary"
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/progestor/admin')}
                  className="me-3"
                >
                  <CIcon icon={cilArrowLeft} />
                </CButton>
                <div>
                  <strong>Reportes</strong>
                  <div className="small text-muted">
                    Selecciona el tipo de reporte a generar
                  </div>
                </div>
              </div>
            </CCol>
          </CRow>
        </CCardHeader>
        <CCardBody>
          <CRow className="g-4">
            {reportsSections.map((report) => (
              report.visible ?
                <CCol key={report.path} xs={12} sm={6} lg={4}>
                  <Link to={!report.editable ? '' : report.path} style={!report.editable ? { opacity: 0.5, textDecoration: 'none', cursor: 'auto' } : { textDecoration: 'none' }}>
                    <CCard
                      className={!report.editable ? "h-100 border-top-3" : "h-100 border-top-3 hover-card"}
                      style={!report.editable ? { borderTopColor: `var(--cui-${report.color})` } : {
                        borderTopColor: `var(--cui-${report.color})`,
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                      }}
                    >
                      <CCardBody className="text-center py-4">
                        <div
                          className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                          style={{
                            width: '64px',
                            height: '64px',
                            backgroundColor: `var(--cui-${report.color}-bg-subtle)`,
                          }}
                        >
                          <CIcon
                            icon={report.icon}
                            size="xl"
                            style={{ color: `var(--cui-${report.color})` }}
                          />
                        </div>
                        <h5 className="mb-2">{report.title}</h5>
                        <p className="text-muted mb-0 small">
                          {report.description}
                        </p>
                      </CCardBody>
                    </CCard>
                  </Link>
                </CCol> : null
            ))}
          </CRow>
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

export default Reports;