import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { IMAGES } from '../constants';
import { useUser } from '../contexts/UserContext';

const MistakeTagging: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { addMistake } = useUser();

    // State for interactive elements
    const [selectedTags, setSelectedTags] = useState<string[]>(['分数']);
    const [customTags, setCustomTags] = useState<string[]>([]);
    const [difficulty, setDifficulty] = useState<number>(3);
    const routeState = (location.state || {}) as { capturedImage?: string; recognizedQuestion?: string };
    const previewImage = routeState.capturedImage || IMAGES.homeworkMath;
    const [questionText, setQuestionText] = useState(routeState.recognizedQuestion || '');
    const [note, setNote] = useState('');
    const [saveError, setSaveError] = useState('');
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTagInputValue, setNewTagInputValue] = useState('');

    const PREDEFINED_TAGS = [
        { label: "分数", color: "blue" },
        { label: "方程", color: "blue" },
        { label: "几何", color: "blue" },
        { label: "代数", color: "pink" },
        { label: "小数", color: "teal" },
        { label: "百分比", color: "orange" },
    ];

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const handleAddCustomTagClick = () => {
        setNewTagInputValue('');
        setIsModalOpen(true);
    };

    const confirmAddTag = () => {
        if (newTagInputValue && newTagInputValue.trim() !== "") {
            const tag = newTagInputValue.trim();
            if (!customTags.includes(tag)) {
                setCustomTags([...customTags, tag]);
                // Automatically select the new tag
                if (!selectedTags.includes(tag)) {
                    setSelectedTags([...selectedTags, tag]);
                }
            }
        }
        setIsModalOpen(false);
    };

    const handleSave = () => {
        if (!questionText.trim()) {
            setSaveError('请先识别并确认题目内容，再存入错题库。');
            return;
        }

        setSaveError('');
        addMistake({
            id: Date.now().toString(),
            image: previewImage,
            tags: selectedTags,
            difficulty: difficulty,
            questionText: questionText.trim(),
            note: note || '我的错题笔记',
            date: Date.now(),
            status: 'pending'
        });
        navigate('/vault');
    };

    return (
        <div className="relative flex h-full min-h-[100svh] w-full flex-col font-display antialiased text-[#181611] dark:text-gray-100 transition-colors duration-200">
            {/* Header */}
            <div className="flex items-center bg-background-light dark:bg-background-dark p-4 sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="text-[#181611] dark:text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h2 className="text-[#181611] dark:text-white text-lg font-bold leading-tight flex-1 text-center pr-10">错题贴标签</h2>
            </div>

            <div className="flex-1 flex flex-col pb-24">
                {/* Image Preview */}
                <div className="w-full p-4">
                    <div className="w-full gap-1 overflow-hidden bg-surface-light dark:bg-surface-dark p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col">
                        <div className="flex items-center gap-2 px-1 pb-2">
                            <span className="material-symbols-outlined text-red-400 text-[20px]">error_circle_rounded</span>
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">错题截图</span>
                        </div>
                        <div className="relative w-full aspect-[3/2] rounded-xl overflow-hidden group cursor-pointer">
                            <div className="w-full h-full bg-center bg-no-repeat bg-cover transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url("${previewImage}")` }}></div>
                            <div className="absolute inset-0 bg-black/10"></div>
                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm">
                                点击查看
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tags Section */}
                <div className="flex flex-col">
                    <div className="px-4 pb-3 pt-2 flex justify-between items-end">
                        <h3 className="text-[#181611] dark:text-white text-lg font-bold leading-tight">知识点标签</h3>
                    </div>
                    <div className="flex gap-3 px-4 flex-wrap">
                        {PREDEFINED_TAGS.map((tag) => (
                            <TagButton 
                                key={tag.label} 
                                label={tag.label} 
                                color={tag.color} 
                                active={selectedTags.includes(tag.label)}
                                onClick={() => toggleTag(tag.label)}
                            />
                        ))}
                        {customTags.map((tag) => (
                             <TagButton 
                                key={tag} 
                                label={tag} 
                                color="blue" 
                                active={selectedTags.includes(tag)}
                                onClick={() => toggleTag(tag)}
                            />
                        ))}
                        
                        <button 
                            onClick={handleAddCustomTagClick}
                            className="flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-xl bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 pl-4 pr-4 transition-all hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95"
                        >
                            <span className="material-symbols-outlined text-gray-400 text-[18px]">add</span>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal">添加自定义</p>
                        </button>
                    </div>
                </div>

                <div className="h-6"></div>

                {/* Difficulty */}
                <div className="flex flex-col px-4">
                    <h3 className="text-[#181611] dark:text-white text-lg font-bold leading-tight pb-3">难度系数</h3>
                    <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center gap-2">
                        <div className="flex gap-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button 
                                    key={star} 
                                    onClick={() => setDifficulty(star)}
                                    className="transition-transform hover:scale-110 active:scale-90 focus:outline-none"
                                >
                                    <span className={`material-symbols-outlined text-4xl ${star <= difficulty ? 'filled text-primary' : 'unfilled text-gray-300 dark:text-gray-600'}`}>
                                        star
                                    </span>
                                </button>
                            ))}
                        </div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
                            {difficulty <= 2 ? '小菜一碟' : difficulty === 3 ? '有点挑战，但没问题！' : '难度很高，需要复习'}
                        </p>
                    </div>
                </div>

                {/* Question Text */}
                <div className="flex flex-col px-4 mt-6">
                    <label className="text-[#181611] dark:text-white text-sm font-bold leading-tight pb-2 ml-1">题目内容 (OCR，可编辑)</label>
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 p-3 transition-colors focus-within:border-primary">
                        <textarea
                            value={questionText}
                            onChange={(e) => setQuestionText(e.target.value)}
                            className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 text-[#181611] dark:text-gray-200 placeholder-gray-400 resize-none h-32"
                            placeholder="请先在上一页识别题目，或在这里手动补充题目内容"
                        ></textarea>
                    </div>
                </div>

                {/* Notes */}
                <div className="flex flex-col px-4 mt-6">
                    <label className="text-[#181611] dark:text-white text-sm font-bold leading-tight pb-2 ml-1">我的笔记 (选填)</label>
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 p-3 transition-colors focus-within:border-primary">
                        <textarea 
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 text-[#181611] dark:text-gray-200 placeholder-gray-400 resize-none h-16" 
                            placeholder="我为什么做错了？"
                        ></textarea>
                    </div>
                </div>
                {saveError && <p className="px-4 mt-3 text-sm text-red-500">{saveError}</p>}
            </div>

            {/* Bottom Button */}
            <div className="fixed inset-x-0 bottom-0 p-4 bg-gradient-to-t from-background-light via-background-light to-transparent dark:from-background-dark dark:via-background-dark pt-8 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] mx-auto w-full max-w-[min(100%,1024px)]">
                <button 
                    onClick={handleSave}
                    className="w-full bg-primary hover:bg-primary-dark text-[#181611] font-bold text-lg h-14 rounded-2xl shadow-lg shadow-orange-200 dark:shadow-none flex items-center justify-center gap-3 transition-all transform active:scale-[0.98]"
                >
                    <span className="material-symbols-outlined">inventory_2</span>
                    存入错题宝库
                    <div className="bg-white/30 rounded-full px-2 py-0.5 text-xs font-black tracking-wide text-[#181611]/80">
                        +50 经验
                    </div>
                </button>
            </div>

            {/* Custom Tag Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
                    <div className="w-full max-w-xs bg-surface-light dark:bg-surface-dark rounded-2xl p-6 shadow-2xl flex flex-col gap-4 animate-[float_0.2s_ease-out]">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-text-main-light dark:text-text-main-dark">添加新标签</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                            <input 
                                autoFocus
                                type="text" 
                                className="w-full h-12 px-4 rounded-xl bg-background-light dark:bg-background-dark border-2 border-transparent focus:border-primary outline-none text-text-main-light dark:text-text-main-dark transition-all placeholder:text-gray-400"
                                placeholder="输入标签名称..."
                                value={newTagInputValue}
                                onChange={(e) => setNewTagInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && confirmAddTag()}
                            />
                            <p className="text-xs text-gray-500 pl-1">例如: 三角函数, 英语语法...</p>
                        </div>

                        <div className="flex gap-3 mt-2">
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 h-11 rounded-xl bg-gray-100 dark:bg-gray-800 text-text-sec-light dark:text-text-sec-dark font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                取消
                            </button>
                            <button 
                                onClick={confirmAddTag}
                                className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary-dark text-text-main-light font-bold text-sm shadow-md shadow-primary/20 transition-colors"
                            >
                                确认添加
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const TagButton: React.FC<{ label: string, active?: boolean, color?: string, onClick?: () => void }> = ({ label, active, color = 'blue', onClick }) => {
    // Basic color mapping
    const colorClasses: any = {
        blue: active ? 'bg-primary/20 border-primary text-primary-dark dark:text-primary shadow-sm shadow-primary/10' : 'bg-blue-100 dark:bg-blue-900/30 border-transparent text-blue-800 dark:text-blue-200',
        pink: active ? 'bg-primary/20 border-primary text-primary-dark dark:text-primary shadow-sm shadow-primary/10' : 'bg-pink-100 dark:bg-pink-900/30 border-transparent text-pink-800 dark:text-pink-200',
        teal: active ? 'bg-primary/20 border-primary text-primary-dark dark:text-primary shadow-sm shadow-primary/10' : 'bg-teal-100 dark:bg-teal-900/30 border-transparent text-teal-800 dark:text-teal-200',
        orange: active ? 'bg-primary/20 border-primary text-primary-dark dark:text-primary shadow-sm shadow-primary/10' : 'bg-orange-100 dark:bg-orange-900/30 border-transparent text-orange-800 dark:text-orange-200',
    };

    return (
        <button 
            onClick={onClick}
            className={`group flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-xl border-2 pl-4 pr-4 transition-all active:scale-95 ${colorClasses[color]}`}
        >
            {active && <span className="material-symbols-outlined text-primary-dark dark:text-primary text-[18px]">check</span>}
            <p className="text-sm font-bold leading-normal">{label}</p>
        </button>
    );
};

export default MistakeTagging;
