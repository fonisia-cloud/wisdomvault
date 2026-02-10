import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IMAGES } from '../constants';
import { useUser, Mistake } from '../contexts/UserContext';
import jsPDF from 'jspdf';

const MistakeVault: React.FC = () => {
    const navigate = useNavigate();
    const { mistakes, deleteMistake } = useUser();
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isExporting, setIsExporting] = useState(false);

    // 1. Prepare all items (from real user data only)
    const allItems = useMemo(() => {
        const userItems = mistakes.map(m => ({
            id: m.id,
            title: m.tags[0] ? `${m.tags[0]}挑战` : "新错题",
            desc: (m.questionText || m.note || '暂无题目').slice(0, 80),
            questionText: m.questionText || m.note || '暂无题目内容',
            image: m.image,
            tag1: m.tags[0] || "未分类",
            tag2: m.status === 'completed' ? "已攻克" : `${m.difficulty} 星难度`,
            tag2Color: m.status === 'completed' ? "gray" : "red",
            status: m.status
        }));

        return userItems;
    }, [mistakes]);

    // 2. Apply Status Filter
    const statusFilteredItems = useMemo(() => {
        return allItems.filter(item => {
            if (filter === 'all') return true;
            return item.status === filter;
        });
    }, [allItems, filter]);

    // 3. Apply keyword search on tag + question text
    const keywordFilteredItems = useMemo(() => {
        const keyword = searchKeyword.trim().toLowerCase();
        if (!keyword) return statusFilteredItems;

        return statusFilteredItems.filter((item) => {
            const haystack = [item.tag1, item.title, item.questionText, item.desc].join(' ').toLowerCase();
            return haystack.includes(keyword);
        });
    }, [statusFilteredItems, searchKeyword]);

    // 4. Derive Subjects (Tags) from the currently visible items
    const subjects = useMemo(() => {
        const stats: Record<string, { count: number, pending: number }> = {};
        
        keywordFilteredItems.forEach(item => {
            const tag = item.tag1;
            if (!stats[tag]) {
                stats[tag] = { count: 0, pending: 0 };
            }
            stats[tag].count++;
            if (item.status === 'pending') stats[tag].pending++;
        });

        // Convert to array and sort by count
        return Object.entries(stats)
            .map(([tag, val]) => ({
                name: tag,
                count: val.count,
                pending: val.pending
            }))
            .sort((a, b) => b.count - a.count);
    }, [keywordFilteredItems]);

    // 5. Apply Tag Filter (Active Tag) for the list view
    const finalDisplayList = useMemo(() => {
        if (!activeTag) return keywordFilteredItems;
        return keywordFilteredItems.filter(item => item.tag1 === activeTag);
    }, [keywordFilteredItems, activeTag]);

    // Reset active tag if it's no longer in the list (e.g. switched status filter)
    React.useEffect(() => {
        if (activeTag && !subjects.find(s => s.name === activeTag)) {
            setActiveTag(null);
        }
    }, [subjects, activeTag]);

    // Helper to get image based on tag name
    const getSubjectConfig = (tagName: string) => {
        const map: Record<string, { img: string, color: string }> = {
            "数学": { img: IMAGES.islandMath, color: "bg-primary" },
            "分数": { img: IMAGES.islandMath, color: "bg-primary" },
            "几何": { img: IMAGES.abstractShape, color: "bg-blue-400" },
            "英语": { img: IMAGES.treasureChest, color: "bg-blue-400" },
            "单词": { img: IMAGES.treasureChest, color: "bg-blue-400" },
            "科学": { img: IMAGES.labScience, color: "bg-green-400" },
            "物理": { img: IMAGES.labScience, color: "bg-green-400" },
            "未分类": { img: IMAGES.frameShop, color: "bg-gray-400" }
        };

        if (map[tagName]) return map[tagName];
        
        // Fallback deterministic selection based on char code
        const imgs = [IMAGES.islandMath, IMAGES.treasureChest, IMAGES.labScience, IMAGES.abstractShape, IMAGES.lettersSpace];
        const colors = ["bg-primary", "bg-blue-400", "bg-green-400", "bg-purple-400", "bg-orange-400"];
        
        const hash = tagName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return {
            img: imgs[hash % imgs.length],
            color: colors[hash % colors.length]
        };
    };

    const toggleSelectMode = () => {
        setIsSelectMode((prev) => {
            const next = !prev;
            if (!next) setSelectedIds([]);
            return next;
        });
    };

    const cancelSelectMode = () => {
        setIsSelectMode(false);
        setSelectedIds([]);
    };

    const toggleSelectItem = (id: string) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
    };

    const selectedItems = useMemo(() => {
        return finalDisplayList.filter((item) => selectedIds.includes(item.id));
    }, [finalDisplayList, selectedIds]);

    const normalizeQuestionForPdf = (raw: string) => {
        return (raw || '')
            .replace(/\r\n/g, '\n')
            .replace(/\$\$([^$]+)\$\$/g, '$1')
            .replace(/\$([^$]+)\$/g, '$1')
            .replace(/\\\((.*?)\\\)/g, '$1')
            .replace(/\\\[(.*?)\\\]/g, '$1')
            .replace(/\\times|\\cdot/g, '×')
            .replace(/\\div/g, '÷')
            .replace(/\\leq|\\le/g, '≤')
            .replace(/\\geq|\\ge/g, '≥')
            .replace(/\\neq/g, '≠')
            .replace(/[{}]/g, '')
            .replace(/[ \t]{2,}/g, ' ')
            .trim();
    };

    const renderQuestionPageDataUrl = async (item: any, index: number, pageWidthPt: number, pageHeightPt: number) => {
        const scale = 2;
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(pageWidthPt * scale);
        canvas.height = Math.floor(pageHeightPt * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('无法创建导出画布');

        const drawW = canvas.width;
        const drawH = canvas.height;
        const padding = 40 * scale;
        const lineHeight = 26 * scale;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, drawW, drawH);

        let y = padding;
        ctx.fillStyle = '#111111';
        ctx.font = `${20 * scale}px "Microsoft YaHei", "PingFang SC", sans-serif`;
        ctx.fillText(`错题 ${index + 1}: ${item.title}`, padding, y);

        y += 34 * scale;
        ctx.fillStyle = '#444444';
        ctx.font = `${14 * scale}px "Microsoft YaHei", "PingFang SC", sans-serif`;
        ctx.fillText(`标签: ${item.tag1}   难度: ${item.tag2}`, padding, y);

        y += 26 * scale;

        const maxImageW = drawW - padding * 2;
        const maxImageH = Math.floor(drawH * 0.38);
        if (item.image && String(item.image).startsWith('data:image/')) {
            const imageElement = new Image();
            await new Promise<void>((resolve) => {
                imageElement.onload = () => resolve();
                imageElement.onerror = () => resolve();
                imageElement.src = item.image;
            });

            const fit = () => {
                const iw = imageElement.naturalWidth || maxImageW;
                const ih = imageElement.naturalHeight || maxImageH;
                const ratio = Math.min(maxImageW / iw, maxImageH / ih, 1);
                const rw = Math.floor(iw * ratio);
                const rh = Math.floor(ih * ratio);
                const x = padding + Math.floor((maxImageW - rw) / 2);
                const roundedY = y;
                ctx.fillStyle = '#f5f5f3';
                ctx.fillRect(padding, roundedY, maxImageW, rh + 16);
                ctx.drawImage(imageElement, x, roundedY + 8, rw, rh);
                return rh + 24;
            };

            y += fit();
        }

        y += 12 * scale;
        ctx.fillStyle = '#111111';
        ctx.font = `${16 * scale}px "Microsoft YaHei", "PingFang SC", sans-serif`;

        const text = normalizeQuestionForPdf(item.questionText || item.desc || '暂无题目内容');
        const maxTextWidth = drawW - padding * 2;
        const paragraphs = text.split('\n');

        const drawWrappedLine = (rawLine: string) => {
            const line = rawLine || ' ';
            let segment = '';
            for (const ch of line) {
                const test = segment + ch;
                const width = ctx.measureText(test).width;
                if (width > maxTextWidth && segment) {
                    ctx.fillText(segment, padding, y);
                    y += lineHeight;
                    segment = ch;
                } else {
                    segment = test;
                }
            }
            ctx.fillText(segment, padding, y);
            y += lineHeight;
        };

        paragraphs.forEach((p) => {
            drawWrappedLine(p);
            y += 6 * scale;
        });

        return canvas.toDataURL('image/png');
    };

    const exportSelectedToPdf = async () => {
        if (!selectedItems.length || isExporting) return;
        setIsExporting(true);

        try {
            const doc = new jsPDF({ unit: 'pt', format: 'a4' });
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            for (let i = 0; i < selectedItems.length; i++) {
                const item = selectedItems[i];
                if (i > 0) doc.addPage();

                const pageDataUrl = await renderQuestionPageDataUrl(item, i, pageWidth, pageHeight);
                doc.addImage(pageDataUrl, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
            }

            doc.save(`wisdomvault-mistakes-${Date.now()}.pdf`);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="relative flex min-h-[100dvh] w-full flex-col font-display antialiased pb-24 bg-background-light dark:bg-background-dark overflow-x-hidden">
            <div className="flex items-center px-4 py-4 justify-between sticky top-0 z-10 bg-background-light/90 dark:bg-background-dark/90 md:max-w-4xl md:mx-auto md:w-full safe-top-pad">
                <button onClick={() => navigate('/home')} className="text-gray-900 dark:text-white flex size-12 shrink-0 items-center justify-start cursor-pointer transition-transform active:scale-95">
                    <span className="material-symbols-outlined text-3xl">arrow_back</span>
                </button>
                <h2 className="text-gray-900 dark:text-white text-xl font-extrabold leading-tight tracking-tight flex-1 text-center">错题宝库</h2>
                <div className="flex w-12 items-center justify-end">
                    <button onClick={toggleSelectMode} className="size-10 rounded-full bg-gray-100 dark:bg-[#393528] flex items-center justify-center text-gray-700 dark:text-gray-200">
                        <span className="material-symbols-outlined text-[20px]">checklist</span>
                    </button>
                </div>
            </div>

            {isSelectMode && (
                <div className="px-5 pt-2 pb-3 flex flex-wrap items-center gap-2">
                    <button
                        onClick={cancelSelectMode}
                        className="h-9 px-3 rounded-lg text-sm font-bold bg-gray-200 dark:bg-[#393528] text-gray-700 dark:text-gray-200"
                    >
                        取消
                    </button>
                    <button
                        onClick={exportSelectedToPdf}
                        disabled={!selectedIds.length || isExporting}
                        className="h-9 px-3 rounded-lg text-sm font-bold bg-blue-500 text-white disabled:opacity-50"
                    >
                        {isExporting ? '导出中...' : `导出PDF (${selectedIds.length})`}
                    </button>
                </div>
            )}

            <main className="flex-1 w-full md:max-w-4xl md:mx-auto ios-scroll">
                {/* Search */}
                <div className="px-5 py-2">
                    <label className="flex flex-col h-14 w-full shadow-lg dark:shadow-black/20 rounded-xl">
                        <div className="flex w-full flex-1 items-stretch rounded-xl h-full bg-white dark:bg-[#393528] border border-gray-200 dark:border-transparent transition-all focus-within:ring-2 focus-within:ring-primary/50">
                            <div className="text-gray-400 dark:text-[#bab29c] flex items-center justify-center pl-4 pr-2">
                                <span className="material-symbols-outlined">search</span>
                            </div>
                            <input
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                className="flex w-full min-w-0 flex-1 bg-transparent text-gray-900 dark:text-white focus:outline-0 focus:ring-0 border-none h-full placeholder:text-gray-400 dark:placeholder:text-[#bab29c] px-2 text-base font-medium rounded-xl"
                                placeholder="按标签或题目内容搜索..."
                            />
                            {searchKeyword && (
                                <button
                                    onClick={() => setSearchKeyword('')}
                                    className="text-gray-400 dark:text-[#bab29c] flex items-center justify-center pr-3"
                                >
                                    <span className="material-symbols-outlined text-[20px]">close</span>
                                </button>
                            )}
                        </div>
                    </label>
                </div>

                {/* Filters */}
                <div className="flex gap-3 px-5 py-4 overflow-x-auto no-scrollbar">
                    <FilterButton label="全部" active={filter === 'all'} onClick={() => setFilter('all')} />
                    <FilterButton label="挑战中" active={filter === 'pending'} onClick={() => setFilter('pending')} />
                    <FilterButton label="已攻克" active={filter === 'completed'} onClick={() => setFilter('completed')} />
                </div>

                {/* Subjects Grid (Dynamic based on mistakes) */}
                <div className="px-5 pt-4 pb-2 flex justify-between items-end">
                    <h2 className="text-gray-900 dark:text-white text-[22px] font-bold leading-tight">学科世界</h2>
                    {activeTag ? (
                        <button className="text-primary text-sm font-bold" onClick={() => setActiveTag(null)}>
                            显示全部
                        </button>
                    ) : <div className="w-16" />}
                </div>
                
                {/* Dynamic Subject List */}
                {subjects.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-5 pb-6">
                        {subjects.map(subject => {
                            const config = getSubjectConfig(subject.name);
                            const isActive = activeTag === subject.name;
                            return (
                                <SubjectCard 
                                    key={subject.name}
                                    title={subject.name} 
                                    count={`${subject.count}个题目`} 
                                    bgImage={config.img} 
                                    progress={Math.random() * 60 + 20} // Mock progress for now
                                    color={config.color}
                                    active={isActive}
                                    onClick={() => setActiveTag(isActive ? null : subject.name)}
                                />
                            );
                        })}
                    </div>
                ) : (
                    <div className="px-5 pb-6">
                        <div className="w-full bg-gray-50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 text-center">
                            <p className="text-gray-400 dark:text-gray-500 font-medium">还没有错题标签哦，快去添加错题吧！</p>
                            <button 
                                onClick={() => navigate('/capture')}
                                className="mt-4 px-4 py-2 bg-primary/10 text-primary rounded-lg font-bold text-sm hover:bg-primary/20 transition-colors"
                            >
                                去添加
                            </button>
                        </div>
                    </div>
                )}

                {/* Recent Challenges */}
                <div className="px-5 pt-2 pb-3 flex items-center gap-2">
                    <h2 className="text-gray-900 dark:text-white text-[22px] font-bold leading-tight">
                        {activeTag ? `${activeTag}挑战` : '最近挑战'}
                    </h2>
                    {searchKeyword && (
                        <span className="bg-blue-500/10 text-blue-600 dark:text-blue-300 text-xs font-bold px-2 py-0.5 rounded-md">
                            搜索: {searchKeyword}
                        </span>
                    )}
                    {activeTag && (
                        <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-md">
                            筛选中
                        </span>
                    )}
                </div>
                <div className="flex flex-col md:grid md:grid-cols-2 gap-4 px-5">
                    {finalDisplayList.map((item, index) => (
                        <ChallengeItem 
                            key={`${item.id}-${index}`}
                            id={item.id}
                            title={item.title}
                            desc={item.desc}
                            questionText={item.questionText}
                            image={item.image}
                            tag1={item.tag1}
                            tag2={item.tag2}
                            tag2Color={item.tag2Color}
                            completed={item.status === 'completed'}
                            selectable={isSelectMode}
                            selected={selectedIds.includes(item.id)}
                            onToggleSelect={() => toggleSelectItem(item.id)}
                            onClick={() => navigate(`/practice/${item.id}`)}
                            onDelete={() => deleteMistake(item.id)}
                        />
                    ))}
                    
                    {finalDisplayList.length === 0 && (
                        <div className="col-span-full py-10 flex flex-col items-center justify-center text-gray-400">
                             <span className="material-symbols-outlined text-5xl mb-2">inbox</span>
                             <p>暂无{activeTag || ''}挑战</p>
                        </div>
                    )}
                </div>
            </main>

        </div>
    );
};

