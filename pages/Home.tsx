import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IMAGES } from '../constants';
import { useUser, LEVEL_SYSTEM } from '../contexts/UserContext';

const Home: React.FC = () => {
    const navigate = useNavigate();
    const { user, currentLevel, mistakes } = useUser();

    const reviewProgress = useMemo(() => {
        const total = mistakes.length > 0 ? Math.min(5, mistakes.length) : 5;
        const completed = mistakes.filter((m) => m.status === 'completed').length;
        const done = Math.min(total, completed);
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;
        return { done, total, percent };
    }, [mistakes]);

    useEffect(() => {
        requestAnimationFrame(() => {
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
        });
    }, []);

    const displayedLevels = useMemo(() => {
        const levels = [...LEVEL_SYSTEM].reverse();
        const currentIndex = levels.findIndex((lvl) => lvl.level === currentLevel.level);
        if (currentIndex < 0) return levels.slice(0, 4);

        const start = Math.max(0, Math.min(currentIndex - 1, levels.length - 4));
        return levels.slice(start, start + 4);
    }, [currentLevel.level]);

    return (
        <div className="relative flex-1 flex flex-col pb-28 font-display bg-background-light dark:bg-background-dark w-full min-h-[100svh] ios-scroll">
            {/* Header */}
            <header className="relative z-20 flex items-center justify-between bg-surface-light/95 dark:bg-surface-dark/95 border-b border-black/5 dark:border-white/5 w-full px-4 pb-2 pt-[calc(env(safe-area-inset-top)+0.9rem)]">
                <div className="flex items-center gap-3">
                    <div className="relative cursor-pointer" onClick={() => navigate('/profile')}>
                        <div className="bg-center bg-no-repeat bg-cover rounded-full size-12 ring-2 ring-primary ring-offset-2 ring-offset-background-light dark:ring-offset-background-dark" style={{ backgroundImage: `url("${IMAGES.avatarWizard}")` }}></div>
                        <div className="absolute -bottom-1 -right-1 bg-surface-light dark:bg-surface-dark rounded-full p-0.5 shadow-sm">
                            <span className="material-symbols-outlined text-primary text-[16px]">verified</span>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-text-main-light dark:text-text-main-dark text-lg font-bold leading-tight">你好，{user.name}！</h2>
                        <p className="text-text-sec-light dark:text-text-sec-dark text-xs font-medium">等级 {currentLevel.level} • {currentLevel.title}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-surface-light dark:bg-surface-dark px-2 py-1.5 rounded-lg shadow-sm border border-black/5 dark:border-white/5">
                        <span className="material-symbols-outlined text-blue-500 text-[20px]">bolt</span>
                        <span className="text-sm font-bold">{user.energy}/{user.maxEnergy}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-surface-light dark:bg-surface-dark px-2 py-1.5 rounded-lg shadow-sm border border-black/5 dark:border-white/5">
                        <span className="material-symbols-outlined text-primary text-[20px]">stars</span>
                        <span className="text-sm font-bold">{user.xp}</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col md:flex-row md:items-start md:p-6 md:gap-8 max-w-7xl mx-auto w-full">
                {/* Daily Task Card - Moves to side on tablet */}
                <div className="px-4 py-4 md:p-0 md:w-1/3 md:sticky md:top-24">
                    <div className="relative overflow-hidden rounded-xl bg-surface-light dark:bg-surface-dark shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-none border border-black/5 dark:border-white/5 transition-colors">
                        <div className="absolute top-0 left-0 h-1 bg-primary w-full"></div>
                        <div className="flex flex-col sm:flex-row items-stretch p-4 gap-4">
                            <div className="flex flex-[2_2_0px] flex-col justify-between gap-4">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">每日任务</span>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold leading-tight text-text-main-light dark:text-text-main-dark">大脑强化复习</p>
                                        <p className="text-text-sec-light dark:text-text-sec-dark text-sm font-normal mt-1">艾宾浩斯提醒：时间到了！</p>
                                    </div>
                                    <div className="mt-1">
                                        <div className="flex justify-between text-xs font-bold mb-1 text-text-sec-light dark:text-text-sec-dark">
                                            <span>进度</span>
                                            <span>{reviewProgress.done}/{reviewProgress.total} 任务</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${reviewProgress.percent}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => navigate('/review')} className="group flex items-center justify-center gap-2 rounded-xl h-10 px-5 bg-primary text-text-main-light hover:bg-primary/90 transition active:scale-95 w-fit shadow-sm shadow-primary/20">
                                    <span className="material-symbols-outlined text-[20px] group-hover:rotate-12 transition-transform">play_circle</span>
                                    <span className="text-sm font-bold">开始复习</span>
                                </button>
                            </div>
                            <div className="hidden lg:block lg:w-1/3 bg-center bg-no-repeat bg-cover rounded-lg aspect-square sm:aspect-auto" style={{ backgroundImage: `url("${IMAGES.robotToy}")` }}></div>
                        </div>
                    </div>
                </div>

                {/* Map Area */}
                <div className="relative flex-1 flex flex-col items-center px-4 py-6 md:p-0">
                    {/* Decorative Background */}
                    <div className="absolute inset-0 z-0 pointer-events-none opacity-20 dark:opacity-10 overflow-hidden md:rounded-3xl md:bg-gray-100 md:dark:bg-white/5">
                        <div className="absolute top-14 left-8 w-20 h-20 rounded-full bg-primary/30 blur-2xl"></div>
                        <div className="absolute top-48 right-6 w-24 h-24 rounded-full bg-blue-300/40 blur-2xl"></div>
                        <div className="absolute bottom-36 left-8 w-16 h-16 rounded-full bg-green-300/40 blur-2xl"></div>
                        <div className="absolute bottom-8 right-16 w-28 h-28 rounded-full bg-orange-300/30 blur-2xl"></div>
                    </div>

                    <h3 className="z-10 text-text-sec-light dark:text-text-sec-dark font-bold text-sm tracking-widest uppercase mb-5 md:mt-6">冒险地图</h3>
                    
                    <div className="z-10 flex flex-col items-center gap-0 w-full max-w-md relative pb-10">
                        {displayedLevels.map((lvl, index) => {
                            const isCurrent = lvl.level === currentLevel.level;
                            const isLocked = lvl.level > currentLevel.level;
                            const isCompleted = lvl.level < currentLevel.level;
                            
                            // Simple zigzag effect based on index
                            const translateClass = index % 3 === 0 ? 'translate-x-0' : index % 3 === 1 ? 'translate-x-8' : '-translate-x-8';
                            
                            return (
                                <React.Fragment key={lvl.level}>
                                    <div className={`relative flex items-center justify-center w-full mb-2 ${isLocked ? 'opacity-60 grayscale' : ''}`}>
                                        <div className={`${translateClass} flex flex-col items-center gap-2 relative`}>
                                            {isCurrent && <div className="absolute -inset-3 bg-primary/20 rounded-full z-0"></div>}
                                             
                                            <div 
                                                className={`size-14 md:size-16 rounded-full border-4 flex items-center justify-center shadow-md relative z-10 transition-transform 
                                                ${isCurrent ? 'bg-primary border-white dark:border-background-dark scale-110' : 
                                                  isCompleted ? 'bg-green-500 border-white dark:border-background-dark cursor-pointer' : 
                                                  'bg-surface-light dark:bg-surface-dark border-gray-200 dark:border-gray-700'}`}
                                            >
                                                <span className={`material-symbols-outlined text-2xl md:text-3xl 
                                                    ${isCurrent ? 'text-text-main-light' : 
                                                      isCompleted ? 'text-white' : 'text-gray-400'}`}>
                                                    {isLocked ? 'lock' : isCompleted ? 'check' : 'star'}
                                                </span>
                                            </div>
                                            
                                            {isCurrent && (
                                                <div className="bg-surface-light dark:bg-surface-dark px-3 py-1 rounded-full shadow-sm border border-black/5 dark:border-white/5 z-10 absolute -bottom-8 w-max">
                                                    <span className="font-bold text-text-main-light dark:text-text-main-dark text-sm">等级 {lvl.level}</span>
                                                </div>
                                            )}
                                            {!isCurrent && (
                                                <span className={`font-bold text-sm ${isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>等级 {lvl.level}</span>
                                            )}
                                        </div>
                                    </div>
                                    {/* Path Connector */}
                                     {index < displayedLevels.length - 1 && (
                                        <div className={`h-10 w-1 border-l-4 border-dashed my-1 ${isLocked ? 'border-gray-300 dark:border-gray-700 opacity-30' : 'border-primary opacity-50'} 
                                            ${index % 3 === 0 ? 'translate-x-6' : index % 3 === 1 ? '-translate-x-2' : 'translate-x-6'}`}>
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            </main>
            
            {/* Scan FAB */}
            <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+92px)] right-4 md:right-8 z-50 pointer-events-none">
                <button 
                    onClick={() => navigate('/capture')}
                    className="pointer-events-auto flex cursor-pointer items-center justify-center overflow-hidden rounded-2xl h-14 bg-primary text-text-main-light shadow-[0_4px_12px_rgba(244,192,37,0.4)] hover:shadow-[0_6px_16px_rgba(244,192,37,0.5)] active:translate-y-0.5 transition-all min-w-0 gap-3 px-5 border-2 border-white dark:border-surface-dark group"
                >
                    <div className="text-text-main-light group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined">photo_camera</span>
                    </div>
                    <span className="truncate text-base font-bold leading-normal tracking-[0.015em]">扫描错题</span>
                </button>
            </div>
        </div>
    );
};

export default Home;
