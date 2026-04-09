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
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilCloudUpload } from '@coreui/icons'
import api from '../../../services/api'

const CloudIPS_List = () => {
  const navigate = useNavigate()
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchGuests()
  }, [])

  const fetchGuests = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/guests', { withCredentials: true })
      setGuests(res.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching guests:', err)
      setError('Error al cargar los invitados')
    } finally {
      setLoading(false)
    }
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
        <CAlert className="mx-5" color="danger" dismissible onClose={() => setError(null)}>
          {error}
        </CAlert>
      )}

      <CCard className="mb-4 mx-5">
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
            <CTable hover striped>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>#</CTableHeaderCell>
                  <CTableHeaderCell>Usuario</CTableHeaderCell>
                  <CTableHeaderCell>Correo</CTableHeaderCell>
                  <CTableHeaderCell>Contraseña</CTableHeaderCell>
                  <CTableHeaderCell>Perfil</CTableHeaderCell>
                  <CTableHeaderCell>Fecha de creación</CTableHeaderCell>
                  <CTableHeaderCell className="text-center">Upload</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {filteredGuests.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={7} className="text-center py-4">
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
    </CContainer>
  )
}

export default CloudIPS_List