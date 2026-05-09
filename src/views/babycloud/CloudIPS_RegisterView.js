import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  CCard, CCardBody, CCardHeader, CCol, CRow,
  CSpinner, CAlert, CButton, CBadge,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft } from '@coreui/icons'
import api from '../../services/api'

// ─── Same STAGES / state config as admin view ────────────────────────────────

const STATE_COLORS = {
  '---': 'secondary', Processing: 'info', Concluding: 'success',
  Enviado: 'info', Esperando: 'warning', Selection: 'secondary',
  Insurance_Period: 'secondary', Start_Simulation: 'primary',
  Canceled: 'danger', Programada: 'warning', Realizado: 'success',
  Reagendado: 'warning', Cancelado: 'danger', Estimado: 'secondary',
  Successful: 'success', No_Confirmado: 'danger', Esperando_SDG: 'warning',
  Esperando_fecha: 'warning', Confirmada: 'success',
  Positivo: 'success', Esperando_Beta: 'warning', Con_Presencia: 'success',
}

const STATE_LABELS = {
  '---': '---', Processing: 'Processing', Concluding: 'Concluding',
  Enviado: 'Enviado', Esperando: 'Esperando', Selection: 'Selection',
  Insurance_Period: 'Insurance Period', Start_Simulation: 'Start Simulation',
  Canceled: 'Canceled', Programada: 'Programada', Realizado: 'Realizado',
  Reagendado: 'Reagendado', Cancelado: 'Cancelado', Estimado: 'Estimado',
  Successful: 'Successful', No_Confirmado: 'No Confirmado',
  Esperando_SDG: 'Esperando SDG', Esperando_fecha: 'Esperando fecha',
  Confirmada: 'Confirmada', Positivo: 'Positivo',
  Esperando_Beta: 'Esperando Beta', Con_Presencia: 'Con Presencia',
}

const STAGE_OPTIONS_GIN = [
  { value: '---', label: '---' }, { value: 'Estimado', label: 'Estimado' },
  { value: 'Programado', label: 'Programado' }, { value: 'Reagendado', label: 'Reagendado' },
  { value: 'Cancelado', label: 'Cancelado' }, { value: 'Realizado', label: 'Realizado' },
]

