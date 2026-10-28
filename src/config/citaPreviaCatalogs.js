// frontend/src/config/citaPreviaCatalogs.js
// Sort_GESCA → Cita previa: catalogs and rules shared by the register page
// (SortGes.js) and the list (SortGesList.js → Att. Previa).
// Each sub-tab (Iniciales, Tratamiento previo, Prepa/Transfer, Pre Natal,
// Materno Fetal) has a "Citas" block and a "Laboratorios" block.
// Values are stored as short keys; labels can be edited here freely.

export const CITA_TIPOS = {
  cita:        { label: 'Citas',        singular: 'cita' },
  laboratorio: { label: 'Laboratorios', singular: 'laboratorio' },
};

// ── Incidencia categories — what the tables show ─────────────────────────────
export const INCIDENCIA_CATEGORIAS = {
  si_tratable:      { label: 'Si tratable',      color: 'success' },
  posible_descarte: { label: 'Posible descarte', color: 'danger'  },
};

// ── Motivos ──────────────────────────────────────────────────────────────────
// Citas — Iniciales
const MOTIVOS_CITAS_INICIALES = [
  { value: 'valoracion_medica',      label: 'Cita de valoración médica' },
  { value: 'cita_laboratorios',      label: 'Cita de laboratorios (posterior, si es Apta)' },
  { value: 'evaluacion_psicologica', label: 'Evaluación psicológica (posterior, si es Apta)' },
];

// Laboratorios — Pre Natal. `protocolo` = green (always), `adicionales` = orange
// (taken only if needed).
// ⚠ The source list didn't mark colors in text: where a line ends with the
// repeated "Prueba de función hepática, Examen general de orina", that part was
// taken as additional. Adjust protocolo/adicionales here if needed.
export const LABS_PRENATAL = [
  { value: 'sdg8',  label: 'SDG 8 – Laboratorios de primer trimestre',
    protocolo: 'BH, química sanguínea 35 elementos, cultivo vaginal, urocultivo y mycoplasma', adicionales: '' },
  { value: 'sdg10', label: 'SDG 10', protocolo: '', adicionales: '' },
  { value: 'sdg12', label: 'SDG 12 (Materno Fetal) – DNA fetal', protocolo: 'DNA fetal', adicionales: '' },
  { value: 'sdg16', label: 'SDG 16 – Laboratorios de segundo trimestre',
    protocolo: 'BH, química sanguínea 35 elementos, cultivo vaginal, urocultivo y mycoplasma',
    adicionales: 'Prueba de función hepática, examen general de orina' },
  { value: 'sdg20', label: 'SDG 20', protocolo: 'Mycoplasma', adicionales: 'Prueba de función hepática' },
  { value: 'sdg22', label: 'SDG 22 (Materno Fetal)', protocolo: '',
    adicionales: 'Prueba de función hepática, examen general de orina' },
  { value: 'sdg24', label: 'SDG 24', protocolo: '',
    adicionales: 'Prueba de función hepática, examen general de orina' },
  { value: 'sdg26', label: 'SDG 26', protocolo: 'Curva de tolerancia a la glucosa, química sanguínea y BH',
    adicionales: 'Prueba de función hepática, examen general de orina' },
  { value: 'sdg30', label: 'SDG 30 – Laboratorios de tercer trimestre',
    protocolo: 'BH, química sanguínea 35 elementos, cultivo vaginal, urocultivo, mycoplasma',
    adicionales: 'Prueba de función hepática, examen general de orina' },
  { value: 'sdg32', label: 'SDG 32 (Materno Fetal)', protocolo: '',
    adicionales: 'Prueba de función hepática, examen general de orina' },
  { value: 'sdg34', label: 'SDG 34', protocolo: '',
    adicionales: 'Prueba de función hepática, examen general de orina' },
  { value: 'sdg35', label: 'SDG 35', protocolo: '',
    adicionales: 'Prueba de función hepática, examen general de orina' },
  { value: 'sdg36', label: 'SDG 36 – Preoperatorio', protocolo: 'BH, tiempos de coagulación, cultivo vaginal',
    adicionales: 'Prueba de función hepática, examen general de orina' },
  { value: 'sdg37', label: 'SDG 37', protocolo: '',
    adicionales: 'Prueba de función hepática, examen general de orina' },
  { value: 'puerperio', label: 'Puerperio',
    protocolo: 'Perfil preeclámptico, BH, urea, creatinina, perfil hepático, proteínas totales en orina, glucosa, curva de tolerancia sin carga de glucosa',
    adicionales: '' },
];

