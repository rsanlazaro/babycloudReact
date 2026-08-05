// src/views/pages/notas/ListadoNotas.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  CContainer, CCard, CCardBody, CCardHeader,
  CRow, CCol, CFormInput, CFormSelect,
  CInputGroup, CInputGroupText,
  CTable, CTableHead, CTableRow, CTableHeaderCell,
  CTableBody, CTableDataCell,
  CBadge, CButton, CSpinner, CAlert,
  CNav, CNavItem, CNavLink,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilSearch, cilPencil, cilTrash,
  cilEnvelopeOpen, cilEnvelopeClosed,
  cilPlus, cilArrowTop, cilArrowBottom,
} from '@coreui/icons';
import api from '../../../services/api';
import PNoteModal from '../../../components/PNoteModal';

const CARACTER_COLORS = {
  'Nueva Nota': 'info',
  'Cursando':   'primary',
  'Urgente':    'danger',
  'Retraso':    'warning',
};

const TABS = [
  { id: 'todas',      label: 'Todas'      },
  { id: 'recibidas',  label: 'Recibidas'  },
  { id: 'enviadas',   label: 'Enviadas'   },
  { id: 'pendientes', label: 'Pendientes' },
];

const ListadoNotas = () => {
  const [notes, setNotes]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [alert, setAlert]         = useState({ show: false, type: '', message: '' });
  const [currentUserId, setCurrentUserId] = useState(null);
  const [activeTab, setActiveTab] = useState('todas');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  // Filters
  const [search, setSearch]                 = useState('');
  const [filterStatus, setFilterStatus]     = useState('');
  const [filterCaracter, setFilterCaracter] = useState('');
  const [filterContext, setFilterContext]   = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo]     = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editNote, setEditNote]   = useState(null);

  // Delete
  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting]     = useState(false);

  useEffect(() => {
    api.get('/api/users/me', { withCredentials: true })
      .then(r => setCurrentUserId(r.data?.user?.id || null)).catch(() => {});
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/pnotes', { withCredentials: true });
      setNotes(res.data || []);
      setError(null);
    } catch { setError('Error al cargar las notas'); }
    finally   { setLoading(false); }
  };

  const showNotif = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false }), 5000);
  };

  const handleSort = key => setSortConfig(prev => ({
    key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
  }));

  const openEdit   = note => { setEditNote(note); setShowModal(true); };
  const openNew    = ()   => { setEditNote(null);  setShowModal(true); };
  const closeModal = ()   => { setShowModal(false); setEditNote(null); fetchNotes(); };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(`/api/pnotes/${deletingId}`, { withCredentials: true });
      setNotes(prev => prev.filter(n => n.id !== deletingId));
      setDeletingId(null);
      showNotif('success', 'Nota eliminada');
    } catch { showNotif('danger', 'Error al eliminar'); }
    finally  { setDeleting(false); }
  };

  const handleStatusChange = async (note, newStatus) => {
    try {
      await api.patch(`/api/pnotes/${note.id}/status`,
        { status: newStatus }, { withCredentials: true });
      setNotes(prev => prev.map(n =>
        n.id === note.id ? { ...n, status: newStatus } : n));
    } catch { showNotif('danger', 'Error al actualizar'); }
  };

  const markRead = async noteId => {
    try {
      await api.post(`/api/pnotes/${noteId}/read`, {}, { withCredentials: true });
      setNotes(prev => prev.map(n =>
        n.id === noteId ? { ...n, read_at: new Date().toISOString() } : n));
    } catch { /* silent */ }
  };

  const filtered = useMemo(() => {
    let r = [...notes];
    if (activeTab === 'recibidas')  r = r.filter(n => n.notify_user_id === currentUserId);
    if (activeTab === 'enviadas')   r = r.filter(n => n.author_id      === currentUserId);
    if (activeTab === 'pendientes') r = r.filter(n => n.status         === 'pendiente');
    if (filterStatus)   r = r.filter(n => n.status    === filterStatus);
    if (filterCaracter) r = r.filter(n => n.caracter  === filterCaracter);
    if (filterContext)  r = r.filter(n => (n.context_type || '').includes(filterContext));
    if (filterDateFrom) r = r.filter(n => n.fecha_creacion >= filterDateFrom);
    if (filterDateTo)   r = r.filter(n => n.fecha_creacion <= filterDateTo);
    if (search) {
      const t = search.toLowerCase();
      r = r.filter(n =>
        n.ref_code?.toLowerCase().includes(t)          ||
        n.asunto?.toLowerCase().includes(t)             ||
        n.contenido?.toLowerCase().includes(t)          ||
        n.author_name?.toLowerCase().includes(t)        ||
        n.notify_user_name?.toLowerCase().includes(t)   ||
        n.gesca?.toLowerCase().includes(t)
      );
    }
    r.sort((a, b) => {
      let av = a[sortConfig.key] || '', bv = b[sortConfig.key] || '';
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortConfig.direction === 'asc' ? -1 : 1;
      if (av > bv) return sortConfig.direction === 'asc' ?  1 : -1;
      return 0;
    });
    return r;
  }, [notes, activeTab, search, filterStatus, filterCaracter,
      filterContext, filterDateFrom, filterDateTo, sortConfig, currentUserId]);

  const SH = ({ label, sortKey, style = {} }) => (
    <CTableHeaderCell style={{ cursor: 'pointer', userSelect: 'none',
      whiteSpace: 'nowrap', ...style }} onClick={() => handleSort(sortKey)}>
      <div className="d-flex align-items-center gap-1">
        {label}
        <CIcon icon={sortConfig.key === sortKey && sortConfig.direction === 'desc'
          ? cilArrowBottom : cilArrowTop} size="sm"
          className={sortConfig.key !== sortKey ? 'text-muted opacity-25' : ''} />
      </div>
    </CTableHeaderCell>
  );

  const unreadCount = notes.filter(n =>
    n.notify_user_id === currentUserId && !n.read_at && n.status === 'pendiente'
  ).length;

  return (
    <CContainer fluid>
      {alert.show && (
        <CAlert className="mx-3" color={alert.type} dismissible
          onClose={() => setAlert({ show: false })}>{alert.message}</CAlert>
      )}

      <CCard className="mb-4 mx-3">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <strong>Listado de Notas</strong>
            {unreadCount > 0 && (
              <CBadge color="danger" style={{ fontSize: '0.75rem' }}>
                {unreadCount} sin leer
              </CBadge>
            )}
          </div>
          <CButton onClick={openNew} title="Nueva nota" style={{
            backgroundColor: '#d97ea1', borderColor: '#d97ea1',
            borderRadius: '50%', width: '36px', height: '36px', padding: 0,
          }}>
            <CIcon icon={cilPlus} />
          </CButton>
        </CCardHeader>

        <CCardBody>
          {/* Tabs */}
          <CNav variant="tabs" className="mb-3">
            {TABS.map(t => (
              <CNavItem key={t.id}>
                <CNavLink active={activeTab === t.id}
                  onClick={() => setActiveTab(t.id)} style={{ cursor: 'pointer' }}>
                  {t.label}
                  {t.id === 'pendientes' && unreadCount > 0 && (
                    <CBadge color="danger" className="ms-1" style={{ fontSize: '0.65rem' }}>
                      {unreadCount}
                    </CBadge>
                  )}
                </CNavLink>
              </CNavItem>
            ))}
          </CNav>

          {/* Filters */}
          <CRow className="mb-3 g-2">
            <CCol md={3}>
              <CInputGroup size="sm">
                <CInputGroupText><CIcon icon={cilSearch} /></CInputGroupText>
                <CFormInput placeholder="Buscar ref, asunto, contenido..."
                  value={search} onChange={e => setSearch(e.target.value)} />
              </CInputGroup>
            </CCol>
            <CCol md={2}>
              <CFormSelect size="sm" value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}>
                <option value="">Todos los status</option>
                <option value="pendiente">Pendiente</option>
                <option value="resuelto">Resuelto</option>
                <option value="archivado">Archivado</option>
              </CFormSelect>
            </CCol>
            <CCol md={2}>
              <CFormSelect size="sm" value={filterCaracter}
                onChange={e => setFilterCaracter(e.target.value)}>
                <option value="">Todo carácter</option>
                {['Nueva Nota','Cursando','Urgente','Retraso'].map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={2}>
              <CFormSelect size="sm" value={filterContext}
                onChange={e => setFilterContext(e.target.value)}>
                <option value="">Toda sección</option>
                <option value="sort-ges">Sort GES</option>
                <option value="users">Usuarios</option>
                <option value="payments">Pagos</option>
                <option value="general">General</option>
              </CFormSelect>
            </CCol>
            <CCol md={3} className="d-flex gap-2">
              <CFormInput type="date" size="sm" value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)} title="Desde" />
              <CFormInput type="date" size="sm" value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)} title="Hasta" />
            </CCol>
          </CRow>

          <div className="text-muted small mb-2">
            {filtered.length} de {notes.length} notas
          </div>

          {/* Table */}
          {loading ? (
            <div className="d-flex justify-content-center py-5">
              <CSpinner color="primary" />
            </div>
          ) : error ? (
            <CAlert color="danger">{error}</CAlert>
          ) : (
            <CTable hover striped responsive align="middle" className="nowrap-table">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell style={{ width: 32 }} />
                  <SH label="Referencia"  sortKey="ref_code"          style={{ width: 120 }} />
                  <SH label="Fecha"       sortKey="fecha_creacion"    style={{ width: 108 }} />
                  <SH label="Autor"       sortKey="author_name"       />
                  <SH label="Notificado"  sortKey="notify_user_name"  />
                  <SH label="Asunto"      sortKey="asunto"            />
                  <CTableHeaderCell>Sección</CTableHeaderCell>
                  <SH label="Carácter"    sortKey="caracter"          style={{ width: 115 }} />
                  <SH label="Status"      sortKey="status"            style={{ width: 120 }} />
                  <CTableHeaderCell style={{ width: 88 }}>Acciones</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {filtered.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={10} className="text-center py-5 text-muted">
                      No se encontraron notas
                    </CTableDataCell>
                  </CTableRow>
                ) : filtered.map(note => {
                  const isUnread = !note.read_at && note.notify_user_id === currentUserId;
                  return (
                    <CTableRow key={note.id} style={{
                      fontWeight: isUnread ? 700 : 400,
                      backgroundColor: isUnread ? '#fff9fb' : 'inherit',
                    }}>
                      {/* Read indicator */}
                      <CTableDataCell className="text-center">
                        <CIcon
                          icon={isUnread ? cilEnvelopeClosed : cilEnvelopeOpen}
                          style={{
                            color: isUnread ? '#d97ea1' : '#ccc',
                            cursor: isUnread ? 'pointer' : 'default',
                          }}
                          title={isUnread ? 'Marcar como leída' : 'Leída'}
                          onClick={() => isUnread && markRead(note.id)}
                        />
                      </CTableDataCell>

                      <CTableDataCell>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.82rem',
                          color: '#5856d6' }}>{note.ref_code}</span>
                      </CTableDataCell>

                      <CTableDataCell style={{ fontSize: '0.82rem' }}>
                        {note.fecha_creacion?.split('T')[0] || '—'}
                        {note.fecha_limite && (
                          <div style={{ fontSize: '0.71rem', color: '#dc3545' }}>
                            Límite: {note.fecha_limite.split('T')[0]}
                          </div>
                        )}
                      </CTableDataCell>

                      <CTableDataCell style={{ fontSize: '0.85rem' }}>
                        {note.author_name || '—'}
                      </CTableDataCell>

                      <CTableDataCell style={{ fontSize: '0.85rem' }}>
                        {note.notify_user_name || note.notify_team || '—'}
                      </CTableDataCell>

                      <CTableDataCell>
                        <div style={{ fontWeight: isUnread ? 700 : 500, fontSize: '0.88rem' }}>
                          {note.asunto || '—'}
                        </div>
                        {note.contenido && (
                          <div className="text-muted" style={{
                            fontSize: '0.74rem', whiteSpace: 'nowrap',
                            overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '260px',
                          }}>{note.contenido}</div>
                        )}
                      </CTableDataCell>

                      <CTableDataCell>
                        {note.context_type ? (
                          <CBadge color="light" textColor="dark"
                            style={{ border: '1px solid #dee2e6', fontSize: '0.72rem' }}>
                            {note.context_type}
                            {note.context_id ? ` #${note.context_id}` : ''}
                          </CBadge>
                        ) : '—'}
                      </CTableDataCell>

                      <CTableDataCell>
                        {note.caracter && (
                          <CBadge color={CARACTER_COLORS[note.caracter] || 'secondary'}
                            style={{ fontSize: '0.72rem' }}>
                            {note.caracter}
                          </CBadge>
                        )}
                      </CTableDataCell>

                      <CTableDataCell>
                        <CFormSelect size="sm" value={note.status}
                          onChange={e => handleStatusChange(note, e.target.value)}
                          style={{
                            fontSize: '0.78rem', padding: '2px 6px', minWidth: '108px',
                            color: note.status === 'resuelto'  ? '#198754'
                                 : note.status === 'archivado' ? '#6c757d' : '#856404',
                          }}>
                          <option value="pendiente">Pendiente</option>
                          <option value="resuelto">Resuelto</option>
                          <option value="archivado">Archivado</option>
                        </CFormSelect>
                      </CTableDataCell>

                      <CTableDataCell>
                        <div className="d-flex gap-1">
                          <CButton color="warning" variant="ghost" size="sm"
                            onClick={() => openEdit(note)} title="Editar">
                            <CIcon icon={cilPencil} />
                          </CButton>
                          <CButton color="danger" variant="ghost" size="sm"
                            onClick={() => setDeletingId(note.id)} title="Eliminar">
                            <CIcon icon={cilTrash} />
                          </CButton>
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  );
                })}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      {/* Composer modal */}
      {showModal && (
        <PNoteModal visible={showModal} onClose={closeModal}
          editNote={editNote} contextType={null} contextId={null} />
      )}

      {/* Delete confirm overlay */}
      {deletingId && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }} onClick={() => setDeletingId(null)}>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '24px',
            maxWidth: '380px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <h5 className="mb-2">Eliminar nota</h5>
            <p className="text-muted small mb-4">
              ¿Está seguro? Esta acción no se puede deshacer.
            </p>
            <div className="d-flex justify-content-end gap-2">
              <CButton color="secondary" onClick={() => setDeletingId(null)}>Cancelar</CButton>
              <CButton color="danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? <CSpinner size="sm" /> : 'Eliminar'}
              </CButton>
            </div>
          </div>
        </div>
      )}

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

export default ListadoNotas;