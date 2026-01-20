import React, { useState } from 'react';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CRow,
  CButton,
  CFormInput,
  CFormSelect,
  CFormLabel,
  CAlert,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CInputGroup,
  CInputGroupText,
  CFormTextarea,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CBadge,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilArrowLeft,
  cilSave,
  cilPlus,
  cilTrash,
  cilNotes,
} from '@coreui/icons';

const ProgramForm = () => {
  const navigateBack = () => {
    console.log('Navigate back to /programs');
  };

  const [formData, setFormData] = useState({
    name: '',
    couple_name: '',
    country: '',
    date: '',
    deposit_1: 'Kiromedic',
    deposit_2: 'Kiromedic',
    donant: '',
    select_2: '',
    select_3: '',
    select_r: '',
    catalog: 'Kiromedic',
    value: '',
    crio: 1,
    xx: 1,
    xy: 1,
    ni: 1,
    tank: '',
    pregnant: '',
    birth: '',
    clabe: '',
    assurance: '',
    policy: '',
    manager: '',
  });

  const [currency, setCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState(20.5);
  const [phases, setPhases] = useState([]);
  const [newPhase, setNewPhase] = useState({ name: '', value: '' });
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({
    date: '',
    movement: 'salida',
    reason: 'Poder notarial',
    destination: '',
    bank: '',
    value: '',
    notes: ''
  });

  const [showNotesModal, setShowNotesModal] = useState(false);
  const [currentNotes, setCurrentNotes] = useState({ type: '', index: null, text: '' });
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [phaseAlert, setPhaseAlert] = useState({ show: false, type: '', message: '' });
  const [expenseAlert, setExpenseAlert] = useState({ show: false, type: '', message: '' });

  const depositOptions = ['Kiromedic', 'Umare', 'Care'];
  const catalogOptions = ['Kiromedic', 'Ovodonors', 'Nora', 'Eggdonors'];
  const reasonOptions = ['Poder notarial', 'Depósito semen', 'COM. VENTA', 'FIV', 'Captura OVO', 'Factura IP'];

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateProgramTotal = () => {
    return phases.reduce((sum, phase) => sum + (parseFloat(phase.value) || 0), 0);
  };

  const calculateProgramTotalMXN = () => {
    return calculateProgramTotal() * exchangeRate;
  };

  const calculateInternalCost = () => {
    return expenses.filter(exp => exp.movement === 'salida').reduce((sum, exp) => sum + (parseFloat(exp.value) || 0), 0);
  };

  const calculateExpenseEntries = () => {
    return expenses.filter(exp => exp.movement === 'entrada').reduce((sum, exp) => sum + (parseFloat(exp.value) || 0), 0);
  };

  const addPhase = () => {
    if (!newPhase.name || !newPhase.value) {
      setPhaseAlert({ show: true, type: 'warning', message: 'Completa el nombre y valor de la fase' });
      setTimeout(() => setPhaseAlert({ show: false, type: '', message: '' }), 5000);
      return;
    }
    setPhases(prev => [...prev, {
      id: Date.now(),
      name: newPhase.name,
      value: parseFloat(newPhase.value),
      payment1: '',
      payment2: '',
      payment3: '',
      invoiced: false,
      notes: ''
    }]);
    setNewPhase({ name: '', value: '' });
    setPhaseAlert({ show: false, type: '', message: '' });
  };

  const updatePhase = (index, field, value) => {
    setPhases(prev => prev.map((phase, i) => i === index ? { ...phase, [field]: value } : phase));
  };

  const deletePhase = (index) => {
    setPhases(prev => prev.filter((_, i) => i !== index));
  };

  const calculatePhaseDifference = (phase) => {
    const totalValue = parseFloat(phase.value) || 0;
    const payment1 = parseFloat(phase.payment1) || 0;
    const payment2 = parseFloat(phase.payment2) || 0;
    const payment3 = parseFloat(phase.payment3) || 0;
    const totalPaid = payment1 + payment2 + payment3;
    const diff = totalValue - totalPaid;
    if (diff <= 0) return { text: 'Finalizado', color: 'success' };
    const symbol = currency === 'EUR' ? '€' : '$';
    const formatted = diff.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return { text: symbol + formatted + ' ' + currency, color: 'warning' };
  };

  const addExpense = () => {
    if (!newExpense.date || !newExpense.value) {
      setExpenseAlert({ show: true, type: 'warning', message: 'Completa la fecha y valor del gasto' });
      setTimeout(() => setExpenseAlert({ show: false, type: '', message: '' }), 5000);
      return;
    }
    setExpenses(prev => [...prev, { id: Date.now(), ...newExpense, value: parseFloat(newExpense.value) }]);
    setNewExpense({ date: '', movement: 'salida', reason: 'Poder notarial', destination: '', bank: '', value: '', notes: '' });
    setExpenseAlert({ show: false, type: '', message: '' });
  };

  const deleteExpense = (index) => {
    setExpenses(prev => prev.filter((_, i) => i !== index));
  };

  const openNotesModal = (type, index, currentText) => {
    setCurrentNotes({ type, index, text: currentText });
    setShowNotesModal(true);
  };

  const saveNotes = () => {
    if (currentNotes.type === 'phase') {
      updatePhase(currentNotes.index, 'notes', currentNotes.text);
    } else if (currentNotes.type === 'expense') {
      setExpenses(prev => prev.map((exp, i) => i === currentNotes.index ? { ...exp, notes: currentNotes.text } : exp));
    }
    setShowNotesModal(false);
    setCurrentNotes({ type: '', index: null, text: '' });
  };

  const saveProgram = () => {
    if (!formData.name || !formData.country || !formData.date) {
      setAlert({ show: true, type: 'danger', message: 'Completa los campos obligatorios: Nombre IP, País y Fecha' });
      return;
    }
    console.log('Saving program:', { formData, phases, expenses, currency, exchangeRate });
    setAlert({ show: true, type: 'success', message: 'Programa guardado correctamente' });
    setTimeout(() => navigateBack(), 1500);
  };

  const formatMXN = (value) => {
    if (!value && value !== 0) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MXN' }).format(value);
  };

  const getCurrencySymbol = () => currency === 'EUR' ? '€' : '$';

  const formatPhaseValue = (value) => {
    const symbol = getCurrencySymbol();
    const formatted = parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return symbol + formatted + ' ' + currency;
  };

  const formatProgramTotal = () => {
    const total = calculateProgramTotal();
    const symbol = getCurrencySymbol();
    const formatted = total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return symbol + formatted + ' ' + currency;
  };

  return (
    <CContainer fluid>
      {alert.show && (
        <CAlert className="mx-5" color={alert.type} dismissible onClose={() => setAlert({ show: false })}>
          {alert.message}
        </CAlert>
      )}

      <CRow className="mb-4 mx-5">
        <CCol>
          <CButton color="secondary" variant="outline" onClick={navigateBack} className="me-3">
            <CIcon icon={cilArrowLeft} className="me-2" />
            Volver a Programas
          </CButton>
          <CButton color="primary" className="app-button" onClick={saveProgram}>
            <CIcon icon={cilSave} className="me-2" />
            Guardar programa
          </CButton>
        </CCol>
      </CRow>

      <CCard className="mb-4 mx-5">
        <CCardHeader><strong>Datos del programa</strong></CCardHeader>
        <CCardBody>
          <CRow className="mb-3">
            <CCol md={6}>
              <CFormLabel>Nombre IP *</CFormLabel>
              <CFormInput name="name" value={formData.name} onChange={handleFormChange} placeholder="Nombre del IP" />
            </CCol>
            <CCol md={6}>
              <CFormLabel>Pareja IP</CFormLabel>
              <CFormInput name="couple_name" value={formData.couple_name} onChange={handleFormChange} placeholder="Nombre de la pareja" />
            </CCol>
          </CRow>
          <CRow className="mb-3">
            <CCol md={6}>
              <CFormLabel>País *</CFormLabel>
              <CFormInput name="country" value={formData.country} onChange={handleFormChange} placeholder="País" />
            </CCol>
            <CCol md={6}>
              <CFormLabel>Fecha de contrato *</CFormLabel>
              <CFormInput type="date" name="date" value={formData.date} onChange={handleFormChange} />
            </CCol>
          </CRow>
          <CRow className="mb-3">
            <CCol md={6}>
              <CFormLabel>Depósito 1</CFormLabel>
              <CFormSelect name="deposit_1" value={formData.deposit_1} onChange={handleFormChange}>
                {depositOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </CFormSelect>
            </CCol>
            <CCol md={6}>
              <CFormLabel>Depósito 2</CFormLabel>
              <CFormSelect name="deposit_2" value={formData.deposit_2} onChange={handleFormChange}>
                {depositOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </CFormSelect>
            </CCol>
          </CRow>
          <CRow className="mb-3">
            <CCol md={3}>
              <CFormLabel>Donante Select</CFormLabel>
              <CFormInput name="donant" value={formData.donant} onChange={handleFormChange} />
            </CCol>
            <CCol md={3}>
              <CFormLabel>Select 2</CFormLabel>
              <CFormInput name="select_2" value={formData.select_2} onChange={handleFormChange} />
            </CCol>
            <CCol md={3}>
              <CFormLabel>Select 3</CFormLabel>
              <CFormInput name="select_3" value={formData.select_3} onChange={handleFormChange} />
            </CCol>
            <CCol md={3}>
              <CFormLabel>Select R</CFormLabel>
              <CFormInput name="select_r" value={formData.select_r} onChange={handleFormChange} />
            </CCol>
          </CRow>
          <CRow className="mb-3">
            <CCol md={6}>
              <CFormLabel>Catálogo</CFormLabel>
              <CFormSelect name="catalog" value={formData.catalog} onChange={handleFormChange}>
                {catalogOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </CFormSelect>
            </CCol>
            <CCol md={6}>
              <CFormLabel>Valor</CFormLabel>
              <CFormInput type="number" name="value" value={formData.value} onChange={handleFormChange} placeholder="0" />
            </CCol>
          </CRow>
          <CRow className="mb-3">
            <CCol md={3}>
              <CFormLabel>Crio embrio (1-20)</CFormLabel>
              <CFormInput type="number" name="crio" value={formData.crio} onChange={handleFormChange} min="1" max="20" />
            </CCol>
            <CCol md={3}>
              <CFormLabel>XX (1-20)</CFormLabel>
              <CFormInput type="number" name="xx" value={formData.xx} onChange={handleFormChange} min="1" max="20" />
            </CCol>
            <CCol md={3}>
              <CFormLabel>XY (1-20)</CFormLabel>
              <CFormInput type="number" name="xy" value={formData.xy} onChange={handleFormChange} min="1" max="20" />
            </CCol>
            <CCol md={3}>
              <CFormLabel>NI (1-20)</CFormLabel>
              <CFormInput type="number" name="ni" value={formData.ni} onChange={handleFormChange} min="1" max="20" />
            </CCol>
          </CRow>
          <CRow className="mb-3">
            <CCol md={4}>
              <CFormLabel>Tanque</CFormLabel>
              <CFormInput name="tank" value={formData.tank} onChange={handleFormChange} />
            </CCol>
            <CCol md={4}>
              <CFormLabel>Gestante</CFormLabel>
              <CFormInput name="pregnant" value={formData.pregnant} onChange={handleFormChange} />
            </CCol>
            <CCol md={4}>
              <CFormLabel>Parto</CFormLabel>
              <CFormInput name="birth" value={formData.birth} onChange={handleFormChange} />
            </CCol>
          </CRow>
          <CRow className="mb-3">
            <CCol md={3}>
              <CFormLabel>Clabe</CFormLabel>
              <CFormInput type="number" name="clabe" value={formData.clabe} onChange={handleFormChange} />
            </CCol>
            <CCol md={3}>
              <CFormLabel>Seguro</CFormLabel>
              <CFormInput name="assurance" value={formData.assurance} onChange={handleFormChange} />
            </CCol>
            <CCol md={3}>
              <CFormLabel>Póliza</CFormLabel>
              <CFormInput name="policy" value={formData.policy} onChange={handleFormChange} />
            </CCol>
            <CCol md={3}>
              <CFormLabel>Gestor</CFormLabel>
              <CFormInput name="manager" value={formData.manager} onChange={handleFormChange} />
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      <CCard className="mb-4 mx-5">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Resumen de caja</strong>
          <CFormSelect style={{ width: 'auto' }} value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="USD">USD (Dólares)</option>
            <option value="EUR">EUR (Euros)</option>
          </CFormSelect>
        </CCardHeader>
        <CCardBody>
          <CRow className="mb-3">
            <CCol md={6}>
              <CFormLabel>Tipo de cambio (MXN a {currency})</CFormLabel>
              <CFormInput type="number" step="0.01" value={exchangeRate} onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1)} placeholder={currency === 'USD' ? 'Ej: 20.5' : 'Ej: 22.3'} />
              <small className="text-muted">1 {currency} = {exchangeRate} MXN</small>
            </CCol>
          </CRow>
          <CRow>
            <CCol md={6}>
              <div className="p-3 bg-light rounded mb-3">
                <h6 className="text-muted mb-2">Valor del programa</h6>
                <h4 className="mb-0 text-primary">{formatProgramTotal()}</h4>
                <p className="mb-0 text-muted small">{formatMXN(calculateProgramTotalMXN())}</p>
                <small className="text-muted">Suma de todas las fases</small>
              </div>
            </CCol>
            <CCol md={6}>
              <div className="p-3 bg-light rounded mb-3">
                <h6 className="text-muted mb-2">Costo interno</h6>
                <h4 className="mb-0 text-danger">{formatMXN(calculateInternalCost())}</h4>
                <small className="text-muted">Suma de movimientos de salida</small>
              </div>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      <CCard className="mb-4 mx-5">
        <CCardHeader><strong>Fases del programa</strong></CCardHeader>
        <CCardBody>
          {phaseAlert.show && (
            <CAlert color={phaseAlert.type} dismissible onClose={() => setPhaseAlert({ show: false })} className="mb-3">
              {phaseAlert.message}
            </CAlert>
          )}
          <CRow className="mb-3">
            <CCol md={5}>
              <CFormInput placeholder="Nombre de la fase" value={newPhase.name} onChange={(e) => setNewPhase(prev => ({ ...prev, name: e.target.value }))} />
            </CCol>
            <CCol md={5}>
              <CInputGroup>
                <CInputGroupText>{getCurrencySymbol()}</CInputGroupText>
                <CFormInput type="number" placeholder={'Valor a pagar (' + currency + ')'} value={newPhase.value} onChange={(e) => setNewPhase(prev => ({ ...prev, value: e.target.value }))} />
                <CInputGroupText>{currency}</CInputGroupText>
              </CInputGroup>
            </CCol>
            <CCol md={2}>
              <CButton color="primary" onClick={addPhase} className="w-100">
                <CIcon icon={cilPlus} className="me-2" />
                Agregar
              </CButton>
            </CCol>
          </CRow>
          <div className="table-responsive">
            <CTable hover striped>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Fase</CTableHeaderCell>
                  <CTableHeaderCell>Valor</CTableHeaderCell>
                  <CTableHeaderCell>Pago 1</CTableHeaderCell>
                  <CTableHeaderCell>Pago 2</CTableHeaderCell>
                  <CTableHeaderCell>Pago 3</CTableHeaderCell>
                  <CTableHeaderCell>Estado</CTableHeaderCell>
                  <CTableHeaderCell>Diferencia</CTableHeaderCell>
                  <CTableHeaderCell>Notas</CTableHeaderCell>
                  <CTableHeaderCell>Acciones</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {phases.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={9} className="text-center py-4 text-muted">
                      No hay fases agregadas
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  phases.map((phase, index) => {
                    const diff = calculatePhaseDifference(phase);
                    return (
                      <CTableRow key={phase.id}>
                        <CTableDataCell><strong>{phase.name}</strong></CTableDataCell>
                        <CTableDataCell>{formatPhaseValue(phase.value)}</CTableDataCell>
                        <CTableDataCell>
                          <CFormInput type="number" size="sm" value={phase.payment1} onChange={(e) => updatePhase(index, 'payment1', e.target.value)} placeholder="0" />
                        </CTableDataCell>
                        <CTableDataCell>
                          <CFormInput type="number" size="sm" value={phase.payment2} onChange={(e) => updatePhase(index, 'payment2', e.target.value)} placeholder="0" />
                        </CTableDataCell>
                        <CTableDataCell>
                          <CFormInput type="number" size="sm" value={phase.payment3} onChange={(e) => updatePhase(index, 'payment3', e.target.value)} placeholder="0" />
                        </CTableDataCell>
                        <CTableDataCell>
                          <CButton color={phase.invoiced ? 'success' : 'secondary'} variant="outline" size="sm" onClick={() => updatePhase(index, 'invoiced', !phase.invoiced)}>
                            {phase.invoiced ? 'Facturado' : 'Sin facturar'}
                          </CButton>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={diff.color}>{diff.text}</CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CButton color="info" variant="ghost" size="sm" onClick={() => openNotesModal('phase', index, phase.notes)}>
                            <CIcon icon={cilNotes} />
                          </CButton>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CButton color="danger" variant="ghost" size="sm" onClick={() => deletePhase(index)}>
                            <CIcon icon={cilTrash} />
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    );
                  })
                )}
              </CTableBody>
            </CTable>
          </div>
        </CCardBody>
      </CCard>

      <CCard className="mb-4 mx-5">
        <CCardHeader><strong>Extrato de gastos</strong></CCardHeader>
        <CCardBody>
          {expenseAlert.show && (
            <CAlert color={expenseAlert.type} dismissible onClose={() => setExpenseAlert({ show: false })} className="mb-3">
              {expenseAlert.message}
            </CAlert>
          )}
          <CRow className="mb-3">
            <CCol md={2}>
              <CFormInput type="date" size="sm" value={newExpense.date} onChange={(e) => setNewExpense(prev => ({ ...prev, date: e.target.value }))} />
            </CCol>
            <CCol md={2}>
              <CFormSelect size="sm" value={newExpense.movement} onChange={(e) => setNewExpense(prev => ({ ...prev, movement: e.target.value }))}>
                <option value="entrada">Entrada</option>
                <option value="salida">Salida</option>
              </CFormSelect>
            </CCol>
            <CCol md={2}>
              <CFormSelect size="sm" value={newExpense.reason} onChange={(e) => setNewExpense(prev => ({ ...prev, reason: e.target.value }))}>
                {reasonOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </CFormSelect>
            </CCol>
            <CCol md={2}>
              <CFormInput size="sm" placeholder="Destino" value={newExpense.destination} onChange={(e) => setNewExpense(prev => ({ ...prev, destination: e.target.value }))} />
            </CCol>
            <CCol md={1}>
              <CFormInput size="sm" placeholder="Banco" value={newExpense.bank} onChange={(e) => setNewExpense(prev => ({ ...prev, bank: e.target.value }))} />
            </CCol>
            <CCol md={2}>
              <CFormInput type="number" size="sm" placeholder="Valor MXN" value={newExpense.value} onChange={(e) => setNewExpense(prev => ({ ...prev, value: e.target.value }))} />
            </CCol>
            <CCol md={1}>
              <CButton color="primary" size="sm" onClick={addExpense} className="w-100">
                <CIcon icon={cilPlus} />
              </CButton>
            </CCol>
          </CRow>
          <div className="table-responsive">
            <CTable hover striped>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Fecha</CTableHeaderCell>
                  <CTableHeaderCell>Movimiento</CTableHeaderCell>
                  <CTableHeaderCell>Motivo</CTableHeaderCell>
                  <CTableHeaderCell>Destino</CTableHeaderCell>
                  <CTableHeaderCell>Banco</CTableHeaderCell>
                  <CTableHeaderCell>Valor (MXN)</CTableHeaderCell>
                  <CTableHeaderCell>Notas</CTableHeaderCell>
                  <CTableHeaderCell>Acciones</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {expenses.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={8} className="text-center py-4 text-muted">
                      No hay gastos registrados
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  expenses.map((expense, index) => (
                    <CTableRow key={expense.id}>
                      <CTableDataCell>{new Date(expense.date).toLocaleDateString('es-MX')}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={expense.movement === 'entrada' ? 'success' : 'danger'}>
                          {expense.movement}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>{expense.reason}</CTableDataCell>
                      <CTableDataCell>{expense.destination || '-'}</CTableDataCell>
                      <CTableDataCell>{expense.bank || '-'}</CTableDataCell>
                      <CTableDataCell>{formatMXN(expense.value)}</CTableDataCell>
                      <CTableDataCell>
                        <CButton color="info" variant="ghost" size="sm" onClick={() => openNotesModal('expense', index, expense.notes)}>
                          <CIcon icon={cilNotes} />
                        </CButton>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CButton color="danger" variant="ghost" size="sm" onClick={() => deleteExpense(index)}>
                          <CIcon icon={cilTrash} />
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          </div>
          <CRow className="mt-3">
            <CCol md={6}>
              <div className="p-3 bg-light rounded">
                <strong>Total gastos de salida: </strong>
                <span className="text-danger">{formatMXN(calculateInternalCost())}</span>
              </div>
            </CCol>
            <CCol md={6}>
              <div className="p-3 bg-light rounded">
                <strong>Total costos de entrada: </strong>
                <span className="text-success">{formatMXN(calculateExpenseEntries())}</span>
              </div>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      <CModal visible={showNotesModal} onClose={() => setShowNotesModal(false)}>
        <CModalHeader>
          <CModalTitle>Notas</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CFormTextarea rows={5} value={currentNotes.text} onChange={(e) => setCurrentNotes(prev => ({ ...prev, text: e.target.value }))} placeholder="Escribe tus notas aquí..." />
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowNotesModal(false)}>Cancelar</CButton>
          <CButton color="primary" onClick={saveNotes}>
            <CIcon icon={cilSave} className="me-2" />
            Guardar
          </CButton>
        </CModalFooter>
      </CModal>
    </CContainer>
  );
};

export default ProgramForm;