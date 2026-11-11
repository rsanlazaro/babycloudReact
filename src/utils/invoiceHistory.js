// frontend/src/utils/invoiceHistory.js
// Registers a generated invoice in the history (backend: /api/invoice-history).
// Generating the same invoice number again updates its register.

import api from '../services/api';

export const saveInvoiceHistory = async (empresa, formData) => {
  const { data } = await api.post('/api/invoice-history', {
    empresa,
    moneda: formData.currency === 'dollar' ? 'USD' : 'EUR',
    numero_factura: formData.invoiceNumber,
    fecha: formData.date,
    saldo: formData.balanceDue,
    facturar_a: formData.billTo,
    pais: formData.country,
    total: formData.total,
    datos: formData, // full form → "Cargar" puts it back in the form
  });
  return data;
};

export const historyErrorMessage = (err) =>
  err?.response?.data?.message
  || (err?.response ? `error ${err.response.status}` : 'sin conexión con el servidor');