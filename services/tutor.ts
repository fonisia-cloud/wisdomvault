import { supabase } from '@/lib/supabaseClient';
import type { ChatMessageRow } from '@/types/db';

export interface TutorInputMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface TutorAskPayload {
  mistakeId?: string;
  mistakeContext?: {
    tags?: string[];
    questionText?: string;
    note?: string;
    difficulty?: number;
  };
  messages: TutorInputMessage[];
}

const uuidReg = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const getFunctionHeaders = async () => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const tutorService = {
  async listMessages(mistakeId: string) {
    if (!uuidReg.test(mistakeId)) return [];

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('mistake_id', mistakeId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data ?? []) as ChatMessageRow[];
  },

  async ask(payload: TutorAskPayload) {
    const headers = await getFunctionHeaders();
    const { data, error } = await supabase.functions.invoke('ai-tutor', {
      body: payload,
      headers
    });

    if (error) {
      let detail = error.message;
      try {
        const response = (error as any).context as Response | undefined;
        if (response) {
          const json = await response.json();
          if (json?.error) detail = json.error;
        }
      } catch {
        // ignore parsing errors
      }
      throw new Error(detail || 'AI tutor request failed');
    }

    return data as {
      reply: string;
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      };
    };
  }
};
