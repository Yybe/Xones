import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Session, GardenPlant, FriendRequest, ZoneId } from './types';

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

let _id = 200;
const uid = () => `id_${++_id}`;

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
  login: (name: string, email: string) => void;
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

  // Actions — Social
  addFriend: (id: string) => void;
  acceptRequest: (id: string) => void;
  rejectRequest: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      authed: false,
      user: null,
      onboarded: false,

      friends: DEMO_FRIENDS,
      friendRequests: [
        { id: 'req1', from: { id: 'f7', name: 'Karan', email: 'karan@x.app', avatar: '', status: 'comfort' }, status: 'pending', timestamp: Date.now() - 7200000 },
      ],

      view: 'comfort',
      activeZone: null,

      activeSession: null,
      history: [],

      garden: [],

      login: (name, email) => {
        set({
          authed: true,
          user: { id: 'me', name, email, avatar: '', status: 'comfort' },
        });
      },

      finishOnboarding: (name) => {
        const u = get().user;
        if (!u) return;
        set({ onboarded: true, user: { ...u, name } });
      },

      logout: () => {
        set({
          authed: false, user: null, onboarded: false,
          view: 'comfort', activeZone: null, activeSession: null,
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
      },

      endSession: () => {
        const session = get().activeSession;
        const u = get().user;
        if (!session || !u) return;

        const elapsed = Math.floor((Date.now() - session.startTime) / 60000);
        const finished: Session = { ...session, endTime: Date.now(), completed: elapsed >= 1 };

        // grow a plant if at least 1 min
        const newPlants: GardenPlant[] = [];
        if (elapsed >= 1) {
          const p = PLANTS[Math.floor(Math.random() * PLANTS.length)];
          newPlants.push({
            id: uid(), zone: session.zone,
            emoji: p.emoji, label: p.label,
            sessionName: session.name,
            minutes: elapsed,
            timestamp: Date.now(),
          });
        }

        set({
          activeSession: null,
          history: [finished, ...get().history],
          garden: [...get().garden, ...newPlants],
          user: { ...u, currentSession: undefined },
        });
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
