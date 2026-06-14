import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Session, GardenPlant, FriendRequest, ZoneId } from './types';
import {
  supabase,
  getCurrentUser,
  signOut,
  signUp as sbSignUp,
  signIn as sbSignIn,
  signInWithGoogle,
  getProfile,
  saveSession,
  savePlant,
  fetchSessions,
  fetchGarden,
  searchUsers,
  sendFriendRequest,
  fetchFriendRequests,
  respondToRequest,
  fetchFriends,
  updateProfileZone,
  fetchActiveSessions,
} from './lib/supabase';

const PLANTS: Array<{ emoji: string; label: string }> = [
  { emoji: '🌱', label: 'Sprout' },
  { emoji: '🌿', label: 'Fern' },
  { emoji: '🍀', label: 'Clover' },
  { emoji: '🌳', label: 'Oak' },
  { emoji: '🌲', label: 'Evergreen' },
  { emoji: '🌻', label: 'Sunflower' },
  { emoji: '🌸', label: 'Blossom' },
  { emoji: '🌼', label: 'Daisy' },
  { emoji: '🌷', label: 'Tulip' },
  { emoji: '🪴', label: 'Potted' },
  { emoji: '🌵', label: 'Cactus' },
  { emoji: '🌴', label: 'Palm' },
  { emoji: '🎋', label: 'Bamboo' },
  { emoji: '🌾', label: 'Grain' },
  { emoji: '🍃', label: 'Leaf' },
  { emoji: '🌺', label: 'Hibiscus' },
];

// Simulated friends who are currently in zones
const DEMO_FRIENDS: User[] = [
  {
    id: 'f1', name: 'Arjun', email: 'arjun@x.app', avatar: '', status: 'in-zone',
    currentZone: 'studying',
    currentSession: { id: 'ds1', userId: 'f1', userName: 'Arjun', zone: 'studying', name: 'CNN Architecture', mode: 'stopwatch', startTime: Date.now() - 42 * 60000, completed: false },
  },
  {
    id: 'f2', name: 'Riya', email: 'riya@x.app', avatar: '', status: 'in-zone',
    currentZone: 'productivity',
    currentSession: { id: 'ds2', userId: 'f2', userName: 'Riya', zone: 'productivity', name: 'Portfolio Website', mode: 'timer', duration: 90, startTime: Date.now() - 72 * 60000, completed: false },
  },
  {
    id: 'f3', name: 'Jay', email: 'jay@x.app', avatar: '', status: 'in-zone',
    currentZone: 'gaming',
    currentSession: { id: 'ds3', userId: 'f3', userName: 'Jay', zone: 'gaming', name: 'Valorant Ranked', mode: 'stopwatch', startTime: Date.now() - 27 * 60000, completed: false },
  },
  {
    id: 'f4', name: 'Priya', email: 'priya@x.app', avatar: '', status: 'in-zone',
    currentZone: 'studying',
    currentSession: { id: 'ds4', userId: 'f4', userName: 'Priya', zone: 'studying', name: 'DBMS Revision', mode: 'timer', duration: 60, startTime: Date.now() - 58 * 60000, completed: false },
  },
  {
    id: 'f5', name: 'Vikram', email: 'vikram@x.app', avatar: '', status: 'comfort',
  },
  {
    id: 'f6', name: 'Sneha', email: 'sneha@x.app', avatar: '', status: 'in-zone',
    currentZone: 'misc',
    currentSession: { id: 'ds5', userId: 'f6', userName: 'Sneha', zone: 'misc', name: 'Journal Writing', mode: 'stopwatch', startTime: Date.now() - 15 * 60000, completed: false },
  },
];

const uid = () => crypto.randomUUID();

interface AppState {
  // Auth
  authed: boolean;
  user: User | null;
  onboarded: boolean;

  // Social
  friends: User[];
  friendRequests: FriendRequest[];

  // Navigation
  view: 'comfort' | 'zone' | 'garden' | 'profile' | 'friends';
  activeZone: ZoneId | null;

  // Session
  activeSession: Session | null;
  history: Session[];

  // Garden
  garden: GardenPlant[];

  // Actions — Auth
  supabaseReady: boolean;
  authLoading: boolean;
  authError: string | null;
  initAuth: () => Promise<void>;
  demoLogin: (name: string, email: string) => void;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  setAuthError: (err: string | null) => void;
  setToast: (t: { message: string; type: 'success' | 'error' } | null) => void;
  finishOnboarding: (name: string) => void;
  logout: () => void;

  // Actions — Navigation
  goHome: () => void;
  enterZone: (zone: ZoneId) => void;
  setView: (v: AppState['view']) => void;

  // Actions — Session
  startSession: (name: string, zone: ZoneId, mode: 'stopwatch' | 'timer', duration?: number) => void;
  endSession: () => void;
  joinSession: (friendId: string) => void;

  searchResults: User[];
  toast: { message: string; type: 'success' | 'error' } | null;

