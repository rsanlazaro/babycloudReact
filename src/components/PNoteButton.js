// src/components/PNoteButton.jsx
// Drop into any section's CCardHeader:
//   <PNoteButton contextType="users" contextId={null} />
//   <PNoteButton contextType="sort-ges" contextId={candidateId} />

import React, { useState, useRef, useEffect } from 'react';
import { CBadge } from '@coreui/react';
import { useNavigate } from 'react-router-dom';
import usePNotes from '../hooks/usePNotes';
import PNoteModal from './PNoteModal';

const PINK      = '#d97ea1';
const PINK_DARK = '#b85c7e';

const CARACTER_COLORS = {
  'Nueva Nota': '#0dcaf0',
  'Cursando':   '#5856d6',
  'Urgente':    '#dc3545',
  'Retraso':    '#fd7e14',
};

const PNoteButton = ({ contextType = 'general', contextId = null }) => {
  const notes    = usePNotes(contextType, contextId);
  const navigate = useNavigate();

  // Dropdown state
  const [open, setOpen]         = useState(false);
  const containerRef            = useRef(null);

  const hasNotes = notes.notes.length > 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // If there are notes: toggle dropdown. If not: open composer directly.
  const handleClick = () => {
    if (hasNotes) {
      setOpen(prev => !prev);
    } else {
      notes.openNew();
    }
  };

  const handleAddNote = () => {
    setOpen(false);
    notes.openNew();
  };

  const handleViewNotes = () => {
    setOpen(false);
    navigate('/notas');
  };

  return (
    <>
      <div ref={containerRef} style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>

        {/* ── Main button ── */}
        <button
          onClick={handleClick}
          title={hasNotes ? 'Notas' : 'Nueva nota'}
          style={{
            position: 'relative',
            width: '44px', height: '44px',
            borderRadius: '50%',
            backgroundColor: PINK,
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(217,126,161,0.35)',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.82'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          {/* Document icon */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
              stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
              stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>

          {/* Unread badge */}
          {notes.unread > 0 && (
            <CBadge color="danger" style={{
              position: 'absolute', top: '-4px', right: '-4px',
              fontSize: '0.62rem', minWidth: '18px', height: '18px',
              borderRadius: '9px', padding: '0 4px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #fff',
            }}>
              {notes.unread > 99 ? '99+' : notes.unread}
            </CBadge>
          )}
        </button>

        {/* ── Dropdown ── */}
        {open && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 1050,
            backgroundColor: '#fff',
            border: '1px solid #dee2e6',
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            minWidth: '240px',
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              backgroundColor: PINK,
              padding: '10px 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem' }}>
                Notas
                {notes.notes.length > 0 && (
                  <span style={{
                    marginLeft: '6px',
                    backgroundColor: 'rgba(255,255,255,0.25)',
                    borderRadius: '10px',
                    padding: '1px 7px',
                    fontSize: '0.75rem',
                  }}>
                    {notes.notes.length}
                  </span>
                )}
              </span>
              {notes.unread > 0 && (
                <CBadge color="danger" style={{ fontSize: '0.7rem' }}>
                  {notes.unread} sin leer
                </CBadge>
              )}
            </div>

            {/* Note preview list — max 4 */}
            {notes.notes.slice(0, 4).map(note => {
              const isUnread = !note.read_at;
              return (
                <div key={note.id} style={{
                  padding: '8px 14px',
                  borderBottom: '1px solid #f4f4f4',
                  backgroundColor: isUnread ? '#fff9fb' : '#fff',
                  cursor: 'default',
                }}>
                  <div className="d-flex align-items-center gap-2">
                    {/* Carácter dot */}
                    <span style={{
                      width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                      backgroundColor: CARACTER_COLORS[note.caracter] || '#aaa',
                    }} />
                    <span style={{
                      fontSize: '0.82rem',
                      fontWeight: isUnread ? 700 : 500,
                      color: '#333',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      flex: 1,
                    }}>
                      {note.asunto || '(sin asunto)'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#aaa', flexShrink: 0 }}>
                      {note.ref_code}
                    </span>
                  </div>
                  {note.contenido && (
                    <div style={{
                      fontSize: '0.73rem', color: '#888', marginTop: '2px',
                      paddingLeft: '16px',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {note.contenido}
                    </div>
                  )}
                </div>
              );
            })}

            {notes.notes.length > 4 && (
              <div style={{
                padding: '4px 14px', fontSize: '0.73rem',
                color: '#aaa', textAlign: 'center',
                borderBottom: '1px solid #f4f4f4',
              }}>
                +{notes.notes.length - 4} más
              </div>
            )}

            {/* Action buttons */}
            <div style={{
              display: 'flex', gap: '1px',
              backgroundColor: '#f0f0f0',
            }}>
              <button onClick={handleViewNotes} style={{
                flex: 1, padding: '9px 0',
                backgroundColor: '#fff', border: 'none', cursor: 'pointer',
                fontSize: '0.82rem', color: PINK, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                transition: 'background 0.12s',
              }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fff9fb'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}
              >
                {/* List icon */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M9 6h11M9 12h11M9 18h11M5 6h.01M5 12h.01M5 18h.01"
                    stroke={PINK} strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                Ver notas
              </button>

              {/* Divider */}
              <div style={{ width: '1px', backgroundColor: '#f0f0f0' }} />

              <button onClick={handleAddNote} style={{
                flex: 1, padding: '9px 0',
                backgroundColor: '#fff', border: 'none', cursor: 'pointer',
                fontSize: '0.82rem', color: PINK_DARK, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                transition: 'background 0.12s',
              }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fff9fb'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}
              >
                {/* Plus icon */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14"
                    stroke={PINK_DARK} strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                Agregar nota
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Composer modal */}
      {notes.showModal && (
        <PNoteModal
          visible={notes.showModal}
          onClose={notes.closeModal}
          editNote={notes.editNote}
          contextType={contextType}
          contextId={contextId}
        />
      )}
    </>
  );
};

export default PNoteButton;