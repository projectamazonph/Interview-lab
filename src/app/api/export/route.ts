import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { generateDocx } from '@/lib/export/docx';
import { generatePdfBuffer } from '@/lib/export/pdf';
import { MAX_CONTENT_LENGTH, sanitizeFilename, type ExportRequest } from '@/lib/export/types';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as Partial<ExportRequest>;
    const { type, content, title } = body;

    if (!type || !content) {
      return NextResponse.json({ error: 'Type and content are required' }, { status: 400 });
    }
    if (type !== 'docx' && type !== 'pdf') {
      return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json({ error: 'Content is too long' }, { status: 400 });
    }

    const filename = sanitizeFilename(title);

    if (type === 'docx') {
      const buffer = await generateDocx(content, title ?? 'Document');
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${filename}.docx"`,
        },
      });
    }

    const buffer = generatePdfBuffer(content, title ?? 'Document');
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to generate export' }, { status: 500 });
  }
}
