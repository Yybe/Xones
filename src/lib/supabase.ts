import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === 'your-anon-key-here') {
  console.warn(
    '[Supabase] Missing or placeholder credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env'
  );
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://ejqhxhwlbyynjelejwzh.supabase.co',
  supabaseAnonKey || 'placeholder'
);

/**
 * Get the current authenticated user, or null if not signed in.
 * Works with both email/password and OAuth sessions.
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

/**
 * Get the current Supabase session (includes user + access token).
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session;
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('[Supabase] signOut error:', error);
}

/**
 * Sign up with email + password.
 */
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { data, error };
}

/**
 * Sign in with email + password.
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

/**
 * Sign in with Google OAuth (popup).
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  return { data, error };
}

/**
 * Fetch a user's profile from the public.profiles table.
 * Returns null if not found or on error.
 */
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) return null;
  return data;
}

// ─── Session sync ────────────────────────────────────────────

/** Save a completed session to the database. */
export async function saveSession(session: {
  id: string;
  userId: string;
  zone: string;
  name: string;
  mode: string;
  duration?: number;
  startTime: number;
  endTime?: number;
  completed: boolean;
}) {
  const { error } = await supabase.from('sessions').upsert({
    id: session.id,
    user_id: session.userId,
    zone: session.zone as Database['public']['Enums']['zone_id'],
    name: session.name,
    mode: session.mode as Database['public']['Enums']['session_mode'],
    duration: session.duration ?? null,
    start_time: new Date(session.startTime).toISOString(),
    end_time: session.endTime ? new Date(session.endTime).toISOString() : null,
    completed: session.completed,
  });
  if (error) console.error('[Supabase] saveSession error:', error);
}

/** Insert a garden plant into the database. */
export async function savePlant(plant: {
  id: string;
  userId: string;
  zone: string;
  emoji: string;
  label: string;
  sessionName: string;
  minutes: number;
  timestamp: number;
}) {
  const { error } = await supabase.from('garden_plants').insert({
    id: plant.id,
    user_id: plant.userId,
    zone: plant.zone as Database['public']['Enums']['zone_id'],
    emoji: plant.emoji,
    label: plant.label,
    session_name: plant.sessionName,
    minutes: plant.minutes,
    planted_at: new Date(plant.timestamp).toISOString(),
  });
  if (error) console.error('[Supabase] savePlant error:', error);
}

/** Fetch completed sessions for a user from the database. */
export async function fetchSessions(userId: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('start_time', { ascending: false });
  if (error) {
    console.error('[Supabase] fetchSessions error:', error);
    return [];
  }
  return (data || []).map(row => ({
    id: row.id,
    userId: row.user_id,
    userName: '', // filled by caller or ignored
    zone: row.zone as string,
    name: row.name,
    mode: row.mode as string,
    duration: row.duration ?? undefined,
    startTime: new Date(row.start_time).getTime(),
    endTime: row.end_time ? new Date(row.end_time).getTime() : undefined,
    completed: row.completed,
  }));
}

/** Fetch garden plants for a user from the database. */
export async function fetchGarden(userId: string) {
  const { data, error } = await supabase
    .from('garden_plants')
    .select('*')
    .eq('user_id', userId)
    .order('planted_at', { ascending: false });
  if (error) {
    console.error('[Supabase] fetchGarden error:', error);
    return [];
  }
  return (data || []).map(row => ({
    id: row.id,
    zone: row.zone as string,
    emoji: row.emoji,
    label: row.label,
    sessionName: row.session_name,
    minutes: row.minutes,
    timestamp: new Date(row.planted_at).getTime(),
  }));
}

// ─── Friends ─────────────────────────────────────────────────

/** Search for users by name or email (ILIKE). */
export async function searchUsers(query: string) {
  if (!query.trim()) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, avatar_url, status')
    .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(10);
  if (error) {
    console.error('[Supabase] searchUsers error:', error);
    return [];
  }
  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    email: row.email || '',
    avatar: row.avatar_url || '',
    status: row.status as string,
  }));
}