const STAGES = [
  {
    id: 1, label: 'Fase 1 — Crio Embrio', phaseKey: 'count_1', hasInfo2: true,
    components: [
      { id: 1, description: 'Creación embrionaria — Reporte<br/>Rapport de création embryonnaire', info1Type: 'donante', info2Type: 'embriones',
        options: [{ value: '---', label: '---' }, { value: 'Processing', label: 'Processing' }, { value: 'Concluding', label: 'Concluding' }] },
      { id: 2, description: 'Reporte Pgta<br/>Rapport PGT-A', info1Type: 'xx', info2Type: 'xy',
        options: [{ value: '---', label: '---' }, { value: 'Enviado', label: 'Enviado' }, { value: 'Esperando', label: 'Esperando' }, { value: 'Processing', label: 'Processing' }, { value: 'Concluding', label: 'Concluding' }] },
    ],
  },
  {
    id: 2, label: 'Fase 2 — Intentos de embarazo', phaseKey: 'count_2', hasInfo2: true,
    components: [
      { id: 1, description: 'Presentación de la candidata<br/>Présentation de la candidate', info1Type: 'candidata', info2Type: 'text',
        options: [{ value: '---', label: '---' }, { value: 'Selection', label: 'Selection' }, { value: 'Insurance_Period', label: 'Insurance Period' }, { value: 'Start_Simulation', label: 'Start Simulation' }, { value: 'Canceled', label: 'Canceled' }, { value: 'Concluding', label: 'Concluding' }] },
      { id: 2, description: 'Transfer. Embrionaria<br/>Transfert embryonnaire', info1Type: 'xx', info2Type: 'xy',
        options: [{ value: '---', label: '---' }, { value: 'Esperando', label: 'Esperando' }, { value: 'Canceled', label: 'Canceled' }, { value: 'Processing', label: 'Processing' }, { value: 'Concluding', label: 'Concluding' }] },
      { id: 4, description: 'Prueba Beta<br/>Beta Test', info1Type: 'select', info2Type: 'modal',
        info1Options: [{ value: '---', label: '---' }, { value: 'Esperando_Beta', label: 'Esperando Beta' }, { value: 'Positivo', label: 'Positivo' }, { value: 'No_Confirmado', label: 'No Confirmado' }],
        options: [{ value: '---', label: '---' }, { value: 'Programada', label: 'Programada' }, { value: 'Processing', label: 'Processing' }, { value: 'Concluding', label: 'Concluding' }] },
      { id: 5, description: 'Saco gestacional<br/>Sac gestationnel', info1Type: 'select', info2Type: 'modal',
        info1Options: [{ value: '---', label: '---' }, { value: 'Esperando', label: 'Esperando' }, { value: 'Con_Presencia', label: 'Con Presencia' }, { value: 'No_Confirmado', label: 'No Confirmado' }],
        options: [{ value: '---', label: '---' }, { value: 'Programada', label: 'Programada' }, { value: 'Processing', label: 'Processing' }, { value: 'Concluding', label: 'Concluding' }] },
    ],
  },
  {
    id: 3, label: 'Fase 3 — Seguimiento Ginecológico', phaseKey: 'count_3',
    subLabel: 'Seguimiento Ginecológico — Primer Trimestre', hasInfo2: false,
    components: [
      { id: 1, description: 'SDG8 — Latido de corazón<br/>Détection du battement du coeur foetal', info1Type: 'modal',
        options: [{ value: '---', label: '---' }, { value: 'Programada', label: 'Programada' }, { value: 'Esperando_SDG', label: 'Esperando SDG' }, { value: 'Successful', label: 'Successful' }, { value: 'No_Confirmado', label: 'No Confirmado' }] },
      { id: 2, description: 'SDG10 — Seg Ginecologica<br/>Suivi Gynécologique', info1Type: 'modal', options: STAGE_OPTIONS_GIN },
      { id: 3, description: 'SDG12 — Materno Fetal 1<br/>Suivi Materno Fetal 1', info1Type: 'modal', options: STAGE_OPTIONS_GIN },
    ],
  },
  {
    id: 4, label: 'Fase 4 — Conclusión', subLabel: 'Seguimiento Ginecológico — Segundo Trimestre', hasInfo2: false,
    components: [
      { id: 1, description: 'Seg Ginecológica<br/>Suivi gynécologique', info1Type: 'modal', options: STAGE_OPTIONS_GIN },
      { id: 2, description: 'Seg Ginecológica<br/>Suivi gynécologique', info1Type: 'modal', options: STAGE_OPTIONS_GIN },
      { id: 3, description: 'Materno Fetal 2<br/>Suivi Materno Fetal 2', info1Type: 'modal', options: STAGE_OPTIONS_GIN },
      { id: 4, description: 'Seg Ginecológica<br/>Suivi gynécologique', info1Type: 'modal', options: STAGE_OPTIONS_GIN },
    ],
  },
  {
    id: 5, label: 'Fase 5', subLabel: 'Seguimiento Ginecológico — Tercer Trimestre → Parto', hasInfo2: false,
    components: [1,2,3,4,5,6,7,8].map((i) => ({
      id: i, info1Type: 'modal', options: STAGE_OPTIONS_GIN,
      description: i === 2 ? 'Materno Fetal 3<br/>Suivi Materno Fetal 3' : 'Seg Ginecológica<br/>Suivi gynécologique',
    })),
  },
  {
    id: 6, label: 'Fase 6', subLabel: 'Fecha estimada de parto', hasInfo2: false,
    components: [{ id: 1, description: 'Fecha estimada de parto<br/>Date probable de naissance', info1Type: 'modal',
      options: [{ value: '---', label: '---' }, { value: 'Esperando_fecha', label: 'Esperando fecha' }, { value: 'Confirmada', label: 'Confirmada' }] }],
  },
]

