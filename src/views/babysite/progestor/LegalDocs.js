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
    CSpinner,
    CAlert,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilArrowLeft, cilCloudDownload, cilFile } from '@coreui/icons';
import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';

// ---------------------------------------------------------------------------
// PDF.js worker
// Option A (recommended): copy pdf.worker.min.js to /public/ and point here:
//   pdfjsLib.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.js`;
// Option B (CDN, used here as fallback):
// ---------------------------------------------------------------------------
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

// ---------------------------------------------------------------------------
// Document catalogue
// Add these imports right after the pdfjs imports
import pdfAvisoPrivacidad         from '../documents/aviso-privacidad-simplificado.pdf';
import pdfObligaciones            from '../documents/obligaciones-cuidados-limitaciones-embarazo.pdf';
import pdfEsquema                 from '../documents/esquema-remuneracion.pdf';
import pdfConsentimientoTransf    from '../documents/consentimiento-transferencia-embrionaria.pdf';
import pdfConsentimientoInfo      from '../documents/consentimiento-informado.pdf';
import pdfAvisoImagen             from '../documents/aviso-uso-explotacion-imagen.pdf';
import pdfConfidencialidad        from '../documents/contrato-confidencialidad.pdf';
import pdfTerminos                from '../documents/terminos-condiciones.pdf';

