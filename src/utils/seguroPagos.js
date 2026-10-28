// frontend/src/utils/seguroPagos.js
// Insurance-policy helpers shared by:
//  - SortGes.js      ("Seguro med" / "Seguro de Vida" tabs of each register)
//  - SegurosList.js  (Baby site → Listado de seguros)
// Moved here unchanged from SortGes.js so both screens always use the same
// payment-schedule rules.

// Tipo de pago config: months between payments, total payments over ~9 months coverage
export const TIPO_PAGO_CONFIG = {
  mensual:     { intervalo: 1,  label: 'Mensual',     cuotas: 12 },
  bimestral:   { intervalo: 2,  label: 'Bimestral',   cuotas: 6  },
  trimestral:  { intervalo: 3,  label: 'Trimestral',  cuotas: 3  },
  semestral:   { intervalo: 6,  label: 'Semestral',   cuotas: 2  },
  anual:       { intervalo: 12, label: 'Anual',       cuotas: 1  },
};

// Build pagos from tipo_pago + fecha_alta (payments start at month+intervalo − 10 days)
export const buildPagos = (tipoPago, valorCuota, fechaAlta) => {
  const cfg = TIPO_PAGO_CONFIG[tipoPago];
  if (!cfg || !fechaAlta) return [];
  const base = new Date(fechaAlta);
  return Array.from({ length: cfg.cuotas }, (_, i) => {
    // Advance (i+1) intervals from alta, then subtract 10 days
    const d = new Date(base);
    d.setMonth(d.getMonth() + cfg.intervalo * (i + 1));
    d.setDate(d.getDate() - 10);
    const vencimiento = d.toISOString().split('T')[0];
    return { cuota_num: i + 1, total: cfg.cuotas, vencimiento, fecha_pago: '', status: 'pendiente' };
  });
};

// Compute suggested fecha_liberacion = fecha_alta + 93 days
// (same rule as backend/services/seguroStatus.js → LIBERACION_DAYS)
export const LIBERACION_DAYS = 93;
export const computeMatLiberacion = (fechaAlta) => {
  if (!fechaAlta) return '';
  const d = new Date(fechaAlta);
  d.setDate(d.getDate() + LIBERACION_DAYS);
  return d.toISOString().split('T')[0];
};

// Auto-compute vencimiento = fecha_alta + 1 year
export const computeVidaVencimiento = (fechaAlta) => {
  if (!fechaAlta) return '';
  const d = new Date(fechaAlta);
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split('T')[0];
};

// Date from the API ("2026-08-01" or "2026-08-01T06:00:00.000Z") → "2026-08-01"
// for <input type="date"> and for saving to DATE columns.
export const toDateInput = (v) => {
  if (!v) return '';
  const m = String(v).match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : '';
};

// Display format for every date in the seguros screens: día-mes-año ("30-10-2026").
// Accepts "2026-10-30", an ISO datetime or a Date; empty → "—". (Date inputs keep
// the browser's own date picker.)
export const formatFechaDMY = (v) => {
  if (!v) return '—';
  const ymd = v instanceof Date && !Number.isNaN(v.getTime())
    ? `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')}`
    : toDateInput(v);
  if (!ymd) return '—';
  const [y, m, d] = ymd.split('-');
  return `${d}-${m}-${y}`;
};