// ─── PDF / Upload icon SVGs (from PHP) ───────────────────────────────────────

const PdfIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
    <path d="M5.523 12.424q.21-.124.459-.238a8 8 0 0 1-.45.606c-.28.337-.498.516-.635.572l-.035.012a.3.3 0 0 1-.026-.044c-.056-.11-.054-.216.04-.36.106-.165.319-.354.647-.548m2.455-1.647q-.178.037-.356.078a21 21 0 0 0 .5-1.05 12 12 0 0 0 .51.858q-.326.048-.654.114m2.525.939a4 4 0 0 1-.435-.41q.344.007.612.054c.317.057.466.147.518.209a.1.1 0 0 1 .026.064.44.44 0 0 1-.06.2.3.3 0 0 1-.094.124.1.1 0 0 1-.069.015c-.09-.003-.258-.066-.498-.256M8.278 6.97c-.04.244-.108.524-.2.829a5 5 0 0 1-.089-.346c-.076-.353-.087-.63-.046-.822.038-.177.11-.248.196-.283a.5.5 0 0 1 .145-.04c.013.03.028.092.032.198q.008.183-.038.465z"/>
    <path fillRule="evenodd" d="M4 0h5.293A1 1 0 0 1 10 .293L13.707 4a1 1 0 0 1 .293.707V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2m5.5 1.5v2a1 1 0 0 0 1 1h2zM4.165 13.668c.09.18.23.343.438.419.207.075.412.04.58-.03.318-.13.635-.436.926-.786.333-.401.683-.927 1.021-1.51a11.7 11.7 0 0 1 1.997-.406c.3.383.61.713.91.95.28.22.603.403.934.417a.86.86 0 0 0 .51-.138c.155-.101.27-.247.354-.416.09-.181.145-.37.138-.563a.84.84 0 0 0-.2-.518c-.226-.27-.596-.4-.96-.465a5.8 5.8 0 0 0-1.335-.05 11 11 0 0 1-.98-1.686c.25-.66.437-1.284.52-1.794.036-.218.055-.426.048-.614a1.24 1.24 0 0 0-.127-.538.7.7 0 0 0-.477-.365c-.202-.043-.41 0-.601.077-.377.15-.576.47-.651.823-.073.34-.04.736.046 1.136.088.406.238.848.43 1.295a20 20 0 0 1-1.062 2.227 7.7 7.7 0 0 0-1.482.645c-.37.22-.699.48-.897.787-.21.326-.275.714-.08 1.103"/>
  </svg>
)

const HourglassIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M2.5 15a.5.5 0 1 1 0-1h1v-1a4.5 4.5 0 0 1 2.557-4.06c.29-.139.443-.377.443-.59v-.7c0-.213-.154-.451-.443-.59A4.5 4.5 0 0 1 3.5 3V2h-1a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-1v1a4.5 4.5 0 0 1-2.557 4.06c-.29.139-.443.377-.443.59v.7c0 .213.154.451.443.59A4.5 4.5 0 0 1 12.5 13v1h1a.5.5 0 0 1 0 1zm2-13v1c0 .537.12 1.045.337 1.5h6.326c.216-.455.337-.963.337-1.5V2zm3 6.35c0 .701-.478 1.236-1.011 1.492A3.5 3.5 0 0 0 4.5 13s.866-1.299 3-1.48zm1 0v3.17c2.134.181 3 1.48 3 1.48a3.5 3.5 0 0 0-1.989-3.158C8.978 9.586 8.5 9.052 8.5 8.351z"/>
  </svg>
)

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2"/>
  </svg>
)

// ─── Upload cell — PDF link or hourglass ──────────────────────────────────────
// PHP logic: if enable_N == "true" → show PDF link with URL from uploading_N
//            else if URL length > 5 → show hourglass (processing)
//            else → empty

