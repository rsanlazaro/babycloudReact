// frontend/src/config/sortIpSections.js
// Sort_IPS configuration shared by the list (SortIPList.js) and each register
// (SortIP.js).
//
// ⚠ PROVISIONAL FIELDS — replace them with the real ones when defined.
// Fields are stored per tab as JSON (backend table sort_ip_sections), so
// adding, removing or renaming a field here needs NO database change.
// Field types: text | email | tel | number | date | textarea | select | check | gestante | categoria
//   - categoria → IP_CATEGORIAS (name + description while choosing)
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
// Chosen when the IP is created ("Nuevo IP") and editable in Alta IP. Only the
// name is stored; the description is shown while choosing and, in the list, in
// an information balloon next to the name.
export const IP_CATEGORIAS = [
  { value: 'Embrio', descripcion: 'Es un cliente' },
  { value: 'Baby',   descripcion: 'Tiene un bebé Babyboom' },
  { value: 'Child',  descripcion: 'Hizo un programa, pero no en Babyboom' },
  { value: 'Teen',   descripcion: 'Conflictivo' },
  { value: 'Adult',  descripcion: 'Recomendación de otro programa o pareja' },
  { value: 'Mayor',  descripcion: 'VIP' },
];

/** { value, descripcion } of a category, or null (empty / old value not in the list) */
export const ipCategoria = (value) => IP_CATEGORIAS.find(c => c.value === value) || null;

/** Text of an option while choosing: "Embrio — Es un cliente" */
export const ipCategoriaOptionLabel = (c) => `${c.value} — ${c.descripcion}`;

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

// Options of the IP's answers (Baby Cloud → Mis datos). Defined before
// IP_SECTIONS, which uses them.
export const SI_NO = ['Sí', 'No'];
export const UNITY_CATEGORIAS = ['1', '2', '3', '4'];

// "Proyecto parental" — Crio embrio tab (components/sortip/ProyectoParental.js),
// saved in the crio section. Also filled by the IP in Baby Cloud → Mis datos.
export const PROGRAMA_TIPOS = ['Single', 'Double'];
export const CAPTURA_TIPOS = ['Full', 'Split'];
export const SELECCION_DONANTE = ['Fenotipo', 'Catálogo'];   // Fenotipo (sin foto) / Catálogo (con fotos)
export const EMBARAZO_PREFERENCIAS = ['Único', 'Gemelar'];
// Categoría donante: "Fenotipo" when Selección donante is Fenotipo; one of
// CRIO_CATALOGOS when it is Catálogo
export const categoriaDonanteOptions = (seleccion) =>
  (seleccion === 'Fenotipo' ? ['Fenotipo'] : seleccion === 'Catálogo' ? CRIO_CATALOGOS : []);

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
      // Guests account of the IP, linked through the passport (create / link / unlink)
      { name: 'cuenta_cloud', label: 'Cuenta vinculada', type: 'guestAccount', col: 6, virtual: true },
      // On/off saved at once in the Alta IP data (vista_babycloud) + "Ir al registro"
      { name: 'vista_babycloud', label: 'Vista en Baby Cloud', type: 'cloudView', col: 6, virtual: true },
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
      // ── Answers of the IP (Baby Cloud → Mis datos). The "Proyecto parental"
      //    is in the Crio embrio tab; donor options are egg donors there. ──
      { name: '_h_proyecto', label: 'Pareja · Ayudas · Consentimiento', type: 'heading', col: 12, virtual: true,
        hint: 'Lo llena el IP en Baby Cloud → Mis datos; también se puede editar aquí.' },
      // Partner = another IP register, searched by passport (pareja_ip_id + pareja_link)
      { name: 'pareja_link', label: 'Linkar pareja', type: 'parejaLink', col: 12 },
      { name: 'unity_adhesion', label: 'Adhesión Unity', type: 'select', col: 4, options: SI_NO },
      { name: 'unity_categoria', label: 'Categoría Unity', type: 'select', col: 4, options: UNITY_CATEGORIAS },
      { name: 'consentimiento_imagen', label: 'Uso de imagen en redes', type: 'select', col: 4, options: SI_NO },
      { name: '_h_admin', label: 'Administración', type: 'heading', col: 12, virtual: true },
      { name: 'categoria', label: 'Categoría', type: 'categoria', col: 4 },
      // Calculated from the whole register (statusGeneralIp), not chosen
      { name: 'status_general', label: 'Status General', type: 'statusGeneral', col: 4 },
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
      // Milestones that move the Status General (statusGeneralIp)
      { name: 'h_seguimiento', label: 'Seguimiento', type: 'heading', col: 12, hint: 'Cada confirmación avanza el Status General' },
      { name: 'liberado', label: 'Liberado (aseguramiento)', type: 'check', col: 4 },
      { name: 'transfer_confirmado', label: 'Transfer confirmado', type: 'check', col: 4 },
      { name: 'saco_confirmado', label: 'Saco gestacional confirmado', type: 'check', col: 4 },
      { name: 'latido_confirmado', label: 'Latido del bebé confirmado', type: 'check', col: 4 },
      { name: 'parto_confirmado', label: 'Parto confirmado', type: 'check', col: 4 },
      { name: 'proceso_completado', label: 'Proceso completado (RG - Legal terminado)', type: 'check', col: 4 },
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
export const CRIO_AGENCIAS  = ['Fenotipo', 'FF', 'OD'];
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
// Depósitos have no limit (any number of trips, any number per trip)
export const CRIO_LIMITS    = { eggDonors: 10, estimulaciones: 3 };

