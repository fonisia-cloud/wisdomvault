import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

interface MathMarkdownProps {
  content: string;
  className?: string;
}

const normalizeMathBlocks = (text: string) => {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\\\$/g, '$')
    .replace(/\\times|\\cdot/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\leq|\\le/g, '≤')
    .replace(/\\geq|\\ge/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\approx/g, '≈')
    .replace(/^\s*\$\$\s*$/gm, '')
    .replace(/\$\$\s*$/gm, '')
    .replace(/\\\[(.*?)\\\]/gs, '$$$$ $1 $$$$')
    .replace(/\\\((.*?)\\\)/gs, '$$$1$$')
    .replace(/\\\\([a-zA-Z]+)/g, '\\$1')
    .replace(/(^|\s)(\\(?:frac|sqrt|sum|int|pi|alpha|beta|gamma|theta|sin|cos|tan|cdot|times|div)[^\n]*)/g, '$1$$$2$$');
};

const MathMarkdown: React.FC<MathMarkdownProps> = ({ content, className }) => {
  const normalized = normalizeMathBlocks(content || '');
  const containerClass = className ? `math-markdown ${className}` : 'math-markdown';

  return (
    <div className={containerClass}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <p className="leading-relaxed whitespace-pre-wrap">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          h1: ({ children }) => <h3 className="text-base font-bold mt-2 mb-1">{children}</h3>,
          h2: ({ children }) => <h4 className="text-sm font-bold mt-2 mb-1">{children}</h4>,
          h3: ({ children }) => <h5 className="text-sm font-bold mt-2 mb-1">{children}</h5>
        }}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
};

export default MathMarkdown;
