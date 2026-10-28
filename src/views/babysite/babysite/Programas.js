// frontend/src/views/babysite/babysite/Programas.js
// Baby site → "Programas" (below "Listado de seguros" in the sidebar).
// Visible with permission access_96 (PERMISSIONS.LIST_PROGRAMS).
// The content (Crioembrio, Donante, Material genético, Gestante — access_41..45)
// is still to be defined; for now the page shows the same top bar as the other
// Baby site lists and an empty state.

import React from 'react';
import { CContainer, CCard, CCardBody } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilLayers } from '@coreui/icons';

const PINK = '#d97ea1';

const Programas = () => (
  <CContainer fluid>
    <CCard className="mb-4">
      {/* ── Top bar: same layout as Listado de seguros ── */}
      <div className="px-3 py-2 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex align-items-baseline gap-2">
          <strong>Programas</strong>
          <span className="text-muted" style={{ fontSize: '0.78rem' }}>0 registros</span>
        </div>
      </div>

      <CCardBody className="text-center py-5">
        <CIcon icon={cilLayers} size="3xl" style={{ color: PINK, opacity: 0.6 }} />
        <h6 className="mt-3 mb-1">Sección en construcción</h6>
        <p className="text-muted small mb-0">
          Aquí se mostrarán los programas. Su contenido se definirá próximamente.
        </p>
      </CCardBody>
    </CCard>
  </CContainer>
);

export default Programas;