import { useStore } from '../store';
import { ZONES } from '../types';
import type { ZoneId } from '../types';

function elapsed(start: number): string {
  const m = Math.floor((Date.now() - start) / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm > 0 ? `${h}h ${rm}m` : `${h}h`;
}

export default function ComfortZone() {
  const { enterZone, friends } = useStore();
  const activeFriends = friends.filter(f => f.status === 'in-zone' && f.currentSession);

  const zoneKeys: ZoneId[] = ['gaming', 'studying', 'productivity', 'misc'];

  // Count friends per zone
  const zoneCounts: Record<ZoneId, number> = { gaming: 0, studying: 0, productivity: 0, misc: 0 };
  activeFriends.forEach(f => {
    if (f.currentZone) zoneCounts[f.currentZone]++;
  });

  const zoneColorClass: Record<ZoneId, string> = {
    gaming: 'border-gaming/20 hover:border-gaming/50 hover:bg-gaming/[0.04]',
    studying: 'border-studying/20 hover:border-studying/50 hover:bg-studying/[0.04]',
    productivity: 'border-productivity/20 hover:border-productivity/50 hover:bg-productivity/[0.04]',
    misc: 'border-misc/20 hover:border-misc/50 hover:bg-misc/[0.04]',
  };

  const zoneTextColor: Record<ZoneId, string> = {
    gaming: 'text-gaming-soft',
    studying: 'text-studying-soft',
    productivity: 'text-productivity-soft',
    misc: 'text-misc-soft',
  };

  const zoneDotColor: Record<ZoneId, string> = {
    gaming: 'bg-gaming',
    studying: 'bg-studying',
    productivity: 'bg-productivity',
    misc: 'bg-misc',
  };

  return (
    <div className="min-h-full flex flex-col pb-20 md:pb-0">
      {/* Center: the four zones */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Subtle heading */}
        <div className="text-center mb-10 animate-fade">
          <p className="text-text-muted text-sm tracking-wide uppercase mb-2">You're in your</p>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight">Comfort Zone</h1>
          <p className="text-text-secondary text-sm mt-3 max-w-xs mx-auto leading-relaxed">
            Where do you want to go?
          </p>
        </div>

        {/* Four zones — the core interaction */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-md animate-up">
          {zoneKeys.map((zid, i) => {
            const z = ZONES[zid];
            const count = zoneCounts[zid];
            return (
              <button
                key={zid}
                onClick={() => enterZone(zid)}
                className={`relative group rounded-2xl border-2 ${zoneColorClass[zid]} bg-bg-surface p-6 text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="text-3xl mb-3">{z.icon}</div>
                <h3 className={`font-semibold text-base ${zoneTextColor[zid]}`}>{z.label}</h3>
                <p className="text-text-muted text-xs mt-1 leading-relaxed">{z.desc}</p>

                {/* Friend count badge */}
                {count > 0 && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${zoneDotColor[zid]} animate-pulse-dot`} />
                    <span className="text-[11px] text-text-muted font-medium">{count}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom: friend activity — just presence, no feed */}
      {activeFriends.length > 0 && (
        <div className="px-4 pb-6 max-w-md mx-auto w-full animate-fade">
          <div className="border-t border-border pt-5">
            <p className="text-text-muted text-xs uppercase tracking-wide mb-3">Friends active right now</p>
            <div className="space-y-2.5">
              {activeFriends.map(f => (
                <div key={f.id} className="flex items-center gap-3 group">
                  {/* Avatar dot */}
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-bg-raised border border-border flex items-center justify-center text-xs font-semibold text-text-secondary">
                      {f.name[0]}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-bg-base ${f.currentZone ? zoneDotColor[f.currentZone] : 'bg-text-muted'}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">{f.name}</span>
                      <span className={`text-xs ${f.currentZone ? zoneTextColor[f.currentZone] : 'text-text-muted'}`}>
                        {f.currentZone ? ZONES[f.currentZone].label : ''}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted truncate">
                      {f.currentSession?.name}
                    </p>
                  </div>

                  {/* Time */}
                  <span className="text-xs text-text-muted tabular-nums">
                    {f.currentSession ? elapsed(f.currentSession.startTime) : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
