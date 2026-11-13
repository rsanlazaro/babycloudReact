// frontend/src/utils/mergePdfs.js
// Merges several PDF files (in the given order) into one, in the browser.
// pdf-lib is loaded only when needed (it is not part of the main bundle).

const loadPdfLib = () => import('pdf-lib');

/**
 * Reads one PDF and returns its page count. Throws a readable error when the
 * file is not a valid PDF or is password-protected.
 */
export const countPdfPages = async (file) => {
  const { PDFDocument } = await loadPdfLib();
  try {
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    return pdf.getPageCount();
  } catch (err) {
    if (/encrypt/i.test(String(err?.message))) {
      throw new Error(`"${file.name}" está protegido con contraseña; quítale la protección antes de subirlo`);
    }
    throw new Error(`"${file.name}" no es un PDF válido o está dañado`);
  }
};

/**
 * @param files   File[] in the order they must appear
 * @param name    name of the resulting file (".pdf" is added if missing)
 * @returns File  the merged PDF (or the same file when there is only one)
 */
export const mergePdfFiles = async (files, name = 'documento.pdf') => {
  if (!files.length) throw new Error('No hay archivos para unir');
  if (files.length === 1) return files[0];
  const { PDFDocument } = await loadPdfLib();
  const merged = await PDFDocument.create();
  for (const file of files) {
    let src;
    try {
      src = await PDFDocument.load(await file.arrayBuffer());
    } catch {
      throw new Error(`No se pudo leer "${file.name}"`);
    }
    const pages = await merged.copyPages(src, src.getPageIndices());
    pages.forEach(p => merged.addPage(p));
  }
  const bytes = await merged.save();
  const fileName = /\.pdf$/i.test(name) ? name : `${name}.pdf`;
  return new File([bytes], fileName, { type: 'application/pdf' });
};