const rid = (p) => `${p}${Date.now()}${Math.floor(Math.random() * 1000)}`;
// ip_opcion (1-3): the donor option the IP chose in Baby Cloud → Mis datos
export const newEggDonor = () => ({ id: rid('d'), codigo: '', agencia: '', catalogo: '' });
export const newDeposito = (viaje = 1) => ({ id: rid('p'), viaje, deposito: '', fecha: '', deposito_ok: false });
// *_ok: the field was confirmed with its ✓ button (cleared when the value changes)
// Donor / acompañamiento dates, each with its state:
//   aparta_donor 'YYYY-MM' + aparta_estado '' | 'cancelado' | 'confirmado'
//   reserva_donor · start_aco · stop_aco (dates) + <field>_estado '' | 'detenido' | 'en_curso'
//   cierre '' | 'anulada' | 'concluida' (Anular / Concluir estimulación)
export const newEstimulacion = () => ({
  id: rid('e'), donante: '', start_estimula: '', captura: '',
  aparta_donor: '', aparta_estado: '', reserva_donor: '', reserva_donor_estado: '',
  start_aco: '', start_aco_estado: '', stop_aco: '', stop_aco_estado: '', cierre: '',
  start_estimula_ok: false, captura_ok: false, owner_ok: false, spliter_ok: false,
  ovocitos: '', estado: '', split: false, owner_qtd: '', spliter_qtd: '', spliter_ip_id: '', proceso: '', proceso_qtd: '',
  muestra: '', mii: '',
});
// Washing (only when Proyecto parental → Lavado de semen is "Sí"):
//   envio_muestra · fecha_final (+ *_ok confirmed) · estado '' | 'detenido' | 'en_curso'
export const newWashing = () => ({
  id: rid('w'), envio_muestra: '', envio_muestra_ok: false, fecha_final: '', fecha_final_ok: false, estado: '',
});
/** A washing that is not stopped has its Final date confirmed → the rest of Crio embrio is available */
export const washingConfirmado = (washings = []) =>
  washings.some(w => w && w.estado !== 'detenido' && w.fecha_final && w.fecha_final_ok);

// Creación Embrionaria (one "Crio Embrio - n" per row):
//   estim_ref      'own:<estimulación id>' | 'split:<owner ip id>:<estimulación id>'  (Donor/Split)
//   donante        donor code of that estimulación (used by the lists)
//   fecha_start    Fecha día 1 FIV      fecha_final    Frozen FIV
//   fiv_result     FIV Result (date)    envio_biopsia  Envío Biopsia (date)
//   fecundados     FIV Total (≤ Owner, or ≤ Spliter when it is a received split)
//   biopsia · ni   Biopsia + NI/6 = FIV Total
//   pgta_qtd       PGTA ≤ Biopsia (pgta = 'Sí' when > 0)
//   xx · xy        XX + XY = PGTA
//   *_ok           date confirmed with its ✓ button
// Older rows may still have desarrollo (FIV Result as a number), envio_pgta and resultado.
export const newCrio = () => ({
  id: rid('c'), estim_ref: '', donante: '', fecha_start: '', fecha_final: '', fiv_result: '', envio_biopsia: '',
  fecha_start_ok: false, fecha_final_ok: false, fiv_result_ok: false, envio_biopsia_ok: false,
  fecundados: '', biopsia: '', ni: '', pgta: '', pgta_qtd: '', xy: '', xx: '',
});
/** Envío Biopsia (older rows: Envío PGTA) */
export const crioEnvioBiopsia = (c = {}) => c.envio_biopsia || c.envio_pgta || '';

