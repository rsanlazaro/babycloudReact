// frontend/src/views/babysite/progestor/InvoiceHistory.js
// History of the invoices generated in one Bills section
// (BabyMedic, Nexa Travel or Travel Medical Care).
//
// <InvoiceHistory empresa="babymedic" refreshKey={n} canEdit onLoad={(datos) => ...} />
//   refreshKey → change it to reload the list (e.g. after generating a PDF)
//   onLoad     → "Cargar" puts that invoice back into the form

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CCard, CCardHeader, CCardBody, CTable, CTableHead, CTableRow, CTableHeaderCell,
  CTableBody, CTableDataCell, CBadge, CButton, CSpinner, CAlert, CFormSelect,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilHistory, cilSearch, cilTrash, cilPencil, cilReload } from '@coreui/icons';
import api from '../../../services/api';
import { historyErrorMessage } from '../../../utils/invoiceHistoryApi';

const formatDMY = (v) => {
  const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '—';
};

const formatMoney = (value, moneda) => {
  if (value === null || value === undefined || value === '') return '—';
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return '—';
  const symbol = moneda === 'EUR' ? '€' : '$';
  return `${symbol} ${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const InvoiceHistory = ({ empresa, refreshKey = 0, canEdit = false, onLoad }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [moneda, setMoneda] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/api/invoice-history', { params: { empresa } });
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(`No se pudo cargar el historial (${historyErrorMessage(err)})`);
    } finally {
      setLoading(false);
    }
  }, [empresa]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (moneda && r.moneda !== moneda) return false;
      if (!q) return true;
      return [r.numero_factura, r.facturar_a, r.pais, formatDMY(r.fecha), r.moneda, formatMoney(r.saldo, r.moneda)]
        .filter(Boolean).join(' ').toLowerCase().includes(q);
    });
  }, [rows, search, moneda]);

  const handleDelete = async (row) => {
    if (!window.confirm(`¿Eliminar del historial la factura ${row.numero_factura} (${row.facturar_a})?`)) return;
    setDeletingId(row.id);
    try {
      await api.delete(`/api/invoice-history/${row.id}`);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      setError(`No se pudo eliminar (${historyErrorMessage(err)})`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <CCard className="mb-4 inv-hist">
      <CCardHeader className="d-flex flex-wrap align-items-center gap-2">
        <strong className="d-flex align-items-center">
          <CIcon icon={cilHistory} className="me-2" />Historial de facturas
        </strong>
        <span className="text-muted small">{filtered.length} de {rows.length}</span>
        <div className="ms-auto d-flex flex-wrap align-items-center gap-2">
          <CFormSelect
            size="sm" value={moneda} onChange={(e) => setMoneda(e.target.value)}
            aria-label="Filtrar por moneda" style={{ width: 120 }}
          >
            <option value="">Todas</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </CFormSelect>
          <div className="inv-hist-search">
            <CIcon icon={cilSearch} className="inv-hist-search-icon" />
            <input
              type="search" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..." aria-label="Buscar en el historial de facturas" autoComplete="off"
            />
          </div>
          <CButton size="sm" color="secondary" variant="ghost" onClick={load} disabled={loading} title="Actualizar" aria-label="Actualizar historial">
            {loading ? <CSpinner size="sm" /> : <CIcon icon={cilReload} />}
          </CButton>
        </div>
      </CCardHeader>
      <CCardBody className="p-0">
        {error && <CAlert color="danger" className="m-3 py-2">{error}</CAlert>}
        <div className="table-responsive">
          <CTable hover align="middle" className="mb-0 small">
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>Moneda</CTableHeaderCell>
                <CTableHeaderCell>Número de factura</CTableHeaderCell>
                <CTableHeaderCell>Fecha</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Saldo</CTableHeaderCell>
                <CTableHeaderCell>Facturar a</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Acciones</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {filtered.map((r) => (
                <CTableRow key={r.id}>
                  <CTableDataCell>
                    <CBadge color={r.moneda === 'EUR' ? 'info' : 'success'}>{r.moneda === 'EUR' ? '€ EUR' : '$ USD'}</CBadge>
                  </CTableDataCell>
                  <CTableDataCell className="fw-semibold">{r.numero_factura}</CTableDataCell>
                  <CTableDataCell className="text-nowrap">{formatDMY(r.fecha)}</CTableDataCell>
                  <CTableDataCell className="text-end text-nowrap">{formatMoney(r.saldo, r.moneda)}</CTableDataCell>
                  <CTableDataCell>
                    {r.facturar_a}
                    {r.pais && <div className="text-muted" style={{ fontSize: '.75rem' }}>{r.pais}</div>}
                  </CTableDataCell>
                  <CTableDataCell className="text-end text-nowrap">
                    <CButton
                      size="sm" color="primary" variant="outline" className="me-1"
                      disabled={!r.datos || !onLoad}
                      title="Cargar en el formulario para volver a generarla"
                      onClick={() => onLoad?.(r.datos, r)}
                    >
                      <CIcon icon={cilPencil} className="me-1" />Cargar
                    </CButton>
                    {canEdit && (
                      <CButton
                        size="sm" color="danger" variant="outline"
                        disabled={deletingId === r.id}
                        title="Eliminar del historial" aria-label={`Eliminar factura ${r.numero_factura} del historial`}
                        onClick={() => handleDelete(r)}
                      >
                        {deletingId === r.id ? <CSpinner size="sm" /> : <CIcon icon={cilTrash} />}
                      </CButton>
                    )}
                  </CTableDataCell>
                </CTableRow>
              ))}
              {!filtered.length && (
                <CTableRow>
                  <CTableDataCell colSpan={6} className="text-center text-muted py-4">
                    {loading ? 'Cargando...' : (rows.length ? 'Sin resultados para la búsqueda' : 'Aún no se ha generado ninguna factura')}
                  </CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>
        </div>
      </CCardBody>
      <style>{`
        .inv-hist-search { position: relative; width: 200px; max-width: 100%; }
        .inv-hist-search input {
          width: 100%; border: 1px solid var(--cui-border-color, #d8dbe0); border-radius: 4px;
          padding: 3px 8px 3px 28px; font-size: .85rem; background: var(--cui-body-bg, #fff); color: inherit;
        }
        .inv-hist-search-icon { position: absolute; left: 8px; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; color: #6c757d; }
      `}</style>
    </CCard>
  );
};

export default InvoiceHistory;