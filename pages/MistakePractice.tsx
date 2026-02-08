import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import MathMarkdown from '@/components/MathMarkdown';

const MistakePractice: React.FC = () => {
  const navigate = useNavigate();
  const { mistakeId } = useParams<{ mistakeId: string }>();
  const { mistakes, resolveMistake } = useUser();
  const [answerDraft, setAnswerDraft] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isMarkingDone, setIsMarkingDone] = useState(false);

  const currentMistake = useMemo(() => mistakes.find((m) => m.id === mistakeId) || null, [mistakeId, mistakes]);

  if (!currentMistake) {
    return (
      <div className="min-h-[100svh] p-6 bg-background-light dark:bg-background-dark">
        <button onClick={() => navigate('/vault')} className="mb-4 text-primary font-bold">返回错题库</button>
        <p className="text-text-sec-light dark:text-text-sec-dark">未找到该错题，请返回错题库重试。</p>
      </div>
    );
  }

  const handleSubmitDraft = () => {
    if (!answerDraft.trim()) {
      setFeedback('请先写下你的解题思路再提交。');
      return;
    }

    setFeedback('已记录你的作答草稿。若卡住了，可以点击“请教AI助手”。');
  };

  const handleMarkResolved = () => {
    if (isMarkingDone) return;
    setIsMarkingDone(true);
    resolveMistake(currentMistake.id);
    setFeedback('已标记为攻克，正在返回错题库...');
    window.setTimeout(() => {
      navigate('/vault');
    }, 250);
  };

  return (
    <div className="min-h-[100svh] bg-background-light dark:bg-background-dark flex flex-col pb-24">
      <header className="sticky top-0 z-10 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur border-b border-black/5 dark:border-white/10 p-4 flex items-center gap-3">
        <button onClick={() => navigate('/vault')} className="size-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="font-bold text-lg">错题练习</h2>
      </header>

      <main className="flex-1 p-4 space-y-4">
        <div className="rounded-2xl bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/10 p-4">
          <p className="text-xs font-bold text-text-sec-light dark:text-text-sec-dark mb-2">题目内容</p>
          <MathMarkdown content={currentMistake.questionText || currentMistake.note || '暂无题目内容'} className="text-text-main-light dark:text-text-main-dark text-sm" />
        </div>

        <div className="rounded-2xl bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/10 p-4">
          <p className="text-xs font-bold text-text-sec-light dark:text-text-sec-dark mb-2">我的作答</p>
          <textarea
            value={answerDraft}
            onChange={(e) => setAnswerDraft(e.target.value)}
            placeholder="写下你的解题步骤或答案..."
            className="w-full h-36 resize-none bg-transparent outline-none text-sm"
          />
        </div>

        {feedback && <p className="text-sm text-primary font-medium">{feedback}</p>}
      </main>

      <footer className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-[min(100%,1024px)] p-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] bg-gradient-to-t from-background-light via-background-light to-transparent dark:from-background-dark dark:via-background-dark">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
        <button onClick={handleSubmitDraft} className="h-12 rounded-xl border border-primary text-primary font-bold text-sm">提交作答</button>
        <button
          onClick={() => navigate(`/tutor/${currentMistake.id}`, { state: { draftAnswer: answerDraft } })}
          className="h-12 rounded-xl bg-primary text-[#221e10] font-bold text-sm px-2"
        >
          请教AI助手
        </button>
        <button onClick={handleMarkResolved} disabled={isMarkingDone} className="h-12 px-4 rounded-xl bg-green-500 text-white font-bold whitespace-nowrap disabled:opacity-60">{isMarkingDone ? '处理中' : '已攻克'}</button>
        </div>
      </footer>
    </div>
  );
};

export default MistakePractice;
