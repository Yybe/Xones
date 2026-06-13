export type ZoneId = 'gaming' | 'studying' | 'productivity' | 'misc';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: 'comfort' | 'in-zone';
  currentZone?: ZoneId;
  currentSession?: Session;
}

export interface Session {
  id: string;
  userId: string;
  userName: string;
  zone: ZoneId;
  name: string;
  mode: 'stopwatch' | 'timer';
  duration?: number; // minutes, only for timer mode
  startTime: number;
  endTime?: number;
  completed: boolean;
}

export interface GardenPlant {
  id: string;
  zone: ZoneId;
  emoji: string;
  label: string;
  sessionName: string;
  minutes: number;
  timestamp: number;
}

export interface FriendRequest {
  id: string;
  from: User;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: number;
}

export const ZONES: Record<ZoneId, { label: string; icon: string; color: string; colorSoft: string; bg: string; desc: string }> = {
  gaming: {
    label: 'Gaming',
    icon: '🎮',
    color: 'var(--color-gaming)',
    colorSoft: 'var(--color-gaming-soft)',
    bg: 'rgba(244, 63, 94, 0.06)',
    desc: 'Play. Compete. Unwind.',
  },
  studying: {
    label: 'Studying',
    icon: '📚',
    color: 'var(--color-studying)',
    colorSoft: 'var(--color-studying-soft)',
    bg: 'rgba(59, 130, 246, 0.06)',
    desc: 'Learn. Revise. Understand.',
  },
  productivity: {
    label: 'Productivity',
    icon: '⚡',
    color: 'var(--color-productivity)',
    colorSoft: 'var(--color-productivity-soft)',
    bg: 'rgba(16, 185, 129, 0.06)',
    desc: 'Build. Ship. Create.',
  },
  misc: {
    label: 'Miscellaneous',
    icon: '🌐',
    color: 'var(--color-misc)',
    colorSoft: 'var(--color-misc-soft)',
    bg: 'rgba(245, 158, 11, 0.06)',
    desc: 'Everything else.',
  },
};
