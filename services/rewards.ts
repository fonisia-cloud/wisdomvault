import { supabase } from '@/lib/supabaseClient';
import type { RewardRow } from '@/types/db';

export interface CreateRewardInput {
  title: string;
  price: number;
  icon: string;
  color: string;
}

export const rewardsService = {
  async list(userId: string) {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data ?? []) as RewardRow[];
  },

  async create(userId: string, input: CreateRewardInput) {
    const { data, error } = await supabase
      .from('rewards')
      .insert({ ...input, user_id: userId })
      .select('*')
      .single<RewardRow>();

    if (error) throw error;
    return data;
  },

  async remove(userId: string, id: string) {
    const { error } = await supabase
      .from('rewards')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }
};
