import React from 'react';
import { NavLink } from 'react-router-dom';

const BottomNav: React.FC = () => {
    return (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 dark:border-white/5 bg-surface-light dark:bg-surface-dark px-4 pt-2 pb-[max(env(safe-area-inset-bottom),0.1rem)] shadow-[0_-4px_10px_rgba(0,0,0,0.02)] mx-auto w-full max-w-[min(100%,1024px)]">
            <div className="flex justify-around items-end">
                <NavItem to="/home" icon="home" label="首页" />
                <NavItem to="/vault" icon="menu_book" label="错题库" hasBadge />
                <div className="w-8"></div> {/* Spacer for the Floating Action Button if present on page */}
                <NavItem to="/tasks" icon="storefront" label="商城" />
                <NavItem to="/profile" icon="person" label="个人中心" />
            </div>
        </nav>
    );
};

interface NavItemProps {
    to: string;
    icon: string;
    label: string;
    hasBadge?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, hasBadge }) => {
    return (
        <NavLink 
            to={to} 
            className={({ isActive }) => 
                `flex flex-1 flex-col items-center justify-end gap-1 group transition-colors ${
                    isActive ? 'text-primary' : 'text-text-sec-light dark:text-text-sec-dark hover:text-text-main-light dark:hover:text-text-main-dark'
                }`
            }
        >
            {({ isActive }) => (
                <>
                    <div className="relative flex h-8 items-center justify-center group-hover:-translate-y-1 transition-transform duration-200">
                        <span className={`material-symbols-outlined text-[28px] ${isActive ? 'filled' : ''}`}>{icon}</span>
                        {hasBadge && (
                            <div className="absolute top-0 right-0 size-2.5 bg-red-500 rounded-full border-2 border-surface-light dark:border-surface-dark"></div>
                        )}
                    </div>
                    <p className={`text-xs ${isActive ? 'font-bold' : 'font-medium'} leading-normal tracking-[0.015em]`}>{label}</p>
                </>
            )}
        </NavLink>
    );
};

export default BottomNav;
