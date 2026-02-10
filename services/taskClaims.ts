import { supabase } from '@/lib/supabaseClient';

export interface TaskClaimRow {
  task_id: string;
  claimed_at: string;
}

const TASK_CLAIMS_CACHE_PREFIX = 'wv_task_claims_v1:';

const getCacheKey = (userId: string) => `${TASK_CLAIMS_CACHE_PREFIX}${userId}`;

const readClaimsCache = (userId: string): TaskClaimRow[] | null => {
  try {
    const raw = localStorage.getItem(getCacheKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((item) => item?.task_id && item?.claimed_at) as TaskClaimRow[];
  } catch {
    return null;
  }
};

const writeClaimsCache = (userId: string, rows: TaskClaimRow[]) => {
  try {
    localStorage.setItem(getCacheKey(userId), JSON.stringify(rows));
  } catch {
    // Ignore cache write errors (quota/private mode)
  }
};

export const taskClaimsService = {
  getCachedClaims(userId: string) {
    return readClaimsCache(userId);
  },

  async listClaims(userId: string) {
    const { data, error } = await supabase
      .from('task_claims')
      .select('task_id, claimed_at')
      .eq('user_id', userId);

    if (error) throw error;
    const rows = (data ?? []) as TaskClaimRow[];
    writeClaimsCache(userId, rows);
    return rows;
  },

  upsertCachedClaim(userId: string, taskId: string, claimedAt: string) {
    const current = readClaimsCache(userId) ?? [];
    const next = current.filter((item) => item.task_id !== taskId);
    next.push({ task_id: taskId, claimed_at: claimedAt });
    writeClaimsCache(userId, next);
  },

  clearCachedClaims(userId: string) {
    try {
      localStorage.removeItem(getCacheKey(userId));
    } catch {
      // Ignore cache clear errors
    }
  },

  async claimTask(taskId: string, reward: { coins: number; xp: number; energy: number }) {
    const { data, error } = await supabase.rpc('claim_daily_task', {
      p_task_id: taskId,
      p_coin_reward: reward.coins,
      p_xp_reward: reward.xp,
      p_energy_reward: reward.energy
    });

    if (error) throw error;
    return Boolean(data);
  }
};
