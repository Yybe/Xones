// ── Auto-generated TypeScript types for Xones Supabase schema ──
// Run `supabase gen types typescript --linked > src/lib/database.types.ts`
// to regenerate after schema changes.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ZoneId = 'gaming' | 'studying' | 'productivity' | 'misc';
export type SessionMode = 'stopwatch' | 'timer';
export type UserStatus = 'comfort' | 'in-zone';
export type RequestStatus = 'pending' | 'accepted' | 'rejected';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          avatar_url: string;
          status: UserStatus;
          current_zone: ZoneId | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name?: string;
          email?: string | null;
          avatar_url?: string;
          status?: UserStatus;
          current_zone?: ZoneId | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string | null;
          avatar_url?: string;
          status?: UserStatus;
          current_zone?: ZoneId | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          zone: ZoneId;
          name: string;
          mode: SessionMode;
          duration: number | null;
          start_time: string;
          end_time: string | null;
          completed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          zone: ZoneId;
          name?: string;
          mode?: SessionMode;
          duration?: number | null;
          start_time?: string;
          end_time?: string | null;
          completed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          zone?: ZoneId;
          name?: string;
          mode?: SessionMode;
          duration?: number | null;
          start_time?: string;
          end_time?: string | null;
          completed?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sessions_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      garden_plants: {
        Row: {
          id: string;
          user_id: string;
          zone: ZoneId;
          emoji: string;
          label: string;
          session_name: string;
          minutes: number;
          planted_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          zone: ZoneId;
          emoji?: string;
          label?: string;
          session_name?: string;
          minutes?: number;
          planted_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          zone?: ZoneId;
          emoji?: string;
          label?: string;
          session_name?: string;
          minutes?: number;
          planted_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'garden_plants_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      friend_requests: {
        Row: {
          id: string;
          from_user_id: string;
          to_user_id: string;
          status: RequestStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          from_user_id: string;
          to_user_id: string;
          status?: RequestStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          from_user_id?: string;
          to_user_id?: string;
          status?: RequestStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'friend_requests_from_user_id_fkey';
            columns: ['from_user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'friend_requests_to_user_id_fkey';
            columns: ['to_user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      friendships: {
        Row: {
          id: string;
          user_id: string;
          friend_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          friend_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          friend_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'friendships_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'friendships_friend_id_fkey';
            columns: ['friend_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      zone_id: ZoneId;
      session_mode: SessionMode;
      user_status: UserStatus;
      request_status: RequestStatus;
    };
  };
}
