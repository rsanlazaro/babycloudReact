// src/views/pages/progestor/reports/MedicalReport.js
import React, { useState } from 'react';
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
  CFormTextarea,
  CAlert,
  CSpinner,
  CImage,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilArrowLeft,
  cilFile,
  cilTrash,
  cilCamera,
  cilX,
  cilCloudDownload,
  cilMagnifyingGlass,
} from '@coreui/icons';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import FertihausLogo from '../../../../src/assets/brand/fertihaus-logo.png';

const MedicalReport = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  // PDF Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    // Datos generales
    fecha: new Date().toISOString().split('T')[0],
    medicoTratante: '',
    nombrePaciente: '',
    edad: '',
    fechaUltimaMenstruacion: '',
    edadGestacional: '',

    // Parámetros biofísicos
    dbpValor: '',
    dbpEdad: '',
    ccValor: '',
    ccEdad: '',
    caValor: '',
    caEdad: '',
    lfValor: '',
    lfEdad: '',
    fetometriaPromedio: '',
    pesoFetalEstimado: '',
    percentilPeso: '',
    frecuenciaCardiacaFetal: '',

    // Comentarios y conclusiones
    comentarios: '',
    impresionDiagnostica: '',
  });

  // Images state (8 images)
  const [images, setImages] = useState({
    image1: null,
    image2: null,
    image3: null,
    image4: null,
    image5: null,
    image6: null,
    image7: null,
    image8: null,
  });

  // Image previews
  const [imagePreviews, setImagePreviews] = useState({
    image1: null,
    image2: null,
    image3: null,
    image4: null,
    image5: null,
    image6: null,
    image7: null,
    image8: null,
  });

  const showNotification = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e, imageKey) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('danger', 'Por favor seleccione una imagen válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification('danger', 'La imagen no debe exceder 5MB');
      return;
    }

    setImages((prev) => ({ ...prev, [imageKey]: file }));

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviews((prev) => ({ ...prev, [imageKey]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (imageKey) => {
    setImages((prev) => ({ ...prev, [imageKey]: null }));
    setImagePreviews((prev) => ({ ...prev, [imageKey]: null }));
  };

  const handleClear = () => {
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      medicoTratante: '',
      nombrePaciente: '',
      edad: '',
      fechaUltimaMenstruacion: '',
      edadGestacional: '',
      dbpValor: '',
      dbpEdad: '',
      ccValor: '',
      ccEdad: '',
      caValor: '',
      caEdad: '',
      lfValor: '',
      lfEdad: '',
      fetometriaPromedio: '',
      pesoFetalEstimado: '',
      percentilPeso: '',
      frecuenciaCardiacaFetal: '',
      comentarios: '',
      impresionDiagnostica: '',
    });
    setImages({
      image1: null,
      image2: null,
      image3: null,
      image4: null,
      image5: null,
      image6: null,
      image7: null,
      image8: null,
    });
    setImagePreviews({
      image1: null,
      image2: null,
      image3: null,
      image4: null,
      image5: null,
      image6: null,
      image7: null,
      image8: null,
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
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
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      };
      img.onerror = reject;
      img.src = imgSrc;
    });
  };

  const generatePDF = async (action = 'preview') => {
    // Validate required fields
    if (!formData.nombrePaciente || !formData.medicoTratante) {
      showNotification('danger', 'Por favor complete los campos obligatorios');
      return;
    }

    setLoading(true);

    try {
      const doc = new jsPDF('p', 'mm', 'letter');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = margin;

      // Add logo
      try {
        const logoBase64 = await getImageAsBase64(FertihausLogo);
        const logoWidth = 50;
        const logoHeight = 20;
        doc.addImage(logoBase64, 'PNG', margin, 10, logoWidth, logoHeight);
      } catch (logoError) {
        console.warn('Could not load logo:', logoError);
      }

      // Colors
      const primaryColor = [0, 159, 184];
      const headerBgColor = [240, 248, 250];
      const textColor = [51, 51, 51];

      // Helper function to add header to each page
      const addHeader = () => {

        return margin + 20;
      };

      // Helper function to check and add new page if needed
      const checkNewPage = (requiredSpace) => {
        if (yPos + requiredSpace > pageHeight - margin) {
          doc.addPage();
          yPos = addHeader();
          return true;
        }
        return false;
      };

      // Add first page header
      yPos = addHeader();

      // Horizontal line
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      // General data section
      doc.setFontSize(11);
      doc.setTextColor(...textColor);

      doc.setFont('helvetica', 'bold');
      doc.text('Fecha: ', margin, yPos);
      var labelWidth = doc.getTextWidth('Fecha: ');
      doc.setFont('helvetica', 'normal');
      doc.text(formatDate(formData.fecha), margin + labelWidth, yPos);

      doc.setFont('helvetica', 'bold');
      doc.text('Médico tratante: ', pageWidth / 2 - 10, yPos);
      labelWidth = doc.getTextWidth('Médico tratante: ');
      doc.setFont('helvetica', 'normal');
      doc.text(formData.medicoTratante, pageWidth / 2 -10 + labelWidth, yPos);

      yPos += 6;
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      // Row 2: Nombre paciente and Edad

      doc.setFont('helvetica', 'bold');
      doc.text('Nombre de paciente: ', margin, yPos);
      labelWidth = doc.getTextWidth('Nombre de paciente: ');
      doc.setFont('helvetica', 'normal');
      doc.text(formData.nombrePaciente, margin + labelWidth, yPos);

      doc.setFont('helvetica', 'bold');
      doc.text('Edad: ', pageWidth / 2 + 40, yPos);
      labelWidth = doc.getTextWidth('Edad: ');
      doc.setFont('helvetica', 'normal');
      doc.text(formData.edad, pageWidth / 2 + 40 + labelWidth, yPos);

      yPos += 6;
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      // Row 3: FUM and Edad gestacional
      doc.setFont('helvetica', 'bold');
      doc.text('Fecha de ultima menstruación: ', margin, yPos);
      labelWidth = doc.getTextWidth('Fecha de ultima menstruación: ');
      doc.setFont('helvetica', 'normal');
      doc.text(formatDate(formData.fechaUltimaMenstruacion), margin + labelWidth, yPos);

      doc.setFont('helvetica', 'bold');
      doc.text('Edad gestacional: ', pageWidth / 2 + 40, yPos);
      labelWidth = doc.getTextWidth('Edad gestacional: ');
      doc.setFont('helvetica', 'normal');
      doc.text(formData.edadGestacional, pageWidth / 2 + 40 + labelWidth, yPos);

      yPos += 6;
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 12;

      // Parámetros biofísicos section header
      doc.setFontSize(14);
      doc.setTextColor(...primaryColor);
      doc.setFont('helvetica', 'bold');
      doc.text('Parámetros biofísicos', margin, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 2;
      doc.setDrawColor(...primaryColor);
      doc.line(margin, yPos + 2, margin + 55, yPos + 2);
      yPos += 10;

      // Biophysical parameters table
      const tableData = [
        ['Parámetro biofísico', 'Valor (cm)', 'Edad gestacional (semanas)'],
        ['Diametro biparietal (DBP)', formData.dbpValor, formData.dbpEdad],
        ['Circunferencia cefálica (CC)', formData.ccValor, formData.ccEdad],
        ['Circunferencia abdominal (CA)', formData.caValor, formData.caEdad],
        ['Longitud femoral (LF)', formData.lfValor, formData.lfEdad],
      ];

      // Biophysical parameters table
      const tableData2 = [
        ['Parámetro biofísico', 'Valor'],
        ['Fetometría promedio', `${formData.fetometriaPromedio} SDG`],
        ['Peso fetal estimado (PFE)', `${formData.pesoFetalEstimado} GRS`],
        ['Percentil de peso', `${formData.percentilPeso} %`],
        ['Frecuencia cardiaca fetal', `${formData.frecuenciaCardiacaFetal} LPM`],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [tableData[0]],
        body: tableData.slice(1),
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 3,
          textColor: textColor,
        },
        headStyles: {
          fillColor: headerBgColor,
          textColor: textColor,
          fontStyle: 'bold',
          halign: 'center',
        },
        columnStyles: {
          0: { fontStyle: 'bold', halign: 'left' },
          1: { halign: 'center' },
          2: { halign: 'center' },
        },
        margin: { left: margin, right: margin },
      });

      yPos = doc.lastAutoTable.finalY + 5;

      autoTable(doc, {
        startY: yPos,
        head: [tableData2[0]],
        body: tableData2.slice(1),
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 3,
          textColor: textColor,
        },
        headStyles: {
          fillColor: headerBgColor,
          textColor: textColor,
          fontStyle: 'bold',
          halign: 'center',
        },
        columnStyles: {
          0: { fontStyle: 'bold', halign: 'left' },
          1: { halign: 'center' },
        },
        margin: { left: margin, right: margin },
      });

      yPos = doc.lastAutoTable.finalY + 15;

      // Comentario y conclusiones section
      checkNewPage(30);
      doc.setFontSize(14);
      doc.setTextColor(...primaryColor);
      doc.setFont('helvetica', 'bold');
      doc.text('Comentario y conclusiones:', margin, yPos);
      yPos += 6;

      doc.setFontSize(11);
      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'normal');

      const splitComments = doc.splitTextToSize(formData.comentarios || '', pageWidth - (margin * 2));
      doc.text(splitComments, margin, yPos);
      yPos += splitComments.length * 5 + 15;

      // Impresión diagnóstica section
      checkNewPage(40);
      // Add logo
      try {
        const logoBase64 = await getImageAsBase64(FertihausLogo);
        const logoWidth = 50;
        const logoHeight = 20;
        doc.addImage(logoBase64, 'PNG', margin, 10, logoWidth, logoHeight);
      } catch (logoError) {
        console.warn('Could not load logo:', logoError);
      }
      doc.setFontSize(14);
      doc.setTextColor(...primaryColor);
      doc.setFont('helvetica', 'bold');
      doc.text('Impresión diagnóstica', margin, yPos);
      yPos += 2;
      doc.line(margin, yPos + 2, margin + 55, yPos + 2);
      yPos += 10;

      doc.setFontSize(11);
      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'normal');

      const splitDiagnostic = doc.splitTextToSize(formData.impresionDiagnostica || '', pageWidth - (margin * 2));
      doc.text(splitDiagnostic, margin, yPos);
      yPos += splitDiagnostic.length * 6;

      // Add images (4 per page, 2x2 grid)
      const imageWidth = 80; // mm
      const imageHeight = 56; // mm (maintains ~470x330 aspect ratio)
      const imageGap = 8;

      // Get all images that have been uploaded
      const uploadedImages = Object.entries(imagePreviews)
        .filter(([key, value]) => value !== null)
        .map(([key, value]) => value);

      if (uploadedImages.length > 0) {
        // Start new page for images

        let imageIndex = 0;
        for (const imageData of uploadedImages) {
          // Check if we need a new page (4 images per page)
          if (imageIndex > 0 && imageIndex % 4 === 0) {
            doc.addPage();
            yPos = addHeader();
            // Add logo
            try {
              const logoBase64 = await getImageAsBase64(FertihausLogo);
              const logoWidth = 50;
              const logoHeight = 20;
              doc.addImage(logoBase64, 'PNG', margin, 10, logoWidth, logoHeight);
            } catch (logoError) {
              console.warn('Could not load logo:', logoError);
            }
          }

          const positionInPage = imageIndex % 4;
          const row = Math.floor(positionInPage / 2);
          const col = positionInPage % 2;

          const xPos = margin + (col * (imageWidth + imageGap));
          const imageYPos = yPos + (row * (imageHeight + imageGap));

          try {
            doc.addImage(imageData, 'JPEG', xPos, imageYPos, imageWidth, imageHeight);
          } catch (e) {
            console.error('Error adding image:', e);
          }

          imageIndex++;
        }
      }

      // Footer with location marker on each page
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(12);
        doc.setTextColor(150, 150, 150);
      }

      // Generate filename
      const patientName = formData.nombrePaciente.replace(/\s+/g, '_') || 'paciente';
      const date = formData.fecha.replace(/-/g, '');
      const filename = `ReporteMedico_${patientName}_${date}.pdf`;

      // Save PDF
      if (action === 'preview') {
        const pdfBlob = doc.output('blob');
        const blobUrl = URL.createObjectURL(pdfBlob);
        setPdfBlobUrl(blobUrl);
        setShowPreview(true);
      } else if (action === 'download') {
        const fileName = `Reporte_Ultrasonido_${formData.nombrePaciente.replace(/\s+/g, '_')}_${formData.fecha}.pdf`;
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
      link.download = `Reporte_${formData.nombrePaciente.replace(/\s+/g, '_')}_${formData.fecha}.pdf`;
      link.click();
      setSuccess('PDF descargado exitosamente');
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
  };

  // Image upload component
  const ImageUploadBox = ({ imageKey, label }) => {
    const preview = imagePreviews[imageKey];

    return (
      <CCol md={6} lg={3} className="mb-3">
        <CFormLabel>{label}</CFormLabel>
        <div
          style={{
            border: '2px dashed #dee2e6',
            borderRadius: '8px',
            padding: '10px',
            textAlign: 'center',
            minHeight: '180px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fafafa',
            position: 'relative',
          }}
        >
          {preview ? (
            <>
              <CImage
                src={preview}
                style={{
                  maxWidth: '100%',
                  maxHeight: '140px',
                  objectFit: 'contain',
                  borderRadius: '4px',
                }}
              />
              <CButton
                color="danger"
                variant="ghost"
                size="sm"
                onClick={() => removeImage(imageKey)}
                style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                }}
              >
                <CIcon icon={cilX} />
              </CButton>
            </>
          ) : (
            <>
              <CIcon icon={cilCamera} size="xl" className="text-muted mb-2" />
              <small className="text-muted mb-2">Tamaño recomendado:</small>
              <small className="text-muted">470px X 330px</small>
              <CButton
                color="primary"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => document.getElementById(imageKey).click()}
              >
                Seleccionar
              </CButton>
            </>
          )}
          <CFormInput
            type="file"
            id={imageKey}
            accept="image/*"
            onChange={(e) => handleImageChange(e, imageKey)}
            style={{ display: 'none' }}
          />
        </div>
      </CCol>
    );
  };

  return (
    <CContainer lg>
      {alert.show && (
        <CAlert color={alert.type} dismissible onClose={() => setAlert({ show: false })}>
          {alert.message}
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
                  onClick={() => navigate('/progestor/admin/reports')}
                  className="me-3"
                >
                  <CIcon icon={cilArrowLeft} />
                </CButton>
                <div>
                  <strong>Reporte Médico</strong>
                  <div className="small text-muted">
                    Complete los datos para generar el reporte en PDF
                  </div>
                </div>
              </div>
            </CCol>
            <CCol xs="auto">
              <CButton
                color="secondary"
                variant="outline"
                className="me-2"
                onClick={handleClear}
              >
                <CIcon icon={cilTrash} className="me-2" />
                Limpiar
              </CButton>
              <CButton
                color="info"
                onClick={() => generatePDF('preview')}
                disabled={loading}
                className="app-button mx-2"
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
        </CCardHeader>
        <CCardBody>
          <CForm>
            {/* Datos Generales */}
            <CCard className="mb-4">
              <CCardHeader className="bg-light">
                <strong>Datos Generales</strong>
              </CCardHeader>
              <CCardBody>
                <CRow className="mb-3">
                  <CCol md={4}>
                    <CFormLabel htmlFor="fecha">Fecha *</CFormLabel>
                    <CFormInput
                      type="date"
                      id="fecha"
                      name="fecha"
                      value={formData.fecha}
                      onChange={handleChange}
                    />
                  </CCol>
                  <CCol md={8}>
                    <CFormLabel htmlFor="medicoTratante">Médico Tratante *</CFormLabel>
                    <CFormInput
                      type="text"
                      id="medicoTratante"
                      name="medicoTratante"
                      placeholder="Nombre del médico tratante"
                      value={formData.medicoTratante}
                      onChange={handleChange}
                    />
                  </CCol>
                </CRow>
                <CRow className="mb-3">
                  <CCol md={8}>
                    <CFormLabel htmlFor="nombrePaciente">Nombre del Paciente *</CFormLabel>
                    <CFormInput
                      type="text"
                      id="nombrePaciente"
                      name="nombrePaciente"
                      placeholder="Nombre completo del paciente"
                      value={formData.nombrePaciente}
                      onChange={handleChange}
                    />
                  </CCol>
                  <CCol md={4}>
                    <CFormLabel htmlFor="edad">Edad</CFormLabel>
                    <CFormInput
                      type="number"
                      id="edad"
                      name="edad"
                      placeholder="Años"
                      value={formData.edad}
                      onChange={handleChange}
                    />
                  </CCol>
                </CRow>
                <CRow className="mb-3">
                  <CCol md={6}>
                    <CFormLabel htmlFor="fechaUltimaMenstruacion">Fecha de Última Menstruación</CFormLabel>
                    <CFormInput
                      type="date"
                      id="fechaUltimaMenstruacion"
                      name="fechaUltimaMenstruacion"
                      value={formData.fechaUltimaMenstruacion}
                      onChange={handleChange}
                    />
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel htmlFor="edadGestacional">Edad Gestacional (SDG)</CFormLabel>
                    <CFormInput
                      type="text"
                      id="edadGestacional"
                      name="edadGestacional"
                      placeholder="Ej: 26.2"
                      value={formData.edadGestacional}
                      onChange={handleChange}
                    />
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>

            {/* Parámetros Biofísicos */}
            <CCard className="mb-4">
              <CCardHeader className="bg-light">
                <strong>Parámetros Biofísicos</strong>
              </CCardHeader>
              <CCardBody>
                {/* DBP */}
                <CRow className="mb-3 align-items-end">
                  <CCol md={4}>
                    <CFormLabel>Diámetro Biparietal (DBP)</CFormLabel>
                  </CCol>
                  <CCol md={4}>
                    <CFormLabel htmlFor="dbpValor">Valor (cm)</CFormLabel>
                    <CFormInput
                      type="number"
                      step="0.01"
                      id="dbpValor"
                      name="dbpValor"
                      placeholder="0.00"
                      value={formData.dbpValor}
                      onChange={handleChange}
                    />
                  </CCol>
                  <CCol md={4}>
                    <CFormLabel htmlFor="dbpEdad">Edad gestacional (semanas)</CFormLabel>
                    <CFormInput
                      type="number"
                      step="0.1"
                      id="dbpEdad"
                      name="dbpEdad"
                      placeholder="0.0"
                      value={formData.dbpEdad}
                      onChange={handleChange}
                    />
                  </CCol>
                </CRow>

                {/* CC */}
                <CRow className="mb-3 align-items-end">
                  <CCol md={4}>
                    <CFormLabel>Circunferencia Cefálica (CC)</CFormLabel>
                  </CCol>
                  <CCol md={4}>
                    <CFormLabel htmlFor="ccValor">Valor (cm)</CFormLabel>
                    <CFormInput
                      type="number"
                      step="0.01"
                      id="ccValor"
                      name="ccValor"
                      placeholder="0.00"
                      value={formData.ccValor}
                      onChange={handleChange}
                    />
                  </CCol>
                  <CCol md={4}>
                    <CFormLabel htmlFor="ccEdad">Edad gestacional (semanas)</CFormLabel>
                    <CFormInput
                      type="number"
                      step="0.1"
                      id="ccEdad"
                      name="ccEdad"
                      placeholder="0.0"
                      value={formData.ccEdad}
                      onChange={handleChange}
                    />
                  </CCol>
                </CRow>

                {/* CA */}
                <CRow className="mb-3 align-items-end">
                  <CCol md={4}>
                    <CFormLabel>Circunferencia Abdominal (CA)</CFormLabel>
                  </CCol>
                  <CCol md={4}>
                    <CFormLabel htmlFor="caValor">Valor (cm)</CFormLabel>
                    <CFormInput
                      type="number"
                      step="0.01"
                      id="caValor"
                      name="caValor"
                      placeholder="0.00"
                      value={formData.caValor}
                      onChange={handleChange}
                    />
                  </CCol>
                  <CCol md={4}>
                    <CFormLabel htmlFor="caEdad">Edad gestacional (semanas)</CFormLabel>
                    <CFormInput
                      type="number"
                      step="0.1"
                      id="caEdad"
                      name="caEdad"
                      placeholder="0.0"
                      value={formData.caEdad}
                      onChange={handleChange}
                    />
                  </CCol>
                </CRow>

                {/* LF */}
                <CRow className="mb-3 align-items-end">
                  <CCol md={4}>
                    <CFormLabel>Longitud Femoral (LF)</CFormLabel>
                  </CCol>
                  <CCol md={4}>
                    <CFormLabel htmlFor="lfValor">Valor (cm)</CFormLabel>
                    <CFormInput
                      type="number"
                      step="0.01"
                      id="lfValor"
                      name="lfValor"
                      placeholder="0.00"
                      value={formData.lfValor}
                      onChange={handleChange}
                    />
                  </CCol>
                  <CCol md={4}>
                    <CFormLabel htmlFor="lfEdad">Edad gestacional (semanas)</CFormLabel>
                    <CFormInput
                      type="number"
                      step="0.1"
                      id="lfEdad"
                      name="lfEdad"
                      placeholder="0.0"
                      value={formData.lfEdad}
                      onChange={handleChange}
                    />
                  </CCol>
                </CRow>

                <hr />

                {/* Other parameters */}
                <CRow className="mb-3">
                  <CCol md={6}>
                    <CFormLabel htmlFor="fetometriaPromedio">Fetometría Promedio (SDG)</CFormLabel>
                    <CFormInput
                      type="text"
                      id="fetometriaPromedio"
                      name="fetometriaPromedio"
                      placeholder="Ej: 26.1"
                      value={formData.fetometriaPromedio}
                      onChange={handleChange}
                    />
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel htmlFor="pesoFetalEstimado">Peso Fetal Estimado (GRS)</CFormLabel>
                    <CFormInput
                      type="number"
                      id="pesoFetalEstimado"
                      name="pesoFetalEstimado"
                      placeholder="Ej: 827"
                      value={formData.pesoFetalEstimado}
                      onChange={handleChange}
                    />
                  </CCol>
                </CRow>
                <CRow className="mb-3">
                  <CCol md={6}>
                    <CFormLabel htmlFor="percentilPeso">Percentil de Peso (%)</CFormLabel>
                    <CFormInput
                      type="number"
                      step="0.1"
                      id="percentilPeso"
                      name="percentilPeso"
                      placeholder="Ej: 18.4"
                      value={formData.percentilPeso}
                      onChange={handleChange}
                    />
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel htmlFor="frecuenciaCardiacaFetal">Frecuencia Cardiaca Fetal (LPM)</CFormLabel>
                    <CFormInput
                      type="number"
                      id="frecuenciaCardiacaFetal"
                      name="frecuenciaCardiacaFetal"
                      placeholder="Ej: 145"
                      value={formData.frecuenciaCardiacaFetal}
                      onChange={handleChange}
                    />
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>

            {/* Comentarios y Conclusiones */}
            <CCard className="mb-4">
              <CCardHeader className="bg-light">
                <strong>Comentarios y Conclusiones</strong>
              </CCardHeader>
              <CCardBody>
                <CRow className="mb-3">
                  <CCol md={12}>
                    <CFormLabel htmlFor="comentarios">Comentarios y Conclusiones</CFormLabel>
                    <CFormTextarea
                      id="comentarios"
                      name="comentarios"
                      rows={4}
                      placeholder="Feto único, vivo, adecuados movimientos durante el estudio..."
                      value={formData.comentarios}
                      onChange={handleChange}
                    />
                  </CCol>
                </CRow>
                <CRow className="mb-3">
                  <CCol md={12}>
                    <CFormLabel htmlFor="impresionDiagnostica">Impresión Diagnóstica</CFormLabel>
                    <CFormTextarea
                      id="impresionDiagnostica"
                      name="impresionDiagnostica"
                      rows={3}
                      placeholder="Embarazo normoevolutivo de XX semanas de gestación por fecha de última menstruación."
                      value={formData.impresionDiagnostica}
                      onChange={handleChange}
                    />
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>

            {/* Imágenes */}
            <CCard className="mb-4">
              <CCardHeader className="bg-light">
                <strong>Imágenes</strong>
                <div className="small text-muted">
                  Agregue hasta 8 imágenes para incluir en el reporte
                </div>
              </CCardHeader>
              <CCardBody>
                <CRow>
                  <ImageUploadBox imageKey="image1" label="Imagen 1" />
                  <ImageUploadBox imageKey="image2" label="Imagen 2" />
                  <ImageUploadBox imageKey="image3" label="Imagen 3" />
                  <ImageUploadBox imageKey="image4" label="Imagen 4" />
                </CRow>
                <CRow>
                  <ImageUploadBox imageKey="image5" label="Imagen 5" />
                  <ImageUploadBox imageKey="image6" label="Imagen 6" />
                  <ImageUploadBox imageKey="image7" label="Imagen 7" />
                  <ImageUploadBox imageKey="image8" label="Imagen 8" />
                </CRow>
              </CCardBody>
            </CCard>
          </CForm>
        </CCardBody>
      </CCard>
      <CRow className="align-items-center">
            <CCol>
              <div className="d-flex align-items-center">
                <div>
                </div>
              </div>
            </CCol>
            <CCol xs="auto">  
              <CButton
                color="info"
                onClick={() => generatePDF('preview')}
                disabled={loading}
                className="app-button mx-2"
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
          <CModalTitle>Vista Previa del PDF</CModalTitle>
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
          <CButton className='app-button' onClick={handleDownloadFromPreview}>
            <CIcon icon={cilCloudDownload} className="me-2" />
            Descargar PDF
          </CButton>
        </CModalFooter>
      </CModal>
    </CContainer>
  );
};

export default MedicalReport;