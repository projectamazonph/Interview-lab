import { createAIHandler } from '@/lib/ai/handlers';
import { coachConfig } from '@/lib/ai/coach';

export const POST = createAIHandler(coachConfig);
