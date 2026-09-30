// frontend/src/views/babysite/babysite/SegurosList.js
// Baby site → "Listado de seguros"
// Lists every insurance policy of every Sort_GESCA gestante (the same data as
// the "Seguro med" tab of each register). New registers created here appear in
// that tab, and vice versa.
// "Solicitud de seguro" and "Status Gral" are computed by the backend
// (backend/services/seguroStatus.js) — their rules will be defined later.

import React, { useState, useEffect, useMemo } from 'react';
import {
  CContainer, CCard, CCardBody, CAlert, CButton, CBadge, CSpinner,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CInputGroup, CInputGroupText, CFormInput, CFormLabel, CFormSelect,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CRow, CCol,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilSearch, cilPlus, cilPencil, cilTrash, cilWarning } from '@coreui/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import {
  TIPO_PAGO_CONFIG, buildPagos, computeMatLiberacion, computeVidaVencimiento, toDateInput,
} from '../../../utils/seguroPagos';

const PINK = '#d97ea1';

// "2026-10-30" or ISO datetime → "30/10/2026" (no timezone shift)
const formatDate = (v) => {
  if (!v) return '—';
  const [y, m, d] = String(v).slice(0, 10).split('-');
  return y && m && d ? `${d}/${m}/${y}` : '—';
};

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const EMPTY_FORM = { candidate_id: '', aseguradora: '', numero_poliza: '', fecha_solicitud: '' };

// Every field of a policy — the update endpoint overwrites all of them, so the
// edit form always sends the complete set (same fields as the Seguro med tab).
const policyToForm = (p) => ({
  aseguradora:       p.aseguradora       || '',
  numero_poliza:     p.numero_poliza     || '',
  gestor:            p.gestor            || '',
  tipo_pago:         p.tipo_pago         || '',
  valor_cuota:       p.valor_cuota       ?? '',
  total_estimado:    p.total_estimado    ?? '',
  fecha_solicitud:   toDateInput(p.fecha_solicitud),
  fecha_alta:        toDateInput(p.fecha_alta),
  fecha_liberacion:  toDateInput(p.fecha_liberacion),
  fecha_vencimiento: toDateInput(p.fecha_vencimiento),
});