// Fallbacks for sub-tabs whose lists haven't been defined yet
const MOTIVOS_CITAS_DEFAULT = [
  { value: 'cita_inicial',         label: 'Cita inicial' },
  { value: 'seg_sdg',              label: 'Seg SDG' },
  { value: 'tratamiento_previo',   label: 'Tratamiento previo' },
  { value: 'nutricion',            label: 'Nutrición' },
  { value: 'cultivos_laboratorio', label: 'Cultivos/Laboratorio' },
  { value: 'materno_fetal',        label: 'Materno Fetal' },
  { value: 'otro',                 label: 'Otro' },
];
const MOTIVOS_LABS_DEFAULT = [
  { value: 'laboratorios_generales', label: 'Laboratorios generales' },
  { value: 'otro_lab',               label: 'Otro' },
];

// sub-tab → motivos, per tipo
const MOTIVOS = {
  cita:        { iniciales: MOTIVOS_CITAS_INICIALES },
  laboratorio: { pre_natal: LABS_PRENATAL },
};

export const getMotivos = (tipo, subTab) =>
  MOTIVOS[tipo]?.[subTab] || (tipo === 'laboratorio' ? MOTIVOS_LABS_DEFAULT : MOTIVOS_CITAS_DEFAULT);

const ALL_MOTIVOS = [
  ...MOTIVOS_CITAS_INICIALES, ...LABS_PRENATAL, ...MOTIVOS_CITAS_DEFAULT, ...MOTIVOS_LABS_DEFAULT,
];
export const getMotivoLabel = (value) => ALL_MOTIVOS.find(m => m.value === value)?.label || '';
export const getPrenatalLab = (value) => LABS_PRENATAL.find(l => l.value === value) || null;

// ── Incidencias ──────────────────────────────────────────────────────────────
const INCIDENCIAS_CITA_INICIAL = [
  { value: 'obesidad',               label: 'Obesidad – Nutrición',                         categoria: 'si_tratable' },
  { value: 'miomatosis_uterina',     label: 'Miomatosis uterina',                           categoria: 'posible_descarte' },
  { value: 'quiste',                 label: 'Quiste',                                       categoria: 'si_tratable' },
  { value: 'antecedente_obstetrico', label: 'Antecedente obstétrico no favorable (hemorragia uterina, parto pretérmino, restricción de crecimiento, preeclampsia, complicaciones fetales)', categoria: 'posible_descarte' },
  { value: 'toxicomanias',           label: 'Toxicomanías (tabaquismo, alcoholismo)',       categoria: 'posible_descarte' },
  { value: 'implante_dispositivo',   label: 'Implante o dispositivo – Enfermería',          categoria: 'si_tratable' },
  { value: 'multigesta',             label: 'Multigesta',                                   categoria: 'posible_descarte' },
  { value: 'cesarea_iterativa',      label: 'Cesárea iterativa',                            categoria: 'posible_descarte' },
  { value: 'sindrome_asherman',      label: 'Síndrome de Asherman (sinequias uterinas)',    categoria: 'posible_descarte' },
  { value: 'edad_no_favorable',      label: 'Edad no favorable para programa (38 años)',    categoria: 'posible_descarte' },
  { value: 'istmocele',              label: 'Istmocele',                                    categoria: 'posible_descarte' },
];

