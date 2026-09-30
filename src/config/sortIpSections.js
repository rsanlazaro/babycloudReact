// frontend/src/config/sortIpSections.js
// Sort_IPS configuration shared by the list (SortIPList.js) and each register
// (SortIP.js).
//
// ⚠ PROVISIONAL FIELDS — replace them with the real ones when defined.
// Fields are stored per tab as JSON (backend table sort_ip_sections), so
// adding, removing or renaming a field here needs NO database change.
// Field types: text | email | tel | number | date | textarea | select | check | gestante
//   - select   → needs `options`
//   - check    → checkbox (used by the Check list tab)
//   - gestante → picks a Sort_GESCA register (links IP ↔ gestante)

import {
  cilUser, cilBeaker, cilClock, cilEyedropper, cilBabyCarriage, cilBalanceScale,
  cilTask, cilCalendarCheck,
} from '@coreui/icons';

// ─────────────────────────────────────────────────────────────────────────────
// Register tabs (SortIP.js)
// ─────────────────────────────────────────────────────────────────────────────
export const IP_SECTIONS = [
  {
    key: 'alta', label: 'Alta IP', icon: cilUser, color: '#1ba3b8',
    fields: [
      { name: 'nombre_completo', label: 'Nombre completo', type: 'text', required: true, col: 6 },
      { name: 'email', label: 'Correo electrónico', type: 'email', col: 6 },
      { name: 'telefono', label: 'Teléfono', type: 'tel', col: 4 },
      { name: 'pais', label: 'País', type: 'text', col: 4 },
      { name: 'idioma', label: 'Idioma', type: 'select', col: 4, options: ['Español', 'Inglés', 'Francés', 'Portugués', 'Otro'] },
      { name: 'fecha_nacimiento', label: 'Fecha de nacimiento', type: 'date', col: 4 },
      { name: 'pareja_nombre', label: 'Nombre de la pareja', type: 'text', col: 8 },
      { name: 'direccion', label: 'Dirección', type: 'textarea', col: 12 },
      { name: 'notas', label: 'Notas', type: 'textarea', col: 12 },
    ],
  },
  {
    key: 'checklist', label: 'Check list', icon: cilTask, color: '#1f7a64',
    fields: [
      { name: 'identificacion', label: 'Identificación oficial', type: 'check', col: 6 },
      { name: 'comprobante_domicilio', label: 'Comprobante de domicilio', type: 'check', col: 6 },
      { name: 'contrato_firmado', label: 'Contrato firmado', type: 'check', col: 6 },
      { name: 'aviso_privacidad', label: 'Aviso de privacidad', type: 'check', col: 6 },
      { name: 'consentimiento_informado', label: 'Consentimiento informado', type: 'check', col: 6 },
      { name: 'pago_inicial', label: 'Pago inicial', type: 'check', col: 6 },
      { name: 'notas', label: 'Notas', type: 'textarea', col: 12 },
    ],
  },
  {
    key: 'crio', label: 'Crio embrio', icon: cilBeaker, color: '#2e59a8',
    fields: [
      { name: 'clinica', label: 'Clínica', type: 'text', col: 6 },
      { name: 'fecha_criopreservacion', label: 'Fecha de criopreservación', type: 'date', col: 6 },
      { name: 'num_embriones', label: 'Número de embriones', type: 'number', col: 4 },
      { name: 'calidad_embriones', label: 'Calidad de embriones', type: 'text', col: 4 },
      { name: 'pgt', label: 'PGT', type: 'select', col: 4, options: ['Pendiente', 'Sí', 'No'] },
      { name: 'ubicacion', label: 'Ubicación (tanque / canastilla)', type: 'text', col: 12 },
      { name: 'notas', label: 'Notas', type: 'textarea', col: 12 },
    ],
  },
  {
    key: 'preparacion', label: 'Preparación', icon: cilEyedropper, color: '#9b51e0',
    fields: [
      { name: 'fecha_inicio', label: 'Inicio de preparación', type: 'date', col: 4 },
      { name: 'protocolo', label: 'Protocolo', type: 'text', col: 8 },
      { name: 'medico', label: 'Médico', type: 'text', col: 6 },
      { name: 'fecha_transfer_programada', label: 'Transfer programado', type: 'date', col: 6 },
      { name: 'notas', label: 'Notas', type: 'textarea', col: 12 },
    ],
  },
  {
    key: 'programa', label: 'Programa', icon: cilCalendarCheck, color: '#f0a020',
    fields: [
      { name: 'gestante_id', label: 'Gestante asignada (Sort_GESCA)', type: 'gestante', col: 6 },
      { name: 'fecha_asignacion', label: 'Fecha de asignación', type: 'date', col: 6 },
      { name: 'fecha_transfer', label: 'Fecha de transfer', type: 'date', col: 4 },
      { name: 'resultado_beta', label: 'Resultado beta', type: 'select', col: 4, options: ['Pendiente', 'Positivo', 'Negativo'] },
      { name: 'fecha_probable_parto', label: 'Fecha probable de parto', type: 'date', col: 4 },
      { name: 'notas', label: 'Notas', type: 'textarea', col: 12 },
    ],
  },
];

