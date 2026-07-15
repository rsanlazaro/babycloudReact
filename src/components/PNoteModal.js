// src/components/PNoteModal.jsx
import React, { useState, useEffect } from 'react';
import {
  CModal, CModalBody,
  CFormInput, CFormSelect, CFormTextarea,
  CButton, CSpinner, CAlert,
} from '@coreui/react';
import api from '../services/api';

// ── Theme ──────────────────────────────────────────────────────
const PINK        = '#d97ea1';          // main brand pink
const PINK_DARK   = '#b85c7e';          // hover / darker variant
const PINK_LIGHT  = '#f9e8f0';          // option background
const TEXT_ON_PINK = '#6b2040';         // readable dark rose on pink bg
const OPT_STYLE   = { backgroundColor: PINK_LIGHT, color: TEXT_ON_PINK };

// ── Constants ──────────────────────────────────────────────────
const TEMA_OPTS     = ['Admisión', 'Seguimiento', 'Seguro', 'Psicología', 'Pagos', 'Documentación', 'Otro'];
const CARACTER_OPTS = ['Nueva Nota', 'Cursando', 'Urgente', 'Retraso'];
const EQUIPO_OPTS   = [
  'Central Pagos', 'Coordina GESCA', 'Crio Embrío',
  'CRM', 'Diseño', 'PRM', 'RRHH', 'Admin', 'Pedidos y Compras',
];

const EMPTY = {
  notify_mode:      'usuario',
  notify_user_id:   '',
  notify_user_name: '',
  notify_team:      '',
  asunto: '', tema: '', gesca: '', ip_asignada: '',
  caracter: 'Nueva Nota', contenido: '',
  fecha_creacion: new Date().toISOString().split('T')[0],
  fecha_limite: '', status: 'pendiente',
};

