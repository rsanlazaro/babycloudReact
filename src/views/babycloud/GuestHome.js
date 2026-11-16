// frontend/src/views/babycloud/GuestHome.js
// Baby Cloud → "Inicio" for guests with the IP profile (their home after login).
// Two options:
//   1. Mis datos       → their registration data: Nombre completo, Pasaporte,
//                        teléfonos, nacionalidad… and "Datos del viaje de depósito".
//                        Saved in Guests (name, email, phone 1, passport) AND in
//                        their Sort_IPS register → Alta IP (backend: /api/guest-portal/me).
//                        Also "Proyecto parental", donor options, Unity, consent and
//                        the "Documentos iniciales" (PDF + date → Sort_IPS Check list).
//                        The password can NOT be changed here (staff manage it).
//   2. Ver mi registro → their current view (/babycloud/cloud-ips/preview/:id).
//   Everything the IP reads here is in Spanish AND French (es / fr).
//      Only while Sort_IPS → Alta IP → "Vista en Baby Cloud" is active
//      (me.cloud_view_enabled); otherwise the option shows as not available.

import React, { useEffect, useRef, useState } from 'react';
import {
  CContainer, CRow, CCol, CCard, CCardBody, CCardHeader, CButton, CAlert, CSpinner,
  CFormLabel, CFormInput, CFormText, CFormSelect, CFormCheck, CBadge,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilUser, cilNotes, cilArrowLeft, cilSave, cilArrowRight, cilCloudUpload, cilCheckCircle } from '@coreui/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useUser } from '../../context/AuthContext';
import {
  IP_SECTIONS, HOSPEDAJE_TIPOS, SI_NO, PROGRAMA_TIPOS, CAPTURA_TIPOS, EMBARAZO_PREFERENCIAS, UNITY_CATEGORIAS,
  CRIO_AGENCIAS, CRIO_CATALOGOS,
} from '../../config/sortIpSections';
import PdfMergeModal from '../../components/sortip/PdfMergeModal';
import PdfPreviewModal from '../../components/PdfPreviewModal';
const PINK = '#d97ea1';
const TEAL = '#2f7f89';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-\s()]{6,20}$/;
const PASAPORTE_REGEX = /^[A-Z0-9]{5,20}$/;
const normalizePasaporte = (v) => String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

// Same options as Sort_IPS → Alta IP → Idioma
const IDIOMAS = IP_SECTIONS.find(s => s.key === 'alta')?.fields.find(f => f.name === 'idioma')?.options || [];

// Personal data (Sort_IPS → Alta IP). col = Bootstrap md width
const DATOS_FIELDS = [
  { name: 'nombre_completo', label: 'Nom complet / Nombre completo', required: true, col: 6, autoComplete: 'name' },
  { name: 'pasaporte', label: 'Passeport / Pasaporte', required: true, col: 6, autoComplete: 'off' },
  { name: 'telefono', label: 'Téléphone 1 / Teléfono 1', type: 'tel', col: 4, autoComplete: 'tel' },
  { name: 'telefono_2', label: 'Téléphone 2 / Teléfono 2', type: 'tel', col: 4, autoComplete: 'tel' },
  { name: 'nacionalidad', label: 'Nationalité / Nacionalidad', col: 4 },
  { name: 'pais', label: 'Pays / País', col: 4, autoComplete: 'country-name' },
  { name: 'idioma', label: 'Langue / Idioma', type: 'select', col: 4 },
  { name: 'fecha_nacimiento', label: 'Date de naissance / Fecha de nacimiento', type: 'date', col: 4, autoComplete: 'bday' },
  { name: 'pareja_nombre', label: 'Nom du/de la partenaire / Nombre de la pareja', col: 12 },
  { name: 'direccion', label: 'Résidence, rue et n° / Residencia, calle y no.', col: 6, autoComplete: 'street-address' },
  { name: 'barrio', label: 'Quartier / Barrio', col: 4 },
  { name: 'cp', label: 'Code postal / CP', col: 2, autoComplete: 'postal-code' },
];

const EMPTY_VIAJE = {
  sin_viaje_deposito: false,
  llegada_fecha: '', llegada_hora: '', llegada_vuelo: '',
  salida_fecha: '', salida_hora: '', salida_vuelo: '',
  hospedaje_tipo: '', hospedaje_calle_no: '', hospedaje_numero: '', hospedaje_cp: '', hospedaje_colonia: '',
  hospedaje_complemento: '', hospedaje_hotel: '', hospedaje_room: '',
};

// Saved in Sort_IPS: Crio embrio → "Proyecto parental" (programa…lavado) and
// Alta IP (pareja_link, Unity, consentimiento)
const PROYECTO_KEYS = [
  'programa_tipo', 'captura_tipo', 'seleccion_donante', 'categoria_donante', 'preferencia_embarazo', 'lavado_semen',
  'pareja_link', 'unity_adhesion', 'unity_categoria', 'consentimiento_imagen',
];
// Donor options → Crio embrio egg donors (Código · Agencia · Catálogo)
const EMPTY_DONANTE = { codigo: '', agencia: '', catalogo: '' };

// "Documentos iniciales" = Sort_IPS → Check list → Primer viaje
const DOCS = [
  { key: 'pasaportes', label: 'Pasaportes / Passeports', vence: true },
  { key: 'serologias', label: 'Serologías (Hepatitis A, B, C, Sífilis y VIH) / Sérologies (Hépatites A, B, C, Syphilis et VIH)' },
  { key: 'espermograma', label: 'Espermograma / Spermogramme' },
  { key: 'fragmentacion_adn', label: 'Fragmentación ADN / Fragmentation ADN' },
  { key: 'tipo_sangre', label: 'Tipo de sangre / Groupe sanguin' },
  { key: 'analisis_sangre', label: 'Análisis de sangre / Analyses de sang' },
];
const MAX_PDF = 10 * 1024 * 1024;