/** Days between Fecha día 1 FIV and Frozen FIV ("Calcular Días"), or null */
export const crioDias = (c) => {
  const a = toDay(c.fecha_start), b = toDay(c.fecha_final);
  if (!a || !b) return null;
  return Math.round((b - a) / 86400000);
};

const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

/**
 * Rules of each "Crio Embrio" row → list of messages (empty = OK)
 *   FIV Total ≤ Owner (Spliter when it is a received split)
 *   Biopsia + NI/6 = FIV Total · PGTA ≤ Biopsia · XX + XY = PGTA
 * A sum is checked against its total once the total is captured: it can never
 * pass it, and must equal it once both parts are captured.
 * maxFec (optional): ovocitos of the chosen estimulación for this IP —
 *   Owner when it is this IP's own estimulación, Spliter when it is a split
 *   received from another IP (crioEstimOptions → max / split)
 * maxLabel: 'Owner' | 'Spliter' (for the message)
 */
export const crioRowErrors = (c, maxFec = null, maxLabel = 'Owner') => {
  const errs = [];
  const fiv = num(c.fecundados), bio = num(c.biopsia), ni = num(c.ni), pgta = num(c.pgta_qtd), xy = num(c.xy), xx = num(c.xx);
  if (fiv !== null && maxFec !== null && maxFec !== undefined && fiv > Number(maxFec)) {
    errs.push(`FIV Total no puede ser mayor que ${maxLabel} (${maxFec})`);
  }
  const parts = (label, a, b, total, totalLabel) => {
    if (total === null || (a === null && b === null)) return;
    const sum = (a || 0) + (b || 0);
    if (sum > total) errs.push(`${label} (${sum}) no puede pasar ${totalLabel} (${total})`);
    else if (a !== null && b !== null && sum !== total) errs.push(`${label} (${sum}) debe ser igual a ${totalLabel} (${total})`);
  };
  parts('Biopsia + NI/6', bio, ni, fiv, 'FIV Total');
  if (pgta !== null && bio !== null && pgta > bio) errs.push(`PGTA no puede ser mayor que Biopsia (${bio})`);
  parts('XX + XY', xx, xy, pgta, 'PGTA');
  return errs;
};

/** Estimulación cancelled (cancel button) or anulada (Anular estimulación) */
export const estimAnulada = (e = {}) => e.estado === 'cancelado' || e.cierre === 'anulada';

/**
 * Rules of one "Estimulaciones Ovarias/Captura" row:
 *   Owner ≤ Ovocitos · with Split: Spliter ≤ Owner and Owner + Spliter ≤ Ovocitos
 */
export const estimulacionErrors = (e) => {
  const errs = [];
  const ovo = num(e.ovocitos), owner = num(e.owner_qtd), spl = num(e.spliter_qtd);
  if (owner !== null && ovo !== null && owner > ovo) errs.push('Owner no puede ser mayor que Ovocitos');
  if (e.split && spl !== null && owner !== null && spl > owner) errs.push('Spliter no puede ser mayor que Owner');
  if (e.split && spl !== null && owner === null) errs.push('Indica primero los ovocitos de Owner');
  if (e.split && spl !== null && owner !== null && ovo !== null && owner + spl > ovo) {
    errs.push(`Owner + Spliter (${owner + spl}) no puede ser mayor que Ovocitos (${ovo})`);
  }
  return errs;
};

/**
 * Donor/Split options of Creación Embrionaria: this IP's estimulaciones
 * (owner) and the ones it receives as spliter. Cancelled ones are left out.
 *   → [{ value, label, donante, max, split, owner? , e }]
 */
export const crioEstimOptions = (estimulaciones = [], splitsWithMe = []) => [
  ...estimulaciones.filter(e => e.donante && !estimAnulada(e)).map(e => ({
    value: `own:${e.id}`, label: e.donante, donante: e.donante, max: num(e.owner_qtd), split: false, e,
  })),
  ...splitsWithMe.filter(x => x.e.donante && !estimAnulada(x.e)).map(({ owner, e }) => ({
    value: `split:${owner.id}:${e.id}`, label: `${e.donante} · Split`, donante: e.donante,
    max: num(e.spliter_qtd), split: true, owner, e,
  })),
];

