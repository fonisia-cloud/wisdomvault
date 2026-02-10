const collapseBackslashes = (input: string) => {
  let text = input;
  for (let i = 0; i < 4; i += 1) {
    const next = text.replace(/\\{2,}/g, '\\');
    if (next === text) break;
    text = next;
  }
  return text;
};

export const normalizeMathLikeText = (raw: string) => {
  let text = collapseBackslashes(raw || '');

  text = text
    .replace(/\r\n/g, '\n')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\$\$([^$]+)\$\$/g, '$1')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/\\\((.*?)\\\)/g, '$1')
    .replace(/\\\[(.*?)\\\]/g, '$1')
    .replace(/\+left\s*([\(\[\{\|])/g, '$1')
    .replace(/\+right\s*([\)\]\}\|])/g, '$1')
    .replace(/\+left|\+right/g, '')
    .replace(/\+frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '($1)/($2)')
    .replace(/\+times|\+cdot/g, '×')
    .replace(/\+div/g, '÷')
    .replace(/\+leq\b|\+le\b/g, '≤')
    .replace(/\+geq\b|\+ge\b/g, '≥')
    .replace(/\+neq\b/g, '≠')
    .replace(/\+approx\b/g, '≈')
    .replace(/\+text\s*\{([^}]*)\}/g, '$1')
    .replace(/\+operatorname\s*\{([^}]*)\}/g, '$1')
    .replace(/\+[a-zA-Z]+/g, '')
    .replace(/[{}]/g, '')
    .replace(/\s*([=+\-×÷<>≤≥≠≈])\s*/g, ' $1 ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
};