// Test date older than 6 months (the instructions ask for exams < 6 months)
const olderThan6Months = (ymd) => {
  if (!ymd) return false;
  const d = new Date(`${ymd}T00:00:00`);
  const limit = new Date(); limit.setMonth(limit.getMonth() - 6);
  return d < limit;
};

const toForm = (d) => ({
  mail: d?.mail || '',
  current_password: '',
  datos: Object.fromEntries(DATOS_FIELDS.map(f => [f.name, d?.datos?.[f.name] ?? ''])),
  viaje: { ...EMPTY_VIAJE, ...(d?.viaje || {}) },
  proyecto: Object.fromEntries(PROYECTO_KEYS.map(k => [k, d?.proyecto?.[k] ?? ''])),
  donantes: [0, 1, 2].map(i => ({ ...EMPTY_DONANTE, ...(d?.donantes?.[i] || {}) })),
  parejaNombre: d?.pareja?.nombre_completo || '',   // display only
  documentos: Object.fromEntries(DOCS.map(x => [x.key, { fecha: d?.documentos?.[x.key]?.fecha || '' }])),
});

// Bilingual radio options (Sí/Oui, …) — click the selected one again to clear it
const Choice = ({ name, value, options, onChange, labels = {} }) => (
  <div className="d-flex flex-wrap gap-3" role="radiogroup">
    {options.map(o => (
      <CFormCheck
        key={o} type="radio" inline={false} name={name} id={`${name}-${o}`}
        label={labels[o] || o} checked={value === o}
        onChange={() => onChange(o)}
        onClick={() => { if (value === o) onChange(''); }}
      />
    ))}
  </div>
);
const SI_NO_LABELS = { Sí: 'Sí / Oui', No: 'No / Non' };
const EMBARAZO_LABELS = { Único: 'Unique / Único', Gemelar: 'Gémellaire / Gemelar' };
// Idioma options shown in both languages (the value saved is the Spanish one)
const IDIOMA_LABELS = { Español: 'Espagnol / Español', Inglés: 'Anglais / Inglés', Francés: 'Français / Francés', Portugués: 'Portugais / Portugués', Otro: 'Autre / Otro' };

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// One trip field ("Date / Fecha", …) — label + input on one line
const TripField = ({ id, label, value, onChange, type = 'text', disabled, maxLength }) => (
  <div className="gh-trip-field">
    <label htmlFor={id}>{label}</label>
    <CFormInput id={id} size="sm" type={type} value={value} disabled={disabled} maxLength={maxLength} onChange={e => onChange(e.target.value)} />
  </div>
);

