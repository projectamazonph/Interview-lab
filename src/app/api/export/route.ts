import { NextRequest, NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { getUserIdFromHeader, verifyAuth } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromHeader(request);
    const user = await verifyAuth(userId);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, content, title } = body;

    if (type === 'docx') {
      return await generateDocx(content, title);
    } else if (type === 'pdf') {
      return await generatePdf(content, title);
    }

    return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to generate export' }, { status: 500 });
  }
}

async function generateDocx(content: string, title: string) {
  const lines = content.split('\n');
  const children: Paragraph[] = [];

  // Add title
  children.push(new Paragraph({
    children: [new TextRun({ text: title || 'Document', bold: true, size: 36 })],
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
  }));

  children.push(new Paragraph({ text: '' }));

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      children.push(new Paragraph({ text: '' }));
      continue;
    }

    // Detect headings (lines starting with #)
    if (trimmed.startsWith('### ')) {
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmed.replace('### ', ''), bold: true, size: 22 })],
        heading: HeadingLevel.HEADING_3,
      }));
    } else if (trimmed.startsWith('## ')) {
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmed.replace('## ', ''), bold: true, size: 26 })],
        heading: HeadingLevel.HEADING_2,
      }));
    } else if (trimmed.startsWith('# ')) {
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmed.replace('# ', ''), bold: true, size: 28 })],
        heading: HeadingLevel.HEADING_1,
      }));
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      children.push(new Paragraph({
        children: [new TextRun({ text: `\u2022 ${trimmed.replace(/^[-•]\s*/, '')}`, size: 22 })],
        indent: { left: 360 },
      }));
    } else {
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmed, size: 22 })],
      }));
    }
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const buffer = await Packer.toBuffer(doc);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${(title || 'document').replace(/[^a-zA-Z0-9]/g, '_')}.docx"`,
    },
  });
}

async function generatePdf(content: string, title: string) {
  // Generate PDF manually to avoid pdfkit font resolution issues in Next.js bundled environment.
  const lines = content.split('\n');
  const allLines: Array<{ text: string; size: number; bold: boolean; indent: number; color: string }> = [];

  // Title
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
      allLines.push({ text: `\u2022 ${trimmed.replace(/^[-•]\s*/, '')}`, size: 11, bold: false, indent: 20, color: '0 0 0' });
    } else {
      allLines.push({ text: trimmed, size: 11, bold: false, indent: 0, color: '0 0 0' });
    }
  }

  const pdfContent = buildSimplePdf(allLines);

  return new NextResponse(new Uint8Array(pdfContent), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${(title || 'document').replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`,
    },
  });
}

// Build a minimal valid PDF manually (no external font files needed)
function buildSimplePdf(allLines: Array<{ text: string; size: number; bold: boolean; indent: number; color: string }>): Buffer {
  // Build PDF structure
  const objects: string[] = [];
  let objectCount = 0;

  const addObject = (content: string): number => {
    objectCount++;
    objects.push(`${objectCount} 0 obj\n${content}\nendobj`);
    return objectCount;
  };

  // Object 1: Catalog
  const catalogObj = addObject('<< /Type /Catalog /Pages 2 0 R >>');

  // Object 2: Pages (will reference page objects)
  addObject('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');

  // Build page content stream
  let streamContent = '';
  let y = 770; // Start near top of page

  for (const item of allLines) {
    if (y < 50) break; // Stop if we run off the page

    const fontName = item.bold ? '/F2' : '/F1';
    const x = 50 + item.indent;

    // Escape special PDF characters
    const escapedText = item.text
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');

    streamContent += `BT\n${fontName} ${item.size} Tf\n${item.color} rg\n${x} ${y} Td\n(${escapedText}) Tj\nET\n`;
    y -= item.size + 4;
  }

  // Object 3: Stream
  const streamObjId = addObject(`<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream`);

  // Object 4: Page
  addObject(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${streamObjId} 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>`);

  // Object 5: Font (Courier)
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>');

  // Object 6: Font (Courier-Bold)
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>');

  // Build PDF
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];

  for (let i = 0; i < objects.length; i++) {
    offsets.push(pdf.length);
    pdf += `${objects[i]}\n`;
  }

  // Cross-reference table
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objectCount + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (const offset of offsets) {
    pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objectCount + 1} /Root ${catalogObj} 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'binary');
}
