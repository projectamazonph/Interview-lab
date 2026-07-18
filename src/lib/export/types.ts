export type ExportType = 'docx' | 'pdf';

export interface ExportRequest {
  type: ExportType;
  content: string;
  title?: string;
}

export const MAX_CONTENT_LENGTH = 50_000;

export function sanitizeFilename(title: string | undefined, fallback = 'document'): string {
  return (title || fallback).replace(/[^a-zA-Z0-9]/g, '_');
}
