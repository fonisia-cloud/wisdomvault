import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

type InputMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type RequestBody = {
  mistakeId?: string;
  mistakeContext?: {
    tags?: string[];
    questionText?: string;
    note?: string;
    difficulty?: number;
  };
  messages?: InputMessage[];
};

const normalizeAiText = (raw: string) => {
  const collapsed = (raw || '').replace(/\\{2,}/g, '\\');
  return collapsed
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\$\$([^$]+)\$\$/g, '$1')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/\\left\s*([\(\[\{\|])/g, '$1')
    .replace(/\\right\s*([\)\]\}\|])/g, '$1')
    .replace(/\\left|\\right/g, '')
    .replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '($1)/($2)')
    .replace(/\\times|\\cdot/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/[{}]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const iflowApiKey = Deno.env.get('IFLOW_API_KEY');
    const iflowBaseUrl = Deno.env.get('IFLOW_BASE_URL') ?? 'https://apis.iflow.cn/v1';
    const iflowModel = Deno.env.get('IFLOW_MODEL') ?? 'Qwen3-VL-Plus';

    if (!supabaseUrl || !supabaseAnonKey || !iflowApiKey) {
      return new Response(JSON.stringify({ error: 'Server env is not configured.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const authHeader = req.headers.get('Authorization') ?? '';

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = (await req.json()) as RequestBody;
    const incomingMessages = (body.messages ?? []).filter((m) => m.content?.trim());
    const recentMessages = incomingMessages.slice(-10);

    const contextLines: string[] = [];
    if (body.mistakeContext?.tags?.length) contextLines.push(`知识点: ${body.mistakeContext.tags.join('、')}`);
    if (body.mistakeContext?.difficulty) contextLines.push(`难度: ${body.mistakeContext.difficulty}/5`);
    if (body.mistakeContext?.questionText) contextLines.push(`题目内容:\n${body.mistakeContext.questionText}`);
    if (body.mistakeContext?.note) contextLines.push(`学生笔记: ${body.mistakeContext.note}`);

    const systemPrompt = [
      '你是一个给中小学生讲题的苏格拉底导师。',
      '请优先用启发式问题引导，不要直接给最终答案。',
      '语言简洁、鼓励式、中文输出。',
      '数学表达式尽量使用普通可读形式（如 (3/4) × 20），不要输出 LaTeX 标记（如 $...$, \\frac, \\left, \\right）。',
      '当学生连续两次表示不懂时，给更具体的一步提示。',
      '如果题目信息不充分，先问澄清问题。',
      contextLines.length ? `题目上下文:\n${contextLines.join('\n')}` : ''
    ]
      .filter(Boolean)
      .join('\n');

    const iflowPayload = {
      model: iflowModel,
      stream: false,
      temperature: 0.6,
      max_tokens: 500,
      messages: [{ role: 'system', content: systemPrompt }, ...recentMessages]
    };

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), 25000);

    let iflowResponse: Response;
    try {
      iflowResponse = await fetch(`${iflowBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${iflowApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(iflowPayload),
        signal: abortController.signal
      });
    } finally {
      clearTimeout(timeout);
    }

    const iflowJson = await iflowResponse.json();

    if (!iflowResponse.ok) {
      return new Response(
        JSON.stringify({ error: iflowJson?.error?.message || 'iFlow request failed', raw: iflowJson }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const rawReply = iflowJson?.choices?.[0]?.message?.content?.trim() || '我们换一个角度想想，你愿意先说说你最不确定的步骤吗？';
    const reply = normalizeAiText(rawReply);

    const latestUserMessage = recentMessages.filter((m) => m.role === 'user').slice(-1)[0];

    const records = [] as Array<{
      user_id: string;
      mistake_id: string | null;
      role: 'user' | 'assistant';
      content: string;
    }>;

    if (latestUserMessage) {
      records.push({
        user_id: user.id,
        mistake_id: body.mistakeId ?? null,
        role: 'user',
        content: latestUserMessage.content
      });
    }

    records.push({
      user_id: user.id,
      mistake_id: body.mistakeId ?? null,
      role: 'assistant',
      content: reply
    });

    const { error: saveError } = await supabase.from('chat_messages').insert(records);
    if (saveError) {
      console.error('save chat message error', saveError);
    }

    return new Response(
      JSON.stringify({
        reply,
        usage: iflowJson?.usage ?? null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