const GuestHome = () => {
  const navigate = useNavigate();
  const { user, refreshPermissions } = useUser();

  const [me, setMe]           = useState(null);   // as saved
  const [form, setForm]       = useState(toForm(null));
  const [view, setView]       = useState('menu'); // 'menu' | 'form'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const noticeRef = useRef(null);   // error message → the page scrolls to it
  const [notice, setNotice]   = useState(null);   // { type, message }

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/guest-portal/me', { withCredentials: true });
      setMe(res.data);
      setForm(toForm(res.data));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar tus datos / Impossible de charger vos données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const setDato = (name, value) => setForm(f => ({ ...f, datos: { ...f.datos, [name]: value } }));
  const setViaje = (patch) => setForm(f => ({ ...f, viaje: { ...f.viaje, ...patch } }));
  const setProyecto = (patch) => setForm(f => ({ ...f, proyecto: { ...f.proyecto, ...patch } }));
  // Linkar pareja: search another IP by passport
  const [parejaQ, setParejaQ] = useState('');
  const [parejaRes, setParejaRes] = useState(null);   // { found, nombre_completo, pasaporte } | { found: false, message }
  const [parejaSearching, setParejaSearching] = useState(false);
  const searchPareja = async () => {
    if (!parejaQ) return;
    try {
      setParejaSearching(true);
      const res = await api.get('/api/guest-portal/pareja', { params: { pasaporte: parejaQ }, withCredentials: true });
      setParejaRes(res.data);
    } catch (err) {
      setParejaRes({ found: false, message: err.response?.data?.message || 'No se pudo buscar / Recherche impossible' });
    } finally {
      setParejaSearching(false);
    }
  };
  // Agencia "Fenotipo" → that option has no catálogo (its category is Fenotipo too)
  const setDonante = (i, patch) => setForm(f => ({
    ...f,
    donantes: f.donantes.map((x, j) => (j === i ? { ...x, ...patch, ...(patch.agencia === 'Fenotipo' ? { catalogo: '' } : {}) } : x)),
  }));
  // Fenotipo → the 3 options have no catálogo (Categoría donante = "Fenotipo");
  // Catálogo → each option has its catálogo (Categoría donante = option 1's,
  // worked out when saving). There is no separate "Categoría donante" field.
  const setSeleccion = (v) => setForm(f => ({
    ...f,
    proyecto: { ...f.proyecto, seleccion_donante: v, categoria_donante: v === 'Fenotipo' ? 'Fenotipo' : f.proyecto.categoria_donante },
    donantes: v === 'Fenotipo' ? f.donantes.map(x => ({ ...x, catalogo: '' })) : f.donantes,
  }));
  const conCatalogo = form.proyecto.seleccion_donante !== 'Fenotipo';
  const setDocFecha = (key, fecha) => setForm(f => ({ ...f, documentos: { ...f.documentos, [key]: { fecha } } }));

  // ── Documentos iniciales: upload (several PDFs merged into one) / view ──
  const [mergeDoc, setMergeDoc] = useState(null);     // DOCS item being uploaded
  const [uploading, setUploading] = useState({});     // key → %
  const [previewDoc, setPreviewDoc] = useState(null); // DOCS item being viewed
  const uploadDoc = async (item, file) => {
    if (file.size > MAX_PDF) { setNotice({ type: 'danger', message: 'El PDF no debe superar 10 MB / Le PDF ne doit pas dépasser 10 Mo' }); return; }
    // Documents are kept in their Sort_IPS register: not registered yet → save
    // their data first (it creates the register with their passport)
    if (!me?.sort_ip) {
      const savedData = await save();
      if (!savedData?.sort_ip) {
        setNotice(n => (n?.type === 'danger' ? n : { type: 'danger', message: 'Completa tu nombre completo y pasaporte para poder subir documentos / Complétez votre nom complet et votre passeport pour pouvoir envoyer des documents' }));
        return;
      }
    }
    try {
      setUploading(u => ({ ...u, [item.key]: 0 }));
      const sig = (await api.get('/api/guest-portal/doc-signature', { params: { docKey: item.key }, withCredentials: true })).data;
      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key', sig.apiKey);
      fd.append('timestamp', sig.timestamp);
      fd.append('signature', sig.signature);
      fd.append('public_id', sig.publicId);
      fd.append('asset_folder', sig.assetFolder);
      fd.append('overwrite', 'true');
      const url = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${sig.cloudName}/raw/upload`);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploading(u => ({ ...u, [item.key]: Math.round(e.loaded * 100 / e.total) }));
        };
        xhr.onload = () => (xhr.status === 200 ? resolve(JSON.parse(xhr.responseText).secure_url) : reject(new Error('upload')));
        xhr.onerror = () => reject(new Error('upload'));
        xhr.send(fd);
      });
      const res = await api.put('/api/guest-portal/doc', { docKey: item.key, url }, { withCredentials: true });
      // Only the document status changes; what is being typed is kept
      setMe(prev => ({ ...prev, documentos: res.data.documentos }));
      setNotice({ type: 'success', message: `Documento subido / Document envoyé : ${item.label}` });
    } catch (err) {
      setNotice({ type: 'danger', message: err.response?.data?.message || 'No se pudo subir el documento. Inténtalo de nuevo. / Le document n\'a pas pu être envoyé. Réessayez.' });
    } finally {
      setUploading(u => { const n = { ...u }; delete n[item.key]; return n; });
    }
  };
  // Any error (missing data, server refusal, upload…) → take the IP to the message
  useEffect(() => {
    if (notice?.type !== 'danger' || !noticeRef.current) return;
    noticeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    noticeRef.current.focus({ preventScroll: true });
  }, [notice]);

  const saved = toForm(me);
  const mailChanged = me && form.mail.trim().toLowerCase() !== String(me.mail || '').toLowerCase();
  const dirty = me && (mailChanged || !same(form.datos, saved.datos) || !same(form.viaje, saved.viaje)
    || !same(form.proyecto, saved.proyecto) || !same(form.donantes, saved.donantes) || !same(form.documentos, saved.documentos));

  const validate = () => {
    const d = form.datos;
    const v = form.viaje;
    if (!d.nombre_completo.trim()) return 'El nombre completo es obligatorio / Le nom complet est obligatoire';
    if (!normalizePasaporte(d.pasaporte)) return 'El pasaporte es obligatorio / Le passeport est obligatoire';
    if (!PASAPORTE_REGEX.test(normalizePasaporte(d.pasaporte))) return 'El pasaporte debe tener entre 5 y 20 letras o números / Le passeport doit contenir entre 5 et 20 lettres ou chiffres';
    if (!EMAIL_REGEX.test(form.mail.trim())) return 'Escribe un correo electrónico válido / Saisissez une adresse e-mail valide';
    if (d.telefono.trim() && !PHONE_REGEX.test(d.telefono.trim())) return 'Teléfono 1 inválido / Téléphone 1 invalide';
    if (d.telefono_2.trim() && !PHONE_REGEX.test(d.telefono_2.trim())) return 'Teléfono 2 inválido / Téléphone 2 invalide';
    if (!v.sin_viaje_deposito && v.llegada_fecha && v.salida_fecha && v.salida_fecha < v.llegada_fecha) {
      return 'La fecha de salida no puede ser anterior a la de llegada / La date de départ ne peut pas être antérieure à la date d\'arrivée';
    }
    if (mailChanged && !form.current_password) return 'Escribe tu contraseña actual para cambiar tu correo / Saisissez votre mot de passe actuel pour changer votre e-mail';
    if (parejaQ && !form.proyecto.pareja_link) return 'Busca y enlaza a tu pareja, o borra su pasaporte / Recherchez et liez votre partenaire, ou effacez son passeport';
    return '';
  };

  // Returns the saved data, or null when it could not be saved
  const save = async () => {
    const invalid = validate();
    if (invalid) { setNotice({ type: 'danger', message: invalid }); return null; }
    try {
      setSaving(true);
      setNotice(null);
      const res = await api.put('/api/guest-portal/me', {
        mail: form.mail.trim(),
        current_password: form.current_password || undefined,
        datos: { ...form.datos, pasaporte: normalizePasaporte(form.datos.pasaporte) },
        viaje: form.viaje,
        proyecto: form.proyecto,
        donantes: form.donantes,
        documentos: form.documentos,
      }, { withCredentials: true });
      setMe(res.data);
      setForm(toForm(res.data));
      refreshPermissions?.();   // updates the name shown in the app
      setNotice({
        type: 'success',
        message: mailChanged
          ? `Datos guardados. A partir de ahora inicia sesión con ${res.data.mail}. / Données enregistrées. Connectez-vous désormais avec ${res.data.mail}.`
          : 'Datos guardados correctamente. / Données enregistrées.',
      });
      return res.data;
    } catch (err) {
      // Keep what was typed so it can be corrected
      setNotice({ type: 'danger', message: err.response?.data?.message || 'No se pudieron guardar los cambios / Les modifications n\'ont pas pu être enregistrées' });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const viewEnabled = me?.cloud_view_enabled !== false;
  const goPreview = () => { if (viewEnabled) navigate(`/babycloud/cloud-ips/preview/${user?.id}`); };

  if (loading) {
    return <div className="text-center py-5"><CSpinner size="sm" className="me-2" />Cargando... / Chargement...</div>;
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
            <div className="fs-5 fw-bold">Hola / Bonjour, {me?.username || user?.username}</div>
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
              key: 'form', icon: cilUser, title: 'Mis datos / Mes données',
              text: 'Registra y actualiza tus datos, tu proyecto parental y tus documentos. / Enregistrez et mettez à jour vos données, votre projet parental et vos documents.',
              action: () => { setNotice(null); setView('form'); }, cta: 'Rellenar información / Remplir les informations',
            },
            {
              key: 'preview', icon: cilNotes, title: 'Ver mi registro / Voir mon dossier',
              text: viewEnabled
                ? 'Consulta el avance actual de tu proceso. / Consultez l\'avancement de votre processus.'
                : 'Tu registro aún no está disponible. Te avisaremos cuando puedas consultarlo. / Votre dossier n\'est pas encore disponible. Nous vous préviendrons.',
              action: goPreview, cta: viewEnabled ? 'Ver registro / Voir le dossier' : 'Aún no disponible / Pas encore disponible',
              disabled: !viewEnabled,
            },
          ].map(opt => (
            <CCol md={6} key={opt.key}>
              <CCard
                className={`h-100${opt.disabled ? '' : ' guest-home-option'}`}
                role="button"
                tabIndex={opt.disabled ? -1 : 0}
                aria-disabled={opt.disabled || undefined}
                onClick={opt.disabled ? undefined : opt.action}
                onKeyDown={e => { if (!opt.disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); opt.action(); } }}
                style={{ cursor: opt.disabled ? 'not-allowed' : 'pointer', borderTop: `4px solid ${opt.disabled ? '#c4c9d0' : PINK}`, opacity: opt.disabled ? 0.75 : 1 }}
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
                  <span className="btn btn-sm text-white mt-auto" style={{ backgroundColor: opt.disabled ? '#9da5b1' : PINK, borderColor: opt.disabled ? '#9da5b1' : PINK }}>
                    {opt.cta} {!opt.disabled && <CIcon icon={cilArrowRight} className="ms-1" />}
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
                <CIcon icon={cilArrowLeft} className="me-1" />Inicio / Accueil
              </CButton>
              <strong>Mis datos / Mes données</strong>
            </div>
            {viewEnabled && <CButton color="link" size="sm" className="p-0" onClick={goPreview}>Ver mi registro / Voir mon dossier ↗</CButton>}
          </CCardHeader>
          <CCardBody>
            {notice && (
              <div ref={noticeRef} tabIndex={-1} role={notice.type === 'danger' ? 'alert' : 'status'} className="gh-notice">
                <CAlert color={notice.type} dismissible onClose={() => setNotice(null)} className="py-2">{notice.message}</CAlert>
              </div>
            )}

            {/* ── Datos personales ── */}
            <h6 className="gh-section-title">Données personnelles / Datos personales</h6>
            <CRow>
              {DATOS_FIELDS.map(f => (
                <CCol md={f.col} key={f.name} className="mb-3">
                  <CFormLabel htmlFor={`gh-${f.name}`}>{f.label}{f.required && ' *'}</CFormLabel>
                  {f.type === 'select' ? (
                    <CFormSelect id={`gh-${f.name}`} value={form.datos[f.name]} onChange={e => setDato(f.name, e.target.value)}>
                      <option value="">Choisir... / Seleccionar...</option>
                      {IDIOMAS.map(o => <option key={o} value={o}>{IDIOMA_LABELS[o] || o}</option>)}
                      {form.datos[f.name] && !IDIOMAS.includes(form.datos[f.name]) && <option value={form.datos[f.name]}>{form.datos[f.name]}</option>}
                    </CFormSelect>
                  ) : (
                    <CFormInput
                      id={`gh-${f.name}`} type={f.type || 'text'} autoComplete={f.autoComplete}
                      value={form.datos[f.name]}
                      maxLength={f.name === 'pasaporte' ? 24 : undefined}
                      onChange={e => setDato(f.name, f.name === 'pasaporte' ? normalizePasaporte(e.target.value) : e.target.value)}
                    />
                  )}
                  {f.name === 'pasaporte' && <CFormText>Solo letras y números, tal como aparece en tu pasaporte. / Uniquement lettres et chiffres, comme sur votre passeport.</CFormText>}
                </CCol>
              ))}
              <CCol md={6} className="mb-3">
                <CFormLabel htmlFor="gh-mail">E-mail / Correo electrónico *</CFormLabel>
                <CFormInput id="gh-mail" type="email" value={form.mail} onChange={e => setForm(f => ({ ...f, mail: e.target.value }))} autoComplete="email" />
                <CFormText>Es el correo con el que inicias sesión. / C'est l'e-mail avec lequel vous vous connectez.</CFormText>
              </CCol>
              {mailChanged && (
                <CCol md={6} className="mb-3">
                  <CFormLabel htmlFor="gh-current">Mot de passe actuel / Contraseña actual *</CFormLabel>
                  <CFormInput id="gh-current" type="password" value={form.current_password}
                    onChange={e => setForm(f => ({ ...f, current_password: e.target.value }))} autoComplete="current-password" />
                  <CFormText>Necesaria para cambiar tu correo. / Nécessaire pour changer votre e-mail.</CFormText>
                </CCol>
              )}
            </CRow>

            {/* ── Datos del viaje de depósito ── */}
            <h6 className="gh-section-title mt-3">Données du voyage de dépôt / Datos del viaje de depósito</h6>
            <div className="gh-sin-viaje mb-3">
              <CFormCheck
                id="gh-sin-viaje"
                checked={form.viaje.sin_viaje_deposito}
                onChange={e => setViaje({ sin_viaje_deposito: e.target.checked })}
                label={<span className="fw-bold" style={{ color: TEAL }}>Sin viaje de depósito<br /><span className="fw-semibold">Sans voyage de dépôt</span></span>}
              />
              <small className="text-muted">
                Marcar en caso de no realizar viaje, envío de material genético o si el viaje ya fue realizado y cuenta con depósito de semen en Babyboom.
                <br /><em>Cocher en cas de non réalisation de voyage, si envoi du matériel génétique ou si le voyage a été réalisé et contient dépôt de sperme chez Babyboom.</em>
              </small>
            </div>

            <CRow className="g-4 mb-2">
              {[['llegada', 'Arrivée / Llegada'], ['salida', 'Départ / Salida']].map(([k, title]) => (
                <CCol md={6} key={k}>
                  <div className="gh-trip-title">{title}</div>
                  <TripField id={`gh-${k}-fecha`} label="Date / Fecha" type="date" value={form.viaje[`${k}_fecha`]} disabled={form.viaje.sin_viaje_deposito} onChange={x => setViaje({ [`${k}_fecha`]: x })} />
                  <TripField id={`gh-${k}-hora`} label="Heure / Hora" type="time" value={form.viaje[`${k}_hora`]} disabled={form.viaje.sin_viaje_deposito} onChange={x => setViaje({ [`${k}_hora`]: x })} />
                  <TripField id={`gh-${k}-vuelo`} label="N° de vol / No. de vuelo" value={form.viaje[`${k}_vuelo`]} maxLength={30} disabled={form.viaje.sin_viaje_deposito} onChange={x => setViaje({ [`${k}_vuelo`]: x.toUpperCase() })} />
                </CCol>
              ))}
            </CRow>
            {form.viaje.sin_viaje_deposito && <CFormText className="d-block mb-2">Sin viaje de depósito: no hace falta capturar los vuelos ni el hospedaje (no se guardan). / Sans voyage de dépôt : inutile de saisir les vols ni le logement (ils ne sont pas enregistrés).</CFormText>}

            <div className="gh-trip-title mt-3">Logement / Hospedaje</div>
            <fieldset disabled={form.viaje.sin_viaje_deposito} className={form.viaje.sin_viaje_deposito ? 'gh-locked' : ''}>
            <div className="d-flex gap-4 flex-wrap mb-2" role="radiogroup" aria-label="Tipo de hospedaje">
              {HOSPEDAJE_TIPOS.map(t => (
                <CFormCheck
                  key={t.value} type="radio" name="gh-hospedaje" id={`gh-hosp-${t.value}`}
                  label={t.value === 'otro' ? 'Autre / Otro' : t.value === 'hotel' ? 'Hôtel / Hotel' : t.label}
                  checked={form.viaje.hospedaje_tipo === t.value}
                  onChange={() => setViaje({ hospedaje_tipo: t.value })}
                />
              ))}
              {form.viaje.hospedaje_tipo && !form.viaje.sin_viaje_deposito && (
                <CButton color="link" size="sm" className="p-0" onClick={() => setViaje({ hospedaje_tipo: '' })}>Quitar / Retirer</CButton>
              )}
            </div>
            <CRow>
              <CCol md={9}><TripField id="gh-calle" label="Rue / Calle" value={form.viaje.hospedaje_calle_no} onChange={x => setViaje({ hospedaje_calle_no: x })} /></CCol>
              <CCol md={3}><TripField id="gh-numero" label="Numéro / Número" value={form.viaje.hospedaje_numero} maxLength={20} onChange={x => setViaje({ hospedaje_numero: x })} /></CCol>
              <CCol md={3}><TripField id="gh-cp" label="CP" value={form.viaje.hospedaje_cp} maxLength={12} onChange={x => setViaje({ hospedaje_cp: x })} /></CCol>
              <CCol md={9}><TripField id="gh-colonia" label="Quartier / Colonia" value={form.viaje.hospedaje_colonia} onChange={x => setViaje({ hospedaje_colonia: x })} /></CCol>
              <CCol xs={12}><TripField id="gh-complemento" label="Complément / Complemento" value={form.viaje.hospedaje_complemento} onChange={x => setViaje({ hospedaje_complemento: x })} /></CCol>
              {form.viaje.hospedaje_tipo === 'hotel' && (
                <>
                  <CCol md={8}><TripField id="gh-hotel" label="Hôtel / Hotel" value={form.viaje.hospedaje_hotel} onChange={x => setViaje({ hospedaje_hotel: x })} /></CCol>
                  <CCol md={4}><TripField id="gh-room" label="Chambre / Room" value={form.viaje.hospedaje_room} maxLength={20} onChange={x => setViaje({ hospedaje_room: x })} /></CCol>
                </>
              )}
            </CRow>
            </fieldset>

            {/* ── Projet parental / Proyecto parental (→ Sort_IPS Crio embrio) ── */}
            <h6 className="gh-section-title mt-4">Projet parental / Proyecto parental</h6>
            <CRow className="g-3 mb-2">
              <CCol md={4}>
                <div className="gh-q">Programme / Tipo programa</div>
                <Choice name="gh-programa" value={form.proyecto.programa_tipo} options={PROGRAMA_TIPOS}
                  onChange={v => setProyecto({ programa_tipo: v })} />
              </CCol>
              <CCol md={4}>
                <div className="gh-q">Type de capture / Tipo captura</div>
                <Choice name="gh-captura" value={form.proyecto.captura_tipo} options={CAPTURA_TIPOS}
                  onChange={v => setProyecto({ captura_tipo: v })} />
              </CCol>
              <CCol md={4}>
                <div className="gh-q">Préférence de grossesse / Preferencia embarazo</div>
                <Choice name="gh-embarazo" value={form.proyecto.preferencia_embarazo} options={EMBARAZO_PREFERENCIAS} labels={EMBARAZO_LABELS}
                  onChange={v => setProyecto({ preferencia_embarazo: v })} />
              </CCol>
              {/* Linkar pareja: another IP already registered, found by passport */}
              <CCol xs={12}>
                <div className="gh-q">Lier le/la partenaire / Linkar pareja</div>
                {form.proyecto.pareja_link ? (
                  <div className="d-flex align-items-center flex-wrap gap-2">
                    <span className="gh-pareja-linked">
                      <CIcon icon={cilCheckCircle} size="sm" className="me-1" />
                      Enlazado con / Lié à : <strong>{form.parejaNombre || form.proyecto.pareja_link}</strong> ({form.proyecto.pareja_link})
                    </span>
                    <CButton size="sm" color="danger" variant="outline" onClick={() => { setForm(f => ({ ...f, parejaNombre: '', proyecto: { ...f.proyecto, pareja_link: '' } })); setParejaQ(''); setParejaRes(null); }}>
                      Desenlazar / Délier
                    </CButton>
                  </div>
                ) : (
                  <>
                    <CFormText className="d-block mb-1">
                      Escribe el número de pasaporte de tu pareja: si ya está registrada como IP, podrás enlazarla. / Saisissez le numéro de passeport de votre partenaire : s'il/elle est déjà enregistré(e) comme IP, vous pourrez le/la lier.
                    </CFormText>
                    <div className="d-flex gap-2 flex-wrap" style={{ maxWidth: 520 }}>
                      <CFormInput id="gh-pareja-link" size="sm" style={{ flex: '1 1 220px' }} maxLength={24}
                        aria-label="Passeport du/de la partenaire / Pasaporte de la pareja"
                        placeholder="Passeport / Pasaporte" value={parejaQ}
                        onChange={e => { setParejaQ(normalizePasaporte(e.target.value)); setParejaRes(null); }}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); searchPareja(); } }} />
                      <CButton size="sm" color="secondary" variant="outline" disabled={!parejaQ || parejaSearching} onClick={searchPareja}>
                        {parejaSearching ? <CSpinner size="sm" /> : 'Buscar / Rechercher'}
                      </CButton>
                    </div>
                    {parejaRes?.found && (
                      <div className="mt-2 d-flex align-items-center flex-wrap gap-2 small">
                        <span>IP encontrado / IP trouvé : <strong>{parejaRes.nombre_completo}</strong></span>
                        <CButton size="sm" style={{ backgroundColor: TEAL, borderColor: TEAL, color: '#fff' }}
                          onClick={() => { setForm(f => ({ ...f, parejaNombre: parejaRes.nombre_completo, proyecto: { ...f.proyecto, pareja_link: parejaRes.pasaporte } })); setParejaQ(''); setParejaRes(null); }}>
                          Enlazar / Lier
                        </CButton>
                      </div>
                    )}
                    {parejaRes && !parejaRes.found && (
                      <small className="text-danger d-block mt-1">{parejaRes.message}</small>
                    )}
                  </>
                )}
              </CCol>
            </CRow>

            {/* ── Donneuse & options / Donante & opciones ── */}
            <h6 className="gh-section-title mt-4">Donneuse &amp; options / Donante &amp; opciones</h6>
            <div className="gh-q">Sélection de la donneuse / Selección donante</div>
            <Choice name="gh-seleccion" value={form.proyecto.seleccion_donante} options={['Fenotipo', 'Catálogo']}
              labels={{ Fenotipo: 'Phénotype (sans photo) / Fenotipo (sin foto)', Catálogo: 'Catalogue (avec photos) / Catálogo (con fotos)' }}
              onChange={setSeleccion} />
            <div className="gh-q mt-3 mb-1">Options de donneuse / Opciones de donante</div>
            <CFormText className="d-block mb-2">(Choix effectué en fonction du résultat du spermogramme / Elección en función del resultado del espermograma)</CFormText>
            <CRow className="g-2 d-none d-sm-flex gh-donor-head">
              <CCol sm={2} /><CCol sm={conCatalogo ? 4 : 6}>Code / Código</CCol><CCol sm={conCatalogo ? 3 : 4}>Agence / Agencia</CCol>
              {conCatalogo && <CCol sm={3}>Catalogue / Catálogo</CCol>}
            </CRow>
            {form.donantes.map((d, i) => (
              <CRow key={i} className="g-2 align-items-center mb-2">
                <CCol xs={12} sm={2} className="fw-bold" style={{ color: TEAL }}>Option {i + 1} / Opción {i + 1}</CCol>
                <CCol xs={12} sm={conCatalogo ? 4 : 6}>
                  <CFormInput size="sm" placeholder="Code / Código" aria-label={`Código opción ${i + 1}`} value={d.codigo}
                    maxLength={40} onChange={e => setDonante(i, { codigo: e.target.value.toUpperCase() })} />
                </CCol>
                <CCol xs={conCatalogo ? 6 : 12} sm={conCatalogo ? 3 : 4}>
                  {conCatalogo ? (
                    <CFormSelect size="sm" aria-label={`Agencia opción ${i + 1}`} value={d.agencia} onChange={e => setDonante(i, { agencia: e.target.value })}>
                      <option value="">Agence / Agencia</option>
                      {CRIO_AGENCIAS.map(c => <option key={c} value={c}>{c}</option>)}
                    </CFormSelect>
                  ) : (
                    // Sélection Phénotype / Selección Fenotipo → agency fixed to Fenotipo
                    <CFormSelect size="sm" aria-label={`Agencia opción ${i + 1}`} value="Fenotipo" disabled
                      title="Sélection Phénotype → agence Fenotipo / Selección Fenotipo → agencia Fenotipo">
                      <option value="Fenotipo">Fenotipo</option>
                    </CFormSelect>
                  )}
                </CCol>
                {conCatalogo && (
                  <CCol xs={6} sm={3}>
                    {d.agencia === 'Fenotipo' ? (
                      <CFormSelect size="sm" aria-label={`Catálogo opción ${i + 1}`} value="Fenotipo" disabled
                        title="Agence Fenotipo → catégorie Fenotipo / Agencia Fenotipo → categoría Fenotipo">
                        <option value="Fenotipo">Fenotipo</option>
                      </CFormSelect>
                    ) : (
                      <CFormSelect size="sm" aria-label={`Catálogo opción ${i + 1}`} value={d.catalogo} onChange={e => setDonante(i, { catalogo: e.target.value })}>
                        <option value="">Catalogue / Catálogo</option>
                        {CRIO_CATALOGOS.map(c => <option key={c} value={c}>{c}</option>)}
                      </CFormSelect>
                    )}
                  </CCol>
                )}
              </CRow>
            ))}

            {/* ── Aides & adhésion / Ayudas & membresías ── */}
            <h6 className="gh-section-title mt-4">Aides &amp; adhésion / Ayudas &amp; membresías</h6>
            <CRow className="g-3 mb-2">
              <CCol md={6}>
                <div className="gh-q">Souhaitez-vous bénéficier de l'adhésion Unity? / ¿Desean beneficiar de la adhesión Unity?</div>
                <Choice name="gh-unity" value={form.proyecto.unity_adhesion} options={SI_NO} labels={SI_NO_LABELS}
                  onChange={v => setProyecto({ unity_adhesion: v, ...(v !== 'Sí' ? { unity_categoria: '' } : {}) })} />
              </CCol>
              <CCol md={6}>
                <div className={`gh-q${form.proyecto.unity_adhesion !== 'Sí' ? ' text-muted' : ''}`}>Si oui, quelle catégorie? / Si sí, ¿qué categoría?</div>
                <fieldset disabled={form.proyecto.unity_adhesion !== 'Sí'}>
                  <Choice name="gh-unity-cat" value={form.proyecto.unity_categoria} options={UNITY_CATEGORIAS}
                    onChange={v => setProyecto({ unity_categoria: v })} />
                </fieldset>
              </CCol>
            </CRow>

            {/* ── Consentement / Consentimiento ── */}
            <h6 className="gh-section-title mt-4">Consentement / Consentimiento</h6>
            <div className="gh-q">Autorisez-vous l'usage de votre image pour nos réseaux sociaux? / ¿Autorizan el uso de su imagen para nuestras redes sociales?</div>
            <Choice name="gh-consent" value={form.proyecto.consentimiento_imagen} options={SI_NO} labels={SI_NO_LABELS}
              onChange={v => setProyecto({ consentimiento_imagen: v })} />

            {/* ── Informations médicales / Informaciones médicas ── */}
            <h6 className="gh-section-title mt-4">Informations médicales / Informaciones médicas</h6>
            <CRow className="g-3 mb-3 small">
              <CCol md={6}>
                <strong>Indiquer tous les examens médicaux en votre possession <span className="text-danger">inférieur à 6 mois</span> et les joindre au présent formulaire.</strong>{' '}
                (Sérologies, Spermogramme, <em>Fragmentation ADN</em>)
              </CCol>
              <CCol md={6}>
                <strong>Indicar todos los exámenes médicos en su posesión <span className="text-danger">inferior a 6 meses</span> y juntarlos a este formulario.</strong>{' '}
                (Serologías, espermograma, <em>fragmentación ADN</em>)
              </CCol>
            </CRow>
            {/* Saved in Sort_IPS → Crio embrio → Proyecto parental → "Lavado de semen" */}
            <div className="gh-vih mb-3">
              <div className="gh-q mb-1">
                ¿En tus condiciones de análisis de sangre, necesitarás un programa especial orientado a carga viral de Virus de Inmunodeficiencia Humana (VIH) detectable?
              </div>
              <div className="gh-q mb-2 fw-normal fst-italic">
                Compte tenu de vos analyses de sang, aurez-vous besoin d'un programme spécial adapté à une charge virale détectable du Virus de l'Immunodéficience Humaine (VIH) ?
              </div>
              <Choice name="gh-lavado" value={form.proyecto.lavado_semen} options={SI_NO} labels={SI_NO_LABELS}
                onChange={v => setProyecto({ lavado_semen: v })} />
            </div>

            <div className="gh-q mb-2">Documentos iniciales / Documents initiaux</div>
            {!me?.sort_ip && (
              <CFormText className="d-block mb-2">Al subir tu primer documento se guardan también tus datos (necesitamos tu nombre completo y pasaporte). / En envoyant votre premier document, vos données sont aussi enregistrées (nom complet et passeport nécessaires).</CFormText>
            )}
            {(
              <div className="gh-docs">
                {DOCS.map(item => {
                  const st = me?.documentos?.[item.key] || {};
                  const pct = uploading[item.key];
                  const fecha = form.documentos[item.key]?.fecha || '';
                  const old = !item.vence && olderThan6Months(fecha);
                  return (
                    <div key={item.key} className="gh-doc-row">
                      <div className="gh-doc-name">
                        <span>{item.label}</span>
                        {st.subido
                          ? <span className="text-success small d-inline-flex align-items-center gap-1"><CIcon icon={cilCheckCircle} size="sm" />Subido / Envoyé</span>
                          : <span className="text-muted small fst-italic">Pendiente / En attente</span>}
                      </div>
                      <div className="gh-doc-actions">
                        <CButton size="sm" color="secondary" variant="outline" disabled={pct !== undefined}
                          onClick={() => setMergeDoc(item)} title={st.subido ? 'Reemplazar PDF / Remplacer le PDF' : 'Subir PDF / Envoyer le PDF'}
                          aria-label={`${st.subido ? 'Reemplazar' : 'Subir'} PDF: ${item.label}`}>
                          {pct !== undefined ? <><CSpinner size="sm" className="me-1" />{pct}%</> : <><CIcon icon={cilCloudUpload} className="me-1" />{st.subido ? 'Reemplazar / Remplacer' : 'Subir / Envoyer'}</>}
                        </CButton>
                        {st.subido && (
                          <CButton size="sm" color="danger" variant="outline" onClick={() => setPreviewDoc(item)} aria-label={`Ver PDF: ${item.label}`}>PDF</CButton>
                        )}
                      </div>
                      <div className="gh-doc-date">
                        <label htmlFor={`gh-doc-${item.key}`}>
                          {item.vence ? "Fecha de vencimiento / Date d'expiration" : 'Fecha de realización / Date de prélèvement'}
                        </label>
                        <CFormInput id={`gh-doc-${item.key}`} size="sm" type="date" value={fecha} onChange={e => setDocFecha(item.key, e.target.value)} />
                        {old && <small className="text-danger">Tiene más de 6 meses / Date de plus de 6 mois</small>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="d-flex justify-content-end gap-2 mt-3">
              <CButton color="secondary" variant="outline" onClick={() => { setForm(toForm(me)); setNotice(null); }} disabled={!dirty || saving}>
                Descartar cambios / Annuler les modifications
              </CButton>
              <CButton style={{ backgroundColor: PINK, borderColor: PINK, color: '#fff' }} onClick={save} disabled={!dirty || saving}>
                {saving ? <><CSpinner size="sm" className="me-2" />Guardando... / Enregistrement...</> : <><CIcon icon={cilSave} className="me-1" />Guardar / Enregistrer</>}
              </CButton>
            </div>
          </CCardBody>
        </CCard>
      )}

      <PdfMergeModal
        visible={!!mergeDoc}
        title={`Subir PDF / Envoyer le PDF — ${mergeDoc?.label || ''}`}
        bilingual
        fileName={mergeDoc?.key || 'documento'}
        maxBytes={MAX_PDF}
        onClose={() => setMergeDoc(null)}
        onConfirm={(file) => { const item = mergeDoc; setMergeDoc(null); uploadDoc(item, file); }}
      />
      <PdfPreviewModal
        visible={!!previewDoc}
        title={previewDoc?.label || ''}
        endpoint="/api/guest-portal/doc-stream"
        params={{ docKey: previewDoc?.key }}
        color={PINK}
        bilingual
        onClose={() => setPreviewDoc(null)}
      />

      <style>{`
        .gh-pareja-linked { color: #1f7a64; font-size: .9rem; }
        .gh-donor-head { font-size: .78rem; color: #6c757d; margin-bottom: 2px; }
        .gh-notice { scroll-margin-top: 90px; outline: none; }
        .gh-vih { padding: 10px 12px; border: 1px solid #d7e9ec; border-radius: 6px; background: #f6fbfc; }
        .gh-q { font-size: .875rem; font-weight: 600; color: #4a7f86; margin-bottom: 4px; }
        .gh-locked { opacity: .55; }
        .gh-docs { border-top: 1px dashed #cfe3e6; }
        .gh-doc-row {
          display: grid; grid-template-columns: minmax(0, 1fr) auto 260px; gap: 6px 14px; align-items: center;
          padding: 8px 0; border-bottom: 1px dashed #cfe3e6;
        }
        .gh-doc-name { display: flex; flex-direction: column; font-size: .875rem; color: #2f6f78; }
        .gh-doc-actions { display: flex; gap: 6px; }
        .gh-doc-date label { display: block; font-size: .72rem; color: #6c757d; margin-bottom: 2px; }
        @media (max-width: 767.98px) {
          .gh-doc-row { grid-template-columns: 1fr; }
        }
        .gh-section-title { color: ${TEAL}; font-weight: 800; border-bottom: 2px solid #d7e9ec; padding-bottom: 4px; margin-bottom: 12px; }
        .gh-trip-title { color: ${TEAL}; font-weight: 700; margin-bottom: 6px; }
        .gh-trip-field { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .gh-trip-field label { flex: 0 0 auto; min-width: 150px; font-size: .85rem; color: #4a7f86; margin: 0; }
        .gh-trip-field .form-control { flex: 1 1 auto; min-width: 0; }
        .gh-sin-viaje { padding: 10px 12px; border: 1px solid #d7e9ec; border-radius: 6px; background: #f6fbfc; }
        @media (max-width: 575.98px) {
          .gh-trip-field { flex-direction: column; align-items: stretch; gap: 2px; }
          .gh-trip-field label { min-width: 0; }
        }
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