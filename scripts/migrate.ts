import pg from 'pg';

const { Client } = pg;

const SQL = `

-- ============================================================
-- SCHEMA MIGRATION: Xones v2 — Supabase backend
-- ============================================================

-- 1. Custom ENUMs
DO $$ BEGIN
  CREATE TYPE zone_id AS ENUM ('gaming', 'studying', 'productivity', 'misc');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE session_mode AS ENUM ('stopwatch', 'timer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('comfort', 'in-zone');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL DEFAULT '',
  email       text,
  avatar_url  text DEFAULT '',
  status      user_status NOT NULL DEFAULT 'comfort',
  current_zone zone_id,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Sessions
CREATE TABLE IF NOT EXISTS public.sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  zone        zone_id NOT NULL,
  name        text NOT NULL DEFAULT '',
  mode        session_mode NOT NULL DEFAULT 'stopwatch',
  duration    int,  -- minutes, only for timer mode
  start_time  timestamptz NOT NULL DEFAULT now(),
  end_time    timestamptz,
  completed   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- 4. Garden plants
CREATE TABLE IF NOT EXISTS public.garden_plants (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  zone         zone_id NOT NULL,
  emoji        text NOT NULL DEFAULT '🌱',
  label        text NOT NULL DEFAULT 'Sprout',
  session_name text NOT NULL DEFAULT '',
  minutes      int NOT NULL DEFAULT 0,
  planted_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.garden_plants ENABLE ROW LEVEL SECURITY;

-- 5. Friend requests
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status       request_status NOT NULL DEFAULT 'pending',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT different_users CHECK (from_user_id <> to_user_id)
);
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- 6. Friendships (bi-directional)
CREATE TABLE IF NOT EXISTS public.friendships (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT different_friends CHECK (user_id <> friend_id),
  UNIQUE (user_id, friend_id)
);
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Profiles: users can read all profiles, update only their own
CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Sessions: users CRUD their own, can read friends' active sessions
CREATE POLICY "sessions_select_own"
  ON public.sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "sessions_select_friends_active"
  ON public.sessions FOR SELECT
  USING (
    completed = false
    AND user_id IN (
      SELECT friend_id FROM public.friendships WHERE user_id = auth.uid()
      UNION
      SELECT user_id FROM public.friendships WHERE friend_id = auth.uid()
    )
  );

CREATE POLICY "sessions_insert_own"
  ON public.sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "sessions_update_own"
  ON public.sessions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "sessions_delete_own"
  ON public.sessions FOR DELETE
  USING (user_id = auth.uid());

-- Garden plants: users CRUD their own
CREATE POLICY "plants_select_own"
  ON public.garden_plants FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "plants_insert_own"
  ON public.garden_plants FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "plants_update_own"
  ON public.garden_plants FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "plants_delete_own"
  ON public.garden_plants FOR DELETE
  USING (user_id = auth.uid());

-- Friend requests: involved parties can see, sender creates, receiver updates
CREATE POLICY "requests_select_involved"
  ON public.friend_requests FOR SELECT
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "requests_insert_own"
  ON public.friend_requests FOR INSERT
  WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "requests_update_as_receiver"
  ON public.friend_requests FOR UPDATE
  USING (to_user_id = auth.uid())
  WITH CHECK (to_user_id = auth.uid());

CREATE POLICY "requests_delete_own"
  ON public.friend_requests FOR DELETE
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

-- Friendships: involved parties can see and manage
CREATE POLICY "friendships_select_involved"
  ON public.friendships FOR SELECT
  USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "friendships_insert_own"
  ON public.friendships FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "friendships_delete_own"
  ON public.friendships FOR DELETE
  USING (user_id = auth.uid() OR friend_id = auth.uid());

-- ============================================================
-- HANDLE NEW USER SIGNUP (auto-create profile)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Drop trigger first to be idempotent
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

`;

async function migrate() {
  const conn = process.env.SUPABASE_DB_URL;
  if (!conn) {
    console.error('SUPABASE_DB_URL env var required');
    process.exit(1);
  }

  const client = new Client({ connectionString: conn });
  await client.connect();
  console.log('✅ Connected to database');

  try {
    await client.query(SQL);
    console.log('✅ Migration applied successfully');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
