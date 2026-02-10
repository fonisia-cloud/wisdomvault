import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { IMAGES } from '../constants';

const Achievements: React.FC = () => {
    const navigate = useNavigate();
    const { user, mistakes, currentLevel } = useUser();

    const solvedCount = mistakes.filter(m => m.status === 'completed').length;
    const totalMistakes = mistakes.length;

    return (
        <div className="flex flex-col min-h-[100dvh] w-full bg-background-light dark:bg-background-dark font-display pb-10">
            {/* Header */}
            <header className="flex items-center px-4 py-3 sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 safe-top-pad">
                <button onClick={() => navigate(-1)} className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-light dark:bg-surface-dark shadow-sm cursor-pointer active:scale-95 transition-transform border border-black/5 dark:border-white/5">
                    <span className="material-symbols-outlined text-text-main-light dark:text-text-main-dark">arrow_back</span>
                </button>
                <h2 className="text-text-main-light dark:text-text-main-dark text-lg font-bold leading-tight flex-1 text-center pr-10">我的成就</h2>
            </header>

            <div className="flex flex-col items-center p-6 relative">
                 {/* Decorative Background Elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none -z-10"></div>
                <div className="absolute top-10 right-10 text-4xl animate-bounce delay-100">🏆</div>
                <div className="absolute top-20 left-10 text-3xl animate-bounce delay-700">⭐</div>
                
                <div className="size-32 rounded-full border-4 border-primary bg-surface-light dark:bg-surface-dark shadow-xl flex items-center justify-center mb-4 relative z-10 animate-[float_3s_ease-in-out_infinite]">
                    <div className="w-full h-full bg-cover bg-center rounded-full" style={{ backgroundImage: `url("${IMAGES.avatarWizard}")` }}></div>
                </div>
                
                <h1 className="text-2xl font-black text-text-main-light dark:text-text-main-dark mb-1">{user.name}</h1>
                <p className="text-text-sec-light dark:text-text-sec-dark font-medium bg-surface-light dark:bg-surface-dark px-3 py-1 rounded-full border border-black/5 dark:border-white/5 shadow-sm">
                    {currentLevel.title}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 px-4 w-full max-w-lg mx-auto">
                <AchievementCard 
                    icon="military_tech" 
                    color="text-yellow-500" 
                    bgColor="bg-yellow-50 dark:bg-yellow-900/20"
                    label="当前等级" 
                    value={`Lv.${currentLevel.level}`} 
                />
                 <AchievementCard 
                    icon="monetization_on" 
                    color="text-orange-500" 
                    bgColor="bg-orange-50 dark:bg-orange-900/20"
                    label="累计金币" 
                    value={user.coins.toLocaleString()} 
                />
                 <AchievementCard 
                    icon="check_circle" 
                    color="text-green-500" 
                    bgColor="bg-green-50 dark:bg-green-900/20"
                    label="攻克错题" 
                    value={solvedCount.toString()} 
                    subValue={`共收集 ${totalMistakes} 题`}
                />
                 <AchievementCard 
                    icon="local_fire_department" 
                    color="text-red-500" 
                    bgColor="bg-red-50 dark:bg-red-900/20"
                    label="最高连胜" 
                    value="5 天" 
                />
            </div>

            <div className="mt-8 px-6 w-full max-w-lg mx-auto">
                <h3 className="text-lg font-bold text-text-main-light dark:text-text-main-dark mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">emoji_events</span>
                    勋章墙
                </h3>
                <div className="grid grid-cols-3 gap-4">
                    <Badge icon="school" label="好学宝宝" unlocked={true} />
                    <Badge icon="psychology" label="逻辑大师" unlocked={solvedCount > 5} />
                    <Badge icon="edit_note" label="笔记达人" unlocked={totalMistakes > 2} />
                    <Badge icon="rocket_launch" label="速度之星" unlocked={false} />
                    <Badge icon="group" label="乐于分享" unlocked={false} />
                    <Badge icon="auto_awesome" label="完美主义" unlocked={false} />
                </div>
            </div>
        </div>
    );
};

const AchievementCard: React.FC<{ icon: string, color: string, bgColor: string, label: string, value: string, subValue?: string }> = ({ icon, color, bgColor, label, value, subValue }) => {
    return (
        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-black/5 dark:border-white/5 flex flex-col items-center justify-center gap-2 hover:scale-105 transition-transform duration-300">
            <div className={`size-10 rounded-full ${bgColor} flex items-center justify-center`}>
                <span className={`material-symbols-outlined ${color} text-2xl`}>{icon}</span>
            </div>
            <div className="text-center">
                <p className="text-2xl font-black text-text-main-light dark:text-text-main-dark leading-none mb-1">{value}</p>
                <p className="text-xs font-bold text-text-sec-light dark:text-text-sec-dark uppercase tracking-wide">{label}</p>
                {subValue && <p className="text-[10px] text-gray-400 mt-1">{subValue}</p>}
            </div>
        </div>
    );
}

const Badge: React.FC<{ icon: string, label: string, unlocked: boolean }> = ({ icon, label, unlocked }) => {
    return (
        <div className={`flex flex-col items-center gap-2 group ${unlocked ? '' : 'opacity-40 grayscale'}`}>
            <div className={`size-20 rounded-full flex items-center justify-center border-4 relative overflow-hidden transition-all duration-300
                ${unlocked 
                    ? 'bg-gradient-to-br from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-transparent border-yellow-400 shadow-lg group-hover:scale-110' 
                    : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700'}`}>
                
                {unlocked && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
                <span className={`material-symbols-outlined text-4xl ${unlocked ? 'text-yellow-500 drop-shadow-md' : 'text-gray-400'}`}>{icon}</span>
            </div>
            <p className="text-xs font-bold text-text-main-light dark:text-text-main-dark">{label}</p>
        </div>
    );
}

export default Achievements;