const UploadCell = ({ url, enabled, onModalOpen }) => {
  const isEnabled = enabled === 'true' || enabled === true
  const hasUrl    = String(url || '').length > 5

  if (isEnabled && hasUrl) {
    return (
      <td className="text-center" style={{ width: 40 }}>
        <a href={url} target="_blank" rel="noreferrer" className="text-danger" title="Ver documento">
          <PdfIcon />
        </a>
      </td>
    )
  }
  if (hasUrl) {
    return (
      <td className="text-center text-muted" style={{ width: 40 }} title="En proceso">
        <HourglassIcon />
      </td>
    )
  }
  return <td style={{ width: 40 }} />
}

// ─── Preview row ──────────────────────────────────────────────────────────────

const PreviewRow = ({ component, phaseIndex, rowData, isFirstInPhase, onModalOpen }) => {
  const get = (field) => rowData?.[field] ?? ''

  // Only show row if enableView === 'true' (mirrors PHP: skip if fa-eye-slash)
  const enableView = get('enableView')
  if (enableView !== 'true' && enableView !== true) return null

  const currentStatus = get('status') || '---'
  const statusLabel   = STATE_LABELS[currentStatus] || currentStatus

  // Info1 cell (read-only version)
  const renderInfo1 = () => {
    const { info1Type, info1Options } = component
    if (info1Type === 'donante') return (
      <td className="text-center" style={{ fontSize: '0.78rem' }}>
        <div className="text-muted" style={{ fontSize: '0.65rem' }}>Donante</div>
        <div>{get('info_1') || '—'}</div>
      </td>
    )
    if (info1Type === 'xx') return (
      <td className="text-center" style={{ fontSize: '0.78rem' }}>
        <div className="text-muted" style={{ fontSize: '0.65rem' }}>XX</div>
        <div>{get('info_1') || '—'}</div>
      </td>
    )
    if (info1Type === 'candidata') return (
      <td className="text-center text-muted" style={{ fontSize: '0.78rem' }}>Candidata</td>
    )
    if (info1Type === 'select') return (
      <td style={{ fontSize: '0.78rem' }}>
        <CBadge color={STATE_COLORS[get('info_1')] || 'secondary'}>
          {STATE_LABELS[get('info_1')] || get('info_1') || '—'}
        </CBadge>
      </td>
    )
    if (info1Type === 'modal') {
      const hasContent = String(get('info_1')).length > 1
      return (
        <td colSpan={2} className="text-center">
          {hasContent ? (
            <button
              className="btn btn-sm btn-primary"
              onClick={() => onModalOpen(get('info_1'))}
              style={{ padding: '3px 9px' }}
              title="Ver nota"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path d="M2.678 11.894a1 1 0 0 1 .287.801 11 11 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8 8 0 0 0 8 14c3.996 0 7-2.807 7-6s-3.004-6-7-6-7 2.808-7 6c0 1.468.617 2.83 1.678 3.894m-.493 3.905a22 22 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a10 10 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9 9 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105"/>
              </svg>
            </button>
          ) : (
            <button className="btn btn-sm btn-outline-secondary" disabled style={{ padding: '3px 9px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path d="M2.678 11.894a1 1 0 0 1 .287.801 11 11 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8 8 0 0 0 8 14c3.996 0 7-2.807 7-6s-3.004-6-7-6-7 2.808-7 6c0 1.468.617 2.83 1.678 3.894m-.493 3.905a22 22 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a10 10 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9 9 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105"/>
              </svg>
            </button>
          )}
        </td>
      )
    }
    return (
      <td style={{ fontSize: '0.78rem' }}>{get('info_1') || '—'}</td>
    )
  }

  const renderInfo2 = () => {
    const { info2Type } = component
    if (!info2Type || info1Type === 'modal') return null
    if (info2Type === 'embriones') return (
      <td className="text-center" style={{ fontSize: '0.78rem' }}>
        <div className="text-muted" style={{ fontSize: '0.65rem' }}>Embriones D6</div>
        <div>{get('info_2') || '—'}</div>
      </td>
    )
    if (info2Type === 'xy') return (
      <td className="text-center" style={{ fontSize: '0.78rem' }}>
        <div className="text-muted" style={{ fontSize: '0.65rem' }}>XY</div>
        <div>{get('info_2') || '—'}</div>
      </td>
    )
    if (info2Type === 'modal') {
      const hasContent = String(get('info_2')).length > 1
      return (
        <td className="text-center">
          <button
            className={`btn btn-sm ${hasContent ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={hasContent ? () => onModalOpen(get('info_2')) : undefined}
            disabled={!hasContent}
            style={{ padding: '3px 9px' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
              <path d="M2.678 11.894a1 1 0 0 1 .287.801 11 11 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8 8 0 0 0 8 14c3.996 0 7-2.807 7-6s-3.004-6-7-6-7 2.808-7 6c0 1.468.617 2.83 1.678 3.894m-.493 3.905a22 22 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a10 10 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9 9 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105"/>
            </svg>
          </button>
        </td>
      )
    }
    return <td style={{ fontSize: '0.78rem' }}>{get('info_2') || '—'}</td>
  }

  const { info1Type } = component

  return (
    <tr>
      {/* Info icon on first row of each phase (mirrors PHP i==0 check) */}
      <td className="text-center" style={{ width: 30, color: 'var(--cui-info)' }}>
        {isFirstInPhase && <InfoIcon />}
      </td>

      {/* Description */}
      <td style={{ fontSize: '0.78rem', lineHeight: 1.3, minWidth: 150 }}
        dangerouslySetInnerHTML={{ __html: component.description }} />

      {/* Status badge (read-only) */}
      <td>
        <CBadge color={STATE_COLORS[currentStatus] || 'secondary'}>
          {statusLabel}
        </CBadge>
      </td>

      {/* Date */}
      <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
        {get('date') || '—'}
      </td>

      {/* Info 1 */}
      {renderInfo1()}

      {/* Info 2 (if applicable) */}
      {info1Type !== 'modal' && renderInfo2()}

      {/* Upload 1 — PDF link or hourglass */}
      <UploadCell url={get('uploading_1')} enabled={get('enable_1')} />

      {/* Upload 2 — PDF link or hourglass */}
      <UploadCell url={get('uploading_2')} enabled={get('enable_2')} />
    </tr>
  )
}

// ─── Stage section (preview) ─────────────────────────────────────────────────

const PreviewStage = ({ stage, stageData, phaseCounts, onModalOpen }) => {
  const [collapsed, setCollapsed] = useState(false)
  const phaseCount = stage.phaseKey ? (phaseCounts[stage.phaseKey] ?? 1) : 1

  // Check if any row in this stage is visible — skip entire section if none
  let hasVisibleRows = false
  for (let p = 0; p < phaseCount && !hasVisibleRows; p++) {
    for (const comp of stage.components) {
      const d = stageData?.[String(comp.id)]?.[String(p)]
      if (d?.enableView === 'true' || d?.enableView === true) {
        hasVisibleRows = true
        break
      }
    }
  }
  if (!hasVisibleRows) return null

  return (
    <div className="mb-3">
      <table className="table table-hover table-bordered table-sm align-middle"
        style={{ fontSize: '0.8rem', tableLayout: 'auto' }}>
        <thead>
          <tr className="table-light" style={{ cursor: 'pointer' }}
            onClick={() => setCollapsed(!collapsed)}>
            <th colSpan={stage.hasInfo2 ? 9 : 8} className="py-2 px-3">
              <span className="me-2">{collapsed ? '▶' : '▼'}</span>
              <strong>{stage.label}</strong>
              {stage.subLabel && (
                <span className="text-muted ms-2" style={{ fontSize: '0.75rem' }}>
                  — {stage.subLabel}
                </span>
              )}
            </th>
          </tr>
          {!collapsed && (
            <tr className="table-secondary" style={{ fontSize: '0.7rem' }}>
              <th style={{ width: 30 }} />
              <th>Etapa / Descripción</th>
              <th>Estado</th>
              <th>Fecha</th>
              {stage.hasInfo2
                ? <th colSpan={2}>Resultado e Info adicional</th>
                : <th colSpan={2}>Ícono resumen</th>
              }
              <th className="text-center" colSpan={2}>Documentos</th>
            </tr>
          )}
        </thead>

        {!collapsed && (
          <tbody>
            {Array.from({ length: phaseCount }, (_, phaseIdx) => (
              <React.Fragment key={phaseIdx}>
                {phaseIdx > 0 && (
                  <tr>
                    <td colSpan={10}
                      style={{ borderTop: '2px solid var(--cui-border-color)', padding: 0 }} />
                  </tr>
                )}
                {stage.components.map((comp, compIdx) => (
                  <PreviewRow
                    key={`${comp.id}-${phaseIdx}`}
                    component={comp}
                    phaseIndex={phaseIdx}
                    rowData={stageData?.[String(comp.id)]?.[String(phaseIdx)] || {}}
                    isFirstInPhase={compIdx === 0}
                    onModalOpen={onModalOpen}
                  />
                ))}
              </React.Fragment>
            ))}
          </tbody>
        )}
      </table>
    </div>
  )
}

// ─── Main preview view ────────────────────────────────────────────────────────

const CloudIPS_RegisterView = () => {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const location   = useLocation()

  const [guest, setGuest]           = useState(null)
  const [data, setData]             = useState({})
  const [phaseCounts, setPhaseCounts] = useState({ count_1: 1, count_2: 1, count_3: 1 })
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [modal, setModal]           = useState({ visible: false, content: '' })

  useEffect(() => {
    setGuest(location.state?.guest ?? { id })
    const load = async () => {
      try {
        setLoading(true)
        const res = await api.get(`/api/babycloud/ips-register/${id}`, { withCredentials: true })
        setData(res.data.fields || {})
        setPhaseCounts(res.data.counts || { count_1: 1, count_2: 1, count_3: 1 })
      } catch (err) {
        setError(err.response?.data?.message || err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const openModal = (content) => setModal({ visible: true, content })

  if (loading) {
    return (
      <div className="text-center py-5"><CSpinner color="primary" /></div>
    )
  }

  return (
    <CRow>
      <CCol xs={12}>
        {/* Header */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex align-items-center gap-3">
              <CButton color="secondary" variant="outline" size="sm"
                onClick={() => navigate(`/babycloud/cloud-ips/register/${id}`, { state: { guest } })}>
                <CIcon icon={cilArrowLeft} className="me-1" />Volver
              </CButton>
              <div>
                <div className="fw-bold fs-5">{guest?.username || `Guest #${id}`}</div>
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                  {guest?.mail}
                  {guest?.profile && (
                    <CBadge color="info" className="ms-2">{guest.profile.toUpperCase()}</CBadge>
                  )}
                </div>
              </div>
            </div>
            <CBadge color="secondary" className="px-3 py-2" style={{ fontSize: '0.8rem' }}>
              Vista de IP — solo lectura
            </CBadge>
          </CCardHeader>
        </CCard>

        {error && (
          <CAlert color="danger" dismissible onClose={() => setError(null)}>{error}</CAlert>
        )}

        {/* Preview tables */}
        <CCard>
          <CCardBody className="p-2">
            <div className="table-responsive">
              {STAGES.map((stage) => (
                <PreviewStage
                  key={stage.id}
                  stage={stage}
                  stageData={data[String(stage.id)]}
                  phaseCounts={phaseCounts}
                  onModalOpen={openModal}
                />
              ))}
            </div>
          </CCardBody>
        </CCard>
      </CCol>

      {/* Info / note modal (read-only) */}
      <CModal visible={modal.visible} onClose={() => setModal({ visible: false, content: '' })}>
        <CModalHeader>
          <CModalTitle>Información</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p style={{ whiteSpace: 'pre-wrap' }}>{modal.content}</p>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setModal({ visible: false, content: '' })}>
            Cerrar
          </CButton>
        </CModalFooter>
      </CModal>
    </CRow>
  )
}

export default CloudIPS_RegisterView