const FilterButton: React.FC<{ label: string, active: boolean, onClick: () => void }> = ({ label, active, onClick }) => {
    return (
        <button 
            onClick={onClick}
            className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full pl-5 pr-5 transition-all active:scale-95 ${active ? 'bg-primary text-[#221e10] shadow-md shadow-primary/20 font-bold' : 'bg-gray-200 dark:bg-[#393528] text-gray-600 dark:text-white hover:bg-gray-300 dark:hover:bg-[#4a4536] font-medium'}`}
        >
            <span className="text-sm leading-normal">{label}</span>
        </button>
    )
}

const SubjectCard: React.FC<{ title: string, count: string, bgImage: string, progress: number, color: string, active?: boolean, onClick?: () => void }> = ({ title, count, bgImage, progress, color, active, onClick }) => {
    return (
        <div 
            onClick={onClick}
            className={`group relative flex flex-col gap-3 rounded-2xl p-3 bg-white dark:bg-[#2C2819] shadow-md dark:shadow-none border overflow-hidden transition-all hover:translate-y-[-2px] cursor-pointer 
            ${active ? 'ring-2 ring-primary border-primary/50' : 'border-gray-100 dark:border-white/5'}`}
        >
            <div className="absolute top-0 right-0 p-3 z-10">
                <div className={`${active ? 'bg-primary text-[#221e10]' : 'bg-black/30 text-white backdrop-blur-sm'} text-xs font-bold px-2 py-1 rounded-lg transition-colors`}>
                    {count}
                </div>
            </div>
            <div className="w-full bg-center bg-no-repeat aspect-[4/3] bg-cover rounded-xl shadow-inner relative transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url("${bgImage}")` }}>
                <div className={`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-xl ${active ? 'opacity-40' : 'opacity-60'}`}></div>
                {active && <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-3xl drop-shadow-lg">check_circle</span>
                </div>}
            </div>
            <div>
                <p className={`text-gray-900 dark:text-white text-lg font-bold leading-normal ${active ? 'text-primary dark:text-primary' : ''}`}>{title}</p>
                <div className="w-full bg-gray-200 dark:bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className={`${color} h-full rounded-full`} style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        </div>
    );
};

