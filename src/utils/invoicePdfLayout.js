// frontend/src/utils/invoicePdfLayout.js
// Layout of the Progestor invoices (BabyMedic, Nexa Travel, Travel Medical Care).
//
// The three templates (letter size, 215.9 x 279.4 mm) share the same geometry:
// a blue/orange header bar for the table, 4 item rows separated by black lines,
// and a lower block (subtotal/tax/total, bank details, footer note).
//
// Instead of writing each concept on one fixed line (long concepts overflowed
// into the other columns), every row is sized by its content:
//   - the concept is wrapped to the DESCRIPTION column width;
//   - the row grows to fit its lines (never smaller than the template row);
//   - the separator lines are drawn at the new positions;
//   - the lower block of the template (totals + bank details) is moved down by
//     the extra height; the footer note stays at the bottom of the page;
//   - if everything does not fit on one page, rows continue on a new page
//     (with the table header bar repeated) and the lower block goes after them.
// With short concepts the result is identical to the original template.

// ---- Template geometry (mm), measured on the template images ----
const TEMPLATE_W = 215.9;
const TEMPLATE_H = 279.4;
const HEADER_BAR_TOP = 78.4;        // table header bar (DESCRIPTION / QUANTITÉ ...)
const TABLE_TOP = 88.9;             // first row starts under the bar
const ROW_LINES = [102.0, 117.2, 132.4, 147.7]; // bottom line of each row (center)
const LOWER_TOP = 147.3;            // lower block starts just above the last line
const LOWER_END = 221;              // end of the lower block (after the bank details)
const FOOTER_TOP = 249;             // footer note ("Ne jamais indiquer..."): stays at the page bottom
const FOOTER_GAP = 4;               // minimum space between the lower block and the footer
const PAGE_BOTTOM_MARGIN = 10;      // free space kept at the bottom of every page
const CONT_PAGE_TOP = 15;           // where the header bar goes on continuation pages

const LINE_X1 = 8.2;
const LINE_X2 = 204.5;
const LINE_WIDTH = 0.35;

// ---- Columns ----
export const INVOICE_COLUMNS = {
  descriptionX: 15,
  descriptionWidth: 78,   // up to the QUANTITÉ column (starts at ~96 mm)
  quantityX: 106,
  priceX: 150,
  totalX: 195,
};

const FONT_SIZE = 10;
const LINE_HEIGHT = 4.4;   // mm between wrapped lines at 10 pt
const ROW_PADDING = 3;     // mm above and below the text inside a row
const CAP_HEIGHT = 2.5;    // approx. cap height of 10 pt helvetica, to center text

// Totals block: y positions in the ORIGINAL template (they move with the block)
export const TOTALS_Y = { subtotal: 155, tax: 166, total: 177 };

// Draws a horizontal slice [y1, y2] of the template at targetY on the current page
const drawTemplateSlice = (doc, img, y1, y2, targetY) => {
  doc.saveGraphicsState();
  doc.rect(0, targetY, TEMPLATE_W, y2 - y1, null);
  doc.clip();
  doc.discardPath();
  doc.addImage(img, 'JPEG', 0, targetY - y1, TEMPLATE_W, TEMPLATE_H, 'invoice-template', 'FAST');
  doc.restoreGraphicsState();
};

const drawSeparator = (doc, y) => {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(LINE_WIDTH);
  doc.line(LINE_X1, y, LINE_X2, y);
};

/**
 * Renders the template and the item rows.
 *
 * @param doc            jsPDF instance (letter, mm), still on page 1 and empty
 * @param templateBase64 template image (data URL)
 * @param items          4 entries: { description, quantity, price, total } (strings, may be empty)
 * @returns { lowerPage, offset } → page that holds the lower block and how many mm
 *          it moved down (add `offset` to any y of that block, e.g. TOTALS_Y).
 */
