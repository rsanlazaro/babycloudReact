import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  CCard, CCardBody, CCardHeader, CCol, CRow,
  CSpinner, CAlert, CButton, CBadge,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft, cilCloudUpload, cilPlus, cilMinus } from '@coreui/icons'
import api from '../../../services/api'

// ─── Stage definitions ────────────────────────────────────────────────────────
// Mirrors the PHP structure exactly

const STATE_COLORS = {
  '---': 'secondary', Processing: 'info', Concluding: 'success',
  Enviado: 'info', Esperando: 'warning',
  Selection: 'secondary', Insurance_Period: 'secondary', Start_Simulation: 'primary',
  Canceled: 'danger', Programada: 'warning', Realizado: 'success',
  Reagendado: 'warning', Cancelado: 'danger', Estimado: 'secondary',
  Successful: 'success', No_Confirmado: 'danger', Esperando_SDG: 'warning',
  Esperando_fecha: 'warning', Confirmada: 'success',
  Positivo: 'success', Esperando_Beta: 'warning', Con_Presencia: 'success',
}

const STAGE_OPTIONS = {
  ginecologica: [
    { value: '---', label: '---' },
    { value: 'Estimado', label: 'Estimado' },
    { value: 'Programado', label: 'Programado' },
    { value: 'Reagendado', label: 'Reagendado' },
    { value: 'Cancelado', label: 'Cancelado' },
    { value: 'Realizado', label: 'Realizado' },
  ],
}