/** Send a friend request. */
export async function sendFriendRequest(fromUserId: string, toUserId: string) {
  const { error } = await supabase.from('friend_requests').insert({
    from_user_id: fromUserId,
    to_user_id: toUserId,
  });
  if (error) console.error('[Supabase] sendFriendRequest error:', error);
  return { error };
}

/** Fetch pending friend requests for a user (with sender profile). */
export async function fetchFriendRequests(userId: string) {
  const { data, error } = await supabase
    .from('friend_requests')
    .select('id, from_user_id, status, created_at, profiles!friend_requests_from_user_id_fkey(id, name, email, avatar_url)')
    .eq('to_user_id', userId)
    .eq('status', 'pending');
  if (error) {
    console.error('[Supabase] fetchFriendRequests error:', error);
    return [];
  }
  return (data || []).map((row: any) => ({
    id: row.id,
    from: {
      id: row.profiles.id,
      name: row.profiles.name,
      email: row.profiles.email || '',
      avatar: row.profiles.avatar_url || '',
      status: 'comfort' as const,
    },
    status: row.status as string,
    timestamp: new Date(row.created_at).getTime(),
  }));
}

/** Accept or reject a friend request. Creates a bidirectional friendship if accepted. */
export async function respondToRequest(requestId: string, accept: boolean, userId: string, fromUserId: string) {
  const newStatus = accept ? 'accepted' : 'rejected';

  if (accept) {
    // Create bidirectional friendships in a transaction-like fashion
    const { error: reqError } = await supabase
      .from('friend_requests')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', requestId);
    if (reqError) { console.error('[Supabase] respondToRequest update error:', reqError); return { error: reqError }; }

    const { error: f1 } = await supabase.from('friendships').insert({ user_id: userId, friend_id: fromUserId }).maybeSingle();
    if (f1) { console.error('[Supabase] respondToRequest friendship1 error:', f1); return { error: f1 }; }

    const { error: f2 } = await supabase.from('friendships').insert({ user_id: fromUserId, friend_id: userId }).maybeSingle();
    if (f2) { console.error('[Supabase] respondToRequest friendship2 error:', f2); return { error: f2 }; }
  } else {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', requestId);
    if (error) { console.error('[Supabase] respondToRequest error:', error); return { error }; }
  }
  return { error: null };
}

/** Update the user's profile status and current zone in the database. */
export async function updateProfileZone(
  userId: string,
  status: string,
  currentZone: string | null
) {
  const { error } = await supabase
    .from('profiles')
    .update({ status: status as any, current_zone: currentZone as any })
    .eq('id', userId);
  if (error) console.error('[Supabase] updateProfileZone error:', error);
}

/** Fetch active sessions for a list of user IDs (sessions with end_time IS NULL). */
export async function fetchActiveSessions(userIds: string[]) {
  if (userIds.length === 0) return [];
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .in('user_id', userIds)
    .is('end_time', null);
  if (error) {
    console.error('[Supabase] fetchActiveSessions error:', error);
    return [];
  }
  return (data || []).map(row => ({
    id: row.id,
    userId: row.user_id,
    userName: '',
    zone: row.zone as string,
    name: row.name,
    mode: row.mode as string,
    duration: row.duration ?? undefined,
    startTime: new Date(row.start_time).getTime(),
  }));
}

/** Fetch a user's friends (profiles joined via friendships). */
export async function fetchFriends(userId: string) {
  const { data, error } = await supabase
    .from('friendships')
    .select('friend_id')
    .eq('user_id', userId);
  if (error) {
    console.error('[Supabase] fetchFriends error:', error);
    return [];
  }

  const friendIds = (data || []).map(r => r.friend_id);
  if (friendIds.length === 0) return [];

  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('*')
    .in('id', friendIds);
  if (pErr) {
    console.error('[Supabase] fetchFriends profiles error:', pErr);
    return [];
  }

  return (profiles || []).map(row => ({
    id: row.id,
    name: row.name,
    email: row.email || '',
    avatar: row.avatar_url || '',
    status: row.status,
    currentZone: row.current_zone,
    currentSession: undefined, // filled by caller if needed
  }));
}