export const renderInvoiceLayout = (doc, templateBase64, items) => {
  const pageH = doc.internal.pageSize.getHeight();
  const pageLimit = pageH - PAGE_BOTTOM_MARGIN;
  const { descriptionX, descriptionWidth, quantityX, priceX, totalX } = INVOICE_COLUMNS;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONT_SIZE);

  // Minimum height of each row = the template row
  const minHeights = ROW_LINES.map((y, i) => y - (i === 0 ? TABLE_TOP : ROW_LINES[i - 1]));

  const rows = items.map((item, i) => {
    const text = String(item.description || '').trim();
    const lines = text ? doc.splitTextToSize(text, descriptionWidth) : [];
    const needed = lines.length * LINE_HEIGHT + ROW_PADDING * 2;
    return { ...item, lines, height: Math.max(minHeights[i] ?? minHeights[minHeights.length - 1], needed) };
  });

  const tableHeight = rows.reduce((s, r) => s + r.height, 0);
  const originalTableHeight = ROW_LINES[ROW_LINES.length - 1] - TABLE_TOP;
  const lowerHeight = LOWER_END - LOWER_TOP;

  // Page 1: everything above the rows
  drawTemplateSlice(doc, templateBase64, 0, TABLE_TOP, 0);

  // Text of the rows (gray, as before)
  const writeRowText = (row, lines, top, height, withNumbers) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(FONT_SIZE);
    doc.setTextColor(60, 60, 60);
    // Text block vertically centered in the row
    const blockH = (lines.length - 1) * LINE_HEIGHT;
    const firstBaseline = top + (height - blockH) / 2 + CAP_HEIGHT / 2;
    lines.forEach((line, k) => doc.text(line, descriptionX, firstBaseline + k * LINE_HEIGHT));
    if (withNumbers) {
      doc.text(row.quantity || '', quantityX, firstBaseline, { align: 'center' });
      doc.text(row.price || '', priceX, firstBaseline, { align: 'center' });
      doc.text(row.total || '', totalX, firstBaseline, { align: 'right' });
    }
  };

  const newContinuationPage = () => {
    doc.addPage();
    drawTemplateSlice(doc, templateBase64, HEADER_BAR_TOP, TABLE_TOP, CONT_PAGE_TOP);
    return CONT_PAGE_TOP + (TABLE_TOP - HEADER_BAR_TOP);
  };

  const lineOffset = ROW_LINES[3] - LOWER_TOP; // the last row line sits this far inside the lower block
  const lowerFits = (rowsEnd) => rowsEnd - lineOffset + lowerHeight <= FOOTER_TOP - FOOTER_GAP;
  const onePage = tableHeight <= originalTableHeight || lowerFits(TABLE_TOP + tableHeight);
  const contentStart = CONT_PAGE_TOP + (TABLE_TOP - HEADER_BAR_TOP);

  let y = TABLE_TOP;
  rows.forEach((row, i) => {
    const isLast = i === rows.length - 1;

    if (onePage || y + row.height <= pageLimit) {
      writeRowText(row, row.lines, y, row.height, row.lines.length > 0);
      y += row.height;
    } else if (row.height <= pageLimit - contentStart) {
      // The whole row fits on a fresh page → move it there
      drawSeparator(doc, y);
      y = newContinuationPage();
      writeRowText(row, row.lines, y, row.height, row.lines.length > 0);
      y += row.height;
    } else {
      // Very long concept: split its lines across pages
      const lines = [...row.lines];
      let first = true;
      while (lines.length) {
        const avail = pageLimit - y - ROW_PADDING * 2;
        const n = Math.min(lines.length, Math.floor(avail / LINE_HEIGHT));
        if (n < 1) { drawSeparator(doc, y); y = newContinuationPage(); continue; }
        const chunk = lines.splice(0, n);
        const h = chunk.length * LINE_HEIGHT + ROW_PADDING * 2;
        writeRowText(row, chunk, y, h, first);
        y += h;
        first = false;
        if (lines.length) { drawSeparator(doc, y); y = newContinuationPage(); }
      }
    }
    if (!isLast) drawSeparator(doc, y); // the last line belongs to the lower block
  });

  // Lower block (it starts with the last row line): right after the rows,
  // or at the top of a new page when it does not fit.
  let lowerTarget = y - lineOffset;
  if (!lowerFits(y)) {
    drawSeparator(doc, y); // close the table on this page
    doc.addPage();
    lowerTarget = CONT_PAGE_TOP;
  }
  drawTemplateSlice(doc, templateBase64, LOWER_TOP, LOWER_END, lowerTarget);
  drawTemplateSlice(doc, templateBase64, FOOTER_TOP, TEMPLATE_H, FOOTER_TOP);

  const pages = doc.getNumberOfPages();
  if (pages > 1) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    for (let p = 1; p <= pages; p += 1) {
      doc.setPage(p);
      doc.text(`${p} / ${pages}`, TEMPLATE_W - 12, pageH - 5, { align: 'right' });
    }
  }

  doc.setPage(1);
  return { lowerPage: pages, offset: lowerTarget - LOWER_TOP };
};