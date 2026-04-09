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

  const submitResult = await feedbackService.submit({
    userId: session.userId,
    email: session.email,
    name: session.name,
    role: session.role,
    category: body.category ?? 'general',
    subject: body.subject ?? '',
    description: body.description ?? '',
    stepsToReproduce: body.stepsToReproduce,
    severity: body.severity,
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