  // Actions — Social
  addFriend: (id: string) => void;
  acceptRequest: (id: string) => void;
  rejectRequest: (id: string) => void;
  loadFriendRequests: () => Promise<void>;
  loadFriends: () => Promise<void>;
  searchUsers: (query: string) => Promise<void>;
  sendFriendRequest: (toUserId: string) => Promise<void>;
  respondToRequest: (id: string, accept: boolean) => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      authed: false,
      user: null,
      onboarded: false,
      supabaseReady: false,
      authLoading: false,
      authError: null,

      friends: DEMO_FRIENDS,
      friendRequests: [
        { id: 'req1', from: { id: 'f7', name: 'Karan', email: 'karan@x.app', avatar: '', status: 'comfort' }, status: 'pending', timestamp: Date.now() - 7200000 },
      ],

      view: 'comfort',
      activeZone: null,

      activeSession: null,
      history: [],

      garden: [],

      searchResults: [],
      toast: null,

      initAuth: async () => {
        set({ authLoading: true });
        try {
          const sbUser = await getCurrentUser();
          if (sbUser) {
            const [profile, dbSessions, dbGarden] = await Promise.all([
              getProfile(sbUser.id),
              fetchSessions(sbUser.id),
              fetchGarden(sbUser.id),
            ]);
            set({
              authed: true,
              user: {
                id: sbUser.id,
                name: profile?.name || sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'User',
                email: sbUser.email || '',
                avatar: profile?.avatar_url || sbUser.user_metadata?.avatar_url || '',
                status: (profile?.status as 'comfort' | 'in-zone') || 'comfort',
              },
              onboarded: true,
              supabaseReady: true,
              authLoading: false,
              history: dbSessions,
              garden: dbGarden,
              friendRequests: [],
            });
            return;
          }
        } catch {
          // Supabase not configured yet — fall through to local mode
        }
        set({ supabaseReady: true, authLoading: false });
      },

      demoLogin: (name, email) => {
        set({
          authed: true,
          user: { id: 'me', name, email, avatar: '', status: 'comfort' },
        });
      },

      signUp: async (email, password) => {
        set({ authLoading: true, authError: null });
        const { data, error } = await sbSignUp(email, password);
        if (error) {
          set({ authLoading: false, authError: error.message });
          return;
        }
        if (data?.user) {
          set({
            authed: true,
            user: {
              id: data.user.id,
              name: data.user.email?.split('@')[0] || 'User',
              email: data.user.email || '',
              avatar: '',
              status: 'comfort',
            },
            onboarded: true,
            supabaseReady: true,
            authLoading: false,
            authError: null,
          });
        } else {
          // Email confirmation required
          set({ authLoading: false, authError: 'Check your email for a confirmation link.' });
        }
      },

      signIn: async (email, password) => {
        set({ authLoading: true, authError: null });
        const { data, error } = await sbSignIn(email, password);
        if (error) {
          set({ authLoading: false, authError: error.message });
          return;
        }
        if (data?.user) {
          const profile = await getProfile(data.user.id);
          set({
            authed: true,
            user: {
              id: data.user.id,
              name: profile?.name || data.user.email?.split('@')[0] || 'User',
              email: data.user.email || '',
              avatar: profile?.avatar_url || '',
              status: (profile?.status as 'comfort' | 'in-zone') || 'comfort',
            },
            onboarded: true,
            supabaseReady: true,
            authLoading: false,
            authError: null,
          });
        }
      },

      signInWithGoogle: async () => {
        set({ authLoading: true, authError: null });
        const { error } = await signInWithGoogle();
        if (error) {
          set({ authLoading: false, authError: error.message });
        }
        // On OAuth success, the page redirects so state is set by initAuth on return
      },

      setAuthError: (err) => set({ authError: err }),

      setToast: (t) => set({ toast: t }),

      finishOnboarding: (name) => {
        const u = get().user;
        if (!u) return;
        set({ onboarded: true, user: { ...u, name } });
      },

      logout: () => {
        signOut();
        set({
          authed: false, user: null, onboarded: false,
          view: 'comfort', activeZone: null, activeSession: null,
          authError: null,
        });
      },

      goHome: () => {
        const session = get().activeSession;
        if (session) {
          // If in session, go back to zone view (can't leave)
          set({ view: 'zone' });
          return;
        }
        set({ view: 'comfort', activeZone: null, user: { ...get().user!, status: 'comfort', currentZone: undefined, currentSession: undefined } });
      },

      enterZone: (zone) => {
        set({
          view: 'zone',
          activeZone: zone,
          user: { ...get().user!, status: 'in-zone', currentZone: zone },
        });
      },

      setView: (v) => set({ view: v }),

      startSession: (name, zone, mode, duration) => {
        const u = get().user;
        if (!u) return;
        const session: Session = {
          id: uid(), userId: 'me', userName: u.name,
          zone, name, mode, duration,
          startTime: Date.now(), completed: false,
        };
        set({
          activeSession: session,
          user: { ...u, status: 'in-zone', currentZone: zone, currentSession: session },
          view: 'zone',
          activeZone: zone,
        });
        // Sync to Supabase for friend presence
        if (u.id !== 'me') {
          updateProfileZone(u.id, 'in-zone', zone);
          saveSession({
            id: session.id,
            userId: u.id,
            zone: session.zone,
            name: session.name,
            mode: session.mode,
            duration: session.duration,
            startTime: session.startTime,
            completed: false,
          });
        }
      },

