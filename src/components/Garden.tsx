import { useState } from 'react';
import { useStore } from '../store';
import { ZONES } from '../types';
import type { ZoneId } from '../types';

export default function Garden() {
  const { garden, history, goHome } = useStore();
  const [activeTab, setActiveTab] = useState<ZoneId | 'all'>('all');

  const zones: Array<ZoneId | 'all'> = ['all', 'gaming', 'studying', 'productivity', 'misc'];

  const filtered = activeTab === 'all' ? garden : garden.filter(p => p.zone === activeTab);

  const totalMinutes = history.filter(s => s.completed).reduce((a, s) => {
    const dur = s.endTime ? Math.floor((s.endTime - s.startTime) / 60000) : (s.duration || 0);
    return a + dur;
  }, 0);

  const tabColors: Record<string, string> = {
    all: 'text-accent-soft',
    gaming: 'text-gaming-soft',
    studying: 'text-studying-soft',
    productivity: 'text-productivity-soft',
    misc: 'text-misc-soft',
  };

  const tabBg: Record<string, string> = {
    all: 'bg-accent/10',
    gaming: 'bg-gaming/10',
    studying: 'bg-studying/10',
    productivity: 'bg-productivity/10',
    misc: 'bg-misc/10',
  };

  return (
    <div className="max-w-lg mx-auto w-full px-4 py-8 animate-fade">
      <button onClick={goHome} className="text-text-muted text-xs hover:text-text-secondary transition-colors mb-6 inline-block">
        ← Back
      </button>

      <h1 className="text-2xl font-bold text-text-primary mb-1">Your Garden</h1>
      <p className="text-text-secondary text-sm mb-6">
        {garden.length} plant{garden.length !== 1 ? 's' : ''} • {totalMinutes}m total focus
      </p>

      {/* Zone tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {zones.map(z => {
          const label = z === 'all' ? 'All' : ZONES[z].icon;
          const count = z === 'all' ? garden.length : garden.filter(p => p.zone === z).length;
          return (
            <button
              key={z}
              onClick={() => setActiveTab(z)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                activeTab === z
                  ? `${tabBg[z]} ${tabColors[z]}`
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {label} {count > 0 && <span className="ml-0.5 opacity-60">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Garden grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-3 opacity-30">🌱</div>
          <p className="text-text-muted text-sm">
            {activeTab === 'all'
              ? 'Complete sessions to grow your garden'
              : `No plants in ${ZONES[activeTab as ZoneId].label} yet`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-5 sm:grid-cols-6 gap-2.5">
          {filtered.map((plant, i) => (
            <div
              key={plant.id}
              className="group relative aspect-square rounded-xl bg-bg-surface border border-border hover:border-border-light flex items-center justify-center cursor-default transition-all animate-grow"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{plant.emoji}</span>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-bg-raised border border-border rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                <p className="text-[10px] font-medium text-text-primary">{plant.sessionName}</p>
                <p className="text-[10px] text-text-muted">{plant.minutes}m • {plant.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent sessions */}
      {history.filter(s => s.completed).length > 0 && (
        <div className="mt-8 border-t border-border pt-5">
          <p className="text-text-muted text-xs uppercase tracking-wide mb-3">Recent sessions</p>
          <div className="space-y-2">
            {history.filter(s => s.completed).slice(0, 5).map(s => {
              const dur = s.endTime ? Math.floor((s.endTime - s.startTime) / 60000) : (s.duration || 0);
              return (
                <div key={s.id} className="flex items-center gap-3 py-2">
                  <span className="text-lg">{ZONES[s.zone].icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{s.name}</p>
                    <p className="text-xs text-text-muted">{ZONES[s.zone].label} • {dur}m</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
