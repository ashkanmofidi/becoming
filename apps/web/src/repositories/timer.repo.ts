import { kvClient, keys } from './kv.client';
import type { TimerState } from '@becoming/shared';

/**
 * Timer state repository. PRD Section 5.2.7, 18.
 * KV key: timer:{userId}
 */
export const timerRepo = {
  async getState(userId: string): Promise<TimerState | null> {
    return kvClient.get<TimerState>(keys.timer(userId));
  },

  async setState(userId: string, state: TimerState): Promise<void> {
    await kvClient.set(keys.timer(userId), state as unknown as Record<string, unknown>);
  },

  async clearState(userId: string): Promise<void> {
    await kvClient.del(keys.timer(userId));
  },

  /** Update heartbeat timestamp. PRD: every 15 seconds. */
  async updateHeartbeat(userId: string, deviceId: string): Promise<void> {
    const state = await this.getState(userId);
    if (state && state.controllingDeviceId === deviceId) {
      state.lastHeartbeatAt = new Date().toISOString();
      await this.setState(userId, state);
    }
  },

  /** Transfer control to another device. PRD Section 5.2.7. */
  async transferControl(userId: string, newDeviceId: string): Promise<void> {
    const state = await this.getState(userId);
    if (state) {
      state.controllingDeviceId = newDeviceId;
      state.lastHeartbeatAt = new Date().toISOString();
      await this.setState(userId, state);
    }
  },

  /** Check if heartbeat has timed out (60s). PRD Section 5.2.7. */
  async isHeartbeatExpired(userId: string): Promise<boolean> {
    const state = await this.getState(userId);
    if (!state || !state.lastHeartbeatAt) return true;
    const elapsed = Date.now() - new Date(state.lastHeartbeatAt).getTime();
    return elapsed > 60_000;
  },
};
