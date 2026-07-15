// src/hooks/usePNotes.js
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const usePNotes = (contextType = null, contextId = null) => {
  const [unread, setUnread]         = useState(0);
  const [notes, setNotes]           = useState([]);   // notes for this context
  const [showModal, setShowModal]   = useState(false);
  const [editNote, setEditNote]     = useState(null);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await api.get('/api/pnotes/unread-count', { withCredentials: true });
      setUnread(res.data.unread || 0);
    } catch { /* silent */ }
  }, []);

  const fetchContextNotes = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (contextType) params.set('context_type', contextType);
      if (contextId)   params.set('context_id',   contextId);
      const res = await api.get(`/api/pnotes?${params.toString()}`, { withCredentials: true });
      setNotes(res.data || []);
    } catch { /* silent */ }
  }, [contextType, contextId]);

  useEffect(() => {
    fetchUnread();
    fetchContextNotes();
    const iv = setInterval(() => { fetchUnread(); fetchContextNotes(); }, 60000);
    return () => clearInterval(iv);
  }, [fetchUnread, fetchContextNotes]);

  const openNew  = ()     => { setEditNote(null);  setShowModal(true); };
  const openEdit = (note) => { setEditNote(note);  setShowModal(true); };
  const closeModal = ()   => {
    setShowModal(false);
    setEditNote(null);
    fetchUnread();
    fetchContextNotes();
  };

  return {
    unread, notes, showModal, editNote,
    contextType, contextId,
    openNew, openEdit, closeModal,
    refreshUnread: fetchUnread,
    refreshNotes:  fetchContextNotes,
  };
};

export default usePNotes;