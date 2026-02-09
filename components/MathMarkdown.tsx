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

const stripBrokenMathDelimiters = (text: string) => {
  const dollars = (text.match(/\$/g) || []).length;
  if (dollars % 2 !== 0) {
    return text.replace(/\$/g, '');
  }
  return text;
};

class MarkdownErrorBoundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('MathMarkdown render failed:', error);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

const MathMarkdown: React.FC<MathMarkdownProps> = ({ content, className }) => {
  const normalized = stripBrokenMathDelimiters(normalizeMathBlocks(content || ''));
  const containerClass = className ? `math-markdown ${className}` : 'math-markdown';

  return (
    <div className={containerClass}>
      <MarkdownErrorBoundary fallback={<pre className="whitespace-pre-wrap break-words m-0 font-sans text-sm">{content}</pre>}>
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
      </MarkdownErrorBoundary>
    </div>
  );
};

export default MathMarkdown;
