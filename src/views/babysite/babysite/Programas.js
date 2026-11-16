// frontend/src/views/babysite/babysite/Programas.js
// Baby site → "Programas" (below Sort_DONA in the sidebar).
// Visible with permission access_96 (PERMISSIONS.LIST_PROGRAMS).
//
// Same look as the other Baby site lists (Sort_GESCA, Sort_IPS):
//   · Icon tabs outside the card: Sin Asignar · Prepa Transfer · Embarazo · Registro
//   · Card top bar: view (GESCA's · IPS · Pendiente) + count (left), search (right)
//   · Table: SAG · GESCA · Meet · Vínculo · Valoración (Dr.) · Iniciales · Programa ·
//            Cita Previa · Status · Liberación · Asignar · Asignación
// Layout only: rows, filters and actions will be wired once their rules are defined.

import React, { useState } from 'react';
import {
  CContainer, CCard, CCardBody, CTable, CTableHead, CTableBody, CTableRow, CTableHeaderCell, CTableDataCell,
  CInputGroup, CInputGroupText, CFormInput, CButtonGroup, CButton,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilClock, cilEyedropper, cilBabyCarriage, cilBalanceScale, cilUserFemale, cilUser, cilPeople, cilSearch, cilLayers,
} from '@coreui/icons';

const PINK = '#d97ea1';

// Icon tabs (same look as Sort_GESCA / Sort_IPS)
const TABS = [
  { id: 'sin-asignar', label: 'Sin Asignar', icon: cilClock, color: '#e03a3a' },
  { id: 'prepa-transfer', label: 'Prepa Transfer', icon: cilEyedropper, color: '#9b51e0' },
  { id: 'embarazo', label: 'Embarazo', icon: cilBabyCarriage, color: '#f0a020' },
  { id: 'registro', label: 'Registro', icon: cilBalanceScale, color: '#1f7a64' },
];

// Views of the table
const VISTAS = [
  { id: 'gesca', label: "GESCA's", icon: cilUserFemale },
  { id: 'ips', label: 'IPS', icon: cilUser },
  { id: 'pendiente', label: 'Pendiente', icon: cilPeople },
];

const COLUMNS = [
  'SAG', 'GESCA', 'Meet', 'Vínculo', 'Valoración (Dr.)', 'Iniciales', 'Programa',
  'Cita Previa', 'Status', 'Liberación', 'Asignar', 'Asignación',
];

const Programas = () => {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [vista, setVista] = useState(VISTAS[0].id);
  const [searchTerm, setSearchTerm] = useState('');
  const tab = TABS.find(t => t.id === activeTab);
  const rows = [];   // to be loaded once the content is defined

  return (
    <CContainer fluid>
      {/* ── Icon tabs — outside the table card ── */}
      <div className="prog-icon-tabs mb-3" role="tablist" aria-label="Etapas de Programas">
        {TABS.map(t => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id} type="button" role="tab" aria-selected={active}
              className={`prog-icon-tab${active ? ' is-active' : ''}`} style={{ '--tab-color': t.color }}
              onClick={() => setActiveTab(t.id)}
            >
              <span className="prog-icon-tab__circle">
                <CIcon icon={t.icon} className="prog-icon-tab__icon" />
              </span>
              <span className="prog-icon-tab__label">{t.label}</span>
            </button>
          );
        })}
      </div>

      <CCard className="mb-4">
        {/* ── Card top bar: view + count (left) + search (right) ── */}
        <div className="px-3 py-2 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <CButtonGroup size="sm" role="tablist" aria-label="Vista de la tabla">
              {VISTAS.map(v => (
                <CButton
                  key={v.id} role="tab" aria-selected={vista === v.id}
                  color="secondary" variant={vista === v.id ? undefined : 'outline'}
                  className="prog-vista" onClick={() => setVista(v.id)}
                >
                  <CIcon icon={v.icon} className="me-1" />{v.label}
                </CButton>
              ))}
            </CButtonGroup>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>{rows.length} registros</span>
          </div>
          <CInputGroup size="sm" style={{ width: '220px' }}>
            <CInputGroupText style={{ backgroundColor: '#fff', borderRight: 'none' }}>
              <CIcon icon={cilSearch} style={{ color: PINK }} />
            </CInputGroupText>
            <CFormInput
              placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              autoComplete="off" style={{ borderLeft: 'none' }} aria-label="Buscar en Programas"
            />
          </CInputGroup>
        </div>

        <CCardBody className="p-0">
          <CTable hover striped align="middle" responsive className="nowrap-table mb-0">
            <CTableHead color="light">
              <CTableRow>
                {COLUMNS.map(c => <CTableHeaderCell key={c}>{c}</CTableHeaderCell>)}
              </CTableRow>
            </CTableHead>
            <CTableBody>
              <CTableRow>
                <CTableDataCell colSpan={COLUMNS.length} className="text-center py-5 text-muted">
                  <CIcon icon={cilLayers} size="xl" style={{ color: tab.color, opacity: 0.6 }} />
                  <div className="mt-2 small">
                    {tab.label} · {VISTAS.find(v => v.id === vista).label}: el contenido se definirá próximamente.
                  </div>
                </CTableDataCell>
              </CTableRow>
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      <style>{`
        .nowrap-table th, .nowrap-table td { white-space: nowrap; vertical-align: middle; }
        .prog-vista { display: inline-flex; align-items: center; font-weight: 600; }

        /* ── Icon tabs (same look as Sort_GESCA / Sort_IPS) ── */
        .prog-icon-tabs { display: flex; flex-wrap: wrap; gap: 0.5rem 2rem; }
        .prog-icon-tab {
          display: flex; flex-direction: column; align-items: center; gap: 0.35rem;
          min-width: 88px; padding: 0.25rem 0.5rem;
          background: none; border: none; cursor: pointer; color: var(--tab-color);
        }
        .prog-icon-tab:focus-visible { outline: 2px solid var(--tab-color); outline-offset: 2px; border-radius: 0.5rem; }
        .prog-icon-tab__circle {
          width: 52px; height: 52px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid color-mix(in srgb, var(--tab-color) 55%, transparent);
          background: color-mix(in srgb, var(--tab-color) 8%, var(--cui-body-bg, #fff));
          transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
        }
        .prog-icon-tab__icon {
          width: 26px !important; height: 26px !important;
          color: var(--tab-color); opacity: 0.75; transition: color 0.2s ease, opacity 0.2s ease;
        }
        .prog-icon-tab__label { font-size: 0.9rem; font-weight: 600; opacity: 0.7; white-space: nowrap; transition: opacity 0.2s ease; }
        .prog-icon-tab:hover .prog-icon-tab__circle { border-color: var(--tab-color); transform: translateY(-2px); }
        .prog-icon-tab:hover .prog-icon-tab__icon, .prog-icon-tab:hover .prog-icon-tab__label { opacity: 1; }
        .prog-icon-tab.is-active .prog-icon-tab__circle {
          background: var(--tab-color); border-color: var(--tab-color);
          box-shadow: 0 4px 12px color-mix(in srgb, var(--tab-color) 40%, transparent);
        }
        .prog-icon-tab.is-active .prog-icon-tab__icon { color: #fff; opacity: 1; }
        .prog-icon-tab.is-active .prog-icon-tab__label { opacity: 1; font-weight: 800; }
        @media (prefers-reduced-motion: reduce) { .prog-icon-tab__circle { transition: none; } }
      `}</style>
    </CContainer>
  );
};

export default Programas;