const STAGES = [
  {
    id: 1,
    label: 'Fase 1 — Crio Embrio',
    phaseKey: 'count_1',   // stored in ipregister_1
    maxPhases: 3,
    hasInfo2: true,
    components: [
      {
        id: 1,
        description: 'Creación embrionaria — Reporte<br/>Rapport de création embryonnaire',
        info1Type: 'donante',
        info2Type: 'embriones',
        options: [
          { value: '---', label: '---' },
          { value: 'Processing', label: 'Processing' },
          { value: 'Concluding', label: 'Concluding' },
        ],
      },
      {
        id: 2,
        description: 'Reporte Pgta<br/>Rapport PGT-A',
        info1Type: 'xx',
        info2Type: 'xy',
        options: [
          { value: '---', label: '---' },
          { value: 'Enviado', label: 'Enviado' },
          { value: 'Esperando', label: 'Esperando' },
          { value: 'Processing', label: 'Processing' },
          { value: 'Concluding', label: 'Concluding' },
        ],
      },
    ],
  },
  {
    id: 2,
    label: 'Fase 2 — Intentos de embarazo',
    phaseKey: 'count_2',
    maxPhases: 6,
    hasInfo2: true,
    components: [
      {
        id: 1,
        description: 'Presentación de la candidata<br/>Présentation de la candidate',
        info1Type: 'candidata',
        info2Type: 'text',
        options: [
          { value: '---', label: '---' },
          { value: 'Selection', label: 'Selection' },
          { value: 'Insurance_Period', label: 'Insurance Period' },
          { value: 'Start_Simulation', label: 'Start Simulation' },
          { value: 'Canceled', label: 'Canceled' },
          { value: 'Concluding', label: 'Concluding' },
        ],
      },
      {
        id: 2,
        description: 'Transfer. Embrionaria<br/>Transfert embryonnaire',
        info1Type: 'xx',
        info2Type: 'xy',
        options: [
          { value: '---', label: '---' },
          { value: 'Esperando', label: 'Esperando' },
          { value: 'Canceled', label: 'Canceled' },
          { value: 'Processing', label: 'Processing' },
          { value: 'Concluding', label: 'Concluding' },
        ],
      },
      {
        id: 3,
        description: 'Reporte Transfer<br/>Rapport de transfert embryonnaire',
        info1Type: 'resumen',  // colspan 2, no info2
        info2Type: null,
        options: [
          { value: '---', label: '---' },
          { value: 'Esperando', label: 'Esperando' },
          { value: 'Concluding', label: 'Concluding' },
        ],
      },
      {
        id: 4,
        description: 'Prueba Beta<br/>Beta Test',
        info1Type: 'select',
        info1Options: [
          { value: '---', label: '---' },
          { value: 'Esperando_Beta', label: 'Esperando Beta' },
          { value: 'Positivo', label: 'Positivo' },
          { value: 'No_Confirmado', label: 'No Confirmado' },
        ],
        info2Type: 'modal',
        options: [
          { value: '---', label: '---' },
          { value: 'Programada', label: 'Programada' },
          { value: 'Processing', label: 'Processing' },
          { value: 'Concluding', label: 'Concluding' },
        ],
      },
      {
        id: 5,
        description: 'Saco gestacional<br/>Sac gestationnel',
        info1Type: 'select',
        info1Options: [
          { value: '---', label: '---' },
          { value: 'Esperando', label: 'Esperando' },
          { value: 'Con_Presencia', label: 'Con Presencia' },
          { value: 'No_Confirmado', label: 'No Confirmado' },
        ],
        info2Type: 'modal',
        options: [
          { value: '---', label: '---' },
          { value: 'Programada', label: 'Programada' },
          { value: 'Processing', label: 'Processing' },
          { value: 'Concluding', label: 'Concluding' },
        ],
      },
    ],
  },
  {
    id: 3,
    label: 'Fase 3 — Seguimiento Ginecológico',
    subLabel: 'Seguimiento Ginecológico — Primer Trimestre',
    phaseKey: 'count_3',
    maxPhases: 3,
    hasInfo2: false,
    components: [
      {
        id: 1,
        description: 'SDG8 — Latido de corazón<br/>Détection du battement du coeur foetal',
        info1Type: 'modal',
        options: [
          { value: '---', label: '---' },
          { value: 'Programada', label: 'Programada' },
          { value: 'Esperando_SDG', label: 'Esperando SDG' },
          { value: 'Successful', label: 'Successful' },
          { value: 'No_Confirmado', label: 'No Confirmado' },
        ],
      },
      {
        id: 2,
        description: 'SDG10 — Seg Ginecologica<br/>Suivi Gynécologique',
        info1Type: 'modal',
        options: STAGE_OPTIONS.ginecologica,
      },
      {
        id: 3,
        description: 'SDG12 — Materno Fetal 1<br/>Suivi Materno Fetal 1',
        info1Type: 'modal',
        options: STAGE_OPTIONS.ginecologica,
      },
    ],
  },
  {
    id: 4,
    label: 'Fase 4 — Conclusión',
    subLabel: 'Seguimiento Ginecológico — Segundo Trimestre',
    hasInfo2: false,
    components: [
      { id: 1, description: 'Seg Ginecológica<br/>Suivi gynécologique', info1Type: 'modal', options: STAGE_OPTIONS.ginecologica },
      { id: 2, description: 'Seg Ginecológica<br/>Suivi gynécologique', info1Type: 'modal', options: STAGE_OPTIONS.ginecologica },
      { id: 3, description: 'Materno Fetal 2<br/>Suivi Materno Fetal 2', info1Type: 'modal', options: STAGE_OPTIONS.ginecologica },
      { id: 4, description: 'Seg Ginecológica<br/>Suivi gynécologique', info1Type: 'modal', options: STAGE_OPTIONS.ginecologica },
    ],
  },
  {
    id: 5,
    label: 'Fase 5',
    subLabel: 'Seguimiento Ginecológico — Tercer Trimestre → Parto',
    hasInfo2: false,
    components: [
      { id: 1, description: 'Seg Ginecológica<br/>Suivi gynécologique', info1Type: 'modal', options: STAGE_OPTIONS.ginecologica },
      { id: 2, description: 'Materno Fetal 3<br/>Suivi Materno Fetal 3', info1Type: 'modal', options: STAGE_OPTIONS.ginecologica },
      { id: 3, description: 'Seg Ginecológica<br/>Suivi gynécologique', info1Type: 'modal', options: STAGE_OPTIONS.ginecologica },
      { id: 4, description: 'Seg Ginecológica<br/>Suivi gynécologique', info1Type: 'modal', options: STAGE_OPTIONS.ginecologica },
      { id: 5, description: 'Seg Ginecológica<br/>Suivi gynécologique', info1Type: 'modal', options: STAGE_OPTIONS.ginecologica },
      { id: 6, description: 'Seg Ginecológica<br/>Suivi gynécologique', info1Type: 'modal', options: STAGE_OPTIONS.ginecologica },
      { id: 7, description: 'Seg Ginecológica<br/>Suivi gynécologique', info1Type: 'modal', options: STAGE_OPTIONS.ginecologica },
      { id: 8, description: 'Seg Ginecológica<br/>Suivi gynécologique', info1Type: 'modal', options: STAGE_OPTIONS.ginecologica },
    ],
  },
  {
    id: 6,
    label: 'Fase 6',
    subLabel: 'Fecha estimada de parto',
    hasInfo2: false,
    components: [
      {
        id: 1,
        description: 'Fecha estimada de parto<br/>Date probable de naissance',
        info1Type: 'modal',
        options: [
          { value: '---', label: '---' },
          { value: 'Esperando_fecha', label: 'Esperando fecha' },
          { value: 'Confirmada', label: 'Confirmada' },
        ],
      },
    ],
  },
]

