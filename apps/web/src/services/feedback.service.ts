import { feedbackRepo } from '../repositories/feedback.repo';
import type { FeedbackSubmission, FeedbackMetadata } from '@becoming/shared';
import { validateFeedback, sanitizeString } from '@becoming/shared';
import { createLogger } from '../lib/logger';

const logger = createLogger('feedback-service');

/**
 * Feedback service. PRD Section 9.1.
 */
export const feedbackService = {
  async submit(data: {
    userId: string;
    email: string;
    name: string;
    picture: string;
    role: string;
    category: 'bug' | 'feature_request' | 'general';
    subject: string;
    description: string;
    stepsToReproduce?: string;
    severity?: 'minor' | 'moderate' | 'major' | 'critical';
    metadata: FeedbackMetadata;
  }): Promise<{ success: boolean; referenceNumber?: string; errors?: string[] }> {
    const validation = validateFeedback({
      subject: data.subject,
      description: data.description,
    });

    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    const id = `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const feedback: FeedbackSubmission = {
      id,
      userId: data.userId,
      email: data.email,
      name: data.name,
      picture: data.picture,
      role: data.role,
      category: data.category,
      subject: sanitizeString(data.subject),
      description: sanitizeString(data.description),
      stepsToReproduce: data.stepsToReproduce ? sanitizeString(data.stepsToReproduce) : null,
      severity: data.category === 'bug' ? data.severity ?? null : null,
      isUrgent: data.severity === 'critical',
      screenshots: [],
      metadata: data.metadata,
      status: 'new',
      adminNotes: [],
      resolvedBy: null,
      resolvedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await feedbackRepo.create(feedback);
    logger.info('Feedback submitted', { feedbackId: id, category: data.category });

    return { success: true, referenceNumber: id.slice(3, 11) };
  },
};
