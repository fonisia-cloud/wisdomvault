import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IMAGES } from '../constants';
import { useUser } from '../contexts/UserContext';

const Onboarding: React.FC = () => {
    const navigate = useNavigate();
    const { user, registerWithEmail, signInWithEmail, isBusy } = useUser();
    
    // Registration State
    const [showRegister, setShowRegister] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Login State
    const [showLogin, setShowLogin] = useState(false);
    const [loginIdentifier, setLoginIdentifier] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [authError, setAuthError] = useState('');
    const isAuthModalOpen = showRegister || showLogin;

    // If already logged in, redirect to home
    React.useEffect(() => {
        if (user.isAuthenticated) {
            const active = document.activeElement as HTMLElement | null;
            active?.blur();
            setShowLogin(false);
            setShowRegister(false);
            navigate('/home', { replace: true });
        }
    }, [user.isAuthenticated, navigate]);

    const handleStartClick = () => {
        setShowRegister(true);
    };

    const handleLoginClick = () => {
        setShowLogin(true);
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');

        const nameToUse = username.trim() || '新探索者';
        if (!email.trim() || !password.trim()) {
            setAuthError('请填写邮箱和密码。');
            return;
        }

        const result = await registerWithEmail(email, password, nameToUse);
        if (!result.success) {
            setAuthError(result.message || '注册失败，请稍后重试。');
            return;
        }

        (document.activeElement as HTMLElement | null)?.blur();
        setShowRegister(false);
        window.scrollTo(0, 0);
        setTimeout(() => navigate('/home', { replace: true }), 60);
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');

        if (!loginIdentifier.trim() || !loginPassword.trim()) {
            setAuthError('请输入邮箱和密码。');
            return;
        }

        const result = await signInWithEmail(loginIdentifier, loginPassword);
        if (!result.success) {
            setAuthError(result.message || '登录失败，请检查账号密码。');
            return;
        }

        (document.activeElement as HTMLElement | null)?.blur();
        setShowLogin(false);
        window.scrollTo(0, 0);
        setTimeout(() => navigate('/home', { replace: true }), 60);
    };

    return (
        <div className="relative flex min-h-[100svh] w-full flex-col overflow-x-hidden overflow-y-auto ios-scroll bg-background-light dark:bg-background-dark font-display">
            <div className="absolute top-[-10%] right-[-20%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <main className={`flex-1 flex flex-col items-center justify-between px-4 pb-6 pt-[max(env(safe-area-inset-top),0.75rem)] z-10 w-full max-w-md mx-auto transition-opacity ${isAuthModalOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <div className="flex-1 flex flex-col items-center justify-center w-full mt-2">
                    <div className="relative w-full max-w-[220px] aspect-square flex items-center justify-center mb-4">
                        <div className="absolute inset-4 bg-gradient-to-tr from-primary/20 to-orange-200/20 rounded-full border-4 border-white dark:border-white/10 shadow-2xl"></div>
                        <div className="absolute top-10 left-0 text-3xl animate-bounce" style={{ animationDelay: '0.2s' }}>✨</div>
                        <div className="absolute bottom-10 right-4 text-3xl animate-bounce" style={{ animationDelay: '0.5s' }}>🚀</div>
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="size-32 rounded-full overflow-hidden border-4 border-primary shadow-lg bg-white dark:bg-surface-dark flex items-center justify-center relative">
                                <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url("${IMAGES.robotToy}")` }}></div>
                                <span className="material-symbols-outlined text-primary text-[82px] drop-shadow-sm">smart_toy</span>
                            </div>
                            <div className="absolute -right-2 top-0 bg-white dark:bg-surface-dark px-3 py-1.5 rounded-xl rounded-bl-none shadow-md border border-gray-100 dark:border-gray-700 animate-[pulse_3s_infinite]">
                                <span className="text-xl">👋</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-center space-y-3 px-2">
                        <h1 className="text-2xl font-black leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-text-main-light to-primary dark:from-white dark:to-primary/80 drop-shadow-sm">
                            开启智慧宝库<br />消灭错题怪兽
                        </h1>
                        <p className="text-text-sec-light dark:text-text-sec-dark font-medium text-sm">
                            Unlock the Treasure Vault, <br /> Defeat Mistake Monsters
                        </p>
                    </div>
                </div>

                {/* Fixed Carousel Container with Full Bleed */}
                <div className="w-auto self-stretch -mx-4 mt-2 mb-3">
                    <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 px-4 py-4 no-scrollbar items-stretch touch-pan-x">
                        <FeatureCard 
                            icon="psychology" 
                            color="blue" 
                            title="AI Socratic Tutor" 
                            desc="AI 苏格拉底导师\n引导式提问，自主思考" 
                        />
                        <FeatureCard 
                            icon="military_tech" 
                            color="yellow" 
                            title="Gamified Rewards" 
                            desc="游戏化奖励机制\n让学习像寻宝一样有趣" 
                        />
                        <FeatureCard 
                            icon="update" 
                            color="green" 
                            title="Ebbinghaus Review" 
                            desc="艾宾浩斯科学复习\n告别无效的题海战术" 
                        />
                    </div>
                    <div className="flex justify-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary transition-all duration-300"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-primary/50 cursor-pointer transition-all duration-300"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-primary/50 cursor-pointer transition-all duration-300"></div>
                    </div>
                </div>

                <div className="w-full max-w-sm space-y-3 z-10 pt-1">
                    <button 
                        onClick={handleStartClick}
                        className="w-full h-12 bg-primary rounded-2xl flex items-center justify-center shadow-[0_4px_14px_rgba(244,192,37,0.4)] hover:shadow-[0_6px_20px_rgba(244,192,37,0.5)] active:scale-[0.98] transition-all group"
                    >
                        <span className="text-text-main-light font-bold text-base tracking-wide group-hover:mr-1 transition-all">立即开始 / 注册</span>
                        <span className="material-symbols-outlined text-text-main-light text-[24px] opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-1 transition-all">arrow_forward</span>
                    </button>
                    <button onClick={handleLoginClick} className="w-full h-12 bg-transparent border-2 border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl flex items-center justify-center active:scale-[0.98] transition-all">
                        <span className="text-text-sec-light dark:text-text-sec-dark font-bold text-base">已有账号登录</span>
                    </button>
                    <p className="text-center text-[10px] text-text-sec-light/50 dark:text-text-sec-dark/50 mt-4 px-4">
                        By continuing, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>
            </main>

            {/* Registration Modal */}
            {showRegister && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
                    <div 
                        className="absolute inset-0 bg-black/60 transition-opacity" 
                        onClick={() => setShowRegister(false)}
                    ></div>
                    <div className="relative w-full max-w-sm max-h-[85svh] overflow-y-auto bg-surface-light dark:bg-surface-dark rounded-[1.5rem] p-5 shadow-2xl flex flex-col items-center">
                        <button 
                            onClick={() => setShowRegister(false)}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                            <span className="material-symbols-outlined text-text-sec-light dark:text-text-sec-dark">close</span>
                        </button>

                        <div className="size-20 rounded-full bg-primary/20 mb-4 flex items-center justify-center ring-4 ring-white dark:ring-surface-dark shadow-lg">
                             <div className="w-full h-full bg-cover bg-center rounded-full" style={{ backgroundImage: `url("${IMAGES.avatarWizard}")` }}></div>
                        </div>

                        <h2 className="text-xl font-black text-text-main-light dark:text-text-main-dark mb-2">创建你的档案</h2>
                        <p className="text-sm text-text-sec-light dark:text-text-sec-dark mb-6 text-center">
                            欢迎来到智慧宝库！<br/>填写信息，开启你的冒险。
                        </p>

                        <form onSubmit={handleRegisterSubmit} className="w-full flex flex-col gap-3">
                            {authError && <p className="text-red-500 text-sm font-medium">{authError}</p>}
                            {/* Username Input */}
                            <div className="w-full h-12 bg-background-light dark:bg-background-dark rounded-xl border-2 border-transparent focus-within:border-primary transition-all flex items-center px-4 gap-3">
                                <span className="material-symbols-outlined text-text-sec-light dark:text-text-sec-dark">person</span>
                                <input 
                                    type="text" 
                                    placeholder="用户名" 
                                    className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-text-main-light dark:text-text-main-dark font-bold placeholder:font-medium placeholder:text-text-sec-light/50"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            {/* Email Input */}
                            <div className="w-full h-12 bg-background-light dark:bg-background-dark rounded-xl border-2 border-transparent focus-within:border-primary transition-all flex items-center px-4 gap-3">
                                <span className="material-symbols-outlined text-text-sec-light dark:text-text-sec-dark">mail</span>
                                <input 
                                    type="email" 
                                    placeholder="电子邮箱" 
                                    className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-text-main-light dark:text-text-main-dark font-bold placeholder:font-medium placeholder:text-text-sec-light/50"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            {/* Password Input */}
                            <div className="w-full h-12 bg-background-light dark:bg-background-dark rounded-xl border-2 border-transparent focus-within:border-primary transition-all flex items-center px-4 gap-3">
                                <span className="material-symbols-outlined text-text-sec-light dark:text-text-sec-dark">lock</span>
                                <input 
                                    type="password" 
                                    placeholder="密码" 
                                    className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-text-main-light dark:text-text-main-dark font-bold placeholder:font-medium placeholder:text-text-sec-light/50"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={isBusy}
                                className="w-full h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 active:scale-[0.98] transition-all mt-1 disabled:opacity-60"
                            >
                                <span className="text-text-main-light font-bold text-base">{isBusy ? '提交中...' : '完成注册'}</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Login Modal */}
            {showLogin && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
                    <div 
                        className="absolute inset-0 bg-black/60 transition-opacity" 
                        onClick={() => setShowLogin(false)}
                    ></div>
                    <div className="relative w-full max-w-sm max-h-[85svh] overflow-y-auto bg-surface-light dark:bg-surface-dark rounded-[1.5rem] p-5 shadow-2xl flex flex-col items-center">
                        <button 
                            onClick={() => setShowLogin(false)}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                            <span className="material-symbols-outlined text-text-sec-light dark:text-text-sec-dark">close</span>
                        </button>

                        <div className="size-20 rounded-full bg-blue-50 dark:bg-blue-900/20 mb-4 flex items-center justify-center ring-4 ring-white dark:ring-surface-dark shadow-lg">
                             <div className="w-full h-full bg-cover bg-center rounded-full opacity-90" style={{ backgroundImage: `url("${IMAGES.robotToy}")` }}></div>
                        </div>

                        <h2 className="text-xl font-black text-text-main-light dark:text-text-main-dark mb-2">欢迎回来</h2>
                        <p className="text-sm text-text-sec-light dark:text-text-sec-dark mb-6 text-center">
                            请输入账号密码<br/>继续你的学习之旅
                        </p>

                        <form onSubmit={handleLoginSubmit} className="w-full flex flex-col gap-3">
                            {authError && <p className="text-red-500 text-sm font-medium">{authError}</p>}
                            {/* Identifier Input */}
                            <div className="w-full h-12 bg-background-light dark:bg-background-dark rounded-xl border-2 border-transparent focus-within:border-primary transition-all flex items-center px-4 gap-3">
                                <span className="material-symbols-outlined text-text-sec-light dark:text-text-sec-dark">person</span>
                                <input 
                                    type="email" 
                                    placeholder="邮箱" 
                                    className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-text-main-light dark:text-text-main-dark font-bold placeholder:font-medium placeholder:text-text-sec-light/50"
                                    value={loginIdentifier}
                                    onChange={(e) => setLoginIdentifier(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            {/* Password Input */}
                            <div className="w-full h-12 bg-background-light dark:bg-background-dark rounded-xl border-2 border-transparent focus-within:border-primary transition-all flex items-center px-4 gap-3">
                                <span className="material-symbols-outlined text-text-sec-light dark:text-text-sec-dark">key</span>
                                <input 
                                    type="password" 
                                    placeholder="密码" 
                                    className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-text-main-light dark:text-text-main-dark font-bold placeholder:font-medium placeholder:text-text-sec-light/50"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={isBusy}
                                className="w-full h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 active:scale-[0.98] transition-all mt-1 disabled:opacity-60"
                            >
                                <span className="text-text-main-light font-bold text-base">{isBusy ? '登录中...' : '立即登录'}</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const FeatureCard: React.FC<{ icon: string, color: string, title: string, desc: string }> = React.memo(({ icon, color, title, desc }) => {
    const colorClasses: Record<string, string> = {
        blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-500",
        yellow: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-500",
        green: "bg-green-50 dark:bg-green-900/20 text-green-500",
    };

    return (
        <div className="snap-center shrink-0 w-[220px] sm:w-[240px] bg-white dark:bg-surface-dark p-4 rounded-3xl shadow-[0_8px_20px_rgba(0,0,0,0.04)] dark:shadow-none border border-black/5 dark:border-white/5 flex flex-col items-center text-center group">
            <div className={`w-14 h-14 rounded-2xl ${colorClasses[color]} flex items-center justify-center mb-4 group-hover:rotate-6 transition-transform`}>
                <span className="material-symbols-outlined text-[32px]">{icon}</span>
            </div>
            <h3 className="font-bold text-lg mb-2 text-text-main-light dark:text-text-main-dark">{title}</h3>
            <p className="text-sm text-text-sec-light dark:text-text-sec-dark leading-relaxed whitespace-pre-line">
                {desc.replace(/\\n/g, '\n')}
            </p>
        </div>
    );
});

export default Onboarding;
