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
  cilHospital,
  cilAirplaneMode,
  cilBaby,
} from '@coreui/icons';

import usePermissions from '../../../hooks/usePermissions';

const Bills = () => {
  const navigate = useNavigate();
  const { reports } = usePermissions();

  const canViewinvoiceTMC = reports.invoiceTMC.visible;
  const canEditinvoiceTMC = reports.invoiceTMC.editable;
  const canViewinvoiceNexa = reports.invoiceNexa.visible;
  const canEditinvoiceNexa = reports.invoiceNexa.editable;
  const canViewinvoiceBabymedic = reports.invoiceBabymedic.visible;
  const canEditinvoiceBabymedic = reports.invoiceBabymedic.editable;

  const bills = [
    {
      title: 'Travel Medical Care',
      description: 'Generación de facturas Travel Medical Care',
      icon: cilHospital,
      path: '/progestor/admin/bills/travelmedicalcare',
      color: 'primary',
      visible: canViewinvoiceTMC,
      editable: canEditinvoiceTMC,
    },
    {
      title: 'Nexa Travel',
      description: 'Generación de facturas Nexa Travel',
      icon: cilAirplaneMode,
      path: '/progestor/admin/bills/nexatravel',
      color: 'warning',
      visible: canViewinvoiceNexa,
      editable: canEditinvoiceNexa,
    },
    {
      title: 'Babymedic',
      description: 'Generación de facturas Babymedic',
      icon: cilBaby,
      path: '/progestor/admin/bills/babymedic',
      color: 'success',
      visible: canViewinvoiceBabymedic,
      editable: canEditinvoiceBabymedic,
    },
  ];

  // Redirect if no view permission
  useEffect(() => {
    if (!canViewinvoiceBabymedic && !canViewinvoiceNexa && !canViewinvoiceTMC ) {
      navigate('/progestor/admin');
    }
  }, [canViewinvoiceBabymedic, navigate]);

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
                  <strong>Facturas</strong>
                  <div className="small text-muted">
                    Selecciona el tipo de factura a generar
                  </div>
                </div>
              </div>
            </CCol>
          </CRow>
        </CCardHeader>
        <CCardBody>
          <CRow className="g-4">
            {bills.map((bill) => (
              bill.visible ?
                <CCol key={bill.path} xs={12} sm={6} lg={4}>
                  <Link to={!bill.editable ? '' : bill.path} style={!bill.editable ? { opacity: 0.5, textDecoration: 'none', cursor: 'auto' } : { textDecoration: 'none' }}>
                    <CCard
                      className={!bill.editable ? "h-100 border-top-3" : "h-100 border-top-3 hover-card"}
                      style={!bill.editable ? { borderTopColor: `var(--cui-${bill.color})` } : {
                        borderTopColor: `var(--cui-${bill.color})`,
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
                            backgroundColor: `var(--cui-${bill.color}-bg-subtle)`,
                          }}
                        >
                          <CIcon
                            icon={bill.icon}
                            size="xl"
                            style={{ color: `var(--cui-${bill.color})` }}
                          />
                        </div>
                        <h5 className="mb-2">{bill.title}</h5>
                        <p className="text-muted mb-0 small">
                          {bill.description}
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

export default Bills;