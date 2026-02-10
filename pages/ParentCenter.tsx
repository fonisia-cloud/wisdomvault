import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const ParentCenter: React.FC = () => {
    const navigate = useNavigate();
    const { unlockParentCenter, parentSettings, updateParentSettings } = useUser();
    
    const [isLocked, setIsLocked] = useState(true);
    const [pinInput, setPinInput] = useState('');
    const [error, setError] = useState(false);

    // Mock settings state for UI (synced with context on change)
    const [timeLimit, setTimeLimit] = useState(parentSettings.dailyTimeLimit);

    useEffect(() => {
        if (pinInput.length === 4) {
            if (unlockParentCenter(pinInput)) {
                setIsLocked(false);
                setError(false);
            } else {
                setError(true);
                setPinInput('');
            }
        }
    }, [pinInput, unlockParentCenter]);

    const handleNumClick = (num: string) => {
        if (pinInput.length < 4) {
            setPinInput(prev => prev + num);
        }
    };

    const handleBackspace = () => {
        setPinInput(prev => prev.slice(0, -1));
    };

    const handleTimeLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        setTimeLimit(val);
        updateParentSettings({ dailyTimeLimit: val });
    };

    const toggleRestMode = () => {
        updateParentSettings({ isRestMode: !parentSettings.isRestMode });
    };

    if (isLocked) {
        return (
            <div className="flex flex-col min-h-[100dvh] w-full bg-surface-light dark:bg-surface-dark font-display items-center justify-center p-6">
                <button 
                    onClick={() => navigate(-1)} 
                    className="absolute top-6 left-6 flex size-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-text-main-light dark:text-text-main-dark"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                <div className="flex flex-col items-center mb-8">
                    <div className="size-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4 text-orange-500">
                        <span className="material-symbols-outlined text-3xl">lock</span>
                    </div>
                    <h2 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">家长中心</h2>
                    <p className="text-text-sec-light dark:text-text-sec-dark text-sm mt-2">请输入4位密码进入 (默认: 0000)</p>
                </div>

                <div className="flex gap-4 mb-8">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className={`size-4 rounded-full border-2 transition-all ${pinInput.length > i 
                            ? (error ? 'bg-red-500 border-red-500' : 'bg-primary border-primary') 
                            : 'border-gray-300 dark:border-gray-600'}`}>
                        </div>
                    ))}
                </div>
                {error && <p className="text-red-500 font-bold mb-4 animate-bounce">密码错误，请重试</p>}

                <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button 
                            key={num} 
                            onClick={() => handleNumClick(num.toString())}
                            className="h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 text-2xl font-bold text-text-main-light dark:text-text-main-dark hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all shadow-sm"
                        >
                            {num}
                        </button>
                    ))}
                    <div className="h-16"></div>
                    <button 
                        onClick={() => handleNumClick('0')}
                        className="h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 text-2xl font-bold text-text-main-light dark:text-text-main-dark hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all shadow-sm"
                    >
                        0
                    </button>
                    <button 
                        onClick={handleBackspace}
                        className="h-16 rounded-2xl bg-transparent text-text-sec-light dark:text-text-sec-dark hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center"
                    >
                        <span className="material-symbols-outlined">backspace</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-[100dvh] w-full bg-background-light dark:bg-background-dark font-display">
            <header className="flex items-center px-4 py-3 sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 border-b border-black/5 dark:border-white/5 safe-top-pad">
                <button onClick={() => navigate(-1)} className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-light dark:bg-surface-dark shadow-sm cursor-pointer active:scale-95 transition-transform border border-black/5 dark:border-white/5">
                    <span className="material-symbols-outlined text-text-main-light dark:text-text-main-dark">arrow_back</span>
                </button>
                <h2 className="text-text-main-light dark:text-text-main-dark text-lg font-bold leading-tight flex-1 text-center pr-10">家长控制</h2>
            </header>

            <main className="p-6 flex flex-col gap-6 max-w-lg mx-auto w-full">
                
                {/* Time Limit Section */}
                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-3xl shadow-sm border border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
                            <span className="material-symbols-outlined">timer</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-text-main-light dark:text-text-main-dark">每日使用时长</h3>
                            <p className="text-sm text-text-sec-light dark:text-text-sec-dark">当前限制: {timeLimit} 分钟</p>
                        </div>
                    </div>
                    
                    <input 
                        type="range" 
                        min="15" 
                        max="120" 
                        step="15" 
                        value={timeLimit}
                        onChange={handleTimeLimitChange}
                        className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                    <div className="flex justify-between mt-2 text-xs text-gray-400 font-bold">
                        <span>15m</span>
                        <span>60m</span>
                        <span>120m</span>
                    </div>
                </div>

                {/* Rest Mode Trigger */}
                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-3xl shadow-sm border border-black/5 dark:border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-500">
                                <span className="material-symbols-outlined">bedtime</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-text-main-light dark:text-text-main-dark">强制休息</h3>
                                <p className="text-sm text-text-sec-light dark:text-text-sec-dark">立即进入20分钟休息模式</p>
                            </div>
                        </div>
                        <button 
                            onClick={toggleRestMode}
                            className={`w-14 h-8 rounded-full transition-colors flex items-center px-1 ${parentSettings.isRestMode ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                        >
                            <div className={`size-6 bg-white rounded-full shadow-md transition-transform ${parentSettings.isRestMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                    </div>
                    {parentSettings.isRestMode && (
                        <div className="mt-4 p-3 bg-primary/10 rounded-xl text-xs text-primary font-bold">
                            Rest Overlay is currently ACTIVE. Uncheck to resume app usage.
                        </div>
                    )}
                </div>

                {/* Change PIN (Mock) */}
                 <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-3xl shadow-sm border border-black/5 dark:border-white/5 opacity-50 cursor-not-allowed">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500">
                            <span className="material-symbols-outlined">password</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-text-main-light dark:text-text-main-dark">修改密码</h3>
                            <p className="text-sm text-text-sec-light dark:text-text-sec-dark">当前仅支持默认密码</p>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default ParentCenter;