/** Totals for the Sort_IPS list */
export const crioSummary = (crio = {}) => {
  const sum = (k) => (crio.crios || []).reduce((t, c) => t + (Number(c[k]) || 0), 0);
  return {
    eggDonors: (crio.egg_donors || []).filter(d => d.codigo).length,
    depositos: (crio.depositos || []).length,
    estimulaciones: (crio.estimulaciones || []).length,
    fecundados: sum('fecundados'),        // FIV Total
    biopsia: sum('biopsia'),
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
      { label: 'Categoría', value: ip => sec(ip, 'alta').categoria, type: 'categoria' },
      { label: 'Depósitos', value: ip => depositosResumen(sec(ip, 'crio')), type: 'depositos' },
      { label: 'Selec Dona', value: ip => ip, type: 'selecDona' },
      { label: 'Status General', value: ip => statusGeneral(ip), type: 'status' },
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
      { label: 'FIV Total', value: ip => crioSummary(sec(ip, 'crio')).fecundados || null },
      { label: 'Biopsia', value: ip => crioSummary(sec(ip, 'crio')).biopsia || null },
      { label: 'Con PGTA', value: ip => crioSummary(sec(ip, 'crio')).pgta || null },
    ],
  },
  {
    id: 'sin-asignar', label: 'Sin Asignar', icon: cilClock, color: '#e03a3a',
    filter: ip => !ip.gestante_id,       // no gestante assigned in "Programa"
    columns: [
      { label: 'País', value: ip => sec(ip, 'alta').pais },
      { label: '# Embriones', value: ip => crioSummary(sec(ip, 'crio')).fecundados || null },
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
  hospedaje_calle_no: '', hospedaje_numero: '', hospedaje_cp: '', hospedaje_colonia: '',
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
// "Concluido" is always dark blue, in every Sort_IPS table
export const CONCLUIDO_COLOR = '#0b2a6f';

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
  if (vuelta && vuelta < hoy) return ST('Concluido', CONCLUIDO_COLOR);
  if (ida && ida <= hoy) return ST('En curso', '#14a38b');
  return ST('En attende', '#2f9be0');
};

/**
 * Status of one depósito (Crio embrio card and list):
 *   no date → Programar · date, not confirmed → Programado ·
 *   confirmed ✓ (deposito_ok) → the Depósito value (Kiromedic, Eligen, Care)
 */
export const depositoStatus = (d = {}) => {
  if (!d.fecha) return { kind: 'programar', text: 'Programar' };
  if (d.deposito_ok && d.deposito) return { kind: 'hecho', text: d.deposito };
  return { kind: 'programado', text: 'Programado' };
};

/** Depósitos of Crio embrio, one entry per deposit (numbered), for the list */
export const depositosResumen = (crio = {}) => {
  const list = crio.depositos || [];
  if (!list.length) return null;
  return list.map((d, i) => {
    const st = depositoStatus(d);
    return { n: i + 1, kind: st.kind === 'programar' ? 'agendar' : st.kind, text: st.kind === 'programar' ? 'Agendar' : st.text };
  });
};

/**
 * Donor selected in the IP card (Crio embrio → Estimulaciones Ovarias/Captura → Donor):
 * the last estimulación that is not cancelled; when the IP has none of its own,
 * the last split it receives from another IP (splitsWithMe: [{ owner, e }]).
 *   → { codigo, e, split, owner } | null
 */
export const donanteSeleccionado = (crio = {}, splitsWithMe = []) => {
  const own = [...(crio.estimulaciones || [])].reverse().find(e => e.donante && !estimAnulada(e));
  if (own) return { codigo: own.donante, e: own, split: false };
  const rec = [...splitsWithMe].reverse().find(x => x.e?.donante && !estimAnulada(x.e));
  return rec ? { codigo: rec.e.donante, e: rec.e, split: true, owner: rec.owner } : null;
};

const filled = (v) => v !== '' && v !== null && v !== undefined;

/** A Creación Embrionaria row is finished: Frozen FIV confirmed ✓, FIV Total
 *  captured, no rule broken and, with PGTA, XX + XY captured */
export const crioRowTerminada = (c = {}, max = null, maxLabel = 'Owner') => {
  if (!c.fecha_final || !c.fecha_final_ok || !filled(c.fecundados)) return false;
  if (crioRowErrors(c, max, maxLabel).length) return false;
  if (Number(c.pgta_qtd) > 0 && (Number(c.xx) || 0) + (Number(c.xy) || 0) !== Number(c.pgta_qtd)) return false;
  return true;
};

/**
 * Selec Dona (list):
 *   sin_datos    the IP has not chosen any donor option (Baby Cloud → Mis datos) and
 *                there is nothing in Estimulaciones Ovarias/Captura
 *   preselect    the IP chose its options (egg donors marked IP), no estimulación yet
 *   seleccionado a donor was chosen in Estimulaciones Ovarias/Captura → its code
 *                (a received split counts too)
 */
export const selecDonaStatus = (crio = {}, splitsWithMe = []) => {
  const opcionesIp = (crio.egg_donors || []).filter(d => d.ip_opcion && d.codigo);
  const sel = donanteSeleccionado(crio, splitsWithMe);
  if (sel) return { kind: 'seleccionado', id: sel.codigo, split: sel.split, owner: sel.owner, opcionesIp };
  return { kind: opcionesIp.length ? 'preselect' : 'sin_datos', opcionesIp };
};

/**
 * Status General — calculated from the register, most advanced stage first:
 *   Completado      Programa → Proceso completado
 *   RG - Legal      Programa → Parto confirmado
 *   Embarazo        Programa → Latido del bebé confirmado
 *   Beta/Saco Gesta Programa → Transfer confirmado (until the latido is confirmed)
 *   Prepa Transfer  gestante assigned + liberada, with Inicio de preparación or a transfer date
 *   Valida Prepa    gestante assigned + liberada, no preparation / transfer date yet
 *   Espera Liberar  gestante assigned, not liberada yet (Programa → Liberado)
 *   Espera Asignar  a Creación Embrionaria row with PGTA, NI/6, XX and XY complete
 *   Crio Embrio     data in Estimulaciones Ovarias/Captura or Creación Embrionaria
 *   Depósito        the trip has started (arrival reached), a depósito with date,
 *                   or Con Material Genético / Sin viaje
 *   Pre Viaje       a trip registered that has not started
 *   Sin Datos       nothing yet
 * sections: { alta, crio, preparacion, programa }; splitsWithMe: received splits
 */
export const statusGeneralIp = (sections = {}, splitsWithMe = []) => {
  const pick = (label) => {
    const o = IP_STATUS_GENERAL.find(x => x.label === label) || IP_STATUS_GENERAL[0];
    return { ...ST(o.label, o.color), label: o.label };
  };
  const alta = sections.alta || {};
  const crio = sections.crio || {};
  const prep = sections.preparacion || {};
  const prog = sections.programa || {};
  const hoy = hoy0();
  const si = (v) => v === true || v === 'Sí';

  if (si(prog.proceso_completado)) return pick('Completado');
  if (si(prog.parto_confirmado)) return pick('RG - Legal');
  if (si(prog.latido_confirmado)) return pick('Embarazo');
  if (si(prog.transfer_confirmado)) return pick('Beta/Saco Gesta');
  if (prog.gestante_id) {
    if (!si(prog.liberado)) return pick('Espera Liberar');
    if (prep.fecha_inicio || prep.fecha_transfer_programada || prog.fecha_transfer) return pick('Prepa Transfer');
    return pick('Valida Prepa');
  }
  const completa = (c) => ['pgta_qtd', 'ni', 'xx', 'xy'].every(k => filled(c[k])) && !crioRowErrors(c).length;
  if ((crio.crios || []).some(completa)) return pick('Espera Asignar');
  const conDatos = (x) => Object.entries(x || {}).some(([k, v]) => !['id', 'estim_ref', 'estado', 'split'].includes(k) && !k.endsWith('_ok') && filled(v) && v !== false);
  if ((crio.estimulaciones || []).some(conDatos) || (crio.crios || []).some(conDatos) || splitsWithMe.length) return pick('Crio Embrio');
  const viajes = alta.viajes || [];
  if (alta.sin_viaje || viajes.some(v => v.con_material_genetico)) return pick('Depósito');
  if (viajes.some(v => toDay(v.llegada_fecha) && toDay(v.llegada_fecha) <= hoy) || (crio.depositos || []).some(d => d.fecha)) return pick('Depósito');
  if (viajes.some(v => v.llegada_fecha || v.salida_fecha || v.llegada_vuelo || v.vuelo_confirmado)) return pick('Pre Viaje');
  return pick('Sin Datos');
};

/** Status General of a list row (ip with sections) */
export const statusGeneral = (ip = {}, allIps = []) => statusGeneralIp(ip.sections || {}, allIps.length ? splitsWithIp(ip.id, allIps) : []);

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
  concluido:      { text: 'Concluido',      color: CONCLUIDO_COLOR },
};

