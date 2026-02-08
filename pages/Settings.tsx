import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const { appSettings, updateAppSettings, resetMembershipLevel, isBusy } = useUser();
    const [resetHint, setResetHint] = useState('');

    const handleResetMembershipLevel = async () => {
        const confirmed = window.confirm('确认将会员等级重置为初始状态吗？该操作会将当前等级进度清零。');
        if (!confirmed) return;

        const ok = await resetMembershipLevel();
        setResetHint(ok ? '已重置为初始等级。' : '重置失败，请稍后重试。');
    };

    return (
        <div className="flex flex-col min-h-[100dvh] w-full bg-background-light dark:bg-background-dark font-display">
            <header className="flex items-center px-4 py-3 sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-black/5 dark:border-white/5">
                <div onClick={() => navigate(-1)} className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-light dark:bg-surface-dark shadow-sm cursor-pointer active:scale-95 transition-transform border border-black/5 dark:border-white/5">
                    <span className="material-symbols-outlined text-text-main-light dark:text-text-main-dark">arrow_back</span>
                </div>
                <h2 className="text-text-main-light dark:text-text-main-dark text-lg font-bold leading-tight flex-1 text-center pr-10">设置</h2>
            </header>

            <main className="p-6 flex flex-col gap-6 max-w-lg mx-auto w-full">
                
                {/* Font Size Settings */}
                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-3xl shadow-sm border border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-primary text-2xl">format_size</span>
                        <h3 className="text-lg font-bold text-text-main-light dark:text-text-main-dark">字体大小</h3>
                    </div>
                    
                    <div className="flex items-center justify-between gap-4 bg-background-light dark:bg-background-dark p-2 rounded-2xl">
                        <button 
                            onClick={() => updateAppSettings({ fontSize: 'small' })}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${appSettings.fontSize === 'small' ? 'bg-white dark:bg-gray-700 shadow-md text-primary' : 'text-gray-400'}`}
                        >
                            小
                        </button>
                         <button 
                            onClick={() => updateAppSettings({ fontSize: 'medium' })}
                            className={`flex-1 py-3 rounded-xl font-bold text-base transition-all ${appSettings.fontSize === 'medium' ? 'bg-white dark:bg-gray-700 shadow-md text-primary' : 'text-gray-400'}`}
                        >
                            中
                        </button>
                         <button 
                            onClick={() => updateAppSettings({ fontSize: 'large' })}
                            className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all ${appSettings.fontSize === 'large' ? 'bg-white dark:bg-gray-700 shadow-md text-primary' : 'text-gray-400'}`}
                        >
                            大
                        </button>
                    </div>
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                        <p className={`text-text-main-light dark:text-text-main-dark transition-all duration-300
                            ${appSettings.fontSize === 'small' ? 'text-sm' : appSettings.fontSize === 'medium' ? 'text-base' : 'text-lg'}
                        `}>
                            这是一段预览文字。字体大小决定了阅读的舒适度。
                            <br/>
                            Preview text size here.
                        </p>
                    </div>
                </div>

                 {/* Appearance (Theme) */}
                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-3xl shadow-sm border border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-purple-500 text-2xl">palette</span>
                        <h3 className="text-lg font-bold text-text-main-light dark:text-text-main-dark">主题外观</h3>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col items-center gap-2 cursor-pointer opacity-100">
                            <div className="size-12 rounded-full bg-[#f4c025] border-4 border-white dark:border-gray-700 shadow-md ring-2 ring-primary"></div>
                            <span className="text-xs font-bold text-primary">默认金</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 cursor-not-allowed opacity-50 grayscale">
                            <div className="size-12 rounded-full bg-blue-500 border-4 border-white dark:border-gray-700 shadow-md"></div>
                            <span className="text-xs font-bold text-gray-400">深海蓝</span>
                        </div>
                         <div className="flex flex-col items-center gap-2 cursor-not-allowed opacity-50 grayscale">
                            <div className="size-12 rounded-full bg-green-500 border-4 border-white dark:border-gray-700 shadow-md"></div>
                            <span className="text-xs font-bold text-gray-400">森林绿</span>
                        </div>
                    </div>
                     <p className="mt-4 text-xs text-center text-gray-400">更多主题敬请期待 (系统已支持深色模式)</p>
                </div>

                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-3xl shadow-sm border border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-red-500 text-2xl">restart_alt</span>
                        <h3 className="text-lg font-bold text-text-main-light dark:text-text-main-dark">会员等级重置</h3>
                    </div>

                    <p className="text-sm text-text-sec-light dark:text-text-sec-dark mb-4">将当前会员等级进度恢复到初始状态（等级1，XP清零）。</p>
                    <button
                        onClick={handleResetMembershipLevel}
                        disabled={isBusy}
                        className="w-full h-11 rounded-xl bg-red-500 text-white font-bold disabled:opacity-60"
                    >
                        {isBusy ? '重置中...' : '重置会员等级'}
                    </button>
                    {resetHint && <p className="mt-3 text-xs text-text-sec-light dark:text-text-sec-dark">{resetHint}</p>}
                </div>

            </main>
        </div>
    );
};

export default Settings;
