import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IMAGES } from '../constants';
import { useUser } from '../contexts/UserContext';

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const { user, currentLevel, nextLevel, progressToNextLevel, logout } = useUser();

    return (
        <div className="relative flex h-full w-full min-h-[100svh] flex-col font-display text-text-main-light dark:text-text-main-dark bg-background-light dark:bg-background-dark">
            <header className="relative bg-surface-light dark:bg-surface-dark pb-6 pt-[calc(env(safe-area-inset-top)+1rem)] px-6 rounded-b-[2rem] shadow-sm z-10 border-b border-black/5 dark:border-white/5 md:mx-auto md:w-full md:max-w-4xl md:rounded-none md:bg-transparent md:border-none">
                <div className="absolute top-4 right-4 md:hidden">
                    <button onClick={() => navigate('/settings')} className="p-2 text-text-sec-light dark:text-text-sec-dark hover:text-text-main-light transition-colors">
                        <span className="material-symbols-outlined">settings</span>
                    </button>
                </div>
                
                <div className="flex flex-col items-center md:flex-row md:gap-8 md:items-center md:bg-surface-light md:dark:bg-surface-dark md:p-8 md:rounded-3xl md:shadow-sm md:border md:border-black/5 md:dark:border-white/5">
                    <div className="relative mb-4 group md:mb-0">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/30 transition-all"></div>
                        <div className="relative bg-center bg-no-repeat bg-cover rounded-full size-28 md:size-32 ring-4 ring-primary ring-offset-4 ring-offset-surface-light dark:ring-offset-surface-dark shadow-lg" style={{ backgroundImage: `url("${IMAGES.avatarWizard}")` }}></div>
                        <div className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full shadow-md border-2 border-white dark:border-surface-dark flex items-center justify-center">
                            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-center md:items-start flex-1">
                        <h1 className="text-2xl font-bold font-sans text-text-main-light dark:text-text-main-dark mb-1">{user.name}</h1>
                        <p className="text-sm font-medium text-text-sec-light dark:text-text-sec-dark mb-4 bg-background-light dark:bg-background-dark px-3 py-1 rounded-full">{currentLevel.title}</p>
                        <div className="w-full max-w-[240px] md:max-w-md flex flex-col items-center md:items-start gap-1.5">
                            <div className="flex justify-between w-full text-xs font-bold px-1">
                                <span className="text-primary">Level {currentLevel.level}</span>
                                <span className="text-text-sec-light dark:text-text-sec-dark">{user.xp}/{currentLevel.maxXp} XP</span>
                            </div>
                            <div className="h-2.5 w-full bg-background-light dark:bg-background-dark rounded-full overflow-hidden shadow-inner border border-black/5 dark:border-white/5">
                                <div className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full relative transition-all duration-500" style={{ width: `${progressToNextLevel}%` }}>
                                    <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_ease-in-out_infinite]"></div>
                                </div>
                            </div>
                            <p className="text-xs text-text-sec-light dark:text-text-sec-dark mt-1">
                                距离 {nextLevel?.title || 'Max Level'} 还需 {currentLevel.maxXp - user.xp} XP
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col px-4 py-6 gap-6 pb-32 md:max-w-4xl md:mx-auto md:w-full">
                <div className="grid grid-cols-3 gap-3 md:gap-6">
                    <StatCard icon="monetization_on" value={user.coins.toString()} label="金币" color="yellow" filled />
                    <StatCard icon="bolt" value={`${user.energy}/${user.maxEnergy}`} label="能量" color="blue" filled />
                    <StatCard icon="task_alt" value="0" label="攻克题目" color="green" filled />
                </div>

                <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
                    <h3 className="px-1 text-xs font-bold uppercase tracking-wider text-text-sec-light dark:text-text-sec-dark font-sans col-span-full">Menu</h3>
                    
                    <div onClick={() => navigate('/achievements')} className="cursor-pointer">
                        <MenuItem icon="emoji_events" color="purple" title="我的成就" />
                    </div>
                    
                    {/* Wishlist removed as requested */}
                    
                    <div onClick={() => navigate('/parent-center')} className="cursor-pointer">
                        <MenuItem icon="family_restroom" color="orange" title="家长中心" />
                    </div>
                    
                    <div onClick={() => navigate('/settings')} className="cursor-pointer">
                        <MenuItem icon="settings" color="gray" title="设置" />
                    </div>
                    
                    <div onClick={logout} className="cursor-pointer">
                        <MenuItem icon="logout" color="red" title="退出登录" />
                    </div>
                </div>
            </main>
        </div>
    );
};

const StatCard: React.FC<{ icon: string, value: string, label: string, color: string, filled?: boolean }> = ({ icon, value, label, color, filled }) => {
    const colorClasses: Record<string, string> = {
        yellow: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
        blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
        green: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    };

    return (
        <div className="flex flex-col items-center justify-center p-3 md:p-6 rounded-2xl bg-surface-light dark:bg-surface-dark shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-black/5 dark:border-white/5">
            <div className={`size-10 md:size-12 rounded-full ${colorClasses[color]} flex items-center justify-center mb-2`}>
                <span className={`material-symbols-outlined ${filled ? 'filled' : ''} md:text-[28px]`}>{icon}</span>
            </div>
            <span className="text-lg md:text-2xl font-bold font-display text-text-main-light dark:text-text-main-dark">{value}</span>
            <span className="text-[10px] md:text-xs uppercase tracking-wide font-sans font-bold text-text-sec-light dark:text-text-sec-dark">{label}</span>
        </div>
    );
};

const MenuItem: React.FC<{ icon: string, color: string, title: string }> = ({ icon, color, title }) => {
     const colorClasses: Record<string, string> = {
        purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
        pink: "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400",
        orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
        gray: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
        red: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    };

    return (
        <div className="group flex items-center gap-4 p-4 rounded-xl bg-surface-light dark:bg-surface-dark shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(244,192,37,0.15)] transition-all border border-black/5 dark:border-white/5 active:scale-[0.99] cursor-pointer">
            <div className={`size-10 rounded-full ${colorClasses[color]} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <span className="material-symbols-outlined">{icon}</span>
            </div>
            <div className="flex-1 text-left">
                <h4 className="font-bold text-base text-text-main-light dark:text-text-main-dark font-sans">{title}</h4>
            </div>
            <span className="material-symbols-outlined text-gray-400">chevron_right</span>
        </div>
    );
};

export default Profile;
