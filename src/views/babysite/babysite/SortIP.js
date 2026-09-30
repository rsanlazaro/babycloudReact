// frontend/src/views/babysite/babysite/SortIP.js
// Baby site → Sort_IPS → one IP register, with tabs:
// Alta IP · Check list · Crio embrio · Preparación · Programa
// Fields come from src/config/sortIpSections.js; each tab saves on its own.

import React, { useState, useEffect, useMemo } from 'react';
import {
  CContainer, CCard, CCardBody, CAlert, CButton, CBadge, CSpinner,
  CNav, CNavItem, CNavLink, CRow, CCol, CFormLabel, CFormInput, CFormSelect,
  CFormTextarea, CFormCheck, CProgress,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilArrowLeft, cilSave, cilTrash, cilLink } from '@coreui/icons';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useUser } from '../../../context/AuthContext';
import PERMISSIONS from '../../../config/permissions';
import { IP_SECTIONS, CHECKLIST_ITEMS } from '../../../config/sortIpSections';

const PINK = '#d97ea1';
const toDateInput = (v) => (v ? String(v).slice(0, 10) : '');
const same = (a, b) => JSON.stringify(a || {}) === JSON.stringify(b || {});

const SortIP = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canView } = useUser();
  const canEditIp = canView(PERMISSIONS.EDIT_SORT_IP);

  const [ip, setIp]               = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [alert, setAlert]         = useState({ show: false, type: '', message: '' });
  const [activeTab, setActiveTab] = useState(IP_SECTIONS[0].key);

  const [saved, setSaved]   = useState({});   // last saved data per section
  const [drafts, setDrafts] = useState({});   // what's on screen per section
  const [savingKey, setSavingKey] = useState(null);

  // Cuenta Cloud IPS link (register-level, shown in Alta IP)
  const [guests, setGuests]       = useState([]);
  const [guestDraft, setGuestDraft] = useState('');

  // Gestantes for "Programa" (loaded when that tab is first opened)
  const [gestantes, setGestantes] = useState(null);

  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting]     = useState(false);

  const showNotification = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 4000);
  };

  const loadIp = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/sort-ip/${id}`, { withCredentials: true });
      const data = res.data;
      setIp(data);
      // Dates normalized to YYYY-MM-DD for the date inputs
      const normalized = {};
      IP_SECTIONS.forEach(s => {
        const d = { ...(data.sections?.[s.key] || {}) };
        s.fields.forEach(f => { if (f.type === 'date') d[f.name] = toDateInput(d[f.name]); });
        normalized[s.key] = d;
      });
      setSaved(normalized);
      setDrafts(normalized);
      setGuestDraft(data.guest_id ? String(data.guest_id) : '');
      setError('');
    } catch (err) {
      console.error('Error loading IP:', err);
      setError(err.response?.status === 404 ? 'Registro IP no encontrado' : 'Error al cargar el registro');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadIp(); }, [id]);

  useEffect(() => {
    api.get(`/api/sort-ip/guests-available?except=${id}`, { withCredentials: true })
      .then(res => setGuests(res.data || []))
      .catch(() => setGuests([]));
  }, [id]);

  useEffect(() => {
    if (activeTab !== 'programa' || gestantes) return;
    api.get('/api/sort-ges', { withCredentials: true })
      .then(res => setGestantes((res.data || [])
        .map(c => ({ id: c.id, label: c.nombre_completo || `Candidato #${c.id}` }))
        .sort((a, b) => a.label.localeCompare(b.label, 'es'))))
      .catch(() => setGestantes([]));
  }, [activeTab, gestantes]);

  const section = IP_SECTIONS.find(s => s.key === activeTab);
  const draft = drafts[activeTab] || {};
  const guestChanged = (guestDraft || '') !== (ip?.guest_id ? String(ip.guest_id) : '');
  const isDirty = (key) => !same(drafts[key], saved[key]) || (key === 'alta' && guestChanged);
  const anyDirty = IP_SECTIONS.some(s => isDirty(s.key));

  const setField = (name, value) =>
    setDrafts(d => ({ ...d, [activeTab]: { ...(d[activeTab] || {}), [name]: value } }));

  const checklistDone = useMemo(
    () => CHECKLIST_ITEMS.filter(f => drafts.checklist?.[f.name]).length,
    [drafts.checklist]
  );

  const saveSection = async () => {
    const missing = section.fields.find(f => f.required && !String(draft[f.name] || '').trim());
    if (missing) {
      showNotification('danger', `El campo "${missing.label}" es obligatorio`);
      return;
    }
    try {
      setSavingKey(activeTab);
      if (activeTab === 'alta' && guestChanged) {
        await api.put(`/api/sort-ip/${id}`, { guest_id: guestDraft || null }, { withCredentials: true });
      }
      await api.put(`/api/sort-ip/${id}/sections/${activeTab}`, { data: draft }, { withCredentials: true });
      setSaved(s => ({ ...s, [activeTab]: draft }));
      if (activeTab === 'alta') {
        setIp(p => ({
          ...p,
          nombre_completo: draft.nombre_completo?.trim() || p.nombre_completo,
          guest_id: guestDraft ? Number(guestDraft) : null,
          guest_username: guests.find(g => String(g.id) === guestDraft)?.username || (guestDraft ? p.guest_username : null),
        }));
      }
      showNotification('success', `${section.label} guardado`);
    } catch (err) {
      console.error('Error saving section:', err);
      showNotification('danger', err.response?.data?.message || `Error al guardar ${section.label}`);
    } finally {
      setSavingKey(null);
    }
  };

  const goBack = () => {
    if (anyDirty && !window.confirm('Hay cambios sin guardar. ¿Salir sin guardarlos?')) return;
    navigate('/babysite/ips');
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(`/api/sort-ip/${id}`, { withCredentials: true });
      navigate('/babysite/ips');
    } catch (err) {
      showNotification('danger', err.response?.data?.message || 'Error al eliminar el registro');
      setShowDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  // ── One field, by type ────────────────────────────────────────────────────
  const renderField = (f) => {
    const value = draft[f.name] ?? '';
    const disabled = !canEditIp;
    const label = <CFormLabel className="mb-1">{f.label}{f.required && <span className="text-danger"> *</span>}</CFormLabel>;
    switch (f.type) {
      case 'check':
        return (
          <CFormCheck
            id={`ip-${activeTab}-${f.name}`}
            label={f.label}
            checked={!!draft[f.name]}
            disabled={disabled}
            onChange={e => setField(f.name, e.target.checked)}
          />
        );
      case 'textarea':
        return <>{label}<CFormTextarea rows={3} value={value} disabled={disabled} onChange={e => setField(f.name, e.target.value)} /></>;
      case 'select':
        return (
          <>{label}
            <CFormSelect value={value} disabled={disabled} onChange={e => setField(f.name, e.target.value)}>
              <option value="">— Seleccionar —</option>
              {f.options.map(o => <option key={o} value={o}>{o}</option>)}
            </CFormSelect>
          </>
        );
      case 'gestante':
        return (
          <>{label}
            <div className="d-flex gap-2">
              <CFormSelect value={value} disabled={disabled || !gestantes} onChange={e => setField(f.name, e.target.value)}>
                <option value="">{gestantes ? '— Sin asignar —' : 'Cargando gestantes...'}</option>
                {(gestantes || []).map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
              </CFormSelect>
              {value && (
                <CButton color="secondary" variant="outline" title="Abrir registro de la gestante"
                  onClick={() => navigate(`/babysite/sortGes/${value}`)}>
                  <CIcon icon={cilLink} />
                </CButton>
              )}
            </div>
          </>
        );
      default:
        return <>{label}<CFormInput type={f.type} value={value} disabled={disabled} onChange={e => setField(f.name, e.target.value)} /></>;
    }
  };

  if (loading) {
    return <CContainer fluid className="text-center py-5"><CSpinner /></CContainer>;
  }
  if (error || !ip) {
    return (
      <CContainer fluid>
        <CAlert color="danger">{error || 'Registro IP no encontrado'}</CAlert>
        <CButton color="secondary" variant="outline" onClick={() => navigate('/babysite/ips')}>
          <CIcon icon={cilArrowLeft} className="me-2" />Volver a la lista
        </CButton>
      </CContainer>
    );
  }

  const alta = saved.alta || {};

  return (
    <CContainer fluid>
      {alert.show && (
        <CAlert color={alert.type} dismissible onClose={() => setAlert({ show: false })}>{alert.message}</CAlert>
      )}

      <div className="mb-3">
        <CButton color="secondary" variant="outline" onClick={goBack}>
          <CIcon icon={cilArrowLeft} className="me-2" />Volver a la lista
        </CButton>
      </div>

      <CCard className="mb-4">
        {/* ── Header ── */}
        <CCardBody className="border-bottom d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <h3 className="mb-1" style={{ color: '#1ba3b8' }}>{ip.nombre_completo}</h3>
            <p className="text-muted mb-1">
              {[alta.email, alta.telefono, alta.pais].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
            </p>
            <p className="mb-0 d-flex gap-2 flex-wrap">
              {ip.guest_username
                ? <CBadge color="info">Cuenta Cloud: {ip.guest_username}</CBadge>
                : <CBadge color="secondary">Sin cuenta Cloud</CBadge>}
              {ip.gestante_nombre
                ? <CBadge color="warning" textColor="dark">Gestante: {ip.gestante_nombre}</CBadge>
                : <CBadge color="danger">Sin asignar</CBadge>}
              <CBadge color="light" textColor="dark" className="border">
                Check list {CHECKLIST_ITEMS.filter(f => saved.checklist?.[f.name]).length} de {CHECKLIST_ITEMS.length}
              </CBadge>
            </p>
          </div>
          {canEditIp && (
            <CButton color="danger" variant="outline" size="sm" onClick={() => setShowDelete(true)}>
              <CIcon icon={cilTrash} className="me-1" />Eliminar registro
            </CButton>
          )}
        </CCardBody>

        {/* ── Tabs ── */}
        <CNav variant="tabs" className="px-3 pt-2" role="tablist">
          {IP_SECTIONS.map(s => (
            <CNavItem key={s.key}>
              <CNavLink
                active={activeTab === s.key}
                onClick={() => setActiveTab(s.key)}
                style={{
                  cursor: 'pointer',
                  color: activeTab === s.key ? s.color : 'var(--cui-secondary-color)',
                  fontWeight: activeTab === s.key ? 700 : 500,
                  borderTop: activeTab === s.key ? `3px solid ${s.color}` : undefined,
                }}
              >
                <CIcon icon={s.icon} className="me-1" />
                {s.label}
                {isDirty(s.key) && <span title="Cambios sin guardar" style={{ color: PINK }}> ●</span>}
              </CNavLink>
            </CNavItem>
          ))}
        </CNav>

        <CCardBody>
          {activeTab === 'checklist' && (
            <div className="mb-3">
              <div className="d-flex justify-content-between small mb-1">
                <span>Avance</span><strong>{checklistDone} de {CHECKLIST_ITEMS.length}</strong>
              </div>
              <CProgress value={(checklistDone / CHECKLIST_ITEMS.length) * 100} color="success" />
            </div>
          )}

          <CRow>
            {section.fields.map(f => (
              <CCol key={f.name} md={f.col || 6} className="mb-3">{renderField(f)}</CCol>
            ))}
            {activeTab === 'alta' && (
              <CCol md={6} className="mb-3">
                <CFormLabel className="mb-1">Cuenta Cloud IPS</CFormLabel>
                <CFormSelect value={guestDraft} disabled={!canEditIp} onChange={e => setGuestDraft(e.target.value)}>
                  <option value="">— Sin vincular —</option>
                  {guests.map(g => <option key={g.id} value={g.id}>{g.username}{g.mail ? ` (${g.mail})` : ''}</option>)}
                </CFormSelect>
                <small className="text-muted">La cuenta con la que el IP entra a ver su vista de Cloud IPS.</small>
              </CCol>
            )}
          </CRow>

          {canEditIp && (
            <div className="d-flex justify-content-end gap-2">
              {isDirty(activeTab) && (
                <CButton color="secondary" variant="outline"
                  onClick={() => {
                    setDrafts(d => ({ ...d, [activeTab]: saved[activeTab] }));
                    if (activeTab === 'alta') setGuestDraft(ip.guest_id ? String(ip.guest_id) : '');
                  }}>
                  Descartar cambios
                </CButton>
              )}
              <CButton
                style={{ backgroundColor: section.color, borderColor: section.color, color: '#fff' }}
                disabled={!isDirty(activeTab) || savingKey === activeTab}
                onClick={saveSection}
              >
                {savingKey === activeTab
                  ? <><CSpinner size="sm" className="me-2" />Guardando...</>
                  : <><CIcon icon={cilSave} className="me-2" />Guardar {section.label}</>}
              </CButton>
            </div>
          )}
        </CCardBody>
      </CCard>

      {/* ── Delete confirmation ── */}
      <CModal visible={showDelete} onClose={() => setShowDelete(false)} alignment="center">
        <CModalHeader><CModalTitle>Eliminar registro IP</CModalTitle></CModalHeader>
        <CModalBody>
          <p className="mb-2">¿Eliminar el registro de <strong>{ip.nombre_completo}</strong>?</p>
          <p className="mb-0 text-danger small">
            Se borra toda su información (Alta IP, Check list, Crio embrio, Preparación y Programa).
            Su cuenta Cloud IPS no se elimina. Esta acción no se puede deshacer.
          </p>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setShowDelete(false)}>Cancelar</CButton>
          <CButton color="danger" className="text-white" onClick={handleDelete} disabled={deleting}>
            {deleting ? <><CSpinner size="sm" className="me-2" />Eliminando...</> : <><CIcon icon={cilTrash} className="me-1" />Eliminar</>}
          </CButton>
        </CModalFooter>
      </CModal>
    </CContainer>
  );
};

export default SortIP;