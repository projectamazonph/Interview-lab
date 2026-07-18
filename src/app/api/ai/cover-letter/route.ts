import { createAIHandler } from '@/lib/ai/handlers';
import { coverLetterConfig } from '@/lib/ai/cover-letter';

export const POST = createAIHandler(coverLetterConfig);
