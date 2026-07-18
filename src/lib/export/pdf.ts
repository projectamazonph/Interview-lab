export interface PdfLine {
  text: string;
  size: number;
  bold: boolean;
  indent: number;
  color: string;
}

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_TOP = 770;
const MARGIN_BOTTOM = 50;
const MARGIN_LEFT = 50;

/** Parses markdown-ish prefixes into PDF line styling (Courier, no external fonts). */
function buildLines(content: string, title: string): PdfLine[] {
  const lines = content.split('\n');
  const allLines: PdfLine[] = [];

  allLines.push({ text: title || 'Document', size: 24, bold: true, indent: 0, color: '0 0 0' });
  allLines.push({ text: '', size: 8, bold: false, indent: 0, color: '0 0 0' });

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      allLines.push({ text: '', size: 4, bold: false, indent: 0, color: '0 0 0' });
      continue;
    }
    if (trimmed.startsWith('### ')) {
      allLines.push({ text: trimmed.replace('### ', ''), size: 12, bold: true, indent: 0, color: '0 0 0' });
    } else if (trimmed.startsWith('## ')) {
      allLines.push({ text: trimmed.replace('## ', ''), size: 14, bold: true, indent: 0, color: '0 0 0' });
    } else if (trimmed.startsWith('# ')) {
      allLines.push({ text: trimmed.replace('# ', ''), size: 16, bold: true, indent: 0, color: '0 0 0' });
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      allLines.push({ text: `• ${trimmed.replace(/^[-•]\s*/, '')}`, size: 11, bold: false, indent: 20, color: '0 0 0' });
    } else {
      allLines.push({ text: trimmed, size: 11, bold: false, indent: 0, color: '0 0 0' });
    }
  }

  return allLines;
}

function escapePdfText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/**
 * Builds a minimal valid multi-page PDF (Courier fonts, no external font files).
 * Unlike the previous single-page builder, this paginates: when content would
 * run past the bottom margin it starts a new page, so nothing is truncated.
 */
export function generatePdfBuffer(content: string, title: string): Buffer {
  const lines = buildLines(content, title);

  // Split content into pages based on available vertical space.
  const pages: PdfLine[][] = [];
  let current: PdfLine[] = [];
  let y = MARGIN_TOP;

  for (const item of lines) {
    const lineHeight = item.size + 4;
    if (y - lineHeight < MARGIN_BOTTOM) {
      pages.push(current);
      current = [];
      y = MARGIN_TOP;
    }
    current.push(item);
    y -= lineHeight;
  }
  if (current.length > 0) pages.push(current);

  const objects: string[] = [];
  let objectCount = 0;
  const addObject = (contentStr: string): number => {
    objectCount++;
    objects.push(`${objectCount} 0 obj\n${contentStr}\nendobj`);
    return objectCount;
  };

  addObject('<< /Type /Catalog /Pages 2 0 R >>');
  const contentObjIds: number[] = [];

  for (const pageLines of pages) {
    let stream = '';
    let py = MARGIN_TOP;
    for (const item of pageLines) {
      const fontName = item.bold ? '/F2' : '/F1';
      const x = MARGIN_LEFT + item.indent;
      stream += `BT\n${fontName} ${item.size} Tf\n${item.color} rg\n${x} ${py} Td\n(${escapePdfText(item.text)}) Tj\nET\n`;
      py -= item.size + 4;
    }
    const streamObjId = addObject(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
    contentObjIds.push(streamObjId);
  }

  // Pages object (object 2) references all page objects. Page objects are laid out
  // immediately after this one at positions 3, 5, 7, ... (each page gets one object),
  // matching the content-stream object ids produced above.
  const pagesKids = pages.map((_, i) => `${3 + i * 2} 0 R`).join(' ');
  addObject(`<< /Type /Pages /Kids [${pagesKids}] /Count ${pages.length} >>`);

  for (let i = 0; i < pages.length; i++) {
    addObject(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Contents ${contentObjIds[i]} 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>`,
    );
  }

  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>');
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>');

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(pdf, 'binary'));
    pdf += `${objects[i]}\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, 'binary');
  pdf += `xref\n0 ${objectCount + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (const offset of offsets) {
    pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'binary');
}
