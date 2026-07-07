import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { sanitizeText } from '@/lib/sanitize';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const admin = await getUserFromRequest(request);
    if (!admin || !admin.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized — admin access required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const difficulty = searchParams.get('difficulty');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (role && role !== 'all') where.role = role;
    if (difficulty && difficulty !== 'all') where.difficulty = difficulty;
    if (status && status !== 'all') where.status = status;

    const questions = await db.question.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const total = await db.question.count({ where });

    return NextResponse.json({ questions, total });
  } catch (error) {
    console.error('Admin Questions GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getUserFromRequest(request);
    if (!admin || !admin.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized — admin access required' }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.question || typeof data.question !== 'string' || !data.question.trim()) {
      return NextResponse.json({ error: 'Question text is required' }, { status: 400 });
    }

    // Validate enum fields against allowed values
    const VALID_ROLES = ['PPC VA', 'Account VA', 'Listing VA', 'Reporting VA', 'Agency VA', 'Senior PPC Assistant', 'General'];
    const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
    const VALID_TYPES = ['behavioral', 'technical', 'scenario', 'case_study', 'tool_specific', 'trick'];
    const VALID_SKILL_AREAS = ['PPC', 'Excel', 'Seller Central', 'client_communication', 'reporting', 'marketplace_basics', 'optimization', 'keyword_research', 'campaign_structure'];
    const VALID_STATUSES = ['draft', 'published', 'archived'];

    if (data.role && !VALID_ROLES.includes(data.role)) {
      return NextResponse.json({ error: 'Invalid role value' }, { status: 400 });
    }
    if (data.difficulty && !VALID_DIFFICULTIES.includes(data.difficulty)) {
      return NextResponse.json({ error: 'Invalid difficulty value' }, { status: 400 });
    }
    if (data.type && !VALID_TYPES.includes(data.type)) {
      return NextResponse.json({ error: 'Invalid type value' }, { status: 400 });
    }
    if (data.skillArea && !VALID_SKILL_AREAS.includes(data.skillArea)) {
      return NextResponse.json({ error: 'Invalid skillArea value' }, { status: 400 });
    }
    if (data.status && !VALID_STATUSES.includes(data.status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    // Sanitize text fields
    const sanitizedQuestion = sanitizeText(data.question) || '';
    if (!sanitizedQuestion) {
      return NextResponse.json({ error: 'Invalid question text' }, { status: 400 });
    }

    const question = await db.question.create({
      data: {
        role: data.role || 'General',
        difficulty: data.difficulty || 'beginner',
        type: data.type || 'technical',
        skillArea: data.skillArea || 'PPC',
        question: sanitizedQuestion,
        whyEmployersAsk: sanitizeText(data.whyEmployersAsk),
        strongAnswerPoints: data.strongAnswerPoints ? JSON.stringify(data.strongAnswerPoints) : null,
        weakAnswerWarnings: data.weakAnswerWarnings ? JSON.stringify(data.weakAnswerWarnings) : null,
        sampleAnswer: sanitizeText(data.sampleAnswer),
        answerFormat: sanitizeText(data.answerFormat),
        timeLimit: typeof data.timeLimit === 'number' ? data.timeLimit : null,
        status: data.status || 'draft',
      },
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error('Admin Questions POST error:', error);
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await getUserFromRequest(request);
    if (!admin || !admin.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized — admin access required' }, { status: 401 });
    }

    const data = await request.json();
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json({ error: 'Question ID required' }, { status: 400 });
    }

    // Validate enum fields for updates
    const VALID_ROLES = ['PPC VA', 'Account VA', 'Listing VA', 'Reporting VA', 'Agency VA', 'Senior PPC Assistant', 'General'];
    const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
    const VALID_TYPES = ['behavioral', 'technical', 'scenario', 'case_study', 'tool_specific', 'trick'];
    const VALID_SKILL_AREAS = ['PPC', 'Excel', 'Seller Central', 'client_communication', 'reporting', 'marketplace_basics', 'optimization', 'keyword_research', 'campaign_structure'];
    const VALID_STATUSES = ['draft', 'published', 'archived'];

    // Build update object with only provided fields, validating and sanitizing
    const update: Record<string, unknown> = {};
    if (updateData.role !== undefined) {
      if (!VALID_ROLES.includes(updateData.role)) return NextResponse.json({ error: 'Invalid role value' }, { status: 400 });
      update.role = updateData.role;
    }
    if (updateData.difficulty !== undefined) {
      if (!VALID_DIFFICULTIES.includes(updateData.difficulty)) return NextResponse.json({ error: 'Invalid difficulty value' }, { status: 400 });
      update.difficulty = updateData.difficulty;
    }
    if (updateData.type !== undefined) {
      if (!VALID_TYPES.includes(updateData.type)) return NextResponse.json({ error: 'Invalid type value' }, { status: 400 });
      update.type = updateData.type;
    }
    if (updateData.skillArea !== undefined) {
      if (!VALID_SKILL_AREAS.includes(updateData.skillArea)) return NextResponse.json({ error: 'Invalid skillArea value' }, { status: 400 });
      update.skillArea = updateData.skillArea;
    }
    if (updateData.question !== undefined) {
      const sanitized = sanitizeText(updateData.question);
      if (!sanitized) return NextResponse.json({ error: 'Invalid question text' }, { status: 400 });
      update.question = sanitized;
    }
    if (updateData.whyEmployersAsk !== undefined) update.whyEmployersAsk = sanitizeText(updateData.whyEmployersAsk);
    if (updateData.strongAnswerPoints !== undefined) update.strongAnswerPoints = updateData.strongAnswerPoints ? JSON.stringify(updateData.strongAnswerPoints) : null;
    if (updateData.weakAnswerWarnings !== undefined) update.weakAnswerWarnings = updateData.weakAnswerWarnings ? JSON.stringify(updateData.weakAnswerWarnings) : null;
    if (updateData.sampleAnswer !== undefined) update.sampleAnswer = sanitizeText(updateData.sampleAnswer);
    if (updateData.answerFormat !== undefined) update.answerFormat = sanitizeText(updateData.answerFormat);
    if (updateData.timeLimit !== undefined) update.timeLimit = typeof updateData.timeLimit === 'number' ? updateData.timeLimit : null;
    if (updateData.status !== undefined) {
      if (!VALID_STATUSES.includes(updateData.status)) return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
      update.status = updateData.status;
    }

    const question = await db.question.update({
      where: { id },
      data: update,
    });

    return NextResponse.json(question);
  } catch (error) {
    console.error('Admin Questions PUT error:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}