const INCIDENCIAS_LABORATORIO = [
  { value: 'ivu',                    label: 'Infección de vías urinarias',       categoria: 'si_tratable' },
  { value: 'infeccion_vaginal',      label: 'Infección vaginal',                 categoria: 'si_tratable' },
  { value: 'funciones_hepaticas',    label: 'Funciones hepáticas',               categoria: 'si_tratable' },
  { value: 'vph',                    label: 'VPH',                               categoria: 'posible_descarte' },
  { value: 'papanicolaou_malignas',  label: 'Papanicolaou con células malignas', categoria: 'posible_descarte' },
  { value: 'hipertension',           label: 'Hipertensión',                      categoria: 'posible_descarte' },
  { value: 'diabetes',               label: 'Diabetes',                          categoria: 'posible_descarte' },
  { value: 'hipotiroidismo',         label: 'Hipotiroidismo',                    categoria: 'si_tratable' },
  { value: 'hepatitis_b',            label: 'Hepatitis B',                       categoria: 'posible_descarte' },
  { value: 'micoplasma',             label: 'Micoplasma',                        categoria: 'si_tratable' },
  { value: 'ureaplasma',             label: 'Ureaplasma',                        categoria: 'si_tratable' },
  { value: 'anemia',                 label: 'Anemia',                            categoria: 'si_tratable' },
  { value: 'ets',                    label: 'ETS',                               categoria: 'si_tratable' },
  { value: 'gardnerella',            label: 'Gardnerella',                       categoria: 'si_tratable' },
  { value: 'vaginosis_bacteriana',   label: 'Vaginosis bacteriana',              categoria: 'si_tratable' },
];

// Citas: per sub-tab (only Iniciales defined so far). Laboratorios: same list everywhere.
const INCIDENCIAS = {
  cita:        { iniciales: INCIDENCIAS_CITA_INICIAL },
  laboratorio: { default: INCIDENCIAS_LABORATORIO },
};

export const getIncidencias = (tipo, subTab) =>
  INCIDENCIAS[tipo]?.[subTab] || INCIDENCIAS[tipo]?.default || [];

const ALL_INCIDENCIAS = [...INCIDENCIAS_CITA_INICIAL, ...INCIDENCIAS_LABORATORIO];
export const getIncidencia = (value) => ALL_INCIDENCIAS.find(i => i.value === value) || null;
/** { label, color } of an incidencia's category, or null */
export const getIncidenciaCategoria = (value) =>
  INCIDENCIA_CATEGORIAS[getIncidencia(value)?.categoria] || null;

// ── Resolución and Status cita ───────────────────────────────────────────────
export const RESOLUCION_OPTIONS = [
  { value: 'alerta',            label: 'Alerta' },
  { value: 'alerta_incidencia', label: 'Alerta incidencia' },
  { value: 'no_apta',           label: 'No apta' },
];

// Same stored keys as before ('confirmado' / 'completado'), new labels
export const STATUS_CITA_OPTIONS = [
  { value: 'confirmado', label: 'Confirmada' },
  { value: 'completado', label: 'Completada' },
];

// ── "Status" (automatic) ─────────────────────────────────────────────────────
// ⚠ PROVISIONAL RULES — change only here.
//   Completada (status cita) → Completada
//   no date                  → Por agendar
//   date in the future       → Programada
//   date is today            → Hoy
//   date passed              → Pendiente de cierre (not marked completed)
const todayYmd = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const computeCitaStatus = (cita) => {
  if (cita?.status === 'completado') return { label: 'Completada', color: 'success' };
  const fecha = String(cita?.fecha_cita || '').slice(0, 10);
  if (!fecha) return { label: 'Por agendar', color: 'secondary' };
  const hoy = todayYmd();
  if (fecha > hoy) return { label: 'Programada', color: 'info' };
  if (fecha === hoy) return { label: 'Hoy', color: 'warning' };
  return { label: 'Pendiente de cierre', color: 'danger' };
};

// ── "No acudió" ──────────────────────────────────────────────────────────────
// From this many no-shows on, the button asks: "Agendar cita" or "Solicitar descarte"
export const NO_ACUDIO_LIMIT = 3;
export { todayYmd };

/** Parses the stored history (JSON text or array) into [{ fecha_cita, remarcada }] */
export const parseNoAcudio = (v) => {
  if (Array.isArray(v)) return v;
  if (!v) return [];
  try { const a = JSON.parse(v); return Array.isArray(a) ? a : []; } catch { return []; }
};