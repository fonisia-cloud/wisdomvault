import { supabase } from '@/lib/supabaseClient';

export interface TaskClaimRow {
  task_id: string;
  claimed_at: string;
}

export const taskClaimsService = {
  async listClaims(userId: string) {
    const { data, error } = await supabase
      .from('task_claims')
      .select('task_id, claimed_at')
      .eq('user_id', userId);

    if (error) throw error;
    return (data ?? []) as TaskClaimRow[];
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
