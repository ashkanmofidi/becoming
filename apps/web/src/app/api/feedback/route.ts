import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, rateLimit } from '@/app/api/middleware';
import { feedbackService } from '@/services/feedback.service';

/**
 * Feedback API. PRD Section 9.1.
 */
export async function POST(request: NextRequest) {
  const rateLimited = rateLimit(request);
  if (rateLimited) return rateLimited;

  const result = await requireAuth(request);
  if (result instanceof NextResponse) return result;

  const body = await request.json();
  const { session } = result;

  // Runtime input validation (P2-1)
  const VALID_CATEGORIES = ['bug', 'feature_request', 'general'];
  const category = body.category ?? 'general';
  if (typeof category !== 'string' || !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json(
      { error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` },
      { status: 400 },
    );
  }

  const subject = body.subject ?? '';
  if (typeof subject !== 'string' || subject.trim().length === 0) {
    return NextResponse.json({ error: 'subject is required' }, { status: 400 });
  }
  if (subject.length > 200) {
    return NextResponse.json({ error: 'subject must be under 200 characters' }, { status: 400 });
  }

  const description = body.description ?? '';
  if (typeof description !== 'string' || description.trim().length === 0) {
    return NextResponse.json({ error: 'description is required' }, { status: 400 });
  }
  if (description.length > 5000) {
    return NextResponse.json({ error: 'description must be under 5000 characters' }, { status: 400 });
  }

  // Validate optional fields
  const VALID_SEVERITIES = ['minor', 'moderate', 'major', 'critical'];
  if (body.severity !== undefined && body.severity !== null) {
    if (typeof body.severity !== 'string' || !VALID_SEVERITIES.includes(body.severity)) {
      return NextResponse.json({ error: `severity must be one of: ${VALID_SEVERITIES.join(', ')}` }, { status: 400 });
    }
  }
  if (body.stepsToReproduce !== undefined && body.stepsToReproduce !== null) {
    if (typeof body.stepsToReproduce !== 'string' || body.stepsToReproduce.length > 5000) {
      return NextResponse.json({ error: 'stepsToReproduce must be under 5000 characters' }, { status: 400 });
    }
  }

  const submitResult = await feedbackService.submit({
    userId: session.userId,
    email: session.email,
    name: session.name,
    picture: session.picture ?? '',
    role: session.role,
    category: body.category ?? 'general',
    subject: body.subject ?? '',
    description: body.description ?? '',
    stepsToReproduce: body.stepsToReproduce ?? null,
    severity: body.severity ?? null,
    metadata: {
      appVersion: process.env.APP_VERSION ?? '3.1.0',
      page: body.page ?? '',
      browser: request.headers.get('user-agent') ?? '',
      os: '',
      viewport: body.viewport ?? '',
      timezone: body.timezone ?? '',
      settingsSnapshot: {},
      sessionState: body.sessionState ?? '',
    },
  });

  if (!submitResult.success) {
    return NextResponse.json({ errors: submitResult.errors }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    referenceNumber: submitResult.referenceNumber,
  });
}
