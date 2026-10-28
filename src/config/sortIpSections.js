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
// Categoría and Status General of each IP (Alta IP → Registro Inicial)
// ─────────────────────────────────────────────────────────────────────────────
export const IP_CATEGORIAS = ['Regular', 'VIP', 'Premium', 'Royal', 'Diamante', 'Elite'];

// Status General — chosen in Alta IP, shown in the Data IP list with its color
export const IP_STATUS_GENERAL = [
  { label: 'Sin Datos',        color: '#a0a4a8' },
  { label: 'Pre Viaje',        color: '#14a38b' },
  { label: 'Depósito',         color: '#119a83' },
  { label: 'Crio Embrio',      color: '#e07a9a' },
  { label: 'Espera Asignar',   color: '#6c6fc9' },
  { label: 'Espera Liberar',   color: '#e07a9a' },
  { label: 'Valida Prepa',     color: '#a64df0' },
  { label: 'Prepa Transfer',   color: '#3d9a9a' },
  { label: 'Beta/Saco Gesta',  color: '#f28c38' },
  { label: 'Embarazo',         color: '#f2b400' },
  { label: 'RG - Legal',       color: '#1f6f4a' },
  { label: 'Completado',       color: '#a0a4a8' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Register tabs (SortIP.js)
// ─────────────────────────────────────────────────────────────────────────────
export const IP_SECTIONS = [
  {
    key: 'alta', label: 'Alta IP', title: 'Registro Inicial / Datos del IP', icon: cilUser, color: '#1ba3b8',
    fields: [
      { name: 'nombre_completo', label: 'Nombre completo', type: 'text', required: true, col: 6 },
      // Unique id of the IP: no two registers can share it (checked by the backend)
      { name: 'pasaporte', label: 'Pasaporte', type: 'text', required: true, col: 6, pasaporte: true },
      { name: 'email', label: 'Correo electrónico', type: 'email', col: 6 },
      // Not stored in Sort_IPS: it is the password of the linked Guests account
      // (read/written through /api/sort-ip/:id/guest-password)
      { name: 'guest_password', label: 'Contraseña (Guests)', type: 'guestPassword', col: 6, virtual: true },
      // "telefono" keeps its name: it is synced with Guests → phone
      { name: 'telefono', label: 'Teléfono 1', type: 'tel', col: 4 },
      { name: 'telefono_2', label: 'Teléfono 2', type: 'tel', col: 4 },
      { name: 'grupo_whatsapp', label: 'Grupo Whatsapp', type: 'text', col: 4 },
      { name: 'nacionalidad', label: 'Nacionalidad', type: 'text', col: 4 },
      { name: 'pais', label: 'País', type: 'text', col: 4 },
      { name: 'idioma', label: 'Idioma', type: 'select', col: 4, options: ['Español', 'Inglés', 'Francés', 'Portugués', 'Otro'] },
      { name: 'fecha_nacimiento', label: 'Fecha de nacimiento', type: 'date', col: 4 },
      { name: 'pareja_nombre', label: 'Nombre de la pareja', type: 'text', col: 8 },
      // "direccion" keeps its name so addresses captured before are not lost
      { name: 'direccion', label: 'Residencia / Calle No', type: 'text', col: 6 },
      { name: 'barrio', label: 'Barrio', type: 'text', col: 4 },
      { name: 'cp', label: 'CP', type: 'text', col: 2 },
      { name: 'categoria', label: 'Categoría', type: 'select', col: 4, options: IP_CATEGORIAS },
      { name: 'status_general', label: 'Status General', type: 'select', col: 4, options: IP_STATUS_GENERAL.map(o => o.label) },
      { name: 'notas', label: 'Notas', type: 'textarea', col: 12 },
    ],
  },
  {
    // Rendered by components/sortip/IpChecklist.js: two columns (Primer / Segundo
    // viaje), each item = PDF (section "docs") + a date stored here as <key>_fecha.
    key: 'checklist', label: 'Check list', title: 'Documentación del IP', icon: cilTask, color: '#1f7a64',
    custom: 'checklist',
    fields: [],   // filled below from CHECKLIST_COLUMNS (dates)
  },
  {
    // Rendered by components/sortip/CrioEmbrio.js (lists stored as arrays:
    // egg_donors, depositos, estimulaciones, crios)
    key: 'crio', label: 'Crio embrio', title: 'Crio embrio', icon: cilBeaker, color: '#5b2bd9',
    custom: 'crio',
    fields: [],
  },
  {
    key: 'preparacion', label: 'Preparación', title: 'Preparación para transfer', icon: cilEyedropper, color: '#9b51e0',
    fields: [
      { name: 'fecha_inicio', label: 'Inicio de preparación', type: 'date', col: 4 },
      { name: 'protocolo', label: 'Protocolo', type: 'text', col: 8 },
      { name: 'medico', label: 'Médico', type: 'text', col: 6 },
      { name: 'fecha_transfer_programada', label: 'Transfer programado', type: 'date', col: 6 },
      { name: 'notas', label: 'Notas', type: 'textarea', col: 12 },
    ],
  },
  {
    key: 'programa', label: 'Programa', title: 'Programa y asignación de gestante', icon: cilCalendarCheck, color: '#f0a020',
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

// ─────────────────────────────────────────────────────────────────────────────
// Check list — documents per trip. Each item: PDF upload + date.
// `vence: true` → the date is an EXPIRY date and an alert shows when fewer
// than VIGENCIA_MESES_ALERTA months are left.
// ─────────────────────────────────────────────────────────────────────────────
export const CHECKLIST_COLUMNS = [
  {
    key: 'primer', title: 'Primer Viaje',
    docs: [
      { key: 'pasaportes', label: 'Pasaportes', vence: true },
      { key: 'serologias', label: 'Serologías (Hepatitis A, B, C, Sífilis y VIH)', vence: true },
      { key: 'espermograma', label: 'Espermograma' },
      { key: 'fragmentacion_adn', label: 'Fragmentación ADN' },
      { key: 'tipo_sangre', label: 'Tipo de sangre' },
      { key: 'analisis_sangre', label: 'Análisis de sangre' },
    ],
  },
  {
    key: 'segundo', title: 'Segundo Viaje',
    docs: [
      { key: 'v2_actas_nacimiento', label: '3 actas de nacimiento apostilladas del papá genético' },
      { key: 'v2_actas_matrimonio', label: '2 actas de matrimonio apostilladas (si casados)' },
      { key: 'v2_identificaciones', label: '2 identificaciones (el pasaporte + otra)' },
      { key: 'v2_comprobante_domicilio', label: '1 comprobante de domicilio con el nombre del donante' },
      { key: 'v2_efectivo', label: '1000€ en efectivo' },
      { key: 'v2_declaracion_impuestos', label: 'Declaración de impuestos' },
      { key: 'v2_antecedentes_penales', label: 'Antecedentes penales (apostilla no obligatoria)' },
    ],
  },
];

export const CHECKLIST_ITEMS = CHECKLIST_COLUMNS.flatMap(c => c.docs);
// Key of the item's PDF in the "docs" section, and of its date in the checklist tab
export const checklistDocKey = (item) => `checklist_${item.key}`;
export const checklistDateField = (item) => `${item.key}_fecha`;
export const isChecklistDone = (docs, item) => !!docs?.[checklistDocKey(item)]?.url;

// Dates of the checklist tab (normalized to YYYY-MM-DD when loading)
IP_SECTIONS.find(s => s.key === 'checklist').fields = [
  ...CHECKLIST_ITEMS.map(i => ({ name: checklistDateField(i), label: i.label, type: 'date' })),
  { name: 'notas', label: 'Notas', type: 'textarea', col: 12 },
];

// ── Expiry alerts (pasaporte, serologías) ──────────────────────────────────
export const VIGENCIA_MESES_ALERTA = 6;

const ymdToDate = (v) => {
  const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
};

/** null (no date) | { level: 'vencido' | 'por_vencer' | 'vigente', days } */
export const vigenciaStatus = (fecha) => {
  const d = ymdToDate(fecha);
  if (!d) return null;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const limite = new Date(hoy); limite.setMonth(limite.getMonth() + VIGENCIA_MESES_ALERTA);
  const days = Math.round((d - hoy) / 86400000);
  if (d < hoy) return { level: 'vencido', days };
  if (d < limite) return { level: 'por_vencer', days };
  return { level: 'vigente', days };
};

/** Items with an expiry date that is past or within VIGENCIA_MESES_ALERTA months */
export const vigenciaAlerts = (checklistData = {}) =>
  CHECKLIST_ITEMS.filter(i => i.vence)
    .map(i => ({ item: i, fecha: checklistData[checklistDateField(i)], status: vigenciaStatus(checklistData[checklistDateField(i)]) }))
    .filter(a => a.status && a.status.level !== 'vigente');

export const vigenciaText = (a) => (a.status.level === 'vencido'
  ? `${a.item.label}: vencido`
  : `${a.item.label}: vence en ${a.status.days} día${a.status.days === 1 ? '' : 's'}`);

// ─────────────────────────────────────────────────────────────────────────────
// Crio embrio
// ─────────────────────────────────────────────────────────────────────────────
export const CRIO_AGENCIAS  = ['Fenotipo', 'FM', 'OD'];
export const CRIO_CATALOGOS = ['Regular', 'VIP', 'Premium', 'Royal', 'Diamante', 'Elite'];
export const CRIO_DEPOSITOS = ['Kiromedic', 'Eligen', 'Care'];
export const CRIO_PROCESOS  = ['Biopsia parcial', 'Biopsia total', 'Sin biopsia', 'Care'];
export const CRIO_MUESTRA   = ['Fresco', 'Sí', 'No'];
// "Incluir Status" of every Crio embrio date — calculated, not chosen:
//   no date            → Programar
//   date today/future  → Programado
//   date already passed → Revisar
export const crioDateStatus = (fecha) => {
  const d = ymdToDate(fecha);
  if (!d) return { key: 'programar', label: 'Programar', color: 'secondary' };
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  if (d < hoy) return { key: 'revisar', label: 'Revisar', color: 'danger' };
  return { key: 'programado', label: 'Programado', color: 'success' };
};
export const CRIO_LIMITS    = { eggDonors: 10, depositos: 4, depositosPorViaje: 2, estimulaciones: 3 };

const rid = (p) => `${p}${Date.now()}${Math.floor(Math.random() * 1000)}`;
export const newEggDonor = () => ({ id: rid('d'), codigo: '', agencia: '', catalogo: '' });
export const newDeposito = (viaje = 1) => ({ id: rid('p'), viaje, deposito: '', fecha: '' });
export const newEstimulacion = () => ({
  id: rid('e'), donante: '', start_estimula: '', captura: '',
  split: false, owner_qtd: '', spliter_qtd: '', spliter_ip_id: '', proceso: '', proceso_qtd: '',
  muestra: '', mii: '',
});
export const newCrio = () => ({
  id: rid('c'), donante: '', fecha_start: '', fecha_final: '',
  fecundados: '', desarrollo: '', ni: '', pgta: '', envio_pgta: '', resultado: '',
  xy: '', xx: '',
});

const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

/** Rules of each "Crio Embrio" row → list of messages (empty = OK) */
export const crioRowErrors = (c) => {
  const errs = [];
  const fec = num(c.fecundados), des = num(c.desarrollo), ni = num(c.ni), xy = num(c.xy), xx = num(c.xx);
  if (des !== null && fec !== null && des > fec) errs.push('Desarrollo no puede rebasar el número de fecundados');
  if (ni !== null && des !== null && ni > des) errs.push('NI no puede ser mayor a desarrollo');
  if (ni !== null && (xy !== null || xx !== null) && (xy || 0) + (xx || 0) > ni) errs.push('La suma de XX y XY no puede pasar NI');
  return errs;
};

/** Totals for the Sort_IPS list */
export const crioSummary = (crio = {}) => {
  const sum = (k) => (crio.crios || []).reduce((t, c) => t + (Number(c[k]) || 0), 0);
  return {
    eggDonors: (crio.egg_donors || []).filter(d => d.codigo).length,
    depositos: (crio.depositos || []).length,
    estimulaciones: (crio.estimulaciones || []).length,
    fecundados: sum('fecundados'),
    desarrollo: sum('desarrollo'),
    pgta: (crio.crios || []).filter(c => c.pgta === 'Sí').length,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// List tabs (SortIPList.js) — icons/colors from the reference image
// Each column: { label, value: (ip) => any, type?: 'date' | 'badge' }
// `filter` (optional) limits which IPs the tab shows.
// ─────────────────────────────────────────────────────────────────────────────
const sec = (ip, section) => ip.sections?.[section] || {};
const daysSince = (d) => (d ? Math.floor((Date.now() - new Date(d).getTime()) / 86400000) : null);

export const IP_LIST_TABS = [
  {
    // First column (the IP's name + pending-documents dot) is titled "Nombre" here
    id: 'data-ip', label: 'Data IP', icon: cilUser, color: '#1ba3b8', nameLabel: 'Nombre',
    columns: [
      { label: 'Pareja', value: ip => sec(ip, 'alta').pareja_nombre },
      // Flight of the current trip (see viajeActivo)
      { label: 'Vuelo ida', value: ip => (sec(ip, 'alta').sin_viaje ? 'Sin viaje' : viajeActivo(sec(ip, 'alta'))?.llegada_fecha), type: 'date' },
      { label: 'Vuelo vuelta', value: ip => (sec(ip, 'alta').sin_viaje ? 'Sin viaje' : viajeActivo(sec(ip, 'alta'))?.salida_fecha), type: 'date' },
      { label: 'Itinerario', value: ip => itinerarioStatus(sec(ip, 'alta')), type: 'status' },
      { label: 'Viaje 1', value: ip => viaje1Status(sec(ip, 'alta')), type: 'status' },
      { label: 'Categoría', value: ip => sec(ip, 'alta').categoria, type: 'badge' },
      { label: 'Depósitos', value: ip => depositosResumen(sec(ip, 'crio')), type: 'depositos' },
      { label: 'Selec Dona', value: ip => ip, type: 'selecDona' },
      { label: 'Status General', value: ip => statusGeneral(sec(ip, 'alta')), type: 'status' },
    ],
  },
  {
    // Rendered by components/sortip/CrioListTables.js: "Estimulación y Captura"
    // and "Creación Embrionaria" (rows from crioListRow)
    id: 'crio-embrio', label: 'Crio Embrio', icon: cilBeaker, color: '#2e59a8', custom: 'crio',
    columns: [
      { label: 'Egg donors', value: ip => crioSummary(sec(ip, 'crio')).eggDonors || null },
      { label: 'Depósitos', value: ip => crioSummary(sec(ip, 'crio')).depositos || null },
      { label: 'Estimulaciones', value: ip => crioSummary(sec(ip, 'crio')).estimulaciones || null },
      { label: 'Fecundados', value: ip => crioSummary(sec(ip, 'crio')).fecundados || null },
      { label: 'Desarrollo', value: ip => crioSummary(sec(ip, 'crio')).desarrollo || null },
      { label: 'Con PGTA', value: ip => crioSummary(sec(ip, 'crio')).pgta || null },
    ],
  },
  {
    id: 'sin-asignar', label: 'Sin Asignar', icon: cilClock, color: '#e03a3a',
    filter: ip => !ip.gestante_id,       // no gestante assigned in "Programa"
    columns: [
      { label: 'País', value: ip => sec(ip, 'alta').pais },
      { label: '# Embriones', value: ip => crioSummary(sec(ip, 'crio')).desarrollo || null },
      { label: 'Alta', value: ip => ip.created_at, type: 'date' },
      { label: 'Días sin asignar', value: ip => daysSince(ip.created_at) },
    ],
  },
  {
    // Empty for now (content to be defined). `empty: true` → the list shows a
    // placeholder instead of the table. Previous columns, to restore later:
    //   Gestante · Protocolo · Inicio prep. · Médico · Transfer programado
    id: 'prepa-transfer', label: 'Prepa Transfer', icon: cilEyedropper, color: '#9b51e0',
    empty: true,
    columns: [],
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
        const done = CHECKLIST_ITEMS.filter(i => isChecklistDone(ip.sections?.docs, i)).length;
        return `${done} de ${CHECKLIST_ITEMS.length}`;
      }, type: 'badge' },
      // Pasaporte / serologías expired or expiring in < 6 months
      { label: 'Vigencias', value: ip => {
        const alerts = vigenciaAlerts(sec(ip, 'checklist'));
        if (!alerts.length) return null;
        return { text: alerts.map(vigenciaText).join(' · '), color: alerts.some(a => a.status.level === 'vencido') ? 'danger' : 'warning' };
      }, type: 'alert' },
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

// Passport as stored: uppercase, no spaces or dashes (same rule as the backend)
export const normalizePasaporte = (v) => String(v ?? '').replace(/[\s-]+/g, '').toUpperCase();
export const isValidPasaporte = (v) => /^[A-Z0-9]{5,20}$/.test(normalizePasaporte(v));
export const PASAPORTE_FORMAT_MESSAGE = 'El pasaporte debe tener entre 5 y 20 letras o números';

// ─────────────────────────────────────────────────────────────────────────────
// Registro de viajes (Alta IP) — stored in the Alta IP data as `viajes: [...]`
// ─────────────────────────────────────────────────────────────────────────────
export const HOSPEDAJE_TIPOS = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'otro', label: 'Otro' },
];

export const newViaje = (isFirst = false) => ({
  id: `v${Date.now()}${Math.floor(Math.random() * 1000)}`,
  primer_viaje: isFirst,
  segundo_viaje: false,
  con_material_genetico: false,   // "Con Material Genético (Sin Viaje)"
  llegada_fecha: '', llegada_hora: '', llegada_vuelo: '',
  salida_fecha: '', salida_hora: '', salida_vuelo: '',
  vuelo_confirmado: false, vuelo_confirmado_en: '',
  itinerario_enviado: false, itinerario_enviado_en: '',
  hospedaje_tipo: '',             // hotel | airbnb | otro
  hospedaje_calle_no: '', hospedaje_cp: '', hospedaje_colonia: '',
  hospedaje_complemento: '', hospedaje_hotel: '', hospedaje_room: '',
});

// ─────────────────────────────────────────────────────────────────────────────
// Pending documents: a trip already has its flight but the Check list column
// for that trip is incomplete → red dot next to the IP's name.
//   - "has a flight": not "Con material genético (sin viaje)" and an arrival
//     date, an arrival flight number or "Vuelo confirmado"
//   - Segundo viaje → "Segundo Viaje" column; any other trip → "Primer Viaje"
// ─────────────────────────────────────────────────────────────────────────────
export const viajeTieneVuelo = (v) =>
  !v?.con_material_genetico && !!(v?.llegada_fecha || v?.llegada_vuelo || v?.vuelo_confirmado);

/** [] when nothing is pending; otherwise one entry per trip: { numero, columna, faltantes: [labels] } */
export const pendingDocs = (viajes = [], docs = {}) => {
  const out = [];
  (viajes || []).forEach((v, i) => {
    if (!viajeTieneVuelo(v)) return;
    const col = CHECKLIST_COLUMNS.find(c => c.key === (v.segundo_viaje ? 'segundo' : 'primer'));
    const faltantes = col.docs.filter(item => !isChecklistDone(docs, item)).map(item => item.label);
    if (faltantes.length) out.push({ numero: i + 1, columna: col.title, faltantes });
  });
  return out;
};

// ─────────────────────────────────────────────────────────────────────────────
// Data IP list — computed columns
// ─────────────────────────────────────────────────────────────────────────────
const hoy0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const toDay = (v) => {
  const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
};
const ST = (text, color) => ({ text, color });

/**
 * Current trip: the first one (not "sin viaje") whose return is today or later,
 * or that has no return date yet; otherwise the last trip with any flight data.
 */
export const viajeActivo = (alta = {}) => {
  const viajes = (alta.viajes || []).filter(v => !v.con_material_genetico);
  const hoy = hoy0();
  const vigente = viajes.find(v => (v.llegada_fecha || v.salida_fecha) && (!toDay(v.salida_fecha) || toDay(v.salida_fecha) >= hoy));
  return vigente || [...viajes].reverse().find(v => v.llegada_fecha || v.salida_fecha || v.llegada_vuelo) || null;
};

/** Itinerario of the current trip: Confirmar → Enviar → Enviado */
export const itinerarioStatus = (alta = {}) => {
  if (alta.sin_viaje) return null;
  const v = viajeActivo(alta);
  if (!v) return null;
  if (v.itinerario_enviado) return ST('Enviado', '#198754');
  if (v.vuelo_confirmado) return ST('Enviar', '#f28c38');
  return ST('Confirmar', '#2f9be0');
};

/**
 * Viaje 1 (the first trip):
 *   Sin datos · Mat. genético · Revisar (arrival passed without confirmed flight,
 *   or return before arrival) · Probable (dates, flight not confirmed) ·
 *   En attende (confirmed, not arrived yet) · En curso · Concluido
 */
export const viaje1Status = (alta = {}) => {
  if (alta.sin_viaje) return ST('Mat. genético', '#a64df0');
  const v = (alta.viajes || [])[0];
  if (!v) return ST('Sin datos', '#a0a4a8');
  if (v.con_material_genetico) return ST('Mat. genético', '#a64df0');
  const ida = toDay(v.llegada_fecha), vuelta = toDay(v.salida_fecha), hoy = hoy0();
  if (!ida && !vuelta && !v.vuelo_confirmado) return ST('Sin datos', '#a0a4a8');
  if (ida && vuelta && vuelta < ida) return ST('Revisar', '#dc3545');
  if (!v.vuelo_confirmado) return ida && ida < hoy ? ST('Revisar', '#dc3545') : ST('Probable', '#f28c38');
  if (vuelta && vuelta < hoy) return ST('Concluido', '#198754');
  if (ida && ida <= hoy) return ST('En curso', '#14a38b');
  return ST('En attende', '#2f9be0');
};

/**
 * Depósitos of Crio embrio, one entry per deposit (numbered):
 *   no date → "Agendar" · date to come → "Programado" · date passed → where it
 *   was made (Kiromedic, Eligen, Care)
 */
export const depositosResumen = (crio = {}) => {
  const list = crio.depositos || [];
  if (!list.length) return null;
  const hoy = hoy0();
  return list.map((d, i) => {
    const f = toDay(d.fecha);
    if (!f) return { n: i + 1, kind: 'agendar', text: 'Agendar' };
    if (f >= hoy) return { n: i + 1, kind: 'programado', text: 'Programado' };
    return { n: i + 1, kind: 'hecho', text: d.deposito || 'Realizado' };
  });
};

/**
 * Selec Dona: the egg donor chosen for the program (crio.donante_seleccionado).
 *   no egg donors captured → Sin datos · none chosen → "Selec" button ·
 *   chosen → its ID + Completado (its capture date passed) or En attende
 */
export const selecDonaStatus = (crio = {}) => {
  const donors = (crio.egg_donors || []).filter(d => d.codigo);
  const sel = crio.donante_seleccionado;
  if (!sel) return { kind: donors.length ? 'seleccionar' : 'sin_datos', donors };
  const hoy = hoy0();
  const capturado = (crio.estimulaciones || []).some(e => e.donante === sel && toDay(e.captura) && toDay(e.captura) < hoy);
  return { kind: capturado ? 'completado' : 'en_attende', id: sel, donors };
};

/** Status General as chosen in Alta IP (default "Sin Datos"), with its color */
export const statusGeneral = (alta = {}) => {
  const o = IP_STATUS_GENERAL.find(x => x.label === alta.status_general) || IP_STATUS_GENERAL[0];
  return ST(o.label, o.color);
};

// ─────────────────────────────────────────────────────────────────────────────
// Crio Embrio list (Sort_IPS → Crio Embrio tab): one row per IP, from its last
// estimulación and last crio row.
// ─────────────────────────────────────────────────────────────────────────────
export const CRIO_LIST_STATUS = {
  espera_viaje:   { text: 'Espera Viaje',   color: '#14a38b' },
  viaje_curso:    { text: 'Viaje en Curso', color: '#e07a9a' },
  start_estimula: { text: 'Start Estimula', color: '#e07a9a' },
  estimula:       { text: 'Estimula',       color: '#6c6fc9' },
  crio_embrio:    { text: 'Crio Embrio',    color: '#a64df0' },
  en_biopsia:     { text: 'En Biopsia',     color: '#3d9a9a' },
  concluido:      { text: 'Concluido',      color: '#f2b400' },
};

const BIOPSIA_CORTA = { 'Biopsia total': 'BTotal', 'Biopsia parcial': 'BParcial', 'Sin biopsia': 'Sin Biopsia', Care: 'Care' };

/**
 * Status, most advanced first:
 *   last crio row: PGTA "Sí" → result date passed = Concluido · sent = En Biopsia ·
 *                  otherwise Crio Embrio; no PGTA → final date passed = Concluido
 *   last estimulación: capture passed = Crio Embrio · start passed = Estimula
 *   current trip under way = Viaje en Curso · start scheduled = Start Estimula
 *   otherwise Espera Viaje
 */
export const crioListStatus = (alta = {}, crio = {}) => {
  const hoy = hoy0();
  const past = (v) => { const d = toDay(v); return !!d && d < hoy; };
  const c = (crio.crios || []).slice(-1)[0];
  const e = (crio.estimulaciones || []).slice(-1)[0];
  if (c) {
    if (c.pgta === 'Sí') {
      if (past(c.resultado)) return CRIO_LIST_STATUS.concluido;
      if (c.envio_pgta) return CRIO_LIST_STATUS.en_biopsia;
      return CRIO_LIST_STATUS.crio_embrio;
    }
    return past(c.fecha_final) ? CRIO_LIST_STATUS.concluido : CRIO_LIST_STATUS.crio_embrio;
  }
  if (e && past(e.captura)) return CRIO_LIST_STATUS.crio_embrio;
  if (e && past(e.start_estimula)) return CRIO_LIST_STATUS.estimula;
  const v = alta.sin_viaje ? null : viajeActivo(alta);
  const ida = toDay(v?.llegada_fecha), vuelta = toDay(v?.salida_fecha);
  if (ida && ida <= hoy && (!vuelta || vuelta >= hoy)) return CRIO_LIST_STATUS.viaje_curso;
  if (e && e.start_estimula) return CRIO_LIST_STATUS.start_estimula;
  return CRIO_LIST_STATUS.espera_viaje;
};

export const crioListRow = (ip) => {
  const alta = ip.sections?.alta || {};
  const crio = ip.sections?.crio || {};
  const e = (crio.estimulaciones || []).slice(-1)[0] || null;
  const c = (crio.crios || []).slice(-1)[0] || null;
  const donante = crio.donante_seleccionado || e?.donante || c?.donante || '';
  return {
    donante,                                        // '' → "Sin confirmar"
    muestra: e?.muestra || '',
    ovo: e ? (e.split ? 'Split' : 'Single') : '',
    spliterIpId: e?.split ? e.spliter_ip_id : '',
    biopsia: e ? (BIOPSIA_CORTA[e.proceso] || 'Sin Biopsia') : '',
    captura: e && (e.start_estimula || e.captura) ? [e.start_estimula, e.captura] : null,
    mii: e?.mii ?? '',
    capturaPendiente: !!e && !e.mii && !(toDay(e.captura) && toDay(e.captura) < hoy0()),
    crioFecha: c?.fecha_final || c?.fecha_start || '',
    resultado: c?.desarrollo ?? '',
    xx: c?.xx ?? '', xy: c?.xy ?? '', ni: c?.ni ?? '',
    resultadoDocKey: c ? `crio_${c.id}_resultado` : null,
    estimadoDocKey: c ? `crio_${c.id}_estimado` : null,
    status: crioListStatus(alta, crio),
  };
};