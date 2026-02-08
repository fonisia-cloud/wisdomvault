import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IMAGES } from '../constants';
import { useUser } from '../contexts/UserContext';
import { taskClaimsService } from '@/services/taskClaims';

const TasksRewards: React.FC = () => {
    const navigate = useNavigate();
    const { user, refreshData, mistakes, rewards, addReward, deleteReward, purchaseReward } = useUser();
    const [taskClaims, setTaskClaims] = useState<Record<string, string>>({});
    const [taskHint, setTaskHint] = useState('');
    
    // Add Reward Modal State
    const [isAddRewardModalOpen, setIsAddRewardModalOpen] = useState(false);
    const [newRewardTitle, setNewRewardTitle] = useState('');
    const [newRewardPrice, setNewRewardPrice] = useState('');
    const [newRewardIcon, setNewRewardIcon] = useState('redeem');
    const [rewardFormHint, setRewardFormHint] = useState('');
    const [isSubmittingReward, setIsSubmittingReward] = useState(false);

    useEffect(() => {
        if (!user.id) return;

        taskClaimsService.listClaims(user.id)
            .then((rows) => {
                const map: Record<string, string> = {};
                rows.forEach((row) => {
                    map[row.task_id] = row.claimed_at;
                });
                setTaskClaims(map);
            })
            .catch((error) => {
                console.error('Load task claims failed', error);
            });
    }, [user.id]);

    const isClaimedIn24h = (taskId: string) => {
        const claimedAt = taskClaims[taskId];
        if (!claimedAt) return false;
        return new Date(claimedAt).getTime() > Date.now() - 24 * 60 * 60 * 1000;
    };

    const handleClaim = async (taskId: string, reward: { coins: number; xp: number; energy: number }) => {
        if (isClaimedIn24h(taskId)) return;

        try {
            const ok = await taskClaimsService.claimTask(taskId, reward);
            if (!ok) {
                setTaskHint('该任务在24小时内已领取，请明天再来。');
                return;
            }

            setTaskClaims((prev) => ({ ...prev, [taskId]: new Date().toISOString() }));
            await refreshData();
            setTaskHint(`领取成功：+${reward.coins}金币 / +${reward.xp}XP / +${reward.energy}能量`);
        } catch (error) {
            console.error('Claim task failed', error);
            setTaskHint('领取失败，请稍后重试。');
        }
    };

    const handlePurchase = (id: string, price: number) => {
        if (purchaseReward(price)) {
            // Success animation or feedback could go here
            alert("兑换成功！");
        } else {
            alert("金币不足！");
        }
    };

    const handleAddRewardSubmit = async () => {
        if (!newRewardTitle.trim() || !newRewardPrice.trim()) {
            setRewardFormHint('请填写奖励名称和消耗金币。');
            return;
        }
        const price = parseInt(newRewardPrice);
        if (isNaN(price) || price < 0) {
            setRewardFormHint('金币消耗必须是大于等于0的整数。');
            return;
        }

        setIsSubmittingReward(true);
        setRewardFormHint('');

        const ok = await addReward({
            id: Date.now().toString(),
            title: newRewardTitle,
            price: price,
            icon: newRewardIcon,
            color: ['blue', 'green', 'purple', 'orange', 'pink'][Math.floor(Math.random() * 5)]
        });

        if (!ok) {
            setRewardFormHint('添加失败，请稍后重试。');
            setIsSubmittingReward(false);
            return;
        }
        
        setNewRewardTitle('');
        setNewRewardPrice('');
        setRewardFormHint('');
        setIsAddRewardModalOpen(false);
        setIsSubmittingReward(false);
    };

    const getTaskState = (id: string, isReady: boolean, defaultAction: () => void, reward: { coins: number; xp: number; energy: number }) => {
        if (isClaimedIn24h(id)) {
            return { actionText: "已完成", isPrimary: false, onClick: undefined };
        }
        if (isReady) {
            return { actionText: "领取", isPrimary: true, onClick: () => handleClaim(id, reward) };
        }
        return { actionText: "去完成", isPrimary: false, onClick: defaultAction };
    };

    // Task Logic
    const hasRecordedMistake = mistakes.length > 0;
    const hasCompletedChat = mistakes.some(m => m.status === 'completed');
    const hasReviewedFive = mistakes.filter(m => m.status === 'completed').length >= 5;
    const nextResetText = useMemo(() => {
        const firstClaim = taskClaims['record_mistake'];
        if (!firstClaim) return '';
        const left = new Date(firstClaim).getTime() + 24 * 60 * 60 * 1000 - Date.now();
        if (left <= 0) return '';
        const hours = Math.floor(left / (60 * 60 * 1000));
        const minutes = Math.floor((left % (60 * 60 * 1000)) / (60 * 1000));
        return `任务刷新倒计时：${hours}小时${minutes}分钟`;
    }, [taskClaims]);

    const task1Reward = { coins: 10, xp: 20, energy: 2 };
    const task2Reward = { coins: 20, xp: 35, energy: 3 };
    const task3Reward = { coins: 50, xp: 80, energy: 5 };

    const task1 = getTaskState('record_mistake', hasRecordedMistake, () => navigate('/capture'), task1Reward);
    const task2 = getTaskState('ai_chat', hasCompletedChat, () => navigate('/vault'), task2Reward);
    const task3 = getTaskState('review_5', hasReviewedFive, () => navigate('/review'), task3Reward);

    return (
        <div className="relative flex h-full min-h-[100dvh] w-full flex-col font-display pb-32">
            <header className="flex items-center px-4 py-3 justify-between sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm">
                <div onClick={() => navigate(-1)} className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-light dark:bg-surface-dark shadow-sm cursor-pointer active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-text-main-light dark:text-text-main-dark">arrow_back</span>
                </div>
                <h2 className="text-text-main-light dark:text-text-main-dark text-lg font-bold leading-tight flex-1 text-center">任务与奖励</h2>
                <div className="flex w-10 items-center justify-end">
                    {/* Settings button removed */}
                </div>
            </header>

            <div className="flex flex-col items-center justify-center px-4 pt-4 pb-6 w-full relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/20 rounded-full blur-3xl -z-10"></div>
                <div className="w-40 h-40 mb-2 relative animate-float">
                    <div className="w-full h-full bg-contain bg-center bg-no-repeat drop-shadow-2xl rounded-full" style={{ backgroundImage: `url("${IMAGES.piggyBank}")` }}></div>
                    <span className="material-symbols-outlined absolute -top-2 -right-2 text-primary text-3xl animate-pulse">spark</span>
                    <span className="material-symbols-outlined absolute bottom-2 -left-2 text-primary text-xl animate-pulse" style={{ animationDelay: '0.5s' }}>star</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2 bg-surface-light dark:bg-surface-dark px-6 py-2 rounded-full shadow-3d border-2 border-primary/20">
                        <span className="material-symbols-outlined text-primary text-3xl">monetization_on</span>
                        <span className="text-4xl font-black text-text-main-light dark:text-text-main-dark tracking-tight">{user.coins.toLocaleString()}</span>
                    </div>
                    <p className="text-text-sec-light dark:text-text-sec-dark text-sm font-semibold mt-2 uppercase tracking-wide">金币总额</p>
                    <p className="text-xs text-text-sec-light dark:text-text-sec-dark mt-1">能量 {user.energy}/{user.maxEnergy} · AI提问每次消耗1点能量</p>
                </div>
            </div>

            <div className="flex flex-col w-full px-4 mb-2">
                <h3 className="text-text-main-light dark:text-text-main-dark text-xl font-bold leading-tight pb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">calendar_today</span>
                    每日任务
                </h3>
                <div className="flex flex-col gap-3">
                    <TaskItem 
                        icon="mic" 
                        color="blue" 
                        title="记录1道错题" 
                        reward={`金币${task1Reward.coins} / XP${task1Reward.xp} / 能量${task1Reward.energy}`} 
                        actionText={task1.actionText} 
                        isPrimary={task1.isPrimary} 
                        onClick={task1.onClick}
                    />
                    <TaskItem 
                        icon="psychology_alt" 
                        color="green" 
                        title="完成AI对话" 
                        reward={`金币${task2Reward.coins} / XP${task2Reward.xp} / 能量${task2Reward.energy}`} 
                        actionText={task2.actionText} 
                        isPrimary={task2.isPrimary} 
                        onClick={task2.onClick}
                    />
                    <TaskItem 
                        icon="quiz" 
                        color="purple" 
                        title="复习5道题" 
                        reward={`金币${task3Reward.coins} / XP${task3Reward.xp} / 能量${task3Reward.energy}`} 
                        actionText={task3.actionText} 
                        isPrimary={task3.isPrimary} 
                        onClick={task3.onClick}
                    />
                </div>
                {(taskHint || nextResetText) && (
                    <p className="text-xs text-text-sec-light dark:text-text-sec-dark mt-2">
                        {taskHint || nextResetText}
                    </p>
                )}
            </div>

            <div className="flex flex-col w-full pt-4 pb-8">
                <div className="flex items-center justify-between px-4 pb-3">
                    <h3 className="text-text-main-light dark:text-text-main-dark text-xl font-bold leading-tight flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">storefront</span>
                        奖励商店
                    </h3>
                    {/* Add Reward Button in Header */}
                    <button 
                        onClick={() => setIsAddRewardModalOpen(true)}
                        className="text-primary text-sm font-bold flex items-center gap-1 active:opacity-70"
                    >
                        <span className="material-symbols-outlined text-base">add</span>
                        自定义奖励
                    </button>
                </div>
                
                {/* Customizable Rewards List */}
                <div className="flex overflow-x-auto gap-4 px-4 pb-4 no-scrollbar snap-x snap-mandatory min-h-[160px]">
                    {rewards.length > 0 ? (
                        rewards.map((reward) => (
                            <CustomRewardItem 
                                key={reward.id}
                                icon={reward.icon}
                                color={reward.color}
                                title={reward.title}
                                price={reward.price}
                                canAfford={user.coins >= reward.price}
                                onRedeem={() => handlePurchase(reward.id, reward.price)}
                                onDelete={() => deleteReward(reward.id)}
                            />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center w-full bg-surface-light dark:bg-surface-dark border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-6 text-center shrink-0">
                            <p className="text-gray-400 font-medium mb-2">还没有奖励项目</p>
                            <button 
                                onClick={() => setIsAddRewardModalOpen(true)}
                                className="px-4 py-2 bg-primary/10 text-primary rounded-lg font-bold text-sm"
                            >
                                添加第一个奖励
                            </button>
                        </div>
                    )}

                     {/* Add Button as last card */}
                     {rewards.length > 0 && (
                        <div 
                            onClick={() => setIsAddRewardModalOpen(true)}
                            className="snap-start shrink-0 w-[140px] flex flex-col bg-transparent rounded-2xl p-3 items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">add_circle</span>
                            <p className="text-gray-400 font-bold text-sm">添加奖励</p>
                        </div>
                     )}
                </div>
            </div>

            {/* Add Reward Modal */}
            {isAddRewardModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[scan_0.2s_ease-out]">
                    <div className="w-full max-w-sm bg-surface-light dark:bg-surface-dark rounded-3xl p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-text-main-light dark:text-text-main-dark">添加新奖励</h3>
                            <button onClick={() => setIsAddRewardModalOpen(false)} className="text-gray-400">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-text-sec-light dark:text-text-sec-dark mb-1">奖励名称</label>
                                <input 
                                    type="text" 
                                    placeholder="例如：看电视30分钟"
                                    className="w-full bg-background-light dark:bg-background-dark rounded-xl px-4 py-3 outline-none text-text-main-light dark:text-text-main-dark font-medium border-2 border-transparent focus:border-primary transition-colors"
                                    value={newRewardTitle}
                                    onChange={(e) => setNewRewardTitle(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-text-sec-light dark:text-text-sec-dark mb-1">兑换消耗 (金币)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3 material-symbols-outlined text-primary text-xl">monetization_on</span>
                                    <input 
                                        type="number" 
                                        placeholder="100"
                                        className="w-full bg-background-light dark:bg-background-dark rounded-xl pl-12 pr-4 py-3 outline-none text-text-main-light dark:text-text-main-dark font-bold border-2 border-transparent focus:border-primary transition-colors"
                                        value={newRewardPrice}
                                        onChange={(e) => setNewRewardPrice(e.target.value)}
                                    />
                                </div>
                            </div>
                            
                            {/* Simple Icon Selection */}
                            <div>
                                <label className="block text-xs font-bold text-text-sec-light dark:text-text-sec-dark mb-2">选择图标</label>
                                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                    {['redeem', 'tv', 'sports_esports', 'icecream', 'menu_book', 'pedal_bike', 'phone_iphone'].map(icon => (
                                        <button
                                            key={icon}
                                            onClick={() => setNewRewardIcon(icon)}
                                            className={`size-10 shrink-0 rounded-full flex items-center justify-center border-2 transition-all ${newRewardIcon === icon ? 'border-primary bg-primary/20 text-primary' : 'border-gray-200 dark:border-gray-700 text-gray-400'}`}
                                        >
                                            <span className="material-symbols-outlined text-xl">{icon}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button 
                                onClick={handleAddRewardSubmit}
                                disabled={isSubmittingReward}
                                className="w-full bg-primary text-[#221e10] font-bold text-lg py-3 rounded-xl shadow-lg shadow-primary/30 active:scale-[0.98] transition-all mt-2 disabled:opacity-60"
                            >
                                {isSubmittingReward ? '添加中...' : '确认添加'}
                            </button>
                            {rewardFormHint && <p className="text-xs text-red-500 text-center">{rewardFormHint}</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const TaskItem: React.FC<{ icon: string, color: string, title: string, reward: string, actionText: string, isPrimary: boolean, onClick?: () => void }> = ({ icon, color, title, reward, actionText, isPrimary, onClick }) => {
     const colorClasses: Record<string, string> = {
        blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
        green: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
        purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    };

    const isCompleted = actionText === "已完成";

    return (
        <div className={`flex items-center gap-4 bg-surface-light dark:bg-surface-dark rounded-xl p-3 shadow-sm border transition-colors ${isPrimary ? 'border-primary/20 relative overflow-hidden shadow-md' : 'border-transparent hover:border-primary/30'}`}>
            {isPrimary && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer pointer-events-none"></div>}
            <div className={`flex items-center justify-center rounded-xl ${colorClasses[color]} shrink-0 size-12`}>
                <span className="material-symbols-outlined">{icon}</span>
            </div>
            <div className="flex flex-col justify-center flex-1">
                <p className="text-text-main-light dark:text-text-main-dark text-base font-bold leading-normal">{title}</p>
                <p className="text-primary font-bold text-sm flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">add_circle</span> {reward} 金币
                </p>
            </div>
            <button 
                onClick={!isCompleted ? onClick : undefined}
                className={`flex shrink-0 min-w-[70px] cursor-pointer items-center justify-center rounded-lg h-9 px-3 text-sm font-bold active:translate-y-1 transition-all 
                ${isPrimary ? 'bg-primary text-white shadow-3d-primary' : 
                  isCompleted ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-default shadow-none active:translate-y-0' : 
                  'bg-gray-100 dark:bg-neutral-700 text-text-main-light dark:text-text-main-dark shadow-3d'}`}
            >
                {actionText}
            </button>
        </div>
    );
}

const CustomRewardItem: React.FC<{ icon: string, color: string, title: string, price: number, canAfford: boolean, onRedeem: () => void, onDelete: () => void }> = ({ icon, color, title, price, canAfford, onRedeem, onDelete }) => {
    // Map abstract color names to classes
    const colorClasses: Record<string, string> = {
        blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
        green: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
        purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
        orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
        pink: "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400",
    };

    return (
        <div className="snap-start shrink-0 w-[140px] flex flex-col bg-surface-light dark:bg-surface-dark rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-white/5 relative group">
            <button 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-colors z-10"
            >
                <span className="material-symbols-outlined text-[16px]">close</span>
            </button>

            <div className={`w-full aspect-square ${colorClasses[color] || colorClasses.blue} rounded-xl mb-3 flex items-center justify-center relative overflow-hidden`}>
                <span className="material-symbols-outlined text-5xl opacity-80">{icon}</span>
            </div>
            <p className="text-text-main-light dark:text-text-main-dark font-bold text-sm truncate">{title}</p>
            <div className="mt-2 flex items-center justify-between">
                <span className="text-primary font-black text-sm flex items-center"><span className="material-symbols-outlined text-sm mr-0.5">monetization_on</span>{price}</span>
            </div>
            <button 
                onClick={onRedeem}
                disabled={!canAfford}
                className={`w-full mt-2 py-1.5 rounded-lg text-xs font-bold active:translate-y-0.5 transition-all ${canAfford ? 'bg-primary text-white shadow-3d-primary hover:brightness-105' : 'bg-gray-200 dark:bg-neutral-700 text-gray-400 cursor-not-allowed'}`}
            >
                兑换
            </button>
        </div>
    );
}

export default TasksRewards;
