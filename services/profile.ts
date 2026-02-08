import { supabase } from '@/lib/supabaseClient';
import type { ProfileRow } from '@/types/db';

export const profileService = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single<ProfileRow>();

    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, patch: Partial<Pick<ProfileRow, 'display_name' | 'xp' | 'coins' | 'energy' | 'max_energy'>>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', userId)
      .select('*')
      .single<ProfileRow>();

    if (error) throw error;
    return data;
  }
};
