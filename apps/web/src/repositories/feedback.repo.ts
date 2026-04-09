import { kvClient, keys } from './kv.client';
import type { FeedbackSubmission } from '@becoming/shared';
import { createLogger } from '../lib/logger';

const logger = createLogger('feedback-repo');

/**
 * Feedback repository. PRD Section 9.1, 18.
 * KV key: feedback:{id}, feedback:all (list)
 */
export const feedbackRepo = {
  async create(feedback: FeedbackSubmission): Promise<void> {
    await kvClient.set(keys.feedback(feedback.id), feedback as unknown as Record<string, unknown>);
    await kvClient.lpush(keys.feedbackList(), feedback.id);
    logger.info('Feedback created', { feedbackId: feedback.id, category: feedback.category });
  },

  async findById(feedbackId: string): Promise<FeedbackSubmission | null> {
    return kvClient.get<FeedbackSubmission>(keys.feedback(feedbackId));
  },

  async findAll(options?: { offset?: number; limit?: number }): Promise<FeedbackSubmission[]> {
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 50;
    const ids = await kvClient.lrange<string>(keys.feedbackList(), offset, offset + limit - 1);
    const items: FeedbackSubmission[] = [];
    for (const id of ids) {
      const feedback = await kvClient.get<FeedbackSubmission>(keys.feedback(id));
      if (feedback) items.push(feedback);
    }
    return items;
  },

  async getCount(): Promise<number> {
    return kvClient.llen(keys.feedbackList());
  },

  async update(feedbackId: string, data: Partial<FeedbackSubmission>): Promise<void> {
    const existing = await this.findById(feedbackId);
    if (!existing) {
      throw new Error(`Feedback ${feedbackId} not found`);
    }
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    await kvClient.set(keys.feedback(feedbackId), updated as unknown as Record<string, unknown>);
  },
};