const BIOPSIA_CORTA = { 'Biopsia total': 'BTotal', 'Biopsia parcial': 'BParcial', 'Sin biopsia': 'Sin Biopsia', Care: 'Care' };

/**
 * Status, most advanced first:
 *   last crio row: Biopsia/PGTA → XX + XY = PGTA = Concluido · Envío Biopsia = En Biopsia ·
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
    const pgta = Number(c.pgta_qtd) || 0;
    if (pgta > 0 || Number(c.biopsia) > 0 || c.pgta === 'Sí') {
      // PGTA results captured (XX + XY = PGTA) → Concluido (older rows: Resultado PGTA date passed)
      const sexados = (Number(c.xx) || 0) + (Number(c.xy) || 0);
      if ((pgta > 0 && sexados === pgta) || past(c.resultado)) return CRIO_LIST_STATUS.concluido;
      if (crioEnvioBiopsia(c)) return CRIO_LIST_STATUS.en_biopsia;
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
  const donante = donanteSeleccionado(crio)?.codigo || c?.donante || '';
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
    resultado: c ? (c.fecundados !== undefined && c.fecundados !== '' ? c.fecundados : (c.desarrollo ?? '')) : '',   // FIV Total
    xx: c?.xx ?? '', xy: c?.xy ?? '', ni: c?.ni ?? '',
    resultadoDocKey: c ? `crio_${c.id}_resultado` : null,
    estimadoDocKey: c ? `crio_${c.id}_estimado` : null,
    status: crioListStatus(alta, crio),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Occurrences / warnings of an IP (red number next to the name and on each tab)
// ─────────────────────────────────────────────────────────────────────────────
// Profile tabs (IP_SECTIONS keys) shown under each list tab (IP_LIST_TABS ids)
export const LIST_TAB_WARNING_SECTIONS = {
  'data-ip': ['alta', 'checklist'],
  'crio-embrio': ['crio'],
  'prepa-transfer': ['preparacion'],
  embarazo: ['programa'],
};

/**
 * Every occurrence of one IP → [{ section, text }] (section = IP_SECTIONS key)
 *   checklist  documents missing for a trip that already has its flight;
 *              documents expired or about to expire
 *   crio       Washing without its Final confirmed (Lavado de semen = Sí);
 *              rule errors of Estimulaciones and Creación Embrionaria;
 *              dates already passed that are not confirmed (✓)
 * sections:     the IP's sections ({ alta, checklist, crio, docs, ... })
 * splitsWithMe: other IPs' estimulaciones split with this IP ([{ owner, e }]),
 *               for the FIV Total limit of received splits
 */
