import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store';
import { ZONES } from '../types';
import type { ZoneId } from '../types';

function elapsed(start: number): string {
  const m = Math.floor((Date.now() - start) / 60000);
  if (m < 60) return `${m}m active`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm > 0 ? `${h}h ${rm}m active` : `${h}h active`;
}

function formatClock(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const DURATIONS = [
  { label: '30m', value: 30 },
  { label: '60m', value: 60 },
  { label: '90m', value: 90 },
  { label: '120m', value: 120 },
];

export default function ZoneView() {
  const { activeZone, activeSession, garden } = useStore();
  const zone = activeZone ? ZONES[activeZone] : null;
  const [justCompleted, setJustCompleted] = useState<string | null>(null);
  const prevSession = useRef(activeSession);

  useEffect(() => {
    // Detect session ending
    if (prevSession.current && !activeSession) {
      const lastPlant = garden[garden.length - 1];
      if (lastPlant) {
        setJustCompleted(lastPlant.emoji);
        setTimeout(() => setJustCompleted(null), 3000);
      }
    }
    prevSession.current = activeSession;
  }, [activeSession, garden]);

  if (!activeZone || !zone) return null;

  return (
    <div className="min-h-full flex flex-col animate-fade pb-20 md:pb-0 relative">
      {activeSession ? (
        <ActiveSessionView zoneId={activeZone} />
      ) : (
        <ZoneLobby zoneId={activeZone} />
      )}

      {/* Completion toast */}
      {justCompleted && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-down">
          <div className="flex items-center gap-3 px-5 py-3 bg-bg-raised border border-border rounded-xl shadow-lg">
            <span className="text-2xl animate-grow">{justCompleted}</span>
            <div>
              <p className="text-sm font-medium text-text-primary">Session complete!</p>
              <p className="text-xs text-text-muted">A new plant grew in your garden</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Zone Lobby: see friends, start or join ──────────────────

function ZoneLobby({ zoneId }: { zoneId: ZoneId }) {
  const { friends, startSession, joinSession, goHome } = useStore();
  const zone = ZONES[zoneId];

  const [sessionName, setSessionName] = useState('');
  const [mode, setMode] = useState<'stopwatch' | 'timer'>('stopwatch');
  const [duration, setDuration] = useState(60);
  const [showStart, setShowStart] = useState(false);

  const friendsInZone = friends.filter(f => f.currentZone === zoneId && f.currentSession);

  const handleStart = () => {
    if (!sessionName.trim()) return;
    startSession(sessionName.trim(), zoneId, mode, mode === 'timer' ? duration : undefined);
  };

  const colorMap: Record<ZoneId, { text: string; border: string; bg: string; pill: string }> = {
    gaming: { text: 'text-gaming-soft', border: 'border-gaming/30', bg: 'bg-gaming/5', pill: 'bg-gaming/10 text-gaming-soft' },
    studying: { text: 'text-studying-soft', border: 'border-studying/30', bg: 'bg-studying/5', pill: 'bg-studying/10 text-studying-soft' },
    productivity: { text: 'text-productivity-soft', border: 'border-productivity/30', bg: 'bg-productivity/5', pill: 'bg-productivity/10 text-productivity-soft' },
    misc: { text: 'text-misc-soft', border: 'border-misc/30', bg: 'bg-misc/5', pill: 'bg-misc/10 text-misc-soft' },
  };
  const c = colorMap[zoneId];

  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-8">
      {/* Zone header */}
      <div className="text-center mb-8 animate-up">
        <button onClick={goHome} className="text-text-muted text-xs hover:text-text-secondary transition-colors mb-4 inline-block">
          ← Comfort Zone
        </button>
        <div className="text-4xl mb-3">{zone.icon}</div>
        <h1 className={`text-2xl font-bold ${c.text}`}>{zone.label} Zone</h1>
        <p className="text-text-muted text-sm mt-1">{zone.desc}</p>
      </div>

      {/* Friend sessions in this zone */}
      {friendsInZone.length > 0 && (
        <div className="mb-8 animate-up" style={{ animationDelay: '100ms' }}>
          <p className="text-text-muted text-xs uppercase tracking-wide mb-3">Active sessions</p>
          <div className="space-y-2">
            {friendsInZone.map(f => (
              <div
                key={f.id}
                className={`flex items-center gap-3 p-3.5 rounded-xl border ${c.border} ${c.bg} transition-colors`}
              >
                <div className="w-9 h-9 rounded-full bg-bg-raised border border-border flex items-center justify-center text-sm font-semibold text-text-secondary">
                  {f.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{f.currentSession?.name}</p>
                  <p className="text-xs text-text-muted">{f.name} • {f.currentSession ? elapsed(f.currentSession.startTime) : ''}</p>
                </div>
                <button
                  onClick={() => joinSession(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${c.pill} hover:opacity-80 transition-opacity`}
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Start session */}
      {!showStart ? (
        <div className="animate-up" style={{ animationDelay: '200ms' }}>
          <button
            onClick={() => setShowStart(true)}
            className={`w-full py-4 rounded-xl border-2 border-dashed ${c.border} ${c.bg} ${c.text} font-medium text-sm transition-all hover:opacity-80`}
          >
            + Start your own session
          </button>
        </div>
      ) : (
        <div className={`rounded-xl border ${c.border} ${c.bg} p-5 animate-scale`}>
          <h3 className="text-sm font-semibold text-text-primary mb-4">New Session</h3>

          {/* Session name */}
          <input
            value={sessionName}
            onChange={e => setSessionName(e.target.value)}
            placeholder="What are you doing?"
            autoFocus
            className="w-full px-3.5 py-2.5 bg-bg-base border border-border rounded-lg text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-border-light transition-colors mb-4"
          />

          {/* Mode toggle */}
          <div className="flex gap-1 p-1 bg-bg-base rounded-lg mb-4">
            <button
              onClick={() => setMode('stopwatch')}
              className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors ${
                mode === 'stopwatch' ? `${c.pill}` : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Stopwatch
            </button>
            <button
              onClick={() => setMode('timer')}
              className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors ${
                mode === 'timer' ? `${c.pill}` : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Timer
            </button>
          </div>

          {/* Duration picker (only for timer) */}
          {mode === 'timer' && (
            <div className="grid grid-cols-4 gap-2 mb-4">
              {DURATIONS.map(d => (
                <button
                  key={d.value}
                  onClick={() => setDuration(d.value)}
                  className={`py-2 rounded-lg text-xs font-medium transition-all ${
                    duration === d.value
                      ? `${c.pill} ring-1 ring-current`
                      : 'bg-bg-base text-text-muted border border-border hover:border-border-light'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}

          {/* Start */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowStart(false)}
              className="px-4 py-2.5 bg-bg-base border border-border rounded-lg text-text-muted text-xs font-medium hover:text-text-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStart}
              disabled={!sessionName.trim()}
              className="flex-1 py-2.5 bg-accent hover:bg-accent-soft text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Start Session
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {friendsInZone.length === 0 && !showStart && (
        <p className="text-text-muted text-xs text-center mt-6 animate-fade">
          No friends in this zone right now. Be the first.
        </p>
      )}
    </div>
  );
}

// ── Active Session View ─────────────────────────────────────

function ActiveSessionView({ zoneId }: { zoneId: ZoneId }) {
  const { activeSession, endSession, friends } = useStore();
  const [, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const zone = ZONES[zoneId];

  const autoEnd = useCallback(() => {
    if (!activeSession) return;
    if (activeSession.mode === 'timer' && activeSession.duration) {
      const elapsedSec = Math.floor((Date.now() - activeSession.startTime) / 1000);
      if (elapsedSec >= activeSession.duration * 60) {
        endSession();
      }
    }
  }, [activeSession, endSession]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTick(t => t + 1);
      autoEnd();
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoEnd]);

  if (!activeSession) return null;

  const elapsedSec = Math.floor((Date.now() - activeSession.startTime) / 1000);
  const friendsInZone = friends.filter(f => f.currentZone === zoneId && f.currentSession);

  // For timer mode
  const totalSec = activeSession.mode === 'timer' && activeSession.duration ? activeSession.duration * 60 : 0;
  const remaining = Math.max(0, totalSec - elapsedSec);
  const progress = totalSec > 0 ? Math.min(100, (elapsedSec / totalSec) * 100) : 0;

  const displayTime = activeSession.mode === 'stopwatch' ? formatClock(elapsedSec) : formatClock(remaining);

  const colorMap: Record<ZoneId, { text: string; ring: string; bg: string; glow: string }> = {
    gaming: { text: 'text-gaming-soft', ring: 'stroke-gaming', bg: 'bg-gaming/5', glow: 'shadow-gaming/10' },
    studying: { text: 'text-studying-soft', ring: 'stroke-studying', bg: 'bg-studying/5', glow: 'shadow-studying/10' },
    productivity: { text: 'text-productivity-soft', ring: 'stroke-productivity', bg: 'bg-productivity/5', glow: 'shadow-productivity/10' },
    misc: { text: 'text-misc-soft', ring: 'stroke-misc', bg: 'bg-misc/5', glow: 'shadow-misc/10' },
  };
  const c = colorMap[zoneId];

  const circumference = 2 * Math.PI * 90;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-lg mx-auto w-full">
      {/* Zone label */}
      <div className={`text-xs font-medium uppercase tracking-wider ${c.text} mb-8 animate-fade`}>
        {zone.icon} {zone.label} Zone
      </div>

      {/* Timer circle */}
      <div className="relative w-52 h-52 mb-6 animate-scale">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          {/* Background ring */}
          <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" className="text-border" strokeWidth="3" />
          {/* Progress ring (only for timer mode) */}
          {activeSession.mode === 'timer' && (
            <circle
              cx="100" cy="100" r="90" fill="none"
              className={c.ring}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress / 100)}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          )}
          {/* Subtle pulse for stopwatch */}
          {activeSession.mode === 'stopwatch' && (
            <circle
              cx="100" cy="100" r="90" fill="none"
              className={`${c.ring} opacity-40`}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="8 12"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-3xl font-mono font-bold text-text-primary tracking-wider">
            {displayTime}
          </p>
          <p className="text-xs text-text-muted mt-1">
            {activeSession.mode === 'stopwatch' ? 'elapsed' : 'remaining'}
          </p>
        </div>
      </div>

      {/* Session name */}
      <h2 className="text-lg font-semibold text-text-primary mb-1">{activeSession.name}</h2>
      <p className="text-xs text-text-muted mb-8">
        {activeSession.mode === 'timer' ? `${activeSession.duration}m session` : 'Open session'}
      </p>

      {/* End button */}
      <button
        onClick={endSession}
        className="px-8 py-3 rounded-xl bg-bg-raised border border-border hover:border-border-light text-text-secondary hover:text-text-primary text-sm font-medium transition-all"
      >
        End Session
      </button>

      {/* Others in zone */}
      {friendsInZone.length > 0 && (
        <div className="mt-10 w-full border-t border-border pt-5 animate-fade">
          <p className="text-text-muted text-xs uppercase tracking-wide mb-3">Also in {zone.label}</p>
          <div className="space-y-2">
            {friendsInZone.map(f => (
              <div key={f.id} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-bg-raised border border-border flex items-center justify-center text-[11px] font-semibold text-text-secondary">
                  {f.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-text-primary">{f.name}</span>
                  <span className="text-text-muted text-xs ml-2">{f.currentSession?.name}</span>
                </div>
                <span className="text-xs text-text-muted tabular-nums">
                  {f.currentSession ? elapsed(f.currentSession.startTime) : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
