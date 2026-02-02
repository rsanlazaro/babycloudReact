// src/views/pages/programs/RegisterForm.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  CSpinner,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilArrowLeft,
  cilSave,
  cilPlus,
  cilTrash,
  cilNotes,
  cilFile,
  cilWarning,
} from '@coreui/icons';
import api from '../../../services/api';

const RegisterForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    ip_name: '',
    couple_name: '',
    country: '',
    contract_date: '',
    deposit_1: 'Kiromedic',
    deposit_2: 'Kiromedic',
    donor_select: '',
    select_2: '',
    select_3: '',
    select_r: '',
    catalog: 'Kiromedic',
    catalog_value: '',
    crio_embryo: 1,
    xx_count: 1,
    xy_count: 1,
    ni_count: 1,
    tank: '',
    surrogate: '',
    birth_info: '',
    clabe: '',
    insurance: '',
    policy: '',
    manager: '',
    status: 'active',
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
    origin: '',
    destination: '',
    bank: '',
    value: '',
    notes: '',
    currency: 'MXN'
  });

  const [showNotesModal, setShowNotesModal] = useState(false);
  const [currentNotes, setCurrentNotes] = useState({ type: '', index: null, text: '' });
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [phaseAlert, setPhaseAlert] = useState({ show: false, type: '', message: '' });
  const [expenseAlert, setExpenseAlert] = useState({ show: false, type: '', message: '' });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ type: '', index: null, name: '' });

  const syncInProgress = useRef(new Set());

  const depositOptions = ['Kiromedic', 'Care', 'Citmer', 'Umare', 'Eligen', 'Plenus'];
  const invoiceOptions = ['Babymedic', 'Nexatravel', 'Travelmedicalcare'];
  const catalogOptions = ['Kiromedic', 'Ovodonors', 'Nora', 'Eggdonors'];
  const reasonOptions = ['Poder notarial', 'Depósito semen', 'COM. VENTA', 'FIV', 'Captura OVO', 'Factura IP'];
  const statusOptions = [
    { value: 'active', label: 'Activo' },
    { value: 'completed', label: 'Completado' },
    { value: 'cancelled', label: 'Cancelado' },
    { value: 'pending', label: 'Pendiente' },
  ];

  const getBankOptions = (invoiceType) => {
    const bankMap = {
      'Babymedic': ['Santander', 'BBVA', 'Banorte', 'HSBC'],
      'Nexatravel': ['Scotiabank', 'Citibanamex', 'Inbursa', 'Azteca'],
      'Travelmedicalcare': ['BanRegio', 'Afirme', 'Bajío', 'Invex']
    };
    return bankMap[invoiceType] || ['Santander', 'BBVA', 'Banorte', 'HSBC'];
  };

  // Fetch program data if editing
  useEffect(() => {
    if (isEditMode) {
      fetchProgram();
    }
  }, [id]);

  const fetchProgram = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/programs/${id}`, { withCredentials: true });
      const program = response.data;

      setFormData({
        ip_name: program.ip_name || '',
        couple_name: program.couple_name || '',
        country: program.country || '',
        contract_date: program.contract_date ? program.contract_date.split('T')[0] : '',
        deposit_1: program.deposit_1 || 'Kiromedic',
        deposit_2: program.deposit_2 || 'Kiromedic',
        donor_select: program.donor_select || '',
        select_2: program.select_2 || '',
        select_3: program.select_3 || '',
        select_r: program.select_r || '',
        catalog: program.catalog || 'Kiromedic',
        catalog_value: program.catalog_value || '',
        crio_embryo: program.crio_embryo || 1,
        xx_count: program.xx_count || 1,
        xy_count: program.xy_count || 1,
        ni_count: program.ni_count || 1,
        tank: program.tank || '',
        surrogate: program.surrogate || '',
        birth_info: program.birth_info || '',
        clabe: program.clabe || '',
        insurance: program.insurance || '',
        policy: program.policy || '',
        manager: program.manager || '',
        status: program.status || 'active',
      });

      setCurrency(program.currency || 'USD');
      setExchangeRate(program.exchange_rate || 20.5);

      // Map phases from API
      if (program.phases && program.phases.length > 0) {
        setPhases(program.phases.map(phase => ({
          id: phase.id,
          name: phase.phase_name,
          value: parseFloat(phase.phase_value) || 0,
          payment1: phase.payment_1_amount || '',
          payment1Date: phase.payment_1_date ? phase.payment_1_date.split('T')[0] : '',
          payment2: phase.payment_2_amount || '',
          payment2Date: phase.payment_2_date ? phase.payment_2_date.split('T')[0] : '',
          payment3: phase.payment_3_amount || '',
          payment3Date: phase.payment_3_date ? phase.payment_3_date.split('T')[0] : '',
          invoiced: phase.invoiced_to || '',
          notes: phase.notes || '',
          payment1ExpenseId: null,
          payment2ExpenseId: null,
          payment3ExpenseId: null,
          dbId: phase.id
        })));
      }

      // Map expenses from API
      if (program.expenses && program.expenses.length > 0) {
        setExpenses(program.expenses.map(expense => ({
          id: expense.id,
          date: expense.expense_date ? expense.expense_date.split('T')[0] : '',
          movement: expense.movement_type,
          reason: expense.reason,
          origin: expense.origin || '',
          destination: expense.destination || '',
          bank: expense.bank || '',
          value: parseFloat(expense.amount) || 0,
          currency: expense.currency || 'MXN',
          notes: expense.notes || '',
          isAutoGenerated: expense.is_auto_generated || false,
          phaseId: expense.phase_id,
          paymentNumber: expense.payment_number,
          dbId: expense.id
        })));
      }

    } catch (err) {
      console.error('Error fetching program:', err);
      setAlert({ show: true, type: 'danger', message: 'Error al cargar el programa' });
    } finally {
      setLoading(false);
    }
  };

  const navigateBack = () => {
    navigate('/registers');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMovementChange = (value) => {
    setNewExpense(prev => ({
      ...prev,
      movement: value,
      currency: value === 'entrada' ? currency : 'MXN'
    }));
  };

  const calculateProgramTotal = () => {
    return phases.reduce((sum, phase) => sum + (parseFloat(phase.value) || 0), 0);
  };

  const calculateInternalCost = () => {
    return expenses
      .filter(exp => exp.movement === 'salida' && exp.currency === 'MXN')
      .reduce((sum, exp) => sum + (parseFloat(exp.value) || 0), 0);
  };

  const calculateExpenseEntries = () => {
    return expenses
      .filter(exp => exp.movement === 'entrada')
      .reduce((sum, exp) => sum + (parseFloat(exp.value) || 0), 0);
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
      payment1Date: '',
      payment2: '',
      payment2Date: '',
      payment3: '',
      payment3Date: '',
      invoiced: '',
      notes: '',
      payment1ExpenseId: null,
      payment2ExpenseId: null,
      payment3ExpenseId: null,
      isNew: true
    }]);
    setNewPhase({ name: '', value: '' });
    setPhaseAlert({ show: false, type: '', message: '' });
  };

  const syncPaymentToExpense = (phaseId, paymentNumber, paymentValue, paymentDate, expenseId, phaseName, invoiced) => {
    const syncKey = `${phaseId}-${paymentNumber}`;
    
    if (syncInProgress.current.has(syncKey)) {
      return;
    }
    
    syncInProgress.current.add(syncKey);

    const value = parseFloat(paymentValue) || 0;

    if (value > 0) {
      const bankOptions = getBankOptions(invoiced);
      const destination = invoiced ? `Caja ${invoiced}` : 'Caja';
      
      const expenseData = {
        date: paymentDate || new Date().toISOString().split('T')[0],
        movement: 'entrada',
        reason: phaseName,
        origin: `Pago ${paymentNumber}`,
        destination: destination,
        bank: bankOptions[0],
        value: value,
        currency: currency,
        notes: '',
        isAutoGenerated: true,
        phaseId: phaseId,
        paymentNumber: paymentNumber
      };

      if (expenseId) {
        setExpenses(prev => prev.map(exp => 
          exp.id === expenseId ? { ...exp, ...expenseData } : exp
        ));
        syncInProgress.current.delete(syncKey);
      } else {
        const newExpenseId = `${phaseId}-pay${paymentNumber}-${Date.now()}`;
        setExpenses(prev => {
          const existingExpense = prev.find(
            exp => exp.isAutoGenerated && exp.phaseId === phaseId && exp.paymentNumber === paymentNumber
          );
          if (existingExpense) {
            syncInProgress.current.delete(syncKey);
            return prev;
          }
          return [...prev, { id: newExpenseId, ...expenseData }];
        });
        
        setPhases(prev => prev.map(p => 
          p.id === phaseId 
            ? { ...p, [`payment${paymentNumber}ExpenseId`]: newExpenseId }
            : p
        ));
        
        syncInProgress.current.delete(syncKey);
      }
    } else if (expenseId && value === 0) {
      setExpenses(prev => prev.filter(exp => exp.id !== expenseId));
      setPhases(prev => prev.map(p => 
        p.id === phaseId 
          ? { ...p, [`payment${paymentNumber}ExpenseId`]: null }
          : p
      ));
      syncInProgress.current.delete(syncKey);
    } else {
      syncInProgress.current.delete(syncKey);
    }
  };

  const updatePhase = (index, field, value) => {
    setPhases(prev => {
      const updated = prev.map((phase, i) => {
        if (i !== index) return phase;
        
        const updatedPhase = { ...phase, [field]: value };
        
        if (field.startsWith('payment') && !field.includes('ExpenseId')) {
          const paymentNumber = field.includes('1') ? 1 : 
                               field.includes('2') ? 2 : 3;
          
          const paymentValueField = `payment${paymentNumber}`;
          const paymentDateField = `payment${paymentNumber}Date`;
          const expenseIdField = `payment${paymentNumber}ExpenseId`;
          
          const paymentValue = field === paymentValueField ? value : updatedPhase[paymentValueField];
          const paymentDate = field === paymentDateField ? value : updatedPhase[paymentDateField];
          
          setTimeout(() => {
            syncPaymentToExpense(
              updatedPhase.id,
              paymentNumber,
              paymentValue,
              paymentDate,
              updatedPhase[expenseIdField],
              updatedPhase.name,
              updatedPhase.invoiced
            );
          }, 50);
        }
        
        if (field === 'invoiced') {
          setTimeout(() => {
            [1, 2, 3].forEach(num => {
              if (updatedPhase[`payment${num}ExpenseId`]) {
                syncPaymentToExpense(
                  updatedPhase.id,
                  num,
                  updatedPhase[`payment${num}`],
                  updatedPhase[`payment${num}Date`],
                  updatedPhase[`payment${num}ExpenseId`],
                  updatedPhase.name,
                  value
                );
              }
            });
          }, 50);
        }
        
        return updatedPhase;
      });
      
      return updated;
    });
  };

  const confirmDeletePhase = (index) => {
    const phase = phases[index];
    setDeleteTarget({ type: 'phase', index, name: phase.name });
    setShowDeleteModal(true);
  };

  const deletePhase = (index) => {
    const phase = phases[index];
    
    const expenseIdsToRemove = [
      phase.payment1ExpenseId,
      phase.payment2ExpenseId,
      phase.payment3ExpenseId
    ].filter(id => id !== null);
    
    setExpenses(prev => prev.filter(exp => !expenseIdsToRemove.includes(exp.id)));
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
    setExpenses(prev => [...prev, { 
      id: Date.now(), 
      ...newExpense, 
      value: parseFloat(newExpense.value),
      isAutoGenerated: false,
      isNew: true
    }]);
    setNewExpense({ 
      date: '', 
      movement: 'salida', 
      reason: 'Poder notarial', 
      origin: '', 
      destination: '', 
      bank: '', 
      value: '', 
      notes: '',
      currency: 'MXN'
    });
    setExpenseAlert({ show: false, type: '', message: '' });
  };

  const confirmDeleteExpense = (index) => {
    const expense = expenses[index];
    
    if (expense.isAutoGenerated) {
      setExpenseAlert({ 
        show: true, 
        type: 'warning', 
        message: 'Este gasto es generado automáticamente desde una fase. Modifica o elimina el pago en la fase correspondiente.' 
      });
      setTimeout(() => setExpenseAlert({ show: false, type: '', message: '' }), 5000);
      return;
    }
    
    setDeleteTarget({ type: 'expense', index, name: expense.reason });
    setShowDeleteModal(true);
  };

  const deleteExpense = (index) => {
    setExpenses(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirmDelete = () => {
    if (deleteTarget.type === 'phase') {
      deletePhase(deleteTarget.index);
    } else if (deleteTarget.type === 'expense') {
      deleteExpense(deleteTarget.index);
    }
    setShowDeleteModal(false);
    setDeleteTarget({ type: '', index: null, name: '' });
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

  const saveProgram = async () => {
    // Validation
    if (!formData.ip_name || !formData.country || !formData.contract_date) {
      setAlert({ show: true, type: 'danger', message: 'Completa los campos obligatorios: Nombre IP, País y Fecha' });
      return;
    }

    setSaving(true);

    // Prepare data for API
    const programData = {
      ...formData,
      currency,
      exchange_rate: exchangeRate,
      phases: phases.map((phase, index) => ({
        id: phase.dbId || null,
        phase_name: phase.name,
        phase_value: phase.value,
        payment_1_amount: phase.payment1 || null,
        payment_1_date: phase.payment1Date || null,
        payment_2_amount: phase.payment2 || null,
        payment_2_date: phase.payment2Date || null,
        payment_3_amount: phase.payment3 || null,
        payment_3_date: phase.payment3Date || null,
        invoiced_to: phase.invoiced || null,
        notes: phase.notes || null,
        sort_order: index
      })),
      expenses: expenses.map(expense => ({
        id: expense.dbId || null,
        expense_date: expense.date,
        movement_type: expense.movement,
        reason: expense.reason,
        origin: expense.origin || null,
        destination: expense.destination || null,
        bank: expense.bank || null,
        amount: expense.value,
        currency: expense.currency,
        notes: expense.notes || null,
        is_auto_generated: expense.isAutoGenerated || false,
        phase_id: expense.phaseId || null,
        payment_number: expense.paymentNumber || null
      }))
    };

    try {
      if (isEditMode) {
        await api.put(`/api/programs/${id}`, programData, { withCredentials: true });
        setAlert({ show: true, type: 'success', message: 'Programa actualizado correctamente' });
      } else {
        await api.post('/api/programs', programData, { withCredentials: true });
        setAlert({ show: true, type: 'success', message: 'Programa creado correctamente' });
      }
      setTimeout(() => navigateBack(), 1500);
    } catch (err) {
      console.error('Error saving program:', err);
      const message = err.response?.data?.message || 'Error al guardar el programa';
      setAlert({ show: true, type: 'danger', message });
    } finally {
      setSaving(false);
    }
  };

  const formatMXN = (value) => {
    if (!value && value !== 0) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MXN' }).format(value);
  };

  const formatCurrency = (value, currencyCode) => {
    if (!value && value !== 0) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(value);
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

  const formatEntriesTotal = () => {
    const total = calculateExpenseEntries();
    const symbol = getCurrencySymbol();
    const formatted = total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return symbol + formatted + ' ' + currency;
  };

  const getBillingUrl = (invoiceType) => {
    if (!invoiceType) return null;
    const baseUrl = '/progestor/admin/bills/';
    return baseUrl + invoiceType.toLowerCase();
  };

  useEffect(() => {
    if (newExpense.movement === 'entrada') {
      setNewExpense(prev => ({ ...prev, currency: currency }));
    }
  }, [currency]);

  if (loading) {
    return (
      <CContainer className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <CSpinner color="primary" />
      </CContainer>
    );
  }

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
            Volver a Registros
          </CButton>
          <CButton color="primary" className="app-button" onClick={saveProgram} disabled={saving}>
            {saving ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Guardando...
              </>
            ) : (
              <>
                <CIcon icon={cilSave} className="me-2" />
                {isEditMode ? 'Actualizar programa' : 'Guardar programa'}
              </>
            )}
          </CButton>
        </CCol>
      </CRow>

      <CCard className="mb-4 mx-5">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>{isEditMode ? 'Editar programa' : 'Nuevo programa'}</strong>
          <CFormSelect 
            style={{ width: 'auto' }} 
            name="status" 
            value={formData.status} 
            onChange={handleFormChange}
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </CFormSelect>
        </CCardHeader>
        <CCardBody className="p-0">
          {/* Section 1 */}
          <div className="p-4" style={{ backgroundColor: '#f8f9fa', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>Nombre IP *</CFormLabel>
                <CFormInput name="ip_name" value={formData.ip_name} onChange={handleFormChange} placeholder="Nombre del IP" />
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
                <CFormInput type="date" name="contract_date" value={formData.contract_date} onChange={handleFormChange} />
              </CCol>
            </CRow>
            <CRow>
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
          </div>

          {/* Section 2 */}
          <div className="p-4">
            <CRow className="mb-3">
              <CCol md={3}>
                <CFormLabel>Donante Select</CFormLabel>
                <CFormInput name="donor_select" value={formData.donor_select} onChange={handleFormChange} />
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
                <CFormInput type="number" name="catalog_value" value={formData.catalog_value} onChange={handleFormChange} placeholder="0" />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={3}>
                <CFormLabel>Crio embrio (1-20)</CFormLabel>
                <CFormInput type="number" name="crio_embryo" value={formData.crio_embryo} onChange={handleFormChange} min="1" max="20" />
              </CCol>
              <CCol md={3}>
                <CFormLabel>XX (1-20)</CFormLabel>
                <CFormInput type="number" name="xx_count" value={formData.xx_count} onChange={handleFormChange} min="1" max="20" />
              </CCol>
              <CCol md={3}>
                <CFormLabel>XY (1-20)</CFormLabel>
                <CFormInput type="number" name="xy_count" value={formData.xy_count} onChange={handleFormChange} min="1" max="20" />
              </CCol>
              <CCol md={3}>
                <CFormLabel>NI (1-20)</CFormLabel>
                <CFormInput type="number" name="ni_count" value={formData.ni_count} onChange={handleFormChange} min="1" max="20" />
              </CCol>
            </CRow>
            <CRow>
              <CCol md={12}>
                <CFormLabel>Tanque</CFormLabel>
                <CFormInput name="tank" value={formData.tank} onChange={handleFormChange} />
              </CCol>
            </CRow>
          </div>

          {/* Section 3 */}
          <div className="p-4" style={{ backgroundColor: '#f8f9fa', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <CRow className="mb-3">
              <CCol md={4}>
                <CFormLabel>Gestante</CFormLabel>
                <CFormInput name="surrogate" value={formData.surrogate} onChange={handleFormChange} />
              </CCol>
              <CCol md={4}>
                <CFormLabel>Parto</CFormLabel>
                <CFormInput name="birth_info" value={formData.birth_info} onChange={handleFormChange} />
              </CCol>
              <CCol md={4}>
                <CFormLabel>Clabe</CFormLabel>
                <CFormInput name="clabe" value={formData.clabe} onChange={handleFormChange} />
              </CCol>
            </CRow>
            <CRow>
              <CCol md={4}>
                <CFormLabel>Seguro</CFormLabel>
                <CFormInput name="insurance" value={formData.insurance} onChange={handleFormChange} />
              </CCol>
              <CCol md={4}>
                <CFormLabel>Póliza</CFormLabel>
                <CFormInput name="policy" value={formData.policy} onChange={handleFormChange} />
              </CCol>
              <CCol md={4}>
                <CFormLabel>Gestor</CFormLabel>
                <CFormInput name="manager" value={formData.manager} onChange={handleFormChange} />
              </CCol>
            </CRow>
          </div>
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
          <CRow>
            <CCol md={6}>
              <div className="p-3 bg-light rounded mb-3">
                <h6 className="text-muted mb-2">Valor del programa</h6>
                <h4 className="mb-0 text-primary">{formatProgramTotal()}</h4>
                <small className="text-muted">Suma de todas las fases</small>
              </div>
            </CCol>
            <CCol md={6}>
              <div className="p-3 bg-light rounded mb-3">
                <h6 className="text-muted mb-2">Costo interno</h6>
                <h4 className="mb-0 text-danger">{formatMXN(calculateInternalCost())}</h4>
                <small className="text-muted">Suma de movimientos de salida (MXN)</small>
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
                  <CTableHeaderCell style={{ width: '100px' }}>Pago 1</CTableHeaderCell>
                  <CTableHeaderCell style={{ width: '100px' }}>Pago 2</CTableHeaderCell>
                  <CTableHeaderCell style={{ width: '100px' }}>Pago 3</CTableHeaderCell>
                  <CTableHeaderCell>Facturar a</CTableHeaderCell>
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
                          <div className="d-flex gap-1">
                            <CFormInput type="number" style={{width: '80px'}} value={phase.payment1} onChange={(e) => updatePhase(index, 'payment1', e.target.value)} placeholder="0" />
                            <CFormInput type="date" style={{width: '140px'}} value={phase.payment1Date} onChange={(e) => updatePhase(index, 'payment1Date', e.target.value)} />
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <div className="d-flex gap-1">
                            <CFormInput type="number" style={{width: '80px'}} value={phase.payment2} onChange={(e) => updatePhase(index, 'payment2', e.target.value)} placeholder="0" />
                            <CFormInput type="date" style={{width: '140px'}} value={phase.payment2Date} onChange={(e) => updatePhase(index, 'payment2Date', e.target.value)} />
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <div className="d-flex gap-1">
                            <CFormInput type="number" style={{width: '80px'}} value={phase.payment3} onChange={(e) => updatePhase(index, 'payment3', e.target.value)} placeholder="0" />
                            <CFormInput type="date" style={{width: '140px'}} value={phase.payment3Date} onChange={(e) => updatePhase(index, 'payment3Date', e.target.value)} />
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CFormSelect style={{width: '120px'}} value={phase.invoiced} onChange={(e) => updatePhase(index, 'invoiced', e.target.value)}>
                            <option value="">Sin facturar</option>
                            {invoiceOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </CFormSelect>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={diff.color}>{diff.text}</CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CButton color="info" variant="ghost" size="sm" onClick={() => openNotesModal('phase', index, phase.notes)} className="me-1">
                            <CIcon icon={cilNotes} />
                          </CButton>
                        </CTableDataCell>
                        <CTableDataCell>
                          {phase.invoiced && (
                            <CButton
                              color="primary"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const url = getBillingUrl(phase.invoiced);
                                if (url) window.open(url, '_blank');
                              }}
                              className="me-1"
                              title="Ver factura"
                            >
                              <CIcon icon={cilFile} />
                            </CButton>
                          )}
                          <CButton color="danger" variant="ghost" size="sm" onClick={() => confirmDeletePhase(index)}>
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
            <CCol md={1}>
              <CFormSelect size="sm" value={newExpense.movement} onChange={(e) => handleMovementChange(e.target.value)}>
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
              <CFormInput size="sm" placeholder="Origen" value={newExpense.origin} onChange={(e) => setNewExpense(prev => ({ ...prev, origin: e.target.value }))} />
            </CCol>
            <CCol md={1}>
              <CFormInput size="sm" placeholder="Destino" value={newExpense.destination} onChange={(e) => setNewExpense(prev => ({ ...prev, destination: e.target.value }))} />
            </CCol>
            <CCol md={1}>
              <CFormInput size="sm" placeholder="Banco" value={newExpense.bank} onChange={(e) => setNewExpense(prev => ({ ...prev, bank: e.target.value }))} />
            </CCol>
            <CCol md={2}>
              <CFormInput 
                type="number" 
                size="sm" 
                placeholder={newExpense.movement === 'entrada' ? `Valor (${currency})` : 'Valor (MXN)'} 
                value={newExpense.value} 
                onChange={(e) => setNewExpense(prev => ({ ...prev, value: e.target.value }))} 
              />
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
                  <CTableHeaderCell>Origen</CTableHeaderCell>
                  <CTableHeaderCell>Destino</CTableHeaderCell>
                  <CTableHeaderCell>Banco</CTableHeaderCell>
                  <CTableHeaderCell>Valor</CTableHeaderCell>
                  <CTableHeaderCell>Notas</CTableHeaderCell>
                  <CTableHeaderCell>Acciones</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {expenses.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={9} className="text-center py-4 text-muted">
                      No hay gastos registrados
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  expenses.map((expense, index) => (
                    <CTableRow key={expense.id} style={expense.isAutoGenerated ? { backgroundColor: '#e7f3ff' } : {}}>
                      <CTableDataCell>
                        {new Date(expense.date).toLocaleDateString('es-MX')}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={expense.movement === 'entrada' ? 'success' : 'danger'}>
                          {expense.movement}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>{expense.reason}</CTableDataCell>
                      <CTableDataCell>{expense.origin || '-'}</CTableDataCell>
                      <CTableDataCell>{expense.destination || '-'}</CTableDataCell>
                      <CTableDataCell>{expense.bank || '-'}</CTableDataCell>
                      <CTableDataCell>
                        {formatCurrency(expense.value, expense.currency || 'MXN')}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CButton color="info" variant="ghost" size="sm" onClick={() => openNotesModal('expense', index, expense.notes)}>
                          <CIcon icon={cilNotes} />
                        </CButton>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CButton 
                          color="danger" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => confirmDeleteExpense(index)}
                          disabled={expense.isAutoGenerated}
                          title={expense.isAutoGenerated ? 'Gasto generado automáticamente' : 'Eliminar gasto'}
                        >
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
                <span className="text-success">{formatEntriesTotal()}</span>
              </div>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Notes Modal */}
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

      {/* Delete Confirmation Modal */}
      <CModal visible={showDeleteModal} onClose={() => setShowDeleteModal(false)} alignment="center">
        <CModalHeader>
          <CModalTitle className="d-flex align-items-center">
            <CIcon icon={cilWarning} className="text-danger me-2" size="lg" />
            Confirmar eliminación
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p className="mb-0">
            ¿Estás seguro de que deseas eliminar {deleteTarget.type === 'phase' ? 'la fase' : 'el gasto'}{' '}
            <strong>"{deleteTarget.name}"</strong>?
          </p>
          {deleteTarget.type === 'phase' && (
            <p className="text-muted mt-2 mb-0">
              <small>Esta acción también eliminará los gastos de entrada asociados a esta fase.</small>
            </p>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </CButton>
          <CButton color="danger" onClick={handleConfirmDelete}>
            <CIcon icon={cilTrash} className="me-2" />
            Eliminar
          </CButton>
        </CModalFooter>
      </CModal>
    </CContainer>
  );
};

export default RegisterForm;