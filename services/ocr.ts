import { supabase } from '@/lib/supabaseClient';

const getFunctionHeaders = async () => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const ocrService = {
  async recognizeQuestion(imageDataUrl: string) {
    const headers = await getFunctionHeaders();
    const { data, error } = await supabase.functions.invoke('ocr-question', {
      body: { imageDataUrl },
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
      throw new Error(detail || 'OCR function failed');
    }

    if (!data?.questionText) {
      throw new Error('未识别到题目文本');
    }

    return data.questionText as string;
  }
};
