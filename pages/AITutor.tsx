import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { IMAGES } from '../constants';
import { useUser, Mistake } from '../contexts/UserContext';
import { tutorService } from '@/services/tutor';
import MathMarkdown from '@/components/MathMarkdown';

type ChatMessage = { sender: 'ai' | 'user'; text: string; avatar?: string };

const AITutor: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mistakeId } = useParams<{ mistakeId: string }>();
  const { user, mistakes, resolveMistake, spendEnergy } = useUser();
  const [currentMistake, setCurrentMistake] = useState<Mistake | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorText, setErrorText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mistakeId) return;
    const found = mistakes.find((m) => m.id === mistakeId);
    if (found) setCurrentMistake(found);
  }, [mistakeId, mistakes]);

  useEffect(() => {
    let cancelled = false;
    const routeState = (location.state || {}) as { draftAnswer?: string };

    const loadHistory = async () => {
      if (!mistakeId) {
        setMessages([
          {
            sender: 'ai',
            text: '我看到你在分母部分的答案了，如果我们将分母改变会发生什么？',
            avatar: IMAGES.robotTutorSmall
          }
        ]);
        return;
      }

      try {
        const rows = await tutorService.listMessages(mistakeId);
        if (cancelled) return;

        if (!rows.length) {
          const firstPrompt = routeState.draftAnswer?.trim();
          setMessages([
            {
              sender: 'ai',
              text: currentMistake
                ? '我仔细看了一下你的笔记，这里似乎有个常见误区。你可以先描述一下你的思路吗？'
                : '我们先从题意开始，你觉得这道题最关键的已知条件是什么？',
              avatar: IMAGES.robotTutorSmall
            },
            ...(firstPrompt ? [{ sender: 'user' as const, text: firstPrompt }] : [])
          ]);
          return;
        }

        setMessages(
          rows.map((row) => ({
            sender: row.role === 'assistant' ? 'ai' : 'user',
            text: row.content,
            avatar: row.role === 'assistant' ? IMAGES.robotTutorSmall : undefined
          }))
        );
      } catch (error) {
        console.error('Load tutor history failed', error);
        if (!cancelled) {
          setMessages([
            {
              sender: 'ai',
              text: '我已经准备好了，我们从错因分析开始吧。',
              avatar: IMAGES.robotTutorSmall
            }
          ]);
        }
      }
    };

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [mistakeId, currentMistake, location.state]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const handleResolve = () => {
    if (currentMistake && currentMistake.status !== 'completed') {
      resolveMistake(currentMistake.id);
      navigate('/vault');
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isSending) return;
    if (user.energy <= 0) {
      setErrorText('能量不足，先去完成每日任务补充能量吧。');
      return;
    }

    const nextUserMessage: ChatMessage = { sender: 'user', text: text.trim() };
    const nextMessages = [...messages, nextUserMessage];

    setMessages(nextMessages);
    setInputText('');
    setIsSending(true);
    setErrorText('');

    try {
      const result = await tutorService.ask({
        mistakeId,
        mistakeContext: currentMistake
          ? {
              tags: currentMistake.tags,
              questionText: currentMistake.questionText,
              note: currentMistake.note,
              difficulty: currentMistake.difficulty
            }
          : undefined,
        messages: nextMessages.map((m) => ({
          role: m.sender === 'ai' ? 'assistant' : 'user',
          content: m.text
        }))
      });

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: result.reply || '我理解你的意思了。我们再换一种方式试试。',
          avatar: IMAGES.robotTutorSmall2
        }
      ]);

      spendEnergy(1);
    } catch (error: any) {
      console.error('Send tutor message failed', error);
      setErrorText(error?.message || 'AI 服务暂时不可用，请稍后重试。');
    } finally {
      setIsSending(false);
    }
  };

  const isCompleted = currentMistake?.status === 'completed';

  return (
    <div className="bg-background-light dark:bg-background-dark font-display min-h-[100svh] flex flex-col overflow-hidden">
      <header className="flex-none bg-surface-light dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 pb-4 pt-2">
        <div className="flex items-center justify-between px-4 pb-4">
          <button onClick={() => navigate(-1)} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-text-main-light dark:text-text-main-dark">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="text-lg font-bold text-text-main-light dark:text-text-main-dark">解谜专家</h2>
          {currentMistake && !isCompleted ? (
            <button
              onClick={handleResolve}
              className="flex items-center justify-center px-3 h-10 rounded-full bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 transition-colors text-green-700 dark:text-green-300 gap-1"
            >
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              <span className="text-xs font-bold">标记攻克</span>
            </button>
          ) : (
            <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-text-main-light dark:text-text-main-dark">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          )}
        </div>
        <div className="px-6 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-text-main-light dark:text-text-main-dark">{isCompleted ? '挑战已完成' : '正在破解难题'}</span>
            <span className="text-xs font-medium text-primary">{isCompleted ? '100%' : '65%'}</span>
          </div>
          <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ease-out ${isCompleted ? 'bg-green-500' : 'bg-primary'}`} style={{ width: isCompleted ? '100%' : '65%' }}></div>
          </div>
          <p className="text-xs text-text-sec-light dark:text-text-sec-dark text-right">{isCompleted ? '太棒了！继续下一个挑战。' : '加油，快解开了！'}</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar p-4 flex flex-col gap-6" ref={scrollRef}>
        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg">
              <div className="w-full h-full bg-center bg-no-repeat bg-cover" style={{ backgroundImage: `url("${IMAGES.robotTutorPortrait}")` }}></div>
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
          </div>
          <h3 className="mt-2 text-xl font-bold text-text-main-light dark:text-text-main-dark">机器人导师</h3>
          <span className="text-sm text-text-sec-light dark:text-text-sec-dark">让我们一起找出答案！</span>
        </div>

        <div className="mx-2 p-3 bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex gap-4 items-center">
          <div className="w-20 h-20 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0">
            <div className="w-full h-full bg-center bg-cover" style={{ backgroundImage: `url("${currentMistake ? currentMistake.image : IMAGES.studentHomework}")` }}></div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-1">
              <p className="text-sm font-bold text-text-main-light dark:text-text-main-dark">{currentMistake ? `${currentMistake.tags[0] || '题目'}挑战` : '你的答案'}</p>
              <span className="material-symbols-outlined text-text-sec-light dark:text-text-sec-dark text-lg">open_in_full</span>
            </div>
            <p className="text-xs text-text-sec-light dark:text-text-sec-dark line-clamp-2">{currentMistake ? (currentMistake.questionText || currentMistake.note) : '你写的是 3/4 + 1/4 = 4/8。让我们仔细看看。'}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 pb-2">
          {messages.map((msg, index) => (
            <ChatBubble key={index} sender={msg.sender} text={msg.text} avatar={msg.avatar} />
          ))}

          {isSending && (
            <div className="flex gap-3 items-end">
              <div className="w-8 h-8 rounded-full bg-primary/20 overflow-hidden shrink-0"></div>
              <div className="bg-white dark:bg-surface-dark p-3 rounded-2xl rounded-bl-none border border-gray-100 dark:border-gray-800 text-text-sec-light dark:text-text-sec-dark text-sm">
                正在思考中...
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="flex-none bg-surface-light dark:bg-surface-dark p-4 pt-2 border-t border-gray-100 dark:border-gray-800">
        {errorText && <p className="text-red-500 text-sm mb-2">{errorText}</p>}
        <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar mask-fade-right">
          <SuggestionChip icon="🤔" text="重新思考" onClick={() => handleSendMessage('我想重新思考一下。')} />
          <SuggestionChip icon="💡" text="给我提示" onClick={() => handleSendMessage('能不能给我一点提示？')} />
          <SuggestionChip icon="🤷" text="还是不太明白" onClick={() => handleSendMessage('我还是不太明白，能详细说说吗？')} />
        </div>
        <div className="flex items-center gap-2 bg-background-light dark:bg-background-dark p-2 rounded-full border border-gray-200 dark:border-gray-700 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
          <button className="p-2 text-text-sec-light dark:text-text-sec-dark hover:text-primary transition-colors">
            <span className="material-symbols-outlined">add_circle</span>
          </button>
          <input
            className="flex-1 bg-transparent border-none focus:ring-0 text-text-main-light dark:text-text-main-dark placeholder-text-sec-light/50 text-base outline-none"
            placeholder="输入你的想法..."
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
          />
          <button
            onClick={() => handleSendMessage(inputText)}
            disabled={isSending}
            className="p-2 bg-primary text-text-main-light rounded-full w-10 h-10 flex items-center justify-center hover:bg-primary/90 transition-colors shadow-sm active:scale-95 disabled:opacity-60"
          >
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

const ChatBubble: React.FC<{ sender: 'ai' | 'user'; text: string; avatar?: string }> = ({ sender, text, avatar }) => {
  if (sender === 'ai') {
    return (
      <div className="flex gap-3 items-end">
        <div className="w-8 h-8 rounded-full bg-primary/20 overflow-hidden shrink-0">
          <div className="w-full h-full bg-center bg-cover" style={{ backgroundImage: `url("${avatar}")` }}></div>
        </div>
        <div className="flex flex-col gap-1 max-w-[85%]">
          <span className="text-xs text-text-sec-light dark:text-text-sec-dark ml-1">机器人导师</span>
          <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 dark:border-gray-800 text-text-main-light dark:text-text-main-dark">
            <MathMarkdown content={text} className="text-sm" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 items-end justify-end">
      <div className="flex flex-col gap-1 items-end max-w-[85%]">
        <div className="bg-primary p-4 rounded-2xl rounded-br-none shadow-sm text-text-main-light">
          <MathMarkdown content={text} className="text-sm font-medium" />
        </div>
      </div>
    </div>
  );
};

const SuggestionChip: React.FC<{ icon: string; text: string; onClick?: () => void }> = ({ icon, text, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="whitespace-nowrap flex items-center gap-2 px-4 py-2 bg-background-light dark:bg-background-dark border border-gray-200 dark:border-gray-700 rounded-full text-sm font-medium hover:bg-primary/10 hover:border-primary transition-colors text-text-main-light dark:text-text-main-dark active:scale-95"
    >
      <span>{icon}</span> {text}
    </button>
  );
};

export default AITutor;
