import { useStore } from '../store';
import { ZONES } from '../types';
import type { ZoneId } from '../types';

export default function Profile() {
  const { user, history, garden, goHome, logout } = useStore();

  if (!user) return null;

  const completedSessions = history.filter(s => s.completed);
  const totalMinutes = completedSessions.reduce((a, s) => {
    const dur = s.endTime ? Math.floor((s.endTime - s.startTime) / 60000) : (s.duration || 0);
    return a + dur;
  }, 0);

  const zones: ZoneId[] = ['gaming', 'studying', 'productivity', 'misc'];

  const zoneStats = zones.map(z => ({
    zone: z,
    sessions: completedSessions.filter(s => s.zone === z).length,
    plants: garden.filter(p => p.zone === z).length,
    minutes: completedSessions.filter(s => s.zone === z).reduce((a, s) => {
      const dur = s.endTime ? Math.floor((s.endTime - s.startTime) / 60000) : (s.duration || 0);
      return a + dur;
    }, 0),
  }));

  return (
    <div className="max-w-lg mx-auto w-full px-4 py-8 animate-fade">
      <button onClick={goHome} className="text-text-muted text-xs hover:text-text-secondary transition-colors mb-6 inline-block">
        ← Back
      </button>

      {/* User info */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-full bg-bg-raised border border-border flex items-center justify-center text-xl font-bold text-text-secondary">
          {user.name[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">{user.name}</h1>
          <p className="text-text-muted text-sm">{user.email}</p>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-bg-surface border border-border rounded-xl p-4 text-center">
          <p className="text-xl font-bold text-text-primary">{completedSessions.length}</p>
          <p className="text-[11px] text-text-muted mt-1">Sessions</p>
        </div>
        <div className="bg-bg-surface border border-border rounded-xl p-4 text-center">
          <p className="text-xl font-bold text-text-primary">{totalMinutes}m</p>
          <p className="text-[11px] text-text-muted mt-1">Focus Time</p>
        </div>
        <div className="bg-bg-surface border border-border rounded-xl p-4 text-center">
          <p className="text-xl font-bold text-text-primary">{garden.length}</p>
          <p className="text-[11px] text-text-muted mt-1">Plants</p>
        </div>
      </div>

      {/* Per-zone breakdown */}
      <h2 className="text-text-muted text-xs uppercase tracking-wide mb-3">By Zone</h2>
      <div className="space-y-2 mb-8">
        {zoneStats.map(zs => {
          const z = ZONES[zs.zone];
          return (
            <div key={zs.zone} className="flex items-center gap-3 py-2.5 px-3 bg-bg-surface border border-border rounded-xl">
              <span className="text-xl">{z.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">{z.label}</p>
                <p className="text-xs text-text-muted">{zs.sessions} sessions • {zs.minutes}m</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-text-primary">{zs.plants}</p>
                <p className="text-[10px] text-text-muted">plants</p>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={logout}
        className="w-full py-2.5 bg-bg-raised border border-border rounded-xl text-text-muted text-sm hover:text-red-400 hover:border-red-400/20 transition-colors"
      >
        Log Out
      </button>
    </div>
  );
}
