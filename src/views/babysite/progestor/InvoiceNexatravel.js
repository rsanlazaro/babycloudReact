import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CRow,
  CButton,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CAlert,
  CSpinner,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CInputGroup,
  CInputGroupText,
  CBadge,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilArrowLeft,
  cilFile,
  cilTrash,
  cilCloudDownload,
  cilMagnifyingGlass,
  cilDollar,
  cilEuro,
  cilLockLocked,
  cilBan,
} from '@coreui/icons';
import { jsPDF } from 'jspdf';

// Import template images for Dollar and Euro versions
import TemplateDollar from './src/assets/invoice/Nexatravel_dollar.jpg';
import TemplateEuro from './src/assets/invoice/Nexatravel_euro.jpg';

import usePermissions from '../../../hooks/usePermissions';

const InvoiceNexatravel = () => {
  const navigate = useNavigate();
  const { reports } = usePermissions();

  // Permission checks
  const canView = reports.invoiceNexa.visible;
  const canEdit = reports.invoiceNexa.editable;

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  // PDF Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    currency: 'dollar', // 'dollar' or 'euro'
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    balanceDue: '',
    billTo: '',
    country: '',
    // Product 1
    product1Description: '',
    product1Quantity: '',
    product1Price: '',
    product1Total: '',
    // Product 2
    product2Description: '',
    product2Quantity: '',
    product2Price: '',
    product2Total: '',
    // Product 3
    product3Description: '',
    product3Quantity: '',
    product3Price: '',
    product3Total: '',
    // Product 4
    product4Description: '',
    product4Quantity: '',
    product4Price: '',
    product4Total: '',
    // Totals
    subtotal: '',
    tax: '0',
    total: '',
  });

  // Redirect if no view permission
  useEffect(() => {
    if (!canView) {
      navigate('/progestor/admin/bills');
    }
  }, [canView, navigate]);

  const showNotification = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

  // Calculate product totals and subtotal/total
  useEffect(() => {
    // Calculate each product total
    const product1Total = (parseFloat(formData.product1Quantity) || 0) * (parseFloat(formData.product1Price) || 0);
    const product2Total = (parseFloat(formData.product2Quantity) || 0) * (parseFloat(formData.product2Price) || 0);
    const product3Total = (parseFloat(formData.product3Quantity) || 0) * (parseFloat(formData.product3Price) || 0);
    const product4Total = (parseFloat(formData.product4Quantity) || 0) * (parseFloat(formData.product4Price) || 0);

    // Calculate subtotal
    const subtotal = product1Total + product2Total + product3Total + product4Total;

    // Calculate total with tax
    const taxPercent = parseFloat(formData.tax) || 0;
    const total = subtotal + (subtotal * taxPercent / 100);

    setFormData((prev) => ({
      ...prev,
      product1Total: product1Total > 0 ? product1Total.toFixed(2) : '',
      product2Total: product2Total > 0 ? product2Total.toFixed(2) : '',
      product3Total: product3Total > 0 ? product3Total.toFixed(2) : '',
      product4Total: product4Total > 0 ? product4Total.toFixed(2) : '',
      subtotal: subtotal > 0 ? subtotal.toFixed(2) : '',
      total: total > 0 ? total.toFixed(2) : '',
      balanceDue: total > 0 ? total.toFixed(2) : '',
    }));
  }, [
    formData.product1Quantity, formData.product1Price,
    formData.product2Quantity, formData.product2Price,
    formData.product3Quantity, formData.product3Price,
    formData.product4Quantity, formData.product4Price,
    formData.tax,
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClear = () => {
    setFormData({
      currency: 'dollar',
      invoiceNumber: '',
      date: new Date().toISOString().split('T')[0],
      balanceDue: '',
      billTo: '',
      country: '',
      product1Description: '',
      product1Quantity: '',
      product1Price: '',
      product1Total: '',
      product2Description: '',
      product2Quantity: '',
      product2Price: '',
      product2Total: '',
      product3Description: '',
      product3Quantity: '',
      product3Price: '',
      product3Total: '',
      product4Description: '',
      product4Quantity: '',
      product4Price: '',
      product4Total: '',
      subtotal: '',
      tax: '0',
      total: '',
    });
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    const symbol = formData.currency === 'dollar' ? '$' : '€';
    return `${symbol} ${parseFloat(value).toFixed(2)}`;
  };

  // Convert image URL to base64 for PDF
  const getImageAsBase64 = (imgSrc) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/jpeg', 0.95);
        resolve(dataURL);
      };
      img.onerror = reject;
      img.src = imgSrc;
    });
  };

  const generatePDF = async (action = 'preview') => {
    if (!canEdit) {
      showNotification('warning', 'No tienes permiso para generar PDFs');
      return;
    }

    if (!formData.invoiceNumber || !formData.billTo) {
      showNotification('danger', 'Por favor complete los campos obligatorios (Número de Factura y Facturar a)');
      return;
    }

    setLoading(true);

    try {
      // Create PDF - Letter size portrait
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Select template based on currency
      const template = formData.currency === 'dollar' ? TemplateDollar : TemplateEuro;

      // Add template image as background
      try {
        const templateBase64 = await getImageAsBase64(template);
        doc.addImage(templateBase64, 'JPEG', 0, 0, pageWidth, pageHeight);
      } catch (e) {
        console.error('Could not load template:', e);
        showNotification('danger', 'Error al cargar la plantilla de factura');
        setLoading(false);
        return;
      }

      // Currency symbol
      const currencySymbol = formData.currency === 'dollar' ? '$' : '€';

      // Set text color to match the template (dark blue)
      const blueColor = [0, 70, 127];
      doc.setTextColor(...blueColor);

      // ========== HEADER SECTION ==========

      // Invoice Number (FACTURE #) - top right
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text(formData.invoiceNumber, 193, 21, { align: 'left' });

      // Date - below invoice number area (approximate position)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(15);
      doc.text(formatDate(formData.date), 196, 38, { align: 'right' });

      // ========== BILL TO SECTION ==========

      // Facturer à (Bill to) - left side
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(13);
      doc.text(formData.billTo, 15, 63);

      // Country
      if (formData.country) {
        doc.text(formData.country, 15, 70);
      }

      // ========== BALANCE DUE SECTION ==========

      // Solde DÛ - right side
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      const balanceText = formData.balanceDue ? `${currencySymbol} ${formData.balanceDue}` : '';
      doc.text(balanceText, 196, 70, { align: 'right' });

      // ========== PRODUCTS TABLE ==========

      // Table row positions (adjust based on template)
      const tableStartY = 97;
      const rowHeight = 14;
      const descriptionX = 15;
      const quantityX = 106;
      const priceX = 150;
      const totalX = 195;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);

      // Product 1
      if (formData.product1Description) {
        const y = tableStartY;
        doc.text(formData.product1Description, descriptionX, y);
        doc.text(formData.product1Quantity || '', quantityX, y, { align: 'center' });
        doc.text(formData.product1Price ? `${currencySymbol} ${formData.product1Price}` : '', priceX, y, { align: 'center' });
        doc.text(formData.product1Total ? `${currencySymbol} ${formData.product1Total}` : '', totalX, y, { align: 'right' });
      }

      // Product 2
      if (formData.product2Description) {
        const y = tableStartY + rowHeight;
        doc.text(formData.product2Description, descriptionX, y);
        doc.text(formData.product2Quantity || '', quantityX, y, { align: 'center' });
        doc.text(formData.product2Price ? `${currencySymbol} ${formData.product2Price}` : '', priceX, y, { align: 'center' });
        doc.text(formData.product2Total ? `${currencySymbol} ${formData.product2Total}` : '', totalX, y, { align: 'right' });
      }

      // Product 3
      if (formData.product3Description) {
        const y = tableStartY + rowHeight * 2 + 1;
        doc.text(formData.product3Description, descriptionX, y);
        doc.text(formData.product3Quantity || '', quantityX, y, { align: 'center' });
        doc.text(formData.product3Price ? `${currencySymbol} ${formData.product3Price}` : '', priceX, y, { align: 'center' });
        doc.text(formData.product3Total ? `${currencySymbol} ${formData.product3Total}` : '', totalX, y, { align: 'right' });
      }

      // Product 4
      if (formData.product4Description) {
        const y = tableStartY + rowHeight * 3 + 2;
        doc.text(formData.product4Description, descriptionX, y);
        doc.text(formData.product4Quantity || '', quantityX, y, { align: 'center' });
        doc.text(formData.product4Price ? `${currencySymbol} ${formData.product4Price}` : '', priceX, y, { align: 'center' });
        doc.text(formData.product4Total ? `${currencySymbol} ${formData.product4Total}` : '', totalX, y, { align: 'right' });
      }

      // ========== TOTALS SECTION ==========

      const totalsX = 195;
      const subtotalY = 155;
      const taxY = 166;
      const totalY = 177;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...blueColor);

      // Subtotal
      if (formData.subtotal) {
        doc.text(`${currencySymbol} ${formData.subtotal}`, totalsX, subtotalY, { align: 'right' });
      }

      // Tax
      doc.text(`${formData.tax || '0'}%`, totalsX + 3, taxY, { align: 'right' });

      // Total
      if (formData.total) {
        doc.text(`${currencySymbol} ${formData.total}`, totalsX, totalY, { align: 'right' });
      }

      // Generate filename
      const invoiceNum = formData.invoiceNumber || 'factura';
      const currencyLabel = formData.currency === 'dollar' ? 'USD' : 'EUR';

      if (action === 'preview') {
        const pdfBlob = doc.output('blob');
        const blobUrl = URL.createObjectURL(pdfBlob);
        setPdfBlobUrl(blobUrl);
        setShowPreview(true);
      } else if (action === 'download') {
        const fileName = `Factura_Nexatravel_${invoiceNum}_${currencyLabel}.pdf`;
        doc.save(fileName);
        showNotification('success', 'PDF generado exitosamente');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      showNotification('danger', 'Error al generar el PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFromPreview = () => {
    if (pdfBlobUrl) {
      const link = document.createElement('a');
      link.href = pdfBlobUrl;
      const invoiceNum = formData.invoiceNumber || 'factura';
      const currencyLabel = formData.currency === 'dollar' ? 'USD' : 'EUR';
      link.download = `Factura_Nexatravel_${invoiceNum}_${currencyLabel}.pdf`;
      link.click();
      showNotification('success', 'PDF descargado exitosamente');
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
  };

  // Get currency symbol for display
  const getCurrencySymbol = () => (formData.currency === 'dollar' ? '$' : '€');

  // Access denied view
  if (!canView) {
    return (
      <CContainer className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <CCard>
          <CCardBody className="text-center">
            <CIcon icon={cilBan} size="3xl" className="text-danger mb-3" />
            <h4>Acceso Denegado</h4>
            <p className="text-muted">No tienes permiso para ver esta página.</p>
            <CButton color="primary" onClick={() => navigate('/progestor/admin/bills')}>
              Volver a reportes
            </CButton>
          </CCardBody>
        </CCard>
      </CContainer>
    );
  }

  return (
    <CContainer lg>
      {alert.show && (
        <CAlert color={alert.type} dismissible onClose={() => setAlert({ show: false })}>
          {alert.message}
        </CAlert>
      )}

      {/* Read-only banner */}
      {!canEdit && (
        <CAlert color="warning" className="d-flex align-items-center">
          <CIcon icon={cilLockLocked} className="me-2" />
          <span>
            <strong>Modo solo lectura.</strong> No tienes permiso para generar PDFs de itinerarios.
          </span>
        </CAlert>
      )}

      <CCard className="mb-4">
        <CCardHeader>
          <CRow className="align-items-center">
            <CCol>
              <div className="d-flex align-items-center">
                <CButton
                  color="secondary"
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/progestor/admin/bills')}
                  className="me-3"
                  tabIndex={-1}
                >
                  <CIcon icon={cilArrowLeft} />
                </CButton>
                <div>
                  <strong>Factura Nexatravel</strong>
                  <div className="small text-muted">
                    Complete los datos para generar la factura en PDF
                  </div>
                </div>
              </div>
            </CCol>
            <CCol xs="auto">
              {canEdit ? (
                <>
                  <CButton
                    color="secondary"
                    variant="outline"
                    className="me-2"
                    onClick={handleClear}
                    tabIndex={-1}
                  >
                    <CIcon icon={cilTrash} className="me-2" />
                    Limpiar
                  </CButton>
                  <CButton
                    color="info"
                    onClick={() => generatePDF('preview')}
                    disabled={loading}
                    className="me-2 app-button"
                    tabIndex={-1}
                  >
                    {loading ? (
                      <CSpinner size="sm" className="me-2" />
                    ) : (
                      <CIcon icon={cilMagnifyingGlass} className="me-2" />
                    )}
                    Vista Previa
                  </CButton>
                  <CButton
                    color="primary"
                    className="app-button"
                    onClick={() => generatePDF('download')}
                    disabled={loading}
                    tabIndex={-1}
                  >
                    {loading ? (
                      <>
                        <CSpinner size="sm" className="me-2" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <CIcon icon={cilFile} className="me-2" />
                        Generar PDF
                      </>
                    )}
                  </CButton>
                </>
              ) : (
                <CBadge color="warning" className="px-3 py-2">
                  <CIcon icon={cilLockLocked} className="me-1" />
                  Solo lectura
                </CBadge>
              )}
            </CCol>
          </CRow>
        </CCardHeader>
        <CCardBody>
          <CForm onSubmit={(e) => e.preventDefault()}>
            {/* Información General */}
            <CCard className="mb-4">
              <CCardHeader className="  ">
                <strong>Información de Factura</strong>
              </CCardHeader>
              <CCardBody>
                <CRow className="mb-3">
                  <CCol md={3}>
                    <CFormLabel htmlFor="currency">Moneda *</CFormLabel>
                    <CFormSelect
                      id="currency"
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      disabled={!canEdit}
                    >
                      <option value="dollar">Dólar (USD) $</option>
                      <option value="euro">Euro (EUR) €</option>
                    </CFormSelect>
                  </CCol>
                  <CCol md={3}>
                    <CFormLabel htmlFor="invoiceNumber">Número de Factura *</CFormLabel>
                    <CFormInput
                      type="text"
                      id="invoiceNumber"
                      name="invoiceNumber"
                      placeholder="Ej: 001"
                      value={formData.invoiceNumber}
                      onChange={handleChange}
                      disabled={!canEdit}
                    />
                  </CCol>
                  <CCol md={3}>
                    <CFormLabel htmlFor="date">Fecha</CFormLabel>
                    <CFormInput
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      disabled={!canEdit}
                    />
                  </CCol>
                  <CCol md={3}>
                    <CFormLabel htmlFor="balanceDue">Saldo (Balance Due)</CFormLabel>
                    <CInputGroup>
                      <CInputGroupText>{getCurrencySymbol()}</CInputGroupText>
                      <CFormInput
                        type="text"
                        id="balanceDue"
                        name="balanceDue"
                        value={formData.balanceDue}
                        readOnly
                        className="  "
                      />
                    </CInputGroup>
                  </CCol>
                </CRow>
                <CRow className="mb-3">
                  <CCol md={6}>
                    <CFormLabel htmlFor="billTo">Facturar a (Bill To) *</CFormLabel>
                    <CFormInput
                      type="text"
                      id="billTo"
                      name="billTo"
                      placeholder="Nombre del cliente"
                      value={formData.billTo}
                      onChange={handleChange}
                      disabled={!canEdit}
                    />
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel htmlFor="country">País</CFormLabel>
                    <CFormInput
                      type="text"
                      id="country"
                      name="country"
                      placeholder="País del cliente"
                      value={formData.country}
                      onChange={handleChange}
                      disabled={!canEdit}
                    />
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>

            {/* Productos */}
            <CCard className="mb-4">
              <CCardHeader className="  ">
                <strong>Productos / Servicios</strong>
                <div className="small text-muted">
                  Agregue hasta 4 productos o servicios
                </div>
              </CCardHeader>
              <CCardBody>
                {/* Product 1 */}
                <CRow className="mb-3 align-items-end">
                  <CCol md={5}>
                    <CFormLabel htmlFor="product1Description">Descripción 1</CFormLabel>
                    <CFormInput
                      type="text"
                      id="product1Description"
                      name="product1Description"
                      placeholder="Descripción del producto/servicio"
                      value={formData.product1Description}
                      onChange={handleChange}
                      disabled={!canEdit}
                    />
                  </CCol>
                  <CCol md={2}>
                    <CFormLabel htmlFor="product1Quantity">Cantidad</CFormLabel>
                    <CFormInput
                      type="number"
                      id="product1Quantity"
                      name="product1Quantity"
                      placeholder="0"
                      value={formData.product1Quantity}
                      onChange={handleChange}
                      disabled={!canEdit}
                    />
                  </CCol>
                  <CCol md={2}>
                    <CFormLabel htmlFor="product1Price">Precio</CFormLabel>
                    <CInputGroup>
                      <CInputGroupText>{getCurrencySymbol()}</CInputGroupText>
                      <CFormInput
                        type="number"
                        step="0.01"
                        id="product1Price"
                        name="product1Price"
                        placeholder="0.00"
                        value={formData.product1Price}
                        onChange={handleChange}
                        disabled={!canEdit}
                      />
                    </CInputGroup>
                  </CCol>
                  <CCol md={3}>
                    <CFormLabel htmlFor="product1Total">Total</CFormLabel>
                    <CInputGroup>
                      <CInputGroupText>{getCurrencySymbol()}</CInputGroupText>
                      <CFormInput
                        type="text"
                        id="product1Total"
                        name="product1Total"
                        value={formData.product1Total}
                        readOnly
                        className="  "
                      />
                    </CInputGroup>
                  </CCol>
                </CRow>

                {/* Product 2 */}
                <CRow className="mb-3 align-items-end">
                  <CCol md={5}>
                    <CFormLabel htmlFor="product2Description">Descripción 2</CFormLabel>
                    <CFormInput
                      type="text"
                      id="product2Description"
                      name="product2Description"
                      placeholder="Descripción del producto/servicio"
                      value={formData.product2Description}
                      onChange={handleChange}
                      disabled={!canEdit}
                    />
                  </CCol>
                  <CCol md={2}>
                    <CFormLabel htmlFor="product2Quantity">Cantidad</CFormLabel>
                    <CFormInput
                      type="number"
                      id="product2Quantity"
                      name="product2Quantity"
                      placeholder="0"
                      value={formData.product2Quantity}
                      onChange={handleChange}
                      disabled={!canEdit}
                    />
                  </CCol>
                  <CCol md={2}>
                    <CFormLabel htmlFor="product2Price">Precio</CFormLabel>
                    <CInputGroup>
                      <CInputGroupText>{getCurrencySymbol()}</CInputGroupText>
                      <CFormInput
                        type="number"
                        step="0.01"
                        id="product2Price"
                        name="product2Price"
                        placeholder="0.00"
                        value={formData.product2Price}
                        onChange={handleChange}
                        disabled={!canEdit}
                      />
                    </CInputGroup>
                  </CCol>
                  <CCol md={3}>
                    <CFormLabel htmlFor="product2Total">Total</CFormLabel>
                    <CInputGroup>
                      <CInputGroupText>{getCurrencySymbol()}</CInputGroupText>
                      <CFormInput
                        type="text"
                        id="product2Total"
                        name="product2Total"
                        value={formData.product2Total}
                        readOnly
                        className="  "
                      />
                    </CInputGroup>
                  </CCol>
                </CRow>

                {/* Product 3 */}
                <CRow className="mb-3 align-items-end">
                  <CCol md={5}>
                    <CFormLabel htmlFor="product3Description">Descripción 3</CFormLabel>
                    <CFormInput
                      type="text"
                      id="product3Description"
                      name="product3Description"
                      placeholder="Descripción del producto/servicio"
                      value={formData.product3Description}
                      onChange={handleChange}
                      disabled={!canEdit}
                    />
                  </CCol>
                  <CCol md={2}>
                    <CFormLabel htmlFor="product3Quantity">Cantidad</CFormLabel>
                    <CFormInput
                      type="number"
                      id="product3Quantity"
                      name="product3Quantity"
                      placeholder="0"
                      value={formData.product3Quantity}
                      onChange={handleChange}
                      disabled={!canEdit}
                    />
                  </CCol>
                  <CCol md={2}>
                    <CFormLabel htmlFor="product3Price">Precio</CFormLabel>
                    <CInputGroup>
                      <CInputGroupText>{getCurrencySymbol()}</CInputGroupText>
                      <CFormInput
                        type="number"
                        step="0.01"
                        id="product3Price"
                        name="product3Price"
                        placeholder="0.00"
                        value={formData.product3Price}
                        onChange={handleChange}
                        disabled={!canEdit}
                      />
                    </CInputGroup>
                  </CCol>
                  <CCol md={3}>
                    <CFormLabel htmlFor="product3Total">Total</CFormLabel>
                    <CInputGroup>
                      <CInputGroupText>{getCurrencySymbol()}</CInputGroupText>
                      <CFormInput
                        type="text"
                        id="product3Total"
                        name="product3Total"
                        value={formData.product3Total}
                        readOnly
                        className="  "
                      />
                    </CInputGroup>
                  </CCol>
                </CRow>

                {/* Product 4 */}
                <CRow className="mb-3 align-items-end">
                  <CCol md={5}>
                    <CFormLabel htmlFor="product4Description">Descripción 4</CFormLabel>
                    <CFormInput
                      type="text"
                      id="product4Description"
                      name="product4Description"
                      placeholder="Descripción del producto/servicio"
                      value={formData.product4Description}
                      onChange={handleChange}
                      disabled={!canEdit}
                    />
                  </CCol>
                  <CCol md={2}>
                    <CFormLabel htmlFor="product4Quantity">Cantidad</CFormLabel>
                    <CFormInput
                      type="number"
                      id="product4Quantity"
                      name="product4Quantity"
                      placeholder="0"
                      value={formData.product4Quantity}
                      onChange={handleChange}
                      disabled={!canEdit}
                    />
                  </CCol>
                  <CCol md={2}>
                    <CFormLabel htmlFor="product4Price">Precio</CFormLabel>
                    <CInputGroup>
                      <CInputGroupText>{getCurrencySymbol()}</CInputGroupText>
                      <CFormInput
                        type="number"
                        step="0.01"
                        id="product4Price"
                        name="product4Price"
                        placeholder="0.00"
                        value={formData.product4Price}
                        onChange={handleChange}
                        disabled={!canEdit}
                      />
                    </CInputGroup>
                  </CCol>
                  <CCol md={3}>
                    <CFormLabel htmlFor="product4Total">Total</CFormLabel>
                    <CInputGroup>
                      <CInputGroupText>{getCurrencySymbol()}</CInputGroupText>
                      <CFormInput
                        type="text"
                        id="product4Total"
                        name="product4Total"
                        value={formData.product4Total}
                        readOnly
                        className="  "
                      />
                    </CInputGroup>
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>

            {/* Totales */}
            <CCard className="mb-4">
              <CCardHeader className="  ">
                <strong>Totales</strong>
              </CCardHeader>
              <CCardBody>
                <CRow>
                  <CCol md={4}>
                    <CFormLabel htmlFor="subtotal">Subtotal</CFormLabel>
                    <CInputGroup>
                      <CInputGroupText>{getCurrencySymbol()}</CInputGroupText>
                      <CFormInput
                        type="text"
                        id="subtotal"
                        name="subtotal"
                        value={formData.subtotal}
                        readOnly
                        className="  "
                      />
                    </CInputGroup>
                  </CCol>
                  <CCol md={4}>
                    <CFormLabel htmlFor="tax">Impuesto (%)</CFormLabel>
                    <CInputGroup>
                      <CFormInput
                        type="number"
                        step="0.01"
                        id="tax"
                        name="tax"
                        placeholder="0"
                        value={formData.tax}
                        onChange={handleChange}
                        disabled={!canEdit}
                      />
                      <CInputGroupText>%</CInputGroupText>
                    </CInputGroup>
                  </CCol>
                  <CCol md={4}>
                    <CFormLabel htmlFor="total">Total</CFormLabel>
                    <CInputGroup>
                      <CInputGroupText>{getCurrencySymbol()}</CInputGroupText>
                      <CFormInput
                        type="text"
                        id="total"
                        name="total"
                        value={formData.total}
                        readOnly
                        className="   fw-bold"
                      />
                    </CInputGroup>
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>

            {/* Nota informativa */}
            <CAlert color="info">
              <strong>Nota:</strong> Los campos de Total de cada producto, Subtotal, Balance Due y Total
              se calculan automáticamente. La información bancaria (COORDONNÉES BANCAIRES) se incluye
              automáticamente desde la plantilla.
            </CAlert>
          </CForm>
        </CCardBody>
      </CCard>

      {/* Bottom action buttons */}
      <CRow className="mb-4">
        <CCol className="d-flex justify-content-end">
          <CButton
            color="info"
            onClick={() => generatePDF('preview')}
            disabled={loading}
            className="me-2 app-button"
            tabIndex={-1}
          >
            {loading ? (
              <CSpinner size="sm" className="me-2" />
            ) : (
              <CIcon icon={cilMagnifyingGlass} className="me-2" />
            )}
            Vista Previa
          </CButton>
          <CButton
            color="primary"
            className='app-button'
            onClick={() => generatePDF('download')}
            disabled={loading}
            tabIndex={-1}
          >
            {loading ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Generando...
              </>
            ) : (
              <>
                <CIcon icon={cilFile} className="me-2" />
                Generar PDF
              </>
            )}
          </CButton>
        </CCol>
      </CRow>

      {/* PDF Preview Modal */}
      <CModal
        visible={showPreview}
        onClose={handleClosePreview}
        size="xl"
        alignment="center"
      >
        <CModalHeader>
          <CModalTitle>Vista Previa de Factura</CModalTitle>
        </CModalHeader>
        <CModalBody className="p-0">
          {pdfBlobUrl && (
            <iframe
              src={pdfBlobUrl}
              style={{
                width: '100%',
                height: '70vh',
                border: 'none',
              }}
              title="PDF Preview"
            />
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={handleClosePreview}>
            Cerrar
          </CButton>
          <CButton
            color="primary"
            className='app-button'
            onClick={handleDownloadFromPreview}
          >
            <CIcon icon={cilCloudDownload} className="me-2" />
            Descargar PDF
          </CButton>
        </CModalFooter>
      </CModal>
    </CContainer>
  );
};

export default InvoiceNexatravel;