export const ipWarnings = (sections = {}, splitsWithMe = []) => {
  const out = [];
  const add = (section, text) => out.push({ section, text });
  const alta = sections.alta || {};
  const crio = sections.crio || {};
  const past = (v) => { const d = toDay(v); return !!d && d < hoy0(); };

  if (!alta.sin_viaje) {
    pendingDocs(alta.viajes, sections.docs || {}).forEach(p =>
      p.faltantes.forEach(f => add('checklist', `Viaje ${p.numero} (${p.columna}): falta ${f}`)));
  }
  vigenciaAlerts(sections.checklist || {}).forEach(a => add('checklist', vigenciaText(a)));

  (crio.depositos || []).forEach((d, i) => {
    if (past(d.fecha) && !(d.deposito_ok && d.deposito)) add('crio', `Depósito ${i + 1}: la fecha ya pasó y no está confirmado`);
  });
  if (crio.lavado_semen === 'Sí' && !washingConfirmado(crio.washings)) {
    add('crio', 'Washing: falta confirmar la fecha Final (bloquea Estimulaciones y Creación Embrionaria)');
  }
  (crio.estimulaciones || []).forEach((e, i) => {
    estimulacionErrors(e).forEach(m => add('crio', `Estimulación ${i + 1}: ${m}`));
    if (estimAnulada(e)) return;
    [['start_estimula', 'Start Estimula'], ['captura', 'Captura']].forEach(([k, label]) => {
      if (past(e[k]) && !e[`${k}_ok`]) add('crio', `Estimulación ${i + 1}: ${label} ya pasó y no está confirmada`);
    });
  });
  const opts = crioEstimOptions(crio.estimulaciones || [], splitsWithMe);
  (crio.crios || []).forEach((c, i) => {
    const o = opts.find(x => x.value === c.estim_ref);
    crioRowErrors(c, o?.max ?? null, o?.split ? 'Spliter' : 'Owner').forEach(m => add('crio', `Crio Embrio ${i + 1}: ${m}`));
    [['fecha_start', 'Fecha día 1 FIV', c.fecha_start], ['fiv_result', 'FIV Result', c.fiv_result],
      ['fecha_final', 'Frozen FIV', c.fecha_final], ['envio_biopsia', 'Envío Biopsia', crioEnvioBiopsia(c)]]
      .forEach(([k, label, v]) => {
        if (past(v) && !c[`${k}_ok`]) add('crio', `Crio Embrio ${i + 1}: ${label} ya pasó y no está confirmada`);
      });
  });
  return out;
};

