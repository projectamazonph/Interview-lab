import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

/** Parses markdown-ish line prefixes into docx paragraph styling. */
function buildParagraph(line: string): Paragraph {
  const trimmed = line.trim();

  if (trimmed.startsWith('### ')) {
    return new Paragraph({
      children: [new TextRun({ text: trimmed.replace('### ', ''), bold: true, size: 22 })],
      heading: HeadingLevel.HEADING_3,
    });
  }
  if (trimmed.startsWith('## ')) {
    return new Paragraph({
      children: [new TextRun({ text: trimmed.replace('## ', ''), bold: true, size: 26 })],
      heading: HeadingLevel.HEADING_2,
    });
  }
  if (trimmed.startsWith('# ')) {
    return new Paragraph({
      children: [new TextRun({ text: trimmed.replace('# ', ''), bold: true, size: 28 })],
      heading: HeadingLevel.HEADING_1,
    });
  }
  if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
    return new Paragraph({
      children: [new TextRun({ text: `• ${trimmed.replace(/^[-•]\s*/, '')}`, size: 22 })],
      indent: { left: 360 },
    });
  }
  return new Paragraph({
    children: [new TextRun({ text: trimmed, size: 22 })],
  });
}

export async function generateDocx(content: string, title: string): Promise<Buffer> {
  const lines = content.split('\n');
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      children: [new TextRun({ text: title || 'Document', bold: true, size: 36 })],
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
    }),
  );
  children.push(new Paragraph({ text: '' }));

  for (const line of lines) {
    if (!line.trim()) {
      children.push(new Paragraph({ text: '' }));
      continue;
    }
    children.push(buildParagraph(line));
  }

  const doc = new Document({ sections: [{ properties: {}, children }] });
  return Packer.toBuffer(doc);
}
