// src/views/pages/unauthorized/Unauthorized.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CButton,
  CCol,
  CContainer,
  CRow,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilLockLocked, cilArrowLeft } from '@coreui/icons';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={6}>
            <div className="clearfix text-center">
              <CIcon icon={cilLockLocked} size="4xl" className="text-danger mb-4" />
              <h1 className="display-3 me-4">403</h1>
              <h4 className="pt-3">Acceso Denegado</h4>
              <p className="text-body-secondary">
                No tienes permiso para acceder a esta página.
                <br />
                Contacta al administrador si crees que esto es un error.
              </p>
              <CButton
                color="primary"
                className="mt-3"
                onClick={() => navigate('/dashboard')}
              >
                <CIcon icon={cilArrowLeft} className="me-2" />
                Volver al Inicio
              </CButton>
            </div>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  );
};

export default Unauthorized;