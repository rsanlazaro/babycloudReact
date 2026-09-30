// frontend/src/views/babysite/babysite/SortIPList.js
// Baby site → Sort_IPS: list of IP registers with six icon tabs (views).
// Tabs, columns and fields are configured in src/config/sortIpSections.js.

import React, { useState, useEffect, useMemo } from 'react';
import {
  CContainer, CCard, CCardBody, CAlert, CButton, CBadge, CSpinner,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CInputGroup, CInputGroupText, CFormInput, CFormLabel, CFormSelect,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CRow, CCol,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilSearch, cilPlus } from '@coreui/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useUser } from '../../../context/AuthContext';
import PERMISSIONS from '../../../config/permissions';
import { IP_LIST_TABS, formatDate } from '../../../config/sortIpSections';

const PINK = '#d97ea1';
const EMPTY_FORM = { nombre_completo: '', email: '', telefono: '', pais: '', guest_id: '' };

const renderCell = (col, ip) => {
  const v = col.value(ip);
  if (v === null || v === undefined || v === '') return <span className="text-muted">—</span>;
  if (col.type === 'date') return formatDate(v);
  if (col.type === 'badge') return <CBadge color="light" textColor="dark" className="border">{String(v)}</CBadge>;
  return String(v);
};

const SortIPList = () => {
  const navigate = useNavigate();
  const { canView } = useUser();
  const canCreate = canView(PERMISSIONS.CREATE_SORT_IP);

  const [ips, setIps]               = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [activeTab, setActiveTab]   = useState(IP_LIST_TABS[0].id);
  const [searchTerm, setSearchTerm] = useState('');

  // New register
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [guests, setGuests]         = useState([]);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState('');

  const fetchIps = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/sort-ip', { withCredentials: true });
      setIps(res.data || []);
      setError('');
    } catch (err) {
      console.error('Error loading Sort_IPS:', err);
      setError('Error al cargar el listado de IPs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIps(); }, []);

  const tab = IP_LIST_TABS.find(t => t.id === activeTab);

  // Tab filter + search over name, contact data and gestante
  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return ips
      .filter(ip => (tab.filter ? tab.filter(ip) : true))
      .filter(ip => !term || [
        ip.nombre_completo, ip.guest_username, ip.guest_mail, ip.gestante_nombre,
        ip.sections?.alta?.email, ip.sections?.alta?.pais, ip.sections?.alta?.telefono,
      ].some(v => v && String(v).toLowerCase().includes(term)));
  }, [ips, tab, searchTerm]);

  const tabCount = (t) => (t.filter ? ips.filter(t.filter).length : ips.length);

  // ── New register ──────────────────────────────────────────────────────────
  const openCreate = async () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setShowCreate(true);
    try {
      const res = await api.get('/api/sort-ip/guests-available', { withCredentials: true });
      setGuests(res.data || []);
    } catch {
      setGuests([]);
    }
  };

  const handleCreate = async () => {
    if (!form.nombre_completo.trim()) {
      setFormError('El nombre del IP es obligatorio');
      return;
    }
    try {
      setSaving(true);
      setFormError('');
      const res = await api.post('/api/sort-ip', {
        nombre_completo: form.nombre_completo.trim(),
        guest_id: form.guest_id || null,
        alta: { email: form.email.trim(), telefono: form.telefono.trim(), pais: form.pais.trim() },
      }, { withCredentials: true });
      setShowCreate(false);
      navigate(`/babysite/ips/${res.data.id}`);
    } catch (err) {
      console.error('Error creating IP:', err);
      setFormError(err.response?.data?.message || 'Error al crear el registro');
    } finally {
      setSaving(false);
    }
  };

  return (
    <CContainer fluid>
      {/* ── Icon tabs — outside the table card ── */}
      <div className="sortip-icon-tabs mb-3" role="tablist" aria-label="Vistas de Sort_IPS">
        {IP_LIST_TABS.map(t => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`sortip-icon-tab${active ? ' is-active' : ''}`}
              style={{ '--tab-color': t.color }}
              onClick={() => setActiveTab(t.id)}
            >
              <span className="sortip-icon-tab__circle">
                <CIcon icon={t.icon} className="sortip-icon-tab__icon" />
              </span>
              <span className="sortip-icon-tab__label">
                {t.label}
                {t.filter && <span className="sortip-icon-tab__count">{tabCount(t)}</span>}
              </span>
            </button>
          );
        })}
      </div>

      <CCard className="mb-4">
        {/* ── Top bar: count (left) + search/add (right) ── */}
        <div className="px-3 py-2 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
          <span className="text-muted" style={{ fontSize: '0.78rem' }}>
            {filtered.length} de {ips.length} IPs
          </span>
          <div className="d-flex align-items-center gap-2">
            <CInputGroup size="sm" style={{ width: '220px' }}>
              <CInputGroupText style={{ backgroundColor: '#fff', borderRight: 'none' }}>
                <CIcon icon={cilSearch} style={{ color: PINK }} />
              </CInputGroupText>
              <CFormInput
                placeholder="Buscar..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                autoComplete="off"
                style={{ borderLeft: 'none' }}
              />
            </CInputGroup>
            {canCreate && (
              <CButton
                size="sm"
                color="primary"
                onClick={openCreate}
                style={{
                  backgroundColor: PINK, borderColor: PINK,
                  borderRadius: '50%', width: '32px', height: '32px', padding: 0,
                }}
                title="Nuevo IP"
              >
                <CIcon icon={cilPlus} />
              </CButton>
            )}
          </div>
        </div>

        <CCardBody className="p-0">
          {error && <CAlert color="danger" className="m-3">{error}</CAlert>}

          <CTable hover striped align="middle" responsive className="nowrap-table mb-0">
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>IP</CTableHeaderCell>
                {tab.columns.map(c => <CTableHeaderCell key={c.label}>{c.label}</CTableHeaderCell>)}
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {loading ? (
                <CTableRow>
                  <CTableDataCell colSpan={tab.columns.length + 1} className="text-center py-4">
                    <CSpinner size="sm" className="me-2" />Cargando...
                  </CTableDataCell>
                </CTableRow>
              ) : filtered.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={tab.columns.length + 1} className="text-center py-4 text-muted">
                    {ips.length ? 'Sin IPs en esta vista' : 'No hay IPs registrados'}
                  </CTableDataCell>
                </CTableRow>
              ) : filtered.map(ip => (
                <CTableRow
                  key={ip.id}
                  onClick={() => navigate(`/babysite/ips/${ip.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <CTableDataCell><strong>{ip.nombre_completo}</strong></CTableDataCell>
                  {tab.columns.map(c => <CTableDataCell key={c.label}>{renderCell(c, ip)}</CTableDataCell>)}
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      {/* ── New IP ── */}
      <CModal visible={showCreate} onClose={() => setShowCreate(false)} alignment="center">
        <CModalHeader><CModalTitle>Nuevo IP</CModalTitle></CModalHeader>
        <CModalBody>
          {formError && <CAlert color="danger" className="py-2">{formError}</CAlert>}
          <CRow>
            <CCol xs={12} className="mb-3">
              <CFormLabel>Nombre completo *</CFormLabel>
              <CFormInput value={form.nombre_completo} onChange={e => setForm(f => ({ ...f, nombre_completo: e.target.value }))} />
            </CCol>
            <CCol md={6} className="mb-3">
              <CFormLabel>Correo electrónico</CFormLabel>
              <CFormInput type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </CCol>
            <CCol md={6} className="mb-3">
              <CFormLabel>Teléfono</CFormLabel>
              <CFormInput type="tel" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
            </CCol>
            <CCol md={6} className="mb-3">
              <CFormLabel>País</CFormLabel>
              <CFormInput value={form.pais} onChange={e => setForm(f => ({ ...f, pais: e.target.value }))} />
            </CCol>
            <CCol md={6} className="mb-3">
              <CFormLabel>Cuenta Cloud IPS</CFormLabel>
              <CFormSelect value={form.guest_id} onChange={e => setForm(f => ({ ...f, guest_id: e.target.value }))}>
                <option value="">— Sin vincular —</option>
                {guests.map(g => <option key={g.id} value={g.id}>{g.username}{g.mail ? ` (${g.mail})` : ''}</option>)}
              </CFormSelect>
            </CCol>
          </CRow>
          <small className="text-muted">El resto de la información se captura en las pestañas del registro.</small>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setShowCreate(false)}>Cancelar</CButton>
          <CButton style={{ backgroundColor: PINK, borderColor: PINK, color: '#fff' }} onClick={handleCreate} disabled={saving}>
            {saving ? <><CSpinner size="sm" className="me-2" />Creando...</> : 'Crear IP'}
          </CButton>
        </CModalFooter>
      </CModal>

      <style>{`
        .nowrap-table th, .nowrap-table td { white-space: nowrap; vertical-align: middle; }

        /* ── Icon tabs (same look as Sort_GESCA) ── */
        .sortip-icon-tabs { display: flex; flex-wrap: wrap; gap: 0.5rem 2rem; }
        .sortip-icon-tab {
          display: flex; flex-direction: column; align-items: center; gap: 0.35rem;
          min-width: 88px; padding: 0.25rem 0.5rem;
          background: none; border: none; cursor: pointer; color: var(--tab-color);
        }
        .sortip-icon-tab:focus-visible { outline: 2px solid var(--tab-color); outline-offset: 2px; border-radius: 0.5rem; }
        .sortip-icon-tab__circle {
          width: 52px; height: 52px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid color-mix(in srgb, var(--tab-color) 55%, transparent);
          background: color-mix(in srgb, var(--tab-color) 8%, var(--cui-body-bg, #fff));
          transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
        }
        .sortip-icon-tab__icon {
          width: 26px !important; height: 26px !important;
          color: var(--tab-color); opacity: 0.75; transition: color 0.2s ease, opacity 0.2s ease;
        }
        .sortip-icon-tab__label {
          font-size: 0.9rem; font-weight: 600; opacity: 0.7; white-space: nowrap;
          transition: opacity 0.2s ease; display: inline-flex; align-items: center; gap: 0.3rem;
        }
        .sortip-icon-tab__count {
          font-size: 0.7rem; font-weight: 700; line-height: 1;
          padding: 0.15rem 0.4rem; border-radius: 999px;
          background: var(--tab-color); color: #fff;
        }
        .sortip-icon-tab:hover .sortip-icon-tab__circle { border-color: var(--tab-color); transform: translateY(-2px); }
        .sortip-icon-tab:hover .sortip-icon-tab__icon,
        .sortip-icon-tab:hover .sortip-icon-tab__label { opacity: 1; }
        .sortip-icon-tab.is-active .sortip-icon-tab__circle {
          background: var(--tab-color); border-color: var(--tab-color);
          box-shadow: 0 4px 12px color-mix(in srgb, var(--tab-color) 40%, transparent);
        }
        .sortip-icon-tab.is-active .sortip-icon-tab__icon { color: #fff; opacity: 1; }
        .sortip-icon-tab.is-active .sortip-icon-tab__label { opacity: 1; font-weight: 800; }
      `}</style>
    </CContainer>
  );
};

export default SortIPList;