// frontend/src/views/babycloud/GuestHome.js
// Baby Cloud → "Inicio" for guests with the IP profile (their home after login).
// Two options:
//   1. Mis datos       → the same data asked in Guests → IP (usuario, correo,
//                        teléfono, contraseña). Saved in Guests AND in their
//                        Sort_IPS register (backend: /api/guest-portal/me).
//   2. Ver mi registro → their current view (/babycloud/cloud-ips/preview/:id).

import React, { useEffect, useState } from 'react';
import {
  CContainer, CRow, CCol, CCard, CCardBody, CCardHeader, CButton, CAlert, CSpinner,
  CFormLabel, CFormInput, CFormText, CBadge,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilUser, cilNotes, cilArrowLeft, cilSave, cilArrowRight } from '@coreui/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useUser } from '../../context/AuthContext';

const PINK = '#d97ea1';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toForm = (d) => ({
  username: d?.username || '',
  mail: d?.mail || '',
  phone: d?.phone || '',
  new_password: '',
  confirm_password: '',
  current_password: '',
});

const GuestHome = () => {
  const navigate = useNavigate();
  const { user, refreshPermissions } = useUser();

  const [me, setMe]           = useState(null);   // as saved
  const [form, setForm]       = useState(toForm(null));
  const [view, setView]       = useState('menu'); // 'menu' | 'form'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [notice, setNotice]   = useState(null);   // { type, message }

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/guest-portal/me', { withCredentials: true });
      setMe(res.data);
      setForm(toForm(res.data));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar tus datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const mailChanged = me && form.mail.trim().toLowerCase() !== String(me.mail || '').toLowerCase();
  const needsCurrentPassword = mailChanged || !!form.new_password;
  const dirty = me && (
    form.username.trim() !== me.username || mailChanged
    || form.phone.trim() !== (me.phone || '') || !!form.new_password
  );

  const validate = () => {
    if (!form.username.trim()) return 'El nombre es obligatorio';
    if (!EMAIL_REGEX.test(form.mail.trim())) return 'Escribe un correo electrónico válido';
    if (form.phone.trim() && !/^[0-9+\-\s()]{6,20}$/.test(form.phone.trim())) return 'Teléfono inválido';
    if (form.new_password && form.new_password.length < 6) return 'La nueva contraseña debe tener al menos 6 caracteres';
    // Same rule as Guests
    if (form.new_password && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.new_password)) {
      return 'La nueva contraseña debe contener una mayúscula, una minúscula y un número';
    }
    if (form.new_password !== form.confirm_password) return 'La confirmación no coincide con la nueva contraseña';
    if (needsCurrentPassword && !form.current_password) return 'Escribe tu contraseña actual para cambiar el correo o la contraseña';
    return '';
  };

  const save = async () => {
    const invalid = validate();
    if (invalid) { setNotice({ type: 'danger', message: invalid }); return; }
    try {
      setSaving(true);
      setNotice(null);
      const res = await api.put('/api/guest-portal/me', {
        username: form.username.trim(),
        mail: form.mail.trim(),
        phone: form.phone.trim(),
        new_password: form.new_password || undefined,
        current_password: form.current_password || undefined,
      }, { withCredentials: true });
      setMe(res.data);
      setForm(toForm(res.data));
      refreshPermissions?.();   // updates the name shown in the app
      setNotice({
        type: 'success',
        message: mailChanged
          ? `Datos guardados. A partir de ahora inicia sesión con ${res.data.mail}.`
          : 'Datos guardados correctamente.',
      });
    } catch (err) {
      // Keep what was typed so it can be corrected
      setNotice({ type: 'danger', message: err.response?.data?.message || 'No se pudieron guardar los cambios' });
    } finally {
      setSaving(false);
    }
  };

  const goPreview = () => navigate(`/babycloud/cloud-ips/preview/${user?.id}`);

  if (loading) {
    return <div className="text-center py-5"><CSpinner size="sm" className="me-2" />Cargando...</div>;
  }

  return (
    <CContainer fluid>
      {error && <CAlert color="danger">{error}</CAlert>}

      {/* ── Greeting ── */}
      <CCard className="mb-4">
        <CCardBody className="d-flex align-items-center gap-3 flex-wrap">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0"
            style={{ width: 56, height: 56, backgroundColor: `${PINK}26`, border: `2px solid ${PINK}` }}
          >
            {me?.sort_ip?.foto_url
              ? <img src={me.sort_ip.foto_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <CIcon icon={cilUser} size="lg" style={{ color: PINK }} />}
          </div>
          <div>
            <div className="fs-5 fw-bold">Hola, {me?.username || user?.username}</div>
            <div className="text-muted small">
              {me?.mail} <CBadge color="info" className="ms-1">IP</CBadge>
            </div>
          </div>
        </CCardBody>
      </CCard>

      {view === 'menu' && (
        <CRow className="g-4">
          {[
            {
              key: 'form', icon: cilUser, title: 'Mis datos',
              text: 'Revisa y actualiza tu nombre, correo, teléfono y contraseña.',
              action: () => { setNotice(null); setView('form'); }, cta: 'Rellenar información',
            },
            {
              key: 'preview', icon: cilNotes, title: 'Ver mi registro',
              text: 'Consulta el avance actual de tu proceso.',
              action: goPreview, cta: 'Ver registro',
            },
          ].map(opt => (
            <CCol md={6} key={opt.key}>
              <CCard
                className="h-100 guest-home-option"
                role="button"
                tabIndex={0}
                onClick={opt.action}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); opt.action(); } }}
                style={{ cursor: 'pointer', borderTop: `4px solid ${PINK}` }}
              >
                <CCardBody className="d-flex flex-column align-items-center text-center py-5">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center mb-3"
                    style={{ width: 72, height: 72, backgroundColor: `${PINK}1f`, color: PINK }}
                  >
                    <CIcon icon={opt.icon} size="xl" />
                  </div>
                  <h5 className="mb-2">{opt.title}</h5>
                  <p className="text-muted mb-4" style={{ maxWidth: 320 }}>{opt.text}</p>
                  <span className="btn btn-sm text-white mt-auto" style={{ backgroundColor: PINK, borderColor: PINK }}>
                    {opt.cta} <CIcon icon={cilArrowRight} className="ms-1" />
                  </span>
                </CCardBody>
              </CCard>
            </CCol>
          ))}
        </CRow>
      )}

      {view === 'form' && (
        <CCard className="mb-4">
          <CCardHeader className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <CButton color="secondary" variant="outline" size="sm" onClick={() => setView('menu')}>
                <CIcon icon={cilArrowLeft} className="me-1" />Inicio
              </CButton>
              <strong>Mis datos</strong>
            </div>
            <CButton color="link" size="sm" className="p-0" onClick={goPreview}>Ver mi registro ↗</CButton>
          </CCardHeader>
          <CCardBody>
            {notice && (
              <CAlert color={notice.type} dismissible onClose={() => setNotice(null)} className="py-2">{notice.message}</CAlert>
            )}
            <CRow>
              <CCol md={6} className="mb-3">
                <CFormLabel htmlFor="gh-username">Nombre completo *</CFormLabel>
                <CFormInput id="gh-username" value={form.username} onChange={set('username')} autoComplete="name" />
              </CCol>
              <CCol md={6} className="mb-3">
                <CFormLabel htmlFor="gh-phone">Teléfono</CFormLabel>
                <CFormInput id="gh-phone" type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" />
              </CCol>
              <CCol md={6} className="mb-3">
                <CFormLabel htmlFor="gh-mail">Correo electrónico *</CFormLabel>
                <CFormInput id="gh-mail" type="email" value={form.mail} onChange={set('mail')} autoComplete="email" />
                <CFormText>Es el correo con el que inicias sesión.</CFormText>
              </CCol>
              <CCol md={6} className="mb-3" />

              <CCol xs={12}><hr className="mt-0" /><div className="fw-semibold mb-2">Cambiar contraseña <span className="text-muted fw-normal small">(opcional)</span></div></CCol>
              <CCol md={6} className="mb-3">
                <CFormLabel htmlFor="gh-new">Nueva contraseña</CFormLabel>
                <CFormInput id="gh-new" type="password" value={form.new_password} onChange={set('new_password')} autoComplete="new-password" />
              </CCol>
              <CCol md={6} className="mb-3">
                <CFormLabel htmlFor="gh-confirm">Confirmar nueva contraseña</CFormLabel>
                <CFormInput
                  id="gh-confirm" type="password" value={form.confirm_password} onChange={set('confirm_password')}
                  autoComplete="new-password"
                  invalid={!!form.confirm_password && form.confirm_password !== form.new_password}
                />
              </CCol>

              {needsCurrentPassword && (
                <CCol md={6} className="mb-3">
                  <CFormLabel htmlFor="gh-current">Contraseña actual *</CFormLabel>
                  <CFormInput id="gh-current" type="password" value={form.current_password} onChange={set('current_password')} autoComplete="current-password" />
                  <CFormText>Necesaria para cambiar el correo o la contraseña.</CFormText>
                </CCol>
              )}
            </CRow>

            <div className="d-flex justify-content-end gap-2 mt-2">
              <CButton color="secondary" variant="outline" onClick={() => { setForm(toForm(me)); setNotice(null); }} disabled={!dirty || saving}>
                Descartar cambios
              </CButton>
              <CButton style={{ backgroundColor: PINK, borderColor: PINK, color: '#fff' }} onClick={save} disabled={!dirty || saving}>
                {saving ? <><CSpinner size="sm" className="me-2" />Guardando...</> : <><CIcon icon={cilSave} className="me-1" />Guardar</>}
              </CButton>
            </div>
          </CCardBody>
        </CCard>
      )}

      <style>{`
        .guest-home-option { transition: transform .12s ease, box-shadow .12s ease; }
        .guest-home-option:hover, .guest-home-option:focus-visible {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(217,126,161,.25);
          outline: none;
        }
      `}</style>
    </CContainer>
  );
};

export default GuestHome;