export const CHECKLIST_ITEMS = IP_SECTIONS.find(s => s.key === 'checklist').fields.filter(f => f.type === 'check');

// ─────────────────────────────────────────────────────────────────────────────
// List tabs (SortIPList.js) — icons/colors from the reference image
// Each column: { label, value: (ip) => any, type?: 'date' | 'badge' }
// `filter` (optional) limits which IPs the tab shows.
// ─────────────────────────────────────────────────────────────────────────────
const sec = (ip, section) => ip.sections?.[section] || {};
const daysSince = (d) => (d ? Math.floor((Date.now() - new Date(d).getTime()) / 86400000) : null);

export const IP_LIST_TABS = [
  {
    id: 'data-ip', label: 'Data IP', icon: cilUser, color: '#1ba3b8',
    columns: [
      { label: 'País', value: ip => sec(ip, 'alta').pais },
      { label: 'Correo', value: ip => sec(ip, 'alta').email },
      { label: 'Teléfono', value: ip => sec(ip, 'alta').telefono },
      { label: 'Idioma', value: ip => sec(ip, 'alta').idioma },
      { label: 'Cuenta Cloud', value: ip => ip.guest_username, type: 'badge' },
      { label: 'Alta', value: ip => ip.created_at, type: 'date' },
    ],
  },
  {
    id: 'crio-embrio', label: 'Crio Embrio', icon: cilBeaker, color: '#2e59a8',
    columns: [
      { label: 'Clínica', value: ip => sec(ip, 'crio').clinica },
      { label: 'Criopreservación', value: ip => sec(ip, 'crio').fecha_criopreservacion, type: 'date' },
      { label: '# Embriones', value: ip => sec(ip, 'crio').num_embriones },
      { label: 'Calidad', value: ip => sec(ip, 'crio').calidad_embriones },
      { label: 'PGT', value: ip => sec(ip, 'crio').pgt },
      { label: 'Ubicación', value: ip => sec(ip, 'crio').ubicacion },
    ],
  },
  {
    id: 'sin-asignar', label: 'Sin Asignar', icon: cilClock, color: '#e03a3a',
    filter: ip => !ip.gestante_id,       // no gestante assigned in "Programa"
    columns: [
      { label: 'País', value: ip => sec(ip, 'alta').pais },
      { label: '# Embriones', value: ip => sec(ip, 'crio').num_embriones },
      { label: 'Alta', value: ip => ip.created_at, type: 'date' },
      { label: 'Días sin asignar', value: ip => daysSince(ip.created_at) },
    ],
  },
  {
    id: 'prepa-transfer', label: 'Prepa Transfer', icon: cilEyedropper, color: '#9b51e0',
    columns: [
      { label: 'Gestante', value: ip => ip.gestante_nombre },
      { label: 'Protocolo', value: ip => sec(ip, 'preparacion').protocolo },
      { label: 'Inicio prep.', value: ip => sec(ip, 'preparacion').fecha_inicio, type: 'date' },
      { label: 'Médico', value: ip => sec(ip, 'preparacion').medico },
      { label: 'Transfer programado', value: ip => sec(ip, 'preparacion').fecha_transfer_programada, type: 'date' },
    ],
  },
  {
    id: 'embarazo', label: 'Embarazo', icon: cilBabyCarriage, color: '#f0a020',
    columns: [
      { label: 'Gestante', value: ip => ip.gestante_nombre },
      { label: 'Transfer', value: ip => sec(ip, 'programa').fecha_transfer, type: 'date' },
      { label: 'Beta', value: ip => sec(ip, 'programa').resultado_beta, type: 'badge' },
      { label: 'Fecha probable de parto', value: ip => sec(ip, 'programa').fecha_probable_parto, type: 'date' },
    ],
  },
  {
    id: 'registro', label: 'Registro', icon: cilBalanceScale, color: '#1f7a64',
    columns: [
      { label: 'Check list', value: ip => {
        const done = CHECKLIST_ITEMS.filter(f => sec(ip, 'checklist')[f.name]).length;
        return `${done} de ${CHECKLIST_ITEMS.length}`;
      }, type: 'badge' },
      { label: 'Cuenta Cloud', value: ip => ip.guest_username, type: 'badge' },
      { label: 'Creado', value: ip => ip.created_at, type: 'date' },
      { label: 'Actualizado', value: ip => ip.updated_at, type: 'date' },
    ],
  },
];

// "2026-10-30" / ISO datetime → "30/10/2026" (no timezone shift)
export const formatDate = (v) => {
  if (!v) return '—';
  const [y, m, d] = String(v).slice(0, 10).split('-');
  return y && m && d ? `${d}/${m}/${y}` : '—';
};