const SegurosList = () => {
  const navigate = useNavigate();

  const [seguros, setSeguros]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [alert, setAlert]           = useState({ show: false, type: '', message: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // New register modal
  const [showCreate, setShowCreate]     = useState(false);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [candidates, setCandidates]     = useState([]);
  const [candSearch, setCandSearch]     = useState('');
  const [loadingCands, setLoadingCands] = useState(false);
  const [saving, setSaving]             = useState(false);
  const [formError, setFormError]       = useState('');

  // Edit modal
  const [editTarget, setEditTarget]     = useState(null);  // list row being edited
  const [editOriginal, setEditOriginal] = useState(null);  // policy as loaded (incl. pagos)
  const [editForm, setEditForm]         = useState(null);
  const [editError, setEditError]       = useState('');
  const [editSaving, setEditSaving]     = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  const showNotification = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 4000);
  };

  const fetchSeguros = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/sort-ges/seguros', { withCredentials: true });
      setSeguros(res.data || []);
      setError('');
    } catch (err) {
      console.error('Error loading seguros:', err);
      setError('Error al cargar el listado de seguros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSeguros(); }, []);

  // ── Search (gestante, aseguradora, póliza, estados, año) ──────────────────
  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return seguros;
    return seguros.filter(s => [
      s.gestante, s.aseguradora, s.numero_poliza,
      s.solicitud?.label, s.status_gral?.label, s.pago, s.anio,
    ].some(v => v !== null && v !== undefined && String(v).toLowerCase().includes(term)));
  }, [seguros, searchTerm]);

  // ── New register ──────────────────────────────────────────────────────────
  const openCreate = async () => {
    setForm({ ...EMPTY_FORM, fecha_solicitud: todayISO() });
    setCandSearch('');
    setFormError('');
    setShowCreate(true);
    if (!candidates.length) {
      try {
        setLoadingCands(true);
        const res = await api.get('/api/sort-ges', { withCredentials: true });
        setCandidates((res.data || []).map(c => ({
          id: c.id,
          label: c.nombre_completo || `Candidato #${c.id}`,
          curp: c.curp || '',
        })));
      } catch (err) {
        console.error('Error loading gestantes:', err);
        setFormError('No se pudo cargar la lista de gestantes');
      } finally {
        setLoadingCands(false);
      }
    }
  };

  const candidateOptions = useMemo(() => {
    const term = candSearch.trim().toLowerCase();
    const list = term
      ? candidates.filter(c => c.label.toLowerCase().includes(term) || c.curp.toLowerCase().includes(term))
      : candidates;
    return [...list].sort((a, b) => a.label.localeCompare(b.label, 'es'));
  }, [candidates, candSearch]);

  const handleCreate = async () => {
    if (!form.candidate_id) {
      setFormError('Selecciona la gestante del registro');
      return;
    }
    try {
      setSaving(true);
      setFormError('');
      // Same endpoint as the "Seguro med" tab → it shows up there too
      await api.post(`/api/sort-ges/${form.candidate_id}/seguro-mat`, {
        aseguradora:     form.aseguradora.trim(),
        numero_poliza:   form.numero_poliza.trim(),
        fecha_solicitud: form.fecha_solicitud || null,
        pagos: [],
      }, { withCredentials: true });
      setShowCreate(false);
      showNotification('success', 'Registro de seguro creado. También aparece en el Seguro med de la gestante.');
      fetchSeguros();
    } catch (err) {
      console.error('Error creating seguro:', err);
      setFormError(err.response?.data?.message || 'Error al crear el registro de seguro');
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const openEdit = async (row) => {
    setEditTarget(row);
    setEditOriginal(null);
    setEditForm(null);
    setEditError('');
    try {
      // Full policy (all fields + payments) from the same source as the Seguro med tab
      const res = await api.get(`/api/sort-ges/${row.candidate_id}/seguro-mat`, { withCredentials: true });
      const policy = (res.data || []).find(p => p.id === row.id);
      if (!policy) throw new Error('not found');
      setEditOriginal(policy);
      setEditForm(policyToForm(policy));
    } catch (err) {
      console.error('Error loading policy:', err);
      setEditError('No se pudo cargar el registro de seguro');
    }
  };

  const closeEdit = () => { setEditTarget(null); setEditOriginal(null); setEditForm(null); };

  const setEdit = (changes) => setEditForm(f => ({ ...f, ...changes }));

  // Same rule as the Seguro med tab: payment type or start date changed → payments are rebuilt
  const originalForm = editOriginal ? policyToForm(editOriginal) : null;
  const willRebuildPagos = !!(editForm && originalForm && (
    editForm.tipo_pago !== originalForm.tipo_pago || editForm.fecha_alta !== originalForm.fecha_alta
  )) && buildPagos(editForm.tipo_pago, editForm.valor_cuota, editForm.fecha_alta).length > 0;
  const paidCount = (editOriginal?.pagos || []).filter(c => c.fecha_pago).length;

  const handleEditSave = async () => {
    if (!editForm.fecha_solicitud) {
      setEditError('La fecha de solicitud es obligatoria');
      return;
    }
    try {
      setEditSaving(true);
      setEditError('');
      const pagos = willRebuildPagos
        ? buildPagos(editForm.tipo_pago, editForm.valor_cuota, editForm.fecha_alta)
        : [];
      await api.put(
        `/api/sort-ges/${editTarget.candidate_id}/seguro-mat/${editTarget.id}`,
        { ...editForm, rebuildPagos: willRebuildPagos, pagos },
        { withCredentials: true }
      );
      closeEdit();
      showNotification('success', 'Registro de seguro actualizado');
      fetchSeguros();
    } catch (err) {
      console.error('Error updating seguro:', err);
      setEditError(err.response?.data?.message || 'Error al guardar los cambios');
    } finally {
      setEditSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(
        `/api/sort-ges/${deleteTarget.candidate_id}/seguro-mat/${deleteTarget.id}`,
        { withCredentials: true }
      );
      setDeleteTarget(null);
      showNotification('info', 'Registro de seguro eliminado');
      fetchSeguros();
    } catch (err) {
      console.error('Error deleting seguro:', err);
      showNotification('danger', err.response?.data?.message || 'Error al eliminar el registro de seguro');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  // Open the gestante's register directly on the "Seguro med" tab
  const openSeguro = (s) => navigate(`/babysite/sortGes/${s.candidate_id}`, { state: { tab: 'seguro-med' } });

  return (
    <CContainer fluid>
      {alert.show && (
        <CAlert color={alert.type} dismissible onClose={() => setAlert({ show: false })}>
          {alert.message}
        </CAlert>
      )}

      <CCard className="mb-4">
        {/* ── Top bar: title + count (left), search + add (right) ── */}
        <div className="px-3 py-2 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-baseline gap-2">
            <strong>Listado de seguros</strong>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>
              {filtered.length} de {seguros.length} registros
            </span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <CInputGroup size="sm" style={{ width: '220px' }}>
              <CInputGroupText style={{ backgroundColor: '#fff', borderRight: 'none' }}>
                <CIcon icon={cilSearch} style={{ color: PINK }} />
              </CInputGroupText>
              <CFormInput
                placeholder="Buscar..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                autoComplete="off"
                style={{ borderLeft: 'none' }}
              />
            </CInputGroup>
            <CButton
              size="sm"
              color="primary"
              onClick={openCreate}
              style={{
                backgroundColor: PINK, borderColor: PINK,
                borderRadius: '50%', width: '32px', height: '32px', padding: 0,
              }}
              title="Nuevo registro de seguro"
            >
              <CIcon icon={cilPlus} />
            </CButton>
          </div>
        </div>

        <CCardBody className="p-0">
          {error && <CAlert color="danger" className="m-3">{error}</CAlert>}

          <CTable hover striped align="middle" responsive className="nowrap-table mb-0">
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>GESCA/GESTA</CTableHeaderCell>
                <CTableHeaderCell>Solicitud de seguro</CTableHeaderCell>
                <CTableHeaderCell>Start Póliza</CTableHeaderCell>
                <CTableHeaderCell>Status Gral</CTableHeaderCell>
                <CTableHeaderCell>Prox pgto</CTableHeaderCell>
                <CTableHeaderCell>Pago</CTableHeaderCell>
                <CTableHeaderCell>Año</CTableHeaderCell>
                <CTableHeaderCell className="text-center">Acciones</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {loading ? (
                <CTableRow>
                  <CTableDataCell colSpan={8} className="text-center py-4">
                    <CSpinner size="sm" className="me-2" />Cargando...
                  </CTableDataCell>
                </CTableRow>
              ) : filtered.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={8} className="text-center py-4 text-muted">
                    {seguros.length ? 'Sin resultados para la búsqueda' : 'No hay registros de seguro'}
                  </CTableDataCell>
                </CTableRow>
              ) : filtered.map(s => (
                <CTableRow
                  key={s.id}
                  onClick={() => openSeguro(s)}
                  style={{ cursor: 'pointer' }}
                  title="Abrir el Seguro med de la gestante"
                >
                  <CTableDataCell>
                    <strong>{s.gestante}</strong>
                    {(s.aseguradora || s.numero_poliza) && (
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {[s.aseguradora, s.numero_poliza && `Póliza ${s.numero_poliza}`].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </CTableDataCell>
                  <CTableDataCell>
                    <CBadge color={s.solicitud?.color || 'secondary'}>{s.solicitud?.label || '—'}</CBadge>
                  </CTableDataCell>
                  <CTableDataCell>{formatDate(s.start_poliza)}</CTableDataCell>
                  <CTableDataCell>
                    <CBadge color={s.status_gral?.color || 'secondary'}>{s.status_gral?.label || '—'}</CBadge>
                  </CTableDataCell>
                  <CTableDataCell>{formatDate(s.prox_pago)}</CTableDataCell>
                  <CTableDataCell>
                    {s.pago
                      ? <>{s.pago}{s.liquidado && <CBadge color="success" className="ms-2">Liquidado</CBadge>}</>
                      : '—'}
                  </CTableDataCell>
                  <CTableDataCell>{s.anio || '—'}</CTableDataCell>
                  <CTableDataCell className="text-center" onClick={e => e.stopPropagation()}>
                    <div className="d-inline-flex gap-1">
                      <CButton
                        size="sm" color="secondary" variant="ghost"
                        onClick={() => openEdit(s)}
                        title="Editar registro"
                        aria-label={`Editar seguro de ${s.gestante}`}
                      >
                        <CIcon icon={cilPencil} />
                      </CButton>
                      <CButton
                        size="sm" color="danger" variant="ghost"
                        onClick={() => setDeleteTarget(s)}
                        title="Eliminar registro"
                        aria-label={`Eliminar seguro de ${s.gestante}`}
                      >
                        <CIcon icon={cilTrash} />
                      </CButton>
                    </div>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      {/* ── New register ── */}
      <CModal visible={showCreate} onClose={() => setShowCreate(false)} alignment="center">
        <CModalHeader>
          <CModalTitle>Nuevo registro de seguro</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {formError && <CAlert color="danger" className="py-2">{formError}</CAlert>}

          <CFormLabel className="mb-1">GESCA/GESTA *</CFormLabel>
          <CFormInput
            size="sm"
            className="mb-1"
            placeholder="Buscar por nombre o CURP..."
            value={candSearch}
            onChange={e => setCandSearch(e.target.value)}
            autoComplete="off"
          />
          <CFormSelect
            className="mb-3"
            htmlSize={6}
            value={form.candidate_id}
            onChange={e => setForm(f => ({ ...f, candidate_id: e.target.value }))}
            disabled={loadingCands}
          >
            {loadingCands && <option value="">Cargando gestantes...</option>}
            {!loadingCands && candidateOptions.length === 0 && <option value="" disabled>Sin coincidencias</option>}
            {candidateOptions.map(c => (
              <option key={c.id} value={c.id}>
                {c.label}{c.curp ? ` — ${c.curp}` : ''}
              </option>
            ))}
          </CFormSelect>

          <CFormLabel className="mb-1">Aseguradora</CFormLabel>
          <CFormInput
            className="mb-3"
            value={form.aseguradora}
            onChange={e => setForm(f => ({ ...f, aseguradora: e.target.value }))}
          />

          <CFormLabel className="mb-1">Número de póliza</CFormLabel>
          <CFormInput
            className="mb-3"
            value={form.numero_poliza}
            onChange={e => setForm(f => ({ ...f, numero_poliza: e.target.value }))}
            placeholder="Opcional — se puede capturar después"
          />

          <CFormLabel className="mb-1">Fecha de solicitud</CFormLabel>
          <CFormInput
            type="date"
            value={form.fecha_solicitud}
            onChange={e => setForm(f => ({ ...f, fecha_solicitud: e.target.value }))}
          />
          <small className="text-muted d-block mt-2">
            El resto (alta, vencimiento, tipo de pago y cuotas) se completa en el Seguro med de la gestante.
          </small>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setShowCreate(false)}>Cancelar</CButton>
          <CButton
            style={{ backgroundColor: PINK, borderColor: PINK, color: '#fff' }}
            onClick={handleCreate}
            disabled={saving}
          >
            {saving ? <><CSpinner size="sm" className="me-2" />Guardando...</> : 'Crear registro'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* ── Edit register ── */}
      <CModal visible={!!editTarget} onClose={closeEdit} alignment="center" size="lg">
        <CModalHeader>
          <CModalTitle>Editar registro de seguro{editTarget ? ` — ${editTarget.gestante}` : ''}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {editError && <CAlert color="danger" className="py-2">{editError}</CAlert>}
          {!editForm && !editError && (
            <div className="text-center py-4"><CSpinner size="sm" className="me-2" />Cargando...</div>
          )}
          {editForm && (
            <CRow>
              <CCol md={6} className="mb-3">
                <CFormLabel>Aseguradora:</CFormLabel>
                <CFormInput value={editForm.aseguradora} onChange={e => setEdit({ aseguradora: e.target.value })} />
              </CCol>
              <CCol md={6} className="mb-3">
                <CFormLabel>Número de póliza:</CFormLabel>
                <CFormInput value={editForm.numero_poliza} onChange={e => setEdit({ numero_poliza: e.target.value })} />
              </CCol>
              <CCol md={6} className="mb-3">
                <CFormLabel>Gestor:</CFormLabel>
                <CFormInput value={editForm.gestor} onChange={e => setEdit({ gestor: e.target.value })} />
              </CCol>
              <CCol md={6} className="mb-3">
                <CFormLabel>Tipo de pago:</CFormLabel>
                <CFormSelect
                  value={editForm.tipo_pago}
                  onChange={e => {
                    const tipo = e.target.value;
                    const cfg = TIPO_PAGO_CONFIG[tipo];
                    setEdit({
                      tipo_pago: tipo,
                      total_estimado: editForm.valor_cuota && cfg
                        ? (parseFloat(editForm.valor_cuota) * cfg.cuotas).toFixed(2) : '',
                    });
                  }}
                >
                  <option value="">— Seleccionar —</option>
                  {Object.entries(TIPO_PAGO_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={6} className="mb-3">
                <CFormLabel>Valor por cuota:</CFormLabel>
                <CInputGroup>
                  <CInputGroupText>$</CInputGroupText>
                  <CFormInput
                    type="number" min="0" step="0.01" placeholder="0.00"
                    value={editForm.valor_cuota}
                    onChange={e => {
                      const v = e.target.value;
                      const cfg = TIPO_PAGO_CONFIG[editForm.tipo_pago];
                      setEdit({ valor_cuota: v, total_estimado: cfg && v ? (parseFloat(v) * cfg.cuotas).toFixed(2) : '' });
                    }}
                  />
                </CInputGroup>
              </CCol>
              <CCol md={6} className="mb-3">
                <CFormLabel>
                  Total estimado:
                  {TIPO_PAGO_CONFIG[editForm.tipo_pago] && (
                    <span className="text-muted ms-1" style={{ fontSize: '0.72rem' }}>
                      ({TIPO_PAGO_CONFIG[editForm.tipo_pago].cuotas} cuota{TIPO_PAGO_CONFIG[editForm.tipo_pago].cuotas > 1 ? 's' : ''})
                    </span>
                  )}
                </CFormLabel>
                <CInputGroup>
                  <CInputGroupText>$</CInputGroupText>
                  <CFormInput
                    type="number" min="0" step="0.01" placeholder="0.00"
                    value={editForm.total_estimado}
                    disabled={!editForm.tipo_pago}
                    onChange={e => {
                      const t = e.target.value;
                      const cfg = TIPO_PAGO_CONFIG[editForm.tipo_pago];
                      setEdit({ total_estimado: t, valor_cuota: cfg && t && cfg.cuotas > 0 ? (parseFloat(t) / cfg.cuotas).toFixed(2) : '' });
                    }}
                  />
                </CInputGroup>
              </CCol>
              <CCol md={6} className="mb-3">
                <CFormLabel>Fecha de solicitud: <span className="text-danger">*</span></CFormLabel>
                <CFormInput type="date" value={editForm.fecha_solicitud} onChange={e => setEdit({ fecha_solicitud: e.target.value })} />
              </CCol>
              <CCol md={6} className="mb-3">
                <CFormLabel>Fecha de alta (Start Póliza):</CFormLabel>
                <CFormInput
                  type="date"
                  value={editForm.fecha_alta}
                  onChange={e => {
                    // Same suggestions as the Seguro med tab: liberación +90 días, vencimiento +1 año
                    const fa = e.target.value;
                    setEditForm(f => ({
                      ...f,
                      fecha_alta: fa,
                      fecha_liberacion: f.fecha_liberacion === computeMatLiberacion(f.fecha_alta) || !f.fecha_liberacion
                        ? computeMatLiberacion(fa) : f.fecha_liberacion,
                      fecha_vencimiento: f.fecha_vencimiento === computeVidaVencimiento(f.fecha_alta) || !f.fecha_vencimiento
                        ? computeVidaVencimiento(fa) : f.fecha_vencimiento,
                    }));
                  }}
                />
              </CCol>
              <CCol md={6} className="mb-3">
                <CFormLabel>Fecha de liberación:</CFormLabel>
                <CFormInput type="date" value={editForm.fecha_liberacion} onChange={e => setEdit({ fecha_liberacion: e.target.value })} />
              </CCol>
              <CCol md={6} className="mb-3">
                <CFormLabel>Fecha de vencimiento:</CFormLabel>
                <CFormInput type="date" value={editForm.fecha_vencimiento} onChange={e => setEdit({ fecha_vencimiento: e.target.value })} />
              </CCol>

              {willRebuildPagos && (
                <CCol xs={12}>
                  <CAlert color="warning" className="py-2 mb-0 d-flex align-items-start gap-2">
                    <CIcon icon={cilWarning} className="mt-1 flex-shrink-0" />
                    <span>
                      Cambiaste el tipo de pago o la fecha de alta: al guardar se volverán a calcular las cuotas
                      ({buildPagos(editForm.tipo_pago, editForm.valor_cuota, editForm.fecha_alta).length}).
                      {paidCount > 0 && (
                        <> <strong>Se perderán {paidCount} pago{paidCount > 1 ? 's' : ''} ya registrado{paidCount > 1 ? 's' : ''}.</strong></>
                      )}
                    </span>
                  </CAlert>
                </CCol>
              )}
            </CRow>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={closeEdit}>Cancelar</CButton>
          <CButton
            style={{ backgroundColor: PINK, borderColor: PINK, color: '#fff' }}
            onClick={handleEditSave}
            disabled={!editForm || editSaving}
          >
            {editSaving ? <><CSpinner size="sm" className="me-2" />Guardando...</> : 'Guardar cambios'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* ── Delete confirmation ── */}
      <CModal visible={!!deleteTarget} onClose={() => setDeleteTarget(null)} alignment="center">
        <CModalHeader>
          <CModalTitle>Eliminar registro de seguro</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {deleteTarget && (
            <>
              <p className="mb-2">
                ¿Eliminar el registro de seguro de <strong>{deleteTarget.gestante}</strong>
                {deleteTarget.numero_poliza ? <> (póliza <strong>{deleteTarget.numero_poliza}</strong>)</> : ''}?
              </p>
              <p className="mb-0 text-danger small">
                También se eliminan sus cuotas y pagos registrados, y desaparece del Seguro med de la gestante.
                Esta acción no se puede deshacer.
              </p>
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</CButton>
          <CButton color="danger" className="text-white" onClick={handleDelete} disabled={deleting}>
            {deleting ? <><CSpinner size="sm" className="me-2" />Eliminando...</> : <><CIcon icon={cilTrash} className="me-1" />Eliminar</>}
          </CButton>
        </CModalFooter>
      </CModal>

      <style>{`
        .nowrap-table th,
        .nowrap-table td {
          white-space: nowrap;
          vertical-align: middle;
        }
      `}</style>
    </CContainer>
  );
};

export default SegurosList;