      endSession: () => {
        const session = get().activeSession;
        const u = get().user;
        if (!session || !u) return;

        const elapsedSec = Math.floor((Date.now() - session.startTime) / 1000);
        const finished: Session = { ...session, endTime: Date.now(), completed: true };

        // grow a plant if at least 3 seconds
        const newPlants: GardenPlant[] = [];
        if (elapsedSec >= 3) {
          const p = PLANTS[Math.floor(Math.random() * PLANTS.length)];
          newPlants.push({
            id: uid(), zone: session.zone,
            emoji: p.emoji, label: p.label,
            sessionName: session.name,
            minutes: Math.max(1, Math.ceil(elapsedSec / 60)),
            timestamp: Date.now(),
          });
        }

        set({
          activeSession: null,
          history: [finished, ...get().history],
          garden: [...get().garden, ...newPlants],
          user: { ...u, currentSession: undefined },
        });

        // Persist to Supabase if authenticated (has a real UUID, not 'me')
        if (u.id !== 'me') {
          updateProfileZone(u.id, 'comfort', null);
          saveSession({
            id: finished.id,
            userId: u.id,
            zone: finished.zone,
            name: finished.name,
            mode: finished.mode,
            duration: finished.duration,
            startTime: finished.startTime,
            endTime: finished.endTime!,
            completed: finished.completed,
          });
          newPlants.forEach(plant => {
            savePlant({
              id: plant.id,
              userId: u.id,
              zone: plant.zone,
              emoji: plant.emoji,
              label: plant.label,
              sessionName: plant.sessionName,
              minutes: plant.minutes,
              timestamp: plant.timestamp,
            });
          });
        }
      },

      joinSession: (friendId) => {
        const friend = get().friends.find(f => f.id === friendId);
        if (!friend?.currentSession || !friend.currentZone) return;
        const u = get().user;
        if (!u) return;

        const session: Session = {
          id: uid(), userId: 'me', userName: u.name,
          zone: friend.currentZone,
          name: friend.currentSession.name,
          mode: 'stopwatch',
          startTime: Date.now(), completed: false,
        };

        set({
          activeSession: session,
          activeZone: friend.currentZone,
          view: 'zone',
          user: { ...u, status: 'in-zone', currentZone: friend.currentZone, currentSession: session },
        });
      },

      addFriend: () => {},
      acceptRequest: (id) => {
        const reqs = get().friendRequests;
        const req = reqs.find(r => r.id === id);
        if (!req) return;
        set({
          friendRequests: reqs.filter(r => r.id !== id),
          friends: [...get().friends, { ...req.from, status: 'comfort' }],
        });
      },
      rejectRequest: (id) => {
        set({ friendRequests: get().friendRequests.filter(r => r.id !== id) });
      },

      loadFriendRequests: async () => {
        const u = get().user;
        if (!u || u.id === 'me') return;
        const requests = await fetchFriendRequests(u.id);
        set({ friendRequests: requests });
      },

      loadFriends: async () => {
        const u = get().user;
        if (!u || u.id === 'me') return;
        const dbFriends = await fetchFriends(u.id);
        if (dbFriends.length === 0) { set({ friends: DEMO_FRIENDS }); return; }
        // Fetch active sessions for all friends
        const friendIds = dbFriends.map(f => f.id);
        const activeSessions = await fetchActiveSessions(friendIds);
        const enriched = dbFriends.map(f => {
          const session = activeSessions.find(s => s.userId === f.id);
          return { ...f, currentSession: session || undefined };
        });
        set({ friends: enriched });
      },

      searchUsers: async (query) => {
        const u = get().user;
        const results = await searchUsers(query);
        // Exclude current user from search results
        const filtered = u ? results.filter(r => r.id !== u.id) : results;
        set({ searchResults: filtered as any });
      },

      sendFriendRequest: async (toUserId) => {
        const u = get().user;
        if (!u || u.id === 'me') return;
        await sendFriendRequest(u.id, toUserId);
        set({ searchResults: [], toast: { message: 'Friend request sent!', type: 'success' } });
      },

      respondToRequest: async (id, accept) => {
        const u = get().user;
        if (!u || u.id === 'me') {
          // Fall back to existing mock behavior
          if (accept) get().acceptRequest(id);
          else get().rejectRequest(id);
          return;
        }
        const req = get().friendRequests.find(r => r.id === id);
        if (!req) return;
        await respondToRequest(id, accept, u.id, req.from.id);
        // Reload friends and requests
        await get().loadFriendRequests();
        if (accept) await get().loadFriends();
      },
    }),
    {
      name: 'xones-v2',
      partialize: (state) => ({
        authed: state.authed,
        user: state.user,
        onboarded: state.onboarded,
        history: state.history,
        garden: state.garden,
      }),
    }
  )
);
