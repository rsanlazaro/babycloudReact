// frontend/src/views/babysite/babysite/SortIP.js
// Baby site → Sort_IPS → one IP register. Same layout and style as the
// Sort_GESCA register (SortGes.js): top "Volver a la lista", card with title
// bar, colored name + contact header with round avatar, outlined pill tabs,
// gray-titled section boxes, and one "Guardar cambios" for all tabs.
// Tabs: Alta IP · Check list · Crio embrio · Preparación · Programa
// Fields come from src/config/sortIpSections.js.

import React, { useState, useEffect, useMemo } from 'react';
import {
  CContainer, CCard, CCardHeader, CCardBody, CAlert, CButton, CBadge, CSpinner,
  CNav, CNavItem, CNavLink, CTabContent, CTabPane, CRow, CCol,
  CFormLabel, CFormInput, CFormSelect, CFormTextarea, CFormCheck, CProgress, CInputGroup,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilArrowLeft, cilSave, cilTrash, cilLink, cilLowVision } from '@coreui/icons';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import PhotoPicker from '../../../components/PhotoPicker';
import ViajesRegistro from '../../../components/sortip/ViajesRegistro';
import IpChecklist from '../../../components/sortip/IpChecklist';
import CrioEmbrio from '../../../components/sortip/CrioEmbrio';
import PdfPreviewModal from '../../../components/PdfPreviewModal';
import PendingDocsDot from '../../../components/sortip/PendingDocsDot';
import { useUser } from '../../../context/AuthContext';
import PERMISSIONS from '../../../config/permissions';
import {
  IP_SECTIONS, CHECKLIST_ITEMS, formatDate, normalizePasaporte, isValidPasaporte, PASAPORTE_FORMAT_MESSAGE,
  isChecklistDone, vigenciaAlerts, vigenciaText, crioRowErrors, pendingDocs,
} from '../../../config/sortIpSections';

const PINK = '#d97ea1';
const NAME_COLOR = '#5856d6';   // same as the gestante's name in Sort_GESCA

const toDateInput = (v) => (v ? String(v).slice(0, 10) : '');
const same = (a, b) => JSON.stringify(a || {}) === JSON.stringify(b || {});
// Comparable form of a field value ('' / null / undefined are equal; lists such
// as "viajes" are compared by content)
const normVal = (v) => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v).trim();
};

// Same password rule as Guests
const guestPasswordError = (p) => {
  if (!p || !p.trim()) return 'La contraseña es obligatoria';
  if (p.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(p)) return 'La contraseña debe contener una mayúscula, una minúscula y un número';
  return '';
};

// Only the fields of a tab that changed since it was loaded, and their original values
const tabChanges = (draft = {}, base = {}) => {
  const changes = {}; const original = {};
  new Set([...Object.keys(draft), ...Object.keys(base)]).forEach(k => {
    if (normVal(draft[k]) !== normVal(base[k])) {
      changes[k] = draft[k] ?? '';
      original[k] = base[k] ?? '';
    }
  });
  return { changes, original };
};