// ─── Single row ───────────────────────────────────────────────────────────────

const StageRow = ({ stageId, component, phaseIndex, rowData, onSave, onModalOpen }) => {

  const get = (field) => rowData?.[field] ?? ''
  const getStatus = () => get('status') || component.options[0]?.value

  const save = (field, value) => onSave(stageId, component.id, phaseIndex, field, value)

  const toggleBool = (field) => save(field, get(field) === true ? false : true)

  // Cloud upload button — color reflects whether content exists
  const CloudBtn = ({ field }) => {
    const hasContent = String(get(field)).length > 5
    return (
      <button
        className={`btn btn-sm ${hasContent ? 'btn-primary' : 'btn-outline-secondary'}`}
        title="Abrir enlace"
        onClick={() => onModalOpen(stageId, component.id, phaseIndex, field, get(field))}
        style={{ padding: '3px 9px' }}
      >
        <CIcon icon={cilCloudUpload} size="sm" />
      </button>
    )
  }

  // Toggle enable button
  const EnableBtn = ({ field }) => {
    const isOn = get(field) === 'true' || get(field) === true
    return (
      <button
        className={`btn btn-sm ${isOn ? 'btn-success' : 'btn-outline-secondary'}`}
        title={isOn ? 'Habilitado' : 'Deshabilitado'}
        onClick={() => save(field, isOn ? 'false' : 'true')}
        style={{ padding: '3px 9px', fontSize: '0.7rem', minWidth: 56 }}
      >
        {isOn ? 'ON' : 'OFF'}
      </button>
    )
  }

  // Eye button — same style as CloudBtn
  const EyeBtn = () => {
    const isOn = get('enableView') === 'true' || get('enableView') === true
    return (
      <button
        className={`btn btn-sm ${isOn ? 'btn-primary' : 'btn-outline-secondary'}`}
        title={isOn ? 'Visible' : 'Oculto'}
        onClick={() => save('enableView', isOn ? 'false' : 'true')}
        style={{ padding: '3px 9px' }}
      >
        {/* Simple eye outline — matches cloud icon visual weight */}
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
          {isOn
            ? <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5"/>
            : <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486zm-3.06 3.064l.77.772A7 7 0 0 1 8 15.5C3 15.5 0 10 0 10s.939-1.721 2.641-3.238l.708.709C1.888 8.938 1.173 10 1.173 10c.694.98 1.56 1.903 2.828 2.557A6 6 0 0 0 8 13.5q.59 0 1.12-.109zM9.98 5.032A6 6 0 0 0 8 4.5c-2.12 0-3.879 1.168-5.168 2.457A13 13 0 0 0 1.172 8l.195.288a13 13 0 0 0 1.317 1.554l-.708.709C.647 9.116 0 8 0 8s3-5.5 8-5.5c.966 0 1.87.15 2.703.432zM14.293 4.293l-12 12 .707.707 12-12z"/>
          }
        </svg>
      </button>
    )
  }

  // Info1 cell
  const renderInfo1 = () => {
    const { info1Type, info1Options } = component
    if (info1Type === 'donante') return (
      <td className="text-center" style={{ fontSize: '0.78rem' }}>
        <div className="text-muted" style={{ fontSize: '0.65rem' }}>Donante</div>
        <input className="form-control form-control-sm" defaultValue={get('info_1')}
          onBlur={(e) => save('info_1', e.target.value)} style={{ minWidth: 70 }} />
      </td>
    )
    if (info1Type === 'xx') return (
      <td className="text-center" style={{ fontSize: '0.78rem' }}>
        <div className="text-muted" style={{ fontSize: '0.65rem' }}>XX</div>
        <input className="form-control form-control-sm" defaultValue={get('info_1')}
          onBlur={(e) => save('info_1', e.target.value)} style={{ minWidth: 70 }} />
      </td>
    )
    if (info1Type === 'candidata') return (
      <td className="text-center text-muted" style={{ fontSize: '0.78rem' }}>Candidata</td>
    )
    if (info1Type === 'resumen') return (
      <td colSpan={2}>
        <textarea className="form-control form-control-sm" defaultValue={get('info_1')}
          onBlur={(e) => save('info_1', e.target.value)}
          rows={2} style={{ minWidth: 180, fontSize: '0.78rem' }}
          placeholder="Redactar resumen..." />
      </td>
    )
    if (info1Type === 'select') return (
      <td>
        <select className="form-select form-select-sm" value={get('info_1') || info1Options[0]?.value}
          onChange={(e) => save('info_1', e.target.value)} style={{ minWidth: 130 }}>
          {info1Options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </td>
    )
    if (info1Type === 'modal') return (
      <td colSpan={2} className="text-center">
        <button
          className={`btn btn-sm ${String(get('info_1')).length > 1 ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => onModalOpen(stageId, component.id, phaseIndex, 'info_1', get('info_1'))}
          style={{ padding: '3px 9px' }}
          title="Agregar nota"
        >
          {/* Comment bubble — same visual weight as cloud icon */}
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path d="M2.678 11.894a1 1 0 0 1 .287.801 11 11 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8 8 0 0 0 8 14c3.996 0 7-2.807 7-6s-3.004-6-7-6-7 2.808-7 6c0 1.468.617 2.83 1.678 3.894m-.493 3.905a22 22 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a10 10 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9 9 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105"/>
          </svg>
        </button>
      </td>
    )
    return (
      <td>
        <input className="form-control form-control-sm" defaultValue={get('info_1')}
          onBlur={(e) => save('info_1', e.target.value)} style={{ minWidth: 80 }} />
      </td>
    )
  }

  // Info2 cell
  const renderInfo2 = () => {
    const { info2Type } = component
    if (!info2Type || info2Type === null || info1Type === 'resumen' || info1Type === 'modal') return null
    if (info2Type === 'embriones') return (
      <td className="text-center" style={{ fontSize: '0.78rem' }}>
        <div className="text-muted" style={{ fontSize: '0.65rem' }}>Embriones D6</div>
        <input className="form-control form-control-sm" defaultValue={get('info_2')}
          onBlur={(e) => save('info_2', e.target.value)} style={{ minWidth: 70 }} />
      </td>
    )
    if (info2Type === 'xy') return (
      <td className="text-center" style={{ fontSize: '0.78rem' }}>
        <div className="text-muted" style={{ fontSize: '0.65rem' }}>XY</div>
        <input className="form-control form-control-sm" defaultValue={get('info_2')}
          onBlur={(e) => save('info_2', e.target.value)} style={{ minWidth: 70 }} />
      </td>
    )
    if (info2Type === 'text') return (
      <td>
        <input className="form-control form-control-sm" defaultValue={get('info_2')}
          onBlur={(e) => save('info_2', e.target.value)} style={{ minWidth: 80 }} />
      </td>
    )
    if (info2Type === 'modal') return (
      <td className="text-center">
        <button
          className={`btn btn-sm ${String(get('info_2')).length > 1 ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => onModalOpen(stageId, component.id, phaseIndex, 'info_2', get('info_2'))}
          style={{ padding: '3px 9px' }}
          title="Agregar nota"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path d="M2.678 11.894a1 1 0 0 1 .287.801 11 11 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8 8 0 0 0 8 14c3.996 0 7-2.807 7-6s-3.004-6-7-6-7 2.808-7 6c0 1.468.617 2.83 1.678 3.894m-.493 3.905a22 22 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a10 10 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9 9 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105"/>
          </svg>
        </button>
      </td>
    )
    return null
  }

  const { info1Type } = component
  const currentStatus = getStatus()

  return (
    <tr>
      {/* Description */}
      <td style={{ fontSize: '0.78rem', lineHeight: 1.3, minWidth: 150 }}
        dangerouslySetInnerHTML={{ __html: component.description }} />

      {/* Status select */}
      <td>
        <select className="form-select form-select-sm" value={currentStatus}
          onChange={(e) => save('status', e.target.value)} style={{ minWidth: 120 }}>
          {component.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <CBadge color={STATE_COLORS[currentStatus] || 'secondary'} className="mt-1"
          style={{ fontSize: '0.6rem' }}>
          {component.options.find((o) => o.value === currentStatus)?.label}
        </CBadge>
      </td>

      {/* Date */}
      <td>
        <input type="date" className="form-control form-control-sm"
          defaultValue={get('date')}
          onBlur={(e) => save('date', e.target.value)}
          style={{ minWidth: 130 }} />
      </td>

      {/* Info 1 (and info 2 if applicable) */}
      {renderInfo1()}
      {info1Type !== 'resumen' && info1Type !== 'modal' && renderInfo2()}

      {/* Last 5 action columns */}
      {/* 1 — Cloud upload 1 */}
      <td className="text-center">
        <CloudBtn field="uploading_1" />
      </td>

      {/* 2 — Enable stage 1 */}
      <td className="text-center">
        <EnableBtn field="enable_1" />
      </td>

      {/* 3 — Cloud upload 2 */}
      <td className="text-center">
        <CloudBtn field="uploading_2" />
      </td>

      {/* 4 — Enable stage 2 */}
      <td className="text-center">
        <EnableBtn field="enable_2" />
      </td>

      {/* 5 — Enable view */}
      <td className="text-center">
        <EyeBtn />
      </td>
    </tr>
  )
}

// ─── Stage section ────────────────────────────────────────────────────────────

const StageSection = ({ stage, stageData, phaseCounts, onSave, onPhaseChange, onModalOpen }) => {
  const [collapsed, setCollapsed] = useState(false)
  const phaseCount = stage.phaseKey ? (phaseCounts[stage.phaseKey] ?? 1) : 1

  const COL_COUNT = stage.hasInfo2 ? 10 : 9

  return (
    <div className="mb-3">
      <table className="table table-hover table-bordered table-sm align-middle"
        style={{ fontSize: '0.8rem', tableLayout: 'auto' }}>
        {/* Phase header */}
        <thead>
          <tr className="table-light" style={{ cursor: 'pointer' }}>
            <th onClick={() => setCollapsed(!collapsed)} className="py-2 px-3">
              <span className="me-2">{collapsed ? '▶' : '▼'}</span>
              <strong>{stage.label}</strong>
              {stage.subLabel && (
                <span className="text-muted ms-2" style={{ fontSize: '0.75rem' }}>
                  — {stage.subLabel}
                </span>
              )}
            </th>
            {/* Add / Remove phase buttons (only for stages 1-3) */}
            {stage.phaseKey && (
              <>
                <th>
                  <CButton size="sm" color="primary" variant="outline"
                    disabled={phaseCount >= stage.maxPhases}
                    onClick={() => onPhaseChange(stage.phaseKey, 'add', stage.maxPhases)}>
                    <CIcon icon={cilPlus} size="sm" className="me-1" />Agregar fase
                  </CButton>
                </th>
                <th>
                  <CButton size="sm" color="danger" variant="outline"
                    disabled={phaseCount <= 1}
                    onClick={() => onPhaseChange(stage.phaseKey, 'remove', stage.maxPhases)}>
                    <CIcon icon={cilMinus} size="sm" className="me-1" />Eliminar fase
                  </CButton>
                </th>
                <th colSpan={COL_COUNT - 2} />
              </>
            )}
            {!stage.phaseKey && <th colSpan={COL_COUNT} />}
          </tr>

          {!collapsed && (
            <tr className="table-secondary" style={{ fontSize: '0.7rem' }}>
              <th>Etapa / Descripción</th>
              <th>Estado</th>
              <th>Fecha</th>
              {stage.hasInfo2
                ? <th colSpan={2}>Resultado e Info adicional</th>
                : <th colSpan={2}>Ícono resumen</th>
              }
              <th colSpan={5} className="text-center">Uploading / Habilitar Vista</th>
            </tr>
          )}
        </thead>

        {!collapsed && (
          <tbody>
            {Array.from({ length: phaseCount }, (_, phaseIdx) => (
              <React.Fragment key={phaseIdx}>
                {phaseIdx > 0 && (
                  <tr>
                    <td colSpan={12}
                      style={{ borderTop: '2px solid var(--cui-border-color)', padding: 0 }} />
                  </tr>
                )}
                {stage.components.map((comp) => (
                  <StageRow
                    key={`${comp.id}-${phaseIdx}`}
                    stageId={stage.id}
                    component={comp}
                    phaseIndex={phaseIdx}
                    rowData={stageData?.[String(comp.id)]?.[String(phaseIdx)] || {}}
                    onSave={onSave}
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

// ─── Main view ────────────────────────────────────────────────────────────────

const CloudIPS_Register = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [guest, setGuest] = useState(null)
  // data structure: { [stageId]: { [componentId]: { [phaseIndex]: { field: value } } } }
  const [data, setData] = useState({})
  // phaseCounts: { count_1: N, count_2: N, count_3: N } — stored in ipregister_1
  const [phaseCounts, setPhaseCounts] = useState({ count_1: 1, count_2: 1, count_3: 1 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Modal state
  const [modal, setModal] = useState({
    visible: false, stageId: null, componentId: null,
    phaseIndex: null, field: null, value: '',
  })

  useEffect(() => {
    setGuest(location.state?.guest ?? { id })
    load()
  }, [id])

  const load = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/api/babycloud/ips-register/${id}`, { withCredentials: true })
      const rData = res.data || {}
      setData(rData.fields || {})
      setPhaseCounts(rData.counts || { count_1: 1, count_2: 1, count_3: 1 })
    } catch {
      await api.post(`/api/babycloud/ips-register/${id}/init`, {}, { withCredentials: true })
    } finally {
      setLoading(false)
    }
  }

  // Autosave field
  const handleSave = useCallback(async (stageId, componentId, phaseIndex, field, value) => {
    // Optimistic update
    setData((prev) => {
      const s = { ...(prev[String(stageId)] || {}) }
      const c = { ...(s[String(componentId)] || {}) }
      const p = { ...(c[String(phaseIndex)] || {}) }
      p[field] = value
      c[String(phaseIndex)] = p
      s[String(componentId)] = c
      return { ...prev, [String(stageId)]: s }
    })

    setSaving(true)
    try {
      await api.post(`/api/babycloud/ips-register/${id}`, {
        stageId: String(stageId), componentId: String(componentId),
        phaseIndex: String(phaseIndex), field, value,
      }, { withCredentials: true })
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }, [id])

  // Add / remove phase
  const handlePhaseChange = useCallback(async (phaseKey, action, maxPhases) => {
    const current = phaseCounts[phaseKey] ?? 1
    const next = action === 'add'
      ? Math.min(current + 1, maxPhases)
      : Math.max(current - 1, 1)

    setPhaseCounts((prev) => ({ ...prev, [phaseKey]: next }))

    setSaving(true)
    try {
      await api.post(`/api/babycloud/ips-register/${id}/phase`, {
        action, phaseKey,
      }, { withCredentials: true })
    } catch (err) {
      console.error('Phase change error:', err)
    } finally {
      setSaving(false)
    }
  }, [id, phaseCounts])

  // Modal handlers
  const openModal = (stageId, componentId, phaseIndex, field, value) => {
    setModal({ visible: true, stageId, componentId, phaseIndex, field, value: value || '' })
  }
  const saveModal = () => {
    handleSave(modal.stageId, modal.componentId, modal.phaseIndex, modal.field, modal.value)
    setModal((m) => ({ ...m, visible: false }))
  }

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
                onClick={() => navigate('/babycloud/cloud-ips')}>
                <CIcon icon={cilArrowLeft} className="me-1" />Volver
              </CButton>
              <div>
                <div className="fw-bold fs-5">
                  {guest?.username || `Guest #${id}`}
                </div>
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                  {guest?.mail}
                  {guest?.profile && (
                    <CBadge color="info" className="ms-2">{guest.profile.toUpperCase()}</CBadge>
                  )}
                </div>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              {saving && <CSpinner size="sm" color="primary" />}
              <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                {saving ? 'Guardando...' : 'Auto-guardado'}
              </span>
            </div>
          </CCardHeader>
        </CCard>

        {error && (
          <CAlert color="danger" dismissible onClose={() => setError(null)}>{error}</CAlert>
        )}

        {/* Stage tables */}
        <CCard>
          <CCardBody className="p-2">
            <div className="table-responsive">
              {STAGES.map((stage) => (
                <StageSection
                  key={stage.id}
                  stage={stage}
                  stageData={data[String(stage.id)]}
                  phaseCounts={phaseCounts}
                  onSave={handleSave}
                  onPhaseChange={handlePhaseChange}
                  onModalOpen={openModal}
                />
              ))}
            </div>
          </CCardBody>
        </CCard>
      </CCol>

      {/* Modal for URL / text fields */}
      <CModal visible={modal.visible} onClose={() => setModal((m) => ({ ...m, visible: false }))}>
        <CModalHeader>
          <CModalTitle>
            {modal.field?.startsWith('uploading') ? 'Ingrese el enlace' : 'Ingrese la información'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <textarea
            className="form-control"
            rows={4}
            value={modal.value}
            onChange={(e) => setModal((m) => ({ ...m, value: e.target.value }))}
            placeholder={modal.field?.startsWith('uploading') ? 'https://...' : 'Escriba aquí...'}
          />
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setModal((m) => ({ ...m, visible: false }))}>
            Cancelar
          </CButton>
          <CButton color="primary" className="app-button" onClick={saveModal}>
            Guardar
          </CButton>
        </CModalFooter>
      </CModal>
    </CRow>
  )
}

export default CloudIPS_Register