const PNoteModal = ({ visible, onClose, editNote, contextType, contextId }) => {
  const [form, setForm]             = useState(EMPTY);
  const [users, setUsers]           = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    api.get('/api/users',    { withCredentials: true }).then(r => setUsers(r.data || [])).catch(() => {});
    api.get('/api/users/me', { withCredentials: true }).then(r => setCurrentUser(r.data?.user || null)).catch(() => {});
  }, []);

  useEffect(() => {
    if (editNote) {
      setForm({
        notify_mode:      editNote.notify_user_id ? 'usuario' : 'equipo',
        notify_user_id:   editNote.notify_user_id   || '',
        notify_user_name: editNote.notify_user_name || '',
        notify_team:      editNote.notify_team      || '',
        asunto:           editNote.asunto           || '',
        tema:             editNote.tema             || '',
        gesca:            editNote.gesca            || '',
        ip_asignada:      editNote.ip_asignada      || '',
        caracter:         editNote.caracter         || 'Nueva Nota',
        contenido:        editNote.contenido        || '',
        fecha_creacion:   editNote.fecha_creacion?.split('T')[0] || EMPTY.fecha_creacion,
        fecha_limite:     editNote.fecha_limite?.split('T')[0]   || '',
        status:           editNote.status           || 'pendiente',
      });
    } else {
      setForm({ ...EMPTY, fecha_creacion: new Date().toISOString().split('T')[0] });
    }
    setError('');
  }, [editNote, visible]);

  const f = field => e => setForm(p => ({ ...p, [field]: e.target.value }));

  const setNotifyMode = mode => setForm(p => ({
    ...p, notify_mode: mode,
    notify_user_id: '', notify_user_name: '', notify_team: '',
  }));

  const handleSave = async () => {
    if (!form.asunto.trim()) { setError('El asunto es obligatorio'); return; }
    const isUsuario = form.notify_mode === 'usuario';
    if (isUsuario && !form.notify_user_id) { setError('Selecciona un usuario para notificar'); return; }
    if (!isUsuario && !form.notify_team)   { setError('Selecciona un equipo para notificar'); return; }
    try {
      setSaving(true); setError('');
      const payload = {
        ...form, context_type: contextType || null, context_id: contextId || null,
        notify_user_id:   isUsuario ? (form.notify_user_id   || null) : null,
        notify_user_name: isUsuario ? (form.notify_user_name || null) : null,
        notify_team:      isUsuario ? null : (form.notify_team || null),
      };
      if (editNote) {
        await api.put(`/api/pnotes/${editNote.id}`, payload, { withCredentials: true });
      } else {
        await api.post('/api/pnotes', payload, { withCredentials: true });
      }
      onClose();
    } catch { setError('Error al guardar la nota'); }
    finally  { setSaving(false); }
  };

  // ── Style tokens ──────────────────────────────────────────────
  const inputUL = {
    background: 'transparent', border: 'none',
    borderBottom: `1px solid rgba(255,255,255,0.5)`,
    borderRadius: 0, color: '#fff', padding: '4px 0',
  };
  // Select on pink bg: pink bg + light-pink options
  const selectUL = {
    ...inputUL,
    backgroundColor: PINK,
    color: '#fff',
  };

  const authorName  = currentUser?.username || 'Cargando...';
  const notifTarget = form.notify_mode === 'usuario'
    ? (users.find(u => String(u.id) === String(form.notify_user_id))?.username || '—')
    : (form.notify_team || '—');

  return (
    <CModal visible={visible} onClose={onClose} size="xl" alignment="center">
      <CModalBody style={{ padding: 0, borderRadius: '8px', overflow: 'hidden' }}>

        {/* ── Top control bar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 16px', backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #dee2e6', flexWrap: 'wrap',
        }}>
          {/* Dates */}
          <CFormInput type="date" size="sm" value={form.fecha_creacion}
            onChange={f('fecha_creacion')} style={{ maxWidth: 150 }} title="Fecha creación" />
          <CFormInput type="date" size="sm" value={form.fecha_limite}
            onChange={f('fecha_limite')} style={{ maxWidth: 150 }} title="Fecha límite" />

          {/* Notificar */}
          <div className="d-flex align-items-center gap-2 ms-auto">
            <span style={{ fontSize: '0.82rem', color: '#6c757d', whiteSpace: 'nowrap' }}>
              Notificar:
            </span>

            {/* Mode toggle */}
            <div style={{
              display: 'flex', borderRadius: '6px', overflow: 'hidden',
              border: `1px solid ${PINK}`,
            }}>
              {['usuario', 'equipo'].map(mode => (
                <button key={mode} onClick={() => setNotifyMode(mode)} style={{
                  padding: '3px 10px', fontSize: '0.78rem', border: 'none', cursor: 'pointer',
                  backgroundColor: form.notify_mode === mode ? PINK : '#fff',
                  color: form.notify_mode === mode ? '#fff' : PINK,
                  fontWeight: form.notify_mode === mode ? 600 : 400,
                  transition: 'all 0.15s',
                }}>
                  {mode === 'usuario' ? 'Usuario' : 'Equipo'}
                </button>
              ))}
            </div>

            {/* Conditional picker */}
            {form.notify_mode === 'usuario' ? (
              <CFormSelect size="sm" value={form.notify_user_id}
                onChange={e => {
                  const u = users.find(u => String(u.id) === e.target.value);
                  setForm(p => ({ ...p, notify_user_id: e.target.value,
                    notify_user_name: u ? u.username : '' }));
                }}
                style={{ maxWidth: 160, borderColor: PINK }}>
                <option value="" style={OPT_STYLE}>— Seleccionar usuario —</option>
                {users.map(u => <option key={u.id} value={u.id} style={OPT_STYLE}>{u.username}</option>)}
              </CFormSelect>
            ) : (
              <CFormSelect size="sm" value={form.notify_team}
                onChange={f('notify_team')} style={{ maxWidth: 160, borderColor: PINK }}>
                <option value="" style={OPT_STYLE}>— Seleccionar equipo —</option>
                {EQUIPO_OPTS.map(o => <option key={o} value={o} style={OPT_STYLE}>{o}</option>)}
              </CFormSelect>
            )}
          </div>

          {/* Close button — small, light grey */}
          <button onClick={onClose} title="Cerrar" style={{
            width: 24, height: 24, borderRadius: '50%',
            background: '#ced4da', border: 'none',
            color: '#6c757d', cursor: 'pointer',
            fontWeight: 700, fontSize: '0.7rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, lineHeight: 1, transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#adb5bd'}
            onMouseLeave={e => e.currentTarget.style.background = '#ced4da'}
          >✕</button>
        </div>

        {/* ── Pink body ── */}
        <div style={{ backgroundColor: PINK, padding: '20px 24px' }}>
          {error && (
            <CAlert color="danger" className="py-1 mb-2" style={{ fontSize: '0.82rem' }}>{error}</CAlert>
          )}

          {/* Row 1: Autor / Notificante / Ref */}
          <div className="d-flex align-items-end gap-4 mb-3">
            <div style={{ flex: 1 }}>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.7rem', marginBottom: 2 }}>Autor</div>
              <CFormInput readOnly value={authorName}
                style={{ ...inputUL, fontSize: '0.88rem' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.7rem', marginBottom: 2 }}>Notificante</div>
              <CFormInput readOnly value={notifTarget} placeholder="—"
                style={{ ...inputUL, fontSize: '0.88rem' }} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.75)' }}>Referencia</div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.88rem' }}>
                {editNote?.ref_code || '(auto)'}
              </div>
            </div>
          </div>

          {/* Row 2: Asunto / Tema / GESCA / IP */}
          <div className="d-flex align-items-end gap-3 mb-4">
            <div style={{ flex: 2 }}>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.7rem', marginBottom: 2 }}>Asunto *</div>
              <CFormInput placeholder="Asunto de la nota" value={form.asunto}
                onChange={f('asunto')} style={inputUL} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.7rem', marginBottom: 2 }}>Tema</div>
              <CFormSelect value={form.tema} onChange={f('tema')} style={selectUL}>
                <option value="" style={OPT_STYLE}>— Tema —</option>
                {TEMA_OPTS.map(o => <option key={o} value={o} style={OPT_STYLE}>{o}</option>)}
              </CFormSelect>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.7rem', marginBottom: 2 }}>GESCA</div>
              <CFormInput placeholder="GESCA" value={form.gesca} onChange={f('gesca')} style={inputUL} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.7rem', marginBottom: 2 }}>IP</div>
              <CFormInput placeholder="IP" value={form.ip_asignada} onChange={f('ip_asignada')} style={inputUL} />
            </div>
          </div>

          {/* Row 3: Content area */}
          <div style={{ backgroundColor: '#fff', borderRadius: '6px', padding: '12px 16px', minHeight: '160px' }}>
            <div style={{ fontSize: '0.76rem', color: '#bbb', marginBottom: '8px' }}>
              {form.fecha_creacion} — @ {authorName}
            </div>
            <CFormTextarea rows={5} placeholder="Escriba el contenido de la nota..."
              value={form.contenido} onChange={f('contenido')}
              style={{ border: 'none', resize: 'none', width: '100%',
                outline: 'none', fontSize: '0.9rem', color: '#333' }} />
          </div>

          {/* Row 4: Footer */}
          <div className="d-flex align-items-center justify-content-between mt-3">
            {/* Subir archivo */}
            <CButton size="sm" style={{
              fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px',
              backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.4)', whiteSpace: 'nowrap',
            }}>
              Subir Archivo ↑
            </CButton>

            <div className="d-flex align-items-center gap-2">
              {/* Carácter */}
              <CFormSelect value={form.caracter} onChange={f('caracter')} style={{
                fontSize: '0.82rem', minWidth: '140px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: '#fff', border: '1px solid rgba(255,255,255,0.4)',
                borderRadius: '6px',
              }}>
                {CARACTER_OPTS.map(o => <option key={o} value={o} style={OPT_STYLE}>{o}</option>)}
              </CFormSelect>

              {/* Agregar nota button */}
              <CButton
                onClick={handleSave}
                disabled={saving}
                style={{
                  backgroundColor: PINK_DARK,
                  borderColor: PINK_DARK,
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  whiteSpace: 'nowrap',
                  padding: '6px 14px',
                  lineHeight: 1,
                }}
              >
                {saving ? <CSpinner size="sm" /> : (
                  /* + circle: line-height:0 + font-size on the char itself
                     eliminates all descender/ascender space so centering is pixel-perfect */
                  <span style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    lineHeight: 0,          /* kill line-height so span height is exact */
                  }}>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: 300,
                      lineHeight: 1,
                      display: 'block',
                    }}>+</span>
                  </span>
                )}
                {editNote ? 'Guardar nota' : 'Agregar nota'}
              </CButton>
            </div>
          </div>
        </div>
      </CModalBody>
    </CModal>
  );
};

export default PNoteModal;