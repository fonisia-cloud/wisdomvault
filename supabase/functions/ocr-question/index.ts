import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

type RequestBody = {
  imageDataUrl?: string;
};

const normalizeOcrText = (raw: string) => {
  return raw
    .replace(/```(?:markdown|md|text)?/gi, '')
    .replace(/```/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '$1/$2')
    .replace(/\t+/g, ' × ')
    .replace(/\\times|\\cdot/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\leq\b|\\le\b/g, '≤')
    .replace(/\\geq\b|\\ge\b/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\approx/g, '≈')
    .replace(/\$\$([^$]+)\$\$/g, '$1')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/\\\((.*?)\\\)/g, '$1')
    .replace(/\\\[(.*?)\\\]/g, '$1')
    .replace(/^\s*\$\$\s*$/gm, '')
    .replace(/\$\$\s*$/gm, '')
    .replace(/[{}]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
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
    const iflowVisionModel = Deno.env.get('IFLOW_VISION_MODEL') ?? Deno.env.get('IFLOW_MODEL') ?? 'Qwen3-VL-Plus';

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
    const imageDataUrl = body.imageDataUrl?.trim();

    if (!imageDataUrl || !imageDataUrl.startsWith('data:image/')) {
      return new Response(JSON.stringify({ error: 'Invalid imageDataUrl' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const payload = {
      model: iflowVisionModel,
      stream: false,
      temperature: 0.2,
      max_tokens: 800,
      messages: [
        {
          role: 'system',
          content:
            '你是 OCR 与题目结构化助手。请尽量完整还原题面，保留换行、编号、选项与子问。优先输出可直接阅读的数学符号（如 × ÷ ≤ ≥），不要输出 \\times。仅在复杂公式（分式、根式、上下标）时使用 LaTeX，并且必须成对使用 $...$ 或 $$...$$。若题目含几何图/函数图/统计图/示意图/表格，请先提取图中可见文字与标注，再补充图形关系描述（例如点、线、角、平行垂直、边长、坐标、单位、表头与数据）。无法直接识别的图形信息请用“图形信息：”分行描述。只输出题目内容，不要解释。'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '请完整识别这张题目图片。重点检查每个选项中的运算符，x/*/· 请还原为 ×。不要漏掉单位、括号、分隔符和小数点。若含示意图、几何图、函数图或表格，请把图中的关键信息也整理出来。'
            },
            {
              type: 'image_url',
              image_url: {
                url: imageDataUrl
              }
            }
          ]
        }
      ]
    };

    const response = await fetch(`${iflowBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${iflowApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const json = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: json?.error?.message || 'iFlow OCR request failed' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const rawText = json?.choices?.[0]?.message?.content?.trim() || '';
    const questionText = normalizeOcrText(rawText);

    return new Response(JSON.stringify({ questionText }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
