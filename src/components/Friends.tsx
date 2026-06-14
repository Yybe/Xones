import { useEffect, useState, useRef } from 'react';
import { useStore } from '../store';
import { ZONES } from '../types';

function elapsed(start: number): string {
  const m = Math.floor((Date.now() - start) / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm > 0 ? `${h}h ${rm}m` : `${h}h`;
}

export default function Friends() {
  const {
    friends, friendRequests,
    acceptRequest, rejectRequest,
    goHome,
    loadFriendRequests, loadFriends,
    searchUsers, searchResults, sendFriendRequest, respondToRequest,
    user,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  // Load friend data on mount
  useEffect(() => {
    if (user && user.id !== 'me') {
      loadFriendRequests();
      loadFriends();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (val: string) => {
    setSearchQuery(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (val.trim().length < 2) {
      useStore.setState({ searchResults: [] });
      return;
    }
    searchTimer.current = setTimeout(() => searchUsers(val.trim()), 300);
  };

  const handleSendRequest = async (toUserId: string) => {
    await sendFriendRequest(toUserId);
  };

  const isAuthed = user && user.id !== 'me';
  const inZone = friends.filter(f => f.status === 'in-zone');
  const idle = friends.filter(f => f.status !== 'in-zone');
  const pending = friendRequests.filter(r => r.status === 'pending');

  const zoneTextColor: Record<string, string> = {
    gaming: 'text-gaming-soft',
    studying: 'text-studying-soft',
    productivity: 'text-productivity-soft',
    misc: 'text-misc-soft',
  };

  const zoneDotColor: Record<string, string> = {
    gaming: 'bg-gaming',
    studying: 'bg-studying',
    productivity: 'bg-productivity',
    misc: 'bg-misc',
  };

  return (
    <div className="max-w-lg mx-auto w-full px-4 py-8 animate-fade">
      <button onClick={goHome} className="text-text-muted text-xs hover:text-text-secondary transition-colors mb-6 inline-block">
        ← Back
      </button>

      <h1 className="text-2xl font-bold text-text-primary mb-1">Friends</h1>
      <p className="text-text-secondary text-sm mb-6">{inZone.length} in zones • {idle.length} in comfort</p>

      {/* Search bar (only for authenticated users) */}
      {isAuthed && (
        <div className="relative mb-6">
          <input
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full px-4 py-3 bg-bg-raised border border-border rounded-xl text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-accent/50 transition-colors"
          />

          {/* Search results dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-bg-surface border border-border rounded-xl shadow-lg overflow-hidden z-20">
              {searchResults.map(r => (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-bg-hover/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-bg-raised border border-border flex items-center justify-center text-xs font-semibold text-text-secondary shrink-0">
                    {r.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{r.name}</p>
                    <p className="text-xs text-text-muted truncate">{r.email}</p>
                  </div>
                  <button
                    onClick={() => handleSendRequest(r.id)}
                    className="px-3 py-1.5 rounded-lg bg-accent/10 text-accent-soft text-xs font-medium hover:bg-accent/20 transition-colors shrink-0"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pending requests */}
      {pending.length > 0 && (
        <div className="mb-6">
          <p className="text-text-muted text-xs uppercase tracking-wide mb-3">Requests</p>
          {pending.map(r => (
            <div key={r.id} className="flex items-center gap-3 p-3 bg-bg-surface border border-border rounded-xl mb-2">
              <div className="w-9 h-9 rounded-full bg-bg-raised border border-border flex items-center justify-center text-sm font-semibold text-text-secondary">
                {r.from.name[0]}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">{r.from.name}</p>
              </div>
              <button
                onClick={() => {
                  if (isAuthed) respondToRequest(r.id, true);
                  else acceptRequest(r.id);
                }}
                className="px-3 py-1 rounded-lg bg-accent/10 text-accent-soft text-xs font-medium hover:bg-accent/20 transition-colors"
              >
                Accept
              </button>
              <button
                onClick={() => {
                  if (isAuthed) respondToRequest(r.id, false);
                  else rejectRequest(r.id);
                }}
                className="px-3 py-1 rounded-lg text-text-muted text-xs hover:text-red-400 transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* In zone */}
      {inZone.length > 0 && (
        <div className="mb-6">
          <p className="text-text-muted text-xs uppercase tracking-wide mb-3">In a zone</p>
          <div className="space-y-1.5">
            {inZone.map(f => (
              <div key={f.id} className="flex items-center gap-3 py-2.5 px-3 bg-bg-surface border border-border rounded-xl">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-bg-raised border border-border flex items-center justify-center text-sm font-semibold text-text-secondary">
                    {f.name[0]}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-bg-surface ${f.currentZone ? zoneDotColor[f.currentZone] : 'bg-text-muted'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">{f.name}</span>
                    {f.currentZone && (
                      <span className={`text-xs ${zoneTextColor[f.currentZone]}`}>
                        {ZONES[f.currentZone].icon} {ZONES[f.currentZone].label}
                      </span>
                    )}
                  </div>
                  {f.currentSession && (
                    <p className="text-xs text-text-muted truncate">{f.currentSession.name}</p>
                  )}
                </div>
                {f.currentSession && (
                  <span className="text-xs text-text-muted tabular-nums">{elapsed(f.currentSession.startTime)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* In comfort zone */}
      {idle.length > 0 && (
        <div>
          <p className="text-text-muted text-xs uppercase tracking-wide mb-3">In comfort zone</p>
          <div className="space-y-1.5">
            {idle.map(f => (
              <div key={f.id} className="flex items-center gap-3 py-2.5 px-3 bg-bg-surface border border-border rounded-xl opacity-60">
                <div className="w-9 h-9 rounded-full bg-bg-raised border border-border flex items-center justify-center text-sm font-semibold text-text-secondary">
                  {f.name[0]}
                </div>
                <span className="text-sm text-text-secondary">{f.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
