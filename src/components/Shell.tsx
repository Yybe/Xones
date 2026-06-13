import { type ReactNode } from 'react';
import { useStore } from '../store';
import { ZONES } from '../types';

export default function Shell({ children }: { children: ReactNode }) {
  const { user, view, activeZone, activeSession, setView, goHome, friends } = useStore();

  const activeFriends = friends.filter(f => f.status === 'in-zone' && f.currentSession);

  const navItems: Array<{ id: typeof view; label: string; icon: string }> = [
    { id: 'comfort', label: 'Home', icon: '☁️' },
    { id: 'friends', label: 'Friends', icon: '👥' },
    { id: 'garden', label: 'Garden', icon: '🌱' },
    { id: 'profile', label: 'Profile', icon: '○' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar — minimal, always visible on desktop */}
      <aside className="hidden md:flex flex-col w-56 border-r border-border bg-bg-surface shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <span className="font-bold text-text-primary text-sm tracking-tight">Xones</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(item => {
            const isActive = view === item.id || (item.id === 'comfort' && view === 'zone');
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'comfort') goHome();
                  else setView(item.id);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-bg-hover text-text-primary font-medium'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover/50'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
                {item.id === 'friends' && activeFriends.length > 0 && (
                  <span className="ml-auto text-[10px] bg-accent/10 text-accent-soft px-1.5 py-0.5 rounded-full font-medium">
                    {activeFriends.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Active session indicator */}
        {activeSession && activeZone && (
          <div className="px-3 pb-3">
            <div className="p-3 rounded-xl bg-bg-raised border border-border">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" />
                <span className="text-xs font-medium text-accent-soft">In Session</span>
              </div>
              <p className="text-xs text-text-primary truncate">{activeSession.name}</p>
              <p className="text-[10px] text-text-muted mt-0.5">{ZONES[activeZone].icon} {ZONES[activeZone].label}</p>
            </div>
          </div>
        )}

        {/* User */}
        <div className="px-3 pb-4 border-t border-border pt-3">
          <button
            onClick={() => setView('profile')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-bg-hover/50 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-bg-raised border border-border flex items-center justify-center text-xs font-semibold text-text-secondary">
              {user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <span className="text-sm text-text-secondary truncate">{user?.name || 'User'}</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-surface/95 backdrop-blur-lg border-t border-border z-30">
        <div className="flex items-center justify-around py-2.5 px-2">
          {navItems.map(item => {
            const isActive = view === item.id || (item.id === 'comfort' && view === 'zone');
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'comfort') goHome();
                  else setView(item.id);
                }}
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                  isActive ? 'text-text-primary' : 'text-text-muted'
                }`}
              >
                <span className="text-lg">{item.id === 'profile' ? (user?.name?.[0]?.toUpperCase() || '?') : item.icon}</span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
