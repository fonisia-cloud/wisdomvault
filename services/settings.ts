import { supabase } from '@/lib/supabaseClient';
import type { AppSettingsRow, ParentSettingsRow } from '@/types/db';

export const settingsService = {
  async getAppSettings(userId: string) {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('user_id', userId)
      .single<AppSettingsRow>();

    if (error) throw error;
    return data;
  },

  async updateAppSettings(userId: string, patch: Partial<Pick<AppSettingsRow, 'font_size' | 'theme_color'>>) {
    const { data, error } = await supabase
      .from('app_settings')
      .update(patch)
      .eq('user_id', userId)
      .select('*')
      .single<AppSettingsRow>();

    if (error) throw error;
    return data;
  },

  async getParentSettings(userId: string) {
    const { data, error } = await supabase
      .from('parent_settings')
      .select('*')
      .eq('user_id', userId)
      .single<ParentSettingsRow>();

    if (error) throw error;
    return data;
  },

  async updateParentSettings(
    userId: string,
    patch: Partial<Pick<ParentSettingsRow, 'pin' | 'daily_time_limit' | 'is_rest_mode'>>
  ) {
    const { data, error } = await supabase
      .from('parent_settings')
      .update(patch)
      .eq('user_id', userId)
      .select('*')
      .single<ParentSettingsRow>();

    if (error) throw error;
    return data;
  }
};
