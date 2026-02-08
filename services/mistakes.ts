import { supabase } from '@/lib/supabaseClient';
import type { MistakeRow, MistakeStatus } from '@/types/db';

export interface CreateMistakeInput {
  image_url: string;
  tags: string[];
  difficulty: number;
  question_text: string;
  note: string;
  status?: MistakeStatus;
}

export const mistakesService = {
  async list(userId: string) {
    const { data, error } = await supabase
      .from('mistakes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as MistakeRow[];
  },

  async create(userId: string, input: CreateMistakeInput) {
    const payload = {
      user_id: userId,
      image_url: input.image_url,
      tags: input.tags,
      subject: input.tags[0] ?? '未分类',
      difficulty: input.difficulty,
      question_text: input.question_text,
      note: input.note,
      status: input.status ?? 'pending'
    };

    const firstTry = await supabase.from('mistakes').insert(payload).select('*').single<MistakeRow>();

    if (!firstTry.error) {
      return firstTry.data;
    }

    if (firstTry.error.code === 'PGRST204' && String(firstTry.error.message).includes('note')) {
      const fallback = await supabase
        .from('mistakes')
        .insert({
          user_id: userId,
          image_url: input.image_url,
          tags: input.tags,
          subject: input.tags[0] ?? '未分类',
          difficulty: input.difficulty,
          question_text: input.question_text,
          status: input.status ?? 'pending'
        })
        .select('*')
        .single<MistakeRow>();

      if (fallback.error) throw fallback.error;
      return fallback.data;
    }

    if (firstTry.error.code === 'PGRST204' && String(firstTry.error.message).includes('question_text')) {
      const fallbackWithoutQuestion = await supabase
        .from('mistakes')
        .insert({
          user_id: userId,
          image_url: input.image_url,
          tags: input.tags,
          subject: input.tags[0] ?? '未分类',
          difficulty: input.difficulty,
          note: input.question_text,
          status: input.status ?? 'pending'
        })
        .select('*')
        .single<MistakeRow>();

      if (fallbackWithoutQuestion.error) throw fallbackWithoutQuestion.error;
      return fallbackWithoutQuestion.data;
    }

    throw firstTry.error;
  },

  async updateStatus(userId: string, mistakeId: string, status: MistakeStatus) {
    const { data, error } = await supabase
      .from('mistakes')
      .update({ status })
      .eq('id', mistakeId)
      .eq('user_id', userId)
      .select('*')
      .single<MistakeRow>();

    if (error) throw error;
    return data;
  },

  async remove(userId: string, mistakeId: string) {
    const { error } = await supabase.from('mistakes').delete().eq('id', mistakeId).eq('user_id', userId);
    if (error) throw error;
  }
};