/** Other IPs' estimulaciones split with `ipId`, from the full list of IPs (with sections) */
export const splitsWithIp = (ipId, allIps = []) => allIps
  .filter(o => String(o.id) !== String(ipId))
  .flatMap(o => (o.sections?.crio?.estimulaciones || [])
    .filter(e => e.split && String(e.spliter_ip_id) === String(ipId))
    .map(e => ({ owner: o, e })));

/** Count by section → { alta: n, checklist: n, crio: n, ... } */
export const warningsBySection = (warnings = []) =>
  warnings.reduce((acc, w) => ({ ...acc, [w.section]: (acc[w.section] || 0) + 1 }), {});

// ─────────────────────────────────────────────────────────────────────────────
// Crio Embrio list (layout with sub-tabs Tabulador / Abiertos / Concluidos / General)
// ─────────────────────────────────────────────────────────────────────────────
// Status of one estimulación (table "Estimulación y Captura")
export const ESTIM_LIST_STATUS = {
  sin_datos:        { key: 'sin_datos',        text: 'Sin datos',        color: '#a0a4a8', italic: true },
  en_fila:          { key: 'en_fila',          text: 'En fila',          color: '#6c6fc9', italic: true },
  espera_aco:       { key: 'espera_aco',       text: 'Espera ACO',       color: '#e03a3a', italic: true },
  estimula_aco:     { key: 'estimula_aco',     text: 'Estimula ACO',     color: '#14a35b', italic: true },
  captura_estimula: { key: 'captura_estimula', text: 'Captura estimula', color: '#14a3b8', italic: true },
  capturado:        { key: 'capturado',        text: 'Capturado',        color: '#1d4fa8' },
  cancelada:        { key: 'cancelada',        text: 'Cancelada',        color: '#e03a3a' },
};
/**
 * Status of one estimulación, from its dates in Estimulaciones Ovarias/Captura
 * (the most advanced one wins):
 *   Cancelada         cancelled at any point (cancel button, Anular estimulación,
 *                     or Aparta donor cancelled)
 *   Capturado         Captura has a date
 *   Captura estimula  Stop aco and Start Estimula have dates
 *   Estimula ACO      Start aco has a date
 *   Espera ACO        Reserva donor has a date
 *   En fila           Aparta donor (month) and the Donor code
 *   Sin datos         none of the above
 */
export const estimListStatus = (e = {}) => {
  const S = ESTIM_LIST_STATUS;
  if (estimAnulada(e) || e.aparta_estado === 'cancelado') return S.cancelada;
  if (e.captura) return S.capturado;
  if (e.stop_aco && e.start_estimula) return S.captura_estimula;
  if (e.start_aco) return S.estimula_aco;
  if (e.reserva_donor) return S.espera_aco;
  if (e.aparta_donor && e.donante) return S.en_fila;
  return S.sin_datos;
};

// Process status of the IP (table "Creación Embrionaria")
export const CRIO_PROCESO_STATUS = {
  sin_datos:       { key: 'sin_datos',       text: 'Sin Datos',       color: '#14a38b' },
  viaje_curso:     { key: 'viaje_curso',     text: 'Viaje en Curso',  color: '#e07a9a' },
  washing:         { key: 'washing',         text: 'Washing',         color: '#e889a8' },
  espera_estimula: { key: 'espera_estimula', text: 'Espera Estimula', color: '#e07a9a' },
  estimulando:     { key: 'estimulando',     text: 'Estimulando',     color: '#6c6fc9' },
  espera_pgta:     { key: 'espera_pgta',     text: 'Espera PGTA',     color: '#3d9a9a' },
  concluido:       { key: 'concluido',       text: 'Concluido',       color: CONCLUIDO_COLOR },
  cancelada:       { key: 'cancelada',       text: 'Cancelada',       color: '#e03a3a' },
};
/**
 *   last Creación Embrionaria row finished → Concluido · rows not finished → Espera PGTA ·
 *   Washing not confirmed → Washing · an estimulación started (date reached or
 *   confirmed) → Estimulando · scheduled/queued → Espera Estimula ·
 *   every estimulación cancelled → Cancelada · current trip → Viaje en Curso · Sin Datos
 */
