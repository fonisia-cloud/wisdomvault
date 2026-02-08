import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, Mistake } from '../contexts/UserContext';
import { IMAGES } from '../constants';

const ReviewPlan: React.FC = () => {
    const navigate = useNavigate();
    const { mistakes } = useUser();
    const [planIds, setPlanIds] = useState<string[]>([]);
    const [isChartOpen, setIsChartOpen] = useState(false);

    // Initialize the daily plan with up to 5 mistakes
    useEffect(() => {
        if (mistakes.length > 0 && planIds.length === 0) {
            // Shuffle and pick up to 5 mistakes for the "daily plan"
            // For a better demo experience, we can prioritize pending ones, but random is requested.
            const shuffled = [...mistakes].sort(() => 0.5 - Math.random());
            setPlanIds(shuffled.slice(0, 5).map(m => m.id));
        }
    }, [mistakes, planIds.length]);

    // Reconstruct the mistake objects from IDs to get reactive status updates
    const dailyMistakes = useMemo(() => {
        return planIds.map(id => mistakes.find(m => m.id === id)).filter(Boolean) as Mistake[];
    }, [planIds, mistakes]);

    // Fill up to 5 slots
    const slots = useMemo(() => {
        const items = [...dailyMistakes];
        while (items.length < 5) {
            items.push({ id: `placeholder-${items.length}`, isPlaceholder: true } as any);
        }
        return items;
    }, [dailyMistakes]);

    const handleCardClick = (mistake: Mistake, index: number, isLocked: boolean, isCompleted: boolean) => {
        if (isLocked) return;
        if ((mistake as any).isPlaceholder) {
            navigate('/capture'); // Redirect to capture if it's a placeholder
            return;
        }
        if (!isCompleted) {
            navigate(`/practice/${mistake.id}`);
        }
    };

    return (
        <div className="relative flex min-h-[100dvh] w-full flex-col shadow-2xl overflow-hidden bg-background-light dark:bg-background-dark font-display">
             <div className="flex items-center p-4 pb-2 justify-between z-50 sticky top-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md">
                <button 
                    onClick={() => navigate(-1)} 
                    className="flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                    <span className="material-symbols-outlined text-[#1b1912] dark:text-white" style={{ fontSize: '24px' }}>arrow_back</span>
                </button>
                <h2 className="text-[#1b1912] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">每日复习计划</h2>
            </div>

            <div className="flex-1 flex flex-col pb-24">
                <h2 className="text-[#1b1912] dark:text-white tracking-tight text-[26px] font-bold leading-tight px-6 pt-6 pb-2">今日5道强化题</h2>
                <p className="px-6 text-[#8c8574] dark:text-[#bab29c] text-sm mb-4">完成任务保持连胜！</p>
                
                {/* Added pt-4 to container to prevent badge clipping */}
                <div className="w-full overflow-x-auto no-scrollbar pb-8 pl-6 pt-4">
                    <div className="flex gap-4 pr-6 w-max">
                        {slots.map((item, index) => {
                            const isPlaceholder = (item as any).isPlaceholder;
                            // Logic: Unlocked if it's the first one, OR if the previous one is completed.
                            // BUT: If item is completed, it's unlocked (done).
                            // If item is pending, we check previous.
                            
                            // Check if previous item exists and is completed
                            const prevItem = index > 0 ? slots[index - 1] : null;
                            const prevIsCompleted = prevItem && !(prevItem as any).isPlaceholder && prevItem.status === 'completed';
                            const prevIsPlaceholder = prevItem && (prevItem as any).isPlaceholder;

                            let isLocked = false;
                            if (index > 0) {
                                // If previous is a real mistake and not completed -> Locked
                                if (!prevIsPlaceholder && prevItem?.status !== 'completed') {
                                    isLocked = true;
                                }
                                // If previous is placeholder -> Locked (assuming we fill sequentially)
                                if (prevIsPlaceholder) {
                                     isLocked = true;
                                }
                            }

                            const isCompleted = !isPlaceholder && item.status === 'completed';
                            const isCurrent = !isLocked && !isCompleted;
                            
                            return (
                                <div 
                                    key={item.id} 
                                    onClick={() => handleCardClick(item, index, isLocked, isCompleted)}
                                    className={`group relative flex flex-col gap-3 rounded-2xl w-40 p-3 border-2 shrink-0 transition-all duration-300
                                    ${isLocked 
                                        ? 'bg-[#f1f0ec] dark:bg-[#2a261a] border-transparent opacity-80 cursor-not-allowed' 
                                        : isCompleted
                                            ? 'bg-[#dcfce7] dark:bg-[#153823] border-[#22c55e] cursor-default'
                                            : 'bg-white dark:bg-[#2f2b1d] border-primary shadow-lg shadow-primary/10 cursor-pointer transform hover:scale-[1.02]'
                                    }`}
                                >
                                    {isCurrent && (
                                        <div className="absolute -top-3 -right-3 bg-primary text-[#221e10] text-xs font-bold px-2 py-1 rounded-full shadow-md z-20 animate-bounce">
                                            {isPlaceholder ? '添加' : '开始！'}
                                        </div>
                                    )}
                                    
                                    <div className={`w-full aspect-square rounded-xl flex items-center justify-center relative overflow-hidden 
                                        ${isLocked ? 'bg-[#e3e1da] dark:bg-[#383324]' : isCompleted ? 'bg-white/50 dark:bg-black/10' : 'bg-primary/20'}`}>
                                        
                                        {isLocked ? (
                                            <span className="material-symbols-outlined text-[#a19b8d] dark:text-[#6e6856] text-4xl">lock</span>
                                        ) : isCompleted ? (
                                            <span className="material-symbols-outlined text-[#22c55e] text-5xl drop-shadow-sm">check_circle</span>
                                        ) : isPlaceholder ? (
                                             <span className="material-symbols-outlined text-primary text-4xl border-2 border-dashed border-primary/50 rounded-lg p-2">add</span>
                                        ) : (
                                            <>
                                                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#f4c025 2px, transparent 2px)', backgroundSize: '10px 10px' }}></div>
                                                <div className="w-full h-full bg-contain bg-center bg-no-repeat opacity-80" style={{ backgroundImage: `url("${item.image || IMAGES.abstractShape}")` }}></div>
                                            </>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <p className={`text-base font-bold leading-normal truncate ${isLocked ? 'text-[#a19b8d] dark:text-[#8c8574]' : 'text-[#1b1912] dark:text-white'}`}>
                                            {isPlaceholder ? '空缺卡槽' : `题目 ${index + 1}`}
                                        </p>
                                        <p className={`text-sm font-medium leading-normal truncate ${isLocked ? 'text-[#a19b8d] dark:text-[#6e6856]' : isCompleted ? 'text-[#22c55e]' : 'text-primary'}`}>
                                            {isLocked ? '未解锁' : isCompleted ? '已完成' : isPlaceholder ? '去录入' : '准备挑战'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center justify-between px-6 pt-4 pb-4">
                    <h3 className="text-[#1b1912] dark:text-white tracking-tight text-xl font-bold leading-tight">记忆成长曲线</h3>
                    <button onClick={() => setIsChartOpen(true)} className="text-primary text-sm font-bold active:scale-95 transition-transform">查看图表</button>
                </div>

                <div className="px-6 flex flex-col relative">
                    {/* Timeline Line */}
                    <div className="absolute left-[39px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-transparent dark:from-primary dark:via-primary/30 dark:to-transparent rounded-full"></div>
                    
                    {/* Step 1 */}
                    <div className="flex gap-4 mb-6 relative">
                        <div className="size-7 rounded-full bg-[#dcfce7] dark:bg-[#153823] border-2 border-[#22c55e] dark:border-[#22c55e] shrink-0 z-10 flex items-center justify-center shadow-sm">
                            <span className="material-symbols-outlined text-[#22c55e] text-[16px] font-bold">check</span>
                        </div>
                        <div className="flex flex-col pt-0.5">
                            <p className="text-[#1b1912] dark:text-white text-sm font-bold">初次学习</p>
                            <p className="text-[#8c8574] dark:text-[#bab29c] text-xs">昨天 • 100% 记忆保留</p>
                        </div>
                    </div>

                    {/* Step 2 (Active) */}
                    <div className="flex gap-4 mb-6 relative">
                        <div className="size-7 rounded-full bg-primary shadow-[0_0_10px_rgba(244,192,37,0.6)] shrink-0 z-10 flex items-center justify-center animate-pulse">
                            <span className="material-symbols-outlined text-[#221e10] text-[16px]">play_arrow</span>
                        </div>
                        <div className="flex flex-col pt-0.5">
                            <p className="text-[#1b1912] dark:text-white text-base font-bold text-primary">第一次复习 (现在)</p>
                            <p className="text-[#1b1912] dark:text-[#e0dcd0] text-sm font-medium">防止 40% 记忆衰退！</p>
                            <div className="mt-2 h-1.5 w-32 bg-[#e8e6df] dark:bg-[#383324] rounded-full overflow-hidden">
                                <div className="h-full bg-red-400 w-[60%] rounded-full"></div>
                            </div>
                            <p className="text-[10px] text-red-400 mt-1 font-medium">记忆正在消退...</p>
                        </div>
                    </div>

                    {/* Step 3 (Future) */}
                    <div className="flex gap-4 relative opacity-60">
                        <div className="size-7 rounded-full bg-[#e8e6df] dark:bg-[#383324] border-2 border-[#a19b8d] dark:border-[#6e6856] shrink-0 z-10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#a19b8d] dark:text-[#6e6856] text-[16px]">schedule</span>
                        </div>
                        <div className="flex flex-col pt-0.5">
                            <p className="text-[#1b1912] dark:text-white text-sm font-bold">第二次复习</p>
                            <p className="text-[#8c8574] dark:text-[#bab29c] text-xs">2 天后</p>
                        </div>
                    </div>
                </div>
                <div className="h-8"></div>
            </div>

            <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-background-light via-background-light to-transparent dark:from-background-dark dark:via-background-dark dark:to-transparent z-20">
                <button onClick={() => navigate('/vault')} className="w-full bg-primary hover:bg-[#e0b020] active:scale-[0.98] transition-all duration-200 rounded-xl h-14 flex items-center justify-center gap-3 shadow-[0_4px_20px_rgba(244,192,37,0.3)]">
                    <span className="material-symbols-outlined text-[#221e10] text-2xl">rocket_launch</span>
                    <span className="text-[#221e10] text-lg font-bold tracking-tight">开始复习挑战</span>
                </button>
            </div>

            {/* Chart Modal */}
            {isChartOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[scan_0.3s_ease-out]">
                    <div className="relative w-full max-w-sm bg-surface-light dark:bg-surface-dark rounded-3xl p-6 shadow-2xl border border-white/10 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-[#1b1912] dark:text-white">记忆保留率</h3>
                            <button onClick={() => setIsChartOpen(false)} className="size-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                                <span className="material-symbols-outlined text-gray-500">close</span>
                            </button>
                        </div>
                        
                        <div className="h-48 w-full flex items-end justify-between gap-2 px-2 border-b border-gray-200 dark:border-gray-700 pb-2 relative">
                            {/* Y-axis lines */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                                <div className="border-t border-dashed border-gray-400 w-full h-0"></div>
                                <div className="border-t border-dashed border-gray-400 w-full h-0"></div>
                                <div className="border-t border-dashed border-gray-400 w-full h-0"></div>
                                <div className="border-t border-dashed border-gray-400 w-full h-0"></div>
                            </div>

                            {/* Bars */}
                            {[80, 60, 90, 45, 100, 70, 85].map((height, i) => (
                                <div key={i} className="flex-1 flex flex-col justify-end items-center gap-1 group">
                                    <div 
                                        className="w-full bg-primary/30 dark:bg-primary/20 rounded-t-md relative transition-all duration-500 group-hover:bg-primary"
                                        style={{ height: `${height}%` }}
                                    >
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                            {height}%
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between px-2 pt-2">
                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                                <span key={i} className="text-xs font-bold text-gray-400 w-full text-center">{day}</span>
                            ))}
                        </div>

                        <div className="mt-6 bg-primary/10 rounded-xl p-4 flex items-start gap-3">
                            <span className="material-symbols-outlined text-primary">insights</span>
                            <div>
                                <p className="text-sm font-bold text-[#1b1912] dark:text-white">复习效果显著</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">你的记忆保留率比平均水平高出 15%。继续保持每日复习习惯！</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewPlan;