const ChallengeItem: React.FC<{ id: string, title: string, desc: string, questionText?: string, image: string, tag1: string, tag2: string, tag2Color: string, ringColor?: string, completed?: boolean, selectable?: boolean, selected?: boolean, onToggleSelect?: () => void, onClick?: () => void, onDelete?: () => void }> = ({ id, title, desc, questionText, image, tag1, tag2, tag2Color, ringColor = 'primary', completed, selectable, selected, onToggleSelect, onClick, onDelete }) => {
    const ringClass = ringColor === 'primary' ? 'ring-primary/20' : ringColor === 'blue' ? 'ring-blue-500/20' : 'ring-gray-500/20';
    const [offsetX, setOffsetX] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const [showDeleteHint, setShowDeleteHint] = useState(false);
    const startXRef = React.useRef<number | null>(null);
    const startOffsetRef = React.useRef(0);
    const longPressRef = React.useRef<number | null>(null);
    const movedRef = React.useRef(false);
    const ACTION_WIDTH = 92;
    const revealRatio = Math.min(1, Math.abs(offsetX) / ACTION_WIDTH);
    
    // Tag 2 colors
    const tag2Classes: any = {
        red: "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-300",
        green: "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300",
        gray: "bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400",
    };

    // Tag 1 colors (based on ringColor logic slightly)
    const tag1Classes = ringColor === 'blue' ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300" : ringColor === 'gray' ? "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300" : "bg-primary/20 text-yellow-700 dark:text-primary";

    const clearLongPress = () => {
        if (longPressRef.current) {
            window.clearTimeout(longPressRef.current);
            longPressRef.current = null;
        }
    };

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        startXRef.current = e.clientX;
        startOffsetRef.current = offsetX;
        movedRef.current = false;
        setIsSwiping(true);
        clearLongPress();
        longPressRef.current = window.setTimeout(() => {
            setShowDeleteHint(true);
            setOffsetX(-ACTION_WIDTH);
        }, 550);
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isSwiping || startXRef.current === null) return;
        const dx = e.clientX - startXRef.current;
        if (Math.abs(dx) > 8) movedRef.current = true;

        clearLongPress();
        // iOS-like rubber band near edge
        const raw = startOffsetRef.current + dx;
        const clampedLeft = Math.max(-ACTION_WIDTH - Math.max(0, (-raw - ACTION_WIDTH) * 0.2), raw);
        const clamped = Math.min(20, Math.max(-ACTION_WIDTH - 18, clampedLeft));
        setOffsetX(clamped);
    };

    const onPointerUp = () => {
        clearLongPress();
        setIsSwiping(false);
        if (offsetX < -ACTION_WIDTH * 0.45) {
            setOffsetX(-ACTION_WIDTH);
            setShowDeleteHint(true);
        } else {
            setOffsetX(0);
            setShowDeleteHint(false);
        }
    };

    const handleClick = () => {
        if (selectable) {
            onToggleSelect?.();
            return;
        }
        if (movedRef.current || offsetX !== 0) return;
        onClick?.();
    };

    return (
        <div className="relative overflow-hidden rounded-xl">
            <div className={`absolute inset-y-0 right-0 flex items-center pr-3 transition-all duration-200 ${showDeleteHint || revealRatio > 0.02 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.();
                    }}
                    className="h-10 px-3 rounded-lg bg-red-500 text-white text-xs font-bold shadow-sm"
                    aria-label={`delete-${id}`}
                    style={{ transform: `scale(${0.92 + revealRatio * 0.08})` }}
                >
                    删除
                </button>
            </div>
        <div
            onClick={handleClick}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className={`relative flex items-center gap-4 bg-white dark:bg-[#2C2819] p-4 rounded-xl shadow-sm border cursor-pointer active:scale-[0.98] ${isSwiping ? '' : 'transition-transform duration-250 ease-out'} ${completed ? 'opacity-70' : ''} ${selected ? 'border-primary ring-2 ring-primary/30' : 'border-gray-100 dark:border-white/5'}`}
            style={{ transform: `translateX(${offsetX}px)` }}
        >
            {selectable && (
                <div className={`absolute top-2 left-2 size-5 rounded-md border-2 flex items-center justify-center ${selected ? 'bg-primary border-primary' : 'bg-white/90 border-gray-300'}`}>
                    {selected && <span className="material-symbols-outlined text-[14px] text-[#221e10]">check</span>}
                </div>
            )}
            <div className={`h-16 w-16 shrink-0 rounded-lg bg-cover bg-center ring-2 ${ringClass} ${completed ? 'grayscale relative' : ''}`} style={{ backgroundImage: `url("${image}")` }}>
                {completed && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg">
                        <span className="material-symbols-outlined text-white text-2xl">check_circle</span>
                    </div>
                )}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
                <h3 className={`text-gray-900 dark:text-white font-bold text-base truncate ${completed ? 'line-through decoration-primary decoration-2' : ''}`}>{title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5 truncate">{(questionText || desc).slice(0, 80)}</p>
                <div className="flex gap-2 mt-2">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${tag1Classes}`}>{tag1}</span>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 ${tag2Classes[tag2Color]}`}>
                         {tag2Color === 'red' && <span className="material-symbols-outlined text-[10px]">bolt</span>}
                         {tag2}
                    </span>
                </div>
            </div>
            <div className="flex items-center justify-center size-8 rounded-full bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-500">
                <span className="material-symbols-outlined">{completed ? 'replay' : 'chevron_right'}</span>
            </div>
        </div>
        </div>
    );
};

export default MistakeVault;