export const crioProcesoStatus = (alta = {}, crio = {}, splitsWithMe = []) => {
  const S = CRIO_PROCESO_STATUS;
  const crios = crio.crios || [];
  const opts = crioEstimOptions(crio.estimulaciones || [], splitsWithMe);
  if (crios.length) {
    const c = crios[crios.length - 1];
    const o = opts.find(x => x.value === c.estim_ref);
    return crioRowTerminada(c, o?.max ?? null, o?.split ? 'Spliter' : 'Owner') ? S.concluido : S.espera_pgta;
  }
  if (crio.lavado_semen === 'Sí' && !washingConfirmado(crio.washings)) return S.washing;
  const estims = [...(crio.estimulaciones || []), ...splitsWithMe.map(x => x.e)];
  const activas = estims.filter(e => !estimAnulada(e));
  if (activas.some(e => (e.start_estimula && e.start_estimula_ok) || (toDay(e.start_estimula) && toDay(e.start_estimula) <= hoy0()))) return S.estimulando;
  if (activas.length) return S.espera_estimula;
  if (estims.length) return S.cancelada;
  const v = alta.sin_viaje ? null : viajeActivo(alta);
  const ida = toDay(v?.llegada_fecha), vuelta = toDay(v?.salida_fecha), hoy = hoy0();
  if (ida && ida <= hoy && (!vuelta || vuelta >= hoy)) return S.viaje_curso;
  return S.sin_datos;
};

/** WASH column: N/A (no Lavado de semen) · Finalizado (Final confirmed) · last date · '-' */
export const washListValue = (crio = {}) => {
  if (crio.lavado_semen === 'No') return { text: 'N/A' };
  if (crio.lavado_semen !== 'Sí') return { text: '-' };
  if (washingConfirmado(crio.washings)) return { text: 'Finalizado', done: true };
  const w = [...(crio.washings || [])].reverse().find(x => x.fecha_final || x.envio_muestra);
  return w ? { date: w.fecha_final || w.envio_muestra } : { text: '-' };
};

/** BIOPSIA label from the numbers: Integral (all to biopsy) · Parcial · Sin Biopsia */
export const biopsiaLabel = (c = {}) => {
  if (!filled(c.biopsia)) return '';
  const bio = Number(c.biopsia) || 0;
  if (bio === 0) return 'Sin Biopsia';
  return Number(c.ni) > 0 ? 'Parcial' : 'Integral';
};

/**
 * Rows of the Crio Embrio list for one IP (ipById: id → ip, for names)
 *   estim: one per estimulación (own + received splits); one empty row when there is none
 *   crea:  one per Creación Embrionaria row; one empty row when there is none
 *   proceso: CRIO_PROCESO_STATUS of the IP
 */
export const crioListRows = (ip, allIps = []) => {
  const alta = ip.sections?.alta || {};
  const crio = ip.sections?.crio || {};
  const splits = splitsWithIp(ip.id, allIps);
  const nombre = (id) => allIps.find(x => String(x.id) === String(id))?.nombre_completo || '';
  const tipoPrograma = crio.programa_tipo || 'Single';
  const estim = [
    ...(crio.estimulaciones || []).map(e => ({
      e, key: e.id, donante: e.donante, split: !!e.split,
      captureType: e.split ? 'Split' : tipoPrograma,
      otherIpId: e.split ? e.spliter_ip_id : '', otherName: e.split ? nombre(e.spliter_ip_id) : '', received: false,
      status: estimListStatus(e),
    })),
    ...splits.map(({ owner, e }) => ({
      e, key: `split-${owner.id}-${e.id}`, donante: e.donante, split: true, captureType: 'Split',
      otherIpId: owner.id, otherName: owner.nombre_completo, received: true,
      status: estimListStatus(e),
    })),
  ];
  return {
    wash: washListValue(crio),
    estim: estim.length ? estim : [{ key: 'none', empty: true, status: ESTIM_LIST_STATUS.en_fila }],
    crea: (crio.crios || []).length ? crio.crios.map(c => ({ c, key: c.id })) : [{ key: 'none', empty: true }],
    proceso: crioProcesoStatus(alta, crio, splits),
  };
};