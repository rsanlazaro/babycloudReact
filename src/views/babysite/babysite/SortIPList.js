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
import PendingDocsDot from '../../../components/sortip/PendingDocsDot';
import CrioListTables from '../../../components/sortip/CrioListTables';
import PdfPreviewModal from '../../../components/PdfPreviewModal';
import PERMISSIONS from '../../../config/permissions';
import {
  IP_LIST_TABS, formatDate, normalizePasaporte, isValidPasaporte, PASAPORTE_FORMAT_MESSAGE, pendingDocs,
  selecDonaStatus,
} from '../../../config/sortIpSections';

const PINK = '#d97ea1';
const EMPTY_FORM = { nombre_completo: '', pasaporte: '', email: '', telefono: '', pais: '', guest_id: '' };

// Deposit shown in "Depósitos": number + Agendar / Programado / where it was made
const DEPOSITO_STYLE = {
  agendar:    { color: '#a7a9ac' },
  programado: { color: '#2f9be0' },
  hecho:      { color: '#14a38b', textDecoration: 'underline' },
};

const renderCell = (col, ip) => {
  const v = col.value(ip);
  if (v === null || v === undefined || v === '') return <span className="text-muted">—</span>;
  if (col.type === 'date') return /^\d{4}-\d{2}-\d{2}/.test(String(v)) ? formatDate(v) : String(v);
  // { text, color } — Itinerario, Viaje 1, Status General
  if (col.type === 'status') return <span className="ip-st" style={{ color: v.color }}>{v.text}</span>;
  if (col.type === 'depositos') {
    return (
      <span className="ip-dep">
        {v.map((d, i) => (
          <span key={d.n} className={i ? 'ip-dep-item is-sep' : 'ip-dep-item'}>
            <span className="ip-dep-n">{d.n}</span>
            <span className="ip-st" style={DEPOSITO_STYLE[d.kind]}>{d.text}</span>
          </span>
        ))}
      </span>
    );
  }
  if (col.type === 'badge') return <CBadge color="light" textColor="dark" className="border">{String(v)}</CBadge>;
  // { text, color } — e.g. "Vigencias" (pasaporte / serologías about to expire)
  if (col.type === 'alert') return <CBadge color={v.color} textColor={v.color === 'warning' ? 'dark' : undefined}>⚠ {v.text}</CBadge>;
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
        ip.nombre_completo, ip.pasaporte, ip.guest_username, ip.guest_mail, ip.gestante_nombre,
        ip.sections?.alta?.email, ip.sections?.alta?.pais, ip.sections?.alta?.telefono,
      ].some(v => v && String(v).toLowerCase().includes(term)));
  }, [ips, tab, searchTerm]);

  const tabCount = (t) => (t.filter ? ips.filter(t.filter).length : ips.length);

  // PDF opened from the Crio Embrio tables ({ ipId, docKey, title })
  const [pdfPreview, setPdfPreview] = useState(null);

  // ── "Selec Dona": choose the program's egg donor from the list ────────────
  const canEdit = canView(PERMISSIONS.EDIT_SORT_IP);
  const [selecTarget, setSelecTarget] = useState(null);   // ip
  const [selecValue, setSelecValue]   = useState('');
  const [selecSaving, setSelecSaving] = useState(false);
  const [selecError, setSelecError]   = useState('');

  const openSelec = (ip) => {
    setSelecTarget(ip);
    setSelecValue(ip.sections?.crio?.donante_seleccionado || '');
    setSelecError('');
  };

  const saveSelec = async () => {
    const ip = selecTarget;
    const original = ip.sections?.crio?.donante_seleccionado || '';
    try {
      setSelecSaving(true);
      setSelecError('');
      // Only this field: anything else in Crio embrio is left as it is
      await api.put(`/api/sort-ip/${ip.id}/sections/crio`,
        { changes: { donante_seleccionado: selecValue }, _original: { donante_seleccionado: original } },
        { withCredentials: true });
      setIps(prev => prev.map(x => (x.id !== ip.id ? x : {
        ...x, sections: { ...x.sections, crio: { ...(x.sections?.crio || {}), donante_seleccionado: selecValue } },
      })));
      setSelecTarget(null);
    } catch (err) {
      setSelecError(err.response?.data?.message || 'No se pudo guardar la donante');
    } finally {
      setSelecSaving(false);
    }
  };

  const renderSelecDona = (ip) => {
    const st = selecDonaStatus(ip.sections?.crio);
    if (st.kind === 'sin_datos') return <span className="ip-st" style={{ color: '#a0a4a8' }}>Sin datos</span>;
    if (st.kind === 'seleccionar') {
      return canEdit
        ? <CButton size="sm" color="info" variant="outline" className="py-0" onClick={(e) => { e.stopPropagation(); openSelec(ip); }}>Selec</CButton>
        : <span className="ip-st" style={{ color: '#a0a4a8' }}>Sin seleccionar</span>;
    }
    return (
      <span className="d-inline-flex align-items-center gap-2">
        <strong>{st.id}</strong>
        <span className="ip-st" style={{ color: st.kind === 'completado' ? '#198754' : '#2f9be0' }}>
          {st.kind === 'completado' ? 'Completado' : 'En attende'}
        </span>
        {canEdit && (
          <button type="button" className="btn btn-link btn-sm p-0" onClick={(e) => { e.stopPropagation(); openSelec(ip); }}
            title="Cambiar donante" aria-label={`Cambiar donante de ${ip.nombre_completo}`}>cambiar</button>
        )}
      </span>
    );
  };

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

  // ── Passport: live check while typing in "Nuevo IP" ─────────────────────
  const [pasaporteDup, setPasaporteDup] = useState(null);   // { id, nombre_completo } | null
  useEffect(() => {
    const p = normalizePasaporte(form.pasaporte);
    if (!showCreate || !isValidPasaporte(p)) { setPasaporteDup(null); return undefined; }
    const t = setTimeout(async () => {
      try {
        const res = await api.get(`/api/sort-ip/pasaporte/${encodeURIComponent(p)}`, { withCredentials: true });
        setPasaporteDup(res.data?.ip || null);
      } catch { setPasaporteDup(null); }
    }, 350);
    return () => clearTimeout(t);
  }, [form.pasaporte, showCreate]);

  // "Generar desde perfil IP": picking a Guests account with the IP profile fills
  // name, email and phone (only fields still empty or filled by the previous
  // profile — anything typed by hand is kept) and links that account.
  const pickGuestProfile = (guestId) => {
    setForm(f => {
      const prev = guests.find(g => String(g.id) === String(f.guest_id));
      const next = guests.find(g => String(g.id) === String(guestId));
      const take = (field, value, prevValue) =>
        (!f[field] || (prev && f[field] === (prevValue || ''))) ? (value || '') : f[field];
      return {
        ...f,
        guest_id: guestId,
        nombre_completo: take('nombre_completo', next?.username, prev?.username),
        email:           take('email', next?.mail, prev?.mail),
        telefono:        take('telefono', next?.phone, prev?.phone),
      };
    });
  };

  const handleCreate = async () => {
    if (!form.nombre_completo.trim()) {
      setFormError('El nombre del IP es obligatorio');
      return;
    }
    const pasaporte = normalizePasaporte(form.pasaporte);
    if (!pasaporte) { setFormError('El pasaporte es obligatorio'); return; }
    if (!isValidPasaporte(pasaporte)) { setFormError(PASAPORTE_FORMAT_MESSAGE); return; }
    if (pasaporteDup) { setFormError(`Ya existe un registro IP con este pasaporte: ${pasaporteDup.nombre_completo}`); return; }
    try {
      setSaving(true);
      setFormError('');
      const res = await api.post('/api/sort-ip', {
        nombre_completo: form.nombre_completo.trim(),
        pasaporte,
        guest_id: form.guest_id || null,
        alta: { email: form.email.trim(), telefono: form.telefono.trim(), pais: form.pais.trim() },
      }, { withCredentials: true });
      setShowCreate(false);
      navigate(`/babysite/ips/${res.data.id}`);
    } catch (err) {
      console.error('Error creating IP:', err);
      if (err.response?.data?.code === 'DUPLICATE_PASAPORTE') {
        setPasaporteDup({ id: err.response.data.existingId, nombre_completo: '' });
      }
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
            {tab.empty ? tab.label : `${filtered.length} de ${ips.length} IPs`}
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

          {tab.empty ? (
            // Tab without content yet (e.g. Prepa Transfer)
            <div className="text-center py-5 text-muted">
              <CIcon icon={tab.icon} size="xl" style={{ color: tab.color, opacity: 0.6 }} />
              <div className="mt-2 small">Esta sección aún no tiene contenido.</div>
            </div>
          ) : tab.custom === 'crio' ? (
            // Crio Embrio: "Estimulación y Captura" + "Creación Embrionaria"
            loading
              ? <div className="text-center py-4"><CSpinner size="sm" className="me-2" />Cargando...</div>
              : <CrioListTables
                  ips={filtered}
                  onOpen={(ipId) => navigate(`/babysite/ips/${ipId}`)}
                  onViewDoc={(ip, docKey, title) => setPdfPreview({ ipId: ip.id, docKey, title })}
                  ipName={(ipId) => ips.find(i => String(i.id) === String(ipId))?.nombre_completo || ''}
                />
          ) : (
          <CTable hover striped align="middle" responsive className="nowrap-table mb-0">
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>{tab.nameLabel || 'IP'}</CTableHeaderCell>
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
                  <CTableDataCell>
                    <strong>{ip.nombre_completo}</strong>
                    {/* Flight already registered but documents incomplete */}
                    <PendingDocsDot
                      pending={ip.sections?.alta?.sin_viaje ? [] : pendingDocs(ip.sections?.alta?.viajes, ip.sections?.docs)}
                      ipName={ip.nombre_completo}
                      actionLabel="Abrir registro"
                      onAction={() => navigate(`/babysite/ips/${ip.id}`)}
                    />
                  </CTableDataCell>
                  {tab.columns.map(c => (
                    <CTableDataCell key={c.label}>{c.type === 'selecDona' ? renderSelecDona(ip) : renderCell(c, ip)}</CTableDataCell>
                  ))}
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
          )}
        </CCardBody>
      </CCard>

      {/* ── PDF preview (Crio Embrio tables) ── */}
      <PdfPreviewModal
        visible={!!pdfPreview}
        title={pdfPreview?.title || 'Documento'}
        endpoint="/api/upload/ip-doc-stream"
        params={pdfPreview ? { ipId: pdfPreview.ipId, docKey: pdfPreview.docKey } : {}}
        onClose={() => setPdfPreview(null)}
      />

      {/* ── Selec Dona ── */}
      <CModal visible={!!selecTarget} onClose={() => setSelecTarget(null)} alignment="center">
        <CModalHeader><CModalTitle>Seleccionar donante{selecTarget ? ` — ${selecTarget.nombre_completo}` : ''}</CModalTitle></CModalHeader>
        <CModalBody>
          {selecError && <CAlert color="danger" className="py-2">{selecError}</CAlert>}
          <CFormLabel htmlFor="selec-dona">Egg donor (capturados en Crio embrio):</CFormLabel>
          <CFormSelect id="selec-dona" value={selecValue} onChange={e => setSelecValue(e.target.value)}>
            <option value="">— Sin seleccionar —</option>
            {(selecTarget?.sections?.crio?.egg_donors || []).filter(d => d.codigo).map(d => (
              <option key={d.id || d.codigo} value={d.codigo}>
                {d.codigo}{[d.agencia, d.catalogo].filter(Boolean).length ? ` · ${[d.agencia, d.catalogo].filter(Boolean).join(' · ')}` : ''}
              </option>
            ))}
          </CFormSelect>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setSelecTarget(null)}>Cancelar</CButton>
          <CButton style={{ backgroundColor: PINK, borderColor: PINK, color: '#fff' }} onClick={saveSelec} disabled={selecSaving}>
            {selecSaving ? <><CSpinner size="sm" className="me-2" />Guardando...</> : 'Guardar'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* ── New IP ── */}
      <CModal visible={showCreate} onClose={() => setShowCreate(false)} alignment="center">
        <CModalHeader><CModalTitle>Nuevo IP</CModalTitle></CModalHeader>
        <CModalBody>
          {formError && <CAlert color="danger" className="py-2">{formError}</CAlert>}
          <CRow>
            {/* ── Start from an IP profile of Guests (links its Cloud IPS account) ── */}
            <CCol xs={12} className="mb-3">
              <div className="p-2 rounded border" style={{ backgroundColor: '#fdf3f7', borderColor: '#f0c7d7' }}>
                <CFormLabel className="mb-1 fw-semibold">Generar desde perfil IP (Guests)</CFormLabel>
                <CFormSelect value={form.guest_id} onChange={e => pickGuestProfile(e.target.value)}>
                  <option value="">— Registro nuevo, sin perfil —</option>
                  {guests.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.username}{g.mail ? ` (${g.mail})` : ''}{Number(g.enabled) === 0 ? ' · deshabilitado' : ''}
                    </option>
                  ))}
                </CFormSelect>
                <small className="text-muted d-block mt-1">
                  {guests.length
                    ? 'Llena nombre, correo y teléfono con los datos del perfil y vincula su cuenta Cloud IPS. Puedes corregirlos antes de crear.'
                    : 'No hay perfiles IP disponibles: todos ya están vinculados a un registro o no existen en Guests.'}
                </small>
              </div>
            </CCol>
            <CCol xs={12} className="mb-3">
              <CFormLabel>Nombre completo *</CFormLabel>
              <CFormInput value={form.nombre_completo} onChange={e => setForm(f => ({ ...f, nombre_completo: e.target.value }))} />
            </CCol>
            <CCol xs={12} className="mb-3">
              <CFormLabel>Pasaporte *</CFormLabel>
              <CFormInput
                value={form.pasaporte}
                maxLength={24}
                autoComplete="off"
                placeholder="Número de pasaporte"
                invalid={!!pasaporteDup || (!!form.pasaporte && !isValidPasaporte(form.pasaporte))}
                onChange={e => setForm(f => ({ ...f, pasaporte: normalizePasaporte(e.target.value) }))}
              />
              {form.pasaporte && !isValidPasaporte(form.pasaporte) && (
                <small className="text-danger">{PASAPORTE_FORMAT_MESSAGE}</small>
              )}
              {pasaporteDup && (
                <div className="small text-danger mt-1 d-flex align-items-center gap-2 flex-wrap">
                  <span>Ya existe un registro IP con este pasaporte{pasaporteDup.nombre_completo ? `: ${pasaporteDup.nombre_completo}` : ''}.</span>
                  <CButton size="sm" color="danger" variant="outline" style={{ padding: '0 8px' }}
                    onClick={() => { setShowCreate(false); navigate(`/babysite/ips/${pasaporteDup.id}`); }}>
                    Abrir registro existente
                  </CButton>
                </div>
              )}
              <small className="text-muted d-block">Identifica al IP de forma única: no se puede registrar dos veces.</small>
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
              <CFormInput
                readOnly disabled
                value={guests.find(g => String(g.id) === String(form.guest_id))?.username || 'Sin vincular'}
              />
              <small className="text-muted">Se elige arriba, en "Generar desde perfil IP".</small>
            </CCol>
          </CRow>
          <small className="text-muted">El resto de la información se captura en las pestañas del registro.</small>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setShowCreate(false)}>Cancelar</CButton>
          <CButton style={{ backgroundColor: PINK, borderColor: PINK, color: '#fff' }} onClick={handleCreate} disabled={saving || !!pasaporteDup}>
            {saving ? <><CSpinner size="sm" className="me-2" />Creando...</> : 'Crear IP'}
          </CButton>
        </CModalFooter>
      </CModal>

      <style>{`
        .nowrap-table th, .nowrap-table td { white-space: nowrap; vertical-align: middle; }

        /* ── Data IP statuses (Itinerario, Viaje 1, Depósitos, Status General) ── */
        .ip-st { font-weight: 700; font-style: italic; }
        .ip-dep { display: inline-flex; align-items: center; }
        .ip-dep-item { display: inline-flex; align-items: center; gap: 5px; padding: 0 8px; }
        .ip-dep-item:first-child { padding-left: 0; }
        .ip-dep-item.is-sep { border-left: 1px solid #9fb5b1; }
        .ip-dep-n { color: #1b6f5c; font-weight: 800; font-style: italic; }

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