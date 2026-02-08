import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { authService } from '@/services/auth';
import { profileService } from '@/services/profile';
import { mistakesService } from '@/services/mistakes';
import { rewardsService } from '@/services/rewards';
import { settingsService } from '@/services/settings';
import type { AppSettingsRow, ParentSettingsRow } from '@/types/db';

export const LEVEL_SYSTEM = [
  { level: 1, minXp: 0, maxXp: 100, title: '初级探索者' },
  { level: 2, minXp: 101, maxXp: 300, title: '好奇学徒' },
  { level: 3, minXp: 301, maxXp: 600, title: '逻辑引路人' },
  { level: 4, minXp: 601, maxXp: 1000, title: '错题猎人' },
  { level: 5, minXp: 1001, maxXp: 2000, title: '智慧守护者' },
  { level: 6, minXp: 2001, maxXp: 5000, title: '真理大贤者' }
];

export interface Mistake {
  id: string;
  image: string;
  tags: string[];
  difficulty: number;
  questionText: string;
  note: string;
  date: number;
  status: 'pending' | 'completed';
}

export interface Reward {
  id: string;
  title: string;
  price: number;
  icon: string;
  color: string;
}

interface AppSettings {
  fontSize: 'small' | 'medium' | 'large';
  themeColor: 'primary' | 'blue' | 'green';
}

interface ParentSettings {
  pin: string;
  dailyTimeLimit: number;
  isRestMode: boolean;
}

interface UserState {
  id: string | null;
  isAuthenticated: boolean;
  name: string;
  email: string;
  xp: number;
  coins: number;
  energy: number;
  maxEnergy: number;
}

interface AuthResult {
  success: boolean;
  message?: string;
}

interface UserContextType {
  user: UserState;
  currentLevel: (typeof LEVEL_SYSTEM)[0];
  nextLevel: (typeof LEVEL_SYSTEM)[0] | null;
  progressToNextLevel: number;
  mistakes: Mistake[];
  rewards: Reward[];
  appSettings: AppSettings;
  parentSettings: ParentSettings;
  isReady: boolean;
  isBusy: boolean;
  login: (name?: string) => void;
  registerWithEmail: (email: string, password: string, name?: string) => Promise<AuthResult>;
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  addXp: (amount: number) => void;
  addCoins: (amount: number) => void;
  spendEnergy: (amount?: number) => boolean;
  addMistake: (mistake: Mistake) => void;
  deleteMistake: (id: string) => void;
  resolveMistake: (id: string) => void;
  addReward: (reward: Reward) => Promise<boolean>;
  deleteReward: (id: string) => void;
  purchaseReward: (price: number) => boolean;
  resetMembershipLevel: () => Promise<boolean>;
  updateAppSettings: (settings: Partial<AppSettings>) => void;
  updateParentSettings: (settings: Partial<ParentSettings>) => void;
  unlockParentCenter: (pin: string) => boolean;
  refreshData: () => Promise<void>;
}

const defaultUserState: UserState = {
  id: null,
  isAuthenticated: false,
  name: '探索者',
  email: '',
  xp: 0,
  coins: 0,
  energy: 10,
  maxEnergy: 10
};

const defaultAppSettings: AppSettings = {
  fontSize: 'medium',
  themeColor: 'primary'
};

const defaultParentSettings: ParentSettings = {
  pin: '0000',
  dailyTimeLimit: 60,
  isRestMode: false
};

const UserContext = createContext<UserContextType | undefined>(undefined);

const getCurrentLevelInfo = (xp: number) => {
  return LEVEL_SYSTEM.find((l) => xp >= l.minXp && xp <= l.maxXp) || LEVEL_SYSTEM[LEVEL_SYSTEM.length - 1];
};

const toAppSettings = (row: AppSettingsRow): AppSettings => ({
  fontSize: row.font_size,
  themeColor: row.theme_color
});

