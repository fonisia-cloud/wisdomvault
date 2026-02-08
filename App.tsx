import React from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Profile from './pages/Profile';
import TasksRewards from './pages/TasksRewards';
import ReviewPlan from './pages/ReviewPlan';
import MistakeCapture from './pages/MistakeCapture';
import MistakeTagging from './pages/MistakeTagging';
import MistakeVault from './pages/MistakeVault';
import AITutor from './pages/AITutor';
import MistakePractice from './pages/MistakePractice';
import Achievements from './pages/Achievements';
import ParentCenter from './pages/ParentCenter';
import Settings from './pages/Settings';
import BottomNav from './components/BottomNav';
import { UserProvider, useUser } from './contexts/UserContext';

const AppContent: React.FC = () => {
    const location = useLocation();
    const { user, appSettings, parentSettings, isReady } = useUser();
    
    // Screens that should show the bottom navigation
    const showBottomNav = ['/home', '/profile', '/tasks', '/vault'].includes(location.pathname);

    // Protected Route Logic
    if (isReady && !user.isAuthenticated && location.pathname !== '/') {
        return <Navigate to="/" replace />;
    }

    // Font Size Class logic
    const fontClass = {
        'small': 'text-sm',
        'medium': 'text-base',
        'large': 'text-lg'
    }[appSettings.fontSize] || 'text-base';

    if (!isReady) {
        return (
            <div className="w-full min-h-[100svh] bg-background-light dark:bg-background-dark flex items-center justify-center">
                <div className="flex items-center gap-3 text-text-sec-light dark:text-text-sec-dark">
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    <span className="font-semibold">正在加载数据...</span>
                </div>
            </div>
        );
    }

    return (
        // 1. 软件需要自适应iPhone和ipad 的分辨率
        <div className={`w-full min-h-[100svh] bg-background-light dark:bg-background-dark relative overflow-x-hidden flex flex-col items-center ${fontClass}`}>
            
            {/* Rest Overlay (Global) */}
            {parentSettings.isRestMode && (
                <div className="fixed inset-0 z-[100] bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center animate-scan">
                    <div className="size-40 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-8 animate-pulse">
                         <span className="material-symbols-outlined text-blue-500 text-8xl">bedtime</span>
                    </div>
                    <h1 className="text-3xl font-black text-text-main-light dark:text-text-main-dark mb-4">休息时间到了</h1>
                    <p className="text-xl text-text-sec-light dark:text-text-sec-dark mb-8">
                        你已经学习很久了，让眼睛休息一下吧。<br/>
                        请休息 20 分钟后再回来。
                    </p>
                    <div className="w-full max-w-xs bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                         <div className="h-full bg-blue-500 w-1/3 animate-pulse"></div>
                    </div>
                    <p className="mt-2 text-sm text-gray-400">Resting...</p>
                </div>
            )}

            <div className="w-full max-w-[min(100%,1024px)] min-h-[100svh] flex flex-col bg-surface-light dark:bg-[#1a1810] shadow-2xl relative">
                <Routes>
                    <Route path="/" element={<Onboarding />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/tasks" element={<TasksRewards />} />
                    <Route path="/review" element={<ReviewPlan />} />
                    <Route path="/capture" element={<MistakeCapture />} />
                    <Route path="/tagging" element={<MistakeTagging />} />
                    <Route path="/vault" element={<MistakeVault />} />
                    <Route path="/practice/:mistakeId" element={<MistakePractice />} />
                    <Route path="/tutor" element={<AITutor />} />
                    <Route path="/tutor/:mistakeId" element={<AITutor />} />
                    <Route path="/achievements" element={<Achievements />} />
                    <Route path="/parent-center" element={<ParentCenter />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>
                
                {showBottomNav && <BottomNav />}
            </div>
        </div>
    );
};

const App: React.FC = () => {
    return (
        <UserProvider>
            <HashRouter>
                <AppContent />
            </HashRouter>
        </UserProvider>
    );
};

export default App;
