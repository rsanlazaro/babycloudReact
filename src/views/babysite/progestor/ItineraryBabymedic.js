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
    CFormTextarea,
    CAlert,
    CSpinner,
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
    cilFile,
    cilTrash,
    cilCloudDownload,
    cilMagnifyingGlass,
    cilLockLocked,
    cilBan,
} from '@coreui/icons';
import { jsPDF } from 'jspdf';
import usePermissions from '../../../hooks/usePermissions';

// Import template images for all pages
import Page1Template from 'src/assets/itinerary/page1-template.jpg';
import Page2 from 'src/assets/itinerary/page2.jpg';
import Page3 from 'src/assets/itinerary/page3.jpg';
import Page4 from 'src/assets/itinerary/page4.jpg';
import Page5 from 'src/assets/itinerary/page5.jpg';
import Page6 from 'src/assets/itinerary/page6.jpg';
import Page7 from 'src/assets/itinerary/page7.jpg';
import Page8 from 'src/assets/itinerary/page8.jpg';
import Page9 from 'src/assets/itinerary/page9.jpg';
import Page10 from 'src/assets/itinerary/page10.jpg';
import Page11 from 'src/assets/itinerary/page11.jpg';
import Page12 from 'src/assets/itinerary/page12.jpg';
import Page13 from 'src/assets/itinerary/page13.jpg';
import Page14 from 'src/assets/itinerary/page14.jpg';

// Day input section component - OUTSIDE main component to prevent re-renders
const DaySection = ({ dayNumber, formData, handleChange, canEdit }) => (
    <CCard className="mb-3">
        <CCardHeader className="  py-2">
            <strong>Día {dayNumber}</strong>
        </CCardHeader>
        <CCardBody>
            <CRow className="mb-3">
                <CCol md={12}>
                    <CFormLabel htmlFor={`day${dayNumber}Date`}>Fecha</CFormLabel>
                    <CFormInput
                        type="date"
                        id={`day${dayNumber}Date`}
                        name={`day${dayNumber}Date`}
                        placeholder="Ej: 15 de Enero"
                        value={formData[`day${dayNumber}Date`] || ''}
                        onChange={handleChange}
                        disabled={!canEdit}
                    />
                </CCol>
            </CRow>
            <CRow className="mb-2">
                <CCol md={6}>
                    <CFormLabel htmlFor={`day${dayNumber}Activity1`}>Actividad 1</CFormLabel>
                    <CFormTextarea
                        id={`day${dayNumber}Activity1`}
                        name={`day${dayNumber}Activity1`}
                        rows={2}
                        placeholder="Descripción de la actividad..."
                        value={formData[`day${dayNumber}Activity1`] || ''}
                        onChange={handleChange}
                        disabled={!canEdit}
                    />
                </CCol>
                <CCol md={6}>
                    <CFormLabel htmlFor={`day${dayNumber}Activity2`}>Actividad 2</CFormLabel>
                    <CFormTextarea
                        id={`day${dayNumber}Activity2`}
                        name={`day${dayNumber}Activity2`}
                        rows={2}
                        placeholder="Descripción de la actividad..."
                        value={formData[`day${dayNumber}Activity2`] || ''}
                        onChange={handleChange}
                        disabled={!canEdit}
                    />
                </CCol>
            </CRow>
            <CRow>
                <CCol md={6}>
                    <CFormLabel htmlFor={`day${dayNumber}Activity3`}>Actividad 3</CFormLabel>
                    <CFormTextarea
                        id={`day${dayNumber}Activity3`}
                        name={`day${dayNumber}Activity3`}
                        rows={2}
                        placeholder="Descripción de la actividad..."
                        value={formData[`day${dayNumber}Activity3`] || ''}
                        onChange={handleChange}
                        disabled={!canEdit}
                    />
                </CCol>
                <CCol md={6}>
                    <CFormLabel htmlFor={`day${dayNumber}Activity4`}>Actividad 4</CFormLabel>
                    <CFormTextarea
                        id={`day${dayNumber}Activity4`}
                        name={`day${dayNumber}Activity4`}
                        rows={2}
                        placeholder="Descripción de la actividad..."
                        value={formData[`day${dayNumber}Activity4`] || ''}
                        onChange={handleChange}
                        disabled={!canEdit}
                    />
                </CCol>
            </CRow>
        </CCardBody>
    </CCard>
);

