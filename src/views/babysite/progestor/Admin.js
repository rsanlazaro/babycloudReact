import React from 'react';
import { Link } from 'react-router-dom';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CRow,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilChartLine,
  cilDescription,
} from '@coreui/icons';

import usePermissions from '../../../hooks/usePermissions';

const Admin = () => {

  const { reports } = usePermissions();
  const canViewMedical = reports.medical.visible;
  const canEditMedical = reports.medical.editable;
  const canViewItinerary = reports.itinerary.visible;
  const canEditItinerary = reports.itinerary.editable;
  const canViewInvoiceTMC = reports.invoiceTMC.visible;
  const canEditInvoiceTMC = reports.invoiceTMC.editable;
  const canViewInvoiceNexa = reports.invoiceNexa.visible;
  const canEditInvoiceNexa = reports.invoiceNexa.editable;
  const canViewInvoiceBabymedic = reports.invoiceBabymedic.visible;
  const canEditInvoiceBabymedic = reports.invoiceBabymedic.editable;

  const sections = [
    {
      title: 'Reportes',
      description: 'Generación y consulta de reportes del sistema',
      icon: cilChartLine,
      path: '/progestor/admin/reports',
      color: 'primary',
      visible: canViewMedical || canViewItinerary,
      editable: canEditMedical || canEditItinerary,
    },
    {
      title: 'Facturas',
      description: 'Gestión y generación de facturas',
      icon: cilDescription,
      path: '/progestor/admin/bills',
      color: 'success',
      visible: canViewInvoiceTMC || canViewInvoiceNexa || canViewInvoiceBabymedic,
      editable: canEditInvoiceTMC || canEditInvoiceNexa || canEditInvoiceBabymedic,
    },
  ];

  return (
    <CContainer lg>
      <CCard className="mb-4">
        <CCardHeader>
          <strong>Reportes y facturas</strong>
          <div className="small text-muted">
            Selecciona una sección para continuar
          </div>
        </CCardHeader>
        <CCardBody>
          <CRow className="g-4">
            {sections.map((section) => (
              section.visible ?
                <CCol key={section.path} xs={12} sm={6} lg={4}>
                  <Link to={!section.editable ? '' : section.path} style={!section.editable ? { opacity: 0.5, textDecoration: 'none', cursor: 'auto' } : { textDecoration: 'none' }}>
                    <CCard
                      className={!section.editable ? "h-100 border-top-3" : "h-100 border-top-3 hover-card"}
                      style={!section.editable ? { borderTopColor: `var(--cui-${section.color})` } : {
                        borderTopColor: `var(--cui-${section.color})`,
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                      }}
                    >
                      <CCardBody className="text-center py-4">
                        <div
                          className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-3`}
                          style={{
                            width: '64px',
                            height: '64px',
                            backgroundColor: `var(--cui-${section.color}-bg-subtle)`,
                          }}
                        >
                          <CIcon
                            icon={section.icon}
                            size="xl"
                            style={{ color: `var(--cui-${section.color})` }}
                          />
                        </div>
                        <h5 className="mb-2">{section.title}</h5>
                        <p className="text-muted mb-0 small">
                          {section.description}
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

export default Admin;