// ─────────────────────────────────────────────────────────────
// Presentational wrapper — defined OUTSIDE SortIP on purpose (a component
// defined inside it would remount its inputs on every keystroke and the
// cursor would jump out of the field). Same look as Sort_GESCA.
// ─────────────────────────────────────────────────────────────
const StaticSection = ({ title, right, children }) => (
  <div className="border rounded mb-3 overflow-hidden">
    <div
      className="px-3 py-2 d-flex justify-content-between align-items-center"
      style={{ backgroundColor: 'var(--cui-tertiary-bg, #f8f9fa)', borderBottom: '1px solid var(--cui-border-color, #dee2e6)' }}
    >
      <strong>{title}</strong>
      {right}
    </div>
    <div className="p-3">{children}</div>
  </div>
);

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
  const [saving, setSaving] = useState(false);

  // Cuenta Cloud IPS link (register-level, shown in Alta IP)
  const [guests, setGuests]         = useState([]);
  const [guestDraft, setGuestDraft] = useState('');

  // "Contraseña (Guests)" — password of the linked Guests account (not stored in Sort_IPS)
  const [passwordDraft, setPasswordDraft] = useState('');
  const [showPassword, setShowPassword]   = useState(false);

  // Uploaded PDFs (Check list, Crio embrio results) — saved the moment they are uploaded
  const [docs, setDocs]               = useState({});
  const [docProgress, setDocProgress] = useState({});   // { docKey: 0-100 }
  const [pdfPreview, setPdfPreview]   = useState(null); // { docKey, title }

  // Other IPs (Crio embrio → Split: "Spliter")
  const [otherIps, setOtherIps] = useState(null);

  // Gestantes for "Programa"
  const [gestantes, setGestantes] = useState(null);

  // Passport typed in Alta IP that already belongs to another IP → { id, nombre_completo }
  const [pasaporteDup, setPasaporteDup] = useState(null);

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
      const normalized = {};
      IP_SECTIONS.forEach(s => {
        const d = { ...(data.sections?.[s.key] || {}) };
        s.fields.forEach(f => { if (f.type === 'date') d[f.name] = toDateInput(d[f.name]); });
        normalized[s.key] = d;
      });
      setSaved(normalized);
      setDrafts(normalized);
      setGuestDraft(data.guest_id ? String(data.guest_id) : '');
      setPasswordDraft(data.guest_password || '');
      setDocs(data.sections?.docs || {});
      setShowPassword(false);
      setError('');
    } catch (err) {
      console.error('Error loading IP:', err);
      setError(err.response?.status === 404 ? 'Registro IP no encontrado' : 'Error al cargar el registro');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadIp(); }, [id]);

  // Live check: is the passport typed in Alta IP already used by another IP?
  const draftPasaporte = drafts.alta?.pasaporte;
  useEffect(() => {
    const p = normalizePasaporte(draftPasaporte);
    if (!isValidPasaporte(p)) { setPasaporteDup(null); return undefined; }
    const t = setTimeout(async () => {
      try {
        const res = await api.get(`/api/sort-ip/pasaporte/${encodeURIComponent(p)}?except=${id}`, { withCredentials: true });
        setPasaporteDup(res.data?.ip || null);
      } catch { setPasaporteDup(null); }
    }, 350);
    return () => clearTimeout(t);
  }, [draftPasaporte, id]);

  useEffect(() => {
    api.get(`/api/sort-ip/guests-available?except=${id}`, { withCredentials: true })
      .then(res => setGuests(res.data || []))
      .catch(() => setGuests([]));
  }, [id]);

  useEffect(() => {
    if (activeTab !== 'crio' || otherIps) return;
    api.get('/api/sort-ip', { withCredentials: true })
      .then(res => setOtherIps((res.data || [])
        .filter(i => String(i.id) !== String(id))
        .map(i => ({ id: i.id, nombre_completo: i.nombre_completo }))
        .sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo, 'es'))))
      .catch(() => setOtherIps([]));
  }, [activeTab, otherIps, id]);

  useEffect(() => {
    if (activeTab !== 'programa' || gestantes) return;
    api.get('/api/sort-ges', { withCredentials: true })
      .then(res => setGestantes((res.data || [])
        .map(c => ({ id: c.id, label: c.nombre_completo || `Candidato #${c.id}` }))
        .sort((a, b) => a.label.localeCompare(b.label, 'es'))))
      .catch(() => setGestantes([]));
  }, [activeTab, gestantes]);

  const guestChanged = (guestDraft || '') !== (ip?.guest_id ? String(ip.guest_id) : '');
  const passwordChanged = !!ip?.guest_id && !guestChanged && passwordDraft !== (ip?.guest_password || '');
  const isDirty = (key) => !same(drafts[key], saved[key]) || (key === 'alta' && (guestChanged || passwordChanged));
  const dirtySections = IP_SECTIONS.filter(s => isDirty(s.key));
  const anyDirty = dirtySections.length > 0;

  const setField = (sectionKey, name, value) =>
    setDrafts(d => ({ ...d, [sectionKey]: { ...(d[sectionKey] || {}), [name]: value } }));

  const checklistDone = useMemo(
    () => CHECKLIST_ITEMS.filter(i => isChecklistDone(docs, i)).length,
    [docs]
  );

  // ── PDFs of the register (Check list items, Crio embrio results) ─────────
  // Uploaded straight to Cloudinary (sort-ip-documents/ip_<id>/) and saved at once.
  const uploadIpDoc = async (docKey, file) => {
    if (file.type !== 'application/pdf') { showNotification('danger', 'Por favor seleccione un archivo PDF'); return; }
    if (file.size > 10 * 1024 * 1024) { showNotification('danger', 'El PDF no debe superar 10MB'); return; }
    try {
      setDocProgress(prev => ({ ...prev, [docKey]: 0 }));
      const sigRes = await api.get('/api/upload/ip-doc-signature', { params: { ipId: id, docKey }, withCredentials: true });
      const { timestamp, signature, publicId, assetFolder, cloudName, apiKey } = sigRes.data;
      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key', apiKey);
      fd.append('timestamp', timestamp);
      fd.append('signature', signature);
      fd.append('public_id', publicId);
      fd.append('asset_folder', assetFolder);
      fd.append('overwrite', 'true');
      const url = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setDocProgress(prev => ({ ...prev, [docKey]: Math.round(e.loaded * 100 / e.total) }));
        };
        xhr.onload = () => (xhr.status === 200 ? resolve(JSON.parse(xhr.responseText).secure_url) : reject(new Error('Upload failed')));
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(fd);
      });
      const res = await api.put('/api/upload/ip-doc', { ipId: id, docKey, url }, { withCredentials: true });
      setDocs(res.data?.docs || {});
      showNotification('success', `Documento "${file.name}" subido`);
    } catch (err) {
      console.error('Error uploading IP doc:', err);
      showNotification('danger', err.response?.status === 401
        ? 'Tu sesión expiró (por ejemplo, el servidor se reinició). Vuelve a iniciar sesión y sube el documento de nuevo.'
        : err.response?.data?.message || 'Error al subir el documento');
    } finally {
      setDocProgress(prev => { const n = { ...prev }; delete n[docKey]; return n; });
    }
  };

  const deleteIpDoc = async (docKey, title) => {
    if (!window.confirm(`¿Eliminar el PDF de "${title}"? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await api.delete('/api/upload/ip-doc', { params: { ipId: id, docKey }, withCredentials: true });
      setDocs(res.data?.docs || {});
      showNotification('info', 'Documento eliminado');
    } catch (err) {
      showNotification('danger', err.response?.status === 401
        ? 'Tu sesión expiró. Vuelve a iniciar sesión e inténtalo de nuevo.'
        : err.response?.data?.message || 'Error al eliminar el documento');
    }
  };

  const docProps = (docKey, title) => ({
    doc: docs[docKey],
    progress: docProgress[docKey],
    onPick: (file) => uploadIpDoc(docKey, file),
    onView: () => setPdfPreview({ docKey, title }),
    onDelete: () => deleteIpDoc(docKey, title),
  });

  // ── "Guardar cambios": saves every tab that has changes ─────────────────
  const handleSave = async () => {
    if (!anyDirty) { showNotification('info', 'No hay cambios por guardar'); return; }
    for (const s of dirtySections) {
      const missing = s.fields.find(f => f.required && !String(drafts[s.key]?.[f.name] || '').trim());
      if (missing) {
        setActiveTab(s.key);
        showNotification('danger', `${s.label}: el campo "${missing.label}" es obligatorio`);
        return;
      }
    }
    if (isDirty('crio')) {
      const bad = (drafts.crio?.crios || []).map((c, i) => ({ i, errs: crioRowErrors(c) })).find(r => r.errs.length);
      if (bad) {
        setActiveTab('crio');
        showNotification('danger', `Crio Embrio ${bad.i + 1}: ${bad.errs.join('. ')}`);
        return;
      }
    }
    if (passwordChanged && guestPasswordError(passwordDraft)) {
      setActiveTab('alta'); showNotification('danger', `Contraseña (Guests): ${guestPasswordError(passwordDraft)}`); return;
    }
    if (isDirty('alta')) {
      if (drafts.alta?.pasaporte && !isValidPasaporte(drafts.alta.pasaporte)) {
        setActiveTab('alta'); showNotification('danger', PASAPORTE_FORMAT_MESSAGE); return;
      }
      if (pasaporteDup) {
        setActiveTab('alta');
        showNotification('danger', `Ya existe un registro IP con este pasaporte: ${pasaporteDup.nombre_completo}`);
        return;
      }
    }
    try {
      setSaving(true);
      if (guestChanged) {
        await api.put(`/api/sort-ip/${id}`, { guest_id: guestDraft || null }, { withCredentials: true });
      }
      if (passwordChanged) {
        await api.put(`/api/sort-ip/${id}/guest-password`, { password: passwordDraft }, { withCredentials: true });
      }
      // Only the fields that changed — another user's changes to other fields are kept,
      // and a field someone else changed meanwhile is refused (409), not overwritten.
      for (const s of dirtySections) {
        const { changes, original } = tabChanges(drafts[s.key], saved[s.key]);
        if (Object.keys(changes).length) {
          await api.put(`/api/sort-ip/${id}/sections/${s.key}`, { changes, _original: original }, { withCredentials: true });
        }
      }
      await loadIp();
      showNotification('success', 'Datos guardados correctamente');
    } catch (err) {
      if (['DUPLICATE_PASAPORTE', 'GUEST_DATA_IN_USE'].includes(err.response?.data?.code)) {
        setActiveTab('alta');
        showNotification('danger', err.response.data.message);   // keep the user's edits on screen
        return;
      }
      if (err.response?.status === 409) {
        const fields = (err.response.data?.fields || []).join(', ');
        showNotification('warning', `${err.response.data?.message || 'Otro usuario modificó este registro.'}${fields ? ` (Campos: ${fields})` : ''}`);
        await loadIp();
        return;
      }
      console.error('Error saving IP:', err);
      showNotification('danger', err.response?.data?.message || 'Error al guardar los cambios');
    } finally {
      setSaving(false);
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

  // ── One field, by type (labels end with ":" like Sort_GESCA) ────────────
  const renderField = (sectionKey, f) => {
    const value = drafts[sectionKey]?.[f.name] ?? '';
    const disabled = !canEditIp;
    const label = (
      <CFormLabel className="mb-1">
        {f.label}:{f.required && <span className="text-danger"> *</span>}
      </CFormLabel>
    );
    switch (f.type) {
      case 'check':
        return (
          <CFormCheck
            id={`ip-${sectionKey}-${f.name}`}
            label={f.label}
            checked={!!drafts[sectionKey]?.[f.name]}
            disabled={disabled}
            onChange={e => setField(sectionKey, f.name, e.target.checked)}
          />
        );
      case 'guestPassword': {
        // Password of the linked Guests account (same value as in Guests)
        const noAccount = !ip?.guest_id;
        const pwdDisabled = disabled || noAccount || guestChanged;
        const pwdError = passwordChanged ? guestPasswordError(passwordDraft) : '';
        return (
          <>{label}
            <CInputGroup>
              <CFormInput
                type={showPassword ? 'text' : 'password'}
                value={noAccount ? '' : passwordDraft}
                disabled={pwdDisabled}
                autoComplete="new-password"
                placeholder={noAccount ? 'Sin cuenta de Guests vinculada' : 'Contraseña'}
                invalid={!!pwdError}
                onChange={e => setPasswordDraft(e.target.value)}
              />
              <CButton
                type="button" color="secondary" variant="outline" disabled={noAccount}
                onClick={() => setShowPassword(v => !v)}
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={showPassword}
              >
                <CIcon icon={cilLowVision} />
              </CButton>
            </CInputGroup>
            {pwdError && <small className="text-danger d-block">{pwdError}</small>}
            <small className="text-muted d-block">
              {noAccount
                ? 'Vincula una cuenta en "Cuenta Cloud IPS" (abajo) para asignar la contraseña.'
                : guestChanged
                  ? 'Guarda el cambio de cuenta para ver y editar su contraseña.'
                  : 'Es la misma contraseña de la cuenta en Guests: cambiarla aquí la cambia allá.'}
            </small>
          </>
        );
      }
      case 'textarea':
        return <>{label}<CFormTextarea rows={3} value={value} disabled={disabled} onChange={e => setField(sectionKey, f.name, e.target.value)} /></>;
      case 'select':
        return (
          <>{label}
            <CFormSelect value={value} disabled={disabled} onChange={e => setField(sectionKey, f.name, e.target.value)}>
              <option value="">Seleccionar...</option>
              {f.options.map(o => <option key={o} value={o}>{o}</option>)}
            </CFormSelect>
          </>
        );
      case 'gestante':
        return (
          <>{label}
            <div className="d-flex gap-2">
              <CFormSelect value={value} disabled={disabled || !gestantes} onChange={e => setField(sectionKey, f.name, e.target.value)}>
                <option value="">{gestantes ? 'Sin asignar' : 'Cargando gestantes...'}</option>
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
        if (f.pasaporte) {
          const bad = value && !isValidPasaporte(value);
          return (
            <>{label}
              <CFormInput
                value={value} disabled={disabled} placeholder="Número de pasaporte" maxLength={24} autoComplete="off"
                invalid={!!pasaporteDup || !!bad}
                onChange={e => setField(sectionKey, f.name, normalizePasaporte(e.target.value))}
              />
              {bad && <small className="text-danger">{PASAPORTE_FORMAT_MESSAGE}</small>}
              {pasaporteDup && (
                <div className="small text-danger mt-1 d-flex align-items-center gap-2 flex-wrap">
                  <span>Ya existe un registro IP con este pasaporte: {pasaporteDup.nombre_completo}.</span>
                  <CButton size="sm" color="danger" variant="outline" style={{ padding: '0 8px' }}
                    onClick={() => navigate(`/babysite/ips/${pasaporteDup.id}`)}>
                    Abrir registro existente
                  </CButton>
                </div>
              )}
              {!value && !disabled && (
                <small className="text-warning d-block">Captura el pasaporte: es el identificador único del IP.</small>
              )}
            </>
          );
        }
        return <>{label}<CFormInput type={f.type} value={value} disabled={disabled} placeholder={f.label} onChange={e => setField(sectionKey, f.name, e.target.value)} /></>;
    }
  };

  if (loading) {
    return (
      <CContainer fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <CSpinner color="primary" />
      </CContainer>
    );
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
  const checklistSaved = checklistDone;
  const vigencias = vigenciaAlerts(saved.checklist || {});

  return (
    <CContainer fluid>
      {alert.show && (
        <CAlert color={alert.type} dismissible onClose={() => setAlert({ show: false })}>{alert.message}</CAlert>
      )}

      {/* ── Botón superior: volver a la lista ── */}
      <div className="mb-3">
        <CButton color="secondary" variant="outline" onClick={goBack}>
          <CIcon icon={cilArrowLeft} className="me-2" />Volver a la lista
        </CButton>
      </div>

      <CCard className="mb-4">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Listado de Sort_IPS</strong>
          {canEditIp && (
            <CButton color="danger" variant="outline" size="sm" onClick={() => setShowDelete(true)}>
              <CIcon icon={cilTrash} className="me-1" />Eliminar registro
            </CButton>
          )}
        </CCardHeader>

        <CCardBody>
          {/* ── IP header ── */}
          <CRow className="mb-4">
            <CCol md={8}>
              <h3 className="mb-1 d-flex align-items-center" style={{ color: NAME_COLOR }}>
                {ip.nombre_completo}
                {/* Flight already registered but documents incomplete */}
                <PendingDocsDot
                  pending={saved.alta?.sin_viaje ? [] : pendingDocs(saved.alta?.viajes, docs)}
                  ipName={ip.nombre_completo}
                  actionLabel="Ir al Check list"
                  onAction={() => setActiveTab('checklist')}
                />
              </h3>
              <p className="text-muted mb-1">{alta.direccion || ''}</p>
              <p className="text-muted mb-1">{[alta.pais, alta.idioma].filter(Boolean).join(' - ')}</p>
              <p className="text-muted mb-1">{[ip.pasaporte && `Pasaporte ${ip.pasaporte}`, alta.telefono, alta.email].filter(Boolean).join(' · ')}</p>
              <p className="mb-1 d-flex align-items-center gap-2 flex-wrap">
                <span>Programa: {ip.gestante_nombre
                  ? <CBadge color="success">Asignado</CBadge>
                  : <CBadge color="danger">Sin asignar</CBadge>}</span>
                <CBadge color={ip.guest_username ? 'info' : 'secondary'}>
                  {ip.guest_username ? `Cuenta Cloud: ${ip.guest_username}` : 'Sin cuenta Cloud'}
                </CBadge>
                {saved.alta?.sin_viaje && <CBadge color="info">Programa sin viaje</CBadge>}
                <CBadge color="light" textColor="dark" className="border">
                  Check list {checklistSaved} de {CHECKLIST_ITEMS.length}
                </CBadge>
                {/* Pasaporte / serologías expired or expiring in < 6 months */}
                {vigencias.map(a => (
                  <CBadge
                    key={a.item.key}
                    color={a.status.level === 'vencido' ? 'danger' : 'warning'}
                    textColor={a.status.level === 'vencido' ? undefined : 'dark'}
                    role="button" style={{ cursor: 'pointer' }} title="Ver Check list"
                    onClick={() => setActiveTab('checklist')}
                  >
                    ⚠ {vigenciaText(a)}
                  </CBadge>
                ))}
              </p>
              <p className="text-muted mb-0">
                <strong>Gestante:</strong> {ip.gestante_nombre || '—'}
                <span className="ms-3"><strong>Alta:</strong> {formatDate(ip.created_at)}</span>
              </p>
            </CCol>
            <CCol md={4} className="text-end">
              {/* Photo: "Seleccionar archivo" or "Tomar foto" — same as Sort_GESCA */}
              <PhotoPicker
                photoUrl={ip.foto_url}
                disabled={!canEditIp}
                color={PINK}
                fileName={`foto-ip-${id}`}
                notify={showNotification}
                getSignature={async () => (await api.get('/api/upload/ip-cloudinary-signature', {
                  params: { ipId: id }, withCredentials: true,
                })).data}
                onUploaded={async (url) => {
                  await api.put(`/api/sort-ip/${id}/foto`, { fotoUrl: url }, { withCredentials: true });
                  setIp(prev => ({ ...prev, foto_url: url }));
                }}
              />
            </CCol>
          </CRow>

          {/* ── Tab navigation (outlined pills, like Sort_GESCA) ── */}
          <CNav variant="tabs" className="mb-3" style={{ borderBottom: 'none' }}>
            {IP_SECTIONS.map(s => {
              const active = activeTab === s.key;
              return (
                <CNavItem key={s.key}>
                  <CNavLink
                    active={active}
                    onClick={() => setActiveTab(s.key)}
                    title={isDirty(s.key) ? 'Cambios sin guardar' : undefined}
                    style={{
                      backgroundColor: active ? s.color : 'transparent',
                      color: active ? '#fff' : s.color,
                      border: `2px solid ${s.color}`,
                      borderRadius: '8px', marginRight: '8px', marginBottom: '6px',
                      padding: '10px 20px', fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}
                  >
                    <CIcon icon={s.icon} />{s.label.toUpperCase()}
                    {isDirty(s.key) && <span aria-hidden="true" style={{ color: active ? '#fff' : PINK }}>●</span>}
                  </CNavLink>
                </CNavItem>
              );
            })}
          </CNav>

          {/* ── Tab content ── */}
          <CTabContent>
            {IP_SECTIONS.map(s => (
              <CTabPane key={s.key} visible={activeTab === s.key}>
                <StaticSection
                  title={s.title || s.label}
                  right={s.key === 'checklist' && (
                    <small className="text-muted">{checklistDone} de {CHECKLIST_ITEMS.length}</small>
                  )}
                >
                  {s.key === 'checklist' && (
                    <CProgress className="mb-3" value={(checklistDone / CHECKLIST_ITEMS.length) * 100} color="success" />
                  )}
                  {s.custom === 'checklist' ? (
                    <IpChecklist
                      data={drafts.checklist || {}}
                      docs={docs}
                      disabled={!canEditIp}
                      setField={(name, value) => setField('checklist', name, value)}
                      docProps={docProps}
                    />
                  ) : s.custom === 'crio' ? (
                    <CrioEmbrio
                      data={drafts.crio || {}}
                      disabled={!canEditIp}
                      ips={otherIps || []}
                      setField={(name, value) => setField('crio', name, value)}
                      docProps={docProps}
                      onOpenIp={(ipId) => {
                        if (anyDirty && !window.confirm('Hay cambios sin guardar. ¿Salir sin guardarlos?')) return;
                        navigate(`/babysite/ips/${ipId}`);
                      }}
                    />
                  ) : (
                    <CRow>
                      {s.fields.map(f => (
                        <CCol key={f.name} md={f.col || 6} className="mb-3">{renderField(s.key, f)}</CCol>
                      ))}
                    </CRow>
                  )}
                </StaticSection>

                {s.key === 'alta' && (
                  <StaticSection
                    title="Registro de viajes"
                    right={drafts.alta?.sin_viaje
                      ? <CBadge color="info">Sin viaje</CBadge>
                      : <small className="text-muted">{(drafts.alta?.viajes || []).length} viaje(s)</small>}
                  >
                    <ViajesRegistro
                      viajes={drafts.alta?.viajes || []}
                      disabled={!canEditIp}
                      notify={showNotification}
                      onChange={list => setField('alta', 'viajes', list)}
                      sinViaje={!!drafts.alta?.sin_viaje}
                      onSinViajeChange={on => setField('alta', 'sin_viaje', on)}
                    />
                  </StaticSection>
                )}

                {s.key === 'alta' && (
                  <StaticSection title="Cuenta Cloud IPS">
                    <CRow>
                      <CCol md={6}>
                        <CFormLabel className="mb-1">Cuenta vinculada:</CFormLabel>
                        <CFormSelect value={guestDraft} disabled={!canEditIp} onChange={e => setGuestDraft(e.target.value)}>
                          <option value="">Sin vincular</option>
                          {guests.map(g => <option key={g.id} value={g.id}>{g.username}{g.mail ? ` (${g.mail})` : ''}</option>)}
                        </CFormSelect>
                        <small className="text-muted">
                          La cuenta con la que el IP entra a ver su vista de Cloud IPS. Solo aparecen cuentas de Guests con perfil IP que no están vinculadas a otro registro.
                        </small>
                      </CCol>
                    </CRow>
                  </StaticSection>
                )}
              </CTabPane>
            ))}
          </CTabContent>

          {/* ── Global action buttons ── */}
          <CRow className="mt-4">
            <CCol className="d-flex justify-content-between">
              <CButton color="secondary" variant="outline" onClick={goBack}>
                <CIcon icon={cilArrowLeft} className="me-2" />Volver a la lista
              </CButton>
              {canEditIp && (
                <CButton color="primary" className="app-button" onClick={handleSave} disabled={saving}>
                  {saving
                    ? <><CSpinner size="sm" className="me-2" />Guardando...</>
                    : <><CIcon icon={cilSave} className="me-2" />Guardar cambios</>}
                </CButton>
              )}
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* ── Delete confirmation ── */}
      {/* ── Preview of an uploaded PDF ── */}
      <PdfPreviewModal
        visible={!!pdfPreview}
        title={pdfPreview?.title || 'Documento'}
        endpoint="/api/upload/ip-doc-stream"
        params={pdfPreview ? { ipId: id, docKey: pdfPreview.docKey } : {}}
        onClose={() => setPdfPreview(null)}
      />

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