const ItineraryBabymedic = () => {
    const navigate = useNavigate();
    const { reports } = usePermissions();
    // Permission checks
    const canView = reports.itinerary.visible;
    const canEdit = reports.itinerary.editable;

    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });

    // PDF Preview state
    const [showPreview, setShowPreview] = useState(false);
    const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

    // Form data
    const [formData, setFormData] = useState({
        periodo: '',
        nombre: '',
        // Day 1
        day1Date: '',
        day1Activity1: '',
        day1Activity2: '',
        day1Activity3: '',
        day1Activity4: '',
        // Day 2
        day2Date: '',
        day2Activity1: '',
        day2Activity2: '',
        day2Activity3: '',
        day2Activity4: '',
        // Day 3
        day3Date: '',
        day3Activity1: '',
        day3Activity2: '',
        day3Activity3: '',
        day3Activity4: '',
        // Day 4
        day4Date: '',
        day4Activity1: '',
        day4Activity2: '',
        day4Activity3: '',
        day4Activity4: '',
        // Day 5
        day5Date: '',
        day5Activity1: '',
        day5Activity2: '',
        day5Activity3: '',
        day5Activity4: '',
        // Day 6
        day6Date: '',
        day6Activity1: '',
        day6Activity2: '',
        day6Activity3: '',
        day6Activity4: '',
    });

    // Redirect if no view permission
    useEffect(() => {
        if (!canView) {
            navigate('/progestor/admin/reports');
        }
    }, [canView, navigate]);

    const showNotification = (type, message) => {
        setAlert({ show: true, type, message });
        setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleClear = () => {
        setFormData({
            periodo: '',
            nombre: '',
            day1Date: '',
            day1Activity1: '',
            day1Activity2: '',
            day1Activity3: '',
            day1Activity4: '',
            day2Date: '',
            day2Activity1: '',
            day2Activity2: '',
            day2Activity3: '',
            day2Activity4: '',
            day3Date: '',
            day3Activity1: '',
            day3Activity2: '',
            day3Activity3: '',
            day3Activity4: '',
            day4Date: '',
            day4Activity1: '',
            day4Activity2: '',
            day4Activity3: '',
            day4Activity4: '',
            day5Date: '',
            day5Activity1: '',
            day5Activity2: '',
            day5Activity3: '',
            day5Activity4: '',
            day6Date: '',
            day6Activity1: '',
            day6Activity2: '',
            day6Activity3: '',
            day6Activity4: '',
        });
        if (pdfBlobUrl) {
            URL.revokeObjectURL(pdfBlobUrl);
            setPdfBlobUrl(null);
        }
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

        if (!formData.nombre || !formData.periodo) {
            showNotification('danger', 'Por favor complete los campos obligatorios (Periodo y Nombre)');
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

            // ========== PAGE 1 - Template with overlay text ==========
            try {
                const page1Base64 = await getImageAsBase64(Page1Template);
                doc.addImage(page1Base64, 'JPEG', 0, 0, pageWidth, pageHeight);
            } catch (e) {
                console.error('Could not load page 1 template:', e);
                showNotification('danger', 'Error al cargar la plantilla de la página 1');
                setLoading(false);
                return;
            }

            // Overlay text on page 1
            // PERIODO text
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(15);
            doc.setTextColor(255, 255, 255);
            doc.text(formData.periodo, 65, 14, { align: 'center' });

            // NOMBRE text
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(15);
            doc.text(`Nom(s): ${formData.nombre}`, 65, 22, { align: 'center' });

            // Day boxes positions (adjust these based on your template)
            const dayPositions = [
                { x: 14, y: 78, width: 89, dateY: 85, contentY: 95 },
                { x: 113, y: 78, width: 89, dateY: 85, contentY: 95 },
                { x: 14, y: 142, width: 89, dateY: 148, contentY: 159 },
                { x: 113, y: 142, width: 89, dateY: 148, contentY: 159 },
                { x: 14, y: 206, width: 89, dateY: 212, contentY: 223 },
                { x: 113, y: 206, width: 89, dateY: 212, contentY: 223 },
            ];

            // Add date and activities for each day
            doc.setTextColor(60, 60, 60);
            doc.setFontSize(8);

            for (let dayNum = 1; dayNum <= 6; dayNum++) {
                const pos = dayPositions[dayNum - 1];
                const date = formData[`day${dayNum}Date`];
                const activities = [
                    formData[`day${dayNum}Activity1`],
                    formData[`day${dayNum}Activity2`],
                    formData[`day${dayNum}Activity3`],
                    formData[`day${dayNum}Activity4`],
                ].filter((a) => a && a.trim());

                // Date in the header
                if (date) {
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(11);
                    const dateWidth = doc.getTextWidth(date);
                    doc.text(formatDate(date), pos.x + (pos.width / 2), pos.dateY, { align: 'center' });
                }

                // Activities
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(50, 50, 50);
                doc.setFontSize(11);

                let activityY = pos.contentY;
                const lineHeight = 6;
                const maxWidth = pos.width - 10;

                for (const activity of activities) {
                    if (activityY > pos.y + 50) break;

                    const lines = doc.splitTextToSize(`• ${activity}`, maxWidth);
                    for (const line of lines) {
                        if (activityY > pos.y + 50) break;
                        doc.text(line, pos.x + 5, activityY);
                        activityY += lineHeight;
                    }
                }
            }

            // ========== PAGES 2-14 - Static images ==========
            const staticPages = [
                Page2, Page3, Page4, Page5, Page6, Page7,
                Page8, Page9, Page10, Page11, Page12, Page13, Page14,
            ];

            for (const pageImg of staticPages) {
                try {
                    const imgBase64 = await getImageAsBase64(pageImg);
                    doc.addPage();
                    doc.addImage(imgBase64, 'JPEG', 0, 0, pageWidth, pageHeight);
                } catch (pageError) {
                    console.warn('Could not load page image:', pageError);
                    doc.addPage();
                    doc.setFillColor(240, 240, 240);
                    doc.rect(0, 0, pageWidth, pageHeight, 'F');
                    doc.setTextColor(100, 100, 100);
                    doc.setFontSize(14);
                    doc.text('Página no disponible', pageWidth / 2, pageHeight / 2, { align: 'center' });
                }
            }

            // Generate filename
            const patientName = formData.nombre.replace(/\s+/g, '_') || 'paciente';
            const period = formData.periodo.replace(/\s+/g, '_') || 'periodo';

            if (action === 'preview') {
                const pdfBlob = doc.output('blob');
                const blobUrl = URL.createObjectURL(pdfBlob);
                setPdfBlobUrl(blobUrl);
                setShowPreview(true);
            } else if (action === 'download') {
                const fileName = `Itinerario_Babyboom_${patientName}_${period}.pdf`;
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
            const patientName = formData.nombre.replace(/\s+/g, '_') || 'paciente';
            const period = formData.periodo.replace(/\s+/g, '_') || 'periodo';
            link.download = `Itinerario_Babyboom_${patientName}_${period}.pdf`;
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

    // Prevent spacebar from triggering button clicks when typing
    const handleKeyDown = (e) => {
        if (e.key === ' ' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
        }
    };

    // Access denied view
    if (!canView) {
        return (
            <CContainer className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <CCard>
                    <CCardBody className="text-center">
                        <CIcon icon={cilBan} size="3xl" className="text-danger mb-3" />
                        <h4>Acceso Denegado</h4>
                        <p className="text-muted">No tienes permiso para ver esta página.</p>
                        <CButton color="primary" onClick={() => navigate('/progestor/admin/reports')}>
                            Volver a reportes
                        </CButton>
                    </CCardBody>
                </CCard>
            </CContainer>
        );
    }

    return (
        <CContainer lg onKeyDown={handleKeyDown}>
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
                                    onClick={() => navigate('/progestor/admin/reports')}
                                    className="me-3"
                                    tabIndex={-1}
                                >
                                    <CIcon icon={cilArrowLeft} />
                                </CButton>
                                <div>
                                    <strong>Itinerario Babyboom</strong>
                                    <div className="small text-muted">
                                        Complete los datos para generar el itinerario en PDF
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
                                        onClick={() => generatePDF('download')}
                                        disabled={loading}
                                        className="app-button"
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
                            <CCardHeader className=" ">
                                <strong>Información General</strong>
                            </CCardHeader>
                            <CCardBody>
                                <CRow className="mb-3">
                                    <CCol md={6}>
                                        <CFormLabel htmlFor="periodo">Periodo *</CFormLabel>
                                        <CFormInput
                                            type="text"
                                            id="periodo"
                                            name="periodo"
                                            placeholder="Ej: 15 - 21 de Enero 2025"
                                            value={formData.periodo}
                                            onChange={handleChange}
                                            disabled={!canEdit}
                                        />
                                    </CCol>
                                    <CCol md={6}>
                                        <CFormLabel htmlFor="nombre">Nombre(s) *</CFormLabel>
                                        <CFormInput
                                            type="text"
                                            id="nombre"
                                            name="nombre"
                                            placeholder="Nombre completo del paciente"
                                            value={formData.nombre}
                                            onChange={handleChange}
                                            disabled={!canEdit}
                                        />
                                    </CCol>
                                </CRow>
                            </CCardBody>
                        </CCard>

                        {/* Itinerario por Día */}
                        <CCard className="mb-4">
                            <CCardHeader className=" ">
                                <strong>Itinerario por Día</strong>
                                <div className="small text-muted">
                                    Complete la fecha y hasta 4 actividades por día
                                </div>
                            </CCardHeader>
                            <CCardBody>
                                <CRow>
                                    <CCol lg={6}>
                                        <DaySection dayNumber={1} formData={formData} handleChange={handleChange} canEdit={canEdit}/>
                                        <DaySection dayNumber={3} formData={formData} handleChange={handleChange} canEdit={canEdit}/>
                                        <DaySection dayNumber={5} formData={formData} handleChange={handleChange} canEdit={canEdit}/>
                                    </CCol>
                                    <CCol lg={6}>
                                        <DaySection dayNumber={2} formData={formData} handleChange={handleChange} canEdit={canEdit}/>
                                        <DaySection dayNumber={4} formData={formData} handleChange={handleChange} canEdit={canEdit}/>
                                        <DaySection dayNumber={6} formData={formData} handleChange={handleChange} canEdit={canEdit}/>
                                    </CCol>
                                </CRow>
                            </CCardBody>
                        </CCard>

                        {/* Nota informativa */}
                        <CAlert color="info">
                            <strong>Nota:</strong> Las páginas 2-14 del itinerario (información de supermercados,
                            farmacias, centros comerciales, restaurantes, aplicaciones, lugares turísticos y
                            museos) se incluirán automáticamente en el PDF generado.
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
                        className="app-button mx-2"
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
                    <CModalTitle>Vista Previa del Itinerario</CModalTitle>
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
                        onClick={handleDownloadFromPreview}
                        className='app-button'
                    >
                        <CIcon icon={cilCloudDownload} className="me-2" />
                        Descargar PDF
                    </CButton>
                </CModalFooter>
            </CModal>
        </CContainer >
    );
};

export default ItineraryBabymedic;