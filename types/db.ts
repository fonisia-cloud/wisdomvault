export type MistakeStatus = 'pending' | 'completed';

export interface ProfileRow {
  id: string;
  display_name: string;
  xp: number;
  coins: number;
  energy: number;
  max_energy: number;
  created_at: string;
  updated_at: string;
}

export interface MistakeRow {
  id: string;
  user_id: string;
  image_url: string;
  tags?: string[];
  difficulty: number;
  subject?: string;
  question_text?: string;
  note?: string;
  status: MistakeStatus;
  created_at: string;
  updated_at: string;
}

export interface RewardRow {
  id: string;
  user_id: string;
  title: string;
  price: number;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface AppSettingsRow {
  user_id: string;
  font_size: 'small' | 'medium' | 'large';
  theme_color: 'primary' | 'blue' | 'green';
  created_at: string;
  updated_at: string;
}

export interface ParentSettingsRow {
  user_id: string;
  pin: string;
  daily_time_limit: number;
  is_rest_mode: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageRow {
  id: string;
  user_id: string;
  mistake_id: string | null;
  role: 'system' | 'user' | 'assistant';
  content: string;
  created_at: string;
}
