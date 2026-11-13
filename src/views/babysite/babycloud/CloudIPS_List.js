import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CSpinner,
  CAlert,
  CInputGroup,
  CFormInput,
  CInputGroupText,
  CBadge,
  CContainer,
  CButton,
  CFormSwitch,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilCloudUpload } from '@coreui/icons'
import api from '../../../services/api'
import { useUser } from '../../../context/AuthContext'
import PERMISSIONS from '../../../config/permissions'

const CloudIPS_List = () => {
  const navigate = useNavigate()
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  // "Vista" column: guest_id → { ip_id, nombre_completo, enabled }. It is the same
  // switch as Sort_IPS → Alta IP → "Vista en Baby Cloud" (stored in the IP register).
  const [views, setViews] = useState({})
  const [viewsError, setViewsError] = useState('')
  const [savingViewId, setSavingViewId] = useState(null)
  const { canView } = useUser()
  const canEditView = canView(PERMISSIONS.EDIT_SORT_IP)

  useEffect(() => {
    fetchGuests()
  }, [])

  const fetchGuests = async () => {
    try {
      setLoading(true)
      const [res, viewsRes] = await Promise.all([
        api.get('/api/guests', { withCredentials: true }),
        api.get('/api/sort-ip/cloud-views', { withCredentials: true }).catch((err) => {
          console.error('Error fetching cloud views:', err)
          return null
        }),
      ])
      setGuests(res.data)
      if (viewsRes) {
        const map = {}
        ;(viewsRes.data || []).forEach((v) => { map[v.guest_id] = v })
        setViews(map)
        setViewsError('')
      } else {
        setViewsError('No se pudo cargar el estado de la vista de cada IP')
      }
      setError(null)
    } catch (err) {
      console.error('Error fetching guests:', err)
      setError('Error al cargar los invitados')
    } finally {
      setLoading(false)
    }
  }

  // Turns the IP's view of their register in Baby Cloud on / off
  const toggleView = async (guestId, enabled) => {
    const v = views[guestId]
    if (!v) return
    setSavingViewId(guestId)
    try {
      await api.put(`/api/sort-ip/${v.ip_id}/cloud-view`, { enabled }, { withCredentials: true })
      setViews((prev) => ({ ...prev, [guestId]: { ...prev[guestId], enabled } }))
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cambiar la vista del IP')
    } finally {
      setSavingViewId(null)
    }
  }

  const viewCell = (guest) => {
    const v = views[guest.id]
    if (!v) {
      return guest.profile === 'ip'
        ? <CBadge color="light" textColor="dark" className="border" title="Vincula esta cuenta a un registro en Sort_IPS → Alta IP para controlar su vista">Sin registro IP</CBadge>
        : <span className="text-muted">—</span>
    }
    const saving = savingViewId === guest.id
    return (
      <div className="d-flex align-items-center gap-2" title={`Registro Sort_IPS: ${v.nombre_completo}`}>
        <CFormSwitch
          id={`cloud-view-${guest.id}`}
          checked={v.enabled}
          disabled={!canEditView || saving}
          onChange={(e) => toggleView(guest.id, e.target.checked)}
          aria-label={`Vista en Baby Cloud de ${guest.username}`}
          className="mb-0"
        />
        {saving
          ? <CSpinner size="sm" />
          : <CBadge color={v.enabled ? 'success' : 'secondary'}>{v.enabled ? 'Activa' : 'Desactivada'}</CBadge>}
      </div>
    )
  }

  const filteredGuests = useMemo(() => {
    if (!searchTerm) return guests
    const term = searchTerm.toLowerCase()
    return guests.filter(
      (g) =>
        g.username?.toLowerCase().includes(term) ||
        g.mail?.toLowerCase().includes(term) ||
        g.profile?.toLowerCase().includes(term),
    )
  }, [guests, searchTerm])

  const profileBadge = (profile) => {
    const map = {
      ip: { color: 'info', label: 'IP' },
      agency: { color: 'warning', label: 'Agency' },
    }
    const p = map[profile] || { color: 'secondary', label: profile || '-' }
    return <CBadge color={p.color}>{p.label}</CBadge>
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <CContainer className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <CSpinner color="primary" />
      </CContainer>
    )
  }

  return (
    <CContainer fluid>
      {error && (
        <CAlert color="danger" dismissible onClose={() => setError(null)}>
          {error}
        </CAlert>
      )}
      {viewsError && (
        <CAlert color="warning" dismissible onClose={() => setViewsError('')}>
          {viewsError}
        </CAlert>
      )}

      <CCard className="mb-4">
        <CCardHeader className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <CIcon icon={cilCloudUpload} size="lg" className="text-primary" />
            <strong>Cloud IPS — Listado de Guests</strong>
          </div>
          <CInputGroup style={{ maxWidth: 280 }}>
            <CInputGroupText>
              <CIcon icon={cilSearch} />
            </CInputGroupText>
            <CFormInput
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </CInputGroup>
        </CCardHeader>

        <CCardBody>
          <div className="table-responsive">
            <CTable hover striped className="nowrap-table">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>#</CTableHeaderCell>
                  <CTableHeaderCell>Usuario</CTableHeaderCell>
                  <CTableHeaderCell>Correo</CTableHeaderCell>
                  <CTableHeaderCell>Contraseña</CTableHeaderCell>
                  <CTableHeaderCell>Perfil</CTableHeaderCell>
                  <CTableHeaderCell>Fecha de creación</CTableHeaderCell>
                  <CTableHeaderCell title="Si el IP puede ver los contenidos de su registro en Baby Cloud">Vista del IP</CTableHeaderCell>
                  <CTableHeaderCell className="text-center">Upload</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {filteredGuests.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={8} className="text-center py-4">
                      {searchTerm ? 'No se encontraron invitados' : 'No hay invitados registrados'}
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  filteredGuests.map((guest, idx) => (
                    <CTableRow key={guest.id}>
                      <CTableDataCell className="text-muted" style={{ width: 40 }}>
                        {idx + 1}
                      </CTableDataCell>
                      <CTableDataCell>
                        <strong>{guest.username}</strong>
                      </CTableDataCell>
                      <CTableDataCell>{guest.mail}</CTableDataCell>
                      <CTableDataCell>
                        <span style={{ fontFamily: 'monospace', letterSpacing: 2, color: 'var(--cui-secondary-color)' }}>
                          {'•'.repeat(Math.min(guest.password?.length || 8, 12))}
                        </span>
                      </CTableDataCell>
                      <CTableDataCell>{profileBadge(guest.profile)}</CTableDataCell>
                      <CTableDataCell className="text-muted" style={{ fontSize: '0.85rem' }}>
                        {formatDate(guest.created_on)}
                      </CTableDataCell>
                      <CTableDataCell>{viewCell(guest)}</CTableDataCell>
                      <CTableDataCell className="text-center">
                        <CButton
                          color="primary"
                          size="sm"
                          className="app-button d-flex align-items-center gap-1 mx-auto"
                          onClick={() => navigate(`/babycloud/cloud-ips/register/${guest.id}`, { state: { guest } })}
                        >
                          <CIcon icon={cilCloudUpload} size="sm" />
                          Ver
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          </div>

          <div className="text-muted small mt-2">
            Mostrando {filteredGuests.length} de {guests.length} invitados
          </div>
        </CCardBody>
      </CCard>

      <style>{`
        .nowrap-table th,
        .nowrap-table td {
          white-space: nowrap;
          vertical-align: middle;
        }
      `}</style>
    </CContainer>
  )
}

export default CloudIPS_List