const toParentSettings = (row: ParentSettingsRow): ParentSettings => ({
  pin: row.pin,
  dailyTimeLimit: row.daily_time_limit,
  isRestMode: row.is_rest_mode
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserState>(defaultUserState);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>(defaultAppSettings);
  const [parentSettings, setParentSettings] = useState<ParentSettings>(defaultParentSettings);
  const [isReady, setIsReady] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const currentLevel = useMemo(() => getCurrentLevelInfo(user.xp), [user.xp]);
  const nextLevel = useMemo(() => LEVEL_SYSTEM.find((l) => l.level === currentLevel.level + 1) || null, [currentLevel]);

  const progressToNextLevel = useMemo(() => {
    if (!nextLevel) return 100;
    const range = currentLevel.maxXp - currentLevel.minXp;
    const current = user.xp - currentLevel.minXp;
    return Math.min(100, Math.max(0, (current / range) * 100));
  }, [currentLevel, nextLevel, user.xp]);

  const hydrateBySession = async (session: Session | null) => {
    if (!session?.user) {
      setUser(defaultUserState);
      setMistakes([]);
      setRewards([]);
      setAppSettings(defaultAppSettings);
      setParentSettings(defaultParentSettings);
      return;
    }

    const userId = session.user.id;

    const [profile, mistakeRows, rewardRows, appSettingsRow, parentSettingsRow] = await Promise.all([
      profileService.getProfile(userId),
      mistakesService.list(userId),
      rewardsService.list(userId),
      settingsService.getAppSettings(userId),
      settingsService.getParentSettings(userId)
    ]);

    setUser({
      id: userId,
      isAuthenticated: true,
      name: profile.display_name,
      email: session.user.email ?? '',
      xp: profile.xp,
      coins: profile.coins,
      energy: profile.energy,
      maxEnergy: profile.max_energy
    });

    setMistakes(
      mistakeRows.map((row) => ({
        id: row.id,
        image: row.image_url,
        tags: row.tags && row.tags.length ? row.tags : [row.subject || '未分类'],
        difficulty: row.difficulty,
        questionText: row.question_text || row.note || '',
        note: row.note || '',
        date: new Date(row.created_at).getTime(),
        status: row.status
      }))
    );

    setRewards(
      rewardRows.map((row) => ({
        id: row.id,
        title: row.title,
        price: row.price,
        icon: row.icon,
        color: row.color
      }))
    );

    setAppSettings(toAppSettings(appSettingsRow));
    setParentSettings(toParentSettings(parentSettingsRow));
  };

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const session = await authService.getSession();
        if (!mounted) return;
        await hydrateBySession(session);
      } catch (error) {
        console.error('Bootstrap user session failed', error);
      } finally {
        if (mounted) setIsReady(true);
      }
    };

    bootstrap();

    const unsubscribe = authService.onAuthStateChange(async (session) => {
      try {
        await hydrateBySession(session);
      } catch (error) {
        console.error('Auth state hydrate failed', error);
      } finally {
        setIsReady(true);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const registerWithEmail = async (email: string, password: string, name?: string): Promise<AuthResult> => {
    setIsBusy(true);
    try {
      await authService.signUp(email.trim(), password, name?.trim());
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error?.message || '注册失败，请稍后重试。' };
    } finally {
      setIsBusy(false);
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<AuthResult> => {
    setIsBusy(true);
    try {
      await authService.signIn(email.trim(), password);
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error?.message || '登录失败，请检查账号密码。' };
    } finally {
      setIsBusy(false);
    }
  };

  const login = (name?: string) => {
    console.warn('login(name) 已弃用，请使用 registerWithEmail/signInWithEmail。', name);
  };

  const logout = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const addXp = (amount: number) => {
    if (!user.id) return;
    const nextXp = user.xp + amount;
    setUser((prev) => ({ ...prev, xp: nextXp }));
    profileService.updateProfile(user.id, { xp: nextXp }).catch((error) => {
      console.error('Update xp failed', error);
    });
  };

  const addCoins = (amount: number) => {
    if (!user.id) return;
    const nextCoins = user.coins + amount;
    setUser((prev) => ({ ...prev, coins: nextCoins }));
    profileService.updateProfile(user.id, { coins: nextCoins }).catch((error) => {
      console.error('Update coins failed', error);
    });
  };

  const spendEnergy = (amount = 1) => {
    if (!user.id) return false;
    if (amount <= 0) return true;
    if (user.energy < amount) return false;

    const nextEnergy = user.energy - amount;
    setUser((prev) => ({ ...prev, energy: nextEnergy }));
    profileService.updateProfile(user.id, { energy: nextEnergy }).catch((error) => {
      console.error('Spend energy failed', error);
    });

    return true;
  };

  const addMistake = (mistake: Mistake) => {
    if (!user.id) return;

    mistakesService
      .create(user.id, {
        image_url: mistake.image,
        tags: mistake.tags,
        difficulty: mistake.difficulty,
        question_text: mistake.questionText,
        note: mistake.note,
        status: 'pending'
      })
      .then((row) => {
        setMistakes((prev) => [
          {
            id: row.id,
            image: row.image_url,
            tags: row.tags && row.tags.length ? row.tags : [row.subject || '未分类'],
            difficulty: row.difficulty,
            questionText: row.question_text || row.note || '',
            note: row.note || '',
            date: new Date(row.created_at).getTime(),
            status: row.status
          },
          ...prev
        ]);

        const nextXp = user.xp + 50;
        setUser((prev) => ({ ...prev, xp: nextXp }));
        return profileService.updateProfile(user.id as string, { xp: nextXp });
      })
      .catch((error) => {
        console.error('Create mistake failed', error);
      });
  };

  const resolveMistake = (id: string) => {
    if (!user.id) return;

    mistakesService
      .updateStatus(user.id, id, 'completed')
      .then(() => {
        setMistakes((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'completed' } : m)));

        const nextXp = user.xp + 100;
        const nextCoins = user.coins + 20;
        setUser((prev) => ({ ...prev, xp: nextXp, coins: nextCoins }));

        return profileService.updateProfile(user.id as string, { xp: nextXp, coins: nextCoins });
      })
      .catch((error) => {
        console.error('Resolve mistake failed', error);
      });
  };

  const deleteMistake = (id: string) => {
    if (!user.id) return;

    mistakesService
      .remove(user.id, id)
      .then(() => {
        setMistakes((prev) => prev.filter((m) => m.id !== id));
      })
      .catch((error) => {
        console.error('Delete mistake failed', error);
      });
  };

  const addReward = async (reward: Reward) => {
    if (!user.id) return false;

    try {
      const row = await rewardsService.create(user.id, {
        title: reward.title,
        price: reward.price,
        icon: reward.icon,
        color: reward.color
      });
      setRewards((prev) => [...prev, { id: row.id, title: row.title, price: row.price, icon: row.icon, color: row.color }]);
      return true;
    } catch (error) {
      console.error('Create reward failed', error);
      return false;
    }
  };

  const deleteReward = (id: string) => {
    if (!user.id) return;

    rewardsService
      .remove(user.id, id)
      .then(() => {
        setRewards((prev) => prev.filter((r) => r.id !== id));
      })
      .catch((error) => {
        console.error('Delete reward failed', error);
      });
  };

  const purchaseReward = (price: number) => {
    if (!user.id) return false;
    if (user.coins < price) return false;

    const nextCoins = user.coins - price;
    setUser((prev) => ({ ...prev, coins: nextCoins }));
    profileService.updateProfile(user.id, { coins: nextCoins }).catch((error) => {
      console.error('Purchase reward failed', error);
    });

    return true;
  };

  const resetMembershipLevel = async () => {
    if (!user.id) return false;
    try {
      setIsBusy(true);
      await profileService.updateProfile(user.id, { xp: 0 });
      setUser((prev) => ({ ...prev, xp: 0 }));
      return true;
    } catch (error) {
      console.error('Reset membership level failed', error);
      return false;
    } finally {
      setIsBusy(false);
    }
  };

  const updateAppSettings = (settings: Partial<AppSettings>) => {
    if (!user.id) return;

    const optimistic = { ...appSettings, ...settings };
    setAppSettings(optimistic);

    settingsService
      .updateAppSettings(user.id, {
        font_size: settings.fontSize,
        theme_color: settings.themeColor
      })
      .then((row) => setAppSettings(toAppSettings(row)))
      .catch((error) => {
        console.error('Update app settings failed', error);
      });
  };

  const updateParentSettings = (settings: Partial<ParentSettings>) => {
    if (!user.id) return;

    const optimistic = { ...parentSettings, ...settings };
    setParentSettings(optimistic);

    settingsService
      .updateParentSettings(user.id, {
        pin: settings.pin,
        daily_time_limit: settings.dailyTimeLimit,
        is_rest_mode: settings.isRestMode
      })
      .then((row) => setParentSettings(toParentSettings(row)))
      .catch((error) => {
        console.error('Update parent settings failed', error);
      });
  };

  const unlockParentCenter = (pin: string) => {
    return pin === parentSettings.pin;
  };

  const refreshData = async () => {
    if (!user.id) return;
    try {
      await hydrateBySession((await authService.getSession()) ?? null);
    } catch (error) {
      console.error('Refresh data failed', error);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        currentLevel,
        nextLevel,
        progressToNextLevel,
        mistakes,
        rewards,
        appSettings,
        parentSettings,
        isReady,
        isBusy,
        login,
        registerWithEmail,
        signInWithEmail,
        logout,
        addXp,
        addCoins,
        spendEnergy,
        addMistake,
        deleteMistake,
        resolveMistake,
        addReward,
        deleteReward,
        purchaseReward,
        resetMembershipLevel,
        updateAppSettings,
        updateParentSettings,
        unlockParentCenter,
        refreshData
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