// Then update LEGAL_DOCS to use the imported variables instead of string paths:
const LEGAL_DOCS = [
  {
    id: 'aviso-privacidad',
    title: 'Aviso de privacidad simplificado',
    file: pdfAvisoPrivacidad,
    color: 'primary',
  },
  {
    id: 'obligaciones-embarazo',
    title: 'Obligaciones, cuidados y limitaciones durante el embarazo',
    file: pdfObligaciones,
    color: 'info',
  },
  {
    id: 'esquema-remuneracion',
    title: 'Esquema de remuneración',
    file: pdfEsquema,
    color: 'success',
  },
  {
    id: 'consentimiento-transferencia',
    title: 'Consentimiento informado para transferencia embrionaria y selección de programa',
    file: pdfConsentimientoTransf,
    color: 'warning',
  },
  {
    id: 'consentimiento-informado',
    title: 'Consentimiento informado',
    file: pdfConsentimientoInfo,
    color: 'danger',
  },
  {
    id: 'aviso-imagen',
    title: 'Aviso de uso y explotación de imagen',
    file: pdfAvisoImagen,
    color: 'secondary',
  },
  {
    id: 'confidencialidad',
    title: 'Contrato de confidencialidad',
    file: pdfConfidencialidad,
    color: 'dark',
  },
  {
    id: 'terminos',
    title: 'Términos y condiciones',
    file: pdfTerminos,
    color: 'primary',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns today as DD/MM/YYYY */
function getTodayFormatted() {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
}

/**
 * Renders one PDF.js page to a canvas element.
 * scale=2 gives a 2× resolution so the output stays crisp.
 */
async function renderPageToCanvas(pdfPage, scale = 2) {
    const viewport = pdfPage.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await pdfPage.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    return { canvas, viewport };
}

/**
 * Full pipeline:
 *  1. Fetch the original PDF
 *  2. Render every page to canvas via PDF.js
 *  3. Re-assemble with jsPDF and stamp the watermark footer
 *  4. Return a Blob URL ready for window.open()
 */
async function buildWatermarkedPdfUrl(fileUrl) {
    // 1. Fetch bytes
    const response = await fetch(fileUrl);
    if (!response.ok) {
        throw new Error(`No se pudo cargar el documento (HTTP ${response.status})`);
    }

    const arrayBuffer = await response.arrayBuffer();

    // 2. Load with PDF.js
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdfDoc.numPages;

    // 3. Inspect first page to get dimensions for jsPDF
    const SCALE = 2;
    const firstPage = await pdfDoc.getPage(1);
    const { viewport: firstViewport } = await renderPageToCanvas(firstPage, SCALE);

    // jsPDF 'px' unit: 1 jsPDF px = 1 CSS px.
    // We render at 2×, so divide canvas pixels by SCALE to get CSS px values.
    const pageW = firstViewport.width / SCALE;  // CSS px
    const pageH = firstViewport.height / SCALE;  // CSS px

    const orientation = pageW > pageH ? 'landscape' : 'portrait';

    const pdf = new jsPDF({
        orientation,
        unit: 'px',
        format: [pageW, pageH],
        hotfixes: ['px_scaling'],
    });

    // Watermark constants (in CSS px / jsPDF px)
    const STRIP_H = 26;   // height of the footer strip
    const FS_LINE1 = 6.5;  // font size for the warning line
    const FS_LINE2 = 7;    // font size for date + brand line
    const ML = 8;    // left margin

    const today = getTodayFormatted();
    const line1 = 'No firmar este documento si la fecha no coincide con el día de la firma.';
    const line2 = `Fecha ${today}. Babyboom. Todos los derechos reservados.`;

    // 4. Process each page
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        if (pageNum > 1) {
            pdf.addPage([pageW, pageH], orientation);
        }

        const page = await pdfDoc.getPage(pageNum);
        const { canvas } = await renderPageToCanvas(page, SCALE);

        // Page content as image (JPEG for smaller size, quality 0.92)
        pdf.addImage(
            canvas.toDataURL('image/jpeg', 0.92),
            'JPEG',
            0, 0,       // x, y
            pageW, pageH // width, height in jsPDF px
        );

        // --- Watermark footer ---

        // Light grey background strip at the very bottom
        pdf.setFillColor(245, 245, 245);
        pdf.rect(0, pageH - STRIP_H, pageW, STRIP_H, 'F');

        // Top border of the strip
        pdf.setDrawColor(190, 190, 190);
        pdf.setLineWidth(0.4);
        pdf.line(0, pageH - STRIP_H, pageW, pageH - STRIP_H);

        // Line 1 — italic warning text
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(FS_LINE1);
        pdf.setTextColor(100, 100, 100);
        pdf.text(line1, ML, pageH - STRIP_H + FS_LINE1 + 2);

        // Line 2 — bold date + brand
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(FS_LINE2);
        pdf.setTextColor(60, 60, 60);
        pdf.text(line2, ML, pageH - STRIP_H + FS_LINE1 + FS_LINE2 + 5);
    }

    // 5. Return Blob URL
    return URL.createObjectURL(pdf.output('blob'));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const LegalDocs = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState({});
    const [errors, setErrors] = useState({});

    const handleGenerate = async (doc) => {
        setLoading((prev) => ({ ...prev, [doc.id]: true }));
        setErrors((prev) => ({ ...prev, [doc.id]: null }));

        try {
            const blobUrl = await buildWatermarkedPdfUrl(doc.file);

            // Open in new tab — browser PDF viewer lets the user print or save
            const tab = window.open(blobUrl, '_blank');

            if (tab) {
                // Free memory after 60 s (browser has had time to load the PDF)
                setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
            } else {
                // Popup blocked → trigger a direct download as fallback
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = `${doc.id}-${getTodayFormatted().replace(/\//g, '-')}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(blobUrl), 5_000);
            }
        } catch (err) {
            setErrors((prev) => ({
                ...prev,
                [doc.id]: err.message || 'Error desconocido al generar el documento.',
            }));
        } finally {
            setLoading((prev) => ({ ...prev, [doc.id]: false }));
        }
    };

    return (
        <CContainer lg>
            <CCard className="mb-4">
                <CCardHeader className="d-flex align-items-center gap-2">
                    <CButton
                        color="ghost"
                        size="sm"
                        onClick={() => navigate('/progestor/admin')}
                        className="p-1 me-1"
                    >
                        <CIcon icon={cilArrowLeft} />
                    </CButton>
                    <div>
                        <strong>Documentos legales</strong>
                        <div className="small text-muted">
                            Selecciona un documento para generar la vista previa con fecha de hoy
                        </div>
                    </div>
                </CCardHeader>

                <CCardBody>
                    <CRow className="g-3">
                        {LEGAL_DOCS.map((doc) => (
                            <CCol key={doc.id} xs={12} sm={6} xl={4}>
                                <CCard
                                    className="h-100 border-start border-start-3"
                                    style={{ borderStartColor: `var(--cui-${doc.color})` }}
                                >
                                    <CCardBody className="d-flex flex-column justify-content-between gap-3 py-3">

                                        {/* Title row */}
                                        <div className="d-flex align-items-start gap-2">
                                            <div
                                                className="rounded d-inline-flex align-items-center justify-content-center flex-shrink-0 mt-1"
                                                style={{
                                                    width: 32,
                                                    height: 32,
                                                    backgroundColor: `var(--cui-${doc.color}-bg-subtle)`,
                                                }}
                                            >
                                                <CIcon
                                                    icon={cilFile}
                                                    size="sm"
                                                    style={{ color: `var(--cui-${doc.color})` }}
                                                />
                                            </div>
                                            <span
                                                className="fw-semibold"
                                                style={{ fontSize: '0.875rem', lineHeight: 1.3 }}
                                            >
                                                {doc.title}
                                            </span>
                                        </div>

                                        {/* Error message */}
                                        {errors[doc.id] && (
                                            <CAlert
                                                color="danger"
                                                className="py-1 px-2 mb-0"
                                                style={{ fontSize: '0.8rem' }}
                                            >
                                                {errors[doc.id]}
                                            </CAlert>
                                        )}

                                        {/* Action button */}
                                        <CButton
                                            color={doc.color}
                                            variant="outline"
                                            size="sm"
                                            disabled={!!loading[doc.id]}
                                            onClick={() => handleGenerate(doc)}
                                            className="d-flex align-items-center justify-content-center gap-2 align-self-stretch"
                                        >
                                            {loading[doc.id] ? (
                                                <>
                                                    <CSpinner size="sm" />
                                                    Generando…
                                                </>
                                            ) : (
                                                <>
                                                    <CIcon icon={cilCloudDownload} size="sm" />
                                                    Ver / Imprimir
                                                </>
                                            )}
                                        </CButton>

                                    </CCardBody>
                                </CCard>
                            </CCol>
                        ))}
                    </CRow>
                </CCardBody>
            </CCard>
        </CContainer>
    );
};

export default LegalDocs;